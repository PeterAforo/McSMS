<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'test' => 'Config test file',
    'timestamp' => date('Y-m-d H:i:s'),
    'document_root' => $_SERVER['DOCUMENT_ROOT'],
    'dir' => __DIR__,
    'config_exists' => file_exists(__DIR__ . '/../../config/database.php'),
    'config_exists_docroot' => file_exists($_SERVER['DOCUMENT_ROOT'] . '/config/database.php')
]);
