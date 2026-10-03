// Builds data/world.js (map geometry) and data/countries.js (facts) from npm datasets.
// Usage: npm i world-atlas world-countries && node tools/build-data.js
const fs = require('fs');
const atlas = require('world-atlas/countries-50m.json');
const wc = require('world-countries');
const pops = require('country-json/src/country-by-population.json'); // npm i country-json
const popBy = {}; pops.forEach(p => popBy[p.country.toLowerCase()] = p.population);
const topo = JSON.parse(JSON.stringify(atlas));
delete topo.objects.land;
fs.writeFileSync(__dirname + '/../data/world.js', 'window.WORLD_TOPO=' + JSON.stringify(topo) + ';\n');
const ids = new Set(topo.objects.countries.geometries.map(g => String(g.id)));
const out = [];
const manual = { COD: 'the democratic republic of congo', FJI: 'fiji islands', TUR: 'turkey' };
const popOf = c => popBy[manual[c.cca3]] ?? [c.name.common, c.name.official, ...(c.altSpellings || [])].map(n => popBy[n.toLowerCase()]).find(v => v != null) ?? null;
for (const c of wc) {
  if (!ids.has(String(c.ccn3))) continue;
  out.push({
    id: String(c.ccn3), code: c.cca3, cca2: c.cca2, name: c.name.common, official: c.name.official,
    capital: (c.capital || [])[0] || '', region: c.region, subregion: c.subregion || '',
    languages: Object.values(c.languages || {}),
    currencies: Object.values(c.currencies || {}).map(x => x.name + (x.symbol ? ' (' + x.symbol + ')' : '')),
    population: popOf(c), area: c.area, flag: c.flag, latlng: c.latlng,
    landlocked: c.landlocked, independent: !!c.independent, un: !!c.unMember,
    borders: c.borders || [], demonym: (c.demonyms && c.demonyms.eng && c.demonyms.eng.m) || '',
    tld: (c.tld || [])[0] || '', wiki: c.name.common.replace(/ /g, '_')
  });
}
fs.writeFileSync(__dirname + '/../data/countries.js', 'window.COUNTRIES=' + JSON.stringify(out) + ';\n');
console.log(out.length, 'countries;', out.filter(c => c.independent).length, 'independent');
