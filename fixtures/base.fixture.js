const base = require('@playwright/test');
const { LoginPage } = require('../pages/login.page');
const config = require('../config/env.config');
const logger = require('../utils/logger');

const test = base.test.extend({
  config: async ({}, use) => {
    await use(config);
  },

  logger: async ({}, use) => {
    await use(logger);
  },

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  authedRequest: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: config.apiBaseUrl,
      extraHTTPHeaders: {
        Accept: 'application/json',
      },
    });
    await use(context);
    await context.dispose();
  },
});

module.exports = {
  test,
  expect: base.expect,
};
