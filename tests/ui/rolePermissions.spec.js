'use strict';

const { test, expect } = require('../../fixtures/base.fixture');

test.describe('Role Permissions', () => {
  test.describe.configure({ mode: 'serial' });

  let rolePerm;

  test.beforeAll(async ({ browser, newAuthenticatedPage }) => {
    const { page } = await newAuthenticatedPage(browser);
    const { RolePermissionsPage } = require('../../pages/rolePermissions.page');
    rolePerm = new RolePermissionsPage(page);
    await rolePerm.goto();
  });

  test.beforeEach(async () => {
    await rolePerm.goto();
  });

  test('PH_TC_247 - Role Permissions page loads at /app/role-permissions', async () => {
    await expect(rolePerm.page).toHaveURL(/\/app\/role-permissions/);
  });

  test('PH_TC_248 - Title visible', async () => {
    await expect(rolePerm.pageHeading).toBeVisible();
  });

  test('PH_TC_249 - Description text visible', async () => {
    await expect(
      rolePerm.page.locator('p, span, [class*="description"], [class*="subtitle"]').first()
    ).toBeVisible();
  });

  test('PH_TC_250 - Select Role dropdown visible', async () => {
    await expect(rolePerm.roleDropdown).toBeVisible();
  });

  test('PH_TC_251 - Permission matrix table visible', async () => {
    await expect(rolePerm.permMatrix).toBeVisible();
  });

  test('PH_TC_252 - Permission matrix columns (MODULE, VIEW, CREATE, EDIT, DELETE) visible', async () => {
    const header = rolePerm.page.locator('thead, [class*="table-header"]');
    await expect(header).toContainText('MODULE');
    await expect(header).toContainText('VIEW');
    await expect(header).toContainText('CREATE');
    await expect(header).toContainText('EDIT');
    await expect(header).toContainText('DELETE');
  });

  test('PH_TC_253 - At least one module row visible in permissions table', async () => {
    await expect(
      rolePerm.page.locator('tbody tr, [class*="p-datatable-tbody"] tr').first()
    ).toBeVisible();
  });

  test('PH_TC_254 - Individual permission checkbox is interactive', async () => {
    const checkbox = rolePerm.page.locator(
      'tbody input[type="checkbox"], [class*="p-datatable-tbody"] input[type="checkbox"]'
    ).first();
    await expect(checkbox).toBeVisible();
    const before = await checkbox.isChecked();
    await checkbox.click();
    await rolePerm.page.waitForTimeout(300);
    const after = await checkbox.isChecked();
    expect(after).not.toBe(before);
    // Restore original state
    await checkbox.click();
  });

  test('PH_TC_255 - Save button visible', async () => {
    await expect(rolePerm.saveBtn).toBeVisible();
  });

  test('PH_TC_256 - Breadcrumb visible', async () => {
    await expect(rolePerm.breadcrumb).toBeVisible();
  });
});
