<?php
/**
 * System Logs API
 * Track and retrieve system activity logs
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create logs table if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS system_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
        message TEXT NOT NULL,
        details TEXT,
        user_id INT,
        user_name VARCHAR(100),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            // Check if stats requested
            if (isset($_GET['stats'])) {
                $stmt = $pdo->query("
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today,
                        SUM(CASE WHEN type = 'error' THEN 1 ELSE 0 END) as errors,
                        SUM(CASE WHEN type = 'warning' THEN 1 ELSE 0 END) as warnings
                    FROM system_logs
                ");
                $stats = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'stats' => $stats]);
                exit;
            }

            // Check if export requested
            if (isset($_GET['export']) && $_GET['export'] === 'csv') {
                header('Content-Type: text/csv');
                header('Content-Disposition: attachment; filename="system_logs.csv"');
                
                $output = fopen('php://output', 'w');
                fputcsv($output, ['ID', 'Type', 'Message', 'User', 'IP Address', 'Timestamp']);
                
                $stmt = $pdo->query("SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 1000");
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    fputcsv($output, [
                        $row['id'],
                        $row['type'],
                        $row['message'],
                        $row['user_name'] ?? 'System',
                        $row['ip_address'] ?? '',
                        $row['created_at']
                    ]);
                }
                fclose($output);
                exit;
            }

            // Build query with filters
            $where = [];
            $params = [];

            if (isset($_GET['type']) && $_GET['type'] !== 'all') {
                $where[] = "type = ?";
                $params[] = $_GET['type'];
            }

            if (isset($_GET['user'])) {
                $where[] = "user_name LIKE ?";
                $params[] = '%' . $_GET['user'] . '%';
            }

            if (isset($_GET['date_from'])) {
                $where[] = "DATE(created_at) >= ?";
                $params[] = $_GET['date_from'];
            }

            if (isset($_GET['date_to'])) {
                $where[] = "DATE(created_at) <= ?";
                $params[] = $_GET['date_to'];
            }

            if (isset($_GET['search'])) {
                $where[] = "(message LIKE ? OR details LIKE ?)";
                $search = '%' . $_GET['search'] . '%';
                $params[] = $search;
                $params[] = $search;
            }

            $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;

            $sql = "SELECT * FROM system_logs $whereClause ORDER BY created_at DESC LIMIT $limit OFFSET $offset";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'logs' => $logs]);
            break;

        case 'POST':
            // Create new log entry
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['message'])) {
                throw new Exception('Message is required');
            }

            $stmt = $pdo->prepare("
                INSERT INTO system_logs (type, message, details, user_id, user_name, ip_address, user_agent) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['type'] ?? 'info',
                $data['message'],
                $data['details'] ?? null,
                $data['user_id'] ?? null,
                $data['user_name'] ?? null,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]);

            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;

        default:
            throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * Helper function to log system events
 * Can be called from other API files
 */
function logSystemEvent($pdo, $type, $message, $details = null, $userId = null, $userName = null) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO system_logs (type, message, details, user_id, user_name, ip_address, user_agent) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $type,
            $message,
            $details,
            $userId,
            $userName,
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null
        ]);
        
        return true;
    } catch (Exception $e) {
        error_log("Failed to log system event: " . $e->getMessage());
        return false;
    }
}
