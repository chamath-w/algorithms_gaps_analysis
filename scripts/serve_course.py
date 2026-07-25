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
import os
import socketserver
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "html"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **getattr(http.server.SimpleHTTPRequestHandler, "extensions_map", {}),
        ".wasm": "application/wasm",
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".json": "application/json",
    }

    def end_headers(self) -> None:
        # Allow service worker control of the whole course origin path.
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

    handler = functools.partial(QuietHandler, directory=str(HTML))
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
