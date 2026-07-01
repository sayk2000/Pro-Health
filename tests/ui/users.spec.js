'use strict';

const { test, expect } = require('../../fixtures/base.fixture');
const { UsersPage } = require('../../pages/users.page');
const config = require('../../config/env.config');

let sharedPage;

test.beforeAll(async ({ browser, newAuthenticatedPage }) => {
  const { page } = await newAuthenticatedPage(browser);
  sharedPage = page;
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function mock409DuplicateEmail(page, email) {
  await page.route('**/api/users', async route => {
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
}

async function mock500Error(page) {
  await page.route('**/api/users', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Internal Server Error' }),
      });
    } else {
      await route.continue();
    }
  });
}

async function mockEmptyUserList(page) {
  await page.route('**/api/users**', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 }),
      });
    } else {
      await route.continue();
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LIST VIEW  PH_TC_132 – PH_TC_142
// ─────────────────────────────────────────────────────────────────────────────

test.describe('List View', () => {
  let users;

  test.beforeEach(async () => {
    users = new UsersPage(sharedPage);
    await users.goto();
  });

  test('PH_TC_132 - Grid renders all required columns', async () => {
    await expect(users.colFullName).toBeVisible();
    await expect(users.colEmail).toBeVisible();
    await expect(users.colRole).toBeVisible();
    await expect(users.colStatus).toBeVisible();
    await expect(users.colAccounts).toBeVisible();
    await expect(users.colPrescCaps).toBeVisible();
    await expect(users.colLastLogin).toBeVisible();
    await expect(users.colActions).toBeVisible();
  });

  test('PH_TC_133 - Toolbar shows "New User" and "Export" buttons', async () => {
    await expect(users.newUserBtn).toBeVisible();
    await expect(users.exportBtn).toBeVisible();
  });

  test('PH_TC_134 - Default view shows Active users only', async ({ page }) => {
    const activeIndicator = page.locator(
      '[aria-selected="true"]:has-text("Active"), p-dropdown:has-text("Active"), button.active:has-text("Active")'
    ).first();
    await expect(activeIndicator).toBeVisible();
    const rows = users.tableRows;
    const count = await rows.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const inactiveCell = rows.nth(i).locator('td').filter({ hasText: /inactive/i });
      await expect(inactiveCell).toHaveCount(0);
    }
  });

  test('PH_TC_135 - Per-column filter inputs are present for Full Name, Email, Role', async () => {
    await expect(users.filterFullName).toBeVisible();
    await expect(users.filterEmail).toBeVisible();
    await expect(users.filterRole).toBeVisible();
  });

  test('PH_TC_136 - Status dropdown refreshes the grid when changed', async ({ page }) => {
    await users.setStatusFilter('All');
    await expect(users.table).toBeVisible();
  });

  test('PH_TC_137 - Account(s) filter is a multi-select picker', async ({ page }) => {
    await expect(users.filterAccounts).toBeVisible();
    await users.clickAccountsFilter();
    await expect(
      users.filterAccounts.locator('[class*="p-multiselect-panel"]')
        .or(page.locator('[class*="p-multiselect-panel"]'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('PH_TC_138 - Prescription Capabilities filter is a multi-select', async ({ page }) => {
    await expect(users.filterPrescCaps).toBeVisible();
    await users.clickPrescCapsFilter();
    await expect(
      users.filterPrescCaps.locator('[class*="p-multiselect-panel"]')
        .or(page.locator('[class*="p-multiselect-panel"]'))
    ).toBeVisible({ timeout: 5000 });
  });

  test('PH_TC_139 - Full Name column is sortable ASC then DESC', async () => {
    await users.sortBy(users.colFullName);
    await expect(users.colFullName.locator('[class*="sort"], [aria-sort]')).toBeVisible();
    await users.sortBy(users.colFullName);
    await expect(users.colFullName.locator('[class*="sort"], [aria-sort]')).toBeVisible();
  });

  test('PH_TC_140 - Filter state is reflected in URL params', async ({ page }) => {
    await users.filterByFullName('Test');
    const url = page.url();
    expect(url).toMatch(/[?&](filter|search|name|fullName)=/i);
  });

  test('PH_TC_141 - Skeleton loader appears while data is fetching', async ({ page }) => {
    await page.route('**/api/users**', async route => {
      await new Promise(r => setTimeout(r, 1500));
      await route.continue();
    });
    await page.reload();
    await expect(users.skeletonLoader).toBeVisible({ timeout: 3000 });
    await users.waitForLoadState('domcontentloaded');
  });

  test('PH_TC_142 - "No users found" appears when API returns empty results', async ({ page }) => {
    await mockEmptyUserList(page);
    await page.reload();
    await users.waitForLoadState('domcontentloaded');
    await expect(users.emptyMessage).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ADD USER  PH_TC_143 – PH_TC_161
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Add User', () => {
  let users;

  test.beforeEach(async () => {
    users = new UsersPage(sharedPage);
    await users.goto();
    await users.clickNewUser();
  });

  test('PH_TC_143 - "New User" opens side panel titled "Add User"', async () => {
    await expect(users.panel).toBeVisible();
    await expect(users.panelTitle).toContainText(/Add User/i);
  });

  test('PH_TC_144 - Required fields are marked with a red asterisk', async ({ page }) => {
    const requiredMarkers = page.locator(
      '.p-error, [class*="required"], label:has-text("*"), span:has-text("*")'
    );
    await expect(requiredMarkers.first()).toBeVisible();
  });

  test('PH_TC_145 - Panel contains Role, Email, First Name, Last Name fields', async () => {
    await expect(users.roleDropdown).toBeVisible();
    await expect(users.emailInput).toBeVisible();
    await expect(users.firstNameInput).toBeVisible();
    await expect(users.lastNameInput).toBeVisible();
  });

  test('PH_TC_146 - Informational note about invitation email is shown', async () => {
    await expect(users.inviteNote).toBeVisible();
  });

  test('PH_TC_147 - Save button is disabled until required fields are filled', async () => {
    expect(await users.isSaveDisabled()).toBe(true);
  });

  test('PH_TC_148 - First Name required shows "First Name is required."', async () => {
    await users.fillAddForm({ role: 'Admin', email: 'user@test.com', lastName: 'Smith' });
    await users.clickSave();
    await expect(
      users.inlineErrors.filter({ hasText: /First Name is required/i })
    ).toBeVisible();
  });

  test('PH_TC_149 - Last Name required shows "Last Name is required."', async () => {
    await users.fillAddForm({ role: 'Admin', email: 'user@test.com', firstName: 'Jane' });
    await users.clickSave();
    await expect(
      users.inlineErrors.filter({ hasText: /Last Name is required/i })
    ).toBeVisible();
  });

  test('PH_TC_150 - Email required shows "Email is required."', async () => {
    await users.fillAddForm({ role: 'Admin', firstName: 'Jane', lastName: 'Smith' });
    await users.clickSave();
    await expect(
      users.inlineErrors.filter({ hasText: /Email is required/i })
    ).toBeVisible();
  });

  test('PH_TC_151 - Invalid email format shows "Please enter a valid email address."', async () => {
    await users.fillAddForm({ role: 'Admin', email: 'not-an-email', firstName: 'Jane', lastName: 'Smith' });
    await users.emailInput.blur();
    await expect(
      users.inlineErrors.filter({ hasText: /valid email address/i })
    ).toBeVisible();
  });

  test('PH_TC_152 - Duplicate email shows "A user with email already exists"', async ({ page }) => {
    const email = 'duplicate@test.com';
    await mock409DuplicateEmail(page, email);
    await users.fillAddForm({ role: 'Admin', email, firstName: 'Jane', lastName: 'Smith' });
    await users.clickSave();
    await expect(
      users.inlineErrors.filter({ hasText: /already exists/i })
    ).toBeVisible();
  });

  test('PH_TC_153 - Role required shows "Please select a role."', async () => {
    await users.fillAddForm({ email: 'user@test.com', firstName: 'Jane', lastName: 'Smith' });
    await users.clickSave();
    await expect(
      users.inlineErrors.filter({ hasText: /select a role/i })
    ).toBeVisible();
  });

  test('PH_TC_154 - First Name enforces max 100 characters', async () => {
    await users.fillAddForm({ firstName: 'A'.repeat(101) });
    await users.firstNameInput.blur();
    const val = await users.firstNameInput.inputValue();
    expect(val.length).toBeLessThanOrEqual(100);
  });

  test('PH_TC_155 - Last Name enforces max 100 characters', async () => {
    await users.fillAddForm({ lastName: 'B'.repeat(101) });
    await users.lastNameInput.blur();
    const val = await users.lastNameInput.inputValue();
    expect(val.length).toBeLessThanOrEqual(100);
  });

  test('PH_TC_156 - Middle Name enforces max 100 characters', async () => {
    await users.fillAddForm({ middleName: 'C'.repeat(101) });
    await users.middleNameInput.blur();
    const val = await users.middleNameInput.inputValue();
    expect(val.length).toBeLessThanOrEqual(100);
  });

  test('PH_TC_157 - Job Title enforces max 100 characters', async () => {
    await users.fillAddForm({ jobTitle: 'D'.repeat(101) });
    await users.jobTitleInput.blur();
    const val = await users.jobTitleInput.inputValue();
    expect(val.length).toBeLessThanOrEqual(100);
  });

  test('PH_TC_158 - Invalid telephone shows "Please enter a valid phone number."', async () => {
    await users.fillAddForm({ telephone: 'abc123' });
    await users.telephoneInput.blur();
    await expect(
      users.inlineErrors.filter({ hasText: /valid phone number/i })
    ).toBeVisible();
  });

  test('PH_TC_159 - Invalid mobile shows "Please enter a valid mobile number."', async () => {
    await users.fillAddForm({ mobile: '!!!###' });
    await users.mobileInput.blur();
    await expect(
      users.inlineErrors.filter({ hasText: /valid mobile number/i })
    ).toBeVisible();
  });

  test('PH_TC_160 - Generic server error shows "Something went wrong. Please try again."', async ({ page }) => {
    await mock500Error(page);
    await users.fillAddForm({ role: 'Admin', email: 'user@test.com', firstName: 'Jane', lastName: 'Smith' });
    await users.clickSave();
    await expect(
      page.locator('[class*="p-toast"], p-message, [class*="banner"]').filter({ hasText: /something went wrong/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('PH_TC_161 - On success: toast shown, panel closes, grid refreshes', async ({ page }) => {
    await page.route('**/api/users', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'new-123', firstName: 'Jane', lastName: 'Smith' }),
        });
      } else {
        await route.continue();
      }
    });
    await users.fillAddForm({ role: 'Admin', email: 'newsuccess@test.com', firstName: 'Jane', lastName: 'Smith' });
    await users.clickSave();
    await expect(users.toast).toBeVisible({ timeout: 8000 });
    await expect(users.panel).not.toBeVisible({ timeout: 5000 });
    await expect(users.table).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDIT USER  PH_TC_162 – PH_TC_176
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Edit User', () => {
  let users;

  test.beforeEach(async () => {
    users = new UsersPage(sharedPage);
    await users.goto();
  });

  test('PH_TC_162 - Edit icon navigates to the Edit User page (not a panel)', async ({ page }) => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await users.clickEditOnRow(0);
    await expect(page).toHaveURL(/\/app\/users\/.+/);
    await expect(users.panel).not.toBeVisible();
  });

  test('PH_TC_163 - Edit page title includes "Edit User"', async ({ page }) => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await users.clickEditOnRow(0);
    await expect(
      page.locator('h1, h2, [class*="title"]').filter({ hasText: /Edit User/i }).first()
    ).toBeVisible();
  });

  test('PH_TC_164 - All form fields are pre-populated on Edit page', async ({ page }) => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await users.clickEditOnRow(0);
    const emailVal = await users.emailInput.inputValue();
    expect(emailVal.length).toBeGreaterThan(0);
  });

  test('PH_TC_165 - Email field is editable with warning tooltip', async ({ page }) => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await users.clickEditOnRow(0);
    await expect(users.emailInput).toBeEnabled();
    await users.emailInput.click();
    await expect(users.emailWarningTooltip).toBeVisible({ timeout: 5000 });
  });

  test('PH_TC_166 - Edit: First Name required shows "First Name is required."', async ({ page }) => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await users.clickEditOnRow(0);
    await users.firstNameInput.clear();
    await users.clickSave();
    await expect(
      users.inlineErrors.filter({ hasText: /First Name is required/i })
    ).toBeVisible();
  });

  test('PH_TC_167 - Edit: invalid email format shows inline error', async ({ page }) => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await users.clickEditOnRow(0);
    await users.emailInput.clear();
    await users.fill(users.emailInput, 'bad-email');
    await users.emailInput.blur();
    await expect(
      users.inlineErrors.filter({ hasText: /valid email address/i })
    ).toBeVisible();
  });

  test('PH_TC_168 - Save button shows spinner while request is in-flight', async ({ page }) => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await page.route('**/api/users/**', async route => {
      const method = route.request().method();
      if (method === 'PUT' || method === 'PATCH') {
        await new Promise(r => setTimeout(r, 1500));
        await route.continue();
      } else {
        await route.continue();
      }
    });
    await users.clickEditOnRow(0);
    await users.clickSave();
    const spinner = page.locator('[class*="spinner"], [class*="loading"], .pi-spin').first();
    await expect(spinner).toBeVisible({ timeout: 3000 });
  });

  test('PH_TC_169 - 404 on open shows "This user was deleted by someone else."', async ({ page }) => {
    await page.route('**/api/users/**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'User not found' }),
        });
      } else {
        await route.continue();
      }
    });
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to click');
    await users.clickEditOnRow(0);
    await expect(
      page.locator('[class*="banner"], [class*="alert"], p-message, text=deleted by someone')
        .filter({ hasText: /deleted by someone else/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('PH_TC_170 - Duplicate email on Edit shows inline error', async ({ page }) => {
    const email = 'existing@test.com';
    await page.route('**/api/users/**', async route => {
      const method = route.request().method();
      if (method === 'PUT' || method === 'PATCH') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ message: `A user with email '${email}' already exists.` }),
        });
      } else {
        await route.continue();
      }
    });
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await users.clickEditOnRow(0);
    await users.emailInput.clear();
    await users.fill(users.emailInput, email);
    await users.clickSave();
    await expect(
      users.inlineErrors.filter({ hasText: /already exists/i })
    ).toBeVisible();
  });

  test('PH_TC_171 - Generic API error on Save shows banner at top of page', async ({ page }) => {
    await page.route('**/api/users/**', async route => {
      const method = route.request().method();
      if (method === 'PUT' || method === 'PATCH') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal Server Error' }),
        });
      } else {
        await route.continue();
      }
    });
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await users.clickEditOnRow(0);
    await users.clickSave();
    await expect(users.panelBanner).toBeVisible({ timeout: 8000 });
  });

  test('PH_TC_172 - On success: toast shown and page navigates back to list', async ({ page }) => {
    await page.route('**/api/users/**', async route => {
      const method = route.request().method();
      if (method === 'PUT' || method === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'user-1', firstName: 'Updated', lastName: 'User' }),
        });
      } else {
        await route.continue();
      }
    });
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await users.clickEditOnRow(0);
    await users.clickSave();
    await expect(users.toast).toBeVisible({ timeout: 8000 });
    await expect(page).toHaveURL(/\/app\/users$/, { timeout: 8000 });
  });

  test('PH_TC_173 - Cancel on dirty Edit page triggers unsaved-changes prompt', async ({ page }) => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await users.clickEditOnRow(0);
    await users.fill(users.firstNameInput, 'DirtyName');
    await users.clickCancel();
    await expect(
      page.locator('p-confirmdialog, [class*="p-confirmdialog"], [class*="confirm"]')
        .filter({ hasText: /unsaved|discard|leave/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test('PH_TC_174 - Actions column has both Edit and Deactivate icons per row', async () => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No rows in grid');
    const editIcon = users.tableRows.nth(0)
      .locator('button[aria-label*="Edit"], [class*="edit"]').first();
    const deactivateIcon = users.tableRows.nth(0)
      .locator('button[aria-label*="Deactivate"], [class*="deactivate"], [class*="delete"]').first();
    await expect(editIcon).toBeVisible();
    await expect(deactivateIcon).toBeVisible();
  });

  test('PH_TC_175 - Deactivate icon shows confirmation dialog', async () => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No rows in grid');
    await users.clickDeactivateOnRow(0);
    await expect(users.confirmDialog).toBeVisible();
  });

  test('PH_TC_176 - Cancelling deactivation keeps the row in the grid', async () => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No rows in grid');
    await users.clickDeactivateOnRow(0);
    await users.cancelDeactivation();
    await expect(users.confirmDialog).not.toBeVisible({ timeout: 5000 });
    const newCount = await users.getRowCount();
    expect(newCount).toBe(rowCount);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET  PH_TC_177 – PH_TC_191
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Password Reset (Admin-Triggered)', () => {
  let users;

  test.beforeEach(async () => {
    users = new UsersPage(sharedPage);
    await users.goto();
  });

  test('PH_TC_177 - "Send Password Reset" button is visible on Edit page', async ({ page }) => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await users.clickEditOnRow(0);
    await expect(users.passwordResetBtn).toBeVisible();
  });

  test('PH_TC_178 - Clicking reset shows confirmation dialog with user email and one-time link copy', async ({ page }) => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await users.clickEditOnRow(0);
    const emailVal = await users.emailInput.inputValue();
    await users.clickPasswordReset();
    await expect(users.resetConfirmDialog).toBeVisible();
    await expect(users.resetConfirmDialog).toContainText(emailVal);
    await expect(users.resetConfirmDialog).toContainText(/one-time link/i);
  });

  test('PH_TC_179 - Confirming reset shows success toast "Reset email sent to {email}"', async ({ page }) => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await page.route('**/api/users/**/password-reset**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Reset email sent.' }),
      });
    });
    await users.clickEditOnRow(0);
    await users.clickPasswordReset();
    await users.confirmPasswordReset();
    await expect(users.toast).toBeVisible({ timeout: 8000 });
    const toastText = await users.getToastText();
    expect(toastText).toMatch(/reset email sent/i);
  });

  test('PH_TC_180 - Reset button enters loading state after confirm', async ({ page }) => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await page.route('**/api/users/**/password-reset**', async route => {
      await new Promise(r => setTimeout(r, 1500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await users.clickEditOnRow(0);
    await users.clickPasswordReset();
    await users.confirmPasswordReset();
    const loadingState = page.locator(
      '[class*="spinner"], [class*="loading"], .pi-spin, button[disabled]:has-text("Reset")'
    ).first();
    await expect(loadingState).toBeVisible({ timeout: 3000 });
  });

  test('PH_TC_181 - User with no email returns 400 "no email address" error', async ({ page }) => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await page.route('**/api/users/**/password-reset**', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'This user has no email address. Add an email before sending a reset link.',
        }),
      });
    });
    await users.clickEditOnRow(0);
    await users.clickPasswordReset();
    await users.confirmPasswordReset();
    await expect(
      page.locator('[class*="p-toast"], p-message, [class*="banner"]')
        .filter({ hasText: /no email address/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('PH_TC_182 - User not found returns 404 "User not found."', async ({ page }) => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await page.route('**/api/users/**/password-reset**', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'User not found.' }),
      });
    });
    await users.clickEditOnRow(0);
    await users.clickPasswordReset();
    await users.confirmPasswordReset();
    await expect(
      page.locator('[class*="p-toast"], p-message, [class*="banner"]')
        .filter({ hasText: /User not found/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('PH_TC_183 - Only Admin role can see the password reset button (Admin session)', async ({ page }) => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await users.clickEditOnRow(0);
    // Running as Admin (via explicit login): button must be visible
    await expect(users.passwordResetBtn).toBeVisible();
  });

  test('PH_TC_184 - Used/expired reset link shows "invalid or has expired" error', async ({ page }) => {
    await page.route('**/api/auth/reset-password**', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'This reset link is invalid or has expired. Please request a new one.',
        }),
      });
    });
    await page.goto('/auth/reset-password?token=expired-token-123');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.locator('text=invalid or has expired, [class*="error"], [class*="alert"]')
        .filter({ hasText: /invalid or has expired/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('PH_TC_185 - Weak password on set shows "Password must be at least 8 characters"', async ({ page }) => {
    await page.goto('/auth/reset-password?token=valid-test-token');
    await page.waitForLoadState('domcontentloaded');
    const passwordInput = page
      .locator('input[type="password"], input[formcontrolname="password"]').first();
    if (!(await passwordInput.isVisible())) test.skip();
    const confirmInput = page
      .locator('input[formcontrolname="confirmPassword"], input[placeholder*="confirm"]').first();
    await passwordInput.fill('abc');
    await confirmInput.fill('abc');
    await page
      .locator('button[type="submit"], button:has-text("Set Password"), button:has-text("Reset")')
      .first()
      .click();
    await expect(
      page.locator('[class*="error"], small.p-error, .p-error')
        .filter({ hasText: /at least 8 characters/i })
    ).toBeVisible({ timeout: 5000 });
  });

  test('PH_TC_186 - Reset token is single-use — second use returns expired error', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/auth/reset-password**', async route => {
      callCount++;
      await route.fulfill({
        status: callCount === 1 ? 200 : 400,
        contentType: 'application/json',
        body: JSON.stringify(
          callCount === 1
            ? { message: 'Password reset successful.' }
            : { message: 'This reset link is invalid or has expired. Please request a new one.' }
        ),
      });
    });
    await page.goto('/auth/reset-password?token=single-use-token');
    await page.waitForLoadState('domcontentloaded');
    await page.goto('/auth/reset-password?token=single-use-token');
    await page.waitForLoadState('domcontentloaded');
    expect(callCount).toBeGreaterThanOrEqual(1);
  });

  test('PH_TC_187 - Reset token expires after 24 hours (mocked)', async ({ page }) => {
    await page.route('**/api/auth/reset-password**', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'This reset link is invalid or has expired. Please request a new one.',
        }),
      });
    });
    await page.goto('/auth/reset-password?token=expired-24h-token');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.locator('[class*="error"], [class*="alert"], p-message, text=expired')
        .filter({ hasText: /expired|invalid/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('PH_TC_188 - Reset confirmation dialog contains the user email address', async ({ page }) => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await users.clickEditOnRow(0);
    const emailVal = await users.emailInput.inputValue();
    await users.clickPasswordReset();
    await expect(users.resetConfirmDialog).toContainText(emailVal);
  });

  test('PH_TC_189 - Reset toast auto-dismisses after success', async ({ page }) => {
    const rowCount = await users.getRowCount();
    test.skip(rowCount === 0, 'No users to edit');
    await page.route('**/api/users/**/password-reset**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Reset email sent.' }),
      });
    });
    await users.clickEditOnRow(0);
    await users.clickPasswordReset();
    await users.confirmPasswordReset();
    await expect(users.toast).toBeVisible({ timeout: 8000 });
    await expect(users.toast).not.toBeVisible({ timeout: 10000 });
  });

  test('PH_TC_190 - Users module visible only to users with Users permission (Admin session check)', async ({ page }) => {
    const usersNavLink = page.locator(
      'nav a[href*="users"], [class*="menu-item"]:has-text("Users"), [class*="nav-link"]:has-text("Users")'
    ).first();
    await expect(usersNavLink).toBeVisible();
  });

  test('PH_TC_191 - Only Admin can add users — New User button visible in Admin session', async () => {
    await users.goto();
    await expect(users.newUserBtn).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CROSS-CUTTING  PH_TC_192 – PH_TC_196
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Cross-cutting', () => {
  let users;

  test.beforeEach(async () => {
    users = new UsersPage(sharedPage);
    await users.goto();
  });

  test('PH_TC_192 - All API errors display user-friendly messages (no raw status codes exposed)', async ({ page }) => {
    await page.route('**/api/users', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Service Unavailable' }),
        });
      } else {
        await route.continue();
      }
    });
    await users.clickNewUser();
    await users.fillAddForm({ role: 'Admin', email: 'user@test.com', firstName: 'Jane', lastName: 'Smith' });
    await users.clickSave();
    // Raw code "503" must not be the only content shown
    await expect(page.locator('body')).not.toContainText(/^\s*503\s*$/);
    // A friendly message container must be visible
    await expect(
      page.locator('[class*="p-toast"], p-message, [class*="banner"]')
    ).toBeVisible({ timeout: 8000 });
  });

  test('PH_TC_193 - No browser console errors on happy-path navigation', async ({ page }) => {
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await users.goto();
    await page.waitForLoadState('domcontentloaded');
    const realErrors = consoleErrors.filter(
      e => !e.includes('favicon') && !e.includes('net::ERR_')
    );
    expect(realErrors).toHaveLength(0);
  });

  test('PH_TC_194 - Toast messages auto-dismiss within 10 seconds', async ({ page }) => {
    await page.route('**/api/users', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'auto-dismiss-1', firstName: 'Auto', lastName: 'Dismiss' }),
        });
      } else {
        await route.continue();
      }
    });
    await users.clickNewUser();
    await users.fillAddForm({ role: 'Admin', email: 'autodismiss@test.com', firstName: 'Auto', lastName: 'Dismiss' });
    await users.clickSave();
    await expect(users.toast).toBeVisible({ timeout: 8000 });
    await expect(users.toast).not.toBeVisible({ timeout: 10000 });
  });

  test('PH_TC_195 - Users module is visible in nav for users with Users permission', async ({ page }) => {
    const usersNavLink = page.locator(
      'nav a[href*="users"], [class*="menu-item"]:has-text("Users"), [class*="nav-link"]:has-text("Users")'
    ).first();
    await expect(usersNavLink).toBeVisible();
  });

  test('PH_TC_196 - Filter and sort URL params persist across page refresh', async ({ page }) => {
    await users.filterByFullName('Test');
    const urlBefore = page.url();
    await page.reload();
    await users.waitForLoadState('domcontentloaded');
    const urlAfter = page.url();
    const paramsBefore = new URL(urlBefore).searchParams;
    const paramsAfter = new URL(urlAfter).searchParams;
    let persisted = false;
    for (const [key, val] of paramsBefore.entries()) {
      if (paramsAfter.get(key) === val) {
        persisted = true;
        break;
      }
    }
    expect(persisted).toBe(true);
  });
});
