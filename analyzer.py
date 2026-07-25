"""
Gap analyzer: processes assessment results and generates a personalized study plan.
"""

import json
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from problems import Problem, get_categories
from runner import ProblemResult

RESULTS_DIR = Path(__file__).parent / "results"


@dataclass
class CategoryScore:
    category: str
    problems_attempted: int
    problems_solved: int  # all tests passed
    total_tests: int
    tests_passed: int
    avg_time_minutes: float
    problems: list[ProblemResult] = field(default_factory=list)

    @property
    def solve_rate(self) -> float:
        if self.problems_attempted == 0:
            return 0.0
        return self.problems_solved / self.problems_attempted

    @property
    def test_pass_rate(self) -> float:
        if self.total_tests == 0:
            return 0.0
        return self.tests_passed / self.total_tests

    @property
    def strength_level(self) -> str:
        rate = self.solve_rate
        if rate >= 0.8:
            return "strong"
        elif rate >= 0.5:
            return "moderate"
        else:
            return "weak"


@dataclass
class GapReport:
    timestamp: str
    overall_score: float
    overall_solve_rate: float
    category_scores: list[CategoryScore]
    weak_areas: list[str]
    moderate_areas: list[str]
    strong_areas: list[str]
    skipped_categories: list[str]
    failed_problems: list[dict]
    study_plan: list[dict]


