# School Management System

A comprehensive web-based school management system built with PHP MVC architecture, designed to manage operations from creche to grade school.

## Features

- **Multi-User System**: Parents, Teachers, Admissions Officers, Finance Staff, and Administrators
- **Parent Portal**: Child registration, admission applications, fee management, performance tracking
- **Admissions Management**: Application review and approval workflow
- **Academic Management**: Classes, subjects, sessions, terms
- **Teacher Portal**: Attendance tracking, grade entry, homework management
- **Finance Module**: Fee management, invoicing, payment tracking
- **Reports & Analytics**: Comprehensive reporting for all modules
- **Notifications & Messaging**: Real-time communication system

## Technology Stack

- **Backend**: PHP 8+, MVC Architecture
- **Database**: MySQL 5.7+
- **Frontend**: HTML5, CSS3, JavaScript
- **Design**: Custom design tokens, responsive layout
- **Server**: XAMPP (Apache)

## Installation

### Prerequisites

- XAMPP (or similar PHP/MySQL environment)
- PHP 8.0 or higher
- MySQL 5.7 or higher

### Setup Instructions

1. **Clone or download the project**
   ```
   Place the McSMS folder in your xampp/htdocs directory
   ```

2. **Create the database**
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Create a new database named `school_management_system`
   - Import the schema: `database/schema.sql`

3. **Configure database connection**
   - Open `config/database.php`
   - Update credentials if needed (default: root with no password)

4. **Set permissions**
   - Ensure `public/assets/uploads` directory is writable
   ```
   chmod -R 755 public/assets/uploads
   ```

5. **Access the application**
   - URL: http://localhost/McSMS/public/
   - Default admin login:
     - Email: admin@school.com
     - Password: password

## Documentation

📚 **Complete documentation is available in the [`/docs`](./docs) folder.**

**Key Documents:**
- [`docs/INDEX.md`](./docs/INDEX.md) - Complete documentation index
- [`docs/QUICK_START.md`](./docs/QUICK_START.md) - Quick start guide
- [`docs/PRD.md`](./docs/PRD.md) - Product requirements
- [`docs/100_PERCENT_COMPLETE.md`](./docs/100_PERCENT_COMPLETE.md) - System status
- [`docs/COMPLETE_TESTING_GUIDE.md`](./docs/COMPLETE_TESTING_GUIDE.md) - Testing guide

**70+ documentation files covering:**
- Authentication & Authorization
- Student & Teacher Management
- Finance & Fee Management
- Reports & Analytics
- Technical Implementation
- Fixes & Updates

## Project Structure

```
McSMS/
├── app/
│   ├── controllers/     # Application controllers
│   ├── models/          # Database models
│   ├── views/           # View templates
│   │   ├── layouts/     # Layout templates
│   │   ├── auth/        # Authentication views
│   │   ├── parent/      # Parent portal views
│   │   ├── teacher/     # Teacher portal views
│   │   ├── admin/       # Admin portal views
│   │   └── ...
│   └── core/            # Core framework classes
│       ├── DB.php       # Database connection
│       ├── Controller.php
│       ├── Model.php
│       ├── Auth.php
│       └── Session.php
├── backend/
│   └── api/             # REST API endpoints
├── frontend/
│   └── src/             # React frontend application
├── config/
│   ├── config.php       # Application configuration
│   └── database.php     # Database configuration
├── database/
│   └── schema.sql       # Database schema
├── docs/                # 📚 Complete Documentation (70+ files)
│   └── INDEX.md         # Documentation index
├── json/                # Configuration files
├── public/              # Public web root
│   ├── index.php        # Front controller
│   ├── .htaccess        # Apache rewrite rules
│   └── assets/
│       ├── css/         # Stylesheets
│       ├── js/          # JavaScript files
│       ├── images/      # Images
│       └── uploads/     # User uploads
└── README.md
```

## Design System

The application uses a consistent design system with:

- **Primary Color**: #3F51B5 (Indigo)
- **Secondary Color**: #607D8B (Blue Grey)
- **Accent Color**: #4CAF50 (Green)
- **Typography**: Inter, Roboto font family
- **Components**: Cards, buttons, forms, tables, badges, alerts

## User Roles

### Admin
- Full system access
- User management
- System configuration
- Academic structure setup

### Parent
- Register children
- Submit admission applications
- View invoices and make payments
- Track academic performance
- Communicate with teachers

### Teacher
- Mark attendance
- Enter grades
- Create and manage homework
- View class lists
- Message parents

### Admissions Officer
- Review applications
- Approve/reject admissions
- Assign classes and sections

### Finance Staff
- Manage fee types
- Generate invoices
- Record payments
- Generate financial reports

## Development Status

### ✅ Completed
- Core MVC framework
- Database schema
- Authentication system (login/register/logout)
- Design system and UI components
- Base layouts and templates

### 🚧 In Progress
- Parent Portal
- Admissions Module
- Teacher Portal
- Finance Module
- Admin Panel

### 📋 Planned
- Reports & Analytics
- Notifications system
- Messaging system
- PDF generation
- Email notifications

## Security Features

- Password hashing (bcrypt)
- PDO prepared statements (SQL injection prevention)
- Session security
- CSRF protection (to be implemented)
- Input validation and sanitization
- Role-based access control

## API Endpoints

The application uses query-based routing:

```
Format: index.php?c=controller&a=action&param=value

Examples:
- index.php?c=auth&a=login
- index.php?c=parent&a=dashboard
- index.php?c=admissions&a=view&id=123
```

## Contributing

This is a private school management system. For modifications or enhancements, please follow the MVC architecture and design system guidelines.

## License

Proprietary - All rights reserved

## Support

For technical support or questions, contact the development team.

## Version

Version 1.0 - Initial Release

---

**Note**: Change the default admin password immediately after first login for security purposes.
