// Odanızda Gör: gerçek ölçülü mobilya. Ölçü serbest (model tarayıcıda üretilir: js/ar-uret.js), renk / gövde / tezgah / kulp
// malzemelerde canlı değişir. Ek olarak: tahmini bütçe (js/fiyatlar.js), keşif randevusu, kamerayla duvar ölçme (WebXR),
// oda fotoğrafının üstünde görme, tasarım linki. Arapça sayfada metinler js/dil.js'den gelir; WhatsApp mesajları ustaya Türkçe gider.
(function () {
  var mv = document.getElementById('arv');
  if (!mv) return;
  var $ = function (id) { return document.getElementById(id); };
  var AR_LANG = document.documentElement.lang === 'ar';
  var DICT = (AR_LANG && window.LADIN_DIL && window.LADIN_DIL.ar) || {};
  function t(s) { return DICT[s] || s; }
  var FIYAT = window.LADIN_FIYAT || null;

  // w: [en az, en çok, adım] mm; presets: her telefonda kamerada açılan hazır dosyalar (araclar/ar-modeller.js ile aynı)
  var PRODUCTS = {
    mutfak:   { name: 'Mutfak dolabı', w: [1200, 4200, 50], def: 2400, presets: [1800, 2400, 3000, 3600], h: 2170, d: 600, top: true },
    gardirop: { name: 'Gardırop', w: [800, 3600, 50], def: 1800, presets: [1200, 1800, 2400], hr: [2000, 2800, 50], hdef: 2400, d: 600 },
    vestiyer: { name: 'Vestiyer', w: [800, 2000, 50], def: 1400, presets: [1000, 1400], h: 1950, d: 380 },
    karyola:  { name: 'Karyola', sizes: [['90x190', '90×190'], ['100x200', '100×200'], ['120x200', '120×200'], ['160x200', '160×200']], def: '100x200' },
    masa:     { name: 'Çalışma masası', w: [900, 2000, 50], def: 1200, presets: [1200, 1600], h: 2000, d: 600 },
    tv:       { name: 'TV ünitesi', w: [1400, 3200, 50], def: 2400, presets: [1800, 2400], h: 1900, d: 420 },
    banyo:    { name: 'Banyo dolabı', w: [600, 1400, 50], def: 800, presets: [800, 1000], h: 1900, d: 460 }
  };
  // ad, renk, pürüzlülük, ahşap dokusu (taban, damar)
  var COLORS = {
    beyaz: ['Beyaz lake', '#F1F1EC', 0.55], kasmir: ['Kaşmir', '#DCCFB8', 0.6], antrasit: ['Antrasit', '#3B3F46', 0.6],
    adacayi: ['Adaçayı', '#93A68B', 0.6], gece: ['Gece mavisi', '#34487E', 0.55], bordo: ['Bordo akrilik', '#7A2430', 0.18],
    mese: ['Meşe', '#C9A06E', 0.7, ['#D2A673', '#A0713F']], ceviz: ['Ceviz', '#6B4429', 0.7, ['#7A4E33', '#45281A']]
  };
  var BODIES = { ayni: 'Kapakla aynı', beyaz: 'Beyaz', antrasit: 'Antrasit', mese: 'Meşe', ceviz: 'Ceviz' };
  var TOPS = {
    mermer: ['Beyaz mermer', '#ECEAE6', 0.25], granit: ['Siyah granit', '#232428', 0.2],
    mese: ['Meşe', '#C9A06E', 0.55, ['#D2A673', '#A0713F']], beton: ['Beton gri', '#9EA0A1', 0.85]
  };
  var HANDLES = { cubuk: 'Çubuk kulp', dugme: 'Düğme kulp', yok: 'Kulpsuz' };
  var DOORS = { kapakli: 'Kapaklı', surgulu: 'Sürgülü', ayna: 'Aynalı sürgülü' };
  var SLOTS = { sabah: 'Sabah (09–12)', ogle: 'Öğleden sonra (12–15)', aksam: 'Akşamüstü (15–18)' };
  var SIDE = [1500, 3600, 50];

  // ---------- Durum (paylaşılan linkten okunur) ----------
  var state = { p: 'gardirop', w: 0, h: 2400, size: '100x200', c: 'beyaz', g: 'ayni', t: 'mermer', k: 'cubuk', dims: true, mt: 'duz', side: 2000, upper: true, door: 'kapakli' };
  function clamp(v, r) { v = Math.round(+v / r[2]) * r[2]; return isNaN(v) || !v ? null : Math.min(r[1], Math.max(r[0], v)); }
  (function readHash() {
    var parts = decodeURIComponent(location.hash.slice(1)).split('?'), q = {};
    (parts[1] || '').split('&').forEach(function (kv) { var a = kv.split('='); if (a[0]) q[a[0]] = a[1]; });
    if (PRODUCTS[parts[0]]) state.p = parts[0];
    var pr = PRODUCTS[state.p];
    state.w = pr.w ? (clamp(q.w, pr.w) || pr.def) : 0;
    if (pr.hr) state.h = clamp(q.h, pr.hr) || pr.hdef;
    if (pr.sizes && pr.sizes.some(function (s) { return s[0] === q.s; })) state.size = q.s;
    if (COLORS[q.c]) state.c = q.c;
    if (BODIES[q.g]) state.g = q.g;
    if (TOPS[q.t]) state.t = q.t;
    if (HANDLES[q.k]) state.k = q.k;
    if (q.m === 'l') state.mt = 'l';
    if (q.y) state.side = clamp(q.y, SIDE) || 2000;
    if (q.u === '0') state.upper = false;
    if (DOORS[q.d]) state.door = q.d;
  })();

  function cm(mm) { return (Math.round(mm) / 10).toString().replace('.', ',') + ' cm'; }
  function dims() {
    var pr = PRODUCTS[state.p];
    if (state.p === 'karyola') { var s = state.size.split('x'); return { W: s[0] * 10 + 60, H: 1000, D: s[1] * 10 + 60 }; }
    if (state.p === 'mutfak' && state.mt === 'l') return { W: state.w, H: pr.h, D: state.side, side: true };
    return { W: state.w, H: pr.hr ? state.h : pr.h, D: state.p === 'gardirop' && state.door !== 'kapakli' ? 650 : pr.d };
  }
  function shareURL() {
    var pr = PRODUCTS[state.p];
    var q = state.p === 'karyola' ? 's=' + state.size : 'w=' + state.w + (pr.hr ? '&h=' + state.h : '');
    if (state.p === 'mutfak') q += '&m=' + state.mt + (state.mt === 'l' ? '&y=' + state.side : '') + (state.upper ? '' : '&u=0');
    if (state.p === 'gardirop') q += '&d=' + state.door;
    q += '&c=' + state.c + '&g=' + state.g + '&k=' + state.k + (pr.top ? '&t=' + state.t : '');
    return location.href.split('#')[0] + '#' + state.p + '?' + q;
  }

  // ---------- Tahmini bütçe ----------
  function estimate() {
    if (!FIYAT) return null;
    var F = FIYAT, base;
    if (state.p === 'mutfak') {
      var len = state.w / 1000 + (state.mt === 'l' ? (state.side - 600) / 1000 : 0);
      base = len * F.mutfak.metre * (state.upper ? 1 + F.mutfak.ust : 1) * (F.tezgah[state.t] || 1);
    } else if (state.p === 'gardirop') base = state.w * state.h / 1e6 * F.gardirop.m2 * (F.kapakTipi[state.door] || 1);
    else if (state.p === 'karyola') base = F.karyola.adet[state.size];
    else base = state.w / 1000 * F[state.p].metre;
    var total = base * (F.kapak[state.c] || 1);
    return [Math.round(total * (1 - F.aralik) / 1000) * 1000, Math.round(total * (1 + F.aralik) / 1000) * 1000];
  }
  function tl(n) { return n.toLocaleString('tr-TR') + ' TL'; }

  // ---------- Model kaynağı: hazır dosya ya da tarayıcıda üretilmiş ----------
  var blobURL = null, usingBlob = false;
  function isPreset() {
    var pr = PRODUCTS[state.p];
    if (state.p === 'karyola') return true;
    if (state.p === 'mutfak' && (state.mt !== 'duz' || !state.upper)) return false;
    if (state.p === 'gardirop' && state.door !== 'kapakli') return false;
    return pr.presets.indexOf(state.w) >= 0 && (!pr.hr || state.h === 2400);
  }
  function loadModel() {
    var src;
    if (isPreset()) { src = 'modeller/' + state.p + '-' + (state.p === 'karyola' ? state.size : state.w) + '.glb'; usingBlob = false; }
    else {
      var glb = window.LadinModel.build(state.p, { w: state.w, h: state.h, door: state.door, mt: state.mt, side: state.side, upper: state.upper });
      if (blobURL) URL.revokeObjectURL(blobURL);
      blobURL = src = URL.createObjectURL(new Blob([glb], { type: 'model/gltf-binary' }));
      usingBlob = true;
    }
    if (mv.getAttribute('src') !== src) mv.setAttribute('src', src); else applyLook();
  }
  var rebuildTimer = null;
  function rebuildSoon() { clearTimeout(rebuildTimer); rebuildTimer = setTimeout(loadModel, 220); }

  // ---------- Malzemeler ----------
  function linear(hex, k) {
    return [1, 3, 5].map(function (i) {
      var v = parseInt(hex.slice(i, i + 2), 16) / 255 * (k || 1);
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }).concat(1);
  }
  function woodURL(base, grain) {
    var c = document.createElement('canvas'); c.width = c.height = 512;
    var g = c.getContext('2d'), seed = 7;
    var r = function () { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    for (var i = 0; i < 180; i++) {
      var x = r() * 512; g.strokeStyle = grain; g.globalAlpha = 0.05 + r() * 0.22; g.lineWidth = 0.5 + r() * 2.6;
      g.beginPath(); g.moveTo(x, 0);
      for (var y = 0; y <= 512; y += 32) g.lineTo(x + Math.sin(y / 80 + i) * 5 + (r() - 0.5) * 2, y);
      g.stroke();
    }
    return c.toDataURL('image/jpeg', 0.85);
  }
  var texCache = {};
  function texture(spec) {
    var key = spec[3].join();
    if (!texCache[key]) texCache[key] = mv.createTexture(woodURL(spec[3][0], spec[3][1]));
    return texCache[key];
  }
  function paint(mat, spec, k) {
    if (!mat) return;
    var pbr = mat.pbrMetallicRoughness;
    pbr.setRoughnessFactor(spec[2]);
    if (spec[3]) {
      pbr.setBaseColorFactor([k, k, k, 1]);
      texture(spec).then(function (tx) { if (mat.pbrMetallicRoughness.baseColorTexture) mat.pbrMetallicRoughness.baseColorTexture.setTexture(tx); });
    } else {
      if (pbr.baseColorTexture) pbr.baseColorTexture.setTexture(null);
      pbr.setBaseColorFactor(linear(spec[1], k));
    }
  }
  function applyLook() {
    if (!mv.model) return;
    var M = {};
    mv.model.materials.forEach(function (m) { M[m.name] = m; });
    paint(M.kapak, COLORS[state.c], 1);
    paint(M.govde, state.g === 'ayni' ? COLORS[state.c] : COLORS[state.g], state.g === 'ayni' ? 0.78 : 0.94);
    if (M.tezgah) paint(M.tezgah, TOPS[state.t], 1);
    ['cubuk', 'dugme'].forEach(function (k) {
      var m = M['kulp-' + k];
      if (!m) return;
      var on = state.k === k;
      m.setAlphaMode(on ? 'OPAQUE' : 'BLEND');
      m.pbrMetallicRoughness.setBaseColorFactor(on ? [0.6, 0.62, 0.65, 1] : [0, 0, 0, 0]);
    });
  }

  // ---------- Ölçü etiketleri ve kadraj ----------
  function placeDims() {
    var c = mv.getBoundingBoxCenter(), s = mv.getDimensions(), d = dims();
    var f = function (x, y, z) { return x.toFixed(3) + 'm ' + y.toFixed(3) + 'm ' + z.toFixed(3) + 'm'; };
    mv.updateHotspot({ name: 'hotspot-w', position: f(c.x, c.y + s.y / 2 + 0.07, c.z + s.z / 2) });
    mv.updateHotspot({ name: 'hotspot-h', position: f(c.x + s.x / 2 + 0.06, c.y, c.z + s.z / 2) });
    mv.updateHotspot({ name: 'hotspot-d', position: f(c.x + s.x / 2 + 0.04, c.y + s.y / 2, c.z) });
    $('dim-w').textContent = '↔ ' + cm(d.W);
    $('dim-h').textContent = '↕ ' + cm(d.H);
    $('dim-d').textContent = t(d.side ? 'yan duvar' : 'derinlik') + ' ' + cm(d.D);
    mv.cameraTarget = 'auto ' + (s.y * 0.5).toFixed(2) + 'm auto';
  }

  // ---------- Arayüz ----------
  function press(container, attr, value) {
    Array.prototype.forEach.call(container.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', b.getAttribute(attr) === String(value)); });
  }
  function pressAll(selector, attr, value) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (c) { press(c, attr, value); });
  }
  function renderControls() {
    var pr = PRODUCTS[state.p];
    $('ar-product').innerHTML = Object.keys(PRODUCTS).map(function (k) {
      return '<button type="button" data-p="' + k + '" aria-pressed="' + (k === state.p) + '">' + t(PRODUCTS[k].name) + '</button>';
    }).join('');
    $('row-w').hidden = !pr.w; $('row-h').hidden = !pr.hr; $('row-size').hidden = !pr.sizes; $('row-top').hidden = !pr.top;
    $('row-mt').hidden = $('row-upper').hidden = state.p !== 'mutfak';
    $('row-side').hidden = !(state.p === 'mutfak' && state.mt === 'l');
    $('row-door').hidden = state.p !== 'gardirop';
    $('ar-side').value = state.side; $('ar-upper').checked = state.upper;
    press($('ar-mt'), 'data-mt', state.mt); press($('ar-door'), 'data-door', state.door);
    if (pr.w) {
      var r = $('ar-w'); r.min = pr.w[0]; r.max = pr.w[1]; r.step = pr.w[2]; r.value = state.w;
      $('ar-presets').innerHTML = t('Standart:') + ' ' + pr.presets.map(function (v) { return '<button type="button" data-v="' + v + '">' + v / 10 + '</button>'; }).join('') + ' cm';
    }
    if (pr.hr) { var h = $('ar-h'); h.min = pr.hr[0]; h.max = pr.hr[1]; h.step = pr.hr[2]; h.value = state.h; }
    if (pr.sizes) $('row-size').querySelector('.seg').innerHTML = pr.sizes.map(function (s) {
      return '<button type="button" data-s="' + s[0] + '" aria-pressed="' + (s[0] === state.size) + '">' + s[1] + '</button>';
    }).join('');
    pressAll('.arx-colors', 'data-c', state.c); pressAll('.arx-hgroup', 'data-k', state.k);
    press($('ar-body'), 'data-g', state.g); press($('ar-top'), 'data-t', state.t);
  }
  // Seçim özeti: tr=true ustaya giden Türkçe mesaj için, false ekranda gösterilen (Arapça sayfada çevrili) hâl
  function selection(tr) {
    var f = tr ? function (s) { return s; } : t, c = COLORS[state.c];
    var model = state.p === 'mutfak' ? f(state.mt === 'l' ? 'L mutfak' : 'Düz mutfak') + (state.upper ? '' : ', ' + f('üst dolapsız')) + ' · '
      : state.p === 'gardirop' ? f(DOORS[state.door]) + ' · ' : '';
    return model + f('Kapak') + ' ' + f(c[0]) + ' · ' + f('Gövde') + ' ' + f(state.g === 'ayni' ? c[0] : BODIES[state.g]) + ' · ' + f(HANDLES[state.k]) +
      (PRODUCTS[state.p].top ? ' · ' + f('Tezgah') + ' ' + f(TOPS[state.t][0]) : '');
  }
  function appointment() {
    var v = $('ap-date').value;
    if (!v) return '';
    var d = new Date(v + 'T12:00:00');
    return d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }) + ', ' + SLOTS[$('ap-slot').value];
  }
  function update() {
    var pr = PRODUCTS[state.p], c = COLORS[state.c], d = dims(), est = estimate();
    if (pr.w) $('o-w').textContent = cm(state.w);
    if (pr.hr) $('o-h').textContent = cm(state.h);
    $('o-side').textContent = cm(state.side);
    $('ar-cname').textContent = t(c[0]) + ' · ' + t(HANDLES[state.k]);
    $('ar-sum').innerHTML =
      '<div><span>' + t(pr.name) + ' · ' + t(d.side ? 'G × Y × yan' : 'G × Y × D') + '</span><b>' + cm(d.W) + ' × ' + cm(d.H) + ' × ' + cm(d.D) + '</b></div>' +
      '<div><span>' + t('Seçim') + '</span><b>' + selection(false) + '</b></div>' +
      (est ? '<div class="arx-price"><span>' + t('Tahmini bütçe') + '</span><b dir="ltr">' + tl(est[0]) + ' – ' + tl(est[1]) + '</b><small>' +
        t('Kesin fiyat keşifte netleşir.') + (FIYAT.ornek ? ' <em>' + t('Örnek fiyatlar') + '</em>' : '') + '</small></div>' : '');
    var url = shareURL();
    try { history.replaceState(null, '', '#' + url.split('#')[1]); } catch (e) {}
    var ap = appointment(), from = AR_LANG ? '[Arapça sayfadan] ' : '';
    var msg = from + 'Merhaba, sitenizde odamda denediğim ' + pr.name.toLowerCase() + ' için ölçü ve fiyat almak istiyorum.\n' +
      'Ölçü: ' + cm(d.W) + ' × ' + cm(d.H) + ' × ' + cm(d.D) + '\n' + selection(true) +
      (est ? '\nSitedeki tahmini bütçe: ' + tl(est[0]) + ' – ' + tl(est[1]) : '') +
      (ap ? '\nKeşif için uygun zamanım: ' + ap : '') + '\nTasarım: ' + url;
    $('ar-wa').href = 'https://wa.me/905422683828?text=' + encodeURIComponent(msg);
    var apMsg = from + 'Merhaba, ' + pr.name.toLowerCase() + ' için ücretsiz keşif randevusu istiyorum.\n' +
      (ap ? 'Uygun zamanım: ' + ap + '\n' : '') + 'Tasarımım: ' + url;
    $('ap-wa').href = 'https://wa.me/905422683828?text=' + encodeURIComponent(apMsg);
    mv.alt = t(pr.name) + ', ' + cm(d.W) + ', ' + selection(false);
  }
  function onClick(id, fn) {
    $(id).addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) fn(b); });
  }

  onClick('ar-product', function (b) {
    state.p = b.dataset.p; var pr = PRODUCTS[state.p];
    state.w = pr.w ? pr.def : 0; if (pr.hr) state.h = pr.hdef;
    renderControls(); loadModel(); update();
  });
  onClick('ar-presets', function (b) { state.w = +b.dataset.v; $('ar-w').value = state.w; if (PRODUCTS[state.p].hr) { state.h = 2400; $('ar-h').value = 2400; } loadModel(); update(); });
  onClick('ar-mt', function (b) { state.mt = b.dataset.mt; renderControls(); loadModel(); update(); });
  onClick('ar-door', function (b) { state.door = b.dataset.door; press($('ar-door'), 'data-door', state.door); loadModel(); update(); });
  $('ar-upper').addEventListener('change', function () { state.upper = this.checked; loadModel(); update(); });
  onClick('row-size', function (b) { state.size = b.dataset.s; press($('row-size'), 'data-s', state.size); loadModel(); update(); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.arx-colors button, .arx-hgroup button');
    if (!b) return;
    if (b.dataset.c) { state.c = b.dataset.c; pressAll('.arx-colors', 'data-c', state.c); }
    else { state.k = b.dataset.k; pressAll('.arx-hgroup', 'data-k', state.k); }
    applyLook(); update();
  });
  onClick('ar-body', function (b) { state.g = b.dataset.g; press($('ar-body'), 'data-g', state.g); applyLook(); update(); });
  onClick('ar-top', function (b) { state.t = b.dataset.t; press($('ar-top'), 'data-t', state.t); applyLook(); update(); });
  $('ar-dims').addEventListener('click', function () {
    state.dims = !state.dims; mv.classList.toggle('no-dims', !state.dims); this.setAttribute('aria-pressed', state.dims);
  });
  [['ar-w', 'w'], ['ar-h', 'h'], ['ar-side', 'side']].forEach(function (x) {
    var el = $(x[0]);
    el.addEventListener('input', function () { state[x[1]] = +el.value; update(); rebuildSoon(); });
  });
  var shareLabel = $('ar-share').textContent;
  $('ar-share').addEventListener('click', function () {
    var btn = this, url = shareURL(), done = function (s) { btn.textContent = s; setTimeout(function () { btn.textContent = shareLabel; }, 2200); };
    if (navigator.share) { navigator.share({ title: 'Ladin Ahşap · ' + t(PRODUCTS[state.p].name), url: url }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { done(t('Link kopyalandı')); }, function () { prompt(t('Linki kopyalayın:'), url); });
    else prompt(t('Linki kopyalayın:'), url);
  });

  // ---------- Keşif randevusu ----------
  (function () {
    var d = new Date(); d.setDate(d.getDate() + 1);
    $('ap-date').min = d.toISOString().slice(0, 10);
    $('ap-date').addEventListener('change', update);
    $('ap-slot').addEventListener('change', update);
  })();

  // ---------- Oda fotoğrafının üstünde görme (her telefonda çalışır, ölçek yaklaşık) ----------
  var stage = mv.parentElement, photoURL = null;
  $('ph-file').addEventListener('change', function () {
    var f = this.files && this.files[0];
    if (!f) return;
    if (photoURL) URL.revokeObjectURL(photoURL);
    photoURL = URL.createObjectURL(f);
    stage.style.backgroundImage = 'url("' + photoURL + '")';
    stage.classList.add('on-photo'); mv.classList.add('on-photo');
    $('ph-tools').hidden = false;
    stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('ph-clear').addEventListener('click', function () {
    stage.style.backgroundImage = ''; stage.classList.remove('on-photo'); mv.classList.remove('on-photo');
    $('ph-tools').hidden = true; $('ph-file').value = '';
    if (photoURL) { URL.revokeObjectURL(photoURL); photoURL = null; }
  });
  $('ph-save').addEventListener('click', function () {
    if (!photoURL) return;
    var W = mv.clientWidth * 2, H = mv.clientHeight * 2, c = document.createElement('canvas'); c.width = W; c.height = H;
    var g = c.getContext('2d'), img = new Image();
    img.onload = function () {
      var s = Math.max(W / img.width, H / img.height), iw = img.width * s, ih = img.height * s;
      g.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);
      mv.toBlob({ idealAspect: false }).then(function (b) { return createImageBitmap(b); }).then(function (bm) {
        g.drawImage(bm, 0, 0, W, H);
        c.toBlob(function (blob) {
          var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'ladin-ahsap-odam.jpg';
          document.body.appendChild(a); a.click(); a.remove();
        }, 'image/jpeg', 0.9);
      });
    };
    img.src = photoURL;
  });

  // ---------- Kamerayla duvar ölçme (Android Chrome, WebXR hit-test) ----------
  var XR = false;
  if (navigator.xr && navigator.xr.isSessionSupported) navigator.xr.isSessionSupported('immersive-ar').then(function (v) {
    XR = v; $('ms-go').hidden = !v;
  }, function () {});
  var ms = $('ms'), msText = $('ms-text'), msSession = null, msA = null, msCur = null, msDist = 0;
  function msSay() {
    if (!msCur) { msText.textContent = t('Kamerayı yavaşça yere doğru gezdirin…'); return; }
    if (!msA) { msText.textContent = t('Artıyı duvarın bir ucunun dibine (yere) getirip "Başlangıç"a dokunun.'); return; }
    msDist = Math.hypot(msCur.x - msA.x, msCur.z - msA.z);
    msText.textContent = t('Ölçü:') + ' ' + cm(msDist * 1000) + ' — ' + t('diğer uca gidip "Kullan"a dokunun.');
  }
  $('ms-go').addEventListener('click', function () {
    navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test', 'local'], optionalFeatures: ['dom-overlay'], domOverlay: { root: ms } })
      .then(function (session) {
        msSession = session; msA = null; msCur = null; msDist = 0;
        ms.hidden = false; $('ms-use').disabled = true;
        var canvas = document.createElement('canvas'), gl = canvas.getContext('webgl', { xrCompatible: true });
        session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });
        session.addEventListener('end', function () { msSession = null; ms.hidden = true; });
        return Promise.all([session.requestReferenceSpace('local'), session.requestReferenceSpace('viewer')]).then(function (sp) {
          return session.requestHitTestSource({ space: sp[1] }).then(function (hts) {
            session.requestAnimationFrame(function onFrame(time, frame) {
              session.requestAnimationFrame(onFrame);
              var layer = session.renderState.baseLayer;
              gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
              var hits = frame.getHitTestResults(hts);
              if (hits.length) { var p = hits[0].getPose(sp[0]).transform.position; msCur = { x: p.x, y: p.y, z: p.z }; ms.classList.add('hit'); }
              else { msCur = null; ms.classList.remove('hit'); }
              msSay();
            });
          });
        });
      })
      .catch(function () { $('ar-fail').textContent = t('Kamerayla ölçüm bu telefonda başlatılamadı.'); $('ar-fail').hidden = false; });
  });
  $('ms-a').addEventListener('click', function () { if (msCur) { msA = msCur; $('ms-use').disabled = false; msSay(); } });
  $('ms-use').addEventListener('click', function () {
    if (!msA || !msDist) return;
    var pr = PRODUCTS[state.p];
    if (pr.w) { state.w = clamp(msDist * 1000, pr.w) || state.w; renderControls(); loadModel(); update(); }
    if (msSession) msSession.end();
  });
  $('ms-close').addEventListener('click', function () { if (msSession) msSession.end(); });

  // ---------- Odamda Göster ----------
  var wasInAR = false;
  var UA = navigator.userAgent, ANDROID = /Android/i.test(UA), IOS = /iPhone|iPad|iPod/i.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function afterAR() {
    $('ar-after').classList.add('lit');
    $('ar-wa').textContent = t('Beğendiniz mi? Bu tasarımla ölçü isteyin');
  }
  function sceneViewerURL() {
    var pr = PRODUCTS[state.p], v = state.p === 'karyola' ? state.size
      : pr.presets.reduce(function (a, b) { return Math.abs(b - state.w) < Math.abs(a - state.w) ? b : a; });
    var file = new URL('modeller/' + state.p + '-' + v + '.glb', location.href).href;
    return 'intent://arvr.google.com/scene-viewer/1.0?file=' + encodeURIComponent(file) + '&mode=ar_preferred&resizable=false&title=' + encodeURIComponent('Ladin Ahşap · ' + pr.name) +
      '#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=' + encodeURIComponent(location.href) + ';end;';
  }
  function showMode() {
    if (mv.canActivateAR) return;
    var qrBox = $('ar-qr');
    if (/^https?:/.test(location.protocol) && location.hostname !== 'localhost' && window.qrcode) {
      var qr = qrcode(0, 'L'); qr.addData(shareURL()); qr.make();
      qrBox.innerHTML = qr.createSvgTag({ cellSize: 3, margin: 2, scalable: true });
    } else qrBox.textContent = t('Yayındaki sitede burada QR kod çıkar.');
  }
  $('ar-go').addEventListener('click', function () {
    $('ar-fail').hidden = true;
    // Android'de sayfa içi kamera (WebXR) yoksa model-viewer Google görüntüleyicisine geçer; o da tarayıcıda üretilen modeli açamaz.
    if (ANDROID && !XR) {
      wasInAR = true;
      $('ar-fail').textContent = t('Bu tarayıcı kamerayı sayfa içinde açamadığı için Google görüntüleyicisi açıldı; mobilya en yakın standart modelde ve beyaz görünür. Seçtiğiniz ölçü, renk ve modelle görmek için sayfayı Chrome ile açın.');
      $('ar-fail').hidden = false;
      location.href = sceneViewerURL();
      return;
    }
    if (mv.canActivateAR) { wasInAR = true; mv.activateAR(); return; }
    if (IOS) { $('ar-fail').textContent = t('Kamera için sayfayı Safari ile açın.'); $('ar-fail').hidden = false; return; }
    showMode(); $('ar-desk').hidden = false;
    $('ar-desk').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  mv.addEventListener('load', function () {
    texCache = {};
    applyLook(); placeDims(); showMode();
    if (!mv.dataset.framed) { mv.cameraOrbit = '30deg 78deg 112%'; mv.jumpCameraToGoal(); mv.dataset.framed = '1'; }
  });
  mv.addEventListener('ar-status', function (e) {
    if (e.detail.status === 'session-started') wasInAR = true;
    if (e.detail.status === 'not-presenting' && wasInAR) { afterAR(); $('ar-after').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    if (e.detail.status === 'failed') {
      $('ar-fail').textContent = t(usingBlob
        ? 'Bu telefonda özel ölçü kamerada açılamadı. "Standart" ölçülerden birini seçip tekrar deneyin.'
        : 'Kamera açılamadı. Telefonunuz bu özelliği desteklemiyor olabilir; modeli ekranda çevirip inceleyebilirsiniz.');
      $('ar-fail').hidden = false;
    }
  });
  // iPhone Quick Look ve Android Scene Viewer sayfadan çıkar; geri dönünce sipariş butonunu öne çıkar
  document.addEventListener('visibilitychange', function () { if (!document.hidden && wasInAR) afterAR(); });

  if (!state.w && PRODUCTS[state.p].w) state.w = PRODUCTS[state.p].def;
  renderControls();
  loadModel();
  update();
  setTimeout(function () { if (!mv.canActivateAR && !ANDROID && !IOS) $('ar-go').lastChild.textContent = t('Odamda Göster (telefonda)'); }, 1500);
})();
