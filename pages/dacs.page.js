'use strict';

const { BasePage } = require('./base.page');

/**
 * Page object for /app/dacs
 * DACs (Dispensing Appliance Contractors) management.
 *
 * Live DOM selectors confirmed 2026-06-24 against
 * https://coloplast-prohealth-test.bbsystemstest.com/app/dacs
 *
 * Key UI facts:
 *  - Tabs (All / Active / Inactive) replace the old status dropdown
 *  - View toggle uses `title` attribute NOT aria-label
 *  - Table: table.p-datatable-table, rows: tr.p-selectable-row
 *  - Status cells: td.col-status  val-1=Active  val-2=Inactive
 *  - Add/Edit uses slide panel (.bsp-panel), NOT a dialog
 *  - Delete triggers .p-dialog.p-confirm-dialog
 */
class DacsPage extends BasePage {
  constructor(page) {
    super(page);

    // ── Toolbar ──────────────────────────────────────────────────────────────
    this.addDacBtn = page.locator('button.bbl-page__primary-btn');
    this.exportBtn = page.locator('button.bbl-page__export-btn').filter({ hasText: /export/i });
    this.searchInput = page.locator('input.bbl-page__search-input');
    this.filterBtn = page.locator('button.bbl-page__toolbar-filter-btn');

    // ── Status tabs ──────────────────────────────────────────────────────────
    this.tabs = page.locator('button.bbl-page__tab');
    this.tabAll = page.locator('button.bbl-page__tab').filter({ hasText: /^\s*All\s*$/i });
    this.tabActive = page.locator('button.bbl-page__tab').filter({ hasText: /^\s*Active\s*$/i });
    this.tabInactive = page.locator('button.bbl-page__tab').filter({ hasText: /^\s*Inactive\s*$/i });
    // Legacy alias — old specs call statusDropdown
    this.statusDropdown = this.tabs;

    // ── View toggles ─────────────────────────────────────────────────────────
    this.listViewBtn = page.locator('button.bbl-page__view-btn[title="List view"]');
    this.cardViewBtn = page.locator('button.bbl-page__view-btn[title="Card view"]');

    // ── Filter panel ─────────────────────────────────────────────────────────
    this.filterPanel = page.locator('.bbl-page__toolbar-filter-pop');
    const filterRows = page.locator('.bbl-page__toolbar-filter-row');
    this.filterEpsRow = filterRows.filter({ hasText: /eps enabled/i });
    this.filterStatusRow = filterRows.filter({ hasText: /^status$/i });
    this.filterEpsDropdown = this.filterEpsRow.locator('p-dropdown');
    this.filterStatusDropdown = this.filterStatusRow.locator('p-dropdown');
    this.filterApplyBtn = this.filterPanel.locator('button').filter({ hasText: /apply/i });
    this.filterClearBtn = this.filterPanel.locator('button').filter({ hasText: /clear/i });

    // ── Table ─────────────────────────────────────────────────────────────────
    this.table = page.locator('table.p-datatable-table');
    this.tableRows = page.locator('tr.p-selectable-row');
    this.emptyMessage = page.locator('.p-datatable-emptymessage');
    this.skeletonLoader = page.locator('p-skeleton, [class*="skeleton"]');

    // Column headers
    this.colDacName = page.locator('th').filter({ hasText: /dac/i });
    this.colAddress = page.locator('th').filter({ hasText: /^address$/i });
    this.colPostCode = page.locator('th').filter({ hasText: /post\s*code/i });
    this.colOdsCode = page.locator('th').filter({ hasText: /ods\s*code/i });
    this.colEpsEnabled = page.locator('th').filter({ hasText: /eps\s*enabled/i });
    this.colActive = page.locator('th').filter({ hasText: /^active$/i });
    this.colStatus = page.locator('th').filter({ hasText: /^status$/i });
    this.colActions = page.locator('th').filter({ hasText: /actions/i });

    // Row cell selectors
    this.cellName = page.locator('td.col-name');
    this.cellStatus = page.locator('td.col-status');
    this.cellOdsCode = page.locator('td.col-odsCode');
    this.cellEpsEnabled = page.locator('td.col-isEpsEnabled');
    this.cellActions = page.locator('td.actions-column-cell');

    // ── Slide panel ───────────────────────────────────────────────────────────
    this.panel = page.locator('.bsp-panel');
    this.panelBadge = page.locator('.bsp-panel__badge');
    this.panelTitle = page.locator('.bsp-panel__title, .bsp-panel__header h2, .bsp-panel__header h3').first();

    // Form fields
    this.dacNameInput = page.locator('#dacName');
    this.odsCodeInput = page.locator('#odsCode');
    this.address1Input = page.locator('#address1');
    this.address2Input = page.locator('#address2');
    this.address3Input = page.locator('#address3');
    this.cityInput = page.locator('#city');
    this.countyInput = page.locator('#county');
    this.postCodeInput = page.locator('#postCode');
    this.telephoneInput = page.locator('#telephone');
    this.emailInput = page.locator('#email');
    this.websiteInput = page.locator('#website');

    // p-inputswitch toggles
    this.epsEnabledToggle = page.locator('p-inputswitch#isEpsEnabled');
    this.activeToggle = page.locator('p-inputswitch#isActive');

    // Backward-compat field aliases
    this.addressLine1Input = this.address1Input;
    this.addressLine2Input = this.address2Input;
    this.addressLine3Input = this.address3Input;
    this.townInput = this.cityInput;
    this.activeCheckbox = this.activeToggle;

    // EPS Settings section (visible when EPS toggle is ON)
    this.epsSettingsSection = page.locator(
      '[class*="eps-settings"], [class*="eps_settings"], .bsp-panel .p-fieldset:has-text("EPS")'
    ).first();

    // Panel error/info banner
    this.panelBanner = page.locator(
      '.bsp-panel p-message, .bsp-panel .p-inline-message, .bsp-panel [class*="banner"]'
    ).first();

    // Panel action buttons
    this.saveBtn = page.locator('.bsp-panel button[type="submit"], .bsp-panel .bsp-btn--primary').first();
    this.cancelBtn = page.locator('.bsp-panel button.bsp-btn:not(.bsp-btn--primary)').first();

    // ── Confirm dialog ────────────────────────────────────────────────────────
    this.confirmDialog = page.locator('.p-dialog.p-confirm-dialog');
    this.confirmBtn = page.locator('.p-confirm-dialog-accept');
    this.cancelConfirmBtn = page.locator('.p-confirm-dialog-reject');

    // ── Inline errors ─────────────────────────────────────────────────────────
    this.inlineErrors = page.locator('.p-error, small.p-error');

    // ── Toast ─────────────────────────────────────────────────────────────────
    this.toast = page.locator('p-toast');
    this.toastMessage = page.locator('p-toast .p-toast-detail, p-toast .p-toast-summary').first();

    // ── Card view ─────────────────────────────────────────────────────────────
    this.cardsGrid = page.locator('.bbl-page__cards-grid');
    this.cards = page.locator('.bbl-card');
    this.cardTitle = page.locator('.bbl-card__title');
    this.cardMenuBtn = page.locator('button.bbl-card__menu-btn');
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  async goto() {
    await this.navigate('/app/dacs');
    await this.dismissCookieBanner();
    // Wait for the PrimeNG DataTable wrapper (p-table or .p-datatable) which is
    // always visible once the component renders, unlike the inner <table> which
    // PrimeNG may keep hidden while loading data.
    await this.page.locator('p-table, .p-datatable').first()
      .waitFor({ state: 'visible', timeout: 30_000 });
    await this.waitForAngular();
  }

  async openFromSidebar() {
    await this.openSidebar();

    const dacsLink = this.page.locator(
      'a[href*="/app/dacs"], a[routerlink*="/app/dacs"], [routerlink*="/app/dacs"]'
    ).first();
    const dacsMenuItem = this.page.locator(
      'a, button, [role="menuitem"], [class*="nav-item"], [class*="menu-item"]'
    ).filter({ hasText: /^\s*DACs?\s*$/i }).first();

    if (await dacsLink.isVisible().catch(() => false)) {
      await dacsLink.click();
    } else if (await dacsMenuItem.isVisible().catch(() => false)) {
      await dacsMenuItem.click();
    } else {
      await this.navigate('/app/dacs');
    }

    await this.page.waitForURL(/\/app\/dacs/, { timeout: 15_000 });
    await this.dismissCookieBanner();
    await this.page.locator('p-table, .p-datatable').first()
      .waitFor({ state: 'visible', timeout: 30_000 });
    await this.waitForAngular();
  }

  async openSidebar() {
    const dacsLink = this.page.locator(
      'a[href*="/app/dacs"], a[routerlink*="/app/dacs"], [routerlink*="/app/dacs"]'
    ).first();
    if (await dacsLink.isVisible().catch(() => false)) return;

    const sidebarToggle = this.page.locator(
      'button[aria-label*="menu" i], button[aria-label*="navigation" i], ' +
      'button[title*="menu" i], button[title*="navigation" i], ' +
      '.ph-sidebar-toggle, .layout-menu-button, [class*="sidebar-toggle"], [class*="menu-button"]'
    ).first();

    if (await sidebarToggle.isVisible().catch(() => false)) {
      await sidebarToggle.click();
      await this.waitForAngular();
    }
  }

  // ---------------------------------------------------------------------------
  // Toolbar
  // ---------------------------------------------------------------------------

  async clickNewDac() {
    await this.click(this.addDacBtn);
    await this.waitForElement(this.panel);
  }

  async clickAddDac() { return this.clickNewDac(); }

  // ---------------------------------------------------------------------------
  // Tabs / status filter
  // ---------------------------------------------------------------------------

  async clickTab(status) {
    const tab = this.page.locator('button.bbl-page__tab').filter({ hasText: new RegExp(`^\\s*${status}\\s*$`, 'i') });
    await this.click(tab);
    await this.waitForAngular();
  }

  async setStatusFilter(status) { return this.clickTab(status); }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  async search(term) {
    await this.fillAngularInput(this.searchInput, term);
    await this.waitForAngular();
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.searchInput.dispatchEvent('input');
    await this.waitForAngular();
  }

  // ---------------------------------------------------------------------------
  // Filter panel
  // ---------------------------------------------------------------------------

  async openFilterPanel() {
    await this.click(this.filterBtn);
    await this.waitForElement(this.filterPanel, { timeout: 8_000 });
  }

  async setEpsFilter(value) {
    await this.filterEpsDropdown.click();
    await this.page.locator('.p-dropdown-item').filter({ hasText: new RegExp(value, 'i') }).first().click();
  }

  async setFilterStatus(value) {
    await this.filterStatusDropdown.click();
    await this.page.locator('.p-dropdown-item').filter({ hasText: new RegExp(value, 'i') }).first().click();
  }

  async applyFilters() {
    await this.click(this.filterApplyBtn);
    await this.waitForAngular();
  }

  async clearFilters() {
    await this.click(this.filterClearBtn);
    await this.waitForAngular();
  }

  // ---------------------------------------------------------------------------
  // View toggles
  // ---------------------------------------------------------------------------

  async switchToListView() { await this.click(this.listViewBtn); }
  async switchToCardView() { await this.click(this.cardViewBtn); }

  // ---------------------------------------------------------------------------
  // Table helpers
  // ---------------------------------------------------------------------------

  async getRowCount() { return this.tableRows.count(); }

  async clickEditOnRow(index = 0) {
    await this.tableRows
      .nth(index)
      .locator('td.actions-column-cell button:not(.p-button-danger)')
      .first()
      .click();
    await this.waitForElement(this.panel);
  }

  async clickDeactivateOnRow(index = 0) {
    await this.tableRows
      .nth(index)
      .locator('td.actions-column-cell button.p-button-danger')
      .first()
      .click();
    await this.waitForElement(this.confirmDialog);
  }

  async clickDeleteOnRow(index = 0) { return this.clickDeactivateOnRow(index); }

  // ---------------------------------------------------------------------------
  // Form helpers
  // ---------------------------------------------------------------------------

  async fillAddForm({
    dacName, odsCode,
    address1, address2, address3, city, town, county, postCode,
    telephone, email, website,
    addressLine1, addressLine2, addressLine3,
  } = {}) {
    if (dacName) await this.fillAngularInput(this.dacNameInput, dacName);
    if (odsCode) await this.fillAngularInput(this.odsCodeInput, odsCode);
    if (address1 || addressLine1) await this.fillAngularInput(this.address1Input, address1 ?? addressLine1);
    if (address2 || addressLine2) await this.fillAngularInput(this.address2Input, address2 ?? addressLine2);
    if (address3 || addressLine3) await this.fillAngularInput(this.address3Input, address3 ?? addressLine3);
    if (city || town) await this.fillAngularInput(this.cityInput, city ?? town);
    if (county) await this.fillAngularInput(this.countyInput, county);
    if (postCode) await this.fillAngularInput(this.postCodeInput, postCode);
    if (telephone) await this.fillAngularInput(this.telephoneInput, telephone);
    if (email) await this.fillAngularInput(this.emailInput, email);
    if (website) await this.fillAngularInput(this.websiteInput, website);
  }

  // ---------------------------------------------------------------------------
  // Panel actions
  // ---------------------------------------------------------------------------

  async clickSave() { await this.click(this.saveBtn); }
  async clickCancel() { await this.click(this.cancelBtn); }

  // ---------------------------------------------------------------------------
  // Confirm dialog
  // ---------------------------------------------------------------------------

  async confirmDeactivation() { await this.click(this.confirmBtn); }
  async cancelDeactivation() { await this.click(this.cancelConfirmBtn); }
  async confirmDelete() { return this.confirmDeactivation(); }
  async cancelDelete() { return this.cancelDeactivation(); }

  // ---------------------------------------------------------------------------
  // State queries
  // ---------------------------------------------------------------------------

  async isPanelOpen() { return this.panel.isVisible(); }
  async isSaveDisabled() { return !(await this.saveBtn.isEnabled()); }

  async getToastText() {
    await this.waitForElement(this.toast, { timeout: 8_000 });
    return this.getText(this.toastMessage);
  }

  async getRowStatus(index = 0) {
    const cell = this.tableRows.nth(index).locator('td.col-status');
    const cls = await cell.getAttribute('class') || '';
    if (cls.includes('val-1')) return 'Active';
    if (cls.includes('val-2')) return 'Inactive';
    return (await cell.textContent())?.trim() || '';
  }

  async getActiveTab() {
    return (await this.page.locator('button.bbl-page__tab--active').textContent())?.trim() || '';
  }
}

module.exports = { DacsPage };
