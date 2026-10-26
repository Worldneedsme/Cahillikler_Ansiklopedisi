# Video Stil Rehberi: Kurzgesagt tarzı, Instagram Reels için

Bu rehberde Kurzgesagt'ın görsel dilini (flat vektör çizim, koyu uzay arka planı, parlak renkler, bol hareket) temel aldım ve Reels formatına uyarladım. **Onların karakterlerini, kuşunu ve logolarını kopyalamıyoruz.** Tarzdan ilham alıyoruz ama kanalın kendi maskotu ve kimliği olacak. Hem telif açısından güvenli olur hem de kanal "taklit" gibi görünmez.

---

## 1. Format
| Özellik | Değer |
|---|---|
| Oran | 9:16 dikey, 1080×1920 |
| Süre | 30-50 saniye (ideal 40 sn) |
| FPS | 30 (Kurzgesagt yumuşaklığı için 60 da olabilir) |
| Güvenli alan | Üstte 250 px ve altta 400 px boş kalsın (Instagram arayüzü bu alanları kapatıyor) |
| Altyazı | Her zaman açık ve kelime kelime vurgulanmış, çünkü izleyicilerin çoğu sesi kapalı izliyor |

## 2. Görsel dil (Kurzgesagt'tan aldıklarımız)
- **Flat vektör:** Dış çizgi (outline) yok. Şekiller düz renkli, gölge yerine aynı rengin bir ton koyusu kullanılıyor.
- **Basit geometri:** Her şey daire, yuvarlatılmış dikdörtgen ve üçgenlerden oluşuyor. Köşeler hep yumuşak.
- **Koyu arka plan:** Lacivert ya da mor tonlu, derinlik için arkada küçük yıldız/nokta parçacıkları var. Sahneye göre arka plan rengi değişebilir (okyanus için koyu teal, tarih için koyu bordo).
- **Parlak vurgu renkleri:** Koyu zemin üzerinde neon değil, doygun ve "şeker" tonları.
- **Sürekli küçük hareket:** Hiçbir kare tamamen durmuyor. Parçacıklar süzülüyor, karakterler göz kırpıyor, nesneler hafifçe "nefes alıyor" (%2 ölçek salınımı).
- **Hafif ışık halesi:** Önemli nesnenin arkasında yumuşak, açık renkli bir daire bulunuyor.

## 3. Renk paleti
| Rol | Renk | HEX |
|---|---|---|
| Arka plan (ana) | Gece laciverti | `#14213D` |
| Arka plan (ikincil) | Koyu mor | `#2B1E4A` |
| Vurgu 1 (dikkat) | Güneş sarısı | `#FFC93C` |
| Vurgu 2 (tehlike/yanlış) | Mercan kırmızı | `#FF5E5B` |
| Vurgu 3 (doğru/doğa) | Turkuaz | `#2EC4B6` |
| Vurgu 4 (sihir/şaşkınlık) | Lavanta | `#9B7BFF` |
| Metin / parlak | Kırık beyaz | `#F7F4EA` |

**Renk kuralı:** "Yanlış bilinen" kısım hep mercan kırmızı, "doğrusu" kısım hep turkuaz. İzleyici zamanla bu kodu öğreniyor.

## 4. Tipografi
- **Başlık / kanca:** Kalın, yuvarlak hatlı bir sans-serif. Öneriler: *Baloo 2 ExtraBold* ya da *Nunito Black*. İkisi de ücretsiz ve Türkçe karakterleri (ğ, ş, ı, İ) destekliyor.
- **Altyazı:** *Nunito Bold*, beyaz renk, konuşulan kelime sarı ile vurgulanıyor.
- Ekranda bir seferde en fazla 6-7 kelime olsun.

## 5. Maskot (kanalın imzası)
Baykuş bilgeliği temsil ettiği için kullanılmayacak. Önerilen maskot **devekuşu**: "kafasını kuma gömmek" cehaletin sembolü, üstelik kitap bu miti çürütüyor (#114). Diğer seçenekler (dodo, japon balığı, lemming) ve detaylar `Arac_Analizi.md` dosyasının 4. bölümünde.
- Her video devekuşunun kafası kumdayken başlıyor; yanlış bilgiye inanan taraf o ("Japon balığının hafızası 3 saniyedir!").
- Doğrusu ortaya çıkınca kafasını kumdan çıkarıp şaşırıyor, soru işareti ünleme dönüşüyor. Bu sahne kanalın tekrarlanan esprisi olacak.

## 6. Video yapısı (40 saniyelik şablon)
| Süre | Bölüm | İçerik |
|---|---|---|
| 0-2 sn | **Kanca** | Soru büyük harflerle ekranda, maskot yanlış cevabı veriyor. Ekranda "❌ YANLIŞ" çıkıyor |
| 2-8 sn | **Ters köşe** | "Aslında…" denip doğru cevap turkuaz renkte veriliyor |
| 8-30 sn | **Açıklama** | 3-4 görsel sahne ve kitaptaki yan bilgiler. Sahneler 3-5 saniyede bir değişiyor |
| 30-37 sn | **Bonus bilgi** | "Ve en garibi…" diye en şaşırtıcı yan bilgi veriliyor |
| 37-40 sn | **Kapanış** | Maskot şaşırıyor, ardından "Takip et, cahil kalma" yazısı geliyor. Son kare ilk kareye bağlanıyor ki video loop olsun |

## 7. Ses
- **Seslendirme:** Sakin, meraklı, hafif esprili bir anlatıcı (Kurzgesagt'taki Steve Taylor tonu). İnsan sesi en iyisi; hız gerekiyorsa ElevenLabs gibi bir yapay zekâ sesiyle tek bir sabit "kanal sesi" seçilebilir.
- **Müzik:** Ambient, synth ağırlıklı, uzaysı bir altlık. Telifsiz kütüphanelerden alınabilir (Epidemic Sound, Artlist, YouTube Audio Library).
- **SFX:** Her sahne geçişinde "whoosh", her bilgi çıkışında "pop", yanlış/doğru anında "buzzer/ding" sesi.

## 8. Günde 3 video nasıl üretilir (gerçekçi bakış)
Kurzgesagt'ın tek bir videosu 60 kişilik bir ekiple aylar sürüyor. Günde 3 video için **şablon + tekrar kullanılabilir varlık kütüphanesi** şart:
1. **Varlık kütüphanesi:** Başta bir kerelik 100-150 flat ikon/karakter çizilir (hayvanlar, gezegenler, insanlar, tarihi figürler). Sonraki videolar bunları yeniden kullanır.
2. **Sabit şablon:** Kanca, açıklama, bonus ve kapanış sahneleri hazır animasyon kalıpları olarak durur. Her videoda sadece metin, ikon ve renk değişir.
3. **Otomasyon:** Senaryo, seslendirme, altyazı zamanlaması ve sahne dizilimi kodla otomatik üretilebilir (ör. Remotion ya da After Effects + JSON şablon). Böylece bir video 15-30 dakikada çıkar.
4. **Haftalık ritim:** Pazartesi 21 senaryo yazılır, gün içinde toplu seslendirme yapılır, sonra her gün 3 render alınıp zamanlanır.

## 9. İçerik serileri (kanal düzeni için)
- **"Cahillikler Ansiklopedisi"**: Ana seri, kitaptaki soruların her biri bir bölüm
- **"Hayvanlar Alemi Garip"**: Hayvan bilgileri
- **"Tarih Yalan Söyler"**: Tarih mitleri
- **"Türkiye'de Bilinmeyenler"**: Kitabın Türkiye eki, Noel Baba, lale, hindi
