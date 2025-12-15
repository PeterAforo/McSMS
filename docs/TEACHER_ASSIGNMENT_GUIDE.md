# 📚 TEACHER ASSIGNMENT GUIDE

## 🎯 **IMPORTANT NOTES & HOW-TO:**

---

## 1️⃣ **TEACHERS MUST ALSO BE USERS**

### **Current Status:** ⚠️ NEEDS IMPLEMENTATION

**Issue:** Teachers are created in `teachers` table but not automatically in `users` table.

**Solution Required:**
When creating a teacher, we need to:
1. Create teacher record in `teachers` table
2. **Also create user record in `users` table**
3. Link them together
4. Set user_type = 'teacher'
5. Generate login credentials

---

### **How It Should Work:**

**Current Flow (Incomplete):**
```
Admin creates teacher → Teacher record created
❌ No user account created
❌ Teacher cannot login
```

**Required Flow (Complete):**
```
Admin creates teacher → Teacher record created
                     → User account created
                     → user_type = 'teacher'
                     → Email & password set
                     → Teacher can login ✅
```

---

### **Database Structure:**

**teachers table:**
```sql
teachers (
  id,
  teacher_id,      -- TCH001, TCH002
  first_name,
  last_name,
  email,
  phone,
  user_id,         -- ⚠️ NEEDS TO BE ADDED
  ...
)
```

**users table:**
```sql
users (
  id,
  name,
  email,
  password,
  user_type,       -- 'teacher'
  status,
  ...
)
```

---

### **Implementation Needed:**

**1. Add user_id to teachers table:**
```sql
ALTER TABLE teachers 
ADD COLUMN user_id INT(11) NULL,
ADD FOREIGN KEY (user_id) REFERENCES users(id);
```

**2. Update Teachers API to create user:**
```php
// When creating teacher
POST /api/teachers.php

// Backend should:
1. Create user record:
   - name = first_name + last_name
   - email = teacher email
   - password = hashed default password
   - user_type = 'teacher'
   - status = 'pending' or 'active'

2. Create teacher record:
   - teacher_id = auto-generated (TCH001)
   - user_id = newly created user ID
   - all other teacher details

3. Send email with login credentials
```

**3. Update Teachers Page:**
```javascript
// When creating teacher, also create user
const createTeacher = async (teacherData) => {
  // Create user first
  const userResponse = await usersAPI.create({
    name: `${teacherData.first_name} ${teacherData.last_name}`,
    email: teacherData.email,
    password: 'Teacher@123', // Default password
    user_type: 'teacher',
    status: 'active'
  });
  
  // Then create teacher with user_id
  const teacherResponse = await teachersAPI.create({
    ...teacherData,
    user_id: userResponse.data.user.id
  });
};
```

---

## 2️⃣ **HOW TO ASSIGN TEACHER TO CLASS(ES)**

### **Current Status:** ✅ IMPLEMENTED (Via teacher_subjects table)

### **Method 1: Class Teacher Assignment**

**Database:**
```sql
classes (
  id,
  class_name,
  class_teacher_id,  -- ✅ Already exists
  ...
)
```

**How to Assign:**
1. Go to `/admin/classes`
2. Edit a class
3. Select class teacher from dropdown
4. Save

**Example:**
```
Form 1 A → Class Teacher: John Mensah
Form 2 B → Class Teacher: Mary Asante
```

**What This Means:**
- One teacher is the **main class teacher**
- Responsible for class administration
- Takes attendance
- Manages class activities

---

### **Method 2: Subject-Class Assignment (Multiple Classes)**

**Database:**
```sql
teacher_subjects (
  id,
  teacher_id,
  subject_id,
  class_id,      -- ✅ Already exists
  academic_year,
  ...
)
```

**How It Works:**
```
Teacher John teaches:
- Mathematics in Form 1 A
- Mathematics in Form 2 A
- Mathematics in Form 3 A

Database records:
teacher_id=1, subject_id=1, class_id=9  (Form 1 A)
teacher_id=1, subject_id=1, class_id=10 (Form 2 A)
teacher_id=1, subject_id=1, class_id=11 (Form 3 A)
```

**Current Implementation:**
- ✅ Table exists
- ✅ Sample data exists
- ⚠️ No UI to manage assignments

---

### **UI Needed for Teacher-Class Assignment:**

