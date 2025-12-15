-- School Management System Database Schema
-- Database: school_management_system

CREATE DATABASE IF NOT EXISTS school_management_system;
USE school_management_system;

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS optional_services_selected;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS optional_services;
DROP TABLE IF EXISTS fee_types;
DROP TABLE IF EXISTS homework_submissions;
DROP TABLE IF EXISTS homework;
DROP TABLE IF EXISTS results;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS class_subjects;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS sections;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS academic_terms;
DROP TABLE IF EXISTS academic_sessions;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS admissions;
DROP TABLE IF EXISTS children;
DROP TABLE IF EXISTS parents;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ========== USERS & AUTHENTICATION ==========

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    user_type ENUM('admin','parent','teacher','finance','admissions') NOT NULL,
    status ENUM('active','inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_user_type (user_type)
);

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- ========== PARENT & STUDENT ==========

CREATE TABLE parents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address TEXT,
    occupation VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE,
    INDEX idx_parent (parent_id)
);

-- ========== ADMISSIONS ==========

CREATE TABLE admissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    preferred_class_id INT NOT NULL,
    status ENUM('pending','approved','rejected') DEFAULT 'pending',
    remarks TEXT,
    documents JSON,
    processed_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_child (child_id)
);

-- ========== STUDENTS ==========

CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    child_id INT NOT NULL,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    class_id INT NOT NULL,
    section_id INT NOT NULL,
    enrollment_date DATE NOT NULL,
    status ENUM('active','graduated','left') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_class (class_id),
    INDEX idx_status (status)
);

-- ========== ACADEMIC STRUCTURE ==========

CREATE TABLE academic_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_name VARCHAR(20) NOT NULL,
    is_active TINYINT(1) DEFAULT 0,
    INDEX idx_active (is_active)
);

CREATE TABLE academic_terms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    term_name VARCHAR(20) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active TINYINT(1) DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES academic_sessions(id) ON DELETE CASCADE,
    INDEX idx_active (is_active)
);

CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    level ENUM('creche','nursery','kg','grade') NOT NULL,
    INDEX idx_level (level)
);

CREATE TABLE sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    section_name VARCHAR(50) NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- ========== SUBJECTS ==========

CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_name VARCHAR(150) NOT NULL,
    level ENUM('creche','nursery','kg','grade') NOT NULL,
    INDEX idx_level (level)
);

CREATE TABLE class_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- ========== ATTENDANCE ==========

CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present','absent','late') NOT NULL,
    marked_by INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_date (student_id, date),
    INDEX idx_date (date)
);

-- ========== RESULTS ==========

CREATE TABLE results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    term_id INT NOT NULL,
    ca_score DECIMAL(5,2) DEFAULT 0,
    exam_score DECIMAL(5,2) DEFAULT 0,
    total DECIMAL(5,2) DEFAULT 0,
    grade VARCHAR(2),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES academic_terms(id) ON DELETE CASCADE,
    INDEX idx_student_term (student_id, term_id)
);

-- ========== HOMEWORK ==========

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
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_class (class_id),
    INDEX idx_due_date (due_date)
);

CREATE TABLE homework_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    homework_id INT NOT NULL,
    student_id INT NOT NULL,
    file VARCHAR(255),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_homework (homework_id),
    INDEX idx_student (student_id)
);

-- ========== FEES & FINANCE ==========

CREATE TABLE fee_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fee_name VARCHAR(150) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    class_id INT NOT NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE optional_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(150) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT
);

CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    term_id INT NOT NULL,
    total_amount DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) DEFAULT 0,
    status ENUM('unpaid','partial','paid') DEFAULT 'unpaid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES academic_terms(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_status (status)
);

CREATE TABLE invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    fee_type_id INT NULL,
    optional_service_id INT NULL,
    label VARCHAR(150),
    amount DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (fee_type_id) REFERENCES fee_types(id) ON DELETE SET NULL,
    FOREIGN KEY (optional_service_id) REFERENCES optional_services(id) ON DELETE SET NULL
);

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    student_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash','bank','online') NOT NULL,
    reference_no VARCHAR(255),
    received_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_invoice (invoice_id),
    INDEX idx_student (student_id)
);

CREATE TABLE optional_services_selected (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    service_id INT NOT NULL,
    term_id INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES optional_services(id) ON DELETE CASCADE,
    FOREIGN KEY (term_id) REFERENCES academic_terms(id) ON DELETE CASCADE
);

-- ========== NOTIFICATIONS & MESSAGING ==========

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255),
    message TEXT,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read)
);

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id)
);

-- ========== SYSTEM SETTINGS & LOGS ==========

CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(100) NOT NULL UNIQUE,
    value TEXT
);

CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_created (created_at)
);

-- ========== SEED DATA ==========

-- Note: Admin user will be created by setup.php with proper password hashing

-- Insert default roles
INSERT INTO roles (role_name) VALUES
('Super Admin'),
('Admin'),
('Teacher'),
('Parent'),
('Finance Staff'),
('Admissions Officer');

-- Insert sample academic session
INSERT INTO academic_sessions (session_name, is_active) VALUES
('2024/2025', 1);

-- Insert sample terms
INSERT INTO academic_terms (session_id, term_name, start_date, end_date, is_active) VALUES
(1, 'First Term', '2024-09-01', '2024-12-15', 1),
(1, 'Second Term', '2025-01-10', '2025-04-15', 0),
(1, 'Third Term', '2025-04-25', '2025-07-20', 0);

-- Insert sample classes
INSERT INTO classes (class_name, level) VALUES
('Creche', 'creche'),
('Nursery 1', 'nursery'),
('Nursery 2', 'nursery'),
('KG 1', 'kg'),
('KG 2', 'kg'),
('Grade 1', 'grade'),
('Grade 2', 'grade'),
('Grade 3', 'grade'),
('Grade 4', 'grade'),
('Grade 5', 'grade');

-- Insert sample sections
INSERT INTO sections (class_id, section_name) VALUES
(1, 'Section A'), (2, 'Section A'), (3, 'Section A'),
(4, 'Section A'), (5, 'Section A'), (6, 'Section A'),
(7, 'Section A'), (8, 'Section A'), (9, 'Section A'), (10, 'Section A');

-- Insert sample subjects
INSERT INTO subjects (subject_name, level) VALUES
('English Language', 'grade'),
('Mathematics', 'grade'),
('Science', 'grade'),
('Social Studies', 'grade'),
('Physical Education', 'grade'),
('Arts & Crafts', 'grade'),
('Computer Studies', 'grade');

-- Insert sample optional services
INSERT INTO optional_services (service_name, amount, description) VALUES
('School Transport', 150.00, 'Daily transportation to and from school'),
('School Lunch', 100.00, 'Nutritious daily lunch meal'),
('After School Care', 120.00, 'Supervised care after school hours'),
('Sports Activities', 80.00, 'Extra-curricular sports programs');

-- Insert default system settings
INSERT INTO settings (key_name, value) VALUES
('school_name', 'School Management System'),
('school_email', 'info@school.com'),
('school_phone', '+1234567890'),
('school_address', '123 Education Street, Learning City'),
('currency_symbol', '$'),
('academic_year', '2024/2025');

-- Re-enable foreign key checks at the end
SET FOREIGN_KEY_CHECKS = 1;
