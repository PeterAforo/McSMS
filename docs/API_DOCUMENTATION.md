# 📚 McSMS Pro - Complete API Documentation

**Version:** 1.0  
**Base URL:** `http://localhost/McSMS/backend/api`  
**Last Updated:** December 3, 2025

---

## 🔐 **AUTHENTICATION**

### **Mobile API Authentication**

All mobile API endpoints require JWT token authentication.

**Base URL:** `/mobile/v1/`

#### **Login**
```http
POST /mobile/v1/auth.php?action=login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "device_id": "unique-device-id"
}

Response:
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {...},
  "expires_at": "2025-01-02 20:00:00"
}
```

#### **Using Token**
```http
GET /mobile/v1/parent.php?action=dashboard
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## 📄 **PDF REPORTS API**

### **Generate Report Card**
```http
GET /pdf_reports.php?type=report_card&id={student_id}&term_id={term_id}&action=view
GET /pdf_reports.php?type=report_card&id={student_id}&term_id={term_id}&action=download
```

### **Generate Invoice**
```http
GET /pdf_reports.php?type=invoice&id={invoice_id}&action=view
GET /pdf_reports.php?type=invoice&id={invoice_id}&action=download
```

### **Generate Receipt**
```http
GET /pdf_reports.php?type=receipt&id={payment_id}&action=view
GET /pdf_reports.php?type=receipt&id={payment_id}&action=download
```

### **Generate Transcript**
```http
GET /pdf_reports.php?type=transcript&id={student_id}&action=view
GET /pdf_reports.php?type=transcript&id={student_id}&action=download
```

---

## 📧 **EMAIL NOTIFICATIONS API**

### **Send Invoice Notification**
```http
POST /notifications.php?action=send_invoice_notification
Content-Type: application/json

{
  "invoice_id": 1
}
```

### **Send Payment Confirmation**
```http
POST /notifications.php?action=send_payment_confirmation
Content-Type: application/json

{
  "payment_id": 1
}
```

### **Send Application Status**
```http
POST /notifications.php?action=send_application_status
Content-Type: application/json

{
  "application_id": 1,
  "status": "approved"
}
```

### **Send Bulk Fee Reminders**
```http
POST /notifications.php?action=send_bulk_reminders
```

---

## 📱 **SMS API**

### **Send Single SMS**
```http
POST /notifications.php?action=send_sms
Content-Type: application/json

{
  "phone": "+233XXXXXXXXX",
  "message": "Your message here"
}
```

### **Send Bulk SMS**
```http
POST /notifications.php?action=send_bulk_sms
Content-Type: application/json

{
  "recipients": ["+233XXXXXXXXX", "+233YYYYYYYYY"],
  "message": "Bulk message"
}
```

### **Check SMS Balance**
```http
GET /notifications.php?action=get_sms_balance
```

---

## 💳 **PAYMENT API**

Payment processing is handled through the `PaymentGateway` class. See implementation in `backend/src/Payments/PaymentGateway.php`.

---

## 📅 **TIMETABLE API**

### **Get All Templates**
```http
GET /timetable.php?resource=templates
```

### **Get Template Details**
```http
GET /timetable.php?resource=templates&id={template_id}
```

### **Create Template**
```http
POST /timetable.php?resource=templates
Content-Type: application/json

{
  "template_name": "Term 1 Timetable",
  "academic_year": "2025",
  "term_id": 1,
  "status": "draft"
}
```

### **Get Timetable Entries**
```http
GET /timetable.php?resource=entries&action=by_template&template_id={id}&class_id={class_id}
```

### **Create Entry**
```http
POST /timetable.php?resource=entries
Content-Type: application/json

{
  "template_id": 1,
  "class_id": 1,
  "subject_id": 1,
  "teacher_id": 1,
  "day_of_week": "Monday",
  "time_slot_id": 1,
  "room_number": "R101"
}
```

### **Get Conflicts**
```http
GET /timetable.php?resource=conflicts&template_id={id}
```

---

## 📝 **EXAM MANAGEMENT API**

### **Get All Exams**
```http
GET /exams.php?resource=exams
GET /exams.php?resource=exams&term_id={term_id}&status=scheduled
```

### **Create Exam**
```http
POST /exams.php?resource=exams
Content-Type: application/json

{
  "exam_name": "Mid-Term Exam",
  "exam_type_id": 1,
  "academic_year": "2025",
  "term_id": 1,
  "start_date": "2025-02-01",
  "end_date": "2025-02-15"
}
```

### **Get Exam Schedules**
```http
GET /exams.php?resource=schedules&action=by_exam&exam_id={id}
GET /exams.php?resource=schedules&action=by_date&date=2025-02-01
```

### **Create Schedule**
```http
POST /exams.php?resource=schedules
Content-Type: application/json

