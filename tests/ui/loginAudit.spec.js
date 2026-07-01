'use strict';

const { test, expect } = require('../../fixtures/base.fixture');

test.describe('Login Audit', () => {
  test.describe.configure({ mode: 'serial' });

  let loginAudit;

  test.beforeAll(async ({ browser, newAuthenticatedPage }) => {
    const { page } = await newAuthenticatedPage(browser);
    const { LoginAuditPage } = require('../../pages/loginAudit.page');
    loginAudit = new LoginAuditPage(page);
    await loginAudit.goto();
  });

  test.beforeEach(async () => {
    await loginAudit.goto();
  });

  test('PH_TC_268 - Login Audit page loads at /app/login-audit', async () => {
    await expect(loginAudit.page).toHaveURL(/\/app\/login-audit/);
  });

  test('PH_TC_269 - Title "Login Audit" visible', async () => {
    await expect(loginAudit.pageHeading).toBeVisible();
  });

  test('PH_TC_270 - Export button visible', async () => {
    await expect(loginAudit.exportBtn).toBeVisible();
  });

  test('PH_TC_271 - Table columns (IP, DATETIME, EMAIL, BROWSER, RESULT, FINGER PRINT) visible', async () => {
    const header = loginAudit.page.locator('thead, [class*="table-header"]');
    await expect(header).toContainText('IP');
    await expect(header).toContainText('DATETIME');
    await expect(header).toContainText('EMAIL');
    await expect(header).toContainText('BROWSER');
    await expect(header).toContainText('RESULT');
    await expect(header).toContainText('FINGER PRINT');
  });

  test('PH_TC_272 - Table has at least one record', async () => {
    const count = await loginAudit.getRowCount();
    expect(count).toBeGreaterThan(0);
  });

  test('PH_TC_273 - At least one "Logged in with Password" result visible', async () => {
    await expect(
      loginAudit.page.locator('td, [class*="p-datatable-tbody"] td').filter({ hasText: /logged in with password/i }).first()
    ).toBeVisible();
  });

  test('PH_TC_274 - At least one "wrong password" result visible', async () => {
    await expect(
      loginAudit.page.locator('td, [class*="p-datatable-tbody"] td').filter({ hasText: /wrong password/i }).first()
    ).toBeVisible();
  });

  test("PH_TC_275 - At least one \"doesn't exist\" result visible", async () => {
    await expect(
      loginAudit.page.locator('td, [class*="p-datatable-tbody"] td').filter({ hasText: /doesn.t exist|does not exist|not found/i }).first()
    ).toBeVisible();
  });

  test('PH_TC_276 - Breadcrumb contains "Security Admin" and "Login Audit"', async () => {
    await expect(loginAudit.breadcrumb).toContainText('Security Admin');
    await expect(loginAudit.breadcrumb).toContainText('Login Audit');
  });

  test('PH_TC_277 - Records show data in rows', async () => {
    const firstRow = loginAudit.tableRows.first();
    await expect(firstRow).toBeVisible();
    const text = await firstRow.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });
});
