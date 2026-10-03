/* Interactive canvas globe built on d3-geo. */
(function () {
  const feats = topojson.feature(WORLD_TOPO, WORLD_TOPO.objects.countries).features;
  const byId = {};
  COUNTRIES.forEach(c => (byId[c.id] = c));
  feats.forEach(f => (f.country = byId[String(f.id)] || null));
  const sphere = { type: 'Sphere' };
  const graticule = d3.geoGraticule10();

  window.GeoGlobe = function (canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    const projection = d3.geoOrthographic().clipAngle(90).rotate([-10, -20]);
    const path = d3.geoPath(projection, ctx);
    let W = 0, H = 0, base = 1, zoom = 1, hover = null, selected = null, spin = !!opts.spin, tween = null;
    let last = performance.now(), dragging = false;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      base = Math.min(W, H) / 2 - 8;
      projection.translate([W / 2, H / 2]).scale(base * zoom);
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const R = projection.scale();
      const [cx, cy] = projection.translate();
      // atmosphere glow
      const g = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.12);
      g.addColorStop(0, 'rgba(58,160,255,.35)'); g.addColorStop(1, 'rgba(58,160,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, 7); ctx.fill();
      // ocean
      const o = ctx.createRadialGradient(cx - R * .3, cy - R * .3, R * .1, cx, cy, R);
      o.addColorStop(0, '#0d3a66'); o.addColorStop(1, '#041425');
      ctx.beginPath(); path(sphere); ctx.fillStyle = o; ctx.fill();
      ctx.beginPath(); path(graticule); ctx.strokeStyle = 'rgba(58,160,255,.14)'; ctx.lineWidth = .5; ctx.stroke();
      // land
      for (const f of feats) {
        ctx.beginPath(); path(f);
        const isSel = selected && f.country === selected, isHov = hover && f.country === hover;
        ctx.fillStyle = isSel ? '#ffd24a' : isHov ? '#39f08e' : (f.country && f.country.independent ? '#17714a' : '#135a45');
        ctx.fill();
        ctx.strokeStyle = isSel ? '#fff' : 'rgba(180,255,214,.35)'; ctx.lineWidth = isSel ? 1.4 : .5; ctx.stroke();
      }
      ctx.beginPath(); path(sphere); ctx.strokeStyle = 'rgba(58,160,255,.6)'; ctx.lineWidth = 1.2; ctx.stroke();
    }

    function pick(x, y) {
      const p = projection.invert([x, y]);
      if (!p || d3.geoDistance(p, [-projection.rotate()[0], -projection.rotate()[1]]) > Math.PI / 2) return null;
      for (const f of feats) if (f.country && d3.geoContains(f, p)) return f.country;
      return null;
    }

    function rotateTo(country, scaleTo) {
      const f = feats.find(x => x.country === country);
      if (!f) return;
      const c = d3.geoCentroid(f), r0 = projection.rotate(), r1 = [-c[0], -c[1]];
      const ip = d3.interpolate(r0, r1), iz = d3.interpolate(zoom, scaleTo || Math.max(zoom, 1.5));
      tween = { t0: performance.now(), dur: 900, ip, iz };
    }

    function frame(now) {
      const dt = now - last; last = now;
      if (tween) {
        let k = Math.min(1, (now - tween.t0) / tween.dur); k = d3.easeCubicInOut(k);
        projection.rotate(tween.ip(k)); zoom = tween.iz(k); projection.scale(base * zoom);
        if (k >= 1) tween = null;
        draw();
      } else if (spin && !dragging) {
        const r = projection.rotate(); projection.rotate([r[0] + dt * 0.006, r[1]]); draw();
      }
      requestAnimationFrame(frame);
    }

    // pointer interaction
    if (!opts.static) {
      let sx, sy, rot0, moved = 0, pointers = new Map(), pinch0 = null;
      const tip = opts.tip;
      canvas.addEventListener('pointerdown', e => {
        canvas.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, [e.clientX, e.clientY]);
        if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: zoom }; }
        dragging = true; tween = null; moved = 0; sx = e.clientX; sy = e.clientY; rot0 = projection.rotate();
      });
      canvas.addEventListener('pointermove', e => {
        const r = canvas.getBoundingClientRect();
        if (pointers.has(e.pointerId)) pointers.set(e.pointerId, [e.clientX, e.clientY]);
        if (pointers.size === 2 && pinch0) {
          const [a, b] = [...pointers.values()];
          setZoom(pinch0.z * Math.hypot(a[0] - b[0], a[1] - b[1]) / pinch0.d); return;
        }
        if (dragging) {
          const dx = e.clientX - sx, dy = e.clientY - sy; moved = Math.max(moved, Math.hypot(dx, dy));
          const k = 0.35 / zoom;
          projection.rotate([rot0[0] + dx * k, Math.max(-90, Math.min(90, rot0[1] - dy * k))]); draw();
        } else {
          const h = pick(e.clientX - r.left, e.clientY - r.top);
          if (h !== hover) { hover = h; draw(); canvas.style.cursor = h ? 'pointer' : 'grab'; }
          if (tip) {
            if (h) { tip.textContent = h.name; tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top) + 'px'; tip.hidden = false; }
            else tip.hidden = true;
          }
        }
      });
      const up = e => {
        pointers.delete(e.pointerId); pinch0 = null;
        if (!pointers.size) {
          dragging = false;
          if (e.type === 'pointerup' && moved < 5) {
            const r = canvas.getBoundingClientRect();
            const c = pick(e.clientX - r.left, e.clientY - r.top);
            if (c && opts.onSelect) opts.onSelect(c);
          }
        }
      };
      canvas.addEventListener('pointerup', up);
      canvas.addEventListener('pointercancel', up);
      canvas.addEventListener('pointerleave', () => { hover = null; if (tip) tip.hidden = true; draw(); });
      canvas.addEventListener('wheel', e => { e.preventDefault(); setZoom(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)); }, { passive: false });
    }
    function setZoom(z) { zoom = Math.max(.8, Math.min(14, z)); projection.scale(base * zoom); draw(); }

    new ResizeObserver(resize).observe(canvas);
    resize(); requestAnimationFrame(frame);
    return {
      select(c, focus) { selected = c; if (focus !== false) rotateTo(c); draw(); },
      zoomBy(k) { setZoom(zoom * k); },
      setSpin(v) { spin = v; },
    };
  };
})();
