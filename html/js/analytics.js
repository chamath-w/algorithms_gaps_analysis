/**
 * Course analytics — local visit log + optional site-wide JSON aggregate.
 */
(function () {
  "use strict";

  const LOCAL_KEY = "course-analytics-v1";
  const TZ_PREFIX = [
    ["Pacific/", "Oceania"],
    ["Australia/", "Oceania"],
    ["Antarctica/", "Antarctica"],
    ["Asia/", "Asia"],
    ["Europe/", "Europe"],
    ["Africa/", "Africa"],
    ["Atlantic/", "South America"],
    ["America/Argentina", "South America"],
    ["America/Sao_Paulo", "South America"],
    ["America/Bogota", "South America"],
    ["America/Lima", "South America"],
    ["America/", "North America"],
    ["Indian/", "Asia"],
  ];

  function continentFromTimezone(tz) {
    if (!tz) return "Unknown";
    for (const [prefix, continent] of TZ_PREFIX) {
      if (tz.startsWith(prefix)) return continent;
    }
    return "Unknown";
  }

  function currentPage() {
    return location.pathname.split("/").pop() || "index.html";
  }

  function readLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : { views: [] };
    } catch {
      return { views: [] };
    }
  }

  function writeLocal(data) {
    try {
      const trimmed = { views: (data.views || []).slice(-2000) };
      localStorage.setItem(LOCAL_KEY, JSON.stringify(trimmed));
    } catch {
      /* quota */
    }
  }

  function recordLocalView(page) {
    const data = readLocal();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    data.views.push({
      page,
      ts: Date.now(),
      continent: continentFromTimezone(tz),
      timezone: tz,
    });
    writeLocal(data);
    return data.views[data.views.length - 1];
  }

  function sendBeacon(entry) {
    if (!entry || !navigator.sendBeacon) return;
    try {
      navigator.sendBeacon(
        "analytics-beacon",
        new Blob([JSON.stringify(entry)], { type: "application/json" }),
      );
    } catch {
      /* offline or static host */
    }
  }

  function aggregateViews(views) {
    const byContinent = {};
    const byDay = {};
    const byPage = {};
    views.forEach((v) => {
      const c = v.continent || "Unknown";
      byContinent[c] = (byContinent[c] || 0) + 1;
      const day = new Date(v.ts).toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
      const p = v.page || "index.html";
      byPage[p] = (byPage[p] || 0) + 1;
    });
    const days = Object.keys(byDay).sort();
    return {
      totalViews: views.length,
      byContinent,
      byDay: days.map((date) => ({ date, views: byDay[date] })),
      byPage,
    };
  }

  async function fetchSiteStats() {
    try {
      const res = await fetch("data/site-analytics.json", { cache: "no-cache" });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  function formatNumber(n) {
    return new Intl.NumberFormat().format(n || 0);
  }

  function renderSparkline(byDay, width, height) {
    if (!byDay || !byDay.length) {
      return `<p class="text-muted analytics-empty">No time-series data yet.</p>`;
    }
    const slice = byDay.slice(-30);
    const max = Math.max(1, ...slice.map((d) => d.views));
    const pad = 8;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const step = slice.length > 1 ? w / (slice.length - 1) : w;
    const pts = slice
      .map((d, i) => {
        const x = pad + i * step;
        const y = pad + h - (d.views / max) * h;
        return `${x},${y}`;
      })
      .join(" ");
    const area =
      pts +
      ` ${pad + (slice.length - 1) * step},${pad + h} ${pad},${pad + h}`;
    return `
      <svg class="analytics-sparkline" viewBox="0 0 ${width} ${height}" role="img" aria-label="Views over time">
        <polyline points="${pts}" fill="none" stroke="#58a6ff" stroke-width="2" stroke-linejoin="round"/>
        <polygon points="${area}" fill="rgba(88,166,255,0.12)"/>
      </svg>`;
  }

  function renderContinentBars(byContinent, width) {
    const entries = Object.entries(byContinent || {}).sort((a, b) => b[1] - a[1]);
    if (!entries.length) {
      return `<p class="text-muted analytics-empty">No regional data yet.</p>`;
    }
    const max = Math.max(1, ...entries.map((e) => e[1]));
    return entries
      .map(([name, count]) => {
        const pct = Math.round((count / max) * 100);
        return `
          <div class="analytics-bar-row">
            <span class="analytics-bar-label">${escapeHtml(name)}</span>
            <span class="analytics-bar-track" style="width:${Math.max(120, width - 180)}px">
              <span class="analytics-bar-fill" style="width:${pct}%"></span>
            </span>
            <span class="analytics-bar-value">${formatNumber(count)}</span>
          </div>`;
      })
      .join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderSummaryCard(label, value, note) {
    return `
      <div class="analytics-stat-card">
        <div class="analytics-stat-value">${escapeHtml(String(value))}</div>
        <div class="analytics-stat-label">${escapeHtml(label)}</div>
        ${note ? `<div class="analytics-stat-note">${escapeHtml(note)}</div>` : ""}
      </div>`;
  }

  async function renderDashboard(root, opts) {
    opts = opts || {};
    const local = aggregateViews(readLocal().views);
    const site = opts.siteOnly ? await fetchSiteStats() : opts.site || (await fetchSiteStats());
    const useSite = site && site.totalViews > 0;
    const stats = useSite
      ? {
          totalViews: site.totalViews,
          byContinent: site.byContinent || {},
          byDay: site.byDay || [],
          byPage: site.byPage || {},
          source: site.updated ? `Site aggregate · updated ${site.updated.slice(0, 10)}` : "Site aggregate",
        }
      : {
          ...local,
          source: "Your browser (local)",
        };

    root.innerHTML = `
      <div class="analytics-stats-grid">
        ${renderSummaryCard("Total views", formatNumber(stats.totalViews), stats.source)}
        ${renderSummaryCard("Pages tracked", formatNumber(Object.keys(stats.byPage).length), useSite ? "Across all visitors" : "This device")}
        ${renderSummaryCard("Continents", formatNumber(Object.keys(stats.byContinent).length), "From timezone mapping")}
        ${renderSummaryCard("Your visits", formatNumber(local.totalViews), "Stored locally")}
      </div>
      <div class="analytics-panels">
        <section class="analytics-panel" aria-labelledby="analytics-time-heading">
          <h3 id="analytics-time-heading">Views over time</h3>
          ${renderSparkline(stats.byDay, 560, 140)}
        </section>
        <section class="analytics-panel" aria-labelledby="analytics-region-heading">
          <h3 id="analytics-region-heading">Views by continent</h3>
          ${renderContinentBars(stats.byContinent, 520)}
        </section>
      </div>
      ${
        !useSite && local.totalViews === 0
          ? `<p class="callout callout-info analytics-hint">Browse a few course pages to populate your local stats. When served locally, visits also aggregate into <code>data/site-analytics.json</code>.</p>`
          : ""
      }`;
  }

  function renderFooterTeaser(root) {
    fetchSiteStats().then((site) => {
      const local = aggregateViews(readLocal().views);
      const total = site && site.totalViews ? site.totalViews : local.totalViews;
      const topContinent = site && site.byContinent
        ? Object.entries(site.byContinent).sort((a, b) => b[1] - a[1])[0]
        : Object.entries(local.byContinent).sort((a, b) => b[1] - a[1])[0];
      root.innerHTML = `
        <div class="analytics-footer-teaser">
          <span class="analytics-footer-stat"><strong>${formatNumber(total)}</strong> views</span>
          ${
            topContinent
              ? `<span class="analytics-footer-stat">Top region: <strong>${escapeHtml(topContinent[0])}</strong></span>`
              : ""
          }
          <a href="analytics.html" class="analytics-footer-link">Full analytics →</a>
        </div>`;
    });
  }

  function initPageTracking() {
    const page = currentPage();
    if (!page.endsWith(".html") && page !== "") return;
    const entry = recordLocalView(page);
    sendBeacon(entry);
  }

  function init() {
    initPageTracking();
    const dash = document.getElementById("analytics-dashboard");
    if (dash) renderDashboard(dash);
    const teaser = document.getElementById("analytics-footer");
    if (teaser) renderFooterTeaser(teaser);
  }

  window.CourseAnalytics = {
    readLocal,
    aggregateViews,
    fetchSiteStats,
    renderDashboard,
    continentFromTimezone,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
