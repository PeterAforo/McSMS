<?php
/**
 * Learning Management System API
 * Complete LMS with courses, lessons, assignments, quizzes
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $method = $_SERVER['REQUEST_METHOD'];
    $resource = $_GET['resource'] ?? '';
    $id = $_GET['id'] ?? null;
    $action = $_GET['action'] ?? null;

    // ============================================
    // COURSES
    // ============================================
    if ($resource === 'courses') {
        switch ($method) {
            case 'GET':
                if ($action === 'my_courses') {
                    $studentId = $_GET['student_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT 
                            c.*,
                            cc.category_name,
                            CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                            ce.completion_percentage,
                            ce.status as enrollment_status
                        FROM course_enrollments ce
                        JOIN courses c ON ce.course_id = c.id
                        LEFT JOIN course_categories cc ON c.category_id = cc.id
                        LEFT JOIN teachers t ON c.teacher_id = t.id
                        WHERE ce.student_id = ?
                        ORDER BY ce.last_accessed DESC
                    ");
                    $stmt->execute([$studentId]);
                    echo json_encode(['success' => true, 'courses' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("
                        SELECT 
                            c.*,
                            cc.category_name,
                            s.subject_name,
                            cl.class_name,
                            CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                            (SELECT COUNT(*) FROM course_lessons WHERE course_id = c.id) as lesson_count,
                            (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as student_count
                        FROM courses c
                        LEFT JOIN course_categories cc ON c.category_id = cc.id
                        LEFT JOIN subjects s ON c.subject_id = s.id
                        LEFT JOIN classes cl ON c.class_id = cl.id
                        LEFT JOIN teachers t ON c.teacher_id = t.id
                        WHERE c.id = ?
                    ");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'course' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                    
                } else {
                    $where = [];
                    $params = [];
                    
                    if (!empty($_GET['class_id'])) {
                        $where[] = "c.class_id = ?";
                        $params[] = $_GET['class_id'];
                    }
                    if (!empty($_GET['status'])) {
                        $where[] = "c.status = ?";
                        $params[] = $_GET['status'];
                    }
                    
                    $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
                    
                    $stmt = $pdo->prepare("
                        SELECT 
                            c.*,
                            cc.category_name,
                            CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                            (SELECT COUNT(*) FROM course_lessons WHERE course_id = c.id) as lesson_count,
                            (SELECT COUNT(*) FROM course_enrollments WHERE course_id = c.id) as student_count
                        FROM courses c
                        LEFT JOIN course_categories cc ON c.category_id = cc.id
                        LEFT JOIN teachers t ON c.teacher_id = t.id
                        $whereClause
                        ORDER BY c.created_at DESC
                    ");
                    $stmt->execute($params);
                    echo json_encode(['success' => true, 'courses' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO courses 
                    (course_code, course_name, category_id, subject_id, class_id, teacher_id, description, thumbnail, duration_weeks, status, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['course_code'],
                    $data['course_name'],
                    $data['category_id'] ?? null,
                    $data['subject_id'] ?? null,
                    $data['class_id'] ?? null,
                    $data['teacher_id'] ?? null,
                    $data['description'] ?? null,
                    $data['thumbnail'] ?? null,
                    $data['duration_weeks'] ?? null,
                    $data['status'] ?? 'draft',
                    $data['created_by'] ?? 1
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    UPDATE courses 
                    SET course_name = ?, category_id = ?, subject_id = ?, class_id = ?, teacher_id = ?, 
                        description = ?, thumbnail = ?, duration_weeks = ?, status = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['course_name'],
                    $data['category_id'] ?? null,
                    $data['subject_id'] ?? null,
                    $data['class_id'] ?? null,
                    $data['teacher_id'] ?? null,
                    $data['description'] ?? null,
                    $data['thumbnail'] ?? null,
                    $data['duration_weeks'] ?? null,
                    $data['status'] ?? 'draft',
                    $id
                ]);
                echo json_encode(['success' => true]);
                break;

            case 'DELETE':
                $stmt = $pdo->prepare("DELETE FROM courses WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // LESSONS
    // ============================================
    elseif ($resource === 'lessons') {
        switch ($method) {
            case 'GET':
                if ($action === 'by_course') {
                    $courseId = $_GET['course_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT * FROM course_lessons 
                        WHERE course_id = ? 
                        ORDER BY lesson_order
                    ");
                    $stmt->execute([$courseId]);
                    echo json_encode(['success' => true, 'lessons' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("SELECT * FROM course_lessons WHERE id = ?");
                    $stmt->execute([$id]);
                    $lesson = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    // Get materials
                    $stmt = $pdo->prepare("SELECT * FROM course_materials WHERE lesson_id = ?");
                    $stmt->execute([$id]);
                    $lesson['materials'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    echo json_encode(['success' => true, 'lesson' => $lesson]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO course_lessons 
                    (course_id, lesson_title, lesson_order, lesson_type, content, video_url, document_path, duration_minutes, is_free, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['course_id'],
                    $data['lesson_title'],
                    $data['lesson_order'] ?? 0,
                    $data['lesson_type'] ?? 'text',
                    $data['content'] ?? null,
                    $data['video_url'] ?? null,
                    $data['document_path'] ?? null,
                    $data['duration_minutes'] ?? null,
                    $data['is_free'] ?? false,
                    $data['status'] ?? 'draft'
                ]);
                
                // Update course total lessons
                $pdo->prepare("UPDATE courses SET total_lessons = (SELECT COUNT(*) FROM course_lessons WHERE course_id = ?) WHERE id = ?")
                    ->execute([$data['course_id'], $data['course_id']]);
                
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'mark_complete') {
                    $enrollmentId = $data['enrollment_id'];
                    $stmt = $pdo->prepare("
                        INSERT INTO lesson_progress (enrollment_id, lesson_id, status, progress_percentage, completed_at)
                        VALUES (?, ?, 'completed', 100, NOW())
                        ON DUPLICATE KEY UPDATE 
                        status = 'completed', 
                        progress_percentage = 100, 
                        completed_at = NOW()
                    ");
                    $stmt->execute([$enrollmentId, $id]);
                    
                    // Update enrollment completion
                    updateEnrollmentProgress($pdo, $enrollmentId);
                    
                    echo json_encode(['success' => true]);
                } else {
                    $stmt = $pdo->prepare("
                        UPDATE course_lessons 
                        SET lesson_title = ?, lesson_type = ?, content = ?, video_url = ?, 
                            document_path = ?, duration_minutes = ?, is_free = ?, status = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $data['lesson_title'],
                        $data['lesson_type'] ?? 'text',
                        $data['content'] ?? null,
                        $data['video_url'] ?? null,
                        $data['document_path'] ?? null,
                        $data['duration_minutes'] ?? null,
                        $data['is_free'] ?? false,
                        $data['status'] ?? 'draft',
                        $id
                    ]);
                    echo json_encode(['success' => true]);
                }
                break;

            case 'DELETE':
                $stmt = $pdo->prepare("DELETE FROM course_lessons WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // ENROLLMENTS
    // ============================================
    elseif ($resource === 'enrollments') {
        switch ($method) {
            case 'GET':
                if ($action === 'by_course') {
                    $courseId = $_GET['course_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT 
                            ce.*,
                            CONCAT(s.first_name, ' ', s.last_name) as student_name,
                            s.student_id as student_number
                        FROM course_enrollments ce
                        JOIN students s ON ce.student_id = s.id
                        WHERE ce.course_id = ?
                        ORDER BY ce.enrollment_date DESC
                    ");
                    $stmt->execute([$courseId]);
                    echo json_encode(['success' => true, 'enrollments' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO course_enrollments (course_id, student_id, status)
                    VALUES (?, ?, 'active')
                    ON DUPLICATE KEY UPDATE status = 'active'
                ");
                $stmt->execute([$data['course_id'], $data['student_id']]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;
        }
    }

    // ============================================
    // ASSIGNMENTS
    // ============================================
    elseif ($resource === 'assignments') {
        switch ($method) {
            case 'GET':
                if ($action === 'by_course') {
                    $courseId = $_GET['course_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT 
                            a.*,
                            (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id) as submission_count
                        FROM assignments a
                        WHERE a.course_id = ?
                        ORDER BY a.due_date DESC
                    ");
                    $stmt->execute([$courseId]);
                    echo json_encode(['success' => true, 'assignments' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'by_student') {
                    $studentId = $_GET['student_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT 
                            a.*,
                            c.course_name,
                            asub.id as submission_id,
                            asub.submitted_at,
                            asub.marks_obtained,
                            asub.status as submission_status
                        FROM assignments a
                        JOIN courses c ON a.course_id = c.id
                        LEFT JOIN assignment_submissions asub ON a.id = asub.assignment_id AND asub.student_id = ?
                        WHERE a.class_id IN (SELECT class_id FROM students WHERE id = ?)
                        ORDER BY a.due_date DESC
                    ");
                    $stmt->execute([$studentId, $studentId]);
                    echo json_encode(['success' => true, 'assignments' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("
                        SELECT 
                            a.*,
                            c.course_name,
                            (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id) as submission_count
                        FROM assignments a
                        LEFT JOIN courses c ON a.course_id = c.id
                        WHERE a.id = ?
                    ");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'assignment' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO assignments 
                    (course_id, lesson_id, class_id, subject_id, teacher_id, assignment_title, description, instructions, attachment_path, max_marks, due_date, allow_late_submission, late_penalty_percentage, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['course_id'] ?? null,
                    $data['lesson_id'] ?? null,
                    $data['class_id'] ?? null,
                    $data['subject_id'] ?? null,
                    $data['teacher_id'] ?? null,
                    $data['assignment_title'],
                    $data['description'] ?? null,
                    $data['instructions'] ?? null,
                    $data['attachment_path'] ?? null,
                    $data['max_marks'] ?? 100,
                    $data['due_date'],
                    $data['allow_late_submission'] ?? false,
                    $data['late_penalty_percentage'] ?? 0,
                    $data['status'] ?? 'draft'
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    UPDATE assignments 
                    SET assignment_title = ?, description = ?, instructions = ?, max_marks = ?, 
                        due_date = ?, allow_late_submission = ?, late_penalty_percentage = ?, status = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['assignment_title'],
                    $data['description'] ?? null,
                    $data['instructions'] ?? null,
                    $data['max_marks'] ?? 100,
                    $data['due_date'],
                    $data['allow_late_submission'] ?? false,
                    $data['late_penalty_percentage'] ?? 0,
                    $data['status'] ?? 'draft',
                    $id
                ]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // SUBMISSIONS
    // ============================================
    elseif ($resource === 'submissions') {
        switch ($method) {
            case 'GET':
                if ($action === 'by_assignment') {
                    $assignmentId = $_GET['assignment_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT 
                            asub.*,
                            CONCAT(s.first_name, ' ', s.last_name) as student_name,
                            s.student_id as student_number
                        FROM assignment_submissions asub
                        JOIN students s ON asub.student_id = s.id
                        WHERE asub.assignment_id = ?
                        ORDER BY asub.submitted_at DESC
                    ");
                    $stmt->execute([$assignmentId]);
                    echo json_encode(['success' => true, 'submissions' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Check if late
                $stmt = $pdo->prepare("SELECT due_date FROM assignments WHERE id = ?");
                $stmt->execute([$data['assignment_id']]);
                $assignment = $stmt->fetch(PDO::FETCH_ASSOC);
                $isLate = strtotime($assignment['due_date']) < time();
                
                $stmt = $pdo->prepare("
                    INSERT INTO assignment_submissions 
                    (assignment_id, student_id, submission_text, attachment_path, is_late, status)
                    VALUES (?, ?, ?, ?, ?, 'submitted')
                    ON DUPLICATE KEY UPDATE
                    submission_text = VALUES(submission_text),
                    attachment_path = VALUES(attachment_path),
                    submitted_at = NOW(),
                    status = 'resubmitted'
                ");
                $stmt->execute([
                    $data['assignment_id'],
                    $data['student_id'],
                    $data['submission_text'] ?? null,
                    $data['attachment_path'] ?? null,
                    $isLate
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'grade') {
                    $stmt = $pdo->prepare("
                        UPDATE assignment_submissions 
                        SET marks_obtained = ?, feedback = ?, status = 'graded', graded_by = ?, graded_at = NOW()
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $data['marks_obtained'],
                        $data['feedback'] ?? null,
                        $data['graded_by'] ?? 1,
                        $id
                    ]);
                    echo json_encode(['success' => true]);
                }
                break;
        }
    }

    // ============================================
    // QUIZZES
    // ============================================
    elseif ($resource === 'quizzes') {
        switch ($method) {
            case 'GET':
                if ($action === 'by_course') {
                    $courseId = $_GET['course_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT 
                            q.*,
                            (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) as question_count
                        FROM quizzes q
                        WHERE q.course_id = ?
                        ORDER BY q.created_at DESC
                    ");
                    $stmt->execute([$courseId]);
                    echo json_encode(['success' => true, 'quizzes' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("SELECT * FROM quizzes WHERE id = ?");
                    $stmt->execute([$id]);
                    $quiz = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    // Get questions
                    $stmt = $pdo->prepare("
                        SELECT * FROM quiz_questions 
                        WHERE quiz_id = ? 
                        ORDER BY question_order
                    ");
                    $stmt->execute([$id]);
                    $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Get options for each question
                    foreach ($questions as &$question) {
                        $stmt = $pdo->prepare("
                            SELECT * FROM quiz_question_options 
                            WHERE question_id = ? 
                            ORDER BY option_order
                        ");
                        $stmt->execute([$question['id']]);
                        $question['options'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    }
                    
                    $quiz['questions'] = $questions;
                    echo json_encode(['success' => true, 'quiz' => $quiz]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO quizzes 
                    (course_id, lesson_id, quiz_title, description, duration_minutes, max_attempts, pass_percentage, show_correct_answers, randomize_questions, status, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['course_id'] ?? null,
                    $data['lesson_id'] ?? null,
                    $data['quiz_title'],
                    $data['description'] ?? null,
                    $data['duration_minutes'] ?? null,
                    $data['max_attempts'] ?? 1,
                    $data['pass_percentage'] ?? 50,
                    $data['show_correct_answers'] ?? true,
                    $data['randomize_questions'] ?? false,
                    $data['status'] ?? 'draft',
                    $data['created_by'] ?? 1
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;
        }
    }

// ============================================
    // VIDEO LESSONS
    // ============================================
    elseif ($resource === 'videos') {
        // Create video lessons table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS video_lessons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lesson_id INT NOT NULL,
                video_url VARCHAR(500),
                video_type ENUM('youtube', 'vimeo', 'upload', 'embed') DEFAULT 'youtube',
                duration_seconds INT DEFAULT 0,
                thumbnail_url VARCHAR(500),
                transcript TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_lesson_id (lesson_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        
        // Create video progress table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS video_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                video_id INT NOT NULL,
                watched_seconds INT DEFAULT 0,
                completed TINYINT(1) DEFAULT 0,
                last_position INT DEFAULT 0,
                watch_count INT DEFAULT 1,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_student_video (student_id, video_id),
                INDEX idx_student_id (student_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        switch ($method) {
            case 'GET':
                if ($action === 'lesson_videos') {
                    $lessonId = $_GET['lesson_id'] ?? null;
                    $stmt = $pdo->prepare("SELECT * FROM video_lessons WHERE lesson_id = ?");
                    $stmt->execute([$lessonId]);
                    echo json_encode(['success' => true, 'videos' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'progress') {
                    $studentId = $_GET['student_id'] ?? null;
                    $videoId = $_GET['video_id'] ?? null;
                    $stmt = $pdo->prepare("SELECT * FROM video_progress WHERE student_id = ? AND video_id = ?");
                    $stmt->execute([$studentId, $videoId]);
                    echo json_encode(['success' => true, 'progress' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("SELECT * FROM video_lessons WHERE id = ?");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'video' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'add') {
                    $stmt = $pdo->prepare("
                        INSERT INTO video_lessons (lesson_id, video_url, video_type, duration_seconds, thumbnail_url, transcript)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([
                        $data['lesson_id'],
                        $data['video_url'],
                        $data['video_type'] ?? 'youtube',
                        $data['duration_seconds'] ?? 0,
                        $data['thumbnail_url'] ?? null,
                        $data['transcript'] ?? null
                    ]);
                    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                    
                } elseif ($action === 'update_progress') {
                    $stmt = $pdo->prepare("
                        INSERT INTO video_progress (student_id, video_id, watched_seconds, last_position, completed)
                        VALUES (?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                            watched_seconds = GREATEST(watched_seconds, VALUES(watched_seconds)),
                            last_position = VALUES(last_position),
                            completed = VALUES(completed),
                            watch_count = watch_count + 1
                    ");
                    $completed = ($data['watched_seconds'] / max(1, $data['total_seconds'])) >= 0.9 ? 1 : 0;
                    $stmt->execute([
                        $data['student_id'],
                        $data['video_id'],
                        $data['watched_seconds'],
                        $data['last_position'],
                        $completed
                    ]);
                    echo json_encode(['success' => true, 'completed' => $completed]);
                }
                break;
        }
    }

    // ============================================
    // STUDENT PROGRESS & ANALYTICS
    // ============================================
    elseif ($resource === 'progress') {
        // Create detailed progress table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS student_learning_progress (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                course_id INT NOT NULL,
                lessons_completed INT DEFAULT 0,
                quizzes_completed INT DEFAULT 0,
                assignments_completed INT DEFAULT 0,
                videos_watched INT DEFAULT 0,
                total_time_spent INT DEFAULT 0,
                average_quiz_score DECIMAL(5,2) DEFAULT 0,
                last_activity DATETIME,
                streak_days INT DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_student_course (student_id, course_id),
                INDEX idx_student_id (student_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        switch ($method) {
            case 'GET':
                if ($action === 'student_overview') {
                    $studentId = $_GET['student_id'] ?? null;
                    
                    // Get overall progress
                    $stmt = $pdo->prepare("
                        SELECT 
                            COUNT(DISTINCT ce.course_id) as enrolled_courses,
                            SUM(CASE WHEN ce.status = 'completed' THEN 1 ELSE 0 END) as completed_courses,
                            AVG(ce.completion_percentage) as avg_completion,
                            SUM(slp.total_time_spent) as total_time_spent,
                            AVG(slp.average_quiz_score) as avg_quiz_score,
                            MAX(slp.streak_days) as best_streak
                        FROM course_enrollments ce
                        LEFT JOIN student_learning_progress slp ON ce.student_id = slp.student_id AND ce.course_id = slp.course_id
                        WHERE ce.student_id = ?
                    ");
                    $stmt->execute([$studentId]);
                    $overview = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    // Get recent activity
                    $stmt = $pdo->prepare("
                        SELECT 
                            'lesson' as type,
                            cl.title as item_name,
                            c.title as course_name,
                            lp.completed_at as activity_date
                        FROM lesson_progress lp
                        JOIN course_lessons cl ON lp.lesson_id = cl.id
                        JOIN courses c ON cl.course_id = c.id
                        WHERE lp.enrollment_id IN (SELECT id FROM course_enrollments WHERE student_id = ?)
                        ORDER BY lp.completed_at DESC
                        LIMIT 10
                    ");
                    $stmt->execute([$studentId]);
                    $recentActivity = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    echo json_encode([
                        'success' => true,
                        'overview' => $overview,
                        'recent_activity' => $recentActivity
                    ]);
                    
                } elseif ($action === 'course_progress') {
                    $studentId = $_GET['student_id'] ?? null;
                    $courseId = $_GET['course_id'] ?? null;
                    
                    $stmt = $pdo->prepare("
                        SELECT 
                            slp.*,
                            c.title as course_name,
                            (SELECT COUNT(*) FROM course_lessons WHERE course_id = c.id) as total_lessons,
                            (SELECT COUNT(*) FROM lms_quizzes WHERE course_id = c.id) as total_quizzes
                        FROM student_learning_progress slp
                        JOIN courses c ON slp.course_id = c.id
                        WHERE slp.student_id = ? AND slp.course_id = ?
                    ");
                    $stmt->execute([$studentId, $courseId]);
                    echo json_encode(['success' => true, 'progress' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'leaderboard') {
                    $courseId = $_GET['course_id'] ?? null;
                    $limit = min((int)($_GET['limit'] ?? 10), 50);
                    
                    $sql = "
                        SELECT 
                            s.id as student_id,
                            CONCAT(s.first_name, ' ', s.last_name) as student_name,
                            s.photo,
                            ce.completion_percentage,
                            slp.average_quiz_score,
                            slp.total_time_spent,
                            slp.streak_days
                        FROM course_enrollments ce
                        JOIN students s ON ce.student_id = s.id
                        LEFT JOIN student_learning_progress slp ON ce.student_id = slp.student_id AND ce.course_id = slp.course_id
                    ";
                    
                    if ($courseId) {
                        $sql .= " WHERE ce.course_id = ?";
                    }
                    
                    $sql .= " ORDER BY ce.completion_percentage DESC, slp.average_quiz_score DESC LIMIT $limit";
                    
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($courseId ? [$courseId] : []);
                    
                    $leaderboard = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($leaderboard as $i => &$entry) {
                        $entry['rank'] = $i + 1;
                    }
                    
                    echo json_encode(['success' => true, 'leaderboard' => $leaderboard]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'log_activity') {
                    // Log learning activity and update progress
                    $stmt = $pdo->prepare("
                        INSERT INTO student_learning_progress 
                        (student_id, course_id, total_time_spent, last_activity)
                        VALUES (?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                            total_time_spent = total_time_spent + VALUES(total_time_spent),
                            last_activity = NOW()
                    ");
                    $stmt->execute([
                        $data['student_id'],
                        $data['course_id'],
                        $data['time_spent'] ?? 0
                    ]);
                    
                    // Update streak
                    updateLearningStreak($pdo, $data['student_id'], $data['course_id']);
                    
                    echo json_encode(['success' => true]);
                }
                break;
        }
    }

    // ============================================
    // INTERACTIVE CONTENT
    // ============================================
    elseif ($resource === 'interactive') {
        // Create interactive content table
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS interactive_content (
                id INT AUTO_INCREMENT PRIMARY KEY,
                lesson_id INT NOT NULL,
                content_type ENUM('flashcard', 'matching', 'fill_blank', 'drag_drop', 'hotspot') NOT NULL,
                title VARCHAR(255),
                content JSON,
                points INT DEFAULT 10,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_lesson_id (lesson_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        switch ($method) {
            case 'GET':
                $lessonId = $_GET['lesson_id'] ?? null;
                $stmt = $pdo->prepare("SELECT * FROM interactive_content WHERE lesson_id = ?");
                $stmt->execute([$lessonId]);
                $content = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($content as &$item) {
                    $item['content'] = json_decode($item['content'], true);
                }
                echo json_encode(['success' => true, 'content' => $content]);
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO interactive_content (lesson_id, content_type, title, content, points)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['lesson_id'],
                    $data['content_type'],
                    $data['title'],
                    json_encode($data['content']),
                    $data['points'] ?? 10
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;
        }
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function updateEnrollmentProgress($pdo, $enrollmentId) {
    $stmt = $pdo->prepare("
        SELECT 
            (SELECT COUNT(*) FROM course_lessons WHERE course_id = ce.course_id) as total_lessons,
            (SELECT COUNT(*) FROM lesson_progress WHERE enrollment_id = ce.id AND status = 'completed') as completed_lessons
        FROM course_enrollments ce
        WHERE ce.id = ?
    ");
    $stmt->execute([$enrollmentId]);
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $percentage = $data['total_lessons'] > 0 
        ? ($data['completed_lessons'] / $data['total_lessons']) * 100 
        : 0;
    
    $status = $percentage >= 100 ? 'completed' : 'active';
    
    $stmt = $pdo->prepare("
        UPDATE course_enrollments 
        SET completion_percentage = ?, status = ?, last_accessed = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$percentage, $status, $enrollmentId]);
}

function updateLearningStreak($pdo, $studentId, $courseId) {
    try {
        // Get last activity date
        $stmt = $pdo->prepare("
            SELECT last_activity, streak_days 
            FROM student_learning_progress 
            WHERE student_id = ? AND course_id = ?
        ");
        $stmt->execute([$studentId, $courseId]);
        $progress = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($progress) {
            $lastActivity = new DateTime($progress['last_activity']);
            $today = new DateTime();
            $diff = $today->diff($lastActivity)->days;
            
            if ($diff === 1) {
                // Consecutive day - increment streak
                $newStreak = $progress['streak_days'] + 1;
            } elseif ($diff === 0) {
                // Same day - keep streak
                $newStreak = $progress['streak_days'];
            } else {
                // Streak broken
                $newStreak = 1;
            }
            
            $stmt = $pdo->prepare("
                UPDATE student_learning_progress 
                SET streak_days = ? 
                WHERE student_id = ? AND course_id = ?
            ");
            $stmt->execute([$newStreak, $studentId, $courseId]);
        }
    } catch (Exception $e) {
        error_log("Streak update error: " . $e->getMessage());
    }
}
