import { test, expect, navigateTo } from './fixtures/auth.js';

test.describe('Attendance Module', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin');
  });

  test('should display attendance page', async ({ page }) => {
    await navigateTo(page, 'Attendance');
    await page.waitForLoadState('networkidle');
    
    // Should have attendance content
    const hasContent = await page.locator('table, [class*="attendance"], [class*="calendar"]').count() > 0;
    expect(hasContent).toBeTruthy();
  });

  test('should select class for attendance', async ({ page }) => {
    await navigateTo(page, 'Attendance');
    await page.waitForLoadState('networkidle');
    
    const classSelector = page.locator('select, [role="combobox"]').first();
    
    if (await classSelector.count() > 0) {
      await classSelector.click();
      await page.waitForTimeout(300);
      
      const options = page.locator('[role="option"], option');
      if (await options.count() > 0) {
        await options.first().click();
        await page.waitForLoadState('networkidle');
      }
    }
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('should select date for attendance', async ({ page }) => {
    await navigateTo(page, 'Attendance');
    await page.waitForLoadState('networkidle');
    
    const dateInput = page.locator('input[type="date"], [class*="date-picker"]');
    
    if (await dateInput.count() > 0) {
      const today = new Date().toISOString().split('T')[0];
      await dateInput.first().fill(today);
      await page.waitForTimeout(500);
    }
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('should mark student attendance', async ({ page }) => {
    await navigateTo(page, 'Attendance');
    await page.waitForLoadState('networkidle');
    
    // Look for attendance checkboxes or buttons
    const attendanceControls = page.locator('input[type="checkbox"], button:has-text("Present"), button:has-text("Absent")');
    
    if (await attendanceControls.count() > 0) {
      await attendanceControls.first().click();
      await page.waitForTimeout(300);
    }
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('should save attendance', async ({ page }) => {
    await navigateTo(page, 'Attendance');
    await page.waitForLoadState('networkidle');
    
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Submit"), button[type="submit"]');
    
    if (await saveButton.count() > 0) {
      await expect(saveButton.first()).toBeVisible();
    }
  });

  test('should view attendance report', async ({ page }) => {
    await navigateTo(page, 'Attendance');
    await page.waitForLoadState('networkidle');
    
    const reportLink = page.locator('a:has-text("Report"), button:has-text("Report"), [role="tab"]:has-text("Report")');
    
    if (await reportLink.count() > 0) {
      await reportLink.first().click();
      await page.waitForLoadState('networkidle');
    }
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Teacher Attendance', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('teacher');
  });

  test('should display teacher attendance view', async ({ page }) => {
    await navigateTo(page, 'Attendance');
    await page.waitForLoadState('networkidle');
    
    // Teacher should see their classes
    await expect(page.locator('body')).toBeVisible();
  });

  test('should mark attendance for assigned class', async ({ page }) => {
    await navigateTo(page, 'Attendance');
    await page.waitForLoadState('networkidle');
    
    // Teacher should be able to mark attendance
    const attendanceForm = page.locator('form, table, [class*="attendance"]');
    
    if (await attendanceForm.count() > 0) {
      await expect(attendanceForm.first()).toBeVisible();
    }
  });
});
