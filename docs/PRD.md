# 📘 **Product Requirements Document (PRD)**

**Project:** EECA School Management System (McSMS)  
**Version:** 2.0 Pro  
**Last Updated:** December 19, 2025  
**Production URL:** https://eea.mcaforo.com  
**Status:** Production Ready ✅

---

# 1. **Executive Summary**

McSMS is a comprehensive, enterprise-grade school management system built for Ghanaian schools, supporting operations from **creche to grade school**. The system features a modern React frontend with a PHP REST API backend, providing role-based dashboards for all stakeholders.

## Key Highlights
- **7 User Roles**: Admin, Principal, Teacher, Parent, Student, Finance, HR
- **97 Frontend Components**: React-based modern UI
- **82+ API Endpoints**: RESTful PHP backend
- **69 Database Tables**: Comprehensive data model
- **Mobile-Ready**: Responsive design with PWA support

---

# 2. **Product Vision & Objectives**

## Vision
To provide a complete digital transformation solution for schools, enabling seamless management of academics, finance, HR, and parent communication.

## Objectives
1. **Digitize Operations**: Paperless enrollment, attendance, and grading
2. **Automate Finance**: Fee invoicing, payment tracking, and reporting
3. **Enhance Communication**: Real-time parent-teacher messaging
4. **Enable Analytics**: Data-driven insights for decision making
5. **Support Multi-Platform**: Web and mobile access
6. **Ghana-Specific**: Mobile money, local SMS providers, GHS currency

---

# 3. **User Roles & Personas**

## 3.1 **Administrator**
- Full system access and configuration
- User management and role assignment
- Academic structure setup (classes, subjects, terms)
- System-wide reports and analytics

## 3.2 **Principal**
- School-wide overview dashboard
- Staff performance monitoring
- Academic oversight
- Executive reports

## 3.3 **Teacher**
- Class management and attendance
- Grade entry and assessments
- Homework creation and grading
- Student progress tracking
- Parent communication

## 3.4 **Parent**
- Multi-child dashboard
- Academic performance monitoring
- Homework submission for children
- Fee payment and invoice viewing
- Teacher communication

## 3.5 **Student**
- Personal dashboard
- View grades and homework
- Submit assignments
- Access learning materials

## 3.6 **Finance Staff**
- Invoice generation
- Payment recording
- Financial reports
- Fee structure management

## 3.7 **HR Staff**
- Employee management
- Payroll processing
- Leave management
- Staff attendance

---

# 4. **System Architecture**

## 4.1 **Technology Stack**

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build Tool |
| TailwindCSS | Styling |
| Lucide Icons | Iconography |
| Axios | HTTP Client |
| Zustand | State Management |
| React Router | Navigation |

### Backend
| Technology | Purpose |
|------------|---------|
| PHP 8+ | Server Language |
| MySQL 5.7+ | Database |
| PDO | Database Access |
| JWT | Authentication |
| DOMPDF | PDF Generation |
| PHPMailer | Email |

### Infrastructure
| Component | Details |
|-----------|---------|
| Hosting | cPanel (Apache) |
| SSL | Let's Encrypt |
| CDN | Optional |
| Backup | Automated daily |

## 4.2 **Project Structure**

```
McSMS/
├── frontend/                 # React Application
│   └── src/
│       ├── pages/
│       │   ├── admin/       # 54 components
│       │   ├── teacher/     # 18 components
│       │   ├── parent/      # 18 components
│       │   ├── student/     # 1 component
│       │   ├── finance/     # 1 component
│       │   ├── hr/          # 1 component
│       │   ├── principal/   # 1 component
│       │   └── shared/      # 3 components
│       ├── components/      # Reusable UI components
│       └── store/           # State management
├── backend/
│   └── api/                 # 82+ PHP API endpoints
├── config/                  # Database configuration
├── database/                # Schema and migrations
└── docs/                    # Documentation
```

---

# 5. **Feature Modules**

---

## 5.1 **Authentication & Authorization**

### Features
- Email/password login
- Role-based access control (RBAC)
- Session management
- Password reset functionality
- Account activation via email

### API Endpoints
- `POST /auth.php` - Login/Register
- `GET /auth.php?action=verify` - Token verification
- `POST /auth.php?action=reset` - Password reset

---

## 5.2 **Admin Dashboard & Management**

