/* ==========================================================================
   PAPITAS EXPRESS — lógica de la tienda (experiencia tipo Rappi)
   Flujo: inicio con buscador → ficha del producto → contador en la tarjeta →
   pantalla "Tu pedido" por bloques (entrega, datos, pago, resumen) →
   comanda a WhatsApp → seguimiento del pedido.
   Sin backend: el pedido vive en el chat de WhatsApp.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.CONFIG, MENU = window.MENU;
  var LS = 'papitas_pedido_v1', LS_ULTIMO = 'papitas_ultimo_pedido';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return '$ ' + Math.round(n).toLocaleString('es-CO'); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var ic = function (name, size) {
    return '<svg class="ic' + (size ? ' ic--' + size : '') + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
  };

  var st = cargar();
  var draft = null;
  var ultimoMensaje = '';

  /* ------------------------------------------------------------------ estado */
  function cargar() {
    var base = {
      items: [], cat: MENU.categorias[0], q: '', vista: 'inicio',
      cliente: {
        nombre: '', telefono: '', entrega: 'domicilio', barrio: '',
        direccion: '', referencia: '', pago: CFG.pagos[0], pagaCon: '', nota: ''
      },
      enviado: null
    };
    try {
      var raw = localStorage.getItem(LS);
      if (!raw) return base;
      var saved = JSON.parse(raw);
      base.items = Array.isArray(saved.items) ? saved.items : [];
      base.cliente = Object.assign(base.cliente, saved.cliente || {});
      if (CFG.pagos.indexOf(base.cliente.pago) === -1) base.cliente.pago = CFG.pagos[0];
    } catch (e) {}
    return base;
  }
  function guardar() {
    try {
      localStorage.setItem(LS, JSON.stringify({
        items: st.items, cliente: st.cliente, enviado: st.enviado
      }));
    } catch (e) {}
  }
  function guardarUltimo() {
    try { localStorage.setItem(LS_ULTIMO, JSON.stringify({ items: st.items, cliente: st.cliente, fecha: Date.now() })); } catch (e) {}
  }
  function ultimoPedido() {
    try {
      var d = JSON.parse(localStorage.getItem(LS_ULTIMO) || 'null');
      return d && d.items && d.items.length ? d : null;
    } catch (e) { return null; }
  }

  /* --------------------------------------------------------------- utilidades */
  function producto(id) {
    for (var i = 0; i < MENU.productos.length; i++) if (MENU.productos[i].id === id) return MENU.productos[i];
    return null;
  }
  function envio() {
    if (!CFG.domicilio.activo || st.cliente.entrega !== 'domicilio') return 0;
    if (CFG.domicilio.usarBarrios) {
      var b = (MENU.barrios || []).filter(function (x) { return x.nombre === st.cliente.barrio; })[0];
      return b ? Number(b.valor) || 0 : 0;
    }
    return Number(CFG.domicilio.valorFijo) || 0;
  }
  function subtotal() { return st.items.reduce(function (a, it) { return a + it.precio * it.cant; }, 0); }
  function total() { return subtotal() + envio(); }
  function unidades() { return st.items.reduce(function (a, it) { return a + it.cant; }, 0); }
  function cantidadDe(id) {
    return st.items.filter(function (x) { return x.id === id; })
      .reduce(function (a, x) { return a + x.cant; }, 0);
  }
  function ultimaVariante(id) {
    var found = null;
    st.items.forEach(function (x) { if (x.id === id) found = x; });
    return found;
  }
  function horario() {
    var h = CFG.horario, d = new Date();
    var min = d.getHours() * 60 + d.getMinutes();
    var a = h.inicio.split(':'), b = h.fin.split(':');
    var ini = (+a[0]) * 60 + (+a[1]), fin = (+b[0]) * 60 + (+b[1]);
    return { abierto: fin > ini ? (min >= ini && min <= fin) : (min >= ini || min <= fin), ini: h.inicio, fin: h.fin };
  }
  function h12(hhmm) {
    var p = hhmm.split(':'), h = +p[0];
    var ap = h >= 12 ? 'p.m.' : 'a.m.';
    h = h % 12; if (h === 0) h = 12;
    return h + ':' + p[1] + ' ' + ap;
  }
  function toast(txt, icono) {
    var t = $('#toast');
    t.innerHTML = (icono ? ic(icono, 18) : '') + '<span>' + esc(txt) + '</span>';
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function foto(p) {
    if (!p.img) return ic(p.cat === 'BEBIDAS' ? 'store' : 'flame', 34);
    return '<img src="' + esc(p.img) + '" alt="' + esc(p.nombre) + '" loading="lazy" decoding="async" onload="this.classList.add(\'is-loaded\')" onerror="this.remove()">';
  }
  function activarFotos(raiz) {
    $$('img', raiz || document).forEach(function (i) {
      if (i.complete && i.naturalWidth > 0) i.classList.add('is-loaded');
    });
  }

  /* ---------------------------------------------------------------- arranque */
  function init() {
    document.title = CFG.negocio.nombre + ' — Pedidos';
    $$('[data-negocio]').forEach(function (e) { e.textContent = CFG.negocio.nombre; });
    $$('[data-eslogan]').forEach(function (e) { e.textContent = CFG.negocio.eslogan || ''; });
    $$('[data-ciudad]').forEach(function (e) { e.textContent = CFG.negocio.ciudad; });
    $$('[data-tel]').forEach(function (e) { e.textContent = CFG.negocio.telefonoVisible; });
    if (!CFG.extras.buscar) $('#buscadorWrap').hidden = true;
    $('#entregaEn').textContent = 'Entregar en · ' + CFG.negocio.ciudad +
      (CFG.negocio.tiempoPreparacion ? ' · ' + CFG.negocio.tiempoPreparacion : '');

    renderEstado();
    renderHero();
    renderChips();
    renderDestacados();
    renderGrid();
    renderBarra();
    renderNav();
    eventos();
  }

  function renderHero() {
    var chips = [];
    if (CFG.domicilio.activo) {
      var d = CFG.domicilio.usarBarrios && (MENU.barrios || []).length
        ? 'Domicilio según tu zona' : 'Domicilio ' + money(CFG.domicilio.valorFijo);
      chips.push('<span class="hchip">' + ic('scooter', 18) + d + '</span>');
    }
    chips.push('<span class="hchip">' + ic('store', 18) + 'También puedes recoger</span>');
    chips.push('<span class="hchip">' + ic('cash', 18) + esc(CFG.pagos.slice(0, 2).join(' · ')) + '</span>');
    $('#heroChips').innerHTML = chips.join('');
  }

  function renderEstado() {
    var h = horario();
    $('#estado').textContent = h.abierto ? 'Abierto · hasta ' + h12(h.fin) : 'Cerrado · abre ' + h12(h.ini);
    $('#dot').className = 'dot ' + (h.abierto ? 'dot--ok' : 'dot--no');
    var av = $('#aviso');
    if (!h.abierto) {
      av.hidden = false;
      av.className = 'aviso aviso--cerrado';
      av.innerHTML = ic('clock', 18) + '<span>Ahora estamos cerrados (atendemos de ' + h12(h.ini) + ' a ' + h12(h.fin) + '). ' +
        (CFG.horario.bloquearFueraDeHorario ? 'Vuelve en nuestro horario para pedir.' : 'Puedes dejar tu pedido y lo confirmamos al abrir.') + '</span>';
    } else { av.hidden = true; }
  }

  function renderChips() {
    var h = '<button class="chip' + (!st.q && st.cat === 'TODO' ? ' chip--on' : '') + '" data-cat="TODO">Todo</button>';
    MENU.categorias.forEach(function (c) {
      h += '<button class="chip' + (st.cat === c && !st.q ? ' chip--on' : '') + '" data-cat="' + esc(c) + '">' +
        esc(c.charAt(0) + c.slice(1).toLowerCase()) + '</button>';
    });
    $('#chips').innerHTML = h;
  }

  function filtrar() {
    var q = st.q.trim().toLowerCase();
    return MENU.productos.filter(function (p) {
      if (q) return (p.nombre + ' ' + (p.desc || '')).toLowerCase().indexOf(q) !== -1;
      return st.cat === 'TODO' || p.cat === st.cat;
    });
  }

  function accionProducto(p) {
    var n = cantidadDe(p.id);
    if (n === 0) {
      return '<button type="button" class="card__add" data-agregar="' + p.id + '">' + ic('plus', 18) + '<span>Agregar</span></button>';
    }
    return '<span class="stepper-mini" role="group" aria-label="Cantidad de ' + esc(p.nombre) + '">' +
      '<button type="button" data-card-menos="' + p.id + '" aria-label="Quitar uno">' + ic('minus', 18) + '</button>' +
      '<b>' + n + '</b>' +
      '<button type="button" data-card-mas="' + p.id + '" aria-label="Agregar uno">' + ic('plus', 18) + '</button></span>';
  }

  function renderDestacados() {
    var dest = MENU.productos.filter(function (p) { return p.destacado; });
    if (!dest.length) { $('#secDestacados').hidden = true; return; }
    $('#carrusel').innerHTML = dest.map(function (p) {
      return '<article class="ccard" data-id="' + p.id + '" role="button" tabindex="0">' +
        '<div class="ccard__img">' + foto(p) + '</div>' +
        '<div class="ccard__body"><h3 class="ccard__name">' + esc(p.nombre) + '</h3>' +
        '<div class="ccard__row"><span class="ccard__price">' + money(p.precio) + '</span>' + accionProducto(p) + '</div>' +
        '</div></article>';
    }).join('');
    activarFotos($('#carrusel'));
  }

  function renderGrid() {
    var list = filtrar();
    $('#grid').innerHTML = list.map(function (p) {
      return '<article class="card" data-id="' + p.id + '" role="button" tabindex="0" aria-label="' + esc(p.nombre + ', ' + money(p.precio)) + '">' +
        '<div class="card__img">' + foto(p) +
          (p.destacado ? '<span class="card__tag">Más pedida</span>' : '') +
          '<span class="card__ptag">' + money(p.precio) + '</span>' +
        '</div>' +
        '<div class="card__body">' +
          '<h3 class="card__name">' + esc(p.nombre) + '</h3>' +
          (p.desc ? '<p class="card__desc">' + esc(p.desc) + '</p>' : '') +
          '<div class="card__foot"><span class="card__price">' + money(p.precio) + '</span>' + accionProducto(p) + '</div>' +
        '</div></article>';
    }).join('');
    $('#vacio').hidden = list.length > 0;
    $('#tituloMenu').hidden = !!st.q.trim();
    var m = $('#meta');
    if (st.q.trim()) {
      m.hidden = false;
      m.textContent = list.length + (list.length === 1 ? ' resultado' : ' resultados') + ' para “' + st.q.trim() + '”';
    } else { m.hidden = true; }
    activarFotos($('#grid'));
  }

  function renderBarra() {
    var n = unidades();
    $('#cartCount').textContent = n;
    $('#navBadge').textContent = n;
    $('#navBadge').hidden = n === 0;
    var enInicio = st.vista === 'inicio' && $('#drawer').hidden;
    $('#barra').hidden = n === 0 || !enInicio;
    $('#barraItems').textContent = n + (n === 1 ? ' producto' : ' productos');
    $('#barraTotal').textContent = money(total());
  }
  function renderNav() {
    $$('.nav__item').forEach(function (b) {
      var v = b.dataset.vista;
      var on = (v === 'pedido' && !$('#drawer').hidden) || (v === 'inicio' && $('#drawer').hidden);
      b.classList.toggle('nav__item--on', on);
    });
  }
  function bump() {
    ['#btnCart', '#barra'].forEach(function (sel) {
      var el = $(sel); if (!el) return;
      el.classList.remove('is-bump');
      void el.offsetWidth;
      el.classList.add('is-bump');
    });
  }
  function refrescarInicio() { renderChips(); renderDestacados(); renderGrid(); renderBarra(); }

  /* -------------------------------------------------------- ficha del producto */
  function abrirFicha(id) {
    var p = producto(id); if (!p) return;
    draft = { id: p.id, cant: 1, salsas: [], opciones: [], adiciones: [], nota: '' };
    renderFicha();
    $('#sheet').hidden = false; $('#overlay').hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function cerrarFicha() {
    $('#sheet').hidden = true; $('#overlay').hidden = true;
    $('#sheetFoot').hidden = true;
    if ($('#drawer').hidden) document.body.style.overflow = '';
    draft = null;
    renderBarra();
  }

  function renderFicha() {
    var p = producto(draft.id);
    var extra = draft.adiciones.reduce(function (a, x) { return a + x.precio; }, 0);
    var totalItem = (p.precio + extra) * draft.cant;
    var h = '';

    h += '<div class="sheet__hero">' + foto(p) +
      '<button class="sheet__x" type="button" data-cerrar aria-label="Cerrar">' + ic('x', 18) + '</button></div>' +
      '<div class="sheet__pad">' +
      '<h2 class="sheet__title" id="sheetTitle">' + esc(p.nombre) + '</h2>' +
      '<div class="sheet__price">' + money(p.precio) + '</div>';

    if (p.ingredientes && p.ingredientes.length) {
      h += '<ul class="ing">' + p.ingredientes.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
    } else if (p.desc) {
      h += '<p style="color:var(--muted);font-size:.92rem;margin:12px 0 0">' + esc(p.desc) + '</p>';
    }

    if (CFG.extras.salsas && MENU.salsas.length) {
      h += '<div class="sec"><div class="sec__h"><h4>Elige tus salsas</h4><small>' +
        (draft.salsas.length ? draft.salsas.length + ' elegida(s)' : 'puedes marcar varias') + '</small></div><div class="ops">' +
        MENU.salsas.map(function (s) {
          return '<button type="button" class="op' + (draft.salsas.indexOf(s) !== -1 ? ' op--on' : '') + '" data-salsa="' + esc(s) + '">' + esc(s) + '</button>';
        }).join('') + '</div></div>';
    }

    if (CFG.extras.opciones && MENU.opciones.length) {
      h += '<div class="sec"><div class="sec__h"><h4>Preferencias</h4></div><div class="ops">' +
        MENU.opciones.map(function (o) {
          return '<button type="button" class="op' + (draft.opciones.indexOf(o) !== -1 ? ' op--on' : '') + '" data-opcion="' + esc(o) + '">' + esc(o) + '</button>';
        }).join('') + '</div></div>';
    }

    if (CFG.extras.adiciones && MENU.adiciones.length) {
      h += '<div class="sec"><div class="sec__h"><h4>Adiciones</h4><small>' +
        (draft.adiciones.length ? draft.adiciones.length + ' agregada(s)' : 'opcional') + '</small></div><div class="adiciones">' +
        MENU.adiciones.map(function (a) {
          var on = !!draft.adiciones.filter(function (x) { return x.nombre === a.nombre; }).length;
          return '<button type="button" class="ad' + (on ? ' ad--on' : '') + '" data-adic="' + a.id + '" aria-pressed="' + on + '">' +
            '<span class="ad__check">' + ic('check', 14) + '</span>' +
            '<span class="ad__n">' + esc(a.nombre) + '</span>' +
            '<span class="ad__p">+ ' + money(a.precio) + '</span></button>';
        }).join('') + '</div></div>';
    }

    if (CFG.extras.notaProducto) {
      h += '<div class="sec"><div class="sec__h"><h4>Nota para la cocina</h4><small>opcional</small></div>' +
        '<textarea id="notaProd" placeholder="Ej: sin maíz, papas bien crocantes…">' + esc(draft.nota) + '</textarea></div>';
    }
    h += '</div>';

    $('#sheetBody').innerHTML = h;

    var pie = $('#sheetFoot');
    pie.hidden = false;
    pie.innerHTML = '<span class="cant">' +
      '<button type="button" data-paso="-1" aria-label="Quitar uno">' + ic('minus', 18) + '</button>' +
      '<b aria-live="polite">' + draft.cant + '</b>' +
      '<button type="button" data-paso="1" aria-label="Agregar uno">' + ic('plus', 18) + '</button></span>' +
      '<button class="btn btn--cta btn--block" id="btnAgregar">' + ic('cart', 18) + 'Agregar · ' + money(totalItem) + '</button>';

    var ta = $('#notaProd');
    if (ta) ta.addEventListener('input', function () { draft.nota = ta.value; });
    activarFotos($('#sheet'));
  }

  function cerrarTodo() {
    cerrarFicha();
    $('#drawer').hidden = true; $('#overlay').hidden = true;
    st.vista = 'inicio';
    document.body.style.overflow = '';
    renderBarra(); renderNav();
  }

  /* ------------------------------------------------------------------- carrito */
  function clave(it) {
    return [it.id, (it.salsas || []).join('|'), (it.opciones || []).join('|'),
      (it.adiciones || []).map(function (a) { return a.nombre; }).join('|'), it.nota || ''].join('§');
  }

  function agregar() {
    var p = producto(draft.id);
    var extra = draft.adiciones.reduce(function (a, x) { return a + x.precio; }, 0);
    var it = {
      id: p.id, nombre: p.nombre, precio: p.precio + extra, img: p.img, cat: p.cat,
      cant: draft.cant, salsas: draft.salsas.slice(), opciones: draft.opciones.slice(),
      adiciones: draft.adiciones.slice(), nota: draft.nota.trim()
    };
    var k = clave(it), found = null;
    st.items.forEach(function (x) { if (clave(x) === k) found = x; });
    if (found) found.cant = Math.min(CFG.extras.maxCantidad, found.cant + it.cant);
    else st.items.push(it);
    guardar(); cerrarFicha(); bump(); refrescarInicio();
    toast(p.nombre + ' agregado', 'check');
  }

  function cambiar(key, delta) {
    var i = st.items.findIndex(function (x) { return clave(x) === key; });
    if (i === -1) return;
    st.items[i].cant += delta;
    if (st.items[i].cant <= 0) st.items.splice(i, 1);
    guardar();
    if (st.vista === 'inicio') refrescarInicio();
    if (!$('#drawer').hidden) renderPedido();
    renderBarra();
  }

  // sumar/restar desde la tarjeta del menú (usa la última variante agregada)
  function cambiarDesdeTarjeta(id, delta) {
    var it = ultimaVariante(id);
    if (delta > 0) {
      if (it) {
        it.cant = Math.min(CFG.extras.maxCantidad, it.cant + 1);
        guardar(); bump(); refrescarInicio();
      } else {
        abrirFicha(id);
      }
      return;
    }
    if (!it) return;
    cambiar(clave(it), -1);
  }

  function eliminar(key) {
    st.items = st.items.filter(function (x) { return clave(x) !== key; });
    guardar(); refrescarInicio();
    if (!$('#drawer').hidden) renderPedido();
    toast('Producto eliminado');
  }

  /* ------------------------------------------------- pantalla "Tu pedido" */
  function abrirPedido() {
    st.vista = 'pedido';
    $('#drawer').hidden = false;
    document.body.style.overflow = 'hidden';
    renderPedido();
    renderBarra(); renderNav();
  }

  function renderPedido() {
    var body = $('#drawerBody'), foot = $('#drawerFoot');

    // seguimiento del último pedido enviado
    if (st.enviado) {
      $('#drawerTitle').textContent = 'Seguimiento';
      $('#drawerMenu').hidden = true;
      foot.hidden = false;
      body.innerHTML = vistaSeguimiento();
      foot.innerHTML = '<button class="btn btn--wa btn--block" id="btnReabrir">' + ic('wa', 20) + 'Abrir WhatsApp</button>';
      return;
    }

    $('#drawerMenu').hidden = false;
    if (!st.items.length) {
      var u = ultimoPedido();
      $('#drawerTitle').textContent = 'Tu pedido';
      foot.hidden = true;
      body.innerHTML = '<div class="estado-vacio">' + ic('cart', 34) +
        '<h3>Tu pedido está vacío</h3><p>Agrega tu estación favorita y vuelve aquí.</p>' +
        '<button class="btn btn--cta" data-vermenu>Ver el menú</button>' +
        (u ? '<button class="btn btn--ghost" data-repetir style="margin-top:10px">Repetir mi último pedido</button>' : '') +
        '</div>';
      return;
    }

    $('#drawerTitle').textContent = 'Tu pedido';
    body.innerHTML = vistaPedido();
    foot.hidden = false;
    foot.innerHTML = '<button class="btn btn--cta btn--block" id="btnEnviar">' +
      ic('wa', 20) + '<span>Realizar pedido</span><b class="btn__tot">' + money(total()) + '</b></button>';
    activarFotos($('#drawer'));
  }

  function vistaPedido() {
    var c = st.cliente, h = '';

    // --- bloque entrega ---
    h += '<div class="bloque"><div class="bloque__h">' + ic('scooter', 18) + 'Entrega' +
      '<span class="bloque__link" data-vermenu>Seguir agregando</span></div>' +
      '<div class="segment" id="segEntrega" style="margin-bottom:' + (c.entrega === 'domicilio' ? '14px' : '0') + '">' +
      '<button type="button" data-ent="domicilio" class="' + (c.entrega === 'domicilio' ? 'on' : '') + '">' + ic('scooter', 18) + 'Domicilio</button>' +
      '<button type="button" data-ent="punto" class="' + (c.entrega === 'punto' ? 'on' : '') + '">' + ic('store', 18) + 'Recoger</button>' +
      '</div>';
    if (c.entrega === 'domicilio') {
      if (CFG.domicilio.usarBarrios && (MENU.barrios || []).length) {
        h += campo('barrio', 'Barrio', '<select id="f_barrio"><option value="">Selecciona tu barrio…</option>' +
          MENU.barrios.map(function (b) {
            return '<option value="' + esc(b.nombre) + '"' + (c.barrio === b.nombre ? ' selected' : '') + '>' +
              esc(b.nombre) + ' · ' + money(b.valor) + '</option>';
          }).join('') + '</select>', true, 'El valor del domicilio depende de la zona.');
      }
      h += campo('direccion', 'Dirección', '<input type="text" id="f_direccion" value="' + esc(c.direccion) + '" placeholder="Calle 12 #34-56, torre 2 apto 501" autocomplete="street-address" enterkeyhint="next">', true);
      h += campo('referencia', 'Punto de referencia', '<input type="text" id="f_referencia" value="' + esc(c.referencia) + '" placeholder="Ej: portería, frente a la tienda de la esquina" enterkeyhint="next">', false);
    } else {
      h += '<p class="bloque__sub" style="margin:0">Te esperamos en Papitas Express · ' + esc(CFG.negocio.ciudad) + '</p>';
    }
    h += '</div>';

    // --- bloque productos ---
    h += '<div class="bloque"><div class="bloque__h">' + ic('receipt', 18) + 'Productos (' + unidades() + ')</div>' +
      st.items.map(function (it) {
        var k = clave(it), mods = '';
        if (it.salsas.length) mods += '<span>Salsas: ' + esc(it.salsas.join(', ')) + '</span>';
        if (it.opciones.length) mods += '<span>' + esc(it.opciones.join(' · ')) + '</span>';
        if (it.adiciones.length) mods += '<span>Adiciones: ' + esc(it.adiciones.map(function (a) { return a.nombre; }).join(', ')) + '</span>';
        if (it.nota) mods += '<span>Nota: ' + esc(it.nota) + '</span>';
        return '<div class="item">' +
          '<div class="item__img">' + foto(it) + '</div>' +
          '<div class="item__in">' +
            '<div class="item__row"><span class="item__name">' + esc(it.nombre) + '</span>' +
            '<span class="item__price">' + money(it.precio * it.cant) + '</span></div>' +
            (mods ? '<div class="item__mods">' + mods + '</div>' : '') +
            '<div class="item__tools">' +
              '<span class="stepper"><button type="button" data-menos="' + esc(k) + '" aria-label="Quitar uno">' + ic('minus', 18) + '</button>' +
              '<b>' + it.cant + '</b>' +
              '<button type="button" data-mas="' + esc(k) + '" aria-label="Agregar uno">' + ic('plus', 18) + '</button></span>' +
              '<button type="button" class="linkbtn" data-del="' + esc(k) + '">' + ic('trash', 18) + 'Quitar</button>' +
            '</div></div></div>';
      }).join('') +
      '<button type="button" class="btn btn--ghost btn--block" data-vermenu style="margin-top:12px">' + ic('plus', 18) + 'Agregar más productos</button>' +
      '</div>';

    // --- bloque tus datos ---
    h += '<div class="bloque"><div class="bloque__h">' + ic('check', 18) + 'Tus datos</div>' +
      campo('nombre', 'Nombre', '<input type="text" id="f_nombre" value="' + esc(c.nombre) + '" placeholder="Nombre y apellido" autocomplete="name" enterkeyhint="next">', true) +
      campo('telefono', 'WhatsApp', '<input type="tel" id="f_telefono" value="' + esc(c.telefono) + '" placeholder="300 123 4567" inputmode="numeric" autocomplete="tel" enterkeyhint="next">', true,
        'Te confirmamos el pedido por aquí.') +
      '</div>';

    // --- bloque pago ---
    h += '<div class="bloque"><div class="bloque__h">' + ic('cash', 18) + 'Método de pago</div>' +
      '<div class="pagos" id="pagos">' + CFG.pagos.map(function (p) {
        return '<button type="button" class="op' + (c.pago === p ? ' op--on' : '') + '" data-pago="' + esc(p) + '">' +
          (p === 'Efectivo' ? ic('cash', 18) : ic('card', 18)) + ' ' + esc(p) + '</button>';
      }).join('') + '</div>';

    if (CFG.pedirPagaCon && c.pago === 'Efectivo') {
      h += '<div style="margin-top:16px">' + campo('pagaCon', '¿Con cuánto pagas?', '<input type="number" id="f_pagaCon" value="' + esc(c.pagaCon) + '" placeholder="Ej: 50000" inputmode="numeric" enterkeyhint="done">', false,
        'En pesos. Sirve para llevar el cambio.') +
        '<div class="rapidos">' +
        '<button type="button" data-monto="' + total() + '">Pago exacto</button>' +
        '<button type="button" data-monto="20000">20.000</button>' +
        '<button type="button" data-monto="50000">50.000</button>' +
        '<button type="button" data-monto="100000">100.000</button></div></div>';
    }
    if (CFG.extras.notaGeneral) {
      h += '<div style="margin-top:16px">' + campo('nota', 'Nota para el pedido', '<textarea id="f_nota" placeholder="Ej: dejar en portería, sin cebolla…">' + esc(c.nota) + '</textarea>', false) + '</div>';
    }
    h += '</div>';

    // --- bloque resumen ---
    h += '<div class="bloque"><div class="bloque__h">' + ic('receipt', 18) + 'Resumen</div>' +
      '<div class="totales">' +
      '<div><span>Subtotal</span><span>' + money(subtotal()) + '</span></div>' +
      (CFG.domicilio.activo ? '<div><span>Domicilio' + (c.entrega === 'punto' ? ' (recoges en el punto)' : '') + '</span><span>' + money(envio()) + '</span></div>' : '') +
      '<div class="tot"><span>Total</span><span>' + money(total()) + '</span></div></div>' +
      '<button type="button" class="linkbtn" id="vaciar" style="margin-top:14px">' + ic('trash', 18) + 'Vaciar pedido</button>' +
      '</div>';

    h += '<div class="nota-min">' + ic('wa', 18) + '<span>El pedido se envía por WhatsApp a la tienda. No se cobra nada en línea.</span></div>';
    return h;
  }

  function campo(id, label, input, req, hint) {
    return '<div class="campo" id="c_' + id + '">' +
      '<label for="f_' + id + '">' + esc(label) + (req ? ' <span>*</span>' : '') + '</label>' + input +
      (hint ? '<div class="hint">' + esc(hint) + '</div>' : '') +
      '<div class="err" id="e_' + id + '"></div></div>';
  }

  /* ------------------------------------------------ seguimiento del pedido */
  function vistaSeguimiento() {
    var e = st.enviado || {};
    var pasos = [
      { t: 'Pedido enviado', s: 'Te llevamos al WhatsApp de la tienda', on: true },
      { t: 'Confirmando con la tienda', s: 'Ellos responden por el chat', now: true },
      { t: 'En preparación', s: 'Tiempo estimado ' + (CFG.negocio.tiempoPreparacion || '25 a 35 min'), off: true },
      { t: c_entrega(e) , s: 'Te avisamos por WhatsApp', off: true }
    ];
    return '<div class="bloque">' +
      '<div class="bloque__h">' + ic('moto-status', 18) + 'Estado del pedido</div>' +
      '<div class="linea-tiempo">' + pasos.map(function (p) {
        var cls = p.on ? 'pt--on' : (p.now ? 'pt--now' : 'pt--off');
        return '<div class="pt ' + cls + '"><span class="pt__linea"></span>' +
          '<span class="pt__punto">' + (p.on ? ic('check', 14) : (p.now ? ic('clock', 14) : ic('scooter', 14))) + '</span>' +
          '<span class="pt__txt"><strong>' + esc(p.t) + '</strong><span>' + esc(p.s) + '</span></span></div>';
      }).join('') + '</div></div>' +

      '<div class="bloque"><div class="bloque__h">' + ic('receipt', 18) + 'Tu comanda</div>' +
      '<div class="pre">' + esc(e.mensaje || '') + '</div></div>' +

      '<div class="bloque"><p class="bloque__sub" style="margin:0">¿No se abrió WhatsApp? Abre la comanda otra vez o cópiala y envíala manualmente al ' +
      esc(CFG.negocio.telefonoVisible) + '.</p>' +
      '<button class="btn btn--ghost btn--sm btn--block" id="btnCopiar" style="margin-top:12px">' + ic('copy', 18) + 'Copiar comanda</button>' +
      '<button class="btn btn--ghost btn--sm btn--block" id="btnNuevo" style="margin-top:8px">Hacer otro pedido</button></div>';
  }
  function c_entrega(e) {
    return (e.cliente && e.cliente.entrega === 'punto') ? 'Listo para recoger' : 'En camino a tu dirección';
  }

  /* ----------------------------------------------------------------- mensaje */
  function fechaTexto() {
    return new Date().toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function codigo() {
    var s = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', o = '';
    for (var i = 0; i < 4; i++) o += s[Math.floor(Math.random() * s.length)];
    return o;
  }
  function construirMensaje() {
    var c = st.cliente, L = [];
    L.push('*NUEVO PEDIDO — ' + CFG.negocio.nombre.toUpperCase() + '*');
    L.push('Pedido #' + codigo() + ' · ' + fechaTexto());
    L.push('');
    L.push('*Cliente*');
    L.push('Nombre: ' + c.nombre);
    L.push('Teléfono: ' + c.telefono);
    L.push('Entrega: ' + (c.entrega === 'punto' ? 'Recoge en el punto' : 'Domicilio'));
    if (c.entrega === 'domicilio') {
      if (c.barrio) L.push('Barrio: ' + c.barrio);
      L.push('Dirección: ' + c.direccion);
      if (c.referencia) L.push('Referencia: ' + c.referencia);
    }
    L.push('Pago: ' + c.pago + (c.pagaCon && c.pago === 'Efectivo' ? ' — paga con ' + money(c.pagaCon) : ''));
    if (c.pagaCon && c.pago === 'Efectivo' && Number(c.pagaCon) > total()) {
      L.push('Llevar cambio de: ' + money(Number(c.pagaCon) - total()));
    }
    L.push('');
    L.push('*Pedido*');
    st.items.forEach(function (it) {
      L.push(it.cant + ' x ' + it.nombre + ' — ' + money(it.precio * it.cant));
      if (it.salsas.length) L.push('   • Salsas: ' + it.salsas.join(', '));
      if (it.opciones.length) L.push('   • ' + it.opciones.join(' · '));
      if (it.adiciones.length) L.push('   • Adiciones: ' + it.adiciones.map(function (a) { return a.nombre; }).join(', '));
      if (it.nota) L.push('   • Nota: ' + it.nota);
    });
    L.push('');
    L.push('Subtotal: ' + money(subtotal()));
    if (CFG.domicilio.activo) L.push('Domicilio: ' + money(envio()));
    L.push('*TOTAL: ' + money(total()) + '*');
    if (c.nota) { L.push(''); L.push('Nota: ' + c.nota); }
    return L.join('\n');
  }
  function linkWa() { return 'https://wa.me/' + CFG.negocio.whatsapp + '?text=' + encodeURIComponent(ultimoMensaje); }
  function abrirWa() { window.open(linkWa(), '_blank', 'noopener'); }

  /* -------------------------------------------------------------- formulario */
  function leerFormulario() {
    var c = st.cliente;
    var g = function (sel) { var e = $(sel); return e ? e.value.trim() : ''; };
    if ($('#f_nombre')) c.nombre = g('#f_nombre');
    if ($('#f_telefono')) c.telefono = g('#f_telefono');
    c.barrio = $('#f_barrio') ? $('#f_barrio').value : '';
    if ($('#f_direccion')) c.direccion = g('#f_direccion');
    if ($('#f_referencia')) c.referencia = g('#f_referencia');
    if ($('#f_pagaCon')) c.pagaCon = g('#f_pagaCon');
    if ($('#f_nota')) c.nota = g('#f_nota');
    guardar();
    return c;
  }

  function validar(c) {
    var errs = {};
    if (c.nombre.length < 3) errs.nombre = 'Escribe tu nombre.';
    var tel = c.telefono.replace(/[^0-9]/g, '');
    if (tel.length < 7) errs.telefono = 'Escribe un teléfono válido (mínimo 7 dígitos).';
    else if (tel.length === 10 && tel.charAt(0) !== '3') errs.telefono = 'Los celulares en Colombia empiezan por 3.';
    if (c.entrega === 'domicilio') {
      if (CFG.domicilio.usarBarrios && (MENU.barrios || []).length && !c.barrio) errs.barrio = 'Selecciona tu barrio.';
      if (c.direccion.length < 6) errs.direccion = 'Escribe la dirección completa.';
    }
    if (CFG.pedirPagaCon && c.pago === 'Efectivo' && c.pagaCon && Number(c.pagaCon) < total()) {
      errs.pagaCon = 'El valor es menor al total (' + money(total()) + ').';
    }
    if (CFG.domicilio.minimoCompra && subtotal() < CFG.domicilio.minimoCompra) {
      toast('El pedido mínimo es ' + money(CFG.domicilio.minimoCompra));
      return { errs: errs, bloqueado: true };
    }
    return { errs: errs, bloqueado: false };
  }

  function pintarErrores(errs) {
    ['nombre', 'telefono', 'barrio', 'direccion', 'pagaCon'].forEach(function (k) {
      var caja = $('#c_' + k); if (!caja) return;
      var msg = errs[k];
      caja.classList.toggle('campo--mal', !!msg);
      var e = $('#e_' + k); if (e) e.textContent = msg || '';
    });
  }

  function formatearTelefono(v) {
    var d = v.replace(/[^0-9]/g, '').slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return d.slice(0, 3) + ' ' + d.slice(3);
    if (d.length <= 8) return d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + d.slice(6);
    return d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + d.slice(6, 10);
  }

  function enviar() {
    var c = leerFormulario();
    var v = validar(c);
    pintarErrores(v.errs);
    if (Object.keys(v.errs).length) {
      var primero = $('#c_nombre.campo--mal, #c_telefono.campo--mal, #c_barrio.campo--mal, #c_direccion.campo--mal, #c_pagaCon.campo--mal');
      if (primero) {
        primero.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var inp = primero.querySelector('input,select,textarea');
        if (inp) inp.focus({ preventScroll: true });
      }
      toast('Revisa los datos marcados');
      return;
    }
    var b = $('#btnEnviar');
    if (b) {
      b.classList.add('is-loading');
      b.innerHTML = '<span class="spinner" aria-hidden="true"></span><span>Abriendo WhatsApp…</span>';
    }
    ultimoMensaje = construirMensaje();
    guardarUltimo();
    var snapshot = { mensaje: ultimoMensaje, cliente: Object.assign({}, st.cliente), items: st.items.slice(), total: total() };
    setTimeout(function () {
      st.enviado = snapshot;
      st.items = [];
      guardar();
      renderPedido(); renderBarra(); renderNav();
      abrirWa();
      toast('Comanda lista en WhatsApp', 'check');
    }, 620);
  }

  /* ----------------------------------------------------------------- eventos */
  function eventos() {
    // categorías y búsqueda
    $('#chips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]'); if (!b) return;
      st.cat = b.dataset.cat; st.q = '';
      var inp = $('#buscar'); if (inp) inp.value = '';
      $('#buscarX').hidden = true;
      renderChips(); renderGrid();
    });
    $('#buscar').addEventListener('input', function (e) {
      st.q = e.target.value; st.cat = 'TODO';
      $('#buscarX').hidden = !st.q;
      renderChips(); renderGrid();
    });
    $('#buscarX').addEventListener('click', function () {
      st.q = ''; $('#buscar').value = ''; $('#buscarX').hidden = true;
      renderChips(); renderGrid(); $('#buscar').focus();
    });
    $('#vacioBtn').addEventListener('click', function () {
      st.q = ''; st.cat = 'TODO'; $('#buscar').value = ''; $('#buscarX').hidden = true;
      renderChips(); renderGrid();
    });

    // tarjetas del menú (agregar / contador)
    ['#grid', '#carrusel'].forEach(function (sel) {
      $(sel).addEventListener('click', function (e) {
        var mas = e.target.closest('[data-card-mas]'), menos = e.target.closest('[data-card-menos]');
        if (mas) { e.stopPropagation(); cambiarDesdeTarjeta(Number(mas.dataset.cardMas), 1); return; }
        if (menos) { e.stopPropagation(); cambiarDesdeTarjeta(Number(menos.dataset.cardMenos), -1); return; }
        if (e.target.closest('[data-agregar]')) { e.stopPropagation(); abrirFicha(Number(e.target.closest('[data-agregar]').dataset.agregar)); return; }
        var c = e.target.closest('[data-id]');
        if (c) abrirFicha(Number(c.dataset.id));
      });
      $(sel).addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var c = e.target.closest('[data-id]'); if (!c) return;
        e.preventDefault(); abrirFicha(Number(c.dataset.id));
      });
    });

    // ficha
    $('#sheet').addEventListener('click', function (e) {
      var t = e.target;
      var salsa = t.closest('[data-salsa]'), op = t.closest('[data-opcion]'),
        ad = t.closest('[data-adic]'), paso = t.closest('[data-paso]');
      if (t.closest('[data-cerrar]')) { cerrarFicha(); return; }
      if (salsa) {
        var s = salsa.dataset.salsa, i = draft.salsas.indexOf(s);
        if (i === -1) draft.salsas.push(s); else draft.salsas.splice(i, 1);
        renderFicha();
      } else if (op) {
        var o = op.dataset.opcion, j = draft.opciones.indexOf(o);
        if (j === -1) draft.opciones.push(o); else draft.opciones.splice(j, 1);
        renderFicha();
      } else if (ad) {
        var a = MENU.adiciones.filter(function (x) { return x.id === Number(ad.dataset.adic); })[0];
        var k = draft.adiciones.findIndex(function (x) { return x.nombre === a.nombre; });
        if (k === -1) draft.adiciones.push({ nombre: a.nombre, precio: a.precio }); else draft.adiciones.splice(k, 1);
        renderFicha();
      } else if (paso) {
        var ta = $('#notaProd'); if (ta) draft.nota = ta.value;
        draft.cant = Math.max(1, Math.min(CFG.extras.maxCantidad, draft.cant + Number(paso.dataset.paso)));
        renderFicha();
      } else if (t.closest('#btnAgregar')) {
        agregar();
      }
    });

    // abrir el pedido
    ['#btnCart', '#barraBtn'].forEach(function (sel) {
      $(sel).addEventListener('click', abrirPedido);
    });
    $('#overlay').addEventListener('click', cerrarTodo);
    $('#drawerClose').addEventListener('click', cerrarTodo);
    $('#drawerMenu').addEventListener('click', abrirPedido);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarTodo(); });

    // navegación inferior
    $('#nav').addEventListener('click', function (e) {
      var b = e.target.closest('[data-vista]'); if (!b) return;
      var v = b.dataset.vista;
      if (v === 'pedido') { abrirPedido(); return; }
      if (v === 'buscar') {
        cerrarTodo();
        var inp = $('#buscar');
        if (inp) { inp.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(function () { inp.focus({ preventScroll: true }); }, 320); }
        return;
      }
      cerrarTodo();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // botón "entregar en" del topbar → abre el pedido donde está la dirección
    $('#btnDireccion').addEventListener('click', function () {
      if (st.items.length) abrirPedido();
      else toast('Agrega algo y aquí verás tu entrega');
    });

    // cuerpo del pedido
    $('#drawerBody').addEventListener('click', function (e) {
      var t = e.target;
      var mas = t.closest('[data-mas]'), menos = t.closest('[data-menos]'), del = t.closest('[data-del]');
      if (mas) return cambiar(mas.dataset.mas, 1);
      if (menos) return cambiar(menos.dataset.menos, -1);
      if (del) return eliminar(del.dataset.del);
      if (t.closest('[data-vermenu]')) { cerrarTodo(); return; }
      if (t.closest('[data-repetir]')) {
        var u = ultimoPedido();
        if (!u) return;
        st.items = u.items;
        st.cliente = Object.assign(st.cliente, u.cliente || {});
        st.enviado = null;
        guardar(); abrirPedido();
        toast('Pedido anterior cargado', 'check');
        return;
      }
      var ent = t.closest('[data-ent]');
      if (ent) {
        leerFormulario();
        st.cliente.entrega = ent.dataset.ent;
        renderPedido();
        return;
      }
      var pago = t.closest('[data-pago]');
      if (pago) {
        leerFormulario();
        st.cliente.pago = pago.dataset.pago;
        renderPedido();
        return;
      }
      var monto = t.closest('[data-monto]');
      if (monto) {
        var inp = $('#f_pagaCon');
        if (inp) { inp.value = monto.dataset.monto; inp.dispatchEvent(new Event('input', { bubbles: true })); }
        renderPedido();
        return;
      }
      if (t.closest('#vaciar')) {
        var btn = t.closest('#vaciar');
        if (btn.dataset.confirm !== '1') {
          btn.dataset.confirm = '1';
          btn.innerHTML = ic('trash', 18) + '¿Seguro? Toca de nuevo para vaciar';
          setTimeout(function () {
            if (btn.isConnected) { btn.dataset.confirm = ''; btn.innerHTML = ic('trash', 18) + 'Vaciar pedido'; }
          }, 4000);
          return;
        }
        st.items = []; guardar(); renderPedido(); renderBarra();
        return toast('Pedido vaciado');
      }
      if (t.closest('#btnCopiar')) {
        if (navigator.clipboard) navigator.clipboard.writeText((st.enviado && st.enviado.mensaje) || '').then(function () { toast('Comanda copiada', 'check'); });
        return;
      }
      if (t.closest('#btnNuevo')) {
        st.enviado = null; ultimoMensaje = '';
        guardar(); cerrarTodo();
        toast('Listo para un nuevo pedido');
      }
    });

    // cambios en el formulario
    $('#drawerBody').addEventListener('input', function (e) {
      if (e.target.id === 'f_telefono') {
        var pos = e.target.selectionStart, antes = e.target.value.length;
        e.target.value = formatearTelefono(e.target.value);
        var dif = e.target.value.length - antes;
        try { e.target.setSelectionRange(pos + dif, pos + dif); } catch (err) {}
      }
      leerFormulario();
    });
    $('#drawerBody').addEventListener('change', function (e) {
      var t = e.target;
      leerFormulario();
      if (t.id === 'f_barrio' || t.id === 'f_pagaCon') renderPedido();
    });

    // pie del pedido
    $('#drawerFoot').addEventListener('click', function (e) {
      if (e.target.closest('#btnEnviar')) enviar();
      if (e.target.closest('#btnReabrir')) abrirWa();
    });
  }

  init();
})();
