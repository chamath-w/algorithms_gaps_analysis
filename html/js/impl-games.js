/**
 * Implementation Memory Games
 * Drill idiomatic pattern templates into long-term memory.
 */
(function () {
  const STORE_KEY = "implGamesProgress_v1";
  const data = () => window.IMPL_TEMPLATES;
  const items = () => (data() && data().items) || [];

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveProgress(p) {
    localStorage.setItem(STORE_KEY, JSON.stringify(p));
  }

  function itemProgress(id) {
    const p = loadProgress();
    if (!p[id]) {
      p[id] = {
        mastery: 0,
        streak: 0,
        last: null,
        scores: { type: 0, scramble: 0, cloze: 0, bug: 0, mantra: 0 },
      };
    }
    return p[id];
  }

  function recordResult(id, mode, ok, quality) {
    const all = loadProgress();
    const st = all[id] || itemProgress(id);
    st.last = new Date().toISOString();
    st.scores = st.scores || {};
    const prev = st.scores[mode] || 0;
    st.scores[mode] = ok ? Math.max(prev, quality || 1) : prev;
    if (ok) {
      st.streak = (st.streak || 0) + 1;
      const s = st.scores;
      let m = 0;
      if (s.mantra || s.cloze) m = Math.max(m, 1);
      if (s.cloze >= 1) m = Math.max(m, 2);
      if (s.scramble >= 1) m = Math.max(m, 3);
      if (s.type >= 0.85) m = Math.max(m, 4);
      if (s.type >= 0.98 && s.bug >= 1) m = Math.max(m, 5);
      else if (s.type >= 0.98) m = Math.max(m, 4);
      st.mastery = Math.max(st.mastery || 0, m);
    } else {
      st.streak = 0;
      if ((st.mastery || 0) > 0 && mode === "type") {
        st.mastery = Math.max(0, st.mastery - 1);
      }
    }
    all[id] = st;
    saveProgress(all);
    return st;
  }

  /* —— normalize / compare —— */
  function normalizeCode(src) {
    return String(src || "")
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((l) => l.replace(/#.*$/, "").replace(/\s+$/, ""))
      .filter((l) => {
        const t = l.trim();
        if (!t) return false;
        if (t === '"""' || t === "'''") return false;
        if ((t.startsWith('"""') || t.startsWith("'''")) && (t.endsWith('"""') || t.endsWith("'''")) && t.length > 3)
          return false;
        return true;
      })
      .map((l) => l.replace(/\t/g, "    "))
      .map((l) => {
        // drop pure docstrings on their own line mid-block already filtered
        if (/^\s*("""|''').*("""|''')\s*$/.test(l)) return null;
        return l;
      })
      .filter(Boolean)
      .map((l) => l.replace(/[ \t]+/g, " ").replace(/^ +/, (m) => " ".repeat(Math.min(m.length, 24))));
  }

  function similarity(aLines, bLines) {
    if (!aLines.length && !bLines.length) return 1;
    const n = Math.max(aLines.length, bLines.length);
    let match = 0;
    const m = Math.min(aLines.length, bLines.length);
    for (let i = 0; i < m; i++) {
      if (aLines[i].trim() === bLines[i].trim()) match += 1;
      else {
        // soft: token overlap
        const ta = new Set(aLines[i].trim().split(/\W+/).filter(Boolean));
        const tb = bLines[i].trim().split(/\W+/).filter(Boolean);
        const hit = tb.filter((t) => ta.has(t)).length;
        match += tb.length ? hit / tb.length : 0;
      }
    }
    return match / n;
  }

  function lineDiffHtml(expected, got) {
    const e = normalizeCode(expected);
    const g = normalizeCode(got);
    const rows = [];
    const n = Math.max(e.length, g.length);
    for (let i = 0; i < n; i++) {
      const el = e[i];
      const gl = g[i];
      if (el === undefined) {
        rows.push(`<div class="ig-diff-row bad"><span class="ig-diff-tag">+</span><code>${esc(gl)}</code></div>`);
      } else if (gl === undefined) {
        rows.push(`<div class="ig-diff-row miss"><span class="ig-diff-tag">−</span><code>${esc(el)}</code></div>`);
      } else if (el.trim() === gl.trim()) {
        rows.push(`<div class="ig-diff-row ok"><span class="ig-diff-tag">✓</span><code>${esc(el)}</code></div>`);
      } else {
        rows.push(
          `<div class="ig-diff-row bad"><span class="ig-diff-tag">≠</span><code>${esc(gl)}</code></div>` +
            `<div class="ig-diff-row miss"><span class="ig-diff-tag">→</span><code>${esc(el)}</code></div>`
        );
      }
    }
    return rows.join("");
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function findItem(id) {
    return items().find((x) => x.id === id);
  }

  function weakItems(limit) {
    const prog = loadProgress();
    return items()
      .map((it) => {
        const st = prog[it.id] || { mastery: 0, last: null };
        const age = st.last ? Date.now() - Date.parse(st.last) : 1e15;
        const score = (st.mastery || 0) * 10 - Math.min(age / 86400000, 30);
        return { it, score };
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, limit)
      .map((x) => x.it);
  }

  /* —— UI shell —— */
  function mount() {
    const root = document.querySelector("[data-impl-games]");
    if (!root || !data()) return;
    root.innerHTML = `
      <div class="ig-shell">
        <div class="ig-toolbar">
          <div class="ig-modes">
            <button type="button" class="ig-mode-btn active" data-view="map">Mastery Map</button>
            <button type="button" class="ig-mode-btn" data-view="workout">Daily Workout</button>
            <button type="button" class="ig-mode-btn" data-view="free">Free Play</button>
          </div>
          <div class="ig-stats" data-ig-stats></div>
        </div>
        <div class="ig-stage" data-ig-stage></div>
      </div>`;
    const stage = root.querySelector("[data-ig-stage]");
    root.querySelectorAll(".ig-mode-btn").forEach((btn) => {
      btn.onclick = () => {
        root.querySelectorAll(".ig-mode-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const v = btn.dataset.view;
        if (v === "map") renderMap(stage);
        else if (v === "workout") renderWorkout(stage);
        else renderFree(stage);
      };
    });
    updateStats(root);
    renderMap(stage);
  }

  function updateStats(root) {
    const el = (root || document).querySelector("[data-ig-stats]");
    if (!el) return;
    const prog = loadProgress();
    const all = items();
    const mastered = all.filter((it) => (prog[it.id] || {}).mastery >= 5).length;
    const started = all.filter((it) => (prog[it.id] || {}).mastery > 0).length;
    el.innerHTML = `<span>${mastered}/${all.length} locked in</span> · <span>${started} started</span>`;
  }

  function masteryClass(m) {
    if (m >= 5) return "ig-m5";
    if (m >= 4) return "ig-m4";
    if (m >= 3) return "ig-m3";
    if (m >= 2) return "ig-m2";
    if (m >= 1) return "ig-m1";
    return "ig-m0";
  }

  function renderMap(stage) {
    const prog = loadProgress();
    const groups = [
      { title: "21 Algorithm Patterns", kind: "pattern" },
      { title: "Core Algorithms", kind: "core" },
      { title: "Engineering Idioms", kind: "engineering" },
    ];
    stage.innerHTML = groups
      .map((g) => {
        const list = items().filter((it) => it.kind === g.kind);
        return `
        <section class="ig-map-section">
          <h3>${g.title}</h3>
          <div class="ig-map-grid">
            ${list
              .map((it) => {
                const st = prog[it.id] || { mastery: 0 };
                return `<button type="button" class="ig-tile ${masteryClass(st.mastery)}" data-id="${it.id}">
                  <span class="ig-tile-name">${esc(it.name)}</span>
                  <span class="ig-tile-m">${st.mastery}/5</span>
                </button>`;
              })
              .join("")}
          </div>
        </section>`;
      })
      .join("");
    stage.querySelectorAll(".ig-tile").forEach((btn) => {
      btn.onclick = () => openDrillMenu(stage, btn.dataset.id);
    });
    updateStats();
  }

  function openDrillMenu(stage, id) {
    const it = findItem(id);
    if (!it) return;
    const st = itemProgress(id);
    stage.innerHTML = `
      <div class="ig-drill-head">
        <button type="button" class="ig-back" data-back>← Map</button>
        <div>
          <h3>${esc(it.name)}</h3>
          <p class="ig-mantra">“${esc(it.mantra)}”</p>
          <p class="ig-meta">Mastery ${st.mastery}/5 · streak ${st.streak || 0}
            ${it.href ? ` · <a href="${esc(it.href)}">reference</a>` : ""}</p>
        </div>
      </div>
      <div class="ig-game-pick">
        <button type="button" data-g="mantra">1. Mantra recite</button>
        <button type="button" data-g="cloze">2. Cloze (key lines)</button>
        <button type="button" data-g="scramble">3. Line order</button>
        <button type="button" data-g="type">4. Type from blank</button>
        <button type="button" data-g="bug" ${it.bugs && it.bugs.length ? "" : "disabled"}>5. Bug hunt</button>
        <button type="button" data-g="reveal">Peek canonical</button>
      </div>
      <p class="ig-howto">
        New here? Read <a href="#how-to-play">How to play</a> above, then climb
        1→5. Peek only after a real attempt.
      </p>
      <div class="ig-when">
        <strong>Trigger when:</strong>
        <ul>${(it.when || []).map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
      </div>
      <div data-ig-play></div>`;
    stage.querySelector("[data-back]").onclick = () => renderMap(stage);
    const play = stage.querySelector("[data-ig-play]");
    stage.querySelectorAll("[data-g]").forEach((b) => {
      b.onclick = () => {
        const g = b.dataset.g;
        if (g === "mantra") gameMantra(play, it);
        else if (g === "cloze") gameCloze(play, it);
        else if (g === "scramble") gameScramble(play, it);
        else if (g === "type") gameType(play, it);
        else if (g === "bug") gameBug(play, it);
        else if (g === "reveal") {
          play.innerHTML = `<pre class="ig-code"><code>${esc(it.drill)}</code></pre>
            <p class="ig-hint">Cover this and switch to Type from blank.</p>`;
        }
      };
    });
  }

  function renderWorkout(stage) {
    const picks = weakItems(3);
    const modes = ["cloze", "scramble", "type"];
    let idx = 0;
    const run = () => {
      if (idx >= picks.length) {
        stage.innerHTML = `<div class="ig-done callout callout-info">
          <div class="callout-title">Workout complete</div>
          <p>Three weak templates reinforced. Open the Mastery Map or Free Play for more.</p>
          <button type="button" class="ig-primary" data-map>Back to map</button>
        </div>`;
        stage.querySelector("[data-map]").onclick = () => renderMap(stage);
        updateStats();
        return;
      }
      const it = picks[idx];
      const mode = modes[idx % modes.length];
      stage.innerHTML = `
        <div class="ig-workout-banner">Daily workout ${idx + 1}/${picks.length}:
          <strong>${esc(it.name)}</strong> — ${mode}</div>
        <div class="ig-howto">Auto-selected weak template. Complete this game to
          advance; three rounds finish the workout.</div>
        <div data-ig-play></div>`;
      const play = stage.querySelector("[data-ig-play]");
      const next = () => {
        idx += 1;
        run();
      };
      if (mode === "cloze") gameCloze(play, it, next);
      else if (mode === "scramble") gameScramble(play, it, next);
      else gameType(play, it, next);
    };
    if (!picks.length) {
      stage.innerHTML = `<p>No templates loaded.</p>`;
      return;
    }
    run();
  }

  function renderFree(stage) {
    stage.innerHTML = `
      <div class="ig-free">
        <label>Pattern / concept
          <select data-free-id>
            ${items()
              .map((it) => `<option value="${it.id}">${esc(it.name)} (${it.kind})</option>`)
              .join("")}
          </select>
        </label>
        <label>Game
          <select data-free-g>
            <option value="mantra">Mantra</option>
            <option value="cloze">Cloze</option>
            <option value="scramble">Line order</option>
            <option value="type" selected>Type from blank</option>
            <option value="bug">Bug hunt</option>
          </select>
        </label>
        <button type="button" class="ig-primary" data-go>Start</button>
      </div>
      <div class="ig-howto">Pick a template + game, then Start. Prefer the ladder
        order (mantra → cloze → line order → type → bug) for items below mastery 4.</div>
      <div data-ig-play></div>`;
    stage.querySelector("[data-go]").onclick = () => {
      const id = stage.querySelector("[data-free-id]").value;
      const g = stage.querySelector("[data-free-g]").value;
      const it = findItem(id);
      const play = stage.querySelector("[data-ig-play]");
      if (g === "mantra") gameMantra(play, it);
      else if (g === "cloze") gameCloze(play, it);
      else if (g === "scramble") gameScramble(play, it);
      else if (g === "type") gameType(play, it);
      else gameBug(play, it);
    };
  }

  /* —— Games —— */
  function gameMantra(el, it, onDone) {
    el.innerHTML = `
      <div class="ig-card">
        <div class="ig-howto"><strong>How:</strong> Cover any visible mantra.
          Recite aloud → type it → Check. Keyword overlap passes. Show mantra
          only after one attempt.</div>
        <p>Recite the mantra aloud, then type it from memory (close enough counts).</p>
        <p class="ig-muted">Pattern: <strong>${esc(it.name)}</strong></p>
        <textarea class="ig-input" rows="2" placeholder="One sentence idiom…" data-ans></textarea>
        <div class="ig-actions">
          <button type="button" class="ig-primary" data-check>Check</button>
          <button type="button" data-show>Show mantra</button>
        </div>
        <div data-fb></div>
      </div>`;
    el.querySelector("[data-show]").onclick = () => {
      el.querySelector("[data-fb]").innerHTML = `<p class="ig-ok">“${esc(it.mantra)}”</p>`;
    };
    el.querySelector("[data-check]").onclick = () => {
      const ans = (el.querySelector("[data-ans]").value || "").toLowerCase();
      const target = it.mantra.toLowerCase();
      const words = target.split(/\W+/).filter((w) => w.length > 3);
      const hit = words.filter((w) => ans.includes(w)).length;
      const ratio = words.length ? hit / words.length : 0;
      const ok = ratio >= 0.45 || ans.includes(target.slice(0, 20));
      recordResult(it.id, "mantra", ok, ok ? 1 : 0);
      el.querySelector("[data-fb]").innerHTML = ok
        ? `<p class="ig-ok">Locked. Canonical: “${esc(it.mantra)}”</p>`
        : `<p class="ig-bad">Not yet. Canonical: “${esc(it.mantra)}”</p>`;
      updateStats();
      if (ok && onDone) setTimeout(onDone, 600);
    };
  }

  function gameCloze(el, it, onDone) {
    const cloze = (it.cloze || []).slice(0, 5);
    if (!cloze.length) {
      el.innerHTML = `<p class="ig-muted">No cloze lines for this template — try Type from blank.</p>`;
      return;
    }
    el.innerHTML = `
      <div class="ig-card">
        <div class="ig-howto"><strong>How:</strong> Fill each <code>___</code> with
          the exact idiomatic fragment. Grade needs ~80% correct. Study misses,
          then retry later without peeking.</div>
        <p>Fill the blanks with the idiomatic fragment (exact tokens).</p>
        <ol class="ig-cloze">
          ${cloze
            .map(
              (c, i) => `<li>
              <code class="ig-prompt">${esc(c.prompt)}</code>
              <input type="text" data-i="${i}" spellcheck="false" autocomplete="off" />
            </li>`
            )
            .join("")}
        </ol>
        <button type="button" class="ig-primary" data-check>Grade</button>
        <div data-fb></div>
      </div>`;
    el.querySelector("[data-check]").onclick = () => {
      let good = 0;
      const fb = [];
      cloze.forEach((c, i) => {
        const v = (el.querySelector(`input[data-i="${i}"]`).value || "").trim();
        const ok = normalizeFrag(v) === normalizeFrag(c.answer);
        if (ok) good += 1;
        else fb.push(`<div><code>${esc(c.answer)}</code> <span class="ig-muted">(${esc(c.label)})</span></div>`);
      });
      const ratio = good / cloze.length;
      const ok = ratio >= 0.8;
      recordResult(it.id, "cloze", ok, ratio);
      el.querySelector("[data-fb]").innerHTML =
        `<p class="${ok ? "ig-ok" : "ig-bad"}">${good}/${cloze.length} correct.</p>` +
        (fb.length ? `<div class="ig-reveal">${fb.join("")}</div>` : "");
      updateStats();
      if (ok && onDone) setTimeout(onDone, 700);
    };
  }

  function normalizeFrag(s) {
    return s.replace(/\s+/g, " ").trim();
  }

  function gameScramble(el, it, onDone) {
    const units = (it.scramble || []).filter((l) => l.trim());
    if (units.length < 3) {
      el.innerHTML = `<p class="ig-muted">Template too short to scramble — use Type from blank.</p>`;
      return;
    }
    // Cap length for usability
    let order = units.map((_, i) => i);
    if (units.length > 14) {
      // scramble a contiguous window of 10 lines from the middle/start of body
      const start = Math.min(2, units.length - 10);
      const slice = units.slice(start, start + 10);
      return gameScrambleSlice(el, it, slice, units.slice(0, start), units.slice(start + 10), onDone);
    }
    let pool = shuffle(order);
    // Ensure not accidentally sorted
    if (pool.every((v, i) => v === i)) pool = shuffle(order);

    const state = { order: pool };
    const render = () => {
      el.innerHTML = `
        <div class="ig-card">
          <div class="ig-howto"><strong>How:</strong> Click a line, then another
            to swap; or use ↑↓. Restore top-to-bottom idiomatic order. Only a
            perfect sequence passes.</div>
          <p>Restore the idiomatic line order. Click a line, then click where it should go (or use ↑↓).</p>
          <ol class="ig-scramble" data-list>
            ${state.order
              .map(
                (ui, pos) => `<li data-pos="${pos}">
                <code>${esc(units[ui])}</code>
                <span class="ig-sc-btns">
                  <button type="button" data-up="${pos}" title="Move up">↑</button>
                  <button type="button" data-dn="${pos}" title="Move down">↓</button>
                </span>
              </li>`
              )
              .join("")}
          </ol>
          <button type="button" class="ig-primary" data-check>Check order</button>
          <div data-fb></div>
        </div>`;
      let selected = null;
      el.querySelectorAll("li[data-pos]").forEach((li) => {
        li.onclick = (e) => {
          if (e.target.closest("button")) return;
          const pos = +li.dataset.pos;
          if (selected === null) {
            selected = pos;
            li.classList.add("selected");
          } else {
            const tmp = state.order[selected];
            state.order[selected] = state.order[pos];
            state.order[pos] = tmp;
            selected = null;
            render();
          }
        };
      });
      el.querySelectorAll("[data-up]").forEach((b) => {
        b.onclick = (e) => {
          e.stopPropagation();
          const p = +b.dataset.up;
          if (p === 0) return;
          [state.order[p - 1], state.order[p]] = [state.order[p], state.order[p - 1]];
          render();
        };
      });
      el.querySelectorAll("[data-dn]").forEach((b) => {
        b.onclick = (e) => {
          e.stopPropagation();
          const p = +b.dataset.dn;
          if (p >= state.order.length - 1) return;
          [state.order[p + 1], state.order[p]] = [state.order[p], state.order[p + 1]];
          render();
        };
      });
      el.querySelector("[data-check]").onclick = () => {
        const ok = state.order.every((v, i) => v === i);
        recordResult(it.id, "scramble", ok, ok ? 1 : 0);
        el.querySelector("[data-fb]").innerHTML = ok
          ? `<p class="ig-ok">Perfect order — this is the muscle-memory sequence.</p>`
          : `<p class="ig-bad">Not yet. Keep swapping. Hint: ${esc(it.mantra)}</p>`;
        updateStats();
        if (ok && onDone) setTimeout(onDone, 700);
      };
    };
    render();
  }

  function gameScrambleSlice(el, it, slice, before, after, onDone) {
    // Reuse by temporarily swapping scramble
    const fake = Object.assign({}, it, { scramble: slice });
    gameScramble(el, fake, onDone);
    const note = document.createElement("p");
    note.className = "ig-muted";
    note.textContent = `Scrambling ${slice.length} core lines (${before.length} fixed above, ${after.length} below).`;
    el.prepend(note);
  }

  function gameType(el, it, onDone) {
    el.innerHTML = `
      <div class="ig-card">
        <div class="ig-howto"><strong>How:</strong> Type the full canonical drill
          from memory. Comments optional. Compare needs ≥85% (≥98% for mastery 5
          with bug hunt). Use Peek 3s sparingly; study the diff, clear, retry.</div>
        <p><strong>Type the idiomatic implementation from memory.</strong> Comments optional. Match structure.</p>
        <p class="ig-mantra">Mantra: “${esc(it.mantra)}”</p>
        <div class="ig-type-tools">
          <button type="button" data-hint>Hint: first lines</button>
          <button type="button" data-sig>Show triggers only</button>
          <label class="ig-toggle"><input type="checkbox" data-peek /> Peek 3s</label>
        </div>
        <textarea class="ig-editor" spellcheck="false" data-code rows="16" placeholder="# ${esc(it.name)} — idiomatic base"></textarea>
        <div class="ig-actions">
          <button type="button" class="ig-primary" data-check>Compare to canonical</button>
          <button type="button" data-show>Reveal + reset</button>
        </div>
        <div data-fb></div>
      </div>`;
    const ta = el.querySelector("[data-code]");
    el.querySelector("[data-hint]").onclick = () => {
      const lines = it.drill.split("\n").slice(0, 3).join("\n");
      el.querySelector("[data-fb]").innerHTML = `<pre class="ig-code"><code>${esc(lines)}\n…</code></pre>`;
    };
    el.querySelector("[data-sig]").onclick = () => {
      el.querySelector("[data-fb]").innerHTML =
        `<ul>${(it.when || []).map((w) => `<li>${esc(w)}</li>`).join("")}</ul>`;
    };
    el.querySelector("[data-peek]").onchange = (e) => {
      if (!e.target.checked) return;
      const overlay = document.createElement("pre");
      overlay.className = "ig-peek";
      overlay.innerHTML = `<code>${esc(it.drill)}</code>`;
      el.querySelector(".ig-card").appendChild(overlay);
      setTimeout(() => {
        overlay.remove();
        e.target.checked = false;
      }, 3000);
    };
    el.querySelector("[data-show]").onclick = () => {
      ta.value = it.drill;
      el.querySelector("[data-fb]").innerHTML = `<p class="ig-muted">Revealed. Clear and type again without looking.</p>`;
    };
    el.querySelector("[data-check]").onclick = () => {
      const got = ta.value;
      const exp = it.drill;
      const ratio = similarity(normalizeCode(got), normalizeCode(exp));
      const ok = ratio >= 0.85;
      recordResult(it.id, "type", ok, ratio);
      const pct = Math.round(ratio * 100);
      el.querySelector("[data-fb]").innerHTML = `
        <p class="${ok ? "ig-ok" : "ig-bad"}">Structural match: ${pct}% ${
          ok ? "— base committed." : "— keep drilling until ≥85%."
        }</p>
        <div class="ig-diff">${lineDiffHtml(exp, got)}</div>`;
      updateStats();
      if (ok && onDone) setTimeout(onDone, 900);
    };
  }

  function gameBug(el, it, onDone) {
    const bugs = it.bugs || [];
    if (!bugs.length) {
      el.innerHTML = `<p class="ig-muted">No bug card for this item yet.</p>`;
      return;
    }
    const bug = bugs[Math.floor(Math.random() * bugs.length)];
    el.innerHTML = `
      <div class="ig-card">
        <div class="ig-howto"><strong>How:</strong> Find the pitfall in the orange
          buggy snippet, then type the corrected idiomatic version. Check fix
          needs ~80% match. Explanation reveals the trap — re-type next time blind.</div>
        <p><strong>Bug hunt:</strong> ${esc(bug.title)}. Find the pitfall, then type the fix (or the corrected critical line).</p>
        <pre class="ig-code buggy"><code>${esc(bug.buggy)}</code></pre>
        <textarea class="ig-editor" rows="12" data-fix spellcheck="false" placeholder="Paste / type the corrected idiomatic version"></textarea>
        <div class="ig-actions">
          <button type="button" class="ig-primary" data-check>Check fix</button>
          <button type="button" data-explain>Show explanation</button>
        </div>
        <div data-fb></div>
      </div>`;
    el.querySelector("[data-explain]").onclick = () => {
      el.querySelector("[data-fb]").innerHTML = `<p>${esc(bug.explain)}</p>
        <pre class="ig-code"><code>${esc(bug.fix)}</code></pre>`;
    };
    el.querySelector("[data-check]").onclick = () => {
      const got = el.querySelector("[data-fix]").value;
      const ratio = similarity(normalizeCode(got), normalizeCode(bug.fix));
      const ok = ratio >= 0.8;
      recordResult(it.id, "bug", ok, ratio);
      el.querySelector("[data-fb]").innerHTML = ok
        ? `<p class="ig-ok">${Math.round(ratio * 100)}% — pitfall neutralized. ${esc(bug.explain)}</p>`
        : `<p class="ig-bad">${Math.round(ratio * 100)}% — compare to fix:</p>
           <div class="ig-diff">${lineDiffHtml(bug.fix, got)}</div>
           <p>${esc(bug.explain)}</p>`;
      updateStats();
      if (ok && onDone) setTimeout(onDone, 800);
    };
  }

  document.addEventListener("DOMContentLoaded", mount);
})();
