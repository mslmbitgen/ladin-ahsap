// Odanızda Görün: gerçek ölçülü gardırop / vestiyer. Renk ve kulp modelin malzemelerinde canlı değişir;
// Android'de (WebXR) kamera açıkken de üstteki seçim çubuğu görünür ve çalışır.
(function () {
  var mv = document.getElementById('arv');
  if (!mv) return;
  var $ = function (id) { return document.getElementById(id); };

  // Ürün: ad, ölçü seçenekleri [dosya anahtarı, etiket], varsayılan, G × Y × D (mm) metni
  var cm = function (list) { return list.map(function (w) { return [String(w), w / 10 + ' cm']; }); };
  var PRODUCTS = {
    mutfak:   { name: 'Mutfak dolabı', opts: cm([1800, 2400, 3000, 3600]), def: '2400', dims: function (v) { return v + ' × 2170 × 600'; } },
    gardirop: { name: 'Gardırop', opts: cm([1200, 1800, 2400]), def: '1800', dims: function (v) { return v + ' × 2400 × 600'; } },
    vestiyer: { name: 'Vestiyer', opts: cm([1000, 1400]), def: '1400', dims: function (v) { return v + ' × 1950 × 380'; } },
    karyola:  { name: 'Karyola', opts: [['90x190', '90×190'], ['100x200', '100×200'], ['120x200', '120×200'], ['160x200', '160×200']], def: '100x200',
                dims: function (v) { var p = v.split('x'); return (p[0] * 10 + 60) + ' × 1000 × ' + (p[1] * 10 + 60) + ' (yatak ' + p[0] + '×' + p[1] + ' cm)'; } },
    masa:     { name: 'Çalışma masası', opts: cm([1200, 1600]), def: '1200', dims: function (v) { return v + ' × 2000 × 600'; } },
    tv:       { name: 'TV ünitesi', opts: cm([1800, 2400]), def: '2400', dims: function (v) { return v + ' × 1900 × 420'; } },
    banyo:    { name: 'Banyo dolabı', opts: cm([800, 1000]), def: '800', dims: function (v) { return v + ' × 1900 × 460'; } }
  };
  // ad, renk, pürüzlülük (düşük = parlak)
  var COLORS = {
    beyaz: ['Beyaz lake', '#F1F1EC', 0.55], kasmir: ['Kaşmir', '#DCCFB8', 0.6], antrasit: ['Antrasit', '#3B3F46', 0.6],
    adacayi: ['Adaçayı', '#93A68B', 0.6], gece: ['Gece mavisi', '#34487E', 0.55], bordo: ['Bordo akrilik', '#7A2430', 0.18],
    mese: ['Meşe', '#C9A06E', 0.7], ceviz: ['Ceviz', '#6B4429', 0.7]
  };
  var HANDLES = { cubuk: 'Çubuk kulp', dugme: 'Düğme kulp', yok: 'Kulpsuz' };
  var fromHash = location.hash.slice(1);
  var state = { p: PRODUCTS[fromHash] ? fromHash : 'gardirop', w: '', c: 'beyaz', h: 'cubuk' };
  state.w = PRODUCTS[state.p].def;

  function linear(hex, k) {
    return [1, 3, 5].map(function (i) {
      var v = parseInt(hex.slice(i, i + 2), 16) / 255 * (k || 1);
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }).concat(1);
  }
  function press(container, attr, value) {
    Array.prototype.forEach.call(container.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', b.getAttribute(attr) === String(value)); });
  }

  // Seçilen rengi ve kulbu yüklü modele uygula
  function applyLook() {
    if (!mv.model) return;
    var M = {};
    mv.model.materials.forEach(function (m) { M[m.name] = m; });
    var c = COLORS[state.c];
    if (M.kapak) { M.kapak.pbrMetallicRoughness.setBaseColorFactor(linear(c[1])); M.kapak.pbrMetallicRoughness.setRoughnessFactor(c[2]); }
    if (M.govde) M.govde.pbrMetallicRoughness.setBaseColorFactor(linear(c[1], 0.78));
    ['cubuk', 'dugme'].forEach(function (k) {
      var m = M['kulp-' + k];
      if (!m) return;
      var on = state.h === k;
      m.setAlphaMode(on ? 'OPAQUE' : 'BLEND');
      m.pbrMetallicRoughness.setBaseColorFactor(on ? [0.6, 0.62, 0.65, 1] : [0, 0, 0, 0]);
    });
  }

  function update() {
    var pr = PRODUCTS[state.p], c = COLORS[state.c];
    var label = pr.opts.filter(function (o) { return o[0] === state.w; })[0][1];
    $('ar-cname').textContent = c[0] + ' · ' + HANDLES[state.h];
    $('ar-sum').innerHTML =
      '<div><span>Ölçü (G × Y × D, mm)</span><b>' + pr.dims(state.w) + '</b></div>' +
      '<div><span>Seçim</span><b>' + pr.name + ' · ' + c[0] + ' · ' + HANDLES[state.h] + '</b></div>';
    var msg = 'Merhaba, sitenizde odamda denediğim ' + pr.name.toLowerCase() + ' için ölçü ve fiyat almak istiyorum.\n' +
      'Ölçü: ' + label + '\nRenk: ' + c[0] + '\nKulp: ' + HANDLES[state.h];
    $('ar-wa').href = 'https://wa.me/905422683828?text=' + encodeURIComponent(msg);
    mv.alt = pr.name + ', ' + label + ', ' + c[0] + ', ' + HANDLES[state.h];
  }
  function loadModel() {
    var src = 'modeller/' + state.p + '-' + state.w + '.glb';
    if (mv.getAttribute('src') !== src) mv.setAttribute('src', src); else applyLook();
  }
  function renderWidths() {
    var box = $('ar-width'), pr = PRODUCTS[state.p];
    box.className = 'seg ' + (['', '', 'two', 'three', ''][pr.opts.length] || '');
    box.innerHTML = pr.opts.map(function (o) {
      return '<button type="button" data-w="' + o[0] + '" aria-pressed="' + (o[0] === state.w) + '">' + o[1] + '</button>';
    }).join('');
  }
  function renderProducts() {
    $('ar-product').innerHTML = Object.keys(PRODUCTS).map(function (k) {
      return '<button type="button" data-p="' + k + '" aria-pressed="' + (k === state.p) + '">' + PRODUCTS[k].name + '</button>';
    }).join('');
  }

  $('ar-product').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    state.p = b.dataset.p; state.w = PRODUCTS[state.p].def;
    press($('ar-product'), 'data-p', state.p); renderWidths(); loadModel(); update();
  });
  $('ar-width').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    state.w = b.dataset.w; press($('ar-width'), 'data-w', state.w); loadModel(); update();
  });
  $('ar-color').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    state.c = b.dataset.c; press($('ar-color'), 'data-c', state.c); applyLook(); update();
  });
  $('ar-handle').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    state.h = b.dataset.h; press($('ar-handle'), 'data-h', state.h); applyLook(); update();
  });

  // Bilgisayarda kamera yok: QR kodla telefona geçir
  function showMode() {
    var can = !!mv.canActivateAR;
    $('ar-desk').hidden = can;
    if (can) return;
    var qrBox = $('ar-qr');
    if (qrBox.firstChild) return;
    if (/^https?:/.test(location.protocol) && location.hostname !== 'localhost' && window.qrcode) {
      var qr = qrcode(0, 'M'); qr.addData(location.href.split('#')[0] + '#' + state.p); qr.make();
      qrBox.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
    } else qrBox.textContent = 'Yayındaki sitede burada QR kod çıkar.';
  }
  // Alttaki seçim çubuğu modeli örtmesin: hedefi aşağı alıp modeli yukarı kaydır
  function frame() {
    var d = mv.getDimensions();
    mv.cameraTarget = 'auto ' + (d.y * 0.36).toFixed(2) + 'm auto';
    mv.cameraOrbit = '30deg 78deg 108%';
    mv.jumpCameraToGoal();
  }
  mv.addEventListener('load', function () { applyLook(); frame(); showMode(); });
  mv.addEventListener('ar-status', function (e) { if (e.detail.status === 'failed') $('ar-fail').hidden = false; });

  renderProducts();
  renderWidths();
  loadModel();
  update();
  setTimeout(showMode, 1500);
})();
