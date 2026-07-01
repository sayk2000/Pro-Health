'use strict';

const { test, expect } = require('../../fixtures/base.fixture');

// Admin — coming soon
// TC197–TC226: GPs, Products, Broadcast Messages, Form List, LookUp Master, Templates
// Operational Admin — coming soon
// TC227–TC231: Static Pages
// Community — coming soon
// TC300–TC314: Patients, All Prescriptions, Call / Order Handling

const comingSoonPages = [
  // ── Admin ──────────────────────────────────────────────────────────────────
  { name: 'GPs',                    route: '/app/gps',                  baseTc: 197 },
  { name: 'Products',               route: '/app/products',             baseTc: 202 },
  { name: 'Broadcast Messages',     route: '/app/broadcast-messages',   baseTc: 207 },
  { name: 'Form List',              route: '/app/form-list',            baseTc: 212 },
  { name: 'LookUp Master',          route: '/app/lookup-master',        baseTc: 217 },
  { name: 'Templates',              route: '/app/templates',            baseTc: 222 },
  // ── Operational Admin ──────────────────────────────────────────────────────
  { name: 'Static Pages',           route: '/app/static-pages',         baseTc: 227 },
  // ── Community ──────────────────────────────────────────────────────────────
  { name: 'Patients',               route: '/app/patients',             baseTc: 300 },
  { name: 'All Prescriptions',      route: '/app/all-prescriptions',    baseTc: 305 },
  { name: 'Call / Order Handling',  route: '/app/call-order-handling',  baseTc: 310 },
];

test.describe('Coming Soon Pages', () => {
  test.describe.configure({ mode: 'serial' });

  let comingSoonPage;

  test.beforeAll(async ({ browser, newAuthenticatedPage }) => {
    const { page } = await newAuthenticatedPage(browser);
    comingSoonPage = page;
  });

  for (const { name, route, baseTc } of comingSoonPages) {
    test.describe(name, () => {
      test.beforeEach(async () => {
        await comingSoonPage.goto(route, { waitUntil: 'domcontentloaded' });
        await comingSoonPage.locator('text=Coming Soon, text=Under Development, [class*="coming-soon"]')
          .first().waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
      });

      test(`PH_TC_${String(baseTc).padStart(3,'0')} - ${name} page loads at ${route}`, async () => {
        await expect(comingSoonPage).toHaveURL(new RegExp(route.replace(/[/]/g, '\\/').replace(/-/g, '[\\-]?')));
      });

      test(`PH_TC_${String(baseTc+1).padStart(3,'0')} - ${name} "Coming Soon" text visible`, async () => {
        await expect(comingSoonPage.locator('text=Coming Soon').first()).toBeVisible();
      });

      test(`PH_TC_${String(baseTc+2).padStart(3,'0')} - ${name} "Under Development" badge visible`, async () => {
        await expect(
          comingSoonPage.locator('text=Under Development').or(
            comingSoonPage.locator('[class*="badge"], [class*="tag"], [class*="chip"]').filter({ hasText: /under development/i })
          ).first()
        ).toBeVisible();
      });

      test(`PH_TC_${String(baseTc+3).padStart(3,'0')} - ${name} "Back to Dashboard" button present`, async () => {
        await expect(
          comingSoonPage.locator('button, a').filter({ hasText: /back to dashboard/i }).first()
        ).toBeVisible();
      });

      test(`PH_TC_${String(baseTc+4).padStart(3,'0')} - ${name} clicking "Back to Dashboard" navigates to /app`, async () => {
        await comingSoonPage.locator('button, a').filter({ hasText: /back to dashboard/i }).first().click();
        await comingSoonPage.waitForLoadState('domcontentloaded');
        await expect(comingSoonPage).toHaveURL(/\/app(\/dashboard|\/home)?(#.*)?(\/.*)? $/);
      });
    });
  }
});
