<?php
/**
 * Enhanced Student Management API
 * Features: CRUD, Bulk Operations, Documents, Promotions, Timeline, ID Cards, Awards, Discipline
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? 'students';
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    switch ($resource) {
        case 'students':
            handleStudents($pdo, $method, $action, $id);
            break;
        case 'documents':
            handleDocuments($pdo, $method, $action, $id);
            break;
        case 'promotions':
            handlePromotions($pdo, $method, $action, $id);
            break;
        case 'timeline':
            handleTimeline($pdo, $method, $action, $id);
            break;
        case 'id_cards':
            handleIdCards($pdo, $method, $action, $id);
            break;
        case 'awards':
            handleAwards($pdo, $method, $action, $id);
            break;
        case 'discipline':
            handleDiscipline($pdo, $method, $action, $id);
            break;
        case 'medical':
            handleMedical($pdo, $method, $action, $id);
            break;
        case 'notes':
            handleNotes($pdo, $method, $action, $id);
            break;
        case 'bulk':
            handleBulkOperations($pdo, $method, $action);
            break;
        case 'stats':
            handleStats($pdo, $method);
            break;
        default:
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Resource not found']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// ============================================
// STUDENTS HANDLER
// ============================================
function handleStudents($pdo, $method, $action, $id) {
    switch ($method) {
        case 'GET':
            if ($action === 'search') {
                // Advanced search
                $query = $_GET['q'] ?? '';
                $limitInt = (int)($_GET['limit'] ?? 20);
                $stmt = $pdo->prepare("
                    SELECT s.*, c.class_name 
                    FROM students s 
                    LEFT JOIN classes c ON s.class_id = c.id
                    WHERE s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ? OR s.email LIKE ?
                    ORDER BY s.first_name
                    LIMIT $limitInt
                ");
                $search = "%$query%";
                $stmt->execute([$search, $search, $search, $search]);
                echo json_encode(['success' => true, 'students' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            } elseif ($action === 'by_class') {
                $classId = $_GET['class_id'] ?? null;
                $stmt = $pdo->prepare("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.class_id = ? ORDER BY s.first_name");
                $stmt->execute([$classId]);
                echo json_encode(['success' => true, 'students' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            } elseif ($action === 'by_parent') {
                $parentId = $_GET['parent_id'] ?? null;
                $stmt = $pdo->prepare("
                    SELECT s.*, c.class_name 
                    FROM students s 
                    LEFT JOIN classes c ON s.class_id = c.id
                    LEFT JOIN parent_student_links psl ON s.id = psl.student_id
                    WHERE s.parent_id = ? OR psl.parent_id = ?
                    ORDER BY s.first_name
                ");
                $stmt->execute([$parentId, $parentId]);
                echo json_encode(['success' => true, 'students' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            } elseif ($action === 'profile' && $id) {
                // Get full student profile with all related data including class teacher
                $stmt = $pdo->prepare("
                    SELECT s.*, c.class_name, 
                           COALESCE(u.name, CONCAT(t.first_name, ' ', t.last_name)) as class_teacher
                    FROM students s 
                    LEFT JOIN classes c ON s.class_id = c.id 
                    LEFT JOIN users u ON c.class_teacher_id = u.id
                    LEFT JOIN teachers t ON c.class_teacher_id = t.id
                    WHERE s.id = ?
                ");
                $stmt->execute([$id]);
                $student = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$student) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'error' => 'Student not found']);
                    return;
                }
                
                // Get documents (wrap in try-catch in case table doesn't exist)
                try {
                    $stmt = $pdo->prepare("SELECT * FROM student_documents WHERE student_id = ? ORDER BY created_at DESC LIMIT 10");
                    $stmt->execute([$id]);
                    $student['documents'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } catch (Exception $e) { $student['documents'] = []; }
                
                // Get timeline
                try {
                    $stmt = $pdo->prepare("SELECT * FROM student_timeline WHERE student_id = ? ORDER BY event_date DESC LIMIT 20");
                    $stmt->execute([$id]);
                    $student['timeline'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } catch (Exception $e) { $student['timeline'] = []; }
                
                // Get awards
                try {
                    $stmt = $pdo->prepare("SELECT * FROM student_awards WHERE student_id = ? ORDER BY award_date DESC");
                    $stmt->execute([$id]);
                    $student['awards'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } catch (Exception $e) { $student['awards'] = []; }
                
                // Get discipline records
                try {
                    $stmt = $pdo->prepare("SELECT * FROM student_discipline WHERE student_id = ? ORDER BY incident_date DESC");
                    $stmt->execute([$id]);
                    $student['discipline'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } catch (Exception $e) { $student['discipline'] = []; }
                
                // Get notes
                try {
                    $stmt = $pdo->prepare("SELECT * FROM student_notes WHERE student_id = ? AND is_private = FALSE ORDER BY created_at DESC LIMIT 10");
                    $stmt->execute([$id]);
                    $student['notes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } catch (Exception $e) { $student['notes'] = []; }
                
                // Get ID card
                try {
                    $stmt = $pdo->prepare("SELECT * FROM student_id_cards WHERE student_id = ? ORDER BY id DESC LIMIT 1");
                    $stmt->execute([$id]);
                    $student['id_card'] = $stmt->fetch(PDO::FETCH_ASSOC);
                } catch (Exception $e) { $student['id_card'] = null; }
                
                // Get attendance summary
                try {
                    $stmt = $pdo->prepare("
                        SELECT 
                            COUNT(*) as total_days,
                            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
                            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
                            SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late
                        FROM attendance WHERE student_id = ?
                    ");
                    $stmt->execute([$id]);
                    $student['attendance_summary'] = $stmt->fetch(PDO::FETCH_ASSOC);
                } catch (Exception $e) { $student['attendance_summary'] = null; }
                
                // Get exam results summary
                try {
                    $stmt = $pdo->prepare("
                        SELECT AVG(percentage) as average_score, COUNT(*) as total_exams
                        FROM exam_results WHERE student_id = ?
                    ");
                    $stmt->execute([$id]);
                    $student['exam_summary'] = $stmt->fetch(PDO::FETCH_ASSOC);
                } catch (Exception $e) { $student['exam_summary'] = null; }
                
                // Get fee summary
                try {
                    $stmt = $pdo->prepare("
                        SELECT 
                            SUM(total_amount) as total_fees,
                            SUM(paid_amount) as total_paid,
                            SUM(balance) as balance
                        FROM invoices WHERE student_id = ?
                    ");
                    $stmt->execute([$id]);
                    $student['fee_summary'] = $stmt->fetch(PDO::FETCH_ASSOC);
                } catch (Exception $e) { $student['fee_summary'] = null; }
                
                echo json_encode(['success' => true, 'student' => $student]);
            } elseif ($id) {
                $stmt = $pdo->prepare("SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.id = ?");
                $stmt->execute([$id]);
                $student = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'student' => $student]);
            } else {
                // List all with pagination
                $page = (int)($_GET['page'] ?? 1);
                $limit = (int)($_GET['limit'] ?? 50);
                $offset = ($page - 1) * $limit;
                $search = $_GET['search'] ?? '';
                $status = $_GET['status'] ?? '';
                $classId = $_GET['class_id'] ?? '';
                
                $where = "1=1";
                $params = [];
                
                if ($search) {
                    $where .= " AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ?)";
                    $params[] = "%$search%";
                    $params[] = "%$search%";
                    $params[] = "%$search%";
                }
                if ($status) {
                    $where .= " AND s.status = ?";
                    $params[] = $status;
                }
                if ($classId) {
                    $where .= " AND s.class_id = ?";
                    $params[] = $classId;
                }
                
                // Get total
                $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM students s WHERE $where");
                $stmt->execute($params);
                $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
                
                // Get students
                $stmt = $pdo->prepare("
                    SELECT s.*, c.class_name 
                    FROM students s 
                    LEFT JOIN classes c ON s.class_id = c.id
                    WHERE $where
                    ORDER BY s.created_at DESC
                    LIMIT $limit OFFSET $offset
                ");
                $stmt->execute($params);
                
                echo json_encode([
                    'success' => true,
                    'students' => $stmt->fetchAll(PDO::FETCH_ASSOC),
                    'pagination' => ['total' => $total, 'page' => $page, 'limit' => $limit, 'pages' => ceil($total / $limit)]
                ]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (empty($data['first_name']) || empty($data['last_name'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'First name and last name are required']);
                return;
            }
            
            // Generate student ID if not provided
            if (empty($data['student_id'])) {
                $year = date('Y');
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM students WHERE YEAR(created_at) = $year");
                $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'] + 1;
                $data['student_id'] = "STU{$year}" . str_pad($count, 4, '0', STR_PAD_LEFT);
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO students (student_id, first_name, last_name, other_names, date_of_birth, gender, 
                    blood_group, nationality, religion, email, phone, address, city, region, class_id,
                    admission_date, admission_number, previous_school, status, guardian_name, guardian_phone,
                    guardian_email, guardian_relationship, guardian_address, emergency_contact_name,
                    emergency_contact_phone, emergency_contact_relationship, medical_conditions, allergies,
                    medications, notes, parent_id, academic_year, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $data['student_id'], $data['first_name'], $data['last_name'], $data['other_names'] ?? null,
                $data['date_of_birth'] ?? null, $data['gender'] ?? 'male', $data['blood_group'] ?? null,
                $data['nationality'] ?? 'Ghanaian', $data['religion'] ?? null, $data['email'] ?? null,
                $data['phone'] ?? null, $data['address'] ?? null, $data['city'] ?? null, $data['region'] ?? null,
                $data['class_id'] ?? null, $data['admission_date'] ?? date('Y-m-d'), $data['admission_number'] ?? null,
                $data['previous_school'] ?? null, $data['status'] ?? 'active', $data['guardian_name'] ?? null,
                $data['guardian_phone'] ?? null, $data['guardian_email'] ?? null, $data['guardian_relationship'] ?? null,
                $data['guardian_address'] ?? null, $data['emergency_contact_name'] ?? null,
                $data['emergency_contact_phone'] ?? null, $data['emergency_contact_relationship'] ?? null,
                $data['medical_conditions'] ?? null, $data['allergies'] ?? null, $data['medications'] ?? null,
                $data['notes'] ?? null, $data['parent_id'] ?? null, $data['academic_year'] ?? null
            ]);
            
            $studentId = $pdo->lastInsertId();
            
            // Add to timeline
            addToTimeline($pdo, $studentId, 'admission', 'Student Admitted', 'New student enrolled in the school', date('Y-m-d'));
            
            $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
            $stmt->execute([$studentId]);
            
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Student created', 'student' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Student ID required']);
                return;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $updates = [];
            $params = [];
            
            $allowedFields = ['first_name', 'last_name', 'other_names', 'date_of_birth', 'gender', 'blood_group',
                'nationality', 'religion', 'email', 'phone', 'address', 'city', 'region', 'class_id',
                'admission_date', 'status', 'guardian_name', 'guardian_phone', 'guardian_email',
                'guardian_relationship', 'medical_conditions', 'allergies', 'medications', 'notes',
                'profile_picture', 'parent_id', 'academic_year', 'special_needs', 'transportation', 'bus_route'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'No fields to update']);
                return;
            }
            
            $params[] = $id;
            $stmt = $pdo->prepare("UPDATE students SET " . implode(', ', $updates) . " WHERE id = ?");
            $stmt->execute($params);
            
            $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode(['success' => true, 'message' => 'Student updated', 'student' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Student ID required']);
                return;
            }
            
            $stmt = $pdo->prepare("DELETE FROM students WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode(['success' => true, 'message' => 'Student deleted']);
            break;
    }
}

// ============================================
// DOCUMENTS HANDLER
// ============================================
function handleDocuments($pdo, $method, $action, $id) {
    $studentId = $_GET['student_id'] ?? null;
    
    switch ($method) {
        case 'GET':
            if ($studentId) {
                $stmt = $pdo->prepare("SELECT * FROM student_documents WHERE student_id = ? ORDER BY created_at DESC");
                $stmt->execute([$studentId]);
            } elseif ($id) {
                $stmt = $pdo->prepare("SELECT * FROM student_documents WHERE id = ?");
                $stmt->execute([$id]);
            } else {
                $limitInt = (int)($_GET['limit'] ?? 50);
                $stmt = $pdo->query("SELECT sd.*, s.first_name, s.last_name FROM student_documents sd JOIN students s ON sd.student_id = s.id ORDER BY sd.created_at DESC LIMIT $limitInt");
            }
            echo json_encode(['success' => true, 'documents' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                INSERT INTO student_documents (student_id, document_type, document_name, file_path, file_size, file_type, description, uploaded_by, expiry_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['student_id'], $data['document_type'], $data['document_name'], $data['file_path'],
                $data['file_size'] ?? null, $data['file_type'] ?? null, $data['description'] ?? null,
                $data['uploaded_by'] ?? null, $data['expiry_date'] ?? null
            ]);
            
            addToTimeline($pdo, $data['student_id'], 'document', 'Document Uploaded', $data['document_name'], date('Y-m-d'));
            
            echo json_encode(['success' => true, 'message' => 'Document uploaded', 'id' => $pdo->lastInsertId()]);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Document ID required']);
                return;
            }
            $stmt = $pdo->prepare("DELETE FROM student_documents WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Document deleted']);
            break;
    }
}

// ============================================
// PROMOTIONS HANDLER
// ============================================
function handlePromotions($pdo, $method, $action, $id) {
    switch ($method) {
        case 'GET':
            $studentId = $_GET['student_id'] ?? null;
            if ($studentId) {
                $stmt = $pdo->prepare("
                    SELECT sp.*, fc.class_name as from_class_name, tc.class_name as to_class_name
                    FROM student_promotions sp
                    LEFT JOIN classes fc ON sp.from_class_id = fc.id
                    LEFT JOIN classes tc ON sp.to_class_id = tc.id
                    WHERE sp.student_id = ?
                    ORDER BY sp.promotion_date DESC
                ");
                $stmt->execute([$studentId]);
            } else {
                $limitInt = (int)($_GET['limit'] ?? 50);
                $stmt = $pdo->query("
                    SELECT sp.*, s.first_name, s.last_name, fc.class_name as from_class_name, tc.class_name as to_class_name
                    FROM student_promotions sp
                    JOIN students s ON sp.student_id = s.id
                    LEFT JOIN classes fc ON sp.from_class_id = fc.id
                    LEFT JOIN classes tc ON sp.to_class_id = tc.id
                    ORDER BY sp.promotion_date DESC
                    LIMIT $limitInt
                ");
            }
            echo json_encode(['success' => true, 'promotions' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'bulk') {
                // Bulk promotion
                $studentIds = $data['student_ids'] ?? [];
                $toClassId = $data['to_class_id'];
                $promotionType = $data['promotion_type'] ?? 'promotion';
                $promotionDate = $data['promotion_date'] ?? date('Y-m-d');
                $promotedBy = $data['promoted_by'] ?? null;
                
                $successCount = 0;
                foreach ($studentIds as $studentId) {
                    // Get current class
                    $stmt = $pdo->prepare("SELECT class_id FROM students WHERE id = ?");
                    $stmt->execute([$studentId]);
                    $fromClassId = $stmt->fetchColumn();
                    
                    // Insert promotion record
                    $stmt = $pdo->prepare("
                        INSERT INTO student_promotions (student_id, from_class_id, to_class_id, promotion_type, promoted_by, promotion_date)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ");
                    $stmt->execute([$studentId, $fromClassId, $toClassId, $promotionType, $promotedBy, $promotionDate]);
                    
                    // Update student class
                    $stmt = $pdo->prepare("UPDATE students SET class_id = ? WHERE id = ?");
                    $stmt->execute([$toClassId, $studentId]);
                    
                    addToTimeline($pdo, $studentId, 'promotion', 'Class ' . ucfirst($promotionType), "Student {$promotionType}d to new class", $promotionDate);
                    $successCount++;
                }
                
                echo json_encode(['success' => true, 'message' => "$successCount students promoted"]);
            } else {
                // Single promotion
                $stmt = $pdo->prepare("SELECT class_id FROM students WHERE id = ?");
                $stmt->execute([$data['student_id']]);
                $fromClassId = $stmt->fetchColumn();
                
                $stmt = $pdo->prepare("
                    INSERT INTO student_promotions (student_id, from_class_id, to_class_id, from_academic_year, to_academic_year, promotion_type, reason, promoted_by, promotion_date, remarks)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['student_id'], $fromClassId, $data['to_class_id'], $data['from_academic_year'] ?? null,
                    $data['to_academic_year'] ?? null, $data['promotion_type'] ?? 'promotion', $data['reason'] ?? null,
                    $data['promoted_by'] ?? null, $data['promotion_date'] ?? date('Y-m-d'), $data['remarks'] ?? null
                ]);
                
                // Update student class
                $stmt = $pdo->prepare("UPDATE students SET class_id = ? WHERE id = ?");
                $stmt->execute([$data['to_class_id'], $data['student_id']]);
                
                addToTimeline($pdo, $data['student_id'], 'promotion', 'Class Promotion', $data['reason'] ?? 'Promoted to new class', $data['promotion_date'] ?? date('Y-m-d'));
                
                echo json_encode(['success' => true, 'message' => 'Student promoted']);
            }
            break;
    }
}

// ============================================
// TIMELINE HANDLER
// ============================================
function handleTimeline($pdo, $method, $action, $id) {
    $studentId = $_GET['student_id'] ?? null;
    
    switch ($method) {
        case 'GET':
            if ($studentId) {
                $limitInt = (int)($_GET['limit'] ?? 50);
                $stmt = $pdo->prepare("SELECT * FROM student_timeline WHERE student_id = ? ORDER BY event_date DESC, id DESC LIMIT $limitInt");
                $stmt->execute([$studentId]);
                echo json_encode(['success' => true, 'timeline' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Student ID required']);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            addToTimeline($pdo, $data['student_id'], $data['event_type'], $data['event_title'], $data['event_description'] ?? null, $data['event_date'] ?? date('Y-m-d'), $data['is_important'] ?? false, $data['created_by'] ?? null);
            echo json_encode(['success' => true, 'message' => 'Timeline event added']);
            break;
    }
}

// ============================================
// ID CARDS HANDLER
// ============================================
function handleIdCards($pdo, $method, $action, $id) {
    switch ($method) {
        case 'GET':
            $studentId = $_GET['student_id'] ?? null;
            if ($studentId) {
                $stmt = $pdo->prepare("SELECT * FROM student_id_cards WHERE student_id = ? ORDER BY id DESC");
                $stmt->execute([$studentId]);
            } elseif ($action === 'expiring') {
                $days = (int)($_GET['days'] ?? 30);
                $stmt = $pdo->prepare("
                    SELECT sic.*, s.first_name, s.last_name, s.student_id as student_code
                    FROM student_id_cards sic
                    JOIN students s ON sic.student_id = s.id
                    WHERE sic.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY) AND sic.status = 'active'
                    ORDER BY sic.expiry_date
                ");
                $stmt->execute([$days]);
            } else {
                $limitInt = (int)($_GET['limit'] ?? 50);
                $stmt = $pdo->query("
                    SELECT sic.*, s.first_name, s.last_name, s.student_id as student_code
                    FROM student_id_cards sic
                    JOIN students s ON sic.student_id = s.id
                    ORDER BY sic.created_at DESC
                    LIMIT $limitInt
                ");
            }
            echo json_encode(['success' => true, 'id_cards' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'generate') {
                // Generate ID card for student
                $studentId = $data['student_id'];
                $issueDate = $data['issue_date'] ?? date('Y-m-d');
                $expiryDate = $data['expiry_date'] ?? date('Y-m-d', strtotime('+1 year'));
                
                // Generate card number
                $cardNumber = 'ID' . date('Y') . str_pad($studentId, 6, '0', STR_PAD_LEFT);
                
                // Generate barcode (simple format)
                $barcode = 'BC' . $studentId . date('Ymd');
                
                $stmt = $pdo->prepare("
                    INSERT INTO student_id_cards (student_id, card_number, issue_date, expiry_date, barcode, issued_by, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'active')
                    ON DUPLICATE KEY UPDATE card_number = ?, issue_date = ?, expiry_date = ?, barcode = ?, status = 'active'
                ");
                $stmt->execute([$studentId, $cardNumber, $issueDate, $expiryDate, $barcode, $data['issued_by'] ?? null, $cardNumber, $issueDate, $expiryDate, $barcode]);
                
                addToTimeline($pdo, $studentId, 'other', 'ID Card Issued', "ID Card $cardNumber issued", $issueDate);
                
                echo json_encode(['success' => true, 'message' => 'ID card generated', 'card_number' => $cardNumber]);
            } else {
                // Manual insert
                $stmt = $pdo->prepare("
                    INSERT INTO student_id_cards (student_id, card_number, issue_date, expiry_date, barcode, qr_code, photo_path, issued_by, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['student_id'], $data['card_number'], $data['issue_date'], $data['expiry_date'],
                    $data['barcode'] ?? null, $data['qr_code'] ?? null, $data['photo_path'] ?? null,
                    $data['issued_by'] ?? null, $data['notes'] ?? null
                ]);
                echo json_encode(['success' => true, 'message' => 'ID card created', 'id' => $pdo->lastInsertId()]);
            }
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID card ID required']);
                return;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE student_id_cards SET status = ? WHERE id = ?");
            $stmt->execute([$data['status'], $id]);
            echo json_encode(['success' => true, 'message' => 'ID card updated']);
            break;
    }
}

// ============================================
// AWARDS HANDLER
// ============================================
function handleAwards($pdo, $method, $action, $id) {
    $studentId = $_GET['student_id'] ?? null;
    
    switch ($method) {
        case 'GET':
            if ($studentId) {
                $stmt = $pdo->prepare("SELECT * FROM student_awards WHERE student_id = ? ORDER BY award_date DESC");
                $stmt->execute([$studentId]);
            } else {
                $limitInt = (int)($_GET['limit'] ?? 50);
                $stmt = $pdo->query("
                    SELECT sa.*, s.first_name, s.last_name
                    FROM student_awards sa
                    JOIN students s ON sa.student_id = s.id
                    ORDER BY sa.award_date DESC
                    LIMIT $limitInt
                ");
            }
            echo json_encode(['success' => true, 'awards' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("
                INSERT INTO student_awards (student_id, award_type, award_name, description, award_date, academic_year, term, certificate_path, awarded_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['student_id'], $data['award_type'], $data['award_name'], $data['description'] ?? null,
                $data['award_date'], $data['academic_year'] ?? null, $data['term'] ?? null,
                $data['certificate_path'] ?? null, $data['awarded_by'] ?? null
            ]);
            
            addToTimeline($pdo, $data['student_id'], 'award', 'Award Received', $data['award_name'], $data['award_date'], true);
            
            echo json_encode(['success' => true, 'message' => 'Award added', 'id' => $pdo->lastInsertId()]);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Award ID required']);
                return;
            }
            $stmt = $pdo->prepare("DELETE FROM student_awards WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Award deleted']);
            break;
    }
}

// ============================================
// DISCIPLINE HANDLER
// ============================================
function handleDiscipline($pdo, $method, $action, $id) {
    $studentId = $_GET['student_id'] ?? null;
    
    switch ($method) {
        case 'GET':
            if ($studentId) {
                $stmt = $pdo->prepare("SELECT * FROM student_discipline WHERE student_id = ? ORDER BY incident_date DESC");
                $stmt->execute([$studentId]);
            } else {
                $limitInt = (int)($_GET['limit'] ?? 50);
                $status = $_GET['status'] ?? '';
                $where = $status ? "WHERE sd.status = '$status'" : "";
                $stmt = $pdo->query("
                    SELECT sd.*, s.first_name, s.last_name
                    FROM student_discipline sd
                    JOIN students s ON sd.student_id = s.id
                    $where
                    ORDER BY sd.incident_date DESC
                    LIMIT $limitInt
                ");
            }
            echo json_encode(['success' => true, 'records' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("
                INSERT INTO student_discipline (student_id, incident_type, incident_category, incident_date, incident_time, location, description, witnesses, action_taken, action_details, suspension_start, suspension_end, parent_notified, reported_by, handled_by, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['student_id'], $data['incident_type'], $data['incident_category'], $data['incident_date'],
                $data['incident_time'] ?? null, $data['location'] ?? null, $data['description'],
                $data['witnesses'] ?? null, $data['action_taken'], $data['action_details'] ?? null,
                $data['suspension_start'] ?? null, $data['suspension_end'] ?? null,
                $data['parent_notified'] ?? false, $data['reported_by'] ?? null, $data['handled_by'] ?? null,
                $data['status'] ?? 'open'
            ]);
            
            addToTimeline($pdo, $data['student_id'], 'discipline', 'Discipline Record', $data['incident_category'] . ' - ' . $data['action_taken'], $data['incident_date']);
            
            echo json_encode(['success' => true, 'message' => 'Discipline record added', 'id' => $pdo->lastInsertId()]);
            break;

        case 'PUT':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Record ID required']);
                return;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            $updates = [];
            $params = [];
            foreach (['status', 'resolution_notes', 'parent_notified', 'parent_notified_date'] as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            $params[] = $id;
            $stmt = $pdo->prepare("UPDATE student_discipline SET " . implode(', ', $updates) . " WHERE id = ?");
            $stmt->execute($params);
            echo json_encode(['success' => true, 'message' => 'Record updated']);
            break;
    }
}

// ============================================
// MEDICAL HANDLER
// ============================================
function handleMedical($pdo, $method, $action, $id) {
    $studentId = $_GET['student_id'] ?? null;
    
    switch ($method) {
        case 'GET':
            if ($studentId) {
                $stmt = $pdo->prepare("SELECT * FROM student_medical_records WHERE student_id = ? ORDER BY record_date DESC");
                $stmt->execute([$studentId]);
            } else {
                $limitInt = (int)($_GET['limit'] ?? 50);
                $stmt = $pdo->query("
                    SELECT smr.*, s.first_name, s.last_name
                    FROM student_medical_records smr
                    JOIN students s ON smr.student_id = s.id
                    ORDER BY smr.record_date DESC
                    LIMIT $limitInt
                ");
            }
            echo json_encode(['success' => true, 'records' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("
                INSERT INTO student_medical_records (student_id, record_type, record_date, title, description, doctor_name, hospital_clinic, diagnosis, treatment, medications, follow_up_date, recorded_by, is_confidential)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['student_id'], $data['record_type'], $data['record_date'], $data['title'],
                $data['description'] ?? null, $data['doctor_name'] ?? null, $data['hospital_clinic'] ?? null,
                $data['diagnosis'] ?? null, $data['treatment'] ?? null, $data['medications'] ?? null,
                $data['follow_up_date'] ?? null, $data['recorded_by'] ?? null, $data['is_confidential'] ?? false
            ]);
            
            addToTimeline($pdo, $data['student_id'], 'medical', 'Medical Record', $data['title'], $data['record_date']);
            
            echo json_encode(['success' => true, 'message' => 'Medical record added', 'id' => $pdo->lastInsertId()]);
            break;
    }
}

// ============================================
// NOTES HANDLER
// ============================================
function handleNotes($pdo, $method, $action, $id) {
    $studentId = $_GET['student_id'] ?? null;
    
    switch ($method) {
        case 'GET':
            if ($studentId) {
                $stmt = $pdo->prepare("SELECT sn.*, u.name as created_by_name FROM student_notes sn LEFT JOIN users u ON sn.created_by = u.id WHERE sn.student_id = ? ORDER BY sn.created_at DESC");
                $stmt->execute([$studentId]);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Student ID required']);
                return;
            }
            echo json_encode(['success' => true, 'notes' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("
                INSERT INTO student_notes (student_id, note_type, title, content, is_private, is_flagged, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['student_id'], $data['note_type'] ?? 'general', $data['title'] ?? null,
                $data['content'], $data['is_private'] ?? false, $data['is_flagged'] ?? false,
                $data['created_by'] ?? null
            ]);
            
            addToTimeline($pdo, $data['student_id'], 'note', 'Note Added', $data['title'] ?? 'New note', date('Y-m-d'));
            
            echo json_encode(['success' => true, 'message' => 'Note added', 'id' => $pdo->lastInsertId()]);
            break;

        case 'DELETE':
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Note ID required']);
                return;
            }
            $stmt = $pdo->prepare("DELETE FROM student_notes WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Note deleted']);
            break;
    }
}

// ============================================
// BULK OPERATIONS HANDLER
// ============================================
function handleBulkOperations($pdo, $method, $action) {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'import') {
        $students = $data['students'] ?? [];
        $importedBy = $data['imported_by'] ?? null;
        
        $successful = 0;
        $failed = 0;
        $errors = [];
        
        foreach ($students as $index => $student) {
            try {
                if (empty($student['first_name']) || empty($student['last_name'])) {
                    throw new Exception('First name and last name are required');
                }
                
                // Generate student ID
                $year = date('Y');
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM students");
                $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'] + $successful + 1;
                $studentId = $student['student_id'] ?? "STU{$year}" . str_pad($count, 4, '0', STR_PAD_LEFT);
                
                $stmt = $pdo->prepare("
                    INSERT INTO students (student_id, first_name, last_name, other_names, date_of_birth, gender, email, phone, address, class_id, admission_date, status, guardian_name, guardian_phone, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                $stmt->execute([
                    $studentId, $student['first_name'], $student['last_name'], $student['other_names'] ?? null,
                    $student['date_of_birth'] ?? null, $student['gender'] ?? 'male', $student['email'] ?? null,
                    $student['phone'] ?? null, $student['address'] ?? null, $student['class_id'] ?? null,
                    $student['admission_date'] ?? date('Y-m-d'), $student['status'] ?? 'active',
                    $student['guardian_name'] ?? null, $student['guardian_phone'] ?? null
                ]);
                
                $successful++;
            } catch (Exception $e) {
                $failed++;
                $errors[] = ['row' => $index + 1, 'name' => ($student['first_name'] ?? '') . ' ' . ($student['last_name'] ?? ''), 'error' => $e->getMessage()];
            }
        }
        
        // Log import
        $stmt = $pdo->prepare("INSERT INTO student_import_logs (imported_by, total_records, successful_imports, failed_imports, error_details, status, completed_at) VALUES (?, ?, ?, ?, ?, 'completed', NOW())");
        $stmt->execute([$importedBy, count($students), $successful, $failed, json_encode($errors)]);
        
        echo json_encode([
            'success' => true,
            'message' => "Import completed: $successful successful, $failed failed",
            'successful' => $successful,
            'failed' => $failed,
            'errors' => $errors
        ]);
        
    } elseif ($action === 'export') {
        $filters = $data['filters'] ?? [];
        
        $where = "1=1";
        $params = [];
        
        if (!empty($filters['class_id'])) {
            $where .= " AND s.class_id = ?";
            $params[] = $filters['class_id'];
        }
        if (!empty($filters['status'])) {
            $where .= " AND s.status = ?";
            $params[] = $filters['status'];
        }
        
        $stmt = $pdo->prepare("
            SELECT s.student_id, s.first_name, s.last_name, s.other_names, s.date_of_birth, s.gender,
                   s.email, s.phone, s.address, c.class_name, s.admission_date, s.status,
                   s.guardian_name, s.guardian_phone, s.guardian_email
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            WHERE $where
            ORDER BY s.first_name
        ");
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'students' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        
    } elseif ($action === 'update_status') {
        $studentIds = $data['student_ids'] ?? [];
        $status = $data['status'] ?? 'active';
        
        if (empty($studentIds)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No students selected']);
            return;
        }
        
        $placeholders = implode(',', array_fill(0, count($studentIds), '?'));
        $params = array_merge([$status], $studentIds);
        
        $stmt = $pdo->prepare("UPDATE students SET status = ? WHERE id IN ($placeholders)");
        $stmt->execute($params);
        
        echo json_encode(['success' => true, 'message' => count($studentIds) . ' students updated']);
        
    } elseif ($action === 'delete') {
        $studentIds = $data['student_ids'] ?? [];
        
        if (empty($studentIds)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'No students selected']);
            return;
        }
        
        $placeholders = implode(',', array_fill(0, count($studentIds), '?'));
        $stmt = $pdo->prepare("DELETE FROM students WHERE id IN ($placeholders)");
        $stmt->execute($studentIds);
        
        echo json_encode(['success' => true, 'message' => count($studentIds) . ' students deleted']);
        
    } elseif ($action === 'generate_id_cards') {
        $studentIds = $data['student_ids'] ?? [];
        $issueDate = $data['issue_date'] ?? date('Y-m-d');
        $expiryDate = $data['expiry_date'] ?? date('Y-m-d', strtotime('+1 year'));
        $issuedBy = $data['issued_by'] ?? null;
        
        $generated = 0;
        foreach ($studentIds as $studentId) {
            $cardNumber = 'ID' . date('Y') . str_pad($studentId, 6, '0', STR_PAD_LEFT);
            $barcode = 'BC' . $studentId . date('Ymd');
            
            $stmt = $pdo->prepare("
                INSERT INTO student_id_cards (student_id, card_number, issue_date, expiry_date, barcode, issued_by, status)
                VALUES (?, ?, ?, ?, ?, ?, 'active')
                ON DUPLICATE KEY UPDATE card_number = ?, issue_date = ?, expiry_date = ?, status = 'active'
            ");
            $stmt->execute([$studentId, $cardNumber, $issueDate, $expiryDate, $barcode, $issuedBy, $cardNumber, $issueDate, $expiryDate]);
            $generated++;
        }
        
        echo json_encode(['success' => true, 'message' => "$generated ID cards generated"]);
    }
}

// ============================================
// STATS HANDLER
// ============================================
function handleStats($pdo, $method) {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
        return;
    }

    $stats = [];
    
    // Total students
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM students");
    $stats['total'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // By status
    $stmt = $pdo->query("SELECT status, COUNT(*) as count FROM students GROUP BY status");
    $stats['by_status'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // By gender
    $stmt = $pdo->query("SELECT gender, COUNT(*) as count FROM students GROUP BY gender");
    $stats['by_gender'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // By class
    $stmt = $pdo->query("SELECT c.class_name, COUNT(s.id) as count FROM students s LEFT JOIN classes c ON s.class_id = c.id GROUP BY s.class_id ORDER BY count DESC");
    $stats['by_class'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // New this month
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM students WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())");
    $stats['new_this_month'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    // New this week
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM students WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)");
    $stats['new_this_week'] = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    echo json_encode(['success' => true, 'stats' => $stats]);
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function addToTimeline($pdo, $studentId, $eventType, $eventTitle, $eventDescription, $eventDate, $isImportant = false, $createdBy = null) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO student_timeline (student_id, event_type, event_title, event_description, event_date, is_important, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$studentId, $eventType, $eventTitle, $eventDescription, $eventDate, $isImportant, $createdBy]);
    } catch (Exception $e) {
        // Silently fail
    }
}
