-- Students Table for School Management System
-- Run this SQL in your database

CREATE TABLE IF NOT EXISTS `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` varchar(50) NOT NULL UNIQUE,
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
  `class_id` int(11) DEFAULT NULL,
  `admission_date` date NOT NULL,
  `admission_number` varchar(50) DEFAULT NULL,
  `previous_school` varchar(200) DEFAULT NULL,
  `status` enum('active','inactive','graduated','transferred','expelled') DEFAULT 'active',
  
  -- Guardian/Parent Information
  `parent_id` int(11) DEFAULT NULL,
  `guardian_name` varchar(200) DEFAULT NULL,
  `guardian_phone` varchar(20) DEFAULT NULL,
  `guardian_email` varchar(100) DEFAULT NULL,
  `guardian_relationship` varchar(50) DEFAULT NULL,
  `guardian_address` text DEFAULT NULL,
  
  -- Emergency Contact
  `emergency_contact_name` varchar(200) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `emergency_contact_relationship` varchar(50) DEFAULT NULL,
  
  -- Medical Information
  `medical_conditions` text DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `medications` text DEFAULT NULL,
  
  -- Additional Information
  `photo` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int(11) DEFAULT NULL,
  
  PRIMARY KEY (`id`),
  KEY `class_id` (`class_id`),
  KEY `parent_id` (`parent_id`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add some sample students for testing
INSERT INTO `students` (`student_id`, `first_name`, `last_name`, `date_of_birth`, `gender`, `email`, `phone`, `address`, `admission_date`, `status`, `guardian_name`, `guardian_phone`, `guardian_email`) VALUES
('STU2024001', 'Kwame', 'Mensah', '2010-05-15', 'male', 'kwame.mensah@student.com', '0244123456', '123 Accra Road, Kumasi', '2024-01-10', 'active', 'Mr. John Mensah', '0244111222', 'john.mensah@gmail.com'),
('STU2024002', 'Ama', 'Asante', '2011-08-22', 'female', 'ama.asante@student.com', '0244234567', '456 Kumasi Street, Accra', '2024-01-10', 'active', 'Mrs. Grace Asante', '0244222333', 'grace.asante@gmail.com'),
('STU2024003', 'Kofi', 'Boateng', '2010-03-10', 'male', 'kofi.boateng@student.com', '0244345678', '789 Tema Avenue, Takoradi', '2024-01-15', 'active', 'Mr. Peter Boateng', '0244333444', 'peter.boateng@gmail.com'),
('STU2024004', 'Abena', 'Owusu', '2011-11-30', 'female', 'abena.owusu@student.com', '0244456789', '321 Cape Coast Road, Kumasi', '2024-01-15', 'active', 'Mrs. Mary Owusu', '0244444555', 'mary.owusu@gmail.com'),
('STU2024005', 'Yaw', 'Adjei', '2010-07-18', 'male', 'yaw.adjei@student.com', '0244567890', '654 Sunyani Lane, Accra', '2024-01-20', 'active', 'Mr. Samuel Adjei', '0244555666', 'samuel.adjei@gmail.com');
