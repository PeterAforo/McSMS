<?php
/**
 * Employees API - For non-teacher staff (accountant, hr_manager, librarian, etc.)
 */
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

    // Create employees table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS employees (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            employee_id VARCHAR(50) NOT NULL UNIQUE,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NULL,
            phone VARCHAR(20) NULL,
            department VARCHAR(100) NULL,
            designation VARCHAR(100) NULL,
            date_of_joining DATE NULL,
            employment_type ENUM('full_time', 'part_time', 'contract', 'temporary') DEFAULT 'full_time',
            salary_grade VARCHAR(50) NULL,
            bank_name VARCHAR(100) NULL,
            bank_account VARCHAR(50) NULL,
            emergency_contact_name VARCHAR(100) NULL,
            emergency_contact_phone VARCHAR(20) NULL,
            address TEXT NULL,
            date_of_birth DATE NULL,
            gender ENUM('male', 'female', 'other') NULL,
            national_id VARCHAR(50) NULL,
            qualifications TEXT NULL,
            status ENUM('active', 'inactive', 'terminated') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_department (department),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM employees WHERE id = ?");
                $stmt->execute([$id]);
                $employee = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'employee' => $employee]);
            } else {
                $userId = $_GET['user_id'] ?? null;
                $department = $_GET['department'] ?? null;
                
                $sql = "SELECT * FROM employees WHERE 1=1";
                $params = [];
                
                if ($userId) {
                    $sql .= " AND user_id = ?";
                    $params[] = $userId;
                }
                if ($department) {
                    $sql .= " AND department = ?";
                    $params[] = $department;
                }
                
                $sql .= " ORDER BY first_name, last_name";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'employees' => $employees]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $userId = $data['user_id'] ?? null;
            
            // Check if employee record already exists for this user
            if ($userId) {
                $stmt = $pdo->prepare("SELECT id FROM employees WHERE user_id = ?");
                $stmt->execute([$userId]);
                $existing = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($existing) {
                    // Update existing record
                    $stmt = $pdo->prepare("UPDATE employees SET 
                        employee_id = COALESCE(?, employee_id),
                        department = COALESCE(?, department),
                        designation = COALESCE(?, designation),
                        date_of_joining = COALESCE(?, date_of_joining),
                        employment_type = COALESCE(?, employment_type),
                        salary_grade = COALESCE(?, salary_grade),
                        bank_name = COALESCE(?, bank_name),
                        bank_account = COALESCE(?, bank_account),
                        emergency_contact_name = COALESCE(?, emergency_contact_name),
                        emergency_contact_phone = COALESCE(?, emergency_contact_phone),
                        address = COALESCE(?, address),
                        date_of_birth = COALESCE(?, date_of_birth),
                        gender = COALESCE(?, gender),
                        national_id = COALESCE(?, national_id),
                        qualifications = COALESCE(?, qualifications)
                        WHERE user_id = ?");
                    $stmt->execute([
                        $data['employee_id'] ?? null,
                        $data['department'] ?? null,
                        $data['designation'] ?? null,
                        $data['date_of_joining'] ?? null,
                        $data['employment_type'] ?? null,
                        $data['salary_grade'] ?? null,
                        $data['bank_name'] ?? null,
                        $data['bank_account'] ?? null,
                        $data['emergency_contact_name'] ?? null,
                        $data['emergency_contact_phone'] ?? null,
                        $data['address'] ?? null,
                        $data['date_of_birth'] ?? null,
                        $data['gender'] ?? null,
                        $data['national_id'] ?? null,
                        $data['qualifications'] ?? null,
                        $userId
                    ]);
                    
                    $stmt = $pdo->prepare("SELECT * FROM employees WHERE id = ?");
                    $stmt->execute([$existing['id']]);
                    echo json_encode([
                        'success' => true,
                        'employee' => $stmt->fetch(PDO::FETCH_ASSOC),
                        'message' => 'Employee record updated successfully.'
                    ]);
                    break;
                }
            }
            
            // Get user info if user_id provided
            $firstName = $data['first_name'] ?? '';
            $lastName = $data['last_name'] ?? '';
            $email = $data['email'] ?? null;
            
            if ($userId && (empty($firstName) || empty($lastName))) {
                $stmt = $pdo->prepare("SELECT name, email FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($user) {
                    $nameParts = explode(' ', $user['name'], 2);
                    $firstName = $firstName ?: $nameParts[0];
                    $lastName = $lastName ?: ($nameParts[1] ?? '');
                    $email = $email ?: $user['email'];
                }
            }
            
            // Generate employee ID if not provided
            $employeeId = $data['employee_id'] ?? null;
            if (!$employeeId) {
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM employees");
                $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
                $employeeId = 'EMP' . date('Y') . str_pad($count + 1, 4, '0', STR_PAD_LEFT);
            }
            
            // Insert new employee
            $stmt = $pdo->prepare("INSERT INTO employees (
                user_id, employee_id, first_name, last_name, email, phone,
                department, designation, date_of_joining, employment_type,
                salary_grade, bank_name, bank_account, emergency_contact_name,
                emergency_contact_phone, address, date_of_birth, gender,
                national_id, qualifications, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            $stmt->execute([
                $userId,
                $employeeId,
                $firstName,
                $lastName,
                $email,
                $data['phone'] ?? $data['emergency_contact_phone'] ?? null,
                $data['department'] ?? null,
                $data['designation'] ?? null,
                $data['date_of_joining'] ?? date('Y-m-d'),
                $data['employment_type'] ?? 'full_time',
                $data['salary_grade'] ?? null,
                $data['bank_name'] ?? null,
                $data['bank_account'] ?? null,
                $data['emergency_contact_name'] ?? null,
                $data['emergency_contact_phone'] ?? null,
                $data['address'] ?? null,
                $data['date_of_birth'] ?? null,
                $data['gender'] ?? null,
                $data['national_id'] ?? null,
                $data['qualifications'] ?? null,
                $data['status'] ?? 'active'
            ]);
            
            $newId = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM employees WHERE id = ?");
            $stmt->execute([$newId]);
            
            echo json_encode([
                'success' => true,
                'employee' => $stmt->fetch(PDO::FETCH_ASSOC),
                'message' => 'Employee record created successfully.'
            ]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("UPDATE employees SET 
                employee_id = ?, first_name = ?, last_name = ?, email = ?, phone = ?,
                department = ?, designation = ?, date_of_joining = ?, employment_type = ?,
                salary_grade = ?, bank_name = ?, bank_account = ?, emergency_contact_name = ?,
                emergency_contact_phone = ?, address = ?, date_of_birth = ?, gender = ?,
                national_id = ?, qualifications = ?, status = ?
                WHERE id = ?");
            
            $stmt->execute([
                $data['employee_id'],
                $data['first_name'],
                $data['last_name'],
                $data['email'] ?? null,
                $data['phone'] ?? null,
                $data['department'] ?? null,
                $data['designation'] ?? null,
                $data['date_of_joining'] ?? null,
                $data['employment_type'] ?? 'full_time',
                $data['salary_grade'] ?? null,
                $data['bank_name'] ?? null,
                $data['bank_account'] ?? null,
                $data['emergency_contact_name'] ?? null,
                $data['emergency_contact_phone'] ?? null,
                $data['address'] ?? null,
                $data['date_of_birth'] ?? null,
                $data['gender'] ?? null,
                $data['national_id'] ?? null,
                $data['qualifications'] ?? null,
                $data['status'] ?? 'active',
                $id
            ]);
            
            $stmt = $pdo->prepare("SELECT * FROM employees WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'employee' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'DELETE':
            $stmt = $pdo->prepare("DELETE FROM employees WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Employee deleted']);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
