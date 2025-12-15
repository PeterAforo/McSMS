<?php
/**
 * Check Fee Item Rules Table
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

    // Get fee_item_rules table structure
    $stmt = $pdo->query("DESCRIBE fee_item_rules");
    $structure = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all fee item rules with data
    $stmt = $pdo->query("SELECT * FROM fee_item_rules");
    $rules = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'fee_item_rules_structure' => $structure,
        'fee_item_rules_data' => $rules
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
