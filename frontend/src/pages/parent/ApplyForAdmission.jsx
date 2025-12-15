import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, X, CheckCircle, ArrowLeft, Camera, User, Heart, 
  FileText, Sparkles, ChevronRight, ChevronLeft, Loader2,
  GraduationCap, Phone, Mail, MapPin, Calendar, Users
} from 'lucide-react';
import { applicationsAPI, studentsAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

// Nationality options
const NATIONALITIES = [
  'Ghanaian', 'Nigerian', 'South African', 'Kenyan', 'Tanzanian', 'Ugandan',
  'Ethiopian', 'Egyptian', 'Moroccan', 'Algerian', 'Tunisian', 'Libyan',
  'Cameroonian', 'Ivorian', 'Senegalese', 'Malian', 'Burkinabe', 'Togolese',
  'Beninese', 'Nigerien', 'Chadian', 'Sudanese', 'Eritrean', 'Somali',
  'Rwandan', 'Burundian', 'Congolese', 'Angolan', 'Zambian', 'Zimbabwean',
  'Mozambican', 'Malawian', 'Botswanan', 'Namibian', 'Swazi', 'Lesothan',
  'American', 'British', 'Canadian', 'Australian', 'Indian', 'Chinese',
  'French', 'German', 'Italian', 'Spanish', 'Portuguese', 'Dutch',
  'Belgian', 'Swiss', 'Austrian', 'Swedish', 'Norwegian', 'Danish',
  'Finnish', 'Polish', 'Russian', 'Ukrainian', 'Turkish', 'Greek',
  'Lebanese', 'Syrian', 'Iraqi', 'Iranian', 'Saudi', 'Emirati',
  'Qatari', 'Kuwaiti', 'Bahraini', 'Omani', 'Yemeni', 'Jordanian',
  'Palestinian', 'Israeli', 'Pakistani', 'Bangladeshi', 'Sri Lankan',
  'Nepalese', 'Bhutanese', 'Maldivian', 'Afghan', 'Uzbek', 'Kazakh',
  'Japanese', 'Korean', 'Vietnamese', 'Thai', 'Malaysian', 'Singaporean',
  'Indonesian', 'Filipino', 'Burmese', 'Cambodian', 'Laotian',
  'Brazilian', 'Argentine', 'Chilean', 'Colombian', 'Peruvian', 'Venezuelan',
  'Ecuadorian', 'Bolivian', 'Paraguayan', 'Uruguayan', 'Mexican',
  'Cuban', 'Jamaican', 'Haitian', 'Dominican', 'Puerto Rican',
  'Other'
].sort();

// Religion options
const RELIGIONS = [
  'Christianity', 'Islam', 'Traditional African Religion', 'Hinduism', 
  'Buddhism', 'Judaism', 'Sikhism', 'Baháʼí Faith', 'Jainism', 
  'Shinto', 'Taoism', 'Confucianism', 'Zoroastrianism',
  'Atheist/Agnostic', 'Spiritual but not religious', 'Prefer not to say', 'Other'
];

// Blood group options
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

export default function ApplyForAdmission() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [applicationNumber, setApplicationNumber] = useState('');
  const [classes, setClasses] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState('right');
  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const [webcamStream, setWebcamStream] = useState(null);
  
  const [formData, setFormData] = useState({
    // Student Information
    first_name: '',
    last_name: '',
    other_names: '',
    date_of_birth: '',
    gender: 'male',
    blood_group: '',
    nationality: 'Ghanaian',
    religion: '',
    
    // Contact Information
    email: '',
    phone: '',
    address: '',
    city: '',
    region: '',
    
    // Academic Information
    previous_school: '',
    class_applying_for: '',
    academic_year: new Date().getFullYear() + '/' + (new Date().getFullYear() + 1),
    
    // Guardian Information (pre-filled from user)
    guardian_name: user?.name || '',
    guardian_phone: user?.phone || '',
    guardian_email: user?.email || '',
    guardian_relationship: '',
    guardian_address: '',
    guardian_occupation: '',
    
    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    
    // Medical Information
    medical_conditions: '',
    allergies: '',
    medications: '',
    
    // Photo
    photo: null
  });

  // Fetch available classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/classes.php`);
        setClasses(response.data.classes || []);
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    fetchClasses();
  }, []);

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamStream]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await uploadPhoto(file);
  };

  const uploadPhoto = async (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      setUploading(true);
      const uploadData = new FormData();
      uploadData.append('photo', file);
      uploadData.append('type', 'application');
      
      const response = await axios.post(`${API_BASE_URL}/upload_photo.php`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setFormData(prev => ({ ...prev, photo: response.data.url }));
      } else {
        throw new Error(response.data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo: ' + (error.response?.data?.error || error.message));
      setPhotoPreview(null);
    } finally {
      setUploading(false);
    }
  };

  // Start webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      setWebcamStream(stream);
      setShowWebcam(true);
      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  // Capture photo from webcam
  const capturePhoto = () => {
    if (!webcamRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = webcamRef.current.videoWidth;
    canvas.height = webcamRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(webcamRef.current, 0, 0);
    
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'webcam-photo.jpg', { type: 'image/jpeg' });
      stopWebcam();
      await uploadPhoto(file);
    }, 'image/jpeg', 0.9);
  };

  // Stop webcam
  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setShowWebcam(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all steps before final submission
    const step1Errors = validateStep(1);
    const step2Errors = validateStep(2);
    const allErrors = [...step1Errors, ...step2Errors];
    
    if (allErrors.length > 0) {
      alert('Please fix the following errors before submitting:\n\n' + allErrors.join('\n'));
      return;
    }
    
    try {
      const response = await applicationsAPI.create({
        ...formData,
        parent_id: user.id
      });
      
      setApplicationNumber(response.data.application_number);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application: ' + (error.response?.data?.error || error.message));
    }
  };

  // Validation for each step
  const validateStep = (stepNumber) => {
    const errors = [];
    
    if (stepNumber === 1) {
      if (!formData.first_name.trim()) errors.push('First name is required');
      if (!formData.last_name.trim()) errors.push('Last name is required');
      if (!formData.date_of_birth) errors.push('Date of birth is required');
      if (!formData.gender) errors.push('Gender is required');
      if (!formData.nationality) errors.push('Nationality is required');
      if (!formData.class_applying_for) errors.push('Class applying for is required');
    }
    
    if (stepNumber === 2) {
      if (!formData.guardian_name.trim()) errors.push('Guardian name is required');
      if (!formData.guardian_phone.trim()) errors.push('Guardian phone is required');
      if (!formData.guardian_email.trim()) errors.push('Guardian email is required');
      if (!formData.guardian_relationship) errors.push('Relationship to child is required');
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.guardian_email && !emailRegex.test(formData.guardian_email)) {
        errors.push('Please enter a valid email address');
      }
      
      // Validate phone format (basic)
      if (formData.guardian_phone && formData.guardian_phone.replace(/\D/g, '').length < 10) {
        errors.push('Please enter a valid phone number');
      }
    }
    
    // Step 3 (Medical) - optional fields, no validation required
    // Step 4 (Photo & Review) - photo is optional
    
    return errors;
  };

  const nextStep = () => {
    if (step < 4 && !isAnimating) {
      // Validate current step before proceeding
      const errors = validateStep(step);
      if (errors.length > 0) {
        alert('Please fix the following errors:\n\n' + errors.join('\n'));
        return;
      }
      
      setIsAnimating(true);
      setSlideDirection('right');
      setTimeout(() => {
        setStep(step + 1);
        setTimeout(() => setIsAnimating(false), 300);
      }, 150);
    }
  };

  const prevStep = () => {
    if (step > 1 && !isAnimating) {
      setIsAnimating(true);
      setSlideDirection('left');
      setTimeout(() => {
        setStep(step - 1);
        setTimeout(() => setIsAnimating(false), 300);
      }, 150);
    }
  };

  // Step icons and labels
  const steps = [
    { icon: User, label: 'Student Info', description: 'Basic information' },
    { icon: Users, label: 'Guardian Info', description: 'Parent/Guardian details' },
    { icon: Heart, label: 'Medical Info', description: 'Health information' },
    { icon: Camera, label: 'Photo & Review', description: 'Upload photo & submit' }
  ];

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="card p-8 text-center overflow-hidden">
          {/* Success Animation */}
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-green-400 rounded-full animate-ping opacity-20" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-slide-up">Application Submitted!</h1>
          <p className="text-gray-600 mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            Your application has been successfully submitted and is now under review.
          </p>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <p className="text-sm text-gray-600 mb-2">Application Number</p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-mono">
              {applicationNumber}
            </p>
            <p className="text-sm text-gray-500 mt-2">Please save this number for tracking</p>
          </div>

          <div className="space-y-4 text-left bg-gray-50 p-6 rounded-xl mb-8 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              What's Next?
            </h3>
            {[
              'Our admissions team will review your application',
              'You\'ll receive a notification within 2-3 business days',
              'Track your application status in your dashboard'
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 animate-slide-right" style={{ animationDelay: `${400 + i * 100}ms` }}>
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm flex-shrink-0 shadow-sm">
                  {i + 1}
                </div>
                <p className="text-sm text-gray-600 pt-1">{text}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/parent/dashboard')}
            className="btn btn-primary px-8 py-3 text-lg animate-slide-up hover:scale-105 transition-transform"
            style={{ animationDelay: '700ms' }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-right { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slide-left { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes bounce-in { 0% { transform: scale(0); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.4); opacity: 0; } }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.5s ease-out forwards; opacity: 0; }
        .animate-slide-right { animation: slide-right 0.5s ease-out forwards; opacity: 0; }
        .animate-slide-left { animation: slide-left 0.5s ease-out forwards; opacity: 0; }
        .animate-bounce-in { animation: bounce-in 0.5s ease-out forwards; }
        .step-enter-right { animation: slide-right 0.3s ease-out forwards; }
        .step-enter-left { animation: slide-left 0.3s ease-out forwards; }
        .input-focus:focus { box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); border-color: #3b82f6; }
        .photo-upload-zone { transition: all 0.3s ease; }
        .photo-upload-zone:hover { border-color: #3b82f6; background-color: #eff6ff; }
      `}</style>

      <div className="mb-6">
        <button
          onClick={() => navigate('/parent/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Apply for Admission</h1>
            <p className="text-gray-600">Fill in your child's information to submit an application</p>
          </div>
        </div>
      </div>

      {/* Enhanced Progress Steps */}
      <div className="card p-6 mb-6 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between relative">
          {/* Progress Line Background */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 mx-16" />
          {/* Progress Line Fill */}
          <div 
            className="absolute top-6 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 mx-16 transition-all duration-500"
            style={{ width: `${((step - 1) / 3) * 100}%`, maxWidth: 'calc(100% - 8rem)' }}
          />
          
          {steps.map((s, index) => {
            const StepIcon = s.icon;
            const isActive = step === index + 1;
            const isCompleted = step > index + 1;
            
            return (
              <div key={index} className="flex flex-col items-center z-10 flex-1">
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg scale-100' 
                      : isActive 
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-110 ring-4 ring-blue-100' 
                        : 'bg-white border-2 border-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <StepIcon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs mt-2 font-medium transition-colors ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {s.label}
                </span>
                <span className="text-xs text-gray-400 hidden sm:block">{s.description}</span>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={`card p-6 overflow-hidden ${isAnimating ? 'opacity-50' : ''}`}>
          {/* Step 1: Student Information */}
          {step === 1 && (
            <div className={`space-y-6 ${slideDirection === 'right' ? 'step-enter-right' : 'step-enter-left'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Student Information</h2>
                  <p className="text-sm text-gray-500">Enter your child's basic details</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="input input-focus transition-all duration-200"
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="input input-focus transition-all duration-200"
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Other Names</label>
                  <input
                    type="text"
                    value={formData.other_names}
                    onChange={(e) => setFormData({ ...formData, other_names: e.target.value })}
                    className="input input-focus transition-all duration-200"
                    placeholder="Middle names (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      required
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="input input-focus pl-10 transition-all duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="input input-focus transition-all duration-200"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                  <select
                    value={formData.blood_group}
                    onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    className="input input-focus transition-all duration-200"
                  >
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUPS.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nationality *</label>
                  <select
                    required
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="input input-focus transition-all duration-200"
                  >
                    <option value="">Select Nationality</option>
                    {NATIONALITIES.map(nat => (
                      <option key={nat} value={nat}>{nat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Religion</label>
                  <select
                    value={formData.religion}
                    onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
                    className="input input-focus transition-all duration-200"
                  >
                    <option value="">Select Religion</option>
                    {RELIGIONS.map(rel => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input input-focus pl-10 transition-all duration-200"
                      placeholder="student@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input input-focus pl-10 transition-all duration-200"
                      placeholder="024 XXX XXXX"
                    />
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="input input-focus pl-10 transition-all duration-200"
                      rows="2"
                      placeholder="Enter residential address"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Previous School</label>
                  <input
                    type="text"
                    value={formData.previous_school}
                    onChange={(e) => setFormData({ ...formData, previous_school: e.target.value })}
                    className="input input-focus transition-all duration-200"
                    placeholder="Name of previous school"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class Applying For *</label>
                  <select
                    required
                    value={formData.class_applying_for}
                    onChange={(e) => setFormData({ ...formData, class_applying_for: e.target.value })}
                    className="input input-focus transition-all duration-200"
                  >
                    <option value="">{classes.length > 0 ? 'Select Class' : 'No classes available - Contact admin'}</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Guardian Information */}
          {step === 2 && (
            <div className={`space-y-6 ${slideDirection === 'right' ? 'step-enter-right' : 'step-enter-left'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Guardian Information</h2>
                  <p className="text-sm text-gray-500">Parent or guardian contact details</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Guardian Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                    className="input input-focus transition-all duration-200"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Guardian Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={formData.guardian_phone}
                      onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                      className="input input-focus pl-10 transition-all duration-200"
                      placeholder="024 XXX XXXX"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Guardian Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.guardian_email}
                      onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
                      className="input input-focus pl-10 transition-all duration-200"
                      placeholder="guardian@email.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Relationship *</label>
                  <select
                    required
                    value={formData.guardian_relationship}
                    onChange={(e) => setFormData({ ...formData, guardian_relationship: e.target.value })}
                    className="input input-focus transition-all duration-200"
                  >
                    <option value="">Select Relationship</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Aunt">Aunt</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                  <input
                    type="text"
                    value={formData.guardian_occupation}
                    onChange={(e) => setFormData({ ...formData, guardian_occupation: e.target.value })}
                    className="input input-focus transition-all duration-200"
                    placeholder="e.g., Teacher, Engineer"
                  />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Guardian Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      value={formData.guardian_address}
                      onChange={(e) => setFormData({ ...formData, guardian_address: e.target.value })}
                      className="input input-focus pl-10 transition-all duration-200"
                      rows="2"
                      placeholder="Enter guardian's address"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4 text-red-600" />
                  </div>
                  <h3 className="text-md font-semibold text-gray-900">Emergency Contact</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                    <input
                      type="text"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      className="input input-focus transition-all duration-200"
                      placeholder="Emergency contact name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                    <input
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      className="input input-focus transition-all duration-200"
                      placeholder="024 XXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                    <select
                      value={formData.emergency_contact_relationship}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                      className="input input-focus transition-all duration-200"
                    >
                      <option value="">Select Relationship</option>
                      <option value="Relative">Relative</option>
                      <option value="Friend">Friend</option>
                      <option value="Neighbor">Neighbor</option>
                      <option value="Colleague">Colleague</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Medical Information */}
          {step === 3 && (
            <div className={`space-y-6 ${slideDirection === 'right' ? 'step-enter-right' : 'step-enter-left'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Medical Information</h2>
                  <p className="text-sm text-gray-500">Health details for your child's safety</p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This information is confidential and will only be used for your child's health and safety at school.
                </p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Conditions
                    <span className="text-gray-400 font-normal ml-2">(if any)</span>
                  </label>
                  <textarea
                    value={formData.medical_conditions}
                    onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                    className="input input-focus transition-all duration-200"
                    rows="3"
                    placeholder="e.g., Asthma, Diabetes, Epilepsy, Heart condition, etc. Write 'None' if not applicable."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allergies
                    <span className="text-gray-400 font-normal ml-2">(food, medication, environmental)</span>
                  </label>
                  <textarea
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="input input-focus transition-all duration-200"
                    rows="3"
                    placeholder="e.g., Peanuts, Penicillin, Dust, Pollen, etc. Write 'None' if not applicable."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Medications
                    <span className="text-gray-400 font-normal ml-2">(if any)</span>
                  </label>
                  <textarea
                    value={formData.medications}
                    onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                    className="input input-focus transition-all duration-200"
                    rows="3"
                    placeholder="List any medications your child is currently taking. Write 'None' if not applicable."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Photo Upload & Review */}
          {step === 4 && (
            <div className={`space-y-6 ${slideDirection === 'right' ? 'step-enter-right' : 'step-enter-left'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Photo & Review</h2>
                  <p className="text-sm text-gray-500">Upload a photo and review your application</p>
                </div>
              </div>
              
              {/* Photo Upload Section */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 photo-upload-zone bg-gray-50">
                {showWebcam ? (
                  <div className="text-center">
                    <video
                      ref={webcamRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-64 h-64 object-cover rounded-xl mx-auto mb-4 bg-black"
                    />
                    <div className="flex gap-3 justify-center">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="btn btn-primary"
                      >
                        <Camera className="w-4 h-4" />
                        Capture Photo
                      </button>
                      <button
                        type="button"
                        onClick={stopWebcam}
                        className="btn bg-gray-200 hover:bg-gray-300"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : photoPreview ? (
                  <div className="text-center">
                    <div className="relative inline-block">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-48 h-48 object-cover rounded-xl mx-auto mb-4 shadow-lg ring-4 ring-white"
                      />
                      {uploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                      {formData.photo && (
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-green-600 font-medium mb-3">
                      {formData.photo ? 'Photo uploaded successfully!' : 'Uploading...'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setFormData({ ...formData, photo: null });
                      }}
                      className="text-red-600 hover:text-red-700 text-sm flex items-center gap-2 mx-auto hover:underline"
                    >
                      <X className="w-4 h-4" />
                      Remove and upload different photo
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-4">Upload a passport-style photo of your child</p>
                    <div className="flex gap-3 justify-center flex-wrap">
                      <label className="cursor-pointer">
                        <span className="btn btn-primary inline-flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          {uploading ? 'Uploading...' : 'Upload Photo'}
                        </span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={startWebcam}
                        className="btn bg-gray-200 hover:bg-gray-300 inline-flex items-center gap-2"
                        disabled={uploading}
                      >
                        <Camera className="w-4 h-4" />
                        Take Photo
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">JPG, PNG or GIF (max 5MB)</p>
                  </div>
                )}
              </div>

              {/* Application Review */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Review Your Application</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Student Details</h4>
                    <div className="bg-white rounded-lg p-3 space-y-2">
                      <p className="text-sm"><span className="text-gray-500">Name:</span> <span className="font-medium">{formData.first_name} {formData.last_name}</span></p>
                      <p className="text-sm"><span className="text-gray-500">Date of Birth:</span> <span className="font-medium">{formData.date_of_birth || 'Not provided'}</span></p>
                      <p className="text-sm"><span className="text-gray-500">Gender:</span> <span className="font-medium capitalize">{formData.gender}</span></p>
                      <p className="text-sm"><span className="text-gray-500">Nationality:</span> <span className="font-medium">{formData.nationality || 'Not provided'}</span></p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Guardian Details</h4>
                    <div className="bg-white rounded-lg p-3 space-y-2">
                      <p className="text-sm"><span className="text-gray-500">Name:</span> <span className="font-medium">{formData.guardian_name || 'Not provided'}</span></p>
                      <p className="text-sm"><span className="text-gray-500">Phone:</span> <span className="font-medium">{formData.guardian_phone || 'Not provided'}</span></p>
                      <p className="text-sm"><span className="text-gray-500">Email:</span> <span className="font-medium">{formData.guardian_email || 'Not provided'}</span></p>
                      <p className="text-sm"><span className="text-gray-500">Relationship:</span> <span className="font-medium">{formData.guardian_relationship || 'Not provided'}</span></p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 md:col-span-2">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase">Academic Information</h4>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-sm">
                        <span className="text-gray-500">Class Applying For:</span>{' '}
                        <span className="font-medium">
                          {classes.find(c => c.id == formData.class_applying_for)?.class_name || formData.class_applying_for || 'Not specified'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Please review</strong> all information carefully before submitting. You can go back to previous steps to make changes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1 || isAnimating}
              className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 hover:gap-3"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={isAnimating}
                className="btn btn-primary flex items-center gap-2 transition-all duration-200 hover:gap-3"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isAnimating}
                className="btn bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-3 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Sparkles className="w-4 h-4" />
                Submit Application
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
