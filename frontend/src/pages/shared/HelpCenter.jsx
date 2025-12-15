import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  HelpCircle, Search, BookOpen, Users, GraduationCap, DollarSign,
  ClipboardCheck, FileText, Settings, BarChart3, Calendar, School,
  Layers, BookMarked, ChevronRight, ChevronDown, Play, Lightbulb,
  ArrowRight, Home, UserCheck, Clock, CreditCard, MessageSquare,
  Shield, Database, Bell, Workflow, Target, Zap, CheckCircle2,
  Award, Video, TrendingUp, Truck, Briefcase, Fingerprint, Building,
  Brain, Upload, Activity, Sliders, RefreshCw, MessageCircle, Phone,
  Mail, FileCheck, Rocket
} from 'lucide-react';

// Module data with documentation - ALL MODULES
const modules = {
  // ===== MAIN =====
  dashboard: {
    name: 'Dashboard',
    icon: Home,
    category: 'Main',
    color: '#6366f1',
    description: 'Central hub showing key metrics, quick actions, and system overview.',
    roles: ['admin', 'teacher', 'parent', 'finance', 'admissions', 'hr', 'principal'],
    features: [
      'Real-time statistics and metrics',
      'Quick action buttons for common tasks',
      'Recent activity feed',
      'Alerts and notifications',
      'Role-specific widgets and charts',
      'Student/teacher/financial summaries'
    ],
    howToUse: [
      'View your personalized dashboard after login',
      'Click on stat cards to navigate to detailed views',
      'Use quick actions for frequent tasks',
      'Check notifications for important updates',
      'Review charts for trends and patterns'
    ],
    tips: [
      'Dashboard updates automatically every few minutes',
      'Click on charts for detailed breakdowns',
      'Use the sidebar to navigate to other modules'
    ]
  },

  // ===== USER MANAGEMENT =====
  users: {
    name: 'User Management',
    icon: Users,
    category: 'Administration',
    color: '#8b5cf6',
    description: 'Manage all system users including admins, teachers, parents, and staff.',
    roles: ['admin'],
    features: [
      'Create and manage user accounts',
      'Assign roles and permissions',
      'Reset passwords',
      'Activate/deactivate accounts',
      'View login history',
      'Bulk user import via CSV',
      'User profile management'
    ],
    howToUse: [
      'Navigate to User Management → Users',
      'Click "Add User" to create new accounts',
      'Fill in user details: name, email, role, password',
      'Use the search to find specific users',
      'Click on a user row to edit their details',
      'Use the status toggle to activate/deactivate'
    ],
    tips: [
      'Use bulk import for adding many users at once',
      'Deactivate accounts instead of deleting to preserve history',
      'Assign appropriate roles to limit access',
      'Use strong passwords for all accounts'
    ]
  },
  roles: {
    name: 'Roles & Permissions',
    icon: Shield,
    category: 'Administration',
    color: '#8b5cf6',
    description: 'Define user roles and their access permissions throughout the system.',
    roles: ['admin'],
    features: [
      'Create custom roles',
      'Define granular permissions',
      'Assign modules to roles',
      'View role assignments'
    ],
    howToUse: [
      'Go to User Management → Roles & Permissions',
      'View existing roles and their permissions',
      'Click "Add Role" to create a custom role',
      'Select which modules/features the role can access',
      'Assign the role to users'
    ],
    tips: [
      'Follow principle of least privilege',
      'Create specific roles for different staff types',
      'Review permissions periodically'
    ]
  },

  // ===== ACADEMIC - STUDENTS =====
  students: {
    name: 'Students',
    icon: GraduationCap,
    category: 'Academic',
    color: '#06b6d4',
    description: 'View and manage all enrolled students with their profiles and academic records.',
    roles: ['admin', 'teacher'],
    features: [
      'Complete student directory',
      'Student profile with photo',
      'Academic history',
      'Attendance records',
      'Fee payment status',
      'Parent/guardian information',
      'Document management'
    ],
    howToUse: [
      'Navigate to Academic → Students',
      'Use search and filters to find students',
      'Click on a student to view full profile',
      'View academic records, attendance, and fees',
      'Update student information as needed'
    ],
    tips: [
      'Keep student photos updated',
      'Verify parent contact information',
      'Use filters to find students by class/section'
    ]
  },
  admissions: {
    name: 'Admissions',
    icon: GraduationCap,
    category: 'Academic',
    color: '#06b6d4',
    description: 'Handle student admission applications from submission to enrollment.',
    roles: ['admin', 'admissions'],
    features: [
      'View pending applications',
      'Review application documents',
      'Approve or reject applications',
      'Assign students to classes',
      'Generate admission letters',
      'Track application status',
      'Parent communication'
    ],
    howToUse: [
      'Go to Academic → Admissions',
      'View list of pending applications',
      'Click on an application to review details',
      'Check uploaded documents (birth certificate, photos, etc.)',
      'Approve and assign to a class, or reject with reason',
      'System notifies parent of decision'
    ],
    tips: [
      'Process applications in order of submission',
      'Check class capacity before approving',
      'Verify all required documents are present',
      'Send notifications to parents after decisions'
    ]
  },
  teachers: {
    name: 'Teachers',
    icon: Users,
    category: 'Academic',
    color: '#06b6d4',
    description: 'Manage teacher profiles, assignments, and qualifications.',
    roles: ['admin', 'hr'],
    features: [
      'Teacher directory',
      'Profile management',
      'Subject assignments',
      'Class assignments',
      'Qualification records',
      'Performance tracking'
    ],
    howToUse: [
      'Navigate to Academic → Teachers',
      'View all teachers in the system',
      'Click "Add Teacher" to register new staff',
      'Assign subjects and classes to teachers',
      'View teacher profiles and assignments'
    ],
    tips: [
      'Keep qualifications updated',
      'Balance class loads across teachers',
      'Review assignments each term'
    ]
  },

  // ===== ACADEMIC - STRUCTURE =====
  classes: {
    name: 'Classes',
    icon: School,
    category: 'Academic',
    color: '#06b6d4',
    description: 'Manage class levels, sections, and capacity.',
    roles: ['admin'],
    features: [
      'Create class levels (Grade 1, Grade 2, etc.)',
      'Add sections (A, B, C)',
      'Set class capacity',
      'Assign class teachers',
      'View enrolled students',
      'Manage class settings'
    ],
    howToUse: [
      'Navigate to Academic → Classes',
      'Click "Add Class" to create a new class level',
      'Enter class name, code, and capacity',
      'Add sections within each class',
      'Assign a class teacher to each section'
    ],
    tips: [
      'Set up classes before the academic term begins',
      'Set realistic capacity limits',
      'Use consistent naming conventions'
    ]
  },
  classSubjects: {
    name: 'Class Curriculum',
    icon: BookOpen,
    category: 'Academic',
    color: '#06b6d4',
    description: 'Assign subjects to classes and manage curriculum.',
    roles: ['admin'],
    features: [
      'Assign subjects to classes',
      'Set subject teachers',
      'Define periods per week',
      'Manage curriculum structure'
    ],
    howToUse: [
      'Go to Academic → Class Curriculum',
      'Select a class to view/edit subjects',
      'Add subjects from the subject library',
      'Assign teachers to each subject',
      'Set number of periods per week'
    ],
    tips: [
      'Ensure all core subjects are assigned',
      'Balance teacher workloads',
      'Review curriculum each academic year'
    ]
  },
  subjects: {
    name: 'Subjects',
    icon: BookMarked,
    category: 'Academic',
    color: '#06b6d4',
    description: 'Define and manage academic subjects offered by the school.',
    roles: ['admin'],
    features: [
      'Create subjects with codes',
      'Set subject types (core, elective)',
      'Define credit hours',
      'Subject descriptions',
      'Prerequisite management'
    ],
    howToUse: [
      'Go to Academic → Subjects',
      'Click "Add Subject" to create new',
      'Enter subject name, code, and type',
      'Set credit hours and description',
      'Save and assign to classes'
    ],
    tips: [
      'Use consistent subject codes',
      'Mark core vs elective subjects',
      'Include clear descriptions'
    ]
  },
  terms: {
    name: 'Academic Terms',
    icon: Calendar,
    category: 'Academic',
    color: '#06b6d4',
    description: 'Manage academic terms/semesters with dates and settings.',
    roles: ['admin'],
    features: [
      'Create academic terms',
      'Set start/end dates',
      'Set active term',
      'Term-specific settings',
      'Archive past terms'
    ],
    howToUse: [
      'Navigate to Academic → Terms',
      'Click "Add Term" to create new',
      'Enter term name, year, start and end dates',
      'Click "Set Active" when term begins',
      'Archive completed terms'
    ],
    tips: [
      'Only one term can be active at a time',
      'Set up next term before current ends',
      'Archive old terms to keep system clean'
    ]
  },
  timetable: {
    name: 'Timetable',
    icon: Clock,
    category: 'Academic',
    color: '#06b6d4',
    description: 'Create and manage class schedules and timetables.',
    roles: ['admin'],
    features: [
      'Visual timetable builder',
      'Period management',
      'Teacher availability',
      'Room assignments',
      'Conflict detection',
      'Print/export timetables'
    ],
    howToUse: [
      'Go to Academic → Timetable',
      'Select class and section',
      'Define periods and break times',
      'Drag and drop subjects into slots',
      'Assign teachers and rooms',
      'Check for conflicts and resolve'
    ],
    tips: [
      'Check teacher availability first',
      'Spread difficult subjects across days',
      'Include adequate break times'
    ]
  },
  exams: {
    name: 'Exams',
    icon: FileCheck,
    category: 'Academic',
    color: '#06b6d4',
    description: 'Schedule and manage examinations.',
    roles: ['admin'],
    features: [
      'Create exam schedules',
      'Define exam types (midterm, final)',
      'Set exam dates and times',
      'Room assignments',
      'Invigilator assignments',
      'Exam timetable generation'
    ],
    howToUse: [
      'Navigate to Academic → Exams',
      'Click "Create Exam Schedule"',
      'Select exam type and term',
      'Add subjects with dates and times',
      'Assign rooms and invigilators',
      'Publish exam timetable'
    ],
    tips: [
      'Allow adequate time between exams',
      'Check room capacity',
      'Communicate schedule early to students'
    ]
  },
  lms: {
    name: 'Learning Management (LMS)',
    icon: Video,
    category: 'Academic',
    color: '#06b6d4',
    description: 'Online learning platform with courses, content, and assessments.',
    roles: ['admin', 'teacher'],
    features: [
      'Course creation',
      'Content upload (videos, documents)',
      'Online assignments',
      'Quizzes and tests',
      'Discussion forums',
      'Progress tracking'
    ],
    howToUse: [
      'Go to Academic → LMS',
      'Create a course for your subject',
      'Upload learning materials',
      'Create assignments and quizzes',
      'Monitor student progress',
      'Provide feedback on submissions'
    ],
    tips: [
      'Organize content into modules',
      'Use varied content types',
      'Set clear deadlines'
    ]
  },

  // ===== CLASSROOM =====
  attendance: {
    name: 'Attendance',
    icon: ClipboardCheck,
    category: 'Classroom',
    color: '#f59e0b',
    description: 'Track and manage student attendance for classes.',
    roles: ['admin', 'teacher'],
    features: [
      'Daily attendance marking',
      'Multiple status options (present, absent, late, excused)',
      'Attendance history',
      'Attendance reports',
      'Pattern analysis',
      'Parent notifications'
    ],
    howToUse: [
      'Go to Classroom → Attendance',
      'Select your class and date',
      'Mark each student as present, absent, late, or excused',
      'Add notes for absences if known',
      'Click Save to record attendance',
      'View reports for patterns'
    ],
    tips: [
      'Take attendance at the start of each class',
      'Note reasons for absences',
      'Review weekly patterns to identify issues',
      'Follow up on chronic absenteeism'
    ]
  },
  grading: {
    name: 'Grading',
    icon: Award,
    category: 'Classroom',
    color: '#f59e0b',
    description: 'Enter and manage student grades, assessments, and results.',
    roles: ['admin', 'teacher'],
    features: [
      'Enter CA scores',
      'Enter exam marks',
      'Automatic grade calculation',
      'Grade scale configuration',
      'Report card generation',
      'Grade analytics',
      'Publish results'
    ],
    howToUse: [
      'Navigate to Classroom → Grading',
      'Select class, section, and subject',
      'Enter continuous assessment scores',
      'Enter examination scores',
      'System calculates final grades automatically',
      'Review and publish when ready'
    ],
    tips: [
      'Enter grades promptly after assessments',
      'Double-check entries before publishing',
      'Use analytics to identify struggling students',
      'Keep backup of grades'
    ]
  },
  homework: {
    name: 'Homework',
    icon: BookOpen,
    category: 'Classroom',
    color: '#f59e0b',
    description: 'Assign and track homework for students.',
    roles: ['admin', 'teacher', 'parent'],
    features: [
      'Create homework assignments',
      'Set due dates',
      'Attach resources',
      'Track submissions',
      'Grade submissions',
      'Provide feedback'
    ],
    howToUse: [
      'Go to Classroom → Homework',
      'Click "Create Homework"',
      'Enter title, description, and instructions',
      'Attach any resources or files',
      'Set the due date',
      'Select target class(es)',
      'Publish the assignment'
    ],
    tips: [
      'Give clear instructions',
      'Set reasonable deadlines',
      'Provide constructive feedback',
      'Allow resubmissions when appropriate'
    ]
  },

  // ===== FINANCE =====
  finance: {
    name: 'Finance Overview',
    icon: DollarSign,
    category: 'Finance',
    color: '#10b981',
    description: 'Overview of financial status, collections, and pending payments.',
    roles: ['admin', 'finance'],
    features: [
      'Financial dashboard',
      'Collection summary',
      'Pending payments',
      'Revenue trends',
      'Expense tracking',
      'Financial reports'
    ],
    howToUse: [
      'Navigate to Finance → Overview',
      'View collection summary and trends',
      'Check pending payments',
      'Monitor revenue vs expenses',
      'Generate financial reports'
    ],
    tips: [
      'Review dashboard daily',
      'Follow up on overdue payments',
      'Reconcile accounts regularly'
    ]
  },
  feeStructure: {
    name: 'Fee Structure',
    icon: CreditCard,
    category: 'Finance',
    color: '#10b981',
    description: 'Define fee types, amounts, and payment structures for each class.',
    roles: ['admin', 'finance'],
    features: [
      'Create fee types (tuition, transport, etc.)',
      'Set amounts per class level',
      'Configure payment installments',
      'Discount management',
      'Scholarship setup',
      'Fee templates'
    ],
    howToUse: [
      'Go to Finance → Fee Structure',
      'Click "Add Fee Type" to create new',
      'Enter fee name, category, and description',
      'Set amounts for each class level',
      'Configure installment options if needed',
      'Set up discounts for siblings/scholarships'
    ],
    tips: [
      'Review fee structure before each term',
      'Document any fee changes',
      'Communicate changes to parents early'
    ]
  },
  invoices: {
    name: 'Invoices',
    icon: FileText,
    category: 'Finance',
    color: '#10b981',
    description: 'Generate and manage student fee invoices.',
    roles: ['admin', 'finance'],
    features: [
      'Generate invoices',
      'Bulk invoice generation',
      'Invoice templates',
      'Send invoice notifications',
      'Track invoice status',
      'Print/email invoices'
    ],
    howToUse: [
      'Navigate to Finance → Invoices',
      'Click "Generate Invoices" for bulk creation',
      'Or create individual invoices',
      'Select students and fee items',
      'Set due date',
      'Send notifications to parents'
    ],
    tips: [
      'Generate invoices at term start',
      'Send reminders before due dates',
      'Keep invoice records organized'
    ]
  },
  payments: {
    name: 'Payments',
    icon: DollarSign,
    category: 'Finance',
    color: '#10b981',
    description: 'Record and track fee payments.',
    roles: ['admin', 'finance'],
    features: [
      'Record payments',
      'Multiple payment methods',
      'Payment receipts',
      'Payment history',
      'Partial payments',
      'Payment reconciliation'
    ],
    howToUse: [
      'Go to Finance → Payments',
      'Click "Record Payment"',
      'Select student and invoice',
      'Enter payment amount and method',
      'Add payment reference if applicable',
      'Generate and print receipt'
    ],
    tips: [
      'Record payments immediately',
      'Always issue receipts',
      'Reconcile daily'
    ]
  },

  // ===== ADVANCED FEATURES =====
  analytics: {
    name: 'Analytics',
    icon: TrendingUp,
    category: 'Advanced',
    color: '#8b5cf6',
    description: 'Advanced analytics and insights across all school data.',
    roles: ['admin', 'principal'],
    features: [
      'Performance analytics',
      'Trend analysis',
      'Predictive insights',
      'Custom dashboards',
      'Data visualization',
      'Export capabilities'
    ],
    howToUse: [
      'Navigate to Advanced → Analytics',
      'Select analysis type',
      'Choose date range and filters',
      'View charts and insights',
      'Export data as needed'
    ],
    tips: [
      'Use analytics for decision making',
      'Track trends over time',
      'Share insights with stakeholders'
    ]
  },
  transport: {
    name: 'Transport',
    icon: Truck,
    category: 'Advanced',
    color: '#8b5cf6',
    description: 'Manage school transport, routes, and vehicle tracking.',
    roles: ['admin'],
    features: [
      'Route management',
      'Vehicle tracking',
      'Driver management',
      'Student transport assignments',
      'Transport fees',
      'GPS tracking'
    ],
    howToUse: [
      'Go to Advanced → Transport',
      'Set up routes and stops',
      'Add vehicles and drivers',
      'Assign students to routes',
      'Track vehicles in real-time'
    ],
    tips: [
      'Optimize routes for efficiency',
      'Keep driver records updated',
      'Communicate delays to parents'
    ]
  },
  hrPayroll: {
    name: 'HR & Payroll',
    icon: Briefcase,
    category: 'Advanced',
    color: '#8b5cf6',
    description: 'Human resources and payroll management for staff.',
    roles: ['admin', 'hr'],
    features: [
      'Employee management',
      'Salary structure',
      'Payroll processing',
      'Leave management',
      'Attendance tracking',
      'Tax calculations',
      'Payslip generation'
    ],
    howToUse: [
      'Navigate to Advanced → HR & Payroll',
      'Set up employee records',
      'Configure salary structures',
      'Process monthly payroll',
      'Manage leave requests',
      'Generate payslips'
    ],
    tips: [
      'Keep employee records current',
      'Process payroll on schedule',
      'Maintain compliance with tax laws'
    ]
  },
  biometric: {
    name: 'Biometric',
    icon: Fingerprint,
    category: 'Advanced',
    color: '#8b5cf6',
    description: 'Biometric attendance and access control integration.',
    roles: ['admin'],
    features: [
      'Fingerprint enrollment',
      'Biometric attendance',
      'Access control',
      'Device management',
      'Attendance sync'
    ],
    howToUse: [
      'Go to Advanced → Biometric',
      'Configure biometric devices',
      'Enroll student/staff fingerprints',
      'Set up attendance sync',
      'Monitor access logs'
    ],
    tips: [
      'Enroll multiple fingers per person',
      'Clean devices regularly',
      'Have backup attendance method'
    ]
  },
  multiSchool: {
    name: 'Multi-School',
    icon: Building,
    category: 'Advanced',
    color: '#8b5cf6',
    description: 'Manage multiple school branches from one system.',
    roles: ['admin'],
    features: [
      'Branch management',
      'Centralized reporting',
      'Cross-branch transfers',
      'Unified settings',
      'Branch-specific customization'
    ],
    howToUse: [
      'Navigate to Advanced → Multi-School',
      'Add school branches',
      'Configure branch settings',
      'View consolidated reports',
      'Manage cross-branch operations'
    ],
    tips: [
      'Standardize processes across branches',
      'Use consolidated reports for oversight',
      'Allow branch-specific customizations'
    ]
  },
  aiFeatures: {
    name: 'AI Features',
    icon: Brain,
    category: 'Advanced',
    color: '#8b5cf6',
    description: 'AI-powered insights, predictions, and automation.',
    roles: ['admin', 'teacher'],
    features: [
      'Performance predictions',
      'At-risk student identification',
      'Automated insights',
      'Smart recommendations',
      'Natural language queries',
      'AI chatbot assistance'
    ],
    howToUse: [
      'Go to Advanced → AI Features',
      'View AI-generated insights',
      'Check at-risk student alerts',
      'Use AI chatbot for help',
      'Review recommendations'
    ],
    tips: [
      'Review AI insights regularly',
      'Act on at-risk alerts promptly',
      'Provide feedback to improve AI'
    ]
  },

  // ===== COMMUNICATION =====
  messages: {
    name: 'Messages',
    icon: MessageSquare,
    category: 'Communication',
    color: '#ec4899',
    description: 'Internal messaging system for school communication.',
    roles: ['admin', 'teacher', 'parent'],
    features: [
      'Send messages',
      'Receive messages',
      'Group messaging',
      'Message history',
      'Attachments'
    ],
    howToUse: [
      'Go to Communication → Messages',
      'Click "New Message"',
      'Select recipients',
      'Compose message',
      'Attach files if needed',
      'Send'
    ],
    tips: [
      'Keep messages professional',
      'Use groups for class-wide communication',
      'Check messages regularly'
    ]
  },
  whatsapp: {
    name: 'WhatsApp Messaging',
    icon: MessageCircle,
    category: 'Communication',
    color: '#ec4899',
    description: 'Send notifications and updates via WhatsApp.',
    roles: ['admin'],
    features: [
      'WhatsApp integration',
      'Bulk messaging',
      'Template messages',
      'Delivery tracking',
      'Automated notifications'
    ],
    howToUse: [
      'Navigate to Communication → WhatsApp',
      'Configure WhatsApp API',
      'Create message templates',
      'Select recipients',
      'Send messages'
    ],
    tips: [
      'Use templates for common messages',
      'Respect messaging limits',
      'Track delivery status'
    ]
  },
  sms: {
    name: 'SMS Messaging',
    icon: Phone,
    category: 'Communication',
    color: '#ec4899',
    description: 'Send SMS notifications to parents and staff.',
    roles: ['admin'],
    features: [
      'SMS gateway integration',
      'Bulk SMS',
      'SMS templates',
      'Delivery reports',
      'Credit management'
    ],
    howToUse: [
      'Go to Communication → SMS',
      'Configure SMS gateway',
      'Create message templates',
      'Select recipients',
      'Send SMS'
    ],
    tips: [
      'Keep SMS short and clear',
      'Monitor SMS credits',
      'Use for urgent notifications'
    ]
  },
  email: {
    name: 'Email Messaging',
    icon: Mail,
    category: 'Communication',
    color: '#ec4899',
    description: 'Send email communications to parents and staff.',
    roles: ['admin'],
    features: [
      'Email templates',
      'Bulk email',
      'HTML formatting',
      'Attachments',
      'Delivery tracking'
    ],
    howToUse: [
      'Navigate to Communication → Email',
      'Configure email settings',
      'Create email templates',
      'Compose or use template',
      'Select recipients and send'
    ],
    tips: [
      'Use professional templates',
      'Include clear subject lines',
      'Avoid spam triggers'
    ]
  },

  // ===== REPORTS =====
  reports: {
    name: 'Reports Hub',
    icon: BarChart3,
    category: 'Reports',
    color: '#64748b',
    description: 'Central hub for all system reports.',
    roles: ['admin', 'finance', 'principal'],
    features: [
      'Academic reports',
      'Financial reports',
      'Student reports',
      'Executive summaries',
      'Custom reports',
      'Export options'
    ],
    howToUse: [
      'Navigate to Reports',
      'Select report category',
      'Choose specific report',
      'Set filters and date range',
      'Generate and export'
    ],
    tips: [
      'Schedule regular reports',
      'Use filters effectively',
      'Export for offline analysis'
    ]
  },
  bulkImport: {
    name: 'Bulk Import',
    icon: Upload,
    category: 'Reports',
    color: '#64748b',
    description: 'Import data in bulk via CSV files.',
    roles: ['admin'],
    features: [
      'Student import',
      'Teacher import',
      'User import',
      'Data validation',
      'Error reporting',
      'Template downloads'
    ],
    howToUse: [
      'Go to Reports → Bulk Import',
      'Download CSV template',
      'Fill in data following template format',
      'Upload completed CSV',
      'Review validation results',
      'Confirm import'
    ],
    tips: [
      'Always use provided templates',
      'Validate data before upload',
      'Start with small batches'
    ]
  },
  systemLogs: {
    name: 'System Logs',
    icon: Activity,
    category: 'Reports',
    color: '#64748b',
    description: 'View system activity and audit logs.',
    roles: ['admin'],
    features: [
      'Activity logs',
      'Login history',
      'Change tracking',
      'Error logs',
      'Security events'
    ],
    howToUse: [
      'Navigate to Reports → System Logs',
      'Filter by date, user, or action',
      'View log details',
      'Export logs if needed'
    ],
    tips: [
      'Review logs regularly',
      'Investigate unusual activity',
      'Archive old logs'
    ]
  },

  // ===== SYSTEM =====
  systemConfig: {
    name: 'System Configuration',
    icon: Sliders,
    category: 'System',
    color: '#64748b',
    description: 'Configure system-wide settings and preferences.',
    roles: ['admin'],
    features: [
      'School information',
      'Logo and branding',
      'Academic settings',
      'Notification settings',
      'Email configuration',
      'System preferences'
    ],
    howToUse: [
      'Go to System → System Configuration',
      'Update school name, address, contact',
      'Upload school logo',
      'Configure academic year settings',
      'Set up email/SMS gateways',
      'Save changes'
    ],
    tips: [
      'Complete all settings during setup',
      'Keep information current',
      'Test notification settings'
    ]
  },
  systemReset: {
    name: 'System Reset',
    icon: RefreshCw,
    category: 'System',
    color: '#64748b',
    description: 'Reset system data for new academic year or fresh start.',
    roles: ['admin'],
    features: [
      'Selective data reset',
      'Academic year rollover',
      'Data backup',
      'Archive old data'
    ],
    howToUse: [
      'Navigate to System → System Reset',
      'Select what to reset',
      'Create backup first',
      'Confirm reset action',
      'System processes reset'
    ],
    tips: [
      'ALWAYS backup before reset',
      'Use for academic year transitions',
      'Test in staging first if possible'
    ]
  }
};

