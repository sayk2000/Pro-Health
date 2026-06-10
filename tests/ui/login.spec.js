const { test, expect } = require('../../fixtures/base.fixture');
const userData = require('../../test-data/user.json');
const { createUser } = require('../../test-data/factories/user.factory');

// Login tests must start with a fresh session — override storageState.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login UI', { tag: '@regression' }, () => {
  test.beforeEach(async ({ loginPage, config, logger }) => {
    // Root redirects to /account/login?redirectStr=%2Fapp (reliable load + post-login redirect to /app).
    logger.info(`Navigating to login page via ${config.baseUrl}`);
    await loginPage.open(config.baseUrl);
  });

  test('valid user can log in', { tag: ['@smoke', '@critical'] }, async ({ loginPage, page, config, logger }) => {
    const { email, password } = config.credentials;
    logger.info(`Attempting login for ${email}`);
    await loginPage.login(email, password);
    await expect(page).toHaveURL(/\/app(\/|\?|$)/, { timeout: 30_000 });
  });

  test('invalid credentials show error', { tag: '@smoke' }, async ({ loginPage, logger }) => {
    const { email, password } = userData.invalidUser;
    logger.info(`Attempting login with invalid credentials: ${email}`);
    await loginPage.login(email, password);
    const error = await loginPage.getErrorMessage();
    expect(error.length).toBeGreaterThan(0);
  });

  test('randomly-generated user is rejected', { tag: '@regression' }, async ({ loginPage }) => {
    const fakeUser = createUser();
    await loginPage.login(fakeUser.email, fakeUser.password);
    const error = await loginPage.getErrorMessage();
    expect(error.length).toBeGreaterThan(0);
  });

  for (const user of userData.users) {
    test(`form accepts data-driven user: ${user.email}`, { tag: '@regression' }, async ({ loginPage }) => {
      await loginPage.emailInput.fill(user.email);
      await loginPage.passwordInput.fill(user.password);
      await expect(loginPage.emailInput).toHaveValue(user.email);
    });
  }
});
