"""Batch-update HTML pages for Signal Trace theme + mobile meta."""
from __future__ import annotations

import re
from pathlib import Path

HTML_DIR = Path(__file__).resolve().parents[1] / "html"
CSS_V = "v=20"
NAV_V = "v=20"

VIEWPORT = (
    '<meta name="viewport" '
    'content="width=device-width, initial-scale=1.0, viewport-fit=cover" />'
)
THEME = '<meta name="theme-color" content="#070a0f" />'
APPLE = """    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />"""

MENU_BTN = (
    '<button class="menu-toggle" aria-label="Open navigation menu" '
    'aria-expanded="false" aria-controls="course-sidebar">'
    '\n      <span aria-hidden="true">&#9776;</span>\n    </button>'
)
SIDEBAR = '<aside class="sidebar" id="course-sidebar" aria-label="Course navigation"></aside>'
MAIN = '<main class="main-content" id="main-content">'


def patch_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    orig = text

    text = re.sub(
        r'<meta name="viewport"[^>]*/>',
        VIEWPORT,
        text,
        count=1,
    )

    if 'name="theme-color"' not in text:
        text = text.replace("</title>", f"</title>\n    {THEME}", 1)
        if APPLE.strip() not in text:
            text = text.replace(THEME, f"{THEME}\n{APPLE}", 1)

    text = re.sub(
        r'href="css/style\.css(?:\?v=\d+)?"',
        f'href="css/style.css?{CSS_V}"',
        text,
    )

    text = re.sub(
        r'<button class="menu-toggle" aria-label="Toggle menu">&#9776;</button>',
        MENU_BTN,
        text,
    )

    text = re.sub(
        r'<aside class="sidebar"></aside>',
        SIDEBAR,
        text,
    )

    text = re.sub(
        r'<main class="main-content">',
        MAIN,
        text,
        count=1,
    )

    text = re.sub(
        r'<script src="js/nav\.js"></script>',
        f'<script src="js/nav.js?{NAV_V}"></script>',
        text,
    )
    text = re.sub(
        r'<script src="js/animations\.js"></script>',
        f'<script src="js/animations.js?{NAV_V}"></script>',
        text,
    )

    text = re.sub(
        r'<button class="scroll-top" aria-label="Scroll to top">&uarr;</button>',
        '<button class="scroll-top" aria-label="Scroll to top">\n      <span aria-hidden="true">&uarr;</span>\n    </button>',
        text,
    )
    text = re.sub(
        r'<button class="scroll-top" aria-label="Scroll to top">&#8593;</button>',
        '<button class="scroll-top" aria-label="Scroll to top">\n      <span aria-hidden="true">&uarr;</span>\n    </button>',
        text,
    )

    if text != orig:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    changed = 0
    for path in sorted(HTML_DIR.glob("*.html")):
        if patch_file(path):
            changed += 1
            print(f"updated {path.name}")
    print(f"done: {changed} files")


if __name__ == "__main__":
    main()
