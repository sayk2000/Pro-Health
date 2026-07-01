'use strict';

const { BasePage } = require('./base.page');

/**
 * Page object for /app/users/edit/{uuid}
 * Full-page edit form for an existing user.
 *
 * Live DOM selectors confirmed 2026-06-24 against
 * https://coloplast-prohealth-test.bbsystemstest.com/app/users/edit/{uuid}
 *
 * Key UI facts:
 *  - Page container: .sc-page.edit-user
 *  - Page heading:   .sc-page-head__title  (h1)
 *  - Two tabs:  Tab 0 = Details, Tab 1 = Roles
 *  - Tab 1 field IDs: #title, #firstName, #middleName, #lastname (LOWERCASE n), #jobTitle, #uuid, #phoneNumber, #mobile, #email
 *  - Tab 2 role field: p-multiselect#roles (PLURAL)
 *  - Buttons panel: .buttons-panel.buttons-panel--split
 *  - Suspend btn    : button.p-button-danger:not(.p-button-outlined)
 *  - Unsuspend btn  : button.p-button-success
 *  - Delete btn     : button.p-button-danger.p-button-outlined
 *  - Password reset : button.p-button-secondary (first one)
 *  - Cancel btn     : last .p-button-secondary
 *  - Save btn       : button[type="submit"]
 *  - IMPORTANT: Suspend and Delete are IMMEDIATE — NO confirm dialog
 */
class EditUserPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // ── Page structure ────────────────────────────────────────────────────────
    this.pageContainer = page.locator('.sc-page.edit-user');
    this.pageTitle     = page.locator('.sc-page-head__title');

    // ── Tabs ──────────────────────────────────────────────────────────────────
    this.tabs    = page.locator('[role="tab"]');
    this.tab1    = page.locator('[role="tab"]').nth(0);  // Details
    this.tab2    = page.locator('[role="tab"]').nth(1);  // Roles

    // ── Tab 1: Personal details form fields ───────────────────────────────────
    // NOTE: #lastname has LOWERCASE 'n' — intentional — verified in live DOM
    this.titleDropdown   = page.locator('#title');
    this.firstNameInput  = page.locator('#firstName');
    this.middleNameInput = page.locator('#middleName');
    this.lastNameInput   = page.locator('#lastname');   // lowercase 'n'
    this.jobTitleInput   = page.locator('#jobTitle');
    this.uuidInput       = page.locator('#uuid');
    this.phoneInput      = page.locator('#phoneNumber');
    this.mobileInput     = page.locator('#mobile');
    this.emailInput      = page.locator('#email');

    // ── Tab 2: Roles ──────────────────────────────────────────────────────────
    this.rolesMultiselect = page.locator('p-multiselect#roles');  // PLURAL

    // ── Buttons panel ─────────────────────────────────────────────────────────
    this.buttonsPanel = page.locator('.buttons-panel.buttons-panel--split');

    // Danger: Suspend (filled danger, no outline)
    this.suspendBtn   = page.locator('button.p-button-danger:not(.p-button-outlined)');
    // Success: Unsuspend (shown when user is already suspended)
    this.unsuspendBtn = page.locator('button.p-button-success');
    // Outlined danger: Delete
    this.deleteBtn    = page.locator('button.p-button-danger.p-button-outlined');
    // Secondary: password reset (first) and cancel (last)
    this.passwordResetBtn = page.locator('button.p-button-secondary').first();
    this.cancelBtn        = page.locator('button.p-button-secondary').last();
    // Submit
    this.saveBtn          = page.locator('button[type="submit"]');

    // ── Inline validation errors ──────────────────────────────────────────────
    this.inlineErrors = page.locator('.p-error, small.p-error');

    // ── Toast ─────────────────────────────────────────────────────────────────
    this.toast        = page.locator('p-toast');
    this.toastMessage = page.locator('p-toast .p-toast-detail, p-toast .p-toast-summary').first();
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Navigate directly to the edit page for a given user UUID.
   * @param {string} uuid
   */
  async gotoUser(uuid) {
    await this.navigate(`/app/users/edit/${uuid}`);
    await this.dismissCookieBanner();
    await this.waitForElement(this.pageContainer, { timeout: 20_000 });
  }

  /** Wait for the edit page to be ready after clicking Edit from the list. */
  async waitForLoad() {
    await this.page.waitForURL(/\/app\/users\/edit\//, { timeout: 15_000 });
    await this.waitForElement(this.pageContainer, { timeout: 15_000 });
    await this.waitForAngular();
  }

  // ---------------------------------------------------------------------------
  // Tab navigation
  // ---------------------------------------------------------------------------

  async clickDetailsTab() { await this.click(this.tab1); }
  async clickRolesTab()   { await this.click(this.tab2); }

  // ---------------------------------------------------------------------------
  // Form helpers
  // ---------------------------------------------------------------------------

  /**
   * Fill editable fields on Tab 1 (Details).
   * uuid and email are read-only on edit — passing them is a no-op.
   */
  async fillForm({
    title,
    firstName,
    middleName,
    lastName,
    jobTitle,
    phone,
    phoneNumber,
    mobile,
  } = {}) {
    if (title !== undefined) {
      await this.titleDropdown.click();
      await this.page.locator('.p-dropdown-item').filter({ hasText: title }).first().click();
    }
    if (firstName  !== undefined) await this.fillAngularInput(this.firstNameInput,  firstName);
    if (middleName !== undefined) await this.fillAngularInput(this.middleNameInput, middleName);
    if (lastName   !== undefined) await this.fillAngularInput(this.lastNameInput,   lastName);
    if (jobTitle   !== undefined) await this.fillAngularInput(this.jobTitleInput,   jobTitle);
    if (phone      !== undefined || phoneNumber !== undefined)
      await this.fillAngularInput(this.phoneInput, phone ?? phoneNumber);
    if (mobile     !== undefined) await this.fillAngularInput(this.mobileInput,     mobile);
  }

  /**
   * Select roles in the multiselect (Tab 2).
   * @param {string[]} roles
   */
  async selectRoles(roles = []) {
    await this.clickRolesTab();
    await this.rolesMultiselect.click();
    for (const role of roles) {
      await this.page.locator('.p-multiselect-item').filter({ hasText: role }).click();
    }
    await this.rolesMultiselect.press('Escape');
  }

  // ---------------------------------------------------------------------------
  // Button actions
  // NOTE: Suspend and Delete are IMMEDIATE — no confirmation dialog
  // ---------------------------------------------------------------------------

  async clickSave()          { await this.click(this.saveBtn); }
  async clickCancel()        { await this.click(this.cancelBtn); }
  async clickSuspend()       { await this.click(this.suspendBtn); }
  async clickUnsuspend()     { await this.click(this.unsuspendBtn); }
  async clickDelete()        { await this.click(this.deleteBtn); }
  async clickPasswordReset() { await this.click(this.passwordResetBtn); }

  // ---------------------------------------------------------------------------
  // State queries
  // ---------------------------------------------------------------------------

  async isSaveDisabled()    { return !(await this.saveBtn.isEnabled()); }
  async isSuspended()       { return this.unsuspendBtn.isVisible(); }
  async getPageTitle()      { return this.getText(this.pageTitle); }

  async getToastText() {
    await this.waitForElement(this.toast, { timeout: 8_000 });
    return this.getText(this.toastMessage);
  }
}

module.exports = { EditUserPage };