{
  "exam_id": 1,
  "class_id": 1,
  "subject_id": 1,
  "exam_date": "2025-02-01",
  "start_time": "08:00",
  "end_time": "10:00",
  "duration_minutes": 120,
  "max_marks": 100,
  "auto_generate_seating": true
}
```

### **Generate Seating**
```http
GET /exams.php?resource=seating&action=generate&schedule_id={id}&class_id={class_id}&room_id={room_id}
```

### **Get Seating**
```http
GET /exams.php?resource=seating&action=by_schedule&schedule_id={id}
```

### **Submit Results**
```http
POST /exams.php?resource=results
Content-Type: application/json

{
  "exam_schedule_id": 1,
  "student_id": 1,
  "marks_obtained": 85,
  "max_marks": 100,
  "remarks": "Good performance"
}
```

### **Publish Results**
```http
PUT /exams.php?resource=results&action=publish&schedule_id={id}
```

### **Get Statistics**
```http
GET /exams.php?resource=statistics&schedule_id={id}
```

---

## 🎓 **LEARNING MANAGEMENT SYSTEM API**

### **Courses**

#### **Get All Courses**
```http
GET /lms.php?resource=courses
GET /lms.php?resource=courses&class_id={class_id}&status=published
```

#### **Get My Courses (Student)**
```http
GET /lms.php?resource=courses&action=my_courses&student_id={id}
```

#### **Create Course**
```http
POST /lms.php?resource=courses
Content-Type: application/json

{
  "course_code": "MATH101",
  "course_name": "Mathematics Grade 10",
  "category_id": 1,
  "subject_id": 1,
  "class_id": 1,
  "teacher_id": 1,
  "description": "Course description",
  "status": "published"
}
```

### **Lessons**

#### **Get Course Lessons**
```http
GET /lms.php?resource=lessons&action=by_course&course_id={id}
```

#### **Create Lesson**
```http
POST /lms.php?resource=lessons
Content-Type: application/json

{
  "course_id": 1,
  "lesson_title": "Introduction to Algebra",
  "lesson_type": "video",
  "video_url": "https://youtube.com/watch?v=...",
  "duration_minutes": 45,
  "status": "published"
}
```

#### **Mark Lesson Complete**
```http
PUT /lms.php?resource=lessons&id={lesson_id}&action=mark_complete
Content-Type: application/json

{
  "enrollment_id": 1
}
```

### **Assignments**

#### **Get Course Assignments**
```http
GET /lms.php?resource=assignments&action=by_course&course_id={id}
```

#### **Get Student Assignments**
```http
GET /lms.php?resource=assignments&action=by_student&student_id={id}
```

#### **Create Assignment**
```http
POST /lms.php?resource=assignments
Content-Type: application/json

{
  "course_id": 1,
  "assignment_title": "Algebra Homework",
  "description": "Complete exercises 1-10",
  "max_marks": 100,
  "due_date": "2025-02-15 23:59:59",
  "allow_late_submission": true,
  "status": "published"
}
```

#### **Submit Assignment**
```http
POST /lms.php?resource=submissions
Content-Type: application/json

{
  "assignment_id": 1,
  "student_id": 1,
  "submission_text": "My answers...",
  "attachment_path": "/uploads/assignment1.pdf"
}
```

#### **Grade Submission**
```http
PUT /lms.php?resource=submissions&id={submission_id}&action=grade
Content-Type: application/json

{
  "marks_obtained": 85,
  "feedback": "Good work!",
  "graded_by": 1
}
```

### **Quizzes**

#### **Get Course Quizzes**
```http
GET /lms.php?resource=quizzes&action=by_course&course_id={id}
```

#### **Get Quiz with Questions**
```http
GET /lms.php?resource=quizzes&id={quiz_id}
```

#### **Create Quiz**
```http
POST /lms.php?resource=quizzes
Content-Type: application/json

