# 📊 SALARY COMPONENTS & TAXES GUIDE

**Complete guide to managing salary components and taxes in McSMS**

---

## 🚀 **QUICK START:**

### **Step 1: Add Default Components (Including Taxes)**

Run this in **phpMyAdmin SQL tab**:

```sql
-- Insert Earnings
INSERT INTO salary_components (component_name, component_type, description, status) VALUES
('Housing Allowance', 'earning', 'Monthly housing allowance', 'active'),
('Transport Allowance', 'earning', 'Transportation reimbursement', 'active'),
('Medical Allowance', 'earning', 'Medical benefits', 'active'),
('Performance Bonus', 'earning', 'Performance bonus', 'active');

-- Insert Deductions (Taxes)
INSERT INTO salary_components (component_name, component_type, description, status) VALUES
('Income Tax', 'deduction', 'Government income tax', 'active'),
('SSNIT (Tier 1)', 'deduction', 'Social Security - 5.5%', 'active'),
('SSNIT (Tier 2)', 'deduction', 'Provident fund - 5%', 'active'),
('Health Insurance', 'deduction', 'NHIS contribution', 'active');
```

### **Step 2: View Components**
1. Go to **HR & Payroll** → **Salary Structure** tab
2. Click **"Configure Salary Components"**
3. You should see all components listed

### **Step 3: Add New Component**
1. In the modal, click **"+ Add New Component"**
2. Fill in:
   - **Component Name:** e.g., "Income Tax"
   - **Type:** Select "Deduction" (for taxes)
   - **Description:** e.g., "Government income tax deduction"
3. Click **"Add Component"**

---

## 💰 **SALARY COMPONENTS EXPLAINED:**

### **What are Salary Components?**
Salary components are the building blocks of an employee's salary:
- **Earnings:** Add to salary (allowances, bonuses)
- **Deductions:** Subtract from salary (taxes, loans)

### **Formula:**
```
Gross Salary = Basic Salary + Total Earnings
Net Salary = Gross Salary - Total Deductions
```

### **Example:**
```
Basic Salary:        GHS 3,000.00
+ Housing Allowance: GHS   500.00
+ Transport:         GHS   300.00
= Gross Salary:      GHS 3,800.00

- Income Tax:        GHS   450.00
- SSNIT:             GHS   165.00
= Net Salary:        GHS 3,185.00
```

---

## 🏦 **GHANA TAX COMPONENTS:**

### **1. Income Tax (PAYE)**
- **Type:** Deduction
- **Rate:** Progressive (5% - 30%)
- **Description:** Pay As You Earn tax

**Tax Brackets (2024):**
```
GHS 0 - 4,380:        0%
GHS 4,381 - 6,240:    5%
GHS 6,241 - 8,100:    10%
GHS 8,101 - 50,000:   17.5%
GHS 50,001+:          30%
```

### **2. SSNIT Tier 1**
- **Type:** Deduction
- **Rate:** 5.5% (employee) + 13% (employer)
- **Description:** Social Security contribution

### **3. SSNIT Tier 2**
- **Type:** Deduction
- **Rate:** 5% (employee)
- **Description:** Provident fund

### **4. NHIS (Health Insurance)**
- **Type:** Deduction
- **Rate:** 2.5% of basic salary
- **Description:** National Health Insurance

---

## 📝 **HOW TO ADD COMPONENTS:**

### **Method 1: Via UI (Frontend)**

#### **Step 1: Open Modal**
1. Go to **HR & Payroll**
2. Click **Salary Structure** tab
3. Click **"Configure Salary Components"** button

#### **Step 2: Add Component**
1. Click **"+ Add New Component"**
2. Fill form:
   - **Component Name:** "Income Tax"
   - **Type:** "Deduction"
   - **Description:** "Government income tax"
3. Click **"Add Component"**

#### **Step 3: Verify**
- Component appears in list
- Shows type badge (green for earning, red for deduction)
- Status shows "active"

---

### **Method 2: Via Database (SQL)**

