<?php
/**
 * Help Controller
 * Provides comprehensive training and documentation for all system modules
 */

class HelpController extends Controller {
    
    private $modules;
    private $workflows;
    private $userRoles;
    
    public function __construct() {
        // Help is accessible to all authenticated users
        if (!Auth::check()) {
            $this->redirect('auth', 'login');
        }
        
        $this->initializeModules();
        $this->initializeWorkflows();
        $this->initializeUserRoles();
    }
    
    /**
     * Main Help Center
     */
    public function index() {
        $userType = $_SESSION['user_type'] ?? 'parent';
        $relevantModules = $this->getModulesForRole($userType);
        
        $this->render('help/index', [
            'pageTitle' => 'Help Center - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getHelpSidebar(),
            'modules' => $this->modules,
            'relevantModules' => $relevantModules,
            'userType' => $userType,
            'quickLinks' => $this->getQuickLinks($userType)
        ]);
    }
    
    /**
     * Module Detail Page
     */
    public function module() {
        $moduleId = $_GET['id'] ?? null;
        
        if (!$moduleId || !isset($this->modules[$moduleId])) {
            Session::setFlash('error', 'Module not found.', 'error');
            $this->redirect('help', 'index');
        }
        
        $module = $this->modules[$moduleId];
        $relatedModules = $this->getRelatedModules($moduleId);
        
        $this->render('help/module_detail', [
            'pageTitle' => $module['name'] . ' - Help Center - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getHelpSidebar(),
            'module' => $module,
            'moduleId' => $moduleId,
            'relatedModules' => $relatedModules,
            'allModules' => $this->modules
        ]);
    }
    
    /**
     * Module Interactions Diagram
     */
    public function interactions() {
        $this->render('help/interactions', [
            'pageTitle' => 'Module Interactions - Help Center - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getHelpSidebar(),
            'modules' => $this->modules,
            'workflows' => $this->workflows
        ]);
    }
    
    /**
     * Workflow Guide
     */
    public function workflow() {
        $workflowId = $_GET['id'] ?? null;
        
        if (!$workflowId || !isset($this->workflows[$workflowId])) {
            Session::setFlash('error', 'Workflow not found.', 'error');
            $this->redirect('help', 'interactions');
        }
        
        $workflow = $this->workflows[$workflowId];
        
        $this->render('help/workflow_detail', [
            'pageTitle' => $workflow['name'] . ' - Help Center - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getHelpSidebar(),
            'workflow' => $workflow,
            'workflowId' => $workflowId,
            'allModules' => $this->modules
        ]);
    }
    
    /**
     * Role-based Guide
     */
    public function roleGuide() {
        $roleId = $_GET['role'] ?? $_SESSION['user_type'] ?? 'parent';
        
        if (!isset($this->userRoles[$roleId])) {
            $roleId = 'parent';
        }
        
        $role = $this->userRoles[$roleId];
        $roleModules = $this->getModulesForRole($roleId);
        
        $this->render('help/role_guide', [
            'pageTitle' => $role['name'] . ' Guide - Help Center - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getHelpSidebar(),
            'role' => $role,
            'roleId' => $roleId,
            'roleModules' => $roleModules,
            'allRoles' => $this->userRoles,
            'allModules' => $this->modules
        ]);
    }
    
    /**
     * Search Help Content
     */
    public function search() {
        $query = trim($_GET['q'] ?? '');
        $results = [];
        
        if (!empty($query)) {
            $results = $this->searchHelpContent($query);
        }
        
        $this->render('help/search_results', [
            'pageTitle' => 'Search Results - Help Center - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getHelpSidebar(),
            'query' => $query,
            'results' => $results
        ]);
    }
    
    /**
     * FAQ Page
     */
    public function faq() {
        $this->render('help/faq', [
            'pageTitle' => 'FAQ - Help Center - ' . APP_NAME,
            'showSidebar' => true,
            'sidebarItems' => $this->getHelpSidebar(),
            'faqs' => $this->getFAQs()
        ]);
    }
    
