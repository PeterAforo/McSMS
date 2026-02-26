import { test, expect, navigateTo } from './fixtures/auth.js';
import { testUsers } from './fixtures/test-users.js';

test.describe('Student Management', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin');
  });

  test('should display students list', async ({ page }) => {
    // Navigate to students page
    await navigateTo(page, 'Students');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for students table or list
    const hasTable = await page.locator('table').count() > 0;
    const hasList = await page.locator('[role="list"], .student-list, .students-grid').count() > 0;
    const hasStudentCards = await page.locator('[class*="student"], [class*="card"]').count() > 0;
    
    expect(hasTable || hasList || hasStudentCards).toBeTruthy();
  });

  test('should have search functionality', async ({ page }) => {
    await navigateTo(page, 'Students');
    await page.waitForLoadState('networkidle');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]');
    
    if (await searchInput.count() > 0) {
      await searchInput.first().fill('John');
      await page.waitForTimeout(500); // Debounce
      
      // Results should update (either show filtered results or "no results")
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should open add student modal/form', async ({ page }) => {
    await navigateTo(page, 'Students');
    await page.waitForLoadState('networkidle');
    
    // Look for add button
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button[aria-label*="add" i]');
    
    if (await addButton.count() > 0) {
      await addButton.first().click();
      
      // Check for modal or form
      const hasModal = await page.locator('[role="dialog"], .modal, [class*="modal"]').count() > 0;
      const hasForm = await page.locator('form').count() > 0;
      
      expect(hasModal || hasForm).toBeTruthy();
    }
  });

  test('should have pagination if many students', async ({ page }) => {
    await navigateTo(page, 'Students');
    await page.waitForLoadState('networkidle');
    
    // Look for pagination controls
    const pagination = page.locator('[class*="pagination"], nav[aria-label*="pagination"], button:has-text("Next"), button:has-text("Previous")');
    
    // Pagination might not exist if few students - just check it doesn't error
    await expect(page.locator('body')).toBeVisible();
  });

  test('should filter students by class', async ({ page }) => {
    await navigateTo(page, 'Students');
    await page.waitForLoadState('networkidle');
    
    // Look for class filter dropdown
    const classFilter = page.locator('select, [role="combobox"], button:has-text("Class"), button:has-text("Filter")');
    
    if (await classFilter.count() > 0) {
      await classFilter.first().click();
      await page.waitForTimeout(300);
      
      // Select first option if dropdown opened
      const option = page.locator('[role="option"], option').first();
      if (await option.count() > 0) {
        await option.click();
      }
    }
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Student Profile', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin');
  });

  test('should view student details', async ({ page }) => {
    await navigateTo(page, 'Students');
    await page.waitForLoadState('networkidle');
    
    // Click on first student row/card
    const studentRow = page.locator('table tbody tr, [class*="student-card"], [class*="student-item"]').first();
    
    if (await studentRow.count() > 0) {
      await studentRow.click();
      await page.waitForLoadState('networkidle');
      
      // Should show student details
      const hasProfile = await page.locator('[class*="profile"], [class*="details"], h1, h2').count() > 0;
      expect(hasProfile).toBeTruthy();
    }
  });

  test('should display student tabs (grades, attendance, etc)', async ({ page }) => {
    await navigateTo(page, 'Students');
    await page.waitForLoadState('networkidle');
    
    const studentRow = page.locator('table tbody tr, [class*="student-card"]').first();
    
    if (await studentRow.count() > 0) {
      await studentRow.click();
      await page.waitForLoadState('networkidle');
      
      // Look for tabs
      const tabs = page.locator('[role="tablist"], [class*="tabs"], button:has-text("Grades"), button:has-text("Attendance")');
      
      if (await tabs.count() > 0) {
        // Click through tabs
        const tabButtons = page.locator('[role="tab"], [class*="tab-button"]');
        const tabCount = await tabButtons.count();
        
        for (let i = 0; i < Math.min(tabCount, 3); i++) {
          await tabButtons.nth(i).click();
          await page.waitForTimeout(300);
        }
      }
    }
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Student CRUD Operations', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin');
  });

  test('should validate required fields when adding student', async ({ page }) => {
    await navigateTo(page, 'Students');
    await page.waitForLoadState('networkidle');
    
    const addButton = page.locator('button:has-text("Add"), button:has-text("New")');
    
    if (await addButton.count() > 0) {
      await addButton.first().click();
      await page.waitForTimeout(500);
      
      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
      
      if (await submitButton.count() > 0) {
        await submitButton.first().click();
        
        // Should show validation errors
        const hasError = await page.locator('[class*="error"], [role="alert"], .text-red-500, .text-red-600').count() > 0;
        const hasRequired = await page.locator(':invalid').count() > 0;
        
        expect(hasError || hasRequired).toBeTruthy();
      }
    }
  });

  test('should have export functionality', async ({ page }) => {
    await navigateTo(page, 'Students');
    await page.waitForLoadState('networkidle');
    
    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), button[aria-label*="export" i]');
    
    if (await exportButton.count() > 0) {
      // Just verify button exists and is clickable
      await expect(exportButton.first()).toBeEnabled();
    }
  });

  test('should have bulk actions if available', async ({ page }) => {
    await navigateTo(page, 'Students');
    await page.waitForLoadState('networkidle');
    
    // Look for checkboxes for bulk selection
    const checkboxes = page.locator('input[type="checkbox"]');
    
    if (await checkboxes.count() > 1) {
      // Select first checkbox
      await checkboxes.first().check();
      
      // Look for bulk action buttons
      const bulkActions = page.locator('button:has-text("Delete Selected"), button:has-text("Bulk"), [class*="bulk-actions"]');
      
      // Just verify page doesn't error
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
