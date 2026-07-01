'use strict';

const { BasePage } = require('./base.page');

/**
 * Page object for /app/pharmacies
 *
 * Live DOM selectors confirmed 2026-06-24.
 *
 * Key UI facts:
 *  - Add button        : button.bbl-page__primary-btn
 *  - No module search — global search only
 *  - Status tabs       : All / Active / Inactive  (button.bbl-page__tab)
 *  - View toggle       : button.bbl-page__view-btn[title="..."]  NOT aria-label
 *  - Status cells      : td.col-status  val-true=Active  val-false=Inactive (BOOLEAN)
 *  - Edit btn          : button.p-button-rounded.p-button-text:not(.p-button-danger)
 *  - Delete btn        : button.p-button-rounded.p-button-text.p-button-danger
 *  - Edit opens slide panel (.bsp-panel) at SAME URL — NOT a full-page route
 *  - Delete triggers   : .p-dialog.p-confirm-dialog
 *  - Required fields   : #pharmacyName, #address1, #city, #postCode
 *  - Submit            : button.bsp-btn.bsp-btn--primary
 *  - Cancel            : button.bsp-btn:not(.bsp-btn--primary)
 */
class PharmaciesPage extends BasePage {
  constructor(page) {
    super(page);

    // ── Toolbar ──────────────────────────────────────────────────────────────
    this.addPharmacyBtn = page.locator('button.bbl-page__primary-btn');
    this.exportBtn = page.locator('button.bbl-page__export-btn').filter({ hasText: /Export/i });
    this.filterBtn = page.locator('button.bbl-page__toolbar-filter-btn');

    // ── Status tabs ──────────────────────────────────────────────────────────
    this.tabs = page.locator('button.bbl-page__tab');
    this.tabAll = page.locator('button.bbl-page__tab').filter({ hasText: /^\s*All\s*$/i });
    this.tabActive = page.locator('button.bbl-page__tab').filter({ hasText: /^\s*Active\s*$/i });
    this.tabInactive = page.locator('button.bbl-page__tab').filter({ hasText: /^\s*Inactive\s*$/i });

    // ── View toggles ─────────────────────────────────────────────────────────
    this.listViewBtn = page.locator('button.bbl-page__view-btn[title="List view"]');
    this.cardViewBtn = page.locator('button.bbl-page__view-btn[title="Card view"]');

    // ── Filter panel ─────────────────────────────────────────────────────────
    this.filterPanel = page.locator('.bbl-page__toolbar-filter-pop');
    const filterRows = page.locator('.bbl-page__toolbar-filter-row');
    this.filterStatusRow = filterRows.filter({ hasText: /^status$/i });
    this.filterEpsRow = filterRows.filter({ hasText: /eps\s*enabled/i });
    this.filterStatusMultiselect = this.filterStatusRow.locator('p-multiselect');
    this.filterEpsDropdown = this.filterEpsRow.locator('p-dropdown');
    this.filterApplyBtn = this.filterPanel.locator('button').filter({ hasText: /apply/i });
    this.filterClearBtn = this.filterPanel.locator('button').filter({ hasText: /clear/i });

    // ── Table ─────────────────────────────────────────────────────────────────
    this.table = page.locator('table.p-datatable-table');
    this.tableRows = page.locator('tr.p-selectable-row');
    this.emptyMessage = page.locator('.p-datatable-emptymessage');
    this.emptyState = this.emptyMessage;
    this.skeletonLoader = page.locator('p-skeleton, [class*="skeleton"]');

    // Column headers
    this.colPharmacy = page.locator('th').filter({ hasText: /pharmacy|name/i }).first();
    this.colTelephone = page.locator('th').filter({ hasText: /telephone/i });
    this.colAddress = page.locator('th').filter({ hasText: /address/i }).first();
    this.colPostCode = page.locator('th').filter({ hasText: /post\s*code/i });
    this.colOdsCode = page.locator('th').filter({ hasText: /ods\s*code/i });
    this.colEps = page.locator('th').filter({ hasText: /eps/i });
    this.colStatus = page.locator('th').filter({ hasText: /^status$/i });
    this.colActions = page.locator('th').filter({ hasText: /actions/i });

    // Row cell selectors
    this.cellTitle = page.locator('td.col-title');
    this.cellAddress = page.locator('td.col-fullAddress');
    this.cellPostCode = page.locator('td.col-postCode');
    this.cellOdsCode = page.locator('td.col-odsCode');
    this.cellEps = page.locator('td.col-isEpsEnabled');
    this.cellStatus = page.locator('td.col-status');

    // ── Slide panel ───────────────────────────────────────────────────────────
    this.panel = page.locator('.bsp-panel');
    this.panelOpen = page.locator('.bsp-panel--open');
    this.panelBadge = page.locator('.bsp-panel__badge');
    this.panelTitle = page.locator('.bsp-panel__title, .bsp-panel__header h2').first();

    // Toggles
    this.epsEnabledToggle = page.locator('p-inputswitch').filter({ has: page.locator('#isEpsEnabled') });
    this.statusToggle = page.locator('p-inputswitch').filter({ has: page.locator('#status') });

    // ODS lookup
    this.odsCodeInput = page.locator('#odsCode');
    this.odsSearchBtn = page.locator('button.pharmacy-toggle-card__search');

    // Form fields
    this.pharmacyNameInput = page.locator('#pharmacyName');
    this.address1Input = page.locator('#address1');
    this.address2Input = page.locator('#address2');
    this.address3Input = page.locator('#address3');
    this.cityInput = page.locator('#city');
    this.countyInput = page.locator('#county');
    this.postCodeInput = page.locator('#postCode');
    this.telephoneInput = page.locator('#telephone');
    this.emailInput = page.locator('#pharmacyEmail');
    this.websiteInput = page.locator('#website');

    // Field aliases for old spec property names
    this.addressLine1Input = this.address1Input;
    this.addressLine2Input = this.address2Input;
    this.addressLine3Input = this.address3Input;
    this.townInput = this.cityInput;

    // Panel buttons
    this.saveBtn = page.locator('button.bsp-btn.bsp-btn--primary');
    this.cancelBtn = page.locator('button.bsp-btn:not(.bsp-btn--primary)').first();

    // ── Confirm dialog ────────────────────────────────────────────────────────
    this.confirmDialog = page.locator('.p-dialog.p-confirm-dialog');
    this.confirmBtn = page.locator('.p-confirm-dialog-accept');
    this.cancelConfirmBtn = page.locator('.p-confirm-dialog-reject');
    this.confirmYesBtn = this.confirmBtn;
    this.confirmNoBtn = this.cancelConfirmBtn;
    this.confirmMessage = page.locator('.p-dialog.p-confirm-dialog .p-confirm-dialog-message').first();

    // ── Inline errors ─────────────────────────────────────────────────────────
    this.inlineErrors = page.locator('.p-error, small.p-error');

    // Error banner
    this.errorBanner = page.locator(
      '.bsp-panel p-message[severity="error"], .bsp-panel .p-message-error, ' +
      '[role="alert"][class*="error"], .bsp-panel [class*="error-banner"]'
    ).first();

    // ── Toast ─────────────────────────────────────────────────────────────────
    this.toast = page.locator('p-toast');
    this.toastMessage = page.locator('p-toast .p-toast-detail, p-toast .p-toast-summary').first();

    // ── Card view ─────────────────────────────────────────────────────────────
    this.cardsGrid = page.locator('.bbl-page__cards-grid');
    this.cards = page.locator('.bbl-card');
    this.cardTitle = page.locator('.bbl-card__title');
    this.cardSubtitle = page.locator('.bbl-card__subtitle');
    this.cardMenuBtn = page.locator('button.bbl-card__menu-btn');

    // ── Pagination ────────────────────────────────────────────────────────────
    this.paginator = page.locator('p-paginator');
    this.paginationLabel = page.locator('p-paginator .p-paginator-current');

    // ── Backward-compat aliases (old spec used dialog names) ─────────────────
    this.createDialog = this.panel;
    this.editDialog = this.panel;
    this.createDialogTitle = this.panelBadge;
    this.editDialogTitle = this.panelBadge;
    this.createBtn = this.saveBtn;
    this.filtersBtn = this.filterBtn;
    this.filterAll = this.tabAll;
    this.filterActive = this.tabActive;
    this.filterInactive = this.tabInactive;

    // Page heading / subtitle
    this.pageHeading = page.locator('h1, .sc-page-head__title, .bbl-page__title').first();
    this.pageSubtitle = page.locator('.sc-page__subtitle, .bbl-page__subtitle, p.subtitle').first();

    // Search input for pharmacies list
    this.searchInput = page.locator('input.bbl-page__search-input');
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  async goto() {
    await this.navigate('/app/pharmacies');
    await this.dismissCookieBanner();
    // Wait for the PrimeNG DataTable wrapper (p-table or .p-datatable) which is
    // always visible once the component renders, unlike the inner <table> which
    // PrimeNG may keep hidden while loading data.
    await this.page.locator('p-table, .p-datatable').first()
      .waitFor({ state: 'visible', timeout: 30_000 });
    await this.waitForAngular();
  }

  // ---------------------------------------------------------------------------
  // Toolbar
  // ---------------------------------------------------------------------------

  async clickAddPharmacy() {
    await this.click(this.addPharmacyBtn);
    await this.waitForElement(this.panel);
    await this.waitForAngular();
  }

  async clickExport() { await this.click(this.exportBtn); }
  async clickFilters() { return this.openFilterPanel(); }
  async closeDialog() { await this.click(this.cancelBtn); }

  // ---------------------------------------------------------------------------
  // Filter panel
  // ---------------------------------------------------------------------------

  async openFilterPanel() {
    await this.click(this.filterBtn);
    await this.waitForElement(this.filterPanel, { timeout: 8_000 });
  }

  async setFilterStatus(value) {
    await this.filterStatusMultiselect.click();
    await this.page.locator('.p-multiselect-item').filter({ hasText: new RegExp(value, 'i') }).click();
    await this.filterStatusMultiselect.press('Escape');
  }

  async setEpsFilter(value) {
    await this.filterEpsDropdown.click();
    await this.page.locator('.p-dropdown-item').filter({ hasText: new RegExp(value, 'i') }).first().click();
  }

  async applyFilters() { await this.click(this.filterApplyBtn); await this.waitForAngular(); }
  async clearFilters() { await this.click(this.filterClearBtn); await this.waitForAngular(); }

  // ---------------------------------------------------------------------------
  // Status tabs
  // ---------------------------------------------------------------------------

  async clickTab(status) {
    const tab = this.page.locator('button.bbl-page__tab').filter({ hasText: new RegExp(`^\\s*${status}\\s*$`, 'i') });
    await this.click(tab);
    await this.waitForAngular();
  }

  /** Alias used by pharmacies.spec.js */
  async setStatusFilter(status) { return this.clickTab(status); }

  // ---------------------------------------------------------------------------
  // View toggles
  // ---------------------------------------------------------------------------

  async switchToListView() { await this.click(this.listViewBtn); }
  async switchToCardView() { await this.click(this.cardViewBtn); }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  async search(term) { await this.fillAngularInput(this.searchInput, term); await this.waitForAngular(); }
  async clearSearch() { await this.searchInput.fill(''); await this.waitForAngular(); }

  // ---------------------------------------------------------------------------
  // Table helpers
  // ---------------------------------------------------------------------------

  async getRowCount() { return this.tableRows.count(); }

  async clickEditOnRow(index = 0) {
    await this.tableRows
      .nth(index)
      .locator('button.p-button-rounded.p-button-text:not(.p-button-danger)')
      .first().click();
    await this.waitForElement(this.panel);
    await this.waitForAngular();
  }

  async clickDeleteOnRow(index = 0) {
    await this.tableRows
      .nth(index)
      .locator('button.p-button-rounded.p-button-text.p-button-danger')
      .first().click();
    await this.waitForElement(this.confirmDialog);
  }

  async getRowStatus(index = 0) {
    const cell = this.tableRows.nth(index).locator('td.col-status');
    const cls = await cell.getAttribute('class') || '';
    if (cls.includes('val-true')) return 'Active';
    if (cls.includes('val-false')) return 'Inactive';
    return (await cell.textContent())?.trim() || '';
  }

  // ---------------------------------------------------------------------------
  // Form helpers
  // ---------------------------------------------------------------------------

  async fillForm({ pharmacyName, odsCode, address1, address2, address3, city, town,
    county, postCode, telephone, email, website,
    addressLine1, addressLine2, addressLine3 } = {}) {
    if (pharmacyName !== undefined) await this.fillAngularInput(this.pharmacyNameInput, pharmacyName);
    if (odsCode !== undefined) await this.fillAngularInput(this.odsCodeInput, odsCode);
    if (address1 || addressLine1) await this.fillAngularInput(this.address1Input, address1 ?? addressLine1);
    if (address2 || addressLine2) await this.fillAngularInput(this.address2Input, address2 ?? addressLine2);
    if (address3 || addressLine3) await this.fillAngularInput(this.address3Input, address3 ?? addressLine3);
    if (city || town) await this.fillAngularInput(this.cityInput, city ?? town);
    if (county !== undefined) await this.fillAngularInput(this.countyInput, county);
    if (postCode !== undefined) await this.fillAngularInput(this.postCodeInput, postCode);
    if (telephone !== undefined) await this.fillAngularInput(this.telephoneInput, telephone);
    if (email !== undefined) await this.fillAngularInput(this.emailInput, email);
    if (website !== undefined) await this.fillAngularInput(this.websiteInput, website);
  }

  // ---------------------------------------------------------------------------
  // Panel / dialog actions
  // ---------------------------------------------------------------------------

  async clickSave() { await this.click(this.saveBtn); }
  async clickCancel() { await this.click(this.cancelBtn); }
  async clickCreate() { return this.clickSave(); }

  // ---------------------------------------------------------------------------
  // Confirm dialog
  // ---------------------------------------------------------------------------

  async confirmDelete() { await this.click(this.confirmBtn); }
  async cancelDelete() { await this.click(this.cancelConfirmBtn); }

  // ---------------------------------------------------------------------------
  // State queries
  // ---------------------------------------------------------------------------

  async isPanelOpen() { return this.panel.isVisible(); }
  async isSaveDisabled() { return !(await this.saveBtn.isEnabled()); }
  async isCreateDisabled() { return this.isSaveDisabled(); }
  async isConfirmDialogOpen() { return this.confirmDialog.isVisible(); }
  async isCreateDialogOpen() { return this.isPanelOpen(); }
  async isEditDialogOpen() { return this.isPanelOpen(); }

  async getActiveTab() {
    return (await this.page.locator('button.bbl-page__tab--active').textContent())?.trim() || '';
  }

  async getToastText() {
    await this.waitForElement(this.toast, { timeout: 8_000 });
    return this.getText(this.toastMessage);
  }
}

module.exports = { PharmaciesPage };
