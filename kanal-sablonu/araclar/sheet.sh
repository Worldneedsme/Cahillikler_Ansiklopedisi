#!/bin/sh
# Kullanım: sh araclar/sheet.sh <video_adi> t1 ... t14  → videolar/<ad>/sheet.jpg (7x2 kare)
AD=$1; shift
rm -rf "videolar/$AD/kareler"
node araclar/kareler.mjs "$AD" "$@" 2>&1 | grep -v "status of 404" 
F=/c/Users/Win10/tools/ffmpeg-8.1/bin/ffmpeg.exe
IN=""; for t in "$@"; do IN="$IN -i videolar/$AD/kareler/t_$t.jpg"; done
$F -hide_banner -loglevel error -y $IN -filter_complex "[0][1][2][3][4][5][6]hstack=7[a];[7][8][9][10][11][12][13]hstack=7[b];[a][b]vstack,scale=1890:-1" "videolar/$AD/sheet.jpg" && echo sheet_ok
