import { Page, Locator } from '@playwright/test';
import { BasePage } from './basePage';

/**
 * Interface representing a cart item
 */
export interface CartItem {
  name: string;
  description: string;
  price: number;
  quantity: number;
}

/**
 * Page object representing the SauceDemo cart page
 */
export class CartPage extends BasePage {
  // Page elements
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly removeButtons: Locator;
  readonly title: Locator;
  
  /**
   * @param {Page} page - Playwright page object
   */
  constructor(page: Page) {
    super(page, '/cart.html');
    
    // Initialize page elements
    this.cartItems = page.locator('.cart_item');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
    this.itemNames = page.locator('.inventory_item_name');
    this.itemPrices = page.locator('.inventory_item_price');
    this.removeButtons = page.locator('button.cart_button');
    this.title = page.locator('.title');
  }

  /**
   * Get all cart item names
   * @returns {Promise<string[]>}
   */
  async getCartItemNames(): Promise<string[]> {
    const count = await this.itemNames.count();
    const names: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const name = await this.itemNames.nth(i).textContent();
      if (name) names.push(name.trim());
    }
    
    return names;
  }

  /**
   * Get details of all items in the cart
   * @returns {Promise<CartItem[]>}
   */
  async getCartItems(): Promise<CartItem[]> {
    const count = await this.cartItems.count();
    const items: CartItem[] = [];
    
    for (let i = 0; i < count; i++) {
      const item = this.cartItems.nth(i);
      
      const name = await item.locator('.inventory_item_name').textContent() || '';
      const description = await item.locator('.inventory_item_desc').textContent() || '';
      const priceText = await item.locator('.inventory_item_price').textContent() || '';
      const price = parseFloat(priceText.replace('$', ''));
      
      // For SauceDemo, quantity is always 1 per item, but we include it for completeness
      const quantity = 1;
      
      items.push({ name, description, price, quantity });
    }
    
    return items;
  }

  /**
   * Get the total number of items in the cart
   * @returns {Promise<number>}
   */
  async getCartItemCount(): Promise<number> {
    return await this.cartItems.count();
  }

  /**
   * Check if cart contains a specific product