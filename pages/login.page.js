const { BasePage } = require('./base.page');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    // ProHealth login form (/account/login).
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.getByRole('button', { name: /sign in to prohealth/i });
    // Bad-credential errors render as a PrimeNG inline error message.
    this.errorMessage = page.locator('.p-inline-message-error, [role="alert"], .field-validation-error');
  }

  /** Navigate to the login page. Pass the full URL. */
  async open(url) {
    await this.navigate(url);
    await this.waitForElement(this.emailInput);
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
