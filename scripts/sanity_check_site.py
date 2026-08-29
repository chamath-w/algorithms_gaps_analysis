#!/usr/bin/env python3
"""Site sanity check: links, assets, a11y meta, script includes."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "html"

REQUIRED_SCRIPTS = ("nav.js",)
PAGES_WITH_ANIM = {
    "index.html",
    "catalog.html",
    "patterns.html",
    "sorting.html",
    "deep_dives.html",
    "provability.html",
    "discrete_math.html",
    "theory.html",
    "compilers.html",
    "architecture.html",
    "security.html",
    "systems_design.html",
    "algo_memory.html",
    "practice.html",
    "progress.html",
    "mental_models.html",
    "memory_palace.html",
    "readings.html",
    "staff_level.html",
    "software_engineering.html",
    "cs_fundamentals.html",
    "three_month_plan.html",
    "daily_overview.html",
    "daily_month1.html",
    "daily_month2.html",
    "daily_month3.html",
}


def main() -> None:
    issues: list[str] = []
    pages = sorted(HTML.glob("*.html"))
    html_names = {p.name for p in pages}

    for page in pages:
        text = page.read_text(encoding="utf-8", errors="replace")
        name = page.name

        if 'name="viewport"' not in text:
            issues.append(f"{name}: missing viewport meta")
        elif "viewport-fit=cover" not in text and name != "404.html":
            issues.append(f"{name}: missing viewport-fit=cover")

        if name != "404.html":
            if 'id="main-content"' not in text:
                issues.append(f"{name}: missing id=main-content")
            for script in REQUIRED_SCRIPTS:
                if script not in text:
                    issues.append(f"{name}: missing {script}")

        if name in PAGES_WITH_ANIM and "animations.js" not in text:
            issues.append(f"{name}: missing animations.js (has anim markup)")

        if "menu-toggle" in text and 'aria-label="Open navigation menu"' not in text:
            issues.append(f"{name}: menu-toggle missing aria-label")

        for href in re.findall(r'href="([^"]+)"', text):
            if href.startswith(("http", "mailto:", "#", "javascript:")):
                continue
            path = href.split("#")[0].split("?")[0]
            if not path or path.startswith("..") or "/" in path:
                continue
            if path.endswith(".html") and path not in html_names:
                issues.append(f"{name} -> broken link {path}")

        for src in re.findall(r'src="([^"]+)"', text):
            if src.startswith("http"):
                continue
            asset = HTML / src.split("?")[0]
            if not asset.exists():
                issues.append(f"{name}: missing asset {src}")

        for href in re.findall(r'href="([^"]+\.css[^"]*)"', text):
            if href.startswith("http"):
                continue
            asset = HTML / href.split("?")[0]
            if not asset.exists():
                issues.append(f"{name}: missing css {href}")

    # JS syntax via node --check
    import subprocess

    node = subprocess.run(["node", "--version"], capture_output=True, text=True)
    if node.returncode == 0:
        for js in sorted((HTML / "js").glob("*.js")):
            chk = subprocess.run(
                ["node", "--check", str(js)],
                capture_output=True,
                text=True,
            )
            if chk.returncode != 0:
                issues.append(f"JS syntax error {js.name}: {chk.stderr.strip()}")
    else:
        issues.append("node not available — skipped JS syntax check")

    css = (HTML / "css" / "style.css").read_text(encoding="utf-8")
    if css.count("transition: all") > 0:
        issues.append(f"style.css: {css.count('transition: all')} transition:all remaining")

    if issues:
        print(f"FAIL — {len(issues)} issue(s):")
        for i in issues:
            print(" -", i)
        raise SystemExit(1)
    print(f"OK — {len(pages)} pages, assets, scripts verified")


if __name__ == "__main__":
    main()
