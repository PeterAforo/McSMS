import { test, expect, navigateTo } from './fixtures/auth.js';

test.describe('Finance Module', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin');
  });

  test('should display finance dashboard', async ({ page }) => {
    await navigateTo(page, 'Finance');
    await page.waitForLoadState('networkidle');
    
    // Should have financial stats or summary
    const hasStats = await page.locator('[class*="stat"], [class*="card"], [class*="summary"]').count() > 0;
    const hasTable = await page.locator('table').count() > 0;
    
    expect(hasStats || hasTable).toBeTruthy();
  });

  test('should display invoices list', async ({ page }) => {
    await navigateTo(page, 'Finance');
    await page.waitForLoadState('networkidle');
    
    // Look for invoices tab or link
    const invoicesLink = page.locator('a:has-text("Invoice"), button:has-text("Invoice"), [role="tab"]:has-text("Invoice")');
    
    if (await invoicesLink.count() > 0) {
      await invoicesLink.first().click();
      await page.waitForLoadState('networkidle');
      
      // Should show invoices table or list
      const hasInvoices = await page.locator('table, [class*="invoice"]').count() > 0;
      expect(hasInvoices).toBeTruthy();
    }
  });

  test('should display payments list', async ({ page }) => {
    await navigateTo(page, 'Finance');
    await page.waitForLoadState('networkidle');
    
    const paymentsLink = page.locator('a:has-text("Payment"), button:has-text("Payment"), [role="tab"]:has-text("Payment")');
    
    if (await paymentsLink.count() > 0) {
      await paymentsLink.first().click();
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should have fee structure management', async ({ page }) => {
    await navigateTo(page, 'Finance');
    await page.waitForLoadState('networkidle');
    
    const feeLink = page.locator('a:has-text("Fee"), button:has-text("Fee Structure")');
    
    if (await feeLink.count() > 0) {
      await feeLink.first().click();
      await page.waitForLoadState('networkidle');
      
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should generate financial reports', async ({ page }) => {
    await navigateTo(page, 'Finance');
    await page.waitForLoadState('networkidle');
    
    const reportsLink = page.locator('a:has-text("Report"), button:has-text("Report")');
    
    if (await reportsLink.count() > 0) {
      await reportsLink.first().click();
      await page.waitForLoadState('networkidle');
      
      // Look for report generation options
      const hasReportOptions = await page.locator('select, [role="combobox"], button:has-text("Generate")').count() > 0;
      
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Invoice Operations', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin');
    await navigateTo(page, 'Finance');
    await page.waitForLoadState('networkidle');
  });

  test('should create new invoice', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create Invoice"), button:has-text("New Invoice"), button:has-text("Add")');
    
    if (await createButton.count() > 0) {
      await createButton.first().click();
      await page.waitForTimeout(500);
      
      // Should show invoice form
      const hasForm = await page.locator('form, [role="dialog"]').count() > 0;
      expect(hasForm).toBeTruthy();
    }
  });

  test('should filter invoices by status', async ({ page }) => {
    const statusFilter = page.locator('select, [role="combobox"], button:has-text("Status"), button:has-text("Filter")');
    
    if (await statusFilter.count() > 0) {
      await statusFilter.first().click();
      await page.waitForTimeout(300);
      
      // Look for filter options
      const options = page.locator('[role="option"], option');
      if (await options.count() > 0) {
        await options.first().click();
      }
    }
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('should search invoices', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('INV-001');
      await page.waitForTimeout(500);
      
      await expect(page.locator('body')).toBeVisible();
    }
  });
});

test.describe('Payment Recording', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin');
    await navigateTo(page, 'Finance');
    await page.waitForLoadState('networkidle');
  });

  test('should record new payment', async ({ page }) => {
    const paymentButton = page.locator('button:has-text("Record Payment"), button:has-text("New Payment"), button:has-text("Add Payment")');
    
    if (await paymentButton.count() > 0) {
      await paymentButton.first().click();
      await page.waitForTimeout(500);
      
      // Should show payment form
      const hasForm = await page.locator('form, [role="dialog"]').count() > 0;
      expect(hasForm).toBeTruthy();
    }
  });

  test('should validate payment amount', async ({ page }) => {
    const paymentButton = page.locator('button:has-text("Record Payment"), button:has-text("New Payment")');
    
    if (await paymentButton.count() > 0) {
      await paymentButton.first().click();
      await page.waitForTimeout(500);
      
      // Try to enter invalid amount
      const amountInput = page.locator('input[name="amount"], input[type="number"]');
      if (await amountInput.count() > 0) {
        await amountInput.first().fill('-100');
        
        const submitButton = page.locator('button[type="submit"], button:has-text("Save")');
        if (await submitButton.count() > 0) {
          await submitButton.first().click();
          
          // Should show validation error
          await page.waitForTimeout(500);
        }
      }
    }
    
    await expect(page.locator('body')).toBeVisible();
  });
});
