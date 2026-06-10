const logger = require('../utils/logger');

/**
 * BasePage
 * --------
 * Parent class for every Page Object. Centralizes common browser
 * interactions (navigation, waits, typing, clicking, assertions helpers)
 * so individual page objects stay small and focused on their own locators.
 *
 * Usage:
 *   class LoginPage extends BasePage {
 *     constructor(page) {
 *       super(page);
 *       this.usernameInput = page.locator('#user-name');
 *     }
 *   }
 *
 * All wait/interaction methods accept either a Locator or a string selector,
 * so callers can pass `this.usernameInput` or '#user-name' interchangeably.
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.logger = logger;
  }

  /** Resolve a Locator or selector string into a Locator. */
  _toLocator(target) {
    return typeof target === 'string' ? this.page.locator(target) : target;
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  /**
   * Navigate to a URL and wait for the chosen load state.
   * @param {string} url
   * @param {{ waitUntil?: 'load'|'domcontentloaded'|'networkidle' }} [options]
   */
  async navigate(url, { waitUntil = 'domcontentloaded' } = {}) {
    this.logger.info(`Navigating to ${url}`);
    await this.page.goto(url, { waitUntil });
  }

  async reload() {
    await this.page.reload();
  }

  async goBack() {
    await this.page.goBack();
  }

  async waitForLoadState(state = 'networkidle') {
    await this.page.waitForLoadState(state);
  }

  async getTitle() {
    return this.page.title();
  }

  async getUrl() {
    return this.page.url();
  }

  // ---------------------------------------------------------------------------
  // Element waits
  // ---------------------------------------------------------------------------

  /** Wait for an element to reach a given state (default: visible). */
  async waitForElement(target, { state = 'visible', timeout = 10_000 } = {}) {
    await this._toLocator(target).waitFor({ state, timeout });
  }

  async waitForHidden(target, timeout = 10_000) {
    await this._toLocator(target).waitFor({ state: 'hidden', timeout });
  }

  // ---------------------------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------------------------

  /** Click an element after ensuring it is visible. */
  async click(target, { timeout = 10_000 } = {}) {
    const locator = this._toLocator(target);
    await locator.waitFor({ state: 'visible', timeout });
    await locator.click();
  }

  /** Clear and type into a field. */
  async fill(target, value, { timeout = 10_000 } = {}) {
    const locator = this._toLocator(target);
    await locator.waitFor({ state: 'visible', timeout });
    await locator.fill(value);
  }

  /** Type character-by-character (use when the field reacts to keypresses). */
  async type(target, value, { delay = 50 } = {}) {
    await this._toLocator(target).pressSequentially(value, { delay });
  }

  async selectOption(target, value) {
    await this._toLocator(target).selectOption(value);
  }

  async check(target) {
    await this._toLocator(target).check();
  }

  async uncheck(target) {
    await this._toLocator(target).uncheck();
  }

  async hover(target) {
    await this._toLocator(target).hover();
  }

  async press(target, key) {
    await this._toLocator(target).press(key);
  }

  async uploadFile(target, filePath) {
    await this._toLocator(target).setInputFiles(filePath);
  }

  // ---------------------------------------------------------------------------
  // Reads / state queries
  // ---------------------------------------------------------------------------

  async getText(target) {
    return (await this._toLocator(target).textContent())?.trim() || '';
  }

  async getInputValue(target) {
    return this._toLocator(target).inputValue();
  }

  async getAttribute(target, name) {
    return this._toLocator(target).getAttribute(name);
  }

  async isVisible(target) {
    return this._toLocator(target).isVisible();
  }

  async isEnabled(target) {
    return this._toLocator(target).isEnabled();
  }

  async count(target) {
    return this._toLocator(target).count();
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  /** Take a screenshot into the reports output dir. */
  async screenshot(name) {
    const path = `reports/test-output/${name}-${Date.now()}.png`;
    await this.page.screenshot({ path, fullPage: true });
    this.logger.info(`Screenshot saved: ${path}`);
    return path;
  }

  /** Scroll an element into view. */
  async scrollIntoView(target) {
    await this._toLocator(target).scrollIntoViewIfNeeded();
  }

  /**
   * Wait for a specific network response matching a URL pattern.
   * Useful for asserting an API call fired as a side effect of a UI action.
   */
  async waitForResponse(urlPattern, { timeout = 15_000 } = {}) {
    return this.page.waitForResponse(urlPattern, { timeout });
  }
}

module.exports = { BasePage };
