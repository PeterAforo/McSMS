-- ============================================
-- Student Discounts Table
-- Supports one-time and permanent discounts
-- Common use: Multi-child discount, staff discount, scholarship
-- ============================================

CREATE TABLE IF NOT EXISTS `student_discounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `discount_name` varchar(100) NOT NULL COMMENT 'e.g., Sibling Discount, Staff Child, Scholarship',
  `discount_type` enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
  `discount_value` decimal(10,2) NOT NULL COMMENT 'Percentage (0-100) or fixed amount',
  `applies_to` enum('tuition','all_fees','specific_fee') DEFAULT 'tuition' COMMENT 'What fees this discount applies to',
  `fee_rule_id` int(11) DEFAULT NULL COMMENT 'If applies_to=specific_fee, which fee rule',
  `duration` enum('one_time','term','academic_year','permanent') NOT NULL DEFAULT 'permanent',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL COMMENT 'NULL for permanent discounts',
  `max_discount_amount` decimal(10,2) DEFAULT NULL COMMENT 'Cap on discount amount',
  `reason` text DEFAULT NULL COMMENT 'Reason for discount (e.g., 2nd child, 3rd child)',
  `approved_by` int(11) DEFAULT NULL COMMENT 'User who approved the discount',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_duration` (`duration`),
  KEY `idx_discount_type` (`discount_type`),
  CONSTRAINT `fk_discount_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_discount_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Discount Usage Log
-- Tracks when discounts are applied to invoices
-- ============================================

CREATE TABLE IF NOT EXISTS `discount_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `discount_id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `original_amount` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `final_amount` decimal(10,2) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_discount_id` (`discount_id`),
  KEY `idx_invoice_id` (`invoice_id`),
  CONSTRAINT `fk_application_discount` FOREIGN KEY (`discount_id`) REFERENCES `student_discounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Sibling Groups (for automatic sibling discounts)
-- Links students who are siblings
-- ============================================

CREATE TABLE IF NOT EXISTS `sibling_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_name` varchar(100) DEFAULT NULL COMMENT 'Family name or identifier',
  `parent_guardian_id` int(11) DEFAULT NULL COMMENT 'Primary parent/guardian',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_parent_guardian` (`parent_guardian_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `sibling_group_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sibling_group_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `birth_order` int(11) DEFAULT 1 COMMENT '1=eldest, 2=second child, etc.',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_sibling_unique` (`student_id`),
  KEY `idx_sibling_group_id` (`sibling_group_id`),
  CONSTRAINT `fk_sibling_member_group` FOREIGN KEY (`sibling_group_id`) REFERENCES `sibling_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sibling_member_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- Discount Rules (for automatic discount application)
-- e.g., 2nd child gets 10%, 3rd child gets 15%
-- ============================================

CREATE TABLE IF NOT EXISTS `discount_rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rule_name` varchar(100) NOT NULL,
  `rule_type` enum('sibling','staff_child','scholarship','early_payment','other') NOT NULL,
  `condition_type` varchar(50) DEFAULT NULL COMMENT 'e.g., sibling_count, staff_role',
  `condition_value` varchar(100) DEFAULT NULL COMMENT 'e.g., 2, 3 for sibling count',
  `discount_type` enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
  `discount_value` decimal(10,2) NOT NULL,
  `applies_to` enum('tuition','all_fees','specific_fee') DEFAULT 'tuition',
  `is_active` tinyint(1) DEFAULT 1,
  `priority` int(11) DEFAULT 0 COMMENT 'Higher priority rules applied first',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rule_type` (`rule_type`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default sibling discount rules
INSERT INTO `discount_rules` (`rule_name`, `rule_type`, `condition_type`, `condition_value`, `discount_type`, `discount_value`, `applies_to`, `priority`) VALUES
('Second Child Discount', 'sibling', 'sibling_count', '2', 'percentage', 10.00, 'tuition', 1),
('Third Child Discount', 'sibling', 'sibling_count', '3', 'percentage', 15.00, 'tuition', 2),
('Fourth+ Child Discount', 'sibling', 'sibling_count', '4', 'percentage', 20.00, 'tuition', 3)
ON DUPLICATE KEY UPDATE rule_name = rule_name;
