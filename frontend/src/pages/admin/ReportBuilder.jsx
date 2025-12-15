import { useState, useEffect } from 'react';
import { 
  FileText, Plus, Save, Play, Download, Trash2, Settings, 
  Filter, SortAsc, BarChart3, Table, PieChart, LineChart,
  ChevronRight, ChevronDown, GripVertical, X, Copy, Clock,
  Users, Calendar, Award, CreditCard, BookOpen, Layout,
  RefreshCw, Eye, Edit, Mail, FileSpreadsheet
} from 'lucide-react';
import { API_BASE_URL } from '../../config';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API = `${API_BASE_URL}/report_builder.php`;

export default function ReportBuilder() {
  const [reports, setReports] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('reports');
  
  // Report builder state
  const [isBuilding, setIsBuilding] = useState(false);
  const [currentReport, setCurrentReport] = useState({
    name: 'New Report',
    description: '',
    data_source: '',
    columns: [],
    filters: [],
    grouping: [],
    sorting: [],
    chart_type: null,
    chart_config: {}
  });
  
  // Preview state
  const [previewData, setPreviewData] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchTemplates();
    fetchDataSources();
  }, []);

  useEffect(() => {
    if (currentReport.data_source) {
      fetchFields(currentReport.data_source);
    }
  }, [currentReport.data_source]);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API}?action=list`);
      setReports(response.data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}?action=templates`);
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchDataSources = async () => {
    try {
      const response = await axios.get(`${API}?action=data_sources`);
      setDataSources(response.data.sources || []);
    } catch (error) {
      console.error('Error fetching data sources:', error);
    }
  };

  const fetchFields = async (source) => {
    try {
      const response = await axios.get(`${API}?action=fields&source=${source}`);
      setAvailableFields(response.data.fields || []);
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };

  const handleNewReport = () => {
    setCurrentReport({
      name: 'New Report',
      description: '',
      data_source: '',
      columns: [],
      filters: [],
      grouping: [],
      sorting: [],
      chart_type: null,
      chart_config: {}
    });
    setIsBuilding(true);
    setShowPreview(false);
    setPreviewData([]);
  };

  const handleEditReport = (report) => {
    setCurrentReport(report);
    setIsBuilding(true);
    setShowPreview(false);
  };

  const handleUseTemplate = (template) => {
    setCurrentReport({
      ...template,
      id: null,
      name: template.name + ' (Copy)'
    });
    setIsBuilding(true);
  };

  const handleSaveReport = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}?action=save`, currentReport);
      if (response.data.success) {
        alert('Report saved successfully!');
        fetchReports();
        if (!currentReport.id) {
          setCurrentReport({ ...currentReport, id: response.data.id });
        }
      }
    } catch (error) {
      alert('Error saving report');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await axios.post(`${API}?action=delete&id=${reportId}`);
      fetchReports();
    } catch (error) {
      alert('Error deleting report');
    }
  };

  const handleGeneratePreview = async () => {
    if (!currentReport.data_source) {
      alert('Please select a data source');
      return;
    }
    
    try {
      setPreviewLoading(true);
      const response = await axios.post(`${API}?action=generate`, {
        ...currentReport,
        limit: 100
      });
      
      if (response.data.success) {
        setPreviewData(response.data.data || []);
        setShowPreview(true);
      }
    } catch (error) {
      alert('Error generating preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(currentReport.name, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    
    const headers = currentReport.columns.map(c => c.alias || c.name || c.field);
    const rows = previewData.map(row => 
      currentReport.columns.map(c => {
        const key = c.alias || c.field.split('.').pop();
        return row[key] ?? '';
      })
    );
    
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 35,
      styles: { fontSize: 8 }
    });
    
    doc.save(`${currentReport.name}.pdf`);
  };

  const handleExportCSV = () => {
    const headers = currentReport.columns.map(c => c.alias || c.name || c.field);
    const rows = previewData.map(row => 
      currentReport.columns.map(c => {
        const key = c.alias || c.field.split('.').pop();
        return `"${(row[key] ?? '').toString().replace(/"/g, '""')}"`;
      }).join(',')
    );
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentReport.name}.csv`;
    a.click();
  };

  const addColumn = (field) => {
    if (!currentReport.columns.find(c => c.field === field.field)) {
      setCurrentReport({
        ...currentReport,
        columns: [...currentReport.columns, { ...field, alias: field.name }]
      });
    }
  };

  const removeColumn = (index) => {
    const newColumns = [...currentReport.columns];
    newColumns.splice(index, 1);
    setCurrentReport({ ...currentReport, columns: newColumns });
  };

  const addFilter = () => {
    setCurrentReport({
      ...currentReport,
      filters: [...currentReport.filters, { field: '', operator: 'equals', value: '' }]
    });
  };

  const updateFilter = (index, updates) => {
    const newFilters = [...currentReport.filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setCurrentReport({ ...currentReport, filters: newFilters });
  };

  const removeFilter = (index) => {
    const newFilters = [...currentReport.filters];
    newFilters.splice(index, 1);
    setCurrentReport({ ...currentReport, filters: newFilters });
  };

  const addSorting = () => {
    setCurrentReport({
      ...currentReport,
      sorting: [...currentReport.sorting, { field: '', direction: 'ASC' }]
    });
  };

  const getSourceIcon = (iconName) => {
    const icons = {
      'users': Users,
      'user-check': Users,
      'calendar-check': Calendar,
      'award': Award,
      'file-text': FileText,
      'credit-card': CreditCard,
      'book-open': BookOpen,
      'layout': Layout
    };
    const Icon = icons[iconName] || FileText;
    return <Icon className="w-5 h-5" />;
  };

  if (isBuilding) {
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsBuilding(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <input
                type="text"
                value={currentReport.name}
                onChange={(e) => setCurrentReport({ ...currentReport, name: e.target.value })}
                className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                value={currentReport.description}
                onChange={(e) => setCurrentReport({ ...currentReport, description: e.target.value })}
                placeholder="Add description..."
                className="block text-sm text-gray-500 dark:text-gray-400 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 mt-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGeneratePreview}
              disabled={previewLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {previewLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Preview
            </button>
            <button
              onClick={handleSaveReport}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Configuration */}
          <div className="col-span-4 space-y-4">
            {/* Data Source */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Data Source</h3>
              <select
                value={currentReport.data_source}
                onChange={(e) => setCurrentReport({ ...currentReport, data_source: e.target.value, columns: [] })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select data source...</option>
                {dataSources.map(source => (
                  <option key={source.id} value={source.id}>{source.name}</option>
                ))}
              </select>
            </div>

            {/* Available Fields */}
            {currentReport.data_source && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Available Fields</h3>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {availableFields.map(field => (
                    <button
                      key={field.field}
                      onClick={() => addColumn(field)}
                      disabled={currentReport.columns.find(c => c.field === field.field)}
                      className="w-full flex items-center gap-2 p-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">{field.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{field.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
                <button
                  onClick={addFilter}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Plus className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="space-y-2">
                {currentReport.filters.map((filter, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={filter.field}
                      onChange={(e) => updateFilter(index, { field: e.target.value })}
                      className="flex-1 p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Field...</option>
                      {availableFields.map(f => (
                        <option key={f.field} value={f.field}>{f.name}</option>
                      ))}
                    </select>
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(index, { operator: e.target.value })}
                      className="w-24 p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="equals">=</option>
                      <option value="contains">contains</option>
                      <option value="greater_than">&gt;</option>
                      <option value="less_than">&lt;</option>
                    </select>
                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) => updateFilter(index, { value: e.target.value })}
                      placeholder="Value"
                      className="w-24 p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <button
                      onClick={() => removeFilter(index)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {currentReport.filters.length === 0 && (
                  <p className="text-sm text-gray-400">No filters applied</p>
                )}
              </div>
            </div>

            {/* Sorting */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Sorting</h3>
                <button
                  onClick={addSorting}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <Plus className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="space-y-2">
                {currentReport.sorting.map((sort, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={sort.field}
                      onChange={(e) => {
                        const newSorting = [...currentReport.sorting];
                        newSorting[index] = { ...sort, field: e.target.value };
                        setCurrentReport({ ...currentReport, sorting: newSorting });
                      }}
                      className="flex-1 p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Field...</option>
                      {availableFields.map(f => (
                        <option key={f.field} value={f.field}>{f.name}</option>
                      ))}
                    </select>
                    <select
                      value={sort.direction}
                      onChange={(e) => {
                        const newSorting = [...currentReport.sorting];
                        newSorting[index] = { ...sort, direction: e.target.value };
                        setCurrentReport({ ...currentReport, sorting: newSorting });
                      }}
                      className="w-20 p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="ASC">A-Z</option>
                      <option value="DESC">Z-A</option>
                    </select>
                    <button
                      onClick={() => {
                        const newSorting = [...currentReport.sorting];
                        newSorting.splice(index, 1);
                        setCurrentReport({ ...currentReport, sorting: newSorting });
                      }}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Columns & Preview */}
          <div className="col-span-8 space-y-4">
            {/* Selected Columns */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Report Columns</h3>
              {currentReport.columns.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Table className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Click fields from the left panel to add columns</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {currentReport.columns.map((col, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {col.alias || col.name}
                      </span>
                      <button
                        onClick={() => removeColumn(index)}
                        className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
                      >
                        <X className="w-3 h-3 text-blue-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Preview</h3>
                    <p className="text-sm text-gray-500">{previewData.length} rows</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      CSV
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        {currentReport.columns.map((col, i) => (
                          <th key={i} className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                            {col.alias || col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {previewData.slice(0, 50).map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          {currentReport.columns.map((col, colIndex) => {
                            const key = col.alias || col.field.split('.').pop();
                            return (
                              <td key={colIndex} className="px-4 py-2 text-gray-600 dark:text-gray-400">
                                {row[key] ?? '-'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Report Builder</h1>
          <p className="text-gray-500 dark:text-gray-400">Create custom reports with drag-and-drop</p>
        </div>
        <button
          onClick={handleNewReport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        {['reports', 'templates'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'reports' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Reports Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first custom report or use a template</p>
              <button
                onClick={handleNewReport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Report
              </button>
            </div>
          ) : (
            reports.map(report => (
              <div
                key={report.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{report.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{report.data_source}</p>
                    </div>
                  </div>
                </div>
                {report.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {report.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                  <span>{report.columns?.length || 0} columns</span>
                  <span>•</span>
                  <span>{report.filters?.length || 0} filters</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditReport(report)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      handleEditReport(report);
                      setTimeout(handleGeneratePreview, 100);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 text-sm"
                  >
                    <Play className="w-4 h-4" />
                    Run
                  </button>
                  <button
                    onClick={() => handleDeleteReport(report.id)}
                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleUseTemplate(template)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{template.data_source}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {template.description}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{template.columns?.length || 0} columns</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
