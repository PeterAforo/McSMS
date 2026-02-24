import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/McSMS|School|Management/i);
  });

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');
    
    // Should either show 404 or redirect to login/home
    const url = page.url();
    const is404 = await page.locator('text=/404|not found|page not found/i').count() > 0;
    const isRedirected = url.includes('login') || url === 'http://localhost:5173/';
    
    expect(is404 || isRedirected).toBeTruthy();
  });
});

test.describe('Theme', () => {
  test('should toggle dark mode if available', async ({ page }) => {
    await page.goto('/');
    
    // Look for theme toggle button
    const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="dark"], button:has(svg[class*="moon"]), button:has(svg[class*="sun"])');
    
    if (await themeToggle.count() > 0) {
      // Get initial state
      const htmlElement = page.locator('html');
      const initialDark = await htmlElement.evaluate(el => el.classList.contains('dark'));
      
      // Click toggle
      await themeToggle.first().click();
      
      // Wait for transition
      await page.waitForTimeout(500);
      
      // Check if state changed
      const afterDark = await htmlElement.evaluate(el => el.classList.contains('dark'));
      expect(afterDark).not.toBe(initialDark);
    }
  });
});

test.describe('Accessibility', () => {
  test('should have no major accessibility issues on login page', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic accessibility
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const hasLabel = await input.evaluate(el => {
        const id = el.id;
        const name = el.name;
        const ariaLabel = el.getAttribute('aria-label');
        const ariaLabelledBy = el.getAttribute('aria-labelledby');
        const placeholder = el.placeholder;
        const label = id ? document.querySelector(`label[for="${id}"]`) : null;
        
        return !!(label || ariaLabel || ariaLabelledBy || placeholder);
      });
      
      expect(hasLabel).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Tab through the page
    await page.keyboard.press('Tab');
    
    // Check that something is focused
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});
