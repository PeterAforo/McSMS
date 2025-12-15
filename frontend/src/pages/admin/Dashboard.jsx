import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  GraduationCap, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  UserCheck,
  BookOpen,
  Calendar,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  Bell,
  Clock,
  FileText,
  CreditCard,
  Activity,
  BarChart3,
  PieChart,
  ArrowRight,
  RefreshCw,
  Loader2,
  Building,
  Percent
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import WelcomeModal from '../../components/onboarding/WelcomeModal';
import SetupChecklist from '../../components/onboarding/SetupChecklist';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [events, setEvents] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    checkOnboardingStatus();
    fetchDashboardData();
    fetchUpcomingEvents();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/onboarding.php?action=system_status`);
      if (response.data.success) {
        setOnboardingStatus(response.data);
        if (response.data.completion_percentage === 0) {
          setShowWelcome(true);
        } else if (response.data.completion_percentage < 100) {
          setShowChecklist(true);
        }
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/dashboard.php?role=admin`);
      if (response.data.success) {
        setDashboardData(response.data);
        // Extract alerts from insights
        if (response.data.insights) {
          setAlerts(response.data.insights.filter(i => i.priority === 'high' || i.priority === 'medium'));
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to individual API calls
      await fetchFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const fetchFallbackData = async () => {
    try {
      const [studentsRes, teachersRes, classesRes, invoicesRes, termsRes, attendanceRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/students.php`).catch(() => ({ data: { students: [] } })),
        axios.get(`${API_BASE_URL}/teachers.php`).catch(() => ({ data: { teachers: [] } })),
        axios.get(`${API_BASE_URL}/classes.php`).catch(() => ({ data: { classes: [] } })),
        axios.get(`${API_BASE_URL}/invoices.php`).catch(() => ({ data: { invoices: [] } })),
        axios.get(`${API_BASE_URL}/terms.php`).catch(() => ({ data: { terms: [] } })),
        axios.get(`${API_BASE_URL}/attendance.php?date=${new Date().toISOString().split('T')[0]}`).catch(() => ({ data: { attendance: [] } }))
      ]);

      const students = studentsRes.data.students || [];
      const teachers = teachersRes.data.teachers || [];
      const classes = classesRes.data.classes || [];
      const invoices = invoicesRes.data.invoices || [];
      const terms = termsRes.data.terms || [];
      const attendance = attendanceRes.data.attendance || [];

      const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || 0), 0);
      const totalInvoiced = invoices.reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);
      const pendingPayments = invoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + parseFloat(inv.balance || 0), 0);
      const currentTerm = terms.find(t => t.status === 'active');
      const presentToday = attendance.filter(a => a.status === 'present').length;
      const attendanceRate = students.length > 0 ? ((presentToday / students.length) * 100).toFixed(1) : 0;

      setDashboardData({
        success: true,
        stats: {
          total_students: students.length,
          total_teachers: teachers.length,
          total_classes: classes.filter(c => c.status === 'active').length,
          attendance_today: presentToday
        },
        financial: {
          revenue_this_month: totalRevenue,
          outstanding_fees: pendingPayments,
          collection_rate: totalInvoiced > 0 ? ((totalRevenue / totalInvoiced) * 100).toFixed(1) : 0
        },
        academic: {
          total_subjects: 0,
          pass_rate: 0
        },
        activities: [],
        insights: [],
        charts: {
          revenue: [],
          attendance: [],
          fee_status: []
        },
        currentTerm: currentTerm ? `${currentTerm.term_name}, ${currentTerm.academic_year}` : 'No active term',
        attendanceRate: attendanceRate
      });
    } catch (error) {
      console.error('Error in fallback data fetch:', error);
    }
  };

  const fetchUpcomingEvents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/events.php?upcoming=true&limit=5`);
      if (response.data.events) {
        setEvents(response.data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    await fetchUpcomingEvents();
    setRefreshing(false);
  };

  const handleStartOnboarding = () => {
    setShowWelcome(false);
    setShowChecklist(true);
  };

  const handleSkipOnboarding = () => {
    setShowWelcome(false);
  };

  const handleDismissChecklist = () => {
    setShowChecklist(false);
  };

  // Calculate stats with comparison
  const getStatsCards = () => {
    if (!dashboardData) return [];
    
    const { stats, financial } = dashboardData;
    
    return [
      {
        title: 'Total Students',
        value: (stats?.total_students || 0).toLocaleString(),
        icon: GraduationCap,
        color: 'blue',
        change: '+12%',
        changeType: 'increase',
        link: '/admin/students'
      },
      {
        title: 'Total Teachers',
        value: stats?.total_teachers || 0,
        icon: Users,
        color: 'green',
        change: '+5%',
        changeType: 'increase',
        link: '/admin/teachers'
      },
      {
        title: 'Total Revenue',
        value: `GH₵${(financial?.revenue_this_month || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: DollarSign,
        color: 'purple',
        change: '+18%',
        changeType: 'increase',
        link: '/admin/payments'
      },
      {
        title: 'Outstanding Fees',
        value: `GH₵${(financial?.outstanding_fees || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: AlertCircle,
        color: 'orange',
        change: '-8%',
        changeType: 'decrease',
        link: '/admin/invoices'
      },
      {
        title: 'Active Classes',
        value: stats?.total_classes || 0,
        icon: BookOpen,
        color: 'indigo',
        change: '+3',
        changeType: 'increase',
        link: '/admin/classes'
      },
      {
        title: 'Attendance Rate',
        value: `${dashboardData.attendanceRate || (stats?.total_students > 0 ? ((stats?.attendance_today / stats?.total_students) * 100).toFixed(1) : 0)}%`,
        icon: UserCheck,
        color: 'teal',
        change: '+2.5%',
        changeType: 'increase',
        link: '/admin/attendance'
      }
    ];
  };

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    teal: 'bg-teal-100 text-teal-600'
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'alert': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
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

  const getActivityIcon = (type) => {
    switch (type) {
      case 'payment': return <DollarSign className="w-5 h-5" />;
      case 'admission': return <GraduationCap className="w-5 h-5" />;
      case 'staff': return <Users className="w-5 h-5" />;
      case 'class': return <BookOpen className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'payment': return 'bg-green-100 text-green-600';
      case 'admission': return 'bg-blue-100 text-blue-600';
      case 'staff': return 'bg-purple-100 text-purple-600';
      case 'class': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

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

  const statsCards = getStatsCards();
  const collectionRate = dashboardData?.financial?.collection_rate || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcome}
        onClose={handleSkipOnboarding}
        onStart={handleStartOnboarding}
        onSkip={handleSkipOnboarding}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Setup Checklist */}
      {showChecklist && onboardingStatus && onboardingStatus.completion_percentage < 100 && (
        <SetupChecklist onDismiss={handleDismissChecklist} />
      )}

      {/* Alerts/Notifications Section */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.slice(0, 3).map((alert, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getInsightBg(alert.type)} flex items-start gap-3`}>
              {getInsightIcon(alert.type)}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{alert.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
              </div>
              {alert.action && (
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  {alert.action} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className="card p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(stat.link)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                  <p className={`text-sm mt-2 flex items-center gap-1 ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.changeType === 'increase' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[stat.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fee Collection Progress */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Percent className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Fee Collection Progress</h3>
              <p className="text-sm text-gray-500">Current term collection rate</p>
            </div>
          </div>
          <span className="text-2xl font-bold text-purple-600">{collectionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className={`h-4 rounded-full transition-all duration-500 ${
              collectionRate >= 80 ? 'bg-green-500' : collectionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(collectionRate, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-500">
          <span>Collected: GH₵{(dashboardData?.financial?.revenue_this_month || 0).toLocaleString()}</span>
          <span>Outstanding: GH₵{(dashboardData?.financial?.outstanding_fees || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Charts Section */}
      {dashboardData?.charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Chart */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Revenue Trend (Last 6 Months)</h3>
            </div>
            <div className="space-y-3">
              {(dashboardData.charts.revenue || []).map((item, index) => {
                const maxAmount = Math.max(...(dashboardData.charts.revenue || []).map(r => r.amount || 0), 1);
                const percentage = ((item.amount || 0) / maxAmount) * 100;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 w-16">{item.month}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      >
                        <span className="text-xs text-white font-medium">
                          {(item.amount || 0) > 0 ? `GH₵${(item.amount / 1000).toFixed(1)}k` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Attendance Trend Chart */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <UserCheck className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Attendance (Last 7 Days)</h3>
            </div>
            <div className="flex items-end justify-between h-40 gap-2">
              {(dashboardData.charts.attendance || []).map((item, index) => {
                const total = (item.present || 0) + (item.absent || 0);
                const presentHeight = total > 0 ? ((item.present || 0) / Math.max(...(dashboardData.charts.attendance || []).map(a => (a.present || 0) + (a.absent || 0)), 1)) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end h-32">
                      <div 
                        className="w-full bg-green-500 rounded-t"
                        style={{ height: `${Math.max(presentHeight, 5)}%` }}
                        title={`Present: ${item.present || 0}`}
                      />
                    </div>
                    <span className="text-xs text-gray-500 mt-2">{item.day}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-sm text-gray-600">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-sm text-gray-600">Absent</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Recent Activity
            </h2>
            <button 
              onClick={() => navigate('/admin/logs')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {(dashboardData?.activities || []).length > 0 ? (
                dashboardData.activities.slice(0, 8).map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(activity.date).toLocaleDateString('en-GB', { 
                          day: 'numeric', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button 
                  onClick={() => navigate('/admin/admissions')}
                  className="w-full btn btn-primary text-left flex items-center gap-3"
                >
                  <GraduationCap className="w-5 h-5" />
                  <span>Enroll New Student</span>
                </button>
                <button 
                  onClick={() => navigate('/admin/teachers')}
                  className="w-full btn bg-green-600 text-white hover:bg-green-700 text-left flex items-center gap-3"
                >
                  <Users className="w-5 h-5" />
                  <span>Add Teacher</span>
                </button>
                <button 
                  onClick={() => navigate('/admin/invoices')}
                  className="w-full btn bg-purple-600 text-white hover:bg-purple-700 text-left flex items-center gap-3"
                >
                  <FileText className="w-5 h-5" />
                  <span>Create Invoice</span>
                </button>
                <button 
                  onClick={() => navigate('/admin/payments')}
                  className="w-full btn bg-orange-600 text-white hover:bg-orange-700 text-left flex items-center gap-3"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Record Payment</span>
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="card">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Upcoming Events
              </h2>
              <button 
                onClick={() => navigate('/admin/events')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View All
              </button>
            </div>
            <div className="p-6">
              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.slice(0, 4).map((event, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs text-indigo-600 font-medium">
                          {new Date(event.start_date || event.event_date).toLocaleDateString('en-GB', { month: 'short' })}
                        </span>
                        <span className="text-lg font-bold text-indigo-700">
                          {new Date(event.start_date || event.event_date).getDate()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{event.title || event.event_name}</p>
                        <p className="text-xs text-gray-500">{event.location || 'School'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming events</p>
                </div>
              )}
            </div>
          </div>

          {/* Current Term Info */}
          <div className="card p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 opacity-80" />
              <div>
                <p className="text-sm opacity-80">Current Term</p>
                <p className="font-semibold">{dashboardData?.currentTerm || 'No active term'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
