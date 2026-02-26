<?php
/**
 * Audit Log API
 * Handles audit log retrieval, statistics, and export
 */

// Load security bootstrap
require_once __DIR__ . '/../middleware/security_bootstrap.php';

// Initialize security
SecurityBootstrap::init();

require_once __DIR__ . '/../src/Audit/AuditLogService.php';

use McSMS\Audit\AuditLogService;

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

// Verify admin access
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (strpos($authHeader, 'Bearer ') !== 0) {
    SecurityBootstrap::errorResponse('Unauthorized', 401);
}

try {
    $auditService = new AuditLogService();
    
    switch ($method) {
        case 'GET':
            handleGet($auditService, $action);
            break;
            
        default:
            SecurityBootstrap::errorResponse('Method not allowed', 405);
    }
} catch (Exception $e) {
    SecurityBootstrap::errorResponse($e->getMessage(), 500);
}

/**
 * Handle GET requests
 */
function handleGet($auditService, $action) {
    switch ($action) {
        case 'list':
            $filters = [
                'user_id' => $_GET['user_id'] ?? null,
                'action' => $_GET['filter_action'] ?? null,
                'entity_type' => $_GET['entity_type'] ?? null,
                'entity_id' => $_GET['entity_id'] ?? null,
                'severity' => $_GET['severity'] ?? null,
                'date_from' => $_GET['date_from'] ?? null,
                'date_to' => $_GET['date_to'] ?? null,
                'search' => $_GET['search'] ?? null,
            ];
            
            // Remove empty filters
            $filters = array_filter($filters, function($v) { return $v !== null && $v !== ''; });
            
            $page = max(1, (int) ($_GET['page'] ?? 1));
            $limit = min(100, max(10, (int) ($_GET['limit'] ?? 50)));
            
            $result = $auditService->getLogs($filters, $page, $limit);
            
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => $result['logs'],
                'pagination' => [
                    'total' => $result['total'],
                    'page' => $result['page'],
                    'limit' => $result['limit'],
                    'pages' => $result['pages'],
                ],
            ]);
            break;
            
        case 'detail':
            $id = (int) ($_GET['id'] ?? 0);
            if (!$id) {
                SecurityBootstrap::errorResponse('Log ID is required');
            }
            
            $log = $auditService->getLog($id);
            if (!$log) {
                SecurityBootstrap::errorResponse('Log not found', 404);
            }
            
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => $log,
            ]);
            break;
            
        case 'statistics':
            $days = min(365, max(1, (int) ($_GET['days'] ?? 30)));
            $stats = $auditService->getStatistics($days);
            
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => $stats,
            ]);
            break;
            
        case 'entity_history':
            $entityType = $_GET['entity_type'] ?? '';
            $entityId = $_GET['entity_id'] ?? '';
            
            if (!$entityType || !$entityId) {
                SecurityBootstrap::errorResponse('Entity type and ID are required');
            }
            
            $limit = min(100, max(10, (int) ($_GET['limit'] ?? 50)));
            $history = $auditService->getEntityHistory($entityType, $entityId, $limit);
            
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => $history,
            ]);
            break;
            
        case 'user_activity':
            $userId = (int) ($_GET['user_id'] ?? 0);
            if (!$userId) {
                SecurityBootstrap::errorResponse('User ID is required');
            }
            
            $limit = min(100, max(10, (int) ($_GET['limit'] ?? 50)));
            $activity = $auditService->getUserActivity($userId, $limit);
            
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => $activity,
            ]);
            break;
            
        case 'export':
            $filters = [
                'user_id' => $_GET['user_id'] ?? null,
                'action' => $_GET['filter_action'] ?? null,
                'entity_type' => $_GET['entity_type'] ?? null,
                'severity' => $_GET['severity'] ?? null,
                'date_from' => $_GET['date_from'] ?? null,
                'date_to' => $_GET['date_to'] ?? null,
            ];
            
            $filters = array_filter($filters, function($v) { return $v !== null && $v !== ''; });
            
            $export = $auditService->exportToCSV($filters);
            
            header('Content-Type: ' . $export['mime']);
            header('Content-Disposition: attachment; filename="' . $export['filename'] . '"');
            header('Cache-Control: no-cache, must-revalidate');
            
            echo $export['content'];
            exit;
            
        case 'actions':
            // Return available action types
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => [
                    ['value' => 'create', 'label' => 'Create'],
                    ['value' => 'read', 'label' => 'Read'],
                    ['value' => 'update', 'label' => 'Update'],
                    ['value' => 'delete', 'label' => 'Delete'],
                    ['value' => 'login', 'label' => 'Login'],
                    ['value' => 'logout', 'label' => 'Logout'],
                    ['value' => 'login_failed', 'label' => 'Login Failed'],
                    ['value' => 'password_change', 'label' => 'Password Change'],
                    ['value' => 'password_reset', 'label' => 'Password Reset'],
                    ['value' => 'export', 'label' => 'Export'],
                    ['value' => 'import', 'label' => 'Import'],
                    ['value' => 'backup', 'label' => 'Backup'],
                    ['value' => 'restore', 'label' => 'Restore'],
                    ['value' => 'permission_change', 'label' => 'Permission Change'],
                    ['value' => 'settings_change', 'label' => 'Settings Change'],
                ],
            ]);
            break;
            
        case 'entities':
            // Return available entity types
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => [
                    ['value' => 'user', 'label' => 'User'],
                    ['value' => 'student', 'label' => 'Student'],
                    ['value' => 'teacher', 'label' => 'Teacher'],
                    ['value' => 'parent', 'label' => 'Parent'],
                    ['value' => 'class', 'label' => 'Class'],
                    ['value' => 'subject', 'label' => 'Subject'],
                    ['value' => 'grade', 'label' => 'Grade'],
                    ['value' => 'attendance', 'label' => 'Attendance'],
                    ['value' => 'fee', 'label' => 'Fee'],
                    ['value' => 'payment', 'label' => 'Payment'],
                    ['value' => 'invoice', 'label' => 'Invoice'],
                    ['value' => 'timetable', 'label' => 'Timetable'],
                    ['value' => 'exam', 'label' => 'Exam'],
                    ['value' => 'assignment', 'label' => 'Assignment'],
                    ['value' => 'message', 'label' => 'Message'],
                    ['value' => 'notification', 'label' => 'Notification'],
                    ['value' => 'report', 'label' => 'Report'],
                    ['value' => 'settings', 'label' => 'Settings'],
                    ['value' => 'backup', 'label' => 'Backup'],
                    ['value' => 'system', 'label' => 'System'],
                ],
            ]);
            break;
            
        default:
            SecurityBootstrap::errorResponse('Invalid action');
    }
}
