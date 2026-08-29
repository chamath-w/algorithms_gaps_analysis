# Project Context — Staff SDE Mastery Course

This file captures full project context for continuity across sessions and machines.

## User Profile

- **Background**: Electrical and Electronics Engineering
- **Programming**: C, C++, Python, Rust
- **Current role**: Senior Staff Software Development Engineer
- **Goal**: Become extremely proficient SDE over 3 months
- **Key gap**: Algorithm pattern recognition under interview pressure, plus systems design, SWE practices, and staff-level skills

## Learning Style

- Prefers **EE analogies** to explain software concepts
- Learns via **name → picture → movie → skeleton** + learn-by-doing
- **Visual + precise feedback**; text coach preferred over speech synthesis
- Method of Loci (memory palace) for memorization
- Pattern recognition training first, coding second

## What Has Been Built

### 1. Python CLI Tool (stdlib only, Python 3.12+)

| Module | Role |
| --- | --- |
| `main.py` | CLI entry (catalog, quiz, drill, train, patterns, report, …) |
| `curriculum.py` | Undergrad-shaped tracks / modules / lessons |
| `patterns.py` | **21** algorithm patterns + `DECISION_TREE` + 9 `ENGINEERING_PATTERNS` |
| `trainer.py` | **30** classification scenarios |
| `generator.py` / `drill.py` | Procedural problems + grading |
| `tutor.py` / `quiz.py` / `progress.py` | Offline tutor, quizzes, SRS (`results/progress.json`) |
| `problems.py` / `runner.py` / `analyzer.py` | Fixed **26**-problem bank + gap reports |
| `scripts/serve_course.py` | Local static server for `html/` |
| `scripts/vendor_pyodide.py` | Offline Pyodide under `html/vendor/pyodide/` |
| `scripts/scan_course.py` | Link / count / movie completeness scan |

### 2. Markdown Study Guides (`guides/`)

10 files: mental models, systems design, SWE, CS fundamentals, staff level, 3-month plan, daily overview, months 1–3.

### 3. HTML Course (`html/`)

**~30 pages** in the offline catalog (see `offline-manifest.json`), including:

| Area | Pages |
| --- | --- |
| Home | `index.html`, `catalog.html`, `progress.html` |
| Practice | `algo_memory.html`, `practice.html`, `decision_tree.html` |
| Algorithms | `patterns.html` (21), `sorting.html`, `deep_dives.html`, `provability.html` |
| Foundation | `mental_models.html`, `memory_palace.html`, `discrete_math.html` |
| Theory | `theory.html`, `compilers.html` |
| Systems | `architecture.html`, `cs_fundamentals.html`, `systems_design.html`, `security.html` |
| Professional | `software_engineering.html`, `engineering_patterns.html`, `staff_level.html`, `readings.html` |
| Plan | `three_month_plan.html`, `daily_*.html` |

#### Shared JS / CSS

- `css/style.css` — design system
- `js/nav.js` — sidebar (includes Engineering Patterns + Patterns (21))
- `js/animations.js` — `AlgoAnimation` + SVG helpers
- `js/course.js` — quizzes, SRS flashcards, browser progress
- `js/practice-arena.js` + `js/arena-coach.js` — in-browser Python (Pyodide), micro-drills, text coach, deliberate mode, skeleton ghost, diff feedback, model-vs-yours
- `js/algo-memory-data.js` + `js/algo-memory.js` + `js/algo-memory-movies.js` — full 21-pattern memory lab with movies
- `js/offline-pack.js` + `sw.js` — flight-mode caching

## Key Design Decisions

1. Pattern recognition separated from coding (`--train` vs `--drill` / Practice Arena)
2. Local HTTP server required for Pyodide (not `file://`)
3. Browser progress (`localStorage`) separate from CLI (`results/progress.json`)
4. EE analogies throughout; etymology callouts on many pages
5. No pip/npm runtime deps for the course itself
6. Practice Arena: text coach (no speech); optional tiny Web Audio blips
7. Implementation Games: burn idiomatic bases into LTM before Arena adaptation
8. Coached session: escalate coaching (question → hint → lesson → repair); any aid used disqualifies a clean solve

## Daily Recommended Loop

1. Algorithm Memory Lab (SRS + catalog movie + skeleton)
2. Implementation Games (idiomatic type / scramble / cloze / bug hunt → mastery 5/5)
3. Practice Arena — coached session (plan gate → code → Run → gap diagnosis → escalating coaching → clean-solve bar → report)
3. One catalog track lesson
4. Optional CLI: `--train`, `--drill`, `--quiz`

## Cross-machine / Flight

Copy entire repo including `html/vendor/pyodide/`. Run `serve_course.py`, then **Prepare for flight** once per browser profile before offline use.

## Scan / health check

```bash
python scripts/scan_course.py
```

Checks nav/catalog/manifest links, outdated pattern/scenario counts in docs, curriculum HTML paths, and memory-movie coverage for all pattern IDs.
