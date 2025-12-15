<?php
/**
 * Users API Controller
 * Handles CRUD operations for users
 */

class ApiUsersController {
    
    public function handleRequest($id, $method) {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $this->getUser($id);
                } else {
                    $this->getAllUsers();
                }
                break;
                
            case 'POST':
                $this->createUser();
                break;
                
            case 'PUT':
                if ($id) {
                    $this->updateUser($id);
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'User ID required']);
                }
                break;
                
            case 'DELETE':
                if ($id) {
                    $this->deleteUser($id);
                } else {
                    http_response_code(400);
                    echo json_encode(['error' => 'User ID required']);
                }
                break;
                
            default:
                http_response_code(405);
                echo json_encode(['error' => 'Method not allowed']);
        }
    }
    
    /**
     * Get all users
     */
    private function getAllUsers() {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            
            $stmt = $pdo->query("
                SELECT id, name, email, phone, user_type, status, created_at 
                FROM users 
                ORDER BY created_at DESC
            ");
            
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'users' => $users
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Failed to fetch users',
                'message' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Get single user
     */
    private function getUser($id) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            
            $stmt = $pdo->prepare("
                SELECT id, name, email, phone, user_type, status, created_at 
                FROM users 
                WHERE id = ?
            ");
            $stmt->execute([$id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found']);
                return;
            }
            
            echo json_encode([
                'success' => true,
                'user' => $user
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Failed to fetch user',
                'message' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Create new user
     */
    private function createUser() {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (!isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Name, email, and password are required']);
                return;
            }
            
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            
            // Check if email already exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$data['email']]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Email already exists']);
                return;
            }
            
            // Hash password
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            
            // Insert user
            $stmt = $pdo->prepare("
                INSERT INTO users (name, email, phone, user_type, password, status, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['phone'] ?? '',
                $data['user_type'] ?? 'teacher',
                $hashedPassword,
                $data['status'] ?? 'active'
            ]);
            
            $userId = $pdo->lastInsertId();
            
            // Get the created user
            $stmt = $pdo->prepare("
                SELECT id, name, email, phone, user_type, status, created_at 
                FROM users 
                WHERE id = ?
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'User created successfully',
                'user' => $user
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Failed to create user',
                'message' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Update user
     */
    private function updateUser($id) {
        try {
            $data = json_decode(file_get_contents('php://input'), true);
            
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            
            // Check if user exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
            $stmt->execute([$id]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found']);
                return;
            }
            
            // Build update query
            $updates = [];
            $params = [];
            
            if (isset($data['name'])) {
                $updates[] = "name = ?";
                $params[] = $data['name'];
            }
            if (isset($data['email'])) {
                $updates[] = "email = ?";
                $params[] = $data['email'];
            }
            if (isset($data['phone'])) {
                $updates[] = "phone = ?";
                $params[] = $data['phone'];
            }
            if (isset($data['user_type'])) {
                $updates[] = "user_type = ?";
                $params[] = $data['user_type'];
            }
            if (isset($data['status'])) {
                $updates[] = "status = ?";
                $params[] = $data['status'];
            }
            if (isset($data['password']) && !empty($data['password'])) {
                $updates[] = "password = ?";
                $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
            }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }
            
            $params[] = $id;
            $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            
            // Get updated user
            $stmt = $pdo->prepare("
                SELECT id, name, email, phone, user_type, status, created_at 
                FROM users 
                WHERE id = ?
            ");
            $stmt->execute([$id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'message' => 'User updated successfully',
                'user' => $user
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Failed to update user',
                'message' => $e->getMessage()
            ]);
        }
    }
    
    /**
     * Delete user
     */
    private function deleteUser($id) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
            
            // Check if user exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
            $stmt->execute([$id]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found']);
                return;
            }
            
            // Delete user
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Failed to delete user',
                'message' => $e->getMessage()
            ]);
        }
    }
}
