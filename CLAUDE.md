# Cahillikler Ansiklopedisi: video üretim talimatları

Instagram sayfası **Cahillikler Ansiklopedisi** için kısa dikey videolar (Reels). Konu kaynağı: *Cahillikler Kitabı* (Lloyd & Mitchinson). Her video, herkesin yanlış bildiği bir bilgiyi 30-40 saniyede düzeltir. Maskot devekuşu **Devo**.

**Hedef: her gün 3 video.**

## Klasör düzeni

| Yol | İçerik |
|---|---|
| `Konu_Sirasi.md` | Sıradaki konular, senaryo dil kuralları, ses ayarları |
| `Video_Stil_Rehberi.md` | Görsel dil, renkler, 40 sn'lik yapı, güvenli alanlar |
| `Kanal_Profili_ve_Caption_Rehberi.md` | Profil, bio, caption ve hashtag kuralları |
| `Arac_Analizi.md` | Araçların neden böyle seçildiği (arka plan bilgisi) |
| `kanal-sablonu/` | Üretim hattı: şablon, maskot, araçlar, videolar |
| `kanal-sablonu/videolar/_sablon/` | Yeni videoların kopyalandığı hazır şablon |
| `kanal-sablonu/videolar/<NNN-konu>/` | Her video: `senaryo.json`, `index.html`, `ses/`, `caption.txt`, çıktı `<NNN-konu>.mp4` |
| `Locca_Animations/` | Ayrı bir proje (Locca uygulaması); bu kanalla ilgisi yok |

## Kurulum (bir kere)

Gerekenler: Node 20+, Python 3.11+, ffmpeg, Google Chrome.

