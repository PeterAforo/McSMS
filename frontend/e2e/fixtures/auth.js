import { test as base, expect } from '@playwright/test';
import { testUsers } from './test-users.js';

// Extended test fixture with authentication helpers
export const test = base.extend({
  // Auto-login as admin
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/');
    await page.fill('input[type="email"], input[name="email"]', testUsers.admin.email);
    await page.fill('input[type="password"]', testUsers.admin.password);
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL(/admin|dashboard/, { timeout: 15000 }).catch(() => {});
    
    await use(page);
  },
  
  // Login helper function
  loginAs: async ({ page }, use) => {
    const login = async (userType) => {
      const user = testUsers[userType];
      if (!user) throw new Error(`Unknown user type: ${userType}`);
      
      await page.goto('/');
      await page.fill('input[type="email"], input[name="email"]', user.email);
      await page.fill('input[type="password"]', user.password);
      await page.click('button[type="submit"]');
      
      // Wait for navigation
      await page.waitForURL(/dashboard|admin|teacher|parent|student|principal|hr|finance/, { 
        timeout: 15000 
      }).catch(() => {});
      
      return user;
    };
    
    await use(login);
  },
});

export { expect };

// Helper to check if user is logged in
export async function isLoggedIn(page) {
  const url = page.url();
  return !url.includes('login') && !url.endsWith('/');
}

// Helper to logout
export async function logout(page) {
  // Try to find and click logout button
  const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), [aria-label*="logout"]');
  if (await logoutButton.count() > 0) {
    await logoutButton.first().click();
    await page.waitForURL(/login|\/$/);
  }
}

// Helper to navigate via sidebar
export async function navigateTo(page, menuText) {
  const menuItem = page.locator(`nav a:has-text("${menuText}"), aside a:has-text("${menuText}")`);
  if (await menuItem.count() > 0) {
    await menuItem.first().click();
    await page.waitForLoadState('networkidle');
  }
}