    /**
     * Initialize all module documentation
     */
    private function initializeModules() {
        $this->modules = [
            'dashboard' => [
                'name' => 'Dashboard',
                'icon' => 'fas fa-tachometer-alt',
                'category' => 'Main',
                'description' => 'The central hub providing an overview of key metrics and quick access to all system features.',
                'roles' => ['admin', 'teacher', 'parent', 'finance', 'admissions'],
                'features' => [
                    'View real-time statistics (students, teachers, pending tasks)',
                    'Quick navigation to frequently used modules',
                    'Recent activity feed',
                    'Alerts and notifications',
                    'Role-specific widgets and shortcuts'
                ],
                'howToUse' => [
                    ['step' => 'Login to the system', 'detail' => 'Use your credentials to access the system. You will be redirected to your role-specific dashboard.'],
                    ['step' => 'Review statistics', 'detail' => 'The dashboard displays key metrics relevant to your role - student counts, pending tasks, etc.'],
                    ['step' => 'Navigate to modules', 'detail' => 'Use the sidebar menu or quick action cards to access different modules.'],
                    ['step' => 'Check notifications', 'detail' => 'Review any alerts or pending items that require your attention.']
                ],
                'tips' => [
                    'The dashboard refreshes automatically to show the latest data',
                    'Click on any statistic card to go directly to that module',
                    'Use the sidebar to navigate between different sections'
                ],
                'relatedModules' => ['users', 'admissions', 'fees']
            ],
            
            'users' => [
                'name' => 'User Management',
                'icon' => 'fas fa-users',
                'category' => 'Administration',
                'description' => 'Manage all system users including administrators, teachers, parents, and staff members.',
                'roles' => ['admin'],
                'features' => [
                    'Create new user accounts',
                    'Edit existing user profiles',
                    'Assign user roles (Admin, Teacher, Parent, Finance, Admissions)',
                    'Activate or deactivate user accounts',
                    'Reset user passwords',
                    'View user activity logs'
                ],
                'howToUse' => [
                    ['step' => 'Navigate to Users', 'detail' => 'Go to Administration > Users from the sidebar menu.'],
                    ['step' => 'View user list', 'detail' => 'Browse all users in a searchable, sortable table.'],
                    ['step' => 'Create new user', 'detail' => 'Click "Add User" button, fill in details (name, email, role, password).'],
                    ['step' => 'Edit user', 'detail' => 'Click the edit icon next to any user to modify their details.'],
                    ['step' => 'Manage status', 'detail' => 'Toggle user status between active and inactive as needed.']
                ],
                'tips' => [
                    'Use strong passwords for all accounts',
                    'Assign the minimum required role for each user',
                    'Deactivate accounts instead of deleting to preserve history',
                    'Parent accounts are automatically created during admission'
                ],
                'relatedModules' => ['dashboard', 'admissions']
            ],
            
            'admissions' => [
                'name' => 'Admissions',
                'icon' => 'fas fa-user-graduate',
                'category' => 'Administration',
                'description' => 'Handle the complete student admission process from application to enrollment.',
                'roles' => ['admin', 'admissions', 'parent'],
                'features' => [
                    'Online admission application form',
                    'Document upload and verification',
                    'Application status tracking',
                    'Admission approval workflow',
                    'Automatic student record creation',
                    'Parent account generation',
                    'Class and section assignment'
                ],
                'howToUse' => [
                    ['step' => 'Submit application (Parent)', 'detail' => 'Parents fill out the admission form with student details, select class, and upload required documents.'],
                    ['step' => 'Review applications (Admissions)', 'detail' => 'Admissions staff reviews pending applications, verifies documents.'],
                    ['step' => 'Approve/Reject', 'detail' => 'Applications are approved or rejected with comments. Approved students are assigned to classes.'],
                    ['step' => 'Generate invoice', 'detail' => 'Upon approval, an enrollment invoice is automatically generated for the parent.'],
                    ['step' => 'Complete enrollment', 'detail' => 'After fee payment, the student is fully enrolled and can access the system.']
                ],
                'tips' => [
                    'Ensure all required documents are uploaded before submission',
                    'Check application status regularly for updates',
                    'Contact admissions office for any queries about the process'
                ],
                'relatedModules' => ['users', 'classes', 'fees', 'fee_structure']
            ],
            
            'classes' => [
                'name' => 'Classes',
                'icon' => 'fas fa-school',
                'category' => 'Academics',
                'description' => 'Manage school classes/grades and their configurations.',
                'roles' => ['admin'],
                'features' => [
                    'Create and manage class levels (e.g., Grade 1, Grade 2)',
                    'Set class capacity limits',
                    'Assign class teachers',
                    'Link classes to fee structures',
                    'View class-wise student distribution'
                ],
                'howToUse' => [
                    ['step' => 'Navigate to Classes', 'detail' => 'Go to Academics > Classes from the sidebar.'],
                    ['step' => 'Add new class', 'detail' => 'Click "Add Class", enter class name (e.g., "Grade 5"), set capacity.'],
                    ['step' => 'Configure class', 'detail' => 'Assign subjects, set fee group, and configure other settings.'],
                    ['step' => 'Manage sections', 'detail' => 'Create sections (A, B, C) under each class for better organization.']
                ],
                'tips' => [
                    'Classes are the foundation - set them up before sections and subjects',
                    'Link fee groups to classes for automatic fee calculation',
                    'Use meaningful names that match your school\'s terminology'
                ],
                'relatedModules' => ['sections', 'subjects', 'fee_structure', 'admissions']
            ],
            
            'sections' => [
                'name' => 'Sections',
                'icon' => 'fas fa-layer-group',
                'category' => 'Academics',
                'description' => 'Divide classes into sections for better student management.',
                'roles' => ['admin'],
                'features' => [
                    'Create sections within classes (A, B, C, etc.)',
                    'Set section capacity',
                    'Assign section teachers',
                    'Move students between sections',
                    'View section-wise attendance and performance'
                ],
                'howToUse' => [
                    ['step' => 'Navigate to Sections', 'detail' => 'Go to Academics > Sections from the sidebar.'],
                    ['step' => 'Select class', 'detail' => 'Choose the class for which you want to create sections.'],
                    ['step' => 'Add section', 'detail' => 'Click "Add Section", enter section name (e.g., "A"), set capacity.'],
                    ['step' => 'Assign teacher', 'detail' => 'Optionally assign a class teacher to the section.']
                ],
                'tips' => [
                    'Create sections based on expected student count',
                    'Sections help in managing large classes effectively',
                    'Students can be reassigned to different sections if needed'
                ],
                'relatedModules' => ['classes', 'attendance', 'results']
            ],
            
            'subjects' => [
                'name' => 'Subjects',
                'icon' => 'fas fa-book',
                'category' => 'Academics',
                'description' => 'Manage academic subjects and their assignments to classes.',
                'roles' => ['admin'],
                'features' => [
                    'Create and manage subjects',
                    'Assign subjects to classes',
                    'Set subject teachers',
                    'Configure subject weightage for grading',
                    'Mark subjects as mandatory or optional'
                ],
                'howToUse' => [
                    ['step' => 'Navigate to Subjects', 'detail' => 'Go to Academics > Subjects from the sidebar.'],
                    ['step' => 'Add subject', 'detail' => 'Click "Add Subject", enter subject name and code.'],
                    ['step' => 'Assign to classes', 'detail' => 'Link subjects to specific classes where they are taught.'],
                    ['step' => 'Assign teachers', 'detail' => 'Assign teachers who will teach each subject.']
                ],
                'tips' => [
                    'Use consistent naming conventions for subjects',
                    'Subjects are linked to grades/results entry',
                    'Optional subjects can be selected during enrollment'
                ],
                'relatedModules' => ['classes', 'results', 'homework']
            ],
            
            'terms' => [
                'name' => 'Academic Terms',
                'icon' => 'fas fa-calendar-alt',
                'category' => 'Academics',
                'description' => 'Manage academic years, terms, and sessions.',
                'roles' => ['admin'],
                'features' => [
                    'Create academic years',
                    'Define terms/semesters within years',
                    'Set term start and end dates',
                    'Mark current active term',
                    'Configure term-wise fee schedules'
                ],
                'howToUse' => [
                    ['step' => 'Navigate to Terms', 'detail' => 'Go to Academics > Academic Terms from the sidebar.'],
                    ['step' => 'Create academic year', 'detail' => 'Add a new academic year (e.g., "2024-2025").'],
                    ['step' => 'Add terms', 'detail' => 'Create terms within the year (Term 1, Term 2, etc.) with dates.'],
                    ['step' => 'Set active term', 'detail' => 'Mark the current term as active for system-wide use.']
                ],
                'tips' => [
                    'Always have one active term set',
                    'Terms affect fee generation and result entry',
                    'Plan terms in advance for the entire academic year'
                ],
                'relatedModules' => ['fees', 'results', 'attendance']
            ],
            
            'fee_structure' => [
                'name' => 'Fee Structure',
                'icon' => 'fas fa-money-bill-wave',
                'category' => 'Finance',
                'description' => 'Configure fee types, amounts, and rules for different student categories.',
                'roles' => ['admin', 'finance'],
                'features' => [
                    'Create fee types (Tuition, Transport, Lab, etc.)',
                    'Set up fee groups for different classes',
                    'Configure fee rules (new student fees, recurring fees)',
                    'Define installment plans',
                    'Set up optional services',
                    'Configure discounts and scholarships'
                ],
                'howToUse' => [
                    ['step' => 'Navigate to Fee Structure', 'detail' => 'Go to Finance > Fee Structure from the sidebar.'],
                    ['step' => 'Create fee types', 'detail' => 'Add different types of fees (Tuition, Books, Transport, etc.).'],
                    ['step' => 'Create fee groups', 'detail' => 'Group fees by class level (e.g., "Primary Fees", "Secondary Fees").'],
                    ['step' => 'Add fee items', 'detail' => 'Add specific fee amounts to each group.'],
                    ['step' => 'Configure rules', 'detail' => 'Set rules for when fees apply (new students, all students, etc.).'],
                    ['step' => 'Set up installments', 'detail' => 'Create payment plans (Full, Quarterly, Monthly).']
                ],
                'tips' => [
                    'Set up fee structure before processing admissions',
                    'Use fee rules to handle one-time vs recurring fees',
                    'Installment plans help parents manage payments'
                ],
                'relatedModules' => ['fees', 'admissions', 'classes']
            ],
            
            'fees' => [
                'name' => 'Finance & Payments',
                'icon' => 'fas fa-dollar-sign',
                'category' => 'Finance',
                'description' => 'Manage invoices, payments, and financial transactions.',
                'roles' => ['admin', 'finance', 'parent'],
                'features' => [
                    'Generate student invoices',
                    'Process fee payments',
                    'Track payment history',
                    'Manage pending invoices',
                    'Generate financial reports',
                    'Handle refunds and adjustments',
                    'Send payment reminders'
                ],
                'howToUse' => [
                    ['step' => 'View invoices (Parent)', 'detail' => 'Go to Fees & Payments to see all invoices for your children.'],
                    ['step' => 'Make payment', 'detail' => 'Select an invoice and choose payment method to pay.'],
                    ['step' => 'Manage invoices (Finance)', 'detail' => 'Review pending invoices, approve enrollment invoices.'],
                    ['step' => 'Record payments', 'detail' => 'Record manual payments received at the office.'],
                    ['step' => 'Generate reports', 'detail' => 'Create collection reports, outstanding reports, etc.']
                ],
                'tips' => [
                    'Keep payment receipts for your records',
                    'Pay before due dates to avoid late fees',
                    'Contact finance office for payment plan modifications'
                ],
                'relatedModules' => ['fee_structure', 'admissions', 'reports']
            ],
            
            'attendance' => [
                'name' => 'Attendance',
                'icon' => 'fas fa-clipboard-check',
                'category' => 'Teacher Tools',
                'description' => 'Track and manage daily student attendance.',
                'roles' => ['admin', 'teacher', 'parent'],
                'features' => [
                    'Mark daily attendance',
                    'View attendance history',
                    'Generate attendance reports',
                    'Track attendance percentage',
                    'Send absence notifications to parents',
                    'Bulk attendance entry'
                ],
                'howToUse' => [
                    ['step' => 'Navigate to Attendance (Teacher)', 'detail' => 'Go to My Classes and select a class to take attendance.'],
                    ['step' => 'Select date', 'detail' => 'Choose the date for which you want to mark attendance.'],
                    ['step' => 'Mark attendance', 'detail' => 'Mark each student as Present, Absent, or Late.'],
                    ['step' => 'Save attendance', 'detail' => 'Submit the attendance record.'],
                    ['step' => 'View reports', 'detail' => 'Generate attendance reports for analysis.']
                ],
                'tips' => [
                    'Mark attendance at the start of each class',
                    'Parents can view their child\'s attendance online',
                    'Regular attendance affects academic performance'
                ],
                'relatedModules' => ['classes', 'sections', 'reports']
            ],
            
            'results' => [
                'name' => 'Grades & Results',
                'icon' => 'fas fa-graduation-cap',
                'category' => 'Teacher Tools',
                'description' => 'Enter and manage student grades and examination results.',
                'roles' => ['admin', 'teacher', 'parent'],
                'features' => [
                    'Enter CA (Continuous Assessment) scores',
                    'Enter examination scores',
                    'Automatic grade calculation',
                    'Generate report cards',
                    'View result history',
                    'Class performance analysis'
                ],
                'howToUse' => [
                    ['step' => 'Navigate to Grades (Teacher)', 'detail' => 'Go to My Classes, select class and subject for grade entry.'],
                    ['step' => 'Select term', 'detail' => 'Choose the academic term for which you are entering grades.'],
                    ['step' => 'Enter scores', 'detail' => 'Enter CA scores and exam scores for each student.'],
                    ['step' => 'Save grades', 'detail' => 'Submit the grades. System calculates total and grade automatically.'],
                    ['step' => 'View results (Parent)', 'detail' => 'Parents can view their child\'s results in the portal.']
                ],
                'tips' => [
                    'Double-check scores before submitting',
                    'Grades are calculated based on school\'s grading scale',
                    'Results can be edited until term is closed'
                ],
                'relatedModules' => ['subjects', 'terms', 'reports']
            ],
            
            'homework' => [
                'name' => 'Homework',
                'icon' => 'fas fa-book-open',
                'category' => 'Teacher Tools',
                'description' => 'Assign and track homework assignments.',
                'roles' => ['teacher', 'parent'],
                'features' => [
                    'Create homework assignments',
                    'Set due dates',
                    'Attach resources and files',
                    'Track submission status',
                    'Grade homework',
                    'Send reminders'
                ],
                'howToUse' => [
                    ['step' => 'Navigate to Homework (Teacher)', 'detail' => 'Go to Homework from the sidebar menu.'],
                    ['step' => 'Create assignment', 'detail' => 'Click "Create Homework", select class, subject, enter details.'],
                    ['step' => 'Set due date', 'detail' => 'Specify when the homework is due.'],
                    ['step' => 'Publish', 'detail' => 'Save to make it visible to students and parents.'],
                    ['step' => 'View homework (Parent)', 'detail' => 'Parents can see assigned homework in their portal.']
                ],
                'tips' => [
                    'Set realistic due dates',
                    'Include clear instructions',
                    'Parents receive notifications for new homework'
                ],
                'relatedModules' => ['subjects', 'classes']
            ],
            
            'children' => [
                'name' => 'My Children',
                'icon' => 'fas fa-child',
                'category' => 'Parent Portal',
                'description' => 'View and manage information about your enrolled children.',
                'roles' => ['parent'],
                'features' => [
                    'View child profiles',
                    'See class and section details',
                    'Track academic progress',
                    'View attendance records',
                    'Access report cards',
                    'Communicate with teachers'
                ],
                'howToUse' => [
                    ['step' => 'Navigate to My Children', 'detail' => 'Click on "My Children" in the sidebar.'],
                    ['step' => 'Select child', 'detail' => 'If you have multiple children, select the one you want to view.'],
                    ['step' => 'View details', 'detail' => 'See profile, attendance, grades, and other information.'],
                    ['step' => 'Take action', 'detail' => 'Enroll for new term, view fees, or contact teachers.']
                ],
                'tips' => [
                    'Check regularly for updates on your child\'s progress',
                    'Use this section to initiate term enrollment',
                    'Contact school for any profile updates needed'
                ],
                'relatedModules' => ['fees', 'attendance', 'results']
            ],
            
            'settings' => [
                'name' => 'System Settings',
                'icon' => 'fas fa-cog',
                'category' => 'System',
                'description' => 'Configure system-wide settings and preferences.',
                'roles' => ['admin'],
                'features' => [
                    'School information settings',
                    'Logo and branding',
                    'Email configuration',
                    'Grading scale setup',
                    'Academic calendar',
                    'System preferences'
                ],
                'howToUse' => [
                    ['step' => 'Navigate to Settings', 'detail' => 'Go to System > Settings from the sidebar.'],
                    ['step' => 'Update school info', 'detail' => 'Enter school name, address, contact details.'],
                    ['step' => 'Upload logo', 'detail' => 'Upload school logo for branding.'],
                    ['step' => 'Configure options', 'detail' => 'Set up grading scales, email settings, etc.'],
                    ['step' => 'Save changes', 'detail' => 'Click Save to apply all changes.']
                ],
                'tips' => [
                    'Set up all settings before going live',
                    'Keep school information up to date',
                    'Test email settings after configuration'
                ],
                'relatedModules' => ['dashboard', 'users']
            ],
            
            'reports' => [
                'name' => 'Reports',
                'icon' => 'fas fa-chart-bar',
                'category' => 'System',
                'description' => 'Generate various reports for analysis and record-keeping.',
                'roles' => ['admin', 'finance'],
                'features' => [
                    'Student reports',
                    'Financial reports',
                    'Attendance reports',
                    'Academic performance reports',
                    'Export to PDF/Excel',
                    'Custom date ranges'
                ],
                'howToUse' => [
                    ['step' => 'Navigate to Reports', 'detail' => 'Access reports from the relevant module or Reports section.'],
                    ['step' => 'Select report type', 'detail' => 'Choose the type of report you need.'],
                    ['step' => 'Set parameters', 'detail' => 'Select date range, class, or other filters.'],
                    ['step' => 'Generate report', 'detail' => 'Click Generate to create the report.'],
                    ['step' => 'Export', 'detail' => 'Download as PDF or Excel for offline use.']
                ],
                'tips' => [
                    'Generate reports regularly for monitoring',
                    'Use filters to get specific data',
                    'Export reports for board meetings and audits'
                ],
                'relatedModules' => ['fees', 'attendance', 'results']
            ]
        ];
    }
    
