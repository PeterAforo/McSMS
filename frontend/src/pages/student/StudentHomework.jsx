import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import { BookOpen, Clock, CheckCircle, AlertCircle, Upload, FileText, Calendar, ChevronRight } from 'lucide-react';

export default function StudentHomework() {
  const { user } = useAuthStore();
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, submitted, overdue
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState({ content: '', file: null });

  useEffect(() => {
    if (user?.id) fetchHomework();
  }, [user?.id]);

  const fetchHomework = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/homework.php?student_id=${user.student_id || user.id}`);
      setHomework(response.data.homework || []);
    } catch (error) {
      console.error('Error fetching homework:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (homeworkId) => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('homework_id', homeworkId);
      formData.append('student_id', user.student_id || user.id);
      formData.append('content', submission.content);
      if (submission.file) formData.append('file', submission.file);

      await axios.post(`${API_BASE_URL}/homework_submissions.php`, formData);
      alert('Homework submitted successfully!');
      setSelectedHomework(null);
      setSubmission({ content: '', file: null });
      fetchHomework();
    } catch (error) {
      alert('Failed to submit homework');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (hw) => {
    if (hw.submission_status === 'submitted' || hw.submission_status === 'graded') return 'text-green-600 bg-green-100';
    if (new Date(hw.due_date) < new Date()) return 'text-red-600 bg-red-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getStatusText = (hw) => {
    if (hw.submission_status === 'graded') return 'Graded';
    if (hw.submission_status === 'submitted') return 'Submitted';
    if (new Date(hw.due_date) < new Date()) return 'Overdue';
    return 'Pending';
  };

  const filteredHomework = homework.filter(hw => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !hw.submission_status && new Date(hw.due_date) >= new Date();
    if (filter === 'submitted') return hw.submission_status === 'submitted' || hw.submission_status === 'graded';
    if (filter === 'overdue') return !hw.submission_status && new Date(hw.due_date) < new Date();
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="text-blue-600" /> My Homework
          </h1>
          <p className="text-gray-600">View and submit your assignments</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending', 'submitted', 'overdue'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium capitalize ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Homework List */}
      <div className="space-y-4">
        {filteredHomework.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No homework found</p>
          </div>
        ) : (
          filteredHomework.map(hw => (
            <div key={hw.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{hw.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(hw)}`}>
                      {getStatusText(hw)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{hw.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FileText size={14} /> {hw.subject_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> Due: {new Date(hw.due_date).toLocaleDateString()}
                    </span>
                    {hw.grade && (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle size={14} /> Grade: {hw.grade}
                      </span>
                    )}
                  </div>
                </div>
                {!hw.submission_status && (
                  <button
                    onClick={() => setSelectedHomework(hw)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Upload size={16} /> Submit
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Submission Modal */}
      {selectedHomework && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4">Submit: {selectedHomework.title}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Answer</label>
                <textarea
                  value={submission.content}
                  onChange={(e) => setSubmission({ ...submission, content: e.target.value })}
                  className="w-full border rounded-lg p-3 h-32"
                  placeholder="Type your answer here..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attach File (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setSubmission({ ...submission, file: e.target.files[0] })}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setSelectedHomework(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit(selectedHomework.id)}
                  disabled={submitting || !submission.content}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
