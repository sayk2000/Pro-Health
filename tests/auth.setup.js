const { test: setup, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const config = require('../config/env.config');
const { LoginPage } = require('../pages/login.page');
const logger = require('../utils/logger');

const AUTH_DIR = path.join(__dirname, '..', '.auth');
const AUTH_FILE = path.join(AUTH_DIR, 'user.json');

if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

setup('authenticate and save storage state', async ({ page }) => {
  logger.info(`Auth setup: logging in once at ${config.loginUrl}`);

  // Navigate via the root URL: it redirects to /account/login?redirectStr=%2Fapp,
  // which both loads reliably and ensures a successful login lands on /app.
  const loginPage = new LoginPage(page);
  await page.goto(config.baseUrl, { waitUntil: 'commit', timeout: 60_000 });
  await loginPage.dismissCookieBanner();
  await loginPage.waitForElement(loginPage.emailInput, { timeout: 45_000 });
  await loginPage.login(config.credentials.email, config.credentials.password);

  // Successful login lands on the ProHealth app home (/app).
  await expect(page).toHaveURL(/\/app(\/|\?|$)/, { timeout: 30_000 });

  await page.context().storageState({ path: AUTH_FILE });
  logger.info(`Auth setup: storage state saved to ${AUTH_FILE}`);
});
