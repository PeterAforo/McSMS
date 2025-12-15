<?php
/**
 * Settings API
 * Manage system settings
 */

header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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

    $method = $_SERVER['REQUEST_METHOD'];

    // Create settings table if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS system_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        setting_type VARCHAR(50) DEFAULT 'string',
        category VARCHAR(50),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    switch ($method) {
        case 'GET':
            // Get all settings
            $stmt = $pdo->query("SELECT * FROM system_settings");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $settings = [];
            foreach ($rows as $row) {
                $value = $row['setting_value'];
                
                // Convert based on type
                if ($row['setting_type'] === 'boolean') {
                    $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
                } elseif ($row['setting_type'] === 'number') {
                    $value = is_numeric($value) ? (float)$value : $value;
                }
                
                $settings[$row['setting_key']] = $value;
            }
            
            echo json_encode(['success' => true, 'settings' => $settings]);
            break;

        case 'POST':
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data) {
                throw new Exception('Invalid data');
            }

            // Begin transaction
            $pdo->beginTransaction();

            try {
                foreach ($data as $key => $value) {
                    // Determine type
                    $type = 'string';
                    if (is_bool($value)) {
                        $type = 'boolean';
                        $value = $value ? '1' : '0';
                    } elseif (is_numeric($value)) {
                        $type = 'number';
                    }

                    // Determine category from key prefix
                    $category = 'general';
                    if (strpos($key, 'school_') === 0) $category = 'general';
                    elseif (strpos($key, 'current_') === 0 || in_array($key, ['grading_system', 'pass_mark'])) $category = 'academic';
                    elseif (strpos($key, 'currency') !== false || in_array($key, ['tax_rate', 'late_payment_fee'])) $category = 'finance';
                    elseif (in_array($key, ['timezone', 'date_format', 'time_format', 'language'])) $category = 'system';
                    elseif (strpos($key, '_notifications') !== false) $category = 'notifications';
                    elseif (in_array($key, ['session_timeout', 'password_min_length', 'require_password_change', 'two_factor_auth'])) $category = 'security';

                    // Insert or update
                    $stmt = $pdo->prepare("
                        INSERT INTO system_settings (setting_key, setting_value, setting_type, category) 
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE setting_value = ?, setting_type = ?, category = ?
                    ");
                    $stmt->execute([$key, $value, $type, $category, $value, $type, $category]);
                }

                $pdo->commit();
                echo json_encode(['success' => true, 'message' => 'Settings saved successfully']);
            } catch (Exception $e) {
                $pdo->rollBack();
                throw $e;
            }
            break;

        default:
            throw new Exception('Method not allowed');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