STUDY_RESOURCES = {
    "Arrays & Strings": {
        "concepts": ["Hash maps for O(1) lookup", "Prefix sums", "In-place array manipulation"],
        "practice_problems": [
            "Two Sum", "3Sum", "Group Anagrams", "Longest Consecutive Sequence",
            "Encode and Decode Strings", "Valid Anagram",
        ],
        "study_tips": [
            "Master the sliding window pattern - fixed and variable width.",
            "Practice prefix sum arrays for range queries.",
            "Know when to use sorting vs. hash maps for deduplication.",
        ],
    },
    "Sliding Window & Two Pointers": {
        "concepts": ["Fixed-size window", "Variable-size window", "Two-pointer convergence"],
        "practice_problems": [
            "Best Time to Buy and Sell Stock", "Longest Repeating Character Replacement",
            "3Sum", "Valid Palindrome", "Subarray Product Less Than K",
        ],
        "study_tips": [
            "Identify whether the window is fixed or variable size.",
            "For variable window: expand to satisfy, contract to minimize.",
            "Two pointers from opposite ends work when the array has structure (sorted, etc.).",
        ],
    },
    "Trees": {
        "concepts": ["DFS (preorder, inorder, postorder)", "BFS / level-order", "BST properties"],
        "practice_problems": [
            "Validate BST", "Invert Binary Tree", "Maximum Depth",
            "Binary Tree Level Order Traversal", "Subtree of Another Tree",
            "Construct Tree from Preorder and Inorder",
        ],
        "study_tips": [
            "Most tree problems are solved recursively - identify the subproblem.",
            "Practice converting between recursive and iterative approaches.",
            "Understand how to serialize/deserialize trees in different traversal orders.",
        ],
    },
    "Graphs": {
        "concepts": ["BFS/DFS traversal", "Topological sort", "Shortest path (Dijkstra, Bellman-Ford)",
                     "Union Find", "Cycle detection"],
        "practice_problems": [
            "Clone Graph", "Pacific Atlantic Water Flow", "Graph Valid Tree",
            "Redundant Connection", "Word Ladder",
        ],
        "study_tips": [
            "Always clarify: directed vs undirected, weighted vs unweighted, cyclic vs acyclic.",
            "BFS = shortest path in unweighted graphs. Dijkstra = weighted.",
            "Topological sort: know both Kahn's (BFS) and DFS approaches.",
            "Practice building adjacency lists from edge lists.",
        ],
    },
    "Dynamic Programming": {
        "concepts": ["1D DP", "2D DP", "State compression", "Interval DP", "DP on strings"],
        "practice_problems": [
            "Climbing Stairs", "House Robber I & II", "Coin Change",
            "Longest Common Subsequence", "Unique Paths",
            "Decode Ways", "Partition Equal Subset Sum",
        ],
        "study_tips": [
            "Start by defining the state clearly: what does dp[i] represent?",
            "Write the recurrence relation before coding.",
            "Check if you can optimize space (often 2D -> 1D).",
            "Practice identifying DP vs. greedy - can you make a local optimal choice?",
        ],
    },
    "Stacks & Queues": {
        "concepts": ["Monotonic stack", "Stack for expression evaluation", "Deque for sliding window max"],
        "practice_problems": [
            "Valid Parentheses", "Daily Temperatures", "Next Greater Element",
            "Min Stack", "Evaluate Reverse Polish Notation",
        ],
        "study_tips": [
            "Monotonic stacks are key for 'next greater/smaller element' patterns.",
            "Practice recognizing when a stack models nested structure (parentheses, HTML, etc.).",
            "Understand how a deque can maintain a sliding window maximum in O(1).",
        ],
    },
    "Heaps & Priority Queues": {
        "concepts": ["Min/max heap", "Two-heap pattern", "Top-K pattern", "Merge K sorted"],
        "practice_problems": [
            "Kth Largest Element", "Top K Frequent Elements",
            "Find K Closest Points to Origin", "Reorganize String",
        ],
        "study_tips": [
            "Python: use heapq (min-heap). Negate values for max-heap.",
            "Two-heap pattern: split data into lower and upper halves for median.",
            "For K-way merge, always think heap.",
        ],
    },
    "Backtracking": {
        "concepts": ["Permutations", "Combinations", "Subsets", "Constraint satisfaction", "Pruning"],
        "practice_problems": [
            "Subsets", "Permutations", "Combination Sum I & II",
            "Palindrome Partitioning", "Letter Combinations of Phone Number",
        ],
        "study_tips": [
            "Template: choose -> explore -> unchoose.",
            "Identify what constitutes a 'choice' at each step.",
            "Pruning is critical for performance - skip invalid branches early.",
        ],
    },
    "Greedy": {
        "concepts": ["Interval scheduling", "Activity selection", "Greedy choice property"],
        "practice_problems": [
            "Jump Game", "Gas Station", "Hand of Straights",
            "Merge Triplets to Form Target", "Non-overlapping Intervals",
        ],
        "study_tips": [
            "Prove the greedy choice is safe: making the local optimal leads to global optimal.",
            "Sorting is often the first step in greedy solutions.",
            "If greedy doesn't work, consider DP instead.",
        ],
    },
    "Linked Lists": {
        "concepts": ["Fast/slow pointers", "Reversal", "Merge", "Dummy head pattern"],
        "practice_problems": [
            "Reverse Linked List", "Merge Two Sorted Lists",
            "Linked List Cycle Detection", "Remove Nth Node From End",
            "Reorder List",
        ],
        "study_tips": [
            "Always use a dummy head to simplify edge cases.",
            "Fast/slow pointer: cycle detection, finding middle.",
            "Practice in-place reversal - it appears in many problems.",
        ],
    },
    "Union Find": {
        "concepts": ["Path compression", "Union by rank", "Connected components"],
        "practice_problems": [
            "Number of Connected Components", "Redundant Connection",
            "Graph Valid Tree", "Longest Consecutive Sequence (UF approach)",
        ],
        "study_tips": [
            "Template: find(x) with path compression, union(x,y) with rank.",
            "Use UF when you need to dynamically merge groups and query connectivity.",
            "Know when UF is better than BFS/DFS (online connectivity queries).",
        ],
    },
    "Tries": {
        "concepts": ["Prefix tree", "Word search with trie", "Autocomplete"],
        "practice_problems": [
            "Implement Trie", "Design Add and Search Words",
            "Search Suggestions System",
        ],
        "study_tips": [
            "Trie node: children dict + is_end flag.",
            "Combine with DFS/backtracking for board problems.",
            "Prune trie branches after finding words to optimize.",
        ],
    },
    "Binary Search": {
        "concepts": ["Search on answer", "Rotated arrays", "Bisect left/right"],
        "practice_problems": [
            "Search in Rotated Sorted Array", "Find Minimum in Rotated Array",
            "Koko Eating Bananas", "Search a 2D Matrix",
        ],
        "study_tips": [
            "Binary search on the answer space, not just sorted arrays.",
            "Get the loop invariant right: lo <= hi vs lo < hi.",
            "Practice: when to return lo vs hi vs mid.",
        ],
    },
    "Bit Manipulation": {
        "concepts": ["XOR properties", "Bit masks", "Brian Kernighan's algorithm"],
        "practice_problems": [
            "Single Number", "Number of 1 Bits", "Reverse Bits",
            "Missing Number", "Sum of Two Integers",
        ],
        "study_tips": [
            "x & (x-1) clears the lowest set bit.",
            "x ^ x = 0, x ^ 0 = x - useful for finding unique elements.",
            "Practice converting between iterative counting and DP approaches.",
        ],
    },
}


