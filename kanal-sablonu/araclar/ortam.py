"""Ortak ortam: ffmpeg/ffprobe yolları. FFMPEG ortam değişkeniyle ezilebilir."""
import os
import shutil

ADAYLAR = ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', r'C:\Users\Win10\tools\ffmpeg-8.1\bin\ffmpeg.exe']
FFMPEG = os.environ.get('FFMPEG') or next((p for p in ADAYLAR if os.path.exists(p)), None) or shutil.which('ffmpeg') or 'ffmpeg'
FFPROBE = os.path.join(os.path.dirname(FFMPEG), 'ffprobe' + ('.exe' if FFMPEG.endswith('.exe') else '')) if os.path.dirname(FFMPEG) else 'ffprobe'
