#!/usr/bin/env python3
"""
Full undergrad-shaped course catalog.

Offline curriculum: tracks → modules → lessons, with HTML page links,
CLI quiz tags, and prerequisite edges. Designed for EE→SDE gap-filling.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class Lesson:
    id: str
    title: str
    summary: str
    html: str | None = None          # relative path under html/
    cli_tags: tuple[str, ...] = ()   # tags for --drill / --quiz
    minutes: int = 45
    kind: str = "study"              # study | practice | project | drill


@dataclass(frozen=True)
class Module:
    id: str
    title: str
    summary: str
    lessons: tuple[Lesson, ...]
    html: str | None = None


@dataclass(frozen=True)
class Track:
    id: str
    title: str
    level: str                       # foundation | core | systems | theory | professional
    summary: str
    ee_bridge: str
    modules: tuple[Module, ...]
    prerequisites: tuple[str, ...] = ()
    html: str | None = None


TRACKS: list[Track] = [
    Track(
        id="orientation",
        title="Orientation & Mental Models",
        level="foundation",
        summary="EE→SDE cognitive shifts, memory palace, how to use this course offline.",
        ee_bridge="Treat software as layered signal chains: interfaces are ports, APIs are protocols.",
        html="mental_models.html",
        modules=(
            Module(
                id="mm",
                title="Six Mental Model Shifts",
                summary="Determinism vs eventual consistency, composition, clarity-first, state machines, layers, failure.",
                html="mental_models.html",
                lessons=(
                    Lesson("mm_01", "Deterministic vs Eventual", "Consistency models via circuit timing analogies.", "mental_models.html", ("mental_models",), 40),
                    Lesson("mm_02", "Memory Palace Setup", "Loci journey for algorithm patterns.", "memory_palace.html", ("memory",), 30),
                    Lesson("mm_03", "How to Study Offline", "CLI + HTML workflow for flights.", "catalog.html", (), 20),
                ),
            ),
        ),
    ),
    Track(
        id="discrete_math",
        title="Discrete Mathematics",
        level="foundation",
        summary="Logic, sets, proofs, combinatorics, graphs, recurrence — the language of CS arguments.",
        ee_bridge="Boolean algebra and Karnaugh maps → propositional logic; signal graphs → discrete graphs.",
        html="discrete_math.html",
        modules=(
            Module(
                id="dm_logic",
                title="Logic & Proofs",
                summary="Propositional/predicate logic, induction, invariants.",
                html="discrete_math.html#logic",
                lessons=(
                    Lesson("dm_01", "Propositional Logic", "Truth tables, implications, De Morgan.", "discrete_math.html#logic", ("discrete", "logic"), 45),
                    Lesson("dm_02", "Proof Techniques", "Direct, contradiction, induction, invariants.", "discrete_math.html#proofs", ("discrete", "proofs"), 50),
                    Lesson("dm_03", "Sets, Relations, Functions", "Cardinality, equivalence, bijections.", "discrete_math.html#sets", ("discrete",), 40),
                ),
            ),
            Module(
                id="dm_counting",
                title="Counting & Recurrence",
                summary="Combinatorics and Master theorem style reasoning.",
                html="discrete_math.html#counting",
                lessons=(
                    Lesson("dm_04", "Combinatorics", "Permutations, combinations, pigeonhole.", "discrete_math.html#counting", ("discrete", "counting"), 45),
                    Lesson("dm_05", "Recurrences", "Unrolling, Master theorem intuition.", "discrete_math.html#recurrences", ("discrete", "recurrence"), 45),
                    Lesson("dm_06", "Graph Theory Basics", "Degree, paths, trees, bipartite.", "discrete_math.html#graphs", ("discrete", "graphs"), 50),
                ),
            ),
        ),
    ),
    Track(
        id="dsa",
        title="Data Structures & Algorithms",
        level="core",
        summary="Patterns, sorting, complexity, and a LeetCode-style generator to stay sharp.",
        ee_bridge="Complexity ≈ energy/time budget; patterns are reusable circuit topologies.",
        html="patterns.html",
        prerequisites=("discrete_math", "orientation"),
        modules=(
            Module(
                id="dsa_patterns",
                title="21 Algorithm Patterns",
                summary="Classification instinct before coding.",
                html="patterns.html",
                lessons=(
                    Lesson("dsa_01", "Pattern Catalog", "All 21 patterns with templates + signals.", "patterns.html", ("patterns",), 90),
                    Lesson("dsa_02", "Decision Tree", "Pick the right pattern under pressure.", "decision_tree.html", ("patterns",), 40),
                    Lesson("dsa_03", "Deep Dives", "Hard patterns with EE analogies.", "deep_dives.html", ("patterns",), 60),
                    Lesson("dsa_04", "Sorting Family", "8 sorts + topo sort bridge.", "sorting.html", ("sorting",), 50),
                    Lesson("dsa_05", "Algorithm Memory Lab", "SRS flashcards + reconstruct-from-blank drills.", "algo_memory.html", ("memory", "patterns"), 60, "drill"),
                    Lesson("dsa_06", "Pattern Training", "CLI classification trainer.", None, ("patterns",), 45, "practice"),
                    Lesson("dsa_07", "Dynamic Practice Arena", "Generated problems, offline.", "practice.html", ("practice",), 60, "practice"),
                ),
            ),
            Module(
                id="dsa_correctness",
                title="Correctness & Analysis",
                summary="Loop invariants, amortized analysis, big-O fluency.",
                html="provability.html",
                lessons=(
                    Lesson("dsa_08", "Provability", "Invariants, termination, safety/liveness.", "provability.html", ("proofs",), 50),
                    Lesson("dsa_09", "Coding Assessment Bank", "26 staff-level problems via CLI.", None, ("coding",), 120, "practice"),
                ),
            ),
        ),
    ),
    Track(
        id="theory",
        title="Theory of Computation",
        level="theory",
        summary="Automata, grammars, decidability, P vs NP — what computers can and cannot do.",
        ee_bridge="FSMs you already design in digital logic → DFA/NFA; complexity as resource limits.",
        html="theory.html",
        prerequisites=("discrete_math",),
        modules=(
            Module(
                id="toc_automata",
                title="Automata & Grammars",
                summary="DFA, NFA, regex, CFG, Pushdown automata.",
                html="theory.html#automata",
                lessons=(
                    Lesson("toc_01", "Finite Automata", "DFA/NFA equivalence, regex.", "theory.html#automata", ("theory", "automata"), 55),
                    Lesson("toc_02", "Context-Free Languages", "CFGs, parse trees, PDA.", "theory.html#cfg", ("theory", "cfg"), 50),
                    Lesson("toc_03", "Decidability", "TM sketch, halting problem intuition.", "theory.html#decidability", ("theory",), 45),
                    Lesson("toc_04", "Complexity Classes", "P, NP, reductions, NP-complete examples.", "theory.html#complexity", ("theory", "complexity"), 55),
                ),
            ),
        ),
    ),
    Track(
        id="architecture",
        title="Computer Architecture",
        level="systems",
        summary="ISA, pipelines, caches, virtual memory — how software meets silicon.",
        ee_bridge="You already know gates and buses; this maps them to the machine model compilers target.",
        html="architecture.html",
        modules=(
            Module(
                id="arch_core",
                title="Machine Model",
                summary="ISA, pipeline hazards, memory hierarchy, coherence.",
                html="architecture.html",
                lessons=(
                    Lesson("arch_01", "ISA & Assembly View", "Registers, calling conventions, endianness.", "architecture.html#isa", ("arch",), 45),
                    Lesson("arch_02", "Pipelines & Hazards", "Data/control hazards, forwarding.", "architecture.html#pipeline", ("arch",), 50),
                    Lesson("arch_03", "Caches & Locality", "Cache lines, associativity, false sharing.", "architecture.html#cache", ("arch", "cache"), 55),
                    Lesson("arch_04", "Virtual Memory", "Pages, TLB, page faults.", "architecture.html#vm", ("arch", "os"), 45),
                ),
            ),
        ),
    ),
    Track(
        id="os",
        title="Operating Systems",
        level="systems",
        summary="Processes, threads, scheduling, sync, memory, files.",
        ee_bridge="RTOS instincts apply; general-purpose OS adds virtualization and fairness.",
        html="cs_fundamentals.html#os",
        prerequisites=("architecture",),
        modules=(
            Module(
                id="os_core",
                title="OS Internals",
                summary="Concurrency bugs, scheduling, IPC.",
                html="cs_fundamentals.html",
                lessons=(
                    Lesson("os_01", "Processes & Threads", "Address spaces, context switch cost.", "cs_fundamentals.html", ("os",), 40),
                    Lesson("os_02", "Synchronization", "Mutex, deadlock, race conditions.", "cs_fundamentals.html", ("os", "concurrency"), 50),
                    Lesson("os_03", "Python Concurrency", "threading, multiprocessing, asyncio.", "cs_fundamentals.html", ("concurrency",), 50, "practice"),
                ),
            ),
        ),
    ),
    Track(
        id="networking",
        title="Computer Networks",
        level="systems",
        summary="L4–L7: TCP/UDP, HTTP, TLS, DNS, WebSocket.",
        ee_bridge="Layered protocols like OSI/comms stacks you already reason about.",
        html="cs_fundamentals.html#networking",
        modules=(
            Module(
                id="net_core",
                title="Networking Stack",
                summary="Reliability, congestion, application protocols.",
                html="cs_fundamentals.html",
                lessons=(
                    Lesson("net_01", "TCP vs UDP", "Handshake, reliability, head-of-line.", "cs_fundamentals.html", ("networking",), 40),
                    Lesson("net_02", "HTTP & TLS", "Requests, certificates, HTTPS.", "cs_fundamentals.html", ("networking",), 45),
                    Lesson("net_03", "DNS & WebSocket", "Resolution path, persistent channels.", "cs_fundamentals.html", ("networking",), 35),
                ),
            ),
        ),
    ),
    Track(
        id="databases",
        title="Databases",
        level="systems",
        summary="Relational model, SQL, ACID, indexes, NoSQL selection.",
        ee_bridge="Persistence as non-volatile state with transactional 'atomic commits'.",
        html="cs_fundamentals.html#databases",
        modules=(
            Module(
                id="db_core",
                title="Data Persistence",
                summary="SQL fluency and scaling mental models.",
                html="cs_fundamentals.html",
                lessons=(
                    Lesson("db_01", "SQL Fluency", "Joins, aggregates, indexes.", "cs_fundamentals.html", ("databases", "sql"), 50),
                    Lesson("db_02", "ACID & Isolation", "Anomalies, isolation levels.", "cs_fundamentals.html", ("databases",), 45),
                    Lesson("db_03", "Scaling & NoSQL", "Sharding, replication, when to use what.", "cs_fundamentals.html", ("databases",), 45),
                ),
            ),
        ),
    ),
    Track(
        id="compilers",
        title="Programming Languages & Compilers",
        level="theory",
        summary="Lexing, parsing, IR, type systems, runtime — how source becomes machine code.",
        ee_bridge="Compilation pipeline ≈ multi-stage signal conditioning with well-defined interfaces.",
        html="compilers.html",
        prerequisites=("theory", "architecture"),
        modules=(
            Module(
                id="pl_core",
                title="Language Implementation",
                summary="Front-end to back-end sketch.",
                html="compilers.html",
                lessons=(
                    Lesson("pl_01", "Lex & Parse", "Tokens, recursive descent, AST.", "compilers.html#lex", ("compilers",), 50),
                    Lesson("pl_02", "Types & Semantics", "Static vs dynamic, soundness intuition.", "compilers.html#types", ("compilers",), 45),
                    Lesson("pl_03", "IR & Codegen", "SSA intuition, calling conventions.", "compilers.html#ir", ("compilers",), 50),
                    Lesson("pl_04", "Runtimes", "GC vs RAII/ownership (Rust).", "compilers.html#runtime", ("compilers",), 40),
                ),
            ),
        ),
    ),
    Track(
        id="swe",
        title="Software Engineering",
        level="professional",
        summary="SOLID, design patterns, testing, git, CI/CD, technical debt.",
        ee_bridge="Design rules of thumb like derating — trade-offs under real constraints.",
        html="software_engineering.html",
        modules=(
            Module(
                id="swe_core",
                title="Professional Practice",
                summary="Build software that lasts.",
                html="software_engineering.html",
                lessons=(
                    Lesson("swe_01", "SOLID + Patterns", "8 patterns that actually matter.", "software_engineering.html", ("swe",), 55),
                    Lesson("swe_02", "Testing Pyramid", "Unit/integration/e2e strategy.", "software_engineering.html", ("swe", "testing"), 40),
                    Lesson("swe_03", "Git & CI/CD", "Staff-level version control workflows.", "software_engineering.html", ("swe",), 40),
                ),
            ),
        ),
    ),
    Track(
        id="systems_design",
        title="Systems Design",
        level="professional",
        summary="Building blocks, CAP, consistency, 9 practice designs, APIs.",
        ee_bridge="Capacity planning and redundancy — same instincts as power/comms systems.",
        html="systems_design.html",
        prerequisites=("networking", "databases", "os"),
        modules=(
            Module(
                id="sd_core",
                title="Design Practice",
                summary="Method + worked designs.",
                html="systems_design.html",
                lessons=(
                    Lesson("sd_01", "Building Blocks", "LB, cache, queue, DB roles.", "systems_design.html", ("systems",), 45),
                    Lesson("sd_02", "CAP & Consistency", "Trade-offs under partition.", "systems_design.html", ("systems",), 45),
                    Lesson("sd_03", "Nine Designs", "Beginner → staff practice set.", "systems_design.html", ("systems",), 120, "practice"),
                ),
            ),
        ),
    ),
    Track(
        id="security",
        title="Security & Cryptography",
        level="professional",
        summary="Threat models, authn/z, crypto primitives, OWASP-style web risks.",
        ee_bridge="Security is adversarial signal integrity — assume a hostile channel.",
        html="security.html",
        prerequisites=("networking",),
        modules=(
            Module(
                id="sec_core",
                title="Secure Engineering",
                summary="Practical threat-driven design.",
                html="security.html",
                lessons=(
                    Lesson("sec_01", "Threat Modeling", "STRIDE, trust boundaries.", "security.html#threat", ("security",), 40),
                    Lesson("sec_02", "Crypto Primitives", "Hash, MAC, AEAD, TLS roles.", "security.html#crypto", ("security",), 50),
                    Lesson("sec_03", "Auth & Web Risks", "OAuth/JWT intuition, OWASP Top 10.", "security.html#web", ("security",), 50),
                ),
            ),
        ),
    ),
    Track(
        id="staff",
        title="Staff-Level Engineering",
        level="professional",
        summary="RFCs, influence, observability, incidents, mentoring.",
        ee_bridge="Staff work is system integration across teams — like multi-board product bring-up.",
        html="staff_level.html",
        prerequisites=("swe", "systems_design"),
        modules=(
            Module(
                id="staff_core",
                title="Impact Skills",
                summary="Write, decide, lead technically.",
                html="staff_level.html",
                lessons=(
                    Lesson("st_01", "RFCs & ADRs", "Design docs that drive decisions.", "staff_level.html", ("staff",), 45),
                    Lesson("st_01b", "Engineering Patterns", "Cache-aside, outbox, saga, breakers, backpressure.", "engineering_patterns.html", ("staff", "patterns"), 40),
                    Lesson("st_02", "Observability & Incidents", "Logs/metrics/traces, response.", "staff_level.html", ("staff",), 45),
                    Lesson("st_03", "Capstone Path", "72-day plan + projects.", "three_month_plan.html", ("staff",), 60, "project"),
                ),
            ),
        ),
    ),
]


def get_track(track_id: str) -> Track | None:
    for t in TRACKS:
        if t.id == track_id:
            return t
    return None


def all_lessons() -> list[tuple[Track, Module, Lesson]]:
    out: list[tuple[Track, Module, Lesson]] = []
    for t in TRACKS:
        for m in t.modules:
            for lesson in m.lessons:
                out.append((t, m, lesson))
    return out


def lessons_by_tag(tag: str) -> list[Lesson]:
    tag = tag.lower()
    return [les for _, _, les in all_lessons() if tag in les.cli_tags or tag in les.id]


def format_catalog(verbose: bool = False) -> str:
    lines = [
        "",
        "=" * 64,
        "  OFFLINE CS / SWE COURSE CATALOG",
        "  Undergrad-shaped tracks + staff mastery path",
        "=" * 64,
        "",
    ]
    by_level: dict[str, list[Track]] = {}
    for t in TRACKS:
        by_level.setdefault(t.level, []).append(t)

    order = ["foundation", "core", "systems", "theory", "professional"]
    for level in order:
        tracks = by_level.get(level, [])
        if not tracks:
            continue
        lines.append(f"  [{level.upper()}]")
        for t in tracks:
            n_lessons = sum(len(m.lessons) for m in t.modules)
            prereq = f"  (after: {', '.join(t.prerequisites)})" if t.prerequisites else ""
            lines.append(f"    {t.id:<16} {t.title} — {n_lessons} lessons{prereq}")
            if verbose:
                lines.append(f"      EE bridge: {t.ee_bridge}")
                for m in t.modules:
                    lines.append(f"      • {m.title}")
                    for les in m.lessons:
                        html = f" → html/{les.html}" if les.html else " → CLI"
                        lines.append(f"          - [{les.kind}] {les.title} (~{les.minutes}m){html}")
        lines.append("")

    lines.append("  Open html/catalog.html for the interactive navigator.")
    lines.append("  CLI: python main.py --catalog | --course <track> | --drill | --quiz")
    lines.append("")
    return "\n".join(lines)


def format_track_detail(track_id: str) -> str:
    t = get_track(track_id)
    if not t:
        known = ", ".join(x.id for x in TRACKS)
        return f"Unknown track: {track_id}\nKnown: {known}\n"
    lines = [
        "",
        "=" * 64,
        f"  TRACK: {t.title} ({t.id})",
        f"  Level: {t.level}",
        "=" * 64,
        "",
        f"  {t.summary}",
        f"  EE bridge: {t.ee_bridge}",
        "",
    ]
    if t.html:
        lines.append(f"  HTML hub: html/{t.html}")
        lines.append("")
    for m in t.modules:
        lines.append(f"  MODULE: {m.title}")
        for les in m.lessons:
            tags = ",".join(les.cli_tags) if les.cli_tags else "-"
            html = les.html or "(CLI practice)"
            lines.append(f"    [{les.id}] {les.title}")
            lines.append(f"         {les.summary}")
            lines.append(f"         ~{les.minutes}m | {les.kind} | tags:{tags} | {html}")
        lines.append("")
    return "\n".join(lines)
