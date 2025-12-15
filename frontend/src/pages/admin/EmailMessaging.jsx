import { useState, useEffect } from 'react';
import { 
  Mail, Send, Users, FileText, Settings, History,
  User, Search, CheckCircle, XCircle, Clock, Loader2,
  Plus, Trash2, RefreshCw, Download, Calendar, BarChart3,
  TrendingUp, UserPlus, X, Save, FileSpreadsheet, Paperclip,
  Eye, Bold, Italic, Link, Image, List, AlignLeft, Code
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function EmailMessaging() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('compose');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, delivered: 0, failed: 0, today: 0, opened: 0 });
  const [recipients, setRecipients] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [scheduledEmails, setScheduledEmails] = useState([]);
  const [drafts, setDrafts] = useState([]);
  
  // Filters
  const [historyFilter, setHistoryFilter] = useState({ status: '', dateFrom: '', dateTo: '', search: '' });
  
  // Compose form
  const [composeForm, setComposeForm] = useState({
    to: '',
    to_name: '',
    subject: '',
    body: '',
    attachments: [],
    is_html: true
  });
  
  // Bulk email form
  const [bulkForm, setBulkForm] = useState({
    recipient_type: 'all_parents',
    subject: '',
    body: '',
    attachments: []
  });
  
  // Template form
  const [newTemplate, setNewTemplate] = useState({ name: '', category: 'general', subject: '', body: '' });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({ recipient_type: 'all_parents', subject: '', body: '', scheduled_date: '', scheduled_time: '' });
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  // Preview
  const [showPreview, setShowPreview] = useState(false);
  
  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    from_email: '',
    from_name: '',
    encryption: 'tls'
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const API = `${API_BASE_URL}/email.php`;

  useEffect(() => {
    fetchTemplates();
    fetchStats();
    fetchHistory();
    fetchSettings();
    fetchClasses();
    fetchScheduledEmails();
    fetchDrafts();
  }, []);

  const fetchTemplates = async () => { try { const r = await axios.get(`${API}?action=templates`); setTemplates(r.data.templates || []); } catch (e) { console.error(e); } };
  const fetchStats = async () => { try { const r = await axios.get(`${API}?action=stats`); setStats(r.data.stats || {}); } catch (e) { console.error(e); } };
  const fetchHistory = async () => { try { const r = await axios.get(`${API}?action=history&limit=100`); setHistory(r.data.emails || []); } catch (e) { console.error(e); } };
  const fetchSettings = async () => { try { const r = await axios.get(`${API}?action=settings`); if (r.data.settings) setEmailSettings(r.data.settings); } catch (e) { console.error(e); } };
  const fetchClasses = async () => { try { const r = await axios.get(`${API_BASE_URL}/classes.php`); setClasses(r.data.classes || r.data || []); } catch (e) { console.error(e); } };
  const fetchScheduledEmails = async () => { try { const r = await axios.get(`${API}?action=scheduled`); setScheduledEmails(r.data.scheduled || []); } catch (e) { console.error(e); } };
  const fetchDrafts = async () => { try { const r = await axios.get(`${API}?action=drafts`); setDrafts(r.data.drafts || []); } catch (e) { console.error(e); } };

  const fetchRecipients = async (type) => {
    try {
      setLoading(true);
      let endpoint = type === 'all_parents' ? `${API_BASE_URL}/parents.php` : type === 'all_teachers' ? `${API_BASE_URL}/teachers.php` : `${API_BASE_URL}/parents.php?has_students=true`;
      const r = await axios.get(endpoint);
      const data = r.data.parents || r.data.teachers || [];
      setRecipients(data.map(p => ({ id: p.id, name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name, email: p.email, type: type.includes('parent') ? 'parent' : 'teacher' })));
    } catch (e) { console.error(e); setRecipients([]); }
    finally { setLoading(false); }
  };

  const fetchClassParents = async (classId) => {
    try {
      setLoading(true);
      const r = await axios.get(`${API_BASE_URL}/parents.php?class_id=${classId}`);
      const data = r.data.parents || [];
      setRecipients(data.map(p => ({ id: p.id, name: `${p.first_name || ''} ${p.last_name || ''}`.trim(), email: p.email, type: 'parent', student_name: p.student_name })));
    } catch (e) { console.error(e); setRecipients([]); }
    finally { setLoading(false); }
  };

  const sendEmail = async () => {
    if (!composeForm.to || !composeForm.subject || !composeForm.body) { alert('Enter recipient, subject and body'); return; }
    try {
      setLoading(true);
      const r = await axios.post(`${API}?action=send`, { ...composeForm, sent_by: user?.id });
      if (r.data.success) {
        alert('✅ Email sent successfully!');
        setComposeForm({ to: '', to_name: '', subject: '', body: '', attachments: [], is_html: true });
        fetchStats(); fetchHistory();
      } else { alert('Failed: ' + (r.data.error || 'Unknown error')); }
    } catch (e) { alert('Failed to send email'); }
    finally { setLoading(false); }
  };

  const sendBulkEmails = async () => {
    if (recipients.length === 0 || !bulkForm.subject || !bulkForm.body) { alert('Select recipients and fill subject/body'); return; }
    try {
      setLoading(true);
      const r = await axios.post(`${API}?action=send_bulk`, {
        recipients: recipients.filter(p => p.email).map(p => ({ email: p.email, name: p.name, type: p.type })),
        subject: bulkForm.subject,
        body: bulkForm.body,
        sent_by: user?.id
      });
      if (r.data.success) {
        alert(`✅ ${r.data.sent_count} emails sent!`);
        fetchStats(); fetchHistory();
      }
    } catch (e) { alert('Failed to send'); }
    finally { setLoading(false); }
  };

  const saveDraft = async () => {
    try {
      await axios.post(`${API}?action=save_draft`, { ...composeForm, user_id: user?.id });
      alert('✅ Draft saved!');
      fetchDrafts();
    } catch (e) { alert('Failed'); }
  };

  const loadDraft = (draft) => {
    setComposeForm({ to: draft.to_email || '', to_name: draft.to_name || '', subject: draft.subject || '', body: draft.body || '', attachments: [], is_html: true });
    setActiveTab('compose');
  };

  const deleteDraft = async (id) => {
    if (!confirm('Delete this draft?')) return;
    try { await axios.delete(`${API}?action=delete_draft&id=${id}`); fetchDrafts(); } catch (e) { alert('Failed'); }
  };

  const saveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.body) { alert('Fill all fields'); return; }
    try {
      setLoading(true);
      await axios.post(`${API}?action=save_template`, newTemplate);
      alert('✅ Template saved!');
      setShowTemplateModal(false);
      setNewTemplate({ name: '', category: 'general', subject: '', body: '' });
      fetchTemplates();
    } catch (e) { alert('Failed'); }
    finally { setLoading(false); }
  };

  const saveSettings = async () => {
    try {
      setSavingSettings(true);
      await axios.post(`${API}?action=save_settings`, emailSettings);
      alert('✅ Email settings saved!');
    } catch (e) { alert('Failed'); }
    finally { setSavingSettings(false); }
  };

  const handleScheduleEmail = async (e) => {
    e.preventDefault();
    if (!scheduleForm.subject || !scheduleForm.body || !scheduleForm.scheduled_date || !scheduleForm.scheduled_time) { alert('Fill all fields'); return; }
    try {
      await axios.post(`${API}?action=schedule`, { ...scheduleForm, scheduled_at: `${scheduleForm.scheduled_date} ${scheduleForm.scheduled_time}`, created_by: user?.id });
      alert('✅ Email scheduled!');
      setShowScheduleModal(false);
      setScheduleForm({ recipient_type: 'all_parents', subject: '', body: '', scheduled_date: '', scheduled_time: '' });
      fetchScheduledEmails();
    } catch (e) { alert('Failed'); }
  };

  const cancelScheduledEmail = async (id) => {
    if (!confirm('Cancel this scheduled email?')) return;
    try { await axios.delete(`${API}?action=schedule&id=${id}`); fetchScheduledEmails(); } catch (e) { alert('Failed'); }
  };

  const retryFailedEmail = async (email) => {
    try {
      setLoading(true);
      await axios.post(`${API}?action=retry`, { email_id: email.id });
      alert('✅ Email resent!');
      fetchHistory(); fetchStats();
    } catch (e) { alert('Failed'); }
    finally { setLoading(false); }
  };

  const applyTemplate = (template) => {
    if (activeTab === 'compose') setComposeForm(prev => ({ ...prev, subject: template.subject, body: template.body }));
    else if (activeTab === 'bulk') setBulkForm(prev => ({ ...prev, subject: template.subject, body: template.body }));
  };

  // Filtered history
  const filteredHistory = history.filter(email => {
    const matchesStatus = !historyFilter.status || email.status === historyFilter.status;
    const matchesSearch = !historyFilter.search || email.to_name?.toLowerCase().includes(historyFilter.search.toLowerCase()) || email.to_email?.includes(historyFilter.search) || email.subject?.toLowerCase().includes(historyFilter.search.toLowerCase());
    const matchesDateFrom = !historyFilter.dateFrom || new Date(email.sent_at) >= new Date(historyFilter.dateFrom);
    const matchesDateTo = !historyFilter.dateTo || new Date(email.sent_at) <= new Date(historyFilter.dateTo + 'T23:59:59');
    return matchesStatus && matchesSearch && matchesDateFrom && matchesDateTo;
  });

  // Export functions
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('Email History', 14, 22);
    doc.setFontSize(10); doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, { startY: 36, head: [['Date', 'To', 'Subject', 'Status']], body: filteredHistory.map(e => [e.sent_at?.split(' ')[0] || '-', e.to_email || '-', (e.subject || '').substring(0, 40), e.status || '-']), styles: { fontSize: 8 } });
    doc.save(`email_history_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const csv = 'Date,To,Name,Subject,Status\n' + filteredHistory.map(e => `"${e.sent_at || ''}","${e.to_email || ''}","${e.to_name || ''}","${(e.subject || '').replace(/"/g, '""')}","${e.status || ''}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `email_history_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': case 'opened': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'sent': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // Simple text formatting
  const insertFormat = (format) => {
    const textarea = document.getElementById('email-body');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = composeForm.body;
    const selected = text.substring(start, end);
    let formatted = '';
    switch (format) {
      case 'bold': formatted = `<strong>${selected || 'text'}</strong>`; break;
      case 'italic': formatted = `<em>${selected || 'text'}</em>`; break;
      case 'link': formatted = `<a href="url">${selected || 'link text'}</a>`; break;
      case 'list': formatted = `<ul>\n<li>${selected || 'item'}</li>\n</ul>`; break;
      default: formatted = selected;
    }
    setComposeForm({ ...composeForm, body: text.substring(0, start) + formatted + text.substring(end) });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Mail className="w-7 h-7 text-indigo-600" /> Email Messaging</h1>
          <p className="text-gray-600 mt-1">Send email notifications to parents and staff</p>
        </div>
        <button onClick={() => { fetchStats(); fetchHistory(); }} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Refresh</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"><Mail className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Total Sent</p><p className="text-2xl font-bold">{stats.total || 0}</p></div>
        <div className="card p-4 bg-gradient-to-br from-green-500 to-green-600 text-white"><CheckCircle className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Delivered</p><p className="text-2xl font-bold">{stats.delivered || 0}</p></div>
        <div className="card p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white"><Eye className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Opened</p><p className="text-2xl font-bold">{stats.opened || 0}</p></div>
        <div className="card p-4 bg-gradient-to-br from-red-500 to-red-600 text-white"><XCircle className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Failed</p><p className="text-2xl font-bold">{stats.failed || 0}</p></div>
        <div className="card p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white"><Clock className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Today</p><p className="text-2xl font-bold">{stats.today || 0}</p></div>
        <div className="card p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white"><Calendar className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Scheduled</p><p className="text-2xl font-bold">{scheduledEmails.length}</p></div>
        <div className="card p-4 bg-gradient-to-br from-teal-500 to-teal-600 text-white"><FileText className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Templates</p><p className="text-2xl font-bold">{templates.length}</p></div>
        <div className="card p-4 bg-gradient-to-br from-gray-500 to-gray-600 text-white"><FileText className="w-6 h-6 mb-2 opacity-80" /><p className="text-sm opacity-80">Drafts</p><p className="text-2xl font-bold">{drafts.length}</p></div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'compose', label: 'Compose', icon: Send },
          { id: 'bulk', label: 'Bulk', icon: Users },
          { id: 'scheduled', label: 'Scheduled', icon: Calendar },
          { id: 'drafts', label: 'Drafts', icon: FileText },
          { id: 'templates', label: 'Templates', icon: FileText },
          { id: 'history', label: 'History', icon: History },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-2 rounded-md font-medium flex items-center gap-1 text-sm transition-colors ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow' : 'hover:bg-gray-200'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Compose */}
          {activeTab === 'compose' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Send className="w-5 h-5 text-indigo-600" /> Compose Email</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-2"><Mail className="w-4 h-4 inline mr-1" /> To (Email) *</label><input type="email" value={composeForm.to} onChange={(e) => setComposeForm({...composeForm, to: e.target.value})} className="input" placeholder="recipient@email.com" /></div>
                  <div><label className="block text-sm font-medium mb-2"><User className="w-4 h-4 inline mr-1" /> Name</label><input type="text" value={composeForm.to_name} onChange={(e) => setComposeForm({...composeForm, to_name: e.target.value})} className="input" placeholder="Recipient Name" /></div>
                </div>
                <div><label className="block text-sm font-medium mb-2">Subject *</label><input type="text" value={composeForm.subject} onChange={(e) => setComposeForm({...composeForm, subject: e.target.value})} className="input" placeholder="Email subject" /></div>
                {/* Formatting toolbar */}
                <div className="flex gap-1 border-b pb-2">
                  <button type="button" onClick={() => insertFormat('bold')} className="p-2 hover:bg-gray-100 rounded" title="Bold"><Bold className="w-4 h-4" /></button>
                  <button type="button" onClick={() => insertFormat('italic')} className="p-2 hover:bg-gray-100 rounded" title="Italic"><Italic className="w-4 h-4" /></button>
                  <button type="button" onClick={() => insertFormat('link')} className="p-2 hover:bg-gray-100 rounded" title="Link"><Link className="w-4 h-4" /></button>
                  <button type="button" onClick={() => insertFormat('list')} className="p-2 hover:bg-gray-100 rounded" title="List"><List className="w-4 h-4" /></button>
                  <div className="flex-1"></div>
                  <button type="button" onClick={() => setShowPreview(true)} className="p-2 hover:bg-gray-100 rounded flex items-center gap-1 text-sm"><Eye className="w-4 h-4" /> Preview</button>
                </div>
                <div><label className="block text-sm font-medium mb-2">Body *</label><textarea id="email-body" value={composeForm.body} onChange={(e) => setComposeForm({...composeForm, body: e.target.value})} className="input font-mono text-sm" rows="10" placeholder="Email body (HTML supported)..." /></div>
                <div className="flex gap-3">
                  <button onClick={saveDraft} className="btn bg-gray-200 hover:bg-gray-300 flex items-center gap-2"><Save className="w-4 h-4" /> Save Draft</button>
                  <button onClick={sendEmail} disabled={loading} className="btn bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Email</button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk */}
          {activeTab === 'bulk' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600" /> Send Bulk Email</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Recipients</label>
                    <select value={bulkForm.recipient_type} onChange={(e) => { setBulkForm({...bulkForm, recipient_type: e.target.value}); fetchRecipients(e.target.value); }} className="input">
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
                  <div className="bg-indigo-50 p-3 rounded-lg"><p className="text-sm font-medium text-indigo-700">{recipients.filter(r => r.email).length} recipients with email selected</p></div>
                )}
                <div><label className="block text-sm font-medium mb-2">Subject *</label><input type="text" value={bulkForm.subject} onChange={(e) => setBulkForm({...bulkForm, subject: e.target.value})} className="input" placeholder="Email subject" /></div>
                <div><label className="block text-sm font-medium mb-2">Body *</label><textarea value={bulkForm.body} onChange={(e) => setBulkForm({...bulkForm, body: e.target.value})} className="input" rows="8" placeholder="Use {name} for personalization" /></div>
                <button onClick={sendBulkEmails} disabled={loading || recipients.filter(r => r.email).length === 0} className="btn bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send to {recipients.filter(r => r.email).length} Recipients</button>
              </div>
            </div>
          )}

          {/* Scheduled */}
          {activeTab === 'scheduled' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-orange-600" /> Scheduled Emails</h2>
                <button onClick={() => setShowScheduleModal(true)} className="btn btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Schedule</button>
              </div>
              {scheduledEmails.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No scheduled emails</p></div>
              ) : (
                <div className="space-y-3">
                  {scheduledEmails.map(s => (
                    <div key={s.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs ${s.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{s.status}</span>
                            <span className="text-sm text-gray-500">{s.recipient_type}</span>
                          </div>
                          <p className="font-medium">{s.subject}</p>
                          <p className="text-xs text-gray-500 mt-1"><Clock className="w-3 h-3 inline" /> {s.scheduled_at}</p>
                        </div>
                        {s.status === 'pending' && <button onClick={() => cancelScheduledEmail(s.id)} className="text-red-600 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Drafts */}
          {activeTab === 'drafts' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-gray-600" /> Drafts</h2>
              {drafts.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No drafts</p></div>
              ) : (
                <div className="space-y-3">
                  {drafts.map(d => (
                    <div key={d.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 cursor-pointer" onClick={() => loadDraft(d)}>
                          <p className="font-medium">{d.subject || '(No subject)'}</p>
                          <p className="text-sm text-gray-500">{d.to_email || 'No recipient'}</p>
                          <p className="text-xs text-gray-400 mt-1">{d.updated_at}</p>
                        </div>
                        <button onClick={() => deleteDraft(d.id)} className="text-red-600 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
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
                <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-600" /> Email Templates</h2>
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
                          <p className="text-sm text-gray-600">{t.subject}</p>
                        </div>
                        <button onClick={() => applyTemplate(t)} className="btn bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-sm">Use</button>
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
                  <h2 className="text-lg font-semibold flex items-center gap-2"><History className="w-5 h-5 text-indigo-600" /> Email History ({filteredHistory.length})</h2>
                  <div className="flex gap-2">
                    <button onClick={exportToPDF} className="btn bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm flex items-center gap-1"><Download className="w-4 h-4" /> PDF</button>
                    <button onClick={exportToCSV} className="btn bg-green-100 text-green-700 hover:bg-green-200 text-sm flex items-center gap-1"><FileSpreadsheet className="w-4 h-4" /> CSV</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search..." value={historyFilter.search} onChange={(e) => setHistoryFilter({...historyFilter, search: e.target.value})} className="input pl-9 text-sm" /></div>
                  <select value={historyFilter.status} onChange={(e) => setHistoryFilter({...historyFilter, status: e.target.value})} className="input text-sm"><option value="">All Status</option><option value="sent">Sent</option><option value="delivered">Delivered</option><option value="opened">Opened</option><option value="failed">Failed</option></select>
                  <input type="date" value={historyFilter.dateFrom} onChange={(e) => setHistoryFilter({...historyFilter, dateFrom: e.target.value})} className="input text-sm" />
                  <input type="date" value={historyFilter.dateTo} onChange={(e) => setHistoryFilter({...historyFilter, dateTo: e.target.value})} className="input text-sm" />
                </div>
              </div>
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {filteredHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No emails found</p>
                ) : (
                  filteredHistory.map(email => (
                    <div key={email.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">{getStatusIcon(email.status)}<span className="font-medium">{email.to_name || email.to_email}</span></div>
                          <p className="text-sm text-gray-700">{email.subject}</p>
                          <p className="text-xs text-gray-400 mt-1">{email.sent_at}</p>
                        </div>
                        {email.status === 'failed' && <button onClick={() => retryFailedEmail(email)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title="Retry"><RefreshCw className="w-4 h-4" /></button>}
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
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center"><Settings className="w-6 h-6 text-indigo-600" /></div>
                <div><h2 className="text-lg font-semibold">SMTP Email Settings</h2><p className="text-sm text-gray-500">Configure your email server credentials</p></div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-indigo-800 mb-2">📧 Common SMTP Providers:</h3>
                <ul className="text-sm text-indigo-700 space-y-1 list-disc list-inside">
                  <li>Gmail: smtp.gmail.com (Port 587, TLS)</li>
                  <li>Outlook: smtp.office365.com (Port 587, TLS)</li>
                  <li>SendGrid: smtp.sendgrid.net (Port 587, TLS)</li>
                  <li>Mailgun: smtp.mailgun.org (Port 587, TLS)</li>
                </ul>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-2">SMTP Host</label><input type="text" value={emailSettings.smtp_host} onChange={(e) => setEmailSettings({...emailSettings, smtp_host: e.target.value})} className="input" placeholder="smtp.gmail.com" /></div>
                  <div><label className="block text-sm font-medium mb-2">SMTP Port</label><input type="text" value={emailSettings.smtp_port} onChange={(e) => setEmailSettings({...emailSettings, smtp_port: e.target.value})} className="input" placeholder="587" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-2">SMTP Username</label><input type="text" value={emailSettings.smtp_user} onChange={(e) => setEmailSettings({...emailSettings, smtp_user: e.target.value})} className="input" placeholder="your@email.com" /></div>
                  <div><label className="block text-sm font-medium mb-2">SMTP Password</label><input type="password" value={emailSettings.smtp_pass} onChange={(e) => setEmailSettings({...emailSettings, smtp_pass: e.target.value})} className="input" placeholder="App password" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-2">From Email</label><input type="email" value={emailSettings.from_email} onChange={(e) => setEmailSettings({...emailSettings, from_email: e.target.value})} className="input" placeholder="noreply@school.com" /></div>
                  <div><label className="block text-sm font-medium mb-2">From Name</label><input type="text" value={emailSettings.from_name} onChange={(e) => setEmailSettings({...emailSettings, from_name: e.target.value})} className="input" placeholder="School Name" /></div>
                </div>
                <div><label className="block text-sm font-medium mb-2">Encryption</label><select value={emailSettings.encryption} onChange={(e) => setEmailSettings({...emailSettings, encryption: e.target.value})} className="input"><option value="tls">TLS</option><option value="ssl">SSL</option><option value="none">None</option></select></div>
                <button onClick={saveSettings} disabled={savingSettings} className="btn bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">{savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings</button>
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
          <div className="card p-4 bg-indigo-50 border-indigo-200">
            <h3 className="font-semibold text-indigo-800 mb-2">Email Tips</h3>
            <ul className="text-sm text-indigo-700 space-y-1">
              <li>• Use clear, descriptive subjects</li>
              <li>• Personalize with {'{name}'}</li>
              <li>• Test emails before bulk sending</li>
              <li>• Check spam folder for test emails</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold">Create Email Template</h3><button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium mb-2">Template Name</label><input type="text" value={newTemplate.name} onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})} className="input" placeholder="e.g., Welcome Email" /></div>
              <div><label className="block text-sm font-medium mb-2">Category</label><select value={newTemplate.category} onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})} className="input"><option value="general">General</option><option value="fee_reminder">Fee Reminder</option><option value="attendance">Attendance</option><option value="exam">Exam</option><option value="event">Event</option><option value="newsletter">Newsletter</option></select></div>
              <div><label className="block text-sm font-medium mb-2">Subject</label><input type="text" value={newTemplate.subject} onChange={(e) => setNewTemplate({...newTemplate, subject: e.target.value})} className="input" placeholder="Email subject" /></div>
              <div><label className="block text-sm font-medium mb-2">Body</label><textarea value={newTemplate.body} onChange={(e) => setNewTemplate({...newTemplate, body: e.target.value})} className="input" rows="6" placeholder="Email body (HTML supported)..." /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6"><button onClick={() => setShowTemplateModal(false)} className="btn bg-gray-200 hover:bg-gray-300">Cancel</button><button onClick={saveTemplate} disabled={loading} className="btn btn-primary">{loading ? 'Saving...' : 'Save'}</button></div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-orange-600" /> Schedule Email</h3><button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleScheduleEmail} className="space-y-4">
              <div><label className="block text-sm font-medium mb-2">Recipients</label><select value={scheduleForm.recipient_type} onChange={(e) => setScheduleForm({...scheduleForm, recipient_type: e.target.value})} className="input"><option value="all_parents">All Parents</option><option value="all_teachers">All Teachers</option></select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-2">Date *</label><input type="date" value={scheduleForm.scheduled_date} onChange={(e) => setScheduleForm({...scheduleForm, scheduled_date: e.target.value})} className="input" required min={new Date().toISOString().split('T')[0]} /></div>
                <div><label className="block text-sm font-medium mb-2">Time *</label><input type="time" value={scheduleForm.scheduled_time} onChange={(e) => setScheduleForm({...scheduleForm, scheduled_time: e.target.value})} className="input" required /></div>
              </div>
              <div><label className="block text-sm font-medium mb-2">Subject *</label><input type="text" value={scheduleForm.subject} onChange={(e) => setScheduleForm({...scheduleForm, subject: e.target.value})} className="input" required placeholder="Email subject" /></div>
              <div><label className="block text-sm font-medium mb-2">Body *</label><textarea value={scheduleForm.body} onChange={(e) => setScheduleForm({...scheduleForm, body: e.target.value})} className="input" rows="4" required placeholder="Email body..." /></div>
              <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowScheduleModal(false)} className="btn bg-gray-200 hover:bg-gray-300">Cancel</button><button type="submit" className="btn btn-primary flex items-center gap-2"><Calendar className="w-4 h-4" /> Schedule</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between"><h3 className="text-lg font-semibold">Email Preview</h3><button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button></div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="border-b pb-4 mb-4">
                <p className="text-sm text-gray-500">To: {composeForm.to || 'recipient@email.com'}</p>
                <p className="text-lg font-medium">{composeForm.subject || '(No subject)'}</p>
              </div>
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: composeForm.body || '<p>No content</p>' }} />
            </div>
            <div className="p-4 border-t flex justify-end"><button onClick={() => setShowPreview(false)} className="btn bg-gray-200 hover:bg-gray-300">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
