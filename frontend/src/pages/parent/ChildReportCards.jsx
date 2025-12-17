import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Download, CheckCircle, Clock,
  Loader2, Calendar, Award, Pen
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function ChildReportCards() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState(null);
  const [reportCards, setReportCards] = useState([]);
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [signature, setSignature] = useState('');
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
    if (child?.student_id) {
      fetchReportCards();
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
      const response = await axios.get(`${API_BASE_URL}/parent_portal.php?resource=child_details&child_id=${childId}`);
      if (response.data.success) {
        setChild(response.data.child);
      }
    } catch (error) {
      console.error('Error fetching child details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportCards = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/parent_portal.php?resource=report_cards&student_id=${child.student_id}`
      );
      if (response.data.success) {
        setReportCards(response.data.report_cards || []);
      }
    } catch (error) {
      console.error('Error fetching report cards:', error);
    }
  };

  const handleAcknowledge = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/parent_portal.php?resource=acknowledge_report`, {
        student_id: child.student_id,
        parent_id: parentId,
        term: selectedReport.term,
        academic_year: selectedReport.academic_year,
        signature: signature
      });
      
      if (response.data.success) {
        alert('Report card acknowledged successfully!');
        setShowAcknowledgeModal(false);
        setSignature('');
        fetchReportCards();
      } else {
        alert(response.data.error || 'Failed to acknowledge');
      }
    } catch (error) {
      console.error('Error acknowledging report:', error);
      alert('Failed to acknowledge report card');
    }
  };

  const openAcknowledgeModal = (report) => {
    setSelectedReport(report);
    setShowAcknowledgeModal(true);
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
          <h1 className="text-2xl font-bold text-gray-900">Report Cards</h1>
          <p className="text-gray-600">{child?.full_name} • {child?.class_name}</p>
        </div>
      </div>

      {/* Report Cards List */}
      <div className="card">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Available Report Cards
          </h3>
        </div>

        {reportCards.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No report cards available yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {reportCards.map((report, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Award className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {report.term} - {report.academic_year}
                      </h4>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Academic Year {report.academic_year}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {report.acknowledged_at ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Acknowledged on {new Date(report.acknowledged_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-600 text-sm">
                        <Clock className="w-4 h-4" />
                        Pending acknowledgment
                      </span>
                    )}
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/parent/child/${childId}/report/${report.term}/${report.academic_year}`)}
                        className="btn btn-sm bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4" />
                        View
                      </button>
                      <button
                        className="btn btn-sm bg-gray-100 hover:bg-gray-200 flex items-center gap-1"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                      {!report.acknowledged_at && (
                        <button
                          onClick={() => openAcknowledgeModal(report)}
                          className="btn btn-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
                        >
                          <Pen className="w-4 h-4" />
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="card p-6 bg-blue-50 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">About Report Card Acknowledgment</h4>
        <p className="text-sm text-blue-700">
          By acknowledging a report card, you confirm that you have reviewed your child's academic performance 
          for the term. This helps the school track parent engagement and ensures you're informed about your 
          child's progress.
        </p>
      </div>

      {/* Acknowledge Modal */}
      {showAcknowledgeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Acknowledge Report Card
            </h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Student:</strong> {child?.full_name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Term:</strong> {selectedReport?.term}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Academic Year:</strong> {selectedReport?.academic_year}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digital Signature (Type your full name)
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                className="input w-full"
                placeholder="Enter your full name"
              />
            </div>

            <p className="text-xs text-gray-500 mb-4">
              By signing, I acknowledge that I have reviewed my child's report card for {selectedReport?.term} 
              of the {selectedReport?.academic_year} academic year.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAcknowledgeModal(false);
                  setSignature('');
                }}
                className="btn bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAcknowledge}
                disabled={!signature.trim()}
                className="btn btn-primary flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
