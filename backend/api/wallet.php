<?php
/**
 * Wallet API
 * Handles wallet balance and transactions for parents
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
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
    
    // Ensure tables exist
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS wallets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL UNIQUE,
            balance DECIMAL(10,2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");
    
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS wallet_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            wallet_id INT NOT NULL,
            type ENUM('credit','debit') NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            description VARCHAR(255),
            reference VARCHAR(100),
            balance_before DECIMAL(10,2),
            balance_after DECIMAL(10,2),
            payment_method VARCHAR(50) DEFAULT NULL,
            invoice_id INT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
        )
    ");
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? '';
$userId = $_GET['user_id'] ?? $_POST['user_id'] ?? null;

// Helper function to get or create wallet
function getOrCreateWallet($pdo, $userId) {
    // Check if wallet exists
    $stmt = $pdo->prepare("SELECT * FROM wallets WHERE user_id = ?");
    $stmt->execute([$userId]);
    $wallet = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$wallet) {
        // Create wallet with initial balance of 0
        $stmt = $pdo->prepare("INSERT INTO wallets (user_id, balance) VALUES (?, 0.00)");
        $stmt->execute([$userId]);
        $walletId = $pdo->lastInsertId();
        
        return [
            'id' => $walletId,
            'user_id' => $userId,
            'balance' => 0.00
        ];
    }
    
    return $wallet;
}

// Helper function to record transaction
function recordTransaction($pdo, $walletId, $type, $amount, $description, $balanceBefore, $balanceAfter, $paymentMethod = null, $invoiceId = null) {
    $reference = strtoupper($type === 'credit' ? 'TOP' : 'PAY') . '-' . time() . '-' . rand(1000, 9999);
    
    $stmt = $pdo->prepare("
        INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference, balance_before, balance_after, payment_method, invoice_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$walletId, $type, $amount, $description, $reference, $balanceBefore, $balanceAfter, $paymentMethod, $invoiceId]);
    
    return $reference;
}

switch ($action) {
    case 'get_balance':
        if (!$userId) {
            echo json_encode(['success' => false, 'error' => 'User ID required']);
            exit;
        }
        
        $wallet = getOrCreateWallet($pdo, $userId);
        
        // Get recent transactions
        $stmt = $pdo->prepare("
            SELECT * FROM wallet_transactions 
            WHERE wallet_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        ");
        $stmt->execute([$wallet['id']]);
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'wallet' => [
                'id' => $wallet['id'],
                'balance' => floatval($wallet['balance']),
                'user_id' => $wallet['user_id']
            ],
            'transactions' => $transactions
        ]);
        break;
        
    case 'top_up':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode(['success' => false, 'error' => 'POST method required']);
            exit;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = $data['user_id'] ?? null;
        $amount = floatval($data['amount'] ?? 0);
        $paymentMethod = $data['payment_method'] ?? 'online';
        $description = $data['description'] ?? 'Wallet Top-up';
        
        if (!$userId || $amount <= 0) {
            echo json_encode(['success' => false, 'error' => 'Valid user ID and amount required']);
            exit;
        }
        
        $wallet = getOrCreateWallet($pdo, $userId);
        $balanceBefore = floatval($wallet['balance']);
        $balanceAfter = $balanceBefore + $amount;
        
        // Update wallet balance
        $stmt = $pdo->prepare("UPDATE wallets SET balance = ? WHERE id = ?");
        $stmt->execute([$balanceAfter, $wallet['id']]);
        
        // Record transaction
        $reference = recordTransaction($pdo, $wallet['id'], 'credit', $amount, $description, $balanceBefore, $balanceAfter, $paymentMethod);
        
        echo json_encode([
            'success' => true,
            'message' => 'Wallet topped up successfully',
            'reference' => $reference,
            'balance' => $balanceAfter,
            'amount_added' => $amount
        ]);
        break;
        
    case 'deduct':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode(['success' => false, 'error' => 'POST method required']);
            exit;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = $data['user_id'] ?? null;
        $amount = floatval($data['amount'] ?? 0);
        $description = $data['description'] ?? 'Payment';
        $invoiceId = $data['invoice_id'] ?? null;
        
        if (!$userId || $amount <= 0) {
            echo json_encode(['success' => false, 'error' => 'Valid user ID and amount required']);
            exit;
        }
        
        $wallet = getOrCreateWallet($pdo, $userId);
        $balanceBefore = floatval($wallet['balance']);
        
        if ($balanceBefore < $amount) {
            echo json_encode(['success' => false, 'error' => 'Insufficient balance', 'balance' => $balanceBefore]);
            exit;
        }
        
        $balanceAfter = $balanceBefore - $amount;
        
        // Update wallet balance
        $stmt = $pdo->prepare("UPDATE wallets SET balance = ? WHERE id = ?");
        $stmt->execute([$balanceAfter, $wallet['id']]);
        
        // Record transaction
        $reference = recordTransaction($pdo, $wallet['id'], 'debit', $amount, $description, $balanceBefore, $balanceAfter, 'wallet', $invoiceId);
        
        echo json_encode([
            'success' => true,
            'message' => 'Payment successful',
            'reference' => $reference,
            'balance' => $balanceAfter,
            'amount_deducted' => $amount
        ]);
        break;
        
    case 'transactions':
        if (!$userId) {
            echo json_encode(['success' => false, 'error' => 'User ID required']);
            exit;
        }
        
        $wallet = getOrCreateWallet($pdo, $userId);
        
        $limit = intval($_GET['limit'] ?? 50);
        $offset = intval($_GET['offset'] ?? 0);
        
        $stmt = $pdo->prepare("
            SELECT * FROM wallet_transactions 
            WHERE wallet_id = ? 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        ");
        $stmt->execute([$wallet['id'], $limit, $offset]);
        $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get total count
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM wallet_transactions WHERE wallet_id = ?");
        $stmt->execute([$wallet['id']]);
        $total = $stmt->fetchColumn();
        
        echo json_encode([
            'success' => true,
            'transactions' => $transactions,
            'total' => intval($total),
            'limit' => $limit,
            'offset' => $offset
        ]);
        break;
        
    default:
        echo json_encode([
            'success' => false,
            'error' => 'Invalid action',
            'available_actions' => ['get_balance', 'top_up', 'deduct', 'transactions']
        ]);
}
