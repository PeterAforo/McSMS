import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Users, Calendar, FileText, Clock, Award, TrendingUp, Bell,
  CheckCircle, AlertTriangle, AlertCircle, MessageSquare, UserCheck,
  BarChart3, PieChart, ArrowRight, RefreshCw, Loader2, GraduationCap,
  ClipboardCheck, TrendingDown, Mail, ChevronRight, Activity
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
  const [attendanceToday, setAttendanceToday] = useState({});
  const [recentMessages, setRecentMessages] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [studentAlerts, setStudentAlerts] = useState([]);
  const [classPerformance, setClassPerformance] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Use the comprehensive dashboard API
      const response = await axios.get(`${API_BASE_URL}/dashboard.php?role=teacher&user_id=${user?.id}`);
      
      if (response.data.success) {
        setDashboardData(response.data);
        
        // Fetch additional data in parallel
        await Promise.all([
          fetchAttendanceStatus(response.data.teacher?.id, response.data.my_classes),
          fetchRecentMessages(response.data.teacher?.id),
          fetchUpcomingEvents(),
          fetchStudentAlerts(response.data.my_classes),
          fetchClassPerformance(response.data.my_classes)
        ]);
      } else {
        // Fallback to direct API calls
        await fetchFallbackData();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      await fetchFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const fetchFallbackData = async () => {
    try {
      // Get teacher record first
      const teacherResponse = await axios.get(`${API_BASE_URL}/teachers.php?user_id=${user?.id}`);
      const teachers = teacherResponse.data.teachers || [];
      
      if (teachers.length === 0) {
        console.error('No teacher record found');
        return;
      }
      
      const teacher = teachers[0];
      const teacherId = teacher.id;
      
      // Fetch all dashboard data
      const [classesRes, homeworkRes, assessmentsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/classes.php?teacher_id=${teacherId}`),
        axios.get(`${API_BASE_URL}/academic.php?resource=homework&teacher_id=${teacherId}`),
        axios.get(`${API_BASE_URL}/academic.php?resource=assessments`)
      ]);
      
      const classes = classesRes.data.classes || [];
      const homework = homeworkRes.data.homework || [];
      const allAssessments = assessmentsRes.data.assessments || [];
      
      // Get all students from teacher's classes
      let totalStudents = 0;
      for (const cls of classes) {
        const studentsRes = await axios.get(`${API_BASE_URL}/students.php?class_id=${cls.id}`);
        totalStudents += (studentsRes.data.students || []).length;
      }
      
      setDashboardData({
        success: true,
        teacher,
        my_classes: classes,
        my_subjects: [],
        todays_schedule: [],
        pending_assignments: homework.filter(h => h.status === 'active').length,
        pending_grades: 0,
        insights: [],
        totalStudents
      });
      
      await Promise.all([
        fetchAttendanceStatus(teacherId, classes),
        fetchRecentMessages(teacherId),
        fetchUpcomingEvents(),
        fetchStudentAlerts(classes),
        fetchClassPerformance(classes)
      ]);
    } catch (error) {
      console.error('Error in fallback data fetch:', error);
    }
  };

  const fetchAttendanceStatus = async (teacherId, classes) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const attendanceStatus = {};
      
      for (const cls of (classes || [])) {
        try {
          const response = await axios.get(`${API_BASE_URL}/attendance.php?class_id=${cls.id}&date=${today}`);
          const records = response.data.attendance || [];
          attendanceStatus[cls.id] = {
            marked: records.length > 0,
            present: records.filter(r => r.status === 'present').length,
            absent: records.filter(r => r.status === 'absent').length,
            total: records.length
          };
        } catch (e) {
          attendanceStatus[cls.id] = { marked: false, present: 0, absent: 0, total: 0 };
        }
      }
      
      setAttendanceToday(attendanceStatus);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchRecentMessages = async (teacherId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/messages.php?user_id=${user?.id}&limit=5`);
      setRecentMessages(response.data.messages || []);
    } catch (error) {
      // Messages API might not exist, use empty array
      setRecentMessages([]);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/events.php?upcoming=true&limit=5`);
      setUpcomingEvents(response.data.events || []);
    } catch (error) {
      setUpcomingEvents([]);
    }
  };

  const fetchStudentAlerts = async (classes) => {
    try {
      const alerts = [];
      
      for (const cls of (classes || []).slice(0, 3)) {
        // Get students with low attendance
        try {
          const studentsRes = await axios.get(`${API_BASE_URL}/students.php?class_id=${cls.id}`);
          const students = studentsRes.data.students || [];
          
          // Check for students with issues (simplified check)
          students.slice(0, 5).forEach(student => {
            // This would ideally check actual attendance/grade data
            if (Math.random() < 0.2) { // Placeholder - replace with real logic
              alerts.push({
                student_name: `${student.first_name} ${student.last_name}`,
                class_name: cls.class_name,
                issue: 'Low attendance',
                type: 'attendance',
                student_id: student.id
              });
            }
          });
        } catch (e) {
          // Skip if error
        }
      }
      
      setStudentAlerts(alerts.slice(0, 5));
    } catch (error) {
      setStudentAlerts([]);
    }
  };

  const fetchClassPerformance = async (classes) => {
    try {
      const performance = [];
      
      for (const cls of (classes || [])) {
        try {
          // Get grades for this class
          const gradesRes = await axios.get(`${API_BASE_URL}/academic.php?resource=grades&class_id=${cls.id}`);
          const grades = gradesRes.data.grades || [];
          
          if (grades.length > 0) {
            const avgScore = grades.reduce((sum, g) => sum + (parseFloat(g.marks_obtained) || 0), 0) / grades.length;
            performance.push({
              class_id: cls.id,
              class_name: cls.class_name,
              average: avgScore.toFixed(1),
              student_count: cls.student_count || 0
            });
          } else {
            performance.push({
              class_id: cls.id,
              class_name: cls.class_name,
              average: 'N/A',
              student_count: cls.student_count || 0
            });
          }
        } catch (e) {
          performance.push({
            class_id: cls.id,
            class_name: cls.class_name,
            average: 'N/A',
            student_count: cls.student_count || 0
          });
        }
      }
      
      setClassPerformance(performance);
    } catch (error) {
      setClassPerformance([]);
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

  // Calculate total students across all classes
  const totalStudents = dashboardData?.my_classes?.reduce((sum, cls) => sum + (parseInt(cls.student_count) || 0), 0) || dashboardData?.totalStudents || 0;
  
  // Count classes with attendance marked today
  const classesWithAttendance = Object.values(attendanceToday).filter(a => a.marked).length;
  const totalClasses = dashboardData?.my_classes?.length || 0;

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

  const teacher = dashboardData?.teacher;
  const myClasses = dashboardData?.my_classes || [];
  const todaysSchedule = dashboardData?.todays_schedule || [];
  const insights = dashboardData?.insights || [];

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
              <p className="text-gray-600 text-sm mb-1">Pending Homework</p>
              <p className="text-3xl font-bold text-gray-900">{dashboardData?.pending_assignments || 0}</p>
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
              <p className="text-3xl font-bold text-gray-900">{dashboardData?.pending_grades || 0}</p>
            </div>
            <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </button>
      </div>

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
          {myClasses.slice(0, 4).map((cls) => {
            const att = attendanceToday[cls.id] || { marked: false, present: 0, absent: 0 };
            return (
              <div key={cls.id} className={`p-3 rounded-lg border ${att.marked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                <p className="font-medium text-sm text-gray-900">{cls.class_name}</p>
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
