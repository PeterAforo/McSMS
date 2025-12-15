import { useState } from 'react';
import { 
  Bell, BellOff, GraduationCap, BookOpen, DollarSign, 
  Calendar, MessageSquare, Megaphone, Moon, Clock,
  Check, X, Loader2, AlertCircle
} from 'lucide-react';
import { usePushNotifications, useNotificationPreferences } from '../../hooks/usePushNotifications';
import { useAuthStore } from '../../store/authStore';

/**
 * Notification Preferences Component
 * Allows users to manage their notification settings
 */
export default function NotificationPreferences() {
  const { user } = useAuthStore();
  const { 
    isSupported, 
    isSubscribed, 
    permission, 
    loading: pushLoading, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications(user?.id);
  
  const {
    preferences,
    loading: prefsLoading,
    saving,
    togglePreference
  } = useNotificationPreferences(user?.id);

  const [showQuietHours, setShowQuietHours] = useState(false);

  const notificationTypes = [
    {
      key: 'grade_alerts',
      label: 'Grade Alerts',
      description: 'Get notified when new grades are posted',
      icon: GraduationCap,
      color: 'text-purple-500'
    },
    {
      key: 'homework_alerts',
      label: 'Homework Alerts',
      description: 'Notifications for new assignments and due dates',
      icon: BookOpen,
      color: 'text-blue-500'
    },
    {
      key: 'fee_alerts',
      label: 'Fee Reminders',
      description: 'Payment due dates and invoice notifications',
      icon: DollarSign,
      color: 'text-green-500'
    },
    {
      key: 'attendance_alerts',
      label: 'Attendance Alerts',
      description: 'Get notified about absences and late arrivals',
      icon: Calendar,
      color: 'text-orange-500'
    },
    {
      key: 'message_alerts',
      label: 'Message Notifications',
      description: 'New messages from teachers and admin',
      icon: MessageSquare,
      color: 'text-indigo-500'
    },
    {
      key: 'announcement_alerts',
      label: 'Announcements',
      description: 'School-wide announcements and updates',
      icon: Megaphone,
      color: 'text-red-500'
    }
  ];

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  if (prefsLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
        <p className="text-sm text-gray-500 mt-2">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Push Notifications Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${isSubscribed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
              {isSubscribed ? (
                <Bell className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <BellOff className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Push Notifications</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {isSubscribed 
                  ? 'You will receive push notifications on this device'
                  : 'Enable push notifications to get real-time alerts'}
              </p>
              {!isSupported && (
                <div className="flex items-center gap-2 mt-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Push notifications not supported in this browser</span>
                </div>
              )}
              {permission === 'denied' && (
                <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Notifications blocked. Please enable in browser settings.</span>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handlePushToggle}
            disabled={!isSupported || permission === 'denied' || pushLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isSubscribed 
                ? 'bg-green-500' 
                : 'bg-gray-300 dark:bg-gray-600'
            } ${(!isSupported || permission === 'denied') ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isSubscribed ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
            {pushLoading && (
              <Loader2 className="absolute inset-0 m-auto w-4 h-4 animate-spin text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Notification Types</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Choose which notifications you want to receive
          </p>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {notificationTypes.map((type) => {
            const Icon = type.icon;
            const isEnabled = preferences[type.key];
            
            return (
              <div 
                key={type.key}
                className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${type.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{type.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{type.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => togglePreference(type.key)}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isEnabled 
                      ? 'bg-blue-500' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <Moon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Quiet Hours</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Pause notifications during specific hours
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowQuietHours(!showQuietHours)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showQuietHours 
                ? 'bg-indigo-500' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showQuietHours ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {showQuietHours && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="time"
                    defaultValue={preferences.quiet_hours_start || '22:00'}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="time"
                    defaultValue={preferences.quiet_hours_end || '07:00'}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              You won't receive push notifications during quiet hours
            </p>
          </div>
        )}
      </div>

      {/* Test Notification */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Test Notifications</h3>
            <p className="text-sm text-white/80 mt-1">
              Send a test notification to verify your settings
            </p>
          </div>
          <button
            onClick={() => {
              if (Notification.permission === 'granted') {
                new Notification('Test Notification', {
                  body: 'Your notifications are working correctly!',
                  icon: '/icons/icon-192x192.png'
                });
              } else {
                alert('Please enable notifications first');
              }
            }}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
          >
            Send Test
          </button>
        </div>
      </div>
    </div>
  );
}
