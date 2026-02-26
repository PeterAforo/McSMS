<?php
/**
 * Debug test file - DELETE AFTER DEBUGGING
 * Tries to include notifications.php code to find the exact error
 */

// Catch ALL errors including fatal ones
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        header('Content-Type: application/json');
        echo json_encode([
            'fatal_error' => true,
            'type' => $error['type'],
            'message' => $error['message'],
            'file' => $error['file'],
            'line' => $error['line']
        ]);
    }
});

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Check if notifications.php file can be read
$notificationsFile = __DIR__ . '/notifications.php';
$debug = [
    'notifications_file_exists' => file_exists($notificationsFile),
    'notifications_file_readable' => is_readable($notificationsFile),
    'notifications_file_size' => file_exists($notificationsFile) ? filesize($notificationsFile) : 0,
];

// Try to syntax check the file
if (file_exists($notificationsFile)) {
    $output = [];
    $returnCode = 0;
    exec('php -l ' . escapeshellarg($notificationsFile) . ' 2>&1', $output, $returnCode);
    $debug['syntax_check'] = implode("\n", $output);
    $debug['syntax_ok'] = $returnCode === 0;
    
    // Read first 100 chars to verify file content
    $content = file_get_contents($notificationsFile);
    $debug['file_starts_with'] = substr($content, 0, 100);
    $debug['file_length'] = strlen($content);
    
    // Check for BOM or other issues
    $debug['has_bom'] = (substr($content, 0, 3) === "\xEF\xBB\xBF");
    $debug['first_bytes_hex'] = bin2hex(substr($content, 0, 10));
}

echo json_encode($debug, JSON_PRETTY_PRINT);
