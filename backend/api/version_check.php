<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'status' => 'ok',
    'php_version' => phpversion(),
    'server_time' => date('Y-m-d H:i:s'),
    'file_modified' => date('Y-m-d H:i:s', filemtime(__FILE__))
]);
