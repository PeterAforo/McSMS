## 1️⃣ Project MVC Structure

Recommended folder layout:

```bash
/project_root
  /app
    /controllers
      AuthController.php
      ParentController.php
      AdmissionsController.php
      StudentController.php
      TeacherController.php
      FeesController.php
      AcademicController.php
      AdminController.php
      ReportController.php
      ApiController.php      # optional for AJAX
    /models
      User.php
      ParentModel.php
      Child.php
      Admission.php
      Student.php
      ClassModel.php
      Subject.php
      Fee.php
      Invoice.php
      Payment.php
      Attendance.php
      Result.php
      Homework.php
      OptionalService.php
      Notification.php
      Setting.php
    /views
      /layouts
        main.php
        auth.php
      /auth
      /parent
      /admissions
      /student
      /teacher
      /fees
      /academic
      /admin
      /reports
  /public
    index.php        # front controller / router
    /assets
      /css
      /js
      /images
      /uploads
  /config
    config.php
    database.php
  /core
    Controller.php
    Model.php
    Router.php
    View.php
    Auth.php
    Session.php
    DB.php
```

---

## 2️⃣ Router Pattern

You can use a simple query-based router like:

```php
// public/index.php
$controller = $_GET['c'] ?? 'auth';
$action     = $_GET['a'] ?? 'login';
```

So URLs look like:

* `index.php?c=auth&a=login`
* `index.php?c=parent&a=dashboard`
* `index.php?c=fees&a=invoiceList`

Later you can switch to pretty URLs if you want.

---

## 3️⃣ Core Base Classes (simplified)

### `core/Controller.php`

```php
abstract class Controller {
    protected function render($view, $data = [], $layout = 'main') {
        extract($data);
        $viewFile = __DIR__ . "/../views/{$view}.php";
        $layoutFile = __DIR__ . "/../views/layouts/{$layout}.php";
        include $layoutFile;
    }
}
```

### `core/Model.php`

```php
abstract class Model {
    protected $db;
    public function __construct() {
        $this->db = DB::getConnection();
    }
}
```

---

## 4️⃣ Module-by-Module MVC Breakdown

---

### 🔐 4.1 Authentication Module

**Controller:** `AuthController.php`

**Key Actions:**

* `login()` – show login form
* `doLogin()` – process POST login
* `registerParent()` – parent registration form
* `storeParent()` – save new parent + user
* `logout()` – destroy session
* `forgotPassword()` (optional)
* `resetPassword()` (optional)

**Models:**

* `User`

  * `findByEmail($email)`
  * `create($data)`
  * `verifyPassword($email, $password)`
* `ParentModel`

  * `createFromUser($userId, $data)`

**Views:**

* `/views/auth/login.php`
* `/views/auth/register_parent.php`
* `/views/auth/forgot_password.php` (optional)

**Example route:**

* `index.php?c=auth&a=login`
* `index.php?c=auth&a=registerParent`

---

### 👨‍👩‍👧 4.2 Parent Module

**Controller:** `ParentController.php`

**Key Actions:**

* `dashboard()` – parent home, children list, balances, notifications
* `profile()` – view/update parent profile
* `children()` – list of child profiles
* `addChild()` – form to add child
* `storeChild()` – save child
* `applications()` – list child admission applications
* `applyForAdmission($childId)` – admission form
* `submitApplication()` – save admission
* `fees()` – list invoices per child
* `viewInvoice($invoiceId)`
* `selectOptionalServices($studentId)` – pick optional services
* `saveOptionalServices()` – update DB
* `results($studentId, $termId)`
* `attendance($studentId, $termId)`
* `homework($studentId)`

**Models:**

* `ParentModel`

  * `getByUserId($userId)`
  * `update($id, $data)`
* `Child`

  * `getByParent($parentId)`
  * `create($data)`
* `Admission`

  * `getByChild($childId)`
  * `create($data)`
* `Student`

  * `getByParent($parentId)`
* `Invoice`

  * `getByStudent($studentId)`
