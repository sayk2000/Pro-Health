'use strict';

const { BasePage } = require('./base.page');

class LoginAuditPage extends BasePage {
  constructor(page) {
    super(page);

    this.pageHeading = page.locator('h1, h2, [class*="page-title"]').filter({ hasText: /login audit/i }).first();
    this.table       = page.locator('p-table, table, [class*="p-datatable"]').first();
    this.tableRows   = page.locator('p-table tbody tr, table tbody tr');
    this.exportBtn   = page.locator('button').filter({ hasText: /export/i }).first();
    this.breadcrumb  = page.locator('[class*="breadcrumb"], nav[aria-label*="breadcrumb"]').first();
  }

  async goto() {
    await this.navigate('/app/login-audit');
    await this.waitForElement(this.table, { timeout: 30_000 });
  }

  async getRowCount() {
    return this.tableRows.count();
  }
}

module.exports = { LoginAuditPage };
