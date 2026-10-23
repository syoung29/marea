// Service worker: guarda la app para que abra sin conexión.
// Red primero (así siempre ves la última versión) y, si no hay internet, lo guardado.
// Al publicar cambios, subí el número de versión para limpiar lo viejo.
const CACHE = 'marea-v3';
const ARCHIVOS = [
  './', './index.html', './app/', './app/index.html', './privacidad', './css/app.css', './css/sitio.css', './manifest.webmanifest',
  './js/app.js', './js/motor.js', './js/ejercicios.js', './js/mascotas.js', './js/util.js', './js/sitio.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const propio = url.origin === location.origin, fuente = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!propio && !fuente) return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || (e.request.mode === 'navigate' ? caches.match(url.pathname.startsWith('/app') ? './app/' : './') : undefined)))
  );
});
