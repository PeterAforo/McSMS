-- Finance Module v2 - Complete Fee Structure System
-- Fee Groups, Fee Items, Fee Rules, Installment Plans, Invoices, Payments

SET FOREIGN_KEY_CHECKS=0;

-- ============================================
-- 1. FEE GROUPS
-- ============================================
DROP TABLE IF EXISTS `fee_groups`;
CREATE TABLE `fee_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_name` varchar(100) NOT NULL,
  `group_code` varchar(20) NOT NULL UNIQUE,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample fee groups
INSERT INTO `fee_groups` (`group_name`, `group_code`, `description`, `status`) VALUES
('Tuition Fees', 'TUITION', 'Core tuition and academic fees', 'active'),
('ICT Fees', 'ICT', 'Information and Communication Technology fees', 'active'),
('PTA Fees', 'PTA', 'Parent-Teacher Association fees', 'active'),
('Activities', 'ACTIVITIES', 'Extra-curricular activities fees', 'active'),
('Transport', 'TRANSPORT', 'School transport and bus fees', 'active'),
('Meals', 'MEALS', 'Cafeteria and meal plan fees', 'active'),
('Books & Materials', 'BOOKS', 'Textbooks and learning materials', 'active'),
('Medical', 'MEDICAL', 'Medical and health services', 'active'),
('Uniform', 'UNIFORM', 'School uniform and sports wear', 'active'),
('Examination', 'EXAM', 'Examination and assessment fees', 'active');

-- ============================================
-- 2. FEE ITEMS
-- ============================================
DROP TABLE IF EXISTS `fee_items`;
CREATE TABLE `fee_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fee_group_id` int(11) NOT NULL,
  `item_name` varchar(200) NOT NULL,
  `item_code` varchar(50) NOT NULL UNIQUE,
  `description` text DEFAULT NULL,
  `frequency` enum('term','session','monthly','one-time') DEFAULT 'term',
  `is_optional` tinyint(1) DEFAULT 0,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fee_group_id` (`fee_group_id`),
  KEY `is_optional` (`is_optional`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample fee items
INSERT INTO `fee_items` (`fee_group_id`, `item_name`, `item_code`, `description`, `frequency`, `is_optional`, `status`) VALUES
-- Tuition
(1, 'Creche Tuition', 'TUITION-CRECHE', 'Termly tuition for Creche', 'term', 0, 'active'),
(1, 'Nursery Tuition', 'TUITION-NURSERY', 'Termly tuition for Nursery', 'term', 0, 'active'),
(1, 'KG Tuition', 'TUITION-KG', 'Termly tuition for KG', 'term', 0, 'active'),
(1, 'Primary Tuition', 'TUITION-PRIMARY', 'Termly tuition for Primary', 'term', 0, 'active'),
(1, 'JHS Tuition', 'TUITION-JHS', 'Termly tuition for JHS', 'term', 0, 'active'),
-- ICT
(2, 'ICT Fee', 'ICT-TERM', 'Computer lab and ICT resources', 'term', 0, 'active'),
(2, 'Robotics Club', 'ICT-ROBOTICS', 'Optional robotics club', 'term', 1, 'active'),
-- PTA
(3, 'PTA Levy', 'PTA-LEVY', 'PTA membership and activities', 'term', 0, 'active'),
-- Activities
(4, 'Sports Fee', 'ACT-SPORTS', 'Sports and physical education', 'term', 0, 'active'),
(4, 'Music Lessons', 'ACT-MUSIC', 'Optional music lessons', 'term', 1, 'active'),
(4, 'Art Classes', 'ACT-ART', 'Optional art classes', 'term', 1, 'active'),
-- Transport
(5, 'Bus Service', 'TRANS-BUS', 'School bus transportation', 'term', 1, 'active'),
-- Meals
(6, 'Lunch Plan', 'MEAL-LUNCH', 'Daily lunch meal plan', 'term', 1, 'active'),
-- Books
(7, 'Textbooks', 'BOOK-TEXT', 'Required textbooks', 'session', 0, 'active'),
(7, 'Exercise Books', 'BOOK-EXERCISE', 'Exercise books and stationery', 'term', 0, 'active'),
-- Medical
(8, 'Medical Insurance', 'MED-INSURANCE', 'Student medical insurance', 'session', 0, 'active'),
-- Uniform
(9, 'School Uniform', 'UNI-SCHOOL', 'Official school uniform', 'one-time', 1, 'active'),
(9, 'Sports Wear', 'UNI-SPORTS', 'PE and sports uniform', 'one-time', 1, 'active'),
-- Exam
(10, 'Examination Fee', 'EXAM-TERM', 'End of term examinations', 'term', 0, 'active');

-- ============================================
-- 3. FEE ITEM RULES (Class + Term Based Pricing)
-- ============================================
DROP TABLE IF EXISTS `fee_item_rules`;
CREATE TABLE `fee_item_rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fee_item_id` int(11) NOT NULL,
  `class_id` int(11) DEFAULT NULL,
  `term_id` int(11) DEFAULT NULL,
  `level` enum('creche','nursery','kg','primary','jhs','shs') DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'GHS',
  `academic_year` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fee_item_id` (`fee_item_id`),
  KEY `class_id` (`class_id`),
  KEY `term_id` (`term_id`),
  KEY `level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample fee rules (amounts in GHS)
INSERT INTO `fee_item_rules` (`fee_item_id`, `level`, `amount`, `academic_year`, `is_active`) VALUES
-- Tuition by level
(1, 'creche', 800.00, '2024/2025', 1),
(2, 'nursery', 900.00, '2024/2025', 1),
(3, 'kg', 1000.00, '2024/2025', 1),
(4, 'primary', 1200.00, '2024/2025', 1),
(5, 'jhs', 1500.00, '2024/2025', 1),
-- ICT
(6, NULL, 150.00, '2024/2025', 1),
(7, NULL, 200.00, '2024/2025', 1),
-- PTA
(8, NULL, 100.00, '2024/2025', 1),
-- Activities
(9, NULL, 80.00, '2024/2025', 1),
(10, NULL, 150.00, '2024/2025', 1),
(11, NULL, 150.00, '2024/2025', 1),
-- Transport
(12, NULL, 300.00, '2024/2025', 1),
-- Meals
(13, NULL, 400.00, '2024/2025', 1),
-- Books
(14, NULL, 250.00, '2024/2025', 1),
(15, NULL, 50.00, '2024/2025', 1),
-- Medical
(16, NULL, 200.00, '2024/2025', 1),
-- Uniform
(17, NULL, 180.00, '2024/2025', 1),
(18, NULL, 120.00, '2024/2025', 1),
-- Exam
(19, NULL, 100.00, '2024/2025', 1);

-- ============================================
-- 4. INSTALLMENT PLANS
-- ============================================
DROP TABLE IF EXISTS `installment_plans`;
CREATE TABLE `installment_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plan_name` varchar(100) NOT NULL,
  `plan_code` varchar(20) NOT NULL UNIQUE,
  `description` text DEFAULT NULL,
  `installments` text NOT NULL COMMENT 'JSON: [{percentage: 100, due_days: 0}]',
  `is_default` tinyint(1) DEFAULT 0,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample installment plans
INSERT INTO `installment_plans` (`plan_name`, `plan_code`, `description`, `installments`, `is_default`, `status`) VALUES
('Full Payment', 'FULL', 'Pay 100% upfront', '[{"percentage": 100, "due_days": 0, "label": "Full Payment"}]', 1, 'active'),
('60/30/10 Plan', '60-30-10', 'Pay 60% upfront, 30% mid-term, 10% end', '[{"percentage": 60, "due_days": 0, "label": "First Payment"}, {"percentage": 30, "due_days": 45, "label": "Second Payment"}, {"percentage": 10, "due_days": 75, "label": "Final Payment"}]', 0, 'active'),
('50/25/25 Plan', '50-25-25', 'Pay 50% upfront, 25% twice', '[{"percentage": 50, "due_days": 0, "label": "First Payment"}, {"percentage": 25, "due_days": 40, "label": "Second Payment"}, {"percentage": 25, "due_days": 80, "label": "Final Payment"}]', 0, 'active'),
('Three Equal Parts', '33-33-34', 'Pay in 3 equal installments', '[{"percentage": 33, "due_days": 0, "label": "First Payment"}, {"percentage": 33, "due_days": 30, "label": "Second Payment"}, {"percentage": 34, "due_days": 60, "label": "Final Payment"}]', 0, 'active');

-- ============================================
-- 5. INVOICES
-- ============================================
DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) NOT NULL UNIQUE,
  `student_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `term_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `academic_year` varchar(20) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `paid_amount` decimal(10,2) DEFAULT 0.00,
  `balance` decimal(10,2) NOT NULL,
  `installment_plan_id` int(11) DEFAULT NULL,
  `status` enum('draft','pending_finance','approved','rejected','partial','paid','overdue','cancelled') DEFAULT 'draft',
  `due_date` date DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `parent_id` (`parent_id`),
  KEY `term_id` (`term_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 6. INVOICE ITEMS
