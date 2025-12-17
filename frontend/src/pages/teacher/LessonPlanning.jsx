import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Plus, Edit, Trash2, X, Save, Calendar, Clock, FileText,
  Link, Video, File, Search, Filter, ChevronRight, Eye, Copy, Share2,
  CheckCircle, AlertCircle, Loader2, BookMarked, Target, Users
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function LessonPlanning() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [lessonPlans, setLessonPlans] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teacherId, setTeacherId] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [viewingPlan, setViewingPlan] = useState(null);
  
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    class_id: '',
    subject_id: '',
    title: '',
    description: '',
    objectives: '',
    materials: '',
    activities: '',
    assessment: '',
    homework: '',
    notes: '',
    duration_minutes: 45,
    lesson_date: '',
    status: 'draft',
    resources: []
  });

  const [newResource, setNewResource] = useState({ resource_type: 'link', title: '', url: '', description: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Get teacher ID
      const teacherRes = await axios.get(`${API_BASE_URL}/teachers.php?user_id=${user?.id}`);
      const teachers = teacherRes.data.teachers || [];
      if (teachers.length > 0) {
        setTeacherId(teachers[0].id);
        
        // Fetch teacher's classes and subjects
        const [classesRes, subjectsRes, plansRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/teacher_subjects.php?teacher_id=${teachers[0].id}`),
          axios.get(`${API_BASE_URL}/subjects.php`),
          axios.get(`${API_BASE_URL}/lesson_plans.php?teacher_id=${teachers[0].id}`)
        ]);

        // Use teacher_classes from API response
        const teacherClasses = classesRes.data.teacher_classes || [];
        const uniqueClasses = teacherClasses.map(tc => ({
          id: tc.class_id,
          class_name: tc.class_name
        }));
        
        setClasses(uniqueClasses);
        setSubjects(subjectsRes.data.subjects || []);
        setLessonPlans(plansRes.data.lesson_plans || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPlan(null);
    setFormData({
      class_id: '',
      subject_id: '',
      title: '',
      description: '',
      objectives: '',
      materials: '',
      activities: '',
      assessment: '',
      homework: '',
      notes: '',
      duration_minutes: 45,
      lesson_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      resources: []
    });
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      class_id: plan.class_id,
      subject_id: plan.subject_id,
      title: plan.title,
      description: plan.description || '',
      objectives: plan.objectives || '',
      materials: plan.materials || '',
      activities: plan.activities || '',
      assessment: plan.assessment || '',
      homework: plan.homework || '',
      notes: plan.notes || '',
      duration_minutes: plan.duration_minutes || 45,
      lesson_date: plan.lesson_date || '',
      status: plan.status || 'draft',
      resources: plan.resources || []
    });
    setShowModal(true);
  };

  const handleView = async (plan) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/lesson_plans.php?id=${plan.id}`);
      setViewingPlan(response.data.lesson_plan);
    } catch (error) {
      console.error('Error fetching plan details:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        teacher_id: teacherId
      };

      if (editingPlan) {
        await axios.put(`${API_BASE_URL}/lesson_plans.php?id=${editingPlan.id}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/lesson_plans.php`, payload);
      }

      setShowModal(false);
      fetchInitialData();
    } catch (error) {
      console.error('Error saving lesson plan:', error);
      alert('Failed to save lesson plan');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this lesson plan?')) {
      try {
        await axios.delete(`${API_BASE_URL}/lesson_plans.php?id=${id}`);
        fetchInitialData();
      } catch (error) {
        console.error('Error deleting lesson plan:', error);
      }
    }
  };

  const handleDuplicate = (plan) => {
    setEditingPlan(null);
    setFormData({
      ...plan,
      title: `${plan.title} (Copy)`,
      lesson_date: new Date().toISOString().split('T')[0],
      status: 'draft',
      resources: plan.resources || []
    });
    setShowModal(true);
  };

  const addResource = () => {
    if (newResource.title) {
      setFormData({
        ...formData,
        resources: [...formData.resources, { ...newResource }]
      });
      setNewResource({ resource_type: 'link', title: '', url: '', description: '' });
    }
  };

  const removeResource = (index) => {
    setFormData({
      ...formData,
      resources: formData.resources.filter((_, i) => i !== index)
    });
  };

  const filteredPlans = lessonPlans.filter(plan => {
    if (filterClass && plan.class_id != filterClass) return false;
    if (filterSubject && plan.subject_id != filterSubject) return false;
    if (filterStatus && plan.status !== filterStatus) return false;
    if (searchTerm && !plan.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Published</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Completed</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Draft</span>;
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Lesson Planning</h1>
          <p className="text-gray-600">Create and manage your lesson plans</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Lesson Plan
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{lessonPlans.length}</p>
              <p className="text-xs text-gray-500">Total Plans</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{lessonPlans.filter(p => p.status === 'published').length}</p>
              <p className="text-xs text-gray-500">Published</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{lessonPlans.filter(p => p.status === 'draft').length}</p>
              <p className="text-xs text-gray-500">Drafts</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {lessonPlans.filter(p => p.lesson_date === new Date().toISOString().split('T')[0]).length}
              </p>
              <p className="text-xs text-gray-500">Today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search lesson plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="input w-auto">
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
          </select>
          <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="input w-auto">
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input w-auto">
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Lesson Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlans.length === 0 ? (
          <div className="col-span-full card p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No lesson plans found</p>
            <button onClick={handleAdd} className="btn btn-primary mt-4">Create Your First Plan</button>
          </div>
        ) : (
          filteredPlans.map(plan => (
            <div key={plan.id} className="card p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{plan.title}</h3>
                  <p className="text-sm text-gray-500">{plan.class_name} • {plan.subject_name}</p>
                </div>
                {getStatusBadge(plan.status)}
              </div>
              
              {plan.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{plan.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                {plan.lesson_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(plan.lesson_date).toLocaleDateString()}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {plan.duration_minutes} min
                </span>
                {plan.resource_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Link className="w-3 h-3" />
                    {plan.resource_count} resources
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t">
                <button onClick={() => handleView(plan)} className="btn btn-sm bg-gray-100 hover:bg-gray-200 flex-1">
                  <Eye className="w-3 h-3 mr-1" /> View
                </button>
                <button onClick={() => handleEdit(plan)} className="btn btn-sm bg-blue-100 text-blue-700 hover:bg-blue-200">
                  <Edit className="w-3 h-3" />
                </button>
                <button onClick={() => handleDuplicate(plan)} className="btn btn-sm bg-green-100 text-green-700 hover:bg-green-200">
                  <Copy className="w-3 h-3" />
                </button>
                <button onClick={() => handleDelete(plan.id)} className="btn btn-sm bg-red-100 text-red-700 hover:bg-red-200">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingPlan ? 'Edit Lesson Plan' : 'New Lesson Plan'}
              </h2>
              <button onClick={() => setShowModal(false)}><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="input"
                    placeholder="e.g., Introduction to Fractions"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium mb-2">Subject *</label>
                    <select
                      required
                      value={formData.subject_id}
                      onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                      className="input"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.lesson_date}
                    onChange={(e) => setFormData({...formData, lesson_date: e.target.value})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="input"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input"
                  rows="2"
                  placeholder="Brief overview of the lesson"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Learning Objectives</label>
                <textarea
                  value={formData.objectives}
                  onChange={(e) => setFormData({...formData, objectives: e.target.value})}
                  className="input"
                  rows="3"
                  placeholder="What students will learn (one per line)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Materials Needed</label>
                <textarea
                  value={formData.materials}
                  onChange={(e) => setFormData({...formData, materials: e.target.value})}
                  className="input"
                  rows="2"
                  placeholder="List of materials and resources needed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Activities</label>
                <textarea
                  value={formData.activities}
                  onChange={(e) => setFormData({...formData, activities: e.target.value})}
                  className="input"
                  rows="4"
                  placeholder="Step-by-step activities for the lesson"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Assessment</label>
                  <textarea
                    value={formData.assessment}
                    onChange={(e) => setFormData({...formData, assessment: e.target.value})}
                    className="input"
                    rows="3"
                    placeholder="How will you assess understanding?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Homework</label>
                  <textarea
                    value={formData.homework}
                    onChange={(e) => setFormData({...formData, homework: e.target.value})}
                    className="input"
                    rows="3"
                    placeholder="Homework assignment for students"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Teacher Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="input"
                  rows="2"
                  placeholder="Private notes for yourself"
                />
              </div>

              {/* Resources */}
              <div>
                <label className="block text-sm font-medium mb-2">Resources</label>
                <div className="space-y-2 mb-3">
                  {formData.resources.map((res, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      {res.resource_type === 'video' ? <Video className="w-4 h-4 text-red-500" /> :
                       res.resource_type === 'document' ? <File className="w-4 h-4 text-blue-500" /> :
                       <Link className="w-4 h-4 text-green-500" />}
                      <span className="flex-1 text-sm">{res.title}</span>
                      <button type="button" onClick={() => removeResource(index)} className="text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <select
                    value={newResource.resource_type}
                    onChange={(e) => setNewResource({...newResource, resource_type: e.target.value})}
                    className="input w-auto"
                  >
                    <option value="link">Link</option>
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Resource title"
                    value={newResource.title}
                    onChange={(e) => setNewResource({...newResource, title: e.target.value})}
                    className="input flex-1"
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    value={newResource.url}
                    onChange={(e) => setNewResource({...newResource, url: e.target.value})}
                    className="input flex-1"
                  />
                  <button type="button" onClick={addResource} className="btn bg-gray-200 hover:bg-gray-300">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn bg-gray-200 hover:bg-gray-300">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" /> {editingPlan ? 'Update' : 'Create'} Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{viewingPlan.title}</h2>
                <p className="text-sm text-gray-500">{viewingPlan.class_name} • {viewingPlan.subject_name}</p>
              </div>
              <button onClick={() => setViewingPlan(null)}><X className="w-6 h-6" /></button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 text-sm">
                {viewingPlan.lesson_date && (
                  <span className="flex items-center gap-1 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(viewingPlan.lesson_date).toLocaleDateString()}
                  </span>
                )}
                <span className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  {viewingPlan.duration_minutes} minutes
                </span>
                {getStatusBadge(viewingPlan.status)}
              </div>

              {viewingPlan.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{viewingPlan.description}</p>
                </div>
              )}

              {viewingPlan.objectives && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" /> Learning Objectives
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg whitespace-pre-line text-gray-700">
                    {viewingPlan.objectives}
                  </div>
                </div>
              )}

              {viewingPlan.materials && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Materials Needed</h3>
                  <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-line text-gray-700">
                    {viewingPlan.materials}
                  </div>
                </div>
              )}

              {viewingPlan.activities && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Activities</h3>
                  <div className="bg-green-50 p-4 rounded-lg whitespace-pre-line text-gray-700">
                    {viewingPlan.activities}
                  </div>
                </div>
              )}

              {viewingPlan.assessment && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Assessment</h3>
                  <div className="bg-purple-50 p-4 rounded-lg whitespace-pre-line text-gray-700">
                    {viewingPlan.assessment}
                  </div>
                </div>
              )}

              {viewingPlan.homework && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Homework</h3>
                  <div className="bg-orange-50 p-4 rounded-lg whitespace-pre-line text-gray-700">
                    {viewingPlan.homework}
                  </div>
                </div>
              )}

              {viewingPlan.resources && viewingPlan.resources.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Resources</h3>
                  <div className="space-y-2">
                    {viewingPlan.resources.map((res, index) => (
                      <a
                        key={index}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                      >
                        {res.resource_type === 'video' ? <Video className="w-4 h-4 text-red-500" /> :
                         res.resource_type === 'document' ? <File className="w-4 h-4 text-blue-500" /> :
                         <Link className="w-4 h-4 text-green-500" />}
                        <span className="flex-1">{res.title}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => handleEdit(viewingPlan)} className="btn bg-blue-100 text-blue-700 hover:bg-blue-200">
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </button>
                <button onClick={() => setViewingPlan(null)} className="btn bg-gray-200 hover:bg-gray-300">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
