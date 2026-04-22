// ============================================================
//  Service Mafia — Premium Business CRM  |  app.js
// ============================================================

// ─── DATA STORE ─────────────────────────────────────────────
const DB = {
  get clients()        { return JSON.parse(localStorage.getItem('crm_clients') || '[]'); },
  get bookings()       { return JSON.parse(localStorage.getItem('crm_bookings') || '[]'); },
  get payments()       { return JSON.parse(localStorage.getItem('crm_payments') || '[]'); },
  get employees()      { return JSON.parse(localStorage.getItem('crm_employees') || '[]'); },
  get users()          { return JSON.parse(localStorage.getItem('crm_users') || '[]'); },
  get workspace()      {
    const fallback = {
      companyName: 'My Company',
      industry: '',
      businessCategory: 'window-cleaning',
      customCategory: '',
      businessEmail: 'admin@procrm.local',
      primaryAdmin: 'Admin',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      plan: 'starter',
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
        affiliateEnabled: false,
        affiliateCode: 'PROCRM15',
        affiliateSignupCode: 'AFFILIATE',
        affiliateSignupEnabled: false,
        affiliateCommissionPct: 15,
        affiliateCookieDays: 30,
        affiliateMinPayout: 50,
        affiliatePayoutEmail: '',
        affiliatePayoutMethod: 'venmo',
        affiliateVenmoHandle: '',
        affiliateTermsUrl: `${window.location.origin}/affiliate-terms`,
        inviteDiscountPct: 10,
        inviteFreeMonths: 1,
        affiliates: [],
        invites: [],
        affiliateEvents: [],
        payoutHistory: []
      },
      serviceCatalog: [],
      billingCycle: 'monthly',
      nextBillingDate: null,
      subscriptionStatus: 'trialing',
      teamRoles: {
        manager: {
          label: 'Manager',
          baseRole: 'manager',
          permissions: {
            createBookings: true,
            editBookings: true,
            assignBookings: true,
            manageClients: true,
            manageEmployees: true,
            viewRevenue: true,
            viewPayroll: true
          },
          bookingQuestions: []
        },
        salesman: {
          label: 'Salesperson',
          baseRole: 'salesman',
          permissions: {
            createBookings: true,
            editBookings: true,
            assignBookings: true,
            manageClients: true,
            manageEmployees: false,
            viewRevenue: true,
            viewPayroll: false
          },
          bookingQuestions: []
        },
        technician: {
          label: 'Technician',
          baseRole: 'technician',
          permissions: {
            createBookings: false,
            editBookings: false,
            assignBookings: false,
            manageClients: false,
            manageEmployees: false,
            viewRevenue: false,
            viewPayroll: false
          },
          bookingQuestions: []
        }
      }
    };
    const stored = JSON.parse(localStorage.getItem('crm_workspace') || '{}');
    const mergedWorkspace = {
      ...fallback,
      ...stored,
      notificationPrefs: { ...fallback.notificationPrefs, ...(stored.notificationPrefs || {}) },
      scheduling: { ...fallback.scheduling, ...(stored.scheduling || {}) },
      security: { ...fallback.security, ...(stored.security || {}) },
      management: { ...fallback.management, ...(stored.management || {}) },
      growth: {
        ...fallback.growth,
        ...(stored.growth || {}),
        affiliates: Array.isArray(stored.growth?.affiliates) ? stored.growth.affiliates : fallback.growth.affiliates,
        invites: Array.isArray(stored.growth?.invites) ? stored.growth.invites : fallback.growth.invites,
        affiliateEvents: Array.isArray(stored.growth?.affiliateEvents) ? stored.growth.affiliateEvents : fallback.growth.affiliateEvents,
        payoutHistory: Array.isArray(stored.growth?.payoutHistory) ? stored.growth.payoutHistory : fallback.growth.payoutHistory
      },
      serviceCatalog: Array.isArray(stored.serviceCatalog) ? stored.serviceCatalog : fallback.serviceCatalog,
      teamRoles: {
        manager: {
          ...fallback.teamRoles.manager,
          ...(stored.teamRoles?.manager || {}),
          permissions: {
            ...fallback.teamRoles.manager.permissions,
            ...(stored.teamRoles?.manager?.permissions || {})
          },
          bookingQuestions: Array.isArray(stored.teamRoles?.manager?.bookingQuestions)
            ? stored.teamRoles.manager.bookingQuestions
            : fallback.teamRoles.manager.bookingQuestions
        },
        salesman: {
          ...fallback.teamRoles.salesman,
          ...(stored.teamRoles?.salesman || {}),
          permissions: {
            ...fallback.teamRoles.salesman.permissions,
            ...(stored.teamRoles?.salesman?.permissions || {})
          },
          bookingQuestions: Array.isArray(stored.teamRoles?.salesman?.bookingQuestions)
            ? stored.teamRoles.salesman.bookingQuestions
            : fallback.teamRoles.salesman.bookingQuestions
        },
        technician: {
          ...fallback.teamRoles.technician,
          ...(stored.teamRoles?.technician || {}),
          permissions: {
            ...fallback.teamRoles.technician.permissions,
            ...(stored.teamRoles?.technician?.permissions || {})
          },
          bookingQuestions: Array.isArray(stored.teamRoles?.technician?.bookingQuestions)
            ? stored.teamRoles.technician.bookingQuestions
            : fallback.teamRoles.technician.bookingQuestions
        }
      }
    };
    if (!['starter', 'professional', 'premium'].includes(String(mergedWorkspace.plan || '').toLowerCase())) {
      mergedWorkspace.plan = 'starter';
    }
    return mergedWorkspace;
  },
  get notifications()  { return JSON.parse(localStorage.getItem('crm_notifications') || '[]'); },
  get payroll()        { return JSON.parse(localStorage.getItem('crm_payroll') || '[]'); },
  get quotes()         { return JSON.parse(localStorage.getItem('crm_quotes') || '[]'); },
  get clockSessions()  { return JSON.parse(localStorage.getItem('crm_clock_sessions') || '[]'); },
  get templates()      {
    const fallback = {
      jobReminder: 'Reminder: {service} for {clientName} on {date} at {time}.',
      scheduleUpdate: 'Schedule update: booking #{bookingId} moved to {date} at {time}.',
      assignment: 'New assignment: booking #{bookingId} for {service} on {date} at {time}.',
      bookingConfirmation: 'Your booking for {service} on {date} at {time} is confirmed.',
      completionFollowUp: 'Thanks {clientName}, your {service} job is complete. Let us know if you need anything else.',
      payrollNotice: 'Payroll processed for {period}. Estimated payout: {amount}.',
      inviteOffer: 'Invite friends with code {code} and earn {discount}% off plus {freeMonths} free month(s).',
      affiliateWelcome: 'Welcome to the affiliate program. Use {code} to earn {commission}% on every paid referral.'
    };
    return { ...fallback, ...(JSON.parse(localStorage.getItem('crm_templates') || '{}')) };
  },

  saveClients(d)       { localStorage.setItem('crm_clients', JSON.stringify(d)); queueBackendSync(); },
  saveBookings(d)      { localStorage.setItem('crm_bookings', JSON.stringify(d)); },
  savePayments(d)      { localStorage.setItem('crm_payments', JSON.stringify(d)); },
  saveEmployees(d)     { localStorage.setItem('crm_employees', JSON.stringify(d)); queueBackendSync(); },
  saveUsers(d)         { localStorage.setItem('crm_users', JSON.stringify(d)); queueBackendSync(); },
  saveWorkspace(d)     { localStorage.setItem('crm_workspace', JSON.stringify(d)); queueBackendSync(); },
  saveNotifications(d) { localStorage.setItem('crm_notifications', JSON.stringify(d)); },
  savePayroll(d)       { localStorage.setItem('crm_payroll', JSON.stringify(d)); },
  saveQuotes(d)        { localStorage.setItem('crm_quotes', JSON.stringify(d)); },
  saveClockSessions(d) { localStorage.setItem('crm_clock_sessions', JSON.stringify(d)); },
  saveTemplates(d)     { localStorage.setItem('crm_templates', JSON.stringify(d)); },

  nextId(arr) {
    return arr.length ? Math.max(...arr.map(x => x.id || 0)) + 1 : 1;
  }
};

const AUTH_STORAGE_KEYS = {
  session: 'crm_session',
  token: 'crm_api_token',
  rememberPreference: 'crm_remember_preference',
  lastLoginEmail: 'crm_last_login_email'
};

const FOREVER_FREE_OWNER = {
  email: 'matheson62210@gmail.com',
  password: '$Sylvester1',
  name: 'Matheson'
};

function lockWorkspaceToForeverFreePremium(workspace = {}) {
  const nextWorkspace = { ...(workspace || {}) };
  nextWorkspace.plan = 'premium';
  nextWorkspace.billingCycle = 'yearly';
  nextWorkspace.subscriptionStatus = 'active';
  nextWorkspace.nextBillingDate = null;
  nextWorkspace.trialEndsAt = null;
  nextWorkspace.freeForeverPlanLock = true;
  nextWorkspace.freeForeverOwnerEmail = FOREVER_FREE_OWNER.email;
  if (!nextWorkspace.businessEmail || normalizeEmail(nextWorkspace.businessEmail) === 'admin@procrm.local') {
    nextWorkspace.businessEmail = FOREVER_FREE_OWNER.email;
  }
  if (!nextWorkspace.primaryAdmin || nextWorkspace.primaryAdmin === 'Admin') {
    nextWorkspace.primaryAdmin = FOREVER_FREE_OWNER.name;
  }
  return nextWorkspace;
}

const INSTALL_PROMPT_STORAGE_KEYS = {
  choice: 'crm_mobile_install_choice',
  sessionShown: 'crm_mobile_install_prompt_seen'
};

function getStoredSessionValue() {
  return sessionStorage.getItem(AUTH_STORAGE_KEYS.session) || localStorage.getItem(AUTH_STORAGE_KEYS.session) || '';
}

function getStoredTokenValue() {
  return sessionStorage.getItem(AUTH_STORAGE_KEYS.token) || localStorage.getItem(AUTH_STORAGE_KEYS.token) || '';
}

function isRememberedLogin() {
  return Boolean(localStorage.getItem(AUTH_STORAGE_KEYS.session) || localStorage.getItem(AUTH_STORAGE_KEYS.token));
}

function getRememberPreference() {
  const stored = localStorage.getItem(AUTH_STORAGE_KEYS.rememberPreference);
  if (stored === null) return true;
  return stored === '1';
}

function setRememberPreference(remember) {
  localStorage.setItem(AUTH_STORAGE_KEYS.rememberPreference, remember ? '1' : '0');
}

function getLastLoginEmail() {
  return normalizeEmail(localStorage.getItem(AUTH_STORAGE_KEYS.lastLoginEmail) || '');
}

function setLastLoginEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return;
  localStorage.setItem(AUTH_STORAGE_KEYS.lastLoginEmail, normalized);
}

// ─── STATE ───────────────────────────────────────────────────
let currentPage = 'dashboard';
let currentBookingTab = 'all-bookings';
let calendarOffset = 0;
let calendarViewMode = 'weekly';
let currentSession = null;
let onboardingPath = '';
let onboardingStep = 'ownerAccount';
let onboardingSelectedPlan = 'professional';
let pendingJoinEmployeeId = null;
let deferredInstallPrompt = null;
let serviceWorkerRegistration = null;
let authInitPromise = Promise.resolve();
let authInitialized = false;
const emailVerificationState = {
  owner: { email: '', verified: false },
  employee: { email: '', verified: false },
  affiliate: { email: '', verified: false }
};

const workspaceEmailVerificationState = {
  oldEmail: '',
  newEmail: '',
  oldVerified: false,
  newVerified: false
};

const backendState = {
  available: false,
  token: getStoredTokenValue(),
  workspace: null,
  syncTimer: null
};

const PLAN_DEFINITIONS = {
  starter: {
    label: 'Starter',
    monthlyPrice: 20,
    yearlyPrice: 144,
    employeeLimit: 7,
    seatLimitLabel: '7 employees',
    features: {
      teamManagement: true,
      advancedScheduling: true,
      smartScheduling: false,
      payrollAutomation: true,
      advancedReports: false,
      managerControls: false,
      templatesPlus: false,
      multipleServicesPerBooking: false,
      affiliateProgram: true,
      referralRewards: true,
      installableApp: true,
      unlimitedEmployees: false
    }
  },
  professional: {
    label: 'Professional',
    monthlyPrice: 50,
    yearlyPrice: 360,
    employeeLimit: 15,
    seatLimitLabel: '15 employees',
    features: {
      teamManagement: true,
      advancedScheduling: true,
      smartScheduling: true,
      payrollAutomation: true,
      advancedReports: true,
      managerControls: true,
      templatesPlus: true,
      multipleServicesPerBooking: true,
      affiliateProgram: true,
      referralRewards: true,
      installableApp: true,
      unlimitedEmployees: false
    }
  },
  premium: {
    label: 'Premium',
    monthlyPrice: 100,
    yearlyPrice: 720,
    employeeLimit: Infinity,
    seatLimitLabel: 'Unlimited employees',
    features: {
      teamManagement: true,
      advancedScheduling: true,
      smartScheduling: true,
      payrollAutomation: true,
      advancedReports: true,
      managerControls: true,
      templatesPlus: true,
      multipleServicesPerBooking: true,
      affiliateProgram: true,
      referralRewards: true,
      installableApp: true,
      unlimitedEmployees: true
    }
  }
};

const PLAN_MARKETING_DISCOUNT_PERCENT = {
  starter: 33,
  professional: 38,
  premium: 40
};

// ─── HELPERS ─────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const fmt = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pad = n => String(n).padStart(2, '0');

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toDateObj(dateStr) {
  return new Date(dateStr + 'T00:00:00');
}

function startOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

function endOfMonth() {
  const d = new Date();
  const e = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${e.getFullYear()}-${pad(e.getMonth() + 1)}-${pad(e.getDate())}`;
}

function fmtDate(dateStr) {
  if (!dateStr) return '-';
  return toDateObj(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getWorkspace() {
  return lockWorkspaceToForeverFreePremium(backendState.workspace || DB.workspace);
}

function saveWorkspace(workspace) {
  const lockedWorkspace = lockWorkspaceToForeverFreePremium(workspace);
  backendState.workspace = lockedWorkspace;
  DB.saveWorkspace(lockedWorkspace);
  if (backendState.available && backendState.token) {
    apiRequest('/api/workspace', { method: 'PUT', body: lockedWorkspace }).catch(() => {});
  }
  syncWorkspaceBranding();
}

function getActivePlan() {
  const workspace = getWorkspace();
  return PLAN_DEFINITIONS[workspace.plan] || PLAN_DEFINITIONS.starter;
}

function getPlanPrice(plan = null) {
  const planDef = plan ? PLAN_DEFINITIONS[plan] : getActivePlan();
  const workspace = getWorkspace();
  const billingCycle = workspace.billingCycle || 'monthly';
  
  if (billingCycle === 'yearly') {
    return planDef.yearlyPrice;
  }
  return planDef.monthlyPrice;
}

function getDisplayPrice(plan = null) {
  const planDef = plan ? PLAN_DEFINITIONS[plan] : getActivePlan();
  const workspace = getWorkspace();
  const billingCycle = workspace.billingCycle || 'monthly';
  const planKey = plan || getWorkspace().plan;
  const discountPct = PLAN_MARKETING_DISCOUNT_PERCENT[planKey] || 0;
  const currentPrice = billingCycle === 'yearly' ? planDef.yearlyPrice : planDef.monthlyPrice;

  if (!discountPct || currentPrice <= 0) {
    return billingCycle === 'yearly' ? `$${currentPrice}/year` : `$${currentPrice}/mo`;
  }

  const listPriceRaw = currentPrice / (1 - (discountPct / 100));
  const listPrice = Math.round(listPriceRaw / 5) * 5;
  const unit = billingCycle === 'yearly' ? '/year' : '/mo';
  return `$${currentPrice}${unit} (was $${listPrice}${unit}, ${discountPct}% off)`;
}

function renderPlanPrice(planKey, billingCycle = 'monthly') {
  const plan = PLAN_DEFINITIONS[planKey];
  if (!plan) return '';

  const discountPct = PLAN_MARKETING_DISCOUNT_PERCENT[planKey] || 0;
  const current = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  const unit = billingCycle === 'yearly' ? '/yr' : '/mo';

  if (!discountPct || current <= 0) {
    return `$${current}${unit}`;
  }

  const listPriceRaw = current / (1 - (discountPct / 100));
  const listPrice = Math.round(listPriceRaw / 5) * 5;
  return `<span class="plan-price-stack"><span class="plan-price-old">$${listPrice}${unit}</span><span class="plan-price-new">$${current}${unit}</span><span class="plan-price-discount">${discountPct}% OFF</span></span>`;
}

function refreshPlanCardPrices() {
  const workspaceBilling = $('workspaceBillingCycle')?.value || getWorkspace().billingCycle || 'monthly';
  const onboardBilling = workspaceBilling;

  const workspaceMap = {
    starter: 'planStarterPrice',
    professional: 'planProfessionalPrice',
    premium: 'planPremiumPrice'
  };
  const onboardMap = {
    starter: 'onboardPlanStarterPrice',
    professional: 'onboardPlanProfessionalPrice',
    premium: 'onboardPlanPremiumPrice'
  };

  Object.entries(workspaceMap).forEach(([plan, id]) => {
    const el = $(id);
    if (!el) return;
    el.innerHTML = renderPlanPrice(plan, workspaceBilling);
  });

  Object.entries(onboardMap).forEach(([plan, id]) => {
    const el = $(id);
    if (!el) return;
    el.innerHTML = renderPlanPrice(plan, onboardBilling);
  });
}

function hasFeature(featureName) {
  const plan = getActivePlan();
  const included = Boolean(plan.features[featureName]);
  if (!included) return false;
  const workspace = getWorkspace();
  const status = String(workspace.subscriptionStatus || 'trialing').toLowerCase();
  return status === 'active' || status === 'trialing';
}

function setBackendToken(token, remember = isRememberedLogin()) {
  backendState.token = token || '';
  sessionStorage.removeItem(AUTH_STORAGE_KEYS.token);
  localStorage.removeItem(AUTH_STORAGE_KEYS.token);
  if (!token) return;
  if (remember) localStorage.setItem(AUTH_STORAGE_KEYS.token, token);
  else sessionStorage.setItem(AUTH_STORAGE_KEYS.token, token);
}

async function apiRequest(path, options = {}) {
  const config = {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  };

  if (backendState.token && options.auth !== false) {
    config.headers.Authorization = `Bearer ${backendState.token}`;
  }
  if (options.body !== undefined) config.body = JSON.stringify(options.body);

  const response = await fetch(path, config);
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Request failed: ${response.status}`);
  }
  return payload;
}

function workspaceHasMeaningfulSetup(workspace) {
  if (!workspace || typeof workspace !== 'object') return false;
  const companyName = String(workspace.companyName || '').trim();
  return Boolean(
    workspace.onboarded ||
    (companyName && companyName !== 'My Company') ||
    String(workspace.employeeJoinCode || '').trim() ||
    (Array.isArray(workspace.serviceCatalog) && workspace.serviceCatalog.length)
  );
}

async function syncLocalToBackend() {
  if (!backendState.available) return;

  const localWorkspace = DB.workspace;
  const workspaceResponse = await apiRequest('/api/workspace', { auth: false });
  const remoteWorkspace = workspaceResponse.workspace;

  const localReady = workspaceHasMeaningfulSetup(localWorkspace);
  const remoteReady = workspaceHasMeaningfulSetup(remoteWorkspace);

  if (remoteReady && !localReady) {
    backendState.workspace = remoteWorkspace;
    DB.saveWorkspace(remoteWorkspace);
    return;
  }

  await apiRequest('/api/migrate/local', {
    method: 'POST',
    auth: false,
    body: {
      workspace: DB.workspace,
      users: DB.users,
      clients: DB.clients,
      employees: DB.employees
    }
  });

  const refreshedWorkspace = await apiRequest('/api/workspace', { auth: false });
  backendState.workspace = refreshedWorkspace.workspace;
  DB.saveWorkspace(refreshedWorkspace.workspace);
}

function queueBackendSync() {
  if (!backendState.available) return;
  clearTimeout(backendState.syncTimer);
  backendState.syncTimer = setTimeout(() => {
    syncLocalToBackend().catch(() => {});
  }, 400);
}

async function initBackend() {
  try {
    await apiRequest('/api/health', { auth: false });
    backendState.available = true;
    await syncLocalToBackend();
    syncWorkspaceBranding();
  } catch {
    backendState.available = false;
    backendState.workspace = null;
  }
}

async function waitForAuthBootstrap() {
  await authInitPromise.catch(() => {});
}

function getCurrentEmployee() {
  if (!currentSession?.employeeId) return null;
  return DB.employees.find(employee => Number(employee.id) === Number(currentSession.employeeId)) || null;
}

function getDefaultEmployeePermissions(role = 'technician') {
  const defaults = {
    createBookings: role === 'salesman' || role === 'manager',
    editBookings: role === 'salesman' || role === 'manager',
    assignBookings: role === 'salesman' || role === 'manager',
    manageClients: role === 'salesman' || role === 'manager',
    manageEmployees: role === 'manager',
    viewRevenue: role === 'salesman' || role === 'manager',
    viewPayroll: role === 'manager'
  };
  const configured = getWorkspace()?.teamRoles?.[role]?.permissions;
  if (!configured || typeof configured !== 'object') return defaults;
  return { ...defaults, ...configured };
}

function getEmployeePermissions(employee = null) {
  const target = employee || getCurrentEmployee();
  return {
    ...getDefaultEmployeePermissions(target?.role || currentSession?.role || 'technician'),
    ...(target?.permissions || {})
  };
}

function hasEmployeePermission(permission) {
  if (isAdmin()) return true;
  return Boolean(getEmployeePermissions()[permission]);
}

function canCreateBookings() {
  return isAdmin() || hasEmployeePermission('createBookings');
}

function canEditAllBookings() {
  return isAdmin() || hasEmployeePermission('editBookings');
}

function canAssignBookings() {
  return isAdmin() || hasEmployeePermission('assignBookings');
}

function canManageClients() {
  return isAdmin() || hasEmployeePermission('manageClients');
}

function canManageEmployees() {
  return isAdmin() || hasEmployeePermission('manageEmployees');
}

function canViewRevenue() {
  return isAdmin() || hasEmployeePermission('viewRevenue');
}

function canViewPayroll() {
  return isAdmin() || hasEmployeePermission('viewPayroll');
}

function getSeatUsage() {
  return DB.employees.filter(e => e.status !== 'inactive').length;
}

function getSeatLimitText() {
  const plan = getActivePlan();
  if (!Number.isFinite(plan.employeeLimit)) return `${getSeatUsage()} / Unlimited employees`;
  return `${getSeatUsage()} / ${plan.employeeLimit} employees`;
}

function makeCode(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function generateUniqueEmployeeInviteCode(excludeEmployeeId = null) {
  const used = new Set(
    DB.employees
      .filter(employee => Number(employee.id) !== Number(excludeEmployeeId || 0))
      .map(employee => String(employee.inviteCode || '').toUpperCase())
      .filter(Boolean)
  );
  let code = makeCode('EMP');
  while (used.has(code)) code = makeCode('EMP');
  return code;
}

function showUpgradePrompt(featureName, message = '') {
  const featureNames = {
    teamManagement: 'Team Management',
    advancedScheduling: 'Advanced Scheduling',
    smartScheduling: 'Smart Scheduling',
    payrollAutomation: 'Payroll Automation',
    advancedReports: 'Advanced Reports',
    managerControls: 'Manager Controls',
    templatesPlus: 'Advanced Templates',
    multipleServicesPerBooking: 'Multiple Services per Booking'
  };
  
  const upgradeEl = document.getElementById('upgradePrompt');
  if (!upgradeEl) return;
  
  const displayName = featureNames[featureName] || featureName;
  const currentPlan = getActivePlan();
  
  let suggestedPlan = 'professional';
  for (const [planName, plan] of Object.entries(PLAN_DEFINITIONS)) {
    if (plan.features[featureName]) {
      suggestedPlan = planName;
      break;
    }
  }
  
  const suggestedPlanDef = PLAN_DEFINITIONS[suggestedPlan];
  
  upgradeEl.innerHTML = `
    <div class="upgrade-prompt-content">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <i class="fas fa-lock" style="font-size:24px;color:var(--accent-blue)"></i>
        <div>
          <div style="font-size:16px;font-weight:600">${displayName} Locked</div>
          <div style="font-size:13px;color:var(--text-secondary)">${message || 'This feature requires a higher plan.'}</div>
        </div>
      </div>
      <div style="background:var(--surface-secondary);border-radius:8px;padding:12px;margin-bottom:16px">
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px">Your current plan</div>
        <div style="font-size:18px;font-weight:600">${currentPlan.label}</div>
      </div>
      <div style="background:var(--accent-blue);opacity:0.1;border-radius:8px;padding:12px;margin-bottom:16px;border:1px solid var(--accent-blue)">
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px">Upgrade to</div>
        <div style="font-size:18px;font-weight:600">Upgrade to ${suggestedPlanDef.label}</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-top:8px">${getDisplayPrice(suggestedPlan)}</div>
      </div>
      <button class="btn-primary" onclick="selectWorkspacePlan('${suggestedPlan}');closeModal('upgradePromptModal')" style="width:100%;margin-bottom:8px">
        Upgrade Now
      </button>
      <button class="btn-secondary" onclick="closeModal('upgradePromptModal')" style="width:100%">
        Maybe Later
      </button>
    </div>
  `;
  
  openModal('upgradePromptModal');
}

function workspaceInvites() {
  return Array.isArray(getWorkspace().growth.invites) ? getWorkspace().growth.invites : [];
}

function workspaceAffiliates() {
  return Array.isArray(getWorkspace().growth.affiliates) ? getWorkspace().growth.affiliates : [];
}

function workspaceAffiliateEvents() {
  return Array.isArray(getWorkspace().growth.affiliateEvents) ? getWorkspace().growth.affiliateEvents : [];
}

function workspaceAffiliatePayoutHistory() {
  return Array.isArray(getWorkspace().growth.payoutHistory) ? getWorkspace().growth.payoutHistory : [];
}

function generateUniqueAffiliateCode(excludeAffiliateId = null) {
  const used = new Set(
    workspaceAffiliates()
      .filter(affiliate => Number(affiliate.id) !== Number(excludeAffiliateId || 0))
      .map(affiliate => String(affiliate.code || '').toUpperCase())
      .filter(Boolean)
  );
  let code = makeCode('AFF');
  while (used.has(code)) code = makeCode('AFF');
  return code;
}

function getCurrentAffiliate() {
  if (!isAffiliate() || !currentSession?.email) return null;
  return workspaceAffiliates().find(affiliate => normalizeEmail(affiliate.email) === normalizeEmail(currentSession.email)) || null;
}

function getAffiliateSignupLink() {
  if (getWorkspace().growth?.affiliateSignupEnabled === false) return '';
  const base = window.location.origin + window.location.pathname;
  const signupCode = String(getWorkspace().growth.affiliateSignupCode || 'AFFILIATE').trim().toUpperCase();
  return `${base}?affiliateSignup=${encodeURIComponent(signupCode)}`;
}

function getAffiliateReferralLink(code) {
  const base = window.location.origin + window.location.pathname;
  return `${base}?ref=${encodeURIComponent(String(code || '').trim().toUpperCase())}`;
}

function inviteRewardValue(invite) {
  return Number(invite?.discountCredit || 0) + (Number(invite?.freeMonths || 0) * 49);
}

function affiliatePayoutDue() {
  return workspaceAffiliates().reduce((sum, affiliate) => sum + Number(affiliate.payoutDue || 0), 0);
}

function shouldShowAffiliateUi() {
  const growth = getWorkspace().growth || {};
  return Boolean(growth.affiliateEnabled || workspaceAffiliates().length || isAffiliate());
}

function pendingApprovalCount() {
  const threshold = Number(getWorkspace().management.approvalRequiredOver || 0);
  return DB.bookings.filter(b => b.status === 'pending' || (threshold > 0 && Number(b.amount || 0) >= threshold && b.status !== 'completed' && b.status !== 'cancelled')).length;
}

function workspaceFeatureLock(page) {
  if (page === 'employees' && !hasFeature('teamManagement')) return 'Upgrade to a paid plan to add employees.';
  if (page === 'payroll' && !hasFeature('payrollAutomation')) return 'Payroll is included in paid plans.';
  return '';
}

function syncWorkspaceBranding() {
  const workspace = getWorkspace();
  if ($('companyName')) $('companyName').textContent = workspace.companyName || 'My Company';
  if ($('workspacePlanBadge')) $('workspacePlanBadge').textContent = `${getActivePlan().label} Plan`;
}

function maybeNotifyBrowser(message) {
  const workspace = getWorkspace();
  if (!workspace.notificationPrefs.browserAlerts) return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible') return;

  if (serviceWorkerRegistration?.showNotification) {
    serviceWorkerRegistration.showNotification('Service Mafia', {
      body: message,
      icon: 'icon.svg',
      badge: 'icon.svg',
      tag: 'procrm-alert'
    }).catch(() => {});
    return;
  }

  new Notification('Service Mafia', { body: message, icon: 'icon.svg' });
}

async function requestBrowserNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('Browser notifications are not supported here.', 'info');
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const workspace = getWorkspace();
    workspace.notificationPrefs.browserAlerts = true;
    saveWorkspace(workspace);
    renderWorkspacePage();
    showToast('Browser alerts enabled.');
    return;
  }
  showToast('Browser alerts were not enabled.', 'info');
}

function maybeCreateDailyDigest() {
  const workspace = getWorkspace();
  if (!workspace.notificationPrefs.dailyDigest) return;
  const todayKey = today();
  const sentKey = localStorage.getItem('crm_daily_digest_sent');
  if (sentKey === todayKey) return;

  const bookingsToday = DB.bookings.filter(b => b.date === todayKey && b.status !== 'cancelled').length;
  const revenueToday = DB.payments.filter(p => p.status === 'paid' && p.date === todayKey).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  addNotification(`Daily digest: ${bookingsToday} jobs scheduled today and ${fmt(revenueToday)} in revenue.`, null, 'system');
  localStorage.setItem('crm_daily_digest_sent', todayKey);
}

function businessCategoryLabel(value, customValue = '') {
  const labels = {
    'window-cleaning': 'Window Cleaning',
    'roof-cleaning': 'Roof Cleaning',
    'pressure-washing': 'Pressure Washing',
    landscaping: 'Landscaping',
    hvac: 'HVAC',
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    moving: 'Moving Services',
    cleaning: 'General Cleaning',
    custom: customValue || 'Custom Business'
  };
  return labels[value] || customValue || 'Business Service';
}

