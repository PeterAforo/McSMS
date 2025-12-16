<?php
/**
 * Students API Endpoint
 */

header('Content-Type: application/json');

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) || strpos($origin, 'eea.mcaforo.com') !== false) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load database config
require_once __DIR__ . '/../../config/database.php';

// Get method and ID from query string
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Auto-migrate: Add first admission columns if they don't exist
    try {
        $pdo->exec("ALTER TABLE students ADD COLUMN IF NOT EXISTS is_first_admission TINYINT(1) DEFAULT 1");
        $pdo->exec("ALTER TABLE students ADD COLUMN IF NOT EXISTS payment_plan_approved TINYINT(1) DEFAULT 0");
    } catch (Exception $e) {
        // Columns might already exist or table structure differs - ignore
    }

    switch ($method) {
        case 'GET':
            if ($id) {
                // Get single student
                $stmt = $pdo->prepare("
                    SELECT * FROM students WHERE id = ?
                ");
                $stmt->execute([$id]);
                $student = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$student) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Student not found']);
                    exit;
                }
                
                echo json_encode(['success' => true, 'student' => $student]);
            } else {
                // Get all students with optional filters
                $search = $_GET['search'] ?? '';
                $status = $_GET['status'] ?? '';
                $class_id = $_GET['class_id'] ?? '';
                $parent_id = $_GET['parent_id'] ?? '';
                
                $sql = "SELECT s.*, c.class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE 1=1";
                
                // Helper function to fix photo URLs
                $fixPhotoUrl = function($url) {
                    if (!$url) return null;
                    // Replace localhost URLs with production URL
                    $url = str_replace('http://localhost/McSMS/public/assets/uploads/', 'https://eea.mcaforo.com/uploads/', $url);
                    $url = str_replace('http://localhost/McSMS/uploads/', 'https://eea.mcaforo.com/uploads/', $url);
                    // Fix double slashes in path
                    $url = preg_replace('#/uploads/+#', '/uploads/', $url);
                    return $url;
                };
                $params = [];
                
                // If parent_id is a user_id, look up the actual parent_id from parents table
                if ($parent_id) {
                    $parentStmt = $pdo->prepare("SELECT id FROM parents WHERE user_id = ?");
                    $parentStmt->execute([$parent_id]);
                    $actualParentId = $parentStmt->fetchColumn();
                    
                    if ($actualParentId) {
                        $sql .= " AND s.parent_id = ?";
                        $params[] = $actualParentId;
                    } else {
                        // Try direct parent_id match
                        $sql .= " AND s.parent_id = ?";
                        $params[] = $parent_id;
                    }
                }
                
                if ($search) {
                    $sql .= " AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ? OR s.email LIKE ?)";
                    $searchTerm = "%$search%";
                    $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm]);
                }
                
                if ($status) {
                    $sql .= " AND s.status = ?";
                    $params[] = $status;
                }
                
                if ($class_id) {
                    $sql .= " AND s.class_id = ?";
                    $params[] = $class_id;
                }
                
                $sql .= " ORDER BY s.created_at DESC";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Fix photo URLs for each student
                foreach ($students as &$student) {
                    if (isset($student['photo'])) {
                        $student['photo'] = $fixPhotoUrl($student['photo']);
                    }
                    if (isset($student['profile_photo'])) {
                        $student['profile_photo'] = $fixPhotoUrl($student['profile_photo']);
                    }
                }
                
                echo json_encode(['success' => true, 'students' => $students]);
            }
            break;

        case 'POST':
            // Create student
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            $required = ['student_id', 'first_name', 'last_name', 'date_of_birth', 'gender', 'admission_date'];
            foreach ($required as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => ucfirst(str_replace('_', ' ', $field)) . ' is required']);
                    exit;
                }
            }
            
            // Check if student_id exists
            $stmt = $pdo->prepare("SELECT id FROM students WHERE student_id = ?");
            $stmt->execute([$data['student_id']]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Student ID already exists']);
                exit;
            }
            
            // Insert student
            $stmt = $pdo->prepare("
                INSERT INTO students (
                    student_id, first_name, last_name, other_names, date_of_birth, gender,
                    blood_group, nationality, religion, email, phone, address, city, region,
                    class_id, admission_date, admission_number, previous_school, status,
                    guardian_name, guardian_phone, guardian_email, guardian_relationship, guardian_address,
                    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
                    medical_conditions, allergies, medications, notes, created_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
                )
            ");
            
            $stmt->execute([
                $data['student_id'],
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
                $data['class_id'] ?? null,
                $data['admission_date'],
                $data['admission_number'] ?? null,
                $data['previous_school'] ?? null,
                $data['status'] ?? 'active',
                $data['guardian_name'] ?? null,
                $data['guardian_phone'] ?? null,
                $data['guardian_email'] ?? null,
                $data['guardian_relationship'] ?? null,
                $data['guardian_address'] ?? null,
                $data['emergency_contact_name'] ?? null,
                $data['emergency_contact_phone'] ?? null,
                $data['emergency_contact_relationship'] ?? null,
                $data['medical_conditions'] ?? null,
                $data['allergies'] ?? null,
                $data['medications'] ?? null,
                $data['notes'] ?? null
            ]);
            
            $studentId = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
            $stmt->execute([$studentId]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);
            
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Student created successfully', 'student' => $student]);
            break;

        case 'PUT':
            // Update student
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Student ID required']);
                exit;
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Build update query dynamically
            $updates = [];
            $params = [];
            
            $allowedFields = [
                'student_id', 'first_name', 'last_name', 'other_names', 'date_of_birth', 'gender',
                'blood_group', 'nationality', 'religion', 'email', 'phone', 'address', 'city', 'region',
                'class_id', 'admission_date', 'admission_number', 'previous_school', 'status',
                'guardian_name', 'guardian_phone', 'guardian_email', 'guardian_relationship', 'guardian_address',
                'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
                'medical_conditions', 'allergies', 'medications', 'notes'
            ];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updates[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                exit;
            }
            
            $params[] = $id;
            $sql = "UPDATE students SET " . implode(', ', $updates) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            $stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
            $stmt->execute([$id]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode(['success' => true, 'message' => 'Student updated successfully', 'student' => $student]);
            break;

        case 'DELETE':
            // Delete student
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Student ID required']);
                exit;
            }
            
            $stmt = $pdo->prepare("DELETE FROM students WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode(['success' => true, 'message' => 'Student deleted successfully']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}
