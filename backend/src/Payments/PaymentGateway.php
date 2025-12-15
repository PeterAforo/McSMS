<?php
namespace McSMS\Payments;

class PaymentGateway
{
    private $config;
    private $provider;
    
    public function __construct($config = [])
    {
        $this->config = array_merge([
            'provider' => 'paystack', // paystack, flutterwave, hubtel
            'public_key' => '',
            'secret_key' => '',
            'callback_url' => 'http://localhost:5173/payment/callback',
            'currency' => 'GHS'
        ], $config);
        
        $this->provider = $this->config['provider'];
    }
    
    /**
     * Initialize payment
     */
    public function initializePayment($amount, $email, $reference, $metadata = [])
    {
        switch ($this->provider) {
            case 'paystack':
                return $this->initializePaystack($amount, $email, $reference, $metadata);
            case 'flutterwave':
                return $this->initializeFlutterwave($amount, $email, $reference, $metadata);
            case 'hubtel':
                return $this->initializeHubtel($amount, $email, $reference, $metadata);
            default:
                throw new \Exception('Invalid payment provider');
        }
    }
    
    /**
     * Verify payment
     */
    public function verifyPayment($reference)
    {
        switch ($this->provider) {
            case 'paystack':
                return $this->verifyPaystack($reference);
            case 'flutterwave':
                return $this->verifyFlutterwave($reference);
            case 'hubtel':
                return $this->verifyHubtel($reference);
            default:
                throw new \Exception('Invalid payment provider');
        }
    }
    
    /**
     * Process mobile money payment
     */
    public function processMobileMoney($phone, $amount, $network, $reference)
    {
        switch ($this->provider) {
            case 'paystack':
                return $this->paystackMobileMoney($phone, $amount, $network, $reference);
            case 'hubtel':
                return $this->hubtelMobileMoney($phone, $amount, $network, $reference);
            default:
                throw new \Exception('Mobile money not supported for this provider');
        }
    }
    
    // ============================================
    // PAYSTACK INTEGRATION
    // ============================================
    
    private function initializePaystack($amount, $email, $reference, $metadata)
    {
        $url = 'https://api.paystack.co/transaction/initialize';
        
        $data = [
            'email' => $email,
            'amount' => $amount * 100, // Convert to pesewas
            'reference' => $reference,
            'currency' => $this->config['currency'],
            'callback_url' => $this->config['callback_url'],
            'metadata' => $metadata
        ];
        
        $response = $this->makeRequest($url, 'POST', $data, [
            'Authorization: Bearer ' . $this->config['secret_key']
        ]);
        
        if ($response['status']) {
            return [
                'success' => true,
                'authorization_url' => $response['data']['authorization_url'],
                'access_code' => $response['data']['access_code'],
                'reference' => $response['data']['reference']
            ];
        }
        
        return ['success' => false, 'message' => $response['message'] ?? 'Payment initialization failed'];
    }
    
    private function verifyPaystack($reference)
    {
        $url = "https://api.paystack.co/transaction/verify/{$reference}";
        
        $response = $this->makeRequest($url, 'GET', null, [
            'Authorization: Bearer ' . $this->config['secret_key']
        ]);
        
        if ($response['status'] && $response['data']['status'] === 'success') {
            return [
                'success' => true,
                'amount' => $response['data']['amount'] / 100, // Convert from pesewas
                'reference' => $response['data']['reference'],
                'paid_at' => $response['data']['paid_at'],
                'channel' => $response['data']['channel'],
                'customer' => $response['data']['customer']
            ];
        }
        
        return ['success' => false, 'message' => 'Payment verification failed'];
    }
    
    private function paystackMobileMoney($phone, $amount, $network, $reference)
    {
        $url = 'https://api.paystack.co/charge';
        
        $data = [
            'email' => 'customer@example.com', // Required by Paystack
            'amount' => $amount * 100,
            'mobile_money' => [
                'phone' => $phone,
                'provider' => $network // mtn, vodafone, tigo
            ],
            'reference' => $reference
        ];
        
        $response = $this->makeRequest($url, 'POST', $data, [
            'Authorization: Bearer ' . $this->config['secret_key']
        ]);
        
        return [
            'success' => $response['status'] ?? false,
            'data' => $response['data'] ?? null,
            'message' => $response['message'] ?? 'Mobile money charge failed'
        ];
    }
    
    // ============================================
    // FLUTTERWAVE INTEGRATION
    // ============================================
    
    private function initializeFlutterwave($amount, $email, $reference, $metadata)
    {
        $url = 'https://api.flutterwave.com/v3/payments';
        
        $data = [
            'tx_ref' => $reference,
            'amount' => $amount,
            'currency' => $this->config['currency'],
            'redirect_url' => $this->config['callback_url'],
            'payment_options' => 'card,mobilemoney,ussd',
            'customer' => [
                'email' => $email
            ],
            'customizations' => [
                'title' => 'McSMS School Fees',
                'description' => 'Payment for school fees',
                'logo' => ''
            ],
            'meta' => $metadata
        ];
        
        $response = $this->makeRequest($url, 'POST', $data, [
            'Authorization: Bearer ' . $this->config['secret_key']
        ]);
        
        if ($response['status'] === 'success') {
            return [
                'success' => true,
                'authorization_url' => $response['data']['link'],
                'reference' => $reference
            ];
        }
        
        return ['success' => false, 'message' => $response['message'] ?? 'Payment initialization failed'];
    }
    
