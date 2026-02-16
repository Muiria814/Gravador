const CACHE_NAME = 'vozstudio-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles/estilo.css',
    '/scripts/gravador.js',
    '/scripts/analisador.js',
    '/scripts/gerador.js',
    '/scripts/mixador.js',
    '/scripts/app.js',
    'https://cdn.jsdelivr.net/npm/tone'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});