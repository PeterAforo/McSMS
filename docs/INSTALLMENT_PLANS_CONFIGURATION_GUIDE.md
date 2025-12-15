# 📋 INSTALLMENT PLANS CONFIGURATION GUIDE

## 🎯 **HOW TO CONFIGURE INSTALLMENT PLANS**

Installment plans allow parents to pay fees in multiple payments over time.

---

## ✅ **CURRENT INSTALLMENT PLANS:**

### **4 Plans Already Configured:**

1. **Full Payment** (Default)
   - Code: `FULL`
   - Pay 100% upfront
   - No installments

2. **60/30/10 Plan**
   - Code: `60-30-10`
   - First Payment: 60% upfront
   - Second Payment: 30% after 45 days
   - Final Payment: 10% after 75 days

3. **50/25/25 Plan**
   - Code: `50-25-25`
   - First Payment: 50% upfront
   - Second Payment: 25% after 40 days
   - Final Payment: 25% after 80 days

4. **Three Equal Parts**
   - Code: `33-33-34`
   - First Payment: 33% upfront
   - Second Payment: 33% after 30 days
   - Final Payment: 34% after 60 days

---

## 🎨 **HOW TO ADD NEW INSTALLMENT PLAN:**

### **Method 1: Via Database (SQL)**

```sql
INSERT INTO installment_plans (
  plan_name, 
  plan_code, 
  description, 
  installments, 
  is_default, 
  status
) VALUES (
  'Custom Plan Name',
  'CUSTOM-CODE',
  'Plan description',
  '[
    {"percentage": 40, "due_days": 0, "label": "First Payment"},
    {"percentage": 30, "due_days": 30, "label": "Second Payment"},
    {"percentage": 30, "due_days": 60, "label": "Final Payment"}
  ]',
  0,
  'active'
);
```

### **Method 2: Via phpMyAdmin**

1. **Open phpMyAdmin:**
   ```
   http://localhost/phpmyadmin
   ```

2. **Select Database:**
   ```
   school_management_system
   ```

3. **Open installment_plans table:**
   ```
   Click on "installment_plans" table
   ```

4. **Click "Insert":**
   ```
   Fill in the form:
   - plan_name: "40/30/30 Plan"
   - plan_code: "40-30-30"
   - description: "Pay 40% upfront, 30% twice"
   - installments: [JSON array - see format below]
   - is_default: 0 (or 1 for default)
   - status: active
   ```

5. **Click "Go" to save**

---

## 📊 **INSTALLMENT JSON FORMAT:**

### **Structure:**
```json
[
  {
    "percentage": 40,
    "due_days": 0,
    "label": "First Payment"
  },
  {
    "percentage": 30,
    "due_days": 30,
    "label": "Second Payment"
  },
  {
    "percentage": 30,
    "due_days": 60,
    "label": "Final Payment"
  }
]
```

### **Fields Explained:**
- **percentage**: Percentage of total amount (must add up to 100)
- **due_days**: Days after enrollment when payment is due
- **label**: Display name for this installment

---

## 🎯 **EXAMPLES:**

### **Example 1: Two Equal Payments**
```json
[
  {
    "percentage": 50,
    "due_days": 0,
    "label": "First Half"
  },
  {
    "percentage": 50,
    "due_days": 45,
    "label": "Second Half"
  }
]
```

### **Example 2: Four Quarterly Payments**
```json
[
  {
    "percentage": 25,
    "due_days": 0,
    "label": "Quarter 1"
  },
  {
    "percentage": 25,
    "due_days": 30,
    "label": "Quarter 2"
  },
  {
    "percentage": 25,
    "due_days": 60,
    "label": "Quarter 3"
  },
  {
    "percentage": 25,
    "due_days": 90,
    "label": "Quarter 4"
  }
]
```

### **Example 3: Decreasing Payments**
```json
[
  {
    "percentage": 50,
    "due_days": 0,
    "label": "Initial Payment"
  },
  {
    "percentage": 30,
    "due_days": 30,
    "label": "Mid Payment"
  },
  {
    "percentage": 20,
    "due_days": 60,
    "label": "Final Payment"
  }
]
```

---

## 🎊 **HOW PARENTS USE INSTALLMENT PLANS:**

### **Parent Enrollment Flow:**

1. **Parent goes to:** `/parent/enroll`

2. **Selects child and term**

3. **Reviews fees:**
   ```
   Tuition: GH₵ 2,000
   Books: GH₵ 500
   ICT: GH₵ 300
   Total: GH₵ 2,800
   ```

