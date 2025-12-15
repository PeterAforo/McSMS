import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Phone, MapPin, Calendar, Camera, Save, 
  ArrowLeft, Edit2, Lock, Shield, Bell, Loader2, CheckCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_BASE_URL } from '../../config';
import axios from 'axios';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    region: '',
    photo: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  const getPhotoUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    // Build full URL from relative path
    const baseUrl = API_BASE_URL.replace('/backend/api', '');
    return `${baseUrl}${photo}`;
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/profile.php?user_id=${user?.id}`);
      const data = response.data.profile || response.data.user || {};
      setProfileData(data);
      
      // Get photo from profile_picture field (stored in users table)
      const photo = data.profile_picture || data.photo || user?.profile_picture || '';
      
      setFormData({
        first_name: data.first_name || user?.first_name || '',
        last_name: data.last_name || user?.last_name || '',
        email: data.email || user?.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        region: data.region || '',
        photo: photo
      });
      
      if (photo) {
        setPhotoPreview(getPhotoUrl(photo));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Use data from auth store as fallback
      const photo = user?.profile_picture || '';
      setFormData({
        first_name: user?.first_name || user?.name?.split(' ')[0] || '',
        last_name: user?.last_name || user?.name?.split(' ').slice(1).join(' ') || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: '',
        city: '',
        region: '',
        photo: photo
      });
      if (photo) {
        setPhotoPreview(getPhotoUrl(photo));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload using profile picture API
    try {
      const uploadData = new FormData();
      uploadData.append('profile_picture', file);
      uploadData.append('type', 'user');
      uploadData.append('id', user?.id);
      
      const response = await axios.post(`${API_BASE_URL}/upload_profile_picture.php`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        const photoPath = response.data.path || response.data.url;
        setFormData(prev => ({ ...prev, photo: photoPath }));
        // Update auth store with new profile picture
        if (updateUser) {
          updateUser({
            ...user,
            profile_picture: photoPath
          });
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await axios.put(`${API_BASE_URL}/profile.php?user_id=${user?.id}`, formData);
      
      if (response.data.success) {
        setSuccessMessage('Profile updated successfully!');
        setEditMode(false);
        // Update auth store
        if (updateUser) {
          updateUser({
            ...user,
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            name: `${formData.first_name} ${formData.last_name}`
          });
        }
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match');
      return;
    }
    if (passwordData.new_password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      const response = await axios.post(`${API_BASE_URL}/profile.php?action=change_password`, {
        user_id: user?.id,
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      if (response.data.success) {
        setSuccessMessage('Password changed successfully!');
        setShowPasswordModal(false);
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const getRolePath = () => {
    if (user?.user_type === 'admin') return '/admin';
    if (user?.user_type === 'teacher') return '/teacher';
    if (user?.user_type === 'parent') return '/parent';
    return '/admin';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`${getRolePath()}/dashboard`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600">Manage your personal information</p>
          </div>
        </div>
        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(false)}
              className="btn bg-gray-200 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Photo Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                {photoPreview || formData.photo ? (
                  <img 
                    src={photoPreview || formData.photo} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-4xl font-bold">
                    {formData.first_name?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              {editMode && (
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              {formData.first_name} {formData.last_name}
            </h2>
            <p className="text-gray-500 capitalize">{user?.user_type}</p>
          </div>

          {/* Info Section */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{formData.first_name || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{formData.last_name || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </label>
                {editMode ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{formData.email || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone
                </label>
                {editMode ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{formData.phone || '-'}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Address
                </label>
                {editMode ? (
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input"
                    rows="2"
                  />
                ) : (
                  <p className="text-gray-900">{formData.address || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{formData.city || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="input"
                  />
                ) : (
                  <p className="text-gray-900">{formData.region || '-'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Password</p>
                <p className="text-sm text-gray-500">Last changed: Unknown</p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="btn bg-gray-200 hover:bg-gray-300 text-sm"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Account Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">User ID</p>
            <p className="font-medium text-gray-900">{user?.id || '-'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-medium text-gray-900 capitalize">{user?.user_type || '-'}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-medium text-green-600">Active</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Member Since</p>
            <p className="font-medium text-gray-900">
              {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="btn bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
