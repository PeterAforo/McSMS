import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// Core components loaded immediately
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import DashboardLayout from './components/layout/DashboardLayout';
import Unauthorized from './pages/Unauthorized';
import ErrorBoundary from './components/shared/ErrorBoundary';

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Lazy loaded components - Auth
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Activate = lazy(() => import('./pages/auth/Activate'));
const ForcePasswordChange = lazy(() => import('./pages/auth/ForcePasswordChange'));

// Lazy loaded - Shared components
const AIChatbot = lazy(() => import('./components/shared/AIChatbot'));
const DynamicFavicon = lazy(() => import('./components/shared/DynamicFavicon'));
const Profile = lazy(() => import('./pages/shared/Profile'));
const Notifications = lazy(() => import('./pages/shared/Notifications'));
const HelpCenter = lazy(() => import('./pages/shared/HelpCenter'));

// Lazy loaded - Admin pages (largest bundle reduction)
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const Users = lazy(() => import('./pages/admin/Users'));
const Students = lazy(() => import('./pages/admin/Students'));
const StudentProfile = lazy(() => import('./pages/admin/StudentProfile'));
const Admissions = lazy(() => import('./pages/admin/Admissions'));
const Classes = lazy(() => import('./pages/admin/Classes'));
const ClassSubjects = lazy(() => import('./pages/admin/ClassSubjects'));
const EducationLevels = lazy(() => import('./pages/admin/EducationLevels'));
const Subjects = lazy(() => import('./pages/admin/Subjects'));
const Terms = lazy(() => import('./pages/admin/Terms'));
const Teachers = lazy(() => import('./pages/admin/Teachers'));
const TeacherProfile = lazy(() => import('./pages/admin/TeacherProfile'));
const Finance = lazy(() => import('./pages/admin/Finance'));
const FeeStructure = lazy(() => import('./pages/admin/FeeStructure'));
const Invoices = lazy(() => import('./pages/admin/Invoices'));
const Payments = lazy(() => import('./pages/admin/Payments'));
const Attendance = lazy(() => import('./pages/admin/Attendance'));
const Grading = lazy(() => import('./pages/admin/Grading'));
const Homework = lazy(() => import('./pages/admin/Homework'));
const RoleManagement = lazy(() => import('./pages/admin/RoleManagement'));
const BulkImport = lazy(() => import('./pages/admin/BulkImport'));
const SystemLogs = lazy(() => import('./pages/admin/SystemLogs'));
const SystemConfiguration = lazy(() => import('./pages/admin/SystemConfiguration'));
const SystemReset = lazy(() => import('./pages/admin/SystemReset'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const AcademicReports = lazy(() => import('./pages/admin/AcademicReports'));
const FinancialReports = lazy(() => import('./pages/admin/FinancialReports'));
const AdminStudentReports = lazy(() => import('./pages/admin/StudentReports'));
const ExecutiveReports = lazy(() => import('./pages/admin/ExecutiveReports'));
const Timetable = lazy(() => import('./pages/admin/Timetable'));
const Exams = lazy(() => import('./pages/admin/Exams'));
const LMS = lazy(() => import('./pages/admin/LMS'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const Transport = lazy(() => import('./pages/admin/Transport'));
const HRPayroll = lazy(() => import('./pages/admin/HRPayroll'));
const Biometric = lazy(() => import('./pages/admin/Biometric'));
const MultiSchool = lazy(() => import('./pages/admin/MultiSchool'));
const AIFeatures = lazy(() => import('./pages/admin/AIFeatures'));
const AdvancedAnalytics = lazy(() => import('./pages/admin/AdvancedAnalytics'));
const HRManagement = lazy(() => import('./pages/admin/HRManagement'));
const AlumniManagement = lazy(() => import('./pages/admin/AlumniManagement'));
const IntegrationHub = lazy(() => import('./pages/admin/IntegrationHub'));
const ReportBuilder = lazy(() => import('./pages/admin/ReportBuilder'));
const VideoConferencing = lazy(() => import('./pages/admin/VideoConferencing'));
const ComprehensiveDashboard = lazy(() => import('./pages/admin/ComprehensiveDashboard'));
const DashboardSelector = lazy(() => import('./pages/admin/DashboardSelector'));
const GalleryManagement = lazy(() => import('./pages/admin/GalleryManagement'));
const WhatsAppMessaging = lazy(() => import('./pages/admin/WhatsAppMessaging'));
const SMSMessaging = lazy(() => import('./pages/admin/SMSMessaging'));
const EmailMessaging = lazy(() => import('./pages/admin/EmailMessaging'));
const MessageCenter = lazy(() => import('./pages/admin/MessageCenter'));
const AdminMessages = lazy(() => import('./pages/admin/Messages'));
const StudentDiscounts = lazy(() => import('./pages/admin/StudentDiscounts'));
const Promotions = lazy(() => import('./pages/admin/Promotions'));
const Accounting = lazy(() => import('./pages/admin/Accounting'));
const ParentChildren = lazy(() => import('./pages/admin/ParentChildren'));

// Lazy loaded - Role dashboards
const PrincipalDashboard = lazy(() => import('./pages/principal/PrincipalDashboard'));
const StaffOverview = lazy(() => import('./pages/principal/StaffOverview'));
const AcademicPerformance = lazy(() => import('./pages/principal/AcademicPerformance'));
const SchoolCalendar = lazy(() => import('./pages/principal/SchoolCalendar'));
const HRDashboard = lazy(() => import('./pages/hr/HRDashboard'));
const EmployeeManagement = lazy(() => import('./pages/hr/EmployeeManagement'));
const LeaveManagement = lazy(() => import('./pages/hr/LeaveManagement'));
const PayrollManagement = lazy(() => import('./pages/hr/PayrollManagement'));
const PerformanceReviews = lazy(() => import('./pages/hr/PerformanceReviews'));
const SalaryStructures = lazy(() => import('./pages/hr/SalaryStructures'));
const FinanceDashboard = lazy(() => import('./pages/finance/FinanceDashboard'));
const InvoiceManagement = lazy(() => import('./pages/finance/InvoiceManagement'));
const PaymentTracking = lazy(() => import('./pages/finance/PaymentTracking'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const StudentHomework = lazy(() => import('./pages/student/StudentHomework'));
const StudentGrades = lazy(() => import('./pages/student/StudentGrades'));
const StudentAttendance = lazy(() => import('./pages/student/StudentAttendance'));
const StudentTimetable = lazy(() => import('./pages/student/StudentTimetable'));
const StudentMessages = lazy(() => import('./pages/student/StudentMessages'));

// Lazy loaded - Teacher pages
const TeacherComprehensiveDashboard = lazy(() => import('./pages/teacher/Dashboard'));
const MyClasses = lazy(() => import('./pages/teacher/MyClasses'));
const TeacherStudents = lazy(() => import('./pages/teacher/Students'));
const TeacherAttendance = lazy(() => import('./pages/teacher/TeacherAttendance'));
const TeacherHomework = lazy(() => import('./pages/teacher/TeacherHomework'));
const TeacherHomeworkReview = lazy(() => import('./pages/teacher/TeacherHomeworkReview'));
const TeacherGrading = lazy(() => import('./pages/teacher/TeacherGrading'));
const TeacherMessages = lazy(() => import('./pages/teacher/Messages'));
const TeacherSettings = lazy(() => import('./pages/teacher/Settings'));
const TeacherStudentReports = lazy(() => import('./pages/teacher/StudentReports'));
const AIInsights = lazy(() => import('./pages/teacher/AIInsights'));
const HRPortal = lazy(() => import('./pages/teacher/HRPortal'));
const LessonPlanning = lazy(() => import('./pages/teacher/LessonPlanning'));
const StudentProgress = lazy(() => import('./pages/teacher/StudentProgress'));
const BehaviorTracking = lazy(() => import('./pages/teacher/BehaviorTracking'));
const ResourceLibrary = lazy(() => import('./pages/teacher/ResourceLibrary'));
const SeatingChart = lazy(() => import('./pages/teacher/SeatingChart'));
const SubstituteMode = lazy(() => import('./pages/teacher/SubstituteMode'));
const TeacherReportCards = lazy(() => import('./pages/teacher/ReportCards'));

// Lazy loaded - Admin pages (report card approval)
const ReportCardApproval = lazy(() => import('./pages/admin/ReportCardApproval'));

// Lazy loaded - Parent pages
const ParentComprehensiveDashboard = lazy(() => import('./pages/parent/ParentDashboard'));
const ApplyForAdmission = lazy(() => import('./pages/parent/ApplyForAdmission'));
const ChildDetails = lazy(() => import('./pages/parent/ChildDetails'));
const TermEnrollment = lazy(() => import('./pages/parent/TermEnrollment'));
const ParentInvoices = lazy(() => import('./pages/parent/Invoices'));
const ParentPayments = lazy(() => import('./pages/parent/Payments'));
const ParentMessages = lazy(() => import('./pages/parent/Messages'));
const ParentSettings = lazy(() => import('./pages/parent/Settings'));
const ChildHomework = lazy(() => import('./pages/parent/ChildHomework'));
const ChildResults = lazy(() => import('./pages/parent/ChildResults'));
const ChildAttendance = lazy(() => import('./pages/parent/ChildAttendance'));
const ChildGrades = lazy(() => import('./pages/parent/ChildGrades'));
const ChildHomeworkView = lazy(() => import('./pages/parent/ChildHomeworkView'));
const ChildTeachers = lazy(() => import('./pages/parent/ChildTeachers'));
const ChildReportCards = lazy(() => import('./pages/parent/ChildReportCards'));
const ParentMeetings = lazy(() => import('./pages/parent/ParentMeetings'));

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Force password change before allowing access to any protected route
  if (user?.must_change_password) {
    return <Navigate to="/force-password-change" replace />;
  }

  // Check user_type or role field (different APIs may use different field names)
  const rawRole = user?.user_type || user?.role || user?.type || '';
  // Normalize: lowercase, trim, collapse spaces/hyphens to underscores
  const normalize = (r) => String(r).trim().toLowerCase().replace(/[\s-]+/g, '_');
  const userRole = normalize(rawRole);

  // Super admin has universal access to every route
  if (userRole === 'super_admin' || userRole === 'superadmin') {
    return children;
  }

  if (allowedRoles) {
    const normalizedAllowed = allowedRoles.map(normalize);
    if (!normalizedAllowed.includes(userRole)) {
      console.log('Access denied - User role:', rawRole, '(normalized:', userRole, ') Allowed roles:', allowedRoles);
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}

// Theme initializer component
function ThemeInitializer({ children }) {
  const { applyTheme } = useThemeStore();
  
  useEffect(() => {
    applyTheme();
  }, []);
  
  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <DynamicFavicon />
        </Suspense>
        <Suspense fallback={<PageLoader />}>
          <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/activate" element={<Activate />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/force-password-change" element={<ForcePasswordChange />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin', 'librarian', 'receptionist', 'employee', 'staff']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:studentId" element={<StudentProfile />} />
          <Route path="admissions" element={<Admissions />} />
          <Route path="classes" element={<Classes />} />
          <Route path="class-subjects" element={<ClassSubjects />} />
          <Route path="education-levels" element={<EducationLevels />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="terms" element={<Terms />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="teachers/:teacherId" element={<TeacherProfile />} />
          <Route path="finance" element={<Finance />} />
          <Route path="fee-structure" element={<FeeStructure />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="payments" element={<Payments />} />
          <Route path="discounts" element={<StudentDiscounts />} />
          <Route path="accounting" element={<Accounting />} />
          <Route path="accounting/:tab" element={<Accounting />} />
          <Route path="parent-children" element={<ParentChildren />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="grading" element={<Grading />} />
          <Route path="report-card-approval" element={<ReportCardApproval />} />
          <Route path="homework" element={<Homework />} />
          <Route path="roles" element={<RoleManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/academic" element={<AcademicReports />} />
          <Route path="reports/financial" element={<FinancialReports />} />
          <Route path="reports/students" element={<AdminStudentReports />} />
          <Route path="reports/executive" element={<ExecutiveReports />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="exams" element={<Exams />} />
          <Route path="lms" element={<LMS />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="transport" element={<Transport />} />
          <Route path="hr-payroll" element={<HRPayroll />} />
          <Route path="biometric" element={<Biometric />} />
          <Route path="multi-school" element={<MultiSchool />} />
          <Route path="ai-features" element={<AIFeatures />} />
          <Route path="advanced-analytics" element={<AdvancedAnalytics />} />
          <Route path="hr-management" element={<HRManagement />} />
          <Route path="alumni" element={<AlumniManagement />} />
          <Route path="integrations" element={<IntegrationHub />} />
          <Route path="report-builder" element={<ReportBuilder />} />
          <Route path="video-conferencing" element={<VideoConferencing />} />
          <Route path="settings" element={<Navigate to="/admin/system-config" replace />} />
          <Route path="import" element={<BulkImport />} />
          <Route path="gallery" element={<GalleryManagement />} />
          <Route path="system-config" element={<SystemConfiguration />} />
          <Route path="system-reset" element={<SystemReset />} />
          <Route path="logs" element={<SystemLogs />} />
          <Route path="comprehensive-dashboard" element={<ComprehensiveDashboard />} />
          <Route path="dashboard-selector" element={<DashboardSelector />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="whatsapp" element={<WhatsAppMessaging />} />
          <Route path="sms" element={<SMSMessaging />} />
          <Route path="email" element={<EmailMessaging />} />
          <Route path="message-center" element={<MessageCenter />} />
          <Route path="help" element={<HelpCenter />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Protected Principal Routes */}
        <Route
          path="/principal"
          element={
            <ProtectedRoute allowedRoles={['principal', 'admin', 'super_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<PrincipalDashboard />} />
          <Route path="staff" element={<StaffOverview />} />
          <Route path="academic-performance" element={<AcademicPerformance />} />
          <Route path="calendar" element={<SchoolCalendar />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="help" element={<HelpCenter />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Protected HR Routes */}
        <Route
          path="/hr"
          element={
            <ProtectedRoute allowedRoles={['hr', 'hr_manager', 'admin', 'super_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<HRDashboard />} />
          <Route path="employees" element={<EmployeeManagement />} />
          <Route path="leave" element={<LeaveManagement />} />
          <Route path="payroll" element={<PayrollManagement />} />
          <Route path="performance-reviews" element={<PerformanceReviews />} />
          <Route path="salary-structures" element={<SalaryStructures />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="help" element={<HelpCenter />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Protected Finance Routes */}
        <Route
          path="/finance"
          element={
            <ProtectedRoute allowedRoles={['finance', 'accountant', 'admin', 'super_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<FinanceDashboard />} />
          <Route path="invoices" element={<InvoiceManagement />} />
          <Route path="payments" element={<PaymentTracking />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="help" element={<HelpCenter />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Protected Student Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin', 'super_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="homework" element={<StudentHomework />} />
          <Route path="grades" element={<StudentGrades />} />
          <Route path="attendance" element={<StudentAttendance />} />
          <Route path="timetable" element={<StudentTimetable />} />
          <Route path="messages" element={<StudentMessages />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="help" element={<HelpCenter />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Protected Teacher Routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'class_teacher', 'admin', 'super_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<TeacherComprehensiveDashboard />} />
          <Route path="classes" element={<MyClasses />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="homework" element={<TeacherHomework />} />
          <Route path="homework/:homeworkId/review" element={<TeacherHomeworkReview />} />
          <Route path="grading" element={<TeacherGrading />} />
          <Route path="reports" element={<TeacherStudentReports />} />
          <Route path="messages" element={<TeacherMessages />} />
          <Route path="ai-insights" element={<AIInsights />} />
          <Route path="hr-portal" element={<HRPortal />} />
          <Route path="lesson-planning" element={<LessonPlanning />} />
          <Route path="student-progress" element={<StudentProgress />} />
          <Route path="behavior" element={<BehaviorTracking />} />
          <Route path="resources" element={<ResourceLibrary />} />
          <Route path="seating" element={<SeatingChart />} />
          <Route path="substitute" element={<SubstituteMode />} />
          <Route path="report-cards" element={<TeacherReportCards />} />
          <Route path="settings" element={<TeacherSettings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="help" element={<HelpCenter />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Protected Parent Routes */}
        <Route
          path="/parent"
          element={
            <ProtectedRoute allowedRoles={['parent', 'admin', 'super_admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<ParentComprehensiveDashboard />} />
          <Route path="apply" element={<ApplyForAdmission />} />
          <Route path="child/:childId" element={<ChildDetails />} />
          <Route path="child/:childId/attendance" element={<ChildAttendance />} />
          <Route path="child/:childId/grades" element={<ChildGrades />} />
          <Route path="child/:childId/homework" element={<ChildHomeworkView />} />
          <Route path="child/:childId/teachers" element={<ChildTeachers />} />
          <Route path="child/:childId/report-cards" element={<ChildReportCards />} />
          <Route path="enroll" element={<TermEnrollment />} />
          <Route path="invoices" element={<ParentInvoices />} />
          <Route path="payments" element={<ParentPayments />} />
          <Route path="messages" element={<ParentMessages />} />
          <Route path="meetings" element={<ParentMeetings />} />
          <Route path="settings" element={<ParentSettings />} />
          <Route path="homework" element={<ChildHomeworkView />} />
          <Route path="results" element={<ChildResults />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="help" element={<HelpCenter />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 404 */}
        <Route path="*" element={<div className="p-8"><h1 className="text-2xl">404 - Page Not Found</h1></div>} />
          </Routes>
        </Suspense>
        
        {/* AI Chatbot - Available on all pages (bottom-left) */}
        <Suspense fallback={null}>
          <AIChatbot />
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

// Wrap App with ThemeInitializer
function AppWrapper() {
  const { applyTheme } = useThemeStore();
  
  useEffect(() => {
    applyTheme();
  }, []);
  
  return <App />;
}

export default AppWrapper;
