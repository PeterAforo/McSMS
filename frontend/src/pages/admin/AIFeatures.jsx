import { useState, useEffect } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Brain, TrendingUp, MessageSquare, Lightbulb, AlertTriangle, Target, BookOpen, Send, RefreshCw, CheckCircle, XCircle, Eye, Zap, BarChart3, Users, DollarSign, GraduationCap, Clock, AlertCircle, Search, Download, FileText, Settings, History, Mail, Calendar, Filter, PieChart, Activity, Play, Pause, Trash2, Edit, Plus, Save, X } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const API = `${API_BASE_URL}/ai_features.php`;

export default function AIFeatures() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [predictions, setPredictions] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [insights, setInsights] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [sessionId, setSessionId] = useState('web_' + Date.now());
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalType, setModalType] = useState('');

  // Enhanced state for new features
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [accuracyData, setAccuracyData] = useState([]);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [trainingData, setTrainingData] = useState([]);
  const [modelSettings, setModelSettings] = useState({});
  const [batchStudents, setBatchStudents] = useState([]);
  const [alertSettings, setAlertSettings] = useState({ email_alerts: true, risk_threshold: 70, anomaly_alerts: true });
  const [analyticsData, setAnalyticsData] = useState({ predictions_by_type: [], accuracy_trend: [], insights_by_category: [] });

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
    fetchAnalytics();
    fetchModelSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'predictions') fetchPredictions();
    if (activeTab === 'recommendations') fetchRecommendations();
    if (activeTab === 'insights') fetchInsights();
    if (activeTab === 'anomalies') fetchAnomalies();
    if (activeTab === 'accuracy') fetchAccuracyData();
    if (activeTab === 'scheduled') fetchScheduledTasks();
    if (activeTab === 'chat_history') fetchChatSessions();
    if (activeTab === 'training') fetchTrainingData();
    if (activeTab === 'learning') fetchLearningPaths();
  }, [activeTab]);

  const fetchStudents = async () => { try { const r = await axios.get(`${API_BASE_URL}/students.php`); setStudents(r.data.students || []); } catch (e) { console.error(e); } };
  const fetchSubjects = async () => { try { const r = await axios.get(`${API_BASE_URL}/subjects.php`); setSubjects(r.data.subjects || []); } catch (e) { console.error(e); } };
  const fetchPredictions = async () => { try { const r = await axios.get(`${API}?resource=predictions`); setPredictions(r.data.predictions || []); } catch (e) { console.error(e); } };
  const fetchRecommendations = async () => { try { const r = await axios.get(`${API}?resource=recommendations&action=pending`); setRecommendations(r.data.recommendations || []); } catch (e) { console.error(e); } };
  const fetchInsights = async () => { try { const r = await axios.get(`${API}?resource=insights&action=active`); setInsights(r.data.insights || []); } catch (e) { console.error(e); } };
  const fetchAnomalies = async () => { try { const r = await axios.get(`${API}?resource=anomalies&action=open`); setAnomalies(r.data.anomalies || []); } catch (e) { console.error(e); } };

  // New fetch functions
  const fetchAccuracyData = async () => { try { const r = await axios.get(`${API}?resource=predictions&action=accuracy`); setAccuracyData(r.data.accuracy || []); } catch (e) { console.error(e); } };
  const fetchScheduledTasks = async () => { try { const r = await axios.get(`${API}?resource=scheduled_tasks`); setScheduledTasks(r.data.tasks || []); } catch (e) { console.error(e); } };
  const fetchChatSessions = async () => { try { const r = await axios.get(`${API}?resource=chatbot&action=sessions`); setChatSessions(r.data.sessions || []); } catch (e) { console.error(e); } };
  const fetchTrainingData = async () => { try { const r = await axios.get(`${API}?resource=chatbot&action=training_data`); setTrainingData(r.data.training_data || []); } catch (e) { console.error(e); } };
  const fetchModelSettings = async () => { try { const r = await axios.get(`${API}?resource=settings`); setModelSettings(r.data.settings || {}); setAlertSettings(r.data.alert_settings || alertSettings); } catch (e) { console.error(e); } };
  const fetchAnalytics = async () => { try { const r = await axios.get(`${API}?resource=analytics`); setAnalyticsData(r.data.analytics || analyticsData); } catch (e) { console.error(e); } };
  const fetchLearningPaths = async () => { try { const r = await axios.get(`${API}?resource=learning_paths`); setLearningPaths(r.data.learning_paths || []); } catch (e) { console.error(e); } };

  // Filter functions
  const filteredPredictions = predictions.filter(p => {
    const matchesSearch = !searchTerm || p.entity_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || p.prediction_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const filteredInsights = insights.filter(i => {
    const matchesSearch = !searchTerm || i.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || i.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredAnomalies = anomalies.filter(a => {
    const matchesSearch = !searchTerm || a.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || a.anomaly_type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Export functions
  const exportToPDF = (type) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`AI ${type.charAt(0).toUpperCase() + type.slice(1)} Report`, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    
    if (type === 'predictions') {
      autoTable(doc, { startY: 35, head: [['Type', 'Entity', 'Confidence', 'Date', 'Status']], body: filteredPredictions.map(p => [p.prediction_type, `${p.entity_type} #${p.entity_id}`, `${((p.confidence_score || 0) * 100).toFixed(0)}%`, p.prediction_date, p.status]) });
    } else if (type === 'insights') {
      autoTable(doc, { startY: 35, head: [['Title', 'Category', 'Impact', 'Confidence']], body: filteredInsights.map(i => [i.title, i.category, i.impact_level, `${((i.confidence_level || 0) * 100).toFixed(0)}%`]) });
    } else if (type === 'anomalies') {
      autoTable(doc, { startY: 35, head: [['Type', 'Entity', 'Severity', 'Deviation', 'Date']], body: filteredAnomalies.map(a => [a.anomaly_type, `${a.entity_type} #${a.entity_id}`, a.severity, `${a.deviation_percentage?.toFixed(1)}%`, a.detection_date]) });
    }
    doc.save(`ai_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = (type) => {
    let csv = '';
    if (type === 'predictions') {
      csv = 'Type,Entity,Confidence,Date,Status\n' + filteredPredictions.map(p => `${p.prediction_type},${p.entity_type} #${p.entity_id},${((p.confidence_score || 0) * 100).toFixed(0)}%,${p.prediction_date},${p.status}`).join('\n');
    } else if (type === 'insights') {
      csv = 'Title,Category,Impact,Confidence\n' + filteredInsights.map(i => `"${i.title}",${i.category},${i.impact_level},${((i.confidence_level || 0) * 100).toFixed(0)}%`).join('\n');
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ai_${type}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  // Batch predictions
  const handleBatchPredictions = async (predictionType) => {
    if (batchStudents.length === 0) { alert('Select students first'); return; }
    setLoading(true);
    try {
      const r = await axios.post(`${API}?resource=predictions&action=batch`, { student_ids: batchStudents, prediction_type: predictionType });
      if (r.data.success) {
        alert(`✅ Generated ${r.data.count} predictions!`);
        fetchPredictions();
        setBatchStudents([]);
      }
    } catch (e) { alert('Failed'); }
    setLoading(false);
  };

  // Scheduled tasks
  const handleSaveScheduledTask = async (e) => {
    e.preventDefault();
    try {
      if (modalData?.id) {
        await axios.put(`${API}?resource=scheduled_tasks&id=${modalData.id}`, modalData);
      } else {
        await axios.post(`${API}?resource=scheduled_tasks`, modalData);
      }
      alert('✅ Task saved!');
      fetchScheduledTasks();
      setShowModal(false);
    } catch (e) { alert('Failed'); }
  };

  const handleToggleTask = async (id, status) => {
    try {
      await axios.put(`${API}?resource=scheduled_tasks&id=${id}&action=toggle`, { status: status === 'active' ? 'paused' : 'active' });
      fetchScheduledTasks();
    } catch (e) { alert('Failed'); }
  };

  // Anomaly resolution
  const handleResolveAnomaly = async (id, notes) => {
    try {
      await axios.put(`${API}?resource=anomalies&id=${id}&action=resolve`, { resolution_notes: notes });
      alert('✅ Anomaly resolved!');
      fetchAnomalies();
    } catch (e) { alert('Failed'); }
  };

  // Training data
  const handleSaveTrainingData = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}?resource=chatbot&action=add_training`, modalData);
      alert('✅ Training data added!');
      fetchTrainingData();
      setShowModal(false);
    } catch (e) { alert('Failed'); }
  };

  // Model settings
  const handleSaveSettings = async () => {
    try {
      await axios.put(`${API}?resource=settings`, { settings: modelSettings, alert_settings: alertSettings });
      alert('✅ Settings saved!');
    } catch (e) { alert('Failed'); }
  };

  // Learning path progress
  const handleUpdateProgress = async (pathId, milestone, completed) => {
    try {
      await axios.put(`${API}?resource=learning_paths&id=${pathId}&action=progress`, { milestone, completed });
      fetchLearningPaths();
    } catch (e) { alert('Failed'); }
  };

  const handlePredictPerformance = async () => {
    if (!selectedStudent) { alert('Select a student'); return; }
    setLoading(true);
    try {
      const r = await axios.get(`${API}?resource=predictions&action=student_performance&student_id=${selectedStudent}`);
      if (r.data.success) {
        setModalData({ type: 'prediction', title: 'Performance Prediction', data: r.data.prediction });
        setShowModal(true);
        fetchPredictions();
      }
    } catch (e) { alert('Failed'); }
    setLoading(false);
  };

  const handleDropoutRisk = async () => {
    if (!selectedStudent) { alert('Select a student'); return; }
    setLoading(true);
    try {
      const r = await axios.get(`${API}?resource=predictions&action=dropout_risk&student_id=${selectedStudent}`);
      if (r.data.success) {
        setModalData({ type: 'risk', title: 'Dropout Risk Assessment', data: r.data.risk_assessment });
        setShowModal(true);
        fetchPredictions();
      }
    } catch (e) { alert('Failed'); }
    setLoading(false);
  };

  const handleFinancialForecast = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}?resource=predictions&action=financial_forecast&months=3`);
      if (r.data.success) {
        setModalData({ type: 'forecast', title: 'Financial Forecast (3 Months)', data: r.data.forecast });
        setShowModal(true);
        fetchPredictions();
      }
    } catch (e) { alert('Failed'); }
    setLoading(false);
  };

  const handleGenerateRecommendations = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}?resource=recommendations&action=generate&target_type=school&target_id=1`);
      if (r.data.success) {
        alert(`✅ Generated ${r.data.recommendations.length} recommendations!`);
        fetchRecommendations();
      }
    } catch (e) { alert('Failed'); }
    setLoading(false);
  };

  const handleImplementRecommendation = async (id) => {
    try {
      await axios.put(`${API}?resource=recommendations&id=${id}&action=implement`, {});
      alert('✅ Recommendation marked as implemented!');
      fetchRecommendations();
    } catch (e) { alert('Failed'); }
  };

  const handleDismissRecommendation = async (id) => {
    try {
      await axios.put(`${API}?resource=recommendations&id=${id}&action=dismiss`, {});
      fetchRecommendations();
    } catch (e) { alert('Failed'); }
  };

  const handleGenerateInsights = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}?resource=insights&action=generate`);
      if (r.data.success) {
        alert(`✅ Generated ${r.data.insights.length} insights!`);
        fetchInsights();
      }
    } catch (e) { alert('Failed'); }
    setLoading(false);
  };

  const handleDetectAnomalies = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}?resource=anomalies&action=detect`);
      if (r.data.success) {
        alert(`✅ Detected ${r.data.anomalies.length} anomalies!`);
        fetchAnomalies();
      }
    } catch (e) { alert('Failed'); }
    setLoading(false);
  };

  const handleGenerateLearningPath = async () => {
    if (!selectedStudent || !selectedSubject) { alert('Select student and subject'); return; }
    setLoading(true);
    try {
      const r = await axios.get(`${API}?resource=learning_paths&action=generate&student_id=${selectedStudent}&subject_id=${selectedSubject}`);
      if (r.data.success) {
        setModalData({ type: 'learning_path', title: 'Personalized Learning Path', data: r.data.learning_path });
        setShowModal(true);
      }
    } catch (e) { alert('Failed'); }
    setLoading(false);
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const userMsg = { role: 'user', message: chatMessage, timestamp: new Date().toISOString() };
    setChatHistory(prev => [...prev, userMsg]);
    const msg = chatMessage;
    setChatMessage('');
    try {
      const r = await axios.post(`${API}?resource=chatbot&action=message`, { message: msg, session_id: sessionId });
      if (r.data.success) {
        setChatHistory(prev => [...prev, { role: 'bot', message: r.data.response, confidence: r.data.confidence, timestamp: new Date().toISOString() }]);
      }
    } catch (e) { setChatHistory(prev => [...prev, { role: 'bot', message: 'Sorry, I encountered an error.', timestamp: new Date().toISOString() }]); }
  };

  const getSeverityBadge = (s) => ({ low: 'bg-green-100 text-green-800', medium: 'bg-yellow-100 text-yellow-800', high: 'bg-orange-100 text-orange-800', critical: 'bg-red-100 text-red-800' }[s] || 'bg-gray-100 text-gray-800');
  const getPriorityBadge = (p) => ({ low: 'bg-gray-100 text-gray-800', medium: 'bg-blue-100 text-blue-800', high: 'bg-orange-100 text-orange-800', critical: 'bg-red-100 text-red-800' }[p] || 'bg-gray-100 text-gray-800');
  const getImpactBadge = (i) => ({ low: 'bg-gray-100 text-gray-800', medium: 'bg-blue-100 text-blue-800', high: 'bg-purple-100 text-purple-800' }[i] || 'bg-gray-100 text-gray-800');
  const getCategoryIcon = (cat) => ({ school: Users, academic: GraduationCap, attendance: Clock, teachers: Users, classes: Users, finance: DollarSign, subjects: BookOpen, system: Brain }[cat] || Lightbulb);
  const getCategoryColor = (cat) => ({ school: 'text-blue-600', academic: 'text-purple-600', attendance: 'text-orange-600', teachers: 'text-green-600', classes: 'text-cyan-600', finance: 'text-emerald-600', subjects: 'text-pink-600', system: 'text-gray-600' }[cat] || 'text-yellow-600');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><Brain className="text-purple-600" size={32} />AI Features</h1>
          <p className="text-gray-600 mt-1">Artificial Intelligence powered insights and automation</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exportToPDF(activeTab)} className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"><Download size={16} /> PDF</button>
          <button onClick={() => exportToCSV(activeTab)} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"><FileText size={16} /> CSV</button>
          <button onClick={() => { setModalType('settings'); setShowModal(true); }} className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"><Settings size={16} /> Settings</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-lg shadow-lg text-white"><Brain size={20} className="mb-1" /><p className="text-purple-100 text-xs">Predictions</p><p className="text-lg font-bold">{predictions.length}</p></div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg shadow-lg text-white"><Target size={20} className="mb-1" /><p className="text-blue-100 text-xs">Recommendations</p><p className="text-lg font-bold">{recommendations.length}</p></div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-3 rounded-lg shadow-lg text-white"><Lightbulb size={20} className="mb-1" /><p className="text-yellow-100 text-xs">Insights</p><p className="text-lg font-bold">{insights.length}</p></div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-lg shadow-lg text-white"><AlertTriangle size={20} className="mb-1" /><p className="text-red-100 text-xs">Anomalies</p><p className="text-lg font-bold">{anomalies.length}</p></div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-lg shadow-lg text-white"><MessageSquare size={20} className="mb-1" /><p className="text-green-100 text-xs">Chatbot</p><p className="text-lg font-bold">Online</p></div>
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-3 rounded-lg shadow-lg text-white"><BookOpen size={20} className="mb-1" /><p className="text-cyan-100 text-xs">Learning Paths</p><p className="text-lg font-bold">{learningPaths.length}</p></div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-lg shadow-lg text-white"><Calendar size={20} className="mb-1" /><p className="text-indigo-100 text-xs">Scheduled</p><p className="text-lg font-bold">{scheduledTasks.length}</p></div>
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-3 rounded-lg shadow-lg text-white"><Activity size={20} className="mb-1" /><p className="text-pink-100 text-xs">Accuracy</p><p className="text-lg font-bold">{accuracyData.length > 0 ? `${Math.round(accuracyData.reduce((s, a) => s + (a.accuracy || 0), 0) / accuracyData.length)}%` : 'N/A'}</p></div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">All Types</option>
            <option value="performance">Performance</option>
            <option value="dropout_risk">Dropout Risk</option>
            <option value="financial">Financial</option>
            <option value="attendance">Attendance</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="">All Categories</option>
            <option value="academic">Academic</option>
            <option value="attendance">Attendance</option>
            <option value="finance">Finance</option>
            <option value="teachers">Teachers</option>
          </select>
          <button onClick={() => { setSearchTerm(''); setTypeFilter(''); setCategoryFilter(''); }} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <div className="flex flex-wrap">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: PieChart },
              { id: 'predictions', label: 'Predictions', icon: TrendingUp },
              { id: 'recommendations', label: 'Recommend', icon: Target },
              { id: 'chatbot', label: 'Chatbot', icon: MessageSquare },
              { id: 'insights', label: 'Insights', icon: Lightbulb },
              { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
              { id: 'learning', label: 'Learning', icon: BookOpen },
              { id: 'accuracy', label: 'Accuracy', icon: Activity },
              { id: 'scheduled', label: 'Scheduled', icon: Calendar },
              { id: 'chat_history', label: 'Chat History', icon: History },
              { id: 'training', label: 'Training', icon: Brain },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-2 font-medium flex items-center gap-1 text-xs ${activeTab === tab.id ? 'border-b-2 border-purple-600 text-purple-600 bg-purple-50' : 'text-gray-600 hover:bg-gray-50'}`}><tab.icon size={14} /> {tab.label}</button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2"><PieChart className="text-purple-600" /> AI Analytics Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Predictions by Type */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Predictions by Type</h4>
                  <div className="space-y-2">
                    {[{ type: 'Performance', count: predictions.filter(p => p.prediction_type === 'performance').length, color: 'bg-purple-500' },
                      { type: 'Dropout Risk', count: predictions.filter(p => p.prediction_type === 'dropout_risk').length, color: 'bg-red-500' },
                      { type: 'Financial', count: predictions.filter(p => p.prediction_type === 'financial').length, color: 'bg-green-500' }
                    ].map(item => (
                      <div key={item.type} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${item.color}`}></div>
                        <span className="flex-1 text-sm">{item.type}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Insights by Category */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Insights by Category</h4>
                  <div className="space-y-2">
                    {['academic', 'attendance', 'finance', 'teachers'].map(cat => (
                      <div key={cat} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${cat === 'academic' ? 'bg-purple-500' : cat === 'attendance' ? 'bg-orange-500' : cat === 'finance' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                        <span className="flex-1 text-sm capitalize">{cat}</span>
                        <span className="font-medium">{insights.filter(i => i.category === cat).length}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Anomalies by Severity */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Anomalies by Severity</h4>
                  <div className="space-y-2">
                    {['critical', 'high', 'medium', 'low'].map(sev => (
                      <div key={sev} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded ${sev === 'critical' ? 'bg-red-600' : sev === 'high' ? 'bg-orange-500' : sev === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                        <span className="flex-1 text-sm capitalize">{sev}</span>
                        <span className="font-medium">{anomalies.filter(a => a.severity === sev).length}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Batch Predictions */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-4 flex items-center gap-2"><Zap className="text-yellow-600" /> Batch Predictions</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Students ({batchStudents.length} selected)</label>
                    <div className="border rounded-lg p-2 max-h-40 overflow-y-auto">
                      {students.slice(0, 50).map(s => (
                        <label key={s.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded text-sm">
                          <input type="checkbox" checked={batchStudents.includes(s.id)} onChange={(e) => setBatchStudents(e.target.checked ? [...batchStudents, s.id] : batchStudents.filter(id => id !== s.id))} />
                          {s.first_name} {s.last_name}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 justify-center">
                    <button onClick={() => handleBatchPredictions('performance')} disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"><GraduationCap size={18} /> Batch Performance</button>
                    <button onClick={() => handleBatchPredictions('dropout_risk')} disabled={loading} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"><AlertCircle size={18} /> Batch Dropout Risk</button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Run predictions for multiple students at once. Select students from the list and choose a prediction type.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* PREDICTIONS TAB */}
          {activeTab === 'predictions' && (
            <div>
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Zap className="text-purple-600" /> Generate New Prediction</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div><label className="block text-sm font-medium mb-1">Select Student</label><select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="w-full border rounded-lg px-3 py-2"><option value="">Choose student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select></div>
                  <button onClick={handlePredictPerformance} disabled={loading} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"><GraduationCap size={18} /> Predict Performance</button>
                  <button onClick={handleDropoutRisk} disabled={loading} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"><AlertCircle size={18} /> Dropout Risk</button>
                  <button onClick={handleFinancialForecast} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"><DollarSign size={18} /> Financial Forecast</button>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-4">Recent Predictions</h3>
              {predictions.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><TrendingUp size={48} className="mx-auto mb-4 text-gray-300" /><p>No predictions yet. Generate one above!</p></div>
              ) : (
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th></tr></thead>
                  <tbody className="divide-y">{predictions.slice(0, 10).map(p => (<tr key={p.id} className="hover:bg-gray-50"><td className="px-4 py-3 capitalize font-medium">{p.prediction_type?.replace('_', ' ')}</td><td className="px-4 py-3">{p.entity_type} #{p.entity_id}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-20 bg-gray-200 rounded-full h-2"><div className="bg-purple-600 h-2 rounded-full" style={{width: `${(p.confidence_score || 0) * 100}%`}}></div></div><span className="text-sm">{((p.confidence_score || 0) * 100).toFixed(0)}%</span></div></td><td className="px-4 py-3 text-sm">{p.prediction_date}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${p.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.status}</span></td></tr>))}</tbody>
                </table></div>
              )}
            </div>
          )}

          {/* RECOMMENDATIONS TAB */}
          {activeTab === 'recommendations' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">AI Recommendations</h3><button onClick={handleGenerateRecommendations} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Generate New</button></div>
              {recommendations.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Target size={48} className="mx-auto mb-4 text-gray-300" /><p>No pending recommendations</p></div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map(r => (
                    <div key={r.id} className={`border rounded-lg p-4 ${r.priority === 'critical' ? 'border-red-300 bg-red-50' : r.priority === 'high' ? 'border-orange-300 bg-orange-50' : ''}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div><h4 className="font-semibold">{r.title}</h4><p className="text-xs text-gray-500 capitalize">{r.recommendation_type?.replace('_', ' ')} • {r.target_type}</p></div>
                        <div className="flex gap-2"><span className={`px-2 py-1 rounded text-xs ${getPriorityBadge(r.priority)}`}>{r.priority}</span><span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">{((r.confidence_score || 0) * 100).toFixed(0)}% confidence</span></div>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{r.description}</p>
                      {r.expected_impact && <p className="text-sm text-blue-600 mb-2"><strong>Expected Impact:</strong> {r.expected_impact}</p>}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleImplementRecommendation(r.id)} className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 flex items-center gap-1"><CheckCircle size={14} /> Implement</button>
                        <button onClick={() => handleDismissRecommendation(r.id)} className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 flex items-center gap-1"><XCircle size={14} /> Dismiss</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CHATBOT TAB */}
          {activeTab === 'chatbot' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><MessageSquare className="text-green-600" /> AI Assistant</h3>
              <div className="border rounded-lg h-[500px] flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {chatHistory.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20"><MessageSquare className="mx-auto mb-2 text-gray-300" size={48} /><p>Start a conversation with the AI assistant</p><p className="text-sm mt-2">Try asking about admissions, fees, timetables, or results!</p></div>
                  ) : (
                    chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-md px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border shadow-sm'}`}>
                          <p>{msg.message}</p>
                          {msg.confidence && <p className="text-xs mt-1 opacity-70">Confidence: {(msg.confidence * 100).toFixed(0)}%</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleChatSubmit} className="border-t p-4 bg-white">
                  <div className="flex gap-2"><input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Ask me anything about the school..." className="flex-1 border rounded-lg px-4 py-2" /><button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"><Send size={18} /> Send</button></div>
                </form>
              </div>
            </div>
          )}

          {/* INSIGHTS TAB */}
          {activeTab === 'insights' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">School-Wide AI Insights</h3><button onClick={handleGenerateInsights} disabled={loading} className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Generate Insights</button></div>
              <p className="text-sm text-gray-500 mb-4">Comprehensive analysis of students, teachers, classes, subjects, attendance, and finances</p>
              {insights.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Lightbulb size={48} className="mx-auto mb-4 text-gray-300" /><p>No active insights. Generate some!</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {insights.map((i, idx) => {
                    const CategoryIcon = getCategoryIcon(i.category);
                    return (
                      <div key={i.id || idx} className={`border rounded-lg p-4 hover:shadow-lg transition-shadow ${i.impact_level === 'high' ? 'border-l-4 border-l-red-500' : i.impact_level === 'medium' ? 'border-l-4 border-l-yellow-500' : 'border-l-4 border-l-green-500'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2"><CategoryIcon className={getCategoryColor(i.category)} size={20} /><h4 className="font-semibold text-sm">{i.title}</h4></div>
                          <span className={`px-2 py-1 rounded text-xs ${getImpactBadge(i.impact_level)}`}>{i.impact_level}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{i.description}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs capitalize">{i.category}</span>
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">{((i.confidence_level || i.confidence || 0) * 100).toFixed(0)}% confidence</span>
                        </div>
                        {i.recommended_actions && <div className="bg-blue-50 p-2 rounded text-xs text-blue-700"><strong>Action:</strong> {i.recommended_actions}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ANOMALIES TAB */}
          {activeTab === 'anomalies' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Anomaly Detection</h3><button onClick={handleDetectAnomalies} disabled={loading} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Detect Anomalies</button></div>
              {anomalies.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><AlertTriangle size={48} className="mx-auto mb-4 text-gray-300" /><p>No open anomalies detected</p></div>
              ) : (
                <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deviation</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detected</th></tr></thead>
                  <tbody className="divide-y">{anomalies.map(a => (<tr key={a.id} className={`hover:bg-gray-50 ${a.severity === 'critical' ? 'bg-red-50' : a.severity === 'high' ? 'bg-orange-50' : ''}`}><td className="px-4 py-3 capitalize font-medium">{a.anomaly_type}</td><td className="px-4 py-3">{a.entity_type} #{a.entity_id}</td><td className="px-4 py-3 text-sm max-w-xs">{a.description}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${getSeverityBadge(a.severity)}`}>{a.severity}</span></td><td className="px-4 py-3 text-sm">{a.deviation_percentage?.toFixed(1)}%</td><td className="px-4 py-3 text-sm">{a.detection_date?.substring(0, 10)}</td></tr>))}</tbody>
                </table></div>
              )}
            </div>
          )}

          {/* LEARNING PATHS TAB */}
          {activeTab === 'learning' && (
            <div>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><BookOpen className="text-green-600" /> Generate Personalized Learning Path</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div><label className="block text-sm font-medium mb-1">Select Student</label><select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="w-full border rounded-lg px-3 py-2"><option value="">Choose student...</option>{students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Select Subject</label><select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full border rounded-lg px-3 py-2"><option value="">Choose subject...</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}</select></div>
                  <button onClick={handleGenerateLearningPath} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"><BookOpen size={18} /> Generate Path</button>
                </div>
              </div>
              {learningPaths.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><BookOpen size={48} className="mx-auto mb-4 text-gray-300" /><p>No learning paths yet. Generate one above!</p></div>
              ) : (
                <div className="space-y-4">
                  {learningPaths.map(lp => (
                    <div key={lp.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div><h4 className="font-semibold">{lp.student_name} - {lp.subject_name}</h4><p className="text-sm text-gray-500">Level: {lp.current_level} → {lp.target_level}</p></div>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{lp.progress || 0}% complete</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3"><div className="bg-green-600 h-2 rounded-full" style={{width: `${lp.progress || 0}%`}}></div></div>
                      {lp.milestones && <div className="space-y-1">{lp.milestones.map((m, i) => (<div key={i} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={m.completed} onChange={(e) => handleUpdateProgress(lp.id, i, e.target.checked)} /><span className={m.completed ? 'line-through text-gray-400' : ''}>{m.title}</span></div>))}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACCURACY TAB */}
          {activeTab === 'accuracy' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><Activity className="text-pink-600" /> Prediction Accuracy Tracking</h3><button onClick={fetchAccuracyData} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"><RefreshCw size={18} /> Refresh</button></div>
              {accuracyData.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Activity size={48} className="mx-auto mb-4 text-gray-300" /><p>No accuracy data yet. Predictions need actual outcomes to compare.</p></div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200"><p className="text-green-600 text-sm">Average Accuracy</p><p className="text-2xl font-bold text-green-700">{Math.round(accuracyData.reduce((s, a) => s + (a.accuracy || 0), 0) / accuracyData.length)}%</p></div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200"><p className="text-purple-600 text-sm">Total Predictions</p><p className="text-2xl font-bold text-purple-700">{accuracyData.length}</p></div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200"><p className="text-blue-600 text-sm">Verified</p><p className="text-2xl font-bold text-blue-700">{accuracyData.filter(a => a.verified).length}</p></div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200"><p className="text-yellow-600 text-sm">Pending</p><p className="text-2xl font-bold text-yellow-700">{accuracyData.filter(a => !a.verified).length}</p></div>
                  </div>
                  <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Predicted</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accuracy</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th></tr></thead>
                    <tbody className="divide-y">{accuracyData.map(a => (<tr key={a.id} className="hover:bg-gray-50"><td className="px-4 py-3 capitalize">{a.prediction_type}</td><td className="px-4 py-3">{a.predicted_value}</td><td className="px-4 py-3">{a.actual_value || 'Pending'}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-16 bg-gray-200 rounded-full h-2"><div className={`h-2 rounded-full ${a.accuracy >= 80 ? 'bg-green-600' : a.accuracy >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${a.accuracy || 0}%`}}></div></div><span className="text-sm">{a.accuracy?.toFixed(0) || '-'}%</span></div></td><td className="px-4 py-3 text-sm">{a.prediction_date}</td></tr>))}</tbody>
                  </table></div>
                </div>
              )}
            </div>
          )}

          {/* SCHEDULED TAB */}
          {activeTab === 'scheduled' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><Calendar className="text-indigo-600" /> Scheduled AI Tasks</h3><button onClick={() => { setModalType('scheduled_task'); setModalData({ task_name: '', task_type: 'batch_predictions', schedule: 'daily', time: '08:00', enabled: true }); setShowModal(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"><Plus size={18} /> Add Task</button></div>
              {scheduledTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Calendar size={48} className="mx-auto mb-4 text-gray-300" /><p>No scheduled tasks. Add one to automate AI predictions.</p></div>
              ) : (
                <div className="space-y-3">
                  {scheduledTasks.map(t => (
                    <div key={t.id} className={`border rounded-lg p-4 ${t.status === 'paused' ? 'bg-gray-50' : ''}`}>
                      <div className="flex justify-between items-center">
                        <div><h4 className="font-semibold">{t.task_name}</h4><p className="text-sm text-gray-500 capitalize">{t.task_type?.replace('_', ' ')} • {t.schedule} at {t.time}</p></div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${t.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{t.status}</span>
                          <button onClick={() => handleToggleTask(t.id, t.status)} className={`p-2 rounded ${t.status === 'active' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{t.status === 'active' ? <Pause size={16} /> : <Play size={16} />}</button>
                          <button onClick={() => { setModalType('scheduled_task'); setModalData(t); setShowModal(true); }} className="p-2 bg-gray-100 rounded"><Edit size={16} /></button>
                        </div>
                      </div>
                      {t.last_run && <p className="text-xs text-gray-400 mt-2">Last run: {t.last_run}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CHAT HISTORY TAB */}
          {activeTab === 'chat_history' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><History className="text-gray-600" /> Chat Sessions History</h3><button onClick={fetchChatSessions} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2"><RefreshCw size={18} /> Refresh</button></div>
              {chatSessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><History size={48} className="mx-auto mb-4 text-gray-300" /><p>No chat sessions recorded yet</p></div>
              ) : (
                <div className="space-y-3">
                  {chatSessions.map(s => (
                    <div key={s.id} className="border rounded-lg p-4 hover:shadow-lg cursor-pointer" onClick={() => { setModalType('chat_session'); setModalData(s); setShowModal(true); }}>
                      <div className="flex justify-between items-start">
                        <div><p className="font-medium">Session: {s.session_id}</p><p className="text-sm text-gray-500">{s.message_count} messages</p></div>
                        <span className="text-xs text-gray-400">{s.created_at}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TRAINING TAB */}
          {activeTab === 'training' && (
            <div>
              <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold flex items-center gap-2"><Brain className="text-purple-600" /> Chatbot Training Data</h3><button onClick={() => { setModalType('training'); setModalData({ question: '', answer: '', category: 'general' }); setShowModal(true); }} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"><Plus size={18} /> Add Q&A</button></div>
              {trainingData.length === 0 ? (
                <div className="text-center py-12 text-gray-500"><Brain size={48} className="mx-auto mb-4 text-gray-300" /><p>No custom training data. Add Q&A pairs to improve the chatbot.</p></div>
              ) : (
                <div className="space-y-3">
                  {trainingData.map(t => (
                    <div key={t.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs capitalize">{t.category}</span>
                        <button className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                      </div>
                      <p className="font-medium text-blue-600 mb-1">Q: {t.question}</p>
                      <p className="text-gray-700">A: {t.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Settings className="text-gray-600" /> AI Model Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Alert Settings</h4>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3"><input type="checkbox" checked={alertSettings.email_alerts} onChange={(e) => setAlertSettings({...alertSettings, email_alerts: e.target.checked})} className="w-5 h-5" /><span>Enable Email Alerts</span></label>
                    <label className="flex items-center gap-3"><input type="checkbox" checked={alertSettings.anomaly_alerts} onChange={(e) => setAlertSettings({...alertSettings, anomaly_alerts: e.target.checked})} className="w-5 h-5" /><span>Alert on Anomalies</span></label>
                    <div><label className="block text-sm font-medium mb-1">Risk Alert Threshold</label><input type="range" min="0" max="100" value={alertSettings.risk_threshold} onChange={(e) => setAlertSettings({...alertSettings, risk_threshold: parseInt(e.target.value)})} className="w-full" /><p className="text-sm text-gray-500">Alert when dropout risk exceeds {alertSettings.risk_threshold}%</p></div>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4">Model Parameters</h4>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium mb-1">Confidence Threshold</label><input type="number" min="0" max="100" value={modelSettings.confidence_threshold || 70} onChange={(e) => setModelSettings({...modelSettings, confidence_threshold: parseInt(e.target.value)})} className="w-full border rounded-lg px-3 py-2" /><p className="text-xs text-gray-500">Minimum confidence to show predictions</p></div>
                    <div><label className="block text-sm font-medium mb-1">Prediction Window (days)</label><input type="number" min="1" max="365" value={modelSettings.prediction_window || 30} onChange={(e) => setModelSettings({...modelSettings, prediction_window: parseInt(e.target.value)})} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                </div>
              </div>
              <button onClick={handleSaveSettings} className="mt-6 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"><Save size={18} /> Save Settings</button>
            </div>
          )}
        </div>
      </div>

      {/* RESULT MODAL */}
      {showModal && modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center"><h2 className="text-xl font-bold">{modalData.title}</h2><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><XCircle size={20} /></button></div>
            <div className="p-6">
              {modalData.type === 'prediction' && (
                <div className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg text-center"><p className="text-sm text-purple-600">Predicted Score</p><p className="text-4xl font-bold text-purple-700">{modalData.data.predicted_score}%</p></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Confidence</p><p className="font-semibold">{(modalData.data.confidence * 100).toFixed(0)}%</p></div>
                    <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Trend</p><p className="font-semibold capitalize">{modalData.data.trend}</p></div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg"><p className="text-xs text-blue-600">Recommendation</p><p className="font-medium">{modalData.data.recommendation}</p></div>
                </div>
              )}
              {modalData.type === 'risk' && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg text-center ${modalData.data.risk_level === 'high' ? 'bg-red-50' : modalData.data.risk_level === 'medium' ? 'bg-yellow-50' : 'bg-green-50'}`}><p className="text-sm">Risk Level</p><p className={`text-4xl font-bold capitalize ${modalData.data.risk_level === 'high' ? 'text-red-700' : modalData.data.risk_level === 'medium' ? 'text-yellow-700' : 'text-green-700'}`}>{modalData.data.risk_level}</p><p className="text-2xl font-semibold mt-1">{modalData.data.risk_score}/100</p></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Confidence</p><p className="font-semibold">{(modalData.data.confidence * 100).toFixed(0)}%</p></div>
                  <div className="bg-blue-50 p-3 rounded-lg"><p className="text-xs text-blue-600">Recommendation</p><p className="font-medium">{modalData.data.recommendation}</p></div>
                </div>
              )}
              {modalData.type === 'forecast' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Confidence: {(modalData.data.confidence * 100).toFixed(0)}% • Trend: {modalData.data.trend}</p>
                  <div className="space-y-2">{modalData.data.forecast?.map((f, i) => (<div key={i} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center"><span className="font-medium">{f.month}</span><div className="text-right"><p className="font-bold text-green-600">GHS {f.predicted_revenue?.toLocaleString()}</p><p className="text-xs text-gray-500">{f.lower_bound?.toLocaleString()} - {f.upper_bound?.toLocaleString()}</p></div></div>))}</div>
                </div>
              )}
              {modalData.type === 'learning_path' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Current Level</p><p className="font-semibold">{modalData.data.current_level}</p></div>
                    <div className="bg-green-50 p-3 rounded-lg"><p className="text-xs text-green-600">Target Level</p><p className="font-semibold">{modalData.data.target_level}</p></div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg"><p className="text-xs text-blue-600">Learning Style</p><p className="font-semibold capitalize">{modalData.data.learning_style}</p></div>
                  <div><p className="font-medium mb-2">Strengths</p><div className="flex flex-wrap gap-2">{modalData.data.strengths?.map((s, i) => <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">{s}</span>)}</div></div>
                  <div><p className="font-medium mb-2">Areas to Improve</p><div className="flex flex-wrap gap-2">{modalData.data.weaknesses?.map((w, i) => <span key={i} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm">{w}</span>)}</div></div>
                  <div><p className="font-medium mb-2">Recommended Resources</p><div className="space-y-2">{modalData.data.resources?.map((r, i) => <div key={i} className="bg-gray-50 p-2 rounded flex items-center gap-2"><span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs capitalize">{r.type}</span><span className="text-sm">{r.title}</span></div>)}</div></div>
                  <div><p className="font-medium mb-2">Milestones</p><div className="space-y-2">{modalData.data.milestones?.map((m, i) => <div key={i} className="bg-gray-50 p-2 rounded flex justify-between"><span className="text-sm">{m.title}</span><span className="text-xs text-gray-500">{m.target_date}</span></div>)}</div></div>
                </div>
              )}
              <button onClick={() => setShowModal(false)} className="w-full mt-6 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULED TASK MODAL */}
      {showModal && modalType === 'scheduled_task' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center"><h2 className="text-xl font-bold">{modalData?.id ? 'Edit Task' : 'Add Scheduled Task'}</h2><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button></div>
            <form onSubmit={handleSaveScheduledTask} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Task Name *</label><input type="text" value={modalData?.task_name || ''} onChange={(e) => setModalData({...modalData, task_name: e.target.value})} className="w-full border rounded-lg px-3 py-2" required /></div>
              <div><label className="block text-sm font-medium mb-1">Task Type</label><select value={modalData?.task_type || ''} onChange={(e) => setModalData({...modalData, task_type: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="batch_predictions">Batch Predictions</option><option value="generate_insights">Generate Insights</option><option value="detect_anomalies">Detect Anomalies</option><option value="generate_recommendations">Generate Recommendations</option></select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Schedule</label><select value={modalData?.schedule || ''} onChange={(e) => setModalData({...modalData, schedule: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
                <div><label className="block text-sm font-medium mb-1">Time</label><input type="time" value={modalData?.time || ''} onChange={(e) => setModalData({...modalData, time: e.target.value})} className="w-full border rounded-lg px-3 py-2" /></div>
              </div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Save</button></div>
            </form>
          </div>
        </div>
      )}

      {/* TRAINING DATA MODAL */}
      {showModal && modalType === 'training' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center"><h2 className="text-xl font-bold">Add Training Q&A</h2><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button></div>
            <form onSubmit={handleSaveTrainingData} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium mb-1">Category</label><select value={modalData?.category || ''} onChange={(e) => setModalData({...modalData, category: e.target.value})} className="w-full border rounded-lg px-3 py-2"><option value="general">General</option><option value="admissions">Admissions</option><option value="fees">Fees</option><option value="timetable">Timetable</option><option value="results">Results</option><option value="policies">Policies</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Question *</label><textarea value={modalData?.question || ''} onChange={(e) => setModalData({...modalData, question: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows={2} required /></div>
              <div><label className="block text-sm font-medium mb-1">Answer *</label><textarea value={modalData?.answer || ''} onChange={(e) => setModalData({...modalData, answer: e.target.value})} className="w-full border rounded-lg px-3 py-2" rows={4} required /></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Add</button></div>
            </form>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showModal && modalType === 'settings' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-6 border-b flex justify-between items-center"><h2 className="text-xl font-bold">AI Settings</h2><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button></div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-medium mb-3">Email Alerts</h4>
                <label className="flex items-center gap-3 mb-2"><input type="checkbox" checked={alertSettings.email_alerts} onChange={(e) => setAlertSettings({...alertSettings, email_alerts: e.target.checked})} className="w-5 h-5" /><span>Enable Email Alerts</span></label>
                <label className="flex items-center gap-3"><input type="checkbox" checked={alertSettings.anomaly_alerts} onChange={(e) => setAlertSettings({...alertSettings, anomaly_alerts: e.target.checked})} className="w-5 h-5" /><span>Alert on Anomalies</span></label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Risk Alert Threshold: {alertSettings.risk_threshold}%</label>
                <input type="range" min="0" max="100" value={alertSettings.risk_threshold} onChange={(e) => setAlertSettings({...alertSettings, risk_threshold: parseInt(e.target.value)})} className="w-full" />
              </div>
              <div className="flex gap-3 pt-4"><button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button onClick={() => { handleSaveSettings(); setShowModal(false); }} className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Save</button></div>
            </div>
          </div>
        </div>
      )}

      {/* CHAT SESSION MODAL */}
      {showModal && modalType === 'chat_session' && modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center"><h2 className="text-xl font-bold">Chat Session: {modalData.session_id}</h2><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button></div>
            <div className="p-6 space-y-3">
              {modalData.messages?.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                    <p className="text-sm">{m.message}</p>
                    <p className="text-xs opacity-70 mt-1">{m.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
