<?php
/**
 * User Profile API
 * Get and update user profile information
 */

header('Content-Type: application/json');

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$userId = $_GET['user_id'] ?? null;
$action = $_GET['action'] ?? null;

if (!$userId && $action !== 'change_password') {
    http_response_code(400);
    echo json_encode(['error' => 'User ID required']);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Ensure users table has required columns
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)");
        $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT");
        $pdo->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS photo VARCHAR(255)");
    } catch (Exception $e) {
        // Columns might already exist or syntax not supported, ignore
    }

    switch ($method) {
        case 'GET':
            // First get basic user info
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found']);
                exit;
            }
            
            // Set defaults for potentially missing columns
            $user['phone'] = $user['phone'] ?? '';
            $user['address'] = $user['address'] ?? '';
            $user['photo'] = $user['photo'] ?? '';
            
            $nameParts = explode(' ', $user['name'] ?? '', 2);
            $user['first_name'] = $nameParts[0] ?? '';
            $user['last_name'] = $nameParts[1] ?? '';
            
            if ($user['user_type'] === 'parent') {
                try {
                    $stmt = $pdo->prepare("SELECT * FROM parents WHERE user_id = ?");
                    $stmt->execute([$userId]);
                    $parentData = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($parentData) {
                        $user = array_merge($user, $parentData);
                    }
                } catch (Exception $e) {
                    // Parents table might not exist
                }
            } elseif ($user['user_type'] === 'teacher') {
                try {
                    $stmt = $pdo->prepare("SELECT * FROM teachers WHERE user_id = ?");
                    $stmt->execute([$userId]);
                    $teacherData = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($teacherData) {
                        $user = array_merge($user, $teacherData);
                    }
                } catch (Exception $e) {
                    // Teachers table might not exist
                }
            }
            
            echo json_encode(['success' => true, 'profile' => $user]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $name = trim(($data['first_name'] ?? '') . ' ' . ($data['last_name'] ?? ''));
            
            // Update only name and email in users table (these columns always exist)
            $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
            $stmt->execute([$name, $data['email'] ?? null, $userId]);
            
            // Try to update optional columns
            try {
                $stmt = $pdo->prepare("UPDATE users SET phone = ? WHERE id = ?");
                $stmt->execute([$data['phone'] ?? null, $userId]);
            } catch (Exception $e) {}
            
            try {
                $stmt = $pdo->prepare("UPDATE users SET address = ? WHERE id = ?");
                $stmt->execute([$data['address'] ?? null, $userId]);
            } catch (Exception $e) {}
            
            try {
                $stmt = $pdo->prepare("UPDATE users SET photo = ? WHERE id = ?");
                $stmt->execute([$data['photo'] ?? null, $userId]);
            } catch (Exception $e) {}
            
            // Get user type for role-specific updates
            $stmt = $pdo->prepare("SELECT user_type FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $userType = $stmt->fetchColumn();
            
            if ($userType === 'parent') {
                try {
                    $stmt = $pdo->prepare("
                        UPDATE parents SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?
                        WHERE user_id = ?
                    ");
                    $stmt->execute([
                        $data['first_name'] ?? null, $data['last_name'] ?? null, $data['email'] ?? null,
                        $data['phone'] ?? null, $data['address'] ?? null, $userId
                    ]);
                } catch (Exception $e) {}
            } elseif ($userType === 'teacher') {
                try {
                    $stmt = $pdo->prepare("
                        UPDATE teachers SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?
                        WHERE user_id = ?
                    ");
                    $stmt->execute([
                        $data['first_name'] ?? null, $data['last_name'] ?? null, $data['email'] ?? null,
                        $data['phone'] ?? null, $data['address'] ?? null, $userId
                    ]);
                } catch (Exception $e) {}
            }
            
            echo json_encode(['success' => true, 'message' => 'Profile updated']);
            break;

        case 'POST':
            if ($action === 'change_password') {
                $data = json_decode(file_get_contents('php://input'), true);
                $uid = $data['user_id'] ?? $userId;
                
                $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
                $stmt->execute([$uid]);
                $currentHash = $stmt->fetchColumn();
                
                if (!password_verify($data['current_password'], $currentHash)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Current password is incorrect']);
                    exit;
                }
                
                $newHash = password_hash($data['new_password'], PASSWORD_DEFAULT);
                $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
                $stmt->execute([$newHash, $uid]);
                
                echo json_encode(['success' => true, 'message' => 'Password changed']);
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
