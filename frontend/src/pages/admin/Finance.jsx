import { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Clock, CheckCircle, FileText, CreditCard, AlertCircle,
  Download, Printer, Calendar, Filter, BarChart3, PieChart, Users, ArrowUp,
  ArrowDown, RefreshCw, Target, AlertTriangle, Eye, ChevronRight, Search
} from 'lucide-react';
import { financeAPI, classesAPI, termsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function Finance() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Enhanced state
  const [viewMode, setViewMode] = useState('overview'); // overview, analytics, reports
  const [dateRange, setDateRange] = useState('month'); // today, week, month, term, year, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [classWiseData, setClassWiseData] = useState([]);
  const [feeTypeData, setFeeTypeData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [overdueList, setOverdueList] = useState([]);
  const [topDebtors, setTopDebtors] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState({});
  const [collectionTarget, setCollectionTarget] = useState(0);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchAdditionalData();
  }, [dateRange, termFilter]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await financeAPI.getDashboardStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdditionalData = async () => {
    try {
      const [termsRes, classesRes] = await Promise.all([
        termsAPI.getAll(),
        classesAPI.getAll()
      ]);
      setTerms(termsRes.data.terms || []);
      setClasses(classesRes.data.classes || []);
      
      // Set active term
      const activeTerm = (termsRes.data.terms || []).find(t => t.is_active == 1);
      if (activeTerm && !termFilter) setTermFilter(activeTerm.id);

      // Fetch enhanced data
      await Promise.all([
        fetchRecentPayments(),
        fetchRecentInvoices(),
        fetchClassWiseData(),
        fetchFeeTypeData(),
        fetchMonthlyTrend(),
        fetchOverdueList(),
        fetchTopDebtors(),
        fetchPaymentMethods(),
        fetchComparison()
      ]);

      // Load saved target
      const savedTarget = localStorage.getItem('collection_target');
      if (savedTarget) setCollectionTarget(parseFloat(savedTarget));
    } catch (error) {
      console.error('Error fetching additional data:', error);
    }
  };

  const fetchRecentPayments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/finance.php?action=recent_payments&limit=5`);
      setRecentPayments(response.data.payments || []);
    } catch (error) {
      console.error('Error fetching recent payments:', error);
    }
  };

  const fetchRecentInvoices = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/finance.php?action=recent_invoices&limit=5`);
      setRecentInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Error fetching recent invoices:', error);
    }
  };

  const fetchClassWiseData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/finance.php?action=class_wise&term_id=${termFilter}`);
      setClassWiseData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching class-wise data:', error);
    }
  };

  const fetchFeeTypeData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/finance.php?action=fee_types&term_id=${termFilter}`);
      setFeeTypeData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching fee type data:', error);
    }
  };

  const fetchMonthlyTrend = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/finance.php?action=monthly_trend`);
      setMonthlyTrend(response.data.trend || []);
    } catch (error) {
      console.error('Error fetching monthly trend:', error);
    }
  };

  const fetchOverdueList = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/finance.php?action=overdue&limit=10`);
      setOverdueList(response.data.overdue || []);
    } catch (error) {
      console.error('Error fetching overdue list:', error);
    }
  };

  const fetchTopDebtors = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/finance.php?action=top_debtors&limit=10`);
      setTopDebtors(response.data.debtors || []);
    } catch (error) {
      console.error('Error fetching top debtors:', error);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/finance.php?action=payment_methods&term_id=${termFilter}`);
      setPaymentMethods(response.data.methods || {});
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const fetchComparison = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/finance.php?action=comparison`);
      setComparison(response.data.comparison || null);
    } catch (error) {
      console.error('Error fetching comparison:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount || 0);
  };

  const dashboardCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.total_revenue),
      icon: DollarSign,
      color: 'bg-blue-500',
      description: 'Total invoiced amount'
    },
    {
      title: 'Total Collected',
      value: formatCurrency(stats?.total_collected),
      icon: TrendingUp,
      color: 'bg-green-500',
      description: 'Payments received'
    },
    {
      title: 'Outstanding',
      value: formatCurrency(stats?.total_outstanding),
      icon: Clock,
      color: 'bg-orange-500',
      description: 'Pending payments'
    },
    {
      title: 'Pending Invoices',
      value: stats?.pending_invoices || 0,
      icon: FileText,
      color: 'bg-purple-500',
      description: 'Awaiting approval'
    },
    {
      title: 'Approved Invoices',
      value: stats?.approved_invoices || 0,
      icon: CheckCircle,
      color: 'bg-teal-500',
      description: 'Ready for payment'
    },
    {
      title: 'Paid Invoices',
      value: stats?.paid_invoices || 0,
      icon: CheckCircle,
      color: 'bg-green-600',
      description: 'Fully paid'
    },
    {
      title: "Today's Payments",
      value: stats?.today_payments || 0,
      icon: CreditCard,
      color: 'bg-indigo-500',
      description: 'Payments today'
    },
    {
      title: "Today's Amount",
      value: formatCurrency(stats?.today_amount),
      icon: DollarSign,
      color: 'bg-pink-500',
      description: 'Collected today'
    },
  ];

  const quickActions = [
    { title: 'Fee Structure', description: 'Manage fee groups, items, and rules', icon: FileText, color: 'bg-blue-500', path: '/admin/fee-structure' },
    { title: 'Invoices', description: 'Review and approve invoices', icon: FileText, color: 'bg-purple-500', path: '/admin/invoices' },
    { title: 'Payments', description: 'Record and track payments', icon: CreditCard, color: 'bg-green-500', path: '/admin/payments' },
  ];

  const viewTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const handleExportReport = () => {
    const data = {
      generated: new Date().toISOString(),
      stats,
      classWiseData,
      feeTypeData,
      monthlyTrend,
      overdueList,
      topDebtors
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleExportCSV = () => {
    const rows = [
      ['Finance Report', new Date().toLocaleDateString()],
      [],
      ['Summary'],
      ['Total Revenue', stats?.total_revenue || 0],
      ['Total Collected', stats?.total_collected || 0],
      ['Outstanding', stats?.total_outstanding || 0],
      ['Collection Rate', stats?.total_revenue > 0 ? ((stats?.total_collected / stats?.total_revenue) * 100).toFixed(1) + '%' : '0%'],
      [],
      ['Class-wise Collection'],
      ['Class', 'Total Fees', 'Collected', 'Outstanding', 'Rate'],
      ...classWiseData.map(c => [c.class_name, c.total_fees, c.collected, c.outstanding, c.rate + '%']),
      [],
      ['Top Debtors'],
      ['Student', 'Class', 'Outstanding'],
      ...topDebtors.map(d => [d.student_name, d.class_name, d.outstanding])
    ];
    
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePrintReport = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>Finance Report</title>
      <style>
        body { font-family: Arial; padding: 30px; }
        h1 { color: #1f2937; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
        .stat-card { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #1f2937; }
        .stat-label { font-size: 12px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #2563eb; color: white; }
        .section { margin-top: 30px; }
      </style></head><body>
      <h1>Finance Report</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      
      <div class="stats">
        <div class="stat-card"><div class="stat-value">${formatCurrency(stats?.total_revenue)}</div><div class="stat-label">Total Revenue</div></div>
        <div class="stat-card"><div class="stat-value">${formatCurrency(stats?.total_collected)}</div><div class="stat-label">Collected</div></div>
        <div class="stat-card"><div class="stat-value">${formatCurrency(stats?.total_outstanding)}</div><div class="stat-label">Outstanding</div></div>
        <div class="stat-card"><div class="stat-value">${stats?.total_revenue > 0 ? ((stats?.total_collected / stats?.total_revenue) * 100).toFixed(1) : 0}%</div><div class="stat-label">Collection Rate</div></div>
      </div>
      
      <div class="section">
        <h3>Class-wise Collection</h3>
        <table>
          <thead><tr><th>Class</th><th>Total Fees</th><th>Collected</th><th>Outstanding</th><th>Rate</th></tr></thead>
          <tbody>${classWiseData.map(c => `<tr><td>${c.class_name}</td><td>${formatCurrency(c.total_fees)}</td><td>${formatCurrency(c.collected)}</td><td>${formatCurrency(c.outstanding)}</td><td>${c.rate}%</td></tr>`).join('')}</tbody>
        </table>
      </div>
      
      <div class="section">
        <h3>Top Debtors</h3>
        <table>
          <thead><tr><th>Student</th><th>Class</th><th>Outstanding</th></tr></thead>
          <tbody>${topDebtors.map(d => `<tr><td>${d.student_name}</td><td>${d.class_name}</td><td>${formatCurrency(d.outstanding)}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const saveCollectionTarget = () => {
    localStorage.setItem('collection_target', collectionTarget.toString());
    setShowTargetModal(false);
    alert('Collection target saved!');
  };

  const getCollectionProgress = () => {
    if (!collectionTarget || collectionTarget === 0) return 0;
    return Math.min(((stats?.total_collected || 0) / collectionTarget) * 100, 100);
  };

  const maxTrendValue = Math.max(...monthlyTrend.map(m => parseFloat(m.collected) || 0), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading finance dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive financial overview and analytics</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTargetModal(true)} className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2">
            <Target className="w-4 h-4" /> Set Target
          </button>
          <button onClick={handleExportCSV} className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={handlePrintReport} className="btn bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={fetchStats} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* View Tabs & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {viewTabs.map(tab => (
            <button key={tab.id} onClick={() => setViewMode(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={termFilter} onChange={(e) => setTermFilter(e.target.value)} className="input w-auto">
            <option value="">All Terms</option>
            {terms.map(t => <option key={t.id} value={t.id}>{t.term_name}</option>)}
          </select>
        </div>
      </div>

      {/* Collection Target Progress */}
      {collectionTarget > 0 && (
        <div className="card p-4 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Collection Target</span>
            </div>
            <span className="text-sm">{formatCurrency(stats?.total_collected)} / {formatCurrency(collectionTarget)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${getCollectionProgress() >= 100 ? 'bg-green-500' : 'bg-purple-500'}`}
              style={{ width: `${getCollectionProgress()}%` }} />
          </div>
          <p className="text-sm text-gray-600 mt-1">{getCollectionProgress().toFixed(1)}% of target achieved</p>
        </div>
      )}

      {/* Overview Tab */}
      {viewMode === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dashboardCards.map((card, index) => (
              <div key={index} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                  {comparison && index < 2 && (
                    <div className={`flex items-center text-xs ${comparison.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {comparison.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {Math.abs(comparison.change || 0).toFixed(1)}%
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-xl font-bold text-gray-900">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Collection Rate & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Collection Rate</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Payment Collection</span>
                <span className="text-lg font-bold text-green-600">
                  {stats?.total_revenue > 0 ? ((stats?.total_collected / stats?.total_revenue) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div className="bg-green-500 h-4 rounded-full transition-all"
                  style={{ width: `${stats?.total_revenue > 0 ? (stats?.total_collected / stats?.total_revenue) * 100 : 0}%` }} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="bg-green-50 p-2 rounded"><span className="text-green-700 font-medium">Collected:</span> {formatCurrency(stats?.total_collected)}</div>
                <div className="bg-orange-50 p-2 rounded"><span className="text-orange-700 font-medium">Pending:</span> {formatCurrency(stats?.total_outstanding)}</div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-3 gap-4">
                {quickActions.map((action, index) => (
                  <button key={index} onClick={() => navigate(action.path)}
                    className="card p-4 hover:shadow-lg transition-shadow text-left">
                    <div className={`${action.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900">{action.title}</h4>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Recent Payments</h3>
                <button onClick={() => navigate('/admin/payments')} className="text-sm text-blue-600 hover:underline flex items-center">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {recentPayments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent payments</p>
              ) : (
                <div className="space-y-3">
                  {recentPayments.map((payment, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{payment.student_name}</p>
                        <p className="text-xs text-gray-500">{payment.payment_date}</p>
                      </div>
                      <span className="font-semibold text-green-600">{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Recent Invoices</h3>
                <button onClick={() => navigate('/admin/invoices')} className="text-sm text-blue-600 hover:underline flex items-center">
                  View All <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {recentInvoices.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent invoices</p>
              ) : (
                <div className="space-y-3">
                  {recentInvoices.map((invoice, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{invoice.student_name}</p>
                        <p className="text-xs text-gray-500">{invoice.invoice_number}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{formatCurrency(invoice.total_amount)}</span>
                        <span className={`block text-xs px-2 py-0.5 rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                          invoice.status === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                        }`}>{invoice.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Analytics Tab */}
      {viewMode === 'analytics' && (
        <>
          {/* Monthly Trend Chart */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Monthly Collection Trend</h3>
            {monthlyTrend.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No trend data available</p>
            ) : (
              <div className="relative">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-48 w-20 flex flex-col justify-between text-xs text-gray-400 pr-2 text-right">
                  <span>{formatCurrency(maxTrendValue)}</span>
                  <span>{formatCurrency(maxTrendValue / 2)}</span>
                  <span>GHS 0</span>
                </div>
                {/* Chart area */}
                <div className="ml-20">
                  <div className="flex items-end gap-2 h-48 border-b border-l border-gray-200 p-2">
                    {monthlyTrend.map((month, idx) => {
                      const collected = parseFloat(month.collected) || 0;
                      const heightPercent = maxTrendValue > 0 ? (collected / maxTrendValue) * 100 : 0;
                      const barHeight = Math.max((heightPercent / 100) * 176, collected > 0 ? 8 : 2); // 176px = 11rem - padding
                      return (
                        <div key={idx} className="flex-1 flex flex-col justify-end items-center group h-full">
                          {/* Tooltip */}
                          <div className="relative">
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {formatCurrency(collected)}
                            </div>
                          </div>
                          {/* Bar */}
                          <div 
                            className="w-full max-w-12 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all hover:from-blue-700 hover:to-blue-500 cursor-pointer"
                            style={{ height: `${barHeight}px` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* X-axis labels */}
                  <div className="flex gap-2 mt-2">
                    {monthlyTrend.map((month, idx) => (
                      <div key={idx} className="flex-1 text-center text-xs text-gray-500 font-medium">
                        {month.month}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Class-wise & Fee Type Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Class-wise Collection</h3>
              {classWiseData.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No data available</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {classWiseData.map((cls, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{cls.class_name}</span>
                        <span className="text-sm text-gray-600">{cls.rate || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${cls.rate || 0}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Collected: {formatCurrency(cls.collected)}</span>
                        <span>Outstanding: {formatCurrency(cls.outstanding)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Methods</h3>
              {Object.keys(paymentMethods).length === 0 ? (
                <p className="text-gray-500 text-center py-4">No data available</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(paymentMethods).map(([method, data], idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <span className="font-medium capitalize">{method.replace('_', ' ')}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{formatCurrency(data.amount)}</span>
                        <span className="block text-xs text-gray-500">{data.count} payments</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Overdue & Top Debtors */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-gray-900">Overdue Payments</h3>
              </div>
              {overdueList.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No overdue payments</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {overdueList.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.student_name}</p>
                        <p className="text-xs text-gray-500">{item.class_name} • {item.days_overdue} days overdue</p>
                      </div>
                      <span className="font-semibold text-red-600">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-900">Top Debtors</h3>
              </div>
              {topDebtors.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No outstanding debts</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {topDebtors.map((debtor, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-orange-200 rounded-full flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                        <div>
                          <p className="font-medium text-sm">{debtor.student_name}</p>
                          <p className="text-xs text-gray-500">{debtor.class_name}</p>
                        </div>
                      </div>
                      <span className="font-semibold text-orange-600">{formatCurrency(debtor.outstanding)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Reports Tab */}
      {viewMode === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleExportCSV}>
            <Download className="w-10 h-10 text-green-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Export CSV Report</h3>
            <p className="text-sm text-gray-600">Download comprehensive financial data in CSV format</p>
          </div>
          <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handleExportReport}>
            <FileText className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Export JSON Report</h3>
            <p className="text-sm text-gray-600">Download detailed report data in JSON format</p>
          </div>
          <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={handlePrintReport}>
            <Printer className="w-10 h-10 text-purple-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Print Report</h3>
            <p className="text-sm text-gray-600">Generate printable financial summary report</p>
          </div>
          <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/invoices')}>
            <FileText className="w-10 h-10 text-orange-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Invoice Report</h3>
            <p className="text-sm text-gray-600">View and manage all invoices</p>
          </div>
          <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/payments')}>
            <CreditCard className="w-10 h-10 text-teal-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Payment Report</h3>
            <p className="text-sm text-gray-600">View all payment transactions</p>
          </div>
          <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/fee-structure')}>
            <DollarSign className="w-10 h-10 text-indigo-600 mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Fee Structure</h3>
            <p className="text-sm text-gray-600">Manage fee groups and pricing</p>
          </div>
        </div>
      )}

      {/* Collection Target Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Set Collection Target</h2>
            <p className="text-gray-600 mb-4">Set a target amount for fee collection this term</p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Target Amount (GHS)</label>
              <input type="number" value={collectionTarget} onChange={(e) => setCollectionTarget(parseFloat(e.target.value) || 0)}
                className="input" placeholder="Enter target amount" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowTargetModal(false)} className="btn bg-gray-200">Cancel</button>
              <button onClick={saveCollectionTarget} className="btn btn-primary">Save Target</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
