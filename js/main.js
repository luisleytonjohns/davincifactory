/* =========================================================
   DAVINCI FACTORY · Lógica del sitio público
   ========================================================= */
(function () {
  'use strict';
  var CFG = window.DAVINCI || {};
  var API = (CFG.API_URL || '').trim();
  var T0 = Date.now();
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Desarrollos de respaldo (se muestran si el backend no responde) ---------- */
  var RESPALDO = [
    { nombre: 'Metis', descripcion: 'Plataforma educativa con IA aplicada a la administración y la economía.', url: '', foto_url: 'img/desarrollos/metis.jpg', logo_url: 'img/desarrollos/metis-logo.png', categoria: 'Educación' },
    { nombre: 'Vox Liber', descripcion: 'Portal de contenidos y análisis.', url: 'https://www.voxliber.cl', foto_url: 'img/desarrollos/voxliber.jpg', logo_url: 'img/desarrollos/voxliber-logo.png', categoria: 'Medios' },
    { nombre: 'IDEAX', descripcion: 'Gestión académica y programas ejecutivos online.', url: 'https://www.ideax.cl', foto_url: 'img/desarrollos/ideax.jpg', logo_url: 'img/desarrollos/ideax-logo.png', categoria: 'Educación ejecutiva' },
    { nombre: 'PrestoPronto', descripcion: 'App de pedidos y gastronomía local.', url: '', foto_url: 'img/desarrollos/prestopronto.jpg', logo_url: '', categoria: 'Gastronomía' }
  ];

  /* ---------- Utilidades ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function urlSegura(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^(https?:)?\/\//i.test(u) || /^img\//.test(u) || /^data:image\//.test(u)) return u;
    if (/^[\w.-]+\.[a-z]{2,}/i.test(u)) return 'https://' + u;
    return '';
  }
  function enviar(payload) {
    if (!API) return Promise.reject(new Error('SIN_API'));
    return fetch(API, { method: 'POST', body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || 'Error del servidor'); return j; });
  }
  function msgError(e) {
    if (e && e.message === 'SIN_API') return 'El formulario todavía no está conectado al servidor. Escríbenos directamente mientras lo habilitamos.';
    if (e && e.message && e.message.length < 200 && !/Failed to fetch|NetworkError/i.test(e.message)) return e.message;
    return 'No pudimos enviar la información. Revisa tu conexión e inténtalo nuevamente.';
  }

  /* ---------- Año y contacto del pie ---------- */
  $('#anio').textContent = new Date().getFullYear();
  var pie = [];
  if (CFG.CORREO_PUBLICO) pie.push('<a href="mailto:' + esc(CFG.CORREO_PUBLICO) + '">' + esc(CFG.CORREO_PUBLICO) + '</a>');
  if (CFG.WHATSAPP) pie.push('<a href="https://wa.me/' + esc(CFG.WHATSAPP.replace(/\D/g, '')) + '" target="_blank" rel="noopener">WhatsApp</a>');
  $('#pieContacto').innerHTML = pie.join(' · ');

  /* ---------- Menú móvil ---------- */
  var menuBtn = $('#menuBtn'), nav = $('#nav');
  menuBtn.addEventListener('click', function () {
    var abierto = nav.classList.toggle('abierto');
    menuBtn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  });
  $$('#nav a').forEach(function (a) {
    a.addEventListener('click', function () { nav.classList.remove('abierto'); menuBtn.setAttribute('aria-expanded', 'false'); });
  });

  /* ---------- Enlace activo según la sección visible ---------- */
  var secciones = ['inicio', 'quienes-somos', 'que-ofrecemos', 'soluciones', 'requerimiento', 'contacto']
    .map(function (id) { return document.getElementById(id); }).filter(Boolean);
  function marcarActivo() {
    var y = window.scrollY + 120, actual = 'inicio';
    secciones.forEach(function (s) { if (s.getBoundingClientRect().top + window.scrollY <= y) actual = s.id; });
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) actual = 'contacto';
    $$('#nav a').forEach(function (a) { a.classList.toggle('activo', a.getAttribute('href') === '#' + actual); });
  }
  window.addEventListener('scroll', marcarActivo, { passive: true });
  marcarActivo();

  /* ---------- Desarrollos ---------- */
  function pintarDesarrollos(lista) {
    var cont = $('#tarjetas');
    if (!lista || !lista.length) { cont.innerHTML = '<p class="tarjetas__vacio">Pronto publicaremos nuestros desarrollos.</p>'; return; }
    cont.innerHTML = lista.map(function (d) {
      var url = urlSegura(d.url), foto = urlSegura(d.foto_url), logo = urlSegura(d.logo_url);
      var tag = url ? 'a' : 'div';
      var attrs = url ? ' href="' + esc(url) + '" target="_blank" rel="noopener"' : '';
      var fotoHtml = foto
        ? '<div class="tarjeta__foto" style="background-image:url(\'' + esc(foto).replace(/'/g, '%27') + '\')"></div>'
        : '<div class="tarjeta__foto tarjeta__foto--vacia"><img src="img/logo.svg" alt=""></div>';
      var cab = logo
        ? '<img class="tarjeta__logo" src="' + esc(logo) + '" alt="' + esc(d.nombre) + '">'
        : '<span class="tarjeta__nombre">' + esc(d.nombre) + '</span>';
      return '<' + tag + ' class="tarjeta"' + attrs + ' aria-label="' + esc(d.nombre) + '">' + fotoHtml +
        '<div class="tarjeta__cuerpo">' + cab +
        '<span class="tarjeta__desc">' + esc(d.descripcion) + '</span>' +
        (d.categoria ? '<span class="tarjeta__cat">' + esc(d.categoria) + '</span>' : '') +
        '</div>' + (url ? '<span class="tarjeta__ir">VISITAR ↗</span>' : '') + '</' + tag + '>';
    }).join('');
  }
  var cache = null;
  try { cache = JSON.parse(localStorage.getItem('df_desarrollos') || 'null'); } catch (e) { /* sin almacenamiento */ }
  pintarDesarrollos(cache && cache.length ? cache : RESPALDO);
  if (API) {
    fetch(API + (API.indexOf('?') > -1 ? '&' : '?') + 'action=desarrollos')
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.ok && Array.isArray(j.desarrollos)) {
          pintarDesarrollos(j.desarrollos);
          try { localStorage.setItem('df_desarrollos', JSON.stringify(j.desarrollos)); } catch (e) { /* nada */ }
        }
      })
      .catch(function () { /* se mantiene el respaldo */ });
  }

  /* ---------- Modales ---------- */
  function abrir(m) { m.hidden = false; document.body.style.overflow = 'hidden'; var f = $('input,select,textarea,button.btn-oro', m); if (f) setTimeout(function () { f.focus(); }, 60); }
  function cerrar(m) { m.hidden = true; document.body.style.overflow = ''; }
  $$('.modal').forEach(function (m) {
    $$('[data-cerrar]', m).forEach(function (b) { b.addEventListener('click', function () { cerrar(m); }); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') $$('.modal').forEach(function (m) { if (!m.hidden) cerrar(m); });
  });
  $('#abrirContacto').addEventListener('click', function () { abrir($('#modalContacto')); });
  function confirmar(titulo, texto, folio) {
    $('#okTitulo').textContent = titulo;
    $('#okTexto').textContent = texto;
    $('#okFolio').textContent = folio ? 'Folio ' + folio : '';
    abrir($('#modalOk'));
  }

  /* ---------- Validación ---------- */
  function validar(contenedor) {
    var primero = null;
    $$('.invalido', contenedor).forEach(function (el) { el.classList.remove('invalido'); });
    $$('input[required],select[required],textarea[required]', contenedor).forEach(function (el) {
      var v = el.type === 'checkbox' ? el.checked : String(el.value || '').trim();
      var ok = !!v;
      if (ok && el.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
      if (!ok) {
        var marca = el.closest('.campo.area') || el;
        marca.classList.add('invalido');
        if (el.type === 'checkbox') el.closest('.consent').style.color = '#a23a2b';
        if (!primero) primero = el;
      } else if (el.type === 'checkbox' && el.closest('.consent')) {
        el.closest('.consent').style.color = '';
      }
    });
    $$('.chips[data-req]', contenedor).forEach(function (c) {
      if (!$('input:checked', c)) { c.classList.add('invalido'); if (!primero) primero = $('input', c); }
    });
    if (primero) {
      var obj = primero.closest('.chips') || primero.closest('.campo') || primero;
      obj.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (primero.focus) setTimeout(function () { primero.focus({ preventScroll: true }); }, 300);
    }
    return !primero;
  }
  document.addEventListener('input', function (e) {
    var c = e.target.closest('.invalido') || (e.target.classList && e.target.classList.contains('invalido') ? e.target : null);
    if (c) c.classList.remove('invalido');
  });
  document.addEventListener('change', function (e) {
    var c = e.target.closest('.chips.invalido');
    if (c) c.classList.remove('invalido');
  });

  /* ---------- Formulario de requerimiento por pasos ---------- */
  var formReq = $('#formReq'), reqMsg = $('#reqMsg'), pasos = $('#pasos');
  function irA(n) {
    $$('.paso', formReq).forEach(function (p) { p.classList.toggle('activo', +p.dataset.paso === n); });
    $$('li', pasos).forEach(function (li) {
      var p = +li.dataset.p;
      li.classList.toggle('activo', p === n);
      li.classList.toggle('hecho', p < n);
    });
    pasos.hidden = n === 1 && !formReq.dataset.iniciado;
    reqMsg.textContent = '';
    var top = $('#requerimiento').getBoundingClientRect().top + window.scrollY - 70;
    if (n > 1 || formReq.dataset.iniciado) window.scrollTo({ top: top, behavior: 'smooth' });
    guardarBorrador();
  }
  $$('[data-sig]', formReq).forEach(function (b) {
    b.addEventListener('click', function () {
      var actual = b.closest('.paso');
      if (!validar(actual)) { reqMsg.textContent = 'Completa los campos marcados para continuar.'; return; }
      formReq.dataset.iniciado = '1';
      irA(+b.dataset.sig);
    });
  });
  $$('[data-ant]', formReq).forEach(function (b) { b.addEventListener('click', function () { irA(+b.dataset.ant); }); });

  function recolectar(form) {
    var datos = {};
    $$('input[name],select[name],textarea[name]', form).forEach(function (el) {
      if (el.type === 'file' || el.closest('.chips')) return;
      if (el.type === 'checkbox') { datos[el.name] = el.checked ? 'Sí' : 'No'; return; }
      datos[el.name] = String(el.value || '').trim();
    });
    $$('.chips', form).forEach(function (c) {
      datos[c.dataset.nombre] = $$('input:checked', c).map(function (i) { return i.value; }).join('; ');
    });
    return datos;
  }

  /* Borrador local para no perder lo escrito */
  var CLAVE_BORR = 'df_borrador_req';
  function guardarBorrador() {
    try { localStorage.setItem(CLAVE_BORR, JSON.stringify(recolectar(formReq))); } catch (e) { /* nada */ }
  }
  function cargarBorrador() {
    var b = null;
    try { b = JSON.parse(localStorage.getItem(CLAVE_BORR) || 'null'); } catch (e) { return; }
    if (!b) return;
    Object.keys(b).forEach(function (k) {
      var chips = $('.chips[data-nombre="' + k + '"]', formReq);
      if (chips) {
        var vals = String(b[k] || '').split('; ');
        $$('input', chips).forEach(function (i) { i.checked = vals.indexOf(i.value) > -1; });
        return;
      }
      var el = formReq.elements[k];
      if (!el || el.type === 'file' || k === 'sitio_web_empresa') return;
      if (el.type === 'checkbox') el.checked = b[k] === 'Sí'; else el.value = b[k] || '';
    });
  }
  cargarBorrador();
  var tBorr;
  formReq.addEventListener('input', function () { clearTimeout(tBorr); tBorr = setTimeout(guardarBorrador, 600); });
  formReq.addEventListener('change', guardarBorrador);

  function leerAdjunto(input) {
    return new Promise(function (res, rej) {
      var f = input.files && input.files[0];
      if (!f) return res(null);
      if (f.size > 8 * 1024 * 1024) return rej(new Error('El archivo adjunto supera los 8 MB. Reduce su tamaño o envíalo después por correo.'));
      var fr = new FileReader();
      fr.onload = function () { res({ nombre: f.name, tipo: f.type || 'application/octet-stream', base64: String(fr.result).split(',')[1] }); };
      fr.onerror = function () { rej(new Error('No se pudo leer el archivo adjunto.')); };
      fr.readAsDataURL(f);
    });
  }

  formReq.addEventListener('submit', function (e) {
    e.preventDefault();
    var paso4 = $('.paso[data-paso="4"]', formReq);
    if (!validar(paso4)) { reqMsg.textContent = 'Completa los campos marcados para enviar.'; return; }
    // Revalida pasos anteriores por si se editó algo
    for (var n = 1; n <= 3; n++) {
      var p = $('.paso[data-paso="' + n + '"]', formReq);
      p.classList.add('activo');
      var ok = validar(p);
      p.classList.remove('activo');
      if (!ok) { irA(n); reqMsg.textContent = 'Falta información en este paso.'; validar(p); return; }
    }
    var btn = $('button[type=submit]', paso4);
    btn.disabled = true; reqMsg.className = 'form-msg'; reqMsg.textContent = 'Enviando requerimiento…';
    leerAdjunto($('#adjunto'))
      .then(function (adj) {
        return enviar({ action: 'requerimiento', datos: recolectar(formReq), adjunto: adj, t: Date.now() - T0 });
      })
      .then(function (r) {
        reqMsg.textContent = '';
        formReq.reset(); delete formReq.dataset.iniciado;
        try { localStorage.removeItem(CLAVE_BORR); } catch (e2) { /* nada */ }
        irA(1); pasos.hidden = true;
        confirmar('¡REQUERIMIENTO RECIBIDO!', 'Gracias. Revisaremos tu información para preparar una maqueta y una propuesta. Te enviamos una copia a tu correo.', r.folio);
      })
      .catch(function (err) { reqMsg.textContent = msgError(err); })
      .then(function () { btn.disabled = false; });
  });

  /* ---------- Formulario de contacto ---------- */
  var formCon = $('#formContacto'), conMsg = $('#conMsg');
  formCon.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validar(formCon)) { conMsg.textContent = 'Completa los campos marcados.'; return; }
    var btn = $('button[type=submit]', formCon);
    btn.disabled = true; conMsg.textContent = 'Enviando…';
    enviar({ action: 'contacto', datos: recolectar(formCon), t: Date.now() - T0 })
      .then(function (r) {
        conMsg.textContent = ''; formCon.reset();
        cerrar($('#modalContacto'));
        confirmar('¡MENSAJE RECIBIDO!', 'Gracias por escribirnos. Te responderemos a la brevedad.', r.folio);
      })
      .catch(function (err) { conMsg.textContent = msgError(err); })
      .then(function () { btn.disabled = false; });
  });
})();
