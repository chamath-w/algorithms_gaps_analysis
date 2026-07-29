#!/usr/bin/env python3
"""Scan course HTML/docs for broken links and stale counts."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "html"

import sys

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def main() -> None:
    html_files = {p.name for p in HTML.glob("*.html")}
    issues: list[str] = []

    nav = (HTML / "js" / "nav.js").read_text(encoding="utf-8")
    nav_hrefs = set(re.findall(r'href="([^"]+\.html)"', nav))
    for h in sorted(nav_hrefs - html_files):
        issues.append(f"NAV link missing file: {h}")

    cat = (HTML / "catalog.html").read_text(encoding="utf-8")
    for h in sorted(set(re.findall(r'href="([^"#]+\.html)', cat)) - html_files):
        issues.append(f"CATALOG link missing file: {h}")

    man = json.loads((HTML / "offline-manifest.json").read_text(encoding="utf-8"))
    for h in sorted(set(man["pages"]) - html_files):
        issues.append(f"MANIFEST page missing: {h}")
    for h in sorted(html_files - set(man["pages"])):
        issues.append(f"HTML not in manifest: {h}")

    for asset in man["assets"]:
        if not (HTML / asset).exists():
            issues.append(f"MANIFEST asset missing: {asset}")

    # href targets across all html
    for page in HTML.glob("*.html"):
        text = page.read_text(encoding="utf-8", errors="replace")
        for href in re.findall(r'href="([^"]+)"', text):
            if href.startswith(("http", "mailto:", "#", "javascript:")):
                continue
            path = href.split("#")[0].split("?")[0]
            if not path or path.startswith(".."):
                continue
            if path.endswith(".html") and path not in html_files and "/" not in path:
                issues.append(f"{page.name} -> missing {path}")

    stale_re = re.compile(
        r"\b16 patterns\b|all 16 pattern|25 scenarios|18 pages",
        re.I,
    )
    for p in list(ROOT.glob("*.md")) + list(ROOT.glob("*.py")) + list(HTML.glob("*.html")):
        if "vendor" in str(p):
            continue
        t = p.read_text(encoding="utf-8", errors="replace")
        if stale_re.search(t):
            issues.append(f"STALE count wording: {p.relative_to(ROOT)}")

    from patterns import ENGINEERING_PATTERNS, PATTERNS
    from trainer import SCENARIOS
    from curriculum import TRACKS

    print(f"patterns={len(PATTERNS)} eng={len(ENGINEERING_PATTERNS)} scenarios={len(SCENARIOS)}")
    print(f"html_pages={len(html_files)} nav_links={len(nav_hrefs)}")

    miss_cur = []
    for tr in TRACKS:
        for m in tr.modules:
            for les in m.lessons:
                if not les.html:
                    continue
                # lesson html may include #anchor
                name = Path(les.html.split("#", 1)[0]).name
                if not (HTML / name).exists():
                    miss_cur.append(f"{les.id}:{les.html}")
    if miss_cur:
        issues.append("CURRICULUM missing: " + ", ".join(miss_cur))

    movies = (HTML / "js" / "algo-memory-movies.js").read_text(encoding="utf-8")
    movie_ids = set(re.findall(r"^\s{4}([a-z_]+):\s*\{$", movies, re.M))
    pattern_ids = {p.id for p in PATTERNS}
    for pid in sorted(pattern_ids - movie_ids):
        issues.append(f"Missing memory movie: {pid}")
    for pid in sorted(movie_ids - pattern_ids):
        issues.append(f"Orphan movie id: {pid}")

    impl_path = HTML / "js" / "impl-templates.js"
    if not impl_path.exists():
        issues.append("Missing html/js/impl-templates.js — run scripts/export_impl_templates.py")
    else:
        impl_txt = impl_path.read_text(encoding="utf-8")
        # crude extract of item ids
        impl_ids = set(re.findall(r'"id":\s*"([a-z0-9_]+)"', impl_txt))
        for pid in sorted(pattern_ids - impl_ids):
            issues.append(f"Missing impl-game template: {pid}")
        if "games.html" not in html_files:
            issues.append("Missing games.html")

    if issues:
        print(f"\n{len(issues)} issue(s):")
        for i in issues:
            print(" -", i)
    else:
        print("\nOK — no issues found")


if __name__ == "__main__":
    main()