4. **Selects installment plan:**
   ```
   Options shown:
   ○ Full Payment (GH₵ 2,800 now)
   ○ 60/30/10 Plan (GH₵ 1,680 now, GH₵ 840 later, GH₵ 280 later)
   ○ 50/25/25 Plan (GH₵ 1,400 now, GH₵ 700 later, GH₵ 700 later)
   ○ Three Equal Parts (GH₵ 924 now, GH₵ 924 later, GH₵ 952 later)
   ```

5. **Submits enrollment**

6. **Invoice created with installment schedule**

---

## 📋 **INSTALLMENT PLAN RULES:**

### **Important Rules:**

1. **Percentages Must Add to 100:**
   ```
   ✅ 50 + 25 + 25 = 100
   ❌ 50 + 30 + 30 = 110 (Invalid)
   ```

2. **First Payment Always Due Immediately:**
   ```
   First installment: due_days = 0
   ```

3. **Due Days in Ascending Order:**
   ```
   ✅ 0, 30, 60
   ❌ 0, 60, 30 (Wrong order)
   ```

4. **At Least One Installment:**
   ```
   Minimum: 1 installment (full payment)
   Maximum: No limit (but practical limit ~6)
   ```

---

## 🎯 **DEFAULT PLAN:**

### **Setting Default Plan:**

Only ONE plan can be default at a time.

**Via SQL:**
```sql
-- Set a plan as default
UPDATE installment_plans 
SET is_default = 1 
WHERE id = 1;

-- Remove default from others
UPDATE installment_plans 
SET is_default = 0 
WHERE id != 1;
```

**Default plan is pre-selected for parents**

---

## 🧪 **TESTING:**

### **Test New Installment Plan:**

1. **Add plan to database**
2. **Go to:** `/parent/enroll`
3. **Select child and term**
4. **Check installment options:**
   - ✅ New plan appears
   - ✅ Shows correct breakdown
   - ✅ Percentages calculate correctly
5. **Select new plan and submit**
6. **Check invoice:**
   - ✅ Installment schedule saved
   - ✅ Due dates calculated correctly

---

## 📊 **VIEWING INSTALLMENT PLANS:**

### **Via Database:**
```sql
SELECT 
  id,
  plan_name,
  plan_code,
  description,
  installments,
  is_default,
  status
FROM installment_plans
WHERE status = 'active';
```

### **Via Parent Enrollment:**
```
1. Login as parent
2. Go to /parent/enroll
3. Select child and term
4. See all active plans in dropdown
```

---

## 🎯 **MODIFYING EXISTING PLANS:**

### **Update Plan:**
```sql
UPDATE installment_plans
SET 
  plan_name = 'Updated Name',
  description = 'Updated description',
  installments = '[{"percentage": 50, "due_days": 0, "label": "Half Now"}, {"percentage": 50, "due_days": 60, "label": "Half Later"}]'
WHERE id = 2;
```

### **Deactivate Plan:**
```sql
UPDATE installment_plans
SET status = 'inactive'
WHERE id = 3;
```

### **Activate Plan:**
```sql
UPDATE installment_plans
SET status = 'active'
WHERE id = 3;
```

---

## 🎯 **BEST PRACTICES:**

### **1. Plan Naming:**
```
✅ Clear names: "50/25/25 Plan", "Three Equal Parts"
❌ Vague names: "Plan A", "Option 2"
```

### **2. Plan Codes:**
```
✅ Descriptive: "50-25-25", "FULL", "QUARTERLY"
❌ Generic: "P1", "OPT2"
```

### **3. Due Days:**
```
✅ Realistic: 30, 45, 60 days
❌ Too short: 5, 10 days
❌ Too long: 365 days
```

### **4. Percentages:**
```
✅ Round numbers: 25%, 33%, 50%
❌ Complex: 23.7%, 41.3%
```

---

## 🎊 **RESULT:**

**INSTALLMENT PLANS: FULLY CONFIGURED!** ✅

**Current Plans:**
- ✅ Full Payment (100%)
- ✅ 60/30/10 Plan
- ✅ 50/25/25 Plan
- ✅ Three Equal Parts

**How to Add More:**
1. Use SQL INSERT statement
2. Or use phpMyAdmin
3. Follow JSON format
4. Ensure percentages = 100
5. Test in parent enrollment

**Installment plans are working!** 🚀
