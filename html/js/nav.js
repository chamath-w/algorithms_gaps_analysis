/**
 * Shared navigation sidebar — injected into every page.
 */
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

      <div class="nav-section">Interactive Practice</div>
      <a class="nav-link" href="algo_memory.html">Algorithm Memory Lab</a>
      <a class="nav-link" href="games.html">Implementation Games</a>
      <a class="nav-link" href="practice.html">Practice Arena</a>
      <a class="nav-link" href="decision_tree.html">Decision Tree</a>

      <div class="nav-section">Foundation</div>
      <a class="nav-link" href="mental_models.html">Mental Models</a>
      <a class="nav-link" href="memory_palace.html">Memory Palace</a>
      <a class="nav-link" href="discrete_math.html">Discrete Math</a>

      <div class="nav-section">Algorithms</div>
      <a class="nav-link" href="patterns.html">Algorithm Patterns (21)</a>
      <a class="nav-link" href="sorting.html">Sorting Algorithms</a>
      <a class="nav-link" href="deep_dives.html">Deep Dives</a>
      <a class="nav-link" href="provability.html">Provability</a>

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

      <div class="nav-section">Study Plan</div>
      <a class="nav-link" href="three_month_plan.html">3-Month Plan</a>
      <a class="nav-link" href="daily_overview.html">Daily Guide Overview</a>
      <a class="nav-link" href="daily_month1.html">Month 1: Foundations</a>
      <a class="nav-link" href="daily_month2.html">Month 2: Architecture</a>
      <a class="nav-link" href="daily_month3.html">Month 3: Staff Impact</a>
    </nav>
  `;

  const page = location.pathname.split("/").pop() || "index.html";
  sidebar.querySelectorAll(".nav-link").forEach((a) => {
    if (a.getAttribute("href") === page) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
  });
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