def analyze_results(results: list[ProblemResult]) -> GapReport:
    """Analyze assessment results and generate a gap report."""
    # Group by category
    category_map: dict[str, list[ProblemResult]] = {}
    for r in results:
        cat = r.problem.category
        if cat not in category_map:
            category_map[cat] = []
        category_map[cat].append(r)

    category_scores = []
    for cat in sorted(category_map.keys()):
        pr_list = category_map[cat]
        attempted = [r for r in pr_list if not r.skipped]
        solved = [r for r in attempted if r.all_passed]
        total_tests = sum(r.tests_total for r in attempted)
        tests_passed = sum(r.tests_passed for r in attempted)
        avg_time = sum(r.time_taken_minutes for r in attempted) / max(len(attempted), 1)

        cs = CategoryScore(
            category=cat,
            problems_attempted=len(attempted),
            problems_solved=len(solved),
            total_tests=total_tests,
            tests_passed=tests_passed,
            avg_time_minutes=avg_time,
            problems=pr_list,
        )
        category_scores.append(cs)

    # Classify areas
    weak = [cs.category for cs in category_scores if cs.strength_level == "weak"]
    moderate = [cs.category for cs in category_scores if cs.strength_level == "moderate"]
    strong = [cs.category for cs in category_scores if cs.strength_level == "strong"]

    all_attempted_cats = set(category_map.keys())
    all_cats = set(get_categories())
    skipped_cats = sorted(all_cats - all_attempted_cats)

    # Collect failed problems
    failed = []
    for r in results:
        if not r.skipped and not r.all_passed:
            failed.append({
                "id": r.problem.id,
                "title": r.problem.title,
                "category": r.problem.category,
                "score": f"{r.tests_passed}/{r.tests_total}",
                "tags": r.problem.tags,
            })

    # Overall
    total_attempted = sum(1 for r in results if not r.skipped)
    total_solved = sum(1 for r in results if not r.skipped and r.all_passed)
    overall_score = total_solved / max(total_attempted, 1)

    total_tests_all = sum(r.tests_total for r in results if not r.skipped)
    total_passed_all = sum(r.tests_passed for r in results if not r.skipped)
    overall_test_rate = total_passed_all / max(total_tests_all, 1)

    # Generate study plan
    study_plan = _generate_study_plan(category_scores, weak, moderate, skipped_cats)

    return GapReport(
        timestamp=datetime.now().isoformat(),
        overall_score=overall_test_rate,
        overall_solve_rate=overall_score,
        category_scores=category_scores,
        weak_areas=weak,
        moderate_areas=moderate,
        strong_areas=strong,
        skipped_categories=skipped_cats,
        failed_problems=failed,
        study_plan=study_plan,
    )


def _generate_study_plan(
    category_scores: list[CategoryScore],
    weak: list[str],
    moderate: list[str],
    skipped: list[str],
) -> list[dict]:
    """Generate a prioritized study plan."""
    plan = []

    # Priority 1: Weak areas
    for cat in weak:
        resources = STUDY_RESOURCES.get(cat, {})
        plan.append({
            "priority": "HIGH",
            "category": cat,
            "action": "Deep study required",
            "concepts_to_review": resources.get("concepts", []),
            "practice_problems": resources.get("practice_problems", []),
            "tips": resources.get("study_tips", []),
            "recommended_hours": 8,
        })

    # Priority 2: Skipped areas (unknown gaps)
    for cat in skipped:
        resources = STUDY_RESOURCES.get(cat, {})
        plan.append({
            "priority": "HIGH",
            "category": cat,
            "action": "Not assessed - could be a hidden gap",
            "concepts_to_review": resources.get("concepts", []),
            "practice_problems": resources.get("practice_problems", []),
            "tips": resources.get("study_tips", []),
            "recommended_hours": 6,
        })

    # Priority 3: Moderate areas
    for cat in moderate:
        resources = STUDY_RESOURCES.get(cat, {})
        plan.append({
            "priority": "MEDIUM",
            "category": cat,
            "action": "Targeted practice on weak spots",
            "concepts_to_review": resources.get("concepts", []),
            "practice_problems": resources.get("practice_problems", []),
            "tips": resources.get("study_tips", []),
            "recommended_hours": 4,
        })

    return plan


