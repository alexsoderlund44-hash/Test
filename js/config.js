/* Shared by the setup page and the game page. */
window.G = (function () {
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
  // from/to = slice of the "fame" ranking (0 = best known, 1 = most obscure)
  const DIFFS = {
    beginner: { label: 'Beginner', icon: '🌱', sub: 'Only the best-known countries', from: 0, to: .25, mult: 1 },
    intermediate: { label: 'Intermediate', icon: '⚡', sub: 'Well-known to fairly familiar', from: 0, to: .6, mult: 1.25 },
    expert: { label: 'Expert', icon: '🔥', sub: 'Niche, lesser-known countries', from: .45, to: 1, mult: 1.5 },
    impossible: { label: 'Impossible', icon: '💀', sub: 'The most obscure — one wrong answer ends the run, no hints', from: .65, to: 1, mult: 2 },
  };
  // Rough "how well known" score: population plus a bonus for countries with a featured story.
  const fame = c => Math.log10((c.population || 1) + 1) + (STORIES[c.code] ? 1.5 : 0);
  function poolFor(region, diff) {
    const base = ALL.filter(c => region === 'World' || c.region === region).sort((a, b) => fame(b) - fame(a));
    const d = DIFFS[diff], n = base.length, min = Math.min(n, 8);
    let a = Math.round(n * d.from), b = Math.round(n * d.to);
    if (b - a < min) { if (d.from === 0) b = min; else a = n - min; }
    return base.slice(a, b);
  }
  return { $, esc, ALL, byId, MODES, REGIONS, BOX, DIFFS, poolFor };
})();
