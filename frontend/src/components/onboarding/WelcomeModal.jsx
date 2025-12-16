import { useState, useEffect, useRef } from 'react';
import { 
  X, Sparkles, Rocket, CheckCircle, ChevronRight, ChevronLeft,
  School, Calendar, BookOpen, Users, Upload, Settings, 
  Building, Mail, Phone, MapPin, Globe, Image as ImageIcon,
  Plus, Trash2, Loader2, Check, AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function WelcomeModal({ isOpen, onClose, onStart, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const fileInputRef = useRef(null);
  
  // Form data for each step
  const [schoolData, setSchoolData] = useState({
    school_name: '',
    school_motto: '',
    school_email: '',
    school_phone: '',
    school_address: '',
    school_logo: null,
    logoPreview: null
  });
  
  const [academicData, setAcademicData] = useState({
    academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    term_name: 'Term 1',
    start_date: '',
    end_date: ''
  });
  
  const [classesData, setClassesData] = useState([
    { name: '', capacity: 40 }
  ]);
  
  const [subjectsData, setSubjectsData] = useState([
    { name: '', code: '' }
  ]);

  // Predefined templates
  const classTemplates = {
    primary: ['Nursery 1', 'Nursery 2', 'KG 1', 'KG 2', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6'],
    jhs: ['JHS 1', 'JHS 2', 'JHS 3'],
    shs: ['SHS 1', 'SHS 2', 'SHS 3'],
    all: ['Nursery 1', 'Nursery 2', 'KG 1', 'KG 2', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'JHS 1', 'JHS 2', 'JHS 3']
  };
  
  const subjectTemplates = {
    primary: [
      { name: 'English Language', code: 'ENG' },
      { name: 'Mathematics', code: 'MATH' },
      { name: 'Science', code: 'SCI' },
      { name: 'Social Studies', code: 'SS' },
      { name: 'Creative Arts', code: 'CA' },
      { name: 'Religious & Moral Education', code: 'RME' },
      { name: 'Ghanaian Language', code: 'GHL' },
      { name: 'French', code: 'FRE' },
      { name: 'ICT', code: 'ICT' },
      { name: 'Physical Education', code: 'PE' }
    ],
    jhs: [
      { name: 'English Language', code: 'ENG' },
      { name: 'Mathematics', code: 'MATH' },
      { name: 'Integrated Science', code: 'ISCI' },
      { name: 'Social Studies', code: 'SS' },
      { name: 'Basic Design & Technology', code: 'BDT' },
      { name: 'Religious & Moral Education', code: 'RME' },
      { name: 'French', code: 'FRE' },
      { name: 'ICT', code: 'ICT' },
      { name: 'Ghanaian Language', code: 'GHL' },
      { name: 'Physical Education', code: 'PE' }
    ]
  };

  const steps = [
    { id: 'welcome', title: 'Welcome', icon: Sparkles, description: 'Get started with your school' },
    { id: 'school', title: 'School Info', icon: Building, description: 'Basic school information' },
    { id: 'academic', title: 'Academic Year', icon: Calendar, description: 'Set up your first term' },
    { id: 'classes', title: 'Classes', icon: School, description: 'Create your classes' },
    { id: 'subjects', title: 'Subjects', icon: BookOpen, description: 'Add subjects taught' },
    { id: 'complete', title: 'Complete', icon: CheckCircle, description: 'You\'re all set!' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchExistingData();
    }
  }, [isOpen]);

  const fetchExistingData = async () => {
    try {
      setLoading(true);
      const [settingsRes, classesRes, subjectsRes, termsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/system_config.php`).catch(() => null),
        axios.get(`${API_BASE_URL}/classes.php`).catch(() => null),
        axios.get(`${API_BASE_URL}/subjects.php`).catch(() => null),
        axios.get(`${API_BASE_URL}/terms.php`).catch(() => null)
      ]);
      
      const newCompletedSteps = new Set();
      
      if (settingsRes?.data?.config) {
        const config = settingsRes.data.config;
        setSchoolData(prev => ({
          ...prev,
          school_name: config.school_name || '',
          school_motto: config.school_motto || '',
          school_email: config.school_email || '',
          school_phone: config.school_phone || '',
          school_address: config.school_address || '',
          logoPreview: config.school_logo || null
        }));
        // Mark school info as complete if school_name exists
        if (config.school_name && config.school_name.trim()) {
          newCompletedSteps.add(1);
        }
        // Mark academic year as complete if set
        if (config.current_academic_year && config.current_academic_year.trim()) {
          setAcademicData(prev => ({
            ...prev,
            academic_year: config.current_academic_year
          }));
          newCompletedSteps.add(2);
        }
      }
      
      // Check terms
      if (termsRes?.data?.terms?.length > 0) {
        newCompletedSteps.add(2);
      }
      
      if (classesRes?.data?.classes?.length > 0) {
        newCompletedSteps.add(3);
      }
      
      if (subjectsRes?.data?.subjects?.length > 0) {
        newCompletedSteps.add(4);
      }
      
      setCompletedSteps(newCompletedSteps);
      
      // If all steps are complete, close the wizard
      if (newCompletedSteps.has(1) && newCompletedSteps.has(2) && newCompletedSteps.has(3) && newCompletedSteps.has(4)) {
        onClose?.();
      }
    } catch (error) {
      console.error('Error fetching existing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo must be less than 2MB');
        return;
      }
      setSchoolData(prev => ({
        ...prev,
        school_logo: file,
        logoPreview: URL.createObjectURL(file)
      }));
    }
  };

  const saveSchoolInfo = async () => {
    setSaving(true);
    try {
      // Upload logo if exists
      let logoUrl = null;
      if (schoolData.school_logo instanceof File) {
        const formData = new FormData();
        formData.append('logo', schoolData.school_logo);
        const uploadRes = await axios.post(`${API_BASE_URL}/upload_logo.php`, formData);
        if (uploadRes.data.success) {
          logoUrl = uploadRes.data.logo_url;
        }
      }
      
      // Save school settings (don't include logo - it's saved by upload_logo.php)
      const configData = {
        school_name: schoolData.school_name,
        school_motto: schoolData.school_motto,
        school_email: schoolData.school_email,
        school_phone: schoolData.school_phone,
        school_address: schoolData.school_address
      };
      
      // Only include logo if it's a valid URL (not a blob URL)
      if (logoUrl) {
        configData.school_logo = logoUrl;
      } else if (schoolData.logoPreview && !schoolData.logoPreview.startsWith('blob:')) {
        configData.school_logo = schoolData.logoPreview;
      }
      
      await axios.post(`${API_BASE_URL}/system_config.php`, configData);
      
      setCompletedSteps(prev => new Set([...prev, 1]));
      return true;
    } catch (error) {
      console.error('Error saving school info:', error);
      alert('Failed to save school information');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveAcademicYear = async () => {
    setSaving(true);
    try {
      // Extract year from academic_year string (e.g., "2024-2025" -> 2024)
      const yearMatch = academicData.academic_year.match(/\d{4}/);
      const academicYear = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
      
      // Extract term number from term_name (e.g., "Term 1" -> 1)
      const termMatch = academicData.term_name.match(/\d/);
      const termNumber = termMatch ? parseInt(termMatch[0]) : 1;
      
      // Save academic year to system_config
      await axios.post(`${API_BASE_URL}/system_config.php`, {
        current_academic_year: academicData.academic_year,
        current_term: termNumber.toString()
      });
      
      // Create term in academic_terms table
      await axios.post(`${API_BASE_URL}/terms.php`, {
        term_name: academicData.term_name,
        term_code: `T${termNumber}-${academicYear}`,
        academic_year: academicYear,
        term_number: termNumber,
        start_date: academicData.start_date || null,
        end_date: academicData.end_date || null,
        is_active: 1,
        status: 'active'
      });
      
      setCompletedSteps(prev => new Set([...prev, 2]));
      return true;
    } catch (error) {
      console.error('Error saving academic year:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to save academic year';
      alert(`❌ Error: ${errorMsg}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveClasses = async () => {
    setSaving(true);
    try {
      const validClasses = classesData.filter(c => c.name.trim());
      for (const cls of validClasses) {
        // Generate class_code from name (e.g., "Class 1" -> "CLS1")
        const classCode = cls.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
        
        // Determine level based on class name
        let level = 'primary';
        const nameLower = cls.name.toLowerCase();
        if (nameLower.includes('nursery') || nameLower.includes('kg') || nameLower.includes('kindergarten')) {
          level = 'creche';
        } else if (nameLower.includes('jhs') || nameLower.includes('junior')) {
          level = 'jhs';
        } else if (nameLower.includes('shs') || nameLower.includes('senior')) {
          level = 'shs';
        }
        
        await axios.post(`${API_BASE_URL}/classes.php`, {
          class_name: cls.name,
          class_code: classCode,
          level: level,
          capacity: cls.capacity || 40,
          status: 'active'
        });
      }
      setCompletedSteps(prev => new Set([...prev, 3]));
      return true;
    } catch (error) {
      console.error('Error saving classes:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to save classes';
      alert(`❌ Error: ${errorMsg}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveSubjects = async () => {
    setSaving(true);
    try {
      const validSubjects = subjectsData.filter(s => s.name.trim());
      for (const subj of validSubjects) {
        await axios.post(`${API_BASE_URL}/subjects.php`, {
          subject_name: subj.name,
          subject_code: subj.code || subj.name.substring(0, 3).toUpperCase(),
          status: 'active'
        });
      }
      setCompletedSteps(prev => new Set([...prev, 4]));
      return true;
    } catch (error) {
      console.error('Error saving subjects:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to save subjects';
      alert(`❌ Error: ${errorMsg}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    let success = true;
    
    // Save data for current step
    if (currentStep === 1) {
      success = await saveSchoolInfo();
    } else if (currentStep === 2) {
      success = await saveAcademicYear();
    } else if (currentStep === 3) {
      success = await saveClasses();
    } else if (currentStep === 4) {
      success = await saveSubjects();
    }
    
    if (success && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    // Update onboarding status
    axios.post(`${API_BASE_URL}/onboarding.php?action=update_system`, {
      school_setup_completed: completedSteps.has(1),
      academic_config_completed: completedSteps.has(2),
      classes_created: completedSteps.has(3),
      subjects_created: completedSteps.has(4),
      onboarding_completed: true
    }).catch(console.error);
    
    onStart();
  };

  const applyClassTemplate = (template) => {
    const classes = classTemplates[template].map(name => ({ name, capacity: 40 }));
    setClassesData(classes);
  };

  const applySubjectTemplate = (template) => {
    setSubjectsData(subjectTemplates[template]);
  };

  const addClass = () => {
    setClassesData([...classesData, { name: '', capacity: 40 }]);
  };

  const removeClass = (index) => {
    setClassesData(classesData.filter((_, i) => i !== index));
  };

  const addSubject = () => {
    setSubjectsData([...subjectsData, { name: '', code: '' }]);
  };

  const removeSubject = (index) => {
    setSubjectsData(subjectsData.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Your School Management System!
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
              Let's set up your school in just a few minutes. We'll guide you through the essential steps to get started.
            </p>
            
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
              {[
                { icon: Building, text: 'Add school information' },
                { icon: Calendar, text: 'Set up academic year' },
                { icon: School, text: 'Create classes' },
                { icon: BookOpen, text: 'Add subjects' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <item.icon className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
            
            <p className="text-sm text-gray-500 mt-8">
              ⏱️ Estimated time: <strong>3-5 minutes</strong>
            </p>
          </div>
        );

      case 1: // School Info
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">School Information</h2>
              <p className="text-gray-600">Tell us about your school</p>
            </div>
            
            {/* Logo Upload */}
            <div className="flex justify-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
              >
                {schoolData.logoPreview ? (
                  <img src={schoolData.logoPreview} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-xs text-gray-500">Upload Logo</span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
                <input
                  type="text"
                  value={schoolData.school_name}
                  onChange={(e) => setSchoolData({...schoolData, school_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Excellence Academy"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">School Motto</label>
                <input
                  type="text"
                  value={schoolData.school_motto}
                  onChange={(e) => setSchoolData({...schoolData, school_motto: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Excellence Through Education"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={schoolData.school_email}
                  onChange={(e) => setSchoolData({...schoolData, school_email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="info@school.edu.gh"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={schoolData.school_phone}
                  onChange={(e) => setSchoolData({...schoolData, school_phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+233 XX XXX XXXX"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={schoolData.school_address}
                  onChange={(e) => setSchoolData({...schoolData, school_address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="123 School Street, Accra"
                />
              </div>
            </div>
          </div>
        );

      case 2: // Academic Year
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Academic Year Setup</h2>
              <p className="text-gray-600">Configure your current academic year and term</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={academicData.academic_year}
                  onChange={(e) => setAcademicData({...academicData, academic_year: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="2024-2025"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Term</label>
                <select
                  value={academicData.term_name}
                  onChange={(e) => setAcademicData({...academicData, term_name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={academicData.start_date}
                  onChange={(e) => setAcademicData({...academicData, start_date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={academicData.end_date}
                  onChange={(e) => setAcademicData({...academicData, end_date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> You can always add more terms later from the Academic Terms page.
              </p>
            </div>
          </div>
        );

      case 3: // Classes
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Classes</h2>
              <p className="text-gray-600">Add the classes/grades in your school</p>
            </div>
            
            {/* Quick Templates */}
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-sm text-gray-500">Quick add:</span>
              <button onClick={() => applyClassTemplate('primary')} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200">
                Primary School
              </button>
              <button onClick={() => applyClassTemplate('jhs')} className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200">
                JHS Only
              </button>
              <button onClick={() => applyClassTemplate('all')} className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200">
                Primary + JHS
              </button>
            </div>
            
            {/* Classes List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {classesData.map((cls, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={cls.name}
                    onChange={(e) => {
                      const updated = [...classesData];
                      updated[index].name = e.target.value;
                      setClassesData(updated);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Class name (e.g., Class 1)"
                  />
                  <input
                    type="number"
                    value={cls.capacity}
                    onChange={(e) => {
                      const updated = [...classesData];
                      updated[index].capacity = parseInt(e.target.value) || 40;
                      setClassesData(updated);
                    }}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Cap"
                  />
                  {classesData.length > 1 && (
                    <button onClick={() => removeClass(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button onClick={addClass} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Another Class
            </button>
          </div>
        );

      case 4: // Subjects
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Subjects</h2>
              <p className="text-gray-600">Define the subjects taught in your school</p>
            </div>
            
            {/* Quick Templates */}
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-sm text-gray-500">Quick add:</span>
              <button onClick={() => applySubjectTemplate('primary')} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200">
                Primary Subjects
              </button>
              <button onClick={() => applySubjectTemplate('jhs')} className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200">
                JHS Subjects
              </button>
            </div>
            
            {/* Subjects List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {subjectsData.map((subj, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={subj.name}
                    onChange={(e) => {
                      const updated = [...subjectsData];
                      updated[index].name = e.target.value;
                      setSubjectsData(updated);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Subject name"
                  />
                  <input
                    type="text"
                    value={subj.code}
                    onChange={(e) => {
                      const updated = [...subjectsData];
                      updated[index].code = e.target.value.toUpperCase();
                      setSubjectsData(updated);
                    }}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Code"
                    maxLength={5}
                  />
                  {subjectsData.length > 1 && (
                    <button onClick={() => removeSubject(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button onClick={addSubject} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Another Subject
            </button>
          </div>
        );

      case 5: // Complete
        return (
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              🎉 You're All Set!
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto">
              Your school management system is ready to use. You can now start adding students, teachers, and managing your school.
            </p>
            
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {[
                { label: 'School Info', done: completedSteps.has(1) },
                { label: 'Academic Year', done: completedSteps.has(2) },
                { label: 'Classes', done: completedSteps.has(3) },
                { label: 'Subjects', done: completedSteps.has(4) }
              ].map((item, i) => (
                <div key={i} className={`flex items-center gap-2 p-3 rounded-lg ${item.done ? 'bg-green-50' : 'bg-gray-50'}`}>
                  {item.done ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                  )}
                  <span className={item.done ? 'text-green-700' : 'text-gray-500'}>{item.label}</span>
                </div>
              ))}
            </div>
            
            <p className="text-sm text-gray-500 mt-8">
              You can always update these settings later from the System Configuration page.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header - Fixed */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6" />
              <span className="font-semibold">Setup Wizard</span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Step Indicators */}
          <div className="flex items-center justify-between mt-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${index < currentStep ? 'bg-white text-blue-600' : 
                    index === currentStep ? 'bg-white text-blue-600 ring-4 ring-white/30' : 
                    'bg-white/20 text-white/60'}
                `}>
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-1 mx-1 rounded ${index < currentStep ? 'bg-white' : 'bg-white/20'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content - Scrollable if needed */}
        <div className="flex-1 p-6 overflow-y-auto" style={{ minHeight: '300px' }}>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            renderStepContent()
          )}
        </div>

        {/* Footer - Fixed */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl flex items-center justify-between flex-shrink-0">
          <div>
            {currentStep > 0 && currentStep < steps.length - 1 && (
              <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {currentStep > 0 && currentStep < steps.length - 1 && (
              <button onClick={handleSkipStep} className="text-gray-500 hover:text-gray-700">
                Skip this step
              </button>
            )}
            
            {currentStep === 0 && (
              <button onClick={onSkip} className="text-gray-500 hover:text-gray-700">
                I'll do this later
              </button>
            )}
            
            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={saving || (currentStep === 1 && !schoolData.school_name)}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    {currentStep === 0 ? "Let's Start" : 'Continue'} <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 flex items-center gap-2"
              >
                <Rocket className="w-4 h-4" /> Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
