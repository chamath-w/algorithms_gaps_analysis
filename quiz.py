#!/usr/bin/env python3
"""
Offline quizzes and algorithm memory drills (CLI).

Multiple choice / short answer across undergrad tracks, with tutor hooks.
"""

from __future__ import annotations

import random
from dataclasses import dataclass

from progress import load_progress, record_quiz_session, review_card, save_progress, ensure_card
from tutor import diagnose, format_tutor_report


@dataclass(frozen=True)
class QuizItem:
    id: str
    topic: str
    track: str
    prompt: str
    choices: tuple[str, ...]  # if empty → free response (normalized match)
    answer: str               # letter A/B/C/D or canonical short string
    explanation: str
    mental_model: str
    card_id: str = ""


QUIZ_BANK: list[QuizItem] = [
    # Discrete math
    QuizItem(
        "dm_q1", "logic", "discrete_math",
        "Which is logically equivalent to ¬(P ∧ Q)?",
        ("¬P ∧ ¬Q", "¬P ∨ ¬Q", "P ∨ ¬Q", "P → Q"),
        "B",
        "De Morgan: negation distributes by flipping ∧/∨.",
        "Treat ∧ like series switches; Negation swaps series/parallel — De Morgan.",
        "card_demorgan",
    ),
    QuizItem(
        "dm_q2", "proofs", "discrete_math",
        "To prove ∀n≥1 P(n) by induction you must show:",
        ("Only P(1)", "P(1) and P(k)⇒P(k+1)", "Only P(k)⇒P(k+1)", "P(n) for a random n"),
        "B",
        "Base + inductive step. Missing either breaks the chain.",
        "Like verifying initial condition then the recurrence update.",
        "card_induction",
    ),
    QuizItem(
        "dm_q3", "counting", "discrete_math",
        "Ways to choose 3 items from 10 (order irrelevant)?",
        ("10^3", "10×9×8", "C(10,3)=120", "10!"),
        "C",
        "Combinations C(n,k)=n!/(k!(n-k)!).",
        "Order doesn't matter → divide out permutations of the k-set.",
        "card_combinations",
    ),
    # DSA / patterns
    QuizItem(
        "dsa_q1", "sliding_window", "dsa",
        "Best first instinct for 'longest substring with at most K distinct chars'?",
        ("DFS", "Sliding window + frequency map", "Dijkstra", "Union-Find"),
        "B",
        "Contiguous + constraint on distinct → expand/shrink window.",
        "Window invariant: distinct(count) ≤ K.",
        "card_sliding_window",
    ),
    QuizItem(
        "dsa_q2", "bfs", "dsa",
        "Unweighted shortest path in a graph uses:",
        ("DFS", "BFS", "Binary search", "Kadane"),
        "B",
        "First time BFS reaches the node is minimal edges.",
        "Wavefront / equal-cost rings.",
        "card_bfs",
    ),
    QuizItem(
        "dsa_q3", "dp", "dsa",
        "Kadane's algorithm computes:",
        ("Longest increasing subsequence", "Max contiguous subarray sum", "Edit distance", "MST"),
        "B",
        "dp[i] = max(a[i], dp[i-1]+a[i]); track global max.",
        "State = best sum ending here.",
        "card_kadane",
    ),
    QuizItem(
        "dsa_q4", "binary_search", "dsa",
        "Binary search on answer space requires:",
        ("Hashing", "A monotone predicate", "A stack", "Negative weights"),
        "B",
        "There must be a cutoff: FFFTTT form after sorting the answer domain.",
        "Successive approximation discarding impossible half.",
        "card_binary_search",
    ),
    QuizItem(
        "dsa_q5", "topo", "dsa",
        "Topological sort applies to:",
        ("Any undirected graph", "DAGs only", "Complete graphs only", "Trees only"),
        "B",
        "Cycles make a total order of prerequisites impossible.",
        "Dependency graph must be acyclic — like a one-way BOM.",
        "card_topo",
    ),
    # Theory
    QuizItem(
        "toc_q1", "automata", "theory",
        "Every NFA has an equivalent:",
        ("CFG only", "DFA", "Turing machine only", "No equivalent model"),
        "B",
        "Subset construction yields a DFA (possibly exponential states).",
        "Powersets of states — parallel speculation of which state you're in.",
        "card_nfa_dfa",
    ),
    QuizItem(
        "toc_q2", "complexity", "theory",
        "If a problem is NP-complete, a poly-time algorithm for it would imply:",
        ("P = NP", "P ≠ NP", "Nothing", "Only that P ⊆ NP"),
        "A",
        "NP-complete problems are poly-time interreducible for the class NP.",
        "One efficient universal solver collapses the class.",
        "card_npc",
    ),
    # Architecture
    QuizItem(
        "arch_q1", "cache", "architecture",
        "False sharing occurs when:",
        ("Two cores write different variables on the same cache line",
         "A page fault happens",
         "TLS handshake fails",
         "A mutex is fair"),
        "A",
        "Coherence invalidates the whole line even if variables differ.",
        "Shared bus word / line ping-pongs between cores.",
        "card_false_sharing",
    ),
    QuizItem(
        "arch_q2", "pipeline", "architecture",
        "A data hazard is primarily mitigated by:",
        ("Larger disks", "Forwarding / stalls / scheduling", "DNS caching", "GC tuning"),
        "B",
        "Forward results before writeback; else stall/nop.",
        "Like bypass wires around pipeline stages.",
        "card_hazard",
    ),
    # OS / concurrency
    QuizItem(
        "os_q1", "concurrency", "os",
        "A deadlock requires which of these (Coffman)?",
        ("Only mutual exclusion", "Mutual exclusion, hold-and-wait, no preemption, circular wait",
         "Only a race condition", "Only priority inversion"),
        "B",
        "Break any one condition to prevent deadlock.",
        "Four necessary conditions — remove circular wait via lock ordering.",
        "card_deadlock",
    ),
    # Networking
    QuizItem(
        "net_q1", "networking", "networking",
        "TCP provides that UDP does not:",
        ("Lower latency always", "Reliability, ordering, congestion control", "Encryption by default", "Multicast only"),
        "B",
        "TCP is a reliable byte stream; UDP is datagrams.",
        "Acked window protocol vs fire-and-forget packets.",
        "card_tcp_udp",
    ),
    # Databases
    QuizItem(
        "db_q1", "databases", "databases",
        "Under READ COMMITTED you still can see:",
        ("Dirty reads", "Non-repeatable reads", "Nothing anomalous", "Only phantom writes to other DBs"),
        "B",
        "Committed data can change between your reads.",
        "Isolation ladder: anomalies permitted decrease as level rises.",
        "card_isolation",
    ),
    # Compilers
    QuizItem(
        "pl_q1", "compilers", "compilers",
        "Lexing converts source text into:",
        ("Machine code", "Tokens", "Cache lines", "IP packets"),
        "B",
        "Lexer → tokens; parser → AST.",
        "Front-end stage 1: classify the character stream.",
        "card_lex",
    ),
    # Security
    QuizItem(
        "sec_q1", "security", "security",
        "Authentication vs authorization:",
        ("Same thing", "Authn=who you are; Authz=what you can do",
         "Authn=encryption; Authz=hashing", "Authz happens only in browsers"),
        "B",
        "Never conflate identity with permissions.",
        "Badge vs room ACL.",
        "card_auth",
    ),
    QuizItem(
        "sec_q2", "crypto", "security",
        "For confidentiality + integrity of messages prefer:",
        ("Raw MD5", "AEAD (e.g., AES-GCM)", "ECB encryption alone", "Base64"),
        "B",
        "AEAD schemes authenticate what they encrypt.",
        "Encrypt + MAC done right — like sealed tamper-evident envelope.",
        "card_aead",
    ),
    # SWE / systems
    QuizItem(
        "swe_q1", "swe", "swe",
        "Dependency Inversion means:",
        ("High-level modules depend on low-level concretions",
         "Both depend on abstractions",
         "Never use interfaces",
         "Invert your Git history"),
        "B",
        "Depend on interfaces/traits; inject implementations.",
        "Ports & adapters — like designing to a bus protocol not a chip.",
        "card_dip",
    ),
    QuizItem(
        "sd_q1", "systems", "systems_design",
        "CAP: under partition a system must choose:",
        ("Both C and A fully", "Between consistency and availability", "Only throughput", "Only encryption"),
        "B",
        "Partition forces a C/A trade-off for that request path.",
        "Broken link between substations — serve stale or refuse.",
        "card_cap",
    ),
    # Algorithm memory reconstruct
    QuizItem(
        "mem_q1", "memory", "dsa",
        "Fill blank: In monotonic decreasing stack for next greater, while stack and "
        "A[stack.top()] ____ A[i], pop.",
        ("<", ">", "==", "%"),
        "A",
        "Pop while top is smaller than current — maintaining decreasing heights.",
        "Stack stores candidates; current element kills smaller previous.",
        "card_mono_stack",
    ),
    QuizItem(
        "mem_q2", "memory", "dsa",
        "Union by rank + path compression nearly O(___) per op (amortized).",
        ("n", "α(n) (inverse Ackermann)", "n log n", "2^n"),
        "B",
        "Ackermann-inverse grows slower than any primitive recursive inverse people care about.",
        "Almost constant — treat as O(1) in practice.",
        "card_uf",
    ),
]


