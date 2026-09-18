/* ==========================================================================
   PAPITAS EXPRESS — configuración
   Todo lo editable del negocio está en este archivo (y en js/menu.js).
   ========================================================================== */
window.CONFIG = {
  negocio: {
    nombre: 'Papitas Express',
    eslogan: 'Donde el viaje inicia con sabor',
    // Número que RECIBE la comanda. Formato internacional, sin + y sin espacios.
    whatsapp: '573007107250',
    telefonoVisible: '300 710 7250',
    instagram: 'papitas.express',
    ciudad: 'Cartagena',
    // Se muestra como referencia de entrega en la cabecera
    tiempoPreparacion: '25 a 35 min',
  },

  // Horario de atención (hora local del dispositivo del cliente).
  // Si la hora final es menor que la inicial, se entiende que cruza medianoche.
  horario: {
    inicio: '18:00',
    fin: '23:00',
    bloquearFueraDeHorario: false, // true = no permite enviar fuera de horario
  },

  // Domicilio
  domicilio: {
    activo: true,
    // true = el valor sale de la lista de barrios (js/menu.js → barrios).
    // false = se cobra valorFijo a todos.
    usarBarrios: false,
    valorFijo: 3000,
    minimoCompra: 0,
  },

  // Métodos de pago ofrecidos
  pagos: ['Efectivo', 'Transferencia / Nequi', 'Datáfono'],

  // Interruptores de la experiencia
  extras: {
    adiciones: true,
    salsas: true,
    opciones: true,
    notaProducto: true,
    notaGeneral: true,
    buscar: true,        // muestra el buscador
    maxCantidad: 20,
  },

  // Preguntar "¿con cuánto pagas?" cuando el pago es en efectivo
  pedirPagaCon: true,
};
