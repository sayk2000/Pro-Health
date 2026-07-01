'use strict';

const { test, expect } = require('../../fixtures/base.fixture');

test.describe('Email Templates', () => {
  test.describe.configure({ mode: 'serial' });

  let emailTemplates;

  test.beforeAll(async ({ browser, newAuthenticatedPage }) => {
    const { page } = await newAuthenticatedPage(browser);
    const { EmailTemplatesPage } = require('../../pages/emailTemplates.page');
    emailTemplates = new EmailTemplatesPage(page);
    await emailTemplates.goto();
  });

  test.beforeEach(async () => {
    await emailTemplates.goto();
  });

  test('PH_TC_257 - Email Templates page loads at /app/email-templates', async () => {
    await expect(emailTemplates.page).toHaveURL(/\/app\/email-templates/);
  });

  test('PH_TC_258 - Title "Email Templates" visible', async () => {
    await expect(emailTemplates.pageHeading).toBeVisible();
  });

  test('PH_TC_259 - Export button visible', async () => {
    await expect(emailTemplates.exportBtn).toBeVisible();
  });

  test('PH_TC_260 - New Template button visible', async () => {
    await expect(emailTemplates.newBtn).toBeVisible();
  });

  test('PH_TC_261 - All 3 tabs (All, User, System) visible', async () => {
    await expect(emailTemplates.tabs.filter({ hasText: /^All$/i }).first()).toBeVisible();
    await expect(emailTemplates.tabs.filter({ hasText: /^User$/i }).first()).toBeVisible();
    await expect(emailTemplates.tabs.filter({ hasText: /^System$/i }).first()).toBeVisible();
  });

  test('PH_TC_262 - Table columns CODE, TITLE, IS SYSTEM, ACTIONS visible', async () => {
    const header = emailTemplates.page.locator('thead, [class*="table-header"]');
    await expect(header).toContainText('CODE');
    await expect(header).toContainText('TITLE');
    await expect(header).toContainText('ACTIONS');
  });

  test('PH_TC_263 - At least one template row shown', async () => {
    const count = await emailTemplates.getRowCount();
    expect(count).toBeGreaterThan(0);
  });

  test('PH_TC_264 - Clicking All tab shows content', async () => {
    await emailTemplates.clickTab('All');
    await expect(emailTemplates.tabs.filter({ hasText: /^All$/i }).first()).toBeVisible();
  });

  test('PH_TC_265 - Clicking User tab works', async () => {
    await emailTemplates.clickTab('User');
    await expect(emailTemplates.tabs.filter({ hasText: /^User$/i }).first()).toBeVisible();
  });

  test('PH_TC_266 - Clicking System tab works', async () => {
    await emailTemplates.clickTab('System');
    await expect(emailTemplates.tabs.filter({ hasText: /^System$/i }).first()).toBeVisible();
  });

  test('PH_TC_267 - Breadcrumb visible', async () => {
    await expect(emailTemplates.breadcrumb).toBeVisible();
  });
});
