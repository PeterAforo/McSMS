import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import AIChatbot from './components/shared/AIChatbot';
import DynamicFavicon from './components/shared/DynamicFavicon';
import { VoiceCommandButton } from './components/shared/VoiceCommands';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Activate from './pages/auth/Activate';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Students from './pages/admin/Students';
import StudentProfile from './pages/admin/StudentProfile';
import Admissions from './pages/admin/Admissions';
import Classes from './pages/admin/Classes';
import ClassSubjects from './pages/admin/ClassSubjects';
import EducationLevels from './pages/admin/EducationLevels';
import Subjects from './pages/admin/Subjects';
import Terms from './pages/admin/Terms';
import Teachers from './pages/admin/Teachers';
import TeacherProfile from './pages/admin/TeacherProfile';
import Finance from './pages/admin/Finance';
import FeeStructure from './pages/admin/FeeStructure';
import Invoices from './pages/admin/Invoices';
import Payments from './pages/admin/Payments';
import Attendance from './pages/admin/Attendance';
import Grading from './pages/admin/Grading';
import Homework from './pages/admin/Homework';
import RoleManagement from './pages/admin/RoleManagement';
// Settings removed - merged into SystemConfiguration
import BulkImport from './pages/admin/BulkImport';
import SystemLogs from './pages/admin/SystemLogs';
import SystemConfiguration from './pages/admin/SystemConfiguration';
import SystemReset from './pages/admin/SystemReset';
import Reports from './pages/admin/Reports';
import AcademicReports from './pages/admin/AcademicReports';
import FinancialReports from './pages/admin/FinancialReports';
import AdminStudentReports from './pages/admin/StudentReports';
import ExecutiveReports from './pages/admin/ExecutiveReports';
import Timetable from './pages/admin/Timetable';
import Exams from './pages/admin/Exams';
import LMS from './pages/admin/LMS';
import Analytics from './pages/admin/Analytics';
import Transport from './pages/admin/Transport';
import HRPayroll from './pages/admin/HRPayroll';
import Biometric from './pages/admin/Biometric';
import MultiSchool from './pages/admin/MultiSchool';
import AIFeatures from './pages/admin/AIFeatures';
import AdvancedAnalytics from './pages/admin/AdvancedAnalytics';
import HRManagement from './pages/admin/HRManagement';
import AlumniManagement from './pages/admin/AlumniManagement';
import IntegrationHub from './pages/admin/IntegrationHub';
import ReportBuilder from './pages/admin/ReportBuilder';
import VideoConferencing from './pages/admin/VideoConferencing';
import ComprehensiveDashboard from './pages/admin/ComprehensiveDashboard';
import DashboardSelector from './pages/admin/DashboardSelector';
import PrincipalDashboard from './pages/principal/PrincipalDashboard';
import HRDashboard from './pages/hr/HRDashboard';
import FinanceDashboard from './pages/finance/FinanceDashboard';
import TeacherComprehensiveDashboard from './pages/teacher/Dashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import ParentComprehensiveDashboard from './pages/parent/ParentDashboard';
import MyClasses from './pages/teacher/MyClasses';
import TeacherStudents from './pages/teacher/Students';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherHomework from './pages/teacher/TeacherHomework';
import TeacherGrading from './pages/teacher/TeacherGrading';
import TeacherMessages from './pages/teacher/Messages';
import TeacherSettings from './pages/teacher/Settings';
import TeacherStudentReports from './pages/teacher/StudentReports';
import AIInsights from './pages/teacher/AIInsights';
import HRPortal from './pages/teacher/HRPortal';
import LessonPlanning from './pages/teacher/LessonPlanning';
import StudentProgress from './pages/teacher/StudentProgress';
import BehaviorTracking from './pages/teacher/BehaviorTracking';
import ResourceLibrary from './pages/teacher/ResourceLibrary';
import SeatingChart from './pages/teacher/SeatingChart';
import SubstituteMode from './pages/teacher/SubstituteMode';
import ApplyForAdmission from './pages/parent/ApplyForAdmission';
import ChildDetails from './pages/parent/ChildDetails';
import TermEnrollment from './pages/parent/TermEnrollment';
import ParentInvoices from './pages/parent/Invoices';
import ParentPayments from './pages/parent/Payments';
import ParentMessages from './pages/parent/Messages';
import ParentSettings from './pages/parent/Settings';
import ChildHomework from './pages/parent/ChildHomework';
import ChildResults from './pages/parent/ChildResults';
import WhatsAppMessaging from './pages/admin/WhatsAppMessaging';
import SMSMessaging from './pages/admin/SMSMessaging';
import EmailMessaging from './pages/admin/EmailMessaging';
import AdminMessages from './pages/admin/Messages';
import Unauthorized from './pages/Unauthorized';
import Profile from './pages/shared/Profile';
import Notifications from './pages/shared/Notifications';
import HelpCenter from './pages/shared/HelpCenter';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check user_type or role field (different APIs may use different field names)
  const userRole = user?.user_type || user?.role || user?.type;
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    console.log('Access denied - User role:', userRole, 'Allowed roles:', allowedRoles);
    return <Navigate to="/unauthorized" replace />;
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
    <BrowserRouter>
      <DynamicFavicon />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/activate" element={<Activate />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
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
          <Route path="teachers" element={<Teachers />} />
          <Route path="teachers/:teacherId" element={<TeacherProfile />} />
          <Route path="finance" element={<Finance />} />
          <Route path="fee-structure" element={<FeeStructure />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="payments" element={<Payments />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="grading" element={<Grading />} />
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
          <Route path="help" element={<HelpCenter />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Protected Principal Routes */}
        <Route
          path="/principal"
          element={
            <ProtectedRoute allowedRoles={['principal', 'admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<PrincipalDashboard />} />
          <Route path="help" element={<HelpCenter />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Protected HR Routes */}
        <Route
          path="/hr"
          element={
            <ProtectedRoute allowedRoles={['hr', 'admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<HRDashboard />} />
          <Route path="help" element={<HelpCenter />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Protected Finance Routes */}
        <Route
          path="/finance"
          element={
            <ProtectedRoute allowedRoles={['finance', 'admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<FinanceDashboard />} />
          <Route path="help" element={<HelpCenter />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Protected Student Routes */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['student', 'admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="help" element={<HelpCenter />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Protected Teacher Routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<TeacherComprehensiveDashboard />} />
          <Route path="classes" element={<MyClasses />} />
          <Route path="students" element={<TeacherStudents />} />
          <Route path="attendance" element={<TeacherAttendance />} />
          <Route path="homework" element={<TeacherHomework />} />
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
            <ProtectedRoute allowedRoles={['parent', 'admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<ParentComprehensiveDashboard />} />
          <Route path="apply" element={<ApplyForAdmission />} />
          <Route path="child/:studentId" element={<ChildDetails />} />
          <Route path="enroll" element={<TermEnrollment />} />
          <Route path="invoices" element={<ParentInvoices />} />
          <Route path="payments" element={<ParentPayments />} />
          <Route path="messages" element={<ParentMessages />} />
          <Route path="settings" element={<ParentSettings />} />
          <Route path="homework" element={<ChildHomework />} />
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
      
      {/* AI Chatbot - Available on all pages (bottom-left) */}
      <AIChatbot />
    </BrowserRouter>
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
