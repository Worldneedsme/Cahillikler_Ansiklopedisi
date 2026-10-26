"""ElevenLabs seslendirme: senaryo.json → ses/<sahne>.mp3 + ses/zamanlar.json (kelime zamanları).
Kullanım: python araclar/seslendir.py <video_klasoru> [--sahne s1 s3] [--yeniden]
  --sahne   : yalnızca bu sahneleri üretir (diğerlerinin zamanları dosyadan korunur)
  --yeniden : mp3 zaten varsa bile yeniden üretir (varsayılan: olanı atlar, kredi harcamaz)
Ses, model ve ayarlar senaryo.json'dan okunur. Anahtar kanal-sablonu/.env'den gelir, yazdırılmaz.
Jump cut: kelimeler arasındaki nefes/boşluk kesilip atılır, yalnızca kısa doğal bir duraklama kalır
(cümle sonunda biraz daha uzun). Kelime zamanları kesimlere göre kaydırılır, animasyon senkron kalır.
"""
import base64, json, os, ssl, subprocess, sys, urllib.error, urllib.request

import numpy as np

try:
    import certifi
    SSL = ssl.create_default_context(cafile=certifi.where())
except ImportError:  # sistem sertifikaları
    SSL = ssl.create_default_context()

from anahtar import elevenlabs_anahtari
from ortam import FFMPEG, FFPROBE

SR = 44100
DURAK = 0.07       # kelime arası bırakılan duraklama (sn)
CUMLE_DURAK = 0.22 # . ! ? sonrası bırakılan duraklama (sn)
VIRGUL_DURAK = 0.12  # , ; : sonrası
GECIS = 0.008      # kesim noktalarında tık sesini önleyen çapraz geçiş (sn)
BAS_KUYRUK = 0.05  # ilk kelimeden önce / son kelimeden sonra bırakılan pay (sn)
API = 'https://api.elevenlabs.io/v1/text-to-speech/{ses}/with-timestamps?output_format=mp3_44100_128'