* `Result`

  * `getByStudentAndTerm($studentId, $termId)`
* `Attendance`

  * `getSummaryByStudentAndTerm($studentId, $termId)`
* `Homework`

  * `getForStudentClass($classId)`

**Views (examples):**

* `/views/parent/dashboard.php`
* `/views/parent/profile.php`
* `/views/parent/children_list.php`
* `/views/parent/child_form.php`
* `/views/parent/applications_list.php`
* `/views/parent/admission_form.php`
* `/views/parent/invoices_list.php`
* `/views/parent/invoice_view.php`
* `/views/parent/optional_services.php`
* `/views/parent/results.php`
* `/views/parent/attendance.php`
* `/views/parent/homework.php`

---

### 🏫 4.3 Admissions Module

**Controller:** `AdmissionsController.php`

**Key Actions:**

* `index()` – list of pending applications
* `view($applicationId)` – application detail
* `approve($applicationId)` – show approve form (class, section)
* `doApprove()` – create student, assign class, change status
* `reject($applicationId)` – show reject form
* `doReject()` – update status + remarks
* `history()` – list of approved/rejected

**Models:**

* `Admission`

  * `getAllPending()`
  * `getById($id)`
  * `updateStatus($id, $status, $remarks)`
* `Student`

  * `createFromAdmission($admissionId, $data)`
* `ClassModel`

  * `getAll()`
  * `getByLevel()`

**Views:**

* `/views/admissions/list_pending.php`
* `/views/admissions/view_application.php`
* `/views/admissions/approve_form.php`
* `/views/admissions/reject_form.php`
* `/views/admissions/history.php`

---

### 🎓 4.4 Student Management Module

**Controller:** `StudentController.php`

**Key Actions (Admin/Teacher side):**

* `index()` – list students (filter by class, status)
* `view($studentId)` – full details
* `edit($studentId)` – basic info
* `update()` – save edits
* `promote()` – bulk promotion by class/term
* `changeClass()` – move student class

**Models:**

* `Student`

  * `getAll($filters)`
  * `getById($id)`
  * `update($id, $data)`
  * `promoteBulk($classId, $newClassId)`
* `ParentModel`
* `ClassModel`
* `Section`

**Views:**

* `/views/student/list.php`
* `/views/student/view.php`
* `/views/student/edit.php`
* `/views/student/promote.php`

---

### 📚 4.5 Academic Module

**Controller:** `AcademicController.php`

**Key Actions:**

* `classes()` – manage classes
* `createClass()`, `storeClass()`, `editClass()`, `updateClass()`
* `sections()` – manage sections per class
* `subjects()` – manage subjects
* `assignSubjects()` – assign subjects to class
* `timetable()` – (optional) manage timetable
* `calendar()` – academic calendar

Plus **term/session**:

* `sessions()` – list academic sessions
* `storeSession()`
* `terms()` – list terms
* `storeTerm()`
* `setActiveTerm()` – change current term

**Models:**

* `ClassModel`
* `Section`
* `Subject`
* `ClassSubject`
* `AcademicSession`
* `AcademicTerm`

**Views:**

* `/views/academic/classes.php`
* `/views/academic/class_form.php`
* `/views/academic/sections.php`
* `/views/academic/subjects.php`
* `/views/academic/assign_subjects.php`
* `/views/academic/sessions.php`
* `/views/academic/terms.php`
* `/views/academic/calendar.php`

---

### 👨‍🏫 4.6 Teacher Module

**Controller:** `TeacherController.php`

**Key Actions:**

* `dashboard()` – teacher home page
* `myClasses()` – classes assigned to this teacher
* `attendance($classId)` – show list, mark attendance
* `storeAttendance()` – save
* `results($classId, $subjectId)` – enter scores
* `storeResults()` – save results
* `homeworkList($classId, $subjectId)`
* `createHomework()` / `storeHomework()`
* `viewSubmissions($homeworkId)`

**Models:**

* `Teacher` (or just `User` with teacher role)
* `ClassModel`
* `Student`
* `Attendance`
* `Result`
* `Homework`
* `HomeworkSubmission`