**Option A: From Teachers Page**
```
Teachers Page → Edit Teacher → Assign Classes Tab
┌─────────────────────────────────────────┐
│ Assign Classes to John Mensah           │
├─────────────────────────────────────────┤
│ Subject: [Mathematics ▼]                │
│                                         │
│ Assigned Classes:                       │
│ ☑ Form 1 A                              │
│ ☑ Form 2 A                              │
│ ☐ Form 3 A                              │
│ ☐ JHS 1 A                               │
│                                         │
│ [Save Assignments]                      │
└─────────────────────────────────────────┘
```

**Option B: From Classes Page**
```
Classes Page → Edit Class → Assign Teachers Tab
┌─────────────────────────────────────────┐
│ Assign Teachers to Form 1 A             │
├─────────────────────────────────────────┤
│ Subject          | Teacher              │
│ Mathematics      | [John Mensah ▼]     │
│ English          | [Mary Asante ▼]     │
│ Science          | [Peter Boateng ▼]   │
│                                         │
│ [+ Add Subject]                         │
│ [Save Assignments]                      │
└─────────────────────────────────────────┘
```

---

## 3️⃣ **HOW TO ASSIGN TEACHER TO SUBJECT(S)**

### **Current Status:** ✅ IMPLEMENTED (Via teacher_subjects table)

**Database:**
```sql
teacher_subjects (
  id,
  teacher_id,    -- ✅ Already exists
  subject_id,    -- ✅ Already exists
  class_id,
  academic_year,
  ...
)
```

**Sample Data:**
```sql
-- Teacher 1 (John Mensah) teaches Mathematics
teacher_id=1, subject_id=1, class_id=9
teacher_id=1, subject_id=1, class_id=10

-- Teacher 2 (Mary Asante) teaches English
teacher_id=2, subject_id=2, class_id=9
teacher_id=2, subject_id=2, class_id=10

-- Teacher 3 (Peter Boateng) teaches Science
teacher_id=3, subject_id=3, class_id=9
```

**How It Works:**
```
John Mensah (teacher_id=1) is assigned to:
- Subject: Mathematics (subject_id=1)
- Classes: Form 1 A, Form 2 A

When John logs in:
- He sees only Mathematics subject
- He sees only Form 1 A and Form 2 A classes
- He can only create homework/assessments for Math
- He can only grade Math students
```

---

### **UI Needed for Teacher-Subject Assignment:**

**Teacher Profile Page:**
```
┌─────────────────────────────────────────┐
│ John Mensah - Teacher Profile           │
├─────────────────────────────────────────┤
│ Assigned Subjects & Classes:            │
│                                         │
│ Mathematics:                            │
│   • Form 1 A (5 periods/week)           │
│   • Form 2 A (5 periods/week)           │
│                                         │
│ [+ Assign New Subject/Class]            │
└─────────────────────────────────────────┘
```

**Assignment Modal:**
```
┌─────────────────────────────────────────┐
│ Assign Subject & Class                  │
├─────────────────────────────────────────┤
│ Teacher: John Mensah                    │
│                                         │
│ Subject: [Mathematics ▼]                │
│ Class:   [Form 3 A ▼]                   │
│ Periods/Week: [5]                       │
│ Academic Year: [2024/2025]              │
│                                         │
│ [Cancel] [Assign]                       │
└─────────────────────────────────────────┘
```

---

## 4️⃣ **HOW TO ASSIGN SUBJECTS TO CLASS**

### **Current Status:** ✅ IMPLEMENTED (Via class_subjects table)

**Database:**
```sql
class_subjects (
  id,
  class_id,          -- ✅ Already exists
  subject_id,        -- ✅ Already exists
  teacher_id,        -- Teacher assigned to teach it
  periods_per_week,
  is_mandatory,
  ...
)
```

**How It Works:**
```
Form 1 A (class_id=9) has subjects:
- Mathematics (subject_id=1) - Teacher: John - 5 periods - Mandatory
- English (subject_id=2) - Teacher: Mary - 4 periods - Mandatory
- Science (subject_id=3) - Teacher: Peter - 4 periods - Mandatory
- ICT (subject_id=5) - Teacher: John - 2 periods - Mandatory
- Music (subject_id=8) - Teacher: Grace - 2 periods - Optional
```

**Database Records:**
```sql
INSERT INTO class_subjects VALUES
(1, 9, 1, 1, 5, 1),  -- Form 1 A, Math, John, 5 periods, Mandatory
(2, 9, 2, 2, 4, 1),  -- Form 1 A, English, Mary, 4 periods, Mandatory
(3, 9, 3, 3, 4, 1),  -- Form 1 A, Science, Peter, 4 periods, Mandatory
(4, 9, 5, 1, 2, 1),  -- Form 1 A, ICT, John, 2 periods, Mandatory
(5, 9, 8, 4, 2, 0);  -- Form 1 A, Music, Grace, 2 periods, Optional
```

