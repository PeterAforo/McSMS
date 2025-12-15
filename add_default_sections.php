<?php
/**
 * Add Default Sections to All Classes
 */

$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management_system';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>Adding Default Sections</h2>";
    
    // Add capacity column if it doesn't exist
    echo "<p>Checking sections table structure...</p>";
    $stmt = $pdo->query("SHOW COLUMNS FROM sections LIKE 'capacity'");
    if ($stmt->rowCount() == 0) {
        echo "<p>Adding capacity column to sections table...</p>";
        $pdo->exec("ALTER TABLE sections ADD capacity INT NULL AFTER section_name");
        echo "<p style='color: green;'>✓ Capacity column added</p>";
    } else {
        echo "<p style='color: orange;'>⚠ Capacity column already exists</p>";
    }
    
    // Get all classes
    $stmt = $pdo->query("SELECT id, class_name FROM classes ORDER BY level ASC, class_name ASC");
    $classes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($classes)) {
        echo "<p style='color: orange;'>⚠ No classes found. Please create classes first.</p>";
        exit;
    }
    
    // Default sections to create
    $defaultSections = ['A', 'B', 'C'];
    $defaultCapacity = 30;
    
    $totalCreated = 0;
    $totalSkipped = 0;
    
    foreach ($classes as $class) {
        echo "<h3>Class: " . htmlspecialchars($class['class_name']) . "</h3>";
        
        foreach ($defaultSections as $sectionName) {
            // Check if section already exists
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM sections WHERE class_id = ? AND section_name = ?");
            $stmt->execute([$class['id'], $sectionName]);
            
            if ($stmt->fetchColumn() > 0) {
                echo "<p style='color: orange;'>⚠ Section {$sectionName} already exists - skipped</p>";
                $totalSkipped++;
                continue;
            }
            
            // Create section
            $stmt = $pdo->prepare("INSERT INTO sections (class_id, section_name, capacity) VALUES (?, ?, ?)");
            $stmt->execute([$class['id'], $sectionName, $defaultCapacity]);
            
            echo "<p style='color: green;'>✓ Created Section {$sectionName} (Capacity: {$defaultCapacity})</p>";
            $totalCreated++;
        }
    }
    
    echo "<h3 style='color: green;'>✓ Summary</h3>";
    echo "<p><strong>Total Sections Created:</strong> {$totalCreated}</p>";
    echo "<p><strong>Total Sections Skipped:</strong> {$totalSkipped}</p>";
    echo "<p><a href='http://localhost/McSMS/public/index.php?c=sections' style='padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; display: inline-block;'>View Sections →</a></p>";
    echo "<p style='color: red;'><strong>Note:</strong> Delete this file after running.</p>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>✗ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Add Default Sections</title>
    <style>
        body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
        h2 { color: #3F51B5; }
        h3 { color: #666; margin-top: 20px; }
    </style>
</head>
<body>
</body>
</html>
