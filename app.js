// ============================================================
//  ProCRM — Premium Business CRM  |  app.js
// ============================================================

// ─── DATA STORE ─────────────────────────────────────────────
const DB = {
  get clients()        { return JSON.parse(localStorage.getItem('crm_clients') || '[]'); },
  get bookings()       { return JSON.parse(localStorage.getItem('crm_bookings') || '[]'); },
  get payments()       { return JSON.parse(localStorage.getItem('crm_payments') || '[]'); },
  get employees()      { return JSON.parse(localStorage.getItem('crm_employees') || '[]'); },
  get users()          { return JSON.parse(localStorage.getItem('crm_users') || '[]'); },
  get notifications()  { return JSON.parse(localStorage.getItem('crm_notifications') || '[]'); },
  get reminders()      { return JSON.parse(localStorage.getItem('crm_reminders') || '[]'); },
  get payroll()        { return JSON.parse(localStorage.getItem('crm_payroll') || '[]'); },
  get templates()      {
    const fallback = {
      jobReminder: 'Reminder: {service} for {clientName} on {date} at {time}.',
      scheduleUpdate: 'Schedule update: booking #{bookingId} moved to {date} at {time}.',
      assignment: 'New assignment: booking #{bookingId} for {service} on {date} at {time}.'
    };
    return { ...fallback, ...(JSON.parse(localStorage.getItem('crm_templates') || '{}')) };
  },

  saveClients(d)       { localStorage.setItem('crm_clients', JSON.stringify(d)); },
  saveBookings(d)      { localStorage.setItem('crm_bookings', JSON.stringify(d)); },
  savePayments(d)      { localStorage.setItem('crm_payments', JSON.stringify(d)); },
  saveEmployees(d)     { localStorage.setItem('crm_employees', JSON.stringify(d)); },
  saveUsers(d)         { localStorage.setItem('crm_users', JSON.stringify(d)); },
  saveNotifications(d) { localStorage.setItem('crm_notifications', JSON.stringify(d)); },
  saveReminders(d)     { localStorage.setItem('crm_reminders', JSON.stringify(d)); },
  savePayroll(d)       { localStorage.setItem('crm_payroll', JSON.stringify(d)); },
  saveTemplates(d)     { localStorage.setItem('crm_templates', JSON.stringify(d)); },

  nextId(arr) {
    return arr.length ? Math.max(...arr.map(x => x.id || 0)) + 1 : 1;
  }
};

// ─── STATE ───────────────────────────────────────────────────
let currentPage = 'dashboard';
let currentBookingTab = 'all-bookings';
let calendarOffset = 0;
let calendarViewMode = 'weekly';
let currentSession = null;

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
  return role === 'technician' ? 'Technician' : 'Salesman';
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
  const adminEmail = 'admin@procrm.local';
  const exists = users.some(u => normalizeEmail(u.email) === adminEmail);
  if (exists) return;

  users.push({
    id: DB.nextId(users),
    email: adminEmail,
    passwordHash: hashPassword('Admin@12345'),
    role: 'admin',
    employeeId: null,
    status: 'active',
    name: 'Admin',
    createdAt: new Date().toISOString()
  });
  DB.saveUsers(users);
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
    return JSON.parse(sessionStorage.getItem('crm_session') || 'null');
  } catch {
    return null;
  }
}

function saveSession(session) {
  sessionStorage.setItem('crm_session', JSON.stringify(session));
  currentSession = session;
}

