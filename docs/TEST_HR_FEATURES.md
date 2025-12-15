# 🧪 TEST HR FEATURES - QUICK GUIDE

**Follow these steps to test all the fixes**

---

## 🚀 **START HERE:**

1. **Open your browser:**
   ```
   http://localhost/McSMS
   ```

2. **Login as admin**

3. **Go to HR & Payroll** (sidebar)

---

## ✅ **TEST 1: VIEW EMPLOYEE**

1. Go to **"Employees"** tab
2. Find any employee in the table
3. Click the **blue eye icon** 👁️
4. **Expected:** Modal opens showing:
   - Employee Number
   - Full Name
   - Email & Phone
   - Department & Designation
   - Basic Salary
   - Status
   - Join Date
   - Employment Type
5. Click "Close"

**✅ PASS if modal shows all details**

---

## ✅ **TEST 2: EDIT EMPLOYEE**

1. Still in **"Employees"** tab
2. Click the **green edit icon** ✏️ on any employee
3. **Expected:** Edit modal opens with form
4. Change the **Basic Salary** (e.g., from 3000 to 3500)
5. Click **"Update Employee"**
6. **Expected:** Success alert appears
7. Check the table - salary should be updated

**✅ PASS if employee updates successfully**

---

## ✅ **TEST 3: GENERATE PAYROLL**

1. Go to **"Payroll Processing"** tab
2. Select current month
3. Click **"Generate Payroll"**
4. **Expected:** 
   - Success alert
   - Table shows all employees
   - Each row shows: Basic Salary, Earnings, Deductions, Net Salary
5. Check the **Total** at bottom

**✅ PASS if payroll table appears with data**

---

## ✅ **TEST 4: VIEW PAY SLIP**

1. Still in **"Payroll Processing"** tab
2. Click **"Slip"** button for any employee
3. **Expected:** Pay slip modal opens showing:
   - Employee name & number
   - Month & Basic Salary
   - **Earnings section** (green) with components
   - **Deductions section** (red) with components
   - **Net Salary** (highlighted in blue)
4. Click "Close"

**✅ PASS if pay slip shows complete breakdown**

---

## ✅ **TEST 5: PAYROLL SUMMARY REPORT**

1. Go to **"Overview"** tab
2. Click **"Generate Reports"** button
3. Select current month
4. Click **"Payroll Summary"** button
5. **Expected:**
   - Alert says "report generated successfully"
   - Open browser console (F12)
   - See JSON data with all employees' payroll
6. Click "Close"

**✅ PASS if console shows report data**

---

## ✅ **TEST 6: ATTENDANCE REPORT**

1. Click **"Generate Reports"** again
2. Click **"Attendance Report"** button
3. **Expected:**
   - Alert appears
   - Console shows attendance data
4. Check console for attendance records

**✅ PASS if console shows attendance data**

---

## ✅ **TEST 7: LEAVE REPORT**

1. Click **"Generate Reports"** again
2. Click **"Leave Report"** button
3. **Expected:**
   - Alert appears
   - Console shows leave applications
4. Check console for leave data

**✅ PASS if console shows leave data**

---

## ✅ **TEST 8: MARK ATTENDANCE (INDIVIDUAL)**

1. Go to **"Overview"** tab
2. Click **"Mark Attendance"** button
3. Select today's date
4. Click **"Load Employees"** button
5. **Expected:** Table appears with all employees
6. For **first employee:**
   - Change status to **"Late"**
   - Change check-in time to **"09:30"**
   - Change check-out time to **"17:00"**
7. For **second employee:**
   - Change status to **"Absent"**
8. Keep others as **"Present"**
9. Click **"Submit Attendance"**
10. **Expected:** Success alert

**✅ PASS if you can set individual status and times**

---

## ✅ **TEST 9: VERIFY ATTENDANCE**

1. Go to **"Attendance"** tab
2. Select today's date
3. **Expected:** See the attendance you just marked
4. Verify:
   - First employee shows "Late" with 09:30 check-in
   - Second employee shows "Absent"
   - Others show "Present"

**✅ PASS if attendance saved correctly**

---

## ✅ **TEST 10: APPROVE LEAVE**

1. Go to **"Leave Management"** tab
2. If there are pending leave applications:
   - Click **green checkmark** ✓ to approve
   - **Expected:** Success alert
3. If no pending leaves:
   - **SKIP** this test (or create a leave application first)

**✅ PASS if leave approval works**

---

## 📊 **FINAL CHECKLIST:**

After all tests, verify:

- [ ] View employee modal works
- [ ] Edit employee saves changes
- [ ] Payroll generates correctly
- [ ] Pay slips show all details
- [ ] Payroll summary report works
- [ ] Attendance report works
- [ ] Leave report works
- [ ] Individual attendance marking works
- [ ] Can set different status for each employee
- [ ] Can set custom times for each employee
- [ ] Attendance saves to database

---

## 🐛 **IF SOMETHING FAILS:**

### **Error in Console:**
1. Press **F12** to open developer tools
2. Go to **Console** tab
3. Copy the error message
4. Report it with:
   - Which test failed
   - Exact error message
   - What you were doing

### **No Data Showing:**
1. Check if employees exist (Employees tab)
2. Check if payroll generated (Payroll tab)
3. Try refreshing the page
4. Check console for errors

### **Modal Doesn't Open:**
1. Check console for errors
2. Try clicking again
3. Refresh page and retry

---

## 🎉 **SUCCESS CRITERIA:**

**ALL 10 TESTS SHOULD PASS!**

If all pass, your HR system is:
- ✅ 100% Functional
- ✅ Ready for production
- ✅ Enterprise-grade

---

## 📝 **REPORT RESULTS:**

After testing, report:

1. **How many tests passed?** (X/10)
2. **Which tests failed?** (if any)
3. **Any error messages?**
4. **Screenshots?** (if issues found)

---

**Good luck testing!** 🚀

**Expected Result:** 10/10 PASS ✅
