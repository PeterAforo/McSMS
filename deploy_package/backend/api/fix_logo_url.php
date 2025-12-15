<?php
/**
 * Fix School Logo URL
 * Clears invalid blob URLs from the database
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Check current logo value
    $stmt = $pdo->query("SELECT school_logo FROM system_config LIMIT 1");
    $config = $stmt->fetch(PDO::FETCH_ASSOC);
    $currentLogo = $config['school_logo'] ?? null;

    $message = '';
    
    // If logo is a blob URL, clear it
    if ($currentLogo && strpos($currentLogo, 'blob:') === 0) {
        $stmt = $pdo->prepare("UPDATE system_config SET school_logo = NULL");
        $stmt->execute();
        $message = "Cleared invalid blob URL. Please re-upload the school logo from Admin Settings.";
    } elseif (empty($currentLogo)) {
        $message = "No logo set. Please upload the school logo from Admin Settings.";
    } else {
        $message = "Logo URL appears valid: " . $currentLogo;
    }

    echo json_encode([
        'success' => true,
        'previous_logo' => $currentLogo,
        'message' => $message,
        'action_required' => 'Go to Admin > Settings > School Settings and re-upload the school logo'
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