function clearSession() {
  sessionStorage.removeItem('crm_session');
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

function canAccessPage(page) {
  if (isAdmin()) return true;
  if (isSalesman()) return ['dashboard', 'clients', 'bookings', 'schedule', 'notifications'].includes(page);
  if (isTechnician()) return ['dashboard', 'bookings', 'schedule', 'notifications'].includes(page);
  return false;
}

function canEditBooking(booking) {
  if (isAdmin()) return true;
  if (isSalesman()) return true;
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

function openModal(id) { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }

function unreadCount() {
  const unreadEmployee = DB.notifications.filter(n => !n.read).length;
  const pendingTexts = DB.reminders.filter(r => r.status === 'pending').length;
  return unreadEmployee + pendingTexts;
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
}

// ─── REMINDER TEXT QUEUE ─────────────────────────────────────
function syncReminderQueue() {
  const reminders = DB.reminders;
  const clients = DB.clients;
  const bookings = DB.bookings;

  const now = new Date();
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 2);

  // Queue reminders for upcoming pending/confirmed jobs within 48 hours.
  for (const b of bookings) {
    if (!['booked', 'pending', 'confirmed'].includes(b.status)) continue;
    if (!b.date) continue;

    const d = toDateObj(b.date);
    if (d < new Date(now.getFullYear(), now.getMonth(), now.getDate()) || d > horizon) continue;

    const client = clients.find(c => c.id === b.clientId);
    if (!client || (!client.phone && !client.email)) continue;

    const exists = reminders.some(r => r.bookingId === b.id && ['pending', 'sent'].includes(r.status));
    if (exists) continue;

    reminders.push({
      id: DB.nextId(reminders),
      bookingId: b.id,
      clientId: b.clientId,
      status: 'pending',
      message: `Reminder: ${b.service} on ${fmtDate(b.date)} at ${b.time || 'TBD'}`,
      createdAt: new Date().toISOString(),
      sentAt: null
    });
  }

  // Auto-expire pending reminders if booking is no longer eligible.
  for (const r of reminders) {
    if (r.status !== 'pending') continue;
    const b = bookings.find(x => x.id === r.bookingId);
    if (!b || ['cancelled', 'completed'].includes(b.status)) {
      r.status = 'cancelled';
      r.sentAt = new Date().toISOString();
    }
  }

  DB.saveReminders(reminders);
}

function sendClientReminders() {
  syncReminderQueue();
  const reminders = DB.reminders;
  const bookings = DB.bookings;
  const clients = DB.clients;
  const templates = DB.templates;

  const pending = reminders.filter(r => r.status === 'pending');
  if (!pending.length) {
    showToast('No pending reminder texts to send.', 'info');
    renderNotificationsPage();
    return;
  }

  pending.forEach(r => {
    r.status = 'sent';
    r.sentAt = new Date().toISOString();
    const booking = bookings.find(b => b.id === r.bookingId);
    const client = clients.find(c => c.id === r.clientId);
    if (booking) booking.reminderSentAt = new Date().toISOString();
    const msg = renderTemplate(templates.jobReminder, {
      service: booking?.service || '-',
      clientName: fullName(client),
      date: fmtDate(booking?.date),
      time: booking?.time || 'TBD',
      bookingId: String(r.bookingId).padStart(4, '0')
    });
    addNotification(`Client reminder sent: ${msg}`, null, 'system', r.bookingId);
  });

  DB.saveReminders(reminders);
  DB.saveBookings(bookings);
  showToast(`Sent ${pending.length} client reminder text${pending.length > 1 ? 's' : ''}.`);
  renderNotificationsPage();
  renderDashboard();
}

// ─── NAVIGATION ──────────────────────────────────────────────
function navigateTo(page) {
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
    revenue: 'Revenue',
    employees: 'Employees',
    payroll: 'Payroll',
    notifications: 'Notifications'
  };
  $('pageTitle').textContent = titles[page] || page;

  if (page === 'dashboard') renderDashboard();
  if (page === 'clients') renderClientsTable();
  if (page === 'bookings') renderBookingsTable();
  if (page === 'schedule') renderCalendar();
  if (page === 'revenue') renderRevenueTable();
  if (page === 'employees') renderEmployeesTable();
  if (page === 'payroll') renderPayrollPage();
  if (page === 'notifications') renderNotificationsPage();

  if (window.innerWidth <= 768) $('sidebar').classList.remove('open');
}

// ─── DASHBOARD ───────────────────────────────────────────────
function renderDashboard() {
  syncReminderQueue();

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
  if (!confirm('Delete this client? This cannot be undone.')) return;
  DB.saveClients(DB.clients.filter(c => c.id !== id));
  showToast('Client deleted.', 'info');
  refreshClientDropdowns();
  renderClientsTable();
  renderDashboard();
}

