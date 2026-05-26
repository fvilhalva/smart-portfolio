// graph.jsx — force-directed graph + interactions
// Exports: Graph component (props: nodes, edges, accent, onSelect, selectedId, density, paused)

(function () {
  const { useEffect, useRef, useState, useMemo, useCallback } = React;

  // ── Simulation constants by density ────────────────────────────────────
  const DENSITY = {
    sparse:  { rep: 9000, restLen: 240, spring: 0.018, grav: 0.006 },
    regular: { rep: 6800, restLen: 190, spring: 0.022, grav: 0.011 },
    dense:   { rep: 4200, restLen: 130, spring: 0.030, grav: 0.020 },
  };

  function initLayout(nodes, edges, width, height) {
    // Seed positions in a deterministic circle so the first frames don't explode
    const r = Math.min(width, height) * 0.32;
    const out = nodes.map((n, i) => {
      const t = (i / nodes.length) * Math.PI * 2;
      return {
        ...n,
        x: Math.cos(t) * r * (0.55 + 0.45 * Math.random()),
        y: Math.sin(t) * r * (0.55 + 0.45 * Math.random()),
        vx: 0, vy: 0, fx: 0, fy: 0,
      };
    });
    // Anchor "self" node at center
    const self = out.find(n => n.cat === 'self');
    if (self) { self.x = 0; self.y = 0; self.pinned = true; }
    return out;
  }

  function step(nodes, edgesByIdx, params, dt) {
    const { rep, restLen, spring, grav } = params;
    // Reset forces
    for (let i = 0; i < nodes.length; i++) { nodes[i].fx = 0; nodes[i].fy = 0; }
    // Repulsion (O(n²) is fine at this scale)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let d2 = dx * dx + dy * dy + 0.01;
        const d = Math.sqrt(d2);
        const f = rep / d2;
        const ux = dx / d, uy = dy / d;
        a.fx -= f * ux; a.fy -= f * uy;
        b.fx += f * ux; b.fy += f * uy;
      }
    }
    // Springs
    for (let k = 0; k < edgesByIdx.length; k++) {
      const [i, j] = edgesByIdx[k];
      const a = nodes[i], b = nodes[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) + 0.01;
      const f = spring * (d - restLen);
      const ux = dx / d, uy = dy / d;
      a.fx += f * ux; a.fy += f * uy;
      b.fx -= f * ux; b.fy -= f * uy;
    }
    // Gravity toward origin
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      n.fx -= n.x * grav;
      n.fy -= n.y * grav;
    }
    // Integrate
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.pinned || n.dragging) continue;
      n.vx = (n.vx + n.fx * dt) * 0.86;
      n.vy = (n.vy + n.fy * dt) * 0.86;
      // Velocity clamp
      const vm = Math.hypot(n.vx, n.vy);
      if (vm > 200) { n.vx *= 200 / vm; n.vy *= 200 / vm; }
      n.x += n.vx * dt;
      n.y += n.vy * dt;
    }
  }

  function Graph({ nodes: nodeData, edges: edgeData, accent, onSelect, selectedId, density = 'regular', paused = false, theme = 'light' }) {
    const svgRef = useRef(null);
    const wrapRef = useRef(null);
    const [size, setSize] = useState({ w: 1200, h: 800 });
    const [, force] = useState(0);
    const tick = useRef(0);
    const stateRef = useRef({ nodes: [], edgesByIdx: [], hover: null, drag: null });
    const pointerRef = useRef({ x: 0, y: 0 });

    // Resize observer
    useEffect(() => {
      const el = wrapRef.current;
      if (!el) return;
      const ro = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        setSize({ w: width, h: height });
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    // Initialize / re-initialize when node identity set changes
    const nodeKey = useMemo(() => nodeData.map(n => n.id).join('|'), [nodeData]);
    useEffect(() => {
      const ns = initLayout(nodeData, edgeData, size.w, size.h);
      const idIdx = Object.fromEntries(ns.map((n, i) => [n.id, i]));
      const eIdx = edgeData
        .map(([s, t]) => [idIdx[s], idIdx[t]])
        .filter(([a, b]) => a != null && b != null);
      stateRef.current.nodes = ns;
      stateRef.current.edgesByIdx = eIdx;
    }, [nodeKey]);

    // Animation loop
    useEffect(() => {
      let raf = 0;
      let last = performance.now();
      const params = DENSITY[density] || DENSITY.regular;
      const loop = (now) => {
        const dt = Math.min(0.04, (now - last) / 1000);
        last = now;
        if (!paused) {
          // Run a few sub-steps for stability
          for (let s = 0; s < 3; s++) step(stateRef.current.nodes, stateRef.current.edgesByIdx, params, dt / 3 * 60);
        }
        tick.current++;
        force(tick.current);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(raf);
    }, [density, paused]);

    // ── Pointer interactions ───────────────────────────────────────────
    const toLocal = (e) => {
      const r = svgRef.current.getBoundingClientRect();
      return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
    };

    const findNode = (p) => {
      const ns = stateRef.current.nodes;
      // Iterate in reverse so top-most wins
      for (let i = ns.length - 1; i >= 0; i--) {
        const n = ns[i];
        const dx = n.x - p.x, dy = n.y - p.y;
        const r = (n.size || 12) + 8;
        if (dx * dx + dy * dy < r * r) return n;
      }
      return null;
    };

    const onMove = (e) => {
      const p = toLocal(e);
      pointerRef.current = p;
      const drag = stateRef.current.drag;
      if (drag) {
        drag.x = p.x; drag.y = p.y; drag.vx = 0; drag.vy = 0;
      } else {
        const h = findNode(p);
        if ((stateRef.current.hover && stateRef.current.hover.id) !== (h && h.id)) {
          stateRef.current.hover = h;
          // No re-render needed; loop will pick it up
        }
      }
    };

    const onDown = (e) => {
      const p = toLocal(e);
      const n = findNode(p);
      if (n) {
        n.dragging = true;
        stateRef.current.drag = n;
        e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId);
      }
    };

    const onUp = (e) => {
      const drag = stateRef.current.drag;
      if (drag) {
        const moved = Math.hypot((drag.x - drag._downX) || 0, (drag.y - drag._downY) || 0);
        drag.dragging = false;
        stateRef.current.drag = null;
        if (moved < 4) {
          // Treat as click
          onSelect && onSelect(drag.id);
        }
      } else {
        // Background click: dismiss
        onSelect && onSelect(null);
      }
    };

    const onDownCapture = (e) => {
      const p = toLocal(e);
      const n = findNode(p);
      if (n) { n._downX = n.x; n._downY = n.y; }
    };

    // ── Render ─────────────────────────────────────────────────────────
    const ns = stateRef.current.nodes;
    const es = stateRef.current.edgesByIdx;
    const hover = stateRef.current.hover;
    const ink = theme === 'dark' ? '#f1ece1' : '#1a1814';
    const muted = theme === 'dark' ? 'rgba(241,236,225,0.18)' : 'rgba(26,24,20,0.18)';
    const mutedStrong = theme === 'dark' ? 'rgba(241,236,225,0.45)' : 'rgba(26,24,20,0.45)';
    const bg = theme === 'dark' ? '#0e0d0b' : '#f4f1ea';
    const nodeFill = theme === 'dark' ? '#1a1814' : '#faf8f3';

    const CAT_STYLE = {
      self:        { stroke: accent, fill: accent, glyph: '◉' },
      pesquisa:    { stroke: ink,    fill: nodeFill, glyph: '▲' },
      projeto:     { stroke: ink,    fill: nodeFill, glyph: '■' },
      skill:       { stroke: mutedStrong, fill: nodeFill, glyph: '·' },
      publicacao:  { stroke: ink,    fill: ink,   glyph: '✦' },
      contato:     { stroke: accent, fill: nodeFill, glyph: '◇' },
    };

    return (
      <div ref={wrapRef} className="graph-wrap">
        <svg
          ref={svgRef}
          className="graph-svg"
          width={size.w}
          height={size.h}
          viewBox={`${-size.w/2} ${-size.h/2} ${size.w} ${size.h}`}
          onPointerMove={onMove}
          onPointerDown={(e) => { onDownCapture(e); onDown(e); }}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <defs>
            <radialGradient id="haloGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
              <stop offset="60%" stopColor={accent} stopOpacity="0.05" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Edges */}
          <g className="edges">
            {es.map(([i, j], k) => {
              const a = ns[i], b = ns[j];
              if (!a || !b) return null;
              const sel = selectedId && (a.id === selectedId || b.id === selectedId);
              const hov = hover && (a.id === hover.id || b.id === hover.id);
              const op = sel ? 0.95 : hov ? 0.55 : 0.18;
              const sw = sel ? 1.4 : hov ? 1.0 : 0.6;
              return (
                <line
                  key={k}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke={sel ? accent : ink}
                  strokeOpacity={op}
                  strokeWidth={sw}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {ns.map((n) => {
              const s = CAT_STYLE[n.cat] || CAT_STYLE.skill;
              const isSel = n.id === selectedId;
              const isHov = hover && hover.id === n.id;
              const r = (n.size || 12);
              return (
                <g key={n.id} transform={`translate(${n.x},${n.y})`} className={`node ${isSel ? 'sel' : ''} ${isHov ? 'hov' : ''}`}>
                  {isSel && <circle r={r * 3.2} fill="url(#haloGrad)" />}
                  {(isHov || isSel) && (
                    <circle r={r + 6} fill="none" stroke={accent} strokeOpacity="0.6" strokeWidth="0.8" strokeDasharray="2 3" />
                  )}
                  <circle
                    r={r}
                    fill={s.fill}
                    stroke={isSel ? accent : s.stroke}
                    strokeWidth={isSel ? 1.6 : 1}
                  />
                  {n.cat === 'self' && (
                    <circle r={r * 0.45} fill={bg} />
                  )}
                  <text
                    className="node-label"
                    x={r + 10}
                    y={4}
                    fill={ink}
                    fillOpacity={isSel ? 1 : isHov ? 0.95 : 0.78}
                    style={{ fontSize: n.cat === 'self' ? 15 : n.cat === 'skill' ? 10 : 11.5 }}
                  >
                    {n.label}
                  </text>
                  {n.cat === 'self' && (
                    <text x={r + 10} y={20} fill={ink} fillOpacity="0.5" style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
                      você está aqui
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    );
  }

  Object.assign(window, { Graph });
})();
