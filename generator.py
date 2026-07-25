#!/usr/bin/env python3
"""
Offline LeetCode-style problem generator.

Procedurally creates parameterized problems with known-correct reference
solutions and test cases. No network. Seeded RNG for reproducibility.
"""

from __future__ import annotations

import random
import textwrap
from dataclasses import dataclass, field
from typing import Any, Callable


@dataclass
class GeneratedProblem:
    id: str
    title: str
    pattern: str
    difficulty: str
    description: str
    function_name: str
    signature: str
    starter_code: str
    reference: Callable[..., Any]
    test_cases: list[dict[str, Any]] = field(default_factory=list)
    hints: list[str] = field(default_factory=list)
    mental_model: str = ""
    seed: int = 0

    def run_tests(self, fn: Callable[..., Any]) -> tuple[int, int, list[str]]:
        passed = 0
        logs: list[str] = []
        for i, tc in enumerate(self.test_cases, 1):
            args = tc["args"]
            expected = tc["expected"]
            try:
                got = fn(*args) if not isinstance(args, dict) else fn(**args)
                ok = got == expected
            except Exception as exc:  # noqa: BLE001 — educational runner
                ok = False
                got = f"EXC:{type(exc).__name__}: {exc}"
            if ok:
                passed += 1
            else:
                logs.append(f"  FAIL case {i}: args={args!r} expected={expected!r} got={got!r}")
        return passed, len(self.test_cases), logs


def _seeded(seed: int | None) -> random.Random:
    return random.Random(seed if seed is not None else random.randint(1, 10**9))


# ----- Reference solvers (also used to build expected outputs) -----

def _two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i
    return []


def _max_subarray(nums: list[int]) -> int:
    best = cur = nums[0]
    for n in nums[1:]:
        cur = max(n, cur + n)
        best = max(best, cur)
    return best


def _binary_search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1


def _climb_stairs(n: int) -> int:
    if n <= 2:
        return n
    a, b = 1, 2
    for _ in range(3, n + 1):
        a, b = b, a + b
    return b


def _is_valid_paren(s: str) -> bool:
    stack: list[str] = []
    pairs = {")": "(", "]": "[", "}": "{"}
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        elif not stack or stack[-1] != pairs.get(ch):
            return False
        else:
            stack.pop()
    return not stack


def _longest_unique(s: str) -> int:
    last: dict[str, int] = {}
    left = best = 0
    for i, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = i
        best = max(best, i - left + 1)
    return best


def _merge_intervals(intervals: list[list[int]]) -> list[list[int]]:
    if not intervals:
        return []
    intervals = sorted(intervals)
    out = [intervals[0][:]]
    for s, e in intervals[1:]:
        if s <= out[-1][1]:
            out[-1][1] = max(out[-1][1], e)
        else:
            out.append([s, e])
    return out


def _level_order(n: int, edges: list[list[int]]) -> list[int]:
    """BFS order from 0 on an undirected tree/graph."""
    from collections import defaultdict, deque
    g: dict[int, list[int]] = defaultdict(list)
    for a, b in edges:
        g[a].append(b)
        g[b].append(a)
    for v in g:
        g[v].sort()
    seen = {0}
    q = deque([0])
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in g[u]:
            if v not in seen:
                seen.add(v)
                q.append(v)
    return order


def _knapsack(weights: list[int], values: list[int], capacity: int) -> int:
    n = len(weights)
    dp = [0] * (capacity + 1)
    for i in range(n):
        w, v = weights[i], values[i]
        for c in range(capacity, w - 1, -1):
            dp[c] = max(dp[c], dp[c - w] + v)
    return dp[capacity]


def _prefix_sum_range(nums: list[int], queries: list[list[int]]) -> list[int]:
    pref = [0]
    for n in nums:
        pref.append(pref[-1] + n)
    return [pref[r + 1] - pref[l] for l, r in queries]


# ----- Generators -----

