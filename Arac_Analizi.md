# Animasyon Araçları Analizi: Cahillikler kanalı için

İncelenen üç kaynak var. Hiçbiri kurulmadı ya da çalıştırılmadı, sadece kodları ve dokümanları okundu.

| Kaynak | Rolü | Karar |
|---|---|---|
| **animated-explainer-skills** (BusyBee3333, MIT) | Animasyonların **nasıl hareket edeceği** ve **izleyicinin nasıl tutulacağı** | ✅ Temel alınacak |
| **lemo-opuscar** (Locca reposunun içinde, MIT) | Videonun **nasıl render edileceği**, ses, müzik ve mix | ✅ Üretim hattı olarak kullanılacak |
| **kurzgesagt-animation-studio** (khatunrina53a26-cpu) | Kod çalışmıyor | 💡 Yalnızca fikirleri alınacak |

---

## 1. animated-explainer-skills: temel

**Mantığı:** Her video, kendi kendine yeten tek bir HTML dosyası. Sahneler SVG ile çiziliyor, GSAP 3.13 ile hareket ettiriliyor. 4 Claude skill'i ile 7 aşamalı bir üretim yöntemi geliyor.

### 7 aşamalı yöntem
1. **Konu ve vaat:** Kanca bir soru olacak (cevap değil). Zirve sahnesi bu soruyu görsel olarak kapatacak.
2. **Çekim senaryosu:** Her sahne için süre, görsel, ekran yazısı ve seslendirme satırı. Saniyede **~2,5 kelime** kuralı geçerli.
3. **Varlıklar:** Animasyondan önce tüm çizimler hazırlanıyor (önce silüet, sonra ışık, derinlik ve detay, en son hareket kancaları).
4. **Koreografi:** Hazır kalıplar uyarlanıyor, sıfırdan icat edilmiyor.
5. **İzleyici tutma turu:** 3 tur yapılıyor, araç olarak `beat-audit.mjs` kullanılıyor.
6. **Kalite kapıları:** 0,5 saniyede bir çakışma denetimi yapılıyor (`overlap-audit.js`).
7. **Seslendirme:** Her sahne için ayrı bir ses klibi üretiliyor. Klip sahneden uzun çıkarsa sahne uzatılıyor, kısaltılmıyor.

### Alacağımız Kurzgesagt hareketleri
- **Ağırlıkla düşme:** Nesne düşerken çarpma anında ezilip yayılıyor (squash). Ağırlık hissini bu veriyor.
- **MorphSVG "birleşme":** N tane nesne bir araya gelip temsil ettiği kavrama dönüşüyor. Kurzgesagt'ın en tipik hareketi bu.
- **Karakter olarak nüfus:** Sayılar nokta yerine küçük karakterlerle gösteriliyor. Örneğin "45 milyar insan" küçük figürlerden oluşan bir kalabalık olarak çiziliyor.
- **Kamera:** Vinyet ve grain efekti, ödül anında yaklaşma (push-in), 3 katmanlı parallax kaydırma.
- **Ödül ışığı:** Kahraman nesnenin arkasında bulanık bir hale parlıyor.
- **Hazırlık (anticipation):** Her vuruştan önce küçük bir geri çekilme hareketi var.
- **Maskot:** Ekranda uçuyor, işaret ediyor, zıplıyor, irkiliyor. Yüz ifadeleri bir API ile değişiyor: `host('aha'|'sad'|'happy')`.

### Kitabın formatına birebir uyan kural
> **"Göze çarpan ✓ ters dönüp ✗ olur"** (S0 açılış sahnesi). Bizim "Sanırsın ki X… Aslında Y!" kancamız bu sahnenin ta kendisi.

### Uyarlanması gerekenler
- Sahne 800×500 boyutunda yatay. Bizim için **1080×1920 dikey** olacak şekilde yeniden düzenlenmesi gerekiyor.
- Şablondaki maskot bir arı. Onun yerine kendi maskotumuzu koyacağız (bölüm 4).
- Video çıktısı ekran kaydıyla alınıyor. Bunu lemo-opuscar'ın kare kare render sistemiyle değiştireceğiz (bölüm 2).
- Seslendirme ElevenLabs ile yapılıyor ve ücretli. lemo'daki ücretsiz Türkçe sesi kullanacağız.

---

## 2. lemo-opuscar: üretim hattı

**Mantığı:** Her film tek bir `index.html` dosyası. Bu dosya `window.render(t)` fonksiyonunu sunuyor: verilen saniyedeki kareyi deterministik olarak çiziyor. Araçlar bu fonksiyonu kare kare çağırıp MP4 üretiyor.

