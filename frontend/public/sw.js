// McSMS Service Worker - Offline Support, Push Notifications & Caching
const CACHE_VERSION = 'v4';
const STATIC_CACHE = `mcsms-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `mcsms-dynamic-${CACHE_VERSION}`;
const VENDOR_CACHE = `mcsms-vendor-${CACHE_VERSION}`;
const IMAGE_CACHE = `mcsms-images-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately (shell)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Cache duration settings (in seconds)
const CACHE_DURATIONS = {
  vendor: 30 * 24 * 60 * 60, // 30 days for vendor chunks
  static: 7 * 24 * 60 * 60,  // 7 days for static assets
  dynamic: 24 * 60 * 60,     // 1 day for dynamic content
  images: 14 * 24 * 60 * 60  // 14 days for images
};

// Check if URL is a vendor chunk (long-term cacheable)
const isVendorChunk = (url) => {
  return url.includes('/assets/vendor-') || 
         url.includes('/assets/html2canvas') ||
         url.includes('/assets/purify') ||
         url.includes('/assets/index.es');
};

// Check if URL is an image
const isImage = (url) => {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url);
};

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Service Worker: Caching core assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, VENDOR_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('mcsms-') && !currentCaches.includes(name))
          .map((name) => {
            console.log('Service Worker: Deleting old cache:', name);
            return caches.delete(name);
          })
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

  // Skip blob URLs
  if (request.url.startsWith('blob:')) {
    return;
  }

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

  // Determine which cache to use based on request type
  const getCacheName = (url) => {
    if (isVendorChunk(url)) return VENDOR_CACHE;
    if (isImage(url)) return IMAGE_CACHE;
    if (url.includes('/assets/')) return STATIC_CACHE;
    return DYNAMIC_CACHE;
  };

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // For vendor chunks, always return cached version (cache-first)
          if (isVendorChunk(request.url)) {
            return cachedResponse;
          }
          // For other assets, return cached but update in background (stale-while-revalidate)
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              const cacheName = getCacheName(request.url);
              caches.open(cacheName).then((cache) => {
                cache.put(request, response);
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200) {
              return response;
            }

            // Cache the response in appropriate cache
            if (request.url.startsWith('http')) {
              const responseToCache = response.clone();
              const cacheName = getCacheName(request.url);
              caches.open(cacheName)
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