### Components (54 total)
| Component | Description |
|-----------|-------------|
| `Dashboard.jsx` | Main admin overview |
| `ComprehensiveDashboard.jsx` | Detailed analytics view |
| `Students.jsx` | Student management |
| `Teachers.jsx` | Teacher management |
| `Classes.jsx` | Class configuration |
| `Subjects.jsx` | Subject management |
| `ClassSubjects.jsx` | Class-subject mapping |
| `Terms.jsx` | Academic term setup |
| `EducationLevels.jsx` | Level configuration |
| `Attendance.jsx` | Attendance management |
| `Grading.jsx` | Grade configuration |
| `Homework.jsx` | Homework oversight |
| `Exams.jsx` | Exam management |
| `Timetable.jsx` | Schedule management |
| `Finance.jsx` | Financial overview |
| `FeeStructure.jsx` | Fee configuration |
| `Invoices.jsx` | Invoice management |
| `Payments.jsx` | Payment tracking |
| `Admissions.jsx` | Application processing |
| `BulkImport.jsx` | Data import tools |
| `Settings.jsx` | System settings |
| `RoleManagement.jsx` | Role configuration |
| `SystemConfiguration.jsx` | System config |
| `SystemLogs.jsx` | Audit logs |
| `SystemReset.jsx` | Data reset tools |

### Advanced Features
| Component | Description |
|-----------|-------------|
| `Analytics.jsx` | Basic analytics |
| `AdvancedAnalytics.jsx` | Deep insights |
| `AIFeatures.jsx` | AI-powered tools |
| `Reports.jsx` | Report generation |
| `ReportBuilder.jsx` | Custom reports |
| `AcademicReports.jsx` | Academic reports |
| `FinancialReports.jsx` | Finance reports |
| `StudentReports.jsx` | Student reports |
| `ExecutiveReports.jsx` | Executive summaries |
| `Messages.jsx` | Messaging center |
| `EmailMessaging.jsx` | Email campaigns |
| `SMSMessaging.jsx` | SMS notifications |
| `HRManagement.jsx` | HR overview |
| `HRPayroll.jsx` | Payroll management |
| `AlumniManagement.jsx` | Alumni tracking |
| `LMS.jsx` | Learning management |
| `Biometric.jsx` | Biometric integration |
| `IntegrationHub.jsx` | Third-party integrations |
| `MultiSchool.jsx` | Multi-campus support |

---

## 5.3 **Teacher Portal**

### Components (18 total)
| Component | Description |
|-----------|-------------|
| `Dashboard.jsx` | Teacher overview with stats |
| `MyClasses.jsx` | Assigned classes |
| `Students.jsx` | Class student lists |
| `TeacherAttendance.jsx` | Mark attendance |
| `TeacherGrading.jsx` | Enter grades |
| `TeacherHomework.jsx` | Create/manage homework |
| `TeacherHomeworkReview.jsx` | Review submissions |
| `StudentProgress.jsx` | Track student progress |
| `StudentReports.jsx` | Generate reports |
| `LessonPlanning.jsx` | Plan lessons |
| `ResourceLibrary.jsx` | Teaching resources |
| `SeatingChart.jsx` | Classroom seating |
| `BehaviorTracking.jsx` | Student behavior |
| `AIInsights.jsx` | AI recommendations |
| `SubstituteMode.jsx` | Substitute teacher mode |
| `HRPortal.jsx` | HR self-service |
| `Messages.jsx` | Parent communication |
| `Settings.jsx` | Personal settings |

### Key Features
- **Attendance**: Mark daily attendance with present/absent/late status
- **Grading**: Enter assessment grades with automatic percentage calculation
- **Homework**: Create assignments, set due dates, attach files
- **Homework Review**: Grade submissions, provide feedback
- **Seating Chart**: Visual classroom arrangement

---

## 5.4 **Parent Portal**

### Components (18 total)
| Component | Description |
|-----------|-------------|
| `ParentDashboard.jsx` | Main parent dashboard |
| `ParentProDashboard.jsx` | Enhanced dashboard |
| `ChildDetails.jsx` | Child profile view |
| `ChildAttendance.jsx` | Attendance history |
| `ChildGrades.jsx` | Grade viewing |
| `ChildResults.jsx` | Results & performance |
| `ChildHomework.jsx` | Homework list |
| `ChildHomeworkView.jsx` | Homework details & submission |
| `ChildTeachers.jsx` | Teacher contacts |
| `ChildReportCards.jsx` | Report card viewing |
| `Invoices.jsx` | Fee invoices |
| `Payments.jsx` | Payment history |
| `TermEnrollment.jsx` | Term enrollment |
| `ApplyForAdmission.jsx` | New admission |
| `ParentMeetings.jsx` | Meeting scheduling |
| `Messages.jsx` | Teacher messaging |
| `Settings.jsx` | Account settings |

### Key Features
- **Multi-Child Support**: View all children from single dashboard
- **Performance Tracking**: Academic scores, attendance rates, subjects enrolled
- **Homework Submission**: Submit homework on behalf of children with file upload
- **Fee Management**: View invoices, payment history, outstanding balances
- **Real-time Updates**: Live data from school systems

