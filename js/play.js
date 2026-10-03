(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const ALL = COUNTRIES.filter(c => c.independent);
  const byId = {}; COUNTRIES.forEach(c => byId[c.id] = c);
  const MODES = {
    capital: ['🏛️ Capitals', 'Name the capital city'],
    flag: ['🚩 Flags', 'Which country has this flag?'],
    find: ['📍 Find on map', 'Click the country on the map'],
    identify: ['🔎 Identify', 'Which country is highlighted?'],
    mixed: ['🎲 Mixed', 'All question types'],
  };
  const REGIONS = ['World', 'Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];
  const BOX = { Africa: [-20, -36, 52, 38], Americas: [-170, -57, -30, 72], Asia: [25, -11, 150, 56], Europe: [-25, 34, 45, 72], Oceania: [110, -48, 180, 5], World: null };
  const DIFFS = { easy: ['Easy', 'most populous 40%', .4], medium: ['Medium', 'top 70%', .7], hard: ['Hard', 'every country', 1] };
  const cfg = { type: location.hash === '#practice' ? 'practice' : 'quiz', mode: 'capital', region: 'World', diff: 'medium', count: 10 };

  /* ---------------- setup wizard: one choice per step ---------------- */
  const STEPS = [
    { key: 'type', title: 'Choose your game type', items: () => [
      ['quiz', '🏆', 'Quiz', 'Scored round — earns XP and achievements'],
      ['practice', '🛠️', 'Practice', 'No score, free hints, mistakes come back']] },
    { key: 'mode', title: 'Choose your question type', items: () => Object.entries(MODES).map(([k, v]) => {
      const [ico, ...n] = v[0].split(' '); return [k, ico, n.join(' '), v[1]]; }) },
    { key: 'region', title: 'Choose your region', items: () => REGIONS.map(r => [r, r === 'World' ? '🌍' : '🗺️', r, r === 'World' ? 'All countries' : '']) },
    { key: 'diff', title: 'Choose your difficulty', items: () => Object.entries(DIFFS).map(([k, v]) => [k, { easy: '🌱', medium: '⚡', hard: '💀' }[k], v[0], v[1]]) },
    { key: 'count', title: 'How many questions?', quizOnly: true, items: () => [[10, '🔟', '10', 'Quick round'], [20, '2️⃣0️⃣', '20', 'Standard'], [30, '3️⃣0️⃣', '30', 'Marathon']] },
  ];
  const picked = { type: location.hash === '#practice', count: true };
  let step = location.hash === '#practice' ? 1 : 0;
  const steps = () => STEPS.filter(s => !(s.quizOnly && cfg.type === 'practice'));
  const label = (s, v) => { const it = s.items().find(i => String(i[0]) === String(v)); return it ? it[1] + ' ' + it[2] : v; };

  function renderSetup() {
    const list = steps(), n = list.length;
    const st = Geo.load(), xp = st.correct * 10 + st.quizzes * 50, lvl = Math.floor(Math.sqrt(xp / 50)) + 1;
    const lo = 50 * (lvl - 1) ** 2, hi = 50 * lvl ** 2;
    let html = `<div class="player"><span class="lvl">LVL ${lvl}</span><div class="progress"><i style="width:${100 * (xp - lo) / (hi - lo)}%"></i></div><span class="muted">${xp} / ${hi} XP</span></div>`;
    html += `<div class="crumbs">` + list.map((s, i) => `<button class="crumb ${i === step ? 'cur' : ''}" data-i="${i}" ${i > step && !picked[s.key] ? 'disabled' : ''}>${picked[s.key] || i < step ? label(s, cfg[s.key]) : (i + 1)}</button>`).join('') + `<button class="crumb ${step >= n ? 'cur' : ''}" disabled>🚀</button></div>`;
    if (step < n) {
      const s = list[step];
      html += `<h2 class="step-title">Step ${step + 1} of ${n}: ${s.title}</h2><div class="bigopts">` +
        s.items().map(([v, ico, name, sub]) => `<button class="bigopt ${picked[s.key] && String(cfg[s.key]) === String(v) ? 'on' : ''}" data-v="${v}"><span class="bi">${ico}</span><b>${name}</b><small>${sub}</small></button>`).join('') + '</div>';
      if (step > 0) html += '<div><button class="btn ghost small" id="back">← Back</button></div>';
    } else {
      const total = cfg.type === 'practice' ? 'Endless' : cfg.count + ' questions';
      html += `<h2 class="step-title">Ready to play?</h2><div class="card summary">` +
        list.map(s => `<div><span class="muted">${s.title.replace(/^(Choose your |How many )/, '').replace('?', '')}</span><b>${label(s, cfg[s.key])}</b></div>`).join('') +
        `</div><div class="actions"><button class="btn big" id="start">🎮 Start game</button><button class="btn ghost" id="back">← Back</button></div>`;
    }
    $('setup').innerHTML = html;
    $('setup').querySelectorAll('.bigopt').forEach(b => b.onclick = () => {
      const s = list[step], v = b.dataset.v;
      cfg[s.key] = isNaN(v) ? v : +v; picked[s.key] = true;
      if (s.key === 'type' && v === 'practice' && step + 1 >= steps().length) step = steps().length; else step++;
      renderSetup();
    });
    $('setup').querySelectorAll('.crumb').forEach(b => b.onclick = () => { step = +b.dataset.i; renderSetup(); });
    if ($('back')) $('back').onclick = () => { step = Math.max(0, step - 1); renderSetup(); };
    if ($('start')) $('start').onclick = start;
  }

  /* ---------------- map ---------------- */
  const W = 960, H = 500;
  const proj = d3.geoNaturalEarth1().fitExtent([[8, 8], [W - 8, H - 8]], { type: 'Sphere' });
  const gpath = d3.geoPath(proj);
  const feats = topojson.feature(WORLD_TOPO, WORLD_TOPO.objects.countries).features;
  let svg, gmap, ring, zoomB, curK = 1, mapReady = false;
  function buildMap() {
    if (mapReady) return; mapReady = true;
    svg = d3.select('#map');
    svg.append('path').attr('d', gpath({ type: 'Sphere' })).attr('fill', '#06182b');
    gmap = svg.append('g');
    gmap.selectAll('path.c').data(feats).join('path')
      .attr('class', f => 'c' + (byId[String(f.id)] && byId[String(f.id)].independent ? '' : ' dep'))
      .attr('d', gpath).attr('data-id', f => f.id)
      .on('click', (e, f) => { if (state && state.q && state.q.kind === 'find' && !state.answered) answerFind(byId[String(f.id)]); });
    ring = gmap.append('circle').attr('fill', 'none').attr('stroke', '#ffd24a').attr('stroke-width', 2).attr('vector-effect', 'non-scaling-stroke').attr('display', 'none').style('pointer-events', 'none');
    zoomB = d3.zoom().scaleExtent([1, 80]).extent([[0, 0], [W, H]]).translateExtent([[0, 0], [W, H]]).on('zoom', e => {
      gmap.attr('transform', e.transform); curK = e.transform.k; ring.attr('r', 14 / curK);
    });
    svg.call(zoomB);
    $('zin').onclick = () => svg.transition().duration(250).call(zoomB.scaleBy, 1.6);
    $('zout').onclick = () => svg.transition().duration(250).call(zoomB.scaleBy, 1 / 1.6);
    $('zreset').onclick = () => viewRegion();
  }
  function fitTo(bounds, maxK) {
    const [[x0, y0], [x1, y1]] = bounds, dx = x1 - x0, dy = y1 - y0;
    const k = Math.min(maxK || 80, 0.8 / Math.max(dx / W, dy / H) || 1);
    const t = d3.zoomIdentity.translate(W / 2 - k * (x0 + x1) / 2, H / 2 - k * (y0 + y1) / 2).scale(k);
    svg.transition().duration(600).call(zoomB.transform, t);
  }
  function viewRegion() {
    const b = BOX[cfg.region];
    if (!b) return svg.transition().duration(500).call(zoomB.transform, d3.zoomIdentity);
    fitTo(gpath.bounds(d3.geoGraticule().extent([[b[0], b[1]], [b[2], b[3]]]).outline()), 12);
  }
  function resetMapClasses() {
    gmap.selectAll('path.c').classed('hl good bad hint', false);
    ring.attr('display', 'none');
  }
  const pathOf = c => gmap.select(`path[data-id="${c.id}"]`);
  function markRing(c) {
    const f = feats.find(x => String(x.id) === c.id); if (!f) return;
    const [x, y] = gpath.centroid(f); if (isNaN(x)) return;
    ring.raise().attr('cx', x).attr('cy', y).attr('r', 14 / curK).attr('display', null);
  }

  /* ---------------- game state ---------------- */
  let state = null;
  function poolFor() {
    let base = ALL.filter(c => cfg.region === 'World' || c.region === cfg.region);
    base = base.slice().sort((a, b) => b.population - a.population);
    const n = Math.max(Math.min(base.length, 8), Math.round(base.length * DIFFS[cfg.diff][2]));
    let pool = base.slice(0, n);
    return pool;
  }
  function kindOf() { return cfg.mode === 'mixed' ? Geo.shuffle(['capital', 'flag', 'find', 'identify'])[0] : cfg.mode; }

  function start() {
    let pool = poolFor();
    if (cfg.mode === 'capital') pool = pool.filter(c => c.capital);
    const practice = cfg.type === 'practice';
    state = {
      practice, pool, i: 0, score: 0, correct: 0, streak: 0, best: 0, answered: false, hinted: false,
      queue: Geo.shuffle(pool), asked: [], misses: [], run: {}, seen: new Set(), t0: 0,
      total: practice ? Infinity : Math.min(cfg.count, pool.length),
    };
    $('setup').hidden = true; $('result').hidden = true; $('game').hidden = false;
    $('h-mode').textContent = (practice ? 'Practice · ' : 'Game · ') + MODES[cfg.mode][0] + ' · ' + cfg.region;
    $('h-mode').className = 'pill' + (practice ? ' practice' : '');
    $('h-score').hidden = practice; $('h-prog').hidden = practice;
    $('endBtn').textContent = practice ? 'End session' : 'Quit';
    buildMap(); next();
  }

  function nextTarget() {
    const s = state;
    if (s.practice) {
      if (s.queue.length < 4) s.queue.push(...Geo.shuffle(s.pool.filter(c => !s.queue.includes(c))));
      return s.queue.shift();
    }
    return s.queue.shift();
  }

  function next() {
    const s = state;
    if (!s.practice && s.i >= s.total) return finish();
    const c = nextTarget();
    let kind = kindOf();
    if (kind === 'capital' && !c.capital) kind = 'flag';
    s.q = { c, kind }; s.answered = false; s.hinted = false; s.i++; s.t0 = Date.now();
    $('fb').hidden = true; $('nextBtn').hidden = true; $('hintBtn').hidden = false; $('hintBtn').disabled = false;
    $('h-count').textContent = s.practice ? 'Question ' + s.i : `${s.i} / ${s.total}`;
    $('h-prog').firstElementChild.style.width = s.practice ? 0 : (100 * (s.i - 1) / s.total) + '%';
    $('h-score').textContent = '⭐ ' + s.score; $('h-streak').textContent = '🔥 ' + s.streak;
    const isMap = kind === 'find' || kind === 'identify';
    $('mapbox').hidden = !isMap; $('answers').hidden = isMap;
    if (isMap) {
      resetMapClasses();
      if (kind === 'find') { $('q').innerHTML = `Find <b>${esc(c.name)}</b> on the map`; viewRegion(); }
      else {
        $('q').textContent = 'Which country is highlighted?';
        pathOf(c).classed('hl', true).raise();
        const f = feats.find(x => String(x.id) === c.id);
        if (f) { fitTo(gpath.bounds(f), c.area < 5000 ? 14 : 8); if (c.area < 30000) markRing(c); }
      }
    }
    if (kind === 'capital') { $('q').innerHTML = `What is the capital of <b>${esc(c.name)}</b>?`; choices(c, x => x.capital, 'capital'); }
    if (kind === 'flag') { $('q').innerHTML = Geo.flagHTML(c, 64) + '<span>Which country has this flag?</span>'; choices(c, x => x.name); }
    if (kind === 'identify') choices(c, x => x.name, null, true);
  }

  function choices(c, label, unique, quiet) {
    const s = state;
    let near = ALL.filter(x => x !== c && x.region === c.region && (!unique || (x.capital && x.capital !== c.capital)));
    const sub = near.filter(x => x.subregion === c.subregion);
    let d = Geo.shuffle(sub).slice(0, 3);
    d = d.concat(Geo.shuffle(near.filter(x => !d.includes(x))).slice(0, 3 - d.length));
    if (d.length < 3) d = d.concat(Geo.shuffle(ALL.filter(x => x !== c && !d.includes(x) && (!unique || x.capital))).slice(0, 3 - d.length));
    const opts = Geo.shuffle([c].concat(d));
    const box = $('answers'); box.innerHTML = '';
    opts.forEach(o => {
      const b = document.createElement('button'); b.className = 'ans'; b.textContent = label(o);
      b.onclick = () => answerChoice(o, b); b.dataset.code = o.code; box.appendChild(b);
    });
    if (quiet) $('hintBtn').hidden = false;
  }

  /* hint: removes two wrong answers (choice) or pulses the target (find) */
  $('hintBtn').onclick = () => {
    const s = state; if (!s || s.answered || s.hinted) return;
    s.hinted = true; $('hintBtn').disabled = true;
    if (s.q.kind === 'find') {
      pathOf(s.q.c).classed('hint', true); markRing(s.q.c);
      const f = feats.find(x => String(x.id) === s.q.c.id);
      if (f && curK < 3) svg.transition().duration(500).call(zoomB.transform, d3.zoomIdentity); // keep view; ring shows location
    } else {
      const wrong = [...$('answers').children].filter(b => b.dataset.code !== s.q.c.code);
      Geo.shuffle(wrong).slice(0, 2).forEach(b => { b.disabled = true; b.style.opacity = .25; });
    }
  };

  function answerChoice(o, btn) {
    const s = state; if (s.answered) return;
    const ok = o === s.q.c;
    [...$('answers').children].forEach(b => { b.disabled = true; if (b.dataset.code === s.q.c.code) b.classList.add('right'); });
    if (!ok) btn.classList.add('wrong');
    if (s.q.kind === 'identify') pathOf(s.q.c).classed('good', true);
    settle(ok, o);
  }
  function answerFind(o) {
    const s = state; if (s.answered || !o) return;
    const ok = o === s.q.c;
    pathOf(s.q.c).classed('good', true).raise();
    if (!ok) { pathOf(o).classed('bad', true); markRing(s.q.c); }
    $('hintBtn').hidden = true;
    settle(ok, o);
  }

  function settle(ok, picked) {
    const s = state, c = s.q.c, st = Geo.load();
    s.answered = true; $('hintBtn').hidden = true;
    const secs = (Date.now() - s.t0) / 1000;
    if (ok) {
      s.correct++; s.streak++; s.best = Math.max(s.best, s.streak);
      const pts = (s.hinted ? 50 : 100) + Math.max(0, Math.round(50 - secs * 4)) * (s.hinted ? 0 : 1) + 10 * Math.min(s.streak - 1, 10);
      if (!s.practice) s.score += pts;
      st.correct++; st.byMode[s.q.kind] = (st.byMode[s.q.kind] || 0) + 1;
      st.bestStreak = Math.max(st.bestStreak, s.streak);
      s.run[c.code] = (s.run[c.code] || 0) + 1;
      if (s.practice && s.run[c.code] >= 2 && !s.hinted) st.mastered[c.code] = 1;
    } else {
      s.streak = 0; s.misses.push(c); s.run[c.code] = 0;
      if (s.practice) s.queue.splice(Math.min(3, s.queue.length), 0, c); // retry soon
    }
    st.answered++; if (s.practice) st.practiceAnswered++;
    Geo.save(st); Geo.checkAchievements(st);
    $('h-score').textContent = '⭐ ' + s.score; $('h-streak').textContent = '🔥 ' + s.streak;
    const story = STORIES[c.code];
    const fb = $('fb');
    fb.className = 'feedback ' + (ok ? 'ok' : 'no');
    fb.innerHTML = `<b>${ok ? '✅ Correct!' : '❌ Not quite.'}</b> ` +
      (s.q.kind === 'find' && !ok && picked ? `You clicked ${esc(picked.name)}. ` : '') +
      `${Geo.flagHTML(c, 18)} <b>${esc(c.name)}</b> — capital ${esc(c.capital || 'n/a')}, ${esc(c.subregion || c.region)}.` +
      (s.practice ? `<br><span class="muted">${esc((story && story.fact) || 'Languages: ' + (c.languages.join(', ') || 'n/a') + ' · Population ' + Geo.fmt(c.population))}</span>` : '');
    fb.hidden = false;
    const nb = $('nextBtn'); nb.hidden = false;
    nb.textContent = !s.practice && s.i >= s.total ? 'See results' : 'Next →'; nb.focus();
  }

  $('nextBtn').onclick = () => next();
  $('endBtn').onclick = () => { if (state) { state.practice ? finish(true) : (confirm('Quit this quiz? Your score will not be saved.') && backToSetup()); } };
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && state && state.answered && !$('game').hidden) next(); });

  function backToSetup() { state = null; step = 0; $('game').hidden = true; $('result').hidden = true; $('setup').hidden = false; renderSetup(); }

  function finish(early) {
    const s = state, st = Geo.load(); $('game').hidden = true; const r = $('result'); r.hidden = false;
    const n = s.practice ? s.i - (s.answered ? 0 : 1) : s.total;
    const acc = n ? Math.round(100 * s.correct / n) : 0;
    let extra = '';
    if (!s.practice) {
      st.quizzes++;
      st.byModeQuiz = st.byModeQuiz || {};
      if (s.correct === s.total && s.total >= 5) { st.perfect++; if (!st.regionsPerfect.includes(cfg.region)) st.regionsPerfect.push(cfg.region); }
      const key = cfg.mode + '|' + cfg.region, prev = st.best[key] || 0;
      if (s.score > prev) { st.best[key] = s.score; extra = prev ? '🎉 New personal best!' : ''; }
      Geo.save(st); Geo.checkAchievements(st);
    }
    const uniq = [...new Set(s.misses)];
    r.innerHTML = `<h2>${s.practice ? 'Practice session complete' : (acc === 100 ? 'Perfect run! 🌟' : acc >= 70 ? 'Nice work!' : 'Keep exploring!')}</h2>
      ${s.practice ? '' : `<div class="score grad">${s.score}</div><div class="muted">points ${extra}</div>`}
      <p><b>${s.correct}</b> / ${n} correct (${acc}%) · best streak <b>${s.best}</b></p>
      ${uniq.length ? `<div class="review"><b>Review these:</b><ul>${uniq.map(c => `<li>${Geo.flagHTML(c, 16)} <a href="explore.html?c=${c.code}">${esc(c.name)}</a> — ${esc(c.capital || '')}</li>`).join('')}</ul></div>` : ''}
      <div class="actions" style="justify-content:center"><button class="btn" id="again">Play again</button><button class="btn ghost" id="change">New game</button><a class="btn ghost" href="achievements.html">🏆 Achievements</a></div>`;
    $('again').onclick = start; $('change').onclick = backToSetup;
  }

  renderSetup();
})();
