'use strict';

const { BasePage } = require('./base.page');

class RolePermissionsPage extends BasePage {
  constructor(page) {
    super(page);

    this.pageHeading   = page.locator('h1, h2, [class*="page-title"]').filter({ hasText: /role.*perm|permissions/i }).first();
    this.roleDropdown  = page.locator('p-dropdown, select, [class*="select"]').filter({ hasText: /role/i }).or(
                           page.locator('[aria-label*="role"], [placeholder*="role"]')
                         ).first();
    this.permMatrix    = page.locator('table, p-table, [class*="permission-matrix"], [class*="p-datatable"]').first();
    this.breadcrumb    = page.locator('[class*="breadcrumb"], nav[aria-label*="breadcrumb"]').first();
    this.saveBtn       = page.locator('button').filter({ hasText: /save/i }).first();
    this.toast         = page.locator('p-toast, [class*="p-toast"]');
  }

  async goto() {
    await this.navigate('/app/role-permissions');
    await this.waitForElement(this.pageHeading, { timeout: 30_000 });
  }
}

module.exports = { RolePermissionsPage };
