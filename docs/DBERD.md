# 📌 **DATABASE SCHEMA (ERD) — SCHOOL MANAGEMENT SYSTEM**

I will provide:

✔ ERD (logical structure)
✔ Full list of tables
✔ Table fields + data types
✔ Primary & foreign keys
✔ Relationship explanations
✔ Notes for MVC implementation

---

# 🔶 **1. ERD – Main Entities & Relationships**

Below is the high-level structure:

```
PARENTS 1---* CHILDREN 1---* ADMISSIONS
                    |
                    *--- STUDENTS 1---* FEES
                    |           |
                    |           *--- PAYMENTS
                    |
                    *--- ATTENDANCE
                    *--- RESULTS
                    *--- HOMEWORK_SUBMISSIONS
                    *--- OPTIONAL_SERVICES_SELECTED

TEACHERS 1---* CLASS_TEACHERS
CLASSES 1---* STUDENTS
SUBJECTS 1---* RESULTS
```

(If you want, I can generate a graphical ERD diagram later.)

---

# 🔶 **2. FULL LIST OF TABLES**

### **User & Authentication**

1. users
2. roles
3. user_roles

### **Parent & Student**

4. parents
5. children
6. admissions
7. students

### **Academic**

8. academic_sessions
9. academic_terms
10. classes
11. sections
12. subjects
13. class_subjects
14. attendance
15. results
16. homework
17. homework_submissions

### **Fees & Finance**

18. fee_types
19. optional_services
20. invoices
21. invoice_items
22. payments

### **Communication**

23. notifications
24. messages

### **System**

25. settings
26. activity_logs

---

# 🔶 **3. TABLE DEFINITIONS (Detailed)**

---

# 🟦 **3.1 USERS (For authentication)**

| Field      | Type                                                    | Notes |
| ---------- | ------------------------------------------------------- | ----- |
| id         | INT PK AI                                               |       |
| name       | VARCHAR(150)                                            |       |
| email      | VARCHAR(150) UNIQUE                                     |       |
| password   | VARCHAR(255)                                            |       |
| phone      | VARCHAR(20)                                             |       |
| user_type  | ENUM('admin','parent','teacher','finance','admissions') |       |
| status     | ENUM('active','inactive')                               |       |
| created_at | TIMESTAMP                                               |       |
| updated_at | TIMESTAMP                                               |       |

---

# 🟦 **3.2 ROLES**

| Field     | Type        |
| --------- | ----------- |
| id        | INT PK AI   |
| role_name | VARCHAR(50) |

---

# 🟦 **3.3 USER_ROLES**

| Field   | Type               |
| ------- | ------------------ |
| id      | INT PK AI          |
| user_id | INT FK → users(id) |
| role_id | INT FK → roles(id) |

---

# 🟦 **3.4 PARENTS**

| Field      | Type               |
| ---------- | ------------------ |
| id         | INT PK AI          |
| user_id    | INT FK → users(id) |
| address    | TEXT               |
| occupation | VARCHAR(150)       |
| created_at | TIMESTAMP          |

---

# 🟦 **3.5 CHILDREN**

| Field           | Type                  |
| --------------- | --------------------- |
| id              | INT PK AI             |
| parent_id       | INT FK → parents(id)  |
| full_name       | VARCHAR(150)          |
| gender          | ENUM('male','female') |
| date_of_birth   | DATE                  |
| previous_school | VARCHAR(150) NULL     |
| photo           | VARCHAR(255)          |
| created_at      | TIMESTAMP             |

---

# 🟦 **3.6 ADMISSIONS (Application Process)**

| Field              | Type                                  |
| ------------------ | ------------------------------------- |
| id                 | INT PK AI                             |
| child_id           | INT FK → children(id)                 |
| preferred_class_id | INT FK → classes(id)                  |
| status             | ENUM('pending','approved','rejected') |
| remarks            | TEXT                                  |
| documents          | JSON                                  |
| processed_by       | INT FK → users(id)                    |
| created_at         | TIMESTAMP                             |

---

# 🟦 **3.7 STUDENTS (After admission approved)**

| Field           | Type                              |
| --------------- | --------------------------------- |
| id              | INT PK AI                         |
| child_id        | INT FK → children(id)             |
| student_id      | VARCHAR(50) UNIQUE                |
| class_id        | INT FK → classes(id)              |
| section_id      | INT FK → sections(id)             |
| enrollment_date | DATE                              |
| status          | ENUM('active','graduated','left') |
| created_at      | TIMESTAMP                         |

---

# 🟦 **3.8 ACADEMIC_SESSIONS**

| Field        | Type                          |
| ------------ | ----------------------------- |
| id           | INT PK AI                     |
| session_name | VARCHAR(20) (e.g., 2024/2025) |
| is_active    | TINYINT(1)                    |

---

# 🟦 **3.9 ACADEMIC_TERMS**

| Field      | Type                           |
| ---------- | ------------------------------ |
| id         | INT PK AI                      |
| session_id | INT FK → academic_sessions(id) |
| term_name  | VARCHAR(20)                    |
| start_date | DATE                           |
| end_date   | DATE                           |
| is_active  | TINYINT(1)                     |

---

# 🟦 **3.10 CLASSES**

| Field      | Type                                  |
| ---------- | ------------------------------------- |
| id         | INT PK AI                             |
| class_name | VARCHAR(50)                           |
| level      | ENUM('creche','nursery','kg','grade') |

---

# 🟦 **3.11 SECTIONS**

| Field        | Type                 |
| ------------ | -------------------- |
| id           | INT PK AI            |
| class_id     | INT FK → classes(id) |
| section_name | VARCHAR(50)          |

---

# 🟦 **3.12 SUBJECTS**

