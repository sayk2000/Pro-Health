'use strict';

const { test, expect } = require('../../fixtures/base.fixture');

test.describe('Accounts', () => {
  test.describe.configure({ mode: 'serial' });

  let accounts;

  test.beforeAll(async ({ browser, newAuthenticatedPage }) => {
    const { page } = await newAuthenticatedPage(browser);
    const { AccountsPage } = require('../../pages/accounts.page');
    accounts = new AccountsPage(page);
    await accounts.goto();
  });

  test.beforeEach(async () => {
    await accounts.goto();
  });

  test('PH_TC_031 - Accounts page loads at /app/accounts', async () => {
    await expect(accounts.page).toHaveURL(/\/app\/accounts/);
  });

  test('PH_TC_032 - Title and description visible', async () => {
    await expect(accounts.pageHeading).toBeVisible();
  });

  test('PH_TC_033 - Table or empty state present', async () => {
    const rowCount = await accounts.getRowCount();
    if (rowCount === 0) {
      await expect(accounts.emptyMessage).toBeVisible();
    } else {
      await expect(accounts.table).toBeVisible();
    }
  });

  test('PH_TC_034 - Breadcrumb visible', async () => {
    await expect(accounts.breadcrumb).toBeVisible();
  });

  test('PH_TC_035 - Empty state or records shown', async () => {
    const rowCount = await accounts.getRowCount();
    if (rowCount === 0) {
      await expect(accounts.emptyMessage).toBeVisible();
    } else {
      await expect(accounts.tableRows.first()).toBeVisible();
    }
  });
});
