/* Shared: navigation, saved progress, achievements, helpers. */
(function () {
  const PAGES = [
    ['index.html', 'Home'],
    ['explore.html', 'Explore'],
    ['play.html', 'Play Now'],
    ['languages.html', 'Languages'],
    ['achievements.html', 'Achievements'],
  ];
  const KEY = 'geoatlas.v1';

  /* ---------- storage ---------- */
  const blank = () => ({
    visited: [], quizzes: 0, perfect: 0, bestStreak: 0, correct: 0, answered: 0,
    practiceAnswered: 0, byMode: {}, regionsPerfect: [], mastered: {}, best: {}, ach: {}, lang: {},
    studied: [], tabsSeen: {}, hops: 0, regionVisits: {}, landlockedVisits: 0, tinyVisits: 0, audio: 0, langCorrect: 0, lessonPerfect: 0, days: [],
  });
  function load() {
    try { return Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); }
    catch (e) { return blank(); }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode */ } }

  /* ---------- achievements ---------- */
  const CATS = [['play', '🎮 Play'], ['explore', '🌍 Explore'], ['lang', '🗣️ Languages'], ['general', '⭐ General']];
  const langDone = s => Object.values(s.lang || {}).reduce((n, l) => n + Object.values(l).filter(x => x.done).length, 0);
  const langsStarted = s => Object.values(s.lang || {}).filter(l => Object.values(l).some(x => x.done)).length;
  const doneIn = k => s => Object.values((s.lang || {})[k] || {}).filter(x => x.done).length;
  const tabCodes = (s, tab) => Object.values(s.tabsSeen || {}).filter(t => t.includes(tab)).length;
  const A = (cat, id, icon, name, desc, val, goal) => ({ cat, id, icon, name, desc, val, goal });
  const ACH = [
    A('play', 'first', '🎓', 'First Steps', 'Finish your first quiz.', s => s.quizzes, 1),
    A('play', 'veteran', '🏅', 'Quiz Veteran', 'Finish 10 quizzes.', s => s.quizzes, 10),
    A('play', 'perfect', '💯', 'Flawless', 'Get every question right in a quiz.', s => s.perfect, 1),
    A('play', 'streak5', '🔥', 'Heating Up', 'Answer 5 in a row correctly.', s => s.bestStreak, 5),
    A('play', 'streak15', '☄️', 'Unstoppable', 'Answer 15 in a row correctly.', s => s.bestStreak, 15),
    A('play', 'brain', '🧠', 'Brainiac', 'Give 100 correct answers.', s => s.correct, 100),
    A('play', 'capital', '🏛️', 'Capital Expert', 'Get 25 capital answers right.', s => s.byMode.capital || 0, 25),
    A('play', 'flags', '🚩', 'Vexillologist', 'Get 25 flag answers right.', s => s.byMode.flag || 0, 25),
    A('play', 'finder', '📍', 'Pin Pointer', 'Find 25 countries on the map.', s => s.byMode.find || 0, 25),
    A('play', 'eye', '🔎', 'Sharp Eye', 'Identify 25 highlighted countries.', s => s.byMode.identify || 0, 25),
    A('play', 'practice', '🛠️', 'Practice Makes Perfect', 'Answer 50 questions in practice mode.', s => s.practiceAnswered, 50),
    A('play', 'master10', '🌟', 'Mastery Begins', 'Master 10 countries in practice mode (2 right in a row).', s => Object.keys(s.mastered).length, 10),
    A('play', 'regions', '🗺️', 'Continental', 'Get a perfect quiz in 3 different regions.', s => s.regionsPerfect.length, 3),

    A('explore', 'explorer', '🧭', 'Explorer', 'Select 10 different countries on the globe.', s => s.visited.length, 10),
    A('explore', 'trotter', '✈️', 'Globetrotter', 'Select 50 different countries.', s => s.visited.length, 50),
    A('explore', 'world', '🌍', 'World Traveler', 'Select 150 different countries.', s => s.visited.length, 150),
    A('explore', 'cartographer', '🧳', 'Cartographer', 'Visit at least 5 countries in every region (Africa, Americas, Asia, Europe, Oceania).', s => Object.values(s.regionVisits || {}).filter(n => n >= 5).length, 5),
    A('explore', 'curious', '📚', 'Curious Mind', 'Open the full "Learn more" page for 5 countries.', s => (s.studied || []).length, 5),
    A('explore', 'scholar', '🎓', 'Country Scholar', 'Open the "Learn more" page for 25 countries.', s => (s.studied || []).length, 25),
    A('explore', 'poly-tabs', '🔬', 'Deep Dive', 'Read all five tabs (history, language, culture, geography, economy) for one country.', s => Object.values(s.tabsSeen || {}).filter(t => t.length >= 5).length, 1),
    A('explore', 'historian', '📜', 'Historian', 'Read the History tab of 10 countries.', s => tabCodes(s, 'history'), 10),
    A('explore', 'hopper', '🥾', 'Border Hopper', 'Jump to a neighboring country 10 times from the globe.', s => s.hops || 0, 10),
    A('explore', 'tiny', '🔭', 'Tiny Treasures', 'Find 3 tiny places under 1,000 km² (Monaco, Malta, Nauru…).', s => s.tinyVisits || 0, 3),
    A('explore', 'landlock', '⛰️', 'Landlubber', 'Visit 5 landlocked countries.', s => s.landlockedVisits || 0, 5),

    A('lang', 'lang1', '🗣️', 'Language Learner', 'Pass your first language lesson quiz.', langDone, 1),
    A('lang', 'lang8', '📖', 'Bookworm', 'Pass 8 language lesson quizzes.', langDone, 8),
    A('lang', 'poly', '🌐', 'Polyglot', 'Pass a lesson in all four languages.', langsStarted, 4),
    A('lang', 'es8', '🇪🇸', 'Español', 'Pass all 8 Spanish lessons.', doneIn('es'), 8),
    A('lang', 'fr8', '🇫🇷', 'Français', 'Pass all 8 French lessons.', doneIn('fr'), 8),
    A('lang', 'zh8', '🇨🇳', '中文', 'Pass all 8 Mandarin lessons.', doneIn('zh'), 8),
    A('lang', 'ar8', '🇸🇦', 'العربية', 'Pass all 8 Arabic lessons.', doneIn('ar'), 8),
    A('lang', 'perfectlesson', '🎯', 'Perfect Pronunciation', 'Score 100% on a lesson quiz.', s => s.lessonPerfect || 0, 1),
    A('lang', 'listener', '🎧', 'Good Listener', 'Play audio 50 times.', s => s.audio || 0, 50),
    A('lang', 'wizard', '🪄', 'Word Wizard', 'Answer 100 language quiz questions correctly.', s => s.langCorrect || 0, 100),
    A('lang', 'master', '🏆', 'Master Linguist', 'Pass all 32 lessons.', langDone, 32),

    A('general', 'days3', '📆', 'Regular', 'Use GeoAtlas on 3 different days.', s => (s.days || []).length, 3),
    A('general', 'days7', '🗓️', 'Dedicated', 'Use GeoAtlas on 7 different days.', s => (s.days || []).length, 7),
    A('general', 'triple', '🔱', 'Triple Threat', 'Explore 10 countries, pass a language lesson and finish a quiz.', s => (s.visited.length >= 10) + (langDone(s) >= 1) + (s.quizzes >= 1), 3),
    A('general', 'all-rounder', '🌈', 'All-Rounder', 'Unlock at least one achievement in every category.', s => CATS.filter(([c]) => ACH.some(a => a.cat === c && a.id !== 'all-rounder' && s.ach[a.id])).length, 4),
  ];
  function update(fn) { const s = load(); fn(s); save(s); checkAchievements(s); return s; }
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

  /* ---------- header / side menu / footer ---------- */
  const ICONS = { 'index.html': '🏠', 'explore.html': '🌍', 'play.html': '🎮', 'languages.html': '🗣️', 'achievements.html': '🏆' };
  function mountChrome() {
    const here = location.pathname.split('/').pop() || 'index.html';
    const header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML = `<div class="wrap"><button class="burger" id="menuBtn" aria-label="Open menu" aria-expanded="false">☰ <span>Menu</span></button>
      <a class="brand" href="index.html"><span class="logo"></span>GeoAtlas</a></div>`;
    const overlay = document.createElement('div'); overlay.className = 'drawer-overlay';
    const drawer = document.createElement('aside'); drawer.className = 'drawer'; drawer.setAttribute('aria-label', 'Site menu');
    drawer.innerHTML = `<div class="drawer-head"><a class="brand" href="index.html"><span class="logo"></span>GeoAtlas</a><button class="close" aria-label="Close menu">×</button></div>
      <nav>${PAGES.map(([h, n]) => `<a href="${h}"${h === here ? ' class="active"' : ''}><span>${ICONS[h] || ''}</span>${n}</a>`).join('')}</nav>`;
    document.body.prepend(drawer); document.body.prepend(overlay); document.body.prepend(header);
    const open = v => { drawer.classList.toggle('open', v); overlay.classList.toggle('open', v); $btn.setAttribute('aria-expanded', v); };
    const $btn = header.querySelector('#menuBtn');
    $btn.onclick = () => open(!drawer.classList.contains('open'));
    overlay.onclick = drawer.querySelector('.close').onclick = () => open(false);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') open(false); });
    const f = document.querySelector('footer.site-footer');
    if (f) f.innerHTML = 'GeoAtlas · Map data from Natural Earth via world-atlas · Country facts from REST Countries data · Progress is saved in your browser';
    // count distinct days of use
    const today = new Date().toISOString().slice(0, 10), st = load();
    if (!st.days.includes(today)) { st.days = st.days.concat(today).slice(-60); save(st); }
    checkAchievements(st);
  }
  document.addEventListener('DOMContentLoaded', mountChrome);

  window.Geo = { load, save, update, ACH, CATS, checkAchievements, flagHTML, fmt, shuffle };
})();
