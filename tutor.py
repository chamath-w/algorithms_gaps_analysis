#!/usr/bin/env python3
"""
Offline tutoring agent for wrong answers.

Diagnoses likely misconception classes, refines mental models, and
prescribes the next drill — no network required.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Misconception:
    id: str
    title: str
    signals: tuple[str, ...]
    explanation: str
    ee_analogy: str
    repair: str
    next_drill: str


@dataclass
class TutorReport:
    topic: str
    user_answer: str
    correct_answer: str
    matched: list[Misconception]
    mental_model: str
    worked_example: str
    practice_prompt: str
    resources: list[str]


# Catalog of reusable misconception patterns
MISCONCEPTIONS: list[Misconception] = [
    Misconception(
        id="brute_not_window",
        title="Recomputing windows from scratch",
        signals=("sliding_window", "subarray", "substring", "O(n*k)"),
        explanation=(
            "You likely nested loops over every L..R. Sliding window keeps a running state "
            "and moves L/R by one, updating in O(1) amortized."
        ),
        ee_analogy="Like a moving average FIR filter: add the new sample, subtract the leaving sample — don't re-sum the buffer.",
        repair="Write the invariant: 'window [L,R] is always valid'. On expand add; on shrink remove.",
        next_drill="sliding_window",
    ),
    Misconception(
        id="dfs_vs_bfs",
        title="Depth-first where shortest path needed",
        signals=("bfs", "shortest", "level", "minimum steps"),
        explanation=(
            "DFS finds *a* path; unweighted shortest path needs BFS so the first time you reach "
            "a node is via a minimum number of edges."
        ),
        ee_analogy="BFS is a wavefront on a mesh; DFS is a depth probe down one trace first.",
        repair="If edges are unweighted (or equal weight), reach for a queue not a stack/recursion.",
        next_drill="bfs",
    ),
    Misconception(
        id="sort_then_two_pointers",
        title="Hashing when two pointers after sort suffice",
        signals=("two_pointers", "sorted", "pair sum"),
        explanation="On a sorted array, left/right pointers converge using comparison with target.",
        ee_analogy="Like balancing a bridge: move the heavy side or light side based on error sign.",
        repair="Ask: can I sort (or is it sorted)? Then two pointers often beat O(n) extra maps.",
        next_drill="two_sum",
    ),
    Misconception(
        id="dp_state_missing",
        title="Missing DP state / transition",
        signals=("dp", "optimal", "ways", "knapsack", "subarray sum"),
        explanation=(
            "DP fails when the state doesn't capture what future decisions need. "
            "Define dp[…] meaning in one sentence, then the recurrence."
        ),
        ee_analogy="State variables are like flip-flop bits — if a bit is missing, two different histories collide.",
        repair="Template: (1) state meaning (2) base cases (3) transition (4) answer location (5) iterate order.",
        next_drill="dp",
    ),
    Misconception(
        id="binary_search_bounds",
        title="Off-by-one / unbounded binary search",
        signals=("binary_search", "first true", "boundary", "monotone"),
        explanation="Binary search needs a monotone predicate and careful half-open vs inclusive bounds.",
        ee_analogy="Successive approximation: each bit decision must permanently discard an impossible region.",
        repair="Decide: search for index vs for answer value. Maintain lo/hi invariant in a comment.",
        next_drill="binary_search",
    ),
    Misconception(
        id="stack_nesting",
        title="Not using a stack for nesting/next-greater",
        signals=("stack", "parentheses", "next greater", "monotonic"),
        explanation="Nested or 'next greater element' structures are LIFO — a stack (often monotonic) is the natural model.",
        ee_analogy="Call stack / nested scopes: the most recent open context must close first.",
        repair="Push indices; pop while top violates monotonicity; the answer is the new top/sentinel.",
        next_drill="stack",
    ),
    Misconception(
        id="prefix_vs_loop",
        title="O(n) per query instead of prefix sums",
        signals=("prefix_sum", "range sum", "subarray sum equals"),
        explanation="Repeated range sums want prefix arrays (or fenwick/segment later).",
        ee_analogy="Integrate once, then any window is a difference of two samples.",
        repair="pref[0]=0; pref[i+1]=pref[i]+a[i]; sum(l..r)=pref[r+1]-pref[l].",
        next_drill="prefix_sum",
    ),
    Misconception(
        id="greedy_exchange",
        title="Greedy without exchange argument",
        signals=("greedy", "interval", "schedule"),
        explanation="Greedy works only with an exchange/optimal-substructure argument (e.g., earliest finish).",
        ee_analogy="Local gradient descent can miss global minima — greedy needs a proof it can't.",
        repair="Sort by the critical key; show swapping a conflicting choice never helps.",
        next_drill="greedy",
    ),
    Misconception(
        id="graph_model",
        title="Wrong graph model (directed/undirected/weights)",
        signals=("graph", "topo", "dijkstra", "union_find"),
        explanation="Many bugs are modeling bugs: directed vs undirected, weighted vs not, implicit grid graph.",
        ee_analogy="Schematic errors before SPICE — wrong netlist, right solver, wrong answer.",
        repair="Write: nodes=?, edges=?, directed?, weights?, start/goal. Then pick BFS/DFS/Dijkstra/UF/topo.",
        next_drill="bfs",
    ),
    Misconception(
        id="complexity_confuse",
        title="Confusing average vs worst-case or time vs space",
        signals=("complexity", "big-o", "hash"),
        explanation="Hash maps are average O(1); adversarial or tree maps differ. Recursion depth is space.",
        ee_analogy="Typical vs worst-case power draw — specs must say which.",
        repair="State best/avg/worst when relevant; count auxiliary structures and call stack.",
        next_drill="hash_map",
    ),
    Misconception(
        id="induction_gap",
        title="Proof/induction base case or inductive step gap",
        signals=("proof", "induction", "invariant", "discrete"),
        explanation="Induction needs explicit P(0)/P(1) and a step that assumes P(k) to show P(k+1).",
        ee_analogy="Like verifying a recursive filter: check t=0 initial condition, then one-step update.",
        repair="Write invariant that is true before loop; show each iteration preserves it; conclude at termination.",
        next_drill="logic",
    ),
    Misconception(
        id="p_vs_np",
        title="Mixing up P, NP, and NP-complete",
        signals=("complexity", "np", "theory"),
        explanation=(
            "P ⊆ NP. NP-complete are the hardest in NP under poly-time reductions. "
            "A poly-time algorithm for one NP-complete problem collapses NP into P — unknown."
        ),
        ee_analogy="NP-complete is like a universal hardest load — solve one efficiently and the whole class falls.",
        repair="Practice: show a problem is in NP (certificate checkable in poly time), then reduce a known NPC problem to it.",
        next_drill="complexity",
    ),
    Misconception(
        id="cache_locality",
        title="Ignoring memory hierarchy / locality",
        signals=("cache", "arch", "false sharing"),
        explanation="Big-O ignores constants that caches dominate. Row-major traversal and false sharing matter.",
        ee_analogy="Cache lines are like fetching a whole bus word — use nearby addresses or waste bandwidth.",
        repair="Traverse in storage order; pad shared atomics; think working set vs cache size.",
        next_drill="cache",
    ),
    Misconception(
        id="auth_confused",
        title="Authn vs authz / trusting the client",
        signals=("security", "auth", "jwt"),
        explanation="Authentication is who you are; authorization is what you may do. Never trust client-side checks alone.",
        ee_analogy="Badge reader (authn) vs room ACL (authz). A forged badge bypasses neither if the door checks the server.",
        repair="Verify tokens server-side; least privilege; threat-model trust boundaries.",
        next_drill="security",
    ),
]


PATTERN_MODELS: dict[str, str] = {
    "sliding_window": "Maintain a window invariant; expand R, shrink L; update O(1).",
    "two_pointers": "Sorted or opposite ends; move the pointer that can improve the objective.",
    "binary_search": "Monotone predicate over indices or answer space; discard half each step.",
    "binary_search_answer": "Binary search the numeric answer; can(mid) must be monotone.",
    "bfs": "Queue + distance rings; first hit = shortest unweighted path.",
    "dfs": "Stack/recursion for connectivity, path existence, topo via finish times.",
    "dp": "State meaning → recurrence → base → order → answer.",
    "greedy": "Sort by key + exchange argument that local choice is safe.",
    "backtracking": "Choose → explore → unchoose; prune when partial is doomed.",
    "heap": "Repeated min/max extraction; often O(n log k).",
    "monotonic_stack": "Pop while order violated; answers 'next greater/smaller'.",
    "union_find": "Dynamic connectivity; path compression + union by rank.",
    "trie": "Shared prefixes; O(len) insert/search.",
    "prefix_sum": "Precompute integrals; range = difference.",
    "difference_array": "Range writes as +val at L and -val at R+1; prefix reconstruct.",
    "hash_map": "Value→index or frequency; average O(1) lookup.",
    "dijkstra": "Priority queue relaxation for non-negative weighted shortest paths.",
    "topological_sort": "Kahn ( indegree queue) or DFS finish order on DAGs.",
    "sweep_line": "Sort start/end events; scan active count for concurrency/overlap.",
    "linked_list": "Dummy head, prev/cur/nxt reverse, Floyd cycle detection.",
    "bit_manipulation": "XOR cancels pairs; masks for flags and subset DP.",
}


WORKED: dict[str, str] = {
    "sliding_window": (
        "Longest unique substring in 'abba':\n"
        "  R=0 'a' window=a best=1\n"
        "  R=1 'b' window=ab best=2\n"
        "  R=2 'b' duplicate → move L past first b → window=b best=2\n"
        "  R=3 'a' window=ba best=2"
    ),
    "bfs": (
        "Grid shortest path: enqueue start dist=0; while queue: pop, "
        "push unseen neighbors dist+1; first time you pop the end cell is answer."
    ),
    "dp": (
        "Climb stairs n=4: dp[1]=1, dp[2]=2, dp[3]=3, dp[4]=5. "
        "Each state only needs previous two — O(1) space possible."
    ),
    "binary_search": (
        "First True in [F,F,F,T,T]: lo=0 hi=5; mid=2 F→lo=3; mid=4 T→hi=4; mid=3 T→hi=3; return 3."
    ),
    "hash_map": (
        "two_sum [2,7,11,15] target 9: see 2; need 7 → found at index 1 → [0,1]."
    ),
    "greedy": (
        "Merge intervals: sort by start; [[1,3],[2,6],[8,10]] → [[1,6],[8,10]]."
    ),
    "prefix_sum": (
        "nums=[2,3,1], pref=[0,2,5,6]; sum(1..2)=6-2=4."
    ),
    "stack": (
        "s='([])': push (, push [, pop on ], pop on ) → empty → True."
    ),
}


def _normalize(text: str) -> str:
    return " ".join(text.lower().replace("_", " ").split())


def diagnose(topic: str, user_answer: str = "", correct_answer: str = "", extra: str = "") -> TutorReport:
    blob = _normalize(f"{topic} {user_answer} {correct_answer} {extra}")
    scored: list[tuple[int, Misconception]] = []
    for m in MISCONCEPTIONS:
        score = sum(1 for s in m.signals if s.replace("_", " ") in blob or s in blob)
        # also match topic id loosely
        if topic and topic.lower() in m.signals:
            score += 2
        if score:
            scored.append((score, m))
    scored.sort(key=lambda x: -x[0])
    matched = [m for _, m in scored[:3]]
    if not matched:
        # generic fallback by topic
        for m in MISCONCEPTIONS:
            if topic.lower() in m.next_drill or topic.lower() in m.id:
                matched = [m]
                break
        if not matched:
            matched = [MISCONCEPTIONS[3]]  # dp_state as generic algorithmic repair

    key = topic.lower().replace(" ", "_")
    mental = PATTERN_MODELS.get(key, matched[0].repair)
    worked = WORKED.get(key, matched[0].explanation)
    practice = (
        f"Run: python main.py --drill --pattern {matched[0].next_drill}\n"
        f"Then review: python main.py --tutor --topic {key} --wrong \"<your idea>\" --right \"<correct>\""
    )
    resources = []
    html_map = {
        "sliding_window": "html/patterns.html#sliding_window",
        "bfs": "html/patterns.html#bfs",
        "dfs": "html/patterns.html#dfs",
        "dp": "html/deep_dives.html",
        "binary_search": "html/patterns.html#binary_search",
        "binary_search_answer": "html/patterns.html#binary_search_answer",
        "sweep_line": "html/patterns.html#sweep_line",
        "linked_list": "html/patterns.html#linked_list",
        "bit_manipulation": "html/patterns.html#bit_manipulation",
        "difference_array": "html/patterns.html#difference_array",
        "theory": "html/theory.html",
        "complexity": "html/theory.html#complexity",
        "cache": "html/architecture.html#cache",
        "security": "html/security.html",
        "logic": "html/discrete_math.html#proofs",
        "discrete": "html/discrete_math.html",
        "proof": "html/provability.html",
    }
    for m in matched:
        resources.append(html_map.get(m.next_drill, "html/algo_memory.html"))
    # dedupe preserve order
    seen = set()
    uniq = []
    for r in resources:
        if r not in seen:
            seen.add(r)
            uniq.append(r)

    return TutorReport(
        topic=topic,
        user_answer=user_answer,
        correct_answer=correct_answer,
        matched=matched,
        mental_model=mental,
        worked_example=worked,
        practice_prompt=practice,
        resources=uniq,
    )


def format_tutor_report(rep: TutorReport) -> str:
    lines = [
        "",
        "=" * 64,
        "  OFFLINE TUTOR — Mental Model Repair",
        "=" * 64,
        "",
        f"  Topic: {rep.topic}",
    ]
    if rep.user_answer:
        lines.append(f"  Your answer:     {rep.user_answer}")
    if rep.correct_answer:
        lines.append(f"  Correct answer:  {rep.correct_answer}")
    lines.append("")
    lines.append("  Likely misconceptions:")
    for i, m in enumerate(rep.matched, 1):
        lines.append(f"  ({i}) {m.title}")
        lines.append(f"      Why: {m.explanation}")
        lines.append(f"      EE bridge: {m.ee_analogy}")
        lines.append(f"      Repair: {m.repair}")
        lines.append("")
    lines.append("  Refined mental model:")
    lines.append(f"    {rep.mental_model}")
    lines.append("")
    lines.append("  Worked example:")
    for ln in rep.worked_example.splitlines():
        lines.append(f"    {ln}")
    lines.append("")
    lines.append("  Next practice:")
    for ln in rep.practice_prompt.splitlines():
        lines.append(f"    {ln}")
    lines.append("")
    lines.append("  Open offline:")
    for r in rep.resources:
        lines.append(f"    - {r}")
    lines.append("")
    lines.append("  Tip: after repair, grade the flashcard in html/algo_memory.html (Again/Hard/Good/Easy).")
    lines.append("")
    return "\n".join(lines)


def tutor_from_failed_tests(pattern: str, fail_logs: list[str]) -> TutorReport:
    extra = " ".join(fail_logs)
    return diagnose(topic=pattern, user_answer="failed tests", correct_answer="see reference", extra=extra)
