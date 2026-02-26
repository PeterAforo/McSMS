import { useState, useEffect } from 'react';
import { Bell, BellOff, Smartphone, Mail, MessageSquare, GraduationCap, DollarSign, Calendar, Clock, Save, RefreshCw } from 'lucide-react';
import { usePushNotifications } from '../../services/pushNotifications';
import { API_BASE_URL } from '../../config';
import useAuthStore from '../../store/authStore';

export default function NotificationSettings() {
  const { user } = useAuthStore();
  const { isSupported, isSubscribed, permission, loading: pushLoading, subscribe, unsubscribe } = usePushNotifications(user?.id);
  
  const [preferences, setPreferences] = useState({
    grade_alerts: true,
    homework_alerts: true,
    fee_alerts: true,
    attendance_alerts: true,
    message_alerts: true,
    announcement_alerts: true,
    quiet_hours_start: null,
    quiet_hours_end: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchPreferences();
    }
  }, [user?.id]);

  const fetchPreferences = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/push_notifications.php?action=preferences&user_id=${user.id}`);
      const data = await response.json();
      if (data.success && data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/push_notifications.php?action=preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, ...preferences })
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save preferences' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
      setMessage({ type: 'info', text: 'Push notifications disabled' });
    } else {
      const result = await subscribe();
      if (result) {
        setMessage({ type: 'success', text: 'Push notifications enabled!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to enable push notifications. Please check browser permissions.' });
      }
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const notificationTypes = [
    { key: 'grade_alerts', label: 'Grade Alerts', description: 'Get notified when new grades are posted', icon: GraduationCap, color: 'text-blue-500' },
    { key: 'homework_alerts', label: 'Homework Alerts', description: 'Reminders for homework assignments', icon: Calendar, color: 'text-purple-500' },
    { key: 'fee_alerts', label: 'Fee Alerts', description: 'Payment reminders and invoice notifications', icon: DollarSign, color: 'text-green-500' },
    { key: 'attendance_alerts', label: 'Attendance Alerts', description: 'Absence and late arrival notifications', icon: Clock, color: 'text-orange-500' },
    { key: 'message_alerts', label: 'Message Alerts', description: 'New messages from teachers and staff', icon: MessageSquare, color: 'text-indigo-500' },
    { key: 'announcement_alerts', label: 'Announcements', description: 'School-wide announcements and updates', icon: Bell, color: 'text-red-500' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Push Notification Status */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${isSubscribed ? 'bg-green-100' : 'bg-gray-100'}`}>
              {isSubscribed ? (
                <Bell className="w-6 h-6 text-green-600" />
              ) : (
                <BellOff className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Push Notifications</h3>
              <p className="text-sm text-gray-500">
                {!isSupported 
                  ? 'Not supported in this browser'
                  : isSubscribed 
                    ? 'Enabled - You will receive push notifications'
                    : 'Disabled - Enable to receive instant alerts'}
              </p>
            </div>
          </div>
          
          {isSupported && (
            <button
              onClick={handlePushToggle}
              disabled={pushLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isSubscribed
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {pushLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isSubscribed ? (
                'Disable'
              ) : (
                'Enable'
              )}
            </button>
          )}
        </div>

        {permission === 'denied' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Permission Blocked:</strong> You have blocked notifications for this site. 
              Please update your browser settings to enable push notifications.
            </p>
          </div>
        )}
      </div>

      {/* Notification Types */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Notification Preferences</h3>
        <p className="text-sm text-gray-500 mb-6">Choose which types of notifications you want to receive</p>
        
        <div className="space-y-4">
          {notificationTypes.map(({ key, label, description, icon: Icon, color }) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                  <p className="font-medium text-gray-900">{label}</p>
                  <p className="text-sm text-gray-500">{description}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences[key]}
                  onChange={() => handleToggle(key)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quiet Hours</h3>
        <p className="text-sm text-gray-500 mb-6">Set times when you don't want to receive notifications</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
            <input
              type="time"
              value={preferences.quiet_hours_start || ''}
              onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_start: e.target.value || null }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
            <input
              type="time"
              value={preferences.quiet_hours_end || ''}
              onChange={(e) => setPreferences(prev => ({ ...prev, quiet_hours_end: e.target.value || null }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Preferences
        </button>
      </div>
    </div>
  );
}
