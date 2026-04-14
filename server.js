import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  const envLines = fs.readFileSync(envFile, 'utf8').split(/\r?\n/);
  envLines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    const rawValue = trimmed.slice(eqIndex + 1).trim();
    const unquoted = rawValue.replace(/^['"]|['"]$/g, '');
    if (key && !Object.prototype.hasOwnProperty.call(process.env, key)) process.env[key] = unquoted;
  });
}

const app = express();
const PORT = Number(process.env.PORT || 8080);
const JWT_SECRET = process.env.JWT_SECRET || 'procrm-dev-secret';
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@yourdomain.com';
const SMTP_FROM = process.env.SMTP_FROM || '';
const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

const emailTransporter = (SMTP_HOST && SMTP_FROM)
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
    })
  : null;

const verificationStore = new Map();

function isConfiguredValue(value, { placeholders = [], disallowLocalhost = false } = {}) {
  const normalized = String(value || '').trim();
  if (!normalized) return false;
  const lower = normalized.toLowerCase();
  if (placeholders.some(entry => lower === String(entry).toLowerCase())) return false;
  if (disallowLocalhost && (lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('yourdomain.com'))) return false;
  return true;
}

const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'procrm.sqlite'));

const workspaceDefaults = {
  companyName: 'My Company',
  industry: '',
  businessCategory: 'window-cleaning',
  customCategory: '',
  businessEmail: 'admin@procrm.local',
  primaryAdmin: 'Admin',
  timezone: 'America/New_York',
  plan: 'free',
  onboarded: false,
  employeeJoinCode: '',
  expectedTeamSize: 1,
  notificationPrefs: {
    employeePush: true,
    dailyDigest: false,
    leadAlerts: true,
    payrollAlerts: true,
    browserAlerts: false
  },
  scheduling: {
    bufferMinutes: 15,
    bookingWindowDays: 45,
    defaultDuration: 60,
    autoConfirm: false,
    editLockHours: 12,
    maxJobsPerTechPerDay: 6,
    roundRobinRouting: false
  },
  security: {
    inviteOnlyAccess: false,
    requireStrongPasswords: true,
    allowPasswordReset: true,
    sessionTimeoutHours: 8,
    managerDeleteApproval: true,
    defaultNewHireRole: 'technician'
  },
  management: {
    monthlyRevenueTarget: 25000,
    approvalRequiredOver: 1500,
    requireCompletionNotes: true,
    allowEmployeeSelfAssign: false,
    advancedDispatchBoard: true
  },
  growth: {
    affiliateEnabled: true,
    affiliateCode: 'PROCRM15',
    affiliateSignupCode: 'AFFILIATE',
    affiliateSignupEnabled: true,
    affiliateCommissionPct: 15,
    affiliateCookieDays: 30,
    affiliateMinPayout: 50,
    affiliatePayoutEmail: SUPPORT_EMAIL,
    affiliatePayoutMethod: 'venmo',
    affiliateVenmoHandle: '',
    affiliateTermsUrl: `${APP_BASE_URL}/affiliate-terms`,
    inviteDiscountPct: 10,
    inviteFreeMonths: 1,
    affiliates: [],
    invites: [],
    affiliateEvents: [],
    payoutHistory: []
  },
  serviceCatalog: [
    { id: 1, mainService: 'Window Cleaning', subServices: ['Exterior', 'Interior'] },
    { id: 2, mainService: 'Roof Cleaning', subServices: ['Soft Wash', 'Moss Removal'] }
  ]
};

function legacyHash(password) {
  return Buffer.from(String(password || ''), 'utf8').toString('base64');
}

function ensureTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      employee_id INTEGER,
      status TEXT NOT NULL DEFAULT 'active',
      name TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspace (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      legacy_id INTEGER UNIQUE,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      company TEXT,
      status TEXT,
      notes TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      legacy_id INTEGER UNIQUE,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      role TEXT,
      status TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      channel_type TEXT DEFAULT 'public',
      owner_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS channel_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at TEXT NOT NULL,
      UNIQUE(channel_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function seedDefaults() {
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (!userCount) {
    db.prepare(`
      INSERT INTO users (email, password_hash, role, employee_id, status, name, created_at)
      VALUES (?, ?, 'admin', NULL, 'active', 'Admin', ?)
    `).run('admin@procrm.local', legacyHash('Admin@12345'), new Date().toISOString());
  }

  const workspaceRow = db.prepare('SELECT json FROM workspace WHERE id = 1').get();
  if (!workspaceRow) {
    db.prepare('INSERT INTO workspace (id, json, updated_at) VALUES (1, ?, ?)').run(JSON.stringify(workspaceDefaults), new Date().toISOString());
  }
  const normalizedWorkspace = getWorkspace();
  if (!workspaceRow || JSON.stringify(normalizedWorkspace) !== workspaceRow.json) {
    saveWorkspace(normalizedWorkspace);
  }

  const sampleEmployee = db.prepare('SELECT id FROM users WHERE email = ?').get('employee.test@fieldflowcrm.local');
  if (!sampleEmployee) {
    const now = new Date().toISOString();
    const legacyEmployeeId = 9001;
    db.prepare(`
      INSERT INTO employees (legacy_id, first_name, last_name, email, phone, role, status, created_at)
      VALUES (?, ?, ?, ?, '', ?, 'active', ?)
      ON CONFLICT(legacy_id) DO UPDATE SET
        first_name = excluded.first_name,
        last_name = excluded.last_name,
        email = excluded.email,
        role = excluded.role,
        status = excluded.status
    `).run(legacyEmployeeId, 'Test', 'Employee', 'employee.test@fieldflowcrm.local', 'technician', now);

    db.prepare(`
      INSERT INTO users (email, password_hash, role, employee_id, status, name, created_at)
      VALUES (?, ?, 'technician', ?, 'active', ?, ?)
    `).run('employee.test@fieldflowcrm.local', legacyHash('Employee@12345'), legacyEmployeeId, 'Test Employee', now);
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email || ''));
}

function verificationKey(email, purpose) {
  return `${String(purpose || 'signup').toLowerCase()}:${normalizeEmail(email)}`;
}

function createVerificationCode() {
  return String(Math.floor(100000 + (Math.random() * 900000)));
}

async function sendVerificationEmail(email, code) {
  if (!emailTransporter) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email delivery is not configured. Set SMTP_HOST and SMTP_FROM.');
    }
    return false;
  }

  await emailTransporter.sendMail({
    from: SMTP_FROM,
    to: email,
    subject: 'Your Service Mafia verification code',
    text: `Your Service Mafia verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your Service Mafia verification code is:</p><p style="font-size:24px;font-weight:700;letter-spacing:2px;">${code}</p><p>This code expires in 10 minutes.</p>`
  });
  return true;
}

function hasVerifiedEmail(email, purpose) {
  const key = verificationKey(email, purpose);
  const record = verificationStore.get(key);
  if (!record || !record.verifiedAt || record.consumedAt) return false;
  if (record.expiresAt < Date.now()) return false;
  return true;
}

function consumeVerifiedEmail(email, purpose) {
  const key = verificationKey(email, purpose);
  const record = verificationStore.get(key);
  if (!record) return;
  record.consumedAt = Date.now();
  verificationStore.set(key, record);
}

function getWorkspace() {
  const row = db.prepare('SELECT json FROM workspace WHERE id = 1').get();
  if (!row) return structuredClone(workspaceDefaults);
  try {
    const parsed = JSON.parse(row.json);
    return {
      ...workspaceDefaults,
      ...parsed,
      notificationPrefs: { ...workspaceDefaults.notificationPrefs, ...(parsed.notificationPrefs || {}) },
      scheduling: { ...workspaceDefaults.scheduling, ...(parsed.scheduling || {}) },
      security: { ...workspaceDefaults.security, ...(parsed.security || {}) },
      management: { ...workspaceDefaults.management, ...(parsed.management || {}) },
      growth: {
        ...workspaceDefaults.growth,
        ...(parsed.growth || {}),
        affiliates: Array.isArray(parsed.growth?.affiliates) ? parsed.growth.affiliates : [],
        invites: Array.isArray(parsed.growth?.invites) ? parsed.growth.invites : [],
        affiliateEvents: Array.isArray(parsed.growth?.affiliateEvents) ? parsed.growth.affiliateEvents : [],
        payoutHistory: Array.isArray(parsed.growth?.payoutHistory) ? parsed.growth.payoutHistory : []
      },
      serviceCatalog: Array.isArray(parsed.serviceCatalog) ? parsed.serviceCatalog : workspaceDefaults.serviceCatalog
    };
  } catch {
    return structuredClone(workspaceDefaults);
  }
}

