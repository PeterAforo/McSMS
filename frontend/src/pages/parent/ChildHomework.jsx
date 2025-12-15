import { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, Clock, CheckCircle, AlertCircle, 
  FileText, Download, Eye, Filter, Loader2, User
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function ChildHomework() {
  const { user } = useAuthStore();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, submitted, overdue
  const [selectedHomework, setSelectedHomework] = useState(null);

  useEffect(() => {
    fetchChildren();
  }, [user?.id]);

  useEffect(() => {
    if (selectedChild) {
      fetchHomework(selectedChild.id);
    }
  }, [selectedChild]);

  const fetchChildren = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/students.php?parent_id=${user?.id}`);
      const childrenData = response.data.students || [];
      setChildren(childrenData);
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHomework = async (studentId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/homework.php?action=student_homework&student_id=${studentId}`);
      setHomework(response.data.homework || []);
    } catch (error) {
      console.error('Error fetching homework:', error);
      setHomework([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status, dueDate) => {
    if (status === 'submitted' || status === 'graded') return 'bg-green-100 text-green-700';
    if (new Date(dueDate) < new Date()) return 'bg-red-100 text-red-700';
    return 'bg-orange-100 text-orange-700';
  };

  const getStatusText = (status, dueDate) => {
    if (status === 'submitted') return 'Submitted';
    if (status === 'graded') return 'Graded';
    if (new Date(dueDate) < new Date()) return 'Overdue';
    return 'Pending';
  };

  const filteredHomework = homework.filter(h => {
    if (filter === 'all') return true;
    if (filter === 'pending') return h.status === 'pending' && new Date(h.due_date) >= new Date();
    if (filter === 'submitted') return h.status === 'submitted' || h.status === 'graded';
    if (filter === 'overdue') return h.status === 'pending' && new Date(h.due_date) < new Date();
    return true;
  });

  const stats = {
    total: homework.length,
    pending: homework.filter(h => h.status === 'pending' && new Date(h.due_date) >= new Date()).length,
    submitted: homework.filter(h => h.status === 'submitted' || h.status === 'graded').length,
    overdue: homework.filter(h => h.status === 'pending' && new Date(h.due_date) < new Date()).length,
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const daysUntilDue = (dueDate) => {
    const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    if (days === 1) return 'Due tomorrow';
    return `${days} days left`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-600" />
            Child Homework
          </h1>
          <p className="text-gray-600 mt-1">Track your children's homework assignments</p>
        </div>
      </div>

      {/* Child Selector */}
      {children.length > 1 && (
        <div className="card p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
          <div className="flex gap-2 flex-wrap">
            {children.map(child => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  selectedChild?.id === child.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <User className="w-4 h-4" />
                {child.first_name} {child.last_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 cursor-pointer hover:shadow-md" onClick={() => setFilter('all')}>
          <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="card p-4 cursor-pointer hover:shadow-md" onClick={() => setFilter('pending')}>
          <Clock className="w-8 h-8 text-orange-600 mb-2" />
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="card p-4 cursor-pointer hover:shadow-md" onClick={() => setFilter('submitted')}>
          <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-sm text-gray-600">Submitted</p>
          <p className="text-2xl font-bold">{stats.submitted}</p>
        </div>
        <div className="card p-4 cursor-pointer hover:shadow-md" onClick={() => setFilter('overdue')}>
          <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
          <p className="text-sm text-gray-600">Overdue</p>
          <p className="text-2xl font-bold">{stats.overdue}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-5 h-5 text-gray-500" />
          {['all', 'pending', 'submitted', 'overdue'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Homework List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          </div>
        ) : filteredHomework.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No homework found</h3>
            <p className="text-gray-500 mt-1">
              {filter === 'all' ? 'No homework assignments yet' : `No ${filter} homework`}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredHomework.map((hw) => (
              <div 
                key={hw.id}
                onClick={() => setSelectedHomework(hw)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(hw.status, hw.due_date)}`}>
                        {getStatusText(hw.status, hw.due_date)}
                      </span>
                      <span className="text-sm text-gray-500">{hw.subject}</span>
                    </div>
                    <h3 className="font-medium text-gray-900">{hw.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{hw.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due: {formatDate(hw.due_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {hw.teacher_name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      hw.status === 'pending' && new Date(hw.due_date) < new Date() 
                        ? 'text-red-600' 
                        : hw.status === 'submitted' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {daysUntilDue(hw.due_date)}
                    </p>
                    {hw.grade && (
                      <p className="text-lg font-bold text-green-600 mt-1">Grade: {hw.grade}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Homework Detail Modal */}
      {selectedHomework && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(selectedHomework.status, selectedHomework.due_date)}`}>
                    {getStatusText(selectedHomework.status, selectedHomework.due_date)}
                  </span>
                  <h2 className="text-xl font-semibold text-gray-900 mt-2">{selectedHomework.title}</h2>
                  <p className="text-gray-500">{selectedHomework.subject}</p>
                </div>
                <button
                  onClick={() => setSelectedHomework(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600">{selectedHomework.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Assigned Date</p>
                  <p className="font-medium">{formatDate(selectedHomework.assigned_date)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Due Date</p>
                  <p className="font-medium">{formatDate(selectedHomework.due_date)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Teacher</p>
                  <p className="font-medium">{selectedHomework.teacher_name}</p>
                </div>
                {selectedHomework.grade && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Grade</p>
                    <p className="font-bold text-green-600 text-xl">{selectedHomework.grade}</p>
                  </div>
                )}
              </div>

              {selectedHomework.submitted_date && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Submitted on {formatDate(selectedHomework.submitted_date)}
                  </p>
                </div>
              )}

              {selectedHomework.feedback && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Teacher Feedback</h3>
                  <p className="text-gray-600 bg-blue-50 p-4 rounded-lg">{selectedHomework.feedback}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
