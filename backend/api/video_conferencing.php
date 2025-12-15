<?php
/**
 * Video Conferencing Integration API
 * Supports Zoom, Google Meet, and in-app video calls
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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

    // Create necessary tables
    createVideoTables($pdo);

    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? 'list';
    $id = $_GET['id'] ?? null;

    switch ($action) {
        // ============================================
        // MEETINGS
        // ============================================
        case 'meetings':
            handleMeetings($pdo, $method, $id);
            break;
            
        case 'create_meeting':
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(createMeeting($pdo, $data));
            break;
            
        case 'join_meeting':
            $meetingId = $_GET['meeting_id'] ?? null;
            $userId = $_GET['user_id'] ?? null;
            echo json_encode(joinMeeting($pdo, $meetingId, $userId));
            break;
            
        case 'end_meeting':
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(endMeeting($pdo, $data['meeting_id']));
            break;

        // ============================================
        // VIRTUAL CLASSROOMS
        // ============================================
        case 'classrooms':
            handleClassrooms($pdo, $method, $id);
            break;
            
        case 'create_classroom':
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(createVirtualClassroom($pdo, $data));
            break;
            
        case 'classroom_session':
            $classroomId = $_GET['classroom_id'] ?? null;
            echo json_encode(getClassroomSession($pdo, $classroomId));
            break;

        // ============================================
        // ZOOM INTEGRATION
        // ============================================
        case 'zoom_create':
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(createZoomMeeting($pdo, $data));
            break;
            
        case 'zoom_settings':
            if ($method === 'GET') {
                echo json_encode(getZoomSettings($pdo));
            } else {
                $data = json_decode(file_get_contents('php://input'), true);
                echo json_encode(saveZoomSettings($pdo, $data));
            }
            break;

        // ============================================
        // GOOGLE MEET INTEGRATION
        // ============================================
        case 'google_meet_create':
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(createGoogleMeet($pdo, $data));
            break;
            
        case 'google_settings':
            if ($method === 'GET') {
                echo json_encode(getGoogleSettings($pdo));
            } else {
                $data = json_decode(file_get_contents('php://input'), true);
                echo json_encode(saveGoogleSettings($pdo, $data));
            }
            break;

        // ============================================
        // RECORDINGS
        // ============================================
        case 'recordings':
            $meetingId = $_GET['meeting_id'] ?? null;
            echo json_encode(getRecordings($pdo, $meetingId));
            break;
            
        case 'save_recording':
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(saveRecording($pdo, $data));
            break;

        // ============================================
        // ATTENDANCE & ANALYTICS
        // ============================================
        case 'meeting_attendance':
            $meetingId = $_GET['meeting_id'] ?? null;
            echo json_encode(getMeetingAttendance($pdo, $meetingId));
            break;
            
        case 'log_attendance':
            if ($method !== 'POST') {
                echo json_encode(['error' => 'POST required']);
                break;
            }
            $data = json_decode(file_get_contents('php://input'), true);
            echo json_encode(logMeetingAttendance($pdo, $data));
            break;
            
        case 'analytics':
            $teacherId = $_GET['teacher_id'] ?? null;
            $period = $_GET['period'] ?? 30;
            echo json_encode(getMeetingAnalytics($pdo, $teacherId, $period));
            break;

        // ============================================
        // SCHEDULE
        // ============================================
        case 'schedule':
            $userId = $_GET['user_id'] ?? null;
            $userType = $_GET['user_type'] ?? 'teacher';
            echo json_encode(getSchedule($pdo, $userId, $userType));
            break;
            
        case 'upcoming':
            $classId = $_GET['class_id'] ?? null;
            echo json_encode(getUpcomingMeetings($pdo, $classId));
            break;

        default:
            echo json_encode(['error' => 'Invalid action']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error', 'message' => $e->getMessage()]);
}

// ============================================
// TABLE CREATION
// ============================================
function createVideoTables($pdo) {
    // Video meetings table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS video_meetings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            meeting_id VARCHAR(100) UNIQUE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            host_id INT NOT NULL,
            host_type ENUM('teacher', 'admin') DEFAULT 'teacher',
            class_id INT,
            subject_id INT,
            platform ENUM('zoom', 'google_meet', 'in_app', 'jitsi') DEFAULT 'in_app',
            meeting_url VARCHAR(500),
            password VARCHAR(50),
            start_time DATETIME NOT NULL,
            end_time DATETIME,
            duration_minutes INT DEFAULT 60,
            status ENUM('scheduled', 'live', 'ended', 'cancelled') DEFAULT 'scheduled',
            is_recurring TINYINT(1) DEFAULT 0,
            recurrence_pattern VARCHAR(50),
            max_participants INT DEFAULT 100,
            waiting_room TINYINT(1) DEFAULT 1,
            record_meeting TINYINT(1) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_host_id (host_id),
            INDEX idx_class_id (class_id),
            INDEX idx_start_time (start_time),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Virtual classrooms table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS virtual_classrooms (
            id INT AUTO_INCREMENT PRIMARY KEY,
            classroom_id VARCHAR(100) UNIQUE,
            name VARCHAR(255) NOT NULL,
            class_id INT NOT NULL,
            subject_id INT,
            teacher_id INT NOT NULL,
            description TEXT,
            room_url VARCHAR(500),
            is_active TINYINT(1) DEFAULT 1,
            features JSON,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_class_id (class_id),
            INDEX idx_teacher_id (teacher_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Meeting participants table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS meeting_participants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            meeting_id INT NOT NULL,
            user_id INT NOT NULL,
            user_type ENUM('student', 'teacher', 'parent', 'admin') NOT NULL,
            join_time DATETIME,
            leave_time DATETIME,
            duration_seconds INT DEFAULT 0,
            device_type VARCHAR(50),
            connection_quality VARCHAR(20),
            is_host TINYINT(1) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_meeting_id (meeting_id),
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Meeting recordings table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS meeting_recordings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            meeting_id INT NOT NULL,
            recording_url VARCHAR(500),
            recording_type ENUM('video', 'audio', 'transcript') DEFAULT 'video',
            file_size BIGINT,
            duration_seconds INT,
            download_url VARCHAR(500),
            password VARCHAR(50),
            expires_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_meeting_id (meeting_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Integration settings table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS video_integration_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            platform VARCHAR(50) NOT NULL,
            setting_key VARCHAR(100) NOT NULL,
            setting_value TEXT,
            is_encrypted TINYINT(1) DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_platform_key (platform, setting_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Meeting invitations table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS meeting_invitations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            meeting_id INT NOT NULL,
            user_id INT NOT NULL,
            user_type VARCHAR(20) NOT NULL,
            email VARCHAR(255),
            status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
            notified_at DATETIME,
            responded_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_meeting_id (meeting_id),
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
}

// ============================================
// MEETING FUNCTIONS
// ============================================
function handleMeetings($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("
                    SELECT m.*, 
                           CONCAT(t.first_name, ' ', t.last_name) as host_name,
                           c.class_name,
                           s.subject_name,
                           (SELECT COUNT(*) FROM meeting_participants WHERE meeting_id = m.id) as participant_count
                    FROM video_meetings m
                    LEFT JOIN teachers t ON m.host_id = t.id AND m.host_type = 'teacher'
                    LEFT JOIN classes c ON m.class_id = c.id
                    LEFT JOIN subjects s ON m.subject_id = s.id
                    WHERE m.id = ?
                ");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'meeting' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            } else {
                $classId = $_GET['class_id'] ?? null;
                $hostId = $_GET['host_id'] ?? null;
                $status = $_GET['status'] ?? null;
                
                $sql = "
                    SELECT m.*, 
                           CONCAT(t.first_name, ' ', t.last_name) as host_name,
                           c.class_name,
                           s.subject_name
                    FROM video_meetings m
                    LEFT JOIN teachers t ON m.host_id = t.id AND m.host_type = 'teacher'
                    LEFT JOIN classes c ON m.class_id = c.id
                    LEFT JOIN subjects s ON m.subject_id = s.id
                    WHERE 1=1
                ";
                $params = [];
                
                if ($classId) {
                    $sql .= " AND m.class_id = ?";
                    $params[] = $classId;
                }
                if ($hostId) {
                    $sql .= " AND m.host_id = ?";
                    $params[] = $hostId;
                }
                if ($status) {
                    $sql .= " AND m.status = ?";
                    $params[] = $status;
                }
                
                $sql .= " ORDER BY m.start_time DESC LIMIT 50";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                echo json_encode(['success' => true, 'meetings' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
            }
            break;
            
        case 'DELETE':
            if ($id) {
                $stmt = $pdo->prepare("UPDATE video_meetings SET status = 'cancelled' WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'message' => 'Meeting cancelled']);
            }
            break;
    }
}

function createMeeting($pdo, $data) {
    $meetingId = 'MTG-' . strtoupper(bin2hex(random_bytes(6)));
    $password = bin2hex(random_bytes(4));
    
    // Generate meeting URL based on platform
    $platform = $data['platform'] ?? 'in_app';
    $meetingUrl = generateMeetingUrl($platform, $meetingId);
    
    $stmt = $pdo->prepare("
        INSERT INTO video_meetings 
        (meeting_id, title, description, host_id, host_type, class_id, subject_id, 
         platform, meeting_url, password, start_time, duration_minutes, 
         is_recurring, recurrence_pattern, max_participants, waiting_room, record_meeting)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $meetingId,
        $data['title'],
        $data['description'] ?? null,
        $data['host_id'],
        $data['host_type'] ?? 'teacher',
        $data['class_id'] ?? null,
        $data['subject_id'] ?? null,
        $platform,
        $meetingUrl,
        $password,
        $data['start_time'],
        $data['duration_minutes'] ?? 60,
        $data['is_recurring'] ?? 0,
        $data['recurrence_pattern'] ?? null,
        $data['max_participants'] ?? 100,
        $data['waiting_room'] ?? 1,
        $data['record_meeting'] ?? 0
    ]);
    
    $id = $pdo->lastInsertId();
    
    // Send invitations if class_id provided
    if (!empty($data['class_id'])) {
        sendMeetingInvitations($pdo, $id, $data['class_id']);
    }
    
    return [
        'success' => true,
        'id' => $id,
        'meeting_id' => $meetingId,
        'meeting_url' => $meetingUrl,
        'password' => $password
    ];
}

function generateMeetingUrl($platform, $meetingId) {
    switch ($platform) {
        case 'jitsi':
            return "https://meet.jit.si/mcsms-{$meetingId}";
        case 'in_app':
        default:
            return "/video-call/{$meetingId}";
    }
}

function joinMeeting($pdo, $meetingId, $userId) {
    // Get meeting details
    $stmt = $pdo->prepare("SELECT * FROM video_meetings WHERE id = ? OR meeting_id = ?");
    $stmt->execute([$meetingId, $meetingId]);
    $meeting = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$meeting) {
        return ['success' => false, 'error' => 'Meeting not found'];
    }
    
    if ($meeting['status'] === 'cancelled') {
        return ['success' => false, 'error' => 'Meeting has been cancelled'];
    }
    
    if ($meeting['status'] === 'ended') {
        return ['success' => false, 'error' => 'Meeting has ended'];
    }
    
    // Update meeting status to live if not already
    if ($meeting['status'] === 'scheduled') {
        $stmt = $pdo->prepare("UPDATE video_meetings SET status = 'live' WHERE id = ?");
        $stmt->execute([$meeting['id']]);
    }
    
    // Log participant join
    $stmt = $pdo->prepare("
        INSERT INTO meeting_participants (meeting_id, user_id, user_type, join_time, device_type)
        VALUES (?, ?, ?, NOW(), ?)
    ");
    $stmt->execute([
        $meeting['id'],
        $userId,
        $_GET['user_type'] ?? 'student',
        $_GET['device'] ?? 'web'
    ]);
    
    return [
        'success' => true,
        'meeting' => $meeting,
        'join_url' => $meeting['meeting_url'],
        'password' => $meeting['password']
    ];
}

function endMeeting($pdo, $meetingId) {
    // Update meeting status
    $stmt = $pdo->prepare("
        UPDATE video_meetings 
        SET status = 'ended', end_time = NOW() 
        WHERE id = ? OR meeting_id = ?
    ");
    $stmt->execute([$meetingId, $meetingId]);
    
    // Update all participants' leave time
    $stmt = $pdo->prepare("
        UPDATE meeting_participants 
        SET leave_time = NOW(),
            duration_seconds = TIMESTAMPDIFF(SECOND, join_time, NOW())
        WHERE meeting_id = ? AND leave_time IS NULL
    ");
    $stmt->execute([$meetingId]);
    
    return ['success' => true, 'message' => 'Meeting ended'];
}

function sendMeetingInvitations($pdo, $meetingId, $classId) {
    // Get all students in the class
    $stmt = $pdo->prepare("
        SELECT id, email FROM students WHERE class_id = ? AND status = 'active'
    ");
    $stmt->execute([$classId]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($students as $student) {
        $stmt = $pdo->prepare("
            INSERT INTO meeting_invitations (meeting_id, user_id, user_type, email, notified_at)
            VALUES (?, ?, 'student', ?, NOW())
        ");
        $stmt->execute([$meetingId, $student['id'], $student['email']]);
    }
    
    // Create notifications
    $stmt = $pdo->prepare("SELECT title, start_time FROM video_meetings WHERE id = ?");
    $stmt->execute([$meetingId]);
    $meeting = $stmt->fetch(PDO::FETCH_ASSOC);
    
    foreach ($students as $student) {
        // Get user_id for student
        $stmt = $pdo->prepare("SELECT user_id FROM students WHERE id = ?");
        $stmt->execute([$student['id']]);
        $userData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($userData && $userData['user_id']) {
            $stmt = $pdo->prepare("
                INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
                VALUES (?, 'New Virtual Class', ?, 'meeting', 0, NOW())
            ");
            $message = "You have been invited to '{$meeting['title']}' on " . date('M d, Y h:i A', strtotime($meeting['start_time']));
            $stmt->execute([$userData['user_id'], $message]);
        }
    }
}

// ============================================
// VIRTUAL CLASSROOM FUNCTIONS
// ============================================
function handleClassrooms($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("
                    SELECT vc.*, 
                           c.class_name,
                           s.subject_name,
                           CONCAT(t.first_name, ' ', t.last_name) as teacher_name
                    FROM virtual_classrooms vc
                    LEFT JOIN classes c ON vc.class_id = c.id
                    LEFT JOIN subjects s ON vc.subject_id = s.id
                    LEFT JOIN teachers t ON vc.teacher_id = t.id
                    WHERE vc.id = ?
                ");
                $stmt->execute([$id]);
                $classroom = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($classroom) {
                    $classroom['features'] = json_decode($classroom['features'], true);
                }
                echo json_encode(['success' => true, 'classroom' => $classroom]);
            } else {
                $teacherId = $_GET['teacher_id'] ?? null;
                $classId = $_GET['class_id'] ?? null;
                
                $sql = "
                    SELECT vc.*, 
                           c.class_name,
                           s.subject_name,
                           CONCAT(t.first_name, ' ', t.last_name) as teacher_name
                    FROM virtual_classrooms vc
                    LEFT JOIN classes c ON vc.class_id = c.id
                    LEFT JOIN subjects s ON vc.subject_id = s.id
                    LEFT JOIN teachers t ON vc.teacher_id = t.id
                    WHERE vc.is_active = 1
                ";
                $params = [];
                
                if ($teacherId) {
                    $sql .= " AND vc.teacher_id = ?";
                    $params[] = $teacherId;
                }
                if ($classId) {
                    $sql .= " AND vc.class_id = ?";
                    $params[] = $classId;
                }
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $classrooms = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                foreach ($classrooms as &$classroom) {
                    $classroom['features'] = json_decode($classroom['features'], true);
                }
                
                echo json_encode(['success' => true, 'classrooms' => $classrooms]);
            }
            break;
    }
}

function createVirtualClassroom($pdo, $data) {
    $classroomId = 'VCR-' . strtoupper(bin2hex(random_bytes(6)));
    $roomUrl = "https://meet.jit.si/mcsms-classroom-{$classroomId}";
    
    $features = [
        'whiteboard' => $data['whiteboard'] ?? true,
        'screen_share' => $data['screen_share'] ?? true,
        'chat' => $data['chat'] ?? true,
        'hand_raise' => $data['hand_raise'] ?? true,
        'breakout_rooms' => $data['breakout_rooms'] ?? false,
        'polls' => $data['polls'] ?? true,
        'recording' => $data['recording'] ?? false
    ];
    
    $stmt = $pdo->prepare("
        INSERT INTO virtual_classrooms 
        (classroom_id, name, class_id, subject_id, teacher_id, description, room_url, features)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $classroomId,
        $data['name'],
        $data['class_id'],
        $data['subject_id'] ?? null,
        $data['teacher_id'],
        $data['description'] ?? null,
        $roomUrl,
        json_encode($features)
    ]);
    
    return [
        'success' => true,
        'id' => $pdo->lastInsertId(),
        'classroom_id' => $classroomId,
        'room_url' => $roomUrl
    ];
}

function getClassroomSession($pdo, $classroomId) {
    $stmt = $pdo->prepare("
        SELECT vc.*, 
               c.class_name,
               s.subject_name,
               CONCAT(t.first_name, ' ', t.last_name) as teacher_name,
               t.email as teacher_email
        FROM virtual_classrooms vc
        LEFT JOIN classes c ON vc.class_id = c.id
        LEFT JOIN subjects s ON vc.subject_id = s.id
        LEFT JOIN teachers t ON vc.teacher_id = t.id
        WHERE vc.id = ? OR vc.classroom_id = ?
    ");
    $stmt->execute([$classroomId, $classroomId]);
    $classroom = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$classroom) {
        return ['success' => false, 'error' => 'Classroom not found'];
    }
    
    $classroom['features'] = json_decode($classroom['features'], true);
    
    // Get students in this class
    $stmt = $pdo->prepare("
        SELECT id, CONCAT(first_name, ' ', last_name) as name, photo
        FROM students
        WHERE class_id = ? AND status = 'active'
    ");
    $stmt->execute([$classroom['class_id']]);
    $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return [
        'success' => true,
        'classroom' => $classroom,
        'students' => $students,
        'join_url' => $classroom['room_url']
    ];
}

// ============================================
// ZOOM INTEGRATION
// ============================================
function createZoomMeeting($pdo, $data) {
    $settings = getZoomSettings($pdo);
    
    if (!$settings['success'] || empty($settings['settings']['api_key'])) {
        // Fallback to Jitsi if Zoom not configured
        $data['platform'] = 'jitsi';
        return createMeeting($pdo, $data);
    }
    
    // In production, you would make API call to Zoom
    // For now, we'll create a meeting record with Zoom as platform
    $data['platform'] = 'zoom';
    $meeting = createMeeting($pdo, $data);
    
    // Update with Zoom-specific URL (would come from API response)
    $zoomUrl = "https://zoom.us/j/" . rand(10000000000, 99999999999);
    $stmt = $pdo->prepare("UPDATE video_meetings SET meeting_url = ? WHERE id = ?");
    $stmt->execute([$zoomUrl, $meeting['id']]);
    
    $meeting['meeting_url'] = $zoomUrl;
    $meeting['platform'] = 'zoom';
    
    return $meeting;
}

function getZoomSettings($pdo) {
    $stmt = $pdo->query("
        SELECT setting_key, setting_value 
        FROM video_integration_settings 
        WHERE platform = 'zoom'
    ");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $settings = [];
    foreach ($rows as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
    
    return ['success' => true, 'settings' => $settings];
}

function saveZoomSettings($pdo, $data) {
    $keys = ['api_key', 'api_secret', 'webhook_token', 'sdk_key', 'sdk_secret'];
    
    foreach ($keys as $key) {
        if (isset($data[$key])) {
            $stmt = $pdo->prepare("
                INSERT INTO video_integration_settings (platform, setting_key, setting_value, is_encrypted)
                VALUES ('zoom', ?, ?, 1)
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
            ");
            $stmt->execute([$key, $data[$key]]);
        }
    }
    
    return ['success' => true, 'message' => 'Zoom settings saved'];
}

// ============================================
// GOOGLE MEET INTEGRATION
// ============================================
function createGoogleMeet($pdo, $data) {
    $settings = getGoogleSettings($pdo);
    
    if (!$settings['success'] || empty($settings['settings']['client_id'])) {
        // Fallback to Jitsi if Google Meet not configured
        $data['platform'] = 'jitsi';
        return createMeeting($pdo, $data);
    }
    
    // In production, you would use Google Calendar API to create Meet link
    $data['platform'] = 'google_meet';
    $meeting = createMeeting($pdo, $data);
    
    // Update with Google Meet URL (would come from API response)
    $meetCode = strtolower(bin2hex(random_bytes(5)));
    $googleMeetUrl = "https://meet.google.com/{$meetCode}";
    $stmt = $pdo->prepare("UPDATE video_meetings SET meeting_url = ? WHERE id = ?");
    $stmt->execute([$googleMeetUrl, $meeting['id']]);
    
    $meeting['meeting_url'] = $googleMeetUrl;
    $meeting['platform'] = 'google_meet';
    
    return $meeting;
}

function getGoogleSettings($pdo) {
    $stmt = $pdo->query("
        SELECT setting_key, setting_value 
        FROM video_integration_settings 
        WHERE platform = 'google'
    ");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $settings = [];
    foreach ($rows as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
    
    return ['success' => true, 'settings' => $settings];
}

function saveGoogleSettings($pdo, $data) {
    $keys = ['client_id', 'client_secret', 'api_key', 'calendar_id'];
    
    foreach ($keys as $key) {
        if (isset($data[$key])) {
            $stmt = $pdo->prepare("
                INSERT INTO video_integration_settings (platform, setting_key, setting_value, is_encrypted)
                VALUES ('google', ?, ?, 1)
                ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
            ");
            $stmt->execute([$key, $data[$key]]);
        }
    }
    
    return ['success' => true, 'message' => 'Google settings saved'];
}

// ============================================
// RECORDINGS
// ============================================
function getRecordings($pdo, $meetingId = null) {
    if ($meetingId) {
        $stmt = $pdo->prepare("
            SELECT r.*, m.title as meeting_title
            FROM meeting_recordings r
            JOIN video_meetings m ON r.meeting_id = m.id
            WHERE r.meeting_id = ?
            ORDER BY r.created_at DESC
        ");
        $stmt->execute([$meetingId]);
    } else {
        $stmt = $pdo->query("
            SELECT r.*, m.title as meeting_title
            FROM meeting_recordings r
            JOIN video_meetings m ON r.meeting_id = m.id
            ORDER BY r.created_at DESC
            LIMIT 50
        ");
    }
    
    return ['success' => true, 'recordings' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function saveRecording($pdo, $data) {
    $stmt = $pdo->prepare("
        INSERT INTO meeting_recordings 
        (meeting_id, recording_url, recording_type, file_size, duration_seconds, download_url, password, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['meeting_id'],
        $data['recording_url'],
        $data['recording_type'] ?? 'video',
        $data['file_size'] ?? null,
        $data['duration_seconds'] ?? null,
        $data['download_url'] ?? null,
        $data['password'] ?? null,
        $data['expires_at'] ?? null
    ]);
    
    return ['success' => true, 'id' => $pdo->lastInsertId()];
}

// ============================================
// ATTENDANCE & ANALYTICS
// ============================================
function getMeetingAttendance($pdo, $meetingId) {
    $stmt = $pdo->prepare("
        SELECT mp.*,
               CASE 
                   WHEN mp.user_type = 'student' THEN CONCAT(s.first_name, ' ', s.last_name)
                   WHEN mp.user_type = 'teacher' THEN CONCAT(t.first_name, ' ', t.last_name)
                   ELSE 'Unknown'
               END as user_name
        FROM meeting_participants mp
        LEFT JOIN students s ON mp.user_id = s.id AND mp.user_type = 'student'
        LEFT JOIN teachers t ON mp.user_id = t.id AND mp.user_type = 'teacher'
        WHERE mp.meeting_id = ?
        ORDER BY mp.join_time
    ");
    $stmt->execute([$meetingId]);
    
    return ['success' => true, 'attendance' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function logMeetingAttendance($pdo, $data) {
    if ($data['action'] === 'leave') {
        $stmt = $pdo->prepare("
            UPDATE meeting_participants 
            SET leave_time = NOW(),
                duration_seconds = TIMESTAMPDIFF(SECOND, join_time, NOW())
            WHERE meeting_id = ? AND user_id = ? AND leave_time IS NULL
        ");
        $stmt->execute([$data['meeting_id'], $data['user_id']]);
    }
    
    return ['success' => true];
}

function getMeetingAnalytics($pdo, $teacherId = null, $period = 30) {
    $params = [];
    $teacherCondition = "";
    
    if ($teacherId) {
        $teacherCondition = "AND m.host_id = ?";
        $params[] = $teacherId;
    }
    
    // Total meetings
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(*) as total_meetings,
            SUM(CASE WHEN status = 'ended' THEN 1 ELSE 0 END) as completed_meetings,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_meetings,
            AVG(duration_minutes) as avg_duration
        FROM video_meetings m
        WHERE m.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        $teacherCondition
    ");
    $stmt->execute(array_merge([$period], $params));
    $summary = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Participation stats
    $stmt = $pdo->prepare("
        SELECT 
            COUNT(DISTINCT mp.user_id) as unique_participants,
            AVG(mp.duration_seconds) as avg_participation_time,
            SUM(mp.duration_seconds) as total_participation_time
        FROM meeting_participants mp
        JOIN video_meetings m ON mp.meeting_id = m.id
        WHERE m.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        $teacherCondition
    ");
    $stmt->execute(array_merge([$period], $params));
    $participation = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Meetings by day
    $stmt = $pdo->prepare("
        SELECT DATE(start_time) as date, COUNT(*) as count
        FROM video_meetings m
        WHERE m.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        $teacherCondition
        GROUP BY DATE(start_time)
        ORDER BY date
    ");
    $stmt->execute(array_merge([$period], $params));
    $byDay = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    return [
        'success' => true,
        'summary' => $summary,
        'participation' => $participation,
        'meetings_by_day' => $byDay
    ];
}

// ============================================
// SCHEDULE
// ============================================
function getSchedule($pdo, $userId, $userType) {
    if ($userType === 'teacher') {
        $stmt = $pdo->prepare("
            SELECT m.*, c.class_name, s.subject_name
            FROM video_meetings m
            LEFT JOIN classes c ON m.class_id = c.id
            LEFT JOIN subjects s ON m.subject_id = s.id
            WHERE m.host_id = ? AND m.status IN ('scheduled', 'live')
            AND m.start_time >= NOW()
            ORDER BY m.start_time
            LIMIT 20
        ");
        $stmt->execute([$userId]);
    } else {
        // For students, get meetings for their class
        $stmt = $pdo->prepare("
            SELECT m.*, c.class_name, s.subject_name,
                   CONCAT(t.first_name, ' ', t.last_name) as host_name
            FROM video_meetings m
            LEFT JOIN classes c ON m.class_id = c.id
            LEFT JOIN subjects s ON m.subject_id = s.id
            LEFT JOIN teachers t ON m.host_id = t.id
            WHERE m.class_id = (SELECT class_id FROM students WHERE id = ?)
            AND m.status IN ('scheduled', 'live')
            AND m.start_time >= NOW()
            ORDER BY m.start_time
            LIMIT 20
        ");
        $stmt->execute([$userId]);
    }
    
    return ['success' => true, 'schedule' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}

function getUpcomingMeetings($pdo, $classId = null) {
    $sql = "
        SELECT m.*, c.class_name, s.subject_name,
               CONCAT(t.first_name, ' ', t.last_name) as host_name
        FROM video_meetings m
        LEFT JOIN classes c ON m.class_id = c.id
        LEFT JOIN subjects s ON m.subject_id = s.id
        LEFT JOIN teachers t ON m.host_id = t.id
        WHERE m.status IN ('scheduled', 'live')
        AND m.start_time >= NOW()
    ";
    $params = [];
    
    if ($classId) {
        $sql .= " AND m.class_id = ?";
        $params[] = $classId;
    }
    
    $sql .= " ORDER BY m.start_time LIMIT 10";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    return ['success' => true, 'meetings' => $stmt->fetchAll(PDO::FETCH_ASSOC)];
}
