<?php
/**
 * Student Applications API
 * For parent-submitted applications and admin approval
 */

header('Content-Type: application/json');

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single application
                $stmt = $pdo->prepare("SELECT * FROM student_applications WHERE id = ?");
                $stmt->execute([$id]);
                $application = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$application) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Application not found']);
                    exit;
                }
                
                echo json_encode(['success' => true, 'application' => $application]);
            } else {
                // Get all applications with filters
                $status = $_GET['status'] ?? '';
                $parent_id = $_GET['parent_id'] ?? '';
                
                $sql = "SELECT * FROM student_applications WHERE 1=1";
                $params = [];
                
                if ($status) {
                    $sql .= " AND status = ?";
                    $params[] = $status;
                }
                
                if ($parent_id) {
                    $sql .= " AND parent_id = ?";
                    $params[] = $parent_id;
                }
                
                $sql .= " ORDER BY application_date DESC";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'applications' => $applications]);
            }
            break;

        case 'POST':
            if ($action === 'approve' && $id) {
                // Approve application and create student record
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Get application
                $stmt = $pdo->prepare("SELECT * FROM student_applications WHERE id = ?");
                $stmt->execute([$id]);
                $app = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$app) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Application not found']);
                    exit;
                }
                
                // Generate student ID
                $year = date('Y');
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM students");
                $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
                $studentId = 'STU' . $year . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
                
                // Get parent record ID from user_id
                $parentRecordId = null;
                if ($app['parent_id']) {
                    $stmt = $pdo->prepare("SELECT id FROM parents WHERE user_id = ?");
                    $stmt->execute([$app['parent_id']]);
                    $parentRecord = $stmt->fetch(PDO::FETCH_ASSOC);
                    $parentRecordId = $parentRecord ? $parentRecord['id'] : null;
                }
                
                // Create student record
                $stmt = $pdo->prepare("
                    INSERT INTO students (
                        student_id, first_name, last_name, other_names, date_of_birth, gender,
                        blood_group, nationality, religion, email, phone, address, city, region,
                        admission_date, previous_school, status, parent_id,
                        guardian_name, guardian_phone, guardian_email, guardian_relationship, guardian_address,
                        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
                        medical_conditions, allergies, medications, photo, created_at
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, 'active', ?,
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
                    )
                ");
                
                $stmt->execute([
                    $studentId,
                    $app['first_name'],
                    $app['last_name'],
                    $app['other_names'],
                    $app['date_of_birth'],
                    $app['gender'],
                    $app['blood_group'],
                    $app['nationality'],
                    $app['religion'],
                    $app['email'],
                    $app['phone'],
                    $app['address'],
                    $app['city'],
                    $app['region'],
                    $app['previous_school'],
                    $parentRecordId,
                    $app['guardian_name'],
                    $app['guardian_phone'],
                    $app['guardian_email'],
                    $app['guardian_relationship'],
                    $app['guardian_address'],
                    $app['emergency_contact_name'],
                    $app['emergency_contact_phone'],
                    $app['emergency_contact_relationship'],
                    $app['medical_conditions'],
                    $app['allergies'],
                    $app['medications'],
                    $app['photo']
                ]);
                
                $newStudentId = $pdo->lastInsertId();
                
                // Update application status
                $stmt = $pdo->prepare("
                    UPDATE student_applications 
                    SET status = 'approved', reviewed_date = NOW(), reviewed_by = ?, student_id = ?, admin_notes = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['reviewed_by'] ?? null,
                    $newStudentId,
                    $data['admin_notes'] ?? null,
                    $id
                ]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Application approved and student created',
                    'student_id' => $studentId
                ]);
                
            } elseif ($action === 'reject' && $id) {
                // Reject application
                $data = json_decode(file_get_contents('php://input'), true);
                
                $stmt = $pdo->prepare("
                    UPDATE student_applications 
                    SET status = 'rejected', reviewed_date = NOW(), reviewed_by = ?, rejection_reason = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $data['reviewed_by'] ?? null,
                    $data['rejection_reason'] ?? 'Application rejected',
                    $id
                ]);
                
                echo json_encode(['success' => true, 'message' => 'Application rejected']);
                
            } else {
                // Handle POST with action in body
                $data = json_decode(file_get_contents('php://input'), true);
                $bodyAction = $data['action'] ?? null;
                
                // Make Offer action
                if ($bodyAction === 'make_offer') {
                    $appId = $data['id'];
                    $stmt = $pdo->prepare("
                        UPDATE student_applications 
                        SET status = 'offer_sent', 
                            offered_class = ?,
                            offer_reason = ?,
                            reviewed_date = NOW(), 
                            reviewed_by = ?,
                            admin_notes = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $data['offered_class'],
                        $data['offer_reason'],
                        $data['reviewed_by'] ?? null,
                        $data['admin_notes'] ?? null,
                        $appId
                    ]);
                    
                    // Create notification for parent
                    $stmt = $pdo->prepare("SELECT parent_id, first_name, last_name FROM student_applications WHERE id = ?");
                    $stmt->execute([$appId]);
                    $app = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($app) {
                        $stmt = $pdo->prepare("
                            INSERT INTO notifications (user_id, title, message, type, created_at)
                            VALUES (?, ?, ?, 'admission_offer', NOW())
                        ");
                        $stmt->execute([
                            $app['parent_id'],
                            'Admission Offer Received',
                            "Good news! Your application for {$app['first_name']} {$app['last_name']} has received an admission offer. Please review and accept the offer."
                        ]);
                    }
                    
                    echo json_encode(['success' => true, 'message' => 'Offer sent to parent']);
                    exit;
                }
                
                // Request Exam action
                if ($bodyAction === 'request_exam') {
                    $appId = $data['id'];
                    $stmt = $pdo->prepare("
                        UPDATE student_applications 
                        SET status = 'exam_required',
                            exam_date = ?,
                            exam_subjects = ?,
                            exam_instructions = ?,
                            reviewed_date = NOW(),
                            reviewed_by = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $data['exam_date'],
                        $data['exam_subjects'],
                        $data['exam_instructions'] ?? null,
                        $data['reviewed_by'] ?? null,
                        $appId
                    ]);
                    
                    // Create notification for parent
                    $stmt = $pdo->prepare("SELECT parent_id, first_name, last_name FROM student_applications WHERE id = ?");
                    $stmt->execute([$appId]);
                    $app = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($app) {
                        $examDate = date('F j, Y g:i A', strtotime($data['exam_date']));
                        $stmt = $pdo->prepare("
                            INSERT INTO notifications (user_id, title, message, type, created_at)
                            VALUES (?, ?, ?, 'entrance_exam', NOW())
                        ");
                        $stmt->execute([
                            $app['parent_id'],
                            'Entrance Exam Required',
                            "An entrance exam is required for {$app['first_name']} {$app['last_name']}. Exam Date: {$examDate}. Subjects: {$data['exam_subjects']}"
                        ]);
                    }
                    
                    echo json_encode(['success' => true, 'message' => 'Exam request sent to parent']);
                    exit;
                }
                
                // Accept Offer action (from parent)
                if ($bodyAction === 'accept_offer') {
                    $appId = $data['id'];
                    $stmt = $pdo->prepare("
                        UPDATE student_applications 
                        SET status = 'offer_accepted',
                            offer_accepted_date = NOW()
                        WHERE id = ?
                    ");
                    $stmt->execute([$appId]);
                    
                    echo json_encode(['success' => true, 'message' => 'Offer accepted']);
                    exit;
                }
                
                // Decline Offer action (from parent)
                if ($bodyAction === 'decline_offer') {
                    $appId = $data['id'];
                    $stmt = $pdo->prepare("
                        UPDATE student_applications 
                        SET status = 'offer_declined',
                            offer_declined_reason = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $data['reason'] ?? 'Offer declined by parent',
                        $appId
                    ]);
                    
                    echo json_encode(['success' => true, 'message' => 'Offer declined']);
                    exit;
                }
                
                // If no special action, create new application
                // Create new application
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Generate application number
                $year = date('Y');
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM student_applications");
                $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
                $appNumber = 'APP' . $year . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
                
                $stmt = $pdo->prepare("
                    INSERT INTO student_applications (
                        application_number, parent_id, first_name, last_name, other_names,
                        date_of_birth, gender, blood_group, nationality, religion,
                        email, phone, address, city, region,
                        previous_school, class_applying_for, academic_year,
                        guardian_name, guardian_phone, guardian_email, guardian_relationship, guardian_address, guardian_occupation,
                        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
                        medical_conditions, allergies, medications, photo,
                        status, application_date
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW()
                    )
                ");
                
                $stmt->execute([
                    $appNumber,
                    $data['parent_id'],
                    $data['first_name'],
                    $data['last_name'],
                    $data['other_names'] ?? null,
                    $data['date_of_birth'],
                    $data['gender'],
                    $data['blood_group'] ?? null,
                    $data['nationality'] ?? 'Ghanaian',
                    $data['religion'] ?? null,
                    $data['email'] ?? null,
                    $data['phone'] ?? null,
                    $data['address'] ?? null,
                    $data['city'] ?? null,
                    $data['region'] ?? null,
                    $data['previous_school'] ?? null,
                    $data['class_applying_for'] ?? null,
                    $data['academic_year'] ?? null,
                    $data['guardian_name'],
                    $data['guardian_phone'],
                    $data['guardian_email'],
                    $data['guardian_relationship'] ?? null,
                    $data['guardian_address'] ?? null,
                    $data['guardian_occupation'] ?? null,
                    $data['emergency_contact_name'] ?? null,
                    $data['emergency_contact_phone'] ?? null,
                    $data['emergency_contact_relationship'] ?? null,
                    $data['medical_conditions'] ?? null,
                    $data['allergies'] ?? null,
                    $data['medications'] ?? null,
                    $data['photo'] ?? null
                ]);
                
                $applicationId = $pdo->lastInsertId();
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'Application submitted successfully',
                    'application_number' => $appNumber,
                    'application_id' => $applicationId
                ]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}
