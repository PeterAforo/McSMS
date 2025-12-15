<?php
/**
 * Mobile App API
 * Optimized endpoints for mobile apps with offline sync support
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Device-ID, X-App-Version, X-Last-Sync');

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

    // Create necessary tables
    createMobileTables($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? 'status';
    $userType = $_GET['user_type'] ?? 'student';
    $userId = $_GET['user_id'] ?? null;

    // Get device info from headers
    $deviceId = $_SERVER['HTTP_X_DEVICE_ID'] ?? null;
    $appVersion = $_SERVER['HTTP_X_APP_VERSION'] ?? '1.0.0';
    $lastSync = $_SERVER['HTTP_X_LAST_SYNC'] ?? null;

    switch ($action) {
        // ============================================
        // AUTHENTICATION
        // ============================================
        case 'login':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(mobileLogin($pdo, $data, $deviceId));
            break;
            
        case 'logout':
            if ($method !== 'POST') break;
            echo json_encode(mobileLogout($pdo, $userId, $deviceId));
            break;
            
        case 'refresh_token':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(refreshToken($pdo, $data['refresh_token']));
            break;

        // ============================================
        // SYNC ENDPOINTS
        // ============================================
        case 'sync':
            echo json_encode(syncData($pdo, $userId, $userType, $lastSync));
            break;
            
        case 'sync_push':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(pushSyncData($pdo, $userId, $userType, $data));
            break;
            
        case 'sync_status':
            echo json_encode(getSyncStatus($pdo, $userId, $userType, $deviceId));
            break;

        // ============================================
        // STUDENT ENDPOINTS
        // ============================================
        case 'student_dashboard':
            echo json_encode(getStudentDashboard($pdo, $userId));
            break;
            
        case 'student_timetable':
            echo json_encode(getStudentTimetable($pdo, $userId));
            break;
            
        case 'student_grades':
            echo json_encode(getStudentGrades($pdo, $userId));
            break;
            
        case 'student_attendance':
            echo json_encode(getStudentAttendance($pdo, $userId));
            break;
            
        case 'student_fees':
            echo json_encode(getStudentFees($pdo, $userId));
            break;
            
        case 'student_homework':
            echo json_encode(getStudentHomework($pdo, $userId));
            break;

        // ============================================
        // PARENT ENDPOINTS
        // ============================================
        case 'parent_dashboard':
            echo json_encode(getParentDashboard($pdo, $userId));
            break;
            
        case 'parent_children':
            echo json_encode(getParentChildren($pdo, $userId));
            break;
            
        case 'child_details':
            $childId = $_GET['child_id'] ?? null;
            echo json_encode(getChildDetails($pdo, $childId));
            break;

        // ============================================
        // TEACHER ENDPOINTS
        // ============================================
        case 'teacher_dashboard':
            echo json_encode(getTeacherDashboard($pdo, $userId));
            break;
            
        case 'teacher_classes':
            echo json_encode(getTeacherClasses($pdo, $userId));
            break;
            
        case 'teacher_timetable':
            echo json_encode(getTeacherTimetable($pdo, $userId));
            break;
            
        case 'mark_attendance':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(markAttendance($pdo, $data));
            break;

        // ============================================
        // NOTIFICATIONS
        // ============================================
        case 'notifications':
            echo json_encode(getNotifications($pdo, $userId, $userType));
            break;
            
        case 'mark_read':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(markNotificationRead($pdo, $data['notification_id']));
            break;
            
        case 'register_device':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(registerDevice($pdo, $userId, $userType, $data));
            break;
            
        case 'unregister_device':
            if ($method !== 'POST') break;
            echo json_encode(unregisterDevice($pdo, $deviceId));
            break;

        // ============================================
        // MESSAGING
        // ============================================
        case 'conversations':
            echo json_encode(getConversations($pdo, $userId, $userType));
            break;
            
        case 'messages':
            $conversationId = $_GET['conversation_id'] ?? null;
            echo json_encode(getMessages($pdo, $conversationId));
            break;
            
        case 'send_message':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(sendMessage($pdo, $userId, $userType, $data));
            break;

        // ============================================
        // OFFLINE SUPPORT
        // ============================================
        case 'offline_data':
            echo json_encode(getOfflineData($pdo, $userId, $userType));
            break;
            
        case 'queue_action':
            if ($method !== 'POST') break;
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(queueOfflineAction($pdo, $userId, $userType, $deviceId, $data));
            break;
            
        case 'process_queue':
            if ($method !== 'POST') break;
            echo json_encode(processOfflineQueue($pdo, $deviceId));
            break;

        // ============================================
        // APP CONFIG
        // ============================================
        case 'config':
            echo json_encode(getAppConfig($pdo, $appVersion));
            break;
            
        case 'check_update':
            echo json_encode(checkAppUpdate($pdo, $appVersion));
            break;
            
        case 'status':
        default:
            echo json_encode(['success' => true, 'status' => 'online', 'version' => '1.0.0']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

// ============================================
// TABLE CREATION
// ============================================
function createMobileTables($pdo) {
    // Device registrations for push notifications
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS mobile_devices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            user_type VARCHAR(20) NOT NULL,
            device_id VARCHAR(255) NOT NULL,
            device_token VARCHAR(500),
            device_type ENUM('ios', 'android', 'web') NOT NULL,
            device_name VARCHAR(255),
            app_version VARCHAR(20),
            os_version VARCHAR(50),
            is_active TINYINT(1) DEFAULT 1,
            last_active DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_device (device_id),
            INDEX idx_user (user_id, user_type),
            INDEX idx_token (device_token(255))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Sync tracking
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS mobile_sync_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            user_type VARCHAR(20) NOT NULL,
            device_id VARCHAR(255),
            sync_type ENUM('full', 'partial', 'push') NOT NULL,
            tables_synced TEXT,
            records_synced INT DEFAULT 0,
            sync_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            status ENUM('success', 'partial', 'failed') DEFAULT 'success',
            error_message TEXT,
            INDEX idx_user (user_id, user_type),
            INDEX idx_device (device_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Offline action queue
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS offline_action_queue (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            user_type VARCHAR(20) NOT NULL,
            device_id VARCHAR(255) NOT NULL,
            action_type VARCHAR(100) NOT NULL,
            action_data JSON NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            processed_at DATETIME,
            status ENUM('pending', 'processed', 'failed') DEFAULT 'pending',
            error_message TEXT,
            INDEX idx_device (device_id),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Mobile sessions
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS mobile_sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            user_type VARCHAR(20) NOT NULL,
            device_id VARCHAR(255) NOT NULL,
            access_token VARCHAR(500) NOT NULL,
            refresh_token VARCHAR(500) NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_used DATETIME,
            is_active TINYINT(1) DEFAULT 1,
            INDEX idx_user (user_id, user_type),
            INDEX idx_token (access_token(255))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================
function mobileLogin($pdo, $data, $deviceId) {
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';
    $userType = $data['user_type'] ?? 'student';
    
    // Find user
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND status = 'active'");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || !password_verify($password, $user['password'])) {
        return ['success' => false, 'error' => 'Invalid credentials'];
    }
    
    // Generate tokens
    $accessToken = bin2hex(random_bytes(32));
    $refreshToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
    
    // Create session
    $stmt = $pdo->prepare("
        INSERT INTO mobile_sessions 
        (user_id, user_type, device_id, access_token, refresh_token, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$user['id'], $user['role'], $deviceId, $accessToken, $refreshToken, $expiresAt]);
    
    // Get profile data
    $profile = getUserProfile($pdo, $user['id'], $user['role']);
    
    return [
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'name' => $user['name'] ?? $profile['name'] ?? ''
        ],
        'profile' => $profile,
        'access_token' => $accessToken,
        'refresh_token' => $refreshToken,
        'expires_at' => $expiresAt
    ];
}

function mobileLogout($pdo, $userId, $deviceId) {
    $stmt = $pdo->prepare("
        UPDATE mobile_sessions SET is_active = 0 
        WHERE user_id = ? AND device_id = ?
    ");
    $stmt->execute([$userId, $deviceId]);
    
    return ['success' => true];
}

function refreshToken($pdo, $refreshToken) {
    $stmt = $pdo->prepare("
        SELECT * FROM mobile_sessions 
        WHERE refresh_token = ? AND is_active = 1
    ");
    $stmt->execute([$refreshToken]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        return ['success' => false, 'error' => 'Invalid refresh token'];
    }
    
    // Generate new tokens
    $newAccessToken = bin2hex(random_bytes(32));
    $newRefreshToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
    
    $stmt = $pdo->prepare("
        UPDATE mobile_sessions 
        SET access_token = ?, refresh_token = ?, expires_at = ?, last_used = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$newAccessToken, $newRefreshToken, $expiresAt, $session['id']]);
    
    return [
        'success' => true,
        'access_token' => $newAccessToken,
        'refresh_token' => $newRefreshToken,
        'expires_at' => $expiresAt
    ];
}

function getUserProfile($pdo, $userId, $userType) {
    switch ($userType) {
        case 'student':
            $stmt = $pdo->prepare("
                SELECT s.*, c.class_name
                FROM students s
                LEFT JOIN classes c ON s.class_id = c.id
                WHERE s.user_id = ?
            ");
            break;
        case 'teacher':
            $stmt = $pdo->prepare("SELECT * FROM teachers WHERE user_id = ?");
            break;
        case 'parent':
            $stmt = $pdo->prepare("SELECT * FROM parents WHERE user_id = ?");
            break;
        default:
            return null;
    }
    
    $stmt->execute([$userId]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

// ============================================
// SYNC FUNCTIONS
// ============================================
function syncData($pdo, $userId, $userType, $lastSync) {
    $data = [];
    $syncTime = date('Y-m-d H:i:s');
    
    // Determine what to sync based on user type
    switch ($userType) {
        case 'student':
            $data = syncStudentData($pdo, $userId, $lastSync);
            break;
        case 'teacher':
            $data = syncTeacherData($pdo, $userId, $lastSync);
            break;
        case 'parent':
            $data = syncParentData($pdo, $userId, $lastSync);
            break;
    }
    
    // Log sync
    $stmt = $pdo->prepare("
        INSERT INTO mobile_sync_log (user_id, user_type, sync_type, records_synced, status)
        VALUES (?, ?, 'partial', ?, 'success')
    ");
    $totalRecords = array_sum(array_map('count', $data));
    $stmt->execute([$userId, $userType, $totalRecords]);
    
    return [
        'success' => true,
        'data' => $data,
        'sync_time' => $syncTime,
        'has_more' => false
    ];
}

function syncStudentData($pdo, $userId, $lastSync) {
    $data = [];
    $condition = $lastSync ? "AND updated_at > '$lastSync'" : "";
    
    // Get student ID
    $stmt = $pdo->prepare("SELECT id, class_id FROM students WHERE user_id = ?");
    $stmt->execute([$userId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$student) return $data;
    
    // Timetable
    $stmt = $pdo->prepare("
        SELECT * FROM timetable WHERE class_id = ? $condition
    ");
    $stmt->execute([$student['class_id']]);
    $data['timetable'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Attendance (last 30 days)
    $stmt = $pdo->prepare("
        SELECT * FROM attendance 
        WHERE student_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    ");
    $stmt->execute([$student['id']]);
    $data['attendance'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Grades
    $stmt = $pdo->prepare("
        SELECT er.*, es.exam_name, s.subject_name
        FROM exam_results er
        JOIN exam_schedules es ON er.exam_schedule_id = es.id
        JOIN subjects s ON es.subject_id = s.id
        WHERE er.student_id = ?
        ORDER BY es.exam_date DESC
        LIMIT 50
    ");
    $stmt->execute([$student['id']]);
    $data['grades'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Homework
    $stmt = $pdo->prepare("
        SELECT h.*, s.subject_name
        FROM homework h
        JOIN subjects s ON h.subject_id = s.id
        WHERE h.class_id = ? AND h.due_date >= CURDATE()
        ORDER BY h.due_date
    ");
    $stmt->execute([$student['class_id']]);
    $data['homework'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Fees
    $stmt = $pdo->prepare("
        SELECT * FROM invoices WHERE student_id = ? ORDER BY created_at DESC LIMIT 10
    ");
    $stmt->execute([$student['id']]);
    $data['fees'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return $data;
}

function syncTeacherData($pdo, $userId, $lastSync) {
    $data = [];
    
    // Get teacher ID
    $stmt = $pdo->prepare("SELECT id FROM teachers WHERE user_id = ?");
    $stmt->execute([$userId]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$teacher) return $data;
    
    // Classes
    $stmt = $pdo->prepare("
        SELECT c.* FROM classes c
        JOIN teacher_classes tc ON c.id = tc.class_id
        WHERE tc.teacher_id = ?
    ");
    $stmt->execute([$teacher['id']]);
    $data['classes'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Timetable
    $stmt = $pdo->prepare("SELECT * FROM timetable WHERE teacher_id = ?");
    $stmt->execute([$teacher['id']]);
    $data['timetable'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Students in classes
    $classIds = array_column($data['classes'], 'id');
    if (!empty($classIds)) {
        $placeholders = implode(',', array_fill(0, count($classIds), '?'));
        $stmt = $pdo->prepare("
            SELECT id, first_name, last_name, class_id, photo
            FROM students WHERE class_id IN ($placeholders) AND status = 'active'
        ");
        $stmt->execute($classIds);
        $data['students'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    return $data;
}

function syncParentData($pdo, $userId, $lastSync) {
    $data = [];
    
    // Get children
    $stmt = $pdo->prepare("
        SELECT s.*, c.class_name
        FROM students s
        JOIN classes c ON s.class_id = c.id
        WHERE s.parent_id = ? OR s.guardian_id = ?
    ");
    $stmt->execute([$userId, $userId]);
    $data['children'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get data for each child
    foreach ($data['children'] as &$child) {
        // Attendance
        $stmt = $pdo->prepare("
            SELECT * FROM attendance 
            WHERE student_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ");
        $stmt->execute([$child['id']]);
        $child['attendance'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Recent grades
        $stmt = $pdo->prepare("
            SELECT er.*, es.exam_name FROM exam_results er
            JOIN exam_schedules es ON er.exam_schedule_id = es.id
            WHERE er.student_id = ?
            ORDER BY es.exam_date DESC LIMIT 10
        ");
        $stmt->execute([$child['id']]);
        $child['grades'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Fees
        $stmt = $pdo->prepare("
            SELECT * FROM invoices WHERE student_id = ? ORDER BY created_at DESC LIMIT 5
        ");
        $stmt->execute([$child['id']]);
        $child['fees'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    return $data;
}

function pushSyncData($pdo, $userId, $userType, $data) {
    $processed = 0;
    $errors = [];
    
    // Process each data type
    foreach ($data as $type => $records) {
        foreach ($records as $record) {
            try {
                switch ($type) {
                    case 'attendance':
                        // Teacher marking attendance
                        $stmt = $pdo->prepare("
                            INSERT INTO attendance (student_id, date, status, marked_by)
                            VALUES (?, ?, ?, ?)
                            ON DUPLICATE KEY UPDATE status = VALUES(status)
                        ");
                        $stmt->execute([
                            $record['student_id'],
                            $record['date'],
                            $record['status'],
                            $userId
                        ]);
                        $processed++;
                        break;
                        
                    case 'homework_submission':
                        $stmt = $pdo->prepare("
                            INSERT INTO homework_submissions (homework_id, student_id, submission_text, submitted_at)
                            VALUES (?, ?, ?, NOW())
                        ");
                        $stmt->execute([
                            $record['homework_id'],
                            $record['student_id'],
                            $record['submission_text']
                        ]);
                        $processed++;
                        break;
                }
            } catch (Exception $e) {
                $errors[] = ['type' => $type, 'error' => $e->getMessage()];
            }
        }
    }
    
    return [
        'success' => count($errors) === 0,
        'processed' => $processed,
        'errors' => $errors
    ];
}

function getSyncStatus($pdo, $userId, $userType, $deviceId) {
    $stmt = $pdo->prepare("
        SELECT * FROM mobile_sync_log 
        WHERE user_id = ? AND user_type = ?
        ORDER BY sync_time DESC LIMIT 1
    ");
    $stmt->execute([$userId, $userType]);
    $lastSync = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Check pending queue items
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM offline_action_queue 
        WHERE device_id = ? AND status = 'pending'
    ");
    $stmt->execute([$deviceId]);
    $pendingActions = $stmt->fetchColumn();
    
    return [
        'success' => true,
        'last_sync' => $lastSync,
        'pending_actions' => $pendingActions
    ];
}

// ============================================
// STUDENT DASHBOARD
// ============================================
function getStudentDashboard($pdo, $userId) {
    // Get student
    $stmt = $pdo->prepare("
        SELECT s.*, c.class_name FROM students s
        JOIN classes c ON s.class_id = c.id
        WHERE s.user_id = ?
    ");
    $stmt->execute([$userId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$student) {
        return ['success' => false, 'error' => 'Student not found'];
    }
    
    $dashboard = ['student' => $student];
    
    // Today's timetable
    $dayOfWeek = date('l');
    $stmt = $pdo->prepare("
        SELECT t.*, s.subject_name, CONCAT(te.first_name, ' ', te.last_name) as teacher_name
        FROM timetable t
        JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN teachers te ON t.teacher_id = te.id
        WHERE t.class_id = ? AND t.day_of_week = ?
        ORDER BY t.start_time
    ");
    $stmt->execute([$student['class_id'], $dayOfWeek]);
    $dashboard['today_schedule'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Attendance summary
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
        FROM attendance
        WHERE student_id = ? AND MONTH(date) = MONTH(CURDATE())
    ");
    $stmt->execute([$student['id']]);
    $dashboard['attendance'] = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Pending homework
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM homework 
        WHERE class_id = ? AND due_date >= CURDATE()
    ");
    $stmt->execute([$student['class_id']]);
    $dashboard['pending_homework'] = $stmt->fetchColumn();
    
    // Fee status
    $stmt = $pdo->prepare("
        SELECT SUM(total_amount - amount_paid) as outstanding
        FROM invoices WHERE student_id = ? AND status IN ('pending', 'partial')
    ");
    $stmt->execute([$student['id']]);
    $dashboard['outstanding_fees'] = $stmt->fetchColumn() ?? 0;
    
    // Unread notifications
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0
    ");
    $stmt->execute([$userId]);
    $dashboard['unread_notifications'] = $stmt->fetchColumn();
    
    return ['success' => true, 'dashboard' => $dashboard];
}

function getStudentTimetable($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT id, class_id FROM students WHERE user_id = ?");
    $stmt->execute([$userId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("
        SELECT t.*, s.subject_name, CONCAT(te.first_name, ' ', te.last_name) as teacher_name
        FROM timetable t
        JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN teachers te ON t.teacher_id = te.id
        WHERE t.class_id = ?
        ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'), t.start_time
    ");
    $stmt->execute([$student['class_id']]);
    
    return ['success' => true, 'timetable' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getStudentGrades($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT id FROM students WHERE user_id = ?");
    $stmt->execute([$userId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("
        SELECT er.*, es.exam_name, es.exam_date, s.subject_name
        FROM exam_results er
        JOIN exam_schedules es ON er.exam_schedule_id = es.id
        JOIN subjects s ON es.subject_id = s.id
        WHERE er.student_id = ?
        ORDER BY es.exam_date DESC
    ");
    $stmt->execute([$student['id']]);
    
    return ['success' => true, 'grades' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getStudentAttendance($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT id FROM students WHERE user_id = ?");
    $stmt->execute([$userId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $month = $_GET['month'] ?? date('Y-m');
    
    $stmt = $pdo->prepare("
        SELECT * FROM attendance 
        WHERE student_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?
        ORDER BY date
    ");
    $stmt->execute([$student['id'], $month]);
    
    return ['success' => true, 'attendance' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getStudentFees($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT id FROM students WHERE user_id = ?");
    $stmt->execute([$userId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("
        SELECT i.*, ft.fee_name
        FROM invoices i
        LEFT JOIN fee_types ft ON i.fee_type_id = ft.id
        WHERE i.student_id = ?
        ORDER BY i.created_at DESC
    ");
    $stmt->execute([$student['id']]);
    
    return ['success' => true, 'fees' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getStudentHomework($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT id, class_id FROM students WHERE user_id = ?");
    $stmt->execute([$userId]);
    $student = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("
        SELECT h.*, s.subject_name, CONCAT(t.first_name, ' ', t.last_name) as teacher_name
        FROM homework h
        JOIN subjects s ON h.subject_id = s.id
        LEFT JOIN teachers t ON h.teacher_id = t.id
        WHERE h.class_id = ?
        ORDER BY h.due_date
    ");
    $stmt->execute([$student['class_id']]);
    
    return ['success' => true, 'homework' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

// ============================================
// PARENT DASHBOARD
// ============================================
function getParentDashboard($pdo, $userId) {
    $children = getParentChildren($pdo, $userId)['children'];
    
    $dashboard = [
        'children_count' => count($children),
        'children' => []
    ];
    
    foreach ($children as $child) {
        $childData = [
            'id' => $child['id'],
            'name' => $child['first_name'] . ' ' . $child['last_name'],
            'class' => $child['class_name'],
            'photo' => $child['photo']
        ];
        
        // Attendance rate
        $stmt = $pdo->prepare("
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
            FROM attendance WHERE student_id = ? AND MONTH(date) = MONTH(CURDATE())
        ");
        $stmt->execute([$child['id']]);
        $att = $stmt->fetch(PDO::FETCH_ASSOC);
        $childData['attendance_rate'] = $att['total'] > 0 ? round(($att['present'] / $att['total']) * 100) : 0;
        
        // Outstanding fees
        $stmt = $pdo->prepare("
            SELECT SUM(total_amount - amount_paid) as outstanding
            FROM invoices WHERE student_id = ? AND status IN ('pending', 'partial')
        ");
        $stmt->execute([$child['id']]);
        $childData['outstanding_fees'] = $stmt->fetchColumn() ?? 0;
        
        $dashboard['children'][] = $childData;
    }
    
    // Total outstanding
    $dashboard['total_outstanding'] = array_sum(array_column($dashboard['children'], 'outstanding_fees'));
    
    return ['success' => true, 'dashboard' => $dashboard];
}

function getParentChildren($pdo, $userId) {
    $stmt = $pdo->prepare("
        SELECT s.*, c.class_name
        FROM students s
        JOIN classes c ON s.class_id = c.id
        WHERE s.parent_id = ? OR s.guardian_id = ?
    ");
    $stmt->execute([$userId, $userId]);
    
    return ['success' => true, 'children' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getChildDetails($pdo, $childId) {
    // Get student info
    $stmt = $pdo->prepare("
        SELECT s.*, c.class_name FROM students s
        JOIN classes c ON s.class_id = c.id
        WHERE s.id = ?
    ");
    $stmt->execute([$childId]);
    $child = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$child) {
        return ['success' => false, 'error' => 'Child not found'];
    }
    
    // Recent attendance
    $stmt = $pdo->prepare("
        SELECT * FROM attendance WHERE student_id = ?
        ORDER BY date DESC LIMIT 10
    ");
    $stmt->execute([$childId]);
    $child['recent_attendance'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Recent grades
    $stmt = $pdo->prepare("
        SELECT er.*, es.exam_name, s.subject_name
        FROM exam_results er
        JOIN exam_schedules es ON er.exam_schedule_id = es.id
        JOIN subjects s ON es.subject_id = s.id
        WHERE er.student_id = ?
        ORDER BY es.exam_date DESC LIMIT 10
    ");
    $stmt->execute([$childId]);
    $child['recent_grades'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return ['success' => true, 'child' => $child];
}

// ============================================
// TEACHER DASHBOARD
// ============================================
function getTeacherDashboard($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT * FROM teachers WHERE user_id = ?");
    $stmt->execute([$userId]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$teacher) {
        return ['success' => false, 'error' => 'Teacher not found'];
    }
    
    $dashboard = ['teacher' => $teacher];
    
    // Classes count
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM teacher_classes WHERE teacher_id = ?");
    $stmt->execute([$teacher['id']]);
    $dashboard['classes_count'] = $stmt->fetchColumn();
    
    // Today's schedule
    $dayOfWeek = date('l');
    $stmt = $pdo->prepare("
        SELECT t.*, s.subject_name, c.class_name
        FROM timetable t
        JOIN subjects s ON t.subject_id = s.id
        JOIN classes c ON t.class_id = c.id
        WHERE t.teacher_id = ? AND t.day_of_week = ?
        ORDER BY t.start_time
    ");
    $stmt->execute([$teacher['id'], $dayOfWeek]);
    $dashboard['today_schedule'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Pending attendance
    $stmt = $pdo->prepare("
        SELECT c.id, c.class_name,
               (SELECT COUNT(*) FROM students WHERE class_id = c.id AND status = 'active') as student_count,
               (SELECT COUNT(*) FROM attendance WHERE student_id IN 
                   (SELECT id FROM students WHERE class_id = c.id) AND date = CURDATE()) as marked
        FROM classes c
        JOIN teacher_classes tc ON c.id = tc.class_id
        WHERE tc.teacher_id = ?
    ");
    $stmt->execute([$teacher['id']]);
    $dashboard['attendance_status'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return ['success' => true, 'dashboard' => $dashboard];
}

function getTeacherClasses($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT id FROM teachers WHERE user_id = ?");
    $stmt->execute([$userId]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("
        SELECT c.*, 
               (SELECT COUNT(*) FROM students WHERE class_id = c.id AND status = 'active') as student_count
        FROM classes c
        JOIN teacher_classes tc ON c.id = tc.class_id
        WHERE tc.teacher_id = ?
    ");
    $stmt->execute([$teacher['id']]);
    
    return ['success' => true, 'classes' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getTeacherTimetable($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT id FROM teachers WHERE user_id = ?");
    $stmt->execute([$userId]);
    $teacher = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("
        SELECT t.*, s.subject_name, c.class_name
        FROM timetable t
        JOIN subjects s ON t.subject_id = s.id
        JOIN classes c ON t.class_id = c.id
        WHERE t.teacher_id = ?
        ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'), t.start_time
    ");
    $stmt->execute([$teacher['id']]);
    
    return ['success' => true, 'timetable' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function markAttendance($pdo, $data) {
    $marked = 0;
    
    foreach ($data['attendance'] as $record) {
        $stmt = $pdo->prepare("
            INSERT INTO attendance (student_id, date, status, marked_by)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by)
        ");
        $stmt->execute([
            $record['student_id'],
            $data['date'],
            $record['status'],
            $data['teacher_id']
        ]);
        $marked++;
    }
    
    return ['success' => true, 'marked' => $marked];
}

// ============================================
// NOTIFICATIONS
// ============================================
function getNotifications($pdo, $userId, $userType) {
    $stmt = $pdo->prepare("
        SELECT * FROM notifications 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    ");
    $stmt->execute([$userId]);
    
    return ['success' => true, 'notifications' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function markNotificationRead($pdo, $notificationId) {
    $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ?");
    $stmt->execute([$notificationId]);
    
    return ['success' => true];
}

function registerDevice($pdo, $userId, $userType, $data) {
    $stmt = $pdo->prepare("
        INSERT INTO mobile_devices 
        (user_id, user_type, device_id, device_token, device_type, device_name, app_version, os_version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            device_token = VALUES(device_token),
            app_version = VALUES(app_version),
            os_version = VALUES(os_version),
            is_active = 1,
            last_active = NOW()
    ");
    $stmt->execute([
        $userId,
        $userType,
        $data['device_id'],
        $data['device_token'],
        $data['device_type'] ?? 'android',
        $data['device_name'] ?? null,
        $data['app_version'] ?? '1.0.0',
        $data['os_version'] ?? null
    ]);
    
    return ['success' => true];
}

function unregisterDevice($pdo, $deviceId) {
    $stmt = $pdo->prepare("UPDATE mobile_devices SET is_active = 0 WHERE device_id = ?");
    $stmt->execute([$deviceId]);
    
    return ['success' => true];
}

// ============================================
// MESSAGING
// ============================================
function getConversations($pdo, $userId, $userType) {
    // Simplified - would need a proper messaging table
    return ['success' => true, 'conversations' => []];
}

function getMessages($pdo, $conversationId) {
    return ['success' => true, 'messages' => []];
}

function sendMessage($pdo, $userId, $userType, $data) {
    return ['success' => true, 'message_id' => 0];
}

// ============================================
// OFFLINE SUPPORT
// ============================================
function getOfflineData($pdo, $userId, $userType) {
    // Get essential data for offline use
    $data = syncData($pdo, $userId, $userType, null);
    
    // Add static data
    $stmt = $pdo->query("SELECT * FROM subjects WHERE status = 'active'");
    $data['data']['subjects'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return $data;
}

function queueOfflineAction($pdo, $userId, $userType, $deviceId, $data) {
    $stmt = $pdo->prepare("
        INSERT INTO offline_action_queue 
        (user_id, user_type, device_id, action_type, action_data)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $userId,
        $userType,
        $deviceId,
        $data['action_type'],
        json_encode($data['action_data'])
    ]);
    
    return ['success' => true, 'queue_id' => $pdo->lastInsertId()];
}

function processOfflineQueue($pdo, $deviceId) {
    $stmt = $pdo->prepare("
        SELECT * FROM offline_action_queue 
        WHERE device_id = ? AND status = 'pending'
        ORDER BY created_at
    ");
    $stmt->execute([$deviceId]);
    $queue = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $processed = 0;
    $errors = [];
    
    foreach ($queue as $item) {
        try {
            $actionData = json_decode($item['action_data'], true);
            
            // Process based on action type
            switch ($item['action_type']) {
                case 'mark_attendance':
                    markAttendance($pdo, $actionData);
                    break;
                // Add more action types as needed
            }
            
            // Mark as processed
            $stmt = $pdo->prepare("
                UPDATE offline_action_queue SET status = 'processed', processed_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$item['id']]);
            $processed++;
            
        } catch (Exception $e) {
            $stmt = $pdo->prepare("
                UPDATE offline_action_queue SET status = 'failed', error_message = ?
                WHERE id = ?
            ");
            $stmt->execute([$e->getMessage(), $item['id']]);
            $errors[] = ['id' => $item['id'], 'error' => $e->getMessage()];
        }
    }
    
    return ['success' => true, 'processed' => $processed, 'errors' => $errors];
}

// ============================================
// APP CONFIG
// ============================================
function getAppConfig($pdo, $appVersion) {
    return [
        'success' => true,
        'config' => [
            'min_version' => '1.0.0',
            'current_version' => '1.0.0',
            'force_update' => false,
            'maintenance_mode' => false,
            'features' => [
                'offline_mode' => true,
                'push_notifications' => true,
                'biometric_login' => true,
                'dark_mode' => true
            ],
            'sync_interval' => 300, // 5 minutes
            'api_timeout' => 30
        ]
    ];
}

function checkAppUpdate($pdo, $currentVersion) {
    $latestVersion = '1.0.0';
    $minVersion = '1.0.0';
    
    return [
        'success' => true,
        'update_available' => version_compare($currentVersion, $latestVersion, '<'),
        'force_update' => version_compare($currentVersion, $minVersion, '<'),
        'latest_version' => $latestVersion,
        'download_url' => null,
        'release_notes' => null
    ];
}