    /**
     * Initialize workflow documentation
     */
    private function initializeWorkflows() {
        $this->workflows = [
            'admission_enrollment' => [
                'name' => 'Admission to Enrollment',
                'description' => 'Complete workflow from student application to full enrollment.',
                'icon' => 'fas fa-user-plus',
                'modules' => ['admissions', 'fee_structure', 'fees', 'classes', 'users'],
                'steps' => [
                    [
                        'title' => 'Parent Submits Application',
                        'module' => 'admissions',
                        'role' => 'parent',
                        'description' => 'Parent creates account and submits admission application with student details and documents.',
                        'actions' => ['Fill admission form', 'Upload documents', 'Select class', 'Submit application']
                    ],
                    [
                        'title' => 'Admissions Reviews Application',
                        'module' => 'admissions',
                        'role' => 'admissions',
                        'description' => 'Admissions staff reviews the application, verifies documents, and makes a decision.',
                        'actions' => ['Review student details', 'Verify documents', 'Approve or reject', 'Assign class/section']
                    ],
                    [
                        'title' => 'Invoice Generated',
                        'module' => 'fees',
                        'role' => 'system',
                        'description' => 'System automatically generates enrollment invoice based on fee structure.',
                        'actions' => ['Calculate fees', 'Apply fee rules', 'Create draft invoice']
                    ],
                    [
                        'title' => 'Parent Reviews Invoice',
                        'module' => 'fees',
                        'role' => 'parent',
                        'description' => 'Parent reviews the invoice, selects optional services and payment plan.',
                        'actions' => ['Review fee breakdown', 'Select optional services', 'Choose installment plan', 'Submit to finance']
                    ],
                    [
                        'title' => 'Finance Approves Invoice',
                        'module' => 'fees',
                        'role' => 'finance',
                        'description' => 'Finance team reviews and approves the invoice for payment.',
                        'actions' => ['Verify fee calculation', 'Apply discounts if any', 'Approve invoice']
                    ],
                    [
                        'title' => 'Parent Makes Payment',
                        'module' => 'fees',
                        'role' => 'parent',
                        'description' => 'Parent pays the approved invoice amount.',
                        'actions' => ['View approved invoice', 'Select payment method', 'Complete payment']
                    ],
                    [
                        'title' => 'Student Enrolled',
                        'module' => 'classes',
                        'role' => 'system',
                        'description' => 'Student is fully enrolled and can access the system.',
                        'actions' => ['Activate student record', 'Assign to class/section', 'Enable parent portal access']
                    ]
                ]
            ],
            
            'term_enrollment' => [
                'name' => 'Term Re-enrollment',
                'description' => 'Process for enrolling existing students in a new academic term.',
                'icon' => 'fas fa-redo',
                'modules' => ['children', 'fees', 'terms'],
                'steps' => [
                    [
                        'title' => 'New Term Begins',
                        'module' => 'terms',
                        'role' => 'admin',
                        'description' => 'Admin sets up and activates the new academic term.',
                        'actions' => ['Create new term', 'Set dates', 'Activate term']
                    ],
                    [
                        'title' => 'Parent Initiates Enrollment',
                        'module' => 'children',
                        'role' => 'parent',
                        'description' => 'Parent starts the re-enrollment process for their child.',
                        'actions' => ['Go to My Children', 'Click Enroll for Term', 'Confirm details']
                    ],
                    [
                        'title' => 'Invoice Generated',
                        'module' => 'fees',
                        'role' => 'system',
                        'description' => 'System generates term fees invoice.',
                        'actions' => ['Calculate term fees', 'Create invoice']
                    ],
                    [
                        'title' => 'Payment & Enrollment',
                        'module' => 'fees',
                        'role' => 'parent',
                        'description' => 'Parent pays and enrollment is confirmed.',
                        'actions' => ['Pay invoice', 'Enrollment confirmed']
                    ]
                ]
            ],
            
            'grade_entry' => [
                'name' => 'Grade Entry Process',
                'description' => 'How teachers enter grades and parents view results.',
                'icon' => 'fas fa-edit',
                'modules' => ['results', 'subjects', 'terms'],
                'steps' => [
                    [
                        'title' => 'Teacher Enters CA Scores',
                        'module' => 'results',
                        'role' => 'teacher',
                        'description' => 'Teacher enters continuous assessment scores throughout the term.',
                        'actions' => ['Select class/subject', 'Enter CA scores', 'Save']
                    ],
                    [
                        'title' => 'Teacher Enters Exam Scores',
                        'module' => 'results',
                        'role' => 'teacher',
                        'description' => 'After exams, teacher enters examination scores.',
                        'actions' => ['Select class/subject', 'Enter exam scores', 'Save']
                    ],
                    [
                        'title' => 'System Calculates Grades',
                        'module' => 'results',
                        'role' => 'system',
                        'description' => 'System automatically calculates total and assigns grade.',
                        'actions' => ['Calculate total', 'Determine grade', 'Update records']
                    ],
                    [
                        'title' => 'Results Published',
                        'module' => 'results',
                        'role' => 'admin',
                        'description' => 'Admin publishes results for parent viewing.',
                        'actions' => ['Review results', 'Publish to portal']
                    ],
                    [
                        'title' => 'Parent Views Results',
                        'module' => 'children',
                        'role' => 'parent',
                        'description' => 'Parent can view and download report card.',
                        'actions' => ['Go to My Children', 'View results', 'Download report card']
                    ]
                ]
            ],
            
            'attendance_tracking' => [
                'name' => 'Daily Attendance',
                'description' => 'How attendance is recorded and monitored.',
                'icon' => 'fas fa-calendar-check',
                'modules' => ['attendance', 'classes', 'children'],
                'steps' => [
                    [
                        'title' => 'Teacher Takes Attendance',
                        'module' => 'attendance',
                        'role' => 'teacher',
                        'description' => 'Teacher marks attendance at the start of class.',
                        'actions' => ['Select class', 'Select date', 'Mark each student', 'Submit']
                    ],
                    [
                        'title' => 'System Records Data',
                        'module' => 'attendance',
                        'role' => 'system',
                        'description' => 'Attendance is saved and statistics updated.',
                        'actions' => ['Save attendance', 'Update percentages', 'Send notifications']
                    ],
                    [
                        'title' => 'Parent Notified',
                        'module' => 'children',
                        'role' => 'parent',
                        'description' => 'Parent receives notification if child is absent.',
                        'actions' => ['Receive alert', 'View attendance record']
                    ],
                    [
                        'title' => 'Reports Generated',
                        'module' => 'reports',
                        'role' => 'admin',
                        'description' => 'Admin can generate attendance reports.',
                        'actions' => ['Select report type', 'Set date range', 'Generate report']
                    ]
                ]
            ],
            
            'fee_collection' => [
                'name' => 'Fee Collection',
                'description' => 'Complete fee management from structure to collection.',
                'icon' => 'fas fa-hand-holding-usd',
                'modules' => ['fee_structure', 'fees', 'reports'],
                'steps' => [
                    [
                        'title' => 'Setup Fee Structure',
                        'module' => 'fee_structure',
                        'role' => 'admin',
                        'description' => 'Admin configures fee types, groups, and rules.',
                        'actions' => ['Create fee types', 'Create fee groups', 'Set amounts', 'Configure rules']
                    ],
                    [
                        'title' => 'Generate Invoices',
                        'module' => 'fees',
                        'role' => 'finance',
                        'description' => 'Invoices are generated for students.',
                        'actions' => ['Select students/class', 'Generate invoices', 'Send notifications']
                    ],
                    [
                        'title' => 'Parent Receives Invoice',
                        'module' => 'fees',
                        'role' => 'parent',
                        'description' => 'Parent views invoice in their portal.',
                        'actions' => ['View invoice', 'Check breakdown', 'Plan payment']
                    ],
                    [
                        'title' => 'Payment Made',
                        'module' => 'fees',
                        'role' => 'parent',
                        'description' => 'Parent makes payment online or at office.',
                        'actions' => ['Select payment method', 'Complete payment', 'Receive receipt']
                    ],
                    [
                        'title' => 'Finance Records Payment',
                        'module' => 'fees',
                        'role' => 'finance',
                        'description' => 'Finance records and reconciles payments.',
                        'actions' => ['Verify payment', 'Update invoice status', 'Generate reports']
                    ]
                ]
            ]
        ];
    }
    
