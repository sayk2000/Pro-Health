'use strict';

const { test, expect } = require('../../fixtures/base.fixture');

const configTabs = [
  { tc: 'PH_TC_236', label: 'Email Server' },
  { tc: 'PH_TC_237', label: 'Password' },
  { tc: 'PH_TC_238', label: 'Login' },
  { tc: 'PH_TC_239', label: 'Session' },
  { tc: 'PH_TC_240', label: 'Registration' },
  { tc: 'PH_TC_241', label: 'AWS S3' },
  { tc: 'PH_TC_242', label: 'Maintenance' },
  { tc: 'PH_TC_243', label: 'Customisation' },
  { tc: 'PH_TC_244', label: 'Allowed IP' },
  { tc: 'PH_TC_245', label: 'Logging' },
];

test.describe('System Configuration', () => {
  test.describe.configure({ mode: 'serial' });

  let sysConfig;

  test.beforeAll(async ({ browser, newAuthenticatedPage }) => {
    const { page } = await newAuthenticatedPage(browser);
    const { SystemConfigPage } = require('../../pages/systemConfig.page');
    sysConfig = new SystemConfigPage(page);
    await sysConfig.goto();
  });

  test.beforeEach(async () => {
    await sysConfig.goto();
  });

  test('PH_TC_232 - System Config page loads at /app/system-config', async () => {
    await expect(sysConfig.page).toHaveURL(/\/app\/system-config/);
  });

  test('PH_TC_233 - Title "System Configuration" visible', async () => {
    await expect(sysConfig.pageHeading).toBeVisible();
  });

  test('PH_TC_234 - "All systems normal" text visible', async () => {
    await expect(sysConfig.page.locator('text=All systems normal')).toBeVisible();
  });

  test('PH_TC_235 - Breadcrumb visible', async () => {
    await expect(sysConfig.breadcrumb).toBeVisible();
  });

  for (const { tc, label } of configTabs) {
    test(`${tc} - "${label}" tab is visible and clickable`, async () => {
      const tab = sysConfig.tabs.filter({ hasText: new RegExp(label, 'i') }).first();
      await expect(tab).toBeVisible();
      await sysConfig.clickTab(label);
      await expect(tab).toBeVisible();
    });
  }

  test('PH_TC_246 - Save button visible after clicking a tab', async () => {
    await sysConfig.clickTab('Email Server');
    await expect(sysConfig.saveBtn).toBeVisible();
  });
});
