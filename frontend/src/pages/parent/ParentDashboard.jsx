import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import FamilyLinkCode from '../../components/parent/FamilyLinkCode';
import {
  Users, GraduationCap, BookOpen, Calendar, Award, DollarSign, CheckCircle,
  AlertTriangle, Info, Brain, TrendingUp, ArrowUpRight, User, Bell, FileText,
  CreditCard, BarChart3, Heart, Eye, Clock, Target, Zap, ChevronRight,
  PieChart, Activity, Star, MessageSquare, ClipboardList, UserPlus, Sparkles,
  TrendingDown, BookMarked, School, Wallet, Receipt, ArrowRight, Link2, X
} from 'lucide-react';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [failedImages, setFailedImages] = useState({});
  const [showFamilyLink, setShowFamilyLink] = useState(false);

  // Helper to get photo URL
  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    const cleanPath = photo.replace(/^\/?(uploads\/)?/, '');
    const baseUrl = API_BASE_URL.replace('/backend/api', '');
    return `${baseUrl}/uploads/${cleanPath}`;
  };

  // Handle image error
  const handleImageError = (childId) => {
    setFailedImages(prev => ({ ...prev, [childId]: true }));
  };

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Try parent_portal.php first with user.id as parent_id
      const portalResponse = await axios.get(
        `${API_BASE_URL}/parent_portal.php?resource=dashboard&parent_id=${user.id}`
      );
      
      if (portalResponse.data.success && portalResponse.data.dashboard?.children?.length > 0) {
        // Transform portal data to match expected format
        const portalData = portalResponse.data.dashboard;
        setDashboardData({
          success: true,
          parent: { id: user.id, name: user.name },
          children: portalData.children.map(c => ({
            id: c.child_id || c.student_id,
            student_id: c.student_id,
            full_name: c.full_name,
            first_name: c.full_name?.split(' ')[0],
            last_name: c.full_name?.split(' ').slice(1).join(' '),
            class_name: c.class_name,
            status: c.student_status || 'active',
            photo: c.photo,
            admission_no: c.admission_no
          })),
          children_summary: portalData.children.map(c => ({
            student: { id: c.student_id },
            attendance_rate: portalData.attendance_summary?.total > 0 
              ? Math.round((portalData.attendance_summary.present / portalData.attendance_summary.total) * 100) 
              : 0,
            average_score: 0
          })),
          applications: [],
          insights: [],
          total_fee_balance: portalData.pending_fees || 0,
          notifications: portalData.recent_notifications || [],
          upcoming_events: portalData.upcoming_events || [],
          attendance_summary: portalData.attendance_summary
        });
        if (portalData.children?.length > 0) {
          setSelectedChild({
            id: portalData.children[0].child_id || portalData.children[0].student_id,
            student_id: portalData.children[0].student_id,
            full_name: portalData.children[0].full_name,
            class_name: portalData.children[0].class_name,
            status: portalData.children[0].student_status || 'active',
            photo: portalData.children[0].photo
          });
        }
        return;
      }
      
      // Fallback to old dashboard.php API
      const response = await axios.get(
        `${API_BASE_URL}/dashboard.php?role=parent&user_id=${user.id}`
      );
      if (response.data.success) {
        setDashboardData(response.data);
        if (response.data.children?.length > 0) {
          setSelectedChild(response.data.children[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const parent = dashboardData?.parent;
  const children = dashboardData?.children || [];
  const childrenSummary = dashboardData?.children_summary || [];
  const applications = dashboardData?.applications || [];
  const insights = dashboardData?.insights || [];
  const totalBalance = parseFloat(dashboardData?.total_fee_balance || 0);

  // Calculate statistics
  const enrolledChildren = children.filter(c => c.status === 'active').length;
  const pendingApplications = applications.filter(a => a.status === 'pending').length;
  const approvedApplications = applications.filter(a => a.status === 'approved').length;
  const avgPerformance = childrenSummary.length > 0 
    ? Math.round(childrenSummary.reduce((sum, c) => sum + (parseFloat(c.average_score) || 0), 0) / childrenSummary.length)
    : 0;
  const avgAttendance = childrenSummary.length > 0
    ? Math.round(childrenSummary.reduce((sum, c) => sum + (parseFloat(c.attendance_rate) || 0), 0) / childrenSummary.length)
    : 0;

  // Helper function to get child summary
  const getChildSummary = (childId) => {
    return childrenSummary.find(s => s.student?.id === childId) || {};
  };

  // Generate AI insights for each child
  const generateChildInsights = (child) => {
    const summary = getChildSummary(child.id);
    const insights = [];
    
    const score = parseFloat(summary.average_score) || 0;
    const attendance = parseFloat(summary.attendance_rate) || 0;
    const feeBalance = parseFloat(summary.fee_balance) || 0;

    if (score >= 80) {
      insights.push({ type: 'success', icon: Star, message: 'Excellent academic performance! Keep it up!' });
    } else if (score >= 60) {
      insights.push({ type: 'info', icon: TrendingUp, message: 'Good progress. Consider extra tutoring for improvement.' });
    } else if (score > 0) {
      insights.push({ type: 'warning', icon: AlertTriangle, message: 'Needs attention. Schedule a meeting with teachers.' });
    }

    if (attendance >= 90) {
      insights.push({ type: 'success', icon: CheckCircle, message: 'Outstanding attendance record!' });
    } else if (attendance < 75 && attendance > 0) {
      insights.push({ type: 'warning', icon: Clock, message: 'Attendance needs improvement. Regular attendance is crucial.' });
    }

    if (feeBalance > 0) {
      insights.push({ type: 'warning', icon: Wallet, message: `Outstanding fee balance: GHS ${feeBalance.toLocaleString()}` });
    }

    return insights;
  };

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-gray-50 to-purple-50 min-h-screen">
      {/* Welcome Header with Stats */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 rounded-2xl p-6 md:p-8 mb-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
              <Heart className="text-white" size={36} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome back, {parent?.full_name || user?.name || 'Parent'}!
              </h1>
              <p className="text-purple-200 mt-1 flex items-center gap-2">
                <Users size={16} />
                {children.length} {children.length === 1 ? 'Child' : 'Children'} • {enrolledChildren} Enrolled
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-purple-200 text-xs uppercase tracking-wide">Children</p>
              <p className="text-2xl font-bold">{children.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-purple-200 text-xs uppercase tracking-wide">Avg Score</p>
              <p className="text-2xl font-bold">{avgPerformance}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-purple-200 text-xs uppercase tracking-wide">Attendance</p>
              <p className="text-2xl font-bold">{avgAttendance}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
              <p className="text-purple-200 text-xs uppercase tracking-wide">Balance</p>
              <p className="text-2xl font-bold">GHS {totalBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Now with working links */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <QuickActionCard
          icon={<UserPlus size={24} />}
          label="Apply for Admission"
          description="New child"
          color="blue"
          onClick={() => navigate('/parent/apply')}
        />
        <QuickActionCard
          icon={<ClipboardList size={24} />}
          label="Term Enrollment"
          description="Enroll for term"
          color="green"
          onClick={() => navigate('/parent/enroll')}
        />
        <QuickActionCard
          icon={<FileText size={24} />}
          label="View Invoices"
          description="Fee statements"
          color="purple"
          onClick={() => navigate('/parent/invoices')}
        />
        <QuickActionCard
          icon={<CreditCard size={24} />}
          label="Make Payment"
          description="Pay fees"
          color="emerald"
          onClick={() => navigate('/parent/payments')}
        />
        <QuickActionCard
          icon={<MessageSquare size={24} />}
          label="Messages"
          description="Communication"
          color="orange"
          onClick={() => navigate('/parent/messages')}
        />
        <QuickActionCard
          icon={<BarChart3 size={24} />}
          label="Report Cards"
          description="View grades"
          color="pink"
          onClick={() => selectedChild && navigate(`/parent/child/${selectedChild.id}`)}
        />
        <QuickActionCard
          icon={<Link2 size={24} />}
          label="Family Link"
          description="Add parent"
          color="indigo"
          onClick={() => setShowFamilyLink(true)}
        />
        <QuickActionCard
          icon={<Zap size={24} />}
          label="Pro Dashboard"
          description="Advanced view"
          color="cyan"
          onClick={() => navigate('/parent/dashboard-pro')}
        />
      </div>

      {/* Family Link Modal */}
      {showFamilyLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-md w-full">
            <button
              onClick={() => setShowFamilyLink(false)}
              className="absolute -top-2 -right-2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>
            <FamilyLinkCode
              parentId={user?.id}
              children={children}
              onLinkSuccess={() => {
                setShowFamilyLink(false);
                fetchDashboardData();
              }}
            />
          </div>
        </div>
      )}

      {/* Application & Enrollment Status */}
      {(applications.length > 0 || pendingApplications > 0) && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <ClipboardList className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Application Status</h2>
                <p className="text-sm text-gray-500">{applications.length} total applications</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/parent/apply')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              New Application <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold text-yellow-700">{pendingApplications}</p>
                </div>
                <Clock className="text-yellow-500" size={32} />
              </div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Approved</p>
                  <p className="text-2xl font-bold text-green-700">{approvedApplications}</p>
                </div>
                <CheckCircle className="text-green-500" size={32} />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Enrolled</p>
                  <p className="text-2xl font-bold text-blue-700">{enrolledChildren}</p>
                </div>
                <School className="text-blue-500" size={32} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Section */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 mb-6 border border-purple-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-xl">
              <Sparkles className="text-purple-600" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">AI Insights & Recommendations</h2>
              <p className="text-sm text-gray-500">Personalized insights for your children</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.slice(0, 6).map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </div>
      )}

      {/* Children Selector Tabs */}
      {children.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm mb-6 overflow-hidden">
          <div className="border-b border-gray-100 p-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <span className="text-gray-500 text-sm whitespace-nowrap mr-2">Select Child:</span>
              {children.map((child) => {
                const childPhoto = getChildSummary(child.id)?.photo || child.photo;
                const photoUrl = getPhotoUrl(childPhoto);
                const showFallback = !photoUrl || failedImages[child.id];
                
                return (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                      selectedChild?.id === child.id
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {!showFallback && (
                      <img 
                        src={photoUrl} 
                        alt={child.first_name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-white"
                        onError={() => handleImageError(child.id)}
                      />
                    )}
                    {showFallback && (
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          selectedChild?.id === child.id 
                            ? 'bg-purple-400 text-white' 
                            : 'bg-purple-200 text-purple-700'
                        }`}
                      >
                        {child.first_name?.[0]}{child.last_name?.[0]}
                      </div>
                    )}
                    <span className="font-medium">{child.first_name} {child.last_name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Child Dashboard */}
          {selectedChild && (
            <div className="p-6">
              {/* Child Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  {(() => {
                    const photo = getChildSummary(selectedChild.id)?.photo || selectedChild.photo;
                    const photoUrl = getPhotoUrl(photo);
                    const showFallback = !photoUrl || failedImages[selectedChild.id];
                    
                    return (
                      <>
                        {!showFallback && (
                          <img 
                            src={photoUrl}
                            alt={`${selectedChild.first_name} ${selectedChild.last_name}`}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-200"
                            onError={() => handleImageError(selectedChild.id)}
                          />
                        )}
                        {showFallback && (
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                            {selectedChild.first_name?.[0]}{selectedChild.last_name?.[0]}
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {selectedChild.first_name} {selectedChild.last_name}
                    </h3>
                    <p className="text-gray-500 flex items-center gap-2">
                      <School size={14} />
                      {selectedChild.class_name || 'No class assigned'}
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        selectedChild.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {selectedChild.status || 'Active'}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/parent/child/${selectedChild.id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-all"
                >
                  <Eye size={18} />
                  View Full Profile
                </button>
              </div>

              {/* Performance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <PerformanceCard
                  icon={<Award />}
                  label="Academic Score"
                  value={`${getChildSummary(selectedChild.id)?.average_score || 0}%`}
                  subtext={`Grade: ${getPerformanceGrade(getChildSummary(selectedChild.id)?.average_score || 0)}`}
                  color="yellow"
                  trend={getChildSummary(selectedChild.id)?.average_score >= 70 ? 'up' : 'down'}
                />
                <PerformanceCard
                  icon={<Calendar />}
                  label="Attendance Rate"
                  value={`${getChildSummary(selectedChild.id)?.attendance_rate || 0}%`}
                  subtext="Last 30 days"
                  color="green"
                  trend={getChildSummary(selectedChild.id)?.attendance_rate >= 80 ? 'up' : 'down'}
                />
                <PerformanceCard
                  icon={<BookOpen />}
                  label="Subjects"
                  value={getChildSummary(selectedChild.id)?.subjects_enrolled || 0}
                  subtext="Enrolled courses"
                  color="blue"
                />
                <PerformanceCard
                  icon={<Wallet />}
                  label="Fee Balance"
                  value={`GHS ${parseFloat(getChildSummary(selectedChild.id)?.fee_balance || 0).toLocaleString()}`}
                  subtext={parseFloat(getChildSummary(selectedChild.id)?.fee_balance || 0) > 0 ? 'Outstanding' : 'Fully paid'}
                  color={parseFloat(getChildSummary(selectedChild.id)?.fee_balance || 0) > 0 ? 'red' : 'green'}
                />
              </div>

              {/* Child-specific AI Insights */}
              <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Brain size={18} className="text-purple-600" />
                  AI Insights for {selectedChild.first_name}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {generateChildInsights(selectedChild).length > 0 ? (
                    generateChildInsights(selectedChild).map((insight, idx) => (
                      <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${
                        insight.type === 'success' ? 'bg-green-50' :
                        insight.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
                      }`}>
                        <insight.icon size={18} className={
                          insight.type === 'success' ? 'text-green-600' :
                          insight.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                        } />
                        <p className="text-sm text-gray-700">{insight.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 text-center py-4 text-gray-500">
                      <Info size={24} className="mx-auto mb-2 text-gray-400" />
                      <p>No specific insights available yet. Data will appear as your child's records are updated.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Chart Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Ring */}
                <div className="bg-white border border-gray-100 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <PieChart size={18} className="text-purple-600" />
                    Overall Performance
                  </h4>
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <svg className="w-48 h-48">
                        <circle
                          className="text-gray-100"
                          strokeWidth="16"
                          stroke="currentColor"
                          fill="transparent"
                          r="80"
                          cx="96"
                          cy="96"
                        />
                        <circle
                          className={getScoreColorClass(getChildSummary(selectedChild.id)?.average_score || 0)}
                          strokeWidth="16"
                          strokeDasharray={`${(getChildSummary(selectedChild.id)?.average_score || 0) * 5.02} 502`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="80"
                          cx="96"
                          cy="96"
                          transform="rotate(-90 96 96)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-4xl font-bold text-gray-800">
                            {getChildSummary(selectedChild.id)?.average_score || 0}%
                          </span>
                          <p className="text-sm text-gray-500">Average Score</p>
                          <p className={`text-lg font-bold ${getScoreTextColor(getChildSummary(selectedChild.id)?.average_score || 0)}`}>
                            Grade {getPerformanceGrade(getChildSummary(selectedChild.id)?.average_score || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white border border-gray-100 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-purple-600" />
                    Quick Stats
                  </h4>
                  <div className="space-y-4">
                    <StatBar 
                      label="Attendance" 
                      value={getChildSummary(selectedChild.id)?.attendance_rate || 0} 
                      color="green"
                    />
                    <StatBar 
                      label="Academic Performance" 
                      value={getChildSummary(selectedChild.id)?.average_score || 0} 
                      color="blue"
                    />
                    <StatBar 
                      label="Assignment Completion" 
                      value={getChildSummary(selectedChild.id)?.assignment_completion || 85} 
                      color="purple"
                    />
                    <StatBar 
                      label="Class Participation" 
                      value={getChildSummary(selectedChild.id)?.participation || 78} 
                      color="orange"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Children State */}
      {children.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="text-purple-600" size={48} />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Children Enrolled Yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Start by applying for admission for your child. Once approved, you'll be able to track their progress here.
          </p>
          <button
            onClick={() => navigate('/parent/apply')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
          >
            <UserPlus size={20} />
            Apply for Admission
          </button>
        </div>
      )}

      {/* Children Summary Grid */}
      {childrenSummary.length > 1 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">All Children Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {childrenSummary.map((summary, index) => (
              <ChildSummaryCard 
                key={index} 
                summary={summary} 
                onClick={() => {
                  const child = children.find(c => c.id === summary.student?.id);
                  if (child) setSelectedChild(child);
                }}
                isSelected={selectedChild?.id === summary.student?.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function QuickActionCard({ icon, label, description, color, onClick }) {
  const colorClasses = {
    blue: 'bg-blue-50 hover:bg-blue-100 border-blue-100 text-blue-600',
    green: 'bg-green-50 hover:bg-green-100 border-green-100 text-green-600',
    purple: 'bg-purple-50 hover:bg-purple-100 border-purple-100 text-purple-600',
    emerald: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-100 text-emerald-600',
    orange: 'bg-orange-50 hover:bg-orange-100 border-orange-100 text-orange-600',
    pink: 'bg-pink-50 hover:bg-pink-100 border-pink-100 text-pink-600',
  };

  return (
    <button 
      onClick={onClick}
      className={`${colorClasses[color]} p-4 rounded-xl border transition-all flex flex-col items-center gap-2 hover:shadow-md cursor-pointer`}
    >
      {icon}
      <span className="text-sm font-medium text-gray-800">{label}</span>
      <span className="text-xs text-gray-500">{description}</span>
    </button>
  );
}

function PerformanceCard({ icon, label, value, subtext, color, trend }) {
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-100',
    green: 'bg-green-50 border-green-100',
    blue: 'bg-blue-50 border-blue-100',
    red: 'bg-red-50 border-red-100',
    purple: 'bg-purple-50 border-purple-100',
  };

  const iconColorClasses = {
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    blue: 'text-blue-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className={iconColorClasses[color]}>{icon}</span>
        {trend && (
          <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
            {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xs text-gray-400 mt-1">{subtext}</p>
    </div>
  );
}

function StatBar({ label, value, color }) {
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-800">{value}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div 
          className={`${colorClasses[color]} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function ChildSummaryCard({ summary, onClick, isSelected }) {
  const student = summary.student || {};
  
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all cursor-pointer border-2 ${
        isSelected ? 'border-purple-500' : 'border-transparent'
      }`}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
          {student.first_name?.[0]}{student.last_name?.[0]}
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">
            {student.first_name} {student.last_name}
          </h3>
          <p className="text-sm text-gray-500">{student.class_name || 'No class'}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-yellow-50 rounded-lg">
          <p className="text-lg font-bold text-yellow-600">{summary.average_score || 0}%</p>
          <p className="text-xs text-gray-500">Score</p>
        </div>
        <div className="p-2 bg-green-50 rounded-lg">
          <p className="text-lg font-bold text-green-600">{summary.attendance_rate || 0}%</p>
          <p className="text-xs text-gray-500">Attendance</p>
        </div>
        <div className={`p-2 rounded-lg ${parseFloat(summary.fee_balance) > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className={`text-lg font-bold ${parseFloat(summary.fee_balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {parseFloat(summary.fee_balance) > 0 ? 'Due' : 'Paid'}
          </p>
          <p className="text-xs text-gray-500">Fees</p>
        </div>
      </div>
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
    <div className={`${style.bg} ${style.border} border rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={style.iconColor} size={20} />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800">{insight.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
          {insight.action && (
            <button className="mt-2 text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">
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
function getScoreColorClass(score) {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
}

function getScoreTextColor(score) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function getPerformanceGrade(score) {
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}
