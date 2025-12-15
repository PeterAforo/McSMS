<?php
/**
 * Update System for Ghana Schools
 * - GES and Cambridge Curriculum
 * - Ghana Cedis Currency (GH₵)
 */

$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management_system';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>Updating System for Ghana Schools</h2>";
    
    $pdo->beginTransaction();
    
    // 1. Update Fee Groups for Ghana Context
    echo "<p>Updating fee groups for Ghana schools...</p>";
    
    // Check if Ghana-specific groups exist
    $stmt = $pdo->query("SELECT COUNT(*) FROM fee_groups WHERE name = 'GES Levies'");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("
            INSERT INTO fee_groups (name, description, display_order, is_active) VALUES
            ('GES Levies', 'Ghana Education Service mandatory levies', 11, 1),
            ('Cambridge Fees', 'Cambridge curriculum examination and registration fees', 12, 1),
            ('Co-curricular', 'Sports, clubs, and extra-curricular activities', 13, 1)
        ");
        echo "<p style='color: green;'>✓ Added Ghana-specific fee groups</p>";
    } else {
        echo "<p style='color: orange;'>⚠ Ghana fee groups already exist</p>";
    }
    
    // 2. Add Ghana-specific fee items
    echo "<p>Adding Ghana-specific fee items...</p>";
    
    $groups = $pdo->query("SELECT id, name FROM fee_groups")->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM fee_items WHERE name LIKE '%GES%' OR name LIKE '%Cambridge%'");
    if ($stmt->fetchColumn() == 0) {
        $items = [];
        
        if (isset($groups['GES Levies'])) {
            $items[] = "({$groups['GES Levies']}, 'GES Capitation Grant', 'Government capitation grant contribution', 'session', 0)";
            $items[] = "({$groups['GES Levies']}, 'Cultural Fund', 'Cultural activities and programs', 'session', 0)";
            $items[] = "({$groups['GES Levies']}, 'Sports & Games', 'Sports equipment and activities', 'session', 0)";
        }
        
        if (isset($groups['Cambridge Fees'])) {
            $items[] = "({$groups['Cambridge Fees']}, 'Cambridge Registration', 'Cambridge examination registration', 'session', 0)";
            $items[] = "({$groups['Cambridge Fees']}, 'Cambridge Exam Fee', 'Cambridge examination fees', 'term', 0)";
        }
        
        if (isset($groups['Co-curricular'])) {
            $items[] = "({$groups['Co-curricular']}, 'Inter-School Competitions', 'Participation in inter-school events', 'session', 1)";
            $items[] = "({$groups['Co-curricular']}, 'School Magazine', 'Annual school magazine', 'session', 1)";
        }
        
        if (!empty($items)) {
            $sql = "INSERT INTO fee_items (group_id, name, description, frequency, is_optional) VALUES " . implode(", ", $items);
            $pdo->exec($sql);
            echo "<p style='color: green;'>✓ Added " . count($items) . " Ghana-specific fee items</p>";
        }
    } else {
        echo "<p style='color: orange;'>⚠ Ghana fee items already exist</p>";
    }
    
    // 3. Add currency configuration
    echo "<p>Setting currency to Ghana Cedis (GH₵)...</p>";
    
    // Check if config file exists
    $configFile = __DIR__ . '/config/app_config.php';
    $configContent = "<?php\n";
    $configContent .= "/**\n";
    $configContent .= " * Ghana School Configuration\n";
    $configContent .= " */\n\n";
    $configContent .= "// Currency Settings\n";
    $configContent .= "define('CURRENCY_SYMBOL', 'GH₵');\n";
    $configContent .= "define('CURRENCY_CODE', 'GHS');\n";
    $configContent .= "define('CURRENCY_NAME', 'Ghana Cedis');\n\n";
    $configContent .= "// School Context\n";
    $configContent .= "define('SCHOOL_COUNTRY', 'Ghana');\n";
    $configContent .= "define('CURRICULUM_TYPES', ['GES', 'Cambridge']);\n\n";
    $configContent .= "// Date Format (Ghana)\n";
    $configContent .= "define('DATE_FORMAT', 'd/m/Y');\n";
    $configContent .= "define('DATETIME_FORMAT', 'd/m/Y H:i');\n";
    
    file_put_contents($configFile, $configContent);
    echo "<p style='color: green;'>✓ Created Ghana configuration file</p>";
    
    $pdo->commit();
    
    echo "<h3 style='color: green;'>✓ System Updated for Ghana Schools!</h3>";
    echo "<p><strong>Changes Made:</strong></p>";
    echo "<ul>";
    echo "<li>✓ Currency: Ghana Cedis (GH₵)</li>";
    echo "<li>✓ Added GES Levies fee group</li>";
    echo "<li>✓ Added Cambridge Fees group</li>";
    echo "<li>✓ Added Ghana-specific fee items</li>";
    echo "<li>✓ Created configuration file</li>";
    echo "</ul>";
    
    echo "<p><strong>Next Steps:</strong></p>";
    echo "<ol>";
    echo "<li>Set fee amounts for your classes in <a href='http://localhost/McSMS/public/index.php?c=feeStructure&a=rules'>Fee Rules</a></li>";
    echo "<li>Configure GES and Cambridge curriculum levels</li>";
    echo "<li>Test the enrollment process</li>";
    echo "</ol>";
    
    echo "<p><a href='http://localhost/McSMS/public/index.php?c=feeStructure' style='padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; display: inline-block;'>Go to Fee Structure →</a></p>";
    echo "<p style='color: red;'><strong>Note:</strong> Delete this file after running.</p>";
    
} catch (PDOException $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "<p style='color: red;'>✗ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Ghana School Configuration</title>
    <style>
        body { font-family: Arial; max-width: 900px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
        h2 { color: #3F51B5; }
        ul, ol { line-height: 1.8; }
    </style>
</head>
<body>
</body>
</html>
