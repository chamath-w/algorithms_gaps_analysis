/**
 * Shared navigation sidebar — injected into every page.
 */
const SIDEBAR_SCROLL_KEY = "course-sidebar-scroll";

function saveSidebarScroll() {
  const sidebar = document.querySelector(".sidebar");
  if (sidebar) {
    sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(sidebar.scrollTop));
  }
}

function restoreSidebarScroll() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;
  const saved = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
  if (saved == null) return;
  const top = parseInt(saved, 10);
  if (!Number.isFinite(top)) return;
  sidebar.scrollTop = top;
}

function bindSidebarScrollPersistence() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar || sidebar.dataset.scrollBound === "1") return;
  sidebar.dataset.scrollBound = "1";
  let scrollTimer = null;
  sidebar.addEventListener("scroll", () => {
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(saveSidebarScroll, 80);
  });
  sidebar.addEventListener("click", (e) => {
    if (e.target.closest("a.nav-link")) saveSidebarScroll();
  });
  window.addEventListener("pagehide", saveSidebarScroll);
}

function renderNav() {
  injectSkipLink();

  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <h2>Signal Trace</h2>
      <div class="subtitle">CS / SWE Mastery</div>
    </div>
    <nav aria-label="Course sections">
      <div class="nav-section">Home</div>
      <a class="nav-link" href="index.html">Course Overview</a>
      <a class="nav-link" href="catalog.html">Full Catalog</a>
      <a class="nav-link" href="progress.html">Progress</a>
      <a class="nav-link" href="analytics.html">Analytics</a>

      <div class="nav-section">Practice loop</div>
      <a class="nav-link" href="practice.html">Practice Arena</a>
      <a class="nav-link" href="decision_tree.html">Decision Tree</a>
      <a class="nav-link" href="algo_memory.html">Algorithm Memory Lab</a>
      <a class="nav-link" href="games.html">Implementation Games</a>

      <div class="nav-section">Algorithms</div>
      <a class="nav-link" href="patterns.html">21 Patterns</a>
      <a class="nav-link" href="sorting.html">Sorting</a>
      <a class="nav-link" href="deep_dives.html">Deep Dives</a>
      <a class="nav-link" href="provability.html">Provability</a>

      <div class="nav-section">Foundations</div>
      <a class="nav-link" href="mental_models.html">Mental Models</a>
      <a class="nav-link" href="memory_palace.html">Memory Palace</a>
      <a class="nav-link" href="discrete_math.html">Discrete Math</a>

      <div class="nav-section">Theory</div>
      <a class="nav-link" href="theory.html">Theory of Computation</a>
      <a class="nav-link" href="compilers.html">Languages &amp; Compilers</a>

      <div class="nav-section">Systems</div>
      <a class="nav-link" href="architecture.html">Computer Architecture</a>
      <a class="nav-link" href="cs_fundamentals.html">OS · Net · DB</a>
      <a class="nav-link" href="systems_design.html">Systems Design</a>
      <a class="nav-link" href="security.html">Security</a>

      <div class="nav-section">Professional</div>
      <a class="nav-link" href="software_engineering.html">Software Engineering</a>
      <a class="nav-link" href="engineering_patterns.html">Engineering Patterns</a>
      <a class="nav-link" href="staff_level.html">Staff-Level Skills</a>
      <a class="nav-link" href="readings.html">Recommended Readings</a>

      <div class="nav-section">Study plan</div>
      <a class="nav-link" href="three_month_plan.html">3-Month Plan</a>
      <a class="nav-link" href="daily_overview.html">Daily Guide</a>
      <a class="nav-link nav-link-sub" href="daily_month1.html">Month 1 · Foundations</a>
      <a class="nav-link nav-link-sub" href="daily_month2.html">Month 2 · Architecture</a>
      <a class="nav-link nav-link-sub" href="daily_month3.html">Month 3 · Staff Impact</a>
    </nav>
  `;

  const page = location.pathname.split("/").pop() || "index.html";
  sidebar.querySelectorAll(".nav-link").forEach((a) => {
    if (a.getAttribute("href") === page) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
  });

  bindSidebarScrollPersistence();
  requestAnimationFrame(() => {
    restoreSidebarScroll();
    requestAnimationFrame(restoreSidebarScroll);
  });
  ensureAnalytics();
}

function ensureAnalytics() {
  if (document.querySelector("script[data-course-analytics]")) return;
  const s = document.createElement("script");
  s.src = "js/analytics.js?v=2";
  s.defer = true;
  s.dataset.courseAnalytics = "1";
  document.body.appendChild(s);
}

function injectSkipLink() {
  if (document.querySelector(".skip-link")) return;
  const skip = document.createElement("a");
  skip.href = "#main-content";
  skip.className = "skip-link";
  skip.textContent = "Skip to main content";
  document.body.prepend(skip);
}

document.addEventListener("DOMContentLoaded", renderNav);
