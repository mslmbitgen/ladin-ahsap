function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

// Birden çok seçenekten birini işaretler
function pressOne(buttons, active) {
  buttons.forEach(function (x) { x.setAttribute('aria-pressed', x === active); });
}

// Mobil menü
var menuBtn = $('#menu-btn'), nav = $('#nav');
if (menuBtn && nav) {
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  });
}

// Kapak rengi (ana sayfa çizimi)
var drawing = $('#drawing');
if (drawing) {
  var swatches = $$('.swatch', drawing), doorName = $('#door-name');
  swatches.forEach(function (b) {
    b.addEventListener('click', function () {
      pressOne(swatches, b);
      drawing.style.setProperty('--door', b.dataset.door);
      drawing.style.setProperty('--door-line', b.dataset.line);
      doorName.textContent = 'Kapak: ' + b.dataset.name;
    });
  });
}

// Proje filtresi
var filterBtns = $$('.filters button'), projects = $$('#projects .proj');
filterBtns.forEach(function (b) {
  b.addEventListener('click', function () {
    pressOne(filterBtns, b);
    projects.forEach(function (p) { p.hidden = !(b.dataset.f === 'all' || p.dataset.cat === b.dataset.f); });
  });
});

// Mutfak tipi seçici (mutfak sayfası)
var planBox = $('#plan');
if (planBox) {
  var planBtns = $$('.plan-tabs button'), plans = $$('.plan-svg g[data-plan]'), notes = $$('.plan-note');
  planBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      pressOne(planBtns, b);
      plans.forEach(function (g) { g.style.display = g.dataset.plan === b.dataset.plan ? '' : 'none'; });
      notes.forEach(function (n) { n.hidden = n.dataset.plan !== b.dataset.plan; });
      var wa = $('#plan-wa');
      if (wa) wa.href = 'https://wa.me/905422683828?text=' + encodeURIComponent('Merhaba, ' + b.dataset.name + ' için ölçü ve fiyat almak istiyorum.');
    });
  });
}

// Fotoğraf önizleme ve teklif formu (ana sayfa)
var form = $('#teklif');
if (form) {
  var foto = $('#f-foto'), thumbs = $('#thumbs');
  foto.addEventListener('change', function () {
    thumbs.innerHTML = '';
    Array.prototype.slice.call(foto.files, 0, 6).forEach(function (f) {
      var img = document.createElement('img');
      img.alt = f.name;
      img.src = URL.createObjectURL(f);
      thumbs.appendChild(img);
    });
  });

  // Alt sayfadan gelindiyse hizmeti seçili getir (index.html#iletisim-mutfak gibi)
  var pre = { 'iletisim-mutfak': 0, 'iletisim-yukluk': 1, 'iletisim-vestiyer': 2, 'iletisim-cocuk': 3 }[location.hash.slice(1)];
  if (pre !== undefined) { $('#f-hizmet').selectedIndex = pre; $('#iletisim').scrollIntoView(); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = function (id) { return $('#' + id).value.trim(); };
    var err = $('#err'), out = $('#sonuc');
    if (!v('f-ad') || v('f-tel').replace(/\D/g, '').length < 10) {
      err.textContent = 'Adınızı ve 10 haneli telefon numaranızı yazın.';
      err.hidden = false; out.hidden = true; return;
    }
    err.hidden = true;
    var msg = 'Merhaba, ' + v('f-hizmet').toLowerCase() + ' için teklif almak istiyorum.\n' +
              'Ad: ' + v('f-ad') + '\nTelefon: ' + v('f-tel') + '\nYer: ' + v('f-yer') +
              (v('f-not') ? '\nNot: ' + v('f-not') : '');
    out.innerHTML = '';
    var p = document.createElement('p');
    p.style.marginBottom = '10px';
    p.textContent = foto.files.length
      ? 'Mesajınız hazır. WhatsApp açılınca seçtiğiniz fotoğrafları sohbete ekleyip gönderin.'
      : 'Mesajınız hazır. Göndermek için WhatsApp\'ı açın.';
    var a = document.createElement('a');
    a.href = 'https://wa.me/905422683828?text=' + encodeURIComponent(msg);
    a.target = '_blank'; a.rel = 'noopener'; a.className = 'btn btn-blue';
    a.textContent = 'WhatsApp\'ta aç ve gönder';
    out.append(p, a);
    out.hidden = false;
  });
}

// Galeri büyütme: proje kartına dokununca büyük görünüm (fotoğraf yoksa renk dokusu)
var tiles = $$('.proj');
if (tiles.length && window.HTMLDialogElement) {
  var lb = document.createElement('dialog');
  lb.className = 'lb';
  lb.setAttribute('aria-label', 'Proje görseli');
  lb.innerHTML = '<button class="lb-close" aria-label="Kapat">×</button><div class="lb-view"></div>' +
    '<div class="lb-cap"><div><b></b><span></span></div><div class="lb-nav"><button data-d="-1" aria-label="Önceki">←</button><button data-d="1" aria-label="Sonraki">→</button></div></div>';
  document.body.appendChild(lb);
  var view = $('.lb-view', lb), current = 0;

  var visible = function () { return tiles.filter(function (t) { return !t.hidden; }); };
  var show = function (t) {
    var list = visible();
    current = list.indexOf(t);
    var img = $('img', t);
    view.className = 'lb-view ' + Array.prototype.filter.call(t.classList, function (c) { return c.indexOf('t-') === 0; }).join(' ');
    view.innerHTML = img ? '<img src="' + img.getAttribute('src') + '" alt="' + (img.alt || '') + '">' : '';
    $('.lb-cap b', lb).textContent = $('.tag b', t).textContent;
    $('.lb-cap span', lb).textContent = $('.tag', t).lastChild.textContent + '  ·  ' + (current + 1) + ' / ' + list.length;
    if (!lb.open) lb.showModal();
  };
  var step = function (d) { var list = visible(); show(list[(current + d + list.length) % list.length]); };

  tiles.forEach(function (t) {
    t.tabIndex = 0;
    t.setAttribute('role', 'button');
    t.addEventListener('click', function () { show(t); });
    t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(t); } });
  });
  $('.lb-close', lb).addEventListener('click', function () { lb.close(); });
  $$('.lb-nav button', lb).forEach(function (b) { b.addEventListener('click', function () { step(+b.dataset.d); }); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });
}