def format_report(report: GapReport) -> str:
    """Format the gap report for terminal display."""
    lines = []
    lines.append("=" * 70)
    lines.append("  ALGORITHM SKILLS GAP ANALYSIS REPORT")
    lines.append(f"  Generated: {report.timestamp}")
    lines.append("=" * 70)

    # Overall
    lines.append("")
    lines.append(f"  Overall Test Pass Rate:  {report.overall_score:.0%}")
    lines.append(f"  Overall Solve Rate:      {report.overall_solve_rate:.0%}")

    # Category breakdown
    lines.append("")
    lines.append("-" * 70)
    lines.append("  CATEGORY BREAKDOWN")
    lines.append("-" * 70)
    for cs in report.category_scores:
        level_tag = {"strong": "[STRONG]", "moderate": "[MODERATE]", "weak": "[WEAK  ]"}[cs.strength_level]
        lines.append(
            f"  {level_tag} {cs.category:<30} "
            f"Solved: {cs.problems_solved}/{cs.problems_attempted}  "
            f"Tests: {cs.tests_passed}/{cs.total_tests}"
        )

    if report.skipped_categories:
        lines.append("")
        lines.append("  NOT ASSESSED:")
        for cat in report.skipped_categories:
            lines.append(f"    - {cat}")

    # Gaps
    if report.weak_areas:
        lines.append("")
        lines.append("-" * 70)
        lines.append("  IDENTIFIED GAPS (Weak Areas)")
        lines.append("-" * 70)
        for cat in report.weak_areas:
            lines.append(f"    >> {cat}")

    # Failed problems
    if report.failed_problems:
        lines.append("")
        lines.append("-" * 70)
        lines.append("  FAILED / PARTIAL PROBLEMS")
        lines.append("-" * 70)
        for fp in report.failed_problems:
            lines.append(f"    [{fp['score']}] {fp['title']} ({fp['category']})")
            lines.append(f"           Tags: {', '.join(fp['tags'])}")

    # Study plan
    if report.study_plan:
        lines.append("")
        lines.append("=" * 70)
        lines.append("  STUDY PLAN")
        lines.append("=" * 70)
        for item in report.study_plan:
            lines.append("")
            lines.append(f"  [{item['priority']}] {item['category']}")
            lines.append(f"  Action: {item['action']}")
            if item["concepts_to_review"]:
                lines.append(f"  Key Concepts:")
                for c in item["concepts_to_review"]:
                    lines.append(f"    - {c}")
            if item["practice_problems"]:
                lines.append(f"  Practice Problems:")
                for p in item["practice_problems"]:
                    lines.append(f"    - {p}")
            if item["tips"]:
                lines.append(f"  Tips:")
                for t in item["tips"]:
                    lines.append(f"    * {t}")

    lines.append("")
    lines.append("=" * 70)
    return "\n".join(lines)


def save_report(report: GapReport):
    """Save the report as JSON for historical tracking."""
    RESULTS_DIR.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = RESULTS_DIR / f"report_{ts}.json"

    data = {
        "timestamp": report.timestamp,
        "overall_score": report.overall_score,
        "overall_solve_rate": report.overall_solve_rate,
        "weak_areas": report.weak_areas,
        "moderate_areas": report.moderate_areas,
        "strong_areas": report.strong_areas,
        "skipped_categories": report.skipped_categories,
        "categories": {},
        "failed_problems": report.failed_problems,
    }
    for cs in report.category_scores:
        data["categories"][cs.category] = {
            "attempted": cs.problems_attempted,
            "solved": cs.problems_solved,
            "total_tests": cs.total_tests,
            "tests_passed": cs.tests_passed,
            "strength": cs.strength_level,
        }

    filepath.write_text(json.dumps(data, indent=2))
    return filepath