function bookForClient(clientId) {
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
  if (!isAdmin()) {
    showToast('Only admin can manage employees.', 'error');
    return;
  }

  $('employeeId').value = employee ? employee.id : '';
  $('employeeFirstName').value = employee ? employee.firstName : '';
  $('employeeLastName').value = employee ? employee.lastName : '';
  $('employeeEmail').value = employee ? employee.email : '';
  $('employeePhone').value = employee ? employee.phone : '';
  $('employeeRole').value = employee ? employee.role : 'salesman';
  $('employeeStatus').value = employee ? employee.status : 'active';
  $('employeePayType').value = employee ? employee.payType : employeePayTypeFromRole($('employeeRole').value);
  $('employeePayRate').value = employee ? Number(employee.payRate || 0) : '';
  $('employeeCommissionRate').value = employee ? Number((employee.commissionRate ?? (employee.payType === 'commission' ? employee.payRate : 0)) || 0) : '';
  $('employeeHourlyRate').value = employee ? Number(employee.hourlyRate || 0) : '';
  $('employeeStartTime').value = employee ? (employee.startTime || '08:00') : '08:00';
  $('employeeEndTime').value = employee ? (employee.endTime || '17:00') : '17:00';
  $('employeeMaxJobs').value = employee ? Number(employee.maxJobsPerDay || 6) : 6;
  $('employeePassword').value = '';
  applyAvailableDaysToForm(employee ? (employee.availableDays || [1, 2, 3, 4, 5]) : [1, 2, 3, 4, 5]);
  $('employeeNotes').value = employee ? employee.notes : '';
  $('employeeModalTitle').textContent = employee ? 'Edit Employee' : 'Add Employee';
  openModal('employeeModal');
}

function saveEmployee() {
  if (!isAdmin()) {
    showToast('Only admin can manage employees.', 'error');
    return;
  }

  const firstName = $('employeeFirstName').value.trim();
  const lastName = $('employeeLastName').value.trim();
  const payRate = Number($('employeePayRate').value || 0);
  const commissionRate = Number($('employeeCommissionRate').value || 0);
  const hourlyRate = Number($('employeeHourlyRate').value || 0);

  if (!firstName || !lastName) {
    showToast('Employee first and last name are required.', 'error');
    return;
  }

  if (payRate < 0 || commissionRate < 0 || hourlyRate < 0) {
    showToast('Rates must be 0 or greater.', 'error');
    return;
  }

  const employees = DB.employees;
  const id = $('employeeId').value;
  const employeePassword = $('employeePassword').value;

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
  showToast(id ? 'Employee updated!' : 'Employee added!');
  refreshEmployeeDropdowns();
  renderEmployeesTable();
  renderDashboard();
}

function editEmployee(id) {
  const employee = DB.employees.find(e => e.id === id);
  if (employee) openEmployeeModal(employee);
}