    /**
     * Initialize user role documentation
     */
    private function initializeUserRoles() {
        $this->userRoles = [
            'admin' => [
                'name' => 'Administrator',
                'icon' => 'fas fa-user-shield',
                'description' => 'Full system access with ability to manage all modules and settings.',
                'responsibilities' => [
                    'Manage all users and their roles',
                    'Configure system settings',
                    'Set up academic structure (classes, sections, subjects)',
                    'Configure fee structure',
                    'Oversee all operations',
                    'Generate system-wide reports'
                ],
                'accessibleModules' => ['dashboard', 'users', 'admissions', 'classes', 'sections', 'subjects', 'terms', 'fee_structure', 'fees', 'attendance', 'results', 'settings', 'reports']
            ],
            'teacher' => [
                'name' => 'Teacher',
                'icon' => 'fas fa-chalkboard-teacher',
                'description' => 'Manage classes, attendance, grades, and homework.',
                'responsibilities' => [
                    'Take daily attendance',
                    'Enter student grades',
                    'Assign and manage homework',
                    'View class rosters',
                    'Communicate with parents'
                ],
                'accessibleModules' => ['dashboard', 'attendance', 'results', 'homework', 'classes']
            ],
            'parent' => [
                'name' => 'Parent/Guardian',
                'icon' => 'fas fa-user-friends',
                'description' => 'View child information, pay fees, and track progress.',
                'responsibilities' => [
                    'Submit admission applications',
                    'View child academic progress',
                    'Pay school fees',
                    'Track attendance',
                    'View homework assignments',
                    'Communicate with teachers'
                ],
                'accessibleModules' => ['dashboard', 'children', 'admissions', 'fees', 'attendance', 'results', 'homework']
            ],
            'finance' => [
                'name' => 'Finance Staff',
                'icon' => 'fas fa-calculator',
                'description' => 'Manage fees, invoices, and financial operations.',
                'responsibilities' => [
                    'Configure fee structure',
                    'Generate and manage invoices',
                    'Process payments',
                    'Handle refunds',
                    'Generate financial reports'
                ],
                'accessibleModules' => ['dashboard', 'fee_structure', 'fees', 'reports']
            ],
            'admissions' => [
                'name' => 'Admissions Staff',
                'icon' => 'fas fa-clipboard-list',
                'description' => 'Handle student admission applications and enrollment.',
                'responsibilities' => [
                    'Review admission applications',
                    'Verify documents',
                    'Approve or reject applications',
                    'Assign students to classes',
                    'Manage enrollment process'
                ],
                'accessibleModules' => ['dashboard', 'admissions', 'classes']
            ]
        ];
    }
    
