import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit, Trash2, BookOpen, X, Search, Download, Printer, Upload,
  Eye, Users, School, ChevronUp, ChevronDown, Archive, RotateCcw, Clock, FileText,
  Link, Building2, GraduationCap, Layers
} from 'lucide-react';
import { subjectsAPI } from '../../services/api';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { useEducationLevels } from '../../hooks/useEducationLevels';

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const { educationLevels } = useEducationLevels();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    subject_name: '',
    subject_code: '',
    category: 'core',
    description: '',
    status: 'active',
    credit_hours: 3,
    department_id: '',
    level: 'all'
  });

  // New state for enhanced features
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [sortField, setSortField] = useState('subject_name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPrerequisitesModal, setShowPrerequisitesModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectDetails, setSubjectDetails] = useState({ classes: [], teachers: [], prerequisites: [], required_by: [] });
  const [importData, setImportData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [prerequisiteForm, setPrerequisiteForm] = useState({ prerequisite_id: '', is_mandatory: 1, min_grade: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchSubjects();
    fetchDepartments();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await subjectsAPI.getAll();
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      alert('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/departments.php`);
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleAdd = () => {
    setEditingSubject(null);
    setFormData({
      subject_name: '',
      subject_code: '',
      category: 'core',
      description: '',
      status: 'active',
      credit_hours: 3,
      department_id: '',
      level: 'all'
    });
    setShowModal(true);
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      subject_name: subject.subject_name,
      subject_code: subject.subject_code,
      category: subject.category,
      description: subject.description || '',
      status: subject.status,
      credit_hours: subject.credit_hours || 3,
      department_id: subject.department_id || '',
      level: subject.level || 'all'
    });
    setShowModal(true);
  };

  // View subject details (classes, teachers, prerequisites)
  const handleViewDetails = async (subject) => {
    setSelectedSubject(subject);
    try {
      // Fetch classes using this subject
      const classesRes = await axios.get(`${API_BASE_URL}/class_subjects.php`);
      const allClassSubjects = classesRes.data.class_subjects || [];
      const subjectClasses = allClassSubjects.filter(cs => cs.subject_id == subject.id);
      
      // Get unique teachers
      const teacherMap = {};
      subjectClasses.forEach(cs => {
        if (cs.teacher_id && cs.teacher_name) {
          teacherMap[cs.teacher_id] = {
            id: cs.teacher_id,
            name: cs.teacher_name,
            classes: (teacherMap[cs.teacher_id]?.classes || []).concat(cs.class_name)
          };
        }
      });

      // Fetch prerequisites
      let prerequisites = [];
      let required_by = [];
      try {
        const prereqRes = await axios.get(`${API_BASE_URL}/subject_prerequisites.php?subject_id=${subject.id}`);
        prerequisites = prereqRes.data.prerequisites || [];
        required_by = prereqRes.data.required_by || [];
      } catch (e) {
        console.log('Prerequisites not available');
      }
      
      setSubjectDetails({
        classes: subjectClasses,
        teachers: Object.values(teacherMap),
        prerequisites,
        required_by
      });
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching subject details:', error);
    }
  };

  // Manage prerequisites
  const handleManagePrerequisites = async (subject) => {
    setSelectedSubject(subject);
    try {
      const prereqRes = await axios.get(`${API_BASE_URL}/subject_prerequisites.php?subject_id=${subject.id}`);
      setSubjectDetails({
        ...subjectDetails,
        prerequisites: prereqRes.data.prerequisites || [],
        required_by: prereqRes.data.required_by || []
      });
      setPrerequisiteForm({ prerequisite_id: '', is_mandatory: 1, min_grade: '' });
      setShowPrerequisitesModal(true);
    } catch (error) {
      console.error('Error fetching prerequisites:', error);
    }
  };

  const handleAddPrerequisite = async () => {
    if (!prerequisiteForm.prerequisite_id) {
      alert('Please select a prerequisite subject');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/subject_prerequisites.php`, {
        subject_id: selectedSubject.id,
        ...prerequisiteForm
      });
      // Refresh prerequisites
      const prereqRes = await axios.get(`${API_BASE_URL}/subject_prerequisites.php?subject_id=${selectedSubject.id}`);
      setSubjectDetails({
        ...subjectDetails,
        prerequisites: prereqRes.data.prerequisites || [],
        required_by: prereqRes.data.required_by || []
      });
      setPrerequisiteForm({ prerequisite_id: '', is_mandatory: 1, min_grade: '' });
      alert('Prerequisite added successfully!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add prerequisite');
    }
  };

  const handleRemovePrerequisite = async (prereqId) => {
    if (!window.confirm('Remove this prerequisite?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/subject_prerequisites.php?id=${prereqId}`);
      const prereqRes = await axios.get(`${API_BASE_URL}/subject_prerequisites.php?subject_id=${selectedSubject.id}`);
      setSubjectDetails({
        ...subjectDetails,
        prerequisites: prereqRes.data.prerequisites || [],
        required_by: prereqRes.data.required_by || []
      });
      alert('Prerequisite removed!');
    } catch (error) {
      alert('Failed to remove prerequisite');
    }
  };

  // Archive/Restore subject
  const handleArchive = async (subject) => {
    const newStatus = subject.status === 'active' ? 'archived' : 'active';
    const action = newStatus === 'archived' ? 'archive' : 'restore';
    
    if (window.confirm(`Are you sure you want to ${action} this subject?`)) {
      try {
        await subjectsAPI.update(subject.id, { ...subject, status: newStatus });
        fetchSubjects();
        alert(`Subject ${action}d successfully!`);
      } catch (error) {
        console.error('Error updating subject:', error);
        alert(`Failed to ${action} subject`);
      }
    }
  };

  // Sort handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Export functions
  const handleExport = (format) => {
    const data = filteredSubjects.map(s => ({
      'Subject Name': s.subject_name,
      'Code': s.subject_code,
      'Category': s.category,
      'Credit Hours': s.credit_hours || 3,
      'Status': s.status,
      'Description': s.description || ''
    }));

    if (format === 'csv') {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'subjects.csv';
      a.click();
    } else if (format === 'print') {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html><head><title>Subjects List</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #2563eb; color: white; }
          h1 { color: #1f2937; }
          .stats { display: flex; gap: 20px; margin: 20px 0; }
          .stat { padding: 10px 20px; background: #f3f4f6; border-radius: 8px; }
        </style></head><body>
        <h1>Subjects List</h1>
        <div class="stats">
          <div class="stat"><strong>Total:</strong> ${filteredSubjects.length}</div>
          <div class="stat"><strong>Core:</strong> ${filteredSubjects.filter(s => s.category === 'core').length}</div>
          <div class="stat"><strong>Elective:</strong> ${filteredSubjects.filter(s => s.category === 'elective').length}</div>
        </div>
        <table>
          <thead><tr>${Object.keys(data[0]).map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${data.map(row => `<tr>${Object.values(row).map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
        </body></html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Import CSV handler
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      
      const data = [];
      const errors = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        
        // Validate required fields
        if (!row['subject name'] && !row['subject_name']) {
          errors.push(`Row ${i}: Missing subject name`);
        } else if (!row['code'] && !row['subject_code']) {
          errors.push(`Row ${i}: Missing subject code`);
        } else {
          data.push({
            subject_name: row['subject name'] || row['subject_name'],
            subject_code: row['code'] || row['subject_code'],
            category: row['category'] || 'core',
            credit_hours: parseInt(row['credit hours'] || row['credit_hours']) || 3,
            description: row['description'] || '',
            status: 'active'
          });
        }
      }
      
      setImportData(data);
      setImportErrors(errors);
      setShowImportModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportSubmit = async () => {
    let imported = 0;
    let failed = 0;
    
    for (const subject of importData) {
      try {
        await subjectsAPI.create(subject);
        imported++;
      } catch (error) {
        failed++;
      }
    }
    
    alert(`Import complete: ${imported} imported, ${failed} failed`);
    setShowImportModal(false);
    setImportData([]);
    fetchSubjects();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subject?')) {
      try {
        await subjectsAPI.delete(id);
        fetchSubjects();
        alert('Subject deleted successfully!');
      } catch (error) {
        console.error('Error deleting subject:', error);
        alert('Failed to delete subject');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        await subjectsAPI.update(editingSubject.id, formData);
        alert('Subject updated successfully!');
      } else {
        await subjectsAPI.create(formData);
        alert('Subject created successfully!');
      }
      setShowModal(false);
      fetchSubjects();
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Failed to save subject: ' + (error.response?.data?.error || error.message));
    }
  };

  const getCategoryBadge = (category) => {
    const colors = {
      core: 'bg-blue-100 text-blue-700',
      elective: 'bg-green-100 text-green-700',
      optional: 'bg-purple-100 text-purple-700',
      extra: 'bg-orange-100 text-orange-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  // Filter and sort subjects
  const filteredSubjects = subjects
    .filter(s => {
      const matchesSearch = !searchTerm ||
        s.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.subject_code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || s.category === categoryFilter;
      const matchesStatus = !statusFilter || s.status === statusFilter;
      const matchesDepartment = !departmentFilter || s.department_id == departmentFilter;
      const matchesLevel = !levelFilter || s.level === levelFilter || s.level === 'all';
      return matchesSearch && matchesCategory && matchesStatus && matchesDepartment && matchesLevel;
    })
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  const totalCredits = filteredSubjects.reduce((sum, s) => sum + (parseInt(s.credit_hours) || 3), 0);

  // Available subjects for prerequisites (exclude current subject and already added)
  const availableForPrerequisite = subjects.filter(s => 
    s.id !== selectedSubject?.id && 
    !subjectDetails.prerequisites?.some(p => p.prerequisite_id == s.id)
  );

  const stats = [
    { label: 'Total Subjects', value: subjects.length, color: 'bg-blue-500', icon: BookOpen },
    { label: 'Departments', value: departments.length, color: 'bg-indigo-500', icon: Building2 },
    { label: 'Core', value: subjects.filter(s => s.category === 'core').length, color: 'bg-green-500', icon: BookOpen },
    { label: 'Total Credits', value: totalCredits, color: 'bg-orange-500', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subjects Management</h1>
          <p className="text-gray-600 mt-1">Manage academic subjects</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Subject
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <input type="file" ref={fileInputRef} accept=".csv" onChange={handleFileSelect} className="hidden" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search, Filter & Export */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input w-auto">
              <option value="">All Categories</option>
              <option value="core">Core</option>
              <option value="elective">Elective</option>
              <option value="optional">Optional</option>
              <option value="extra">Extra</option>
            </select>
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="input w-auto">
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.department_name}</option>
              ))}
            </select>
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="input w-auto">
              <option value="">All Levels</option>
              {educationLevels.map(level => (
                <option key={level.id} value={level.level_code}>{level.level_name}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleExport('csv')} className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={() => handleExport('print')} className="btn bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('subject_name')}>
                  <div className="flex items-center gap-1">
                    Subject Name
                    {sortField === 'subject_name' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('subject_code')}>
                  <div className="flex items-center gap-1">
                    Code
                    {sortField === 'subject_code' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">
                    Category
                    {sortField === 'category' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : filteredSubjects.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  {subjects.length === 0 ? 'No subjects found' : 'No subjects match your filters'}
                </td></tr>
              ) : (
                filteredSubjects.map((subject) => (
                  <tr key={subject.id} className={`hover:bg-gray-50 ${subject.status === 'archived' ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="font-medium text-gray-900">{subject.subject_name}</span>
                          {subject.level && subject.level !== 'all' && (
                            <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded text-xs uppercase">{subject.level}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{subject.subject_code}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadge(subject.category)}`}>
                        {subject.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {subject.department_name ? (
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs">{subject.department_name}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        {subject.credit_hours || 3} hrs
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        subject.status === 'active' ? 'bg-green-100 text-green-700' : 
                        subject.status === 'archived' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {subject.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleViewDetails(subject)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleManagePrerequisites(subject)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Prerequisites">
                          <Link className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(subject)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        {subject.status === 'active' ? (
                          <button onClick={() => handleArchive(subject)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="Archive">
                            <Archive className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => handleArchive(subject)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Restore">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(subject.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredSubjects.length > 0 && (
          <div className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-600">
            Showing {filteredSubjects.length} of {subjects.length} subjects
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject_name}
                    onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject_code}
                    onChange={(e) => setFormData({ ...formData, subject_code: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                  >
                    <option value="core">Core</option>
                    <option value="elective">Elective</option>
                    <option value="optional">Optional</option>
                    <option value="extra">Extra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Credit Hours *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="10"
                    value={formData.credit_hours}
                    onChange={(e) => setFormData({ ...formData, credit_hours: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="input"
                  >
                    <option value="">No Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.department_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="input"
                  >
                    <option value="all">All Levels</option>
                    {educationLevels.map(level => (
                      <option key={level.id} value={level.level_code}>{level.level_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows="2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSubject ? 'Update Subject' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Details Modal */}
      {showDetailsModal && selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-semibold">{selectedSubject.subject_name}</h2>
                <p className="text-sm text-gray-500">{selectedSubject.subject_code} • {selectedSubject.category}</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              {/* Subject Info */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <School className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-700">{subjectDetails.classes.length}</p>
                  <p className="text-xs text-gray-600">Classes</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <Users className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">{subjectDetails.teachers.length}</p>
                  <p className="text-xs text-gray-600">Teachers</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <Clock className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-orange-700">{selectedSubject.credit_hours || 3}</p>
                  <p className="text-xs text-gray-600">Credit Hours</p>
                </div>
              </div>

              {/* Description */}
              {selectedSubject.description && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-600 text-sm">{selectedSubject.description}</p>
                </div>
              )}

              {/* Classes using this subject */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><School className="w-4 h-4" /> Classes ({subjectDetails.classes.length})</h3>
                {subjectDetails.classes.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Class</th>
                          <th className="px-3 py-2 text-left">Teacher</th>
                          <th className="px-3 py-2 text-left">Periods/Week</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {subjectDetails.classes.map((cs, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium">{cs.class_name}</td>
                            <td className="px-3 py-2">{cs.teacher_name || 'Not assigned'}</td>
                            <td className="px-3 py-2">{cs.periods_per_week}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Not assigned to any class</p>
                )}
              </div>

              {/* Teachers teaching this subject */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Teachers ({subjectDetails.teachers.length})</h3>
                {subjectDetails.teachers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {subjectDetails.teachers.map((t, idx) => (
                      <div key={idx} className="px-3 py-2 bg-green-50 rounded-lg">
                        <p className="font-medium text-green-700">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.classes?.length || 0} class(es)</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No teachers assigned</p>
                )}
              </div>

              {/* Prerequisites */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Link className="w-4 h-4" /> Prerequisites ({subjectDetails.prerequisites?.length || 0})</h3>
                {subjectDetails.prerequisites?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {subjectDetails.prerequisites.map((p, idx) => (
                      <div key={idx} className={`px-3 py-2 rounded-lg ${p.is_mandatory ? 'bg-red-50' : 'bg-yellow-50'}`}>
                        <p className={`font-medium ${p.is_mandatory ? 'text-red-700' : 'text-yellow-700'}`}>{p.prerequisite_name}</p>
                        <p className="text-xs text-gray-500">{p.is_mandatory ? 'Required' : 'Recommended'}{p.min_grade ? ` (Min: ${p.min_grade})` : ''}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No prerequisites</p>
                )}
              </div>

              {/* Required By */}
              {subjectDetails.required_by?.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Required By ({subjectDetails.required_by.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {subjectDetails.required_by.map((r, idx) => (
                      <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">{r.subject_name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prerequisites Management Modal */}
      {showPrerequisitesModal && selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-semibold">Manage Prerequisites</h2>
                <p className="text-sm text-gray-500">{selectedSubject.subject_name}</p>
              </div>
              <button onClick={() => setShowPrerequisitesModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              {/* Add Prerequisite Form */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-3">Add Prerequisite</h4>
                <div className="space-y-3">
                  <select
                    value={prerequisiteForm.prerequisite_id}
                    onChange={(e) => setPrerequisiteForm({ ...prerequisiteForm, prerequisite_id: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">Select a subject...</option>
                    {availableForPrerequisite.map(s => (
                      <option key={s.id} value={s.id}>{s.subject_name} ({s.subject_code})</option>
                    ))}
                  </select>
                  <div className="flex gap-3">
                    <select
                      value={prerequisiteForm.is_mandatory}
                      onChange={(e) => setPrerequisiteForm({ ...prerequisiteForm, is_mandatory: e.target.value })}
                      className="input flex-1"
                    >
                      <option value="1">Required</option>
                      <option value="0">Recommended</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Min Grade (e.g., C)"
                      value={prerequisiteForm.min_grade}
                      onChange={(e) => setPrerequisiteForm({ ...prerequisiteForm, min_grade: e.target.value })}
                      className="input w-24"
                    />
                  </div>
                  <button onClick={handleAddPrerequisite} className="btn btn-primary w-full" disabled={!prerequisiteForm.prerequisite_id}>
                    Add Prerequisite
                  </button>
                </div>
              </div>

              {/* Current Prerequisites */}
              <div>
                <h4 className="font-medium mb-3">Current Prerequisites ({subjectDetails.prerequisites?.length || 0})</h4>
                {subjectDetails.prerequisites?.length > 0 ? (
                  <div className="space-y-2">
                    {subjectDetails.prerequisites.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{p.prerequisite_name}</p>
                          <p className="text-xs text-gray-500">
                            {p.is_mandatory == 1 ? 'Required' : 'Recommended'}
                            {p.min_grade ? ` • Min Grade: ${p.min_grade}` : ''}
                          </p>
                        </div>
                        <button onClick={() => handleRemovePrerequisite(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">No prerequisites defined</p>
                )}
              </div>

              {/* Required By Section */}
              {subjectDetails.required_by?.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium mb-3 text-purple-700">This subject is required by:</h4>
                  <div className="flex flex-wrap gap-2">
                    {subjectDetails.required_by.map((r, idx) => (
                      <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">{r.subject_name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Import Subjects</h2>
              <button onClick={() => { setShowImportModal(false); setImportData([]); setImportErrors([]); }}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              {importErrors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium text-red-700 mb-2">Errors found:</p>
                  <ul className="text-sm text-red-600 list-disc list-inside">
                    {importErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                  </ul>
                </div>
              )}

              <p className="text-sm text-gray-600 mb-4">
                {importData.length} subject(s) ready to import. Review before importing:
              </p>

              <div className="border rounded-lg overflow-hidden max-h-72 overflow-y-auto mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Subject Name</th>
                      <th className="px-3 py-2 text-left">Code</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Credits</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {importData.map((s, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{s.subject_name}</td>
                        <td className="px-3 py-2 font-mono text-xs">{s.subject_code}</td>
                        <td className="px-3 py-2">{s.category}</td>
                        <td className="px-3 py-2">{s.credit_hours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-xs text-gray-600">
                  <strong>CSV Format:</strong> Subject Name, Code, Category, Credit Hours, Description<br/>
                  <strong>Example:</strong> Mathematics, MATH101, core, 3, Basic mathematics course
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => { setShowImportModal(false); setImportData([]); }} className="btn bg-gray-200 hover:bg-gray-300">Cancel</button>
                <button onClick={handleImportSubmit} className="btn btn-primary" disabled={importData.length === 0}>
                  Import {importData.length} Subject(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