    private function verifyFlutterwave($reference)
    {
        $url = "https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref={$reference}";
        
        $response = $this->makeRequest($url, 'GET', null, [
            'Authorization: Bearer ' . $this->config['secret_key']
        ]);
        
        if ($response['status'] === 'success' && $response['data']['status'] === 'successful') {
            return [
                'success' => true,
                'amount' => $response['data']['amount'],
                'reference' => $response['data']['tx_ref'],
                'paid_at' => $response['data']['created_at'],
                'channel' => $response['data']['payment_type'],
                'customer' => $response['data']['customer']
            ];
        }
        
        return ['success' => false, 'message' => 'Payment verification failed'];
    }
    
    // ============================================
    // HUBTEL INTEGRATION (Ghana-specific)
    // ============================================
    
    private function initializeHubtel($amount, $email, $reference, $metadata)
    {
        $url = 'https://api.hubtel.com/v1/merchantaccount/onlinecheckout/invoice/create';
        
        $data = [
            'invoice' => [
                'totalAmount' => $amount,
                'description' => 'School Fees Payment',
                'callbackUrl' => $this->config['callback_url'],
                'returnUrl' => $this->config['callback_url'],
                'cancellationUrl' => $this->config['callback_url'],
                'merchantAccountNumber' => $this->config['merchant_account'],
                'clientReference' => $reference
            ],
            'store' => [
                'name' => 'McSMS School',
                'tagline' => 'Quality Education',
                'logoUrl' => ''
            ]
        ];
        
        $response = $this->makeRequest($url, 'POST', $data, [
            'Authorization: Basic ' . base64_encode($this->config['client_id'] . ':' . $this->config['client_secret'])
        ]);
        
        if (isset($response['responseCode']) && $response['responseCode'] === '0000') {
            return [
                'success' => true,
                'authorization_url' => $response['data']['checkoutUrl'],
                'reference' => $reference,
                'token' => $response['data']['token']
            ];
        }
        
        return ['success' => false, 'message' => $response['message'] ?? 'Payment initialization failed'];
    }
    
    private function verifyHubtel($reference)
    {
        $url = "https://api.hubtel.com/v1/merchantaccount/onlinecheckout/invoice/status/{$reference}";
        
        $response = $this->makeRequest($url, 'GET', null, [
            'Authorization: Basic ' . base64_encode($this->config['client_id'] . ':' . $this->config['client_secret'])
        ]);
        
        if ($response['status'] === 'completed') {
            return [
                'success' => true,
                'amount' => $response['amountPaid'],
                'reference' => $reference,
                'paid_at' => $response['paidAt'],
                'channel' => $response['paymentMethod']
            ];
        }
        
        return ['success' => false, 'message' => 'Payment verification failed'];
    }
    
    private function hubtelMobileMoney($phone, $amount, $network, $reference)
    {
        $url = 'https://api.hubtel.com/v1/merchantaccount/merchants/' . $this->config['merchant_account'] . '/receive/mobilemoney';
        
        $networkMap = [
            'mtn' => 'mtn-gh',
            'vodafone' => 'vodafone-gh',
            'tigo' => 'tigo-gh',
            'airtel' => 'airtel-gh'
        ];
        
        $data = [
            'CustomerName' => 'Customer',
            'CustomerMsisdn' => $phone,
            'CustomerEmail' => 'customer@example.com',
            'Channel' => $networkMap[$network] ?? 'mtn-gh',
            'Amount' => $amount,
            'PrimaryCallbackUrl' => $this->config['callback_url'],
            'Description' => 'School Fees Payment',
            'ClientReference' => $reference
        ];
        
        $response = $this->makeRequest($url, 'POST', $data, [
            'Authorization: Basic ' . base64_encode($this->config['client_id'] . ':' . $this->config['client_secret'])
        ]);
        
        return [
            'success' => isset($response['ResponseCode']) && $response['ResponseCode'] === '0000',
            'data' => $response,
            'message' => $response['Data'] ?? 'Mobile money charge initiated'
        ];
    }
    
    // ============================================
    // HELPER METHODS
    // ============================================
    
    private function makeRequest($url, $method, $data = null, $headers = [])
    {
        $ch = curl_init($url);
        
        $defaultHeaders = [
            'Content-Type: application/json',
            'Accept: application/json'
        ];
        
        $headers = array_merge($defaultHeaders, $headers);
        
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return json_decode($response, true) ?? [];
    }
    
    /**
     * Generate unique payment reference
     */
    public static function generateReference($prefix = 'PAY')
    {
        return $prefix . '-' . time() . '-' . rand(1000, 9999);
    }
    
    /**
     * Get supported payment methods
     */
    public function getSupportedMethods()
    {
        $methods = [
            'card' => 'Credit/Debit Card',
            'bank_transfer' => 'Bank Transfer'
        ];
        
        if (in_array($this->provider, ['paystack', 'hubtel'])) {
            $methods['mobile_money'] = 'Mobile Money';
            $methods['mtn'] = 'MTN Mobile Money';
            $methods['vodafone'] = 'Vodafone Cash';
            $methods['tigo'] = 'AirtelTigo Money';
        }
        
        return $methods;
    }
    
    /**
     * Get transaction fees
     */
    public function calculateFees($amount)
    {
        // Ghana payment gateway fees (approximate)
        $fees = [
            'paystack' => $amount * 0.019, // 1.9%
            'flutterwave' => $amount * 0.019, // 1.9%
            'hubtel' => $amount * 0.02 // 2%
        ];
        
        return $fees[$this->provider] ?? 0;
    }
}
