import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import {
  Users, DollarSign, GraduationCap, BookOpen, Calendar, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle, Info, Clock, Award,
  Briefcase, CreditCard, PieChart, BarChart3, Activity, Bell,
  ArrowUpRight, ArrowDownRight, Lightbulb, Target, Zap, Brain,
  UserCheck, UserX, FileText, Building, Wallet, Receipt
} from 'lucide-react';

const API_BASE_URL = 'https://eea.mcaforo.com/backend/api';

export default function ComprehensiveDashboard() {
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeInsightFilter, setActiveInsightFilter] = useState('all');

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/dashboard.php?role=admin&user_id=${user?.id || ''}`
      );
      if (response.data.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back! Here's what's happening at your school today.
        </p>
      </div>

      {/* AI Insights Section */}
      {dashboardData.insights && dashboardData.insights.length > 0 && (
        <AIInsightsSection 
          insights={dashboardData.insights} 
          filter={activeInsightFilter}
          setFilter={setActiveInsightFilter}
        />
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={dashboardData.stats?.total_students || 0}
          icon={<GraduationCap className="text-blue-600" size={24} />}
          trend={+5.2}
          color="blue"
        />
        <StatCard
          title="Total Teachers"
          value={dashboardData.stats?.total_teachers || 0}
          icon={<Users className="text-green-600" size={24} />}
          trend={+2.1}
          color="green"
        />
        <StatCard
          title="Total Employees"
          value={dashboardData.stats?.total_employees || 0}
          icon={<Briefcase className="text-purple-600" size={24} />}
          trend={0}
          color="purple"
        />
        <StatCard
          title="Active Classes"
          value={dashboardData.stats?.total_classes || 0}
          icon={<BookOpen className="text-orange-600" size={24} />}
          trend={0}
          color="orange"
        />
      </div>

      {/* Financial & HR Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Financial Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Financial Overview</h2>
            <DollarSign className="text-green-600" size={24} />
          </div>
          <div className="space-y-4">
            <FinancialItem
              label="Revenue This Month"
              value={dashboardData.financial?.revenue_this_month || 0}
              icon={<TrendingUp className="text-green-500" size={18} />}
            />
            <FinancialItem
              label="Revenue This Year"
              value={dashboardData.financial?.revenue_this_year || 0}
              icon={<BarChart3 className="text-blue-500" size={18} />}
            />
            <FinancialItem
              label="Outstanding Fees"
              value={dashboardData.financial?.outstanding_fees || 0}
              icon={<AlertTriangle className="text-orange-500" size={18} />}
              isWarning={true}
            />
            <FinancialItem
              label="Payroll This Month"
              value={dashboardData.financial?.payroll_this_month || 0}
              icon={<Wallet className="text-purple-500" size={18} />}
            />
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Collection Rate</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        (dashboardData.financial?.collection_rate || 0) >= 80 
                          ? 'bg-green-500' 
                          : (dashboardData.financial?.collection_rate || 0) >= 60 
                            ? 'bg-yellow-500' 
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${dashboardData.financial?.collection_rate || 0}%` }}
                    ></div>
                  </div>
                  <span className="font-semibold">{dashboardData.financial?.collection_rate || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HR Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">HR Overview</h2>
            <Briefcase className="text-purple-600" size={24} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <HRCard
              label="Present Today"
              value={dashboardData.hr?.present_today || 0}
              icon={<UserCheck className="text-green-500" size={20} />}
              color="green"
            />
            <HRCard
              label="On Leave"
              value={dashboardData.hr?.on_leave_today || 0}
              icon={<UserX className="text-orange-500" size={20} />}
              color="orange"
            />
            <HRCard
              label="Pending Leaves"
              value={dashboardData.stats?.pending_leaves || 0}
              icon={<Clock className="text-blue-500" size={20} />}
              color="blue"
            />
            <HRCard
              label="Payroll Pending"
              value={dashboardData.hr?.pending_payroll || 0}
              icon={<Receipt className="text-purple-500" size={20} />}
              color="purple"
            />
          </div>
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Payroll</span>
              <span className="text-xl font-bold text-purple-600">
                GHS {parseFloat(dashboardData.hr?.total_payroll || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Academic & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Academic Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Academic Performance</h2>
            <Award className="text-yellow-600" size={24} />
          </div>
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <svg className="w-32 h-32">
                <circle
                  className="text-gray-200"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                  r="56"
                  cx="64"
                  cy="64"
                />
                <circle
                  className={`${
                    (dashboardData.academic?.pass_rate || 0) >= 80 
                      ? 'text-green-500' 
                      : (dashboardData.academic?.pass_rate || 0) >= 60 
                        ? 'text-yellow-500' 
                        : 'text-red-500'
                  }`}
                  strokeWidth="10"
                  strokeDasharray={`${(dashboardData.academic?.pass_rate || 0) * 3.52} 352`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="56"
                  cx="64"
                  cy="64"
                  transform="rotate(-90 64 64)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-2xl font-bold">{dashboardData.academic?.pass_rate || 0}%</span>
                  <p className="text-xs text-gray-500">Pass Rate</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{dashboardData.academic?.average_score || 0}</p>
              <p className="text-sm text-gray-600">Avg Score</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{dashboardData.academic?.total_subjects || 0}</p>
              <p className="text-sm text-gray-600">Subjects</p>
            </div>
          </div>
        </div>

        {/* Attendance Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Attendance Trend</h2>
            <Activity className="text-blue-600" size={24} />
          </div>
          <div className="h-48">
            {dashboardData.charts?.attendance && (
              <AttendanceChart data={dashboardData.charts.attendance} />
            )}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Absent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Revenue Trend</h2>
            <TrendingUp className="text-green-600" size={24} />
          </div>
          <div className="h-64">
            {dashboardData.charts?.revenue && (
              <RevenueChart data={dashboardData.charts.revenue} />
            )}
          </div>
        </div>

        {/* Students by Class */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Students by Class</h2>
            <PieChart className="text-blue-600" size={24} />
          </div>
          <div className="space-y-3">
            {dashboardData.charts?.students_by_class?.slice(0, 6).map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-24 text-sm text-gray-600 truncate">{item.class_name}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full flex items-center justify-end pr-2"
                    style={{ 
                      width: `${Math.min((item.count / Math.max(...dashboardData.charts.students_by_class.map(c => c.count))) * 100, 100)}%`,
                      minWidth: item.count > 0 ? '30px' : '0'
                    }}
                  >
                    <span className="text-xs text-white font-medium">{item.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Recent Activities</h2>
          <Bell className="text-gray-600" size={24} />
        </div>
        <div className="space-y-4">
          {dashboardData.activities?.slice(0, 5).map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className={`p-2 rounded-full ${
                activity.type === 'payment' ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                {activity.type === 'payment' ? (
                  <DollarSign className="text-green-600" size={18} />
                ) : (
                  <Users className="text-blue-600" size={18} />
                )}
              </div>
              <div className="flex-1">
                <p className="text-gray-800">{activity.description}</p>
                <p className="text-sm text-gray-500">{formatDate(activity.date)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// AI Insights Section Component
function AIInsightsSection({ insights, filter, setFilter }) {
  const filteredInsights = filter === 'all' 
    ? insights 
    : insights.filter(i => i.type === filter);

  const categories = ['all', 'warning', 'alert', 'info', 'success'];

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Brain className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">AI Insights</h2>
            <p className="text-indigo-200 text-sm">Intelligent recommendations for your school</p>
          </div>
        </div>
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-full text-sm capitalize transition-all ${
                filter === cat 
                  ? 'bg-white text-indigo-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInsights.slice(0, 6).map((insight, index) => (
          <InsightCard key={index} insight={insight} />
        ))}
      </div>
    </div>
  );
}

// Insight Card Component
function InsightCard({ insight }) {
  const typeStyles = {
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertTriangle, iconColor: 'text-yellow-600' },
    alert: { bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, iconColor: 'text-red-600' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Info, iconColor: 'text-blue-600' },
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, iconColor: 'text-green-600' }
  };

  const style = typeStyles[insight.type] || typeStyles.info;
  const Icon = style.icon;

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={style.iconColor} size={20} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 bg-gray-200 rounded-full text-gray-600">
              {insight.category}
            </span>
            {insight.priority === 'high' && (
              <span className="text-xs px-2 py-0.5 bg-red-200 rounded-full text-red-700">
                High Priority
              </span>
            )}
          </div>
          <h4 className="font-semibold text-gray-800">{insight.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
          {insight.action && (
            <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
              {insight.action}
              <ArrowUpRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon, trend, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
    purple: 'bg-purple-50 border-purple-100',
    orange: 'bg-orange-50 border-orange-100'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-6 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
        {trend !== 0 && (
          <div className={`flex items-center gap-1 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-800">{value.toLocaleString()}</p>
      <p className="text-gray-600 mt-1">{title}</p>
    </div>
  );
}

// Financial Item Component
function FinancialItem({ label, value, icon, isWarning }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-gray-600">{label}</span>
      </div>
      <span className={`font-semibold ${isWarning ? 'text-orange-600' : 'text-gray-800'}`}>
        GHS {parseFloat(value).toLocaleString()}
      </span>
    </div>
  );
}

// HR Card Component
function HRCard({ label, value, icon, color }) {
  const colorClasses = {
    green: 'bg-green-50',
    orange: 'bg-orange-50',
    blue: 'bg-blue-50',
    purple: 'bg-purple-50'
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-4 text-center`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

// Attendance Chart Component
function AttendanceChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.present + d.absent), 1);

  return (
    <div className="flex items-end justify-between h-full gap-2">
      {data.map((day, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col gap-1" style={{ height: '140px' }}>
            <div 
              className="w-full bg-green-500 rounded-t"
              style={{ height: `${(day.present / maxValue) * 100}%` }}
            ></div>
            <div 
              className="w-full bg-red-400 rounded-b"
              style={{ height: `${(day.absent / maxValue) * 100}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-500">{day.day}</span>
        </div>
      ))}
    </div>
  );
}

// Revenue Chart Component
function RevenueChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.amount), 1);

  return (
    <div className="flex items-end justify-between h-full gap-4">
      {data.map((month, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-2">
          <div 
            className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all hover:from-green-600 hover:to-green-500"
            style={{ height: `${(month.amount / maxValue) * 200}px`, minHeight: month.amount > 0 ? '20px' : '0' }}
          ></div>
          <span className="text-xs text-gray-500 text-center">{month.month}</span>
        </div>
      ))}
    </div>
  );
}

// Helper function
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}
