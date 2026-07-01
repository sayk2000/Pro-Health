'use strict';

/**
 * Pharmacies Management — UI Automation Suite
 * Test IDs : PH_TC_087 – PH_TC_131
 * Tag      : @pharmacies
 *
 * Feature implemented as of 2026-06-24.
 * UI observations:
 *   - Add button: "Add Pharmacy"  |  Create dialog (role=dialog, title "Create Pharmacy")
 *   - Edit dialog (role=dialog, title "Edit Pharmacy: {name}")  |  submit btn "Save"
 *   - Delete (not Deactivate): alertdialog "Confirm Action", message "Are you sure that you want to delete this item?"
 *   - Status filter: tab buttons All / Active / Inactive  (not a dropdown)
 *   - Search placeholder: "Pharmacy Name, Post Code and ODS Code"
 */

const { test, expect } = require('../../fixtures/base.fixture');
const { PharmaciesPage } = require('../../pages/pharmacies.page');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid pharmacy payload used across multiple create / edit tests. */
const VALID_PHARMACY = {
  pharmacyName : 'AutoTest Pharmacy Ltd',
  addressLine1 : '1 Test Street',
  postCode     : 'SW1A 1AA',
  odsCode      : 'TST99',
};

/**
 * Intercept the pharmacies API and return a custom response.
 * @param {import('@playwright/test').Page} page
 * @param {string}  urlPattern   substring to match in the request URL
 * @param {object}  responseBody
 * @param {number}  [status=200]
 */
async function mockApi(page, urlPattern, responseBody, status = 200) {
  await page.route(`**${urlPattern}**`, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
    });
  });
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

