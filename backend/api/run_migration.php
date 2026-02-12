<?php
/**
 * One-time migration script to fix database issues
 * DELETE THIS FILE AFTER RUNNING
 */

header('Content-Type: application/json');

// Security: Only allow from specific IPs or with a secret key
$secretKey = $_GET['key'] ?? '';
if ($secretKey !== 'fix_mcsms_2026') {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized. Use ?key=fix_mcsms_2026']);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $results = [];

    // 1. Fix classes.level column - change from ENUM to VARCHAR
    try {
        $pdo->exec("ALTER TABLE classes MODIFY COLUMN level VARCHAR(50) NULL");
        $results[] = "✓ classes.level changed to VARCHAR(50)";
    } catch (Exception $e) {
        $results[] = "⚠ classes.level: " . $e->getMessage();
    }

    // 2. Fix subjects.level column - change from ENUM to VARCHAR
    try {
        $pdo->exec("ALTER TABLE subjects MODIFY COLUMN level VARCHAR(50) NULL");
        $results[] = "✓ subjects.level changed to VARCHAR(50)";
    } catch (Exception $e) {
        $results[] = "⚠ subjects.level: " . $e->getMessage();
    }

    // 3. Remove duplicate fee_items (keep the first one of each name)
    try {
        // Find duplicates
        $stmt = $pdo->query("
            SELECT item_name, COUNT(*) as cnt, MIN(id) as keep_id 
            FROM fee_items 
            GROUP BY item_name 
            HAVING cnt > 1
        ");
        $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $deletedCount = 0;
        foreach ($duplicates as $dup) {
            $delStmt = $pdo->prepare("DELETE FROM fee_items WHERE item_name = ? AND id != ?");
            $delStmt->execute([$dup['item_name'], $dup['keep_id']]);
            $deletedCount += $delStmt->rowCount();
        }
        $results[] = "✓ Removed $deletedCount duplicate fee_items";
    } catch (Exception $e) {
        $results[] = "⚠ fee_items cleanup: " . $e->getMessage();
    }

    // 4. Add unique constraint to prevent future duplicates
    try {
        $pdo->exec("ALTER TABLE fee_items ADD UNIQUE INDEX unique_item_name (item_name)");
        $results[] = "✓ Added unique constraint on fee_items.item_name";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
            $results[] = "✓ Unique constraint already exists on fee_items.item_name";
        } else {
            $results[] = "⚠ fee_items unique constraint: " . $e->getMessage();
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Migration completed',
        'results' => $results
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
