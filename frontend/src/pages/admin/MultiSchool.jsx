import { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Building, TrendingUp, Users, DollarSign, Plus, Edit2, X, Eye, ArrowRightLeft, FileText, MessageSquare, Share2, BarChart3, MapPin, Phone, Mail, Globe, Crown, RefreshCw, CheckCircle, XCircle, Clock, Send, Download, Search, Filter, PieChart, Activity, History, Settings, Trash2, Copy, GitBranch, Layers, AlertCircle, Database, FileSpreadsheet } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const API = `${API_BASE_URL}/multi_school.php`;

export default function MultiSchool() {
  const [branches, setBranches] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [resources, setResources] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [reports, setReports] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Enhanced state for new features
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [transferHistory, setTransferHistory] = useState([]);
  const [bulkTransferStudents, setBulkTransferStudents] = useState([]);
  const [commTemplates, setCommTemplates] = useState([]);
  const [readReceipts, setReadReceipts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [syncStatus, setSyncStatus] = useState([]);
  const [branchRevenue, setBranchRevenue] = useState([]);
  const [compareBranches, setCompareBranches] = useState([]);

  const [branchForm, setBranchForm] = useState({ branch_name: '', branch_code: '', branch_type: 'branch', address: '', city: '', state: '', country: 'Ghana', phone: '', email: '', subscription_plan: 'pro', max_students: 2000, max_staff: 200, status: 'active', parent_branch_id: '' });
  const [transferForm, setTransferForm] = useState({ transfer_type: 'student', entity_id: '', from_branch_id: '', to_branch_id: '', transfer_date: '', reason: '' });
  const [resourceForm, setResourceForm] = useState({ resource_type: 'document', resource_name: '', description: '', file_path: '', owner_branch_id: '', shared_with: [], category: '', is_public: false });
  const [commForm, setCommForm] = useState({ communication_type: 'announcement', subject: '', message: '', from_branch_id: '', to_branches: 'all', priority: 'normal', template_id: '' });
  const [reportForm, setReportForm] = useState({ report_type: 'financial', branches: [], start_date: '', end_date: '' });
  const [templateForm, setTemplateForm] = useState({ name: '', type: 'announcement', subject: '', message: '' });

  useEffect(() => {
    Promise.all([fetchBranches(), fetchStudents(), fetchTeachers(), fetchSyncStatus(), fetchBranchRevenue()]).then(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'transfers') { fetchTransfers(); fetchTransferHistory(); }
    if (activeTab === 'resources') fetchResources();
    if (activeTab === 'communications') { fetchCommunications(); fetchCommTemplates(); }
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  const fetchBranches = async () => { try { const r = await axios.get(`${API}?resource=branches`); setBranches(r.data.branches || []); } catch (e) { console.error(e); } };
  const fetchTransfers = async () => { try { const r = await axios.get(`${API}?resource=transfers&action=pending`); setTransfers(r.data.transfers || []); } catch (e) { console.error(e); } };
  const fetchTransferHistory = async () => { try { const r = await axios.get(`${API}?resource=transfers&action=history`); setTransferHistory(r.data.transfers || []); } catch (e) { console.error(e); } };
  const fetchResources = async () => { try { const r = await axios.get(`${API}?resource=shared_resources&branch_id=${selectedBranch?.id || 1}`); setResources(r.data.resources || []); } catch (e) { console.error(e); } };
  const fetchCommunications = async () => { try { const r = await axios.get(`${API}?resource=communications&branch_id=${selectedBranch?.id || 1}`); setCommunications(r.data.communications || []); } catch (e) { console.error(e); } };
  const fetchCommTemplates = async () => { try { const r = await axios.get(`${API}?resource=comm_templates`); setCommTemplates(r.data.templates || []); } catch (e) { console.error(e); } };
  const fetchReports = async () => { try { const r = await axios.get(`${API}?resource=consolidated_reports`); setReports(r.data.reports || []); } catch (e) { console.error(e); } };
  const fetchStudents = async () => { try { const r = await axios.get(`${API_BASE_URL}/students.php`); setStudents(r.data.students || []); } catch (e) { console.error(e); } };
  const fetchTeachers = async () => { try { const r = await axios.get(`${API_BASE_URL}/teachers.php`); setTeachers(r.data.teachers || []); } catch (e) { console.error(e); } };
  const fetchAuditLogs = async () => { try { const r = await axios.get(`${API}?resource=audit_logs`); setAuditLogs(r.data.logs || []); } catch (e) { console.error(e); } };
  const fetchSyncStatus = async () => { try { const r = await axios.get(`${API}?resource=sync_status`); setSyncStatus(r.data.sync_status || []); } catch (e) { console.error(e); } };
  const fetchBranchRevenue = async () => { try { const r = await axios.get(`${API}?resource=branch_revenue`); setBranchRevenue(r.data.revenue || []); } catch (e) { console.error(e); } };

  // Filter functions
  const filteredBranches = branches.filter(b => {
    const matchesSearch = !searchTerm || b.branch_name?.toLowerCase().includes(searchTerm.toLowerCase()) || b.branch_code?.toLowerCase().includes(searchTerm.toLowerCase()) || b.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || b.status === statusFilter;
    const matchesPlan = !planFilter || b.subscription_plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Export functions
  const exportToPDF = (type) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Multi-School ${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    
    if (type === 'branches') {
      autoTable(doc, { startY: 35, head: [['Name', 'Code', 'City', 'Students', 'Teachers', 'Plan', 'Status']], body: filteredBranches.map(b => [b.branch_name, b.branch_code, b.city || '-', b.total_students || 0, b.total_teachers || 0, b.subscription_plan, b.status]) });
    } else if (type === 'transfers') {
      autoTable(doc, { startY: 35, head: [['Type', 'From', 'To', 'Date', 'Status']], body: transfers.map(t => [t.transfer_type, t.from_branch_name, t.to_branch_name, t.transfer_date, t.status]) });
    } else if (type === 'revenue') {
      autoTable(doc, { startY: 35, head: [['Branch', 'Revenue', 'Expenses', 'Net']], body: branchRevenue.map(r => [r.branch_name, `GHS ${r.revenue?.toLocaleString() || 0}`, `GHS ${r.expenses?.toLocaleString() || 0}`, `GHS ${(r.revenue - r.expenses)?.toLocaleString() || 0}`]) });
    }
    doc.save(`multi_school_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = (type) => {
    let csv = '';
    if (type === 'branches') {
      csv = 'Name,Code,City,Students,Teachers,Plan,Status\n' + filteredBranches.map(b => `"${b.branch_name}",${b.branch_code},${b.city || '-'},${b.total_students || 0},${b.total_teachers || 0},${b.subscription_plan},${b.status}`).join('\n');
    } else if (type === 'transfers') {
      csv = 'Type,From,To,Date,Status\n' + transfers.map(t => `${t.transfer_type},${t.from_branch_name},${t.to_branch_name},${t.transfer_date},${t.status}`).join('\n');
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `multi_school_${type}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const handleSaveBranch = async (e) => {
    e.preventDefault();
    try {
      if (editingItem?.id) {
        await axios.put(`${API}?resource=branches&id=${editingItem.id}`, branchForm);
      } else {
        await axios.post(`${API}?resource=branches`, branchForm);
      }
      alert('✅ Branch saved!');
      fetchBranches();
      closeModal();
    } catch (e) { alert('Failed to save'); }
  };

  const handleSaveTransfer = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}?resource=transfers`, transferForm);
      alert('✅ Transfer request submitted!');
      fetchTransfers();
      closeModal();
    } catch (e) { alert('Failed to save'); }
  };

  const handleApproveTransfer = async (id) => {
    if (!confirm('Approve this transfer?')) return;
    try {
      await axios.put(`${API}?resource=transfers&id=${id}&action=approve`, { approved_by: 1 });
      alert('✅ Transfer approved!');
      fetchTransfers();
    } catch (e) { alert('Failed'); }
  };

  const handleRejectTransfer = async (id) => {
    if (!confirm('Reject this transfer?')) return;
    try {
      await axios.put(`${API}?resource=transfers&id=${id}&action=reject`, { approved_by: 1 });
      alert('Transfer rejected');
      fetchTransfers();
    } catch (e) { alert('Failed'); }
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}?resource=shared_resources`, resourceForm);
      alert('✅ Resource shared!');
      fetchResources();
      closeModal();
    } catch (e) { alert('Failed to save'); }
  };

  const handleSendCommunication = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}?resource=communications`, commForm);
      alert('✅ Communication sent!');
      fetchCommunications();
      closeModal();
    } catch (e) { alert('Failed to send'); }
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    try {
      const params = new URLSearchParams({
        resource: 'consolidated_reports',
        action: 'generate',
        report_type: reportForm.report_type,
        branches: JSON.stringify(reportForm.branches),
        start_date: reportForm.start_date,
        end_date: reportForm.end_date
      });
      const r = await axios.get(`${API}?${params}`);
      if (r.data.success) {
        alert('✅ Report generated!');
        fetchReports();
        closeModal();
      }
    } catch (e) { alert('Failed to generate'); }
  };

  // Bulk transfer
  const handleBulkTransfer = async (e) => {
    e.preventDefault();
    if (bulkTransferStudents.length === 0) { alert('Select students first'); return; }
    try {
      await axios.post(`${API}?resource=transfers&action=bulk`, { ...transferForm, student_ids: bulkTransferStudents });
      alert(`✅ ${bulkTransferStudents.length} transfer requests submitted!`);
      fetchTransfers();
      setBulkTransferStudents([]);
      closeModal();
    } catch (e) { alert('Failed'); }
  };

  // Communication template
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}?resource=comm_templates`, templateForm);
      alert('✅ Template saved!');
      fetchCommTemplates();
      closeModal();
    } catch (e) { alert('Failed'); }
  };

  const handleUseTemplate = (template) => {
    setCommForm({ ...commForm, subject: template.subject, message: template.message, template_id: template.id });
  };

  // Sync data
  const handleSyncBranch = async (branchId) => {
    try {
      await axios.post(`${API}?resource=sync_status&action=sync&branch_id=${branchId}`);
      alert('✅ Sync initiated!');
      fetchSyncStatus();
    } catch (e) { alert('Failed'); }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    if (type === 'branch') setBranchForm(item || { branch_name: '', branch_code: '', branch_type: 'branch', address: '', city: '', state: '', country: 'Ghana', phone: '', email: '', subscription_plan: 'pro', max_students: 2000, max_staff: 200, status: 'active', parent_branch_id: '' });
    else if (type === 'transfer') setTransferForm({ transfer_type: 'student', entity_id: '', from_branch_id: '', to_branch_id: '', transfer_date: new Date().toISOString().split('T')[0], reason: '' });
    else if (type === 'bulk_transfer') { setTransferForm({ transfer_type: 'student', from_branch_id: '', to_branch_id: '', transfer_date: new Date().toISOString().split('T')[0], reason: '' }); setBulkTransferStudents([]); }
    else if (type === 'resource') setResourceForm({ resource_type: 'document', resource_name: '', description: '', file_path: '', owner_branch_id: branches[0]?.id || '', shared_with: [], category: '', is_public: false });
    else if (type === 'communication') setCommForm({ communication_type: 'announcement', subject: '', message: '', from_branch_id: branches[0]?.id || '', to_branches: 'all', priority: 'normal', template_id: '' });
    else if (type === 'template') setTemplateForm({ name: '', type: 'announcement', subject: '', message: '' });
    else if (type === 'report') setReportForm({ report_type: 'financial', branches: branches.map(b => b.id), start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0] });
    else if (type === 'compare') setCompareBranches([]);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingItem(null); };

  const getStatusBadge = (s) => ({ active: 'bg-green-100 text-green-800', inactive: 'bg-gray-100 text-gray-800', suspended: 'bg-red-100 text-red-800', trial: 'bg-yellow-100 text-yellow-800', pending: 'bg-yellow-100 text-yellow-800', approved: 'bg-blue-100 text-blue-800', completed: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100 text-gray-800');
  const getPlanBadge = (p) => ({ free: 'bg-gray-100 text-gray-800', pro: 'bg-blue-100 text-blue-800', enterprise: 'bg-purple-100 text-purple-800', ultimate: 'bg-yellow-100 text-yellow-800' }[p] || 'bg-gray-100 text-gray-800');
  const getPriorityBadge = (p) => ({ low: 'bg-gray-100 text-gray-800', normal: 'bg-blue-100 text-blue-800', high: 'bg-orange-100 text-orange-800', urgent: 'bg-red-100 text-red-800' }[p] || 'bg-gray-100 text-gray-800');
  const getSyncBadge = (s) => ({ synced: 'bg-green-100 text-green-800', syncing: 'bg-blue-100 text-blue-800', pending: 'bg-yellow-100 text-yellow-800', error: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100 text-gray-800');

  const totalStudents = branches.reduce((sum, b) => sum + (parseInt(b.total_students) || 0), 0);
  const totalTeachers = branches.reduce((sum, b) => sum + (parseInt(b.total_teachers) || 0), 0);
  const totalRevenue = branchRevenue.reduce((sum, r) => sum + (parseFloat(r.revenue) || 0), 0);
  const activeBranches = branches.filter(b => b.status === 'active').length;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><Building className="text-blue-600" size={32} />Multi-School Management</h1>
          <p className="text-gray-600 mt-1">Centralized management for all school branches</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportToPDF('branches')} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"><Download size={16} /> PDF</button>
          <button onClick={() => exportToCSV('branches')} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"><FileSpreadsheet size={16} /> CSV</button>
          <button onClick={() => openModal('compare')} className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"><BarChart3 size={16} /> Compare</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500"><p className="text-gray-600 text-xs">Total Branches</p><p className="text-2xl font-bold text-blue-600">{branches.length}</p><p className="text-xs text-gray-500">{activeBranches} active</p></div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500"><p className="text-gray-600 text-xs">Total Students</p><p className="text-2xl font-bold text-green-600">{totalStudents}</p></div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500"><p className="text-gray-600 text-xs">Total Teachers</p><p className="text-2xl font-bold text-purple-600">{totalTeachers}</p></div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500"><p className="text-gray-600 text-xs">Pending Transfers</p><p className="text-2xl font-bold text-orange-600">{transfers.length}</p></div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-cyan-500"><p className="text-gray-600 text-xs">Shared Resources</p><p className="text-2xl font-bold text-cyan-600">{resources.length}</p></div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-emerald-500"><p className="text-gray-600 text-xs">Total Revenue</p><p className="text-2xl font-bold text-emerald-600">GHS {totalRevenue.toLocaleString()}</p></div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-indigo-500"><p className="text-gray-600 text-xs">Communications</p><p className="text-2xl font-bold text-indigo-600">{communications.length}</p></div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-pink-500"><p className="text-gray-600 text-xs">Audit Logs</p><p className="text-2xl font-bold text-pink-600">{auditLogs.length}</p></div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search branches..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="trial">Trial</option>
          </select>
          <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
            <option value="ultimate">Ultimate</option>
          </select>
          <button onClick={() => { setSearchTerm(''); setStatusFilter(''); setPlanFilter(''); }} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <div className="flex flex-wrap">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: PieChart },
              { id: 'branches', label: 'Branches', icon: Building },
              { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
              { id: 'resources', label: 'Resources', icon: Share2 },
              { id: 'communications', label: 'Comms', icon: MessageSquare },
              { id: 'reports', label: 'Reports', icon: BarChart3 },
              { id: 'revenue', label: 'Revenue', icon: DollarSign },
              { id: 'sync', label: 'Sync', icon: Database },
              { id: 'audit', label: 'Audit', icon: History }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-2 font-medium flex items-center gap-1 text-xs ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}><tab.icon size={14} /> {tab.label}</button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2"><PieChart className="text-blue-600" /> Multi-School Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Branches by Status */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Branches by Status</h4>
                  <div className="space-y-2">
                    {['active', 'inactive', 'suspended', 'trial'].map(status => (
                      <div key={status} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${status === 'active' ? 'bg-green-500' : status === 'inactive' ? 'bg-gray-500' : status === 'suspended' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                        <span className="flex-1 text-sm capitalize">{status}</span>
                        <span className="font-medium">{branches.filter(b => b.status === status).length}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Branches by Plan */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Branches by Plan</h4>
                  <div className="space-y-2">
                    {['free', 'pro', 'enterprise', 'ultimate'].map(plan => (
                      <div key={plan} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${plan === 'free' ? 'bg-gray-500' : plan === 'pro' ? 'bg-blue-500' : plan === 'enterprise' ? 'bg-purple-500' : 'bg-yellow-500'}`}></div>
                        <span className="flex-1 text-sm capitalize">{plan}</span>
                        <span className="font-medium">{branches.filter(b => b.subscription_plan === plan).length}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Top Branches by Students */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Top Branches by Students</h4>
                  <div className="space-y-2">
                    {[...branches].sort((a, b) => (b.total_students || 0) - (a.total_students || 0)).slice(0, 5).map(b => (
                      <div key={b.id} className="flex items-center gap-2">
                        <span className="flex-1 text-sm truncate">{b.branch_name}</span>
                        <span className="font-medium text-blue-600">{b.total_students || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Revenue Overview */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-4 flex items-center gap-2"><DollarSign className="text-green-600" /> Revenue by Branch</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {branchRevenue.slice(0, 8).map(r => (
                    <div key={r.branch_id} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium truncate">{r.branch_name}</p>
                      <p className="text-lg font-bold text-green-600">GHS {(r.revenue || 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Net: GHS {((r.revenue || 0) - (r.expenses || 0)).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BRANCHES TAB */}
          {activeTab === 'branches' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold">School Branches ({filteredBranches.length})</h3><button onClick={() => openModal('branch')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Add Branch</button></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredBranches.map(b => (
                  <div key={b.id} className={`border rounded-lg p-4 hover:shadow-lg transition-shadow ${b.is_headquarters ? 'border-yellow-400 bg-yellow-50' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {b.is_headquarters && <Crown className="text-yellow-600" size={20} />}
                        <div><h4 className="font-semibold text-lg">{b.branch_name}</h4><p className="text-xs text-gray-500">{b.branch_code}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(b.status)}`}>{b.status}</span>
                        <span className={`px-2 py-1 rounded text-xs ${getPlanBadge(b.subscription_plan)}`}>{b.subscription_plan}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                      <p className="flex items-center gap-1"><MapPin size={14} /> {b.city || '-'}, {b.country || 'Ghana'}</p>
                      {b.phone && <p className="flex items-center gap-1"><Phone size={14} /> {b.phone}</p>}
                      {b.email && <p className="flex items-center gap-1"><Mail size={14} /> {b.email}</p>}
                      <p className="flex items-center gap-1"><Users size={14} /> {b.total_students || 0} students</p>
                      <p className="flex items-center gap-1"><Users size={14} /> {b.total_teachers || 0} teachers</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedBranch(b); setModalType('view_branch'); setShowModal(true); }} className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 flex items-center justify-center gap-1"><Eye size={14} /> View</button>
                      <button onClick={() => openModal('branch', b)} className="px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200"><Edit2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TRANSFERS TAB */}
          {activeTab === 'transfers' && (
            <div>
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <h3 className="text-xl font-semibold">Inter-Branch Transfers</h3>
                <div className="flex gap-2">
                  <button onClick={() => openModal('bulk_transfer')} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"><Layers size={18} /> Bulk Transfer</button>
                  <button onClick={() => openModal('transfer')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> New Transfer</button>
                </div>
              </div>
              {/* Pending Transfers */}
              <h4 className="font-medium mb-2">Pending Transfers ({transfers.length})</h4>
              {transfers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border rounded-lg mb-6"><ArrowRightLeft size={32} className="mx-auto mb-2 text-gray-300" /><p className="text-sm">No pending transfers</p></div>
              ) : (
                <div className="overflow-x-auto mb-6"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                  <tbody className="divide-y">{transfers.map(t => (<tr key={t.id} className="hover:bg-gray-50"><td className="px-4 py-3 capitalize font-medium">{t.transfer_type}</td><td className="px-4 py-3">{t.from_branch_name}</td><td className="px-4 py-3">{t.to_branch_name}</td><td className="px-4 py-3">{t.transfer_date}</td><td className="px-4 py-3 text-sm max-w-xs truncate">{t.reason || '-'}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${getStatusBadge(t.status)}`}>{t.status}</span></td><td className="px-4 py-3">{t.status === 'pending' && <div className="flex gap-1"><button onClick={() => handleApproveTransfer(t.id)} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">Approve</button><button onClick={() => handleRejectTransfer(t.id)} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Reject</button></div>}</td></tr>))}</tbody>
                </table></div>
              )}
              {/* Transfer History */}
              <h4 className="font-medium mb-2 flex items-center gap-2"><History size={18} /> Transfer History ({transferHistory.length})</h4>
              {transferHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border rounded-lg"><History size={32} className="mx-auto mb-2 text-gray-300" /><p className="text-sm">No transfer history</p></div>
              ) : (
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approved By</th></tr></thead>
                  <tbody className="divide-y">{transferHistory.map(t => (<tr key={t.id} className="hover:bg-gray-50"><td className="px-4 py-3 capitalize">{t.transfer_type}</td><td className="px-4 py-3">{t.from_branch_name}</td><td className="px-4 py-3">{t.to_branch_name}</td><td className="px-4 py-3">{t.transfer_date}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${getStatusBadge(t.status)}`}>{t.status}</span></td><td className="px-4 py-3 text-sm">{t.approved_by_name || '-'}</td></tr>))}</tbody>
                </table></div>
              )}
            </div>
          )}

          {/* RESOURCES TAB */}
          {activeTab === 'resources' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold">Shared Resources</h3><button onClick={() => openModal('resource')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Share Resource</button></div>
              {resources.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Share2 size={48} className="mx-auto mb-4 text-gray-300" /><p>No shared resources</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map(r => (
                    <div key={r.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{r.resource_name}</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs capitalize">{r.resource_type}</span>
                      </div>
                      {r.description && <p className="text-sm text-gray-600 mb-2">{r.description}</p>}
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Owner: {r.owner_branch_name}</p>
                        {r.category && <p>Category: {r.category}</p>}
                        <p>{r.is_public ? '🌐 Public' : '🔒 Private'}</p>
                        <p>Downloads: {r.download_count || 0}</p>
                      </div>
                      {r.file_path && <button className="mt-2 w-full px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 flex items-center justify-center gap-1"><Download size={14} /> Download</button>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COMMUNICATIONS TAB */}
          {activeTab === 'communications' && (
            <div>
              <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                <h3 className="text-xl font-semibold">Branch Communications</h3>
                <div className="flex gap-2">
                  <button onClick={() => openModal('template')} className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"><Copy size={18} /> Templates</button>
                  <button onClick={() => openModal('communication')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Send size={18} /> New Message</button>
                </div>
              </div>
              {/* Templates Section */}
              {commTemplates.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium mb-2">Quick Templates</h4>
                  <div className="flex flex-wrap gap-2">
                    {commTemplates.map(t => (
                      <button key={t.id} onClick={() => { handleUseTemplate(t); openModal('communication'); }} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200">{t.name}</button>
                    ))}
                  </div>
                </div>
              )}
              {communications.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><MessageSquare size={48} className="mx-auto mb-4 text-gray-300" /><p>No communications</p></div>
              ) : (
                <div className="space-y-4">
                  {communications.map(c => (
                    <div key={c.id} className={`border rounded-lg p-4 ${c.priority === 'urgent' ? 'border-red-300 bg-red-50' : c.priority === 'high' ? 'border-orange-300 bg-orange-50' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div><h4 className="font-semibold">{c.subject}</h4><p className="text-xs text-gray-500">From: {c.from_branch_name || 'Headquarters'} • {c.sent_at}</p></div>
                        <div className="flex gap-2"><span className={`px-2 py-1 rounded text-xs ${getPriorityBadge(c.priority)}`}>{c.priority}</span><span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs capitalize">{c.communication_type}</span>{c.read_count !== undefined && <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{c.read_count} read</span>}</div>
                      </div>
                      <p className="text-sm text-gray-700">{c.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold">Consolidated Reports</h3><button onClick={() => openModal('report')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><BarChart3 size={18} /> Generate Report</button></div>
              {reports.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><BarChart3 size={48} className="mx-auto mb-4 text-gray-300" /><p>No reports generated yet</p></div>
              ) : (
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report Name</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Generated</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                  <tbody className="divide-y">{reports.map(r => (<tr key={r.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium">{r.report_name}</td><td className="px-4 py-3 capitalize">{r.report_type}</td><td className="px-4 py-3 text-sm">{r.start_date} to {r.end_date}</td><td className="px-4 py-3 text-sm">{r.generated_at}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${getStatusBadge(r.status)}`}>{r.status}</span></td><td className="px-4 py-3"><button className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 flex items-center gap-1"><Eye size={14} /> View</button></td></tr>))}</tbody>
                </table></div>
              )}
            </div>
          )}

          {/* REVENUE TAB */}
          {activeTab === 'revenue' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2"><DollarSign className="text-green-600" /> Revenue by Branch</h3>
                <button onClick={() => exportToPDF('revenue')} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"><Download size={18} /> Export</button>
              </div>
              {branchRevenue.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><DollarSign size={48} className="mx-auto mb-4 text-gray-300" /><p>No revenue data available</p></div>
              ) : (
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expenses</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue/Student</th></tr></thead>
                  <tbody className="divide-y">{branchRevenue.map(r => (<tr key={r.branch_id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium">{r.branch_name}</td><td className="px-4 py-3 text-green-600 font-medium">GHS {(r.revenue || 0).toLocaleString()}</td><td className="px-4 py-3 text-red-600">GHS {(r.expenses || 0).toLocaleString()}</td><td className="px-4 py-3 font-bold">{(r.revenue - r.expenses) >= 0 ? <span className="text-green-600">GHS {((r.revenue || 0) - (r.expenses || 0)).toLocaleString()}</span> : <span className="text-red-600">-GHS {Math.abs((r.revenue || 0) - (r.expenses || 0)).toLocaleString()}</span>}</td><td className="px-4 py-3">{r.total_students || 0}</td><td className="px-4 py-3">GHS {r.total_students > 0 ? Math.round((r.revenue || 0) / r.total_students).toLocaleString() : 0}</td></tr>))}</tbody>
                </table></div>
              )}
            </div>
          )}

          {/* SYNC TAB */}
          {activeTab === 'sync' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2"><Database className="text-indigo-600" /> Data Sync Status</h3>
                <button onClick={fetchSyncStatus} className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"><RefreshCw size={18} /> Refresh</button>
              </div>
              {syncStatus.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Database size={48} className="mx-auto mb-4 text-gray-300" /><p>No sync data available</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {syncStatus.map(s => (
                    <div key={s.branch_id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold">{s.branch_name}</h4>
                        <span className={`px-2 py-1 rounded text-xs ${getSyncBadge(s.status)}`}>{s.status}</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Last Sync: {s.last_sync || 'Never'}</p>
                        <p>Records: {s.records_synced || 0}</p>
                        {s.error && <p className="text-red-600">Error: {s.error}</p>}
                      </div>
                      <button onClick={() => handleSyncBranch(s.branch_id)} className="mt-3 w-full px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm hover:bg-indigo-200 flex items-center justify-center gap-1"><RefreshCw size={14} /> Sync Now</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AUDIT TAB */}
          {activeTab === 'audit' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold flex items-center gap-2"><History className="text-pink-600" /> Audit Trail</h3>
                <button onClick={fetchAuditLogs} className="bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"><RefreshCw size={18} /> Refresh</button>
              </div>
              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><History size={48} className="mx-auto mb-4 text-gray-300" /><p>No audit logs available</p></div>
              ) : (
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th></tr></thead>
                  <tbody className="divide-y">{auditLogs.map(l => (<tr key={l.id} className="hover:bg-gray-50"><td className="px-4 py-3 text-sm">{l.created_at}</td><td className="px-4 py-3">{l.branch_name || 'All'}</td><td className="px-4 py-3">{l.user_name}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${l.action === 'create' ? 'bg-green-100 text-green-800' : l.action === 'update' ? 'bg-blue-100 text-blue-800' : l.action === 'delete' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{l.action}</span></td><td className="px-4 py-3 capitalize">{l.entity_type}</td><td className="px-4 py-3 text-sm max-w-xs truncate">{l.details || '-'}</td></tr>))}</tbody>
                </table></div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center"><h2 className="text-xl font-bold">{modalType === 'branch' && (editingItem ? 'Edit Branch' : 'Add Branch')}{modalType === 'transfer' && 'New Transfer Request'}{modalType === 'bulk_transfer' && 'Bulk Transfer'}{modalType === 'resource' && 'Share Resource'}{modalType === 'communication' && 'Send Communication'}{modalType === 'template' && 'Create Template'}{modalType === 'report' && 'Generate Report'}{modalType === 'compare' && 'Compare Branches'}{modalType === 'view_branch' && 'Branch Details'}</h2><button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button></div>
            <div className="p-6">
              {/* Branch Form */}
              {modalType === 'branch' && (
                <form onSubmit={handleSaveBranch} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Branch Name *</label><input type="text" value={branchForm.branch_name} onChange={(e) => setBranchForm({...branchForm, branch_name: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div>
                    <div><label className="block text-sm font-medium mb-1">Branch Code *</label><input type="text" value={branchForm.branch_code} onChange={(e) => setBranchForm({...branchForm, branch_code: e.target.value})} className="w-full border rounded-lg px-3 py-2" required placeholder="e.g., EAST-001" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Type</label><select value={branchForm.branch_type} onChange={(e) => setBranchForm({...branchForm, branch_type: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="main">Main</option><option value="branch">Branch</option><option value="franchise">Franchise</option></select></div>
                    <div><label className="block text-sm font-medium mb-1">Status</label><select value={branchForm.status} onChange={(e) => setBranchForm({...branchForm, status: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="active">Active</option><option value="inactive">Inactive</option><option value="trial">Trial</option></select></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Address</label><input type="text" value={branchForm.address} onChange={(e) => setBranchForm({...branchForm, address: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium mb-1">City</label><input type="text" value={branchForm.city} onChange={(e) => setBranchForm({...branchForm, city: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">State</label><input type="text" value={branchForm.state} onChange={(e) => setBranchForm({...branchForm, state: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">Country</label><input type="text" value={branchForm.country} onChange={(e) => setBranchForm({...branchForm, country: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Phone</label><input type="text" value={branchForm.phone} onChange={(e) => setBranchForm({...branchForm, phone: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={branchForm.email} onChange={(e) => setBranchForm({...branchForm, email: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Plan</label><select value={branchForm.subscription_plan} onChange={(e) => setBranchForm({...branchForm, subscription_plan: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="free">Free</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option><option value="ultimate">Ultimate</option></select></div>
                    <div><label className="block text-sm font-medium mb-1">Max Students</label><input type="number" value={branchForm.max_students} onChange={(e) => setBranchForm({...branchForm, max_students: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">Max Staff</label><input type="number" value={branchForm.max_staff} onChange={(e) => setBranchForm({...branchForm, max_staff: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Save</button></div>
                </form>
              )}

              {/* View Branch */}
              {modalType === 'view_branch' && selectedBranch && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">{selectedBranch.is_headquarters && <Crown className="text-yellow-600" size={24} />}<div><h3 className="text-xl font-bold">{selectedBranch.branch_name}</h3><p className="text-gray-500">{selectedBranch.branch_code}</p></div></div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500">Type</p><p className="font-medium capitalize">{selectedBranch.branch_type}</p></div>
                    <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500">Status</p><p className="font-medium capitalize">{selectedBranch.status}</p></div>
                    <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500">Location</p><p className="font-medium">{selectedBranch.city}, {selectedBranch.country}</p></div>
                    <div className="bg-gray-50 p-3 rounded-lg"><p className="text-gray-500">Plan</p><p className="font-medium capitalize">{selectedBranch.subscription_plan}</p></div>
                    <div className="bg-blue-50 p-3 rounded-lg"><p className="text-blue-600">Students</p><p className="text-2xl font-bold text-blue-700">{selectedBranch.total_students || 0}</p></div>
                    <div className="bg-green-50 p-3 rounded-lg"><p className="text-green-600">Teachers</p><p className="text-2xl font-bold text-green-700">{selectedBranch.total_teachers || 0}</p></div>
                  </div>
                  {(selectedBranch.phone || selectedBranch.email) && <div className="border-t pt-4"><h4 className="font-medium mb-2">Contact</h4><div className="text-sm text-gray-600">{selectedBranch.phone && <p className="flex items-center gap-2"><Phone size={14} /> {selectedBranch.phone}</p>}{selectedBranch.email && <p className="flex items-center gap-2"><Mail size={14} /> {selectedBranch.email}</p>}</div></div>}
                  <div className="flex gap-3 pt-4"><button onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button></div>
                </div>
              )}

              {/* Transfer Form */}
              {modalType === 'transfer' && (
                <form onSubmit={handleSaveTransfer} className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Transfer Type *</label><select value={transferForm.transfer_type} onChange={(e) => setTransferForm({...transferForm, transfer_type: e.target.value, entity_id: ''})} className="w-full border rounded-lg px-3 py-2"><option value="student">Student</option><option value="staff">Staff</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Select {transferForm.transfer_type === 'student' ? 'Student' : 'Staff'} *</label><select value={transferForm.entity_id} onChange={(e) => setTransferForm({...transferForm, entity_id: e.target.value})} className="w-full border rounded-lg px-3 py-2" required><option value="">Select...</option>{transferForm.transfer_type === 'student' ? students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_id})</option>) : teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">From Branch *</label><select value={transferForm.from_branch_id} onChange={(e) => setTransferForm({...transferForm, from_branch_id: e.target.value})} className="w-full border rounded-lg px-3 py-2" required><option value="">Select...</option>{branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}</select></div>
                    <div><label className="block text-sm font-medium mb-1">To Branch *</label><select value={transferForm.to_branch_id} onChange={(e) => setTransferForm({...transferForm, to_branch_id: e.target.value})} className="w-full border rounded-lg px-3 py-2" required><option value="">Select...</option>{branches.filter(b => b.id != transferForm.from_branch_id).map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}</select></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Transfer Date *</label><input type="date" value={transferForm.transfer_date} onChange={(e) => setTransferForm({...transferForm, transfer_date: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div>
                  <div><label className="block text-sm font-medium mb-1">Reason</label><textarea value={transferForm.reason} onChange={(e) => setTransferForm({...transferForm, reason: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Submit Request</button></div>
                </form>
              )}

              {/* Resource Form */}
              {modalType === 'resource' && (
                <form onSubmit={handleSaveResource} className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Resource Name *</label><input type="text" value={resourceForm.resource_name} onChange={(e) => setResourceForm({...resourceForm, resource_name: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Type</label><select value={resourceForm.resource_type} onChange={(e) => setResourceForm({...resourceForm, resource_type: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="curriculum">Curriculum</option><option value="assessment">Assessment</option><option value="document">Document</option><option value="template">Template</option><option value="policy">Policy</option></select></div>
                    <div><label className="block text-sm font-medium mb-1">Category</label><input type="text" value={resourceForm.category} onChange={(e) => setResourceForm({...resourceForm, category: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={resourceForm.description} onChange={(e) => setResourceForm({...resourceForm, description: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
                  <div><label className="block text-sm font-medium mb-1">Owner Branch *</label><select value={resourceForm.owner_branch_id} onChange={(e) => setResourceForm({...resourceForm, owner_branch_id: e.target.value})} className="w-full border rounded-lg px-3 py-2" required><option value="">Select...</option>{branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">File Path</label><input type="text" value={resourceForm.file_path} onChange={(e) => setResourceForm({...resourceForm, file_path: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="/uploads/resources/file.pdf" /></div>
                  <div className="flex items-center gap-2"><input type="checkbox" id="is_public" checked={resourceForm.is_public} onChange={(e) => setResourceForm({...resourceForm, is_public: e.target.checked})} /><label htmlFor="is_public" className="text-sm">Make public to all branches</label></div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Share</button></div>
                </form>
              )}

              {/* Communication Form */}
              {modalType === 'communication' && (
                <form onSubmit={handleSendCommunication} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Type</label><select value={commForm.communication_type} onChange={(e) => setCommForm({...commForm, communication_type: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="announcement">Announcement</option><option value="notice">Notice</option><option value="alert">Alert</option><option value="message">Message</option></select></div>
                    <div><label className="block text-sm font-medium mb-1">Priority</label><select value={commForm.priority} onChange={(e) => setCommForm({...commForm, priority: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Subject *</label><input type="text" value={commForm.subject} onChange={(e) => setCommForm({...commForm, subject: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div>
                  <div><label className="block text-sm font-medium mb-1">Message *</label><textarea value={commForm.message} onChange={(e) => setCommForm({...commForm, message: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows={4} required /></div>
                  <div><label className="block text-sm font-medium mb-1">From Branch</label><select value={commForm.from_branch_id} onChange={(e) => setCommForm({...commForm, from_branch_id: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="">Headquarters</option>{branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}</select></div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"><Send size={18} /> Send</button></div>
                </form>
              )}

              {/* Report Form */}
              {modalType === 'report' && (
                <form onSubmit={handleGenerateReport} className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Report Type *</label><select value={reportForm.report_type} onChange={(e) => setReportForm({...reportForm, report_type: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="financial">Financial</option><option value="academic">Academic</option><option value="attendance">Attendance</option><option value="enrollment">Enrollment</option></select></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Start Date *</label><input type="date" value={reportForm.start_date} onChange={(e) => setReportForm({...reportForm, start_date: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div>
                    <div><label className="block text-sm font-medium mb-1">End Date *</label><input type="date" value={reportForm.end_date} onChange={(e) => setReportForm({...reportForm, end_date: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Select Branches</label><div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">{branches.map(b => (<label key={b.id} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={reportForm.branches.includes(b.id)} onChange={(e) => { if (e.target.checked) setReportForm({...reportForm, branches: [...reportForm.branches, b.id]}); else setReportForm({...reportForm, branches: reportForm.branches.filter(id => id !== b.id)}); }} /><span className="text-sm">{b.branch_name}</span></label>))}</div></div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"><BarChart3 size={18} /> Generate</button></div>
                </form>
              )}

              {/* Bulk Transfer Form */}
              {modalType === 'bulk_transfer' && (
                <form onSubmit={handleBulkTransfer} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">From Branch *</label><select value={transferForm.from_branch_id} onChange={(e) => setTransferForm({...transferForm, from_branch_id: e.target.value})} className="w-full border rounded-lg px-3 py-2" required><option value="">Select...</option>{branches.map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}</select></div>
                    <div><label className="block text-sm font-medium mb-1">To Branch *</label><select value={transferForm.to_branch_id} onChange={(e) => setTransferForm({...transferForm, to_branch_id: e.target.value})} className="w-full border rounded-lg px-3 py-2" required><option value="">Select...</option>{branches.filter(b => b.id != transferForm.from_branch_id).map(b => <option key={b.id} value={b.id}>{b.branch_name}</option>)}</select></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Transfer Date *</label><input type="date" value={transferForm.transfer_date} onChange={(e) => setTransferForm({...transferForm, transfer_date: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div>
                  <div><label className="block text-sm font-medium mb-1">Select Students ({bulkTransferStudents.length} selected)</label><div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">{students.slice(0, 100).map(s => (<label key={s.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 rounded"><input type="checkbox" checked={bulkTransferStudents.includes(s.id)} onChange={(e) => { if (e.target.checked) setBulkTransferStudents([...bulkTransferStudents, s.id]); else setBulkTransferStudents(bulkTransferStudents.filter(id => id !== s.id)); }} /><span className="text-sm">{s.first_name} {s.last_name} ({s.student_id})</span></label>))}</div></div>
                  <div><label className="block text-sm font-medium mb-1">Reason</label><textarea value={transferForm.reason} onChange={(e) => setTransferForm({...transferForm, reason: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2"><Layers size={18} /> Transfer {bulkTransferStudents.length} Students</button></div>
                </form>
              )}

              {/* Template Form */}
              {modalType === 'template' && (
                <form onSubmit={handleSaveTemplate} className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Template Name *</label><input type="text" value={templateForm.name} onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})} className="w-full border rounded-lg px-3 py-2" required placeholder="e.g., Fee Reminder" /></div>
                  <div><label className="block text-sm font-medium mb-1">Type</label><select value={templateForm.type} onChange={(e) => setTemplateForm({...templateForm, type: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="announcement">Announcement</option><option value="notice">Notice</option><option value="alert">Alert</option><option value="message">Message</option></select></div>
                  <div><label className="block text-sm font-medium mb-1">Subject *</label><input type="text" value={templateForm.subject} onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div>
                  <div><label className="block text-sm font-medium mb-1">Message *</label><textarea value={templateForm.message} onChange={(e) => setTemplateForm({...templateForm, message: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows={4} required /></div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Save Template</button></div>
                </form>
              )}

              {/* Compare Branches Modal */}
              {modalType === 'compare' && (
                <div className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Select Branches to Compare (max 4)</label><div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">{branches.map(b => (<label key={b.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 rounded"><input type="checkbox" checked={compareBranches.includes(b.id)} disabled={!compareBranches.includes(b.id) && compareBranches.length >= 4} onChange={(e) => { if (e.target.checked) setCompareBranches([...compareBranches, b.id]); else setCompareBranches(compareBranches.filter(id => id !== b.id)); }} /><span className="text-sm">{b.branch_name}</span></label>))}</div></div>
                  {compareBranches.length >= 2 && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Metric</th>{compareBranches.map(id => { const b = branches.find(br => br.id === id); return <th key={id} className="px-3 py-2 text-center">{b?.branch_name}</th>; })}</tr></thead>
                        <tbody className="divide-y">
                          <tr><td className="px-3 py-2 font-medium">Students</td>{compareBranches.map(id => { const b = branches.find(br => br.id === id); return <td key={id} className="px-3 py-2 text-center">{b?.total_students || 0}</td>; })}</tr>
                          <tr><td className="px-3 py-2 font-medium">Teachers</td>{compareBranches.map(id => { const b = branches.find(br => br.id === id); return <td key={id} className="px-3 py-2 text-center">{b?.total_teachers || 0}</td>; })}</tr>
                          <tr><td className="px-3 py-2 font-medium">Plan</td>{compareBranches.map(id => { const b = branches.find(br => br.id === id); return <td key={id} className="px-3 py-2 text-center capitalize">{b?.subscription_plan}</td>; })}</tr>
                          <tr><td className="px-3 py-2 font-medium">Status</td>{compareBranches.map(id => { const b = branches.find(br => br.id === id); return <td key={id} className="px-3 py-2 text-center capitalize">{b?.status}</td>; })}</tr>
                          <tr><td className="px-3 py-2 font-medium">Revenue</td>{compareBranches.map(id => { const r = branchRevenue.find(rv => rv.branch_id === id); return <td key={id} className="px-3 py-2 text-center text-green-600">GHS {(r?.revenue || 0).toLocaleString()}</td>; })}</tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="flex gap-3 pt-4"><button onClick={closeModal} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Close</button></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
