import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import {
  Users, GraduationCap, BookOpen, Award, TrendingUp, Building, Calendar,
  AlertTriangle, CheckCircle, Info, Brain, ArrowUpRight, BarChart3,
  UserCheck, Target, Briefcase, PieChart, Activity
} from 'lucide-react';

const API_BASE_URL = 'https://eea.mcaforo.com/backend/api';

export default function PrincipalDashboard() {
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchDashboardData();
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/dashboard.php?role=principal&user_id=${user.id}`);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-600">Failed to load dashboard</p></div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Principal Dashboard</h1>
            <p className="text-indigo-100 mt-1">School Performance Overview</p>
          </div>
          <div className="text-right">
            <p className="text-indigo-100">Today</p>
            <p className="text-xl font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {dashboardData.insights?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg"><Brain className="text-purple-600" size={24} /></div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">AI Insights</h2>
              <p className="text-gray-500 text-sm">Strategic recommendations for school improvement</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* School Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Total Students" value={dashboardData.school_overview?.total_students || 0} icon={<GraduationCap className="text-blue-600" size={24} />} color="blue" />
        <StatCard title="Total Staff" value={dashboardData.school_overview?.total_staff || 0} icon={<Briefcase className="text-green-600" size={24} />} color="green" />
        <StatCard title="Teachers" value={dashboardData.school_overview?.total_teachers || 0} icon={<Users className="text-purple-600" size={24} />} color="purple" />
        <StatCard title="Classes" value={dashboardData.school_overview?.total_classes || 0} icon={<Building className="text-orange-600" size={24} />} color="orange" />
        <StatCard title="Attendance" value={`${dashboardData.school_overview?.attendance_rate || 0}%`} icon={<UserCheck className="text-teal-600" size={24} />} color="teal" />
      </div>

      {/* Academic & Staff Overview */}
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
                <circle className="text-gray-200" strokeWidth="10" stroke="currentColor" fill="transparent" r="56" cx="64" cy="64" />
                <circle className={getScoreColor(dashboardData.academic?.pass_rate || 0)} strokeWidth="10" strokeDasharray={`${(dashboardData.academic?.pass_rate || 0) * 3.52} 352`} strokeLinecap="round" stroke="currentColor" fill="transparent" r="56" cx="64" cy="64" transform="rotate(-90 64 64)" />
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
              <p className="text-xl font-bold text-blue-600">{dashboardData.academic?.average_score || 0}</p>
              <p className="text-sm text-gray-600">Avg Score</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-xl font-bold text-purple-600">{dashboardData.school_overview?.total_subjects || 0}</p>
              <p className="text-sm text-gray-600">Subjects</p>
            </div>
          </div>
        </div>

        {/* Staff Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Staff Summary</h2>
            <Briefcase className="text-green-600" size={24} />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{dashboardData.staff?.present_today || 0}</p>
              <p className="text-sm text-gray-600">Present Today</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{dashboardData.staff?.on_leave || 0}</p>
              <p className="text-sm text-gray-600">On Leave</p>
            </div>
          </div>
          <h3 className="font-semibold text-gray-700 mb-3">By Department</h3>
          <div className="space-y-2">
            {dashboardData.staff?.by_department?.slice(0, 4).map((dept, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-gray-700">{dept.department_name}</span>
                <span className="font-semibold text-gray-800">{dept.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class Performance */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Class Performance</h2>
          <BarChart3 className="text-blue-600" size={24} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-gray-600">Class</th>
                <th className="text-center py-3 px-4 text-gray-600">Students</th>
                <th className="text-center py-3 px-4 text-gray-600">Avg Score</th>
                <th className="text-center py-3 px-4 text-gray-600">Pass Rate</th>
                <th className="text-center py-3 px-4 text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.class_performance?.map((cls, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{cls.class_name}</td>
                  <td className="py-3 px-4 text-center">{cls.student_count}</td>
                  <td className="py-3 px-4 text-center">{cls.avg_score || 0}%</td>
                  <td className="py-3 px-4 text-center">{cls.pass_rate || 0}%</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${(cls.pass_rate || 0) >= 70 ? 'bg-green-100 text-green-700' : (cls.pass_rate || 0) >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {(cls.pass_rate || 0) >= 70 ? 'Good' : (cls.pass_rate || 0) >= 50 ? 'Average' : 'Needs Attention'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teacher Performance & Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teacher Performance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Teacher Overview</h2>
            <Users className="text-purple-600" size={24} />
          </div>
          <div className="space-y-3">
            {dashboardData.teacher_performance?.slice(0, 5).map((teacher, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{teacher.teacher_name}</p>
                  <p className="text-sm text-gray-500">{teacher.subjects_taught} subjects</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-purple-600">{teacher.classes_assigned}</p>
                  <p className="text-xs text-gray-500">classes</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Recent Events</h2>
            <Activity className="text-blue-600" size={24} />
          </div>
          <div className="space-y-3">
            {dashboardData.recent_events?.map((event, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full ${event.type === 'admission' ? 'bg-blue-100' : 'bg-green-100'}`}>
                  {event.type === 'admission' ? <GraduationCap className="text-blue-600" size={18} /> : <Briefcase className="text-green-600" size={18} />}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800">{event.description}</p>
                  <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = { blue: 'bg-blue-50', green: 'bg-green-50', purple: 'bg-purple-50', orange: 'bg-orange-50', teal: 'bg-teal-50' };
  return (
    <div className={`${colors[color]} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-600">{title}</p>
    </div>
  );
}

function InsightCard({ insight }) {
  const styles = {
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertTriangle, iconColor: 'text-yellow-600' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: Info, iconColor: 'text-blue-600' },
    success: { bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, iconColor: 'text-green-600' }
  };
  const style = styles[insight.type] || styles.info;
  const Icon = style.icon;
  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={style.iconColor} size={20} />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{insight.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
          {insight.action && <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">{insight.action}<ArrowUpRight size={14} /></button>}
        </div>
      </div>
    </div>
  );
}

function getScoreColor(score) {
  if (score >= 70) return 'text-green-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
}

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
