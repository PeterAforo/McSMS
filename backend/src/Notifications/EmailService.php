<?php
namespace McSMS\Notifications;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class EmailService
{
    private $mailer;
    private $config;
    
    public function __construct($config = [])
    {
        $this->config = array_merge([
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'username' => '',
            'password' => '',
            'from_email' => 'noreply@mcsms.edu.gh',
            'from_name' => 'McSMS School',
            'encryption' => 'tls'
        ], $config);
        
        $this->mailer = new PHPMailer(true);
        $this->setupMailer();
    }
    
    private function setupMailer()
    {
        $this->mailer->isSMTP();
        $this->mailer->Host = $this->config['host'];
        $this->mailer->SMTPAuth = true;
        $this->mailer->Username = $this->config['username'];
        $this->mailer->Password = $this->config['password'];
        $this->mailer->SMTPSecure = $this->config['encryption'];
        $this->mailer->Port = $this->config['port'];
        $this->mailer->setFrom($this->config['from_email'], $this->config['from_name']);
        $this->mailer->isHTML(true);
    }
    
    /**
     * Send email
     */
    public function send($to, $subject, $body, $attachments = [])
    {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->clearAttachments();
            
            if (is_array($to)) {
                foreach ($to as $email) {
                    $this->mailer->addAddress($email);
                }
            } else {
                $this->mailer->addAddress($to);
            }
            
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $body;
            $this->mailer->AltBody = strip_tags($body);
            
            foreach ($attachments as $attachment) {
                $this->mailer->addAttachment($attachment);
            }
            
            $this->mailer->send();
            return ['success' => true, 'message' => 'Email sent successfully'];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $this->mailer->ErrorInfo];
        }
    }
    
    /**
     * Send welcome email to new user
     */
    public function sendWelcomeEmail($user)
    {
        $subject = "Welcome to {$this->config['from_name']}";
        $body = $this->getWelcomeTemplate($user);
        return $this->send($user['email'], $subject, $body);
    }
    
    /**
     * Send invoice notification
     */
    public function sendInvoiceNotification($invoice, $parentEmail)
    {
        $subject = "New Invoice - {$invoice['invoice_number']}";
        $body = $this->getInvoiceTemplate($invoice);
        return $this->send($parentEmail, $subject, $body);
    }
    
    /**
     * Send payment confirmation
     */
    public function sendPaymentConfirmation($payment, $parentEmail)
    {
        $subject = "Payment Received - Receipt #{$payment['receipt_number']}";
        $body = $this->getPaymentTemplate($payment);
        return $this->send($parentEmail, $subject, $body);
    }
    
    /**
     * Send admission application status
     */
    public function sendApplicationStatus($application, $parentEmail, $status)
    {
        $subject = "Application Status Update - {$application['application_number']}";
        $body = $this->getApplicationStatusTemplate($application, $status);
        return $this->send($parentEmail, $subject, $body);
    }
    
    /**
     * Send attendance alert
     */
    public function sendAttendanceAlert($student, $parentEmail, $date, $status)
    {
        $subject = "Attendance Alert - {$student['first_name']} {$student['last_name']}";
        $body = $this->getAttendanceAlertTemplate($student, $date, $status);
        return $this->send($parentEmail, $subject, $body);
    }
    
    /**
     * Send homework reminder
     */
    public function sendHomeworkReminder($homework, $parentEmail, $student)
    {
        $subject = "Homework Reminder - {$homework['title']}";
        $body = $this->getHomeworkReminderTemplate($homework, $student);
        return $this->send($parentEmail, $subject, $body);
    }
    
    /**
     * Send report card notification
     */
    public function sendReportCardNotification($student, $parentEmail, $term)
    {
        $subject = "Report Card Available - {$term['term_name']}";
        $body = $this->getReportCardTemplate($student, $term);
        return $this->send($parentEmail, $subject, $body);
    }
    
    /**
     * Send fee reminder
     */
    public function sendFeeReminder($invoice, $parentEmail, $daysOverdue)
    {
        $subject = "Fee Payment Reminder - {$invoice['invoice_number']}";
        $body = $this->getFeeReminderTemplate($invoice, $daysOverdue);
        return $this->send($parentEmail, $subject, $body);
    }
    
    // ============================================
    // EMAIL TEMPLATES
    // ============================================
    
    private function getWelcomeTemplate($user)
    {
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #3F51B5; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .button { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Welcome to {$this->config['from_name']}!</h1>
                </div>
                <div class='content'>
                    <h2>Hello {$user['name']},</h2>
                    <p>Thank you for registering with us. Your account has been successfully created.</p>
                    <p><strong>Your Account Details:</strong></p>
                    <ul>
                        <li>Email: {$user['email']}</li>
                        <li>User Type: {$user['user_type']}</li>
                    </ul>
                    <p>You can now log in to your account and start using our services.</p>
                    <a href='http://localhost:5173/login' class='button'>Login to Your Account</a>
                    <p>If you have any questions, please don't hesitate to contact us.</p>
                </div>
                <div class='footer'>
                    <p>&copy; 2025 {$this->config['from_name']}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
    
    private function getInvoiceTemplate($invoice)
    {
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #3F51B5; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .invoice-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #3F51B5; }
                .amount { font-size: 24px; color: #3F51B5; font-weight: bold; }
                .button { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>New Invoice</h1>
                </div>
                <div class='content'>
                    <p>Dear Parent/Guardian,</p>
                    <p>A new invoice has been generated for {$invoice['student_name']}.</p>
                    <div class='invoice-box'>
                        <p><strong>Invoice Number:</strong> {$invoice['invoice_number']}</p>
                        <p><strong>Student:</strong> {$invoice['student_name']}</p>
                        <p><strong>Class:</strong> {$invoice['class_name']}</p>
                        <p><strong>Due Date:</strong> {$invoice['due_date']}</p>
                        <p><strong>Amount Due:</strong> <span class='amount'>GHS " . number_format($invoice['balance'], 2) . "</span></p>
                    </div>
                    <p>Please make payment before the due date to avoid late fees.</p>
                    <a href='http://localhost:5173/parent/invoices' class='button'>View Invoice</a>
                </div>
                <div class='footer'>
                    <p>&copy; 2025 {$this->config['from_name']}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
    
    private function getPaymentTemplate($payment)
    {
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .receipt-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
                .amount { font-size: 24px; color: #4CAF50; font-weight: bold; }
                .button { display: inline-block; padding: 10px 20px; background: #3F51B5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>✓ Payment Received</h1>
                </div>
                <div class='content'>
                    <p>Dear Parent/Guardian,</p>
                    <p>We have successfully received your payment.</p>
                    <div class='receipt-box'>
                        <p><strong>Receipt Number:</strong> {$payment['receipt_number']}</p>
                        <p><strong>Date:</strong> {$payment['payment_date']}</p>
                        <p><strong>Student:</strong> {$payment['student_name']}</p>
                        <p><strong>Invoice:</strong> {$payment['invoice_number']}</p>
                        <p><strong>Payment Method:</strong> {$payment['payment_method']}</p>
                        <p><strong>Amount Paid:</strong> <span class='amount'>GHS " . number_format($payment['amount'], 2) . "</span></p>
                    </div>
                    <p>Thank you for your payment!</p>
                    <a href='http://localhost:5173/parent/payments' class='button'>View Receipt</a>
                </div>
                <div class='footer'>
                    <p>&copy; 2025 {$this->config['from_name']}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
    
    private function getApplicationStatusTemplate($application, $status)
    {
        $color = $status === 'approved' ? '#4CAF50' : '#F44336';
        $message = $status === 'approved' 
            ? 'Congratulations! Your application has been approved.' 
            : 'We regret to inform you that your application has been rejected.';
        
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: {$color}; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .button { display: inline-block; padding: 10px 20px; background: #3F51B5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Application Status Update</h1>
                </div>
                <div class='content'>
                    <p>Dear Parent/Guardian,</p>
                    <p>{$message}</p>
                    <p><strong>Application Number:</strong> {$application['application_number']}</p>
                    <p><strong>Student Name:</strong> {$application['first_name']} {$application['last_name']}</p>
                    <p><strong>Status:</strong> " . ucfirst($status) . "</p>
                    <a href='http://localhost:5173/parent/applications' class='button'>View Application</a>
                </div>
                <div class='footer'>
                    <p>&copy; 2025 {$this->config['from_name']}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
    
    private function getAttendanceAlertTemplate($student, $date, $status)
    {
        $color = $status === 'absent' ? '#F44336' : '#FF9800';
        
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: {$color}; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .alert-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid {$color}; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Attendance Alert</h1>
                </div>
                <div class='content'>
                    <p>Dear Parent/Guardian,</p>
                    <div class='alert-box'>
                        <p><strong>Student:</strong> {$student['first_name']} {$student['last_name']}</p>
                        <p><strong>Date:</strong> {$date}</p>
                        <p><strong>Status:</strong> " . ucfirst($status) . "</p>
                    </div>
                    <p>If this is unexpected, please contact the school immediately.</p>
                </div>
                <div class='footer'>
                    <p>&copy; 2025 {$this->config['from_name']}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
    
    private function getHomeworkReminderTemplate($homework, $student)
    {
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .homework-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #FF9800; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Homework Reminder</h1>
                </div>
                <div class='content'>
                    <p>Dear Parent/Guardian,</p>
                    <p>This is a reminder about upcoming homework for {$student['first_name']} {$student['last_name']}.</p>
                    <div class='homework-box'>
                        <p><strong>Title:</strong> {$homework['title']}</p>
                        <p><strong>Subject:</strong> {$homework['subject_name']}</p>
                        <p><strong>Due Date:</strong> {$homework['due_date']}</p>
                        <p><strong>Description:</strong> {$homework['description']}</p>
                    </div>
                    <p>Please ensure your child completes the homework before the due date.</p>
                </div>
                <div class='footer'>
                    <p>&copy; 2025 {$this->config['from_name']}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
    
    private function getReportCardTemplate($student, $term)
    {
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .button { display: inline-block; padding: 10px 20px; background: #3F51B5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Report Card Available</h1>
                </div>
                <div class='content'>
                    <p>Dear Parent/Guardian,</p>
                    <p>The report card for {$student['first_name']} {$student['last_name']} is now available.</p>
                    <p><strong>Term:</strong> {$term['term_name']}</p>
                    <p>You can view and download the report card from your parent portal.</p>
                    <a href='http://localhost:5173/parent/reports' class='button'>View Report Card</a>
                </div>
                <div class='footer'>
                    <p>&copy; 2025 {$this->config['from_name']}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
    
    private function getFeeReminderTemplate($invoice, $daysOverdue)
    {
        return "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #F44336; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f9f9f9; }
                .warning-box { background: #FFF3CD; padding: 15px; margin: 15px 0; border-left: 4px solid #F44336; }
                .amount { font-size: 24px; color: #F44336; font-weight: bold; }
                .button { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>Fee Payment Reminder</h1>
                </div>
                <div class='content'>
                    <p>Dear Parent/Guardian,</p>
                    <p>This is a reminder that the following invoice is overdue by {$daysOverdue} days.</p>
                    <div class='warning-box'>
                        <p><strong>Invoice Number:</strong> {$invoice['invoice_number']}</p>
                        <p><strong>Student:</strong> {$invoice['student_name']}</p>
                        <p><strong>Due Date:</strong> {$invoice['due_date']}</p>
                        <p><strong>Amount Due:</strong> <span class='amount'>GHS " . number_format($invoice['balance'], 2) . "</span></p>
                    </div>
                    <p>Please make payment as soon as possible to avoid additional late fees.</p>
                    <a href='http://localhost:5173/parent/invoices' class='button'>Pay Now</a>
                </div>
                <div class='footer'>
                    <p>&copy; 2025 {$this->config['from_name']}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        ";
    }
}
