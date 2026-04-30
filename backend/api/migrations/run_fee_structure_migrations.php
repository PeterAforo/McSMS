<?php
header('Content-Type: text/html; charset=utf-8');
require_once __DIR__ . '/../../../config/database.php';

echo "<h2>Fee Structure Database Migrations</h2>";
echo "<p>Running migrations to add late fee and tax columns...</p>";

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    
    // Migration 1: Add columns to fee_item_rules
    echo "<h3>Migration 1: fee_item_rules columns</h3>";
    try {
        $pdo->exec("ALTER TABLE fee_item_rules ADD COLUMN late_fee DECIMAL(10,2) DEFAULT 0");
        echo "<p style='color: green;'>✓ Added late_fee column</p>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "<p style='color: orange;'>⚠ late_fee column already exists</p>";
        } else {
            throw $e;
        }
    }
    
    try {
        $pdo->exec("ALTER TABLE fee_item_rules ADD COLUMN late_fee_type ENUM('fixed', 'percentage') DEFAULT 'fixed'");
        echo "<p style='color: green;'>✓ Added late_fee_type column</p>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "<p style='color: orange;'>⚠ late_fee_type column already exists</p>";
        } else {
            throw $e;
        }
    }
    
    try {
        $pdo->exec("ALTER TABLE fee_item_rules ADD COLUMN is_taxable TINYINT(1) DEFAULT 0");
        echo "<p style='color: green;'>✓ Added is_taxable column</p>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "<p style='color: orange;'>⚠ is_taxable column already exists</p>";
        } else {
            throw $e;
        }
    }
    
    try {
        $pdo->exec("ALTER TABLE fee_item_rules ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 0");
        echo "<p style='color: green;'>✓ Added tax_rate column</p>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "<p style='color: orange;'>⚠ tax_rate column already exists</p>";
        } else {
            throw $e;
        }
    }
    
    // Migration 2: Add columns to fee_items
    echo "<h3>Migration 2: fee_items columns</h3>";
    try {
        $pdo->exec("ALTER TABLE fee_items ADD COLUMN is_taxable TINYINT(1) DEFAULT 0");
        echo "<p style='color: green;'>✓ Added is_taxable column</p>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "<p style='color: orange;'>⚠ is_taxable column already exists</p>";
        } else {
            throw $e;
        }
    }
    
    try {
        $pdo->exec("ALTER TABLE fee_items ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 0");
        echo "<p style='color: green;'>✓ Added tax_rate column</p>";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
            echo "<p style='color: orange;'>⚠ tax_rate column already exists</p>";
        } else {
            throw $e;
        }
    }
    
    echo "<h2 style='color: green;'>✅ All migrations completed successfully!</h2>";
    
} catch (PDOException $e) {
    echo "<h2 style='color: red;'>❌ Migration failed:</h2>";
    echo "<p style='color: red;'>" . $e->getMessage() . "</p>";
}
