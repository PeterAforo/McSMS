<?php
/**
 * Enhanced Teacher Management API
 * Handles teacher profiles, documents, leaves, evaluations, schedules, and more
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

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
$resource = $_GET['resource'] ?? 'teachers';
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    switch ($method) {
        case 'GET':
            handleGet($pdo, $resource, $action, $id);
            break;
        case 'POST':
            handlePost($pdo, $resource, $action, $id);
            break;
        case 'PUT':
            handlePut($pdo, $resource, $id);
            break;
        case 'DELETE':
            handleDelete($pdo, $resource, $id);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

function handleGet($pdo, $resource, $action, $id) {
    switch ($resource) {
        case 'teachers':
            if ($action === 'profile' && $id) {
                // Get full teacher profile with all related data
                $stmt = $pdo->prepare("
                    SELECT t.*, 
                           c.class_name as assigned_class,
                           u.last_login
                    FROM teachers t 
                    LEFT JOIN classes c ON c.class_teacher_id = t.id
                    LEFT JOIN users u ON t.user_id = u.id
                    WHERE t.id = ?
                ");
                $stmt->execute([$id]);
                $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$teacher) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Teacher not found']);
                    return;
                }
                
                // Get documents
                $stmt = $pdo->prepare("SELECT * FROM teacher_documents WHERE teacher_id = ? ORDER BY created_at DESC LIMIT 10");
                $stmt->execute([$id]);
                $teacher['documents'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get leaves
                $stmt = $pdo->prepare("SELECT * FROM teacher_leaves WHERE teacher_id = ? ORDER BY created_at DESC LIMIT 10");
                $stmt->execute([$id]);
                $teacher['leaves'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get leave balance
                $year = date('Y');
                $stmt = $pdo->prepare("SELECT * FROM teacher_leave_balances WHERE teacher_id = ? AND academic_year = ?");
                $stmt->execute([$id, $year]);
                $teacher['leave_balance'] = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Get evaluations
                $stmt = $pdo->prepare("SELECT * FROM teacher_evaluations WHERE teacher_id = ? ORDER BY evaluation_date DESC LIMIT 5");
                $stmt->execute([$id]);
                $teacher['evaluations'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get qualifications
                $stmt = $pdo->prepare("SELECT * FROM teacher_qualifications WHERE teacher_id = ? ORDER BY year_obtained DESC");
                $stmt->execute([$id]);
                $teacher['qualifications'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get awards
                $stmt = $pdo->prepare("SELECT * FROM teacher_awards WHERE teacher_id = ? ORDER BY award_date DESC");
                $stmt->execute([$id]);
                $teacher['awards'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get notes
                $stmt = $pdo->prepare("SELECT * FROM teacher_notes WHERE teacher_id = ? ORDER BY created_at DESC LIMIT 10");
                $stmt->execute([$id]);
                $teacher['notes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get timeline
                $stmt = $pdo->prepare("SELECT * FROM teacher_timeline WHERE teacher_id = ? ORDER BY event_date DESC, created_at DESC LIMIT 20");
                $stmt->execute([$id]);
                $teacher['timeline'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get ID card
                $stmt = $pdo->prepare("SELECT * FROM teacher_id_cards WHERE teacher_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1");
                $stmt->execute([$id]);
                $teacher['id_card'] = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Get schedule
                $stmt = $pdo->prepare("
                    SELECT ts.*, c.class_name, s.subject_name 
                    FROM teacher_schedules ts
                    LEFT JOIN classes c ON ts.class_id = c.id
                    LEFT JOIN subjects s ON ts.subject_id = s.id
                    WHERE ts.teacher_id = ?
                    ORDER BY FIELD(ts.day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'), ts.period_number
                ");
                $stmt->execute([$id]);
                $teacher['schedule'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get assigned subjects from class_subjects
                $stmt = $pdo->prepare("
                    SELECT cs.*, s.subject_name, c.class_name 
                    FROM class_subjects cs
                    JOIN subjects s ON cs.subject_id = s.id
                    JOIN classes c ON cs.class_id = c.id
                    WHERE cs.teacher_id = ?
                ");
                $stmt->execute([$id]);
                $teacher['subjects'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Also get from teacher_subjects if class_subjects is empty
                if (empty($teacher['subjects'])) {
                    $stmt = $pdo->prepare("
                        SELECT ts.*, s.subject_name, c.class_name 
                        FROM teacher_subjects ts
                        JOIN subjects s ON ts.subject_id = s.id
                        JOIN classes c ON ts.class_id = c.id
                        WHERE ts.teacher_id = ?
                    ");
                    $stmt->execute([$id]);
                    $teacher['subjects'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                }
                
                // Calculate workload
                $stmt = $pdo->prepare("SELECT COUNT(*) as periods FROM teacher_schedules WHERE teacher_id = ? AND schedule_type = 'teaching'");
                $stmt->execute([$id]);
                $teacher['workload'] = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'teacher' => $teacher]);
                
            } elseif ($action === 'stats') {
                // Get teacher statistics
                $stats = [];
                
                $stmt = $pdo->query("SELECT COUNT(*) as total FROM teachers");
                $stats['total'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
                
                $stmt = $pdo->query("SELECT COUNT(*) as active FROM teachers WHERE status = 'active'");
                $stats['active'] = $stmt->fetch(PDO::FETCH_ASSOC)['active'];
                
                $stmt = $pdo->query("SELECT COUNT(*) as on_leave FROM teachers WHERE status = 'on-leave'");
                $stats['on_leave'] = $stmt->fetch(PDO::FETCH_ASSOC)['on_leave'];
                
                $stmt = $pdo->query("SELECT COUNT(*) as full_time FROM teachers WHERE employment_type = 'full-time'");
                $stats['full_time'] = $stmt->fetch(PDO::FETCH_ASSOC)['full_time'];
                
                $stmt = $pdo->query("SELECT COUNT(*) as part_time FROM teachers WHERE employment_type = 'part-time'");
                $stats['part_time'] = $stmt->fetch(PDO::FETCH_ASSOC)['part_time'];
                
                $stmt = $pdo->query("SELECT COUNT(*) as pending_leaves FROM teacher_leaves WHERE status = 'pending'");
                $stats['pending_leaves'] = $stmt->fetch(PDO::FETCH_ASSOC)['pending_leaves'];
                
                echo json_encode(['success' => true, 'stats' => $stats]);
                
            } else {
                // List all teachers
                $status = $_GET['status'] ?? '';
                $employment = $_GET['employment_type'] ?? '';
                $search = $_GET['search'] ?? '';
                
                $sql = "SELECT t.*, c.class_name as assigned_class FROM teachers t LEFT JOIN classes c ON c.class_teacher_id = t.id WHERE 1=1";
                $params = [];
                
                if ($status) {
                    $sql .= " AND t.status = ?";
                    $params[] = $status;
                }
                if ($employment) {
                    $sql .= " AND t.employment_type = ?";
                    $params[] = $employment;
                }
                if ($search) {
                    $sql .= " AND (t.first_name LIKE ? OR t.last_name LIKE ? OR t.email LIKE ? OR t.teacher_id LIKE ?)";
                    $searchTerm = "%$search%";
                    $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
                }
                
                $sql .= " ORDER BY t.first_name, t.last_name";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'teachers' => $teachers]);
            }
            break;
            
        case 'leaves':
            if ($id) {
                $stmt = $pdo->prepare("
                    SELECT tl.*, t.first_name, t.last_name, t.teacher_id as teacher_code
                    FROM teacher_leaves tl
                    JOIN teachers t ON tl.teacher_id = t.id
                    WHERE tl.id = ?
                ");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'leave' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            } else {
                $teacherId = $_GET['teacher_id'] ?? '';
                $status = $_GET['status'] ?? '';
                
                $sql = "
                    SELECT tl.*, t.first_name, t.last_name, t.teacher_id as teacher_code
                    FROM teacher_leaves tl
                    JOIN teachers t ON tl.teacher_id = t.id
                    WHERE 1=1
                ";
                $params = [];
                
                if ($teacherId) {
                    $sql .= " AND tl.teacher_id = ?";
                    $params[] = $teacherId;
                }
                if ($status) {
                    $sql .= " AND tl.status = ?";
                    $params[] = $status;
                }
                
                $sql .= " ORDER BY tl.created_at DESC";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                echo json_encode(['success' => true, 'leaves' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;
            
        case 'evaluations':
            $teacherId = $_GET['teacher_id'] ?? '';
            $sql = "
                SELECT te.*, t.first_name, t.last_name, 
                       CONCAT(u.first_name, ' ', u.last_name) as evaluator_name
                FROM teacher_evaluations te
                JOIN teachers t ON te.teacher_id = t.id
                LEFT JOIN users u ON te.evaluator_id = u.id
                WHERE 1=1
            ";
            $params = [];
            
            if ($teacherId) {
                $sql .= " AND te.teacher_id = ?";
                $params[] = $teacherId;
            }
            
            $sql .= " ORDER BY te.evaluation_date DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['success' => true, 'evaluations' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
            
        case 'schedule':
            $teacherId = $_GET['teacher_id'] ?? '';
            if (!$teacherId) {
                echo json_encode(['success' => false, 'error' => 'Teacher ID required']);
                return;
            }
            
            $stmt = $pdo->prepare("
                SELECT ts.*, c.class_name, s.subject_name 
                FROM teacher_schedules ts
                LEFT JOIN classes c ON ts.class_id = c.id
                LEFT JOIN subjects s ON ts.subject_id = s.id
                WHERE ts.teacher_id = ?
                ORDER BY FIELD(ts.day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'), ts.period_number
            ");
            $stmt->execute([$teacherId]);
            echo json_encode(['success' => true, 'schedule' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
            
        case 'documents':
            $teacherId = $_GET['teacher_id'] ?? '';
            $sql = "SELECT * FROM teacher_documents WHERE 1=1";
            $params = [];
            
            if ($teacherId) {
                $sql .= " AND teacher_id = ?";
                $params[] = $teacherId;
            }
            
            $sql .= " ORDER BY created_at DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['success' => true, 'documents' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
            
        case 'qualifications':
            $teacherId = $_GET['teacher_id'] ?? '';
            $stmt = $pdo->prepare("SELECT * FROM teacher_qualifications WHERE teacher_id = ? ORDER BY year_obtained DESC");
            $stmt->execute([$teacherId]);
            echo json_encode(['success' => true, 'qualifications' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
            
        case 'awards':
            $teacherId = $_GET['teacher_id'] ?? '';
            $stmt = $pdo->prepare("SELECT * FROM teacher_awards WHERE teacher_id = ? ORDER BY award_date DESC");
            $stmt->execute([$teacherId]);
            echo json_encode(['success' => true, 'awards' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
            
        case 'notes':
            $teacherId = $_GET['teacher_id'] ?? '';
            $stmt = $pdo->prepare("
                SELECT tn.*, u.name as created_by_name 
                FROM teacher_notes tn
                LEFT JOIN users u ON tn.created_by = u.id
                WHERE tn.teacher_id = ? 
                ORDER BY tn.created_at DESC
            ");
            $stmt->execute([$teacherId]);
            echo json_encode(['success' => true, 'notes' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
            
        case 'timeline':
            $teacherId = $_GET['teacher_id'] ?? '';
            $stmt = $pdo->prepare("SELECT * FROM teacher_timeline WHERE teacher_id = ? ORDER BY event_date DESC, created_at DESC");
            $stmt->execute([$teacherId]);
            echo json_encode(['success' => true, 'timeline' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;
    }
}

function handlePost($pdo, $resource, $action, $id) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($resource) {
        case 'leaves':
            // Apply for leave
            $stmt = $pdo->prepare("
                INSERT INTO teacher_leaves (teacher_id, leave_type, start_date, end_date, days_count, reason, attachment)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $startDate = new DateTime($data['start_date']);
            $endDate = new DateTime($data['end_date']);
            $daysCount = $endDate->diff($startDate)->days + 1;
            
            $stmt->execute([
                $data['teacher_id'],
                $data['leave_type'],
                $data['start_date'],
                $data['end_date'],
                $daysCount,
                $data['reason'],
                $data['attachment'] ?? null
            ]);
            
            // Add to timeline
            $stmt = $pdo->prepare("
                INSERT INTO teacher_timeline (teacher_id, event_type, title, description, event_date)
                VALUES (?, 'leave', ?, ?, ?)
            ");
            $stmt->execute([
                $data['teacher_id'],
                'Leave Application Submitted',
                ucfirst($data['leave_type']) . " leave from {$data['start_date']} to {$data['end_date']}",
                $data['start_date']
            ]);
            
            echo json_encode(['success' => true, 'message' => 'Leave application submitted']);
            break;
            
        case 'leaves_action':
            // Approve/Reject leave - Only admin, principal, or HR can do this
            $leaveId = $data['leave_id'] ?? null;
            $action = $data['action'] ?? null; // approve or reject
            $approvedBy = $data['approved_by'] ?? null;
            
            if (!$leaveId || !$action) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Leave ID and action are required']);
                return;
            }
            
            // Verify the user has permission to approve/reject leaves
            if ($approvedBy) {
                $stmt = $pdo->prepare("SELECT role FROM users WHERE id = ?");
                $stmt->execute([$approvedBy]);
                $userRole = $stmt->fetchColumn();
                
                $allowedRoles = ['admin', 'principal', 'hr'];
                if (!in_array($userRole, $allowedRoles)) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'error' => 'Only Principal, HR, or Admin can approve/reject leaves']);
                    return;
                }
            }
            
            if ($action === 'approve') {
                $stmt = $pdo->prepare("
                    UPDATE teacher_leaves 
                    SET status = 'approved', approved_by = ?, approved_date = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$data['approved_by'], $leaveId]);
                
                // Update leave balance
                $stmt = $pdo->prepare("SELECT * FROM teacher_leaves WHERE id = ?");
                $stmt->execute([$leaveId]);
                $leave = $stmt->fetch(PDO::FETCH_ASSOC);
                
                $year = date('Y');
                $leaveType = $leave['leave_type'];
                $column = $leaveType . '_leave_used';
                
                // Check if column exists and update
                $stmt = $pdo->prepare("
                    UPDATE teacher_leave_balances 
                    SET {$column} = {$column} + ?
                    WHERE teacher_id = ? AND academic_year = ?
                ");
                $stmt->execute([$leave['days_count'], $leave['teacher_id'], $year]);
                
            } else {
                $stmt = $pdo->prepare("
                    UPDATE teacher_leaves 
                    SET status = 'rejected', approved_by = ?, approved_date = NOW(), rejection_reason = ?
                    WHERE id = ?
                ");
                $stmt->execute([$data['approved_by'], $data['rejection_reason'] ?? 'Rejected', $leaveId]);
            }
            
            echo json_encode(['success' => true, 'message' => 'Leave ' . $action . 'd successfully']);
            break;
            
        case 'evaluations':
            // Create evaluation
            $metrics = ['teaching_quality', 'classroom_management', 'student_engagement', 'lesson_planning', 
                       'punctuality', 'professionalism', 'communication', 'teamwork'];
            $total = 0;
            $count = 0;
            foreach ($metrics as $metric) {
                if (isset($data[$metric]) && $data[$metric]) {
                    $total += $data[$metric];
                    $count++;
                }
            }
            $overallRating = $count > 0 ? round($total / $count, 2) : null;
            
            $stmt = $pdo->prepare("
                INSERT INTO teacher_evaluations (
                    teacher_id, academic_year, term, evaluator_id, evaluation_date,
                    teaching_quality, classroom_management, student_engagement, lesson_planning,
                    punctuality, professionalism, communication, teamwork,
                    overall_rating, strengths, areas_for_improvement, goals, comments, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['teacher_id'],
                $data['academic_year'],
                $data['term'],
                $data['evaluator_id'],
                $data['evaluation_date'],
                $data['teaching_quality'] ?? null,
                $data['classroom_management'] ?? null,
                $data['student_engagement'] ?? null,
                $data['lesson_planning'] ?? null,
                $data['punctuality'] ?? null,
                $data['professionalism'] ?? null,
                $data['communication'] ?? null,
                $data['teamwork'] ?? null,
                $overallRating,
                $data['strengths'] ?? null,
                $data['areas_for_improvement'] ?? null,
                $data['goals'] ?? null,
                $data['comments'] ?? null,
                $data['status'] ?? 'submitted'
            ]);
            
            // Add to timeline
            $stmt = $pdo->prepare("
                INSERT INTO teacher_timeline (teacher_id, event_type, title, description, event_date, created_by)
                VALUES (?, 'evaluation', ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['teacher_id'],
                'Performance Evaluation',
                "Evaluation for {$data['term']} {$data['academic_year']} - Rating: {$overallRating}/5",
                $data['evaluation_date'],
                $data['evaluator_id']
            ]);
            
            echo json_encode(['success' => true, 'message' => 'Evaluation saved']);
            break;
            
        case 'qualifications':
            $stmt = $pdo->prepare("
                INSERT INTO teacher_qualifications (teacher_id, qualification_type, title, institution, year_obtained, grade, document_path, expiry_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['teacher_id'],
                $data['qualification_type'],
                $data['title'],
                $data['institution'],
                $data['year_obtained'],
                $data['grade'] ?? null,
                $data['document_path'] ?? null,
                $data['expiry_date'] ?? null
            ]);
            
            echo json_encode(['success' => true, 'message' => 'Qualification added']);
            break;
            
        case 'awards':
            $stmt = $pdo->prepare("
                INSERT INTO teacher_awards (teacher_id, award_type, title, description, awarded_by, award_date, certificate_path)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['teacher_id'],
                $data['award_type'],
                $data['title'],
                $data['description'] ?? null,
                $data['awarded_by'] ?? null,
                $data['award_date'],
                $data['certificate_path'] ?? null
            ]);
            
            // Add to timeline
            $stmt = $pdo->prepare("
                INSERT INTO teacher_timeline (teacher_id, event_type, title, description, event_date)
                VALUES (?, 'award', ?, ?, ?)
            ");
            $stmt->execute([
                $data['teacher_id'],
                'Award Received: ' . $data['title'],
                $data['description'] ?? 'Received ' . $data['title'],
                $data['award_date']
            ]);
            
            echo json_encode(['success' => true, 'message' => 'Award added']);
            break;
            
        case 'notes':
            $stmt = $pdo->prepare("
                INSERT INTO teacher_notes (teacher_id, note_type, title, content, is_confidential, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['teacher_id'],
                $data['note_type'],
                $data['title'],
                $data['content'],
                $data['is_confidential'] ?? false,
                $data['created_by']
            ]);
            
            echo json_encode(['success' => true, 'message' => 'Note added']);
            break;
            
        case 'id_card':
            // Generate ID card
            $teacherId = $data['teacher_id'] ?? null;
            
            if (!$teacherId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Teacher ID is required']);
                return;
            }
            
            // Get teacher info
            $stmt = $pdo->prepare("SELECT * FROM teachers WHERE id = ?");
            $stmt->execute([$teacherId]);
            $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$teacher) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Teacher not found']);
                return;
            }
            
            // Expire old cards
            $stmt = $pdo->prepare("UPDATE teacher_id_cards SET status = 'replaced' WHERE teacher_id = ? AND status = 'active'");
            $stmt->execute([$teacherId]);
            
            // Generate unique card number (TID + Year + TeacherID + Sequence)
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM teacher_id_cards WHERE teacher_id = ?");
            $stmt->execute([$teacherId]);
            $cardCount = $stmt->fetchColumn() + 1;
            $cardNumber = 'TID' . date('Y') . str_pad($teacherId, 4, '0', STR_PAD_LEFT) . '-' . $cardCount;
            
            // Create new card
            $stmt = $pdo->prepare("
                INSERT INTO teacher_id_cards (teacher_id, card_number, issue_date, expiry_date, photo_path, printed_by, printed_at)
                VALUES (?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), ?, ?, NOW())
            ");
            $stmt->execute([
                $teacherId,
                $cardNumber,
                $teacher['profile_picture'],
                $data['printed_by'] ?? null
            ]);
            
            // Add to timeline
            $stmt = $pdo->prepare("
                INSERT INTO teacher_timeline (teacher_id, event_type, title, description, event_date)
                VALUES (?, 'other', 'ID Card Generated', ?, CURDATE())
            ");
            $stmt->execute([$teacherId, "ID Card Number: $cardNumber"]);
            
            echo json_encode(['success' => true, 'message' => 'ID Card generated', 'card_number' => $cardNumber]);
            break;
            
        case 'timeline':
            $stmt = $pdo->prepare("
                INSERT INTO teacher_timeline (teacher_id, event_type, title, description, event_date, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['teacher_id'],
                $data['event_type'],
                $data['title'],
                $data['description'] ?? null,
                $data['event_date'],
                $data['created_by'] ?? null
            ]);
            
            echo json_encode(['success' => true, 'message' => 'Timeline event added']);
            break;
    }
}

function handlePut($pdo, $resource, $id) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    switch ($resource) {
        case 'teachers':
            // Update teacher profile
            $fields = [];
            $values = [];
            
            $allowedFields = [
                'first_name', 'last_name', 'email', 'phone', 'date_of_birth', 'gender',
                'address', 'qualification', 'specialization', 'hire_date', 'employment_type',
                'status', 'national_id', 'emergency_contact_name', 'emergency_contact_phone',
                'emergency_contact_relationship', 'bank_name', 'bank_account_number', 'bank_branch',
                'salary', 'contract_start_date', 'contract_end_date', 'bio', 'profile_picture'
            ];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $fields[] = "$field = ?";
                    $values[] = $data[$field];
                }
            }
            
            if (empty($fields)) {
                echo json_encode(['success' => false, 'error' => 'No fields to update']);
                return;
            }
            
            $values[] = $id;
            $sql = "UPDATE teachers SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($values);
            
            echo json_encode(['success' => true, 'message' => 'Teacher updated']);
            break;
            
        case 'evaluations':
            // Update evaluation (e.g., teacher response)
            $stmt = $pdo->prepare("
                UPDATE teacher_evaluations 
                SET teacher_response = ?, status = 'acknowledged'
                WHERE id = ?
            ");
            $stmt->execute([$data['teacher_response'], $id]);
            
            echo json_encode(['success' => true, 'message' => 'Response saved']);
            break;
    }
}

function handleDelete($pdo, $resource, $id) {
    $table = '';
    switch ($resource) {
        case 'documents': $table = 'teacher_documents'; break;
        case 'qualifications': $table = 'teacher_qualifications'; break;
        case 'awards': $table = 'teacher_awards'; break;
        case 'notes': $table = 'teacher_notes'; break;
        case 'leaves': $table = 'teacher_leaves'; break;
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid resource']);
            return;
    }
    
    $stmt = $pdo->prepare("DELETE FROM $table WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode(['success' => true, 'message' => 'Deleted successfully']);
}
