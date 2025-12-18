<?php
/**
 * Academic Operations API
 * Handles: Attendance, Grading, Homework, Enrollment
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

$method = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? null;
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // ============================================
    // ATTENDANCE
    // ============================================
    if ($resource === 'attendance') {
        switch ($method) {
            case 'GET':
                if ($action === 'stats') {
                    $class_id = $_GET['class_id'] ?? null;
                    $date = $_GET['date'] ?? date('Y-m-d');
                    
                    $sql = "SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
                        SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excused
                    FROM attendance WHERE date = ?";
                    $params = [$date];
                    
                    if ($class_id) {
                        $sql .= " AND class_id = ?";
                        $params[] = $class_id;
                    }
                    
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                    echo json_encode(['success' => true, 'stats' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("SELECT a.*, s.first_name, s.last_name, s.student_id FROM attendance a LEFT JOIN students s ON a.student_id = s.id WHERE a.id = ?");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'attendance' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                } else {
                    $class_id = $_GET['class_id'] ?? null;
                    $date = $_GET['date'] ?? date('Y-m-d');
                    
                    $sql = "SELECT a.*, s.first_name, s.last_name, s.student_id, c.class_name 
                            FROM attendance a 
                            LEFT JOIN students s ON a.student_id = s.id 
                            LEFT JOIN classes c ON a.class_id = c.id 
                            WHERE a.date = ?";
                    $params = [$date];
                    
                    if ($class_id) {
                        $sql .= " AND a.class_id = ?";
                        $params[] = $class_id;
                    }
                    
                    $sql .= " ORDER BY s.first_name, s.last_name";
                    
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                    echo json_encode(['success' => true, 'attendance' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                if ($action === 'mark_class') {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $pdo->beginTransaction();
                    
                    foreach ($data['students'] as $student) {
                        $stmt = $pdo->prepare("INSERT INTO attendance (student_id, class_id, term_id, date, status, time_in, marked_by) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=VALUES(status), time_in=VALUES(time_in)");
                        $stmt->execute([
                            $student['student_id'],
                            $data['class_id'],
                            $data['term_id'],
                            $data['date'],
                            $student['status'],
                            $student['time_in'] ?? null,
                            $data['marked_by'] ?? 1
                        ]);
                    }
                    
                    $pdo->commit();
                    echo json_encode(['success' => true, 'message' => 'Attendance marked successfully']);
                } else {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $stmt = $pdo->prepare("INSERT INTO attendance (student_id, class_id, term_id, date, status, time_in, marked_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
                    $stmt->execute([$data['student_id'], $data['class_id'], $data['term_id'], $data['date'], $data['status'], $data['time_in'] ?? null, $data['marked_by'] ?? 1]);
                    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                }
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("UPDATE attendance SET status=?, time_in=?, remarks=? WHERE id=?");
                $stmt->execute([$data['status'], $data['time_in'], $data['remarks'], $id]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // GRADING
    // ============================================
    elseif ($resource === 'assessments') {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $stmt = $pdo->prepare("SELECT a.*, c.class_name, s.subject_name, t.term_name FROM assessments a LEFT JOIN classes c ON a.class_id = c.id LEFT JOIN subjects s ON a.subject_id = s.id LEFT JOIN academic_terms t ON a.term_id = t.id WHERE a.id = ?");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'assessment' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                } else {
                    $stmt = $pdo->query("SELECT a.*, c.class_name, s.subject_name, t.term_name FROM assessments a LEFT JOIN classes c ON a.class_id = c.id LEFT JOIN subjects s ON a.subject_id = s.id LEFT JOIN academic_terms t ON a.term_id = t.id ORDER BY a.assessment_date DESC");
                    echo json_encode(['success' => true, 'assessments' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("INSERT INTO assessments (class_id, subject_id, term_id, assessment_name, assessment_type, total_marks, weight_percentage, assessment_date, description, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$data['class_id'], $data['subject_id'], $data['term_id'], $data['assessment_name'], $data['assessment_type'], $data['total_marks'], $data['weight_percentage'] ?? 100, $data['assessment_date'], $data['description'] ?? null, $data['created_by'] ?? 1]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("UPDATE assessments SET assessment_name=?, assessment_type=?, total_marks=?, weight_percentage=?, assessment_date=?, description=? WHERE id=?");
                $stmt->execute([$data['assessment_name'], $data['assessment_type'], $data['total_marks'], $data['weight_percentage'], $data['assessment_date'], $data['description'], $id]);
                echo json_encode(['success' => true]);
                break;

            case 'DELETE':
                $stmt = $pdo->prepare("DELETE FROM assessments WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    elseif ($resource === 'grades') {
        switch ($method) {
            case 'GET':
                if ($action === 'by_assessment') {
                    $assessment_id = $_GET['assessment_id'];
                    $stmt = $pdo->prepare("SELECT g.*, s.first_name, s.last_name, s.student_id FROM grades g LEFT JOIN students s ON g.student_id = s.id WHERE g.assessment_id = ? ORDER BY s.first_name");
                    $stmt->execute([$assessment_id]);
                    echo json_encode(['success' => true, 'grades' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                } elseif ($action === 'by_student') {
                    $student_id = $_GET['student_id'];
                    $stmt = $pdo->prepare("SELECT g.*, a.assessment_name, a.total_marks, s.subject_name FROM grades g LEFT JOIN assessments a ON g.assessment_id = a.id LEFT JOIN subjects s ON a.subject_id = s.id WHERE g.student_id = ? ORDER BY a.assessment_date DESC");
                    $stmt->execute([$student_id]);
                    echo json_encode(['success' => true, 'grades' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                if ($action === 'bulk') {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $pdo->beginTransaction();
                    
                    foreach ($data['grades'] as $grade) {
                        $stmt = $pdo->prepare("INSERT INTO grades (assessment_id, student_id, marks_obtained, grade, remarks, graded_by, graded_at) VALUES (?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE marks_obtained=VALUES(marks_obtained), grade=VALUES(grade), graded_at=NOW()");
                        $stmt->execute([$data['assessment_id'], $grade['student_id'], $grade['marks_obtained'], $grade['grade'], $grade['remarks'] ?? null, $data['graded_by'] ?? 1]);
                    }
                    
                    $pdo->commit();
                    echo json_encode(['success' => true, 'message' => 'Grades saved successfully']);
                } else {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $stmt = $pdo->prepare("INSERT INTO grades (assessment_id, student_id, marks_obtained, grade, remarks, graded_by, graded_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
                    $stmt->execute([$data['assessment_id'], $data['student_id'], $data['marks_obtained'], $data['grade'], $data['remarks'] ?? null, $data['graded_by'] ?? 1]);
                    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                }
                break;
        }
    }

    // ============================================
    // HOMEWORK
    // ============================================
    elseif ($resource === 'homework') {
        switch ($method) {
            case 'GET':
                if ($action === 'stats') {
                    $teacher_id = $_GET['teacher_id'] ?? null;
                    $stmt = $pdo->prepare("SELECT COUNT(*) as total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) as active FROM homework WHERE teacher_id = ?");
                    $stmt->execute([$teacher_id]);
                    echo json_encode(['success' => true, 'stats' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                } elseif ($id) {
                    $stmt = $pdo->prepare("SELECT h.*, c.class_name, s.subject_name, t.term_name FROM homework h LEFT JOIN classes c ON h.class_id = c.id LEFT JOIN subjects s ON h.subject_id = s.id LEFT JOIN academic_terms t ON h.term_id = t.id WHERE h.id = ?");
                    $stmt->execute([$id]);
                    $homework = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    // Get submissions with attachment
                    $stmt = $pdo->prepare("SELECT hs.id, hs.homework_id, hs.student_id, hs.submission_text, hs.attachment, hs.status, hs.marks_obtained, hs.score, hs.feedback, hs.submitted_at, hs.graded_at, hs.graded_by, st.first_name, st.last_name, st.student_id as admission_no FROM homework_submissions hs LEFT JOIN students st ON hs.student_id = st.id WHERE hs.homework_id = ?");
                    $stmt->execute([$id]);
                    $homework['submissions'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    echo json_encode(['success' => true, 'homework' => $homework]);
                } else {
                    $class_id = $_GET['class_id'] ?? null;
                    $teacher_id = $_GET['teacher_id'] ?? null;
                    
                    $sql = "SELECT h.*, c.class_name, s.subject_name, 
                           (SELECT COUNT(*) FROM homework_submissions WHERE homework_id = h.id) as submission_count,
                           (SELECT COUNT(*) FROM students WHERE class_id = h.class_id) as student_count
                           FROM homework h 
                           LEFT JOIN classes c ON h.class_id = c.id 
                           LEFT JOIN subjects s ON h.subject_id = s.id WHERE 1=1";
                    $params = [];
                    
                    if ($class_id) {
                        $sql .= " AND h.class_id = ?";
                        $params[] = $class_id;
                    }
                    if ($teacher_id) {
                        $sql .= " AND h.teacher_id = ?";
                        $params[] = $teacher_id;
                    }
                    
                    $sql .= " ORDER BY h.due_date DESC";
                    
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                    echo json_encode(['success' => true, 'homework' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("INSERT INTO homework (class_id, subject_id, term_id, teacher_id, title, description, due_date, total_marks, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([$data['class_id'], $data['subject_id'], $data['term_id'], $data['teacher_id'], $data['title'], $data['description'], $data['due_date'], $data['total_marks'] ?? 100, $data['status'] ?? 'active']);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("UPDATE homework SET title=?, description=?, due_date=?, total_marks=?, status=? WHERE id=?");
                $stmt->execute([$data['title'], $data['description'], $data['due_date'], $data['total_marks'], $data['status'], $id]);
                echo json_encode(['success' => true]);
                break;

            case 'DELETE':
                $stmt = $pdo->prepare("DELETE FROM homework WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    elseif ($resource === 'homework_submissions') {
        switch ($method) {
            case 'GET':
                $homework_id = $_GET['homework_id'] ?? null;
                $student_id = $_GET['student_id'] ?? null;
                
                $sql = "SELECT hs.*, st.first_name, st.last_name, st.student_id FROM homework_submissions hs LEFT JOIN students st ON hs.student_id = st.id WHERE 1=1";
                $params = [];
                
                if ($homework_id) {
                    $sql .= " AND hs.homework_id = ?";
                    $params[] = $homework_id;
                }
                if ($student_id) {
                    $sql .= " AND hs.student_id = ?";
                    $params[] = $student_id;
                }
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                echo json_encode(['success' => true, 'submissions' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                break;

            case 'POST':
                if ($action === 'submit') {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $stmt = $pdo->prepare("INSERT INTO homework_submissions (homework_id, student_id, submission_text, submitted_at, status) VALUES (?, ?, ?, NOW(), 'submitted')");
                    $stmt->execute([$data['homework_id'], $data['student_id'], $data['submission_text']]);
                    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                } elseif ($action === 'grade') {
                    $data = json_decode(file_get_contents('php://input'), true);
                    $stmt = $pdo->prepare("UPDATE homework_submissions SET marks_obtained=?, feedback=?, status='graded', graded_by=?, graded_at=NOW() WHERE id=?");
                    $stmt->execute([$data['marks_obtained'], $data['feedback'], $data['graded_by'] ?? 1, $id]);
                    echo json_encode(['success' => true]);
                }
                break;
        }
    }

    elseif ($resource === 'grades') {
        switch ($method) {
            case 'GET':
                $assessment_id = isset($_GET['assessment_id']) ? $_GET['assessment_id'] : null;
                if ($assessment_id) {
                    // Check if table exists first
                    try {
                        $tableCheck = $pdo->query("SHOW TABLES LIKE 'assessment_grades'");
                        if ($tableCheck->rowCount() === 0) {
                            echo json_encode(array('success' => true, 'grades' => array()));
                            break;
                        }
                    } catch (Exception $e) {
                        echo json_encode(array('success' => true, 'grades' => array()));
                        break;
                    }
                    
                    $stmt = $pdo->prepare("
                        SELECT ag.*, s.first_name, s.last_name, s.student_id as student_code
                        FROM assessment_grades ag
                        JOIN students s ON ag.student_id = s.id
                        WHERE ag.assessment_id = ?
                    ");
                    $stmt->execute(array($assessment_id));
                    echo json_encode(array('success' => true, 'grades' => $stmt->fetchAll(PDO::FETCH_ASSOC)));
                } else {
                    echo json_encode(array('success' => true, 'grades' => array()));
                }
                break;

            case 'POST':
                if ($action === 'bulk') {
                    $rawInput = file_get_contents('php://input');
                    $data = json_decode($rawInput, true);
                    $assessment_id = isset($data['assessment_id']) ? $data['assessment_id'] : null;
                    $grades = isset($data['grades']) ? $data['grades'] : array();
                    $graded_by = isset($data['graded_by']) ? $data['graded_by'] : 1;

                    // Debug logging
                    error_log("Grades API - Raw input: " . $rawInput);
                    error_log("Grades API - Assessment ID: " . $assessment_id);
                    error_log("Grades API - Grades count: " . count($grades));

                    if (!$assessment_id || empty($grades)) {
                        echo json_encode(array('success' => false, 'error' => 'Assessment ID and grades required', 'received' => $data, 'raw' => $rawInput));
                        break;
                    }

                    $pdo->beginTransaction();
                    try {
                        // Check if assessment_grades table exists, create if not
                        $pdo->exec("CREATE TABLE IF NOT EXISTS assessment_grades (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            assessment_id INT NOT NULL,
                            student_id INT NOT NULL,
                            marks_obtained DECIMAL(10,2),
                            grade VARCHAR(5),
                            comment TEXT,
                            graded_by INT,
                            graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                            UNIQUE KEY unique_assessment_student (assessment_id, student_id)
                        )");

                        $savedCount = 0;
                        foreach ($grades as $grade) {
                            $studentId = isset($grade['student_id']) ? $grade['student_id'] : null;
                            $marksObtained = isset($grade['marks_obtained']) ? $grade['marks_obtained'] : null;
                            $gradeValue = isset($grade['grade']) ? $grade['grade'] : null;
                            $comment = isset($grade['comment']) ? $grade['comment'] : '';
                            
                            if ($studentId && $marksObtained !== null && $marksObtained !== '') {
                                $stmt = $pdo->prepare("
                                    INSERT INTO assessment_grades (assessment_id, student_id, marks_obtained, grade, comment, graded_by)
                                    VALUES (?, ?, ?, ?, ?, ?)
                                    ON DUPLICATE KEY UPDATE 
                                        marks_obtained = VALUES(marks_obtained),
                                        grade = VALUES(grade),
                                        comment = VALUES(comment),
                                        graded_by = VALUES(graded_by),
                                        graded_at = NOW()
                                ");
                                $stmt->execute(array(
                                    $assessment_id,
                                    $studentId,
                                    $marksObtained,
                                    $gradeValue,
                                    $comment,
                                    $graded_by
                                ));
                                $savedCount++;
                            }
                        }
                        $pdo->commit();
                        echo json_encode(array('success' => true, 'message' => 'Grades saved successfully', 'count' => $savedCount, 'assessment_id' => $assessment_id));
                    } catch (Exception $e) {
                        $pdo->rollBack();
                        echo json_encode(array('success' => false, 'error' => $e->getMessage()));
                    }
                } else {
                    // Single grade save
                    $data = json_decode(file_get_contents('php://input'), true);
                    $stmt = $pdo->prepare("
                        INSERT INTO assessment_grades (assessment_id, student_id, marks_obtained, grade, comment, graded_by)
                        VALUES (?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                            marks_obtained = VALUES(marks_obtained),
                            grade = VALUES(grade),
                            comment = VALUES(comment),
                            graded_by = VALUES(graded_by),
                            graded_at = NOW()
                    ");
                    $stmt->execute(array(
                        $data['assessment_id'],
                        $data['student_id'],
                        $data['marks_obtained'],
                        isset($data['grade']) ? $data['grade'] : null,
                        isset($data['comment']) ? $data['comment'] : '',
                        isset($data['graded_by']) ? $data['graded_by'] : 1
                    ));
                    echo json_encode(array('success' => true));
                }
                break;
        }
    }

    else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid resource']);
    }

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
