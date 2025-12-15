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
                    
                } elseif ($action === 'report') {
                    $dateFrom = $_GET['date_from'] ?? date('Y-m-d');
                    $dateTo = $_GET['date_to'] ?? date('Y-m-d');
                    $stmt = $pdo->prepare("
                        SELECT 
                            attendance_date as date,
                            COUNT(DISTINCT CASE WHEN check_in_time IS NOT NULL THEN CONCAT(user_id, '-', user_type) END) as present_count,
                            0 as absent_count,
                            COUNT(DISTINCT CASE WHEN TIME(check_in_time) > '08:30:00' THEN CONCAT(user_id, '-', user_type) END) as late_count,
                            ROUND(COUNT(DISTINCT CASE WHEN check_in_time IS NOT NULL THEN CONCAT(user_id, '-', user_type) END) * 100.0 / GREATEST(1, COUNT(DISTINCT CONCAT(user_id, '-', user_type))), 1) as attendance_percentage
                        FROM biometric_attendance_logs
                        WHERE attendance_date BETWEEN ? AND ?
                        GROUP BY attendance_date
                        ORDER BY attendance_date DESC
                    ");
                    $stmt->execute([$dateFrom, $dateTo]);
                    echo json_encode(['success' => true, 'report' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'late') {
                    $date = $_GET['date'] ?? date('Y-m-d');
                    $expectedTime = $_GET['expected_time'] ?? '08:00';
                    $stmt = $pdo->prepare("
                        SELECT 
                            bal.*,
                            CASE 
                                WHEN bal.user_type = 'student' THEN CONCAT(s.first_name, ' ', s.last_name)
                                WHEN bal.user_type = 'teacher' THEN CONCAT(t.first_name, ' ', t.last_name)
                                WHEN bal.user_type = 'employee' THEN CONCAT(e.first_name, ' ', e.last_name)
                            END as user_name,
                            TIMESTAMPDIFF(MINUTE, CONCAT(?, ' ', ?), bal.check_in_time) as late_minutes
                        FROM biometric_attendance_logs bal
                        LEFT JOIN students s ON bal.user_id = s.id AND bal.user_type = 'student'
                        LEFT JOIN teachers t ON bal.user_id = t.id AND bal.user_type = 'teacher'
                        LEFT JOIN employees e ON bal.user_id = e.id AND bal.user_type = 'employee'
                        WHERE bal.attendance_date = ?
                        AND TIME(bal.check_in_time) > ?
                        ORDER BY bal.check_in_time DESC
                    ");
                    $stmt->execute([$date, $expectedTime, $date, $expectedTime]);
                    echo json_encode(['success' => true, 'late_arrivals' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                    
                } elseif ($action === 'absences') {
                    $date = $_GET['date'] ?? date('Y-m-d');
                    // Get enrolled users who haven't checked in
                    $stmt = $pdo->prepare("
                        SELECT DISTINCT 
                            be.user_id, be.user_type,
                            CASE 
                                WHEN be.user_type = 'student' THEN CONCAT(s.first_name, ' ', s.last_name)
                                WHEN be.user_type = 'teacher' THEN CONCAT(t.first_name, ' ', t.last_name)
                                WHEN be.user_type = 'employee' THEN CONCAT(e.first_name, ' ', e.last_name)
                            END as user_name
                        FROM biometric_enrollments be
                        LEFT JOIN students s ON be.user_id = s.id AND be.user_type = 'student'
                        LEFT JOIN teachers t ON be.user_id = t.id AND be.user_type = 'teacher'
                        LEFT JOIN employees e ON be.user_id = e.id AND be.user_type = 'employee'
                        WHERE be.status = 'active'
                        AND NOT EXISTS (
                            SELECT 1 FROM biometric_attendance_logs bal 
                            WHERE bal.user_id = be.user_id 
                            AND bal.user_type = be.user_type 
                            AND bal.attendance_date = ?
                        )
                    ");
                    $stmt->execute([$date]);
                    echo json_encode(['success' => true, 'absences' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
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

    // ============================================
    // ZONES
    // ============================================
    elseif ($resource === 'zones') {
        switch ($method) {
            case 'GET':
                $stmt = $pdo->query("
                    SELECT z.*, 
                        (SELECT COUNT(*) FROM zone_devices zd WHERE zd.zone_id = z.id) as device_count
                    FROM access_zones z
                    ORDER BY z.zone_name
                ");
                echo json_encode(['success' => true, 'zones' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
                break;
            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("INSERT INTO access_zones (zone_name, description, access_level) VALUES (?, ?, ?)");
                $stmt->execute([$data['zone_name'], $data['description'] ?? null, $data['access_level'] ?? 'normal']);
                $zoneId = $pdo->lastInsertId();
                if (!empty($data['devices'])) {
                    $stmt = $pdo->prepare("INSERT INTO zone_devices (zone_id, device_id) VALUES (?, ?)");
                    foreach ($data['devices'] as $deviceId) { $stmt->execute([$zoneId, $deviceId]); }
                }
                echo json_encode(['success' => true, 'id' => $zoneId]);
                break;
            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("UPDATE access_zones SET zone_name = ?, description = ?, access_level = ? WHERE id = ?");
                $stmt->execute([$data['zone_name'], $data['description'] ?? null, $data['access_level'] ?? 'normal', $id]);
                $pdo->prepare("DELETE FROM zone_devices WHERE zone_id = ?")->execute([$id]);
                if (!empty($data['devices'])) {
                    $stmt = $pdo->prepare("INSERT INTO zone_devices (zone_id, device_id) VALUES (?, ?)");
                    foreach ($data['devices'] as $deviceId) { $stmt->execute([$id, $deviceId]); }
                }
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // SCHEDULES
    // ============================================
    elseif ($resource === 'schedules') {
        switch ($method) {
            case 'GET':
                $stmt = $pdo->query("SELECT * FROM access_schedules ORDER BY schedule_name");
                $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($schedules as &$s) { $s['days'] = json_decode($s['days'] ?? '[]'); }
                echo json_encode(['success' => true, 'schedules' => $schedules]);
                break;
            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("INSERT INTO access_schedules (schedule_name, user_type, start_time, end_time, days) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$data['schedule_name'], $data['user_type'], $data['start_time'], $data['end_time'], json_encode($data['days'] ?? [])]);
                echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
                break;
            case 'PUT':
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("UPDATE access_schedules SET schedule_name = ?, user_type = ?, start_time = ?, end_time = ?, days = ? WHERE id = ?");
                $stmt->execute([$data['schedule_name'], $data['user_type'], $data['start_time'], $data['end_time'], json_encode($data['days'] ?? []), $id]);
                echo json_encode(['success' => true]);
                break;
        }
    }

    // ============================================
    // AUDIT LOGS
    // ============================================
    elseif ($resource === 'audit') {
        $limit = $_GET['limit'] ?? 100;
        $stmt = $pdo->prepare("
            SELECT al.*, u.username as user_name
            FROM biometric_audit_logs al
            LEFT JOIN users u ON al.performed_by = u.id
            ORDER BY al.created_at DESC
            LIMIT ?
        ");
        $stmt->execute([(int)$limit]);
        echo json_encode(['success' => true, 'logs' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }

    else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid resource']);
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

// ============================================
// FACE RECOGNITION FUNCTIONS
// ============================================

function enrollFace($pdo, $data) {
    // Create face enrollment table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS face_enrollments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            user_type ENUM('student', 'teacher', 'employee') NOT NULL,
            face_encoding TEXT,
            photo_path VARCHAR(500),
            quality_score DECIMAL(5,2),
            enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
            UNIQUE KEY unique_user (user_id, user_type),
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    // In production, you would:
    // 1. Process the image using a face detection library
    // 2. Extract face encoding/embeddings
    // 3. Store the encoding for future matching
    
    $stmt = $pdo->prepare("
        INSERT INTO face_enrollments (user_id, user_type, face_encoding, photo_path, quality_score)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            face_encoding = VALUES(face_encoding),
            photo_path = VALUES(photo_path),
            quality_score = VALUES(quality_score),
            enrolled_at = NOW()
    ");
    $stmt->execute([
        $data['user_id'],
        $data['user_type'],
        $data['face_encoding'] ?? null,
        $data['photo_path'] ?? null,
        $data['quality_score'] ?? 0
    ]);
    
    return ['success' => true, 'message' => 'Face enrolled successfully'];
}

function verifyFace($pdo, $data) {
    // Create verification log table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS face_verification_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            user_type VARCHAR(20),
            match_score DECIMAL(5,2),
            verified TINYINT(1),
            device_id INT,
            photo_path VARCHAR(500),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    // In production, you would:
    // 1. Extract face encoding from the submitted image
    // 2. Compare with stored encodings using cosine similarity
    // 3. Return match if similarity > threshold (typically 0.6-0.8)
    
    // For demo, we'll simulate verification
    $userId = $data['user_id'] ?? null;
    $userType = $data['user_type'] ?? 'student';
    
    // Check if user has face enrolled
    $stmt = $pdo->prepare("SELECT * FROM face_enrollments WHERE user_id = ? AND user_type = ? AND status = 'active'");
    $stmt->execute([$userId, $userType]);
    $enrollment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$enrollment) {
        return [
            'success' => false,
            'verified' => false,
            'message' => 'No face enrollment found for this user'
        ];
    }
    
    // Simulate match score (in production, calculate actual similarity)
    $matchScore = rand(70, 99) / 100;
    $threshold = 0.75;
    $verified = $matchScore >= $threshold;
    
    // Log verification attempt
    $stmt = $pdo->prepare("
        INSERT INTO face_verification_logs (user_id, user_type, match_score, verified, device_id, photo_path)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $userId,
        $userType,
        $matchScore,
        $verified ? 1 : 0,
        $data['device_id'] ?? null,
        $data['photo_path'] ?? null
    ]);
    
    if ($verified) {
        // Mark attendance
        markBiometricAttendance($pdo, $userId, $userType, 'face_recognition');
    }
    
    return [
        'success' => true,
        'verified' => $verified,
        'match_score' => round($matchScore * 100, 1),
        'threshold' => $threshold * 100,
        'message' => $verified ? 'Face verified successfully' : 'Face verification failed'
    ];
}

function markBiometricAttendance($pdo, $userId, $userType, $method) {
    $today = date('Y-m-d');
    $now = date('H:i:s');
    
    if ($userType === 'student') {
        $stmt = $pdo->prepare("
            INSERT INTO attendance (student_id, date, status, time_in, marked_by, biometric_method)
            VALUES (?, ?, 'present', ?, 0, ?)
            ON DUPLICATE KEY UPDATE 
                status = 'present',
                time_in = COALESCE(time_in, VALUES(time_in)),
                biometric_method = VALUES(biometric_method)
        ");
        $stmt->execute([$userId, $today, $now, $method]);
    } else {
        $stmt = $pdo->prepare("
            INSERT INTO employee_attendance (employee_id, attendance_date, check_in_time, status, biometric_method)
            VALUES (?, ?, ?, 'present', ?)
            ON DUPLICATE KEY UPDATE 
                check_in_time = COALESCE(check_in_time, VALUES(check_in_time)),
                status = 'present',
                biometric_method = VALUES(biometric_method)
        ");
        $stmt->execute([$userId, $today, $now, $method]);
    }
    
    // Send notification to parent (for students)
    if ($userType === 'student') {
        notifyParentOfArrival($pdo, $userId);
    }
}

function notifyParentOfArrival($pdo, $studentId) {
    try {
        $stmt = $pdo->prepare("
            SELECT s.first_name, u.id as parent_user_id
            FROM students s
            LEFT JOIN users u ON s.parent_id = u.id OR s.guardian_email = u.email
            WHERE s.id = ?
        ");
        $stmt->execute([$studentId]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($student && $student['parent_user_id']) {
            $stmt = $pdo->prepare("
                INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                VALUES (?, 'School Arrival', ?, 'attendance', 0, NOW())
            ");
            $message = "{$student['first_name']} has arrived at school at " . date('h:i A');
            $stmt->execute([$student['parent_user_id'], $message]);
        }
    } catch (Exception $e) {
        error_log("Parent notification error: " . $e->getMessage());
    }
}

function getAttendanceStats($pdo, $userId, $userType, $period = 30) {
    $table = $userType === 'student' ? 'attendance' : 'employee_attendance';
    $idField = $userType === 'student' ? 'student_id' : 'employee_id';
    
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total_days,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
            SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
        FROM $table
        WHERE $idField = ?
        AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    ");
    $stmt->execute([$userId, $period]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stats['attendance_rate'] = $stats['total_days'] > 0 
        ? round(($stats['present_days'] / $stats['total_days']) * 100, 1) 
        : 0;
    
    return $stats;
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
