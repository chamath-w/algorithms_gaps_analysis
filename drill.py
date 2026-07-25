#!/usr/bin/env python3
"""
Interactive offline drill: generate → solve → grade → tutor on failure.
"""

from __future__ import annotations

import importlib.util
import json
import textwrap
from pathlib import Path

from generator import GeneratedProblem, format_problem, generate_problem, list_generator_patterns
from progress import load_progress, save_progress
from tutor import format_tutor_report, tutor_from_failed_tests

ROOT = Path(__file__).parent
GEN_DIR = ROOT / "solutions" / "generated"
META_DIR = ROOT / "results" / "generated_meta"


def _ensure_dirs() -> None:
    GEN_DIR.mkdir(parents=True, exist_ok=True)
    META_DIR.mkdir(parents=True, exist_ok=True)


def save_generated(problem: GeneratedProblem) -> Path:
    _ensure_dirs()
    path = GEN_DIR / f"{problem.id}.py"
    if not path.exists():
        body = textwrap.dedent(f'''\
            """
            {problem.title}
            Pattern: {problem.pattern} | Difficulty: {problem.difficulty} | Seed: {problem.seed}

            {problem.description}

            Mental model: {problem.mental_model}
            """

            {problem.starter_code.rstrip()}
        ''')
        path.write_text(body + "\n", encoding="utf-8")
    meta = {
        "id": problem.id,
        "title": problem.title,
        "pattern": problem.pattern,
        "difficulty": problem.difficulty,
        "seed": problem.seed,
        "function_name": problem.function_name,
        "test_cases": [
            {"args": list(tc["args"]) if isinstance(tc["args"], tuple) else tc["args"],
             "expected": tc["expected"]}
            for tc in problem.test_cases
        ],
        "hints": problem.hints,
        "mental_model": problem.mental_model,
    }
    # tuples → lists for JSON; nested lists ok
    def _jsonable(obj):
        if isinstance(obj, tuple):
            return [_jsonable(x) for x in obj]
        if isinstance(obj, list):
            return [_jsonable(x) for x in obj]
        if isinstance(obj, dict):
            return {k: _jsonable(v) for k, v in obj.items()}
        return obj

    (META_DIR / f"{problem.id}.json").write_text(
        json.dumps(_jsonable(meta), indent=2), encoding="utf-8"
    )
    return path


def load_meta(problem_id: str) -> dict | None:
    path = META_DIR / f"{problem_id}.json"
    if not path.exists():
        # try fuzzy
        matches = list(META_DIR.glob(f"*{problem_id}*.json"))
        if not matches:
            return None
        path = matches[0]
    return json.loads(path.read_text(encoding="utf-8"))


def load_user_function(problem_id: str, function_name: str):
    path = GEN_DIR / f"{problem_id}.py"
    if not path.exists():
        matches = list(GEN_DIR.glob(f"*{problem_id}*.py"))
        if not matches:
            return None, path
        path = matches[0]
    spec = importlib.util.spec_from_file_location(path.stem, path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    fn = getattr(mod, function_name, None)
    return fn, path


def check_generated(problem_id: str) -> None:
    meta = load_meta(problem_id)
    if not meta:
        print(f"No metadata for {problem_id}. Run --drill first.")
        return
    fn, path = load_user_function(meta["id"], meta["function_name"])
    if fn is None:
        print(f"Could not load {meta['function_name']} from {path}")
        return
    # Rebuild expected via stored cases
    passed = 0
    logs = []
    for i, tc in enumerate(meta["test_cases"], 1):
        args = tc["args"]
        expected = tc["expected"]
        try:
            # args stored as list
            got = fn(*args)
            ok = got == expected
        except Exception as exc:  # noqa: BLE001
            ok = False
            got = f"EXC:{type(exc).__name__}: {exc}"
        if ok:
            passed += 1
        else:
            logs.append(f"  FAIL case {i}: args={args!r} expected={expected!r} got={got!r}")

    total = len(meta["test_cases"])
    store = load_progress()
    print(f"\n  {meta['title']}: {passed}/{total} passed  ({path})")
    if passed == total:
        store.generated_solved += 1
        save_progress(store)
        print("  [OK] All tests passed. Mental model reinforced.\n")
        return

    store.generated_failed += 1
    save_progress(store)
    print("  [FAIL] Failures:")
    for line in logs:
        print(line)
    print()
    for h in meta.get("hints", []):
        print(f"  Hint: {h}")
    print()
    rep = tutor_from_failed_tests(meta["pattern"], logs)
    print(format_tutor_report(rep))


def run_drill(pattern: str | None = None, seed: int | None = None, count: int = 1) -> None:
    print("\n" + "=" * 64)
    print("  DYNAMIC DRILL (offline generator)")
    print("=" * 64)
    print(f"  Patterns: {', '.join(list_generator_patterns())}")
    print()
    for i in range(count):
        s = None if seed is None else seed + i * 9973
        problem = generate_problem(pattern=pattern, seed=s)
        path = save_generated(problem)
        print(format_problem(problem))
        print(f"  Wrote: {path}")
        print(f"  Meta:  {META_DIR / (problem.id + '.json')}")
        print()
    print("  Edit the solution file(s), then grade with:")
    print("    python main.py --drill-check <id>")
    print()
