// TetroHashUnlock v3.0 - Service Worker
// Progressive Web App functionality

const CACHE_NAME = 'tetrohash-v3.0.0';
const STATIC_CACHE = 'tetrohash-static-v3.0.0';
const DYNAMIC_CACHE = 'tetrohash-dynamic-v3.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/tetrohash_modern.html',
    '/modern-styles.css',
    '/modern-engine.js',
    '/manifest.json',
    '/styles.css', // Fallback to original styles
    '/tetrohash_unified.html', // Fallback to unified version
    '/tetrohash_unified.js', // Fallback to unified engine
    '/bitcoin_logic.py',
    '/reward.py',
    '/README.md',
    '/LICENSE'
];

// External resources to cache
const EXTERNAL_RESOURCES = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('📦 Caching static files...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('✅ Static files cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Failed to cache static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then(response => {
                // Return cached version if available
                if (response) {
                    console.log('📦 Serving from cache:', request.url);
                    return response;
                }
                
                // Otherwise fetch from network
                return fetch(request)
                    .then(fetchResponse => {
                        // Check if response is valid
                        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                            return fetchResponse;
                        }
                        
                        // Clone the response
                        const responseToCache = fetchResponse.clone();
                        
                        // Cache dynamic content
                        if (shouldCache(request)) {
                            caches.open(DYNAMIC_CACHE)
                                .then(cache => {
                                    cache.put(request, responseToCache);
                                    console.log('💾 Cached dynamic content:', request.url);
                                });
                        }
                        
                        return fetchResponse;
                    })
                    .catch(error => {
                        console.error('🌐 Network request failed:', error);
                        
                        // Return offline page for navigation requests
                        if (request.mode === 'navigate') {
                            return caches.match('/tetrohash_modern.html');
                        }
                        
                        // Return cached version if available
                        return caches.match(request);
                    });
            })
    );
});

// Background sync for game data
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('🔄 Background sync triggered');
        event.waitUntil(doBackgroundSync());
    }
});

// Push notifications
self.addEventListener('push', event => {
    console.log('📱 Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New TetroHashUnlock update available!',
        icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" rx="24" fill="%23ffd700"/%3E%3Ctext x="96" y="120" font-family="Arial" font-size="120" text-anchor="middle" fill="%23000"%3E₿%3C/text%3E%3C/svg%3E',
        badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="12" fill="%23ff6b35"/%3E%3Ctext x="48" y="60" font-family="Arial" font-size="48" text-anchor="middle" fill="%23000"%3E₿%3C/text%3E%3C/svg%3E',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 'tetrohash-notification'
        },
        actions: [
            {
                action: 'play',
                title: 'Play Now',
                icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23ffd700" d="M8 5v14l11-7z"/%3E%3C/svg%3E'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23ff6b35" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/%3E%3C/svg%3E'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('TetroHashUnlock', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
    console.log('🔔 Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'play') {
        event.waitUntil(
            clients.openWindow('/tetrohash_modern.html')
        );
    } else if (event.action === 'dismiss') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/tetrohash_modern.html')
        );
    }
});

// Message handling from main thread
self.addEventListener('message', event => {
    console.log('💬 Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
    
    if (event.data && event.data.type === 'CACHE_GAME_DATA') {
        cacheGameData(event.data.data);
    }
});

// Utility functions
function shouldCache(request) {
    const url = new URL(request.url);
    
    // Cache HTML, CSS, JS files
    if (url.pathname.endsWith('.html') || 
        url.pathname.endsWith('.css') || 
        url.pathname.endsWith('.js')) {
        return true;
    }
    
    // Cache images
    if (url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
        return true;
    }
    
    // Cache fonts
    if (url.pathname.match(/\.(woff|woff2|ttf|eot)$/)) {
        return true;
    }
    
    // Cache API responses for game data
    if (url.pathname.includes('/api/')) {
        return true;
    }
    
    return false;
}

function doBackgroundSync() {
    // Sync game data, stats, etc.
    return new Promise((resolve) => {
        console.log('🔄 Syncing game data...');
        
        // Simulate sync process
        setTimeout(() => {
            console.log('✅ Background sync completed');
            resolve();
        }, 1000);
    });
}

function cacheGameData(data) {
    const gameDataUrl = '/api/game-data';
    const request = new Request(gameDataUrl);
    const response = new Response(JSON.stringify(data), {
        headers: {
            'Content-Type': 'application/json'
        }
    });
    
    caches.open(DYNAMIC_CACHE)
        .then(cache => {
            cache.put(request, response);
            console.log('💾 Game data cached successfully');
        });
}

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
    self.addEventListener('periodicSync', event => {
        if (event.tag === 'content-sync') {
            console.log('⏰ Periodic sync triggered');
            event.waitUntil(doBackgroundSync());
        }
    });
}

// Handle app updates
self.addEventListener('appinstalled', event => {
    console.log('📱 TetroHashUnlock installed successfully!');
    
    // Show welcome notification
    self.registration.showNotification('Welcome to TetroHashUnlock!', {
        body: 'Your Bitcoin Tetris adventure begins now!',
        icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" rx="24" fill="%23ffd700"/%3E%3Ctext x="96" y="120" font-family="Arial" font-size="120" text-anchor="middle" fill="%23000"%3E₿%3C/text%3E%3C/svg%3E',
        badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" rx="12" fill="%23ff6b35"/%3E%3Ctext x="48" y="60" font-family="Arial" font-size="48" text-anchor="middle" fill="%23000"%3E₿%3C/text%3E%3C/svg%3E',
        vibrate: [200, 100, 200],
        actions: [
            {
                action: 'play',
                title: 'Start Playing',
                icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23ffd700" d="M8 5v14l11-7z"/%3E%3C/svg%3E'
            }
        ]
    });
});

console.log('🚀 TetroHashUnlock Service Worker loaded successfully!');