---

### **UI Needed for Class-Subject Assignment:**

**Classes Page → Edit Class → Subjects Tab:**
```
┌─────────────────────────────────────────┐
│ Manage Subjects for Form 1 A            │
├─────────────────────────────────────────┤
│ Assigned Subjects:                      │
│                                         │
│ Subject      | Teacher | Periods | Type │
│ Mathematics  | John M. | 5       | ✓    │
│ English      | Mary A. | 4       | ✓    │
│ Science      | Peter B.| 4       | ✓    │
│ ICT          | John M. | 2       | ✓    │
│ Music        | Grace K.| 2       | ○    │
│                                         │
│ [+ Add Subject]                         │
└─────────────────────────────────────────┘
```

**Add Subject Modal:**
```
┌─────────────────────────────────────────┐
│ Add Subject to Form 1 A                 │
├─────────────────────────────────────────┤
│ Subject: [French ▼]                     │
│ Teacher: [Select Teacher ▼]             │
│ Periods/Week: [3]                       │
│ Mandatory: [Yes ▼]                      │
│                                         │
│ [Cancel] [Add Subject]                  │
└─────────────────────────────────────────┘
```

---

## 🔧 **IMPLEMENTATION PRIORITY:**

### **Critical (Must Fix):**
1. ⚠️ **Teachers must be users**
   - Add user_id to teachers table
   - Create user when creating teacher
   - Link teacher to user account

### **Important (Should Add):**
2. 📝 **Teacher Assignment UI**
   - UI to assign teachers to classes
   - UI to assign teachers to subjects
   - UI to assign subjects to classes

### **Current Workaround:**
3. 💾 **Direct Database Management**
   - Manually insert into teacher_subjects
   - Manually insert into class_subjects
   - Use SQL for now

---

## 📊 **CURRENT DATA:**

**Existing Assignments in Database:**
```sql
-- teacher_subjects table:
SELECT ts.*, t.first_name, s.subject_name, c.class_name 
FROM teacher_subjects ts
LEFT JOIN teachers t ON ts.teacher_id = t.id
LEFT JOIN subjects s ON ts.subject_id = s.id
LEFT JOIN classes c ON ts.class_id = c.id;

Results:
Teacher 1 (John) → Math → Form 1 A
Teacher 1 (John) → Math → Form 2 A
Teacher 2 (Mary) → English → Form 1 A
Teacher 2 (Mary) → English → Form 2 A
Teacher 3 (Peter) → Science → Form 1 A
```

**These assignments are working:**
- ✅ Teachers see only their assigned classes
- ✅ Teachers see only their assigned subjects
- ✅ Teacher-specific data filtering works

**What's missing:**
- ❌ UI to manage these assignments
- ❌ Teachers not linked to user accounts

---

## 🎯 **RECOMMENDED ACTIONS:**

### **Immediate (Critical):**
1. Add `user_id` column to teachers table
2. Update Teachers API to create user accounts
3. Create user accounts for existing teachers
4. Test teacher login

### **Short-term (Important):**
1. Create Teacher Assignment UI page
2. Add "Assign Classes" feature
3. Add "Assign Subjects" feature
4. Add "Manage Class Subjects" feature

### **Current Workaround:**
1. Use SQL to manage assignments
2. Teachers table exists but no login
3. Assignments work via teacher_subjects table

---

## 🧪 **TESTING:**

### **Test Current Assignments:**
```sql
-- Check teacher assignments
SELECT * FROM teacher_subjects;

-- Check class subjects
SELECT * FROM class_subjects;

-- Verify teacher can see only assigned data
-- (Already working via teacher_data.php API)
```

### **Test After User Integration:**
```
1. Create teacher → User account created
2. Teacher logs in with email/password
3. Teacher sees only assigned classes
4. Teacher sees only assigned subjects
5. ✅ Working!
```

---

## 📝 **SUMMARY:**

**What's Working:**
- ✅ Database structure (teacher_subjects, class_subjects)
- ✅ Sample assignments exist
- ✅ Teacher-specific data filtering (via API)
- ✅ Teachers see only their classes/subjects

**What's Missing:**
- ❌ Teachers not linked to users (can't login)
- ❌ No UI to manage assignments
- ❌ Manual SQL required for assignments

**Priority Fix:**
1. Link teachers to users (CRITICAL)
2. Add assignment UI (IMPORTANT)
3. Test complete workflow (VERIFICATION)

---

**Status:** Database ✅ | API ✅ | User Integration ❌ | UI ❌
