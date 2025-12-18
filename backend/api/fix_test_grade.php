<?php
/**
 * Fix invalid test grade data
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$configPaths = array(
    __DIR__ . '/../../config/database.php',
    $_SERVER['DOCUMENT_ROOT'] . '/config/database.php'
);
$configLoaded = false;
foreach ($configPaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $configLoaded = true;
        break;
    }
}

if (!$configLoaded) {
    echo json_encode(array('error' => 'Config not found'));
    exit();
}

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        array(PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION)
    );

    // Fix the test grade - set marks to 18 (90% of 20)
    $stmt = $pdo->prepare("UPDATE assessment_grades SET marks_obtained = 18, grade = 'A' WHERE id = 1 AND marks_obtained = 85");
    $stmt->execute();
    $fixed = $stmt->rowCount();

    // Verify the fix
    $stmt = $pdo->query("SELECT ag.*, a.assessment_name, a.total_marks FROM assessment_grades ag JOIN assessments a ON ag.assessment_id = a.id WHERE ag.id = 1");
    $grade = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(array(
        'success' => true,
        'rows_fixed' => $fixed,
        'current_grade' => $grade
    ), JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(array('error' => $e->getMessage()));
}
