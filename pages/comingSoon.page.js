const { BasePage } = require('./base.page');
/**
 * Shared page object for all "Coming Soon" / "Under Development" pages.
 *
 * Routes covered:
 *   /app/products, /app/gps,
 *   /app/broadcast-messages, /app/lookup-master, /app/templates, /app/form-list,
 *   /app/static-pages, /app/patients, /app/all-prescriptions, /app/call-order-handling
 *
 * NOTE: /app/pharmacies and /app/dacs are now LIVE modules — removed from Coming Soon.
 */
class ComingSoonPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.page = page;

    // Page title (h1 or h2)
    this.pageTitle = page.locator('h1, h2').first();

    // Coming soon indicators
    this.comingSoonHeading = page.locator('text=Coming Soon, [class*="soon"]');
    this.underDevelopmentLabel = page.locator('text=Under Development');

    // Navigation
    this.backToDashboardButton = page.locator(
      'button:has-text("Back to Dashboard"), a:has-text("Back to Dashboard")'
    );
  }

  /**
   * Navigate to the given route.
   * @param {string} route - e.g. '/app/products'
   */
  async goto(route) {
    await this.navigate(route);
  }

  /**
   * Return the text content of the page title (h1 or h2).
   * @returns {Promise<string>}
   */
  async getPageTitle() {
    return this.pageTitle.textContent();
  }

  /**
   * Return true if the "Coming Soon" heading is visible on the page.
   * @returns {Promise<boolean>}
   */
  async isComingSoon() {
    return this.comingSoonHeading.isVisible();
  }

  /**
   * Click the "Back to Dashboard" button or link.
   */
  async clickBackToDashboard() {
    await this.backToDashboardButton.click();
  }
}

module.exports = { ComingSoonPage };