function saveWorkspace(workspace) {
  db.prepare(`
    INSERT INTO workspace (id, json, updated_at)
    VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET json = excluded.json, updated_at = excluded.updated_at
  `).run(JSON.stringify(workspace), new Date().toISOString());
}

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employee_id,
    name: user.name,
    status: user.status
  };
}

async function verifyPassword(user, password) {
  if (!user) return false;
  if (String(user.password_hash || '').startsWith('$2')) {
    return bcrypt.compare(password, user.password_hash);
  }

  const matched = user.password_hash === legacyHash(password);
  if (matched) {
    const upgraded = await bcrypt.hash(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(upgraded, user.id);
  }
  return matched;
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: 'Missing auth token.' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId);
    if (!user || user.status === 'inactive') {
      res.status(401).json({ error: 'Session is no longer valid.' });
      return;
    }
    req.user = serializeUser(user);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid auth token.' });
  }
}

function adminRequired(req, res, next) {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  next();
}

function upsertClient(client) {
  if (!client || client.id == null) return;
  db.prepare(`
    INSERT INTO clients (legacy_id, first_name, last_name, email, phone, company, status, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(legacy_id) DO UPDATE SET
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      email = excluded.email,
      phone = excluded.phone,
      company = excluded.company,
      status = excluded.status,
      notes = excluded.notes,
      created_at = excluded.created_at
  `).run(
    Number(client.id),
    client.firstName || '',
    client.lastName || '',
    client.email || '',
    client.phone || '',
    client.company || '',
    client.status || 'active',
    client.notes || '',
    client.createdAt || new Date().toISOString()
  );
}

function upsertEmployee(employee) {
  if (!employee || employee.id == null) return;
  db.prepare(`
    INSERT INTO employees (legacy_id, first_name, last_name, email, phone, role, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(legacy_id) DO UPDATE SET
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      email = excluded.email,
      phone = excluded.phone,
      role = excluded.role,
      status = excluded.status,
      created_at = excluded.created_at
  `).run(
    Number(employee.id),
    employee.firstName || '',
    employee.lastName || '',
    employee.email || '',
    employee.phone || '',
    employee.role || 'technician',
    employee.status || 'active',
    employee.createdAt || new Date().toISOString()
  );
}

function upsertUser(user) {
  if (!user?.email) return;
  db.prepare(`
    INSERT INTO users (email, password_hash, role, employee_id, status, name, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      password_hash = excluded.password_hash,
      role = excluded.role,
      employee_id = excluded.employee_id,
      status = excluded.status,
      name = excluded.name
  `).run(
    normalizeEmail(user.email),
    user.passwordHash || legacyHash('password123'),
    user.role || 'salesman',
    user.employeeId || null,
    user.status || 'active',
    user.name || 'User',
    user.createdAt || new Date().toISOString()
  );
}

