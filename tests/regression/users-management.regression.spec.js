'use strict';

const { test, expect } = require('../../fixtures/base.fixture');
const { UsersPage } = require('../../pages/users.page');

const UNIQUE_EMAIL = () => `regression.user.${Date.now()}@example.test`;

test.describe('Regression - Users Management Module', { tag: ['@regression', '@users'] }, () => {
  test.describe.configure({ mode: 'serial' });

  let users;

  test.beforeAll(async ({ browser, newAuthenticatedPage }) => {
    const { page } = await newAuthenticatedPage(browser);
    users = new UsersPage(page);
  });

  test.beforeEach(async () => {
    await users.goto();
  });

  test('USER_REG_P_001 - Users list loads with core controls', async () => {
    await expect(users.page).toHaveURL(/\/app\/users/);
    await expect(users.newUserBtn).toBeVisible();
    await expect(users.exportBtn).toBeVisible();
    await expect(users.tabAll).toBeVisible();
    await expect(users.tabActive).toBeVisible();
    await expect(users.tabPending).toBeVisible();
    await expect(users.tabLocked).toBeVisible();
  });

  test('USER_REG_P_002 - Status tabs and view toggles are usable', async () => {
    await users.clickTab('All');
    await expect(users.table.or(users.emptyMessage)).toBeVisible();
    await users.clickTab('Active');
    await expect(users.table.or(users.emptyMessage)).toBeVisible();

    await users.switchToCardView();
    await expect(users.cardsGrid.or(users.cards.first())).toBeVisible({ timeout: 10_000 });
    await users.switchToListView();
    await expect(users.table).toBeVisible({ timeout: 10_000 });
  });

  test('USER_REG_P_003 - Invite User success shows toast and closes panel', async () => {
    const email = UNIQUE_EMAIL();

    await users.page.route('**/api/users', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'reg-user-id', firstName: 'Regression', lastName: 'User', email }),
        });
      } else {
        await route.continue();
      }
    });

    await users.clickNewUser();
    await users.fillAddForm({
      firstName: 'Regression',
      lastName: 'User',
      email,
      telephone: '02079460000',
      mobile: '07700900000',
    });
    await users.selectRoles(['Admin']).catch(() => {});
    await users.clickSave();

    await expect(users.toast.or(users.panelBanner)).toBeVisible({ timeout: 10_000 });
    await users.page.unroute('**/api/users');
  });

  test('USER_REG_N_001 - Invite User validates required fields', async () => {
    await users.clickNewUser();
    await users.clickSave();

    await expect(users.inlineErrors.first()).toBeVisible({ timeout: 10_000 });
    await users.clickCancel().catch(() => {});
  });

  test('USER_REG_N_002 - Invite User validates invalid email and phone data', async () => {
    await users.clickNewUser();
    await users.fillAddForm({
      firstName: 'Bad',
      lastName: 'Input',
      email: 'not-an-email',
      telephone: 'abc123',
      mobile: '!!!',
    });
    await users.clickSave();

    await expect(users.inlineErrors.first()).toBeVisible({ timeout: 10_000 });
    await users.clickCancel().catch(() => {});
  });

  test('USER_REG_N_003 - Duplicate email surfaces user feedback', async () => {
    const email = 'duplicate.regression@example.test';

    await users.page.route('**/api/users', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ message: `A user with email '${email}' already exists.` }),
        });
      } else {
        await route.continue();
      }
    });

    await users.clickNewUser();
    await users.fillAddForm({ firstName: 'Duplicate', lastName: 'User', email });
    await users.selectRoles(['Admin']).catch(() => {});
    await users.clickSave();

    await expect(users.panelBanner.or(users.inlineErrors.first()).or(users.toast)).toBeVisible({ timeout: 10_000 });
    await users.page.unroute('**/api/users');
    await users.clickCancel().catch(() => {});
  });
});
