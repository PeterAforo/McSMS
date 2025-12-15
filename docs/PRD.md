# 📘 **Product Requirements Document (PRD)**

**Project:** School Management System
**Version:** **1.1**
**Prepared For:** Peter
**Platform:** PHP (XAMPP), MySQL, MVC Architecture
**Target Users:** Parents, Students, Teachers, Admissions, Finance Staff, Admins

---

# 1. **Product Overview**

A web-based system for managing school operations from **creche to grade school**, covering admissions, student management, fees, parent portal, teachers’ workflow, reporting, and communication. System supports multi-child parents, fee customization, installments, and performance tracking.

---

# 2. **Project Objectives**

1. Digitize the entire enrollment process.
2. Automate fee invoicing with optional services.
3. Provide real-time dashboards for parents, teachers, and admins.
4. Support complete academic management.
5. Produce financial, academic, and admissions reports.
6. Offer a scalable, secure, modular MVC-based platform.

---

# 3. **User Personas**

### **Parent**

Registers online, applies for child admission, pays fees, monitors performance.

### **Admissions Officer**

Reviews and approves or rejects applications.

### **Teacher**

Takes attendance, enters grades, uploads homework.

### **Finance Staff**

Manages invoices, payment tracking, receipts.

### **Admin**

Sets up system configuration, roles, academic year, fee structure.

---

# 4. **System Flow (High-level)**

1. Parent registers
2. Parent adds child & submits application
3. Admissions reviews & approves
4. System generates invoice
5. Parent pays full or installment
6. Student is enrolled
7. Teacher manages academic data
8. Parent views dashboard
9. Admin oversees the system

---

# 5. **Functional Requirements**

---

## 5.1 **Authentication & User Access**

* Parent registration
* Login/logout
* Role & permissions system
* Multi-child support

---

## 5.2 **Parent Portal**

Dashboard includes:

* Child profile
* Admission status
* Fees & balances
* Academic results
* Attendance summary
* Optional activity selection
* Notifications

---

## 5.3 **Admissions Module**

* View applications
* Verify documents
* Approve/reject
* Assign class
* Generate student ID

---

## 5.4 **Student Management**

* Student profile
* Class assignments
* Promotions
* Attendance
* Document storage

---

## 5.5 **Academic Management**

* Classes & sections
* Subjects
* Grading system
* Report card (PDF)
* Homework upload
* Timetable
* Academic calendar

---

## 5.6 **Fees & Payments**

* Mandatory + optional fees
* Installment options
* Auto invoice generation
* Payment tracking
* PDF receipts
* Financial reports

---

## 5.7 **Teacher Module**

* Attendance
* Grade entry
* Homework creation
* View class list
* Send notifications

---

## 5.8 **Admin & Settings**

* School information
* Academic session/term setup
* Fee setup
* Class setup
* User management
* Permissions
* Backup/restore (optional)

---

## 5.9 **Reporting & Analytics**

Reports for:

* Admissions
* Fees (paid/unpaid/outstanding)
* Academic performance
* Attendance
* Optional service usage

---

# 6. **Non-Functional Requirements**

## **Performance**

* Fast-loading dashboards
* Optimized queries

## **Security**

* PDO prepared statements
* Password hashing (bcrypt)
* File upload validation

## **Reliability**

* Daily backups
* Session timeout handling

## **Scalability**

* Modular MVC structure
* Template-based UI

---

# 7. **Technology Stack**

✔ **Updated with frontend tech stack**

## **7.1 Backend**

* **PHP 8+**
* **XAMPP (Apache)**
* **MVC architecture**
* **MySQL 5.7+ / MariaDB**
* PHPMailer
* PDF Library (DOMPDF or TCPDF)

---

## **7.2 Frontend**

### **Core**

* **HTML5 / CSS3 / JavaScript**

### **Framework**

* **Bootstrap 5**

  * For responsive layouts and consistent UI components.

### **Interactivity**

* **jQuery**

  * For forms, AJAX, modals, dynamic UI actions.

### **Tables**

* **DataTables.js**

  * For pagination, search, filtering, export-to-excel/PDF.

### **Charts**

* **Chart.js** or **ApexCharts**

  * For analytics dashboards.

### **Icons**

* **FontAwesome** or **Bootstrap Icons**

### **Recommended Admin Template**

* **AdminLTE** (free) or **Tabler**

  * Provides sidebar, navbar, cards, tables, forms, layout system.

This frontend stack integrates **100% smoothly** with PHP views under XAMPP and does *not* require an API-driven frontend architecture.

---

## **7.3 Optional Advanced Frontend (Future Upgrade)**

* Vue.js (most PHP-friendly)
* React.js (API-driven)
  These are NOT required for v1.0.

---

# 8. **Development Phases**

## **Phase 1 – Core System Setup**

* MVC structure
* Authentication
* Role system

## **Phase 2 – Parent + Admissions**

* Parent portal
* Child application
* Admissions approval

## **Phase 3 – Fees Module**

* Fee setup
* Invoice engine
* Payments

## **Phase 4 – Academic**

* Attendance
* Subjects
* Grading
* Homework

## **Phase 5 – Dashboards**

* Parent, Teacher, Admin dashboards

## **Phase 6 – Reports**

* Financial
* Academic
* Admissions

## **Phase 7 – UI/UX & Optimization**

* Dashboard enhancements
* Responsive optimization
* Testing & QA

---

# 9. **Acceptance Criteria**

* Parents can register, add children, and apply.
* Admissions can fully approve applications.
* Fees calculate correctly (mandatory + optional).
* Installments work.
* Teachers can upload attendance, homework, grades.
* Parents can view full dashboard of each child.
* Admin can configure school settings.
* Reports export correctly.