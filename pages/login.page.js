const { BasePage } = require('./base.page');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    // ProHealth login form (/account/login).
    this.emailInput    = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton  = page.getByRole('button', { name: /sign in to prohealth/i });
    // Bad-credential errors render as a PrimeNG inline error message.
    this.errorMessage  = page.locator('.p-inline-message-error, [role="alert"], .field-validation-error');
    // Additional UI elements
    this.forgotPasswordLink = page.locator('a:has-text("Forgot"), button:has-text("Forgot")');
    this.nhsLoginBtn        = page.locator('button:has-text("Care Identity"), a:has-text("Care Identity")');
    this.passwordToggleBtn  = page.locator('#password ~ button, [class*="password"] button[aria-label*="show"], [class*="eye"]').first();
    // Avatar / user menu — use .or() so multiple label variants are tried
    this.avatarTrigger = page.locator('button.ph-avatar-trigger')
      .or(page.locator('[class*="avatar-trigger"]'))
      .or(page.locator('[aria-label*="account" i], [aria-label*="profile" i], [aria-label*="user" i]'))
      .first();
    // Sign-out option inside the menu that opens after clicking avatar
    this.signOutOption = page.locator('text=Sign out')
      .or(page.locator('text=Log out'))
      .or(page.locator('text=Logout'))
      .first();
  }

  /** Navigate to the login page. Pass the full URL. */
  async open(url) {
    await this.navigate(url);
    // Dismiss cookie consent banner before interacting with login form.
    await this.dismissCookieBanner();
    await this.waitForElement(this.emailInput, { timeout: 30_000 });
  }

  async login(email, password) {
    this.logger.info(`Logging in as "${email}"`);
    await this.fill(this.emailInput, email);
    await this.fill(this.passwordInput, password);
    await this.click(this.submitButton);
  }

  async getErrorMessage() {
    await this.waitForElement(this.errorMessage, { timeout: 5000 });
    return this.getText(this.errorMessage);
  }

  /** Logged in once the email field is no longer present (navigated to /app). */
  async isLoggedIn() {
    return !(await this.isVisible(this.emailInput));
  }
}

module.exports = { LoginPage };
