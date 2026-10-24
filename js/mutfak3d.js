// 3D Mutfak Tasarlayıcı (Three.js r128). Birimler metre; ekranda mm gösterilir.
(function () {
  var host = document.getElementById('k3d-canvas');
  if (!host) return;

  function webglOk() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
    catch (e) { return false; }
  }
  if (!window.THREE || !THREE.OrbitControls || !webglOk()) {
    host.innerHTML = '<div class="k3d-fallback">Tarayıcınız 3D görünümü açamadı. Seçimlerinizi yine de yapıp WhatsApp\'tan gönderebilirsiniz.</div>';
  }

  // ---------- Seçenekler ----------
  var TYPES = { duz: 'Düz mutfak', l: 'L mutfak', u: 'U mutfak', ada: 'Ada mutfak' };
  var DOORS = {
    beyaz:    { name: 'Beyaz lake',       color: 0xF1F1EC, rough: 0.55 },
    antrasit: { name: 'Antrasit lake',    color: 0x3B3F46, rough: 0.6 },
    kasmir:   { name: 'Kaşmir membran',   color: 0xDCCFB8, rough: 0.6 },
    adacayi:  { name: 'Adaçayı lake',     color: 0x93A68B, rough: 0.6 },
    gece:     { name: 'Gece mavisi lake', color: 0x34487E, rough: 0.55 },
    bordo:    { name: 'Bordo akrilik',    color: 0x7A2430, rough: 0.15 },
    mese:     { name: 'Meşe suntalam',    wood: ['#D4AE7E', '#A97B4B'], rough: 0.7 },
    ceviz:    { name: 'Ceviz suntalam',   wood: ['#7E5135', '#4E2E1C'], rough: 0.7 }
  };
  var TOPS = { mermer: 'Beyaz mermer desen', granit: 'Siyah granit', mese: 'Meşe tezgah', beton: 'Beton gri' };
  var HANDLES = { gola: 'Gizli profil (kulpsuz)', cubuk: 'Çubuk kulp', dugme: 'Düğme kulp' };

  var state = { type: 'l', main: 3200, side: 2000, island: 1800, door: 'adacayi', top: 'mese', handle: 'gola', upper: true, tall: true };

  // ---------- Özet ve WhatsApp (3D açılmasa da çalışır) ----------
  var $ = function (id) { return document.getElementById(id); };
  function counterLength() {
    var L = state.main / 1000, S = state.side / 1000, D = 0.6;
    if (state.type === 'l') return L + S - D;
    if (state.type === 'u') return L + 2 * (S - D);
    if (state.type === 'ada') return L + state.island / 1000;
    return L;
  }
  function sizeText() {
    if (state.type === 'l' || state.type === 'u') return state.main + ' × ' + state.side + ' mm';
    if (state.type === 'ada') return state.main + ' mm + ada ' + state.island + ' mm';
    return state.main + ' mm';
  }
  var stats = { base: 0, upper: 0 };
  function updateSummary() {
    var m = counterLength().toFixed(1).replace('.', ',');
    $('k-sum').innerHTML =
      '<div><span>Tip</span><b>' + TYPES[state.type] + '</b></div>' +
      '<div><span>Ölçü</span><b>' + sizeText() + '</b></div>' +
      '<div><span>Tezgah</span><b>≈ ' + m + ' m</b></div>' +
      '<div><span>Dolap</span><b>' + (stats.base ? stats.base + ' alt' + (state.upper ? ' · ' + stats.upper + ' üst' : '') + (state.tall ? ' · boy' : '') : '-') + '</b></div>';
    var msg = 'Merhaba, sitenizdeki 3D tasarlayıcıda hazırladığım mutfak için ölçü ve fiyat almak istiyorum.\n' +
      'Tip: ' + TYPES[state.type] + '\nÖlçü: ' + sizeText() + '\nKapak: ' + DOORS[state.door].name +
      '\nTezgah: ' + TOPS[state.top] + '\nKulp: ' + HANDLES[state.handle] +
      '\nÜst dolap: ' + (state.upper ? 'Var' : 'Yok') + ' · Boy dolabı: ' + (state.tall ? 'Var' : 'Yok');
    $('k-wa').href = 'https://wa.me/905422683828?text=' + encodeURIComponent(msg);
    $('n-door').textContent = DOORS[state.door].name;
  }

  var T = window.THREE, has3d = !!(T && T.OrbitControls && webglOk());
  var renderer, scene, camera, controls, root, mats, dirLight;

  // ---------- Ölçüler ----------
  var D = 0.6, UP_D = 0.35, PLINTH = 0.1, BASE_TOP = 0.86, CT = 0.04, UP_Y0 = 1.45, UP_H = 0.72, TALL_H = 2.17;

  // Sabit tohumlu rastgele: dokular her açılışta aynı görünsün
  var seed = 7;
  function rnd() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }

  var texCache = {};
  function canvasTex(key, size, draw, rx, ry, rot) {
    if (texCache[key]) return texCache[key];
    var c = document.createElement('canvas'); c.width = c.height = size;
    draw(c.getContext('2d'), size);
    var t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); t.anisotropy = 4;
    if (rot) { t.center.set(0.5, 0.5); t.rotation = rot; }
    return (texCache[key] = t);
  }
  function woodTex(key, c1, c2, rot) {
    return canvasTex(key, 512, function (g, s) {
      g.fillStyle = c1; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 150; i++) {
        var x = rnd() * s; g.strokeStyle = c2; g.globalAlpha = 0.06 + rnd() * 0.22; g.lineWidth = 0.5 + rnd() * 2.5;
        g.beginPath(); g.moveTo(x, 0);
        for (var y = 0; y <= s; y += 32) g.lineTo(x + Math.sin(y / 70 + i) * 4 + (rnd() - 0.5) * 2, y);
        g.stroke();
      }
      g.globalAlpha = 1;
    }, 1, 1, rot);
  }
  function marbleTex() {
    return canvasTex('mermer', 1024, function (g, s) {
      g.fillStyle = '#F4F3F0'; g.fillRect(0, 0, s, s);
      for (var i = 0; i < 22; i++) {
        g.strokeStyle = 'rgba(118,120,128,' + (0.06 + rnd() * 0.22) + ')'; g.lineWidth = 0.6 + rnd() * 2.4;
        var x = rnd() * s, y = 0; g.beginPath(); g.moveTo(x, y);
        while (y < s) { x += (rnd() - 0.5) * 80; y += 18 + rnd() * 50; g.lineTo(x, y); }
        g.stroke();
      }
    }, 2, 1);
  }
  function speckleTex(key, base, lo, hi, n, rep) {
    return canvasTex(key, 512, function (g, s) {
      g.fillStyle = base; g.fillRect(0, 0, s, s);
      for (var i = 0; i < n; i++) {
        var v = lo + rnd() * (hi - lo) | 0;
        g.fillStyle = 'rgba(' + v + ',' + v + ',' + (v + 4) + ',' + (0.25 + rnd() * 0.5) + ')';
        g.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 2.5, 1 + rnd() * 2.5);
      }
    }, rep, 1);
  }
  function floorTex() {
    return canvasTex('zemin', 512, function (g, s) {
      var tones = ['#D9C3A0', '#D2BA95', '#DDC8A6', '#CDB48D'];
      for (var r = 0; r < 8; r++) {
        var off = (r % 2) * s / 2;
        for (var c = -1; c < 2; c++) {
          g.fillStyle = tones[(r * 3 + c + 4) % 4]; g.fillRect(off + c * s / 2, r * s / 8, s / 2, s / 8);
          for (var k = 0; k < 10; k++) { g.strokeStyle = 'rgba(120,85,45,' + (0.05 + rnd() * 0.1) + ')'; g.lineWidth = 1; var yy = r * s / 8 + rnd() * s / 8; g.beginPath(); g.moveTo(off + c * s / 2, yy); g.lineTo(off + (c + 1) * s / 2, yy + (rnd() - 0.5) * 4); g.stroke(); }
          g.strokeStyle = 'rgba(90,60,30,.25)'; g.lineWidth = 2; g.strokeRect(off + c * s / 2, r * s / 8, s / 2, s / 8);
        }
      }
    }, 7, 7);
  }
  function tileTex() {
    return canvasTex('fayans', 256, function (g, s) {
      g.fillStyle = '#F1EFEA'; g.fillRect(0, 0, s, s);
      g.strokeStyle = 'rgba(0,0,0,.09)'; g.lineWidth = 3;
      for (var r = 0; r < 4; r++) {
        var y = r * s / 4, off = r % 2 ? s / 4 : 0;
        g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke();
        for (var c = 0; c < 3; c++) { var x = off + c * s / 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + s / 4); g.stroke(); }
      }
    }, 6, 2);
  }

  function makeMats() {
    var d = DOORS[state.door], door, carcass;
    if (d.wood) {
      door = new T.MeshStandardMaterial({ map: woodTex('k' + state.door, d.wood[0], d.wood[1]), roughness: d.rough });
      carcass = new T.MeshStandardMaterial({ color: new T.Color(d.wood[1]), roughness: 0.8 });
    } else {
      door = new T.MeshStandardMaterial({ color: d.color, roughness: d.rough, metalness: d.rough < 0.2 ? 0.08 : 0 });
      carcass = new T.MeshStandardMaterial({ color: new T.Color(d.color).multiplyScalar(0.72), roughness: 0.8 });
    }
    var top;
    if (state.top === 'mermer') top = new T.MeshStandardMaterial({ map: marbleTex(), roughness: 0.25 });
    else if (state.top === 'granit') top = new T.MeshStandardMaterial({ map: speckleTex('granit', '#1F2023', 40, 140, 9000, 3), roughness: 0.22 });
    else if (state.top === 'mese') top = new T.MeshStandardMaterial({ map: woodTex('tmese', '#CFA06B', '#A47645', Math.PI / 2), roughness: 0.55 });
    else top = new T.MeshStandardMaterial({ map: speckleTex('beton', '#9EA0A1', 120, 190, 7000, 3), roughness: 0.85 });
    return {
      door: door, carcass: carcass, top: top,
      plinth: new T.MeshStandardMaterial({ color: 0x2A2B2E, roughness: 0.9 }),
      steel: new T.MeshStandardMaterial({ color: 0xC9CDD2, roughness: 0.35, metalness: 0.3 }),
      glass: new T.MeshStandardMaterial({ color: 0x121315, roughness: 0.12, metalness: 0.3 }),
      gola: new T.MeshStandardMaterial({ color: 0x8D9197, roughness: 0.4, metalness: 0.6 }),
      basin: new T.MeshStandardMaterial({ color: 0xA9AEB4, roughness: 0.35, metalness: 0.3 }),
      ring: new T.MeshStandardMaterial({ color: 0x55585E, roughness: 0.6 }),
      wall: new T.MeshStandardMaterial({ color: 0xF3F0EA, roughness: 1 }),
      splash: new T.MeshStandardMaterial({ map: tileTex(), roughness: 0.4 }),
      floor: new T.MeshStandardMaterial({ map: floorTex(), roughness: 0.9 }),
      seat: new T.MeshStandardMaterial({ map: woodTex('tabure', '#B98A5A', '#8A6038'), roughness: 0.6 }),
      dark: new T.MeshStandardMaterial({ color: 0x24262A, roughness: 0.5, metalness: 0.4 })
    };
  }

  // ---------- Yapı taşları ----------
  function box(g, w, h, d, mat, x, y, z, noShadow) {
    var m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (!noShadow) { m.castShadow = true; m.receiveShadow = true; }
    g.add(m); return m;
  }
  function cyl(g, r, h, mat, x, y, z, rotX) {
    var m = new T.Mesh(new T.CylinderGeometry(r, r, h, 20), mat);
    m.position.set(x, y, z); if (rotX) m.rotation.x = rotX; m.castShadow = true; g.add(m); return m;
  }
  function handle(g, x, y, z, horizontal) {
    if (state.handle === 'cubuk') {
      if (horizontal) box(g, 0.18, 0.012, 0.02, mats.steel, x, y, z + 0.012);
      else box(g, 0.012, 0.16, 0.02, mats.steel, x, y, z + 0.012);
    } else if (state.handle === 'dugme') cyl(g, 0.013, 0.025, mats.steel, x, y, z + 0.0125, Math.PI / 2);
  }
  // Kapak/çekmece ön yüzü. side: 'r' kulp sağ kenarda, 'l' solda, 'h' yatay (çekmece). low: kulp alt tarafta (üst dolaplar)
  function front(g, x0, w, y0, y1, side, zf, low) {
    var cx = x0 + w / 2, cy = (y0 + y1) / 2;
    box(g, w - 0.004, y1 - y0 - 0.004, 0.018, mats.door, cx, cy, zf);
    if (state.handle === 'gola') return;
    var hz = zf + 0.009;
    if (side === 'h') handle(g, cx, y1 - 0.05, hz, true);
    else handle(g, side === 'r' ? x0 + w - 0.04 : x0 + 0.04, low ? y0 + 0.1 : y1 - 0.1, hz, false);
  }

  function baseModule(g, x0, w, kind) {
    var cx = x0 + w / 2, zf = D - 0.02 + 0.009, gola = state.handle === 'gola';
    box(g, w, PLINTH, D - 0.06, mats.plinth, cx, PLINTH / 2, (D - 0.06) / 2, true);
    box(g, w, BASE_TOP - PLINTH, D - 0.02, mats.carcass, cx, (BASE_TOP + PLINTH) / 2, (D - 0.02) / 2);
    var y0 = PLINTH + 0.004, y1 = gola ? BASE_TOP - 0.045 : BASE_TOP - 0.004;
    if (gola) box(g, w, 0.035, 0.012, mats.gola, cx, BASE_TOP - 0.024, D - 0.026, true);
    if (kind === 'oven') {
      front(g, x0, w, y0, y0 + 0.16, 'h', zf);
      box(g, w - 0.008, y1 - y0 - 0.17, 0.02, mats.glass, cx, (y0 + 0.16 + y1) / 2, zf + 0.002);
      box(g, w * 0.7, 0.014, 0.02, mats.steel, cx, y1 - 0.05, zf + 0.022);
    } else if (kind === 'drawers') {
      var h = (y1 - y0) / 3;
      for (var i = 0; i < 3; i++) front(g, x0, w, y0 + i * h, y0 + (i + 1) * h, 'h', zf);
    } else if (w > 0.7 && kind !== 'corner') {
      front(g, x0, w / 2, y0, y1, 'r', zf); front(g, x0 + w / 2, w / 2, y0, y1, 'l', zf);
    } else front(g, x0, w, y0, y1, kind === 'corner-r' ? 'l' : 'r', zf);
  }
  function upperModule(g, x0, w, kind) {
    var cx = x0 + w / 2;
    if (kind === 'hood') {
      box(g, Math.min(w * 0.92, 0.9), 0.07, 0.48, mats.steel, cx, UP_Y0 + 0.05, 0.24);
      box(g, 0.28, 2.55 - UP_Y0 - 0.085, 0.25, mats.steel, cx, (UP_Y0 + 0.085 + 2.55) / 2, 0.125);
      return;
    }
    var zf = UP_D - 0.02 + 0.009;
    box(g, w, UP_H, UP_D - 0.02, mats.carcass, cx, UP_Y0 + UP_H / 2, (UP_D - 0.02) / 2);
    if (w > 0.7) { front(g, x0, w / 2, UP_Y0, UP_Y0 + UP_H, 'r', zf, true); front(g, x0 + w / 2, w / 2, UP_Y0, UP_Y0 + UP_H, 'l', zf, true); }
    else front(g, x0, w, UP_Y0, UP_Y0 + UP_H, 'r', zf, true);
  }
  function tallUnit(g, x0) {
    var w = 0.6, cx = x0 + w / 2, zf = D - 0.02 + 0.009, split = PLINTH + 1.3;
    box(g, w, PLINTH, D - 0.06, mats.plinth, cx, PLINTH / 2, (D - 0.06) / 2, true);
    box(g, w, TALL_H - PLINTH, D - 0.02, mats.carcass, cx, (TALL_H + PLINTH) / 2, (D - 0.02) / 2);
    front(g, x0, w, PLINTH + 0.004, split, 'r', zf);
    front(g, x0, w, split, TALL_H, 'r', zf, true);
  }
  function sink(g, cx) {
    var y = BASE_TOP + CT;
    box(g, 0.54, 0.006, 0.42, mats.basin, cx, y + 0.003, 0.31, true);
    box(g, 0.46, 0.004, 0.34, mats.dark, cx, y + 0.007, 0.32, true);
    cyl(g, 0.015, 0.3, mats.steel, cx, y + 0.15, 0.08);
    box(g, 0.022, 0.022, 0.2, mats.steel, cx, y + 0.29, 0.17);
  }
  function hob(g, cx) {
    var y = BASE_TOP + CT;
    box(g, 0.58, 0.008, 0.5, mats.glass, cx, y + 0.004, 0.3, true);
    [[-0.13, -0.11], [0.13, -0.11], [-0.13, 0.12], [0.13, 0.12]].forEach(function (p, i) {
      var r = new T.Mesh(new T.TorusGeometry(i % 3 ? 0.06 : 0.08, 0.005, 6, 32), mats.ring);
      r.rotation.x = Math.PI / 2; r.position.set(cx + p[0], y + 0.009, 0.3 + p[1]); g.add(r);
    });
  }
  function stool(g, x, z) {
    cyl(g, 0.17, 0.05, mats.seat, x, 0.66, z);
    cyl(g, 0.022, 0.62, mats.dark, x, 0.33, z);
    cyl(g, 0.2, 0.02, mats.dark, x, 0.01, z);
  }

  // Bir dolap dizisi. Yerel eksen: dizi +X boyunca, sırt z=0, ön z=D
  function buildRun(len, o) {
    var g = new T.Group();
    var tallW = o.tall ? 0.6 : 0, avail = len - tallW;
    var n = Math.max(1, Math.round(avail / 0.6)), w = avail / n;
    for (var i = 0; i < n; i++) {
      var x0 = i * w;
      var corner = (i === 0 && o.cornerStart) || (i === n - 1 && o.cornerEnd);
      var kind = i === o.ovenIdx ? 'oven' : i === o.drawerIdx ? 'drawers' : corner ? (i === 0 ? 'corner' : 'corner-r') : 'door';
      baseModule(g, x0, w, kind);
      stats.base++;
      if (i === o.sinkIdx) sink(g, x0 + w / 2);
      if (i === o.ovenIdx) hob(g, x0 + w / 2);
      if (o.upper) { upperModule(g, x0, w, i === o.ovenIdx ? 'hood' : 'door'); if (i !== o.ovenIdx) stats.upper++; }
    }
    if (o.upper && o.upperExtendEnd) upperModule(g, avail, o.upperExtendEnd, 'door');
    if (o.upper && o.upperExtendStart) upperModule(g, -o.upperExtendStart, o.upperExtendStart, 'door');
    if (o.tall) tallUnit(g, avail);
    if (o.island) {
      box(g, avail + 0.1, CT, D + 0.32, mats.top, avail / 2, BASE_TOP + CT / 2, (D + 0.02 - 0.3) / 2);
    } else {
      box(g, avail, CT, D + 0.02, mats.top, avail / 2, BASE_TOP + CT / 2, (D + 0.02) / 2);
      var sh = (o.upper ? UP_Y0 : BASE_TOP + CT + 0.6) - (BASE_TOP + CT);
      box(g, avail, sh, 0.01, mats.splash, avail / 2, BASE_TOP + CT + sh / 2, 0.005, true);
    }
    return g;
  }

  function label(text) {
    var c = document.createElement('canvas'); c.width = 320; c.height = 80;
    var g = c.getContext('2d');
    g.beginPath(); g.moveTo(40, 4); g.arcTo(316, 4, 316, 76, 36); g.arcTo(316, 76, 4, 76, 36); g.arcTo(4, 76, 4, 4, 36); g.arcTo(4, 4, 316, 4, 36); g.closePath();
    g.fillStyle = 'rgba(255,255,255,.94)'; g.fill(); g.strokeStyle = '#4C9A2A'; g.lineWidth = 4; g.stroke();
    g.fillStyle = '#2F6E16'; g.font = '600 36px "JetBrains Mono", Consolas, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 160, 42);
    var s = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), depthTest: false, transparent: true }));
    s.scale.set(0.56, 0.14, 1); s.renderOrder = 10; return s;
  }
  function dim(a, b, text) {
    var line = new T.Line(new T.BufferGeometry().setFromPoints([a, b]), new T.LineBasicMaterial({ color: 0x4C9A2A }));
    root.add(line);
    var s = label(text); s.position.copy(a).lerp(b, 0.5); s.position.y = 0.08; root.add(s);
  }

  function clearRoot() {
    root.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.isSprite) { o.material.map.dispose(); o.material.dispose(); }
      else if (o.material) o.material.dispose();
    });
    while (root.children.length) root.remove(root.children[0]);
  }

  function build() {
    if (!has3d) { stats = { base: 0, upper: 0 }; updateSummary(); return; }
    clearRoot();
    stats = { base: 0, upper: 0 };
    mats = makeMats();
    var t = state.type, L = state.main / 1000, S = state.side / 1000, I = state.island / 1000;
    var side = t === 'l' || t === 'u';

    // Zemin ve duvarlar
    var floor = new T.Mesh(new T.PlaneGeometry(14, 14), mats.floor);
    floor.rotation.x = -Math.PI / 2; floor.position.set(L / 2, 0, 2.5); floor.receiveShadow = true; root.add(floor);
    var bx0 = side ? -0.06 : -0.7, bx1 = t === 'u' ? L + 0.06 : L + 0.7;
    box(root, bx1 - bx0, 2.6, 0.06, mats.wall, (bx0 + bx1) / 2, 1.3, -0.03, true).receiveShadow = true;
    if (side) box(root, 0.06, 2.6, S + 0.9, mats.wall, -0.03, 1.3, (S + 0.9) / 2 - 0.06, true).receiveShadow = true;
    if (t === 'u') box(root, 0.06, 2.6, S + 0.9, mats.wall, L + 0.03, 1.3, (S + 0.9) / 2 - 0.06, true).receiveShadow = true;

    // Ana duvar
    var tallMain = state.tall && t !== 'u';
    var n = Math.max(1, Math.round((L - (tallMain ? 0.6 : 0)) / 0.6));
    var cs = side, ce = t === 'u';
    var first = cs ? 1 : 0, last = n - 1 - (ce ? 1 : 0);
    var sinkIdx = Math.min(last, Math.max(first, Math.floor(n * 0.35)));
    var ovenIdx = Math.min(last, Math.floor(n * 0.7));
    if (ovenIdx === sinkIdx) ovenIdx = sinkIdx + 1 <= last ? sinkIdx + 1 : -1;
    var drawerIdx = -1;
    for (var k = first; k <= last; k++) if (k !== sinkIdx && k !== ovenIdx) { drawerIdx = k; break; }
    root.add(buildRun(L, { upper: state.upper, tall: tallMain, sinkIdx: sinkIdx, ovenIdx: ovenIdx, drawerIdx: drawerIdx, cornerStart: cs, cornerEnd: ce }));

    // Yan duvarlar
    if (side) {
      var len = Math.max(0.6, S - D);
      var left = buildRun(len, { upper: state.upper, drawerIdx: Math.floor(Math.round(len / 0.6) / 2), upperExtendEnd: D - UP_D });
      left.rotation.y = Math.PI / 2; left.position.set(0, 0, D + len); root.add(left);
      dim(new T.Vector3(D + 0.35, 0.005, 0), new T.Vector3(D + 0.35, 0.005, D + len), state.side + ' mm');
    }
    if (t === 'u') {
      var len2 = Math.max(0.6, S - D);
      var right = buildRun(len2, { upper: state.upper, tall: state.tall && len2 >= 1.2, drawerIdx: 0, upperExtendStart: D - UP_D });
      right.rotation.y = -Math.PI / 2; right.position.set(L, 0, D); root.add(right);
      dim(new T.Vector3(L - D - 0.35, 0.005, 0), new T.Vector3(L - D - 0.35, 0.005, D + len2), state.side + ' mm');
    }
    // Ada
    if (t === 'ada') {
      var isl = buildRun(I, { island: true, drawerIdx: 0 });
      isl.rotation.y = Math.PI; isl.position.set(L / 2 + I / 2, 0, 2.3); root.add(isl);
      var cnt = Math.max(1, Math.floor(I / 0.55));
      for (var s = 0; s < cnt; s++) stool(root, L / 2 - I / 2 + (s + 0.5) * I / cnt, 2.78);
      dim(new T.Vector3(L / 2 - I / 2, 0.005, 1.45), new T.Vector3(L / 2 + I / 2, 0.005, 1.45), state.island + ' mm');
    }
    var zMain = side ? S + 0.35 : t === 'ada' ? 3.15 : D + 0.35;
    dim(new T.Vector3(0, 0.005, zMain), new T.Vector3(L, 0.005, zMain), state.main + ' mm');

    dirLight.position.set(L / 2 + 2.5, 5.5, 4.5);
    dirLight.target.position.set(L / 2, 0.8, 1);
    updateSummary();
    render();
  }

  // ---------- Kamera ----------
  var tween = null;
  function frame(view, animate) {
    if (!has3d) return;
    var L = state.main / 1000, t = state.type;
    var depth = t === 'l' || t === 'u' ? state.side / 1000 : t === 'ada' ? 2.9 : D;
    var c = new T.Vector3(L / 2, 1.0, depth / 2 + 0.45);
    var span = Math.max(L, depth, 2.4), pos;
    if (view === 'front') pos = new T.Vector3(L / 2, 1.5, c.z + span * 1.55 + 1.4);
    else if (view === 'top') pos = new T.Vector3(L / 2, span * 1.7 + 1.6, c.z + 0.02);
    else pos = new T.Vector3(L / 2 + span * (t === 'u' ? 0.35 : 0.7), 2.6 + span * 0.42, c.z + span * 1.45 + 1.3);
    var aspect = camera.aspect;
    if (aspect < 1.1) pos.sub(c).multiplyScalar(1.15 / Math.max(aspect, 0.55)).add(c);
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!animate || reduce) { camera.position.copy(pos); controls.target.copy(c); controls.update(); render(); return; }
    var p0 = camera.position.clone(), c0 = controls.target.clone(), t0 = performance.now();
    if (tween) cancelAnimationFrame(tween);
    (function step(now) {
      var k = Math.min(1, (now - t0) / 500), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      camera.position.lerpVectors(p0, pos, e); controls.target.lerpVectors(c0, c, e); controls.update(); render();
      if (k < 1) tween = requestAnimationFrame(step);
    })(t0);
  }

  function render() { if (renderer) renderer.render(scene, camera); }
  function paperColor() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
    try { return new T.Color(v || '#F5F7FA'); } catch (e) { return new T.Color('#F5F7FA'); }
  }

  if (has3d) {
    renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);
    scene = new T.Scene(); scene.background = paperColor();
    camera = new T.PerspectiveCamera(40, 1, 0.05, 60);
    scene.add(new T.HemisphereLight(0xffffff, 0xB9B1A5, 0.62));
    scene.add(new T.AmbientLight(0xffffff, 0.14));
    dirLight = new T.DirectionalLight(0xffffff, 0.72);
    dirLight.castShadow = true;
    var sm = Math.min(window.innerWidth, 2000) < 700 ? 1024 : 2048;
    dirLight.shadow.mapSize.set(sm, sm);
    var sc = dirLight.shadow.camera; sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6; sc.near = 0.5; sc.far = 20;
    dirLight.shadow.bias = -0.0004; dirLight.shadow.radius = 3;
    scene.add(dirLight); scene.add(dirLight.target);
    root = new T.Group(); scene.add(root);
    controls = new T.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false; controls.screenSpacePanning = true;
    controls.minDistance = 1.2; controls.maxDistance = 14; controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.addEventListener('change', render);

    var resize = function () {
      var w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); render();
    };
    if (window.ResizeObserver) new ResizeObserver(resize).observe(host); else window.addEventListener('resize', resize);
    resize();
    if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { scene.background = paperColor(); render(); });
  }

  // ---------- Kontroller ----------
  function pressIn(groupId, btn) {
    Array.prototype.forEach.call(document.querySelectorAll('#' + groupId + ' button'), function (b) { b.setAttribute('aria-pressed', b === btn); });
  }
  function bindGroup(groupId, attr, key, after) {
    Array.prototype.forEach.call(document.querySelectorAll('#' + groupId + ' button'), function (b) {
      b.addEventListener('click', function () { state[key] = b.getAttribute(attr); pressIn(groupId, b); build(); if (after) after(); });
    });
  }
  function syncRows() {
    $('row-side').hidden = !(state.type === 'l' || state.type === 'u');
    $('row-island').hidden = state.type !== 'ada';
  }
  bindGroup('k-type', 'data-type', 'type', function () { syncRows(); frame(currentView, true); });
  bindGroup('k-door', 'data-door', 'door');
  bindGroup('k-top', 'data-top', 'top');
  bindGroup('k-handle', 'data-handle', 'handle');

  var pending = false;
  function rebuildSoon() { if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; build(); }); }
  [['k-main', 'main', 'o-main'], ['k-side', 'side', 'o-side'], ['k-island', 'island', 'o-island']].forEach(function (r) {
    var input = $(r[0]);
    input.addEventListener('input', function () { state[r[1]] = +input.value; $(r[2]).textContent = input.value + ' mm'; rebuildSoon(); });
    input.addEventListener('change', function () { frame(currentView, true); });
  });
  $('k-upper').addEventListener('change', function () { state.upper = this.checked; build(); });
  $('k-tall').addEventListener('change', function () { state.tall = this.checked; build(); });

  var currentView = '3d';
  Array.prototype.forEach.call(document.querySelectorAll('.k3d-views button'), function (b) {
    b.addEventListener('click', function () {
      currentView = b.dataset.view;
      Array.prototype.forEach.call(document.querySelectorAll('.k3d-views button'), function (x) { x.setAttribute('aria-pressed', x === b); });
      frame(currentView, true);
    });
  });

  var png = $('k-png');
  if (has3d) png.addEventListener('click', function () { render(); png.href = renderer.domElement.toDataURL('image/png'); });
  else png.hidden = true;

  syncRows();
  build();
  frame('3d', false);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
})();
