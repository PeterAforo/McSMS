<?php
/**
 * Debug test file - DELETE AFTER DEBUGGING
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'success' => true,
    'message' => 'PHP is working',
    'php_version' => PHP_VERSION,
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'unknown',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'unknown',
    'dir' => __DIR__,
    'config_exists' => file_exists(__DIR__ . '/../../config/database.php'),
    'config_path_1' => realpath(__DIR__ . '/../../config/database.php') ?: 'not found',
    'config_path_2' => realpath(__DIR__ . '/../config/database.php') ?: 'not found',
    'parent_dir' => realpath(__DIR__ . '/..'),
    'grandparent_dir' => realpath(__DIR__ . '/../..'),
]);
