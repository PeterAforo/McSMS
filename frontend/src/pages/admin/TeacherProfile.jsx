import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Upload, User, Calendar, Phone, Mail, MapPin, 
  Award, FileText, Clock, AlertTriangle, Heart, StickyNote, CreditCard, 
  History, CheckCircle, XCircle, Plus, X, Trash2, GraduationCap, 
  Briefcase, DollarSign, BookOpen, Star, TrendingUp, Printer
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useAuthStore } from '../../store/authStore';

const API = `${API_BASE_URL}/teacher_management.php`;

export default function TeacherProfile() {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [showQualificationModal, setShowQualificationModal] = useState(false);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({});
  const [leaveData, setLeaveData] = useState({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
  const [noteData, setNoteData] = useState({ note_type: 'general', title: '', content: '', is_confidential: false });
  const [evaluationData, setEvaluationData] = useState({});
  const [qualificationData, setQualificationData] = useState({ qualification_type: 'degree', title: '', institution: '', year_obtained: '' });
  const [awardData, setAwardData] = useState({ award_type: 'excellence', title: '', award_date: '', description: '' });
  const [schoolSettings, setSchoolSettings] = useState({});

  useEffect(() => {
    fetchTeacherData();
    fetchSchoolSettings();
  }, [teacherId]);

  const fetchSchoolSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/public_settings.php`);
      setSchoolSettings(response.data.settings || {});
    } catch (error) {
      console.error('Error fetching school settings:', error);
    }
  };

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}?resource=teachers&action=profile&id=${teacherId}`);
      setTeacher(response.data.teacher);
      setFormData(response.data.teacher);
    } catch (error) {
      console.error('Error fetching teacher:', error);
      alert('Failed to load teacher data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeacher = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}?resource=teachers&id=${teacherId}`, formData);
      alert('Teacher updated successfully!');
      setShowEditModal(false);
      fetchTeacherData();
    } catch (error) {
      console.error('Error updating teacher:', error);
      alert('Failed to update teacher');
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}?resource=leaves`, { ...leaveData, teacher_id: teacherId });
      alert('Leave application submitted!');
      setShowLeaveModal(false);
      setLeaveData({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
      fetchTeacherData();
    } catch (error) {
      console.error('Error applying leave:', error);
      alert('Failed to submit leave application');
    }
  };

  const handleLeaveAction = async (leaveId, action, rejectionReason = '') => {
    try {
      await axios.post(`${API}?resource=leaves_action`, {
        leave_id: leaveId,
        action: action,
        approved_by: user?.id,
        rejection_reason: rejectionReason
      });
      alert(`Leave ${action}d successfully!`);
      fetchTeacherData();
    } catch (error) {
      console.error('Error processing leave:', error);
      alert(error.response?.data?.error || 'Failed to process leave');
    }
  };

  // Check if user can approve leaves
  const canApproveLeaves = ['admin', 'principal', 'hr'].includes(user?.role);

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}?resource=notes`, { ...noteData, teacher_id: teacherId, created_by: user?.id });
      alert('Note added!');
      setShowNoteModal(false);
      setNoteData({ note_type: 'general', title: '', content: '', is_confidential: false });
      fetchTeacherData();
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    }
  };

  const handleAddEvaluation = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}?resource=evaluations`, {
        ...evaluationData,
        teacher_id: teacherId,
        evaluator_id: user?.id,
        academic_year: new Date().getFullYear().toString(),
        term: 'Term 1',
        evaluation_date: new Date().toISOString().split('T')[0]
      });
      alert('Evaluation saved!');
      setShowEvaluationModal(false);
      setEvaluationData({});
      fetchTeacherData();
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('Failed to save evaluation');
    }
  };

  const handleAddQualification = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}?resource=qualifications`, { ...qualificationData, teacher_id: teacherId });
      alert('Qualification added!');
      setShowQualificationModal(false);
      setQualificationData({ qualification_type: 'degree', title: '', institution: '', year_obtained: '' });
      fetchTeacherData();
    } catch (error) {
      console.error('Error adding qualification:', error);
      alert('Failed to add qualification');
    }
  };

  const handleAddAward = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}?resource=awards`, { ...awardData, teacher_id: teacherId });
      alert('Award added!');
      setShowAwardModal(false);
      setAwardData({ award_type: 'excellence', title: '', award_date: '', description: '' });
      fetchTeacherData();
    } catch (error) {
      console.error('Error adding award:', error);
      alert('Failed to add award');
    }
  };

  const handleGenerateIdCard = async () => {
    try {
      await axios.post(`${API}?resource=id_card`, { teacher_id: parseInt(teacherId), printed_by: user?.id });
      alert('ID Card generated!');
      fetchTeacherData();
    } catch (error) {
      console.error('Error generating ID card:', error);
      alert('Failed to generate ID card: ' + (error.response?.data?.error || error.message));
    }
  };

  const handlePrintIdCard = () => {
    if (!teacher?.id_card) return;
    
    const profilePicUrl = teacher.profile_picture 
      ? `${API_BASE_URL.replace('/api', '')}/uploads/profiles/${teacher.profile_picture}`
      : '';
    const logoUrl = schoolSettings.school_logo || '';
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`TEACHER:${teacher.teacher_id}|${teacher.first_name} ${teacher.last_name}|${teacher.email}`)}`;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Teacher ID Card - ${teacher.first_name} ${teacher.last_name}</title>
        <style>
          @page { size: 85.6mm 53.98mm; margin: 0; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; }
          .print-container { 
            display: flex; 
            gap: 10mm; 
            padding: 5mm;
            justify-content: center;
          }
          .card {
            width: 85.6mm;
            height: 53.98mm;
            border: 1px solid #2563eb;
            border-radius: 3mm;
            overflow: hidden;
            background: white;
            page-break-inside: avoid;
          }
          .card-header {
            background: #2563eb;
            color: white;
            padding: 2mm;
            text-align: center;
          }
          .card-header-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2mm;
          }
          .school-logo {
            width: 8mm;
            height: 8mm;
            object-fit: contain;
            background: white;
            border-radius: 50%;
            padding: 1mm;
          }
          .school-name { font-size: 9pt; font-weight: bold; }
          .card-subtitle { font-size: 7pt; opacity: 0.9; }
          .card-body { padding: 3mm; }
          .front-content { display: flex; gap: 3mm; }
          .photo {
            width: 20mm;
            height: 25mm;
            object-fit: cover;
            border-radius: 2mm;
            border: 0.5mm solid #ddd;
          }
          .photo-placeholder {
            width: 20mm;
            height: 25mm;
            background: #e5e7eb;
            border-radius: 2mm;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #9ca3af;
            font-size: 8pt;
          }
          .info { flex: 1; }
          .name { font-size: 10pt; font-weight: bold; margin-bottom: 1mm; }
          .role { font-size: 8pt; color: #666; margin-bottom: 2mm; }
          .card-number { 
            font-family: monospace; 
            font-size: 8pt; 
            background: #f3f4f6; 
            padding: 1mm 2mm; 
            border-radius: 1mm;
            display: inline-block;
            margin-bottom: 1mm;
          }
          .teacher-id { font-size: 7pt; color: #666; }
          .dates { 
            display: flex; 
            justify-content: space-between; 
            font-size: 7pt; 
            border-top: 0.3mm solid #e5e7eb; 
            padding-top: 2mm; 
            margin-top: 2mm;
          }
          .date-label { color: #666; }
          
          /* Back card styles */
          .back-header { 
            background: #2563eb; 
            color: white; 
            padding: 1.5mm; 
            text-align: center; 
            font-size: 7pt; 
            font-weight: bold;
          }
          .back-body { padding: 2mm; font-size: 7pt; }
          .back-section { margin-bottom: 2mm; }
          .back-label { font-weight: bold; color: #374151; margin-bottom: 0.5mm; }
          .back-value { color: #4b5563; }
          .qr-container { text-align: center; margin: 2mm 0; }
          .qr-code { width: 15mm; height: 15mm; }
          .terms { 
            font-size: 5pt; 
            color: #9ca3af; 
            text-align: center; 
            border-top: 0.3mm solid #e5e7eb; 
            padding-top: 1mm; 
            margin-top: 1mm;
          }
          
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: center; padding: 10px; background: #f3f4f6;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
            Print ID Card
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; margin-left: 10px;">
            Close
          </button>
        </div>
        
        <div class="print-container">
          <!-- Front Card -->
          <div class="card">
            <div class="card-header">
              <div class="card-header-content">
                ${logoUrl ? `<img src="${logoUrl}" class="school-logo" alt="Logo">` : ''}
                <div>
                  <div class="school-name">${schoolSettings.school_name || 'SCHOOL NAME'}</div>
                  <div class="card-subtitle">STAFF ID CARD</div>
                </div>
              </div>
            </div>
            <div class="card-body">
              <div class="front-content">
                ${profilePicUrl 
                  ? `<img src="${profilePicUrl}" class="photo" alt="Photo">`
                  : '<div class="photo-placeholder">No Photo</div>'
                }
                <div class="info">
                  <div class="name">${teacher.first_name} ${teacher.last_name}</div>
                  <div class="role">${teacher.specialization || 'Teacher'}</div>
                  <div class="card-number">${teacher.id_card.card_number}</div>
                  <div class="teacher-id">ID: ${teacher.teacher_id}</div>
                </div>
              </div>
              <div class="dates">
                <div><span class="date-label">Issue:</span> ${new Date(teacher.id_card.issue_date).toLocaleDateString()}</div>
                <div><span class="date-label">Expiry:</span> ${new Date(teacher.id_card.expiry_date).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
          
          <!-- Back Card -->
          <div class="card">
            <div class="back-header">IMPORTANT INFORMATION</div>
            <div class="back-body">
              <div class="back-section">
                <div class="back-label">Emergency Contact:</div>
                <div class="back-value">${teacher.emergency_contact_name ? `${teacher.emergency_contact_name} - ${teacher.emergency_contact_phone}` : 'Not provided'}</div>
              </div>
              <div class="back-section">
                <div class="back-label">School Contact:</div>
                <div class="back-value">${schoolSettings.school_phone || 'N/A'}</div>
                <div class="back-value">${schoolSettings.school_email || 'N/A'}</div>
              </div>
              <div class="back-section">
                <div class="back-label">School Address:</div>
                <div class="back-value">${schoolSettings.school_address || 'N/A'}</div>
              </div>
              <div class="qr-container">
                <img src="${qrCodeUrl}" class="qr-code" alt="QR Code">
              </div>
              <div class="terms">
                This card is property of ${schoolSettings.school_name || 'the school'}. If found, please return to the address above.
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);
      formData.append('type', 'teacher');
      formData.append('id', teacherId);
      
      await axios.post(
        `${API_BASE_URL}/upload_profile_picture.php`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      alert('Photo uploaded successfully!');
      fetchTeacherData();
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Teacher not found</p>
        <button onClick={() => navigate('/admin/teachers')} className="btn btn-primary mt-4">Back to Teachers</button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'leaves', label: 'Leaves', icon: Clock },
    { id: 'evaluations', label: 'Performance', icon: TrendingUp },
    { id: 'qualifications', label: 'Qualifications', icon: GraduationCap },
    { id: 'awards', label: 'Awards', icon: Award },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'timeline', label: 'Timeline', icon: History },
    { id: 'id_card', label: 'ID Card', icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/teachers')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{teacher.first_name} {teacher.last_name}</h1>
            <p className="text-gray-600">{teacher.teacher_id} • {teacher.specialization || 'Teacher'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowEditModal(true)} className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
            <Edit size={16} /> Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Photo & Basic Info */}
        <div className="card p-6">
          <div className="text-center">
            <div className="relative inline-block">
              {teacher.profile_picture ? (
                <img src={`${API_BASE_URL.replace('/api', '')}/uploads/profiles/${teacher.profile_picture}`} alt={teacher.first_name} className="w-32 h-32 rounded-full mx-auto mb-2 object-cover border-4 border-blue-100" />
              ) : (
                <div className="w-32 h-32 rounded-full mx-auto mb-2 bg-blue-100 flex items-center justify-center border-4 border-blue-200">
                  <User className="w-16 h-16 text-blue-600" />
                </div>
              )}
              <label className="absolute bottom-2 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg">
                <Upload className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
              </label>
            </div>
            {uploadingPhoto && <p className="text-xs text-blue-600 mb-2">Uploading...</p>}
            <h2 className="text-xl font-bold text-gray-900">{teacher.first_name} {teacher.last_name}</h2>
            <p className="text-gray-600 font-mono">{teacher.teacher_id}</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
              teacher.status === 'active' ? 'bg-green-100 text-green-700' : 
              teacher.status === 'on-leave' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {teacher.status}
            </span>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{teacher.email}</span>
            </div>
            {teacher.phone && (
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{teacher.phone}</span>
              </div>
            )}
            {teacher.address && (
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{teacher.address}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-gray-600">
              <Briefcase className="w-4 h-4" />
              <span className="text-sm capitalize">{teacher.employment_type}</span>
            </div>
            {teacher.hire_date && (
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Joined: {new Date(teacher.hire_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t space-y-2">
            <button onClick={() => setShowLeaveModal(true)} className="w-full btn bg-orange-100 text-orange-700 hover:bg-orange-200 text-sm">
              Apply for Leave
            </button>
            <button onClick={() => setShowEvaluationModal(true)} className="w-full btn bg-purple-100 text-purple-700 hover:bg-purple-200 text-sm">
              Add Evaluation
            </button>
          </div>
        </div>

        {/* Right Column - Tabs Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{teacher.subjects?.length || 0}</p>
              <p className="text-xs text-gray-500">Subjects</p>
            </div>
            <div className="card p-4 text-center">
              <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{teacher.workload?.periods || 0}</p>
              <p className="text-xs text-gray-500">Periods/Week</p>
            </div>
            <div className="card p-4 text-center">
              <Award className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{teacher.awards?.length || 0}</p>
              <p className="text-xs text-gray-500">Awards</p>
            </div>
            <div className="card p-4 text-center">
              <Star className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{teacher.evaluations?.[0]?.overall_rating || '-'}</p>
              <p className="text-xs text-gray-500">Rating</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="card">
            <div className="border-b">
              <div className="flex flex-wrap">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 text-sm font-medium flex items-center gap-1.5 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon size={14} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">Date of Birth:</span> {teacher.date_of_birth || 'N/A'}</p>
                        <p><span className="text-gray-500">Age:</span> {calculateAge(teacher.date_of_birth)} years</p>
                        <p><span className="text-gray-500">Gender:</span> <span className="capitalize">{teacher.gender}</span></p>
                        <p><span className="text-gray-500">National ID:</span> {teacher.national_id || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Employment Details</h4>
                      <div className="space-y-2 text-sm">
                        <p><span className="text-gray-500">Qualification:</span> {teacher.qualification || 'N/A'}</p>
                        <p><span className="text-gray-500">Specialization:</span> {teacher.specialization || 'N/A'}</p>
                        <p><span className="text-gray-500">Assigned Class:</span> {teacher.assigned_class || 'None'}</p>
                        <p><span className="text-gray-500">Hire Date:</span> {teacher.hire_date || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {teacher.bio && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
                      <p className="text-sm text-gray-600">{teacher.bio}</p>
                    </div>
                  )}

                  {/* Emergency Contact */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Emergency Contact</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500">Name:</span> {teacher.emergency_contact_name || 'N/A'}</p>
                      <p><span className="text-gray-500">Phone:</span> {teacher.emergency_contact_phone || 'N/A'}</p>
                      <p><span className="text-gray-500">Relationship:</span> {teacher.emergency_contact_relationship || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Assigned Subjects */}
                  {teacher.subjects?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Assigned Subjects</h4>
                      <div className="flex flex-wrap gap-2">
                        {teacher.subjects.map((sub, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {sub.subject_name} ({sub.class_name})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Schedule Tab */}
              {activeTab === 'schedule' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Weekly Schedule</h3>
                  {teacher.schedule?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Day</th>
                            <th className="px-4 py-2 text-left">Period</th>
                            <th className="px-4 py-2 text-left">Time</th>
                            <th className="px-4 py-2 text-left">Subject</th>
                            <th className="px-4 py-2 text-left">Class</th>
                            <th className="px-4 py-2 text-left">Room</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {teacher.schedule.map((slot, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 capitalize">{slot.day_of_week}</td>
                              <td className="px-4 py-2">{slot.period_number}</td>
                              <td className="px-4 py-2">{slot.start_time} - {slot.end_time}</td>
                              <td className="px-4 py-2">{slot.subject_name || '-'}</td>
                              <td className="px-4 py-2">{slot.class_name || '-'}</td>
                              <td className="px-4 py-2">{slot.room || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : teacher.subjects?.length > 0 ? (
                    <div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <p className="text-yellow-700 text-sm">
                          <strong>Note:</strong> Detailed weekly schedule not yet configured. Showing assigned subjects/classes below.
                        </p>
                      </div>
                      <h4 className="font-medium text-gray-700 mb-3">Assigned Subjects & Classes</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {teacher.subjects.map((sub, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{sub.subject_name}</p>
                              <p className="text-sm text-gray-500">{sub.class_name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No schedule or subject assignments yet</p>
                      <p className="text-sm text-gray-400 mt-1">Assign subjects to this teacher in Class Subjects management</p>
                    </div>
                  )}
                </div>
              )}

              {/* Leaves Tab */}
              {activeTab === 'leaves' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Leave History</h3>
                    <button onClick={() => setShowLeaveModal(true)} className="btn btn-primary btn-sm flex items-center gap-1">
                      <Plus size={14} /> Apply Leave
                    </button>
                  </div>

                  {/* Leave Balance */}
                  {teacher.leave_balance && (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Annual Leave</p>
                        <p className="text-lg font-bold text-green-700">
                          {teacher.leave_balance.annual_leave_total - teacher.leave_balance.annual_leave_used} / {teacher.leave_balance.annual_leave_total}
                        </p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Sick Leave</p>
                        <p className="text-lg font-bold text-orange-700">
                          {teacher.leave_balance.sick_leave_total - teacher.leave_balance.sick_leave_used} / {teacher.leave_balance.sick_leave_total}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Study Leave</p>
                        <p className="text-lg font-bold text-blue-700">
                          {teacher.leave_balance.study_leave_total - teacher.leave_balance.study_leave_used} / {teacher.leave_balance.study_leave_total}
                        </p>
                      </div>
                    </div>
                  )}

                  {teacher.leaves?.length > 0 ? (
                    <div className="space-y-3">
                      {teacher.leaves.map((leave, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium capitalize">{leave.leave_type} Leave</p>
                              <p className="text-sm text-gray-600">{leave.start_date} to {leave.end_date} ({leave.days_count} days)</p>
                              <p className="text-sm text-gray-500 mt-1">{leave.reason}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                                leave.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {leave.status}
                              </span>
                              {leave.status === 'pending' && canApproveLeaves && (
                                <div className="flex gap-1">
                                  <button onClick={() => handleLeaveAction(leave.id, 'approve')} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approve">
                                    <CheckCircle size={16} />
                                  </button>
                                  <button onClick={() => handleLeaveAction(leave.id, 'reject', 'Rejected by admin')} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Reject">
                                    <XCircle size={16} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No leave records</p>
                  )}
                </div>
              )}

              {/* Evaluations Tab */}
              {activeTab === 'evaluations' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Performance Evaluations</h3>
                    <button onClick={() => setShowEvaluationModal(true)} className="btn btn-primary btn-sm flex items-center gap-1">
                      <Plus size={14} /> Add Evaluation
                    </button>
                  </div>
                  {teacher.evaluations?.length > 0 ? (
                    <div className="space-y-4">
                      {teacher.evaluations.map((ev, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-medium">{ev.term} {ev.academic_year}</p>
                              <p className="text-sm text-gray-500">Evaluated on {ev.evaluation_date}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-blue-600">{ev.overall_rating}/5</p>
                              <p className="text-xs text-gray-500">Overall Rating</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-sm">
                            {['teaching_quality', 'classroom_management', 'punctuality', 'professionalism'].map(metric => (
                              <div key={metric} className="text-center">
                                <p className="text-gray-500 text-xs capitalize">{metric.replace('_', ' ')}</p>
                                <p className="font-semibold">{ev[metric] || '-'}/5</p>
                              </div>
                            ))}
                          </div>
                          {ev.comments && <p className="text-sm text-gray-600 mt-3 border-t pt-3">{ev.comments}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No evaluations yet</p>
                  )}
                </div>
              )}

              {/* Qualifications Tab */}
              {activeTab === 'qualifications' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Qualifications & Certifications</h3>
                    <button onClick={() => setShowQualificationModal(true)} className="btn btn-primary btn-sm flex items-center gap-1">
                      <Plus size={14} /> Add Qualification
                    </button>
                  </div>
                  {teacher.qualifications?.length > 0 ? (
                    <div className="space-y-3">
                      {teacher.qualifications.map((qual, idx) => (
                        <div key={idx} className="border rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <p className="font-medium">{qual.title}</p>
                            <p className="text-sm text-gray-600">{qual.institution} • {qual.year_obtained}</p>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded capitalize">{qual.qualification_type}</span>
                          </div>
                          {qual.is_verified && <CheckCircle className="text-green-600" size={20} />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No qualifications added</p>
                  )}
                </div>
              )}

              {/* Awards Tab */}
              {activeTab === 'awards' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Awards & Recognition</h3>
                    <button onClick={() => setShowAwardModal(true)} className="btn btn-primary btn-sm flex items-center gap-1">
                      <Plus size={14} /> Add Award
                    </button>
                  </div>
                  {teacher.awards?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {teacher.awards.map((award, idx) => (
                        <div key={idx} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Award className="text-yellow-500 flex-shrink-0" size={24} />
                            <div>
                              <p className="font-medium">{award.title}</p>
                              <p className="text-sm text-gray-600">{award.awarded_by}</p>
                              <p className="text-xs text-gray-500">{new Date(award.award_date).toLocaleDateString()}</p>
                              {award.description && <p className="text-sm text-gray-500 mt-2">{award.description}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No awards yet</p>
                  )}
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Documents</h3>
                  {teacher.documents?.length > 0 ? (
                    <div className="space-y-2">
                      {teacher.documents.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="text-gray-400" size={20} />
                            <div>
                              <p className="font-medium">{doc.document_name}</p>
                              <p className="text-xs text-gray-500 capitalize">{doc.document_type}</p>
                            </div>
                          </div>
                          <a href={doc.file_path} target="_blank" className="text-blue-600 text-sm hover:underline">View</a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No documents uploaded</p>
                  )}
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Admin Notes</h3>
                    <button onClick={() => setShowNoteModal(true)} className="btn btn-primary btn-sm flex items-center gap-1">
                      <Plus size={14} /> Add Note
                    </button>
                  </div>
                  {teacher.notes?.length > 0 ? (
                    <div className="space-y-3">
                      {teacher.notes.map((note, idx) => (
                        <div key={idx} className={`border rounded-lg p-4 ${note.is_confidential ? 'border-red-200 bg-red-50' : ''}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{note.title}</p>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded capitalize">{note.note_type}</span>
                            </div>
                            <p className="text-xs text-gray-500">{new Date(note.created_at).toLocaleDateString()}</p>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No notes yet</p>
                  )}
                </div>
              )}

              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
                  {teacher.timeline?.length > 0 ? (
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      <div className="space-y-4">
                        {teacher.timeline.map((event, idx) => (
                          <div key={idx} className="flex gap-4 relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                              event.event_type === 'hired' ? 'bg-green-500' :
                              event.event_type === 'award' ? 'bg-yellow-500' :
                              event.event_type === 'evaluation' ? 'bg-purple-500' :
                              event.event_type === 'leave' ? 'bg-orange-500' :
                              'bg-blue-500'
                            }`}>
                              <History className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="font-medium">{event.title}</p>
                              <p className="text-sm text-gray-600">{event.description}</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(event.event_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No timeline events</p>
                  )}
                </div>
              )}

              {/* ID Card Tab */}
              {activeTab === 'id_card' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Teacher ID Card</h3>
                    <div className="flex gap-2">
                      {teacher.id_card && (
                        <button onClick={handlePrintIdCard} className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2">
                          <Printer size={16} /> Print ID Card
                        </button>
                      )}
                      <button onClick={handleGenerateIdCard} className="btn btn-primary flex items-center gap-2">
                        <CreditCard size={16} /> {teacher.id_card ? 'Regenerate' : 'Generate'} ID Card
                      </button>
                    </div>
                  </div>
                  {teacher.id_card ? (
                    <div className="flex flex-col md:flex-row gap-6 justify-center">
                      {/* Front Card */}
                      <div className="w-full max-w-sm">
                        <p className="text-sm text-gray-500 text-center mb-2">Front</p>
                        <div className="border-2 border-blue-600 rounded-xl overflow-hidden shadow-lg">
                          <div className="bg-blue-600 text-white p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {schoolSettings.school_logo && (
                                <img src={schoolSettings.school_logo} alt="Logo" className="w-10 h-10 object-contain bg-white rounded-full p-1" />
                              )}
                              <div>
                                <h4 className="font-bold text-sm">{schoolSettings.school_name || 'SCHOOL NAME'}</h4>
                                <p className="text-xs text-blue-100">STAFF ID CARD</p>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-white">
                            <div className="flex gap-3">
                              {teacher.profile_picture ? (
                                <img src={`${API_BASE_URL.replace('/api', '')}/uploads/profiles/${teacher.profile_picture}`} alt={teacher.first_name} className="w-20 h-24 rounded-lg object-cover border" />
                              ) : (
                                <div className="w-20 h-24 bg-gray-200 rounded-lg flex items-center justify-center border">
                                  <User className="text-gray-400" size={32} />
                                </div>
                              )}
                              <div className="flex-1 text-sm">
                                <p className="font-bold">{teacher.first_name} {teacher.last_name}</p>
                                <p className="text-gray-600 text-xs">{teacher.specialization || 'Teacher'}</p>
                                <p className="font-mono text-xs mt-2 bg-gray-100 px-2 py-1 rounded">{teacher.id_card.card_number}</p>
                                <p className="text-xs text-gray-500 mt-1">ID: {teacher.teacher_id}</p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
                              <div><span className="text-gray-500">Issue:</span> {new Date(teacher.id_card.issue_date).toLocaleDateString()}</div>
                              <div><span className="text-gray-500">Expiry:</span> {new Date(teacher.id_card.expiry_date).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Back Card */}
                      <div className="w-full max-w-sm">
                        <p className="text-sm text-gray-500 text-center mb-2">Back</p>
                        <div className="border-2 border-blue-600 rounded-xl overflow-hidden shadow-lg h-[calc(100%-1.5rem)]">
                          <div className="bg-blue-600 text-white p-2 text-center">
                            <p className="text-xs font-medium">IMPORTANT INFORMATION</p>
                          </div>
                          <div className="p-4 bg-white h-full">
                            <div className="space-y-3 text-xs">
                              {/* Emergency Contact */}
                              <div>
                                <p className="font-semibold text-gray-700 mb-1">Emergency Contact:</p>
                                {teacher.emergency_contact_name ? (
                                  <p className="text-gray-600">{teacher.emergency_contact_name} - {teacher.emergency_contact_phone}</p>
                                ) : (
                                  <p className="text-gray-400 italic">Not provided</p>
                                )}
                              </div>

                              {/* School Contact */}
                              <div>
                                <p className="font-semibold text-gray-700 mb-1">School Contact:</p>
                                <p className="text-gray-600">{schoolSettings.school_phone || 'N/A'}</p>
                                <p className="text-gray-600">{schoolSettings.school_email || 'N/A'}</p>
                              </div>

                              {/* Address */}
                              <div>
                                <p className="font-semibold text-gray-700 mb-1">School Address:</p>
                                <p className="text-gray-600">{schoolSettings.school_address || 'N/A'}</p>
                              </div>

                              {/* QR Code */}
                              <div className="flex justify-center pt-2">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`TEACHER:${teacher.teacher_id}|${teacher.first_name} ${teacher.last_name}|${teacher.email}`)}`} 
                                  alt="QR Code" 
                                  className="w-16 h-16"
                                />
                              </div>

                              {/* Terms */}
                              <p className="text-[10px] text-gray-400 text-center pt-2 border-t">
                                This card is property of {schoolSettings.school_name || 'the school'}. If found, please return to the address above.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No ID card generated yet</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Apply for Leave</h2>
              <button onClick={() => setShowLeaveModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Leave Type</label>
                <select value={leaveData.leave_type} onChange={(e) => setLeaveData({...leaveData, leave_type: e.target.value})} className="input">
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="study">Study Leave</option>
                  <option value="emergency">Emergency Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input type="date" value={leaveData.start_date} onChange={(e) => setLeaveData({...leaveData, start_date: e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input type="date" value={leaveData.end_date} onChange={(e) => setLeaveData({...leaveData, end_date: e.target.value})} className="input" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <textarea value={leaveData.reason} onChange={(e) => setLeaveData({...leaveData, reason: e.target.value})} className="input" rows="3" required />
              </div>
              <button type="submit" className="btn btn-primary w-full">Submit Application</button>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Add Note</h2>
              <button onClick={() => setShowNoteModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddNote} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Note Type</label>
                <select value={noteData.note_type} onChange={(e) => setNoteData({...noteData, note_type: e.target.value})} className="input">
                  <option value="general">General</option>
                  <option value="performance">Performance</option>
                  <option value="disciplinary">Disciplinary</option>
                  <option value="commendation">Commendation</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input type="text" value={noteData.title} onChange={(e) => setNoteData({...noteData, title: e.target.value})} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea value={noteData.content} onChange={(e) => setNoteData({...noteData, content: e.target.value})} className="input" rows="4" required />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={noteData.is_confidential} onChange={(e) => setNoteData({...noteData, is_confidential: e.target.checked})} />
                <span className="text-sm">Mark as confidential</span>
              </label>
              <button type="submit" className="btn btn-primary w-full">Add Note</button>
            </form>
          </div>
        </div>
      )}

      {/* Evaluation Modal */}
      {showEvaluationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Performance Evaluation</h2>
              <button onClick={() => setShowEvaluationModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddEvaluation} className="p-6 space-y-4">
              <p className="text-sm text-gray-600 mb-4">Rate each area from 1 (Poor) to 5 (Excellent)</p>
              <div className="grid grid-cols-2 gap-4">
                {['teaching_quality', 'classroom_management', 'student_engagement', 'lesson_planning', 'punctuality', 'professionalism', 'communication', 'teamwork'].map(metric => (
                  <div key={metric}>
                    <label className="block text-sm font-medium mb-2 capitalize">{metric.replace('_', ' ')}</label>
                    <select value={evaluationData[metric] || ''} onChange={(e) => setEvaluationData({...evaluationData, [metric]: e.target.value})} className="input">
                      <option value="">Select</option>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Strengths</label>
                <textarea value={evaluationData.strengths || ''} onChange={(e) => setEvaluationData({...evaluationData, strengths: e.target.value})} className="input" rows="2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Areas for Improvement</label>
                <textarea value={evaluationData.areas_for_improvement || ''} onChange={(e) => setEvaluationData({...evaluationData, areas_for_improvement: e.target.value})} className="input" rows="2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Comments</label>
                <textarea value={evaluationData.comments || ''} onChange={(e) => setEvaluationData({...evaluationData, comments: e.target.value})} className="input" rows="3" />
              </div>
              <button type="submit" className="btn btn-primary w-full">Save Evaluation</button>
            </form>
          </div>
        </div>
      )}

      {/* Qualification Modal */}
      {showQualificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Add Qualification</h2>
              <button onClick={() => setShowQualificationModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddQualification} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select value={qualificationData.qualification_type} onChange={(e) => setQualificationData({...qualificationData, qualification_type: e.target.value})} className="input">
                  <option value="degree">Degree</option>
                  <option value="diploma">Diploma</option>
                  <option value="certificate">Certificate</option>
                  <option value="license">License</option>
                  <option value="training">Training</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input type="text" value={qualificationData.title} onChange={(e) => setQualificationData({...qualificationData, title: e.target.value})} className="input" placeholder="e.g., Bachelor of Education" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Institution</label>
                <input type="text" value={qualificationData.institution} onChange={(e) => setQualificationData({...qualificationData, institution: e.target.value})} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Year Obtained</label>
                <input type="number" value={qualificationData.year_obtained} onChange={(e) => setQualificationData({...qualificationData, year_obtained: e.target.value})} className="input" min="1950" max="2030" required />
              </div>
              <button type="submit" className="btn btn-primary w-full">Add Qualification</button>
            </form>
          </div>
        </div>
      )}

      {/* Award Modal */}
      {showAwardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Add Award</h2>
              <button onClick={() => setShowAwardModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddAward} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Award Type</label>
                <select value={awardData.award_type} onChange={(e) => setAwardData({...awardData, award_type: e.target.value})} className="input">
                  <option value="excellence">Excellence</option>
                  <option value="innovation">Innovation</option>
                  <option value="service">Service</option>
                  <option value="leadership">Leadership</option>
                  <option value="performance">Performance</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input type="text" value={awardData.title} onChange={(e) => setAwardData({...awardData, title: e.target.value})} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Awarded By</label>
                <input type="text" value={awardData.awarded_by || ''} onChange={(e) => setAwardData({...awardData, awarded_by: e.target.value})} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date</label>
                <input type="date" value={awardData.award_date} onChange={(e) => setAwardData({...awardData, award_date: e.target.value})} className="input" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea value={awardData.description} onChange={(e) => setAwardData({...awardData, description: e.target.value})} className="input" rows="2" />
              </div>
              <button type="submit" className="btn btn-primary w-full">Add Award</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Edit Teacher Profile</h2>
              <button onClick={() => setShowEditModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleUpdateTeacher} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name *</label>
                  <input type="text" value={formData.first_name || ''} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name *</label>
                  <input type="text" value={formData.last_name || ''} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} className="input" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date of Birth</label>
                  <input type="date" value={formData.date_of_birth || ''} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Gender</label>
                  <select value={formData.gender || 'male'} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="input">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <textarea value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} className="input" rows="2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Qualification</label>
                  <input type="text" value={formData.qualification || ''} onChange={(e) => setFormData({...formData, qualification: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Specialization</label>
                  <input type="text" value={formData.specialization || ''} onChange={(e) => setFormData({...formData, specialization: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Employment Type</label>
                  <select value={formData.employment_type || 'full-time'} onChange={(e) => setFormData({...formData, employment_type: e.target.value})} className="input">
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select value={formData.status || 'active'} onChange={(e) => setFormData({...formData, status: e.target.value})} className="input">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on-leave">On Leave</option>
                  </select>
                </div>
              </div>

              <h3 className="text-lg font-semibold pt-4 border-t">Emergency Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Name</label>
                  <input type="text" value={formData.emergency_contact_name || ''} onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Phone</label>
                  <input type="tel" value={formData.emergency_contact_phone || ''} onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})} className="input" />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn bg-gray-200 text-gray-700 hover:bg-gray-300 flex-1">Cancel</button>
                <button type="submit" className="btn btn-primary flex-1">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
