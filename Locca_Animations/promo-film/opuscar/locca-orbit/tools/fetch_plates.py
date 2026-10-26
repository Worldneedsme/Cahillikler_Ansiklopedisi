"""Imagery plates for "Yörüngeden sokağa" (licence-clean only).
  world   NASA Blue Marble: Next Generation (public domain), NASA GIBS WMS, whole Earth, lon/lat
  med     the same, Eastern Mediterranean
  region  Copernicus Sentinel-2 L2A true colour (10 m, "Contains modified Copernicus Sentinel data 2025"),
          via the Microsoft Planetary Computer STAC + data API (no account), reprojected to lon/lat
  town    the same scene, Alanya at full resolution
usage: ~/lemo-opuscar/.venv/bin/python -I tools/fetch_plates.py <project_dir>
Writes assets/plates/<name>.jpg + assets/plates/plates.json (lon/lat boxes); every request URL goes to
assets/raw/manifest.jsonl, the chosen scene to assets/raw/scene.json.
"""
import sys, os, io, json, math, time, datetime, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image

D = sys.argv[1]
PL = os.path.join(D, 'assets/plates'); RAW = os.path.join(D, 'assets/raw')
os.makedirs(PL, exist_ok=True); os.makedirs(RAW, exist_ok=True)
LOG = open(os.path.join(RAW, 'manifest.jsonl'), 'a')
TODAY = datetime.date.today().isoformat()
Image.MAX_IMAGE_PIXELS = None


def http(url, data=None, tries=5, timeout=180):
    for k in range(tries):
        try:
            req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'User-Agent': 'locca-film/1.0'})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except Exception as e:
            if k == tries - 1:
                raise
            print('  retry', k + 1, e)
            time.sleep(2 + 3 * k)


# ---------- Blue Marble from GIBS ----------
WMS = 'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi'
GIBS = {'world': (-180, -90, 180, 90, 8192, 4096), 'med': (24, 30, 40, 42, 3200, 2400)}
T = 1024


def gibs(name, w, s, e, n, W, H):
    dst = os.path.join(PL, name + '.jpg')
    if os.path.exists(dst):
        return
    img = Image.new('RGB', (W, H)); dx = (e - w) / W; dy = (n - s) / H

    def one(xy):
        x, y = xy; tw = min(T, W - x); th = min(T, H - y)
        bb = (n - (y + th) * dy, w + x * dx, n - y * dy, w + (x + tw) * dx)   # WMS 1.3.0 EPSG:4326 = lat,lon order
        url = (f'{WMS}?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=BlueMarble_NextGeneration&STYLES=&CRS=EPSG:4326'
               f'&BBOX={bb[0]:.6f},{bb[1]:.6f},{bb[2]:.6f},{bb[3]:.6f}&WIDTH={tw}&HEIGHT={th}&FORMAT=image/jpeg')
        return xy, url, Image.open(io.BytesIO(http(url))).convert('RGB')

    with ThreadPoolExecutor(6) as ex:
        for (x, y), url, im in ex.map(one, [(x, y) for y in range(0, H, T) for x in range(0, W, T)]):
            img.paste(im, (x, y)); LOG.write(json.dumps({'plate': name, 'url': url, 'accessed': TODAY}) + '\n')
    img.save(dst, quality=92); print('wrote', dst)


# ---------- Sentinel-2 L2A from the Planetary Computer ----------
STAC = 'https://planetarycomputer.microsoft.com/api/stac/v1/search'
DATA = 'https://planetarycomputer.microsoft.com/api/data/v1/item/bbox'
AOI = [31.90, 36.50, 32.10, 36.60]          # Alanya: castle peninsula, old town, Kleopatra beach
S2 = {  # name: (west, south, east, north, degrees per pixel)
    'region': (31.55, 36.30, 32.45, 36.85, 0.00018),   # ~16 m/px, 5000 × 3056
    'town': (31.95, 36.515, 32.05, 36.575, 0.00009),    # ~8 m/px (Sentinel-2 is 10 m), 1111 × 667
}
CHUNK = 1200


