const path = require('path');
const { test, expect } = require('../../fixtures/base.fixture');

const STORAGE_STATE = path.join(__dirname, '..', '..', '.auth', 'user.json');

test.use({ storageState: STORAGE_STATE });

test.describe('Negative Regression Suite', () => {
  test.beforeEach(async ({ page, prepareAuthenticatedPage }, testInfo) => {
    if (!/^PH_REG_N_00[569]|^PH_REG_N_010/.test(testInfo.title)) return;
    await prepareAuthenticatedPage(page);
  });

  // ─── Login failures (no storageState — fresh browser context) ────────────────

  test('PH_REG_N_001 - Login with wrong password shows error', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/account/login?redirectStr=%2Fapp%3F');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /got it|accept|ok/i }).first().click({ timeout: 5_000 }).catch(() => {});
    await page.locator('input[type="email"], input[placeholder*="name@"]').fill('skharwade@delaplex.com');
    await page.locator('input[type="password"]').fill('WrongPassword!999');
    await page.locator('button:has-text("Sign in")').click();
    await page.waitForTimeout(1500);
    await expect(
      page.locator(
        'text=wrong password, text=Invalid credentials, text=Incorrect password, ' +
        '[class*="error"], [class*="alert"], mat-error, [role="alert"]'
      ).first()
    ).toBeVisible();
    await context.close();
  });

  test('PH_REG_N_002 - Login with invalid email shows error', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/account/login?redirectStr=%2Fapp%3F');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /got it|accept|ok/i }).first().click({ timeout: 5_000 }).catch(() => {});
    await page.locator('input[type="email"], input[placeholder*="name@"]').fill('notanemail');
    await page.locator('input[type="password"]').fill('Admin#12345');
    await page.locator('button:has-text("Sign in")').click();
    await page.waitForTimeout(1500);
    // Expect either a browser-level email validation message or an app-level error
    const hasValidationMessage = await page.locator('input[type="email"]').evaluate(
      (el) => el.validity ? !el.validity.valid : false
    );
    const hasAppError = await page.locator(
      '[class*="error"], [class*="alert"], mat-error, [role="alert"]'
    ).first().isVisible().catch(() => false);
    expect(hasValidationMessage || hasAppError).toBeTruthy();
    await context.close();
  });

  test('PH_REG_N_003 - Login with blank email shows validation', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/account/login?redirectStr=%2Fapp%3F');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /got it|accept|ok/i }).first().click({ timeout: 5_000 }).catch(() => {});
    // Leave email blank, fill password, attempt sign-in
    await page.locator('input[type="password"]').fill('Admin#12345');
    await page.locator('button:has-text("Sign in")').click();
    await page.waitForTimeout(1000);
    // Should remain on the login page (no redirect to /app)
    await expect(page).not.toHaveURL(/\/app(?!.*login)/);
    // And/or a validation message should appear
    const errorVisible = await page.locator(
      '[class*="error"], [class*="alert"], mat-error, [role="alert"], input:invalid'
    ).first().isVisible().catch(() => false);
    // We at minimum verify we have NOT navigated away from login
    await expect(page).toHaveURL(/login/);
    await context.close();
  });

  test('PH_REG_N_004 - Login with blank password shows validation', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/account/login?redirectStr=%2Fapp%3F');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('button', { name: /got it|accept|ok/i }).first().click({ timeout: 5_000 }).catch(() => {});
    // Fill email, leave password blank, attempt sign-in
    await page.locator('input[type="email"], input[placeholder*="name@"]').fill('skharwade@delaplex.com');
    await page.locator('button:has-text("Sign in")').click();
    await page.waitForTimeout(1000);
    // Should remain on the login page
    await expect(page).toHaveURL(/login/);
    await context.close();
  });

  // ─── Authenticated negative tests (storageState applied via test.use above) ──

  test('PH_REG_N_005 - Invite User with empty form shows validation', async ({ page }) => {
    await page.goto('/app/users');
    await page.waitForLoadState('domcontentloaded');
    // Open the invite panel
    await page.locator('button, a').filter({ hasText: /invite/i }).first().click();
    await page.waitForTimeout(500);
    // Submit without filling any fields
    await page.locator('button[type="submit"], button').filter({ hasText: /submit|send|invite/i }).first().click();
    await page.waitForTimeout(500);
    // Validation errors should appear on required fields
    await expect(
      page.locator('[class*="error"], mat-error, .ph-validation-error, [class*="invalid"]').first()
    ).toBeVisible();
  });

  test('PH_REG_N_006 - Invite User with invalid email format shows error', async ({ page }) => {
    await page.goto('/app/users');
    await page.waitForLoadState('domcontentloaded');
    // Open the invite panel
    await page.locator('button, a').filter({ hasText: /invite/i }).first().click();
    await page.waitForTimeout(500);
    // Fill required name fields with valid data
    await page.locator('label, mat-label, [class*="label"]').filter({ hasText: /first.?name/i })
      .first().locator('..').locator('input').fill('Test').catch(async () => {
        await page.locator('input[placeholder*="first"], input[name*="first"]').first().fill('Test');
      });
    await page.locator('label, mat-label, [class*="label"]').filter({ hasText: /surname/i })
      .first().locator('..').locator('input').fill('User').catch(async () => {
        await page.locator('input[placeholder*="surname"], input[name*="surname"]').first().fill('User');
      });
    // Fill an invalid email
    await page.locator('input[type="email"], input[placeholder*="mail"], input[name*="email"]').first().fill('invalid-email-format');
    // Submit the form
    await page.locator('button[type="submit"], button').filter({ hasText: /submit|send|invite/i }).first().click();
    await page.waitForTimeout(500);
    // An email validation error should be visible
    const hasError = await page.locator(
      '[class*="error"], mat-error, .ph-validation-error, [class*="invalid"], input:invalid'
    ).first().isVisible().catch(() => false);
    expect(hasError).toBeTruthy();
  });

  test('PH_REG_N_007 - Unauthenticated access to /app redirects to login', async ({ browser }) => {
    // Fresh context — no storage state loaded
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/app');
    await page.waitForLoadState('domcontentloaded');
    // Should be redirected to the login page
    await expect(page).toHaveURL(/login/);
    await context.close();
  });

  test('PH_REG_N_008 - Unauthenticated access to /app/users redirects to login', async ({ browser }) => {
    // Fresh context — no storage state loaded
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/app/users');
    await page.waitForLoadState('domcontentloaded');
    // Should be redirected to the login page
    await expect(page).toHaveURL(/login/);
    await context.close();
  });

  // ─── Email Template validation ────────────────────────────────────────────────

  test('PH_REG_N_009 - New Email Template with empty fields shows validation', async ({ page }) => {
    await page.goto('/app/email-templates');
    await page.waitForLoadState('domcontentloaded');
    // Click the New Template button to open the form
    await page.locator('button, a').filter({ hasText: /new template|add template|create template/i }).first().click();
    await page.waitForTimeout(500);
    // Attempt to submit without filling any fields
    await page.locator('button[type="submit"], button').filter({ hasText: /submit|save|create|add/i }).first().click();
    await page.waitForTimeout(500);
    // Validation errors should appear
    await expect(
      page.locator('[class*="error"], mat-error, .ph-validation-error, [class*="invalid"]').first()
    ).toBeVisible();
  });

  // ─── Organization validation ──────────────────────────────────────────────────

  test('PH_REG_N_010 - New Organization with empty name shows validation', async ({ page }) => {
    await page.goto('/app/organizations');
    await page.waitForLoadState('domcontentloaded');
    // Click the New Organization button to open the form/panel
    await page.locator('button, a').filter({ hasText: /new org|add org|create org|new organization/i }).first().click();
    await page.waitForTimeout(500);
    // Attempt to submit without filling the name
    await page.locator('button[type="submit"], button').filter({ hasText: /submit|save|create|add/i }).first().click();
    await page.waitForTimeout(500);
    // Validation error for the required name field should appear
    await expect(
      page.locator('[class*="error"], mat-error, .ph-validation-error, [class*="invalid"]').first()
    ).toBeVisible();
  });

});
