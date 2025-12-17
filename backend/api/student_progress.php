<?php
/**
 * Student Progress Tracking API
 * Track individual student progress over time
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Try multiple config paths for compatibility
$configPaths = [
    __DIR__ . '/../../config/database.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config/database.php',
    dirname(__DIR__, 2) . '/config/database.php'
];
$configLoaded = false;
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $configLoaded = true;
        break;
    }
}
if (!$configLoaded) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Config file not found']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$student_id = $_GET['student_id'] ?? null;
$teacher_id = $_GET['teacher_id'] ?? null;
$class_id = $_GET['class_id'] ?? null;
$subject_id = $_GET['subject_id'] ?? null;

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // Create progress goals table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_goals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            teacher_id INT NOT NULL,
            subject_id INT,
            goal_type ENUM('academic', 'behavior', 'attendance', 'skill') DEFAULT 'academic',
            title VARCHAR(255) NOT NULL,
            description TEXT,
            target_value DECIMAL(10,2),
            current_value DECIMAL(10,2) DEFAULT 0,
            start_date DATE,
            target_date DATE,
            status ENUM('active', 'achieved', 'missed', 'cancelled') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_student (student_id),
            INDEX idx_teacher (teacher_id)
        )
    ");

    // Create progress notes table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS student_progress_notes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL,
            teacher_id INT NOT NULL,
            subject_id INT,
            note_type ENUM('progress', 'concern', 'achievement', 'observation') DEFAULT 'progress',
            title VARCHAR(255),
            content TEXT NOT NULL,
            is_private TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_student (student_id),
            INDEX idx_teacher (teacher_id)
        )
    ");

    // GET - Get student progress data
    if ($method === 'GET') {
        $resource = $_GET['resource'] ?? 'overview';

        if ($resource === 'overview' && $student_id) {
            // Get comprehensive student progress overview
            $response = ['success' => true];

            // Student info
            try {
                $stmt = $pdo->prepare("
                    SELECT s.*, c.class_name 
                    FROM students s 
                    LEFT JOIN classes c ON s.class_id = c.id 
                    WHERE s.id = ?
                ");
                $stmt->execute([$student_id]);
                $response['student'] = $stmt->fetch(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                $response['student'] = null;
            }

            // Attendance stats
            try {
                $stmt = $pdo->prepare("
                    SELECT 
                        COUNT(*) as total_days,
                        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
                    FROM attendance WHERE student_id = ?
                ");
                $stmt->execute([$student_id]);
                $response['attendance'] = $stmt->fetch(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                $response['attendance'] = ['total_days' => 0, 'present' => 0, 'absent' => 0, 'late' => 0];
            }

            // Grade averages by subject
            try {
                $stmt = $pdo->prepare("
                    SELECT s.subject_name, s.id as subject_id,
                           AVG(g.marks_obtained) as average,
                           COUNT(g.id) as assessments_count,
                           MAX(g.marks_obtained) as highest,
                           MIN(g.marks_obtained) as lowest
                    FROM grades g
                    INNER JOIN assessments a ON g.assessment_id = a.id
                    INNER JOIN subjects s ON a.subject_id = s.id
                    WHERE g.student_id = ?
                    GROUP BY s.id
                    ORDER BY s.subject_name
                ");
                $stmt->execute([$student_id]);
                $response['grades_by_subject'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                $response['grades_by_subject'] = [];
            }

            // Recent grades (last 10)
            try {
                $stmt = $pdo->prepare("
                    SELECT g.*, a.title as assessment_title, a.max_marks, s.subject_name
                    FROM grades g
                    INNER JOIN assessments a ON g.assessment_id = a.id
                    INNER JOIN subjects s ON a.subject_id = s.id
                    WHERE g.student_id = ?
                    ORDER BY g.created_at DESC
                    LIMIT 10
                ");
                $stmt->execute([$student_id]);
                $response['recent_grades'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                $response['recent_grades'] = [];
            }

            // Active goals
            try {
                $stmt = $pdo->prepare("
                    SELECT sg.*, s.subject_name, CONCAT(t.first_name, ' ', t.last_name) as teacher_name
                    FROM student_goals sg
                    LEFT JOIN subjects s ON sg.subject_id = s.id
                    LEFT JOIN teachers t ON sg.teacher_id = t.id
                    WHERE sg.student_id = ? AND sg.status = 'active'
                    ORDER BY sg.target_date
                ");
                $stmt->execute([$student_id]);
                $response['active_goals'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                $response['active_goals'] = [];
            }

            // Progress notes (non-private or by requesting teacher)
            try {
                $noteSql = "
                    SELECT spn.*, s.subject_name, CONCAT(t.first_name, ' ', t.last_name) as teacher_name
                    FROM student_progress_notes spn
                    LEFT JOIN subjects s ON spn.subject_id = s.id
                    LEFT JOIN teachers t ON spn.teacher_id = t.id
                    WHERE spn.student_id = ?
                ";
                if ($teacher_id) {
                    $noteSql .= " AND (spn.is_private = 0 OR spn.teacher_id = ?)";
                    $stmt = $pdo->prepare($noteSql . " ORDER BY spn.created_at DESC LIMIT 10");
                    $stmt->execute([$student_id, $teacher_id]);
                } else {
                    $noteSql .= " AND spn.is_private = 0";
                    $stmt = $pdo->prepare($noteSql . " ORDER BY spn.created_at DESC LIMIT 10");
                    $stmt->execute([$student_id]);
                }
                $response['progress_notes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                $response['progress_notes'] = [];
            }

            // Grade trend (monthly averages)
            try {
                $stmt = $pdo->prepare("
                    SELECT DATE_FORMAT(g.created_at, '%Y-%m') as month,
                           AVG(g.marks_obtained) as average
                    FROM grades g
                    WHERE g.student_id = ?
                    GROUP BY DATE_FORMAT(g.created_at, '%Y-%m')
                    ORDER BY month DESC
                    LIMIT 12
                ");
                $stmt->execute([$student_id]);
                $response['grade_trend'] = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));
            } catch (PDOException $e) {
                $response['grade_trend'] = [];
            }

            echo json_encode($response);
        }
        elseif ($resource === 'goals') {
            $sql = "
                SELECT sg.*, s.subject_name, 
                       CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                       CONCAT(st.first_name, ' ', st.last_name) as student_name
                FROM student_goals sg
                LEFT JOIN subjects s ON sg.subject_id = s.id
                LEFT JOIN teachers t ON sg.teacher_id = t.id
                LEFT JOIN students st ON sg.student_id = st.id
                WHERE 1=1
            ";
            $params = [];

            if ($student_id) {
                $sql .= " AND sg.student_id = ?";
                $params[] = $student_id;
            }
            if ($teacher_id) {
                $sql .= " AND sg.teacher_id = ?";
                $params[] = $teacher_id;
            }

            $sql .= " ORDER BY sg.status = 'active' DESC, sg.target_date";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode(['success' => true, 'goals' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
        elseif ($resource === 'notes') {
            $sql = "
                SELECT spn.*, s.subject_name,
                       CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
                       CONCAT(st.first_name, ' ', st.last_name) as student_name
                FROM student_progress_notes spn
                LEFT JOIN subjects s ON spn.subject_id = s.id
                LEFT JOIN teachers t ON spn.teacher_id = t.id
                LEFT JOIN students st ON spn.student_id = st.id
                WHERE 1=1
            ";
            $params = [];

            if ($student_id) {
                $sql .= " AND spn.student_id = ?";
                $params[] = $student_id;
            }
            if ($teacher_id) {
                $sql .= " AND (spn.is_private = 0 OR spn.teacher_id = ?)";
                $params[] = $teacher_id;
            }

            $sql .= " ORDER BY spn.created_at DESC";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode(['success' => true, 'notes' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
        elseif ($resource === 'class_overview' && $class_id) {
            // Get progress overview for all students in a class
            $stmt = $pdo->prepare("
                SELECT s.id, s.first_name, s.last_name, s.admission_number,
                       (SELECT AVG(g.marks_obtained) FROM grades g WHERE g.student_id = s.id) as avg_grade,
                       (SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.id AND a.status = 'present') as present_days,
                       (SELECT COUNT(*) FROM attendance a WHERE a.student_id = s.id) as total_days,
                       (SELECT COUNT(*) FROM student_goals sg WHERE sg.student_id = s.id AND sg.status = 'active') as active_goals
                FROM students s
                WHERE s.class_id = ? AND s.status = 'active'
                ORDER BY s.first_name, s.last_name
            ");
            $stmt->execute([$class_id]);

            echo json_encode(['success' => true, 'students' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
        else {
            echo json_encode(['success' => false, 'error' => 'Invalid resource or missing parameters']);
        }
    }

    // POST - Create goal or note
    elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $resource = $data['resource'] ?? 'goal';

        if ($resource === 'goal') {
            if (!isset($data['student_id']) || !isset($data['teacher_id']) || !isset($data['title'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Student ID, Teacher ID, and Title are required']);
                exit();
            }

            $stmt = $pdo->prepare("
                INSERT INTO student_goals (student_id, teacher_id, subject_id, goal_type, title, 
                                          description, target_value, current_value, start_date, target_date, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['student_id'],
                $data['teacher_id'],
                $data['subject_id'] ?? null,
                $data['goal_type'] ?? 'academic',
                $data['title'],
                $data['description'] ?? null,
                $data['target_value'] ?? null,
                $data['current_value'] ?? 0,
                $data['start_date'] ?? date('Y-m-d'),
                $data['target_date'] ?? null,
                $data['status'] ?? 'active'
            ]);

            echo json_encode(['success' => true, 'message' => 'Goal created', 'id' => $pdo->lastInsertId()]);
        }
        elseif ($resource === 'note') {
            if (!isset($data['student_id']) || !isset($data['teacher_id']) || !isset($data['content'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Student ID, Teacher ID, and Content are required']);
                exit();
            }

            $stmt = $pdo->prepare("
                INSERT INTO student_progress_notes (student_id, teacher_id, subject_id, note_type, title, content, is_private)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['student_id'],
                $data['teacher_id'],
                $data['subject_id'] ?? null,
                $data['note_type'] ?? 'progress',
                $data['title'] ?? null,
                $data['content'],
                $data['is_private'] ?? 1
            ]);

            echo json_encode(['success' => true, 'message' => 'Note created', 'id' => $pdo->lastInsertId()]);
        }
    }

    // PUT - Update goal or note
    elseif ($method === 'PUT') {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? $data['id'] ?? null;
        $resource = $data['resource'] ?? 'goal';

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID is required']);
            exit();
        }

        if ($resource === 'goal') {
            $stmt = $pdo->prepare("
                UPDATE student_goals SET
                    title = COALESCE(?, title),
                    description = ?,
                    target_value = COALESCE(?, target_value),
                    current_value = COALESCE(?, current_value),
                    target_date = COALESCE(?, target_date),
                    status = COALESCE(?, status)
                WHERE id = ?
            ");
            $stmt->execute([
                $data['title'] ?? null,
                $data['description'] ?? null,
                $data['target_value'] ?? null,
                $data['current_value'] ?? null,
                $data['target_date'] ?? null,
                $data['status'] ?? null,
                $id
            ]);

            echo json_encode(['success' => true, 'message' => 'Goal updated']);
        }
        elseif ($resource === 'note') {
            $stmt = $pdo->prepare("
                UPDATE student_progress_notes SET
                    title = COALESCE(?, title),
                    content = COALESCE(?, content),
                    note_type = COALESCE(?, note_type),
                    is_private = COALESCE(?, is_private)
                WHERE id = ?
            ");
            $stmt->execute([
                $data['title'] ?? null,
                $data['content'] ?? null,
                $data['note_type'] ?? null,
                $data['is_private'] ?? null,
                $id
            ]);

            echo json_encode(['success' => true, 'message' => 'Note updated']);
        }
    }

    // DELETE
    elseif ($method === 'DELETE') {
        $id = $_GET['id'] ?? null;
        $resource = $_GET['resource'] ?? 'goal';

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID is required']);
            exit();
        }

        if ($resource === 'goal') {
            $pdo->prepare("DELETE FROM student_goals WHERE id = ?")->execute([$id]);
        } else {
            $pdo->prepare("DELETE FROM student_progress_notes WHERE id = ?")->execute([$id]);
        }

        echo json_encode(['success' => true, 'message' => 'Deleted successfully']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
