"""kanal-sablonu/.env dosyasından ElevenLabs anahtarını okur. Anahtar asla yazdırılmaz.
Kabul edilen biçimler: `ELEVENLABS_API_KEY=sk_...` ya da yalnızca `sk_...` içeren bir satır.
"""
import os

ENV = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')


def elevenlabs_anahtari():
    if os.environ.get('ELEVENLABS_API_KEY'):
        return os.environ['ELEVENLABS_API_KEY']
    if not os.path.exists(ENV):
        raise SystemExit(f'{ENV} yok: ElevenLabs anahtarını bu dosyaya koyun.')
    for satir in open(ENV, encoding='utf-8-sig'):
        satir = satir.strip()
        if not satir or satir.startswith('#'):
            continue
        if satir.startswith('ELEVENLABS_API_KEY='):
            satir = satir.split('=', 1)[1]
        satir = satir.strip().strip('"').strip("'")
        if satir.startswith('sk_'):
            return satir
    raise SystemExit(f'{ENV} içinde sk_ ile başlayan bir anahtar bulunamadı.')
