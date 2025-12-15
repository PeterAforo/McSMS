<?php
/**
 * HR Migration Test Script
 * Run this after migration to verify everything works
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../config/database.php';

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $results = [];

    // Test 1: Check employees table structure
    $stmt = $pdo->query("DESCRIBE employees");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $results['test_1'] = [
        'name' => 'Employees Table Structure',
        'status' => count($columns) >= 60 ? 'PASS' : 'FAIL',
        'columns_count' => count($columns),
        'message' => count($columns) >= 60 ? 'All columns present' : 'Missing columns'
    ];

    // Test 2: Check auto-increment trigger
    $stmt = $pdo->query("SHOW TRIGGERS LIKE 'employees'");
    $triggers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $results['test_2'] = [
        'name' => 'Auto-Increment Trigger',
        'status' => count($triggers) > 0 ? 'PASS' : 'FAIL',
        'message' => count($triggers) > 0 ? 'Trigger exists' : 'Trigger missing'
    ];

    // Test 3: Check user-employee sync
    $stmt = $pdo->query("
        SELECT COUNT(*) as count 
        FROM users u 
        WHERE u.user_type IN ('admin', 'teacher')
        AND EXISTS (SELECT 1 FROM employees e WHERE e.user_id = u.id)
    ");
    $synced = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->query("
        SELECT COUNT(*) as count 
        FROM users 
        WHERE user_type IN ('admin', 'teacher')
    ");
    $total = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $results['test_3'] = [
        'name' => 'User-Employee Sync',
        'status' => $synced['count'] == $total['count'] ? 'PASS' : 'FAIL',
        'synced' => $synced['count'],
        'total' => $total['count'],
        'message' => $synced['count'] == $total['count'] ? 'All users synced' : 'Some users not synced'
    ];

    // Test 4: Check employee numbers
    $stmt = $pdo->query("
        SELECT COUNT(*) as count 
        FROM employees 
        WHERE employee_number LIKE 'EMP%'
    ");
    $empNumbers = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM employees");
    $totalEmp = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $results['test_4'] = [
        'name' => 'Employee Numbers',
        'status' => $empNumbers['count'] == $totalEmp['count'] ? 'PASS' : 'FAIL',
        'with_numbers' => $empNumbers['count'],
        'total' => $totalEmp['count'],
        'message' => $empNumbers['count'] == $totalEmp['count'] ? 'All employees have numbers' : 'Some employees missing numbers'
    ];

    // Test 5: Check teachers-employee link
    $stmt = $pdo->query("
        SELECT COUNT(*) as count 
        FROM teachers 
        WHERE employee_id IS NOT NULL
    ");
    $linkedTeachers = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM teachers");
    $totalTeachers = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $results['test_5'] = [
        'name' => 'Teachers-Employee Link',
        'status' => $linkedTeachers['count'] == $totalTeachers['count'] ? 'PASS' : 'FAIL',
        'linked' => $linkedTeachers['count'],
        'total' => $totalTeachers['count'],
        'message' => $linkedTeachers['count'] == $totalTeachers['count'] ? 'All teachers linked' : 'Some teachers not linked'
    ];

    // Test 6: Check biometric fields
    $stmt = $pdo->query("
        SELECT COUNT(*) as count 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'employees'
        AND COLUMN_NAME IN ('biometric_id', 'fingerprint_data', 'face_recognition_data')
    ");
    $biometricFields = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $results['test_6'] = [
        'name' => 'Biometric Fields',
        'status' => $biometricFields['count'] == 3 ? 'PASS' : 'FAIL',
        'fields_found' => $biometricFields['count'],
        'message' => $biometricFields['count'] == 3 ? 'All biometric fields present' : 'Missing biometric fields'
    ];

    // Test 7: Check attendance table updates
    $stmt = $pdo->query("
        SELECT COUNT(*) as count 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'employee_attendance'
        AND COLUMN_NAME IN ('biometric_device_id', 'check_in_method', 'location_check_in')
    ");
    $attendanceFields = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $results['test_7'] = [
        'name' => 'Attendance Table Updates',
        'status' => $attendanceFields['count'] == 3 ? 'PASS' : 'FAIL',
        'fields_found' => $attendanceFields['count'],
        'message' => $attendanceFields['count'] == 3 ? 'Attendance table updated' : 'Attendance table needs update'
    ];

    // Overall status
    $passed = 0;
    $total_tests = count($results);
    foreach ($results as $test) {
        if ($test['status'] == 'PASS') $passed++;
    }

    $overall = [
        'overall_status' => $passed == $total_tests ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌',
        'passed' => $passed,
        'total' => $total_tests,
        'percentage' => round(($passed / $total_tests) * 100, 2) . '%'
    ];

    echo json_encode([
        'success' => true,
        'overall' => $overall,
        'tests' => $results
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
