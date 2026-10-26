// Motor de reservas directo: fechas → habitación → extras → datos → WhatsApp / API.
(function () {
  const H = window.HOTEL;
  const DAY = 86400000;
  const money = n => '$' + Math.round(n).toLocaleString('es-CO');

  const modal = document.getElementById('booking');
  const form = document.getElementById('bookingForm');
  const steps = [...form.querySelectorAll('.step')];
  const stepLabels = [...document.querySelectorAll('#steps li')];
  const prevBtn = document.getElementById('prevStep');
  const nextBtn = document.getElementById('nextStep');
  const errorEl = document.getElementById('formError');
  const summaryEl = document.getElementById('summary');

  const state = { step: 0, room: null, extras: new Set() };

  const toISO = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const parse = s => (s ? new Date(s + 'T12:00:00') : null);

  function nights() {
    const a = parse(form.checkin.value), b = parse(form.checkout.value);
    if (!a || !b) return 0;
    return Math.max(0, Math.round((b - a) / DAY));
  }

  function setMinDates() {
    const today = toISO(new Date());
    form.checkin.min = today;
    const ci = parse(form.checkin.value);
    form.checkout.min = ci ? toISO(new Date(ci.getTime() + DAY)) : today;
    if (ci && parse(form.checkout.value) <= ci) form.checkout.value = toISO(new Date(ci.getTime() + DAY));
  }

  // --- Render habitaciones y extras ---
  function renderRooms() {
    const guests = +form.guests.value;
    document.getElementById('roomOptions').innerHTML = H.rooms.map(r => {
      const disabled = r.max < guests;
      return `<label class="room-opt ${disabled ? 'is-disabled' : ''}">
        <input type="radio" name="room" value="${r.id}" ${disabled ? 'disabled' : ''} ${state.room === r.id ? 'checked' : ''}>
        <img src="${r.img.replace('.webp', '-m.webp')}" alt="" loading="lazy" decoding="async">
        <div class="room-opt__body">
          <strong>${r.name}</strong>
          <small>${r.beds} · hasta ${r.max} personas</small>
          ${disabled ? '<small class="warn">No disponible para ' + guests + ' huéspedes</small>' : ''}
        </div>
        <div class="room-opt__price"><s>${money(r.price)}</s><strong>${money(r.price * (1 - H.directDiscount))}</strong><small>por noche</small></div>
      </label>`;
    }).join('');
  }

  function renderExtras() {
    document.getElementById('extrasList').innerHTML = H.extras.map(x => `
      <label class="extra">
        <input type="checkbox" name="extra" value="${x.id}" ${state.extras.has(x.id) ? 'checked' : ''}>
        <span class="extra__box"></span>
        <div><strong>${x.name}</strong><small>${x.desc}</small></div>
        <span class="extra__price">${money(x.price)}</span>
      </label>`).join('');
  }

  // Cielo de cada noche de la estadía
  function renderNightSky() {
    const box = document.getElementById('nightSky');
    const n = nights();
    if (!n) { box.innerHTML = ''; return; }
    const start = parse(form.checkin.value);
    const items = [];
    for (let i = 0; i < Math.min(n, 7); i++) {
      const d = new Date(start.getTime() + i * DAY);
      d.setHours(22);
      const m = Sky.moon(d), dark = Sky.darkness(d);
      items.push(`<li><span class="moon moon--xs" data-date="${d.toISOString()}"><span class="moon__shadow"></span></span><div><strong>${d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}</strong><small>${m.name} · cielo ${Sky.rating(dark).toLowerCase()}</small></div></li>`);
    }
    box.innerHTML = `<p class="night-sky__title">El cielo durante tu estadía</p><ul>${items.join('')}</ul>`;
    box.querySelectorAll('.moon').forEach(el => Sky.paintMoon(el, new Date(el.dataset.date)));
  }

  // --- Totales ---
  function totals() {
    const n = nights(), g = +form.guests.value;
    const room = H.rooms.find(r => r.id === state.room);
    const base = room ? room.price * n : 0;
    const discount = base * H.directDiscount;
    let extras = 0;
    const lines = [];
    state.extras.forEach(id => {
      const x = H.extras.find(e => e.id === id);
      const mult = x.per === 'guest-night' ? g * n : x.per === 'guest' ? g : 1;
      extras += x.price * mult;
      lines.push({ name: x.name, amount: x.price * mult });
    });
    return { n, g, room, base, discount, extras, lines, total: base - discount + extras };
  }

  function renderSummary() {
    const t = totals();
    if (!t.n) { summaryEl.innerHTML = '<span class="muted">Selecciona tus fechas</span>'; return; }
    const head = `<span>${t.n} noche${t.n > 1 ? 's' : ''} · ${t.g} huésped${t.g > 1 ? 'es' : ''}${t.room ? ' · ' + t.room.name : ''}</span>`;
    if (!t.room) { summaryEl.innerHTML = head; return; }
    summaryEl.innerHTML = `${head}
      <div class="summary__total"><small>Ahorras ${money(t.discount)} reservando directo</small><strong>${money(t.total)}</strong></div>`;
  }

  // --- Navegación de pasos ---
  function go(i) {
    state.step = i;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    stepLabels.forEach((l, k) => { l.classList.toggle('is-active', k === i); l.classList.toggle('is-done', k < i); });
    prevBtn.style.visibility = i === 0 ? 'hidden' : 'visible';
    nextBtn.textContent = i === steps.length - 1 ? 'Enviar solicitud' : 'Continuar';
    errorEl.textContent = '';
    if (i === 1) renderRooms();
    if (i === 2) renderExtras();
    if (window.gsap) gsap.fromTo(steps[i].children, { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.5, ease: 'power3.out' });
  }

  function validate() {
    if (state.step === 0) {
      if (!form.checkin.value || !form.checkout.value) return 'Elige fecha de llegada y salida.';
      if (nights() < 1) return 'La salida debe ser después de la llegada.';
    }
    if (state.step === 1 && !state.room) return 'Elige una habitación.';
    if (state.step === 3) {
      if (!form.elements['name'].value.trim()) return 'Escribe tu nombre.';
      if (form.phone.value.replace(/\D/g, '').length < 7) return 'Escribe un número de WhatsApp válido.';
      if (!form.terms.checked) return 'Debes aceptar las normas de la casa.';
    }
    return '';
  }

  async function submit() {
    const t = totals();
    const ci = parse(form.checkin.value), co = parse(form.checkout.value);
    const f = d => d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    const payload = {
      checkin: form.checkin.value, checkout: form.checkout.value, nights: t.n, guests: t.g,
      room: t.room.id, extras: [...state.extras], pet: form.pet.checked,
      name: form.elements['name'].value.trim(), phone: form.phone.value.trim(), email: form.email.value.trim(),
      arrival: form.arrival.value, notes: form.notes.value.trim(), total: Math.round(t.total), source: 'web'
    };

    if (H.apiEndpoint) {
      try {
        await fetch(H.apiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } catch (e) { /* si falla, la solicitud igual sale por WhatsApp */ }
    }

    const msg = [
      '✨ *Nueva solicitud de reserva — web*',
      '',
      `👤 ${payload.name}`,
      `📅 ${f(ci)} → ${f(co)} (${t.n} noche${t.n > 1 ? 's' : ''})`,
      `🛏️ ${t.room.name} · ${t.g} huésped${t.g > 1 ? 'es' : ''}${payload.pet ? ' · con mascota 🐾' : ''}`,
      ...t.lines.map(l => `➕ ${l.name}: ${money(l.amount)}`),
      `💰 Total estimado: *${money(t.total)}* (incluye -${H.directDiscount * 100}% reserva directa)`,
      `🕑 Llegada: ${payload.arrival}`,
      payload.notes ? `📝 ${payload.notes}` : '',
      payload.email ? `✉️ ${payload.email}` : '',
      `📱 ${payload.phone}`
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/${H.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');

    form.closest('.booking__panel').classList.add('is-sent');
    summaryEl.innerHTML = `<div class="sent"><strong>¡Solicitud lista!</strong><span>Envía el mensaje en WhatsApp y te confirmamos disponibilidad en minutos.</span></div>`;
    nextBtn.textContent = 'Cerrar';
    nextBtn.dataset.done = '1';
  }

  nextBtn.addEventListener('click', () => {
    if (nextBtn.dataset.done) { close(); return; }
    const err = validate();
    if (err) { errorEl.textContent = err; return; }
    if (state.step < steps.length - 1) go(state.step + 1);
    else submit();
  });
  prevBtn.addEventListener('click', () => state.step > 0 && go(state.step - 1));

  form.addEventListener('change', e => {
    if (e.target.name === 'room') state.room = e.target.value;
    if (e.target.name === 'extra') e.target.checked ? state.extras.add(e.target.value) : state.extras.delete(e.target.value);
    if (e.target.name === 'checkin' || e.target.name === 'checkout') { setMinDates(); renderNightSky(); }
    if (e.target.name === 'guests') {
      const r = H.rooms.find(x => x.id === state.room);
      if (r && r.max < +form.guests.value) state.room = null;
    }
    renderSummary();
  });

  // --- Abrir / cerrar ---
  let lastFocus;
  function open(opts = {}) {
    lastFocus = document.activeElement;
    form.closest('.booking__panel').classList.remove('is-sent');
    delete nextBtn.dataset.done;
    if (opts.checkin) form.checkin.value = opts.checkin;
    if (opts.checkout) form.checkout.value = opts.checkout;
    if (opts.guests) form.guests.value = opts.guests;
    if (opts.room) state.room = opts.room;
    if (opts.extra) state.extras.add(opts.extra);
    setMinDates();
    renderNightSky();
    renderSummary();
    modal.hidden = false;
    document.documentElement.classList.add('modal-open');
    window.lenis && window.lenis.stop();
    requestAnimationFrame(() => modal.classList.add('is-open'));
    const startStep = opts.checkin && opts.checkout ? (opts.room ? 2 : 1) : 0;
    go(startStep);
    setTimeout(() => modal.querySelector('.icon-btn').focus(), 50);
  }

  function close() {
    modal.classList.remove('is-open');
    document.documentElement.classList.remove('modal-open');
    window.lenis && window.lenis.start();
    setTimeout(() => { modal.hidden = true; lastFocus && lastFocus.focus(); }, 450);
  }

  document.addEventListener('click', e => {
    const opener = e.target.closest('[data-open-booking]');
    if (opener) {
      e.preventDefault();
      document.getElementById('mobileMenu').classList.remove('is-open');
      open({ room: opener.dataset.room, extra: opener.dataset.extra });
    }
    const dateBtn = e.target.closest('[data-book-dates]');
    if (dateBtn) {
      const d = new Date(dateBtn.dataset.bookDates);
      open({ checkin: toISO(d), checkout: toISO(new Date(d.getTime() + DAY)) });
    }
    if (e.target.closest('[data-close-booking]')) close();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });

  // Barra rápida del hero
  const qb = document.getElementById('quickbook');
  qb.in.min = toISO(new Date());
  qb.in.addEventListener('change', () => {
    const d = parse(qb.in.value);
    if (d) { qb.out.min = toISO(new Date(d.getTime() + DAY)); if (!qb.out.value || parse(qb.out.value) <= d) qb.out.value = qb.out.min; }
  });
  qb.addEventListener('submit', e => {
    e.preventDefault();
    open({ checkin: qb.in.value, checkout: qb.out.value, guests: qb.guests.value });
  });

  window.Booking = { open, close };
})();
