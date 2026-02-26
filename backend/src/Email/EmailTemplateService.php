<?php
/**
 * Email Template Service
 * Manages customizable email templates with variable substitution
 */

namespace McSMS\Email;

require_once __DIR__ . '/../../config/env.php';

class EmailTemplateService {
    
    private $pdo;
    private $templatesDir;
    
    // Template categories
    const CATEGORY_AUTH = 'auth';
    const CATEGORY_NOTIFICATION = 'notification';
    const CATEGORY_FINANCE = 'finance';
    const CATEGORY_ACADEMIC = 'academic';
    const CATEGORY_SYSTEM = 'system';
    
    // Default templates
    private $defaultTemplates = [
        'welcome' => [
            'name' => 'Welcome Email',
            'category' => self::CATEGORY_AUTH,
            'subject' => 'Welcome to {{school_name}}!',
            'description' => 'Sent to new users upon registration',
        ],
        'password_reset' => [
            'name' => 'Password Reset',
            'category' => self::CATEGORY_AUTH,
            'subject' => 'Reset Your Password - {{school_name}}',
            'description' => 'Sent when user requests password reset',
        ],
        'account_activation' => [
            'name' => 'Account Activation',
            'category' => self::CATEGORY_AUTH,
            'subject' => 'Activate Your Account - {{school_name}}',
            'description' => 'Sent to verify email address',
        ],
        'login_alert' => [
            'name' => 'Login Alert',
            'category' => self::CATEGORY_AUTH,
            'subject' => 'New Login Detected - {{school_name}}',
            'description' => 'Sent when login from new device',
        ],
        'fee_reminder' => [
            'name' => 'Fee Payment Reminder',
            'category' => self::CATEGORY_FINANCE,
            'subject' => 'Fee Payment Reminder - {{student_name}}',
            'description' => 'Sent to remind about pending fees',
        ],
        'payment_receipt' => [
            'name' => 'Payment Receipt',
            'category' => self::CATEGORY_FINANCE,
            'subject' => 'Payment Confirmation - Receipt #{{receipt_number}}',
            'description' => 'Sent after successful payment',
        ],
        'invoice' => [
            'name' => 'Invoice',
            'category' => self::CATEGORY_FINANCE,
            'subject' => 'Invoice #{{invoice_number}} - {{school_name}}',
            'description' => 'Sent with invoice details',
        ],
        'grade_published' => [
            'name' => 'Grades Published',
            'category' => self::CATEGORY_ACADEMIC,
            'subject' => 'New Grades Available - {{student_name}}',
            'description' => 'Sent when grades are published',
        ],
        'attendance_alert' => [
            'name' => 'Attendance Alert',
            'category' => self::CATEGORY_ACADEMIC,
            'subject' => 'Attendance Alert - {{student_name}}',
            'description' => 'Sent for attendance issues',
        ],
        'exam_schedule' => [
            'name' => 'Exam Schedule',
            'category' => self::CATEGORY_ACADEMIC,
            'subject' => 'Upcoming Exams - {{class_name}}',
            'description' => 'Sent with exam schedule',
        ],
        'assignment_due' => [
            'name' => 'Assignment Due',
            'category' => self::CATEGORY_ACADEMIC,
            'subject' => 'Assignment Due Soon - {{subject_name}}',
            'description' => 'Reminder for upcoming assignments',
        ],
        'general_notification' => [
            'name' => 'General Notification',
            'category' => self::CATEGORY_NOTIFICATION,
            'subject' => '{{notification_title}} - {{school_name}}',
            'description' => 'General notification template',
        ],
        'announcement' => [
            'name' => 'School Announcement',
            'category' => self::CATEGORY_NOTIFICATION,
            'subject' => 'Announcement: {{announcement_title}}',
            'description' => 'School-wide announcements',
        ],
        'event_reminder' => [
            'name' => 'Event Reminder',
            'category' => self::CATEGORY_NOTIFICATION,
            'subject' => 'Upcoming Event: {{event_name}}',
            'description' => 'Reminder for school events',
        ],
        'system_alert' => [
            'name' => 'System Alert',
            'category' => self::CATEGORY_SYSTEM,
            'subject' => 'System Alert - {{school_name}}',
            'description' => 'System notifications for admins',
        ],
        'backup_complete' => [
            'name' => 'Backup Complete',
            'category' => self::CATEGORY_SYSTEM,
            'subject' => 'Database Backup Complete - {{backup_date}}',
            'description' => 'Sent after successful backup',
        ],
    ];
    
