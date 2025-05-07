import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object class that all page objects inherit from.
 * Contains common methods and properties shared across all pages.
 */
export class BasePage {
  readonly page: Page;
  readonly url: string;

  // Common elements across pages
  readonly hamburgerMenu: Locator;
  readonly shoppingCart: Locator;
  readonly appLogo: Locator;

  /**
   * @param {Page} page - Playwright page object
   * @param {string} url - URL path for this page (relative to base URL)
   */
  constructor(page: Page, url: string = '') {
    this.page = page;
    this.url = url;
    
    // Initialize common elements
    this.hamburgerMenu = page.locator('[data-test="burger-menu-button"]');
    this.shoppingCart = page.locator('.shopping_cart_link');
    this.appLogo = page.locator('.app_logo');
  }

  /**
   * Navigate to the page
   * @returns {Promise<void>}
   */
  async navigate(): Promise<void> {
    await this.page.goto(this.url);
  }

  /**
   * Get current page URL
   * @returns {Promise<string>}
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Check if page is displayed
   * @param {string} [expectedUrlPath] - Optional expected URL path to verify
   * @returns {Promise<boolean>}
   */
  async isDisplayed(expectedUrlPath?: string): Promise<boolean> {
    const currentUrl = await this.getCurrentUrl();
    return expectedUrlPath ? currentUrl.includes(expectedUrlPath) : true;
  }

  /**
   * Open the shopping cart
   * @returns {Promise<void>}
   */
  async openCart(): Promise<void> {
    await this.shoppingCart.click();
  }

  /**
   * Open the hamburger menu
   * @returns {Promise<void>}
   */
  async openMenu(): Promise<void> {
    await this.hamburgerMenu.click();
  }

  /**
   * Get the number of items in the cart from the cart badge
   * @returns {Promise<number>} - Number of items in cart (0 if badge not present)
   */
  async getCartItemCount(): Promise<number> {
    const cartBadge = this.page.locator('.shopping_cart_badge');
    
    // Check if cart badge exists (items in cart)
    const isVisible = await cartBadge.isVisible();
    if (!isVisible) {
      return 0;
    }
    
    // Get the text from the badge and convert to number
    const badgeText = await cartBadge.textContent();
    return badgeText ? parseInt(badgeText, 10) : 0;
  }

  /**
   * Wait for navigation to complete
   * @returns {Promise<void>}
   */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot of the current page
   * @param {string} name - Name of the screenshot file
   * @returns {Promise<Buffer>} - Screenshot buffer
   */
  async takeScreenshot(name: string): Promise<Buffer> {
    return await this.page.screenshot({ path: `./reports/screenshots/${name}.png`, fullPage: true });
  }
}
