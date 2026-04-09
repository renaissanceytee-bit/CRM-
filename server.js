import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
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
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';

const dataDir = path.join(__dirname, 'data');
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
    affiliatePayoutMethod: 'bank-transfer',
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

  const channelCount = db.prepare('SELECT COUNT(*) AS count FROM channels').get().count;
  if (!channelCount) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO channels (name, description, channel_type, owner_id, created_at, updated_at)
      VALUES (?, ?, 'public', 1, ?, ?)
    `).run('general', 'General team discussion', now, now);
    db.prepare(`
      INSERT INTO channels (name, description, channel_type, owner_id, created_at, updated_at)
      VALUES (?, ?, 'public', 1, ?, ?)
    `).run('announcements', 'Important announcements and updates', now, now);
  }
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
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
  <title>ProCRM Affiliate Terms</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 840px; margin: 40px auto; padding: 0 20px; color: #111827; line-height: 1.6; }
    h1, h2 { color: #0f172a; }
    .note { padding: 14px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }
  </style>
</head>
<body>
  <h1>Affiliate Program Terms</h1>
  <p>These terms govern participation in the ProCRM affiliate program.</p>
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
  const checks = [
    { key: 'app_base_url', ok: Boolean(APP_BASE_URL), detail: APP_BASE_URL },
    { key: 'jwt_secret_configured', ok: Boolean(process.env.JWT_SECRET && process.env.JWT_SECRET !== 'procrm-dev-secret'), detail: process.env.JWT_SECRET ? 'Configured' : 'Set JWT_SECRET in production.' },
    { key: 'smtp_sender_configured', ok: Boolean(SMTP_FROM), detail: SMTP_FROM || 'Set SMTP_FROM when email provider is ready.' },
    { key: 'support_email_configured', ok: Boolean(SUPPORT_EMAIL), detail: SUPPORT_EMAIL },
    { key: 'affiliate_enabled', ok: Boolean(workspace.growth?.affiliateEnabled), detail: 'Affiliate program toggle' },
    { key: 'affiliate_terms_url', ok: Boolean(workspace.growth?.affiliateTermsUrl), detail: workspace.growth?.affiliateTermsUrl || 'Add affiliate terms URL.' },
    { key: 'affiliate_signup_ready', ok: affiliateSignupReady, detail: affiliateSignupReady ? `Signup code ${workspace.growth.affiliateSignupCode} is active.` : 'Enable affiliate signup flow.' },
    { key: 'stripe_key_configured', ok: Boolean(STRIPE_SECRET_KEY), detail: STRIPE_SECRET_KEY ? 'Configured' : 'Pending owner-provided key' }
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

// ───── TEAM CHAT ENDPOINTS ─────
app.get('/api/channels', authRequired, (req, res) => {
  const channels = db.prepare('SELECT * FROM channels ORDER BY created_at ASC').all();
  res.json({ ok: true, channels });
});

app.get('/api/channels/:channelId/messages', authRequired, (req, res) => {
  const { channelId } = req.params;
  const messages = db.prepare(`
    SELECT cm.*, u.name, u.email FROM chat_messages cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.channel_id = ?
    ORDER BY cm.created_at ASC
  `).all(Number(channelId));
  res.json({ ok: true, messages });
});

app.post('/api/channels/:channelId/messages', authRequired, (req, res) => {
  const { channelId } = req.params;
  const { message } = req.body || {};
  if (!message || !String(message).trim()) {
    res.status(400).json({ error: 'Message text is required.' });
    return;
  }
  const createdAt = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO chat_messages (channel_id, user_id, message, created_at)
    VALUES (?, ?, ?, ?)
  `).run(Number(channelId), req.user.id, String(message).trim(), createdAt);
  
  const newMsg = db.prepare('SELECT cm.*, u.name, u.email FROM chat_messages cm JOIN users u ON u.id = cm.user_id WHERE cm.id = ?').get(result.lastInsertRowid);
  res.json({ ok: true, message: newMsg });
});

app.post('/api/channels', authRequired, (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Only admins can create channels.' });
    return;
  }
  const { name, description, channelType } = req.body || {};
  if (!name || !String(name).trim()) {
    res.status(400).json({ error: 'Channel name is required.' });
    return;
  }
  const now = new Date().toISOString();
  try {
    const result = db.prepare(`
      INSERT INTO channels (name, description, channel_type, owner_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(String(name).trim().toLowerCase(), String(description || ''), String(channelType || 'public'), req.user.id, now, now);
    const channel = { id: result.lastInsertRowid, name: String(name).trim().toLowerCase(), description: String(description || ''), channel_type: String(channelType || 'public'), owner_id: req.user.id, created_at: now, updated_at: now };
    res.json({ ok: true, channel });
  } catch (err) {
    res.status(400).json({ error: 'Channel name must be unique.' });
  }
});

app.delete('/api/channels/:channelId', authRequired, (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Only admins can delete channels.' });
    return;
  }
  const { channelId } = req.params;
  db.prepare('DELETE FROM chat_messages WHERE channel_id = ?').run(Number(channelId));
  db.prepare('DELETE FROM channel_members WHERE channel_id = ?').run(Number(channelId));
  db.prepare('DELETE FROM channels WHERE id = ?').run(Number(channelId));
  res.json({ ok: true });
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
  const incomingWorkspace = req.body?.workspace;
  const workspace = getWorkspace();

  if (workspace.onboarded) {
    res.status(403).json({ error: 'Owner setup has already been completed.' });
    return;
  }
  if (!email || !ownerName || password.length < 8) {
    res.status(400).json({ error: 'Owner email, name, and an 8-character password are required.' });
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
  saveWorkspace(mergedWorkspace);

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

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    next();
    return;
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ProCRM server running on http://localhost:${PORT}`);
});