'use strict';

const { BasePage } = require('./base.page');

class SystemConfigPage extends BasePage {
  constructor(page) {
    super(page);

    this.pageHeading = page.locator('h1, h2, [class*="page-title"]').filter({ hasText: /system config/i }).first();
    this.tabs        = page.locator('[role="tab"], [class*="tab-label"], [class*="tab"]');
    this.breadcrumb  = page.locator('[class*="breadcrumb"], nav[aria-label*="breadcrumb"]').first();
    this.saveBtn     = page.locator('button').filter({ hasText: /save/i }).first();
    this.toast       = page.locator('p-toast, [class*="p-toast"]');
  }

  async goto() {
    await this.navigate('/app/system-config');
    await this.waitForElement(this.pageHeading, { timeout: 30_000 });
  }

  async clickTab(label) {
    await this.tabs.filter({ hasText: new RegExp(label, 'i') }).first().click();
    await this.waitForLoadState('domcontentloaded');
  }
}

module.exports = { SystemConfigPage };
