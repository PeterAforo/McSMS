<?php
/**
 * Comprehensive URL fix - finds and fixes ALL localhost URLs in database
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

    $productionDomain = 'https://eea.mcaforo.com';
    $updates = [];
    $found = [];

    // Get all tables
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

    foreach ($tables as $table) {
        // Get columns for this table
        try {
            $columns = $pdo->query("DESCRIBE `$table`")->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            continue;
        }

        foreach ($columns as $col) {
            $colName = $col['Field'];
            $colType = strtolower($col['Type']);

            // Only check text-like columns
            if (strpos($colType, 'char') !== false || 
                strpos($colType, 'text') !== false || 
                strpos($colType, 'blob') !== false) {
                
                // Find rows with localhost URLs
                try {
                    $stmt = $pdo->query("SELECT COUNT(*) FROM `$table` WHERE `$colName` LIKE '%localhost%'");
                    $count = $stmt->fetchColumn();
                    
                    if ($count > 0) {
                        $found[] = "$table.$colName: $count rows with localhost";
                        
                        // Fix the URLs
                        $patterns = [
                            'http://localhost/McSMS/uploads/' => $productionDomain . '/uploads/',
                            'http://localhost/McSMS/' => $productionDomain . '/',
                            'http://localhost/uploads/' => $productionDomain . '/uploads/',
                            'http://localhost/' => $productionDomain . '/',
                        ];
                        
                        foreach ($patterns as $from => $to) {
                            $updateStmt = $pdo->prepare("UPDATE `$table` SET `$colName` = REPLACE(`$colName`, ?, ?) WHERE `$colName` LIKE ?");
                            $updateStmt->execute([$from, $to, '%' . $from . '%']);
                            $affected = $updateStmt->rowCount();
                            if ($affected > 0) {
                                $updates[] = "$table.$colName: Fixed $affected rows (replaced $from)";
                            }
                        }
                    }
                } catch (Exception $e) {
                    // Skip columns that can't be queried
                    continue;
                }
            }
        }
    }

    // Also check for 127.0.0.1
    foreach ($tables as $table) {
        try {
            $columns = $pdo->query("DESCRIBE `$table`")->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            continue;
        }

        foreach ($columns as $col) {
            $colName = $col['Field'];
            $colType = strtolower($col['Type']);

            if (strpos($colType, 'char') !== false || 
                strpos($colType, 'text') !== false) {
                
                try {
                    $stmt = $pdo->query("SELECT COUNT(*) FROM `$table` WHERE `$colName` LIKE '%127.0.0.1%'");
                    $count = $stmt->fetchColumn();
                    
                    if ($count > 0) {
                        $found[] = "$table.$colName: $count rows with 127.0.0.1";
                        
                        $updateStmt = $pdo->prepare("UPDATE `$table` SET `$colName` = REPLACE(`$colName`, 'http://127.0.0.1/', ?) WHERE `$colName` LIKE '%127.0.0.1%'");
                        $updateStmt->execute([$productionDomain . '/']);
                        $affected = $updateStmt->rowCount();
                        if ($affected > 0) {
                            $updates[] = "$table.$colName: Fixed $affected rows (127.0.0.1)";
                        }
                    }
                } catch (Exception $e) {
                    continue;
                }
            }
        }
    }

    // Check remaining localhost URLs
    $remaining = [];
    foreach ($tables as $table) {
        try {
            $columns = $pdo->query("DESCRIBE `$table`")->fetchAll(PDO::FETCH_ASSOC);
            foreach ($columns as $col) {
                $colName = $col['Field'];
                $colType = strtolower($col['Type']);
                
                if (strpos($colType, 'char') !== false || strpos($colType, 'text') !== false) {
                    $stmt = $pdo->query("SELECT `$colName` FROM `$table` WHERE `$colName` LIKE '%localhost%' LIMIT 5");
                    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
                    if (!empty($rows)) {
                        $remaining["$table.$colName"] = $rows;
                    }
                }
            }
        } catch (Exception $e) {
            continue;
        }
    }

    echo json_encode([
        'success' => true,
        'message' => 'Comprehensive URL fix completed',
        'production_domain' => $productionDomain,
        'found_before_fix' => $found,
        'updates_applied' => $updates,
        'remaining_localhost' => $remaining
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
