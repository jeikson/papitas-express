/* Service worker de Papitas Express — hace la app instalable y usable sin datos.
   Reglas:
     · nada de red en el arranque: la app es estática y debe abrir en el local
       aunque se caiga el internet;
     · las navegaciones van a red primero (para recibir la versión nueva) y si
       no hay red, se sirve el index cacheado;
     · el resto de archivos propios (css, js, fotos, fuentes) van a caché
       primero y se refrescan en segundo plano;
     · lo que no es del propio sitio (wa.me, Instagram) nunca se intercepta.
   Para publicar cambios: sube el número de VERSION y de ?v= en index.html. */

const VERSION = 'pe-30';
const CACHE = VERSION;

// núcleo de la app: sin esto no abre
const NUCLEO = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/fuentes.css',
  'css/styles.css',
  'js/config.js',
  'js/menu.js',
  'js/app.js',
  'assets/img/logo-papitas.png',
  'assets/img/favicon.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png',
  'assets/icons/apple-touch-icon.png',
  'assets/fonts/nunito-400-latin.woff2',
  'assets/fonts/nunito-400-latin-ext.woff2',
  'assets/fonts/fredoka-500-latin.woff2',
  'assets/fonts/fredoka-500-latin-ext.woff2'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // uno por uno: si un archivo falta, no se cae toda la instalación
    await Promise.all(NUCLEO.map((u) => cache.add(u).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const nombres = await caches.keys();
    await Promise.all(nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // WhatsApp, Instagram: red normal

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const red = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put('index.html', red.clone());
        return red;
      } catch (err) {
        return (await caches.match('index.html')) || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  e.respondWith((async () => {
    const enCache = await caches.match(req);
    const desdeRed = fetch(req).then(async (red) => {
      if (red && red.ok && red.type === 'basic') {
        const cache = await caches.open(CACHE);
        cache.put(req, red.clone());
      }
      return red;
    }).catch(() => null);
    return enCache || (await desdeRed) || Response.error();
  })());
});
