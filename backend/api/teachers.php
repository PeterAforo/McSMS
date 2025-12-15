<?php
header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) || strpos($origin, 'eea.mcaforo.com') !== false) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *');
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
$id = $_GET['id'] ?? null;

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM teachers WHERE id = ?");
                $stmt->execute([$id]);
                $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'teacher' => $teacher]);
            } else {
                $userId = $_GET['user_id'] ?? null;
                
                if ($userId) {
                    $stmt = $pdo->prepare("SELECT * FROM teachers WHERE user_id = ?");
                    $stmt->execute([$userId]);
                    $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
                } else {
                    $stmt = $pdo->query("SELECT * FROM teachers ORDER BY first_name, last_name");
                    $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
                }
                
                echo json_encode(['success' => true, 'teachers' => $teachers]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Check if user_id is provided (from employee wizard - user already exists)
            $userId = $data['user_id'] ?? null;
            
            if (!$userId) {
                // Create new user account if user_id not provided
                $fullName = $data['first_name'] . ' ' . $data['last_name'];
                $defaultPassword = password_hash('teacher123', PASSWORD_DEFAULT);
                
                // Check if email already exists
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
                $stmt->execute([$data['email']]);
                $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($existingUser) {
                    $userId = $existingUser['id'];
                    // Update user type to teacher
                    $stmt = $pdo->prepare("UPDATE users SET user_type = 'teacher' WHERE id = ?");
                    $stmt->execute([$userId]);
                } else {
                    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, user_type, status) VALUES (?, ?, ?, 'teacher', 'active')");
                    $stmt->execute([$fullName, $data['email'], $defaultPassword]);
                    $userId = $pdo->lastInsertId();
                }
            }
            
            // Check if teacher record already exists for this user
            $stmt = $pdo->prepare("SELECT id FROM teachers WHERE user_id = ?");
            $stmt->execute([$userId]);
            $existingTeacher = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existingTeacher) {
                // Update existing teacher record
                $stmt = $pdo->prepare("UPDATE teachers SET 
                    first_name = COALESCE(?, first_name),
                    last_name = COALESCE(?, last_name),
                    email = COALESCE(?, email),
                    phone = COALESCE(?, phone),
                    date_of_birth = COALESCE(?, date_of_birth),
                    gender = COALESCE(?, gender),
                    address = COALESCE(?, address),
                    qualification = COALESCE(?, qualification),
                    specialization = COALESCE(?, specialization),
                    hire_date = COALESCE(?, hire_date),
                    employment_type = COALESCE(?, employment_type)
                    WHERE user_id = ?");
                $stmt->execute([
                    $data['first_name'] ?? null,
                    $data['last_name'] ?? null,
                    $data['email'] ?? null,
                    $data['phone'] ?? null,
                    $data['date_of_birth'] ?? null,
                    $data['gender'] ?? null,
                    $data['address'] ?? null,
                    $data['qualification'] ?? $data['qualifications'] ?? null,
                    $data['specialization'] ?? $data['department'] ?? null,
                    $data['hire_date'] ?? $data['date_of_joining'] ?? null,
                    $data['employment_type'] ?? null,
                    $userId
                ]);
                $teacherId = $existingTeacher['id'];
            } else {
                // Generate teacher ID
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM teachers");
                $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
                $teacherCode = $data['employee_id'] ?? ('TCH' . date('Y') . str_pad($count + 1, 3, '0', STR_PAD_LEFT));
                
                // Parse name if first_name/last_name not provided
                $firstName = $data['first_name'] ?? '';
                $lastName = $data['last_name'] ?? '';
                if (empty($firstName) && !empty($data['name'])) {
                    $nameParts = explode(' ', $data['name'], 2);
                    $firstName = $nameParts[0];
                    $lastName = $nameParts[1] ?? '';
                }
                
                // Create teacher record
                $stmt = $pdo->prepare("INSERT INTO teachers (user_id, teacher_id, first_name, last_name, email, phone, date_of_birth, gender, address, qualification, specialization, hire_date, employment_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $userId,
                    $teacherCode,
                    $firstName,
                    $lastName,
                    $data['email'],
                    $data['phone'] ?? $data['emergency_contact_phone'] ?? null,
                    $data['date_of_birth'] ?? null,
                    $data['gender'] ?? null,
                    $data['address'] ?? null,
                    $data['qualification'] ?? $data['qualifications'] ?? null,
                    $data['specialization'] ?? $data['department'] ?? null,
                    $data['hire_date'] ?? $data['date_of_joining'] ?? date('Y-m-d'),
                    $data['employment_type'] ?? 'full_time',
                    $data['status'] ?? 'active'
                ]);
                $teacherId = $pdo->lastInsertId();
            }
            
            $stmt = $pdo->prepare("SELECT * FROM teachers WHERE id = ?");
            $stmt->execute([$teacherId]);
            echo json_encode([
                'success' => true, 
                'teacher' => $stmt->fetch(PDO::FETCH_ASSOC),
                'message' => 'Teacher record saved successfully.'
            ]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE teachers SET first_name=?, last_name=?, email=?, phone=?, date_of_birth=?, gender=?, address=?, qualification=?, specialization=?, employment_type=?, status=? WHERE id=?");
            $stmt->execute([
                $data['first_name'],
                $data['last_name'],
                $data['email'],
                $data['phone'],
                $data['date_of_birth'],
                $data['gender'],
                $data['address'],
                $data['qualification'],
                $data['specialization'],
                $data['employment_type'],
                $data['status'],
                $id
            ]);
            $stmt = $pdo->prepare("SELECT * FROM teachers WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'teacher' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'DELETE':
            $stmt = $pdo->prepare("DELETE FROM teachers WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
