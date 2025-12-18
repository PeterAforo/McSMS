import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, Clock, CheckCircle, XCircle, AlertTriangle,
  Loader2, Calendar, FileText, Download, ExternalLink, Upload, Send, X,
  Camera, Image, Paperclip, Star
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
  
  // Submission modal state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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
      const response = await axios.get(
        `${API_BASE_URL}/parent_portal.php?resource=homework&student_id=${child.id}`
      );
      if (response.data.success) {
        const homeworkList = response.data.homework || [];
        setHomework(homeworkList);
        
        // Categorize homework with submission status
        const pending = [];
        const submitted = [];
        const overdue = [];
        const graded = [];
        
        homeworkList.forEach(hw => {
          if (hw.submission_status === 'graded') {
            graded.push(hw);
          } else if (hw.submission_status === 'submitted' || hw.submission_status === 'late') {
            submitted.push(hw);
          } else if (new Date(hw.due_date) < new Date()) {
            overdue.push(hw);
          } else {
            pending.push(hw);
          }
        });
        
        setCategorized({ pending, submitted, overdue, graded });
      }
    } catch (error) {
      console.error('Error fetching homework:', error);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB');
      return;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Allowed: JPG, PNG, GIF, PDF, DOC, DOCX');
      return;
    }
    
    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('homework_id', selectedHomework?.id || '');
      formData.append('student_id', child?.id || '');
      
      const response = await axios.post(`${API_BASE_URL}/upload_homework.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setUploadedFile(file);
        setUploadedFileUrl(response.data.filename);
      } else {
        alert(response.data.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmitHomework = async () => {
    if (!selectedHomework || (!submissionText.trim() && !uploadedFileUrl)) {
      alert('Please enter your homework response or upload a file');
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await axios.post(`${API_BASE_URL}/homework_submissions.php?action=submit`, {
        homework_id: selectedHomework.id,
        student_id: child.id,
        submission_text: submissionText,
        attachment: uploadedFileUrl || null
      });
      
      if (response.data.success) {
        alert(response.data.message || 'Homework submitted successfully!');
        setShowSubmitModal(false);
        setSubmissionText('');
        setSelectedHomework(null);
        setUploadedFile(null);
        setUploadedFileUrl('');
        fetchHomework(); // Refresh the list
      } else {
        alert(response.data.error || 'Failed to submit homework');
      }
    } catch (error) {
      console.error('Error submitting homework:', error);
      alert('Failed to submit homework. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmitModal = (hw) => {
    setSelectedHomework(hw);
    setSubmissionText('');
    setUploadedFile(null);
    setUploadedFileUrl('');
    setShowSubmitModal(true);
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
                        {hw.due_time && ` at ${hw.due_time}`}
                      </span>
                      <span className={`font-medium ${
                        new Date(hw.due_date) < new Date() && !hw.submission_status
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
                  <div className="text-right space-y-2">
                    {/* Show score prominently for graded homework */}
                    {hw.submission_status === 'graded' && (
                      <div className="mb-2 bg-green-50 p-2 rounded-lg">
                        <div className="flex items-center gap-1 justify-end">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-2xl font-bold text-green-600">
                            {hw.score || hw.marks_obtained || 0}/{hw.total_marks || 100}
                          </span>
                        </div>
                        <p className="text-xs text-green-600">
                          {Math.round(((hw.score || hw.marks_obtained || 0) / (hw.total_marks || 100)) * 100)}%
                        </p>
                      </div>
                    )}
                    {/* Homework attachment from teacher */}
                    {(hw.attachment || hw.attachment_url) && (
                      <a 
                        href={hw.attachment_url || hw.attachment} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-sm bg-gray-100 hover:bg-gray-200 flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Attachment
                      </a>
                    )}
                    {/* Submit button - show for pending/overdue homework */}
                    {(!hw.submission_status || hw.submission_status === 'pending') && (
                      <button 
                        onClick={() => openSubmitModal(hw)}
                        className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        Submit
                      </button>
                    )}
                    {/* View/Edit submission button */}
                    {(hw.submission_status === 'submitted' || hw.submission_status === 'late') && (
                      <span className="text-xs text-blue-600">✓ Submitted</span>
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

      {/* Submit Homework Modal */}
      {showSubmitModal && selectedHomework && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">Submit Homework</h3>
              <button 
                onClick={() => setShowSubmitModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Homework Details */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-900">{selectedHomework.title}</h4>
                <p className="text-sm text-gray-600">{selectedHomework.subject_name || 'General'}</p>
                {selectedHomework.description && (
                  <p className="text-sm text-gray-700 mt-2">{selectedHomework.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Due: {new Date(selectedHomework.due_date).toLocaleDateString()}</span>
                  {new Date(selectedHomework.due_date) < new Date() && (
                    <span className="text-red-600 font-medium">(Overdue - will be marked as late)</span>
                  )}
                </div>
              </div>

              {/* Submission Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Answer / Response
                </label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  placeholder="Type your homework answer here..."
                  className="w-full border rounded-lg p-3 h-32 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* File Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attach File (Optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Upload a photo of handwritten work, scanned document, or PDF. Max 10MB.
                </p>
                
                {/* Hidden file inputs */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
                
                {/* Upload buttons */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="btn bg-green-100 hover:bg-green-200 text-green-700 flex items-center gap-2 text-sm"
                  >
                    <Camera className="w-4 h-4" />
                    Take Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="btn bg-purple-100 hover:bg-purple-200 text-purple-700 flex items-center gap-2 text-sm"
                  >
                    <Image className="w-4 h-4" />
                    Choose Image
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-2 text-sm"
                  >
                    <Paperclip className="w-4 h-4" />
                    Upload File
                  </button>
                </div>
                
                {/* Upload progress */}
                {uploadingFile && (
                  <div className="flex items-center gap-2 text-blue-600 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading file...
                  </div>
                )}
                
                {/* Uploaded file preview */}
                {uploadedFile && (
                  <div className="bg-green-50 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">{uploadedFile.name}</p>
                        <p className="text-xs text-green-600">
                          {(uploadedFile.size / 1024).toFixed(1)} KB • Ready to submit
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setUploadedFile(null); setUploadedFileUrl(''); }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Note for parents */}
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                <strong>Note:</strong> As a parent, you can submit homework on behalf of your child. 
                You can type a response, upload a file, or both. The teacher will be able to see this submission and provide feedback.
              </div>
            </div>

            <div className="p-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="btn bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitHomework}
                disabled={submitting || !submissionText.trim()}
                className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Homework
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
