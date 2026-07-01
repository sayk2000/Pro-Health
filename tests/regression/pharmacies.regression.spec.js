'use strict';

const { test, expect } = require('../../fixtures/base.fixture');
const { PharmaciesPage } = require('../../pages/pharmacies.page');

const VALID_PHARMACY = {
  pharmacyName: 'Regression Pharmacy Ltd',
  addressLine1: '1 Regression Road',
  town: 'London',
  postCode: 'SW1A 1AA',
  odsCode: 'RPH01',
};

test.describe('Regression - Pharmacies Module', { tag: ['@regression', '@pharmacies'] }, () => {
  test.describe.configure({ mode: 'serial' });

  let pharm;

  test.beforeAll(async ({ browser, newAuthenticatedPage }) => {
    const { page } = await newAuthenticatedPage(browser);
    pharm = new PharmaciesPage(page);
  });

  test.beforeEach(async () => {
    await pharm.goto();
  });

  test('PHARM_REG_P_001 - Pharmacy list loads with core controls', async () => {
    await expect(pharm.page).toHaveURL(/\/app\/pharmacies/);
    await expect(pharm.addPharmacyBtn).toBeVisible();
    await expect(pharm.exportBtn).toBeVisible();
    await expect(pharm.searchInput).toBeVisible();
    await expect(pharm.filterAll).toBeVisible();
    await expect(pharm.filterActive).toBeVisible();
    await expect(pharm.filterInactive).toBeVisible();
  });

  test('PHARM_REG_P_002 - Search, status tabs, filters, and view toggles are usable', async () => {
    await pharm.search('pharmacy');
    await expect(pharm.table.or(pharm.emptyMessage)).toBeVisible();
    await pharm.clearSearch();

    await pharm.setStatusFilter('Inactive');
    await expect(pharm.table.or(pharm.emptyMessage)).toBeVisible();
    await pharm.setStatusFilter('All');

    await pharm.openFilterPanel();
    await expect(pharm.filterPanel).toBeVisible();
    await pharm.clearFilters();

    await pharm.switchToCardView();
    await expect(pharm.cardsGrid.or(pharm.cards.first())).toBeVisible({ timeout: 10_000 });
    await pharm.switchToListView();
    await expect(pharm.table).toBeVisible({ timeout: 10_000 });
  });

  test('PHARM_REG_P_003 - Add Pharmacy success shows toast and closes panel', async () => {
    await pharm.page.route('**/pharmacies**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'reg-pharm-id', ...VALID_PHARMACY }),
        });
      } else {
        await route.continue();
      }
    });

    await pharm.clickAddPharmacy();
    await pharm.fillForm(VALID_PHARMACY);
    await pharm.clickCreate();

    await expect(pharm.toast).toBeVisible({ timeout: 10_000 });
    await expect(pharm.createDialog).toBeHidden({ timeout: 10_000 });
    await pharm.page.unroute('**/pharmacies**');
  });

  test('PHARM_REG_N_001 - Add Pharmacy validates required and formatted fields', async () => {
    await pharm.clickAddPharmacy();
    await pharm.fillAngularInput(pharm.postCodeInput, 'INVALID');
    await pharm.fillAngularInput(pharm.emailInput, 'not-an-email');
    await pharm.clickCreate();

    await expect(pharm.inlineErrors.first()).toBeVisible({ timeout: 10_000 });
    await pharm.clickCancel();
  });

  test('PHARM_REG_N_002 - Duplicate ODS code surfaces user feedback', async () => {
    await pharm.page.route('**/pharmacies**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ message: "A Pharmacy with ODS Code 'RPH01' already exists." }),
        });
      } else {
        await route.continue();
      }
    });

    await pharm.clickAddPharmacy();
    await pharm.fillForm(VALID_PHARMACY);
    await pharm.clickCreate();

    await expect(pharm.errorBanner.or(pharm.inlineErrors.first()).or(pharm.toast)).toBeVisible({ timeout: 10_000 });
    await pharm.page.unroute('**/pharmacies**');
    await pharm.clickCancel().catch(() => {});
  });

  test('PHARM_REG_N_003 - Delete API failure keeps the module recoverable', async () => {
    const rowCount = await pharm.getRowCount();
    test.skip(rowCount === 0, 'No pharmacy rows available to delete');

    await pharm.page.route('**/pharmacies/**', async (route) => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Pharmacy not found.' }),
        });
      } else {
        await route.continue();
      }
    });

    await pharm.clickDeleteOnRow(0);
    await pharm.confirmDelete();
    await expect(pharm.errorBanner.or(pharm.toast)).toBeVisible({ timeout: 10_000 });
    await pharm.page.unroute('**/pharmacies/**');
  });
});
