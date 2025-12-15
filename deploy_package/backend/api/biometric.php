<?php
/**
 * Biometric Integration API
 * Complete biometric system with fingerprint, face recognition, RFID
 */

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

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $method = $_SERVER['REQUEST_METHOD'];
    $resource = $_GET['resource'] ?? '';
    $id = $_GET['id'] ?? null;
    $action = $_GET['action'] ?? null;

    // ============================================
    // DEVICES
    // ============================================
    if ($resource === 'devices') {
        switch ($method) {
            case 'GET':
                if ($action === 'health') {
                    $deviceId = $_GET['device_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT * FROM device_health_logs 
                        WHERE device_id = ? 
                        ORDER BY check_time DESC 
                        LIMIT 100
                    ");
                    $stmt->execute([$deviceId]);
                    echo json_encode(['success' => true, 'health_logs' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("
                        SELECT 
                            d.*,
                            (SELECT COUNT(*) FROM biometric_enrollments WHERE device_id = d.id AND status = 'active') as enrollment_count,
                            (SELECT COUNT(*) FROM biometric_attendance_logs WHERE device_id = d.id AND DATE(created_at) = CURDATE()) as today_logs
                        FROM biometric_devices d
                        WHERE d.id = ?
                    ");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'device' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                    
                } else {
                    $stmt = $pdo->query("
                        SELECT 
                            d.*,
                            (SELECT COUNT(*) FROM biometric_enrollments WHERE device_id = d.id AND status = 'active') as enrollment_count,
                            (SELECT status FROM device_health_logs WHERE device_id = d.id ORDER BY check_time DESC LIMIT 1) as health_status
                        FROM biometric_devices d
                        ORDER BY d.device_name
                    ");
                    echo json_encode(['success' => true, 'devices' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO biometric_devices 
                    (device_name, device_type, device_model, serial_number, ip_address, port, location, api_endpoint, api_key, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['device_name'],
                    $data['device_type'] ?? 'fingerprint',
                    $data['device_model'] ?? null,
                    $data['serial_number'] ?? null,
                    $data['ip_address'] ?? null,
                    $data['port'] ?? null,
                    $data['location'] ?? null,
                    $data['api_endpoint'] ?? null,
                    $data['api_key'] ?? null,
                    $data['status'] ?? 'active'
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'sync') {
                    $stmt = $pdo->prepare("UPDATE biometric_devices SET last_sync = NOW() WHERE id = ?");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true]);
                } else {
                    $stmt = $pdo->prepare("
                        UPDATE biometric_devices 
                        SET device_name = ?, device_type = ?, location = ?, ip_address = ?, port = ?, status = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $data['device_name'],
                        $data['device_type'] ?? 'fingerprint',
                        $data['location'] ?? null,
                        $data['ip_address'] ?? null,
                        $data['port'] ?? null,
                        $data['status'] ?? 'active',
                        $id
                    ]);
                    echo json_encode(['success' => true]);
                }
                break;
        }
    }

    // ============================================
    // ENROLLMENTS
    // ============================================
    elseif ($resource === 'enrollments') {
        switch ($method) {
            case 'GET':
                if ($action === 'by_user') {
                    $userId = $_GET['user_id'] ?? null;
                    $userType = $_GET['user_type'] ?? null;
                    
                    $stmt = $pdo->prepare("
                        SELECT 
                            e.*,
                            d.device_name,
                            d.device_type
                        FROM biometric_enrollments e
                        JOIN biometric_devices d ON e.device_id = d.id
                        WHERE e.user_id = ? AND e.user_type = ?
                        ORDER BY e.enrollment_date DESC
                    ");
                    $stmt->execute([$userId, $userType]);
                    echo json_encode(['success' => true, 'enrollments' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'by_device') {
                    $deviceId = $_GET['device_id'] ?? null;
                    $stmt = $pdo->prepare("
                        SELECT * FROM biometric_enrollments 
                        WHERE device_id = ? AND status = 'active'
                        ORDER BY enrollment_date DESC
                    ");
                    $stmt->execute([$deviceId]);
                    echo json_encode(['success' => true, 'enrollments' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Encrypt template data (in production, use proper encryption)
                $templateData = base64_encode($data['template_data']);
                $templateHash = hash('sha256', $data['template_data']);
                
                $stmt = $pdo->prepare("
                    INSERT INTO biometric_enrollments 
                    (user_id, user_type, device_id, biometric_type, template_data, template_hash, 
                     finger_position, rfid_card_number, quality_score, status, expiry_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['user_id'],
                    $data['user_type'],
                    $data['device_id'],
                    $data['biometric_type'],
                    $templateData,
                    $templateHash,
                    $data['finger_position'] ?? null,
                    $data['rfid_card_number'] ?? null,
                    $data['quality_score'] ?? null,
                    $data['status'] ?? 'active',
                    $data['expiry_date'] ?? null
                ]);
                
                $enrollmentId = $pdo->lastInsertId();
                
                // Log audit trail
                logAudit($pdo, 'enrollment', $data['user_id'], $data['user_type'], $data['device_id'], $enrollmentId, 1);
                
                echo json_encode(['success' => true, 'id' => $enrollmentId]);
                break;

            case 'DELETE':
                $stmt = $pdo->prepare("UPDATE biometric_enrollments SET status = 'inactive' WHERE id = ?");
                $stmt->execute([$id]);
                
                logAudit($pdo, 'deletion', null, null, null, $id, 1);
                
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // ATTENDANCE LOGS
    // ============================================
    elseif ($resource === 'attendance') {
        switch ($method) {
            case 'GET':
                if ($action === 'by_date') {
                    $date = $_GET['date'] ?? date('Y-m-d');
                    $userType = $_GET['user_type'] ?? null;
                    
                    $where = ["attendance_date = ?"];
                    $params = [$date];
                    
                    if ($userType) {
                        $where[] = "user_type = ?";
                        $params[] = $userType;
                    }
                    
                    $stmt = $pdo->prepare("
                        SELECT 
                            bal.*,
                            d.device_name,
                            CASE 
                                WHEN bal.user_type = 'student' THEN CONCAT(s.first_name, ' ', s.last_name)
                                WHEN bal.user_type = 'teacher' THEN CONCAT(t.first_name, ' ', t.last_name)
                                WHEN bal.user_type = 'employee' THEN CONCAT(e.first_name, ' ', e.last_name)
                            END as user_name
                        FROM biometric_attendance_logs bal
                        JOIN biometric_devices d ON bal.device_id = d.id
                        LEFT JOIN students s ON bal.user_id = s.id AND bal.user_type = 'student'
                        LEFT JOIN teachers t ON bal.user_id = t.id AND bal.user_type = 'teacher'
                        LEFT JOIN employees e ON bal.user_id = e.id AND bal.user_type = 'employee'
                        WHERE " . implode(' AND ', $where) . "
                        ORDER BY bal.check_in_time DESC
                    ");
                    $stmt->execute($params);
                    echo json_encode(['success' => true, 'attendance' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'by_user') {
                    $userId = $_GET['user_id'] ?? null;
                    $userType = $_GET['user_type'] ?? null;
                    $month = $_GET['month'] ?? date('Y-m');
                    
                    $stmt = $pdo->prepare("
                        SELECT 
                            bal.*,
                            d.device_name
                        FROM biometric_attendance_logs bal
                        JOIN biometric_devices d ON bal.device_id = d.id
                        WHERE bal.user_id = ? AND bal.user_type = ? 
                        AND DATE_FORMAT(bal.attendance_date, '%Y-%m') = ?
                        ORDER BY bal.attendance_date DESC, bal.check_in_time DESC
                    ");
                    $stmt->execute([$userId, $userType, $month]);
                    echo json_encode(['success' => true, 'attendance' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Check for duplicate entry
                $stmt = $pdo->prepare("
                    SELECT id FROM biometric_attendance_logs 
                    WHERE user_id = ? AND user_type = ? AND attendance_date = ? 
                    AND check_in_time IS NOT NULL
                    AND ABS(TIMESTAMPDIFF(MINUTE, check_in_time, ?)) < 5
                ");
                $stmt->execute([
                    $data['user_id'],
                    $data['user_type'],
                    $data['attendance_date'],
                    $data['check_in_time']
                ]);
                
                if ($stmt->fetch()) {
                    echo json_encode(['success' => false, 'error' => 'Duplicate entry detected']);
                    break;
                }
                
                $stmt = $pdo->prepare("
                    INSERT INTO biometric_attendance_logs 
                    (enrollment_id, device_id, user_id, user_type, attendance_date, check_in_time, 
                     verification_method, match_score, verification_status, temperature, photo_path)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['enrollment_id'],
                    $data['device_id'],
                    $data['user_id'],
                    $data['user_type'],
                    $data['attendance_date'],
                    $data['check_in_time'],
                    $data['verification_method'],
                    $data['match_score'] ?? null,
                    $data['verification_status'] ?? 'success',
                    $data['temperature'] ?? null,
                    $data['photo_path'] ?? null
                ]);
                
                // Sync to main attendance table
                syncToMainAttendance($pdo, $data);
                
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'checkout') {
                    $stmt = $pdo->prepare("
                        UPDATE biometric_attendance_logs 
                        SET check_out_time = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([$data['check_out_time'], $id]);
                    echo json_encode(['success' => true]);
                }
                break;
        }
    }

    // ============================================
    // ACCESS LOGS
    // ============================================
    elseif ($resource === 'access') {
        switch ($method) {
            case 'GET':
                if ($action === 'recent') {
                    $limit = $_GET['limit'] ?? 100;
                    $stmt = $pdo->prepare("
                        SELECT 
                            al.*,
                            d.device_name,
                            CASE 
                                WHEN al.user_type = 'student' THEN CONCAT(s.first_name, ' ', s.last_name)
                                WHEN al.user_type = 'teacher' THEN CONCAT(t.first_name, ' ', t.last_name)
                                WHEN al.user_type = 'employee' THEN CONCAT(e.first_name, ' ', e.last_name)
                                WHEN al.user_type = 'visitor' THEN v.visitor_name
                            END as user_name
                        FROM access_logs al
                        JOIN biometric_devices d ON al.device_id = d.id
                        LEFT JOIN students s ON al.user_id = s.id AND al.user_type = 'student'
                        LEFT JOIN teachers t ON al.user_id = t.id AND al.user_type = 'teacher'
                        LEFT JOIN employees e ON al.user_id = e.id AND al.user_type = 'employee'
                        LEFT JOIN visitors v ON al.user_id = v.id AND al.user_type = 'visitor'
                        ORDER BY al.access_time DESC
                        LIMIT ?
                    ");
                    $stmt->execute([$limit]);
                    echo json_encode(['success' => true, 'access_logs' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'denied') {
                    $stmt = $pdo->query("
                        SELECT 
                            al.*,
                            d.device_name
                        FROM access_logs al
                        JOIN biometric_devices d ON al.device_id = d.id
                        WHERE al.access_granted = FALSE
                        ORDER BY al.access_time DESC
                        LIMIT 100
                    ");
                    echo json_encode(['success' => true, 'denied_access' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                
                // Check access rules
                $accessGranted = checkAccessRules($pdo, $data);
                
                $stmt = $pdo->prepare("
                    INSERT INTO access_logs 
                    (enrollment_id, device_id, user_id, user_type, access_type, access_time, 
                     verification_method, access_granted, denial_reason, temperature, photo_path)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['enrollment_id'] ?? null,
                    $data['device_id'],
                    $data['user_id'] ?? null,
                    $data['user_type'] ?? 'unknown',
                    $data['access_type'],
                    $data['access_time'] ?? date('Y-m-d H:i:s'),
                    $data['verification_method'],
                    $accessGranted['granted'],
                    $accessGranted['reason'] ?? null,
                    $data['temperature'] ?? null,
                    $data['photo_path'] ?? null
                ]);
                
                echo json_encode([
                    'success' => true,
                    'id' => $pdo->lastInsertId(),
                    'access_granted' => $accessGranted['granted'],
                    'message' => $accessGranted['message'] ?? 'Access processed'
                ]);
                break;
        }
    }

    // ============================================
    // VISITORS
    // ============================================
    elseif ($resource === 'visitors') {
        switch ($method) {
            case 'GET':
                if ($action === 'active') {
                    $stmt = $pdo->query("
                        SELECT * FROM visitors 
                        WHERE status = 'checked_in'
                        ORDER BY check_in_time DESC
                    ");
                    echo json_encode(['success' => true, 'visitors' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($id) {
                    $stmt = $pdo->prepare("SELECT * FROM visitors WHERE id = ?");
                    $stmt->execute([$id]);
                    echo json_encode(['success' => true, 'visitor' => $stmt->fetch(PDO::FETCH_ASSOC)]);
                    
                } else {
                    $stmt = $pdo->query("
                        SELECT * FROM visitors 
                        ORDER BY created_at DESC 
                        LIMIT 100
                    ");
                    echo json_encode(['success' => true, 'visitors' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                }
                break;

            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("
                    INSERT INTO visitors 
                    (visitor_name, phone, email, id_type, id_number, purpose_of_visit, 
                     host_name, host_department, temperature, health_declaration, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['visitor_name'],
                    $data['phone'] ?? null,
                    $data['email'] ?? null,
                    $data['id_type'] ?? null,
                    $data['id_number'] ?? null,
                    $data['purpose_of_visit'],
                    $data['host_name'] ?? null,
                    $data['host_department'] ?? null,
                    $data['temperature'] ?? null,
                    $data['health_declaration'] ?? false,
                    $data['status'] ?? 'scheduled'
                ]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                
                if ($action === 'checkin') {
                    $stmt = $pdo->prepare("
                        UPDATE visitors 
                        SET status = 'checked_in', check_in_time = NOW(), temperature = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([$data['temperature'] ?? null, $id]);
                } elseif ($action === 'checkout') {
                    $stmt = $pdo->prepare("
                        UPDATE visitors 
                        SET status = 'checked_out', check_out_time = NOW(),
                            actual_duration = TIMESTAMPDIFF(MINUTE, check_in_time, NOW())
                        WHERE id = ?
                    ");
                    $stmt->execute([$id]);
                }
                echo json_encode(['success' => true]);
                break;
        }
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function logAudit($pdo, $actionType, $userId, $userType, $deviceId, $enrollmentId, $performedBy) {
    $stmt = $pdo->prepare("
        INSERT INTO biometric_audit_trail 
        (action_type, user_id, user_type, device_id, enrollment_id, performed_by, status)
        VALUES (?, ?, ?, ?, ?, ?, 'success')
    ");
    $stmt->execute([$actionType, $userId, $userType, $deviceId, $enrollmentId, $performedBy]);
}

function syncToMainAttendance($pdo, $data) {
    if ($data['user_type'] === 'student') {
        $stmt = $pdo->prepare("
            INSERT INTO attendance (student_id, attendance_date, status, marked_by, created_at)
            VALUES (?, ?, 'present', 0, NOW())
            ON DUPLICATE KEY UPDATE status = 'present'
        ");
        $stmt->execute([$data['user_id'], $data['attendance_date']]);
    } elseif ($data['user_type'] === 'employee') {
        $stmt = $pdo->prepare("
            INSERT INTO employee_attendance (employee_id, attendance_date, check_in_time, status, marked_by)
            VALUES (?, ?, ?, 'present', 0)
            ON DUPLICATE KEY UPDATE check_in_time = VALUES(check_in_time), status = 'present'
        ");
        $stmt->execute([$data['user_id'], $data['attendance_date'], $data['check_in_time']]);
    }
}

function checkAccessRules($pdo, $data) {
    // Get applicable rules
    $stmt = $pdo->prepare("
        SELECT * FROM access_control_rules 
        WHERE status = 'active'
        AND (device_id = ? OR device_id IS NULL)
        AND (user_type = ? OR user_type = 'all')
        ORDER BY priority DESC
        LIMIT 1
    ");
    $stmt->execute([$data['device_id'], $data['user_type'] ?? 'unknown']);
    $rule = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$rule) {
        return ['granted' => true, 'message' => 'No rules applied'];
    }
    
    // Check time restrictions
    $currentTime = date('H:i:s');
    if ($rule['start_time'] && $rule['end_time']) {
        if ($currentTime < $rule['start_time'] || $currentTime > $rule['end_time']) {
            return ['granted' => false, 'reason' => 'Outside allowed hours', 'message' => 'Access denied: Outside allowed hours'];
        }
    }
    
    // Check temperature
    if ($rule['require_temperature_check'] && !empty($data['temperature'])) {
        if ($data['temperature'] > $rule['max_temperature']) {
            return ['granted' => false, 'reason' => 'High temperature', 'message' => 'Access denied: High temperature detected'];
        }
    }
    
    return ['granted' => true, 'message' => 'Access granted'];
}
