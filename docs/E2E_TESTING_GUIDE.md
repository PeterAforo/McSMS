# McSMS E2E Testing Guide

**Date:** 2026-02-26  
**Framework:** Playwright  
**Test Count:** 56 tests across 6 files

---

## Overview

End-to-end (E2E) tests verify the application works correctly from a user's perspective by automating browser interactions.

---

## Test Structure

```
frontend/e2e/
├── fixtures/
│   ├── auth.js           # Authentication helpers and fixtures
│   └── test-users.js     # Test user credentials
├── auth.spec.js          # Login/logout tests
├── navigation.spec.js    # Navigation and accessibility tests
├── dashboard.spec.js     # Dashboard functionality tests
├── students.spec.js      # Student management tests
├── finance.spec.js       # Finance module tests
└── attendance.spec.js    # Attendance module tests
```

---

## Running Tests

### Run all tests
```bash
cd frontend
npm run test:e2e
```

### Run with UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run specific test file
```bash
npx playwright test auth.spec.js
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests with debug mode
```bash
npx playwright test --debug
```

### Generate HTML report
```bash
npx playwright show-report
```

---

## Test Categories

### Authentication Tests (`auth.spec.js`)
- Login page display
- Invalid credentials handling
- Password visibility toggle
- Forgot password navigation
- Role-based login redirects

### Navigation Tests (`navigation.spec.js`)
- Application loading
- Responsive design (mobile, tablet, desktop)
- 404 page handling
- Dark mode toggle
- Keyboard navigation

### Dashboard Tests (`dashboard.spec.js`)
- Statistics display
- Sidebar navigation
- Topbar user info
- Widget interactions
- Session persistence
- Logout functionality

### Student Management Tests (`students.spec.js`)
- Student list display
- Search functionality
- Add student modal
- Pagination
- Class filtering
- Student profile view
- CRUD operations
- Export functionality

### Finance Tests (`finance.spec.js`)
- Finance dashboard
- Invoice management
- Payment recording
- Fee structure
- Financial reports

### Attendance Tests (`attendance.spec.js`)
- Attendance page display
- Class selection
- Date selection
- Marking attendance
- Attendance reports

---

## Test Fixtures

### Authentication Fixture
```javascript
import { test, expect } from './fixtures/auth.js';

test('example with login', async ({ page, loginAs }) => {
  await loginAs('admin');
  // Now logged in as admin
});
```

### Available Users
- `admin` - System administrator
- `teacher` - Teacher account
- `parent` - Parent account
- `student` - Student account
- `principal` - Principal account
- `hr` - HR staff account
- `finance` - Finance staff account

---

## Helper Functions

### `navigateTo(page, menuText)`
Navigate to a page via sidebar menu.

### `logout(page)`
Log out the current user.

### `isLoggedIn(page)`
Check if user is currently logged in.

---

## CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

See `.github/workflows/e2e-tests.yml` for configuration.

### Artifacts
- **playwright-report**: HTML test report (30 days retention)
- **test-screenshots**: Failure screenshots (7 days retention)

---

## Writing New Tests

### Basic Test Structure
```javascript
import { test, expect, navigateTo } from './fixtures/auth.js';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('admin');
  });

  test('should do something', async ({ page }) => {
    await navigateTo(page, 'Page Name');
    await page.waitForLoadState('networkidle');
    
    // Assertions
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Best Practices
1. Use `data-testid` attributes for reliable selectors
2. Wait for network idle before assertions
3. Handle cases where elements might not exist
4. Use descriptive test names
5. Group related tests with `test.describe`

---

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.js`
- Check if dev server is running
- Verify network connectivity

### Flaky tests
- Add explicit waits (`waitForLoadState`)
- Use more specific selectors
- Check for race conditions

### Screenshots not capturing
- Ensure `screenshot: 'only-on-failure'` is set
- Check `test-results/` directory

---

## Configuration

See `playwright.config.js` for:
- Base URL: `http://localhost:5173`
- Browser: Chromium
- Retries: 2 on CI, 0 locally
- Trace: On first retry
- Screenshots: On failure only
