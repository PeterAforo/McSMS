-- Learning Management System Tables

-- Course categories
CREATE TABLE IF NOT EXISTS course_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Courses
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(50) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    category_id INT,
    subject_id INT,
    class_id INT,
    teacher_id INT,
    description TEXT,
    thumbnail VARCHAR(255),
    duration_weeks INT,
    total_lessons INT DEFAULT 0,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES course_categories(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_class (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Course lessons/modules
CREATE TABLE IF NOT EXISTS course_lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    lesson_title VARCHAR(255) NOT NULL,
    lesson_order INT DEFAULT 0,
    lesson_type ENUM('video', 'document', 'quiz', 'assignment', 'text') DEFAULT 'text',
    content TEXT,
    video_url VARCHAR(500),
    document_path VARCHAR(255),
    duration_minutes INT,
    is_free BOOLEAN DEFAULT FALSE,
    status ENUM('draft', 'published') DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course (course_id),
    INDEX idx_order (lesson_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Course materials/resources
CREATE TABLE IF NOT EXISTS course_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    lesson_id INT,
    material_title VARCHAR(255) NOT NULL,
    material_type ENUM('pdf', 'doc', 'ppt', 'video', 'link', 'image', 'other') NOT NULL,
    file_path VARCHAR(500),
    file_size BIGINT,
    external_url VARCHAR(500),
    description TEXT,
    uploaded_by INT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_course (course_id),
    INDEX idx_lesson (lesson_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Course enrollments
CREATE TABLE IF NOT EXISTS course_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    enrollment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    status ENUM('active', 'completed', 'dropped', 'suspended') DEFAULT 'active',
    last_accessed DATETIME,
    completed_at DATETIME,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id),
    UNIQUE KEY unique_enrollment (course_id, student_id),
    INDEX idx_student (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Lesson progress tracking
CREATE TABLE IF NOT EXISTS lesson_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT NOT NULL,
    lesson_id INT NOT NULL,
    status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    time_spent_minutes INT DEFAULT 0,
    started_at DATETIME,
    completed_at DATETIME,
    last_accessed DATETIME,
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_progress (enrollment_id, lesson_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Assignments
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    lesson_id INT,
    class_id INT,
    subject_id INT,
    teacher_id INT,
    assignment_title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    attachment_path VARCHAR(255),
    max_marks DECIMAL(10,2) DEFAULT 100,
    due_date DATETIME NOT NULL,
    allow_late_submission BOOLEAN DEFAULT FALSE,
    late_penalty_percentage DECIMAL(5,2) DEFAULT 0,
    status ENUM('draft', 'published', 'closed') DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    INDEX idx_due_date (due_date),
    INDEX idx_class (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Assignment submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    submission_text TEXT,
    attachment_path VARCHAR(255),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_late BOOLEAN DEFAULT FALSE,
    marks_obtained DECIMAL(10,2),
    feedback TEXT,
    status ENUM('submitted', 'graded', 'returned', 'resubmitted') DEFAULT 'submitted',
    graded_by INT,
    graded_at DATETIME,
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (graded_by) REFERENCES users(id),
    UNIQUE KEY unique_submission (assignment_id, student_id),
    INDEX idx_student (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    lesson_id INT,
    quiz_title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INT,
    max_attempts INT DEFAULT 1,
    pass_percentage DECIMAL(5,2) DEFAULT 50,
    show_correct_answers BOOLEAN DEFAULT TRUE,
    randomize_questions BOOLEAN DEFAULT FALSE,
    status ENUM('draft', 'published', 'closed') DEFAULT 'draft',
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Quiz questions
CREATE TABLE IF NOT EXISTS quiz_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'true_false', 'short_answer', 'essay') DEFAULT 'multiple_choice',
    question_order INT DEFAULT 0,
    points DECIMAL(10,2) DEFAULT 1,
    correct_answer TEXT,
    explanation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    INDEX idx_quiz (quiz_id),
    INDEX idx_order (question_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Quiz question options (for multiple choice)
CREATE TABLE IF NOT EXISTS quiz_question_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    option_order INT DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
    INDEX idx_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Quiz attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    attempt_number INT DEFAULT 1,
    score DECIMAL(10,2),
    max_score DECIMAL(10,2),
    percentage DECIMAL(5,2),
    passed BOOLEAN DEFAULT FALSE,
    time_taken_minutes INT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id),
    INDEX idx_student (student_id),
    INDEX idx_quiz (quiz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Quiz answers
CREATE TABLE IF NOT EXISTS quiz_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_text TEXT,
    selected_option_id INT,
    is_correct BOOLEAN,
    points_earned DECIMAL(10,2) DEFAULT 0,
    answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES quiz_question_options(id),
    INDEX idx_attempt (attempt_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Discussion forums
CREATE TABLE IF NOT EXISTS course_discussions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    lesson_id INT,
    user_id INT NOT NULL,
    user_type ENUM('teacher', 'student') NOT NULL,
    title VARCHAR(255),
    message TEXT NOT NULL,
    parent_id INT,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES course_lessons(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES course_discussions(id) ON DELETE CASCADE,
    INDEX idx_course (course_id),
    INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Course announcements
CREATE TABLE IF NOT EXISTS course_announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    posted_by INT NOT NULL,
    posted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    status ENUM('active', 'expired') DEFAULT 'active',
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (posted_by) REFERENCES users(id),
    INDEX idx_course (course_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default course categories
INSERT INTO course_categories (category_name, description, icon) VALUES
('Mathematics', 'Mathematics and related courses', 'calculator'),
('Science', 'Science subjects', 'flask'),
('Languages', 'Language courses', 'book'),
('Social Studies', 'History, Geography, etc.', 'globe'),
('Arts', 'Creative and performing arts', 'palette'),
('Technology', 'Computer and technology courses', 'laptop'),
('Physical Education', 'Sports and physical activities', 'activity')
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);
