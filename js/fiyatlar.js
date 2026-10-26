// Odanızda Gör tahmini bütçe hesabı. ÖRNEK fiyatlardır: ustanın kendi fiyatlarıyla değiştirin, sonra ornek: false yapın.
// Hesap: mutfak = tezgah uzunluğu (m) × metre fiyatı (+ üst dolap oranı) × kapak × tezgah çarpanı
//        gardırop = ön yüz alanı (m²) × m² fiyatı × kapak × kapak tipi çarpanı
//        diğerleri = genişlik (m) × metre fiyatı × kapak;  karyola = adet fiyatı × kapak
// Gösterilen aralık: hesap ± aralik (ör. %15), 1.000 TL'ye yuvarlanır.
var LADIN_FIYAT = {
  ornek: true,
  aralik: 0.15,
  mutfak: { metre: 24000, ust: 0.45 },
  gardirop: { m2: 9500 },
  vestiyer: { metre: 15000 },
  karyola: { adet: { '90x190': 14000, '100x200': 16000, '120x200': 19000, '160x200': 25000 } },
  masa: { metre: 12000 },
  tv: { metre: 13000 },
  banyo: { metre: 17000 },
  // Kapak malzemesi çarpanı (lake = 1)
  kapak: { beyaz: 1, kasmir: 0.95, antrasit: 1, adacayi: 1.05, gece: 1.05, bordo: 1.15, mese: 0.85, ceviz: 0.85 },
  kapakTipi: { kapakli: 1, surgulu: 1.15, ayna: 1.25 },
  tezgah: { mermer: 1, granit: 1.08, mese: 1, beton: 1.05 }
};
if (typeof module !== 'undefined' && module.exports) module.exports = LADIN_FIYAT;
