// Cálculos del cielo (sin APIs externas): fase lunar, lluvias de estrellas,
// calendario lunar interactivo y signo solar.
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

  // Calidad de cielo oscuro 0–100 (menos iluminación = mejor)
  const darkness = date => Math.round((1 - moon(date).illum) * 100);

  function rating(d) {
    if (d >= 85) return 'Excelente';
    if (d >= 60) return 'Muy buena';
    if (d >= 35) return 'Buena';
    return 'Luna brillante';
  }

  // Pinta una luna (.moon con .moon__shadow) según la fecha
  function paintMoon(el, date) {
    const m = moon(date);
    const shadow = el.querySelector('.moon__shadow');
    const waxing = m.phase < 0.5;
    const k = waxing ? m.phase * 2 : (1 - m.phase) * 2; // 0 = cubierta, 1 = llena
    shadow.style.transform = `translateX(${waxing ? '-' : ''}${k * 100}%)`;
    el.style.setProperty('--glow', (0.1 + m.illum * 0.5).toFixed(2));
    return m;
  }

  // Lluvias de estrellas (máximos aproximados)
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
    const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    [from.getFullYear(), from.getFullYear() + 1].forEach(yr => SHOWERS.forEach(s => {
      const date = new Date(yr, s.m, s.d, 22);
      if (date >= today) out.push({ ...s, date });
    }));
    return out.sort((a, b) => a.date - b.date).slice(0, n);
  }

  function nextNewMoon(from) {
    const left = SYNODIC - moonAge(from);
    return new Date(from.getTime() + left * DAY);
  }

  const fmt = (d, opts) => d.toLocaleDateString('es-CO', opts || { day: 'numeric', month: 'short' });

  // ---------- Signo solar ----------
  const SIGNS = [
    { n: 'Capricornio', g: '♑', e: 'Tierra', from: [11, 22], t: 'Llegas con plan y te vas con una certeza. Tu noche ideal: el amanecer en el desierto rojo, en silencio.' },
    { n: 'Acuario', g: '♒', e: 'Aire', from: [0, 20], t: 'Lo tuyo es mirar lejos. Tu noche ideal: la terraza a oscuras, buscando la estación espacial entre las estrellas.' },
    { n: 'Piscis', g: '♓', e: 'Agua', from: [1, 19], t: 'Sientes todo. Tu noche ideal: la piscina al atardecer y la Vía Láctea apareciendo poco a poco.' },
    { n: 'Aries', g: '♈', e: 'Fuego', from: [2, 21], t: 'Primero en llegar, último en dormir. Tu noche ideal: caminar el desierto rojo y cerrar con estrellas fugaces.' },
    { n: 'Tauro', g: '♉', e: 'Tierra', from: [3, 20], t: 'Placer sin prisa. Tu noche ideal: buena cena, vino en la terraza y cielo despejado.' },
    { n: 'Géminis', g: '♊', e: 'Aire', from: [4, 21], t: 'Quieres verlo todo. Tu noche ideal: observatorio primero, terraza después, conversación hasta tarde.' },
    { n: 'Cáncer', g: '♋', e: 'Agua', from: [5, 21], t: 'Tu hogar es la gente. Tu noche ideal: un cuarto amplio, los tuyos y la luna sobre el patio.' },
    { n: 'Leo', g: '♌', e: 'Fuego', from: [6, 23], t: 'Naciste para brillar. Tu noche ideal: fotos bajo la Vía Láctea que nadie va a creer.' },
    { n: 'Virgo', g: '♍', e: 'Tierra', from: [7, 23], t: 'Te fijas en los detalles. Tu noche ideal: identificar constelaciones una por una con el telescopio.' },
    { n: 'Libra', g: '♎', e: 'Aire', from: [8, 23], t: 'Buscas la armonía. Tu noche ideal: plan en pareja, terraza y la luna nueva para ustedes.' },
    { n: 'Escorpio', g: '♏', e: 'Agua', from: [9, 23], t: 'Te atrae lo profundo. Tu noche ideal: tu carta astral leída en el desierto.' },
    { n: 'Sagitario', g: '♐', e: 'Fuego', from: [10, 22], t: 'Eres de horizontes. Tu noche ideal: el desierto gris de día y la lluvia de estrellas de noche.' }
  ];
  function sunSign(day, month) {
    // recorre de atrás hacia adelante buscando el inicio más reciente
    let sign = SIGNS[0];
    for (const s of SIGNS.slice(1)) if (month > s.from[0] || (month === s.from[0] && day >= s.from[1])) sign = s;
    if (month === 11 && day >= 22) sign = SIGNS[0];
    return sign;
  }

  // ---------- Calendario lunar ----------
  function calendar(opts) {
    const grid = document.getElementById('calGrid');
    if (!grid) return;
    const title = document.getElementById('calTitle');
    const hint = document.getElementById('calHint');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let view = new Date(today.getFullYear(), today.getMonth(), 1);
    let start = null, end = null;

    function render() {
      const t = view.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
      title.textContent = t.charAt(0).toUpperCase() + t.slice(1);
      const firstDow = (view.getDay() + 6) % 7; // lunes = 0
      const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      let html = '';
      for (let i = 0; i < firstDow; i++) html += '<span class="cal__cell cal__cell--empty"></span>';
      for (let d = 1; d <= days; d++) {
        const date = new Date(view.getFullYear(), view.getMonth(), d);
        const night = new Date(date); night.setHours(22);
        const dark = darkness(night);
        const past = date < today;
        const cls = ['cal__cell'];
        if (past) cls.push('is-past');
        if (dark >= 85) cls.push('is-best'); else if (dark >= 60) cls.push('is-good');
        if (start && date.getTime() === start.getTime()) cls.push('is-start');
        if (end && date.getTime() === end.getTime()) cls.push('is-end');
        if (start && end && date > start && date < end) cls.push('is-range');
        if (date.getTime() === today.getTime()) cls.push('is-today');
        html += `<button type="button" class="${cls.join(' ')}" data-d="${date.getTime()}" ${past ? 'disabled' : ''} aria-label="${fmt(date, { weekday: 'long', day: 'numeric', month: 'long' })}, ${moon(night).name}, cielo ${rating(dark).toLowerCase()}">
          <span class="cal__num">${d}</span><span class="moon moon--cal" data-night="${night.getTime()}"><span class="moon__shadow"></span></span></button>`;
      }
      grid.innerHTML = html;
      grid.querySelectorAll('.moon').forEach(m => paintMoon(m, new Date(+m.dataset.night)));
      document.getElementById('calPrev').disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
    }

    grid.addEventListener('click', e => {
      const b = e.target.closest('.cal__cell[data-d]');
      if (!b || b.disabled) return;
      const date = new Date(+b.dataset.d);
      if (!start || end || date <= start) {
        start = date; end = null;
        hint.textContent = `Llegada ${fmt(date)} · ahora toca tu salida`;
      } else {
        end = date;
        const n = Math.round((end - start) / DAY);
        hint.textContent = `${n} noche${n > 1 ? 's' : ''} seleccionada${n > 1 ? 's' : ''}`;
        opts && opts.onRange && opts.onRange(start, end);
      }
      render();
    });
    document.getElementById('calPrev').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render(); });
    document.getElementById('calNext').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(); });
    render();
  }

  // ---------- Textos del cielo de hoy ----------
  function renderSkySection() {
    const now = new Date();
    const m = moon(now);
    const nn = nextNewMoon(now);
    const daysToNew = Math.round((nn - now) / DAY);
    const newMoonTxt = daysToNew <= 1 ? 'luna nueva esta noche' : `próxima luna nueva en ${daysToNew} días (${fmt(nn)})`;

    const tl = document.getElementById('toplineText');
    if (tl) {
      tl.textContent = `Esta noche en la Tatacoa: ${m.name.toLowerCase()} · ${newMoonTxt}`;
      paintMoon(document.getElementById('toplineMoon'), now);
    }
    const el = document.getElementById('moonNow');
    if (el) {
      paintMoon(el, now);
      document.getElementById('moonName').textContent = m.name;
      document.getElementById('moonInfo').textContent = `Iluminada al ${Math.round(m.illum * 100)}% · ${newMoonTxt}`;
    }
    const sh = document.getElementById('showers');
    if (sh) {
      sh.innerHTML = upcomingShowers(now, 3).map(s => {
        const days = Math.ceil((s.date - now) / DAY);
        const good = darkness(s.date) >= 60;
        return `<li><strong>${s.name}</strong><span>${fmt(s.date, { day: 'numeric', month: 'long' })} · hasta ${s.rate} por hora${good ? ' · cielo oscuro' : ''}</span><em>${days <= 0 ? 'hoy' : 'en ' + days + ' días'}</em></li>`;
      }).join('');
    }
    const fm = document.getElementById('finaleMoon');
    if (fm) fm.textContent = `Próxima luna nueva: ${fmt(nn, { weekday: 'long', day: 'numeric', month: 'long' })}`;
  }

  window.Sky = { moon, darkness, rating, paintMoon, renderSkySection, upcomingShowers, calendar, sunSign };
})();
