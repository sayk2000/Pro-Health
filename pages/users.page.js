'use strict';

const { BasePage } = require('./base.page');

/**
 * Page object for /app/users
 * Users Management: list view, invite panel, card view.
 * Edit navigates to FULL PAGE ROUTE (/app/users/edit/{uuid}) — use EditUserPage there.
 *
 * Live DOM selectors confirmed 2026-06-24.
 *
 * Key UI facts:
 *  - Invite button  : button.bbl-page__primary-btn
 *  - Status tabs    : All / Active / Pending / Locked  (button.bbl-page__tab)
 *  - View toggle    : button.bbl-page__view-btn[title="..."]  NOT aria-label
 *  - Status cells   : td.col-accountStatus  val-1=Invited  val-3=Unverified  val-4=Active
 *  - Edit navigates to /app/users/edit/{uuid}
 *  - Invite uses slide panel (.bsp-panel)
 *  - Invite Tab 1   : #title #firstName #middleName #lastName(capital N) #email #phoneNumber #mobile #uuid
 *  - Invite Tab 2   : p-multiselect#role (SINGULAR)
 */
class UsersPage extends BasePage {
  constructor(page) {
    super(page);

    // ── Toolbar ──────────────────────────────────────────────────────────────
    this.newUserBtn = page.locator('button.bbl-page__primary-btn');
    this.exportBtn  = page.locator('button.bbl-page__secondary-btn').filter({ hasText: /export/i });

    // ── Status tabs ──────────────────────────────────────────────────────────
    this.tabs        = page.locator('button.bbl-page__tab');
    this.tabAll      = page.locator('button.bbl-page__tab').filter({ hasText: /^All$/i });
    this.tabActive   = page.locator('button.bbl-page__tab').filter({ hasText: /^Active$/i });
    this.tabPending  = page.locator('button.bbl-page__tab').filter({ hasText: /^Pending$/i });
    this.tabLocked   = page.locator('button.bbl-page__tab').filter({ hasText: /^Locked$/i });
    this.statusDropdown = this.tabs;

    // ── View toggles ─────────────────────────────────────────────────────────
    this.listViewBtn = page.locator('button.bbl-page__view-btn[title="List view"]');
    this.cardViewBtn = page.locator('button.bbl-page__view-btn[title="Card view"]');

    // ── Table ─────────────────────────────────────────────────────────────────
    this.table        = page.locator('table.p-datatable-table');
    this.tableRows    = page.locator('tr.p-selectable-row');
    this.emptyMessage = page.locator('.p-datatable-emptymessage');
    this.skeletonLoader = page.locator('p-skeleton, [class*="skeleton"]');

    // Column headers (live DOM names)
    this.colFirstName = page.locator('th').filter({ hasText: /first\s*name/i });
    this.colEmail     = page.locator('th').filter({ hasText: /^email$/i });
    this.colRoles     = page.locator('th').filter({ hasText: /roles?/i });
    this.colStatus    = page.locator('th').filter({ hasText: /status/i });
    this.colActions   = page.locator('th').filter({ hasText: /actions/i });

    // Backward-compat column aliases (old spec references)
    this.colFullName  = this.colFirstName;
    this.colRole      = this.colRoles;
    this.colAccounts  = page.locator('th').filter({ hasText: /account/i }).first();
    this.colPrescCaps = page.locator('th').filter({ hasText: /prescription|prescribing/i }).first();
    this.colLastLogin = page.locator('th').filter({ hasText: /last\s*log/i }).first();

    // Row cell selectors
    this.cellFirstName = page.locator('td.col-firstName');
    this.cellEmail     = page.locator('td.col-email');
    this.cellRoles     = page.locator('td.col-roles');
    this.cellStatus    = page.locator('td.col-accountStatus');

    // ── Invite slide panel ────────────────────────────────────────────────────
    this.panel      = page.locator('.bsp-panel');
    this.panelBadge = page.locator('.bsp-panel__badge');
    this.panelTitle = page.locator('.bsp-panel__title, .bsp-panel__header h2').first();

    // Panel tabs
    this.panelTab1 = page.locator('.bsp-panel [role="tab"]').nth(0);
    this.panelTab2 = page.locator('.bsp-panel [role="tab"]').nth(1);

    // Invite Tab 1 fields
    this.titleDropdown   = page.locator('#title');
    this.firstNameInput  = page.locator('#firstName');
    this.middleNameInput = page.locator('#middleName');
    this.lastNameInput   = page.locator('#lastName');
    this.emailInput      = page.locator('#email');
    this.telephoneInput  = page.locator('#phoneNumber');
    this.mobileInput     = page.locator('#mobile');
    this.uuidInput       = page.locator('#uuid');

    // Invite Tab 2
    this.roleMultiselect = page.locator('p-multiselect#role');

    // Panel buttons
    this.saveBtn   = page.locator('.bsp-panel button[type="submit"], .bsp-panel .bsp-btn--primary').first();
    this.cancelBtn = page.locator('.bsp-panel button.bsp-btn:not(.bsp-btn--primary)').first();

    // ── Confirm dialog ────────────────────────────────────────────────────────
    this.confirmDialog    = page.locator('.p-dialog.p-confirm-dialog');
    this.confirmBtn       = page.locator('.p-confirm-dialog-accept');
    this.cancelConfirmBtn = page.locator('.p-confirm-dialog-reject');

    // ── Inline errors ─────────────────────────────────────────────────────────
    this.inlineErrors = page.locator('.p-error, small.p-error');
    this.panelBanner  = page.locator('.bsp-panel p-message, .bsp-panel .p-inline-message').first();

    // ── Toast ─────────────────────────────────────────────────────────────────
    this.toast        = page.locator('p-toast');
    this.toastMessage = page.locator('p-toast .p-toast-detail, p-toast .p-toast-summary').first();

    // ── Card view ─────────────────────────────────────────────────────────────
    this.cardsGrid   = page.locator('.bbl-page__cards-grid');
    this.cards       = page.locator('.bbl-card');
    this.cardTitle   = page.locator('.bbl-card__title');
    this.cardStatus  = page.locator('.bbl-card__status-label');
    this.cardMenuBtn = page.locator('button.bbl-card__menu-btn');

    // ── Pagination ────────────────────────────────────────────────────────────
    this.paginator       = page.locator('p-paginator');
    this.paginationLabel = page.locator('p-paginator .p-paginator-current');
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  async goto() {
    await this.navigate('/app/users');
    await this.dismissCookieBanner();
    await this.waitForElement(this.table, { timeout: 30_000 });
  }

  // ---------------------------------------------------------------------------
  // Toolbar
  // ---------------------------------------------------------------------------

  async clickNewUser()    { await this.click(this.newUserBtn); await this.waitForElement(this.panel); }
  async clickInviteUser() { return this.clickNewUser(); }
  async clickExport()     { await this.click(this.exportBtn); }

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------

  async clickTab(status) {
    const tab = this.page.locator('button.bbl-page__tab').filter({ hasText: new RegExp(`^${status}$`, 'i') });
    await this.click(tab);
    await this.waitForAngular();
  }

  async setStatusFilter(status) { return this.clickTab(status); }

  // ---------------------------------------------------------------------------
  // View toggles
  // ---------------------------------------------------------------------------

  async switchToListView() { await this.click(this.listViewBtn); }
  async switchToCardView() { await this.click(this.cardViewBtn); }

  // ---------------------------------------------------------------------------
  // Table helpers
  // ---------------------------------------------------------------------------

  async getRowCount() { return this.tableRows.count(); }

  async getRowCellText(rowIndex, cellIndex) {
    return this.tableRows.nth(rowIndex).locator('td').nth(cellIndex).textContent();
  }

  async clickEditOnRow(index = 0) {
    await this.tableRows.nth(index).locator('td.actions-column-cell button, td button').first().click();
    await this.page.waitForURL(/\/app\/users\/edit\//, { timeout: 15_000 });
    await this.waitForAngular();
  }

  async getRowStatus(index = 0) {
    const cell = this.tableRows.nth(index).locator('td.col-accountStatus');
    const cls  = await cell.getAttribute('class') || '';
    if (cls.includes('val-4')) return 'Active';
    if (cls.includes('val-1')) return 'Invited';
    if (cls.includes('val-3')) return 'Unverified';
    return (await cell.textContent())?.trim() || '';
  }

  // ---------------------------------------------------------------------------
  // Form helpers
  // ---------------------------------------------------------------------------

  async fillAddForm({ title, firstName, middleName, lastName, email, telephone, phoneNumber, mobile, uuid } = {}) {
    if (title !== undefined) {
      await this.titleDropdown.click();
      await this.page.locator('.p-dropdown-item').filter({ hasText: title }).first().click();
    }
    if (firstName  !== undefined) await this.fillAngularInput(this.firstNameInput,  firstName);
    if (middleName !== undefined) await this.fillAngularInput(this.middleNameInput, middleName);
    if (lastName   !== undefined) await this.fillAngularInput(this.lastNameInput,   lastName);
    if (email      !== undefined) await this.fillAngularInput(this.emailInput,      email);
    const tel = telephone ?? phoneNumber;
    if (tel  !== undefined) await this.fillAngularInput(this.telephoneInput, tel);
    if (mobile !== undefined) await this.fillAngularInput(this.mobileInput, mobile);
    if (uuid   !== undefined) await this.fillAngularInput(this.uuidInput,   uuid);
  }

  async selectRoles(roles = []) {
    await this.roleMultiselect.click();
    for (const role of roles) {
      await this.page.locator('.p-multiselect-item').filter({ hasText: role }).click();
    }
    await this.roleMultiselect.press('Escape');
  }

  // ---------------------------------------------------------------------------
  // Panel actions
  // ---------------------------------------------------------------------------

  async clickSave()   { await this.click(this.saveBtn); }
  async clickCancel() { await this.click(this.cancelBtn); }
  async isPanelOpen()    { return this.panel.isVisible(); }
  async isSaveDisabled() { return !(await this.saveBtn.isEnabled()); }

  // ---------------------------------------------------------------------------
  // Confirm dialog
  // ---------------------------------------------------------------------------

  async confirmDeactivation() { await this.click(this.confirmBtn); }
  async cancelDeactivation()  { await this.click(this.cancelConfirmBtn); }

  // ---------------------------------------------------------------------------
  // Toast
  // ---------------------------------------------------------------------------

  async getToastText() {
    await this.waitForElement(this.toast, { timeout: 8_000 });
    return this.getText(this.toastMessage);
  }

  async getActiveTab() {
    return (await this.page.locator('button.bbl-page__tab--active').textContent())?.trim() || '';
  }

  // Legacy stubs — no column filters exist in live DOM
  async filterByFullName() { this.logger.warn('filterByFullName: no column filter in live DOM'); }
  async filterByEmail()    { this.logger.warn('filterByEmail: no column filter in live DOM'); }
  async filterByRole()     { this.logger.warn('filterByRole: no column filter in live DOM'); }
  async sortBy(col)        { await this.click(col); await this.waitForAngular(); }
}

module.exports = { UsersPage };