-- ============================================
DROP TABLE IF EXISTS `invoice_items`;
CREATE TABLE `invoice_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `fee_item_id` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `is_optional` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `fee_item_id` (`fee_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 7. PAYMENTS
-- ============================================
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_number` varchar(50) NOT NULL UNIQUE,
  `invoice_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `parent_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','bank_transfer','mobile_money','cheque','card','other') DEFAULT 'cash',
  `payment_date` date NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `received_by` int(11) DEFAULT NULL,
  `status` enum('pending','completed','failed','refunded') DEFAULT 'completed',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `student_id` (`student_id`),
  KEY `parent_id` (`parent_id`),
  KEY `payment_date` (`payment_date`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 8. PAYMENT INSTALLMENTS (Tracking)
-- ============================================
DROP TABLE IF EXISTS `payment_installments`;
CREATE TABLE `payment_installments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `installment_number` int(11) NOT NULL,
  `amount_due` decimal(10,2) NOT NULL,
  `amount_paid` decimal(10,2) DEFAULT 0.00,
  `due_date` date NOT NULL,
  `status` enum('pending','partial','paid','overdue') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 9. ENROLLMENT (Links students to terms)
-- ============================================
DROP TABLE IF EXISTS `enrollments`;
CREATE TABLE `enrollments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `class_id` int(11) NOT NULL,
  `term_id` int(11) NOT NULL,
  `academic_year` varchar(20) NOT NULL,
  `enrollment_date` date NOT NULL,
  `status` enum('pending','active','completed','withdrawn') DEFAULT 'pending',
  `invoice_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_term_unique` (`student_id`, `term_id`),
  KEY `student_id` (`student_id`),
  KEY `class_id` (`class_id`),
  KEY `term_id` (`term_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS=1;

-- Sample data summary:
-- 10 Fee Groups
-- 19 Fee Items (mandatory + optional)
-- 19 Fee Rules with pricing
-- 4 Installment Plans
-- Ready for invoice generation!
