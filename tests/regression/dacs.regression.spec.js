'use strict';

const { test, expect } = require('../../fixtures/base.fixture');
const { DacsPage } = require('../../pages/dacs.page');

const VALID_DAC = {
  dacName: 'Regression DAC Ltd',
  address1: '10 Regression Street',
  postCode: 'EC1A 1BB',
  odsCode: 'RDAC01',
};

test.describe('Regression - DACs Module', { tag: ['@regression', '@dacs'] }, () => {
  test.describe.configure({ mode: 'serial' });

  let dacs;

  test.beforeAll(async ({ browser, newAuthenticatedPage }) => {
    const { page } = await newAuthenticatedPage(browser);
    dacs = new DacsPage(page);
  });

  test.beforeEach(async () => {
    await dacs.goto();
  });

  test('DAC_REG_P_001 - DAC list loads with core controls', async () => {
    await expect(dacs.page).toHaveURL(/\/app\/dacs/);
    await expect(dacs.addDacBtn).toBeVisible();
    await expect(dacs.exportBtn).toBeVisible();
    await expect(dacs.searchInput).toBeVisible();
    await expect(dacs.tabAll).toBeVisible();
    await expect(dacs.tabActive).toBeVisible();
    await expect(dacs.tabInactive).toBeVisible();
  });

  test('DAC_REG_P_002 - Search, clear, filters, and view toggles are usable', async () => {
    await dacs.search('dac');
    await expect(dacs.table.or(dacs.emptyMessage)).toBeHidden();
    await dacs.clearSearch();

    await dacs.openFilterPanel();
    await expect(dacs.filterPanel).toBeVisible();
    await dacs.clearFilters();

    await dacs.switchToCardView();
    await expect(dacs.cardsGrid.or(dacs.cards.first())).toBeVisible({ timeout: 10_000 });
    await dacs.switchToListView();
    await expect(dacs.table).toBeVisible({ timeout: 10_000 });
  });

  test('DAC_REG_P_003 - Add DAC success shows toast and closes panel', async () => {
    await dacs.page.route('**/api/dacs', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'reg-dac-id', ...VALID_DAC }),
        });
      } else {
        await route.continue();
      }
    });

    await dacs.clickNewDac();
    await dacs.fillAddForm(VALID_DAC);
    await dacs.clickSave();

    await expect(dacs.toast).toBeVisible({ timeout: 10_000 });
    await expect(dacs.panel).toBeHidden({ timeout: 10_000 });
    await dacs.page.unroute('**/api/dacs');
  });

  test('DAC_REG_N_001 - Add DAC validates required and formatted fields', async () => {
    await dacs.clickNewDac();
    await dacs.fillAngularInput(dacs.postCodeInput, 'INVALID');
    await dacs.fillAngularInput(dacs.emailInput, 'not-an-email');
    await dacs.fillAngularInput(dacs.websiteInput, 'not-a-url');
    await dacs.clickSave();

    await expect(dacs.inlineErrors.first()).toBeVisible({ timeout: 10_000 });
    await dacs.clickCancel();
  });

  test('DAC_REG_N_002 - Duplicate ODS code surfaces user feedback', async () => {
    await dacs.page.route('**/api/dacs', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({ message: "A DAC with ODS Code 'RDAC01' already exists." }),
        });
      } else {
        await route.continue();
      }
    });

    await dacs.clickNewDac();
    await dacs.fillAddForm(VALID_DAC);
    await dacs.clickSave();

    await expect(dacs.panelBanner.or(dacs.toast).or(dacs.inlineErrors.first())).toBeVisible({ timeout: 10_000 });
    await dacs.page.unroute('**/api/dacs');
    await dacs.clickCancel().catch(() => {});
  });

  test('DAC_REG_N_003 - Deactivate API failure keeps the module recoverable', async () => {
    const rowCount = await dacs.getRowCount();
    test.skip(rowCount === 0, 'No DAC rows available to deactivate');

    await dacs.page.route('**/api/dacs/**', async (route) => {
      if (['DELETE', 'PATCH'].includes(route.request().method())) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'DAC not found or already deactivated.' }),
        });
      } else {
        await route.continue();
      }
    });

    await dacs.clickDeactivateOnRow(0);
    await dacs.confirmDeactivation();
    await expect(dacs.toast.or(dacs.panelBanner)).toBeVisible({ timeout: 10_000 });
    await dacs.page.unroute('**/api/dacs/**');
  });
});