// Workflows data
const workflows = [
  {
    id: 'system_setup',
    name: 'New School Setup Guide',
    icon: Rocket,
    description: 'Complete step-by-step guide to set up your school from scratch',
    steps: [
      { title: 'Configure School Info', description: 'Go to System Configuration. Enter school name, address, phone, email. Upload school logo.', role: 'Admin' },
      { title: 'Create Academic Terms', description: 'Go to Academic → Terms. Create your first term with start/end dates. Set it as active.', role: 'Admin' },
      { title: 'Set Up Classes', description: 'Go to Academic → Classes. Create all class levels (Grade 1, 2, 3, etc.). Add sections (A, B, C) to each class.', role: 'Admin' },
      { title: 'Create Subjects', description: 'Go to Academic → Subjects. Add all subjects offered (Math, English, Science, etc.).', role: 'Admin' },
      { title: 'Assign Subjects to Classes', description: 'Go to Academic → Class Curriculum. For each class, assign the subjects that will be taught.', role: 'Admin' },
      { title: 'Set Up Fee Structure', description: 'Go to Finance → Fee Structure. Create fee types (Tuition, Transport, etc.). Set amounts for each class.', role: 'Admin' },
      { title: 'Add Staff Users', description: 'Go to User Management → Users. Create accounts for teachers, finance staff, admissions staff.', role: 'Admin' },
      { title: 'Assign Teachers', description: 'Go to Academic → Teachers. Assign subjects and classes to each teacher.', role: 'Admin' },
      { title: 'Configure Notifications', description: 'Go to System Configuration → Notifications. Set up email/SMS gateways if needed.', role: 'Admin' },
      { title: 'Ready for Admissions', description: 'System is now ready! Parents can register and apply for admission.', role: 'System' }
    ]
  },
  {
    id: 'admission_enrollment',
    name: 'Admission to Enrollment',
    icon: GraduationCap,
    description: 'Complete process from application to student enrollment',
    steps: [
      { title: 'Parent Registers', description: 'Parent creates an account on the system', role: 'Parent' },
      { title: 'Submit Application', description: 'Parent fills admission form, uploads documents (birth certificate, photos, previous reports)', role: 'Parent' },
      { title: 'Review Application', description: 'Admissions staff reviews application and verifies documents', role: 'Admissions' },
      { title: 'Approve/Reject', description: 'Decision made on application. If rejected, reason is provided.', role: 'Admissions' },
      { title: 'Assign Class', description: 'Approved student is assigned to appropriate class and section', role: 'Admin' },
      { title: 'Generate Invoice', description: 'Fee invoice is automatically generated based on class fee structure', role: 'System' },
      { title: 'Payment', description: 'Parent views invoice and makes payment via available methods', role: 'Parent' },
      { title: 'Enrollment Complete', description: 'Student is fully enrolled and appears in class roster', role: 'System' }
    ]
  },
  {
    id: 'term_setup',
    name: 'New Term/Semester Setup',
    icon: Calendar,
    description: 'How to prepare the system for a new academic term',
    steps: [
      { title: 'Create New Term', description: 'Go to Academic → Terms. Click Add Term. Enter name, year, start and end dates.', role: 'Admin' },
      { title: 'Review Fee Structure', description: 'Check if fee amounts need updating for the new term. Update if necessary.', role: 'Admin' },
      { title: 'Promote Students (if new year)', description: 'If starting a new academic year, promote students to next class level.', role: 'Admin' },
      { title: 'Update Class Assignments', description: 'Review and update teacher-class-subject assignments if needed.', role: 'Admin' },
      { title: 'Set Term as Active', description: 'When ready to start, set the new term as active. Previous term becomes inactive.', role: 'Admin' },
      { title: 'Generate Invoices', description: 'Generate fee invoices for all enrolled students for the new term.', role: 'Finance' },
      { title: 'Notify Parents', description: 'Send notifications to parents about new term and pending fees.', role: 'System' }
    ]
  },
  {
    id: 'grade_entry',
    name: 'Grade Entry Process',
    icon: BarChart3,
    description: 'How grades are entered and results published',
    steps: [
      { title: 'Enter CA Scores', description: 'Teacher goes to Grading, selects class/subject, enters continuous assessment scores', role: 'Teacher' },
      { title: 'Enter Exam Scores', description: 'After exams, teacher enters examination scores for each student', role: 'Teacher' },
      { title: 'Calculate Grades', description: 'System automatically calculates final grades based on CA + Exam weights', role: 'System' },
      { title: 'Review Results', description: 'Admin/Principal reviews results for accuracy and completeness', role: 'Admin' },
      { title: 'Publish Results', description: 'Admin publishes results, making them visible to parents', role: 'Admin' },
      { title: 'Generate Report Cards', description: 'System generates printable report cards for each student', role: 'System' },
      { title: 'Parent Views Results', description: 'Parents can view and download their children\'s report cards', role: 'Parent' }
    ]
  },
  {
    id: 'fee_collection',
    name: 'Fee Collection',
    icon: DollarSign,
    description: 'From fee structure setup to payment collection',
    steps: [
      { title: 'Setup Fee Structure', description: 'Define fee types (Tuition, Transport, Uniform, etc.) and amounts per class', role: 'Admin' },
      { title: 'Generate Invoices', description: 'Create invoices for enrolled students - can be done in bulk', role: 'Finance' },
      { title: 'Send Notifications', description: 'System sends invoice notifications to parents via email/SMS', role: 'System' },
      { title: 'Parent Views Invoice', description: 'Parent logs in and views pending invoice with breakdown', role: 'Parent' },
      { title: 'Make Payment', description: 'Parent pays via mobile money, bank transfer, or at school office', role: 'Parent' },
      { title: 'Record Payment', description: 'Finance staff records the payment against the invoice', role: 'Finance' },
      { title: 'Issue Receipt', description: 'System generates receipt which parent can download/print', role: 'System' },
      { title: 'Track Outstanding', description: 'Finance monitors outstanding balances and sends reminders', role: 'Finance' }
    ]
  },
  {
    id: 'daily_attendance',
    name: 'Daily Attendance Workflow',
    icon: ClipboardCheck,
    description: 'How to take and manage daily attendance',
    steps: [
      { title: 'Open Attendance', description: 'Teacher goes to Attendance module and selects their class', role: 'Teacher' },
      { title: 'Select Date', description: 'Choose today\'s date (defaults to current date)', role: 'Teacher' },
      { title: 'Mark Students', description: 'For each student, mark as Present, Absent, Late, or Excused', role: 'Teacher' },
      { title: 'Add Notes', description: 'Add notes for absences if reason is known (e.g., "Sick", "Family emergency")', role: 'Teacher' },
      { title: 'Save Attendance', description: 'Click Save to record the attendance for the day', role: 'Teacher' },
      { title: 'Parent Notification', description: 'Parents of absent students receive automatic notification', role: 'System' },
      { title: 'Review Reports', description: 'Admin can view attendance reports and identify patterns', role: 'Admin' }
    ]
  }
];

