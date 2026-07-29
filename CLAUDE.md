# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

An **offline interactive CS/SWE course** (undergrad-shaped catalog + staff mastery) with a Python CLI assessor. Static HTML textbook (animations, SVG, quizzes, SRS algorithm memory, local tutor) plus stdlib-only generators/drills. No network required after opening `html/`. No external Python dependencies — Python 3.12+ stdlib only.

## Commands

```bash
# Course (offline)
python main.py --catalog --verbose             # Full undergrad-shaped catalog
python main.py --course dsa                    # One track detail
python main.py --quiz --topic dsa              # Quiz; tutor fires on misses
python main.py --drill --pattern bfs --count 3 # Dynamic LeetCode-style problems
python main.py --drill-check <id>              # Grade generated solution
python main.py --tutor --topic dp --wrong "..." --right "..."
python main.py --progress                      # SRS + lesson progress (results/progress.json)
python main.py --seed-cards                    # Init algorithm memory SRS cards
python main.py --done dsa_05                   # Mark a lesson complete

# Pattern study
python main.py --patterns                      # Quick reference of all 21 patterns
python main.py --pattern sliding_window        # Deep dive on a specific pattern
python main.py --decision-tree                 # Pattern selection flowchart

# Pattern recognition training (train classification, no coding)
python main.py --train                         # Full trainer (30 scenarios, randomized)
python main.py --train --train-limit 10        # Quick session (10 random scenarios)

# Coding assessment bank
python main.py --list                          # List all 26 problems across 14 categories
python main.py --generate                      # Create solution template files in solutions/
python main.py --generate --category "Trees"   # Templates for one category only
python main.py --run dp_01                     # Run tests for a single problem by ID
python main.py --report                        # Run all solutions, generate gap analysis
python main.py --interactive                   # Timed interactive assessment with hints
```

Open the textbook (local server required for in-browser Python/WASM):

```bash
python scripts/serve_course.py          # http://127.0.0.1:8765/
python scripts/vendor_pyodide.py        # once, for offline Pyodide under html/vendor/
```

Practice Arena (`/practice.html`) runs full CPython in the browser via Pyodide — write Python, Run tests, tutor on failure.

## Architecture

stdlib-only modules:

- **`curriculum.py`** — Undergrad-shaped tracks/modules/lessons (discrete math, DSA, theory, architecture, OS/net/DB, compilers, SWE, systems design, security, staff).
- **`generator.py`** — Procedural LeetCode-style problem generator with reference solvers + tests.
- **`drill.py`** — Persist generated problems under `solutions/generated/`, grade via `--drill-check`.
- **`tutor.py`** — Offline misconception → mental-model repair agent (no LLM/network).
- **`quiz.py`** — CLI quizzes across tracks; updates SRS cards on grade.
- **`progress.py`** — SM-2-inspired SRS + lesson progress in `results/progress.json`.
- **`patterns.py`** — 21 Pattern dataclasses + `DECISION_TREE` + `ENGINEERING_PATTERNS`.
- **`trainer.py`** — 30 TrainingScenario classification trainer.
- **`problems.py` / `runner.py` / `analyzer.py`** — Fixed 26-problem bank, test runner, gap reports.
- **`main.py`** — CLI entry for all modes.

HTML (`html/`): static multi-page textbook (~30 catalog pages). Key JS:

- `js/course.js` — quizzes, SRS flashcards, browser progress (`localStorage`)
- `js/animations.js` — `AlgoAnimation` + SVG helpers
- `js/practice-arena.js` + `js/arena-coach.js` — Practice Arena (Pyodide, micro-drills, text coach, deliberate/skeleton/interview modes)
- `js/algo-memory-data.js` + `js/algo-memory.js` + `js/algo-memory-movies.js` — Memory Lab catalog + **movie per pattern**
- `js/impl-templates.js` + `js/impl-games.js` — Implementation Memory Games (idiomatic type/scramble/cloze/bug drills); regenerate templates with `python scripts/export_impl_templates.py`
- `js/nav.js` / `offline-manifest.json` / `sw.js` — nav + flight cache

Health check: `python scripts/scan_course.py` (links, stale counts, movie coverage, impl-game templates).

## Key Design Decisions