def items_for(topic: str | None = None, track: str | None = None) -> list[QuizItem]:
    items = QUIZ_BANK
    if track:
        items = [q for q in items if q.track == track]
    if topic:
        t = topic.lower()
        items = [q for q in items if t in q.topic or t in q.track or t in q.id]
    return items


def run_quiz(
    topic: str | None = None,
    track: str | None = None,
    limit: int | None = 8,
    seed: int | None = None,
    tutor_on_miss: bool = True,
) -> None:
    rng = random.Random(seed)
    items = items_for(topic, track)
    if not items:
        print(f"No quiz items for topic={topic!r} track={track!r}")
        print("Try: discrete_math, dsa, theory, architecture, security, ...")
        return
    rng.shuffle(items)
    if limit:
        items = items[:limit]

    store = load_progress()
    correct = 0
    attempted = 0
    print("\n" + "=" * 64)
    print("  OFFLINE QUIZ")
    print("=" * 64)
    print(f"  {len(items)} questions | tutor_on_miss={tutor_on_miss}")
    print("  Answer with A/B/C/D (or the short text). 'q' quits.\n")

    for i, q in enumerate(items, 1):
        print("-" * 64)
        print(f"  Q{i}. [{q.track}/{q.topic}] {q.prompt}")
        letters = "ABCD"
        if q.choices:
            for letter, choice in zip(letters, q.choices):
                print(f"     {letter}) {choice}")
        ans = input("\n  Your answer: ").strip()
        if ans.lower() == "q":
            break
        attempted += 1
        ok = ans.upper() == q.answer.upper() or ans.strip().lower() == q.answer.strip().lower()
        if not ok and q.choices and ans.upper()[:1] in letters:
            ok = ans.upper()[:1] == q.answer.upper()
        if ok:
            correct += 1
            print("  [OK] Correct.")
            print(f"    {q.explanation}")
            if q.card_id:
                ensure_card(store, q.card_id)
                review_card(store, q.card_id, "good")
        else:
            print(f"  [X] Incorrect. Correct: {q.answer}")
            if q.choices and q.answer.upper() in letters:
                idx = letters.index(q.answer.upper())
                if idx < len(q.choices):
                    print(f"    -> {q.choices[idx]}")
            print(f"    {q.explanation}")
            print(f"    Mental model: {q.mental_model}")
            if q.card_id:
                ensure_card(store, q.card_id)
                review_card(store, q.card_id, "again")
            if tutor_on_miss:
                rep = diagnose(
                    topic=q.topic,
                    user_answer=ans,
                    correct_answer=q.answer,
                    extra=q.prompt + " " + q.explanation,
                )
                print(format_tutor_report(rep))

    record_quiz_session(
        store, topic or track or "general", correct, attempted or 0, {"mode": "quiz"}
    )
    path = save_progress(store)
    print("=" * 64)
    print(f"  Score: {correct}/{attempted}")
    print(f"  Progress saved: {path}")
    print("=" * 64 + "\n")


def seed_algorithm_cards() -> int:
    """Ensure core algorithm memory cards exist in progress store."""
    store = load_progress()
    cards = [
        "card_sliding_window", "card_two_pointers", "card_binary_search", "card_bfs",
        "card_dfs", "card_dp", "card_kadane", "card_greedy", "card_backtracking",
        "card_heap", "card_mono_stack", "card_uf", "card_trie", "card_prefix",
        "card_hash_map", "card_dijkstra", "card_topo", "card_demorgan", "card_induction",
    ]
    for c in cards:
        ensure_card(store, c)
    save_progress(store)
    return len(cards)