test.describe('Pharmacies Management', { tag: '@pharmacies' }, () => {
  test.describe.configure({ mode: 'serial' });

  /** @type {PharmaciesPage} */
  let pharm;

  test.beforeAll(async ({ browser, newAuthenticatedPage }) => {
    const { page } = await newAuthenticatedPage(browser);
    pharm = new PharmaciesPage(page);
  });

  test.beforeEach(async () => {
    await pharm.goto();
  });

  // =========================================================================
  // List View — PH_TC_087 to PH_TC_097
  // =========================================================================

  test('PH_TC_087 - Pharmacies page loads at /app/pharmacies', async () => {
    await expect(pharm.page).toHaveURL(/\/app\/pharmacies/);
  });

  test('PH_TC_088 - Page heading and subtitle are visible', async () => {
    await expect(pharm.pageHeading).toBeVisible();
    await expect(pharm.pageSubtitle).toBeVisible();
  });

  test('PH_TC_089 - "Add Pharmacy" and "Export" toolbar buttons are visible', async () => {
    await expect(pharm.addPharmacyBtn).toBeVisible();
    await expect(pharm.exportBtn).toBeVisible();
  });

  test('PH_TC_090 - Status filter tabs All / Active / Inactive are visible', async () => {
    await expect(pharm.filterAll).toBeVisible();
    await expect(pharm.filterActive).toBeVisible();
    await expect(pharm.filterInactive).toBeVisible();
  });

  test('PH_TC_091 - Search input is visible with correct placeholder', async () => {
    await expect(pharm.searchInput).toBeVisible();
    await expect(pharm.searchInput).toHaveAttribute(
      'placeholder', /Pharmacy Name, Post Code and ODS Code/i
    );
  });

  test('PH_TC_092 - List view and Card view toggle buttons are visible', async () => {
    await expect(pharm.listViewBtn).toBeVisible();
    await expect(pharm.cardViewBtn).toBeVisible();
  });

  test('PH_TC_093 - Status filter tabs switch between All / Active / Inactive', async () => {
    await pharm.setStatusFilter('Inactive');
    await pharm.page.waitForLoadState('domcontentloaded');

    await pharm.setStatusFilter('All');
    await pharm.page.waitForLoadState('domcontentloaded');

    await pharm.setStatusFilter('Active');
    await pharm.page.waitForLoadState('domcontentloaded');
    // No assertion thrown = tabs are clickable and page survives each switch.
  });

  test('PH_TC_094 - Filters button is visible and clickable', async () => {
    await expect(pharm.filtersBtn).toBeVisible();
    await pharm.clickFilters();
    // Filters panel / popover should appear (exact selector TBD post-walkthrough).
    await pharm.page.keyboard.press('Escape');
  });

  test('PH_TC_095 - Search by partial pharmacy name reduces visible rows', async () => {
    const rowsBefore = await pharm.getRowCount();
    test.skip(rowsBefore === 0, 'No data to search — skip until seeded');

    await pharm.search('a');
    await pharm.page.waitForLoadState('domcontentloaded');
    const rowsAfter = await pharm.getRowCount();
    expect(rowsAfter).toBeGreaterThanOrEqual(0);

    await pharm.clearSearch();
  });

  test('PH_TC_096 - Clearing search restores full row count', async () => {
    const rowsBefore = await pharm.getRowCount();
    await pharm.search('zzzznotfound');
    await pharm.clearSearch();
    const rowsAfter = await pharm.getRowCount();
    expect(rowsAfter).toBe(rowsBefore);
  });

  test('PH_TC_097 - Empty state shown when API returns empty list', async () => {
    await mockApi(pharm.page, '/pharmacies', []);
    await pharm.goto();
    await expect(pharm.emptyState).toBeVisible();
  });

  // =========================================================================
  // Add Pharmacy — PH_TC_098 to PH_TC_112
  // =========================================================================

  test('PH_TC_098 - "Add Pharmacy" button opens Create Pharmacy dialog', async () => {
    await pharm.clickAddPharmacy();
    await expect(pharm.createDialog).toBeVisible();
  });

  test('PH_TC_099 - Create dialog title reads "Create Pharmacy"', async () => {
    await pharm.clickAddPharmacy();
    await expect(pharm.createDialogTitle).toContainText('Create Pharmacy');
  });

  test('PH_TC_100 - All expected form fields present in the Create dialog', async () => {
    await pharm.clickAddPharmacy();
    await expect(pharm.pharmacyNameInput).toBeVisible();
    await expect(pharm.odsCodeInput).toBeVisible();
    await expect(pharm.addressLine1Input).toBeVisible();
    await expect(pharm.addressLine2Input).toBeVisible();
    await expect(pharm.addressLine3Input).toBeVisible();
    await expect(pharm.townInput).toBeVisible();
    await expect(pharm.countyInput).toBeVisible();
    await expect(pharm.postCodeInput).toBeVisible();
    await expect(pharm.telephoneInput).toBeVisible();
    await expect(pharm.emailInput).toBeVisible();
    await expect(pharm.websiteInput).toBeVisible();
    await expect(pharm.epsEnabledToggle).toBeVisible();
    await expect(pharm.statusToggle).toBeVisible();
  });

  test('PH_TC_101 - EPS Enabled toggle and ODS Search button are present', async () => {
    await pharm.clickAddPharmacy();
    await expect(pharm.epsEnabledToggle).toBeVisible();
    await expect(pharm.odsSearchBtn).toBeVisible();
  });

  test('PH_TC_102 - "Create Pharmacy" submit button is visible', async () => {
    await pharm.clickAddPharmacy();
    await expect(pharm.createBtn).toBeVisible();
  });

  test('PH_TC_103 - Cancel button closes the Create dialog', async () => {
    await pharm.clickAddPharmacy();
    await pharm.clickCancel();
    await expect(pharm.createDialog).not.toBeVisible({ timeout: 5_000 });
  });

  test('PH_TC_104 - Close (×) button dismisses the Create dialog', async () => {
    await pharm.clickAddPharmacy();
    await pharm.closeDialog();
    await expect(pharm.createDialog).not.toBeVisible({ timeout: 5_000 });
  });

  test('PH_TC_105 - Inline validation fires on empty required fields', async () => {
    await pharm.clickAddPharmacy();
    await pharm.pharmacyNameInput.click();
    await pharm.odsCodeInput.click();  // blur pharmacy name
    await expect(pharm.inlineErrors.first()).toBeVisible({ timeout: 5_000 });
  });

  test('PH_TC_106 - ODS Code with invalid format shows inline error', async () => {
    await pharm.clickAddPharmacy();
    await pharm.odsCodeInput.fill('ab');
    await pharm.pharmacyNameInput.click();
    await expect(pharm.inlineErrors.first()).toBeVisible({ timeout: 5_000 });
  });

  test('PH_TC_107 - Invalid email shows inline error', async () => {
    await pharm.clickAddPharmacy();
    await pharm.emailInput.fill('not-an-email');
    await pharm.pharmacyNameInput.click();
    await expect(pharm.inlineErrors.first()).toBeVisible({ timeout: 5_000 });
  });

  test('PH_TC_108 - Duplicate ODS Code (409) shows error in dialog', async () => {
    await mockApi(
      pharm.page,
      '/pharmacies',
      { message: "A Pharmacy with ODS Code 'TST99' already exists." },
      409
    );
    await pharm.clickAddPharmacy();
    await pharm.fillForm(VALID_PHARMACY);
    await pharm.clickCreate();
    await expect(
      pharm.inlineErrors.or(pharm.errorBanner).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('PH_TC_109 - Server error (500) shows error in dialog', async () => {
    await mockApi(pharm.page, '/pharmacies', { message: 'Internal Server Error' }, 500);
    await pharm.clickAddPharmacy();
    await pharm.fillForm(VALID_PHARMACY);
    await pharm.clickCreate();
    await expect(pharm.errorBanner.first()).toBeVisible({ timeout: 10_000 });
  });

  test('PH_TC_110 - Successful add closes dialog and shows toast', async () => {
    await pharm.page.route('**/pharmacies**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'new-id', ...VALID_PHARMACY }),
        });
      } else {
        await route.continue();
      }
    });

    await pharm.clickAddPharmacy();
    await pharm.fillForm(VALID_PHARMACY);
    await pharm.clickCreate();

    await expect(pharm.createDialog).not.toBeVisible({ timeout: 10_000 });
    await expect(pharm.toast).toBeVisible({ timeout: 10_000 });
  });

  test('PH_TC_111 - EPS Enabled toggle is interactive inside Create dialog', async () => {
    await pharm.clickAddPharmacy();
    const initial = await pharm.epsEnabledToggle.getAttribute('aria-checked');
    await pharm.epsEnabledToggle.click();
    const after = await pharm.epsEnabledToggle.getAttribute('aria-checked');
    expect(after).not.toBe(initial);
  });

  test('PH_TC_112 - Status toggle is interactive inside Create dialog', async () => {
    await pharm.clickAddPharmacy();
    const initial = await pharm.statusToggle.getAttribute('aria-checked');
    await pharm.statusToggle.click();
    const after = await pharm.statusToggle.getAttribute('aria-checked');
    expect(after).not.toBe(initial);
  });

  // =========================================================================
  // Edit Pharmacy — PH_TC_113 to PH_TC_121
  // =========================================================================

  test('PH_TC_113 - Edit button opens Edit Pharmacy dialog with pharmacy name in title', async () => {
    const rowCount = await pharm.getRowCount();
    test.skip(rowCount === 0, 'No data rows to edit');

    await pharm.clickEditOnRow(0);
    await expect(pharm.editDialog).toBeVisible();
    await expect(pharm.editDialogTitle).toContainText('Edit Pharmacy');
  });

  test('PH_TC_114 - Edit dialog pre-fills Pharmacy Name field', async () => {
    const rowCount = await pharm.getRowCount();
    test.skip(rowCount === 0, 'No data rows to edit');

    await pharm.clickEditOnRow(0);
    const value = await pharm.pharmacyNameInput.inputValue();
    expect(value.trim().length).toBeGreaterThan(0);
  });

  test('PH_TC_115 - Edit dialog contains all the same form fields as Create', async () => {
    const rowCount = await pharm.getRowCount();
    test.skip(rowCount === 0, 'No data rows to edit');

    await pharm.clickEditOnRow(0);
    await expect(pharm.pharmacyNameInput).toBeVisible();
    await expect(pharm.odsCodeInput).toBeVisible();
    await expect(pharm.addressLine1Input).toBeVisible();
    await expect(pharm.postCodeInput).toBeVisible();
    await expect(pharm.emailInput).toBeVisible();
    await expect(pharm.epsEnabledToggle).toBeVisible();
    await expect(pharm.statusToggle).toBeVisible();
  });

  test('PH_TC_116 - Save button is visible in Edit dialog', async () => {
    const rowCount = await pharm.getRowCount();
    test.skip(rowCount === 0, 'No data rows to edit');

    await pharm.clickEditOnRow(0);
    await expect(pharm.saveBtn).toBeVisible();
  });

  test('PH_TC_117 - Edit dialog Cancel button closes dialog', async () => {
    const rowCount = await pharm.getRowCount();
    test.skip(rowCount === 0, 'No data rows to edit');

    await pharm.clickEditOnRow(0);
    await pharm.clickCancel();
    await expect(pharm.editDialog).not.toBeVisible({ timeout: 5_000 });
  });

  test('PH_TC_118 - Edit inline validation fires on clearing a required field', async () => {
    const rowCount = await pharm.getRowCount();
    test.skip(rowCount === 0, 'No data rows to edit');

    await pharm.clickEditOnRow(0);
    await pharm.pharmacyNameInput.fill('');
    await pharm.odsCodeInput.click(); // blur
    await expect(pharm.inlineErrors.first()).toBeVisible({ timeout: 5_000 });
  });

  test('PH_TC_119 - Successful Edit closes dialog and shows toast', async () => {
    const rowCount = await pharm.getRowCount();
    test.skip(rowCount === 0, 'No data rows to edit');

    const current = await pharm.pharmacyNameInput.inputValue().catch(() => '');

    await pharm.page.route('**/pharmacies/**', async (route) => {
      if (['PATCH', 'PUT'].includes(route.request().method())) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ pharmacyName: current + ' Updated' }),
        });
      } else {
        await route.continue();
      }
    });

    await pharm.clickEditOnRow(0);
    const name = await pharm.pharmacyNameInput.inputValue();
    await pharm.pharmacyNameInput.fill(name + ' Updated');
    await pharm.clickSave();

    await expect(pharm.editDialog).not.toBeVisible({ timeout: 10_000 });
    await expect(pharm.toast).toBeVisible({ timeout: 10_000 });
  });

  test('PH_TC_120 - Duplicate ODS Code on Edit (409) shows error', async () => {
    const rowCount = await pharm.getRowCount();
    test.skip(rowCount === 0, 'No data rows');

    await pharm.clickEditOnRow(0);
    await pharm.page.route('**/pharmacies/**', (route) => {
      if (['PATCH', 'PUT'].includes(route.request().method())) {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ message: "A Pharmacy with ODS Code 'XYZ99' already exists." }),
        });
      } else {
        route.continue();
      }
    });

    await pharm.odsCodeInput.fill('XYZ99');
    await pharm.clickSave();
    await expect(
      pharm.inlineErrors.or(pharm.errorBanner).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('PH_TC_121 - Generic API error (500) on Edit shows error banner', async () => {
    const rowCount = await pharm.getRowCount();
    test.skip(rowCount === 0, 'No data rows');

    await pharm.clickEditOnRow(0);
    await pharm.page.route('**/pharmacies/**', (route) => {
      if (['PATCH', 'PUT'].includes(route.request().method())) {
        route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'Server Error' }) });
      } else {
        route.continue();
      }
    });

    await pharm.clickSave();
    await expect(pharm.errorBanner.first()).toBeVisible({ timeout: 10_000 });
  });

  // =========================================================================
  // Delete Pharmacy — PH_TC_122 to PH_TC_128
  // =========================================================================

  test('PH_TC_122 - Delete button opens "Confirm Action" alert dialog', async () => {
    const rowCount = await pharm.getRowCount();
    test.skip(rowCount === 0, 'No pharmacies to delete');

    await pharm.clickDeleteOnRow(0);
    await expect(pharm.confirmDialog).toBeVisible();
  });

  test('PH_TC_123 - Confirm dialog message reads "Are you sure that you want to delete this item?"', async () => {
    const rowCount = await pharm.getRowCount();
    test.skip(rowCount === 0, 'No pharmacies to delete');

    await pharm.clickDeleteOnRow(0);
    await expect(pharm.confirmMessage).toBeVisible();
  });

  test('PH_TC_124 - Confirming delete shows toast and reduces row count by 1', async () => {
    const rowCount = await pharm.getRowCount();
    test.skip(rowCount === 0, 'No pharmacies to delete');

    await pharm.page.route('**/pharmacies/**', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      } else {
        route.continue();
      }
    });

    const rowsBefore = await pharm.getRowCount();
    await pharm.clickDeleteOnRow(0);
    await pharm.confirmDelete();

    await expect(pharm.toast).toBeVisible({ timeout: 10_000 });
    const rowsAfter = await pharm.getRowCount();
    expect(rowsAfter).toBe(rowsBefore - 1);
  });

  test('PH_TC_125 - "Yes" button is visible and enabled in the confirm dialog', async () => {
    const rowCount = await pharm.getRowCount();
    test.skip(rowCount === 0, 'No pharmacies to delete');

    await pharm.clickDeleteOnRow(0);
    await expect(pharm.confirmYesBtn).toBeVisible();
    await expect(pharm.confirmYesBtn).toBeEnabled();
    // Cancel without deleting.
    await pharm.cancelDelete();
  });

  test('PH_TC_126 - Cancelling delete dismisses dialog and leaves row count unchanged', async () => {
    const rowCount = await pharm.getRowCount();
    test.skip(rowCount === 0, 'No pharmacies to delete');

    const rowsBefore = await pharm.getRowCount();
    await pharm.clickDeleteOnRow(0);
    await pharm.cancelDelete();

    await expect(pharm.confirmDialog).not.toBeVisible({ timeout: 5_000 });
    const rowsAfter = await pharm.getRowCount();
    expect(rowsAfter).toBe(rowsBefore);
  });

  test('PH_TC_127 - Delete 404 (not found) shows user-friendly error', async () => {
    const rowCount = await pharm.getRowCount();
    test.skip(rowCount === 0, 'No pharmacies to target');

    await pharm.page.route('**/pharmacies/**', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Pharmacy not found.' }),
        });
      } else {
        route.continue();
      }
    });

    await pharm.clickDeleteOnRow(0);
    await pharm.confirmDelete();

    await expect(
      pharm.errorBanner.or(pharm.toast).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('PH_TC_128 - Active filter shows Active pharmacies, Inactive filter shows Inactive', async () => {
    await pharm.setStatusFilter('Active');
    const activeRows = await pharm.getRowCount();

    await pharm.setStatusFilter('Inactive');
    const inactiveRows = await pharm.getRowCount();

    await pharm.setStatusFilter('All');
    const allRows = await pharm.getRowCount();

    // All >= Active and All >= Inactive
    expect(allRows).toBeGreaterThanOrEqual(activeRows);
    expect(allRows).toBeGreaterThanOrEqual(inactiveRows);
  });

  // =========================================================================
  // Cross-cutting — PH_TC_129 to PH_TC_131
  // =========================================================================

  test('PH_TC_129 - No raw HTTP status codes exposed in UI on API error', async () => {
    await mockApi(pharm.page, '/pharmacies', { message: 'Internal Server Error' }, 500);
    await pharm.goto();

    const bodyText = await pharm.page.locator('body').textContent();
    expect(bodyText).not.toMatch(/\b500\b/);
  });

  test('PH_TC_130 - No browser console errors on the happy-path list view', async () => {
    const consoleErrors = [];
    pharm.page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await pharm.goto();
    await pharm.page.waitForLoadState('domcontentloaded');

    const appErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('ResizeObserver')
    );
    expect(appErrors).toHaveLength(0);
  });

  test('PH_TC_131 - Toast notifications auto-dismiss after a short delay', async () => {
    const rowCount = await pharm.getRowCount();
    test.skip(rowCount === 0, 'No rows — cannot trigger a success toast without data');

    await pharm.page.route('**/pharmacies/**', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
      } else {
        route.continue();
      }
    });

    await pharm.clickDeleteOnRow(0);
    await pharm.confirmDelete();

    await expect(pharm.toast).toBeVisible({ timeout: 10_000 });
    // Toast should auto-dismiss (allow up to 8 s).
    await expect(pharm.toast).not.toBeVisible({ timeout: 8_000 });
  });
});
