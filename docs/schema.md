# 🟦 **SQL DATABASE SCHEMA — School Management System**

**Recommended DB name:** `school_management_system`

You can copy & run this entire script in phpMyAdmin or MySQL CLI.

---

# ✅ **1. USERS & AUTH TABLES**

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    user_type ENUM('admin','parent','teacher','finance','admissions') NOT NULL,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL
);

CREATE TABLE user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

---

# ✅ **2. PARENT & STUDENT TABLES**

```sql
CREATE TABLE parents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address TEXT,
    occupation VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    gender ENUM('male','female') NOT NULL,
    date_of_birth DATE NOT NULL,
    previous_school VARCHAR(150),
    photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES parents(id)
);
```

---

# ✅ **3. ADMISSIONS TABLE**

```sql
CREATE TABLE admissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    preferred_class_id INT NOT NULL,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    remarks TEXT,
    documents JSON,
    processed_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id),
    FOREIGN KEY (processed_by) REFERENCES users(id)
);
```

---

# ✅ **4. STUDENT TABLE**

```sql
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    enrollment_date DATE NOT NULL,
    status ENUM('active','graduated','left') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id)
);
```

---

# ✅ **5. ACADEMIC STRUCTURE (Sessions, Terms, Classes, Sections)**

```sql
CREATE TABLE academic_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_name VARCHAR(20) NOT NULL,
    is_active TINYINT(1) DEFAULT 0
);

CREATE TABLE academic_terms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    term_name VARCHAR(20) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active TINYINT(1) DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES academic_sessions(id)
);

CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    level ENUM('creche','nursery','kg','grade') NOT NULL
);

CREATE TABLE sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    section_name VARCHAR(50) NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id)
);
```

---

# ✅ **6. SUBJECTS & CLASS SUBJECTS**

```sql
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(150) NOT NULL,
    level ENUM('creche','nursery','kg','grade') NOT NULL
);

CREATE TABLE class_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);
```

---

# ✅ **7. ATTENDANCE**

```sql
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present','absent','late') NOT NULL,
    marked_by INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (marked_by) REFERENCES users(id)
);
```

---

# ✅ **8. RESULTS / ACADEMIC PERFORMANCE**

```sql
CREATE TABLE results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    term_id INT NOT NULL,
    ca_score DECIMAL(5,2) DEFAULT 0,
    exam_score DECIMAL(5,2) DEFAULT 0,
    total DECIMAL(5,2) DEFAULT 0,
    grade VARCHAR(2),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (term_id) REFERENCES academic_terms(id)
);
```

---

# ✅ **9. HOMEWORK MODULE**

```sql
CREATE TABLE homework (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    attachment VARCHAR(255),
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE homework_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    homework_id INT NOT NULL,
    student_id INT NOT NULL,
    file VARCHAR(255),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (homework_id) REFERENCES homework(id),
    FOREIGN KEY (student_id) REFERENCES students(id)
);
```

---

# 🟩 **10. FEES & FINANCIAL TABLES**

---

## **10.1 FEE TYPES**

```sql
CREATE TABLE fee_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fee_name VARCHAR(150) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    class_id INT NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id)
);
```

---

## **10.2 OPTIONAL SERVICES**

```sql
CREATE TABLE optional_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(150) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT
);
```

---

## **10.3 INVOICES**

```sql
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    term_id INT NOT NULL,
    total_amount DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) DEFAULT 0,
    status ENUM('unpaid','partial','paid') DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (term_id) REFERENCES academic_terms(id)
);
```

---

## **10.4 INVOICE ITEMS**

```sql
CREATE TABLE invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    fee_type_id INT NULL,
    optional_service_id INT NULL,
    label VARCHAR(150),
    amount DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (fee_type_id) REFERENCES fee_types(id),
    FOREIGN KEY (optional_service_id) REFERENCES optional_services(id)
);
```

---

## **10.5 PAYMENTS**

```sql
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    student_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash','bank','online') NOT NULL,
    reference_no VARCHAR(255),
    received_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (received_by) REFERENCES users(id)
);
```

---

## **10.6 OPTIONAL SERVICES SELECTED**

```sql
CREATE TABLE optional_services_selected (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    service_id INT NOT NULL,
    term_id INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (service_id) REFERENCES optional_services(id),
    FOREIGN KEY (term_id) REFERENCES academic_terms(id)
);
```

---

# 🟩 **11. NOTIFICATIONS & MESSAGING**

```sql
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255),
    message TEXT,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);
```

---

# 🟩 **12. SYSTEM SETTINGS & LOGS**

```sql
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(100) NOT NULL,
    value TEXT
);

CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
