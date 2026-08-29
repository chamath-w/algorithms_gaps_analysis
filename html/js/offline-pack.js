/**
 * Flight prep: cache all course assets + optionally write a folder to local disk.
 */
(function () {
  const READY_KEY = "cs_course_offline_ready_v1";

  function isIOS() {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }

  function originHint() {
    return location.origin + location.pathname.replace(/[^/]*$/, "");
  }

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  async function loadManifest() {
    const res = await fetch("offline-manifest.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("Could not load offline-manifest.json");
    return res.json();
  }

  function allUrls(manifest) {
    return [...manifest.pages, ...manifest.assets, ...manifest.pyodide];
  }

  function formatBytes(n) {
    if (n < 1024) return n + " B";
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
    return (n / (1024 * 1024)).toFixed(1) + " MB";
  }

  function setProgress(ui, pct, label) {
    if (ui.bar) ui.bar.style.width = Math.min(100, Math.max(0, pct)) + "%";
    if (ui.label) ui.label.textContent = label || "";
  }

  function addLog(ui, msg, cls) {
    if (!ui.log) return;
    const row = document.createElement("div");
    row.className = "flight-log-row" + (cls ? " " + cls : "");
    row.textContent = msg;
    ui.log.appendChild(row);
    ui.log.scrollTop = ui.log.scrollHeight;
  }

  async function registerSW() {
    if (!("serviceWorker" in navigator)) return false;
    const reg = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
    await navigator.serviceWorker.ready;
    return !!reg;
  }

  async function fetchAndCache(urls, cacheName, ui) {
    const cache = await caches.open(cacheName);
    let done = 0;
    let bytes = 0;
    const failed = [];
    const ok = [];

    for (const path of urls) {
      const url = new URL(path, location.href).href;
      setProgress(
        ui,
        (done / urls.length) * 100,
        `Fetching ${path} (${done + 1}/${urls.length})...`
      );
      try {
        const res = await fetch(url, { cache: "reload" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const buf = await res.clone().arrayBuffer();
        bytes += buf.byteLength;
        await cache.put(url, res);
        ok.push({ path, bytes: buf.byteLength });
        addLog(ui, `OK  ${path} (${formatBytes(buf.byteLength)})`, "ok");
      } catch (err) {
        failed.push({ path, error: String(err.message || err) });
        addLog(ui, `FAIL ${path}: ${err.message || err}`, "bad");
      }
      done++;
      setProgress(ui, (done / urls.length) * 100, `Cached ${done}/${urls.length}`);
    }
    return { ok, failed, bytes };
  }

  async function ensureDir(root, parts) {
    let dir = root;
    for (const part of parts) {
      dir = await dir.getDirectoryHandle(part, { create: true });
    }
    return dir;
  }

  async function writeFileToDir(rootDir, relativePath, data) {
    const parts = relativePath.split("/").filter(Boolean);
    const fileName = parts.pop();
    const dir = parts.length ? await ensureDir(rootDir, parts) : rootDir;
    const fh = await dir.getFileHandle(fileName, { create: true });
    const writable = await fh.createWritable();
    await writable.write(data);
    await writable.close();
  }

  async function saveToDiskFolder(urls, ui) {
    if (!window.showDirectoryPicker) {
      throw new Error(
        "This browser cannot pick a folder. Use Chrome/Edge, or rely on the browser cache + your repo copy."
      );
    }
    addLog(ui, "Pick a folder for the offline pack...", "");
    const root = await window.showDirectoryPicker({
      mode: "readwrite",
      startIn: "downloads",
    });
    // Nest under a course folder so we do not dump into Downloads root
    const packDir = await root.getDirectoryHandle("cs-swe-course-offline", {
      create: true,
    });

    let done = 0;
    let bytes = 0;
    const failed = [];

    for (const path of urls) {
      setProgress(
        ui,
        (done / urls.length) * 100,
        `Writing ${path} to disk (${done + 1}/${urls.length})...`
      );
      try {
        const res = await fetch(new URL(path, location.href).href, {
          cache: "force-cache",
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.arrayBuffer();
        bytes += data.byteLength;
        await writeFileToDir(packDir, path, data);
        addLog(ui, `DISK ${path} (${formatBytes(data.byteLength)})`, "ok");
      } catch (err) {
        failed.push({ path, error: String(err.message || err) });
        addLog(ui, `DISK FAIL ${path}: ${err.message || err}`, "bad");
      }
      done++;
    }

    const report = [
      "CS/SWE Course — Offline Pack",
      "Generated: " + new Date().toISOString(),
      "Files written: " + (urls.length - failed.length) + "/" + urls.length,
      "Total bytes: " + bytes,
      "",
      "How to use on the plane:",
      "1. Prefer serving from your git repo (already complete if vendor/pyodide exists):",
      "     python scripts/serve_course.py",
      "2. Or serve this folder:",
      "     python -m http.server 8765",
      "     then open http://127.0.0.1:8765/index.html",
      "",
      failed.length
        ? "FAILED:\n" + failed.map((f) => "- " + f.path + ": " + f.error).join("\n")
        : "All files written successfully.",
    ].join("\n");
    await writeFileToDir(packDir, "OFFLINE_READY.txt", new Blob([report]));
    addLog(ui, "Wrote OFFLINE_READY.txt", "ok");
    return { failed, bytes, packName: "cs-swe-course-offline" };
  }

  function downloadTextReport(summary) {
    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "course-offline-ready.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function markReady(summary) {
    localStorage.setItem(
      READY_KEY,
      JSON.stringify({ at: Date.now(), ...summary })
    );
  }

  function readReady() {
    try {
      return JSON.parse(localStorage.getItem(READY_KEY) || "null");
    } catch {
      return null;
    }
  }

  function updateBadge(ui) {
    const ready = readReady();
    if (!ui.badge) return;
    if (ready && ready.ok) {
      ui.badge.textContent =
        "Flight-ready · cached " +
        new Date(ready.at).toLocaleString() +
        (ready.bytes ? " · " + formatBytes(ready.bytes) : "");
      ui.badge.className = "flight-badge ready";
    } else {
      ui.badge.textContent = "Not cached yet — run prepare before your flight";
      ui.badge.className = "flight-badge";
    }
  }

  async function prepare(ui, { toDisk }) {
    ui.panel.hidden = false;
    ui.log.innerHTML = "";
    ui.btnCache.disabled = true;
    ui.btnDisk.disabled = true;
    setProgress(ui, 0, "Loading manifest...");

    try {
      const manifest = await loadManifest();
      const cacheName = manifest.cacheName || "cs-swe-course-v14";
      const urls = allUrls(manifest);
      addLog(ui, `Manifest: ${urls.length} files · cache ${cacheName}`, "");

      setProgress(ui, 2, "Registering service worker...");
      try {
        const swOk = await registerSW();
        addLog(
          ui,
          swOk
            ? "Service worker registered (offline navigation enabled)"
            : "Service worker unavailable — cache still works for revisits in this browser",
          swOk ? "ok" : ""
        );
      } catch (err) {
        addLog(ui, "Service worker: " + (err.message || err), "bad");
      }

      const cacheResult = await fetchAndCache(urls, cacheName, ui);

      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
      }
      let diskResult = null;

      if (toDisk) {
        setProgress(ui, 0, "Writing files to chosen folder...");
        diskResult = await saveToDiskFolder(urls, ui);
      }

      const pyMissing = cacheResult.failed.filter((f) =>
        f.path.startsWith("vendor/pyodide/")
      );
      const ok =
        cacheResult.failed.length === 0 &&
        (!diskResult || diskResult.failed.length === 0);

      const summaryLines = [
        "CS/SWE Course — Offline readiness report",
        "Time: " + new Date().toISOString(),
        "Cached OK: " + cacheResult.ok.length + "/" + urls.length,
        "Cache bytes: " + formatBytes(cacheResult.bytes),
        diskResult
          ? "Disk folder: " +
            diskResult.packName +
            " (" +
            formatBytes(diskResult.bytes) +
            ")"
          : "Disk folder: (not written — use Save to disk button)",
        "",
        ok
          ? "STATUS: READY FOR FLIGHT"
          : "STATUS: INCOMPLETE — see failures below",
        "",
        "Before boarding:",
        "1. Re-open this same URL from Safari or your Home Screen shortcut:",
        "   " + originHint(),
        "2. On iPhone: Share → Add to Home Screen after caching (best offline persistence).",
        "3. Local dev alternative: python scripts/serve_course.py",
        "4. If Pyodide files failed: re-run while online (GitHub Pages bundles vendor/).",
        "",
      ];
      if (cacheResult.failed.length) {
        summaryLines.push("Cache failures:");
        cacheResult.failed.forEach((f) =>
          summaryLines.push("  - " + f.path + ": " + f.error)
        );
      }
      if (pyMissing.length) {
        summaryLines.push(
          "",
          "Pyodide missing — Practice Arena needs:",
          "  python scripts/vendor_pyodide.py"
        );
      }

      const summary = summaryLines.join("\n");
      markReady({
        ok,
        bytes: cacheResult.bytes,
        failed: cacheResult.failed.length,
        disk: !!diskResult,
      });
      updateBadge(ui);
      downloadTextReport(summary);

      setProgress(
        ui,
        100,
        ok
          ? "Done — ready for flight. Report downloaded."
          : "Finished with errors — see log + downloaded report."
      );
      addLog(
        ui,
        ok
          ? "READY FOR FLIGHT. Checklist file downloaded."
          : "Completed with failures. Fix and re-run.",
        ok ? "ok" : "bad"
      );
      ui.result.className = ok ? "quiz-feedback ok" : "quiz-feedback bad";
      ui.result.hidden = false;
      ui.result.innerHTML = ok
        ? "<strong>Ready for flight.</strong> Browser cache is loaded" +
          (diskResult
            ? " and a folder copy was written to disk."
            : ". On iPhone, use the same GitHub Pages URL or Home Screen shortcut while offline.") +
          (isIOS()
            ? " <em>Tip:</em> Add to Home Screen for reliable offline access in Safari."
            : "") +
          " A checklist <code>course-offline-ready.txt</code> was downloaded."
        : "<strong>Incomplete.</strong> " +
          cacheResult.failed.length +
          " file(s) failed. Stay online and tap <em>Cache everything</em> again.";
    } catch (err) {
      setProgress(ui, 0, "Failed");
      addLog(ui, String(err.message || err), "bad");
      ui.result.hidden = false;
      ui.result.className = "quiz-feedback bad";
      ui.result.innerHTML =
        "<strong>Prepare failed.</strong> Open over HTTPS (GitHub Pages) or " +
        "<code>python scripts/serve_course.py</code> — not <code>file://</code>.";
    } finally {
      ui.btnCache.disabled = false;
      ui.btnDisk.disabled = false;
    }
  }

  function mount() {
    const root = document.querySelector("[data-flight-prep]");
    if (!root) return;

    root.innerHTML = `
      <div class="flight-prep">
        <div class="flight-prep-head">
          <div>
            <h2 style="margin:0;border:none;padding:0">Prepare for flight</h2>
            <p class="text-muted" style="margin:0.35rem 0 0">
              Download and verify every course page, script, stylesheet, and the
              in-browser Python runtime. Cache them here, and optionally write a
              full copy to a folder on disk.
            </p>
          </div>
          <div class="flight-badge" id="flight-badge">Checking...</div>
        </div>
        <div class="flight-actions">
          <button type="button" class="anim-btn primary" id="flight-cache">
            Cache everything for offline
          </button>
          <button type="button" class="anim-btn" id="flight-disk">
            Save pack to disk...
          </button>
        </div>
        <div class="flight-panel" id="flight-panel" hidden>
          <div class="flight-progress">
            <div class="flight-progress-bar" id="flight-bar"></div>
          </div>
          <div class="flight-progress-label" id="flight-label"></div>
          <div class="flight-log" id="flight-log"></div>
          <div class="quiz-feedback" id="flight-result" hidden></div>
        </div>
        <div class="callout callout-info" style="margin-top:1rem">
          <div class="callout-title">What this does</div>
          <p>
            <strong>Cache everything</strong> stores all pages, scripts, stylesheets,
            and Pyodide (~15&nbsp;MB) in this browser. Works on
            <strong>GitHub Pages</strong> and local
            <code>python scripts/serve_course.py</code>.
          </p>
          <p>
            <strong>iPhone:</strong> run this while online on Wi‑Fi (can take a few
            minutes). Then <strong>Share → Add to Home Screen</strong> and open
            Practice Arena from that icon offline. Safari may purge cache under storage
            pressure — re-cache before long trips.
          </p>
          <p>
            <strong>Save pack to disk</strong> (Chrome/Edge desktop only) writes
            <code>cs-swe-course-offline/</code> to a folder you choose.
          </p>
        </div>
      </div>
    `;

    const ui = {
      badge: $("#flight-badge", root),
      btnCache: $("#flight-cache", root),
      btnDisk: $("#flight-disk", root),
      panel: $("#flight-panel", root),
      bar: $("#flight-bar", root),
      label: $("#flight-label", root),
      log: $("#flight-log", root),
      result: $("#flight-result", root),
    };

    updateBadge(ui);
    ui.btnCache.addEventListener("click", () => prepare(ui, { toDisk: false }));
    ui.btnDisk.addEventListener("click", () => prepare(ui, { toDisk: true }));

    if (!window.showDirectoryPicker || isIOS()) {
      ui.btnDisk.disabled = true;
      ui.btnDisk.title =
        "Folder save needs Chrome/Edge on desktop. On iPhone, use Cache everything + Add to Home Screen.";
    }
  }

  document.addEventListener("DOMContentLoaded", mount);
  window.OfflinePack = { prepare: mount, isIOS };
})();
