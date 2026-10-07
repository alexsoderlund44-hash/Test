/* Traverse — daily travel strategy game. Seeded, deterministic per UTC day. */
(function () {
  'use strict';
  const C = window.TRAVERSE_CITIES.map(a => ({ id: a[0], name: a[1], country: a[2], flag: a[3], lat: a[4], lon: a[5], hub: a[6], coastal: a[7], rail: a[8] }));
  const byId = {}; C.forEach(c => (byId[c.id] = c));
  const STORE = 'traverse.v1';
  const DAY_MS = 86400000;
  const EPOCH = Date.UTC(2026, 0, 1); // day #1 = 1 Jan 2026 UTC

  /* ---------- seeded random ---------- */
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let s = seed || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

  /* ---------- geography ---------- */
  const R = 6371;
  function km(a, b) {
    const dLat = (b.lat - a.lat) * Math.PI / 180, dLon = (b.lon - a.lon) * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(x));
  }
  const sameLand = (a, b) => { // crude: can you drive/rail between them?
    const d = km(a, b);
    if (d > 2600) return false;
    const water = [['rey'], ['dub'], ['hnl'], ['akl'], ['bal'], ['mnl'], ['cmb'], ['hav'], ['pal'], ['jkt'], ['tpe'], ['sin','kul','bkk','sgn','han'], ['tok','osa'], ['syd','mel','per'], ['cpt','jnb','dar','nbo','adb'], ['lag','acc','dak'], ['sao','rio','bue','scl','lim','bog','pty'], ['mex','can'], ['nyc','bos','wdc','chi','mia','lax','sfo','sea','den','dal','atl','tor','mtl','van','anc'], ['dxb','doh','ryh','mct','teh','amm','bei','tel','cai','alx','kar','del','bom','blr'], ['pek','sha','sel','hkg']];
    const isle = ['rey','dub','hnl','akl','bal','mnl','cmb','hav','pal','jkt','tpe','tok','osa','sin'];
    if (isle.includes(a.id) || isle.includes(b.id)) {
      if ((a.id === 'tok' && b.id === 'osa') || (a.id === 'osa' && b.id === 'tok')) return true;
      if ((a.id === 'sin' && b.id === 'kul') || (a.id === 'kul' && b.id === 'sin')) return true;
      if ((a.id === 'dub') || (b.id === 'dub')) return false;
      return false;
    }
    const grp = id => water.findIndex(g => g.includes(id));
    const ga = grp(a.id), gb = grp(b.id);
    if (ga === -1 && gb === -1) return true; // Europe/N. Africa/Middle east mainland
    if (ga === gb) return true;
    // Europe <-> Middle East/Türkiye corridor
    const eu = x => x === -1, me = x => x === 19;
    if ((eu(ga) && me(gb)) || (eu(gb) && me(ga))) return d < 2200;
    return false;
  };
  const crossesMed = (a, b) => (['tun','alg','cas','mar','tan','cai','alx','tel','bei'].includes(a.id) !== ['tun','alg','cas','mar','tan','cai','alx','tel','bei'].includes(b.id));

  /* ---------- transport modes ---------- */
  const MODES = {
    plane: { icon: '✈️', name: 'Flight', speed: 820, over: 1.6, fixed: 55, perKm: 0.075 },
    train: { icon: '🚆', name: 'Train', speed: 150, over: 0.5, fixed: 12, perKm: 0.09 },
    bus:   { icon: '🚌', name: 'Bus',   speed: 72,  over: 0.4, fixed: 6,  perKm: 0.045 },
    ferry: { icon: '🚢', name: 'Ferry', speed: 38,  over: 1.2, fixed: 20, perKm: 0.08 },
    car:   { icon: '🚗', name: 'Car',   speed: 85,  over: 0.2, fixed: 40, perKm: 0.13 },
    bike:  { icon: '🚲', name: 'Bicycle', speed: 18, over: 0, fixed: 0, perKm: 0.012 },
    walk:  { icon: '🚶', name: 'Walking', speed: 4.5, over: 0, fixed: 0, perKm: 0.03 },
  };

  /* Legs available between a and b on a given day. Deterministic. */
  const BLOCKED = {}; // seed -> 'x-y' pair with no direct flight (keeps every day a routing puzzle)
  function legs(a, b, daySeed) {
    if (a.id === b.id) return [];
    const noFly = BLOCKED[daySeed] === [a.id, b.id].sort().join('-');
    const d = km(a, b), r = rng(hash(daySeed + '|' + [a.id, b.id].sort().join('-')));
    const out = [];
    const jitter = () => 0.8 + r() * 0.45;
    const land = sameLand(a, b) && !crossesMed(a, b);
    const add = (m, cost, hours, note) => out.push({ mode: m, icon: MODES[m].icon, name: MODES[m].name, cost: Math.round(cost), hours: Math.round(hours * 12) / 12, note });

    // plane: needs some distance; direct availability depends on hubs
    if (d > 220 && !noFly) {
      const hubScore = a.hub + b.hub + r() * 3;
      const direct = d < 3500 ? hubScore >= 2.5 : hubScore >= 4.2;
      if (direct) {
        const m = MODES.plane;
        const cheapHub = (a.hub + b.hub) >= 4 ? 0.82 : 1;
        add('plane', (m.fixed + d * m.perKm * (d > 4000 ? 0.75 : 1)) * jitter() * cheapHub, m.over + d / m.speed + (d > 5000 ? 0.6 : 0), 'direct');
      } else if (d > 900 && hubScore >= 1.8) {
        const m = MODES.plane;
        add('plane', (m.fixed + d * m.perKm) * jitter() * 1.05, m.over + d / m.speed + 2.2 + r() * 1.5, '1 stop');
      }
    }
    if (land) {
      if (a.rail && b.rail && d < 1400) {
        const m = MODES.train, hs = (a.hub + b.hub >= 3 && d < 900) ? 1.5 : 1; // high-speed corridors
        add('train', (m.fixed + d * m.perKm * (hs > 1 ? 1.25 : 1)) * jitter(), m.over + d / (m.speed * hs) + (d > 700 ? 1.5 : 0), hs > 1 ? 'high-speed' : null);
      }
      if (d < 1000) { const m = MODES.bus; add('bus', (m.fixed + d * m.perKm) * jitter(), m.over + d / m.speed + (d > 500 ? 1 : 0)); }
      if (d < 1200) { const m = MODES.car; add('car', (m.fixed + d * m.perKm) * jitter(), m.over + d / m.speed + Math.floor(d / 600) * 0.75, 'rental'); }
      if (d < 180) { const m = MODES.bike; add('bike', m.fixed + d * m.perKm, d / m.speed); }
      if (d < 45) { const m = MODES.walk; add('walk', d * m.perKm, d / m.speed); }
    }
    if (a.coastal && b.coastal && d < 1100 && (!land || d < 500 || crossesMed(a, b))) {
      const m = MODES.ferry; add('ferry', (m.fixed + d * m.perKm) * jitter(), m.over + d / m.speed);
    }
    return out;
  }

  /* ---------- daily challenge ---------- */
  const dayNumber = (t = Date.now()) => Math.floor((t - EPOCH) / DAY_MS) + 1;
  const dayKey = n => new Date(EPOCH + (n - 1) * DAY_MS).toISOString().slice(0, 10);
  function challenge(n) {
    const r = rng(hash('traverse-day-' + n));
    let a, b, tries = 0;
    do {
      a = C[Math.floor(r() * C.length)]; b = C[Math.floor(r() * C.length)];
      tries++;
    } while ((a.id === b.id || km(a, b) < 1500 || km(a, b) > 9500 || a.hub + b.hub < 2) && tries < 200);
    BLOCKED['d' + n] = [a.id, b.id].sort().join('-');
    return { n, key: dayKey(n), seed: 'd' + n, from: a, to: b };
  }

  /* ---------- benchmarks (Dijkstra) ---------- */
  function graph(seed) {
    const g = {};
    C.forEach(a => { g[a.id] = []; C.forEach(b => { legs(a, b, seed).forEach(l => g[a.id].push({ to: b.id, cost: l.cost, hours: l.hours, mode: l.mode })); }); });
    return g;
  }
  function dijkstra(g, from, to, w) {
    const dist = {}, prev = {}, done = {}; C.forEach(c => (dist[c.id] = Infinity)); dist[from] = 0;
    for (;;) {
      let u = null; for (const k in dist) if (!done[k] && (u === null || dist[k] < dist[u])) u = k;
      if (u === null || dist[u] === Infinity) break; if (u === to) break; done[u] = true;
      g[u].forEach(e => { const nd = dist[u] + w(e); if (nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = { from: u, e }; } });
    }
    const path = []; let cur = to; while (prev[cur]) { path.unshift({ from: prev[cur].from, to: cur, ...prev[cur].e }); cur = prev[cur].from; }
    return { cost: path.reduce((a, e) => a + e.cost, 0), hours: path.reduce((a, e) => a + e.hours, 0), path };
  }
  function benchmarks(ch) {
    const g = graph(ch.seed);
    const cheap = dijkstra(g, ch.from.id, ch.to.id, e => e.cost + e.hours * 0.01);
    const fast = dijkstra(g, ch.from.id, ch.to.id, e => e.hours + e.cost * 0.0001);
    return { cheapest: cheap.cost, fastest: fast.hours, cheapPath: cheap.path, fastPath: fast.path };
  }

  /* ---------- scoring (intentionally not shown to players) ---------- */
  function score(cost, hours, secs, bm) {
    if (!(cost > 0) || !(hours > 0)) return 0;
    const costF = Math.pow(Math.min(1, bm.cheapest / cost), 1.1);
    const timeF = Math.pow(Math.min(1, bm.fastest / hours), 1.1);
    const decF = Math.exp(-Math.max(0, secs - 8) / 150);
    const blend = 0.38 * costF + 0.38 * timeF + 0.24 * decF;
    // routes that are good at *both* money and time beat routes that max out only one
    const synergy = 0.85 + 0.15 * Math.sqrt(costF * timeF);
    return Math.round(10000 * Math.min(1, blend * synergy));
  }

  /* ---------- simulated global field (no backend) ---------- */
  function field(ch, bm) {
    const r = rng(hash('field-' + ch.seed)); const n = 1800 + Math.floor(r() * 2400);
    const scores = [];
    for (let i = 0; i < n; i++) {
      const skill = r(); // 0..1
      const cost = bm.cheapest * (1.04 + (1 - skill) * (0.2 + r() * 2.2));
      const hrs = bm.fastest * (1.03 + (1 - skill) * (0.1 + r() * 2.5));
      const secs = 15 + (1 - skill) * 200 * r() + r() * 60;
      scores.push(score(cost, hrs, secs, bm));
    }
    return scores.sort((x, y) => y - x);
  }
  const rankOf = (s, fld) => { let i = 0; while (i < fld.length && fld[i] > s) i++; return { rank: i + 1, of: fld.length + 1 }; };

  /* ---------- storage ---------- */
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; } };
  const save = s => { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch (e) {} };

  /* ---------- formatting ---------- */
  const money = n => '$' + Math.round(n).toLocaleString('en-US');
  const dur = h => { const m = Math.round(h * 60); const d = Math.floor(m / 1440), hh = Math.floor((m % 1440) / 60), mm = m % 60; return (d ? d + 'd ' : '') + (hh || !d ? hh + 'h ' : '') + (mm || (!d && !hh) ? mm + 'm' : '').trim(); };
  const secsF = s => s < 60 ? Math.round(s) + 's' : Math.floor(s / 60) + 'm ' + Math.round(s % 60) + 's';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  window.Traverse = { C, byId, km, legs, MODES, dayNumber, dayKey, challenge, benchmarks, score, field, rankOf, load, save, money, dur, secsF, esc, rng, hash };
})();
