// Configuración y contenido del hotel. Editar aquí precios, habitaciones y extras.
window.HOTEL = {
  whatsapp: '573012633026',
  // Endpoint opcional para guardar reservas (p. ej. una función de Supabase o Vercel).
  // Si es null, la reserva se envía solo por WhatsApp.
  apiEndpoint: null,
  directDiscount: 0.10, // descuento por reserva directa
  currency: 'COP',

  // Precios por noche (COP) — tarifas de referencia, confirmar con el propietario.
  rooms: [
    {
      id: 'doble',
      name: 'Doble Estándar',
      img: 'assets/img/hab-doble.webp',
      beds: '1 cama doble',
      max: 2,
      price: 165000,
      perks: ['Aire acondicionado', 'Baño privado', 'Wifi']
    },
    {
      id: 'doble-balcon',
      name: 'Doble con Balcón',
      img: 'assets/img/hab-balcon.webp',
      beds: '1 cama doble extragrande',
      max: 2,
      price: 185000,
      perks: ['Balcón privado', 'Aire acondicionado', 'Baño privado']
    },
    {
      id: 'vista-piscina',
      name: 'King Vista a la Piscina',
      img: 'assets/img/hab-deluxe.webp',
      beds: '1 cama extragrande',
      max: 2,
      price: 210000,
      perks: ['Vista a la piscina', 'TV', 'Aire acondicionado'],
      tag: 'Favorita'
    },
    {
      id: 'deluxe-2camas',
      name: 'Deluxe Doble · 2 camas',
      img: 'assets/img/hab-doble-2camas.webp',
      beds: '2 camas dobles',
      max: 4,
      price: 260000,
      perks: ['Balcón', 'Ideal para amigos', 'Aire acondicionado']
    },
    {
      id: 'familiar',
      name: 'Suite Familiar con Balcón',
      img: 'assets/img/hab-familiar.webp',
      beds: '2 camas dobles grandes',
      max: 4,
      price: 300000,
      perks: ['Balcón', 'Amplia', 'Hasta 4 personas']
    }
  ],

  extras: [
    { id: 'desayuno', name: 'Desayuno americano', desc: 'Por persona, por noche', price: 18000, per: 'guest-night' },
    { id: 'carta', name: 'Carta astral con Fredy Astro', desc: 'Estudio sideral completo + calendario birrítmico. Precio huésped (antes $500.000)', price: 150000, per: 'stay' },
    { id: 'tour', name: 'Tour Desierto Rojo y Gris', desc: 'Transporte y guía local, por persona', price: 90000, per: 'guest' },
    { id: 'observatorio', name: 'Noche de observatorio', desc: 'Traslado y charla astronómica, por persona', price: 60000, per: 'guest' },
    { id: 'romance', name: 'Decoración romántica', desc: 'Flores, pétalos y vino de bienvenida', price: 80000, per: 'stay' }
  ],

  gallery: [
    { src: 'assets/img/fachada-noche.webp', alt: 'Fachada iluminada bajo las estrellas', size: 'wide' },
    { src: 'assets/img/piscina-cascada.webp', alt: 'Cascada de piedra sobre la piscina', size: 'tall' },
    { src: 'assets/img/piscina.webp', alt: 'Piscina y patio interior' },
    { src: 'assets/img/hab-deluxe.webp', alt: 'Habitación king con decoración' },
    { src: 'assets/img/balcones.webp', alt: 'Balcones sobre la piscina', size: 'tall' },
    { src: 'assets/img/terraza-estrellas.webp', alt: 'Terraza mirador con la Vía Láctea', size: 'wide' },
    { src: 'assets/img/piscina-piedra.webp', alt: 'Muro de piedra junto a la piscina' },
    { src: 'assets/img/hab-flores.webp', alt: 'Habitación doble' },
    { src: 'assets/img/patio-piscina.webp', alt: 'Vista del patio desde el segundo piso', size: 'tall' },
    { src: 'assets/img/fachada-dia.webp', alt: 'Fachada de día' },
    { src: 'assets/img/bano.webp', alt: 'Baño privado' },
    { src: 'assets/img/hab-estandar.webp', alt: 'Habitación estándar' }
  ]
};
