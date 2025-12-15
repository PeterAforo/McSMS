<?php
/**
 * Debug table structures
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

    $results = [];

    // Check permissions table structure
    $stmt = $pdo->query("DESCRIBE permissions");
    $results['permissions_columns'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Check roles table structure
    $stmt = $pdo->query("DESCRIBE roles");
    $results['roles_columns'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Try to get permissions
    try {
        $stmt = $pdo->query("SELECT * FROM permissions LIMIT 5");
        $results['permissions_sample'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $results['permissions_error'] = $e->getMessage();
    }

    // Try to get roles
    try {
        $stmt = $pdo->query("SELECT * FROM roles LIMIT 5");
        $results['roles_sample'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        $results['roles_error'] = $e->getMessage();
    }

    echo json_encode($results, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