### Kullanacağımız özellikler
| Özellik | Araç | Bizim için anlamı |
|---|---|---|
| Kare kare render | `core/render/video.mjs --size 1080x1920 --workers 6` | Ekran kaydı yerine kusursuz 9:16 MP4. Paralel çalıştığı için hızlı |
| Önizleme kareleri | `core/render/still.mjs` + `sheet.py` | Render almadan önce kareler tek bir sayfada kontrol ediliyor |
| **Türkçe seslendirme (ücretsiz)** | `core/tts/tts_zh.py` (edge-tts) | Microsoft'un Türkçe sinir ağı sesleri: `tr-TR-AhmetNeural` (erkek), `tr-TR-EmelNeural` (kadın). İnternet gerektiriyor. Ticari kullanım koşullarını ayrıca kontrol etmek gerekiyor |
| Ses doğrulama | `core/tts/asr_check.py` (Whisper) | Üretilen ses tekrar yazıya çevrilip senaryoyla karşılaştırılıyor; yanlış okunan kelimeler yakalanıyor. Altyazı için kelime zaman damgaları da çıkıyor |
| Orijinal müzik | `core/audio/sampler.py` | Ücretsiz enstrüman kütüphaneleriyle (VSCO2, VCSL...) telif sorunu olmayan müzik |
| Ses efektleri | `core/audio/sfx.py` | Whoosh, pop, ding, thump sesleri prosedürel olarak üretiliyor ve animasyondaki olaylara (`window.EV`) kare hassasiyetinde oturuyor |
| Mix ve mastering | `core/render/mux.sh` | Ses −14 LUFS'a normalize ediliyor. Instagram ve YouTube'un istediği seviye bu |
| Okuma süresi kontrolü | `core/render/readcheck.mjs` | Her yazının ekranda okunacak kadar kaldığını otomatik denetliyor |
| Altyazı | `core/render/srt.py` | `.srt` dosyası üretiyor. Altyazılar ayrıca videonun içine de basılıyor |
| Tek zaman çizelgesi | `timeline.js` | Görüntü, müzik, efekt ve altyazı aynı ritim ızgarasından besleniyor, birbirinden kaymıyor |

### DIRECTOR.md'den alacağımız yönetmenlik kuralları
- **Her görünen hareketin bir sesi olacak.** Ses üç katmandan oluşuyor: ortam, foley ve müzik.
- Zirveden önce **en az bir sessizlik** olacak. Sessizlikten sonraki ilk ses en önemli ses olmalı.
- **Tempo değişecek.** Hızlı ve yavaş bölümler sırayla gelecek, izleyiciye bir yerde nefes aldırılacak. Hep aynı hızda giden bir film başarısız sayılıyor.
- Altyazılar en az **1,8 saniye** ekranda kalacak.
- **En az 4 farklı kamera hareketi** ve akılda kalan bir **imza çekim** olacak.
- **Geçişler** malzemenin kendisinden üretilecek; düz fade ya da sert kesme kullanılmayacak.
- En sık görülen hatalar: özne çok küçük, altyazı özneyi kapatıyor, şakaya anlaşılacak kadar zaman tanınmıyor.

### Alternatif stiller (ileride seri çeşitlendirmek için)
- **Game Show Flat:** Kalın konturlu oyuncak maskotlar, şerit ve güneş patlaması desenli arka planlar, ritme kilitli kurgu. "Doğru mu yanlış mı?" yarışma serisi için ideal.
- **Pictogram Motion:** Ritimle senkron flash-card'lar. "10 yanlış bilinen hayvan bilgisi" gibi liste videoları için.
- **Mid-century Cartoon:** 50'lerin eğitim filmi havası. "Tarih Yalan Söyler" serisi için.

### Dikkat edilmesi gerekenler
- lemo, bir filmi 30-60 dakikada ve **yüksek token harcayarak** üretiyor. Günde 3 video için her seferinde sıfırdan film yönetmek yerine **tek bir sabit kanal şablonu** kurup her videoda yalnızca içeriği değiştirmeliyiz.
- Gereksinimler: Node 20+, ffmpeg, Python 3.11+. Enstrüman paketleri ~1,1 GB, TTS modeli ~350 MB.
- `tts.py` (Kokoro) Türkçe desteklemiyor. Türkçe için `tts_zh.py` (edge-tts) kullanılacak.

---

## 3. kurzgesagt-animation-studio: alınacak fikirler

