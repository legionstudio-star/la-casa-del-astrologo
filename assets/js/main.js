// Render de secciones, coreografía de scroll (día → noche) e interacciones.
(function () {
  const H = window.HOTEL;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 899px)').matches;
  const money = n => '$' + Math.round(n).toLocaleString('es-CO');
  const mobileSrc = src => src.replace('.webp', '-m.webp');
  const srcset = src => `${mobileSrc(src)} 720w, ${src} 1280w`;
  const direct = p => p * (1 - H.directDiscount);
  document.getElementById('year').textContent = new Date().getFullYear();

  // ---------- Habitaciones ----------
  const track = document.getElementById('roomsTrack');
  track.innerHTML = H.rooms.map((r, i) => `
    <article class="room">
      <div class="room__media">
        <img src="${mobileSrc(r.img)}" srcset="${srcset(r.img)}" sizes="(max-width: 899px) 88vw, 400px" alt="${r.name}" loading="lazy" decoding="async">
        ${r.tag ? `<span class="room__tag">${r.tag}</span>` : ''}
      </div>
      <div class="room__body">
        <span class="room__n">N.º 0${i + 1}</span>
        <h3>${r.name}</h3>
        <p class="room__meta">${r.beds} · hasta ${r.max} personas</p>
        <p class="room__perks">${r.perks.join(' · ')}</p>
        <div class="room__foot">
          <div class="room__price">
            <s>${money(r.price)}</s>
            <strong>${money(direct(r.price))}</strong>
            <small>por noche, reserva directa</small>
          </div>
          <button class="btn btn--solid btn--sm" data-open-booking data-room="${r.id}">Elegir</button>
        </div>
      </div>
    </article>`).join('') + `
    <article class="room room--group">
      <p class="label">Grupos y celebraciones</p>
      <h3>¿Vienen varios? <em>Reserva la casa entera.</em></h3>
      <p>Retiros, cumpleaños tranquilos o viajes de amigos con tarifa especial.</p>
      <a class="btn btn--line" href="https://wa.me/${H.whatsapp}?text=${encodeURIComponent('Hola, quiero cotizar el hotel completo para un grupo')}" target="_blank" rel="noopener">Cotizar por WhatsApp</a>
    </article>`;

  // Precio ancla en la barra fija
  document.getElementById('dockPrice').textContent = money(Math.min(...H.rooms.map(r => direct(r.price))));

  // ---------- Galería ----------
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = H.gallery.map((g, i) => `
    <figure class="g ${g.size ? 'g--' + g.size : ''}" data-full="${g.src}">
      <div class="g__img"><img src="${mobileSrc(g.src)}" srcset="${srcset(g.src)}" sizes="(max-width: 899px) 50vw, 25vw" alt="${g.alt}" loading="lazy" decoding="async"></div>
      <figcaption><span>${String(i + 1).padStart(2, '0')}</span> ${g.alt}</figcaption>
    </figure>`).join('');

  const lb = document.getElementById('lightbox');
  grid.addEventListener('click', e => {
    const item = e.target.closest('.g');
    if (!item) return;
    const img = lb.querySelector('img');
    img.src = isMobile ? mobileSrc(item.dataset.full) : item.dataset.full;
    img.alt = item.querySelector('img').alt;
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    window.lenis && window.lenis.stop();
  });
  const closeLb = () => { lb.classList.remove('is-open'); window.lenis && window.lenis.start(); setTimeout(() => (lb.hidden = true), 350); };
  lb.addEventListener('click', closeLb);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !lb.hidden) closeLb(); });

  // ---------- Rueda zodiacal ----------
  const signs = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
  let z = '<circle cx="200" cy="200" r="196" class="w-line"/><circle cx="200" cy="200" r="160" class="w-line"/><circle cx="200" cy="200" r="104" class="w-line w-thin"/><circle cx="200" cy="200" r="44" class="w-line w-thin"/>';
  signs.forEach((s, i) => {
    const a = (i * 30 - 90) * Math.PI / 180, a2 = ((i * 30 + 15) - 90) * Math.PI / 180;
    z += `<line x1="${200 + 160 * Math.cos(a)}" y1="${200 + 160 * Math.sin(a)}" x2="${200 + 196 * Math.cos(a)}" y2="${200 + 196 * Math.sin(a)}" class="w-line"/>`;
    z += `<text x="${200 + 178 * Math.cos(a2)}" y="${200 + 178 * Math.sin(a2)}" class="w-sign">${s}︎</text>`;
    z += `<line x1="200" y1="200" x2="${200 + 104 * Math.cos(a)}" y2="${200 + 104 * Math.sin(a)}" class="w-line w-thin"/>`;
  });
  for (let i = 0; i < 72; i++) {
    const a = i * 5 * Math.PI / 180, r1 = i % 6 === 0 ? 148 : 154;
    z += `<line x1="${200 + r1 * Math.cos(a)}" y1="${200 + r1 * Math.sin(a)}" x2="${200 + 160 * Math.cos(a)}" y2="${200 + 160 * Math.sin(a)}" class="w-line w-thin"/>`;
  }
  document.getElementById('zodiac').innerHTML = `<g id="zodiacSpin">${z}</g><path d="M200 168 l7 25 25 7 -25 7 -7 25 -7 -25 -25 -7 25 -7z" class="w-core"/>`;

  // ---------- Cielo, calendario y signo ----------
  Sky.renderSkySection();
  const isoLocal = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  Sky.calendar({ onRange: (a, b) => setTimeout(() => Booking.open({ checkin: isoLocal(a), checkout: isoLocal(b) }), 350) });

  const daySel = document.getElementById('signDay');
  daySel.innerHTML = Array.from({ length: 31 }, (_, i) => `<option>${i + 1}</option>`).join('');
  document.getElementById('signForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    const s = Sky.sunSign(+f.d.value, +f.m.value);
    const card = document.getElementById('signCard');
    document.getElementById('signGlyph').textContent = s.g + '︎';
    document.getElementById('signMeta').textContent = `Tu signo solar · ${s.e}`;
    document.getElementById('signName').textContent = s.n;
    document.getElementById('signText').textContent = s.t;
    card.classList.remove('is-revealed'); void card.offsetWidth; card.classList.add('is-revealed');
  });

  // ---------- Mapa bajo demanda ----------
  const mapBtn = document.getElementById('mapFacade');
  mapBtn.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.title = 'Mapa del hotel'; f.src = mapBtn.dataset.src; f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    mapBtn.replaceWith(f);
  });

  // ---------- Menú ----------
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');
  const mm = document.getElementById('mobileMenu');
  const toggleMenu = open => {
    mm.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    document.documentElement.classList.toggle('menu-open', open);
  };
  burger.addEventListener('click', () => toggleMenu(!mm.classList.contains('is-open')));
  mm.addEventListener('click', e => { if (e.target.closest('a')) toggleMenu(false); });

  // ---------- Cielo estrellado (canvas fijo) ----------
  const canvas = document.getElementById('stars');
  const ctx = canvas.getContext('2d');
  let stars = [], W, Hh, running = false, shooting = null;
  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    W = innerWidth; Hh = innerHeight;
    canvas.width = W * dpr; canvas.height = Hh * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.round((W * Hh) / (isMobile ? 4200 : 2800)) }, () => ({
      x: Math.random() * W, y: Math.random() * Hh, r: Math.random() * 1.1 + 0.25,
      tw: Math.random() * 6.3, sp: Math.random() * 0.025 + 0.004
    }));
  }
  function draw() {
    if (!running) return;
    ctx.clearRect(0, 0, W, Hh);
    ctx.fillStyle = '#f6eedf';
    for (const s of stars) {
      s.tw += s.sp;
      ctx.globalAlpha = Math.max(0, 0.35 + Math.sin(s.tw) * 0.35 + 0.3 * (s.r / 1.35));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    }
    if (!shooting && Math.random() < 0.003) shooting = { x: Math.random() * W * 0.6 + W * 0.35, y: Math.random() * Hh * 0.35, l: 0 };
    if (shooting) {
      shooting.l += 13;
      const x = shooting.x - shooting.l, y = shooting.y + shooting.l * 0.42;
      const g = ctx.createLinearGradient(x, y, x + 110, y - 46);
      g.addColorStop(0, 'rgba(255,244,222,.95)'); g.addColorStop(1, 'rgba(255,244,222,0)');
      ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 110, y - 46); ctx.stroke();
      if (shooting.l > 380) shooting = null;
    }
    requestAnimationFrame(draw);
  }
  function setSky(op) {
    canvas.style.opacity = op;
    const on = op > 0.02;
    if (reduced) { if (on) { running = true; draw(); running = false; } return; }
    if (on && !running) { running = true; requestAnimationFrame(draw); }
    if (!on) running = false;
  }
  sizeCanvas();
  let lastW = innerWidth;
  addEventListener('resize', () => { if (!isMobile || Math.abs(innerWidth - lastW) > 40) { lastW = innerWidth; sizeCanvas(); } });

  // Color del navegador según día / noche
  const theme = document.querySelector('meta[name="theme-color"]');
  const setNight = on => {
    document.documentElement.classList.toggle('is-night', on);
    theme.setAttribute('content', on ? '#0b0d18' : '#efe6d6');
  };

  const curtain = document.getElementById('curtain');
  const dock = document.getElementById('dock');
  const nightEl = document.querySelector('.night');

  // ---------- Sin GSAP o con movimiento reducido ----------
  function basicScroll() {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 30);
    document.documentElement.classList.toggle('is-scrolled-top', y > 30);
    dock.classList.toggle('is-visible', y > innerHeight * 0.8);
    const n = nightEl.getBoundingClientRect().top < innerHeight * 0.5;
    setNight(n); setSky(n ? 1 : 0);
  }
  if (!window.gsap || reduced) {
    curtain.remove();
    document.documentElement.classList.add('no-motion');
    addEventListener('scroll', basicScroll, { passive: true });
    basicScroll();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  window.lenis = lenis;
  lenis.on('scroll', e => {
    ScrollTrigger.update();
    nav.classList.toggle('is-scrolled', e.scroll > 30);
    document.documentElement.classList.toggle('is-scrolled-top', e.scroll > 30);
    dock.classList.toggle('is-visible', e.scroll > innerHeight * 0.8);
  });
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -60, duration: 1.6 }); }
  }));

  // Entrada: cortina corta, el arco se abre y el título sube línea por línea
  lenis.stop();
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .to('#curtain svg', { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' })
    .to('#curtain', { yPercent: -100, duration: isMobile ? 0.8 : 1, ease: 'expo.inOut' }, '+=0.15')
    .from('.hero__arch', { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 0 0)', duration: 1.6 }, '-=0.55')
    .from('.hero__arch img', { scale: 1.3, duration: 2 }, '<')
    .from('.hero__title .ln > span', { yPercent: 105, duration: 1.2, stagger: 0.09 }, '<0.1')
    .from(['.hero__kicker', '.hero__lead', '.quickbook', '.assurance'], { opacity: 0, y: 24, duration: 1, stagger: 0.08 }, '<0.35')
    .from(['.seal', '.proof', '.caption'], { opacity: 0, duration: 1 }, '<0.2')
    .from(['.nav', '.topline'], { opacity: 0, duration: 0.8 }, '<')
    .add(() => { curtain.remove(); lenis.start(); });

  // Hero: parallax suave y sello que gira
  gsap.to('.hero__arch img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.seal__text', { rotation: 360, svgOrigin: '100 100', ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=1500', scrub: 1 } });

  // Títulos de sección: cada línea sube
  document.querySelectorAll('.display').forEach(h => {
    h.innerHTML = h.innerHTML.split('<br>').map(l => `<span class="ln"><span>${l}</span></span>`).join('');
    gsap.from(h.querySelectorAll('.ln > span'), { yPercent: 105, duration: 1.1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
  });
  gsap.utils.toArray('.label:not(.hero__kicker)').forEach(l => gsap.from(l, { opacity: 0, x: -14, duration: 0.8, scrollTrigger: { trigger: l, start: 'top 92%' } }));

  // Intro: el texto grande se ilumina mientras se lee
  const big = document.querySelector('.intro__big');
  big.innerHTML = big.innerHTML.replace(/(<em>.*?<\/em>|[^\s<]+)/g, '<span class="w">$1</span>');
  gsap.fromTo('.intro__big .w', { opacity: 0.16 }, { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: big, start: 'top 80%', end: 'bottom 50%', scrub: true } });
  gsap.from('.intro__side > *', { opacity: 0, y: 30, stagger: 0.12, duration: 1, scrollTrigger: { trigger: '.intro__side', start: 'top 80%' } });

  // Razones: las imágenes se abren en arco
  gsap.utils.toArray('.arch-reveal').forEach(m => {
    gsap.fromTo(m, { clipPath: 'inset(35% 12% 0% 12% round 999px 999px 0 0)' }, { clipPath: 'inset(0% 0% 0% 0% round 999px 999px 0 0)', ease: 'none', scrollTrigger: { trigger: m, start: 'top 95%', end: 'top 35%', scrub: true } });
    gsap.fromTo(m.querySelector('img'), { scale: 1.25, yPercent: -5 }, { scale: 1, yPercent: 5, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.utils.toArray('.reason__copy').forEach(c => gsap.from(c.querySelectorAll('.reason__n, p, .link-arrow'), { opacity: 0, y: 26, stagger: 0.1, duration: 1, scrollTrigger: { trigger: c, start: 'top 80%' } }));
  gsap.to('#zodiacSpin', { rotation: 120, svgOrigin: '200 200', ease: 'none', scrollTrigger: { trigger: '.reason__media--wheel', start: 'top bottom', end: 'bottom top', scrub: 1 } });

  // Habitaciones: recorrido horizontal en escritorio
  const mq = gsap.matchMedia();
  mq.add('(min-width: 900px)', () => {
    const dist = () => track.scrollWidth - innerWidth + 80;
    const tween = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.rooms', start: 'top top', end: () => '+=' + dist(), pin: '.rooms__pin', scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 } });
    track.querySelectorAll('.room__media img').forEach(img => gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: img.closest('.room'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } }));
  });
  mq.add('(max-width: 899px)', () => {
    gsap.utils.toArray('.room').forEach(r => gsap.from(r, { opacity: 0, y: 40, duration: 0.9, scrollTrigger: { trigger: r, start: 'top 90%' } }));
  });

  // Desierto y opiniones
  gsap.utils.toArray('.desert__list li').forEach(li => gsap.from(li, { opacity: 0, y: 30, duration: 0.9, scrollTrigger: { trigger: li, start: 'top 90%' } }));
  gsap.from('.voices__score strong', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.voices', start: 'top 75%' } });
  gsap.from('.voices blockquote', { opacity: 0, y: 30, stagger: 0.15, duration: 1, scrollTrigger: { trigger: '.voices__quotes', start: 'top 80%' } });

  // Atardecer: el fondo pasa de arena a noche y aparecen las estrellas
  ScrollTrigger.create({
    trigger: '.dusk', start: 'top bottom', end: 'bottom bottom', scrub: true,
    onUpdate: s => setSky(Math.max(0, (s.progress - 0.35) / 0.65)),
    onLeave: () => setSky(1), onLeaveBack: () => setSky(0)
  });
  ScrollTrigger.create({ trigger: '.night', start: 'top 60%', onEnter: () => setNight(true), onLeaveBack: () => setNight(false) });
  gsap.fromTo('.dusk__line', { opacity: 0, y: 40 }, { opacity: 1, y: 0, ease: 'none', scrollTrigger: { trigger: '.dusk', start: 'top 60%', end: 'top 20%', scrub: true } });
  gsap.fromTo('.dusk__big', { opacity: 0, scale: 0.9, letterSpacing: '0.08em' }, { opacity: 1, scale: 1, letterSpacing: '-0.02em', ease: 'none', scrollTrigger: { trigger: '.dusk', start: 'top 40%', end: 'center 40%', scrub: true } });

  // Noche
  gsap.from('.tonight, .showers li', { opacity: 0, y: 24, stagger: 0.1, duration: 1, scrollTrigger: { trigger: '.tonight', start: 'top 85%' } });
  gsap.from('.cal', { opacity: 0, y: 50, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.cal', start: 'top 85%' } });
  gsap.from('.astro__card', { opacity: 0, y: 50, rotate: -2, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.astro', start: 'top 70%' } });
  gsap.from('.compare__row', { opacity: 0, y: 20, stagger: 0.08, duration: 0.8, scrollTrigger: { trigger: '.compare__table', start: 'top 82%' } });
  gsap.utils.toArray('.g').forEach((g, i) => {
    gsap.fromTo(g.querySelector('.g__img'), { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.3, ease: 'expo.out', delay: (i % 3) * 0.06, scrollTrigger: { trigger: g, start: 'top 92%' } });
  });
  gsap.from('.info__faq details', { opacity: 0, y: 16, stagger: 0.06, duration: 0.7, scrollTrigger: { trigger: '.info__faq', start: 'top 80%' } });
  gsap.from('.finale > *', { opacity: 0, y: 40, stagger: 0.12, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.finale', start: 'top 70%' } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