def gen_two_sum(rng: random.Random, seed: int) -> GeneratedProblem:
    n = rng.randint(4, 10)
    nums = [rng.randint(1, 40) for _ in range(n)]
    i, j = sorted(rng.sample(range(n), 2))
    target = nums[i] + nums[j]
    tests = []
    for _ in range(5):
        arr = [rng.randint(1, 50) for _ in range(rng.randint(4, 9))]
        a, b = sorted(rng.sample(range(len(arr)), 2))
        t = arr[a] + arr[b]
        tests.append({"args": (arr[:], t), "expected": _two_sum(arr, t)})
    tests.insert(0, {"args": (nums[:], target), "expected": _two_sum(nums, target)})
    return GeneratedProblem(
        id=f"gen_two_sum_{seed}",
        title="Two Sum (generated)",
        pattern="hash_map",
        difficulty="easy",
        description=(
            f"Given nums and target, return indices of two numbers that add to target.\n"
            f"Example seed data: nums={nums}, target={target}."
        ),
        function_name="two_sum",
        signature="def two_sum(nums: list[int], target: int) -> list[int]:",
        starter_code=textwrap.dedent("""\
            def two_sum(nums: list[int], target: int) -> list[int]:
                # hash complement -> index
                ...
        """),
        reference=_two_sum,
        test_cases=tests,
        hints=["Store value→index while scanning.", "Look for target - nums[i] in the map."],
        mental_model="Hash map turns 'find complement' into O(1) average lookups — like an address decoder.",
        seed=seed,
    )


def gen_kadane(rng: random.Random, seed: int) -> GeneratedProblem:
    tests = []
    for _ in range(6):
        arr = [rng.randint(-12, 12) for _ in range(rng.randint(5, 12))]
        tests.append({"args": (arr[:],), "expected": _max_subarray(arr)})
    return GeneratedProblem(
        id=f"gen_kadane_{seed}",
        title="Maximum Subarray (Kadane)",
        pattern="dp",
        difficulty="medium",
        description="Find the contiguous subarray with the largest sum (Kadane).",
        function_name="max_subarray",
        signature="def max_subarray(nums: list[int]) -> int:",
        starter_code=textwrap.dedent("""\
            def max_subarray(nums: list[int]) -> int:
                # track best ending here vs best overall
                ...
        """),
        reference=_max_subarray,
        test_cases=tests,
        hints=["At each index: extend previous sum or start fresh.", "Keep a global max."],
        mental_model="DP as a one-tap FIR filter: state is 'best ending here'.",
        seed=seed,
    )


def gen_binary_search(rng: random.Random, seed: int) -> GeneratedProblem:
    tests = []
    for _ in range(6):
        arr = sorted({rng.randint(0, 80) for _ in range(rng.randint(6, 14))})
        if rng.random() < 0.7:
            target = rng.choice(arr)
        else:
            target = rng.randint(0, 80)
        tests.append({"args": (arr[:], target), "expected": _binary_search(arr, target)})
    return GeneratedProblem(
        id=f"gen_bs_{seed}",
        title="Binary Search (generated)",
        pattern="binary_search",
        difficulty="easy",
        description="Return index of target in sorted unique array, or -1.",
        function_name="binary_search",
        signature="def binary_search(nums: list[int], target: int) -> int:",
        starter_code=textwrap.dedent("""\
            def binary_search(nums: list[int], target: int) -> int:
                ...
        """),
        reference=_binary_search,
        test_cases=tests,
        hints=["Maintain inclusive [lo, hi].", "mid = (lo+hi)//2; shrink the half that cannot contain target."],
        mental_model="Binary search is successive approximation on a sorted domain — like a binary-weighted DAC search.",
        seed=seed,
    )


def gen_climb(rng: random.Random, seed: int) -> GeneratedProblem:
    tests = [{"args": (n,), "expected": _climb_stairs(n)} for n in [rng.randint(2, 20) for _ in range(6)]]
    return GeneratedProblem(
        id=f"gen_climb_{seed}",
        title="Climbing Stairs",
        pattern="dp",
        difficulty="easy",
        description="n stairs; 1 or 2 steps. How many distinct ways?",
        function_name="climb_stairs",
        signature="def climb_stairs(n: int) -> int:",
        starter_code="def climb_stairs(n: int) -> int:\n    ...\n",
        reference=_climb_stairs,
        test_cases=tests,
        hints=["ways(n) = ways(n-1) + ways(n-2)", "Fibonacci in disguise."],
        mental_model="Optimal substructure: last step was 1 or 2 — classic 1D DP recurrence.",
        seed=seed,
    )


