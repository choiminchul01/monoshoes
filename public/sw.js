self.addEventListener('install', (event) => {
    console.log('Service Worker installing.');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activating.');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Basic pass-through fetch
    event.respondWith(fetch(event.request));
});
