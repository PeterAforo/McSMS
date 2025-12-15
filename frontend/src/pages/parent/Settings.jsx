import { useState } from 'react';
import { User, Lock, Bell, Save } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function ParentSettings() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="card">
        <div className="border-b">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-4 border-b-2 font-medium ${
                activeTab === 'profile'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-4 px-4 border-b-2 font-medium ${
                activeTab === 'password'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Password
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-4 border-b-2 font-medium ${
                activeTab === 'notifications'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bell className="w-4 h-4 inline mr-2" />
              Notifications
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="input"
                  />
                </div>
              </div>
              <button onClick={handleSave} className="btn btn-primary">
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={formData.current_password}
                  onChange={(e) => setFormData({...formData, current_password: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={formData.new_password}
                  onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                  className="input"
                />
              </div>
              <button onClick={handleSave} className="btn btn-primary">
                <Save className="w-4 h-4" />
                Update Password
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive email updates about your children</p>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-600">Receive SMS alerts for important updates</p>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Payment Reminders</p>
                  <p className="text-sm text-gray-600">Get reminders for upcoming payments</p>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              <button onClick={handleSave} className="btn btn-primary">
                <Save className="w-4 h-4" />
                Save Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
