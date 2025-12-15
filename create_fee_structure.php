<?php
/**
 * Enterprise-Grade Fee Structure Module
 * Complete Database Schema
 */

$host = 'localhost';
$username = 'root';
$password = '';
$database = 'school_management_system';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$database", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2>Creating Enterprise Fee Structure</h2>";
    
    // 1. Fee Groups
    echo "<p>Creating fee_groups table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS fee_groups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT NULL,
            display_order INT DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ fee_groups table created</p>";
    
    // 2. Fee Items
    echo "<p>Creating fee_items table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS fee_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            group_id INT NOT NULL,
            name VARCHAR(150) NOT NULL,
            description TEXT,
            frequency ENUM('term','session','one_time') DEFAULT 'term',
            is_optional TINYINT(1) DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (group_id) REFERENCES fee_groups(id) ON DELETE CASCADE,
            INDEX idx_group (group_id),
            INDEX idx_optional (is_optional),
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ fee_items table created</p>";
    
    // 3. Fee Item Rules (Class-based pricing)
    echo "<p>Creating fee_item_rules table...</p>";
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS fee_item_rules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fee_item_id INT NOT NULL,
            class_id INT NOT NULL,
            term_id INT NULL,
            amount DECIMAL(10,2) NOT NULL,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (fee_item_id) REFERENCES fee_items(id) ON DELETE CASCADE,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
            FOREIGN KEY (term_id) REFERENCES academic_terms(id) ON DELETE SET NULL,
            UNIQUE KEY unique_rule (fee_item_id, class_id, term_id),
            INDEX idx_class (class_id),
            INDEX idx_term (term_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "<p style='color: green;'>✓ fee_item_rules table created</p>";
    
    // 4. Update installment_plans (already exists, just verify)
    echo "<p>Verifying installment_plans table...</p>";
    $stmt = $pdo->query("SHOW TABLES LIKE 'installment_plans'");
    if ($stmt->rowCount() > 0) {
        echo "<p style='color: orange;'>⚠ installment_plans already exists</p>";
    } else {
        $pdo->exec("
            CREATE TABLE installment_plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                plan_json JSON NOT NULL,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        echo "<p style='color: green;'>✓ installment_plans table created</p>";
    }
    
    // 5. Update optional_services (already exists, just verify)
    echo "<p>Verifying optional_services table...</p>";
    $stmt = $pdo->query("SHOW TABLES LIKE 'optional_services'");
    if ($stmt->rowCount() > 0) {
        echo "<p style='color: orange;'>⚠ optional_services already exists</p>";
    }
    
    // 6. Insert Default Fee Groups
    echo "<p>Inserting default fee groups...</p>";
    $stmt = $pdo->query("SELECT COUNT(*) FROM fee_groups");
    if ($stmt->fetchColumn() == 0) {
        $pdo->exec("
            INSERT INTO fee_groups (name, description, display_order) VALUES
            ('Tuition', 'Main tuition fees for classes', 1),
            ('Books & Materials', 'Textbooks and learning materials', 2),
            ('ICT', 'Information and Communication Technology fees', 3),
            ('PTA', 'Parent-Teacher Association dues', 4),
            ('Activities', 'Sports, clubs, and extracurricular activities', 5),
            ('Transport', 'School bus and transportation', 6),
            ('Meals', 'Lunch and meal programs', 7),
            ('Medical', 'Health services and insurance', 8),
            ('Uniform', 'School uniforms and accessories', 9),
            ('Examination', 'Exam fees and certificates', 10)
        ");
        echo "<p style='color: green;'>✓ Default fee groups inserted</p>";
    } else {
        echo "<p style='color: orange;'>⚠ Fee groups already exist</p>";
    }
    
    // 7. Insert Sample Fee Items
    echo "<p>Inserting sample fee items...</p>";
    $stmt = $pdo->query("SELECT COUNT(*) FROM fee_items");
    if ($stmt->fetchColumn() == 0) {
        // Get group IDs - fetch as associative array
        $groupsResult = $pdo->query("SELECT id, name FROM fee_groups")->fetchAll(PDO::FETCH_ASSOC);
        $groups = [];
        foreach ($groupsResult as $row) {
            $groups[$row['name']] = $row['id'];
        }
        
        // Verify we have the groups
        if (empty($groups)) {
            echo "<p style='color: red;'>✗ No fee groups found!</p>";
        } else {
            // Build the SQL with actual IDs
            $sql = "INSERT INTO fee_items (group_id, name, description, frequency, is_optional) VALUES ";
            $values = [];
            
            // Tuition (Mandatory)
            if (isset($groups['Tuition'])) {
                $values[] = "({$groups['Tuition']}, 'Creche Tuition', 'Tuition for Creche level', 'term', 0)";
                $values[] = "({$groups['Tuition']}, 'Nursery Tuition', 'Tuition for Nursery level', 'term', 0)";
                $values[] = "({$groups['Tuition']}, 'KG Tuition', 'Tuition for Kindergarten', 'term', 0)";
                $values[] = "({$groups['Tuition']}, 'Primary Tuition', 'Tuition for Primary (Grade 1-5)', 'term', 0)";
                $values[] = "({$groups['Tuition']}, 'Secondary Tuition', 'Tuition for Secondary (Grade 6-12)', 'term', 0)";
            }
            
            // ICT (Mandatory)
            if (isset($groups['ICT'])) {
                $values[] = "({$groups['ICT']}, 'ICT Fee', 'Computer lab and technology access', 'term', 0)";
            }
            
            // PTA (Mandatory)
            if (isset($groups['PTA'])) {
                $values[] = "({$groups['PTA']}, 'PTA Dues', 'Parent-Teacher Association membership', 'session', 0)";
            }
            
            // Books (Mandatory)
            if (isset($groups['Books & Materials'])) {
                $values[] = "({$groups['Books & Materials']}, 'Textbooks', 'Required textbooks', 'session', 0)";
                $values[] = "({$groups['Books & Materials']}, 'Workbooks', 'Exercise and workbooks', 'term', 0)";
            }
            
            // Activities (Optional)
            if (isset($groups['Activities'])) {
                $values[] = "({$groups['Activities']}, 'Sports Program', 'Sports and athletics', 'term', 1)";
                $values[] = "({$groups['Activities']}, 'Music Lessons', 'Music and instruments', 'term', 1)";
                $values[] = "({$groups['Activities']}, 'Art Classes', 'Art and crafts', 'term', 1)";
                $values[] = "({$groups['Activities']}, 'Robotics Club', 'STEM and robotics', 'term', 1)";
            }
            
            // Transport (Optional)
            if (isset($groups['Transport'])) {
                $values[] = "({$groups['Transport']}, 'School Bus', 'Daily transportation', 'term', 1)";
            }
            
            // Meals (Optional)
            if (isset($groups['Meals'])) {
                $values[] = "({$groups['Meals']}, 'Lunch Program', 'Daily lunch service', 'term', 1)";
            }
            
            // Examination
            if (isset($groups['Examination'])) {
                $values[] = "({$groups['Examination']}, 'Exam Fee', 'Terminal examination fees', 'term', 0)";
            }
            
            if (!empty($values)) {
                $sql .= implode(", ", $values);
                $pdo->exec($sql);
                echo "<p style='color: green;'>✓ Sample fee items inserted (" . count($values) . " items)</p>";
            } else {
                echo "<p style='color: orange;'>⚠ No fee items to insert</p>";
            }
        }
    } else {
        echo "<p style='color: orange;'>⚠ Fee items already exist</p>";
    }
    
    // 8. Insert Sample Fee Rules for Classes
    echo "<p>Inserting sample fee rules...</p>";
    $stmt = $pdo->query("SELECT COUNT(*) FROM fee_item_rules");
    if ($stmt->fetchColumn() == 0) {
        // Get first few classes
        $classes = $pdo->query("SELECT id, class_name FROM classes LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
        $items = $pdo->query("SELECT id, name FROM fee_items WHERE is_optional = 0 LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
        
        if (!empty($classes) && !empty($items)) {
            foreach ($classes as $class) {
                foreach ($items as $item) {
                    // Different amounts based on class
                    $baseAmount = 50000 + ($class['id'] * 5000);
                    $pdo->exec("
                        INSERT INTO fee_item_rules (fee_item_id, class_id, term_id, amount) 
                        VALUES ({$item['id']}, {$class['id']}, NULL, {$baseAmount})
                    ");
                }
            }
            echo "<p style='color: green;'>✓ Sample fee rules inserted</p>";
        } else {
            echo "<p style='color: orange;'>⚠ No classes found, skipping fee rules</p>";
        }
    } else {
        echo "<p style='color: orange;'>⚠ Fee rules already exist</p>";
    }
    
    echo "<h3 style='color: green;'>✓ Enterprise Fee Structure Created Successfully!</h3>";
    echo "<p><strong>Summary:</strong></p>";
    echo "<ul>";
    echo "<li>✓ fee_groups table</li>";
    echo "<li>✓ fee_items table</li>";
    echo "<li>✓ fee_item_rules table</li>";
    echo "<li>✓ installment_plans table (verified)</li>";
    echo "<li>✓ Default data inserted</li>";
    echo "</ul>";
    echo "<p><a href='http://localhost/McSMS/public/' style='padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; display: inline-block;'>Go to Application →</a></p>";
    echo "<p style='color: red;'><strong>Note:</strong> Delete this file after running.</p>";
    
} catch (PDOException $e) {
    echo "<p style='color: red;'>✗ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>Create Fee Structure</title>
    <style>
        body { font-family: Arial; max-width: 900px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
        h2 { color: #3F51B5; }
        h3 { color: #666; margin-top: 20px; }
        ul { line-height: 1.8; }
    </style>
</head>
<body>
</body>
</html>
