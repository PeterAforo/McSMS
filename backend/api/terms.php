<?php
header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin) || strpos($origin, 'eea.mcaforo.com') !== false) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // Create table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS academic_terms (
            id INT AUTO_INCREMENT PRIMARY KEY,
            term_name VARCHAR(100) NOT NULL,
            term_code VARCHAR(20) NULL,
            academic_year INT NOT NULL,
            term_number INT DEFAULT 1,
            start_date DATE NULL,
            end_date DATE NULL,
            is_active TINYINT(1) DEFAULT 0,
            status ENUM('upcoming', 'active', 'completed') DEFAULT 'upcoming',
            description TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_year (academic_year),
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Insert default terms if empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM academic_terms");
    if ($stmt->fetchColumn() == 0) {
        $year = date('Y');
        $pdo->exec("
            INSERT INTO academic_terms (term_name, term_code, academic_year, term_number, status) VALUES
            ('First Term', 'T1-$year', $year, 1, 'active'),
            ('Second Term', 'T2-$year', $year, 2, 'upcoming'),
            ('Third Term', 'T3-$year', $year, 3, 'upcoming')
        ");
        $pdo->exec("UPDATE academic_terms SET is_active = 1 WHERE term_number = 1 AND academic_year = $year");
    }

    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM academic_terms WHERE id = ?");
                $stmt->execute([$id]);
                $term = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'term' => $term]);
            } else {
                $stmt = $pdo->query("SELECT * FROM academic_terms ORDER BY academic_year DESC, term_number");
                $terms = $stmt->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode(['success' => true, 'terms' => $terms]);
            }
            break;

        case 'POST':
            if ($action === 'activate' && $id) {
                // Deactivate all terms first
                $pdo->exec("UPDATE academic_terms SET is_active = 0");
                // Activate selected term
                $stmt = $pdo->prepare("UPDATE academic_terms SET is_active = 1, status = 'active' WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'message' => 'Term activated']);
            } else {
                $data = json_decode(file_get_contents('php://input'), true);
                $stmt = $pdo->prepare("INSERT INTO academic_terms (term_name, term_code, academic_year, term_number, start_date, end_date, is_active, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['term_name'], 
                    $data['term_code'], 
                    $data['academic_year'], 
                    $data['term_number'], 
                    $data['start_date'], 
                    $data['end_date'], 
                    $data['is_active'] ?? 0, 
                    $data['status'] ?? 'upcoming', 
                    $data['description'] ?? null
                ]);
                $id = $pdo->lastInsertId();
                $stmt = $pdo->prepare("SELECT * FROM academic_terms WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(['success' => true, 'term' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            }
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE academic_terms SET term_name=?, term_code=?, academic_year=?, term_number=?, start_date=?, end_date=?, status=?, description=? WHERE id=?");
            $stmt->execute([
                $data['term_name'], 
                $data['term_code'], 
                $data['academic_year'], 
                $data['term_number'], 
                $data['start_date'], 
                $data['end_date'], 
                $data['status'], 
                $data['description'], 
                $id
            ]);
            $stmt = $pdo->prepare("SELECT * FROM academic_terms WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'term' => $stmt->fetch(PDO::FETCH_ASSOC)]);
            break;

        case 'DELETE':
            $stmt = $pdo->prepare("DELETE FROM academic_terms WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
