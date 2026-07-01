/**
 * Exploration script — discovers the ProHealth sidebar nav, captures
 * screenshots of every reachable page, and writes a JSON manifest of all
 * UI elements found.  Run with:
 *
 *   npx playwright test explore-app.js --project=chromium --headed
 *
 * (or headless — screenshots are saved either way)
 */
const { test } = require('../fixtures/base.fixture');
const fs = require('fs');
const path = require('path');
const config = require('../config/env.config');

const OUT_DIR = path.join(__dirname, '..', 'reports', 'exploration');

test('Explore the full ProHealth application', async ({ browser, newAuthenticatedPage }) => {
  // Ensure output directory
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const { context, page } = await newAuthenticatedPage(browser);

  // ── 1. Navigate to /app (dashboard) ──────────────────────────────────
  console.log('\n═══ STEP 1: Navigate to Dashboard ═══');
  await page.goto(`${config.baseUrl}/app`, { waitUntil: 'commit', timeout: 60_000 });
  await page.waitForTimeout(5000);   // let Angular bootstrap

  // Dismiss cookie banner if present
  const cookieBtn = page.getByRole('button', { name: /got it/i });
  if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await cookieBtn.click();
    await page.waitForTimeout(1000);
  }

  await page.screenshot({ path: path.join(OUT_DIR, '01-dashboard.png'), fullPage: true });
  console.log('  ✓ Dashboard screenshot saved');

  // ── 2. Discover sidebar nav items ────────────────────────────────────
  console.log('\n═══ STEP 2: Discover sidebar navigation ═══');

  // Try multiple selector strategies for the sidebar
  const sidebarSelectors = [
    'nav',
    '.sidebar',
    '.side-menu',
    '.left-menu',
    '[class*="sidebar"]',
    '[class*="sidenav"]',
    '[class*="nav-menu"]',
    '[class*="menu"]',
    'aside',
    '.layout-sidebar',
    'p-sidebar',
    '.p-sidebar',
    '[role="navigation"]',
    '.app-sidebar',
    '.main-menu',
  ];

  let sidebarEl = null;
  for (const sel of sidebarSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      sidebarEl = sel;
      console.log(`  ✓ Found sidebar with selector: ${sel}`);
      break;
    }
  }

  if (!sidebarEl) {
    console.log('  ⚠ No sidebar found with common selectors — dumping all visible nav-like elements');
  }

  // Grab ALL anchor/link elements and buttons that look like navigation
  const navLinks = await page.evaluate(() => {
    const results = [];

    // All <a> tags in the page
    document.querySelectorAll('a[href]').forEach(a => {
      results.push({
        type: 'link',
        text: (a.textContent || '').trim().substring(0, 100),
        href: a.getAttribute('href'),
        classes: a.className.substring(0, 200),
        visible: a.offsetParent !== null,
        parentClasses: (a.parentElement?.className || '').substring(0, 200),
      });
    });

    // All buttons / clickable items that might be menu toggles
    document.querySelectorAll('button, [role="menuitem"], [role="button"]').forEach(btn => {
      results.push({
        type: 'button',
        text: (btn.textContent || '').trim().substring(0, 100),
        classes: btn.className.substring(0, 200),
        visible: btn.offsetParent !== null,
        ariaLabel: btn.getAttribute('aria-label') || '',
      });
    });

    return results;
  });

  // Filter to visible nav-like items
  const visibleLinks = navLinks.filter(l => l.visible && l.text.length > 0);
  console.log(`  Found ${visibleLinks.length} visible interactive elements`);

  // Log all unique hrefs
  const uniqueHrefs = [...new Set(visibleLinks.filter(l => l.href).map(l => l.href))];
  console.log('\n  ── Unique hrefs found ──');
  uniqueHrefs.forEach(h => console.log(`    ${h}`));

  // ── 3. Capture the page DOM structure ────────────────────────────────
  console.log('\n═══ STEP 3: Capture page structure ═══');

  const pageStructure = await page.evaluate(() => {
    const info = {};

    // Header
    const header = document.querySelector('header, [class*="header"], [class*="toolbar"], [class*="topbar"]');
    if (header) {
      info.header = {
        tag: header.tagName,
        classes: header.className,
        text: (header.textContent || '').trim().substring(0, 500),
      };
    }

    // Sidebar / navigation
    const sidebar = document.querySelector(
      'nav, .sidebar, aside, [class*="sidebar"], [class*="sidenav"], [role="navigation"], [class*="menu-container"]'
    );
    if (sidebar) {
      info.sidebar = {
        tag: sidebar.tagName,
        classes: sidebar.className,
        innerHTML: sidebar.innerHTML.substring(0, 5000),
        childCount: sidebar.children.length,
      };
    }

    // Main content
    const main = document.querySelector('main, [class*="content"], [class*="main"], [role="main"]');
    if (main) {
      info.mainContent = {
        tag: main.tagName,
        classes: main.className,
        childCount: main.children.length,
      };
    }

    // All Angular component tags (custom elements)
    const angularTags = new Set();
    document.querySelectorAll('*').forEach(el => {
      if (el.tagName.includes('-') || el.tagName.toLowerCase().startsWith('app') || el.tagName.toLowerCase().startsWith('coloplast')) {
        angularTags.add(el.tagName.toLowerCase());
      }
    });
    info.angularComponents = [...angularTags];

    // CSS classes that hint at layout
    const layoutClasses = new Set();
    document.querySelectorAll('[class*="layout"], [class*="sidebar"], [class*="menu"], [class*="nav"], [class*="panel"]').forEach(el => {
      el.className.split(' ').forEach(c => { if (c) layoutClasses.add(c); });
    });
    info.layoutClasses = [...layoutClasses].sort();

    return info;
  });

  console.log('\n  ── Angular components found ──');
  pageStructure.angularComponents?.forEach(c => console.log(`    <${c}>`));

  console.log('\n  ── Layout CSS classes ──');
  pageStructure.layoutClasses?.slice(0, 40).forEach(c => console.log(`    .${c}`));

  // ── 4. Navigate to key pages and screenshot each ─────────────────────
  console.log('\n═══ STEP 4: Navigate to key pages ═══');

  const pagesToVisit = [
    { name: '02-system', path: '/app/system' },
    { name: '03-users', path: '/app/users' },
    { name: '04-organizations', path: '/app/organizations' },
    { name: '05-role-permissions', path: '/app/role-permissions' },
    { name: '06-accounts', path: '/app/accounts' },
    { name: '07-patients-details', path: '/app/community/patients/details' },
    { name: '08-patients-prescriptions', path: '/app/community/patients/prescriptions' },
    { name: '09-patients-orders', path: '/app/community/patients/orders' },
    { name: '10-patients-notes', path: '/app/community/patients/notes' },
    { name: '11-patients-collections', path: '/app/community/patients/collections' },
    { name: '12-patients-contacts', path: '/app/community/patients/contacts' },
    { name: '13-prescriptions', path: '/app/community/prescriptions' },
    { name: '14-call-orders', path: '/app/community/call-handling/orders' },
    { name: '15-call-queries', path: '/app/community/call-handling/queries' },
    { name: '16-call-printing', path: '/app/community/call-handling/prescription-printing' },
    { name: '17-call-print-history', path: '/app/community/call-handling/printing-history' },
    { name: '18-reporting-dashboards', path: '/app/reporting3/dashboards' },
    { name: '19-reporting-queries', path: '/app/reporting3/queries' },
    { name: '20-reporting-widgets', path: '/app/reporting3/widgets' },
    { name: '21-scheduler-dashboard', path: '/app/scheduler/dashboard' },
    { name: '22-scheduler-jobs', path: '/app/scheduler/jobs' },
    { name: '23-products', path: '/app/products' },
    { name: '24-pharmacies', path: '/app/pharmacies' },
    { name: '25-gps', path: '/app/gps' },
    { name: '26-dacs', path: '/app/dacs' },
    { name: '27-broadcast-messages', path: '/app/broadcast-messages' },
    { name: '28-lookup-master', path: '/app/lookup-master' },
    { name: '29-templates', path: '/app/templates' },
    { name: '30-email-templates', path: '/app/email-templates' },
    { name: '31-data-audit', path: '/app/admin/data-audit' },
    { name: '32-login-audit', path: '/app/admin/login-audit' },
    { name: '33-logs', path: '/app/logs' },
    { name: '34-formio-list', path: '/app/formio/list' },
    { name: '35-profile', path: '/app/profile' },
    { name: '36-static-pages', path: '/app/static/pages' },
  ];

  const pageResults = [];

  for (const pg of pagesToVisit) {
    const url = `${config.baseUrl}${pg.path}`;
    console.log(`\n  → Visiting ${pg.name}: ${pg.path}`);
    try {
      await page.goto(url, { waitUntil: 'commit', timeout: 30_000 });
      await page.waitForTimeout(3000);   // let Angular render

      // Dismiss cookie banner again if it reappears
      if (await cookieBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await cookieBtn.click().catch(() => { });
        await page.waitForTimeout(500);
      }

      const finalUrl = page.url();
      const title = await page.title();

      // Collect key UI elements on this page
      const uiElements = await page.evaluate(() => {
        const els = {};

        // Tables
        const tables = document.querySelectorAll('table, [class*="table"], p-table, .p-datatable');
        els.tables = tables.length;

        // Forms
        const forms = document.querySelectorAll('form, [class*="form"], .p-field');
        els.forms = forms.length;

        // Buttons
        const buttons = document.querySelectorAll('button');
        els.buttons = Array.from(buttons)
          .filter(b => b.offsetParent !== null)
          .map(b => (b.textContent || '').trim().substring(0, 50))
          .filter(t => t.length > 0)
          .slice(0, 15);

        // Headings
        const headings = document.querySelectorAll('h1, h2, h3, .title, [class*="title"], [class*="heading"]');
        els.headings = Array.from(headings)
          .map(h => (h.textContent || '').trim().substring(0, 80))
          .filter(t => t.length > 0)
          .slice(0, 10);

        // Input fields
        const inputs = document.querySelectorAll('input, select, textarea');
        els.inputs = Array.from(inputs)
          .filter(i => i.offsetParent !== null)
          .map(i => ({
            type: i.type || i.tagName.toLowerCase(),
            placeholder: i.placeholder || '',
            name: i.name || '',
            id: i.id || '',
          }))
          .slice(0, 15);

        // Tabs
        const tabs = document.querySelectorAll('[role="tab"], .p-tabview-nav li, .mat-tab-label');
        els.tabs = Array.from(tabs)
          .map(t => (t.textContent || '').trim().substring(0, 50))
          .filter(t => t.length > 0);

        // Panels / cards
        const panels = document.querySelectorAll('.panel, .card, .p-card, .p-panel, [class*="panel"], [class*="card"]');
        els.panels = panels.length;

        // Dialogs (currently open)
        const dialogs = document.querySelectorAll('[role="dialog"], .p-dialog, .modal');
        els.dialogs = dialogs.length;

        return els;
      });

      const result = {
        name: pg.name,
        path: pg.path,
        finalUrl,
        title,
        redirected: !finalUrl.includes(pg.path),
        uiElements,
      };

      pageResults.push(result);

      await page.screenshot({
        path: path.join(OUT_DIR, `${pg.name}.png`),
        fullPage: true,
      });
      console.log(`    ✓ Screenshot saved | Tables: ${uiElements.tables} | Buttons: ${uiElements.buttons?.length || 0} | Headings: ${uiElements.headings?.join(', ').substring(0, 80)}`);
    } catch (err) {
      console.log(`    ✗ FAILED: ${err.message.substring(0, 120)}`);
      pageResults.push({
        name: pg.name,
        path: pg.path,
        error: err.message.substring(0, 200),
      });
    }
  }

  // ── 5. Capture sidebar nav in detail after all visits ────────────────
  // console.log('\n═══ STEP 5: Capture sidebar nav items detail ═══');
  // await page.goto(`${config.baseUrl}/app`, { waitUntil: 'commit', timeout: 900_000 });
  // await page.waitForTimeout(3000);

  // Try to expand all collapsible menu items
  const menuToggles = page.locator('[class*="menu"] [class*="toggle"], [class*="menu"] [class*="expand"], [class*="submenu-toggle"], [class*="menu-arrow"], .menu-item-arrow, .p-panelmenu-header');
  const toggleCount = await menuToggles.count().catch(() => 0);
  console.log(`  Found ${toggleCount} potential menu toggles`);

  for (let i = 0; i < toggleCount; i++) {
    try {
      await menuToggles.nth(i).click({ timeout: 2000 });
      await page.waitForTimeout(500);
    } catch {
      // skip non-clickable
    }
  }

  // Now gather all menu items
  const sidebarItems = await page.evaluate(() => {
    const items = [];
    // Broad selector for menu items
    const menuSelectors = [
      '[class*="menu"] a',
      '[class*="menu"] [role="menuitem"]',
      '[class*="nav"] a',
      'nav a',
      '[class*="sidebar"] a',
      'aside a',
    ];

    const seen = new Set();
    for (const sel of menuSelectors) {
      document.querySelectorAll(sel).forEach(el => {
        const text = (el.textContent || '').trim();
        const href = el.getAttribute('href') || el.getAttribute('routerlink') || '';
        const key = `${text}|${href}`;
        if (!seen.has(key) && text.length > 0) {
          seen.add(key);
          items.push({
            text: text.substring(0, 80),
            href,
            classes: el.className.substring(0, 150),
            depth: 0,
          });
        }
      });
    }

    // Try to detect nesting level
    items.forEach(item => {
      const el = document.querySelector(`a[href="${item.href}"]`);
      if (el) {
        let depth = 0;
        let parent = el.parentElement;
        while (parent) {
          if (parent.classList.contains('submenu') || parent.classList.contains('p-submenu-list') ||
            parent.tagName === 'UL' || parent.tagName === 'OL') {
            depth++;
          }
          parent = parent.parentElement;
          if (depth > 5) break;
        }
        item.depth = depth;
      }
    });

    return items;
  });

  console.log(`\n  ── Sidebar menu items (${sidebarItems.length}) ──`);
  sidebarItems.forEach(item => {
    const indent = '  '.repeat(item.depth);
    console.log(`    ${indent}${item.text} → ${item.href}`);
  });

  // ── 6. Write the manifest ────────────────────────────────────────────
  const manifest = {
    timestamp: new Date().toISOString(),
    baseUrl: config.baseUrl,
    user: config.credentials.email,
    sidebar: sidebarItems,
    navLinks: visibleLinks,
    pageStructure,
    pageResults,
  };

  const manifestPath = path.join(OUT_DIR, 'exploration-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n═══ DONE ═══`);
  console.log(`  Manifest: ${manifestPath}`);
  console.log(`  Screenshots: ${OUT_DIR}/`);
  console.log(`  Pages visited: ${pageResults.length}`);
  console.log(`  Pages OK: ${pageResults.filter(p => !p.error).length}`);
  console.log(`  Pages FAILED: ${pageResults.filter(p => p.error).length}`);

  if (config.closeBrowser) {
    await context.close();
  }
});
