<?php
/**
 * Onboarding API
 * Manage user and system onboarding progress
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
    $action = $_GET['action'] ?? '';

    switch ($action) {
        case 'status':
            getOnboardingStatus($pdo);
            break;
            
        case 'complete_step':
            completeStep($pdo);
            break;
            
        case 'skip_step':
            skipStep($pdo);
            break;
            
        case 'system_status':
            getSystemStatus($pdo);
            break;
            
        case 'update_system':
            updateSystemStatus($pdo);
            break;
            
        default:
            throw new Exception('Invalid action');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

function getOnboardingStatus($pdo) {
    // Get user ID from session/token (simplified for now)
    $userId = $_GET['user_id'] ?? 1;
    
    $stmt = $pdo->prepare("
        SELECT step, completed, completed_at, skipped, data
        FROM user_onboarding
        WHERE user_id = ?
    ");
    $stmt->execute([$userId]);
    $steps = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check if this is first login
    $isFirstLogin = empty($steps);
    
    // Get system onboarding status
    $systemStmt = $pdo->query("SELECT * FROM system_onboarding WHERE id = 1");
    $systemStatus = $systemStmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'is_first_login' => $isFirstLogin,
        'user_steps' => $steps,
        'system_status' => $systemStatus
    ]);
}

function completeStep($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = $data['user_id'] ?? 1;
    $step = $data['step'] ?? '';
    $stepData = $data['data'] ?? null;
    
    if (empty($step)) {
        throw new Exception('Step is required');
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO user_onboarding (user_id, step, completed, completed_at, data)
        VALUES (?, ?, TRUE, NOW(), ?)
        ON DUPLICATE KEY UPDATE 
            completed = TRUE,
            completed_at = NOW(),
            data = VALUES(data)
    ");
    $stmt->execute([$userId, $step, json_encode($stepData)]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Step completed'
    ]);
}

function skipStep($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    $userId = $data['user_id'] ?? 1;
    $step = $data['step'] ?? '';
    
    if (empty($step)) {
        throw new Exception('Step is required');
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO user_onboarding (user_id, step, skipped)
        VALUES (?, ?, TRUE)
        ON DUPLICATE KEY UPDATE skipped = TRUE
    ");
    $stmt->execute([$userId, $step]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Step skipped'
    ]);
}

function getSystemStatus($pdo) {
    $stmt = $pdo->query("SELECT * FROM system_onboarding WHERE id = 1");
    $status = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Calculate completion percentage
    $fields = [
        'school_setup_completed',
        'academic_config_completed',
        'classes_created',
        'subjects_created',
        'users_added',
        'first_term_created'
    ];
    
    $completed = 0;
    foreach ($fields as $field) {
        if ($status[$field]) $completed++;
    }
    
    $percentage = round(($completed / count($fields)) * 100);
    
    echo json_encode([
        'success' => true,
        'status' => $status,
        'completion_percentage' => $percentage,
        'completed_steps' => $completed,
        'total_steps' => count($fields)
    ]);
}

function updateSystemStatus($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $allowedFields = [
        'school_setup_completed',
        'academic_config_completed',
        'classes_created',
        'subjects_created',
        'users_added',
        'first_term_created',
        'data_imported',
        'onboarding_completed'
    ];
    
    $updates = [];
    $values = [];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = ?";
            $values[] = $data[$field] ? 1 : 0;
        }
    }
    
    if (empty($updates)) {
        throw new Exception('No fields to update');
    }
    
    $sql = "UPDATE system_onboarding SET " . implode(', ', $updates) . " WHERE id = 1";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);
    
    echo json_encode([
        'success' => true,
        'message' => 'System status updated'
    ]);
}
?>
