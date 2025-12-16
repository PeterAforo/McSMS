import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Upload, User, Calendar, Phone, Mail, MapPin, Users as UsersIcon, Award, TrendingUp, Image, FileText, Clock, AlertTriangle, Heart, StickyNote, CreditCard, History, CheckCircle, XCircle, Plus, X, Trash2, GraduationCap, Printer } from 'lucide-react';
import { studentsAPI, classesAPI } from '../../services/api';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import StudentIdCard from '../../components/StudentIdCard';

const API = `${API_BASE_URL}/student_management.php`;

export default function StudentProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formData, setFormData] = useState({});
  const [noteData, setNoteData] = useState({ note_type: 'general', title: '', content: '' });
  const [schoolSettings, setSchoolSettings] = useState({});

  useEffect(() => {
    fetchStudentData();
    fetchClasses();
    fetchSchoolSettings();
  }, [studentId]);

  const fetchSchoolSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/public_settings.php`);
      setSchoolSettings(response.data.settings || {});
    } catch (error) {
      console.error('Error fetching school settings:', error);
    }
  };

  const fetchStudentData = async () => {
    try {
      // Use enhanced API with full profile
      const response = await axios.get(`${API}?resource=students&action=profile&id=${studentId}`);
      setStudent(response.data.student);
      setFormData(response.data.student);
    } catch (error) {
      console.error('Error fetching student:', error);
      // Fallback to old API
      try {
        const response = await studentsAPI.getById(studentId);
        setStudent(response.data.student);
        setFormData(response.data.student);
      } catch (e2) {
        alert('Failed to load student data');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await classesAPI.getAll();
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    try {
      await studentsAPI.update(studentId, formData);
      alert('Student updated successfully!');
      setShowEditModal(false);
      fetchStudentData();
    } catch (error) {
      alert('Failed to update student');
    }
  };

  const handlePromoteStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}?resource=promotions`, {
        student_id: studentId,
        to_class_id: formData.new_class_id,
        promotion_type: formData.promotion_type || 'promotion',
        promotion_date: new Date().toISOString().split('T')[0]
      });
      alert('Student promoted successfully!');
      setShowPromoteModal(false);
      fetchStudentData();
    } catch (error) {
      alert('Failed to promote student');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}?resource=notes`, { ...noteData, student_id: studentId });
      alert('Note added successfully!');
      setShowNoteModal(false);
      setNoteData({ note_type: 'general', title: '', content: '' });
      fetchStudentData();
    } catch (error) {
      alert('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await axios.delete(`${API}?resource=notes&id=${noteId}`);
      fetchStudentData();
    } catch (error) {
      alert('Failed to delete note');
    }
  };

  const handleGenerateIdCard = async () => {
    try {
      await axios.post(`${API}?resource=id_cards&action=generate`, { student_id: studentId });
      alert('ID Card generated successfully!');
      fetchStudentData();
    } catch (error) {
      alert('Failed to generate ID card');
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedPhoto) {
      alert('Please select a photo');
      return;
    }

    const formDataObj = new FormData();
    formDataObj.append('photo', selectedPhoto);
    formDataObj.append('student_id', studentId);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload_student_photo.php`, formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        alert('Photo uploaded successfully!');
        setShowPhotoModal(false);
        setSelectedPhoto(null);
        setPhotoPreview(null);
        fetchStudentData();
      } else {
        alert(response.data.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.error || 'Failed to upload photo');
    }
  };

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

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-gray-500">Loading...</p></div>;
  }

  if (!student) {
    return <div className="text-center py-12"><p className="text-gray-500">Student not found</p></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/students')} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.first_name} {student.last_name}</h1>
            <p className="text-gray-600">{student.student_id}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowPhotoModal(true)} className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Photo
          </button>
          <button onClick={() => setShowPromoteModal(true)} className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Promote
          </button>
          <button onClick={() => setShowEditModal(true)} className="btn btn-primary flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Photo & Basic Info */}
        <div className="card p-6">
          <div className="text-center">
            {(student.profile_picture || student.photo) ? (
              <img src={(() => {
                const photo = student.profile_picture || student.photo;
                if (!photo) return '';
                if (photo.startsWith('http')) return photo;
                const cleanPath = photo.replace(/^\/?(uploads\/)?/, '');
                return `${API_BASE_URL.replace('/backend/api', '')}/uploads/${cleanPath}`;
              })()} alt={student.first_name} className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-blue-100" />
            ) : (
              <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-blue-100 flex items-center justify-center border-4 border-blue-200">
                <User className="w-16 h-16 text-blue-600" />
              </div>
            )}
            <h2 className="text-xl font-bold text-gray-900">{student.first_name} {student.last_name}</h2>
            <p className="text-gray-600 font-mono">{student.student_id}</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
              student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {student.status}
            </span>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-gray-600">Age</p>
                <p className="font-medium">{calculateAge(student.date_of_birth)} years</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-gray-600">Gender</p>
                <p className="font-medium capitalize">{student.gender}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Award className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-gray-600">Class</p>
                <p className="font-medium">{student.class_name || 'Not assigned'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Full Name</p>
                <p className="font-medium">{student.first_name} {student.other_names} {student.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date of Birth</p>
                <p className="font-medium">{new Date(student.date_of_birth).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Blood Group</p>
                <p className="font-medium">{student.blood_group || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Nationality</p>
                <p className="font-medium">{student.nationality || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Religion</p>
                <p className="font-medium">{student.religion || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Admission Date</p>
                <p className="font-medium">{new Date(student.admission_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{student.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{student.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 col-span-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">{student.address || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Guardian Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Guardian Name</p>
                <p className="font-medium">{student.guardian_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Guardian Phone</p>
                <p className="font-medium">{student.guardian_phone || 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Guardian Email</p>
                <p className="font-medium">{student.guardian_email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{student.attendance_summary?.present || 0}</p>
              <p className="text-sm text-gray-600">Days Present</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{student.exam_summary?.average_score ? Math.round(student.exam_summary.average_score) : 0}%</p>
              <p className="text-sm text-gray-600">Avg Score</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">GHS {student.fee_summary?.balance || 0}</p>
              <p className="text-sm text-gray-600">Fee Balance</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="card">
        <div className="border-b">
          <div className="flex overflow-x-auto">
            {[
              { id: 'timeline', label: 'Timeline', icon: History },
              { id: 'documents', label: 'Documents', icon: FileText },
              { id: 'awards', label: 'Awards', icon: Award },
              { id: 'discipline', label: 'Discipline', icon: AlertTriangle },
              { id: 'notes', label: 'Notes', icon: StickyNote },
              { id: 'id_card', label: 'ID Card', icon: CreditCard }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
                <tab.icon size={18} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Student Timeline</h3>
              {student.timeline?.length > 0 ? (
                <div className="space-y-4">
                  {student.timeline.map((event, i) => (
                    <div key={i} className="flex gap-4 border-l-2 border-blue-200 pl-4 pb-4">
                      <div className={`w-3 h-3 rounded-full -ml-[22px] mt-1.5 ${event.is_important ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{event.event_title}</p>
                            <p className="text-sm text-gray-600">{event.event_description}</p>
                          </div>
                          <span className="text-xs text-gray-500">{new Date(event.event_date).toLocaleDateString()}</span>
                        </div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${event.event_type === 'award' ? 'bg-yellow-100 text-yellow-700' : event.event_type === 'discipline' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{event.event_type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No timeline events yet</p>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Documents</h3>
                <button onClick={() => setShowDocumentModal(true)} className="btn btn-primary flex items-center gap-2"><Plus size={16} /> Upload Document</button>
              </div>
              {student.documents?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {student.documents.map((doc, i) => (
                    <div key={i} className="border rounded-lg p-4 flex items-center gap-4">
                      <FileText className="text-blue-600" size={32} />
                      <div className="flex-1">
                        <p className="font-medium">{doc.document_name}</p>
                        <p className="text-sm text-gray-500">{doc.document_type} • {new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                      {doc.is_verified && <CheckCircle className="text-green-500" size={20} />}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No documents uploaded</p>
              )}
            </div>
          )}

          {/* Awards Tab */}
          {activeTab === 'awards' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Awards & Achievements</h3>
              {student.awards?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {student.awards.map((award, i) => (
                    <div key={i} className="border rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-orange-50">
                      <div className="flex items-start gap-3">
                        <Award className="text-yellow-600" size={24} />
                        <div>
                          <p className="font-semibold">{award.award_name}</p>
                          <p className="text-sm text-gray-600">{award.description}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">{award.award_type}</span>
                            <span className="text-xs text-gray-500">{new Date(award.award_date).toLocaleDateString()}</span>
                          </div>
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

          {/* Discipline Tab */}
          {activeTab === 'discipline' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Discipline Records</h3>
              {student.discipline?.length > 0 ? (
                <div className="space-y-4">
                  {student.discipline.map((record, i) => (
                    <div key={i} className={`border rounded-lg p-4 ${record.incident_type === 'severe' ? 'border-red-300 bg-red-50' : record.incident_type === 'major' ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{record.incident_category}</p>
                          <p className="text-sm text-gray-600">{record.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${record.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{record.status}</span>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>Action: {record.action_taken}</span>
                        <span>{new Date(record.incident_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No discipline records</p>
              )}
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Notes</h3>
                <button onClick={() => setShowNoteModal(true)} className="btn btn-primary flex items-center gap-2"><Plus size={16} /> Add Note</button>
              </div>
              {student.notes?.length > 0 ? (
                <div className="space-y-4">
                  {student.notes.map((note, i) => (
                    <div key={i} className={`border rounded-lg p-4 ${note.is_flagged ? 'border-red-300 bg-red-50' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{note.title || 'Note'}</p>
                          <p className="text-sm text-gray-600 mt-1">{note.content}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{note.note_type}</span>
                          <button onClick={() => handleDeleteNote(note.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">By {note.created_by_name || 'Unknown'} • {new Date(note.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No notes yet</p>
              )}
            </div>
          )}

          {/* ID Card Tab */}
          {activeTab === 'id_card' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Student ID Card</h3>
                <button onClick={handleGenerateIdCard} className="btn btn-primary flex items-center gap-2"><CreditCard size={16} /> Generate ID Card</button>
              </div>
              {student.id_card ? (
                <StudentIdCard 
                  student={student} 
                  schoolSettings={schoolSettings} 
                  apiBaseUrl={API_BASE_URL}
                />
              ) : (
                <p className="text-gray-500 text-center py-8">No ID card generated yet. Click the button above to generate one.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Edit Student Profile</h2>
              <button onClick={() => setShowEditModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleUpdateStudent} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name *</label>
                  <input type="text" required value={formData.first_name || ''} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name *</label>
                  <input type="text" required value={formData.last_name || ''} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Other Names</label>
                  <input type="text" value={formData.other_names || ''} onChange={(e) => setFormData({...formData, other_names: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date of Birth *</label>
                  <input type="date" required value={formData.date_of_birth || ''} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Gender *</label>
                  <select value={formData.gender || 'male'} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="input">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Blood Group</label>
                  <input type="text" value={formData.blood_group || ''} onChange={(e) => setFormData({...formData, blood_group: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" value={formData.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Address</label>
                  <input type="text" value={formData.address || ''} onChange={(e) => setFormData({...formData, address: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Guardian Name</label>
                  <input type="text" value={formData.guardian_name || ''} onChange={(e) => setFormData({...formData, guardian_name: e.target.value})} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Guardian Phone</label>
                  <input type="tel" value={formData.guardian_phone || ''} onChange={(e) => setFormData({...formData, guardian_phone: e.target.value})} className="input" />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn bg-gray-200">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Promote Modal */}
      {showPromoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Promote Student</h2>
              <button onClick={() => setShowPromoteModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handlePromoteStudent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Class</label>
                <input type="text" value={student.class_name || 'Not assigned'} disabled className="input bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Promote to Class *</label>
                <select required value={formData.new_class_id || ''} onChange={(e) => setFormData({...formData, new_class_id: e.target.value})} className="input">
                  <option value="">Select Class</option>
                  {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.class_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Promotion Type</label>
                <select value={formData.promotion_type || 'promotion'} onChange={(e) => setFormData({...formData, promotion_type: e.target.value})} className="input">
                  <option value="promotion">Promotion</option>
                  <option value="transfer">Transfer</option>
                  <option value="repeat">Repeat</option>
                </select>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={() => setShowPromoteModal(false)} className="btn bg-gray-200">Cancel</button>
                <button type="submit" className="btn btn-primary">Promote Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add Note</h2>
              <button onClick={() => setShowNoteModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddNote} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Note Type</label>
                <select value={noteData.note_type} onChange={(e) => setNoteData({...noteData, note_type: e.target.value})} className="input">
                  <option value="general">General</option>
                  <option value="academic">Academic</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="medical">Medical</option>
                  <option value="counseling">Counseling</option>
                  <option value="parent_communication">Parent Communication</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input type="text" value={noteData.title} onChange={(e) => setNoteData({...noteData, title: e.target.value})} className="input" placeholder="Note title (optional)" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content *</label>
                <textarea required value={noteData.content} onChange={(e) => setNoteData({...noteData, content: e.target.value})} className="input" rows="4" placeholder="Enter note content..." />
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={() => setShowNoteModal(false)} className="btn bg-gray-200">Cancel</button>
                <button type="submit" className="btn btn-primary">Add Note</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Upload Student Photo</h2>
              <button onClick={() => setShowPhotoModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-blue-100" />
                ) : (
                  <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-gray-100 flex items-center justify-center border-4 border-gray-200">
                    <Image className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Select Photo</label>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="input" />
                <p className="text-xs text-gray-500 mt-1">Accepted formats: JPG, PNG (Max 2MB)</p>
              </div>
              <div className="flex justify-end gap-4 pt-4 border-t">
                <button type="button" onClick={() => setShowPhotoModal(false)} className="btn bg-gray-200">Cancel</button>
                <button onClick={handleUploadPhoto} className="btn btn-primary">Upload Photo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
