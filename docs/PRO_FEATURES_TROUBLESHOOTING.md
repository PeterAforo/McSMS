# 🔧 Pro Features Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: "CRUD functions not working"

#### **Symptoms:**
- Create, Read, Update, Delete operations fail
- No data showing in Pro feature pages
- API calls return errors or empty responses

#### **Solutions:**

### ✅ **Solution 1: Test APIs Directly**

Open this file in your browser to test all APIs:
```
http://localhost/McSMS/test_pro_apis.html
```

This will show you which APIs are working and which are failing.

---

### ✅ **Solution 2: Check Sample Data**

Run this to add sample data:
```sql
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_sample_pro_data.sql;
```

Or in phpMyAdmin:
1. Go to SQL tab
2. Import: `database/migrations/add_sample_pro_data.sql`

---

### ✅ **Solution 3: Verify Tables Exist**

```sql
-- Check if Pro tables exist
SHOW TABLES LIKE 'timetable%';
SHOW TABLES LIKE 'exam%';
SHOW TABLES LIKE 'course%';
SHOW TABLES LIKE 'biometric%';
```

If no tables show up, re-run:
```sql
SOURCE d:/xampp/htdocs/McSMS/INSTALL_PRO_FEATURES.sql;
```

---

### ✅ **Solution 4: Check CORS Issues**

If you see CORS errors in browser console:

1. Open browser DevTools (F12)
2. Check Console tab for errors like:
   - "Access-Control-Allow-Origin"
   - "CORS policy"

**Fix:** The APIs already have CORS configured, but make sure:
- Frontend is running on `localhost:5174`
- Backend is accessible at `http://localhost/McSMS/backend/api`

---

### ✅ **Solution 5: Check PHP Errors**

Enable error display in PHP:

Edit: `d:\xampp\php\php.ini`
```ini
display_errors = On
error_reporting = E_ALL
```

Restart Apache, then check API responses for detailed errors.

---

### ✅ **Solution 6: Test Individual APIs**

**Test Timetable API:**
```
http://localhost/McSMS/backend/api/timetable.php?resource=templates
```

**Test Exams API:**
```
http://localhost/McSMS/backend/api/exams.php?resource=exams
```

**Test LMS API:**
```
http://localhost/McSMS/backend/api/lms.php?resource=courses
```

Each should return JSON with `"success": true`

---

### ✅ **Solution 7: Check Database Connection**

Verify database config:
```php
// config/database.php
define('DB_HOST', 'localhost');
define('DB_NAME', 'school_management_system');
define('DB_USER', 'root');
define('DB_PASS', '');
```

---

### ✅ **Solution 8: Check Apache/MySQL**

Make sure both are running:
1. Open XAMPP Control Panel
2. Check Apache is green/running
3. Check MySQL is green/running

---

### ✅ **Solution 9: Clear Browser Cache**

1. Press `Ctrl + Shift + Delete`
2. Clear cached images and files
3. Refresh the page (`Ctrl + F5`)

---

### ✅ **Solution 10: Check Network Tab**

1. Open DevTools (F12)
2. Go to Network tab
3. Reload the page
4. Check API calls:
   - Status should be `200 OK`
   - Response should have `"success": true`

If you see `404` or `500` errors, the API files might be missing or have errors.

---

## 🧪 **Quick Diagnostic**

Run these commands to diagnose:

```bash
# Check if API files exist
dir d:\xampp\htdocs\McSMS\backend\api\*.php

# Test an API
curl http://localhost/McSMS/backend/api/exams.php?resource=exams

# Check MySQL tables
d:\xampp\mysql\bin\mysql.exe -u root -e "USE school_management_system; SHOW TABLES LIKE 'exam%';"
```

---

## 📋 **Checklist**

- [ ] Tables installed (run INSTALL_PRO_FEATURES.sql)
- [ ] Sample data added (run add_sample_pro_data.sql)
- [ ] Apache running
- [ ] MySQL running
- [ ] Frontend running on port 5174
- [ ] No CORS errors in console
- [ ] APIs returning `"success": true`
- [ ] Browser cache cleared

---

## 🆘 **Still Not Working?**

### **Get Detailed Error Info:**

1. **Check Browser Console:**
   - Press F12
   - Look for red errors
   - Copy the error message

2. **Check API Response:**
   - Open Network tab
   - Click on failed API call
   - Check "Response" tab
   - Look for error messages

3. **Check PHP Error Log:**
   ```
   d:\xampp\apache\logs\error.log
   ```

4. **Test API Directly:**
   - Open: `http://localhost/McSMS/backend/api/exams.php?resource=exams`
   - Should show JSON response
   - If you see PHP errors, that's the issue

---

## 🔍 **Common Error Messages**

### "Failed to fetch"
- **Cause:** Backend not running or wrong URL
- **Fix:** Check Apache is running, verify API URL

### "CORS policy"
- **Cause:** Cross-origin request blocked
- **Fix:** APIs already have CORS headers, clear cache

### "success: false"
- **Cause:** Database error or missing data
- **Fix:** Check error message in response, verify tables exist

### "404 Not Found"
- **Cause:** API file doesn't exist
- **Fix:** Verify file exists at `backend/api/[module].php`

### "500 Internal Server Error"
- **Cause:** PHP error in API file
- **Fix:** Check PHP error log, enable error display

---

## ✅ **Verification Steps**

After fixing, verify everything works:

1. **Open test page:**
   ```
   http://localhost/McSMS/test_pro_apis.html
   ```
   Click "Test All APIs" - all should pass

2. **Login to frontend:**
   ```
   http://localhost:5174/login
   ```
   Email: admin@school.com
   Password: password

3. **Test each Pro feature:**
   - Click Timetable - should show templates
   - Click Exams - should show exams
   - Click LMS - should show courses
   - Click Transport - should show vehicles
   - etc.

---

## 📞 **Need More Help?**

Provide these details:
1. Browser console errors (F12 → Console)
2. Network tab errors (F12 → Network)
3. Which specific feature is failing
4. What action you're trying (Create, Read, Update, Delete)
5. Any error messages you see

---

**Most issues are solved by:**
1. Running the installation SQL
2. Adding sample data
3. Clearing browser cache
4. Restarting Apache

Try these first! 🚀
