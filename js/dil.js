// Arapça çeviriler (Türkçe metin → Arapça). js/ar.js ve araclar/hizmet-sayfalari.js kullanır.
// Not: Çeviriler yayından önce Arapça bilen biri tarafından kontrol edilmeli.
var LADIN_DIL = {
  ar: {
    // Ürünler
    'Mutfak dolabı': 'خزائن المطبخ', 'Gardırop': 'خزانة ملابس', 'Vestiyer': 'خزانة المدخل', 'Karyola': 'سرير',
    'Çalışma masası': 'مكتب دراسة', 'TV ünitesi': 'وحدة تلفاز', 'Banyo dolabı': 'خزانة الحمام',
    // Renkler, gövde, tezgah
    'Beyaz lake': 'أبيض (ورنيش)', 'Kaşmir': 'بيج كشميري', 'Antrasit': 'رمادي فحمي', 'Adaçayı': 'أخضر مريمية',
    'Gece mavisi': 'أزرق كحلي', 'Bordo akrilik': 'عنابي أكريليك', 'Meşe': 'خشب البلوط', 'Ceviz': 'خشب الجوز',
    'Kapakla aynı': 'مثل لون الأبواب', 'Beyaz': 'أبيض',
    'Beyaz mermer': 'رخام أبيض', 'Siyah granit': 'غرانيت أسود', 'Beton gri': 'رمادي إسمنتي', 'Mermer': 'رخام', 'Granit': 'غرانيت', 'Beton': 'إسمنتي',
    // Kulp ve kapak
    'Çubuk kulp': 'مقبض طولي', 'Düğme kulp': 'مقبض زر', 'Kulpsuz': 'بدون مقابض', 'Çubuk': 'طولي', 'Düğme': 'زر',
    'Kapaklı': 'أبواب مفصلية', 'Sürgülü': 'أبواب منزلقة', 'Aynalı sürgülü': 'منزلقة بمرآة',
    // Özet ve etiketler
    'yan duvar': 'الجدار الجانبي', 'derinlik': 'العمق', 'Standart:': 'قياسي:',
    'L mutfak': 'مطبخ على شكل L', 'Düz mutfak': 'مطبخ مستقيم', 'üst dolapsız': 'بدون خزائن علوية',
    'Kapak': 'الأبواب', 'Gövde': 'الهيكل', 'Tezgah': 'سطح العمل',
    'G × Y × D': 'العرض × الارتفاع × العمق', 'G × Y × yan': 'العرض × الارتفاع × الجانب',
    'Seçim': 'اختيارك', 'Tahmini bütçe': 'الميزانية التقديرية', 'Kesin fiyat keşifte netleşir.': 'يتحدد السعر النهائي بعد المعاينة.',
    'Örnek fiyatlar': 'أسعار تجريبية', 'Link kopyalandı': 'تم نسخ الرابط', 'Linki kopyalayın:': 'انسخ الرابط:',
    // Kamerayla ölçme
    'Kamerayı yavaşça yere doğru gezdirin…': 'حرّك الكاميرا ببطء نحو الأرض…',
    'Artıyı duvarın bir ucunun dibine (yere) getirip "Başlangıç"a dokunun.': 'ضع علامة + عند أسفل أحد طرفي الجدار (على الأرض) ثم اضغط «البداية».',
    'Ölçü:': 'القياس:', 'diğer uca gidip "Kullan"a dokunun.': 'اذهب إلى الطرف الآخر واضغط «استخدم».',
    'Kamerayla ölçüm bu telefonda başlatılamadı.': 'تعذّر بدء القياس بالكاميرا على هذا الهاتف.',
    // Odamda Göster
    'Beğendiniz mi? Bu tasarımla ölçü isteyin': 'هل أعجبك؟ اطلب القياس بهذا التصميم',
    'Yayındaki sitede burada QR kod çıkar.': 'يظهر رمز QR هنا في الموقع المنشور.',
    'Odamda Göster (telefonda)': 'اعرضه في غرفتي (على الهاتف)',
    'Bu tarayıcı kamerayı sayfa içinde açamadığı için Google görüntüleyicisi açıldı; mobilya en yakın standart modelde ve beyaz görünür. Seçtiğiniz ölçü, renk ve modelle görmek için sayfayı Chrome ile açın.':
      'فُتح عارض Google لأن هذا المتصفح لا يدعم الكاميرا داخل الصفحة؛ يظهر الأثاث بأقرب طراز قياسي وباللون الأبيض. لرؤيته بالمقاس واللون والطراز الذي اخترته افتح الصفحة في Chrome.',
    'Kamera için sayfayı Safari ile açın.': 'لاستخدام الكاميرا افتح الصفحة في Safari.',
    'Bu telefonda özel ölçü kamerada açılamadı. "Standart" ölçülerden birini seçip tekrar deneyin.': 'تعذّر فتح المقاس الخاص بالكاميرا على هذا الهاتف. اختر أحد المقاسات «القياسية» وحاول مرة أخرى.',
    'Kamera açılamadı. Telefonunuz bu özelliği desteklemiyor olabilir; modeli ekranda çevirip inceleyebilirsiniz.': 'تعذّر فتح الكاميرا. قد لا يدعم هاتفك هذه الميزة؛ يمكنك تدوير النموذج على الشاشة.',
    // Sayfa metinleri
    'Odanızda görün': 'شاهده في غرفتك', 'Mobilyanızı odanızda deneyin': 'جرّب أثاثك في غرفتك',
    'Seçiminizi yapın, sonra "Odamda Göster" ile telefon kamerasında gerçek ölçüsünde görün.': 'اختر ما تريد، ثم اضغط «اعرضه في غرفتي» لتراه بمقاسه الحقيقي عبر كاميرا الهاتف.',
    'Ölçüler': 'المقاسات', '1 · Mobilya': '1 · الأثاث', '2 · Ölçü ve model': '2 · المقاس والطراز', 'Genişlik': 'العرض',
    'Yükseklik (tavana kadar)': 'الارتفاع (حتى السقف)', 'Mutfak tipi': 'شكل المطبخ', 'Düz': 'مستقيم', 'L (köşe)': 'L (زاوية)',
    'Yan duvar': 'الجدار الجانبي', 'Üst dolaplar': 'خزائن علوية', 'Kapak tipi': 'نوع الأبواب', 'Duvarı kamerayla ölç': 'قِس الجدار بالكاميرا',
    '3 · Renk ve kulp': '3 · اللون والمقابض', '4 · Odanızda görün': '4 · شاهده في غرفتك', 'Odamda Göster': 'اعرضه في غرفتي',
    'Kamera açılınca telefonu yavaşça yere doğru gezdirin, mobilyayı parmağınızla sürükleyip duvara yaslayın.': 'عند فتح الكاميرا حرّك الهاتف ببطء نحو الأرض، ثم اسحب الأثاث بإصبعك وألصقه بالجدار.',
    'Fotoğrafımda göster': 'اعرضه على صورة غرفتي', 'Fotoğrafı kaldır': 'إزالة الصورة', 'Görüntüyü kaydet': 'حفظ الصورة',
    'Odanızın fotoğrafında mobilyayı iki parmakla taşıyıp büyütün. Fotoğrafta ölçek yaklaşıktır.': 'حرّك الأثاث وكبّره بإصبعين فوق صورة غرفتك. المقاس في الصورة تقريبي.',
    'Telefonunuzla açın': 'افتحه على هاتفك', 'Kamera telefonda çalışır. QR kodu okutun; bu tasarım telefonunuzda açılır.': 'الكاميرا تعمل على الهاتف. امسح رمز QR ليفتح هذا التصميم على هاتفك.',
    '5 · Ücretsiz keşif randevusu': '5 · موعد معاينة مجاني', 'Tarih': 'التاريخ', 'Saat': 'الوقت',
    'Sabah (09–12)': 'صباحًا (09–12)', 'Öğleden sonra (12–15)': 'ظهرًا (12–15)', 'Akşamüstü (15–18)': 'عصرًا (15–18)',
    'Randevu isteyin': 'اطلب موعدًا', 'Bu tasarımla ölçü isteyin': 'اطلب القياس بهذا التصميم', 'Tasarım linkini paylaş': 'شارك رابط التصميم',
    'Başlangıç': 'البداية', 'Kullan': 'استخدم', 'Kapat': 'إغلاق'
  }
};
if (typeof module !== 'undefined' && module.exports) module.exports = LADIN_DIL;
