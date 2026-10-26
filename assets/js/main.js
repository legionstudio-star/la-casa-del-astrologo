// Animaciones, scroll suave y render de secciones.
(function () {
  const H = window.HOTEL;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const money = n => '$' + Math.round(n).toLocaleString('es-CO');
  const isMobile = window.matchMedia('(max-width: 899px)').matches;
  // srcset con versión móvil (-m.webp) y escritorio
  const srcset = src => `${src.replace('.webp', '-m.webp')} 720w, ${src} 1280w`;
  document.getElementById('year').textContent = new Date().getFullYear();

  // ---------- Render: habitaciones ----------
  const track = document.getElementById('roomsTrack');
  track.innerHTML = H.rooms.map((r, i) => `
    <article class="room-card">
      <div class="room-card__media">
        <img src="${r.img.replace('.webp', '-m.webp')}" srcset="${srcset(r.img)}" sizes="(max-width: 899px) 92vw, 440px" alt="${r.name}" loading="lazy" decoding="async">
        ${r.tag ? `<span class="room-card__tag">${r.tag}</span>` : ''}
        <span class="room-card__n">0${i + 1}</span>
      </div>
      <div class="room-card__body">
        <h3>${r.name}</h3>
        <p class="muted">${r.beds} · hasta ${r.max} personas</p>
        <ul>${r.perks.map(p => `<li>${p}</li>`).join('')}</ul>
        <div class="room-card__foot">
          <div><small>Desde</small><strong>${money(r.price * (1 - H.directDiscount))}</strong><small>/ noche</small></div>
          <button class="btn btn--line" data-open-booking data-room="${r.id}">Reservar <svg><use href="#i-arrow"/></svg></button>
        </div>
      </div>
    </article>`).join('') + `
    <article class="room-card room-card--end">
      <p class="eyebrow">¿Grupo o evento íntimo?</p>
      <h3>Reserva el hotel completo</h3>
      <p class="muted">Retiros, cumpleaños tranquilos o viajes de amigos. Te armamos una tarifa especial.</p>
      <a class="btn btn--gold" href="https://wa.me/${H.whatsapp}?text=${encodeURIComponent('Hola, quiero cotizar el hotel completo para un grupo')}" target="_blank" rel="noopener">Cotizar por WhatsApp</a>
    </article>`;

  // ---------- Render: galería ----------
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = H.gallery.map(g => `
    <figure class="g-item ${g.size ? 'g-item--' + g.size : ''}" data-full="${g.src}">
      <div class="g-item__inner"><img src="${g.src.replace('.webp', '-m.webp')}" srcset="${srcset(g.src)}" sizes="(max-width: 899px) 50vw, 25vw" alt="${g.alt}" loading="lazy" decoding="async"></div>
    </figure>`).join('');

  // Lightbox
  const lb = document.getElementById('lightbox');
  grid.addEventListener('click', e => {
    const item = e.target.closest('.g-item');
    if (!item) return;
    lb.querySelector('img').src = isMobile ? item.dataset.full.replace('.webp', '-m.webp') : item.dataset.full;
    lb.querySelector('img').alt = item.querySelector('img').alt;
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    window.lenis && window.lenis.stop();
  });
  const closeLb = () => { lb.classList.remove('is-open'); window.lenis && window.lenis.start(); setTimeout(() => (lb.hidden = true), 350); };
  lb.addEventListener('click', closeLb);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

  // ---------- Render: rueda zodiacal ----------
  const zod = document.getElementById('zodiac');
  const signs = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  let z = '<circle cx="200" cy="200" r="190" class="z-ring"/><circle cx="200" cy="200" r="150" class="z-ring"/><circle cx="200" cy="200" r="100" class="z-ring z-ring--thin"/><circle cx="200" cy="200" r="40" class="z-ring z-ring--thin"/>';
  signs.forEach((s, i) => {
    const a = (i * 30 - 90) * Math.PI / 180, a2 = ((i * 30 + 15) - 90) * Math.PI / 180;
    z += `<line x1="${200 + 150 * Math.cos(a)}" y1="${200 + 150 * Math.sin(a)}" x2="${200 + 190 * Math.cos(a)}" y2="${200 + 190 * Math.sin(a)}" class="z-ring"/>`;
    z += `<text x="${200 + 170 * Math.cos(a2)}" y="${200 + 170 * Math.sin(a2)}" class="z-sign">${s}︎</text>`;
    z += `<line x1="200" y1="200" x2="${200 + 100 * Math.cos(a2)}" y2="${200 + 100 * Math.sin(a2)}" class="z-ring z-ring--thin"/>`;
  });
  for (let i = 0; i < 72; i++) {
    const a = i * 5 * Math.PI / 180, r1 = i % 6 === 0 ? 140 : 145;
    z += `<line x1="${200 + r1 * Math.cos(a)}" y1="${200 + r1 * Math.sin(a)}" x2="${200 + 150 * Math.cos(a)}" y2="${200 + 150 * Math.sin(a)}" class="z-ring z-ring--thin"/>`;
  }
  zod.innerHTML = `<g id="zodiacSpin">${z}</g><path d="M200 172 l6 22 22 6 -22 6 -6 22 -6 -22 -22 -6 22 -6z" class="z-core"/>`;

  // ---------- Mapa bajo demanda (ahorra ~1 MB en celular) ----------
  const mapBtn = document.getElementById('mapFacade');
  mapBtn.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.title = 'Mapa del hotel'; f.src = mapBtn.dataset.src; f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    mapBtn.replaceWith(f);
  });

  // ---------- Cielo ----------
  Sky.renderSkySection();

  // ---------- Starfield ----------
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  let stars = [], W, Hh, dpr, mouseX = 0, mouseY = 0, scrollY = 0, shooting = null;
  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    W = canvas.clientWidth; Hh = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = Hh * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round((W * Hh) / (isMobile ? 5200 : 3500));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * Hh,
      r: Math.random() * 1.2 + 0.2, z: Math.random() * 0.8 + 0.2,
      tw: Math.random() * Math.PI * 2, sp: Math.random() * 0.02 + 0.005
    }));
  }
  let heroVisible = true;
  new IntersectionObserver(([e]) => {
    const was = heroVisible; heroVisible = e.isIntersecting;
    if (heroVisible && !was && !reduced) requestAnimationFrame(drawStars);
  }).observe(canvas);
  function drawStars() {
    if (!heroVisible && !reduced) return; // pausa cuando el hero no se ve
    ctx.clearRect(0, 0, W, Hh);
    for (const s of stars) {
      s.tw += s.sp;
      const a = 0.35 + Math.sin(s.tw) * 0.35 + s.z * 0.3;
      const x = s.x + mouseX * 18 * s.z;
      const y = ((s.y - scrollY * 0.35 * s.z) % Hh + Hh) % Hh + mouseY * 12 * s.z;
      ctx.beginPath();
      ctx.arc(x, y, s.r * s.z * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 244, 220, ${a})`;
      ctx.fill();
    }
    // Estrella fugaz ocasional
    if (!shooting && Math.random() < 0.004) shooting = { x: Math.random() * W * 0.7 + W * 0.2, y: Math.random() * Hh * 0.4, l: 0 };
    if (shooting) {
      shooting.l += 14;
      const x = shooting.x - shooting.l, y = shooting.y + shooting.l * 0.45;
      const g = ctx.createLinearGradient(x, y, x + 120, y - 54);
      g.addColorStop(0, 'rgba(255,240,210,.9)'); g.addColorStop(1, 'rgba(255,240,210,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 120, y - 54); ctx.stroke();
      if (shooting.l > 420) shooting = null;
    }
    if (!reduced) requestAnimationFrame(drawStars);
  }
  sizeCanvas();
  if (reduced) drawStars();
  let lastW = innerWidth;
  window.addEventListener('resize', () => { if (Math.abs(innerWidth - lastW) > 40 || !isMobile) { lastW = innerWidth; sizeCanvas(); } });
  if (!isMobile) window.addEventListener('pointermove', e => { mouseX = e.clientX / innerWidth - 0.5; mouseY = e.clientY / innerHeight - 0.5; });
  if (!reduced) requestAnimationFrame(drawStars);

  // Marquesina infinita: duplicar opiniones
  const mq = document.querySelector('.marquee__inner');
  mq.innerHTML += mq.innerHTML;

  // ---------- Nav ----------
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const mm = document.getElementById('mobileMenu');
  burger.addEventListener('click', () => {
    const open = mm.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
    burger.classList.toggle('is-open', open);
  });
  mm.addEventListener('click', e => { if (e.target.tagName === 'A') { mm.classList.remove('is-open'); burger.classList.remove('is-open'); } });

  // ---------- Sin GSAP o movimiento reducido ----------
  const loader = document.getElementById('loader');
  if (!window.gsap || reduced) {
    loader.remove();
    document.documentElement.classList.add('no-motion');
    window.addEventListener('scroll', () => nav.classList.toggle('is-solid', scrollY > 40));
    document.querySelectorAll('[data-count]').forEach(el => {
      const p = el.dataset.prefix || '', s = el.dataset.suffix || '', v = +el.dataset.count;
      el.textContent = p + v.toLocaleString('es-CO', { minimumFractionDigits: +(el.dataset.dec || 0) }) + s;
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Scroll suave
  const lenis = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  window.lenis = lenis;
  lenis.on('scroll', e => { ScrollTrigger.update(); scrollY = e.scroll; nav.classList.toggle('is-solid', e.scroll > 40); });
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -70, duration: 1.6 }); }
  }));

  // Loader → intro
  lenis.stop();
  const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
  intro
    .fromTo('.loader .draw', { strokeDasharray: 400, strokeDashoffset: 400 }, { strokeDashoffset: 0, duration: isMobile ? 0.8 : 1.4, stagger: 0.04, ease: 'power2.inOut' })
    .from('.loader__name', { opacity: 0, y: 10, duration: 0.6 }, '-=0.6')
    .to('.loader__bar span', { scaleX: 1, duration: isMobile ? 0.5 : 0.9, ease: 'power2.inOut' }, '-=0.6')
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: isMobile ? 0.7 : 1, ease: 'expo.inOut' })
    .from('.hero__img', { scale: 1.35, duration: 2.2, ease: 'expo.out' }, '-=0.8')
    .from('.hero__title .line > span', { yPercent: 110, duration: 1.2, stagger: 0.12, ease: 'expo.out' }, '-=2')
    .from(['.hero__eyebrow', '.hero__sub'], { opacity: 0, y: 20, duration: 1, stagger: 0.1 }, '-=1.4')
    .from('.quickbook', { opacity: 0, y: 40, duration: 1 }, '-=1')
    .from('.nav', { y: -30, opacity: 0, duration: 0.8 }, '-=1')
    .add(() => { loader.remove(); lenis.start(); });

  // Hero: parallax y desvanecido al hacer scroll
  gsap.to('.hero__img', { yPercent: 18, scale: 1.12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '70% top', scrub: true } });
  gsap.to('.hero__veil', { opacity: 1, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Manifiesto: palabras que se iluminan con el scroll
  const mt = document.getElementById('manifestText');
  mt.innerHTML = mt.textContent.split(' ').map(w => `<span class="w">${w}</span>`).join(' ');
  gsap.fromTo('#manifestText .w', { opacity: 0.12 }, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: mt, start: 'top 80%', end: 'bottom 45%', scrub: true } });

  // Contadores
  document.querySelectorAll('[data-count]').forEach(el => {
    const v = +el.dataset.count, dec = +(el.dataset.dec || 0), p = el.dataset.prefix || '', s = el.dataset.suffix || '';
    const o = { n: 0 };
    gsap.to(o, { n: v, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onUpdate: () => (el.textContent = p + o.n.toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + s) });
  });
  gsap.from('.stat', { y: 40, opacity: 0, stagger: 0.12, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.stats', start: 'top 85%' } });

  // Títulos palabra por palabra
  document.querySelectorAll('.split-words').forEach(h => {
    h.innerHTML = h.textContent.trim().split(' ').map(w => `<span class="sw"><span>${w}</span></span>`).join(' ');
    gsap.from(h.querySelectorAll('.sw > span'), { yPercent: 110, duration: 1.1, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } });
  });

  // Revelado de imágenes con clip-path
  document.querySelectorAll('.reveal-clip').forEach(el => {
    gsap.fromTo(el, { clipPath: 'inset(18% 18% 18% 18% round 24px)' }, { clipPath: 'inset(0% 0% 0% 0% round 24px)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 30%', scrub: true } });
    const img = el.querySelector('img');
    if (img) gsap.fromTo(img, { scale: 1.3, yPercent: -6 }, { scale: 1, yPercent: 6, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.from('.split__copy > *:not(h2), .ticks li', { y: 30, opacity: 0, stagger: 0.08, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.split__copy', start: 'top 75%' } });

  // Habitaciones: scroll horizontal fijado (escritorio) / aparición (móvil)
  const mm2 = gsap.matchMedia();
  mm2.add('(min-width: 900px)', () => {
    const dist = () => track.scrollWidth - window.innerWidth + parseFloat(getComputedStyle(track).paddingLeft);
    const tween = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.rooms', start: 'top top', end: () => '+=' + dist(), pin: '.rooms__pin', scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
    track.querySelectorAll('.room-card__media img').forEach(img => {
      gsap.fromTo(img, { xPercent: -8, scale: 1.15 }, { xPercent: 8, ease: 'none', scrollTrigger: { trigger: img.closest('.room-card'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
    gsap.from('.room-card', { opacity: 0, y: 60, stagger: 0.1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.rooms', start: 'top 70%' } });
  });
  mm2.add('(max-width: 899px)', () => {
    gsap.utils.toArray('.room-card').forEach(c => gsap.from(c, { opacity: 0, y: 50, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 90%' } }));
  });

  // Rueda zodiacal girando con el scroll
  gsap.to('#zodiacSpin', { rotation: 180, svgOrigin: '200 200', ease: 'none', scrollTrigger: { trigger: '.astro', start: 'top bottom', end: 'bottom top', scrub: 1 } });
  gsap.from('.astro__wheel', { scale: 0.6, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.astro', start: 'top 70%' } });
  gsap.from('.astro__grid span', { opacity: 0, y: 20, stagger: 0.07, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: '.astro__grid', start: 'top 85%' } });
  gsap.from('.price-tag', { opacity: 0, y: 30, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.price-tag', start: 'top 90%' } });

  // Cielo
  gsap.from('.sky__grid > *', { y: 60, opacity: 0, stagger: 0.15, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '.sky__grid', start: 'top 80%' } });
  gsap.from('#moonNow', { rotate: -40, scale: 0.7, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.sky__grid', start: 'top 80%' } });

  // Experiencias: tarjetas que se apilan
  gsap.utils.toArray('.exp-card').forEach((c, i) => {
    gsap.from(c, { y: 80, opacity: 0, rotateX: -12, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 90%' } });
  });

  // Galería: revelado escalonado + parallax interno
  gsap.utils.toArray('.g-item').forEach((g, i) => {
    gsap.fromTo(g, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.out', delay: (i % 3) * 0.08, scrollTrigger: { trigger: g, start: 'top 92%' } });
    if (!isMobile) gsap.fromTo(g.querySelector('img'), { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: g, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Opiniones / reserva directa / ubicación / faq
  gsap.from('.reviews__score > *', { y: 30, opacity: 0, stagger: 0.1, duration: 1, scrollTrigger: { trigger: '.reviews', start: 'top 80%' } });
  gsap.from('.direct__card', { scale: 0.92, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.direct', start: 'top 80%' } });
  gsap.from('.direct__grid > div', { y: 30, opacity: 0, stagger: 0.1, duration: 0.9, scrollTrigger: { trigger: '.direct__grid', start: 'top 85%' } });
  gsap.from('.location__info > *', { y: 30, opacity: 0, stagger: 0.08, duration: 0.9, scrollTrigger: { trigger: '.location', start: 'top 75%' } });
  gsap.from('.faq details', { y: 20, opacity: 0, stagger: 0.07, duration: 0.8, scrollTrigger: { trigger: '.faq', start: 'top 80%' } });

  // Barra de progreso de lectura en el nav
  gsap.to('.nav', { '--progress': 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
