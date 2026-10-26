#!/bin/sh
# Yeni video klasörü açar: sh araclar/yeni.sh 005-bekaret-kemeri
# _sablon'daki index.html ve örnek senaryo.json kopyalanır; sonra senaryo.json'u düzenleyin.
set -e
cd "$(dirname "$0")/.."
AD=$1
[ -z "$AD" ] && { echo "Kullanım: sh araclar/yeni.sh <numara-konu>"; exit 1; }
[ -e "videolar/$AD" ] && { echo "videolar/$AD zaten var"; exit 1; }
mkdir -p "videolar/$AD"
cp videolar/_sablon/index.html "videolar/$AD/index.html"
sed "s/\"000-ornek\"/\"$AD\"/" videolar/_sablon/senaryo.json > "videolar/$AD/senaryo.json"
echo "Hazır: videolar/$AD (senaryo.json'u düzenleyin, sonra: sh araclar/uret.sh $AD)"
