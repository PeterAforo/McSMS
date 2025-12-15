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

$database = new Database();
$db = $database->getConnection();

$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        getConfiguration($db);
        break;
    
    case 'POST':
        if ($action === 'test_hubtel') {
            testHubtelConnection();
        } elseif ($action === 'test_mnotify') {
            testMNotifyConnection();
        } else {
            saveConfiguration($db);
        }
        break;
    
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}

function getConfiguration($db) {
    try {
        $stmt = $db->prepare("SELECT * FROM system_config WHERE id = 1");
        $stmt->execute();
        $config = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($config) {
            // Don't send sensitive data in plain text
            $config['hubtel_client_secret'] = $config['hubtel_client_secret'] ? '••••••••••••' : '';
            $config['mnotify_api_key'] = $config['mnotify_api_key'] ? '••••••••••••' : '';
            
            echo json_encode([
                'success' => true,
                'config' => $config
            ]);
        } else {
            // Return default config if none exists
            echo json_encode([
                'success' => true,
                'config' => [
                    'hubtel_client_id' => '',
                    'hubtel_client_secret' => '',
                    'hubtel_merchant_number' => '',
                    'hubtel_mode' => 'sandbox',
                    'hubtel_enabled' => false,
                    'mnotify_api_key' => '',
                    'mnotify_sender_id' => '',
                    'mnotify_enabled' => false,
                    'sms_payment_confirmation' => true,
                    'sms_invoice_reminder' => true,
                    'sms_enrollment_confirmation' => true,
                    'sms_attendance_alert' => false
                ]
            ]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error fetching configuration: ' . $e->getMessage()
        ]);
    }
}

function saveConfiguration($db) {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        
        // Check if config exists
        $stmt = $db->prepare("SELECT id FROM system_config WHERE id = 1");
        $stmt->execute();
        $exists = $stmt->fetch();
        
        if ($exists) {
            // Update existing config
            $sql = "UPDATE system_config SET 
                    hubtel_client_id = :hubtel_client_id,
                    hubtel_merchant_number = :hubtel_merchant_number,
                    hubtel_mode = :hubtel_mode,
                    hubtel_enabled = :hubtel_enabled,
                    mnotify_sender_id = :mnotify_sender_id,
                    mnotify_enabled = :mnotify_enabled,
                    sms_payment_confirmation = :sms_payment_confirmation,
                    sms_invoice_reminder = :sms_invoice_reminder,
                    sms_enrollment_confirmation = :sms_enrollment_confirmation,
                    sms_attendance_alert = :sms_attendance_alert,
                    updated_at = NOW()";
            
            // Only update secrets if they're not masked
            if ($data['hubtel_client_secret'] !== '••••••••••••') {
                $sql .= ", hubtel_client_secret = :hubtel_client_secret";
            }
            if ($data['mnotify_api_key'] !== '••••••••••••') {
                $sql .= ", mnotify_api_key = :mnotify_api_key";
            }
            
            $sql .= " WHERE id = 1";
            
            $stmt = $db->prepare($sql);
        } else {
            // Insert new config
            $stmt = $db->prepare("
                INSERT INTO system_config (
                    hubtel_client_id, hubtel_client_secret, hubtel_merchant_number, 
                    hubtel_mode, hubtel_enabled,
                    mnotify_api_key, mnotify_sender_id, mnotify_enabled,
                    sms_payment_confirmation, sms_invoice_reminder, 
                    sms_enrollment_confirmation, sms_attendance_alert,
                    created_at, updated_at
                ) VALUES (
                    :hubtel_client_id, :hubtel_client_secret, :hubtel_merchant_number,
                    :hubtel_mode, :hubtel_enabled,
                    :mnotify_api_key, :mnotify_sender_id, :mnotify_enabled,
                    :sms_payment_confirmation, :sms_invoice_reminder,
                    :sms_enrollment_confirmation, :sms_attendance_alert,
                    NOW(), NOW()
                )
            ");
        }
        
        // Bind parameters
        $stmt->bindParam(':hubtel_client_id', $data['hubtel_client_id']);
        $stmt->bindParam(':hubtel_merchant_number', $data['hubtel_merchant_number']);
        $stmt->bindParam(':hubtel_mode', $data['hubtel_mode']);
        $stmt->bindParam(':hubtel_enabled', $data['hubtel_enabled'], PDO::PARAM_BOOL);
        $stmt->bindParam(':mnotify_sender_id', $data['mnotify_sender_id']);
        $stmt->bindParam(':mnotify_enabled', $data['mnotify_enabled'], PDO::PARAM_BOOL);
        $stmt->bindParam(':sms_payment_confirmation', $data['sms_payment_confirmation'], PDO::PARAM_BOOL);
        $stmt->bindParam(':sms_invoice_reminder', $data['sms_invoice_reminder'], PDO::PARAM_BOOL);
        $stmt->bindParam(':sms_enrollment_confirmation', $data['sms_enrollment_confirmation'], PDO::PARAM_BOOL);
        $stmt->bindParam(':sms_attendance_alert', $data['sms_attendance_alert'], PDO::PARAM_BOOL);
        
        // Bind secrets only if not masked
        if (!$exists || $data['hubtel_client_secret'] !== '••••••••••••') {
            $stmt->bindParam(':hubtel_client_secret', $data['hubtel_client_secret']);
        }
        if (!$exists || $data['mnotify_api_key'] !== '••••••••••••') {
            $stmt->bindParam(':mnotify_api_key', $data['mnotify_api_key']);
        }
        
        $stmt->execute();
        
        echo json_encode([
            'success' => true,
            'message' => 'Configuration saved successfully'
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error saving configuration: ' . $e->getMessage()
        ]);
    }
}

function testHubtelConnection() {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $clientId = $data['client_id'] ?? '';
    $clientSecret = $data['client_secret'] ?? '';
    $mode = $data['mode'] ?? 'sandbox';
    
    if (empty($clientId) || empty($clientSecret)) {
        echo json_encode([
            'success' => false,
            'message' => 'Client ID and Secret are required'
        ]);
        return;
    }
    
    // Test API endpoint
    $apiUrl = $mode === 'live' 
        ? 'https://payproxyapi.hubtel.com/items/initiate'
        : 'https://payproxyapi-sandbox.hubtel.com/items/initiate';
    
    // Make a test request
    $ch = curl_init($apiUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'totalAmount' => 1,
        'description' => 'Connection Test',
        'clientReference' => 'TEST-' . time()
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Basic ' . base64_encode($clientId . ':' . $clientSecret)
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 || $httpCode === 201) {
        echo json_encode([
            'success' => true,
            'message' => 'Connection successful'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Connection failed. Please check your credentials.'
        ]);
    }
}

function testMNotifyConnection() {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $apiKey = $data['api_key'] ?? '';
    
    if (empty($apiKey)) {
        echo json_encode([
            'success' => false,
            'message' => 'API Key is required'
        ]);
        return;
    }
    
    // Test mNotify API
    $apiUrl = 'https://api.mnotify.com/api/balance';
    
    $ch = curl_init($apiUrl . '?key=' . $apiKey);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $result = json_decode($response, true);
        if (isset($result['code']) && $result['code'] === '2000') {
            echo json_encode([
                'success' => true,
                'message' => 'Connection successful. Balance: ' . ($result['balance'] ?? 'N/A')
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid API key'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Connection failed. Please check your API key.'
        ]);
    }
}
?>
