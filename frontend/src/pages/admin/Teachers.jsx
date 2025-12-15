import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Users, X, Upload, User, Eye, Search, Filter, Clock, Briefcase } from 'lucide-react';
import { teachersAPI } from '../../services/api';
import ProfilePictureUpload from '../../components/ProfilePictureUpload';
import axios from 'axios';

export default function Teachers() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [employmentFilter, setEmploymentFilter] = useState('');
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: 'male',
    address: '',
    qualification: '',
    specialization: '',
    hire_date: '',
    employment_type: 'full-time',
    status: 'active'
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handlePictureSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await teachersAPI.getAll();
      setTeachers(response.data.teachers || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      alert('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTeacher(null);
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: 'male',
      address: '',
      qualification: '',
      specialization: '',
      hire_date: new Date().toISOString().split('T')[0],
      employment_type: 'full-time',
      status: 'active'
    });
    setShowModal(true);
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    setFormData({
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      email: teacher.email,
      phone: teacher.phone || '',
      date_of_birth: teacher.date_of_birth || '',
      gender: teacher.gender || 'male',
      address: teacher.address || '',
      qualification: teacher.qualification || '',
      specialization: teacher.specialization || '',
      hire_date: teacher.hire_date || '',
      employment_type: teacher.employment_type,
      status: teacher.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      try {
        await teachersAPI.delete(id);
        fetchTeachers();
        alert('Teacher deleted successfully!');
      } catch (error) {
        console.error('Error deleting teacher:', error);
        alert('Failed to delete teacher');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let teacherId;
      if (editingTeacher) {
        await teachersAPI.update(editingTeacher.id, formData);
        teacherId = editingTeacher.id;
        alert('Teacher updated successfully!');
      } else {
        const response = await teachersAPI.create(formData);
        teacherId = response.data.teacher.id;
        alert('Teacher created successfully!');
      }

      // Upload profile picture if selected
      if (profilePictureFile && teacherId) {
        const formData = new FormData();
        formData.append('profile_picture', profilePictureFile);
        formData.append('type', 'teacher');
        formData.append('id', teacherId);

        await axios.post(
          'https://eea.mcaforo.com/backend/api/upload_profile_picture.php',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      }

      setShowModal(false);
      fetchTeachers();
    } catch (error) {
      console.error('Error saving teacher:', error);
      alert('Failed to save teacher: ' + (error.response?.data?.error || error.message));
    }
  };

  const stats = [
    { label: 'Total Teachers', value: teachers.length, color: 'bg-blue-500', icon: Users },
    { label: 'Active', value: teachers.filter(t => t.status === 'active').length, color: 'bg-green-500', icon: Users },
    { label: 'On Leave', value: teachers.filter(t => t.status === 'on-leave').length, color: 'bg-orange-500', icon: Clock },
    { label: 'Full-Time', value: teachers.filter(t => t.employment_type === 'full-time').length, color: 'bg-purple-500', icon: Briefcase },
  ];

  // Filter teachers based on search and filters
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = searchTerm === '' || 
      teacher.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.teacher_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || teacher.status === statusFilter;
    const matchesEmployment = employmentFilter === '' || teacher.employment_type === employmentFilter;
    return matchesSearch && matchesStatus && matchesEmployment;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers Management</h1>
          <p className="text-gray-600 mt-1">Manage teaching staff</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Teacher
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-40"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on-leave">On Leave</option>
          </select>
          <select
            value={employmentFilter}
            onChange={(e) => setEmploymentFilter(e.target.value)}
            className="input w-40"
          >
            <option value="">All Employment</option>
            <option value="full-time">Full-Time</option>
            <option value="part-time">Part-Time</option>
            <option value="contract">Contract</option>
          </select>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : filteredTeachers.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-500">No teachers found</td></tr>
              ) : (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/admin/teachers/${teacher.id}`)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {teacher.first_name?.charAt(0)}{teacher.last_name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {teacher.first_name} {teacher.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{teacher.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-600">{teacher.teacher_id}</td>
                    <td className="px-6 py-4 text-gray-600">{teacher.specialization || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{teacher.phone || '-'}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 capitalize">{teacher.employment_type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        teacher.status === 'active' ? 'bg-green-100 text-green-700' :
                        teacher.status === 'on-leave' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {teacher.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => navigate(`/admin/teachers/${teacher.id}`)} className="text-green-600 hover:text-green-700" title="View Profile">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(teacher)} className="text-blue-600 hover:text-blue-700" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(teacher.id)} className="text-red-600 hover:text-red-700" title="Delete">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Profile Picture Upload */}
              <div className="mb-6 flex justify-center">
                {editingTeacher ? (
                  <ProfilePictureUpload
                    type="teacher"
                    id={editingTeacher.id}
                    currentPicture={editingTeacher.profile_picture}
                    onUploadSuccess={() => fetchTeachers()}
                  />
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg mx-auto mb-3">
                      {profilePicturePreview ? (
                        <img
                          src={profilePicturePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                          <User className="w-12 h-12 text-white" />
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePictureSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-sm bg-gray-200 hover:bg-gray-300 flex items-center gap-2 mx-auto"
                    >
                      <Upload className="w-4 h-4" />
                      {profilePictureFile ? 'Change Picture' : 'Upload Picture'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Optional - JPG, PNG, GIF (Max 5MB)</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="input"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="input"
                    placeholder="e.g., B.Ed Mathematics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="input"
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hire Date</label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                    className="input"
                  >
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="contract">Contract</option>
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
                    <option value="on-leave">On Leave</option>
                  </select>
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
                  {editingTeacher ? 'Update Teacher' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
