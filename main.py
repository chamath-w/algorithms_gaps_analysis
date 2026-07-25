#!/usr/bin/env python3
"""
Offline CS / SWE mastery course + algorithm gap analysis.

stdlib-only Python 3.12+. Works on long flights — no network required.
Open html/catalog.html for the interactive textbook.
"""

import argparse
import sys
import time
from pathlib import Path

# Windows consoles often default to cp1252 — keep course text (arrows, math) printable.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from problems import PROBLEMS, get_categories, get_problems_by_category, get_problem_by_id
from runner import (
    ensure_solutions_dir,
    create_solution_file,
    run_problem,
    format_result,
    ProblemResult,
    SOLUTIONS_DIR,
)
from analyzer import analyze_results, format_report, save_report
from patterns import (
    PATTERNS, print_pattern_summary, print_pattern_detail,
    print_decision_tree, get_all_pattern_ids,
)
from trainer import (
    run_training, format_training_report, save_training_report,
    SCENARIOS,
)
from curriculum import format_catalog, format_track_detail, TRACKS
from progress import load_progress, format_progress, save_progress, mark_lesson
from quiz import run_quiz, seed_algorithm_cards
from tutor import diagnose, format_tutor_report
from drill import run_drill, check_generated
from generator import list_generator_patterns


def list_problems():
    """Display all available problems organized by category."""
    print("\n" + "=" * 60)
    print("  AVAILABLE PROBLEMS")
    print("=" * 60)

    for cat in get_categories():
        problems = get_problems_by_category(cat)
        print(f"\n  {cat}")
        print(f"  {'-' * len(cat)}")
        for p in problems:
            diff = "**" if p.difficulty == "hard" else "* "
            solution_exists = (SOLUTIONS_DIR / f"{p.id}.py").exists()
            status = "[done]" if solution_exists else "[    ]"
            print(f"    {status} {p.id:<12} {diff} {p.title} ({p.time_limit_minutes}min)")

    print(f"\n  Total: {len(PROBLEMS)} problems across {len(get_categories())} categories")
    print(f"  * = medium, ** = hard")
    print()


def generate_templates(category: str | None = None):
    """Generate solution template files."""
    ensure_solutions_dir()
    problems = PROBLEMS if category is None else get_problems_by_category(category)

    if not problems:
        print(f"No problems found for category: {category}")
        return

    print(f"\nGenerating solution templates in: {SOLUTIONS_DIR}/")
    for p in problems:
        filepath = create_solution_file(p)
        print(f"  Created: {filepath.name} - {p.title}")
    print(f"\nEdit the solution files, then run: python main.py --report")
    print()


def run_single_problem(problem_id: str):
    """Run tests for a single problem."""
    problem = get_problem_by_id(problem_id)
    if not problem:
        print(f"Problem not found: {problem_id}")
        print("Use --list to see available problems.")
        return

    ensure_solutions_dir()
    solution_file = SOLUTIONS_DIR / f"{problem.id}.py"
    if not solution_file.exists():
        print(f"No solution file found. Creating template: {solution_file}")
        create_solution_file(problem)
        print("Edit the file and run again.")
        return

    print(f"\n  Running: {problem.title} ({problem.category})")
    print(f"  {'=' * 50}")

    result = run_problem(problem)
    print(format_result(result))
    print()


def run_assessment(category: str | None = None):
    """Run the full assessment or a category-specific one."""
    if category:
        problems = get_problems_by_category(category)
        if not problems:
            print(f"No problems found for category: {category}")
            print("Available categories:")
            for c in get_categories():
                print(f"  - {c}")
            return
    else:
        problems = PROBLEMS

    ensure_solutions_dir()

    # Check which solutions exist
    has_solutions = []
    missing_solutions = []
    for p in problems:
        if (SOLUTIONS_DIR / f"{p.id}.py").exists():
            has_solutions.append(p)
        else:
            missing_solutions.append(p)

    if not has_solutions:
        print("\nNo solutions found. Let me generate templates for you.\n")
        generate_templates(category)
        print("=" * 60)
        print("  HOW TO USE")
        print("=" * 60)
        print(f"  1. Open the solution files in: {SOLUTIONS_DIR}/")
        print(f"  2. Implement your solutions (one function per file)")
        print(f"  3. Run: python main.py --report")
        print(f"     Or test one at a time: python main.py --run <problem_id>")
        print()
        return

    # Run assessment
    scope = f" ({category})" if category else " (all categories)"
    print(f"\n{'=' * 60}")
    print(f"  RUNNING ASSESSMENT{scope}")
    print(f"  {len(has_solutions)} solutions found, {len(missing_solutions)} missing")
    print(f"{'=' * 60}\n")

    results: list[ProblemResult] = []

    for p in problems:
        print(f"  [{p.category}] {p.title} ({p.difficulty})")
        result = run_problem(p)
        results.append(result)
        print(format_result(result))
        print()

    # Analyze and report
    report = analyze_results(results)
    print(format_report(report))

    # Save
    filepath = save_report(report)
    print(f"  Report saved to: {filepath}")
    print()


