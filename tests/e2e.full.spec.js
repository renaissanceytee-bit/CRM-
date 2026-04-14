import { test, expect } from '@playwright/test';

async function seedWorkspace(request, { onboarded = true } = {}) {
  await request.post('/api/migrate/local', {
    data: {
      workspace: {
        companyName: 'Test CRM',
        onboarded,
        plan: 'professional',
        employeeJoinCode: 'BUS-TEST',
        growth: {
          affiliateEnabled: true,
          affiliateSignupEnabled: false,
        },
        serviceCatalog: [{ id: 1, mainService: 'Window Cleaning', subServices: ['Exterior', 'Interior'] }],
      },
      clients: [
        { id: 101, firstName: 'Casey', lastName: 'Client', email: 'casey@example.com', phone: '555-1111', status: 'active' },
      ],
      employees: [
        { id: 201, firstName: 'Taylor', lastName: 'Tech', email: 'taylor@example.com', phone: '555-2222', role: 'technician', status: 'active' },
      ],
    },
  });
}

async function isVisibleNow(page, selector) {
  return page.evaluate(sel => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0;
  }, selector);
}

async function fetchVerificationCode(request, email, purpose) {
  const sendResponse = await request.post('/api/auth/send-verification-code', {
    data: { email, purpose },
  });
  const sendJson = await sendResponse.json();
  return sendJson?.devCode || '';
}

async function completeOnboardingIfVisible(page, request) {
  const onboarding = page.locator('#onboardingOverlay');
  const count = await onboarding.count();
  if (count === 0) return;
  const visible = await onboarding.isVisible({ timeout: 3000 }).catch(() => false);
  if (!visible) return;

  if (await isVisibleNow(page, '#onboardChooseOwnerBtn')) {
    await page.locator('#onboardChooseOwnerBtn').click();
  }
  await expect(page.locator('#onboardBusinessEmail')).toBeVisible();
  await page.locator('#onboardBusinessEmail').fill('owner@e2e.company');
  const ownerCode = await fetchVerificationCode(request, 'owner@e2e.company', 'owner-signup');
  if (ownerCode && await isVisibleNow(page, '#onboardOwnerVerificationCode')) {
    await page.locator('#onboardOwnerVerificationCode').fill(ownerCode);
  }
  if (await isVisibleNow(page, '#onboardOwnerVerifyCodeBtn')) {
    await page.locator('#onboardOwnerVerifyCodeBtn').click();
  }
  if (await isVisibleNow(page, '#onboardPrimaryAdmin')) {
    await page.locator('#onboardPrimaryAdmin').fill('E2E Owner');
  }
  await page.locator('#onboardOwnerPassword').fill('Admin@12345');
  await page.locator('#onboardOwnerPasswordConfirm').fill('Admin@12345');
  if (await isVisibleNow(page, '#onboardOwnerAccountNextBtn')) {
    await page.locator('#onboardOwnerAccountNextBtn').click();
  }

  await expect(page.locator('#onboardCompanyName')).toBeVisible();
  await page.locator('#onboardCompanyName').fill('E2E Company');
  if (await isVisibleNow(page, '#onboardEmployeeCount')) {
    await page.locator('#onboardEmployeeCount').fill('5');
  }
  if (await isVisibleNow(page, '#onboardOwnerBusinessNextBtn')) {
    await page.locator('#onboardOwnerBusinessNextBtn').click();
  }

  if (await isVisibleNow(page, '#onboardMonthlyRevenue')) {
    await page.locator('#onboardMonthlyRevenue').fill('25000');
  }
  if (await isVisibleNow(page, '#onboardOwnerRevenueNextBtn')) {
    await page.locator('#onboardOwnerRevenueNextBtn').click();
  }

  if (await isVisibleNow(page, '#onboardPlanProfessional')) {
    await page.locator('#onboardPlanProfessional').click();
  }
  await page.locator('#completeOwnerOnboardingBtn').click();
  await expect(onboarding).not.toBeVisible();
}

async function expectPostLoginPage(page) {
  await expect.poll(async () => {
    const candidates = ['owner-portal', 'dashboard', 'my-portal'];
    for (const pageKey of candidates) {
      const className = await page.locator(`#page-${pageKey}`).getAttribute('class');
      if (className && className.includes('active')) return pageKey;
    }
    return '';
  }).not.toBe('');
}

async function waitForAuthBootstrap(page) {
  await page.waitForFunction(() => window.__procrmAuthReady === true, null, { timeout: 15000 });
}

async function loginIfNeeded(page, request) {
  await request.post('/api/auth/reset-password', {
    data: { email: 'admin@procrm.local' },
  }).catch(() => null);

  await page.goto('/');
  await waitForAuthBootstrap(page);
  await completeOnboardingIfVisible(page, request);

  const authScreen = page.locator('#authScreen');
  const authVisible = await authScreen.isVisible();
  if (authVisible) {
    if (await page.locator('#authGoSignIn').isVisible()) {
      await page.locator('#authGoSignIn').click();
    }
    await page.locator('#loginEmail').fill('admin@procrm.local');
    await page.locator('#loginPassword').fill('password123');
    await page.locator('#loginBtn').click();
    await page.waitForFunction(() => !document.querySelector('#authScreen') || document.querySelector('#authScreen').classList.contains('hidden'), null, { timeout: 8000 }).catch(() => null);
    try {
      await expect(authScreen).toHaveClass(/hidden/, { timeout: 3000 });
    } catch {
      // Fallback to seed default in case reset-password endpoint was rejected.
      await page.locator('#loginPassword').fill('Admin@12345');
      await page.locator('#loginBtn').click();
      await expect(authScreen).toHaveClass(/hidden/);
    }
  }

  await completeOnboardingIfVisible(page, request);
  await expect.poll(async () => page.evaluate(() => Boolean(sessionStorage.getItem('crm_session') || localStorage.getItem('crm_session')))).toBe(true);
  await expect(authScreen).toHaveClass(/hidden/);
  await expectPostLoginPage(page);
}

