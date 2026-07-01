const { test, expect } = require('../../fixtures/base.fixture');
const config = require('../../config/env.config');

// No saved auth state — each test performs a fresh login
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login → Dashboard', { tag: ['@smoke', '@critical'] }, () => {
  // Use fixtures (loginPage, dashboardPage) scoped per-test — avoids shared
  // mutable state that breaks when tests run in parallel.
  test.beforeEach(async ({ page, loginPage, dashboardPage }) => {
    await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded' });
    await loginPage.dismissCookieBanner();
    await loginPage.login(config.credentials.email, config.credentials.password);
    await page.waitForURL(/\/app(\/|\?|$)/, { timeout: 30_000 });
    await dashboardPage.dismissCookieBanner();
  });

  test('PH_TC_D01 - Redirected to dashboard after successful login', async ({ page }) => {
    await expect(page).toHaveURL(/\/app(\/|\?|$)/);
  });

  test('PH_TC_D02 - Dashboard welcome banner is visible', async ({ dashboardPage }) => {
    await expect(dashboardPage.welcomeTitle).toContainText('Welcome back');
  });

  test('PH_TC_D03 - Four metric cards are present on the dashboard', async ({ dashboardPage }) => {
    await expect(dashboardPage.metricCards).toHaveCount(4);
  });

  test('PH_TC_D04 - Global search bar accepts input', async ({ dashboardPage }) => {
    await dashboardPage.searchInput.fill('Test');
    await expect(dashboardPage.searchInput).toHaveValue('Test');
  });
});
