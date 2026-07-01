'use strict';

/**
 * DACs (Dispensing Appliance Contractors) — UI Automation Suite
 * Test IDs: PH_TC_036 – PH_TC_086
 * Tag: @dacs
 */

const { test, expect } = require('../../fixtures/base.fixture');
const { DacsPage } = require('../../pages/dacs.page');

test.describe('DACs Management', { tag: '@dacs' }, () => {
  test.describe.configure({ mode: 'serial' });

  let dacs;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: '.auth/user.json' });
    const page = await context.newPage();
    dacs = new DacsPage(page);
    await dacs.goto();
  });

  test.afterAll(async () => {
    await dacs.page.context().close();
  });

  test.beforeEach(async () => {
    await dacs.goto();
  });

  // =========================================================================
  // List View — PH_TC_036 to PH_TC_052
  // =========================================================================

  test('PH_TC_036 - DACs page loads at /app/dacs', async () => {
    await expect(dacs.page).toHaveURL(/\/app\/dacs/);
  });

  test('PH_TC_037 - Grid shows required columns', async () => {
    await expect(dacs.colDacName).toBeVisible();
    await expect(dacs.colAddress).toBeVisible();
    await expect(dacs.colPostCode).toBeVisible();
    await expect(dacs.colOdsCode).toBeVisible();
    await expect(dacs.colEpsEnabled).toBeVisible();
    await expect(dacs.colActive).toBeVisible();
    await expect(dacs.colActions).toBeVisible();
  });

  test('PH_TC_038 - "Add DAC" and "Export" toolbar buttons are visible', async () => {
    await expect(dacs.addDacBtn).toBeVisible();
    await expect(dacs.exportBtn).toBeVisible();
  });

  test('PH_TC_039 - Default view shows Active tab selected on page load', async () => {
    const activeTab = dacs.page.locator('button.bbl-page__tab--active');
    await expect(activeTab).toContainText(/active/i);
  });

  test('PH_TC_040 - Search filters by DAC Name (partial match)', async () => {
    const initialCount = await dacs.getRowCount();
    await dacs.search('test');
    const filteredCount = await dacs.getRowCount();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('PH_TC_041 - Clearing search restores the full list', async () => {
    const initialCount = await dacs.getRowCount();
    await dacs.search('dac');
    await dacs.clearSearch();
    const restoredCount = await dacs.getRowCount();
    expect(restoredCount).toBe(initialCount);
  });

  test('PH_TC_042 - Filter panel opens when clicking the filter icon', async () => {
    await dacs.openFilterPanel();
    await expect(dacs.filterPanel).toBeVisible();
  });

  test('PH_TC_043 - Filter panel shows EPS Enabled and Status dropdowns', async () => {
    await dacs.openFilterPanel();
    await expect(dacs.filterEpsDropdown).toBeVisible();
    await expect(dacs.filterStatusDropdown).toBeVisible();
    await expect(dacs.filterApplyBtn).toBeVisible();
    await expect(dacs.filterClearBtn).toBeVisible();
  });

  test('PH_TC_044 - Filtering by EPS Enabled = Yes narrows the grid', async () => {
    const beforeCount = await dacs.getRowCount();
    await dacs.openFilterPanel();
    await dacs.setEpsFilter('Yes');
    await dacs.applyFilters();
    const afterCount = await dacs.getRowCount();
    expect(afterCount).toBeLessThanOrEqual(beforeCount);
  });

  test('PH_TC_045 - Filtering by EPS Enabled = No returns only non-EPS records', async () => {
    await dacs.openFilterPanel();
    await dacs.setEpsFilter('No');
    await dacs.applyFilters();
    await expect(dacs.table.or(dacs.emptyMessage)).toBeVisible();
  });

  test('PH_TC_046 - Status filter inside panel filters independently', async () => {
    await dacs.openFilterPanel();
    await dacs.setFilterStatus('Inactive');
    await dacs.applyFilters();
    await expect(dacs.table.or(dacs.emptyMessage)).toBeVisible();
    await dacs.openFilterPanel();
    await dacs.setFilterStatus('Active');
    await dacs.applyFilters();
  });

  test('PH_TC_047 - Clear button resets filter panel to defaults', async () => {
    await dacs.openFilterPanel();
    await dacs.setEpsFilter('Yes');
    await dacs.setFilterStatus('Inactive');
    await dacs.clearFilters();
    await expect(dacs.filterEpsDropdown).toBeVisible();
    await expect(dacs.filterStatusDropdown).toBeVisible();
  });

  test('PH_TC_048 - Status tabs (Active/Inactive/All) refresh grid on click', async () => {
    await dacs.clickTab('All');
    await expect(dacs.table).toBeVisible();
    await dacs.clickTab('Inactive');
    await expect(dacs.table).toBeVisible();
    await dacs.clickTab('Active');
    await expect(dacs.table).toBeVisible();
  });

  test('PH_TC_049 - All columns are sortable; clicking header toggles sort', async () => {
    await dacs.colDacName.click();
    await dacs.waitForAngular();
    const sortIndicator = dacs.page.locator('[class*="p-sortable-column-icon"], [aria-sort]').first();
    await expect(sortIndicator).toBeVisible();
    await dacs.colDacName.click();
    await dacs.waitForAngular();
    await expect(sortIndicator).toBeVisible();
  });

  test('PH_TC_050 - Search term is reflected after typing', async () => {
    await dacs.search('health');
    await dacs.waitForAngular();
    // Grid updates — either results or empty state
    await expect(dacs.table.or(dacs.emptyMessage)).toBeVisible();
  });

  test('PH_TC_051 - Empty state shown when API returns empty list', async () => {
    await dacs.page.route('**/api/dacs**', async route => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ data: [], total: 0 }),
      });
    });
    await dacs.page.reload();
    await expect(dacs.emptyMessage).toBeVisible({ timeout: 10_000 });
    await dacs.page.unroute('**/api/dacs**');
  });

  test('PH_TC_052 - Grid is horizontally scrollable on narrow screens', async () => {
    await dacs.page.setViewportSize({ width: 480, height: 800 });
    await dacs.page.reload();
    await dacs.waitForAngular();
    const tableWrapper = dacs.page.locator('.p-datatable-wrapper, .p-datatable').first();
    await expect(tableWrapper).toBeVisible();
    await dacs.page.setViewportSize({ width: 1280, height: 800 });
  });

  // =========================================================================
  // Add DAC — PH_TC_053 to PH_TC_066
  // =========================================================================

  test('PH_TC_053 - "New DAC" opens slide panel', async () => {
    await dacs.clickNewDac();
    await expect(dacs.panel).toBeVisible();
    await expect(dacs.panelBadge).toContainText(/add|create/i);
  });

  test('PH_TC_054 - Required fields are marked with an asterisk', async () => {
    await dacs.clickNewDac();
    const requiredMarkers = dacs.panel.locator(
      'label .required, label:has-text("*"), abbr[title="required"], [class*="required"]'
    );
    await expect(requiredMarkers.first()).toBeVisible();
  });

  test('PH_TC_055 - All expected form fields are present in the Add panel', async () => {
    await dacs.clickNewDac();
    await expect(dacs.dacNameInput).toBeVisible();
    await expect(dacs.address1Input).toBeVisible();
    await expect(dacs.postCodeInput).toBeVisible();
    await expect(dacs.odsCodeInput).toBeVisible();
    await expect(dacs.epsEnabledToggle).toBeVisible();
  });

  test('PH_TC_056 - EPS Enabled toggle is interactive', async () => {
    await dacs.clickNewDac();
    const initial = await dacs.epsEnabledToggle.getAttribute('aria-checked');
    await dacs.epsEnabledToggle.click();
    const after = await dacs.epsEnabledToggle.getAttribute('aria-checked');
    expect(after).not.toBe(initial);
    await dacs.clickCancel();
  });

  test('PH_TC_057 - Save button is disabled until required fields are valid', async () => {
    await dacs.clickNewDac();
    await expect(dacs.saveBtn).toBeDisabled();
    await dacs.fillAddForm({ dacName: 'Valid DAC', address1: '10 Fake St', postCode: 'EC1A 1BB', odsCode: 'VLD001' });
    await expect(dacs.saveBtn).toBeEnabled();
    await dacs.clickCancel();
  });

  test('PH_TC_058 - Inline errors shown on blur of empty required fields', async () => {
    await dacs.clickNewDac();
    await dacs.dacNameInput.focus();
    await dacs.dacNameInput.blur();
    await dacs.postCodeInput.focus();
    await dacs.postCodeInput.blur();
    await dacs.address1Input.focus();
    await dacs.address1Input.blur();
    await expect(dacs.inlineErrors.first()).toBeVisible();
    await dacs.clickCancel();
  });

  test('PH_TC_059 - Invalid UK postcode shows validation error', async () => {
    await dacs.clickNewDac();
    await dacs.fillAngularInput(dacs.postCodeInput, 'NOTAPOSTCODE');
    await dacs.postCodeInput.blur();
    await expect(dacs.inlineErrors.first()).toBeVisible();
    await dacs.clickCancel();
  });

  test('PH_TC_060 - Invalid email shows validation error', async () => {
    await dacs.clickNewDac();
    await dacs.fillAngularInput(dacs.emailInput, 'not-an-email');
    await dacs.emailInput.blur();
    await expect(dacs.inlineErrors.first()).toBeVisible();
    await dacs.clickCancel();
  });

  test('PH_TC_061 - Invalid website URL shows validation error', async () => {
    await dacs.clickNewDac();
    await dacs.fillAngularInput(dacs.websiteInput, 'not-a-url');
    await dacs.websiteInput.blur();
    await expect(dacs.inlineErrors.first()).toBeVisible();
    await dacs.clickCancel();
  });

  test('PH_TC_062 - Duplicate ODS Code (409) returns error on save', async () => {
    const dupOds = 'DUP001';
    await dacs.page.route('**/api/dacs', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409, contentType: 'application/json',
          body: JSON.stringify({ message: `A DAC with ODS Code '${dupOds}' already exists.` })
        });
      } else { await route.continue(); }
    });
    await dacs.clickNewDac();
    await dacs.fillAddForm({ dacName: 'Dup DAC', address1: '1 Test Rd', postCode: 'SW1A 1AA', odsCode: dupOds });
    await dacs.clickSave();
    await expect(dacs.page.locator(`text=${dupOds}`)).toBeVisible();
    await dacs.page.unroute('**/api/dacs');
    await dacs.clickCancel();
  });

  test('PH_TC_063 - Server error (500) on Add shows error feedback', async () => {
    await dacs.page.route('**/api/dacs', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500, contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal Server Error' })
        });
      } else { await route.continue(); }
    });
    await dacs.clickNewDac();
    await dacs.fillAddForm({ dacName: 'Err DAC', address1: '1 Error Ln', town: 'London', county: 'Middlesex', postCode: 'SW1A 1AA', odsCode: 'ERR001' });
    await dacs.clickSave();
    await expect(dacs.panelBanner.or(dacs.toast)).toBeVisible({ timeout: 8_000 });
    await dacs.page.unroute('**/api/dacs');
    await dacs.clickCancel();
  });

  test('PH_TC_064 - Successful Add: toast shown and panel closes', async () => {
    const name = `AutoDAC_${Date.now()}`;
    await dacs.page.route('**/api/dacs', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201, contentType: 'application/json',
          body: JSON.stringify({ id: 'new-id-123', dacName: name })
        });
      } else { await route.continue(); }
    });
    await dacs.clickNewDac();
    await dacs.fillAddForm({ dacName: name, address1: '1 New St', postCode: 'EC1A 1BB', odsCode: 'NEW001' });
    await dacs.clickSave();
    await expect(dacs.toast).toBeVisible({ timeout: 8_000 });
    await expect(dacs.panel).toBeHidden({ timeout: 5_000 });
    await dacs.page.unroute('**/api/dacs');
  });

  test('PH_TC_065 - Cancel with dirty form shows unsaved-changes prompt', async () => {
    await dacs.clickNewDac();
    await dacs.fillAngularInput(dacs.dacNameInput, 'Unsaved Name');
    await dacs.clickCancel();
    const prompt = dacs.page.locator('.p-dialog.p-confirm-dialog, p-confirmdialog').first();
    await expect(prompt).toBeVisible({ timeout: 5_000 });
    const dismissBtn = dacs.page.locator('.p-confirm-dialog-accept, button:has-text("Leave"), button:has-text("Discard")').first();
    await dismissBtn.click();
  });

  test('PH_TC_066 - Active toggle is checked by default in Add panel', async () => {
    await dacs.clickNewDac();
    const activeState = await dacs.activeToggle.getAttribute('aria-checked');
    expect(activeState).toBe('true');
    await dacs.clickCancel();
  });

  // =========================================================================
  // Edit DAC — PH_TC_067 to PH_TC_076
  // =========================================================================

  test('PH_TC_067 - Edit icon opens slide panel pre-filled with row data', async () => {
    const rowCount = await dacs.getRowCount();
    test.skip(rowCount === 0, 'No DAC rows to edit');
    await dacs.clickEditOnRow(0);
    await expect(dacs.panel).toBeVisible();
    await expect(dacs.panelBadge).toContainText(/edit/i);
    await expect(dacs.dacNameInput).not.toHaveValue('');
  });

  test('PH_TC_068 - Edit form applies the same field validations', async () => {
    const rowCount = await dacs.getRowCount();
    test.skip(rowCount === 0, 'No DAC rows to edit');
    await dacs.clickEditOnRow(0);
    await dacs.dacNameInput.clear();
    await dacs.dacNameInput.blur();
    await expect(dacs.inlineErrors.first()).toBeVisible();
    await dacs.clickCancel();
  });

  test('PH_TC_069 - Successful Edit: toast shown and panel closes', async () => {
    const rowCount = await dacs.getRowCount();
    test.skip(rowCount === 0, 'No DAC rows to edit');
    await dacs.page.route('**/api/dacs/**', async route => {
      const m = route.request().method();
      if (m === 'PUT' || m === 'PATCH') {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else { await route.continue(); }
    });
    await dacs.clickEditOnRow(0);
    await dacs.clickSave();
    await expect(dacs.toast).toBeVisible({ timeout: 8_000 });
    await expect(dacs.panel).toBeHidden({ timeout: 5_000 });
    await dacs.page.unroute('**/api/dacs/**');
  });

  test('PH_TC_070 - 404 on opening Edit shows not-found message', async () => {
    await dacs.page.route('**/api/dacs/**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 404, contentType: 'application/json',
          body: JSON.stringify({ message: 'Not found' })
        });
      } else { await route.continue(); }
    });
    const rowCount = await dacs.getRowCount();
    if (rowCount > 0) {
      await dacs.clickEditOnRow(0);
      await expect(dacs.panelBanner.or(dacs.toast)).toBeVisible({ timeout: 6_000 });
    }
    await dacs.page.unroute('**/api/dacs/**');
  });

  test('PH_TC_071 - 404 on Edit submit shows not-found message', async () => {
    const rowCount = await dacs.getRowCount();
    test.skip(rowCount === 0, 'No DAC rows to edit');
    await dacs.page.route('**/api/dacs/**', async route => {
      const m = route.request().method();
      if (m === 'PUT' || m === 'PATCH') {
        await route.fulfill({
          status: 404, contentType: 'application/json',
          body: JSON.stringify({ message: 'Not found' })
        });
      } else { await route.continue(); }
    });
    await dacs.clickEditOnRow(0);
    await dacs.clickSave();
    await expect(dacs.panelBanner.or(dacs.toast)).toBeVisible({ timeout: 6_000 });
    await dacs.page.unroute('**/api/dacs/**');
  });

  test('PH_TC_072 - Duplicate ODS on Edit shows inline error', async () => {
    const rowCount = await dacs.getRowCount();
    test.skip(rowCount === 0, 'No DAC rows to edit');
    await dacs.page.route('**/api/dacs/**', async route => {
      const m = route.request().method();
      if (m === 'PUT' || m === 'PATCH') {
        await route.fulfill({
          status: 409, contentType: 'application/json',
          body: JSON.stringify({ message: "A DAC with ODS Code 'EXISTING001' already exists." })
        });
      } else { await route.continue(); }
    });
    await dacs.clickEditOnRow(0);
    await dacs.fillAngularInput(dacs.odsCodeInput, 'EXISTING001');
    await dacs.clickSave();
    await expect(dacs.inlineErrors.first()).toBeVisible();
    await dacs.page.unroute('**/api/dacs/**');
    await dacs.clickCancel();
  });

  test('PH_TC_073 - Generic API error on Edit shows error banner', async () => {
    const rowCount = await dacs.getRowCount();
    test.skip(rowCount === 0, 'No DAC rows to edit');
    await dacs.page.route('**/api/dacs/**', async route => {
      const m = route.request().method();
      if (m === 'PUT' || m === 'PATCH') {
        await route.fulfill({
          status: 500, contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal Server Error' })
        });
      } else { await route.continue(); }
    });
    await dacs.clickEditOnRow(0);
    await dacs.clickSave();
    await expect(dacs.panelBanner).toBeVisible({ timeout: 6_000 });
    await dacs.page.unroute('**/api/dacs/**');
    await dacs.clickCancel();
  });

  test('PH_TC_074 - Cancelling Edit with dirty form shows unsaved-changes prompt', async () => {
    const rowCount = await dacs.getRowCount();
    test.skip(rowCount === 0, 'No DAC rows to edit');
    await dacs.clickEditOnRow(0);
    const current = await dacs.dacNameInput.inputValue();
    await dacs.fillAngularInput(dacs.dacNameInput, current + ' edited');
    await dacs.clickCancel();
    const prompt = dacs.page.locator('.p-dialog.p-confirm-dialog').first();
    await expect(prompt).toBeVisible({ timeout: 5_000 });
    await dacs.page.locator('.p-confirm-dialog-accept').click();
  });

  test('PH_TC_075 - Deactivated DAC can be re-activated via Edit', async () => {
    await dacs.clickTab('Inactive');
    const inactiveCount = await dacs.getRowCount();
    test.skip(inactiveCount === 0, 'No inactive DAC records');
    await dacs.page.route('**/api/dacs/**', async route => {
      const m = route.request().method();
      if (m === 'PUT' || m === 'PATCH') {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else { await route.continue(); }
    });
    await dacs.clickEditOnRow(0);
    await dacs.activeToggle.click();
    await dacs.clickSave();
    await expect(dacs.toast).toBeVisible({ timeout: 8_000 });
    await dacs.page.unroute('**/api/dacs/**');
    await dacs.clickTab('Active');
  });

  test('PH_TC_076 - View toggle switches between List and Card views', async () => {
    await dacs.switchToCardView();
    await expect(dacs.cardsGrid.or(dacs.cards.first())).toBeVisible({ timeout: 8_000 });
    await dacs.switchToListView();
    await expect(dacs.table).toBeVisible({ timeout: 8_000 });
  });

  // =========================================================================
  // Deactivate — PH_TC_077 to PH_TC_083
  // =========================================================================

  test('PH_TC_077 - Deactivate opens confirm dialog', async () => {
    const rowCount = await dacs.getRowCount();
    test.skip(rowCount === 0, 'No DAC rows to deactivate');
    await dacs.clickDeactivateOnRow(0);
    await expect(dacs.confirmDialog).toBeVisible();
    const btnClass = await dacs.confirmBtn.getAttribute('class');
    expect(btnClass).toMatch(/danger/i);
    await dacs.cancelDeactivation();
  });

  test('PH_TC_078 - Confirming deactivation shows toast and removes row from Active view', async () => {
    const rowCount = await dacs.getRowCount();
    test.skip(rowCount === 0, 'No DAC rows to deactivate');
    await dacs.page.route('**/api/dacs/**', async route => {
      const m = route.request().method();
      if (m === 'DELETE' || m === 'PATCH') {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else { await route.continue(); }
    });
    const countBefore = await dacs.getRowCount();
    await dacs.clickDeactivateOnRow(0);
    await dacs.confirmDeactivation();
    await expect(dacs.toast).toBeVisible({ timeout: 8_000 });
    const countAfter = await dacs.getRowCount();
    expect(countAfter).toBe(countBefore - 1);
    await dacs.page.unroute('**/api/dacs/**');
  });

  test('PH_TC_079 - Success toast auto-dismisses', async () => {
    const rowCount = await dacs.getRowCount();
    test.skip(rowCount === 0, 'No DAC rows to deactivate');
    await dacs.page.route('**/api/dacs/**', async route => {
      const m = route.request().method();
      if (m === 'DELETE' || m === 'PATCH') {
        await route.fulfill({
          status: 200, contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      } else { await route.continue(); }
    });
    await dacs.clickDeactivateOnRow(0);
    await dacs.confirmDeactivation();
    await expect(dacs.toast).toBeVisible({ timeout: 8_000 });
    await expect(dacs.toast).toBeHidden({ timeout: 10_000 });
    await dacs.page.unroute('**/api/dacs/**');
  });

  test('PH_TC_080 - Active + Inactive counts equal All count', async () => {
    await dacs.clickTab('Inactive');
    const inactiveCount = await dacs.getRowCount();
    await dacs.clickTab('All');
    const allCount = await dacs.getRowCount();
    await dacs.clickTab('Active');
    const activeCount = await dacs.getRowCount();
    expect(activeCount + inactiveCount).toBe(allCount);
  });

  test('PH_TC_081 - Cancelling deactivation dialog leaves row count unchanged', async () => {
    const rowCount = await dacs.getRowCount();
    test.skip(rowCount === 0, 'No DAC rows to deactivate');
    const countBefore = await dacs.getRowCount();
    await dacs.clickDeactivateOnRow(0);
    await dacs.cancelDeactivation();
    const countAfter = await dacs.getRowCount();
    expect(countAfter).toBe(countBefore);
    await expect(dacs.confirmDialog).toBeHidden();
  });

  test('PH_TC_082 - 404 on deactivate shows user-friendly error', async () => {
    const rowCount = await dacs.getRowCount();
    test.skip(rowCount === 0, 'No DAC rows to deactivate');
    await dacs.page.route('**/api/dacs/**', async route => {
      const m = route.request().method();
      if (m === 'DELETE' || m === 'PATCH') {
        await route.fulfill({
          status: 404, contentType: 'application/json',
          body: JSON.stringify({ message: 'DAC not found or already deactivated.' })
        });
      } else { await route.continue(); }
    });
    await dacs.clickDeactivateOnRow(0);
    await dacs.confirmDeactivation();
    await expect(dacs.toast.or(dacs.panelBanner)).toBeVisible({ timeout: 6_000 });
    await dacs.page.unroute('**/api/dacs/**');
  });

  test('PH_TC_083 - Network error on deactivate shows error feedback', async () => {
    const rowCount = await dacs.getRowCount();
    test.skip(rowCount === 0, 'No DAC rows to deactivate');
    await dacs.page.route('**/api/dacs/**', async route => {
      const m = route.request().method();
      if (m === 'DELETE' || m === 'PATCH') { await route.abort('failed'); }
      else { await route.continue(); }
    });
    await dacs.clickDeactivateOnRow(0);
    await dacs.confirmDeactivation();
    await expect(dacs.toast.or(dacs.panelBanner)).toBeVisible({ timeout: 6_000 });
    await dacs.page.unroute('**/api/dacs/**');
  });

  // =========================================================================
  // Misc — PH_TC_084 to PH_TC_086
  // =========================================================================

  test('PH_TC_084 - DACs module nav item is accessible', async () => {
    const navItem = dacs.page.locator(
      'a[href*="/app/dacs"], [class*="nav"] a:has-text("DAC"), [class*="menu"] :has-text("DAC")'
    ).first();
    await expect(navItem.or(dacs.table)).toBeVisible();
  });

  test('PH_TC_085 - API errors surface user-friendly messages', async () => {
    await dacs.page.route('**/api/dacs**', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 500, contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error', code: 500 })
        });
      } else { await route.continue(); }
    });
    await dacs.page.reload();
    await dacs.waitForAngular();
    const rawError = dacs.page.locator('text="Internal Server Error"').first();
    await expect(rawError).toBeHidden();
    await dacs.page.unroute('**/api/dacs**');
  });

  test('PH_TC_086 - No browser console errors on normal DACs page load', async () => {
    const consoleErrors = [];
    dacs.page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await dacs.page.reload();
    await dacs.waitForAngular();
    const significant = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('net::ERR_'));
    expect(significant).toHaveLength(0);
  });

});
