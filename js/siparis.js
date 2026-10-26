// Sipariş takip. Kaynak: Google E-Tablo (Dosya → Paylaş → Web'de yayınla → CSV) bağlantısı ya da data/siparisler.json.
// Sütunlar (ilk satır başlık): kod, son4, urun, asama, teslim, not, guncelleme
//   asama: 1 Keşif yapıldı · 2 Çizim onaylandı · 3 Atölyede üretimde · 4 Montaja hazır · 5 Teslim edildi
// Kişisel veri koymayın: ad-soyad ve tam telefon yazılmaz; yalnızca sipariş kodu ve telefonun son 4 hanesi.
var SIPARIS_CSV = ''; // Google E-Tablo CSV bağlantısını buraya yapıştırın

(function () {
  var form = document.getElementById('st-form');
  if (!form) return;
  var $ = function (id) { return document.getElementById(id); };
  var STEPS = ['Keşif yapıldı', 'Çizim onaylandı', 'Atölyede üretimde', 'Montaja hazır', 'Teslim edildi'];

  function parseCSV(text) {
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    var head = (rows.shift() || []).map(function (h) { return h.trim().toLowerCase(); });
    return rows.filter(function (r) { return r.join('').trim(); }).map(function (r) {
      var o = {}; head.forEach(function (h, k) { o[h] = (r[k] || '').trim(); }); return o;
    });
  }
  var data = null;
  function load() {
    if (data) return Promise.resolve(data);
    var src = SIPARIS_CSV ? fetch(SIPARIS_CSV, { cache: 'no-store' }).then(function (r) { return r.text(); }).then(parseCSV)
      : fetch('data/siparisler.json', { cache: 'no-store' }).then(function (r) { return r.json(); });
    return src.then(function (d) { data = d; return d; });
  }
  function fmt(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T12:00:00');
    return isNaN(d) ? iso : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function show(o) {
    var a = Math.max(1, Math.min(5, +o.asama || 1));
    $('st-result').innerHTML =
      '<div class="st-card">' +
      '<div class="st-top"><span class="st-kod">' + esc(o.kod) + '</span><b>' + esc(o.urun) + '</b></div>' +
      '<ol class="st-steps">' + STEPS.map(function (s, i) {
        return '<li class="' + (i + 1 < a ? 'done' : i + 1 === a ? 'now' : '') + '">' + s + (i + 1 === a ? ' <em>şu an</em>' : '') + '</li>';
      }).join('') + '</ol>' +
      (o.teslim && a < 5 ? '<p class="st-eta">Tahmini teslim: <b>' + fmt(o.teslim) + '</b></p>' : '') +
      (o.not ? '<p class="st-note">' + esc(o.not) + '</p>' : '') +
      (o.guncelleme ? '<p class="st-upd">Son güncelleme: ' + fmt(o.guncelleme) + '</p>' : '') +
      '<a class="btn btn-green" target="_blank" rel="noopener" href="https://wa.me/905422683828?text=' +
        encodeURIComponent('Merhaba, ' + o.kod + ' kodlu siparişim hakkında bilgi almak istiyorum.') + '">Siparişim hakkında yazın</a>' +
      '</div>';
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var kod = $('st-kod').value.trim().toUpperCase().replace(/\s/g, ''), son4 = $('st-tel').value.replace(/\D/g, '');
    var err = $('st-err');
    if (!kod || son4.length !== 4) { err.textContent = 'Sipariş kodunu ve telefonunuzun son 4 hanesini yazın.'; err.hidden = false; return; }
    err.hidden = true;
    load().then(function (list) {
      var o = list.filter(function (x) { return String(x.kod).toUpperCase() === kod && String(x.son4) === son4; })[0];
      if (o) show(o);
      else { err.textContent = 'Bu bilgilerle bir sipariş bulamadık. Kodu kontrol edin ya da bize WhatsApp\'tan yazın.'; err.hidden = false; }
    }, function () { err.textContent = 'Sipariş bilgileri şu an yüklenemedi. Biraz sonra tekrar deneyin.'; err.hidden = false; });
  });
})();
