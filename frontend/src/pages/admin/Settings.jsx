import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, School, DollarSign, Calendar, Mail, Phone, MapPin, Globe, Building, Upload, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  
  const [settings, setSettings] = useState({
    // General Settings
    school_name: '',
    school_abbreviation: '',
    school_code: '',
    school_motto: '',
    school_email: '',
    school_phone: '',
    school_address: '',
    school_website: '',
    school_logo: '',
    school_tagline: '',
    
    // Academic Settings
    current_academic_year: '',
    current_term: '',
    grading_system: 'percentage',
    pass_mark: '50',
    
    // Finance Settings
    currency: 'GHS',
    currency_symbol: '₵',
    tax_rate: '0',
    late_payment_fee: '0',
    
    // System Settings
    timezone: 'Africa/Accra',
    date_format: 'Y-m-d',
    time_format: '24',
    language: 'en',
    
    // Notification Settings
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    
    // Security Settings
    session_timeout: '30',
    password_min_length: '8',
    require_password_change: false,
    two_factor_auth: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    // Update logo preview when settings load
    if (settings.school_logo) {
      setLogoPreview(settings.school_logo);
    }
  }, [settings.school_logo]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://eea.mcaforo.com/backend/api/settings.php');
      if (response.data.settings) {
        setSettings(prev => ({ ...prev, ...response.data.settings }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axios.post('https://eea.mcaforo.com/backend/api/settings.php', settings);
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Error saving settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB');
      return;
    }

    try {
      setUploading(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('logo', file);

      // Upload to server
      const response = await axios.post('https://eea.mcaforo.com/backend/api/upload_logo.php', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const logoUrl = response.data.logo_url;
        setSettings(prev => ({ ...prev, school_logo: logoUrl }));
        setLogoPreview(logoUrl);
        alert('Logo uploaded successfully!');
      } else {
        alert('Upload failed: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading logo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: School },
    { id: 'academic', label: 'Academic', icon: Calendar },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'system', label: 'System', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Mail },
    { id: 'security', label: 'Security', icon: Globe }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure system-wide settings and preferences</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary flex items-center gap-2">
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="card p-6">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">General Information</h2>
            
            {/* School Logo Upload */}
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  {settings.school_logo || logoPreview ? (
                    <img 
                      src={logoPreview || settings.school_logo} 
                      alt="School Logo"
                      className="w-32 h-32 object-contain rounded-lg border-2 border-gray-200 bg-white p-2"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">School Logo</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload your school logo. This will appear on login pages and throughout the system.
                    <br />
                    <span className="text-xs text-gray-500">Recommended: 200x200px, PNG or JPG, max 2MB</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <label className="btn btn-secondary cursor-pointer flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Upload Logo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    {settings.school_logo && (
                      <button
                        onClick={() => {
                          setSettings(prev => ({ ...prev, school_logo: '' }));
                          setLogoPreview(null);
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">School Name *</label>
                <input
                  type="text"
                  value={settings.school_name}
                  onChange={(e) => handleChange('school_name', e.target.value)}
                  className="input"
                  placeholder="e.g., St. Mary's School"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  School Abbreviation
                  <span className="text-xs text-gray-500 ml-2">(Auto-generated if empty)</span>
                </label>
                <input
                  type="text"
                  value={settings.school_abbreviation}
                  onChange={(e) => handleChange('school_abbreviation', e.target.value)}
                  className="input"
                  placeholder="e.g., SMS or STMARY"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">School Code</label>
                <input
                  type="text"
                  value={settings.school_code}
                  onChange={(e) => handleChange('school_code', e.target.value)}
                  className="input"
                  placeholder="e.g., SMS001"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">School Tagline</label>
                <input
                  type="text"
                  value={settings.school_tagline}
                  onChange={(e) => handleChange('school_tagline', e.target.value)}
                  className="input"
                  placeholder="e.g., Excellence in Education"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">School Motto</label>
                <input
                  type="text"
                  value={settings.school_motto}
                  onChange={(e) => handleChange('school_motto', e.target.value)}
                  className="input"
                  placeholder="e.g., Knowledge is Power"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={settings.school_email}
                  onChange={(e) => handleChange('school_email', e.target.value)}
                  className="input"
                  placeholder="info@school.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={settings.school_phone}
                  onChange={(e) => handleChange('school_phone', e.target.value)}
                  className="input"
                  placeholder="+233 XX XXX XXXX"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">Address</label>
                <textarea
                  value={settings.school_address}
                  onChange={(e) => handleChange('school_address', e.target.value)}
                  className="input"
                  rows="3"
                  placeholder="School physical address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <input
                  type="url"
                  value={settings.school_website}
                  onChange={(e) => handleChange('school_website', e.target.value)}
                  className="input"
                  placeholder="https://school.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* Academic Settings */}
        {activeTab === 'academic' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Academic Configuration</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Current Academic Year</label>
                <input
                  type="text"
                  value={settings.current_academic_year}
                  onChange={(e) => handleChange('current_academic_year', e.target.value)}
                  className="input"
                  placeholder="2024/2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Current Term</label>
                <select
                  value={settings.current_term}
                  onChange={(e) => handleChange('current_term', e.target.value)}
                  className="input"
                >
                  <option value="">Select Term</option>
                  <option value="1">Term 1</option>
                  <option value="2">Term 2</option>
                  <option value="3">Term 3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Grading System</label>
                <select
                  value={settings.grading_system}
                  onChange={(e) => handleChange('grading_system', e.target.value)}
                  className="input"
                >
                  <option value="percentage">Percentage (0-100)</option>
                  <option value="gpa">GPA (0-4.0)</option>
                  <option value="letter">Letter Grades (A-F)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Pass Mark</label>
                <input
                  type="number"
                  value={settings.pass_mark}
                  onChange={(e) => handleChange('pass_mark', e.target.value)}
                  className="input"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>
        )}

        {/* Finance Settings */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Finance Configuration</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="input"
                >
                  <option value="GHS">Ghana Cedi (GHS)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Currency Symbol</label>
                <input
                  type="text"
                  value={settings.currency_symbol}
                  onChange={(e) => handleChange('currency_symbol', e.target.value)}
                  className="input"
                  placeholder="₵"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  value={settings.tax_rate}
                  onChange={(e) => handleChange('tax_rate', e.target.value)}
                  className="input"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Late Payment Fee</label>
                <input
                  type="number"
                  value={settings.late_payment_fee}
                  onChange={(e) => handleChange('late_payment_fee', e.target.value)}
                  className="input"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        )}

        {/* System Settings */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">System Configuration</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleChange('timezone', e.target.value)}
                  className="input"
                >
                  <option value="Africa/Accra">Africa/Accra (GMT)</option>
                  <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date Format</label>
                <select
                  value={settings.date_format}
                  onChange={(e) => handleChange('date_format', e.target.value)}
                  className="input"
                >
                  <option value="Y-m-d">YYYY-MM-DD</option>
                  <option value="d/m/Y">DD/MM/YYYY</option>
                  <option value="m/d/Y">MM/DD/YYYY</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Time Format</label>
                <select
                  value={settings.time_format}
                  onChange={(e) => handleChange('time_format', e.target.value)}
                  className="input"
                >
                  <option value="24">24 Hour</option>
                  <option value="12">12 Hour (AM/PM)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="input"
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={settings.email_notifications}
                  onChange={(e) => handleChange('email_notifications', e.target.checked)}
                  className="rounded"
                />
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={settings.sms_notifications}
                  onChange={(e) => handleChange('sms_notifications', e.target.checked)}
                  className="rounded"
                />
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-600">Receive notifications via SMS</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={settings.push_notifications}
                  onChange={(e) => handleChange('push_notifications', e.target.checked)}
                  className="rounded"
                />
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-gray-600">Receive browser push notifications</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.session_timeout}
                  onChange={(e) => handleChange('session_timeout', e.target.value)}
                  className="input"
                  min="5"
                  max="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Minimum Password Length</label>
                <input
                  type="number"
                  value={settings.password_min_length}
                  onChange={(e) => handleChange('password_min_length', e.target.value)}
                  className="input"
                  min="6"
                  max="20"
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={settings.require_password_change}
                  onChange={(e) => handleChange('require_password_change', e.target.checked)}
                  className="rounded"
                />
                <div>
                  <p className="font-medium">Require Periodic Password Change</p>
                  <p className="text-sm text-gray-600">Force users to change password every 90 days</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={settings.two_factor_auth}
                  onChange={(e) => handleChange('two_factor_auth', e.target.checked)}
                  className="rounded"
                />
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Enable 2FA for enhanced security</p>
                </div>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
