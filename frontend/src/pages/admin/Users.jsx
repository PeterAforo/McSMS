import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, Mail, Phone, Shield, X, CheckCircle, XCircle, Upload, User, Users as UsersIcon, Key, History, Download, Upload as UploadIcon, Settings, Eye, Lock, Unlock, RefreshCw, FileText, Clock, Activity, UserCheck, UserX, MoreVertical, Filter, ChevronDown, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import ProfilePictureUpload from '../../components/ProfilePictureUpload';

const API = `${API_BASE_URL}/user_management.php`;
const USERS_API = `${API_BASE_URL}/users.php`;

export default function Users() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('user'); // user, role, password, import, activity
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePermissions, setRolePermissions] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const fileInputRef = useRef(null);
  const importFileRef = useRef(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', user_type: 'teacher', password: '', status: 'active', must_change_password: false });
  const [passwordData, setPasswordData] = useState({ user_id: '', password: '', must_change_password: true });
  const [importData, setImportData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [showEmployeeWizard, setShowEmployeeWizard] = useState(false);
  const [employeeWizardUser, setEmployeeWizardUser] = useState(null);
  const [employeeData, setEmployeeData] = useState({
    employee_id: '',
    department: '',
    designation: '',
    date_of_joining: '',
    employment_type: 'full_time',
    salary_grade: '',
    bank_name: '',
    bank_account: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    national_id: '',
    qualifications: ''
  });
  
  // Employee role types that trigger the wizard
  const employeeRoleTypes = ['teacher', 'accountant', 'hr_manager', 'librarian', 'receptionist', 'finance', 'principal', 'class_teacher', 'employee'];

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchRoles();
  }, []);

  useEffect(() => {
    if (activeTab === 'activity') fetchActivityLogs();
    if (activeTab === 'login_history') fetchLoginHistory();
    if (activeTab === 'roles') fetchRoles();
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: pagination.page, limit: pagination.limit });
      if (searchTerm) params.append('search', searchTerm);
      if (filterRole !== 'all') params.append('role', filterRole);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const r = await axios.get(`${API}?resource=users&${params}`);
      setUsers(r.data.users || []);
      if (r.data.pagination) setPagination(r.data.pagination);
    } catch (e) {
      console.error(e);
      // Fallback to old API
      try {
        const r = await axios.get(USERS_API);
        setUsers(r.data.users || []);
      } catch (e2) { console.error(e2); }
    } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const r = await axios.get(`${API}?resource=users&action=stats`);
      setStats(r.data.stats || {});
    } catch (e) { console.error(e); }
  };

  const fetchRoles = async () => {
    try {
      const r = await axios.get(`${API}?resource=roles`);
      setRoles(r.data.roles || []);
    } catch (e) { console.error(e); }
  };

  const fetchAllPermissions = async () => {
    try {
      const r = await axios.get(`${API}?resource=permissions`);
      setAllPermissions(r.data.permissions || []);
    } catch (e) { console.error(e); }
  };

  const viewRolePermissions = async (role) => {
    try {
      const r = await axios.get(`${API}?resource=roles&action=with_permissions&id=${role.id}`);
      setSelectedRole(r.data.role);
      setRolePermissions(r.data.role?.permissions || []);
      if (allPermissions.length === 0) await fetchAllPermissions();
      setModalType('permissions');
      setShowModal(true);
    } catch (e) { console.error(e); alert('Failed to load permissions'); }
  };

  const togglePermission = async (permissionId, hasPermission) => {
    try {
      if (hasPermission) {
        await axios.post(`${API}?resource=roles&action=remove_permission`, { role_id: selectedRole.id, permission_id: permissionId });
        setRolePermissions(prev => prev.filter(p => p.id !== permissionId));
      } else {
        await axios.post(`${API}?resource=roles&action=assign_permission`, { role_id: selectedRole.id, permission_id: permissionId });
        const perm = allPermissions.find(p => p.id === permissionId);
        if (perm) setRolePermissions(prev => [...prev, perm]);
      }
    } catch (e) { console.error(e); alert('Failed to update permission'); }
  };

  const fetchPermissions = async () => {
    try {
      const r = await axios.get(`${API}?resource=permissions`);
      setPermissions(r.data.permissions || []);
    } catch (e) { console.error(e); }
  };

  const fetchActivityLogs = async () => {
    try {
      const r = await axios.get(`${API}?resource=activity&limit=100`);
      setActivityLogs(r.data.logs || []);
    } catch (e) { console.error(e); }
  };

  const fetchLoginHistory = async () => {
    try {
      const r = await axios.get(`${API}?resource=login_history&limit=100`);
      setLoginHistory(r.data.history || []);
    } catch (e) { console.error(e); }
  };

  const handlePictureSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) { alert('Please select an image file'); return; }
      if (file.size > 5 * 1024 * 1024) { alert('File size must be less than 5MB'); return; }
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicturePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    // Use first available role from the list, or 'teacher' as fallback
    const defaultRole = roles.length > 0 ? (roles[0].role_name || roles[0].name) : 'teacher';
    setFormData({ name: '', email: '', phone: '', user_type: defaultRole, password: '', status: 'active', must_change_password: false });
    setModalType('user');
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    // Use user's current role, or first available role from the list, or 'teacher' as fallback
    const defaultRole = user.user_type || (roles.length > 0 ? (roles[0].role_name || roles[0].name) : 'teacher');
    setFormData({ name: user.name || '', email: user.email || '', phone: user.phone || '', user_type: defaultRole, password: '', status: user.status || 'active', must_change_password: false });
    setModalType('user');
    setShowModal(true);
  };

  const handleResetPassword = (user) => {
    setPasswordData({ user_id: user.id, password: '', must_change_password: true });
    setEditingUser(user);
    setModalType('password');
    setShowModal(true);
  };

  const handleApproveUser = async (userId, userType) => {
    try {
      await axios.post(`${API}?resource=users&action=approve`, { user_id: userId, user_type: userType });
      fetchUsers();
      fetchStats();
      alert('User approved successfully!');
    } catch (e) { alert('Failed to approve user'); }
  };

  const handleRejectUser = async (userId) => {
    if (window.confirm('Reject this user registration?')) {
      try {
        await axios.post(`${API}?resource=users&action=reject`, { user_id: userId });
        fetchUsers();
        fetchStats();
        alert('User rejected!');
      } catch (e) { alert('Failed to reject user'); }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Delete this user permanently?')) {
      try {
        await axios.delete(`${API}?resource=users&id=${userId}`);
        setUsers(users.filter(u => u.id !== userId));
        fetchStats();
        alert('User deleted!');
      } catch (e) { alert('Failed to delete user'); }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let userId;
      const previousUserType = editingUser?.user_type;
      const newUserType = formData.user_type;
      
      if (editingUser) {
        await axios.put(`${API}?resource=users&id=${editingUser.id}`, formData);
        userId = editingUser.id;
        alert('User updated!');
      } else {
        const r = await axios.post(`${API}?resource=users`, formData);
        userId = r.data.user?.id;
        alert('User created!');
      }
      if (profilePictureFile && userId) {
        const fd = new FormData();
        fd.append('profile_picture', profilePictureFile);
        fd.append('type', 'user');
        fd.append('id', userId);
        await axios.post(`${API_BASE_URL}/upload_profile_picture.php`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowModal(false);
      fetchUsers();
      
      // Check if role changed to an employee type - trigger employee wizard
      const isNowEmployee = employeeRoleTypes.includes(newUserType);
      const wasEmployee = employeeRoleTypes.includes(previousUserType);
      
      if (isNowEmployee && (!wasEmployee || !editingUser)) {
        // Show employee wizard for new employee or role change to employee
        setEmployeeWizardUser({ id: userId, name: formData.name, email: formData.email, user_type: newUserType });
        setEmployeeData({
          employee_id: `EMP${String(userId).padStart(4, '0')}`,
          department: '',
          designation: newUserType === 'teacher' ? 'Teacher' : '',
          date_of_joining: new Date().toISOString().split('T')[0],
          employment_type: 'full_time',
          salary_grade: '',
          bank_name: '',
          bank_account: '',
          emergency_contact_name: '',
          emergency_contact_phone: '',
          address: '',
          date_of_birth: '',
          gender: '',
          national_id: '',
          qualifications: ''
        });
        setShowEmployeeWizard(true);
      }
    } catch (e) { alert('Failed to save user: ' + (e.response?.data?.error || e.message)); }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}?resource=password&action=admin_reset`, passwordData);
      setShowModal(false);
      alert('Password reset successfully!');
    } catch (e) { alert('Failed to reset password'); }
  };

  const handleEmployeeWizardSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create employee record
      const employeePayload = {
        user_id: employeeWizardUser.id,
        ...employeeData
      };
      
      // If it's a teacher, create in teachers table
      if (employeeWizardUser.user_type === 'teacher' || employeeWizardUser.user_type === 'class_teacher') {
        await axios.post(`${API_BASE_URL}/teachers.php`, {
          user_id: employeeWizardUser.id,
          name: employeeWizardUser.name,
          email: employeeWizardUser.email,
          phone: employeeData.emergency_contact_phone,
          employee_id: employeeData.employee_id,
          department: employeeData.department,
          designation: employeeData.designation,
          date_of_joining: employeeData.date_of_joining,
          employment_type: employeeData.employment_type,
          qualifications: employeeData.qualifications,
          address: employeeData.address,
          date_of_birth: employeeData.date_of_birth,
          gender: employeeData.gender,
          national_id: employeeData.national_id,
          status: 'active'
        });
      } else {
        // Create in employees table for other staff
        await axios.post(`${API_BASE_URL}/employees.php`, employeePayload);
      }
      
      setShowEmployeeWizard(false);
      setEmployeeWizardUser(null);
      alert('Employee details saved successfully!');
      fetchUsers();
    } catch (e) {
      console.error('Employee wizard error:', e);
      alert('Failed to save employee details: ' + (e.response?.data?.error || e.message));
    }
  };

  const skipEmployeeWizard = () => {
    setShowEmployeeWizard(false);
    setEmployeeWizardUser(null);
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) { alert('Select users first'); return; }
    if (!window.confirm(`${action} ${selectedUsers.length} users?`)) return;
    try {
      if (action === 'delete') {
        await axios.post(`${API}?resource=bulk&action=delete`, { user_ids: selectedUsers });
      } else if (action === 'activate') {
        await axios.post(`${API}?resource=bulk&action=update_status`, { user_ids: selectedUsers, status: 'active' });
      } else if (action === 'deactivate') {
        await axios.post(`${API}?resource=bulk&action=update_status`, { user_ids: selectedUsers, status: 'inactive' });
      }
      setSelectedUsers([]);
      fetchUsers();
      fetchStats();
      alert('Bulk action completed!');
    } catch (e) { alert('Bulk action failed'); }
  };

  const handleExport = async () => {
    try {
      const r = await axios.post(`${API}?resource=bulk&action=export`, { filters: { role: filterRole !== 'all' ? filterRole : '', status: filterStatus !== 'all' ? filterStatus : '' } });
      const csv = convertToCSV(r.data.users);
      downloadCSV(csv, 'users_export.csv');
    } catch (e) { alert('Export failed'); }
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const lines = evt.target.result.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((h, idx) => row[h] = values[idx]?.trim() || '');
        if (row.name && row.email) data.push(row);
      }
      setImportData(data);
      setModalType('import');
      setShowModal(true);
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    try {
      const r = await axios.post(`${API}?resource=bulk&action=import`, { users: importData });
      setShowModal(false);
      fetchUsers();
      fetchStats();
      alert(`Import completed: ${r.data.successful} successful, ${r.data.failed} failed`);
    } catch (e) { alert('Import failed'); }
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','));
    return [headers.join(','), ...rows].join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelectUser = (id) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) setSelectedUsers([]);
    else setSelectedUsers(filteredUsers.map(u => u.id));
  };

  const pendingUsers = Array.isArray(users) ? users.filter(u => u?.status === 'pending') : [];
  const activeUsers = Array.isArray(users) ? users.filter(u => u?.status !== 'pending') : [];
  const filteredUsers = activeUsers.filter(u => {
    if (!u?.name || !u?.email) return false;
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.user_type === filterRole;
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Dynamic role colors based on category or generate from role name
  const getRoleColor = (roleType) => {
    const colors = {
      super_admin: 'bg-red-100 text-red-700',
      admin: 'bg-purple-100 text-purple-700',
      administrator: 'bg-purple-100 text-purple-700',
      principal: 'bg-indigo-100 text-indigo-700',
      vice_principal: 'bg-indigo-100 text-indigo-700',
      hr: 'bg-pink-100 text-pink-700',
      hr_manager: 'bg-pink-100 text-pink-700',
      finance: 'bg-orange-100 text-orange-700',
      finance_officer: 'bg-orange-100 text-orange-700',
      accountant: 'bg-orange-100 text-orange-700',
      cashier: 'bg-orange-100 text-orange-700',
      teacher: 'bg-blue-100 text-blue-700',
      class_teacher: 'bg-blue-100 text-blue-700',
      head_of_section: 'bg-blue-100 text-blue-700',
      exam_officer: 'bg-blue-100 text-blue-700',
      parent: 'bg-green-100 text-green-700',
      student: 'bg-cyan-100 text-cyan-700',
      librarian: 'bg-amber-100 text-amber-700',
      receptionist: 'bg-teal-100 text-teal-700',
      nurse: 'bg-rose-100 text-rose-700',
      school_nurse: 'bg-rose-100 text-rose-700',
      hostel_master: 'bg-violet-100 text-violet-700',
      transport_manager: 'bg-lime-100 text-lime-700',
      ict_officer: 'bg-sky-100 text-sky-700',
      admin_staff: 'bg-slate-100 text-slate-700',
      admissions: 'bg-emerald-100 text-emerald-700'
    };
    return colors[roleType?.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><UsersIcon className="text-blue-600" /> User Management</h1>
          <p className="text-gray-600 mt-1">Manage users, roles, permissions, and security</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="file" ref={importFileRef} accept=".csv" onChange={handleImportFile} className="hidden" />
          <button onClick={() => importFileRef.current?.click()} className="btn bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"><UploadIcon size={18} /> Import</button>
          <button onClick={handleExport} className="btn bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"><Download size={18} /> Export</button>
          <button onClick={handleAddUser} className="btn btn-primary flex items-center gap-2"><Plus size={18} /> Add User</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg shadow-lg text-white"><UsersIcon size={24} className="mb-1" /><p className="text-blue-100 text-xs">Total Users</p><p className="text-2xl font-bold">{stats.total || 0}</p></div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg shadow-lg text-white"><UserCheck size={24} className="mb-1" /><p className="text-green-100 text-xs">Active</p><p className="text-2xl font-bold">{stats.active || 0}</p></div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-lg shadow-lg text-white"><Clock size={24} className="mb-1" /><p className="text-orange-100 text-xs">Pending</p><p className="text-2xl font-bold">{stats.pending || 0}</p></div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-lg shadow-lg text-white"><UserX size={24} className="mb-1" /><p className="text-red-100 text-xs">Inactive</p><p className="text-2xl font-bold">{stats.inactive || 0}</p></div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg shadow-lg text-white"><Activity size={24} className="mb-1" /><p className="text-purple-100 text-xs">This Week</p><p className="text-2xl font-bold">{stats.registered_week || 0}</p></div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b overflow-x-auto">
          <div className="flex">
            {[{ id: 'users', label: 'Users', icon: UsersIcon }, { id: 'roles', label: 'Roles & Permissions', icon: Shield }, { id: 'activity', label: 'Activity Logs', icon: Activity }, { id: 'login_history', label: 'Login History', icon: History }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}><tab.icon size={18} /> {tab.label}</button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div>
              {/* Pending Registrations */}
              {pendingUsers.length > 0 && (
                <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-800 flex items-center gap-2 mb-3"><AlertTriangle size={20} /> Pending Registrations ({pendingUsers.length})</h3>
                  <div className="space-y-2">
                    {pendingUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold">{user.name?.charAt(0)}</div>
                          <div><p className="font-medium">{user.name}</p><p className="text-sm text-gray-500">{user.email}</p></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select id={`role-${user.id}`} defaultValue="teacher" className="input text-sm py-1">
                            {roles.map(role => (
                              <option key={role.id} value={role.role_name || role.name}>{role.display_name || role.role_name || role.name}</option>
                            ))}
                          </select>
                          <button onClick={() => handleApproveUser(user.id, document.getElementById(`role-${user.id}`).value)} className="btn bg-green-600 text-white hover:bg-green-700 py-1 px-3 text-sm flex items-center gap-1"><CheckCircle size={16} /> Approve</button>
                          <button onClick={() => handleRejectUser(user.id)} className="btn bg-red-600 text-white hover:bg-red-700 py-1 px-3 text-sm flex items-center gap-1"><XCircle size={16} /> Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters & Bulk Actions */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10 w-full" /></div>
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="input w-48">
                  <option value="all">All Roles</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.role_name || role.name}>{role.display_name || role.role_name || role.name}</option>
                  ))}
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input w-40"><option value="all">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
                {selectedUsers.length > 0 && (
                  <div className="flex gap-2">
                    <button onClick={() => handleBulkAction('activate')} className="btn bg-green-100 text-green-700 hover:bg-green-200 text-sm">Activate ({selectedUsers.length})</button>
                    <button onClick={() => handleBulkAction('deactivate')} className="btn bg-yellow-100 text-yellow-700 hover:bg-yellow-200 text-sm">Deactivate</button>
                    <button onClick={() => handleBulkAction('delete')} className="btn bg-red-100 text-red-700 hover:bg-red-200 text-sm">Delete</button>
                  </div>
                )}
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left"><input type="checkbox" checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0} onChange={toggleSelectAll} className="rounded" /></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">No users found</td></tr>
                    ) : filteredUsers.map(user => (
                      <tr key={user.id} className={`hover:bg-gray-50 ${selectedUsers.includes(user.id) ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-3"><input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => toggleSelectUser(user.id)} className="rounded" /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">{user.name?.charAt(0)?.toUpperCase()}</div>
                            <div><p className="font-medium text-gray-900">{user.name}</p><p className="text-sm text-gray-500">{user.email}</p></div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><div className="flex items-center gap-1 text-sm text-gray-600"><Phone size={14} /> {user.phone || '-'}</div></td>
                        <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.user_type)}`}><Shield size={12} /> {user.user_type}</span></td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.status}</span></td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEditUser(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit size={16} /></button>
                            <button onClick={() => handleResetPassword(user)} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title="Reset Password"><Key size={16} /></button>
                            <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ROLES TAB */}
          {activeTab === 'roles' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Roles & Permissions</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map(role => (
                  <div key={role.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2"><Shield className={role.is_system_role ? 'text-purple-600' : 'text-blue-600'} size={20} /><h4 className="font-semibold">{role.display_name}</h4></div>
                      {role.is_system_role && <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">System</span>}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{role.description || 'No description'}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{role.user_count || 0} users</span>
                      <button onClick={() => viewRolePermissions(role)} className="text-blue-600 hover:underline flex items-center gap-1"><Eye size={14} /> View Permissions</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVITY LOGS TAB */}
          {activeTab === 'activity' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Activity Logs</h3>
                <button onClick={fetchActivityLogs} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2"><RefreshCw size={16} /> Refresh</button>
              </div>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {activityLogs.length === 0 ? (
                      <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No activity logs</td></tr>
                    ) : activityLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{log.user_name || 'System'}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${log.action_type === 'delete' ? 'bg-red-100 text-red-700' : log.action_type === 'create' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{log.action_type}</span></td>
                        <td className="px-4 py-3 text-sm capitalize">{log.module}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{log.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{log.ip_address || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LOGIN HISTORY TAB */}
          {activeTab === 'login_history' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Login History</h3>
                <button onClick={fetchLoginHistory} className="btn bg-gray-100 hover:bg-gray-200 flex items-center gap-2"><RefreshCw size={16} /> Refresh</button>
              </div>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Login Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logout Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loginHistory.length === 0 ? (
                      <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No login history</td></tr>
                    ) : loginHistory.map(h => (
                      <tr key={h.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><div><p className="font-medium text-sm">{h.user_name}</p><p className="text-xs text-gray-500">{h.user_email}</p></div></td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${h.status === 'success' ? 'bg-green-100 text-green-700' : h.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{h.status}</span></td>
                        <td className="px-4 py-3 text-sm text-gray-600">{h.ip_address || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{h.device_type || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(h.login_time).toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{h.logout_time ? new Date(h.logout_time).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* User Modal */}
            {modalType === 'user' && (
              <>
                <div className="flex items-center justify-between p-6 border-b"><h2 className="text-xl font-bold">{editingUser ? 'Edit User' : 'Add New User'}</h2><button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button></div>
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="mb-6 flex justify-center">
                    {editingUser ? (
                      <ProfilePictureUpload type="user" id={editingUser.id} currentPicture={editingUser.profile_picture} onUploadSuccess={() => fetchUsers()} />
                    ) : (
                      <div className="text-center">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg mx-auto mb-3">
                          {profilePicturePreview ? <img src={profilePicturePreview} alt="Preview" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600"><User className="w-12 h-12 text-white" /></div>}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePictureSelect} className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-sm bg-gray-200 hover:bg-gray-300 flex items-center gap-2 mx-auto"><Upload size={16} /> {profilePictureFile ? 'Change' : 'Upload'}</button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" placeholder="Enter full name" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input" placeholder="email@example.com" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input" placeholder="0244123456" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Role *</label><select required value={formData.user_type} onChange={(e) => setFormData({ ...formData, user_type: e.target.value })} className="input">
                      {roles.map(role => (
                        <option key={role.id} value={role.role_name || role.name}>{role.display_name || role.role_name || role.name}</option>
                      ))}
                    </select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Password {!editingUser && '*'}</label><input type="password" required={!editingUser} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="input" placeholder={editingUser ? 'Leave blank to keep' : 'Enter password'} /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Status *</label><select required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                  </div>
                  <div className="mt-4"><label className="flex items-center gap-2"><input type="checkbox" checked={formData.must_change_password} onChange={(e) => setFormData({ ...formData, must_change_password: e.target.checked })} className="rounded" /><span className="text-sm text-gray-700">Require password change on first login</span></label></div>
                  <div className="flex justify-end gap-3 pt-4 mt-4 border-t"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button><button type="submit" className="btn btn-primary">{editingUser ? 'Update' : 'Add'} User</button></div>
                </form>
              </>
            )}

            {/* Password Reset Modal */}
            {modalType === 'password' && (
              <>
                <div className="flex items-center justify-between p-6 border-b"><h2 className="text-xl font-bold">Reset Password</h2><button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button></div>
                <form onSubmit={handlePasswordReset} className="p-6">
                  <p className="text-gray-600 mb-4">Reset password for: <strong>{editingUser?.name}</strong> ({editingUser?.email})</p>
                  <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label><input type="password" required minLength={8} value={passwordData.password} onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })} className="input" placeholder="Minimum 8 characters" /></div>
                  <div className="mb-4"><label className="flex items-center gap-2"><input type="checkbox" checked={passwordData.must_change_password} onChange={(e) => setPasswordData({ ...passwordData, must_change_password: e.target.checked })} className="rounded" /><span className="text-sm text-gray-700">Require password change on next login</span></label></div>
                  <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button><button type="submit" className="btn bg-orange-600 text-white hover:bg-orange-700">Reset Password</button></div>
                </form>
              </>
            )}

            {/* Import Modal */}
            {modalType === 'import' && (
              <>
                <div className="flex items-center justify-between p-6 border-b"><h2 className="text-xl font-bold">Import Users</h2><button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button></div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4">Found <strong>{importData.length}</strong> users to import:</p>
                  <div className="max-h-60 overflow-y-auto border rounded-lg mb-4">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Email</th><th className="px-3 py-2 text-left">Role</th></tr></thead>
                      <tbody className="divide-y">{importData.map((u, i) => <tr key={i}><td className="px-3 py-2">{u.name}</td><td className="px-3 py-2">{u.email}</td><td className="px-3 py-2">{u.user_type || 'teacher'}</td></tr>)}</tbody>
                    </table>
                  </div>
                  <div className="flex justify-end gap-3"><button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button><button onClick={handleImportSubmit} className="btn bg-green-600 text-white hover:bg-green-700">Import {importData.length} Users</button></div>
                </div>
              </>
            )}

            {/* Permissions Modal */}
            {modalType === 'permissions' && selectedRole && (
              <>
                <div className="flex items-center justify-between p-6 border-b">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2"><Shield className="text-purple-600" /> {selectedRole.display_name}</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage permissions for this role</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  {/* Group permissions by module */}
                  {Object.entries(allPermissions.reduce((acc, p) => { acc[p.module] = acc[p.module] || []; acc[p.module].push(p); return acc; }, {})).map(([module, perms]) => (
                    <div key={module} className="mb-6">
                      <h3 className="font-semibold text-gray-800 capitalize mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {module.replace('_', ' ')}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {perms.map(perm => {
                          const hasPermission = rolePermissions.some(rp => rp.id === perm.id);
                          return (
                            <label key={perm.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${hasPermission ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                              <input
                                type="checkbox"
                                checked={hasPermission}
                                onChange={() => togglePermission(perm.id, hasPermission)}
                                className="w-4 h-4 text-green-600 rounded"
                              />
                              <div>
                                <p className="font-medium text-sm">{perm.display_name}</p>
                                <p className="text-xs text-gray-500">{perm.description}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center p-4 border-t bg-gray-50">
                  <p className="text-sm text-gray-600"><strong>{rolePermissions.length}</strong> permissions assigned</p>
                  <button onClick={() => setShowModal(false)} className="btn btn-primary">Done</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Employee Wizard Modal */}
      {showEmployeeWizard && employeeWizardUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UsersIcon size={24} /> HR Employee Setup Wizard
              </h2>
              <p className="text-purple-100 mt-1">
                Complete employee details for: <strong>{employeeWizardUser.name}</strong> ({employeeWizardUser.user_type})
              </p>
            </div>
            
            <form onSubmit={handleEmployeeWizardSubmit} className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Basic Info */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">1</span>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID *</label>
                    <input type="text" required value={employeeData.employee_id} onChange={(e) => setEmployeeData({...employeeData, employee_id: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select value={employeeData.department} onChange={(e) => setEmployeeData({...employeeData, department: e.target.value})} className="input">
                      <option value="">Select Department</option>
                      <option value="academic">Academic</option>
                      <option value="administration">Administration</option>
                      <option value="finance">Finance</option>
                      <option value="hr">Human Resources</option>
                      <option value="it">IT</option>
                      <option value="library">Library</option>
                      <option value="sports">Sports</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                    <input type="text" value={employeeData.designation} onChange={(e) => setEmployeeData({...employeeData, designation: e.target.value})} className="input" placeholder="e.g., Senior Teacher" />
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">2</span>
                  Employment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining *</label>
                    <input type="date" required value={employeeData.date_of_joining} onChange={(e) => setEmployeeData({...employeeData, date_of_joining: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                    <select value={employeeData.employment_type} onChange={(e) => setEmployeeData({...employeeData, employment_type: e.target.value})} className="input">
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="temporary">Temporary</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary Grade</label>
                    <input type="text" value={employeeData.salary_grade} onChange={(e) => setEmployeeData({...employeeData, salary_grade: e.target.value})} className="input" placeholder="e.g., Grade A" />
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm">3</span>
                  Personal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input type="date" value={employeeData.date_of_birth} onChange={(e) => setEmployeeData({...employeeData, date_of_birth: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select value={employeeData.gender} onChange={(e) => setEmployeeData({...employeeData, gender: e.target.value})} className="input">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
                    <input type="text" value={employeeData.national_id} onChange={(e) => setEmployeeData({...employeeData, national_id: e.target.value})} className="input" placeholder="ID Number" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input type="text" value={employeeData.address} onChange={(e) => setEmployeeData({...employeeData, address: e.target.value})} className="input" placeholder="Full address" />
                  </div>
                </div>
              </div>

              {/* Banking & Emergency */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm">4</span>
                  Banking & Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input type="text" value={employeeData.bank_name} onChange={(e) => setEmployeeData({...employeeData, bank_name: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                    <input type="text" value={employeeData.bank_account} onChange={(e) => setEmployeeData({...employeeData, bank_account: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                    <input type="text" value={employeeData.emergency_contact_name} onChange={(e) => setEmployeeData({...employeeData, emergency_contact_name: e.target.value})} className="input" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                    <input type="tel" value={employeeData.emergency_contact_phone} onChange={(e) => setEmployeeData({...employeeData, emergency_contact_phone: e.target.value})} className="input" />
                  </div>
                </div>
              </div>

              {/* Qualifications */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-sm">5</span>
                  Qualifications
                </h3>
                <textarea
                  value={employeeData.qualifications}
                  onChange={(e) => setEmployeeData({...employeeData, qualifications: e.target.value})}
                  className="input w-full"
                  rows={3}
                  placeholder="List qualifications, certifications, degrees..."
                />
              </div>
            </form>

            <div className="flex justify-between items-center p-4 border-t bg-gray-50">
              <button type="button" onClick={skipEmployeeWizard} className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
                Skip for Now
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={skipEmployeeWizard} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" onClick={handleEmployeeWizardSubmit} className="btn bg-purple-600 text-white hover:bg-purple-700">
                  Save Employee Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
