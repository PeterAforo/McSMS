import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Users, Calendar, FileText, Clock, Award, TrendingUp, Bell,
  CheckCircle, AlertTriangle, AlertCircle, MessageSquare, UserCheck,
  BarChart3, PieChart, ArrowRight, RefreshCw, Loader2, GraduationCap,
  ClipboardCheck, TrendingDown, Mail, ChevronRight, Activity, Eye,
  Target, Zap, Star, BookMarked, UserX, TrendingDown as TrendDown
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Use the new comprehensive teacher dashboard API
      const response = await axios.get(`${API_BASE_URL}/teacher_dashboard.php?user_id=${user?.id}`);
      
      if (response.data.success) {
        setDashboardData(response.data);
        setWeeklyStats(response.data.weekly_stats);
      } else {
        // Fallback to old API
        const fallbackRes = await axios.get(`${API_BASE_URL}/dashboard.php?role=teacher&user_id=${user?.id}`);
        if (fallbackRes.data.success) {
          setDashboardData({
            ...fallbackRes.data,
            classes: fallbackRes.data.my_classes || [],
            total_students: fallbackRes.data.my_classes?.reduce((sum, c) => sum + (parseInt(c.student_count) || 0), 0) || 0,
            attendance_status: [],
            student_alerts: [],
            class_performance: [],
            upcoming_events: [],
            recent_messages: [],
            weekly_stats: null
          });
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'alert': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const getInsightBg = (type) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'alert': return 'bg-red-50 border-red-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  // Extract data from dashboard response
  const teacher = dashboardData?.teacher;
  const myClasses = dashboardData?.classes || dashboardData?.my_classes || [];
  const totalStudents = dashboardData?.total_students || myClasses.reduce((sum, cls) => sum + (parseInt(cls.student_count) || 0), 0);
  const todaysSchedule = dashboardData?.todays_schedule || [];
  const attendanceStatus = dashboardData?.attendance_status || [];
  const classPerformance = dashboardData?.class_performance || [];
  const studentAlerts = dashboardData?.student_alerts || [];
  const upcomingEvents = dashboardData?.upcoming_events || [];
  const recentMessages = dashboardData?.recent_messages || [];
  const pendingHomework = dashboardData?.pending_homework || 0;
  const homeworkToReview = dashboardData?.homework_to_review || 0;
  const pendingGrades = dashboardData?.pending_grades || 0;
  
  // Count classes with attendance marked today
  const classesWithAttendance = attendanceStatus.filter(a => a.marked).length;
  const totalClasses = myClasses.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome Back, {teacher ? `${teacher.first_name} ${teacher.last_name}` : user?.name || 'Teacher'}!
            </h1>
            <p className="text-blue-100">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerts/Insights */}
      {insights.length > 0 && (
        <div className="space-y-3">
          {insights.slice(0, 3).map((insight, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getInsightBg(insight.type)} flex items-start gap-3`}>
              {getInsightIcon(insight.type)}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{insight.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
              </div>
              {insight.action && (
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  {insight.action} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          onClick={() => navigate('/teacher/classes')}
          className="card p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">My Classes</p>
              <p className="text-3xl font-bold text-gray-900">{myClasses.length}</p>
            </div>
            <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/teacher/students?all=true')}
          className="card p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
            </div>
            <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/teacher/homework')}
          className="card p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Homework to Review</p>
              <p className="text-3xl font-bold text-gray-900">{homeworkToReview}</p>
              {pendingHomework > 0 && (
                <p className="text-xs text-orange-600 mt-1">{pendingHomework} active assignments</p>
              )}
            </div>
            <div className="bg-orange-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/teacher/grading')}
          className="card p-6 hover:shadow-lg transition-shadow text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Grades to Enter</p>
              <p className="text-3xl font-bold text-gray-900">{pendingGrades}</p>
            </div>
            <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </button>
      </div>

      {/* Weekly Activity Stats */}
      {weeklyStats && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            This Week's Activity
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-teal-50 rounded-lg p-4 text-center">
              <ClipboardCheck className="w-6 h-6 text-teal-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-teal-700">{weeklyStats.attendance_marked || 0}</p>
              <p className="text-xs text-gray-600">Attendance Records</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">{weeklyStats.homework_assigned || 0}</p>
              <p className="text-xs text-gray-600">Homework Assigned</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <Award className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">{weeklyStats.grades_entered || 0}</p>
              <p className="text-xs text-gray-600">Grades Entered</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <MessageSquare className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{weeklyStats.messages_sent || 0}</p>
              <p className="text-xs text-gray-600">Messages Sent</p>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Summary */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Today's Attendance</h3>
              <p className="text-sm text-gray-500">{classesWithAttendance} of {totalClasses} classes marked</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/teacher/attendance')}
            className="btn btn-primary btn-sm"
          >
            Mark Attendance
          </button>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              classesWithAttendance === totalClasses && totalClasses > 0 ? 'bg-green-500' : 'bg-teal-500'
            }`}
            style={{ width: `${totalClasses > 0 ? (classesWithAttendance / totalClasses) * 100 : 0}%` }}
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(attendanceStatus.length > 0 ? attendanceStatus : myClasses).slice(0, 4).map((item) => {
            const att = item.marked !== undefined ? item : { marked: false, present: 0, absent: 0 };
            const className = item.class_name || myClasses.find(c => c.id === item.class_id)?.class_name || 'Class';
            return (
              <div key={item.class_id || item.id} className={`p-3 rounded-lg border ${att.marked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className="font-medium text-sm text-gray-900">{className}</p>
                {att.marked ? (
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <CheckCircle className="w-3 h-3" /> {att.present}P / {att.absent}A
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Not marked</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 card">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Today's Schedule
              </h2>
              <span className="text-sm text-gray-500">
                {todaysSchedule.length} class{todaysSchedule.length !== 1 ? 'es' : ''}
              </span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {todaysSchedule.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No classes scheduled for today</p>
                <p className="text-sm text-gray-400 mt-1">Enjoy your free day!</p>
              </div>
            ) : (
              todaysSchedule.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                  <div className="text-center min-w-[100px]">
                    <p className="text-sm font-medium text-gray-900">{item.start_time || '—'}</p>
                    <p className="text-xs text-gray-500">{item.end_time || '—'}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.subject_name}</p>
                    <p className="text-sm text-gray-600">{item.class_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/teacher/students?class=${item.class_id}`)}
                      className="btn bg-gray-200 hover:bg-gray-300 btn-sm"
                    >
                      Students
                    </button>
                    <button
                      onClick={() => navigate(`/teacher/attendance?class=${item.class_id}`)}
                      className="btn btn-primary btn-sm"
                    >
                      Attendance
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Class Performance */}
          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Class Performance
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {classPerformance.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No grade data available</p>
              ) : (
                classPerformance.slice(0, 4).map((cls, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{cls.class_name}</p>
                      <p className="text-xs text-gray-500">{cls.student_count} students</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      cls.average === 'N/A' ? 'bg-gray-100 text-gray-600' :
                      parseFloat(cls.average) >= 70 ? 'bg-green-100 text-green-700' :
                      parseFloat(cls.average) >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {cls.average === 'N/A' ? 'N/A' : `${cls.average}%`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Student Alerts */}
          <div className="card">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Student Alerts
              </h3>
            </div>
            <div className="p-4">
              {studentAlerts.length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No alerts at this time</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentAlerts.map((alert, index) => (
                    <div key={index} className="flex items-start gap-3 p-2 bg-orange-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{alert.student_name}</p>
                        <p className="text-xs text-gray-500">{alert.class_name} • {alert.issue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="card">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Upcoming Events
              </h3>
            </div>
            <div className="p-4">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 3).map((event, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs text-indigo-600 font-medium">
                          {new Date(event.start_date || event.event_date).toLocaleDateString('en-GB', { month: 'short' })}
                        </span>
                        <span className="text-sm font-bold text-indigo-700">
                          {new Date(event.start_date || event.event_date).getDate()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{event.title || event.event_name}</p>
                        <p className="text-xs text-gray-500">{event.location || 'School'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            Recent Messages
          </h2>
          <button 
            onClick={() => navigate('/teacher/messages')}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">
          {recentMessages.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent messages</p>
              <p className="text-sm text-gray-400 mt-1">Messages from parents will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentMessages.map((msg, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
                    {msg.sender_name?.charAt(0) || 'P'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{msg.sender_name || 'Parent'}</p>
                      <span className="text-xs text-gray-500">{msg.created_at ? new Date(msg.created_at).toLocaleDateString() : ''}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{msg.message || msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <button
          onClick={() => navigate('/teacher/homework')}
          className="card p-6 hover:shadow-lg transition-shadow text-left"
        >
          <FileText className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Manage Homework</h3>
          <p className="text-sm text-gray-600">Assign and review homework</p>
        </button>
        <button
          onClick={() => navigate('/teacher/grading')}
          className="card p-6 hover:shadow-lg transition-shadow text-left"
        >
          <Award className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Grade Students</h3>
          <p className="text-sm text-gray-600">Create assessments and grade</p>
        </button>
        <button
          onClick={() => navigate('/teacher/attendance')}
          className="card p-6 hover:shadow-lg transition-shadow text-left"
        >
          <ClipboardCheck className="w-8 h-8 text-purple-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Mark Attendance</h3>
          <p className="text-sm text-gray-600">Record daily attendance</p>
        </button>
        <button
          onClick={() => navigate('/teacher/reports')}
          className="card p-6 hover:shadow-lg transition-shadow text-left"
        >
          <BarChart3 className="w-8 h-8 text-orange-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">View Reports</h3>
          <p className="text-sm text-gray-600">Student performance reports</p>
        </button>
      </div>
    </div>
  );
}
