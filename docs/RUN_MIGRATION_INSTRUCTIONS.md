# 🚀 HR MIGRATION - STEP-BY-STEP INSTRUCTIONS

**Follow these steps carefully and report any errors**

---

## 📋 **BEFORE YOU START**

### **Prerequisites:**
- ✅ XAMPP running
- ✅ Apache and MySQL started
- ✅ Database backup (recommended)

---

## 🔧 **STEP 1: BACKUP YOUR DATABASE**

### **Option A: Using phpMyAdmin**
1. Open: `http://localhost/phpmyadmin`
2. Select your database (e.g., `mcsms`)
3. Click **Export** tab
4. Click **Go** to download backup
5. Save file as `mcsms_backup_YYYYMMDD.sql`

### **Option B: Using Command Line**
```bash
cd C:\xampp\mysql\bin
mysqldump -u root -p mcsms > mcsms_backup.sql
```

---

## 🚀 **STEP 2: RUN THE MIGRATION**

### **Method 1: Using phpMyAdmin (Recommended)**

1. **Open phpMyAdmin:**
   ```
   http://localhost/phpmyadmin
   ```

2. **Select your database** (e.g., `mcsms`)

3. **Click SQL tab**

4. **Copy and paste the ENTIRE contents** of:
   ```
   d:\xampp\htdocs\McSMS\database\migrations\step_by_step_hr_migration.sql
   ```

5. **Click "Go"**

6. **Watch for errors** - Report any red error messages

7. **Check results** - You should see multiple "STEP X COMPLETE" messages

---

### **Method 2: Using MySQL Command Line**

1. **Open Command Prompt**

2. **Navigate to MySQL bin:**
   ```bash
   cd C:\xampp\mysql\bin
   ```

3. **Login to MySQL:**
   ```bash
   mysql -u root -p
   ```

4. **Select database:**
   ```sql
   USE mcsms;
   ```

5. **Run migration:**
   ```sql
   source d:/xampp/htdocs/McSMS/database/migrations/step_by_step_hr_migration.sql
   ```

6. **Watch for errors**

---

## ✅ **STEP 3: VERIFY THE MIGRATION**

### **Option A: Using Test Script (Easiest)**

1. **Open in browser:**
   ```
   http://localhost/McSMS/backend/test_hr_migration.php
   ```

2. **Check the results:**
   - All tests should show "PASS"
   - Overall status should be "ALL TESTS PASSED ✅"

3. **If any test fails:**
   - Note which test failed
   - Copy the error message
   - Report it to me

---

### **Option B: Manual Verification**

Run these queries in phpMyAdmin:

```sql
-- Check employees table columns
DESCRIBE employees;
-- Should show 60+ columns

-- Check employee numbers
SELECT employee_number, first_name, last_name FROM employees LIMIT 10;
-- Should show EMP00001, EMP00002, etc.

-- Check user-employee sync
SELECT 
    u.name, u.user_type, e.employee_number
FROM users u
LEFT JOIN employees e ON u.id = e.user_id
WHERE u.user_type IN ('admin', 'teacher');
-- All should have employee_number

-- Check teachers-employee link
SELECT 
    t.first_name, t.last_name, t.employee_id, e.employee_number
FROM teachers t
LEFT JOIN employees e ON t.employee_id = e.id;
-- All should have employee_id and employee_number
```

---

## 🐛 **COMMON ERRORS & FIXES**

### **Error: "Table 'employees' doesn't exist"**
**Fix:** The employees table needs to be created first. Run the original `add_hr_payroll_tables.sql` first.

### **Error: "Duplicate column name"**
**Fix:** Column already exists. This is OK, the migration handles this with `IF NOT EXISTS`.

### **Error: "Cannot add foreign key constraint"**
**Fix:** 
1. Check if referenced table exists
2. Check if referenced column exists
3. Check data types match

### **Error: "Trigger already exists"**
**Fix:** The migration drops the trigger first. If error persists:
```sql
DROP TRIGGER IF EXISTS before_employee_insert;
```
Then run the trigger creation part again.

### **Error: "Duplicate entry for key 'user_id'"**
**Fix:** Some employees already have this user_id. Run:
```sql
SELECT user_id, COUNT(*) 
FROM employees 
GROUP BY user_id 
HAVING COUNT(*) > 1;
```
Report the results.

---

## 📊 **EXPECTED RESULTS**

After successful migration, you should see:

### **In employees table:**
- ✅ 60+ columns
- ✅ All employees have employee_number (EMP00001, etc.)
- ✅ All employees have user_id
- ✅ Biometric fields present
- ✅ All new fields present

### **In teachers table:**
- ✅ employee_id column added
- ✅ All teachers have employee_id

### **In employee_attendance table:**
- ✅ biometric_device_id column
- ✅ check_in_method column
- ✅ location_check_in column

---

## 🎯 **STEP 4: TEST THE FEATURES**

### **1. Test Add Employee:**
1. Go to: `http://localhost/McSMS`
2. Login as admin
3. Go to HR & Payroll
4. Click "Add Employee"
5. Fill form (employee number should auto-fill)
6. Submit
7. Check if employee appears in list

### **2. Test Auto-Generated Numbers:**
1. Add a new employee
2. Leave employee_number field empty
3. Submit
4. Check database - should have EMP00XXX

### **3. Test Reports:**
1. Go to HR & Payroll
2. Click "Generate Reports"
3. Select month
4. Click any report type
5. Check console for data
6. Should see JSON response

---

## 📝 **WHAT TO REPORT**

If you encounter errors, please provide:

1. **Error message** (exact text)
2. **Which step** it occurred in
3. **Screenshot** of the error (if possible)
4. **Query that failed** (if shown)

Example:
```
Error in STEP 3
Message: "Cannot add foreign key constraint"
Query: ALTER TABLE employees ADD CONSTRAINT fk_reports_to...
```

---

## 🔄 **ROLLBACK (If Needed)**

If something goes wrong:

```sql
-- Restore from backup
DROP TABLE employees;
DROP TABLE employee_attendance;
DROP TABLE leave_applications;
DROP TABLE payroll;

-- Restore backups
CREATE TABLE employees AS SELECT * FROM employees_backup;
CREATE TABLE employee_attendance AS SELECT * FROM employee_attendance_backup;
CREATE TABLE leave_applications AS SELECT * FROM leave_applications_backup;
CREATE TABLE payroll AS SELECT * FROM payroll_backup;
```

---

## ✅ **SUCCESS CHECKLIST**

After migration, verify:

- [ ] Migration completed without errors
- [ ] Test script shows all tests passed
- [ ] Employees table has 60+ columns
- [ ] All employees have employee_number
- [ ] All users synced to employees
- [ ] Teachers have employee_id
- [ ] Biometric fields present
- [ ] Add Employee button works
- [ ] Reports generate successfully

---

## 🎊 **NEXT STEPS**

Once migration is successful:

1. ✅ Create upload directories:
   ```bash
   mkdir public\uploads\employees\profiles
   mkdir public\uploads\employees\documents
   ```

2. ✅ Test all HR features

3. ✅ Add test employees

4. ✅ Generate test payroll

5. ✅ Test reports

---

## 📞 **NEED HELP?**

If you encounter any issues:

1. **Copy the exact error message**
2. **Note which step failed**
3. **Take a screenshot**
4. **Report back with details**

I'll help you fix any errors immediately!

---

**Ready? Let's run the migration!** 🚀

**Start with STEP 1 (Backup) then proceed to STEP 2 (Run Migration)**
