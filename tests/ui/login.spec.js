const { test, expect } = require('../../fixtures/base.fixture');
const userData = require('../../test-data/user.json');
const { createUser } = require('../../test-data/factories/user.factory');

// Login tests must run without any saved auth state.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login UI', { tag: '@regression' }, () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ loginPage, config }) => {
    await loginPage.open(config.baseUrl);
  });

  // ── Positive ────────────────────────────────────────────────────────────────

  test(
    'PH_TC_001 - Valid login with correct credentials redirects to dashboard',
    { tag: ['@smoke', '@critical'] },
    async ({ loginPage, page, config }) => {
      await loginPage.login(config.credentials.email, config.credentials.password);
      await expect(page).toHaveURL(/\/app(\/|\?|$)/, { timeout: 30_000 });
    }
  );

  // ── Negative ────────────────────────────────────────────────────────────────

  test(
    'PH_TC_002 - Login with wrong password shows error message',
    { tag: '@regression' },
    async ({ loginPage, page }) => {
      await loginPage.login(userData.invalidUser.email, userData.invalidUser.password);
      const error = await loginPage.getErrorMessage();
      expect(error.length).toBeGreaterThan(0);
      await expect(page).toHaveURL(/\/account\/login/);
    }
  );

  test(
    'PH_TC_003 - Randomly generated user is rejected',
    { tag: '@regression' },
    async ({ loginPage, page }) => {
      const fakeUser = createUser();
      await loginPage.login(fakeUser.email, fakeUser.password);
      const error = await loginPage.getErrorMessage();
      expect(error.length).toBeGreaterThan(0);
      await expect(page).toHaveURL(/\/account\/login/);
    }
  );

  test(
    'PH_TC_004 - Blank email field keeps submit button disabled',
    { tag: '@regression' },
    async ({ loginPage }) => {
      await loginPage.passwordInput.fill('SomePassword1!');
      await expect(loginPage.submitButton).toBeDisabled();
    }
  );

  test(
    'PH_TC_005 - Blank password field keeps submit button disabled',
    { tag: '@regression' },
    async ({ loginPage, config }) => {
      await loginPage.emailInput.fill(config.credentials.email);
      await expect(loginPage.submitButton).toBeDisabled();
    }
  );

  // ── UI Elements ─────────────────────────────────────────────────────────────

  test(
    'PH_TC_006 - Forgot Password link is visible on login page',
    { tag: '@smoke' },
    async ({ loginPage }) => {
      await expect(loginPage.forgotPasswordLink).toBeVisible();
    }
  );

  test(
    'PH_TC_007 - NHS Login with my Care Identity button is visible',
    { tag: '@smoke' },
    async ({ loginPage }) => {
      await expect(loginPage.nhsLoginBtn).toBeVisible();
    }
  );

  test(
    'PH_TC_008 - ProHealth branding is visible on login page',
    { tag: '@smoke' },
    async ({ page }) => {
      await expect(page.locator('text=ProHealth').first()).toBeVisible();
    }
  );

  test(
    'PH_TC_009 - Password show/hide toggle changes input type',
    { tag: '@regression' },
    async ({ loginPage }) => {
      await loginPage.passwordInput.fill('TestPass123!');
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
      await loginPage.passwordToggleBtn.click();
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
    }
  );

  test(
    'PH_TC_010 - After logout user is redirected back to login page',
    { tag: ['@smoke', '@critical'] },
    async ({ loginPage, page, config }) => {
      await loginPage.login(config.credentials.email, config.credentials.password);
      await expect(page).toHaveURL(/\/app(\/|\?|$)/, { timeout: 30_000 });
      await loginPage.avatarTrigger.click();
      await loginPage.signOutOption.click();
      await expect(page).toHaveURL(/\/account\/login/, { timeout: 15_000 });
      await expect(loginPage.emailInput).toBeVisible();
    }
  );


});
