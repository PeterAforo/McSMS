import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import axios from 'axios';

/**
 * Hook for managing push notifications
 */
export function usePushNotifications(userId) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      // Check current permission
      setPermission(Notification.permission);

      // Check if already subscribed
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking subscription:', err);
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported || !userId) return false;

    setLoading(true);
    setError(null);

    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setError('Notification permission denied');
        return false;
      }

      // Get VAPID public key
      const keyResponse = await axios.get(`${API_BASE_URL}/push_notifications.php?action=vapid_public_key`);
      const vapidPublicKey = keyResponse.data.public_key;

      // Subscribe to push
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to server
      await axios.post(`${API_BASE_URL}/push_notifications.php?action=subscribe`, {
        user_id: userId,
        subscription: subscription.toJSON()
      });

      setIsSubscribed(true);
      return true;

    } catch (err) {
      console.error('Error subscribing to push:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported, userId]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported || !userId) return false;

    setLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Notify server
        await axios.post(`${API_BASE_URL}/push_notifications.php?action=unsubscribe`, {
          user_id: userId,
          endpoint: subscription.endpoint
        });
      }

      setIsSubscribed(false);
      return true;

    } catch (err) {
      console.error('Error unsubscribing from push:', err);
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSupported, userId]);

  const showNotification = useCallback((title, options = {}) => {
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        ...options
      });
    }
  }, [permission]);

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    error,
    subscribe,
    unsubscribe,
    showNotification
  };
}

/**
 * Hook for notification preferences
 */
export function useNotificationPreferences(userId) {
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

  useEffect(() => {
    if (userId) {
      fetchPreferences();
    }
  }, [userId]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/push_notifications.php?action=preferences&user_id=${userId}`);
      if (response.data.success) {
        setPreferences(response.data.preferences);
      }
    } catch (err) {
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPrefs) => {
    try {
      setSaving(true);
      const response = await axios.post(`${API_BASE_URL}/push_notifications.php?action=preferences`, {
        user_id: userId,
        ...newPrefs
      });
      if (response.data.success) {
        setPreferences(prev => ({ ...prev, ...newPrefs }));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating preferences:', err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = async (key) => {
    const newValue = !preferences[key];
    return updatePreferences({ [key]: newValue });
  };

  return {
    preferences,
    loading,
    saving,
    updatePreferences,
    togglePreference,
    refetch: fetchPreferences
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default usePushNotifications;
