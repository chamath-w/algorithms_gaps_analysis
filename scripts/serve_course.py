#!/usr/bin/env python3
"""
Serve the HTML course locally (needed for in-browser Python / WASM).

    python scripts/serve_course.py
    # -> http://127.0.0.1:8765/practice.html
"""

from __future__ import annotations

import argparse
import functools
import http.server
import json
import os
import socketserver
import webbrowser
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "html"
ANALYTICS_FILE = HTML / "data" / "site-analytics.json"


def _load_analytics() -> dict:
    if ANALYTICS_FILE.is_file():
        try:
            return json.loads(ANALYTICS_FILE.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            pass
    return {
        "updated": datetime.now(timezone.utc).isoformat(),
        "totalViews": 0,
        "byContinent": {},
        "byDay": [],
        "byPage": {},
    }


def _save_analytics(data: dict) -> None:
    ANALYTICS_FILE.parent.mkdir(parents=True, exist_ok=True)
    data["updated"] = datetime.now(timezone.utc).isoformat()
    ANALYTICS_FILE.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def _record_view(page: str, continent: str = "Unknown") -> None:
    data = _load_analytics()
    data["totalViews"] = int(data.get("totalViews", 0)) + 1
    by_continent = data.setdefault("byContinent", {})
    by_continent[continent] = int(by_continent.get(continent, 0)) + 1
    by_page = data.setdefault("byPage", {})
    by_page[page] = int(by_page.get(page, 0)) + 1
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    by_day = {row["date"]: row["views"] for row in data.get("byDay", [])}
    by_day[day] = int(by_day.get(day, 0)) + 1
    data["byDay"] = [{"date": d, "views": by_day[d]} for d in sorted(by_day)]
    _save_analytics(data)


class CourseHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **getattr(http.server.SimpleHTTPRequestHandler, "extensions_map", {}),
        ".wasm": "application/wasm",
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".json": "application/json",
    }

    def do_POST(self) -> None:  # noqa: N802
        if self.path.rstrip("/") == "/analytics-beacon":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length) if length else b"{}"
            try:
                entry = json.loads(body.decode("utf-8"))
            except json.JSONDecodeError:
                entry = {}
            page = entry.get("page") or "index.html"
            continent = entry.get("continent") or "Unknown"
            _record_view(page, continent)
            self.send_response(204)
            self.end_headers()
            return
        self.send_error(404)

    def do_GET(self) -> None:  # noqa: N802
        super().do_GET()

    def end_headers(self) -> None:
        if self.path.endswith("/sw.js") or self.path.endswith("sw.js"):
            self.send_header("Service-Worker-Allowed", "/")
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt: str, *args) -> None:
        sys_stderr = __import__("sys").stderr
        sys_stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


def main() -> int:
    parser = argparse.ArgumentParser(description="Serve offline HTML course")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()

    if not HTML.is_dir():
        print(f"Missing {HTML}")
        return 1

    handler = functools.partial(CourseHandler, directory=str(HTML))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", args.port), handler) as httpd:
        url = f"http://127.0.0.1:{args.port}/practice.html"
        print(f"Serving {HTML}")
        print(f"Practice Arena: {url}")
        print(f"Catalog:        http://127.0.0.1:{args.port}/catalog.html")
        print("Ctrl+C to stop.")
        if not args.no_browser:
            try:
                webbrowser.open(url)
            except Exception:  # noqa: BLE001
                pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