function normalizeSubServices(subServicesInput = '') {
  return String(subServicesInput)
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeManagerBookingQuestions(rawQuestions = []) {
  const list = Array.isArray(rawQuestions) ? rawQuestions : [];
  return list
    .map((entry, index) => {
      if (typeof entry === 'string') {
        const [labelPart, typePart] = entry.split('::').map(part => String(part || '').trim());
        const label = labelPart;
        const type = typePart === 'yesno' ? 'yesno' : 'text';
        if (!label) return null;
        return { id: index + 1, label, type };
      }
      if (!entry || typeof entry !== 'object') return null;
      const label = String(entry.label || '').trim();
      const type = String(entry.type || 'text').toLowerCase() === 'yesno' ? 'yesno' : 'text';
      if (!label) return null;
      return { id: Number(entry.id) || (index + 1), label, type };
    })
    .filter(Boolean)
    .slice(0, 10);
}

function parseManagerBookingQuestionsInput(inputValue = '') {
  return String(inputValue)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((line, index) => {
      const [labelPart, typePart] = line.split('::').map(part => String(part || '').trim());
      return {
        id: index + 1,
        label: labelPart,
        type: typePart === 'yesno' ? 'yesno' : 'text'
      };
    });
}

function renderServiceSuggestions() {
  const datalist = $('serviceSuggestions');
  if (!datalist) return;
  const catalog = getWorkspace().serviceCatalog || [];
  const values = [];
  catalog.forEach(group => {
    const main = String(group.mainService || '').trim();
    if (main) values.push(main);
    (group.subServices || []).forEach(sub => {
      const subText = String(sub || '').trim();
      if (main && subText) values.push(`${main} - ${subText}`);
    });
  });
  datalist.innerHTML = [...new Set(values)].map(value => `<option value="${value}"></option>`).join('');
}

function renderWorkspaceServiceCatalog() {
  const container = $('workspaceServiceCatalogList');
  if (!container) return;
  const catalog = getWorkspace().serviceCatalog || [];
  if (!catalog.length) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-layer-group"></i><p>No services configured yet.</p></div>';
    return;
  }
  container.innerHTML = catalog.map(group => `
    <div class="workspace-list-item">
      <div>
        <strong>${group.mainService}</strong>
        <span>${(group.subServices || []).join(', ') || 'No sub services'}</span>
      </div>
      <button class="btn-link" onclick="removeWorkspaceServiceGroup(${group.id})">Remove</button>
    </div>
  `).join('');
}

function addWorkspaceServiceGroup() {
  const mainService = $('workspaceMainService').value.trim();
  const subServices = normalizeSubServices($('workspaceSubServices').value);
  if (!mainService) {
    showToast('Main service is required.', 'error');
    return;
  }

  const workspace = getWorkspace();
  const catalog = workspace.serviceCatalog || [];
  catalog.push({
    id: catalog.length ? Math.max(...catalog.map(group => Number(group.id || 0))) + 1 : 1,
    mainService,
    subServices
  });
  workspace.serviceCatalog = catalog;
  saveWorkspace(workspace);
  $('workspaceMainService').value = '';
  $('workspaceSubServices').value = '';
  renderWorkspaceServiceCatalog();
  renderServiceSuggestions();
  showToast('Service group added.');
}

function removeWorkspaceServiceGroup(groupId) {
  const workspace = getWorkspace();
  workspace.serviceCatalog = (workspace.serviceCatalog || []).filter(group => Number(group.id) !== Number(groupId));
  saveWorkspace(workspace);
  renderWorkspaceServiceCatalog();
  renderServiceSuggestions();
}

function updateWebAppStatus() {
  const statusText = $('webAppStatusText');
  const statusBadge = $('webAppStatusBadge');
  if (!statusText || !statusBadge) return;

  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (standalone) {
    statusText.textContent = 'Installed as a web app. Notifications and offline shell are active.';
    statusBadge.textContent = 'Installed';
    return;
  }

  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    statusText.textContent = 'On iPhone/iPad: use Share > Add to Home Screen to install.';
    statusBadge.textContent = 'iOS Ready';
    return;
  }

  statusText.textContent = deferredInstallPrompt
    ? 'Install is available. Click Install Web App to add this CRM to your device.'
    : 'Open in a supported browser to install, or use as a normal website.';
  statusBadge.textContent = deferredInstallPrompt ? 'Install Available' : 'Website Mode';
}

function isStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || Boolean(window.navigator.standalone);
}

function isMobileDevice() {
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') || coarsePointer || window.innerWidth <= 900;
}

function applyDeviceModeClass() {
  const mobile = isMobileDevice();
  document.body.classList.toggle('is-mobile', mobile);
  document.body.classList.toggle('is-desktop', !mobile);
}

async function sendEmailVerificationCode(email, purpose) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    showToast('Email is required before sending a code.', 'error');
    return false;
  }

  try {
    const response = await apiRequest('/api/auth/send-verification-code', {
      method: 'POST',
      auth: false,
      body: { email: normalized, purpose }
    });
    if (response.devCode) {
      showToast(`Verification code sent. Dev code: ${response.devCode}`, 'info');
    } else {
      showToast('Verification code sent to your email.');
    }
    return true;
  } catch (error) {
    showToast(error.message || 'Unable to send verification code.', 'error');
    return false;
  }
}

async function verifyEmailCode(email, code, purpose, stateKey) {
  const normalized = normalizeEmail(email);
  const trimmedCode = String(code || '').trim();
  if (!normalized || !trimmedCode) {
    showToast('Enter both email and verification code.', 'error');
    return false;
  }
  try {
    await apiRequest('/api/auth/verify-email-code', {
      method: 'POST',
      auth: false,
      body: { email: normalized, code: trimmedCode, purpose }
    });
    emailVerificationState[stateKey] = { email: normalized, verified: true };
    showToast('Email verified.');
    return true;
  } catch (error) {
    showToast(error.message || 'Verification code is invalid.', 'error');
    return false;
  }
}

function getSavedInstallChoice() {
  return localStorage.getItem(INSTALL_PROMPT_STORAGE_KEYS.choice) || '';
}

function setSavedInstallChoice(choice) {
  if (!choice) return;
  localStorage.setItem(INSTALL_PROMPT_STORAGE_KEYS.choice, choice);
}

function shouldShowMobileInstallPrompt() {
  if (!currentSession || !isMobileDevice() || isStandaloneMode()) return false;
  if ($('onboardingOverlay')?.classList.contains('open')) return false;
  if (sessionStorage.getItem(INSTALL_PROMPT_STORAGE_KEYS.sessionShown) === '1') return false;
  return getSavedInstallChoice() !== 'website';
}

function populateMobileInstallPrompt() {
  const headline = $('mobileInstallPromptHeadline');
  const text = $('mobileInstallPromptText');
  const hint = $('mobileInstallPromptHint');
  const installBtn = $('mobileInstallAppBtn');
  if (!headline || !text || !hint || !installBtn) return;

  if (/iPhone|iPad|iPod/i.test(navigator.userAgent || '')) {
    headline.textContent = 'Add Service Mafia to your iPhone home screen';
    text.textContent = 'Use Service Mafia like an app with a full-screen launch and a home screen icon for fast access.';
    hint.textContent = 'Tap Share in Safari, then choose Add to Home Screen. You can keep using the website if you prefer.';
    installBtn.innerHTML = '<i class="fas fa-share-from-square"></i> Show iPhone Install Steps';
    return;
  }

  headline.textContent = 'Install Service Mafia on your phone';
  text.textContent = deferredInstallPrompt
    ? 'Your browser can install Service Mafia right now for a faster, app-like mobile experience.'
    : 'Your mobile browser supports web apps. If install is available, you can add Service Mafia to your home screen.';
  hint.textContent = deferredInstallPrompt
    ? 'Tap Install App to add Service Mafia to your phone, or continue in the browser for now.'
    : 'If no install prompt appears, keep using the website and install later from Workspace settings.';
  installBtn.innerHTML = '<i class="fas fa-download"></i> Install App';
}

function maybePromptForMobileInstall(force = false) {
  if (!force && !shouldShowMobileInstallPrompt()) return;
  sessionStorage.setItem(INSTALL_PROMPT_STORAGE_KEYS.sessionShown, '1');
  populateMobileInstallPrompt();
  openModal('mobileInstallPromptModal');
}

async function installWebApp() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice.catch(() => {});
    deferredInstallPrompt = null;
    updateWebAppStatus();
    return;
  }

  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    showToast('On iPhone, tap Share then Add to Home Screen.', 'info');
    return;
  }

  showToast('Install prompt is not available in this browser session.', 'info');
}

async function sendTestNotification() {
  const workspace = getWorkspace();
  if (!workspace.notificationPrefs.browserAlerts) {
    await requestBrowserNotificationPermission();
  }
  maybeNotifyBrowser('Test notification: Service Mafia is ready on web and mobile.');
  showToast('Test notification sent if permission is granted.');
}

function renderWorkspaceAccessSummary() {
  const el = $('workspaceAccessSummary');
  if (!el) return;

  const employees = DB.employees;
  const activeEmployees = employees.filter(employee => employee.status === 'active');
  const managersEnabled = hasFeature('managerControls');
  const seatText = getSeatLimitText();

  el.innerHTML = `
    <div class="workspace-list-item">
      <div>
        <strong>Owner Seat</strong>
        <span>${getWorkspace().primaryAdmin || 'Admin'} · ${getWorkspace().businessEmail || 'admin@procrm.local'}</span>
      </div>
      <span class="pill-tag">${seatText}</span>
    </div>
    <div class="workspace-list-item">
      <div>
        <strong>Active Team</strong>
        <span>${activeEmployees.length} active employee account${activeEmployees.length === 1 ? '' : 's'}</span>
      </div>
      <span class="pill-tag">${hasFeature('teamManagement') ? 'Plan Active' : 'Upgrade Needed'}</span>
    </div>
    <div class="workspace-list-item">
      <div>
        <strong>Manager Controls</strong>
        <span>${managersEnabled ? 'Approval flows and dispatch controls enabled.' : 'Upgrade for manager controls and team workflows.'}</span>
      </div>
      <span class="pill-tag ${managersEnabled ? 'success' : ''}">${managersEnabled ? 'Enabled' : 'Locked'}</span>
    </div>
  `;
}

function renderAffiliateProgram() {
  const list = $('affiliateActivityList');
  if (!list) return;

  const affiliates = workspaceAffiliates();
  const minPayout = Number(getWorkspace().growth?.affiliateMinPayout || 0);
  const payoutMethod = String(getWorkspace().growth?.affiliatePayoutMethod || 'venmo');
  const venmoHandle = String(getWorkspace().growth?.affiliateVenmoHandle || '').trim();
  const payoutEligibleCount = affiliates.filter(affiliate => Number(affiliate.payoutDue || 0) >= minPayout && Number(affiliate.payoutDue || 0) > 0).length;
  if (!affiliates.length) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-handshake-angle"></i><p>No affiliate partners yet. Add one to start tracking commission payouts.</p></div>';
    return;
  }

  list.innerHTML = `
    <div class="workspace-list-item">
      <div>
        <strong>Payout Tracking</strong>
        <span>${payoutEligibleCount} affiliate${payoutEligibleCount === 1 ? '' : 's'} currently eligible for payout at ${fmt(minPayout)} minimum.</span>
      </div>
      <span class="pill-tag">${payoutMethod === 'venmo' ? (venmoHandle ? `Venmo ${venmoHandle}` : 'Venmo') : payoutMethod}</span>
    </div>
  ` + affiliates.map(affiliate => `
    <div class="workspace-list-item">
      <div>
        <strong>${affiliate.name}</strong>
        <span>${affiliate.email || 'No email'} · Code ${affiliate.code} · ${affiliate.conversions || 0} conversions</span>
      </div>
      <div class="workspace-inline-actions compact">
        <span class="pill-tag">Due ${fmt(affiliate.payoutDue || 0)}</span>
        <button class="btn-link" onclick="logAffiliateConversion(${affiliate.id})">Add Sale</button>
      </div>
    </div>
  `).join('');
}

function renderInviteProgram() {
  const list = $('workspaceInviteList');
  if (!list) return;

  const invites = workspaceInvites();
  if (!invites.length) {
    list.innerHTML = '<div class="empty-state"><i class="fas fa-gift"></i><p>No invites created yet. Generate one to start rewarding referrals.</p></div>';
    return;
  }

  list.innerHTML = invites.slice().reverse().map(invite => `
    <div class="workspace-list-item">
      <div>
        <strong>${invite.email}</strong>
        <span>Code ${invite.code} · ${invite.discountPct}% off · ${invite.freeMonths} free month(s)</span>
      </div>
      <div class="workspace-inline-actions compact">
        <span class="pill-tag ${invite.status === 'redeemed' ? 'success' : ''}">${invite.status}</span>
        ${invite.status === 'pending' ? `<button class="btn-link" onclick="redeemInviteById(${invite.id})">Redeem</button>` : ''}
      </div>
    </div>
  `).join('');
}

function renderManagerInsights() {
  const el = $('workspaceManagerInsights');
  if (!el) return;

  const bookings = DB.bookings;
  const unassigned = bookings.filter(booking => !booking.technicianId && !['completed', 'cancelled'].includes(booking.status)).length;
  const pending = pendingApprovalCount();
  const todayKey = today();
  const overdue = bookings.filter(booking => booking.date && booking.date < todayKey && !['completed', 'cancelled'].includes(booking.status)).length;
  const revenueTarget = Number(getWorkspace().management.monthlyRevenueTarget || 0);
  const monthRevenue = DB.payments.filter(payment => {
    if (payment.status !== 'paid') return false;
    const paymentDate = toDateObj(payment.date);
    const now = new Date();
    return paymentDate.getFullYear() === now.getFullYear() && paymentDate.getMonth() === now.getMonth();
  }).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  el.innerHTML = `
    <div class="workspace-list-item">
      <div>
        <strong>Revenue Target Progress</strong>
        <span>${fmt(monthRevenue)} collected this month against ${fmt(revenueTarget)}</span>
      </div>
      <span class="pill-tag ${monthRevenue >= revenueTarget && revenueTarget > 0 ? 'success' : ''}">${revenueTarget > 0 ? `${Math.min(999, Math.round((monthRevenue / revenueTarget) * 100))}%` : 'N/A'}</span>
    </div>
    <div class="workspace-list-item">
      <div>
        <strong>Approval Queue</strong>
        <span>${pending} booking${pending === 1 ? '' : 's'} need manager review.</span>
      </div>
      <span class="pill-tag">${pending}</span>
    </div>
    <div class="workspace-list-item">
      <div>
        <strong>Dispatch Load</strong>
        <span>${unassigned} unassigned job${unassigned === 1 ? '' : 's'} and ${overdue} overdue booking${overdue === 1 ? '' : 's'}.</span>
      </div>
      <span class="pill-tag">Live</span>
    </div>
  `;
}

function renderWorkspaceFeatureGrid() {
  if (!$('workspaceFeatureGrid')) return;
  const features = [
    ['teamManagement', 'Employee seats, user access, and role-based staffing'],
    ['advancedScheduling', 'Advanced scheduling views, buffers, booking windows'],
    ['smartScheduling', 'Smart auto-assignment and technician balancing'],
    ['payrollAutomation', 'Payroll automation and revenue syncing'],
    ['advancedReports', 'Reporting, exports, and premium dashboards'],
    ['managerControls', 'Approval workflows, targets, and dispatch controls'],
    ['templatesPlus', 'Expanded client and employee communication templates'],
    ['affiliateProgram', 'Affiliate links, payout tracking, and partner codes'],
    ['referralRewards', 'Invite discounts and free month rewards'],
    ['installableApp', 'Installable iOS/desktop web app foundation'],
    ['unlimitedEmployees', 'Unlimited employee seats']
  ];

  $('workspaceFeatureGrid').innerHTML = features.map(([key, label]) => `
    <div class="feature-tile${hasFeature(key) ? ' enabled' : ''}">
      <span>${label}</span>
      <strong>${hasFeature(key) ? 'Included' : 'Upgrade required'}</strong>
    </div>
  `).join('');
}

function renderWorkspacePage() {
  const workspace = getWorkspace();
  workspace.teamRoles = workspace.teamRoles || DB.workspace.teamRoles;
  const teamLocked = !hasFeature('teamManagement');
  const managerLocked = !hasFeature('managerControls');
  const payrollLocked = !hasFeature('payrollAutomation');
  syncWorkspaceBranding();
  if ($('workspaceCompanyName')) $('workspaceCompanyName').value = workspace.companyName || '';
  if ($('workspaceBusinessCategory')) $('workspaceBusinessCategory').value = workspace.businessCategory || 'window-cleaning';
  if ($('workspaceCustomCategory')) $('workspaceCustomCategory').value = workspace.customCategory || '';
  if ($('workspaceIndustry')) $('workspaceIndustry').value = workspace.industry || '';
  if ($('workspaceBusinessEmail')) $('workspaceBusinessEmail').value = workspace.businessEmail || '';
  if ($('workspaceBillingCycle')) $('workspaceBillingCycle').value = workspace.billingCycle || 'monthly';
  if ($('workspaceSubscriptionStatus')) $('workspaceSubscriptionStatus').value = workspace.subscriptionStatus || 'trialing';

  if ($('workspaceBufferMinutes')) $('workspaceBufferMinutes').value = Number(workspace.scheduling.bufferMinutes || 15);
  if ($('workspaceBookingWindowDays')) $('workspaceBookingWindowDays').value = Number(workspace.scheduling.bookingWindowDays || 45);
  if ($('workspaceDefaultDuration')) $('workspaceDefaultDuration').value = String(workspace.scheduling.defaultDuration || 60);
  if ($('workspaceAutoConfirm')) $('workspaceAutoConfirm').value = String(Boolean(workspace.scheduling.autoConfirm));
  if ($('workspaceEditLockHours')) $('workspaceEditLockHours').value = Number(workspace.scheduling.editLockHours || 12);
  if ($('workspaceMaxTechJobs')) $('workspaceMaxTechJobs').value = Number(workspace.scheduling.maxJobsPerTechPerDay || 6);
  if ($('workspaceRoundRobin')) $('workspaceRoundRobin').checked = Boolean(workspace.scheduling.roundRobinRouting);
  if ($('prefEmployeePush')) $('prefEmployeePush').checked = Boolean(workspace.notificationPrefs.employeePush);
  if ($('prefDailyDigest')) $('prefDailyDigest').checked = Boolean(workspace.notificationPrefs.dailyDigest);
  if ($('prefLeadAlerts')) $('prefLeadAlerts').checked = Boolean(workspace.notificationPrefs.leadAlerts);
  if ($('prefPayrollAlerts')) $('prefPayrollAlerts').checked = Boolean(workspace.notificationPrefs.payrollAlerts);
  if ($('prefBrowserAlerts')) $('prefBrowserAlerts').checked = Boolean(workspace.notificationPrefs.browserAlerts);
  if ($('workspaceSessionTimeoutHours')) $('workspaceSessionTimeoutHours').value = Number(workspace.security.sessionTimeoutHours || 8);
  if ($('workspaceDefaultNewHireRole')) $('workspaceDefaultNewHireRole').value = workspace.security.defaultNewHireRole || 'technician';
  if ($('workspaceInviteOnlyAccess')) $('workspaceInviteOnlyAccess').checked = Boolean(workspace.security.inviteOnlyAccess);
  if ($('workspaceStrongPasswords')) $('workspaceStrongPasswords').checked = Boolean(workspace.security.requireStrongPasswords);
  if ($('workspaceAllowPasswordReset')) $('workspaceAllowPasswordReset').checked = Boolean(workspace.security.allowPasswordReset);
  if ($('workspaceManagerDeleteApproval')) $('workspaceManagerDeleteApproval').checked = Boolean(workspace.security.managerDeleteApproval);
  if ($('workspaceAffiliateCode')) $('workspaceAffiliateCode').value = workspace.growth.affiliateCode || '';
  if ($('workspaceAffiliateCommission')) $('workspaceAffiliateCommission').value = Number(workspace.growth.affiliateCommissionPct || 15);
  if ($('workspaceAffiliateCookieDays')) $('workspaceAffiliateCookieDays').value = Number(workspace.growth.affiliateCookieDays || 30);
  if ($('workspaceAffiliateMinPayout')) $('workspaceAffiliateMinPayout').value = Number(workspace.growth.affiliateMinPayout || 50);
  if ($('workspaceInviteDiscountPct')) $('workspaceInviteDiscountPct').value = Number(workspace.growth.inviteDiscountPct || 10);
  if ($('workspaceInviteFreeMonths')) $('workspaceInviteFreeMonths').value = Number(workspace.growth.inviteFreeMonths || 1);
  if ($('workspaceRevenueTarget')) $('workspaceRevenueTarget').value = Number(workspace.management.monthlyRevenueTarget || 25000);
  if ($('workspaceApprovalAmount')) $('workspaceApprovalAmount').value = Number(workspace.management.approvalRequiredOver || 1500);
  if ($('workspaceCompletionNotes')) $('workspaceCompletionNotes').checked = Boolean(workspace.management.requireCompletionNotes);
  if ($('workspaceEmployeeSelfAssign')) $('workspaceEmployeeSelfAssign').checked = Boolean(workspace.management.allowEmployeeSelfAssign);
  if ($('workspaceDispatchBoard')) $('workspaceDispatchBoard').checked = Boolean(workspace.management.advancedDispatchBoard);
  if ($('roleManagerLabel')) $('roleManagerLabel').value = workspace.teamRoles.manager?.label || 'Manager';
  if ($('roleSalesmanLabel')) $('roleSalesmanLabel').value = workspace.teamRoles.salesman?.label || 'Salesperson';
  if ($('roleTechnicianLabel')) $('roleTechnicianLabel').value = workspace.teamRoles.technician?.label || 'Technician';
  if ($('employeeRole')) {
    const roleOptions = {
      manager: workspace.teamRoles.manager?.label || 'Manager',
      salesman: workspace.teamRoles.salesman?.label || 'Salesperson',
      technician: workspace.teamRoles.technician?.label || 'Technician'
    };
    Array.from($('employeeRole').options).forEach(option => {
      if (roleOptions[option.value]) option.textContent = roleOptions[option.value];
    });
  }
  if ($('onboardJoinRole')) {
    const roleOptions = {
      manager: workspace.teamRoles.manager?.label || 'Manager',
      salesman: workspace.teamRoles.salesman?.label || 'Salesperson',
      technician: workspace.teamRoles.technician?.label || 'Technician'
    };
    Array.from($('onboardJoinRole').options).forEach(option => {
      if (roleOptions[option.value]) option.textContent = roleOptions[option.value];
    });
  }

  const rolePrefixMap = {
    manager: 'roleManager',
    salesman: 'roleSalesman',
    technician: 'roleTechnician'
  };
  Object.entries(rolePrefixMap).forEach(([roleKey, prefix]) => {
    const perms = getDefaultEmployeePermissions(roleKey);
    if ($(`${prefix}CreateBookings`)) $(`${prefix}CreateBookings`).checked = Boolean(perms.createBookings);
    if ($(`${prefix}EditBookings`)) $(`${prefix}EditBookings`).checked = Boolean(perms.editBookings);
    if ($(`${prefix}AssignBookings`)) $(`${prefix}AssignBookings`).checked = Boolean(perms.assignBookings);
    if ($(`${prefix}ManageClients`)) $(`${prefix}ManageClients`).checked = Boolean(perms.manageClients);
    if ($(`${prefix}ManageEmployees`)) $(`${prefix}ManageEmployees`).checked = Boolean(perms.manageEmployees);
    if ($(`${prefix}ViewRevenue`)) $(`${prefix}ViewRevenue`).checked = Boolean(perms.viewRevenue);
    if ($(`${prefix}ViewPayroll`)) $(`${prefix}ViewPayroll`).checked = Boolean(perms.viewPayroll);
  });

  if ($('managerBookingQuestions')) {
    const questionLines = normalizeManagerBookingQuestions(workspace.teamRoles.manager?.bookingQuestions || [])
      .map(question => `${question.label}${question.type === 'yesno' ? '::yesno' : ''}`);
    $('managerBookingQuestions').value = questionLines.join('\n');
  }
  if ($('workspaceCurrentEmailVerificationTarget')) {
    $('workspaceCurrentEmailVerificationTarget').value = workspace.businessEmail || '';
  }
  if ($('workspaceNewEmailVerificationTarget')) {
    $('workspaceNewEmailVerificationTarget').value = workspace.businessEmail || '';
  }

  if ($('workspaceSeatsUsed')) $('workspaceSeatsUsed').textContent = getSeatLimitText();
  if ($('workspaceReferralSavings')) {
    const referralSavings = workspaceInvites().filter(invite => invite.status === 'redeemed').reduce((sum, invite) => sum + inviteRewardValue(invite), 0);
    $('workspaceReferralSavings').textContent = fmt(referralSavings);
  }
  if ($('workspaceAffiliatePayout')) $('workspaceAffiliatePayout').textContent = fmt(affiliatePayoutDue());
  if ($('workspaceApprovalQueue')) $('workspaceApprovalQueue').textContent = String(pendingApprovalCount());

  ['workspaceMaxTechJobs', 'workspaceDefaultNewHireRole', 'workspaceInviteOnlyAccess'].forEach(id => {
    if ($(id)) $(id).disabled = teamLocked;
  });
  ['workspaceApprovalAmount', 'workspaceRevenueTarget', 'workspaceCompletionNotes', 'workspaceEmployeeSelfAssign', 'workspaceDispatchBoard', 'workspaceManagerDeleteApproval'].forEach(id => {
    if ($(id)) $(id).disabled = managerLocked;
  });
  if ($('prefPayrollAlerts')) $('prefPayrollAlerts').disabled = payrollLocked;

  const adminOnlyIds = [
    'workspaceCompanyName', 'workspaceBusinessCategory', 'workspaceCustomCategory', 'workspaceIndustry',
    'workspaceSubscriptionStatus', 'workspaceBillingCycle', 'workspaceBufferMinutes', 'workspaceBookingWindowDays',
    'workspaceDefaultDuration', 'workspaceAutoConfirm', 'workspaceEditLockHours', 'workspaceMaxTechJobs', 'workspaceRoundRobin',
    'workspaceSessionTimeoutHours', 'workspaceDefaultNewHireRole', 'workspaceInviteOnlyAccess', 'workspaceStrongPasswords',
    'workspaceAllowPasswordReset', 'workspaceManagerDeleteApproval', 'workspaceAffiliateCode', 'workspaceAffiliateCommission',
    'workspaceAffiliateCookieDays', 'workspaceAffiliateMinPayout', 'workspaceInviteDiscountPct', 'workspaceInviteFreeMonths',
    'workspaceRevenueTarget', 'workspaceApprovalAmount', 'workspaceCompletionNotes', 'workspaceEmployeeSelfAssign',
    'workspaceDispatchBoard', 'roleManagerLabel', 'roleSalesmanLabel', 'roleTechnicianLabel'
  ];
  adminOnlyIds.forEach(id => {
    if ($(id)) $(id).disabled = !isAdmin();
  });

  ['starter', 'professional', 'premium'].forEach(plan => {
    const el = $(`plan${plan.charAt(0).toUpperCase() + plan.slice(1)}`);
    if (el) el.classList.toggle('selected', workspace.plan === plan);
  });

  refreshPlanCardPrices();

  renderWorkspaceAccessSummary();
  renderAffiliateProgram();
  renderWorkspaceServiceCatalog();
  renderServiceSuggestions();
  updateWebAppStatus();
  renderInviteProgram();
  renderManagerInsights();
  renderWorkspaceFeatureGrid();
}

function saveWorkspaceSettings() {
  const workspace = getWorkspace();
  const requestedBusinessEmail = normalizeEmail($('workspaceBusinessEmail').value) || workspace.businessEmail;
  const currentBusinessEmail = normalizeEmail(workspace.businessEmail || '');

  if (requestedBusinessEmail !== currentBusinessEmail) {
    const oldVerified = workspaceEmailVerificationState.oldVerified && workspaceEmailVerificationState.oldEmail === currentBusinessEmail;
    const newVerified = workspaceEmailVerificationState.newVerified && workspaceEmailVerificationState.newEmail === requestedBusinessEmail;
    if (!oldVerified || !newVerified) {
      showToast('Verify the old email and the new email before saving this change.', 'error');
      return;
    }
  }

  if (!isAdmin()) {
    workspace.teamRoles = workspace.teamRoles || DB.workspace.teamRoles;
    workspace.teamRoles.manager = workspace.teamRoles.manager || { label: 'Manager', baseRole: 'manager', permissions: getDefaultEmployeePermissions('manager'), bookingQuestions: [] };
    workspace.teamRoles.manager.bookingQuestions = parseManagerBookingQuestionsInput($('managerBookingQuestions')?.value || '');
    saveWorkspace(workspace);
    showToast('Manager booking questions saved.');
    return;
  }

  workspace.companyName = $('workspaceCompanyName').value.trim() || 'My Company';
  workspace.businessCategory = $('workspaceBusinessCategory').value;
  workspace.customCategory = $('workspaceCustomCategory').value.trim();
  workspace.industry = $('workspaceIndustry').value.trim();
  workspace.businessEmail = requestedBusinessEmail;
  workspace.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || workspace.timezone || 'UTC';
  workspace.billingCycle = $('workspaceBillingCycle').value || 'monthly';
  workspace.subscriptionStatus = $('workspaceSubscriptionStatus')?.value || workspace.subscriptionStatus || 'trialing';
  workspace.notificationPrefs = {
    employeePush: $('prefEmployeePush').checked,
    dailyDigest: $('prefDailyDigest').checked,
    leadAlerts: $('prefLeadAlerts').checked,
    payrollAlerts: $('prefPayrollAlerts').checked,
    browserAlerts: $('prefBrowserAlerts').checked
  };
  workspace.scheduling = {
    bufferMinutes: Number($('workspaceBufferMinutes').value || 15),
    bookingWindowDays: Number($('workspaceBookingWindowDays').value || 45),
    defaultDuration: Number($('workspaceDefaultDuration').value || 60),
    autoConfirm: $('workspaceAutoConfirm').value === 'true',
    editLockHours: Number($('workspaceEditLockHours').value || 12),
    maxJobsPerTechPerDay: Number($('workspaceMaxTechJobs').value || 6),
    roundRobinRouting: $('workspaceRoundRobin').checked
  };
  workspace.security = {
    inviteOnlyAccess: $('workspaceInviteOnlyAccess').checked,
    requireStrongPasswords: $('workspaceStrongPasswords').checked,
    allowPasswordReset: $('workspaceAllowPasswordReset').checked,
    sessionTimeoutHours: Number($('workspaceSessionTimeoutHours').value || 8),
    managerDeleteApproval: $('workspaceManagerDeleteApproval').checked,
    defaultNewHireRole: $('workspaceDefaultNewHireRole').value
  };
  workspace.management = {
    monthlyRevenueTarget: Number($('workspaceRevenueTarget').value || 0),
    approvalRequiredOver: Number($('workspaceApprovalAmount').value || 0),
    requireCompletionNotes: $('workspaceCompletionNotes').checked,
    allowEmployeeSelfAssign: $('workspaceEmployeeSelfAssign').checked,
    advancedDispatchBoard: $('workspaceDispatchBoard').checked
  };
  workspace.teamRoles = {
    manager: {
      label: $('roleManagerLabel')?.value.trim() || 'Manager',
      baseRole: 'manager',
      permissions: {
        createBookings: Boolean($('roleManagerCreateBookings')?.checked),
        editBookings: Boolean($('roleManagerEditBookings')?.checked),
        assignBookings: Boolean($('roleManagerAssignBookings')?.checked),
        manageClients: Boolean($('roleManagerManageClients')?.checked),
        manageEmployees: Boolean($('roleManagerManageEmployees')?.checked),
        viewRevenue: Boolean($('roleManagerViewRevenue')?.checked),
        viewPayroll: Boolean($('roleManagerViewPayroll')?.checked)
      },
      bookingQuestions: parseManagerBookingQuestionsInput($('managerBookingQuestions')?.value || '')
    },
    salesman: {
      label: $('roleSalesmanLabel')?.value.trim() || 'Salesperson',
      baseRole: 'salesman',
      permissions: {
        createBookings: Boolean($('roleSalesmanCreateBookings')?.checked),
        editBookings: Boolean($('roleSalesmanEditBookings')?.checked),
        assignBookings: Boolean($('roleSalesmanAssignBookings')?.checked),
        manageClients: Boolean($('roleSalesmanManageClients')?.checked),
        manageEmployees: Boolean($('roleSalesmanManageEmployees')?.checked),
        viewRevenue: Boolean($('roleSalesmanViewRevenue')?.checked),
        viewPayroll: Boolean($('roleSalesmanViewPayroll')?.checked)
      },
      bookingQuestions: []
    },
    technician: {
      label: $('roleTechnicianLabel')?.value.trim() || 'Technician',
      baseRole: 'technician',
      permissions: {
        createBookings: Boolean($('roleTechnicianCreateBookings')?.checked),
        editBookings: Boolean($('roleTechnicianEditBookings')?.checked),
        assignBookings: Boolean($('roleTechnicianAssignBookings')?.checked),
        manageClients: Boolean($('roleTechnicianManageClients')?.checked),
        manageEmployees: Boolean($('roleTechnicianManageEmployees')?.checked),
        viewRevenue: Boolean($('roleTechnicianViewRevenue')?.checked),
        viewPayroll: Boolean($('roleTechnicianViewPayroll')?.checked)
      },
      bookingQuestions: []
    }
  };
  workspace.growth = {
    ...workspace.growth,
    affiliateEnabled: Boolean(workspace.growth?.affiliateEnabled),
    affiliateCode: $('workspaceAffiliateCode').value.trim().toUpperCase() || makeCode('AFF'),
    affiliateCommissionPct: Number($('workspaceAffiliateCommission').value || 15),
    affiliateCookieDays: Number($('workspaceAffiliateCookieDays').value || 30),
    affiliateMinPayout: Number($('workspaceAffiliateMinPayout').value || 50),
    inviteDiscountPct: Number($('workspaceInviteDiscountPct').value || 10),
    inviteFreeMonths: Number($('workspaceInviteFreeMonths').value || 1),
    affiliates: workspace.growth.affiliates || [],
    invites: workspace.growth.invites || []
  };
  workspace.onboarded = true;
  saveWorkspace(workspace);
  addNotification(`Workspace settings updated for ${workspace.companyName}.`, null, 'system');
  renderServiceSuggestions();
  renderWorkspacePage();
  showToast('Workspace settings saved.');

  workspaceEmailVerificationState.oldEmail = '';
  workspaceEmailVerificationState.newEmail = '';
  workspaceEmailVerificationState.oldVerified = false;
  workspaceEmailVerificationState.newVerified = false;
}

