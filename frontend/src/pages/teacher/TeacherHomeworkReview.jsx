import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, CheckCircle, XCircle, Clock, Search, Filter,
  Download, Eye, MessageSquare, Star, ChevronLeft, ChevronRight,
  Loader2, AlertTriangle, FileText, Users, Award, Send, Image
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function TeacherHomeworkReview() {
  const { homeworkId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [homework, setHomework] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Grading form
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  
  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (homeworkId) {
      fetchHomeworkDetails();
    }
  }, [homeworkId]);

  useEffect(() => {
    if (submissions.length > 0 && !selectedSubmission) {
      setSelectedSubmission(submissions[0]);
      setCurrentIndex(0);
      loadSubmissionGrade(submissions[0]);
    }
  }, [submissions]);

  const fetchHomeworkDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/academic.php?resource=homework&id=${homeworkId}`);
      if (response.data.success) {
        setHomework(response.data.homework);
        setSubmissions(response.data.homework?.submissions || []);
      }
    } catch (error) {
      console.error('Error fetching homework:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissionGrade = (submission) => {
    setMarks(submission?.marks_obtained || submission?.score || '');
    setFeedback(submission?.feedback || '');
  };

  const selectSubmission = (submission, index) => {
    setSelectedSubmission(submission);
    setCurrentIndex(index);
    loadSubmissionGrade(submission);
  };

  const navigateSubmission = (direction) => {
    const filteredSubs = getFilteredSubmissions();
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = filteredSubs.length - 1;
    if (newIndex >= filteredSubs.length) newIndex = 0;
    selectSubmission(filteredSubs[newIndex], newIndex);
  };

  const handleGrade = async () => {
    if (!selectedSubmission || !marks) {
      alert('Please enter marks');
      return;
    }
    
    try {
      setSaving(true);
      await axios.post(`${API_BASE_URL}/academic.php?resource=homework_submissions&action=grade&id=${selectedSubmission.id}`, {
        marks_obtained: parseFloat(marks),
        feedback: feedback,
        graded_by: user?.id
      });
      
      // Update local state
      const updatedSubmissions = submissions.map(s => 
        s.id === selectedSubmission.id 
          ? { ...s, marks_obtained: parseFloat(marks), score: parseFloat(marks), feedback, status: 'graded' }
          : s
      );
      setSubmissions(updatedSubmissions);
      setSelectedSubmission({ ...selectedSubmission, marks_obtained: parseFloat(marks), score: parseFloat(marks), feedback, status: 'graded' });
      
      // Auto-advance to next ungraded
      const nextUngraded = updatedSubmissions.find(s => s.status !== 'graded' && s.submitted_at);
      if (nextUngraded) {
        const idx = updatedSubmissions.indexOf(nextUngraded);
        selectSubmission(nextUngraded, idx);
      }
    } catch (error) {
      alert('Error grading submission');
    } finally {
      setSaving(false);
    }
  };

  const getFilteredSubmissions = () => {
    return submissions.filter(s => {
      if (filterStatus === 'submitted' && s.status !== 'submitted' && s.status !== 'late') return false;
      if (filterStatus === 'graded' && s.status !== 'graded') return false;
      if (filterStatus === 'pending' && s.submitted_at) return false;
      if (searchTerm) {
        const name = `${s.first_name} ${s.last_name}`.toLowerCase();
        if (!name.includes(searchTerm.toLowerCase())) return false;
      }
      return true;
    });
  };

  const getStatusBadge = (submission) => {
    if (submission.status === 'graded') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Graded</span>;
    }
    if (submission.status === 'late') {
      return <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">Late</span>;
    }
    if (submission.submitted_at) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Submitted</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">Not Submitted</span>;
  };

  const stats = {
    total: submissions.length,
    submitted: submissions.filter(s => s.submitted_at).length,
    graded: submissions.filter(s => s.status === 'graded').length,
    pending: submissions.filter(s => s.submitted_at && s.status !== 'graded').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600">Homework not found</p>
        <button onClick={() => navigate('/teacher/homework')} className="btn btn-primary mt-4">
          Back to Homework
        </button>
      </div>
    );
  }

  const filteredSubmissions = getFilteredSubmissions();

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/teacher/homework')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{homework.title}</h1>
              <p className="text-sm text-gray-600">
                {homework.class_name} • {homework.subject_name} • Due: {new Date(homework.due_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
                <p className="text-xs text-gray-500">Submitted</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.graded}</p>
                <p className="text-xs text-gray-500">Graded</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Student List */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          {/* Filters */}
          <div className="p-4 border-b bg-white">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-1">
              {['all', 'submitted', 'graded', 'pending'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 text-xs rounded-full capitalize ${
                    filterStatus === status 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Student List */}
          <div className="flex-1 overflow-y-auto">
            {filteredSubmissions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No students found</p>
              </div>
            ) : (
              filteredSubmissions.map((submission, index) => (
                <div
                  key={submission.id || submission.student_id}
                  onClick={() => selectSubmission(submission, index)}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    selectedSubmission?.id === submission.id || selectedSubmission?.student_id === submission.student_id
                      ? 'bg-blue-50 border-l-4 border-l-blue-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {submission.first_name?.charAt(0)}{submission.last_name?.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {submission.first_name} {submission.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{submission.admission_no}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(submission)}
                      {submission.status === 'graded' && (
                        <p className="text-sm font-bold text-green-600 mt-1">
                          {submission.marks_obtained || submission.score}/{homework.total_marks}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Submission Details & Grading */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedSubmission ? (
            <>
              {/* Navigation */}
              <div className="px-6 py-3 border-b flex items-center justify-between bg-gray-50">
                <button
                  onClick={() => navigateSubmission(-1)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <span className="text-sm text-gray-500">
                  {currentIndex + 1} of {filteredSubmissions.length}
                </span>
                <button
                  onClick={() => navigateSubmission(1)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Submission Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto">
                  {/* Student Info */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-xl">
                        {selectedSubmission.first_name?.charAt(0)}{selectedSubmission.last_name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {selectedSubmission.first_name} {selectedSubmission.last_name}
                      </h2>
                      <p className="text-gray-600">{selectedSubmission.admission_no}</p>
                      {selectedSubmission.submitted_at && (
                        <p className="text-sm text-gray-500">
                          Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="ml-auto">
                      {getStatusBadge(selectedSubmission)}
                    </div>
                  </div>

                  {/* Submission Content */}
                  {selectedSubmission.submitted_at ? (
                    <div className="space-y-6">
                      {/* Text Response */}
                      {selectedSubmission.submission_text && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Student Response
                          </h3>
                          <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.submission_text}</p>
                        </div>
                      )}

                      {/* Attachment */}
                      {selectedSubmission.attachment && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Image className="w-4 h-4" /> Attached File
                          </h3>
                          {selectedSubmission.attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <div className="mb-3">
                              <img 
                                src={`${API_BASE_URL.replace('/backend/api', '')}/uploads/homework/${selectedSubmission.attachment}`}
                                alt="Submission"
                                className="max-w-full max-h-96 rounded-lg border shadow-sm"
                              />
                            </div>
                          ) : null}
                          <a
                            href={`${API_BASE_URL.replace('/backend/api', '')}/uploads/homework/${selectedSubmission.attachment}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                          >
                            <Download className="w-4 h-4" />
                            Download Attachment
                          </a>
                        </div>
                      )}

                      {/* Grading Section */}
                      <div className="bg-white border-2 border-blue-200 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Award className="w-5 h-5 text-blue-600" /> Grade Submission
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Marks (out of {homework.total_marks})
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={homework.total_marks}
                              value={marks}
                              onChange={(e) => setMarks(e.target.value)}
                              className="w-full px-4 py-3 border-2 rounded-lg text-lg font-bold text-center focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                              placeholder="0"
                            />
                            {marks && (
                              <p className="text-center text-sm text-gray-500 mt-1">
                                {Math.round((parseFloat(marks) / homework.total_marks) * 100)}%
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-4xl font-bold text-blue-600">
                                {marks || '—'}<span className="text-xl text-gray-400">/{homework.total_marks}</span>
                              </div>
                              <p className="text-sm text-gray-500">Score</p>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Feedback (Optional)
                          </label>
                          <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            placeholder="Provide feedback for the student..."
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={handleGrade}
                            disabled={saving || !marks}
                            className="flex-1 btn bg-blue-600 hover:bg-blue-700 text-white py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {saving ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-5 h-5" />
                            )}
                            {selectedSubmission.status === 'graded' ? 'Update Grade' : 'Submit Grade'}
                          </button>
                          <button
                            onClick={() => navigateSubmission(1)}
                            className="btn bg-gray-100 hover:bg-gray-200 py-3"
                          >
                            Skip
                          </button>
                        </div>
                      </div>

                      {/* Previous Grade Info */}
                      {selectedSubmission.status === 'graded' && selectedSubmission.graded_at && (
                        <div className="bg-green-50 rounded-lg p-4 text-sm text-green-800">
                          <p>
                            <strong>Previously graded:</strong> {new Date(selectedSubmission.graded_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <XCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600">No Submission</h3>
                      <p className="text-gray-500">This student has not submitted their homework yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Select a student to view their submission</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