function listContacts() {
  const clients = db.prepare('SELECT legacy_id AS id, first_name, last_name, email, phone, company, status FROM clients ORDER BY first_name, last_name').all().map(client => ({
    type: 'client',
    id: client.id,
    name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.company || 'Client',
    email: client.email,
    phone: client.phone,
    status: client.status || 'active'
  }));
  const employees = db.prepare('SELECT legacy_id AS id, first_name, last_name, email, phone, role, status FROM employees ORDER BY first_name, last_name').all().map(employee => ({
    type: 'employee',
    id: employee.id,
    name: `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Employee',
    email: employee.email,
    phone: employee.phone,
    role: employee.role,
    status: employee.status || 'active'
  }));
  return { clients, employees };
}

ensureTables();
seedDefaults();

app.use(express.json({ limit: '2mb' }));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});
app.use(express.static(__dirname));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, runtime: 'node', database: 'sqlite' });
});

app.get('/affiliate-terms', (_req, res) => {
  res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Service Mafia Affiliate Terms</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 840px; margin: 40px auto; padding: 0 20px; color: #111827; line-height: 1.6; }
    h1, h2 { color: #0f172a; }
    .note { padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }
  </style>
</head>
<body>
  <h1>Affiliate Program Terms</h1>
  <p>These terms govern participation in the Service Mafia affiliate program.</p>
  <h2>Commission</h2>
  <p>Affiliates earn the configured commission percentage on tracked referred sales accepted by the workspace owner.</p>
  <h2>Payouts</h2>
  <p>Payouts are issued after the configured minimum payout threshold is reached and approved by the workspace owner.</p>
  <h2>Program Rules</h2>
  <p>Fraudulent, self-referred, or abusive referrals may be voided and removed from payout eligibility.</p>
  <div class="note">
    <strong>Support:</strong> ${SUPPORT_EMAIL}
  </div>
</body>
</html>`);
});

app.get('/api/launch-readiness', (_req, res) => {
  const workspace = getWorkspace();
  const affiliates = Array.isArray(workspace.growth?.affiliates) ? workspace.growth.affiliates : [];
  const affiliateSignupReady = Boolean(
    workspace.growth?.affiliateEnabled
    && workspace.growth?.affiliateSignupEnabled !== false
    && String(workspace.growth?.affiliateSignupCode || '').trim()
  );
  const baseUrlConfigured = isConfiguredValue(APP_BASE_URL, { disallowLocalhost: true });
  const jwtConfigured = isConfiguredValue(process.env.JWT_SECRET, {
    placeholders: ['procrm-dev-secret', 'replace_with_secure_random_secret']
  });
  const supportEmailConfigured = isConfiguredValue(SUPPORT_EMAIL, {
    placeholders: ['support@yourdomain.com']
  });
  const smtpSenderConfigured = isConfiguredValue(SMTP_FROM, {
    placeholders: ['procrm <no-reply@yourdomain.com>', 'service mafia <no-reply@yourdomain.com>']
  });
  const smtpTransportConfigured = isConfiguredValue(SMTP_HOST) && smtpSenderConfigured;
  const stripeConfigured = isConfiguredValue(STRIPE_SECRET_KEY, {
    placeholders: ['sk_live_xxx', 'sk_test_xxx']
  });
  const checks = [
    { key: 'app_base_url', ok: baseUrlConfigured, detail: baseUrlConfigured ? APP_BASE_URL : 'Set APP_BASE_URL to your real HTTPS production domain.' },
    { key: 'jwt_secret_configured', ok: jwtConfigured, detail: jwtConfigured ? 'Configured' : 'Set a non-placeholder JWT_SECRET in production.' },
    { key: 'smtp_sender_configured', ok: smtpSenderConfigured, detail: smtpSenderConfigured ? SMTP_FROM : 'Set SMTP_FROM to a real sender address.' },
    { key: 'smtp_transport_configured', ok: smtpTransportConfigured, detail: smtpTransportConfigured ? `${SMTP_HOST}:${SMTP_PORT}` : 'Set SMTP_HOST/SMTP_PORT and credentials for email delivery.' },
    { key: 'support_email_configured', ok: supportEmailConfigured, detail: supportEmailConfigured ? SUPPORT_EMAIL : 'Set SUPPORT_EMAIL to your real support inbox.' },
    { key: 'affiliate_enabled', ok: Boolean(workspace.growth?.affiliateEnabled), detail: 'Affiliate program toggle' },
    { key: 'affiliate_terms_url', ok: Boolean(workspace.growth?.affiliateTermsUrl), detail: workspace.growth?.affiliateTermsUrl || 'Add affiliate terms URL.' },
    { key: 'affiliate_signup_ready', ok: affiliateSignupReady, detail: affiliateSignupReady ? `Signup code ${workspace.growth.affiliateSignupCode} is active.` : 'Enable affiliate signup flow.' },
    { key: 'stripe_key_configured', ok: stripeConfigured, detail: stripeConfigured ? 'Configured' : 'Set the real Stripe secret key before launch.' }
  ];
  res.json({ ok: true, checks });
});

app.post('/api/migrate/local', (req, res) => {
  const { workspace, users = [], clients = [], employees = [] } = req.body || {};
  if (workspace && typeof workspace === 'object') saveWorkspace({ ...getWorkspace(), ...workspace });
  users.forEach(upsertUser);
  clients.forEach(upsertClient);
  employees.forEach(upsertEmployee);
  res.json({ ok: true, counts: { users: users.length, clients: clients.length, employees: employees.length } });
});

app.post('/api/auth/send-verification-code', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const purpose = String(req.body?.purpose || 'signup').toLowerCase();
  if (!email || !isValidEmail(email)) {
    res.status(400).json({ error: 'Enter a valid email address.' });
    return;
  }

  const code = createVerificationCode();
  const key = verificationKey(email, purpose);
  const now = Date.now();
  const expiresAt = now + (10 * 60 * 1000);
  verificationStore.set(key, {
    codeHash: crypto.createHash('sha256').update(code).digest('hex'),
    attempts: 0,
    verifiedAt: null,
    createdAt: now,
    expiresAt,
    consumedAt: null
  });

  try {
    const sent = await sendVerificationEmail(email, code);
    const payload = { ok: true, expiresInMinutes: 10 };
    if (!sent && process.env.NODE_ENV !== 'production') payload.devCode = code;
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to send verification email.' });
  }
});

