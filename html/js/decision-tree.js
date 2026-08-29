/**
 * Pattern decision tree — data-driven layout (no overlapping branches).
 */
(function () {
  "use strict";

  const COLORS = {
    array: { fill: "rgba(88,166,255,0.18)", stroke: "#58a6ff", text: "#58a6ff" },
    search: { fill: "rgba(57,210,192,0.18)", stroke: "#39d2c0", text: "#39d2c0" },
    graph: { fill: "rgba(63,185,80,0.18)", stroke: "#3fb950", text: "#3fb950" },
    opt: { fill: "rgba(210,153,34,0.18)", stroke: "#d29922", text: "#d29922" },
    gen: { fill: "rgba(188,140,255,0.18)", stroke: "#bc8cff", text: "#bc8cff" },
    ds: { fill: "rgba(248,81,73,0.18)", stroke: "#f85149", text: "#f85149" },
    decision: { fill: "rgba(110,118,129,0.14)", stroke: "#6e7681", text: "#e6edf3" },
    start: { fill: "rgba(245,166,35,0.15)", stroke: "#f5a623", text: "#f5a623" },
  };

  const BRANCHES = [
    {
      id: "array",
      label: "Array / String",
      cx: 260,
      spread: 0,
      colWidth: 220,
      vertical: true,
      color: "array",
      tree: {
        q: "Contiguous\nsubarray?",
        yes: {
          q: "Fixed\nwindow size?",
          yes: { p: "Fixed Window", c: "array" },
          no: { p: "Variable Window", c: "array" },
        },
        no: {
          q: "Sorted or\ncan sort?",
          yes: {
            q: "Find pair/\ntriplet?",
            yes: { p: "Two Pointers", c: "array" },
            no: { p: "Binary Search", c: "search" },
          },
          no: {
            q: "Range sum\nqueries?",
            yes: { p: "Prefix Sum", c: "array" },
            no: {
              q: "Frequency /\ngrouping?",
              yes: { p: "Hash Map", c: "ds" },
              no: {
                q: "Next greater /\nsmaller?",
                yes: { p: "Monotonic Stack", c: "ds" },
                no: {
                  q: "Optimal value\n(min/max)?",
                  yes: {
                    q: "Greedy\nprovable?",
                    yes: { p: "Greedy", c: "opt" },
                    no: { p: "Dynamic Programming", c: "opt" },
                  },
                  no: { p: "Backtracking", c: "gen" },
                },
              },
            },
          },
        },
      },
    },
    {
      id: "tree",
      label: "Tree",
      cx: 520,
      spread: 78,
      colWidth: 240,
      color: "graph",
      tree: {
        q: "Level-by-level\noperation?",
        yes: { p: "BFS (Level Order)", c: "graph" },
        no: { p: "DFS (pre/in/post)", c: "graph" },
      },
    },
    {
      id: "graph",
      label: "Graph",
      cx: 780,
      spread: 88,
      colWidth: 280,
      color: "graph",
      tree: {
        q: "Shortest\npath?",
        yes: {
          q: "Weighted\nedges?",
          yes: { p: "Dijkstra", c: "graph" },
          no: { p: "BFS (shortest)", c: "graph" },
        },
        no: {
          q: "Dependencies /\nordering?",
          yes: { p: "Topological Sort", c: "graph" },
          no: {
            q: "Connected\ncomponents?",
            yes: { p: "Union Find", c: "graph" },
            no: {
              q: "Cycle\ndetection?",
              yes: { p: "DFS (3-state)", c: "graph" },
              no: { p: "DFS / BFS (general)", c: "graph" },
            },
          },
        },
      },
    },
    {
      id: "enum",
      label: "Enumeration",
      cx: 1040,
      spread: 78,
      colWidth: 240,
      color: "gen",
      tree: {
        q: "All permutations /\ncombinations?",
        yes: { p: "Backtracking", c: "gen" },
        no: { p: "Trie + Backtrack", c: "gen", note: "Words in grid" },
      },
    },
    {
      id: "dynamic",
      label: "Dynamic Collection",
      cx: 1280,
      spread: 78,
      colWidth: 240,
      color: "ds",
      tree: {
        q: "Top-K /\nK-th element?",
        yes: { p: "Heap (size K)", c: "ds" },
        no: {
          q: "Merge K\nsorted?",
          yes: { p: "Heap (K-merge)", c: "ds" },
          no: { p: "Two Heaps", c: "ds", note: "Running median" },
        },
      },
    },
  ];

  const KEYWORDS = [
    { signal: '"O(log n)" in constraints', pattern: "Binary Search", c: "search" },
    { signal: '"in-place" modification', pattern: "Two Pointers", c: "array" },
    { signal: '"prerequisite" / "dependency"', pattern: "Topological Sort", c: "graph" },
    { signal: '"connected" / "merge groups"', pattern: "Union Find", c: "graph" },
    { signal: '"prefix" / "starts with"', pattern: "Trie", c: "graph" },
  ];

  const ROW = 88;
  const ROW_TIGHT = 76;
  const START_X = 770;
  const START_Y = 70;
  const INPUT_Y = 150;
  const BRANCH_START = 240;

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function flatten(node, cx, y, spread, colMin, colMax, out, parentRef, opts) {
    opts = opts || {};
    const vertical = opts.vertical;
    const rowStep = opts.rowStep || ROW;
    if (!node) return y;
    if (node.p) {
      out.push({
        type: "pattern",
        label: node.p,
        note: node.note || "",
        color: node.c,
        x: cx,
        y,
        parent: parentRef || null,
      });
      return y + rowStep;
    }
    const decisionNode = {
      type: "decision",
      label: node.q,
      x: cx,
      y,
      parent: parentRef || null,
    };
    out.push(decisionNode);
    const ny = y + rowStep;
    const nextSpread = Math.max(48, spread * 0.88);
    let maxY = ny;

    if (node.yes && node.no) {
      if (vertical || spread < 55) {
        const yesEnd = flatten(
          node.yes,
          cx,
          ny,
          0,
          colMin,
          colMax,
          out,
          { node: decisionNode, edge: "yes" },
          { vertical, rowStep: ROW_TIGHT },
        );
        const noEnd = flatten(
          node.no,
          cx,
          yesEnd + 6,
          0,
          colMin,
          colMax,
          out,
          { node: decisionNode, edge: "no" },
          { vertical, rowStep: ROW_TIGHT },
        );
        maxY = noEnd;
      } else {
        const yesX = Math.max(colMin + 60, cx - spread);
        const noX = Math.min(colMax - 60, cx + spread);
        const yesEnd = flatten(
          node.yes,
          yesX,
          ny,
          nextSpread,
          colMin,
          colMax,
          out,
          { node: decisionNode, edge: "yes" },
          opts,
        );
        const stackNo = yesX + 85 > noX - 45;
        const noY = stackNo ? yesEnd + 10 : ny;
        const noEnd = flatten(
          node.no,
          stackNo ? cx : noX,
          noY,
          nextSpread,
          colMin,
          colMax,
          out,
          { node: decisionNode, edge: "no" },
          opts,
        );
        maxY = Math.max(yesEnd, noEnd);
      }
    } else if (node.yes) {
      maxY = flatten(
        node.yes,
        cx,
        ny,
        nextSpread,
        colMin,
        colMax,
        out,
        { node: decisionNode, edge: "yes" },
        opts,
      );
    } else if (node.no) {
      maxY = flatten(
        node.no,
        cx,
        ny,
        nextSpread,
        colMin,
        colMax,
        out,
        { node: decisionNode, edge: "no" },
        opts,
      );
    }
    return maxY;
  }

  function nodeBounds(n) {
    if (n.type === "decision") {
      const lines = n.label.split("\n").length;
      const h = lines > 1 ? 36 : 29;
      return { l: n.x - 78, r: n.x + 78, t: n.y - h, b: n.y + h, w: 156, h: h * 2 };
    }
    if (n.type === "pattern") {
      const w = Math.max(130, n.label.length * 7.2) / 2 + 8;
      const h = n.note ? 42 : 22;
      return { l: n.x - w, r: n.x + w, t: n.y - 20, b: n.y + h, w: w * 2, h: h + 20 };
    }
    return null;
  }

  function boxesOverlap(a, b, pad) {
    pad = pad || 10;
    return a.l < b.r + pad && a.r > b.l - pad && a.t < b.b + pad && a.b > b.t - pad;
  }

  function resolveCollisions(nodes) {
    const byBranch = {};
    nodes.forEach((n) => {
      if (!byBranch[n.branch]) byBranch[n.branch] = [];
      byBranch[n.branch].push(n);
    });
    Object.values(byBranch).forEach((group) => {
      group.sort((a, b) => a.y - b.y || a.x - b.x);
      for (let pass = 0; pass < 32; pass++) {
        let moved = false;
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const ba = nodeBounds(group[i]);
            const bb = nodeBounds(group[j]);
            if (!ba || !bb || !boxesOverlap(ba, bb, 8)) continue;
            group[j].y += 12;
            moved = true;
          }
        }
        if (!moved) break;
      }
    });
  }

  function layout() {
    const nodes = [];
    const inputs = [];
    let maxY = BRANCH_START;

    nodes.push({ type: "start", label: "What is the input?", x: START_X, y: START_Y });

    BRANCHES.forEach((b, i) => {
      const colWidth = b.colWidth || 280;
      const colMin = b.cx - colWidth / 2;
      const colMax = b.cx + colWidth / 2;
      inputs.push({
        type: "input",
        label: b.label,
        color: b.color,
        x: b.cx,
        y: INPUT_Y,
        branch: b.id,
      });
      const branchNodes = [];
      const endY = flatten(
        b.tree,
        b.cx,
        BRANCH_START,
        b.spread,
        colMin,
        colMax,
        branchNodes,
        { type: "branch", inputIndex: i },
        { vertical: !!b.vertical, rowStep: b.vertical ? ROW_TIGHT : ROW },
      );
      branchNodes.forEach((n) => nodes.push({ ...n, branch: b.id }));
      maxY = Math.max(maxY, endY);
    });

    resolveCollisions(nodes);

    return { nodes, inputs, maxY: maxY + 48, startX: START_X };
  }

  function diamondPoints(cx, cy, w, h) {
    return `${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}`;
  }

  function edgePath(x1, y1, x2, y2) {
    const midY = y1 + (y2 - y1) * 0.45;
    return `M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`;
  }

  function renderNode(n) {
    const c = COLORS[n.color] || COLORS.decision;
    if (n.type === "start") {
      return `
        <g class="decision-node">
          <rect x="${n.x - 130}" y="${n.y - 22}" width="260" height="44" rx="22"
            fill="${COLORS.start.fill}" stroke="${COLORS.start.stroke}" stroke-width="2.5"/>
          <text x="${n.x}" y="${n.y + 5}" text-anchor="middle" font-size="15" font-weight="700"
            fill="${COLORS.start.text}">${esc(n.label)}</text>
        </g>`;
    }
    if (n.type === "input") {
      const w = Math.max(140, n.label.length * 7.5);
      return `
        <g class="decision-node">
          <rect x="${n.x - w / 2}" y="${n.y - 20}" width="${w}" height="40" rx="6"
            fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/>
          <text x="${n.x}" y="${n.y + 5}" text-anchor="middle" font-size="13" font-weight="600"
            fill="${c.text}">${esc(n.label)}</text>
        </g>`;
    }
    if (n.type === "decision") {
      const lines = n.label.split("\n");
      const h = lines.length > 1 ? 72 : 58;
      const w = 150;
      let text = lines
        .map(
          (line, i) =>
            `<text x="${n.x}" y="${n.y - 6 + i * 14}" text-anchor="middle" font-size="11" fill="${COLORS.decision.text}">${esc(line)}</text>`
        )
        .join("");
      return `
        <g class="decision-node">
          <polygon points="${diamondPoints(n.x, n.y, w, h)}" fill="${COLORS.decision.fill}"
            stroke="${COLORS.decision.stroke}" stroke-width="1.5"/>
          ${text}
        </g>`;
    }
    if (n.type === "pattern") {
      const c2 = COLORS[n.color] || COLORS.array;
      const w = Math.max(130, n.label.length * 7.2);
      const note = n.note
        ? `<text x="${n.x}" y="${n.y + 28}" text-anchor="middle" font-size="9" fill="#6e7681">${esc(n.note)}</text>`
        : "";
      return `
        <g class="pattern-node">
          <rect x="${n.x - w / 2}" y="${n.y - 17}" width="${w}" height="34" rx="17"
            fill="${c2.fill}" stroke="${c2.stroke}" stroke-width="2"/>
          <text x="${n.x}" y="${n.y + 4}" text-anchor="middle" font-size="12" font-weight="600"
            fill="${c2.text}">${esc(n.label)}</text>
          ${note}
        </g>`;
    }
    return "";
  }

  function renderEdges(all, inputs, start) {
    let html = "";
    inputs.forEach((inp) => {
      html += `<path d="${edgePath(start.x, start.y + 22, inp.x, inp.y - 20)}" fill="none" stroke="#484f58" stroke-width="1.5" marker-end="url(#fc-arrow)"/>`;
    });
    all.forEach((n) => {
      if (!n.parent) return;
      let px, py, label, lx, ly;
      const parent = n.parent;
      if (parent.type === "branch") {
        const inp = inputs[parent.inputIndex];
        if (!inp) return;
        px = inp.x;
        py = inp.y + 20;
        label = "";
      } else if (parent.node) {
        const p = parent.node;
        px = p.x;
        py = p.y + (p.type === "decision" ? 36 : 17);
        if (parent.edge === "yes") {
          label = "YES";
          lx = (px + n.x) / 2 - 18;
          ly = (py + n.y) / 2 - 6;
        } else if (parent.edge === "no") {
          label = "NO";
          lx = (px + n.x) / 2 + 4;
          ly = (py + n.y) / 2 - 6;
        }
      } else {
        return;
      }
      const ny = n.y - (n.type === "decision" ? 36 : 17);
      html += `<path d="${edgePath(px, py, n.x, ny)}" fill="none" stroke="#484f58" stroke-width="1.5" marker-end="url(#fc-arrow)"/>`;
      if (label) {
        html += `<text x="${lx}" y="${ly}" font-size="10" font-weight="600" fill="${parent.edge === "yes" ? "#3fb950" : "#f85149"}">${label}</text>`;
      }
    });
    return html;
  }

  function renderKeywords(y0) {
    const left = 60;
    const rowH = 52;
    let html = `
      <line x1="40" y1="${y0}" x2="1640" y2="${y0}" stroke="#30363d" stroke-width="1" stroke-dasharray="6,4"/>
      <text x="840" y="${y0 + 32}" text-anchor="middle" font-size="16" font-weight="700" fill="#bc8cff">Special Keyword Shortcuts</text>`;
    KEYWORDS.forEach((kw, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = col === 0 ? left : 780;
      const y = y0 + 55 + row * rowH;
      const c = COLORS[kw.c];
      const sw = Math.max(180, kw.signal.length * 6.2);
      html += `
        <rect x="${x}" y="${y}" width="${sw}" height="32" rx="16" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"/>
        <text x="${x + sw / 2}" y="${y + 20}" text-anchor="middle" font-size="11" fill="${c.text}">${esc(kw.signal)}</text>
        <line x1="${x + sw + 4}" y1="${y + 16}" x2="${x + sw + 44}" y2="${y + 16}" stroke="${c.stroke}" stroke-width="1.5" marker-end="url(#fc-arrow)"/>
        <rect x="${x + sw + 50}" y="${y + 1}" width="${Math.max(120, kw.pattern.length * 7.5)}" height="30" rx="15" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/>
        <text x="${x + sw + 50 + Math.max(60, kw.pattern.length * 3.75)}" y="${y + 20}" text-anchor="middle" font-size="12" font-weight="600" fill="${c.text}">${esc(kw.pattern)}</text>`;
    });
    return { html, height: y0 + 55 + Math.ceil(KEYWORDS.length / 2) * rowH + 30 };
  }

  function render(svg) {
    const { nodes, inputs, maxY, startX } = layout();
    const start = { type: "start", label: "What is the input?", x: startX, y: START_Y };
    const vbW = 1420;
    const vbH = maxY + 40;
    svg.setAttribute("viewBox", `0 0 ${vbW} ${vbH}`);
    svg.setAttribute("data-vbw", vbW);
    svg.setAttribute("data-vbh", vbH);
    svg.innerHTML = `
      <defs>
        <marker id="fc-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0,0 L10,5 L0,10 z" fill="#484f58"/>
        </marker>
      </defs>
      ${renderEdges(nodes, inputs, start)}
      ${renderNode(start)}
      ${inputs.map(renderNode).join("")}
      ${nodes.map(renderNode).join("")}`;
    return vbW;
  }

  function initZoom(viewport, svg) {
    const levelEl = document.getElementById("zp-level");
    const hint = document.getElementById("zp-hint");
    let scale = 1,
      panX = 0,
      panY = 0;
    let isPanning = false,
      sx = 0,
      sy = 0,
      spx = 0,
      spy = 0;
    const MIN = 0.25,
      MAX = 3,
      STEP = 0.15;
    const vbW = () => parseFloat(svg.getAttribute("data-vbw") || "1680");
    const vbH = () => {
      const parts = (svg.getAttribute("viewBox") || "0 0 1680 1400").split(/\s+/);
      return parseFloat(parts[3] || "1400");
    };

    function apply() {
      svg.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
      if (levelEl) levelEl.textContent = Math.round(scale * 100) + "%";
    }

    function fitToWidth() {
      const w = vbW();
      scale = (viewport.clientWidth / w) * 0.98;
      panX = 0;
      panY = 0;
      apply();
    }

    function resetView() {
      scale = 1;
      panX = 0;
      panY = 0;
      apply();
    }

    function zoomAt(cx, cy, delta) {
      const old = scale;
      scale = Math.min(MAX, Math.max(MIN, scale + delta));
      const r = scale / old;
      panX = cx - r * (cx - panX);
      panY = cy - r * (cy - panY);
      apply();
    }

    document.getElementById("zp-in")?.addEventListener("click", () => {
      const r = viewport.getBoundingClientRect();
      zoomAt(r.width / 2, r.height / 2, STEP);
    });
    document.getElementById("zp-out")?.addEventListener("click", () => {
      const r = viewport.getBoundingClientRect();
      zoomAt(r.width / 2, r.height / 2, -STEP);
    });
    document.getElementById("zp-fit")?.addEventListener("click", fitToWidth);
    document.getElementById("zp-reset")?.addEventListener("click", resetView);

    viewport.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const r = viewport.getBoundingClientRect();
        zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? STEP : -STEP);
      },
      { passive: false }
    );

    viewport.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isPanning = true;
      sx = e.clientX;
      sy = e.clientY;
      spx = panX;
      spy = panY;
      viewport.classList.add("grabbing", "panning");
    });
    window.addEventListener("mousemove", (e) => {
      if (!isPanning) return;
      panX = spx + (e.clientX - sx);
      panY = spy + (e.clientY - sy);
      apply();
    });
    window.addEventListener("mouseup", () => {
      if (!isPanning) return;
      isPanning = false;
      viewport.classList.remove("grabbing", "panning");
    });

    viewport.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length === 1) {
          isPanning = true;
          sx = e.touches[0].clientX;
          sy = e.touches[0].clientY;
          spx = panX;
          spy = panY;
          viewport.classList.add("panning");
        }
      },
      { passive: true }
    );
    viewport.addEventListener(
      "touchmove",
      (e) => {
        if (!isPanning || e.touches.length !== 1) return;
        panX = spx + (e.touches[0].clientX - sx);
        panY = spy + (e.touches[0].clientY - sy);
        apply();
      },
      { passive: true }
    );
    viewport.addEventListener("touchend", () => {
      isPanning = false;
      viewport.classList.remove("panning");
    });

    fitToWidth();
    if (hint) setTimeout(() => hint.classList.add("hidden"), 4000);
  }

  function init() {
    const svg = document.getElementById("fc-svg");
    const viewport = document.getElementById("fc-viewport");
    if (!svg || !viewport) return;
    render(svg);
    initZoom(viewport, svg);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
