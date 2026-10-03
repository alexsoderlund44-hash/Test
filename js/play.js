(function () {
  const { $, MODES, REGIONS, DIFFS } = G;
  const cfg = { type: location.hash === '#practice' ? 'practice' : 'quiz', mode: 'capital', region: 'World', diff: 'beginner', count: 10 };

  /* ---------------- setup wizard: one choice per step ---------------- */
  const STEPS = [
    { key: 'type', title: 'Choose your game type', items: () => [
      ['quiz', '🏆', 'Quiz', 'Scored round — earns XP and achievements'],
      ['practice', '🛠️', 'Practice', 'No score, free hints, mistakes come back']] },
    { key: 'mode', title: 'Choose your question type', items: () => Object.entries(MODES).map(([k, v]) => {
      const [ico, ...n] = v[0].split(' '); return [k, ico, n.join(' '), v[1]]; }) },
    { key: 'region', title: 'Choose your region', items: () => REGIONS.map(r => [r, r === 'World' ? '🌍' : '🗺️', r, r === 'World' ? 'All countries' : '']) },
    { key: 'diff', title: 'Choose your difficulty', items: () => Object.entries(DIFFS).map(([k, v]) => [k, v.icon, v.label, v.sub]) },
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
      html += `<h2 class="step-title">Ready to play?${cfg.type === 'practice' ? '' : ' 10 questions per round'}</h2><div class="card summary">` +
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
    if ($('start')) $('start').onclick = () => { location.href = 'game.html?' + new URLSearchParams(cfg); };
  }


  renderSetup();
})();
