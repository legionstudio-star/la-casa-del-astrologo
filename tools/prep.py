import sys, os
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
m = {'667929212':'piscina-cascada','667929218':'hab-doble-2camas','667929220':'hab-familiar','667929224':'hab-doble','667929227':'bano','667929231':'fachada-dia','667929237':'patio-piscina','667929239':'hab-flores','667929245':'balcones','801403075':'fachada-noche','801403413':'piscina-piedra','801403533':'piscina','801403603':'terraza-estrellas','801403734':'hab-deluxe','801406217':'fachada','839188780':'hab-estandar','842061708':'hab-balcon'}
for k, v in m.items():
    im = Image.open(os.path.join(src, k + '.jpg')).convert('RGB')
    im.thumbnail((1600, 1600))
    im.save(os.path.join(dst, v + '.jpg'), quality=82, optimize=True, progressive=True)
    print(v, im.size)
