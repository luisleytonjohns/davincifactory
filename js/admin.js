/* =========================================================
   DAVINCI FACTORY · Panel de administración de desarrollos
   ========================================================= */
(function () {
  'use strict';
  var API = ((window.DAVINCI || {}).API_URL || '').trim();
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var token = '';
  try { token = sessionStorage.getItem('df_token') || ''; } catch (e) { /* nada */ }
  var lista = [];
  var imgs = { foto: null, logo: null, quitarFoto: false, quitarLogo: false, fotoUrl: '', logoUrl: '' };

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
  function api(payload) {
    if (!API) return Promise.reject(new Error('Falta configurar API_URL en js/config.js'));
    payload.token = token;
    return fetch(API, { method: 'POST', body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.error === 'SESION') { salir(); throw new Error('La sesión expiró. Ingresa nuevamente.'); }
        if (!j || !j.ok) throw new Error((j && j.error) || 'Error del servidor');
        return j;
      });
  }

  /* ---------- Tarjeta (misma que el sitio) ---------- */
  function tarjeta(d) {
    var foto = urlSegura(d.foto_url), logo = urlSegura(d.logo_url);
    var fotoHtml = foto
      ? '<div class="tarjeta__foto" style="background-image:url(\'' + esc(foto).replace(/'/g, '%27') + '\')"></div>'
      : '<div class="tarjeta__foto tarjeta__foto--vacia"><img src="img/logo.svg" alt=""></div>';
    var cab = logo ? '<img class="tarjeta__logo" src="' + esc(logo) + '" alt="">' : '<span class="tarjeta__nombre">' + esc(d.nombre || 'Nombre') + '</span>';
    return '<div class="tarjeta">' + fotoHtml + '<div class="tarjeta__cuerpo">' + cab +
      '<span class="tarjeta__desc">' + esc(d.descripcion || 'Descripción breve del desarrollo.') + '</span>' +
      (d.categoria ? '<span class="tarjeta__cat">' + esc(d.categoria) + '</span>' : '') + '</div></div>';
  }

  /* ---------- Vistas ---------- */
  function mostrarPanel() { $('#vLogin').hidden = true; $('#vPanel').hidden = false; cargar(); }
  function salir() {
    token = '';
    try { sessionStorage.removeItem('df_token'); } catch (e) { /* nada */ }
    $('#vPanel').hidden = true; $('#vLogin').hidden = false;
  }
  $('#btnSalir').addEventListener('click', function () { api({ action: 'logout' }).catch(function () {}); salir(); });

  $('#formLogin').addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('#loginMsg'), clave = this.clave.value;
    if (!clave) return;
    msg.textContent = 'Verificando…';
    api({ action: 'login', clave: clave })
      .then(function (j) {
        token = j.token;
        try { sessionStorage.setItem('df_token', token); } catch (e2) { /* nada */ }
        msg.textContent = ''; e.target.reset(); mostrarPanel();
      })
      .catch(function (err) { msg.textContent = err.message; });
  });

  function cargar() {
    $('#cargando').hidden = false;
    api({ action: 'admin_listar' })
      .then(function (j) { lista = j.desarrollos || []; pintar(); })
      .catch(function (err) { $('#cargando').textContent = err.message; });
  }
  function pintar() {
    $('#cargando').hidden = true;
    if (!lista.length) { $('#lista').innerHTML = '<p class="cargando">Aún no hay desarrollos. Crea el primero con «Nuevo desarrollo».</p>'; return; }
    $('#lista').innerHTML = lista.map(function (d) {
      var vis = String(d.visible) !== 'false' && d.visible !== false;
      return '<div class="adm-item' + (vis ? '' : ' oculto') + '">' + tarjeta(d) +
        '<div class="adm-meta"><span>Orden ' + esc(d.orden) + ' · <span class="etiqueta' + (vis ? '' : ' no') + '">' + (vis ? 'Visible' : 'Oculto') + '</span></span>' +
        '<span class="btns"><button data-ed="' + esc(d.id) + '">Editar</button><button class="borrar" data-del="' + esc(d.id) + '">Eliminar</button></span></div></div>';
    }).join('');
  }
  $('#lista').addEventListener('click', function (e) {
    var ed = e.target.closest('[data-ed]'), del = e.target.closest('[data-del]');
    if (ed) abrirEditor(lista.filter(function (d) { return String(d.id) === ed.dataset.ed; })[0]);
    if (del) {
      var d = lista.filter(function (x) { return String(x.id) === del.dataset.del; })[0];
      if (!d || !window.confirm('¿Eliminar «' + d.nombre + '»? Esta acción no se puede deshacer.')) return;
      del.disabled = true;
      api({ action: 'admin_eliminar', id: d.id }).then(cargar).catch(function (err) { alert(err.message); del.disabled = false; });
    }
  });

  /* ---------- Editor ---------- */
  var modal = $('#modalEditor'), form = $('#formEd');
  $$('[data-cerrar]', modal).forEach(function (b) { b.addEventListener('click', function () { modal.hidden = true; }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') modal.hidden = true; });
  $('#btnNuevo').addEventListener('click', function () { abrirEditor(null); });

  function abrirEditor(d) {
    form.reset();
    $('#edMsg').textContent = '';
    imgs = { foto: null, logo: null, quitarFoto: false, quitarLogo: false, fotoUrl: '', logoUrl: '' };
    $('#edTitulo').textContent = d ? 'EDITAR DESARROLLO' : 'NUEVO DESARROLLO';
    form.id.value = d ? d.id : '';
    form.nombre.value = d ? d.nombre : '';
    form.categoria.value = d ? (d.categoria || '') : '';
    form.descripcion.value = d ? d.descripcion : '';
    form.url.value = d ? (d.url || '') : '';
    var maxOrden = lista.reduce(function (m, x) { return Math.max(m, +x.orden || 0); }, 0);
    form.orden.value = d ? d.orden : maxOrden + 10;
    form.visible.checked = d ? (String(d.visible) !== 'false' && d.visible !== false) : true;
    imgs.fotoUrl = d ? (d.foto_url || '') : '';
    imgs.logoUrl = d ? (d.logo_url || '') : '';
    refrescarImgs(); vista();
    modal.hidden = false;
    setTimeout(function () { form.nombre.focus(); }, 60);
  }
  function refrescarImgs() {
    var f = imgs.foto ? imgs.foto.dataUrl : (imgs.quitarFoto ? '' : imgs.fotoUrl);
    var l = imgs.logo ? imgs.logo.dataUrl : (imgs.quitarLogo ? '' : imgs.logoUrl);
    $('#prevFoto').hidden = !f; if (f) $('#prevFoto').src = f; $('#quitarFoto').hidden = !f;
    $('#prevLogo').hidden = !l; if (l) $('#prevLogo').src = l; $('#quitarLogo').hidden = !l;
  }
  function vista() {
    var n = form.descripcion.value.length, c = $('#cont');
    c.textContent = n + '/110'; c.classList.toggle('excede', n > 110);
    $('#vistaTarjeta').innerHTML = tarjeta({
      nombre: form.nombre.value, descripcion: form.descripcion.value, categoria: form.categoria.value,
      foto_url: imgs.foto ? imgs.foto.dataUrl : (imgs.quitarFoto ? '' : imgs.fotoUrl),
      logo_url: imgs.logo ? imgs.logo.dataUrl : (imgs.quitarLogo ? '' : imgs.logoUrl)
    });
  }
  form.addEventListener('input', vista);

  function redimensionar(file, maxW, tipoSalida) {
    return new Promise(function (res, rej) {
      if (!/^image\//.test(file.type)) return rej(new Error('El archivo debe ser una imagen.'));
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var k = Math.min(1, maxW / img.naturalWidth);
        var cv = document.createElement('canvas');
        cv.width = Math.round(img.naturalWidth * k); cv.height = Math.round(img.naturalHeight * k);
        var cx = cv.getContext('2d');
        cx.imageSmoothingQuality = 'high';
        cx.drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        var dataUrl = cv.toDataURL(tipoSalida, 0.86);
        res({ dataUrl: dataUrl, base64: dataUrl.split(',')[1], tipo: tipoSalida, nombre: file.name.replace(/\.[^.]+$/, '') + (tipoSalida === 'image/png' ? '.png' : '.jpg') });
      };
      img.onerror = function () { rej(new Error('No se pudo leer la imagen.')); };
      img.src = url;
    });
  }
  $('#inFoto').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    redimensionar(f, 1200, 'image/jpeg').then(function (r) { imgs.foto = r; imgs.quitarFoto = false; refrescarImgs(); vista(); })
      .catch(function (err) { $('#edMsg').textContent = err.message; });
  });
  $('#inLogo').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    var tipo = /png|svg|gif|webp/.test(f.type) ? 'image/png' : 'image/jpeg';
    redimensionar(f, 600, tipo).then(function (r) { imgs.logo = r; imgs.quitarLogo = false; refrescarImgs(); vista(); })
      .catch(function (err) { $('#edMsg').textContent = err.message; });
  });
  $('#quitarFoto').addEventListener('click', function () { imgs.foto = null; imgs.quitarFoto = true; $('#inFoto').value = ''; refrescarImgs(); vista(); });
  $('#quitarLogo').addEventListener('click', function () { imgs.logo = null; imgs.quitarLogo = true; $('#inLogo').value = ''; refrescarImgs(); vista(); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('#edMsg');
    if (!form.nombre.value.trim() || !form.descripcion.value.trim()) { msg.textContent = 'Nombre y descripción son obligatorios.'; return; }
    var btn = $('#btnGuardar'); btn.disabled = true; msg.className = 'form-msg'; msg.textContent = 'Guardando…';
    var limpiar = function (o) { return o ? { base64: o.base64, tipo: o.tipo, nombre: o.nombre } : null; };
    api({
      action: 'admin_guardar',
      desarrollo: {
        id: form.id.value, nombre: form.nombre.value.trim(), categoria: form.categoria.value.trim(),
        descripcion: form.descripcion.value.trim(), url: form.url.value.trim(),
        orden: +form.orden.value || 0, visible: form.visible.checked
      },
      foto: limpiar(imgs.foto), logo: limpiar(imgs.logo),
      quitar_foto: imgs.quitarFoto, quitar_logo: imgs.quitarLogo
    })
      .then(function () { modal.hidden = true; cargar(); })
      .catch(function (err) { msg.textContent = err.message; })
      .then(function () { btn.disabled = false; });
  });

  /* ---------- Inicio ---------- */
  if (token) mostrarPanel();
})();
