import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Eye, X, BookOpen, CheckCircle, Search, Edit, Trash2, Copy,
  Download, Printer, Calendar, Filter, Clock, AlertTriangle, FileText,
  Upload, Paperclip, BarChart3, Users, ChevronLeft, ChevronRight,
  CheckSquare, XSquare, RefreshCw, Bell, Save
} from 'lucide-react';
import { classesAPI, subjectsAPI, termsAPI } from '../../services/api';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function Homework() {
  const [homework, setHomework] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingHomework, setEditingHomework] = useState(null);

  // Enhanced state
  const [viewMode, setViewMode] = useState('list'); // list, calendar, stats
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [homeworkStats, setHomeworkStats] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [bulkGradeMode, setBulkGradeMode] = useState(false);
  const [bulkGrades, setBulkGrades] = useState({});
  const fileInputRef = useRef();

  const [homeworkForm, setHomeworkForm] = useState({
    class_id: '',
    subject_id: '',
    term_id: '',
    teacher_id: 1,
    title: '',
    description: '',
    due_date: '',
    total_marks: 100,
    status: 'active',
    allow_late: true,
    late_penalty: 10,
    attachments: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [homeworkRes, classesRes, subjectsRes, termsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/academic.php?resource=homework`),
        classesAPI.getAll(),
        subjectsAPI.getAll(),
        termsAPI.getAll()
      ]);
      setHomework(homeworkRes.data.homework || []);
      setClasses(classesRes.data.classes || []);
      setSubjects(subjectsRes.data.subjects || []);
      setTerms(termsRes.data.terms || []);
      
      // Set active term
      const activeTerm = (termsRes.data.terms || []).find(t => t.is_active == 1);
      if (activeTerm) setTermFilter(activeTerm.id);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleCreateHomework = async (e) => {
    e.preventDefault();
    try {
      if (editingHomework) {
        await axios.put(`${API_BASE_URL}/academic.php?resource=homework&id=${editingHomework.id}`, homeworkForm);
        alert('Homework updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/academic.php?resource=homework`, homeworkForm);
        alert('Homework created successfully!');
      }
      setShowModal(false);
      setEditingHomework(null);
      fetchData();
      resetForm();
    } catch (error) {
      alert('Error saving homework');
    }
  };

  const resetForm = () => {
    setHomeworkForm({
      class_id: '',
      subject_id: '',
      term_id: termFilter || '',
      teacher_id: 1,
      title: '',
      description: '',
      due_date: '',
      total_marks: 100,
      status: 'active',
      allow_late: true,
      late_penalty: 10,
      attachments: []
    });
  };

  const handleEditHomework = (hw) => {
    setEditingHomework(hw);
    setHomeworkForm({
      class_id: hw.class_id,
      subject_id: hw.subject_id,
      term_id: hw.term_id,
      teacher_id: hw.teacher_id || 1,
      title: hw.title,
      description: hw.description,
      due_date: hw.due_date,
      total_marks: hw.total_marks,
      status: hw.status,
      allow_late: hw.allow_late !== false,
      late_penalty: hw.late_penalty || 10,
      attachments: hw.attachments || []
    });
    setShowModal(true);
  };

  const handleDeleteHomework = async (id) => {
    if (!window.confirm('Delete this homework? All submissions will be lost.')) return;
    try {
      await axios.delete(`${API_BASE_URL}/academic.php?resource=homework&id=${id}`);
      fetchData();
      alert('Homework deleted!');
    } catch (error) {
      alert('Error deleting homework');
    }
  };

  const handleDuplicateHomework = (hw) => {
    setEditingHomework(null);
    setHomeworkForm({
      ...hw,
      title: `${hw.title} (Copy)`,
      due_date: '',
      status: 'active'
    });
    setShowModal(true);
  };

  const handleViewSubmissions = async (hw) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/academic.php?resource=homework&id=${hw.id}`);
      setSelectedHomework(response.data.homework);
      setSubmissions(response.data.homework.submissions || []);
      setBulkGrades({});
      setBulkGradeMode(false);
      setShowSubmissionsModal(true);
    } catch (error) {
      alert('Error loading submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId, marks, feedback) => {
    try {
      await axios.post(`${API_BASE_URL}/academic.php?resource=homework_submissions&action=grade&id=${submissionId}`, {
        marks_obtained: marks,
        feedback: feedback,
        graded_by: 1
      });
      alert('Submission graded successfully!');
      handleViewSubmissions(selectedHomework);
    } catch (error) {
      alert('Error grading submission');
    }
  };

  const handleBulkGrade = async () => {
    try {
      const grades = Object.entries(bulkGrades).filter(([_, g]) => g.marks);
      if (grades.length === 0) {
        alert('No grades to save');
        return;
      }
      
      for (const [submissionId, grade] of grades) {
        await axios.post(`${API_BASE_URL}/academic.php?resource=homework_submissions&action=grade&id=${submissionId}`, {
          marks_obtained: grade.marks,
          feedback: grade.feedback || '',
          graded_by: 1
        });
      }
      
      alert(`${grades.length} submissions graded successfully!`);
      handleViewSubmissions(selectedHomework);
      setBulkGradeMode(false);
    } catch (error) {
      alert('Error grading submissions');
    }
  };

  const handleExportGrades = () => {
    if (!selectedHomework || submissions.length === 0) return;
    
    const data = submissions.map(s => ({
      'Student ID': s.student_id,
      'Name': `${s.first_name} ${s.last_name}`,
      'Status': s.status,
      'Submitted': s.submitted_at || '-',
      'Marks': s.marks_obtained || '-',
      'Feedback': s.feedback || ''
    }));

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homework_${selectedHomework.title}_grades.csv`;
    a.click();
  };

  const handlePrintHomework = () => {
    if (!selectedHomework) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>${selectedHomework.title}</title>
      <style>
        body { font-family: Arial; padding: 30px; max-width: 800px; margin: 0 auto; }
        h1 { color: #1f2937; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        .info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
        .info-item { background: #f3f4f6; padding: 10px; border-radius: 5px; }
        .description { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #2563eb; color: white; }
        .graded { color: green; } .pending { color: orange; } .late { color: red; }
      </style></head><body>
      <h1>${selectedHomework.title}</h1>
      <div class="info">
        <div class="info-item"><strong>Class:</strong> ${selectedHomework.class_name}</div>
        <div class="info-item"><strong>Subject:</strong> ${selectedHomework.subject_name}</div>
        <div class="info-item"><strong>Due Date:</strong> ${new Date(selectedHomework.due_date).toLocaleDateString()}</div>
        <div class="info-item"><strong>Total Marks:</strong> ${selectedHomework.total_marks}</div>
      </div>
      <div class="description">
        <h3>Description:</h3>
        <p>${selectedHomework.description}</p>
      </div>
      ${submissions.length > 0 ? `
        <h3>Submissions (${submissions.length})</h3>
        <table>
          <thead><tr><th>Student</th><th>Status</th><th>Submitted</th><th>Marks</th></tr></thead>
          <tbody>
            ${submissions.map(s => `
              <tr>
                <td>${s.first_name} ${s.last_name}</td>
                <td class="${s.status}">${s.status}</td>
                <td>${s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '-'}</td>
                <td>${s.marks_obtained || '-'}/${selectedHomework.total_marks}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const fetchHomeworkStats = async (hw) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/academic.php?resource=homework&id=${hw.id}`);
      const data = response.data.homework;
      const subs = data.submissions || [];
      
      const stats = {
        total_students: subs.length,
        submitted: subs.filter(s => s.status === 'submitted' || s.status === 'graded').length,
        graded: subs.filter(s => s.status === 'graded').length,
        pending: subs.filter(s => s.status === 'pending').length,
        late: subs.filter(s => s.status === 'late').length,
        average_marks: 0,
        highest: 0,
        lowest: 0
      };
      
      const gradedSubs = subs.filter(s => s.marks_obtained);
      if (gradedSubs.length > 0) {
        const marks = gradedSubs.map(s => parseFloat(s.marks_obtained));
        stats.average_marks = marks.reduce((a, b) => a + b, 0) / marks.length;
        stats.highest = Math.max(...marks);
        stats.lowest = Math.min(...marks);
      }
      
      stats.submission_rate = stats.total_students > 0 
        ? ((stats.submitted / stats.total_students) * 100).toFixed(1) 
        : 0;
      
      setHomeworkStats(stats);
      setSelectedHomework(data);
      setShowStatsModal(true);
    } catch (error) {
      alert('Error loading statistics');
    }
  };

  const saveAsTemplate = () => {
    if (!homeworkForm.title) {
      alert('Please enter a title first');
      return;
    }
    const newTemplate = {
      id: Date.now(),
      title: homeworkForm.title,
      description: homeworkForm.description,
      total_marks: homeworkForm.total_marks,
      allow_late: homeworkForm.allow_late,
      late_penalty: homeworkForm.late_penalty
    };
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    localStorage.setItem('homework_templates', JSON.stringify(updated));
    alert('Template saved!');
  };

  const loadTemplate = (template) => {
    setHomeworkForm({
      ...homeworkForm,
      title: template.title,
      description: template.description,
      total_marks: template.total_marks,
      allow_late: template.allow_late,
      late_penalty: template.late_penalty
    });
    setShowTemplateModal(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem('homework_templates');
    if (saved) setTemplates(JSON.parse(saved));
  }, []);

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return badges[status] || badges.active;
  };

  const getSubmissionStatusBadge = (status) => {
    const badges = {
      pending: 'bg-orange-100 text-orange-700',
      submitted: 'bg-blue-100 text-blue-700',
      late: 'bg-red-100 text-red-700',
      graded: 'bg-green-100 text-green-700'
    };
    return badges[status] || badges.pending;
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const getDaysRemaining = (dueDate) => {
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `${diff} days left`;
  };

  // Filter and sort homework
  const filteredHomework = homework
    .filter(hw => {
      const matchesSearch = !searchTerm || 
        hw.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hw.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = !classFilter || hw.class_id == classFilter;
      const matchesSubject = !subjectFilter || hw.subject_id == subjectFilter;
      const matchesStatus = !statusFilter || hw.status === statusFilter;
      const matchesTerm = !termFilter || hw.term_id == termFilter;
      return matchesSearch && matchesClass && matchesSubject && matchesStatus && matchesTerm;
    })
    .sort((a, b) => new Date(b.due_date) - new Date(a.due_date));

  // Calendar helpers
  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getHomeworkForDay = (day) => {
    if (!day) return [];
    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredHomework.filter(hw => hw.due_date?.startsWith(dateStr));
  };

  const viewTabs = [
    { id: 'list', label: 'List View', icon: FileText },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homework Management</h1>
          <p className="text-gray-600 mt-1">Assign, track, and grade homework assignments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTemplateModal(true)} className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Templates
          </button>
          <button onClick={() => { resetForm(); setEditingHomework(null); setShowModal(true); }} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Assign Homework
          </button>
        </div>
      </div>

      {/* View Tabs */}
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

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search homework..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10 w-full" />
          </div>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="input w-auto">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="input w-auto">
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={termFilter} onChange={(e) => setTermFilter(e.target.value)} className="input w-auto">
            <option value="">All Terms</option>
            {terms.map(t => <option key={t.id} value={t.id}>{t.term_name}</option>)}
          </select>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submissions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredHomework.length === 0 ? (
                  <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No homework found</td></tr>
                ) : filteredHomework.map((hw) => (
                  <tr key={hw.id} className={`hover:bg-gray-50 ${isOverdue(hw.due_date) && hw.status === 'active' ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{hw.title}</div>
                      <div className="text-xs text-gray-500">{hw.total_marks} marks</div>
                    </td>
                    <td className="px-4 py-3 text-sm">{hw.class_name}</td>
                    <td className="px-4 py-3 text-sm">{hw.subject_name}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm">{new Date(hw.due_date).toLocaleDateString()}</div>
                      <div className={`text-xs ${isOverdue(hw.due_date) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {getDaysRemaining(hw.due_date)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-blue-600">{hw.submission_count || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(hw.status)}`}>{hw.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleViewSubmissions(hw)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View Submissions"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => fetchHomeworkStats(hw)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Statistics"><BarChart3 className="w-4 h-4" /></button>
                        <button onClick={() => handleEditHomework(hw)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDuplicateHomework(hw)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Duplicate"><Copy className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteHomework(hw.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} className="p-2 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold">
              {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} className="p-2 hover:bg-gray-100 rounded">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
            ))}
            {getCalendarDays().map((day, idx) => {
              const dayHomework = getHomeworkForDay(day);
              const isToday = day && new Date().getDate() === day && new Date().getMonth() === calendarMonth.getMonth();
              return (
                <div key={idx} className={`min-h-[80px] border rounded p-1 ${day ? 'bg-white' : 'bg-gray-50'} ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
                  {day && (
                    <>
                      <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day}</div>
                      <div className="space-y-1 mt-1">
                        {dayHomework.slice(0, 2).map(hw => (
                          <div key={hw.id} onClick={() => handleViewSubmissions(hw)}
                            className={`text-xs p-1 rounded cursor-pointer truncate ${hw.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {hw.title}
                          </div>
                        ))}
                        {dayHomework.length > 2 && (
                          <div className="text-xs text-gray-500">+{dayHomework.length - 2} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create/Edit Homework Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingHomework ? 'Edit Homework' : 'Assign Homework'}</h2>
              <div className="flex items-center gap-2">
                <button onClick={saveAsTemplate} className="text-sm text-blue-600 hover:underline">Save as Template</button>
                <button onClick={() => { setShowModal(false); setEditingHomework(null); }}><X className="w-6 h-6" /></button>
              </div>
            </div>
            <form onSubmit={handleCreateHomework} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Class *</label>
                  <select required value={homeworkForm.class_id} onChange={(e) => setHomeworkForm({...homeworkForm, class_id: e.target.value})} className="input">
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subject *</label>
                  <select required value={homeworkForm.subject_id} onChange={(e) => setHomeworkForm({...homeworkForm, subject_id: e.target.value})} className="input">
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Term</label>
                  <select value={homeworkForm.term_id} onChange={(e) => setHomeworkForm({...homeworkForm, term_id: e.target.value})} className="input">
                    <option value="">Select Term</option>
                    {terms.map(t => <option key={t.id} value={t.id}>{t.term_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select value={homeworkForm.status} onChange={(e) => setHomeworkForm({...homeworkForm, status: e.target.value})} className="input">
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input type="text" required value={homeworkForm.title} onChange={(e) => setHomeworkForm({...homeworkForm, title: e.target.value})} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <textarea required value={homeworkForm.description} onChange={(e) => setHomeworkForm({...homeworkForm, description: e.target.value})} className="input" rows="4" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date *</label>
                  <input type="date" required value={homeworkForm.due_date} onChange={(e) => setHomeworkForm({...homeworkForm, due_date: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Total Marks</label>
                  <input type="number" value={homeworkForm.total_marks} onChange={(e) => setHomeworkForm({...homeworkForm, total_marks: e.target.value})} className="input" />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={homeworkForm.allow_late} onChange={(e) => setHomeworkForm({...homeworkForm, allow_late: e.target.checked})} className="w-4 h-4" />
                    <span className="text-sm">Allow Late Submissions</span>
                  </label>
                </div>
                {homeworkForm.allow_late && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Late Penalty (%)</label>
                    <input type="number" value={homeworkForm.late_penalty} onChange={(e) => setHomeworkForm({...homeworkForm, late_penalty: e.target.value})} className="input" />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); setEditingHomework(null); }} className="btn bg-gray-200">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingHomework ? 'Update' : 'Assign'} Homework</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && selectedHomework && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xl font-semibold">{selectedHomework.title}</h2>
                <p className="text-sm text-gray-600">{selectedHomework.class_name} - {selectedHomework.subject_name} | Due: {new Date(selectedHomework.due_date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setBulkGradeMode(!bulkGradeMode)} className={`btn text-sm ${bulkGradeMode ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                  <CheckSquare className="w-4 h-4 mr-1" /> Bulk Grade
                </button>
                <button onClick={handleExportGrades} className="btn bg-green-600 text-white hover:bg-green-700 text-sm">
                  <Download className="w-4 h-4 mr-1" /> Export
                </button>
                <button onClick={handlePrintHomework} className="btn bg-gray-600 text-white hover:bg-gray-700 text-sm">
                  <Printer className="w-4 h-4" />
                </button>
                <button onClick={() => setShowSubmissionsModal(false)}><X className="w-6 h-6" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <h3 className="font-medium text-sm text-gray-700 mb-1">Description:</h3>
                <p className="text-gray-600 text-sm">{selectedHomework.description}</p>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Submissions ({submissions.length})</h3>
                {bulkGradeMode && (
                  <button onClick={handleBulkGrade} className="btn btn-primary text-sm">
                    <Save className="w-4 h-4 mr-1" /> Save All Grades
                  </button>
                )}
              </div>
              
              {submissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No submissions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <div key={submission.id} className={`border rounded-lg p-4 ${submission.status === 'late' ? 'border-red-200 bg-red-50' : ''}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium">{submission.first_name} {submission.last_name}</p>
                          <p className="text-sm text-gray-500">{submission.student_id}</p>
                          <p className="text-sm text-gray-500">
                            {submission.submitted_at ? (
                              <>Submitted: {new Date(submission.submitted_at).toLocaleString()}</>
                            ) : 'Not submitted'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {submission.status === 'late' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSubmissionStatusBadge(submission.status)}`}>
                            {submission.status}
                          </span>
                        </div>
                      </div>

                      {submission.submission_text && (
                        <div className="bg-white border p-3 rounded mb-3">
                          <p className="text-sm">{submission.submission_text}</p>
                        </div>
                      )}

                      {bulkGradeMode && (submission.status === 'submitted' || submission.status === 'late') && (
                        <div className="flex gap-2">
                          <input type="number" placeholder="Marks" max={selectedHomework.total_marks}
                            value={bulkGrades[submission.id]?.marks || ''}
                            onChange={(e) => setBulkGrades({...bulkGrades, [submission.id]: {...bulkGrades[submission.id], marks: e.target.value}})}
                            className="input w-24" />
                          <input type="text" placeholder="Feedback"
                            value={bulkGrades[submission.id]?.feedback || ''}
                            onChange={(e) => setBulkGrades({...bulkGrades, [submission.id]: {...bulkGrades[submission.id], feedback: e.target.value}})}
                            className="input flex-1" />
                        </div>
                      )}

                      {!bulkGradeMode && (submission.status === 'submitted' || submission.status === 'late') && (
                        <div className="flex gap-2">
                          <input type="number" placeholder="Marks" max={selectedHomework.total_marks} className="input w-24" id={`marks-${submission.id}`} />
                          <input type="text" placeholder="Feedback" className="input flex-1" id={`feedback-${submission.id}`} />
                          <button onClick={() => {
                            const marks = document.getElementById(`marks-${submission.id}`).value;
                            const feedback = document.getElementById(`feedback-${submission.id}`).value;
                            handleGradeSubmission(submission.id, marks, feedback);
                          }} className="btn btn-primary flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" /> Grade
                          </button>
                        </div>
                      )}

                      {submission.status === 'graded' && (
                        <div className="bg-green-50 p-3 rounded flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-green-700">Marks: {submission.marks_obtained}/{selectedHomework.total_marks}</p>
                            {submission.feedback && <p className="text-sm text-gray-600 mt-1">Feedback: {submission.feedback}</p>}
                          </div>
                          <button onClick={() => {
                            setBulkGrades({...bulkGrades, [submission.id]: {marks: submission.marks_obtained, feedback: submission.feedback}});
                            setBulkGradeMode(true);
                          }} className="text-xs text-blue-600 hover:underline">Re-grade</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatsModal && homeworkStats && selectedHomework && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Homework Statistics</h2>
              <button onClick={() => setShowStatsModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <p className="text-gray-600 mb-4">{selectedHomework.title}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-700">{homeworkStats.submission_rate}%</p>
                <p className="text-sm text-blue-600">Submission Rate</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-700">{homeworkStats.graded}/{homeworkStats.submitted}</p>
                <p className="text-sm text-green-600">Graded</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-700">{homeworkStats.average_marks.toFixed(1)}</p>
                <p className="text-sm text-purple-600">Average Marks</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-orange-700">{homeworkStats.late}</p>
                <p className="text-sm text-orange-600">Late Submissions</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Submitted</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(homeworkStats.submitted / homeworkStats.total_students) * 100}%` }} />
                  </div>
                  <span>{homeworkStats.submitted}/{homeworkStats.total_students}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Pending</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${(homeworkStats.pending / homeworkStats.total_students) * 100}%` }} />
                  </div>
                  <span>{homeworkStats.pending}/{homeworkStats.total_students}</span>
                </div>
              </div>
              {homeworkStats.graded > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">Highest: <span className="font-semibold">{homeworkStats.highest}</span> | Lowest: <span className="font-semibold">{homeworkStats.lowest}</span></p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Homework Templates</h2>
              <button onClick={() => setShowTemplateModal(false)}><X className="w-6 h-6" /></button>
            </div>
            
            {templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No templates saved yet</p>
                <p className="text-sm mt-2">Create a homework and click "Save as Template"</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {templates.map(template => (
                  <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                      <p className="font-medium">{template.title}</p>
                      <p className="text-sm text-gray-500">{template.total_marks} marks</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => loadTemplate(template)} className="btn btn-primary text-sm">Use</button>
                      <button onClick={() => {
                        const updated = templates.filter(t => t.id !== template.id);
                        setTemplates(updated);
                        localStorage.setItem('homework_templates', JSON.stringify(updated));
                      }} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
