// Evinizde Görün: model-viewer ile gerçek ölçülü gardırop / vestiyer (Android: Scene Viewer / WebXR, iPhone: Quick Look)
(function () {
  var mv = document.getElementById('arv');
  if (!mv) return;
  var $ = function (id) { return document.getElementById(id); };

  var PRODUCTS = {
    gardirop: { name: 'Gardırop / yüklük', widths: [1200, 1800, 2400], def: 1800, h: 2400, d: 600 },
    vestiyer: { name: 'Vestiyer', widths: [1000, 1400], def: 1400, h: 1950, d: 380 }
  };
  var COLORS = { beyaz: 'Beyaz lake', antrasit: 'Antrasit lake', mese: 'Meşe suntalam', ceviz: 'Ceviz suntalam' };
  var state = { p: location.hash === '#vestiyer' ? 'vestiyer' : 'gardirop', w: 0, c: 'beyaz' };
  state.w = PRODUCTS[state.p].def;

  function press(container, active) {
    Array.prototype.forEach.call(container.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', b === active); });
  }
  function renderWidths() {
    var box = $('ar-width'), pr = PRODUCTS[state.p];
    box.className = 'seg ' + (pr.widths.length === 3 ? 'three' : 'two');
    box.innerHTML = pr.widths.map(function (w) {
      return '<button type="button" data-w="' + w + '" aria-pressed="' + (w === state.w) + '">' + w + ' mm</button>';
    }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function () { state.w = +b.dataset.w; press(box, b); update(); });
    });
  }
  function update() {
    var pr = PRODUCTS[state.p];
    mv.src = 'modeller/' + state.p + '-' + state.w + '-' + state.c + '.glb';
    mv.alt = pr.name + ', ' + state.w + ' mm genişlik, ' + COLORS[state.c];
    $('ar-sum').innerHTML =
      '<div><span>Mobilya</span><b>' + pr.name + '</b></div>' +
      '<div><span>Renk</span><b>' + COLORS[state.c] + '</b></div>' +
      '<div><span>Genişlik × Yükseklik</span><b>' + state.w + ' × ' + pr.h + ' mm</b></div>' +
      '<div><span>Derinlik</span><b>' + pr.d + ' mm</b></div>';
    var msg = 'Merhaba, sitenizdeki "Evinizde görün" ile denediğim ' + pr.name.toLowerCase() + ' için ölçü ve fiyat almak istiyorum.\n' +
      'Genişlik: ' + state.w + ' mm\nRenk: ' + COLORS[state.c];
    $('ar-wa').href = 'https://wa.me/905422683828?text=' + encodeURIComponent(msg);
  }

  Array.prototype.forEach.call(document.querySelectorAll('#ar-product button'), function (b) {
    b.setAttribute('aria-pressed', b.dataset.p === state.p);
    b.addEventListener('click', function () {
      state.p = b.dataset.p; state.w = PRODUCTS[state.p].def;
      press($('ar-product'), b); renderWidths(); update();
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('#ar-color button'), function (b) {
    b.addEventListener('click', function () { state.c = b.dataset.c; press($('ar-color'), b); $('ar-cname').textContent = COLORS[state.c]; update(); });
  });

  // Telefonda kamera açılabiliyorsa nasıl kullanılır, açılamıyorsa (bilgisayar) QR kod göster
  function showMode() {
    var can = !!mv.canActivateAR;
    $('ar-how').hidden = !can;
    $('ar-desk').hidden = can;
    if (!can) {
      var qrBox = $('ar-qr');
      if (/^https?:/.test(location.protocol) && window.qrcode && !qrBox.firstChild) {
        var qr = qrcode(0, 'M'); qr.addData(location.href.split('#')[0] + '#' + state.p); qr.make();
        qrBox.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
      } else if (!/^https?:/.test(location.protocol)) {
        qrBox.textContent = 'Site yayına alınınca burada QR kod çıkar.';
      }
    }
  }
  mv.addEventListener('load', showMode);
  mv.addEventListener('ar-status', function (e) {
    if (e.detail.status === 'failed') $('ar-fail').hidden = false;
  });

  renderWidths();
  update();
  setTimeout(showMode, 1500);
})();