    /**
     * Get modules accessible to a specific role
     */
    private function getModulesForRole($role) {
        $roleModules = [];
        foreach ($this->modules as $id => $module) {
            if (in_array($role, $module['roles'])) {
                $roleModules[$id] = $module;
            }
        }
        return $roleModules;
    }
    
    /**
     * Get related modules for a specific module
     */
    private function getRelatedModules($moduleId) {
        $related = [];
        if (isset($this->modules[$moduleId]['relatedModules'])) {
            foreach ($this->modules[$moduleId]['relatedModules'] as $relatedId) {
                if (isset($this->modules[$relatedId])) {
                    $related[$relatedId] = $this->modules[$relatedId];
                }
            }
        }
        return $related;
    }
    
    /**
     * Get quick links for a role
     */
    private function getQuickLinks($role) {
        $links = [
            'admin' => [
                ['label' => 'Add New User', 'url' => APP_URL . '/index.php?c=admin&a=createUser', 'icon' => 'fas fa-user-plus'],
                ['label' => 'View Pending Admissions', 'url' => APP_URL . '/index.php?c=admissions&a=pending', 'icon' => 'fas fa-clock'],
                ['label' => 'System Settings', 'url' => APP_URL . '/index.php?c=admin&a=settings', 'icon' => 'fas fa-cog']
            ],
            'teacher' => [
                ['label' => 'Take Attendance', 'url' => APP_URL . '/index.php?c=teacher&a=myClasses', 'icon' => 'fas fa-clipboard-check'],
                ['label' => 'Enter Grades', 'url' => APP_URL . '/index.php?c=teacher&a=myClasses', 'icon' => 'fas fa-edit'],
                ['label' => 'Create Homework', 'url' => APP_URL . '/index.php?c=teacher&a=createHomework', 'icon' => 'fas fa-plus']
            ],
            'parent' => [
                ['label' => 'View My Children', 'url' => APP_URL . '/index.php?c=parent&a=children', 'icon' => 'fas fa-child'],
                ['label' => 'Pay Fees', 'url' => APP_URL . '/index.php?c=parent&a=fees', 'icon' => 'fas fa-credit-card'],
                ['label' => 'New Admission', 'url' => APP_URL . '/index.php?c=parent&a=newApplication', 'icon' => 'fas fa-file-alt']
            ],
            'finance' => [
                ['label' => 'Pending Invoices', 'url' => APP_URL . '/index.php?c=fees&a=pendingInvoices', 'icon' => 'fas fa-clock'],
                ['label' => 'Fee Structure', 'url' => APP_URL . '/index.php?c=feeStructure', 'icon' => 'fas fa-list'],
                ['label' => 'Reports', 'url' => APP_URL . '/index.php?c=fees&a=dashboard', 'icon' => 'fas fa-chart-bar']
            ],
            'admissions' => [
                ['label' => 'Pending Applications', 'url' => APP_URL . '/index.php?c=admissions&a=pending', 'icon' => 'fas fa-clock'],
                ['label' => 'Application History', 'url' => APP_URL . '/index.php?c=admissions&a=history', 'icon' => 'fas fa-history']
            ]
        ];
        
        return $links[$role] ?? $links['parent'];
    }
    
