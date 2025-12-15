import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, Eye, Users as UsersIcon, UserCheck, UserX, Download, X, Upload, Filter, ChevronDown, MoreVertical, FileText, Award, AlertTriangle, Clock, Calendar, CreditCard, ArrowUpRight, CheckCircle, XCircle, RefreshCw, Printer, History, Heart, StickyNote, GraduationCap } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const API = `${API_BASE_URL}/student_management.php`;
const OLD_API = `${API_BASE_URL}/students.php`;

export default function Students() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({});
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('student');
  const [editingStudent, setEditingStudent] = useState(null);
  const [importData, setImportData] = useState([]);
  const importFileRef = useRef(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  
  const [formData, setFormData] = useState({
    student_id: '', first_name: '', last_name: '', other_names: '', date_of_birth: '', gender: 'male',
    blood_group: '', nationality: 'Ghanaian', religion: '', email: '', phone: '', address: '', city: '', region: '',
    class_id: '', admission_date: '', status: 'active', guardian_name: '', guardian_phone: '', guardian_email: '',
    guardian_relationship: '', emergency_contact_name: '', emergency_contact_phone: '', medical_conditions: '', allergies: ''
  });

  const [promotionData, setPromotionData] = useState({ student_ids: [], to_class_id: '', promotion_type: 'promotion', promotion_date: new Date().toISOString().split('T')[0] });

  useEffect(() => { fetchStudents(); fetchStats(); fetchClasses(); }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: pagination.page, limit: pagination.limit });
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterClass !== 'all') params.append('class_id', filterClass);
      
      const r = await axios.get(`${API}?resource=students&${params}`);
      setStudents(r.data.students || []);
      if (r.data.pagination) setPagination(r.data.pagination);
    } catch (e) {
      console.error(e);
      try { const r = await axios.get(OLD_API); setStudents(r.data.students || []); } catch (e2) { console.error(e2); }
    } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const r = await axios.get(`${API}?resource=stats`);
      setStats(r.data.stats || {});
    } catch (e) { console.error(e); }
  };

  const fetchClasses = async () => {
    try {
      const r = await axios.get(`${API_BASE_URL}/classes.php`);
      setClasses(r.data.classes || []);
    } catch (e) { console.error(e); }
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    const year = new Date().getFullYear();
    setFormData({
      student_id: `STU${year}${String(students.length + 1).padStart(4, '0')}`,
      first_name: '', last_name: '', other_names: '', date_of_birth: '', gender: 'male',
      blood_group: '', nationality: 'Ghanaian', religion: '', email: '', phone: '', address: '', city: '', region: '',
      class_id: '', admission_date: new Date().toISOString().split('T')[0], status: 'active',
      guardian_name: '', guardian_phone: '', guardian_email: '', guardian_relationship: '',
      emergency_contact_name: '', emergency_contact_phone: '', medical_conditions: '', allergies: ''
    });
    setModalType('student');
    setShowModal(true);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setFormData({ ...student, date_of_birth: student.date_of_birth?.split('T')[0] || '', admission_date: student.admission_date?.split('T')[0] || '' });
    setModalType('student');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await axios.put(`${API}?resource=students&id=${editingStudent.id}`, formData);
        alert('Student updated successfully!');
      } else {
        await axios.post(`${API}?resource=students`, formData);
        alert('Student created successfully!');
      }
      setShowModal(false);
      fetchStudents();
      fetchStats();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || 'Failed to save student');
    }
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await axios.delete(`${API}?resource=students&id=${id}`);
        fetchStudents();
        fetchStats();
        alert('Student deleted!');
      } catch (e) { alert('Failed to delete student'); }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) return alert('No students selected');
    if (!window.confirm(`Delete ${selectedStudents.length} students?`)) return;
    try {
      await axios.post(`${API}?resource=bulk&action=delete`, { student_ids: selectedStudents });
      setSelectedStudents([]);
      fetchStudents();
      fetchStats();
      alert('Students deleted!');
    } catch (e) { alert('Failed to delete students'); }
  };

  const handleBulkStatusChange = async (status) => {
    if (selectedStudents.length === 0) return alert('No students selected');
    try {
      await axios.post(`${API}?resource=bulk&action=update_status`, { student_ids: selectedStudents, status });
      setSelectedStudents([]);
      fetchStudents();
      fetchStats();
      alert('Status updated!');
    } catch (e) { alert('Failed to update status'); }
  };

  const handleExport = async () => {
    try {
      const r = await axios.post(`${API}?resource=bulk&action=export`, { filters: { status: filterStatus !== 'all' ? filterStatus : '', class_id: filterClass !== 'all' ? filterClass : '' } });
      const data = r.data.students || [];
      if (data.length === 0) return alert('No students to export');
      
      const headers = ['Student ID', 'First Name', 'Last Name', 'Gender', 'Date of Birth', 'Email', 'Phone', 'Class', 'Status', 'Guardian Name', 'Guardian Phone'];
      const csv = [headers.join(','), ...data.map(s => [s.student_id, s.first_name, s.last_name, s.gender, s.date_of_birth, s.email, s.phone, s.class_name, s.status, s.guardian_name, s.guardian_phone].map(v => `"${v || ''}"`).join(','))].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (e) { alert('Export failed'); }
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, '').replace(/ /g, '_'));
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ''; });
        return obj;
      }).filter(d => d.first_name || d.last_name);
      setImportData(data);
      setModalType('import');
      setShowModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportSubmit = async () => {
    try {
      const r = await axios.post(`${API}?resource=bulk&action=import`, { students: importData });
      alert(r.data.message);
      setShowModal(false);
      setImportData([]);
      fetchStudents();
      fetchStats();
    } catch (e) { alert('Import failed'); }
  };

  const handlePromotion = () => {
    if (selectedStudents.length === 0) return alert('Select students to promote');
    setPromotionData({ ...promotionData, student_ids: selectedStudents });
    setModalType('promotion');
    setShowModal(true);
  };

  const handlePromotionSubmit = async () => {
    if (!promotionData.to_class_id) return alert('Select target class');
    try {
      await axios.post(`${API}?resource=promotions&action=bulk`, promotionData);
      alert('Students promoted successfully!');
      setShowModal(false);
      setSelectedStudents([]);
      fetchStudents();
    } catch (e) { alert('Promotion failed'); }
  };

  const handleGenerateIdCards = async () => {
    if (selectedStudents.length === 0) return alert('Select students');
    try {
      await axios.post(`${API}?resource=bulk&action=generate_id_cards`, { student_ids: selectedStudents });
      alert('ID cards generated!');
      setSelectedStudents([]);
    } catch (e) { alert('Failed to generate ID cards'); }
  };

  const toggleSelectStudent = (id) => setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelectedStudents(selectedStudents.length === filteredStudents.length ? [] : filteredStudents.map(s => s.id));

  const filteredStudents = students.filter(s => {
    if (!s?.first_name) return false;
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || s.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const statusColors = { active: 'bg-green-100 text-green-700', inactive: 'bg-gray-100 text-gray-700', graduated: 'bg-blue-100 text-blue-700', transferred: 'bg-orange-100 text-orange-700', suspended: 'bg-red-100 text-red-700' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><UsersIcon className="text-blue-600" /> Student Management</h1>
          <p className="text-gray-600 mt-1">Manage students, documents, promotions, and records</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="file" ref={importFileRef} accept=".csv" onChange={handleImportFile} className="hidden" />
          <button onClick={() => importFileRef.current?.click()} className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"><Upload size={18} /> Import</button>
          <button onClick={handleExport} className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"><Download size={18} /> Export</button>
          <button onClick={handleAddStudent} className="btn btn-primary flex items-center gap-2"><Plus size={18} /> Add Student</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg shadow-lg text-white">
          <UsersIcon size={24} className="mb-1" />
          <p className="text-blue-100 text-xs">Total Students</p>
          <p className="text-2xl font-bold">{stats.total || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg shadow-lg text-white">
          <UserCheck size={24} className="mb-1" />
          <p className="text-green-100 text-xs">Active</p>
          <p className="text-2xl font-bold">{stats.by_status?.find(s => s.status === 'active')?.count || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg shadow-lg text-white">
          <GraduationCap size={24} className="mb-1" />
          <p className="text-purple-100 text-xs">Graduated</p>
          <p className="text-2xl font-bold">{stats.by_status?.find(s => s.status === 'graduated')?.count || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-lg shadow-lg text-white">
          <Clock size={24} className="mb-1" />
          <p className="text-orange-100 text-xs">New This Month</p>
          <p className="text-2xl font-bold">{stats.new_this_month || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-4 rounded-lg shadow-lg text-white">
          <Calendar size={24} className="mb-1" />
          <p className="text-cyan-100 text-xs">New This Week</p>
          <p className="text-2xl font-bold">{stats.new_this_week || 0}</p>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border rounded-lg w-64" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded-lg px-3 py-2">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="transferred">Transferred</option>
              <option value="suspended">Suspended</option>
            </select>
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="border rounded-lg px-3 py-2">
              <option value="all">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
            </select>
            <button onClick={fetchStudents} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2"><RefreshCw size={16} /> Refresh</button>
          </div>
          
          {selectedStudents.length > 0 && (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">{selectedStudents.length} selected</span>
              <button onClick={handlePromotion} className="btn bg-purple-600 text-white hover:bg-purple-700 text-sm"><ArrowUpRight size={16} /> Promote</button>
              <button onClick={handleGenerateIdCards} className="btn bg-blue-600 text-white hover:bg-blue-700 text-sm"><CreditCard size={16} /> ID Cards</button>
              <button onClick={() => handleBulkStatusChange('inactive')} className="btn bg-orange-600 text-white hover:bg-orange-700 text-sm"><UserX size={16} /> Deactivate</button>
              <button onClick={handleBulkDelete} className="btn bg-red-600 text-white hover:bg-red-700 text-sm"><Trash2 size={16} /> Delete</button>
            </div>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left"><input type="checkbox" checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0} onChange={toggleSelectAll} className="rounded" /></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guardian</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">No students found</td></tr>
              ) : filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => toggleSelectStudent(student.id)} className="rounded" /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {student.first_name?.[0]}{student.last_name?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                        <p className="text-sm text-gray-500">{student.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{student.student_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{student.class_name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{student.gender}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-900">{student.guardian_name || '-'}</p>
                    <p className="text-xs text-gray-500">{student.guardian_phone || ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[student.status] || 'bg-gray-100 text-gray-700'}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => navigate(`/admin/students/${student.id}`)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View Profile"><Eye size={18} /></button>
                      <button onClick={() => handleEditStudent(student)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Edit"><Edit size={18} /></button>
                      <button onClick={() => handleDeleteStudent(student.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1} className="px-3 py-1 border rounded disabled:opacity-50">Previous</button>
              <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.pages} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            
            {/* Student Form Modal */}
            {modalType === 'student' && (
              <form onSubmit={handleSubmit}>
                <div className="flex items-center justify-between p-6 border-b">
                  <h2 className="text-xl font-bold">{editingStudent ? 'Edit Student' : 'Add New Student'}</h2>
                  <button type="button" onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label><input type="text" value={formData.student_id} onChange={(e) => setFormData({ ...formData, student_id: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label><input type="text" required value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label><input type="text" required value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Other Names</label><input type="text" value={formData.other_names} onChange={(e) => setFormData({ ...formData, other_names: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label><input type="date" value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="male">Male</option><option value="female">Female</option></select></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label><select value={formData.blood_group} onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="">Select</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="AB+">AB+</option><option value="AB-">AB-</option><option value="O+">O+</option><option value="O-">O-</option></select></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label><input type="text" value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Religion</label><input type="text" value={formData.religion} onChange={(e) => setFormData({ ...formData, religion: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                    </div>
                  </div>
                  
                  {/* Contact Info */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Region</label><input type="text" value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                    </div>
                  </div>
                  
                  {/* Academic Info */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Academic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Class</label><select value={formData.class_id} onChange={(e) => setFormData({ ...formData, class_id: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}</select></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label><input type="date" value={formData.admission_date} onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="active">Active</option><option value="inactive">Inactive</option><option value="graduated">Graduated</option><option value="transferred">Transferred</option><option value="suspended">Suspended</option></select></div>
                    </div>
                  </div>
                  
                  {/* Guardian Info */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Guardian Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label><input type="text" value={formData.guardian_name} onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone</label><input type="tel" value={formData.guardian_phone} onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Guardian Email</label><input type="email" value={formData.guardian_email} onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label><select value={formData.guardian_relationship} onChange={(e) => setFormData({ ...formData, guardian_relationship: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="">Select</option><option value="father">Father</option><option value="mother">Mother</option><option value="guardian">Guardian</option><option value="other">Other</option></select></div>
                    </div>
                  </div>
                  
                  {/* Medical Info */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Medical Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label><textarea value={formData.medical_conditions} onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows="2" /></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label><textarea value={formData.allergies} onChange={(e) => setFormData({ ...formData, allergies: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows="2" /></div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingStudent ? 'Update Student' : 'Create Student'}</button>
                </div>
              </form>
            )}

            {/* Import Modal */}
            {modalType === 'import' && (
              <>
                <div className="flex items-center justify-between p-6 border-b"><h2 className="text-xl font-bold">Import Students</h2><button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button></div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">Found <strong>{importData.length}</strong> students to import:</p>
                  <div className="max-h-60 overflow-y-auto border rounded-lg mb-4">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Gender</th><th className="px-3 py-2 text-left">Guardian</th></tr></thead>
                      <tbody className="divide-y">{importData.map((s, i) => <tr key={i}><td className="px-3 py-2">{s.first_name} {s.last_name}</td><td className="px-3 py-2">{s.gender || '-'}</td><td className="px-3 py-2">{s.guardian_name || '-'}</td></tr>)}</tbody>
                    </table>
                  </div>
                  <div className="flex justify-end gap-3"><button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button><button onClick={handleImportSubmit} className="btn bg-green-600 text-white hover:bg-green-700">Import {importData.length} Students</button></div>
                </div>
              </>
            )}

            {/* Promotion Modal */}
            {modalType === 'promotion' && (
              <>
                <div className="flex items-center justify-between p-6 border-b"><h2 className="text-xl font-bold flex items-center gap-2"><ArrowUpRight className="text-purple-600" /> Promote Students</h2><button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button></div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-600">Promoting <strong>{promotionData.student_ids.length}</strong> students</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Target Class *</label><select value={promotionData.to_class_id} onChange={(e) => setPromotionData({ ...promotionData, to_class_id: e.target.value })} className="w-full border rounded-lg px-3 py-2" required><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Promotion Type</label><select value={promotionData.promotion_type} onChange={(e) => setPromotionData({ ...promotionData, promotion_type: e.target.value })} className="w-full border rounded-lg px-3 py-2"><option value="promotion">Promotion</option><option value="demotion">Demotion</option><option value="transfer">Transfer</option><option value="repeat">Repeat</option></select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Promotion Date</label><input type="date" value={promotionData.promotion_date} onChange={(e) => setPromotionData({ ...promotionData, promotion_date: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4"><button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button><button onClick={handlePromotionSubmit} className="btn bg-purple-600 text-white hover:bg-purple-700">Promote Students</button></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
