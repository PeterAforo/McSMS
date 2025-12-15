import { API_BASE_URL } from '../config';

// VAPID public key - generate your own for production
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

class PushNotificationService {
  constructor() {
    this.swRegistration = null;
    this.isSubscribed = false;
  }

  // Check if push notifications are supported
  isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Initialize push notifications
  async init() {
    if (!this.isSupported()) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      this.swRegistration = await navigator.serviceWorker.ready;
      const subscription = await this.swRegistration.pushManager.getSubscription();
      this.isSubscribed = subscription !== null;
      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  // Request permission and subscribe
  async subscribe(userId) {
    if (!this.swRegistration) {
      await this.init();
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Subscribe to push
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription, userId);
      
      this.isSubscribed = true;
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(userId) {
    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer(userId);
        this.isSubscribed = false;
      }
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  }

  // Send subscription to server
  async sendSubscriptionToServer(subscription, userId) {
    try {
      await fetch(`${API_BASE_URL}/push_subscriptions.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          subscription: subscription.toJSON()
        })
      });
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  // Remove subscription from server
  async removeSubscriptionFromServer(userId) {
    try {
      await fetch(`${API_BASE_URL}/push_subscriptions.php?user_id=${userId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  // Show local notification (for testing)
  async showLocalNotification(title, options = {}) {
    if (!this.swRegistration) {
      await this.init();
    }

    const defaultOptions = {
      body: options.body || '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: options.url || '/',
        dateOfArrival: Date.now()
      },
      actions: options.actions || [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      tag: options.tag || 'mcsms-notification',
      renotify: true
    };

    return this.swRegistration.showNotification(title, { ...defaultOptions, ...options });
  }

  // Helper function to convert VAPID key
  urlBase64ToUint8Array(base64String) {
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

  // Check subscription status
  async getSubscriptionStatus() {
    if (!this.swRegistration) {
      await this.init();
    }

    const subscription = await this.swRegistration?.pushManager?.getSubscription();
    return {
      isSubscribed: subscription !== null,
      permission: Notification.permission,
      subscription
    };
  }
}

// Singleton instance
export const pushNotifications = new PushNotificationService();

// React hook for push notifications
export function usePushNotifications(userId) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState('default');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const supported = pushNotifications.isSupported();
      setIsSupported(supported);

      if (supported) {
        await pushNotifications.init();
        const status = await pushNotifications.getSubscriptionStatus();
        setIsSubscribed(status.isSubscribed);
        setPermission(status.permission);
      }
      setLoading(false);
    };

    init();
  }, []);

  const subscribe = async () => {
    setLoading(true);
    const subscription = await pushNotifications.subscribe(userId);
    setIsSubscribed(subscription !== null);
    setPermission(Notification.permission);
    setLoading(false);
    return subscription;
  };

  const unsubscribe = async () => {
    setLoading(true);
    await pushNotifications.unsubscribe(userId);
    setIsSubscribed(false);
    setLoading(false);
  };

  const showNotification = (title, options) => {
    return pushNotifications.showLocalNotification(title, options);
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
    showNotification
  };
}

// Need to import useState and useEffect for the hook
import { useState, useEffect } from 'react';