Run in **phpMyAdmin**:

```sql
-- Add a tax component
INSERT INTO salary_components 
(component_name, component_type, description, status) 
VALUES 
('Income Tax', 'deduction', 'Government income tax deduction', 'active');

-- Add an allowance
INSERT INTO salary_components 
(component_name, component_type, description, status) 
VALUES 
('Housing Allowance', 'earning', 'Monthly housing allowance', 'active');
```

---

## 🎯 **ASSIGNING COMPONENTS TO EMPLOYEES:**

### **Option 1: Manual Assignment**

```sql
-- Assign housing allowance to employee
INSERT INTO employee_salary_structure 
(employee_id, component_id, amount, effective_from, status)
VALUES 
(2, 1, 500.00, '2024-12-01', 'active');

-- Assign tax deduction to employee
INSERT INTO employee_salary_structure 
(employee_id, component_id, amount, effective_from, status)
VALUES 
(2, 8, 450.00, '2024-12-01', 'active');
```

### **Option 2: Bulk Assignment**

```sql
-- Assign housing allowance to all active employees
INSERT INTO employee_salary_structure 
(employee_id, component_id, amount, effective_from, status)
SELECT 
    id as employee_id,
    1 as component_id,  -- Housing allowance component ID
    500.00 as amount,
    '2024-12-01' as effective_from,
    'active' as status
FROM employees 
WHERE status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM employee_salary_structure 
    WHERE employee_id = employees.id AND component_id = 1
);
```

---

## 🧮 **CALCULATING TAXES:**

### **Income Tax Calculation:**

```sql
-- Calculate income tax for an employee
-- Example: Basic salary = GHS 5,000

-- Taxable income
SET @basic_salary = 5000.00;
SET @annual_salary = @basic_salary * 12;

-- Tax calculation (simplified)
SET @tax_free = 4380;
SET @tax_5_percent = 1860;  -- (6240 - 4380)
SET @tax_10_percent = 1860; -- (8100 - 6240)
SET @remaining = @annual_salary - 8100;

SET @annual_tax = 
    (0 * @tax_free) + 
    (0.05 * @tax_5_percent) + 
    (0.10 * @tax_10_percent) + 
    (0.175 * @remaining);

SET @monthly_tax = @annual_tax / 12;

SELECT @monthly_tax as monthly_income_tax;
```

### **SSNIT Calculation:**

```sql
-- SSNIT Tier 1 (5.5%)
SET @basic_salary = 5000.00;
SET @ssnit_tier1 = @basic_salary * 0.055;

-- SSNIT Tier 2 (5%)
SET @ssnit_tier2 = @basic_salary * 0.05;

SELECT 
    @ssnit_tier1 as tier1_deduction,
    @ssnit_tier2 as tier2_deduction,
    (@ssnit_tier1 + @ssnit_tier2) as total_ssnit;
```

---

## 📊 **COMPLETE EXAMPLE:**

### **Scenario: Add Employee with Full Salary Structure**

```sql
-- 1. Create salary components (if not exists)
INSERT INTO salary_components (component_name, component_type, description, status) VALUES
('Housing Allowance', 'earning', 'Housing allowance', 'active'),
('Transport Allowance', 'earning', 'Transport allowance', 'active'),
('Income Tax', 'deduction', 'Income tax', 'active'),
('SSNIT Tier 1', 'deduction', 'SSNIT 5.5%', 'active'),
('SSNIT Tier 2', 'deduction', 'SSNIT 5%', 'active');

-- 2. Assign to employee (ID = 2)
-- Housing allowance
INSERT INTO employee_salary_structure 
(employee_id, component_id, amount, effective_from, status)
VALUES (2, 1, 500.00, '2024-12-01', 'active');

-- Transport allowance
INSERT INTO employee_salary_structure 
(employee_id, component_id, amount, effective_from, status)
VALUES (2, 2, 300.00, '2024-12-01', 'active');

-- Income tax
INSERT INTO employee_salary_structure 
(employee_id, component_id, amount, effective_from, status)
VALUES (2, 3, 450.00, '2024-12-01', 'active');

-- SSNIT Tier 1
INSERT INTO employee_salary_structure 
(employee_id, component_id, amount, effective_from, status)
VALUES (2, 4, 165.00, '2024-12-01', 'active');

-- SSNIT Tier 2
INSERT INTO employee_salary_structure 
(employee_id, component_id, amount, effective_from, status)
VALUES (2, 5, 150.00, '2024-12-01', 'active');

-- 3. Generate payroll
-- This will automatically include all components
```

