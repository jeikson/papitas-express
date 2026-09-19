# Papitas Express — pedidos por WhatsApp

Tienda web para tomar pedidos: el cliente arma su carrito, deja sus datos y **la comanda llega como mensaje de WhatsApp** a la tienda. Sin backend, sin base de datos, sin POS.

- Un solo archivo de configuración (`js/config.js`) y uno de menú (`js/menu.js`).
- Funciona abriendo `index.html` o subiendo la carpeta a cualquier hosting estático (Netlify, Cloudflare Pages, Vercel, GitHub Pages).
- Carrito y datos del cliente guardados en el navegador (`localStorage`): si el cliente recarga, no pierde el pedido.

**En línea:** https://jeikson.github.io/papitas-express/ — ese es el enlace que se
comparte con los clientes (WhatsApp, Instagram, QR). Para publicar cambios mira
[Publicarlo](#publicarlo-ya-está-publicado).

## Estructura

```
papitas-express/
├── index.html            # estructura de la página
├── manifest.webmanifest  # datos de la app instalable (nombre, iconos, colores)
├── sw.js                 # service worker: permite instalarla y abrirla sin datos
├── css/styles.css        # estilos (mobile first)
├── js/config.js          # CONFIGURACIÓN: WhatsApp, horario, domicilio, pagos
├── js/menu.js            # MENÚ: productos, precios, adiciones, salsas, barrios
├── js/app.js             # lógica del carrito y del mensaje
└── assets/               # logo, iconos de la app y fotos de los productos
```

## Probarlo en local

```bash
cd papitas-express
python3 -m http.server 8899
# abre http://localhost:8899
```

También funciona con doble clic en `index.html` (todo es local, sin peticiones externas),
pero así **no** se puede instalar: para eso hay que servirla por HTTPS.

## Cambiar el número de WhatsApp

En `js/config.js`:

```js
negocio: {
  whatsapp: '573007107250',   // internacional, sin + ni espacios
  telefonoVisible: '300 710 7250',
}
```

## Editar el menú

En `js/menu.js`. Precios en pesos, sin puntos: `29000`.

```js
productos: [
  { id: 1, cat: 'ESTACIONES', nombre: 'Estación Mixta', precio: 30000,
    desc: 'Texto corto que se ve en la tarjeta.',
    ingredientes: ['Papitas crocantes', 'Queso derretido'],   // se muestran como etiquetas
    img: 'assets/img/estacion-03-mixta.jpg',                  // '' = sin foto
    destacado: true }                                         // muestra la cinta "Más pedida"
]
```

- `adiciones`: productos extra con precio que se ofrecen dentro de cada producto.
- `salsas` y `opciones`: listas de selección múltiple (sin costo).
- `categorias`: el orden de las pestañas. Si cambias una categoría, ajústala también en los productos.

## Las fotos van en dos formatos

Cada foto de producto está guardada dos veces, con el mismo nombre:

```
assets/img/estacion-03-mixta.jpg    ← respaldo (cualquier navegador)
assets/img/estacion-03-mixta.webp   ← el que usan los celulares de hoy (pesa la mitad)
```

El cliente descarga solo uno: el WebP si su navegador lo entiende (todos los actuales),
y el JPG si es viejo. **Si reemplazas una foto, sube las dos versiones** con el mismo
nombre. Si te falta el WebP, la app se da cuenta y muestra el JPG igual (no queda el
hueco), pero pesa el doble.

## Domicilio

- **Valor fijo**: `domicilio: { activo: true, usarBarrios: false, valorFijo: 6000 }`.
- **Por barrio/zona**: `usarBarrios: true` y llena la lista `barrios` en `js/menu.js`:

```js
barrios: [
  { nombre: 'Centro', valor: 3000 },
  { nombre: 'Bocagrande', valor: 5000 },
]
```

Con `usarBarrios: true` el cliente elige el barrio en un desplegable que muestra el valor del envío y el total se recalcula solo.

## Horario

```js
horario: { inicio: '16:00', fin: '23:30', bloquearFueraDeHorario: false }
```

- Con `bloquearFueraDeHorario: false` solo se muestra el aviso de "cerrado" y el pedido se puede enviar igual.
- Con `true`, el botón de envío se desactiva fuera de horario.
- Usa la hora del dispositivo del cliente. Si el horario cruza medianoche (ej. `20:00` a `02:00`) también funciona.

## Pago

```js
pagos: ['Efectivo', 'Transferencia / Nequi', 'Datáfono'],
pedirPagaCon: true,   // con Efectivo pregunta "¿con cuánto pagas?" y calcula el cambio
```

Si usas Nequi/Bancolombia, pon el número o la llave en el nombre de la opción, ej. `'Nequi 300 710 7250'`.

## Cómo llega la comanda

El mensaje se arma con formato de WhatsApp (`*negrita*`), con estos datos:

```
*NUEVO PEDIDO — PAPITAS EXPRESS*
Pedido #WH7G · 17/09/2026, 10:08 p.m.

*Cliente*
Nombre: ... / Teléfono: ... / Entrega: Domicilio
Dirección: ... / Referencia: ...
Pago: Efectivo — paga con $ 100.000
Llevar cambio de: $ 20.500

*Pedido*
2 x Estación Mixta — $ 72.000
   • Salsas: Rosada de la casa, Piña
   • Adiciones: Tocino caramelizado, Guacamole
1 x Coca Cola — $ 4.500

Subtotal: $ 76.500
Domicilio: $ 3.000
*TOTAL: $ 79.500*
```

Al enviar se abre `https://wa.me/<número>?text=<comanda>`: sale del WhatsApp del cliente (o WhatsApp Web en computador) con el mensaje listo y el cliente solo da "enviar". La tienda responde por ahí mismo, así que queda la conversación completa.

**Si más adelante quieres que salga solo** (sin que el cliente dé enviar), hay que pasar a la API de WhatsApp Business (Cloud API) con un servidorcito que reciba el pedido y lo envíe. Ese cambio solo toca la función `enviar()` de `js/app.js`.

## Instalarla en el celular (app web instalable)

La página es una **PWA**: el cliente la abre en el navegador y el teléfono le ofrece
instalarla. Después queda como un icono más, abre a pantalla completa (sin barra del
navegador) y **funciona aunque no haya datos**, porque todo se guarda en el teléfono.

- **Android (Chrome)**: aparece una banda arriba que dice *Instala Papitas Express* con
  el botón **Instalar**. También sale en el menú del navegador (⋮ → *Instalar aplicación*).
- **iPhone (Safari)**: aparece la banda con la instrucción *Compartir → Añadir a inicio*
  (Apple no permite el botón automático).
- Si el cliente toca la X, no vuelve a aparecer en ese teléfono.

### Requisito: HTTPS

El navegador solo permite instalar la app si la página va por **HTTPS** (o en
`localhost`). Por la IP de la red local en `http://` la app funciona igual, pero **no
ofrece instalarse**: es una regla de seguridad de los navegadores, no un fallo de la página.

### Si cambias algo, sube la versión

Los archivos van con `?v=N` en `index.html` **y** el número `VERSION` de `sw.js` (por
ejemplo `pe-26`). El teléfono guarda una copia de la app para abrirla sin datos, así que
si publicas un cambio y no subes esos números, el cliente seguirá viendo la versión
vieja. Regla: **cada cambio, un número más en los dos sitios.**

### Iconos y color de la app

En `assets/icons/` (192, 512, maskable y el de iPhone). El maskable lleva el logo más
pequeño a propósito: Android recorta el icono en círculo y así no corta el logo.
El color rojo de la barra del sistema sale de `manifest.webmanifest` (`theme_color`).

## Publicarlo (ya está publicado)

**La tienda está en línea:** https://jeikson.github.io/papitas-express/

- Repo: https://github.com/jeikson/papitas-express (público, sin *build*).
- Hosting: **GitHub Pages**, rama `main`, carpeta raíz. HTTPS automático con
  certificado de Let's Encrypt (renovación sola), y `http://` redirige a `https://`.
- El service worker y la instalación funcionan porque va por HTTPS. El índice y el
  `sw.js` se sirven con `Cache-Control: max-age=600`, así que un cambio se ve en
  minutos; para forzarlo antes, sube los números de versión (ver abajo).

### Publicar un cambio

```bash
cd ~/repos/papitas-express
git add -A && git commit -m "lo que cambiaste"
git push
```

GitHub Pages reconstruye solo (1-2 minutos). Míralo con:

```bash
gh api /repos/jeikson/papitas-express/pages/builds/latest --jq '.status'
```

### Cambiar el menú (lo de todos los días)

1. **Precios, productos, adiciones, salsas, categorías** → `js/menu.js`.
   Precios en pesos sin puntos (`30000`), `img: ''` = tarjeta sin foto,
   `destacado: true` = cinta "Más pedida". Para cambiar fotos ve
   [Las fotos van en dos formatos](#las-fotos-van-en-dos-formatos) (hay que subir
   el `.jpg` **y** el `.webp` con el mismo nombre).
2. **WhatsApp, horario, domicilio, formas de pago** → `js/config.js`.
3. **Sube la versión** (si no, el teléfono sigue mostrando la copia vieja):
   cambia `?v=N` en `index.html` **y** `VERSION = 'pe-N'` en `sw.js`, el mismo número.
4. `git add -A && git commit -m "..." && git push`. En 1-2 minutos está en línea.

Para verlo antes de publicar: `python3 -m http.server 8899` y abre
`http://localhost:8899` (así también se instala, porque `localhost` cuenta como HTTPS).

### Otros hostings

Los archivos de configuración de otras casas siguen en el repo y no estorban:
`_headers` (Netlify / Cloudflare Pages) y `.htaccess` (Apache / cPanel). GitHub Pages
los ignora, así que si algún día te mudas solo hay que arrastrar la carpeta o conectar
el repo. Cualquier hosting estático sirve: **sin build, sin comando de compilación**.
Lo único obligatorio es **HTTPS** (WhatsApp y la instalación de la app lo piden).

### Dominio propio (opcional)

Si compras un dominio (por ejemplo `papitas.express`), en GitHub Pages se conecta en
*Settings → Pages → Custom domain* y en el DNS del dominio se apunta a
`jeikson.github.io` (o los 4 registros A de Pages). El certificado HTTPS lo emite
GitHub automáticamente. No hace falta mover ningún archivo.


## Archivos de configuración del hosting

- **`_headers`** — reglas de caché y seguridad para **Netlify y Cloudflare Pages**
  (el hosting lo lee solo). El `index.html` y el `sw.js` nunca se guardan en caché,
  así el cliente recibe las versiones nuevas; las fotos se guardan 7 días y las
  tipografías un año.
- **`.htaccess`** — lo mismo para **hosting Apache / cPanel** (Hostinger, GoDaddy,
  Hostgator…): compresión, tipo de archivo del manifest y tiempos de caché.
  En Netlify/Cloudflare se ignora, no molesta.

Ninguno de los dos hay que tocarlo a mano.

## Detalles de implementación

- HTML + CSS + JavaScript sin dependencias ni build. Todo el estado en memoria + `localStorage`.
- Mobile first: bottom sheet para el producto, panel lateral en escritorio, barra inferior con el total siempre visible.
- Validación en el navegador (nombre, teléfono, dirección, valor de pago vs. total). No hay validaciones en servidor porque no hay servidor: si necesitas control de precios, la comanda ya va con los precios congelados al momento del envío.
- El número de WhatsApp y todos los datos del negocio son públicos en el código (igual que en cualquier web estática). No pongas ahí datos sensibles.
