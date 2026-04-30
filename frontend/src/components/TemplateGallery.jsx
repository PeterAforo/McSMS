import { useState, useEffect } from 'react';
import { Plus, Eye, Trash2, Copy, Star, X, Folder } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function TemplateGallery({ onSelect, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/finance.php?resource=templates`);
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/finance.php?resource=templates&id=${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== id));
      }
    } catch (error) {
      alert('Error deleting template: ' + error.message);
    }
  };

  const handleUseTemplate = (template) => {
    const templateData = typeof template.template_data === 'string' 
      ? JSON.parse(template.template_data) 
      : template.template_data;
    onSelect(templateData);
    onClose();
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'primary': return 'bg-green-100 text-green-700';
      case 'secondary': return 'bg-blue-100 text-blue-700';
      case 'creche': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'primary': return 'Primary School';
      case 'secondary': return 'Secondary School';
      case 'creche': return 'Creche/Nursery';
      default: return 'Custom';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Fee Structure Templates</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No templates found. Create your first template by saving your current fee structure.
          </div>
        ) : (
          templates.map(template => (
            <div
              key={template.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedTemplate(template);
                setShowPreview(true);
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {template.is_public ? <Star className="w-4 h-4 text-yellow-500" /> : <Folder className="w-4 h-4 text-gray-400" />}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(template.category)}`}>
                    {getCategoryLabel(template.category)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseTemplate(template);
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Use Template"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {!template.is_public && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Delete Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">{template.name}</h4>
              <p className="text-sm text-gray-500 mb-2 line-clamp-2">{template.description || 'No description'}</p>
              <div className="text-xs text-gray-400">
                {template.is_public ? 'Public template' : 'Private template'}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Template Preview: {selectedTemplate.name}</h3>
              <button onClick={() => setShowPreview(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(selectedTemplate.category)}`}>
                  {getCategoryLabel(selectedTemplate.category)}
                </span>
                {selectedTemplate.is_public && <span className="text-xs text-yellow-600">Public Template</span>}
              </div>
              <p className="text-gray-600">{selectedTemplate.description || 'No description'}</p>
              <div className="bg-gray-50 rounded p-4">
                <h4 className="font-medium mb-2">Template Structure</h4>
                <pre className="text-sm text-gray-600 overflow-auto max-h-64">
                  {typeof selectedTemplate.template_data === 'string' 
                    ? JSON.stringify(JSON.parse(selectedTemplate.template_data), null, 2)
                    : JSON.stringify(selectedTemplate.template_data, null, 2)}
                </pre>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => setShowPreview(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Close</button>
                <button onClick={() => handleUseTemplate(selectedTemplate)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Use This Template</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
