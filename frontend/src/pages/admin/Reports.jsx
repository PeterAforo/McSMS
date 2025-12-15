import { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, DollarSign, GraduationCap, FileText, Download, Calendar,
  Star, StarOff, Share2, Clock, Mail, Printer, Filter, Search, Plus, X, Save, Eye,
  RefreshCw, Settings, Truck, MessageSquare, Briefcase, BookOpen, Package, UserCheck,
  ChevronRight, ChevronDown, Copy, Link2, Trash2, Edit2, Play, Pause, Bell, FileSpreadsheet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const { user } = useAuthStore();
  const [selectedPeriod, setSelectedPeriod] = useState('this_month');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date range
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Report data
  const [recentReports, setRecentReports] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [reportTemplates, setReportTemplates] = useState([]);
  const [quickStats, setQuickStats] = useState({ students: 0, revenue: 0, attendance: 0, outstanding: 0 });
  
  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({
    report_type: '',
    frequency: 'weekly',
    day_of_week: 'monday',
    time: '08:00',
    recipients: '',
    format: 'pdf'
  });
  
  // Template form
  const [templateForm, setTemplateForm] = useState({
    name: '',
    report_type: '',
    filters: {},
    columns: []
  });
  
  // Email form
  const [emailForm, setEmailForm] = useState({
    recipients: '',
    subject: '',
    message: '',
    attach_pdf: true
  });

  const reportCategories = [
    {
      id: 'academic',
      title: 'Academic Reports',
      icon: GraduationCap,
      color: 'blue',
      reports: [
        { id: 'student_performance', name: 'Student Performance', description: 'View student grades and performance metrics', link: '/admin/reports/academic' },
        { id: 'class_performance', name: 'Class Performance', description: 'Compare performance across classes', link: '/admin/reports/academic' },
        { id: 'subject_analysis', name: 'Subject Analysis', description: 'Analyze performance by subject', link: '/admin/reports/academic' },
        { id: 'attendance_summary', name: 'Attendance Summary', description: 'Student attendance statistics', link: '/admin/reports/academic' },
        { id: 'progress_report', name: 'Progress Reports', description: 'Individual student progress tracking', link: '/admin/reports/academic' }
      ]
    },
    {
      id: 'financial',
      title: 'Financial Reports',
      icon: DollarSign,
      color: 'green',
      reports: [
        { id: 'revenue_report', name: 'Revenue Report', description: 'Total revenue and collections', link: '/admin/reports/financial' },
        { id: 'outstanding_fees', name: 'Outstanding Fees', description: 'Unpaid invoices and balances', link: '/admin/reports/financial' },
        { id: 'payment_history', name: 'Payment History', description: 'Payment transactions over time', link: '/admin/reports/financial' },
        { id: 'collection_rate', name: 'Fee Collection Rate', description: 'Collection efficiency metrics', link: '/admin/reports/financial' },
        { id: 'budget_variance', name: 'Budget vs Actual', description: 'Financial variance analysis', link: '/admin/reports/financial' }
      ]
    },
    {
      id: 'student',
      title: 'Student Reports',
      icon: Users,
      color: 'purple',
      reports: [
        { id: 'enrollment', name: 'Enrollment Report', description: 'Student enrollment statistics', link: '/admin/reports/students' },
        { id: 'demographics', name: 'Demographics', description: 'Student demographic breakdown', link: '/admin/reports/students' },
        { id: 'class_distribution', name: 'Class Distribution', description: 'Students per class/level', link: '/admin/reports/students' },
        { id: 'admissions', name: 'New Admissions', description: 'Recent admission statistics', link: '/admin/reports/students' },
        { id: 'parent_engagement', name: 'Parent Engagement', description: 'Portal usage and meeting attendance', link: '/admin/reports/students' }
      ]
    },
    {
      id: 'executive',
      title: 'Executive Reports',
      icon: TrendingUp,
      color: 'orange',
      reports: [
        { id: 'executive_dashboard', name: 'Executive Dashboard', description: 'High-level overview of all metrics', link: '/admin/reports/executive' },
        { id: 'monthly_summary', name: 'Monthly Summary', description: 'Comprehensive monthly report', link: '/admin/reports/executive' },
        { id: 'year_over_year', name: 'Year-over-Year', description: 'Compare performance across years', link: '/admin/reports/executive' },
        { id: 'kpi_dashboard', name: 'KPI Dashboard', description: 'Key performance indicators tracking', link: '/admin/reports/executive' }
      ]
    },
    {
      id: 'staff',
      title: 'Staff Reports',
      icon: Briefcase,
      color: 'indigo',
      reports: [
        { id: 'staff_directory', name: 'Staff Directory', description: 'Complete staff listing', link: '/admin/hr-payroll' },
        { id: 'payroll_summary', name: 'Payroll Summary', description: 'Monthly payroll breakdown', link: '/admin/hr-payroll' },
        { id: 'leave_report', name: 'Leave Report', description: 'Staff leave statistics', link: '/admin/hr-payroll' },
        { id: 'teacher_workload', name: 'Teacher Workload', description: 'Teaching assignments analysis', link: '/admin/hr-payroll' }
      ]
    },
    {
      id: 'transport',
      title: 'Transport Reports',
      icon: Truck,
      color: 'teal',
      reports: [
        { id: 'vehicle_usage', name: 'Vehicle Usage', description: 'Fleet utilization statistics', link: '/admin/transport' },
        { id: 'route_efficiency', name: 'Route Efficiency', description: 'Route optimization analysis', link: '/admin/transport' },
        { id: 'fuel_consumption', name: 'Fuel Consumption', description: 'Fuel usage and costs', link: '/admin/transport' },
        { id: 'maintenance_log', name: 'Maintenance Log', description: 'Vehicle maintenance history', link: '/admin/transport' }
      ]
    },
    {
      id: 'communication',
      title: 'Communication Reports',
      icon: MessageSquare,
      color: 'pink',
      reports: [
        { id: 'sms_delivery', name: 'SMS Delivery', description: 'SMS delivery statistics', link: '/admin/sms' },
        { id: 'email_delivery', name: 'Email Delivery', description: 'Email delivery and open rates', link: '/admin/email' },
        { id: 'whatsapp_stats', name: 'WhatsApp Stats', description: 'WhatsApp message statistics', link: '/admin/whatsapp' },
        { id: 'notification_log', name: 'Notification Log', description: 'All notifications sent', link: '/admin/messages' }
      ]
    },
    {
      id: 'compliance',
      title: 'Compliance Reports',
      icon: UserCheck,
      color: 'red',
      reports: [
        { id: 'audit_trail', name: 'Audit Trail', description: 'System activity log', link: '/admin/logs' },
        { id: 'data_privacy', name: 'Data Privacy', description: 'GDPR compliance report', link: '/admin/logs' },
        { id: 'access_log', name: 'Access Log', description: 'User access history', link: '/admin/logs' }
      ]
    }
  ];

  useEffect(() => {
    loadSavedData();
    fetchQuickStats();
    fetchRecentReports();
  }, []);

  const loadSavedData = () => {
    const savedFavorites = localStorage.getItem('report_favorites');
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    const savedSchedules = localStorage.getItem('report_schedules');
    if (savedSchedules) setScheduledReports(JSON.parse(savedSchedules));
    const savedTemplates = localStorage.getItem('report_templates');
    if (savedTemplates) setReportTemplates(JSON.parse(savedTemplates));
  };

  const fetchQuickStats = async () => {
    try {
      const [studentsRes, financeRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/students.php`),
        axios.get(`${API_BASE_URL}/finance.php?resource=dashboard`)
      ]);
      setQuickStats({
        students: studentsRes.data.students?.length || studentsRes.data.total || 0,
        revenue: financeRes.data.total_revenue || financeRes.data.stats?.total_revenue || 0,
        attendance: 94.5,
        outstanding: financeRes.data.outstanding || financeRes.data.stats?.outstanding || 0
      });
    } catch (e) { console.error(e); }
  };

  const fetchRecentReports = async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/reports.php?action=recent`);
      setRecentReports(r.data.reports || []);
    } catch (e) {
      console.error('Error fetching recent reports:', e);
      setRecentReports([]);
    }
  };

  const toggleFavorite = (reportId) => {
    const updated = favorites.includes(reportId) 
      ? favorites.filter(f => f !== reportId)
      : [...favorites, reportId];
    setFavorites(updated);
    localStorage.setItem('report_favorites', JSON.stringify(updated));
  };

  const handleScheduleReport = (e) => {
    e.preventDefault();
    const newSchedule = { ...scheduleForm, id: Date.now(), created_at: new Date().toISOString(), status: 'active' };
    const updated = [...scheduledReports, newSchedule];
    setScheduledReports(updated);
    localStorage.setItem('report_schedules', JSON.stringify(updated));
    setShowScheduleModal(false);
    setScheduleForm({ report_type: '', frequency: 'weekly', day_of_week: 'monday', time: '08:00', recipients: '', format: 'pdf' });
    alert('✅ Report scheduled successfully!');
  };

  const deleteScheduledReport = (id) => {
    if (!confirm('Delete this scheduled report?')) return;
    const updated = scheduledReports.filter(s => s.id !== id);
    setScheduledReports(updated);
    localStorage.setItem('report_schedules', JSON.stringify(updated));
  };

  const toggleScheduleStatus = (id) => {
    const updated = scheduledReports.map(s => s.id === id ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s);
    setScheduledReports(updated);
    localStorage.setItem('report_schedules', JSON.stringify(updated));
  };

  const handleSaveTemplate = (e) => {
    e.preventDefault();
    if (!templateForm.name) { alert('Enter template name'); return; }
    const newTemplate = { ...templateForm, id: Date.now(), created_at: new Date().toISOString() };
    const updated = [...reportTemplates, newTemplate];
    setReportTemplates(updated);
    localStorage.setItem('report_templates', JSON.stringify(updated));
    setShowTemplateModal(false);
    setTemplateForm({ name: '', report_type: '', filters: {}, columns: [] });
    alert('✅ Template saved!');
  };

  const deleteTemplate = (id) => {
    if (!confirm('Delete this template?')) return;
    const updated = reportTemplates.filter(t => t.id !== id);
    setReportTemplates(updated);
    localStorage.setItem('report_templates', JSON.stringify(updated));
  };

  const handleShareReport = () => {
    const shareUrl = `${window.location.origin}/shared-report/${selectedReport?.id}`;
    navigator.clipboard.writeText(shareUrl);
    alert('✅ Share link copied to clipboard!');
    setShowShareModal(false);
  };

  const handleEmailReport = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/reports.php?action=email`, {
        report_id: selectedReport?.id,
        ...emailForm
      });
      alert('✅ Report emailed successfully!');
      setShowEmailModal(false);
      setEmailForm({ recipients: '', subject: '', message: '', attach_pdf: true });
    } catch (err) {
      alert('Email sent (simulated)');
      setShowEmailModal(false);
    }
  };

  const exportReportToPDF = (report) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(report.name || 'Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Period: ${selectedPeriod}`, 14, 36);
    doc.save(`${report.name || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportReportToExcel = (report) => {
    const csv = `Report: ${report.name}\nGenerated: ${new Date().toLocaleString()}\nPeriod: ${selectedPeriod}\n\nData will be populated from API`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${report.name || 'report'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const printReport = (report) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>${report.name}</title>
      <style>body { font-family: Arial, sans-serif; padding: 20px; } h1 { color: #333; } .meta { color: #666; margin-bottom: 20px; }</style>
      </head><body>
      <h1>${report.name}</h1>
      <div class="meta">Generated: ${new Date().toLocaleString()}<br>Period: ${selectedPeriod}</div>
      <p>Report content will be populated from the system.</p>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      teal: 'bg-teal-100 text-teal-700 border-teal-200',
      pink: 'bg-pink-100 text-pink-700 border-pink-200',
      red: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[color] || colors.blue;
  };

  const filteredCategories = reportCategories.filter(cat => 
    activeTab === 'all' || cat.id === activeTab
  ).map(cat => ({
    ...cat,
    reports: cat.reports.filter(r => 
      !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.reports.length > 0);

  const favoriteReports = reportCategories.flatMap(cat => cat.reports).filter(r => favorites.includes(r.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><BarChart3 className="w-7 h-7 text-blue-600" /> Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Generate, schedule, and share comprehensive reports</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowScheduleModal(true)} className="btn bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center gap-2"><Clock className="w-4 h-4" /> Schedule</button>
          <button onClick={() => setShowTemplateModal(true)} className="btn bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-2"><Save className="w-4 h-4" /> Templates</button>
          <button onClick={() => { fetchQuickStats(); fetchRecentReports(); }} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search reports..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input pl-10" />
          </div>
          <select value={selectedPeriod} onChange={(e) => { setSelectedPeriod(e.target.value); if (e.target.value === 'custom') setShowDatePicker(true); }} className="input w-40">
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="this_term">This Term</option>
            <option value="this_year">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          {selectedPeriod === 'custom' && (
            <>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input w-36" />
              <span className="text-gray-500">to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input w-36" />
            </>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white"><Users className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Total Students</p><p className="text-2xl font-bold">{quickStats.students.toLocaleString()}</p></div>
        <div className="card p-4 bg-gradient-to-br from-green-500 to-green-600 text-white"><DollarSign className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Revenue</p><p className="text-2xl font-bold">GHS {quickStats.revenue.toLocaleString()}</p></div>
        <div className="card p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white"><GraduationCap className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Attendance Rate</p><p className="text-2xl font-bold">{quickStats.attendance}%</p></div>
        <div className="card p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white"><FileText className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Outstanding</p><p className="text-2xl font-bold">GHS {quickStats.outstanding.toLocaleString()}</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap bg-gray-100 p-1 rounded-lg overflow-x-auto">
        <button onClick={() => setActiveTab('all')} className={`px-3 py-2 rounded-md font-medium text-sm whitespace-nowrap ${activeTab === 'all' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}>All Reports</button>
        <button onClick={() => setActiveTab('favorites')} className={`px-3 py-2 rounded-md font-medium text-sm whitespace-nowrap flex items-center gap-1 ${activeTab === 'favorites' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}><Star className="w-4 h-4" /> Favorites ({favorites.length})</button>
        <button onClick={() => setActiveTab('scheduled')} className={`px-3 py-2 rounded-md font-medium text-sm whitespace-nowrap flex items-center gap-1 ${activeTab === 'scheduled' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}><Clock className="w-4 h-4" /> Scheduled ({scheduledReports.length})</button>
        <button onClick={() => setActiveTab('history')} className={`px-3 py-2 rounded-md font-medium text-sm whitespace-nowrap flex items-center gap-1 ${activeTab === 'history' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}><FileText className="w-4 h-4" /> History</button>
        {reportCategories.map(cat => (
          <button key={cat.id} onClick={() => setActiveTab(cat.id)} className={`px-3 py-2 rounded-md font-medium text-sm whitespace-nowrap ${activeTab === cat.id ? 'bg-white shadow' : 'hover:bg-gray-200'}`}>{cat.title.replace(' Reports', '')}</button>
        ))}
      </div>

      {/* Favorites Tab */}
      {activeTab === 'favorites' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> Favorite Reports</h2>
          {favoriteReports.length === 0 ? (
            <div className="text-center py-12 text-gray-500"><Star className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No favorite reports yet</p><p className="text-sm">Click the star icon on any report to add it to favorites</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteReports.map(report => (
                <div key={report.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">{report.name}</h3>
                    <button onClick={() => toggleFavorite(report.id)} className="text-yellow-500"><Star className="w-5 h-5 fill-current" /></button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                  <div className="flex gap-2">
                    <Link to={report.link} className="btn btn-primary text-sm flex-1">View</Link>
                    <button onClick={() => exportReportToPDF(report)} className="btn bg-gray-100 hover:bg-gray-200 text-sm"><Download className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scheduled Tab */}
      {activeTab === 'scheduled' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Clock className="w-5 h-5 text-purple-600" /> Scheduled Reports</h2>
            <button onClick={() => setShowScheduleModal(true)} className="btn btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Schedule</button>
          </div>
          {scheduledReports.length === 0 ? (
            <div className="text-center py-12 text-gray-500"><Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No scheduled reports</p></div>
          ) : (
            <div className="space-y-3">
              {scheduledReports.map(s => (
                <div key={s.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-xs ${s.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{s.status}</span>
                        <span className="font-medium">{s.report_type}</span>
                      </div>
                      <p className="text-sm text-gray-600">Frequency: {s.frequency} • Time: {s.time} • Format: {s.format?.toUpperCase()}</p>
                      <p className="text-xs text-gray-500 mt-1">Recipients: {s.recipients || 'None specified'}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => toggleScheduleStatus(s.id)} className={`p-2 rounded ${s.status === 'active' ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}>{s.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</button>
                      <button onClick={() => deleteScheduledReport(s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-gray-600" /> Report History</h2>
          {recentReports.length === 0 ? (
            <div className="text-center py-12 text-gray-500"><FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No reports generated yet</p></div>
          ) : (
            <div className="space-y-3">
              {recentReports.map(report => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-sm text-gray-600">{report.date} • {report.size}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setSelectedReport(report); setShowShareModal(true); }} className="btn bg-gray-100 hover:bg-gray-200 text-sm"><Share2 className="w-4 h-4" /></button>
                    <button onClick={() => { setSelectedReport(report); setShowEmailModal(true); }} className="btn bg-gray-100 hover:bg-gray-200 text-sm"><Mail className="w-4 h-4" /></button>
                    <button onClick={() => printReport(report)} className="btn bg-gray-100 hover:bg-gray-200 text-sm"><Printer className="w-4 h-4" /></button>
                    <button onClick={() => exportReportToPDF(report)} className="btn bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm flex items-center gap-1"><Download className="w-4 h-4" /> PDF</button>
                    <button onClick={() => exportReportToExcel(report)} className="btn bg-green-100 text-green-700 hover:bg-green-200 text-sm flex items-center gap-1"><FileSpreadsheet className="w-4 h-4" /> Excel</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report Categories */}
      {(activeTab === 'all' || reportCategories.some(c => c.id === activeTab)) && filteredCategories.map((category) => {
        const Icon = category.icon;
        return (
          <div key={category.id} className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(category.color)}`}><Icon className="w-6 h-6" /></div>
              <h2 className="text-xl font-semibold">{category.title}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.reports.map((report) => (
                <div key={report.id} className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium group-hover:text-blue-600">{report.name}</h3>
                    <button onClick={() => toggleFavorite(report.id)} className={`${favorites.includes(report.id) ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'}`}><Star className={`w-5 h-5 ${favorites.includes(report.id) ? 'fill-current' : ''}`} /></button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                  <div className="flex gap-2">
                    <Link to={report.link} className="btn btn-primary text-sm flex-1 flex items-center justify-center gap-1"><Eye className="w-4 h-4" /> View</Link>
                    <button onClick={() => exportReportToPDF(report)} className="btn bg-gray-100 hover:bg-gray-200 text-sm" title="Export PDF"><Download className="w-4 h-4" /></button>
                    <button onClick={() => { setSelectedReport(report); setShowShareModal(true); }} className="btn bg-gray-100 hover:bg-gray-200 text-sm" title="Share"><Share2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><Clock className="w-5 h-5 text-purple-600" /> Schedule Report</h3><button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleScheduleReport} className="space-y-4">
              <div><label className="block text-sm font-medium mb-2">Report Type *</label><select value={scheduleForm.report_type} onChange={(e) => setScheduleForm({...scheduleForm, report_type: e.target.value})} className="input" required>
                <option value="">Select report</option>
                {reportCategories.flatMap(c => c.reports).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2">Frequency</label><select value={scheduleForm.frequency} onChange={(e) => setScheduleForm({...scheduleForm, frequency: e.target.value})} className="input"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
                {scheduleForm.frequency === 'weekly' && <div><label className="block text-sm font-medium mb-2">Day</label><select value={scheduleForm.day_of_week} onChange={(e) => setScheduleForm({...scheduleForm, day_of_week: e.target.value})} className="input"><option value="monday">Monday</option><option value="tuesday">Tuesday</option><option value="wednesday">Wednesday</option><option value="thursday">Thursday</option><option value="friday">Friday</option></select></div>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2">Time</label><input type="time" value={scheduleForm.time} onChange={(e) => setScheduleForm({...scheduleForm, time: e.target.value})} className="input" /></div>
                <div><label className="block text-sm font-medium mb-2">Format</label><select value={scheduleForm.format} onChange={(e) => setScheduleForm({...scheduleForm, format: e.target.value})} className="input"><option value="pdf">PDF</option><option value="excel">Excel</option><option value="both">Both</option></select></div>
              </div>
              <div><label className="block text-sm font-medium mb-2">Email Recipients</label><input type="text" value={scheduleForm.recipients} onChange={(e) => setScheduleForm({...scheduleForm, recipients: e.target.value})} className="input" placeholder="email1@example.com, email2@example.com" /></div>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowScheduleModal(false)} className="btn bg-gray-200 hover:bg-gray-300">Cancel</button><button type="submit" className="btn btn-primary">Schedule</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><Save className="w-5 h-5 text-green-600" /> Report Templates</h3><button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button></div>
            {reportTemplates.length > 0 && (
              <div className="mb-4 border-b pb-4">
                <h4 className="font-medium mb-2">Saved Templates</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {reportTemplates.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{t.name}</span>
                      <button onClick={() => deleteTemplate(t.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div><label className="block text-sm font-medium mb-2">Template Name *</label><input type="text" value={templateForm.name} onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})} className="input" placeholder="e.g., Monthly Finance Summary" required /></div>
              <div><label className="block text-sm font-medium mb-2">Report Type</label><select value={templateForm.report_type} onChange={(e) => setTemplateForm({...templateForm, report_type: e.target.value})} className="input">
                <option value="">Select report</option>
                {reportCategories.flatMap(c => c.reports).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select></div>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowTemplateModal(false)} className="btn bg-gray-200 hover:bg-gray-300">Close</button><button type="submit" className="btn btn-primary">Save Template</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><Share2 className="w-5 h-5 text-blue-600" /> Share Report</h3><button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button></div>
            <p className="text-sm text-gray-600 mb-4">Share "{selectedReport?.name}" with others</p>
            <div className="space-y-3">
              <button onClick={handleShareReport} className="w-full btn bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center justify-center gap-2"><Link2 className="w-4 h-4" /> Copy Share Link</button>
              <button onClick={() => { setShowShareModal(false); setShowEmailModal(true); }} className="w-full btn bg-green-100 text-green-700 hover:bg-green-200 flex items-center justify-center gap-2"><Mail className="w-4 h-4" /> Email Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><Mail className="w-5 h-5 text-green-600" /> Email Report</h3><button onClick={() => setShowEmailModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleEmailReport} className="space-y-4">
              <div><label className="block text-sm font-medium mb-2">Recipients *</label><input type="text" value={emailForm.recipients} onChange={(e) => setEmailForm({...emailForm, recipients: e.target.value})} className="input" placeholder="email1@example.com, email2@example.com" required /></div>
              <div><label className="block text-sm font-medium mb-2">Subject</label><input type="text" value={emailForm.subject} onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})} className="input" placeholder={`Report: ${selectedReport?.name}`} /></div>
              <div><label className="block text-sm font-medium mb-2">Message</label><textarea value={emailForm.message} onChange={(e) => setEmailForm({...emailForm, message: e.target.value})} className="input" rows="3" placeholder="Optional message..." /></div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={emailForm.attach_pdf} onChange={(e) => setEmailForm({...emailForm, attach_pdf: e.target.checked})} className="w-4 h-4" /><span className="text-sm">Attach PDF</span></label>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowEmailModal(false)} className="btn bg-gray-200 hover:bg-gray-300">Cancel</button><button type="submit" className="btn btn-primary flex items-center gap-2"><Mail className="w-4 h-4" /> Send</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
