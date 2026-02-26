<?php
/**
 * Database Backup API
 * Handles backup creation, restoration, listing, and deletion
 */

// Load security bootstrap
require_once __DIR__ . '/../middleware/security_bootstrap.php';

// Initialize security for sensitive backup operations
SecurityBootstrap::initSensitive();

require_once __DIR__ . '/../src/Backup/DatabaseBackupService.php';
require_once __DIR__ . '/../../config/database.php';

use McSMS\Backup\DatabaseBackupService;

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

// Verify admin access
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (strpos($authHeader, 'Bearer ') !== 0) {
    SecurityBootstrap::errorResponse('Unauthorized', 401);
}

// TODO: Add proper JWT validation and admin role check
// For now, we'll check if user is admin via session or token

try {
    $backupService = new DatabaseBackupService();
    
    switch ($method) {
        case 'GET':
            handleGet($backupService, $action);
            break;
            
        case 'POST':
            handlePost($backupService, $action);
            break;
            
        case 'DELETE':
            handleDelete($backupService);
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
function handleGet($backupService, $action) {
    switch ($action) {
        case 'list':
            $backups = $backupService->listBackups();
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'backups' => $backups,
            ]);
            break;
            
        case 'statistics':
            $stats = $backupService->getStatistics();
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'statistics' => $stats,
            ]);
            break;
            
        case 'logs':
            $limit = (int) ($_GET['limit'] ?? 50);
            $logs = $backupService->getBackupLogs($limit);
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'logs' => $logs,
            ]);
            break;
            
        case 'download':
            $filename = $_GET['filename'] ?? '';
            if (empty($filename)) {
                SecurityBootstrap::errorResponse('Filename is required');
            }
            
            // Validate filename to prevent directory traversal
            if (preg_match('/[\/\\\\]/', $filename) || strpos($filename, '..') !== false) {
                SecurityBootstrap::errorResponse('Invalid filename');
            }
            
            try {
                $download = $backupService->downloadBackup($filename);
                
                header('Content-Type: ' . $download['mime']);
                header('Content-Disposition: attachment; filename="' . $download['filename'] . '"');
                header('Content-Length: ' . $download['size']);
                header('Cache-Control: no-cache, must-revalidate');
                
                readfile($download['filepath']);
                exit;
            } catch (Exception $e) {
                SecurityBootstrap::errorResponse($e->getMessage(), 404);
            }
            break;
            
        default:
            SecurityBootstrap::errorResponse('Invalid action');
    }
}

/**
 * Handle POST requests
 */
function handlePost($backupService, $action) {
    $input = SecurityBootstrap::getInput() ?? [];
    
    switch ($action) {
        case 'create':
            $description = InputValidator::sanitizeString($input['description'] ?? '', 255);
            
            try {
                $backup = $backupService->createBackup($description);
                SecurityBootstrap::jsonResponse([
                    'success' => true,
                    'message' => 'Backup created successfully',
                    'backup' => $backup,
                ]);
            } catch (Exception $e) {
                SecurityBootstrap::errorResponse('Failed to create backup: ' . $e->getMessage(), 500);
            }
            break;
            
        case 'restore':
            $filename = InputValidator::sanitizeString($input['filename'] ?? '', 255);
            
            if (empty($filename)) {
                SecurityBootstrap::errorResponse('Filename is required');
            }
            
            // Validate filename to prevent directory traversal
            if (preg_match('/[\/\\\\]/', $filename) || strpos($filename, '..') !== false) {
                SecurityBootstrap::errorResponse('Invalid filename');
            }
            
            try {
                $backupService->restoreBackup($filename);
                SecurityBootstrap::jsonResponse([
                    'success' => true,
                    'message' => 'Database restored successfully',
                ]);
            } catch (Exception $e) {
                SecurityBootstrap::errorResponse('Failed to restore backup: ' . $e->getMessage(), 500);
            }
            break;
            
        default:
            SecurityBootstrap::errorResponse('Invalid action');
    }
}

/**
 * Handle DELETE requests
 */
function handleDelete($backupService) {
    $filename = $_GET['filename'] ?? '';
    
    if (empty($filename)) {
        SecurityBootstrap::errorResponse('Filename is required');
    }
    
    // Validate filename to prevent directory traversal
    if (preg_match('/[\/\\\\]/', $filename) || strpos($filename, '..') !== false) {
        SecurityBootstrap::errorResponse('Invalid filename');
    }
    
    try {
        $backupService->deleteBackup($filename);
        SecurityBootstrap::jsonResponse([
            'success' => true,
            'message' => 'Backup deleted successfully',
        ]);
    } catch (Exception $e) {
        SecurityBootstrap::errorResponse('Failed to delete backup: ' . $e->getMessage(), 500);
    }
}
