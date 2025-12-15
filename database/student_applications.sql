-- Student Applications Table
-- For parent-submitted applications pending admin approval

CREATE TABLE IF NOT EXISTS `student_applications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `application_number` varchar(50) NOT NULL UNIQUE,
  `parent_id` int(11) NOT NULL,
  
  -- Student Information
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `other_names` varchar(100) DEFAULT NULL,
  `date_of_birth` date NOT NULL,
  `gender` enum('male','female') NOT NULL,
  `blood_group` varchar(10) DEFAULT NULL,
  `nationality` varchar(50) DEFAULT 'Ghanaian',
  `religion` varchar(50) DEFAULT NULL,
  
  -- Contact Information
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  
  -- Academic Information
  `previous_school` varchar(200) DEFAULT NULL,
  `class_applying_for` varchar(50) DEFAULT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  
  -- Guardian/Parent Information (from parent account)
  `guardian_name` varchar(200) NOT NULL,
  `guardian_phone` varchar(20) NOT NULL,
  `guardian_email` varchar(100) NOT NULL,
  `guardian_relationship` varchar(50) DEFAULT NULL,
  `guardian_address` text DEFAULT NULL,
  `guardian_occupation` varchar(100) DEFAULT NULL,
  
  -- Emergency Contact
  `emergency_contact_name` varchar(200) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `emergency_contact_relationship` varchar(50) DEFAULT NULL,
  
  -- Medical Information
  `medical_conditions` text DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `medications` text DEFAULT NULL,
  
  -- Documents
  `photo` varchar(255) DEFAULT NULL,
  `birth_certificate` varchar(255) DEFAULT NULL,
  `previous_report_card` varchar(255) DEFAULT NULL,
  
  -- Application Status
  `status` enum('pending','approved','rejected','withdrawn') DEFAULT 'pending',
  `application_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_date` timestamp NULL DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  
  -- If approved, link to created student record
  `student_id` int(11) DEFAULT NULL,
  
  PRIMARY KEY (`id`),
  KEY `parent_id` (`parent_id`),
  KEY `status` (`status`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add sample pending application
INSERT INTO `student_applications` (
  `application_number`, `parent_id`, `first_name`, `last_name`, `date_of_birth`, `gender`,
  `email`, `phone`, `address`, `previous_school`, `class_applying_for`, `academic_year`,
  `guardian_name`, `guardian_phone`, `guardian_email`, `guardian_relationship`,
  `status`, `application_date`
) VALUES (
  'APP2024001', 1, 'Emmanuel', 'Osei', '2011-09-15', 'male',
  'emmanuel.osei@example.com', '0244888999', '789 New Street, Accra',
  'ABC Primary School', 'Form 1', '2024/2025',
  'Mrs. Sarah Osei', '0244777888', 'sarah.osei@gmail.com', 'Mother',
  'pending', NOW()
);
