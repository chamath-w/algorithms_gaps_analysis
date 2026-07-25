/**
 * Algorithm Animation Engine
 * Step-through animations for algorithm visualizations.
 */

class AlgoAnimation {
  constructor(containerId, steps, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.steps = steps; // Array of { apply: fn, description: string }
    this.currentStep = -1;
    this.playing = false;
    this.speed = options.speed || 800;
    this.timer = null;
    this.onReset = options.onReset || null;
    this._buildControls();
  }

  _buildControls() {
    const controls = this.container.querySelector(".anim-controls");
    if (!controls) return;

    controls.innerHTML = `
      <button class="anim-btn" data-action="reset" title="Reset">&#8634; Reset</button>
      <button class="anim-btn" data-action="prev" title="Previous">&larr; Prev</button>
      <button class="anim-btn primary" data-action="play" title="Play/Pause">&#9654; Play</button>
      <button class="anim-btn" data-action="next" title="Next">Next &rarr;</button>
      <span class="anim-step-info">0 / ${this.steps.length}</span>
    `;

    controls.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === "reset") this.reset();
      else if (action === "prev") this.prev();
      else if (action === "next") this.next();
      else if (action === "play") this.togglePlay();
    });

    this.stepInfo = controls.querySelector(".anim-step-info");
    this.playBtn = controls.querySelector('[data-action="play"]');
    this.descEl = this.container.querySelector(".anim-description");
  }

  _updateUI() {
    if (this.stepInfo) {
      this.stepInfo.textContent = `${Math.max(0, this.currentStep + 1)} / ${this.steps.length}`;
    }
    if (
      this.descEl &&
      this.currentStep >= 0 &&
      this.currentStep < this.steps.length
    ) {
      this.descEl.textContent = this.steps[this.currentStep].description || "";
    } else if (this.descEl && this.currentStep < 0) {
      this.descEl.textContent = "Press Play or Next to begin.";
    }
    if (this.playBtn) {
      this.playBtn.innerHTML = this.playing
        ? "&#9646;&#9646; Pause"
        : "&#9654; Play";
    }
  }

  next() {
    if (this.currentStep >= this.steps.length - 1) {
      this.stop();
      return false;
    }
    this.currentStep++;
    this.steps[this.currentStep].apply();
    this._updateUI();
    return true;
  }

  prev() {
    if (this.currentStep <= 0) return;
    this.reset(false);
    const target = this.currentStep - 1;
    for (let i = 0; i <= target; i++) {
      this.currentStep = i;
      this.steps[i].apply();
    }
    this._updateUI();
  }

  reset(updateUI = true) {
    this.stop();
    this.currentStep = -1;
    if (this.onReset) this.onReset();
    if (updateUI) this._updateUI();
  }

  togglePlay() {
    if (this.playing) this.stop();
    else this.play();
  }

  play() {
    if (this.currentStep >= this.steps.length - 1) this.reset(false);
    this.playing = true;
    this._updateUI();
    this._tick();
  }

  stop() {
    this.playing = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this._updateUI();
  }

  _tick() {
    if (!this.playing) return;
    if (!this.next()) return;
    this.timer = setTimeout(() => this._tick(), this.speed);
  }
}

/* ===== SVG Helper Functions ===== */

function setClass(el, className) {
  if (typeof el === "string") el = document.getElementById(el);
  if (el) el.setAttribute("class", className);
}

function setText(el, text) {
  if (typeof el === "string") el = document.getElementById(el);
  if (el) el.textContent = text;
}

function setAttr(el, attr, value) {
  if (typeof el === "string") el = document.getElementById(el);
  if (el) el.setAttribute(attr, value);
}

function showEl(el) {
  if (typeof el === "string") el = document.getElementById(el);
  if (el) el.style.display = "";
}

function hideEl(el) {
  if (typeof el === "string") el = document.getElementById(el);
  if (el) el.style.display = "none";
}

function setOpacity(el, val) {
  if (typeof el === "string") el = document.getElementById(el);
  if (el) el.style.opacity = val;
}

/* ===== Array Visualization Builder ===== */