function selectWorkspacePlan(plan) {
  const definition = PLAN_DEFINITIONS[plan];
  if (!definition) return;
  const workspace = getWorkspace();
  if (workspace.freeForeverPlanLock) {
    showToast('This workspace is locked to Premium free forever.', 'info');
    return;
  }
  workspace.plan = plan;
  saveWorkspace(workspace);
  addNotification(`Workspace plan changed to ${definition.label}.`, null, 'system');
  renderWorkspacePage();
  applyRolePermissions();
  if (workspaceFeatureLock(currentPage)) navigateTo('dashboard');
}

function generateAffiliateCode() {
  const workspace = getWorkspace();
  workspace.growth.affiliateCode = makeCode('AFF');
  saveWorkspace(workspace);
  renderWorkspacePage();
  const message = renderTemplate(DB.templates.affiliateWelcome, {
    code: workspace.growth.affiliateCode,
    commission: workspace.growth.affiliateCommissionPct
  });
  if (workspace.notificationPrefs.leadAlerts) addNotification(message, null, 'system');
  showToast('New affiliate code generated.');
}

function createAffiliatePartner() {
  const name = $('affiliatePartnerName')?.value.trim();
  const email = normalizeEmail($('affiliatePartnerEmail')?.value);
  if (!name) {
    showToast('Affiliate name is required.', 'error');
    return;
  }

  const workspace = getWorkspace();
  workspace.growth = workspace.growth || {};
  const affiliates = workspace.growth.affiliates || [];
  if (email && affiliates.some(affiliate => normalizeEmail(affiliate.email) === email)) {
    showToast('An affiliate with that email already exists.', 'error');
    return;
  }

  const users = DB.users;
  const existingUser = users.find(user => normalizeEmail(user.email) === email);
  if (email && existingUser && existingUser.role !== 'affiliate') {
    showToast('That email is already used by another account type.', 'error');
    return;
  }

  const defaultPassword = 'Affiliate@123';
  affiliates.push({
    id: affiliates.length ? Math.max(...affiliates.map(affiliate => affiliate.id || 0)) + 1 : 1,
    name,
    email,
    code: generateUniqueAffiliateCode(),
    commissionPct: Number(workspace.growth.affiliateCommissionPct || 15),
    clicks: 0,
    conversions: 0,
    revenueAttributed: 0,
    payoutDue: 0,
    payoutPaid: 0,
    status: 'active',
    signupSource: 'owner-created',
    createdAt: new Date().toISOString()
  });
  workspace.growth.affiliates = affiliates;
  workspace.growth.affiliateEvents = workspace.growth.affiliateEvents || [];
  workspace.growth.affiliateEvents.push({
    id: DB.nextId(workspace.growth.affiliateEvents),
    type: 'affiliate_signup',
    affiliateEmail: email,
    amount: 0,
    createdAt: new Date().toISOString(),
    details: `Affiliate account created for ${name}.`
  });

  if (email) {
    if (existingUser) {
      existingUser.role = 'affiliate';
      existingUser.name = name;
      existingUser.status = 'active';
    } else {
      users.push({
        id: DB.nextId(users),
        email,
        passwordHash: hashPassword(defaultPassword),
        role: 'affiliate',
        employeeId: null,
        status: 'active',
        name,
        createdAt: new Date().toISOString()
      });
    }
    DB.saveUsers(users);
  }

  saveWorkspace(workspace);
  $('affiliatePartnerName').value = '';
  $('affiliatePartnerEmail').value = '';
  renderWorkspacePage();
  if ($('affiliatePortalPartnerName')) $('affiliatePortalPartnerName').value = '';
  if ($('affiliatePortalPartnerEmail')) $('affiliatePortalPartnerEmail').value = '';
  renderAffiliatePortalPage();
  showToast(email ? `Affiliate partner added. Temporary password: ${defaultPassword}` : 'Affiliate partner added.');
}

function logAffiliateConversion(affiliateId = null) {
  const workspace = getWorkspace();
  const affiliates = workspace.growth.affiliates || [];
  const affiliate = affiliateId
    ? affiliates.find(entry => entry.id === Number(affiliateId))
    : affiliates[0];

  if (!affiliate) {
    showToast('Add an affiliate partner first.', 'info');
    return;
  }

  const referredPlanValue = Number(getPlanPrice('professional') || 50);
  const commission = referredPlanValue * (Number(affiliate.commissionPct || workspace.growth.affiliateCommissionPct || 15) / 100);
  affiliate.conversions = Number(affiliate.conversions || 0) + 1;
  affiliate.revenueAttributed = Number((Number(affiliate.revenueAttributed || 0) + referredPlanValue).toFixed(2));
  affiliate.payoutDue = Number((Number(affiliate.payoutDue || 0) + commission).toFixed(2));
  affiliate.lastConversionAt = new Date().toISOString();

  workspace.growth.affiliateEvents = workspace.growth.affiliateEvents || [];
  workspace.growth.affiliateEvents.push({
    id: DB.nextId(workspace.growth.affiliateEvents),
    type: 'conversion',
    affiliateEmail: affiliate.email,
    amount: Number(commission.toFixed(2)),
    revenue: referredPlanValue,
    createdAt: new Date().toISOString(),
    details: `Conversion logged for ${affiliate.name}.`
  });

  saveWorkspace(workspace);
  renderWorkspacePage();
  renderAffiliatePortalPage();
  if (workspace.notificationPrefs.leadAlerts) addNotification(`Affiliate sale logged for ${affiliate.name}. Commission due: ${fmt(commission)}.`, null, 'system');
  showToast('Affiliate conversion recorded.');
}

function createInviteOffer() {
  const email = normalizeEmail($('workspaceInviteEmail')?.value);
  if (!email) {
    showToast('Invite email is required.', 'error');
    return;
  }

  const workspace = getWorkspace();
  const invites = workspace.growth.invites || [];
  const invite = {
    id: invites.length ? Math.max(...invites.map(entry => entry.id || 0)) + 1 : 1,
    email,
    code: makeCode('INVITE'),
    status: 'pending',
    discountPct: Number(workspace.growth.inviteDiscountPct || 10),
    freeMonths: Number(workspace.growth.inviteFreeMonths || 1),
    discountCredit: 0,
    createdAt: new Date().toISOString(),
    redeemedAt: null
  };
  invites.push(invite);
  workspace.growth.invites = invites;
  saveWorkspace(workspace);
  $('workspaceInviteEmail').value = '';
  $('workspaceRedeemInviteCode').value = invite.code;
  renderWorkspacePage();
  const inviteMessage = renderTemplate(DB.templates.inviteOffer, {
    code: invite.code,
    discount: invite.discountPct,
    freeMonths: invite.freeMonths
  });
  if (workspace.notificationPrefs.leadAlerts) addNotification(`Invite created for ${email}: ${inviteMessage}`, null, 'system');
  showToast('Invite created.');
}

function redeemInviteById(inviteId) {
  const workspace = getWorkspace();
  const invite = (workspace.growth.invites || []).find(entry => entry.id === Number(inviteId));
  if (!invite || invite.status === 'redeemed') {
    showToast('Invite is not available to redeem.', 'info');
    return;
  }

  invite.status = 'redeemed';
  invite.discountCredit = Number((49 * (Number(invite.discountPct || 0) / 100)).toFixed(2));
  invite.redeemedAt = new Date().toISOString();
  saveWorkspace(workspace);
  renderWorkspacePage();
  if (workspace.notificationPrefs.leadAlerts) addNotification(`Invite ${invite.code} redeemed. Reward value: ${fmt(inviteRewardValue(invite))}.`, null, 'system');
  showToast('Invite redeemed and rewards applied.');
}

function redeemInviteCode() {
  const code = String($('workspaceRedeemInviteCode')?.value || '').trim().toUpperCase();
  if (!code) {
    showToast('Enter an invite code to redeem.', 'error');
    return;
  }

  const invite = workspaceInvites().find(entry => String(entry.code || '').toUpperCase() === code && entry.status !== 'redeemed');
  if (!invite) {
    showToast('Invite code not found.', 'error');
    return;
  }

  redeemInviteById(invite.id);
}

function markAffiliatePayoutPaid(affiliateId) {
  if (!isAdmin()) {
    showToast('Only owners can process payouts.', 'error');
    return;
  }

  const workspace = getWorkspace();
  const affiliates = workspace.growth.affiliates || [];
  const affiliate = affiliates.find(entry => Number(entry.id) === Number(affiliateId));
  if (!affiliate) {
    showToast('Affiliate not found.', 'error');
    return;
  }

  const due = Number(affiliate.payoutDue || 0);
  if (due <= 0) {
    showToast('No payout due for this affiliate.', 'info');
    return;
  }

  affiliate.payoutDue = 0;
  affiliate.payoutPaid = Number((Number(affiliate.payoutPaid || 0) + due).toFixed(2));
  affiliate.lastPayoutAt = new Date().toISOString();
  workspace.growth.payoutHistory = workspace.growth.payoutHistory || [];
  workspace.growth.payoutHistory.push({
    id: DB.nextId(workspace.growth.payoutHistory),
    affiliateId: affiliate.id,
    affiliateName: affiliate.name,
    amount: due,
    method: workspace.growth.affiliatePayoutMethod || 'bank-transfer',
    createdAt: new Date().toISOString()
  });

  workspace.growth.affiliateEvents = workspace.growth.affiliateEvents || [];
  workspace.growth.affiliateEvents.push({
    id: DB.nextId(workspace.growth.affiliateEvents),
    type: 'payout',
    affiliateEmail: affiliate.email,
    amount: due,
    createdAt: new Date().toISOString(),
    details: `Payout sent to ${affiliate.name}.`
  });

  saveWorkspace(workspace);
  renderAffiliatePortalPage();
  showToast(`Payout marked as paid: ${fmt(due)}.`);
}

function saveAffiliateProgramSettings() {
  if (!isAdmin()) {
    showToast('Only owners can edit affiliate program settings.', 'error');
    return;
  }

  const workspace = getWorkspace();
  workspace.growth = workspace.growth || {};
  workspace.growth.affiliateEnabled = $('affiliateEnabledSelect')?.value !== 'false';
  if (!workspace.growth.affiliateEnabled) workspace.growth.affiliateSignupEnabled = false;
  workspace.growth.affiliateCommissionPct = Math.max(1, Number($('affiliateCommissionPctInput')?.value || 15));
  workspace.growth.affiliateCookieDays = Math.max(1, Number($('affiliateCookieDaysInput')?.value || 30));
  workspace.growth.affiliateMinPayout = Math.max(0, Number($('affiliateMinPayoutInput')?.value || 50));
  workspace.growth.affiliatePayoutEmail = normalizeEmail($('affiliatePayoutEmailInput')?.value || '');
  workspace.growth.affiliatePayoutMethod = $('affiliatePayoutMethodSelect')?.value || 'bank-transfer';
  workspace.growth.affiliateVenmoHandle = String($('affiliateVenmoHandleInput')?.value || '').trim();
  workspace.growth.affiliateTermsUrl = String($('affiliateTermsUrlInput')?.value || '').trim();
  workspace.growth.affiliateSignupCode = String(workspace.growth.affiliateSignupCode || 'AFFILIATE').toUpperCase();
  workspace.growth.affiliates = workspace.growth.affiliates || [];
  workspace.growth.invites = workspace.growth.invites || [];
  workspace.growth.affiliateEvents = workspace.growth.affiliateEvents || [];
  workspace.growth.payoutHistory = workspace.growth.payoutHistory || [];
  saveWorkspace(workspace);
  renderAffiliatePortalPage();
  showToast('Affiliate program settings saved.');
}

async function copyAffiliateSignupLink() {
  const url = getAffiliateSignupLink();
  if (!url) {
    showToast('Enable affiliate partner signups first.', 'error');
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    showToast('Affiliate signup link copied.');
  } catch {
    showToast(url);
  }
}

async function copyAffiliateReferralLink(affiliateId) {
  const affiliate = workspaceAffiliates().find(entry => Number(entry.id) === Number(affiliateId));
  if (!affiliate?.code) {
    showToast('Affiliate link is not available.', 'error');
    return;
  }
  const url = getAffiliateReferralLink(affiliate.code);
  try {
    await navigator.clipboard.writeText(url);
    showToast('Referral link copied.');
  } catch {
    showToast(url);
  }
}

function completeAffiliateSignup() {
  const firstName = String($('affiliateSignupFirstName')?.value || '').trim();
  const lastName = String($('affiliateSignupLastName')?.value || '').trim();
  const name = `${firstName} ${lastName}`.trim();
  const email = normalizeEmail($('affiliateSignupEmail')?.value || '');
  const password = String($('affiliateSignupPassword')?.value || '');
  const signupCode = String($('affiliateSignupBusinessCode')?.value || '').trim().toUpperCase();
  const commissionOverride = Number($('affiliateSignupCommission')?.value || 0);

  if (!name || !email || !password) {
    showToast('Name, email, and password are required.', 'error');
    return;
  }
  if (!emailVerificationState.affiliate.verified || emailVerificationState.affiliate.email !== email) {
    showToast('Verify your affiliate email before creating your account.', 'error');
    return;
  }
  if (!passwordMeetsPolicy(password)) {
    showToast('Password does not meet security policy.', 'error');
    return;
  }

  const workspace = getWorkspace();
  if (!workspace.growth?.affiliateEnabled || workspace.growth?.affiliateSignupEnabled === false) {
    showToast('Affiliate signup is not enabled for this workspace.', 'error');
    return;
  }
  const requiredSignupCode = String(workspace.growth.affiliateSignupCode || 'AFFILIATE').toUpperCase();
  if (signupCode && signupCode !== requiredSignupCode && signupCode !== String(workspace.growth.affiliateCode || '').toUpperCase()) {
    showToast('Invalid business affiliate signup code.', 'error');
    return;
  }

  const users = DB.users;
  if (users.some(user => normalizeEmail(user.email) === email && user.status !== 'inactive')) {
    showToast('Email is already registered.', 'error');
    return;
  }

  const affiliates = workspace.growth.affiliates || [];
  if (affiliates.some(affiliate => normalizeEmail(affiliate.email) === email)) {
    showToast('Affiliate account already exists for this email.', 'error');
    return;
  }

  const affiliate = {
    id: affiliates.length ? Math.max(...affiliates.map(entry => entry.id || 0)) + 1 : 1,
    name,
    email,
    code: generateUniqueAffiliateCode(),
    commissionPct: commissionOverride > 0 ? commissionOverride : Number(workspace.growth.affiliateCommissionPct || 15),
    clicks: 0,
    conversions: 0,
    revenueAttributed: 0,
    payoutDue: 0,
    payoutPaid: 0,
    status: 'active',
    signupSource: 'self-signup',
    createdAt: new Date().toISOString()
  };

  affiliates.push(affiliate);
  workspace.growth.affiliates = affiliates;
  workspace.growth.affiliateEvents = workspace.growth.affiliateEvents || [];
  workspace.growth.affiliateEvents.push({
    id: DB.nextId(workspace.growth.affiliateEvents),
    type: 'affiliate_signup',
    affiliateEmail: email,
    amount: 0,
    createdAt: new Date().toISOString(),
    details: `${name} signed up as an affiliate.`
  });
  saveWorkspace(workspace);

  users.push({
    id: DB.nextId(users),
    email,
    passwordHash: hashPassword(password),
    role: 'affiliate',
    employeeId: null,
    status: 'active',
    name,
    createdAt: new Date().toISOString()
  });
  DB.saveUsers(users);

  closeModal('affiliateSignupModal');
  $('affiliateSignupFirstName').value = '';
  $('affiliateSignupLastName').value = '';
  $('affiliateSignupEmail').value = '';
  $('affiliateSignupPassword').value = '';
  if ($('affiliateSignupVerificationCode')) $('affiliateSignupVerificationCode').value = '';
  $('affiliateSignupBusinessCode').value = '';
  $('affiliateSignupCommission').value = '';
  emailVerificationState.affiliate = { email: '', verified: false };

  if (workspace.notificationPrefs.leadAlerts) {
    addNotification(`${name} joined as an affiliate partner.`, null, 'system');
  }

  showToast(`Affiliate account created. Your code: ${affiliate.code}`);
}

function renderAffiliatePortalPage() {
  const workspace = getWorkspace();
  const growth = workspace.growth || {};
  const affiliates = workspaceAffiliates();
  const events = workspaceAffiliateEvents().slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const payoutHistory = workspaceAffiliatePayoutHistory();
  const currentAffiliate = getCurrentAffiliate();
  const ownerView = isAdmin();

  if ($('affiliateEnabledSelect')) $('affiliateEnabledSelect').value = String(Boolean(growth.affiliateEnabled));
  if ($('affiliateCommissionPctInput')) $('affiliateCommissionPctInput').value = Number(growth.affiliateCommissionPct || 15);
  if ($('affiliateCookieDaysInput')) $('affiliateCookieDaysInput').value = Number(growth.affiliateCookieDays || 30);
  if ($('affiliateMinPayoutInput')) $('affiliateMinPayoutInput').value = Number(growth.affiliateMinPayout || 50);
  if ($('affiliatePayoutEmailInput')) $('affiliatePayoutEmailInput').value = growth.affiliatePayoutEmail || workspace.businessEmail || '';
  if ($('affiliatePayoutMethodSelect')) $('affiliatePayoutMethodSelect').value = growth.affiliatePayoutMethod || 'bank-transfer';
  if ($('affiliateVenmoHandleInput')) $('affiliateVenmoHandleInput').value = growth.affiliateVenmoHandle || '';
  if ($('affiliateTermsUrlInput')) $('affiliateTermsUrlInput').value = growth.affiliateTermsUrl || `${window.location.origin}/affiliate-terms`;

  const totalConversions = affiliates.reduce((sum, affiliate) => sum + Number(affiliate.conversions || 0), 0);
  const totalRevenue = affiliates.reduce((sum, affiliate) => sum + Number(affiliate.revenueAttributed || 0), 0);
  const due = affiliates.reduce((sum, affiliate) => sum + Number(affiliate.payoutDue || 0), 0);
  const paid = payoutHistory.reduce((sum, payout) => sum + Number(payout.amount || 0), 0);
  const totalClicks = affiliates.reduce((sum, affiliate) => sum + Number(affiliate.clicks || 0), 0);
  const totalSignups = affiliates.length;

  if ($('affiliatePortalStatsGrid')) {
    if (ownerView) {
      $('affiliatePortalStatsGrid').innerHTML = `
        <div class="stat-card accent-blue"><div class="stat-icon"><i class="fas fa-user-plus"></i></div><div class="stat-info"><span class="stat-label">Affiliate Sign Ups</span><span class="stat-value">${totalSignups}</span></div></div>
        <div class="stat-card accent-green"><div class="stat-icon"><i class="fas fa-arrow-trend-up"></i></div><div class="stat-info"><span class="stat-label">Tracked Conversions</span><span class="stat-value">${totalConversions}</span></div></div>
        <div class="stat-card accent-purple"><div class="stat-icon"><i class="fas fa-sack-dollar"></i></div><div class="stat-info"><span class="stat-label">Revenue You Made</span><span class="stat-value">${fmt(totalRevenue)}</span></div></div>
        <div class="stat-card accent-orange"><div class="stat-icon"><i class="fas fa-money-check-dollar"></i></div><div class="stat-info"><span class="stat-label">Commission Owed</span><span class="stat-value">${fmt(due)}</span></div></div>
        <div class="stat-card accent-cyan"><div class="stat-icon"><i class="fas fa-hand-holding-dollar"></i></div><div class="stat-info"><span class="stat-label">Payouts Paid</span><span class="stat-value">${fmt(paid)}</span></div></div>
        <div class="stat-card accent-red"><div class="stat-icon"><i class="fas fa-key"></i></div><div class="stat-info"><span class="stat-label">Primary Program Code</span><span class="stat-value">${growth.affiliateCode || '-'}</span></div></div>
      `;
    } else {
      const myAffiliate = currentAffiliate || { code: '-', commissionPct: growth.affiliateCommissionPct || 15, conversions: 0, payoutDue: 0, revenueAttributed: 0 };
      const referralLink = getAffiliateReferralLink(myAffiliate.code || '');
      $('affiliatePortalStatsGrid').innerHTML = `
        <div class="stat-card accent-blue"><div class="stat-icon"><i class="fas fa-ticket"></i></div><div class="stat-info"><span class="stat-label">My Referral Code</span><span class="stat-value">${myAffiliate.code || '-'}</span></div></div>
        <div class="stat-card accent-purple"><div class="stat-icon"><i class="fas fa-percent"></i></div><div class="stat-info"><span class="stat-label">Commission Rate</span><span class="stat-value">${Number(myAffiliate.commissionPct || 0)}%</span></div></div>
        <div class="stat-card accent-green"><div class="stat-icon"><i class="fas fa-arrow-trend-up"></i></div><div class="stat-info"><span class="stat-label">My Conversions</span><span class="stat-value">${Number(myAffiliate.conversions || 0)}</span></div></div>
        <div class="stat-card accent-orange"><div class="stat-icon"><i class="fas fa-wallet"></i></div><div class="stat-info"><span class="stat-label">My Earnings</span><span class="stat-value">${fmt(myAffiliate.revenueAttributed || 0)}</span></div></div>
        <div class="stat-card accent-cyan"><div class="stat-icon"><i class="fas fa-link"></i></div><div class="stat-info"><span class="stat-label">My Referral Link</span><span class="stat-value" style="font-size:12px;">${referralLink}</span></div></div>
      `;
    }
  }

  if ($('affiliateLaunchChecklist')) {
    const checks = [
      { ok: Boolean(growth.affiliateEnabled), text: 'Affiliate program enabled' },
      { ok: Number(growth.affiliateCommissionPct || 0) > 0, text: 'Commission rate configured' },
      { ok: Number(growth.affiliateCookieDays || 0) >= 7, text: 'Cookie window configured (>= 7 days)' },
      { ok: Boolean(growth.affiliatePayoutEmail || workspace.businessEmail), text: 'Payout contact email set' },
      { ok: Boolean(growth.affiliatePayoutMethod), text: 'Payout method selected' },
      { ok: Boolean(growth.affiliateTermsUrl), text: 'Affiliate terms URL provided' },
      { ok: Boolean(growth.affiliateEnabled && growth.affiliateSignupEnabled !== false && String(growth.affiliateSignupCode || '').trim()), text: 'Affiliate signup flow is live' },
      { ok: false, text: 'Stripe key pending (owner will provide last)' }
    ];

    $('affiliateLaunchChecklist').innerHTML = checks.map(check => `
      <div class="workspace-list-item">
        <div>
          <strong>${check.text}</strong>
          <span>${check.ok ? 'Ready' : 'Needs setup'}</span>
        </div>
        <span class="pill-tag ${check.ok ? 'success' : ''}">${check.ok ? 'OK' : 'Pending'}</span>
      </div>
    `).join('');
  }

  if (backendState.available && $('affiliateLaunchChecklist')) {
    apiRequest('/api/launch-readiness', { auth: false }).then(response => {
      const apiChecks = Array.isArray(response?.checks) ? response.checks : [];
      if (!apiChecks.length || !$('affiliateLaunchChecklist')) return;
      $('affiliateLaunchChecklist').innerHTML += apiChecks.map(check => `
        <div class="workspace-list-item">
          <div>
            <strong>${String(check.key || '').replaceAll('_', ' ')}</strong>
            <span>${check.detail || ''}</span>
          </div>
          <span class="pill-tag ${check.ok ? 'success' : ''}">${check.ok ? 'OK' : 'Pending'}</span>
        </div>
      `).join('');
    }).catch(() => {});
  }

  if ($('affiliatePartnerList')) {
    const visibleAffiliates = ownerView
      ? affiliates
      : affiliates.filter(affiliate => normalizeEmail(affiliate.email) === normalizeEmail(currentSession?.email || ''));

    $('affiliatePartnerList').innerHTML = visibleAffiliates.length
      ? visibleAffiliates.map(affiliate => `
        <div class="workspace-list-item">
          <div>
            <strong>${affiliate.name}</strong>
            <span>${affiliate.email || 'No email'} · Joined ${fmtDate((affiliate.createdAt || '').slice(0, 10) || today())} · Code ${affiliate.code}</span>
            <span style="display:block;margin-top:4px;font-size:12px;color:var(--text-secondary);">${getAffiliateReferralLink(affiliate.code)}</span>
          </div>
          <div class="workspace-inline-actions compact">
            <span class="pill-tag">${Number(affiliate.conversions || 0)} sales</span>
            <span class="pill-tag">Made ${fmt(affiliate.revenueAttributed || 0)}</span>
            <span class="pill-tag">Due ${fmt(affiliate.payoutDue || 0)}</span>
            ${ownerView ? `<button class="btn-link" onclick="copyAffiliateReferralLink(${affiliate.id})">Copy Link</button>` : ''}
            ${ownerView ? `<button class="btn-link" onclick="logAffiliateConversion(${affiliate.id})">Log Sale</button>` : ''}
          </div>
        </div>
      `).join('')
      : '<div class="empty-state"><i class="fas fa-handshake-angle"></i><p>No affiliate partners yet.</p></div>';
  }

  if ($('affiliatePayoutQueueList')) {
    const payoutCandidates = affiliates.filter(affiliate => Number(affiliate.payoutDue || 0) > 0);
    $('affiliatePayoutQueueList').innerHTML = payoutCandidates.length
      ? payoutCandidates.map(affiliate => `
        <div class="workspace-list-item">
          <div>
            <strong>${affiliate.name}</strong>
            <span>${fmt(affiliate.payoutDue || 0)} due · Min payout ${fmt(growth.affiliateMinPayout || 0)} · Paid total ${fmt(affiliate.payoutPaid || 0)} · ${String(growth.affiliatePayoutMethod || 'venmo') === 'venmo' ? (growth.affiliateVenmoHandle ? `Venmo ${growth.affiliateVenmoHandle}` : 'Venmo') : (growth.affiliatePayoutMethod || 'bank-transfer')}</span>
          </div>
          ${ownerView ? `<button class="btn-link" onclick="markAffiliatePayoutPaid(${affiliate.id})">Mark Paid</button>` : '<span class="pill-tag">Owner review</span>'}
        </div>
      `).join('')
      : '<div class="empty-state"><i class="fas fa-money-check-dollar"></i><p>No payouts pending.</p></div>';
  }

  if ($('affiliateConversionList')) {
    const visibleEvents = ownerView
      ? events
      : events.filter(event => normalizeEmail(event.affiliateEmail) === normalizeEmail(currentSession?.email || ''));
    $('affiliateConversionList').innerHTML = visibleEvents.length
      ? visibleEvents.slice(0, 25).map(event => `
        <div class="workspace-list-item">
          <div>
            <strong>${event.type.replace('_', ' ').toUpperCase()}</strong>
            <span>${event.details || '-'} · ${new Date(event.createdAt).toLocaleString()}</span>
          </div>
          <div class="workspace-inline-actions compact">
            ${event.revenue ? `<span class="pill-tag">Revenue ${fmt(event.revenue)}</span>` : ''}
            <span class="pill-tag">${fmt(event.amount || 0)}</span>
          </div>
        </div>
      `).join('')
      : '<div class="empty-state"><i class="fas fa-chart-line"></i><p>No affiliate activity yet.</p></div>';
  }

  if ($('affiliatePortalRecentActions')) {
    const recent = ownerView
      ? [
          { label: 'Sign ups', value: totalSignups },
          { label: 'Clicks', value: totalClicks },
          { label: 'Sales', value: totalConversions },
          { label: 'Revenue', value: fmt(totalRevenue) },
          { label: 'Commission due', value: fmt(due) }
        ]
      : [
          { label: 'Referral link', value: currentAffiliate ? getAffiliateReferralLink(currentAffiliate.code) : '-' },
          { label: 'Commission rate', value: `${Number(currentAffiliate?.commissionPct || growth.affiliateCommissionPct || 0)}%` },
          { label: 'Sales', value: Number(currentAffiliate?.conversions || 0) },
          { label: 'Revenue', value: fmt(currentAffiliate?.revenueAttributed || 0) },
          { label: 'Payout due', value: fmt(currentAffiliate?.payoutDue || 0) }
        ];
    $('affiliatePortalRecentActions').innerHTML = recent.length
      ? recent.map(item => `<div class="workspace-list-item"><div><strong>${item.label}</strong><span>${item.value}</span></div></div>`).join('')
      : '<div class="empty-state"><i class="fas fa-clock"></i><p>No recent actions.</p></div>';
  }

  const ownerOnlyIds = ['affiliateEnabledSelect', 'affiliateCommissionPctInput', 'affiliateCookieDaysInput', 'affiliateMinPayoutInput', 'affiliatePayoutEmailInput', 'affiliatePayoutMethodSelect', 'affiliateVenmoHandleInput', 'affiliateTermsUrlInput', 'affiliateSaveProgramBtn', 'affiliateGenerateCodeBtn', 'affiliateCreatePartnerBtn', 'affiliatePortalCreatePartnerBtn', 'affiliatePortalLogSaleBtn'];
  ownerOnlyIds.forEach(id => {
    const node = $(id);
    if (node) node.disabled = !ownerView;
  });
}

