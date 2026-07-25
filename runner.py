"""
Test runner: presents problems, executes user solutions, scores results.
"""

import importlib.util
import os
import sys
import time
import traceback
from dataclasses import dataclass, field
from pathlib import Path

from problems import Problem, TestCase


SOLUTIONS_DIR = Path(__file__).parent / "solutions"


@dataclass
class TestResult:
    test_case: TestCase
    passed: bool
    actual_output: object = None
    error: str | None = None
    execution_time_ms: float = 0.0


@dataclass
class ProblemResult:
    problem: Problem
    test_results: list[TestResult] = field(default_factory=list)
    time_taken_minutes: float = 0.0
    skipped: bool = False
    error: str | None = None

    @property
    def tests_passed(self) -> int:
        return sum(1 for r in self.test_results if r.passed)

    @property
    def tests_total(self) -> int:
        return len(self.test_results)

    @property
    def score(self) -> float:
        if self.skipped or self.tests_total == 0:
            return 0.0
        return self.tests_passed / self.tests_total

    @property
    def all_passed(self) -> bool:
        return self.tests_passed == self.tests_total and self.tests_total > 0


def ensure_solutions_dir():
    SOLUTIONS_DIR.mkdir(exist_ok=True)


def create_solution_file(problem: Problem) -> Path:
    """Create a solution template file for the user to fill in."""
    filepath = SOLUTIONS_DIR / f"{problem.id}.py"
    if filepath.exists():
        return filepath

    template = f'''"""
{problem.title}
Category: {problem.category}
Difficulty: {problem.difficulty}

{problem.description}

Expected Time Complexity: {problem.time_complexity}
Expected Space Complexity: {problem.space_complexity}
"""


def {problem.function_name}({problem.parameters}) -> {problem.return_type}:
    # Write your solution here
    pass
'''
    filepath.write_text(template)
    return filepath


def load_solution_function(problem: Problem):
    """Load the user's solution function from the solution file."""
    filepath = SOLUTIONS_DIR / f"{problem.id}.py"
    if not filepath.exists():
        return None

    spec = importlib.util.spec_from_file_location(problem.id, filepath)
    module = importlib.util.module_from_spec(spec)

    # Suppress prints from solution
    old_stdout = sys.stdout
    sys.stdout = open(os.devnull, "w")
    try:
        spec.loader.exec_module(module)
    finally:
        sys.stdout.close()
        sys.stdout = old_stdout

    return getattr(module, problem.function_name, None)


def _values_equal(expected, actual) -> bool:
    """Compare expected and actual values with special handling for certain types."""
    # For lists that can be in any order (like accounts_merge), sort sublists
    if isinstance(expected, list) and isinstance(actual, list):
        # Check if both are lists of lists (for sorting inner lists)
        if expected and isinstance(expected[0], list) and actual and isinstance(actual[0], list):
            try:
                return sorted([sorted(x) if isinstance(x, list) else x for x in expected]) == \
                       sorted([sorted(x) if isinstance(x, list) else x for x in actual])
            except TypeError:
                pass
        # For find_words (list of strings) - sort both
        if expected and isinstance(expected[0], str) and actual and isinstance(actual[0], str):
            return sorted(expected) == sorted(actual)
    # Float comparison
    if isinstance(expected, float) and isinstance(actual, (int, float)):
        return abs(expected - float(actual)) < 1e-6
    return expected == actual


def _validate_topological_order(result, num_courses, prerequisites) -> bool:
    """Special validator for topological sort - multiple valid orderings."""
    if not result and not prerequisites:
        return sorted(result) == list(range(num_courses))
    if len(result) != num_courses:
        return len(result) == 0 and _has_cycle(num_courses, prerequisites)
    if set(result) != set(range(num_courses)):
        return False
    pos = {v: i for i, v in enumerate(result)}
    for a, b in prerequisites:
        if pos[b] >= pos[a]:
            return False
    return True


def _has_cycle(num_courses, prerequisites) -> bool:
    from collections import defaultdict, deque
    graph = defaultdict(list)
    in_degree = [0] * num_courses
    for a, b in prerequisites:
        graph[b].append(a)
        in_degree[a] += 1
    queue = deque(i for i in range(num_courses) if in_degree[i] == 0)
    count = 0
    while queue:
        node = queue.popleft()
        count += 1
        for nei in graph[node]:
            in_degree[nei] -= 1
            if in_degree[nei] == 0:
                queue.append(nei)
    return count != num_courses


def run_test_case(func, problem: Problem, tc: TestCase) -> TestResult:
    """Run a single test case against the user's solution."""
    start = time.perf_counter()
    try:
        # Make deep copies to avoid mutation issues
        import copy
        inputs = copy.deepcopy(tc.inputs)
        actual = func(**inputs)
        elapsed_ms = (time.perf_counter() - start) * 1000

        # Special validation for topological sort
        if problem.id == "graph_01":
            passed = _validate_topological_order(
                actual,
                tc.inputs["numCourses"],
                tc.inputs["prerequisites"],
            )
        else:
            passed = _values_equal(tc.expected, actual)

        return TestResult(
            test_case=tc,
            passed=passed,
            actual_output=actual,
            execution_time_ms=elapsed_ms,
        )
    except Exception as e:
        elapsed_ms = (time.perf_counter() - start) * 1000
        return TestResult(
            test_case=tc,
            passed=False,
            error=f"{type(e).__name__}: {e}",
            execution_time_ms=elapsed_ms,
        )


def run_problem(problem: Problem) -> ProblemResult:
    """Run all test cases for a problem. Returns the result."""
    func = load_solution_function(problem)
    if func is None:
        return ProblemResult(problem=problem, skipped=True, error="No solution file or function found")

    result = ProblemResult(problem=problem)
    for tc in problem.test_cases:
        tr = run_test_case(func, problem, tc)
        result.test_results.append(tr)

    return result


def format_result(result: ProblemResult) -> str:
    """Format a problem result for display."""
    lines = []
    p = result.problem

    if result.skipped:
        lines.append(f"  SKIPPED - {result.error}")
        return "\n".join(lines)

    status = "PASS" if result.all_passed else "FAIL"
    lines.append(f"  [{status}] {result.tests_passed}/{result.tests_total} test cases passed")

    for i, tr in enumerate(result.test_results):
        icon = "[+]" if tr.passed else "[-]"
        desc = tr.test_case.description or f"Test {i+1}"
        lines.append(f"    {icon} {desc} ({tr.execution_time_ms:.1f}ms)")
        if not tr.passed:
            if tr.error:
                lines.append(f"        Error: {tr.error}")
            else:
                lines.append(f"        Expected: {tr.test_case.expected}")
                lines.append(f"        Got:      {tr.actual_output}")

    return "\n".join(lines)