function deleteEmployee(id) {
  if (!isAdmin()) {
    showToast('Only admin can delete employees.', 'error');
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
    service: booking.service || 'Completed Job',
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
      <td>${b.service || '-'}</td>
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
  if (!isAdmin() && !isSalesman() && !isTechnician()) return;

  if (booking && !canEditBooking(booking)) {
    showToast('You can only edit your assigned jobs.', 'error');
    return;
  }

  refreshClientDropdowns();
  refreshEmployeeDropdowns();
  const employees = DB.employees;
  const completedBy = employees.find(e => e.id === booking?.completedById);

  $('bookingId').value = booking ? booking.id : '';
  $('bookingClient').value = booking ? booking.clientId : (presetClientId || '');
  $('bookingService').value = booking ? booking.service : '';
  $('bookingDate').value = booking ? booking.date : today();
  $('bookingTime').value = booking ? booking.time : '09:00';
  $('bookingDuration').value = booking ? booking.duration : '60';
  $('bookingAmount').value = booking ? (booking.amount ?? '') : '';
  $('bookingSalesman').value = booking?.soldById || booking?.salesmanId || '';
  $('bookingTechnician').value = booking?.technicianId || '';
  $('bookingStatus').value = booking ? booking.status : 'booked';
  $('bookingLocation').value = booking ? booking.location : '';
  $('bookingNotes').value = booking ? booking.notes : '';
  $('bookingCompletedBy').value = completedBy ? fullName(completedBy) : '';
  $('bookingCompletedAt').value = booking?.completedAt ? new Date(booking.completedAt).toLocaleString() : '';

  if (isTechnician()) {
    $('bookingSalesman').disabled = true;
    $('bookingTechnician').disabled = true;
    $('bookingAmount').disabled = true;
  } else {
    $('bookingSalesman').disabled = false;
    $('bookingTechnician').disabled = false;
    $('bookingAmount').disabled = false;
  }

  $('bookingModalTitle').textContent = booking ? 'Edit Booking' : 'New Booking';
  openModal('bookingModal');
}

function saveBooking() {
  const clientId = Number($('bookingClient').value || 0);
  const service = $('bookingService').value.trim();
  const date = $('bookingDate').value;
  const time = $('bookingTime').value;

  if (!clientId || !service || !date || !time) {
    showToast('Client, service, date and time are required.', 'error');
    return;
  }

  const bookings = DB.bookings;
  const id = $('bookingId').value;
  const existing = id ? bookings.find(b => b.id == id) : null;
  const employees = DB.employees;

  if (existing && !canEditBooking(existing)) {
    showToast('You cannot edit this booking.', 'error');
    return;
  }

  const selectedTechId = $('bookingTechnician').value ? Number($('bookingTechnician').value) : null;
  if (selectedTechId) {
    const tech = employees.find(e => e.id === selectedTechId);
    if (!isEmployeeAvailableForBooking(tech, date, time)) {
      showToast('Selected technician is unavailable at this date/time.', 'error');
      return;
    }
  }

  const data = {
    id: id ? Number(id) : DB.nextId(bookings),
    clientId,
    service,
    date,
    time,
    duration: $('bookingDuration').value,
    amount: $('bookingAmount').value ? Number($('bookingAmount').value) : null,
    salesmanId: $('bookingSalesman').value ? Number($('bookingSalesman').value) : null,
    soldById: $('bookingSalesman').value ? Number($('bookingSalesman').value) : null,
    technicianId: selectedTechId,
    status: $('bookingStatus').value,
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
      service: data.service
    });
    addNotification(scheduleMsg, data.technicianId, 'employee', data.id);
  }

  if (!id && data.soldById) {
    const sales = DB.employees.find(e => e.id === data.soldById);
    addNotification(`New door-to-door booking assigned to sales: ${fullName(sales)}.`, data.salesmanId, 'employee', data.id);
  }

  if (!existing || existing.technicianId !== data.technicianId) {
    if (data.technicianId) {
      const tech = DB.employees.find(e => e.id === data.technicianId);
      const assignMsg = renderTemplate(templates.assignment, {
        bookingId: String(data.id).padStart(4, '0'),
        service: data.service,
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
  syncReminderQueue();
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
  if (b.technicianId) addNotification(`Booking #${String(b.id).padStart(4, '0')} was confirmed.`, b.technicianId, 'employee', b.id);

  syncReminderQueue();
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

  booking.status = 'completed';
  booking.completedAt = new Date().toISOString();
  booking.completedById = isTechnician() ? currentSession?.employeeId : (booking.technicianId || currentSession?.employeeId || null);
  DB.saveBookings(bookings);

  upsertRevenueFromCompletedJob(booking);

  if (booking.soldById || booking.salesmanId) addNotification(`Booking #${String(booking.id).padStart(4, '0')} completed by technician.`, (booking.soldById || booking.salesmanId), 'employee', booking.id);
  if (booking.technicianId) addNotification(`Marked completed: booking #${String(booking.id).padStart(4, '0')}.`, booking.technicianId, 'employee', booking.id);

  syncReminderQueue();
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
  syncReminderQueue();
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

  bookings.push({
    id: DB.nextId(bookings),
    clientId: client.id,
    service,
    date,
    time,
    duration: $('pubDuration').value,
    amount: null,
    salesmanId: salesmen.length ? salesmen[0].id : null,
    soldById: salesmen.length ? salesmen[0].id : null,
    technicianId: null,
    status: 'booked',
    location: '',
    notes: $('pubNotes').value.trim(),
    completedAt: null,
    completedById: null,
    createdAt: today()
  });

  DB.saveBookings(bookings);
  closeModal('publicBookingModal');
  showToast('Booking request submitted! Pending confirmation.');

  syncReminderQueue();
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

  if (employee.role === 'salesman') {
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
  showToast('Payroll run completed for this month.');
  renderPayrollPage();
  renderDashboard();
}

function renderPayrollPage() {
  const payroll = DB.payroll;
  const employees = DB.employees;

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const monthEnd = endOfMonth();

  const thisMonth = payroll.filter(p => p.periodStart === monthStart && p.periodEnd === monthEnd);
  const salesTotal = thisMonth.filter(p => p.role === 'salesman').reduce((s, p) => s + Number(p.amount || 0), 0);
  const techTotal = thisMonth.filter(p => p.role === 'technician').reduce((s, p) => s + Number(p.amount || 0), 0);

  $('payrollMonthTotal').textContent = fmt(salesTotal + techTotal);
  $('salesPayrollTotal').textContent = fmt(salesTotal);
  $('techPayrollTotal').textContent = fmt(techTotal);
  $('payrollRunsCount').textContent = payroll.length;

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

// ─── NOTIFICATIONS ───────────────────────────────────────────
function markAllNotificationsRead() {
  const notifications = DB.notifications;
  notifications.forEach(n => { n.read = true; });
  DB.saveNotifications(notifications);
  renderNotificationsPage();
  renderDashboard();
}

function renderNotificationsPage() {
  syncReminderQueue();

  const notifications = [...DB.notifications].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const reminders = [...DB.reminders].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  const employees = DB.employees;
  const clients = DB.clients;
  const bookings = DB.bookings;

  $('notifBadge').textContent = unreadCount();

  const notifList = $('employeeNotificationsList');
  if (!notifications.length) {
    notifList.innerHTML = `<div class="empty-state"><i class="fas fa-bell"></i><p>No employee notifications yet</p></div>`;
  } else {
    notifList.innerHTML = notifications.slice(0, 50).map(n => {
      const employee = employees.find(e => e.id === n.employeeId);
      const who = employee ? `<div style="font-size:12px;color:var(--text-secondary)">To: ${fullName(employee)}</div>` : '<div style="font-size:12px;color:var(--text-secondary)">System</div>';
      return `<div class="mini-booking" style="border-left:${n.read ? '2px solid transparent' : '2px solid var(--accent-blue)'};padding-left:10px;">
        <span class="mini-booking-time">${new Date(n.createdAt).toLocaleString()}</span>
        <div class="mini-booking-info">
          <div class="mini-booking-client">${n.message}</div>
          ${who}
        </div>
        ${n.read ? '<span class="status-badge status-completed">Read</span>' : '<span class="status-badge status-pending">Unread</span>'}
      </div>`;
    }).join('');
  }

  const reminderList = $('clientRemindersList');
  const pendingCount = reminders.filter(r => r.status === 'pending').length;
  $('pendingRemindersBadge').textContent = `${pendingCount} pending`;

  if (!reminders.length) {
    reminderList.innerHTML = `<div class="empty-state"><i class="fas fa-message"></i><p>No reminders queued</p></div>`;
  } else {
    reminderList.innerHTML = reminders.slice(0, 50).map(r => {
      const booking = bookings.find(b => b.id === r.bookingId) || {};
      const client = clients.find(c => c.id === r.clientId) || {};
      return `<div class="mini-booking">
        <span class="mini-booking-time">${fmtDate(booking.date || today())}</span>
        <div class="mini-booking-info">
          <div class="mini-booking-client">${fullName(client)} · ${booking.service || '-'}</div>
          <div class="mini-booking-service">${r.message}</div>
        </div>
        <span class="status-badge status-${r.status === 'sent' ? 'completed' : (r.status === 'cancelled' ? 'cancelled' : 'pending')}">${r.status}</span>
      </div>`;
    }).join('');
  }
}

// ─── DROPDOWN REFRESH ────────────────────────────────────────
function refreshClientDropdowns() {
  const clients = DB.clients;
  const options = '<option value="">Select a client...</option>' + clients.map(c => `<option value="${c.id}">${fullName(c)}</option>`).join('');
  ['bookingClient', 'paymentClient'].forEach(id => {
    const el = $(id);
    if (el) el.innerHTML = options;
  });
}

function refreshEmployeeDropdowns() {
  const employees = DB.employees.filter(e => e.status === 'active');
  const sales = employees.filter(e => e.role === 'salesman');
  const techs = employees.filter(e => e.role === 'technician');

  const selectedSales = $('bookingSalesman')?.value || '';
  const selectedTech = $('bookingTechnician')?.value || '';
  const salesOptions = '<option value="">Unassigned</option>' + sales.map(e => `<option value="${e.id}">${fullName(e)}</option>`).join('');
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
}

function saveNotificationTemplates() {
  const templates = {
    ...DB.templates,
    jobReminder: $('tplJobReminder').value.trim() || DB.templates.jobReminder,
    scheduleUpdate: $('tplScheduleUpdate').value.trim() || DB.templates.scheduleUpdate
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

  document.querySelectorAll('.nav-item').forEach(item => {
    const page = item.dataset.page;
    item.style.display = canAccessPage(page) ? 'flex' : 'none';
  });

  const adminOnly = ['addClientBtn', 'addEmployeeBtn', 'addPaymentBtn', 'runPayrollBtn', 'exportPayrollBtn'];
  adminOnly.forEach(id => {
    if ($(id)) $(id).style.display = isAdmin() ? 'inline-flex' : 'none';
  });

  if ($('quickAddBtn')) $('quickAddBtn').style.display = currentSession ? 'inline-flex' : 'none';
  if ($('accountBtn')) $('accountBtn').style.display = currentSession ? 'inline-flex' : 'none';
  if ($('logoutBtn')) $('logoutBtn').style.display = currentSession ? 'inline-flex' : 'none';
  if ($('qAddEmployee')) $('qAddEmployee').style.display = isAdmin() ? 'flex' : 'none';
  if ($('qAddPayment')) $('qAddPayment').style.display = isAdmin() ? 'flex' : 'none';
  if ($('qAddClient')) $('qAddClient').style.display = (isAdmin() || isSalesman()) ? 'flex' : 'none';
}

function handleLogin() {
  const email = normalizeEmail($('loginEmail').value);
  const password = $('loginPassword').value;

  if (!email || !password) {
    showToast('Email and password are required.', 'error');
    return;
  }

  const users = DB.users;
  const user = users.find(u => normalizeEmail(u.email) === email && u.status !== 'inactive');
  if (!user || user.passwordHash !== hashPassword(password)) {
    showToast('Invalid email or password.', 'error');
    return;
  }

  if (user.role === 'admin') {
    saveSession({ role: 'admin', name: user.name || 'Admin', email: user.email });
  } else {
    const employee = DB.employees.find(e => e.id === user.employeeId && e.status === 'active');
    if (!employee) {
      showToast('This employee account is inactive.', 'error');
      return;
    }
    saveSession({ role: employee.role, employeeId: employee.id, name: fullName(employee), email: user.email });
  }

  closeModal('loginOverlay');
  $('loginPassword').value = '';
  applyRolePermissions();
  navigateTo('dashboard');
  renderDashboard();
}

function openAccountModal() {
  if (!currentSession?.email) {
    showToast('Sign in first.', 'error');
    return;
  }

  $('currentAccountEmail').value = currentSession.email;
  $('accountNewEmail').value = currentSession.email;
  $('accountNewPassword').value = '';
  $('accountConfirmPassword').value = '';
  openModal('accountModal');
}

function saveAccountCredentials() {
  if (!currentSession?.email) return;

  const newEmail = normalizeEmail($('accountNewEmail').value);
  const newPassword = $('accountNewPassword').value;
  const confirm = $('accountConfirmPassword').value;

  if (!newEmail) {
    showToast('Email is required.', 'error');
    return;
  }

  if (newPassword && newPassword !== confirm) {
    showToast('Passwords do not match.', 'error');
    return;
  }

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
  if (newPassword) users[userIndex].passwordHash = hashPassword(newPassword);
  DB.saveUsers(users);

  if (users[userIndex].employeeId) {
    const employees = DB.employees;
    const eIdx = employees.findIndex(e => e.id === users[userIndex].employeeId);
    if (eIdx !== -1) {
      employees[eIdx].email = newEmail;
      DB.saveEmployees(employees);
      refreshEmployeeDropdowns();
    }
  }

  currentSession.email = newEmail;
  saveSession(currentSession);
  closeModal('accountModal');
  showToast('Account credentials updated.');
}

function resetPasswordByEmail(emailInput, silent = false) {
  const email = normalizeEmail(emailInput);
  if (!email) {
    if (!silent) showToast('Enter an email first.', 'error');
    return false;
  }

  const users = DB.users;
  const i = users.findIndex(u => normalizeEmail(u.email) === email && u.status !== 'inactive');
  if (i === -1) {
    if (!silent) showToast('No account found for this email.', 'error');
    return false;
  }

  users[i].passwordHash = hashPassword('password123');
  DB.saveUsers(users);
  if (!silent) showToast('Password reset to: password123');
  return true;
}

function initAuth() {
  seedAdminAccount();
  currentSession = getSession();
  if (currentSession) {
    closeModal('loginOverlay');
    applyRolePermissions();
  } else {
    openModal('loginOverlay');
    applyRolePermissions();
  }
}

function logout() {
  clearSession();
  $('loginEmail').value = '';
  $('loginPassword').value = '';
  openModal('loginOverlay');
  applyRolePermissions();
}

// ─── INIT & EVENT LISTENERS ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
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

  $('quickAddBtn').addEventListener('click', e => {
    e.stopPropagation();
    $('quickMenu').classList.toggle('open');
  });
  document.addEventListener('click', () => $('quickMenu').classList.remove('open'));

  $('qAddClient').addEventListener('click', () => { navigateTo('clients'); openClientModal(); });
  $('qAddEmployee').addEventListener('click', () => { navigateTo('employees'); openEmployeeModal(); });
  $('qAddBooking').addEventListener('click', () => { navigateTo('bookings'); openBookingModal(); });
  $('qAddPayment').addEventListener('click', () => { navigateTo('revenue'); openPaymentModal(); });
  $('qSendReminders').addEventListener('click', () => { sendClientReminders(); navigateTo('notifications'); });
  $('qPublicBook').addEventListener('click', () => openPublicBookingModal());

  document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.modal;
      if (id && id !== 'loginOverlay') closeModal(id);
    });
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay && overlay.id !== 'loginOverlay') closeModal(overlay.id);
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
  $('exportRevenueBtn').addEventListener('click', exportRevenueCSV);
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
  $('sendRemindersBtn').addEventListener('click', sendClientReminders);
  $('markNotificationsReadBtn').addEventListener('click', markAllNotificationsRead);
  $('saveTemplateBtn').addEventListener('click', saveNotificationTemplates);

  $('notifBtn').addEventListener('click', () => navigateTo('notifications'));

  $('loginBtn').addEventListener('click', handleLogin);
  $('loginPassword').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
  $('forgotPasswordBtn').addEventListener('click', () => resetPasswordByEmail($('loginEmail').value));
  $('accountBtn').addEventListener('click', openAccountModal);
  $('saveAccountBtn').addEventListener('click', saveAccountCredentials);
  $('resetMyPasswordBtn').addEventListener('click', () => {
    const ok = resetPasswordByEmail(currentSession?.email, true);
    if (ok) showToast('Password reset to: password123');
  });
  $('logoutBtn').addEventListener('click', logout);

  refreshClientDropdowns();
  refreshEmployeeDropdowns();
  syncCompletedJobsToRevenue();
  syncReminderQueue();
  loadTemplateEditors();
  initAuth();
  renderDashboard();
});
