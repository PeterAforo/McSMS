import { useState, useEffect } from 'react';
import { 
  Mail, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Send, 
  RefreshCw, 
  Search,
  X,
  Save,
  Code,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Copy,
  ChevronDown
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editMode, setEditMode] = useState('visual'); // 'visual' or 'html'
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    category: '',
    subject: '',
    body_html: '',
    description: '',
  });

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, []);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/email-templates.php?action=list&active_only=false`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (err) {
      setError('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/email-templates.php?action=categories`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories');
    }
  };

  const initializeDefaults = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/email-templates.php?action=initialize`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setSuccess(data.message);
        fetchTemplates();
      }
    } catch (err) {
      setError('Failed to initialize templates');
    }
  };

  const fetchPreview = async (slug) => {
    try {
      const response = await fetch(`${API_BASE_URL}/email-templates.php?action=preview&slug=${slug}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setPreviewData(data.data);
        setShowPreview(true);
      }
    } catch (err) {
      setError('Failed to fetch preview');
    }
  };

  const handleEdit = (template) => {
    setFormData({
      slug: template.slug,
      name: template.name,
      category: template.category,
      subject: template.subject,
      body_html: template.body_html,
      description: template.description || '',
    });
    setSelectedTemplate(template);
    setShowEditor(true);
  };

  const handleCreate = () => {
    setFormData({
      slug: '',
      name: '',
      category: 'notification',
      subject: '',
      body_html: '<p>Your email content here...</p>',
      description: '',
    });
    setSelectedTemplate(null);
    setShowEditor(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      let response;
      
      if (selectedTemplate) {
        // Update existing
        response = await fetch(`${API_BASE_URL}/email-templates.php?slug=${formData.slug}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: formData.name,
            subject: formData.subject,
            body_html: formData.body_html,
            description: formData.description,
          }),
        });
      } else {
        // Create new
        response = await fetch(`${API_BASE_URL}/email-templates.php?action=create`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(formData),
        });
      }

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setShowEditor(false);
        fetchTemplates();
      } else {
        setError(data.error || 'Failed to save template');
      }
    } catch (err) {
      setError('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/email-templates.php?slug=${slug}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        fetchTemplates();
      } else {
        setError(data.error || 'Failed to delete template');
      }
    } catch (err) {
      setError('Failed to delete template');
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail || !selectedTemplate) return;

    try {
      const response = await fetch(`${API_BASE_URL}/email-templates.php?action=test`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          slug: selectedTemplate.slug,
          email: testEmail,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccess('Test email sent successfully');
        setShowTestModal(false);
        setTestEmail('');
      } else {
        setError(data.error || 'Failed to send test email');
      }
    } catch (err) {
      setError('Failed to send test email');
    }
  };

  const copyVariable = (variable) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    setSuccess(`Copied {{${variable}}} to clipboard`);
    setTimeout(() => setSuccess(null), 2000);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Templates</h1>
          <p className="text-gray-600 dark:text-gray-400">Customize email notifications</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={initializeDefaults}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <RefreshCw className="w-4 h-4" />
            Initialize Defaults
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          <button onClick={() => setSuccess(null)} className="ml-auto">
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">All Categories</option>
          {Object.entries(categories).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Templates List */}
      <div className="space-y-6">
        {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
          <div key={category} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                {categories[category] || category}
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {categoryTemplates.map(template => (
                <div key={template.slug} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{template.slug}</p>
                        {template.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Subject: {template.subject}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        template.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => fetchPreview(template.slug)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowTestModal(true);
                        }}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                        title="Send Test"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.slug)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No templates found</p>
            <button
              onClick={initializeDefaults}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Initialize default templates
            </button>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedTemplate ? 'Edit Template' : 'Create Template'}
              </h3>
              <button onClick={() => setShowEditor(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Slug (ID)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                    disabled={!!selectedTemplate}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                    placeholder="my_template"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {Object.entries(categories).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Welcome Email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Welcome to {{school_name}}!"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Sent to new users upon registration"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Body (HTML)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditMode('visual')}
                      className={`px-3 py-1 text-sm rounded ${editMode === 'visual' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      <FileText className="w-4 h-4 inline mr-1" />
                      Visual
                    </button>
                    <button
                      onClick={() => setEditMode('html')}
                      className={`px-3 py-1 text-sm rounded ${editMode === 'html' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                    >
                      <Code className="w-4 h-4 inline mr-1" />
                      HTML
                    </button>
                  </div>
                </div>
                <textarea
                  value={formData.body_html}
                  onChange={(e) => setFormData({ ...formData, body_html: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="<p>Hello {{user_name}},</p>"
                />
              </div>

              {/* Available Variables */}
              {selectedTemplate?.variables?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available Variables (click to copy)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.variables.map(variable => (
                      <button
                        key={variable}
                        onClick={() => copyVariable(variable)}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        {`{{${variable}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Preview</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Subject: {previewData.subject}</p>
              </div>
              <button onClick={() => setShowPreview(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div 
                className="bg-white rounded-lg shadow-sm"
                dangerouslySetInnerHTML={{ __html: previewData.body_html }}
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Send Test Email</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Send a test email using the "{selectedTemplate?.name}" template.
            </p>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestEmail('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleTestEmail}
                disabled={!testEmail}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Send Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
