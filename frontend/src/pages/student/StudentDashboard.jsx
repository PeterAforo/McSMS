import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import {
  GraduationCap, BookOpen, Calendar, Clock, Award, FileText, CheckCircle,
  AlertTriangle, Info, Brain, TrendingUp, Target, BarChart3, DollarSign,
  ArrowUpRight, User, Bell, ClipboardList
} from 'lucide-react';

const API_BASE_URL = 'https://eea.mcaforo.com/backend/api';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // For students, we use the student_id from user profile or user.id
      const studentId = user.student_id || user.id;
      const response = await axios.get(
        `${API_BASE_URL}/dashboard.php?role=student&user_id=${studentId}`
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

  const student = dashboardData.student;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome, {student?.first_name} {student?.last_name}!
              </h1>
              <p className="text-green-100 mt-1">
                {student?.class_name || 'No class assigned'} • {student?.admission_number}
              </p>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-green-100">Today</p>
            <p className="text-xl font-semibold">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {dashboardData.insights && dashboardData.insights.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="text-purple-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Your AI Assistant</h2>
              <p className="text-gray-500 text-sm">Personalized tips to help you succeed</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData.insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Average Score"
          value={`${dashboardData.average_score}%`}
          icon={<Award className="text-yellow-600" size={24} />}
          color="yellow"
          subtitle={getPerformanceLabel(dashboardData.average_score)}
        />
        <StatCard
          title="Attendance Rate"
          value={`${dashboardData.attendance_rate}%`}
          icon={<CheckCircle className="text-green-600" size={24} />}
          color="green"
          subtitle={`${dashboardData.attendance?.present || 0} days present`}
        />
        <StatCard
          title="Pending Homework"
          value={dashboardData.pending_homework?.length || 0}
          icon={<ClipboardList className="text-blue-600" size={24} />}
          color="blue"
          subtitle="assignments due"
        />
        <StatCard
          title="Fee Balance"
          value={`GHS ${parseFloat(dashboardData.fees?.balance || 0).toLocaleString()}`}
          icon={<DollarSign className="text-purple-600" size={24} />}
          color="purple"
          subtitle={dashboardData.fees?.balance > 0 ? 'Outstanding' : 'Paid'}
        />
      </div>

      {/* Academic Progress & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Academic Progress */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Academic Progress</h2>
            <TrendingUp className="text-green-600" size={24} />
          </div>
          
          {/* Performance Ring */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <svg className="w-40 h-40">
                <circle
                  className="text-gray-200"
                  strokeWidth="12"
                  stroke="currentColor"
                  fill="transparent"
                  r="64"
                  cx="80"
                  cy="80"
                />
                <circle
                  className={getScoreColor(dashboardData.average_score)}
                  strokeWidth="12"
                  strokeDasharray={`${dashboardData.average_score * 4.02} 402`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="64"
                  cx="80"
                  cy="80"
                  transform="rotate(-90 80 80)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-3xl font-bold">{dashboardData.average_score}%</span>
                  <p className="text-sm text-gray-500">Average</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Grades */}
          <h3 className="font-semibold text-gray-700 mb-3">Recent Grades</h3>
          {dashboardData.recent_grades?.length > 0 ? (
            <div className="space-y-2">
              {dashboardData.recent_grades.slice(0, 4).map((grade, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{grade.subject_name}</p>
                    <p className="text-sm text-gray-500">{grade.exam_name || 'Assessment'}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full font-semibold ${getGradeStyle(grade.score)}`}>
                    {grade.score}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No grades yet</p>
          )}
        </div>

        {/* Today's Timetable */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Today's Classes</h2>
            <Calendar className="text-blue-600" size={24} />
          </div>
          
          {dashboardData.todays_timetable?.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.todays_timetable.map((period, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border-l-4 ${
                    isCurrentPeriod(period.start_time, period.end_time)
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{period.subject_name}</p>
                      <p className="text-sm text-gray-600">{period.teacher_name || 'TBA'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {period.start_time?.slice(0, 5)} - {period.end_time?.slice(0, 5)}
                      </p>
                      {isCurrentPeriod(period.start_time, period.end_time) && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                          Now
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-500">No classes scheduled for today</p>
            </div>
          )}
        </div>
      </div>

      {/* Homework & Fee Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pending Homework */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Pending Homework</h2>
            <FileText className="text-orange-600" size={24} />
          </div>
          
          {dashboardData.pending_homework?.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.pending_homework.map((hw, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{hw.title}</p>
                      <p className="text-sm text-gray-600">{hw.subject_name}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm ${
                      getDaysUntilDue(hw.due_date) <= 1 
                        ? 'bg-red-100 text-red-700' 
                        : getDaysUntilDue(hw.due_date) <= 3 
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                    }`}>
                      {getDaysUntilDue(hw.due_date) === 0 
                        ? 'Due Today' 
                        : getDaysUntilDue(hw.due_date) === 1 
                          ? 'Due Tomorrow'
                          : `${getDaysUntilDue(hw.due_date)} days left`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto text-green-400 mb-4" size={48} />
              <p className="text-gray-500">All caught up! No pending homework.</p>
            </div>
          )}
        </div>

        {/* Fee Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Fee Summary</h2>
            <DollarSign className="text-green-600" size={24} />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Fees</span>
              <span className="font-semibold text-gray-800">
                GHS {parseFloat(dashboardData.fees?.total_fees || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <span className="text-gray-600">Amount Paid</span>
              <span className="font-semibold text-green-600">
                GHS {parseFloat(dashboardData.fees?.paid || 0).toLocaleString()}
              </span>
            </div>
            <div className={`flex items-center justify-between p-4 rounded-lg ${
              dashboardData.fees?.balance > 0 ? 'bg-red-50' : 'bg-green-50'
            }`}>
              <span className="text-gray-600">Balance</span>
              <span className={`font-semibold ${
                dashboardData.fees?.balance > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                GHS {parseFloat(dashboardData.fees?.balance || 0).toLocaleString()}
              </span>
            </div>
            
            {/* Payment Progress */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Payment Progress</span>
                <span className="text-sm font-medium">
                  {dashboardData.fees?.total_fees > 0 
                    ? Math.round((dashboardData.fees.paid / dashboardData.fees.total_fees) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ 
                    width: `${dashboardData.fees?.total_fees > 0 
                      ? (dashboardData.fees.paid / dashboardData.fees.total_fees) * 100 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Attendance Summary</h2>
          <BarChart3 className="text-blue-600" size={24} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 rounded-xl">
            <p className="text-4xl font-bold text-green-600">
              {dashboardData.attendance?.present || 0}
            </p>
            <p className="text-gray-600 mt-2">Days Present</p>
          </div>
          <div className="text-center p-6 bg-red-50 rounded-xl">
            <p className="text-4xl font-bold text-red-600">
              {dashboardData.attendance?.absent || 0}
            </p>
            <p className="text-gray-600 mt-2">Days Absent</p>
          </div>
          <div className="text-center p-6 bg-blue-50 rounded-xl">
            <p className="text-4xl font-bold text-blue-600">
              {dashboardData.attendance?.total || 0}
            </p>
            <p className="text-gray-600 mt-2">Total Days</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ title, value, icon, color, subtitle }) {
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-100',
    green: 'bg-green-50 border-green-100',
    blue: 'bg-blue-50 border-blue-100',
    purple: 'bg-purple-50 border-purple-100'
  };

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-gray-600">{title}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function InsightCard({ insight }) {
  const typeStyles = {
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertTriangle, iconColor: 'text-yellow-600' },
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
          <h4 className="font-semibold text-gray-800">{insight.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
          {insight.action && (
            <button className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              {insight.action}
              <ArrowUpRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Functions
function getPerformanceLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 50) return 'Average';
  return 'Needs Improvement';
}

function getScoreColor(score) {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
}

function getGradeStyle(score) {
  if (score >= 80) return 'bg-green-100 text-green-700';
  if (score >= 60) return 'bg-yellow-100 text-yellow-700';
  if (score >= 50) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

function isCurrentPeriod(startTime, endTime) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const start = startHour * 60 + startMin;
  const end = endHour * 60 + endMin;
  
  return currentTime >= start && currentTime <= end;
}

function getDaysUntilDue(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = due - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
