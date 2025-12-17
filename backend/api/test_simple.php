<?php
header('Content-Type: application/json');

// Step 1: Test config loading
$configPath = __DIR__ . '/../../config/database.php';
if (!file_exists($configPath)) {
    echo json_encode(array('success' => false, 'error' => 'Config not found', 'path' => $configPath));
    exit();
}

require_once $configPath;

// Step 2: Test database connection (create PDO directly like parent_portal.php)
try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)
    );
    
    // Get homework_submissions table structure
    $columns = $pdo->query("SHOW COLUMNS FROM homework_submissions")->fetchAll(PDO::FETCH_ASSOC);
    $columnNames = array_column($columns, 'Field');
    
    // Required columns for submission workflow
    $requiredColumns = array('id', 'homework_id', 'student_id', 'status', 'submitted_at', 'submission_text', 'score', 'feedback', 'graded_at', 'graded_by');
    
    $missingColumns = array();
    foreach ($requiredColumns as $col) {
        if (!in_array($col, $columnNames)) {
            $missingColumns[] = $col;
        }
    }
    
    // Get homework table structure too
    $hwColumns = $pdo->query("SHOW COLUMNS FROM homework")->fetchAll(PDO::FETCH_ASSOC);
    $hwColumnNames = array_column($hwColumns, 'Field');
    
    echo json_encode(array(
        'success' => true,
        'homework_submissions_columns' => $columnNames,
        'missing_columns' => $missingColumns,
        'homework_columns' => $hwColumnNames,
        'add_missing_sql' => generateMissingColumnSQL($missingColumns)
    ));
} catch (Exception $e) {
    echo json_encode(array(
        'success' => false,
        'error' => $e->getMessage()
    ));
}

function generateMissingColumnSQL($missing) {
    $sql = array();
    foreach ($missing as $col) {
        switch ($col) {
            case 'status':
                $sql[] = "ALTER TABLE homework_submissions ADD COLUMN status VARCHAR(20) DEFAULT 'submitted';";
                break;
            case 'submission_text':
                $sql[] = "ALTER TABLE homework_submissions ADD COLUMN submission_text TEXT;";
                break;
            case 'score':
                $sql[] = "ALTER TABLE homework_submissions ADD COLUMN score DECIMAL(5,2);";
                break;
            case 'feedback':
                $sql[] = "ALTER TABLE homework_submissions ADD COLUMN feedback TEXT;";
                break;
            case 'graded_at':
                $sql[] = "ALTER TABLE homework_submissions ADD COLUMN graded_at TIMESTAMP NULL;";
                break;
            case 'graded_by':
                $sql[] = "ALTER TABLE homework_submissions ADD COLUMN graded_by INT;";
                break;
        }
    }
    return $sql;
}