// FAQ data
const faqs = [
  {
    category: 'Getting Started',
    questions: [
      { q: 'How do I log in to the system?', a: 'Use your email and password provided by the school administrator. If you forgot your password, click "Forgot Password" on the login page.' },
      { q: 'How do I change my password?', a: 'Go to your Profile settings and click "Change Password". Enter your current password and your new password.' },
      { q: 'What should I do if I cannot access certain features?', a: 'Your access depends on your role. Contact your administrator if you believe you should have access to a feature.' }
    ]
  },
  {
    category: 'For Parents',
    questions: [
      { q: 'How do I apply for admission?', a: 'Click "Apply for Admission" in your dashboard, fill in the required information, upload documents, and submit.' },
      { q: 'How do I pay school fees?', a: 'Go to Invoices, select the pending invoice, and click "Pay Now". You can pay via mobile money or bank transfer.' },
      { q: 'How do I view my child\'s results?', a: 'Navigate to Results in your dashboard. Select your child and the term to view their report card.' }
    ]
  },
  {
    category: 'For Teachers',
    questions: [
      { q: 'How do I take attendance?', a: 'Go to Attendance, select your class and date, mark each student, and save.' },
      { q: 'How do I enter grades?', a: 'Navigate to Grading, select your class and subject, enter scores for each student, and save.' },
      { q: 'How do I assign homework?', a: 'Go to Homework, click "Create Homework", fill in details, select the class, and publish.' }
    ]
  },
  {
    category: 'For Administrators',
    questions: [
      { q: 'How do I add a new user?', a: 'Go to Users, click "Add User", fill in the details, assign a role, and save.' },
      { q: 'How do I set up a new academic term?', a: 'Navigate to Academic Terms, click "Add Term", enter dates and details, and save. Set it as active when ready.' },
      { q: 'How do I generate reports?', a: 'Go to Reports, select the report type, set filters and date range, and click Generate.' }
    ]
  }
];