| Field        | Type                                  |
| ------------ | ------------------------------------- |
| id           | INT PK AI                             |
| subject_name | VARCHAR(150)                          |
| level        | ENUM('creche','nursery','kg','grade') |

---

# 🟦 **3.13 CLASS_SUBJECTS**

| Field      | Type      |
| ---------- | --------- |
| id         | INT PK AI |
| class_id   | INT FK    |
| subject_id | INT FK    |

---

# 🟦 **3.14 ATTENDANCE**

| Field      | Type                            |
| ---------- | ------------------------------- |
| id         | INT PK AI                       |
| student_id | INT FK                          |
| date       | DATE                            |
| status     | ENUM('present','absent','late') |
| marked_by  | INT FK → users(id)              |

---

# 🟦 **3.15 RESULTS**

| Field      | Type         |
| ---------- | ------------ |
| id         | INT PK AI    |
| student_id | INT FK       |
| subject_id | INT FK       |
| term_id    | INT FK       |
| ca_score   | DECIMAL(5,2) |
| exam_score | DECIMAL(5,2) |
| total      | DECIMAL(5,2) |
| grade      | VARCHAR(2)   |

---

# 🟦 **3.16 HOMEWORK**

| Field       | Type              |
| ----------- | ----------------- |
| id          | INT PK AI         |
| class_id    | INT FK            |
| subject_id  | INT FK            |
| teacher_id  | INT FK            |
| title       | VARCHAR(255)      |
| description | TEXT              |
| attachment  | VARCHAR(255) NULL |
| due_date    | DATE              |

---

# 🟦 **3.17 HOMEWORK_SUBMISSIONS**

| Field        | Type         |
| ------------ | ------------ |
| id           | INT PK AI    |
| homework_id  | INT FK       |
| student_id   | INT FK       |
| file         | VARCHAR(255) |
| submitted_at | TIMESTAMP    |

---

---

# 💰 **FEES & FINANCE MODULE TABLES**

---

# 🟦 **3.18 FEE_TYPES (Mandatory fees)**

| Field    | Type          |
| -------- | ------------- |
| id       | INT PK AI     |
| fee_name | VARCHAR(150)  |
| amount   | DECIMAL(10,2) |
| class_id | INT FK        |

---

# 🟦 **3.19 OPTIONAL_SERVICES**

(e.g., transport, lunch, sports)

| Field        | Type          |
| ------------ | ------------- |
| id           | INT PK AI     |
| service_name | VARCHAR(150)  |
| amount       | DECIMAL(10,2) |
| description  | TEXT          |

---

# 🟦 **3.20 INVOICES**

| Field        | Type                            |
| ------------ | ------------------------------- |
| id           | INT PK AI                       |
| student_id   | INT FK                          |
| term_id      | INT FK                          |
| total_amount | DECIMAL(10,2)                   |
| amount_paid  | DECIMAL(10,2)                   |
| balance      | DECIMAL(10,2)                   |
| status       | ENUM('unpaid','partial','paid') |
| created_at   | TIMESTAMP                       |

---

# 🟦 **3.21 INVOICE_ITEMS**

| Field               | Type          |
| ------------------- | ------------- |
| id                  | INT PK AI     |
| invoice_id          | INT FK        |
| fee_type_id         | INT FK NULL   |
| optional_service_id | INT FK NULL   |
| label               | VARCHAR(150)  |
| amount              | DECIMAL(10,2) |

---

# 🟦 **3.22 PAYMENTS**

| Field          | Type                         |
| -------------- | ---------------------------- |
| id             | INT PK AI                    |
| invoice_id     | INT FK                       |
| student_id     | INT FK                       |
| amount         | DECIMAL(10,2)                |
| payment_method | ENUM('cash','bank','online') |
| reference_no   | VARCHAR(255)                 |
| received_by    | INT FK                       |
| created_at     | TIMESTAMP                    |

---

# 🟦 **3.23 OPTIONAL_SERVICES_SELECTED**

| Field      | Type      |
| ---------- | --------- |
| id         | INT PK AI |
| student_id | INT FK    |
| service_id | INT FK    |
| term_id    | INT FK    |

---

---

# 🔔 **NOTIFICATIONS**

---

# 🟦 **3.24 NOTIFICATIONS**

| Field      | Type         |
| ---------- | ------------ |
| id         | INT PK AI    |
| user_id    | INT FK       |
| title      | VARCHAR(255) |
| message    | TEXT         |
| is_read    | TINYINT(1)   |
| created_at | TIMESTAMP    |

---

# 🟦 **3.25 MESSAGES (Parent ↔ Teacher)**

| Field       | Type           |
| ----------- | -------------- |
| id          | INT PK AI      |
| sender_id   | INT FK → users |
| receiver_id | INT FK → users |
| message     | TEXT           |
| created_at  | TIMESTAMP      |

---

---

# ⚙️ **SYSTEM SETTINGS**

---

# 🟦 **3.26 SETTINGS**

| Field | Type         |
| ----- | ------------ |
| id    | INT PK AI    |
| key   | VARCHAR(100) |
| value | TEXT         |

---

# 🟦 **3.27 ACTIVITY_LOGS**

| Field      | Type      |
| ---------- | --------- |
| id         | INT PK AI |
| user_id    | INT FK    |
| activity   | TEXT      |
| created_at | TIMESTAMP |

---

# 🟩 RELATIONSHIP SUMMARY (Important for MVC)

* A parent → many children
* A child → zero/one admission → becomes a student
* A student → many invoices
* An invoice → many items → many payments
* A class → many students
* A class → many subjects
* A student → many attendance, results, homework submissions

---

# 🎉 DATABASE SCHEMA (ERD) COMPLETE