-- ============================================
-- Sample Data for Pro Features
-- Run this to populate Pro features with test data
-- ============================================

-- TIMETABLE: Create a sample template
INSERT INTO timetable_templates (template_name, academic_year, term_id, status, created_by) 
VALUES ('Term 1 Timetable 2025', '2025', 1, 'active', 1)
ON DUPLICATE KEY UPDATE template_name = VALUES(template_name);

-- EXAMS: Create sample exams
INSERT INTO exams (exam_name, exam_type_id, academic_year, term_id, start_date, end_date, status) 
VALUES 
('Mid-Term Exam', 1, '2025', 1, '2025-02-01', '2025-02-15', 'scheduled'),
('End of Term Exam', 2, '2025', 1, '2025-04-01', '2025-04-15', 'scheduled')
ON DUPLICATE KEY UPDATE exam_name = VALUES(exam_name);

-- LMS: Create sample courses
INSERT INTO courses (course_code, course_name, description, category_id, subject_id, class_id, teacher_id, status) 
SELECT 'MATH101', 'Mathematics Grade 10', 'Introduction to advanced mathematics', 1, s.id, c.id, t.id, 'published'
FROM subjects s, classes c, teachers t
WHERE s.subject_name LIKE '%Math%' AND c.class_name LIKE '%10%' AND t.id = 1
LIMIT 1
ON DUPLICATE KEY UPDATE course_code = VALUES(course_code);

INSERT INTO courses (course_code, course_name, description, category_id, subject_id, class_id, teacher_id, status) 
SELECT 'ENG101', 'English Grade 10', 'English Language and Literature', 2, s.id, c.id, t.id, 'published'
FROM subjects s, classes c, teachers t
WHERE s.subject_name LIKE '%English%' AND c.class_name LIKE '%10%' AND t.id = 1
LIMIT 1
ON DUPLICATE KEY UPDATE course_code = VALUES(course_code);

-- TRANSPORT: Already has sample data from migration

-- HR & PAYROLL: Create sample employees
INSERT INTO employees (employee_number, first_name, last_name, email, phone, department_id, designation_id, employment_type, join_date, basic_salary, status)
SELECT 'EMP001', 'John', 'Doe', 'john.doe@school.com', '+233241234567', d.id, des.id, 'full_time', '2024-01-01', 3000.00, 'active'
FROM departments d, designations des
WHERE d.department_name = 'Administration' AND des.designation_name = 'Administrator'
LIMIT 1
ON DUPLICATE KEY UPDATE employee_number = VALUES(employee_number);

INSERT INTO employees (employee_number, first_name, last_name, email, phone, department_id, designation_id, employment_type, join_date, basic_salary, status)
SELECT 'EMP002', 'Jane', 'Smith', 'jane.smith@school.com', '+233241234568', d.id, des.id, 'full_time', '2024-01-01', 2500.00, 'active'
FROM departments d, designations des
WHERE d.department_name = 'Academics' AND des.designation_name = 'Senior Teacher'
LIMIT 1
ON DUPLICATE KEY UPDATE employee_number = VALUES(employee_number);

-- BIOMETRIC: Already has sample devices from migration

-- MULTI-SCHOOL: Already has sample branches from migration

-- AI: Add more chatbot knowledge
INSERT INTO chatbot_knowledge_base (category, question, answer, keywords, status) VALUES
('General', 'What time does school start?', 'School starts at 8:00 AM. Please ensure students arrive by 7:45 AM for assembly.', 'time,start,opening,hours', 'active'),
('General', 'How can I contact the school?', 'You can contact us at +233XXXXXXXXX or email admin@school.edu.gh. Our office hours are 8 AM to 5 PM, Monday to Friday.', 'contact,phone,email,reach', 'active'),
('Academics', 'How do I check my child''s grades?', 'You can check grades by logging into the parent portal or mobile app. Go to your child''s profile and click on ''Grades'' or ''Report Card''.', 'grades,marks,scores,results,check', 'active')
ON DUPLICATE KEY UPDATE question = VALUES(question);

SELECT 'Sample data inserted successfully!' as status;
SELECT 'You can now test all Pro features with real data!' as message;
