import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  DollarSign,
  FileText,
  Settings,
  School,
  ClipboardCheck,
  CheckCircle,
  Award,
  Home,
  UserPlus,
  CreditCard,
  Baby,
  MessageSquare,
  MessageCircle,
  Mail,
  Phone,
  Shield,
  BarChart3,
  Activity,
  Sliders,
  Clock,
  FileCheck,
  Video,
  TrendingUp,
  Truck,
  Briefcase,
  Fingerprint,
  Building,
  Brain,
  Upload,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Wrench,
  HelpCircle,
  Plug,
  Heart,
  PieChart,
  FileSpreadsheet,
  VideoIcon
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSchoolSettings } from '../../hooks/useSchoolSettings';

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { settings } = useSchoolSettings();
  const [expandedCategories, setExpandedCategories] = useState({});

  // Generate school abbreviation from school name - memoized to update when settings change
  const schoolAbbr = useMemo(() => {
    // Use custom abbreviation if provided
    if (settings.school_abbreviation) {
      return settings.school_abbreviation.toUpperCase();
    }
    
    const name = settings.school_name;
    if (!name) return 'McSMS';
    
    // Split by spaces and take first letter of each word
    const words = name.split(' ').filter(word => word.length > 0);
    
    // If single word, take first 3-5 letters
    if (words.length === 1) {
      return name.substring(0, Math.min(5, name.length)).toUpperCase();
    }
    
    // Take first letter of each word (max 5 letters)
    return words
      .slice(0, 5)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }, [settings.school_abbreviation, settings.school_name]);

  // Admin menu categories with items
  const adminMenuCategories = [
    {
      id: 'main',
      label: 'Main',
      icon: LayoutDashboard,
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
      ]
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      items: [
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Shield, label: 'Roles & Permissions', path: '/admin/roles' },
      ]
    },
    {
      id: 'academic',
      label: 'Academic',
      icon: GraduationCap,
      items: [
        { icon: GraduationCap, label: 'Students', path: '/admin/students' },
        { icon: ClipboardCheck, label: 'Admissions', path: '/admin/admissions' },
        { icon: Users, label: 'Teachers', path: '/admin/teachers' },
        { icon: School, label: 'Classes', path: '/admin/classes' },
        { icon: BookOpen, label: 'Class Curriculum', path: '/admin/class-subjects' },
        { icon: GraduationCap, label: 'Education Levels', path: '/admin/education-levels' },
        { icon: BookOpen, label: 'Subjects', path: '/admin/subjects' },
        { icon: Calendar, label: 'Terms', path: '/admin/terms' },
        { icon: Clock, label: 'Timetable', path: '/admin/timetable' },
        { icon: FileCheck, label: 'Exams', path: '/admin/exams' },
        { icon: Video, label: 'LMS', path: '/admin/lms' },
      ]
    },
    {
      id: 'classroom',
      label: 'Classroom',
      icon: School,
      items: [
        { icon: CheckCircle, label: 'Attendance', path: '/admin/attendance' },
        { icon: Award, label: 'Grading', path: '/admin/grading' },
        { icon: BookOpen, label: 'Homework', path: '/admin/homework' },
      ]
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: DollarSign,
      items: [
        { icon: DollarSign, label: 'Overview', path: '/admin/finance' },
        { icon: CreditCard, label: 'Fee Structure', path: '/admin/fee-structure' },
        { icon: FileText, label: 'Invoices', path: '/admin/invoices' },
        { icon: DollarSign, label: 'Payments', path: '/admin/payments' },
      ]
    },
    {
      id: 'advanced',
      label: 'Advanced Features',
      icon: Brain,
      items: [
        { icon: TrendingUp, label: 'Reports & Analytics', path: '/admin/analytics' },
        { icon: PieChart, label: 'Predictive Analytics', path: '/admin/advanced-analytics' },
        { icon: Truck, label: 'Transport', path: '/admin/transport' },
        { icon: Briefcase, label: 'HR Management', path: '/admin/hr-management' },
        { icon: Fingerprint, label: 'Biometric', path: '/admin/biometric' },
        { icon: Building, label: 'Multi-School', path: '/admin/multi-school' },
        { icon: Brain, label: 'AI Features', path: '/admin/ai-features' },
        { icon: Heart, label: 'Alumni', path: '/admin/alumni' },
        { icon: VideoIcon, label: 'Video Conferencing', path: '/admin/video-conferencing' },
        { icon: Plug, label: 'Integrations', path: '/admin/integrations' },
      ]
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: MessageSquare,
      items: [
        { icon: MessageSquare, label: 'Messages', path: '/admin/messages' },
        { icon: MessageCircle, label: 'WhatsApp', path: '/admin/whatsapp' },
        { icon: Phone, label: 'SMS', path: '/admin/sms' },
        { icon: Mail, label: 'Email', path: '/admin/email' },
      ]
    },
    {
      id: 'reports',
      label: 'Reports & Data',
      icon: BarChart3,
      items: [
        { icon: BarChart3, label: 'Reports', path: '/admin/reports' },
        { icon: FileSpreadsheet, label: 'Report Builder', path: '/admin/report-builder' },
        { icon: Upload, label: 'Bulk Import', path: '/admin/import' },
        { icon: Activity, label: 'System Logs', path: '/admin/logs' },
      ]
    },
    {
      id: 'system',
      label: 'System',
      icon: Wrench,
      items: [
        { icon: Sliders, label: 'System Configuration', path: '/admin/system-config' },
        { icon: RefreshCw, label: 'System Reset', path: '/admin/system-reset' },
        { icon: HelpCircle, label: 'Help Center', path: '/admin/help' },
      ]
    },
  ];

  // Teacher menu categories
  const teacherMenuCategories = [
    {
      id: 'main',
      label: 'Main',
      icon: LayoutDashboard,
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/teacher/dashboard' },
      ]
    },
    {
      id: 'teaching',
      label: 'Teaching',
      icon: School,
      items: [
        { icon: School, label: 'My Classes', path: '/teacher/classes' },
        { icon: CheckCircle, label: 'Attendance', path: '/teacher/attendance' },
        { icon: BookOpen, label: 'Homework', path: '/teacher/homework' },
        { icon: Award, label: 'Grading', path: '/teacher/grading' },
        { icon: FileText, label: 'Student Reports', path: '/teacher/reports' },
        { icon: Calendar, label: 'Lesson Planning', path: '/teacher/lesson-planning' },
      ]
    },
    {
      id: 'students',
      label: 'Student Tools',
      icon: Users,
      items: [
        { icon: TrendingUp, label: 'Progress Tracking', path: '/teacher/student-progress' },
        { icon: Heart, label: 'Behavior Tracking', path: '/teacher/behavior' },
        { icon: Users, label: 'Seating Chart', path: '/teacher/seating' },
      ]
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: BookOpen,
      items: [
        { icon: BookOpen, label: 'Resource Library', path: '/teacher/resources' },
        { icon: Clock, label: 'Substitute Mode', path: '/teacher/substitute' },
      ]
    },
    {
      id: 'insights',
      label: 'AI & Analytics',
      icon: Brain,
      items: [
        { icon: Brain, label: 'AI Insights', path: '/teacher/ai-insights' },
      ]
    },
    {
      id: 'hr',
      label: 'HR Portal',
      icon: Briefcase,
      items: [
        { icon: Briefcase, label: 'HR Portal', path: '/teacher/hr-portal' },
      ]
    },
    {
      id: 'other',
      label: 'Other',
      icon: Settings,
      items: [
        { icon: MessageSquare, label: 'Messages', path: '/teacher/messages' },
        { icon: Settings, label: 'Settings', path: '/teacher/settings' },
        { icon: HelpCircle, label: 'Help Center', path: '/teacher/help' },
      ]
    },
  ];

  // Parent menu categories
  const parentMenuCategories = [
    {
      id: 'main',
      label: 'Main',
      icon: LayoutDashboard,
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/parent/dashboard' },
      ]
    },
    {
      id: 'children',
      label: 'My Children',
      icon: Baby,
      items: [
        { icon: UserPlus, label: 'Apply for Admission', path: '/parent/apply' },
        { icon: CheckCircle, label: 'Enroll for Term', path: '/parent/enroll' },
      ]
    },
    {
      id: 'academics',
      label: 'Academics',
      icon: GraduationCap,
      items: [
        { icon: BookOpen, label: 'Homework', path: '/parent/homework' },
        { icon: Award, label: 'Results & Performance', path: '/parent/results' },
      ]
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: DollarSign,
      items: [
        { icon: FileText, label: 'Invoices', path: '/parent/invoices' },
        { icon: DollarSign, label: 'Payments', path: '/parent/payments' },
      ]
    },
    {
      id: 'other',
      label: 'Other',
      icon: Settings,
      items: [
        { icon: MessageSquare, label: 'Messages', path: '/parent/messages' },
        { icon: Settings, label: 'Settings', path: '/parent/settings' },
        { icon: HelpCircle, label: 'Help Center', path: '/parent/help' },
      ]
    },
  ];

  // Get menu categories based on user role
  const getMenuCategories = () => {
    switch (user?.user_type) {
      case 'admin':
        return adminMenuCategories;
      case 'teacher':
        return teacherMenuCategories;
      case 'parent':
        return parentMenuCategories;
      default:
        return adminMenuCategories;
    }
  };

  const menuCategories = getMenuCategories();

  const isActive = (path) => location.pathname === path;

  // Check if any item in a category is active
  const isCategoryActive = (category) => {
    return category.items.some(item => location.pathname === item.path);
  };

  // Toggle category expansion
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Auto-expand category containing active item
  useEffect(() => {
    const activeCategory = menuCategories.find(cat => isCategoryActive(cat));
    if (activeCategory && !expandedCategories[activeCategory.id]) {
      setExpandedCategories(prev => ({
        ...prev,
        [activeCategory.id]: true
      }));
    }
  }, [location.pathname]);

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {settings.school_logo ? (
            <img 
              src={settings.school_logo} 
              alt={settings.school_name}
              className="w-10 h-10 object-contain rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center ${settings.school_logo ? 'hidden' : ''}`}
          >
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{schoolAbbr}</h1>
            <p className="text-xs text-gray-500">{settings.school_tagline || 'School Management'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {menuCategories.map((category) => {
            const CategoryIcon = category.icon;
            const isExpanded = expandedCategories[category.id];
            const hasActiveItem = isCategoryActive(category);
            
            // For single-item categories (like Dashboard), render directly
            if (category.items.length === 1) {
              const item = category.items[0];
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            }
            
            // For multi-item categories, render collapsible group
            return (
              <div key={category.id} className="mb-1">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    hasActiveItem
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CategoryIcon className="w-5 h-5" />
                  <span className="text-sm font-medium flex-1 text-left">{category.label}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                {/* Category Items */}
                {isExpanded && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
                    {category.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-3 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                            active
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span className={`px-1.5 py-0.5 text-xs font-semibold rounded-full ${
                              item.badge === 'Danger' 
                                ? 'bg-red-500 text-white' 
                                : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