- **Pattern recognition is separate from coding ability.** The trainer tests classification without requiring code. This mirrors interview reality: most failures come from not recognizing the pattern, not from inability to code it once identified.
- **Idiomatic base before adaptation.** Implementation Games burn the theoretically clean template into long-term memory; Practice Arena trains adjusting that base to the exact problem.
- **Patterns link to problems.** Each problem in `problems.py` has `tags` that map to pattern IDs in `patterns.py`. Each pattern has `canonical_problems` linking back.
- **Multiple valid answers.** The trainer accepts `secondary_patterns` as correct (e.g., trapping rain water can be two pointers, monotonic stack, or DP). The runner has special validators for problems like topological sort that have multiple valid outputs.

## Adding Content

**New algorithm pattern:** Add a `Pattern(...)` to `PATTERNS` in `patterns.py`, a Practice Arena generator in `html/js/practice-arena.js`, a trainer scenario in `trainer.py`, a movie in `html/js/algo-memory-movies.js`, regenerate `html/js/algo-memory-data.js`, and run `python scripts/export_impl_templates.py` (add a bug card / mantra override in that script if needed).

**New systems pattern:** Add to `ENGINEERING_PATTERNS` in `patterns.py` and a section in `html/engineering_patterns.html`.

**New training scenario:** Add a `TrainingScenario(...)` to `SCENARIOS` in `trainer.py`. Set `primary_pattern` to a pattern ID from `patterns.py`. Add acceptable alternatives to `secondary_patterns`.

**New coding problem:** Add a `Problem(...)` to `PROBLEMS` in `problems.py`. If non-standard validation is needed, add a validator in `runner.py`. If adding a new category, add a `STUDY_RESOURCES` entry in `analyzer.py`.

## Study Guides (`guides/`)

Six comprehensive guides tailored for an EE-background engineer transitioning to staff-level SDE:

1. **`01_mental_models.md`** — 6 mental model shifts from EE to SDE thinking (deterministic vs eventual consistency, composition over construction, optimization-first vs clarity-first, state machines everywhere, abstraction layers, failure is normal). Each uses EE analogies as bridges.

2. **`02_systems_design.md`** — Building blocks (databases, caching, queues, load balancers), distributed systems fundamentals (CAP, consistency models, consensus), system design method (5-step process), 9 practice problems (beginner to staff level), API design (REST + gRPC).

3. **`03_software_engineering.md`** — SOLID principles with EE analogies, the 8 design patterns that actually matter, testing pyramid, code review, git at staff level, CI/CD, technical debt management.

4. **`04_cs_fundamentals.md`** — OS internals (processes, threads, concurrency bugs), networking L4-7 (TCP/UDP, HTTP, TLS, WebSocket, DNS), databases deep dive (SQL fluency, ACID, scaling, NoSQL selection), concurrency patterns in Python (threading, multiprocessing, asyncio).

5. **`05_staff_level.md`** — Staff engineer archetypes, RFC/design doc writing (with template), technical decision frameworks, cross-team influence without authority, mentoring, observability (logs/metrics/traces), incident response.

6. **`06_three_month_plan.md`** — Week-by-week plan (12 weeks, 10-15h/week), 2 capstone projects (Task Management API, Distributed URL Shortener with Analytics), prioritized reading list, weekly self-assessment questions, milestones.

### Daily Guides (step-by-step, 72 days)

7. **`07_daily_guide_overview.md`** — Rules (don't skip days, time-box, journal), daily session template (review/study/practice/journal), prerequisites.

8. **`08_daily_month1.md`** — Days 1-24 (Weeks 1-4: Foundations). Mental models, 21 patterns, decision tree, pattern training, algorithm problems (easy through hard), pytest, concurrency (threading/asyncio), SQL, first system design.

9. **`09_daily_month2.md`** — Days 25-44 (Weeks 5-8: Architecture). DDIA chapters 1-9, 9 system designs, Project 1 (Task Management API with FastAPI/SQLite/Docker/RFC), SOLID, design patterns, Git, CI/CD, Docker.

10. **`10_daily_month3.md`** — Days 45-72 (Weeks 9-12: Staff Impact + Capstone). Staff engineer skills (RFCs/ADRs), Project 2 (URL Shortener with Analytics — 2 services + 1 worker, event pipeline, load testing, observability), algorithm refresh, final assessments, personal retrospective.

## User Context

The user has an EE background (electrical and electronics engineering), programs in C/C++/Python/Rust, and is currently a senior staff SDE. All guides use EE analogies extensively. The recommended workflow is: mental models -> pattern recognition training -> algorithm coding -> systems design -> staff-level skills.

## Directory Layout

- `solutions/` — User-written solution files (one per problem, auto-generated templates)
- `results/` — JSON reports (gap analysis and training results, timestamped)
- `guides/` — 10 files: 6 study guides + 4 daily guide files (see above)
