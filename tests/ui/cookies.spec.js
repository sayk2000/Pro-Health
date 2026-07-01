'use strict';

const { test, expect } = require('../../fixtures/base.fixture');
const config = require('../../config/env.config');

test.describe('Cookie Consent', { tag: '@regression' }, () => {
  test.describe.configure({ mode: 'serial' });

  let sharedPage;

  test.beforeAll(async ({ browser, newAuthenticatedPage }) => {
    // Login once, land on dashboard, and handle cookies for authenticated checks.
    const { page } = await newAuthenticatedPage(browser);
    sharedPage = page;
  });

  // PH_TC_295 - Banner visible on first visit (no cookies)
  test('PH_TC_295 - Cookie consent banner is visible on first page load',
    { tag: '@smoke' },
    async ({ browser }) => {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded' });
      const banner = page.locator('.cookie-toast, [class*="cookie"], [id*="cookie"], [aria-label*="cookie" i]').first();
      await expect(banner).toBeVisible({ timeout: 15_000 });
      await ctx.close();
    }
  );

  // PH_TC_296 - Accepting cookies dismisses the banner
  test('PH_TC_296 - Accepting cookies dismisses the banner',
    { tag: ['@smoke', '@critical'] },
    async ({ browser }) => {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded' });
      const banner = page.locator('.cookie-toast, [class*="cookie"], [id*="cookie"]').first();
      await expect(banner).toBeVisible({ timeout: 15_000 });
      await page.getByRole('button', { name: /got it|accept|ok/i }).first().click();
      await expect(banner).toBeHidden({ timeout: 10_000 });
      await ctx.close();
    }
  );

  // PH_TC_297 - Banner not shown again after acceptance on reload
  test('PH_TC_297 - Cookie banner does not reappear after acceptance on reload',
    { tag: '@regression' },
    async ({ browser }) => {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: /got it|accept|ok/i }).first().click({ timeout: 10_000 }).catch(() => {});
      await page.reload({ waitUntil: 'domcontentloaded' });
      const banner = page.locator('.cookie-toast, [class*="cookie"], [id*="cookie"]').first();
      await expect(banner).toBeHidden({ timeout: 10_000 });
      await ctx.close();
    }
  );

  // PH_TC_298 - Banner not shown to authenticated users
  test('PH_TC_298 - Cookie banner is not shown when user is already authenticated',
    { tag: '@regression' },
    async () => {
      // Uses sharedPage which is already logged in and on dashboard
      await sharedPage.goto(config.baseUrl + '/app', { waitUntil: 'domcontentloaded' });
      const banner = sharedPage.locator('.cookie-toast, [class*="cookie"], [id*="cookie"]').first();
      await expect(banner).toBeHidden({ timeout: 10_000 });
    }
  );

  // PH_TC_299 - Cookie banner visible on login page for new visitors
  test('PH_TC_299 - Cookie banner appears on the login page for new visitors',
    { tag: '@smoke' },
    async ({ browser }) => {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await page.goto(config.loginUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#email')).toBeVisible({ timeout: 30_000 });
      const banner = page.locator('.cookie-toast, [class*="cookie"], [id*="cookie"]').first();
      await expect(banner).toBeVisible({ timeout: 10_000 });
      await ctx.close();
    }
  );
});
