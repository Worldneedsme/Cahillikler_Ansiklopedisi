#!/bin/sh
# Tek komutla video: seslendirme → kare kare render → ses miksi.
# Kullanım: sh araclar/uret.sh <video_adi> [--yeniden]
#   --yeniden : bütün sahnelerin sesini baştan üretir (ElevenLabs kredisi harcar)
# Çıktı: videolar/<ad>/<ad>.mp4 ve kontrol için videolar/<ad>/sheet.jpg
set -e
cd "$(dirname "$0")/.."
AD=$1; shift || true
PY=.venv/bin/python; [ -x "$PY" ] || PY=python3
echo "1/4 Seslendirme"; $PY araclar/seslendir.py "videolar/$AD" "$@"
echo "2/4 Render";      node araclar/render.mjs "$AD"
echo "3/4 Ses miksi";   $PY araclar/mix.py "videolar/$AD"
echo "4/4 Kontrol sayfası"
DUR=$($PY -c "import json;print(json.load(open('videolar/$AD/out/olaylar.json'))['DUR'])")
TS=$($PY -c "d=$DUR;print(' '.join(f'{d*(i+0.5)/14:.2f}' for i in range(14)))")
sh araclar/sheet.sh "$AD" $TS
echo "Bitti: videolar/$AD/$AD.mp4"