test.describe('Service Mafia Full Feature Smoke Coverage', () => {
  test('auth entry points and onboarding entry work', async ({ page, request }) => {
    await seedWorkspace(request, { onboarded: false });
    await page.goto('/');

    if (!(await page.locator('#onboardingOverlay').isVisible())) {
      await page.locator('#authGoCreate').click();
      await page.locator('#authChoiceOwner').click();
    }

    await expect(page.locator('#onboardingOverlay')).toBeVisible();
    if (await page.locator('#onboardChooseOwnerBtn').isVisible()) {
      await page.locator('#onboardChooseOwnerBtn').click();
    }
    await expect(page.locator('#onboardingOverlay')).toHaveClass(/open/);

    await completeOnboardingIfVisible(page, request);
    await expect.poll(async () => page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'dark')).toBe('dark');
  });

  test('login, CRUD core flows, and workspace save work', async ({ page, request }) => {
    await seedWorkspace(request, { onboarded: true });
    await loginIfNeeded(page, request);

    await page.locator('[data-page="clients"]').first().click();
    await expect(page.locator('#page-clients')).toHaveClass(/active/);
    await page.locator('#addClientBtn').click();
    await page.locator('#clientFirstName').fill('E2E');
    await page.locator('#clientLastName').fill('Customer');
    await page.locator('#clientEmail').fill('e2e.customer@example.com');
    await page.locator('#clientPhone').fill('555-3333');
    await page.locator('#saveClientBtn').click();
    await expect(page.locator('#clientsBody')).toContainText('E2E Customer');

    await page.locator('[data-page="employees"]').first().click();
    await expect(page.locator('#page-employees')).toHaveClass(/active/);
    await page.locator('#addEmployeeBtn').click();
    await page.locator('#employeeFirstName').fill('E2E');
    await page.locator('#employeeLastName').fill('Technician');
    await page.locator('#employeeEmail').fill('e2e.tech@example.com');
    await page.locator('#employeePhone').fill('555-4444');
    await page.locator('#employeeRole').selectOption('technician');
    await page.locator('#employeePayRate').fill('35');
    await page.locator('#saveEmployeeBtn').click();
    await expect(page.locator('#employeesBody')).toContainText('E2E Technician');

    await page.locator('[data-page="bookings"]').first().click();
    await expect(page.locator('#page-bookings')).toHaveClass(/active/);
    await page.locator('#addBookingBtn').click();
    await page.locator('#bookingClient').selectOption({ index: 1 });
    await page.locator('#bookingServices').fill('Window Cleaning - Exterior');
    await page.locator('#bookingDate').fill('2026-04-30');
    await page.locator('#bookingTime').fill('09:30');
    await page.locator('#bookingAmount').fill('220');
    await page.locator('#saveBookingBtn').click();
    await expect(page.locator('#bookingsBody')).toContainText('Window Cleaning - Exterior');

    await page.locator('[data-page="revenue"]').first().click();
    await expect(page.locator('#page-revenue')).toHaveClass(/active/);
    await page.locator('#addPaymentBtn').click();
    await page.locator('#paymentClient').selectOption({ index: 1 });
    await page.locator('#paymentService').fill('Monthly Service');
    await page.locator('#paymentAmount').fill('180');
    await page.locator('#paymentDate').fill('2026-04-30');
    await page.locator('#paymentMethod').selectOption('card');
    await page.locator('#savePaymentBtn').click();
    await expect(page.locator('#revenueBody')).toContainText('Monthly Service');

    await page.locator('[data-page="workspace"]').first().click();
    await expect(page.locator('#page-workspace')).toHaveClass(/active/);
    await page.locator('#workspaceCompanyName').fill('Test CRM Updated');
    await page.locator('#saveWorkspaceBtn').click();
    await expect(page.locator('#companyName')).toContainText('Test CRM Updated');

    await expect.poll(async () => page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'dark')).toBe('dark');

  });

  test('all primary pages are reachable after login', async ({ page, request }) => {
    await seedWorkspace(request, { onboarded: true });
    await loginIfNeeded(page, request);

    const pages = [
      'dashboard',
      'clients',
      'bookings',
      'schedule',
      'revenue',
      'employees',
      'payroll',
      'owner-portal',
      'affiliate-portal',
      'owner-revenue',
      'workspace',
      'team-chat',
    ];

    for (const pageKey of pages) {
      await page.locator(`[data-page="${pageKey}"]`).first().click();
      await expect(page.locator(`#page-${pageKey}`)).toHaveClass(/active/);
      await expect(page.locator('#pageTitle')).toBeVisible();
    }
  });
});