app.post('/api/auth/verify-email-code', (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const purpose = String(req.body?.purpose || 'signup').toLowerCase();
  const code = String(req.body?.code || '').trim();
  if (!email || !code) {
    res.status(400).json({ error: 'Email and verification code are required.' });
    return;
  }

  const key = verificationKey(email, purpose);
  const record = verificationStore.get(key);
  if (!record) {
    res.status(400).json({ error: 'Request a verification code first.' });
    return;
  }
  if (record.expiresAt < Date.now()) {
    verificationStore.delete(key);
    res.status(400).json({ error: 'Verification code expired. Request a new one.' });
    return;
  }
  if (record.attempts >= 6) {
    verificationStore.delete(key);
    res.status(429).json({ error: 'Too many attempts. Request a new verification code.' });
    return;
  }

  const incomingHash = crypto.createHash('sha256').update(code).digest('hex');
  if (incomingHash !== record.codeHash) {
    record.attempts += 1;
    verificationStore.set(key, record);
    res.status(400).json({ error: 'Verification code is invalid.' });
    return;
  }

  record.verifiedAt = Date.now();
  verificationStore.set(key, record);
  res.json({ ok: true, verified: true });
});

app.post('/api/auth/login', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');
  const rememberMe = Boolean(req.body?.rememberMe);
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || user.status === 'inactive') {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const valid = await verifyPassword(user, password);
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const session = serializeUser(user);
  const workspace = getWorkspace();
  const sessionHours = Math.max(1, Number(workspace.security?.sessionTimeoutHours || 12));
  const expiresIn = rememberMe ? '30d' : `${sessionHours}h`;
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn });
  res.json({ ok: true, token, session, workspace: getWorkspace() });
});

app.get('/api/auth/session', authRequired, (req, res) => {
  res.json({ ok: true, session: req.user, workspace: getWorkspace() });
});

