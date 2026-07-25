/**
 * Algorithm Memory Lab — catalog UI for all patterns.
 * Depends on window.ALGO_MEMORY_PATTERNS (algo-memory-data.js).
 */
(function () {
  "use strict";

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function mountCatalog(root) {
    const patterns = window.ALGO_MEMORY_PATTERNS || [];
    if (!root || !patterns.length) {
      if (root) {
        root.innerHTML =
          '<p class="text-muted">Pattern catalog failed to load. Check algo-memory-data.js.</p>';
      }
      return;
    }

    root.innerHTML = `
      <div class="mem-lab-toolbar">
        <label>Study pattern
          <select id="mem-pattern-select">
            ${patterns
              .map(
                (p) =>
                  `<option value="${esc(p.id)}">${p.num}. ${esc(p.name)}</option>`
              )
              .join("")}
          </select>
        </label>
        <button type="button" class="anim-btn" id="mem-prev">Prev</button>
        <button type="button" class="anim-btn" id="mem-next">Next</button>
        <button type="button" class="anim-btn primary" id="mem-mark">Mark memorized</button>
        <span class="text-muted" id="mem-progress"></span>
      </div>
      <div id="mem-detail" class="mem-detail"></div>
      <h3 style="margin-top:2rem">All 21 — quick index</h3>
      <div class="mem-index" id="mem-index"></div>
    `;

    const sel = root.querySelector("#mem-pattern-select");
    const detail = root.querySelector("#mem-detail");
    const index = root.querySelector("#mem-index");
    const progress = root.querySelector("#mem-progress");

    function memorizedSet() {
      try {
        return new Set(
          JSON.parse(localStorage.getItem("algo_mem_done") || "[]")
        );
      } catch {
        return new Set();
      }
    }

    function saveMemorized(set) {
      try {
        localStorage.setItem("algo_mem_done", JSON.stringify([...set]));
      } catch {
        /* ignore */
      }
    }

    function refreshProgress() {
      const done = memorizedSet();
      progress.textContent = `${done.size} / ${patterns.length} marked memorized`;
      index.querySelectorAll("[data-id]").forEach((btn) => {
        btn.classList.toggle("done", done.has(btn.dataset.id));
      });
    }

    function renderDetail(id) {
      const p = patterns.find((x) => x.id === id) || patterns[0];
      sel.value = p.id;
      const done = memorizedSet().has(p.id);
      detail.innerHTML = `
        <article class="mem-card" id="mem-${esc(p.id)}">
          <header class="mem-card-head">
            <div>
              <h2 style="margin:0;border:none;padding:0">${p.num}. ${esc(
                p.name
              )}</h2>
              <div class="quiz-meta">${esc(p.category)} · ${
                done ? "memorized ✓" : "not marked yet"
              }</div>
            </div>
            <a class="anim-btn" href="${esc(p.href)}">Full pattern page →</a>
          </header>
          <p>${esc(p.description)}</p>
          <div class="mem-grid-3">
            <div class="callout callout-info">
              <div class="callout-title">Picture (palace)</div>
              <p>${esc(p.picture)}</p>
            </div>
            <div class="callout callout-info">
              <div class="callout-title">Movie (one-liner)</div>
              <p>${esc(p.movie)}</p>
            </div>
            <div class="callout callout-ee">
              <div class="callout-title">EE bridge</div>
              <p>${esc(p.ee)}</p>
            </div>
          </div>
          <div class="mem-movie-slot" id="mem-movie-slot"></div>
          <h4>When to use (trigger signals)</h4>
          <ul>${p.when.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
          <h4>Approach checklist</h4>
          <ol>${p.approach.map((a) => `<li>${esc(a)}</li>`).join("")}</ol>
          <h4>Skeleton — recite, then type from blank</h4>
          <pre class="flash-skeleton">${esc(p.skeleton)}</pre>
          <div class="mem-complexity">
            <span><strong>Time:</strong> ${esc(p.time)}</span>
            <span><strong>Space:</strong> ${esc(p.space)}</span>
          </div>
          <h4>Pitfalls</h4>
          <ul>${p.pitfalls.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          <h4>Canonical problems</h4>
          <ul>${p.canonical.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          <p class="text-muted">Related: ${
            p.related.map((r) => `<a href="patterns.html#${esc(r)}">${esc(r)}</a>`).join(" · ") || "—"
          }</p>
          <p>
            Drill in
            <a href="practice.html">Practice Arena</a>
            (pick pattern <code>${esc(p.id)}</code>).
          </p>
        </article>
      `;
      const slot = detail.querySelector("#mem-movie-slot");
      if (window.AlgoMemoryMovies && slot) {
        window.AlgoMemoryMovies.mountMovie(slot, p.id);
      }
      refreshProgress();
      if (window.location.hash === "#" + p.id || window.location.hash === "#mem-" + p.id) {
        detail.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    index.innerHTML = patterns
      .map(
        (p) =>
          `<button type="button" class="mem-index-btn" data-id="${esc(
            p.id
          )}">${p.num}. ${esc(p.name)}</button>`
      )
      .join("");

    index.querySelectorAll("[data-id]").forEach((btn) => {
      btn.onclick = () => {
        renderDetail(btn.dataset.id);
        history.replaceState(null, "", "#" + btn.dataset.id);
      };
    });

    sel.onchange = () => {
      renderDetail(sel.value);
      history.replaceState(null, "", "#" + sel.value);
    };
    root.querySelector("#mem-prev").onclick = () => {
      const i = patterns.findIndex((p) => p.id === sel.value);
      const n = (i - 1 + patterns.length) % patterns.length;
      renderDetail(patterns[n].id);
      history.replaceState(null, "", "#" + patterns[n].id);
    };
    root.querySelector("#mem-next").onclick = () => {
      const i = patterns.findIndex((p) => p.id === sel.value);
      const n = (i + 1) % patterns.length;
      renderDetail(patterns[n].id);
      history.replaceState(null, "", "#" + patterns[n].id);
    };
    root.querySelector("#mem-mark").onclick = () => {
      const set = memorizedSet();
      set.add(sel.value);
      saveMemorized(set);
      if (window.Course && window.Course.markLesson) {
        window.Course.markLesson("dsa_05_" + sel.value);
      }
      renderDetail(sel.value);
    };

    const hash = (location.hash || "").replace(/^#/, "").replace(/^mem-/, "");
    const start =
      patterns.find((p) => p.id === hash)?.id || patterns[0].id;
    renderDetail(start);
  }

  function mountPalaceTable(root) {
    const patterns = window.ALGO_MEMORY_PATTERNS || [];
    if (!root || !patterns.length) return;
    root.innerHTML = `
      <table class="mem-palace-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Pattern</th>
            <th>Picture</th>
            <th>Movie</th>
            <th>Links</th>
          </tr>
        </thead>
        <tbody>
          ${patterns
            .map(
              (p) => `<tr>
              <td>${p.num}</td>
              <td><a href="#${esc(p.id)}">${esc(p.name)}</a></td>
              <td>${esc(p.picture)}</td>
              <td>${esc(p.movie)}</td>
              <td>
                <a href="${esc(p.href)}">patterns</a> ·
                <a href="practice.html">arena</a>
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>`;
    root.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href").slice(1);
        const catalog = document.querySelector("[data-algo-memory-catalog]");
        if (catalog && window.AlgoMemory) {
          e.preventDefault();
          const sel = catalog.querySelector("#mem-pattern-select");
          if (sel) {
            sel.value = id;
            sel.dispatchEvent(new Event("change"));
            catalog.scrollIntoView({ behavior: "smooth" });
          }
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document
      .querySelectorAll("[data-algo-memory-catalog]")
      .forEach((el) => mountCatalog(el));
    document
      .querySelectorAll("[data-algo-memory-palace]")
      .forEach((el) => mountPalaceTable(el));
  });

  window.AlgoMemory = { mountCatalog, mountPalaceTable };
})();
