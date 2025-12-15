# 🚀 McSMS Pro Features - Installation Guide

## Quick Installation (Recommended)

### **Option 1: One-Click Installation (phpMyAdmin)**

1. **Open phpMyAdmin**
   - Go to: `http://localhost/phpmyadmin`
   - Select your database: `school_management_system`

2. **Click on "Import" tab**

3. **Choose file:**
   - Click "Choose File"
   - Navigate to: `d:\xampp\htdocs\McSMS\INSTALL_PRO_FEATURES.sql`
   - Click "Go"

4. **Wait for completion**
   - You'll see success messages for each phase
   - Total time: ~30 seconds

✅ **Done! All 100+ tables are now installed!**

---

### **Option 2: Manual Installation (MySQL Command Line)**

1. **Open Command Prompt**
   ```bash
   cd d:\xampp\htdocs\McSMS
   ```

2. **Login to MySQL**
   ```bash
   mysql -u root -p
   ```

3. **Select Database**
   ```sql
   USE school_management_system;
   ```

4. **Run Installation Script**
   ```sql
   SOURCE d:/xampp/htdocs/McSMS/INSTALL_PRO_FEATURES.sql;
   ```

5. **Wait for completion**
   - You'll see progress messages
   - Each phase will show "✓ Complete"

✅ **Done! All tables installed!**

---

### **Option 3: Individual Migrations (If needed)**

If you prefer to install modules one by one:

```sql
-- In phpMyAdmin SQL tab, run these one by one:

-- Phase 1: Mobile Support
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_mobile_support.sql;

-- Phase 2.1: Timetable
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_timetable_tables.sql;

-- Phase 2.2: Exams
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_exam_management_tables.sql;

-- Phase 2.3: LMS
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_lms_tables.sql;

-- Phase 3.1: Transport
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_transport_management_tables.sql;

-- Phase 3.2: HR & Payroll
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_hr_payroll_tables.sql;

-- Phase 3.3: Biometric
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_biometric_integration_tables.sql;

-- Phase 3.4: Multi-School
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_multi_school_tables.sql;

-- Phase 3.5: AI Features
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_ai_features_tables.sql;
```

---

## 📊 What Gets Installed

### **Phase 1: Mobile Support (6 tables)**
- user_devices
- password_resets
- api_rate_limits
- push_notifications
- sync_queue
- app_settings

### **Phase 2.1: Timetable Management (7 tables)**
- time_slots
- timetable_templates
- timetable_entries
- teacher_substitutions
- rooms
- timetable_conflicts
- + Default time slots and rooms

### **Phase 2.2: Exam Management (10 tables)**
- exam_types
- exams
- exam_schedules
- exam_seating
- exam_invigilators
- exam_results
- exam_attendance
- exam_admit_cards
- grade_scales
- exam_statistics

### **Phase 2.3: LMS (17 tables)**
- course_categories
- courses
- course_lessons
- course_materials
- course_enrollments
- lesson_progress
- assignments
- assignment_submissions
- quizzes
- quiz_questions
- quiz_question_options
- quiz_attempts
- quiz_answers
- course_discussions
- course_announcements
- + Default categories

### **Phase 3.1: Transport Management (12 tables)**
- vehicles
- drivers
- transport_routes
- route_stops
- vehicle_assignments
- student_transport
- transport_attendance
- vehicle_maintenance
- fuel_logs
- vehicle_tracking
- transport_fees
- transport_incidents
- + Sample vehicles, drivers, routes

### **Phase 3.2: HR & Payroll (17 tables)**
- employee_categories
- departments
- designations
- employees
- salary_components
- employee_salary_structure
- payroll
- payroll_details
- leave_types
- leave_applications
- employee_attendance
- performance_reviews
- training_programs
- training_participants
- employee_documents
- + Default data

### **Phase 3.3: Biometric Integration (11 tables)**
- biometric_devices
- biometric_enrollments
- biometric_attendance_logs
- access_control_rules
- access_logs
- visitors
- biometric_sync_queue
- device_health_logs
- biometric_audit_trail
- temperature_screening_logs
- + Sample devices

### **Phase 3.4: Multi-School Management (10 tables)**
- school_branches
- branch_administrators
- consolidated_reports
- branch_performance_metrics
- data_sync_logs
- branch_settings
- inter_branch_transfers
- shared_resources
- branch_communications
- branch_comparison_reports
- + Sample branches

### **Phase 3.5: AI Features (11 tables)**
- ai_predictions
- ai_recommendations
- chatbot_conversations
- chatbot_knowledge_base
- smart_scheduling_suggestions
- anomaly_detections
- ml_model_performance
- automated_insights
- personalized_learning_paths
- sentiment_analysis
- predictive_maintenance
- + Sample chatbot knowledge & ML models

---

## ✅ Verification

After installation, verify tables were created:

```sql
-- Check total tables
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'school_management_system';

-- Should show 100+ tables

-- Check specific Pro tables
SHOW TABLES LIKE 'timetable%';
SHOW TABLES LIKE 'exam%';
SHOW TABLES LIKE 'course%';
SHOW TABLES LIKE 'vehicle%';
SHOW TABLES LIKE 'biometric%';
```

---

## 🎯 Next Steps

After installation:

1. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Login**
   - URL: `http://localhost:5173/login`
   - Email: `admin@school.com`
   - Password: `password`

3. **Access Pro Features**
   - Look for menu items with purple "Pro" badges
   - All 9 Pro modules are now accessible!

---

## 🐛 Troubleshooting

### **Error: Table already exists**
- **Solution:** Tables are created with `IF NOT EXISTS`, so this is safe to ignore
- Or drop existing tables first (⚠️ **Warning: This deletes data!**)

### **Error: Cannot find file**
- **Solution:** Make sure file paths use forward slashes: `d:/xampp/htdocs/McSMS/...`
- Check that all migration files exist in the `database/migrations/` folder

### **Error: Foreign key constraint fails**
- **Solution:** Make sure the core system tables exist first
- Run migrations in the order specified

### **Installation seems stuck**
- **Solution:** Large migrations can take time
- Wait at least 1-2 minutes before canceling
- Check phpMyAdmin's process list

---

## 📞 Support

If you encounter issues:

1. Check the error message carefully
2. Verify all migration files exist
3. Ensure MySQL is running
4. Check database permissions
5. Review the individual migration files

---

## 🎉 Success!

Once installed, you'll have:
- ✅ 100+ new database tables
- ✅ All Pro features enabled
- ✅ Sample data loaded
- ✅ Ready for production use

**Enjoy your complete McSMS Pro system!** 🚀
