const { test, expect } = require('@playwright/test');
const config = require('../../config/env.config');
const logger = require('../../utils/logger');

test.describe('Performance / Load', { tag: '@performance' }, () => {
  test('home page loads within performance budget', { tag: ['@smoke', '@performance'] }, async ({ page }) => {
    const budgetMs = 5000;
    const start = Date.now();
    await page.goto(config.baseUrl, { waitUntil: 'load' });
    const elapsed = Date.now() - start;
    logger.info(`Home page load: ${elapsed}ms (budget ${budgetMs}ms)`);
    expect(elapsed).toBeLessThan(budgetMs);
  });

  test('navigation timing API metrics', { tag: '@regression' }, async ({ page }) => {
    await page.goto(config.baseUrl);
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      if (!nav) return null;
      return {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
        loadComplete: nav.loadEventEnd - nav.startTime,
        ttfb: nav.responseStart - nav.requestStart,
      };
    });
    logger.info(`Navigation timings: ${JSON.stringify(timing)}`);
    expect(timing).not.toBeNull();
    expect(timing.domContentLoaded).toBeLessThan(8000);
  });

  test('concurrent page loads simulate basic load', { tag: '@performance' }, async ({ browser }) => {
    const concurrency = 5;
    const results = [];

    const tasks = Array.from({ length: concurrency }, async (_, i) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const start = Date.now();
      try {
        await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });
        results.push({ id: i, ok: true, durationMs: Date.now() - start });
      } catch (err) {
        results.push({ id: i, ok: false, error: err.message });
      } finally {
        await context.close();
      }
    });

    await Promise.all(tasks);
    logger.info(`Concurrent load results: ${JSON.stringify(results)}`);
    const successCount = results.filter((r) => r.ok).length;
    expect(successCount).toBe(concurrency);
  });
});
