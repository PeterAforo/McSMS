<?php
/**
 * Messages API
 * Internal messaging system for school communication
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
$userId = $_GET['user_id'] ?? null;
$action = $_GET['action'] ?? null;
$limit = min((int)($_GET['limit'] ?? 50), 100);

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Drop and recreate messages table to ensure correct structure
    // Check if table has the required columns, if not, recreate it
    $needsRecreate = false;
    try {
        $columns = $pdo->query("SHOW COLUMNS FROM messages")->fetchAll(PDO::FETCH_COLUMN);
        $requiredColumns = ['sender_id', 'sender_type', 'recipient_id', 'recipient_type', 'subject', 'message'];
        foreach ($requiredColumns as $col) {
            if (!in_array($col, $columns)) {
                $needsRecreate = true;
                break;
            }
        }
    } catch (Exception $e) {
        // Table doesn't exist
        $needsRecreate = true;
    }
    
    if ($needsRecreate) {
        try {
            // Drop old table if exists
            $pdo->exec("DROP TABLE IF EXISTS messages");
            
            // Create with correct structure
            $pdo->exec("
                CREATE TABLE messages (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    sender_id INT NOT NULL,
                    sender_type VARCHAR(20) DEFAULT 'teacher',
                    recipient_id INT NOT NULL,
                    recipient_type VARCHAR(20) DEFAULT 'parent',
                    subject VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    is_read TINYINT(1) DEFAULT 0,
                    starred TINYINT(1) DEFAULT 0,
                    priority VARCHAR(20) DEFAULT 'normal',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_sender (sender_id),
                    INDEX idx_recipient (recipient_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            ");
            error_log("Messages table recreated successfully");
        } catch (Exception $e) {
            error_log("Messages table creation error: " . $e->getMessage());
        }
    }

    switch ($method) {
        case 'GET':
            if ($action === 'get_recipients') {
                // Get available recipients based on user type
                $userType = $_GET['user_type'] ?? 'parent';
                $recipients = [];
                
                // Admin users - available to all
                try {
                    $stmt = $pdo->query("SELECT id, name, 'admin' as type FROM users WHERE user_type = 'admin' LIMIT 10");
                    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    $recipients = array_merge($recipients, $admins);
                } catch (Exception $e) {}
                
                // Teachers - available to parents and admin
                if ($userType !== 'teacher') {
                    try {
                        $stmt = $pdo->query("SELECT id, CONCAT(first_name, ' ', last_name) as name, 'teacher' as type FROM teachers LIMIT 50");
                        $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
                        $recipients = array_merge($recipients, $teachers);
                    } catch (Exception $e) {
                        try {
                            $stmt = $pdo->query("SELECT id, name, 'teacher' as type FROM users WHERE user_type = 'teacher' LIMIT 50");
                            $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
                            $recipients = array_merge($recipients, $teachers);
                        } catch (Exception $e2) {}
                    }
                }
                
                // Parents - available to teachers and admin
                if ($userType === 'admin' || $userType === 'teacher') {
                    try {
                        $stmt = $pdo->query("SELECT id, name, 'parent' as type FROM users WHERE user_type = 'parent' LIMIT 100");
                        $parents = $stmt->fetchAll(PDO::FETCH_ASSOC);
                        $recipients = array_merge($recipients, $parents);
                    } catch (Exception $e) {}
                }
                
                echo json_encode(['success' => true, 'recipients' => $recipients]);
                exit;
            }
            
            if ($id) {
                // Get single message
                $stmt = $pdo->prepare("SELECT * FROM messages WHERE id = ?");
                $stmt->execute([$id]);
                $message = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'message' => $message]);
            } else if ($userId) {
                // Get messages for user (both sent and received)
                // Also check parent_id mapping since teachers may send to parent table ID
                try {
                    // First, get the parent record if user is a parent (to get parent table ID)
                    $parentIds = [$userId];
                    try {
                        $stmt = $pdo->prepare("SELECT id FROM parents WHERE user_id = ?");
                        $stmt->execute([$userId]);
                        $parentId = $stmt->fetchColumn();
                        if ($parentId) {
                            $parentIds[] = $parentId;
                        }
                    } catch (Exception $e) {}
                    
                    // Also check if user_id itself is in parents table
                    try {
                        $stmt = $pdo->prepare("SELECT user_id FROM parents WHERE id = ?");
                        $stmt->execute([$userId]);
                        $parentUserId = $stmt->fetchColumn();
                        if ($parentUserId) {
                            $parentIds[] = $parentUserId;
                        }
                    } catch (Exception $e) {}
                    
                    // Build query with all possible IDs
                    $placeholders = implode(',', array_fill(0, count($parentIds), '?'));
                    $params = array_merge($parentIds, $parentIds);
                    
                    $sql = "SELECT * FROM messages WHERE sender_id IN ($placeholders) OR recipient_id IN ($placeholders) ORDER BY created_at DESC LIMIT " . intval($limit);
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Helper function to get name by type and id
                    $getName = function($id, $type) use ($pdo) {
                        // Try users table first
                        try {
                            $stmt = $pdo->prepare("SELECT name FROM users WHERE id = ?");
                            $stmt->execute([$id]);
                            $name = $stmt->fetchColumn();
                            if ($name) return $name;
                        } catch (Exception $e) {}
                        
                        // Try teachers table
                        if ($type === 'teacher') {
                            try {
                                $stmt = $pdo->prepare("SELECT CONCAT(first_name, ' ', last_name) as name FROM teachers WHERE id = ?");
                                $stmt->execute([$id]);
                                $name = $stmt->fetchColumn();
                                if ($name) return $name . ' (Teacher)';
                            } catch (Exception $e) {}
                        }
                        
                        // Try parents table
                        if ($type === 'parent') {
                            try {
                                $stmt = $pdo->prepare("SELECT CONCAT(first_name, ' ', last_name) as name FROM parents WHERE id = ? OR user_id = ?");
                                $stmt->execute([$id, $id]);
                                $name = $stmt->fetchColumn();
                                if ($name) return $name . ' (Parent)';
                            } catch (Exception $e) {}
                        }
                        
                        return 'User #' . $id;
                    };
                    
                    // Add sender/recipient names
                    foreach ($messages as &$msg) {
                        $msg['sender_name'] = $getName($msg['sender_id'], $msg['sender_type'] ?? 'parent');
                        $msg['recipient_name'] = $getName($msg['recipient_id'], $msg['recipient_type'] ?? 'teacher');
                    }
                    
                    echo json_encode(['success' => true, 'messages' => $messages]);
                } catch (Exception $e) {
                    // Table doesn't exist, return empty
                    echo json_encode(['success' => true, 'messages' => []]);
                }
            } else {
                echo json_encode(['success' => true, 'messages' => []]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            error_log("Messages POST received: " . json_encode($data));
            
            if (!$data || !isset($data['sender_id']) || !isset($data['recipient_id'])) {
                echo json_encode(['success' => false, 'error' => 'Missing required fields. Received: ' . json_encode($data)]);
                break;
            }
            
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO messages (sender_id, sender_type, recipient_id, recipient_type, subject, message)
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $result = $stmt->execute([
                    $data['sender_id'],
                    $data['sender_type'] ?? 'parent',
                    $data['recipient_id'],
                    $data['recipient_type'] ?? 'admin',
                    $data['subject'] ?? 'No Subject',
                    $data['message'] ?? ''
                ]);
                
                if (!$result) {
                    throw new Exception('Insert failed: ' . implode(', ', $stmt->errorInfo()));
                }
                
                $messageId = $pdo->lastInsertId();
                error_log("Message created with ID: " . $messageId);
                
                // Create notification for recipient (optional)
                try {
                    $stmt = $pdo->prepare("
                        INSERT INTO notifications (user_id, title, message, type)
                        VALUES (?, 'New Message', ?, 'message')
                    ");
                    $stmt->execute([
                        $data['recipient_id'],
                        "You have a new message: " . substr($data['subject'] ?? '', 0, 50)
                    ]);
                } catch (Exception $e) {
                    // Notification creation failed, but message was sent
                    error_log("Notification creation failed: " . $e->getMessage());
                }
                
                echo json_encode(['success' => true, 'message_id' => $messageId]);
            } catch (Exception $e) {
                echo json_encode(['success' => false, 'error' => 'Failed to send message: ' . $e->getMessage()]);
            }
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($id) {
                $stmt = $pdo->prepare("UPDATE messages SET is_read = ? WHERE id = ?");
                $stmt->execute([$data['is_read'] ?? true, $id]);
                echo json_encode(['success' => true]);
            }
            break;

        case 'DELETE':
            if ($id) {
                $stmt = $pdo->prepare("DELETE FROM messages WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true]);
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
