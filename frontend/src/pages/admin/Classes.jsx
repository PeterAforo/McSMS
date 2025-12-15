import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit, Trash2, School, X, Search, Filter, Eye, Users, BookOpen,
  Download, Upload, ChevronUp, ChevronDown, BarChart3, Calendar, UserPlus,
  FileText, Printer, ArrowUpRight, GraduationCap, Clock, CheckCircle, XCircle
} from 'lucide-react';
import { classesAPI } from '../../services/api';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function Classes() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    class_name: '',
    class_code: '',
    level: 'primary',
    grade: '',
    section: '',
    capacity: 30,
    class_teacher_id: '',
    room_number: '',
    academic_year: '2024/2025',
    status: 'active',
    description: ''
  });

  // New state for enhanced features
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classDetails, setClassDetails] = useState(null);
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [promoteToClass, setPromoteToClass] = useState('');
  const [sortField, setSortField] = useState('class_name');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchSubjects();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await classesAPI.getAll();
      setClasses(response.data.classes || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      alert('Failed to load classes');
    } finally {
      setLoading(false);
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

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subjects.php`);
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchClassDetails = async (classId) => {
    try {
      const [studentsRes, subjectsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/students.php?class_id=${classId}`),
        axios.get(`${API_BASE_URL}/class_subjects.php?class_id=${classId}`)
      ]);
      
      // Get attendance and performance stats
      let stats = { avgAttendance: 0, avgGrade: 0 };
      try {
        const statsRes = await axios.get(`${API_BASE_URL}/class_stats.php?class_id=${classId}`);
        stats = statsRes.data.stats || stats;
      } catch (e) {}
      
      setClassDetails({
        students: studentsRes.data.students || [],
        subjects: subjectsRes.data.subjects || subjectsRes.data.class_subjects || [],
        stats
      });
    } catch (error) {
      console.error('Error fetching class details:', error);
      setClassDetails({ students: [], subjects: [], stats: { avgAttendance: 0, avgGrade: 0 } });
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/students.php`);
      setAllStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleViewDetails = async (cls) => {
    setSelectedClass(cls);
    await fetchClassDetails(cls.id);
    setShowDetailsModal(true);
  };

  const handleManageSubjects = (cls) => {
    setSelectedClass(cls);
    fetchClassDetails(cls.id);
    setShowSubjectsModal(true);
  };

  const handleEnrollStudents = async (cls) => {
    setSelectedClass(cls);
    await fetchAllStudents();
    await fetchClassDetails(cls.id);
    setSelectedStudents([]);
    setShowEnrollModal(true);
  };

  const handlePromoteStudents = async (cls) => {
    setSelectedClass(cls);
    await fetchClassDetails(cls.id);
    setSelectedStudents([]);
    setPromoteToClass('');
    setShowPromoteModal(true);
  };

  const handleAdd = () => {
    setEditingClass(null);
    setFormData({
      class_name: '',
      class_code: '',
      level: 'primary',
      grade: '',
      section: '',
      capacity: 30,
      class_teacher_id: '',
      room_number: '',
      academic_year: '2024/2025',
      status: 'active',
      description: ''
    });
    setShowModal(true);
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setFormData({
      class_name: cls.class_name,
      class_code: cls.class_code,
      level: cls.level,
      grade: cls.grade || '',
      section: cls.section || '',
      capacity: cls.capacity,
      class_teacher_id: cls.class_teacher_id || '',
      room_number: cls.room_number || '',
      academic_year: cls.academic_year,
      status: cls.status,
      description: cls.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        await classesAPI.delete(id);
        fetchClasses();
        alert('Class deleted successfully!');
      } catch (error) {
        console.error('Error deleting class:', error);
        alert('Failed to delete class');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await classesAPI.update(editingClass.id, formData);
        alert('Class updated successfully!');
      } else {
        await classesAPI.create(formData);
        alert('Class created successfully!');
      }
      setShowModal(false);
      fetchClasses();
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Failed to save class: ' + (error.response?.data?.error || error.message));
    }
  };

  const getLevelBadge = (level) => {
    const colors = {
      creche: 'bg-pink-100 text-pink-700',
      nursery: 'bg-purple-100 text-purple-700',
      kg: 'bg-blue-100 text-blue-700',
      primary: 'bg-green-100 text-green-700',
      jhs: 'bg-orange-100 text-orange-700',
      shs: 'bg-red-100 text-red-700'
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };

  // Enroll students to class
  const handleEnrollSubmit = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select students to enroll');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/class_enrollment.php`, {
        class_id: selectedClass.id,
        student_ids: selectedStudents,
        action: 'enroll'
      });
      alert(`${selectedStudents.length} student(s) enrolled successfully!`);
      setShowEnrollModal(false);
      fetchClassDetails(selectedClass.id);
    } catch (error) {
      console.error('Error enrolling students:', error);
      alert('Failed to enroll students');
    }
  };

  // Remove student from class
  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Remove this student from the class?')) return;
    try {
      await axios.post(`${API_BASE_URL}/class_enrollment.php`, {
        class_id: selectedClass.id,
        student_ids: [studentId],
        action: 'remove'
      });
      fetchClassDetails(selectedClass.id);
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Failed to remove student');
    }
  };

  // Promote students
  const handlePromoteSubmit = async () => {
    if (selectedStudents.length === 0 || !promoteToClass) {
      alert('Please select students and target class');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/class_enrollment.php`, {
        from_class_id: selectedClass.id,
        to_class_id: promoteToClass,
        student_ids: selectedStudents,
        action: 'promote'
      });
      alert(`${selectedStudents.length} student(s) promoted successfully!`);
      setShowPromoteModal(false);
      fetchClasses();
    } catch (error) {
      console.error('Error promoting students:', error);
      alert('Failed to promote students');
    }
  };

  // Add/Remove subject from class
  const handleToggleSubject = async (subjectId, isAssigned) => {
    try {
      await axios.post(`${API_BASE_URL}/class_subjects.php`, {
        class_id: selectedClass.id,
        subject_id: subjectId,
        action: isAssigned ? 'remove' : 'add'
      });
      fetchClassDetails(selectedClass.id);
    } catch (error) {
      console.error('Error updating class subjects:', error);
      alert('Failed to update subjects');
    }
  };

  // Export class list
  const handleExport = (format) => {
    const data = filteredClasses.map(c => ({
      'Class Name': c.class_name,
      'Code': c.class_code,
      'Level': c.level?.toUpperCase(),
      'Class Teacher': c.teacher_name || '-',
      'Room': c.room_number || '-',
      'Capacity': c.capacity,
      'Status': c.status
    }));

    if (format === 'csv') {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(row => Object.values(row).join(','));
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'classes_export.csv';
      a.click();
    } else if (format === 'print') {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html><head><title>Classes List</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          h1 { margin-bottom: 20px; }
        </style></head><body>
        <h1>Classes List</h1>
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

  // Sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort classes
  const filteredClasses = classes
    .filter(c => {
      const matchesSearch = !searchTerm || 
        c.class_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.class_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = !levelFilter || c.level === levelFilter;
      const matchesStatus = !statusFilter || c.status === statusFilter;
      return matchesSearch && matchesLevel && matchesStatus;
    })
    .sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

  const stats = [
    { label: 'Total Classes', value: classes.length, color: 'bg-blue-500', icon: School },
    { label: 'Active', value: classes.filter(c => c.status === 'active').length, color: 'bg-green-500', icon: CheckCircle },
    { label: 'Total Capacity', value: classes.reduce((sum, c) => sum + parseInt(c.capacity || 0), 0), color: 'bg-purple-500', icon: Users },
    { label: 'Levels', value: [...new Set(classes.map(c => c.level))].length, color: 'bg-orange-500', icon: GraduationCap },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes Management</h1>
          <p className="text-gray-600 mt-1">Manage school classes and sections</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Class
        </button>
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
                placeholder="Search classes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="">All Levels</option>
              <option value="creche">Creche</option>
              <option value="nursery">Nursery</option>
              <option value="kg">KG</option>
              <option value="primary">Primary</option>
              <option value="jhs">JHS</option>
              <option value="shs">SHS</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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

      {/* Classes Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('class_name')}>
                  <div className="flex items-center gap-1">
                    Class Name
                    {sortField === 'class_name' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('level')}>
                  <div className="flex items-center gap-1">
                    Level
                    {sortField === 'level' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class Teacher</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('capacity')}>
                  <div className="flex items-center gap-1">
                    Capacity
                    {sortField === 'capacity' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : filteredClasses.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">No classes found</td></tr>
              ) : (
                filteredClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{cls.class_name}</td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{cls.class_code}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelBadge(cls.level)}`}>
                        {cls.level?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{cls.teacher_name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{cls.room_number || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{cls.capacity}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        cls.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {cls.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleViewDetails(cls)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEnrollStudents(cls)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Enroll Students">
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleManageSubjects(cls)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Manage Subjects">
                          <BookOpen className="w-4 h-4" />
                        </button>
                        <button onClick={() => handlePromoteStudents(cls)} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded" title="Promote Students">
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(cls)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(cls.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
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
        {filteredClasses.length > 0 && (
          <div className="px-4 py-3 border-t bg-gray-50 text-sm text-gray-600">
            Showing {filteredClasses.length} of {classes.length} classes
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingClass ? 'Edit Class' : 'Add New Class'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.class_code}
                    onChange={(e) => setFormData({ ...formData, class_code: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level *</label>
                  <select
                    required
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="input"
                  >
                    <option value="creche">Creche</option>
                    <option value="nursery">Nursery</option>
                    <option value="kg">KG</option>
                    <option value="primary">Primary</option>
                    <option value="jhs">JHS</option>
                    <option value="shs">SHS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                  <input
                    type="number"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="input"
                    placeholder="A, B, C"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class Teacher</label>
                  <select
                    value={formData.class_teacher_id}
                    onChange={(e) => setFormData({ ...formData, class_teacher_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Class Teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Room Number</label>
                  <input
                    type="text"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                  <input
                    type="text"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    className="input"
                  />
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
                    rows="3"
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
                  {editingClass ? 'Update Class' : 'Add Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Details Modal */}
      {showDetailsModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-semibold">{selectedClass.class_name}</h2>
                <p className="text-sm text-gray-500">{selectedClass.class_code} • {selectedClass.level?.toUpperCase()}</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              {/* Class Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-700">{classDetails?.students?.length || 0}</p>
                  <p className="text-xs text-gray-600">Students</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <BookOpen className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-purple-700">{classDetails?.subjects?.length || 0}</p>
                  <p className="text-xs text-gray-600">Subjects</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <BarChart3 className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">{classDetails?.stats?.avgAttendance || 0}%</p>
                  <p className="text-xs text-gray-600">Avg Attendance</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg text-center">
                  <GraduationCap className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-orange-700">{classDetails?.stats?.avgGrade || 0}%</p>
                  <p className="text-xs text-gray-600">Avg Grade</p>
                </div>
              </div>

              {/* Class Details */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div><span className="text-gray-500">Class Teacher:</span> <span className="font-medium">{selectedClass.teacher_name || 'Not assigned'}</span></div>
                <div><span className="text-gray-500">Room:</span> <span className="font-medium">{selectedClass.room_number || 'N/A'}</span></div>
                <div><span className="text-gray-500">Capacity:</span> <span className="font-medium">{selectedClass.capacity}</span></div>
                <div><span className="text-gray-500">Academic Year:</span> <span className="font-medium">{selectedClass.academic_year}</span></div>
              </div>

              {/* Students List */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Students ({classDetails?.students?.length || 0})</h3>
                {classDetails?.students?.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Student ID</th>
                          <th className="px-3 py-2 text-left">Gender</th>
                          <th className="px-3 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {classDetails.students.map(student => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">{student.first_name} {student.last_name}</td>
                            <td className="px-3 py-2 font-mono text-xs">{student.student_id}</td>
                            <td className="px-3 py-2 capitalize">{student.gender}</td>
                            <td className="px-3 py-2">
                              <button onClick={() => handleRemoveStudent(student.id)} className="text-red-600 hover:text-red-700 text-xs">Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No students enrolled</p>
                )}
              </div>

              {/* Subjects List */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Subjects ({classDetails?.subjects?.length || 0})</h3>
                {classDetails?.subjects?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {classDetails.subjects.map((sub, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {sub.subject_name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No subjects assigned</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enroll Students Modal */}
      {showEnrollModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-semibold">Enroll Students</h2>
                <p className="text-sm text-gray-500">{selectedClass.class_name}</p>
              </div>
              <button onClick={() => setShowEnrollModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Select students to enroll in this class. Students already in a class are marked.</p>
              
              <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left w-10">
                        <input 
                          type="checkbox" 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents(allStudents.filter(s => !s.class_id || s.class_id === selectedClass.id).map(s => s.id));
                            } else {
                              setSelectedStudents([]);
                            }
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Student ID</th>
                      <th className="px-3 py-2 text-left">Current Class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {allStudents.filter(s => !classDetails?.students?.find(cs => cs.id === s.id)).map(student => (
                      <tr key={student.id} className={`hover:bg-gray-50 ${student.class_id && student.class_id !== selectedClass.id ? 'opacity-50' : ''}`}>
                        <td className="px-3 py-2">
                          <input 
                            type="checkbox" 
                            checked={selectedStudents.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudents([...selectedStudents, student.id]);
                              } else {
                                setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                              }
                            }}
                            disabled={student.class_id && student.class_id !== selectedClass.id}
                            className="rounded"
                          />
                        </td>
                        <td className="px-3 py-2">{student.first_name} {student.last_name}</td>
                        <td className="px-3 py-2 font-mono text-xs">{student.student_id}</td>
                        <td className="px-3 py-2 text-xs">{student.class_name || 'None'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">{selectedStudents.length} student(s) selected</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowEnrollModal(false)} className="btn bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
                  <button onClick={handleEnrollSubmit} className="btn btn-primary" disabled={selectedStudents.length === 0}>Enroll Students</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Promote Students Modal */}
      {showPromoteModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-semibold">Promote Students</h2>
                <p className="text-sm text-gray-500">From: {selectedClass.class_name}</p>
              </div>
              <button onClick={() => setShowPromoteModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Promote To Class *</label>
                <select 
                  value={promoteToClass} 
                  onChange={(e) => setPromoteToClass(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select target class</option>
                  {classes.filter(c => c.id !== selectedClass.id).map(c => (
                    <option key={c.id} value={c.id}>{c.class_name} ({c.level?.toUpperCase()})</option>
                  ))}
                </select>
              </div>

              <p className="text-sm text-gray-600 mb-4">Select students to promote:</p>
              
              <div className="border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left w-10">
                        <input 
                          type="checkbox" 
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudents(classDetails?.students?.map(s => s.id) || []);
                            } else {
                              setSelectedStudents([]);
                            }
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Student ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {classDetails?.students?.map(student => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <input 
                            type="checkbox" 
                            checked={selectedStudents.includes(student.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudents([...selectedStudents, student.id]);
                              } else {
                                setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                              }
                            }}
                            className="rounded"
                          />
                        </td>
                        <td className="px-3 py-2">{student.first_name} {student.last_name}</td>
                        <td className="px-3 py-2 font-mono text-xs">{student.student_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">{selectedStudents.length} student(s) selected</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowPromoteModal(false)} className="btn bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
                  <button onClick={handlePromoteSubmit} className="btn bg-orange-600 text-white hover:bg-orange-700" disabled={selectedStudents.length === 0 || !promoteToClass}>
                    Promote Students
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Subjects Modal */}
      {showSubjectsModal && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-xl font-semibold">Manage Subjects</h2>
                <p className="text-sm text-gray-500">{selectedClass.class_name}</p>
              </div>
              <button onClick={() => setShowSubjectsModal(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Toggle subjects for this class:</p>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {subjects.map(subject => {
                  const isAssigned = classDetails?.subjects?.some(s => s.subject_id === subject.id || s.id === subject.id);
                  return (
                    <div 
                      key={subject.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        isAssigned ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleToggleSubject(subject.id, isAssigned)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAssigned ? 'bg-purple-600' : 'bg-gray-200'}`}>
                          <BookOpen className={`w-4 h-4 ${isAssigned ? 'text-white' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <p className="font-medium">{subject.subject_name}</p>
                          <p className="text-xs text-gray-500">{subject.subject_code}</p>
                        </div>
                      </div>
                      {isAssigned ? (
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t">
                <button onClick={() => setShowSubjectsModal(false)} className="btn btn-primary w-full">Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