app.post('/api/auth/reset-password', (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const workspace = getWorkspace();
  if (!workspace.security.allowPasswordReset) {
    res.status(403).json({ error: 'Password reset is disabled for this workspace.' });
    return;
  }
  const user = db.prepare('SELECT id FROM users WHERE email = ? AND status != ?').get(email, 'inactive');
  if (!user) {
    res.status(404).json({ error: 'No account found for that email.' });
    return;
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(legacyHash('password123'), user.id);
  res.json({ ok: true, temporaryPassword: 'password123' });
});

app.post('/api/auth/owner-signup', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const ownerName = String(req.body?.ownerName || '').trim();
  const password = String(req.body?.password || '');
  const promoCode = String(req.body?.promoCode || '').trim().toUpperCase();
  const incomingWorkspace = req.body?.workspace;
  const workspace = getWorkspace();

  if (!email || !ownerName || password.length < 8) {
    res.status(400).json({ error: 'Owner email, name, and an 8-character password are required.' });
    return;
  }
  if (!hasVerifiedEmail(email, 'owner-signup')) {
    res.status(403).json({ error: 'Email verification is required before signup.' });
    return;
  }

  const taken = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  const adminUser = db.prepare('SELECT * FROM users WHERE role = ? ORDER BY id ASC LIMIT 1').get('admin');
  if (taken && (!adminUser || taken.id !== adminUser.id)) {
    res.status(409).json({ error: 'An account with that email already exists.' });
    return;
  }
  if (!adminUser) {
    res.status(500).json({ error: 'Admin account unavailable for owner setup.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  db.prepare('UPDATE users SET email = ?, password_hash = ?, name = ?, status = ? WHERE id = ?').run(
    email,
    passwordHash,
    ownerName,
    'active',
    adminUser.id
  );

  const mergedWorkspace = {
    ...workspace,
    ...(incomingWorkspace && typeof incomingWorkspace === 'object' ? incomingWorkspace : {}),
    businessEmail: email,
    primaryAdmin: ownerName,
    onboarded: true
  };

  if (promoCode) {
    const affiliates = Array.isArray(mergedWorkspace.growth?.affiliates) ? mergedWorkspace.growth.affiliates : [];
    const matchedAffiliate = affiliates.find(affiliate => String(affiliate.code || '').toUpperCase() === promoCode && affiliate.status !== 'inactive');
    if (matchedAffiliate) {
      matchedAffiliate.conversions = Number(matchedAffiliate.conversions || 0) + 1;
      mergedWorkspace.growth.affiliateEvents = mergedWorkspace.growth.affiliateEvents || [];
      mergedWorkspace.growth.affiliateEvents.push({
        id: Date.now(),
        type: 'owner_signup_referral',
        affiliateEmail: matchedAffiliate.email,
        amount: 0,
        createdAt: new Date().toISOString(),
        details: `${ownerName} signed up using promo code ${promoCode}.`
      });
    }
  }
  saveWorkspace(mergedWorkspace);
  consumeVerifiedEmail(email, 'owner-signup');

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(adminUser.id);
  const session = serializeUser(updatedUser);
  const sessionHours = Math.max(1, Number(mergedWorkspace.security?.sessionTimeoutHours || 12));
  const token = jwt.sign({ userId: updatedUser.id, role: updatedUser.role }, JWT_SECRET, { expiresIn: `${sessionHours}h` });
  res.json({ ok: true, token, session, workspace: getWorkspace() });
});

app.get('/api/workspace', (_req, res) => {
  res.json({ ok: true, workspace: getWorkspace() });
});

app.post('/api/auth/employee-signup', async (req, res) => {
  const { firstName, lastName, email, password, role, joinCode } = req.body || {};
  if (!firstName || !lastName || !email || !password) {
    res.status(400).json({ error: 'First name, last name, email, and password are required.' });
    return;
  }

  const workspace = getWorkspace();
  const validCode = String(workspace.employeeJoinCode || '').toUpperCase();
  const incomingCode = String(joinCode || '').toUpperCase();

  if (!validCode || incomingCode !== validCode) {
    res.status(403).json({ error: 'Invalid join code.' });
    return;
  }

  const normalEmail = normalizeEmail(email);
  if (!hasVerifiedEmail(normalEmail, 'employee-signup')) {
    res.status(403).json({ error: 'Email verification is required before signup.' });
    return;
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
    return;
  }

  const employeeRole = ['technician', 'salesman', 'manager'].includes(role) ? role : 'technician';
  const employeeName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const now = new Date().toISOString();
  const employees = workspace.employees || [];
  const newLegacyId = employees.length ? Math.max(...employees.map(e => Number(e.id) || 0)) + 1 : 1;

  // Create employee record
  const empResult = db.prepare(`
    INSERT INTO employees (legacy_id, first_name, last_name, email, phone, role, status, created_at)
    VALUES (?, ?, ?, ?, '', ?, 'active', ?)
  `).run(newLegacyId, firstName.trim(), lastName.trim(), normalEmail, employeeRole, now);
  const employeeId = empResult.lastInsertRowid;

  // Also add to workspace JSON employees array
  employees.push({
    id: newLegacyId,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalEmail,
    role: employeeRole,
    status: 'active',
    startTime: '08:00',
    endTime: '17:00',
    maxJobsPerDay: 6,
    availableDays: [1, 2, 3, 4, 5],
    createdAt: now
  });
  workspace.employees = employees;
  saveWorkspace(workspace);

  const passwordHash = await bcrypt.hash(password, 10);
  db.prepare(`
    INSERT INTO users (email, password_hash, role, employee_id, status, name, created_at)
    VALUES (?, ?, ?, ?, 'active', ?, ?)
  `).run(normalEmail, passwordHash, employeeRole, newLegacyId, employeeName, now);

  const newUser = db.prepare('SELECT * FROM users WHERE email = ?').get(normalEmail);
  const session = serializeUser(newUser);
  session.employeeId = newLegacyId;
  const sessionHours = Math.max(1, Number(workspace.security?.sessionTimeoutHours || 12));
  const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: `${sessionHours}h` });
  consumeVerifiedEmail(normalEmail, 'employee-signup');

  res.json({ ok: true, token, session, workspace: getWorkspace() });
});

