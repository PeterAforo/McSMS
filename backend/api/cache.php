<?php
/**
 * Cache Management API
 * Provides endpoints to manage the file-based cache system
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../utils/Cache.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'stats':
            // Get cache statistics
            echo json_encode([
                'success' => true,
                'stats' => Cache::stats()
            ]);
            break;
            
        case 'clear':
            // Clear all cache (requires admin)
            $prefix = $_GET['prefix'] ?? null;
            Cache::clear($prefix);
            echo json_encode([
                'success' => true,
                'message' => $prefix ? "Cache cleared for prefix: $prefix" : 'All cache cleared'
            ]);
            break;
            
        case 'clear_expired':
            // Clear only expired entries
            $cleared = Cache::clearExpired();
            echo json_encode([
                'success' => true,
                'message' => "Cleared $cleared expired cache entries"
            ]);
            break;
            
        default:
            echo json_encode([
                'success' => true,
                'message' => 'Cache API',
                'endpoints' => [
                    'GET ?action=stats' => 'Get cache statistics',
                    'GET ?action=clear' => 'Clear all cache',
                    'GET ?action=clear&prefix=admin' => 'Clear cache by prefix',
                    'GET ?action=clear_expired' => 'Clear expired entries only'
                ]
            ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
