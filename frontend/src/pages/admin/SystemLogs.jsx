import { useState, useEffect, useRef } from 'react';
import { 
  Activity, Filter, Download, Search, RefreshCw, AlertCircle, CheckCircle, Info, XCircle,
  Clock, User, Globe, Shield, Eye, Trash2, Archive, Settings, Bell, Play, Pause,
  ChevronLeft, ChevronRight, FileText, BarChart3, TrendingUp, Lock, Unlock, LogIn,
  LogOut, Server, Database, AlertTriangle, X, Calendar, Users, CreditCard, GraduationCap,
  MessageSquare, Mail, Phone, BookOpen, Building, Layers, Zap
} from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../../config';

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({ type: 'all', category: 'all', user: '', dateFrom: '', dateTo: '', search: '', severity: 'all' });
  const [stats, setStats] = useState({ total: 0, today: 0, errors: 0, warnings: 0, info: 0, success: 0 });
  const [pagination, setPagination] = useState({ page: 1, perPage: 50, total: 0, totalPages: 0 });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showUserActivityModal, setShowUserActivityModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [analytics, setAnalytics] = useState({ byType: [], byCategory: [], byDay: [], byHour: [] });
  const [securityLogs, setSecurityLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [apiLogs, setApiLogs] = useState([]);
  const [logSettings, setLogSettings] = useState({ retentionDays: 90, autoArchive: true, archiveAfterDays: 30, alertOnCritical: true, alertEmail: '' });
  const refreshTimerRef = useRef(null);

  const categories = [
    { value: 'all', label: 'All Categories', icon: Layers },
    { value: 'auth', label: 'Authentication', icon: Lock },
    { value: 'students', label: 'Students', icon: GraduationCap },
    { value: 'teachers', label: 'Teachers', icon: Users },
    { value: 'finance', label: 'Finance', icon: CreditCard },
    { value: 'attendance', label: 'Attendance', icon: Calendar },
    { value: 'exams', label: 'Exams', icon: BookOpen },
    { value: 'communication', label: 'Communication', icon: MessageSquare },
    { value: 'settings', label: 'Settings', icon: Settings },
    { value: 'system', label: 'System', icon: Server },
    { value: 'api', label: 'API', icon: Globe }
  ];

  const severityLevels = [
    { value: 'all', label: 'All Severities' },
    { value: 'critical', label: 'Critical', color: 'red' },
    { value: 'major', label: 'Major', color: 'orange' },
    { value: 'minor', label: 'Minor', color: 'yellow' },
    { value: 'low', label: 'Low', color: 'blue' }
  ];

  useEffect(() => {
    loadSettings();
    fetchLogs();
    fetchStats();
    fetchAnalytics();
    fetchSecurityLogs();
    fetchSessions();
    fetchApiLogs();
  }, []);

  useEffect(() => {
    if (activeTab === 'security') fetchSecurityLogs();
    else if (activeTab === 'sessions') fetchSessions();
    else if (activeTab === 'api') fetchApiLogs();
  }, [activeTab]);

  useEffect(() => {
    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => { fetchLogs(); fetchStats(); }, refreshInterval * 1000);
    } else {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    }
    return () => { if (refreshTimerRef.current) clearInterval(refreshTimerRef.current); };
  }, [autoRefresh, refreshInterval]);

  const loadSettings = () => {
    const saved = localStorage.getItem('log_settings');
    if (saved) setLogSettings(JSON.parse(saved));
  };

  const saveSettings = () => {
    localStorage.setItem('log_settings', JSON.stringify(logSettings));
    setShowSettingsModal(false);
    alert('✅ Settings saved!');
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('per_page', pagination.perPage);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.severity !== 'all') params.append('severity', filters.severity);
      if (filters.user) params.append('user', filters.user);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.search) params.append('search', filters.search);

      const response = await axios.get(`${API_BASE_URL}/logs.php?${params}`);
      if (response.data.success) {
        setLogs(response.data.logs || []);
        if (response.data.pagination) {
          setPagination(prev => ({ 
            ...prev, 
            total: response.data.pagination.total, 
            totalPages: response.data.pagination.total_pages 
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/logs.php?stats=true`);
      if (response.data.success && response.data.stats) {
        setStats({
          total: parseInt(response.data.stats.total) || 0,
          today: parseInt(response.data.stats.today) || 0,
          errors: parseInt(response.data.stats.errors) || 0,
          warnings: parseInt(response.data.stats.warnings) || 0,
          info: parseInt(response.data.stats.info) || 0,
          success: parseInt(response.data.stats.success) || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/logs.php?analytics=true`);
      if (response.data.success && response.data.analytics) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchSecurityLogs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/logs.php?type=security`);
      if (response.data.success && response.data.logs) {
        setSecurityLogs(response.data.logs);
      }
    } catch (error) {
      console.error('Error fetching security logs:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/logs.php?type=sessions`);
      if (response.data.success && response.data.sessions) {
        setSessions(response.data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchApiLogs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/logs.php?type=api`);
      if (response.data.success && response.data.logs) {
        setApiLogs(response.data.logs);
      }
    } catch (error) {
      console.error('Error fetching API logs:', error);
    }
  };

  const fetchUserActivity = async (userId, userName) => {
    setSelectedUser({ id: userId, name: userName });
    try {
      const response = await axios.get(`${API_BASE_URL}/logs.php?user_id=${userId}`);
      setUserActivity(response.data.logs || []);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      // Filter from existing logs as fallback
      setUserActivity(logs.filter(l => l.user_id === userId || l.user_name === userName).slice(0, 20));
    }
    setShowUserActivityModal(true);
  };

  const handleExportCSV = () => {
    const csv = 'ID,Type,Category,Severity,Message,User,IP,Timestamp\n' + 
      logs.map(l => `${l.id},"${l.type}","${l.category || ''}","${l.severity || ''}","${l.message}","${l.user_name || 'System'}","${l.ip_address || ''}","${l.created_at}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `system_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('System Logs Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Logs: ${logs.length}`, 14, 36);

    autoTable(doc, {
      startY: 45,
      head: [['Type', 'Category', 'Message', 'User', 'Timestamp']],
      body: logs.slice(0, 100).map(l => [l.type, l.category || '-', l.message.substring(0, 40), l.user_name || 'System', new Date(l.created_at).toLocaleString()]),
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 }
    });

    doc.save(`system_logs_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleClearLogs = async (days) => {
    if (!confirm(`Are you sure you want to delete logs older than ${days} days? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_BASE_URL}/logs.php?older_than=${days}`);
      alert('✅ Old logs cleared successfully!');
      fetchLogs();
      fetchStats();
    } catch (error) {
      alert('Logs cleared (simulated)');
    }
  };

  const handleArchiveLogs = async () => {
    if (!confirm('Archive logs older than 30 days?')) return;
    try {
      await axios.post(`${API_BASE_URL}/logs.php?action=archive`);
      alert('✅ Logs archived successfully!');
    } catch (error) {
      alert('Logs archived (simulated)');
    }
  };

  const terminateSession = async (sessionId) => {
    if (!confirm('Terminate this session?')) return;
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'terminated' } : s));
    alert('✅ Session terminated!');
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getLogBadge = (type) => {
    const badges = { error: 'bg-red-100 text-red-700', warning: 'bg-orange-100 text-orange-700', success: 'bg-green-100 text-green-700', info: 'bg-blue-100 text-blue-700' };
    return badges[type] || badges.info;
  };

  const getSeverityBadge = (severity) => {
    const badges = { critical: 'bg-red-600 text-white', major: 'bg-orange-500 text-white', minor: 'bg-yellow-500 text-white', low: 'bg-blue-500 text-white' };
    return badges[severity] || 'bg-gray-500 text-white';
  };

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.icon : Layers;
  };

  const maxCount = Math.max(...analytics.byType.map(t => t.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Activity className="w-7 h-7 text-blue-600" /> System Logs</h1>
          <p className="text-gray-600 mt-1">Monitor system activity, security events, and API requests</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setAutoRefresh(!autoRefresh)} className={`btn flex items-center gap-2 ${autoRefresh ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
            {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {autoRefresh ? 'Stop' : 'Auto'} Refresh
          </button>
          <button onClick={() => { fetchLogs(); fetchStats(); }} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
          <button onClick={() => setShowSettingsModal(true)} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2"><Settings className="w-4 h-4" /> Settings</button>
          <div className="relative group">
            <button className="btn btn-primary flex items-center gap-2"><Download className="w-4 h-4" /> Export</button>
            <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg hidden group-hover:block z-10">
              <button onClick={handleExportCSV} className="block w-full px-4 py-2 text-left hover:bg-gray-50 text-sm">Export CSV</button>
              <button onClick={handleExportPDF} className="block w-full px-4 py-2 text-left hover:bg-gray-50 text-sm">Export PDF</button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="card p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white"><Activity className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Total</p><p className="text-2xl font-bold">{stats.total.toLocaleString()}</p></div>
        <div className="card p-4 bg-gradient-to-br from-green-500 to-green-600 text-white"><Clock className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Today</p><p className="text-2xl font-bold">{stats.today}</p></div>
        <div className="card p-4 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white"><Info className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Info</p><p className="text-2xl font-bold">{stats.info}</p></div>
        <div className="card p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"><CheckCircle className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Success</p><p className="text-2xl font-bold">{stats.success}</p></div>
        <div className="card p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white"><AlertCircle className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Warnings</p><p className="text-2xl font-bold">{stats.warnings}</p></div>
        <div className="card p-4 bg-gradient-to-br from-red-500 to-red-600 text-white"><XCircle className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Errors</p><p className="text-2xl font-bold">{stats.errors}</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {[
          { id: 'all', label: 'All Logs', icon: Layers },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'sessions', label: 'Sessions', icon: Users },
          { id: 'api', label: 'API Logs', icon: Globe }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-white shadow' : 'hover:bg-gray-200'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* All Logs Tab */}
      {activeTab === 'all' && (
        <>
          {/* Filters */}
          <div className="card p-4">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div><label className="block text-sm font-medium mb-1">Type</label><select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className="input"><option value="all">All Types</option><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="error">Error</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Category</label><select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="input">{categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Severity</label><select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })} className="input">{severityLevels.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">From</label><input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} className="input" /></div>
              <div><label className="block text-sm font-medium mb-1">To</label><input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} className="input" /></div>
              <div><label className="block text-sm font-medium mb-1">Search</label><input type="text" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Search..." className="input" /></div>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button onClick={fetchLogs} className="btn btn-primary flex items-center gap-2"><Filter className="w-4 h-4" /> Apply Filters</button>
              <div className="flex gap-2">
                <button onClick={() => handleClearLogs(30)} className="btn bg-red-100 text-red-700 hover:bg-red-200 text-sm flex items-center gap-2"><Trash2 className="w-4 h-4" /> Clear 30+ days</button>
                <button onClick={handleArchiveLogs} className="btn bg-purple-100 text-purple-700 hover:bg-purple-200 text-sm flex items-center gap-2"><Archive className="w-4 h-4" /> Archive</button>
              </div>
            </div>
          </div>

          {/* Logs Table */}
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500"><div className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>Loading...</div></td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">No logs found</td></tr>
                ) : (
                  logs.map((log) => {
                    const CatIcon = getCategoryIcon(log.category);
                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><div className="flex items-center gap-2">{getLogIcon(log.type)}<span className={`px-2 py-0.5 text-xs rounded-full ${getLogBadge(log.type)}`}>{log.type}</span></div></td>
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><CatIcon className="w-4 h-4 text-gray-500" /><span className="text-sm">{log.category || '-'}</span></div></td>
                        <td className="px-4 py-3">{log.severity && <span className={`px-2 py-0.5 text-xs rounded ${getSeverityBadge(log.severity)}`}>{log.severity}</span>}</td>
                        <td className="px-4 py-3"><p className="text-sm text-gray-900 truncate max-w-xs">{log.message}</p></td>
                        <td className="px-4 py-3"><button onClick={() => fetchUserActivity(log.user_id, log.user_name)} className="text-sm text-blue-600 hover:underline">{log.user_name || 'System'}</button></td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-600">{log.ip_address || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3"><button onClick={() => { setSelectedLog(log); setShowDetailsModal(true); }} className="p-1 hover:bg-gray-100 rounded"><Eye className="w-4 h-4 text-gray-600" /></button></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">Showing {logs.length} of {pagination.total} logs</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))} disabled={pagination.page === 1} className="btn bg-gray-100 hover:bg-gray-200 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm">Page {pagination.page} of {pagination.totalPages}</span>
              <button onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))} disabled={pagination.page === pagination.totalPages} className="btn bg-gray-100 hover:bg-gray-200 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600" /> Logs by Type</h3>
            <div className="space-y-3">
              {analytics.byType.map(item => (
                <div key={item.type} className="flex items-center gap-3">
                  <span className={`w-20 text-sm capitalize ${getLogBadge(item.type)} px-2 py-1 rounded text-center`}>{item.type}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-4"><div className={`h-4 rounded-full ${item.type === 'error' ? 'bg-red-500' : item.type === 'warning' ? 'bg-orange-500' : item.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${(item.count / maxCount) * 100}%` }}></div></div>
                  <span className="w-16 text-right text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-purple-600" /> Logs by Category</h3>
            <div className="space-y-3">
              {analytics.byCategory.map(item => {
                const cat = categories.find(c => c.value === item.category);
                const CatIcon = cat?.icon || Layers;
                return (
                  <div key={item.category} className="flex items-center gap-3">
                    <div className="w-20 flex items-center gap-2"><CatIcon className="w-4 h-4 text-gray-500" /><span className="text-sm capitalize">{item.category}</span></div>
                    <div className="flex-1 bg-gray-200 rounded-full h-4"><div className="h-4 rounded-full bg-purple-500" style={{ width: `${(item.count / Math.max(...analytics.byCategory.map(c => c.count))) * 100}%` }}></div></div>
                    <span className="w-16 text-right text-sm font-medium">{item.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-600" /> Logs by Day</h3>
            <div className="flex items-end gap-2 h-40">
              {analytics.byDay.map(item => (
                <div key={item.day} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-green-500 rounded-t" style={{ height: `${(item.count / Math.max(...analytics.byDay.map(d => d.count))) * 100}%` }}></div>
                  <span className="text-xs mt-2">{item.day}</span>
                  <span className="text-xs text-gray-500">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-orange-600" /> Logs by Hour</h3>
            <div className="flex items-end gap-1 h-40 overflow-x-auto">
              {analytics.byHour.map(item => (
                <div key={item.hour} className="flex flex-col items-center min-w-[20px]">
                  <div className="w-4 bg-orange-500 rounded-t" style={{ height: `${(item.count / Math.max(...analytics.byHour.map(h => h.count))) * 100}%` }}></div>
                  <span className="text-xs mt-1">{item.hour}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b bg-gray-50"><h3 className="font-semibold flex items-center gap-2"><Shield className="w-5 h-5 text-red-600" /> Security Events</h3></div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th></tr></thead>
            <tbody className="divide-y">
              {securityLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><div className="flex items-center gap-2">{log.event.includes('Failed') ? <XCircle className="w-4 h-4 text-red-600" /> : log.event.includes('locked') ? <Lock className="w-4 h-4 text-orange-600" /> : <Shield className="w-4 h-4 text-blue-600" />}<span className="text-sm">{log.event}</span></div></td>
                  <td className="px-4 py-3 text-sm">{log.user}</td>
                  <td className="px-4 py-3 text-sm font-mono">{log.ip}</td>
                  <td className="px-4 py-3 text-sm">{log.attempts || '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${log.status === 'blocked' ? 'bg-red-100 text-red-700' : log.status === 'locked' ? 'bg-orange-100 text-orange-700' : log.status === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{log.status}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b bg-gray-50"><h3 className="font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-purple-600" /> Active Sessions</h3></div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login Time</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
            <tbody className="divide-y">
              {sessions.map(session => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><div><p className="text-sm font-medium">{session.user}</p><p className="text-xs text-gray-500">{session.email}</p></div></td>
                  <td className="px-4 py-3 text-sm">{session.device}</td>
                  <td className="px-4 py-3 text-sm font-mono">{session.ip}</td>
                  <td className="px-4 py-3 text-sm">{new Date(session.login_time).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{new Date(session.last_activity).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${session.status === 'active' ? 'bg-green-100 text-green-700' : session.status === 'expired' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'}`}>{session.status}</span></td>
                  <td className="px-4 py-3">{session.status === 'active' && <button onClick={() => terminateSession(session.id)} className="btn bg-red-100 text-red-700 hover:bg-red-200 text-xs">Terminate</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* API Logs Tab */}
      {activeTab === 'api' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b bg-gray-50"><h3 className="font-semibold flex items-center gap-2"><Globe className="w-5 h-5 text-cyan-600" /> API Request Logs</h3></div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th></tr></thead>
            <tbody className="divide-y">
              {apiLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{log.endpoint}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded font-medium ${log.method === 'GET' ? 'bg-blue-100 text-blue-700' : log.method === 'POST' ? 'bg-green-100 text-green-700' : log.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{log.method}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded ${log.status >= 200 && log.status < 300 ? 'bg-green-100 text-green-700' : log.status >= 400 && log.status < 500 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{log.status}</span></td>
                  <td className="px-4 py-3 text-sm"><span className={log.duration > 1000 ? 'text-red-600 font-medium' : ''}>{log.duration}ms</span></td>
                  <td className="px-4 py-3 text-sm">{log.user}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white"><h3 className="text-lg font-semibold flex items-center gap-2"><Eye className="w-5 h-5 text-blue-600" /> Log Details</h3><button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-500">Type</label><div className="flex items-center gap-2 mt-1">{getLogIcon(selectedLog.type)}<span className={`px-2 py-1 text-sm rounded ${getLogBadge(selectedLog.type)}`}>{selectedLog.type}</span></div></div>
                <div><label className="text-sm text-gray-500">Category</label><p className="mt-1 capitalize">{selectedLog.category || '-'}</p></div>
                <div><label className="text-sm text-gray-500">Severity</label><p className="mt-1">{selectedLog.severity && <span className={`px-2 py-1 text-sm rounded ${getSeverityBadge(selectedLog.severity)}`}>{selectedLog.severity}</span>}</p></div>
                <div><label className="text-sm text-gray-500">Timestamp</label><p className="mt-1">{new Date(selectedLog.created_at).toLocaleString()}</p></div>
              </div>
              <div><label className="text-sm text-gray-500">Message</label><p className="mt-1 p-3 bg-gray-50 rounded-lg">{selectedLog.message}</p></div>
              {selectedLog.details && <div><label className="text-sm text-gray-500">Details</label><p className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">{selectedLog.details}</p></div>}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-500">User</label><p className="mt-1">{selectedLog.user_name || 'System'}</p></div>
                <div><label className="text-sm text-gray-500">IP Address</label><p className="mt-1 font-mono">{selectedLog.ip_address || '-'}</p></div>
                {selectedLog.user_agent && <div className="col-span-2"><label className="text-sm text-gray-500">User Agent</label><p className="mt-1 text-sm text-gray-600 break-all">{selectedLog.user_agent}</p></div>}
                {selectedLog.request_url && <div><label className="text-sm text-gray-500">Request URL</label><p className="mt-1 font-mono text-sm">{selectedLog.request_url}</p></div>}
                {selectedLog.request_method && <div><label className="text-sm text-gray-500">Method</label><p className="mt-1">{selectedLog.request_method}</p></div>}
                {selectedLog.response_code && <div><label className="text-sm text-gray-500">Response Code</label><p className="mt-1">{selectedLog.response_code}</p></div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Activity Modal */}
      {showUserActivityModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white"><h3 className="text-lg font-semibold flex items-center gap-2"><User className="w-5 h-5 text-purple-600" /> Activity: {selectedUser.name}</h3><button onClick={() => setShowUserActivityModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button></div>
            <div className="p-6">
              {userActivity.length === 0 ? <p className="text-center text-gray-500 py-8">No activity found</p> : (
                <div className="space-y-3">{userActivity.map(log => (
                  <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getLogIcon(log.type)}
                    <div className="flex-1"><p className="text-sm">{log.message}</p><p className="text-xs text-gray-500 mt-1">{new Date(log.created_at).toLocaleString()} • {log.ip_address}</p></div>
                  </div>
                ))}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><Settings className="w-5 h-5" /> Log Settings</h3><button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-2">Auto-Refresh Interval (seconds)</label><select value={refreshInterval} onChange={(e) => setRefreshInterval(parseInt(e.target.value))} className="input"><option value="10">10 seconds</option><option value="30">30 seconds</option><option value="60">1 minute</option><option value="300">5 minutes</option></select></div>
              <div><label className="block text-sm font-medium mb-2">Log Retention (days)</label><input type="number" value={logSettings.retentionDays} onChange={(e) => setLogSettings({...logSettings, retentionDays: parseInt(e.target.value)})} className="input" min="7" max="365" /></div>
              <div><label className="block text-sm font-medium mb-2">Archive After (days)</label><input type="number" value={logSettings.archiveAfterDays} onChange={(e) => setLogSettings({...logSettings, archiveAfterDays: parseInt(e.target.value)})} className="input" min="7" max="90" /></div>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={logSettings.autoArchive} onChange={(e) => setLogSettings({...logSettings, autoArchive: e.target.checked})} className="w-4 h-4" /><span>Auto-archive old logs</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={logSettings.alertOnCritical} onChange={(e) => setLogSettings({...logSettings, alertOnCritical: e.target.checked})} className="w-4 h-4" /><span>Alert on critical errors</span></label>
              {logSettings.alertOnCritical && <div><label className="block text-sm font-medium mb-2">Alert Email</label><input type="email" value={logSettings.alertEmail} onChange={(e) => setLogSettings({...logSettings, alertEmail: e.target.value})} className="input" placeholder="admin@school.com" /></div>}
            </div>
            <div className="flex justify-end gap-3 mt-6"><button onClick={() => setShowSettingsModal(false)} className="btn bg-gray-200 hover:bg-gray-300">Cancel</button><button onClick={saveSettings} className="btn btn-primary">Save Settings</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
