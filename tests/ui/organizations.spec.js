'use strict';

const { test, expect } = require('../../fixtures/base.fixture');

test.describe('Organizations', () => {
  test.describe.configure({ mode: 'serial' });

  let orgs;

  test.beforeAll(async ({ browser, newAuthenticatedPage }) => {
    const { page } = await newAuthenticatedPage(browser);
    const { OrganizationsPage } = require('../../pages/organizations.page');
    orgs = new OrganizationsPage(page);
    await orgs.goto();
  });

  test.beforeEach(async () => {
    await orgs.goto();
  });

  test('PH_TC_288 - Organizations page loads at /app/organizations', async () => {
    await expect(orgs.page).toHaveURL(/\/app\/organizations/);
  });

  test('PH_TC_289 - Title "Organizations" visible', async () => {
    await expect(orgs.pageHeading).toBeVisible();
  });

  test('PH_TC_290 - New Organization button visible', async () => {
    await expect(orgs.newBtn).toBeVisible();
  });

  test('PH_TC_291 - Table columns NAME, DESCRIPTION, ACTIONS visible', async () => {
    const header = orgs.page.locator('thead, [class*="table-header"]');
    await expect(header).toContainText('NAME');
    await expect(header).toContainText('DESCRIPTION');
    await expect(header).toContainText('ACTIONS');
  });

  test('PH_TC_292 - Breadcrumb visible', async () => {
    await expect(orgs.breadcrumb).toBeVisible();
  });

  test('PH_TC_293 - Table or empty state present', async () => {
    const rowCount = await orgs.getRowCount();
    if (rowCount === 0) {
      await expect(orgs.emptyMessage).toBeVisible();
    } else {
      await expect(orgs.tableRows.first()).toBeVisible();
    }
  });

  test('PH_TC_294 - New Organization button is clickable', async () => {
    await expect(orgs.newBtn).toBeEnabled();
    await orgs.clickNewOrg();
    await expect(orgs.panel).toBeVisible();
    await orgs.click(orgs.cancelBtn);
  });
});
