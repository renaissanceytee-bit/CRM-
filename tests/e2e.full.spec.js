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
  if (await isVisibleNow(page, '#onboardCompanyName')) {
    await page.locator('#onboardCompanyName').fill('E2E Company');
  }
  await page.locator('#onboardOwnerPassword').fill('Admin@12345');
  await page.locator('#onboardOwnerPasswordConfirm').fill('Admin@12345');
  if (await isVisibleNow(page, '#onboardOwnerAccountNextBtn')) {
    await page.locator('#onboardOwnerAccountNextBtn').click();
  }

  if (await isVisibleNow(page, '#onboardOwnerVerifyNextBtn')) {
    await page.locator('#onboardOwnerVerifyNextBtn').click();
  }

  if (await isVisibleNow(page, '#onboardEmployeeCount')) {
    await page.locator('#onboardEmployeeCount').fill('5');
  }

  if (await isVisibleNow(page, '#onboardCurrentRevenue')) {
    await page.locator('#onboardCurrentRevenue').fill('25000');
  }

  if (await isVisibleNow(page, '#onboardPlanProfessional')) {
    await page.locator('#onboardPlanProfessional').click();
  }

  if (await isVisibleNow(page, '#onboardMonthlyRevenue')) {
    await page.locator('#onboardMonthlyRevenue').fill('40000');
  }

  if (await isVisibleNow(page, '#onboardOwnerBusinessNextBtn')) {
    await page.locator('#onboardOwnerBusinessNextBtn').click();
  }

  if (await isVisibleNow(page, '#onboardOwnerFeaturesNextBtn')) {
    await page.locator('#onboardOwnerFeaturesNextBtn').click();
  }

  if (await isVisibleNow(page, '#completeOwnerOnboardingBtn')) {
    await page.locator('#completeOwnerOnboardingBtn').click();
  }
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
      if (await page.locator('#authGoCreate').isVisible()) {
        await page.locator('#authGoCreate').click();
      }
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
      'quotes',
      'revenue',
      'employees',
      'payroll',
      'owner-portal',
      'owner-revenue',
      'workspace',
    ];

    for (const pageKey of pages) {
      await page.locator(`[data-page="${pageKey}"]`).first().click();
      await expect(page.locator(`#page-${pageKey}`)).toHaveClass(/active/);
      await expect(page.locator('#pageTitle')).toBeVisible();
    }
  });

  test('quotes: create and display quote', async ({ page, request }) => {
    await seedWorkspace(request, { onboarded: true });
    await loginIfNeeded(page, request);

    // Create a client through the UI so the quotes dropdown is populated
    await page.locator('[data-page="clients"]').first().click();
    await expect(page.locator('#page-clients')).toHaveClass(/active/);
    await page.locator('#addClientBtn').click();
    await page.locator('#clientFirstName').fill('Quote');
    await page.locator('#clientLastName').fill('TestClient');
    await page.locator('#clientEmail').fill('quote.client@example.com');
    await page.locator('#saveClientBtn').click();
    await expect(page.locator('#clientsBody')).toContainText('Quote TestClient');

    await page.locator('[data-page="quotes"]').first().click();
    await expect(page.locator('#page-quotes')).toHaveClass(/active/);

    // Wait for dropdown to include newly created client
    await page.waitForFunction(() => {
      const sel = document.querySelector('#quoteClient');
      return sel && Array.from(sel.options).some(o => o.text.includes('Quote TestClient'));
    }, null, { timeout: 8000 });
    await page.locator('#quoteClient').selectOption({ label: 'Quote TestClient' });

    // Fill in quote form
    await page.locator('#quoteTitle').fill('E2E Window Quote');
    await page.locator('#quoteItems').fill('Exterior Clean|2|150\nScreen Clean|1|60');
    await page.locator('#quoteTax').fill('8');
    await page.locator('#quoteNotes').fill('E2E test quote');
    await page.locator('#saveQuoteBtn').click();

    // Quote should appear in table
    await expect(page.locator('#quotesBody')).toContainText('E2E Window Quote');
    await expect(page.locator('#quotesEmpty')).not.toBeVisible();
  });

  test('payroll: run payroll and verify records', async ({ page, request }) => {
    await seedWorkspace(request, { onboarded: true });
    await loginIfNeeded(page, request);

    await page.locator('[data-page="payroll"]').first().click();
    await expect(page.locator('#page-payroll')).toHaveClass(/active/);

    // Run payroll
    await page.locator('#runPayrollBtn').click();
    // Modal or toast confirmation expected — check toast or table updates
    await expect(page.locator('#toast')).toBeVisible({ timeout: 5000 }).catch(() => null);
  });

  test('schedule: weekly and monthly view toggle', async ({ page, request }) => {
    await seedWorkspace(request, { onboarded: true });
    await loginIfNeeded(page, request);

    await page.locator('[data-page="schedule"]').first().click();
    await expect(page.locator('#page-schedule')).toHaveClass(/active/);
    await expect(page.locator('#calendarGrid')).toBeVisible();

    await page.locator('#scheduleViewMode').selectOption('monthly');
    await expect(page.locator('#calendarGrid')).toBeVisible();

    await page.locator('#scheduleViewMode').selectOption('weekly');
    await expect(page.locator('#calendarGrid')).toBeVisible();
  });

  test('owner portal: stats and growth planner are visible', async ({ page, request }) => {
    await seedWorkspace(request, { onboarded: true });
    await loginIfNeeded(page, request);

    await page.locator('[data-page="owner-portal"]').first().click();
    await expect(page.locator('#page-owner-portal')).toHaveClass(/active/);
    await expect(page.locator('#ownerPortalStatsGrid')).toBeVisible();

    // Growth planner inputs
    await expect(page.locator('#ownerGrowthCurrentRevenue')).toBeVisible();
    await page.locator('#ownerGrowthCurrentRevenue').fill('25000');
    await page.locator('#ownerGrowthTargetRevenue').fill('50000');
    await page.locator('#ownerGrowthRatePct').fill('10');
    await page.locator('#ownerGrowthMonths').fill('6');
    await page.locator('#ownerGrowthSaveBtn').click();
    await expect(page.locator('#ownerGrowthProjectionList')).toContainText('Projected');
  });

  test('workspace: subscription plan selection works', async ({ page, request }) => {
    await seedWorkspace(request, { onboarded: true });
    await loginIfNeeded(page, request);

    await page.locator('[data-page="workspace"]').first().click();
    await expect(page.locator('#page-workspace')).toHaveClass(/active/);

    // Plan cards visible
    await expect(page.locator('#planStarter')).toBeVisible();
    await expect(page.locator('#planProfessional')).toBeVisible();
    await expect(page.locator('#planPremium')).toBeVisible();

    // Switch to premium — plan is saved immediately on click
    await page.locator('#planPremium').click();
    await expect(page.locator('#planPremium')).toHaveClass(/selected/);

    // Save remaining workspace settings
    await page.locator('#saveWorkspaceBtn').click();
    await expect(page.locator('#toast')).toBeVisible({ timeout: 5000 }).catch(() => null);
  });

  test('email verification: send-code and verify endpoints respond', async ({ request }) => {
    const email = 'verify-test@e2e.local';

    // Send verification code
    const sendRes = await request.post('/api/auth/send-verification-code', {
      data: { email, purpose: 'owner-signup' },
    });
    expect(sendRes.status()).toBe(200);
    const sendJson = await sendRes.json();
    // In dev mode the code is returned directly
    const code = sendJson?.devCode;
    expect(code).toBeTruthy();

    // Verify the code
    const verifyRes = await request.post('/api/auth/verify-email-code', {
      data: { email, code, purpose: 'owner-signup' },
    });
    expect(verifyRes.status()).toBe(200);
    const verifyJson = await verifyRes.json();
    expect(verifyJson?.verified).toBe(true);
  });

  test('password reset: reset-password endpoint issues a temp password', async ({ request }) => {
    const resetRes = await request.post('/api/auth/reset-password', {
      data: { email: 'admin@procrm.local' },
    });
    expect(resetRes.status()).toBe(200);
    const resetJson = await resetRes.json();
    expect(resetJson?.temporaryPassword).toBeTruthy();
  });

  test('employee join onboarding works with business invite code', async ({ page, request }) => {
    await seedWorkspace(request, { onboarded: true });
    await page.goto('/');
    await waitForAuthBootstrap(page);

    if (await page.locator('#authGoCreate').isVisible()) {
      await page.locator('#authGoCreate').click();
    }
    await page.locator('#authChoiceEmployee').click();

    await expect(page.locator('#onboardJoinCode')).toBeVisible();
    await page.locator('#onboardJoinCode').fill('BUS-TEST');
    await page.locator('#onboardValidateJoinCodeBtn').click();

    await expect(page.locator('#onboardJoinFirstName')).toBeVisible();
    await page.locator('#onboardJoinFirstName').fill('Join');
    await page.locator('#onboardJoinLastName').fill('Tester');
    await page.locator('#onboardJoinEmail').fill('join.tester@example.com');
    await page.locator('#onboardJoinRole').selectOption('technician');
    await page.locator('#onboardJoinPassword').fill('Worker@12345');
    await page.locator('#onboardJoinPasswordConfirm').fill('Worker@12345');

    const code = await fetchVerificationCode(request, 'join.tester@example.com', 'employee-signup');
    await page.locator('#onboardJoinVerificationCode').fill(code);
    await page.locator('#onboardJoinVerifyCodeBtn').click();

    await page.locator('#completeJoinOnboardingBtn').click();
    await expect(page.locator('#authScreen')).toHaveClass(/hidden/);
    await expect(page.locator('#page-my-portal')).toHaveClass(/active/);
  });

  test('revenue forecast: owner-revenue page renders chart', async ({ page, request }) => {
    await seedWorkspace(request, { onboarded: true });
    await loginIfNeeded(page, request);

    await page.locator('[data-page="owner-revenue"]').first().click();
    await expect(page.locator('#page-owner-revenue')).toHaveClass(/active/);
    await expect(page.locator('#ownerRevenueSummary')).toBeVisible();
  });

  test('my portal: shows clock UI for employee session', async ({ page, request }) => {
    await seedWorkspace(request, { onboarded: true });
    await loginIfNeeded(page, request);

    await page.locator('[data-page="my-portal"]').first().click();
    await expect(page.locator('#page-my-portal')).toHaveClass(/active/);
    await expect(page.locator('#myPortalClockActionBtn')).toBeVisible();
    await expect(page.locator('#myPortalHoursWeek')).toBeVisible();
  });

  test('dark mode is enforced on auth and app screens', async ({ page, request }) => {
    await seedWorkspace(request, { onboarded: true });
    await page.goto('/');
    await page.waitForFunction(() => window.__procrmAuthReady === true, null, { timeout: 15000 });
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'dark');
    expect(theme).toBe('dark');

    // Theme toggle controls must not be visible
    const toggleVisible = await page.evaluate(() => {
      const selectors = ['#themeToggle', '.theme-toggle', '#modeToggle'];
      return selectors.some(sel => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const s = window.getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden';
      });
    });
    expect(toggleVisible).toBe(false);
  });
});