Kodu çalışmıyor ama içinde işe yarar üç fikir var:

1. **Kamera ön ayarları listesi:** Ken Burns, ödül anında yaklaşma, geri çekilerek gösterme (pull-back reveal), orbit, dolly zoom, whip pan (geçişlerde), parallax kayma, darbe sarsıntısı. Bunlar şablonda adlandırılmış hazır kamera hareketleri olarak tanımlanacak.
2. **Geçiş kütüphanesi:** **İris (dairesel maske)**, **match cut** (benzer şekiller arasında geçiş: örneğin balık gözü → gezegen) ve yön değiştiren wipe.
3. **Sahne tipleri ve anahtar kelimeyle sahne seçimi:** Her sahne *giriş / açıklama / karşılaştırma / aksiyon / kapanış* tiplerinden biri. Senaryodaki kelimelere bakılarak sahne tipi otomatik seçilebiliyor ("gibi, benzer, oysa" → karşılaştırma sahnesi). Günde 3 video için **otomatik sahne iskeleti** çıkarmada çok işe yarar.

Atılacaklar: veritabanı, kullanıcı girişi, S3 depolama, web arayüzü. Bunlara ihtiyacımız yok.

---

## 4. Maskot: baykuş yerine

Baykuş bilgeliği temsil ediyor, oysa kanalın temasının tam tersi. Önerilen 4 seçenek:

| Maskot | Neden uyuyor |
|---|---|
| **🥇 Devekuşu (önerim)** | "Kafasını kuma gömmek" deyimi cehaletin ve gerçeği görmezden gelmenin evrensel sembolü. **Kitap da bu miti çürütüyor (#114): devekuşu aslında kafasını kuma gömmez!** Maskotun kendisi bir "Cahillik" oluyor. Uzun boynu kanca anlarında esprili hareketlere çok uygun: kafasını kumdan çıkarıp "Ne? Gerçekten mi?" diyebilir. Beyninin gözünden küçük olduğu bilgisi de bonus espri malzemesi |
| Dodo | Beceriksizlik ve "aptal kuş" imajı. Kitapta neslinin avlanarak değil domuz ve fareler yüzünden tükendiği de anlatılıyor (#113). Tombul ve sevimli |
| Japon balığı | "3 saniyelik hafıza" miti (#9). Her videonun sonunda "Ne diyordum?" esprisi yapılabilir. Ancak su dışında hareket etmesi zor |
| Lemming | Sürüye uyup yanlışa inanmanın sembolü. Toplu intihar miti Disney uydurması (#12). Fakat konu karanlık |

**Devekuşu karakter fikri:** Adı "Kumbaşı" ya da "Devo" olabilir. Videoya hep kafası kumda başlıyor (yanlış bilgiye inanıyor). Doğru bilgi gelince kafasını kumdan çıkarıp şaşırıyor. Kafasının üstündeki soru işareti "!" işaretine dönüşüyor. Bu sahne kanalın tekrarlanan imza esprisi olacak.

---

## 5. Önerilen birleşik sistem

```
Kitaptaki soru (Cahillikler_Kitabi_Sorular_ve_Bilgiler.md)
   ↓  Claude: 40 sn'lik çekim senaryosu (5 sahne, 2,5 kelime/sn, sahne tipleri)
   ↓  edge-tts (tr-TR-AhmetNeural) → asr_check ile doğrulama → kelime zamanları
   ↓  KANAL ŞABLONU (tek HTML, 1080×1920):
   │     • explainer-skills'in GSAP kalıpları ve devekuşu maskotu
   │     • timeline paused → window.render(t) = tl.seek(t)  ← iki sistemin köprüsü
   │     • hazır sahne tipleri + kamera ön ayarları + iris/match-cut geçişleri
   ↓  readcheck + overlap-audit (kalite kapıları)
   ↓  lemo video.mjs --size 1080x1920 → sfx.py (EV olayları) + sampler müzik
   ↓  mux.sh (−14 LUFS) → reels.mp4 + .srt
```

**Kritik teknik köprü:** explainer-skills'in GSAP timeline'ı duraklatılmış durumda tutulup `window.render(t)` içinde `tl.seek(t)` çağrılıyor. Böylece GSAP animasyonları lemo'nun deterministik kare kare render sistemiyle sorunsuz çalışıyor.

**Hedef:** Şablon bir kez kurulduktan sonra her yeni video için yalnızca senaryo ve ikon seçimi yapılacak. Render, ses ve mix otomatik olacak; video başına ~15-30 dakika sürecek.
