import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import FamilyLinkCode from '../../components/parent/FamilyLinkCode';
import {
  Users, GraduationCap, BookOpen, Calendar, Award, DollarSign, CheckCircle,
  AlertTriangle, Info, TrendingUp, ArrowUpRight, User, Bell, FileText,
  CreditCard, BarChart3, Clock, ChevronRight, ChevronLeft,
  MessageSquare, ClipboardList, UserPlus, Link2, X, Home,
  CalendarDays, Wallet, Send, Star, Target, Activity,
  CheckCircle2, XCircle, AlertCircle, Eye, Download, Printer,
  TrendingDown, Minus, BookMarked, School, PenTool, RefreshCw,
  Mail, Phone, Zap, Brain, LineChart, PieChart
} from 'lucide-react';

export default function ParentProDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedChild, setSelectedChild] = useState(null);
  const [showFamilyLink, setShowFamilyLink] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [messageForm, setMessageForm] = useState({ subject: '', message: '' });
  const [performanceData, setPerformanceData] = useState([]);
  const [subjectAnalysis, setSubjectAnalysis] = useState([]);
  
  const [children, setChildren] = useState([]);
  const [homework, setHomework] = useState([]);
  const [attendance, setAttendance] = useState({ records: [], summary: {} });
  const [grades, setGrades] = useState([]);
  const [fees, setFees] = useState({ invoices: [], payments: [], summary: {} });
  const [events, setEvents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [reportCards, setReportCards] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [meetingForm, setMeetingForm] = useState({
    teacher_id: '', subject: '', message: '', preferred_date: '', preferred_time: ''
  });

  useEffect(() => {
    if (user?.id) fetchDashboardData();
  }, [user?.id]);

  useEffect(() => {
    if (selectedChild) fetchChildData(selectedChild.child_id || selectedChild.student_id);
  }, [selectedChild]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/parent_portal.php?resource=dashboard&parent_id=${user.id}`);
      if (response.data.success && response.data.dashboard) {
        const data = response.data.dashboard;
        setChildren(data.children || []);
        setNotifications(data.recent_notifications || []);
        setEvents(data.upcoming_events || []);
        if (data.children?.length > 0) setSelectedChild(data.children[0]);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChildData = async (childId) => {
    try {
      const [homeworkRes, attendanceRes, gradesRes, teachersRes, reportCardsRes, feesRes, meetingsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/parent_portal.php?resource=homework&student_id=${childId}`).catch(() => ({ data: { homework: [] } })),
        axios.get(`${API_BASE_URL}/parent_portal.php?resource=attendance&student_id=${childId}`).catch(() => ({ data: { records: [], summary: {} } })),
        axios.get(`${API_BASE_URL}/parent_portal.php?resource=grades&student_id=${childId}`).catch(() => ({ data: { grades: [] } })),
        axios.get(`${API_BASE_URL}/parent_portal.php?resource=teachers&student_id=${childId}`).catch(() => ({ data: { teachers: [] } })),
        axios.get(`${API_BASE_URL}/parent_portal.php?resource=report_cards&student_id=${childId}`).catch(() => ({ data: { report_cards: [] } })),
        axios.get(`${API_BASE_URL}/parent_portal.php?resource=fees&parent_id=${user.id}&student_id=${childId}`).catch(() => ({ data: { invoices: [], payments: [] } })),
        axios.get(`${API_BASE_URL}/parent_portal.php?resource=meetings&parent_id=${user.id}`).catch(() => ({ data: { meetings: [] } }))
      ]);
      setHomework(homeworkRes.data.homework || []);
      setAttendance(attendanceRes.data || { records: [], summary: {} });
      const gradesData = gradesRes.data.grades || [];
      setGrades(gradesData);
      setTeachers(teachersRes.data.teachers || []);
      setReportCards(reportCardsRes.data.report_cards || []);
      setFees(feesRes.data || { invoices: [], payments: [] });
      setMeetings(meetingsRes.data.meetings || []);
      
      // Calculate performance trends and subject analysis
      calculatePerformanceData(gradesData);
      calculateSubjectAnalysis(gradesData);
    } catch (error) {
      console.error('Error fetching child data:', error);
    }
  };

  const calculatePerformanceData = (gradesData) => {
    const monthlyData = {};
    gradesData.forEach(g => {
      const date = new Date(g.assessment_date || g.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { total: 0, count: 0 };
      const pct = g.max_score > 0 ? (g.score / g.max_score) * 100 : 0;
      monthlyData[monthKey].total += pct;
      monthlyData[monthKey].count++;
    });
    const trends = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en', { month: 'short' }),
        average: Math.round(data.total / data.count)
      }));
    setPerformanceData(trends);
  };

  const calculateSubjectAnalysis = (gradesData) => {
    const subjects = {};
    gradesData.forEach(g => {
      const subj = g.subject_name || 'Unknown';
      if (!subjects[subj]) subjects[subj] = { total: 0, max: 0, count: 0, scores: [] };
      subjects[subj].total += g.score || 0;
      subjects[subj].max += g.max_score || 0;
      subjects[subj].count++;
      subjects[subj].scores.push(g.max_score > 0 ? (g.score / g.max_score) * 100 : 0);
    });
    const analysis = Object.entries(subjects).map(([name, data]) => {
      const avg = data.max > 0 ? (data.total / data.max) * 100 : 0;
      const sorted = [...data.scores].sort((a, b) => b - a);
      const trend = data.scores.length > 1 ? data.scores[data.scores.length - 1] - data.scores[0] : 0;
      return {
        subject: name,
        average: Math.round(avg),
        assessments: data.count,
        highest: Math.round(sorted[0] || 0),
        lowest: Math.round(sorted[sorted.length - 1] || 0),
        trend: trend > 5 ? 'improving' : trend < -5 ? 'declining' : 'stable',
        strength: avg >= 70 ? 'strong' : avg >= 50 ? 'average' : 'weak'
      };
    }).sort((a, b) => b.average - a.average);
    setSubjectAnalysis(analysis);
  };

  const sendTeacherMessage = async () => {
    if (!selectedTeacher || !messageForm.subject || !messageForm.message) {
      alert('Please fill all fields');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/parent_portal.php?resource=send_message`, {
        parent_id: user.id,
        teacher_id: selectedTeacher.id,
        subject: messageForm.subject,
        message: messageForm.message
      });
      setShowMessageModal(false);
      setMessageForm({ subject: '', message: '' });
      setSelectedTeacher(null);
      alert('Message sent successfully!');
    } catch (error) {
      alert('Failed to send message');
    }
  };

  const requestMeeting = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/parent_portal.php?resource=request_meeting`, {
        parent_id: user.id, student_id: selectedChild?.child_id || selectedChild?.student_id, ...meetingForm
      });
      if (response.data.success) {
        setShowMeetingModal(false);
        setMeetingForm({ teacher_id: '', subject: '', message: '', preferred_date: '', preferred_time: '' });
        fetchChildData(selectedChild?.child_id || selectedChild?.student_id);
        alert('Meeting request sent!');
      }
    } catch (error) {
      alert('Failed to send meeting request');
    }
  };

  const acknowledgeReport = async (termId) => {
    try {
      await axios.post(`${API_BASE_URL}/parent_portal.php?resource=acknowledge_report`, {
        parent_id: user.id, student_id: selectedChild?.child_id || selectedChild?.student_id, term_id: termId, academic_year: new Date().getFullYear().toString()
      });
      fetchChildData(selectedChild?.child_id || selectedChild?.student_id);
      alert('Report acknowledged!');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const submitRsvp = async (eventId, response) => {
    try {
      await axios.post(`${API_BASE_URL}/parent_portal.php?resource=rsvp`, {
        parent_id: user.id, event_id: eventId, student_id: selectedChild?.child_id || selectedChild?.student_id, response
      });
      fetchDashboardData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const pendingHomework = homework.filter(h => !h.submission_id).length;
  const overdueHomework = homework.filter(h => !h.submission_id && new Date(h.due_date) < new Date()).length;
  const attendanceRate = attendance.summary?.total > 0 ? Math.round((attendance.summary.present / attendance.summary.total) * 100) : 0;
  const averageGrade = grades.length > 0 ? Math.round(grades.reduce((sum, g) => sum + (parseFloat(g.percentage) || 0), 0) / grades.length) : 0;
  const totalFeesDue = fees.summary?.total_due || fees.invoices?.reduce((sum, inv) => sum + parseFloat(inv.balance || 0), 0) || 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'homework', label: 'Homework', icon: BookOpen },
    { id: 'attendance', label: 'Attendance', icon: CalendarDays },
    { id: 'grades', label: 'Grades', icon: BarChart3 },
    { id: 'analysis', label: 'Analysis', icon: Brain },
    { id: 'fees', label: 'Fees', icon: Wallet },
    { id: 'meetings', label: 'Meetings', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user?.name?.split(' ')[0] || 'Parent'}</h1>
              <p className="text-purple-200">Parent Portal Pro</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowFamilyLink(true)} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2">
                <Link2 size={18} /><span className="hidden sm:inline">Family Link</span>
              </button>
              <button onClick={fetchDashboardData} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg"><RefreshCw size={18} /></button>
            </div>
          </div>
          {children.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {children.map((child) => (
                <button key={child.child_id || child.student_id} onClick={() => setSelectedChild(child)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
                    (selectedChild?.child_id || selectedChild?.student_id) === (child.child_id || child.student_id) ? 'bg-white text-purple-700 shadow-lg' : 'bg-white/20 hover:bg-white/30'
                  }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    (selectedChild?.child_id || selectedChild?.student_id) === (child.child_id || child.student_id) ? 'bg-purple-100 text-purple-700' : 'bg-white/30'
                  }`}>{child.full_name?.charAt(0) || 'C'}</div>
                  <div className="text-left">
                    <p className="font-semibold">{child.full_name}</p>
                    <p className={`text-xs ${(selectedChild?.child_id || selectedChild?.student_id) === (child.child_id || child.student_id) ? 'text-purple-500' : 'text-purple-200'}`}>{child.class_name || 'No class'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 -mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<BookOpen className="text-blue-600" />} label="Homework" value={pendingHomework} subtext={overdueHomework > 0 ? `${overdueHomework} overdue` : 'All on track'} color="blue" alert={overdueHomework > 0} />
          <StatCard icon={<CalendarDays className="text-green-600" />} label="Attendance" value={`${attendanceRate}%`} subtext={`${attendance.summary?.present || 0} of ${attendance.summary?.total || 0} days`} color="green" />
          <StatCard icon={<BarChart3 className="text-purple-600" />} label="Average" value={`${averageGrade}%`} subtext={getGradeLabel(averageGrade)} color="purple" />
          <StatCard icon={<Wallet className="text-orange-600" />} label="Fees Due" value={`GHS ${totalFeesDue.toLocaleString()}`} subtext={totalFeesDue > 0 ? 'Payment pending' : 'All paid'} color="orange" alert={totalFeesDue > 0} />
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-xl shadow-sm p-1 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                <Icon size={18} /><span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && <OverviewTab homework={homework} attendance={attendance} grades={grades} events={events} notifications={notifications} performanceData={performanceData} />}
        {activeTab === 'homework' && <HomeworkTab homework={homework} />}
        {activeTab === 'attendance' && <AttendanceTab attendance={attendance} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} />}
        {activeTab === 'grades' && <GradesTab grades={grades} performanceData={performanceData} />}
        {activeTab === 'analysis' && <AnalysisTab subjectAnalysis={subjectAnalysis} performanceData={performanceData} grades={grades} />}
        {activeTab === 'fees' && <FeesTab fees={fees} />}
        {activeTab === 'meetings' && <MeetingsTab meetings={meetings} teachers={teachers} onRequestMeeting={() => setShowMeetingModal(true)} />}
        {activeTab === 'events' && <EventsTab events={events} onRsvp={submitRsvp} />}
        {activeTab === 'reports' && <ReportsTab reportCards={reportCards} onAcknowledge={acknowledgeReport} />}
        {activeTab === 'messages' && <MessagesTab teachers={teachers} onMessage={(t) => { setSelectedTeacher(t); setShowMessageModal(true); }} />}
      </div>

      {/* Modals */}
      {showFamilyLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-md w-full">
            <button onClick={() => setShowFamilyLink(false)} className="absolute -top-2 -right-2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"><X size={20} /></button>
            <FamilyLinkCode parentId={user?.id} children={children} onLinkSuccess={() => { setShowFamilyLink(false); fetchDashboardData(); }} />
          </div>
        </div>
      )}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
            <button onClick={() => setShowMeetingModal(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            <h3 className="text-xl font-bold mb-4">Request Meeting</h3>
            <div className="space-y-4">
              <select value={meetingForm.teacher_id} onChange={(e) => setMeetingForm({ ...meetingForm, teacher_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Select teacher...</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name || t.teacher_name} - {t.role || t.subject_name}</option>)}
              </select>
              <input type="text" placeholder="Subject" value={meetingForm.subject} onChange={(e) => setMeetingForm({ ...meetingForm, subject: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <textarea placeholder="Message" value={meetingForm.message} onChange={(e) => setMeetingForm({ ...meetingForm, message: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg" />
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={meetingForm.preferred_date} onChange={(e) => setMeetingForm({ ...meetingForm, preferred_date: e.target.value })} className="px-3 py-2 border rounded-lg" />
                <input type="time" value={meetingForm.preferred_time} onChange={(e) => setMeetingForm({ ...meetingForm, preferred_time: e.target.value })} className="px-3 py-2 border rounded-lg" />
              </div>
              <button onClick={requestMeeting} className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Send Request</button>
            </div>
          </div>
        </div>
      )}
      {showMessageModal && selectedTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full relative">
            <button onClick={() => { setShowMessageModal(false); setSelectedTeacher(null); }} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            <h3 className="text-xl font-bold mb-4">Message {selectedTeacher.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedTeacher.role || 'Teacher'}</p>
            <div className="space-y-4">
              <input type="text" placeholder="Subject" value={messageForm.subject} onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              <textarea placeholder="Your message..." value={messageForm.message} onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })} rows={5} className="w-full px-3 py-2 border rounded-lg" />
              <button onClick={sendTeacherMessage} className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"><Send size={18} />Send Message</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, subtext, color, alert }) {
  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-lg bg-gray-50">{icon}</div>
        {alert && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
      </div>
      <p className="text-2xl font-bold text-gray-800 mt-3">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-xs mt-1 ${alert ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{subtext}</p>
    </div>
  );
}

function getGradeLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 50) return 'Average';
  return 'Needs Improvement';
}

function OverviewTab({ homework, attendance, grades, events, notifications, performanceData }) {
  const pendingHomework = homework.filter(h => !h.submission_id);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {performanceData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="text-indigo-600" size={20} />Performance Trend</h3>
            <PerformanceChart data={performanceData} />
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><BookOpen className="text-blue-600" size={20} />Pending Homework</h3>
          {pendingHomework.length === 0 ? <p className="text-center py-8 text-gray-500">All homework completed!</p> : (
            <div className="space-y-3">{pendingHomework.slice(0, 4).map((hw, idx) => <HomeworkItem key={idx} homework={hw} />)}</div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><BarChart3 className="text-purple-600" size={20} />Recent Grades</h3>
          {grades.length === 0 ? <p className="text-center py-8 text-gray-500">No grades yet</p> : (
            <div className="space-y-3">{grades.slice(0, 5).map((g, idx) => <GradeItem key={idx} grade={g} />)}</div>
          )}
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><CalendarDays className="text-green-600" size={20} />Attendance</h3>
          <AttendanceRing summary={attendance.summary} />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Bell className="text-red-600" size={20} />Notifications</h3>
          {notifications.length === 0 ? <p className="text-gray-500 text-center py-4">No notifications</p> : (
            <div className="space-y-2">{notifications.slice(0, 5).map((n, idx) => (
              <div key={idx} className={`p-3 rounded-lg text-sm flex items-start gap-2 ${n.type === 'alert' ? 'bg-red-50' : n.type === 'warning' ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                {n.type === 'alert' ? <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" /> : <Bell size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />}
                <span>{n.message || n.title}</span>
              </div>
            ))}</div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Calendar className="text-orange-600" size={20} />Upcoming Events</h3>
          {events.length === 0 ? <p className="text-gray-500 text-center py-4">No upcoming events</p> : (
            <div className="space-y-2">{events.slice(0, 3).map((e, idx) => (
              <div key={idx} className="p-3 bg-orange-50 rounded-lg">
                <p className="font-medium text-sm">{e.title}</p>
                <p className="text-xs text-gray-500">{e.start_date}</p>
              </div>
            ))}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function HomeworkTab({ homework }) {
  const pending = homework.filter(h => !h.submission_id);
  const submitted = homework.filter(h => h.submission_status === 'submitted');
  const graded = homework.filter(h => h.submission_status === 'graded');
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center"><p className="text-3xl font-bold text-yellow-600">{pending.length}</p><p className="text-sm text-gray-600">Pending</p></div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center"><p className="text-3xl font-bold text-blue-600">{submitted.length}</p><p className="text-sm text-gray-600">Submitted</p></div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center"><p className="text-3xl font-bold text-green-600">{graded.length}</p><p className="text-sm text-gray-600">Graded</p></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">All Assignments</h3>
        {homework.length === 0 ? <p className="text-center py-12 text-gray-500">No homework found</p> : (
          <div className="space-y-4">{homework.map((hw, idx) => <HomeworkItem key={idx} homework={hw} detailed />)}</div>
        )}
      </div>
    </div>
  );
}

function AttendanceTab({ attendance, currentMonth, setCurrentMonth }) {
  const { records, summary } = attendance;
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const getRecord = (day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return records.find(r => r.date === dateStr);
  };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-green-600">{summary.present || 0}</p><p className="text-sm">Present</p></div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-red-600">{summary.absent || 0}</p><p className="text-sm">Absent</p></div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{summary.late || 0}</p><p className="text-sm">Late</p></div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-purple-600">{summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0}%</p><p className="text-sm">Rate</p></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
          <h3 className="text-lg font-semibold">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} /></button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-sm font-medium text-gray-500 py-2">{d}</div>)}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const rec = getRecord(day);
            let bg = 'bg-gray-50';
            if (rec?.status === 'present') bg = 'bg-green-100';
            else if (rec?.status === 'absent') bg = 'bg-red-100';
            else if (rec?.status === 'late') bg = 'bg-yellow-100';
            return <div key={day} className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium ${bg}`}>{day}</div>;
          })}
        </div>
        <div className="flex justify-center gap-6 mt-6 pt-4 border-t">
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-100 rounded"></div><span className="text-sm">Present</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-100 rounded"></div><span className="text-sm">Absent</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-100 rounded"></div><span className="text-sm">Late</span></div>
        </div>
      </div>
    </div>
  );
}

function GradesTab({ grades, performanceData }) {
  const subjectGrades = grades.reduce((acc, g) => { const s = g.subject_name || 'Unknown'; if (!acc[s]) acc[s] = []; acc[s].push(g); return acc; }, {});
  return (
    <div className="space-y-6">
      {performanceData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><LineChart className="text-indigo-600" size={20} />Grade Trend Over Time</h3>
          <PerformanceChart data={performanceData} />
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="text-purple-600" size={20} />Performance by Subject</h3>
        {Object.keys(subjectGrades).length === 0 ? <p className="text-center py-12 text-gray-500">No grades available</p> : (
          <div className="space-y-4">
            {Object.entries(subjectGrades).map(([subject, list]) => {
              const avg = list.reduce((s, g) => s + (parseFloat(g.percentage) || (g.max_score > 0 ? (g.score / g.max_score) * 100 : 0)), 0) / list.length;
              return (
                <div key={subject} className="border rounded-xl p-4">
                  <div className="flex justify-between mb-2"><span className="font-semibold">{subject}</span><span className={`font-bold ${avg >= 70 ? 'text-green-600' : avg >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{Math.round(avg)}%</span></div>
                  <div className="h-2 bg-gray-200 rounded-full"><div className={`h-full rounded-full ${avg >= 70 ? 'bg-green-500' : avg >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(avg, 100)}%` }} /></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">All Grades</h3>
        {grades.length === 0 ? <p className="text-gray-500 text-center py-8">No grades recorded</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="text-left py-2 px-3">Subject</th><th className="text-left py-2 px-3">Assessment</th><th className="text-center py-2 px-3">Score</th><th className="text-center py-2 px-3">Date</th></tr></thead>
              <tbody>{grades.slice(0, 15).map((g, idx) => {
                const pct = g.max_score > 0 ? Math.round((g.score / g.max_score) * 100) : 0;
                return (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{g.subject_name || 'N/A'}</td>
                    <td className="py-2 px-3 text-gray-600">{g.assessment_title || g.assessment_type || 'Assessment'}</td>
                    <td className="py-2 px-3 text-center"><span className={`font-bold ${pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{g.score}/{g.max_score}</span></td>
                    <td className="py-2 px-3 text-center text-gray-500">{g.assessment_date ? new Date(g.assessment_date).toLocaleDateString() : '-'}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FeesTab({ fees }) {
  const { invoices = [], payments = [] } = fees;
  const totalBilled = invoices.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount || 0), 0);
  const balance = invoices.reduce((s, i) => s + parseFloat(i.balance || 0), 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6"><p className="text-sm text-gray-600">Total Billed</p><p className="text-2xl font-bold text-blue-600">GHS {totalBilled.toLocaleString()}</p></div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-6"><p className="text-sm text-gray-600">Total Paid</p><p className="text-2xl font-bold text-green-600">GHS {totalPaid.toLocaleString()}</p></div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-6"><p className="text-sm text-gray-600">Balance</p><p className="text-2xl font-bold text-orange-600">GHS {balance.toLocaleString()}</p></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Invoices</h3>
        {invoices.length === 0 ? <p className="text-gray-500 text-center py-8">No invoices</p> : (
          <div className="space-y-3">{invoices.map((inv, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div><p className="font-medium">{inv.description || 'School Fees'}</p><p className="text-sm text-gray-500">{inv.due_date}</p></div>
              <div className="text-right"><p className="font-bold">GHS {parseFloat(inv.amount || 0).toLocaleString()}</p><p className={`text-sm ${parseFloat(inv.balance) > 0 ? 'text-orange-600' : 'text-green-600'}`}>{parseFloat(inv.balance) > 0 ? `Due: GHS ${parseFloat(inv.balance).toLocaleString()}` : 'Paid'}</p></div>
            </div>
          ))}</div>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Payment History</h3>
        {payments.length === 0 ? <p className="text-gray-500 text-center py-8">No payments</p> : (
          <div className="space-y-3">{payments.map((p, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div><p className="font-medium text-green-600">GHS {parseFloat(p.amount).toLocaleString()}</p><p className="text-sm text-gray-500">{p.payment_date}</p></div>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{p.payment_method || 'Cash'}</span>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}

function MeetingsTab({ meetings, teachers, onRequestMeeting }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end"><button onClick={onRequestMeeting} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"><UserPlus size={18} />Request Meeting</button></div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Your Meetings</h3>
        {meetings.length === 0 ? <p className="text-gray-500 text-center py-8">No meetings scheduled</p> : (
          <div className="space-y-3">{meetings.map((m, idx) => (
            <div key={idx} className="p-4 border rounded-lg">
              <div className="flex justify-between"><p className="font-semibold">{m.subject}</p><span className={`px-2 py-1 rounded-full text-xs ${m.status === 'approved' ? 'bg-green-100 text-green-700' : m.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{m.status}</span></div>
              <p className="text-sm text-gray-500 mt-1">{m.teacher_name} • {m.meeting_date || m.preferred_date}</p>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}

function EventsTab({ events, onRsvp }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">School Events</h3>
      {events.length === 0 ? <p className="text-gray-500 text-center py-8">No events</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{events.map((e, idx) => (
          <div key={idx} className="border rounded-xl p-4">
            <h4 className="font-semibold">{e.title}</h4>
            <p className="text-sm text-gray-500 mt-1">{e.start_date} {e.start_time && `at ${e.start_time}`}</p>
            {e.description && <p className="text-sm text-gray-600 mt-2">{e.description}</p>}
            {e.requires_rsvp && (
              <div className="flex gap-2 mt-3">
                <button onClick={() => onRsvp(e.id, 'attending')} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200">Attending</button>
                <button onClick={() => onRsvp(e.id, 'not_attending')} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">Not Attending</button>
              </div>
            )}
          </div>
        ))}</div>
      )}
    </div>
  );
}

function ReportsTab({ reportCards, onAcknowledge }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Report Cards</h3>
      {reportCards.length === 0 ? <p className="text-gray-500 text-center py-12">No report cards available</p> : (
        <div className="space-y-4">{reportCards.map((r, idx) => (
          <div key={idx} className="border rounded-xl p-4">
            <div className="flex justify-between items-center">
              <div><h4 className="font-semibold">{r.term_name || `Term ${r.term_id}`}</h4><p className="text-sm text-gray-500">{r.academic_year || new Date().getFullYear()}</p></div>
              <div className="flex items-center gap-3">
                {r.acknowledged ? <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-1"><CheckCircle2 size={14} />Acknowledged</span> : (
                  <button onClick={() => onAcknowledge(r.term_id)} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 flex items-center gap-2"><PenTool size={14} />Acknowledge</button>
                )}
                <button className="p-2 hover:bg-gray-100 rounded-lg"><Eye size={18} className="text-gray-500" /></button>
                <button className="p-2 hover:bg-gray-100 rounded-lg"><Download size={18} className="text-gray-500" /></button>
              </div>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
}

function HomeworkItem({ homework, detailed }) {
  const isOverdue = !homework.submission_id && new Date(homework.due_date) < new Date();
  const daysLeft = Math.ceil((new Date(homework.due_date) - new Date()) / (1000 * 60 * 60 * 24));
  return (
    <div className={`p-4 rounded-lg border ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex justify-between">
        <div><h4 className="font-medium">{homework.title}</h4><p className="text-sm text-gray-500">{homework.subject_name || 'Subject'}</p></div>
        <div>{homework.submission_id ? <span className={`px-2 py-1 rounded-full text-xs font-medium ${homework.submission_status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{homework.submission_status === 'graded' ? `${homework.submission_score}/${homework.max_score}` : 'Submitted'}</span> : <span className={`px-2 py-1 rounded-full text-xs font-medium ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{isOverdue ? 'Overdue' : `${daysLeft}d left`}</span>}</div>
      </div>
      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Clock size={12} />Due: {new Date(homework.due_date).toLocaleDateString()}</p>
    </div>
  );
}

function GradeItem({ grade }) {
  const pct = parseFloat(grade.percentage) || 0;
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
      <div><p className="font-medium">{grade.subject_name || 'Subject'}</p><p className="text-sm text-gray-500">{grade.exam_name || 'Assessment'}</p></div>
      <p className={`text-lg font-bold ${pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{pct}%</p>
    </div>
  );
}

function AttendanceRing({ summary }) {
  const rate = summary?.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90"><circle cx="64" cy="64" r="56" fill="none" stroke="#e5e7eb" strokeWidth="12" /><circle cx="64" cy="64" r="56" fill="none" stroke={rate >= 90 ? '#22c55e' : rate >= 75 ? '#eab308' : '#ef4444'} strokeWidth="12" strokeDasharray={`${rate * 3.52} 352`} strokeLinecap="round" /></svg>
        <div className="absolute inset-0 flex items-center justify-center"><span className="text-2xl font-bold">{rate}%</span></div>
      </div>
      <div className="flex gap-4 mt-4 text-sm">
        <span className="text-green-600">{summary?.present || 0} Present</span>
        <span className="text-red-600">{summary?.absent || 0} Absent</span>
      </div>
    </div>
  );
}

function PerformanceChart({ data }) {
  if (!data || data.length === 0) return <p className="text-gray-500 text-center py-8">No performance data available</p>;
  const maxValue = Math.max(...data.map(d => d.average), 100);
  return (
    <div className="h-48">
      <div className="flex items-end justify-between h-40 gap-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center">
            <div className="w-full flex flex-col items-center justify-end h-32">
              <span className="text-xs font-bold mb-1">{item.average}%</span>
              <div 
                className={`w-full max-w-12 rounded-t-lg transition-all ${item.average >= 70 ? 'bg-gradient-to-t from-green-500 to-green-400' : item.average >= 50 ? 'bg-gradient-to-t from-yellow-500 to-yellow-400' : 'bg-gradient-to-t from-red-500 to-red-400'}`}
                style={{ height: `${(item.average / maxValue) * 100}%`, minHeight: '8px' }}
              />
            </div>
            <span className="text-xs text-gray-500 mt-2">{item.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisTab({ subjectAnalysis, performanceData, grades }) {
  const strongSubjects = subjectAnalysis.filter(s => s.strength === 'strong');
  const weakSubjects = subjectAnalysis.filter(s => s.strength === 'weak');
  const avgSubjects = subjectAnalysis.filter(s => s.strength === 'average');
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-100 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2"><Star className="text-green-600" size={20} /><h4 className="font-semibold text-green-800">Strong Subjects</h4></div>
          <p className="text-3xl font-bold text-green-600">{strongSubjects.length}</p>
          <p className="text-sm text-gray-600 mt-1">{strongSubjects.map(s => s.subject).join(', ') || 'None yet'}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2"><Target className="text-yellow-600" size={20} /><h4 className="font-semibold text-yellow-800">Average Subjects</h4></div>
          <p className="text-3xl font-bold text-yellow-600">{avgSubjects.length}</p>
          <p className="text-sm text-gray-600 mt-1">{avgSubjects.map(s => s.subject).join(', ') || 'None'}</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2"><AlertTriangle className="text-red-600" size={20} /><h4 className="font-semibold text-red-800">Needs Attention</h4></div>
          <p className="text-3xl font-bold text-red-600">{weakSubjects.length}</p>
          <p className="text-sm text-gray-600 mt-1">{weakSubjects.map(s => s.subject).join(', ') || 'None'}</p>
        </div>
      </div>

      {performanceData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><LineChart className="text-indigo-600" size={20} />Overall Performance Trend</h3>
          <PerformanceChart data={performanceData} />
          <div className="mt-4 pt-4 border-t flex items-center justify-center gap-6 text-sm">
            {performanceData.length >= 2 && (
              <>
                <span className="text-gray-500">First: <strong>{performanceData[0]?.average}%</strong></span>
                <span className="text-gray-500">Latest: <strong>{performanceData[performanceData.length - 1]?.average}%</strong></span>
                {(() => {
                  const change = performanceData[performanceData.length - 1]?.average - performanceData[0]?.average;
                  return (
                    <span className={`flex items-center gap-1 font-medium ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {change > 0 ? <TrendingUp size={16} /> : change < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
                      {change > 0 ? '+' : ''}{change}%
                    </span>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Brain className="text-purple-600" size={20} />Subject Strength Analysis</h3>
        {subjectAnalysis.length === 0 ? <p className="text-gray-500 text-center py-8">No data available for analysis</p> : (
          <div className="space-y-4">
            {subjectAnalysis.map((subject, idx) => (
              <div key={idx} className={`border rounded-xl p-4 ${subject.strength === 'strong' ? 'border-green-200 bg-green-50/50' : subject.strength === 'weak' ? 'border-red-200 bg-red-50/50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${subject.strength === 'strong' ? 'bg-green-500' : subject.strength === 'weak' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                    <h4 className="font-semibold">{subject.subject}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${subject.strength === 'strong' ? 'bg-green-100 text-green-700' : subject.strength === 'weak' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {subject.strength === 'strong' ? 'Strong' : subject.strength === 'weak' ? 'Needs Work' : 'Average'}
                    </span>
                  </div>
                  <span className={`text-xl font-bold ${subject.average >= 70 ? 'text-green-600' : subject.average >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{subject.average}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mb-3">
                  <div className={`h-full rounded-full ${subject.average >= 70 ? 'bg-green-500' : subject.average >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(subject.average, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{subject.assessments} assessments</span>
                  <span>High: {subject.highest}% | Low: {subject.lowest}%</span>
                  <span className={`flex items-center gap-1 ${subject.trend === 'improving' ? 'text-green-600' : subject.trend === 'declining' ? 'text-red-600' : 'text-gray-500'}`}>
                    {subject.trend === 'improving' ? <TrendingUp size={14} /> : subject.trend === 'declining' ? <TrendingDown size={14} /> : <Minus size={14} />}
                    {subject.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {weakSubjects.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Zap className="text-amber-600" size={20} />Recommendations</h3>
          <ul className="space-y-2">
            {weakSubjects.map((s, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <span><strong>{s.subject}</strong> needs improvement. Consider extra practice or tutoring. Current average: {s.average}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MessagesTab({ teachers, onMessage }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><MessageSquare className="text-blue-600" size={20} />Contact Teachers</h3>
        {teachers.length === 0 ? <p className="text-gray-500 text-center py-8">No teachers available</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachers.map((teacher, idx) => (
              <div key={idx} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                    {(teacher.name || teacher.teacher_name || 'T').charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{teacher.name || teacher.teacher_name}</h4>
                    <p className="text-sm text-gray-500">{teacher.role || teacher.subject_name || 'Teacher'}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      {teacher.email && <span className="flex items-center gap-1"><Mail size={14} />{teacher.email}</span>}
                      {teacher.phone && <span className="flex items-center gap-1"><Phone size={14} />{teacher.phone}</span>}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => onMessage(teacher)} 
                  className="w-full mt-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center justify-center gap-2 font-medium"
                >
                  <Send size={16} />Send Message
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
