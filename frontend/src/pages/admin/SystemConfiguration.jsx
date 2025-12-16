import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, MessageSquare, CreditCard, CheckCircle, AlertCircle, Eye, EyeOff,
  Building, Mail, Shield, Database, Globe, Bell, Link, Settings, Upload,
  Calendar, Clock, Palette, Lock, Users, Smartphone, HardDrive, Phone, Send, TestTube, Download, RefreshCw, AlertTriangle, Video, Cloud, ExternalLink, Plug
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useSettingsStore } from '../../store/settingsStore';

export default function SystemConfiguration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [testingConnection, setTestingConnection] = useState('');
  const logoInputRef = useRef(null);
  const [showSecrets, setShowSecrets] = useState({});
  const { refreshSettings, updateSettings } = useSettingsStore();
  
  const [config, setConfig] = useState({
    // General
    school_name: '', school_motto: '', school_address: '', school_phone: '', school_email: '', school_website: '', school_logo: '',
    current_academic_year: '', current_term: '1', terms_per_year: '3', grading_system: 'percentage',
    timezone: 'Africa/Accra', date_format: 'DD/MM/YYYY', time_format: '12h', currency: 'GHS', currency_symbol: '₵', language: 'en',
    primary_color: '#3B82F6', secondary_color: '#10B981', accent_color: '#F59E0B',
    // Payment
    hubtel_client_id: '', hubtel_client_secret: '', hubtel_merchant_number: '', hubtel_mode: 'sandbox', hubtel_enabled: false,
    paystack_public_key: '', paystack_secret_key: '', paystack_mode: 'test', paystack_enabled: false,
    stripe_public_key: '', stripe_secret_key: '', stripe_mode: 'test', stripe_enabled: false,
    bank_name: '', bank_account_name: '', bank_account_number: '', bank_branch: '', bank_transfer_enabled: false,
    // SMS
    mnotify_api_key: '', mnotify_sender_id: '', mnotify_enabled: false,
    arkesel_api_key: '', arkesel_sender_id: '', arkesel_enabled: false,
    twilio_account_sid: '', twilio_auth_token: '', twilio_phone_number: '', twilio_enabled: false,
    sms_payment_confirmation: true, sms_invoice_reminder: true, sms_enrollment_confirmation: true, sms_attendance_alert: false, sms_exam_results: true, sms_event_reminder: true,
    // Email
    smtp_host: '', smtp_port: '587', smtp_username: '', smtp_password: '', smtp_encryption: 'tls', smtp_from_name: '', smtp_from_email: '', smtp_enabled: false,
    email_payment_confirmation: true, email_invoice_reminder: true, email_enrollment_confirmation: true, email_attendance_alert: false, email_exam_results: true, email_newsletter: true,
    // Notifications
    whatsapp_api_url: '', whatsapp_api_token: '', whatsapp_phone_number_id: '', whatsapp_business_id: '', whatsapp_enabled: false,
    push_notifications_enabled: false, firebase_server_key: '',
    // Security
    password_min_length: 8, password_require_uppercase: true, password_require_lowercase: true, password_require_number: true, password_require_special: false, password_expiry_days: 90,
    session_timeout_minutes: 30, max_login_attempts: 5, lockout_duration_minutes: 15,
    two_factor_enabled: false, two_factor_method: 'email', ip_whitelist_enabled: false, ip_whitelist: '',
    // Backup
    auto_backup_enabled: false, backup_frequency: 'daily', backup_time: '02:00', backup_retention_days: 30, backup_location: 'local',
    maintenance_mode: false, maintenance_message: 'System is under maintenance. Please check back later.',
    // Debug
    debug_mode: false, debug_log_api_requests: false, debug_show_sql_errors: false,
    // Integrations
    google_calendar_enabled: false, google_client_id: '', google_client_secret: '',
    microsoft_365_enabled: false, microsoft_client_id: '', microsoft_client_secret: '',
    zoom_enabled: false, zoom_api_key: '', zoom_api_secret: '', google_meet_enabled: false
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'sms', label: 'SMS', icon: Phone },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'backup', label: 'Backup', icon: Database },
    { id: 'integrations', label: 'Integrations', icon: Link },
    { id: 'debug', label: 'Debug', icon: TestTube }
  ];

  useEffect(() => { fetchConfiguration(); }, []);

  const fetchConfiguration = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/system_config.php`);
      if (response.data.success && response.data.config) {
        // Convert null values to empty strings to avoid React warnings
        const cleanConfig = {};
        Object.keys(response.data.config).forEach(key => {
          cleanConfig[key] = response.data.config[key] ?? '';
        });
        setConfig(prev => ({ ...prev, ...cleanConfig }));
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await axios.post(`${API_BASE_URL}/system_config.php`, config);
      if (response.data.success) {
        // Immediately update the local store with new values
        updateSettings({
          school_name: config.school_name,
          school_logo: config.school_logo,
          school_tagline: config.school_motto || config.school_tagline,
          school_abbreviation: config.school_abbreviation || '',
          school_address: config.school_address,
          school_phone: config.school_phone,
          school_email: config.school_email
        });
        
        // Also refresh from API to ensure sync
        await refreshSettings();
        
        alert('✅ Configuration saved!');
      } else {
        alert('❌ Failed to save');
      }
    } catch (error) {
      alert('❌ Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (provider) => {
    setTestingConnection(provider);
    try {
      const response = await axios.post(`${API_BASE_URL}/system_config.php?action=test_${provider}`, config);
      alert(response.data.success ? `✅ ${provider} connection successful!` : `❌ ${provider} failed: ${response.data.message || 'Check credentials'}`);
    } catch (error) {
      alert(`❌ Connection test failed`);
    } finally {
      setTestingConnection('');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const response = await axios.post(`${API_BASE_URL}/upload_logo.php`, formData);
      if (response.data.success) {
        setConfig(prev => ({ ...prev, school_logo: response.data.logo_url }));
        alert('✅ Logo uploaded!');
        // Refresh global settings so sidebar updates immediately
        await refreshSettings();
      }
    } catch (error) {
      alert('❌ Failed to upload logo');
    }
  };

  const handleBackupNow = async () => {
    if (!confirm('Create a database backup now?')) return;
    try {
      setSaving(true);
      const response = await axios.post(`${API_BASE_URL}/system_config.php?action=backup`);
      alert(response.data.success ? '✅ Backup created: ' + response.data.filename : '❌ Backup failed');
    } catch (error) {
      alert('❌ Backup failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleSecret = (field) => setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));

  const SecretInput = ({ field, value, placeholder, label }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input type={showSecrets[field] ? 'text' : 'password'} value={value || ''} onChange={(e) => setConfig({ ...config, [field]: e.target.value })} placeholder={placeholder} className="input pr-10" />
        <button type="button" onClick={() => toggleSecret(field)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {showSecrets[field] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  const Toggle = ({ field, label, desc }) => (
    <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
      <div><p className="font-medium">{label}</p>{desc && <p className="text-sm text-gray-600">{desc}</p>}</div>
      <input type="checkbox" checked={config[field] || false} onChange={(e) => setConfig({ ...config, [field]: e.target.checked })} className="toggle" />
    </label>
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Settings className="w-7 h-7 text-blue-600" />System Configuration</h1>
          <p className="text-gray-600 mt-1">Configure all system settings, integrations, and preferences</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save All'}</button>
      </div>

      <div className="card">
        <div className="border-b overflow-x-auto">
          <div className="flex gap-1 px-4 min-w-max">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-3 px-4 border-b-2 font-medium flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                <tab.icon className="w-4 h-4" />{tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Building className="w-5 h-5 text-blue-600" />School Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">School Name *</label><input type="text" value={config.school_name} onChange={(e) => setConfig({...config, school_name: e.target.value})} className="input" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Motto</label><input type="text" value={config.school_motto} onChange={(e) => setConfig({...config, school_motto: e.target.value})} className="input" /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2">Address</label><textarea value={config.school_address} onChange={(e) => setConfig({...config, school_address: e.target.value})} className="input" rows={2} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Phone</label><input type="tel" value={config.school_phone} onChange={(e) => setConfig({...config, school_phone: e.target.value})} className="input" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Email</label><input type="email" value={config.school_email} onChange={(e) => setConfig({...config, school_email: e.target.value})} className="input" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Website</label><input type="url" value={config.school_website} onChange={(e) => setConfig({...config, school_website: e.target.value})} className="input" /></div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                    <div className="flex items-center gap-4">
                      {config.school_logo && <img src={config.school_logo} alt="Logo" className="w-16 h-16 object-contain border rounded" />}
                      <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                      <button onClick={() => logoInputRef.current?.click()} className="btn bg-gray-100 hover:bg-gray-200"><Upload className="w-4 h-4" />Upload</button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-green-600" />Academic Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label><input type="text" value={config.current_academic_year} onChange={(e) => setConfig({...config, current_academic_year: e.target.value})} placeholder="2024/2025" className="input" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Current Term</label><select value={config.current_term} onChange={(e) => setConfig({...config, current_term: e.target.value})} className="input"><option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Terms/Year</label><select value={config.terms_per_year} onChange={(e) => setConfig({...config, terms_per_year: e.target.value})} className="input"><option value="2">2</option><option value="3">3</option><option value="4">4</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Grading</label><select value={config.grading_system} onChange={(e) => setConfig({...config, grading_system: e.target.value})} className="input"><option value="percentage">Percentage</option><option value="letter">Letter</option><option value="gpa">GPA</option></select></div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-purple-600" />Locale Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label><select value={config.timezone} onChange={(e) => setConfig({...config, timezone: e.target.value})} className="input"><option value="Africa/Accra">Africa/Accra</option><option value="Africa/Lagos">Africa/Lagos</option><option value="Europe/London">Europe/London</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label><select value={config.date_format} onChange={(e) => setConfig({...config, date_format: e.target.value})} className="input"><option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="YYYY-MM-DD">YYYY-MM-DD</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Currency</label><select value={config.currency} onChange={(e) => setConfig({...config, currency: e.target.value})} className="input"><option value="GHS">GHS</option><option value="NGN">NGN</option><option value="USD">USD</option></select></div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-pink-600" />Branding</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label><div className="flex gap-2"><input type="color" value={config.primary_color} onChange={(e) => setConfig({...config, primary_color: e.target.value})} className="w-12 h-10 rounded" /><input type="text" value={config.primary_color} onChange={(e) => setConfig({...config, primary_color: e.target.value})} className="input flex-1" /></div></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label><div className="flex gap-2"><input type="color" value={config.secondary_color} onChange={(e) => setConfig({...config, secondary_color: e.target.value})} className="w-12 h-10 rounded" /><input type="text" value={config.secondary_color} onChange={(e) => setConfig({...config, secondary_color: e.target.value})} className="input flex-1" /></div></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label><div className="flex gap-2"><input type="color" value={config.accent_color} onChange={(e) => setConfig({...config, accent_color: e.target.value})} className="w-12 h-10 rounded" /><input type="text" value={config.accent_color} onChange={(e) => setConfig({...config, accent_color: e.target.value})} className="input flex-1" /></div></div>
                </div>
              </div>
            </div>
          )}

          {/* PAYMENT TAB */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              {/* Hubtel */}
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"><CreditCard className="w-5 h-5 text-orange-600" /></div><div><h3 className="font-semibold">Hubtel</h3><p className="text-sm text-gray-600">Mobile Money & Cards</p></div></div>
                  <input type="checkbox" checked={config.hubtel_enabled} onChange={(e) => setConfig({...config, hubtel_enabled: e.target.checked})} className="toggle" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Client ID</label><input type="text" value={config.hubtel_client_id} onChange={(e) => setConfig({...config, hubtel_client_id: e.target.value})} className="input" /></div>
                  <SecretInput field="hubtel_client_secret" value={config.hubtel_client_secret} placeholder="Client Secret" label="Client Secret" />
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Merchant Number</label><input type="text" value={config.hubtel_merchant_number} onChange={(e) => setConfig({...config, hubtel_merchant_number: e.target.value})} className="input" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Mode</label><select value={config.hubtel_mode} onChange={(e) => setConfig({...config, hubtel_mode: e.target.value})} className="input"><option value="sandbox">Sandbox</option><option value="live">Live</option></select></div>
                </div>
                <button onClick={() => handleTestConnection('hubtel')} disabled={testingConnection === 'hubtel'} className="btn bg-green-600 hover:bg-green-700 text-white mt-4"><TestTube className="w-4 h-4" />{testingConnection === 'hubtel' ? 'Testing...' : 'Test'}</button>
              </div>
              {/* PayStack */}
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><CreditCard className="w-5 h-5 text-blue-600" /></div><div><h3 className="font-semibold">PayStack</h3><p className="text-sm text-gray-600">Card & Mobile Money</p></div></div>
                  <input type="checkbox" checked={config.paystack_enabled} onChange={(e) => setConfig({...config, paystack_enabled: e.target.checked})} className="toggle" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Public Key</label><input type="text" value={config.paystack_public_key} onChange={(e) => setConfig({...config, paystack_public_key: e.target.value})} className="input" /></div>
                  <SecretInput field="paystack_secret_key" value={config.paystack_secret_key} placeholder="Secret Key" label="Secret Key" />
                </div>
              </div>
              {/* Stripe */}
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><CreditCard className="w-5 h-5 text-purple-600" /></div><div><h3 className="font-semibold">Stripe</h3><p className="text-sm text-gray-600">International Payments</p></div></div>
                  <input type="checkbox" checked={config.stripe_enabled} onChange={(e) => setConfig({...config, stripe_enabled: e.target.checked})} className="toggle" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Publishable Key</label><input type="text" value={config.stripe_public_key} onChange={(e) => setConfig({...config, stripe_public_key: e.target.value})} className="input" /></div>
                  <SecretInput field="stripe_secret_key" value={config.stripe_secret_key} placeholder="Secret Key" label="Secret Key" />
                </div>
              </div>
              {/* Bank Transfer */}
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Building className="w-5 h-5 text-green-600" /></div><div><h3 className="font-semibold">Bank Transfer</h3><p className="text-sm text-gray-600">Manual Payment</p></div></div>
                  <input type="checkbox" checked={config.bank_transfer_enabled} onChange={(e) => setConfig({...config, bank_transfer_enabled: e.target.checked})} className="toggle" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label><input type="text" value={config.bank_name} onChange={(e) => setConfig({...config, bank_name: e.target.value})} className="input" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label><input type="text" value={config.bank_account_name} onChange={(e) => setConfig({...config, bank_account_name: e.target.value})} className="input" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label><input type="text" value={config.bank_account_number} onChange={(e) => setConfig({...config, bank_account_number: e.target.value})} className="input" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Branch</label><input type="text" value={config.bank_branch} onChange={(e) => setConfig({...config, bank_branch: e.target.value})} className="input" /></div>
                </div>
              </div>
            </div>
          )}

          {/* SMS TAB */}
          {activeTab === 'sms' && (
            <div className="space-y-6">
              {/* mNotify */}
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"><Phone className="w-5 h-5 text-yellow-600" /></div><div><h3 className="font-semibold">mNotify</h3><p className="text-sm text-gray-600">Ghana SMS</p></div></div>
                  <input type="checkbox" checked={config.mnotify_enabled} onChange={(e) => setConfig({...config, mnotify_enabled: e.target.checked})} className="toggle" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SecretInput field="mnotify_api_key" value={config.mnotify_api_key} placeholder="API Key" label="API Key" />
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Sender ID</label><input type="text" value={config.mnotify_sender_id} onChange={(e) => setConfig({...config, mnotify_sender_id: e.target.value})} maxLength={11} className="input" /></div>
                </div>
                <button onClick={() => handleTestConnection('mnotify')} disabled={testingConnection === 'mnotify'} className="btn bg-green-600 hover:bg-green-700 text-white mt-4"><TestTube className="w-4 h-4" />Test</button>
              </div>
              {/* Arkesel */}
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><Phone className="w-5 h-5 text-red-600" /></div><div><h3 className="font-semibold">Arkesel</h3><p className="text-sm text-gray-600">Ghana SMS</p></div></div>
                  <input type="checkbox" checked={config.arkesel_enabled} onChange={(e) => setConfig({...config, arkesel_enabled: e.target.checked})} className="toggle" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SecretInput field="arkesel_api_key" value={config.arkesel_api_key} placeholder="API Key" label="API Key" />
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Sender ID</label><input type="text" value={config.arkesel_sender_id} onChange={(e) => setConfig({...config, arkesel_sender_id: e.target.value})} maxLength={11} className="input" /></div>
                </div>
              </div>
              {/* Twilio */}
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center"><Phone className="w-5 h-5 text-pink-600" /></div><div><h3 className="font-semibold">Twilio</h3><p className="text-sm text-gray-600">International SMS</p></div></div>
                  <input type="checkbox" checked={config.twilio_enabled} onChange={(e) => setConfig({...config, twilio_enabled: e.target.checked})} className="toggle" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Account SID</label><input type="text" value={config.twilio_account_sid} onChange={(e) => setConfig({...config, twilio_account_sid: e.target.value})} className="input" /></div>
                  <SecretInput field="twilio_auth_token" value={config.twilio_auth_token} placeholder="Auth Token" label="Auth Token" />
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label><input type="text" value={config.twilio_phone_number} onChange={(e) => setConfig({...config, twilio_phone_number: e.target.value})} className="input" /></div>
                </div>
              </div>
              {/* SMS Triggers */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">SMS Triggers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Toggle field="sms_payment_confirmation" label="Payment Confirmation" desc="SMS on payment" />
                  <Toggle field="sms_invoice_reminder" label="Invoice Reminder" desc="SMS for unpaid invoices" />
                  <Toggle field="sms_enrollment_confirmation" label="Enrollment" desc="SMS on enrollment" />
                  <Toggle field="sms_attendance_alert" label="Attendance Alert" desc="SMS on absence" />
                  <Toggle field="sms_exam_results" label="Exam Results" desc="SMS on results" />
                  <Toggle field="sms_event_reminder" label="Event Reminder" desc="SMS for events" />
                </div>
              </div>
            </div>
          )}

          {/* EMAIL TAB */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Mail className="w-5 h-5 text-blue-600" /></div><div><h3 className="font-semibold">SMTP Configuration</h3><p className="text-sm text-gray-600">Email server settings</p></div></div>
                  <input type="checkbox" checked={config.smtp_enabled} onChange={(e) => setConfig({...config, smtp_enabled: e.target.checked})} className="toggle" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label><input type="text" value={config.smtp_host} onChange={(e) => setConfig({...config, smtp_host: e.target.value})} placeholder="smtp.gmail.com" className="input" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Port</label><input type="text" value={config.smtp_port} onChange={(e) => setConfig({...config, smtp_port: e.target.value})} className="input" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Encryption</label><select value={config.smtp_encryption} onChange={(e) => setConfig({...config, smtp_encryption: e.target.value})} className="input"><option value="tls">TLS</option><option value="ssl">SSL</option><option value="none">None</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Username</label><input type="text" value={config.smtp_username} onChange={(e) => setConfig({...config, smtp_username: e.target.value})} className="input" /></div>
                  <SecretInput field="smtp_password" value={config.smtp_password} placeholder="Password" label="Password" />
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">From Name</label><input type="text" value={config.smtp_from_name} onChange={(e) => setConfig({...config, smtp_from_name: e.target.value})} className="input" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">From Email</label><input type="email" value={config.smtp_from_email} onChange={(e) => setConfig({...config, smtp_from_email: e.target.value})} className="input" /></div>
                </div>
                <button onClick={() => handleTestConnection('smtp')} disabled={testingConnection === 'smtp'} className="btn bg-green-600 hover:bg-green-700 text-white mt-4"><Send className="w-4 h-4" />Send Test Email</button>
              </div>
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Email Triggers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Toggle field="email_payment_confirmation" label="Payment Confirmation" />
                  <Toggle field="email_invoice_reminder" label="Invoice Reminder" />
                  <Toggle field="email_enrollment_confirmation" label="Enrollment" />
                  <Toggle field="email_attendance_alert" label="Attendance Alert" />
                  <Toggle field="email_exam_results" label="Exam Results" />
                  <Toggle field="email_newsletter" label="Newsletter" />
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><MessageSquare className="w-5 h-5 text-green-600" /></div><div><h3 className="font-semibold">WhatsApp Business API</h3><p className="text-sm text-gray-600">Send via WhatsApp</p></div></div>
                  <input type="checkbox" checked={config.whatsapp_enabled} onChange={(e) => setConfig({...config, whatsapp_enabled: e.target.checked})} className="toggle" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">API URL</label><input type="url" value={config.whatsapp_api_url} onChange={(e) => setConfig({...config, whatsapp_api_url: e.target.value})} className="input" /></div>
                  <SecretInput field="whatsapp_api_token" value={config.whatsapp_api_token} placeholder="Access Token" label="Access Token" />
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Phone Number ID</label><input type="text" value={config.whatsapp_phone_number_id} onChange={(e) => setConfig({...config, whatsapp_phone_number_id: e.target.value})} className="input" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Business ID</label><input type="text" value={config.whatsapp_business_id} onChange={(e) => setConfig({...config, whatsapp_business_id: e.target.value})} className="input" /></div>
                </div>
              </div>
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"><Bell className="w-5 h-5 text-orange-600" /></div><div><h3 className="font-semibold">Push Notifications</h3><p className="text-sm text-gray-600">Firebase Cloud Messaging</p></div></div>
                  <input type="checkbox" checked={config.push_notifications_enabled} onChange={(e) => setConfig({...config, push_notifications_enabled: e.target.checked})} className="toggle" />
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-2">Firebase Server Key</label><input type="text" value={config.firebase_server_key} onChange={(e) => setConfig({...config, firebase_server_key: e.target.value})} className="input" /></div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-red-600" />Password Policy</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Min Length</label><input type="number" value={config.password_min_length} onChange={(e) => setConfig({...config, password_min_length: parseInt(e.target.value)})} min={6} className="input" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Expiry (days, 0=never)</label><input type="number" value={config.password_expiry_days} onChange={(e) => setConfig({...config, password_expiry_days: parseInt(e.target.value)})} min={0} className="input" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <Toggle field="password_require_uppercase" label="Require Uppercase" />
                  <Toggle field="password_require_lowercase" label="Require Lowercase" />
                  <Toggle field="password_require_number" label="Require Number" />
                  <Toggle field="password_require_special" label="Require Special Char" />
                </div>
              </div>
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" />Session Security</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (min)</label><input type="number" value={config.session_timeout_minutes} onChange={(e) => setConfig({...config, session_timeout_minutes: parseInt(e.target.value)})} className="input" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label><input type="number" value={config.max_login_attempts} onChange={(e) => setConfig({...config, max_login_attempts: parseInt(e.target.value)})} className="input" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">Lockout (min)</label><input type="number" value={config.lockout_duration_minutes} onChange={(e) => setConfig({...config, lockout_duration_minutes: parseInt(e.target.value)})} className="input" /></div>
                </div>
              </div>
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Smartphone className="w-5 h-5 text-green-600" />Two-Factor Auth</h2>
                <Toggle field="two_factor_enabled" label="Enable 2FA" desc="Require 2FA for admins" />
                {config.two_factor_enabled && <div className="mt-4"><label className="block text-sm font-medium text-gray-700 mb-2">2FA Method</label><select value={config.two_factor_method} onChange={(e) => setConfig({...config, two_factor_method: e.target.value})} className="input w-auto"><option value="email">Email OTP</option><option value="sms">SMS OTP</option><option value="authenticator">Authenticator</option></select></div>}
              </div>
              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-purple-600" />IP Whitelist</h2>
                <Toggle field="ip_whitelist_enabled" label="Enable IP Whitelist" />
                {config.ip_whitelist_enabled && <div className="mt-4"><label className="block text-sm font-medium text-gray-700 mb-2">Allowed IPs (one per line)</label><textarea value={config.ip_whitelist} onChange={(e) => setConfig({...config, ip_whitelist: e.target.value})} className="input" rows={4} /></div>}
              </div>
            </div>
          )}

          {/* BACKUP TAB */}
          {activeTab === 'backup' && (
            <div className="space-y-8">
              <div className="border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><HardDrive className="w-5 h-5 text-blue-600" />Manual Backup</h2>
                <p className="text-gray-600 mb-4">Create a backup of the database now</p>
                <div className="flex gap-3">
                  <button onClick={handleBackupNow} disabled={saving} className="btn bg-blue-600 hover:bg-blue-700 text-white"><Download className="w-4 h-4" />Backup Now</button>
                  <button onClick={() => window.open(`${API_BASE_URL}/system_config.php?action=export`, '_blank')} className="btn bg-gray-100 hover:bg-gray-200"><Download className="w-4 h-4" />Export Data</button>
                </div>
              </div>
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div><h2 className="text-lg font-semibold flex items-center gap-2"><RefreshCw className="w-5 h-5 text-green-600" />Auto Backup</h2><p className="text-sm text-gray-600">Schedule automatic backups</p></div>
                  <input type="checkbox" checked={config.auto_backup_enabled} onChange={(e) => setConfig({...config, auto_backup_enabled: e.target.checked})} className="toggle" />
                </div>
                {config.auto_backup_enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label><select value={config.backup_frequency} onChange={(e) => setConfig({...config, backup_frequency: e.target.value})} className="input"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Time</label><input type="time" value={config.backup_time} onChange={(e) => setConfig({...config, backup_time: e.target.value})} className="input" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">Retention (days)</label><input type="number" value={config.backup_retention_days} onChange={(e) => setConfig({...config, backup_retention_days: parseInt(e.target.value)})} className="input" /></div>
                  </div>
                )}
              </div>
              <div className="border rounded-lg p-6 bg-yellow-50 border-yellow-200">
                <div className="flex items-center justify-between mb-4">
                  <div><h2 className="text-lg font-semibold flex items-center gap-2 text-yellow-800"><AlertTriangle className="w-5 h-5" />Maintenance Mode</h2><p className="text-sm text-yellow-700">Disable access during updates</p></div>
                  <input type="checkbox" checked={config.maintenance_mode} onChange={(e) => setConfig({...config, maintenance_mode: e.target.checked})} className="toggle" />
                </div>
                {config.maintenance_mode && <div><label className="block text-sm font-medium text-gray-700 mb-2">Message</label><textarea value={config.maintenance_message} onChange={(e) => setConfig({...config, maintenance_message: e.target.value})} className="input" rows={2} /></div>}
              </div>
            </div>
          )}

          {/* INTEGRATIONS TAB - Redirect to Integration Hub */}
          {activeTab === 'integrations' && (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Plug className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Integration Hub</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                All integrations have been moved to the dedicated Integration Hub for better management of SMS, Email, Payment Gateways, and more.
              </p>
              <button 
                onClick={() => navigate('/admin/integrations')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                Go to Integration Hub
              </button>
            </div>
          )}

          {/* DEBUG TAB */}
          {activeTab === 'debug' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Developer Mode</h3>
                    <p className="text-sm text-yellow-700">
                      Debug mode should only be enabled during development or troubleshooting. 
                      Disable it in production to prevent exposing sensitive error information.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-purple-600" />
                  Debug Settings
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <p className="font-medium">Enable Debug Mode</p>
                      <p className="text-sm text-gray-500">Show detailed error messages in API responses</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.debug_mode}
                      onChange={(e) => setConfig({...config, debug_mode: e.target.checked})}
                      className="w-5 h-5 rounded text-blue-600"
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <p className="font-medium">Log API Requests</p>
                      <p className="text-sm text-gray-500">Log all API requests to the server error log</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.debug_log_api_requests}
                      onChange={(e) => setConfig({...config, debug_log_api_requests: e.target.checked})}
                      className="w-5 h-5 rounded text-blue-600"
                    />
                  </label>
                  <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div>
                      <p className="font-medium">Show SQL Errors</p>
                      <p className="text-sm text-gray-500">Include SQL error details in debug output</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.debug_show_sql_errors}
                      onChange={(e) => setConfig({...config, debug_show_sql_errors: e.target.checked})}
                      className="w-5 h-5 rounded text-blue-600"
                    />
                  </label>
                </div>
              </div>

              <div className="bg-gray-100 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Debug Status</h4>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${config.debug_mode ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                  <span className="text-sm text-gray-700">
                    Debug mode is currently <strong>{config.debug_mode ? 'ENABLED' : 'DISABLED'}</strong>
                  </span>
                </div>
                {config.debug_mode && (
                  <p className="text-xs text-orange-600 mt-2">
                    ⚠️ Remember to disable debug mode after troubleshooting
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="btn btn-primary"><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save All Changes'}</button>
      </div>
    </div>
  );
}
