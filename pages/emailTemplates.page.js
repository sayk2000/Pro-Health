'use strict';

const { BasePage } = require('./base.page');

class EmailTemplatesPage extends BasePage {
  constructor(page) {
    super(page);

    this.pageHeading  = page.locator('h1, h2, [class*="page-title"]').filter({ hasText: /email template/i }).first();
    this.table        = page.locator('p-table, table, [class*="p-datatable"]').first();
    this.tableRows    = page.locator('p-table tbody tr, table tbody tr');
    this.newBtn       = page.locator('button').filter({ hasText: /new template|add template|create template/i }).first();
    this.exportBtn    = page.locator('button').filter({ hasText: /export/i }).first();
    this.tabs         = page.locator('[role="tab"], [class*="tab-label"]');
    this.breadcrumb   = page.locator('[class*="breadcrumb"], nav[aria-label*="breadcrumb"]').first();
    this.toast        = page.locator('p-toast, [class*="p-toast"]');
  }

  async goto() {
    await this.navigate('/app/email-templates');
    await this.waitForElement(this.pageHeading, { timeout: 30_000 });
  }

  async clickTab(label) {
    await this.tabs.filter({ hasText: new RegExp(`^${label}$`, 'i') }).first().click();
    await this.waitForLoadState('domcontentloaded');
  }

  async getRowCount() {
    return this.tableRows.count();
  }
}

module.exports = { EmailTemplatesPage };
