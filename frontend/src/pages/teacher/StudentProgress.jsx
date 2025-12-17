import { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Target, FileText, Plus, Edit, Trash2, X, Save,
  Search, Filter, Eye, Award, AlertTriangle, CheckCircle, Clock,
  BarChart3, Calendar, BookOpen, Loader2, ChevronRight, Star
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function StudentProgress() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const [goalForm, setGoalForm] = useState({
    goal_type: 'academic',
    title: '',
    description: '',
    target_value: '',
    target_date: ''
  });

  const [noteForm, setNoteForm] = useState({
    note_type: 'progress',
    title: '',
    content: '',
    is_private: 1
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentProgress();
    }
  }, [selectedStudent]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const teacherRes = await axios.get(`${API_BASE_URL}/teachers.php?user_id=${user?.id}`);
      const teachers = teacherRes.data.teachers || [];
      
      if (teachers.length > 0) {
        setTeacherId(teachers[0].id);
        
        const classesRes = await axios.get(`${API_BASE_URL}/teacher_subjects.php?teacher_id=${teachers[0].id}`);
        const teacherSubjects = classesRes.data.teacher_subjects || [];
        
        const uniqueClasses = [];
        const classIds = new Set();
        teacherSubjects.forEach(ts => {
          if (!classIds.has(ts.class_id)) {
            classIds.add(ts.class_id);
            uniqueClasses.push({ id: ts.class_id, class_name: ts.class_name });
          }
        });
        
        setClasses(uniqueClasses);
        if (uniqueClasses.length > 0) {
          setSelectedClass(uniqueClasses[0].id);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/student_progress.php?resource=class_overview&class_id=${selectedClass}`);
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchStudentProgress = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/student_progress.php?resource=overview&student_id=${selectedStudent.id}&teacher_id=${teacherId}`);
      setStudentProgress(response.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const handleAddGoal = () => {
    setEditingGoal(null);
    setGoalForm({
      goal_type: 'academic',
      title: '',
      description: '',
      target_value: '',
      target_date: ''
    });
    setShowGoalModal(true);
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setGoalForm({
      goal_type: goal.goal_type,
      title: goal.title,
      description: goal.description || '',
      target_value: goal.target_value || '',
      target_date: goal.target_date || ''
    });
    setShowGoalModal(true);
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        resource: 'goal',
        student_id: selectedStudent.id,
        teacher_id: teacherId,
        ...goalForm
      };

      if (editingGoal) {
        await axios.put(`${API_BASE_URL}/student_progress.php?id=${editingGoal.id}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/student_progress.php`, payload);
      }

      setShowGoalModal(false);
      fetchStudentProgress();
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Failed to save goal');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (window.confirm('Delete this goal?')) {
      try {
        await axios.delete(`${API_BASE_URL}/student_progress.php?id=${id}&resource=goal`);
        fetchStudentProgress();
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleUpdateGoalStatus = async (goal, status) => {
    try {
      await axios.put(`${API_BASE_URL}/student_progress.php?id=${goal.id}`, {
        resource: 'goal',
        status
      });
      fetchStudentProgress();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddNote = () => {
    setNoteForm({
      note_type: 'progress',
      title: '',
      content: '',
      is_private: 1
    });
    setShowNoteModal(true);
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/student_progress.php`, {
        resource: 'note',
        student_id: selectedStudent.id,
        teacher_id: teacherId,
        ...noteForm
      });

      setShowNoteModal(false);
      fetchStudentProgress();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note');
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAttendanceRate = (student) => {
    if (!student.total_days || student.total_days === 0) return 'N/A';
    return Math.round((student.present_days / student.total_days) * 100) + '%';
  };

  const getGradeColor = (grade) => {
    if (!grade || grade === 'N/A') return 'text-gray-500';
    const num = parseFloat(grade);
    if (num >= 70) return 'text-green-600';
    if (num >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Progress Tracking</h1>
        <p className="text-gray-600">Monitor individual student progress and set goals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student List */}
        <div className="card">
          <div className="p-4 border-b">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input w-full mb-3"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.class_name}</option>
              ))}
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {filteredStudents.map(student => (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className={`w-full p-4 text-left border-b hover:bg-gray-50 transition-colors ${
                  selectedStudent?.id === student.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                    <p className="text-xs text-gray-500">{student.admission_number}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getGradeColor(student.avg_grade)}`}>
                      {student.avg_grade ? `${Math.round(student.avg_grade)}%` : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500">{getAttendanceRate(student)} att.</p>
                  </div>
                </div>
                {student.active_goals > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                    <Target className="w-3 h-3" />
                    {student.active_goals} active goal{student.active_goals > 1 ? 's' : ''}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Student Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedStudent && studentProgress ? (
            <>
              {/* Student Header */}
              <div className="card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {studentProgress.student?.first_name} {studentProgress.student?.last_name}
                    </h2>
                    <p className="text-gray-500">{studentProgress.student?.class_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleAddGoal} className="btn btn-primary btn-sm">
                      <Target className="w-4 h-4 mr-1" /> Add Goal
                    </button>
                    <button onClick={handleAddNote} className="btn bg-green-600 text-white hover:bg-green-700 btn-sm">
                      <FileText className="w-4 h-4 mr-1" /> Add Note
                    </button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4 mt-6">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">
                      {studentProgress.grades_by_subject?.length > 0 
                        ? Math.round(studentProgress.grades_by_subject.reduce((sum, g) => sum + (parseFloat(g.average) || 0), 0) / studentProgress.grades_by_subject.length)
                        : 'N/A'}
                      {studentProgress.grades_by_subject?.length > 0 && '%'}
                    </p>
                    <p className="text-xs text-gray-600">Avg Grade</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">
                      {studentProgress.attendance?.total_days > 0 
                        ? Math.round((studentProgress.attendance.present / studentProgress.attendance.total_days) * 100)
                        : 'N/A'}
                      {studentProgress.attendance?.total_days > 0 && '%'}
                    </p>
                    <p className="text-xs text-gray-600">Attendance</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-700">
                      {studentProgress.active_goals?.length || 0}
                    </p>
                    <p className="text-xs text-gray-600">Active Goals</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-orange-700">
                      {studentProgress.progress_notes?.length || 0}
                    </p>
                    <p className="text-xs text-gray-600">Notes</p>
                  </div>
                </div>
              </div>

              {/* Grades by Subject */}
              {studentProgress.grades_by_subject?.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" /> Performance by Subject
                  </h3>
                  <div className="space-y-3">
                    {studentProgress.grades_by_subject.map((subject, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <span className="w-32 text-sm text-gray-600 truncate">{subject.subject_name}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${
                              parseFloat(subject.average) >= 70 ? 'bg-green-500' :
                              parseFloat(subject.average) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, subject.average || 0)}%` }}
                          />
                        </div>
                        <span className={`w-16 text-right text-sm font-medium ${getGradeColor(subject.average)}`}>
                          {subject.average ? `${Math.round(subject.average)}%` : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Goals */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" /> Active Goals
                </h3>
                {studentProgress.active_goals?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No active goals set</p>
                    <button onClick={handleAddGoal} className="btn btn-primary btn-sm mt-3">
                      Set First Goal
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentProgress.active_goals.map(goal => (
                      <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                goal.goal_type === 'academic' ? 'bg-blue-100 text-blue-700' :
                                goal.goal_type === 'behavior' ? 'bg-green-100 text-green-700' :
                                goal.goal_type === 'attendance' ? 'bg-orange-100 text-orange-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {goal.goal_type}
                              </span>
                              <h4 className="font-medium text-gray-900">{goal.title}</h4>
                            </div>
                            {goal.description && (
                              <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                            )}
                            {goal.target_date && (
                              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Target: {new Date(goal.target_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleUpdateGoalStatus(goal, 'achieved')}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                              title="Mark as achieved"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditGoal(goal)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {goal.target_value && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{goal.current_value || 0} / {goal.target_value}</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-500 h-2 rounded-full"
                                style={{ width: `${Math.min(100, ((goal.current_value || 0) / goal.target_value) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Progress Notes */}
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" /> Progress Notes
                </h3>
                {studentProgress.progress_notes?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No notes yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studentProgress.progress_notes.map(note => (
                      <div key={note.id} className={`p-4 rounded-lg border-l-4 ${
                        note.note_type === 'achievement' ? 'bg-green-50 border-green-500' :
                        note.note_type === 'concern' ? 'bg-red-50 border-red-500' :
                        note.note_type === 'observation' ? 'bg-yellow-50 border-yellow-500' :
                        'bg-blue-50 border-blue-500'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div>
                            {note.title && <h4 className="font-medium text-gray-900">{note.title}</h4>}
                            <p className="text-sm text-gray-700 mt-1">{note.content}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {note.teacher_name} • {new Date(note.created_at).toLocaleDateString()}
                              {note.is_private == 1 && <span className="ml-2 text-orange-600">(Private)</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Student</h3>
              <p className="text-gray-500">Choose a student from the list to view their progress</p>
            </div>
          )}
        </div>
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingGoal ? 'Edit Goal' : 'Add Goal'}</h2>
              <button onClick={() => setShowGoalModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveGoal} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Goal Type</label>
                <select
                  value={goalForm.goal_type}
                  onChange={(e) => setGoalForm({...goalForm, goal_type: e.target.value})}
                  className="input"
                >
                  <option value="academic">Academic</option>
                  <option value="behavior">Behavior</option>
                  <option value="attendance">Attendance</option>
                  <option value="skill">Skill</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({...goalForm, title: e.target.value})}
                  className="input"
                  placeholder="e.g., Improve Math grade to 80%"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                  className="input"
                  rows="2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Target Value</label>
                  <input
                    type="number"
                    value={goalForm.target_value}
                    onChange={(e) => setGoalForm({...goalForm, target_value: e.target.value})}
                    className="input"
                    placeholder="e.g., 80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Target Date</label>
                  <input
                    type="date"
                    value={goalForm.target_date}
                    onChange={(e) => setGoalForm({...goalForm, target_date: e.target.value})}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowGoalModal(false)} className="btn bg-gray-200">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add Progress Note</h2>
              <button onClick={() => setShowNoteModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveNote} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Note Type</label>
                <select
                  value={noteForm.note_type}
                  onChange={(e) => setNoteForm({...noteForm, note_type: e.target.value})}
                  className="input"
                >
                  <option value="progress">Progress Update</option>
                  <option value="achievement">Achievement</option>
                  <option value="concern">Concern</option>
                  <option value="observation">Observation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({...noteForm, title: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content *</label>
                <textarea
                  required
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({...noteForm, content: e.target.value})}
                  className="input"
                  rows="4"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_private"
                  checked={noteForm.is_private == 1}
                  onChange={(e) => setNoteForm({...noteForm, is_private: e.target.checked ? 1 : 0})}
                />
                <label htmlFor="is_private" className="text-sm">Private note (only visible to you)</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowNoteModal(false)} className="btn bg-gray-200">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Note</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
