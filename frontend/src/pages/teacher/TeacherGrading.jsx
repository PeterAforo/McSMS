import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, Award, X, Search, Edit2, Trash2, Copy, Loader2, RefreshCw,
  BarChart3, Download, Users, CheckCircle, AlertTriangle, Calendar,
  TrendingUp, FileText, MessageSquare, Lock, Unlock
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function TeacherGrading() {
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  // Core state
  const [assessments, setAssessments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [currentTerm, setCurrentTerm] = useState(null);
  const [teacherInfo, setTeacherInfo] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [grades, setGrades] = useState([]);
  const [editMode, setEditMode] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState(searchParams.get('class') || 'all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');

  const [assessmentForm, setAssessmentForm] = useState({
    class_id: searchParams.get('class') || '',
    subject_id: '',
    term_id: '',
    assessment_name: '',
    assessment_type: 'test',
    total_marks: 100,
    weight_percentage: 100,
    assessment_date: new Date().toISOString().split('T')[0],
    description: '',
    created_by: user?.id
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
      
      const [assessmentsRes, classesRes, subjectsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/academic.php?resource=assessments`),
        axios.get(`${API_BASE_URL}/classes.php?teacher_id=${teacher.id}`),
        axios.get(`${API_BASE_URL}/subjects.php`)
      ]);
      
      // Filter assessments to only show those created by this teacher
      const teacherAssessments = (assessmentsRes.data.assessments || []).filter(a => a.created_by == user?.id);
      setAssessments(teacherAssessments);
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
    setAssessmentForm({
      class_id: filterClass !== 'all' ? filterClass : '',
      subject_id: '',
      term_id: currentTerm?.id || '',
      assessment_name: '',
      assessment_type: 'test',
      total_marks: 100,
      weight_percentage: 100,
      assessment_date: new Date().toISOString().split('T')[0],
      description: '',
      created_by: user?.id
    });
    setEditMode(false);
  };

  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...assessmentForm,
        term_id: currentTerm?.id || 1,
        created_by: user?.id
      };
      
      if (editMode && selectedAssessment) {
        await axios.put(`${API_BASE_URL}/academic.php?resource=assessments&id=${selectedAssessment.id}`, payload);
        alert('Assessment updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/academic.php?resource=assessments`, payload);
        alert('Assessment created successfully!');
      }
      
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      alert('Error saving assessment: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleEditAssessment = (assessment) => {
    setAssessmentForm({
      class_id: assessment.class_id,
      subject_id: assessment.subject_id,
      term_id: assessment.term_id,
      assessment_name: assessment.assessment_name,
      assessment_type: assessment.assessment_type,
      total_marks: assessment.total_marks,
      weight_percentage: assessment.weight_percentage,
      assessment_date: assessment.assessment_date,
      description: assessment.description || '',
      created_by: assessment.created_by
    });
    setSelectedAssessment(assessment);
    setEditMode(true);
    setShowModal(true);
  };

  const handleDeleteAssessment = async () => {
    if (!selectedAssessment) return;
    try {
      await axios.delete(`${API_BASE_URL}/academic.php?resource=assessments&id=${selectedAssessment.id}`);
      alert('Assessment deleted successfully!');
      setShowDeleteModal(false);
      setSelectedAssessment(null);
      fetchData();
    } catch (error) {
      alert('Error deleting assessment: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDuplicateAssessment = (assessment) => {
    setAssessmentForm({
      class_id: assessment.class_id,
      subject_id: assessment.subject_id,
      term_id: currentTerm?.id || assessment.term_id,
      assessment_name: `${assessment.assessment_name} (Copy)`,
      assessment_type: assessment.assessment_type,
      total_marks: assessment.total_marks,
      weight_percentage: assessment.weight_percentage,
      assessment_date: new Date().toISOString().split('T')[0],
      description: assessment.description || '',
      created_by: user?.id
    });
    setEditMode(false);
    setShowModal(true);
  };

  const handleLockAssessment = async (assessment) => {
    const newStatus = assessment.status === 'locked' ? 'active' : 'locked';
    const action = newStatus === 'locked' ? 'lock' : 'unlock';
    
    if (!confirm(`Are you sure you want to ${action} this assessment? ${newStatus === 'locked' ? 'Grades will no longer be editable.' : 'Grades will become editable again.'}`)) {
      return;
    }
    
    try {
      await axios.put(`${API_BASE_URL}/academic.php?resource=assessments&id=${assessment.id}&action=lock`, {
        status: newStatus
      });
      alert(`Assessment ${action}ed successfully!`);
      fetchData();
    } catch (error) {
      alert('Error updating assessment: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleGradeAssessment = async (assessment) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/assessment_grades.php?assessment_id=${assessment.id}`);
      const existingGrades = response.data.grades || [];
      
      const studentsRes = await axios.get(`${API_BASE_URL}/students.php?class_id=${assessment.class_id}`);
      const students = studentsRes.data.students || [];
      
      const gradeData = students.map(student => {
        const existing = existingGrades.find(g => g.student_id == student.id);
        return {
          student_id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          student_id_code: student.student_id,
          marks_obtained: existing?.marks_obtained || '',
          grade: existing?.grade || '',
          comment: existing?.comment || ''
        };
      });
      
      setGrades(gradeData);
      setSelectedAssessment(assessment);
      setStudentSearch('');
      setShowGradeModal(true);
    } catch (error) {
      alert('Error loading grades');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (studentId, field, value) => {
    setGrades(prev => prev.map(g => 
      g.student_id === studentId ? { ...g, [field]: value } : g
    ));
  };

  const calculateGrade = (marks, total) => {
    if (!marks || !total) return '';
    const percentage = (marks / total) * 100;
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const handleSaveGrades = async () => {
    try {
      setSaving(true);
      
      // Filter grades that have marks entered (not empty, not null, not undefined)
      const gradesData = grades
        .filter(g => g.marks_obtained !== '' && g.marks_obtained !== null && g.marks_obtained !== undefined)
        .map(g => ({
          student_id: g.student_id,
          marks_obtained: parseFloat(g.marks_obtained),
          grade: g.grade || calculateGrade(g.marks_obtained, selectedAssessment.total_marks),
          comment: g.comment || ''
        }));

      console.log('Grades to save:', gradesData);
      console.log('Assessment ID:', selectedAssessment.id);

      if (gradesData.length === 0) {
        alert('Please enter marks for at least one student');
        setSaving(false);
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/assessment_grades.php`, {
        assessment_id: selectedAssessment.id,
        grades: gradesData,
        graded_by: user?.id
      });

      console.log('Save response:', response.data);

      if (response.data.success) {
        setShowGradeModal(false);
        alert(`Grades saved successfully! (${response.data.count || gradesData.length} grades)`);
        fetchData();
      } else {
        alert('Error: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Save grades error:', error);
      alert('Error saving grades: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const exportGrades = () => {
    if (!selectedAssessment || grades.length === 0) return;
    
    const headers = ['Student Name', 'Student ID', 'Marks', 'Grade', 'Percentage', 'Comment'];
    const rows = grades.map(g => [
      `${g.first_name} ${g.last_name}`,
      g.student_id_code,
      g.marks_obtained || 'N/A',
      g.grade || calculateGrade(g.marks_obtained, selectedAssessment.total_marks) || 'N/A',
      g.marks_obtained ? `${Math.round((g.marks_obtained / selectedAssessment.total_marks) * 100)}%` : 'N/A',
      g.comment || ''
    ]);
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedAssessment.assessment_name}_grades.csv`;
    a.click();
  };

  // Filter assessments
  const filteredAssessments = assessments.filter(a => {
    const matchesSearch = a.assessment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.class_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.subject_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'all' || a.class_id == filterClass;
    const matchesSubject = filterSubject === 'all' || a.subject_id == filterSubject;
    const matchesType = filterType === 'all' || a.assessment_type === filterType;
    return matchesSearch && matchesClass && matchesSubject && matchesType;
  });

  // Filter students in grading modal
  const filteredGrades = grades.filter(g => {
    const name = `${g.first_name} ${g.last_name}`.toLowerCase();
    return name.includes(studentSearch.toLowerCase()) || 
           g.student_id_code?.toLowerCase().includes(studentSearch.toLowerCase());
  });

  // Calculate stats
  const stats = {
    total: assessments.length,
    pending: assessments.filter(a => !a.graded_count || a.graded_count === 0).length,
    quizzes: assessments.filter(a => a.assessment_type === 'quiz').length,
    tests: assessments.filter(a => a.assessment_type === 'test').length,
    exams: assessments.filter(a => a.assessment_type === 'exam').length
  };

  // Calculate grade statistics for modal
  const gradeStats = {
    total: grades.length,
    graded: grades.filter(g => g.marks_obtained !== '').length,
    average: grades.filter(g => g.marks_obtained).length > 0 
      ? (grades.filter(g => g.marks_obtained).reduce((sum, g) => sum + parseFloat(g.marks_obtained || 0), 0) / grades.filter(g => g.marks_obtained).length).toFixed(1)
      : 0,
    highest: Math.max(...grades.map(g => parseFloat(g.marks_obtained) || 0)),
    lowest: grades.filter(g => g.marks_obtained).length > 0 
      ? Math.min(...grades.filter(g => g.marks_obtained).map(g => parseFloat(g.marks_obtained)))
      : 0,
    passRate: grades.filter(g => g.marks_obtained).length > 0
      ? Math.round((grades.filter(g => parseFloat(g.marks_obtained) >= (selectedAssessment?.total_marks * 0.5)).length / grades.filter(g => g.marks_obtained).length) * 100)
      : 0
  };

  // Grade distribution
  const gradeDistribution = {
    A: grades.filter(g => calculateGrade(g.marks_obtained, selectedAssessment?.total_marks) === 'A').length,
    B: grades.filter(g => calculateGrade(g.marks_obtained, selectedAssessment?.total_marks) === 'B').length,
    C: grades.filter(g => calculateGrade(g.marks_obtained, selectedAssessment?.total_marks) === 'C').length,
    D: grades.filter(g => calculateGrade(g.marks_obtained, selectedAssessment?.total_marks) === 'D').length,
    F: grades.filter(g => calculateGrade(g.marks_obtained, selectedAssessment?.total_marks) === 'F').length
  };

  const getTypeBadge = (type) => {
    const badges = {
      quiz: 'bg-purple-100 text-purple-700',
      test: 'bg-blue-100 text-blue-700',
      exam: 'bg-red-100 text-red-700',
      assignment: 'bg-green-100 text-green-700',
      project: 'bg-orange-100 text-orange-700',
      midterm: 'bg-yellow-100 text-yellow-700',
      final: 'bg-pink-100 text-pink-700'
    };
    return badges[type] || 'bg-gray-100 text-gray-700';
  };

  if (loading && assessments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading assessments...</p>
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
            <Award className="text-blue-600" />
            My Assessments & Grading
          </h1>
          <p className="text-gray-600 mt-1">
            {currentTerm ? `${currentTerm.term_name} • ` : ''}
            Create assessments and record student grades
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Assessment
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
            <AlertTriangle className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">Q</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.quizzes}</p>
              <p className="text-xs text-gray-500">Quizzes</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">T</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.tests}</p>
              <p className="text-xs text-gray-500">Tests</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">E</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.exams}</p>
              <p className="text-xs text-gray-500">Exams</p>
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
              placeholder="Search assessments..."
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
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input w-full md:w-32">
            <option value="all">All Types</option>
            <option value="quiz">Quiz</option>
            <option value="test">Test</option>
            <option value="exam">Exam</option>
            <option value="assignment">Assignment</option>
            <option value="project">Project</option>
          </select>
        </div>
      </div>

      {/* Assessments List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No assessments found</p>
                    {searchTerm || filterClass !== 'all' || filterSubject !== 'all' || filterType !== 'all' ? (
                      <button onClick={() => { setSearchTerm(''); setFilterClass('all'); setFilterSubject('all'); setFilterType('all'); }} className="btn btn-primary mt-4">
                        Clear Filters
                      </button>
                    ) : null}
                  </td>
                </tr>
              ) : (
                filteredAssessments.map((assessment) => {
                  const gradedCount = assessment.graded_count || 0;
                  const studentCount = assessment.student_count || 0;
                  const gradingProgress = studentCount > 0 ? Math.round((gradedCount / studentCount) * 100) : 0;
                  
                  return (
                    <tr key={assessment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">{assessment.assessment_name}</p>
                        <p className="text-xs text-gray-500">{assessment.weight_percentage}% weight</p>
                      </td>
                      <td className="px-4 py-4 text-sm">{assessment.class_name}</td>
                      <td className="px-4 py-4 text-sm">{assessment.subject_name}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getTypeBadge(assessment.assessment_type)}`}>
                          {assessment.assessment_type}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold">{assessment.total_marks}</td>
                      <td className="px-4 py-4">
                        <div className="w-20">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>{gradedCount}/{studentCount}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${gradingProgress === 100 ? 'bg-green-500' : gradingProgress > 0 ? 'bg-yellow-500' : 'bg-gray-300'}`}
                              style={{ width: `${gradingProgress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {new Date(assessment.assessment_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          {assessment.status === 'locked' ? (
                            <span className="p-2 text-gray-400" title="Grades Locked">
                              <Lock className="w-4 h-4" />
                            </span>
                          ) : (
                            <button onClick={() => handleGradeAssessment(assessment)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Grade">
                              <Award className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleEditAssessment(assessment)} 
                            className={`p-2 rounded ${assessment.status === 'locked' ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`} 
                            title={assessment.status === 'locked' ? 'Locked' : 'Edit'}
                            disabled={assessment.status === 'locked'}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDuplicateAssessment(assessment)} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Duplicate">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleLockAssessment(assessment)} 
                            className={`p-2 rounded ${assessment.status === 'locked' ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'}`}
                            title={assessment.status === 'locked' ? 'Unlock Grades' : 'Lock Grades'}
                          >
                            {assessment.status === 'locked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => { setSelectedAssessment(assessment); setShowDeleteModal(true); }} 
                            className={`p-2 rounded ${assessment.status === 'locked' ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                            title={assessment.status === 'locked' ? 'Locked' : 'Delete'}
                            disabled={assessment.status === 'locked'}
                          >
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

      {/* Create/Edit Assessment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">{editMode ? 'Edit Assessment' : 'Create Assessment'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }}><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleCreateAssessment} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Class *</label>
                  <select required value={assessmentForm.class_id} onChange={(e) => setAssessmentForm({...assessmentForm, class_id: e.target.value})} className="input">
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subject *</label>
                  <select required value={assessmentForm.subject_id} onChange={(e) => setAssessmentForm({...assessmentForm, subject_id: e.target.value})} className="input">
                    <option value="">Select Subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Assessment Name *</label>
                  <input type="text" required value={assessmentForm.assessment_name} onChange={(e) => setAssessmentForm({...assessmentForm, assessment_name: e.target.value})} className="input" placeholder="e.g., Mathematics Quiz 1" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type *</label>
                  <select value={assessmentForm.assessment_type} onChange={(e) => setAssessmentForm({...assessmentForm, assessment_type: e.target.value})} className="input">
                    <option value="quiz">Quiz</option>
                    <option value="test">Test</option>
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="project">Project</option>
                    <option value="midterm">Midterm</option>
                    <option value="final">Final</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Total Marks *</label>
                  <input type="number" required value={assessmentForm.total_marks} onChange={(e) => setAssessmentForm({...assessmentForm, total_marks: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Weight %</label>
                  <input type="number" value={assessmentForm.weight_percentage} onChange={(e) => setAssessmentForm({...assessmentForm, weight_percentage: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date *</label>
                  <input type="date" required value={assessmentForm.assessment_date} onChange={(e) => setAssessmentForm({...assessmentForm, assessment_date: e.target.value})} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Description (optional)</label>
                  <textarea value={assessmentForm.description} onChange={(e) => setAssessmentForm({...assessmentForm, description: e.target.value})} className="input" rows="2" placeholder="Additional notes..." />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="btn btn-primary flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editMode ? 'Update Assessment' : 'Create Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Assessment?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{selectedAssessment.assessment_name}"? This will also delete all grades.
              </p>
              <div className="flex gap-4">
                <button onClick={() => { setShowDeleteModal(false); setSelectedAssessment(null); }} className="btn bg-gray-200 flex-1">Cancel</button>
                <button onClick={handleDeleteAssessment} className="btn bg-red-600 text-white hover:bg-red-700 flex-1">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {showGradeModal && selectedAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-xl font-semibold">{selectedAssessment.assessment_name}</h2>
                <p className="text-sm text-gray-600">{selectedAssessment.class_name} - {selectedAssessment.subject_name} • {selectedAssessment.total_marks} marks</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={exportGrades} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2 text-sm">
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button onClick={() => setShowGradeModal(false)}><X className="w-6 h-6" /></button>
              </div>
            </div>

            <div className="p-6">
              {/* Grade Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xl font-bold text-blue-600">{gradeStats.graded}/{gradeStats.total}</p>
                  <p className="text-xs text-gray-600">Graded</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xl font-bold text-green-600">{gradeStats.average}</p>
                  <p className="text-xs text-gray-600">Average</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-xl font-bold text-purple-600">{gradeStats.highest}</p>
                  <p className="text-xs text-gray-600">Highest</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-xl font-bold text-orange-600">{gradeStats.lowest}</p>
                  <p className="text-xs text-gray-600">Lowest</p>
                </div>
                <div className="text-center p-3 bg-teal-50 rounded-lg">
                  <p className="text-xl font-bold text-teal-600">{gradeStats.passRate}%</p>
                  <p className="text-xs text-gray-600">Pass Rate</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-center gap-1">
                    {['A', 'B', 'C', 'D', 'F'].map(g => (
                      <span key={g} className="text-xs font-medium">{g}:{gradeDistribution[g]}</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Distribution</p>
                </div>
              </div>

              {/* Student Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="input pl-10 w-full md:w-64"
                  />
                </div>
              </div>

              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm">Student</th>
                    <th className="px-4 py-2 text-left text-sm">ID</th>
                    <th className="px-4 py-2 text-left text-sm w-24">Marks</th>
                    <th className="px-4 py-2 text-left text-sm w-16">Grade</th>
                    <th className="px-4 py-2 text-left text-sm w-16">%</th>
                    <th className="px-4 py-2 text-left text-sm">Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredGrades.map((grade) => {
                    const percentage = grade.marks_obtained ? Math.round((grade.marks_obtained / selectedAssessment.total_marks) * 100) : null;
                    const autoGrade = calculateGrade(grade.marks_obtained, selectedAssessment.total_marks);
                    
                    return (
                      <tr key={grade.student_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                              autoGrade === 'A' ? 'bg-green-500' : 
                              autoGrade === 'B' ? 'bg-blue-500' : 
                              autoGrade === 'C' ? 'bg-yellow-500' : 
                              autoGrade === 'D' ? 'bg-orange-500' : 
                              autoGrade === 'F' ? 'bg-red-500' : 'bg-gray-300'
                            }`}>
                              {grade.first_name?.charAt(0)}{grade.last_name?.charAt(0)}
                            </div>
                            <span>{grade.first_name} {grade.last_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{grade.student_id_code}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={selectedAssessment.total_marks}
                            value={grade.marks_obtained}
                            onChange={(e) => handleGradeChange(grade.student_id, 'marks_obtained', e.target.value)}
                            className="input w-20 text-center"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-bold rounded ${
                            autoGrade === 'A' ? 'bg-green-100 text-green-700' : 
                            autoGrade === 'B' ? 'bg-blue-100 text-blue-700' : 
                            autoGrade === 'C' ? 'bg-yellow-100 text-yellow-700' : 
                            autoGrade === 'D' ? 'bg-orange-100 text-orange-700' : 
                            autoGrade === 'F' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {autoGrade || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {percentage !== null ? (
                            <span className={percentage >= 50 ? 'text-green-600' : 'text-red-600'}>{percentage}%</span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder="Add comment..."
                            value={grade.comment || ''}
                            onChange={(e) => handleGradeChange(grade.student_id, 'comment', e.target.value)}
                            className="input w-full text-sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex justify-between items-center pt-6 border-t mt-6">
                <p className="text-sm text-gray-500">
                  {gradeStats.graded} of {gradeStats.total} students graded
                </p>
                <div className="flex gap-4">
                  <button onClick={() => setShowGradeModal(false)} className="btn bg-gray-200">Cancel</button>
                  <button onClick={handleSaveGrades} disabled={saving} className="btn btn-primary flex items-center gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Save Grades
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
