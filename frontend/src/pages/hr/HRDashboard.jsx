import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import {
  Users, Briefcase, Calendar, Clock, DollarSign, UserCheck, UserX,
  AlertTriangle, CheckCircle, Info, Brain, ArrowUpRight, BarChart3,
  FileText, TrendingUp, Building, PieChart, Activity
} from 'lucide-react';

const API_BASE_URL = 'https://eea.mcaforo.com/backend/api';

export default function HRDashboard() {
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) fetchDashboardData();
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/dashboard.php?role=hr&user_id=${user.id}`);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-600">Failed to load dashboard</p></div>;
  }

  const attendanceRate = dashboardData.attendance?.today?.total > 0 
    ? Math.round((dashboardData.attendance.today.present / dashboardData.attendance.today.total) * 100) 
    : 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">HR Dashboard</h1>
            <p className="text-purple-100 mt-1">Human Resources Management</p>
          </div>
          <div className="text-right">
            <p className="text-purple-100">Today's Date</p>
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
              <p className="text-gray-500 text-sm">HR recommendations and alerts</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard title="Total Employees" value={dashboardData.employees?.total || 0} icon={<Users className="text-blue-600" size={24} />} color="blue" />
        <StatCard title="Teachers" value={dashboardData.employees?.teachers || 0} icon={<Briefcase className="text-green-600" size={24} />} color="green" />
        <StatCard title="Present Today" value={dashboardData.attendance?.today?.present || 0} icon={<UserCheck className="text-teal-600" size={24} />} color="teal" />
        <StatCard title="On Leave" value={dashboardData.leave?.on_leave_today || 0} icon={<UserX className="text-orange-600" size={24} />} color="orange" />
        <StatCard title="Pending Leaves" value={dashboardData.leave?.pending || 0} icon={<Clock className="text-red-600" size={24} />} color="red" />
      </div>

      {/* Attendance & Leave */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Attendance Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Today's Attendance</h2>
            <UserCheck className="text-green-600" size={24} />
          </div>
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <svg className="w-32 h-32">
                <circle className="text-gray-200" strokeWidth="10" stroke="currentColor" fill="transparent" r="56" cx="64" cy="64" />
                <circle className={attendanceRate >= 90 ? 'text-green-500' : attendanceRate >= 75 ? 'text-yellow-500' : 'text-red-500'} strokeWidth="10" strokeDasharray={`${attendanceRate * 3.52} 352`} strokeLinecap="round" stroke="currentColor" fill="transparent" r="56" cx="64" cy="64" transform="rotate(-90 64 64)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-2xl font-bold">{attendanceRate}%</span>
                  <p className="text-xs text-gray-500">Present</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xl font-bold text-green-600">{dashboardData.attendance?.today?.present || 0}</p>
              <p className="text-sm text-gray-600">Present</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xl font-bold text-red-600">{dashboardData.attendance?.today?.absent || 0}</p>
              <p className="text-sm text-gray-600">Absent</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-xl font-bold text-yellow-600">{dashboardData.attendance?.today?.late || 0}</p>
              <p className="text-sm text-gray-600">Late</p>
            </div>
          </div>
        </div>

        {/* Leave Management */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Leave Management</h2>
            <Calendar className="text-blue-600" size={24} />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{dashboardData.leave?.pending || 0}</p>
              <p className="text-sm text-gray-600">Pending Approval</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{dashboardData.leave?.approved_this_month || 0}</p>
              <p className="text-sm text-gray-600">Approved This Month</p>
            </div>
          </div>
          <h3 className="font-semibold text-gray-700 mb-3">Recent Applications</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {dashboardData.leave?.recent?.slice(0, 4).map((leave, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{leave.employee_name}</p>
                  <p className="text-xs text-gray-500">{leave.leave_type}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${leave.status === 'approved' ? 'bg-green-100 text-green-700' : leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {leave.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payroll & Departments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Payroll Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Payroll Summary</h2>
            <DollarSign className="text-green-600" size={24} />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <span className="text-gray-600">Total Employees</span>
              <span className="font-semibold text-blue-600">{dashboardData.payroll?.current_month?.employee_count || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <span className="text-gray-600">Total Net Salary</span>
              <span className="font-semibold text-green-600">GHS {parseFloat(dashboardData.payroll?.current_month?.total_net || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <span className="text-gray-600">Total Earnings</span>
              <span className="font-semibold text-purple-600">GHS {parseFloat(dashboardData.payroll?.current_month?.total_earnings || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <span className="text-gray-600">Total Deductions</span>
              <span className="font-semibold text-orange-600">GHS {parseFloat(dashboardData.payroll?.current_month?.total_deductions || 0).toLocaleString()}</span>
            </div>
            {dashboardData.payroll?.pending_payment?.count > 0 && (
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <span className="text-gray-600">Pending Payment</span>
                <span className="font-semibold text-red-600">{dashboardData.payroll.pending_payment.count} employees</span>
              </div>
            )}
          </div>
        </div>

        {/* Department Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Department Overview</h2>
            <Building className="text-purple-600" size={24} />
          </div>
          <div className="space-y-3">
            {dashboardData.departments?.map((dept, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{dept.department_name}</span>
                  <span className="text-purple-600 font-semibold">{dept.employee_count} staff</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Salary</span>
                  <span className="text-gray-700">GHS {parseFloat(dept.total_salary || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Chart & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Attendance Trend (7 Days)</h2>
            <BarChart3 className="text-blue-600" size={24} />
          </div>
          <div className="h-48">
            {dashboardData.charts?.attendance && <AttendanceChart data={dashboardData.charts.attendance} />}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div><span className="text-sm text-gray-600">Present</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div><span className="text-sm text-gray-600">Absent</span></div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Recent Activities</h2>
            <Activity className="text-green-600" size={24} />
          </div>
          <div className="space-y-3">
            {dashboardData.activities?.slice(0, 6).map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full ${activity.type === 'leave' ? 'bg-blue-100' : 'bg-green-100'}`}>
                  {activity.type === 'leave' ? <Calendar className="text-blue-600" size={18} /> : <DollarSign className="text-green-600" size={18} />}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 text-sm">{activity.description}</p>
                  <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
                </div>
                {activity.status && (
                  <span className={`px-2 py-1 rounded-full text-xs ${activity.status === 'approved' || activity.status === 'paid' ? 'bg-green-100 text-green-700' : activity.status === 'pending' || activity.status === 'processed' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {activity.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = { blue: 'bg-blue-50', green: 'bg-green-50', teal: 'bg-teal-50', orange: 'bg-orange-50', red: 'bg-red-50' };
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
          {insight.action && <button className="mt-2 text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">{insight.action}<ArrowUpRight size={14} /></button>}
        </div>
      </div>
    </div>
  );
}

function AttendanceChart({ data }) {
  const maxValue = Math.max(...data.map(d => d.present + d.absent), 1);
  return (
    <div className="flex items-end justify-between h-full gap-2">
      {data.map((day, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col gap-1" style={{ height: '140px' }}>
            <div className="w-full bg-green-500 rounded-t" style={{ height: `${(day.present / maxValue) * 100}%` }}></div>
            <div className="w-full bg-red-400 rounded-b" style={{ height: `${(day.absent / maxValue) * 100}%` }}></div>
          </div>
          <span className="text-xs text-gray-500">{day.day}</span>
        </div>
      ))}
    </div>
  );
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
