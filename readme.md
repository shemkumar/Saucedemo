# Playwright Test Automation Implementation for SauceDemo

## Project Structure

```
sauce-demo-automation/
├── README.md                 # Documentation
├── package.json              # Dependencies
├── playwright.config.ts      # Playwright configuration
├── tests/                    # Test files
│   ├── sorting.spec.ts       # Product sorting tests
│   ├── checkout.spec.ts      # Cart and checkout tests
│   ├── visual.spec.ts        # Visual testing
│   └── accessibility.spec.ts # Accessibility testing
├── page-objects/             # Page Object Models
│   ├── login.page.ts         # Login page interactions
│   ├── inventory.page.ts     # Inventory page interactions
│   ├── cart.page.ts          # Cart page interactions
│   └── checkout.page.ts      # Checkout page interactions
├── utils/                    # Utility functions
│   ├── test-data.ts          # Test data (users, products)
│   └── helpers.ts            # Helper functions
├── reports/                  # Test reports and screenshots
└── .github/workflows/        # CI/CD configuration
    └── main.yml              # GitHub Actions workflow
```

## Implementation Details

### 1. Page Object Model

Following best practices, I'll implement a Page Object Model pattern to encapsulate page interactions and improve maintainability.

#### Login Page Example:

```typescript
// page-objects/login.page.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('#user-name');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('#login-button');
    this.errorMessage = page.locator('.error-message-container');
  }

  async navigateTo() {
    await this.page.goto('https://www.saucedemo.com/');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getErrorMessage() {
    return this.errorMessage.isVisible() ? this.errorMessage.textContent() : null;
  }

  async isLoggedIn() {
    return this.page.url().includes('inventory.html');
  }
}
```

#### Inventory Page Example:

```typescript
// page-objects/inventory.page.ts
import { Page, Locator } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly sortDropdown: Locator;
  readonly productNames: Locator;
  readonly productPrices: Locator;
  readonly addToCartButtons: Locator;
  readonly shoppingCartBadge: Locator;
  readonly shoppingCartLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sortDropdown = page.locator('.product_sort_container');
    this.productNames = page.locator('.inventory_item_name');
    this.productPrices = page.locator('.inventory_item_price');
    this.addToCartButtons = page.locator('button.btn_inventory');
    this.shoppingCartBadge = page.locator('.shopping_cart_badge');
    this.shoppingCartLink = page.locator('.shopping_cart_link');
  }

  async selectSortOption(option: 'az' | 'za' | 'lohi' | 'hilo') {
    await this.sortDropdown.selectOption(option);
  }

  async getProductNames() {
    return this.productNames.allTextContents();
  }

  async getProductPrices() {
    const priceTexts = await this.productPrices.allTextContents();
    return priceTexts.map(text => parseFloat(text.replace('$', '')));
  }

  async addProductToCart(productName: string) {
    const productContainer = this.page.locator(`.inventory_item:has-text("${productName}")`);
    await productContainer.locator('button').click();
  }

  async getCartItemCount() {
    try {
      return parseInt(await this.shoppingCartBadge.textContent() || '0');
    } catch {
      return 0;
    }
  }

  async navigateToCart() {
    await this.shoppingCartLink.click();
  }
}
```

### 2. Test Scenarios Implementation

#### Scenario 1: Verify sorting order Z-A

```typescript
// tests/sorting.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/login.page';
import { InventoryPage } from '../page-objects/inventory.page';

test.describe('Product Sorting Functionality', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigateTo();
    await loginPage.login('standard_user', 'secret_sauce');
  });

  test('TC_01 - Sort by Name (Z-A)', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    
    // Select Z-A sorting
    await inventoryPage.selectSortOption('za');
    
    // Get product names
    const productNames = await inventoryPage.getProductNames();
    
    // Verify sorting (Z-A)
    const sortedNames = [...productNames].sort((a, b) => b.localeCompare(a));
    expect(productNames).toEqual(sortedNames);
    
    // Additional visual verification (optional)
    await page.screenshot({ path: 'reports/sorted-za.png' });
  });
});
```

#### Scenario 2: Verify price order (high-low)

```typescript
// tests/sorting.spec.ts (continued)
test('TC_02 - Sort by Price (High-Low)', async ({ page }) => {
  const inventoryPage = new InventoryPage(page);
  
  // Select High-Low sorting
  await inventoryPage.selectSortOption('hilo');
  
  // Get product prices
  const prices = await inventoryPage.getProductPrices();
  
  // Verify sorting (High-Low)
  const sortedPrices = [...prices].sort((a, b) => b - a);
  expect(prices).toEqual(sortedPrices);
  
  // Verify highest price is first
  expect(prices[0]).toBe(Math.max(...prices));
});
```

#### Scenario 3: Cart and Checkout Flow

