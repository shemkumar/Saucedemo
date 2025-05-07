import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/loginPage';
import { InventoryPage, SortOption } from '../page-objects/inventoryPage';
import { USER_CREDENTIALS, SORT_ORDERS } from '../utils/testData';

test.describe('Product Sorting Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page and login as standard user before each test
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(USER_CREDENTIALS.STANDARD.username, USER_CREDENTIALS.STANDARD.password);
    
    // Verify that login was successful and we're on the inventory page
    await expect(page).toHaveURL(/.*inventory.html/);
  });

  test('TC_01: Sort products by name Z to A', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    
    // Take a screenshot before sorting
    await inventoryPage.takeScreenshot('before_sort_za');
    
    // Sort products by name Z to A
    await inventoryPage.sortProductsBy(SortOption.ZA);
    
    // Take a screenshot after sorting
    await inventoryPage.takeScreenshot('after_sort_za');
    
    // Get product names after sorting
    const productNames = await inventoryPage.getProductNames();
    
    // Verify products are sorted by name Z to A
    const sortedZA = await inventoryPage.areProductsSortedZA();
    expect(sortedZA).toBeTruthy();
    
    // Compare against expected order
    expect(productNames).toEqual(SORT_ORDERS.ALPHABETICAL_ZA);
    
    // Additional validation: first product should be the alphabetically last
    expect(productNames[0]).toBe(SORT_ORDERS.ALPHABETICAL_ZA[0]);
  });

  test('TC_02: Sort products by price high to low', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    
    // Take a screenshot before sorting
    await inventoryPage.takeScreenshot('before_sort_price_high_low');
    
    // Sort products by price high to low
    await inventoryPage.sortProductsBy(SortOption.PRICE_HIGH_LOW);
    
    // Take a screenshot after sorting
    await inventoryPage.takeScreenshot('after_sort_price_high_low');
    
    // Get product prices after sorting
    const prices = await inventoryPage.getProductPrices();
    const productNames = await inventoryPage.getProductNames();
    
    // Verify products are sorted by price high to low
    const sortedByPriceHighLow = await inventoryPage.areProductsSortedByPriceHighToLow();
    expect(sortedByPriceHighLow).toBeTruthy();
    
    // First price should be higher than the last price
    expect(prices[0]).toBeGreaterThan(prices[prices.length - 1]);
    
    // Compare against expected order
    expect(productNames).toEqual(SORT_ORDERS.PRICE_HIGH_LOW);
    
    // Verify the first product is the most expensive one
    expect(productNames[0]).toBe(SORT_ORDERS.PRICE_HIGH_LOW[0]);
  });

  test('TC_03: Sort products by name A to Z', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    
    // First sort by Z-A to ensure we're not just validating the default order
    await inventoryPage.sortProductsBy(SortOption.ZA);
    
    // Now sort by A-Z
    await inventoryPage.sortProductsBy(SortOption.AZ);
    
    // Get product names after sorting
    const productNames = await inventoryPage.getProductNames();
    
    // Verify products are sorted by name A to Z
    const sortedAZ = await inventoryPage.areProductsSortedAZ();
    expect(sortedAZ).toBeTruthy();
    
    // Compare against expected order
    expect(productNames).toEqual(SORT_ORDERS.ALPHABETICAL_AZ);
  });

  test('TC_04: Sort products by price low to high', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    
    // First sort by high-low to ensure we're not just validating the default order
    await inventoryPage.sortProductsBy(SortOption.PRICE_HIGH_LOW);
    
    // Now sort by low-high
    await inventoryPage.sortProductsBy(SortOption.PRICE_LOW_HIGH);
    
    // Get product prices after sorting
    const prices = await inventoryPage.getProductPrices();
    const productNames = await inventoryPage.getProductNames();
    
    // Verify products are sorted by price low to high
    const sortedByPriceLowHigh = await inventoryPage.areProductsSortedByPriceLowToHigh();
    expect(sortedByPriceLowHigh).toBeTruthy();
    
    // First price should be lower than the last price
    expect(prices[0]).toBeLessThan(prices[prices.length - 1]);
    
    // Compare against expected order
    expect(productNames).toEqual(SORT_ORDERS.PRICE_LOW_HIGH);
  });
});
