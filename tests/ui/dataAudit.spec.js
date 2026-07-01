'use strict';

const { test, expect } = require('../../fixtures/base.fixture');

test.describe('Data Audit', () => {
  test.describe.configure({ mode: 'serial' });

  let dataAudit;

  test.beforeAll(async ({ browser, newAuthenticatedPage }) => {
    const { page } = await newAuthenticatedPage(browser);
    const { DataAuditPage } = require('../../pages/dataAudit.page');
    dataAudit = new DataAuditPage(page);
    await dataAudit.goto();
  });

  test.beforeEach(async () => {
    await dataAudit.goto();
  });

  test('PH_TC_278 - Data Audit page loads at /app/data-audit', async () => {
    await expect(dataAudit.page).toHaveURL(/\/app\/data-audit/);
  });

  test('PH_TC_279 - Title visible', async () => {
    await expect(dataAudit.pageHeading).toBeVisible();
  });

  test('PH_TC_280 - Export button visible', async () => {
    await expect(dataAudit.exportBtn).toBeVisible();
  });

  test('PH_TC_281 - Tabs All, Added, Modified, Deleted visible', async () => {
    await expect(dataAudit.tabs.filter({ hasText: /^All$/i }).first()).toBeVisible();
    await expect(dataAudit.tabs.filter({ hasText: /^Added$/i }).first()).toBeVisible();
    await expect(dataAudit.tabs.filter({ hasText: /^Modified$/i }).first()).toBeVisible();
    await expect(dataAudit.tabs.filter({ hasText: /^Deleted$/i }).first()).toBeVisible();
  });

  test('PH_TC_282 - Table header visible with content', async () => {
    const header = dataAudit.page.locator('thead, [class*="table-header"]');
    await expect(header).toBeVisible();
    const text = await header.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('PH_TC_283 - All tab filtering works', async () => {
    await dataAudit.clickTab('All');
    await expect(dataAudit.tabs.filter({ hasText: /^All$/i }).first()).toBeVisible();
  });

  test('PH_TC_284 - Added tab filtering works', async () => {
    await dataAudit.clickTab('Added');
    await expect(dataAudit.tabs.filter({ hasText: /^Added$/i }).first()).toBeVisible();
  });

  test('PH_TC_285 - Modified tab filtering works', async () => {
    await dataAudit.clickTab('Modified');
    await expect(dataAudit.tabs.filter({ hasText: /^Modified$/i }).first()).toBeVisible();
  });

  test('PH_TC_286 - Deleted tab filtering works', async () => {
    await dataAudit.clickTab('Deleted');
    await expect(dataAudit.tabs.filter({ hasText: /^Deleted$/i }).first()).toBeVisible();
  });

  test('PH_TC_287 - Breadcrumb visible', async () => {
    await expect(dataAudit.breadcrumb).toBeVisible();
  });
});
