<?php
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
            
            // Step 1: Create user account first
            $fullName = $data['first_name'] . ' ' . $data['last_name'];
            $defaultPassword = password_hash('teacher123', PASSWORD_DEFAULT);
            
            $stmt = $pdo->prepare("INSERT INTO users (name, email, password, user_type, status) VALUES (?, ?, ?, 'teacher', 'active')");
            $stmt->execute([
                $fullName,
                $data['email'],
                $defaultPassword
            ]);
            $userId = $pdo->lastInsertId();
            
            // Step 2: Generate teacher ID
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM teachers");
            $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            $teacherId = 'TCH' . date('Y') . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
            
            // Step 3: Create teacher record with user_id
            $stmt = $pdo->prepare("INSERT INTO teachers (user_id, teacher_id, first_name, last_name, email, phone, date_of_birth, gender, address, qualification, specialization, hire_date, employment_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $userId,
                $teacherId,
                $data['first_name'],
                $data['last_name'],
                $data['email'],
                $data['phone'] ?? null,
                $data['date_of_birth'] ?? null,
                $data['gender'] ?? null,
                $data['address'] ?? null,
                $data['qualification'] ?? null,
                $data['specialization'] ?? null,
                $data['hire_date'] ?? date('Y-m-d'),
                $data['employment_type'] ?? 'full-time',
                $data['status'] ?? 'active'
            ]);
            $id = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM teachers WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode([
                'success' => true, 
                'teacher' => $stmt->fetch(PDO::FETCH_ASSOC),
                'message' => 'Teacher created successfully. Login credentials: Email: ' . $data['email'] . ', Password: teacher123'
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