def iste(sc, cfg, onceki, sonraki):
    govde = {'text': sc['vo'], 'model_id': cfg.get('model', 'eleven_multilingual_v2'), 'voice_settings': cfg.get('ses_ayari', {})}
    if onceki: govde['previous_text'] = onceki
    if sonraki: govde['next_text'] = sonraki
    req = urllib.request.Request(API.format(ses=cfg['ses']), data=json.dumps(govde).encode('utf-8'), method='POST',
                                 headers={'xi-api-key': elevenlabs_anahtari(), 'Content-Type': 'application/json', 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=120, context=SSL) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        raise SystemExit(f"ElevenLabs hatası ({sc['id']}): {e.code} {e.read().decode('utf-8', 'replace')[:300]}")


def kelimeler(hiza):
    """Karakter hizalamasından boşlukla ayrılmış kelimeler: [{metin, bas, son}]."""
    out, cur = [], None
    for ch, a, b in zip(hiza['characters'], hiza['character_start_times_seconds'], hiza['character_end_times_seconds']):
        if ch.isspace():
            if cur: out.append(cur); cur = None
            continue
        if cur is None: cur = {'metin': ch, 'bas': round(a, 3), 'son': round(b, 3)}
        else: cur['metin'] += ch; cur['son'] = round(b, 3)
    if cur: out.append(cur)
    return out


def jump_cut(mp3, kel):
    """Kelime aralarındaki fazla boşluğu keser; kelimelerin yeni zamanlarını döndürür."""
    raw = subprocess.run([FFMPEG, '-v', 'error', '-i', mp3, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype=np.float32).copy()
    # tutulacak aralıklar: [baş, son] saniye
    araliklar = [[max(0, kel[0]['bas'] - BAS_KUYRUK), None]]
    for k0, k1 in zip(kel, kel[1:]):
        durak = CUMLE_DURAK if k0['metin'][-1] in '.!?…' else VIRGUL_DURAK if k0['metin'][-1] in ',;:' else DURAK
        if k1['bas'] - k0['son'] > durak + 2 * GECIS:
            araliklar[-1][1] = k0['son'] + durak / 2
            araliklar.append([k1['bas'] - durak / 2, None])
    araliklar[-1][1] = min(len(a) / SR, kel[-1]['son'] + BAS_KUYRUK + 0.1)
    n = int(GECIS * SR); parcalar = []
    for s0, s1 in araliklar:
        p = a[int(s0 * SR):int(s1 * SR)].copy()
        if len(p) > 2 * n: p[:n] *= np.linspace(0, 1, n); p[-n:] *= np.linspace(1, 0, n)
        parcalar.append(p)
    subprocess.run([FFMPEG, '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '128k', mp3],
                   input=np.concatenate(parcalar).astype(np.float32).tobytes(), check=True)
    # zamanları kaydır: her kelime kendi aralığında, aralık başına kadar kesilen süre kadar geri
    yeni, kesilen, j = [], 0.0, 0
    bitis = [0.0]
    for s0, s1 in araliklar: bitis.append(bitis[-1] + (s1 - s0))
    for w in kel:
        while j + 1 < len(araliklar) and w['bas'] >= araliklar[j + 1][0]: j += 1
        off = araliklar[j][0] - bitis[j]
        yeni.append({'metin': w['metin'], 'bas': round(w['bas'] - off, 3), 'son': round(w['son'] - off, 3)})
    return yeni


def sure(mp3):
    return round(float(subprocess.run([FFPROBE, '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp3], capture_output=True, text=True, check=True).stdout), 3)


def main():
    args = sys.argv[1:]
    k = args[0].rstrip('/\\')
    yeniden = '--yeniden' in args
    secili = args[args.index('--sahne') + 1:] if '--sahne' in args else None
    if secili: secili = [s for s in secili if not s.startswith('--')]
    cfg = json.load(open(os.path.join(k, 'senaryo.json'), encoding='utf-8'))
    if cfg.get('saglayici', 'elevenlabs') != 'elevenlabs': raise SystemExit('Yalnızca elevenlabs destekleniyor.')
    ses_dir = os.path.join(k, 'ses'); os.makedirs(ses_dir, exist_ok=True)
    zpath = os.path.join(ses_dir, 'zamanlar.json')
    eski = {sc['id']: sc for sc in json.load(open(zpath, encoding='utf-8'))['sahneler']} if os.path.exists(zpath) else {}
    sahneler, sc_list = [], cfg['sahneler']
    for i, sc in enumerate(sc_list):
        mp3 = os.path.join(ses_dir, sc['id'] + '.mp3')
        uret = (secili is None or sc['id'] in secili) and (yeniden or secili is not None or not os.path.exists(mp3) or sc['id'] not in eski)
        if not uret:
            if sc['id'] not in eski: raise SystemExit(f"{sc['id']}: zamanlar.json'da yok, --sahne {sc['id']} ile üretin.")
            sahneler.append(eski[sc['id']]); continue
        onceki = sc_list[i - 1]['vo'] if i else None
        sonraki = sc_list[i + 1]['vo'] if i + 1 < len(sc_list) else None
        r = iste(sc, cfg, onceki, sonraki)
        with open(mp3, 'wb') as f: f.write(base64.b64decode(r['audio_base64']))
        kel = kelimeler(r['alignment'])
        beklenen = len(sc['vo'].split())
        if len(kel) != beklenen: print(f"  uyarı {sc['id']}: {len(kel)} kelime hizalandı, metinde {beklenen} var")
        kel = jump_cut(mp3, kel)
        sahneler.append({'id': sc['id'], 'sure': sure(mp3), 'kelimeler': kel})
        print(f"  {sc['id']}: {sahneler[-1]['sure']} sn, {len(kel)} kelime")
    json.dump({'sahneler': sahneler}, open(zpath, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('Kelime sayıları (index.html kelimeSayisi):', [len(s['kelimeler']) for s in sahneler])
    print('Bitti:', zpath)


if __name__ == '__main__':
    main()
