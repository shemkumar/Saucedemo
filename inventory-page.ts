import { Page, Locator } from '@playwright/test';
import { BasePage } from './basePage';

/**
 * Sort options available on the inventory page
 */
export enum SortOption {
  AZ = 'az',
  ZA = 'za',
  PRICE_LOW_HIGH = 'lohi',
  PRICE_HIGH_LOW = 'hilo',
}

/**
 * Product interface representing a product on the inventory page
 */
export interface Product {
  name: string;
  description: string;
  price: number;
  id: string;
}

/**
 * Page object representing the SauceDemo inventory page
 */
export class InventoryPage extends BasePage {
  // Page elements
  readonly productList: Locator;
  readonly productItems: Locator;
  readonly sortDropdown: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;
  readonly title: Locator;
  
  /**
   * @param {Page} page - Playwright page object
   */
  constructor(page: Page) {
    super(page, '/inventory.html');
    
    // Initialize page elements
    this.productList = page.locator('.inventory_list');
    this.productItems = page.locator('.inventory_item');
    this.sortDropdown = page.locator('[data-test="product_sort_container"]');
    this.productNames = page.locator('.inventory_item_name');
    this.productPrices = page.locator('.inventory_item_price');
    this.title = page.locator('.title');
  }

  /**
   * Sort products by the specified option
   * @param {SortOption} option - Sort option to select
   * @returns {Promise<void>}
   */
  async sortProductsBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(`name-${option}`);
    // Wait for the sort to be applied
    await this.page.waitForTimeout(300);
  }

  /**
   * Get all product names in the current display order
   * @returns {Promise<string[]>}
   */
  async getProductNames(): Promise<string[]> {
    // Get all product name elements and extract their text content
    const count = await this.productNames.count();
    const names: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const name = await this.productNames.nth(i).textContent();
      if (name) names.push(name.trim());
    }
    
    return names;
  }

  /**
   * Get all product prices in the current display order
   * @returns {Promise<number[]>}
   */
  async getProductPrices(): Promise<number[]> {
    // Get all product price elements and extract their text content as numbers
    const count = await this.productPrices.count();
    const prices: number[] = [];
    
    for (let i = 0; i < count; i++) {
      const priceText = await this.productPrices.nth(i).textContent();
      if (priceText) {
        // Convert price string like "$29.99" to number 29.99
        const price = parseFloat(priceText.replace('$', ''));
        prices.push(price);
      }
    }
    
    return prices;
  }

  /**
   * Get all products with their details
   * @returns {Promise<Product[]>}
   */
  async getProducts(): Promise<Product[]> {
    const count = await this.productItems.count();
    const products: Product[] = [];
    
    for (let i = 0; i < count; i++) {
      const item = this.productItems.nth(i);
      
      const name = await item.locator('.inventory_item_name').textContent() || '';
      const description = await item.locator('.inventory_item_desc').textContent() || '';
      const priceText = await item.locator('.inventory_item_price').textContent() || '';
      const price = parseFloat(priceText.replace('$', ''));
      
      // Extract product ID from the "add to cart" button's data-test attribute
      const addToCartBtn = item.locator('button');
      const dataTestAttr = await addToCartBtn.getAttribute('data-test') || '';
      const id = dataTestAttr.replace('add-to-cart-', '');
      
      products.push({ name, description, price, id });
    }
    
    return products;
  }

  /**
   * Add a product to the cart by its name
   * @param {string} productName - Name of the product to add
   * @returns {Promise<void>}
   */
  async addProductToCartByName(productName: string): Promise<void> {
    // Find the inventory item that contains the product name
    const productNameLoc = this.page.locator('.inventory_item_name', { hasText: productName });
    const inventoryItem = productNameLoc.locator('..').locator('..');
    
    // Click the add to cart button within that inventory item
    await inventoryItem.locator('button', { hasText: 'Add to cart' }).click();
  }

  /**
   * Add multiple products to the cart by their names
   * @param {string[]} productNames - Names of products to add
   * @returns {Promise<void>}
   */
  async addProductsToCart(productNames: string[]): Promise<void> {
    for (const name of productNames) {
      await this.addProductToCartByName(name);
    }
  }

  /**
   * Verify if products are sorted alphabetically A to Z
   * @returns {Promise<boolean>}
   */
  async areProductsSortedAZ(): Promise<boolean> {
    const names = await this.getProductNames();
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
    
    return JSON.stringify(names) === JSON.stringify(sortedNames);
  }

  /**
   * Verify if products are sorted alphabetically Z to A
   * @returns {Promise<boolean>}
   */
  async areProductsSortedZA(): Promise<boolean> {
    const names = await this.getProductNames();
    const sortedNames = [...names].sort((a, b) => b.localeCompare(a));
    
    return JSON.stringify(names) === JSON.stringify(sortedNames);
  }

  /**
   * Verify if products are sorted by price low to high
   * @returns {Promise<boolean>}
   */
  async areProductsSortedByPriceLowToHigh(): Promise<boolean> {
    const prices = await this.getProductPrices();
    const sortedPrices = [...prices].sort((a, b) => a - b);
    
    return JSON.stringify(prices) === JSON.stringify(sortedPrices);
  }

  /**
   * Verify if products are sorted by price high to low
   * @returns {Promise<boolean>}
   */
  async areProductsSortedByPriceHighToLow(): Promise<boolean> {
    const prices = await this.getProductPrices();
    const sortedPrices = [...prices].sort((a, b) => b - a);
    
    return JSON.stringify(prices) === JSON.stringify(sortedPrices);
  }
}
