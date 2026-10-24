// Gerçek ölçülü mobilya modeli (GLB) üretici. Hem tarayıcıda (özel ölçü) hem Node'da (araclar/ar-modeller.js) çalışır.
// Birim metre; orijin alt-orta, sırt z=0, ön yüz +Z. Malzeme adları js/ar.js ile ortak:
// kapak, govde, baza, kulp-cubuk, kulp-dugme (gizli başlar), tezgah, celik, cam, ayna, yatak, yastik, lavabo, askilik
(function (root) {
  var FACES = [ // normal, 4 köşe, doku ekseni (u, v)
    [[1, 0, 0], [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]], [2, 1]],
    [[-1, 0, 0], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], [2, 1]],
    [[0, 1, 0], [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], [0, 2]],
    [[0, -1, 0], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], [0, 2]],
    [[0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], [0, 1]],
    [[0, 0, -1], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], [0, 1]]
  ];
  function lin(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function rgb(hex) { return [1, 3, 5].map(function (i) { return lin(parseInt(hex.slice(i, i + 2), 16) / 255); }); }
  function darker(hex, k) { return '#' + [1, 3, 5].map(function (i) { return ('0' + Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16)).slice(-2); }).join(''); }

  function Model() { this.groups = {}; this.order = []; }
  Model.prototype.mat = function (name, hex, rough, metal, hidden) {
    if (!this.groups[name]) { this.groups[name] = { hex: hex, rough: rough, metal: metal, hidden: hidden, boxes: [] }; this.order.push(name); }
  };
  Model.prototype.box = function (m, w, h, d, x, y, z) { this.groups[m].boxes.push([w, h, d, x, y, z]); };

  function toGLB(mdl) {
    var json = { asset: { version: '2.0', generator: 'Ladin Ahşap' }, scene: 0, scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0, name: 'mobilya' }], meshes: [{ primitives: [] }], materials: [], accessors: [], bufferViews: [], buffers: [] };
    var chunks = [], offset = 0;
    function addView(arr, target) {
      var bytes = new Uint8Array(arr.buffer);
      chunks.push(bytes); json.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length, target: target });
      offset += bytes.length; return json.bufferViews.length - 1;
    }
    mdl.order.forEach(function (name) {
      var g = mdl.groups[name];
      if (!g.boxes.length) return;
      var pos = [], nor = [], uv = [], idx = [];
      g.boxes.forEach(function (b) {
        var w = b[0], h = b[1], d = b[2], x = b[3], y = b[4], z = b[5];
        FACES.forEach(function (f) {
          var base = pos.length / 3;
          f[1].forEach(function (c) {
            var p = [x + c[0] * w / 2, y + c[1] * h / 2, z + c[2] * d / 2];
            pos.push(p[0], p[1], p[2]); nor.push(f[0][0], f[0][1], f[0][2]);
            uv.push(p[f[2][0]], 1 - p[f[2][1]]);
          });
          idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        });
      });
      var min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
      for (var i = 0; i < pos.length; i++) { min[i % 3] = Math.min(min[i % 3], pos[i]); max[i % 3] = Math.max(max[i % 3], pos[i]); }
      var pv = addView(new Float32Array(pos), 34962), nv = addView(new Float32Array(nor), 34962);
      var tv = addView(new Float32Array(uv), 34962), iv = addView(new Uint32Array(idx), 34963);
      json.accessors.push({ bufferView: pv, componentType: 5126, count: pos.length / 3, type: 'VEC3', min: min, max: max });
      json.accessors.push({ bufferView: nv, componentType: 5126, count: nor.length / 3, type: 'VEC3' });
      json.accessors.push({ bufferView: tv, componentType: 5126, count: uv.length / 2, type: 'VEC2' });
      json.accessors.push({ bufferView: iv, componentType: 5125, count: idx.length, type: 'SCALAR' });
      var a = json.accessors.length, col = rgb(g.hex);
      var mat = { name: name, pbrMetallicRoughness: { baseColorFactor: [col[0], col[1], col[2], g.hidden ? 0 : 1], metallicFactor: g.metal, roughnessFactor: g.rough } };
      if (g.hidden) mat.alphaMode = 'BLEND';
      json.materials.push(mat);
      json.meshes[0].primitives.push({ attributes: { POSITION: a - 4, NORMAL: a - 3, TEXCOORD_0: a - 2 }, indices: a - 1, material: json.materials.length - 1 });
    });
    var binLen = offset, binPad = (4 - binLen % 4) % 4;
    json.buffers.push({ byteLength: binLen });
    var js = new TextEncoder().encode(JSON.stringify(json)), jsPad = (4 - js.length % 4) % 4;
    var total = 12 + 8 + js.length + jsPad + 8 + binLen + binPad;
    var out = new Uint8Array(total), dv = new DataView(out.buffer), o = 0;
    dv.setUint32(0, 0x46546C67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true); o = 12;
    dv.setUint32(o, js.length + jsPad, true); dv.setUint32(o + 4, 0x4E4F534A, true); o += 8;
    out.set(js, o); o += js.length; for (var p = 0; p < jsPad; p++) out[o++] = 0x20;
    dv.setUint32(o, binLen + binPad, true); dv.setUint32(o + 4, 0x004E4942, true); o += 8;
    chunks.forEach(function (c) { out.set(c, o); o += c.length; });
    return out;
  }

  // ---------- Yardımcılar ----------
  var BASE = '#F1F1EC';
  function common(m) {
    m.mat('kapak', BASE, 0.55, 0);
    m.mat('govde', darker(BASE, 0.78), 0.8, 0);
    m.mat('baza', '#2A2B2E', 0.9, 0);
    m.mat('kulp-cubuk', '#C9CDD2', 0.35, 0.6);
    m.mat('kulp-dugme', '#C9CDD2', 0.35, 0.6, true);
  }
  function fixed(m) { m.mat('celik', '#C9CDD2', 0.35, 0.6); m.mat('cam', '#141518', 0.15, 0.3); }
  function kulp(m, x, y, z, vertical, len) {
    if (vertical) m.box('kulp-cubuk', 0.012, len, 0.02, x, y, z); else m.box('kulp-cubuk', len, 0.012, 0.02, x, y, z);
    m.box('kulp-dugme', 0.026, 0.026, 0.024, x, y, z);
  }
  // Kapak; hk: 'hc' yatay kulp ortada, 'r'/'l' dikey kulp sağ/sol kenarda
  function door(m, w, h, x, y, zf, hk, kulpY) {
    var g = 0.006, T = 0.018;
    m.box('kapak', w - 2 * g, h - 2 * g, T, x, y, zf - T / 2);
    if (hk === 'hc') kulp(m, x, y, zf + 0.01, false, Math.min(0.16, w * 0.5));
    else if (hk) kulp(m, x + (hk === 'r' ? w / 2 - 0.04 : -w / 2 + 0.04), kulpY !== undefined ? kulpY : y, zf + 0.01, true, Math.min(0.3, h * 0.4));
  }

  // ---------- Ürünler ----------
  function gardirop(W, H) {
    var m = new Model(); common(m);
    var D = 0.6, P = 0.08, TOP = H >= 2.2 ? 0.45 : 0, T = 0.018, split = H - TOP;
    m.box('baza', W - 0.02, P, D - 0.06, 0, P / 2, (D - 0.06) / 2);
    m.box('govde', W, H - P, D - T, 0, (H + P) / 2, (D - T) / 2);
    var n = Math.max(2, Math.round(W / 0.45)), dw = W / n;
    for (var i = 0; i < n; i++) {
      var x = -W / 2 + dw * (i + 0.5), side = i % 2 === 0 ? 'r' : 'l';
      door(m, dw, split - P, x, (P + split) / 2, D, side, Math.min(1.05, (P + split) / 2));
      if (TOP) door(m, dw, TOP, x, (split + H) / 2, D, side, split + 0.09);
    }
    return m;
  }
  function vestiyer(W) {
    var m = new Model(); common(m);
    m.mat('ayna', '#C9D6DD', 0.08, 0.25); m.mat('askilik', '#C9CDD2', 0.35, 0.6);
    var P = 0.06, CH = 0.48, CD = 0.38, T = 0.018;
    m.box('baza', W - 0.02, P, CD - 0.04, 0, P / 2, (CD - 0.04) / 2);
    m.box('govde', W, CH - P, CD - T, 0, (CH + P) / 2, (CD - T) / 2);
    var n = Math.max(2, Math.round(W / 0.5)), dw = W / n;
    for (var i = 0; i < n; i++) door(m, dw, CH - P, -W / 2 + dw * (i + 0.5), (P + CH) / 2, CD, 'hc');
    m.box('kapak', W, 0.03, CD + 0.01, 0, CH + 0.015, (CD + 0.01) / 2);
    var mw = 0.42, y0 = CH + 0.12, y1 = 1.95;
    m.box('govde', mw + 0.02, y1 - y0 + 0.02, 0.02, -W / 2 + mw / 2 + 0.01, (y0 + y1) / 2, 0.01);
    m.box('ayna', mw - 0.02, y1 - y0 - 0.02, 0.006, -W / 2 + mw / 2 + 0.01, (y0 + y1) / 2, 0.023);
    var pw = W - mw - 0.04, px = W / 2 - pw / 2, hooks = Math.max(3, Math.round(pw / 0.18));
    m.box('kapak', pw, y1 - y0, 0.02, px, (y0 + y1) / 2, 0.01);
    for (var k = 0; k < hooks; k++) m.box('askilik', 0.02, 0.02, 0.09, px - pw / 2 + pw * (k + 0.5) / hooks, 1.6, 0.065);
    m.box('kapak', pw, 0.025, 0.28, px, y1 - 0.0125, 0.14);
    return m;
  }
  function mutfak(W) {
    var m = new Model(); common(m); fixed(m);
    m.mat('tezgah', '#E9E6E0', 0.3, 0);
    var D = 0.6, P = 0.1, BT = 0.86, CT = 0.04, UY = 1.45, UH = 0.72, UD = 0.35;
    var n = Math.max(3, Math.round(W / 0.6)), w = W / n, sink = Math.floor(n * 0.3), oven = Math.min(n - 1, Math.max(sink + 1, Math.floor(n * 0.65)));
    m.box('baza', W, P, D - 0.06, 0, P / 2, (D - 0.06) / 2);
    m.box('govde', W, BT - P, D - 0.02, 0, (BT + P) / 2, (D - 0.02) / 2);
    m.box('tezgah', W + 0.02, CT, D + 0.02, 0, BT + CT / 2, (D + 0.02) / 2);
    for (var k = 0; k < n; k++) {
      var x = -W / 2 + w * (k + 0.5), h = BT - P;
      if (k === oven) {
        door(m, w, 0.16, x, P + 0.08, D, 'hc');
        m.box('cam', w - 0.02, h - 0.18, 0.02, x, P + 0.16 + (h - 0.16) / 2, D - 0.008);
        m.box('celik', w * 0.7, 0.014, 0.02, x, BT - 0.06, D + 0.012);
        m.box('cam', Math.min(0.58, w - 0.02), 0.008, 0.5, x, BT + CT + 0.004, 0.3);
        m.box('celik', Math.min(0.9, w * 0.95), 0.07, 0.48, x, UY + 0.05, 0.24);
        m.box('celik', 0.28, 2.17 - UY - 0.085, 0.25, x, (UY + 0.085 + 2.17) / 2, 0.125);
        continue;
      }
      if (k === 0) { for (var d = 0; d < 3; d++) door(m, w, h / 3, x, P + h / 6 + d * h / 3, D, 'hc'); }
      else door(m, w, h, x, P + h / 2, D, k % 2 ? 'l' : 'r', BT - 0.12);
      if (k === sink) { m.box('celik', Math.min(0.5, w - 0.06), 0.006, 0.4, x, BT + CT + 0.003, 0.3); m.box('celik', 0.02, 0.28, 0.02, x, BT + CT + 0.14, 0.07); m.box('celik', 0.02, 0.02, 0.18, x, BT + CT + 0.27, 0.15); }
      m.box('govde', w, UH, UD - 0.02, x, UY + UH / 2, (UD - 0.02) / 2);
      door(m, w, UH, x, UY + UH / 2, UD, k % 2 ? 'l' : 'r', UY + 0.1);
    }
    return m;
  }
  function karyola(Wm, Lm) {
    var m = new Model(); common(m);
    m.mat('yatak', '#EEEBE5', 0.95, 0); m.mat('yastik', '#FBFAF7', 0.95, 0);
    var W = Wm + 0.06, L = Lm + 0.06, H = 0.32;
    m.box('govde', W, H - 0.04, L, 0, (H - 0.04) / 2 + 0.04, 0.04 + L / 2);
    m.box('baza', W - 0.04, 0.04, L - 0.04, 0, 0.02, 0.04 + L / 2);
    m.box('kapak', W + 0.04, 1.0, 0.05, 0, 0.5, 0.025);
    m.box('yatak', Wm, 0.2, Lm, 0, H + 0.1, 0.08 + Lm / 2);
    var pillows = Wm >= 1.4 ? 2 : 1;
    for (var k = 0; k < pillows; k++) m.box('yastik', Wm / pillows - 0.1, 0.12, 0.4, -Wm / 2 + (k + 0.5) * Wm / pillows, H + 0.26, 0.32);
    for (var j = 0; j < 2; j++) door(m, W / 2, H - 0.06, -W / 4 + j * W / 2, 0.04 + (H - 0.06) / 2 + 0.01, 0.04 + L + 0.01, 'hc');
    return m;
  }
  function masa(W) {
    var m = new Model(); common(m);
    var D = 0.6, TOP = 0.75, dw = 0.42, dh = (TOP - 0.06) / 3, KD = 0.3, y0 = 1.05, y1 = 2.0;
    m.box('kapak', W, 0.03, D, 0, TOP - 0.015, D / 2);
    m.box('govde', 0.03, TOP - 0.03, D - 0.02, -W / 2 + 0.015, (TOP - 0.03) / 2, D / 2);
    m.box('govde', dw, TOP - 0.03, D - 0.02, W / 2 - dw / 2, (TOP - 0.03) / 2, (D - 0.02) / 2);
    for (var k = 0; k < 3; k++) door(m, dw, dh, W / 2 - dw / 2, 0.03 + dh / 2 + k * dh, D, 'hc');
    m.box('kapak', 0.02, y1 - y0, KD, -W / 2 + 0.01, (y0 + y1) / 2, KD / 2);
    m.box('kapak', 0.02, y1 - y0, KD, W / 2 - 0.01, (y0 + y1) / 2, KD / 2);
    [y0, (y0 + y1) / 2, y1].forEach(function (y) { m.box('kapak', W, 0.022, KD, 0, y, KD / 2); });
    m.box('govde', W - 0.04, y1 - y0, 0.01, 0, (y0 + y1) / 2, 0.005);
    return m;
  }
  function tv(W) {
    var m = new Model(); common(m); fixed(m);
    var D = 0.42, P = 0.06, H = 0.45, sw = 0.45, lw = W - sw, TH = 1.9;
    m.box('baza', lw, P, D - 0.04, -W / 2 + lw / 2, P / 2, (D - 0.04) / 2);
    m.box('govde', lw, H - P, D - 0.02, -W / 2 + lw / 2, (H + P) / 2, (D - 0.02) / 2);
    var n = Math.max(2, Math.round(lw / 0.6)), dw = lw / n;
    for (var k = 0; k < n; k++) door(m, dw, H - P, -W / 2 + dw * (k + 0.5), P + (H - P) / 2, D, 'hc');
    m.box('baza', sw, P, D - 0.04, W / 2 - sw / 2, P / 2, (D - 0.04) / 2);
    m.box('govde', sw, TH - P, D - 0.02, W / 2 - sw / 2, (TH + P) / 2, (D - 0.02) / 2);
    door(m, sw, TH - P, W / 2 - sw / 2, P + (TH - P) / 2, D, 'l', 1.0);
    m.box('kapak', lw * 0.8, 0.03, 0.25, -W / 2 + lw / 2, 1.55, 0.125);
    m.box('cam', Math.min(1.25, lw * 0.85), 0.72, 0.04, -W / 2 + lw / 2, 1.02, 0.03);
    return m;
  }
  function banyo(W) {
    var m = new Model(); common(m); fixed(m);
    m.mat('ayna', '#C9D6DD', 0.08, 0.25); m.mat('lavabo', '#F7F7F5', 0.2, 0);
    var D = 0.46, y0 = 0.36, y1 = 0.84, u0 = 1.2, u1 = 1.9, UD = 0.15;
    m.box('govde', W, y1 - y0, D - 0.02, 0, (y0 + y1) / 2, (D - 0.02) / 2);
    for (var k = 0; k < 2; k++) door(m, W, (y1 - y0) / 2, 0, y0 + (y1 - y0) / 4 + k * (y1 - y0) / 2, D, 'hc');
    m.box('lavabo', W + 0.01, 0.05, D + 0.02, 0, y1 + 0.025, (D + 0.02) / 2);
    m.box('celik', 0.025, 0.2, 0.025, 0, y1 + 0.15, 0.08);
    m.box('celik', 0.025, 0.025, 0.14, 0, y1 + 0.24, 0.14);
    m.box('govde', W, u1 - u0, UD - 0.02, 0, (u0 + u1) / 2, (UD - 0.02) / 2);
    for (var j = 0; j < 2; j++) {
      var x = -W / 4 + j * W / 2;
      m.box('kapak', W / 2 - 0.006, u1 - u0 - 0.006, 0.018, x, (u0 + u1) / 2, UD - 0.009);
      m.box('ayna', W / 2 - 0.06, u1 - u0 - 0.06, 0.004, x, (u0 + u1) / 2, UD + 0.002);
    }
    return m;
  }

  // o: { w: mm, h: mm (gardırop), size: '100x200' (karyola) }
  function build(p, o) {
    var W = (o.w || 0) / 1000, mdl;
    if (p === 'gardirop') mdl = gardirop(W, (o.h || 2400) / 1000);
    else if (p === 'vestiyer') mdl = vestiyer(W);
    else if (p === 'mutfak') mdl = mutfak(W);
    else if (p === 'karyola') { var s = String(o.size || '100x200').split('x'); mdl = karyola(s[0] / 100, s[1] / 100); }
    else if (p === 'masa') mdl = masa(W);
    else if (p === 'tv') mdl = tv(W);
    else if (p === 'banyo') mdl = banyo(W);
    else throw new Error('Bilinmeyen ürün: ' + p);
    return toGLB(mdl);
  }

  var api = { build: build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LadinModel = api;
})(this);
