<?php
/**
 * Fix localhost URLs in database
 * Run this after deploying to production to update all localhost URLs
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

    // Production domain
    $productionDomain = 'https://eea.mcaforo.com';
    
    // URL replacements (order matters - more specific first)
    $replacements = [
        'http://localhost/McSMS/uploads/' => $productionDomain . '/uploads/',
        'http://localhost/McSMS/' => $productionDomain . '/',
        'http://localhost/uploads/' => $productionDomain . '/uploads/',
        'http://localhost/' => $productionDomain . '/',
        'http://127.0.0.1/McSMS/uploads/' => $productionDomain . '/uploads/',
        'http://127.0.0.1/McSMS/' => $productionDomain . '/',
        'http://127.0.0.1/uploads/' => $productionDomain . '/uploads/',
        'http://127.0.0.1/' => $productionDomain . '/',
        // Fix missing /uploads/ in path
        $productionDomain . '/school-logo' => $productionDomain . '/uploads/school-logo',
    ];

    $updates = [];

    // Fix system_settings table
    try {
        foreach ($replacements as $from => $to) {
            $stmt = $pdo->prepare("UPDATE system_settings SET setting_value = REPLACE(setting_value, ?, ?) WHERE setting_value LIKE ?");
            $stmt->execute([$from, $to, '%' . $from . '%']);
            if ($stmt->rowCount() > 0) {
                $updates[] = "system_settings: Updated {$stmt->rowCount()} rows (replaced $from -> $to)";
            }
        }
    } catch (PDOException $e) {
        $updates[] = "system_settings: " . $e->getMessage();
    }

    // Fix school_settings table
    try {
        foreach ($replacements as $from => $to) {
            $stmt = $pdo->prepare("UPDATE school_settings SET setting_value = REPLACE(setting_value, ?, ?) WHERE setting_value LIKE ?");
            $stmt->execute([$from, $to, '%' . $from . '%']);
            if ($stmt->rowCount() > 0) {
                $updates[] = "school_settings: Updated {$stmt->rowCount()} rows";
            }
        }
    } catch (PDOException $e) {}

    // Fix users table (profile photos)
    try {
        foreach ($replacements as $from => $to) {
            $stmt = $pdo->prepare("UPDATE users SET profile_photo = REPLACE(profile_photo, ?, ?) WHERE profile_photo LIKE ?");
            $stmt->execute([$from, $to, '%' . $from . '%']);
            if ($stmt->rowCount() > 0) {
                $updates[] = "users.profile_photo: Updated {$stmt->rowCount()} rows";
            }
        }
    } catch (PDOException $e) {}

    // Fix students table (photos)
    try {
        foreach ($replacements as $from => $to) {
            $stmt = $pdo->prepare("UPDATE students SET photo = REPLACE(photo, ?, ?) WHERE photo LIKE ?");
            $stmt->execute([$from, $to, '%' . $from . '%']);
            if ($stmt->rowCount() > 0) {
                $updates[] = "students.photo: Updated {$stmt->rowCount()} rows";
            }
        }
    } catch (PDOException $e) {}

    // Fix teachers table (photos)
    try {
        foreach ($replacements as $from => $to) {
            $stmt = $pdo->prepare("UPDATE teachers SET photo = REPLACE(photo, ?, ?) WHERE photo LIKE ?");
            $stmt->execute([$from, $to, '%' . $from . '%']);
            if ($stmt->rowCount() > 0) {
                $updates[] = "teachers.photo: Updated {$stmt->rowCount()} rows";
            }
        }
    } catch (PDOException $e) {}

    // Show current logo URL
    $logoUrl = null;
    try {
        $stmt = $pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'school_logo'");
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $logoUrl = $row ? $row['setting_value'] : 'Not found';
    } catch (PDOException $e) {}

    // Check for remaining localhost URLs
    $remaining = [];
    try {
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM system_settings WHERE setting_value LIKE '%localhost%' OR setting_value LIKE '%127.0.0.1%'");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (!empty($rows)) {
            $remaining['system_settings'] = $rows;
        }
    } catch (PDOException $e) {}

    echo json_encode([
        'success' => true,
        'message' => 'URL fix completed',
        'production_domain' => $productionDomain,
        'current_logo_url' => $logoUrl,
        'updates' => $updates,
        'remaining_localhost_urls' => $remaining
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
