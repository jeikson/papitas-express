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
      destacado: true
    },
    {
      id: 3, cat: 'ESTACIONES', nombre: 'Estación Pulled Pork', precio: 27000,
      desc: 'Pulled pork caramelizado, sour cream, pico de gallo y guacamole.',
      ingredientes: ['Papitas crocantes', 'Pulled pork caramelizado con BBQ dulce', 'Sour cream', 'Pico de gallo',
        'Guacamole', 'Salsa a base de ajo y tocino ahumado'],
      img: 'assets/img/estacion-06-pulled-pork.jpg',
      destacado: true
    },
    {
      id: 4, cat: 'ESTACIONES', nombre: 'Estación Pollo Desmechado', precio: 27000,
      desc: 'Pollo desmechado con guiso, tocino caramelizado, sour cream y maíz dulce.',
      ingredientes: ['Papitas crocantes', 'Queso derretido', 'Pollo desmechado con guiso', 'Tocino caramelizado con BBQ dulce',
        'Sour cream', 'Maíz dulce', 'Salsa rosada de la casa', 'Salsa a base de ajo y tocino ahumado'],
      img: 'assets/img/estacion-05-pollo-desmechado.jpg',
      destacado: true
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

  // ---------------------------------------------------------------------------
  // GRUPOS DE OPCIONES (patrón Rappi): obligatorio / máximos / extras con precio
  // obligatorio: true  → hay que elegir al menos min antes de agregar
  // max: n             → no deja marcar más de n (0 = sin límite)
  // Puedes darle a un producto su propia lista con `grupos: ['salsas','extras']`.
  // ---------------------------------------------------------------------------
  grupos: {
    salsas: {
      etiqueta: 'Salsas',
      nombre: 'Elige las salsas', obligatorio: true, min: 1, max: 3,
      ayuda: 'Obligatorio · elige de 1 a 3',
      opciones: [
        { nombre: 'BBQ', precio: 0 }, { nombre: 'Mostaza', precio: 0 },
        { nombre: 'Salsa de la casa', precio: 0 }, { nombre: 'Rosada', precio: 0 },
        { nombre: 'Piña', precio: 0 }, { nombre: 'Tomate', precio: 0 },
        { nombre: 'Ajo + tocino', precio: 0 }, { nombre: 'Sin salsas', precio: 0 }
      ]
    },
    extras: {
      etiqueta: 'Extras',
      nombre: 'Elige tus extras', max: 11, ayuda: 'Opcional · hasta 11',
      opciones: [
        { nombre: 'Carne desmechada', precio: 7000 },
        { nombre: 'Tocino caramelizado', precio: 6000 },
        { nombre: 'Tocino al barril en BBQ', precio: 8500 },
        { nombre: 'Chorizo santarrosano', precio: 6500 },
        { nombre: 'Bombón de pollo apanado', precio: 9500 },
        { nombre: 'Queso', precio: 7000 },
        { nombre: 'Huevo de codorniz x5', precio: 6500 },
        { nombre: 'Pollo desmechado', precio: 7000 },
        { nombre: 'Salchicha caramelizada', precio: 6000 },
        { nombre: 'Pico de gallo', precio: 3000 },
        { nombre: 'Guacamole', precio: 3000 },
        { nombre: 'Sour cream', precio: 3000 },
        { nombre: 'Maíz dulce', precio: 3000 },
        { nombre: 'Queso costeño', precio: 3000 }
      ]
    },
    bebidas: {
      etiqueta: 'Bebidas',
      nombre: 'Elige algo de beber', max: 2, ayuda: 'Opcional · hasta 2',
      opciones: [
        { nombre: 'Mr Tea 500 ml', precio: 7700 },
        { nombre: 'Pepsi 400 ml', precio: 7700 },
        { nombre: 'Colombiana 400 ml', precio: 7700 },
        { nombre: 'Agua 500 ml', precio: 5000 },
        { nombre: 'Agua frutos verdes 1.5 L', precio: 11200 },
        { nombre: 'Colombiana 1.5 L', precio: 11200 },
        { nombre: 'Manzana 1.5 L', precio: 11200 }
      ]
    },
    preferencias: {
      etiqueta: 'Preferencias',
      nombre: 'Preferencias', max: 0, ayuda: 'Opcional',
      opciones: [
        { nombre: 'Salsas aparte', precio: 0 }, { nombre: 'Sin picante', precio: 0 },
        { nombre: 'Bien crocantes', precio: 0 }, { nombre: 'Empaque aparte', precio: 0 },
        { nombre: 'Servilletas y cubiertos', precio: 0 }
      ]
    }
  },

  // Grupos que se muestran por categoría (un producto puede sobrescribirlo con `grupos`)
  gruposPorCategoria: {
    ESTACIONES: ['salsas', 'extras', 'bebidas', 'preferencias'],
    BEBIDAS: ['preferencias']
  },

  // Bloque "Tus opciones recomendadas" de la ficha (nombres del grupo `extras`)
  recomendados: ['Chorizo santarrosano', 'Tocino al barril en BBQ'],

  // Compatibilidad / uso directo en otras partes
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

  // Calificaciones de ejemplo (Rappi las muestra en la ficha). Borra para ocultarlas.
  calificaciones: { pct: 87, total: 434 },

  // Zonas de domicilio. Con CONFIG.domicilio.usarBarrios = false esta lista no se usa.
  barrios: [
    // { nombre: 'Centro', valor: 3000 },
    // { nombre: 'Bocagrande', valor: 5000 },
    // { nombre: 'Manga', valor: 5000 },
  ],
};
