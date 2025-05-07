import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './basePage';

/**
 * Page object representing the SauceDemo login page
 */
export class LoginPage extends BasePage {
  // Page elements
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly loginLogo: Locator;

  /**
   * @param {Page} page - Playwright page object
   */
  constructor(page: Page) {
    super(page, '/');
    
    // Initialize page elements
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.loginLogo = page.locator('.login_logo');
  }

  /**
   * Login with the specified username and password
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<void>}
   */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    
    // Wait for navigation to complete after login
    await this.waitForNavigation();
  }

  /**
   * Check if login error message is displayed
   * @returns {Promise<boolean>}
   */
  async isErrorMessageDisplayed(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get the text of the error message
   * @returns {Promise<string|null>}
   */
  async getErrorMessage(): Promise<string | null> {
    const isVisible = await this.isErrorMessageDisplayed();
    if (!isVisible) {
      return null;
    }
    return await this.errorMessage.textContent();
  }

  /**
   * Verify login was successful by checking URL
   * @returns {Promise<boolean>}
   */
  async isLoginSuccessful(): Promise<boolean> {
    const currentUrl = await this.getCurrentUrl();
    return currentUrl.includes('/inventory.html');
  }

  /**
   * Assert that login was successful
   * @returns {Promise<void>}
   */
  async expectLoginSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/.*inventory.html/);
  }

  /**
   * Assert that login failed with an error message
   * @param {string} [expectedError] - Optional expected error message
   * @returns {Promise<void>}
   */
  async expectLoginFailure(expectedError?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    
    if (expectedError) {
      await expect(this.errorMessage).toContainText(expectedError);
    }
  }
}
