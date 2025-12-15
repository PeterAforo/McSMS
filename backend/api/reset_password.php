<?php
header('Content-Type: text/plain');
require_once __DIR__ . '/../../config/database.php';

$pdo = new PDO(
    "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME,
    DB_USER,
    DB_PASS
);

// Reset all user passwords to 'password123'
$hash = password_hash('password123', PASSWORD_DEFAULT);
$stmt = $pdo->prepare("UPDATE users SET password = ?");
$stmt->execute([$hash]);

$count = $stmt->rowCount();

echo "Password reset successfully for $count users!\n";
echo "All users can now login with password: password123\n\n";

// List all users
$stmt = $pdo->query("SELECT id, name, email, user_type FROM users");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Users:\n";
foreach ($users as $user) {
    echo "- {$user['email']} ({$user['user_type']})\n";
}