def gen_parens(rng: random.Random, seed: int) -> GeneratedProblem:
    def rand_str() -> str:
        if rng.random() < 0.5:
            # valid-ish builder
            s = []
            open_count = 0
            for _ in range(rng.randint(2, 8)):
                if open_count == 0 or (rng.random() < 0.55 and open_count < 4):
                    s.append(rng.choice("([{"))
                    open_count += 1
                else:
                    opener = s[::-1]
                    # close last open type roughly
                    mapping = {"(": ")", "[": "]", "{": "}"}
                    # find last unmatched roughly by stack simulation
                    stack = []
                    for ch in s:
                        if ch in "([{":
                            stack.append(ch)
                        elif stack:
                            stack.pop()
                    if stack:
                        s.append(mapping[stack[-1]])
                        open_count = max(0, open_count - 1)
            # close remaining
            stack = []
            for ch in s:
                if ch in "([{":
                    stack.append(ch)
                elif stack:
                    stack.pop()
            mapping = {"(": ")", "[": "]", "{": "}"}
            while stack:
                s.append(mapping[stack.pop()])
            return "".join(s)
        return "".join(rng.choice("()[]{}") for _ in range(rng.randint(2, 10)))

    tests = []
    for _ in range(8):
        s = rand_str()
        tests.append({"args": (s,), "expected": _is_valid_paren(s)})
    return GeneratedProblem(
        id=f"gen_paren_{seed}",
        title="Valid Parentheses",
        pattern="monotonic_stack",
        difficulty="easy",
        description="Return True iff brackets are valid and properly nested.",
        function_name="is_valid",
        signature="def is_valid(s: str) -> bool:",
        starter_code="def is_valid(s: str) -> bool:\n    ...\n",
        reference=_is_valid_paren,
        test_cases=tests,
        hints=["Stack stores expected closers / openers.", "Mismatch or leftover opens → False."],
        mental_model="Stack matches nested structure — LIFO like procedure call depth.",
        seed=seed,
    )


def gen_longest_unique(rng: random.Random, seed: int) -> GeneratedProblem:
    alphabet = "abcdefghij"
    tests = []
    for _ in range(6):
        s = "".join(rng.choice(alphabet) for _ in range(rng.randint(5, 18)))
        tests.append({"args": (s,), "expected": _longest_unique(s)})
    return GeneratedProblem(
        id=f"gen_sw_{seed}",
        title="Longest Substring Without Repeating",
        pattern="sliding_window",
        difficulty="medium",
        description="Length of longest substring with all unique characters.",
        function_name="length_of_longest_substring",
        signature="def length_of_longest_substring(s: str) -> int:",
        starter_code="def length_of_longest_substring(s: str) -> int:\n    ...\n",
        reference=_longest_unique,
        test_cases=tests,
        hints=["Sliding window + last-seen index map.", "When duplicate inside window, move left past it."],
        mental_model="Window expands/contracts to maintain the invariant 'all unique'.",
        seed=seed,
    )


def gen_merge(rng: random.Random, seed: int) -> GeneratedProblem:
    tests = []
    for _ in range(5):
        intervals = []
        for _ in range(rng.randint(3, 7)):
            s = rng.randint(0, 30)
            e = s + rng.randint(1, 10)
            intervals.append([s, e])
        tests.append({"args": (intervals,), "expected": _merge_intervals(intervals)})
    return GeneratedProblem(
        id=f"gen_merge_{seed}",
        title="Merge Intervals",
        pattern="greedy",
        difficulty="medium",
        description="Merge all overlapping intervals.",
        function_name="merge",
        signature="def merge(intervals: list[list[int]]) -> list[list[int]]:",
        starter_code="def merge(intervals: list[list[int]]) -> list[list[int]]:\n    ...\n",
        reference=_merge_intervals,
        test_cases=tests,
        hints=["Sort by start.", "If next starts before current end, extend end."],
        mental_model="Sort creates a total order so a single left-to-right sweep is enough.",
        seed=seed,
    )


