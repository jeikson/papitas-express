/* ==========================================================================
   PAPITAS EXPRESS — carta
   Fuente única de verdad: el PDF "MENU NUEVO PAPITAS EXPRESS"
   (7 estaciones, 7 bebidas, 6 salsas y 10 adiciones, con sus precios).
   Nada de aquí es inventado: si un dato no está en la carta, no va.
   ========================================================================== */
window.MENU = {

  categorias: ['ESTACIONES', 'BEBIDAS'],

  productos: [
    {
      id: 1, cat: 'ESTACIONES', nombre: 'Estación Mixta', precio: 30000,
      desc: 'Carne y pollo desmechados, tocino caramelizado y huevo de codorniz.',
      ingredientes: ['Papitas crocantes', 'Queso derretido', 'Carne de res desmechada con guiso',
        'Pollo con guiso', 'Tocino caramelizado con BBQ dulce', 'Salsa rosada de la casa',
        'Salsa a base de ajo y tocino ahumado', 'Huevo de codorniz'],
      img: 'assets/img/estacion-03-mixta.jpg',
    },
    {
      id: 2, cat: 'ESTACIONES', nombre: 'Estación Carne Desmechada', precio: 29000,
      desc: 'Carne de res desmechada con guiso y tocino caramelizado.',
      ingredientes: ['Papitas crocantes', 'Queso derretido', 'Carne de res desmechada con guiso',
        'Tocino caramelizado con BBQ dulce', 'Salsa rosada de la casa',
        'Salsa a base de ajo y tocino ahumado'],
      img: 'assets/img/estacion-01-carne-desmechada.jpg',
    },
    {
      id: 3, cat: 'ESTACIONES', nombre: 'Estación Pulled Pork', precio: 27000,
      desc: 'Pulled pork caramelizado con sour cream, pico de gallo y guacamole.',
      ingredientes: ['Papitas crocantes', 'Pulled pork caramelizado con BBQ dulce', 'Sour cream',
        'Pico de gallo', 'Guacamole', 'Salsa a base de ajo y tocino ahumado'],
      img: 'assets/img/estacion-06-pulled-pork.jpg',
    },
    {
      id: 4, cat: 'ESTACIONES', nombre: 'Estación Pollo Desmechado', precio: 27000,
      desc: 'Pollo desmechado con guiso, tocino caramelizado, sour cream y maíz.',
      ingredientes: ['Papitas crocantes', 'Queso derretido', 'Pollo desmechado con guiso',
        'Tocino caramelizado con BBQ dulce', 'Sour cream', 'Maíz dulce',
        'Salsa rosada de la casa', 'Salsa a base de ajo y tocino ahumado'],
      img: 'assets/img/estacion-05-pollo-desmechado.jpg',
    },
    {
      id: 5, cat: 'ESTACIONES', nombre: 'Estación Ranchera', precio: 27000,
      desc: 'Tocino, salchicha caramelizada con BBQ dulce y maíz.',
      ingredientes: ['Papitas crocantes', 'Queso derretido', 'Tocino caramelizado',
        'Salchicha caramelizada con BBQ dulce', 'Maíz dulce',
        'Salsa a base de ajo y tocino ahumado'],
      img: 'assets/img/estacion-07-ranchera.jpg',
    },
    {
      id: 6, cat: 'ESTACIONES', nombre: 'Estación Tres Quesos', precio: 25000,
      desc: 'Queso derretido, queso costeño y salsa de queso azul.',
      ingredientes: ['Papitas crocantes', 'Queso derretido', 'Tocino caramelizado con BBQ dulce',
        'Queso costeño', 'Salsa de queso a base de queso azul'],
      img: 'assets/img/estacion-02-tres-quesos.jpg',
    },
    {
      id: 7, cat: 'ESTACIONES', nombre: 'Estación Tradicional', precio: 25000,
      desc: 'Salchicha caramelizada con BBQ dulce, queso y huevo de codorniz.',
      ingredientes: ['Papitas crocantes', 'Salchicha caramelizada con BBQ dulce', 'Queso derretido',
        'Huevo de codorniz', 'Salsas rosada y piña de la casa'],
      img: 'assets/img/estacion-04-tradicional.jpg',
    },

    // Bebidas (carta, página de BEBIDAS)
    { id: 20, cat: 'BEBIDAS', nombre: 'Coca cola', precio: 4500, desc: '', img: '' },
    { id: 21, cat: 'BEBIDAS', nombre: 'Sprite', precio: 4500, desc: '', img: '' },
    { id: 22, cat: 'BEBIDAS', nombre: 'Quatro', precio: 4500, desc: '', img: '' },
    { id: 23, cat: 'BEBIDAS', nombre: 'Del Valle', precio: 4500, desc: '', img: '' },
    { id: 24, cat: 'BEBIDAS', nombre: 'Agua saborizada', precio: 4500, desc: '', img: '' },
    { id: 25, cat: 'BEBIDAS', nombre: 'Agua con gas', precio: 4500, desc: '', img: '' },
    { id: 26, cat: 'BEBIDAS', nombre: 'Agua sin gas', precio: 3500, desc: '', img: '' },
  ],

  // ---------------------------------------------------------------------------
  // GRUPOS DE OPCIONES de cada estación. Los nombres y precios son los de la
  // carta; `obligatorio`, `max` y `ayuda` son decisiones de experiencia (se
  // pueden cambiar sin tocar los datos del negocio).
  // ---------------------------------------------------------------------------
  grupos: {
    salsas: {
      etiqueta: 'Salsas',
      nombre: 'Elige las salsas', obligatorio: true, min: 1, max: 3,
      ayuda: 'Obligatorio · elige de 1 a 3',
      opciones: [
        { nombre: 'Rosada', precio: 0 },
        { nombre: 'Queso azul', precio: 0 },
        { nombre: 'BBQ dulce', precio: 0 },
        { nombre: 'Ajo', precio: 0 },
        { nombre: 'Piña', precio: 0 },
        { nombre: 'Ajo + tocino', precio: 0 },
        { nombre: 'Sin salsas', precio: 0 }
      ]
    },
    extras: {
      etiqueta: 'Adiciones',
      nombre: 'Elige tus adiciones', max: 10, ayuda: 'Opcional',
      opciones: [
        { nombre: 'Tocino caramelizado', precio: 4000 },
        { nombre: 'Carne desmechada', precio: 5000 },
        { nombre: 'Pollo desmechado', precio: 4000 },
        { nombre: 'Salchicha caramelizada', precio: 4000 },
        { nombre: 'Huevitos x5', precio: 3000 },
        { nombre: 'Pico de gallo', precio: 2000 },
        { nombre: 'Sour cream', precio: 2000 },
        { nombre: 'Guacamole', precio: 2000 },
        { nombre: 'Maíz', precio: 2000 },
        { nombre: 'Queso costeño', precio: 2000 }
      ]
    },
    bebidas: {
      etiqueta: 'Bebidas',
      nombre: 'Elige algo de beber', max: 2, ayuda: 'Opcional',
      opciones: [
        { nombre: 'Coca cola', precio: 4500 },
        { nombre: 'Sprite', precio: 4500 },
        { nombre: 'Quatro', precio: 4500 },
        { nombre: 'Del Valle', precio: 4500 },
        { nombre: 'Agua saborizada', precio: 4500 },
        { nombre: 'Agua con gas', precio: 4500 },
        { nombre: 'Agua sin gas', precio: 3500 }
      ]
    }
  },

  // Un producto puede mostrar su propia lista con `grupos: ['salsas', 'extras']`
  gruposPorCategoria: {
    ESTACIONES: ['salsas', 'extras', 'bebidas'],
    BEBIDAS: []
  },

  // Bloque de sugerencias de la ficha: nombres del grupo `extras`
  recomendados: ['Tocino caramelizado', 'Carne desmechada'],

  // Zonas de domicilio. Con CONFIG.domicilio.usarBarrios = false esta lista no se usa.
  barrios: [
    // { nombre: 'Centro', valor: 6000 },
  ],
};
