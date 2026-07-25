#!/usr/bin/env python3
"""
Download Pyodide into html/vendor/pyodide/ for offline Practice Arena.

Usage (once, while online):
    python scripts/vendor_pyodide.py

Then serve the course (required for WASM) and open Practice Arena:
    python scripts/serve_course.py
    # open http://127.0.0.1:8765/practice.html
"""

from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

VERSION = "0.27.5"
BASE = f"https://cdn.jsdelivr.net/pyodide/v{VERSION}/full/"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "html" / "vendor" / "pyodide"

REQUIRED = [
    "pyodide.js",
    "pyodide.asm.js",
    "pyodide.asm.wasm",
    "python_stdlib.zip",
    "pyodide-lock.json",
]
OPTIONAL = [
    "package.json",
    "pyodide.d.ts",
]


def download(name: str) -> int:
    url = BASE + name
    dest = OUT / name
    print(f"  GET {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "algorithms-course-vendor"})
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = resp.read()
    dest.write_bytes(data)
    print(f"  -> {dest} ({len(data):,} bytes)")
    return len(data)


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    print(f"Vendoring Pyodide {VERSION} into {OUT}")
    failed_required = []
    for name in REQUIRED:
        try:
            download(name)
        except Exception as exc:  # noqa: BLE001
            print(f"  FAILED {name}: {exc}", file=sys.stderr)
            failed_required.append(name)
    for name in OPTIONAL:
        try:
            download(name)
        except Exception as exc:  # noqa: BLE001
            print(f"  skip optional {name}: {exc}")

    if failed_required:
        print(f"\nMissing required files: {failed_required}", file=sys.stderr)
        return 1

    meta = {"version": VERSION, "base": BASE, "required": REQUIRED}
    (OUT / "VENDOR_INFO.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print("\nDone.")
    print("  python scripts/serve_course.py")
    print("  open http://127.0.0.1:8765/practice.html")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
