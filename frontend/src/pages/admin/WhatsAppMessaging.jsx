import { useState, useEffect } from 'react';
import { 
  MessageCircle, Send, Users, FileText, Settings, History,
  Phone, User, Search, CheckCircle, XCircle, Clock, Loader2,
  Plus, Edit2, Trash2, ExternalLink, Filter, RefreshCw, Download,
  Calendar, BarChart3, PieChart, TrendingUp, AlertCircle, RotateCcw,
  UserPlus, Upload, Eye, Copy, Bell, DollarSign, GraduationCap,
  Building, Mail, FileSpreadsheet, X, Save, Play, Pause, Zap
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function WhatsAppMessaging() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('send'); // send, bulk, templates, history, settings
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, sent: 0, delivered: 0, failed: 0, today: 0 });
  const [recipients, setRecipients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Single message form
  const [singleMessage, setSingleMessage] = useState({
    phone: '',
    recipient_name: '',
    message: ''
  });

  // Bulk message form
  const [bulkMessage, setBulkMessage] = useState({
    recipient_type: 'all_parents',
    message: '',
    template_name: ''
  });

  // New template form
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: 'general',
    message_template: '',
    variables: []
  });

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  
  // WhatsApp API Settings
  const [apiSettings, setApiSettings] = useState({
    api_token: '',
    phone_number_id: '',
    business_account_id: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // NEW: Enhanced state variables
  const [historyFilter, setHistoryFilter] = useState({ status: '', dateFrom: '', dateTo: '', search: '' });
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [contactGroups, setContactGroups] = useState([]);
  const [analytics, setAnalytics] = useState({ daily: [], weekly: [], monthly: [], deliveryRate: 0, avgResponseTime: 0 });
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [feeReminders, setFeeReminders] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showFeeReminderModal, setShowFeeReminderModal] = useState(false);
  
  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({
    recipient_type: 'all_parents',
    message: '',
    scheduled_date: '',
    scheduled_time: '',
    repeat: 'none',
    template_id: ''
  });
  
  // Contact group form
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    members: []
  });
  
  // Fee reminder form
  const [feeReminderForm, setFeeReminderForm] = useState({
    days_before_due: 7,
    message_template: '',
    auto_send: false,
    include_amount: true
  });

  useEffect(() => {
    fetchTemplates();
    fetchStats();
    fetchHistory();
    fetchApiSettings();
    fetchScheduledMessages();
    fetchContactGroups();
    fetchAnalytics();
    fetchClasses();
    fetchFeeReminders();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp.php?action=templates`);
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp.php?action=stats`);
      setStats(response.data.stats || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp.php?action=history&limit=50`);
      setHistory(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchApiSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/whatsapp.php`);
      if (response.data.settings) {
        setApiSettings({
          api_token: response.data.settings.api_token || '',
          phone_number_id: response.data.settings.phone_number_id || '',
          business_account_id: response.data.settings.business_account_id || ''
        });
      }
    } catch (error) {
      console.error('Error fetching API settings:', error);
    }
  };

  const saveApiSettings = async () => {
    try {
      setSavingSettings(true);
      await axios.post(`${API_BASE_URL}/whatsapp.php?action=save_settings`, apiSettings);
      alert('✅ WhatsApp API settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // NEW: Fetch functions for enhanced features
  const fetchScheduledMessages = async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/whatsapp.php?action=scheduled`);
      setScheduledMessages(r.data.scheduled || []);
    } catch (e) { console.error(e); }
  };

  const fetchContactGroups = async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/whatsapp.php?action=groups`);
      setContactGroups(r.data.groups || []);
    } catch (e) { console.error(e); }
  };

  const fetchAnalytics = async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/whatsapp.php?action=analytics`);
      setAnalytics(r.data.analytics || { daily: [], weekly: [], monthly: [], deliveryRate: 0, avgResponseTime: 0 });
    } catch (e) { console.error(e); }
  };

  const fetchClasses = async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/classes.php`);
      setClasses(r.data.classes || r.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchFeeReminders = async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/whatsapp.php?action=fee_reminders`);
      setFeeReminders(r.data.reminders || []);
    } catch (e) { console.error(e); }
  };

  const fetchClassParents = async (classId) => {
    try {
      setLoading(true);
      const r = await axios.get(`${API_BASE_URL}/parents.php?class_id=${classId}`);
      const data = r.data.parents || [];
      setRecipients(data.map(p => ({
        id: p.id,
        name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        phone: p.phone || p.guardian_phone,
        type: 'parent',
        student_name: p.student_name
      })));
    } catch (e) { console.error(e); setRecipients([]); }
    finally { setLoading(false); }
  };

  // Filtered history
  const filteredHistory = history.filter(msg => {
    const matchesStatus = !historyFilter.status || msg.status === historyFilter.status;
    const matchesSearch = !historyFilter.search || 
      msg.recipient_name?.toLowerCase().includes(historyFilter.search.toLowerCase()) ||
      msg.phone?.includes(historyFilter.search) ||
      msg.message?.toLowerCase().includes(historyFilter.search.toLowerCase());
    const matchesDateFrom = !historyFilter.dateFrom || new Date(msg.sent_at) >= new Date(historyFilter.dateFrom);
    const matchesDateTo = !historyFilter.dateTo || new Date(msg.sent_at) <= new Date(historyFilter.dateTo + 'T23:59:59');
    return matchesStatus && matchesSearch && matchesDateFrom && matchesDateTo;
  });

  // Export functions
  const exportHistoryToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('WhatsApp Message History', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Messages: ${filteredHistory.length}`, 14, 36);
    
    autoTable(doc, {
      startY: 42,
      head: [['Date', 'Recipient', 'Phone', 'Status', 'Message']],
      body: filteredHistory.map(m => [
        m.sent_at?.split(' ')[0] || '-',
        m.recipient_name || '-',
        m.phone || '-',
        m.status || '-',
        (m.message || '').substring(0, 50) + (m.message?.length > 50 ? '...' : '')
      ]),
      styles: { fontSize: 8 },
      columnStyles: { 4: { cellWidth: 60 } }
    });
    doc.save(`whatsapp_history_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportHistoryToCSV = () => {
    const csv = 'Date,Recipient,Phone,Status,Message\n' + 
      filteredHistory.map(m => 
        `"${m.sent_at || ''}","${m.recipient_name || ''}","${m.phone || ''}","${m.status || ''}","${(m.message || '').replace(/"/g, '""')}"`
      ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `whatsapp_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Schedule message
  const handleScheduleMessage = async (e) => {
    e.preventDefault();
    if (!scheduleForm.message || !scheduleForm.scheduled_date || !scheduleForm.scheduled_time) {
      alert('Please fill all required fields');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/whatsapp.php?action=schedule`, {
        ...scheduleForm,
        scheduled_at: `${scheduleForm.scheduled_date} ${scheduleForm.scheduled_time}`,
        created_by: user?.id
      });
      alert('✅ Message scheduled successfully!');
      setShowScheduleModal(false);
      setScheduleForm({ recipient_type: 'all_parents', message: '', scheduled_date: '', scheduled_time: '', repeat: 'none', template_id: '' });
      fetchScheduledMessages();
    } catch (e) { alert('Failed to schedule'); }
  };

  // Cancel scheduled message
  const cancelScheduledMessage = async (id) => {
    if (!confirm('Cancel this scheduled message?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/whatsapp.php?action=schedule&id=${id}`);
      fetchScheduledMessages();
    } catch (e) { alert('Failed'); }
  };

  // Save contact group
  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.name) { alert('Enter group name'); return; }
    try {
      await axios.post(`${API_BASE_URL}/whatsapp.php?action=save_group`, groupForm);
      alert('✅ Group saved!');
      setShowGroupModal(false);
      setGroupForm({ name: '', description: '', members: [] });
      fetchContactGroups();
    } catch (e) { alert('Failed'); }
  };

  // Delete group
  const deleteGroup = async (id) => {
    if (!confirm('Delete this group?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/whatsapp.php?action=delete_group&id=${id}`);
      fetchContactGroups();
    } catch (e) { alert('Failed'); }
  };

  // Retry failed message
  const retryFailedMessage = async (msg) => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/whatsapp.php?action=retry`, { message_id: msg.id });
      alert('✅ Message resent!');
      fetchHistory();
      fetchStats();
    } catch (e) { alert('Failed to retry'); }
    finally { setLoading(false); }
  };

  // Save fee reminder settings
  const handleSaveFeeReminder = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/whatsapp.php?action=save_fee_reminder`, feeReminderForm);
      alert('✅ Fee reminder settings saved!');
      setShowFeeReminderModal(false);
      fetchFeeReminders();
    } catch (e) { alert('Failed'); }
  };

  // Send to specific class
  const sendToClass = async () => {
    if (!selectedClass || !bulkMessage.message) {
      alert('Select a class and enter message');
      return;
    }
    await fetchClassParents(selectedClass);
  };

  const fetchRecipients = async (type) => {
    try {
      setLoading(true);
      let endpoint = '';
      if (type === 'all_parents') {
        endpoint = `${API_BASE_URL}/parents.php`;
      } else if (type === 'all_teachers') {
        endpoint = `${API_BASE_URL}/teachers.php`;
      } else if (type === 'class_parents') {
        endpoint = `${API_BASE_URL}/parents.php?has_students=true`;
      }
      
      const response = await axios.get(endpoint);
      const data = response.data.parents || response.data.teachers || [];
      setRecipients(data.map(r => ({
        id: r.id,
        name: `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.name,
        phone: r.phone || r.guardian_phone,
        type: type.includes('parent') ? 'parent' : 'teacher'
      })));
    } catch (error) {
      console.error('Error fetching recipients:', error);
      setRecipients([]);
    } finally {
      setLoading(false);
    }
  };

  const sendSingleMessage = async () => {
    if (!singleMessage.phone || !singleMessage.message) {
      alert('Please enter phone number and message');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/whatsapp.php?action=send`, {
        ...singleMessage,
        sent_by: user?.id
      });

      if (response.data.success) {
        if (response.data.sent_via === 'api') {
          // Message sent directly via WhatsApp Business API
          alert('✅ Message sent successfully via WhatsApp!');
        } else if (response.data.needs_config) {
          // API not configured - show configuration message
          alert(`⚠️ WhatsApp Business API not configured.\n\n${response.data.config_message}\n\nGo to Settings tab to configure the API, or click OK to open WhatsApp Web.`);
          if (response.data.link) {
            window.open(response.data.link, '_blank');
          }
        } else if (response.data.link) {
          // Fallback to WhatsApp link
          window.open(response.data.link, '_blank');
          alert('Message logged! WhatsApp opened in a new tab.');
        }
        setSingleMessage({ phone: '', recipient_name: '', message: '' });
        fetchStats();
        fetchHistory();
      } else {
        alert('Failed to send message: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const sendBulkMessages = async () => {
    if (recipients.length === 0 || !bulkMessage.message) {
      alert('Please select recipients and enter a message');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/whatsapp.php?action=send_bulk`, {
        recipients: recipients.filter(r => r.phone).map(r => ({
          phone: r.phone,
          name: r.name,
          type: r.type,
          parent_name: r.name,
          student_name: r.student_name || ''
        })),
        message: bulkMessage.message,
        template_name: bulkMessage.template_name,
        sent_by: user?.id
      });

      if (response.data.success) {
        alert(`${response.data.sent_count} messages logged successfully!`);
        
        // Open first few links (browser may block multiple popups)
        const links = response.data.results.slice(0, 3);
        links.forEach((result, index) => {
          setTimeout(() => window.open(result.link, '_blank'), index * 500);
        });
        
        fetchStats();
        fetchHistory();
      }
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      alert('Failed to send messages');
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!newTemplate.name || !newTemplate.message_template) {
      alert('Please enter template name and message');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${API_BASE_URL}/whatsapp.php?action=save_template`, newTemplate);
      alert('Template saved successfully!');
      setShowTemplateModal(false);
      setNewTemplate({ name: '', category: 'general', message_template: '', variables: [] });
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template) => {
    setSelectedTemplate(template);
    if (activeTab === 'send') {
      setSingleMessage(prev => ({ ...prev, message: template.message_template }));
    } else if (activeTab === 'bulk') {
      setBulkMessage(prev => ({ 
        ...prev, 
        message: template.message_template,
        template_name: template.name
      }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'sent': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '+$1 $2 $3');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-7 h-7 text-green-600" />
            WhatsApp Messaging
          </h1>
          <p className="text-gray-600 mt-1">Send WhatsApp messages to parents and staff</p>
        </div>
        <button
          onClick={() => { fetchStats(); fetchHistory(); }}
          className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-gradient-to-br from-green-500 to-green-600 text-white">
          <MessageCircle className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-sm opacity-80">Total Sent</p>
          <p className="text-2xl font-bold">{stats.total || 0}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <Send className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-sm opacity-80">Sent</p>
          <p className="text-2xl font-bold">{stats.sent || 0}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CheckCircle className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-sm opacity-80">Delivered</p>
          <p className="text-2xl font-bold">{stats.delivered || 0}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-red-500 to-red-600 text-white">
          <XCircle className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-sm opacity-80">Failed</p>
          <p className="text-2xl font-bold">{stats.failed || 0}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <Clock className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-sm opacity-80">Today</p>
          <p className="text-2xl font-bold">{stats.today || 0}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <Calendar className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-sm opacity-80">Scheduled</p>
          <p className="text-2xl font-bold">{scheduledMessages.length}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <Users className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-sm opacity-80">Groups</p>
          <p className="text-2xl font-bold">{contactGroups.length}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-teal-500 to-teal-600 text-white">
          <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-sm opacity-80">Delivery Rate</p>
          <p className="text-2xl font-bold">{analytics.deliveryRate || 0}%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'send', label: 'Send', icon: Send },
          { id: 'bulk', label: 'Bulk', icon: Users },
          { id: 'scheduled', label: 'Scheduled', icon: Calendar },
          { id: 'groups', label: 'Groups', icon: UserPlus },
          { id: 'templates', label: 'Templates', icon: FileText },
          { id: 'history', label: 'History', icon: History },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 },
          { id: 'fee_reminders', label: 'Fee Alerts', icon: DollarSign },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-md font-medium flex items-center gap-1 text-sm transition-colors ${
              activeTab === tab.id 
                ? 'bg-green-600 text-white shadow' 
                : 'hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Send Single Message */}
          {activeTab === 'send' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Send className="w-5 h-5 text-green-600" />
                Send Single Message
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={singleMessage.phone}
                      onChange={(e) => setSingleMessage({ ...singleMessage, phone: e.target.value })}
                      className="input"
                      placeholder="0241234567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={singleMessage.recipient_name}
                      onChange={(e) => setSingleMessage({ ...singleMessage, recipient_name: e.target.value })}
                      className="input"
                      placeholder="Parent Name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                  <textarea
                    value={singleMessage.message}
                    onChange={(e) => setSingleMessage({ ...singleMessage, message: e.target.value })}
                    className="input"
                    rows="5"
                    placeholder="Type your message here..."
                  />
                  <p className="text-xs text-gray-500 mt-1">{singleMessage.message.length} characters</p>
                </div>
                <button
                  onClick={sendSingleMessage}
                  disabled={loading}
                  className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send via WhatsApp
                </button>
                <p className="text-xs text-gray-500">
                  This will open WhatsApp Web/App with the message pre-filled.
                </p>
              </div>
            </div>
          )}

          {/* Bulk Message */}
          {activeTab === 'bulk' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Send Bulk Message
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Recipients</label>
                  <select
                    value={bulkMessage.recipient_type}
                    onChange={(e) => {
                      setBulkMessage({ ...bulkMessage, recipient_type: e.target.value });
                      fetchRecipients(e.target.value);
                    }}
                    className="input"
                  >
                    <option value="">Choose recipient group</option>
                    <option value="all_parents">All Parents</option>
                    <option value="all_teachers">All Teachers</option>
                    <option value="class_parents">Parents with Active Students</option>
                  </select>
                </div>

                {recipients.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {recipients.length} recipients selected
                    </p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {recipients.slice(0, 10).map((r, i) => (
                        <div key={i} className="text-sm text-gray-600 flex items-center gap-2">
                          <User className="w-3 h-3" />
                          {r.name} - {r.phone || 'No phone'}
                        </div>
                      ))}
                      {recipients.length > 10 && (
                        <p className="text-sm text-gray-500">...and {recipients.length - 10} more</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                  <textarea
                    value={bulkMessage.message}
                    onChange={(e) => setBulkMessage({ ...bulkMessage, message: e.target.value })}
                    className="input"
                    rows="5"
                    placeholder="Type your message here. Use {parent_name}, {student_name} for personalization."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Variables: {'{parent_name}'}, {'{student_name}'}, {'{amount}'}, {'{due_date}'}
                  </p>
                </div>

                <button
                  onClick={sendBulkMessages}
                  disabled={loading || recipients.length === 0}
                  className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send to {recipients.length} Recipients
                </button>
              </div>
            </div>
          )}

          {/* Templates */}
          {activeTab === 'templates' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Message Templates
                </h2>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Template
                </button>
              </div>
              
              <div className="space-y-3">
                {templates.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No templates yet</p>
                ) : (
                  templates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{template.name}</h3>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              {template.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{template.message_template}</p>
                        </div>
                        <button
                          onClick={() => applyTemplate(template)}
                          className="btn bg-green-100 text-green-700 hover:bg-green-200 text-sm"
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* History */}
          {activeTab === 'history' && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <History className="w-5 h-5 text-green-600" />
                    Message History ({filteredHistory.length})
                  </h2>
                  <div className="flex gap-2">
                    <button onClick={exportHistoryToPDF} className="btn bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm flex items-center gap-1"><Download className="w-4 h-4" /> PDF</button>
                    <button onClick={exportHistoryToCSV} className="btn bg-green-100 text-green-700 hover:bg-green-200 text-sm flex items-center gap-1"><FileSpreadsheet className="w-4 h-4" /> CSV</button>
                  </div>
                </div>
                {/* Filters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search..." value={historyFilter.search} onChange={(e) => setHistoryFilter({...historyFilter, search: e.target.value})} className="input pl-9 text-sm" />
                  </div>
                  <select value={historyFilter.status} onChange={(e) => setHistoryFilter({...historyFilter, status: e.target.value})} className="input text-sm">
                    <option value="">All Status</option>
                    <option value="sent">Sent</option>
                    <option value="delivered">Delivered</option>
                    <option value="failed">Failed</option>
                  </select>
                  <input type="date" value={historyFilter.dateFrom} onChange={(e) => setHistoryFilter({...historyFilter, dateFrom: e.target.value})} className="input text-sm" placeholder="From" />
                  <input type="date" value={historyFilter.dateTo} onChange={(e) => setHistoryFilter({...historyFilter, dateTo: e.target.value})} className="input text-sm" placeholder="To" />
                </div>
              </div>
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {filteredHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No messages found</p>
                ) : (
                  filteredHistory.map((msg) => (
                    <div key={msg.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(msg.status)}
                            <span className="font-medium">{msg.recipient_name || 'Unknown'}</span>
                            <span className="text-sm text-gray-500">{formatPhone(msg.recipient_phone || msg.phone)}</span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{msg.sent_at || msg.created_at}</p>
                        </div>
                        <div className="flex gap-1">
                          {msg.status === 'failed' && (
                            <button onClick={() => retryFailedMessage(msg)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title="Retry"><RotateCcw className="w-4 h-4" /></button>
                          )}
                          <a href={`https://wa.me/${msg.recipient_phone || msg.phone}`} target="_blank" rel="noopener noreferrer" className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><ExternalLink className="w-4 h-4" /></a>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Scheduled Messages */}
          {activeTab === 'scheduled' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-orange-600" /> Scheduled Messages</h2>
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
                            <span className={`px-2 py-0.5 rounded text-xs ${s.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : s.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.status}</span>
                            <span className="text-sm text-gray-500">{s.recipient_type}</span>
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-2">{s.message}</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> {s.scheduled_at}</p>
                          {s.repeat !== 'none' && <p className="text-xs text-blue-600">Repeats: {s.repeat}</p>}
                        </div>
                        {s.status === 'pending' && (
                          <button onClick={() => cancelScheduledMessage(s.id)} className="text-red-600 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contact Groups */}
          {activeTab === 'groups' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2"><UserPlus className="w-5 h-5 text-indigo-600" /> Contact Groups</h2>
                <button onClick={() => setShowGroupModal(true)} className="btn btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Group</button>
              </div>
              {contactGroups.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Users className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p>No contact groups</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contactGroups.map(g => (
                    <div key={g.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{g.name}</h3>
                          {g.description && <p className="text-sm text-gray-500">{g.description}</p>}
                          <p className="text-xs text-gray-400 mt-1">{g.member_count || 0} members</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setBulkMessage({...bulkMessage, recipient_type: `group_${g.id}`}); setActiveTab('bulk'); }} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Send to group"><Send className="w-4 h-4" /></button>
                          <button onClick={() => deleteGroup(g.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics */}
          {activeTab === 'analytics' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-6"><BarChart3 className="w-5 h-5 text-blue-600" /> Message Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <TrendingUp className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-green-700">{analytics.deliveryRate || 0}%</p>
                  <p className="text-sm text-green-600">Delivery Rate</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <MessageCircle className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-blue-700">{stats.total || 0}</p>
                  <p className="text-sm text-blue-600">Total Messages</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <Clock className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-bold text-purple-700">{analytics.avgResponseTime || 0}s</p>
                  <p className="text-sm text-purple-600">Avg Response Time</p>
                </div>
              </div>
              {/* Daily Stats */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Last 7 Days</h3>
                <div className="space-y-2">
                  {(analytics.daily || []).slice(0, 7).map((d, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-20">{d.date}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div className="bg-green-500 h-full" style={{ width: `${Math.min((d.count / (Math.max(...(analytics.daily || []).map(x => x.count)) || 1)) * 100, 100)}%` }}></div>
                      </div>
                      <span className="text-sm font-medium w-10 text-right">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Fee Reminders */}
          {activeTab === 'fee_reminders' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2"><DollarSign className="w-5 h-5 text-yellow-600" /> Fee Reminder Settings</h2>
                <button onClick={() => setShowFeeReminderModal(true)} className="btn btn-primary flex items-center gap-2"><Settings className="w-4 h-4" /> Configure</button>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-yellow-800 mb-2">💰 Automatic Fee Reminders</h3>
                <p className="text-sm text-yellow-700">Send automatic WhatsApp reminders to parents about upcoming or overdue fees.</p>
              </div>
              {/* Class-specific messaging */}
              <div className="border rounded-lg p-4 mb-4">
                <h3 className="font-medium mb-3 flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Send to Specific Class</h3>
                <div className="grid grid-cols-2 gap-3">
                  <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); if (e.target.value) fetchClassParents(e.target.value); }} className="input">
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name || c.name}</option>)}
                  </select>
                  <button onClick={sendToClass} disabled={!selectedClass} className="btn bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">Load Parents ({recipients.length})</button>
                </div>
              </div>
              {/* Fee reminder history */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-3">Recent Fee Reminders</h3>
                {feeReminders.length === 0 ? (
                  <p className="text-gray-500 text-sm">No fee reminders sent yet</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {feeReminders.map(r => (
                      <div key={r.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                        <span>{r.student_name} - GHS {r.amount}</span>
                        <span className="text-gray-500">{r.sent_at}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">WhatsApp Business API Settings</h2>
                  <p className="text-sm text-gray-500">Configure your WhatsApp Business Cloud API credentials</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-800 mb-2">📱 How to get WhatsApp Business API access:</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline">developers.facebook.com</a></li>
                  <li>Create a Meta Business Account (if you don't have one)</li>
                  <li>Create a new app and select "Business" type</li>
                  <li>Add WhatsApp product to your app</li>
                  <li>Get your Phone Number ID and Access Token from the WhatsApp settings</li>
                  <li>Copy the credentials below</li>
                </ol>
                <p className="text-xs text-blue-600 mt-2">
                  Note: WhatsApp Business API has a free tier with 1,000 free conversations per month.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Token (API Token) *
                  </label>
                  <input
                    type="password"
                    value={apiSettings.api_token}
                    onChange={(e) => setApiSettings({ ...apiSettings, api_token: e.target.value })}
                    className="input font-mono text-sm"
                    placeholder="EAAxxxxxxxxxxxxxxx..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Found in WhatsApp → API Setup → Temporary/Permanent Access Token
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number ID *
                  </label>
                  <input
                    type="text"
                    value={apiSettings.phone_number_id}
                    onChange={(e) => setApiSettings({ ...apiSettings, phone_number_id: e.target.value })}
                    className="input font-mono"
                    placeholder="1234567890123456"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Found in WhatsApp → API Setup → Phone Number ID
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Account ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={apiSettings.business_account_id}
                    onChange={(e) => setApiSettings({ ...apiSettings, business_account_id: e.target.value })}
                    className="input font-mono"
                    placeholder="1234567890123456"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Found in WhatsApp → API Setup → WhatsApp Business Account ID
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={saveApiSettings}
                    disabled={savingSettings || !apiSettings.api_token || !apiSettings.phone_number_id}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    {savingSettings ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Save API Settings
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-2">⚠️ Important Notes:</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Messages can only be sent to users who have opted-in or messaged you first</li>
                  <li>• Keep your Access Token secure - never share it publicly</li>
                  <li>• Test with your own number first before sending to parents</li>
                  <li>• Without API configuration, messages will open WhatsApp Web instead</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Quick Templates */}
        <div className="space-y-4">
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Templates</h3>
            <div className="space-y-2">
              {templates.slice(0, 5).map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <p className="font-medium text-sm text-gray-900">{template.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{template.category}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4 bg-green-50 border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">How it works</h3>
            <ul className="text-sm text-green-700 space-y-2">
              <li><strong>With API configured:</strong></li>
              <li>1. Enter phone number and message</li>
              <li>2. Click "Send via WhatsApp"</li>
              <li>3. Message is sent directly! ✅</li>
              <li className="pt-2"><strong>Without API:</strong></li>
              <li>• Opens WhatsApp Web to send manually</li>
            </ul>
            <p className="text-xs text-green-600 mt-3">
              Go to "API Settings" tab to configure direct sending.
            </p>
          </div>
        </div>
      </div>

      {/* New Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Template</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="input"
                  placeholder="e.g., fee_reminder_urgent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                  className="input"
                >
                  <option value="general">General</option>
                  <option value="fee_reminder">Fee Reminder</option>
                  <option value="attendance">Attendance</option>
                  <option value="exam">Exam</option>
                  <option value="admission">Admission</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Template</label>
                <textarea
                  value={newTemplate.message_template}
                  onChange={(e) => setNewTemplate({ ...newTemplate, message_template: e.target.value })}
                  className="input"
                  rows="4"
                  placeholder="Dear {parent_name}, ..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {'{variable_name}'} for dynamic content
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="btn bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveTemplate}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Message Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-orange-600" /> Schedule Message</h3>
              <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleScheduleMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Recipients</label>
                <select value={scheduleForm.recipient_type} onChange={(e) => setScheduleForm({...scheduleForm, recipient_type: e.target.value})} className="input">
                  <option value="all_parents">All Parents</option>
                  <option value="all_teachers">All Teachers</option>
                  <option value="class_parents">Parents with Active Students</option>
                  {contactGroups.map(g => <option key={g.id} value={`group_${g.id}`}>Group: {g.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date *</label>
                  <input type="date" value={scheduleForm.scheduled_date} onChange={(e) => setScheduleForm({...scheduleForm, scheduled_date: e.target.value})} className="input" required min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time *</label>
                  <input type="time" value={scheduleForm.scheduled_time} onChange={(e) => setScheduleForm({...scheduleForm, scheduled_time: e.target.value})} className="input" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Repeat</label>
                <select value={scheduleForm.repeat} onChange={(e) => setScheduleForm({...scheduleForm, repeat: e.target.value})} className="input">
                  <option value="none">Don't Repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Use Template</label>
                <select value={scheduleForm.template_id} onChange={(e) => { const t = templates.find(x => x.id == e.target.value); setScheduleForm({...scheduleForm, template_id: e.target.value, message: t?.message_template || scheduleForm.message}); }} className="input">
                  <option value="">-- Select Template --</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message *</label>
                <textarea value={scheduleForm.message} onChange={(e) => setScheduleForm({...scheduleForm, message: e.target.value})} className="input" rows="4" required placeholder="Type your message..." />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="btn bg-gray-200 hover:bg-gray-300">Cancel</button>
                <button type="submit" className="btn btn-primary flex items-center gap-2"><Calendar className="w-4 h-4" /> Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><UserPlus className="w-5 h-5 text-indigo-600" /> Create Contact Group</h3>
              <button onClick={() => setShowGroupModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Group Name *</label>
                <input type="text" value={groupForm.name} onChange={(e) => setGroupForm({...groupForm, name: e.target.value})} className="input" required placeholder="e.g., Grade 6 Parents" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <input type="text" value={groupForm.description} onChange={(e) => setGroupForm({...groupForm, description: e.target.value})} className="input" placeholder="Optional description" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Add Members From</label>
                <select onChange={async (e) => { if (e.target.value) { await fetchRecipients(e.target.value); setGroupForm({...groupForm, members: recipients.map(r => r.id)}); } }} className="input">
                  <option value="">-- Select Source --</option>
                  <option value="all_parents">All Parents</option>
                  <option value="all_teachers">All Teachers</option>
                </select>
                {groupForm.members.length > 0 && <p className="text-sm text-green-600 mt-1">{groupForm.members.length} members selected</p>}
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowGroupModal(false)} className="btn bg-gray-200 hover:bg-gray-300">Cancel</button>
                <button type="submit" className="btn btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Reminder Settings Modal */}
      {showFeeReminderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2"><DollarSign className="w-5 h-5 text-yellow-600" /> Fee Reminder Settings</h3>
              <button onClick={() => setShowFeeReminderModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSaveFeeReminder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Days Before Due Date</label>
                <input type="number" value={feeReminderForm.days_before_due} onChange={(e) => setFeeReminderForm({...feeReminderForm, days_before_due: parseInt(e.target.value)})} className="input" min="1" max="30" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message Template</label>
                <textarea value={feeReminderForm.message_template} onChange={(e) => setFeeReminderForm({...feeReminderForm, message_template: e.target.value})} className="input" rows="4" placeholder="Dear {parent_name}, this is a reminder that fees of GHS {amount} for {student_name} is due on {due_date}..." />
                <p className="text-xs text-gray-500 mt-1">Variables: {'{parent_name}'}, {'{student_name}'}, {'{amount}'}, {'{due_date}'}</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={feeReminderForm.auto_send} onChange={(e) => setFeeReminderForm({...feeReminderForm, auto_send: e.target.checked})} className="w-4 h-4" />
                  <span className="text-sm">Enable automatic sending</span>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={feeReminderForm.include_amount} onChange={(e) => setFeeReminderForm({...feeReminderForm, include_amount: e.target.checked})} className="w-4 h-4" />
                  <span className="text-sm">Include fee amount in message</span>
                </label>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowFeeReminderModal(false)} className="btn bg-gray-200 hover:bg-gray-300">Cancel</button>
                <button type="submit" className="btn btn-primary flex items-center gap-2"><Save className="w-4 h-4" /> Save Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
