/* Traverse UI: map, route builder, timer, result & ranking. */
(function () {
  'use strict';
  const T = window.Traverse, $ = s => document.querySelector(s);
  const ch = T.challenge(T.dayNumber());
  const bm = T.benchmarks(ch);
  const fld = T.field(ch, bm);
  let st = T.load();
  st.results = st.results || {};
  const official = st.results[ch.key];       // today's locked score, if any
  let practice = !!official;                 // replay after submitting = practice, unofficial

  /* ---------- state ---------- */
  let route = [];       // [{from,to,leg}]
  let pendingTo = null; // city selected but mode not yet chosen
  let t0 = 0, timer = null;
  const at = () => route.length ? T.byId[route[route.length - 1].to] : ch.from;
  const atDest = () => at().id === ch.to.id;
  const totals = () => route.reduce((a, r) => ({ cost: a.cost + r.leg.cost, hours: a.hours + r.leg.hours }), { cost: 0, hours: 0 });
  const elapsed = () => (performance.now() - t0) / 1000;

  /* ---------- header ---------- */
  $('#tv-day').textContent = '#' + ch.n + ' · ' + new Date(ch.key).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  $('#tv-challenge').innerHTML = `<span class="lbl">Daily Traverse</span>
    <div class="city">${ch.from.flag} ${T.esc(ch.from.name)}<small>${T.esc(ch.from.country)}</small></div>
    <div class="arrow">↓</div>
    <div class="city">${ch.to.flag} ${T.esc(ch.to.name)}<small>${T.esc(ch.to.country)}</small></div>
    <div class="dist">${Math.round(T.km(ch.from, ch.to)).toLocaleString()} km as the crow flies · no direct flight today · resets ${nextReset()}</div>`;
  function nextReset() {
    const ms = (T.dayNumber() * 86400000 + Date.UTC(2026, 0, 1)) - Date.now();
    const h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000);
    return 'in ' + h + 'h ' + m + 'm (00:00 UTC)';
  }

  /* ---------- map ---------- */
  const svg = d3.select('#tv-svg');
  const proj = d3.geoNaturalEarth1().fitSize([960, 500], { type: 'Sphere' });
  const path = d3.geoPath(proj);
  const feats = topojson.feature(WORLD_TOPO, WORLD_TOPO.objects.countries).features;
  const g = svg.append('g');
  g.append('path').attr('d', path({ type: 'Sphere' })).attr('fill', '#06182b');
  g.append('g').selectAll('path').data(feats).join('path').attr('class', 'tv-land').attr('d', path);
  const gLinks = g.append('g'), gCities = g.append('g'), gLabels = g.append('g');
  const pos = c => proj([c.lon, c.lat]);
  const cities = gCities.selectAll('circle').data(T.C).join('circle')
    .attr('class', c => 'tv-city' + (c.hub >= 2 ? ' hub' : '')).attr('r', c => 2.2 + c.hub * 0.6)
    .attr('cx', c => pos(c)[0]).attr('cy', c => pos(c)[1])
    .on('click', (e, c) => { e.stopPropagation(); pick(c); })
    .append('title').text(c => c.name + ', ' + c.country);
  const labels = gLabels.selectAll('text').data(T.C.filter(c => c.hub >= 2)).join('text').attr('class', 'tv-label')
    .attr('x', c => pos(c)[0] + 5).attr('y', c => pos(c)[1] + 3).text(c => c.name);
  const zoom = d3.zoom().scaleExtent([1, 9]).translateExtent([[0, 0], [960, 500]]).on('zoom', e => {
    g.attr('transform', e.transform);
    const k = e.transform.k;
    gCities.selectAll('circle').attr('r', c => (2.2 + c.hub * 0.6) / Math.sqrt(k));
    gLabels.selectAll('text').style('font-size', (10 / Math.sqrt(k)) + 'px').style('display', c => (c.hub >= 3 || k >= 2.2) ? null : 'none');
    gLinks.selectAll('path').style('stroke-width', (2 / Math.sqrt(k)));
  }).on('start', () => svg.classed('dragging', true)).on('end', () => svg.classed('dragging', false));
  svg.call(zoom);
  gLabels.selectAll('text').style('display', c => c.hub >= 3 ? null : 'none');
  $('#tv-zin').onclick = () => svg.transition().call(zoom.scaleBy, 1.6);
  $('#tv-zout').onclick = () => svg.transition().call(zoom.scaleBy, 1 / 1.6);
  $('#tv-zreset').onclick = () => svg.transition().call(zoom.transform, d3.zoomIdentity);
  function focusOn(a, b) {
    const [x0, y0] = pos(a), [x1, y1] = pos(b);
    const w = Math.max(80, Math.abs(x1 - x0) * 1.9), h = Math.max(60, Math.abs(y1 - y0) * 2.2);
    const k = Math.min(9, Math.max(1, 0.9 / Math.max(w / 960, h / 500)));
    svg.transition().duration(700).call(zoom.transform, d3.zoomIdentity.translate(480 - k * (x0 + x1) / 2, 250 - k * (y0 + y1) / 2).scale(k));
  }
  function arc(a, b) { return path({ type: 'LineString', coordinates: [[a.lon, a.lat], [b.lon, b.lat]] }); }

  function drawMap() {
    const cur = at();
    const reach = new Set(T.C.filter(c => T.legs(cur, c, ch.seed).length).map(c => c.id));
    const onRoute = new Set([ch.from.id, ...route.map(r => r.to)]);
    gCities.selectAll('circle').attr('class', c => 'tv-city' + (c.hub >= 2 ? ' hub' : '')
      + (c.id === ch.from.id ? ' start' : c.id === ch.to.id ? ' dest' : onRoute.has(c.id) ? ' on' : '')
      + (reach.has(c.id) && !onRoute.has(c.id) ? ' reach' : ''));
    const links = route.map(r => ({ cls: r.leg.mode, d: arc(T.byId[r.from], T.byId[r.to]) }));
    if (pendingTo) links.push({ cls: 'ghost', d: arc(cur, pendingTo) });
    if (!atDest()) links.push({ cls: 'ghost', d: arc(cur, ch.to) });
    gLinks.selectAll('path').data(links).join('path').attr('class', d => 'tv-link ' + d.cls).attr('d', d => d.d);
  }

  /* ---------- route panel ---------- */
  function renderLegs() {
    const ol = $('#tv-legs'); let h = `<li class="start"><span class="dot"></span><div class="stop">${ch.from.flag} ${T.esc(ch.from.name)}<small>start</small></div>`;
    route.forEach((r, i) => {
      const c = T.byId[r.to];
      h += `<div class="leg"><span>${r.leg.icon}</span><b>${T.money(r.leg.cost)}</b> · ${T.dur(r.leg.hours)}${r.leg.note ? ' · ' + r.leg.note : ''}
        ${i === route.length - 1 ? `<button class="x" title="Remove this leg" data-i="${i}">✕</button>` : ''}</div></li>
        <li class="${c.id === ch.to.id ? 'dest' : ''}"><span class="dot"></span><div class="stop">${c.flag} ${T.esc(c.name)}<small>${c.id === ch.to.id ? 'destination' : 'stop ' + (i + 1)}</small></div>`;
    });
    if (!atDest()) h += `<div class="pending">↓ choose the next stop…</div></li><li class="dest"><span class="dot"></span><div class="stop" style="opacity:.55">${ch.to.flag} ${T.esc(ch.to.name)}<small>destination</small></div></li>`;
    else h += '</li>';
    ol.innerHTML = h;
    ol.querySelectorAll('.x').forEach(b => (b.onclick = () => { route.splice(+b.dataset.i); pendingTo = null; refresh(); }));
    const tt = totals();
    $('#tv-cost').textContent = '💰 ' + T.money(tt.cost);
    $('#tv-time').textContent = '⏱️ ' + (route.length ? T.dur(tt.hours) : '0h');
    $('#tv-est').textContent = atDest() ? 'est. ' + T.score(tt.cost, tt.hours, elapsed(), bm).toLocaleString() : 'est. —';
    $('#tv-submit').disabled = !atDest();
    $('#tv-undo').disabled = !route.length;
  }

  function renderPicker() {
    const box = $('#tv-picker'), cur = at();
    if (atDest()) { box.innerHTML = `<p class="tv-none">🎉 You've reached ${T.esc(ch.to.name)}. Submit, or undo a leg to try a different idea.</p>`; return; }
    if (pendingTo) {
      const opts = T.legs(cur, pendingTo, ch.seed);
      const bc = Math.min(...opts.map(o => o.cost)), bt = Math.min(...opts.map(o => o.hours));
      box.innerHTML = `<h4>Travel from ${T.esc(cur.name)} to</h4><div class="to"><b>${pendingTo.flag} ${T.esc(pendingTo.name)}</b><span class="muted">${Math.round(T.km(cur, pendingTo)).toLocaleString()} km</span><button class="x" id="tv-unpick">change</button></div>
        <div class="tv-opts">${opts.map((o, i) => `<button class="tv-opt${o.cost === bc ? ' best-cost' : ''}${o.hours === bt ? ' best-time' : ''}" data-i="${i}"><span class="ic">${o.icon}</span><span class="nm">${o.name}<small>${o.note || ''}</small></span><span class="nums"><b>${T.money(o.cost)}</b><span>${T.dur(o.hours)}</span></span></button>`).join('')}</div>`;
      box.querySelectorAll('.tv-opt').forEach(b => (b.onclick = () => { route.push({ from: cur.id, to: pendingTo.id, leg: opts[+b.dataset.i] }); const p = pendingTo; pendingTo = null; refresh(); if (!atDest()) focusOn(p, ch.to); }));
      $('#tv-unpick').onclick = () => { pendingTo = null; refresh(); };
      return;
    }
    const near = T.C.filter(c => c.id !== cur.id && !route.some(r => r.to === c.id) && T.legs(cur, c, ch.seed).length)
      .map(c => ({ c, d: T.km(c, ch.to) })).sort((a, b) => a.d - b.d).slice(0, 7);
    box.innerHTML = `<h4>Next stop from ${T.esc(cur.name)}</h4>
      <div class="tv-search"><input type="search" id="tv-q" placeholder="Search a city…" autocomplete="off"><ul class="results" id="tv-res" hidden></ul></div>
      <div class="muted" style="font-size:.8rem">Closest to ${T.esc(ch.to.name)}:</div>
      <div class="tv-near">${near.map(n => `<button class="chip" data-id="${n.c.id}">${n.c.flag} ${T.esc(n.c.name)}</button>`).join('')}</div>`;
    box.querySelectorAll('.chip').forEach(b => (b.onclick = () => pick(T.byId[b.dataset.id])));
    const q = $('#tv-q'), res = $('#tv-res');
    q.oninput = () => {
      const v = q.value.trim().toLowerCase(); if (!v) { res.hidden = true; return; }
      const m = T.C.filter(c => c.id !== cur.id && (c.name.toLowerCase().includes(v) || c.country.toLowerCase().includes(v))).slice(0, 8);
      res.innerHTML = m.map(c => `<li data-id="${c.id}">${c.flag} ${T.esc(c.name)} <span class="muted">${T.esc(c.country)}${T.legs(cur, c, ch.seed).length ? '' : ' · no direct link'}</span></li>`).join('') || '<li class="muted">No match</li>';
      res.hidden = false;
      res.querySelectorAll('li[data-id]').forEach(li => (li.onclick = () => pick(T.byId[li.dataset.id])));
    };
    q.onkeydown = e => { if (e.key === 'Enter') { const li = res.querySelector('li[data-id]'); if (li) li.click(); } };
  }

  function pick(c) {
    if ($('#tv-game').hidden || atDest()) return;
    const cur = at();
    if (c.id === cur.id) return;
    if (route.some(r => r.to === c.id) || c.id === ch.from.id) return toast('Already on your route');
    if (!T.legs(cur, c, ch.seed).length) return toast('No direct connection from ' + cur.name + ' to ' + c.name + ' today');
    pendingTo = c; refresh(); focusOn(cur, c);
  }
  function refresh() { renderLegs(); renderPicker(); drawMap(); }
  let toastT; function toast(m) { let t = $('.tv-toast'); if (!t) { t = document.createElement('div'); t.className = 'tv-toast'; document.body.appendChild(t); } t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800); }

  /* ---------- flow ---------- */
  function start() {
    route = []; pendingTo = null;
    $('#tv-intro').hidden = true; $('#tv-result').hidden = true; $('#tv-board').hidden = true; $('#tv-game').hidden = false;
    t0 = performance.now();
    clearInterval(timer); timer = setInterval(() => { $('#tv-timer').textContent = '⚡ ' + T.secsF(elapsed()); if (atDest()) renderLegs(); }, 250);
    refresh(); focusOn(ch.from, ch.to);
    window.scrollTo({ top: $('#tv-game').offsetTop - 70, behavior: 'smooth' });
  }
  $('#tv-start').onclick = start;
  $('#tv-undo').onclick = () => { route.pop(); pendingTo = null; refresh(); };
  $('#tv-clear').onclick = () => { route = []; pendingTo = null; refresh(); focusOn(ch.from, ch.to); };
  $('#tv-submit').onclick = () => {
    if (!atDest()) return;
    clearInterval(timer);
    const tt = totals(), secs = elapsed();
    const res = { score: T.score(tt.cost, tt.hours, secs, bm), cost: Math.round(tt.cost), hours: tt.hours, secs: Math.round(secs * 10) / 10, route: route.map(r => ({ to: r.to, mode: r.leg.mode, cost: r.leg.cost, hours: r.leg.hours })), at: Date.now() };
    if (!practice) {
      st = T.load(); st.results = st.results || {};
      if (!st.results[ch.key]) { st.results[ch.key] = res; T.save(st); }
      practice = true;
      try { Geo.update && Geo.update(s => { s.traverse = (s.traverse || 0) + 1; }); } catch (e) {}
      showResult(res, false);
    } else showResult(res, true);
  };

  function showResult(res, isPractice) {
    $('#tv-game').hidden = true;
    const rk = T.rankOf(res.score, fld);
    const pct = Math.round(100 * (1 - rk.rank / rk.of));
    const grade = (v, best, good, ok) => v <= best * good ? 'good' : v <= best * ok ? 'ok' : 'poor';
    const pathHTML = [ch.from, ...res.route.map(r => T.byId[r.to])].map((c, i) => (i ? `<span class="lg">${T.MODES[res.route[i - 1].mode].icon} ${T.money(res.route[i - 1].cost)} · ${T.dur(res.route[i - 1].hours)}</span><span>→</span>` : '') + `<span>${c.flag} ${T.esc(c.name)}</span>`).join('');
    const insight = res.cost > bm.cheapest * 1.6 ? `A much cheaper way existed: the thriftiest journey today costs about <b>${T.money(bm.cheapest)}</b>.`
      : res.hours > bm.fastest * 1.6 ? `A much faster way existed: the quickest journey today takes about <b>${T.dur(bm.fastest)}</b>.`
      : res.secs > 120 ? `Your route was strong, but you took <b>${T.secsF(res.secs)}</b> to decide. Faster calls score higher.`
      : `Excellent. You were close to the best balance of money, time and speed today.`;
    $('#tv-result').innerHTML = `
      ${isPractice ? '<span class="practice">Practice run · not scored</span>' : '<span class="locked">🔒 Official score for ' + ch.key + ' saved</span>'}
      <div class="score-lbl">Traverse Score</div><div class="score">${res.score.toLocaleString()}</div>
      <div class="rank">${isPractice ? `Would rank <b>#${rk.rank.toLocaleString()}</b> of ${rk.of.toLocaleString()}` : `Global rank <b>#${rk.rank.toLocaleString()}</b> of ${rk.of.toLocaleString()} · top ${Math.max(1, 100 - pct)}%`}</div>
      <div class="tv-stats">
        <div class="st ${grade(res.cost, bm.cheapest, 1.15, 1.6)}"><b>${T.money(res.cost)}</b><span>💰 Money spent</span><i>best today ≈ ${T.money(bm.cheapest)}</i></div>
        <div class="st ${grade(res.hours, bm.fastest, 1.15, 1.6)}"><b>${T.dur(res.hours)}</b><span>⏱️ Travel time</span><i>best today ≈ ${T.dur(bm.fastest)}</i></div>
        <div class="st ${res.secs <= 45 ? 'good' : res.secs <= 120 ? 'ok' : 'poor'}"><b>${T.secsF(res.secs)}</b><span>⚡ Decision time</span><i>${res.route.length} leg${res.route.length > 1 ? 's' : ''}</i></div>
      </div>
      <div class="tv-path">${pathHTML}</div>
      <p class="insight">${insight}</p>
      <div class="actions">
        <button class="btn" id="tv-share">📋 Copy result</button>
        <button class="btn ghost" id="tv-again">🔁 Practice again (unscored)</button>
      </div>`;
    $('#tv-result').hidden = false;
    $('#tv-again').onclick = start;
    $('#tv-share').onclick = () => {
      const modes = res.route.map(r => T.MODES[r.mode].icon).join('');
      const txt = `Traverse #${ch.n} ${ch.from.flag}→${ch.to.flag}\n${modes}\n🏆 ${res.score.toLocaleString()} · #${rk.rank.toLocaleString()}\n💰 ${T.money(res.cost)} ⏱️ ${T.dur(res.hours)} ⚡ ${T.secsF(res.secs)}\n${location.origin}${location.pathname}`;
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Copied to clipboard'), () => { prompt('Copy your result:', txt); });
    };
    showBoard(st.results[ch.key] || res);
    window.scrollTo({ top: $('#tv-result').offsetTop - 70, behavior: 'smooth' });
  }

  function showBoard(mine) {
    const rk = T.rankOf(mine.score, fld);
    const r = T.rng(T.hash('names-' + ch.seed));
    const FIRST = ['Mara', 'Jonas', 'Aiko', 'Diego', 'Nia', 'Luca', 'Priya', 'Sam', 'Elif', 'Tomás', 'Zara', 'Kai', 'Ines', 'Noor', 'Ravi', 'Sofie', 'Owen', 'Lena', 'Yusuf', 'Hana'];
    const FLAGS = ['🇺🇸', '🇬🇧', '🇩🇪', '🇯🇵', '🇧🇷', '🇮🇳', '🇫🇷', '🇪🇸', '🇨🇦', '🇦🇺', '🇰🇷', '🇲🇽', '🇳🇱', '🇸🇪', '🇹🇷', '🇳🇬', '🇮🇹', '🇵🇱', '🇦🇷', '🇿🇦'];
    const name = i => FIRST[Math.floor(r() * FIRST.length)] + ' ' + String.fromCharCode(65 + Math.floor(r() * 26)) + '. ' + FLAGS[Math.floor(r() * FLAGS.length)];
    const rows = []; const top = fld.slice(0, 5).map((s, i) => ({ rank: i + 1, name: name(i), score: s }));
    const all = top.concat([{ rank: rk.rank, name: 'You', score: mine.score, me: true }]);
    if (rk.rank > 7) { all.push({ rank: rk.rank - 1, name: name(), score: fld[rk.rank - 2] }); all.push({ rank: rk.rank + 1, name: name(), score: fld[rk.rank - 1] }); }
    const seen = new Set(); all.sort((a, b) => a.rank - b.rank || (a.me ? -1 : 1)).forEach(x => { if (!seen.has(x.rank) || x.me) { seen.add(x.rank); rows.push(x); } });
    // histogram
    const bins = new Array(20).fill(0); fld.forEach(s => bins[Math.min(19, Math.floor(s / 500))]++);
    const myBin = Math.min(19, Math.floor(mine.score / 500)), mx = Math.max(...bins);
    const hist = (st.results ? Object.keys(st.results) : []);
    const days = []; for (let i = 6; i >= 0; i--) { const k = T.dayKey(ch.n - i); days.push(`<div class="d ${st.results && st.results[k] ? 'p' : ''}" title="${k}${st.results && st.results[k] ? ' · ' + st.results[k].score.toLocaleString() : ''}">${new Date(k).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}</div>`); }
    $('#tv-board').innerHTML = `<h3>🌍 Today's field</h3><p class="sub">Simulated global ranking for Traverse #${ch.n} — ${rk.of.toLocaleString()} journeys. Your official score is the first one you submitted today.</p>
      <table><thead><tr><th>#</th><th>Traveller</th><th class="r">Score</th></tr></thead><tbody>
      ${rows.map(x => `<tr${x.me ? ' class="me"' : ''}><td>${x.rank.toLocaleString()}</td><td>${x.name}</td><td class="r">${x.score.toLocaleString()}</td></tr>`).join('')}</tbody></table>
      <div class="dist">${bins.map((b, i) => `<i class="${i === myBin ? 'me' : ''}" style="height:${Math.max(3, 100 * b / mx)}%" title="${(i * 500).toLocaleString()}–${(i * 500 + 499).toLocaleString()}: ${b}"></i>`).join('')}</div>
      <div class="axis"><span>0</span><span>Score distribution</span><span>10,000</span></div>
      <div class="tv-hist">${days.join('')}<span class="muted" style="font-size:.8rem;align-self:center;margin-left:6px">${hist.length} day${hist.length === 1 ? '' : 's'} played</span></div>`;
    $('#tv-board').hidden = false;
  }

  /* ---------- initial state ---------- */
  if (official) {
    $('#tv-intro').hidden = true;
    showResult(official, false);
  } else {
    $('#tv-intro-note').textContent = 'One official attempt per day. The decision clock starts the moment you press Start.';
  }
})();