---

## ✅ **VERIFICATION:**

### **Check Components:**
```sql
SELECT * FROM salary_components ORDER BY component_type, component_name;
```

### **Check Employee Assignments:**
```sql
SELECT 
    e.employee_number,
    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
    sc.component_name,
    sc.component_type,
    ess.amount,
    ess.status
FROM employee_salary_structure ess
JOIN employees e ON ess.employee_id = e.id
JOIN salary_components sc ON ess.component_id = sc.id
WHERE e.id = 2  -- Change to your employee ID
ORDER BY sc.component_type, sc.component_name;
```

### **Check Payroll Calculation:**
```sql
SELECT 
    p.payroll_month,
    e.employee_number,
    CONCAT(e.first_name, ' ', e.last_name) as employee_name,
    p.basic_salary,
    p.total_earnings,
    p.total_deductions,
    p.net_salary
FROM payroll p
JOIN employees e ON p.employee_id = e.id
WHERE e.id = 2
ORDER BY p.payroll_month DESC;
```

---

## 🐛 **TROUBLESHOOTING:**

### **Issue: "Nothing happens" when clicking Add Component**

**Solution 1: Check if modal opens**
- Press F12 (developer tools)
- Go to Console tab
- Look for errors
- If you see errors, report them

**Solution 2: Verify salary_components table exists**
```sql
SHOW TABLES LIKE 'salary_components';
```

**Solution 3: Check API endpoint**
Open in browser:
```
http://localhost/McSMS/backend/api/salary_components.php
```
Should return JSON response.

---

### **Issue: Components not showing in payroll**

**Solution: Regenerate payroll**
1. Delete existing payroll for the month
2. Generate new payroll
3. Components will be included

```sql
-- Delete payroll for December 2025
DELETE FROM payroll WHERE payroll_month = '2025-12';

-- Then regenerate via UI
```

---

## 🎯 **BEST PRACTICES:**

### **1. Standard Components:**
Create these for all employees:
- Housing Allowance (earning)
- Transport Allowance (earning)
- Income Tax (deduction)
- SSNIT Tier 1 (deduction)
- SSNIT Tier 2 (deduction)

### **2. Calculation:**
- Calculate taxes based on annual income
- Divide by 12 for monthly deduction
- Update when salary changes

### **3. Documentation:**
- Document tax rates
- Keep records of changes
- Maintain audit trail

### **4. Compliance:**
- Follow Ghana Revenue Authority guidelines
- Update rates annually
- Verify calculations

---

## 📋 **QUICK REFERENCE:**

### **Component Types:**
- **earning:** Adds to salary
- **deduction:** Subtracts from salary

### **Common Earnings:**
- Housing Allowance
- Transport Allowance
- Medical Allowance
- Performance Bonus
- Overtime Pay

### **Common Deductions:**
- Income Tax (PAYE)
- SSNIT Tier 1 (5.5%)
- SSNIT Tier 2 (5%)
- NHIS (2.5%)
- Loan Repayment
- Advance Salary

---

## 🚀 **NEXT STEPS:**

1. **Run the default components SQL** (above)
2. **Refresh HR & Payroll page**
3. **Click "Configure Salary Components"**
4. **Verify components appear**
5. **Assign to employees**
6. **Regenerate payroll**
7. **View pay slips with components**

---

**Need help? Check the console for errors or report the issue!** 🔍