    /**
     * Search help content
     */
    private function searchHelpContent($query) {
        $results = [];
        $query = strtolower($query);
        
        // Search modules
        foreach ($this->modules as $id => $module) {
            $score = 0;
            
            if (stripos($module['name'], $query) !== false) $score += 10;
            if (stripos($module['description'], $query) !== false) $score += 5;
            
            foreach ($module['features'] as $feature) {
                if (stripos($feature, $query) !== false) $score += 3;
            }
            
            if ($score > 0) {
                $results[] = [
                    'type' => 'module',
                    'id' => $id,
                    'title' => $module['name'],
                    'description' => $module['description'],
                    'icon' => $module['icon'],
                    'url' => APP_URL . '/index.php?c=help&a=module&id=' . $id,
                    'score' => $score
                ];
            }
        }
        
        // Search workflows
        foreach ($this->workflows as $id => $workflow) {
            $score = 0;
            
            if (stripos($workflow['name'], $query) !== false) $score += 10;
            if (stripos($workflow['description'], $query) !== false) $score += 5;
            
            if ($score > 0) {
                $results[] = [
                    'type' => 'workflow',
                    'id' => $id,
                    'title' => $workflow['name'],
                    'description' => $workflow['description'],
                    'icon' => $workflow['icon'],
                    'url' => APP_URL . '/index.php?c=help&a=workflow&id=' . $id,
                    'score' => $score
                ];
            }
        }
        
        // Sort by score
        usort($results, function($a, $b) {
            return $b['score'] - $a['score'];
        });
        
        return $results;
    }
    