def interactive_mode(category: str | None = None):
    """Interactive assessment with timed problem solving."""
    if category:
        problems = get_problems_by_category(category)
        if not problems:
            print(f"No problems found for category: {category}")
            return
    else:
        problems = PROBLEMS

    ensure_solutions_dir()

    print("\n" + "=" * 60)
    print("  INTERACTIVE ALGORITHM ASSESSMENT")
    print("=" * 60)
    print(f"\n  You will be presented with {len(problems)} problems.")
    print("  For each problem:")
    print("    1. Read the problem description and constraints")
    print("    2. Open the solution file in your editor")
    print("    3. Write your solution")
    print("    4. Press Enter when done (or 's' to skip)")
    print("    5. Your solution will be tested automatically")
    print()

    input("  Press Enter to start...")

    results: list[ProblemResult] = []

    for i, p in enumerate(problems, 1):
        print(f"\n{'=' * 60}")
        print(f"  Problem {i}/{len(problems)}: {p.title}")
        print(f"  Category: {p.category} | Difficulty: {p.difficulty}")
        print(f"  Time limit: {p.time_limit_minutes} minutes")
        print(f"{'=' * 60}")
        print()
        print(f"  {p.description}")
        print()
        print(f"  Function: {p.function_name}({p.parameters}) -> {p.return_type}")
        print(f"  Expected Time:  {p.time_complexity}")
        print(f"  Expected Space: {p.space_complexity}")
        print()

        # Show sample test case
        if p.test_cases:
            tc = p.test_cases[0]
            args = ", ".join(f"{k}={v!r}" for k, v in tc.inputs.items())
            print(f"  Example: {p.function_name}({args}) -> {tc.expected!r}")
            print()

        # Create solution file
        filepath = create_solution_file(p)
        print(f"  Solution file: {filepath}")
        print()

        # Wait for user
        start_time = time.time()
        response = input("  Press Enter when done, 's' to skip, 'h' for hints, 'q' to quit: ").strip().lower()

        while response == 'h':
            for j, hint in enumerate(p.hints, 1):
                print(f"    Hint {j}: {hint}")
            print()
            response = input("  Press Enter when done, 's' to skip, 'q' to quit: ").strip().lower()

        elapsed = (time.time() - start_time) / 60

        if response == 'q':
            print("\n  Assessment ended early.")
            break

        if response == 's':
            result = ProblemResult(problem=p, skipped=True, error="Skipped by user")
        else:
            result = run_problem(p)
            result.time_taken_minutes = elapsed

        results.append(result)
        print()
        print(f"  Time: {elapsed:.1f} minutes")
        print(format_result(result))

    if results:
        report = analyze_results(results)
        print(format_report(report))
        filepath = save_report(report)
        print(f"  Report saved to: {filepath}")
        print()


