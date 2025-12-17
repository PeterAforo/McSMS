import { useState, useEffect } from 'react';
import { 
  Star, ThumbsUp, ThumbsDown, Plus, Edit, Trash2, X, Save, Search,
  Award, AlertTriangle, Trophy, Users, Filter, Calendar, Clock,
  Loader2, CheckCircle, TrendingUp, Medal, Heart, Zap
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function BehaviorTracking() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [teacherId, setTeacherId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [records, setRecords] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentSummary, setStudentSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('records');
  
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const [recordForm, setRecordForm] = useState({
    behavior_type: 'positive',
    category: '',
    description: '',
    points: 5,
    incident_date: new Date().toISOString().split('T')[0]
  });

  const [badgeForm, setBadgeForm] = useState({
    badge_name: '',
    badge_icon: 'star',
    badge_color: 'gold',
    description: ''
  });

  const badgeIcons = [
    { value: 'star', icon: Star, label: 'Star' },
    { value: 'trophy', icon: Trophy, label: 'Trophy' },
    { value: 'medal', icon: Medal, label: 'Medal' },
    { value: 'award', icon: Award, label: 'Award' },
    { value: 'heart', icon: Heart, label: 'Heart' },
    { value: 'zap', icon: Zap, label: 'Lightning' }
  ];

  const badgeColors = ['gold', 'silver', 'bronze', 'blue', 'green', 'purple', 'red'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassData();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentSummary();
    }
  }, [selectedStudent]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const teacherRes = await axios.get(`${API_BASE_URL}/teachers.php?user_id=${user?.id}`);
      const teachers = teacherRes.data.teachers || [];
      
      if (teachers.length > 0) {
        setTeacherId(teachers[0].id);
        
        const [classesRes, categoriesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/teacher_subjects.php?teacher_id=${teachers[0].id}`),
          axios.get(`${API_BASE_URL}/behavior_tracking.php?resource=categories`)
        ]);

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
        setCategories(categoriesRes.data.categories || []);
        
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

  const fetchClassData = async () => {
    try {
      const [studentsRes, recordsRes, leaderboardRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/students.php?class_id=${selectedClass}`),
        axios.get(`${API_BASE_URL}/behavior_tracking.php?resource=records&class_id=${selectedClass}`),
        axios.get(`${API_BASE_URL}/behavior_tracking.php?resource=leaderboard&class_id=${selectedClass}`)
      ]);

      setStudents(studentsRes.data.students || []);
      setRecords(recordsRes.data.records || []);
      setLeaderboard(leaderboardRes.data.leaderboard || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchStudentSummary = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/behavior_tracking.php?resource=summary&student_id=${selectedStudent.id}`);
      setStudentSummary(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAddRecord = (student = null, type = 'positive') => {
    setEditingRecord(null);
    setSelectedStudent(student);
    const defaultCategory = categories.find(c => c.type === type);
    setRecordForm({
      behavior_type: type,
      category: defaultCategory?.name || '',
      description: '',
      points: defaultCategory?.default_points || (type === 'positive' ? 5 : -5),
      incident_date: new Date().toISOString().split('T')[0]
    });
    setShowRecordModal(true);
  };

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        resource: 'record',
        student_id: selectedStudent.id,
        teacher_id: teacherId,
        class_id: selectedClass,
        ...recordForm
      };

      if (editingRecord) {
        await axios.put(`${API_BASE_URL}/behavior_tracking.php?id=${editingRecord.id}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/behavior_tracking.php`, payload);
      }

      setShowRecordModal(false);
      fetchClassData();
      if (selectedStudent) fetchStudentSummary();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save record');
    }
  };

  const handleDeleteRecord = async (id) => {
    if (window.confirm('Delete this behavior record?')) {
      try {
        await axios.delete(`${API_BASE_URL}/behavior_tracking.php?id=${id}&resource=record`);
        fetchClassData();
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const handleAwardBadge = (student) => {
    setSelectedStudent(student);
    setBadgeForm({
      badge_name: '',
      badge_icon: 'star',
      badge_color: 'gold',
      description: ''
    });
    setShowBadgeModal(true);
  };

  const handleSaveBadge = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/behavior_tracking.php`, {
        resource: 'badge',
        student_id: selectedStudent.id,
        awarded_by: teacherId,
        ...badgeForm
      });

      setShowBadgeModal(false);
      fetchClassData();
      if (selectedStudent) fetchStudentSummary();
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to award badge');
    }
  };

  const handleCategorySelect = (category) => {
    setRecordForm({
      ...recordForm,
      category: category.name,
      behavior_type: category.type,
      points: category.default_points
    });
  };

  const getBadgeIcon = (iconName) => {
    const badge = badgeIcons.find(b => b.value === iconName);
    return badge ? badge.icon : Star;
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
          <h1 className="text-2xl font-bold text-gray-900">Behavior Tracking</h1>
          <p className="text-gray-600">Track behaviors, award points and badges</p>
        </div>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="input w-auto"
        >
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.class_name}</option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('records')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'records' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
          }`}
        >
          Recent Records
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'leaderboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
          }`}
        >
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'students' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
          }`}
        >
          Quick Add
        </button>
      </div>

      {/* Recent Records Tab */}
      {activeTab === 'records' && (
        <div className="card">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Recent Behavior Records</h3>
          </div>
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {records.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No behavior records yet</p>
              </div>
            ) : (
              records.map(record => (
                <div key={record.id} className="p-4 flex items-start gap-4 hover:bg-gray-50">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    record.behavior_type === 'positive' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {record.behavior_type === 'positive' ? 
                      <ThumbsUp className="w-5 h-5 text-green-600" /> : 
                      <ThumbsDown className="w-5 h-5 text-red-600" />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{record.student_name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        record.points >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {record.points >= 0 ? '+' : ''}{record.points} pts
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{record.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {record.category} • {new Date(record.incident_date).toLocaleDateString()} • {record.teacher_name}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeleteRecord(record.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="card">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" /> Points Leaderboard
            </h3>
          </div>
          <div className="divide-y">
            {leaderboard.map((student, index) => (
              <div key={student.id} className="p-4 flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-200 text-gray-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {student.badge_count > 0 && (
                      <span className="text-xs text-purple-600 flex items-center gap-1">
                        <Award className="w-3 h-3" /> {student.badge_count} badges
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${
                    student.total_points >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {student.total_points >= 0 ? '+' : ''}{student.total_points}
                  </p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleAddRecord(student, 'positive')}
                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                    title="Add positive"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAddRecord(student, 'negative')}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    title="Add negative"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAwardBadge(student)}
                    className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
                    title="Award badge"
                  >
                    <Award className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add Tab */}
      {activeTab === 'students' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map(student => (
            <div key={student.id} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                  <p className="text-xs text-gray-500">{student.admission_number}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAddRecord(student, 'positive')}
                  className="flex-1 btn bg-green-100 text-green-700 hover:bg-green-200 btn-sm"
                >
                  <ThumbsUp className="w-4 h-4 mr-1" /> Positive
                </button>
                <button
                  onClick={() => handleAddRecord(student, 'negative')}
                  className="flex-1 btn bg-red-100 text-red-700 hover:bg-red-200 btn-sm"
                >
                  <ThumbsDown className="w-4 h-4 mr-1" /> Negative
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Modal */}
      {showRecordModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {recordForm.behavior_type === 'positive' ? 'Add Positive Behavior' : 'Add Negative Behavior'}
                </h2>
                <p className="text-sm text-gray-500">{selectedStudent.first_name} {selectedStudent.last_name}</p>
              </div>
              <button onClick={() => setShowRecordModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveRecord} className="p-6 space-y-4">
              {/* Quick Categories */}
              <div>
                <label className="block text-sm font-medium mb-2">Quick Select</label>
                <div className="flex flex-wrap gap-2">
                  {categories.filter(c => c.type === recordForm.behavior_type).map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        recordForm.category === cat.name 
                          ? (recordForm.behavior_type === 'positive' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-red-100 border-red-500 text-red-700')
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {cat.name} ({cat.default_points >= 0 ? '+' : ''}{cat.default_points})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  required
                  value={recordForm.description}
                  onChange={(e) => setRecordForm({...recordForm, description: e.target.value})}
                  className="input"
                  rows="3"
                  placeholder="Describe the behavior..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Points</label>
                  <input
                    type="number"
                    value={recordForm.points}
                    onChange={(e) => setRecordForm({...recordForm, points: parseInt(e.target.value)})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={recordForm.incident_date}
                    onChange={(e) => setRecordForm({...recordForm, incident_date: e.target.value})}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowRecordModal(false)} className="btn bg-gray-200">Cancel</button>
                <button type="submit" className={`btn ${recordForm.behavior_type === 'positive' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}>
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Badge Modal */}
      {showBadgeModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Award Badge</h2>
                <p className="text-sm text-gray-500">{selectedStudent.first_name} {selectedStudent.last_name}</p>
              </div>
              <button onClick={() => setShowBadgeModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSaveBadge} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Badge Name *</label>
                <input
                  type="text"
                  required
                  value={badgeForm.badge_name}
                  onChange={(e) => setBadgeForm({...badgeForm, badge_name: e.target.value})}
                  className="input"
                  placeholder="e.g., Star Student, Math Whiz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Icon</label>
                <div className="flex gap-2">
                  {badgeIcons.map(badge => {
                    const IconComponent = badge.icon;
                    return (
                      <button
                        key={badge.value}
                        type="button"
                        onClick={() => setBadgeForm({...badgeForm, badge_icon: badge.value})}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          badgeForm.badge_icon === badge.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <IconComponent className="w-6 h-6" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="flex gap-2">
                  {badgeColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setBadgeForm({...badgeForm, badge_color: color})}
                      className={`w-8 h-8 rounded-full border-2 ${
                        badgeForm.badge_color === color ? 'border-gray-900' : 'border-transparent'
                      }`}
                      style={{ 
                        backgroundColor: color === 'gold' ? '#FFD700' : 
                                        color === 'silver' ? '#C0C0C0' :
                                        color === 'bronze' ? '#CD7F32' : color 
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={badgeForm.description}
                  onChange={(e) => setBadgeForm({...badgeForm, description: e.target.value})}
                  className="input"
                  rows="2"
                  placeholder="Why is this badge being awarded?"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowBadgeModal(false)} className="btn bg-gray-200">Cancel</button>
                <button type="submit" className="btn bg-purple-600 hover:bg-purple-700 text-white">
                  <Award className="w-4 h-4 mr-2" /> Award Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
