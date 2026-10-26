// Cálculos de fase lunar y lluvias de estrellas (sin APIs externas).
(function () {
  const SYNODIC = 29.530588853;
  const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // luna nueva de referencia
  const DAY = 86400000;

  function moonAge(date) {
    const days = (date.getTime() - REF_NEW_MOON) / DAY;
    return ((days % SYNODIC) + SYNODIC) % SYNODIC;
  }

  function moon(date) {
    const age = moonAge(date);
    const phase = age / SYNODIC;
    const illum = (1 - Math.cos(2 * Math.PI * phase)) / 2;
    let name;
    if (age < 1.5 || age > SYNODIC - 1.5) name = 'Luna nueva';
    else if (age < 6.4) name = 'Luna creciente';
    else if (age < 8.4) name = 'Cuarto creciente';
    else if (age < 13.8) name = 'Gibosa creciente';
    else if (age < 15.8) name = 'Luna llena';
    else if (age < 21.1) name = 'Gibosa menguante';
    else if (age < 23.1) name = 'Cuarto menguante';
    else name = 'Luna menguante';
    return { age, phase, illum, name };
  }

  // Calidad de cielo oscuro 0–100 (aprox.: menos iluminación = mejor)
  function darkness(date) {
    return Math.round((1 - moon(date).illum) * 100);
  }

  function rating(d) {
    if (d >= 85) return 'Excelente';
    if (d >= 60) return 'Muy buena';
    if (d >= 35) return 'Buena';
    return 'Luna brillante';
  }

  // Pintar una luna en un elemento .moon con su sombra
  function paintMoon(el, date) {
    const m = moon(date);
    const shadow = el.querySelector('.moon__shadow');
    // Desplaza la sombra: fase 0 = cubierta, 0.5 = descubierta
    const waxing = m.phase < 0.5;
    const k = waxing ? m.phase * 2 : (1 - m.phase) * 2; // 0..1
    const offset = k * 100;
    shadow.style.transform = `translateX(${waxing ? '-' : ''}${offset}%)`;
    el.style.setProperty('--glow', (0.15 + m.illum * 0.6).toFixed(2));
    return m;
  }

  // Lluvias de estrellas (fechas de máximo aproximadas)
  const SHOWERS = [
    { name: 'Oriónidas', m: 9, d: 21, rate: 20 },
    { name: 'Leónidas', m: 10, d: 17, rate: 15 },
    { name: 'Gemínidas', m: 11, d: 14, rate: 120 },
    { name: 'Cuadrántidas', m: 0, d: 3, rate: 110 },
    { name: 'Líridas', m: 3, d: 22, rate: 18 },
    { name: 'Eta Acuáridas', m: 4, d: 6, rate: 50 },
    { name: 'Delta Acuáridas', m: 6, d: 30, rate: 25 },
    { name: 'Perseidas', m: 7, d: 12, rate: 100 }
  ];

  function upcomingShowers(from, n) {
    const out = [];
    const y = from.getFullYear();
    [y, y + 1].forEach(yr => SHOWERS.forEach(s => {
      const date = new Date(yr, s.m, s.d, 22);
      if (date >= new Date(from.getFullYear(), from.getMonth(), from.getDate())) out.push({ ...s, date });
    }));
    return out.sort((a, b) => a.date - b.date).slice(0, n);
  }

  // Próximas noches con cielo más oscuro (agrupadas en ventanas)
  function bestNights(from, n) {
    const res = [];
    let d = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 22);
    for (let i = 0; i < 120 && res.length < n; i++) {
      const dark = darkness(d);
      if (dark >= 95) {
        const last = res[res.length - 1];
        if (last && (d - last.end) <= DAY * 1.01) last.end = new Date(d);
        else res.push({ start: new Date(d), end: new Date(d) });
      }
      d = new Date(d.getTime() + DAY);
    }
    return res;
  }

  const fmt = (d, opts) => d.toLocaleDateString('es-CO', opts || { day: 'numeric', month: 'short' });

  function renderSkySection() {
    const now = new Date();
    const el = document.getElementById('moonNow');
    if (!el) return;
    const m = paintMoon(el, now);
    const dark = darkness(now);
    document.getElementById('moonName').textContent = m.name;
    document.getElementById('moonInfo').textContent = `Iluminada al ${Math.round(m.illum * 100)}% · día ${Math.floor(m.age)} del ciclo lunar`;
    document.getElementById('moonDark').textContent = `${dark}/100 · ${rating(dark)}`;
    document.getElementById('moonMeter').style.width = dark + '%';

    document.getElementById('bestNights').innerHTML = bestNights(now, 4).map(w => {
      const same = w.start.toDateString() === w.end.toDateString();
      const label = same ? fmt(w.start, { weekday: 'short', day: 'numeric', month: 'short' }) : `${fmt(w.start)} – ${fmt(w.end)}`;
      return `<li><span class="mini-moon"></span><div><strong>${label}</strong><small>Luna nueva · cielo excelente</small></div><button type="button" class="link-btn" data-book-dates="${w.start.toISOString()}">Reservar</button></li>`;
    }).join('');

    document.getElementById('showers').innerHTML = upcomingShowers(now, 4).map(s => {
      const dark = darkness(s.date);
      const days = Math.ceil((s.date - now) / DAY);
      return `<li><div><strong>${s.name}</strong><small>${fmt(s.date, { day: 'numeric', month: 'long', year: 'numeric' })} · hasta ${s.rate}/h</small></div><span class="pill ${dark >= 60 ? 'pill--good' : ''}">${days <= 0 ? '¡Hoy!' : 'en ' + days + ' días'}</span></li>`;
    }).join('');
  }

  window.Sky = { moon, darkness, rating, paintMoon, renderSkySection, upcomingShowers };
})();
