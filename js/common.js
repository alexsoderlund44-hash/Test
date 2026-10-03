/* Shared: navigation, saved progress, achievements, helpers. */
(function () {
  const PAGES = [
    ['index.html', 'Home'],
    ['explore.html', 'Explore'],
    ['play.html', 'Play Now'],
    ['achievements.html', 'Achievements'],
  ];
  const KEY = 'geoatlas.v1';

  /* ---------- storage ---------- */
  const blank = () => ({
    visited: [], quizzes: 0, perfect: 0, bestStreak: 0, correct: 0, answered: 0,
    practiceAnswered: 0, byMode: {}, regionsPerfect: [], mastered: {}, best: {}, ach: {},
  });
  function load() {
    try { return Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); }
    catch (e) { return blank(); }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode */ } }

  /* ---------- achievements ---------- */
  const ACH = [
    { id: 'first', icon: '🎓', name: 'First Steps', desc: 'Finish your first quiz.', val: s => s.quizzes, goal: 1 },
    { id: 'veteran', icon: '🏅', name: 'Quiz Veteran', desc: 'Finish 10 quizzes.', val: s => s.quizzes, goal: 10 },
    { id: 'perfect', icon: '💯', name: 'Flawless', desc: 'Get every question right in a quiz.', val: s => s.perfect, goal: 1 },
    { id: 'streak5', icon: '🔥', name: 'Heating Up', desc: 'Answer 5 in a row correctly.', val: s => s.bestStreak, goal: 5 },
    { id: 'streak15', icon: '☄️', name: 'Unstoppable', desc: 'Answer 15 in a row correctly.', val: s => s.bestStreak, goal: 15 },
    { id: 'brain', icon: '🧠', name: 'Brainiac', desc: 'Give 100 correct answers.', val: s => s.correct, goal: 100 },
    { id: 'capital', icon: '🏛️', name: 'Capital Expert', desc: 'Get 25 capital answers right.', val: s => s.byMode.capital || 0, goal: 25 },
    { id: 'flags', icon: '🚩', name: 'Vexillologist', desc: 'Get 25 flag answers right.', val: s => s.byMode.flag || 0, goal: 25 },
    { id: 'finder', icon: '📍', name: 'Pin Pointer', desc: 'Find 25 countries on the map.', val: s => s.byMode.find || 0, goal: 25 },
    { id: 'eye', icon: '🔎', name: 'Sharp Eye', desc: 'Identify 25 highlighted countries.', val: s => s.byMode.identify || 0, goal: 25 },
    { id: 'practice', icon: '🛠️', name: 'Practice Makes Perfect', desc: 'Answer 50 questions in practice mode.', val: s => s.practiceAnswered, goal: 50 },
    { id: 'master10', icon: '🌟', name: 'Mastery Begins', desc: 'Master 10 countries in practice mode (2 right in a row).', val: s => Object.keys(s.mastered).length, goal: 10 },
    { id: 'explorer', icon: '🧭', name: 'Explorer', desc: 'Read about 10 countries on the globe.', val: s => s.visited.length, goal: 10 },
    { id: 'trotter', icon: '✈️', name: 'Globetrotter', desc: 'Read about 50 countries.', val: s => s.visited.length, goal: 50 },
    { id: 'world', icon: '🌍', name: 'World Traveler', desc: 'Read about 150 countries.', val: s => s.visited.length, goal: 150 },
    { id: 'regions', icon: '🗺️', name: 'Continental', desc: 'Get a perfect quiz in 3 different regions.', val: s => s.regionsPerfect.length, goal: 3 },
  ];
  function checkAchievements(s) {
    const fresh = [];
    for (const a of ACH) {
      if (!s.ach[a.id] && a.val(s) >= a.goal) { s.ach[a.id] = Date.now(); fresh.push(a); }
    }
    if (fresh.length) { save(s); fresh.forEach(toast); }
    return fresh;
  }
  function toast(a) {
    let box = document.querySelector('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="t-ico">${a.icon}</span><div><b>Achievement unlocked!</b><small>${a.name}</small></div>`;
    box.appendChild(t);
    setTimeout(() => t.remove(), 5000);
  }

  /* ---------- helpers ---------- */
  function flagHTML(c, h) {
    h = h || 32;
    if (!c.cca2) return `<span class="flag-fallback" style="font-size:${h}px">${c.flag || ''}</span>`;
    const code = c.cca2.toLowerCase();
    return `<img class="flag" height="${h}" style="height:${h}px;width:auto" alt="Flag of ${c.name}" ` +
      `src="https://flagcdn.com/h${h > 40 ? 120 : 40}/${code}.png" ` +
      `onerror="this.outerHTML='<span class=&quot;flag-fallback&quot; style=&quot;font-size:${h}px&quot;>${c.flag || ''}</span>'">`;
  }
  const fmt = n => (n == null ? '—' : Number(n).toLocaleString('en-US'));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- header / footer ---------- */
  function mountChrome() {
    const here = location.pathname.split('/').pop() || 'index.html';
    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `<div class="wrap"><a class="brand" href="index.html"><span class="logo"></span>GeoAtlas</a>
      <button class="burger" aria-label="Menu">☰</button>
      <nav class="menu">${PAGES.map(([h, n]) => `<a href="${h}"${h === here ? ' class="active"' : ''}>${n}</a>`).join('')}</nav></div>`;
    document.body.prepend(header);
    header.querySelector('.burger').onclick = () => header.querySelector('nav').classList.toggle('open');
    const f = document.querySelector('footer.site-footer');
    if (f) f.innerHTML = 'GeoAtlas · Map data from Natural Earth via world-atlas · Country facts from REST Countries data · Progress is saved in your browser';
  }
  document.addEventListener('DOMContentLoaded', mountChrome);

  window.Geo = { load, save, ACH, checkAchievements, flagHTML, fmt, shuffle };
})();