{
  "course_id": 1,
  "quiz_title": "Algebra Quiz",
  "duration_minutes": 30,
  "max_attempts": 2,
  "pass_percentage": 60,
  "status": "published"
}
```

---

## 📊 **ANALYTICS API**

### **Overview Dashboard**
```http
GET /analytics.php?resource=overview
```

### **Student Analytics**

#### **Enrollment Trends**
```http
GET /analytics.php?resource=students&action=enrollment_trends
```

#### **Performance Analysis**
```http
GET /analytics.php?resource=students&action=performance&term_id={id}
```

#### **At-Risk Students**
```http
GET /analytics.php?resource=students&action=at_risk
```

#### **Distribution by Class**
```http
GET /analytics.php?resource=students&action=by_class
```

### **Financial Analytics**

#### **Revenue Trends**
```http
GET /analytics.php?resource=finance&action=revenue_trends
```

#### **Collection Rate**
```http
GET /analytics.php?resource=finance&action=collection_rate
```

#### **Revenue Forecast**
```http
GET /analytics.php?resource=finance&action=forecast
```

#### **Payment Methods**
```http
GET /analytics.php?resource=finance&action=payment_methods
```

### **Attendance Analytics**

#### **Attendance Trends**
```http
GET /analytics.php?resource=attendance&action=trends
```

#### **By Class**
```http
GET /analytics.php?resource=attendance&action=by_class
```

#### **Chronic Absentees**
```http
GET /analytics.php?resource=attendance&action=chronic_absentees
```

### **Exam Analytics**

#### **Performance Trends**
```http
GET /analytics.php?resource=exams&action=performance_trends
```

#### **Subject Performance**
```http
GET /analytics.php?resource=exams&action=subject_performance&exam_id={id}
```

#### **Grade Distribution**
```http
GET /analytics.php?resource=exams&action=grade_distribution&exam_id={id}
```

---

## 🚌 **TRANSPORT MANAGEMENT API**

### **Vehicles**

#### **Get All Vehicles**
```http
GET /transport.php?resource=vehicles
GET /transport.php?resource=vehicles&status=active
```

#### **Create Vehicle**
```http
POST /transport.php?resource=vehicles
Content-Type: application/json

{
  "vehicle_number": "BUS-001",
  "vehicle_type": "bus",
  "make": "Toyota",
  "model": "Coaster",
  "capacity": 30,
  "registration_number": "GH-1234-20",
  "status": "active"
}
```

### **Drivers**

#### **Get All Drivers**
```http
GET /transport.php?resource=drivers
```

#### **Create Driver**
```http
POST /transport.php?resource=drivers
Content-Type: application/json

{
  "driver_name": "John Doe",
  "phone": "+233XXXXXXXXX",
  "license_number": "DL-2024-001",
  "license_expiry": "2026-12-31",
  "status": "active"
}
```

### **Routes**

#### **Get All Routes**
```http
GET /transport.php?resource=routes
```

#### **Get Route with Stops**
```http
GET /transport.php?resource=routes&id={route_id}
```

#### **Create Route**
```http
POST /transport.php?resource=routes
Content-Type: application/json

{
  "route_name": "East Route",
  "route_code": "RT-EAST",
  "start_location": "Madina",
  "end_location": "School Campus",
  "total_distance": 15.5,
  "fare_amount": 150.00,
  "status": "active"
}
```

### **Vehicle Assignments**

#### **Get Today's Assignments**
```http
GET /transport.php?resource=assignments&action=today
```

#### **Get Assignments by Date**
```http
GET /transport.php?resource=assignments&action=by_date&date=2025-02-01
```

#### **Create Assignment**
```http
POST /transport.php?resource=assignments
Content-Type: application/json

{
  "vehicle_id": 1,
  "driver_id": 1,
  "route_id": 1,
  "assignment_date": "2025-02-01",
  "shift": "both",
  "start_time": "06:00",
  "end_time": "18:00"
}
```

### **GPS Tracking**

#### **Get Live Positions**
```http
GET /transport.php?resource=tracking&action=live
```

#### **Get Vehicle History**
```http
GET /transport.php?resource=tracking&action=history&vehicle_id={id}&date=2025-02-01
```

#### **Update Location**
```http
POST /transport.php?resource=tracking
Content-Type: application/json

{
  "vehicle_id": 1,
  "latitude": 5.6037,
  "longitude": -0.1870,
  "speed": 45.5,
  "status": "moving"
}
```

### **Student Transport**

#### **Get Students on Route**
```http
GET /transport.php?resource=student_transport&action=by_route&route_id={id}
```

#### **Register Student**
```http
POST /transport.php?resource=student_transport
Content-Type: application/json

{
  "student_id": 1,
  "route_id": 1,
  "stop_id": 1,
  "fare_amount": 150.00,
  "start_date": "2025-02-01"
}
```

### **Maintenance**

#### **Get Upcoming Maintenance**
```http
GET /transport.php?resource=maintenance&action=upcoming
```

#### **Schedule Maintenance**
```http
POST /transport.php?resource=maintenance
Content-Type: application/json

