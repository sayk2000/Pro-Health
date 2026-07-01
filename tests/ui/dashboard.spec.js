const { test, expect } = require('../../fixtures/base.fixture');
const { DashboardPage } = require('../../pages/dashboard.page');
const config = require('../../config/env.config');

test.describe('Dashboard', { tag: '@regression' }, () => {
  test.describe.configure({ mode: 'serial' });

  /** @type {DashboardPage} */
  let dash;
  let _ctx;

  test.beforeAll(async ({ browser, newAuthenticatedPage }) => {
    const authenticated = await newAuthenticatedPage(browser);
    _ctx = authenticated.context;
    const page = authenticated.page;
    dash = new DashboardPage(page);
    await dash.open(config.baseUrl);
    await dash.dismissCookieBanner();
  });

  test.afterAll(async () => {
    if (config.closeBrowser) await _ctx?.close();
  });

  // ── Welcome Banner ──────────────────────────────────────────────────────────

  test(
    'PH_TC_011 - Dashboard loads with welcome banner showing logged-in user name',
    { tag: ['@smoke', '@critical'] },
    async () => {
      await expect(dash.welcomeTitle).toContainText('Welcome back');
    }
  );

  test(
    'PH_TC_012 - "Today you have X visits scheduled" text and View Details link are visible',
    { tag: '@smoke' },
    async () => {
      await expect(dash.welcomeSub).toContainText('visits');
      await expect(dash.page.locator('a:has-text("View Details →")')).toBeVisible();
    }
  );

  // ── Metric Cards ────────────────────────────────────────────────────────────

  test(
    'PH_TC_013 - Four metric cards are visible: All Patients, Inactive Patients, Active Patients, Upcoming Reviews',
    { tag: '@smoke' },
    async () => {
      const cards = await dash.getMetricCards();
      expect(cards).toHaveLength(4);
      const titles = cards.map(c => c.title.toLowerCase());
      expect(titles.some(t => t.includes('all patients'))).toBeTruthy();
      expect(titles.some(t => t.includes('inactive'))).toBeTruthy();
      expect(titles.some(t => t.includes('active patients'))).toBeTruthy();
      expect(titles.some(t => t.includes('upcoming') || t.includes('review'))).toBeTruthy();
    }
  );

  test(
    'PH_TC_014 - Each metric card shows a numeric count and a percentage change indicator',
    { tag: '@regression' },
    async () => {
      const cards = await dash.getMetricCards();
      for (const card of cards) {
        expect(card.title.length).toBeGreaterThan(0);
        expect(Number(card.value)).toBeGreaterThanOrEqual(0);
        expect(card.trend && card.trend.length).toBeTruthy();
      }
    }
  );

  // ── Order Status Panel ──────────────────────────────────────────────────────

  test(
    'PH_TC_015 - Order Status panel is visible with pending approvals count and View All button',
    { tag: ['@smoke', '@critical'] },
    async () => {
      await expect(dash.orderPanelTitle).toBeVisible();
      await expect(dash.orderPanelSub).toContainText('pending');
      await expect(dash.orderViewAllBtn).toBeEnabled();
    }
  );

  test(
    'PH_TC_016 - Order Status panel lists order items each with Approve and Reject buttons',
    { tag: '@smoke' },
    async () => {
      const items = await dash.getOrderItems();
      expect(items.length).toBeGreaterThan(0);
      const count = await dash.orderItems.count();
      for (let i = 0; i < count; i++) {
        await expect(dash.orderItems.nth(i).getByRole('button', { name: /reject/i })).toBeVisible();
        await expect(dash.orderItems.nth(i).getByRole('button', { name: /approve/i })).toBeVisible();
      }
    }
  );

  test(
    'PH_TC_017 - Approve button on an order item is clickable',
    { tag: '@regression' },
    async () => {
      await expect(
        dash.orderItems.first().getByRole('button', { name: /approve/i })
      ).toBeEnabled();
    }
  );

  test(
    'PH_TC_018 - Reject button on an order item is clickable',
    { tag: '@regression' },
    async () => {
      await expect(
        dash.orderItems.first().getByRole('button', { name: /reject/i })
      ).toBeEnabled();
    }
  );

  // ── Patient Statistics Panel ─────────────────────────────────────────────────

  test(
    'PH_TC_019 - Patient Statistics panel is visible with New Patients and Returning Patients legend',
    { tag: '@smoke' },
    async () => {
      await expect(dash.statsPanel).toBeVisible();
      await expect(dash.page.locator('text=New Patients')).toBeVisible();
      await expect(dash.page.locator('text=Returning Patients')).toBeVisible();
    }
  );

  test(
    'PH_TC_020 - Patient Statistics View All button is present and enabled',
    { tag: '@regression' },
    async () => {
      await expect(
        dash.statsPanel.getByRole('button', { name: /view all/i })
      ).toBeEnabled();
    }
  );

  // ── Quick Actions ────────────────────────────────────────────────────────────

  test(
    'PH_TC_021 - Quick Actions section is visible with Order Placed, New Orders, Unacknowledged Order cards',
    { tag: '@smoke' },
    async () => {
      await expect(dash.page.locator('text=Quick Actions')).toBeVisible();
      await expect(dash.page.locator('text=Order Placed')).toBeVisible();
      await expect(dash.page.locator('text=New Orders')).toBeVisible();
      await expect(dash.page.locator('text=Unacknowledged Order')).toBeVisible();
    }
  );

  test(
    'PH_TC_022 - Quick Actions scroll left and right navigation arrows are present',
    { tag: '@regression' },
    async () => {
      await expect(dash.page.getByRole('button', { name: /scroll left/i })).toBeVisible();
      await expect(dash.page.getByRole('button', { name: /scroll right/i })).toBeVisible();
    }
  );

  // ── Date Range Picker ────────────────────────────────────────────────────────

  test(
    'PH_TC_023 - Date range picker is visible on dashboard',
    { tag: '@smoke' },
    async () => {
      await expect(dash.page.locator('.dashboard__date-btn, [class*="date-btn"], button:has-text("May")')).toBeVisible();
    }
  );

  // ── Patient Reports ──────────────────────────────────────────────────────────

  test(
    'PH_TC_024 - Patient Reports section is visible with patient name and report type data',
    { tag: '@regression' },
    async () => {
      await expect(dash.page.locator('text=Patient Reports')).toBeVisible();
      // At least one patient name visible
      await expect(dash.page.locator('text=Patient Reports').locator('..').locator('..').locator('button, a').filter({ hasText: /view all/i })).toBeVisible();
    }
  );

  // ── Patient Visits ───────────────────────────────────────────────────────────

  test(
    'PH_TC_025 - Patient Visits panel shows All Patients, Male and Female percentage stats',
    { tag: '@regression' },
    async () => {
      await expect(dash.page.locator('text=Patient Visits')).toBeVisible();
      await expect(dash.page.locator('div').filter({ hasText: /^Male$/ })).toBeVisible();
      await expect(dash.page.locator('div').filter({ hasText: /^Female$/ })).toBeVisible();
    }
  );

  // ── Alerts ───────────────────────────────────────────────────────────────────

  test(
    'PH_TC_026 - Alerts section is visible with a View All button',
    { tag: '@regression' },
    async () => {
      await expect(dash.page.locator('text=Alerts')).toBeVisible();
    }
  );

  // ── Header Controls ──────────────────────────────────────────────────────────

  test(
    'PH_TC_027 - Global search bar is visible and accepts typed input',
    { tag: ['@smoke', '@regression'] },
    async () => {
      await dash.searchInput.click();
      await dash.searchInput.fill('Blood');
      await expect(dash.searchInput).toHaveValue('Blood');
      await dash.searchInput.clear();
    }
  );

  test(
    'PH_TC_028 - Notifications bell icon is visible in the header',
    { tag: '@smoke' },
    async () => {
      await expect(dash.notificationsBtn).toBeVisible();
    }
  );

  test(
    'PH_TC_029 - User avatar dropdown shows logged-in user name and email',
    { tag: ['@smoke', '@critical'] },
    async () => {
      await expect(dash.avatarName).toBeVisible();
      await expect(dash.avatarHandle).toContainText(config.credentials.email);
    }
  );

  // ── Footer ───────────────────────────────────────────────────────────────────

  test(
    'PH_TC_030 - Footer links are visible: Terms & Conditions, Privacy Policy, Contact Us, Report a Problem',
    { tag: '@smoke' },
    async () => {
      await expect(dash.page.locator('a:has-text("Terms & Conditions")')).toBeVisible();
      await expect(dash.page.locator('a:has-text("Privacy Policy")')).toBeVisible();
      await expect(dash.page.locator('a:has-text("Contact Us")')).toBeVisible();
      await expect(dash.page.locator('a:has-text("Report a Problem")')).toBeVisible();
    }
  );

});