def main():
    parser = argparse.ArgumentParser(
        description="Offline CS/SWE Course + Algorithm Gap Analysis (stdlib only)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Course (offline textbook + drills):
  python main.py --catalog                 Full undergrad-shaped catalog
  python main.py --catalog --verbose       Lessons + HTML links
  python main.py --course dsa              Detail one track
  python main.py --quiz --topic dsa        Offline quiz (tutor on miss)
  python main.py --quiz --track theory
  python main.py --drill                   Generate a LeetCode-style problem
  python main.py --drill --pattern bfs --count 3
  python main.py --drill-check gen_bfs_123 Grade your solution
  python main.py --tutor --topic dp --wrong "DFS" --right "DP knapsack"
  python main.py --progress                SRS + lesson progress
  python main.py --seed-cards              Init algorithm memory SRS cards

Open the interactive textbook (no server):
  html/catalog.html

Classic assessment:
  python main.py --train / --list / --generate / --run / --report / --interactive
  python main.py --patterns / --pattern sliding_window / --decision-tree
        """,
    )
    parser.add_argument("--list", action="store_true", help="List all coding problems")
    parser.add_argument("--generate", action="store_true", help="Generate solution templates")
    parser.add_argument("--category", type=str, help="Filter by coding category name")
    parser.add_argument("--run", type=str, metavar="ID", help="Run tests for a specific problem ID")
    parser.add_argument("--report", action="store_true", help="Run all solutions and generate gap report")
    parser.add_argument("--interactive", action="store_true", help="Interactive timed assessment")
    parser.add_argument("--train", action="store_true", help="Pattern recognition trainer")
    parser.add_argument("--train-limit", type=int, metavar="N", help="Limit training to N scenarios")
    parser.add_argument("--patterns", action="store_true", help="View all patterns (quick reference)")
    parser.add_argument("--pattern", type=str, metavar="ID", help="Pattern id (detail or drill filter)")
    parser.add_argument("--decision-tree", action="store_true", help="View the pattern decision flowchart")

    # Course
    parser.add_argument("--catalog", action="store_true", help="Show full course catalog")
    parser.add_argument("--verbose", action="store_true", help="Verbose catalog")
    parser.add_argument("--course", type=str, metavar="TRACK", help="Show one track (e.g. dsa, theory)")
    parser.add_argument("--quiz", action="store_true", help="Run offline quiz")
    parser.add_argument("--topic", type=str, help="Quiz/tutor topic filter")
    parser.add_argument("--track", type=str, help="Quiz track filter")
    parser.add_argument("--limit", type=int, default=None, help="Limit quiz/drill count")
    parser.add_argument("--drill", action="store_true", help="Generate dynamic practice problem(s)")
    parser.add_argument("--count", type=int, default=1, help="Number of generated drills")
    parser.add_argument("--seed", type=int, default=None, help="RNG seed for generators/quizzes")
    parser.add_argument("--drill-check", type=str, metavar="ID", help="Grade a generated solution")
    parser.add_argument("--tutor", action="store_true", help="Offline mental-model tutor")
    parser.add_argument("--wrong", type=str, default="", help="What you answered (for --tutor)")
    parser.add_argument("--right", type=str, default="", help="Correct answer (for --tutor)")
    parser.add_argument("--progress", action="store_true", help="Show offline progress / SRS due")
    parser.add_argument("--seed-cards", action="store_true", help="Initialize algorithm SRS cards")
    parser.add_argument("--done", type=str, metavar="LESSON", help="Mark a lesson id complete")

    args = parser.parse_args()

    if args.catalog:
        print(format_catalog(verbose=args.verbose))
    elif args.course:
        print(format_track_detail(args.course))
    elif args.quiz:
        run_quiz(topic=args.topic, track=args.track, limit=args.limit or 8, seed=args.seed)
    elif args.drill:
        run_drill(pattern=args.pattern, seed=args.seed, count=args.count)
    elif args.drill_check:
        check_generated(args.drill_check)
    elif args.tutor:
        topic = args.topic or args.pattern or "dp"
        rep = diagnose(topic=topic, user_answer=args.wrong, correct_answer=args.right)
        print(format_tutor_report(rep))
    elif args.progress:
        print(format_progress(load_progress()))
    elif args.seed_cards:
        n = seed_algorithm_cards()
        print(f"\n  Seeded {n} SRS cards. Review in html/algo_memory.html or via quizzes.\n")
    elif args.done:
        store = load_progress()
        mark_lesson(store, args.done, "done")
        path = save_progress(store)
        print(f"\n  Marked {args.done} done -> {path}\n")
    elif args.list:
        list_problems()
    elif args.generate:
        generate_templates(args.category)
    elif args.run:
        run_single_problem(args.run)
    elif args.report:
        run_assessment(args.category)
    elif args.interactive:
        interactive_mode(args.category)
    elif args.train:
        report = run_training(limit=args.train_limit)
        print(format_training_report(report))
        filepath = save_training_report(report)
        print(f"  Report saved to: {filepath}")
        print()
    elif args.patterns:
        print_pattern_summary()
    elif args.pattern and not args.drill:
        print_pattern_detail(args.pattern)
    elif args.decision_tree:
        print_decision_tree()
    else:
        parser.print_help()
        print("\nQuick start (offline course):")
        print("  1. Open html/catalog.html")
        print("  2. python main.py --catalog --verbose")
        print("  3. python main.py --seed-cards")
        print("  4. python main.py --quiz --topic dsa")
        print("  5. python main.py --drill --pattern sliding_window")
        print("  6. python main.py --train")
        print(f"\n  Generator patterns: {', '.join(list_generator_patterns())}")
        print(f"  Tracks: {', '.join(t.id for t in TRACKS)}")


if __name__ == "__main__":
    main()