    public function __construct() {
        $this->templatesDir = __DIR__ . '/../../templates/email';
        
        if (!is_dir($this->templatesDir)) {
            mkdir($this->templatesDir, 0755, true);
        }
        
        $this->connect();
        $this->ensureTableExists();
    }
    
    /**
     * Connect to database
     */
    private function connect() {
        $host = \Env::get('DB_HOST', 'localhost');
        $database = \Env::get('DB_NAME', 'school_management_system');
        $username = \Env::get('DB_USER', 'root');
        $password = \Env::get('DB_PASS', '');
        
        try {
            $this->pdo = new \PDO(
                "mysql:host={$host};dbname={$database};charset=utf8mb4",
                $username,
                $password,
                [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
            );
        } catch (\PDOException $e) {
            throw new \Exception("Database connection failed: " . $e->getMessage());
        }
    }
    
    /**
     * Ensure email_templates table exists
     */
    private function ensureTableExists() {
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS email_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                slug VARCHAR(100) NOT NULL UNIQUE,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(50) NOT NULL,
                subject VARCHAR(500) NOT NULL,
                body_html TEXT NOT NULL,
                body_text TEXT,
                description TEXT,
                variables JSON,
                is_active TINYINT(1) DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_category (category),
                INDEX idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
    }
    
    /**
     * Initialize default templates
     */
    public function initializeDefaults() {
        foreach ($this->defaultTemplates as $slug => $template) {
            if (!$this->templateExists($slug)) {
                $this->createTemplate($slug, $template);
            }
        }
        
        return count($this->defaultTemplates);
    }
    
    /**
     * Check if template exists
     */
    public function templateExists($slug) {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM email_templates WHERE slug = ?");
        $stmt->execute([$slug]);
        return (int) $stmt->fetchColumn() > 0;
    }
    
    /**
     * Create a template
     */
    public function createTemplate($slug, $data) {
        $bodyHtml = $data['body_html'] ?? $this->getDefaultBody($slug);
        $bodyText = $data['body_text'] ?? strip_tags($bodyHtml);
        $variables = $data['variables'] ?? $this->extractVariables($bodyHtml . ' ' . ($data['subject'] ?? ''));
        
        $stmt = $this->pdo->prepare("
            INSERT INTO email_templates (slug, name, category, subject, body_html, body_text, description, variables)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $slug,
            $data['name'],
            $data['category'],
            $data['subject'],
            $bodyHtml,
            $bodyText,
            $data['description'] ?? null,
            json_encode($variables),
        ]);
        
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Get template by slug
     */
    public function getTemplate($slug) {
        $stmt = $this->pdo->prepare("SELECT * FROM email_templates WHERE slug = ?");
        $stmt->execute([$slug]);
        $template = $stmt->fetch(\PDO::FETCH_ASSOC);
        
        if ($template) {
            $template['variables'] = json_decode($template['variables'], true) ?: [];
        }
        
        return $template;
    }
    
    /**
     * Get all templates
     */
    public function getAllTemplates($category = null, $activeOnly = true) {
        $where = [];
        $params = [];
        
        if ($category) {
            $where[] = 'category = ?';
            $params[] = $category;
        }
        
        if ($activeOnly) {
            $where[] = 'is_active = 1';
        }
        
        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';
        
        $stmt = $this->pdo->prepare("
            SELECT * FROM email_templates 
            {$whereClause}
            ORDER BY category, name
        ");
        $stmt->execute($params);
        $templates = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        foreach ($templates as &$template) {
            $template['variables'] = json_decode($template['variables'], true) ?: [];
        }
        
        return $templates;
    }
    
    /**
     * Update template
     */
    public function updateTemplate($slug, $data) {
        $fields = [];
        $params = [];
        
        $allowedFields = ['name', 'subject', 'body_html', 'body_text', 'description', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            return false;
        }
        
        // Update variables if body changed
        if (isset($data['body_html']) || isset($data['subject'])) {
            $template = $this->getTemplate($slug);
            $content = ($data['body_html'] ?? $template['body_html']) . ' ' . ($data['subject'] ?? $template['subject']);
            $variables = $this->extractVariables($content);
            $fields[] = 'variables = ?';
            $params[] = json_encode($variables);
        }
        
        $params[] = $slug;
        
        $stmt = $this->pdo->prepare("
            UPDATE email_templates 
            SET " . implode(', ', $fields) . "
            WHERE slug = ?
        ");
        
        return $stmt->execute($params);
    }
    
    /**
     * Delete template
     */
    public function deleteTemplate($slug) {
        // Don't delete default templates, just deactivate
        if (isset($this->defaultTemplates[$slug])) {
            return $this->updateTemplate($slug, ['is_active' => 0]);
        }
        
        $stmt = $this->pdo->prepare("DELETE FROM email_templates WHERE slug = ?");
        return $stmt->execute([$slug]);
    }
    
    /**
     * Render template with variables
     */
    public function render($slug, $variables = []) {
        $template = $this->getTemplate($slug);
        
        if (!$template) {
            throw new \Exception("Template not found: {$slug}");
        }
        
        // Add default variables
        $variables = array_merge($this->getDefaultVariables(), $variables);
        
        // Render subject
        $subject = $this->substituteVariables($template['subject'], $variables);
        
        // Render HTML body
        $bodyHtml = $this->substituteVariables($template['body_html'], $variables);
        
        // Wrap in base layout
        $bodyHtml = $this->wrapInLayout($bodyHtml, $variables);
        
        // Render text body
        $bodyText = $this->substituteVariables($template['body_text'] ?? strip_tags($template['body_html']), $variables);
        
        return [
            'subject' => $subject,
            'body_html' => $bodyHtml,
            'body_text' => $bodyText,
        ];
    }
    
    /**
     * Substitute variables in content
     */
    private function substituteVariables($content, $variables) {
        foreach ($variables as $key => $value) {
            if (is_array($value)) {
                continue; // Skip arrays
            }
            $content = str_replace('{{' . $key . '}}', $value, $content);
        }
        
        // Remove any remaining unsubstituted variables
        $content = preg_replace('/\{\{[^}]+\}\}/', '', $content);
        
        return $content;
    }
    
    /**
     * Extract variables from content
     */
    private function extractVariables($content) {
        preg_match_all('/\{\{([^}]+)\}\}/', $content, $matches);
        return array_unique($matches[1] ?? []);
    }
    
    /**
     * Get default variables
     */
    private function getDefaultVariables() {
        return [
            'school_name' => \Env::get('SCHOOL_NAME', 'McSMS School'),
            'school_email' => \Env::get('SCHOOL_EMAIL', 'info@school.com'),
            'school_phone' => \Env::get('SCHOOL_PHONE', ''),
            'school_address' => \Env::get('SCHOOL_ADDRESS', ''),
            'school_website' => \Env::get('APP_URL', 'http://localhost'),
            'current_year' => date('Y'),
            'current_date' => date('F j, Y'),
        ];
    }
    
    /**
     * Wrap content in base email layout
     */
    private function wrapInLayout($content, $variables) {
        $schoolName = $variables['school_name'] ?? 'School';
        $schoolEmail = $variables['school_email'] ?? '';
        $year = date('Y');
        
        return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$schoolName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .email-header h1 {
            margin: 0;
            font-size: 24px;
        }
        .email-body {
            background: white;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .email-footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white !important;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 0;
        }
        .button:hover {
            background: #5a6fd6;
        }
        .info-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 15px 0;
        }
        .warning-box {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 15px 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        th {
            background: #f8f9fa;
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="email-header">
            <h1>{$schoolName}</h1>
        </div>
        <div class="email-body">
            {$content}
        </div>
        <div class="email-footer">
            <p>&copy; {$year} {$schoolName}. All rights reserved.</p>
            <p>
                <a href="mailto:{$schoolEmail}">{$schoolEmail}</a>
            </p>
            <p style="color: #999; font-size: 11px;">
                This email was sent by {$schoolName}. If you received this email in error, please ignore it.
            </p>
        </div>
    </div>
</body>
</html>
HTML;
    }
    
    /**
     * Get default body for a template
     */
    private function getDefaultBody($slug) {
        $bodies = [
            'welcome' => <<<HTML
<h2>Welcome, {{user_name}}!</h2>
<p>We're excited to have you join {{school_name}}. Your account has been created successfully.</p>
<div class="info-box">
    <strong>Your Login Details:</strong><br>
    Email: {{user_email}}<br>
    Role: {{user_role}}
</div>
<p>To get started, click the button below to access your dashboard:</p>
<p style="text-align: center;">
    <a href="{{login_url}}" class="button">Go to Dashboard</a>
</p>
<p>If you have any questions, feel free to contact us.</p>
<p>Best regards,<br>{{school_name}} Team</p>
HTML,
            'password_reset' => <<<HTML
<h2>Password Reset Request</h2>
<p>Hello {{user_name}},</p>
<p>We received a request to reset your password. Click the button below to create a new password:</p>
<p style="text-align: center;">
    <a href="{{reset_url}}" class="button">Reset Password</a>
</p>
<div class="warning-box">
    <strong>Important:</strong> This link will expire in {{expiry_hours}} hours.
</div>
<p>If you didn't request this password reset, you can safely ignore this email.</p>
<p>Best regards,<br>{{school_name}} Team</p>
HTML,
            'account_activation' => <<<HTML
<h2>Activate Your Account</h2>
<p>Hello {{user_name}},</p>
<p>Thank you for registering with {{school_name}}. Please click the button below to verify your email address and activate your account:</p>
<p style="text-align: center;">
    <a href="{{activation_url}}" class="button">Activate Account</a>
</p>
<p>If you didn't create this account, please ignore this email.</p>
<p>Best regards,<br>{{school_name}} Team</p>
HTML,
            'login_alert' => <<<HTML
<h2>New Login Detected</h2>
<p>Hello {{user_name}},</p>
<p>We detected a new login to your account:</p>
<div class="info-box">
    <strong>Login Details:</strong><br>
    Time: {{login_time}}<br>
    IP Address: {{ip_address}}<br>
    Device: {{device_info}}
</div>
<p>If this was you, no action is needed. If you don't recognize this activity, please change your password immediately.</p>
<p>Best regards,<br>{{school_name}} Security Team</p>
HTML,
            'fee_reminder' => <<<HTML
<h2>Fee Payment Reminder</h2>
<p>Dear {{parent_name}},</p>
<p>This is a friendly reminder that the following fees are due for {{student_name}}:</p>
<table>
    <tr>
        <th>Description</th>
        <th>Amount</th>
        <th>Due Date</th>
    </tr>
    <tr>
        <td>{{fee_description}}</td>
        <td>{{fee_amount}}</td>
        <td>{{due_date}}</td>
    </tr>
</table>
<p>Total Outstanding: <strong>{{total_amount}}</strong></p>
<p style="text-align: center;">
    <a href="{{payment_url}}" class="button">Pay Now</a>
</p>
<p>If you have already made this payment, please disregard this notice.</p>
<p>Best regards,<br>{{school_name}} Finance Department</p>
HTML,
            'payment_receipt' => <<<HTML
<h2>Payment Confirmation</h2>
<p>Dear {{parent_name}},</p>
<p>Thank you for your payment. Here are the details:</p>
<div class="info-box">
    <strong>Receipt #{{receipt_number}}</strong><br>
    Student: {{student_name}}<br>
    Amount: {{payment_amount}}<br>
    Date: {{payment_date}}<br>
    Method: {{payment_method}}
</div>
<p>Description: {{payment_description}}</p>
<p>Thank you for your prompt payment.</p>
<p>Best regards,<br>{{school_name}} Finance Department</p>
HTML,
            'invoice' => <<<HTML
<h2>Invoice #{{invoice_number}}</h2>
<p>Dear {{parent_name}},</p>
<p>Please find below the invoice for {{student_name}}:</p>
<table>
    <tr>
        <th>Description</th>
        <th>Amount</th>
    </tr>
    {{invoice_items}}
    <tr>
        <td><strong>Total</strong></td>
        <td><strong>{{total_amount}}</strong></td>
    </tr>
</table>
<p>Due Date: {{due_date}}</p>
<p style="text-align: center;">
    <a href="{{payment_url}}" class="button">Pay Invoice</a>
</p>
<p>Best regards,<br>{{school_name}} Finance Department</p>
HTML,
            'grade_published' => <<<HTML
<h2>New Grades Available</h2>
<p>Dear {{parent_name}},</p>
<p>New grades have been published for {{student_name}}:</p>
<div class="info-box">
    <strong>{{exam_name}}</strong><br>
    Class: {{class_name}}<br>
    Term: {{term_name}}
</div>
<p style="text-align: center;">
    <a href="{{grades_url}}" class="button">View Grades</a>
</p>
<p>Best regards,<br>{{school_name}}</p>
HTML,
            'attendance_alert' => <<<HTML
<h2>Attendance Alert</h2>
<p>Dear {{parent_name}},</p>
<p>This is to inform you about {{student_name}}'s attendance:</p>
<div class="warning-box">
    <strong>{{alert_type}}</strong><br>
    Date: {{attendance_date}}<br>
    Status: {{attendance_status}}
</div>
<p>{{alert_message}}</p>
<p>If you have any questions, please contact the school.</p>
<p>Best regards,<br>{{school_name}}</p>
HTML,
            'exam_schedule' => <<<HTML
<h2>Upcoming Examinations</h2>
<p>Dear {{parent_name}},</p>
<p>Please find below the exam schedule for {{class_name}}:</p>
<table>
    <tr>
        <th>Subject</th>
        <th>Date</th>
        <th>Time</th>
    </tr>
    {{exam_schedule}}
</table>
<p>Please ensure {{student_name}} is well-prepared for the examinations.</p>
<p>Best regards,<br>{{school_name}}</p>
HTML,
            'assignment_due' => <<<HTML
<h2>Assignment Reminder</h2>
<p>Dear {{student_name}},</p>
<p>This is a reminder that the following assignment is due soon:</p>
<div class="info-box">
    <strong>{{assignment_title}}</strong><br>
    Subject: {{subject_name}}<br>
    Due Date: {{due_date}}
</div>
<p>{{assignment_description}}</p>
<p style="text-align: center;">
    <a href="{{assignment_url}}" class="button">View Assignment</a>
</p>
<p>Best regards,<br>{{teacher_name}}</p>
HTML,
            'general_notification' => <<<HTML
<h2>{{notification_title}}</h2>
<p>Dear {{recipient_name}},</p>
<p>{{notification_message}}</p>
<p>Best regards,<br>{{school_name}}</p>
HTML,
            'announcement' => <<<HTML
<h2>{{announcement_title}}</h2>
<p>Dear {{recipient_name}},</p>
<p>{{announcement_content}}</p>
<p>Best regards,<br>{{school_name}}</p>
HTML,
            'event_reminder' => <<<HTML
<h2>Upcoming Event: {{event_name}}</h2>
<p>Dear {{recipient_name}},</p>
<p>This is a reminder about the upcoming event:</p>
<div class="info-box">
    <strong>{{event_name}}</strong><br>
    Date: {{event_date}}<br>
    Time: {{event_time}}<br>
    Location: {{event_location}}
</div>
<p>{{event_description}}</p>
<p>We look forward to seeing you there!</p>
<p>Best regards,<br>{{school_name}}</p>
HTML,
            'system_alert' => <<<HTML
<h2>System Alert</h2>
<p>Hello Administrator,</p>
<div class="warning-box">
    <strong>{{alert_type}}</strong><br>
    {{alert_message}}
</div>
<p>Time: {{alert_time}}</p>
<p>Please take appropriate action if required.</p>
<p>Best regards,<br>{{school_name}} System</p>
HTML,
            'backup_complete' => <<<HTML
<h2>Database Backup Complete</h2>
<p>Hello Administrator,</p>
<p>A database backup has been completed successfully:</p>
<div class="info-box">
    <strong>Backup Details:</strong><br>
    Date: {{backup_date}}<br>
    Size: {{backup_size}}<br>
    Tables: {{table_count}}<br>
    Filename: {{backup_filename}}
</div>
<p>The backup has been stored securely.</p>
<p>Best regards,<br>{{school_name}} System</p>
HTML,
        ];
        
        return $bodies[$slug] ?? '<p>{{content}}</p>';
    }
    
    /**
     * Preview template with sample data
     */
    public function preview($slug) {
        $sampleData = [
            'user_name' => 'John Doe',
            'user_email' => 'john@example.com',
            'user_role' => 'Parent',
            'student_name' => 'Jane Doe',
            'parent_name' => 'John Doe',
            'class_name' => 'Grade 5A',
            'subject_name' => 'Mathematics',
            'teacher_name' => 'Mr. Smith',
            'login_url' => '#',
            'reset_url' => '#',
            'activation_url' => '#',
            'payment_url' => '#',
            'grades_url' => '#',
            'assignment_url' => '#',
            'login_time' => date('F j, Y g:i A'),
            'ip_address' => '192.168.1.1',
            'device_info' => 'Chrome on Windows',
            'expiry_hours' => '24',
            'fee_description' => 'Tuition Fee - Term 1',
            'fee_amount' => '$500.00',
            'due_date' => date('F j, Y', strtotime('+7 days')),
            'total_amount' => '$500.00',
            'receipt_number' => 'RCP-001234',
            'payment_amount' => '$500.00',
            'payment_date' => date('F j, Y'),
            'payment_method' => 'Credit Card',
            'payment_description' => 'Tuition Fee Payment',
            'invoice_number' => 'INV-001234',
            'invoice_items' => '<tr><td>Tuition Fee</td><td>$500.00</td></tr>',
            'exam_name' => 'Mid-Term Examination',
            'term_name' => 'Term 1',
            'alert_type' => 'Absence',
            'attendance_date' => date('F j, Y'),
            'attendance_status' => 'Absent',
            'alert_message' => 'Student was absent without prior notice.',
            'exam_schedule' => '<tr><td>Math</td><td>Jan 15</td><td>9:00 AM</td></tr>',
            'assignment_title' => 'Chapter 5 Exercises',
            'assignment_description' => 'Complete exercises 1-10 from Chapter 5.',
            'notification_title' => 'Important Notice',
            'notification_message' => 'This is a sample notification message.',
            'recipient_name' => 'John Doe',
            'announcement_title' => 'School Holiday',
            'announcement_content' => 'School will be closed on Monday for the public holiday.',
            'event_name' => 'Annual Sports Day',
            'event_date' => date('F j, Y', strtotime('+14 days')),
            'event_time' => '9:00 AM - 4:00 PM',
            'event_location' => 'School Sports Ground',
            'event_description' => 'Join us for our annual sports day celebration!',
            'alert_time' => date('F j, Y g:i A'),
            'backup_date' => date('F j, Y g:i A'),
            'backup_size' => '15.5 MB',
            'table_count' => '45',
            'backup_filename' => 'backup_2026-02-26.sql.gz',
        ];
        
        return $this->render($slug, $sampleData);
    }
    
    /**
     * Get available categories
     */
    public function getCategories() {
        return [
            self::CATEGORY_AUTH => 'Authentication',
            self::CATEGORY_NOTIFICATION => 'Notifications',
            self::CATEGORY_FINANCE => 'Finance',
            self::CATEGORY_ACADEMIC => 'Academic',
            self::CATEGORY_SYSTEM => 'System',
        ];
    }
}
