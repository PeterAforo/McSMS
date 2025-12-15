import { useState, useEffect } from 'react';
import {
  Plug, MessageSquare, Mail, CreditCard, Calculator, Calendar,
  Settings, Check, X, AlertTriangle, RefreshCw, Plus, Eye, Edit,
  Send, Clock, CheckCircle, XCircle, Smartphone, Globe, Key,
  Webhook, FileText, Download, Upload, TestTube, Zap
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

const API = `${API_BASE_URL}/integrations.php`;

export default function IntegrationHub() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [smsTemplates, setSmsTemplates] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [showModal, setShowModal] = useState(null);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [formData, setFormData] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [webhooks, setWebhooks] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [templateForm, setTemplateForm] = useState({ name: '', content: '', subject: '', body: '', category: 'general' });
  const [webhookForm, setWebhookForm] = useState({ name: '', url: '', events: [] });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  useEffect(() => {
    if (activeTab === 'sms') fetchSmsTemplates();
    if (activeTab === 'email') fetchEmailTemplates();
    if (activeTab === 'webhooks') {
      fetchWebhooks();
      fetchApiKeys();
    }
  }, [activeTab]);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}?action=list`);
      setIntegrations(res.data.integrations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSmsTemplates = async () => {
    try {
      const res = await axios.get(`${API}?action=sms_templates`);
      setSmsTemplates(res.data.templates || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmailTemplates = async () => {
    try {
      const res = await axios.get(`${API}?action=email_templates`);
      setEmailTemplates(res.data.templates || []);
    } catch (err) {
      console.error(err);
    }
  };

  const saveIntegration = async () => {
    try {
      await axios.post(`${API}?action=save`, {
        integration_type: selectedIntegration,
        provider: formData.provider,
        settings: formData.settings,
        is_enabled: formData.is_enabled ? 1 : 0
      });
      fetchIntegrations();
      setShowModal(null);
      alert('Integration saved successfully!');
    } catch (err) {
      alert('Failed to save integration');
    }
  };

  const testIntegration = async (type) => {
    try {
      setTestResult({ loading: true });
      const res = await axios.post(`${API}?action=test`, { integration_type: type });
      setTestResult({ success: res.data.success, message: res.data.message });
    } catch (err) {
      setTestResult({ success: false, message: 'Test failed' });
    }
  };

  const sendTestSms = async () => {
    try {
      const res = await axios.post(`${API}?action=send_sms`, {
        recipient: formData.test_phone,
        message: formData.test_message || 'This is a test message from McSMS'
      });
      alert(res.data.success ? 'SMS sent successfully!' : 'Failed to send SMS');
    } catch (err) {
      alert('Failed to send SMS');
    }
  };

  const sendTestEmail = async () => {
    try {
      const res = await axios.post(`${API}?action=send_email`, {
        recipient: formData.test_email,
        subject: formData.test_subject || 'Test Email from McSMS',
        body: formData.test_body || '<p>This is a test email from McSMS.</p>'
      });
      alert(res.data.success ? 'Email sent successfully!' : 'Failed to send email');
    } catch (err) {
      alert('Failed to send email');
    }
  };

  const getIntegration = (type) => integrations.find(i => i.integration_type === type);

  const fetchWebhooks = async () => {
    try {
      const res = await axios.get(`${API}?action=webhooks`);
      setWebhooks(res.data.webhooks || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const res = await axios.get(`${API}?action=api_keys`);
      setApiKeys(res.data.api_keys || []);
    } catch (err) {
      console.error(err);
    }
  };

  const saveSmsTemplate = async () => {
    try {
      await axios.post(`${API}?action=save_sms_template`, templateForm);
      fetchSmsTemplates();
      setShowModal(null);
      setTemplateForm({ name: '', content: '', category: 'general' });
      alert('SMS template saved!');
    } catch (err) {
      alert('Failed to save template');
    }
  };

  const saveEmailTemplate = async () => {
    try {
      await axios.post(`${API}?action=save_email_template`, templateForm);
      fetchEmailTemplates();
      setShowModal(null);
      setTemplateForm({ name: '', subject: '', body: '', category: 'general' });
      alert('Email template saved!');
    } catch (err) {
      alert('Failed to save template');
    }
  };

  const saveWebhook = async () => {
    try {
      await axios.post(`${API}?action=save_webhook`, webhookForm);
      fetchWebhooks();
      setShowModal(null);
      setWebhookForm({ name: '', url: '', events: [] });
      alert('Webhook saved!');
    } catch (err) {
      alert('Failed to save webhook');
    }
  };

  const generateApiKey = async () => {
    try {
      const res = await axios.post(`${API}?action=generate_api_key`);
      if (res.data.success) {
        alert(`API Key generated: ${res.data.api_key}\n\nCopy this key now - it won't be shown again!`);
        fetchApiKeys();
      }
    } catch (err) {
      alert('Failed to generate API key');
    }
  };

  const integrationTypes = [
    { type: 'sms', label: 'SMS Gateway', icon: MessageSquare, color: 'green', providers: ['hubtel', 'mnotify', 'arkesel', 'twilio'] },
    { type: 'email', label: 'Email Service', icon: Mail, color: 'blue', providers: ['smtp', 'sendgrid', 'mailgun'] },
    { type: 'payment', label: 'Payment Gateway', icon: CreditCard, color: 'purple', providers: ['paystack', 'flutterwave', 'momo'] },
    { type: 'accounting', label: 'Accounting', icon: Calculator, color: 'yellow', providers: ['quickbooks', 'xero', 'sage'] },
    { type: 'calendar', label: 'Calendar', icon: Calendar, color: 'red', providers: ['google', 'outlook'] }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Plug },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'payment', label: 'Payments', icon: CreditCard },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integration Hub</h1>
          <p className="text-gray-500 dark:text-gray-400">Connect third-party services and APIs</p>
        </div>
        <button onClick={fetchIntegrations} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrationTypes.map((int) => {
            const config = getIntegration(int.type);
            const isEnabled = config?.is_enabled;
            const colors = {
              green: 'bg-green-100 dark:bg-green-900/30 text-green-600 border-green-200',
              blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 border-blue-200',
              purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 border-purple-200',
              yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 border-yellow-200',
              red: 'bg-red-100 dark:bg-red-900/30 text-red-600 border-red-200'
            };

            return (
              <div key={int.type} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${colors[int.color]}`}>
                    <int.icon className="w-6 h-6" />
                  </div>
                  <div className={`px-2 py-1 text-xs rounded-full ${isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {isEnabled ? 'Connected' : 'Not Connected'}
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 dark:text-white mt-4">{int.label}</h3>
                {config?.provider && (
                  <p className="text-sm text-gray-500 mt-1 capitalize">Provider: {config.provider}</p>
                )}
                
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedIntegration(int.type);
                      setFormData({
                        provider: config?.provider || int.providers[0],
                        settings: config?.settings || {},
                        is_enabled: config?.is_enabled || false
                      });
                      setShowModal('configure');
                    }}
                    className="flex-1 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    Configure
                  </button>
                  {isEnabled && (
                    <button
                      onClick={() => testIntegration(int.type)}
                      className="flex-1 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg"
                    >
                      Test
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SMS Tab */}
      {activeTab === 'sms' && (
        <div className="space-y-6">
          {/* SMS Config */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">SMS Configuration</h3>
            {(() => {
              const smsConfig = getIntegration('sms');
              return smsConfig?.is_enabled ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span>Connected to {smsConfig.provider}</span>
                  </div>
                  <button onClick={() => {
                    setSelectedIntegration('sms');
                    setFormData({
                      provider: smsConfig.provider,
                      settings: smsConfig.settings || {},
                      is_enabled: true
                    });
                    setShowModal('configure');
                  }} className="text-blue-600 text-sm hover:underline">
                    Edit Settings
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="w-5 h-5" />
                    <span>SMS not configured</span>
                  </div>
                  <button onClick={() => {
                    setSelectedIntegration('sms');
                    setFormData({ provider: 'hubtel', settings: {}, is_enabled: false });
                    setShowModal('configure');
                  }} className="text-blue-600 text-sm hover:underline">
                    Configure Now
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Send Test SMS */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Send Test SMS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="tel"
                placeholder="Phone Number (e.g., 0241234567)"
                value={formData.test_phone || ''}
                onChange={(e) => setFormData({ ...formData, test_phone: e.target.value })}
                className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="text"
                placeholder="Message"
                value={formData.test_message || ''}
                onChange={(e) => setFormData({ ...formData, test_message: e.target.value })}
                className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <button onClick={sendTestSms} className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Send className="w-4 h-4" /> Send Test SMS
            </button>
          </div>

          {/* SMS Templates */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">SMS Templates</h3>
              <button onClick={() => { setTemplateForm({ name: '', content: '', category: 'general' }); setShowModal('sms_template'); }} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" /> Add Template
              </button>
            </div>
            <div className="space-y-3">
              {smsTemplates.map((template, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                      <span className="text-xs text-gray-500 capitalize">{template.category}</span>
                    </div>
                    <button onClick={() => { setTemplateForm(template); setShowModal('sms_template'); }} className="text-blue-600 text-sm hover:underline">Edit</button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{template.content}</p>
                </div>
              ))}
              {smsTemplates.length === 0 && (
                <p className="text-center py-4 text-gray-500">No SMS templates</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Tab */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          {/* Email Config */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Email Configuration</h3>
            {(() => {
              const emailConfig = getIntegration('email');
              return emailConfig?.is_enabled ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span>Connected via {emailConfig.provider}</span>
                  </div>
                  <button onClick={() => {
                    setSelectedIntegration('email');
                    setFormData({
                      provider: emailConfig.provider,
                      settings: emailConfig.settings || {},
                      is_enabled: true
                    });
                    setShowModal('configure');
                  }} className="text-blue-600 text-sm hover:underline">
                    Edit Settings
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Email not configured</span>
                  </div>
                  <button onClick={() => {
                    setSelectedIntegration('email');
                    setFormData({ provider: 'smtp', settings: {}, is_enabled: false });
                    setShowModal('configure');
                  }} className="text-blue-600 text-sm hover:underline">
                    Configure Now
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Send Test Email */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Send Test Email</h3>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Recipient Email"
                value={formData.test_email || ''}
                onChange={(e) => setFormData({ ...formData, test_email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="text"
                placeholder="Subject"
                value={formData.test_subject || ''}
                onChange={(e) => setFormData({ ...formData, test_subject: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
              <textarea
                placeholder="Email Body (HTML supported)"
                value={formData.test_body || ''}
                onChange={(e) => setFormData({ ...formData, test_body: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <button onClick={sendTestEmail} className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Send className="w-4 h-4" /> Send Test Email
            </button>
          </div>

          {/* Email Templates */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Email Templates</h3>
              <button onClick={() => { setTemplateForm({ name: '', subject: '', body: '', category: 'general' }); setShowModal('email_template'); }} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" /> Add Template
              </button>
            </div>
            <div className="space-y-3">
              {emailTemplates.map((template, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                      <p className="text-sm text-gray-500">{template.subject}</p>
                    </div>
                    <button onClick={() => { setTemplateForm(template); setShowModal('email_template'); }} className="text-blue-600 text-sm hover:underline">Edit</button>
                  </div>
                </div>
              ))}
              {emailTemplates.length === 0 && (
                <p className="text-center py-4 text-gray-500">No email templates</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Tab */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Payment Gateway</h3>
            {(() => {
              const paymentConfig = getIntegration('payment');
              return paymentConfig?.is_enabled ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span>Connected to {paymentConfig.provider}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-500">Provider</p>
                      <p className="font-semibold capitalize">{paymentConfig.provider}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-500">Mode</p>
                      <p className="font-semibold">{paymentConfig.settings?.mode || 'Test'}</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="font-semibold text-green-600">Active</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No payment gateway configured</p>
                  <button onClick={() => {
                    setSelectedIntegration('payment');
                    setFormData({ provider: 'paystack', settings: {}, is_enabled: false });
                    setShowModal('configure');
                  }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Configure Payment Gateway
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Supported Gateways */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Supported Payment Gateways</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Paystack', currencies: ['GHS', 'NGN', 'USD'], logo: '💳' },
                { name: 'Flutterwave', currencies: ['GHS', 'NGN', 'KES'], logo: '🦋' },
                { name: 'Mobile Money', currencies: ['GHS'], logo: '📱' }
              ].map((gateway, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{gateway.logo}</span>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{gateway.name}</h4>
                      <p className="text-xs text-gray-500">{gateway.currencies.join(', ')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Webhooks</h3>
              <button onClick={() => { setWebhookForm({ name: '', url: '', events: [] }); setShowModal('webhook'); }} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" /> Add Webhook
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Webhooks allow external services to receive real-time notifications when events occur in McSMS.
            </p>
            <div className="space-y-3">
              {webhooks.map((webhook, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{webhook.name}</h4>
                      <p className="text-sm text-gray-500">{webhook.url}</p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Active</span>
                  </div>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {(webhook.events || []).map((event, j) => (
                      <span key={j} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded">{event}</span>
                    ))}
                  </div>
                </div>
              ))}
              {webhooks.length === 0 && (
                <p className="text-center py-4 text-gray-500">No webhooks configured</p>
              )}
            </div>
          </div>

          {/* API Keys */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">API Keys</h3>
              <button onClick={generateApiKey} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                <Key className="w-4 h-4" /> Generate Key
              </button>
            </div>
            <div className="space-y-3">
              {apiKeys.map((key, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{key.name}</h4>
                    <p className="text-sm text-gray-500 font-mono">{key.api_key_masked}</p>
                  </div>
                  <span className="text-xs text-gray-500">{key.created_at}</span>
                </div>
              ))}
              {apiKeys.length === 0 && (
                <p className="text-center py-4 text-gray-500">No API keys generated yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Configure Modal */}
      {showModal === 'configure' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  Configure {selectedIntegration}
                </h3>
                <button onClick={() => setShowModal(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  {integrationTypes.find(i => i.type === selectedIntegration)?.providers.map(p => (
                    <option key={p} value={p} className="capitalize">{p}</option>
                  ))}
                </select>
              </div>

              {/* Provider-specific settings */}
              {selectedIntegration === 'sms' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                    <input
                      type="password"
                      value={formData.settings?.api_key || ''}
                      onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, api_key: e.target.value } })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sender ID</label>
                    <input
                      type="text"
                      value={formData.settings?.sender_id || ''}
                      onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, sender_id: e.target.value } })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      placeholder="e.g., SCHOOL"
                    />
                  </div>
                </>
              )}

              {selectedIntegration === 'email' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Email</label>
                    <input
                      type="email"
                      value={formData.settings?.from_email || ''}
                      onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, from_email: e.target.value } })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From Name</label>
                    <input
                      type="text"
                      value={formData.settings?.from_name || ''}
                      onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, from_name: e.target.value } })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  {formData.provider === 'smtp' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SMTP Host</label>
                        <input
                          type="text"
                          value={formData.settings?.smtp_host || ''}
                          onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, smtp_host: e.target.value } })}
                          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Port</label>
                          <input
                            type="number"
                            value={formData.settings?.smtp_port || ''}
                            onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, smtp_port: e.target.value } })}
                            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Encryption</label>
                          <select
                            value={formData.settings?.encryption || 'tls'}
                            onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, encryption: e.target.value } })}
                            className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                          >
                            <option value="tls">TLS</option>
                            <option value="ssl">SSL</option>
                            <option value="none">None</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                  {(formData.provider === 'sendgrid' || formData.provider === 'mailgun') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                      <input
                        type="password"
                        value={formData.settings?.api_key || ''}
                        onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, api_key: e.target.value } })}
                        className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  )}
                </>
              )}

              {selectedIntegration === 'payment' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Public Key</label>
                    <input
                      type="text"
                      value={formData.settings?.public_key || ''}
                      onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, public_key: e.target.value } })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secret Key</label>
                    <input
                      type="password"
                      value={formData.settings?.secret_key || ''}
                      onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, secret_key: e.target.value } })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode</label>
                    <select
                      value={formData.settings?.mode || 'test'}
                      onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, mode: e.target.value } })}
                      className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="test">Test</option>
                      <option value="live">Live</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={formData.is_enabled}
                  onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="enabled" className="text-sm text-gray-700 dark:text-gray-300">Enable this integration</label>
              </div>
            </div>
            <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-2">
              <button onClick={() => setShowModal(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button onClick={saveIntegration} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Template Modal */}
      {showModal === 'sms_template' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {templateForm.id ? 'Edit' : 'Add'} SMS Template
                </h3>
                <button onClick={() => setShowModal(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Fee Reminder"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="general">General</option>
                  <option value="fees">Fees</option>
                  <option value="attendance">Attendance</option>
                  <option value="exam">Exam</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message Content</label>
                <textarea
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Use {student_name}, {amount}, {date} as placeholders"
                />
              </div>
            </div>
            <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-2">
              <button onClick={() => setShowModal(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button onClick={saveSmsTemplate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Template Modal */}
      {showModal === 'email_template' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {templateForm.id ? 'Edit' : 'Add'} Email Template
                </h3>
                <button onClick={() => setShowModal(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Welcome Email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="general">General</option>
                  <option value="fees">Fees</option>
                  <option value="attendance">Attendance</option>
                  <option value="exam">Exam</option>
                  <option value="event">Event</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Email subject line"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body (HTML)</label>
                <textarea
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="<p>Dear {student_name},</p>"
                />
              </div>
            </div>
            <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-2">
              <button onClick={() => setShowModal(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button onClick={saveEmailTemplate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webhook Modal */}
      {showModal === 'webhook' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {webhookForm.id ? 'Edit' : 'Add'} Webhook
                </h3>
                <button onClick={() => setShowModal(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook Name</label>
                <input
                  type="text"
                  value={webhookForm.name}
                  onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Payment Notifications"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endpoint URL</label>
                <input
                  type="url"
                  value={webhookForm.url}
                  onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="https://your-server.com/webhook"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Events</label>
                <div className="space-y-2">
                  {['payment.success', 'payment.failed', 'student.enrolled', 'student.unenrolled', 'fee.paid', 'attendance.marked'].map(event => (
                    <label key={event} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={webhookForm.events?.includes(event)}
                        onChange={(e) => {
                          const events = webhookForm.events || [];
                          setWebhookForm({
                            ...webhookForm,
                            events: e.target.checked
                              ? [...events, event]
                              : events.filter(ev => ev !== event)
                          });
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t dark:border-gray-700 flex justify-end gap-2">
              <button onClick={() => setShowModal(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button onClick={saveWebhook} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save Webhook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Result Toast */}
      {testResult && !testResult.loading && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${testResult.success ? 'bg-green-500' : 'bg-red-500'} text-white max-w-sm`}>
          <div className="flex items-center gap-2">
            {testResult.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span>{testResult.message}</span>
          </div>
          <button onClick={() => setTestResult(null)} className="absolute top-1 right-1 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
