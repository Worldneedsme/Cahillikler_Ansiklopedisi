# Locca Business: 45 sn storyboard (taslak 2)

Hedef kitle: kafe/restoran sahipleri. Pazarlama videosu, ilk amaç işletmenin ilgisini çekmek, son amaç iletişime geçirmek.
Dil: Türkçe, "siz" hitabı (kurumsal). Ses yok: müzik ve ekran yazısı.
Müzik: önceki 120 BPM, D majör, FM tuş + marimba parçası, aynı üretici kodla 45 sn'ye uzatılır. Kick/clap neredeyse duyulmaz, hi-hat yok, sidechain hafif. Geçişler 0,5 sn vuruşlarına oturur.

## Stil (işletmeye yönelik, sakin)
Tek turuncu #FF5B00 şekil hiç kesilmez ama yalnızca vurgu. Krem #F7F1E8 ya da beyaz zemin, #111111 yazı, geniş boşluk, az öğe, yumuşak ve yavaş hareket. Büyük turuncu sahne yok. Yazılar maskeli kayarak açılır, solmaz. Rakamlar DM Sans.

## Akış

| Süre | Mesaj (fayda) | Ekran yazısı | Görüntü |
|---|---|---|---|
| 0–3,5 | Dikkat: geri gelmeyen müşteri | **Müşteri bir kez geldi.** → **Peki ya sonra?** | yok |
| 3,5–7,5 | Önce kazandıran taraf | **Başka işletmede kazanılan puan sizde harcanır.** | Dashboard: "Alınan puanlar" kartı, nokta kartın ikonunu halkalar |
| 7,5–11,5 | Puan dolaşımı: içeri | **B işletmesinde puan kazanan müşteri, puanını sizde harcamaya gelir.** | Üç düğümlü halka: Siz, A işletmesi, B işletmesi. Nokta B'den Siz'e gider. |
| 11,5–15,5 | Puan dolaşımı: dışarı | **Siz de müşterinize puan kazandırın; A işletmesinde de harcayabilir.** | Nokta Siz'den A'ya gider. |
| 15,5–18,5 | Dolaşım ve geri dönüş | **Puan işletmeler arasında dolaşır. Müşteri size geri gelir.** | Nokta tüm halkayı dolaşır (Siz → A → B → Siz). |
| 18,5–26 | Menü müşterinin telefonunda | **Menünüz müşterinizin telefonunda.** → **Her zaman güncel.** | Masa QR ekranı (QR üret) → yanında müşterinin gördüğü menü sayfası |
| 26–32 | Mekânın vitrini | **Mekânınızla ilgili her şeyi tek dokunuşla paylaşın.** | Yayınlanan hikâye → müşterinin ana sayfası tam ekran, en üstte hikâye halkası |
| 32–35,5 | Sakin saatler | **Sakin saatlere özel puan oranı belirleyin.** | `campaigns-tr` (platform gideri kutusu kadraj dışı) |
| 35,5–37,7 | Veri (var) | **Verileriniz şimdiden elinizin altında.** | `manage-tr`: Veriler satırı |
| 37,7–40 | AI rapor ve öneri (yakında) | **Yakında: yapay zekâ raporları sakin saatleri ve az satan ürünleri size bildirsin, verimi birlikte artıralım.** | `manage-tr`: Raporlarım satırı, üzerinde "Yakında" etiketi |
| 40–45 | Çağrı | **Hemen Locca ile iletişime geçin.** → **info@locallocca.com** → **Locca Business** | tilki göz kırpar, logo |

## Kırpma ve gizleme
- Tüm ekranlarda durum çubuğu kırpılır.
- `dashboard-tr`: "Müşteriler 0" ve "Cüzdanınız 0" kartları ile işlem satırlarındaki kişi adları ve tarihler kadraj dışı. Yalnızca Alınan/Verilen puan kartları ve "+50 puan ₺1000 faturasından" metni görünür.
- `scan-tr`: yalnızca fatura tutarı kartı kadrajda (damga metni ve İngilizce "Enter code manually" dışarıda).
- `qr-generator-tr`: `localhost` adresi kadraj dışı, QR okutma anı gösterilmez.
- `campaigns-tr`: "Platform gideri %2" kutusu kadraj dışı.
- `menu`: "Salata Kasesi" satırı alttan kırpılır (görsel biftek).
- `home`: bildirim rozeti ve "Kapalı" etiketleri çıkar.

## Doğrulanacaklar (yayından önce)
- **Puan dolaşımı vaadi:** "Başka işletmede kazanılan puan sizde harcanır" arka uçta havuz modeli devreye girince doğru olur. Şu an kod bunu uygulamıyor (bkz. memory: locca-points-pool-model). Video yayınlanmadan önce kod ve sözleşme hazır olmalı.
- **"Her zaman güncel" menü:** menü düzenlemesinin misafir telefonuna anında yansıdığı bir kez uçtan uca denenecek.
- **"Yakında" veri özelliği:** satış verisi (saat/ürün) henüz sunulmuyor, videoda "Yakında" etiketi mutlaka görünür kalır.