---

## 5.5 **Student Portal**

### Components
| Component | Description |
|-----------|-------------|
| `StudentDashboard.jsx` | Student overview |

### Features
- View personal academic performance
- Access homework assignments
- View timetable and schedule
- Check attendance records

---

## 5.6 **Finance Module**

### Components
| Component | Description |
|-----------|-------------|
| `FinanceDashboard.jsx` | Finance overview |

### Features
- **Fee Structure**: Configure mandatory and optional fees
- **Invoice Generation**: Automatic and manual invoicing
- **Payment Recording**: Track payments with multiple methods
- **Financial Reports**: Revenue, outstanding, collection rates
- **Mobile Money**: MTN, Vodafone, AirtelTigo integration

---

## 5.7 **HR Module**

### Components
| Component | Description |
|-----------|-------------|
| `HRDashboard.jsx` | HR overview |

### Features
- **Employee Management**: Complete staff records
- **Payroll Processing**: Salary calculation, deductions
- **Leave Management**: Applications and approvals
- **Attendance Tracking**: Staff check-in/out
- **Performance Reviews**: Evaluation system

---

## 5.8 **Principal Dashboard**

### Components
| Component | Description |
|-----------|-------------|
| `PrincipalDashboard.jsx` | Executive overview |

### Features
- School-wide statistics
- Staff performance metrics
- Academic performance trends
- Financial health indicators

---

## 5.9 **Shared Components**

### Components
| Component | Description |
|-----------|-------------|
| `Profile.jsx` | User profile management |
| `Notifications.jsx` | Notification center |
| `HelpCenter.jsx` | Help and support |

---

# 6. **API Endpoints**

## 6.1 **Core APIs**

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `auth.php` | POST, GET | Authentication |
| `users.php` | CRUD | User management |
| `students.php` | CRUD | Student management |
| `teachers.php` | CRUD | Teacher management |
| `parents.php` | CRUD | Parent management |
| `classes.php` | CRUD | Class management |
| `subjects.php` | CRUD | Subject management |
| `terms.php` | CRUD | Term management |

## 6.2 **Academic APIs**

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `attendance.php` | CRUD | Attendance tracking |
| `grades.php` | GET | Grade retrieval |
| `assessment_grades.php` | CRUD | Assessment grades |
| `homework.php` | CRUD | Homework management |
| `homework_submissions.php` | CRUD | Submission handling |
| `exams.php` | CRUD | Exam management |
| `timetable.php` | CRUD | Schedule management |

## 6.3 **Finance APIs**

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `finance.php` | CRUD | Financial operations |
| `invoices.php` | CRUD | Invoice management |
| `payments.php` | CRUD | Payment processing |
| `fee_items.php` | CRUD | Fee configuration |
| `fee_groups.php` | CRUD | Fee grouping |

## 6.4 **Portal APIs**

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `parent_portal.php` | GET | Parent dashboard data |
| `teacher_dashboard.php` | GET | Teacher dashboard data |
| `dashboard.php` | GET | Admin dashboard data |

## 6.5 **Advanced APIs**

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `analytics.php` | GET | Analytics data |
| `advanced_analytics.php` | GET | Deep analytics |
| `ai_features.php` | POST | AI operations |
| `ai_insights.php` | GET | AI insights |
| `reports.php` | GET | Report generation |

---

# 7. **Database Schema**

## 7.1 **Core Tables**

| Table | Description |
|-------|-------------|
| `users` | User accounts |
| `students` | Student records |
| `teachers` | Teacher records |
| `parents` | Parent records |
| `parent_student` | Parent-child relationships |
| `classes` | Class definitions |
| `sections` | Class sections |
| `subjects` | Subject catalog |
| `class_subjects` | Class-subject mapping |
| `terms` | Academic terms |
| `academic_years` | Academic years |

## 7.2 **Academic Tables**

| Table | Description |
|-------|-------------|
| `attendance` | Attendance records |
| `assessments` | Assessment definitions |
| `assessment_grades` | Student grades |
| `homework` | Homework assignments |
| `homework_submissions` | Student submissions |
| `exams` | Exam definitions |
| `exam_results` | Exam results |
| `timetable` | Class schedules |

## 7.3 **Finance Tables**

| Table | Description |
|-------|-------------|
| `invoices` | Fee invoices |
| `invoice_items` | Invoice line items |
| `payments` | Payment records |
| `fee_items` | Fee definitions |
| `fee_groups` | Fee groupings |

## 7.4 **HR Tables**

| Table | Description |
|-------|-------------|
| `employees` | Employee records |
| `departments` | Department structure |
| `payroll` | Payroll records |
| `leave_requests` | Leave applications |

