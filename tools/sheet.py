import sys, os, hashlib
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
seen = {}
for f in sorted(os.listdir(src)):
    if not f.endswith('.jpg'): continue
    h = hashlib.md5(open(os.path.join(src, f), 'rb').read()).hexdigest()
    if h in seen: os.remove(os.path.join(src, f)); continue
    seen[h] = f
files = sorted(seen.values())
W, H, C = 320, 220, 5
rows = (len(files) + C - 1) // C
sheet = Image.new('RGB', (W * C, (H + 20) * rows), 'white')
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(os.path.join(src, f)).convert('RGB'); im.thumbnail((W, H))
    x, y = (i % C) * W, (i // C) * (H + 20)
    sheet.paste(im, (x, y)); d.text((x + 4, y + H + 4), f"{i}:{f}", fill='black')
sheet.save(out); print(len(files))
