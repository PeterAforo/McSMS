import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Clock, CheckCircle, XCircle, FileText, Calendar, Bell, 
  CreditCard, MessageSquare, BookOpen, TrendingUp, AlertTriangle,
  ChevronRight, Plus, Link2, RefreshCw, Loader2, GraduationCap,
  ClipboardList, DollarSign, CalendarDays, Mail, Award, BarChart3,
  UserPlus, Share2, Copy, Eye, EyeOff, Percent, Target
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
  const [parentId, setParentId] = useState(null);
  
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
    fetchParentId();
  }, [user]);

  useEffect(() => {
    if (parentId) {
      fetchDashboard();
    }
  }, [parentId]);

  const fetchParentId = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/parents.php?user_id=${user?.id}`);
      if (response.data.parents && response.data.parents.length > 0) {
        setParentId(response.data.parents[0].id);
      }
    } catch (error) {
      console.error('Error fetching parent ID:', error);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/parent_portal.php?resource=dashboard&parent_id=${parentId}`);
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
        parent_id: parentId
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
        parent_id: parentId,
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

  const calculateAge = (dob) => {
    if (!dob) return '';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getAttendanceRate = () => {
    const { present, total } = dashboard.attendance_summary || {};
    if (!total || total === 0) return 0;
    return Math.round((present / total) * 100);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'children', label: 'My Children', icon: Users },
    { id: 'academics', label: 'Academics', icon: GraduationCap },
    { id: 'fees', label: 'Fees & Payments', icon: CreditCard },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'messages', label: 'Messages', icon: MessageSquare }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
            <p className="text-blue-100">Track your children's progress and stay connected with school</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLinkModal(true)}
              className="btn bg-white/20 hover:bg-white/30 text-white flex items-center gap-2"
            >
              <Link2 className="w-4 h-4" />
              Link Child
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn bg-white/20 hover:bg-white/30 text-white flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="card p-4 text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('children')}>
          <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{dashboard.children?.length || 0}</div>
          <p className="text-sm text-gray-600">Children</p>
        </div>
        <div className="card p-4 text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/parent/notifications')}>
          <Bell className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{dashboard.recent_notifications?.length || 0}</div>
          <p className="text-sm text-gray-600">Notifications</p>
        </div>
        <div className="card p-4 text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('fees')}>
          <DollarSign className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">₵{dashboard.pending_fees?.toLocaleString() || 0}</div>
          <p className="text-sm text-gray-600">Pending Fees</p>
        </div>
        <div className="card p-4 text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('messages')}>
          <Mail className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{dashboard.unread_messages || 0}</div>
          <p className="text-sm text-gray-600">Unread Messages</p>
        </div>
        <div className="card p-4 text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('academics')}>
          <BookOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{dashboard.upcoming_homework || 0}</div>
          <p className="text-sm text-gray-600">Pending Homework</p>
        </div>
        <div className="card p-4 text-center hover:shadow-lg transition-shadow">
          <Target className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{getAttendanceRate()}%</div>
          <p className="text-sm text-gray-600">Attendance Rate</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex flex-wrap gap-2 p-4 border-b overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Children Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  My Children
                </h3>
                {dashboard.children?.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No children linked yet</p>
                    <button
                      onClick={() => navigate('/parent/apply')}
                      className="btn btn-primary mt-4"
                    >
                      Apply for Admission
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboard.children?.map((child) => (
                      <div
                        key={child.child_id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => navigate(`/parent/child/${child.child_id}`)}
                      >
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          {child.photo ? (
                            <img src={child.photo} alt={child.full_name} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <span className="text-blue-600 font-semibold text-lg">
                              {child.full_name?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{child.full_name}</p>
                          <p className="text-sm text-gray-600">
                            {child.class_name || 'Not enrolled'} {child.section_name ? `• ${child.section_name}` : ''}
                          </p>
                          {child.relationship && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              {child.relationship} {child.is_primary ? '(Primary)' : ''}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          {child.student_status === 'active' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                              {child.student_status || 'Pending'}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Events */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-purple-600" />
                  Upcoming Events
                </h3>
                {dashboard.upcoming_events?.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No upcoming events</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboard.upcoming_events?.map((event) => (
                      <div
                        key={event.id}
                        className="p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{event.title}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(event.start_date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                              {event.start_time && ` at ${event.start_time}`}
                            </p>
                            {event.location && (
                              <p className="text-xs text-gray-500 mt-1">📍 {event.location}</p>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            event.event_type === 'exam' ? 'bg-red-100 text-red-700' :
                            event.event_type === 'holiday' ? 'bg-green-100 text-green-700' :
                            event.event_type === 'meeting' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {event.event_type}
                          </span>
                        </div>
                        {event.requires_rsvp && (
                          <button className="btn btn-sm btn-primary mt-3">RSVP</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Summary */}
            {dashboard.attendance_summary && dashboard.attendance_summary.total > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-green-600" />
                  This Month's Attendance
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="card p-4 text-center bg-green-50">
                    <div className="text-2xl font-bold text-green-600">{dashboard.attendance_summary.present}</div>
                    <p className="text-sm text-gray-600">Present</p>
                  </div>
                  <div className="card p-4 text-center bg-red-50">
                    <div className="text-2xl font-bold text-red-600">{dashboard.attendance_summary.absent}</div>
                    <p className="text-sm text-gray-600">Absent</p>
                  </div>
                  <div className="card p-4 text-center bg-yellow-50">
                    <div className="text-2xl font-bold text-yellow-600">{dashboard.attendance_summary.late}</div>
                    <p className="text-sm text-gray-600">Late</p>
                  </div>
                  <div className="card p-4 text-center bg-blue-50">
                    <div className="text-2xl font-bold text-blue-600">{dashboard.attendance_summary.total}</div>
                    <p className="text-sm text-gray-600">Total Days</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Notifications */}
            {dashboard.recent_notifications?.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-600" />
                  Recent Notifications
                </h3>
                <div className="space-y-2">
                  {dashboard.recent_notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-lg flex items-start gap-3 ${
                        notif.is_read ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-500'
                      }`}
                    >
                      <Bell className={`w-5 h-5 mt-0.5 ${notif.is_read ? 'text-gray-400' : 'text-blue-600'}`} />
                      <div className="flex-1">
                        <p className={`font-medium ${notif.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notif.title}
                        </p>
                        <p className="text-sm text-gray-600">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
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
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">My Children</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLinkModal(true)}
                  className="btn bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  Link Existing Child
                </button>
                <button
                  onClick={() => navigate('/parent/apply')}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Apply for New Child
                </button>
              </div>
            </div>

            {dashboard.children?.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-700 mb-2">No Children Linked</h4>
                <p className="text-gray-500 mb-4">
                  Apply for admission or link an existing child using a family code
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowLinkModal(true)}
                    className="btn bg-purple-600 text-white hover:bg-purple-700"
                  >
                    Use Link Code
                  </button>
                  <button
                    onClick={() => navigate('/parent/apply')}
                    className="btn btn-primary"
                  >
                    Apply for Admission
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dashboard.children?.map((child) => (
                  <div key={child.child_id} className="card p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        {child.photo ? (
                          <img src={child.photo} alt={child.full_name} className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                          <span className="text-blue-600 font-bold text-2xl">
                            {child.full_name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{child.full_name}</h4>
                        <p className="text-gray-600">
                          {child.class_name || 'Not enrolled'} {child.section_name ? `• ${child.section_name}` : ''}
                        </p>
                        {child.admission_no && (
                          <p className="text-sm text-gray-500 font-mono">ID: {child.admission_no}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            child.student_status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {child.student_status || 'Pending'}
                          </span>
                          {child.relationship && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                              {child.relationship}
                            </span>
                          )}
                          {child.guardian_count > 1 && (
                            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                              {child.guardian_count} guardians
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button
                        onClick={() => navigate(`/parent/child/${child.child_id}`)}
                        className="btn btn-sm bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={() => navigate(`/parent/child/${child.child_id}/grades`)}
                        className="btn btn-sm bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-2"
                      >
                        <Award className="w-4 h-4" />
                        Grades
                      </button>
                      <button
                        onClick={() => navigate(`/parent/child/${child.child_id}/attendance`)}
                        className="btn btn-sm bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-2"
                      >
                        <ClipboardList className="w-4 h-4" />
                        Attendance
                      </button>
                      <button
                        onClick={() => navigate(`/parent/child/${child.child_id}/homework`)}
                        className="btn btn-sm bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-2"
                      >
                        <BookOpen className="w-4 h-4" />
                        Homework
                      </button>
                    </div>

                    {/* Generate Link Code */}
                    <div className="pt-4 border-t">
                      <button
                        onClick={() => generateLinkCode(child.child_id)}
                        className="btn btn-sm w-full bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Generate Link Code for Other Parent
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
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Academic Overview</h3>
            
            {/* Child Selector */}
            {dashboard.children?.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
                <select
                  value={selectedChild?.child_id || ''}
                  onChange={(e) => {
                    const child = dashboard.children.find(c => c.child_id === parseInt(e.target.value));
                    setSelectedChild(child);
                  }}
                  className="input max-w-xs"
                >
                  {dashboard.children.map(child => (
                    <option key={child.child_id} value={child.child_id}>
                      {child.full_name} - {child.class_name || 'Not enrolled'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedChild?.student_id ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div 
                  className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/parent/child/${selectedChild.child_id}/grades`)}
                >
                  <Award className="w-10 h-10 text-yellow-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1">Grades & Results</h4>
                  <p className="text-sm text-gray-600">View exam results and subject performance</p>
                </div>
                <div 
                  className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/parent/child/${selectedChild.child_id}/attendance`)}
                >
                  <ClipboardList className="w-10 h-10 text-green-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1">Attendance</h4>
                  <p className="text-sm text-gray-600">Track daily attendance and patterns</p>
                </div>
                <div 
                  className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/parent/child/${selectedChild.child_id}/homework`)}
                >
                  <BookOpen className="w-10 h-10 text-blue-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1">Homework</h4>
                  <p className="text-sm text-gray-600">View assignments and submission status</p>
                </div>
                <div 
                  className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/parent/child/${selectedChild.child_id}/report-cards`)}
                >
                  <FileText className="w-10 h-10 text-purple-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1">Report Cards</h4>
                  <p className="text-sm text-gray-600">Download and acknowledge report cards</p>
                </div>
                <div 
                  className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/parent/child/${selectedChild.child_id}/teachers`)}
                >
                  <Users className="w-10 h-10 text-indigo-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1">Teachers</h4>
                  <p className="text-sm text-gray-600">View and contact your child's teachers</p>
                </div>
                <div 
                  className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate('/parent/meetings')}
                >
                  <Calendar className="w-10 h-10 text-orange-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1">Meetings</h4>
                  <p className="text-sm text-gray-600">Schedule parent-teacher meetings</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select an enrolled child to view academic information</p>
              </div>
            )}
          </div>
        )}

        {/* Fees Tab */}
        {activeTab === 'fees' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Fees & Payments</h3>
              <button
                onClick={() => navigate('/parent/payments')}
                className="btn btn-primary flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Make Payment
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="card p-4 bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 mb-1">Pending Balance</p>
                <p className="text-2xl font-bold text-red-700">₵{dashboard.pending_fees?.toLocaleString() || 0}</p>
              </div>
              <div className="card p-4 bg-green-50 border border-green-200">
                <p className="text-sm text-green-600 mb-1">Total Paid (This Term)</p>
                <p className="text-2xl font-bold text-green-700">₵0</p>
              </div>
              <div className="card p-4 bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-600 mb-1">Next Due Date</p>
                <p className="text-2xl font-bold text-blue-700">-</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate('/parent/invoices')}
              >
                <FileText className="w-10 h-10 text-blue-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">View Invoices</h4>
                <p className="text-sm text-gray-600">See all invoices and payment details</p>
              </div>
              <div 
                className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate('/parent/payment-history')}
              >
                <DollarSign className="w-10 h-10 text-green-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">Payment History</h4>
                <p className="text-sm text-gray-600">View past payments and receipts</p>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">School Calendar</h3>
            
            {dashboard.upcoming_events?.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboard.upcoming_events?.map((event) => (
                  <div
                    key={event.id}
                    className={`card p-4 border-l-4 ${
                      event.event_type === 'exam' ? 'border-red-500' :
                      event.event_type === 'holiday' ? 'border-green-500' :
                      event.event_type === 'meeting' ? 'border-blue-500' :
                      event.event_type === 'sports' ? 'border-orange-500' :
                      'border-purple-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <p className="text-gray-600">
                          {new Date(event.start_date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric',
                            month: 'long', 
                            day: 'numeric' 
                          })}
                          {event.start_time && ` at ${event.start_time}`}
                        </p>
                        {event.location && (
                          <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 text-sm rounded-full ${
                          event.event_type === 'exam' ? 'bg-red-100 text-red-700' :
                          event.event_type === 'holiday' ? 'bg-green-100 text-green-700' :
                          event.event_type === 'meeting' ? 'bg-blue-100 text-blue-700' :
                          event.event_type === 'sports' ? 'bg-orange-100 text-orange-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {event.event_type}
                        </span>
                        {event.requires_rsvp && (
                          <button className="btn btn-sm btn-primary mt-2 block">RSVP</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Messages</h3>
              <button
                onClick={() => navigate('/parent/messages/new')}
                className="btn btn-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Message
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate('/parent/messages')}
              >
                <Mail className="w-10 h-10 text-blue-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">Inbox</h4>
                <p className="text-sm text-gray-600">View messages from teachers and school</p>
                {dashboard.unread_messages > 0 && (
                  <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                    {dashboard.unread_messages} unread
                  </span>
                )}
              </div>
              <div 
                className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate('/parent/meetings')}
              >
                <Calendar className="w-10 h-10 text-purple-600 mb-3" />
                <h4 className="font-semibold text-gray-900 mb-1">Meeting Requests</h4>
                <p className="text-sm text-gray-600">Schedule and manage parent-teacher meetings</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Apply for Admission</h2>
              <p className="text-gray-600">Submit a new application for your child</p>
            </div>
            <button
              onClick={() => navigate('/parent/apply')}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Apply
            </button>
          </div>
        </div>
        
        <div className="card p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Term Enrollment</h2>
              <p className="text-gray-600">Enroll your child for the new term</p>
            </div>
            <button
              onClick={() => navigate('/parent/enroll')}
              className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Enroll
            </button>
          </div>
        </div>
      </div>

      {/* Link Child Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Link to Existing Child</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Family Link Code
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Ask the primary parent to generate a link code from their dashboard
                </p>
                <input
                  type="text"
                  value={linkCodeInput}
                  onChange={(e) => setLinkCodeInput(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code"
                  className="input w-full text-center text-2xl tracking-widest font-mono"
                  maxLength={8}
                />
              </div>

              {linkCode && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 mb-2">Share this code with the other parent:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-2xl font-mono text-center bg-white p-2 rounded border">
                      {linkCode}
                    </code>
                    <button onClick={copyLinkCode} className="btn btn-sm bg-green-600 text-white">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-green-600 mt-2">Code expires in 7 days</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkCode('');
                  setLinkCodeInput('');
                }}
                className="btn bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={useLinkCode}
                disabled={linkCodeInput.length !== 8}
                className="btn btn-primary"
              >
                Link Child
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