// Role-based quick links
const getQuickLinks = (role) => {
  const links = {
    admin: [
      { label: 'Add User', path: '/admin/users', icon: Users },
      { label: 'View Admissions', path: '/admin/admissions', icon: GraduationCap },
      { label: 'Manage Classes', path: '/admin/classes', icon: School },
      { label: 'System Settings', path: '/admin/system-config', icon: Settings }
    ],
    teacher: [
      { label: 'My Classes', path: '/teacher/classes', icon: School },
      { label: 'Take Attendance', path: '/teacher/attendance', icon: ClipboardCheck },
      { label: 'Enter Grades', path: '/teacher/grading', icon: BarChart3 },
      { label: 'Assign Homework', path: '/teacher/homework', icon: FileText }
    ],
    parent: [
      { label: 'My Children', path: '/parent/dashboard', icon: Users },
      { label: 'Apply for Admission', path: '/parent/apply', icon: GraduationCap },
      { label: 'View Invoices', path: '/parent/invoices', icon: CreditCard },
      { label: 'View Results', path: '/parent/results', icon: BarChart3 }
    ],
    finance: [
      { label: 'Finance Dashboard', path: '/finance/dashboard', icon: CreditCard },
      { label: 'Pending Invoices', path: '/admin/invoices', icon: Clock },
      { label: 'Record Payment', path: '/admin/payments', icon: DollarSign },
      { label: 'Financial Reports', path: '/admin/reports/financial', icon: BarChart3 }
    ]
  };
  return links[role] || links.parent;
};

