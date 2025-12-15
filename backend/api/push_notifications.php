<?php
/**
 * Push Notifications API
 * Handles web push notifications for real-time alerts
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create push subscription table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            endpoint TEXT NOT NULL,
            p256dh VARCHAR(255),
            auth VARCHAR(255),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Create notification preferences table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS notification_preferences (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            grade_alerts TINYINT(1) DEFAULT 1,
            homework_alerts TINYINT(1) DEFAULT 1,
            fee_alerts TINYINT(1) DEFAULT 1,
            attendance_alerts TINYINT(1) DEFAULT 1,
            message_alerts TINYINT(1) DEFAULT 1,
            announcement_alerts TINYINT(1) DEFAULT 1,
            quiet_hours_start TIME DEFAULT NULL,
            quiet_hours_end TIME DEFAULT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? 'subscribe';
    $userId = $_GET['user_id'] ?? null;

    switch ($action) {
        case 'subscribe':
            // Subscribe to push notifications (POST)
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(subscribeUser($pdo, $data));
            break;
            
        case 'unsubscribe':
            // Unsubscribe from push notifications (DELETE)
            if ($method !== 'DELETE' && $method !== 'POST') {
                echo json_encode(['error' => 'DELETE or POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(unsubscribeUser($pdo, $data['user_id'] ?? $userId, $data['endpoint'] ?? null));
            break;
            
        case 'preferences':
            // Get or update notification preferences
            if ($method === 'GET') {
                echo json_encode(getPreferences($pdo, $userId));
            } else if ($method === 'POST' || $method === 'PUT') {
                $data = json_decode(file_get_contents('php://input'), true);
                echo json_encode(updatePreferences($pdo, $data['user_id'] ?? $userId, $data));
            }
            break;
            
        case 'send':
            // Send a push notification (POST) - for testing/admin use
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(sendPushNotification($pdo, $data));
            break;
            
        case 'send_to_user':
            // Send notification to specific user
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(sendToUser($pdo, $data['user_id'], $data['title'], $data['body'], $data['data'] ?? []));
            break;
            
        case 'send_grade_alert':
            // Send grade alert to parent
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(sendGradeAlert($pdo, $data));
            break;
            
        case 'send_homework_alert':
            // Send homework alert
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(sendHomeworkAlert($pdo, $data));
            break;
            
        case 'send_fee_alert':
            // Send fee due alert
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(sendFeeAlert($pdo, $data));
            break;
            
        case 'vapid_public_key':
            // Return VAPID public key for client
            echo json_encode([
                'success' => true,
                'public_key' => getVapidPublicKey()
            ]);
            break;
            
        default:
            echo json_encode(['error' => 'Invalid action']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

function getVapidPublicKey() {
    // In production, generate and store VAPID keys securely
    // For now, return a placeholder that can be configured
    return 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
}

function subscribeUser($pdo, $data) {
    if (!isset($data['user_id']) || !isset($data['subscription'])) {
        return ['success' => false, 'error' => 'User ID and subscription required'];
    }
    
    $userId = $data['user_id'];
    $subscription = $data['subscription'];
    $endpoint = $subscription['endpoint'] ?? '';
    $keys = $subscription['keys'] ?? [];
    
    if (empty($endpoint)) {
        return ['success' => false, 'error' => 'Invalid subscription'];
    }
    
    try {
        // Remove existing subscription for this endpoint
        $stmt = $pdo->prepare("DELETE FROM push_subscriptions WHERE endpoint = ?");
        $stmt->execute([$endpoint]);
        
        // Insert new subscription
        $stmt = $pdo->prepare("
            INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $userId,
            $endpoint,
            $keys['p256dh'] ?? '',
            $keys['auth'] ?? ''
        ]);
        
        // Create default preferences if not exists
        $stmt = $pdo->prepare("
            INSERT IGNORE INTO notification_preferences (user_id)
            VALUES (?)
        ");
        $stmt->execute([$userId]);
        
        return ['success' => true, 'message' => 'Subscribed to push notifications'];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function unsubscribeUser($pdo, $userId, $endpoint = null) {
    try {
        if ($endpoint) {
            $stmt = $pdo->prepare("DELETE FROM push_subscriptions WHERE endpoint = ?");
            $stmt->execute([$endpoint]);
        } else if ($userId) {
            $stmt = $pdo->prepare("DELETE FROM push_subscriptions WHERE user_id = ?");
            $stmt->execute([$userId]);
        } else {
            return ['success' => false, 'error' => 'User ID or endpoint required'];
        }
        
        return ['success' => true, 'message' => 'Unsubscribed from push notifications'];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function getPreferences($pdo, $userId) {
    if (!$userId) {
        return ['success' => false, 'error' => 'User ID required'];
    }
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM notification_preferences WHERE user_id = ?");
        $stmt->execute([$userId]);
        $prefs = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$prefs) {
            // Return defaults
            $prefs = [
                'grade_alerts' => true,
                'homework_alerts' => true,
                'fee_alerts' => true,
                'attendance_alerts' => true,
                'message_alerts' => true,
                'announcement_alerts' => true,
                'quiet_hours_start' => null,
                'quiet_hours_end' => null
            ];
        } else {
            // Convert to booleans
            $prefs['grade_alerts'] = (bool)$prefs['grade_alerts'];
            $prefs['homework_alerts'] = (bool)$prefs['homework_alerts'];
            $prefs['fee_alerts'] = (bool)$prefs['fee_alerts'];
            $prefs['attendance_alerts'] = (bool)$prefs['attendance_alerts'];
            $prefs['message_alerts'] = (bool)$prefs['message_alerts'];
            $prefs['announcement_alerts'] = (bool)$prefs['announcement_alerts'];
        }
        
        return ['success' => true, 'preferences' => $prefs];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function updatePreferences($pdo, $userId, $data) {
    if (!$userId) {
        return ['success' => false, 'error' => 'User ID required'];
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO notification_preferences 
            (user_id, grade_alerts, homework_alerts, fee_alerts, attendance_alerts, message_alerts, announcement_alerts, quiet_hours_start, quiet_hours_end)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            grade_alerts = VALUES(grade_alerts),
            homework_alerts = VALUES(homework_alerts),
            fee_alerts = VALUES(fee_alerts),
            attendance_alerts = VALUES(attendance_alerts),
            message_alerts = VALUES(message_alerts),
            announcement_alerts = VALUES(announcement_alerts),
            quiet_hours_start = VALUES(quiet_hours_start),
            quiet_hours_end = VALUES(quiet_hours_end)
        ");
        
        $stmt->execute([
            $userId,
            $data['grade_alerts'] ?? 1,
            $data['homework_alerts'] ?? 1,
            $data['fee_alerts'] ?? 1,
            $data['attendance_alerts'] ?? 1,
            $data['message_alerts'] ?? 1,
            $data['announcement_alerts'] ?? 1,
            $data['quiet_hours_start'] ?? null,
            $data['quiet_hours_end'] ?? null
        ]);
        
        return ['success' => true, 'message' => 'Preferences updated'];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function sendToUser($pdo, $userId, $title, $body, $data = []) {
    if (!$userId) {
        return ['success' => false, 'error' => 'User ID required'];
    }
    
    try {
        // Get user's subscriptions
        $stmt = $pdo->prepare("SELECT * FROM push_subscriptions WHERE user_id = ?");
        $stmt->execute([$userId]);
        $subscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($subscriptions)) {
            // No push subscription, create in-app notification instead
            createInAppNotification($pdo, $userId, $title, $body, $data);
            return ['success' => true, 'message' => 'In-app notification created (no push subscription)'];
        }
        
        // Also create in-app notification
        createInAppNotification($pdo, $userId, $title, $body, $data);
        
        // For actual push notifications, you would use a library like web-push
        // This is a placeholder that logs the notification
        foreach ($subscriptions as $sub) {
            // In production, use web-push library to send actual push notifications
            // For now, just log it
            error_log("Push notification to user $userId: $title - $body");
        }
        
        return [
            'success' => true, 
            'message' => 'Notification sent',
            'subscriptions_notified' => count($subscriptions)
        ];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function createInAppNotification($pdo, $userId, $title, $body, $data = []) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, 0, NOW())
        ");
        $stmt->execute([
            $userId,
            $title,
            $body,
            $data['type'] ?? 'info',
            $data['link'] ?? null
        ]);
        return true;
    } catch (Exception $e) {
        return false;
    }
}

function sendGradeAlert($pdo, $data) {
    $studentId = $data['student_id'] ?? null;
    $subject = $data['subject'] ?? 'Subject';
    $grade = $data['grade'] ?? 0;
    $examType = $data['exam_type'] ?? 'Test';
    
    if (!$studentId) {
        return ['success' => false, 'error' => 'Student ID required'];
    }
    
    try {
        // Get parent user ID
        $stmt = $pdo->prepare("
            SELECT s.first_name, s.last_name, s.parent_id, u.id as parent_user_id
            FROM students s
            LEFT JOIN users u ON s.parent_id = u.id OR s.guardian_email = u.email
            WHERE s.id = ?
        ");
        $stmt->execute([$studentId]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$student || !$student['parent_user_id']) {
            return ['success' => false, 'error' => 'Parent not found'];
        }
        
        // Check preferences
        $prefs = getPreferences($pdo, $student['parent_user_id']);
        if (!$prefs['preferences']['grade_alerts']) {
            return ['success' => true, 'message' => 'Grade alerts disabled for this user'];
        }
        
        $studentName = $student['first_name'] . ' ' . $student['last_name'];
        $title = "📊 New Grade Posted";
        $body = "{$studentName} scored {$grade}% in {$subject} ({$examType})";
        
        return sendToUser($pdo, $student['parent_user_id'], $title, $body, [
            'type' => 'grade',
            'link' => '/parent/results'
        ]);
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function sendHomeworkAlert($pdo, $data) {
    $classId = $data['class_id'] ?? null;
    $subject = $data['subject'] ?? 'Subject';
    $title = $data['title'] ?? 'New Homework';
    $dueDate = $data['due_date'] ?? 'Soon';
    
    if (!$classId) {
        return ['success' => false, 'error' => 'Class ID required'];
    }
    
    try {
        // Get all parents of students in this class
        $stmt = $pdo->prepare("
            SELECT DISTINCT u.id as parent_user_id
            FROM students s
            JOIN users u ON s.parent_id = u.id OR s.guardian_email = u.email
            WHERE s.class_id = ? AND s.status = 'active'
        ");
        $stmt->execute([$classId]);
        $parents = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $notified = 0;
        foreach ($parents as $parent) {
            // Check preferences
            $prefs = getPreferences($pdo, $parent['parent_user_id']);
            if ($prefs['preferences']['homework_alerts']) {
                sendToUser($pdo, $parent['parent_user_id'], 
                    "📝 New Homework Assigned",
                    "{$subject}: {$title} - Due: {$dueDate}",
                    ['type' => 'homework', 'link' => '/parent/homework']
                );
                $notified++;
            }
        }
        
        return ['success' => true, 'message' => "Notified $notified parents"];
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function sendFeeAlert($pdo, $data) {
    $studentId = $data['student_id'] ?? null;
    $amount = $data['amount'] ?? 0;
    $dueDate = $data['due_date'] ?? 'Soon';
    $invoiceNumber = $data['invoice_number'] ?? '';
    
    if (!$studentId) {
        return ['success' => false, 'error' => 'Student ID required'];
    }
    
    try {
        // Get parent user ID
        $stmt = $pdo->prepare("
            SELECT s.first_name, s.last_name, u.id as parent_user_id
            FROM students s
            LEFT JOIN users u ON s.parent_id = u.id OR s.guardian_email = u.email
            WHERE s.id = ?
        ");
        $stmt->execute([$studentId]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$student || !$student['parent_user_id']) {
            return ['success' => false, 'error' => 'Parent not found'];
        }
        
        // Check preferences
        $prefs = getPreferences($pdo, $student['parent_user_id']);
        if (!$prefs['preferences']['fee_alerts']) {
            return ['success' => true, 'message' => 'Fee alerts disabled for this user'];
        }
        
        $studentName = $student['first_name'] . ' ' . $student['last_name'];
        $formattedAmount = number_format($amount, 2);
        
        return sendToUser($pdo, $student['parent_user_id'], 
            "💰 Fee Payment Reminder",
            "GHS {$formattedAmount} due for {$studentName} by {$dueDate}",
            ['type' => 'fee', 'link' => '/parent/payments']
        );
        
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

function sendPushNotification($pdo, $data) {
    // Generic push notification sender
    $userIds = $data['user_ids'] ?? [];
    $title = $data['title'] ?? 'Notification';
    $body = $data['body'] ?? '';
    $notificationData = $data['data'] ?? [];
    
    if (empty($userIds)) {
        return ['success' => false, 'error' => 'User IDs required'];
    }
    
    $notified = 0;
    foreach ($userIds as $userId) {
        $result = sendToUser($pdo, $userId, $title, $body, $notificationData);
        if ($result['success']) $notified++;
    }
    
    return ['success' => true, 'message' => "Notified $notified users"];
}
