import { useState, useEffect, useRef } from 'react';
import { 
  User, Lock, Bell, Save, Upload, Camera, Settings, Shield, 
  Loader2, Eye, EyeOff, Check, X, AlertTriangle, Moon, Sun,
  Globe, Smartphone, Monitor, LogOut, Clock, MapPin, Phone,
  Mail, Calendar, Award, RefreshCw, Download, Trash2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function TeacherSettings() {
  const { user, setUser, logout } = useAuthStore();
  const fileInputRef = useRef(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // Data State
  const [teacherData, setTeacherData] = useState(null);
  const [sessions, setSessions] = useState([]);

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
    region: '',
    qualification: '',
    specialization: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    homework_reminders: true,
    attendance_alerts: true,
    grade_notifications: true,
    message_notifications: true,
    system_updates: true
  });

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: localStorage.getItem('theme') || 'light',
    language: localStorage.getItem('language') || 'en',
    compact_mode: localStorage.getItem('compact_mode') === 'true'
  });

  const [securityInfo, setSecurityInfo] = useState({
    last_login: null,
    password_changed_at: null,
    two_factor_enabled: false
  });

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/teachers.php?user_id=${user?.id}`);
      const teachers = response.data.teachers || [];
      
      if (teachers.length > 0) {
        const teacher = teachers[0];
        setTeacherData(teacher);
        setProfileForm({
          first_name: teacher.first_name || '',
          last_name: teacher.last_name || '',
          email: teacher.email || user?.email || '',
          phone: teacher.phone || '',
          date_of_birth: teacher.date_of_birth || '',
          gender: teacher.gender || '',
          address: teacher.address || '',
          city: teacher.city || '',
          region: teacher.region || '',
          qualification: teacher.qualification || '',
          specialization: teacher.specialization || '',
          emergency_contact_name: teacher.emergency_contact_name || '',
          emergency_contact_phone: teacher.emergency_contact_phone || '',
          emergency_contact_relationship: teacher.emergency_contact_relationship || ''
        });
        
        // Load notification settings if stored
        if (teacher.notification_settings) {
          try {
            const settings = JSON.parse(teacher.notification_settings);
            setNotificationSettings(prev => ({ ...prev, ...settings }));
          } catch (e) {}
        }
        
        // Set security info
        setSecurityInfo({
          last_login: user?.last_login || new Date().toISOString(),
          password_changed_at: teacher.password_changed_at || null,
          two_factor_enabled: teacher.two_factor_enabled || false
        });
      }
      
      // Fetch active sessions from login history
      try {
        const sessionsRes = await axios.get(`${API_BASE_URL}/auth.php?action=sessions&user_id=${user?.id}`);
        setSessions(sessionsRes.data.sessions || []);
      } catch (e) {
        // If sessions API not available, show current session only
        setSessions([
          { id: 1, device: 'Current Session', location: 'Unknown', last_active: new Date().toISOString(), current: true }
        ]);
      }
      
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!profileForm.first_name || !profileForm.last_name) {
      setError('First name and last name are required');
      return;
    }
    if (!profileForm.email || !/\S+@\S+\.\S+/.test(profileForm.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    try {
      setSaving(true);
      await axios.put(`${API_BASE_URL}/teachers.php?id=${teacherData.id}`, profileForm);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      fetchTeacherData();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      
      // Call password change API
      const response = await axios.post(`${API_BASE_URL}/auth.php`, {
        action: 'change_password',
        user_id: user?.id,
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      
      if (response.data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        setError(response.data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Failed to change password. Please check your current password.');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      setSaving(true);
      
      // Save notification settings to teacher record
      await axios.put(`${API_BASE_URL}/teachers.php?id=${teacherData.id}`, {
        notification_settings: JSON.stringify(notificationSettings)
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error updating notifications:', error);
      setError('Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleAppearanceUpdate = () => {
    // Save to localStorage
    localStorage.setItem('theme', appearanceSettings.theme);
    localStorage.setItem('language', appearanceSettings.language);
    localStorage.setItem('compact_mode', appearanceSettings.compact_mode.toString());
    
    // Apply theme
    if (appearanceSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    if (!fileInputRef.current?.files[0]) return;
    
    const file = fileInputRef.current.files[0];
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('teacher_id', teacherData.id);

    try {
      setSaving(true);
      
      const response = await axios.post(`${API_BASE_URL}/upload_photo.php`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        setPhotoPreview(null);
        fetchTeacherData();
      } else {
        setError(response.data.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    try {
      // In a real app, this would call an API to revoke the session
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (error) {
      console.error('Error revoking session:', error);
    }
  };

  const handleExportData = async () => {
    try {
      // Create a data export
      const exportData = {
        profile: profileForm,
        notifications: notificationSettings,
        exported_at: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teacher_data_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { strength, label: 'Weak', color: 'bg-red-500' };
    if (strength <= 3) return { strength, label: 'Medium', color: 'bg-yellow-500' };
    return { strength, label: 'Strong', color: 'bg-green-500' };
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Monitor }
  ];

  const passwordStrength = getPasswordStrength(passwordForm.new_password);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="text-blue-600" />
            Settings
          </h1>
          <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
        </div>
        <button onClick={fetchTeacherData} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Message */}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          Changes saved successfully!
        </div>
      )}

      {/* Tabs */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2 border-b pb-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card p-6">
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            {/* Photo Upload */}
            <div className="flex items-center gap-6 pb-6 border-b">
              <div className="relative">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
                  />
                ) : teacherData?.photo ? (
                  <img
                    src={`${API_BASE_URL.replace('/api', '')}/uploads/${teacherData.photo}`}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600">
                      {profileForm.first_name?.[0]}{profileForm.last_name?.[0]}
                    </span>
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Profile Photo</h3>
                <p className="text-sm text-gray-600">Click the camera icon to select a photo</p>
                {photoPreview && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={handlePhotoUpload}
                      disabled={saving}
                      className="btn btn-primary text-sm flex items-center gap-1"
                    >
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => { setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="btn bg-gray-200 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name *</label>
                  <input
                    type="text"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={profileForm.date_of_birth}
                    onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Gender</label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Address</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Street Address</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    value={profileForm.city}
                    onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Region</label>
                  <input
                    type="text"
                    value={profileForm.region}
                    onChange={(e) => setProfileForm({ ...profileForm, region: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Professional Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Qualification</label>
                  <input
                    type="text"
                    value={profileForm.qualification}
                    onChange={(e) => setProfileForm({ ...profileForm, qualification: e.target.value })}
                    className="input"
                    placeholder="e.g., B.Ed, M.Ed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Specialization</label>
                  <input
                    type="text"
                    value={profileForm.specialization}
                    onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                    className="input"
                    placeholder="e.g., Mathematics, Science"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-red-600" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Name</label>
                  <input
                    type="text"
                    value={profileForm.emergency_contact_name}
                    onChange={(e) => setProfileForm({ ...profileForm, emergency_contact_name: e.target.value })}
                    className="input"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    value={profileForm.emergency_contact_phone}
                    onChange={(e) => setProfileForm({ ...profileForm, emergency_contact_phone: e.target.value })}
                    className="input"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Relationship</label>
                  <select
                    value={profileForm.emergency_contact_relationship}
                    onChange={(e) => setProfileForm({ ...profileForm, emergency_contact_relationship: e.target.value })}
                    className="input"
                  >
                    <option value="">Select relationship</option>
                    <option value="spouse">Spouse</option>
                    <option value="parent">Parent</option>
                    <option value="sibling">Sibling</option>
                    <option value="child">Child</option>
                    <option value="friend">Friend</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Password Change */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" />
              Change Password
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password *</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    className="input pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">New Password *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="input pr-10"
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordForm.new_password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${passwordStrength.color} transition-all`}
                          style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs ${passwordStrength.color.replace('bg-', 'text-')}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Use 8+ characters with uppercase, numbers, and symbols</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                  className="input"
                  required
                />
                {passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
              <button
                type="submit"
                disabled={saving || (passwordForm.new_password !== passwordForm.confirm_password)}
                className="btn btn-primary flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Security Info */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Account Security
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Last Login</p>
                    <p className="text-sm text-gray-600">
                      {securityInfo.last_login ? new Date(securityInfo.last_login).toLocaleString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium">Password Last Changed</p>
                    <p className="text-sm text-gray-600">
                      {securityInfo.password_changed_at ? new Date(securityInfo.password_changed_at).toLocaleDateString() : 'Never changed'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-purple-600" />
              Active Sessions
            </h3>
            <div className="space-y-3">
              {sessions.map(session => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{session.device}</p>
                      <p className="text-sm text-gray-600">
                        {session.location} • {session.current ? 'Current session' : `Last active: ${new Date(session.last_active).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="btn bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Data Export */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              Data & Privacy
            </h3>
            <p className="text-gray-600 mb-4">Download a copy of your personal data</p>
            <button onClick={handleExportData} className="btn bg-gray-200 hover:bg-gray-300 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export My Data
            </button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Notification Preferences
              </h3>
              <div className="space-y-4">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b">
                    <div>
                      <p className="font-medium text-gray-900">
                        {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {key === 'email_notifications' && 'Receive email notifications'}
                        {key === 'sms_notifications' && 'Receive SMS notifications'}
                        {key === 'homework_reminders' && 'Get reminded about homework deadlines'}
                        {key === 'attendance_alerts' && 'Alerts for attendance issues'}
                        {key === 'grade_notifications' && 'Notifications when grades are updated'}
                        {key === 'message_notifications' && 'New message alerts'}
                        {key === 'system_updates' && 'System announcements and updates'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, [key]: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleNotificationUpdate}
              disabled={saving}
              className="btn btn-primary flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      )}

      {/* Appearance Tab */}
      {activeTab === 'appearance' && (
        <div className="card p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-blue-600" />
                Appearance Settings
              </h3>
              
              {/* Theme */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">Theme</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setAppearanceSettings({ ...appearanceSettings, theme: 'light' })}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                      appearanceSettings.theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <Sun className="w-5 h-5 text-yellow-500" />
                    <span>Light</span>
                  </button>
                  <button
                    onClick={() => setAppearanceSettings({ ...appearanceSettings, theme: 'dark' })}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                      appearanceSettings.theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <Moon className="w-5 h-5 text-gray-600" />
                    <span>Dark</span>
                  </button>
                  <button
                    onClick={() => setAppearanceSettings({ ...appearanceSettings, theme: 'system' })}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                      appearanceSettings.theme === 'system' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <Monitor className="w-5 h-5 text-gray-600" />
                    <span>System</span>
                  </button>
                </div>
              </div>

              {/* Language */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  value={appearanceSettings.language}
                  onChange={(e) => setAppearanceSettings({ ...appearanceSettings, language: e.target.value })}
                  className="input max-w-xs"
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                </select>
              </div>

              {/* Compact Mode */}
              <div className="flex items-center justify-between py-3 border-t">
                <div>
                  <p className="font-medium">Compact Mode</p>
                  <p className="text-sm text-gray-600">Use smaller spacing and fonts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={appearanceSettings.compact_mode}
                    onChange={(e) => setAppearanceSettings({ ...appearanceSettings, compact_mode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <button
              onClick={handleAppearanceUpdate}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
