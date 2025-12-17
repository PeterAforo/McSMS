import { useState, useEffect } from 'react';
import { 
  UserCheck, Calendar, FileText, Users, Plus, Edit, Trash2, X, Save,
  Clock, MapPin, AlertTriangle, BookOpen, ClipboardList, Phone,
  Loader2, ChevronRight, Eye, CheckCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function SubstituteMode() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const [formData, setFormData] = useState({
    class_id: '',
    date_from: '',
    date_to: '',
    substitute_teacher_id: '',
    lesson_plans: '',
    class_info: '',
    student_notes: '',
    special_instructions: '',
    materials_location: '',
    routines: '',
    behavior_notes: '',
    emergency_contacts: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const teacherRes = await axios.get(`${API_BASE_URL}/teachers.php?user_id=${user?.id}`);
      const teachersList = teacherRes.data.teachers || [];
      
      if (teachersList.length > 0) {
        const currentTeacher = teachersList[0];
        setTeacherId(currentTeacher.id);
        setTeachers(teachersList);
        
        const [classesRes, notesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/teacher_subjects.php?teacher_id=${currentTeacher.id}`),
          axios.get(`${API_BASE_URL}/substitute_mode.php?teacher_id=${currentTeacher.id}`)
        ]);

        // Use teacher_classes from API response
        const teacherClasses = classesRes.data.teacher_classes || [];
        const uniqueClasses = teacherClasses.map(tc => ({
          id: tc.class_id,
          class_name: tc.class_name
        }));
        
        setClasses(uniqueClasses);
        setNotes(notesRes.data.notes || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingNote(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setFormData({
      class_id: classes[0]?.id || '',
      date_from: tomorrow.toISOString().split('T')[0],
      date_to: tomorrow.toISOString().split('T')[0],
      substitute_teacher_id: '',
      lesson_plans: '',
      class_info: '',
      student_notes: '',
      special_instructions: '',
      materials_location: '',
      routines: '',
      behavior_notes: '',
      emergency_contacts: ''
    });
    setShowModal(true);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setFormData({
      class_id: note.class_id,
      date_from: note.date_from,
      date_to: note.date_to,
      substitute_teacher_id: note.substitute_teacher_id || '',
      lesson_plans: note.lesson_plans || '',
      class_info: note.class_info || '',
      student_notes: note.student_notes || '',
      special_instructions: note.special_instructions || '',
      materials_location: note.materials_location || '',
      routines: note.routines || '',
      behavior_notes: note.behavior_notes || '',
      emergency_contacts: note.emergency_contacts || ''
    });
    setShowModal(true);
  };

  const handleView = async (note) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/substitute_mode.php?id=${note.id}`);
      setSelectedNote(response.data.note);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        teacher_id: teacherId,
        ...formData
      };

      if (editingNote) {
        await axios.put(`${API_BASE_URL}/substitute_mode.php?id=${editingNote.id}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/substitute_mode.php`, payload);
      }

      setShowModal(false);
      fetchInitialData();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this substitute note?')) {
      try {
        await axios.delete(`${API_BASE_URL}/substitute_mode.php?id=${id}`);
        fetchInitialData();
        if (selectedNote?.id === id) setSelectedNote(null);
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const getStatusBadge = (note) => {
    const today = new Date().toISOString().split('T')[0];
    if (note.date_to < today) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Completed</span>;
    }
    if (note.date_from <= today && note.date_to >= today) {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Active</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Upcoming</span>;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Substitute Teacher Mode</h1>
          <p className="text-gray-600">Leave detailed notes for substitute teachers</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" /> Create Handover Notes
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <UserCheck className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <h4 className="font-medium text-blue-900">Planning to be absent?</h4>
          <p className="text-sm text-blue-700 mt-1">
            Create detailed handover notes to help substitute teachers manage your classes effectively. 
            Include lesson plans, student information, and classroom routines.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notes List */}
        <div className="card">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">Your Handover Notes</h3>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {notes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No handover notes yet</p>
              </div>
            ) : (
              notes.map(note => (
                <button
                  key={note.id}
                  onClick={() => handleView(note)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedNote?.id === note.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{note.class_name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(note.date_from).toLocaleDateString()} - {new Date(note.date_to).toLocaleDateString()}
                      </p>
                      {note.substitute_name && (
                        <p className="text-xs text-gray-500 mt-1">
                          Sub: {note.substitute_name}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(note)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Note Details */}
        <div className="lg:col-span-2">
          {selectedNote ? (
            <div className="card">
              <div className="p-6 border-b flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedNote.class_name}</h2>
                  <p className="text-gray-500">
                    {new Date(selectedNote.date_from).toLocaleDateString()} - {new Date(selectedNote.date_to).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(selectedNote)} className="btn bg-blue-100 text-blue-700 hover:bg-blue-200 btn-sm">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(selectedNote.id)} className="btn bg-red-100 text-red-700 hover:bg-red-200 btn-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {selectedNote.substitute_name && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <UserCheck className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Substitute Teacher</p>
                      <p className="font-medium text-gray-900">{selectedNote.substitute_name}</p>
                    </div>
                  </div>
                )}

                {selectedNote.lesson_plans && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600" /> Lesson Plans
                    </h3>
                    <div className="bg-blue-50 p-4 rounded-lg whitespace-pre-line text-gray-700">
                      {selectedNote.lesson_plans}
                    </div>
                  </div>
                )}

                {selectedNote.class_info && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" /> Class Information
                    </h3>
                    <div className="bg-purple-50 p-4 rounded-lg whitespace-pre-line text-gray-700">
                      {selectedNote.class_info}
                    </div>
                  </div>
                )}

                {selectedNote.routines && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600" /> Daily Routines
                    </h3>
                    <div className="bg-green-50 p-4 rounded-lg whitespace-pre-line text-gray-700">
                      {selectedNote.routines}
                    </div>
                  </div>
                )}

                {selectedNote.student_notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" /> Student Notes
                    </h3>
                    <div className="bg-orange-50 p-4 rounded-lg whitespace-pre-line text-gray-700">
                      {selectedNote.student_notes}
                    </div>
                  </div>
                )}

                {selectedNote.behavior_notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Behavior Notes</h3>
                    <div className="bg-red-50 p-4 rounded-lg whitespace-pre-line text-gray-700">
                      {selectedNote.behavior_notes}
                    </div>
                  </div>
                )}

                {selectedNote.materials_location && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-600" /> Materials Location
                    </h3>
                    <div className="bg-teal-50 p-4 rounded-lg whitespace-pre-line text-gray-700">
                      {selectedNote.materials_location}
                    </div>
                  </div>
                )}

                {selectedNote.special_instructions && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-indigo-600" /> Special Instructions
                    </h3>
                    <div className="bg-indigo-50 p-4 rounded-lg whitespace-pre-line text-gray-700">
                      {selectedNote.special_instructions}
                    </div>
                  </div>
                )}

                {selectedNote.emergency_contacts && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-red-600" /> Emergency Contacts
                    </h3>
                    <div className="bg-red-50 p-4 rounded-lg whitespace-pre-line text-gray-700">
                      {selectedNote.emergency_contacts}
                    </div>
                  </div>
                )}

                {/* Students List */}
                {selectedNote.students?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Class Roster ({selectedNote.students.length} students)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {selectedNote.students.map(student => (
                        <div key={student.id} className="p-2 bg-gray-50 rounded text-sm">
                          <p className="font-medium">{student.first_name} {student.last_name}</p>
                          {student.medical_conditions && (
                            <p className="text-xs text-red-600">⚠️ Medical: {student.medical_conditions}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Note</h3>
              <p className="text-gray-500">Choose a handover note to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingNote ? 'Edit Handover Notes' : 'Create Handover Notes'}
              </h2>
              <button onClick={() => setShowModal(false)}><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Class *</label>
                  <select
                    required
                    value={formData.class_id}
                    onChange={(e) => setFormData({...formData, class_id: e.target.value})}
                    className="input"
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Substitute Teacher</label>
                  <select
                    value={formData.substitute_teacher_id}
                    onChange={(e) => setFormData({...formData, substitute_teacher_id: e.target.value})}
                    className="input"
                  >
                    <option value="">Not assigned yet</option>
                    {teachers.filter(t => t.id !== teacherId).map(t => (
                      <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">From Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date_from}
                    onChange={(e) => setFormData({...formData, date_from: e.target.value})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">To Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date_to}
                    onChange={(e) => setFormData({...formData, date_to: e.target.value})}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <BookOpen className="w-4 h-4 inline mr-1" /> Lesson Plans
                </label>
                <textarea
                  value={formData.lesson_plans}
                  onChange={(e) => setFormData({...formData, lesson_plans: e.target.value})}
                  className="input"
                  rows="4"
                  placeholder="What should be taught during your absence? Include topics, activities, and page numbers..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Users className="w-4 h-4 inline mr-1" /> Class Information
                </label>
                <textarea
                  value={formData.class_info}
                  onChange={(e) => setFormData({...formData, class_info: e.target.value})}
                  className="input"
                  rows="3"
                  placeholder="General information about the class, seating arrangements, class rules..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Clock className="w-4 h-4 inline mr-1" /> Daily Routines
                </label>
                <textarea
                  value={formData.routines}
                  onChange={(e) => setFormData({...formData, routines: e.target.value})}
                  className="input"
                  rows="3"
                  placeholder="Morning routine, transitions, dismissal procedures..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <AlertTriangle className="w-4 h-4 inline mr-1" /> Student Notes
                </label>
                <textarea
                  value={formData.student_notes}
                  onChange={(e) => setFormData({...formData, student_notes: e.target.value})}
                  className="input"
                  rows="3"
                  placeholder="Students who need extra attention, medical needs, behavioral concerns..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" /> Materials Location
                  </label>
                  <textarea
                    value={formData.materials_location}
                    onChange={(e) => setFormData({...formData, materials_location: e.target.value})}
                    className="input"
                    rows="2"
                    placeholder="Where to find textbooks, worksheets, supplies..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Phone className="w-4 h-4 inline mr-1" /> Emergency Contacts
                  </label>
                  <textarea
                    value={formData.emergency_contacts}
                    onChange={(e) => setFormData({...formData, emergency_contacts: e.target.value})}
                    className="input"
                    rows="2"
                    placeholder="Your contact info, department head, office..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Special Instructions</label>
                <textarea
                  value={formData.special_instructions}
                  onChange={(e) => setFormData({...formData, special_instructions: e.target.value})}
                  className="input"
                  rows="2"
                  placeholder="Any other important information..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn bg-gray-200">Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Save className="w-4 h-4 mr-2" /> {editingNote ? 'Update' : 'Create'} Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