```bash
cd kanal-sablonu
npm install
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

ElevenLabs anahtarı `kanal-sablonu/.env` dosyasına: `ELEVENLABS_API_KEY=sk_...`. Bu dosya git'e girmez.

## Bir video nasıl üretilir

Bütün komutlar `kanal-sablonu/` içinden çalıştırılır.

1. **Klasörü aç:** `sh araclar/yeni.sh 005-bekaret-kemeri` (numara sırayla, konu kısa ve ASCII).
2. **Senaryoyu yaz:** `videolar/005-.../senaryo.json`. Kurallar aşağıda.
3. **Sahneleri çiz:** `index.html`'de konuya özel çizimler. Aşağıdaki "Çizimler" bölümüne bak.
4. **Üret:** `sh araclar/uret.sh 005-bekaret-kemeri`. Seslendirme, render ve ses miksi tek komutta. Yaklaşık 1-2 dakika sürer.
5. **Kontrol et:** `videolar/005-.../sheet.jpg` (14 kare) ve son videoyu izle. Yazı taşması, üst üste binme, yanlış ikon var mı?
6. **Caption yaz:** `videolar/005-.../caption.txt`, `Kanal_Profili_ve_Caption_Rehberi.md` kurallarına göre.
7. **Konuyu işaretle:** `Konu_Sirasi.md` içinde yapıldı olarak işaretle.

Sadece bir sahnenin sesini değiştirmek için: `.venv/bin/python araclar/seslendir.py videolar/<ad> --sahne s2`. Sesi var olan sahneler yeniden üretilmez, kredi harcanmaz. Hepsini baştan üretmek için `uret.sh <ad> --yeniden`.

## senaryo.json

```json
{
  "id": "005-bekaret-kemeri",
  "kitap_no": 69,
  "saglayici": "elevenlabs",
  "ses": "D2dHiTSPRx6l2bhKGmyJ",
  "ses_adi": "Dilara – Warm, Natural, Conversational",
  "model": "eleven_multilingual_v2",
  "ses_ayari": { "stability": 0.5, "similarity_boost": 0.8, "style": 0.3, "use_speaker_boost": true },
  "sahneler": [
    { "id": "s0", "tip": "kanca",     "vo": "…", "ekran": "Kısa soru", "ikon": "🔒" },
    { "id": "s1", "tip": "ters-kose", "vo": "…", "ekran": "Yok öyle bir şey! / DOĞRUSU", "ikon": "…" },
    { "id": "s2", "tip": "aciklama",  "vo": "…", "ekran": "Başlık / turkuaz vurgu", "ikon": "…" },
    { "id": "s3", "tip": "bonus",     "vo": "…", "ekran": "Asıl ilginci… / DAMGA", "ikon": "…" },
    { "id": "s4", "tip": "kapanis",   "vo": "… Takip et, cahil kalma!", "ekran": "Laf sokma cümlesi", "ikon": "…" }
  ]
}
```

- **5 sahne, sırası sabit:** kanca → ters-kose → aciklama → bonus → kapanis. Toplam 30-40 sn, saniyede ~2,5 kelime (toplam ~80-100 kelime).
- **vo:** Seslendirilecek metin. Sayıları yazıyla yaz ("üç ay", "on üç saniye"), kısaltma ve rakam kullanma. Dil kuralları `Konu_Sirasi.md`'de: konuşma Türkçesi, "-mış/-miş" ile anlatım, kısa cümleler.
- **ekran:** Ekrandaki başlık. ` / ` işaretinden sonrası vurgu olur: ters-kose ve bonus'ta damga, aciklama'da turkuaz satır. Kısa tut (satır başına ~18 karakter).
- **ikon:** Taslak şablon için tek emoji. Yayındaki videoda yerine özel çizim gelir.
- Kanca bir soru olmalı ("… öyle mi?"), cevap değil. "Merhaba arkadaşlar" gibi girişler yok.
- Kapanış her zaman "Takip et, cahil kalma!" ile biter.

## Çizimler: her video kendi sahnelerini alır

**Kalite standardı `videolar/004-kopan-kafa`.** Her sahnede konuya özel çizilmiş bir şey olur (giyotin, sayan kronometre, bayrak kartları, portre, ✓/✗ listesi) ve her görsel olay söylenen kelimeye kilitlenir. Emojili hazır şablon (`_sablon`) yalnızca taslaktır; o hâliyle yayınlanmaz. Kanal bu farkla ayakta durur.

Bir video için:
1. `yeni.sh` ile klasörü aç, senaryoyu yaz, `seslendir.py` ile sesi üret. Çıktıdaki kelime numaraları zamanlamanın temeli.
2. `index.html`'de beş sahne fonksiyonunu konuya göre yaz. Önce `sablon/varliklar.js`'ye bak: `K.stopwatch` (sayan kronometre), `K.flagCard` / `K.flag` (fr, en, gb, tr, it, de, us, jp), `K.pin`, `K.row` (✓/✗ satırı), `K.mark`, `K.kisi` (portre: wig/short/long/bald), `K.gozler`. Ortak parçalar `sablon/parcalar.js`'de: `K.title`, `K.titleOut`, `K.label`, `K.stamp`, `K.badge` (✓→✗ dönen rozet), `K.card`, `K.ring`, `K.followButton`, `devoAt`.
3. Zamanlama: `w(sahne, kelime)` o kelimenin söylendiği an. Her girişi bir kelimeye bağla, her girişe bir ses efekti koy (`olaylar`).
4. Konuya özel ama başka videolarda da işe yarayacak çizimleri (hayvan, nesne, bina) `sablon/varliklar.js`'ye taşı. Kütüphane büyüdükçe videolar hızlanır.
5. Render almadan önce 0,5 sn aralıklı kareleri kontrol et: `node araclar/kareler.mjs <ad> 0 0.5 1 …` ya da `sheet.sh`.

Devo'nun pozları ve ifadeleri `maskot/devo.js`'nin başında yazıyor. Zamanlamaya kadar örnek: 004 (sayaç, kart, portre, liste) ve 003 (özel hayvan çizimleri, oran grafiği).

## Günlük ritim (3 video)

| Ne zaman | İş |
|---|---|
| Haftada bir (ör. pazartesi) | `Konu_Sirasi.md`'den 21 konu seç, senaryolarını yaz |
| Her gün | 3 videoyu üret, sheet.jpg ile kontrol et, caption'larını yaz |
| Paylaşım | Günde 3 kez, aralıklı. Öneri: 12:30, 18:30, 21:30 (TR saati). Her 3 videodan en fazla 1'i 🌶️ (imalı) konu |

Instagram'a yükleme ve zamanlama elle yapılır (Meta Business Suite'te Reels zamanlanabilir).

## Teknik notlar

- Çıktı: 1080×1920, 30 fps, H.264 + AAC, ses −14 LUFS. Mac'te VideoToolbox donanım kodlayıcısı kullanılır.
- `araclar/ortam.mjs` ve `araclar/ortam.py` Chrome ve ffmpeg yollarını bulur. Farklı bir yer için `CHROME` / `FFMPEG` ortam değişkenleri.
- Ses: **Dilara** (`D2dHiTSPRx6l2bhKGmyJ`). Nefesli/"breathy" seslerden kaçının. Seslendirmede **jump cut** var: kelimeler arasındaki nefes ve boşluklar kesilir, kısa doğal duraklamalar kalır. Ayarlar `araclar/seslendir.py` başında (`DURAK`, `CUMLE_DURAK`, `VIRGUL_DURAK`).
- Müzik ve efektler `araclar/mix.py` içinde kodla üretilir (telif sorunu yok). Müzik seviyesi `MUZIK`.
- Render sırasında yerel sunucu otomatik açılır. Tarayıcıda önizleme için: `python3 -m http.server 8765` ve `http://localhost:8765/videolar/<ad>/index.html?t=5` (5. saniyedeki kare).
- `videolar/*/out/` ve `kareler/` ara dosyalardır, yeniden üretilebilir.

## Eksikler

- Kitap dökümü (`Cahillikler_Kitabi_Sorular_ve_Bilgiler.md`) bu klasörde yok. Konu numaraları (#55, #69…) ona göre. Varsa klasöre ekleyin.
- 001, 002 ve 003'ün kaynak dosyaları eksik geldi (index.html, ses veya senaryo). Bitmiş sessiz render'ları `out/video.mp4`'te duruyor.
