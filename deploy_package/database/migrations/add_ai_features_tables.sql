-- AI Features System Tables

-- AI predictions
CREATE TABLE IF NOT EXISTS ai_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prediction_type ENUM('student_performance', 'dropout_risk', 'grade_forecast', 'attendance_pattern', 'financial_forecast') NOT NULL,
    entity_type ENUM('student', 'class', 'school', 'branch') NOT NULL,
    entity_id INT NOT NULL,
    prediction_data LONGTEXT COMMENT 'JSON prediction results',
    confidence_score DECIMAL(5,2),
    prediction_date DATE NOT NULL,
    forecast_period VARCHAR(50),
    model_version VARCHAR(50),
    accuracy_score DECIMAL(5,2),
    status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (prediction_type),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_date (prediction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- AI recommendations
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recommendation_type ENUM('intervention', 'resource_allocation', 'teaching_strategy', 'schedule_optimization', 'fee_structure') NOT NULL,
    target_type ENUM('student', 'teacher', 'class', 'school') NOT NULL,
    target_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    confidence_score DECIMAL(5,2),
    expected_impact TEXT,
    action_items TEXT COMMENT 'JSON array of actions',
    status ENUM('pending', 'reviewed', 'implemented', 'dismissed') DEFAULT 'pending',
    implemented_date DATE,
    impact_assessment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (recommendation_type),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Chatbot conversations
CREATE TABLE IF NOT EXISTS chatbot_conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL,
    user_id INT,
    user_type ENUM('student', 'parent', 'teacher', 'admin', 'guest') DEFAULT 'guest',
    conversation_data LONGTEXT COMMENT 'JSON array of messages',
    intent VARCHAR(100),
    sentiment ENUM('positive', 'neutral', 'negative'),
    satisfaction_rating INT,
    resolved BOOLEAN DEFAULT FALSE,
    escalated_to_human BOOLEAN DEFAULT FALSE,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    duration_seconds INT,
    INDEX idx_session (session_id),
    INDEX idx_user (user_id, user_type),
    INDEX idx_date (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Chatbot knowledge base
CREATE TABLE IF NOT EXISTS chatbot_knowledge_base (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT,
    context TEXT,
    confidence_threshold DECIMAL(5,2) DEFAULT 0.70,
    usage_count INT DEFAULT 0,
    success_rate DECIMAL(5,2),
    language VARCHAR(10) DEFAULT 'en',
    status ENUM('active', 'inactive', 'review') DEFAULT 'active',
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_category (category),
    INDEX idx_status (status),
    FULLTEXT idx_question (question, answer, keywords)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Smart scheduling
CREATE TABLE IF NOT EXISTS smart_scheduling_suggestions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_type ENUM('timetable', 'exam', 'event', 'meeting') NOT NULL,
    suggestion_data LONGTEXT COMMENT 'JSON suggested schedule',
    optimization_criteria TEXT COMMENT 'Criteria used for optimization',
    conflicts_resolved INT DEFAULT 0,
    efficiency_score DECIMAL(5,2),
    generated_for_date DATE,
    status ENUM('pending', 'accepted', 'rejected', 'modified') DEFAULT 'pending',
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (schedule_type),
    INDEX idx_status (status),
    INDEX idx_date (generated_for_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Anomaly detection
CREATE TABLE IF NOT EXISTS anomaly_detections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    anomaly_type ENUM('attendance', 'performance', 'financial', 'behavior', 'system') NOT NULL,
    entity_type ENUM('student', 'teacher', 'class', 'transaction', 'system') NOT NULL,
    entity_id INT,
    description TEXT NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    detected_value DECIMAL(15,2),
    expected_value DECIMAL(15,2),
    deviation_percentage DECIMAL(5,2),
    detection_date DATETIME NOT NULL,
    alert_sent BOOLEAN DEFAULT FALSE,
    investigated BOOLEAN DEFAULT FALSE,
    resolution TEXT,
    status ENUM('open', 'investigating', 'resolved', 'false_positive') DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (anomaly_type),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_date (detection_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ML model performance
CREATE TABLE IF NOT EXISTS ml_model_performance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    training_date DATE,
    accuracy_score DECIMAL(5,2),
    precision_score DECIMAL(5,2),
    recall_score DECIMAL(5,2),
    f1_score DECIMAL(5,2),
    training_samples INT,
    test_samples INT,
    features_used TEXT COMMENT 'JSON array of features',
    hyperparameters TEXT COMMENT 'JSON model parameters',
    performance_metrics TEXT COMMENT 'JSON detailed metrics',
    status ENUM('training', 'active', 'deprecated') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_model (model_name, version),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Automated insights
CREATE TABLE IF NOT EXISTS automated_insights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    insight_type ENUM('trend', 'pattern', 'correlation', 'opportunity', 'risk') NOT NULL,
    category VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    data_points TEXT COMMENT 'JSON supporting data',
    confidence_level DECIMAL(5,2),
    impact_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
    actionable BOOLEAN DEFAULT TRUE,
    recommended_actions TEXT,
    target_audience VARCHAR(100),
    generated_date DATE NOT NULL,
    expires_date DATE,
    viewed BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'archived') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (insight_type),
    INDEX idx_category (category),
    INDEX idx_date (generated_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Personalized learning paths
CREATE TABLE IF NOT EXISTS personalized_learning_paths (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT,
    current_level VARCHAR(50),
    target_level VARCHAR(50),
    learning_style ENUM('visual', 'auditory', 'kinesthetic', 'reading_writing') NOT NULL,
    strengths TEXT COMMENT 'JSON array of strengths',
    weaknesses TEXT COMMENT 'JSON array of weaknesses',
    recommended_resources TEXT COMMENT 'JSON array of resources',
    milestones TEXT COMMENT 'JSON array of milestones',
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    estimated_completion_date DATE,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'completed', 'paused') DEFAULT 'active',
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    INDEX idx_student (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sentiment analysis
CREATE TABLE IF NOT EXISTS sentiment_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_type ENUM('feedback', 'review', 'comment', 'survey', 'chat') NOT NULL,
    source_id INT,
    text_content TEXT NOT NULL,
    sentiment ENUM('very_negative', 'negative', 'neutral', 'positive', 'very_positive') NOT NULL,
    confidence_score DECIMAL(5,2),
    emotions TEXT COMMENT 'JSON detected emotions',
    keywords TEXT COMMENT 'JSON extracted keywords',
    analyzed_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_source (source_type, source_id),
    INDEX idx_sentiment (sentiment),
    INDEX idx_date (analyzed_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Predictive maintenance (for systems/equipment)
CREATE TABLE IF NOT EXISTS predictive_maintenance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_type ENUM('vehicle', 'device', 'equipment', 'infrastructure') NOT NULL,
    asset_id INT NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    predicted_failure_date DATE,
    failure_probability DECIMAL(5,2),
    recommended_action TEXT,
    maintenance_priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    estimated_cost DECIMAL(10,2),
    current_condition VARCHAR(100),
    factors TEXT COMMENT 'JSON contributing factors',
    prediction_date DATE NOT NULL,
    maintenance_scheduled BOOLEAN DEFAULT FALSE,
    status ENUM('pending', 'scheduled', 'completed', 'dismissed') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_asset (asset_type, asset_id),
    INDEX idx_date (predicted_failure_date),
    INDEX idx_priority (maintenance_priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert sample chatbot knowledge
INSERT INTO chatbot_knowledge_base (category, question, answer, keywords) VALUES
('Admissions', 'How do I apply for admission?', 'You can apply for admission through our online portal at www.school.edu.gh/apply or visit our admissions office. Required documents include birth certificate, previous school records, and passport photos.', 'admission,apply,enrollment,registration'),
('Fees', 'What are the school fees?', 'School fees vary by grade level. Please visit our fees page or contact the accounts office for detailed fee structure. We offer flexible payment plans and accept mobile money payments.', 'fees,payment,tuition,cost'),
('Timetable', 'Where can I find the class timetable?', 'Class timetables are available on the student portal. You can also download the mobile app to view your personalized timetable and receive notifications about any changes.', 'timetable,schedule,classes,periods'),
('Results', 'How do I check exam results?', 'Exam results are published on the student portal. Parents can also access results through the parent portal or mobile app. You will receive an SMS notification when results are published.', 'results,grades,scores,marks,exams')
ON DUPLICATE KEY UPDATE question = VALUES(question);

-- Insert sample AI model records
INSERT INTO ml_model_performance (model_name, model_type, version, accuracy_score, status) VALUES
('Student Performance Predictor', 'Random Forest', '1.0', 0.85, 'active'),
('Dropout Risk Classifier', 'Gradient Boosting', '1.0', 0.82, 'active'),
('Attendance Pattern Analyzer', 'LSTM Neural Network', '1.0', 0.88, 'active'),
('Grade Forecaster', 'Linear Regression', '1.0', 0.79, 'active')
ON DUPLICATE KEY UPDATE model_name = VALUES(model_name);
