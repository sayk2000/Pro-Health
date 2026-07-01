'use strict';

const { BasePage } = require('./base.page');

class OrganizationsPage extends BasePage {
  constructor(page) {
    super(page);

    this.pageHeading  = page.locator('h1, h2, [class*="page-title"]').filter({ hasText: /organizations/i }).first();
    this.table        = page.locator('p-table, table, [class*="p-datatable"]').first();
    this.tableRows    = page.locator('p-table tbody tr, table tbody tr');
    this.newBtn       = page.locator('button').filter({ hasText: /new org|add org|new organization/i }).first();
    this.breadcrumb   = page.locator('[class*="breadcrumb"], nav[aria-label*="breadcrumb"]').first();
    this.panel        = page.locator('p-sidebar, p-dialog, [class*="p-sidebar"], [class*="p-dialog"]').first();
    this.saveBtn      = page.locator('p-sidebar button, p-dialog button').filter({ hasText: /save/i }).first();
    this.cancelBtn    = page.locator('p-sidebar button, p-dialog button').filter({ hasText: /cancel/i }).first();
    this.toast        = page.locator('p-toast, [class*="p-toast"]');
    this.emptyMessage = page.locator('[class*="empty"], [class*="no-data"], text=No records found').first();
  }

  async goto() {
    await this.navigate('/app/organizations');
    await this.waitForElement(this.pageHeading, { timeout: 30_000 });
  }

  async clickNewOrg() {
    await this.click(this.newBtn);
    await this.waitForElement(this.panel);
  }

  async getRowCount() {
    return this.tableRows.count();
  }
}

module.exports = { OrganizationsPage };
