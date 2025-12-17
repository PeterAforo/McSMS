import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, Clock, CheckCircle, XCircle, AlertTriangle,
  Loader2, Calendar, FileText, Download, ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function ChildHomeworkView() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState(null);
  const [homework, setHomework] = useState([]);
  const [categorized, setCategorized] = useState({
    pending: [],
    submitted: [],
    overdue: [],
    graded: []
  });
  const [activeFilter, setActiveFilter] = useState('all');
  const [parentId, setParentId] = useState(null);

  useEffect(() => {
    fetchParentId();
  }, [user]);

  useEffect(() => {
    if (parentId && childId) {
      fetchChildDetails();
    }
  }, [parentId, childId]);

  useEffect(() => {
    if (child?.id) {
      fetchHomework();
    }
  }, [child]);

  const fetchParentId = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/parents.php?user_id=${user?.id}`);
      if (response.data.parents?.length > 0) {
        setParentId(response.data.parents[0].id);
      }
    } catch (error) {
      console.error('Error fetching parent ID:', error);
    }
  };

  const fetchChildDetails = async () => {
    try {
      console.log('Fetching child details for childId:', childId);
      const response = await axios.get(`${API_BASE_URL}/parent_portal.php?resource=child_details&child_id=${childId}`);
      console.log('Child details response:', response.data);
      if (response.data.success) {
        console.log('Setting child:', response.data.child);
        setChild(response.data.child);
      }
    } catch (error) {
      console.error('Error fetching child details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHomework = async () => {
    try {
      // Use child.id (numeric) not child.student_id (admission number string like STU2025002)
      console.log('Fetching homework for child:', child);
      console.log('Using student_id:', child.id);
      const response = await axios.get(
        `${API_BASE_URL}/parent_portal.php?resource=homework&student_id=${child.id}`
      );
      console.log('Homework API response:', response.data);
      if (response.data.success) {
        setHomework(response.data.homework || []);
        setCategorized(response.data.categorized || {
          pending: [],
          submitted: [],
          overdue: [],
          graded: []
        });
      }
    } catch (error) {
      console.error('Error fetching homework:', error);
    }
  };

  const getFilteredHomework = () => {
    switch (activeFilter) {
      case 'pending': return categorized.pending;
      case 'submitted': return categorized.submitted;
      case 'overdue': return categorized.overdue;
      case 'graded': return categorized.graded;
      default: return homework;
    }
  };

  const getStatusBadge = (hw) => {
    if (hw.submission_status === 'graded') {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Graded
        </span>
      );
    }
    if (hw.submission_status === 'submitted') {
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> Submitted
        </span>
      );
    }
    if (new Date(hw.due_date) < new Date() && !hw.submission_id) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
          <XCircle className="w-3 h-3" /> Overdue
        </span>
      );
    }
    return (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  };

  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return `${diff} days left`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homework</h1>
          <p className="text-gray-600">{child?.full_name} • {child?.class_name}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          className={`card p-4 text-center cursor-pointer transition-all ${activeFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
          onClick={() => setActiveFilter(activeFilter === 'pending' ? 'all' : 'pending')}
        >
          <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-yellow-600">{categorized.pending?.length || 0}</div>
          <p className="text-sm text-gray-600">Pending</p>
        </div>
        <div 
          className={`card p-4 text-center cursor-pointer transition-all ${activeFilter === 'submitted' ? 'ring-2 ring-blue-500' : ''}`}
          onClick={() => setActiveFilter(activeFilter === 'submitted' ? 'all' : 'submitted')}
        >
          <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">{categorized.submitted?.length || 0}</div>
          <p className="text-sm text-gray-600">Submitted</p>
        </div>
        <div 
          className={`card p-4 text-center cursor-pointer transition-all ${activeFilter === 'overdue' ? 'ring-2 ring-red-500' : ''}`}
          onClick={() => setActiveFilter(activeFilter === 'overdue' ? 'all' : 'overdue')}
        >
          <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-red-600">{categorized.overdue?.length || 0}</div>
          <p className="text-sm text-gray-600">Overdue</p>
        </div>
        <div 
          className={`card p-4 text-center cursor-pointer transition-all ${activeFilter === 'graded' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setActiveFilter(activeFilter === 'graded' ? 'all' : 'graded')}
        >
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">{categorized.graded?.length || 0}</div>
          <p className="text-sm text-gray-600">Graded</p>
        </div>
      </div>

      {/* Homework List */}
      <div className="card">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            {activeFilter === 'all' ? 'All Homework' : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Homework`}
          </h3>
          {activeFilter !== 'all' && (
            <button
              onClick={() => setActiveFilter('all')}
              className="text-sm text-blue-600 hover:underline"
            >
              Show All
            </button>
          )}
        </div>

        {getFilteredHomework().length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No homework found</p>
          </div>
        ) : (
          <div className="divide-y">
            {getFilteredHomework().map((hw) => (
              <div key={hw.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{hw.title}</h4>
                      {getStatusBadge(hw)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{hw.subject_name || 'General'}</p>
                    {hw.description && (
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">{hw.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due: {new Date(hw.due_date).toLocaleDateString()}
                      </span>
                      <span className={`font-medium ${
                        new Date(hw.due_date) < new Date() && !hw.submission_id
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}>
                        {getDaysRemaining(hw.due_date)}
                      </span>
                      {hw.teacher_name && (
                        <span>Assigned by: {hw.teacher_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {hw.submission_status === 'graded' && hw.grade && (
                      <div className="mb-2">
                        <span className="text-2xl font-bold text-green-600">{hw.grade}%</span>
                      </div>
                    )}
                    {hw.attachment && (
                      <button className="btn btn-sm bg-gray-100 hover:bg-gray-200 flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        Attachment
                      </button>
                    )}
                  </div>
                </div>
                
                {hw.feedback && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Teacher Feedback:</strong> {hw.feedback}
                    </p>
                  </div>
                )}

                {hw.submitted_at && (
                  <p className="mt-2 text-xs text-gray-500">
                    Submitted: {new Date(hw.submitted_at).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
