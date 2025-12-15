<?php
/**
 * Mobile API v1 - Parent Endpoints
 * Optimized for mobile app usage
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/auth.php';

// Verify JWT token
function verifyToken() {
    $token = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $token = str_replace('Bearer ', '', $token);
    
    if (!$token) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Token required']);
        exit;
    }
    
    $payload = JWT::decode($token);
    
    if (!$payload || $payload['exp'] < time()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid or expired token']);
        exit;
    }
    
    return $payload;
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $payload = verifyToken();
    $userId = $payload['user_id'];
    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($action) {
        case 'dashboard':
            // Get parent's children
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as total_children
                FROM students
                WHERE parent_id = ? AND status = 'active'
            ");
            $stmt->execute([$userId]);
            $children = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get pending applications
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as pending_applications
                FROM student_applications
                WHERE parent_id = ? AND status = 'pending'
            ");
            $stmt->execute([$userId]);
            $applications = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get outstanding fees
            $stmt = $pdo->prepare("
                SELECT SUM(i.balance) as outstanding_fees
                FROM invoices i
                JOIN students s ON i.student_id = s.id
                WHERE s.parent_id = ? AND i.balance > 0
            ");
            $stmt->execute([$userId]);
            $fees = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Get recent notifications
            $stmt = $pdo->prepare("
                SELECT * FROM notifications
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 5
            ");
            $stmt->execute([$userId]);
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'dashboard' => [
                    'total_children' => (int)$children['total_children'],
                    'pending_applications' => (int)$applications['pending_applications'],
                    'outstanding_fees' => (float)($fees['outstanding_fees'] ?? 0),
                    'recent_notifications' => $notifications
                ]
            ]);
            break;

        case 'children':
            // Get all children
            $stmt = $pdo->prepare("
                SELECT 
                    s.*,
                    c.class_name,
                    c.level
                FROM students s
                LEFT JOIN classes c ON s.class_id = c.id
                WHERE s.parent_id = ?
                ORDER BY s.created_at DESC
            ");
            $stmt->execute([$userId]);
            $children = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'children' => $children
            ]);
            break;

        case 'child_details':
            $studentId = $_GET['student_id'] ?? null;
            
            if (!$studentId) {
                throw new Exception('Student ID required');
            }
            
            // Verify ownership
            $stmt = $pdo->prepare("
                SELECT 
                    s.*,
                    c.class_name,
                    c.level
                FROM students s
                LEFT JOIN classes c ON s.class_id = c.id
                WHERE s.id = ? AND s.parent_id = ?
            ");
            $stmt->execute([$studentId, $userId]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$student) {
                throw new Exception('Student not found or access denied');
            }
            
            // Get recent attendance
            $stmt = $pdo->prepare("
                SELECT * FROM attendance
                WHERE student_id = ?
                ORDER BY date DESC
                LIMIT 10
            ");
            $stmt->execute([$studentId]);
            $attendance = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get recent grades
            $stmt = $pdo->prepare("
                SELECT 
                    g.*,
                    s.subject_name,
                    a.assessment_name
                FROM grades g
                JOIN assessments a ON g.assessment_id = a.id
                JOIN subjects s ON a.subject_id = s.id
                WHERE g.student_id = ?
                ORDER BY a.assessment_date DESC
                LIMIT 10
            ");
            $stmt->execute([$studentId]);
            $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'student' => $student,
                'recent_attendance' => $attendance,
                'recent_grades' => $grades
            ]);
            break;

        case 'invoices':
            // Get all invoices for parent's children
            $stmt = $pdo->prepare("
                SELECT 
                    i.*,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    s.student_id,
                    c.class_name
                FROM invoices i
                JOIN students s ON i.student_id = s.id
                JOIN classes c ON s.class_id = c.id
                WHERE s.parent_id = ?
                ORDER BY i.created_at DESC
            ");
            $stmt->execute([$userId]);
            $invoices = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'invoices' => $invoices
            ]);
            break;

        case 'invoice_details':
            $invoiceId = $_GET['invoice_id'] ?? null;
            
            if (!$invoiceId) {
                throw new Exception('Invoice ID required');
            }
            
            // Get invoice with ownership verification
            $stmt = $pdo->prepare("
                SELECT 
                    i.*,
                    CONCAT(s.first_name, ' ', s.last_name) as student_name,
                    s.student_id,
                    c.class_name
                FROM invoices i
                JOIN students s ON i.student_id = s.id
                JOIN classes c ON s.class_id = c.id
                WHERE i.id = ? AND s.parent_id = ?
            ");
            $stmt->execute([$invoiceId, $userId]);
            $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$invoice) {
                throw new Exception('Invoice not found or access denied');
            }
            
            // Get invoice items
            $stmt = $pdo->prepare("SELECT * FROM invoice_items WHERE invoice_id = ?");
            $stmt->execute([$invoiceId]);
            $invoice['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get payment history
            $stmt = $pdo->prepare("
                SELECT * FROM payments
                WHERE invoice_id = ?
                ORDER BY payment_date DESC
            ");
            $stmt->execute([$invoiceId]);
            $invoice['payments'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'invoice' => $invoice
            ]);
            break;

        case 'applications':
            // Get all applications
            $stmt = $pdo->prepare("
                SELECT * FROM student_applications
                WHERE parent_id = ?
                ORDER BY created_at DESC
            ");
            $stmt->execute([$userId]);
            $applications = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'applications' => $applications
            ]);
            break;

        case 'submit_application':
            if ($method !== 'POST') {
                throw new Exception('POST method required');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Required fields
            $required = ['first_name', 'last_name', 'date_of_birth', 'gender', 'class_applying_for'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    throw new Exception("Field {$field} is required");
                }
            }
            
            // Generate application number
            $appNumber = 'APP-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            
            // Insert application
            $stmt = $pdo->prepare("
                INSERT INTO student_applications (
                    parent_id, application_number, first_name, last_name, 
                    date_of_birth, gender, class_applying_for, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
            ");
            $stmt->execute([
                $userId,
                $appNumber,
                $data['first_name'],
                $data['last_name'],
                $data['date_of_birth'],
                $data['gender'],
                $data['class_applying_for']
            ]);
            
            $applicationId = $pdo->lastInsertId();
            
            echo json_encode([
                'success' => true,
                'message' => 'Application submitted successfully',
                'application_id' => $applicationId,
                'application_number' => $appNumber
            ]);
            break;

        case 'notifications':
            $limit = $_GET['limit'] ?? 20;
            $offset = $_GET['offset'] ?? 0;
            
            $stmt = $pdo->prepare("
                SELECT * FROM notifications
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            ");
            $stmt->execute([$userId, (int)$limit, (int)$offset]);
            $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Get unread count
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as unread_count
                FROM notifications
                WHERE user_id = ? AND is_read = 0
            ");
            $stmt->execute([$userId]);
            $unread = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'notifications' => $notifications,
                'unread_count' => (int)$unread['unread_count']
            ]);
            break;

        case 'mark_notification_read':
            if ($method !== 'POST') {
                throw new Exception('POST method required');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $notificationId = $data['notification_id'] ?? null;
            
            if (!$notificationId) {
                throw new Exception('Notification ID required');
            }
            
            $stmt = $pdo->prepare("
                UPDATE notifications
                SET is_read = 1, read_at = NOW()
                WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$notificationId, $userId]);
            
            echo json_encode(['success' => true]);
            break;

        case 'profile':
            if ($method === 'GET') {
                // Get profile
                $stmt = $pdo->prepare("
                    SELECT id, name, email, phone, profile_picture, user_type, status, created_at
                    FROM users
                    WHERE id = ?
                ");
                $stmt->execute([$userId]);
                $profile = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'success' => true,
                    'profile' => $profile
                ]);
            } elseif ($method === 'PUT') {
                // Update profile
                $data = json_decode(file_get_contents('php://input'), true);
                
                $updateFields = [];
                $params = [];
                
                if (isset($data['name'])) {
                    $updateFields[] = "name = ?";
                    $params[] = $data['name'];
                }
                if (isset($data['phone'])) {
                    $updateFields[] = "phone = ?";
                    $params[] = $data['phone'];
                }
                
                if (empty($updateFields)) {
                    throw new Exception('No fields to update');
                }
                
                $params[] = $userId;
                
                $sql = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Profile updated successfully'
                ]);
            }
            break;

        default:
            throw new Exception('Invalid action');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
