const CACHE_NAME = 'pwa-ecommerce-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/icon-192.svg',
  '/icon-512.svg',
  '/static/css/main.css',
  '/static/js/main.js'
];

// API endpoints to cache
const API_CACHE_NAME = 'pwa-ecommerce-api-v3';
const IMAGE_CACHE_NAME = 'pwa-ecommerce-images-v3';

// Install event - cache app shell
self.addEventListener('install', (event) => {
  // Don't skip waiting - let user refresh manually to avoid infinite reloads
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Cache URLs one by one to avoid failures
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(err => {
              console.log('Failed to cache:', url, err);
              // Don't fail the entire installation if one URL fails
              return Promise.resolve();
            });
          })
        );
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome extension and non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle image requests with cache-first strategy
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(cache => {
        return cache.match(request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Return a placeholder for failed image loads
            return new Response(
              '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">Image</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          });
        });
      })
    );
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Cache successful GET requests
            if (request.method === 'GET' && response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return cached version if network fails
            return cache.match(request).then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return a proper error response if no cache available
              return new Response(JSON.stringify({ 
                message: 'Offline - No cached data available',
                offline: true 
              }), {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              });
            });
          });
      })
    );
    return;
  }

  // Handle app shell requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // For navigation requests (HTML pages), return the main index.html
        // This allows React Router to handle client-side routing
        if (event.request.mode === 'navigate') {
          return caches.match('/').then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Fallback to network for index.html
            return fetch('/').catch(() => {
              return caches.match('/offline.html').then(offlineResponse => {
                return offlineResponse || new Response('Offline', { 
                  status: 503, 
                  statusText: 'Service Unavailable' 
                });
              });
            });
          });
        }
        
        // For other requests, try network first
        return fetch(event.request).then(networkResponse => {
          // Cache successful responses
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Return offline page only for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html').then(offlineResponse => {
              return offlineResponse || new Response('Offline', { 
                status: 503, 
                statusText: 'Service Unavailable' 
              });
            });
          }
          // For non-navigation requests, return a proper error response
          return new Response('Network error', {
            status: 408,
            statusText: 'Request Timeout'
          });
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, API_CACHE_NAME, IMAGE_CACHE_NAME];
  
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Background sync for cart operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'cart-sync') {
    event.waitUntil(syncCartOperations());
  }
});

// Sync queued cart operations when online
async function syncCartOperations() {
  try {
    const db = await openDB();
    const tx = db.transaction(['cartQueue'], 'readonly');
    const store = tx.objectStore('cartQueue');
    const operations = await store.getAll();

    for (const operation of operations) {
      try {
        const response = await fetch(operation.url, {
          method: operation.method,
          headers: operation.headers,
          body: operation.body
        });

        if (response.ok) {
          // Remove successful operation from queue
          const deleteTx = db.transaction(['cartQueue'], 'readwrite');
          const deleteStore = deleteTx.objectStore('cartQueue');
          await deleteStore.delete(operation.id);
        }
      } catch (error) {
        console.error('Failed to sync operation:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// IndexedDB helper for offline queue
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PWAEcommerceDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('cartQueue')) {
        db.createObjectStore('cartQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}