def gen_bfs(rng: random.Random, seed: int) -> GeneratedProblem:
    tests = []
    for _ in range(4):
        n = rng.randint(4, 7)
        edges = []
        # build a random tree then maybe one extra edge
        for i in range(1, n):
            edges.append([rng.randint(0, i - 1), i])
        order_nodes = list(range(n))
        rng.shuffle(order_nodes)
        # keep edges on 0..n-1 labels as built
        tests.append({"args": (n, [e[:] for e in edges]), "expected": _level_order(n, edges)})
    return GeneratedProblem(
        id=f"gen_bfs_{seed}",
        title="BFS Order from Node 0",
        pattern="bfs",
        difficulty="medium",
        description="Undirected graph as n + edges. Return BFS visit order from 0 (neighbors ascending).",
        function_name="bfs_order",
        signature="def bfs_order(n: int, edges: list[list[int]]) -> list[int]:",
        starter_code="def bfs_order(n: int, edges: list[list[int]]) -> list[int]:\n    ...\n",
        reference=_level_order,
        test_cases=tests,
        hints=["Adjacency list + queue + seen set.", "Sort neighbors for deterministic order."],
        mental_model="BFS explores by distance rings — like a wavefront on a mesh.",
        seed=seed,
    )


def gen_knapsack(rng: random.Random, seed: int) -> GeneratedProblem:
    tests = []
    for _ in range(5):
        n = rng.randint(3, 6)
        weights = [rng.randint(1, 8) for _ in range(n)]
        values = [rng.randint(1, 15) for _ in range(n)]
        cap = rng.randint(5, 18)
        tests.append({"args": (weights[:], values[:], cap), "expected": _knapsack(weights, values, cap)})
    return GeneratedProblem(
        id=f"gen_ks_{seed}",
        title="0/1 Knapsack",
        pattern="dp",
        difficulty="medium",
        description="Max value with capacity; each item once.",
        function_name="knapsack",
        signature="def knapsack(weights: list[int], values: list[int], capacity: int) -> int:",
        starter_code="def knapsack(weights: list[int], values: list[int], capacity: int) -> int:\n    ...\n",
        reference=_knapsack,
        test_cases=tests,
        hints=["1D DP over capacity; iterate capacity downward.", "Include vs exclude each item."],
        mental_model="Capacity is a constrained resource bus; DP fills feasible loadings.",
        seed=seed,
    )


def gen_prefix(rng: random.Random, seed: int) -> GeneratedProblem:
    tests = []
    for _ in range(5):
        nums = [rng.randint(-5, 15) for _ in range(rng.randint(5, 10))]
        q = []
        for _ in range(rng.randint(2, 5)):
            l = rng.randint(0, len(nums) - 1)
            r = rng.randint(l, len(nums) - 1)
            q.append([l, r])
        tests.append({"args": (nums[:], q), "expected": _prefix_sum_range(nums, q)})
    return GeneratedProblem(
        id=f"gen_prefix_{seed}",
        title="Range Sum Queries",
        pattern="prefix_sum",
        difficulty="easy",
        description="Answer multiple [l,r] inclusive range sums efficiently.",
        function_name="range_sums",
        signature="def range_sums(nums: list[int], queries: list[list[int]]) -> list[int]:",
        starter_code="def range_sums(nums: list[int], queries: list[list[int]]) -> list[int]:\n    ...\n",
        reference=_prefix_sum_range,
        test_cases=tests,
        hints=["Build prefix where pref[i] = sum(nums[:i]).", "sum(l..r) = pref[r+1]-pref[l]."],
        mental_model="Prefix sums are like integrating a signal then differencing for windows.",
        seed=seed,
    )