```typescript
// tests/checkout.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/login.page';
import { InventoryPage } from '../page-objects/inventory.page';
import { CartPage } from '../page-objects/cart.page';
import { CheckoutPage } from '../page-objects/checkout.page';

test.describe('Checkout Functionality', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigateTo();
    await loginPage.login('standard_user', 'secret_sauce');
  });

  test('TC_03 - Complete Checkout Process', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    
    // Add multiple items to cart
    await inventoryPage.addProductToCart('Sauce Labs Backpack');
    await inventoryPage.addProductToCart('Sauce Labs Bike Light');
    
    // Verify cart badge updated
    expect(await inventoryPage.getCartItemCount()).toBe(2);
    
    // Navigate to cart
    await inventoryPage.navigateToCart();
    
    // Verify items in cart
    const cartItems = await cartPage.getCartItems();
    expect(cartItems.length).toBe(2);
    expect(cartItems).toContain('Sauce Labs Backpack');
    expect(cartItems).toContain('Sauce Labs Bike Light');
    
    // Calculate expected total
    const itemPrices = await cartPage.getItemPrices();
    const expectedTotal = itemPrices.reduce((sum, price) => sum + price, 0);
    
    // Proceed to checkout
    await cartPage.checkout();
    
    // Fill checkout information
    await checkoutPage.fillInformation('John', 'Doe', '12345');
    await checkoutPage.continue();
    
    // Verify total matches expected
    const checkoutTotal = await checkoutPage.getTotal();
    expect(checkoutTotal).toBeCloseTo(expectedTotal);
    
    // Complete checkout
    await checkoutPage.finish();
    
    // Verify successful checkout
    expect(await page.locator('.complete-header').textContent()).toBe('Thank you for your order!');
    expect(await page.locator('.complete-text').isVisible()).toBeTruthy();
  });
});
```

### 3. Bonus Features Implementation

#### Visual Testing

```typescript
// tests/visual.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/login.page';

test.describe('Visual Testing', () => {
  test('Visual Test: Login Page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigateTo();
    
    // Compare screenshot with baseline
    await expect(page).toHaveScreenshot('login-page.png');
  });
  
  test('Visual Test: Inventory Page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigateTo();
    await loginPage.login('standard_user', 'secret_sauce');
    
    // Compare screenshot with baseline
    await expect(page).toHaveScreenshot('inventory-page.png');
  });
  
  test('Visual Test: Checkout Complete Page', async ({ page }) => {
    // ... Complete checkout flow first ...
    
    // Compare screenshot with baseline
    await expect(page).toHaveScreenshot('checkout-complete-page.png');
  });
});
```

#### Accessibility Testing

```typescript
// tests/accessibility.spec.ts
import { test } from '@playwright/test';
import { LoginPage } from '../page-objects/login.page';
import { InventoryPage } from '../page-objects/inventory.page';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Testing', () => {
  test('A11y Test: Login Page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigateTo();
    
    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    // Output results and assert no violations
    console.log(accessibilityScanResults.violations);
    expect(accessibilityScanResults.violations.length).toBe(0);
  });
  
  test('A11y Test: Inventory Page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);
    
    await loginPage.navigateTo();
    await loginPage.login('standard_user', 'secret_sauce');
    
    // Run accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    // Output results and assert no violations
    console.log(accessibilityScanResults.violations);
    expect(accessibilityScanResults.violations.length).toBe(0);
  });
});
```

## Configuration Files

### Playwright Config

```typescript
// playwright.config.ts
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: 30000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'reports/html-report' }],
    ['json', { outputFile: 'reports/test-results.json' }]
  ],
  use: {
    baseURL: 'https://www.saucedemo.com/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
};

export default config;
```

### Package.json

```json
{
  "name": "sauce-demo-automation",
  "version": "1.0.0",
  "description": "Playwright automation suite for SauceDemo website",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui",
    "report": "playwright show-report reports/html-report"
  },
  "dependencies": {
    "@playwright/test": "^1.40.0",
    "@axe-core/playwright": "^4.7.0",
    "typescript": "^5.2.2"
  }
}
```

## README.md Content

```markdown
# SauceDemo Automated Testing

Automated test suite for SauceDemo using Playwright.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Setup Instructions

1. Clone the repository
   ```
   git clone https://github.com/yourusername/sauce-demo-automation.git
   cd sauce-demo-automation
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Install Playwright browsers
   ```
   npx playwright install
   ```

## Running Tests

### Headless Mode
```
npm test
```

### Headed Mode (Visual Browser)
```
npm run test:headed
```

### UI Mode (Interactive)
```
npm run test:ui
```

### Generate and View HTML Report
```
npm run report
```

## Test Coverage

1. **Product Sorting**
   - Sorting products by name (Z-A)
   - Sorting products by price (High-Low)

2. **Checkout Flow**
   - Adding multiple items to cart
   - Validating cart contents
   - Completing checkout process

3. **Bonus Features**
   - Visual testing with screenshot comparison
   - Accessibility testing with axe-core

## CI/CD Integration

This project includes GitHub Actions workflows for continuous integration.
```

## GitHub Actions Workflow

```yaml
# .github/workflows/main.yml
name: Playwright Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Install Playwright browsers
      run: npx playwright install --with-deps
      
    - name: Run Playwright tests
      run: npm test
      
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: playwright-report
        path: reports/
        retention-days: 30
```
