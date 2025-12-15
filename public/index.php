<?php
/**
 * Front Controller - School Management System
 * Handles all routing and request dispatching
 */

// Define paths
define('ROOT_PATH', dirname(__DIR__));
define('APP_PATH', ROOT_PATH . '/app');
define('PUBLIC_PATH', ROOT_PATH . '/public');
define('CONFIG_PATH', ROOT_PATH . '/config');

// Autoloader
spl_autoload_register(function ($class) {
    $paths = [
        APP_PATH . '/core/' . $class . '.php',
        APP_PATH . '/controllers/' . $class . '.php',
        APP_PATH . '/models/' . $class . '.php',
        APP_PATH . '/services/' . $class . '.php',
    ];
    
    foreach ($paths as $path) {
        if (file_exists($path)) {
            require_once $path;
            return;
        }
    }
});

// Load configuration (this sets session ini settings)
require_once CONFIG_PATH . '/config.php';
require_once CONFIG_PATH . '/database.php';

// Start session AFTER configuration is loaded
session_start();

// Get controller and action from URL
$controller = $_GET['c'] ?? 'auth';
$action = $_GET['a'] ?? ($controller === 'auth' ? 'login' : 'index');

// Sanitize inputs
$controller = preg_replace('/[^a-zA-Z]/', '', $controller);
$action = preg_replace('/[^a-zA-Z]/', '', $action);

// Build controller class name
$controllerClass = ucfirst($controller) . 'Controller';

// Check if controller exists
if (!class_exists($controllerClass)) {
    die("Controller not found: $controllerClass");
}

// Instantiate controller
$controllerInstance = new $controllerClass();

// Check if action exists
if (!method_exists($controllerInstance, $action)) {
    die("Action not found: $action in $controllerClass");
}

// Execute action
$controllerInstance->$action();