**Views:**

* `/views/teacher/dashboard.php`
* `/views/teacher/my_classes.php`
* `/views/teacher/attendance_form.php`
* `/views/teacher/results_form.php`
* `/views/teacher/homework_list.php`
* `/views/teacher/homework_form.php`
* `/views/teacher/homework_submissions.php`

---

### 💰 4.7 Fees & Payments Module

**Controller:** `FeesController.php`

**Key Actions (Admin/Finance):**

* `feeTypes()` – manage mandatory fees
* `createFeeType()`, `storeFeeType()`, `editFeeType()`, `updateFeeType()`
* `optionalServices()` – manage optional services
* `storeOptionalService()`, `updateOptionalService()`
* `generateInvoice($studentId, $termId)` – manual generation (if needed)
* `invoices()` – list all invoices (filters: class, term, status)
* `viewInvoice($invoiceId)`
* `recordPayment($invoiceId)` – form
* `storePayment()` – save payment, update invoice status
* `studentFees($studentId)` – view all invoices for one student

**Models:**

* `Fee` / `FeeType`
* `OptionalService`
* `Invoice`

  * `createForStudent($studentId, $termId)`
  * `recalculate($invoiceId)`
* `InvoiceItem`
* `Payment`

**Views:**

* `/views/fees/fee_types.php`
* `/views/fees/optional_services.php`
* `/views/fees/invoices_list.php`
* `/views/fees/invoice_view.php`
* `/views/fees/payment_form.php`
* `/views/fees/student_fees.php`

---

### ⚙️ 4.8 Admin & Settings Module

**Controller:** `AdminController.php`

**Key Actions:**

* `dashboard()` – system-wide stats
* `settings()` – general school settings
* `updateSettings()`
* `users()` – list all users
* `createUser()` – create staff/admin account
* `storeUser()`
* `roles()` – manage custom roles (optional)
* `logs()` – view activity logs

**Models:**

* `User`
* `Role`
* `Setting`
* `ActivityLog`

**Views:**

* `/views/admin/dashboard.php`
* `/views/admin/settings.php`
* `/views/admin/users.php`
* `/views/admin/user_form.php`
* `/views/admin/roles.php`
* `/views/admin/logs.php`

---

### 📊 4.9 Reporting Module

**Controller:** `ReportController.php`

**Key Actions:**

* `feeReport()` – filter by term/class (paid, unpaid, partial)
* `admissionsReport()` – by status, date, class
* `performanceReport()` – per class, subject, term
* `attendanceReport()` – summary by class/term
* Export endpoints (CSV/PDF) – e.g. `exportFeesCsv()`

**Models:**

* can reuse `Invoice`, `Payment`, `Admission`, `Result`, `Attendance` with report-oriented methods.

**Views:**

* `/views/reports/fees.php`
* `/views/reports/admissions.php`
* `/views/reports/performance.php`
* `/views/reports/attendance.php`

---

### 🔔 4.10 Notifications & Messaging

**Controllers:**

* `NotificationController.php` (or inside `AdminController`)
* `MessageController.php` (for Parent–Teacher chat)

**Key Actions:**

* `notifications()` – list user notifications
* `markAsRead($id)`
* `sendMessage()` – parent ↔ teacher
* `inbox()`
* `thread($userId)` – conversation with one user

**Models:**

* `Notification`
* `Message`

**Views:**

* `/views/notifications/list.php`
* `/views/messages/inbox.php`
* `/views/messages/thread.php`

---

## 5️⃣ How This Maps to the PRD

* Every PRD module now has:

  * Controllers (entry points)
  * Models (DB operations tied to our earlier schema)
  * Views (screens you’ll build with Bootstrap + AdminLTE)
* You can implement **module by module**, starting with:

  1. `AuthController` + `User`, `ParentModel`
  2. `ParentController` (dashboard, children, admissions)
  3. `AdmissionsController`
  4. `FeesController`
  5. `TeacherController` & `AcademicController`