{
  "vehicle_id": 1,
  "maintenance_type": "routine",
  "description": "Oil change and inspection",
  "maintenance_date": "2025-02-15",
  "cost": 500.00
}
```

---

## 👥 **HR & PAYROLL API**

### **Employees**

#### **Get All Employees**
```http
GET /hr_payroll.php?resource=employees
GET /hr_payroll.php?resource=employees&status=active&department_id={id}
```

#### **Create Employee**
```http
POST /hr_payroll.php?resource=employees
Content-Type: application/json

{
  "employee_number": "EMP-001",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+233XXXXXXXXX",
  "department_id": 1,
  "designation_id": 1,
  "employment_type": "full_time",
  "join_date": "2025-01-01",
  "basic_salary": 3000.00
}
```

### **Payroll**

#### **Generate Monthly Payroll**
```http
GET /hr_payroll.php?resource=payroll&action=generate&month=2025-02
```

#### **Get Monthly Payroll**
```http
GET /hr_payroll.php?resource=payroll&action=by_month&month=2025-02
```

#### **Get Employee Payroll History**
```http
GET /hr_payroll.php?resource=payroll&action=by_employee&employee_id={id}
```

#### **Get Payroll Details**
```http
GET /hr_payroll.php?resource=payroll&id={payroll_id}
```

#### **Process Payroll**
```http
PUT /hr_payroll.php?resource=payroll&id={payroll_id}&action=process
Content-Type: application/json

{
  "processed_by": 1
}
```

#### **Mark as Paid**
```http
PUT /hr_payroll.php?resource=payroll&id={payroll_id}&action=pay
Content-Type: application/json

{
  "payment_date": "2025-02-28",
  "payment_method": "bank_transfer",
  "payment_reference": "TXN123456"
}
```

### **Leave Management**

#### **Get Pending Applications**
```http
GET /hr_payroll.php?resource=leave&action=pending
```

#### **Get Employee Leaves**
```http
GET /hr_payroll.php?resource=leave&action=by_employee&employee_id={id}
```

#### **Apply for Leave**
```http
POST /hr_payroll.php?resource=leave
Content-Type: application/json

{
  "employee_id": 1,
  "leave_type_id": 1,
  "start_date": "2025-03-01",
  "end_date": "2025-03-05",
  "reason": "Personal reasons"
}
```

#### **Approve Leave**
```http
PUT /hr_payroll.php?resource=leave&id={leave_id}&action=approve
Content-Type: application/json

{
  "approved_by": 1
}
```

#### **Reject Leave**
```http
PUT /hr_payroll.php?resource=leave&id={leave_id}&action=reject
Content-Type: application/json

{
  "approved_by": 1,
  "rejection_reason": "Insufficient leave balance"
}
```

### **Employee Attendance**

#### **Get Daily Attendance**
```http
GET /hr_payroll.php?resource=attendance&action=by_date&date=2025-02-01
```

#### **Get Employee Attendance**
```http
GET /hr_payroll.php?resource=attendance&action=by_employee&employee_id={id}&month=2025-02
```

#### **Mark Attendance**
```http
POST /hr_payroll.php?resource=attendance
Content-Type: application/json

{
  "employee_id": 1,
  "attendance_date": "2025-02-01",
  "check_in_time": "08:00",
  "check_out_time": "17:00",
  "status": "present"
}
```

### **Performance Reviews**

#### **Get Employee Reviews**
```http
GET /hr_payroll.php?resource=performance&action=by_employee&employee_id={id}
```

#### **Create Review**
```http
POST /hr_payroll.php?resource=performance
Content-Type: application/json

{
  "employee_id": 1,
  "review_period_start": "2025-01-01",
  "review_period_end": "2025-01-31",
  "reviewer_id": 1,
  "work_quality": 4,
  "productivity": 5,
  "communication": 4,
  "teamwork": 5,
  "punctuality": 4,
  "strengths": "Excellent performance",
  "areas_for_improvement": "Time management",
  "status": "submitted"
}
```

---

## 🔄 **RESPONSE FORMATS**

### **Success Response**
```json
{
  "success": true,
  "data": {...}
}
```

### **Error Response**
```json
{
  "success": false,
  "error": "Error message here"
}
```

### **Validation Error**
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "field_name": ["Error message 1", "Error message 2"]
  }
}
```

---

## 📝 **NOTES**

- All dates should be in `YYYY-MM-DD` format
- All times should be in `HH:MM:SS` format
- All amounts should be decimal numbers
- Phone numbers should include country code (+233 for Ghana)
- File uploads should use multipart/form-data
- JWT tokens expire after 30 days
- Rate limiting: 100 requests per minute per IP

---

**API Documentation Version:** 1.0  
**Last Updated:** December 3, 2025  
**Total Endpoints:** 110+  
**Status:** Production Ready ✅