def pick_scene():
    cache = os.path.join(RAW, 'scene.json')
    if os.path.exists(cache):
        return json.load(open(cache))
    body = {'collections': ['sentinel-2-l2a'], 'bbox': AOI, 'datetime': '2025-06-01/2025-09-30', 'limit': 100,
            'query': {'eo:cloud_cover': {'lt': 3}}}
    LOG.write(json.dumps({'plate': 'stac', 'url': STAC, 'body': body, 'accessed': TODAY}) + '\n')
    feats = json.loads(http(STAC, json.dumps(body).encode()))['features']
    ok = []
    for f in feats:   # the scene must cover both plates
        w, s, e, n = f['bbox']
        if w <= S2['region'][0] and s <= S2['region'][1] and e >= S2['region'][2] and n >= S2['region'][3]:
            ok.append(f)
    if not ok:
        ok = [f for f in feats if f['bbox'][0] <= AOI[0] and f['bbox'][1] <= AOI[1] and f['bbox'][2] >= AOI[2] and f['bbox'][3] >= AOI[3]]
    ok.sort(key=lambda f: (f['properties'].get('eo:cloud_cover', 99), f['properties']['datetime']))
    f = ok[0]
    sc = {'id': f['id'], 'datetime': f['properties']['datetime'], 'cloud': f['properties'].get('eo:cloud_cover'), 'bbox': f['bbox'],
          'covers_region': f in ok and f['bbox'][0] <= S2['region'][0]}
    json.dump(sc, open(cache, 'w'), indent=1); print('scene', sc)
    return sc


def s2(name, sc):
    dst = os.path.join(PL, name + '.jpg')
    if os.path.exists(dst):
        return
    w, s, e, n, d = S2[name]
    W, H = int(round((e - w) / d)), int(round((n - s) / d))
    rgb = np.zeros((H, W, 3), np.uint8); msk = np.zeros((H, W), bool)
    jobs = []
    for cy in range(0, H, CHUNK):
        for cx in range(0, W, CHUNK):
            cw, ch = min(CHUNK, W - cx), min(CHUNK, H - cy)
            bb = (w + cx * d, n - (cy + ch) * d, w + (cx + cw) * d, n - cy * d)
            qs = [('collection', 'sentinel-2-l2a'), ('item', sc['id']), ('assets', 'visual'), ('asset_bidx', 'visual|1,2,3'),
                  ('resampling', 'bilinear'), ('reproject', 'bilinear')]
            jobs.append((cx, cy, cw, ch, f"{DATA}/{bb[0]:.6f},{bb[1]:.6f},{bb[2]:.6f},{bb[3]:.6f}/{cw}x{ch}.npy?" + urllib.parse.urlencode(qs)))

    def get(j):
        return j, np.load(io.BytesIO(http(j[4])), allow_pickle=False)

    with ThreadPoolExecutor(4) as ex:
        for (cx, cy, cw, ch, url), a in ex.map(get, jobs):
            rgb[cy:cy + ch, cx:cx + cw] = np.clip(a[:3], 0, 255).astype(np.uint8).transpose(1, 2, 0)
            msk[cy:cy + ch, cx:cx + cw] = a[3] > 0 if a.shape[0] > 3 else True
            LOG.write(json.dumps({'plate': name, 'item': sc['id'], 'url': url, 'accessed': TODAY}) + '\n')
    print(name, 'valid', round(float(msk.mean()) * 100, 1), '%')
    Image.fromarray(rgb).save(dst, quality=92); print('wrote', dst, W, H)


for k, v in GIBS.items():
    gibs(k, *v)
sc = pick_scene()
for k in S2:
    s2(k, sc)
boxes = {k: list(v[:4]) for k, v in GIBS.items()}
boxes.update({k: list(v[:4]) for k, v in S2.items()})
boxes['_credits'] = {'world': 'NASA Blue Marble: Next Generation (public domain), NASA GIBS', 'med': 'NASA Blue Marble: Next Generation (public domain), NASA GIBS',
                     'region': f"Contains modified Copernicus Sentinel data {sc['datetime'][:4]} (scene {sc['id']}), via Microsoft Planetary Computer",
                     'town': f"Contains modified Copernicus Sentinel data {sc['datetime'][:4]} (scene {sc['id']}), via Microsoft Planetary Computer"}
json.dump(boxes, open(os.path.join(PL, 'plates.json'), 'w'), indent=1)
print('done')