export default function HelpCenter() {
  const { user } = useAuthStore();
  const userRole = user?.user_type || user?.role || 'parent';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activeTab, setActiveTab] = useState('setup');

  const quickLinks = getQuickLinks(userRole);

  // Filter modules based on search
  const filteredModules = Object.entries(modules).filter(([id, mod]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return mod.name.toLowerCase().includes(query) ||
           mod.description.toLowerCase().includes(query) ||
           mod.category.toLowerCase().includes(query);
  });

  // Get modules relevant to user's role
  const relevantModules = Object.entries(modules).filter(([id, mod]) => 
    mod.roles.includes(userRole)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
        <div className="flex items-center gap-3 mb-4">
          <HelpCircle className="w-10 h-10" />
          <h1 className="text-3xl font-bold">Help Center</h1>
        </div>
        <p className="text-indigo-100 mb-6 max-w-2xl">
          Learn how to use each module in the system and understand how they work together
        </p>
        
        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-full bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-600" />
          Quick Actions for {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link, idx) => (
            <Link
              key={idx}
              to={link.path}
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-500 hover:shadow-lg transition-all"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white">
                <link.icon className="w-5 h-5" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {[
          { id: 'setup', label: 'Getting Started', icon: Rocket },
          { id: 'modules', label: 'All Modules', icon: BookOpen },
          { id: 'workflows', label: 'Workflows', icon: Workflow },
          { id: 'faq', label: 'FAQ', icon: HelpCircle }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-indigo-600 border-indigo-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Getting Started Tab */}
      {activeTab === 'setup' && (
        <div className="space-y-6">
          {/* New School Setup */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white mb-6">
            <div className="flex items-center gap-3 mb-3">
              <Rocket className="w-8 h-8" />
              <h2 className="text-2xl font-bold">New School Setup Guide</h2>
            </div>
            <p className="opacity-90">Follow these steps to set up your school management system from scratch</p>
          </div>

          {/* Setup Steps */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="relative">
              {workflows.find(w => w.id === 'system_setup')?.steps.map((step, idx) => (
                <div key={idx} className="relative pl-10 pb-8 last:pb-0">
                  {/* Timeline line */}
                  {idx < 9 && (
                    <div className="absolute left-4 top-8 w-0.5 h-full bg-gradient-to-b from-green-500 to-emerald-500" />
                  )}
                  {/* Step number */}
                  <div className="absolute left-0 top-0 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{step.title}</h4>
                      <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full">
                        {step.role}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Setup Checklist */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Setup Checklist
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { item: 'School name and logo configured', link: '/admin/system-config' },
                { item: 'Academic term created and activated', link: '/admin/terms' },
                { item: 'Classes and sections set up', link: '/admin/classes' },
                { item: 'Subjects created', link: '/admin/subjects' },
                { item: 'Subjects assigned to classes', link: '/admin/class-subjects' },
                { item: 'Fee structure configured', link: '/admin/fee-structure' },
                { item: 'Teacher accounts created', link: '/admin/teachers' },
                { item: 'Teachers assigned to classes', link: '/admin/teachers' }
              ].map((check, idx) => (
                <Link
                  key={idx}
                  to={check.link}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{check.item}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              ))}
            </div>
          </div>

          {/* Video Tutorials Placeholder */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-600" />
              Video Tutorials
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { title: 'System Overview', duration: '5 min' },
                { title: 'Setting Up Classes', duration: '3 min' },
                { title: 'Managing Admissions', duration: '4 min' }
              ].map((video, idx) => (
                <div key={idx} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Play className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{video.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{video.duration}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-500 text-sm mt-4">Video tutorials coming soon!</p>
          </div>
        </div>
      )}

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          {/* Relevant Modules */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Modules Available to You
            </h3>
            <div className="grid gap-3">
              {relevantModules.map(([id, mod]) => (
                <button
                  key={id}
                  onClick={() => setSelectedModule(selectedModule === id ? null : id)}
                  className="w-full text-left"
                >
                  <div className={`p-4 bg-white dark:bg-gray-800 rounded-xl border transition-all ${
                    selectedModule === id 
                      ? 'border-indigo-500 shadow-lg' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: mod.color }}
                      >
                        <mod.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{mod.name}</h4>
                        <p className="text-sm text-gray-500">{mod.description}</p>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                        selectedModule === id ? 'rotate-180' : ''
                      }`} />
                    </div>
                    
                    {selectedModule === id && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
                        {/* Features */}
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4 text-indigo-600" /> Key Features
                          </h5>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {mod.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* How to Use */}
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <Play className="w-4 h-4 text-indigo-600" /> How to Use
                          </h5>
                          <ol className="space-y-2">
                            {mod.howToUse.map((step, idx) => (
                              <li key={idx} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center flex-shrink-0 font-medium">
                                  {idx + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                        
                        {/* Tips */}
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500" /> Tips
                          </h5>
                          <ul className="space-y-1">
                            {mod.tips.map((tip, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <span className="text-yellow-500">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* All Modules by Category */}
          {searchQuery && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Search Results
              </h3>
              <div className="grid gap-3">
                {filteredModules.map(([id, mod]) => (
                  <div
                    key={id}
                    className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: mod.color }}
                      >
                        <mod.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{mod.name}</h4>
                        <p className="text-sm text-gray-500">{mod.category}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-gray-300">
            Understand how different modules work together to complete common tasks.
          </p>
          
          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <button
                  onClick={() => setSelectedWorkflow(selectedWorkflow === workflow.id ? null : workflow.id)}
                  className="w-full p-4 flex items-center gap-4 text-left"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white">
                    <workflow.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{workflow.name}</h4>
                    <p className="text-sm text-gray-500">{workflow.description}</p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                    selectedWorkflow === workflow.id ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {selectedWorkflow === workflow.id && (
                  <div className="px-4 pb-4">
                    <div className="relative pl-8 space-y-4">
                      {workflow.steps.map((step, idx) => (
                        <div key={idx} className="relative">
                          {/* Timeline line */}
                          {idx < workflow.steps.length - 1 && (
                            <div className="absolute left-[-20px] top-8 w-0.5 h-full bg-indigo-200 dark:bg-indigo-800" />
                          )}
                          {/* Timeline dot */}
                          <div className="absolute left-[-24px] top-1 w-2 h-2 bg-indigo-500 rounded-full" />
                          
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-medium text-gray-900 dark:text-white">{step.title}</h5>
                              <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full">
                                {step.role}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          {faqs.map((category, catIdx) => (
            <div key={catIdx}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.questions.map((qa, qaIdx) => {
                  const faqId = `${catIdx}-${qaIdx}`;
                  return (
                    <div
                      key={qaIdx}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === faqId ? null : faqId)}
                        className="w-full p-4 flex items-center gap-3 text-left"
                      >
                        <HelpCircle className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                        <span className="flex-1 font-medium text-gray-900 dark:text-white">{qa.q}</span>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedFaq === faqId ? 'rotate-180' : ''
                        }`} />
                      </button>
                      {expandedFaq === faqId && (
                        <div className="px-4 pb-4 pl-12">
                          <p className="text-gray-600 dark:text-gray-300">{qa.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Still Need Help */}
      <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold mb-2">Still Need Help?</h3>
        <p className="text-indigo-100 mb-4">Contact your school administrator for additional support</p>
      </div>
    </div>
  );
}
