import { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, BookOpen, X, Save, Search, Download, Printer, Copy,
  Users, Clock, BarChart3, Filter, CheckSquare, ArrowLeftRight, FileText
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

export default function ClassSubjects() {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [classSubjects, setClassSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    subject_id: '',
    teacher_id: '',
    periods_per_week: 3,
    is_mandatory: 1
  });

  // New state for enhanced features
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showWorkloadModal, setShowWorkloadModal] = useState(false);
  const [bulkSubjects, setBulkSubjects] = useState([]);
  const [copyFromClass, setCopyFromClass] = useState('');
  const [compareClass, setCompareClass] = useState('');
  const [compareData, setCompareData] = useState(null);
  const [teacherWorkloads, setTeacherWorkloads] = useState([]);

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchClassSubjects();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/classes.php`);
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subjects.php`);
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/teachers.php`);
      setTeachers(response.data.teachers || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchClassSubjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/class_subjects.php?class_id=${selectedClass}`);
      setClassSubjects(response.data.class_subjects || []);
    } catch (error) {
      console.error('Error fetching class subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherWorkloads = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/class_subjects.php`);
      const allSubjects = response.data.class_subjects || [];
      
      // Group by teacher
      const workloadMap = {};
      allSubjects.forEach(cs => {
        if (cs.teacher_id) {
          if (!workloadMap[cs.teacher_id]) {
            workloadMap[cs.teacher_id] = {
              teacher_id: cs.teacher_id,
              teacher_name: cs.teacher_name,
              subjects: [],
              totalPeriods: 0,
              classCount: 0
            };
          }
          workloadMap[cs.teacher_id].subjects.push(cs);
          workloadMap[cs.teacher_id].totalPeriods += parseInt(cs.periods_per_week) || 0;
          workloadMap[cs.teacher_id].classCount++;
        }
      });
      
      setTeacherWorkloads(Object.values(workloadMap).sort((a, b) => b.totalPeriods - a.totalPeriods));
      setShowWorkloadModal(true);
    } catch (error) {
      console.error('Error fetching workloads:', error);
    }
  };

  const fetchCompareData = async () => {
    if (!compareClass || !selectedClass) return;
    try {
      const [current, compare] = await Promise.all([
        axios.get(`${API_BASE_URL}/class_subjects.php?class_id=${selectedClass}`),
        axios.get(`${API_BASE_URL}/class_subjects.php?class_id=${compareClass}`)
      ]);
      
      const currentSubjects = current.data.class_subjects || [];
      const compareSubjects = compare.data.class_subjects || [];
      
      const currentIds = new Set(currentSubjects.map(s => s.subject_id));
      const compareIds = new Set(compareSubjects.map(s => s.subject_id));
      
      setCompareData({
        current: currentSubjects,
        compare: compareSubjects,
        onlyInCurrent: currentSubjects.filter(s => !compareIds.has(s.subject_id)),
        onlyInCompare: compareSubjects.filter(s => !currentIds.has(s.subject_id)),
        inBoth: currentSubjects.filter(s => compareIds.has(s.subject_id))
      });
    } catch (error) {
      console.error('Error comparing:', error);
    }
  };

  const handleAdd = () => {
    setEditingSubject(null);
    setFormData({
      subject_id: '',
      teacher_id: '',
      periods_per_week: 3,
      is_mandatory: 1
    });
    setShowModal(true);
  };

  const handleEdit = (classSubject) => {
    setEditingSubject(classSubject);
    setFormData({
      subject_id: classSubject.subject_id,
      teacher_id: classSubject.teacher_id || '',
      periods_per_week: classSubject.periods_per_week,
      is_mandatory: classSubject.is_mandatory
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this subject from the class?')) {
      try {
        await axios.delete(`${API_BASE_URL}/class_subjects.php?id=${id}`);
        fetchClassSubjects();
        alert('Subject removed successfully!');
      } catch (error) {
        console.error('Error deleting class subject:', error);
        alert('Failed to remove subject');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      alert('Please select a class first');
      return;
    }

    try {
      const data = {
        class_id: selectedClass,
        ...formData
      };

      if (editingSubject) {
        await axios.put(`${API_BASE_URL}/class_subjects.php?id=${editingSubject.id}`, data);
        alert('Subject updated successfully!');
      } else {
        await axios.post(`${API_BASE_URL}/class_subjects.php`, data);
        alert('Subject added successfully!');
      }
      setShowModal(false);
      fetchClassSubjects();
    } catch (error) {
      console.error('Error saving class subject:', error);
      alert('Failed to save: ' + (error.response?.data?.error || error.message));
    }
  };

  // Bulk add subjects
  const handleBulkAdd = async () => {
    if (bulkSubjects.length === 0) {
      alert('Please select at least one subject');
      return;
    }
    try {
      let added = 0;
      for (const subjectId of bulkSubjects) {
        try {
          await axios.post(`${API_BASE_URL}/class_subjects.php`, {
            class_id: selectedClass,
            subject_id: subjectId,
            periods_per_week: 3,
            is_mandatory: 1
          });
          added++;
        } catch (e) {
          // Subject might already exist
        }
      }
      alert(`${added} subject(s) added successfully!`);
      setShowBulkModal(false);
      setBulkSubjects([]);
      fetchClassSubjects();
    } catch (error) {
      console.error('Error bulk adding:', error);
      alert('Failed to add subjects');
    }
  };

  // Copy curriculum from another class
  const handleCopyCurriculum = async () => {
    if (!copyFromClass) {
      alert('Please select a class to copy from');
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/class_subjects.php?class_id=${copyFromClass}`);
      const sourceCurriculum = response.data.class_subjects || [];
      
      let copied = 0;
      for (const cs of sourceCurriculum) {
        try {
          await axios.post(`${API_BASE_URL}/class_subjects.php`, {
            class_id: selectedClass,
            subject_id: cs.subject_id,
            teacher_id: cs.teacher_id,
            periods_per_week: cs.periods_per_week,
            is_mandatory: cs.is_mandatory
          });
          copied++;
        } catch (e) {
          // Subject might already exist
        }
      }
      alert(`${copied} subject(s) copied successfully!`);
      setShowCopyModal(false);
      setCopyFromClass('');
      fetchClassSubjects();
    } catch (error) {
      console.error('Error copying curriculum:', error);
      alert('Failed to copy curriculum');
    }
  };

  // Export curriculum
  const handleExport = (format) => {
    const data = filteredSubjects.map(cs => ({
      'Subject': cs.subject_name,
      'Code': cs.subject_code,
      'Teacher': cs.teacher_name || 'Not Assigned',
      'Periods/Week': cs.periods_per_week,
      'Type': cs.is_mandatory == 1 ? 'Mandatory' : 'Optional'
    }));

    if (format === 'csv') {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `curriculum_${selectedClassName.replace(/\s+/g, '_')}.csv`;
      a.click();
    } else if (format === 'print') {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html><head><title>Curriculum - ${selectedClassName}</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #2563eb; color: white; }
          h1 { color: #1f2937; }
          .summary { margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px; }
        </style></head><body>
        <h1>Curriculum for ${selectedClassName}</h1>
        <div class="summary">
          <strong>Total Subjects:</strong> ${filteredSubjects.length} | 
          <strong>Total Periods/Week:</strong> ${totalPeriods} |
          <strong>Mandatory:</strong> ${filteredSubjects.filter(s => s.is_mandatory == 1).length} |
          <strong>Optional:</strong> ${filteredSubjects.filter(s => s.is_mandatory != 1).length}
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

  const selectedClassName = classes.find(c => c.id == selectedClass)?.class_name || 'Select a class';
  const compareClassName = classes.find(c => c.id == compareClass)?.class_name || '';

  // Filter subjects
  const filteredSubjects = classSubjects.filter(cs => {
    const matchesSearch = !searchTerm || 
      cs.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cs.subject_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cs.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || 
      (typeFilter === 'mandatory' && cs.is_mandatory == 1) ||
      (typeFilter === 'optional' && cs.is_mandatory != 1);
    return matchesSearch && matchesType;
  });

  // Calculate totals
  const totalPeriods = filteredSubjects.reduce((sum, cs) => sum + (parseInt(cs.periods_per_week) || 0), 0);
  const mandatoryCount = filteredSubjects.filter(s => s.is_mandatory == 1).length;
  const optionalCount = filteredSubjects.filter(s => s.is_mandatory != 1).length;

  // Get unassigned subjects for bulk add
  const assignedSubjectIds = new Set(classSubjects.map(cs => cs.subject_id));
  const unassignedSubjects = subjects.filter(s => !assignedSubjectIds.has(s.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Class Curriculum Management</h1>
        <p className="text-gray-600 mt-1">Assign subjects to classes and manage teachers</p>
      </div>

      {/* Class Selection & Actions */}
      <div className="card p-6">
        <div className="flex flex-wrap gap-4 items-end justify-between">
          <div className="flex-1 min-w-[250px] max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Class *</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input text-lg font-medium"
            >
              <option value="">-- Select a Class --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.class_name} ({cls.class_code})
                </option>
              ))}
            </select>
          </div>
          {selectedClass && (
            <div className="flex flex-wrap gap-2">
              <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Subject
              </button>
              <button onClick={() => setShowBulkModal(true)} className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" /> Bulk Add
              </button>
              <button onClick={() => setShowCopyModal(true)} className="btn bg-orange-600 text-white hover:bg-orange-700 flex items-center gap-2">
                <Copy className="w-4 h-4" /> Copy From
              </button>
              <button onClick={() => { setCompareClass(''); setCompareData(null); setShowCompareModal(true); }} className="btn bg-teal-600 text-white hover:bg-teal-700 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4" /> Compare
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex gap-2">
        <button onClick={fetchTeacherWorkloads} className="btn bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2">
          <Users className="w-4 h-4" /> Teacher Workloads
        </button>
      </div>

      {/* Class Subjects Table */}
      {selectedClass && (
        <div className="card overflow-hidden">
          {/* Header with Stats */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Curriculum for {selectedClassName}</h2>
                <div className="flex gap-4 mt-1 text-sm">
                  <span className="text-gray-600">{filteredSubjects.length} subjects</span>
                  <span className="text-blue-600 font-medium">{totalPeriods} periods/week</span>
                  <span className="text-green-600">{mandatoryCount} mandatory</span>
                  <span className="text-orange-600">{optionalCount} optional</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleExport('csv')} className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-1 text-sm py-1.5">
                  <Download className="w-4 h-4" /> CSV
                </button>
                <button onClick={() => handleExport('print')} className="btn bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-1 text-sm py-1.5">
                  <Printer className="w-4 h-4" /> Print
                </button>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="p-4 border-b flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input w-auto">
              <option value="">All Types</option>
              <option value="mandatory">Mandatory</option>
              <option value="optional">Optional</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periods</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">Loading subjects...</td>
                  </tr>
                ) : filteredSubjects.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      {classSubjects.length === 0 
                        ? 'No subjects assigned yet. Click "Add Subject" to get started.'
                        : 'No subjects match your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredSubjects.map((cs) => (
                    <tr key={cs.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-900">{cs.subject_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-gray-600">{cs.subject_code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cs.teacher_name ? 'text-gray-900' : 'text-gray-400 italic'}>{cs.teacher_name || 'Not assigned'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {cs.periods_per_week}/wk
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          cs.is_mandatory == 1 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {cs.is_mandatory == 1 ? 'Mandatory' : 'Optional'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(cs)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(cs.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Remove">
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
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingSubject ? 'Edit Subject' : 'Add Subject to Class'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class
                </label>
                <input
                  type="text"
                  value={selectedClassName}
                  disabled
                  className="input bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  required
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="input"
                  disabled={editingSubject}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subject_name} ({subject.subject_code})
                    </option>
                  ))}
                </select>
                {editingSubject && (
                  <p className="text-xs text-gray-500 mt-1">Subject cannot be changed when editing</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teacher
                </label>
                <select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="input"
                >
                  <option value="">No Teacher Assigned</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.first_name} {teacher.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Periods per Week *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="10"
                  value={formData.periods_per_week}
                  onChange={(e) => setFormData({ ...formData, periods_per_week: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  required
                  value={formData.is_mandatory}
                  onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.value })}
                  className="input"
                >
                  <option value="1">Mandatory</option>
                  <option value="0">Optional</option>
                </select>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {editingSubject ? 'Update' : 'Add'} Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-semibold">Bulk Add Subjects</h2>
                <p className="text-sm text-gray-500">{selectedClassName}</p>
              </div>
              <button onClick={() => setShowBulkModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Select subjects to add (subjects already assigned are hidden):</p>
              
              <div className="space-y-2 max-h-72 overflow-y-auto border rounded-lg p-2">
                {unassignedSubjects.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">All subjects are already assigned</p>
                ) : (
                  unassignedSubjects.map(subject => (
                    <label key={subject.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bulkSubjects.includes(subject.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkSubjects([...bulkSubjects, subject.id]);
                          } else {
                            setBulkSubjects(bulkSubjects.filter(id => id !== subject.id));
                          }
                        }}
                        className="rounded"
                      />
                      <div>
                        <p className="font-medium">{subject.subject_name}</p>
                        <p className="text-xs text-gray-500">{subject.subject_code}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">{bulkSubjects.length} selected</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowBulkModal(false)} className="btn bg-gray-200 hover:bg-gray-300">Cancel</button>
                  <button onClick={handleBulkAdd} className="btn btn-primary" disabled={bulkSubjects.length === 0}>Add Selected</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy Curriculum Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Copy Curriculum</h2>
                <p className="text-sm text-gray-500">To: {selectedClassName}</p>
              </div>
              <button onClick={() => setShowCopyModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Copy all subjects from another class. Existing subjects will be skipped.</p>
              
              <div>
                <label className="block text-sm font-medium mb-2">Copy From Class *</label>
                <select value={copyFromClass} onChange={(e) => setCopyFromClass(e.target.value)} className="input w-full">
                  <option value="">Select a class</option>
                  {classes.filter(c => c.id != selectedClass).map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <button onClick={() => setShowCopyModal(false)} className="btn bg-gray-200 hover:bg-gray-300">Cancel</button>
                <button onClick={handleCopyCurriculum} className="btn bg-orange-600 text-white hover:bg-orange-700" disabled={!copyFromClass}>
                  Copy Curriculum
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Compare Curriculum</h2>
              <button onClick={() => setShowCompareModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Class A</label>
                  <input type="text" value={selectedClassName} disabled className="input w-full bg-gray-50" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Class B</label>
                  <select value={compareClass} onChange={(e) => setCompareClass(e.target.value)} className="input w-full">
                    <option value="">Select a class</option>
                    {classes.filter(c => c.id != selectedClass).map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={fetchCompareData} className="btn btn-primary" disabled={!compareClass}>Compare</button>
                </div>
              </div>

              {compareData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-blue-700">{compareData.inBoth.length}</p>
                      <p className="text-sm text-gray-600">In Both</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">{compareData.onlyInCurrent.length}</p>
                      <p className="text-sm text-gray-600">Only in {selectedClassName}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-2xl font-bold text-orange-700">{compareData.onlyInCompare.length}</p>
                      <p className="text-sm text-gray-600">Only in {compareClassName}</p>
                    </div>
                  </div>

                  {compareData.onlyInCurrent.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">Only in {selectedClassName}:</h4>
                      <div className="flex flex-wrap gap-2">
                        {compareData.onlyInCurrent.map(s => (
                          <span key={s.id} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">{s.subject_name}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {compareData.onlyInCompare.length > 0 && (
                    <div>
                      <h4 className="font-medium text-orange-700 mb-2">Only in {compareClassName}:</h4>
                      <div className="flex flex-wrap gap-2">
                        {compareData.onlyInCompare.map(s => (
                          <span key={s.id} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">{s.subject_name}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {compareData.inBoth.length > 0 && (
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2">Common Subjects:</h4>
                      <div className="flex flex-wrap gap-2">
                        {compareData.inBoth.map(s => (
                          <span key={s.id} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">{s.subject_name}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Teacher Workload Modal */}
      {showWorkloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold">Teacher Workloads</h2>
              <button onClick={() => setShowWorkloadModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Overview of teaching assignments across all classes</p>
              
              <div className="space-y-4">
                {teacherWorkloads.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No teacher assignments found</p>
                ) : (
                  teacherWorkloads.map(tw => (
                    <div key={tw.teacher_id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{tw.teacher_name}</p>
                            <p className="text-sm text-gray-500">{tw.classCount} class(es)</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-indigo-600">{tw.totalPeriods}</p>
                          <p className="text-xs text-gray-500">periods/week</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tw.subjects.map((s, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {s.subject_name} ({s.class_name}) - {s.periods_per_week}p
                          </span>
                        ))}
                      </div>
                      {/* Workload indicator */}
                      <div className="mt-3">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${tw.totalPeriods > 25 ? 'bg-red-500' : tw.totalPeriods > 20 ? 'bg-orange-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(tw.totalPeriods / 30 * 100, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {tw.totalPeriods > 25 ? 'Overloaded' : tw.totalPeriods > 20 ? 'Heavy workload' : 'Normal workload'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
