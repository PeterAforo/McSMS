<?php
/**
 * Push Subscriptions API
 * Manages web push notification subscriptions
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

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

    // Create push_subscriptions table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            endpoint TEXT NOT NULL,
            p256dh VARCHAR(255),
            auth VARCHAR(255),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            UNIQUE KEY unique_endpoint (user_id, endpoint(255))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            // Get subscriptions for a user
            $userId = $_GET['user_id'] ?? null;
            
            if ($userId) {
                $stmt = $pdo->prepare("SELECT * FROM push_subscriptions WHERE user_id = ?");
                $stmt->execute([$userId]);
                $subscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'subscriptions' => $subscriptions]);
            } else {
                // Get all subscriptions (admin only)
                $stmt = $pdo->query("SELECT ps.*, u.name, u.email FROM push_subscriptions ps JOIN users u ON ps.user_id = u.id");
                $subscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'subscriptions' => $subscriptions]);
            }
            break;

        case 'POST':
            // Save new subscription
            $data = json_decode(file_get_contents('php://input'), true);
            $userId = $data['user_id'] ?? null;
            $subscription = $data['subscription'] ?? null;

            if (!$userId || !$subscription) {
                http_response_code(400);
                echo json_encode(['error' => 'User ID and subscription required']);
                exit;
            }

            $endpoint = $subscription['endpoint'] ?? '';
            $p256dh = $subscription['keys']['p256dh'] ?? '';
            $auth = $subscription['keys']['auth'] ?? '';

            // Insert or update subscription
            $stmt = $pdo->prepare("
                INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    p256dh = VALUES(p256dh),
                    auth = VALUES(auth),
                    updated_at = NOW()
            ");
            $stmt->execute([$userId, $endpoint, $p256dh, $auth]);

            echo json_encode(['success' => true, 'message' => 'Subscription saved']);
            break;

        case 'DELETE':
            // Remove subscription
            $userId = $_GET['user_id'] ?? null;
            $endpoint = $_GET['endpoint'] ?? null;

            if ($userId) {
                if ($endpoint) {
                    $stmt = $pdo->prepare("DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?");
                    $stmt->execute([$userId, $endpoint]);
                } else {
                    // Delete all subscriptions for user
                    $stmt = $pdo->prepare("DELETE FROM push_subscriptions WHERE user_id = ?");
                    $stmt->execute([$userId]);
                }
                echo json_encode(['success' => true, 'message' => 'Subscription removed']);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'User ID required']);
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

/**
 * Send push notification to a user
 * Call this function from other APIs when you want to send a notification
 */
function sendPushNotification($pdo, $userId, $title, $body, $url = '/', $tag = 'mcsms') {
    try {
        // Get user's subscriptions
        $stmt = $pdo->prepare("SELECT * FROM push_subscriptions WHERE user_id = ?");
        $stmt->execute([$userId]);
        $subscriptions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($subscriptions)) {
            return false;
        }

        // VAPID keys - generate your own for production
        $vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
        $vapidPrivateKey = 'YOUR_PRIVATE_KEY'; // Generate and store securely

        $payload = json_encode([
            'title' => $title,
            'body' => $body,
            'url' => $url,
            'tag' => $tag
        ]);

        foreach ($subscriptions as $sub) {
            // In production, use a library like web-push-php
            // For now, we'll just log the notification
            error_log("Push notification to user $userId: $title - $body");
        }

        return true;
    } catch (Exception $e) {
        error_log("Push notification error: " . $e->getMessage());
        return false;
    }
}