---

# 8. **Ghana-Specific Features**

## 8.1 **Payment Integration**
- **Mobile Money**: MTN MoMo, Vodafone Cash, AirtelTigo Money
- **Payment Gateways**: Paystack, Flutterwave, Hubtel
- **Currency**: Ghana Cedis (GHS)

## 8.2 **SMS Providers**
- Arkesel
- Hubtel
- Twilio

## 8.3 **Academic System**
- WAEC/BECE grade scales
- Ghana school calendar
- Term-based academic year

## 8.4 **Localization**
- Ghana phone number format (+233)
- Local date formats
- Regional settings

---

# 9. **Security Features**

| Feature | Implementation |
|---------|----------------|
| Authentication | JWT tokens |
| Password Storage | bcrypt hashing |
| SQL Injection | PDO prepared statements |
| XSS Prevention | Output sanitization |
| CSRF Protection | Token validation |
| File Upload | Type/size validation |
| Rate Limiting | Request throttling |
| SSL/TLS | HTTPS enforcement |
| Session Security | Secure cookies |
| Role-Based Access | RBAC implementation |

---

# 10. **Reporting & Analytics**

## 10.1 **Academic Reports**
- Student report cards (PDF)
- Class performance summaries
- Subject-wise analysis
- Attendance reports
- Progress tracking

## 10.2 **Financial Reports**
- Revenue reports
- Outstanding fees
- Collection rates
- Payment history
- Invoice summaries

## 10.3 **Administrative Reports**
- Enrollment statistics
- Staff reports
- System usage logs
- Audit trails

## 10.4 **Analytics Dashboards**
- Real-time metrics
- Trend analysis
- Predictive insights (AI)
- Custom report builder

---

# 11. **Integration Capabilities**

## 11.1 **Current Integrations**
- Email (SMTP/PHPMailer)
- SMS (Arkesel, Hubtel, Twilio)
- Payment (Paystack, Flutterwave, Hubtel)
- PDF Generation (DOMPDF)

## 11.2 **Planned Integrations**
- Biometric devices
- Google Classroom
- Microsoft Teams
- WhatsApp Business API

---

# 12. **Deployment**

## 12.1 **Requirements**
- PHP 8.0+
- MySQL 5.7+
- Apache/Nginx
- Node.js 18+ (for build)
- SSL Certificate

## 12.2 **Deployment Process**
1. Clone repository
2. Configure database
3. Run migrations
4. Build frontend (`npm run build`)
5. Deploy to server
6. Configure SSL
7. Set file permissions

## 12.3 **Production URL**
- **Live Site**: https://eea.mcaforo.com

---

# 13. **Performance Metrics**

| Metric | Target | Current |
|--------|--------|---------|
| Page Load | < 3s | Achieved |
| API Response | < 500ms | Achieved |
| Uptime | 99.9% | Achieved |
| Mobile Score | > 90 | Achieved |

---

# 14. **Future Roadmap**

## Phase 4 - Advanced Features (Planned)
- [ ] Biometric Integration
- [ ] Multi-School Management
- [ ] AI Chatbot Assistant
- [ ] Mobile Native Apps (iOS/Android)
- [ ] Video Conferencing Integration
- [ ] Advanced LMS Features
- [ ] Parent Mobile App
- [ ] Offline Mode Support

---

# 15. **Support & Documentation**

## Documentation Files
- `README.md` - Project overview
- `INSTALLATION_GUIDE.md` - Setup instructions
- `DEPLOYMENT_README.md` - Deployment guide
- `README_PRO_FEATURES.md` - Pro features guide
- `API_DOCUMENTATION.md` - API reference

## Support Channels
- GitHub Issues
- Email Support
- Documentation Wiki

---

# 16. **Version History**

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 2025 | Initial release |
| 1.1 | Dec 2025 | Pro features added |
| 2.0 | Dec 2025 | React frontend, full API |

---

# 17. **Acceptance Criteria**

## Core Functionality 
- [x] Parents can register and manage multiple children
- [x] Admissions workflow with approval process
- [x] Fee calculation with mandatory + optional items
- [x] Installment payment support
- [x] Teachers can mark attendance and enter grades
- [x] Homework creation with file attachments
- [x] Parents can submit homework for children
- [x] Real-time dashboards for all roles
- [x] Report generation (PDF)
- [x] SMS and email notifications
- [x] Mobile money payment integration

## Quality Metrics 
- [x] Responsive design (mobile-friendly)
- [x] Fast page loads (< 3 seconds)
- [x] Secure authentication
- [x] Data validation
- [x] Error handling
- [x] Audit logging

---

**Document Version:** 2.0  
**Last Updated:** December 19, 2025  
**Status:** Production Ready 