    /**
     * Get FAQs
     */
    private function getFAQs() {
        return [
            [
                'category' => 'General',
                'questions' => [
                    ['q' => 'How do I reset my password?', 'a' => 'Click on "Forgot Password" on the login page and enter your email. You will receive a password reset link.'],
                    ['q' => 'How do I update my profile information?', 'a' => 'Go to your dashboard and click on your name in the top right corner to access profile settings.'],
                    ['q' => 'Who do I contact for technical support?', 'a' => 'Contact the school administration or IT department for technical assistance.']
                ]
            ],
            [
                'category' => 'Admissions',
                'questions' => [
                    ['q' => 'How do I apply for admission?', 'a' => 'Create a parent account, then go to Applications > New Application. Fill in all required details and upload documents.'],
                    ['q' => 'What documents are required for admission?', 'a' => 'Typically: Birth certificate, previous school records, passport photos, and parent ID. Check with the school for specific requirements.'],
                    ['q' => 'How long does the admission process take?', 'a' => 'Usually 3-5 business days after submitting a complete application with all documents.']
                ]
            ],
            [
                'category' => 'Fees & Payments',
                'questions' => [
                    ['q' => 'How do I pay school fees?', 'a' => 'Go to Fees & Payments, select the invoice you want to pay, and choose your preferred payment method.'],
                    ['q' => 'Can I pay fees in installments?', 'a' => 'Yes, during enrollment you can select an installment plan (Quarterly, Monthly, etc.) based on available options.'],
                    ['q' => 'How do I get a fee receipt?', 'a' => 'After payment, receipts are automatically generated. You can download them from the Fees & Payments section.']
                ]
            ],
            [
                'category' => 'Academic',
                'questions' => [
                    ['q' => 'How do I view my child\'s grades?', 'a' => 'Go to My Children, select your child, and click on "View Results" to see grades for each term.'],
                    ['q' => 'How do I check attendance?', 'a' => 'Attendance records are available under My Children > Select Child > Attendance.'],
                    ['q' => 'How do I see homework assignments?', 'a' => 'Homework is visible in the parent portal under My Children > Homework section.']
                ]
            ]
        ];
    }
    
    /**
     * Get help sidebar
     */
    private function getHelpSidebar() {
        $currentAction = $_GET['a'] ?? 'index';
        
        return [
            [
                'label' => 'Help Center',
                'url' => APP_URL . '/index.php?c=help&a=index',
                'icon' => 'fas fa-home',
                'active' => $currentAction === 'index' ? 'active' : ''
            ],
            [
                'label' => 'Module Interactions',
                'url' => APP_URL . '/index.php?c=help&a=interactions',
                'icon' => 'fas fa-project-diagram',
                'active' => $currentAction === 'interactions' ? 'active' : ''
            ],
            [
                'label' => 'Role Guide',
                'url' => APP_URL . '/index.php?c=help&a=roleGuide',
                'icon' => 'fas fa-user-tag',
                'active' => $currentAction === 'roleGuide' ? 'active' : ''
            ],
            [
                'label' => 'FAQ',
                'url' => APP_URL . '/index.php?c=help&a=faq',
                'icon' => 'fas fa-question-circle',
                'active' => $currentAction === 'faq' ? 'active' : ''
            ]
        ];
    }
}
