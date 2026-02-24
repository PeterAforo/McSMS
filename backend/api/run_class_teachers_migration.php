<?php
/**
 * One-time migration script for class_teachers table
 * Run via: https://eea.mcaforo.com/backend/api/run_class_teachers_migration.php?key=migrate_class_teachers_2026
 * DELETE THIS FILE AFTER RUNNING
 */

header('Content-Type: application/json');

// Security key - change this or remove after use
$securityKey = 'migrate_class_teachers_2026';

if (!isset($_GET['key']) || $_GET['key'] !== $securityKey) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid security key. Use ?key=' . $securityKey]);
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
    
    // Create class_teachers table
    $sql1 = "CREATE TABLE IF NOT EXISTS `class_teachers` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `class_id` int(11) NOT NULL,
        `teacher_id` int(11) NOT NULL,
        `role` enum('class_teacher', 'assistant', 'subject_teacher', 'support') DEFAULT 'subject_teacher',
        `is_primary` tinyint(1) DEFAULT 0,
        `assigned_date` date DEFAULT NULL,
        `notes` text DEFAULT NULL,
        `status` enum('active', 'inactive') DEFAULT 'active',
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        UNIQUE KEY `class_teacher_unique` (`class_id`, `teacher_id`),
        KEY `class_id` (`class_id`),
        KEY `teacher_id` (`teacher_id`),
        KEY `role` (`role`),
        KEY `is_primary` (`is_primary`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    
    $pdo->exec($sql1);
    $results[] = "✅ class_teachers table created (or already exists)";
    
    // Migrate existing class teachers
    $sql2 = "INSERT IGNORE INTO `class_teachers` (`class_id`, `teacher_id`, `role`, `is_primary`, `assigned_date`, `status`)
             SELECT id, class_teacher_id, 'class_teacher', 1, CURDATE(), 'active'
             FROM classes
             WHERE class_teacher_id IS NOT NULL AND class_teacher_id > 0";
    
    $affected = $pdo->exec($sql2);
    $results[] = "✅ Migrated $affected existing class teacher assignments";
    
    // Verify
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM class_teachers");
    $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    $results[] = "✅ Total class_teachers records: $count";
    
    echo json_encode([
        'success' => true,
        'message' => 'Migration completed successfully!',
        'results' => $results,
        'note' => '⚠️ DELETE THIS FILE NOW for security!'
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