function buildArraySVG(svgId, values, options = {}) {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  const cellW = options.cellWidth || 50;
  const cellH = options.cellHeight || 44;
  const gap = options.gap || 4;
  const startX = options.startX || 30;
  const startY = options.startY || 40;
  const totalW = values.length * (cellW + gap) - gap + startX * 2;

  svg.setAttribute("viewBox", `0 0 ${totalW} ${startY + cellH + 40}`);

  let html = "";
  values.forEach((v, i) => {
    const x = startX + i * (cellW + gap);
    html += `<rect id="${svgId}-cell-${i}" class="array-cell" x="${x}" y="${startY}" width="${cellW}" height="${cellH}" rx="4"/>`;
    html += `<text id="${svgId}-val-${i}" class="array-value" x="${x + cellW / 2}" y="${startY + cellH / 2}">${v}</text>`;
    html += `<text id="${svgId}-idx-${i}" class="array-index" x="${x + cellW / 2}" y="${startY - 8}">${i}</text>`;
  });

  // Pointer areas (below array)
  html += `<g id="${svgId}-pointers"></g>`;
  // Annotation area (above array)
  html += `<g id="${svgId}-annotations"></g>`;

  svg.innerHTML = html;
  return { cellW, cellH, gap, startX, startY, totalW };
}

function setArrayCellClass(svgId, index, className) {
  setClass(`${svgId}-cell-${index}`, className);
}

function addPointer(svgId, index, label, color, layout) {
  const g = document.getElementById(`${svgId}-pointers`);
  if (!g || !layout) return;
  const x =
    layout.startX + index * (layout.cellW + layout.gap) + layout.cellW / 2;
  const y = layout.startY + layout.cellH + 18;
  const id = `${svgId}-ptr-${label}`;
  let el = document.getElementById(id);
  if (el) {
    el.setAttribute("transform", `translate(${x}, ${y})`);
  } else {
    const ptr = document.createElementNS("http://www.w3.org/2000/svg", "g");
    ptr.id = id;
    ptr.setAttribute("transform", `translate(${x}, ${y})`);
    ptr.innerHTML = `
      <polygon points="0,-8 -5,0 5,0" fill="${color}" />
      <text y="14" text-anchor="middle" fill="${color}" font-size="12" font-weight="700">${label}</text>
    `;
    g.appendChild(ptr);
  }
}

function movePointer(svgId, label, index, layout) {
  const id = `${svgId}-ptr-${label}`;
  const el = document.getElementById(id);
  if (!el || !layout) return;
  const x =
    layout.startX + index * (layout.cellW + layout.gap) + layout.cellW / 2;
  const y = layout.startY + layout.cellH + 18;
  el.setAttribute("transform", `translate(${x}, ${y})`);
}

/* ===== Graph Visualization Builder ===== */

function buildGraphSVG(svgId, nodes, edges, options = {}) {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  const r = options.nodeRadius || 22;
  const directed = options.directed !== false;
  const w = options.width || 500;
  const h = options.height || 300;

  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

  let defs = "<defs>";
  if (directed) {
    defs += `<marker id="${svgId}-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#484f58"/>
    </marker>
    <marker id="${svgId}-arrow-active" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#58a6ff"/>
    </marker>
    <marker id="${svgId}-arrow-path" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" fill="#3fb950"/>
    </marker>`;
  }
  defs += "</defs>";

  let edgesHTML = "";
  edges.forEach((e, i) => {
    const from = nodes[e.from];
    const to = nodes[e.to];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const sx = from.x + (dx / dist) * r;
    const sy = from.y + (dy / dist) * r;
    const ex = to.x - (dx / dist) * r;
    const ey = to.y - (dy / dist) * r;
    const marker = directed ? `marker-end="url(#${svgId}-arrow)"` : "";
    edgesHTML += `<line id="${svgId}-edge-${i}" class="edge" x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" ${marker}/>`;
    if (e.weight !== undefined) {
      const mx = (sx + ex) / 2;
      const my = (sy + ey) / 2 - 8;
      edgesHTML += `<text id="${svgId}-eweight-${i}" class="label-small" x="${mx}" y="${my}">${e.weight}</text>`;
    }
  });

  let nodesHTML = "";
  nodes.forEach((n, i) => {
    nodesHTML += `<circle id="${svgId}-node-${i}" class="node-fill node-stroke" cx="${n.x}" cy="${n.y}" r="${r}"/>`;
    nodesHTML += `<text id="${svgId}-nlabel-${i}" class="label-text" x="${n.x}" y="${n.y}">${n.label || i}</text>`;
  });

  svg.innerHTML =
    defs +
    '<g id="' +
    svgId +
    '-edges">' +
    edgesHTML +
    '</g><g id="' +
    svgId +
    '-nodes">' +
    nodesHTML +
    "</g>";
}

