'use strict';

const { BasePage } = require('./base.page');

class AccountsPage extends BasePage {
  constructor(page) {
    super(page);

    this.pageHeading  = page.locator('h1, h2, [class*="page-title"]').first();
    this.table        = page.locator('p-table, table, [class*="p-datatable"]').first();
    this.tableRows    = page.locator('p-table tbody tr, table tbody tr');
    this.newBtn       = page.locator('button').filter({ hasText: /new account|add account/i }).first();
    this.exportBtn    = page.locator('button').filter({ hasText: /export/i }).first();
    this.emptyMessage = page.locator('[class*="empty"], [class*="no-data"], text=No records found').first();
    this.breadcrumb   = page.locator('[class*="breadcrumb"], nav[aria-label*="breadcrumb"]').first();
    this.toast        = page.locator('p-toast, [class*="p-toast"]');
  }

  async goto() {
    await this.navigate('/app/accounts');
    await this.waitForElement(this.pageHeading, { timeout: 30_000 });
  }

  async getRowCount() {
    return this.tableRows.count();
  }
}

module.exports = { AccountsPage };
