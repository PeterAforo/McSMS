import { useState, useEffect } from 'react';
import { 
  MessageSquare, Send, Users, FileText, Settings, History,
  Phone, User, Search, CheckCircle, XCircle, Clock, Loader2,
  Plus, Trash2, RefreshCw, Download, Calendar, BarChart3,
  TrendingUp, UserPlus, DollarSign, GraduationCap, X, Save,
  FileSpreadsheet, Filter, AlertCircle, CreditCard, Zap
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SMSMessaging() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('send');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, delivered: 0, failed: 0, today: 0, credits: 0 });
  const [recipients, setRecipients] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [contactGroups, setContactGroups] = useState([]);
  const [scheduledMessages, setScheduledMessages] = useState([]);
  
  // Filters
  const [historyFilter, setHistoryFilter] = useState({ status: '', dateFrom: '', dateTo: '', search: '' });
  
  // Single message form
  const [singleMessage, setSingleMessage] = useState({ phone: '', recipient_name: '', message: '' });
  
  // Bulk message form
  const [bulkMessage, setBulkMessage] = useState({ recipient_type: 'all_parents', message: '', template_name: '' });
  
  // Template form
  const [newTemplate, setNewTemplate] = useState({ name: '', category: 'general', message_template: '' });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({ recipient_type: 'all_parents', message: '', scheduled_date: '', scheduled_time: '', repeat: 'none' });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // SMS Settings
  const [smsSettings, setSmsSettings] = useState({ provider: 'hubtel', api_key: '', api_secret: '', sender_id: '' });
  const [savingSettings, setSavingSettings] = useState(false);

  const API = `${API_BASE_URL}/sms.php`;

  useEffect(() => {
    fetchTemplates();
    fetchStats();
    fetchHistory();
    fetchSettings();
    fetchClasses();
    fetchScheduledMessages();
    fetchContactGroups();
  }, []);

  const fetchTemplates = async () => { try { const r = await axios.get(`${API}?action=templates`); setTemplates(r.data.templates || []); } catch (e) { console.error(e); } };
  const fetchStats = async () => { try { const r = await axios.get(`${API}?action=stats`); setStats(r.data.stats || {}); } catch (e) { console.error(e); } };
  const fetchHistory = async () => { try { const r = await axios.get(`${API}?action=history&limit=100`); setHistory(r.data.messages || []); } catch (e) { console.error(e); } };
  const fetchSettings = async () => { try { const r = await axios.get(`${API}?action=settings`); if (r.data.settings) setSmsSettings(r.data.settings); } catch (e) { console.error(e); } };
  const fetchClasses = async () => { try { const r = await axios.get(`${API_BASE_URL}/classes.php`); setClasses(r.data.classes || r.data || []); } catch (e) { console.error(e); } };
  const fetchScheduledMessages = async () => { try { const r = await axios.get(`${API}?action=scheduled`); setScheduledMessages(r.data.scheduled || []); } catch (e) { console.error(e); } };
  const fetchContactGroups = async () => { try { const r = await axios.get(`${API}?action=groups`); setContactGroups(r.data.groups || []); } catch (e) { console.error(e); } };

  const fetchRecipients = async (type) => {
    try {
      setLoading(true);
      let endpoint = type === 'all_parents' ? `${API_BASE_URL}/parents.php` : type === 'all_teachers' ? `${API_BASE_URL}/teachers.php` : `${API_BASE_URL}/parents.php?has_students=true`;
      const r = await axios.get(endpoint);
      const data = r.data.parents || r.data.teachers || [];
      setRecipients(data.map(p => ({ id: p.id, name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name, phone: p.phone || p.guardian_phone, type: type.includes('parent') ? 'parent' : 'teacher' })));
    } catch (e) { console.error(e); setRecipients([]); }
    finally { setLoading(false); }
  };

  const fetchClassParents = async (classId) => {
    try {
      setLoading(true);
      const r = await axios.get(`${API_BASE_URL}/parents.php?class_id=${classId}`);
      const data = r.data.parents || [];
      setRecipients(data.map(p => ({ id: p.id, name: `${p.first_name || ''} ${p.last_name || ''}`.trim(), phone: p.phone || p.guardian_phone, type: 'parent', student_name: p.student_name })));
    } catch (e) { console.error(e); setRecipients([]); }
    finally { setLoading(false); }
  };

  const sendSingleMessage = async () => {
    if (!singleMessage.phone || !singleMessage.message) { alert('Enter phone and message'); return; }
    try {
      setLoading(true);
      const r = await axios.post(`${API}?action=send`, { ...singleMessage, sent_by: user?.id });
      if (r.data.success) {
        alert('✅ SMS sent successfully!');
        setSingleMessage({ phone: '', recipient_name: '', message: '' });
        fetchStats(); fetchHistory();
      } else { alert('Failed: ' + (r.data.error || 'Unknown error')); }
    } catch (e) { alert('Failed to send SMS'); }
    finally { setLoading(false); }
  };

  const sendBulkMessages = async () => {
    if (recipients.length === 0 || !bulkMessage.message) { alert('Select recipients and enter message'); return; }
    try {
      setLoading(true);
      const r = await axios.post(`${API}?action=send_bulk`, {
        recipients: recipients.filter(p => p.phone).map(p => ({ phone: p.phone, name: p.name, type: p.type })),
        message: bulkMessage.message,
        template_name: bulkMessage.template_name,
        sent_by: user?.id
      });
      if (r.data.success) {
        alert(`✅ ${r.data.sent_count} SMS messages sent!`);
        fetchStats(); fetchHistory();
      }
    } catch (e) { alert('Failed to send'); }
    finally { setLoading(false); }
  };

  const saveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.message_template) { alert('Enter name and message'); return; }
    try {
      setLoading(true);
      await axios.post(`${API}?action=save_template`, newTemplate);
      alert('✅ Template saved!');
      setShowTemplateModal(false);
      setNewTemplate({ name: '', category: 'general', message_template: '' });
      fetchTemplates();
    } catch (e) { alert('Failed'); }
    finally { setLoading(false); }
  };

  const saveSettings = async () => {
    try {
      setSavingSettings(true);
      await axios.post(`${API}?action=save_settings`, smsSettings);
      alert('✅ SMS settings saved!');
    } catch (e) { alert('Failed'); }
    finally { setSavingSettings(false); }
  };

  const handleScheduleMessage = async (e) => {
    e.preventDefault();
    if (!scheduleForm.message || !scheduleForm.scheduled_date || !scheduleForm.scheduled_time) { alert('Fill all fields'); return; }
    try {
      await axios.post(`${API}?action=schedule`, { ...scheduleForm, scheduled_at: `${scheduleForm.scheduled_date} ${scheduleForm.scheduled_time}`, created_by: user?.id });
      alert('✅ SMS scheduled!');
      setShowScheduleModal(false);
      setScheduleForm({ recipient_type: 'all_parents', message: '', scheduled_date: '', scheduled_time: '', repeat: 'none' });
      fetchScheduledMessages();
    } catch (e) { alert('Failed'); }
  };

  const cancelScheduledMessage = async (id) => {
    if (!confirm('Cancel this scheduled SMS?')) return;
    try { await axios.delete(`${API}?action=schedule&id=${id}`); fetchScheduledMessages(); } catch (e) { alert('Failed'); }
  };

  const retryFailedMessage = async (msg) => {
    try {
      setLoading(true);
      await axios.post(`${API}?action=retry`, { message_id: msg.id });
      alert('✅ SMS resent!');
      fetchHistory(); fetchStats();
    } catch (e) { alert('Failed'); }
    finally { setLoading(false); }
  };

  const applyTemplate = (template) => {
    if (activeTab === 'send') setSingleMessage(prev => ({ ...prev, message: template.message_template }));
    else if (activeTab === 'bulk') setBulkMessage(prev => ({ ...prev, message: template.message_template, template_name: template.name }));
  };

  // Filtered history
  const filteredHistory = history.filter(msg => {
    const matchesStatus = !historyFilter.status || msg.status === historyFilter.status;
    const matchesSearch = !historyFilter.search || msg.recipient_name?.toLowerCase().includes(historyFilter.search.toLowerCase()) || msg.phone?.includes(historyFilter.search);
    const matchesDateFrom = !historyFilter.dateFrom || new Date(msg.sent_at) >= new Date(historyFilter.dateFrom);
    const matchesDateTo = !historyFilter.dateTo || new Date(msg.sent_at) <= new Date(historyFilter.dateTo + 'T23:59:59');
    return matchesStatus && matchesSearch && matchesDateFrom && matchesDateTo;
  });

  // Export functions
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('SMS Message History', 14, 22);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, { startY: 36, head: [['Date', 'Recipient', 'Phone', 'Status', 'Message']], body: filteredHistory.map(m => [m.sent_at?.split(' ')[0] || '-', m.recipient_name || '-', m.phone || '-', m.status || '-', (m.message || '').substring(0, 40)]), styles: { fontSize: 8 } });
    doc.save(`sms_history_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const csv = 'Date,Recipient,Phone,Status,Message\n' + filteredHistory.map(m => `"${m.sent_at || ''}","${m.recipient_name || ''}","${m.phone || ''}","${m.status || ''}","${(m.message || '').replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `sms_history_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'sent': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><MessageSquare className="w-7 h-7 text-blue-600" /> SMS Messaging</h1>
          <p className="text-gray-600 mt-1">Send SMS notifications to parents and staff</p>
        </div>
        <button onClick={() => { fetchStats(); fetchHistory(); }} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white"><MessageSquare className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Total Sent</p><p className="text-2xl font-bold">{stats.total || 0}</p></div>
        <div className="card p-4 bg-gradient-to-br from-green-500 to-green-600 text-white"><CheckCircle className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Delivered</p><p className="text-2xl font-bold">{stats.delivered || 0}</p></div>
        <div className="card p-4 bg-gradient-to-br from-red-500 to-red-600 text-white"><XCircle className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Failed</p><p className="text-2xl font-bold">{stats.failed || 0}</p></div>
        <div className="card p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white"><Clock className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Today</p><p className="text-2xl font-bold">{stats.today || 0}</p></div>
        <div className="card p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white"><Calendar className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Scheduled</p><p className="text-2xl font-bold">{scheduledMessages.length}</p></div>
        <div className="card p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"><Users className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Groups</p><p className="text-2xl font-bold">{contactGroups.length}</p></div>
        <div className="card p-4 bg-gradient-to-br from-teal-500 to-teal-600 text-white"><FileText className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Templates</p><p className="text-2xl font-bold">{templates.length}</p></div>
        <div className="card p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white"><CreditCard className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">SMS Credits</p><p className="text-2xl font-bold">{stats.credits || 0}</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'send', label: 'Send', icon: Send },
          { id: 'bulk', label: 'Bulk', icon: Users },
          { id: 'scheduled', label: 'Scheduled', icon: Calendar },
          { id: 'templates', label: 'Templates', icon: FileText },
          { id: 'history', label: 'History', icon: History },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-2 rounded-md font-medium flex items-center gap-1 text-sm transition-colors ${activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'hover:bg-gray-200'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Send Single */}
          {activeTab === 'send' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Send className="w-5 h-5 text-blue-600" /> Send Single SMS</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-2"><Phone className="w-4 h-4 inline mr-1" /> Phone *</label><input type="tel" value={singleMessage.phone} onChange={(e) => setSingleMessage({...singleMessage, phone: e.target.value})} className="input" placeholder="0241234567" /></div>
                  <div><label className="block text-sm font-medium mb-2"><User className="w-4 h-4 inline mr-1" /> Name</label><input type="text" value={singleMessage.recipient_name} onChange={(e) => setSingleMessage({...singleMessage, recipient_name: e.target.value})} className="input" placeholder="Recipient Name" /></div>
                </div>
                <div><label className="block text-sm font-medium mb-2">Message * ({singleMessage.message.length}/160)</label><textarea value={singleMessage.message} onChange={(e) => setSingleMessage({...singleMessage, message: e.target.value})} className="input" rows="4" placeholder="Type your message..." maxLength={320} /></div>
                <button onClick={sendSingleMessage} disabled={loading} className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send SMS</button>
              </div>
            </div>
          )}

          {/* Bulk */}
          {activeTab === 'bulk' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> Send Bulk SMS</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Recipients</label>
                    <select value={bulkMessage.recipient_type} onChange={(e) => { setBulkMessage({...bulkMessage, recipient_type: e.target.value}); fetchRecipients(e.target.value); }} className="input">
                      <option value="">Choose group</option>
                      <option value="all_parents">All Parents</option>
                      <option value="all_teachers">All Teachers</option>
                      <option value="class_parents">Parents with Students</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Or Select Class</label>
                    <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); if (e.target.value) fetchClassParents(e.target.value); }} className="input">
                      <option value="">-- Select Class --</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.class_name || c.name}</option>)}
                    </select>
                  </div>
                </div>
                {recipients.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg"><p className="text-sm font-medium text-blue-700">{recipients.length} recipients selected</p></div>
                )}
                <div><label className="block text-sm font-medium mb-2">Message * ({bulkMessage.message.length}/160)</label><textarea value={bulkMessage.message} onChange={(e) => setBulkMessage({...bulkMessage, message: e.target.value})} className="input" rows="4" placeholder="Use {name} for personalization" maxLength={320} /></div>
                <button onClick={sendBulkMessages} disabled={loading || recipients.length === 0} className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send to {recipients.length} Recipients</button>
              </div>
            </div>
          )}

          {/* Scheduled */}
          {activeTab === 'scheduled' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-orange-600" /> Scheduled SMS</h2>
                <button onClick={() => setShowScheduleModal(true)} className="btn btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Schedule</button>
              </div>
              {scheduledMessages.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No scheduled messages</p></div>
              ) : (
                <div className="space-y-3">
                  {scheduledMessages.map(s => (
                    <div key={s.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs ${s.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{s.status}</span>
                            <span className="text-sm text-gray-500">{s.recipient_type}</span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">{s.message}</p>
                          <p className="text-xs text-gray-500 mt-1"><Clock className="w-3 h-3 inline" /> {s.scheduled_at}</p>
                        </div>
                        {s.status === 'pending' && <button onClick={() => cancelScheduledMessage(s.id)} className="text-red-600 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Templates */}
          {activeTab === 'templates' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> SMS Templates</h2>
                <button onClick={() => setShowTemplateModal(true)} className="btn btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Template</button>
              </div>
              {templates.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No templates yet</p>
              ) : (
                <div className="space-y-3">
                  {templates.map(t => (
                    <div key={t.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1"><h3 className="font-medium">{t.name}</h3><span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{t.category}</span></div>
                          <p className="text-sm text-gray-600 line-clamp-2">{t.message_template}</p>
                        </div>
                        <button onClick={() => applyTemplate(t)} className="btn bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm">Use</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* History */}
          {activeTab === 'history' && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><History className="w-5 h-5 text-blue-600" /> SMS History ({filteredHistory.length})</h2>
                  <div className="flex gap-2">
                    <button onClick={exportToPDF} className="btn bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm flex items-center gap-1"><Download className="w-4 h-4" /> PDF</button>
                    <button onClick={exportToCSV} className="btn bg-green-100 text-green-700 hover:bg-green-200 text-sm flex items-center gap-1"><FileSpreadsheet className="w-4 h-4" /> CSV</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search..." value={historyFilter.search} onChange={(e) => setHistoryFilter({...historyFilter, search: e.target.value})} className="input pl-9 text-sm" /></div>
                  <select value={historyFilter.status} onChange={(e) => setHistoryFilter({...historyFilter, status: e.target.value})} className="input text-sm"><option value="">All Status</option><option value="sent">Sent</option><option value="delivered">Delivered</option><option value="failed">Failed</option></select>
                  <input type="date" value={historyFilter.dateFrom} onChange={(e) => setHistoryFilter({...historyFilter, dateFrom: e.target.value})} className="input text-sm" />
                  <input type="date" value={historyFilter.dateTo} onChange={(e) => setHistoryFilter({...historyFilter, dateTo: e.target.value})} className="input text-sm" />
                </div>
              </div>
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {filteredHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No messages found</p>
                ) : (
                  filteredHistory.map(msg => (
                    <div key={msg.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">{getStatusIcon(msg.status)}<span className="font-medium">{msg.recipient_name || 'Unknown'}</span><span className="text-sm text-gray-500">{msg.phone}</span></div>
                          <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{msg.sent_at}</p>
                        </div>
                        {msg.status === 'failed' && <button onClick={() => retryFailedMessage(msg)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title="Retry"><RefreshCw className="w-4 h-4" /></button>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><Settings className="w-6 h-6 text-blue-600" /></div>
                <div><h2 className="text-lg font-semibold">SMS Gateway Settings</h2><p className="text-sm text-gray-500">Configure your SMS provider credentials</p></div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-800 mb-2">📱 Supported SMS Providers:</h3>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Hubtel (Ghana)</li>
                  <li>Arkesel (Ghana)</li>
                  <li>mNotify (Ghana)</li>
                  <li>Twilio (International)</li>
                  <li>Africa's Talking (Africa)</li>
                </ul>
              </div>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-2">SMS Provider</label><select value={smsSettings.provider} onChange={(e) => setSmsSettings({...smsSettings, provider: e.target.value})} className="input"><option value="hubtel">Hubtel</option><option value="arkesel">Arkesel</option><option value="mnotify">mNotify</option><option value="twilio">Twilio</option><option value="africastalking">Africa's Talking</option></select></div>
                <div><label className="block text-sm font-medium mb-2">API Key / Client ID</label><input type="text" value={smsSettings.api_key} onChange={(e) => setSmsSettings({...smsSettings, api_key: e.target.value})} className="input" placeholder="Enter API key" /></div>
                <div><label className="block text-sm font-medium mb-2">API Secret / Auth Token</label><input type="password" value={smsSettings.api_secret} onChange={(e) => setSmsSettings({...smsSettings, api_secret: e.target.value})} className="input" placeholder="Enter API secret" /></div>
                <div><label className="block text-sm font-medium mb-2">Sender ID</label><input type="text" value={smsSettings.sender_id} onChange={(e) => setSmsSettings({...smsSettings, sender_id: e.target.value})} className="input" placeholder="e.g., SCHOOL" maxLength={11} /></div>
                <button onClick={saveSettings} disabled={savingSettings} className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">{savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings</button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card p-4">
            <h3 className="font-semibold mb-3">Quick Templates</h3>
            <div className="space-y-2">
              {templates.slice(0, 5).map(t => (
                <button key={t.id} onClick={() => applyTemplate(t)} className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.category}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="card p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">SMS Tips</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Keep messages under 160 characters</li>
              <li>• Use {'{name}'} for personalization</li>
              <li>• Schedule messages for optimal delivery</li>
              <li>• Check credits before bulk sending</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Create SMS Template</h3><button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-2">Template Name</label><input type="text" value={newTemplate.name} onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})} className="input" placeholder="e.g., fee_reminder" /></div>
              <div><label className="block text-sm font-medium mb-2">Category</label><select value={newTemplate.category} onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})} className="input"><option value="general">General</option><option value="fee_reminder">Fee Reminder</option><option value="attendance">Attendance</option><option value="exam">Exam</option><option value="event">Event</option></select></div>
              <div><label className="block text-sm font-medium mb-2">Message ({newTemplate.message_template.length}/160)</label><textarea value={newTemplate.message_template} onChange={(e) => setNewTemplate({...newTemplate, message_template: e.target.value})} className="input" rows="4" placeholder="Dear {name}, ..." maxLength={320} /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6"><button onClick={() => setShowTemplateModal(false)} className="btn bg-gray-200 hover:bg-gray-300">Cancel</button><button onClick={saveTemplate} disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-orange-600" /> Schedule SMS</h3><button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleScheduleMessage} className="space-y-4">
              <div><label className="block text-sm font-medium mb-2">Recipients</label><select value={scheduleForm.recipient_type} onChange={(e) => setScheduleForm({...scheduleForm, recipient_type: e.target.value})} className="input"><option value="all_parents">All Parents</option><option value="all_teachers">All Teachers</option></select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2">Date *</label><input type="date" value={scheduleForm.scheduled_date} onChange={(e) => setScheduleForm({...scheduleForm, scheduled_date: e.target.value})} className="input" required min={new Date().toISOString().split('T')[0]} /></div>
                <div><label className="block text-sm font-medium mb-2">Time *</label><input type="time" value={scheduleForm.scheduled_time} onChange={(e) => setScheduleForm({...scheduleForm, scheduled_time: e.target.value})} className="input" required /></div>
              </div>
              <div><label className="block text-sm font-medium mb-2">Repeat</label><select value={scheduleForm.repeat} onChange={(e) => setScheduleForm({...scheduleForm, repeat: e.target.value})} className="input"><option value="none">Don't Repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
              <div><label className="block text-sm font-medium mb-2">Message *</label><textarea value={scheduleForm.message} onChange={(e) => setScheduleForm({...scheduleForm, message: e.target.value})} className="input" rows="4" required placeholder="Type message..." /></div>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowScheduleModal(false)} className="btn bg-gray-200 hover:bg-gray-300">Cancel</button><button type="submit" className="btn btn-primary flex items-center gap-2"><Calendar className="w-4 h-4" /> Schedule</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
