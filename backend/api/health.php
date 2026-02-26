<?php
/**
 * System Health API
 * Provides health check endpoints for monitoring
 */

// Load security bootstrap
require_once __DIR__ . '/../middleware/security_bootstrap.php';

// Initialize security (public endpoint for basic health, auth for detailed)
SecurityBootstrap::initPublic();

require_once __DIR__ . '/../src/Health/SystemHealthService.php';

use McSMS\Health\SystemHealthService;

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'status';

try {
    $healthService = new SystemHealthService();
    
    switch ($method) {
        case 'GET':
            handleGet($healthService, $action);
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
function handleGet($healthService, $action) {
    switch ($action) {
        case 'ping':
            // Simple ping endpoint for uptime monitoring
            SecurityBootstrap::jsonResponse([
                'status' => 'ok',
                'timestamp' => date('Y-m-d H:i:s'),
            ]);
            break;
            
        case 'status':
            // Full health status (requires auth for detailed info)
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
            $isAuthenticated = strpos($authHeader, 'Bearer ') === 0;
            
            $health = $healthService->getHealthStatus();
            
            // Remove sensitive details for unauthenticated requests
            if (!$isAuthenticated) {
                foreach ($health['checks'] as &$check) {
                    unset($check['details']);
                }
                unset($health['server']);
            }
            
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => $health,
            ]);
            break;
            
        case 'database':
            requireAuth();
            $check = $healthService->checkDatabase();
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => $check,
            ]);
            break;
            
        case 'disk':
            requireAuth();
            $check = $healthService->checkDiskSpace();
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => $check,
            ]);
            break;
            
        case 'memory':
            requireAuth();
            $check = $healthService->checkMemory();
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => $check,
            ]);
            break;
            
        case 'php':
            requireAuth();
            $check = $healthService->checkPHP();
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => $check,
            ]);
            break;
            
        case 'metrics':
            requireAuth();
            $metrics = $healthService->getApplicationMetrics();
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => $metrics,
            ]);
            break;
            
        case 'errors':
            requireAuth();
            $limit = min(100, max(10, (int) ($_GET['limit'] ?? 20)));
            $errors = $healthService->getRecentErrors($limit);
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => $errors,
            ]);
            break;
            
        case 'server':
            requireAuth();
            $server = $healthService->getServerInfo();
            SecurityBootstrap::jsonResponse([
                'success' => true,
                'data' => $server,
            ]);
            break;
            
        default:
            SecurityBootstrap::errorResponse('Invalid action');
    }
}

/**
 * Require authentication
 */
function requireAuth() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (strpos($authHeader, 'Bearer ') !== 0) {
        SecurityBootstrap::errorResponse('Unauthorized', 401);
    }
}
