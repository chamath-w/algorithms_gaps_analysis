# Offline CS / SWE Mastery Course

Interactive undergrad-shaped computer science and software engineering textbook, plus staff-level practice. Static HTML (animations, quizzes, algorithm memory lab, in-browser Python Practice Arena) with an optional stdlib-only Python CLI.

Works the same on **Windows** and **macOS**. Designed so you can prepare once while online, then study on a long flight with no network.

## Why a local server?

Do **not** open `html/index.html` via double-click (`file://`). Browsers block the in-browser Python runtime (WebAssembly) and offline caching on `file://`.

Serve the `html/` folder over `http://127.0.0.1` instead. This repo includes a tiny server that needs only Python’s standard library—no pip packages.

## Prerequisites

| Requirement | Windows | macOS |
| --- | --- | --- |
| Python 3.12+ recommended (3.11+ usually fine) | [python.org](https://www.python.org/downloads/) — check “Add python.exe to PATH” | Usually preinstalled as `python3`, or install from python.org / Homebrew |
| Modern browser | Chrome, Edge, or Firefox | Safari, Chrome, or Firefox |
| Network | Once, to clone/download the repo and (if needed) vendor Pyodide | Same |

Verify Python:

```bash
# Windows (PowerShell or cmd)
python --version

# macOS (Terminal)
python3 --version
```

On Mac, if `python` is not found, use `python3` everywhere below (including `python3 scripts/serve_course.py`).

## Get the course onto your machine

**Option A — Git**

```bash
git clone <your-repo-url>
cd algorithms_gaps_analysis
```

**Option B — GitHub ZIP**

Download the repository ZIP, unzip it, and open a terminal in the project root (the folder that contains `main.py` and `html/`).

Copy the whole folder to your flight laptop (USB, cloud sync, or another clone). Paths and commands are the same on Windows and Mac.

## One-time setup (while online)

From the project root:

```bash
# Windows
python scripts/vendor_pyodide.py

# macOS
python3 scripts/vendor_pyodide.py
```

This downloads the in-browser CPython runtime (Pyodide, ~15 MB) into `html/vendor/pyodide/`. After this, Practice Arena works with no network.

If `html/vendor/pyodide/pyodide.asm.wasm` already exists, you can skip this step.

## Start the course (every study session)

```bash
# Windows
python scripts/serve_course.py

# macOS
python3 scripts/serve_course.py
```

Your browser should open:

- Practice Arena: http://127.0.0.1:8765/practice.html  
- Home / catalog: http://127.0.0.1:8765/index.html  

Useful links once the server is running:

| Page | URL |
| --- | --- |
| Home | http://127.0.0.1:8765/index.html |
| Full catalog | http://127.0.0.1:8765/catalog.html |
| Algorithm Memory Lab | http://127.0.0.1:8765/algo_memory.html |
| Implementation Games | http://127.0.0.1:8765/games.html |
| Practice Arena | http://127.0.0.1:8765/practice.html |
| Patterns (21) | http://127.0.0.1:8765/patterns.html |
| Engineering Patterns | http://127.0.0.1:8765/engineering_patterns.html |
| Progress | http://127.0.0.1:8765/progress.html |

Stop the server with `Ctrl+C` in the terminal.

Alternate port:

```bash
python scripts/serve_course.py --port 8765 --no-browser
```

## Prepare for flight (do this before boarding)

1. Start the server (commands above).
2. Open http://127.0.0.1:8765/index.html
3. In **Prepare for flight**:
   - Click **Cache everything for offline** — stores all pages, scripts, CSS, and Pyodide in this browser (~15 MB). Wait until the badge says **Flight-ready**.
   - Optional (Chrome / Edge): **Save pack to disk...** — writes a `cs-swe-course-offline/` folder you choose, plus `OFFLINE_READY.txt`.
4. A checklist file `course-offline-ready.txt` downloads automatically.

On the plane:

1. Start `serve_course.py` again (no network needed if Pyodide was vendored).
2. Use the **same browser profile** you used for Prepare for flight.
3. Open http://127.0.0.1:8765/index.html

Cross-machine tip: developing on Windows and flying with a Mac is fine. Copy or clone the **entire repo** (including `html/vendor/pyodide/`) to the Mac, run `python3 scripts/serve_course.py`, then run Prepare for flight once in the Mac browser before you lose connectivity.

## What’s in the course

| Piece | Contents |
| --- | --- |
| Algorithm patterns | **21** templates + decision tree + memory movies |
| Engineering patterns | **9** staff systems patterns (cache-aside, outbox, saga, …) |
| Pattern trainer | **30** classification scenarios (`--train`) |
| Coding bank | **26** fixed problems (`--list` / `--run`) |
| HTML textbook | Full catalog tracks (discrete math → staff) + daily plan |
| Practice Arena | Pyodide Python, micro-drills, text coach, deliberate streaks |
| Algorithm Memory Lab | SRS + full catalog skeletons + Play/Next movie per pattern |
| Implementation Games | Idiomatic template drills (type / scramble / cloze / bug hunt) for 21 patterns + core/eng idioms |

## Daily workflow

1. **Algorithm Memory Lab** — SRS flashcards, pick a pattern, play its movie, recite the skeleton.
2. **Implementation Games** — lock the idiomatic base (Daily Workout or one pattern to 5/5).
3. **Practice Arena** — micro-drill → code → **Run tests** (Ctrl/Cmd+Enter). Adjust the base you just recalled; read the text coach + expected/got diff.
4. Study a track from the **catalog** (discrete math, theory, architecture, systems, security, staff, etc.).
5. Optional CLI (stdlib only):

```bash
# Windows: python …   |   macOS: python3 …
python main.py --catalog --verbose
python main.py --patterns                    # all 21
python main.py --seed-cards
python main.py --quiz --topic dsa
python main.py --train                       # 30 scenarios
python main.py --drill --pattern bfs --count 3
python main.py --drill-check <id>
python main.py --tutor --topic dp --wrong "greedy" --right "0/1 DP"
python main.py --progress
python scripts/scan_course.py                # link / completeness check
```

Browser progress uses `localStorage`. CLI progress uses `results/progress.json`. They are separate on purpose.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Practice Arena / WASM fails | Use `serve_course.py`; do not open `file://` |
| “Local Pyodide not found” / runtime load error | Run `scripts/vendor_pyodide.py` while online |
| `python` not found on Mac | Use `python3` |
| `python` not found on Windows | Reinstall from python.org with PATH enabled, or use the “Python 3.x” app from the Start menu |
| Port 8765 in use | `python scripts/serve_course.py --port 8770` |
| Offline cache empty on the Mac | Run Prepare for flight on that Mac browser before the flight |
| Google Fonts look wrong offline | Expected — the course falls back to system fonts |

## Platform notes

- **Commands differ only by interpreter name** (`python` vs `python3`).
- **Line endings and paths** are handled by the scripts; use forward slashes in docs/URLs.
- **No pip/npm install** is required for the course server, Practice Arena, or CLI.
- Capstone project guides may mention FastAPI/Docker later; those are optional student projects, not runtime dependencies of this repo.

## License / use

Personal study materials in this repository. Use and adapt for your own learning.
