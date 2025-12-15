<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

// Hubtel API Configuration
define('HUBTEL_CLIENT_ID', 'YOUR_HUBTEL_CLIENT_ID'); // Configure this
define('HUBTEL_CLIENT_SECRET', 'YOUR_HUBTEL_CLIENT_SECRET'); // Configure this
define('HUBTEL_API_URL', 'https://payproxyapi.hubtel.com/items/initiate');

$database = new Database();
$db = $database->getConnection();

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'initiate':
        initiatePayment($db);
        break;
    
    case 'callback':
        handleCallback($db);
        break;
    
    case 'verify':
        verifyPayment($db);
        break;
    
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

function initiatePayment($db) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate required fields
    $required = ['amount', 'description', 'clientReference'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
            return;
        }
    }
    
    // Prepare Hubtel payment request
    $paymentRequest = [
        'totalAmount' => $data['amount'],
        'description' => $data['description'],
        'callbackUrl' => $data['callbackUrl'] ?? '',
        'returnUrl' => $data['returnUrl'] ?? '',
        'cancellationUrl' => $data['cancellationUrl'] ?? '',
        'merchantAccountNumber' => $data['merchantAccountNumber'] ?? '',
        'clientReference' => $data['clientReference']
    ];
    
    // Add customer info if provided
    if (isset($data['customerName'])) {
        $paymentRequest['customerName'] = $data['customerName'];
    }
    if (isset($data['customerEmail'])) {
        $paymentRequest['customerEmail'] = $data['customerEmail'];
    }
    if (isset($data['customerMobileNumber'])) {
        $paymentRequest['customerMobileNumber'] = $data['customerMobileNumber'];
    }
    
    // Make API call to Hubtel
    $ch = curl_init(HUBTEL_API_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($paymentRequest));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Basic ' . base64_encode(HUBTEL_CLIENT_ID . ':' . HUBTEL_CLIENT_SECRET)
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $result = json_decode($response, true);
        
        // Save payment initiation to database
        $stmt = $db->prepare("
            INSERT INTO payment_transactions 
            (client_reference, hubtel_reference, amount, status, description, created_at) 
            VALUES (?, ?, ?, 'pending', ?, NOW())
        ");
        $stmt->execute([
            $data['clientReference'],
            $result['data']['checkoutId'] ?? '',
            $data['amount'],
            $data['description']
        ]);
        
        echo json_encode([
            'success' => true,
            'checkoutUrl' => $result['data']['checkoutUrl'] ?? '',
            'checkoutId' => $result['data']['checkoutId'] ?? '',
            'message' => 'Payment initiated successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to initiate payment',
            'error' => $response
        ]);
    }
}

function handleCallback($db) {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Hubtel sends callback data
    $clientReference = $data['ClientReference'] ?? '';
    $status = $data['Status'] ?? '';
    $transactionId = $data['TransactionId'] ?? '';
    
    if ($status === 'Success' || $status === 'Successful') {
        // Update payment status
        $stmt = $db->prepare("
            UPDATE payment_transactions 
            SET status = 'completed', 
                hubtel_transaction_id = ?,
                completed_at = NOW()
            WHERE client_reference = ?
        ");
        $stmt->execute([$transactionId, $clientReference]);
        
        // Get payment details
        $stmt = $db->prepare("SELECT * FROM payment_transactions WHERE client_reference = ?");
        $stmt->execute([$clientReference]);
        $payment = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($payment) {
            // Check if this is a wallet top-up or invoice payment
            if (strpos($payment['description'], 'Wallet Top-up') !== false) {
                // Credit wallet
                creditWallet($db, $payment);
            } else if (strpos($payment['description'], 'Invoice') !== false) {
                // Process invoice payment
                processInvoicePayment($db, $payment);
            }
        }
        
        echo json_encode(['success' => true, 'message' => 'Payment processed']);
    } else {
        // Update as failed
        $stmt = $db->prepare("
            UPDATE payment_transactions 
            SET status = 'failed'
            WHERE client_reference = ?
        ");
        $stmt->execute([$clientReference]);
        
        echo json_encode(['success' => false, 'message' => 'Payment failed']);
    }
}

function creditWallet($db, $payment) {
    // Extract parent_id from description or client_reference
    // Format: "Wallet Top-up - Parent ID: X"
    preg_match('/Parent ID: (\d+)/', $payment['description'], $matches);
    $parentId = $matches[1] ?? null;
    
    if ($parentId) {
        // Create wallet transaction
        $stmt = $db->prepare("
            INSERT INTO wallet_transactions 
            (parent_id, type, amount, description, reference, created_at) 
            VALUES (?, 'credit', ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $parentId,
            $payment['amount'],
            'Wallet Top-up via Hubtel',
            $payment['client_reference']
        ]);
        
        // Update wallet balance
        $stmt = $db->prepare("
            INSERT INTO parent_wallets (parent_id, balance, updated_at)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
            balance = balance + ?,
            updated_at = NOW()
        ");
        $stmt->execute([$parentId, $payment['amount'], $payment['amount']]);
    }
}

function processInvoicePayment($db, $payment) {
    // Extract invoice_id from description
    preg_match('/Invoice (\w+)/', $payment['description'], $matches);
    $invoiceNumber = $matches[1] ?? null;
    
    if ($invoiceNumber) {
        // Get invoice
        $stmt = $db->prepare("SELECT * FROM invoices WHERE invoice_number = ?");
        $stmt->execute([$invoiceNumber]);
        $invoice = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($invoice) {
            // Create payment record
            $stmt = $db->prepare("
                INSERT INTO payments 
                (invoice_id, amount, payment_method, payment_date, reference_number, status, created_at) 
                VALUES (?, ?, 'hubtel', NOW(), ?, 'completed', NOW())
            ");
            $stmt->execute([
                $invoice['id'],
                $payment['amount'],
                $payment['client_reference']
            ]);
            
            // Update invoice
            $newPaidAmount = $invoice['paid_amount'] + $payment['amount'];
            $newBalance = $invoice['total_amount'] - $newPaidAmount;
            $newStatus = $newBalance <= 0 ? 'paid' : 'partial';
            
            $stmt = $db->prepare("
                UPDATE invoices 
                SET paid_amount = ?,
                    balance = ?,
                    status = ?,
                    updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$newPaidAmount, $newBalance, $newStatus, $invoice['id']]);
        }
    }
}

function verifyPayment($db) {
    $clientReference = $_GET['reference'] ?? '';
    
    if (!$clientReference) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing reference']);
        return;
    }
    
    $stmt = $db->prepare("SELECT * FROM payment_transactions WHERE client_reference = ?");
    $stmt->execute([$clientReference]);
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($payment) {
        echo json_encode([
            'success' => true,
            'payment' => $payment
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Payment not found']);
    }
}
?>