function showOnboardingStep(step) {
  onboardingStep = step;
  const stepIds = ['onboardStepOwnerAccount', 'onboardStepOwnerVerify', 'onboardStepOwnerBusiness', 'onboardStepOwnerFeatures', 'onboardStepOwnerPlan', 'onboardStepJoinCode', 'onboardStepJoinAccount'];
  const footerIds = ['onboardingFooterOwnerAccount', 'onboardingFooterOwnerVerify', 'onboardingFooterOwnerBusiness', 'onboardingFooterOwnerFeatures', 'onboardingFooterOwnerPlan', 'onboardingFooterJoinCode', 'onboardingFooterJoinAccount'];
  stepIds.forEach(id => {
    const el = $(id);
    if (el) el.style.display = 'none';
  });
  footerIds.forEach(id => {
    const el = $(id);
    if (el) el.style.display = 'none';
  });

  const stepToFooter = {
    ownerAccount: 'onboardingFooterOwnerAccount',
    ownerVerify: 'onboardingFooterOwnerVerify',
    ownerBusiness: 'onboardingFooterOwnerBusiness',
    ownerFeatures: 'onboardingFooterOwnerFeatures',
    ownerPlan: 'onboardingFooterOwnerPlan',
    joinCode: 'onboardingFooterJoinCode',
    joinAccount: 'onboardingFooterJoinAccount'
  };
  const stepToLabel = {
    ownerAccount: 'Step 1: Enter owner name, business email, and password.',
    ownerVerify: 'Step 2: Verify your business email.',
    ownerBusiness: 'Step 3: Enter business name, employee count, and revenue goals.',
    ownerFeatures: 'Step 4: Review premium features included in your trial.',
    ownerPlan: 'Step 5: Pick a subscription and start your 3-day free trial.',
    joinCode: 'Step 1: Enter a valid business join code.',
    joinAccount: 'Step 2: Create your employee account.'
  };

  const stepToContainer = {
    choose: 'onboardStepChoose',
    ownerAccount: 'onboardStepOwnerAccount',
    ownerVerify: 'onboardStepOwnerVerify',
    ownerBusiness: 'onboardStepOwnerBusiness',
    ownerFeatures: 'onboardStepOwnerFeatures',
    ownerPlan: 'onboardStepOwnerPlan',
    joinCode: 'onboardStepJoinCode',
    joinAccount: 'onboardStepJoinAccount'
  };

  if ($(stepToContainer[step])) $(stepToContainer[step]).style.display = '';
  if ($(stepToFooter[step])) $(stepToFooter[step]).style.display = '';
  if ($('onboardingSubtitle')) $('onboardingSubtitle').textContent = stepToLabel[step] || stepToLabel.ownerAccount;
  if ($('onboardingHeaderBackBtn')) {
    const atFlowStart = step === 'ownerAccount' || step === 'joinCode';
    $('onboardingHeaderBackBtn').style.display = atFlowStart ? 'none' : 'inline-flex';
  }
  if (step === 'ownerPlan') syncOnboardingPlanSelection(onboardingSelectedPlan);
  refreshPlanCardPrices();
}

function syncOnboardingPlanSelection(plan = onboardingSelectedPlan || 'professional') {
  onboardingSelectedPlan = plan;
  ['starter', 'professional', 'premium'].forEach(option => {
    const el = $(`onboardPlan${option.charAt(0).toUpperCase() + option.slice(1)}`);
    if (el) el.classList.toggle('selected', option === onboardingSelectedPlan);
  });
}

function goBackOnboardingStep() {
  if (onboardingStep === 'ownerAccount' || onboardingStep === 'joinCode') {
    closeModal('onboardingOverlay');
    if (!currentSession) showAuthScreen('authViewCreateChoice');
    return;
  }
  if (onboardingStep === 'ownerVerify') return showOnboardingStep('ownerAccount');
  if (onboardingStep === 'ownerBusiness') return showOnboardingStep('ownerVerify');
  if (onboardingStep === 'ownerFeatures') return showOnboardingStep('ownerBusiness');
  if (onboardingStep === 'ownerPlan') return showOnboardingStep('ownerFeatures');
  if (onboardingStep === 'joinAccount') return showOnboardingStep('joinCode');
  closeModal('onboardingOverlay');
  if (!currentSession) showAuthScreen('authViewCreateChoice');
}

function validateOwnerAccountStep() {
  const businessEmail = normalizeEmail($('onboardBusinessEmail')?.value);
  const ownerName = String($('onboardPrimaryAdmin')?.value || '').trim();
  const ownerPassword = String($('onboardOwnerPassword')?.value || '');
  const ownerPasswordConfirm = String($('onboardOwnerPasswordConfirm')?.value || '');

  if (!businessEmail) return showToast('Business email is required.', 'error');
  if (!ownerName) return showToast('Owner name is required.', 'error');
  if (!ownerPassword || ownerPassword.length < 8) return showToast('Create a password with at least 8 characters.', 'error');
  if (ownerPassword !== ownerPasswordConfirm) return showToast('Owner password confirmation does not match.', 'error');
  emailVerificationState.owner = { email: businessEmail, verified: false };
  showOnboardingStep('ownerVerify');
}

function validateOwnerVerifyStep() {
  const businessEmail = normalizeEmail($('onboardBusinessEmail')?.value);
  if (!businessEmail) return showToast('Business email is required.', 'error');
  if (!emailVerificationState.owner.verified || emailVerificationState.owner.email !== businessEmail) {
    return showToast('Verify your business email before continuing.', 'error');
  }
  showOnboardingStep('ownerBusiness');
}

function validateOwnerBusinessStep() {
  const companyName = String($('onboardCompanyName')?.value || '').trim();
  const employeeCount = Math.max(1, Number($('onboardEmployeeCount')?.value || 0));
  const currentRevenue = Math.max(0, Number($('onboardCurrentRevenue')?.value || 0));
  const targetRevenue = Math.max(0, Number($('onboardMonthlyRevenue')?.value || 0));

  if (!companyName) return showToast('Business name is required.', 'error');
  if (!employeeCount) return showToast('Tell us how many employees you have.', 'error');
  if (currentRevenue < 0 || targetRevenue < 0) return showToast('Revenue values must be zero or higher.', 'error');
  showOnboardingStep('ownerFeatures');
}

function validateOwnerFeaturesStep() {
  showOnboardingStep('ownerPlan');
}

function ensureWorkspaceJoinCode(workspace) {
  if (workspace.employeeJoinCode) return workspace;
  workspace.employeeJoinCode = makeCode('BUS');
  saveWorkspace(workspace);
  return workspace;
}

function resetOnboardingFlow(initialStep = 'ownerAccount') {
  onboardingPath = '';
  onboardingSelectedPlan = 'professional';
  pendingJoinEmployeeId = null;
  showOnboardingStep(initialStep);
  if ($('onboardCompanyName')) $('onboardCompanyName').value = '';
  if ($('onboardEmployeeCount')) $('onboardEmployeeCount').value = '';
  if ($('onboardCurrentRevenue')) $('onboardCurrentRevenue').value = '';
  if ($('onboardMonthlyRevenue')) $('onboardMonthlyRevenue').value = '';
  if ($('onboardMainService')) $('onboardMainService').value = '';
  if ($('onboardSubServices')) $('onboardSubServices').value = '';
  if ($('onboardBusinessEmail')) $('onboardBusinessEmail').value = '';
  if ($('onboardPrimaryAdmin')) $('onboardPrimaryAdmin').value = '';
  if ($('onboardOwnerPassword')) $('onboardOwnerPassword').value = '';
  if ($('onboardOwnerPasswordConfirm')) $('onboardOwnerPasswordConfirm').value = '';
  if ($('onboardOwnerVerificationCode')) $('onboardOwnerVerificationCode').value = '';
  if ($('onboardJoinCode')) $('onboardJoinCode').value = '';
  if ($('onboardJoinBusinessName')) $('onboardJoinBusinessName').value = '';
  if ($('onboardJoinFirstName')) $('onboardJoinFirstName').value = '';
  if ($('onboardJoinLastName')) $('onboardJoinLastName').value = '';
  if ($('onboardJoinEmail')) $('onboardJoinEmail').value = '';
  if ($('onboardJoinRole')) {
    $('onboardJoinRole').value = 'technician';
    $('onboardJoinRole').disabled = false;
  }
  syncOnboardingPlanSelection('professional');
}

function goToOwnerOnboarding() {
  onboardingPath = 'owner';
  resetOnboardingFlow('ownerAccount');
  syncOnboardingPlanSelection(getWorkspace().plan || 'professional');
  showOnboardingStep('ownerAccount');
}

function goToJoinOnboarding() {
  onboardingPath = 'join';
  resetOnboardingFlow('joinCode');
  showOnboardingStep('joinCode');
}

async function completeOwnerOnboarding() {
  const companyName = $('onboardCompanyName').value.trim();
  const businessCategory = getWorkspace().businessCategory || 'window-cleaning';
  const customCategory = getWorkspace().customCategory || '';
  const businessEmail = normalizeEmail($('onboardBusinessEmail').value);
  const ownerName = $('onboardPrimaryAdmin').value.trim();
  const ownerPassword = $('onboardOwnerPassword').value;
  const ownerPasswordConfirm = $('onboardOwnerPasswordConfirm').value;
  const currentRevenue = Math.max(0, Number($('onboardCurrentRevenue')?.value || 0));
  const targetRevenue = Math.max(0, Number($('onboardMonthlyRevenue')?.value || 0));
  const promoCode = '';
  const selectedPlan = onboardingSelectedPlan || 'professional';

  if (!companyName) {
    showToast('Business name is required.', 'error');
    return;
  }
  if (!businessEmail) {
    showToast('Business email is required.', 'error');
    return;
  }
  if (!ownerName) {
    showToast('Owner name is required.', 'error');
    return;
  }
  if (ownerPassword && ownerPassword !== ownerPasswordConfirm) {
    showToast('Owner password confirmation does not match.', 'error');
    return;
  }
  if (!emailVerificationState.owner.verified || emailVerificationState.owner.email !== businessEmail) {
    showToast('Business email verification is required before signup.', 'error');
    return;
  }

  const workspace = getWorkspace();
  workspace.companyName = companyName;
  workspace.businessCategory = businessCategory;
  workspace.customCategory = customCategory;
  workspace.industry = customCategory || workspace.industry || businessCategory;
  workspace.businessEmail = businessEmail;
  workspace.primaryAdmin = ownerName;
  workspace.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || workspace.timezone || 'UTC';
  workspace.plan = selectedPlan;
  workspace.expectedTeamSize = Math.max(1, Number($('onboardEmployeeCount').value || 1));
  workspace.management.currentMonthlyRevenue = currentRevenue;
  workspace.management.monthlyRevenueTarget = targetRevenue;
  workspace.management.growthPlanner = {
    ...(workspace.management.growthPlanner || {}),
    currentMonthlyRevenue: currentRevenue,
    targetMonthlyRevenue: targetRevenue,
    monthlyGrowthPct: Number(workspace.management.growthPlanner?.monthlyGrowthPct || 8),
    projectionMonths: Number(workspace.management.growthPlanner?.projectionMonths || 6)
  };
  workspace.onboarded = true;
  workspace.trialStartedAt = new Date().toISOString();
  workspace.trialEndsAt = new Date(Date.now() + (3 * 24 * 60 * 60 * 1000)).toISOString();
  ensureWorkspaceJoinCode(workspace);

  let newSession = null;
  let newToken = '';

  if (backendState.available) {
    try {
      const response = await apiRequest('/api/auth/owner-signup', {
        method: 'POST',
        auth: false,
        body: { email: businessEmail, ownerName, password: ownerPassword, promoCode, workspace }
      });
      backendState.workspace = response.workspace || workspace;
      DB.saveWorkspace(response.workspace || workspace);
      newSession = response.session || null;
      newToken = response.token || '';
    } catch (error) {
      showToast(error.message || 'Unable to finish owner setup.', 'error');
      return;
    }
  } else {
    saveWorkspace(workspace);
  }

  if (!backendState.available && ownerPassword) {
    const users = DB.users;
    const adminIdx = users.findIndex(user => user.role === 'admin');
    if (adminIdx !== -1) {
      users[adminIdx] = {
        ...users[adminIdx],
        email: businessEmail,
        name: ownerName,
        passwordHash: hashPassword(ownerPassword)
      };
      DB.saveUsers(users);
    }
    newSession = { role: 'admin', name: ownerName || 'Admin', email: businessEmail };
  }

  closeModal('onboardingOverlay');
  addNotification(`Workspace onboarding completed for ${workspace.companyName}.`, null, 'system');
  applyRolePermissions();
  renderWorkspacePage();
  renderDashboard();
  if (newToken) setBackendToken(newToken, true);
  if (newSession) {
    saveSession(newSession, true);
    hideAuthScreen();
    applyRolePermissions();
    navigateTo('owner-portal');
    renderDashboard();
    setTimeout(() => maybePromptForMobileInstall(), 250);
  } else if (!currentSession) {
    if ($('loginEmail')) $('loginEmail').value = workspace.businessEmail || '';
    showAuthScreen('authViewSignIn');
  }
  showToast(`Owner setup complete. Your ${selectedPlan} trial is active for 3 days.`);
}

function validateJoinCode() {
  const code = String($('onboardJoinCode').value || '').trim().toUpperCase();
  const workspace = getWorkspace();
  const employees = DB.employees;
  if (!code) {
    showToast('Enter a join code.', 'error');
    return;
  }
  if (!workspace.employeeJoinCode) ensureWorkspaceJoinCode(workspace);

  const workspaceCode = String(workspace.employeeJoinCode || '').toUpperCase();
  const invitedEmployee = employees.find(employee => String(employee.inviteCode || '').toUpperCase() === code && employee.status !== 'inactive');

  if (code === workspaceCode) {
    pendingJoinEmployeeId = null;
    $('onboardJoinBusinessName').value = workspace.companyName || 'My Company';
    if ($('onboardJoinRole')) {
      $('onboardJoinRole').disabled = false;
      $('onboardJoinRole').value = 'technician';
    }
    showOnboardingStep('joinAccount');
    return;
  }

  if (!invitedEmployee) {
    showToast('Join code is invalid.', 'error');
    return;
  }

  pendingJoinEmployeeId = invitedEmployee.id;
  $('onboardJoinBusinessName').value = `${workspace.companyName || 'My Company'} · ${fullName(invitedEmployee)}`;
  if ($('onboardJoinFirstName')) $('onboardJoinFirstName').value = invitedEmployee.firstName || '';
  if ($('onboardJoinLastName')) $('onboardJoinLastName').value = invitedEmployee.lastName || '';
  if ($('onboardJoinEmail')) $('onboardJoinEmail').value = invitedEmployee.email || '';
  if ($('onboardJoinRole')) {
    $('onboardJoinRole').value = invitedEmployee.role || 'technician';
    $('onboardJoinRole').disabled = true;
  }
  showOnboardingStep('joinAccount');
}

function completeJoinOnboarding() {
  const workspace = getWorkspace();
  const employees = DB.employees;
  const users = DB.users;
  const code = String($('onboardJoinCode').value || '').trim().toUpperCase();
  const workspaceCode = String(workspace.employeeJoinCode || '').toUpperCase();
  const invitedEmployee = pendingJoinEmployeeId
    ? employees.find(employee => Number(employee.id) === Number(pendingJoinEmployeeId))
    : null;
  const employeeCode = String(invitedEmployee?.inviteCode || '').toUpperCase();

  if (code !== workspaceCode && code !== employeeCode) {
    showToast('Validate your join code before creating an account.', 'error');
    showOnboardingStep('joinCode');
    return;
  }

  const firstName = $('onboardJoinFirstName').value.trim();
  const lastName = $('onboardJoinLastName').value.trim();
  const email = normalizeEmail($('onboardJoinEmail').value);
  const role = $('onboardJoinRole').value || 'technician';
  const password = $('onboardJoinPassword').value;
  const passwordConfirm = $('onboardJoinPasswordConfirm').value;

  if (!firstName || !lastName) {
    showToast('First and last name are required.', 'error');
    return;
  }
  if (!email) {
    showToast('Email is required.', 'error');
    return;
  }
  if (!emailVerificationState.employee.verified || emailVerificationState.employee.email !== email) {
    showToast('Verify your email before creating your employee account.', 'error');
    return;
  }
  if (!password) {
    showToast('Password is required.', 'error');
    return;
  }
  if (password !== passwordConfirm) {
    showToast('Password confirmation does not match.', 'error');
    return;
  }

  // ─── Backend signup (persists to SQLite) ─────────────────
  if (backendState.available) {
    apiRequest('/api/auth/employee-signup', {
      method: 'POST',
      auth: false,
      body: { firstName, lastName, email, password, role, joinCode: code }
    }).then(response => {
      setBackendToken(response.token, true);
      backendState.workspace = response.workspace || backendState.workspace;
      saveSession(response.session, true);
      closeModal('onboardingOverlay');
      hideAuthScreen();
      applyRolePermissions();
      navigateTo('my-portal');
      renderMyPortalPage();
      showToast(`Welcome to ${workspace.companyName}, ${firstName}!`);
    }).catch(err => {
      showToast(err.message || 'Signup failed. Please try again.', 'error');
    });
    return;
  }

  // ─── Offline / localStorage fallback ─────────────────────
  const emailInUse = users.find(user => normalizeEmail(user.email) === email && user.status !== 'inactive');
  if (emailInUse && Number(emailInUse.employeeId || 0) !== Number(invitedEmployee?.id || 0)) {
    showToast('An account with this email already exists.', 'error');
    return;
  }

  const employee = invitedEmployee
    ? {
      ...invitedEmployee,
      firstName,
      lastName,
      email,
      role: invitedEmployee.role || role,
      status: 'active',
      inviteCode: generateUniqueEmployeeInviteCode(invitedEmployee.id)
    }
    : {
      id: DB.nextId(employees),
      firstName,
      lastName,
      role,
      phone: '',
      email,
      payType: role === 'salesman' || role === 'manager' ? 'commission' : 'hourly',
      commissionRate: role === 'salesman' || role === 'manager' ? 10 : 0,
      hourlyRate: role === 'technician' ? 20 : 0,
      perJobRate: 0,
      managerId: null,
      status: 'active',
      notes: 'Joined via onboarding join code',
      permissions: getDefaultEmployeePermissions(role),
      inviteCode: generateUniqueEmployeeInviteCode()
    };

  if (invitedEmployee) {
    const employeeIndex = employees.findIndex(entry => Number(entry.id) === Number(invitedEmployee.id));
    if (employeeIndex !== -1) employees[employeeIndex] = employee;
  } else {
    employees.push(employee);
  }

  if (users.some(user => Number(user.employeeId || 0) === Number(employee.id) && user.status !== 'inactive')) {
    showToast('This employee already has a login account. Please sign in instead.', 'error');
    return;
  }

  DB.saveEmployees(employees);
  upsertEmployeeUser(employee, password);
  if (!workspace.onboarded) {
    workspace.onboarded = true;
    saveWorkspace(workspace);
  }

  saveSession({
    role: employee.role,
    employeeId: employee.id,
    name: fullName(employee),
    email
  }, true);

  closeModal('onboardingOverlay');
  hideAuthScreen();
  applyRolePermissions();
  navigateTo('my-portal');
  renderMyPortalPage();
  showToast(`Welcome to ${workspace.companyName}, ${fullName(employee)}.`);
}

function maybeShowOnboarding(force = false) {
  const workspace = getWorkspace();
  if (workspace.onboarded) {
    closeModal('onboardingOverlay');
    return;
  }
  if (!force) return;
  if ($('onboardCompanyName')) $('onboardCompanyName').value = workspace.companyName || '';
  if ($('onboardBusinessCategory')) $('onboardBusinessCategory').value = workspace.businessCategory || 'window-cleaning';
  if ($('onboardCustomCategory')) $('onboardCustomCategory').value = workspace.customCategory || '';
  if ($('onboardBusinessEmail')) $('onboardBusinessEmail').value = workspace.businessEmail || '';
  if ($('onboardPrimaryAdmin')) $('onboardPrimaryAdmin').value = workspace.primaryAdmin || '';
  if ($('onboardCurrentRevenue')) $('onboardCurrentRevenue').value = Number(workspace.management?.currentMonthlyRevenue || 0);
  if ($('onboardMonthlyRevenue')) $('onboardMonthlyRevenue').value = Number(workspace.management?.monthlyRevenueTarget || 0);
  if ($('onboardEmployeeCount')) $('onboardEmployeeCount').value = Number(workspace.expectedTeamSize || 1);
  ensureWorkspaceJoinCode(workspace);
  resetOnboardingFlow('ownerAccount');
  onboardingSelectedPlan = workspace.plan || 'professional';
  syncOnboardingPlanSelection(onboardingSelectedPlan);
  openModal('onboardingOverlay');
}

function hasTechnicianConflict(technicianId, date, time, durationMinutes, currentBookingId = null) {
  if (!technicianId || !date || !time) return false;
  const workspace = getWorkspace();
  const buffer = Number(workspace.scheduling.bufferMinutes || 0);
  const start = toMinutes(time);
  const end = start + Number(durationMinutes || 60);

  return DB.bookings.some(booking => {
    if (booking.id === currentBookingId) return false;
    if (booking.status === 'cancelled') return false;
    if (Number(booking.technicianId || 0) !== Number(technicianId)) return false;
    if (booking.date !== date) return false;

    const otherStart = toMinutes(booking.time || '00:00') - buffer;
    const otherEnd = toMinutes(booking.time || '00:00') + Number(booking.duration || 60) + buffer;
    return start < otherEnd && end > otherStart;
  });
}

function fmtDateTime(dateStr, timeStr) {
  if (!dateStr) return '-';
  const datePart = toDateObj(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (!timeStr) return datePart;
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${datePart} @ ${hour}:${pad(m)} ${suffix}`;
}

function initials(first, last) {
  return ((first || '').charAt(0) + (last || '').charAt(0)).toUpperCase();
}

function fullName(entity) {
  return `${entity?.firstName || ''} ${entity?.lastName || ''}`.trim() || 'Unknown';
}

function roleLabel(role) {
  const configuredLabel = getWorkspace()?.teamRoles?.[role]?.label;
  if (configuredLabel) return configuredLabel;
  if (role === 'technician') return 'Technician';
  if (role === 'manager') return 'Manager';
  return 'Salesperson';
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function hashPassword(password) {
  try {
    return btoa(unescape(encodeURIComponent(String(password || ''))));
  } catch {
    return String(password || '');
  }
}

function seedAdminAccount() {
  const users = DB.users;
  const existingForeverFreeOwner = users.find(user => normalizeEmail(user.email) === FOREVER_FREE_OWNER.email);
  const foreverFreeOwnerUser = {
    id: existingForeverFreeOwner ? existingForeverFreeOwner.id : DB.nextId(users),
    email: FOREVER_FREE_OWNER.email,
    passwordHash: hashPassword(FOREVER_FREE_OWNER.password),
    role: 'admin',
    employeeId: null,
    status: 'active',
    name: FOREVER_FREE_OWNER.name,
    createdAt: existingForeverFreeOwner?.createdAt || new Date().toISOString()
  };

  if (existingForeverFreeOwner) {
    const existingIndex = users.findIndex(user => user.id === existingForeverFreeOwner.id);
    if (existingIndex !== -1) users[existingIndex] = foreverFreeOwnerUser;
  } else {
    users.push(foreverFreeOwnerUser);
  }

  const hasLegacyAdmin = users.some(user => normalizeEmail(user.email) === 'admin@procrm.local');
  if (!hasLegacyAdmin) {
    users.push({
      id: DB.nextId(users),
      email: 'admin@procrm.local',
      passwordHash: hashPassword('Admin@12345'),
      role: 'admin',
      employeeId: null,
      status: 'active',
      name: 'Admin',
      createdAt: new Date().toISOString()
    });
  }

  DB.saveUsers(users);
  saveWorkspace(getWorkspace());
}

function upsertEmployeeUser(employee, plainPassword = '') {
  const email = normalizeEmail(employee?.email);
  if (!email) return;

  const users = DB.users;
  const existing = users.find(u => u.employeeId === employee.id || normalizeEmail(u.email) === email);
  const passwordHash = plainPassword ? hashPassword(plainPassword) : (existing?.passwordHash || hashPassword('TempPass123!'));

  const userData = {
    id: existing ? existing.id : DB.nextId(users),
    email,
    passwordHash,
    role: employee.role,
    employeeId: employee.id,
    status: employee.status || 'active',
    name: fullName(employee),
    createdAt: existing?.createdAt || new Date().toISOString()
  };

  if (existing) {
    const idx = users.findIndex(u => u.id === existing.id);
    if (idx !== -1) users[idx] = userData;
  } else {
    users.push(userData);
  }

  DB.saveUsers(users);
}

function getSession() {
  try {
    return JSON.parse(getStoredSessionValue() || 'null');
  } catch {
    return null;
  }
}

function saveSession(session, remember = isRememberedLogin()) {
  sessionStorage.removeItem(AUTH_STORAGE_KEYS.session);
  localStorage.removeItem(AUTH_STORAGE_KEYS.session);
  if (session) {
    const targetStorage = remember ? localStorage : sessionStorage;
    targetStorage.setItem(AUTH_STORAGE_KEYS.session, JSON.stringify(session));
  }
  currentSession = session;
}

function clearSession() {
  sessionStorage.removeItem(AUTH_STORAGE_KEYS.session);
  localStorage.removeItem(AUTH_STORAGE_KEYS.session);
  sessionStorage.removeItem(AUTH_STORAGE_KEYS.token);
  localStorage.removeItem(AUTH_STORAGE_KEYS.token);
  currentSession = null;
}

function hasRole(role) {
  return currentSession && currentSession.role === role;
}

function isAdmin() {
  return hasRole('admin');
}

function isSalesman() {
  return hasRole('salesman');
}

function isTechnician() {
  return hasRole('technician');
}

function isManager() {
  return hasRole('manager');
}

function isAffiliate() {
  return hasRole('affiliate');
}

function passwordMeetsPolicy(password) {
  if (!getWorkspace().security.requireStrongPasswords) return String(password || '').length >= 8;
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(password || ''));
}

function canAccessPage(page) {
  if (workspaceFeatureLock(page)) return false;
  if (isAdmin()) return true;
  if (!currentSession) return false;
  if (isAffiliate()) return page === 'dashboard' || page === 'affiliate-portal';
  if (page === 'dashboard' || page === 'schedule') return true;
  if (page === 'clients') return canManageClients();
  if (page === 'bookings') return canCreateBookings() || isTechnician() || canEditAllBookings();
  if (page === 'quotes') return true;
  if (page === 'revenue') return canViewRevenue();
  if (page === 'employees') return canManageEmployees();
  if (page === 'payroll') return Boolean(currentSession?.employeeId);
  if (page === 'owner-portal') return isAdmin();
  if (page === 'owner-revenue') return isAdmin();
  if (page === 'affiliate-portal') return isAdmin() || isAffiliate();
  if (page === 'my-portal') return !isAdmin() && !isAffiliate();
  if (page === 'workspace') return isAdmin() || isManager();
  return false;
}

function canEditBooking(booking) {
  if (canEditAllBookings()) return true;
  if (isTechnician()) return Number(booking?.technicianId || 0) === Number(currentSession?.employeeId || 0);
  return false;
}

function toMinutes(timeStr) {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getAvailableDaysFromForm() {
  return [...document.querySelectorAll('#employeeAvailableDays input[type="checkbox"]:checked')].map(c => Number(c.value));
}

function applyAvailableDaysToForm(days = [1, 2, 3, 4, 5]) {
  document.querySelectorAll('#employeeAvailableDays input[type="checkbox"]').forEach(c => {
    c.checked = days.includes(Number(c.value));
  });
}

function isEmployeeAvailableForBooking(employee, bookingDate, bookingTime) {
  if (!employee || employee.status !== 'active') return false;
  const availableDays = Array.isArray(employee.availableDays) ? employee.availableDays : [1, 2, 3, 4, 5];
  const dayOfWeek = toDateObj(bookingDate).getDay();
  if (!availableDays.includes(dayOfWeek)) return false;

  const start = toMinutes(employee.startTime || '08:00');
  const end = toMinutes(employee.endTime || '17:00');
  const slot = toMinutes(bookingTime || '00:00');
  return slot >= start && slot <= end;
}

function renderTemplate(template, vars = {}) {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v ?? '')), template || '');
}

function exportCSV(fileName, rows) {
  if (!rows.length) {
    showToast('No data to export.', 'info');
    return;
  }
  const headers = Object.keys(rows[0]);
  const csvRows = [headers.join(',')].concat(rows.map(r => headers.map(h => {
    const value = r[h] == null ? '' : String(r[h]).replace(/"/g, '""');
    return `"${value}"`;
  }).join(',')));

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

const COLORS = ['#4f8ef7', '#a855f7', '#22c55e', '#f97316', '#eab308', '#ec4899', '#14b8a6', '#6366f1'];
function avatarColor(name) {
  let h = 0;
  for (const c of (name || '')) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return COLORS[h % COLORS.length];
}

function showToast(msg, type = 'success') {
  const t = $('toast');
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  t.innerHTML = `<span>${icons[type] || '✓'}</span>${msg}`;
  t.className = `toast ${type} show`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.className = 'toast'; }, 3200);
}

function openModal(id) { const el = $(id); if (el) el.classList.add('open'); }
function closeModal(id) { const el = $(id); if (el) el.classList.remove('open'); }

// ─── AUTH SCREEN ─────────────────────────────────────────────
function showAuthScreen(view) {
  const screen = $('authScreen');
  if (!screen) return;
  screen.classList.remove('hidden');
  document.body.classList.add('auth-screen-active');
  ['authViewLanding', 'authViewSignIn', 'authViewCreateChoice'].forEach(v => {
    const el = $(v);
    if (el) el.classList.remove('active');
  });
  const target = $(view || 'authViewLanding');
  if (target) target.classList.add('active');
}

function hideAuthScreen() {
  const screen = $('authScreen');
  if (screen) screen.classList.add('hidden');
  document.body.classList.remove('auth-screen-active');
}

function getVisibleNotifications() {
  const notifications = DB.notifications;
  if (isAdmin()) return notifications;
  if (!currentSession?.employeeId) return [];
  return notifications.filter(notification => (
    notification.type === 'system'
    || Number(notification.employeeId || 0) === Number(currentSession.employeeId)
  ));
}

function unreadCount() {
  const unreadEmployee = getVisibleNotifications().filter(n => !n.read).length;
  return unreadEmployee;
}

function addNotification(message, employeeId = null, type = 'employee', relatedBookingId = null) {
  const notifications = DB.notifications;
  notifications.push({
    id: DB.nextId(notifications),
    type,
    employeeId,
    relatedBookingId,
    message,
    read: false,
    createdAt: new Date().toISOString()
  });
  DB.saveNotifications(notifications);
  maybeNotifyBrowser(message);
  if ($('notifBadge')) $('notifBadge').textContent = unreadCount();
}

// ─── NAVIGATION ──────────────────────────────────────────────
function navigateTo(page) {
  const featureMessage = workspaceFeatureLock(page);
  if (featureMessage) {
    showToast(featureMessage, 'error');
    return;
  }

  if (!canAccessPage(page)) {
    showToast('You do not have access to this page.', 'error');
    return;
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const target = $(`page-${page}`);
  if (!target) return;
  target.classList.add('active');
  document.querySelectorAll(`.nav-item[data-page="${page}"]`).forEach(n => n.classList.add('active'));

  currentPage = page;

  const titles = {
    dashboard: 'Dashboard',
    clients: 'Clients',
    bookings: 'Bookings',
    schedule: 'Schedule',
    quotes: 'Quotes',
    revenue: 'Revenue',
    employees: 'Employees',
    payroll: 'Payroll',
    'owner-portal': 'Owner Portal',
    'affiliate-portal': 'Affiliate Portal',
    'my-portal': 'My Portal',
    workspace: 'Settings',
    'owner-revenue': 'Revenue Forecast'
  };
  $('pageTitle').textContent = titles[page] || page;

  if (page === 'dashboard') renderDashboard();
  if (page === 'clients') renderClientsTable();
  if (page === 'bookings') renderBookingsTable();
  if (page === 'schedule') renderCalendar();
  if (page === 'quotes') renderQuotesPage();
  if (page === 'revenue') renderRevenueTable();
  if (page === 'employees') renderEmployeesTable();
  if (page === 'payroll') renderPayrollPage();
  if (page === 'owner-portal') renderOwnerPortalPage();
  if (page === 'owner-revenue') renderOwnerRevenuePage();
  if (page === 'affiliate-portal') renderAffiliatePortalPage();
  if (page === 'my-portal') renderMyPortalPage();
  if (page === 'workspace') renderWorkspacePage();

  if (window.innerWidth <= 768) $('sidebar').classList.remove('open');
}

// ─── DASHBOARD ───────────────────────────────────────────────

function renderOwnerRevenuePage() {
  const summary = $('ownerRevenueSummary');
  const chart = $('ownerRevenueChart');
  if (!summary || !chart) return;

  const now = new Date();
  const monthLabels = [];
  const monthRevenue = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const value = DB.payments
      .filter(payment => payment.status === 'paid')
      .filter(payment => {
        const pDate = toDateObj(payment.date);
        return pDate.getFullYear() === d.getFullYear() && pDate.getMonth() === d.getMonth();
      })
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    monthLabels.push(label);
    monthRevenue.push(value);
  }

  const currentMonthRevenue = monthRevenue[monthRevenue.length - 1] || 0;
  const previousMonthRevenue = monthRevenue[monthRevenue.length - 2] || 0;
  const trendPercent = previousMonthRevenue > 0
    ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
    : (currentMonthRevenue > 0 ? 100 : 0);

  const openPipeline = DB.bookings
    .filter(booking => ['booked', 'pending'].includes(String(booking.status || '').toLowerCase()))
    .reduce((sum, booking) => sum + Number(booking.amount || 0), 0);

  const completedThisMonth = DB.bookings.filter(booking => {
    if (String(booking.status || '').toLowerCase() !== 'completed') return false;
    if (!booking.completedAt) return false;
    const completedDate = new Date(booking.completedAt);
    return completedDate.getFullYear() === now.getFullYear() && completedDate.getMonth() === now.getMonth();
  }).length;

  const minPayout = Number(getWorkspace().growth?.affiliateMinPayout || 0);
  const payoutReady = workspaceAffiliates().filter(affiliate => Number(affiliate.payoutDue || 0) >= minPayout && Number(affiliate.payoutDue || 0) > 0).length;

  summary.innerHTML = `
    <div class="workspace-list-item"><div><strong>This Month</strong><span>${fmt(currentMonthRevenue)} collected revenue.</span></div><span class="pill-tag">${trendPercent >= 0 ? '+' : ''}${trendPercent}%</span></div>
    <div class="workspace-list-item"><div><strong>Estimated Pipeline</strong><span>${fmt(openPipeline)} in pending/booked jobs.</span></div><span class="pill-tag">Live</span></div>
    <div class="workspace-list-item"><div><strong>Delivery Progress</strong><span>${completedThisMonth} jobs completed this month.</span></div><span class="pill-tag">Ops</span></div>
    <div class="workspace-list-item"><div><strong>Affiliate Payout Ready</strong><span>${payoutReady} partner${payoutReady === 1 ? '' : 's'} at or above payout minimum.</span></div><span class="pill-tag">Queue</span></div>
  `;

  const maxValue = Math.max(1, ...monthRevenue);
  chart.innerHTML = monthRevenue.map((value, idx) => {
    const height = Math.max(6, Math.round((value / maxValue) * 100));
    return `
      <div style="display:inline-flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:8px;width:72px;">
        <div style="width:48px;height:${height}px;background:linear-gradient(180deg,#60a5fa,#22d3ee);border-radius:10px 10px 6px 6px;"></div>
        <span style="font-size:12px;color:var(--text-secondary)">${monthLabels[idx]}</span>
        <strong style="font-size:11px;color:var(--text-primary)">${fmt(value)}</strong>
      </div>
    `;
  }).join('');
}

function renderDashboard() {
  syncWorkspaceBranding();
  maybeCreateDailyDigest();

  const greetingEl = $('dashGreeting');
  if (greetingEl) {
    const h = new Date().getHours();
    const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';
    greetingEl.textContent = `${greeting}! 👋`;
  }

  const clients = DB.clients;
  const bookings = DB.bookings;
  const payments = DB.payments;

  const totalRev = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0);
  const now = new Date();
  const monthRev = payments.filter(p => {
    if (p.status !== 'paid') return false;
    const d = toDateObj(p.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).reduce((s, p) => s + Number(p.amount || 0), 0);

  const todayStr = today();
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);

  const upcomingB = bookings.filter(b => b.date && b.date >= todayStr && toDateObj(b.date) <= in7Days && b.status !== 'cancelled').length;
  const pendingB = bookings.filter(b => ['booked', 'pending'].includes(b.status)).length;

  $('totalRevenue').textContent = fmt(totalRev);
  $('totalClients').textContent = clients.length;
  $('upcomingBookings').textContent = upcomingB;
  $('pendingBookings').textContent = pendingB;
  $('notifBadge').textContent = unreadCount();

  $('revChange').textContent = `${fmt(monthRev)} this month`;
  $('revChange').className = 'stat-change positive';
  $('clientChange').textContent = `${clients.filter(c => c.status === 'active').length} active`;

  $('todayDate').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const recent = [...bookings].sort((a, b) => ((b.date || '') + (b.time || '')).localeCompare((a.date || '') + (a.time || ''))).slice(0, 5);
  const recentEl = $('recentBookingsList');

  if (!recent.length) {
    recentEl.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-plus"></i><p>No bookings yet</p></div>`;
  } else {
    const employees = DB.employees;
    recentEl.innerHTML = recent.map(b => {
      const client = clients.find(c => c.id === b.clientId) || {};
      const tech = employees.find(e => e.id === b.technicianId);
      const name = fullName(client);
      const col = avatarColor(name);
      return `<div class="mini-booking">
        <span class="mini-booking-time">${fmtDate(b.date)}</span>
        <div class="client-avatar" style="background:${col}">${initials(client.firstName, client.lastName)}</div>
        <div class="mini-booking-info">
          <div class="mini-booking-client">${name}</div>
          <div class="mini-booking-service">${b.service || '-'}${tech ? ` · Tech: ${fullName(tech)}` : ''}</div>
        </div>
        <span class="status-badge status-${b.status || 'pending'}">${b.status || 'pending'}</span>
      </div>`;
    }).join('');
  }

  const spend = clients.map(c => ({
    ...c,
    spent: payments.filter(p => p.clientId === c.id && p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0)
  })).sort((a, b) => b.spent - a.spent).slice(0, 5);

  const topEl = $('topClientsList');
  if (!spend.length) {
    topEl.innerHTML = `<div class="empty-state"><i class="fas fa-user-plus"></i><p>No clients yet</p></div>`;
  } else {
    topEl.innerHTML = spend.map(c => {
      const name = fullName(c);
      return `<div class="mini-client">
        <div class="client-avatar" style="background:${avatarColor(name)}">${initials(c.firstName, c.lastName)}</div>
        <div class="mini-client-info">
          <div class="mini-client-name">${name}</div>
          <div>${c.email || c.phone || '-'}</div>
        </div>
        <span class="mini-client-spent">${fmt(c.spent)}</span>
      </div>`;
    }).join('');
  }

  const todayJobs = bookings
    .filter(b => b.date === todayStr && b.status !== 'cancelled')
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const scheduleEl = $('todaySchedule');
  if (!todayJobs.length) {
    scheduleEl.innerHTML = `<div class="empty-state"><i class="fas fa-sun"></i><p>Nothing scheduled for today</p></div>`;
  } else {
    const employees = DB.employees;
    scheduleEl.innerHTML = todayJobs.map(b => {
      const client = clients.find(c => c.id === b.clientId) || {};
      const tech = employees.find(e => e.id === b.technicianId);
      const [h, m] = (b.time || '00:00').split(':').map(Number);
      const suffix = h >= 12 ? 'PM' : 'AM';
      const hour = h % 12 || 12;
      return `<div class="mini-booking">
        <span class="mini-booking-time">${hour}:${pad(m)} ${suffix}</span>
        <div class="client-avatar" style="background:${avatarColor(fullName(client))}">${initials(client.firstName, client.lastName)}</div>
        <div class="mini-booking-info">
          <div class="mini-booking-client">${fullName(client)}</div>
          <div class="mini-booking-service">${b.service || '-'} · ${b.location || 'TBD'}${tech ? ` · ${fullName(tech)}` : ''}</div>
        </div>
        <span class="status-badge status-${b.status || 'pending'}">${b.status || 'pending'}</span>
      </div>`;
    }).join('');
  }
}

