<?php
/**
 * Check Fee Structure
 * Shows fee items and related tables structure
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

    // Get fee_items table structure
    $stmt = $pdo->query("DESCRIBE fee_items");
    $feeItemsStructure = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all fee items with data
    $stmt = $pdo->query("SELECT * FROM fee_items LIMIT 10");
    $feeItems = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Check for fee_structure table
    $feeStructure = [];
    $feeStructureExists = false;
    try {
        $stmt = $pdo->query("SELECT * FROM fee_structure LIMIT 10");
        $feeStructure = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $feeStructureExists = true;
    } catch (Exception $e) {
        $feeStructureExists = false;
    }

    // Check for fee_rules table
    $feeRules = [];
    $feeRulesExists = false;
    try {
        $stmt = $pdo->query("SELECT * FROM fee_rules LIMIT 10");
        $feeRules = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $feeRulesExists = true;
    } catch (Exception $e) {
        $feeRulesExists = false;
    }

    // List all tables with 'fee' in name
    $stmt = $pdo->query("SHOW TABLES LIKE '%fee%'");
    $feeTables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'fee_tables' => $feeTables,
        'fee_items_structure' => $feeItemsStructure,
        'fee_items_sample' => $feeItems,
        'fee_structure_exists' => $feeStructureExists,
        'fee_structure_sample' => $feeStructure,
        'fee_rules_exists' => $feeRulesExists,
        'fee_rules_sample' => $feeRules
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
