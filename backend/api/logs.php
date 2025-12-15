<?php
/**
 * System Logs API
 * Track and retrieve system activity logs, security events, sessions, and API logs
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

/**
 * Insert sample data if tables are empty
 */
function insertSampleDataIfEmpty($pdo) {
    // Check if system_logs is empty
    $count = $pdo->query("SELECT COUNT(*) FROM system_logs")->fetchColumn();
    if ($count == 0) {
        $severities = ['low', 'minor', 'major', 'critical'];
        $messages = [
            ['info', 'auth', 'User logged in successfully'],
            ['success', 'students', 'Student record created'],
            ['success', 'finance', 'Payment of GHS 500 received'],
            ['warning', 'system', 'Low disk space warning'],
            ['error', 'communication', 'Failed to send email notification'],
            ['info', 'system', 'Report generated successfully'],
            ['success', 'attendance', 'Attendance marked for Class 5A'],
            ['warning', 'api', 'API rate limit approaching'],
            ['error', 'system', 'Database connection timeout'],
            ['info', 'settings', 'System settings updated'],
            ['success', 'teachers', 'Teacher profile updated'],
            ['info', 'exams', 'Exam schedule published'],
            ['warning', 'finance', 'Payment overdue reminder sent'],
            ['success', 'auth', 'Password changed successfully'],
            ['error', 'api', 'External API request failed']
        ];
        $users = [
            ['Admin User', 1], ['John Doe', 2], ['Jane Smith', 3], ['Teacher One', 4], ['System', null]
        ];
        
        $stmt = $pdo->prepare("INSERT INTO system_logs (type, category, severity, message, user_name, user_id, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        
        for ($i = 0; $i < 100; $i++) {
            $msg = $messages[array_rand($messages)];
            $user = $users[array_rand($users)];
            $severity = $severities[array_rand($severities)];
            $ip = '192.168.1.' . rand(1, 255);
            $date = date('Y-m-d H:i:s', strtotime('-' . rand(0, 7) . ' days -' . rand(0, 23) . ' hours -' . rand(0, 59) . ' minutes'));
            
            $stmt->execute([$msg[0], $msg[1], $severity, $msg[2], $user[0], $user[1], $ip, $date]);
        }
    }
    
    // Check if security_logs is empty
    $count = $pdo->query("SELECT COUNT(*) FROM security_logs")->fetchColumn();
    if ($count == 0) {
        $events = [
            ['Failed login attempt', 'unknown@test.com', 'blocked', 3],
            ['Password changed', 'admin@school.com', 'success', null],
            ['Account locked', 'john@school.com', 'locked', 5],
            ['Suspicious activity detected', 'jane@school.com', 'warning', null],
            ['Two-factor authentication enabled', 'teacher1@school.com', 'success', null],
            ['Permission escalation attempt', 'student5@school.com', 'blocked', 1]
        ];
        
        $stmt = $pdo->prepare("INSERT INTO security_logs (event, user, status, attempts, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?)");
        foreach ($events as $i => $event) {
            $ip = '192.168.1.' . rand(50, 200);
            $date = date('Y-m-d H:i:s', strtotime('-' . ($i * 2) . ' hours'));
            $stmt->execute([$event[0], $event[1], $event[2], $event[3], $ip, $date]);
        }
    }
    
    // Check if user_sessions is empty
    $count = $pdo->query("SELECT COUNT(*) FROM user_sessions")->fetchColumn();
    if ($count == 0) {
        $sessions = [
            ['Admin User', 'admin@school.com', 'Chrome on Windows', 'active'],
            ['John Doe', 'john@school.com', 'Safari on Mac', 'active'],
            ['Jane Smith', 'jane@school.com', 'Firefox on Linux', 'expired'],
            ['Teacher One', 'teacher1@school.com', 'Edge on Windows', 'active'],
            ['Parent User', 'parent@gmail.com', 'Chrome on Android', 'active']
        ];
        
        $stmt = $pdo->prepare("INSERT INTO user_sessions (user_id, user_name, email, device, ip_address, status, session_token, login_time, last_activity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        foreach ($sessions as $i => $session) {
            $ip = '192.168.1.' . rand(50, 150);
            $loginTime = date('Y-m-d H:i:s', strtotime('-' . (($i + 1) * 30) . ' minutes'));
            $lastActivity = date('Y-m-d H:i:s', strtotime('-' . ($i * 10) . ' minutes'));
            $token = bin2hex(random_bytes(32)); // Generate unique session token
            $stmt->execute([$i + 1, $session[0], $session[1], $session[2], $ip, $session[3], $token, $loginTime, $lastActivity]);
        }
    }
    
    // Check if api_logs is empty
    $count = $pdo->query("SELECT COUNT(*) FROM api_logs")->fetchColumn();
    if ($count == 0) {
        $apiCalls = [
            ['/api/students', 'GET', 200, 45, 'admin'],
            ['/api/finance/payments', 'POST', 201, 120, 'admin'],
            ['/api/auth/login', 'POST', 401, 15, 'unknown'],
            ['/api/reports/generate', 'GET', 500, 5000, 'teacher1'],
            ['/api/attendance/mark', 'POST', 200, 85, 'teacher1'],
            ['/api/classes', 'GET', 200, 32, 'admin'],
            ['/api/messages/send', 'POST', 200, 250, 'admin'],
            ['/api/users/profile', 'PUT', 200, 65, 'john']
        ];
        
        $stmt = $pdo->prepare("INSERT INTO api_logs (endpoint, method, status, duration, user_name, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
        foreach ($apiCalls as $i => $call) {
            $ip = '192.168.1.' . rand(50, 150);
            $date = date('Y-m-d H:i:s', strtotime('-' . ($i * 5) . ' minutes'));
            $stmt->execute([$call[0], $call[1], $call[2], $call[3], $call[4], $ip, $date]);
        }
    }
}

/**
 * Helper function to log system events
 * Can be called from other API files
 */
function logSystemEvent($pdo, $type, $message, $details = null, $userId = null, $userName = null, $category = 'system') {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO system_logs (type, category, message, details, user_id, user_name, ip_address, user_agent) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $type,
            $category,
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

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create system_logs table if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS system_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
        category VARCHAR(50) DEFAULT 'system',
        severity ENUM('low', 'minor', 'major', 'critical') DEFAULT 'low',
        message TEXT NOT NULL,
        details TEXT,
        user_id INT,
        user_name VARCHAR(100),
        ip_address VARCHAR(45),
        user_agent TEXT,
        request_url VARCHAR(500),
        request_method VARCHAR(10),
        response_code INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_type (type),
        INDEX idx_user_id (user_id),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Add missing columns if they don't exist (for existing tables)
    try { $pdo->exec("ALTER TABLE system_logs ADD COLUMN category VARCHAR(50) DEFAULT 'system' AFTER type"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE system_logs ADD COLUMN severity ENUM('low', 'minor', 'major', 'critical') DEFAULT 'low' AFTER category"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE system_logs ADD COLUMN user_name VARCHAR(100) AFTER user_id"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE system_logs ADD COLUMN request_url VARCHAR(500) AFTER user_agent"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE system_logs ADD COLUMN request_method VARCHAR(10) AFTER request_url"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE system_logs ADD COLUMN response_code INT AFTER request_method"); } catch (Exception $e) {}
    
    // Add missing columns to security_logs
    try { $pdo->exec("ALTER TABLE security_logs ADD COLUMN user VARCHAR(255) AFTER event"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE security_logs ADD COLUMN attempts INT DEFAULT 1 AFTER ip_address"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE security_logs ADD COLUMN status ENUM('success', 'blocked', 'locked', 'warning') DEFAULT 'warning' AFTER attempts"); } catch (Exception $e) {}
    
    // Add missing columns to user_sessions
    try { $pdo->exec("ALTER TABLE user_sessions ADD COLUMN user_name VARCHAR(100) AFTER user_id"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE user_sessions ADD COLUMN email VARCHAR(255) AFTER user_name"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE user_sessions ADD COLUMN device VARCHAR(255) AFTER ip_address"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE user_sessions ADD COLUMN status ENUM('active', 'expired', 'terminated') DEFAULT 'active'"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE user_sessions ADD COLUMN login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE user_sessions ADD COLUMN last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP"); } catch (Exception $e) {}
    
    // Add missing columns to api_logs
    try { $pdo->exec("ALTER TABLE api_logs ADD COLUMN user_name VARCHAR(100) AFTER user_id"); } catch (Exception $e) {}
    try { $pdo->exec("ALTER TABLE api_logs ADD COLUMN duration INT AFTER status"); } catch (Exception $e) {}

    // Create security_logs table
    $pdo->exec("CREATE TABLE IF NOT EXISTS security_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        event VARCHAR(255) NOT NULL,
        user VARCHAR(255),
        user_id INT,
        ip_address VARCHAR(45),
        attempts INT DEFAULT 1,
        status ENUM('success', 'blocked', 'locked', 'warning') DEFAULT 'warning',
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Create user_sessions table
    $pdo->exec("CREATE TABLE IF NOT EXISTS user_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        user_name VARCHAR(100),
        email VARCHAR(255),
        ip_address VARCHAR(45),
        device VARCHAR(255),
        session_token VARCHAR(255),
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        status ENUM('active', 'expired', 'terminated') DEFAULT 'active',
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_session_token (session_token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Create api_logs table
    $pdo->exec("CREATE TABLE IF NOT EXISTS api_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        endpoint VARCHAR(500) NOT NULL,
        method VARCHAR(10) NOT NULL,
        status INT,
        duration INT,
        user_id INT,
        user_name VARCHAR(100),
        ip_address VARCHAR(45),
        request_body TEXT,
        response_body TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_endpoint (endpoint(100)),
        INDEX idx_method (method),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    // Insert sample data if tables are empty
    insertSampleDataIfEmpty($pdo);

    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            // Get stats
            if (isset($_GET['stats'])) {
                $stmt = $pdo->query("
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today,
                        SUM(CASE WHEN type = 'error' THEN 1 ELSE 0 END) as errors,
                        SUM(CASE WHEN type = 'warning' THEN 1 ELSE 0 END) as warnings,
                        SUM(CASE WHEN type = 'info' THEN 1 ELSE 0 END) as info,
                        SUM(CASE WHEN type = 'success' THEN 1 ELSE 0 END) as success
                    FROM system_logs
                ");
                $stats = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'stats' => $stats]);
                exit;
            }

            // Get analytics
            if (isset($_GET['analytics'])) {
                $byType = $pdo->query("SELECT type, COUNT(*) as count FROM system_logs GROUP BY type")->fetchAll(PDO::FETCH_ASSOC);
                $byCategory = $pdo->query("SELECT category, COUNT(*) as count FROM system_logs GROUP BY category ORDER BY count DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
                $byDay = $pdo->query("SELECT DAYNAME(created_at) as day, COUNT(*) as count FROM system_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY DAYOFWEEK(created_at), DAYNAME(created_at) ORDER BY DAYOFWEEK(created_at)")->fetchAll(PDO::FETCH_ASSOC);
                $byHour = $pdo->query("SELECT HOUR(created_at) as hour, COUNT(*) as count FROM system_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) GROUP BY HOUR(created_at) ORDER BY hour")->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['success' => true, 'analytics' => [
                    'byType' => $byType,
                    'byCategory' => $byCategory,
                    'byDay' => $byDay,
                    'byHour' => $byHour
                ]]);
                exit;
            }

            // Get security logs
            if (isset($_GET['type']) && $_GET['type'] === 'security') {
                $stmt = $pdo->query("SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 100");
                $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'logs' => $logs]);
                exit;
            }

            // Get sessions
            if (isset($_GET['type']) && $_GET['type'] === 'sessions') {
                $stmt = $pdo->query("SELECT * FROM user_sessions ORDER BY last_activity DESC LIMIT 100");
                $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'sessions' => $sessions]);
                exit;
            }

            // Get API logs
            if (isset($_GET['type']) && $_GET['type'] === 'api') {
                $stmt = $pdo->query("SELECT * FROM api_logs ORDER BY created_at DESC LIMIT 100");
                $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'logs' => $logs]);
                exit;
            }

            // Get user activity
            if (isset($_GET['user_id'])) {
                $stmt = $pdo->prepare("SELECT * FROM system_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50");
                $stmt->execute([$_GET['user_id']]);
                $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'logs' => $logs]);
                exit;
            }

            // Export CSV
            if (isset($_GET['export']) && $_GET['export'] === 'csv') {
                header('Content-Type: text/csv');
                header('Content-Disposition: attachment; filename="system_logs.csv"');
                $output = fopen('php://output', 'w');
                fputcsv($output, ['ID', 'Type', 'Category', 'Severity', 'Message', 'User', 'IP Address', 'Timestamp']);
                $stmt = $pdo->query("SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 1000");
                while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                    fputcsv($output, [$row['id'], $row['type'], $row['category'], $row['severity'], $row['message'], $row['user_name'] ?? 'System', $row['ip_address'] ?? '', $row['created_at']]);
                }
                fclose($output);
                exit;
            }

            // Build query with filters for main logs
            $where = [];
            $params = [];

            if (isset($_GET['type']) && $_GET['type'] !== 'all' && !in_array($_GET['type'], ['security', 'sessions', 'api'])) {
                $where[] = "type = ?";
                $params[] = $_GET['type'];
            }

            if (isset($_GET['category']) && $_GET['category'] !== 'all') {
                $where[] = "category = ?";
                $params[] = $_GET['category'];
            }

            if (isset($_GET['severity']) && $_GET['severity'] !== 'all') {
                $where[] = "severity = ?";
                $params[] = $_GET['severity'];
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
            
            // Pagination
            $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
            $perPage = isset($_GET['per_page']) ? min(100, max(10, (int)$_GET['per_page'])) : 50;
            $offset = ($page - 1) * $perPage;

            // Get total count
            $countSql = "SELECT COUNT(*) FROM system_logs $whereClause";
            $countStmt = $pdo->prepare($countSql);
            $countStmt->execute($params);
            $total = $countStmt->fetchColumn();

            $sql = "SELECT * FROM system_logs $whereClause ORDER BY created_at DESC LIMIT $perPage OFFSET $offset";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true, 
                'logs' => $logs,
                'pagination' => [
                    'page' => $page,
                    'per_page' => $perPage,
                    'total' => (int)$total,
                    'total_pages' => ceil($total / $perPage)
                ]
            ]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Handle different POST actions
            $action = $_GET['action'] ?? 'create';
            
            if ($action === 'archive') {
                // Archive old logs
                $days = $data['days'] ?? 30;
                $stmt = $pdo->prepare("DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)");
                $stmt->execute([$days]);
                echo json_encode(['success' => true, 'archived' => $stmt->rowCount()]);
                exit;
            }
            
            if ($action === 'terminate_session') {
                // Terminate a session
                $stmt = $pdo->prepare("UPDATE user_sessions SET status = 'terminated' WHERE id = ?");
                $stmt->execute([$data['session_id']]);
                echo json_encode(['success' => true]);
                exit;
            }
            
            if (!isset($data['message'])) {
                throw new Exception('Message is required');
            }

            $stmt = $pdo->prepare("
                INSERT INTO system_logs (type, category, severity, message, details, user_id, user_name, ip_address, user_agent, request_url, request_method, response_code) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['type'] ?? 'info',
                $data['category'] ?? 'system',
                $data['severity'] ?? 'low',
                $data['message'],
                $data['details'] ?? null,
                $data['user_id'] ?? null,
                $data['user_name'] ?? null,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null,
                $data['request_url'] ?? null,
                $data['request_method'] ?? null,
                $data['response_code'] ?? null
            ]);

            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;

        case 'DELETE':
            // Delete old logs
            $days = isset($_GET['older_than']) ? (int)$_GET['older_than'] : 30;
            $stmt = $pdo->prepare("DELETE FROM system_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)");
            $stmt->execute([$days]);
            echo json_encode(['success' => true, 'deleted' => $stmt->rowCount()]);
            break;

        default:
            throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
