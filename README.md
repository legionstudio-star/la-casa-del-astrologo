# Hotel La Casa del Astrólogo — sitio web

Sitio web con reservas directas para el Hotel La Casa del Astrólogo (Villavieja, Huila · Desierto de la Tatacoa).

## Estructura

- `site/` — sitio estático (HTML, CSS, JS). Se publica tal cual.
  - `assets/js/data.js` — **precios, habitaciones, extras y galería** (editar aquí).
  - `assets/js/booking.js` — motor de reservas (fechas → habitación → extras → datos → WhatsApp).
  - `assets/js/sky.js` — fase lunar en vivo, mejores noches y lluvias de estrellas.
  - `assets/js/main.js` — animaciones de scroll (GSAP + ScrollTrigger + Lenis).
- `tools/` — scripts para preparar fotos.

## Correr en local

```bash
cd site
python -m http.server 5173
```

Abrir http://localhost:5173

## Pendiente

- Precios reales del propietario (los actuales son de referencia).
- Fase 2: pagos en línea (Wompi / Mercado Pago), calendario sincronizado con Booking, panel de reservas.
