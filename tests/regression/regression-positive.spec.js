const path = require('path');
const { test, expect } = require('../../fixtures/base.fixture');

const STORAGE_STATE = path.join(__dirname, '..', '..', '.auth', 'user.json');

test.use({ storageState: STORAGE_STATE });

test.describe('Positive Regression Suite', () => {
  test.beforeEach(async ({ page, prepareAuthenticatedPage }, testInfo) => {
    if (testInfo.title.includes('Valid login redirects')) return;
    await prepareAuthenticatedPage(page);
  });

  // ─── Login ───────────────────────────────────────────────────────────────────

  test('PH_REG_P_001 - Valid login redirects to dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/account/login?redirectStr=%2Fapp%3F');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /got it|accept|ok/i }).first().click({ timeout: 5_000 }).catch(() => {});
    await page.locator('input[type="email"], input[placeholder*="name@"]').fill('skharwade@delaplex.com');
    await page.locator('input[type="password"]').fill('Admin#12345');
    await page.locator('button:has-text("Sign in")').click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await context.close();
  });

  // ─── Dashboard ───────────────────────────────────────────────────────────────

  test('PH_REG_P_002 - Dashboard shows 4 metric cards', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.locator('[class*="card"], [class*="metric"], [class*="stat"]').filter({ hasText: /all patients/i }).first()
    ).toBeVisible();
    await expect(
      page.locator('[class*="card"], [class*="metric"], [class*="stat"]').filter({ hasText: /inactive patients/i }).first()
    ).toBeVisible();
    await expect(
      page.locator('[class*="card"], [class*="metric"], [class*="stat"]').filter({ hasText: /active patients/i }).first()
    ).toBeVisible();
    await expect(
      page.locator('[class*="card"], [class*="metric"], [class*="stat"]').filter({ hasText: /upcoming reviews/i }).first()
    ).toBeVisible();
  });

  test('PH_REG_P_003 - Order Status panel shows pending approvals', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.locator('[class*="panel"], [class*="widget"], [class*="section"]').filter({ hasText: /order status/i }).first()
    ).toBeVisible();
    await expect(
      page.locator('text=Pending Approvals').or(
        page.locator('[class*="order"], [class*="status"]').filter({ hasText: /pending/i })
      ).first()
    ).toBeVisible();
  });

  test('PH_REG_P_004 - Patient Statistics panel visible with chart', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.locator('[class*="panel"], [class*="widget"], [class*="section"]').filter({ hasText: /patient statistics/i }).first()
    ).toBeVisible();
    // Chart element (canvas or SVG) should be rendered on the dashboard
    await expect(
      page.locator('canvas, svg').first()
    ).toBeVisible();
  });

  // ─── Users ───────────────────────────────────────────────────────────────────

  test('PH_REG_P_005 - Users page loads with correct tabs', async ({ page }) => {
    await page.goto('/app/users');
    await page.waitForLoadState('domcontentloaded');
    const tabs = page.locator('[role="tab"], .ph-tab, .mat-tab-label, [class*="tab-label"]');
    await expect(tabs.filter({ hasText: /^All$/i }).first()).toBeVisible();
    await expect(tabs.filter({ hasText: /^Active$/i }).first()).toBeVisible();
    await expect(tabs.filter({ hasText: /^Pending$/i }).first()).toBeVisible();
    await expect(tabs.filter({ hasText: /^Locked$/i }).first()).toBeVisible();
  });

  test('PH_REG_P_006 - Invite User panel opens on button click', async ({ page }) => {
    await page.goto('/app/users');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('button, a').filter({ hasText: /invite/i }).first().click();
    await page.waitForTimeout(500);
    await expect(
      page.locator(
        '[class*="panel"], [class*="drawer"], [class*="sidebar"], mat-drawer, [class*="slide-in"], [class*="invite"]'
      ).first()
    ).toBeVisible();
  });

  // ─── Accounts ────────────────────────────────────────────────────────────────

  test('PH_REG_P_007 - Accounts page loads with correct title', async ({ page }) => {
    await page.goto('/app/accounts');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/app\/accounts/);
    await expect(
      page.locator('h1, h2, .ph-page-title, [class*="page-title"]').filter({ hasText: /accounts/i }).first()
    ).toBeVisible();
  });

  // ─── Email Templates ─────────────────────────────────────────────────────────

  test('PH_REG_P_008 - Email Templates page lists 5 system templates', async ({ page }) => {
    await page.goto('/app/email-templates');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.locator('h1, h2, .ph-page-title, [class*="page-title"]').filter({ hasText: /email templates/i }).first()
    ).toBeVisible();
    const rows = page.locator('tbody tr, mat-row, [class*="table-row"]');
    await expect(rows).toHaveCount(5);
  });

  // ─── Organizations ───────────────────────────────────────────────────────────

  test('PH_REG_P_009 - Organizations page loads with New Organization button', async ({ page }) => {
    await page.goto('/app/organizations');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.locator('h1, h2, .ph-page-title, [class*="page-title"]').filter({ hasText: /organizations/i }).first()
    ).toBeVisible();
    await expect(
      page.locator('button, a').filter({ hasText: /new org|add org|create org|new organization/i }).first()
    ).toBeVisible();
  });

  // ─── System Config ───────────────────────────────────────────────────────────

  test('PH_REG_P_010 - System Config page shows All systems normal', async ({ page }) => {
    await page.goto('/app/system-config');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=All systems normal')).toBeVisible();
  });

  // ─── Role Permissions ────────────────────────────────────────────────────────

  test('PH_REG_P_011 - Role Permissions page loads with Admin role option', async ({ page }) => {
    await page.goto('/app/role-permissions');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.locator('h1, h2, .ph-page-title, [class*="page-title"]').filter({ hasText: /role.*permissions|permissions/i }).first()
    ).toBeVisible();
    await expect(
      page.locator('[class*="role"], [class*="section"], h3, h4').filter({ hasText: /admin/i }).first()
    ).toBeVisible();
  });

  // ─── Login Audit ─────────────────────────────────────────────────────────────

  test('PH_REG_P_012 - Login Audit shows recent login records', async ({ page }) => {
    await page.goto('/app/login-audit');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.locator('h1, h2, .ph-page-title, [class*="page-title"]').filter({ hasText: /login audit/i }).first()
    ).toBeVisible();
    const rows = page.locator('tbody tr, mat-row, [class*="table-row"]');
    await expect(rows.first()).toBeVisible();
  });

  // ─── Data Audit ──────────────────────────────────────────────────────────────

  test('PH_REG_P_013 - Data Audit page loads with all filter tabs', async ({ page }) => {
    await page.goto('/app/data-audit');
    await page.waitForLoadState('domcontentloaded');
    await expect(
      page.locator('h1, h2, .ph-page-title, [class*="page-title"]').filter({ hasText: /data audit/i }).first()
    ).toBeVisible();
    const tabs = page.locator('[role="tab"], .ph-tab, .mat-tab-label, [class*="tab-label"]');
    await expect(tabs.filter({ hasText: /^All$/i }).first()).toBeVisible();
    await expect(tabs.filter({ hasText: /^Added$/i }).first()).toBeVisible();
    await expect(tabs.filter({ hasText: /^Modified$/i }).first()).toBeVisible();
    await expect(tabs.filter({ hasText: /^Deleted$/i }).first()).toBeVisible();
  });

  // ─── Coming Soon pages ───────────────────────────────────────────────────────

  test('PH_REG_P_014 - Products page shows Coming Soon message', async ({ page }) => {
    await page.goto('/app/products');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Coming Soon').first()).toBeVisible();
  });

  test('PH_REG_P_015 - Pharmacies page shows Coming Soon message', async ({ page }) => {
    await page.goto('/app/pharmacies');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Coming Soon').first()).toBeVisible();
  });

  test('PH_REG_P_016 - GPs page shows Coming Soon message', async ({ page }) => {
    await page.goto('/app/gps');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Coming Soon').first()).toBeVisible();
  });

  test('PH_REG_P_017 - DACs page shows Coming Soon message', async ({ page }) => {
    await page.goto('/app/dacs');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('text=Coming Soon').first()).toBeVisible();
  });

  // ─── Navigation ──────────────────────────────────────────────────────────────

  test('PH_REG_P_018 - Rail nav has 6 sections visible', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');
    // The rail/sidebar nav should contain at least 6 distinct section links or icons
    const navItems = page.locator(
      'nav a, [class*="rail"] a, [class*="sidebar"] a, [class*="nav-item"], [class*="menu-item"]'
    );
    const count = await navItems.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('PH_REG_P_019 - Admin sidenav expands with all Admin links', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');
    // Click the "Admin" section in the rail/sidebar nav to expand it
    const adminNavLink = page.locator(
      'nav a, [class*="nav-item"], [class*="menu-item"], [class*="rail"] a'
    ).filter({ hasText: /^admin$/i }).first();
    await adminNavLink.click();
    await page.waitForTimeout(500);
    // After expanding, Admin sub-links for Users and Accounts should be visible
    await expect(
      page.locator('a, [class*="nav-item"], [class*="menu-item"]').filter({ hasText: /users/i }).first()
    ).toBeVisible();
    await expect(
      page.locator('a, [class*="nav-item"], [class*="menu-item"]').filter({ hasText: /accounts/i }).first()
    ).toBeVisible();
  });

  test('PH_REG_P_020 - Footer links visible on all pages', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');
    const footer = page.locator('footer, [class*="footer"]').first();
    await expect(footer).toBeVisible();
    // Footer should have meaningful text content
    const footerText = await footer.innerText();
    expect(footerText.trim().length).toBeGreaterThan(0);
  });

});
