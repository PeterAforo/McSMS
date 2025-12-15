// McSMS Service Worker - Offline Support & Push Notifications
const CACHE_NAME = 'mcsms-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching core assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip non-http(s) schemes (chrome-extension, etc.)
  if (!request.url.startsWith('http')) {
    return;
  }

  // Skip API requests (always fetch fresh)
  if (request.url.includes('/api/') || request.url.includes('.php')) {
    return;
  }

  // Skip localhost URLs (mixed content issue)
  if (request.url.includes('localhost') || request.url.includes('127.0.0.1')) {
    return;
  }

  // Skip cross-origin requests
  try {
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) {
      return;
    }
  } catch (e) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200) {
              return response;
            }

            // Only cache if it's a valid http(s) request
            if (request.url.startsWith('http')) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                })
                .catch(() => {});
            }

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
      })
      .catch(() => {
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  let data = { title: 'McSMS Notification', body: 'You have a new notification' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now()
    },
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: data.tag || 'mcsms-notification',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  } else if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncAttendance() {
  const db = await openDB();
  const pendingAttendance = await db.getAll('pending-attendance');
  
  for (const record of pendingAttendance) {
    try {
      await fetch('/api/attendance.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      await db.delete('pending-attendance', record.id);
    } catch (e) {
      console.error('Sync failed for attendance:', e);
    }
  }
}

async function syncMessages() {
  const db = await openDB();
  const pendingMessages = await db.getAll('pending-messages');
  
  for (const message of pendingMessages) {
    try {
      await fetch('/api/messages.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      await db.delete('pending-messages', message.id);
    } catch (e) {
      console.error('Sync failed for message:', e);
    }
  }
}

// Simple IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mcsms-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-attendance')) {
        db.createObjectStore('pending-attendance', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pending-messages')) {
        db.createObjectStore('pending-messages', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

console.log('McSMS Service Worker loaded');