app.put('/api/workspace', authRequired, adminRequired, (req, res) => {
  const merged = {
    ...getWorkspace(),
    ...(req.body || {})
  };
  saveWorkspace(merged);
  res.json({ ok: true, workspace: getWorkspace() });
});

app.put('/api/account', authRequired, (req, res) => {
  const email = normalizeEmail(req.body?.email || req.user.email);
  const password = String(req.body?.password || '');
  const firstName = String(req.body?.firstName || '').trim();
  const lastName = String(req.body?.lastName || '').trim();
  const requestedName = `${firstName} ${lastName}`.trim();
  const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!currentUser) {
    res.status(404).json({ error: 'Account not found.' });
    return;
  }
  const taken = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id);
  if (taken) {
    res.status(409).json({ error: 'Email is already in use.' });
    return;
  }
  const nextHash = password ? bcrypt.hashSync(password, 10) : currentUser.password_hash;
  const nextName = requestedName || currentUser.name;
  db.prepare('UPDATE users SET email = ?, password_hash = ?, name = ? WHERE id = ?').run(email, nextHash, nextName, req.user.id);

  if (currentUser.employee_id) {
    const employee = db.prepare('SELECT id, first_name, last_name FROM employees WHERE legacy_id = ?').get(currentUser.employee_id);
    if (employee) {
      db.prepare('UPDATE employees SET email = ?, first_name = ?, last_name = ? WHERE id = ?').run(
        email,
        firstName || employee.first_name,
        lastName || employee.last_name,
        employee.id
      );
    }
  }

  res.json({ ok: true, session: { ...req.user, email, name: nextName } });
});

app.get('/api/contacts', authRequired, (_req, res) => {
  res.json({ ok: true, ...listContacts() });
});

// ───── TEAM CHAT ─────
app.get('/api/channels', authRequired, (_req, res) => {
  const channels = db.prepare('SELECT * FROM channels ORDER BY created_at ASC').all();
  res.json({ ok: true, channels });
});

app.get('/api/channels/:channelId/messages', authRequired, (req, res) => {
  const channelId = Number(req.params.channelId);
  const messages = db.prepare(
    'SELECT m.*, u.name, u.email FROM chat_messages m JOIN users u ON u.id = m.user_id WHERE m.channel_id = ? ORDER BY m.created_at ASC'
  ).all(channelId);
  res.json({ ok: true, messages });
});

app.post('/api/channels/:channelId/messages', authRequired, (req, res) => {
  const channelId = Number(req.params.channelId);
  const text = String(req.body?.message || '').trim();
  if (!text) { res.status(400).json({ error: 'Message is required.' }); return; }
  const now = new Date().toISOString();
  const result = db.prepare(
    'INSERT INTO chat_messages (channel_id, user_id, message, created_at) VALUES (?, ?, ?, ?)'
  ).run(channelId, req.user.id, text, now);
  const msg = db.prepare(
    'SELECT m.*, u.name, u.email FROM chat_messages m JOIN users u ON u.id = m.user_id WHERE m.id = ?'
  ).get(result.lastInsertRowid);
  res.json({ ok: true, message: msg });
});

app.post('/api/channels', authRequired, adminRequired, (req, res) => {
  const name = String(req.body?.name || '').trim().toLowerCase().replace(/\s+/g, '-');
  const description = String(req.body?.description || '').trim();
  const channelType = ['public', 'private'].includes(req.body?.channelType) ? req.body.channelType : 'public';
  if (!name) { res.status(400).json({ error: 'Channel name is required.' }); return; }
  const now = new Date().toISOString();
  try {
    const result = db.prepare(
      'INSERT INTO channels (name, description, channel_type, owner_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, description, channelType, req.user.id, now, now);
    res.json({ ok: true, channel: { id: result.lastInsertRowid, name, description, channel_type: channelType, owner_id: req.user.id, created_at: now } });
  } catch {
    res.status(409).json({ error: 'A channel with that name already exists.' });
  }
});

app.delete('/api/channels/:channelId', authRequired, adminRequired, (req, res) => {
  const channelId = Number(req.params.channelId);
  db.prepare('DELETE FROM chat_messages WHERE channel_id = ?').run(channelId);
  db.prepare('DELETE FROM channel_members WHERE channel_id = ?').run(channelId);
  db.prepare('DELETE FROM channels WHERE id = ?').run(channelId);
  res.json({ ok: true });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    next();
    return;
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Service Mafia server running on http://localhost:${PORT}`);
});