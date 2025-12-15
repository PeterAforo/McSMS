import { Link } from 'react-router-dom';
import { 
  Shield, GraduationCap, Users, Briefcase, DollarSign, 
  BookOpen, UserCheck, LayoutDashboard
} from 'lucide-react';

export default function DashboardSelector() {
  const dashboards = [
    {
      name: 'Admin Dashboard',
      description: 'Comprehensive school overview with all metrics',
      icon: Shield,
      color: 'bg-indigo-500',
      path: '/admin/comprehensive-dashboard',
      role: 'Admin'
    },
    {
      name: 'Principal Dashboard',
      description: 'Academic focus, class performance, staff overview',
      icon: GraduationCap,
      color: 'bg-purple-500',
      path: '/principal/dashboard',
      role: 'Principal'
    },
    {
      name: 'HR Dashboard',
      description: 'Employee management, attendance, leave, payroll',
      icon: Users,
      color: 'bg-pink-500',
      path: '/hr/dashboard',
      role: 'HR'
    },
    {
      name: 'Finance Dashboard',
      description: 'Revenue, fees, expenses, debtors tracking',
      icon: DollarSign,
      color: 'bg-green-500',
      path: '/finance/dashboard',
      role: 'Finance'
    },
    {
      name: 'Teacher Dashboard',
      description: 'Classes, schedule, grades, student management',
      icon: BookOpen,
      color: 'bg-blue-500',
      path: '/teacher/dashboard',
      role: 'Teacher'
    },
    {
      name: 'Student Dashboard',
      description: 'Grades, attendance, homework, fee status',
      icon: UserCheck,
      color: 'bg-teal-500',
      path: '/student/dashboard',
      role: 'Student'
    },
    {
      name: 'Parent Dashboard',
      description: 'Children overview, performance, fee tracking',
      icon: Briefcase,
      color: 'bg-orange-500',
      path: '/parent/dashboard',
      role: 'Parent'
    }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 mb-8 text-white">
          <div className="flex items-center gap-4">
            <LayoutDashboard size={40} />
            <div>
              <h1 className="text-3xl font-bold">Dashboard Selector</h1>
              <p className="text-indigo-100 mt-1">Preview all role-based dashboards with AI insights</p>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dashboard, index) => {
            const Icon = dashboard.icon;
            return (
              <Link
                key={index}
                to={dashboard.path}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 group"
              >
                <div className={`${dashboard.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="text-white" size={28} />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-gray-800">{dashboard.name}</h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{dashboard.role}</span>
                </div>
                <p className="text-gray-600">{dashboard.description}</p>
                <div className="mt-4 flex items-center text-indigo-600 font-medium">
                  View Dashboard
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Info */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🧠 AI Insights Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-800">⚠️ Warnings</h3>
              <p className="text-sm text-yellow-700 mt-1">Alerts for issues needing attention</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800">ℹ️ Information</h3>
              <p className="text-sm text-blue-700 mt-1">Updates and status notifications</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-800">✅ Success</h3>
              <p className="text-sm text-green-700 mt-1">Positive achievements and milestones</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
