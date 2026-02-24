import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Clock, CheckCircle, XCircle, FileText, Calendar, Bell, 
  CreditCard, MessageSquare, BookOpen, TrendingUp, AlertTriangle,
  ChevronRight, Plus, Link2, RefreshCw, Loader2, GraduationCap,
  ClipboardList, DollarSign, CalendarDays, Mail, Award, BarChart3,
  UserPlus, Share2, Copy, Eye, Sparkles, Target, Activity, Zap,
  Heart, Star, ArrowUpRight, ArrowRight, Phone, MapPin
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function ParentDashboardPro() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkCode, setLinkCode] = useState('');
  const [linkCodeInput, setLinkCodeInput] = useState('');
  const [selectedChild, setSelectedChild] = useState(null);
  
  const [dashboard, setDashboard] = useState({
    children: [],
    upcoming_events: [],
    recent_notifications: [],
    pending_fees: 0,
    unread_messages: 0,
    upcoming_homework: 0,
    attendance_summary: { present: 0, absent: 0, late: 0, total: 0 }
  });

  useEffect(() => {
    if (user?.id) {
      fetchDashboard();
    }
  }, [user]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/parent_portal.php?resource=dashboard&parent_id=${user.id}`);
      if (response.data.success) {
        setDashboard(response.data.dashboard);
        if (response.data.dashboard.children?.length > 0 && !selectedChild) {
          setSelectedChild(response.data.dashboard.children[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const generateLinkCode = async (childId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/parent_portal.php?resource=generate_link_code`, {
        child_id: childId,
        parent_id: user.id
      });
      if (response.data.success) {
        setLinkCode(response.data.link_code);
      }
    } catch (error) {
      console.error('Error generating link code:', error);
    }
  };

  const useLinkCode = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/parent_portal.php?resource=use_link_code`, {
        link_code: linkCodeInput,
        parent_id: user.id,
        relationship: 'guardian'
      });
      if (response.data.success) {
        alert(response.data.message);
        setShowLinkModal(false);
        setLinkCodeInput('');
        fetchDashboard();
      } else {
        alert(response.data.error);
      }
    } catch (error) {
      console.error('Error using link code:', error);
      alert('Failed to use link code');
    }
  };

  const copyLinkCode = () => {
    navigator.clipboard.writeText(linkCode);
    alert('Link code copied to clipboard!');
  };

  const getAttendanceRate = () => {
    const { present, total } = dashboard.attendance_summary || {};
    if (!total || total === 0) return 0;
    return Math.round((present / total) * 100);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700"></div>
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
        
        <div className="relative px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="text-blue-200 text-sm font-medium">{getGreeting()}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                Welcome back, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-blue-100">
                Track your children's progress and stay connected with school
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLinkModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl text-white font-medium transition-all border border-white/20"
              >
                <Link2 className="w-4 h-4" />
                Link Child
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-all shadow-lg"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div onClick={() => setActiveTab('children')} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
          <Users className="w-8 h-8 text-blue-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{dashboard.children?.length || 0}</div>
          <p className="text-sm text-gray-500">Children</p>
        </div>
        <div onClick={() => navigate('/parent/notifications')} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all cursor-pointer">
          <Bell className="w-8 h-8 text-orange-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{dashboard.recent_notifications?.filter(n => !n.is_read).length || 0}</div>
          <p className="text-sm text-gray-500">Notifications</p>
        </div>
        <div onClick={() => setActiveTab('fees')} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-red-200 transition-all cursor-pointer">
          <DollarSign className="w-8 h-8 text-red-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">₵{(dashboard.pending_fees || 0).toLocaleString()}</div>
          <p className="text-sm text-gray-500">Pending Fees</p>
        </div>
        <div onClick={() => setActiveTab('messages')} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer">
          <Mail className="w-8 h-8 text-purple-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{dashboard.unread_messages || 0}</div>
          <p className="text-sm text-gray-500">Messages</p>
        </div>
        <div onClick={() => setActiveTab('academics')} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 transition-all cursor-pointer">
          <BookOpen className="w-8 h-8 text-green-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{dashboard.upcoming_homework || 0}</div>
          <p className="text-sm text-gray-500">Homework</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <Target className="w-8 h-8 text-indigo-500 mb-2" />
          <div className="text-2xl font-bold text-gray-900">{getAttendanceRate()}%</div>
          <p className="text-sm text-gray-500">Attendance</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-100">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'children', label: 'My Children', icon: Users },
            { id: 'academics', label: 'Academics', icon: GraduationCap },
            { id: 'fees', label: 'Fees & Payments', icon: CreditCard },
            { id: 'calendar', label: 'Calendar', icon: CalendarDays },
            { id: 'messages', label: 'Messages', icon: MessageSquare }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 font-medium whitespace-nowrap transition-all relative ${
                activeTab === tab.id ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Children Overview */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      My Children
                    </h3>
                    <button onClick={() => setActiveTab('children')} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                      View All <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {dashboard.children?.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h4 className="font-semibold text-gray-700 mb-2">No children linked yet</h4>
                      <p className="text-gray-500 text-sm mb-4">Apply for admission or link an existing child</p>
                      <button onClick={() => navigate('/parent/apply')} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all">
                        <Plus className="w-4 h-4" /> Apply for Admission
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dashboard.children?.map((child) => (
                        <div key={child.child_id} onClick={() => navigate(`/parent/child/${child.child_id}`)} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all cursor-pointer">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                            {child.photo ? (
                              <img src={child.photo} alt={child.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold text-lg">{child.full_name?.charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{child.full_name}</p>
                            <p className="text-sm text-gray-500">{child.class_name || 'Not enrolled yet'}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${child.student_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {child.student_status || 'Pending'}
                          </span>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upcoming Events */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-purple-600" />
                      Upcoming Events
                    </h3>
                  </div>
                  
                  {dashboard.upcoming_events?.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h4 className="font-semibold text-gray-700 mb-2">No upcoming events</h4>
                      <p className="text-gray-500 text-sm">Check back later for school events</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dashboard.upcoming_events?.slice(0, 4).map((event) => (
                        <div key={event.id} className={`p-4 rounded-xl border-l-4 bg-white shadow-sm ${event.event_type === 'exam' ? 'border-red-500' : event.event_type === 'holiday' ? 'border-green-500' : 'border-purple-500'}`}>
                          <p className="font-semibold text-gray-900">{event.title}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Clock className="w-4 h-4" />
                            {new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Summary */}
              {dashboard.attendance_summary && dashboard.attendance_summary.total > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <ClipboardList className="w-5 h-5 text-green-600" />
                    Attendance This Month
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                      <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
                      <div className="text-2xl font-bold text-green-700">{dashboard.attendance_summary.present}</div>
                      <p className="text-sm text-gray-600">Present</p>
                    </div>
                    <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                      <XCircle className="w-6 h-6 text-red-500 mb-2" />
                      <div className="text-2xl font-bold text-red-700">{dashboard.attendance_summary.absent}</div>
                      <p className="text-sm text-gray-600">Absent</p>
                    </div>
                    <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100">
                      <Clock className="w-6 h-6 text-yellow-500 mb-2" />
                      <div className="text-2xl font-bold text-yellow-700">{dashboard.attendance_summary.late}</div>
                      <p className="text-sm text-gray-600">Late</p>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <Calendar className="w-6 h-6 text-blue-500 mb-2" />
                      <div className="text-2xl font-bold text-blue-700">{dashboard.attendance_summary.total}</div>
                      <p className="text-sm text-gray-600">Total Days</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Notifications */}
              {dashboard.recent_notifications?.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-orange-600" />
                    Recent Notifications
                  </h3>
                  <div className="space-y-2">
                    {dashboard.recent_notifications.slice(0, 5).map((notif) => (
                      <div key={notif.id} className={`p-3 rounded-xl flex items-start gap-3 ${notif.is_read ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-500'}`}>
                        <Bell className={`w-5 h-5 mt-0.5 flex-shrink-0 ${notif.is_read ? 'text-gray-400' : 'text-blue-600'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${notif.is_read ? 'text-gray-600' : 'text-gray-900'}`}>{notif.title}</p>
                          <p className="text-sm text-gray-500 truncate">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Children Tab */}
          {activeTab === 'children' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">My Children</h3>
                <div className="flex gap-3">
                  <button onClick={() => setShowLinkModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg font-medium transition-all">
                    <Link2 className="w-4 h-4" /> Link Existing Child
                  </button>
                  <button onClick={() => navigate('/parent/apply')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all">
                    <Plus className="w-4 h-4" /> Apply for New Child
                  </button>
                </div>
              </div>

              {dashboard.children?.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-700 mb-2">No Children Linked</h4>
                  <p className="text-gray-500 mb-6">Apply for admission or link an existing child using a family code</p>
                  <div className="flex justify-center gap-4">
                    <button onClick={() => setShowLinkModal(true)} className="flex items-center gap-2 px-5 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all">
                      <Link2 className="w-5 h-5" /> Use Link Code
                    </button>
                    <button onClick={() => navigate('/parent/apply')} className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all">
                      <Plus className="w-5 h-5" /> Apply for Admission
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dashboard.children?.map((child) => (
                    <div key={child.child_id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0">
                            {child.photo ? (
                              <img src={child.photo} alt={child.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold text-2xl">{child.full_name?.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold">{child.full_name}</h4>
                            <p className="text-blue-100">{child.class_name || 'Not enrolled yet'}</p>
                            {child.admission_no && <p className="text-blue-200 text-sm font-mono">ID: {child.admission_no}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${child.student_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {child.student_status || 'Pending'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <button onClick={() => navigate(`/parent/child/${child.child_id}`)} className="flex items-center justify-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 font-medium transition-all text-sm">
                            <Eye className="w-4 h-4" /> Details
                          </button>
                          <button onClick={() => navigate(`/parent/child/${child.child_id}/grades`)} className="flex items-center justify-center gap-2 p-2.5 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-yellow-700 font-medium transition-all text-sm">
                            <Award className="w-4 h-4" /> Grades
                          </button>
                          <button onClick={() => navigate(`/parent/child/${child.child_id}/attendance`)} className="flex items-center justify-center gap-2 p-2.5 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 font-medium transition-all text-sm">
                            <ClipboardList className="w-4 h-4" /> Attendance
                          </button>
                          <button onClick={() => navigate(`/parent/child/${child.child_id}/homework`)} className="flex items-center justify-center gap-2 p-2.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-medium transition-all text-sm">
                            <BookOpen className="w-4 h-4" /> Homework
                          </button>
                        </div>
                        <button onClick={() => generateLinkCode(child.child_id)} className="w-full flex items-center justify-center gap-2 p-2.5 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 font-medium transition-all text-sm border border-purple-200">
                          <Share2 className="w-4 h-4" /> Generate Link Code
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Academics Tab */}
          {activeTab === 'academics' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Academic Overview</h3>
              {dashboard.children?.length > 1 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
                  <select value={selectedChild?.child_id || ''} onChange={(e) => setSelectedChild(dashboard.children.find(c => c.child_id === parseInt(e.target.value)))} className="w-full max-w-xs px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                    {dashboard.children.map(child => (
                      <option key={child.child_id} value={child.child_id}>{child.full_name} - {child.class_name || 'Not enrolled'}</option>
                    ))}
                  </select>
                </div>
              )}
              {selectedChild?.student_id ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { icon: Award, title: 'Grades & Results', desc: 'View exam results', color: 'yellow', path: `/parent/child/${selectedChild.child_id}/grades` },
                    { icon: ClipboardList, title: 'Attendance', desc: 'Track attendance', color: 'green', path: `/parent/child/${selectedChild.child_id}/attendance` },
                    { icon: BookOpen, title: 'Homework', desc: 'View assignments', color: 'blue', path: `/parent/child/${selectedChild.child_id}/homework` },
                    { icon: FileText, title: 'Report Cards', desc: 'Download reports', color: 'purple', path: `/parent/child/${selectedChild.child_id}/report-cards` },
                    { icon: Users, title: 'Teachers', desc: 'Contact teachers', color: 'indigo', path: `/parent/child/${selectedChild.child_id}/teachers` },
                    { icon: Calendar, title: 'Meetings', desc: 'Schedule meetings', color: 'orange', path: '/parent/meetings' }
                  ].map((item, idx) => (
                    <div key={idx} onClick={() => navigate(item.path)} className="p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
                      <item.icon className={`w-10 h-10 text-${item.color}-500 mb-3`} />
                      <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Select an enrolled child to view academic information</p>
                </div>
              )}
            </div>
          )}

          {/* Fees Tab */}
          {activeTab === 'fees' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Fees & Payments</h3>
                <button onClick={() => navigate('/parent/payments')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all">
                  <CreditCard className="w-4 h-4" /> Make Payment
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-5 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-red-600 font-medium mb-1">Pending Balance</p>
                  <p className="text-2xl font-bold text-red-700">₵{(dashboard.pending_fees || 0).toLocaleString()}</p>
                </div>
                <div className="p-5 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-green-600 font-medium mb-1">Total Paid</p>
                  <p className="text-2xl font-bold text-green-700">₵0</p>
                </div>
                <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-blue-600 font-medium mb-1">Next Due Date</p>
                  <p className="text-2xl font-bold text-blue-700">-</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => navigate('/parent/invoices')} className="p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer">
                  <FileText className="w-10 h-10 text-blue-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1">View Invoices</h4>
                  <p className="text-sm text-gray-500">See all invoices and payment details</p>
                </div>
                <div onClick={() => navigate('/parent/payments')} className="p-5 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all cursor-pointer">
                  <DollarSign className="w-10 h-10 text-green-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1">Payment History</h4>
                  <p className="text-sm text-gray-500">View past payments and receipts</p>
                </div>
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === 'calendar' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6">School Calendar</h3>
              {dashboard.upcoming_events?.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No upcoming events</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboard.upcoming_events?.map((event) => (
                    <div key={event.id} className={`p-4 bg-white rounded-xl border-l-4 shadow-sm ${event.event_type === 'exam' ? 'border-red-500' : event.event_type === 'holiday' ? 'border-green-500' : 'border-purple-500'}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                          <p className="text-gray-600 flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(event.start_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-sm font-medium rounded-lg ${event.event_type === 'exam' ? 'bg-red-100 text-red-700' : event.event_type === 'holiday' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                          {event.event_type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Messages</h3>
                <button onClick={() => navigate('/parent/messages')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all">
                  <Mail className="w-4 h-4" /> View All Messages
                </button>
              </div>
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-700 mb-2">Message Center</h4>
                <p className="text-gray-500 mb-4">Communicate with teachers and school staff</p>
                <button onClick={() => navigate('/parent/messages')} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all">
                  <Mail className="w-4 h-4" /> Open Messages
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold mb-1">Apply for Admission</h3>
              <p className="text-blue-100 text-sm">Submit a new application for your child</p>
            </div>
            <button onClick={() => navigate('/parent/apply')} className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-all">
              <Plus className="w-4 h-4" /> Apply
            </button>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold mb-1">Term Enrollment</h3>
              <p className="text-purple-100 text-sm">Enroll your child for the new term</p>
            </div>
            <button onClick={() => navigate('/parent/enroll')} className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-all">
              <CheckCircle className="w-4 h-4" /> Enroll
            </button>
          </div>
        </div>
      </div>

      {/* Link Child Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Link Existing Child</h3>
            <p className="text-gray-600 mb-4">Enter the family link code shared by another guardian to link to an existing child.</p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Link Code</label>
              <input type="text" value={linkCodeInput} onChange={(e) => setLinkCodeInput(e.target.value.toUpperCase())} placeholder="Enter 8-character code" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-xl font-mono tracking-widest" maxLength={8} />
            </div>
            {linkCode && (
              <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 mb-2">Generated Link Code:</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-mono font-bold text-green-800 tracking-widest">{linkCode}</span>
                  <button onClick={copyLinkCode} className="p-2 hover:bg-green-100 rounded-lg transition-colors">
                    <Copy className="w-5 h-5 text-green-600" />
                  </button>
                </div>
                <p className="text-xs text-green-600 mt-2">Share this code with the other parent</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setShowLinkModal(false); setLinkCodeInput(''); setLinkCode(''); }} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all">Cancel</button>
              <button onClick={useLinkCode} disabled={linkCodeInput.length !== 8} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Link Child</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
