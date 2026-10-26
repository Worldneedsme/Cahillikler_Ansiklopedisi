# Pen & wash treatment for the fox cut-outs (2026-10-21, "Dağınık sadakat" hand-drawn version). PIL only.
# Sepia fineliner from luminance + silhouette edges, a light watercolour wash shifted off the line, paper left for highlights.
# Each seed varies the edge threshold and the wash offset, so swapping seeds at 12 fps makes the drawing "boil".
#   python3 tools/sketch_fox.py <in.png> <out.png> <seed>
import sys
from PIL import Image, ImageFilter, ImageChops, ImageOps, ImageEnhance
src, out, seed = sys.argv[1], sys.argv[2], int(sys.argv[3])
PAPER, INK = (245, 238, 222), (43, 37, 32)
im = Image.open(src).convert('RGBA')
a = im.getchannel('A')
rgb = Image.new('RGB', im.size, PAPER); rgb.paste(im.convert('RGB'), mask=a)
th = [13, 15, 17][seed % 3]
lum = rgb.convert('L').filter(ImageFilter.GaussianBlur(1.5 + 0.15 * seed))
inner = lum.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > th else 0)
sil = a.point(lambda v: 255 if v > 128 else 0).filter(ImageFilter.FIND_EDGES).filter(ImageFilter.MaxFilter(3))
sil = ImageChops.offset(sil, *[(0, 0), (1, 0), (0, 1)][seed % 3])
ink = ImageChops.lighter(inner, sil).filter(ImageFilter.GaussianBlur(0.6)).point(lambda v: min(255, int(v * 1.5)))
wash = rgb.filter(ImageFilter.ModeFilter(9)).filter(ImageFilter.GaussianBlur(2))
wash = ImageOps.posterize(wash, 3)
wash = Image.blend(ImageEnhance.Color(wash).enhance(0.9), Image.new('RGB', wash.size, PAPER), 0.32)
wa = a.filter(ImageFilter.GaussianBlur(3)).point(lambda v: 205 if v > 120 else 0)
dx, dy = [(4, 3), (-3, 4), (3, -2)][seed % 3]
wash, wa = ImageChops.offset(wash, dx, dy), ImageChops.offset(wa, dx, dy)
res = Image.new('RGBA', im.size, (0, 0, 0, 0)); res.paste(wash, mask=wa)
res = Image.alpha_composite(res, Image.merge('RGBA', (*Image.new('RGB', im.size, INK).split(), ink)))
res.save(out, optimize=True)
