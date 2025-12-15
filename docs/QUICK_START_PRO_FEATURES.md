# 🚀 Quick Start Guide - McSMS Pro Features

**Version:** 1.0  
**Last Updated:** December 3, 2025

---

## 📋 **TABLE OF CONTENTS**

1. [Setup & Installation](#setup--installation)
2. [PDF Reports](#pdf-reports)
3. [Email Notifications](#email-notifications)
4. [SMS Integration](#sms-integration)
5. [Payment Gateway](#payment-gateway)
6. [Mobile API](#mobile-api)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 **SETUP & INSTALLATION**

### **Step 1: Install Dependencies**
```bash
cd d:\xampp\htdocs\McSMS\backend
composer install
```

### **Step 2: Run Database Migrations**
Open phpMyAdmin and run:
```sql
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_mobile_support.sql;
SOURCE d:/xampp/htdocs/McSMS/database/migrations/add_timetable_tables.sql;
```

### **Step 3: Configure Services**

#### **Email Configuration:**
Edit `backend/src/Notifications/EmailService.php` line 14-20:
```php
$emailConfig = [
    'host' => 'smtp.gmail.com',
    'port' => 587,
    'username' => 'your-email@gmail.com',     // ← CHANGE THIS
    'password' => 'your-app-password',        // ← CHANGE THIS
    'from_email' => 'noreply@mcsms.edu.gh',
    'from_name' => 'McSMS School'
];
```

**Get Gmail App Password:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate App Password
4. Use that password in config

#### **SMS Configuration:**
Edit `backend/src/Notifications/SMSService.php` line 10-15:
```php
$smsConfig = [
    'provider' => 'arkesel',              // arkesel, hubtel, or twilio
    'api_key' => 'your-api-key-here',    // ← CHANGE THIS
    'sender_id' => 'McSMS'
];
```

**Get Arkesel API Key:**
1. Sign up at https://sms.arkesel.com
2. Go to Settings → API Keys
3. Copy your API key

#### **Payment Gateway Configuration:**
Edit `backend/src/Payments/PaymentGateway.php` line 11-16:
```php
$paymentConfig = [
    'provider' => 'paystack',                    // paystack, flutterwave, or hubtel
    'public_key' => 'pk_test_xxxxx',            // ← CHANGE THIS
    'secret_key' => 'sk_test_xxxxx',            // ← CHANGE THIS
    'callback_url' => 'http://localhost:5173/payment/callback'
];
```

**Get Paystack Keys:**
1. Sign up at https://paystack.com
2. Go to Settings → API Keys & Webhooks
3. Copy Test keys (use Live keys in production)

---

## 📄 **PDF REPORTS**

### **Generate Report Card**
```javascript
import pdfService from '@/services/pdfService';

// Download report card
await pdfService.downloadReportCard(studentId, termId);

// View in browser
pdfService.viewReportCard(studentId, termId);
```

### **Generate Invoice PDF**
```javascript
// Download invoice
await pdfService.downloadInvoice(invoiceId);

// View in browser
pdfService.viewInvoice(invoiceId);
```

### **Generate Receipt**
```javascript
// Download receipt
await pdfService.downloadReceipt(paymentId);

// View in browser
pdfService.viewReceipt(paymentId);
```

### **Direct API Access**
```
GET http://localhost/McSMS/backend/api/pdf_reports.php?type=invoice&id=1&action=view
GET http://localhost/McSMS/backend/api/pdf_reports.php?type=receipt&id=1&action=download
GET http://localhost/McSMS/backend/api/pdf_reports.php?type=report_card&id=1&term_id=1&action=view
```

---

## 📧 **EMAIL NOTIFICATIONS**

### **Send Invoice Notification**
```bash
POST http://localhost/McSMS/backend/api/notifications.php?action=send_invoice_notification
Content-Type: application/json

{
  "invoice_id": 1
}
```

### **Send Payment Confirmation**
```bash
POST http://localhost/McSMS/backend/api/notifications.php?action=send_payment_confirmation
Content-Type: application/json

{
  "payment_id": 1
}
```

### **Send Application Status**
```bash
POST http://localhost/McSMS/backend/api/notifications.php?action=send_application_status
Content-Type: application/json

{
  "application_id": 1,
  "status": "approved"
}
```

### **Send Bulk Fee Reminders**
```bash
POST http://localhost/McSMS/backend/api/notifications.php?action=send_bulk_reminders
```

### **Available Email Types:**
- `send_invoice_notification` - New invoice alert
- `send_payment_confirmation` - Payment received
- `send_application_status` - Application approved/rejected
- `send_attendance_alert` - Student absent/late
- `send_homework_reminder` - Homework due soon
- `send_report_card_notification` - Report card ready
- `send_fee_reminder` - Overdue fee reminder
- `send_bulk_reminders` - All overdue invoices

---

## 📱 **SMS INTEGRATION**

### **Send Single SMS**
```bash
POST http://localhost/McSMS/backend/api/notifications.php?action=send_sms
Content-Type: application/json

{
  "phone": "+233XXXXXXXXX",
  "message": "Your message here"
}
```

### **Send Bulk SMS**
```bash
POST http://localhost/McSMS/backend/api/notifications.php?action=send_bulk_sms
Content-Type: application/json

{
  "recipients": ["+233XXXXXXXXX", "+233YYYYYYYYY"],
  "message": "Bulk message here"
}
```

### **Send Payment SMS**
```bash
POST http://localhost/McSMS/backend/api/notifications.php?action=send_payment_sms
Content-Type: application/json

{
  "payment_id": 1
}
```

### **Send Invoice SMS**
```bash
POST http://localhost/McSMS/backend/api/notifications.php?action=send_invoice_sms
Content-Type: application/json

{
  "invoice_id": 1
}
```

### **Check SMS Balance**
```bash
GET http://localhost/McSMS/backend/api/notifications.php?action=get_sms_balance
```

---

## 💳 **PAYMENT GATEWAY**

### **Initialize Payment (PHP)**
```php
require_once 'backend/src/Payments/PaymentGateway.php';

use McSMS\Payments\PaymentGateway;

$gateway = new PaymentGateway([
    'provider' => 'paystack',
    'public_key' => 'pk_test_xxx',
    'secret_key' => 'sk_test_xxx'
]);

// Initialize payment
$result = $gateway->initializePayment(
    100.00,                    // amount
    'parent@example.com',      // email
    'PAY-' . time(),          // reference
    ['invoice_id' => 1]       // metadata
);

if ($result['success']) {
    // Redirect to: $result['authorization_url']
    header('Location: ' . $result['authorization_url']);
}
```

### **Verify Payment**
```php
$reference = $_GET['reference'];
$result = $gateway->verifyPayment($reference);

if ($result['success']) {
    // Payment successful
    $amount = $result['amount'];
    $paidAt = $result['paid_at'];
    
    // Update invoice, send receipt, etc.
}
```

### **Mobile Money Payment**
```php
$result = $gateway->processMobileMoney(
    '+233XXXXXXXXX',  // phone
    100.00,           // amount
    'mtn',            // network: mtn, vodafone, tigo
    'PAY-' . time()   // reference
);
```

### **Supported Networks:**
- `mtn` - MTN Mobile Money
- `vodafone` - Vodafone Cash
- `tigo` - AirtelTigo Money

---

## 📱 **MOBILE API**

### **Authentication**

#### **Login**
```bash
POST http://localhost/McSMS/backend/api/mobile/v1/auth.php?action=login
Content-Type: application/json

{
  "email": "parent@example.com",
  "password": "password123",
  "device_id": "unique-device-id"
}

Response:
{
  "success": true,
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {...},
  "expires_at": "2025-01-02 20:00:00"
}
```

#### **Register**
```bash
POST http://localhost/McSMS/backend/api/mobile/v1/auth.php?action=register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+233XXXXXXXXX",
  "user_type": "parent"
}
```

#### **Refresh Token**
```bash
POST http://localhost/McSMS/backend/api/mobile/v1/auth.php?action=refresh
Content-Type: application/json

{
  "token": "old-token-here"
}
```

### **Parent Endpoints**

#### **Get Dashboard**
```bash
GET http://localhost/McSMS/backend/api/mobile/v1/parent.php?action=dashboard
Authorization: Bearer {token}

Response:
{
  "success": true,
  "dashboard": {
    "total_children": 2,
    "pending_applications": 1,
    "outstanding_fees": 500.00,
    "recent_notifications": [...]
  }
}
```

#### **Get Children**
```bash
GET http://localhost/McSMS/backend/api/mobile/v1/parent.php?action=children
Authorization: Bearer {token}
```

#### **Get Child Details**
```bash
GET http://localhost/McSMS/backend/api/mobile/v1/parent.php?action=child_details&student_id=1
Authorization: Bearer {token}
```

#### **Get Invoices**
```bash
GET http://localhost/McSMS/backend/api/mobile/v1/parent.php?action=invoices
Authorization: Bearer {token}
```

#### **Submit Application**
```bash
POST http://localhost/McSMS/backend/api/mobile/v1/parent.php?action=submit_application
Authorization: Bearer {token}
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Doe",
  "date_of_birth": "2015-05-15",
  "gender": "female",
  "class_applying_for": "Class 1"
}
```

#### **Get Notifications**
```bash
GET http://localhost/McSMS/backend/api/mobile/v1/parent.php?action=notifications&limit=20&offset=0
Authorization: Bearer {token}
```

---

## 🔍 **TROUBLESHOOTING**

### **PDF Generation Issues**

**Problem:** PDF not generating
```bash
# Check if DOMPDF is installed
cd backend
composer show dompdf/dompdf

# Reinstall if needed
composer require dompdf/dompdf
```

**Problem:** Fonts not loading
- Check file permissions on `backend/vendor/dompdf/dompdf/lib/fonts/`
- Ensure write permissions for font cache

### **Email Issues**

**Problem:** Emails not sending
1. Check SMTP credentials
2. Enable "Less secure app access" in Gmail (or use App Password)
3. Check firewall/antivirus blocking port 587
4. Test with a simple script:
```php
$mail = new PHPMailer\PHPMailer\PHPMailer(true);
$mail->SMTPDebug = 2; // Enable verbose debug output
// ... rest of config
```

**Problem:** Emails going to spam
- Set up SPF, DKIM, and DMARC records
- Use a verified domain email
- Avoid spam trigger words

### **SMS Issues**

**Problem:** SMS not sending
1. Check API key is correct
2. Verify SMS balance
3. Check phone number format (+233XXXXXXXXX)
4. Test with provider's dashboard

**Problem:** Invalid phone number
- Ensure format: +233XXXXXXXXX (Ghana)
- Remove spaces and special characters
- Use international format

### **Payment Gateway Issues**

**Problem:** Payment initialization fails
1. Check API keys (public and secret)
2. Verify callback URL is accessible
3. Check if in test mode
4. Review provider's error logs

**Problem:** Payment verification fails
- Ensure callback URL is correct
- Check webhook configuration
- Verify reference format
- Review transaction logs

### **Mobile API Issues**

**Problem:** Token invalid/expired
- Tokens expire after 30 days
- Use refresh endpoint to get new token
- Check system time is synchronized

**Problem:** CORS errors
- Verify CORS headers in API files
- Check origin is allowed
- Test with Postman first

---

## 📞 **SUPPORT**

### **Documentation:**
- Full documentation: `/docs/FINAL_BUILD_STATUS.md`
- API reference: This file
- Progress report: `/docs/PRO_FEATURES_IMPLEMENTATION_PROGRESS.md`

### **External Resources:**
- **DOMPDF:** https://github.com/dompdf/dompdf
- **PHPMailer:** https://github.com/PHPMailer/PHPMailer
- **Paystack:** https://paystack.com/docs
- **Arkesel:** https://developers.arkesel.com
- **Hubtel:** https://developers.hubtel.com

### **Common Commands:**
```bash
# Check Composer packages
composer show

# Update dependencies
composer update

# Clear cache
php -r "opcache_reset();"

# Check PHP version
php -v

# Test database connection
php -r "new PDO('mysql:host=localhost;dbname=school_management_system', 'root', '');"
```

---

## ✅ **TESTING CHECKLIST**

- [ ] PDF reports generate correctly
- [ ] Emails send successfully
- [ ] SMS messages deliver
- [ ] Payments initialize
- [ ] Payments verify
- [ ] Mobile API login works
- [ ] Mobile API endpoints respond
- [ ] Notifications appear
- [ ] All configurations set
- [ ] Database migrations run
- [ ] Dependencies installed

---

**Last Updated:** December 3, 2025  
**Version:** 1.0  
**Status:** Production Ready ✅
