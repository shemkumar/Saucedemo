import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/loginPage';
import { InventoryPage } from '../page-objects/inventoryPage';
import { CartPage } from '../page-objects/cartPage';
import { CheckoutInfoPage, CheckoutOverviewPage, CheckoutCompletePage } from '../page-objects/checkoutPage';
import { USER_CREDENTIALS, CART_PRODUCTS, CUSTOMER_INFO, ERROR_MESSAGES } from '../utils/testData';

test.describe('Shopping Cart and Checkout Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page and login as standard user before each test
    const loginPage = new LoginPage(page);
    await loginPage.navigate();
    await loginPage.login(USER_CREDENTIALS.STANDARD.username, USER_CREDENTIALS.STANDARD.password);
    
    // Verify that login was successful and we're on the inventory page
    await expect(page).toHaveURL(/.*inventory.html/);
  });

  test('TC_05: Add multiple items to cart and verify cart badge', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    
    // Add multiple products to cart
    await inventoryPage.addProductsToCart(CART_PRODUCTS);
    
    // Verify cart badge shows correct count
    const cartCount = await inventoryPage.getCartItemCount();
    expect(cartCount).toBe(CART_PRODUCTS.length);
  });

  test('TC_06: Verify cart contents match added products', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    
    // Add multiple products to cart
    await inventoryPage.addProductsToCart(CART_PRODUCTS);
    
    // Navigate to cart page
    await inventoryPage.openCart();
    
    // Verify cart displays correct items
    const cartItemNames = await cartPage.getCartItemNames();
    expect(cartItemNames).toHaveLength(CART_PRODUCTS.length);
    
    // Verify each product is in the cart
    for (const productName of CART_PRODUCTS) {
      expect(cartItemNames).toContain(productName);
    }
  });

  test('TC_07: Remove item from cart and verify cart badge update', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    
    // Add multiple products to cart
    await inventoryPage.addProductsToCart(CART_PRODUCTS);
    
    // Navigate to cart page
    await inventoryPage.openCart();
    
    // Get initial cart count
    let cartCount = await cartPage.getCartItemCount();
    expect(cartCount).toBe(CART_PRODUCTS.length);
    
    // Remove first product
    const productToRemove = CART_PRODUCTS[0];
    await cartPage.removeProductByName(productToRemove);
    
    // Get updated cart count
    cartCount = await cartPage.getCartItemCount();
    expect(cartCount).toBe(CART_PRODUCTS.length - 1);
    
    // Verify removed item is no longer in cart
    const hasProduct = await cartPage.hasProduct(productToRemove);
    expect(hasProduct).toBeFalsy();
  });

  test('TC_08: Complete checkout with multiple items', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutInfoPage = new CheckoutInfoPage(page);
    const checkoutOverviewPage = new CheckoutOverviewPage(page);
    const checkoutCompletePage = new CheckoutCompletePage(page);
    
    // Add multiple products to cart
    await inventoryPage.addProductsToCart(CART_PRODUCTS);
    
    // Navigate to cart page
    await inventoryPage.openCart();
    
    // Proceed to checkout
    await cartPage.proceedToCheckout();
    
    // Fill checkout information
    await checkoutInfoPage.completeCheckoutInfo(
      CUSTOMER_INFO.firstName,
      CUSTOMER_INFO.lastName,
      CUSTOMER_INFO.postalCode
    );
    
    // Verify products in checkout overview match cart
    const overviewItems = await checkoutOverviewPage.getItemNames();
    expect(overviewItems).toHaveLength(CART_PRODUCTS.length);
    
    for (const productName of CART_PRODUCTS) {
      expect(overviewItems).toContain(productName);
    }
    
    // Verify tax calculation (8% of subtotal)
    const taxCalculationValid = await checkoutOverviewPage.validateTaxCalculation();
    expect(taxCalculationValid).toBeTruthy();
    
    // Verify total calculation (subtotal + tax)
    const totalCalculationValid = await checkoutOverviewPage.validateTotalCalculation();
    expect(totalCalculationValid).toBeTruthy();
    
    // Complete order
    await checkoutOverviewPage.finishOrder();
    
    // Verify order confirmation page is displayed
    await expect(page).toHaveURL(/.*checkout-complete.html/);
    
    // Verify thank you message
    const thankYouMessage = await checkoutCompletePage.getThankYouMessage();
    expect(thankYouMessage).toContain('Thank you for your order');
  });

  test('TC_09: Verify checkout form validation', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutInfoPage = new CheckoutInfoPage(page);
    
    // Add a product to cart
    await inventoryPage.addProductToCartByName(CART_PRODUCTS[0]);
    
    // Navigate to cart page
    await inventoryPage.openCart();
    
    // Proceed to checkout
    await cartPage.proceedToCheckout();
    
    // Try to continue without entering any information
    await checkoutInfoPage.continueButton.click();
    
    // Verify error message for empty first name
    let errorMessage = await checkoutInfoPage.getErrorMessage();
    expect(errorMessage).toBe(ERROR_MESSAGES.EMPTY_FIRST_NAME);
    
    // Enter first name only and try to continue
    await checkoutInfoPage.firstNameInput.fill(CUSTOMER_INFO.firstName);
    await checkoutInfoPage.continueButton.click();
    
    // Verify error message for empty last name
    errorMessage = await checkoutInfoPage.getErrorMessage();
    expect(errorMessage).toBe(ERROR_MESSAGES.EMPTY_LAST_NAME);
    
    // Enter last name and try to continue
    await checkoutInfoPage.lastNameInput.fill(CUSTOMER_INFO.lastName);
    await checkoutInfoPage.continueButton.click();
    
    // Verify error message for empty postal code
    errorMessage = await checkoutInfoPage