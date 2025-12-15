import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, Video, FileText, CheckCircle, Users, Award, Plus, Edit2, Trash2,
  Eye, Clock, Calendar, Play, ChevronRight, Search, X, RefreshCw,
  GraduationCap, ClipboardList, HelpCircle, Percent, List
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function LMS() {
  // Core state
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('course');
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  
  // Form states
  const [courseForm, setCourseForm] = useState({
    course_code: '', course_name: '', category_id: '', subject_id: '',
    class_id: '', teacher_id: '', description: '', duration_weeks: '', status: 'draft'
  });
  
  const [lessonForm, setLessonForm] = useState({
    lesson_title: '', lesson_order: 1, lesson_type: 'text', content: '',
    video_url: '', duration_minutes: 30, is_free: false, status: 'draft'
  });
  
  const [assignmentForm, setAssignmentForm] = useState({
    assignment_title: '', description: '', instructions: '', max_marks: 100,
    due_date: '', allow_late_submission: false, late_penalty_percentage: 0, status: 'draft'
  });
  
  const [quizForm, setQuizForm] = useState({
    quiz_title: '', description: '', duration_minutes: 30, max_attempts: 1,
    pass_percentage: 50, show_correct_answers: true, randomize_questions: false, status: 'draft'
  });
  
  const [gradeForm, setGradeForm] = useState({ marks_obtained: '', feedback: '' });

  useEffect(() => {
    fetchCourses();
    fetchClasses();
    fetchSubjects();
    fetchTeachers();
  }, []);

  // Fetch functions
  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lms.php?resource=courses`);
      setCourses(response.data.courses || []);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/classes.php`);
      setClasses(response.data.classes || []);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subjects.php`);
      setSubjects(response.data.subjects || []);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/teachers.php`);
      setTeachers(response.data.teachers || []);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchStudentsByClass = async (classId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/students.php?class_id=${classId}`);
      setStudents(response.data.students || []);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchLessons = async (courseId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lms.php?resource=lessons&action=by_course&course_id=${courseId}`);
      setLessons(response.data.lessons || []);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchAssignments = async (courseId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lms.php?resource=assignments&action=by_course&course_id=${courseId}`);
      setAssignments(response.data.assignments || []);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchQuizzes = async (courseId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lms.php?resource=quizzes&action=by_course&course_id=${courseId}`);
      setQuizzes(response.data.quizzes || []);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchEnrollments = async (courseId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lms.php?resource=enrollments&action=by_course&course_id=${courseId}`);
      setEnrollments(response.data.enrollments || []);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchSubmissions = async (assignmentId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lms.php?resource=submissions&action=by_assignment&assignment_id=${assignmentId}`);
      setSubmissions(response.data.submissions || []);
    } catch (error) { console.error('Error:', error); }
  };

  // Course handlers
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/lms.php?resource=courses`, courseForm);
      alert('✅ Course created!');
      setShowModal(false);
      fetchCourses();
      resetCourseForm();
    } catch (error) { alert('Failed to create course'); }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/lms.php?resource=courses&id=${editingItem.id}`, courseForm);
      alert('✅ Course updated!');
      setShowModal(false);
      fetchCourses();
      setEditingItem(null);
    } catch (error) { alert('Failed to update course'); }
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm('Delete this course?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/lms.php?resource=courses&id=${id}`);
      fetchCourses();
      if (selectedCourse?.id === id) { setSelectedCourse(null); setActiveTab('courses'); }
    } catch (error) { alert('Failed to delete'); }
  };

  const handleViewCourse = (course) => {
    setSelectedCourse(course);
    fetchLessons(course.id);
    fetchAssignments(course.id);
    fetchQuizzes(course.id);
    fetchEnrollments(course.id);
    if (course.class_id) fetchStudentsByClass(course.class_id);
    setActiveTab('lessons');
  };

  // Lesson handlers
  const handleCreateLesson = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/lms.php?resource=lessons`, { ...lessonForm, course_id: selectedCourse.id });
      alert('✅ Lesson created!');
      setShowModal(false);
      fetchLessons(selectedCourse.id);
      resetLessonForm();
    } catch (error) { alert('Failed to create lesson'); }
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/lms.php?resource=lessons&id=${editingItem.id}`, lessonForm);
      alert('✅ Lesson updated!');
      setShowModal(false);
      fetchLessons(selectedCourse.id);
      setEditingItem(null);
    } catch (error) { alert('Failed to update lesson'); }
  };

  const handleDeleteLesson = async (id) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/lms.php?resource=lessons&id=${id}`);
      fetchLessons(selectedCourse.id);
    } catch (error) { alert('Failed to delete'); }
  };

  // Assignment handlers
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/lms.php?resource=assignments`, { ...assignmentForm, course_id: selectedCourse.id, class_id: selectedCourse.class_id });
      alert('✅ Assignment created!');
      setShowModal(false);
      fetchAssignments(selectedCourse.id);
      resetAssignmentForm();
    } catch (error) { alert('Failed to create assignment'); }
  };

  const handleGradeSubmission = async (submissionId) => {
    try {
      await axios.put(`${API_BASE_URL}/lms.php?resource=submissions&id=${submissionId}&action=grade`, gradeForm);
      alert('✅ Graded!');
      fetchSubmissions(selectedAssignment.id);
      setGradeForm({ marks_obtained: '', feedback: '' });
    } catch (error) { alert('Failed to grade'); }
  };

  // Quiz handlers
  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/lms.php?resource=quizzes`, { ...quizForm, course_id: selectedCourse.id });
      alert('✅ Quiz created!');
      setShowModal(false);
      fetchQuizzes(selectedCourse.id);
      resetQuizForm();
    } catch (error) { alert('Failed to create quiz'); }
  };

  // Enrollment handlers
  const handleEnrollStudent = async (studentId) => {
    try {
      await axios.post(`${API_BASE_URL}/lms.php?resource=enrollments`, { course_id: selectedCourse.id, student_id: studentId });
      alert('✅ Enrolled!');
      fetchEnrollments(selectedCourse.id);
    } catch (error) { alert('Failed to enroll'); }
  };

  const handleBulkEnroll = async () => {
    if (!selectedCourse.class_id) { alert('Course not assigned to a class'); return; }
    if (!confirm('Enroll all students from class?')) return;
    for (const s of students) {
      await axios.post(`${API_BASE_URL}/lms.php?resource=enrollments`, { course_id: selectedCourse.id, student_id: s.id }).catch(() => {});
    }
    alert('✅ Enrolled!');
    fetchEnrollments(selectedCourse.id);
  };

  // Form resets
  const resetCourseForm = () => setCourseForm({ course_code: '', course_name: '', category_id: '', subject_id: '', class_id: '', teacher_id: '', description: '', duration_weeks: '', status: 'draft' });
  const resetLessonForm = () => setLessonForm({ lesson_title: '', lesson_order: lessons.length + 1, lesson_type: 'text', content: '', video_url: '', duration_minutes: 30, is_free: false, status: 'draft' });
  const resetAssignmentForm = () => setAssignmentForm({ assignment_title: '', description: '', instructions: '', max_marks: 100, due_date: '', allow_late_submission: false, late_penalty_percentage: 0, status: 'draft' });
  const resetQuizForm = () => setQuizForm({ quiz_title: '', description: '', duration_minutes: 30, max_attempts: 1, pass_percentage: 50, show_correct_answers: true, randomize_questions: false, status: 'draft' });

  // Modal openers
  const openAddCourse = () => { setEditingItem(null); resetCourseForm(); setModalType('course'); setShowModal(true); };
  const openEditCourse = (c) => { setEditingItem(c); setCourseForm({ ...c, course_code: c.course_code || '', course_name: c.course_name || '', description: c.description || '', status: c.status || 'draft' }); setModalType('course'); setShowModal(true); };
  const openAddLesson = () => { setEditingItem(null); resetLessonForm(); setModalType('lesson'); setShowModal(true); };
  const openEditLesson = (l) => { setEditingItem(l); setLessonForm({ ...l }); setModalType('lesson'); setShowModal(true); };
  const openAddAssignment = () => { setEditingItem(null); resetAssignmentForm(); setModalType('assignment'); setShowModal(true); };
  const openAddQuiz = () => { setEditingItem(null); resetQuizForm(); setModalType('quiz'); setShowModal(true); };
  const openViewSubmissions = (a) => { setSelectedAssignment(a); fetchSubmissions(a.id); setModalType('submissions'); setShowModal(true); };
  const openEnrollModal = () => { setModalType('enroll'); setShowModal(true); };

  // Helpers
  const filteredCourses = courses.filter(c => {
    const matchSearch = c.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.course_code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getLessonIcon = (type) => {
    if (type === 'video') return <Video className="text-purple-600" size={20} />;
    if (type === 'document') return <FileText className="text-orange-600" size={20} />;
    return <BookOpen className="text-blue-600" size={20} />;
  };

  const getStatusBadge = (status) => {
    const styles = { draft: 'bg-gray-100 text-gray-800', published: 'bg-green-100 text-green-800', active: 'bg-blue-100 text-blue-800', completed: 'bg-purple-100 text-purple-800', graded: 'bg-green-100 text-green-800', submitted: 'bg-yellow-100 text-yellow-800' };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Learning Management System</h1>
          <p className="text-gray-600 mt-1">Manage courses, lessons, assignments, and quizzes</p>
        </div>
        <button onClick={openAddCourse} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus size={20} /> Create Course
        </button>
      </div>

      {/* Breadcrumb */}
      {selectedCourse && (
        <div className="flex items-center gap-2 text-sm mb-4 bg-gray-50 px-4 py-2 rounded-lg">
          <button onClick={() => { setSelectedCourse(null); setActiveTab('courses'); }} className="text-blue-600 hover:underline">All Courses</button>
          <ChevronRight size={16} className="text-gray-400" />
          <span className="font-medium">{selectedCourse.course_name}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-gray-600 text-xs">Courses</p>
          <p className="text-2xl font-bold text-blue-600">{courses.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-gray-600 text-xs">Published</p>
          <p className="text-2xl font-bold text-green-600">{courses.filter(c => c.status === 'published').length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
          <p className="text-gray-600 text-xs">Lessons</p>
          <p className="text-2xl font-bold text-purple-600">{selectedCourse ? lessons.length : '-'}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-orange-500">
          <p className="text-gray-600 text-xs">Assignments</p>
          <p className="text-2xl font-bold text-orange-600">{selectedCourse ? assignments.length : '-'}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-pink-500">
          <p className="text-gray-600 text-xs">Quizzes</p>
          <p className="text-2xl font-bold text-pink-600">{selectedCourse ? quizzes.length : '-'}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-cyan-500">
          <p className="text-gray-600 text-xs">Enrolled</p>
          <p className="text-2xl font-bold text-cyan-600">{selectedCourse ? enrollments.length : '-'}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Tabs */}
        <div className="border-b overflow-x-auto">
          <div className="flex">
            <button onClick={() => { setActiveTab('courses'); setSelectedCourse(null); }} className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === 'courses' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
              <BookOpen size={18} /> Courses
            </button>
            {selectedCourse && (
              <>
                <button onClick={() => setActiveTab('lessons')} className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === 'lessons' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
                  <Video size={18} /> Lessons
                </button>
                <button onClick={() => setActiveTab('assignments')} className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === 'assignments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
                  <ClipboardList size={18} /> Assignments
                </button>
                <button onClick={() => setActiveTab('quizzes')} className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === 'quizzes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
                  <HelpCircle size={18} /> Quizzes
                </button>
                <button onClick={() => setActiveTab('enrollments')} className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === 'enrollments' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>
                  <Users size={18} /> Enrollments
                </button>
              </>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* COURSES TAB */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input type="text" placeholder="Search courses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
                </div>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {filteredCourses.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto text-gray-300" size={48} />
                  <p className="text-gray-500 mt-4">No courses found</p>
                  <button onClick={openAddCourse} className="mt-4 text-blue-600 hover:underline">Create your first course</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map((course) => (
                    <div key={course.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-blue-100 p-3 rounded-lg"><BookOpen className="text-blue-600" size={24} /></div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(course.status)}`}>{course.status}</span>
                          <button onClick={() => openEditCourse(course)} className="p-1 hover:bg-gray-100 rounded"><Edit2 size={16} className="text-gray-500" /></button>
                          <button onClick={() => handleDeleteCourse(course.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 size={16} className="text-red-500" /></button>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.course_name}</h3>
                      <p className="text-sm text-gray-500 mb-2">{course.course_code}</p>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description || 'No description'}</p>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1"><Users size={16} /> {course.student_count || 0}</span>
                        <span className="flex items-center gap-1"><Video size={16} /> {course.lesson_count || 0} lessons</span>
                      </div>
                      {course.teacher_name && <p className="text-xs text-gray-500 mb-3"><GraduationCap size={14} className="inline mr-1" />{course.teacher_name}</p>}
                      <button onClick={() => handleViewCourse(course)} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                        <Eye size={18} /> View Course
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LESSONS TAB */}
          {activeTab === 'lessons' && selectedCourse && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Lessons ({lessons.length})</h3>
                <button onClick={openAddLesson} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Add Lesson</button>
              </div>
              {lessons.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Video className="mx-auto text-gray-300" size={48} />
                  <p className="text-gray-500 mt-4">No lessons yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lessons.map((lesson, idx) => (
                    <div key={lesson.id} className="border rounded-lg p-4 flex items-start gap-4 hover:bg-gray-50">
                      <div className="bg-purple-100 p-3 rounded-lg">{getLessonIcon(lesson.lesson_type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">Lesson {lesson.lesson_order || idx + 1}</span>
                          <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(lesson.status)}`}>{lesson.status}</span>
                          {lesson.is_free && <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">Free</span>}
                        </div>
                        <h4 className="font-semibold text-gray-900">{lesson.lesson_title}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1"><Clock size={14} /> {lesson.duration_minutes} mins</span>
                          <span className="capitalize">{lesson.lesson_type}</span>
                          {lesson.video_url && <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1"><Play size={14} /> Watch</a>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEditLesson(lesson)} className="p-2 hover:bg-gray-200 rounded"><Edit2 size={16} className="text-gray-500" /></button>
                        <button onClick={() => handleDeleteLesson(lesson.id)} className="p-2 hover:bg-red-50 rounded"><Trash2 size={16} className="text-red-500" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ASSIGNMENTS TAB */}
          {activeTab === 'assignments' && selectedCourse && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Assignments ({assignments.length})</h3>
                <button onClick={openAddAssignment} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Create Assignment</button>
              </div>
              {assignments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <ClipboardList className="mx-auto text-gray-300" size={48} />
                  <p className="text-gray-500 mt-4">No assignments yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map((a) => (
                    <div key={a.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{a.assignment_title}</h4>
                            <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(a.status)}`}>{a.status}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{a.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1"><Award size={14} /> Max: {a.max_marks}</span>
                            <span className="flex items-center gap-1"><Calendar size={14} /> Due: {a.due_date || 'Not set'}</span>
                            {a.allow_late_submission && <span className="text-orange-600">Late: -{a.late_penalty_percentage}%</span>}
                            <span className="flex items-center gap-1"><FileText size={14} /> {a.submission_count || 0} submissions</span>
                          </div>
                        </div>
                        <button onClick={() => openViewSubmissions(a)} className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm">View Submissions</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* QUIZZES TAB */}
          {activeTab === 'quizzes' && selectedCourse && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Quizzes ({quizzes.length})</h3>
                <button onClick={openAddQuiz} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Create Quiz</button>
              </div>
              {quizzes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <HelpCircle className="mx-auto text-gray-300" size={48} />
                  <p className="text-gray-500 mt-4">No quizzes yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quizzes.map((q) => (
                    <div key={q.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="bg-pink-100 p-2 rounded-lg"><HelpCircle className="text-pink-600" size={20} /></div>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(q.status)}`}>{q.status}</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{q.quiz_title}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{q.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1"><Clock size={14} /> {q.duration_minutes} mins</span>
                        <span className="flex items-center gap-1"><RefreshCw size={14} /> {q.max_attempts} attempts</span>
                        <span className="flex items-center gap-1"><Percent size={14} /> Pass: {q.pass_percentage}%</span>
                        <span className="flex items-center gap-1"><List size={14} /> {q.question_count || 0} questions</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ENROLLMENTS TAB */}
          {activeTab === 'enrollments' && selectedCourse && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Enrolled Students ({enrollments.length})</h3>
                <div className="flex gap-2">
                  <button onClick={handleBulkEnroll} className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2"><Users size={18} /> Bulk Enroll</button>
                  <button onClick={openEnrollModal} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Plus size={18} /> Enroll</button>
                </div>
              </div>
              {enrollments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Users className="mx-auto text-gray-300" size={48} />
                  <p className="text-gray-500 mt-4">No students enrolled</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {enrollments.map((e) => (
                        <tr key={e.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{e.student_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{e.student_number}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${e.completion_percentage || 0}%` }}></div>
                              </div>
                              <span className="text-sm">{e.completion_percentage || 0}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs ${getStatusBadge(e.status)}`}>{e.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {modalType === 'course' && (editingItem ? 'Edit Course' : 'Create Course')}
                {modalType === 'lesson' && (editingItem ? 'Edit Lesson' : 'Add Lesson')}
                {modalType === 'assignment' && 'Create Assignment'}
                {modalType === 'quiz' && 'Create Quiz'}
                {modalType === 'submissions' && `Submissions: ${selectedAssignment?.assignment_title}`}
                {modalType === 'enroll' && 'Enroll Student'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6">
              {/* Course Form */}
              {modalType === 'course' && (
                <form onSubmit={editingItem ? handleUpdateCourse : handleCreateCourse} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Course Code *</label><input type="text" value={courseForm.course_code} onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
                    <div><label className="block text-sm font-medium mb-1">Duration (weeks)</label><input type="number" value={courseForm.duration_weeks} onChange={(e) => setCourseForm({ ...courseForm, duration_weeks: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Course Name *</label><input type="text" value={courseForm.course_name} onChange={(e) => setCourseForm({ ...courseForm, course_name: e.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Class</label><select value={courseForm.class_id} onChange={(e) => setCourseForm({ ...courseForm, class_id: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="">Select</option>{classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}</select></div>
                    <div><label className="block text-sm font-medium mb-1">Subject</label><select value={courseForm.subject_id} onChange={(e) => setCourseForm({ ...courseForm, subject_id: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="">Select</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}</select></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Teacher</label><select value={courseForm.teacher_id} onChange={(e) => setCourseForm({ ...courseForm, teacher_id: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="">Select</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={3} /></div>
                  <div><label className="block text-sm font-medium mb-1">Status</label><select value={courseForm.status} onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="draft">Draft</option><option value="published">Published</option></select></div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">{editingItem ? 'Update' : 'Create'}</button></div>
                </form>
              )}

              {/* Lesson Form */}
              {modalType === 'lesson' && (
                <form onSubmit={editingItem ? handleUpdateLesson : handleCreateLesson} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Order</label><input type="number" value={lessonForm.lesson_order} onChange={(e) => setLessonForm({ ...lessonForm, lesson_order: e.target.value })} className="w-full border rounded-lg px-3 py-2" min="1" /></div>
                    <div><label className="block text-sm font-medium mb-1">Duration (mins)</label><input type="number" value={lessonForm.duration_minutes} onChange={(e) => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Title *</label><input type="text" value={lessonForm.lesson_title} onChange={(e) => setLessonForm({ ...lessonForm, lesson_title: e.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Type</label><select value={lessonForm.lesson_type} onChange={(e) => setLessonForm({ ...lessonForm, lesson_type: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="text">Text</option><option value="video">Video</option><option value="document">Document</option></select></div>
                    <div><label className="block text-sm font-medium mb-1">Status</label><select value={lessonForm.status} onChange={(e) => setLessonForm({ ...lessonForm, status: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="draft">Draft</option><option value="published">Published</option></select></div>
                  </div>
                  {lessonForm.lesson_type === 'video' && <div><label className="block text-sm font-medium mb-1">Video URL</label><input type="url" value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} className="w-full border rounded-lg px-3 py-2" placeholder="https://..." /></div>}
                  {lessonForm.lesson_type === 'text' && <div><label className="block text-sm font-medium mb-1">Content</label><textarea value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={5} /></div>}
                  <div className="flex items-center gap-2"><input type="checkbox" id="is_free" checked={lessonForm.is_free} onChange={(e) => setLessonForm({ ...lessonForm, is_free: e.target.checked })} className="rounded" /><label htmlFor="is_free" className="text-sm">Free Preview</label></div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">{editingItem ? 'Update' : 'Add'}</button></div>
                </form>
              )}

              {/* Assignment Form */}
              {modalType === 'assignment' && (
                <form onSubmit={handleCreateAssignment} className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Title *</label><input type="text" value={assignmentForm.assignment_title} onChange={(e) => setAssignmentForm({ ...assignmentForm, assignment_title: e.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
                  <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={assignmentForm.description} onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
                  <div><label className="block text-sm font-medium mb-1">Instructions</label><textarea value={assignmentForm.instructions} onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={3} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Max Marks</label><input type="number" value={assignmentForm.max_marks} onChange={(e) => setAssignmentForm({ ...assignmentForm, max_marks: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">Due Date</label><input type="date" value={assignmentForm.due_date} onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2"><input type="checkbox" id="allow_late" checked={assignmentForm.allow_late_submission} onChange={(e) => setAssignmentForm({ ...assignmentForm, allow_late_submission: e.target.checked })} className="rounded" /><label htmlFor="allow_late" className="text-sm">Allow late</label></div>
                    {assignmentForm.allow_late_submission && <div className="flex items-center gap-2"><label className="text-sm">Penalty:</label><input type="number" value={assignmentForm.late_penalty_percentage} onChange={(e) => setAssignmentForm({ ...assignmentForm, late_penalty_percentage: e.target.value })} className="w-20 border rounded-lg px-2 py-1" /><span className="text-sm">%</span></div>}
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Status</label><select value={assignmentForm.status} onChange={(e) => setAssignmentForm({ ...assignmentForm, status: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="draft">Draft</option><option value="published">Published</option></select></div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Create</button></div>
                </form>
              )}

              {/* Quiz Form */}
              {modalType === 'quiz' && (
                <form onSubmit={handleCreateQuiz} className="space-y-4">
                  <div><label className="block text-sm font-medium mb-1">Title *</label><input type="text" value={quizForm.quiz_title} onChange={(e) => setQuizForm({ ...quizForm, quiz_title: e.target.value })} className="w-full border rounded-lg px-3 py-2" required /></div>
                  <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={quizForm.description} onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Duration (mins)</label><input type="number" value={quizForm.duration_minutes} onChange={(e) => setQuizForm({ ...quizForm, duration_minutes: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                    <div><label className="block text-sm font-medium mb-1">Max Attempts</label><input type="number" value={quizForm.max_attempts} onChange={(e) => setQuizForm({ ...quizForm, max_attempts: e.target.value })} className="w-full border rounded-lg px-3 py-2" min="1" /></div>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Pass %</label><input type="number" value={quizForm.pass_percentage} onChange={(e) => setQuizForm({ ...quizForm, pass_percentage: e.target.value })} className="w-full border rounded-lg px-3 py-2" min="0" max="100" /></div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2"><input type="checkbox" id="show_ans" checked={quizForm.show_correct_answers} onChange={(e) => setQuizForm({ ...quizForm, show_correct_answers: e.target.checked })} className="rounded" /><label htmlFor="show_ans" className="text-sm">Show correct answers</label></div>
                    <div className="flex items-center gap-2"><input type="checkbox" id="randomize" checked={quizForm.randomize_questions} onChange={(e) => setQuizForm({ ...quizForm, randomize_questions: e.target.checked })} className="rounded" /><label htmlFor="randomize" className="text-sm">Randomize questions</label></div>
                  </div>
                  <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Create</button></div>
                </form>
              )}

              {/* Submissions View */}
              {modalType === 'submissions' && (
                <div className="space-y-4">
                  {submissions.length === 0 ? (
                    <div className="text-center py-8"><FileText className="mx-auto text-gray-300" size={48} /><p className="text-gray-500 mt-4">No submissions</p></div>
                  ) : (
                    submissions.map((sub) => (
                      <div key={sub.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div><p className="font-medium">{sub.student_name}</p><p className="text-sm text-gray-500">{sub.student_number}</p></div>
                          <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(sub.status)}`}>{sub.status}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{sub.submission_text || 'No text'}</p>
                        <p className="text-xs text-gray-500 mb-3">Submitted: {sub.submitted_at} {sub.is_late && <span className="text-red-500">(Late)</span>}</p>
                        {sub.status !== 'graded' ? (
                          <div className="flex gap-2 items-end">
                            <div className="flex-1"><label className="text-xs">Marks</label><input type="number" value={gradeForm.marks_obtained} onChange={(e) => setGradeForm({ ...gradeForm, marks_obtained: e.target.value })} className="w-full border rounded px-2 py-1" max={selectedAssignment?.max_marks} /></div>
                            <div className="flex-1"><label className="text-xs">Feedback</label><input type="text" value={gradeForm.feedback} onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })} className="w-full border rounded px-2 py-1" /></div>
                            <button onClick={() => handleGradeSubmission(sub.id)} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Grade</button>
                          </div>
                        ) : (
                          <div className="bg-green-50 p-2 rounded"><p className="text-sm"><strong>Marks:</strong> {sub.marks_obtained}/{selectedAssignment?.max_marks}</p>{sub.feedback && <p className="text-sm text-gray-600">{sub.feedback}</p>}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Enroll Modal */}
              {modalType === 'enroll' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Select students to enroll in this course:</p>
                  {students.length === 0 ? (
                    <p className="text-center py-4 text-gray-500">No students in assigned class</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {students.filter(s => !enrollments.find(e => e.student_id === s.id)).map((s) => (
                        <div key={s.id} className="flex justify-between items-center p-2 border rounded hover:bg-gray-50">
                          <span>{s.first_name} {s.last_name} ({s.student_id})</span>
                          <button onClick={() => handleEnrollStudent(s.id)} className="text-blue-600 hover:underline text-sm">Enroll</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
