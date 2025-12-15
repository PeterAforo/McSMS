<?php
/**
 * REST API Entry Point
 * Handles all API requests for the React frontend
 */

// CORS Headers
header('Content-Type: application/json');

// Allow requests from any localhost or 127.0.0.1 origin
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Load database configuration only (config.php not needed for API)
require_once __DIR__ . '/../../config/database.php';

// Simple autoloader for API controllers
spl_autoload_register(function ($class) {
    $paths = [
        __DIR__ . '/controllers/' . $class . '.php',
        __DIR__ . '/../../app/models/' . $class . '.php',
        __DIR__ . '/../../app/core/' . $class . '.php',
        __DIR__ . '/../../app/services/' . $class . '.php',
    ];
    
    foreach ($paths as $file) {
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

// Parse the request URI
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = explode('/', trim($uri, '/'));

// Find the API base index
$apiIndex = array_search('api', $uri);
if ($apiIndex === false) {
    http_response_code(404);
    echo json_encode(['error' => 'API endpoint not found']);
    exit();
}

// Get resource and ID
$resource = $uri[$apiIndex + 1] ?? null;
$id = $uri[$apiIndex + 2] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

// Route to appropriate controller
try {
    switch ($resource) {
        case 'auth':
            require_once __DIR__ . '/controllers/AuthController.php';
            $controller = new ApiAuthController();
            $controller->handleRequest($id, $method);
            break;
            
        case 'users':
            require_once __DIR__ . '/controllers/UsersController.php';
            $controller = new ApiUsersController();
            $controller->handleRequest($id, $method);
            break;
            
        case 'finance':
            require_once __DIR__ . '/controllers/FinanceController.php';
            $controller = new ApiFinanceController();
            $controller->handleRequest($id, $method);
            break;
            
        case 'fee-structure':
            require_once __DIR__ . '/controllers/FeeStructureController.php';
            $controller = new ApiFeeStructureController();
            $controller->handleRequest($id, $method);
            break;
            
        default:
            http_response_code(404);
            echo json_encode(['error' => 'Resource not found']);
            exit();
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}
