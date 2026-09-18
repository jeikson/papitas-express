/* ==========================================================================
   PAPITAS EXPRESS — menú, adiciones, salsas y zonas de domicilio
   Este es el archivo que se edita para cambiar productos o precios.
   Precios en pesos, sin puntos ni comas (ej: 29000).
   ========================================================================== */
window.MENU = {
  categorias: ['ESTACIONES', 'BEBIDAS'],

  productos: [
    {
      id: 1, cat: 'ESTACIONES', nombre: 'Estación Mixta', precio: 30000,
      desc: 'Carne y pollo desmechado, tocino caramelizado, huevo de codorniz y salsas de la casa.',
      ingredientes: ['Papitas crocantes', 'Queso derretido', 'Carne de res desmechada con guiso', 'Pollo con guiso',
        'Tocino caramelizado con BBQ dulce', 'Salsa rosada de la casa', 'Salsa a base de ajo y tocino ahumado', 'Huevo de codorniz'],
      img: 'assets/img/estacion-03-mixta.jpg', destacado: true,
    },
    {
      id: 2, cat: 'ESTACIONES', nombre: 'Estación Carne Desmechada', precio: 29000,
      desc: 'Carne de res desmechada con guiso, tocino caramelizado y salsa rosada de la casa.',
      ingredientes: ['Papitas crocantes', 'Queso derretido', 'Carne de res desmechada con guiso',
        'Tocino caramelizado con BBQ dulce', 'Salsa rosada de la casa', 'Salsa a base de ajo y tocino ahumado'],
      img: 'assets/img/estacion-01-carne-desmechada.jpg',
    },
    {
      id: 3, cat: 'ESTACIONES', nombre: 'Estación Pulled Pork', precio: 27000,
      desc: 'Pulled pork caramelizado, sour cream, pico de gallo y guacamole.',
      ingredientes: ['Papitas crocantes', 'Pulled pork caramelizado con BBQ dulce', 'Sour cream', 'Pico de gallo',
        'Guacamole', 'Salsa a base de ajo y tocino ahumado'],
      img: 'assets/img/estacion-06-pulled-pork.jpg',
    },
    {
      id: 4, cat: 'ESTACIONES', nombre: 'Estación Pollo Desmechado', precio: 27000,
      desc: 'Pollo desmechado con guiso, tocino caramelizado, sour cream y maíz dulce.',
      ingredientes: ['Papitas crocantes', 'Queso derretido', 'Pollo desmechado con guiso', 'Tocino caramelizado con BBQ dulce',
        'Sour cream', 'Maíz dulce', 'Salsa rosada de la casa', 'Salsa a base de ajo y tocino ahumado'],
      img: 'assets/img/estacion-05-pollo-desmechado.jpg',
    },
    {
      id: 5, cat: 'ESTACIONES', nombre: 'Estación Ranchera', precio: 27000,
      desc: 'Tocino, salchicha caramelizada con BBQ dulce y maíz dulce.',
      ingredientes: ['Papitas crocantes', 'Queso derretido', 'Tocino caramelizado', 'Salchicha caramelizada con BBQ dulce',
        'Maíz dulce', 'Salsa a base de ajo y tocino ahumado'],
      img: 'assets/img/estacion-07-ranchera.jpg',
    },
    {
      id: 6, cat: 'ESTACIONES', nombre: 'Estación Tres Quesos', precio: 25000,
      desc: 'Queso derretido, queso costeño y salsa de queso a base de queso azul.',
      ingredientes: ['Papitas crocantes', 'Queso derretido', 'Tocino caramelizado con BBQ dulce', 'Queso costeño',
        'Salsa de queso a base de queso azul'],
      img: 'assets/img/estacion-02-tres-quesos.jpg',
    },
    {
      id: 7, cat: 'ESTACIONES', nombre: 'Estación Tradicional', precio: 25000,
      desc: 'Salchicha caramelizada, queso derretido, huevo de codorniz y salsas rosada y piña.',
      ingredientes: ['Papitas crocantes', 'Salchicha caramelizada con BBQ dulce', 'Queso derretido', 'Huevo de codorniz',
        'Salsas rosada y piña de la casa'],
      img: 'assets/img/estacion-04-tradicional.jpg',
    },

    { id: 20, cat: 'BEBIDAS', nombre: 'Coca Cola', precio: 4500, desc: 'Botella personal.', img: '' },
    { id: 21, cat: 'BEBIDAS', nombre: 'Sprite', precio: 4500, desc: 'Botella personal.', img: '' },
    { id: 22, cat: 'BEBIDAS', nombre: 'Quatro', precio: 4500, desc: 'Botella personal.', img: '' },
    { id: 23, cat: 'BEBIDAS', nombre: 'Del Valle', precio: 4500, desc: 'Jugo personal.', img: '' },
    { id: 24, cat: 'BEBIDAS', nombre: 'Agua saborizada', precio: 4500, desc: '', img: '' },
    { id: 25, cat: 'BEBIDAS', nombre: 'Agua con gas', precio: 4500, desc: '', img: '' },
    { id: 26, cat: 'BEBIDAS', nombre: 'Agua sin gas', precio: 3500, desc: '', img: '' },
  ],

  adiciones: [
    { id: 101, nombre: 'Tocino caramelizado', precio: 4000 },
    { id: 102, nombre: 'Carne desmechada', precio: 5000 },
    { id: 103, nombre: 'Pollo desmechado', precio: 4000 },
    { id: 104, nombre: 'Salchicha caramelizada', precio: 4000 },
    { id: 105, nombre: 'Huevitos x5', precio: 3000 },
    { id: 106, nombre: 'Pico de gallo', precio: 2000 },
    { id: 107, nombre: 'Sour cream', precio: 2000 },
    { id: 108, nombre: 'Guacamole', precio: 2000 },
    { id: 109, nombre: 'Maíz dulce', precio: 2000 },
    { id: 110, nombre: 'Queso costeño', precio: 2000 },
  ],

  salsas: ['Rosada de la casa', 'Queso azul', 'BBQ dulce', 'Ajo', 'Piña', 'Ajo + tocino', 'Sin salsa'],

  opciones: ['Salsas aparte', 'Sin picante', 'Bien crocantes', 'Empaque aparte', 'Servilletas y cubiertos'],

  // Zonas de domicilio. Con CONFIG.domicilio.usarBarrios = false esta lista no se usa.
  barrios: [
    // { nombre: 'Centro', valor: 3000 },
    // { nombre: 'Bocagrande', valor: 5000 },
    // { nombre: 'Manga', valor: 5000 },
  ],
};
