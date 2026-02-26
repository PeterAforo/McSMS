# McSMS Email Templates System

**Date:** 2026-02-26  
**Version:** 1.0

---

## Overview

The Email Templates System provides customizable email templates for all system notifications. Templates support variable substitution, HTML formatting, and are organized by category.

---

## Features

- **15+ Default Templates**: Welcome, password reset, fee reminders, grades, etc.
- **Variable Substitution**: Dynamic content with `{{variable}}` syntax
- **Categories**: Auth, Notification, Finance, Academic, System
- **HTML Editor**: Visual and code editing modes
- **Preview**: See rendered emails with sample data
- **Test Emails**: Send test emails to verify templates

---

## File Structure

```
backend/
├── src/
│   └── Email/
│       └── EmailTemplateService.php   # Core template service
├── api/
│   └── email-templates.php            # REST API endpoints
└── templates/
    └── email/                          # Template storage (optional)

frontend/
└── src/
    └── components/
        └── admin/
            └── EmailTemplates.jsx      # Admin UI component
```

---

## Default Templates

### Authentication
| Slug | Name | Description |
|------|------|-------------|
| `welcome` | Welcome Email | Sent to new users |
| `password_reset` | Password Reset | Password reset link |
| `account_activation` | Account Activation | Email verification |
| `login_alert` | Login Alert | New device login notification |

### Finance
| Slug | Name | Description |
|------|------|-------------|
| `fee_reminder` | Fee Payment Reminder | Pending fee notification |
| `payment_receipt` | Payment Receipt | Payment confirmation |
| `invoice` | Invoice | Invoice details |

### Academic
| Slug | Name | Description |
|------|------|-------------|
| `grade_published` | Grades Published | New grades available |
| `attendance_alert` | Attendance Alert | Absence notification |
| `exam_schedule` | Exam Schedule | Upcoming exams |
| `assignment_due` | Assignment Due | Assignment reminder |

### Notifications
| Slug | Name | Description |
|------|------|-------------|
| `general_notification` | General Notification | Generic notification |
| `announcement` | School Announcement | School-wide announcements |
| `event_reminder` | Event Reminder | Upcoming events |

### System
| Slug | Name | Description |
|------|------|-------------|
| `system_alert` | System Alert | Admin alerts |
| `backup_complete` | Backup Complete | Backup confirmation |

---

## API Endpoints

### List Templates
```
GET /api/email-templates.php?action=list
GET /api/email-templates.php?action=list&category=finance
GET /api/email-templates.php?action=list&active_only=true
```

### Get Template
```
GET /api/email-templates.php?action=get&slug=welcome
```

### Preview Template
```
GET /api/email-templates.php?action=preview&slug=welcome
```

### Create Template
```
POST /api/email-templates.php?action=create
Content-Type: application/json

{
  "slug": "custom_template",
  "name": "Custom Template",
  "category": "notification",
  "subject": "{{title}} - {{school_name}}",
  "body_html": "<p>Hello {{user_name}},</p><p>{{message}}</p>",
  "description": "Custom notification template"
}
```

### Update Template
```
PUT /api/email-templates.php?slug=welcome
Content-Type: application/json

{
  "subject": "New Subject Line",
  "body_html": "<p>Updated content</p>"
}
```

### Delete Template
```
DELETE /api/email-templates.php?slug=custom_template
```

### Render Template
```
POST /api/email-templates.php?action=render
Content-Type: application/json

{
  "slug": "welcome",
  "variables": {
    "user_name": "John Doe",
    "user_email": "john@example.com"
  }
}
```

### Initialize Defaults
```
GET /api/email-templates.php?action=initialize
```

### Get Categories
```
GET /api/email-templates.php?action=categories
```

---

## Variable Substitution

### Syntax
Use double curly braces: `{{variable_name}}`

### Default Variables
These are automatically available in all templates:

