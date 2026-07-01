'use strict';

const { test, expect } = require('../../fixtures/base.fixture');
const { ComingSoonPage } = require('../../pages/comingSoon.page');
const config = require('../../config/env.config');

test.describe('Regression - GP Surgeries Module', { tag: ['@regression', '@gps'] }, () => {
  test.describe.configure({ mode: 'serial' });

  let gps;

  test.beforeAll(async ({ browser, newAuthenticatedPage }) => {
    const { page } = await newAuthenticatedPage(browser);
    gps = new ComingSoonPage(page);
  });

  test.beforeEach(async () => {
    await gps.goto('/app/gps');
    await gps.dismissCookieBanner();
  });

  test('GP_REG_P_001 - GP Surgeries route is accessible to authenticated users', async () => {
    await expect(gps.page).toHaveURL(/\/app\/gps/);
  });

  test('GP_REG_P_002 - GP Surgeries page shows current under-development state', async () => {
    await expect(gps.comingSoonHeading.first()).toBeVisible();
    await expect(gps.underDevelopmentLabel.first()).toBeVisible();
  });

  test('GP_REG_P_003 - Back to Dashboard returns the user to /app', async () => {
    await expect(gps.backToDashboardButton.first()).toBeVisible();
    await gps.clickBackToDashboard();
    await gps.page.waitForLoadState('domcontentloaded');
    await expect(gps.page).toHaveURL(/\/app(\/|\?|#|$)/);
  });

  test('GP_REG_N_001 - Unauthenticated access to GP Surgeries redirects to login', async ({ browser }) => {
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();

    await page.goto(`${config.baseUrl}/app/gps`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/account\/login|\/login/i, { timeout: 30_000 });

    await context.close();
  });

  test('GP_REG_N_002 - Under-development GP page does not expose live CRUD controls yet', async () => {
    await expect(
      gps.page.locator('button, a').filter({ hasText: /add gp|new gp|create gp|delete gp|deactivate gp/i })
    ).toHaveCount(0);
  });
});
