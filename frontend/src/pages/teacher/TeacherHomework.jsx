import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, Eye, X, BookOpen, CheckCircle, FileText, Search, Filter,
  Calendar, Clock, AlertTriangle, Edit2, Trash2, Copy, Loader2,
  ChevronDown, Upload, Download, Users, BarChart3, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function TeacherHomework() {
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  // Core state
  const [homework, setHomework] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [editMode, setEditMode] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState(searchParams.get('class') || 'all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [bulkGradeMode, setBulkGradeMode] = useState(false);
  const [bulkGrades, setBulkGrades] = useState({});

  const [homeworkForm, setHomeworkForm] = useState({
    class_id: searchParams.get('class') || '',
    subject_id: '',
    term_id: '',
    teacher_id: '',
    title: '',
    description: '',
    due_date: '',
    total_marks: 100,
    status: 'active',
    attachment_url: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current term
      try {
        const termRes = await axios.get(`${API_BASE_URL}/terms.php?current=true`);
        if (termRes.data.term) {
          setCurrentTerm(termRes.data.term);
        } else if (termRes.data.terms?.length > 0) {
          setCurrentTerm(termRes.data.terms[0]);
        }
      } catch (e) {
        console.error('Could not fetch current term:', e);
      }
      
      // Get teacher record
      const teacherResponse = await axios.get(`${API_BASE_URL}/teachers.php?user_id=${user?.id}`);
      const teachers = teacherResponse.data.teachers || [];
      
      if (teachers.length === 0) {
        console.error('No teacher record found for this user');
        setLoading(false);
        return;
      }
      
      const teacher = teachers[0];
      setTeacherInfo(teacher);
      
      const [homeworkRes, classesRes, subjectsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/academic.php?resource=homework&teacher_id=${teacher.id}`),
        axios.get(`${API_BASE_URL}/classes.php?teacher_id=${teacher.id}`),
        axios.get(`${API_BASE_URL}/subjects.php`)
      ]);
      
      setHomework(homeworkRes.data.homework || []);
      setClasses(classesRes.data.classes || []);
      setSubjects(subjectsRes.data.subjects || []);
      
      // Set class from URL if provided
      const classFromUrl = searchParams.get('class');
      if (classFromUrl) {
        setFilterClass(classFromUrl);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setHomeworkForm({
      class_id: filterClass !== 'all' ? filterClass : '',
      subject_id: '',
      term_id: currentTerm?.id || '',
      teacher_id: teacherInfo?.id || '',
      title: '',
      description: '',
      due_date: '',
      total_marks: 100,
      status: 'active',
      attachment_url: ''
    });
    setEditMode(false);
  };

  const handleCreateHomework = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...homeworkForm,
        term_id: currentTerm?.id || 1,
        teacher_id: teacherInfo?.id || user?.id
      };
      
      if (editMode && selectedHomework) {
        await axios.put(`${API_BASE_URL}/academic.php?resource=homework&id=${selectedHomework.id}`, payload);
        alert('Homework updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/academic.php?resource=homework`, payload);
        alert('Homework assigned successfully!');
      }
      
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      alert('Error saving homework: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleEditHomework = (hw) => {
    setHomeworkForm({
      class_id: hw.class_id,
      subject_id: hw.subject_id,
      term_id: hw.term_id,
      teacher_id: hw.teacher_id,
      title: hw.title,
      description: hw.description,
      due_date: hw.due_date,
      total_marks: hw.total_marks,
      status: hw.status,
      attachment_url: hw.attachment_url || ''
    });
    setSelectedHomework(hw);
    setEditMode(true);
    setShowModal(true);
  };

  const handleDeleteHomework = async () => {
    if (!selectedHomework) return;
    try {
      await axios.delete(`${API_BASE_URL}/academic.php?resource=homework&id=${selectedHomework.id}`);
      alert('Homework deleted successfully!');
      setShowDeleteModal(false);
      setSelectedHomework(null);
      fetchData();
    } catch (error) {
      alert('Error deleting homework: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDuplicateHomework = (hw) => {
    setHomeworkForm({
      class_id: hw.class_id,
      subject_id: hw.subject_id,
      term_id: currentTerm?.id || hw.term_id,
      teacher_id: teacherInfo?.id || hw.teacher_id,
      title: `${hw.title} (Copy)`,
      description: hw.description,
      due_date: '',
      total_marks: hw.total_marks,
      status: 'active',
      attachment_url: hw.attachment_url || ''
    });
    setEditMode(false);
    setShowModal(true);
  };

  const handleViewSubmissions = async (hw) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/academic.php?resource=homework&id=${hw.id}`);
      setSelectedHomework(response.data.homework);
      setSubmissions(response.data.homework?.submissions || []);
      setBulkGrades({});
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
        graded_by: user?.id
      });
      alert('Submission graded successfully!');
      handleViewSubmissions(selectedHomework);
    } catch (error) {
      alert('Error grading submission');
    }
  };

  const handleBulkGrade = async () => {
    try {
      setSaving(true);
      const gradesToSubmit = Object.entries(bulkGrades).filter(([_, data]) => data.marks);
      
      for (const [submissionId, data] of gradesToSubmit) {
        await axios.post(`${API_BASE_URL}/academic.php?resource=homework_submissions&action=grade&id=${submissionId}`, {
          marks_obtained: data.marks,
          feedback: data.feedback || '',
          graded_by: user?.id
        });
      }
      
      alert(`${gradesToSubmit.length} submissions graded successfully!`);
      setBulkGradeMode(false);
      setBulkGrades({});
      handleViewSubmissions(selectedHomework);
    } catch (error) {
      alert('Error grading submissions');
    } finally {
      setSaving(false);
    }
  };

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

  const getDueDateStatus = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', class: 'text-red-600 bg-red-50', icon: AlertTriangle };
    if (diffDays === 0) return { text: 'Due Today', class: 'text-orange-600 bg-orange-50', icon: Clock };
    if (diffDays <= 3) return { text: `${diffDays} days left`, class: 'text-yellow-600 bg-yellow-50', icon: Clock };
    return { text: new Date(dueDate).toLocaleDateString(), class: 'text-gray-600', icon: Calendar };
  };

  // Filter homework
  const filteredHomework = homework.filter(hw => {
    const matchesSearch = hw.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hw.class_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hw.subject_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'all' || hw.class_id == filterClass;
    const matchesSubject = filterSubject === 'all' || hw.subject_id == filterSubject;
    const matchesStatus = filterStatus === 'all' || hw.status === filterStatus;
    return matchesSearch && matchesClass && matchesSubject && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: homework.length,
    active: homework.filter(h => h.status === 'active').length,
    totalSubmissions: homework.reduce((sum, h) => sum + (h.submission_count || 0), 0),
    pendingReview: homework.reduce((sum, h) => sum + (h.pending_count || h.submission_count || 0), 0),
    overdue: homework.filter(h => h.status === 'active' && new Date(h.due_date) < new Date()).length
  };

  if (loading && homework.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading homework...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-blue-600" />
            My Homework
          </h1>
          <p className="text-gray-600 mt-1">
            {currentTerm ? `${currentTerm.term_name} • ` : ''}
            Assign and grade homework for your classes
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Assign Homework
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSubmissions}</p>
              <p className="text-xs text-gray-500">Submissions</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <Eye className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingReview}</p>
              <p className="text-xs text-gray-500">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-xs text-gray-500">Overdue</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search homework..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="input w-full md:w-40">
            <option value="all">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="input w-full md:w-40">
            <option value="all">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input w-full md:w-32">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Homework List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredHomework.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No homework found</p>
                    {searchTerm || filterClass !== 'all' || filterSubject !== 'all' || filterStatus !== 'all' ? (
                      <button onClick={() => { setSearchTerm(''); setFilterClass('all'); setFilterSubject('all'); setFilterStatus('all'); }} className="btn btn-primary mt-4">
                        Clear Filters
                      </button>
                    ) : null}
                  </td>
                </tr>
              ) : (
                filteredHomework.map((hw) => {
                  const dueDateStatus = getDueDateStatus(hw.due_date);
                  const DueDateIcon = dueDateStatus.icon;
                  const submissionRate = hw.student_count > 0 ? Math.round((hw.submission_count || 0) / hw.student_count * 100) : 0;
                  
                  return (
                    <tr key={hw.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">{hw.title}</p>
                        <p className="text-xs text-gray-500">{hw.total_marks} marks</p>
                      </td>
                      <td className="px-4 py-4 text-sm">{hw.class_name}</td>
                      <td className="px-4 py-4 text-sm">{hw.subject_name}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${dueDateStatus.class}`}>
                          <DueDateIcon className="w-3 h-3" />
                          {dueDateStatus.text}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-24">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>{hw.submission_count || 0}/{hw.student_count || '?'}</span>
                            <span className="text-gray-500">{submissionRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${submissionRate >= 80 ? 'bg-green-500' : submissionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${submissionRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(hw.status)}`}>
                          {hw.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleViewSubmissions(hw)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Review Submissions">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEditHomework(hw)} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDuplicateHomework(hw)} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Duplicate">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelectedHomework(hw); setShowDeleteModal(true); }} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Homework Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">{editMode ? 'Edit Homework' : 'Assign Homework'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}><X className="w-6 h-6" /></button>
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input type="text" required value={homeworkForm.title} onChange={(e) => setHomeworkForm({...homeworkForm, title: e.target.value})} className="input" placeholder="e.g., Chapter 3 Exercises" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <textarea required value={homeworkForm.description} onChange={(e) => setHomeworkForm({...homeworkForm, description: e.target.value})} className="input" rows="4" placeholder="Provide detailed instructions..." />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date *</label>
                  <input type="date" required value={homeworkForm.due_date} onChange={(e) => setHomeworkForm({...homeworkForm, due_date: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Total Marks</label>
                  <input type="number" value={homeworkForm.total_marks} onChange={(e) => setHomeworkForm({...homeworkForm, total_marks: e.target.value})} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Attachment URL (optional)</label>
                  <div className="flex gap-2">
                    <input type="url" value={homeworkForm.attachment_url} onChange={(e) => setHomeworkForm({...homeworkForm, attachment_url: e.target.value})} className="input flex-1" placeholder="https://..." />
                    <button type="button" className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload
                    </button>
                  </div>
                </div>
                {editMode && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select value={homeworkForm.status} onChange={(e) => setHomeworkForm({...homeworkForm, status: e.target.value})} className="input">
                      <option value="active">Active</option>
                      <option value="closed">Closed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editMode ? 'Update Homework' : 'Assign Homework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedHomework && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Homework?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{selectedHomework.title}"? This will also delete all submissions.
              </p>
              <div className="flex gap-4">
                <button onClick={() => { setShowDeleteModal(false); setSelectedHomework(null); }} className="btn bg-gray-200 flex-1">Cancel</button>
                <button onClick={handleDeleteHomework} className="btn bg-red-600 text-white hover:bg-red-700 flex-1">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && selectedHomework && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-semibold">{selectedHomework.title}</h2>
                <p className="text-sm text-gray-600">{selectedHomework.class_name} - {selectedHomework.subject_name}</p>
                <p className="text-sm text-gray-600">Due: {new Date(selectedHomework.due_date).toLocaleDateString()} • {selectedHomework.total_marks} marks</p>
              </div>
              <div className="flex items-center gap-2">
                {submissions.filter(s => s.status === 'submitted').length > 0 && (
                  <button 
                    onClick={() => setBulkGradeMode(!bulkGradeMode)} 
                    className={`btn ${bulkGradeMode ? 'btn-primary' : 'bg-gray-100 hover:bg-gray-200'} text-sm`}
                  >
                    {bulkGradeMode ? 'Cancel Bulk' : 'Bulk Grade'}
                  </button>
                )}
                <button onClick={() => setShowSubmissionsModal(false)}><X className="w-6 h-6" /></button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold mb-2">Description:</h3>
                <p className="text-gray-600">{selectedHomework.description}</p>
                {selectedHomework.attachment_url && (
                  <a href={selectedHomework.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline mt-2">
                    <Download className="w-4 h-4" /> View Attachment
                  </a>
                )}
              </div>

              {/* Submission Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{submissions.length}</p>
                  <p className="text-xs text-gray-600">Total</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{submissions.filter(s => s.status === 'submitted').length}</p>
                  <p className="text-xs text-gray-600">Pending</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{submissions.filter(s => s.status === 'graded').length}</p>
                  <p className="text-xs text-gray-600">Graded</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{submissions.filter(s => s.status === 'late').length}</p>
                  <p className="text-xs text-gray-600">Late</p>
                </div>
              </div>

              {bulkGradeMode && submissions.filter(s => s.status === 'submitted').length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4 flex items-center justify-between">
                  <p className="text-sm text-blue-700">Enter marks for multiple submissions and click "Save All Grades"</p>
                  <button onClick={handleBulkGrade} disabled={saving} className="btn btn-primary flex items-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Save All Grades
                  </button>
                </div>
              )}

              <h3 className="font-semibold mb-4">Submissions ({submissions.length}):</h3>
              
              {submissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No submissions yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {submission.first_name?.charAt(0)}{submission.last_name?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{submission.first_name} {submission.last_name}</p>
                            <p className="text-sm text-gray-500">{submission.student_id}</p>
                            <p className="text-xs text-gray-400">
                              {submission.submitted_at ? `Submitted: ${new Date(submission.submitted_at).toLocaleString()}` : 'Not submitted'}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSubmissionStatusBadge(submission.status)}`}>
                          {submission.status}
                        </span>
                      </div>

                      {submission.submission_text && (
                        <div className="bg-gray-50 p-3 rounded mb-3">
                          <p className="text-sm">{submission.submission_text}</p>
                        </div>
                      )}

                      {submission.file_url && (
                        <a href={submission.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm mb-3">
                          <Download className="w-4 h-4" /> View Submitted File
                        </a>
                      )}

                      {submission.status === 'submitted' && (
                        bulkGradeMode ? (
                          <div className="flex gap-2 bg-blue-50 p-3 rounded">
                            <input
                              type="number"
                              placeholder="Marks"
                              max={selectedHomework.total_marks}
                              className="input w-24"
                              value={bulkGrades[submission.id]?.marks || ''}
                              onChange={(e) => setBulkGrades({...bulkGrades, [submission.id]: {...bulkGrades[submission.id], marks: e.target.value}})}
                            />
                            <input
                              type="text"
                              placeholder="Feedback (optional)"
                              className="input flex-1"
                              value={bulkGrades[submission.id]?.feedback || ''}
                              onChange={(e) => setBulkGrades({...bulkGrades, [submission.id]: {...bulkGrades[submission.id], feedback: e.target.value}})}
                            />
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input type="number" placeholder="Marks" max={selectedHomework.total_marks} className="input w-24" id={`marks-${submission.id}`} />
                            <input type="text" placeholder="Feedback" className="input flex-1" id={`feedback-${submission.id}`} />
                            <button
                              onClick={() => {
                                const marks = document.getElementById(`marks-${submission.id}`).value;
                                const feedback = document.getElementById(`feedback-${submission.id}`).value;
                                handleGradeSubmission(submission.id, marks, feedback);
                              }}
                              className="btn btn-primary flex items-center gap-1"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Grade
                            </button>
                          </div>
                        )
                      )}

                      {submission.status === 'graded' && (
                        <div className="bg-green-50 p-3 rounded">
                          <p className="text-sm font-semibold text-green-700">
                            Marks: {submission.marks_obtained}/{selectedHomework.total_marks} ({Math.round((submission.marks_obtained / selectedHomework.total_marks) * 100)}%)
                          </p>
                          {submission.feedback && (
                            <p className="text-sm text-gray-600 mt-1">Feedback: {submission.feedback}</p>
                          )}
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
    </div>
  );
}
