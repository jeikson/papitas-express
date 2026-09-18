/* ==========================================================================
   PAPITAS EXPRESS — lógica de la tienda
   Carrito + datos del cliente + comanda a WhatsApp. Sin backend.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.CONFIG, MENU = window.MENU;
  var LS = 'papitas_pedido_v1';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return '$ ' + Math.round(n).toLocaleString('es-CO'); };
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* ------------------------------------------------------------------ estado */
  var st = cargar();
  var draft = null;          // producto que se está armando en la ficha
  var ultimoMensaje = '';    // último mensaje generado (para copiar/reabrir)

  function cargar() {
    var base = {
      items: [], cat: MENU.categorias[0], q: '', paso: 'carrito',
      cliente: {
        nombre: '', telefono: '', entrega: 'domicilio',
        barrio: '', direccion: '', referencia: '',
        pago: CFG.pagos[0], pagaCon: '', nota: ''
      }
    };
    try {
      var raw = localStorage.getItem(LS);
      if (!raw) return base;
      var saved = JSON.parse(raw);
      base.items = Array.isArray(saved.items) ? saved.items : [];
      base.cliente = Object.assign(base.cliente, saved.cliente || {});
      if (CFG.pagos.indexOf(base.cliente.pago) === -1) base.cliente.pago = CFG.pagos[0];
      return base;
    } catch (e) { return base; }
  }
  function guardar() {
    try {
      localStorage.setItem(LS, JSON.stringify({ items: st.items, cliente: st.cliente }));
    } catch (e) { /* modo privado: se ignora */ }
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
  function subtotal() {
    return st.items.reduce(function (a, it) { return a + it.precio * it.cant; }, 0);
  }
  function total() { return subtotal() + envio(); }
  function unidades() {
    return st.items.reduce(function (a, it) { return a + it.cant; }, 0);
  }
  function horario() {
    var h = CFG.horario, d = new Date();
    var min = d.getHours() * 60 + d.getMinutes();
    var a = h.inicio.split(':'), b = h.fin.split(':');
    var ini = (+a[0]) * 60 + (+a[1]), fin = (+b[0]) * 60 + (+b[1]);
    var abierto = fin > ini ? (min >= ini && min <= fin) : (min >= ini || min <= fin);
    return { abierto: abierto, ini: h.inicio, fin: h.fin };
  }
  function toast(txt) {
    var t = $('#toast');
    t.textContent = txt; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function imgTag(p, clase) {
    if (!p.img) return '<span aria-hidden="true">' + (p.cat === 'BEBIDAS' ? '🥤' : '🍟') + '</span>';
    return '<img src="' + esc(p.img) + '" alt="' + esc(p.nombre) + '" loading="lazy" class="' + (clase || '') + '" onerror="this.remove()">';
  }

  /* ---------------------------------------------------------------- arranque */
  function init() {
    document.title = CFG.negocio.nombre + ' — Pedidos';
    $$('[data-negocio]').forEach(function (e) { e.textContent = CFG.negocio.nombre; });
    $$('[data-eslogan]').forEach(function (e) { e.textContent = CFG.negocio.eslogan; });
    $$('[data-ciudad]').forEach(function (e) { e.textContent = CFG.negocio.ciudad; });
    $$('[data-tel]').forEach(function (e) { e.textContent = CFG.negocio.telefonoVisible; });
    if (!CFG.extras.buscar) $('#buscadorWrap').hidden = true;

    renderEstado();
    renderChips();
    renderGrid();
    renderBarra();
    eventos();
  }

  function renderEstado() {
    var h = horario();
    $('#estado').textContent = h.abierto ? 'Abierto ahora · hasta ' + h.fin : 'Cerrado · abre ' + h.ini;
    $('#dot').className = 'dot ' + (h.abierto ? 'dot--ok' : 'dot--no');
    var av = $('#aviso');
    if (!h.abierto) {
      av.hidden = false; av.className = 'aviso';
      av.textContent = 'Ahora estamos cerrados (atendemos de ' + h.ini + ' a ' + h.fin + '). ' +
        (CFG.horario.bloquearFueraDeHorario ? 'Vuelve en nuestro horario para pedir.' : 'Puedes dejar tu pedido y lo confirmamos al abrir.');
    } else { av.hidden = true; }
    $('#barraBtn').disabled = false;
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
      if (q) {
        return (p.nombre + ' ' + (p.desc || '')).toLowerCase().indexOf(q) !== -1;
      }
      return st.cat === 'TODO' || p.cat === st.cat;
    });
  }

  function renderGrid() {
    var list = filtrar(), h = '';
    list.forEach(function (p) {
      h += '<article class="card" data-id="' + p.id + '" role="button" tabindex="0">' +
        '<div class="card__img">' + imgTag(p) + (p.destacado ? '<span class="card__tag">Más pedida</span>' : '') + '</div>' +
        '<div class="card__body">' +
          '<h3 class="card__name">' + esc(p.nombre) + '</h3>' +
          (p.desc ? '<p class="card__desc">' + esc(p.desc) + '</p>' : '') +
          '<div class="card__foot"><span class="card__price">' + money(p.precio) + '</span>' +
          '<span class="card__add" aria-hidden="true">+</span></div>' +
        '</div></article>';
    });
    $('#grid').innerHTML = h;
    $('#vacio').hidden = list.length > 0;
  }

  function renderBarra() {
    var n = unidades();
    $('#cartCount').textContent = n;
    // la barra inferior se oculta mientras hay ficha o carrito abiertos
    var modalAbierto = !$('#drawer').hidden || !$('#sheet').hidden;
    $('#barra').hidden = n === 0 || modalAbierto;
    $('#barraItems').textContent = n + (n === 1 ? ' producto' : ' productos');
    $('#barraTotal').textContent = money(total());
  }

  /* ------------------------------------------------------------- ficha (sheet) */
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
  }

  function renderFicha() {
    var p = producto(draft.id);
    var extra = draft.adiciones.reduce(function (a, x) { return a + x.precio; }, 0);
    var totalItem = (p.precio + extra) * draft.cant;
    var h = '';

    h += '<div class="sheet__hero">' + imgTag(p) + '</div><div class="sheet__pad">' +
      '<h3 class="sheet__title">' + esc(p.nombre) + '</h3>' +
      '<div class="sheet__price">' + money(p.precio) + '</div>';

    if (p.ingredientes && p.ingredientes.length) {
      h += '<ul class="ing">' + p.ingredientes.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
    } else if (p.desc) {
      h += '<p style="color:var(--gris);font-size:.88rem;margin:10px 0 0">' + esc(p.desc) + '</p>';
    }

    if (CFG.extras.salsas && MENU.salsas.length) {
      h += '<div class="sec"><div class="sec__h"><h4>Elige tus salsas</h4><small>puedes marcar varias</small></div><div class="ops">' +
        MENU.salsas.map(function (s) {
          var on = draft.salsas.indexOf(s) !== -1;
          return '<button type="button" class="op' + (on ? ' op--on' : '') + '" data-salsa="' + esc(s) + '">' + esc(s) + '</button>';
        }).join('') + '</div></div>';
    }

    if (CFG.extras.opciones && MENU.opciones.length) {
      h += '<div class="sec"><div class="sec__h"><h4>Preferencias</h4></div><div class="ops">' +
        MENU.opciones.map(function (o) {
          var on = draft.opciones.indexOf(o) !== -1;
          return '<button type="button" class="op' + (on ? ' op--on' : '') + '" data-opcion="' + esc(o) + '">' + esc(o) + '</button>';
        }).join('') + '</div></div>';
    }

    if (CFG.extras.adiciones && MENU.adiciones.length) {
      h += '<div class="sec"><div class="sec__h"><h4>Adiciones</h4><small>opcional</small></div><div class="adiciones">' +
        MENU.adiciones.map(function (a) {
          var on = !!draft.adiciones.filter(function (x) { return x.nombre === a.nombre; }).length;
          return '<button type="button" class="op op--add' + (on ? ' op--on' : '') + '" data-adic="' + a.id + '">' +
            '<span>' + esc(a.nombre) + '</span><span class="op__p">+ ' + money(a.precio) + '</span></button>';
        }).join('') + '</div></div>';
    }

    if (CFG.extras.notaProducto) {
      h += '<div class="sec"><div class="sec__h"><h4>Nota para la cocina</h4><small>opcional</small></div>' +
        '<textarea id="notaProd" placeholder="Ej: sin maíz, papas bien crocantes…">' + esc(draft.nota) + '</textarea></div>';
    }

    h += '<div class="sec"><div class="sec__h"><h4>Cantidad</h4></div>' +
      '<div class="cant"><button type="button" data-paso="-1">−</button><b>' + draft.cant + '</b>' +
      '<button type="button" data-paso="1">+</button></div></div></div>';

    $('#sheetBody').innerHTML = h;

    var pie = $('#sheetFoot');
    pie.hidden = false;
    pie.innerHTML = '<button class="btn btn--primary btn--block" id="btnAgregar">' +
      'Agregar · ' + money(totalItem) + '</button>';

    var ta = $('#notaProd');
    if (ta) ta.addEventListener('input', function () { draft.nota = ta.value; });
  }

  function cerrarTodo() {
    cerrarFicha();
    $('#drawer').hidden = true; $('#overlay').hidden = true;
    document.body.style.overflow = '';
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
    if (found) { found.cant = Math.min(CFG.extras.maxCantidad, found.cant + it.cant); }
    else { st.items.push(it); }
    guardar(); renderBarra(); cerrarFicha();
    toast(p.nombre + ' agregado ✓');
  }

  function cambiar(key, delta) {
    var i = st.items.findIndex(function (x) { return clave(x) === key; });
    if (i === -1) return;
    st.items[i].cant += delta;
    if (st.items[i].cant <= 0) st.items.splice(i, 1);
    guardar(); renderBarra();
    if (st.paso === 'carrito') renderDrawer(); else renderResumen();
  }

  function eliminar(key) {
    st.items = st.items.filter(function (x) { return clave(x) !== key; });
    guardar(); renderBarra(); renderDrawer();
    toast('Producto eliminado');
  }

  /* -------------------------------------------------------------------- drawer */
  function abrirDrawer(paso) {
    if (!st.items.length && paso !== 'ok') { toast('Tu pedido está vacío'); return; }
    st.paso = paso || 'carrito';
    renderDrawer();
    $('#drawer').hidden = false; $('#overlay').hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function renderDrawer() {
    var esCarrito = st.paso === 'carrito';
    var esOk = st.paso === 'ok';
    $('#drawerBack').hidden = esCarrito || esOk;
    $('#drawerTitle').textContent = esOk ? 'Pedido listo' : (esCarrito ? 'Mi pedido' : 'Tus datos');
    $('#drawerFoot').hidden = esOk;

    if (esCarrito) { $('#drawerBody').innerHTML = vistaCarrito(); pintarFootCarrito(); }
    else if (esOk) { $('#drawerBody').innerHTML = vistaOk(); $('#drawerFoot').innerHTML = ''; }
    else { $('#drawerBody').innerHTML = vistaDatos(); pintarFootDatos(); }
  }

  function vistaCarrito() {
    var h = st.items.map(function (it) {
      var k = clave(it), mods = '';
      if (it.salsas.length) mods += '<span>Salsas: ' + esc(it.salsas.join(', ')) + '</span>';
      if (it.opciones.length) mods += '<span>' + esc(it.opciones.join(' · ')) + '</span>';
      if (it.adiciones.length) mods += '<span>Adiciones: ' + esc(it.adiciones.map(function (a) { return a.nombre; }).join(', ')) + '</span>';
      if (it.nota) mods += '<span>Nota: ' + esc(it.nota) + '</span>';
      return '<div class="item">' +
        '<div class="item__img">' + imgTag(it) + '</div>' +
        '<div class="item__in">' +
          '<div class="item__row"><span class="item__name">' + esc(it.nombre) + '</span>' +
          '<span class="item__price">' + money(it.precio * it.cant) + '</span></div>' +
          (mods ? '<div class="item__mods">' + mods + '</div>' : '') +
          '<div class="item__tools">' +
            '<span class="stepper"><button type="button" data-menos="' + esc(k) + '">−</button><b>' + it.cant + '</b>' +
            '<button type="button" data-mas="' + esc(k) + '">+</button></span>' +
            '<button type="button" class="linkbtn" data-del="' + esc(k) + '">Quitar</button>' +
          '</div>' +
        '</div></div>';
    }).join('');

    h += '<div class="totales">' +
      '<div><span>Subtotal</span><span>' + money(subtotal()) + '</span></div>' +
      (CFG.domicilio.activo ? '<div><span>Domicilio' + (st.cliente.entrega === 'punto' ? ' (recoge en tienda)' : '') + '</span><span>' + money(envio()) + '</span></div>' : '') +
      '<div class="tot"><span>Total</span><span>' + money(total()) + '</span></div></div>' +
      '<button type="button" class="linkbtn" id="vaciar" style="margin-top:14px">Vaciar pedido</button>';
    return h;
  }

  function pintarFootCarrito() {
    $('#drawerFoot').innerHTML = '<button class="btn btn--primary btn--block" id="btnDatos">Completar datos →</button>';
  }

  function vistaDatos() {
    var c = st.cliente;
    var h = '<div class="aviso-min">Tus datos solo se usan para esta comanda y se envían por WhatsApp a la tienda.</div>';

    h += campo('nombre', 'Tu nombre', '<input type="text" id="f_nombre" value="' + esc(c.nombre) + '" placeholder="Nombre y apellido" autocomplete="name">', true);
    h += campo('telefono', 'Tu WhatsApp / teléfono', '<input type="tel" id="f_telefono" value="' + esc(c.telefono) + '" placeholder="300 000 0000" inputmode="numeric" autocomplete="tel">', true,
      'Lo usamos para confirmarte el pedido.');

    h += '<div class="campo"><label>¿Cómo lo quieres?</label><div class="segment" id="segEntrega">' +
      '<button type="button" data-ent="domicilio" class="' + (c.entrega === 'domicilio' ? 'on' : '') + '">🛵 Domicilio</button>' +
      '<button type="button" data-ent="punto" class="' + (c.entrega === 'punto' ? 'on' : '') + '">🏬 Recoger</button>' +
      '</div></div>';

    if (c.entrega === 'domicilio') {
      if (CFG.domicilio.usarBarrios && (MENU.barrios || []).length) {
        h += campo('barrio', 'Barrio', '<select id="f_barrio"><option value="">Selecciona…</option>' +
          MENU.barrios.map(function (b) {
            return '<option value="' + esc(b.nombre) + '"' + (c.barrio === b.nombre ? ' selected' : '') + '>' +
              esc(b.nombre) + ' · envío ' + money(b.valor) + '</option>';
          }).join('') + '</select>', true);
      }
      h += campo('direccion', 'Dirección', '<input type="text" id="f_direccion" value="' + esc(c.direccion) + '" placeholder="Calle 12 #34-56, torre/apto" autocomplete="street-address">', true);
      h += campo('referencia', 'Punto de referencia', '<input type="text" id="f_referencia" value="' + esc(c.referencia) + '" placeholder="Ej: portería, frente a la tienda de la esquina">', false);
    }

    h += campo('pago', '¿Cómo pagas?', '<select id="f_pago">' + CFG.pagos.map(function (p) {
      return '<option' + (c.pago === p ? ' selected' : '') + '>' + esc(p) + '</option>';
    }).join('') + '</select>', true);

    if (CFG.pedirPagaCon && c.pago === 'Efectivo') {
      h += campo('pagaCon', '¿Con cuánto pagas?', '<input type="number" id="f_pagaCon" value="' + esc(c.pagaCon) + '" placeholder="Ej: 50000" inputmode="numeric">', false,
        'En pesos. Sirve para llevar el cambio.');
    }

    if (CFG.extras.notaGeneral) {
      h += campo('nota', 'Nota para el pedido', '<textarea id="f_nota" placeholder="Ej: dejar en portería, sin cebolla…">' + esc(c.nota) + '</textarea>', false);
    }

    h += '<div id="resumen"></div>';
    return h;
  }

  function campo(id, label, input, req, hint) {
    return '<div class="campo" id="c_' + id + '">' +
      '<label for="f_' + id + '">' + esc(label) + (req ? ' <span>*</span>' : '') + '</label>' + input +
      (hint ? '<div class="hint">' + esc(hint) + '</div>' : '') +
      '<div class="err" id="e_' + id + '"></div></div>';
  }

  function renderResumen() {
    var r = $('#resumen'); if (!r) return;
    r.innerHTML = '<div class="totales" style="margin-top:16px">' +
      '<div><span>' + unidades() + ' producto(s)</span><span>' + money(subtotal()) + '</span></div>' +
      (CFG.domicilio.activo ? '<div><span>Domicilio</span><span>' + money(envio()) + '</span></div>' : '') +
      '<div class="tot"><span>Total</span><span>' + money(total()) + '</span></div></div>';
  }

  function pintarFootDatos() {
    var bloqueado = CFG.horario.bloquearFueraDeHorario && !horario().abierto;
    $('#drawerFoot').innerHTML =
      '<button class="btn btn--wa btn--block" id="btnEnviar"' + (bloqueado ? ' disabled' : '') + '>' +
      'Enviar por WhatsApp<b class="btn__tot">' + money(total()) + '</b></button>';
    renderResumen();
  }

  function vistaOk() {
    return '<div class="ok">' +
      '<div class="ok__ico">✓</div>' +
      '<h3>¡Pedido enviado!</h3>' +
      '<p>Se abrió WhatsApp con tu comanda. <b>Dale enviar</b> y la tienda te confirma por ahí mismo.</p>' +
      '<div class="pre" id="preMsg">' + esc(ultimoMensaje) + '</div>' +
      '<button class="btn btn--wa btn--block" id="btnReabrir">Abrir WhatsApp otra vez</button>' +
      '<button class="btn btn--ghost btn--block" id="btnCopiar" style="margin-top:8px">Copiar comanda</button>' +
      '<button class="btn btn--ghost btn--block" id="btnNuevo" style="margin-top:8px">Hacer otro pedido</button>' +
      '</div>';
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

  function linkWa() {
    return 'https://wa.me/' + CFG.negocio.whatsapp + '?text=' + encodeURIComponent(ultimoMensaje);
  }
  function abrirWa() { window.open(linkWa(), '_blank', 'noopener'); }

  /* -------------------------------------------------------------- formulario */
  function leerFormulario() {
    var c = st.cliente;
    var g = function (id) { var e = $(id); return e ? e.value.trim() : ''; };
    c.barrio = $('#f_barrio') ? $('#f_barrio').value : '';
    c.direccion = $('#f_direccion') ? g('#f_direccion') : c.direccion;
    c.referencia = $('#f_referencia') ? g('#f_referencia') : c.referencia;
    c.pagaCon = $('#f_pagaCon') ? g('#f_pagaCon') : '';
    c.nota = $('#f_nota') ? g('#f_nota') : c.nota;
    // los que existen siempre en el primer render se leen directo
    var n = $('#f_nombre'), t = $('#f_telefono'), p = $('#f_pago');
    if (n) c.nombre = n.value.trim();
    if (t) c.telefono = t.value.trim();
    if (p) c.pago = p.value;
    guardar();
    return c;
  }

  function validar(c) {
    var errs = {};
    if (c.nombre.length < 3) errs.nombre = 'Escribe tu nombre.';
    var tel = c.telefono.replace(/[^0-9]/g, '');
    if (tel.length < 7) errs.telefono = 'Escribe un teléfono válido (mínimo 7 dígitos).';
    if (c.entrega === 'domicilio') {
      if (CFG.domicilio.usarBarrios && (MENU.barrios || []).length && !c.barrio) errs.barrio = 'Selecciona tu barrio.';
      if (c.direccion.length < 6) errs.direccion = 'Escribe la dirección completa.';
    }
    if (CFG.domicilio.minimoCompra && subtotal() < CFG.domicilio.minimoCompra) {
      errs.nombre = errs.nombre || null;
      toast('El pedido mínimo es ' + money(CFG.domicilio.minimoCompra));
      return { errs: errs, bloqueado: true };
    }
    if (CFG.pedirPagaCon && c.pago === 'Efectivo' && c.pagaCon && Number(c.pagaCon) < total()) {
      errs.pagaCon = 'El valor es menor al total (' + money(total()) + ').';
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

  function enviar() {
    var c = leerFormulario();
    var v = validar(c);
    pintarErrores(v.errs);
    if (Object.keys(v.errs).length) {
      var primero = $('#c_nombre.campo--mal, #c_telefono.campo--mal, #c_barrio.campo--mal, #c_direccion.campo--mal, #c_pagaCon.campo--mal');
      if (primero) primero.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast('Revisa los datos marcados');
      return;
    }
    ultimoMensaje = construirMensaje();
    st.paso = 'ok';
    renderDrawer();
    abrirWa();
    guardar();
  }

  /* --------------------------------------------------------------- eventos */
  function eventos() {
    // categorías y búsqueda
    $('#chips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]'); if (!b) return;
      st.cat = b.dataset.cat; st.q = ''; $('#buscar').value = '';
      renderChips(); renderGrid();
    });
    $('#buscar').addEventListener('input', function (e) {
      st.q = e.target.value; st.cat = 'TODO'; renderChips(); renderGrid();
    });

    // abrir ficha
    $('#grid').addEventListener('click', function (e) {
      var c = e.target.closest('[data-id]'); if (!c) return;
      abrirFicha(Number(c.dataset.id));
    });
    $('#grid').addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var c = e.target.closest('[data-id]'); if (!c) return;
      e.preventDefault(); abrirFicha(Number(c.dataset.id));
    });

    // ficha
    $('#sheet').addEventListener('click', function (e) {
      var t = e.target;
      var salsa = t.closest('[data-salsa]'), op = t.closest('[data-opcion]'),
        ad = t.closest('[data-adic]'), paso = t.closest('[data-paso]');
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

    // abrir carrito
    ['#btnCart', '#barraBtn'].forEach(function (sel) {
      $(sel).addEventListener('click', function () { abrirDrawer('carrito'); });
    });
    $('#overlay').addEventListener('click', cerrarTodo);
    $('#drawerClose').addEventListener('click', cerrarTodo);
    $('#drawerBack').addEventListener('click', function () { st.paso = 'carrito'; renderDrawer(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarTodo(); });

    // cuerpo del drawer (delegación)
    $('#drawerBody').addEventListener('click', function (e) {
      var t = e.target;
      var mas = t.closest('[data-mas]'), menos = t.closest('[data-menos]'), del = t.closest('[data-del]');
      if (mas) return cambiar(mas.dataset.mas, 1);
      if (menos) return cambiar(menos.dataset.menos, -1);
      if (del) return eliminar(del.dataset.del);
      if (t.closest('#vaciar')) { st.items = []; guardar(); renderBarra(); renderDrawer(); return toast('Pedido vaciado'); }
      if (t.closest('#btnReabrir')) return abrirWa();
      if (t.closest('#btnCopiar')) {
        var txt = ultimoMensaje;
        if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { toast('Comanda copiada ✓'); });
        return;
      }
      if (t.closest('#btnNuevo')) {
        st.items = []; ultimoMensaje = ''; st.paso = 'carrito';
        guardar(); renderBarra(); cerrarTodo(); toast('Listo para un nuevo pedido');
      }
    });

    // cambios en el formulario
    $('#drawerBody').addEventListener('change', function (e) {
      var t = e.target;
      if (t.id === 'f_pago' || t.id === 'f_barrio' || t.id === 'f_pagaCon') {
        leerFormulario();
        if (t.id === 'f_pago') { renderDrawer(); return; }
        if (t.id === 'f_barrio') {
          st.cliente.pago = $('#f_pago') ? $('#f_pago').value : st.cliente.pago;
          pintarFootDatos(); return;
        }
        renderResumen();
      }
    });
    $('#drawerBody').addEventListener('click', function (e) {
      var b = e.target.closest('[data-ent]'); if (!b) return;
      leerFormulario();
      st.cliente.entrega = b.dataset.ent;
      st.cliente.pago = $('#f_pago') ? $('#f_pago').value : st.cliente.pago;
      renderDrawer();
    });

    // pie del drawer
    $('#drawerFoot').addEventListener('click', function (e) {
      if (e.target.closest('#btnDatos')) {
        leerFormulario();
        st.paso = 'datos'; renderDrawer(); return;
      }
      if (e.target.closest('#btnVolver')) { st.paso = 'carrito'; renderDrawer(); return; }
      if (e.target.closest('#btnEnviar')) enviar();
    });
  }

  init();
})();