def _min_eating_speed(piles: list[int], h: int) -> int:
    def can(k: int) -> bool:
        return sum((p + k - 1) // k for p in piles) <= h

    lo, hi = 1, max(piles)
    ans = hi
    while lo <= hi:
        mid = (lo + hi) // 2
        if can(mid):
            ans = mid
            hi = mid - 1
        else:
            lo = mid + 1
    return ans


def gen_binary_search_answer(rng: random.Random, seed: int) -> GeneratedProblem:
    tests = []
    for _ in range(5):
        piles = [rng.randint(1, 20) for _ in range(rng.randint(3, 6))]
        h = rng.randint(len(piles), sum(piles))
        tests.append({"args": (piles[:], h), "expected": _min_eating_speed(piles, h)})
    return GeneratedProblem(
        id=f"gen_bsa_{seed}",
        title="Koko Eating Bananas",
        pattern="binary_search_answer",
        difficulty="medium",
        description="Minimum integer eating speed k to finish all piles within h hours.",
        function_name="min_eating_speed",
        signature="def min_eating_speed(piles: list[int], h: int) -> int:",
        starter_code="def min_eating_speed(piles: list[int], h: int) -> int:\n    ...\n",
        reference=_min_eating_speed,
        test_cases=tests,
        hints=["Binary search k in [1, max(piles)].", "can(k) = sum(ceil(p/k)) <= h."],
        mental_model="Binary search the answer on a monotone feasibility line.",
        seed=seed,
    )


def _max_concurrent(intervals: list[list[int]]) -> int:
    events: list[tuple[int, int]] = []
    for s, e in intervals:
        events.append((s, 1))
        events.append((e, -1))
    events.sort(key=lambda x: (x[0], x[1]))
    cur = best = 0
    for _, d in events:
        cur += d
        best = max(best, cur)
    return best


def gen_sweep_line(rng: random.Random, seed: int) -> GeneratedProblem:
    tests = []
    for _ in range(5):
        intervals = []
        for _i in range(rng.randint(3, 7)):
            s = rng.randint(0, 20)
            e = s + rng.randint(1, 8)
            intervals.append([s, e])
        tests.append({"args": ([iv[:] for iv in intervals],), "expected": _max_concurrent(intervals)})
    return GeneratedProblem(
        id=f"gen_sweep_{seed}",
        title="Max Concurrent Intervals",
        pattern="sweep_line",
        difficulty="medium",
        description="Max number of overlapping half-open intervals [start, end).",
        function_name="max_concurrent",
        signature="def max_concurrent(intervals: list[list[int]]) -> int:",
        starter_code="def max_concurrent(intervals: list[list[int]]) -> int:\n    ...\n",
        reference=_max_concurrent,
        test_cases=tests,
        hints=["Event sort: +1 start, -1 end.", "Ends before starts at same t."],
        mental_model="Sweep the timeline; active count is load.",
        seed=seed,
    )


def _reverse_list_values(vals: list[int]) -> list[int]:
    return list(reversed(vals))


def gen_linked_list(rng: random.Random, seed: int) -> GeneratedProblem:
    tests = []
    for _ in range(6):
        vals = [rng.randint(0, 40) for _ in range(rng.randint(2, 8))]
        tests.append({"args": (vals[:],), "expected": _reverse_list_values(vals)})
    return GeneratedProblem(
        id=f"gen_ll_{seed}",
        title="Reverse Linked List Values",
        pattern="linked_list",
        difficulty="easy",
        description="Reverse a list of values (practice prev/cur/next mental model).",
        function_name="reverse_list_values",
        signature="def reverse_list_values(vals: list[int]) -> list[int]:",
        starter_code="def reverse_list_values(vals: list[int]) -> list[int]:\n    ...\n",
        reference=_reverse_list_values,
        test_cases=tests,
        hints=["Build ListNode chain, reverse with prev/cur/nxt, collect values."],
        mental_model="Rewire next pointers; never lose the forward link.",
        seed=seed,
    )


def _single_number(nums: list[int]) -> int:
    x = 0
    for n in nums:
        x ^= n
    return x


def gen_bit_manipulation(rng: random.Random, seed: int) -> GeneratedProblem:
    tests = []
    for _ in range(6):
        pairs = [rng.randint(1, 30) for _ in range(rng.randint(3, 6))]
        unique = rng.randint(40, 60)
        nums = []
        for p in pairs:
            nums.extend([p, p])
        nums.append(unique)
        rng.shuffle(nums)
        tests.append({"args": (nums[:],), "expected": _single_number(nums)})
    return GeneratedProblem(
        id=f"gen_bit_{seed}",
        title="Single Number",
        pattern="bit_manipulation",
        difficulty="easy",
        description="Every element appears twice except one — find it with XOR.",
        function_name="single_number",
        signature="def single_number(nums: list[int]) -> int:",
        starter_code="def single_number(nums: list[int]) -> int:\n    ...\n",
        reference=_single_number,
        test_cases=tests,
        hints=["XOR everything; pairs cancel."],
        mental_model="XOR is its own inverse.",
        seed=seed,
    )


def _apply_range_updates(n: int, updates: list[list[int]]) -> list[int]:
    diff = [0] * (n + 1)
    for L, R, val in updates:
        diff[L] += val
        if R + 1 < len(diff):
            diff[R + 1] -= val
    out = [0] * n
    run = 0
    for i in range(n):
        run += diff[i]
        out[i] = run
    return out


def gen_difference_array(rng: random.Random, seed: int) -> GeneratedProblem:
    tests = []
    for _ in range(5):
        n = rng.randint(5, 10)
        updates = []
        for _u in range(rng.randint(2, 5)):
            L = rng.randint(0, n - 1)
            R = rng.randint(L, n - 1)
            updates.append([L, R, rng.randint(1, 5)])
        tests.append({"args": (n, [u[:] for u in updates]), "expected": _apply_range_updates(n, updates)})
    return GeneratedProblem(
        id=f"gen_diff_{seed}",
        title="Range Updates",
        pattern="difference_array",
        difficulty="medium",
        description="Apply many inclusive [L,R]+=val updates on a zero array; return final array.",
        function_name="apply_range_updates",
        signature="def apply_range_updates(n: int, updates: list[list[int]]) -> list[int]:",
        starter_code="def apply_range_updates(n: int, updates: list[list[int]]) -> list[int]:\n    ...\n",
        reference=_apply_range_updates,
        test_cases=tests,
        hints=["diff[L]+=val; diff[R+1]-=val; prefix reconstruct."],
        mental_model="Encode range writes as two point updates; integrate once.",
        seed=seed,
    )


GENERATORS: dict[str, Callable[[random.Random, int], GeneratedProblem]] = {
    "hash_map": gen_two_sum,
    "two_sum": gen_two_sum,
    "dp": gen_kadane,
    "kadane": gen_kadane,
    "binary_search": gen_binary_search,
    "climb": gen_climb,
    "stack": gen_parens,
    "parentheses": gen_parens,
    "sliding_window": gen_longest_unique,
    "greedy": gen_merge,
    "bfs": gen_bfs,
    "knapsack": gen_knapsack,
    "prefix_sum": gen_prefix,
    "binary_search_answer": gen_binary_search_answer,
    "sweep_line": gen_sweep_line,
    "linked_list": gen_linked_list,
    "bit_manipulation": gen_bit_manipulation,
    "difference_array": gen_difference_array,
}

PATTERN_ROTATION = [
    "hash_map", "dp", "binary_search", "climb", "stack",
    "sliding_window", "greedy", "bfs", "knapsack", "prefix_sum",
    "binary_search_answer", "sweep_line", "linked_list",
    "bit_manipulation", "difference_array",
]


def list_generator_patterns() -> list[str]:
    return sorted(set(PATTERN_ROTATION))


def generate_problem(pattern: str | None = None, seed: int | None = None) -> GeneratedProblem:
    seed = seed if seed is not None else random.randint(1, 10**9)
    rng = _seeded(seed)
    if pattern is None:
        pattern = PATTERN_ROTATION[seed % len(PATTERN_ROTATION)]
    key = pattern.lower().replace("-", "_").replace(" ", "_")
    # allow friendly aliases
    aliases = {
        "two_pointers": "sliding_window",
        "heap": "knapsack",
        "dfs": "bfs",
        "monotonic_stack": "stack",
        "dynamic_programming": "dp",
    }
    key = aliases.get(key, key)
    if key not in GENERATORS:
        # fuzzy: match substring
        for k in GENERATORS:
            if key in k or k in key:
                key = k
                break
        else:
            key = PATTERN_ROTATION[seed % len(PATTERN_ROTATION)]
    return GENERATORS[key](rng, seed)


def generate_batch(n: int = 5, pattern: str | None = None, seed: int | None = None) -> list[GeneratedProblem]:
    base = seed if seed is not None else random.randint(1, 10**9)
    return [generate_problem(pattern=pattern, seed=base + i * 9973) for i in range(n)]


def format_problem(p: GeneratedProblem, show_tests: int = 2) -> str:
    lines = [
        "",
        "=" * 64,
        f"  {p.title}  [{p.difficulty}]  pattern={p.pattern}",
        f"  id={p.id}  seed={p.seed}",
        "=" * 64,
        "",
        textwrap.fill(p.description, width=70),
        "",
        f"  {p.signature}",
        "",
        "  Mental model:",
        f"    {p.mental_model}",
        "",
        "  Starter:",
        textwrap.indent(p.starter_code.rstrip(), "    "),
        "",
        "  Sample tests:",
    ]
    for i, tc in enumerate(p.test_cases[:show_tests], 1):
        lines.append(f"    {i}. args={tc['args']!r} -> {tc['expected']!r}")
    lines.append("")
    lines.append("  Solve in solutions/generated/<id>.py then: python main.py --drill-check <id>")
    lines.append("")
    return "\n".join(lines)
