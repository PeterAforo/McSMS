import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, Clock, Users, FileText, Award, TrendingUp, Plus, Edit2, Trash2, 
  Eye, CheckCircle, XCircle, BarChart3, ClipboardList, MapPin, Search,
  Download, Upload, Printer, RefreshCw, ChevronRight, BookOpen, GraduationCap,
  AlertCircle, Check, X, Loader2
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [results, setResults] = useState([]);
  const [seating, setSeating] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('exams');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('exam'); // exam, schedule, result, seating
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [formData, setFormData] = useState({
    exam_name: '',
    exam_type_id: 1,
    academic_year: new Date().getFullYear(),
    term_id: '',
    start_date: '',
    end_date: '',
    status: 'scheduled',
    instructions: ''
  });
  
  const [scheduleForm, setScheduleForm] = useState({
    exam_id: '',
    class_id: '',
    subject_id: '',
    exam_date: '',
    start_time: '09:00',
    end_time: '11:00',
    duration_minutes: 120,
    room_id: '',
    max_marks: 100,
    pass_marks: 40,
    instructions: ''
  });
  
  const [resultForm, setResultForm] = useState({
    student_id: '',
    marks_obtained: '',
    remarks: ''
  });

  useEffect(() => {
    fetchExams();
    fetchClasses();
    fetchSubjects();
    fetchTerms();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/exams.php?resource=exams`);
      if (response.data.success) {
        setExams(response.data.exams || []);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/classes.php`);
      console.log('Classes response:', response.data);
      const classData = response.data.classes || response.data || [];
      setClasses(Array.isArray(classData) ? classData : []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subjects.php`);
      console.log('Subjects response:', response.data);
      const subjectData = response.data.subjects || response.data || [];
      setSubjects(Array.isArray(subjectData) ? subjectData : []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    }
  };

  const fetchTerms = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/terms.php`);
      console.log('Terms response:', response.data);
      const termData = response.data.terms || response.data || [];
      setTerms(Array.isArray(termData) ? termData : []);
    } catch (error) {
      console.error('Error fetching terms:', error);
      setTerms([]);
    }
  };

  const fetchSchedules = async (examId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/exams.php?resource=schedules&action=by_exam&exam_id=${examId}`);
      if (response.data.success) {
        setSchedules(response.data.schedules || []);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchResults = async (scheduleId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/exams.php?resource=results&action=by_schedule&schedule_id=${scheduleId}`);
      if (response.data.success) {
        setResults(response.data.results || []);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const fetchSeating = async (scheduleId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/exams.php?resource=seating&action=by_schedule&schedule_id=${scheduleId}`);
      if (response.data.success) {
        setSeating(response.data.seating || []);
      }
    } catch (error) {
      console.error('Error fetching seating:', error);
    }
  };

  const fetchStatistics = async (scheduleId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/exams.php?resource=statistics&schedule_id=${scheduleId}`);
      if (response.data.success) {
        setStatistics(response.data.statistics);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchStudentsByClass = async (classId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/students.php?class_id=${classId}`);
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // CRUD Operations
  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/exams.php?resource=exams`, formData);
      if (response.data.success) {
        alert('✅ Exam created successfully!');
        setShowModal(false);
        fetchExams();
        resetExamForm();
      }
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Failed to create exam');
    }
  };

  const handleUpdateExam = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API_BASE_URL}/exams.php?resource=exams&id=${editingItem.id}`, formData);
      if (response.data.success) {
        alert('✅ Exam updated successfully!');
        setShowModal(false);
        fetchExams();
        setEditingItem(null);
        resetExamForm();
      }
    } catch (error) {
      console.error('Error updating exam:', error);
      alert('Failed to update exam');
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!confirm('Are you sure you want to delete this exam? This will also delete all schedules and results.')) return;
    try {
      const response = await axios.delete(`${API_BASE_URL}/exams.php?resource=exams&id=${examId}`);
      if (response.data.success) {
        alert('✅ Exam deleted successfully!');
        fetchExams();
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Failed to delete exam');
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/exams.php?resource=schedules`, {
        ...scheduleForm,
        exam_id: selectedExam.id
      });
      if (response.data.success) {
        alert('✅ Schedule created successfully!');
        setShowModal(false);
        fetchSchedules(selectedExam.id);
        resetScheduleForm();
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
      alert('Failed to create schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    try {
      const response = await axios.delete(`${API_BASE_URL}/exams.php?resource=schedules&id=${scheduleId}`);
      if (response.data.success) {
        alert('✅ Schedule deleted successfully!');
        fetchSchedules(selectedExam.id);
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Failed to delete schedule');
    }
  };

  const handleSaveResult = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/exams.php?resource=results`, {
        exam_schedule_id: selectedSchedule.id,
        student_id: resultForm.student_id,
        marks_obtained: parseFloat(resultForm.marks_obtained),
        max_marks: selectedSchedule.max_marks,
        remarks: resultForm.remarks
      });
      if (response.data.success) {
        alert(`✅ Result saved! Grade: ${response.data.grade} (${response.data.percentage.toFixed(1)}%)`);
        fetchResults(selectedSchedule.id);
        setResultForm({ student_id: '', marks_obtained: '', remarks: '' });
      }
    } catch (error) {
      console.error('Error saving result:', error);
      alert('Failed to save result');
    }
  };

  const handlePublishResults = async (scheduleId) => {
    if (!confirm('Publish results? Students and parents will be able to view them.')) return;
    try {
      const response = await axios.put(`${API_BASE_URL}/exams.php?resource=results&action=publish&schedule_id=${scheduleId}`);
      if (response.data.success) {
        alert('✅ Results published successfully!');
        fetchResults(scheduleId);
      }
    } catch (error) {
      console.error('Error publishing results:', error);
      alert('Failed to publish results');
    }
  };

  const generateSeating = async (schedule) => {
    if (!confirm('Generate automatic seating arrangement for this exam?')) return;
    try {
      const response = await axios.get(
        `${API_BASE_URL}/exams.php?resource=seating&action=generate&schedule_id=${schedule.id}&class_id=${schedule.class_id}&room_id=${schedule.room_id || 1}`
      );
      if (response.data.success) {
        alert('✅ Seating arrangement generated successfully!');
        fetchSeating(schedule.id);
      }
    } catch (error) {
      console.error('Error generating seating:', error);
      alert('Failed to generate seating');
    }
  };

  const handleMarkAttendance = async (seatId, newStatus) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/exams.php?resource=seating&id=${seatId}&action=mark_attendance`,
        { status: newStatus }
      );
      if (response.data.success) {
        // Update local state immediately for better UX
        setSeating(seating.map(seat => 
          seat.id === seatId ? { ...seat, status: newStatus } : seat
        ));
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to update attendance');
    }
  };

  const handleViewExam = (exam) => {
    setSelectedExam(exam);
    setSelectedSchedule(null);
    fetchSchedules(exam.id);
    setActiveTab('schedules');
  };

  const handleViewScheduleDetails = (schedule) => {
    setSelectedSchedule(schedule);
    fetchResults(schedule.id);
    fetchSeating(schedule.id);
    fetchStatistics(schedule.id);
    fetchStudentsByClass(schedule.class_id);
    setActiveTab('results');
  };

  const resetExamForm = () => {
    setFormData({
      exam_name: '',
      exam_type_id: 1,
      academic_year: new Date().getFullYear(),
      term_id: '',
      start_date: '',
      end_date: '',
      status: 'scheduled',
      instructions: ''
    });
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      exam_id: '',
      class_id: '',
      subject_id: '',
      exam_date: '',
      start_time: '09:00',
      end_time: '11:00',
      duration_minutes: 120,
      room_id: '',
      max_marks: 100,
      pass_marks: 40,
      instructions: ''
    });
  };

  const openEditExam = (exam) => {
    setEditingItem(exam);
    setFormData({
      exam_name: exam.exam_name || '',
      exam_type_id: exam.exam_type_id || 1,
      academic_year: exam.academic_year || new Date().getFullYear(),
      term_id: exam.term_id || '',
      start_date: exam.start_date || '',
      end_date: exam.end_date || '',
      status: exam.status || 'scheduled',
      instructions: exam.instructions || ''
    });
    setModalType('exam');
    setShowModal(true);
  };

  const openAddSchedule = () => {
    resetScheduleForm();
    setModalType('schedule');
    setShowModal(true);
  };

  const openAddExam = () => {
    setEditingItem(null);
    resetExamForm();
    setModalType('exam');
    setShowModal(true);
  };

  // Filter exams
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.exam_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || exam.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGradeColor = (grade) => {
    if (!grade) return 'text-gray-500';
    if (grade.startsWith('A')) return 'text-green-600 font-bold';
    if (grade.startsWith('B')) return 'text-blue-600 font-bold';
    if (grade.startsWith('C')) return 'text-yellow-600 font-bold';
    if (grade.startsWith('D')) return 'text-orange-600 font-bold';
    return 'text-red-600 font-bold';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Management</h1>
          <p className="text-gray-600 mt-1">Create exams, manage schedules, enter results, and generate seating</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchExams}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Refresh
          </button>
          <button
            onClick={openAddExam}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Create Exam
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Exams</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{exams.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Scheduled</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{exams.filter(e => e.status === 'scheduled').length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Ongoing</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{exams.filter(e => e.status === 'ongoing').length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{exams.filter(e => e.status === 'completed').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Award className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {(selectedExam || selectedSchedule) && (
        <div className="flex items-center gap-2 text-sm bg-gray-50 p-3 rounded-lg">
          <button onClick={() => { setActiveTab('exams'); setSelectedExam(null); setSelectedSchedule(null); }} className="text-blue-600 hover:underline">
            All Exams
          </button>
          {selectedExam && (
            <>
              <ChevronRight size={16} className="text-gray-400" />
              <button onClick={() => { setActiveTab('schedules'); setSelectedSchedule(null); }} className={selectedSchedule ? 'text-blue-600 hover:underline' : 'text-gray-700 font-medium'}>
                {selectedExam.exam_name}
              </button>
            </>
          )}
          {selectedSchedule && (
            <>
              <ChevronRight size={16} className="text-gray-400" />
              <span className="text-gray-700 font-medium">{selectedSchedule.subject_name} - {selectedSchedule.class_name}</span>
            </>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => { setActiveTab('exams'); setSelectedExam(null); setSelectedSchedule(null); }}
              className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'exams' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText size={18} />
              All Exams
            </button>
            {selectedExam && (
              <>
                <button
                  onClick={() => { setActiveTab('schedules'); setSelectedSchedule(null); }}
                  className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'schedules' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Calendar size={18} />
                  Schedules
                </button>
                <button
                  onClick={() => setActiveTab('results')}
                  className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'results' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <ClipboardList size={18} />
                  Results
                </button>
                <button
                  onClick={() => setActiveTab('seating')}
                  className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'seating' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MapPin size={18} />
                  Seating
                </button>
                <button
                  onClick={() => setActiveTab('statistics')}
                  className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'statistics' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <BarChart3 size={18} />
                  Statistics
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* EXAMS TAB */}
          {activeTab === 'exams' && (
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search exams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {filteredExams.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto text-gray-300" size={48} />
                  <p className="text-gray-500 mt-4">No exams found</p>
                  <button onClick={openAddExam} className="mt-4 text-blue-600 hover:underline">Create your first exam</button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredExams.map((exam) => (
                    <div key={exam.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all bg-white">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <GraduationCap className="text-blue-600" size={20} />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{exam.exam_name}</h3>
                              <p className="text-sm text-gray-500">{exam.term_name || 'No term assigned'}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {exam.start_date} - {exam.end_date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {exam.academic_year}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText size={14} />
                              {exam.schedule_count || 0} schedules
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                            {exam.status}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewExam(exam)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View Schedules"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => openEditExam(exam)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteExam(exam.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SCHEDULES TAB */}
          {activeTab === 'schedules' && selectedExam && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Exam Schedules for {selectedExam.exam_name}</h3>
                <button
                  onClick={openAddSchedule}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Schedule
                </button>
              </div>

              {schedules.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Calendar className="mx-auto text-gray-300" size={48} />
                  <p className="text-gray-500 mt-4">No schedules created yet</p>
                  <button onClick={openAddSchedule} className="mt-4 text-blue-600 hover:underline">Add first schedule</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Marks</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {schedules.map((schedule) => (
                        <tr key={schedule.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{schedule.subject_name}</td>
                          <td className="px-4 py-3">{schedule.class_name}</td>
                          <td className="px-4 py-3">{schedule.exam_date}</td>
                          <td className="px-4 py-3">{schedule.start_time} - {schedule.end_time}</td>
                          <td className="px-4 py-3">{schedule.duration_minutes} mins</td>
                          <td className="px-4 py-3">{schedule.max_marks}</td>
                          <td className="px-4 py-3">{schedule.room_number || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewScheduleDetails(schedule)}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                              >
                                Results
                              </button>
                              <button
                                onClick={() => generateSeating(schedule)}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                              >
                                Seating
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* RESULTS TAB */}
          {activeTab === 'results' && selectedExam && (
            <div className="space-y-6">
              {/* Schedule Selector */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Schedule to Enter Results</label>
                <select
                  value={selectedSchedule?.id || ''}
                  onChange={(e) => {
                    const schedule = schedules.find(s => s.id == e.target.value);
                    if (schedule) {
                      setSelectedSchedule(schedule);
                      fetchResults(schedule.id);
                      fetchStatistics(schedule.id);
                      fetchStudentsByClass(schedule.class_id);
                    } else {
                      setSelectedSchedule(null);
                    }
                  }}
                  className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">-- Select a Schedule --</option>
                  {schedules.map(s => (
                    <option key={s.id} value={s.id}>{s.subject_name} - {s.class_name} ({s.exam_date})</option>
                  ))}
                </select>
              </div>

              {!selectedSchedule ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <ClipboardList className="mx-auto text-gray-300" size={48} />
                  <p className="text-gray-500 mt-4">Select a schedule above to enter results</p>
                  {schedules.length === 0 && (
                    <p className="text-sm text-gray-400 mt-2">No schedules found. Add schedules first from the Schedules tab.</p>
                  )}
                </div>
              ) : (
              <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedSchedule.subject_name} - {selectedSchedule.class_name}</h3>
                  <p className="text-sm text-gray-500">Max Marks: {selectedSchedule.max_marks} | Pass Marks: {selectedSchedule.pass_marks}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { fetchResults(selectedSchedule.id); fetchStatistics(selectedSchedule.id); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <RefreshCw size={18} />
                    Refresh
                  </button>
                  <button
                    onClick={() => handlePublishResults(selectedSchedule.id)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Publish Results
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-blue-600">Entered</p>
                  <p className="text-xl font-bold text-blue-800">{results.length}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600">Pending</p>
                  <p className="text-xl font-bold text-gray-800">{students.length - results.length}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-green-600">Passed</p>
                  <p className="text-xl font-bold text-green-800">{results.filter(r => parseFloat(r.marks_obtained) >= selectedSchedule.pass_marks).length}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-red-600">Failed</p>
                  <p className="text-xl font-bold text-red-800">{results.filter(r => parseFloat(r.marks_obtained) < selectedSchedule.pass_marks).length}</p>
                </div>
              </div>

              {/* Result Entry Form */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-3">Enter Result</h4>
                <form onSubmit={handleSaveResult} className="flex flex-col md:flex-row gap-4">
                  <select
                    value={resultForm.student_id}
                    onChange={(e) => setResultForm({ ...resultForm, student_id: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select Student ({students.filter(s => !results.find(r => r.student_id == s.id)).length} pending)</option>
                    {students
                      .filter(s => !results.find(r => r.student_id == s.id))
                      .map(student => (
                        <option key={student.id} value={student.id}>
                          {student.first_name} {student.last_name} ({student.student_id})
                        </option>
                      ))}
                    <optgroup label="Already Entered (Edit)">
                      {students
                        .filter(s => results.find(r => r.student_id == s.id))
                        .map(student => (
                          <option key={student.id} value={student.id}>
                            {student.first_name} {student.last_name} ({student.student_id}) ✓
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  <input
                    type="number"
                    placeholder="Marks"
                    value={resultForm.marks_obtained}
                    onChange={(e) => setResultForm({ ...resultForm, marks_obtained: e.target.value })}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    max={selectedSchedule.max_marks}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Remarks (optional)"
                    value={resultForm.remarks}
                    onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    Save
                  </button>
                </form>
              </div>

              {/* Results Table */}
              {results.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <ClipboardList className="mx-auto text-gray-300" size={48} />
                  <p className="text-gray-500 mt-4">No results entered yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {results.map((result) => (
                        <tr key={result.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{result.student_name}</td>
                          <td className="px-4 py-3">{result.student_number}</td>
                          <td className="px-4 py-3">{result.marks_obtained} / {result.max_marks}</td>
                          <td className="px-4 py-3">{parseFloat(result.percentage).toFixed(1)}%</td>
                          <td className={`px-4 py-3 ${getGradeColor(result.grade)}`}>{result.grade}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              result.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {result.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{result.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              </>
              )}
            </div>
          )}

          {/* SEATING TAB */}
          {activeTab === 'seating' && selectedExam && (
            <div className="space-y-4">
              {/* Schedule Selector */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Schedule for Seating</label>
                <select
                  value={selectedSchedule?.id || ''}
                  onChange={(e) => {
                    const schedule = schedules.find(s => s.id == e.target.value);
                    if (schedule) {
                      setSelectedSchedule(schedule);
                      fetchSeating(schedule.id);
                    } else {
                      setSelectedSchedule(null);
                      setSeating([]);
                    }
                  }}
                  className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">-- Select a Schedule --</option>
                  {schedules.map(s => (
                    <option key={s.id} value={s.id}>{s.subject_name} - {s.class_name} ({s.exam_date})</option>
                  ))}
                </select>
              </div>

              {!selectedSchedule ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <MapPin className="mx-auto text-gray-300" size={48} />
                  <p className="text-gray-500 mt-4">Select a schedule above to view/generate seating</p>
                  {schedules.length === 0 && (
                    <p className="text-sm text-gray-400 mt-2">No schedules found. Add schedules first from the Schedules tab.</p>
                  )}
                </div>
              ) : (
              <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Seating: {selectedSchedule.subject_name} - {selectedSchedule.class_name}</h3>
                  <p className="text-sm text-gray-500">Click on a seat to mark attendance</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchSeating(selectedSchedule.id)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <RefreshCw size={18} />
                    Refresh
                  </button>
                  <button
                    onClick={() => generateSeating(selectedSchedule)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Generate Seating
                  </button>
                </div>
              </div>

              {/* Attendance Summary */}
              {seating.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-gray-600">Total</p>
                    <p className="text-xl font-bold text-gray-800">{seating.length}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-green-600">Present</p>
                    <p className="text-xl font-bold text-green-800">{seating.filter(s => s.status === 'present').length}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <p className="text-xs text-red-600">Absent</p>
                    <p className="text-xl font-bold text-red-800">{seating.filter(s => s.status === 'absent').length}</p>
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1"><span className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></span> Assigned</span>
                <span className="flex items-center gap-1"><span className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded"></span> Present</span>
                <span className="flex items-center gap-1"><span className="w-4 h-4 bg-red-100 border-2 border-red-500 rounded"></span> Absent</span>
              </div>

              {seating.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <MapPin className="mx-auto text-gray-300" size={48} />
                  <p className="text-gray-500 mt-4">No seating arrangement generated</p>
                  <button onClick={() => generateSeating(selectedSchedule)} className="mt-4 text-blue-600 hover:underline">
                    Generate seating now
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {seating.map((seat) => (
                    <div 
                      key={seat.id} 
                      onClick={() => handleMarkAttendance(seat.id, seat.status === 'present' ? 'absent' : 'present')}
                      className={`p-4 rounded-lg border-2 text-center cursor-pointer transition-all hover:shadow-md ${
                        seat.status === 'present' ? 'border-green-500 bg-green-50 hover:bg-green-100' :
                        seat.status === 'absent' ? 'border-red-500 bg-red-50 hover:bg-red-100' :
                        'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-2xl font-bold text-gray-700">{seat.seat_number || '-'}</div>
                      <div className="text-sm font-medium mt-2 truncate">{seat.student_name}</div>
                      <div className="text-xs text-gray-500">{seat.student_number}</div>
                      <div className={`text-xs mt-2 px-2 py-1 rounded ${
                        seat.status === 'present' ? 'bg-green-200 text-green-800' :
                        seat.status === 'absent' ? 'bg-red-200 text-red-800' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {seat.status === 'present' ? '✓ Present' : seat.status === 'absent' ? '✗ Absent' : 'Assigned'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </>
              )}
            </div>
          )}

          {/* STATISTICS TAB */}
          {activeTab === 'statistics' && selectedExam && (
            <div className="space-y-6">
              {/* Schedule Selector */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Schedule for Statistics</label>
                <select
                  value={selectedSchedule?.id || ''}
                  onChange={(e) => {
                    const schedule = schedules.find(s => s.id == e.target.value);
                    if (schedule) {
                      setSelectedSchedule(schedule);
                      fetchStatistics(schedule.id);
                    } else {
                      setSelectedSchedule(null);
                      setStatistics(null);
                    }
                  }}
                  className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">-- Select a Schedule --</option>
                  {schedules.map(s => (
                    <option key={s.id} value={s.id}>{s.subject_name} - {s.class_name} ({s.exam_date})</option>
                  ))}
                </select>
              </div>

              {!selectedSchedule ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                  <BarChart3 className="mx-auto text-gray-300" size={48} />
                  <p className="text-gray-500 mt-4">Select a schedule above to view statistics</p>
                  {schedules.length === 0 && (
                    <p className="text-sm text-gray-400 mt-2">No schedules found. Add schedules first from the Schedules tab.</p>
                  )}
                </div>
              ) : (
              <>
              <h3 className="text-lg font-semibold">Statistics: {selectedSchedule.subject_name} - {selectedSchedule.class_name}</h3>
              
              {statistics ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-blue-600 font-medium">Total Students</p>
                    <p className="text-3xl font-bold text-blue-800">{statistics.total_students || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-green-600 font-medium">Passed</p>
                    <p className="text-3xl font-bold text-green-800">{statistics.passed_count || 0}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-red-600 font-medium">Failed</p>
                    <p className="text-3xl font-bold text-red-800">{statistics.failed_count || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-purple-600 font-medium">Pass Rate</p>
                    <p className="text-3xl font-bold text-purple-800">{parseFloat(statistics.pass_percentage || 0).toFixed(1)}%</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-yellow-600 font-medium">Average Marks</p>
                    <p className="text-3xl font-bold text-yellow-800">{parseFloat(statistics.average_marks || 0).toFixed(1)}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-emerald-600 font-medium">Highest Marks</p>
                    <p className="text-3xl font-bold text-emerald-800">{statistics.highest_marks || 0}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-orange-600 font-medium">Lowest Marks</p>
                    <p className="text-3xl font-bold text-orange-800">{statistics.lowest_marks || 0}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg text-center">
                    <p className="text-sm text-indigo-600 font-medium">Average %</p>
                    <p className="text-3xl font-bold text-indigo-800">{parseFloat(statistics.average_percentage || 0).toFixed(1)}%</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <BarChart3 className="mx-auto text-gray-300" size={48} />
                  <p className="text-gray-500 mt-4">No statistics available yet</p>
                  <p className="text-sm text-gray-400">Enter results to see statistics</p>
                </div>
              )}
              </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {modalType === 'exam' ? (editingItem ? 'Edit Exam' : 'Create New Exam') : 'Add Schedule'}
                </h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Exam Form */}
              {modalType === 'exam' && (
                <form onSubmit={editingItem ? handleUpdateExam : handleCreateExam} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name *</label>
                    <input
                      type="text"
                      value={formData.exam_name}
                      onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Mid-Term Examination 2024"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                      <input
                        type="number"
                        value={formData.academic_year}
                        onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                      <select
                        value={formData.term_id}
                        onChange={(e) => setFormData({ ...formData, term_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="">Select Term</option>
                        {terms.map(term => (
                          <option key={term.id} value={term.id}>{term.term_name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                    <textarea
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows={3}
                      placeholder="General instructions for the exam..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                    <button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                      {editingItem ? 'Update Exam' : 'Create Exam'}
                    </button>
                  </div>
                </form>
              )}

              {/* Schedule Form */}
              {modalType === 'schedule' && (
                <form onSubmit={handleCreateSchedule} className="space-y-4">
                  {(classes.length === 0 || subjects.length === 0) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                      <strong>Note:</strong> {classes.length === 0 && 'No classes found. '}{subjects.length === 0 && 'No subjects found. '}
                      Please add classes and subjects first from the respective management pages.
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class * ({classes.length} available)</label>
                      <select
                        value={scheduleForm.class_id}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, class_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      >
                        <option value="">Select Class</option>
                        {classes.map(cls => (
                          <option key={cls.id} value={cls.id}>{cls.class_name || cls.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject * ({subjects.length} available)</label>
                      <select
                        value={scheduleForm.subject_id}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, subject_id: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      >
                        <option value="">Select Subject</option>
                        {subjects.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.subject_name || sub.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exam Date *</label>
                    <input
                      type="date"
                      value={scheduleForm.exam_date}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, exam_date: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={scheduleForm.start_time}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={scheduleForm.end_time}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                      <input
                        type="number"
                        value={scheduleForm.duration_minutes}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, duration_minutes: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
                      <input
                        type="number"
                        value={scheduleForm.max_marks}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, max_marks: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pass Marks</label>
                      <input
                        type="number"
                        value={scheduleForm.pass_marks}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, pass_marks: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                    <textarea
                      value={scheduleForm.instructions}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, instructions: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows={2}
                      placeholder="Specific instructions for this exam..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                    <button type="submit" className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                      Add Schedule
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