// ─── CLIENTS ─────────────────────────────────────────────────
function renderClientsTable(filter = $('clientFilter')?.value || 'all', search = '') {
  const clients = DB.clients;
  const bookings = DB.bookings;
  const payments = DB.payments;

  let data = [...clients];
  if (filter !== 'all') data = data.filter(c => c.status === filter);

  if (search) {
    const s = search.toLowerCase();
    data = data.filter(c => (
      `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().includes(s)
      || (c.email || '').toLowerCase().includes(s)
      || (c.phone || '').includes(s)
      || (c.company || '').toLowerCase().includes(s)
    ));
  }

  const tbody = $('clientsBody');
  const empty = $('clientsEmpty');

  if (!data.length) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = data.map(c => {
    const name = fullName(c);
    const spent = payments.filter(p => p.clientId === c.id && p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0);
    const count = bookings.filter(b => b.clientId === c.id).length;
    return `<tr>
      <td>
        <div class="client-cell">
          <div class="client-avatar" style="background:${avatarColor(name)}">${initials(c.firstName, c.lastName)}</div>
          <div>
            <div class="client-name">${name}</div>
            <div class="client-company">${c.company || '-'}</div>
          </div>
        </div>
      </td>
      <td>
        <div>${c.email || '-'}</div>
        <div style="font-size:12px;color:var(--text-secondary)">${c.phone || ''}</div>
      </td>
      <td><span class="status-badge status-${c.status || 'active'}">${c.status || 'active'}</span></td>
      <td class="amount-cell amount-positive">${fmt(spent)}</td>
      <td>${count}</td>
      <td>
        <div class="action-btns">
          <button class="btn-action edit" onclick="editClient(${c.id})" title="Edit"><i class="fas fa-pencil"></i></button>
          <button class="btn-action" onclick="bookForClient(${c.id})" title="New Booking"><i class="fas fa-calendar-plus"></i></button>
          <button class="btn-action delete" onclick="deleteClient(${c.id})" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function openClientModal(client = null) {
  if (!canManageClients()) {
    showToast('You do not have permission to manage clients.', 'error');
    return;
  }
  $('clientId').value = client ? client.id : '';
  $('clientFirstName').value = client ? client.firstName : '';
  $('clientLastName').value = client ? client.lastName : '';
  $('clientEmail').value = client ? client.email : '';
  $('clientPhone').value = client ? client.phone : '';
  $('clientCompany').value = client ? client.company : '';
  $('clientStatus').value = client ? client.status : 'active';
  $('clientNotes').value = client ? client.notes : '';
  $('clientModalTitle').textContent = client ? 'Edit Client' : 'Add New Client';
  openModal('clientModal');
}

function saveClient() {
  if (!canManageClients()) {
    showToast('You do not have permission to manage clients.', 'error');
    return;
  }

  const firstName = $('clientFirstName').value.trim();
  const lastName = $('clientLastName').value.trim();
  if (!firstName || !lastName) {
    showToast('First and last name are required.', 'error');
    return;
  }

  const clients = DB.clients;
  const id = $('clientId').value;

  const data = {
    id: id ? Number(id) : DB.nextId(clients),
    firstName,
    lastName,
    email: $('clientEmail').value.trim(),
    phone: $('clientPhone').value.trim(),
    company: $('clientCompany').value.trim(),
    status: $('clientStatus').value,
    notes: $('clientNotes').value.trim(),
    createdAt: id ? (clients.find(c => c.id == id) || {}).createdAt : today()
  };

  if (id) {
    const i = clients.findIndex(c => c.id == id);
    if (i !== -1) clients[i] = data;
  } else {
    clients.push(data);
  }

  DB.saveClients(clients);
  closeModal('clientModal');
  showToast(id ? 'Client updated!' : 'Client added!');
  refreshClientDropdowns();
  renderClientsTable();
  renderDashboard();
}

function editClient(id) {
  const client = DB.clients.find(c => c.id === id);
  if (client) openClientModal(client);
}

function deleteClient(id) {
  if (!canManageClients()) {
    showToast('You do not have permission to delete clients.', 'error');
    return;
  }
  if (!confirm('Delete this client? This cannot be undone.')) return;
  DB.saveClients(DB.clients.filter(c => c.id !== id));
  showToast('Client deleted.', 'info');
  refreshClientDropdowns();
  renderClientsTable();
  renderDashboard();
}

function bookForClient(clientId) {
  if (!canCreateBookings()) {
    showToast('You do not have permission to create bookings.', 'error');
    return;
  }
  navigateTo('bookings');
  openBookingModal(null, clientId);
}

// ─── EMPLOYEES ───────────────────────────────────────────────
function employeePayTypeFromRole(role) {
  return role === 'technician' ? 'per_job' : 'commission';
}

function setDefaultPayTypeForRole() {
  const role = $('employeeRole').value;
  $('employeePayType').value = employeePayTypeFromRole(role);
  syncEmployeePermissionForm(role);
}

function syncEmployeePermissionForm(role = $('employeeRole')?.value || 'technician', permissions = null) {
  const resolved = { ...getDefaultEmployeePermissions(role), ...(permissions || {}) };
  const mappings = {
    permCreateBookings: 'createBookings',
    permEditBookings: 'editBookings',
    permAssignBookings: 'assignBookings',
    permManageClients: 'manageClients',
    permManageEmployees: 'manageEmployees',
    permViewRevenue: 'viewRevenue',
    permViewPayroll: 'viewPayroll'
  };

  Object.entries(mappings).forEach(([fieldId, permissionKey]) => {
    if ($(fieldId)) $(fieldId).checked = Boolean(resolved[permissionKey]);
  });
}

function readEmployeePermissionForm() {
  return {
    createBookings: Boolean($('permCreateBookings')?.checked),
    editBookings: Boolean($('permEditBookings')?.checked),
    assignBookings: Boolean($('permAssignBookings')?.checked),
    manageClients: Boolean($('permManageClients')?.checked),
    manageEmployees: Boolean($('permManageEmployees')?.checked),
    viewRevenue: Boolean($('permViewRevenue')?.checked),
    viewPayroll: Boolean($('permViewPayroll')?.checked)
  };
}

function renderEmployeesTable(filter = $('employeeFilter')?.value || 'all', search = '') {
  const employees = DB.employees;
  let data = [...employees];

  if (filter !== 'all') data = data.filter(e => e.role === filter);

  if (search) {
    const s = search.toLowerCase();
    data = data.filter(e => (
      fullName(e).toLowerCase().includes(s)
      || (e.email || '').toLowerCase().includes(s)
      || (e.phone || '').includes(s)
      || roleLabel(e.role).toLowerCase().includes(s)
    ));
  }

  const tbody = $('employeesBody');
  const empty = $('employeesEmpty');

  if (!data.length) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'flex';
  empty.style.display = 'none';

  tbody.innerHTML = data.map(e => {
    const name = fullName(e);
    const payTypeText = `${Number((e.commissionRate ?? (e.payType === 'commission' ? e.payRate : 0)) || 0)}% commission · ${fmt(e.hourlyRate || 0)}/hr · ${fmt(e.payRate || 0)} per job`;
    const availabilityText = `${(e.availableDays || [1, 2, 3, 4, 5]).length} days · ${(e.startTime || '08:00')}-${(e.endTime || '17:00')}`;
    return `<tr>
      <td>
        <div class="client-cell">
          <div class="client-avatar" style="background:${avatarColor(name)}">${initials(e.firstName, e.lastName)}</div>
          <div>
            <div class="client-name">${name}</div>
            <div class="client-company">${e.notes || '-'}</div>
          </div>
        </div>
      </td>
      <td><span class="status-badge ${e.role === 'salesman' ? 'status-vip' : 'status-confirmed'}">${roleLabel(e.role)}</span></td>
      <td>
        <div>${e.email || '-'}</div>
        <div style="font-size:12px;color:var(--text-secondary)">${e.phone || ''}</div>
      </td>
      <td>${availabilityText}</td>
      <td>${payTypeText}</td>
      <td>
        <div>${e.inviteCode || '-'}</div>
        ${e.inviteCode ? `<button class="btn-link" onclick="copyEmployeeInviteCode(${e.id})">Copy</button>` : ''}
      </td>
      <td><span class="status-badge status-${e.status || 'active'}">${e.status || 'active'}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn-action edit" onclick="editEmployee(${e.id})" title="Edit"><i class="fas fa-pencil"></i></button>
          <button class="btn-action delete" onclick="deleteEmployee(${e.id})" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function openEmployeeModal(employee = null) {
  if (!canManageEmployees()) {
    showToast('You do not have permission to manage employees.', 'error');
    return;
  }

  if (!hasFeature('teamManagement')) {
    showToast('Upgrade to a paid plan to add employees.', 'error');
    return;
  }

  $('employeeId').value = employee ? employee.id : '';
  $('employeeFirstName').value = employee ? employee.firstName : '';
  $('employeeLastName').value = employee ? employee.lastName : '';
  $('employeeEmail').value = employee ? employee.email : '';
  $('employeePhone').value = employee ? employee.phone : '';
  $('employeeRole').value = employee ? employee.role : (getWorkspace().security.defaultNewHireRole || 'technician');
  $('employeeStatus').value = employee ? employee.status : 'active';
  $('employeePayType').value = employee ? employee.payType : employeePayTypeFromRole($('employeeRole').value);
  $('employeePayRate').value = employee ? Number(employee.payRate || 0) : '';
  $('employeeCommissionRate').value = employee ? Number((employee.commissionRate ?? (employee.payType === 'commission' ? employee.payRate : 0)) || 0) : '';
  $('employeeHourlyRate').value = employee ? Number(employee.hourlyRate || 0) : '';
  $('employeeStartTime').value = employee ? (employee.startTime || '08:00') : '08:00';
  $('employeeEndTime').value = employee ? (employee.endTime || '17:00') : '17:00';
  $('employeeMaxJobs').value = employee ? Number(employee.maxJobsPerDay || 6) : 6;
  $('employeePassword').value = '';
  $('employeeInviteCode').value = employee ? (employee.inviteCode || generateUniqueEmployeeInviteCode(employee.id)) : generateUniqueEmployeeInviteCode();
  applyAvailableDaysToForm(employee ? (employee.availableDays || [1, 2, 3, 4, 5]) : [1, 2, 3, 4, 5]);
  $('employeeNotes').value = employee ? employee.notes : '';
  syncEmployeePermissionForm(employee ? employee.role : $('employeeRole').value, employee?.permissions || null);
  $('employeeModalTitle').textContent = employee ? 'Edit Employee' : 'Add Employee';
  openModal('employeeModal');
}

function saveEmployee() {
  if (!canManageEmployees()) {
    showToast('You do not have permission to manage employees.', 'error');
    return;
  }

  const firstName = $('employeeFirstName').value.trim();
  const lastName = $('employeeLastName').value.trim();
  const payRate = Number($('employeePayRate').value || 0);
  const commissionRate = Number($('employeeCommissionRate').value || 0);
  const hourlyRate = Number($('employeeHourlyRate').value || 0);
  const employeePassword = $('employeePassword').value;

  if (!firstName || !lastName) {
    showToast('Employee first and last name are required.', 'error');
    return;
  }

  if (payRate < 0 || commissionRate < 0 || hourlyRate < 0) {
    showToast('Rates must be 0 or greater.', 'error');
    return;
  }

  if (employeePassword && !passwordMeetsPolicy(employeePassword)) {
    showToast('Employee password does not meet the workspace security policy.', 'error');
    return;
  }

  const employees = DB.employees;
  const id = $('employeeId').value;
  const employeeLimit = getActivePlan().employeeLimit;
  const activeEmployeeCount = employees.filter(employee => employee.status !== 'inactive').length;

  if (!id && Number.isFinite(employeeLimit) && activeEmployeeCount >= employeeLimit) {
    showToast(`Your ${getActivePlan().label} plan supports up to ${employeeLimit} employees.`, 'error');
    return;
  }

  const data = {
    id: id ? Number(id) : DB.nextId(employees),
    firstName,
    lastName,
    email: $('employeeEmail').value.trim(),
    phone: $('employeePhone').value.trim(),
    role: $('employeeRole').value,
    status: $('employeeStatus').value,
    payType: $('employeePayType').value,
    payRate,
    commissionRate,
    hourlyRate,
    startTime: $('employeeStartTime').value || '08:00',
    endTime: $('employeeEndTime').value || '17:00',
    maxJobsPerDay: Number($('employeeMaxJobs').value || 6),
    availableDays: getAvailableDaysFromForm(),
    notes: $('employeeNotes').value.trim(),
    permissions: readEmployeePermissionForm(),
    inviteCode: String($('employeeInviteCode').value || '').trim().toUpperCase() || generateUniqueEmployeeInviteCode(id ? Number(id) : null),
    createdAt: id ? (employees.find(e => e.id == id) || {}).createdAt : today()
  };

  if (id) {
    const i = employees.findIndex(e => e.id == id);
    if (i !== -1) employees[i] = data;
  } else {
    employees.push(data);
    addNotification(`${fullName(data)} added to team as ${roleLabel(data.role)}.`, data.id, 'employee');
  }

  DB.saveEmployees(employees);
  upsertEmployeeUser(data, employeePassword);
  closeModal('employeeModal');
  showToast(id ? `Employee updated! Join code: ${data.inviteCode}` : `Employee added! Join code: ${data.inviteCode}`);
  refreshEmployeeDropdowns();
  renderEmployeesTable();
  renderDashboard();
}

function regenerateEmployeeInviteCode() {
  if (!canManageEmployees()) {
    showToast('You do not have permission to manage employees.', 'error');
    return;
  }
  const employeeId = Number($('employeeId').value || 0);
  $('employeeInviteCode').value = generateUniqueEmployeeInviteCode(employeeId || null);
  showToast('New employee join code generated. Save employee to apply it.');
}

async function copyEmployeeInviteCode(employeeId) {
  const employee = DB.employees.find(entry => Number(entry.id) === Number(employeeId));
  const code = String(employee?.inviteCode || '').trim();
  if (!code) {
    showToast('No join code found for this employee.', 'error');
    return;
  }
  try {
    await navigator.clipboard.writeText(code);
    showToast('Employee join code copied.');
  } catch {
    showToast(`Employee join code: ${code}`);
  }
}

function editEmployee(id) {
  const employee = DB.employees.find(e => e.id === id);
  if (employee) openEmployeeModal(employee);
}

function deleteEmployee(id) {
  if (!canManageEmployees()) {
    showToast('You do not have permission to delete employees.', 'error');
    return;
  }
  if (!confirm('Delete this employee? Assigned booking references will remain on past jobs.')) return;
  DB.saveEmployees(DB.employees.filter(e => e.id !== id));
  showToast('Employee deleted.', 'info');
  refreshEmployeeDropdowns();
  renderEmployeesTable();
}

// ─── BOOKINGS ────────────────────────────────────────────────
function getBookingTabFilter() {
  const map = {
    'all-bookings': null,
    'booked-bookings': 'booked',
    'pending-bookings': 'pending',
    'confirmed-bookings': 'confirmed',
    'completed-bookings': 'completed',
    'cancelled-bookings': 'cancelled'
  };
  return map[currentBookingTab] || null;
}

function upsertRevenueFromCompletedJob(booking) {
  if (!booking || booking.status !== 'completed') return;

  const amount = Number(booking.amount || 0);
  if (amount <= 0) return;

  const payments = DB.payments;
  const existing = payments.find(p => Number(p.bookingId || 0) === Number(booking.id));

  const paymentData = {
    id: existing ? existing.id : DB.nextId(payments),
    bookingId: booking.id,
    clientId: booking.clientId,
    service: (booking.services || [booking.service]).join(', ') || 'Completed Job',
    amount,
    date: booking.completedAt ? booking.completedAt.slice(0, 10) : (booking.date || today()),
    method: existing?.method || 'other',
    status: 'paid',
    notes: existing?.notes || `Auto-added from completed booking #${String(booking.id).padStart(4, '0')}.`,
    createdAt: existing?.createdAt || today()
  };

  if (existing) {
    const i = payments.findIndex(p => p.id === existing.id);
    if (i !== -1) payments[i] = paymentData;
  } else {
    payments.push(paymentData);
  }

  DB.savePayments(payments);
}

function syncCompletedJobsToRevenue() {
  const completed = DB.bookings.filter(b => b.status === 'completed' && Number(b.amount || 0) > 0);
  if (!completed.length) return;
  completed.forEach(upsertRevenueFromCompletedJob);
}

function renderBookingsTable(search = '') {
  const clients = DB.clients;
  const employees = DB.employees;
  const bookings = DB.bookings;

  const statusFilter = getBookingTabFilter();

  let data = [...bookings].sort((a, b) => ((b.date || '') + (b.time || '')).localeCompare((a.date || '') + (a.time || '')));
  if (statusFilter) data = data.filter(b => b.status === statusFilter);
  if (isTechnician()) data = data.filter(b => Number(b.technicianId || 0) === Number(currentSession?.employeeId || 0));

  if (search) {
    const s = search.toLowerCase();
    data = data.filter(b => {
      const client = clients.find(c => c.id === b.clientId) || {};
      const tech = employees.find(e => e.id === b.technicianId) || {};
      const sales = employees.find(e => e.id === (b.soldById || b.salesmanId)) || {};
      const completed = employees.find(e => e.id === b.completedById) || {};
      return fullName(client).toLowerCase().includes(s)
        || (b.service || '').toLowerCase().includes(s)
        || fullName(tech).toLowerCase().includes(s)
        || fullName(sales).toLowerCase().includes(s)
        || fullName(completed).toLowerCase().includes(s);
    });
  }

  const tbody = $('bookingsBody');
  const empty = $('bookingsEmpty');

  if (!data.length) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = data.map(b => {
    const client = clients.find(c => c.id === b.clientId) || {};
    const sales = employees.find(e => e.id === (b.soldById || b.salesmanId));
    const tech = employees.find(e => e.id === b.technicianId);
    const completedBy = employees.find(e => e.id === b.completedById);
    const name = fullName(client);
    const editable = canEditBooking(b);
    const canComplete = editable && !['completed', 'cancelled'].includes(b.status)
      && (!isTechnician() || Number(b.technicianId || 0) === Number(currentSession?.employeeId || 0));

    const assignText = `<div style="display:flex;flex-direction:column;gap:4px;min-width:170px">
      <span style="font-size:12px;color:var(--text-secondary)">Sold By: ${sales ? fullName(sales) : 'Unassigned'}</span>
      <span style="font-size:12px;color:var(--text-secondary)">Tech: ${tech ? fullName(tech) : 'Unassigned'}</span>
      <span style="font-size:12px;color:var(--text-secondary)">Completed By: ${completedBy ? fullName(completedBy) : '-'}</span>
    </div>`;

    return `<tr>
      <td style="font-family:monospace;font-size:12px;color:var(--text-muted)">#${String(b.id).padStart(4, '0')}</td>
      <td>
        <div class="client-cell">
          <div class="client-avatar" style="background:${avatarColor(name)};width:28px;height:28px;font-size:10px">${initials(client.firstName, client.lastName)}</div>
          <span>${name}</span>
        </div>
      </td>
      <td>${(b.services || [b.service]).join(', ') || '-'}</td>
      <td>${assignText}</td>
      <td style="white-space:nowrap">${fmtDateTime(b.date, b.time)}</td>
      <td class="amount-cell">${b.amount ? fmt(b.amount) : '-'}</td>
      <td><span class="status-badge status-${b.status || 'booked'}">${b.status || 'booked'}</span></td>
      <td>
        <div class="action-btns">
          ${editable ? `<button class="btn-action edit" onclick="editBooking(${b.id})" title="Edit"><i class="fas fa-pencil"></i></button>` : ''}
          ${editable && ['booked', 'pending'].includes(b.status) ? `<button class="btn-action" onclick="confirmBooking(${b.id})" title="Confirm" style="color:var(--accent-green)"><i class="fas fa-check"></i></button>` : ''}
          ${canComplete ? `<button class="btn-action" onclick="markJobCompleted(${b.id})" title="Mark completed" style="color:var(--accent-blue)"><i class="fas fa-flag-checkered"></i></button>` : ''}
          ${isAdmin() ? `<button class="btn-action delete" onclick="deleteBooking(${b.id})" title="Delete"><i class="fas fa-trash"></i></button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function openBookingModal(booking = null, presetClientId = null) {
  if (!currentSession) return;
  if (!booking && !canCreateBookings()) {
    showToast('You do not have permission to create bookings.', 'error');
    return;
  }

  if (booking && !canEditBooking(booking)) {
    showToast('You can only edit bookings you are allowed to manage.', 'error');
    return;
  }
  
  if (!hasFeature('multipleServicesPerBooking') && booking?.services?.length > 1) {
    showUpgradePrompt('multipleServicesPerBooking', 'Upgrade to select multiple services per booking.');
    return;
  }

  refreshClientDropdowns();
  refreshEmployeeDropdowns();
  const employees = DB.employees;
  const completedBy = employees.find(e => e.id === booking?.completedById);

  $('bookingId').value = booking ? booking.id : '';
  $('bookingClient').value = booking ? booking.clientId : (presetClientId || '');
  
  // Support both old 'service' string and new 'services' array
  const servicesArray = booking?.services || (booking?.service ? [booking.service] : []);
  $('bookingServices').value = servicesArray.join(', ');
  
  $('bookingDate').value = booking ? booking.date : today();
  $('bookingTime').value = booking ? booking.time : '09:00';
  $('bookingDuration').value = booking ? booking.duration : String(getWorkspace().scheduling.defaultDuration || 60);
  $('bookingAmount').value = booking ? (booking.amount ?? '') : '';
  $('bookingSalesman').value = booking?.soldById || booking?.salesmanId || '';
  $('bookingTechnician').value = booking?.technicianId || '';
  $('bookingStatus').value = booking ? booking.status : (getWorkspace().scheduling.autoConfirm ? 'confirmed' : 'booked');
  $('bookingLocation').value = booking ? booking.location : '';
  $('bookingNotes').value = booking ? booking.notes : '';
  $('bookingCompletedBy').value = completedBy ? fullName(completedBy) : '';
  $('bookingCompletedAt').value = booking?.completedAt ? new Date(booking.completedAt).toLocaleString() : '';

  if (isTechnician()) {
    $('bookingSalesman').disabled = true;
    $('bookingTechnician').disabled = true;
    $('bookingAmount').disabled = true;
  } else {
    $('bookingSalesman').disabled = !canAssignBookings();
    $('bookingTechnician').disabled = !canAssignBookings();
    $('bookingAmount').disabled = false;
  }
  
  if (!hasFeature('multipleServicesPerBooking')) {
    $('bookingServices').placeholder = 'Select service (Pro plan unlocks multiple services)';
  } else {
    $('bookingServices').placeholder = 'Enter services (comma-separated)';
  }

  $('bookingModalTitle').textContent = booking ? 'Edit Booking' : 'New Booking';
  openModal('bookingModal');
}

function saveBooking() {
  const id = $('bookingId').value;
  if (!id && !canCreateBookings()) {
    showToast('You do not have permission to create bookings.', 'error');
    return;
  }

  const clientId = Number($('bookingClient').value || 0);
  const servicesInput = $('bookingServices').value.trim();
  const date = $('bookingDate').value;
  const time = $('bookingTime').value;

  if (!clientId || !servicesInput || !date || !time) {
    showToast('Client, service(s), date and time are required.', 'error');
    return;
  }
  
  const services = servicesInput.split(',').map(s => s.trim()).filter(Boolean);
  if (!hasFeature('multipleServicesPerBooking') && services.length > 1) {
    showUpgradePrompt('multipleServicesPerBooking', 'Upgrade to select multiple services per booking.');
    return;
  }

  const bookings = DB.bookings;
  const existing = id ? bookings.find(b => b.id == id) : null;
  const employees = DB.employees;
  const workspace = getWorkspace();

  if (existing && !canEditBooking(existing)) {
    showToast('You cannot edit this booking.', 'error');
    return;
  }

  const selectedTechId = $('bookingTechnician').value ? Number($('bookingTechnician').value) : null;
  const bookingDateObj = toDateObj(date);
  const bookingWindowEnd = new Date();
  bookingWindowEnd.setDate(bookingWindowEnd.getDate() + Number(workspace.scheduling.bookingWindowDays || 45));
  const amount = $('bookingAmount').value ? Number($('bookingAmount').value) : null;

  if (bookingDateObj > bookingWindowEnd) {
    showToast(`Bookings can only be scheduled ${workspace.scheduling.bookingWindowDays} days ahead on this plan.`, 'error');
    return;
  }

  if (selectedTechId) {
    const tech = employees.find(e => e.id === selectedTechId);
    if (!isEmployeeAvailableForBooking(tech, date, time)) {
      showToast('Selected technician is unavailable at this date/time.', 'error');
      return;
    }
    if (hasTechnicianConflict(selectedTechId, date, time, $('bookingDuration').value, existing?.id || null)) {
      showToast('This technician already has a conflicting booking inside the scheduling buffer.', 'error');
      return;
    }

    const techDailyLoad = bookings.filter(booking => booking.id !== existing?.id && booking.date === date && Number(booking.technicianId || 0) === selectedTechId && booking.status !== 'cancelled').length;
    if (techDailyLoad >= Number(workspace.scheduling.maxJobsPerTechPerDay || 6)) {
      showToast('This technician is already at the daily capacity limit set in workspace settings.', 'error');
      return;
    }
  }

  if ($('bookingStatus').value === 'completed' && workspace.management.requireCompletionNotes && !$('bookingNotes').value.trim()) {
    showToast('Completion notes are required before closing a job.', 'error');
    return;
  }

  const approvalThreshold = Number(workspace.management.approvalRequiredOver || 0);
  const needsApproval = approvalThreshold > 0 && Number(amount || 0) >= approvalThreshold;

  const data = {
    id: id ? Number(id) : DB.nextId(bookings),
    clientId,
    services,  // NEW: array of services
    service: services[0] || '',  // Keep for backward compatibility
    date,
    time,
    duration: $('bookingDuration').value,
    amount,
    salesmanId: $('bookingSalesman').value ? Number($('bookingSalesman').value) : null,
    soldById: $('bookingSalesman').value ? Number($('bookingSalesman').value) : null,
    technicianId: selectedTechId,
    status: needsApproval ? 'pending' : ($('bookingStatus').value || (workspace.scheduling.autoConfirm ? 'confirmed' : 'booked')),
    location: $('bookingLocation').value.trim(),
    notes: $('bookingNotes').value.trim(),
    completedAt: $('bookingStatus').value === 'completed' ? (existing?.completedAt || new Date().toISOString()) : null,
    completedById: $('bookingStatus').value === 'completed' ? (existing?.completedById || (isTechnician() ? currentSession?.employeeId : selectedTechId)) : null,
    createdAt: id ? existing?.createdAt : today()
  };

  if (id) {
    const i = bookings.findIndex(b => b.id == id);
    if (i !== -1) bookings[i] = data;
  } else {
    bookings.push(data);
  }

  DB.saveBookings(bookings);

  const templates = DB.templates;
  const scheduleChanged = existing && (existing.date !== data.date || existing.time !== data.time || existing.technicianId !== data.technicianId);
  if (scheduleChanged && data.technicianId) {
    const scheduleMsg = renderTemplate(templates.scheduleUpdate, {
      bookingId: String(data.id).padStart(4, '0'),
      date: fmtDate(data.date),
      time: data.time || 'TBD',
      service: data.services?.join(', ') || data.service
    });
    addNotification(scheduleMsg, data.technicianId, 'employee', data.id);
  }

  if (!id && data.soldById) {
    const sales = DB.employees.find(e => e.id === data.soldById);
    addNotification(`New booking assigned to sales: ${fullName(sales)}.`, data.salesmanId, 'employee', data.id);
  }

  if (needsApproval) {
    addNotification(`Booking #${String(data.id).padStart(4, '0')} requires manager approval because it exceeds ${fmt(approvalThreshold)}.`, null, 'system', data.id);
  }

  if (!existing || existing.technicianId !== data.technicianId) {
    if (data.technicianId) {
      const tech = DB.employees.find(e => e.id === data.technicianId);
      const assignMsg = renderTemplate(templates.assignment, {
        bookingId: String(data.id).padStart(4, '0'),
        service: data.services?.join(', ') || data.service,
        date: fmtDate(data.date),
        time: data.time || 'TBD'
      });
      addNotification(assignMsg, data.technicianId, 'employee', data.id);
      if (tech) showToast(`Assigned to ${fullName(tech)}.`);
    }
  }

  if (data.status === 'completed' && existing?.status !== 'completed') {
    handleBookingCompletion(data.id, true);
  }

  if (data.status === 'completed' && existing?.status === 'completed') {
    upsertRevenueFromCompletedJob(data);
  }

  closeModal('bookingModal');
  showToast(id ? 'Booking updated!' : 'Booking created!');
  renderBookingsTable();
  renderDashboard();
}

function editBooking(id) {
  const booking = DB.bookings.find(b => b.id === id);
  if (!booking) return;
  navigateTo('bookings');
  openBookingModal(booking);
}

function confirmBooking(id) {
  const bookings = DB.bookings;
  const i = bookings.findIndex(b => b.id === id);
  if (i === -1) return;
  if (!canEditBooking(bookings[i])) {
    showToast('You cannot confirm this booking.', 'error');
    return;
  }

  bookings[i].status = 'confirmed';
  DB.saveBookings(bookings);

  const b = bookings[i];
  const client = DB.clients.find(c => c.id === b.clientId);
  const confirmationMsg = renderTemplate(DB.templates.bookingConfirmation, {
    service: b.service || '-',
    date: fmtDate(b.date),
    time: b.time || 'TBD',
    clientName: fullName(client),
    bookingId: String(b.id).padStart(4, '0')
  });
  if (b.technicianId) addNotification(`Booking #${String(b.id).padStart(4, '0')} was confirmed.`, b.technicianId, 'employee', b.id);
  if (getWorkspace().notificationPrefs.leadAlerts) addNotification(`Client confirmation sent: ${confirmationMsg}`, null, 'system', b.id);

  showToast('Booking confirmed!');
  renderBookingsTable();
  renderDashboard();
}

function handleBookingCompletion(id, silent = false) {
  const bookings = DB.bookings;
  const i = bookings.findIndex(b => b.id === id);
  if (i === -1) return;

  const booking = bookings[i];
  if (!canEditBooking(booking)) {
    showToast('You cannot complete this booking.', 'error');
    return;
  }

  if (getWorkspace().management.requireCompletionNotes && !String(booking.notes || '').trim()) {
    showToast('Completion notes are required before closing a job.', 'error');
    return;
  }

  booking.status = 'completed';
  booking.completedAt = new Date().toISOString();
  booking.completedById = isTechnician() ? currentSession?.employeeId : (booking.technicianId || currentSession?.employeeId || null);
  DB.saveBookings(bookings);

  upsertRevenueFromCompletedJob(booking);

  const client = DB.clients.find(c => c.id === booking.clientId);
  const followUp = renderTemplate(DB.templates.completionFollowUp, {
    clientName: fullName(client),
    service: (booking.services || [booking.service]).join(', ') || '-',
    date: fmtDate(booking.date),
    time: booking.time || 'TBD'
  });

  if (booking.soldById || booking.salesmanId) addNotification(`Booking #${String(booking.id).padStart(4, '0')} completed by technician.`, (booking.soldById || booking.salesmanId), 'employee', booking.id);
  if (booking.technicianId) addNotification(`Marked completed: booking #${String(booking.id).padStart(4, '0')}.`, booking.technicianId, 'employee', booking.id);
  addNotification(`Completion follow-up ready: ${followUp}`, null, 'system', booking.id);
  const completingEmp = DB.employees.find(e => Number(e.id) === Number(booking.completedById || booking.technicianId));
  addNotification(`${completingEmp ? fullName(completingEmp) : 'A team member'} completed booking #${String(booking.id).padStart(4, '0')}.`, null, 'team', booking.id);
  if (!silent) showToast('Job marked completed by technician workflow.');

  renderBookingsTable();
  renderDashboard();
  if (currentPage === 'payroll') renderPayrollPage();
}

function markJobCompleted(id) {
  handleBookingCompletion(id);
}

function deleteBooking(id) {
  if (!isAdmin()) {
    showToast('Only admin can delete bookings.', 'error');
    return;
  }
  if (!confirm('Delete this booking?')) return;
  DB.saveBookings(DB.bookings.filter(b => b.id !== id));
  showToast('Booking deleted.', 'info');
  renderBookingsTable();
  renderDashboard();
}

// ─── PUBLIC BOOKING FORM ─────────────────────────────────────
function openPublicBookingModal() {
  $('pubFirstName').value = '';
  $('pubLastName').value = '';
  $('pubEmail').value = '';
  $('pubPhone').value = '';
  $('pubService').value = '';
  $('pubDate').value = today();
  $('pubTime').value = '10:00';
  $('pubDuration').value = '60';
  $('pubNotes').value = '';
  const managerQuestions = normalizeManagerBookingQuestions(getWorkspace().teamRoles?.manager?.bookingQuestions || []);
  if ($('publicBookingCustomQuestions')) {
    $('publicBookingCustomQuestions').innerHTML = managerQuestions.map((question, idx) => `
      <div class="form-group">
        <label>${question.label}</label>
        ${question.type === 'yesno'
          ? `<select id="pubCustomQuestion${idx}"><option value="">Select one</option><option value="Yes">Yes</option><option value="No">No</option></select>`
          : `<input type="text" id="pubCustomQuestion${idx}" placeholder="Your answer" />`}
      </div>
    `).join('');
  }
  openModal('publicBookingModal');
}

function submitPublicBooking() {
  const firstName = $('pubFirstName').value.trim();
  const lastName = $('pubLastName').value.trim();
  const email = $('pubEmail').value.trim();
  const service = $('pubService').value.trim();
  const date = $('pubDate').value;
  const time = $('pubTime').value;

  if (!firstName || !lastName || !email || !service || !date || !time) {
    showToast('Please fill all required fields.', 'error');
    return;
  }

  const clients = DB.clients;
  let client = clients.find(c => c.email && c.email.toLowerCase() === email.toLowerCase());

  if (!client) {
    client = {
      id: DB.nextId(clients),
      firstName,
      lastName,
      email,
      phone: $('pubPhone').value.trim(),
      company: '',
      status: 'active',
      notes: '',
      createdAt: today()
    };
    clients.push(client);
    DB.saveClients(clients);
  }

  const bookings = DB.bookings;
  const salesmen = DB.employees.filter(e => e.role === 'salesman' && e.status === 'active');
  const workspace = getWorkspace();
  const managerQuestions = normalizeManagerBookingQuestions(workspace.teamRoles?.manager?.bookingQuestions || []);
  const customQuestionResponses = managerQuestions.map((question, idx) => ({
    question: question.label,
    answer: String($(`pubCustomQuestion${idx}`)?.value || '').trim()
  })).filter(entry => entry.answer);
  const nextSalesmanId = workspace.scheduling.roundRobinRouting && salesmen.length
    ? salesmen[bookings.length % salesmen.length].id
    : (salesmen.length ? salesmen[0].id : null);

  bookings.push({
    id: DB.nextId(bookings),
    clientId: client.id,
    services: [service],
    service,  // backward compatibility
    date,
    time,
    duration: $('pubDuration').value,
    amount: null,
    salesmanId: nextSalesmanId,
    soldById: nextSalesmanId,
    technicianId: null,
    status: workspace.scheduling.autoConfirm ? 'confirmed' : 'booked',
    location: '',
    notes: $('pubNotes').value.trim(),
    customQuestionResponses,
    completedAt: null,
    completedById: null,
    createdAt: today()
  });

  DB.saveBookings(bookings);
  if (workspace.notificationPrefs.leadAlerts) addNotification(`New public booking request received from ${firstName} ${lastName}.`, null, 'system');
  closeModal('publicBookingModal');
  showToast('Booking request submitted! Pending confirmation.');

  refreshClientDropdowns();
  renderDashboard();
  renderBookingsTable();
  renderClientsTable();
}

// ─── SCHEDULE / CALENDAR ─────────────────────────────────────
function renderCalendar() {
  if (calendarViewMode === 'monthly') {
    renderMonthlyCalendar();
    return;
  }

  renderWeeklyCalendar();
}

function getFilteredDayBookings(dateStr, allBookings) {
  const selectedEmployee = $('scheduleEmployeeFilter')?.value || 'all';
  let dayBookings = allBookings
    .filter(b => b.date === dateStr && b.status !== 'cancelled')
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  if (selectedEmployee !== 'all') {
    const id = Number(selectedEmployee);
    dayBookings = dayBookings.filter(b => Number(b.technicianId || 0) === id || Number(b.soldById || b.salesmanId || 0) === id || Number(b.completedById || 0) === id);
  }

  if (isTechnician()) {
    dayBookings = dayBookings.filter(b => Number(b.technicianId || 0) === Number(currentSession?.employeeId || 0));
  }

  return dayBookings;
}

function renderDayEvents(dayBookings, clients, employees) {
  return dayBookings.map(b => {
    const client = clients.find(c => c.id === b.clientId) || {};
    const tech = employees.find(e => e.id === b.technicianId);
    const [h, m] = (b.time || '00:00').split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `<div class="cal-event status-${b.status}" onclick="editBooking(${b.id})" title="${fullName(client)} — ${b.service}">${hour}:${pad(m)} ${suffix} ${fullName(client)}${tech ? ` · ${initials(tech.firstName, tech.lastName)}` : ''}</div>`;
  }).join('');
}

function renderWeeklyCalendar() {
  const bookings = DB.bookings;
  const clients = DB.clients;
  const employees = DB.employees;

  const base = new Date();
  base.setDate(base.getDate() + calendarOffset * 7);

  const dow = base.getDay();
  const start = new Date(base);
  start.setDate(base.getDate() - dow);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  $('weekLabel').textContent = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayStr = today();

  let html = days.map(d => `<div class="cal-header">${d}</div>`).join('');

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const dayBookings = getFilteredDayBookings(ds, bookings);
    const events = renderDayEvents(dayBookings, clients, employees);

    html += `<div class="cal-day${ds === todayStr ? ' today' : ''}" onclick="quickDayBook('${ds}')">
      <div class="cal-date">${d.getDate()}</div>
      ${events}
    </div>`;
  }

  $('calendarGrid').innerHTML = html;
}

function renderMonthlyCalendar() {
  const bookings = DB.bookings;
  const clients = DB.clients;
  const employees = DB.employees;

  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + calendarOffset);

  const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);
  const monthEnd = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());

  $('weekLabel').textContent = `${monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayStr = today();
  let html = days.map(d => `<div class="cal-header">${d}</div>`).join('');

  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const dayBookings = getFilteredDayBookings(ds, bookings);
    const events = renderDayEvents(dayBookings, clients, employees);
    const otherMonth = d.getMonth() !== monthStart.getMonth();

    html += `<div class="cal-day${ds === todayStr ? ' today' : ''}${otherMonth ? ' other-month' : ''}" onclick="quickDayBook('${ds}')">
      <div class="cal-date">${d.getDate()}</div>
      ${events}
    </div>`;
  }

  $('calendarGrid').innerHTML = html;
}

function smartAssignOpenJobs() {
  if (!hasFeature('smartScheduling')) {
    showToast('Smart scheduling is available on Growth and Unlimited plans.', 'error');
    return;
  }

  const bookings = DB.bookings;
  const employees = DB.employees.filter(e => e.role === 'technician' && e.status === 'active');
  if (!employees.length) {
    showToast('Add active technicians before smart assign.', 'error');
    return;
  }

  const openJobs = bookings.filter(b => !['completed', 'cancelled'].includes(b.status) && !b.technicianId);
  if (!openJobs.length) {
    showToast('No open jobs need assignment.', 'info');
    return;
  }

  let assigned = 0;
  for (const job of openJobs) {
    const candidates = employees.filter(e => isEmployeeAvailableForBooking(e, job.date, job.time));
    if (!candidates.length) continue;

    const best = [...candidates].sort((a, b) => {
      const aLoad = bookings.filter(x => x.technicianId === a.id && x.date === job.date && x.status !== 'cancelled').length;
      const bLoad = bookings.filter(x => x.technicianId === b.id && x.date === job.date && x.status !== 'cancelled').length;
      return aLoad - bLoad;
    })[0];

    const dailyLoad = bookings.filter(x => x.technicianId === best.id && x.date === job.date && x.status !== 'cancelled').length;
    if (dailyLoad >= Number(best.maxJobsPerDay || 6)) continue;

    job.technicianId = best.id;
    addNotification(`Smart assigned booking #${String(job.id).padStart(4, '0')} to ${fullName(best)}.`, best.id, 'employee', job.id);
    assigned++;
  }

  DB.saveBookings(bookings);
  renderCalendar();
  renderBookingsTable();
  renderDashboard();
  showToast(`Smart assigned ${assigned} job${assigned === 1 ? '' : 's'}.`);
}

function quickDayBook(date) {
  navigateTo('bookings');
  openBookingModal();
  $('bookingDate').value = date;
}

// ─── REVENUE ─────────────────────────────────────────────────
function renderRevenueTable(filter = $('revenueFilter')?.value || 'all') {
  syncCompletedJobsToRevenue();

  const payments = DB.payments;
  const clients = DB.clients;
  const bookings = DB.bookings;
  const now = new Date();
  const selectedTab = document.querySelector('.revenue-tab.active');
  const activeFilter = filter || selectedTab?.dataset.revenueFilter || 'all';
  const todayStr = today();

  const weekStart = new Date(now);
  const day = weekStart.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  weekStart.setDate(weekStart.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  let data = [...payments].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (activeFilter === 'day') {
    data = data.filter(p => p.date === todayStr);
  } else if (activeFilter === 'week') {
    data = data.filter(p => {
      const d = toDateObj(p.date);
      return d >= weekStart && d <= weekEnd;
    });
  }

  if (activeFilter === 'month') {
    data = data.filter(p => {
      const d = toDateObj(p.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  } else if (activeFilter === 'year') {
    data = data.filter(p => toDateObj(p.date).getFullYear() === now.getFullYear());
  }

  const allPaid = payments.filter(p => p.status === 'paid');
  const dailyPaid = allPaid.filter(p => p.date === todayStr);
  const weeklyPaid = allPaid.filter(p => {
    const d = toDateObj(p.date);
    return d >= weekStart && d <= weekEnd;
  });
  const monthPaid = allPaid.filter(p => {
    const d = toDateObj(p.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const yearPaid = allPaid.filter(p => toDateObj(p.date).getFullYear() === now.getFullYear());
  const bookedRevenueTotal = bookings
    .filter(b => ['booked', 'pending', 'confirmed'].includes(b.status))
    .reduce((s, b) => s + Number(b.amount || 0), 0);

  if ($('dailyRevenue')) $('dailyRevenue').textContent = fmt(dailyPaid.reduce((s, p) => s + Number(p.amount || 0), 0));
  if ($('weeklyRevenue')) $('weeklyRevenue').textContent = fmt(weeklyPaid.reduce((s, p) => s + Number(p.amount || 0), 0));
  $('monthRevenue').textContent = fmt(monthPaid.reduce((s, p) => s + Number(p.amount || 0), 0));
  $('yearRevenue').textContent = fmt(yearPaid.reduce((s, p) => s + Number(p.amount || 0), 0));
  if ($('bookedRevenue')) $('bookedRevenue').textContent = fmt(bookedRevenueTotal);

  const tbody = $('revenueBody');
  const empty = $('revenueEmpty');

  if (!data.length) {
    tbody.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = data.map(p => {
    const client = clients.find(c => c.id === p.clientId) || {};
    return `<tr>
      <td style="white-space:nowrap">${fmtDate(p.date)}</td>
      <td>
        <div class="client-cell">
          <div class="client-avatar" style="background:${avatarColor(fullName(client))};width:28px;height:28px;font-size:10px">${initials(client.firstName, client.lastName)}</div>
          <span>${fullName(client)}</span>
        </div>
      </td>
      <td>${p.service || '-'}</td>
      <td class="amount-cell amount-positive">${fmt(p.amount)}</td>
      <td style="text-transform:capitalize">${p.method || '-'}</td>
      <td><span class="status-badge status-${p.status || 'paid'}">${p.status || 'paid'}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn-action edit" onclick="editPayment(${p.id})" title="Edit"><i class="fas fa-pencil"></i></button>
          <button class="btn-action delete" onclick="deletePayment(${p.id})" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function openPaymentModal(payment = null) {
  if (!isAdmin()) {
    showToast('Only admin can manage payments.', 'error');
    return;
  }
  refreshClientDropdowns();
  $('paymentId').value = payment ? payment.id : '';
  $('paymentClient').value = payment ? payment.clientId : '';
  $('paymentService').value = payment ? payment.service : '';
  $('paymentAmount').value = payment ? payment.amount : '';
  $('paymentDate').value = payment ? payment.date : today();
  $('paymentMethod').value = payment ? payment.method : 'cash';
  $('paymentStatus').value = payment ? payment.status : 'paid';
  $('paymentNotes').value = payment ? payment.notes : '';
  $('paymentModalTitle').textContent = payment ? 'Edit Payment' : 'Record Payment';
  openModal('paymentModal');
}

function savePayment() {
  if (!isAdmin()) {
    showToast('Only admin can manage payments.', 'error');
    return;
  }

  const clientId = Number($('paymentClient').value || 0);
  const amount = Number($('paymentAmount').value || 0);
  const date = $('paymentDate').value;

  if (!clientId || !amount || !date) {
    showToast('Client, amount and date are required.', 'error');
    return;
  }

  const payments = DB.payments;
  const id = $('paymentId').value;

  const data = {
    id: id ? Number(id) : DB.nextId(payments),
    clientId,
    service: $('paymentService').value.trim(),
    amount,
    date,
    method: $('paymentMethod').value,
    status: $('paymentStatus').value,
    notes: $('paymentNotes').value.trim(),
    createdAt: id ? (payments.find(p => p.id == id) || {}).createdAt : today()
  };

  if (id) {
    const i = payments.findIndex(p => p.id == id);
    if (i !== -1) payments[i] = data;
  } else {
    payments.push(data);
  }

  DB.savePayments(payments);
  closeModal('paymentModal');
  showToast(id ? 'Payment updated!' : 'Payment recorded!');
  renderRevenueTable();
  renderDashboard();
}

function editPayment(id) {
  const payment = DB.payments.find(p => p.id === id);
  if (payment) openPaymentModal(payment);
}

function deletePayment(id) {
  if (!isAdmin()) {
    showToast('Only admin can delete payments.', 'error');
    return;
  }
  if (!confirm('Delete this payment record?')) return;
  DB.savePayments(DB.payments.filter(p => p.id !== id));
  showToast('Payment deleted.', 'info');
  renderRevenueTable();
  renderDashboard();
}

// ─── QUOTES ─────────────────────────────────────────────────
function parseQuoteItemsInput(input) {
  return String(input || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split('|').map(part => part.trim());
      const description = parts[0] || `Line item ${index + 1}`;
      const qty = Math.max(0, Number(parts[1] || 1));
      const rate = Math.max(0, Number(parts[2] || 0));
      const lineTotal = Number((qty * rate).toFixed(2));
      return { description, qty, rate, lineTotal };
    })
    .filter(item => item.description && (item.qty > 0 || item.rate > 0));
}

function saveQuote() {
  const clientId = Number($('quoteClient')?.value || 0);
  const title = String($('quoteTitle')?.value || '').trim() || 'Service Quote';
  const items = parseQuoteItemsInput($('quoteItems')?.value || '');
  const taxPct = Math.max(0, Number($('quoteTax')?.value || 0));
  const notes = String($('quoteNotes')?.value || '').trim();

  if (!clientId) {
    showToast('Select a client before saving a quote.', 'error');
    return;
  }
  if (!items.length) {
    showToast('Add at least one quote line item.', 'error');
    return;
  }

  const subtotal = Number(items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0).toFixed(2));
  const taxAmount = Number((subtotal * (taxPct / 100)).toFixed(2));
  const total = Number((subtotal + taxAmount).toFixed(2));
  const quotes = DB.quotes;

  quotes.push({
    id: DB.nextId(quotes),
    clientId,
    title,
    items,
    subtotal,
    taxPct,
    taxAmount,
    total,
    notes,
    status: 'draft',
    createdAt: new Date().toISOString()
  });

  DB.saveQuotes(quotes);
  if ($('quoteItems')) $('quoteItems').value = '';
  if ($('quoteNotes')) $('quoteNotes').value = '';
  if ($('quoteTax')) $('quoteTax').value = '0';
  renderQuotesPage();
  showToast('Quote saved.');
}

function renderQuotesPage() {
  const body = $('quotesBody');
  const empty = $('quotesEmpty');
  if (!body || !empty) return;

  const clients = DB.clients;
  const quotes = DB.quotes.slice().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  if (!quotes.length) {
    body.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  body.innerHTML = quotes.map(quote => {
    const client = clients.find(entry => Number(entry.id) === Number(quote.clientId)) || {};
    return `<tr>
      <td>#${String(quote.id).padStart(4, '0')}</td>
      <td>${fullName(client)}</td>
      <td>${quote.title || 'Service Quote'}</td>
      <td>${Number(quote.items?.length || 0)} item(s)</td>
      <td>${fmt(quote.subtotal || 0)}</td>
      <td>${quote.taxPct || 0}%</td>
      <td class="amount-cell amount-positive">${fmt(quote.total || 0)}</td>
      <td>${fmtDate((quote.createdAt || '').slice(0, 10) || today())}</td>
    </tr>`;
  }).join('');
}

// ─── PAYROLL ─────────────────────────────────────────────────
function calculatePayrollForEmployee(employee, periodStart, periodEnd) {
  const bookings = DB.bookings.filter(b => (
    b.date
    && b.date >= periodStart
    && b.date <= periodEnd
    && b.status === 'completed'
  ));

  const commissionRate = Number((employee.commissionRate ?? (employee.payType === 'commission' ? employee.payRate : 0)) || 0);
  const hourlyRate = Number(employee.hourlyRate || 0);
  const perJobRate = Number(employee.payRate || 0);

  const hoursFrom = jobs => jobs.reduce((sum, j) => sum + (Number(j.duration || 0) / 60), 0);

  if (employee.role === 'salesman' || employee.role === 'manager') {
    const jobs = bookings.filter(b => (b.soldById || b.salesmanId) === employee.id);
    const revenue = jobs.reduce((s, b) => s + Number(b.amount || 0), 0);
    const hours = hoursFrom(jobs);
    const commissionAmount = revenue * (commissionRate / 100);
    const hourlyAmount = hours * hourlyRate;
    const amount = commissionAmount + hourlyAmount;
    return {
      amount,
      details: `${commissionRate}% commission (${fmt(commissionAmount)}) + ${hours.toFixed(2)}h @ ${fmt(hourlyRate)} (${fmt(hourlyAmount)}).`
    };
  }

  const jobs = bookings.filter(b => (b.completedById || b.technicianId) === employee.id);
  const hours = hoursFrom(jobs);
  const hourlyAmount = hours * hourlyRate;
  const perJobAmount = jobs.length * perJobRate;
  const amount = hourlyAmount + perJobAmount;
  return {
    amount,
    details: `${hours.toFixed(2)}h @ ${fmt(hourlyRate)} (${fmt(hourlyAmount)}) + ${jobs.length} jobs x ${fmt(perJobRate)} (${fmt(perJobAmount)}).`
  };
}

function runPayrollThisMonth() {
  if (!hasFeature('payrollAutomation')) {
    showToast('Payroll automation is included in paid plans.', 'error');
    return;
  }

  if (!isAdmin()) {
    showToast('Only admin can run payroll.', 'error');
    return;
  }

  const employees = DB.employees.filter(e => e.status === 'active');
  if (!employees.length) {
    showToast('Add employees before running payroll.', 'error');
    return;
  }

  const periodStart = startOfMonth();
  const periodEnd = endOfMonth();
  const payroll = DB.payroll;
  const runDate = today();

  employees.forEach(employee => {
    const calc = calculatePayrollForEmployee(employee, periodStart, periodEnd);
    payroll.push({
      id: DB.nextId(payroll),
      employeeId: employee.id,
      role: employee.role,
      periodStart,
      periodEnd,
      details: calc.details,
      amount: Number(calc.amount.toFixed(2)),
      runDate,
      createdAt: new Date().toISOString()
    });
  });

  DB.savePayroll(payroll);
  addNotification(`Payroll run completed for ${employees.length} employee${employees.length > 1 ? 's' : ''}.`, null, 'system');
  if (getWorkspace().notificationPrefs.payrollAlerts) {
    const period = `${fmtDate(periodStart)} - ${fmtDate(periodEnd)}`;
    employees.forEach(employee => {
      const employeeTotal = payroll
        .filter(entry => entry.employeeId === employee.id && entry.periodStart === periodStart && entry.periodEnd === periodEnd)
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
      const payrollMsg = renderTemplate(DB.templates.payrollNotice, {
        period,
        amount: fmt(employeeTotal),
        employeeName: fullName(employee)
      });
      addNotification(payrollMsg, employee.id, 'employee');
    });
  }
  showToast('Payroll run completed for this month.');
  renderPayrollPage();
  renderDashboard();
}

function renderPayrollPage() {
  const allPayroll = DB.payroll;
  const employees = DB.employees;

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const monthEnd = endOfMonth();

  const payroll = isAdmin()
    ? allPayroll
    : allPayroll.filter(entry => Number(entry.employeeId) === Number(currentSession?.employeeId || 0));

  const thisMonth = payroll.filter(p => p.periodStart === monthStart && p.periodEnd === monthEnd);
  const salesTotal = thisMonth.filter(p => p.role === 'salesman' || p.role === 'manager').reduce((s, p) => s + Number(p.amount || 0), 0);
  const techTotal = thisMonth.filter(p => p.role === 'technician').reduce((s, p) => s + Number(p.amount || 0), 0);

  $('payrollMonthTotal').textContent = fmt(salesTotal + techTotal);
  $('salesPayrollTotal').textContent = fmt(salesTotal);
  $('techPayrollTotal').textContent = fmt(techTotal);
  $('payrollRunsCount').textContent = String(payroll.length);

  const body = $('payrollBody');
  const empty = $('payrollEmpty');

  if (!payroll.length) {
    body.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  const sorted = [...payroll].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  body.innerHTML = sorted.map(p => {
    const employee = employees.find(e => e.id === p.employeeId) || {};
    return `<tr>
      <td style="white-space:nowrap">${fmtDate(p.runDate)}</td>
      <td>${fullName(employee)}</td>
      <td><span class="status-badge ${p.role === 'salesman' ? 'status-vip' : 'status-confirmed'}">${roleLabel(p.role)}</span></td>
      <td>${fmtDate(p.periodStart)} - ${fmtDate(p.periodEnd)}</td>
      <td>${p.details || '-'}</td>
      <td class="amount-cell amount-positive">${fmt(p.amount)}</td>
    </tr>`;
  }).join('');
}

function startOfWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const d = new Date(now);
  d.setDate(now.getDate() + diff);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getEmployeeClockSessions(employeeId) {
  return DB.clockSessions
    .filter(session => Number(session.employeeId) === Number(employeeId))
    .sort((a, b) => (b.clockInAt || '').localeCompare(a.clockInAt || ''));
}

function getActiveClockSession(employeeId) {
  return getEmployeeClockSessions(employeeId).find(session => !session.clockOutAt) || null;
}

function toHoursFromSession(session) {
  const start = new Date(session.clockInAt).getTime();
  const end = session.clockOutAt ? new Date(session.clockOutAt).getTime() : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return (end - start) / (1000 * 60 * 60);
}

function toggleClockForCurrentEmployee() {
  if (!currentSession?.employeeId) {
    showToast('Only employees can clock in or out.', 'error');
    return;
  }

  const sessions = DB.clockSessions;
  const active = getActiveClockSession(currentSession.employeeId);
  if (active) {
    const idx = sessions.findIndex(session => session.id === active.id);
    if (idx !== -1) {
      const closedAt = new Date().toISOString();
      const hours = toHoursFromSession({ ...sessions[idx], clockOutAt: closedAt });
      sessions[idx] = {
        ...sessions[idx],
        clockOutAt: closedAt,
        hours: Number(hours.toFixed(2))
      };
      DB.saveClockSessions(sessions);
      const empOut = getCurrentEmployee();
      if (empOut) addNotification(`${fullName(empOut)} clocked out after ${hours.toFixed(2)}h.`, null, 'team');
      showToast('Clocked out. Session saved.');
    }
  } else {
    sessions.push({
      id: DB.nextId(sessions),
      employeeId: Number(currentSession.employeeId),
      clockInAt: new Date().toISOString(),
      clockOutAt: null,
      hours: 0
    });
    DB.saveClockSessions(sessions);
    const empIn = getCurrentEmployee();
    if (empIn) addNotification(`${fullName(empIn)} clocked in.`, null, 'team');
    showToast('Clocked in. Have a productive shift.');
  }

  renderMyPortalPage();
}

function claimOpenJobForCurrentEmployee(bookingId) {
  const employee = getCurrentEmployee();
  if (!employee) {
    showToast('Only employees can claim jobs.', 'error');
    return;
  }

  const workspace = getWorkspace();
  if (!workspace.management.allowEmployeeSelfAssign && !isManager()) {
    showToast('Self-assign is disabled by the owner.', 'error');
    return;
  }

  const bookings = DB.bookings;
  const booking = bookings.find(entry => Number(entry.id) === Number(bookingId));
  if (!booking) {
    showToast('Booking not found.', 'error');
    return;
  }
  if (booking.technicianId || ['completed', 'cancelled'].includes(booking.status)) {
    showToast('This job is no longer available.', 'info');
    renderMyPortalPage();
    return;
  }
  if (!isEmployeeAvailableForBooking(employee, booking.date, booking.time)) {
    showToast('This job is outside your current availability window.', 'error');
    return;
  }

  booking.technicianId = employee.id;
  booking.status = booking.status === 'booked' ? 'confirmed' : booking.status;
  DB.saveBookings(bookings);
  addNotification(`${fullName(employee)} claimed booking #${String(booking.id).padStart(4, '0')}.`, null, 'system', booking.id);
  renderBookingsTable();
  renderCalendar();
  renderDashboard();
  renderMyPortalPage();
  showToast('Job claimed successfully.');
}

function saveMyAvailability() {
  const employee = getCurrentEmployee();
  if (!employee) {
    showToast('Only employees can update availability.', 'error');
    return;
  }

  const startTime = $('myPortalStartTime').value || '08:00';
  const endTime = $('myPortalEndTime').value || '17:00';
  const maxJobsPerDay = Math.max(1, Number($('myPortalMaxJobs').value || 6));
  const availableDays = [...document.querySelectorAll('#myPortalAvailableDays input[type="checkbox"]:checked')].map(input => Number(input.value));

  if (toMinutes(endTime) <= toMinutes(startTime)) {
    showToast('End time must be after start time.', 'error');
    return;
  }

  const employees = DB.employees;
  const index = employees.findIndex(entry => Number(entry.id) === Number(employee.id));
  if (index === -1) {
    showToast('Employee profile not found.', 'error');
    return;
  }

  employees[index] = {
    ...employees[index],
    startTime,
    endTime,
    maxJobsPerDay,
    availableDays: availableDays.length ? availableDays : [1, 2, 3, 4, 5]
  };

  DB.saveEmployees(employees);
  refreshEmployeeDropdowns();
  renderCalendar();
  renderMyPortalPage();
  showToast('Availability updated.');
}

function renderOwnerPortalPage() {
  if (!isAdmin()) return;

  const bookings = DB.bookings;
  const employees = DB.employees.filter(employee => employee.status === 'active');
  const payments = DB.payments;
  const workspace = getWorkspace();
  const affiliates = workspaceAffiliates();
  const affiliateEvents = workspaceAffiliateEvents();
  const pendingApprovals = bookings.filter(booking => booking.status === 'pending').length;
  const openJobs = bookings.filter(booking => !booking.technicianId && !['completed', 'cancelled'].includes(booking.status)).length;
  const assignedToday = bookings.filter(booking => booking.date === today() && booking.technicianId && booking.status !== 'cancelled').length;
  const payrollRowsThisMonth = DB.payroll.filter(row => row.periodStart === startOfMonth() && row.periodEnd === endOfMonth());
  const payrollThisMonth = payrollRowsThisMonth.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const monthRevenue = payments
    .filter(payment => payment.status === 'paid' && (payment.date || '').slice(0, 7) === today().slice(0, 7))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const affiliateRevenue = affiliates.reduce((sum, affiliate) => sum + Number(affiliate.revenueAttributed || 0), 0);
  const affiliateDue = affiliates.reduce((sum, affiliate) => sum + Number(affiliate.payoutDue || 0), 0);
  const affiliateProgramLive = Boolean(workspace.growth?.affiliateEnabled || affiliates.length > 0);

  if ($('ownerPortalStatsGrid')) {
    $('ownerPortalStatsGrid').innerHTML = `
      <div class="stat-card accent-red"><div class="stat-icon"><i class="fas fa-triangle-exclamation"></i></div><div class="stat-info"><span class="stat-label">Pending Approvals</span><span class="stat-value">${pendingApprovals}</span></div></div>
      <div class="stat-card accent-orange"><div class="stat-icon"><i class="fas fa-briefcase"></i></div><div class="stat-info"><span class="stat-label">Open Jobs</span><span class="stat-value">${openJobs}</span></div></div>
      <div class="stat-card accent-blue"><div class="stat-icon"><i class="fas fa-user-check"></i></div><div class="stat-info"><span class="stat-label">Assigned Today</span><span class="stat-value">${assignedToday}</span></div></div>
      <div class="stat-card accent-green"><div class="stat-icon"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><span class="stat-label">Revenue This Month</span><span class="stat-value">${fmt(monthRevenue)}</span></div></div>
      <div class="stat-card accent-purple"><div class="stat-icon"><i class="fas fa-money-check-dollar"></i></div><div class="stat-info"><span class="stat-label">Payroll This Month</span><span class="stat-value">${fmt(payrollThisMonth)}</span></div></div>
      <div class="stat-card accent-cyan"><div class="stat-icon"><i class="fas fa-handshake-angle"></i></div><div class="stat-info"><span class="stat-label">Affiliate Revenue</span><span class="stat-value">${fmt(affiliateRevenue)}</span></div></div>
    `;
  }

  const queue = $('ownerPortalQueueList');
  if (queue) {
    const approvalList = bookings
      .filter(booking => booking.status === 'pending')
      .slice(0, 8)
      .map(booking => `<div class="workspace-list-item"><div><strong>Booking #${String(booking.id).padStart(4, '0')}</strong><span>${fmtDate(booking.date)} ${booking.time || ''} · ${(booking.services || [booking.service]).join(', ') || '-'}</span></div><button class="btn-link" onclick="editBooking(${booking.id})">Review</button></div>`)
      .join('');
    const openList = bookings
      .filter(booking => !booking.technicianId && !['completed', 'cancelled'].includes(booking.status))
      .slice(0, 8)
      .map(booking => `<div class="workspace-list-item"><div><strong>Unassigned #${String(booking.id).padStart(4, '0')}</strong><span>${fmtDate(booking.date)} ${booking.time || ''}</span></div><button class="btn-link" onclick="editBooking(${booking.id})">Assign</button></div>`)
      .join('');
    queue.innerHTML = approvalList || openList || '<div class="empty-state"><i class="fas fa-briefcase"></i><p>No management items yet.</p></div>';
  }

  const teamLoad = $('ownerPortalTeamLoadList');
  if (teamLoad) {
    if (!employees.length) {
      teamLoad.innerHTML = '<div class="empty-state"><i class="fas fa-users-gear"></i><p>No employee data yet.</p></div>';
    } else {
      teamLoad.innerHTML = employees.slice(0, 16).map(employee => {
        const todayLoad = bookings.filter(booking => booking.date === today() && Number(booking.technicianId || 0) === Number(employee.id) && booking.status !== 'cancelled').length;
        const cap = Number(employee.maxJobsPerDay || 6);
        const days = (employee.availableDays || [1, 2, 3, 4, 5]).length;
        return `<div class="workspace-list-item"><div><strong>${fullName(employee)} (${roleLabel(employee.role)})</strong><span>${employee.startTime || '08:00'}-${employee.endTime || '17:00'} · ${days} available day(s)</span></div><span class="pill-tag">${todayLoad}/${cap} today</span></div>`;
      }).join('');
    }
  }

  const ownerNotificationList = $('ownerPortalNotificationList');
  if (ownerNotificationList) {
    const teamFeed = DB.notifications
      .filter(notification => notification.type === 'team' || notification.type === 'system')
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 20);
    ownerNotificationList.innerHTML = teamFeed.length
      ? teamFeed.map(notification => {
          const isTeam = notification.type === 'team';
          const borderColor = notification.read ? 'transparent' : (isTeam ? 'var(--accent-green)' : 'var(--accent-blue)');
          return `<div class="workspace-list-item" style="border-left:2px solid ${borderColor};padding-left:10px;"><div><strong>${notification.message}</strong><span>${new Date(notification.createdAt).toLocaleString()}</span></div><span class="pill-tag ${isTeam ? 'success' : ''}">${isTeam ? 'Team' : 'System'}</span></div>`;
        }).join('')
      : '<div class="empty-state"><i class="fas fa-bell"></i><p>No team activity yet.</p></div>';
  }

  const growthPlanner = workspace.management?.growthPlanner || {};
  const plannerCurrent = Number(growthPlanner.currentMonthlyRevenue || monthRevenue || 0);
  const plannerTarget = Number(growthPlanner.targetMonthlyRevenue || workspace.management?.monthlyRevenueTarget || 0);
  const plannerGrowthPct = Number(growthPlanner.monthlyGrowthPct || 8);
  const plannerMonths = Math.max(1, Number(growthPlanner.projectionMonths || 6));

  if ($('ownerGrowthCurrentRevenue')) $('ownerGrowthCurrentRevenue').value = plannerCurrent;
  if ($('ownerGrowthTargetRevenue')) $('ownerGrowthTargetRevenue').value = plannerTarget;
  if ($('ownerGrowthRatePct')) $('ownerGrowthRatePct').value = plannerGrowthPct;
  if ($('ownerGrowthMonths')) $('ownerGrowthMonths').value = plannerMonths;

  const projectionList = $('ownerGrowthProjectionList');
  if (projectionList) {
    const rows = [];
    let projectedRevenue = plannerCurrent;
    for (let monthIndex = 1; monthIndex <= plannerMonths; monthIndex += 1) {
      projectedRevenue = Number((projectedRevenue * (1 + (plannerGrowthPct / 100))).toFixed(2));
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() + monthIndex);
      rows.push({
        monthLabel: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: projectedRevenue,
        targetHit: plannerTarget > 0 ? projectedRevenue >= plannerTarget : false
      });
    }

    projectionList.innerHTML = rows.map(row => `
      <div class="workspace-list-item">
        <div><strong>${row.monthLabel}</strong><span>Projected revenue ${fmt(row.revenue)}</span></div>
        <span class="pill-tag ${row.targetHit ? 'success' : ''}">${row.targetHit ? 'Target Hit' : 'Projected'}</span>
      </div>
    `).join('');
  }

  if ($('ownerGrowthSummary')) {
    const monthDelta = plannerTarget > 0 ? Math.max(0, plannerTarget - monthRevenue) : 0;
    $('ownerGrowthSummary').innerHTML = `
      <div class="workspace-list-item"><div><strong>Current revenue this month</strong><span>${fmt(monthRevenue)} collected</span></div><span class="pill-tag">Live</span></div>
      <div class="workspace-list-item"><div><strong>Target revenue</strong><span>${plannerTarget > 0 ? fmt(plannerTarget) : 'Set a target'}</span></div><span class="pill-tag">Goal</span></div>
      <div class="workspace-list-item"><div><strong>Gap to target</strong><span>${plannerTarget > 0 ? fmt(monthDelta) : 'No target configured'}</span></div><span class="pill-tag ${monthDelta === 0 && plannerTarget > 0 ? 'success' : ''}">${plannerTarget > 0 && monthDelta === 0 ? 'Complete' : 'In Progress'}</span></div>
      <div class="workspace-list-item"><div><strong>Affiliate due</strong><span>${affiliateProgramLive ? 'Outstanding commissions' : 'Affiliate program optional'}</span></div><span class="pill-tag">${fmt(affiliateDue)}</span></div>
      <div class="workspace-list-item"><div><strong>Latest growth activity</strong><span>${affiliateEvents.length ? 'Affiliate and referral events tracked' : 'No growth events yet'}</span></div><span class="pill-tag">${affiliateEvents.length}</span></div>
    `;
  }
}

function saveOwnerGrowthPlan() {
  if (!isAdmin()) {
    showToast('Only owners can save growth projections.', 'error');
    return;
  }

  const workspace = getWorkspace();
  workspace.management = workspace.management || {};
  workspace.management.growthPlanner = {
    currentMonthlyRevenue: Math.max(0, Number($('ownerGrowthCurrentRevenue')?.value || 0)),
    targetMonthlyRevenue: Math.max(0, Number($('ownerGrowthTargetRevenue')?.value || 0)),
    monthlyGrowthPct: Math.max(0, Number($('ownerGrowthRatePct')?.value || 0)),
    projectionMonths: Math.max(1, Number($('ownerGrowthMonths')?.value || 6))
  };
  workspace.management.monthlyRevenueTarget = workspace.management.growthPlanner.targetMonthlyRevenue;
  saveWorkspace(workspace);
  renderOwnerPortalPage();
  showToast('Growth planner saved.');
}

function renderMyPortalPage() {
  if (!$('myPortalClockStatus')) return;

  const employee = getCurrentEmployee();
  if (!employee) {
    $('myPortalClockStatus').textContent = 'Not available for this account';
    return;
  }

  const sessions = getEmployeeClockSessions(employee.id);
  const activeSession = getActiveClockSession(employee.id);
  const weekStart = startOfWeek();
  const monthStart = startOfMonth();
  const monthEnd = endOfMonth();

  const weekHours = sessions
    .filter(session => (session.clockInAt || '').slice(0, 10) >= weekStart)
    .reduce((sum, session) => sum + toHoursFromSession(session), 0);

  const monthHours = sessions
    .filter(session => {
      const date = (session.clockInAt || '').slice(0, 10);
      return date >= monthStart && date <= monthEnd;
    })
    .reduce((sum, session) => sum + toHoursFromSession(session), 0);

  const payrollRows = DB.payroll
    .filter(row => Number(row.employeeId) === Number(employee.id))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  const payrollEarned = payrollRows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  $('myPortalClockStatus').textContent = activeSession
    ? `Clocked in since ${new Date(activeSession.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : 'Not clocked in';
  $('myPortalHoursWeek').textContent = `${weekHours.toFixed(2)}h`;
  $('myPortalHoursMonth').textContent = `${monthHours.toFixed(2)}h`;
  $('myPortalTotalEarned').textContent = fmt(payrollEarned);

  const clockBtn = $('myPortalClockActionBtn');
  if (clockBtn) {
    clockBtn.innerHTML = activeSession
      ? '<i class="fas fa-stopwatch"></i> Clock Out'
      : '<i class="fas fa-clock"></i> Clock In';
  }

  if ($('myPortalStartTime')) $('myPortalStartTime').value = employee.startTime || '08:00';
  if ($('myPortalEndTime')) $('myPortalEndTime').value = employee.endTime || '17:00';
  if ($('myPortalMaxJobs')) $('myPortalMaxJobs').value = Number(employee.maxJobsPerDay || 6);
  document.querySelectorAll('#myPortalAvailableDays input[type="checkbox"]').forEach(input => {
    const days = employee.availableDays || [1, 2, 3, 4, 5];
    input.checked = days.includes(Number(input.value));
  });

  const myNotifications = getVisibleNotifications()
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, 10);
  if ($('myPortalNotificationList')) {
    $('myPortalNotificationList').innerHTML = myNotifications.length
      ? myNotifications.map(notification => `<div class="workspace-list-item"><div><strong>${notification.message}</strong><span>${new Date(notification.createdAt).toLocaleString()}</span></div><span class="pill-tag ${notification.read ? 'success' : ''}">${notification.read ? 'Read' : 'Unread'}</span></div>`).join('')
      : '<div class="empty-state"><i class="fas fa-bell"></i><p>No notifications yet.</p></div>';
  }

  const scheduleList = $('myPortalScheduleList');
  if (scheduleList) {
    const scheduleJobs = DB.bookings
      .filter(booking => Number(booking.technicianId || 0) === Number(employee.id) && !['completed', 'cancelled'].includes(booking.status))
      .sort((a, b) => `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`))
      .slice(0, 12);
    scheduleList.innerHTML = scheduleJobs.length
      ? scheduleJobs.map(booking => `<div class="workspace-list-item"><div><strong>${fmtDate(booking.date)} ${booking.time || ''}</strong><span>${(booking.services || [booking.service]).join(', ') || '-'}</span></div><button class="btn-link" onclick="editBooking(${booking.id})">View</button></div>`).join('')
      : '<div class="empty-state"><i class="fas fa-calendar-check"></i><p>No scheduled jobs yet.</p></div>';
  }

  const openJobsList = $('myPortalOpenJobsList');
  if (openJobsList) {
    const canSelfAssign = Boolean(getWorkspace().management.allowEmployeeSelfAssign || isManager());
    const openJobs = DB.bookings
      .filter(booking => !booking.technicianId && !['completed', 'cancelled'].includes(booking.status))
      .filter(booking => isEmployeeAvailableForBooking(employee, booking.date, booking.time))
      .sort((a, b) => `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`))
      .slice(0, 12);
    openJobsList.innerHTML = openJobs.length
      ? openJobs.map(booking => `<div class="workspace-list-item"><div><strong>${fmtDate(booking.date)} ${booking.time || ''}</strong><span>${(booking.services || [booking.service]).join(', ') || '-'}</span></div>${canSelfAssign ? `<button class="btn-link" onclick="claimOpenJobForCurrentEmployee(${booking.id})">Claim</button>` : '<span class="pill-tag">Awaiting owner assignment</span>'}</div>`).join('')
      : '<div class="empty-state"><i class="fas fa-briefcase"></i><p>No open jobs available.</p></div>';
  }

  const sessionList = $('myPortalSessionList');
  if (sessionList) {
    if (!sessions.length) {
      sessionList.innerHTML = '<div class="empty-state"><i class="fas fa-user-clock"></i><p>No clock sessions yet.</p></div>';
    } else {
      sessionList.innerHTML = sessions.slice(0, 8).map(session => `
        <div class="workspace-list-item">
          <div>
            <strong>${new Date(session.clockInAt).toLocaleDateString()} · ${new Date(session.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
            <span>${session.clockOutAt ? `Out ${new Date(session.clockOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Currently active session'}</span>
          </div>
          <span class="pill-tag">${toHoursFromSession(session).toFixed(2)}h</span>
        </div>
      `).join('');
    }
  }

  const payrollList = $('myPortalPayrollList');
  if (payrollList) {
    if (!payrollRows.length) {
      payrollList.innerHTML = '<div class="empty-state"><i class="fas fa-money-check-dollar"></i><p>No payroll entries yet.</p></div>';
    } else {
      payrollList.innerHTML = payrollRows.slice(0, 8).map(row => `
        <div class="workspace-list-item">
          <div>
            <strong>${fmtDate(row.periodStart)} - ${fmtDate(row.periodEnd)}</strong>
            <span>${row.details || roleLabel(row.role)}</span>
          </div>
          <span class="pill-tag">${fmt(row.amount)}</span>
        </div>
      `).join('');
    }
  }
}

// ─── NOTIFICATIONS ───────────────────────────────────────────
function markAllNotificationsRead() {
  const notifications = DB.notifications;
  if (isAdmin()) {
    notifications.forEach(notification => { notification.read = true; });
  } else {
    const employeeId = Number(currentSession?.employeeId || 0);
    notifications.forEach(notification => {
      if (notification.type === 'system' || Number(notification.employeeId || 0) === employeeId) {
        notification.read = true;
      }
    });
  }
  DB.saveNotifications(notifications);
  if ($('notifBadge')) $('notifBadge').textContent = unreadCount();
  if (isAdmin()) renderOwnerPortalPage();
  else renderMyPortalPage();
  renderDashboard();
}



// ─── DROPDOWN REFRESH ────────────────────────────────────────
function refreshClientDropdowns() {
  const clients = DB.clients;
  const options = '<option value="">Select a client...</option>' + clients.map(c => `<option value="${c.id}">${fullName(c)}</option>`).join('');
  ['bookingClient', 'paymentClient', 'quoteClient'].forEach(id => {
    const el = $(id);
    if (el) el.innerHTML = options;
  });
}

function refreshEmployeeDropdowns() {
  const employees = DB.employees.filter(e => e.status === 'active');
  const sales = employees.filter(e => ['salesman', 'manager'].includes(e.role));
  const techs = employees.filter(e => e.role === 'technician');

  const selectedSales = $('bookingSalesman')?.value || '';
  const selectedTech = $('bookingTechnician')?.value || '';
  const salesOptions = '<option value="">Unassigned</option>' + sales.map(e => `<option value="${e.id}">${fullName(e)} (${roleLabel(e.role)})</option>`).join('');
  const techOptions = '<option value="">Unassigned</option>' + techs.map(e => `<option value="${e.id}">${fullName(e)}</option>`).join('');

  if ($('bookingSalesman')) {
    $('bookingSalesman').innerHTML = salesOptions;
    $('bookingSalesman').value = selectedSales;
  }
  if ($('bookingTechnician')) {
    $('bookingTechnician').innerHTML = techOptions;
    $('bookingTechnician').value = selectedTech;
  }

  if ($('scheduleEmployeeFilter')) {
    const current = $('scheduleEmployeeFilter').value || 'all';
    $('scheduleEmployeeFilter').innerHTML = '<option value="all">All Employees</option>' + employees.map(e => `<option value="${e.id}">${fullName(e)} (${roleLabel(e.role)})</option>`).join('');
    $('scheduleEmployeeFilter').value = current;
  }
}

function loadTemplateEditors() {
  const t = DB.templates;
  if ($('tplJobReminder')) $('tplJobReminder').value = t.jobReminder || '';
  if ($('tplScheduleUpdate')) $('tplScheduleUpdate').value = t.scheduleUpdate || '';
  if ($('tplAssignment')) $('tplAssignment').value = t.assignment || '';
  if ($('tplBookingConfirmation')) $('tplBookingConfirmation').value = t.bookingConfirmation || '';
  if ($('tplCompletionFollowUp')) $('tplCompletionFollowUp').value = t.completionFollowUp || '';
  if ($('tplPayrollNotice')) $('tplPayrollNotice').value = t.payrollNotice || '';
  if ($('tplInviteOffer')) $('tplInviteOffer').value = t.inviteOffer || '';
  if ($('tplAffiliateWelcome')) $('tplAffiliateWelcome').value = t.affiliateWelcome || '';
}

function saveNotificationTemplates() {
  const templates = {
    ...DB.templates,
    jobReminder: $('tplJobReminder').value.trim() || DB.templates.jobReminder,
    scheduleUpdate: $('tplScheduleUpdate').value.trim() || DB.templates.scheduleUpdate,
    assignment: $('tplAssignment').value.trim() || DB.templates.assignment,
    bookingConfirmation: $('tplBookingConfirmation').value.trim() || DB.templates.bookingConfirmation,
    completionFollowUp: $('tplCompletionFollowUp').value.trim() || DB.templates.completionFollowUp,
    payrollNotice: $('tplPayrollNotice').value.trim() || DB.templates.payrollNotice,
    inviteOffer: $('tplInviteOffer').value.trim() || DB.templates.inviteOffer,
    affiliateWelcome: $('tplAffiliateWelcome').value.trim() || DB.templates.affiliateWelcome
  };
  DB.saveTemplates(templates);
  showToast('Notification templates saved.');
}

function exportClientsCSV() {
  const payments = DB.payments;
  const bookings = DB.bookings;
  const rows = DB.clients.map(c => ({
    id: c.id,
    name: fullName(c),
    email: c.email || '',
    phone: c.phone || '',
    company: c.company || '',
    status: c.status || 'active',
    totalSpent: payments.filter(p => p.clientId === c.id && p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0).toFixed(2),
    bookings: bookings.filter(b => b.clientId === c.id).length
  }));
  exportCSV(`clients-${today()}.csv`, rows);
}

function exportBookingsCSV() {
  const clients = DB.clients;
  const employees = DB.employees;
  const rows = DB.bookings.map(b => ({
    bookingId: b.id,
    client: fullName(clients.find(c => c.id === b.clientId)),
    service: b.service || '',
    date: b.date || '',
    time: b.time || '',
    amount: Number(b.amount || 0).toFixed(2),
    status: b.status || '',
    soldBy: fullName(employees.find(e => e.id === (b.soldById || b.salesmanId))),
    technician: fullName(employees.find(e => e.id === b.technicianId)),
    completedBy: fullName(employees.find(e => e.id === b.completedById))
  }));
  exportCSV(`bookings-${today()}.csv`, rows);
}

function exportRevenueCSV() {
  const clients = DB.clients;
  const rows = DB.payments.map(p => ({
    paymentId: p.id,
    bookingId: p.bookingId || '',
    client: fullName(clients.find(c => c.id === p.clientId)),
    service: p.service || '',
    amount: Number(p.amount || 0).toFixed(2),
    date: p.date || '',
    method: p.method || '',
    status: p.status || ''
  }));
  exportCSV(`revenue-${today()}.csv`, rows);
}

function exportPayrollCSV() {
  const employees = DB.employees;
  const rows = DB.payroll.map(p => ({
    payrollId: p.id,
    runDate: p.runDate,
    employee: fullName(employees.find(e => e.id === p.employeeId)),
    role: p.role,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    details: p.details,
    amount: Number(p.amount || 0).toFixed(2)
  }));
  exportCSV(`payroll-${today()}.csv`, rows);
}

function applyRolePermissions() {
  const name = currentSession?.name || 'Not signed in';
  if ($('activeUserChip')) $('activeUserChip').textContent = name;
  const showAffiliateUi = shouldShowAffiliateUi();

  document.querySelectorAll('.nav-item').forEach(item => {
    const page = item.dataset.page;
    const featureLocked = Boolean(workspaceFeatureLock(page));
    const affiliateHiddenForLaunch = page === 'affiliate-portal' && !showAffiliateUi && !isAffiliate();
    item.style.display = canAccessPage(page) && !featureLocked && !affiliateHiddenForLaunch ? 'flex' : 'none';
  });

  if ($('addClientBtn')) $('addClientBtn').style.display = canManageClients() ? 'inline-flex' : 'none';
  if ($('addEmployeeBtn')) $('addEmployeeBtn').style.display = canManageEmployees() && hasFeature('teamManagement') ? 'inline-flex' : 'none';
  if ($('addPaymentBtn')) $('addPaymentBtn').style.display = isAdmin() ? 'inline-flex' : 'none';
  if ($('runPayrollBtn')) $('runPayrollBtn').style.display = isAdmin() ? 'inline-flex' : 'none';
  if ($('exportPayrollBtn')) $('exportPayrollBtn').style.display = isAdmin() ? 'inline-flex' : 'none';
  if ($('saveTemplateBtn')) $('saveTemplateBtn').style.display = isAdmin() ? 'inline-flex' : 'none';
  if ($('addBookingBtn')) $('addBookingBtn').style.display = canCreateBookings() ? 'inline-flex' : 'none';

  if ($('quickAddBtn')) $('quickAddBtn').style.display = currentSession ? 'inline-flex' : 'none';
  if ($('sidebarQuickAddBtn')) $('sidebarQuickAddBtn').style.display = currentSession ? 'inline-flex' : 'none';
  if ($('accountBtn')) $('accountBtn').style.display = currentSession ? 'inline-flex' : 'none';
  if ($('logoutBtn')) $('logoutBtn').style.display = currentSession ? 'inline-flex' : 'none';
  if ($('smartAssignBtn')) $('smartAssignBtn').style.display = hasFeature('smartScheduling') && canAssignBookings() ? 'inline-flex' : 'none';
  if ($('qAddEmployee')) $('qAddEmployee').style.display = canManageEmployees() && hasFeature('teamManagement') ? 'flex' : 'none';
  if ($('qAddPayment')) $('qAddPayment').style.display = isAdmin() ? 'flex' : 'none';
  if ($('qAddClient')) $('qAddClient').style.display = canManageClients() ? 'flex' : 'none';
  if ($('qAddBooking')) $('qAddBooking').style.display = canCreateBookings() ? 'flex' : 'none';
}

async function handleLogin() {
  if (!authInitialized) {
    await waitForAuthBootstrap();
  }

  const email = normalizeEmail($('loginEmail').value);
  const password = $('loginPassword').value;
  const rememberMe = Boolean($('loginRemember')?.checked);
  setRememberPreference(rememberMe);

  if (!email || !password) {
    showToast('Email and password are required.', 'error');
    return;
  }

  let backendLoggedIn = false;
  try {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password, rememberMe }
    });
    backendState.available = true;
    setBackendToken(response.token, rememberMe);
    backendState.workspace = response.workspace || backendState.workspace;
    saveSession(response.session, rememberMe);
    backendLoggedIn = true;
  } catch (error) {
    if (backendState.available) {
      showToast(error.message || 'Invalid email or password.', 'error');
      return;
    }
  }

  if (!backendLoggedIn) {
    try {
      const users = DB.users;
      const user = users.find(u => normalizeEmail(u.email) === email && u.status !== 'inactive');
      if (!user || user.passwordHash !== hashPassword(password)) {
        showToast('Invalid email or password.', 'error');
        return;
      }

      if (user.role === 'admin') {
        saveSession({ role: 'admin', name: user.name || 'Admin', email: user.email }, rememberMe);
      } else if (user.role === 'affiliate') {
        const affiliate = workspaceAffiliates().find(entry => normalizeEmail(entry.email) === email);
        if (!affiliate || affiliate.status === 'inactive') {
          showToast('This affiliate account is inactive.', 'error');
          return;
        }
        saveSession({ role: 'affiliate', affiliateId: affiliate.id, name: affiliate.name || user.name || 'Affiliate', email: user.email }, rememberMe);
      } else {
        const employee = DB.employees.find(e => e.id === user.employeeId && e.status === 'active');
        if (!employee) {
          showToast('This employee account is inactive.', 'error');
          return;
        }
        saveSession({ role: employee.role, employeeId: employee.id, name: fullName(employee), email: user.email }, rememberMe);
      }
    } catch {
      showToast('Invalid email or password.', 'error');
      return;
    }
  }

  if (currentSession?.role === 'affiliate') {
    const affiliate = workspaceAffiliates().find(entry => normalizeEmail(entry.email) === normalizeEmail(currentSession.email));
    if (!affiliate || affiliate.status === 'inactive') {
        showToast('This affiliate account is inactive.', 'error');
        return;
    }
    currentSession.affiliateId = affiliate.id;
    currentSession.name = affiliate.name || currentSession.name;
    saveSession(currentSession, rememberMe);
  }

  if (currentSession?.role !== 'admin' && currentSession?.employeeId) {
    const employee = DB.employees.find(e => e.id === currentSession.employeeId && e.status === 'active');
    if (!employee) {
      showToast('This employee account is inactive.', 'error');
      return;
    }
  }

  setLastLoginEmail(email);

  hideAuthScreen();
  $('loginPassword').value = '';
  applyRolePermissions();
  if (currentSession?.role === 'affiliate') navigateTo('affiliate-portal');
  else if (isAdmin()) navigateTo('owner-portal');
  else navigateTo('my-portal');
  renderDashboard();
  setTimeout(() => maybePromptForMobileInstall(), 250);
}

function openAccountModal() {
  if (!currentSession?.email) {
    showToast('Sign in first.', 'error');
    return;
  }

  $('currentAccountEmail').value = currentSession.email;
  $('accountNewEmail').value = currentSession.email;
  const employee = getCurrentEmployee();
  if ($('accountFirstName')) {
    $('accountFirstName').value = employee?.firstName || (currentSession.name || '').split(' ').slice(0, -1).join(' ');
    $('accountFirstName').disabled = !employee;
  }
  if ($('accountLastName')) {
    $('accountLastName').value = employee?.lastName || (currentSession.name || '').split(' ').slice(-1).join(' ');
    $('accountLastName').disabled = !employee;
  }
  $('accountNewPassword').value = '';
  $('accountConfirmPassword').value = '';
  if ($('accountOwnerAffiliateSection')) {
    $('accountOwnerAffiliateSection').style.display = isAdmin() ? '' : 'none';
  }
  if (isAdmin()) {
    const growth = getWorkspace().growth || {};
    if ($('accountAffiliateSignupEnabled')) $('accountAffiliateSignupEnabled').checked = Boolean(growth.affiliateEnabled && growth.affiliateSignupEnabled !== false);
    if ($('accountAffiliateSignupLink')) $('accountAffiliateSignupLink').value = getAffiliateSignupLink() || 'Enable affiliate partner signups to generate a public link.';
    if ($('accountAffiliateStatusBadge')) $('accountAffiliateStatusBadge').textContent = growth.affiliateEnabled && growth.affiliateSignupEnabled !== false ? 'Live' : 'Off';
  }
  openModal('accountModal');
}

async function saveAccountCredentials() {
  if (!currentSession?.email) return;

  const newEmail = normalizeEmail($('accountNewEmail').value);
  const newPassword = $('accountNewPassword').value;
  const confirm = $('accountConfirmPassword').value;
  const firstName = $('accountFirstName')?.value.trim() || '';
  const lastName = $('accountLastName')?.value.trim() || '';
  const fullAccountName = `${firstName} ${lastName}`.trim();
  const affiliateSignupEnabled = Boolean($('accountAffiliateSignupEnabled')?.checked);

  if (!newEmail) {
    showToast('Email is required.', 'error');
    return;
  }

  if (newPassword && newPassword !== confirm) {
    showToast('Passwords do not match.', 'error');
    return;
  }

  if (newPassword && !passwordMeetsPolicy(newPassword)) {
    showToast('Password must meet the workspace security policy.', 'error');
    return;
  }

  if (backendState.available && backendState.token) {
    try {
      const response = await apiRequest('/api/account', {
        method: 'PUT',
        body: { email: newEmail, password: newPassword, firstName, lastName }
      });
      currentSession.email = response.session.email;
      if (response.session.name) currentSession.name = response.session.name;
      saveSession(currentSession);
    } catch (error) {
      showToast(error.message || 'Unable to update account.', 'error');
      return;
    }
  } else {
    const users = DB.users;
    const currentEmail = normalizeEmail(currentSession.email);
    const userIndex = users.findIndex(u => normalizeEmail(u.email) === currentEmail);
    if (userIndex === -1) {
      showToast('Account not found.', 'error');
      return;
    }

    const emailInUse = users.some((u, idx) => idx !== userIndex && normalizeEmail(u.email) === newEmail);
    if (emailInUse) {
      showToast('Email is already in use.', 'error');
      return;
    }

    users[userIndex].email = newEmail;
    if (fullAccountName) users[userIndex].name = fullAccountName;
    if (newPassword) users[userIndex].passwordHash = hashPassword(newPassword);
    DB.saveUsers(users);

    if (users[userIndex].role === 'admin') {
      const workspace = getWorkspace();
      workspace.businessEmail = newEmail;
      saveWorkspace(workspace);
      renderWorkspacePage();
    }

    if (users[userIndex].employeeId) {
      const employees = DB.employees;
      const eIdx = employees.findIndex(e => e.id === users[userIndex].employeeId);
      if (eIdx !== -1) {
        employees[eIdx].firstName = firstName || employees[eIdx].firstName;
        employees[eIdx].lastName = lastName || employees[eIdx].lastName;
        employees[eIdx].email = newEmail;
        DB.saveEmployees(employees);
        refreshEmployeeDropdowns();
        renderEmployeesTable();
      }
    }

    if (fullAccountName) currentSession.name = fullAccountName;
    currentSession.email = newEmail;
    saveSession(currentSession);
  }

  if (isAdmin()) {
    const workspace = getWorkspace();
    workspace.growth = workspace.growth || {};
    workspace.growth.affiliateEnabled = affiliateSignupEnabled ? true : Boolean(workspace.growth.affiliateEnabled);
    workspace.growth.affiliateSignupEnabled = affiliateSignupEnabled;
    workspace.growth.affiliateSignupCode = String(workspace.growth.affiliateSignupCode || 'AFFILIATE').trim().toUpperCase();
    saveWorkspace(workspace);
    renderWorkspacePage();
    renderAffiliatePortalPage();
  }

  setLastLoginEmail(currentSession.email);

  closeModal('accountModal');
  showToast('Account credentials updated.');
}

async function resetPasswordByEmail(emailInput, silent = false) {
  if (!getWorkspace().security.allowPasswordReset) {
    if (!silent) showToast('Password reset is disabled for this workspace.', 'error');
    return false;
  }

  const email = normalizeEmail(emailInput);
  if (!email) {
    if (!silent) showToast('Enter an email first.', 'error');
    return false;
  }

  if (backendState.available) {
    try {
      const response = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        auth: false,
        body: { email }
      });
      if (!silent) {
        if ($('loginPassword') && response.temporaryPassword) $('loginPassword').value = response.temporaryPassword;
        if ($('loginEmail')) $('loginEmail').value = email;
        showToast(`Password reset to: ${response.temporaryPassword}`);
      }
      return true;
    } catch (error) {
      if (!silent) showToast(error.message || 'Unable to reset password.', 'error');
      return false;
    }
  }

  const users = DB.users;
  const i = users.findIndex(u => normalizeEmail(u.email) === email && u.status !== 'inactive');
  if (i === -1) {
    if (!silent) showToast('No account found for this email.', 'error');
    return false;
  }

  users[i].passwordHash = hashPassword('password123');
  DB.saveUsers(users);
  if (!silent) {
    if ($('loginPassword')) $('loginPassword').value = 'password123';
    if ($('loginEmail')) $('loginEmail').value = email;
    showToast('Password reset to: password123');
  }
  return true;
}

async function initAuth() {
  seedAdminAccount();
  currentSession = getSession();
  if ($('loginRemember')) $('loginRemember').checked = getRememberPreference();
  if ($('loginEmail') && !$('loginEmail').value) $('loginEmail').value = getLastLoginEmail();
  syncWorkspaceBranding();

  if (currentSession && backendState.available && backendState.token) {
    const response = await apiRequest('/api/auth/session').catch(() => null);
    if (!response?.session) {
      clearSession();
      setBackendToken('');
      currentSession = null;
    } else {
      currentSession = response.session;
      saveSession(currentSession, isRememberedLogin());
      backendState.workspace = response.workspace || backendState.workspace;
    }
  }

  if (currentSession) {
    if (currentSession.role === 'affiliate') {
      const affiliate = workspaceAffiliates().find(entry => normalizeEmail(entry.email) === normalizeEmail(currentSession.email));
      if (affiliate) {
        currentSession.affiliateId = affiliate.id;
        currentSession.name = affiliate.name || currentSession.name;
        saveSession(currentSession, isRememberedLogin());
      }
    }
    hideAuthScreen();
    applyRolePermissions();
    if (currentSession.role === 'affiliate') navigateTo('affiliate-portal');
    else if (isAdmin()) navigateTo('owner-portal');
    else navigateTo('my-portal');
    setTimeout(() => maybePromptForMobileInstall(), 250);
  } else {
    // Always show landing first when not logged in
    showAuthScreen('authViewLanding');
    closeModal('onboardingOverlay');
    applyRolePermissions();
  }

  const signupCodeFromUrl = new URLSearchParams(window.location.search).get('affiliateSignup');
  const growth = getWorkspace().growth || {};
  const normalizedSignupCode = String(signupCodeFromUrl || '').toUpperCase();
  const publicSignupEnabled = Boolean(growth.affiliateEnabled && growth.affiliateSignupEnabled !== false);
  const validSignupCode = normalizedSignupCode && normalizedSignupCode === String(growth.affiliateSignupCode || 'AFFILIATE').toUpperCase();
  if (validSignupCode && publicSignupEnabled && $('affiliateSignupBusinessCode')) {
    $('affiliateSignupBusinessCode').value = normalizedSignupCode;
    openModal('affiliateSignupModal');
  }

  authInitialized = true;
  window.__procrmAuthReady = true;
}

function logout() {
  clearSession();
  setBackendToken('');
  sessionStorage.removeItem(INSTALL_PROMPT_STORAGE_KEYS.sessionShown);
  $('loginEmail').value = getLastLoginEmail();
  $('loginPassword').value = '';
  if ($('loginRemember')) $('loginRemember').checked = getRememberPreference();
  closeModal('onboardingOverlay');
  showAuthScreen('authViewLanding');
  applyRolePermissions();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.getRegistrations()
    .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
    .then(() => {
      if (!('caches' in window)) return;
      return caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))));
    })
    .catch(() => {})
    .finally(() => {
      navigator.serviceWorker.register(`sw.js?v=${Date.now()}`).then(registration => {
        serviceWorkerRegistration = registration;
        if (registration.update) registration.update().catch(() => {});
      }).catch(() => {});
    });
}

// ─── INIT & EVENT LISTENERS ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  window.__procrmAuthReady = false;

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(item.dataset.page);
    });
  });

  document.querySelectorAll('[data-page]').forEach(el => {
    if (!el.classList.contains('nav-item')) {
      el.addEventListener('click', () => navigateTo(el.dataset.page));
    }
  });

  $('menuToggle').addEventListener('click', () => $('sidebar').classList.toggle('open'));

  document.querySelectorAll('[data-quick-add-anchor]').forEach(button => {
    button.addEventListener('click', e => {
      e.stopPropagation();
      const quickMenu = $('quickMenu');
      const anchor = button.dataset.quickAddAnchor || 'top';
      const isBottomAnchor = anchor === 'bottom';
      quickMenu.classList.toggle('quick-menu-left', isBottomAnchor);
      quickMenu.classList.toggle('open');
    });
  });
  document.addEventListener('click', () => $('quickMenu').classList.remove('open'));

  $('qAddClient').addEventListener('click', () => { navigateTo('clients'); openClientModal(); });
  $('qAddEmployee').addEventListener('click', () => { navigateTo('employees'); openEmployeeModal(); });
  $('qAddBooking').addEventListener('click', () => { navigateTo('bookings'); openBookingModal(); });
  $('qAddPayment').addEventListener('click', () => { navigateTo('revenue'); openPaymentModal(); });
  $('qPublicBook').addEventListener('click', () => openPublicBookingModal());

  document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.modal;
      if (id && id !== 'onboardingOverlay') closeModal(id);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay && overlay.id !== 'onboardingOverlay') closeModal(overlay.id);
    });
  });

  $('addClientBtn').addEventListener('click', () => openClientModal());
  $('saveClientBtn').addEventListener('click', saveClient);
  $('exportClientsBtn').addEventListener('click', exportClientsCSV);

  $('clientSearch').addEventListener('input', e => renderClientsTable($('clientFilter').value, e.target.value));
  $('clientFilter').addEventListener('change', () => renderClientsTable($('clientFilter').value, $('clientSearch').value));

  $('addEmployeeBtn').addEventListener('click', () => openEmployeeModal());
  $('saveEmployeeBtn').addEventListener('click', saveEmployee);
  $('employeeSearch').addEventListener('input', e => renderEmployeesTable($('employeeFilter').value, e.target.value));
  $('employeeFilter').addEventListener('change', () => renderEmployeesTable($('employeeFilter').value, $('employeeSearch').value));
  $('employeeRole').addEventListener('change', setDefaultPayTypeForRole);

  $('addBookingBtn').addEventListener('click', () => openBookingModal());
  $('saveBookingBtn').addEventListener('click', saveBooking);
  $('exportBookingsBtn').addEventListener('click', exportBookingsCSV);
  $('bookingSearch').addEventListener('input', e => renderBookingsTable(e.target.value));

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentBookingTab = tab.dataset.tab;
      renderBookingsTable();
    });
  });

  $('prevWeek').addEventListener('click', () => { calendarOffset--; renderCalendar(); });
  $('nextWeek').addEventListener('click', () => { calendarOffset++; renderCalendar(); });
  $('todayBtn').addEventListener('click', () => { calendarOffset = 0; renderCalendar(); });
  $('scheduleViewMode').addEventListener('change', () => {
    calendarViewMode = $('scheduleViewMode').value;
    calendarOffset = 0;
    renderCalendar();
  });
  $('scheduleEmployeeFilter').addEventListener('change', renderCalendar);
  $('smartAssignBtn').addEventListener('click', smartAssignOpenJobs);

  $('addPaymentBtn').addEventListener('click', () => openPaymentModal());
  $('savePaymentBtn').addEventListener('click', savePayment);
  if ($('saveQuoteBtn')) $('saveQuoteBtn').addEventListener('click', saveQuote);
  if ($('exportRevenueBtn')) $('exportRevenueBtn').addEventListener('click', exportRevenueCSV);
  document.querySelectorAll('.revenue-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.revenue-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderRevenueTable(tab.dataset.revenueFilter);
    });
  });

  $('submitPublicBooking').addEventListener('click', submitPublicBooking);
  $('runPayrollBtn').addEventListener('click', runPayrollThisMonth);
  $('exportPayrollBtn').addEventListener('click', exportPayrollCSV);
  if ($('markOwnerNotifReadBtn')) $('markOwnerNotifReadBtn').addEventListener('click', markAllNotificationsRead);
  if ($('saveTemplateBtn')) $('saveTemplateBtn').addEventListener('click', saveNotificationTemplates);
  $('saveWorkspaceBtn').addEventListener('click', saveWorkspaceSettings);
  if ($('workspaceSendOldEmailCodeBtn')) {
    $('workspaceSendOldEmailCodeBtn').addEventListener('click', async () => {
      const email = normalizeEmail($('workspaceCurrentEmailVerificationTarget')?.value || getWorkspace().businessEmail || '');
      if (!email) {
        showToast('Current business email is required.', 'error');
        return;
      }
      const sent = await sendEmailVerificationCode(email, 'workspace-email-old');
      if (sent) {
        workspaceEmailVerificationState.oldEmail = email;
        workspaceEmailVerificationState.oldVerified = false;
      }
    });
  }

  if ($('workspaceVerifyOldEmailCodeBtn')) {
    $('workspaceVerifyOldEmailCodeBtn').addEventListener('click', async () => {
      const email = normalizeEmail($('workspaceCurrentEmailVerificationTarget')?.value || '');
      const code = String($('workspaceOldEmailVerificationCode')?.value || '').trim();
      if (!email || !code) {
        showToast('Enter current email and code.', 'error');
        return;
      }
      const ok = await verifyEmailCode(email, code, 'workspace-email-old', 'owner');
      if (ok) {
        workspaceEmailVerificationState.oldEmail = email;
        workspaceEmailVerificationState.oldVerified = true;
      }
    });
  }

  if ($('workspaceSendNewEmailCodeBtn')) {
    $('workspaceSendNewEmailCodeBtn').addEventListener('click', async () => {
      const email = normalizeEmail($('workspaceNewEmailVerificationTarget')?.value || $('workspaceBusinessEmail')?.value || '');
      if (!email) {
        showToast('New business email is required.', 'error');
        return;
      }
      const sent = await sendEmailVerificationCode(email, 'workspace-email-new');
      if (sent) {
        workspaceEmailVerificationState.newEmail = email;
        workspaceEmailVerificationState.newVerified = false;
      }
    });
  }

  if ($('workspaceVerifyNewEmailCodeBtn')) {
    $('workspaceVerifyNewEmailCodeBtn').addEventListener('click', async () => {
      const email = normalizeEmail($('workspaceNewEmailVerificationTarget')?.value || $('workspaceBusinessEmail')?.value || '');
      const code = String($('workspaceNewEmailVerificationCode')?.value || '').trim();
      if (!email || !code) {
        showToast('Enter new email and code.', 'error');
        return;
      }
      const ok = await verifyEmailCode(email, code, 'workspace-email-new', 'owner');
      if (ok) {
        workspaceEmailVerificationState.newEmail = email;
        workspaceEmailVerificationState.newVerified = true;
      }
    });
  }

  if ($('onboardOwnerSendVerificationBtn')) {
    $('onboardOwnerSendVerificationBtn').addEventListener('click', async () => {
      const email = normalizeEmail($('onboardBusinessEmail')?.value || '');
      if (!email) {
        showToast('Enter a business email first.', 'error');
        return;
      }
      const sent = await sendEmailVerificationCode(email, 'owner-signup');
      if (sent) emailVerificationState.owner = { email, verified: false };
    });
  }

  if ($('onboardOwnerVerifyCodeBtn')) {
    $('onboardOwnerVerifyCodeBtn').addEventListener('click', async () => {
      const email = normalizeEmail($('onboardBusinessEmail')?.value || '');
      const code = String($('onboardOwnerVerificationCode')?.value || '').trim();
      if (!email || !code) {
        showToast('Enter business email and verification code.', 'error');
        return;
      }
      await verifyEmailCode(email, code, 'owner-signup', 'owner');
    });
  }

  if ($('onboardJoinSendVerificationBtn')) {
    $('onboardJoinSendVerificationBtn').addEventListener('click', async () => {
      const email = normalizeEmail($('onboardJoinEmail')?.value || '');
      if (!email) {
        showToast('Enter employee email first.', 'error');
        return;
      }
      const sent = await sendEmailVerificationCode(email, 'employee-signup');
      if (sent) emailVerificationState.employee = { email, verified: false };
    });
  }

  if ($('onboardJoinVerifyCodeBtn')) {
    $('onboardJoinVerifyCodeBtn').addEventListener('click', async () => {
      const email = normalizeEmail($('onboardJoinEmail')?.value || '');
      const code = String($('onboardJoinVerificationCode')?.value || '').trim();
      if (!email || !code) {
        showToast('Enter employee email and verification code.', 'error');
        return;
      }
      await verifyEmailCode(email, code, 'employee-signup', 'employee');
    });
  }

  if ($('affiliateSendVerificationBtn')) {
    $('affiliateSendVerificationBtn').addEventListener('click', async () => {
      const email = normalizeEmail($('affiliateSignupEmail')?.value || '');
      if (!email) {
        showToast('Enter affiliate email first.', 'error');
        return;
      }
      const sent = await sendEmailVerificationCode(email, 'affiliate-signup');
      if (sent) emailVerificationState.affiliate = { email, verified: false };
    });
  }

  if ($('affiliateVerifyCodeBtn')) {
    $('affiliateVerifyCodeBtn').addEventListener('click', async () => {
      const email = normalizeEmail($('affiliateSignupEmail')?.value || '');
      const code = String($('affiliateSignupVerificationCode')?.value || '').trim();
      if (!email || !code) {
        showToast('Enter affiliate email and verification code.', 'error');
        return;
      }
      await verifyEmailCode(email, code, 'affiliate-signup', 'affiliate');
    });
  }
  
  // Notification preference listeners
  ['prefEmployeePush', 'prefBrowserAlerts', 'prefDailyDigest'].forEach(id => {
    const el = $(id);
    if (el) {
      el.addEventListener('change', () => {
        const workspace = getWorkspace();
        workspace.notificationPrefs = workspace.notificationPrefs || {};
        workspace.notificationPrefs.employeePush = $('prefEmployeePush')?.checked || false;
        workspace.notificationPrefs.browserAlerts = $('prefBrowserAlerts')?.checked || false;
        workspace.notificationPrefs.dailyDigest = $('prefDailyDigest')?.checked || false;
        DB.saveWorkspace(workspace);
        showToast('Notification preferences saved.');
      });
    }
  });
  
  $('requestBrowserAlertsBtn').addEventListener('click', requestBrowserNotificationPermission);
  $('generateAffiliateCodeBtn').addEventListener('click', generateAffiliateCode);
  $('createAffiliatePartnerBtn').addEventListener('click', createAffiliatePartner);
  $('simulateAffiliateSaleBtn').addEventListener('click', () => logAffiliateConversion());
  if ($('affiliateGenerateCodeBtn')) $('affiliateGenerateCodeBtn').addEventListener('click', generateAffiliateCode);
  if ($('affiliateCreatePartnerBtn')) $('affiliateCreatePartnerBtn').addEventListener('click', createAffiliatePartner);
  if ($('affiliatePortalCreatePartnerBtn')) $('affiliatePortalCreatePartnerBtn').addEventListener('click', () => {
    if ($('affiliatePartnerName') && $('affiliatePortalPartnerName')) $('affiliatePartnerName').value = $('affiliatePortalPartnerName').value.trim();
    if ($('affiliatePartnerEmail') && $('affiliatePortalPartnerEmail')) $('affiliatePartnerEmail').value = $('affiliatePortalPartnerEmail').value.trim();
    createAffiliatePartner();
  });
  if ($('affiliatePortalLogSaleBtn')) $('affiliatePortalLogSaleBtn').addEventListener('click', () => logAffiliateConversion());
  if ($('affiliateSaveProgramBtn')) $('affiliateSaveProgramBtn').addEventListener('click', saveAffiliateProgramSettings);
  if ($('affiliateCopySignupLinkBtn')) $('affiliateCopySignupLinkBtn').addEventListener('click', copyAffiliateSignupLink);
  $('addWorkspaceServiceBtn').addEventListener('click', addWorkspaceServiceGroup);
  $('installWebAppBtn').addEventListener('click', installWebApp);
  if ($('mobileInstallAppBtn')) $('mobileInstallAppBtn').addEventListener('click', async () => {
    await installWebApp();
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent || '')) {
      showToast('Use Share then Add to Home Screen to install Service Mafia on iPhone.', 'info');
    }
    if (isStandaloneMode()) setSavedInstallChoice('installed');
    closeModal('mobileInstallPromptModal');
  });
  if ($('mobileContinueWebsiteBtn')) $('mobileContinueWebsiteBtn').addEventListener('click', () => {
    setSavedInstallChoice('website');
    closeModal('mobileInstallPromptModal');
    showToast('Continuing in website mode. You can install later from Workspace.', 'info');
  });
  $('testNotificationBtn').addEventListener('click', sendTestNotification);
  $('createInviteBtn').addEventListener('click', createInviteOffer);
  $('redeemInviteBtn').addEventListener('click', redeemInviteCode);
  $('regenerateEmployeeInviteCodeBtn').addEventListener('click', regenerateEmployeeInviteCode);
  $('myPortalClockActionBtn').addEventListener('click', toggleClockForCurrentEmployee);
  if ($('myPortalAccountBtn')) $('myPortalAccountBtn').addEventListener('click', openAccountModal);
  if ($('saveMyAvailabilityBtn')) $('saveMyAvailabilityBtn').addEventListener('click', saveMyAvailability);
  if ($('ownerPortalRunSmartAssignBtn')) $('ownerPortalRunSmartAssignBtn').addEventListener('click', smartAssignOpenJobs);
  if ($('ownerPortalRunPayrollBtn')) $('ownerPortalRunPayrollBtn').addEventListener('click', runPayrollThisMonth);
  if ($('ownerPortalGoEmployeesBtn')) $('ownerPortalGoEmployeesBtn').addEventListener('click', () => navigateTo('employees'));
  if ($('ownerPortalGoBookingsBtn')) $('ownerPortalGoBookingsBtn').addEventListener('click', () => navigateTo('bookings'));
  if ($('ownerPortalGoWorkspaceBtn')) $('ownerPortalGoWorkspaceBtn').addEventListener('click', () => navigateTo('workspace'));
  if ($('ownerGrowthSaveBtn')) $('ownerGrowthSaveBtn').addEventListener('click', saveOwnerGrowthPlan);
  if ($('onboardingResetBtn')) $('onboardingResetBtn').addEventListener('click', () => resetOnboardingFlow(onboardingPath === 'join' ? 'joinCode' : 'ownerAccount'));
  if ($('onboardingHeaderBackBtn')) $('onboardingHeaderBackBtn').addEventListener('click', goBackOnboardingStep);
  if ($('onboardChooseOwnerBtn')) $('onboardChooseOwnerBtn').addEventListener('click', goToOwnerOnboarding);
  if ($('onboardChooseJoinBtn')) $('onboardChooseJoinBtn').addEventListener('click', goToJoinOnboarding);
  $('onboardOwnerAccountBackBtn').addEventListener('click', () => {
    closeModal('onboardingOverlay');
    if (!currentSession) showAuthScreen('authViewCreateChoice');
  });
  $('onboardOwnerAccountNextBtn').addEventListener('click', validateOwnerAccountStep);
  if ($('onboardOwnerVerifyBackBtn')) $('onboardOwnerVerifyBackBtn').addEventListener('click', () => showOnboardingStep('ownerAccount'));
  if ($('onboardOwnerVerifyNextBtn')) $('onboardOwnerVerifyNextBtn').addEventListener('click', validateOwnerVerifyStep);
  $('onboardOwnerBusinessBackBtn').addEventListener('click', () => showOnboardingStep('ownerVerify'));
  $('onboardOwnerBusinessNextBtn').addEventListener('click', validateOwnerBusinessStep);
  if ($('onboardOwnerFeaturesBackBtn')) $('onboardOwnerFeaturesBackBtn').addEventListener('click', () => showOnboardingStep('ownerBusiness'));
  if ($('onboardOwnerFeaturesNextBtn')) $('onboardOwnerFeaturesNextBtn').addEventListener('click', validateOwnerFeaturesStep);
  $('onboardOwnerPlanBackBtn').addEventListener('click', () => showOnboardingStep('ownerFeatures'));
  $('completeOwnerOnboardingBtn').addEventListener('click', completeOwnerOnboarding);
  $('onboardJoinCodeBackBtn').addEventListener('click', () => {
    closeModal('onboardingOverlay');
    if (!currentSession) showAuthScreen('authViewCreateChoice');
  });
  $('onboardValidateJoinCodeBtn').addEventListener('click', validateJoinCode);
  $('onboardJoinAccountBackBtn').addEventListener('click', () => showOnboardingStep('joinCode'));
  $('completeJoinOnboardingBtn').addEventListener('click', completeJoinOnboarding);
  ['starter', 'professional', 'premium'].forEach(plan => {
    const btn = $(`onboardPlan${plan.charAt(0).toUpperCase() + plan.slice(1)}`);
    if (btn) btn.addEventListener('click', () => syncOnboardingPlanSelection(plan));
  });
  ['starter', 'professional', 'premium'].forEach(plan => {
    const btn = $(`plan${plan.charAt(0).toUpperCase() + plan.slice(1)}`);
    if (btn) btn.addEventListener('click', () => selectWorkspacePlan(plan));
  });
  if ($('workspaceBillingCycle')) $('workspaceBillingCycle').addEventListener('change', refreshPlanCardPrices);

  $('notifBtn').addEventListener('click', () => {
    if (!currentSession) return;
    navigateTo(isAdmin() ? 'owner-portal' : 'my-portal');
  });

  $('loginBtn').addEventListener('click', handleLogin);
  $('loginPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
  $('forgotPasswordBtn').addEventListener('click', () => resetPasswordByEmail($('loginEmail').value));

  // ─── Auth screen navigation ───────────────────────────────
  if ($('authGoSignIn')) $('authGoSignIn').addEventListener('click', () => showAuthScreen('authViewSignIn'));
  if ($('authGoCreate')) $('authGoCreate').addEventListener('click', () => showAuthScreen('authViewCreateChoice'));
  if ($('authBackFromSignIn')) $('authBackFromSignIn').addEventListener('click', () => showAuthScreen('authViewLanding'));
  if ($('authBackFromCreate')) $('authBackFromCreate').addEventListener('click', () => showAuthScreen('authViewLanding'));
  if ($('authChoiceOwner')) $('authChoiceOwner').addEventListener('click', () => {
    hideAuthScreen();
    openModal('onboardingOverlay');
    goToOwnerOnboarding();
  });
  if ($('authChoiceEmployee')) $('authChoiceEmployee').addEventListener('click', () => {
    hideAuthScreen();
    openModal('onboardingOverlay');
    goToJoinOnboarding();
  });
  if ($('completeAffiliateSignupBtn')) $('completeAffiliateSignupBtn').addEventListener('click', completeAffiliateSignup);
  $('accountBtn').addEventListener('click', openAccountModal);
  $('saveAccountBtn').addEventListener('click', saveAccountCredentials);
  if ($('accountCopyAffiliateSignupLinkBtn')) $('accountCopyAffiliateSignupLinkBtn').addEventListener('click', copyAffiliateSignupLink);
  if ($('accountOpenAffiliatePortalBtn')) $('accountOpenAffiliatePortalBtn').addEventListener('click', () => {
    closeModal('accountModal');
    navigateTo('affiliate-portal');
  });
  $('resetMyPasswordBtn').addEventListener('click', async () => {
    const ok = await resetPasswordByEmail(currentSession?.email, true);
    if (ok) showToast('Password reset to: password123');
  });
  $('logoutBtn').addEventListener('click', logout);

  if ($('workspaceBusinessEmail')) {
    $('workspaceBusinessEmail').addEventListener('input', () => {
      if ($('workspaceNewEmailVerificationTarget')) {
        $('workspaceNewEmailVerificationTarget').value = normalizeEmail($('workspaceBusinessEmail').value || '');
      }
      workspaceEmailVerificationState.newVerified = false;
    });
  }

  if ($('onboardBusinessEmail')) {
    $('onboardBusinessEmail').addEventListener('input', () => {
      emailVerificationState.owner = { email: '', verified: false };
    });
  }

  if ($('onboardJoinEmail')) {
    $('onboardJoinEmail').addEventListener('input', () => {
      emailVerificationState.employee = { email: '', verified: false };
    });
  }

  if ($('affiliateSignupEmail')) {
    $('affiliateSignupEmail').addEventListener('input', () => {
      emailVerificationState.affiliate = { email: '', verified: false };
    });
  }

  refreshClientDropdowns();
  refreshEmployeeDropdowns();
  renderServiceSuggestions();
  renderWorkspacePage();
  refreshPlanCardPrices();
  syncCompletedJobsToRevenue();
  loadTemplateEditors();
  registerServiceWorker();
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateWebAppStatus();
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    setSavedInstallChoice('installed');
    updateWebAppStatus();
    closeModal('mobileInstallPromptModal');
  });
  authInitPromise = initBackend().finally(async () => {
    updateWebAppStatus();
    await initAuth();
  });
  renderDashboard();
});
  
function escapeHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Theme Mode (Dark Only) ──────────────────────────────
function initTheme() {
  document.documentElement.setAttribute('data-theme', 'dark');
  localStorage.setItem('crm_theme', 'dark');
}

initTheme();
