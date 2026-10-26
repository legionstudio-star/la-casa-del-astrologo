import sys, os
from PIL import Image
d = sys.argv[1]
for f in sorted(os.listdir(d)):
    if not f.endswith('.jpg'): continue
    base = f[:-4]; im = Image.open(os.path.join(d, f)).convert('RGB')
    for w, suf in ((1280, ''), (720, '-m')):
        c = im.copy(); c.thumbnail((w, w))
        c.save(os.path.join(d, f'{base}{suf}.webp'), 'WEBP', quality=72, method=6)
    os.remove(os.path.join(d, f))
