<?php
namespace McSMS\Notifications;

use Twilio\Rest\Client;

class SMSService
{
    private $client;
    private $config;
    
    public function __construct($config = [])
    {
        $this->config = array_merge([
            'account_sid' => '', // Configure in production
            'auth_token' => '', // Configure in production
            'from_number' => '', // Twilio phone number
            'provider' => 'twilio' // twilio, arkesel, hubtel
        ], $config);
        
        if ($this->config['provider'] === 'twilio' && !empty($this->config['account_sid'])) {
            $this->client = new Client(
                $this->config['account_sid'],
                $this->config['auth_token']
            );
        }
    }
    
    /**
     * Send SMS
     */
    public function send($to, $message)
    {
        try {
            // Format phone number for Ghana
            $to = $this->formatPhoneNumber($to);
            
            if ($this->config['provider'] === 'twilio') {
                return $this->sendViaTwilio($to, $message);
            } elseif ($this->config['provider'] === 'arkesel') {
                return $this->sendViaArkesel($to, $message);
            } elseif ($this->config['provider'] === 'hubtel') {
                return $this->sendViaHubtel($to, $message);
            }
            
            // Demo mode - just log
            return [
                'success' => true,
                'message' => 'SMS sent (demo mode)',
                'to' => $to,
                'body' => $message
            ];
            
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    /**
     * Send bulk SMS
     */
    public function sendBulk($recipients, $message)
    {
        $results = [];
        $sent = 0;
        $failed = 0;
        
        foreach ($recipients as $recipient) {
            $result = $this->send($recipient, $message);
            $results[] = $result;
            
            if ($result['success']) {
                $sent++;
            } else {
                $failed++;
            }
        }
        
        return [
            'success' => true,
            'total' => count($recipients),
            'sent' => $sent,
            'failed' => $failed,
            'results' => $results
        ];
    }
    
    /**
     * Send payment confirmation SMS
     */
    public function sendPaymentConfirmation($payment, $phone)
    {
        $message = "Payment received! Receipt: {$payment['receipt_number']}. "
                 . "Amount: GHS " . number_format($payment['amount'], 2) . ". "
                 . "Thank you! - McSMS School";
        
        return $this->send($phone, $message);
    }
    
    /**
     * Send invoice reminder SMS
     */
    public function sendInvoiceReminder($invoice, $phone)
    {
        $message = "Fee reminder: Invoice {$invoice['invoice_number']} "
                 . "for {$invoice['student_name']}. "
                 . "Amount due: GHS " . number_format($invoice['balance'], 2) . ". "
                 . "Due: {$invoice['due_date']}. - McSMS School";
        
        return $this->send($phone, $message);
    }
    
    /**
     * Send attendance alert SMS
     */
    public function sendAttendanceAlert($student, $phone, $date, $status)
    {
        $message = "Attendance alert: {$student['first_name']} {$student['last_name']} "
                 . "was marked {$status} on {$date}. - McSMS School";
        
        return $this->send($phone, $message);
    }
    
    /**
     * Send application status SMS
     */
    public function sendApplicationStatus($application, $phone, $status)
    {
        $statusText = $status === 'approved' ? 'APPROVED' : 'REJECTED';
        $message = "Application {$application['application_number']} "
                 . "for {$application['first_name']} {$application['last_name']} "
                 . "has been {$statusText}. - McSMS School";
        
        return $this->send($phone, $message);
    }
    
    /**
     * Send homework reminder SMS
     */
    public function sendHomeworkReminder($homework, $phone, $student)
    {
        $message = "Homework reminder for {$student['first_name']}: "
                 . "{$homework['title']} ({$homework['subject_name']}). "
                 . "Due: {$homework['due_date']}. - McSMS School";
        
        return $this->send($phone, $message);
    }
    
    /**
     * Send report card notification SMS
     */
    public function sendReportCardNotification($student, $phone, $term)
    {
        $message = "Report card for {$student['first_name']} {$student['last_name']} "
                 . "({$term['term_name']}) is now available. "
                 . "Login to view. - McSMS School";
        
        return $this->send($phone, $message);
    }
    
    /**
     * Send emergency alert SMS
     */
    public function sendEmergencyAlert($message, $phone)
    {
        $alertMessage = "URGENT: {$message} - McSMS School";
        return $this->send($phone, $alertMessage);
    }
    
    /**
     * Send OTP SMS
     */
    public function sendOTP($phone, $otp)
    {
        $message = "Your McSMS verification code is: {$otp}. "
                 . "Valid for 10 minutes. Do not share this code.";
        
        return $this->send($phone, $message);
    }
    
    // ============================================
    // PROVIDER-SPECIFIC METHODS
    // ============================================
    
    private function sendViaTwilio($to, $message)
    {
        if (!$this->client) {
            throw new \Exception('Twilio client not initialized');
        }
        
        $twilioMessage = $this->client->messages->create(
            $to,
            [
                'from' => $this->config['from_number'],
                'body' => $message
            ]
        );
        
        return [
            'success' => true,
            'message_sid' => $twilioMessage->sid,
            'status' => $twilioMessage->status
        ];
    }
    
    private function sendViaArkesel($to, $message)
    {
        // Arkesel SMS API for Ghana
        $apiKey = $this->config['api_key'] ?? '';
        $senderId = $this->config['sender_id'] ?? 'McSMS';
        
        $url = 'https://sms.arkesel.com/api/v2/sms/send';
        
        $data = [
            'sender' => $senderId,
            'message' => $message,
            'recipients' => [$to]
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'api-key: ' . $apiKey,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $result = json_decode($response, true);
        
        return [
            'success' => $httpCode === 200,
            'response' => $result
        ];
    }
    
    private function sendViaHubtel($to, $message)
    {
        // Hubtel SMS API for Ghana
        $clientId = $this->config['client_id'] ?? '';
        $clientSecret = $this->config['client_secret'] ?? '';
        $senderId = $this->config['sender_id'] ?? 'McSMS';
        
        $url = 'https://smsc.hubtel.com/v1/messages/send';
        
        $data = [
            'From' => $senderId,
            'To' => $to,
            'Content' => $message
        ];
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_USERPWD, $clientId . ':' . $clientSecret);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/x-www-form-urlencoded'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $result = json_decode($response, true);
        
        return [
            'success' => $httpCode === 200 || $httpCode === 201,
            'response' => $result
        ];
    }
    
    // ============================================
    // HELPER METHODS
    // ============================================
    
    private function formatPhoneNumber($phone)
    {
        // Remove spaces and special characters
        $phone = preg_replace('/[^0-9+]/', '', $phone);
        
        // If starts with 0, replace with +233
        if (substr($phone, 0, 1) === '0') {
            $phone = '+233' . substr($phone, 1);
        }
        
        // If doesn't start with +, add +233
        if (substr($phone, 0, 1) !== '+') {
            $phone = '+233' . $phone;
        }
        
        return $phone;
    }
    
    /**
     * Validate phone number
     */
    public function validatePhone($phone)
    {
        $phone = $this->formatPhoneNumber($phone);
        
        // Ghana phone numbers should be +233 followed by 9 digits
        return preg_match('/^\+233[0-9]{9}$/', $phone);
    }
    
    /**
     * Get SMS balance (provider-specific)
     */
    public function getBalance()
    {
        if ($this->config['provider'] === 'arkesel') {
            return $this->getArkeselBalance();
        } elseif ($this->config['provider'] === 'hubtel') {
            return $this->getHubtelBalance();
        }
        
        return ['success' => false, 'message' => 'Balance check not supported'];
    }
    
    private function getArkeselBalance()
    {
        $apiKey = $this->config['api_key'] ?? '';
        $url = 'https://sms.arkesel.com/api/v2/clients/balance-details';
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'api-key: ' . $apiKey
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
    
    private function getHubtelBalance()
    {
        $clientId = $this->config['client_id'] ?? '';
        $clientSecret = $this->config['client_secret'] ?? '';
        $url = 'https://smsc.hubtel.com/v1/account/balance';
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERPWD, $clientId . ':' . $clientSecret);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true);
    }
}
