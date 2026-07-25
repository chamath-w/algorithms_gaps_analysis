/**
 * Practice Arena enhancements: text coach, micro-drills, skeleton ghost,
 * diff feedback, visual trace/compare, deliberate practice.
 * Offline — no network, no speech synthesis, no audio assets.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "arena_deliberate_v1";
  const STREAK_GOAL = 3;

  const PATTERN_SIGNALS = {
    sliding_window: ["contiguous", "substring", "subarray", "window", "longest", "shortest"],
    two_pointers: ["sorted", "pair", "opposite", "left", "right", "two pointers"],
    binary_search: ["sorted", "log n", "index", "target"],
    binary_search_answer: ["minimum", "maximum", "capacity", "speed", "feasible", "hours"],
    bfs: ["shortest", "level", "queue", "unweighted", "grid"],
    dfs: ["connected", "flood", "path", "recursion", "island"],
    topological_sort: ["prerequisite", "dependency", "order", "course"],
    dp: ["ways", "maximum subarray", "optimal", "overlapping"],
    greedy: ["merge", "interval", "local", "sort by"],
    backtracking: ["all subsets", "all permutations", "enumerate"],
    heap: ["k-th", "kth", "top k", "priority"],
    monotonic_stack: ["next greater", "next smaller", "stack"],
    union_find: ["components", "union", "connected", "disjoint"],
    trie: ["prefix", "starts with", "dictionary"],
    prefix_sum: ["range sum", "prefix", "query"],
    hash_map: ["two sum", "complement", "frequency", "seen"],
    dijkstra: ["weighted", "shortest path", "non-negative"],
    sweep_line: ["overlap", "concurrent", "meeting", "timeline"],
    linked_list: ["list", "reverse", "cycle", "node"],
    bit_manipulation: ["xor", "bit", "single number", "mask"],
    difference_array: ["range update", "add to range", "difference"],
  };

  const COACH_OPENERS = {
    sliding_window: "Keep a valid window. Expand right; shrink left when the invariant breaks.",
    two_pointers: "Sorted or ends-inward: move the pointer that can improve the objective.",
    binary_search: "Maintain a clear lo/hi invariant; mid discards half each step.",
    binary_search_answer: "Search the answer value. can(mid) must be monotone.",
    bfs: "Queue + seen. First time you reach a node is shortest in edges.",
    dfs: "Go deep; mark seen. Good for connectivity and path existence.",
    topological_sort: "Kahn: peel indegree-0 nodes. Leftover nodes ⇒ cycle.",
    dp: "Name the state, base cases, transition, order, answer cell.",
    greedy: "Sort by the right key; prove a local choice is safe.",
    backtracking: "Choose → explore → unchoose. Prune doomed branches.",
    heap: "Repeated min/max from a dynamic set — often size-k heap.",
    monotonic_stack: "Pop while order is violated; that answers next greater/smaller.",
    union_find: "Merge sets; path compression keeps finds nearly O(1).",
    trie: "Share prefixes as tree edges; walk char by char.",
    prefix_sum: "Integrate once; range = difference of two prefixes.",
    hash_map: "Store what you've seen; look up the complement in O(1).",
    dijkstra: "Expand cheapest unsettled node; weights must be non-negative.",
    sweep_line: "+1 at start, −1 at end; scan active count for concurrency.",
    linked_list: "Never lose next. Reverse = prev/cur/nxt. Cycle = Floyd.",
    bit_manipulation: "XOR cancels pairs. Masks pack flags.",
    difference_array: "+val at L, −val at R+1; prefix to materialize.",
  };

  function loadDeliberate() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { streaks: {}, fails: {}, solves: {}, settings: {} };
      return JSON.parse(raw);
    } catch {
      return { streaks: {}, fails: {}, solves: {}, settings: {} };
    }
  }

  function saveDeliberate(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }

  function recordPass(pattern) {
    const d = loadDeliberate();
    d.streaks[pattern] = (d.streaks[pattern] || 0) + 1;
    d.solves[pattern] = (d.solves[pattern] || 0) + 1;
    saveDeliberate(d);
    return d.streaks[pattern];
  }

  function recordFail(pattern) {
    const d = loadDeliberate();
    d.streaks[pattern] = 0;
    d.fails[pattern] = (d.fails[pattern] || 0) + 1;
    saveDeliberate(d);
    return 0;
  }

  function weakPatterns(limit) {
    const d = loadDeliberate();
    const ids = Object.keys({ ...d.fails, ...d.solves });
    const scored = ids.map((id) => {
      const f = d.fails[id] || 0;
      const s = d.solves[id] || 0;
      const rate = f + s ? f / (f + s) : 0;
      return { id, f, s, rate, streak: d.streaks[id] || 0 };
    });
    scored.sort((a, b) => b.rate - a.rate || b.f - a.f);
    return scored.slice(0, limit || 5);
  }

  function highlightSignals(text, pattern) {
    const signals = PATTERN_SIGNALS[pattern] || [];
    let html = escapeHtml(text);
    signals.forEach((sig) => {
      const re = new RegExp("(" + sig.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
      html = html.replace(re, '<mark class="arena-signal">$1</mark>');
    });
    return html;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function buildMicroDrill(problem) {
    const p = problem.pattern;
    const sample = (problem.tests && problem.tests[0]) || null;
    const bank = {
      sliding_window: {
        q: "For a contiguous substring/subarray constraint, which move is correct?",
        choices: [
          { t: "Expand right; shrink left when the window becomes invalid", ok: true },
          { t: "Always restart from index 0 for every right endpoint", ok: false },
          { t: "Binary search the substring length only", ok: false },
        ],
        tip: "Invariant: window always valid; O(1) add/remove at the ends.",
      },
      two_pointers: {
        q: "On a sorted array looking for a pair sum, when sum is too small you…",
        choices: [
          { t: "Move the left pointer right (increase sum)", ok: true },
          { t: "Move both pointers randomly", ok: false },
          { t: "Clear a hash map and rescan", ok: false },
        ],
        tip: "Move the pointer that can improve the objective.",
      },
      binary_search: {
        q: "Binary search on a sorted array needs which property?",
        choices: [
          { t: "A monotone predicate / ordered domain so mid discards half", ok: true },
          { t: "A hash map of all values first", ok: false },
          { t: "O(n) extra space always", ok: false },
        ],
        tip: "Comment the lo/hi invariant each iteration.",
      },
      binary_search_answer: {
        q: "Binary search on answer searches…",
        choices: [
          { t: "The numeric answer on a monotone can(x) line", ok: true },
          { t: "Only an index in a pre-sorted input array", ok: false },
          { t: "All subsets with a bitmask", ok: false },
        ],
        tip: "If can(x) is not monotone, binary search is wrong.",
      },
      bfs: {
        q: "Unweighted shortest path uses…",
        choices: [
          { t: "BFS with a queue (first hit = fewest edges)", ok: true },
          { t: "DFS recursion only", ok: false },
          { t: "Dijkstra with negative weights", ok: false },
        ],
        tip: "Queue + seen; explore distance rings.",
      },
      dfs: {
        q: "DFS is the better default when you need…",
        choices: [
          { t: "Connectivity / flood fill / path existence", ok: true },
          { t: "Unweighted shortest path length", ok: false },
          { t: "Always O(1) extra space on graphs", ok: false },
        ],
        tip: "Stack or recursion; mark visited.",
      },
      topological_sort: {
        q: "Kahn's algorithm starts by…",
        choices: [
          { t: "Queueing all indegree-0 nodes", ok: true },
          { t: "Sorting edge weights", ok: false },
          { t: "Running Dijkstra from node 0", ok: false },
        ],
        tip: "If you finish with fewer than n nodes, there is a cycle.",
      },
      dp: {
        q: "Before coding DP, you should first…",
        choices: [
          { t: "Define state meaning, base, transition, order, answer location", ok: true },
          { t: "Only write a nested brute force and hope", ok: false },
          { t: "Always use a recursive set without memo", ok: false },
        ],
        tip: "If the state is wrong, the transition cannot save you.",
      },
      greedy: {
        q: "Interval merge / scheduling greedy usually…",
        choices: [
          { t: "Sort by a key, then make a proven local choice", ok: true },
          { t: "Try all permutations", ok: false },
          { t: "Use Floyd cycle detection", ok: false },
        ],
        tip: "Know the sort key (start vs end) for the problem.",
      },
      backtracking: {
        q: "Backtracking's core loop is…",
        choices: [
          { t: "Choose → explore → unchoose (with pruning)", ok: true },
          { t: "Sliding a fixed window only", ok: false },
          { t: "Union by rank", ok: false },
        ],
        tip: "Prune as soon as a partial solution is doomed.",
      },
      heap: {
        q: "K-th largest in a stream/array is often…",
        choices: [
          { t: "A min-heap of size k (or nlargest)", ok: true },
          { t: "Binary search on a unsorted array index", ok: false },
          { t: "Prefix sums", ok: false },
        ],
        tip: "Heap gives repeated extract-min/max efficiently.",
      },
      monotonic_stack: {
        q: "Next greater element uses a stack that stays…",
        choices: [
          { t: "Monotonic (pop while top is smaller than current)", ok: true },
          { t: "A FIFO queue of all indices", ok: false },
          { t: "Only the maximum of the whole array", ok: false },
        ],
        tip: "Store indices; values decide when to pop.",
      },
      union_find: {
        q: "Union-Find answers…",
        choices: [
          { t: "Dynamic connectivity / component merges", ok: true },
          { t: "Shortest weighted paths", ok: false },
          { t: "String prefix queries", ok: false },
        ],
        tip: "Path compression + union by rank ≈ O(α(n)).",
      },
      trie: {
        q: "A trie shines when queries are about…",
        choices: [
          { t: "Shared string prefixes", ok: true },
          { t: "Integer range sums only", ok: false },
          { t: "Negative-weight shortest paths", ok: false },
        ],
        tip: "One edge per character; O(len) walk.",
      },
      prefix_sum: {
        q: "sum(l..r) with prefix array is…",
        choices: [
          { t: "pref[r+1] - pref[l]", ok: true },
          { t: "pref[r] + pref[l]", ok: false },
          { t: "XOR of all pref values", ok: false },
        ],
        tip: "Build pref once; answer each query in O(1).",
      },
      hash_map: {
        q: "Two Sum in O(n) stores…",
        choices: [
          { t: "Value → index seen so far; look up complement", ok: true },
          { t: "Only a sorted copy of the array", ok: false },
          { t: "All pair indices in a list", ok: false },
        ],
        tip: "Check complement before inserting the current value (or after, consistently).",
      },
      dijkstra: {
        q: "Dijkstra requires edge weights to be…",
        choices: [
          { t: "Non-negative", ok: true },
          { t: "Possibly negative (always OK)", ok: false },
          { t: "Only 0 or 1", ok: false },
        ],
        tip: "Priority queue of (dist, node); skip stale entries.",
      },
      sweep_line: {
        q: "Max concurrent intervals is solved by…",
        choices: [
          { t: "Sorting start/end events and scanning active count", ok: true },
          { t: "Kadane on the flat array of starts only", ok: false },
          { t: "Trie of interval endpoints", ok: false },
        ],
        tip: "Process ends before starts at the same timestamp when using half-open intervals.",
      },
      linked_list: {
        q: "In-place reverse uses which pointer trio?",
        choices: [
          { t: "prev, cur, nxt — save next before rewiring", ok: true },
          { t: "Only a queue of all nodes", ok: false },
          { t: "Binary search mid each time", ok: false },
        ],
        tip: "Cycle detection: slow=1 step, fast=2 steps.",
      },
      bit_manipulation: {
        q: "Find the element that appears once (others twice) with…",
        choices: [
          { t: "XOR everything (pairs cancel)", ok: true },
          { t: "Prefix sums", ok: false },
          { t: "Topological sort", ok: false },
        ],
        tip: "a^a=0, a^0=a.",
      },
      difference_array: {
        q: "Range add [L,R]+=val efficiently does…",
        choices: [
          { t: "diff[L]+=val; diff[R+1]-=val; then prefix reconstruct", ok: true },
          { t: "Binary search each index", ok: false },
          { t: "BFS from L to R", ok: false },
        ],
        tip: "Inverse of prefix sums: encode writes, integrate once.",
      },
    };

    const drill = bank[p] || {
      q: `What is the core mental model for ${p}?`,
      choices: [
        { t: COACH_OPENERS[p] || problem.mentalModel || "Apply the pattern template", ok: true },
        { t: "Always use nested O(n²) loops with no invariant", ok: false },
        { t: "Ignore the sample tests and guess", ok: false },
      ],
      tip: problem.mentalModel || "Follow the pattern template.",
    };

    // shuffle choices but keep stable seed from problem.id
    let h = 0;
    const id = problem.id || "x";
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    const choices = drill.choices.slice();
    for (let i = choices.length - 1; i > 0; i--) {
      h = (h * 1664525 + 1013904223) >>> 0;
      const j = h % (i + 1);
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }

    let sampleLine = "";
    if (sample) {
      sampleLine = `${problem.functionName}(${sample.args.map((a) => JSON.stringify(a)).join(", ")}) → ${JSON.stringify(sample.expected)}`;
    }

    return {
      question: drill.q,
      choices,
      tip: drill.tip,
      sampleLine,
      opener: COACH_OPENERS[p] || problem.mentalModel || "",
    };
  }

  function skeletonLines(problem) {
    const src = problem.modelAnswer || "";
    return src
      .split("\n")
      .map((l) => l.replace(/\s+$/, ""))
      .filter((l) => l.trim().length > 0);
  }

  function diagnoseFailure(problem, report) {
    if (report.compile_error) {
      return {
        kind: "compile",
        title: "Code did not run",
        expected: null,
        got: null,
        why: report.compile_error.split("\n")[0],
        action: "Fix the syntax/name error, then Run again. Function name must be exactly: " + problem.functionName,
        coach: [
          `Compiler/runtime: ${report.compile_error.split("\n")[0]}`,
          `Expected def ${problem.functionName}(...).`,
          "Action: fix the error line, reset if needed, re-run.",
        ],
      };
    }
    const fails = (report.results || []).filter((r) => !r.passed);
    if (!fails.length) {
      return {
        kind: "pass",
        title: "All tests passed",
        expected: null,
        got: null,
        why: "Implementation matches the reference on generated cases.",
        action: "Say the mental model out loud, then New problem (or keep streak on this pattern).",
        coach: [
          `Pass on ${problem.pattern}.`,
          COACH_OPENERS[problem.pattern] || problem.mentalModel,
          "Action: reinforce — glance at the worked example once, then next drill.",
        ],
      };
    }
    const f = fails[0];
    const why = explainMismatch(problem, f);
    const action = nextAction(problem, f);
    return {
      kind: "fail",
      title: `Case ${f.index} failed`,
      caseIndex: f.index,
      args: f.args,
      expected: f.expected,
      got: f.got,
      error: f.error,
      why,
      action,
      failCount: fails.length,
      total: report.total,
      passed: report.passed,
      coach: [
        `Fail case ${f.index}/${report.total}: got ${fmt(f.got)} · expected ${fmt(f.expected)}.`,
        why,
        `Do this now: ${action}`,
      ],
    };
  }

  function fmt(v) {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }

  function explainMismatch(problem, f) {
    if (f.error) return `Runtime error: ${f.error}`;
    const p = problem.pattern;
    const exp = f.expected;
    const got = f.got;
    if (Array.isArray(exp) && Array.isArray(got) && exp.length === got.length) {
      let i = 0;
      while (i < exp.length && JSON.stringify(exp[i]) === JSON.stringify(got[i])) i++;
      if (i < exp.length) {
        return `First difference at index ${i}: got ${fmt(got[i])}, expected ${fmt(exp[i])}.`;
      }
    }
    if (typeof exp === "number" && typeof got === "number") {
      if (got < exp) return `Result too small (${got} < ${exp}). Often under-counting or shrinking/moving a pointer too early.`;
      if (got > exp) return `Result too large (${got} > ${exp}). Often over-extending a window or missing a prune.`;
    }
    const hints = {
      sliding_window: "Check left moves past duplicates and length uses right-left+1.",
      two_pointers: "Check which pointer moves when the sum/area is wrong.",
      binary_search: "Off-by-one on lo/hi or returning mid vs lo.",
      binary_search_answer: "can(mid) wrong, or searching max instead of min (or inverse).",
      hash_map: "Insert vs lookup order; wrong complement; returning values not indices.",
      dp: "Wrong base case or transition; off-by-one on index.",
      greedy: "Wrong sort key; not extending/merging the last interval.",
      bfs: "Forgot seen set; wrong neighbor order; treated weighted as BFS.",
      bit_manipulation: "Did not XOR all elements, or mutated the list incorrectly.",
      difference_array: "Off-by-one on R+1, or forgot the final prefix pass.",
      sweep_line: "Event sort order (ends vs starts) or active count update.",
      linked_list: "Lost next pointer while rewiring, or Floyd move order wrong.",
    };
    return hints[p] || `Output ${fmt(got)} ≠ ${fmt(exp)}. Re-walk the worked example on this sample.`;
  }

  function nextAction(problem, f) {
    const p = problem.pattern;
    const map = {
      sliding_window: "Play the worked example; watch L move when a duplicate appears — then fix your left update.",
      two_pointers: "Step the L/R movie; ensure you move only one pointer per iteration.",
      binary_search: "Write the invariant in a comment; fix the mid branch that discards the wrong half.",
      binary_search_answer: "Print can(mid) for two mids by hand on the sample; fix the predicate.",
      hash_map: "Trace seen{} on sample test #1; fix complement lookup order.",
      dp: "Fill the DP table on paper for the sample; fix base or transition.",
      monotonic_stack: "Replay pops when current > stack top; fix what you store (indices vs values).",
      difference_array: "Apply one update on paper to diff[]; fix R+1 or reconstruct loop.",
      sweep_line: "List events for the sample; fix sort key or active+=delta.",
      linked_list: "Draw 3 nodes; simulate prev/cur/nxt once; fix the rewire order.",
      bit_manipulation: "XOR the sample by hand; ensure you fold every element.",
    };
    return map[p] || "Re-run the worked example on test #1, then change one thing and Run again.";
  }

  function comparePayload(problem, report) {
    const sample = problem.tests && problem.tests[0];
    if (!sample) return null;
    let yours = null;
    let passed0 = null;
    if (report && report.results && report.results[0]) {
      yours = report.results[0].got;
      passed0 = report.results[0].passed;
    }
    return {
      args: sample.args,
      expected: sample.expected,
      yours,
      passed0,
      pattern: problem.pattern,
      mentalModel: problem.mentalModel,
    };
  }

  function interviewChecklist(problem, report, elapsedSec) {
    const items = [
      { ok: !!report && report.ok, label: "All tests passed" },
      { ok: elapsedSec <= (problem.time_limit_minutes || 25) * 60, label: `Finished within time (${elapsedSec}s)` },
      { ok: true, label: `Named pattern: ${problem.pattern}` },
      { ok: true, label: "Can state complexity (time/space) out loud" },
      { ok: !!report && report.ok, label: "Walked one example without looking at code" },
    ];
    return items;
  }

  /** Tiny Web Audio blip — no asset files. */
  function playCue(kind, enabled) {
    if (!enabled) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = playCue._ctx || (playCue._ctx = new Ctx());
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      if (kind === "pass") {
        o.frequency.value = 660;
        g.gain.setValueAtTime(0.04, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        o.start(now);
        o.stop(now + 0.12);
      } else if (kind === "fail") {
        o.frequency.value = 180;
        g.gain.setValueAtTime(0.05, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        o.start(now);
        o.stop(now + 0.18);
      } else {
        o.frequency.value = 440;
        g.gain.setValueAtTime(0.03, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        o.start(now);
        o.stop(now + 0.08);
      }
    } catch {
      /* ignore */
    }
  }

  window.ArenaCoach = {
    STREAK_GOAL,
    COACH_OPENERS,
    PATTERN_SIGNALS,
    loadDeliberate,
    saveDeliberate,
    recordPass,
    recordFail,
    weakPatterns,
    highlightSignals,
    buildMicroDrill,
    skeletonLines,
    diagnoseFailure,
    comparePayload,
    interviewChecklist,
    playCue,
    escapeHtml,
    fmt,
  };
})();