/* ===== Tree Visualization Builder ===== */

function buildTreeSVG(svgId, treeData, options = {}) {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  const r = options.nodeRadius || 20;
  const levelH = options.levelHeight || 70;
  const w = options.width || 500;
  const h = options.height || 280;

  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);

  // treeData: array of { label, x, y, children: [indices] }
  let edgesHTML = "";
  let nodesHTML = "";

  treeData.forEach((n, i) => {
    if (n.children) {
      n.children.forEach((ci) => {
        const child = treeData[ci];
        edgesHTML += `<line id="${svgId}-tedge-${i}-${ci}" class="edge" x1="${n.x}" y1="${n.y + r}" x2="${child.x}" y2="${child.y - r}"/>`;
      });
    }
    nodesHTML += `<circle id="${svgId}-tnode-${i}" class="node-fill node-stroke" cx="${n.x}" cy="${n.y}" r="${r}"/>`;
    nodesHTML += `<text id="${svgId}-tlabel-${i}" class="label-text" x="${n.x}" y="${n.y}">${n.label}</text>`;
  });

  svg.innerHTML = "<g>" + edgesHTML + "</g><g>" + nodesHTML + "</g>";
}

/* ===== Stack/Queue Visualization ===== */

function buildStackSVG(svgId, capacity, options = {}) {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  const cellW = options.cellWidth || 60;
  const cellH = options.cellHeight || 36;
  const x = options.x || 50;
  const bottomY = options.bottomY || 250;

  svg.setAttribute("viewBox", `0 0 ${cellW + x * 2 + 80} ${bottomY + 30}`);

  let html = "";
  for (let i = 0; i < capacity; i++) {
    const y = bottomY - (i + 1) * cellH;
    html += `<rect id="${svgId}-scell-${i}" x="${x}" y="${y}" width="${cellW}" height="${cellH}" class="array-cell" style="display:none"/>`;
    html += `<text id="${svgId}-sval-${i}" x="${x + cellW / 2}" y="${y + cellH / 2}" class="array-value" style="display:none"></text>`;
  }
  // Top pointer
  html += `<text id="${svgId}-top-ptr" x="${x + cellW + 15}" y="${bottomY}" font-size="12" fill="#d29922" font-weight="700">top</text>`;
  // Label
  html += `<text x="${x + cellW / 2}" y="${bottomY + 20}" class="label-small">Stack</text>`;

  svg.innerHTML = html;
  return { cellW, cellH, x, bottomY };
}

/* ===== Tabs Controller ===== */

function initTabs() {
  document.querySelectorAll(".tabs").forEach((tabBar) => {
    const contents = tabBar.parentElement.querySelectorAll(".tab-content");
    tabBar.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        tabBar
          .querySelectorAll(".tab")
          .forEach((t) => t.classList.remove("active"));
        contents.forEach((c) => c.classList.remove("active"));
        tab.classList.add("active");
        const target = document.getElementById(tab.dataset.target);
        if (target) target.classList.add("active");
      });
    });
  });
}

/* ===== Sidebar Toggle ===== */

function initSidebar() {
  const toggle = document.querySelector(".menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  if (toggle && sidebar) {
    toggle.addEventListener("click", () => sidebar.classList.toggle("open"));
    document.querySelector(".main-content")?.addEventListener("click", () => {
      sidebar.classList.remove("open");
    });
  }

  // Highlight active nav link
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach((link) => {
    if (link.getAttribute("href") === current) {
      link.classList.add("active");
    }
  });
}

/* ===== Scroll to Top ===== */

function initScrollTop() {
  const btn = document.querySelector(".scroll-top");
  if (!btn) return;
  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 400);
  });
  btn.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" }),
  );
}

/* ===== Init ===== */

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initSidebar();
  initScrollTop();
});