| Variable | Description |
|----------|-------------|
| `{{school_name}}` | School name from settings |
| `{{school_email}}` | School email |
| `{{school_phone}}` | School phone |
| `{{school_address}}` | School address |
| `{{school_website}}` | School website URL |
| `{{current_year}}` | Current year |
| `{{current_date}}` | Current date formatted |

### Common Variables by Template

**User-related:**
- `{{user_name}}`, `{{user_email}}`, `{{user_role}}`

**Student-related:**
- `{{student_name}}`, `{{class_name}}`, `{{parent_name}}`

**Finance-related:**
- `{{fee_amount}}`, `{{due_date}}`, `{{receipt_number}}`, `{{invoice_number}}`

**Academic-related:**
- `{{subject_name}}`, `{{teacher_name}}`, `{{exam_name}}`, `{{assignment_title}}`

---

## Usage in Code

### Rendering a Template

```php
require_once __DIR__ . '/../src/Email/EmailTemplateService.php';
use McSMS\Email\EmailTemplateService;

$templateService = new EmailTemplateService();

// Render template with variables
$email = $templateService->render('welcome', [
    'user_name' => 'John Doe',
    'user_email' => 'john@example.com',
    'user_role' => 'Parent',
    'login_url' => 'https://school.com/login',
]);

// $email contains:
// - subject: Rendered subject line
// - body_html: Full HTML email with layout
// - body_text: Plain text version
```

### Sending Email

```php
// After rendering
$to = 'john@example.com';
$subject = $email['subject'];
$htmlBody = $email['body_html'];
$textBody = $email['body_text'];

// Use your email service (PHPMailer, etc.)
$mailer->send($to, $subject, $htmlBody, $textBody);
```

### Creating Custom Template

```php
$templateService->createTemplate('custom_alert', [
    'name' => 'Custom Alert',
    'category' => 'notification',
    'subject' => 'Alert: {{alert_title}}',
    'body_html' => '<p>{{alert_message}}</p>',
    'description' => 'Custom alert template',
]);
```

---

## Email Layout

All templates are automatically wrapped in a responsive HTML layout with:

- **Header**: School name with gradient background
- **Body**: White content area with styling
- **Footer**: Copyright, contact info, disclaimer

### CSS Classes Available

| Class | Description |
|-------|-------------|
| `.button` | Styled call-to-action button |
| `.info-box` | Blue-bordered information box |
| `.warning-box` | Yellow-bordered warning box |
| `table` | Styled data table |

### Example Usage

```html
<p>Click the button below:</p>
<p style="text-align: center;">
    <a href="{{action_url}}" class="button">Take Action</a>
</p>

<div class="info-box">
    <strong>Important:</strong> {{info_message}}
</div>

<div class="warning-box">
    <strong>Warning:</strong> {{warning_message}}
</div>
```

---

## Integration

### Add to Admin Routes

```jsx
import EmailTemplates from './components/admin/EmailTemplates';

<Route path="/admin/email-templates" element={<EmailTemplates />} />
```

### Add to Sidebar

```jsx
{
  name: 'Email Templates',
  icon: Mail,
  path: '/admin/email-templates',
}
```

---

## Best Practices

1. **Test Before Sending**: Always preview and send test emails
2. **Keep It Simple**: Avoid complex HTML that may break in email clients
3. **Mobile-Friendly**: The default layout is responsive
4. **Clear Subject Lines**: Include key info in subject
5. **Personalize**: Use variables for names and specific details
6. **Include Actions**: Add clear call-to-action buttons
7. **Fallback Text**: Plain text version is auto-generated

---

## Troubleshooting

### Variables Not Replaced
- Check variable names match exactly (case-sensitive)
- Ensure variables are passed to render function
- Use double curly braces: `{{variable}}`

### Email Not Displaying Correctly
- Test in multiple email clients
- Avoid external CSS files
- Use inline styles for critical styling
- Keep images hosted on accessible URLs

### Template Not Found
- Verify slug is correct
- Check template is active
- Run initialize to create defaults
