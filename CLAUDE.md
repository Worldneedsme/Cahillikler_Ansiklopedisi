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
3. **Üret:** `sh araclar/uret.sh 005-bekaret-kemeri`. Seslendirme, render ve ses miksi tek komutta. Yaklaşık 1-2 dakika sürer.
4. **Kontrol et:** `videolar/005-.../sheet.jpg` (14 kare) ve son videoyu izle. Yazı taşması, üst üste binme, yanlış ikon var mı?
5. **Caption yaz:** `videolar/005-.../caption.txt`, `Kanal_Profili_ve_Caption_Rehberi.md` kurallarına göre.
6. **Konuyu işaretle:** `Konu_Sirasi.md` içinde yapıldı olarak işaretle.

Sadece bir sahnenin sesini değiştirmek için: `.venv/bin/python araclar/seslendir.py videolar/<ad> --sahne s2`. Sesi var olan sahneler yeniden üretilmez, kredi harcanmaz. Hepsini baştan üretmek için `uret.sh <ad> --yeniden`.

## senaryo.json

```json
{
  "id": "005-bekaret-kemeri",
  "kitap_no": 69,
  "saglayici": "elevenlabs",
  "ses": "X5CGTTx85DmIuopBFHlz",
  "ses_adi": "Nikole – Natural, Clear and Light",
  "model": "eleven_multilingual_v2",
  "ses_ayari": { "stability": 0.38, "similarity_boost": 0.85, "style": 0.4, "use_speaker_boost": true },
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
- **ikon:** Sahnenin büyük görseli, tek emoji. Bayrak gibi çok parçalı emojiler bozuk çıkabilir; sheet.jpg'de kontrol et.
- Kanca bir soru olmalı ("… öyle mi?"), cevap değil. "Merhaba arkadaşlar" gibi girişler yok.
- Kapanış her zaman "Takip et, cahil kalma!" ile biter.

## Özel çizimler (isteğe bağlı)

Hazır şablon emoji ikonlarla çalışır. Daha iyi görünmesi gereken bir videoda `index.html`'deki sahne fonksiyonu özel SVG çizimle değiştirilebilir. Örnek: `videolar/003-en-buyuk-penis/index.html` (balina, midye, oran grafiği). Yardımcılar `sablon/kanal.js` ve `sablon/parcalar.js`'de (`K.title`, `K.stamp`, `K.badge`, `K.card`, `K.followButton`, `devoAt`). Devo'nun pozları ve ifadeleri `maskot/devo.js`'nin başında yazıyor. Zamanlama için `w(sahne, kelime)` kullanılır: o kelimenin söylendiği an.

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
- Seslendirmede **jump cut** var: kelimeler arasındaki nefes ve boşluklar kesilir, kısa doğal duraklamalar kalır. Ayarlar `araclar/seslendir.py` başında (`DURAK`, `CUMLE_DURAK`, `VIRGUL_DURAK`).
- Müzik ve efektler `araclar/mix.py` içinde kodla üretilir (telif sorunu yok). Müzik seviyesi `MUZIK`.
- Render sırasında yerel sunucu otomatik açılır. Tarayıcıda önizleme için: `python3 -m http.server 8765` ve `http://localhost:8765/videolar/<ad>/index.html?t=5` (5. saniyedeki kare).
- `videolar/*/out/` ve `kareler/` ara dosyalardır, yeniden üretilebilir.

## Eksikler

- Kitap dökümü (`Cahillikler_Kitabi_Sorular_ve_Bilgiler.md`) bu klasörde yok. Konu numaraları (#55, #69…) ona göre. Varsa klasöre ekleyin.
- 001, 002 ve 003'ün kaynak dosyaları eksik geldi (index.html, ses veya senaryo). Bitmiş sessiz render'ları `out/video.mp4`'te duruyor.
