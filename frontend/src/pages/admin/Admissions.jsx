import { useState, useEffect } from 'react';
import { 
  Search, CheckCircle, XCircle, Eye, FileText, Clock, UserCheck, UserX,
  ArrowUpCircle, ArrowDownCircle, GraduationCap, ClipboardCheck, Send,
  MessageSquare, AlertTriangle, Calendar, User, Phone, Mail, BookOpen
} from 'lucide-react';
import { applicationsAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function Admissions() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [classes, setClasses] = useState([]);
  const [offeredClass, setOfferedClass] = useState('');
  const [offerReason, setOfferReason] = useState('');
  const [requiresExam, setRequiresExam] = useState(false);
  const [examDate, setExamDate] = useState('');
  const [examSubjects, setExamSubjects] = useState('');
  const [examInstructions, setExamInstructions] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    fetchApplications();
    fetchClasses();
  }, [filterStatus]);

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/classes.php`);
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const response = await applicationsAPI.getAll(params);
      setApplications(response.data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      alert('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setShowModal(true);
    setActionType('view');
    setOfferedClass(app.class_applying_for || '');
    setOfferReason('');
    setRequiresExam(false);
    setExamDate('');
    setExamSubjects('');
    setExamInstructions('');
    setAdminNotes('');
    setRejectionReason('');
  };

  // Make an offer (with optional class change)
  const handleMakeOffer = async () => {
    if (!selectedApp) return;
    if (!offerReason) {
      alert('Please provide a reason for the offer');
      return;
    }
    
    try {
      await axios.post(`${API_BASE_URL}/applications.php`, {
        action: 'make_offer',
        id: selectedApp.id,
        offered_class: offeredClass,
        original_class: selectedApp.class_applying_for,
        offer_reason: offerReason,
        reviewed_by: user.id,
        admin_notes: adminNotes
      });
      
      const classChanged = offeredClass !== selectedApp.class_applying_for;
      alert(`Offer sent to parent!${classChanged ? ' (Class changed from ' + selectedApp.class_applying_for + ' to ' + offeredClass + ')' : ''}`);
      setShowModal(false);
      fetchApplications();
    } catch (error) {
      console.error('Error making offer:', error);
      alert('Failed to make offer: ' + (error.response?.data?.error || error.message));
    }
  };

  // Request entrance exam
  const handleRequestExam = async () => {
    if (!selectedApp) return;
    if (!examDate || !examSubjects) {
      alert('Please provide exam date and subjects');
      return;
    }
    
    try {
      await axios.post(`${API_BASE_URL}/applications.php`, {
        action: 'request_exam',
        id: selectedApp.id,
        exam_date: examDate,
        exam_subjects: examSubjects,
        exam_instructions: examInstructions,
        reviewed_by: user.id
      });
      
      alert('Entrance exam request sent to parent!');
      setShowModal(false);
      fetchApplications();
    } catch (error) {
      console.error('Error requesting exam:', error);
      alert('Failed to request exam: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    
    try {
      await applicationsAPI.approve(selectedApp.id, {
        reviewed_by: user.id,
        admin_notes: adminNotes,
        offered_class: offeredClass || selectedApp.class_applying_for
      });
      alert('Application approved! Student record created.');
      setShowModal(false);
      fetchApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      alert('Failed to approve application: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleReject = async () => {
    if (!selectedApp || !rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }
    
    try {
      await applicationsAPI.reject(selectedApp.id, {
        reviewed_by: user.id,
        rejection_reason: rejectionReason
      });
      alert('Application rejected.');
      setShowModal(false);
      fetchApplications();
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application');
    }
  };

  // Get class name by ID
  const getClassName = (classId) => {
    const cls = classes.find(c => c.id == classId);
    return cls ? cls.class_name : classId;
  };

  const stats = [
    { label: 'Pending', value: applications.filter(a => a.status === 'pending').length, icon: Clock, color: 'bg-orange-500' },
    { label: 'Offer Sent', value: applications.filter(a => a.status === 'offer_sent').length, icon: Send, color: 'bg-blue-500' },
    { label: 'Exam Required', value: applications.filter(a => a.status === 'exam_required').length, icon: ClipboardCheck, color: 'bg-purple-500' },
    { label: 'Approved', value: applications.filter(a => a.status === 'approved').length, icon: UserCheck, color: 'bg-green-500' },
    { label: 'Rejected', value: applications.filter(a => a.status === 'rejected').length, icon: UserX, color: 'bg-red-500' },
  ];

  const calculateAge = (dob) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admissions</h1>
        <p className="text-gray-600 mt-1">Review and approve student applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input max-w-xs"
          >
            <option value="pending">Pending Review</option>
            <option value="offer_sent">Offer Sent (Awaiting Parent)</option>
            <option value="exam_required">Entrance Exam Required</option>
            <option value="offer_accepted">Offer Accepted</option>
            <option value="approved">Approved & Enrolled</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Applications</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Application #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age/Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guardian</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No applications found
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-medium text-blue-600">{app.application_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {app.first_name?.charAt(0)}{app.last_name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {app.first_name} {app.last_name}
                          </p>
                          {app.email && (
                            <p className="text-sm text-gray-500">{app.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{calculateAge(app.date_of_birth)} years</p>
                      <p className="text-sm text-gray-500 capitalize">{app.gender}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{app.guardian_name}</p>
                      <p className="text-sm text-gray-500">{app.guardian_phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {new Date(app.application_date).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        app.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        app.status === 'offer_sent' ? 'bg-blue-100 text-blue-700' :
                        app.status === 'exam_required' ? 'bg-purple-100 text-purple-700' :
                        app.status === 'offer_accepted' ? 'bg-cyan-100 text-cyan-700' :
                        app.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {app.status === 'offer_sent' ? 'Offer Sent' :
                         app.status === 'exam_required' ? 'Exam Required' :
                         app.status === 'offer_accepted' ? 'Offer Accepted' :
                         app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(app)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Details Modal */}
      {showModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Application Details</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedApp.application_number}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Full Name</label>
                    <p className="font-medium">{selectedApp.first_name} {selectedApp.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Date of Birth</label>
                    <p className="font-medium">{selectedApp.date_of_birth} ({calculateAge(selectedApp.date_of_birth)} years)</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Gender</label>
                    <p className="font-medium capitalize">{selectedApp.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Nationality</label>
                    <p className="font-medium">{selectedApp.nationality}</p>
                  </div>
                  {selectedApp.email && (
                    <div>
                      <label className="text-sm text-gray-600">Email</label>
                      <p className="font-medium">{selectedApp.email}</p>
                    </div>
                  )}
                  {selectedApp.phone && (
                    <div>
                      <label className="text-sm text-gray-600">Phone</label>
                      <p className="font-medium">{selectedApp.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Guardian Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Guardian Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Guardian Name</label>
                    <p className="font-medium">{selectedApp.guardian_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Phone</label>
                    <p className="font-medium">{selectedApp.guardian_phone}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Email</label>
                    <p className="font-medium">{selectedApp.guardian_email}</p>
                  </div>
                  {selectedApp.guardian_relationship && (
                    <div>
                      <label className="text-sm text-gray-600">Relationship</label>
                      <p className="font-medium">{selectedApp.guardian_relationship}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Academic Information */}
              {selectedApp.previous_school && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">Previous School</label>
                      <p className="font-medium">{selectedApp.previous_school}</p>
                    </div>
                    {selectedApp.class_applying_for && (
                      <div>
                        <label className="text-sm text-gray-600">Class Applying For</label>
                        <p className="font-medium">{selectedApp.class_applying_for}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions for Pending Applications */}
              {(selectedApp.status === 'pending' || selectedApp.status === 'offer_accepted') && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Review Application</h3>
                  
                  <div className="space-y-6">
                    {/* Class Selection with Upgrade/Downgrade */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <GraduationCap className="w-4 h-4 inline mr-2" />
                        Offered Class
                      </label>
                      <div className="flex items-center gap-4">
                        <select
                          value={offeredClass}
                          onChange={(e) => setOfferedClass(e.target.value)}
                          className="input flex-1"
                        >
                          <option value="">Select Class</option>
                          {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                          ))}
                        </select>
                        {offeredClass && offeredClass !== selectedApp.class_applying_for && (
                          <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
                            parseInt(offeredClass) > parseInt(selectedApp.class_applying_for) 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {parseInt(offeredClass) > parseInt(selectedApp.class_applying_for) ? (
                              <><ArrowUpCircle className="w-3 h-3" /> Upgraded</>
                            ) : (
                              <><ArrowDownCircle className="w-3 h-3" /> Downgraded</>
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Applied for: {getClassName(selectedApp.class_applying_for)}
                      </p>
                    </div>

                    {/* Admin Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Admin Notes (Optional)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="input"
                        rows="2"
                        placeholder="Add any internal notes about this application..."
                      />
                    </div>

                    {/* Action Tabs */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="flex border-b">
                        <button
                          type="button"
                          onClick={() => setActionType('offer')}
                          className={`flex-1 px-4 py-3 text-sm font-medium ${
                            actionType === 'offer' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Send className="w-4 h-4 inline mr-2" />
                          Make Offer
                        </button>
                        <button
                          type="button"
                          onClick={() => setActionType('exam')}
                          className={`flex-1 px-4 py-3 text-sm font-medium ${
                            actionType === 'exam' ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <ClipboardCheck className="w-4 h-4 inline mr-2" />
                          Request Exam
                        </button>
                        <button
                          type="button"
                          onClick={() => setActionType('approve')}
                          className={`flex-1 px-4 py-3 text-sm font-medium ${
                            actionType === 'approve' ? 'bg-green-50 text-green-700 border-b-2 border-green-600' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4 inline mr-2" />
                          Direct Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setActionType('reject')}
                          className={`flex-1 px-4 py-3 text-sm font-medium ${
                            actionType === 'reject' ? 'bg-red-50 text-red-700 border-b-2 border-red-600' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <XCircle className="w-4 h-4 inline mr-2" />
                          Reject
                        </button>
                      </div>

                      <div className="p-4">
                        {/* Make Offer Form */}
                        {actionType === 'offer' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Offer Reason / Message to Parent *
                              </label>
                              <textarea
                                value={offerReason}
                                onChange={(e) => setOfferReason(e.target.value)}
                                className="input"
                                rows="3"
                                placeholder="e.g., We are pleased to offer your child admission to our school. Based on the application review..."
                              />
                            </div>
                            <button
                              onClick={handleMakeOffer}
                              className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                            >
                              <Send className="w-4 h-4" />
                              Send Offer to Parent
                            </button>
                            <p className="text-xs text-gray-500">
                              Parent will receive a notification and must accept the offer before enrollment.
                            </p>
                          </div>
                        )}

                        {/* Request Exam Form */}
                        {actionType === 'exam' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Exam Date *
                                </label>
                                <input
                                  type="datetime-local"
                                  value={examDate}
                                  onChange={(e) => setExamDate(e.target.value)}
                                  className="input"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Subjects *
                                </label>
                                <input
                                  type="text"
                                  value={examSubjects}
                                  onChange={(e) => setExamSubjects(e.target.value)}
                                  className="input"
                                  placeholder="e.g., English, Mathematics"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Instructions for Parent
                              </label>
                              <textarea
                                value={examInstructions}
                                onChange={(e) => setExamInstructions(e.target.value)}
                                className="input"
                                rows="3"
                                placeholder="e.g., Please arrive 30 minutes early. Bring pencils and erasers..."
                              />
                            </div>
                            <button
                              onClick={handleRequestExam}
                              className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
                            >
                              <ClipboardCheck className="w-4 h-4" />
                              Send Exam Request
                            </button>
                          </div>
                        )}

                        {/* Direct Approve */}
                        {actionType === 'approve' && (
                          <div className="space-y-4">
                            <div className="bg-green-50 p-4 rounded-lg">
                              <p className="text-sm text-green-800">
                                <CheckCircle className="w-4 h-4 inline mr-2" />
                                This will directly approve the application and create a student record.
                              </p>
                            </div>
                            <button
                              onClick={handleApprove}
                              className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve & Create Student Record
                            </button>
                          </div>
                        )}

                        {/* Reject Form */}
                        {actionType === 'reject' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rejection Reason *
                              </label>
                              <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="input"
                                rows="3"
                                placeholder="Please provide a reason for rejection..."
                              />
                            </div>
                            <button
                              onClick={handleReject}
                              className="btn bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject Application
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show status for approved/rejected */}
              {selectedApp.status !== 'pending' && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Review Status</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-medium capitalize">{selectedApp.status}</p>
                    {selectedApp.reviewed_date && (
                      <>
                        <p className="text-sm text-gray-600 mt-2">Reviewed Date</p>
                        <p className="font-medium">{new Date(selectedApp.reviewed_date).toLocaleString()}</p>
                      </>
                    )}
                    {selectedApp.rejection_reason && (
                      <>
                        <p className="text-sm text-gray-600 mt-2">Rejection Reason</p>
                        <p className="font-medium">{selectedApp.rejection_reason}</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
