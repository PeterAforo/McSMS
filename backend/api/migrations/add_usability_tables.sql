-- Add tables for fee structure usability improvements
-- Migration date: 2025-04-30

-- Table for tracking wizard setup completion
CREATE TABLE IF NOT EXISTS fee_structure_setup_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT,
  step_completed INT DEFAULT 0,
  setup_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_complete TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school (school_id),
  INDEX idx_complete (is_complete)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for fee structure snapshots (for copy from previous year)
CREATE TABLE IF NOT EXISTS fee_structure_snapshots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id INT,
  academic_year VARCHAR(20) NOT NULL,
  snapshot_data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_school (school_id),
  INDEX idx_year (academic_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for fee structure templates
CREATE TABLE IF NOT EXISTS fee_structure_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  school_id INT,
  template_data JSON NOT NULL,
  is_public TINYINT(1) DEFAULT 0,
  category ENUM('primary', 'secondary', 'creche', 'custom') DEFAULT 'custom',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_school (school_id),
  INDEX idx_category (category),
  INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for fee structure suggestions (smart defaults)
CREATE TABLE IF NOT EXISTS fee_structure_suggestions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  field_name VARCHAR(50) NOT NULL,
  suggested_value VARCHAR(255) NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.50,
  source ENUM('historical', 'industry', 'manual') DEFAULT 'industry',
  usage_count INT DEFAULT 0,
  last_used TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_field (field_name),
  INDEX idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert industry standard suggestions
INSERT INTO fee_structure_suggestions (field_name, suggested_value, confidence_score, source) VALUES
('frequency', 'term', 0.90, 'industry'),
('frequency', 'monthly', 0.70, 'industry'),
('frequency', 'session', 0.60, 'industry'),
('late_fee_type', 'percentage', 0.80, 'industry'),
('currency', 'GHS', 0.95, 'industry'),
('tax_rate', '0', 0.90, 'industry');

-- Insert default industry-standard templates
INSERT INTO fee_structure_templates (name, description, template_data, is_public, category) VALUES
('Primary School Standard', 'Complete fee structure for primary school with tuition, books, and activities', 
'{"groups":[{"id":1,"group_name":"Tuition Fees","group_code":"TUITION","description":"Core tuition fees","status":"active"},{"id":2,"group_name":"Books & Materials","group_code":"BOOKS","description":"Textbooks and learning materials","status":"active"},{"id":3,"group_name":"Activities","group_code":"ACTIVITIES","description":"Extracurricular activities","status":"active"}],"items":[{"id":1,"fee_group_id":1,"item_name":"Term 1 Tuition","item_code":"T1-TUITION","description":"Tuition for term 1","frequency":"term","is_optional":0,"status":"active"},{"id":2,"fee_group_id":1,"item_name":"Term 2 Tuition","item_code":"T2-TUITION","description":"Tuition for term 2","frequency":"term","is_optional":0,"status":"active"},{"id":3,"fee_group_id":1,"item_name":"Term 3 Tuition","item_code":"T3-TUITION","description":"Tuition for term 3","frequency":"term","is_optional":0,"status":"active"},{"id":4,"fee_group_id":2,"item_name":"Textbooks Set","item_code":"BOOKS-SET","description":"Complete textbook set","frequency":"session","is_optional":0,"status":"active"},{"id":5,"fee_group_id":2,"item_name":"Exercise Books","item_code":"EXERCISE","description":"Exercise books pack","frequency":"term","is_optional":0,"status":"active"},{"id":6,"fee_group_id":3,"item_name":"Sports Fee","item_code":"SPORTS","description":"Sports and PE activities","frequency":"term","is_optional":1,"status":"active"},{"id":7,"fee_group_id":3,"item_name":"Club Activities","item_code":"CLUBS","description":"After-school clubs","frequency":"term","is_optional":1,"status":"active"}],"rules":[]}', 
1, 'primary'),

('Secondary School Standard', 'Complete fee structure for secondary school with tuition, science lab, and exam fees', 
'{"groups":[{"id":1,"group_name":"Tuition Fees","group_code":"TUITION","description":"Core tuition fees","status":"active"},{"id":2,"group_name":"Science & Lab","group_code":"SCIENCE","description":"Science laboratory fees","status":"active"},{"id":3,"group_name":"Examination","group_code":"EXAMS","description":"Examination fees","status":"active"},{"id":4,"group_name":"Boarding","group_code":"BOARDING","description":"Boarding fees","status":"active"}],"items":[{"id":1,"fee_group_id":1,"item_name":"Term 1 Tuition","item_code":"T1-TUITION","description":"Tuition for term 1","frequency":"term","is_optional":0,"status":"active"},{"id":2,"fee_group_id":1,"item_name":"Term 2 Tuition","item_code":"T2-TUITION","description":"Tuition for term 2","frequency":"term","is_optional":0,"status":"active"},{"id":3,"fee_group_id":1,"item_name":"Term 3 Tuition","item_code":"T3-TUITION","description":"Tuition for term 3","frequency":"term","is_optional":0,"status":"active"},{"id":4,"fee_group_id":2,"item_name":"Lab Fee","item_code":"LAB-FEE","description":"Science laboratory fee","frequency":"term","is_optional":0,"status":"active"},{"id":5,"fee_group_id":2,"item_name":"Practical Materials","item_code":"PRACTICAL","description":"Science practical materials","frequency":"term","is_optional":0,"status":"active"},{"id":6,"fee_group_id":3,"item_name":"WASSCE Fee","item_code":"WASSCE","description":"WASSCE examination fee","frequency":"session","is_optional":0,"status":"active"},{"id":7,"fee_group_id":3,"item_name":"Internal Exams","item_code":"INTERNAL","description":"Internal examination fees","frequency":"term","is_optional":0,"status":"active"},{"id":8,"fee_group_id":4,"item_name":"Boarding Fee","item_code":"BOARDING","description":"Full boarding fee","frequency":"term","is_optional":1,"status":"active"}],"rules":[]}', 
1, 'secondary'),

('Creche/Nursery Standard', 'Complete fee structure for creche and nursery with care, meals, and learning materials', 
'{"groups":[{"id":1,"group_name":"Care & Supervision","group_code":"CARE","description":"Daily care and supervision","status":"active"},{"id":2,"group_name":"Meals","group_code":"MEALS","description":"Nutrition and meals","status":"active"},{"id":3,"group_name":"Learning Materials","group_code":"MATERIALS","description":"Educational materials","status":"active"}],"items":[{"id":1,"fee_group_id":1,"item_name":"Monthly Care Fee","item_code":"CARE-MONTH","description":"Monthly care fee","frequency":"monthly","is_optional":0,"status":"active"},{"id":2,"fee_group_id":1,"item_name":"Registration Fee","item_code":"REGISTRATION","description":"One-time registration","frequency":"one-time","is_optional":0,"status":"active"},{"id":3,"fee_group_id":2,"item_name":"Daily Meals","item_code":"MEALS-DAILY","description":"Daily meals included","frequency":"monthly","is_optional":0,"status":"active"},{"id":4,"fee_group_id":2,"item_name":"Snacks","item_code":"SNACKS","description":"Morning and afternoon snacks","frequency":"monthly","is_optional":0,"status":"active"},{"id":5,"fee_group_id":3,"item_name":"Learning Pack","item_code":"LEARNING","description":"Learning materials pack","frequency":"term","is_optional":0,"status":"active"},{"id":6,"fee_group_id":3,"item_name":"Toys & Activities","item_code":"TOYS","description":"Educational toys and activities","frequency":"term","is_optional":0,"status":"active"}],"rules":[]}', 
1, 'creche');
