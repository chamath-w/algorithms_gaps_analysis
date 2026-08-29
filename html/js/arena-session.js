/**
 * Coached Session engine for the Practice Arena.
 *
 * Loop: pick a puzzle -> Socratic plan gate (approach + complexity) -> code ->
 * run -> diagnose the gap -> escalate coaching -> repeat until the exit bar is
 * met (2 consecutive clean solves per pattern; clean = first Run passes with no
 * hints or reveals).
 *
 * Offline only: no LLM, no network. All coaching is derived from the pattern
 * knowledge base below plus the structural diff from ArenaCoach.
 */
(function () {
  const KEY = "arena_session_v1";
  const CLEAN_GOAL = 2;
  const MAX_LEVEL = 4;

  /* ===================================================================
   * Pattern knowledge base — the material the coach teaches from.
   * plan:      canonical approach steps (shown after the plan gate)
   * keywords:  scored against the learner's own wording
   * invariant: the one sentence that makes the pattern correct
   * probe:     level-1 question (makes them look, does not give the answer)
   * lesson:    level-3 micro-lesson bullets (repairs the mental model)
   * time/space + alts: plan-gate complexity multiple choice
   * =================================================================== */
  const KB = {
    sliding_window: {
      plan: [
        "Decide what the window tracks (sum, frequency map, distinct count).",
        "Expand: add arr[right] to the window state each step.",
        "Contract: while the window is invalid, remove arr[left] and advance left.",
        "Record the answer at every valid window using right - left + 1.",
      ],
      keywords: ["window", "left", "right", "expand", "shrink", "contract", "map", "set", "count", "sum"],
      invariant: "Everything between left and right is a valid window; each element enters and leaves at most once, so the whole scan is O(n).",
      probe: "For the failing case, at which index does your window first become invalid — and does left move before or after you record the answer?",
      lesson: [
        "Order matters: update state, then restore validity, then record. Recording inside an invalid window is the classic off-by-one.",
        "Window length is right - left + 1 when both ends are inclusive. If you store left as exclusive, the formula changes — pick one convention and keep it.",
        "For 'longest' you shrink only while invalid. For 'smallest' you shrink while still valid, recording before each shrink.",
      ],
      time: "O(n)",
      space: "O(k)",
      timeAlts: ["O(n log n)", "O(n * k)", "O(n^2)"],
      spaceAlts: ["O(1)", "O(n^2)", "O(n log n)"],
    },
    two_pointers: {
      plan: [
        "Confirm the input is sorted (or sort it) if the pointers converge.",
        "Start left = 0, right = n - 1 (or slow = fast = head).",
        "Compare against the target and move exactly one pointer per step.",
        "Stop when the pointers meet or cross.",
      ],
      keywords: ["left", "right", "sorted", "converge", "slow", "fast", "move", "pointer"],
      invariant: "Every pair you discarded by moving a pointer was provably not the answer — that is what makes one pass sufficient.",
      probe: "On the failing case, which pointer did you move, and can you justify that the pair you just discarded could never be the answer?",
      lesson: [
        "Converging two pointers require sorted input. On unsorted data the discard argument collapses — use a hash map instead.",
        "Move exactly one pointer per iteration. Moving both can skip the answer; moving neither loops forever.",
        "left < right excludes the same element twice; left <= right includes it. Pick based on whether an element may pair with itself.",
      ],
      time: "O(n)",
      space: "O(1)",
      timeAlts: ["O(n log n)", "O(n^2)", "O(log n)"],
      spaceAlts: ["O(n)", "O(log n)", "O(n^2)"],
    },
    binary_search: {
      plan: [
        "Define the search space [lo, hi) and the predicate.",
        "Loop while lo < hi, take mid = (lo + hi) // 2.",
        "Discard exactly half: lo = mid + 1 or hi = mid.",
        "Return lo — the first index where the predicate flips.",
      ],
      keywords: ["lo", "hi", "mid", "half", "predicate", "monotonic", "boundary", "sorted"],
      invariant: "The answer always stays inside [lo, hi); every iteration strictly shrinks that range, so the loop must terminate.",
      probe: "Print lo, hi and mid for the failing case. Which iteration discards the half that actually contains the answer?",
      lesson: [
        "lo = mid + 1 is mandatory on the right branch. lo = mid stalls when mid == lo and the loop never ends.",
        "hi = mid (not mid - 1) when mid may still be the answer. Mixing the two conventions is the usual off-by-one.",
        "Return lo, not mid. After the loop lo == hi is the boundary; mid is just the last probe.",
      ],
      time: "O(log n)",
      space: "O(1)",
      timeAlts: ["O(n)", "O(n log n)", "O(1)"],
      spaceAlts: ["O(log n)", "O(n)", "O(n log n)"],
    },
    bfs: {
      plan: [
        "Seed a deque with the start node and mark it visited immediately.",
        "Pop from the left, process the node.",
        "For each unvisited neighbour: mark visited, then enqueue.",
        "Track distance per level (or store (node, dist) in the queue).",
      ],
      keywords: ["queue", "deque", "visited", "level", "popleft", "neighbour", "neighbor", "shortest"],
      invariant: "Nodes leave the queue in non-decreasing distance order, so the first time you reach a node is by a shortest path.",
      probe: "Did you mark a node visited when you enqueued it, or when you popped it? Count how many times the failing node enters the queue.",
      lesson: [
        "Mark visited at enqueue time. Marking at dequeue lets the same node enter the queue many times and breaks the O(V+E) bound.",
        "BFS gives shortest paths only when every edge costs the same. Weighted edges need Dijkstra.",
        "For level-by-level answers, snapshot len(queue) before the inner loop — that is exactly one level.",
      ],
      time: "O(V + E)",
      space: "O(V)",
      timeAlts: ["O(V log V)", "O(V^2)", "O(E log V)"],
      spaceAlts: ["O(1)", "O(E log V)", "O(V^2)"],
    },
    dfs: {
      plan: [
        "Pick recursion or an explicit stack.",
        "Handle the base case first: null, out of bounds, or already visited.",
        "Mark visited, then recurse into each neighbour.",
        "Undo state on the way out only if you are enumerating paths.",
      ],
      keywords: ["stack", "recursion", "visited", "base case", "neighbour", "neighbor", "backtrack", "depth"],
      invariant: "Every node is entered once; the visited set is what turns an exponential walk into a linear traversal.",
      probe: "For the failing case, is the base case checked before or after you mark the node visited — and can a node be entered twice?",
      lesson: [
        "Guard first, mark second, recurse third. Marking after recursing revisits nodes and can hang on cycles.",
        "Grid DFS needs all four bounds checks plus the visited check in the same guard, before any indexing.",
        "Only pop/unmark on the way out when you enumerate paths. For connectivity, leave nodes marked.",
      ],
      time: "O(V + E)",
      space: "O(V)",
      timeAlts: ["O(V log V)", "O(V^2)", "O(E log V)"],
      spaceAlts: ["O(1)", "O(E log V)", "O(V^2)"],
    },
    topological_sort: {
      plan: [
        "Build adjacency u -> v and indegree[v] for every edge u -> v.",
        "Seed a queue with every node whose indegree is 0.",
        "Pop, append to the order, decrement each neighbour's indegree.",
        "Enqueue neighbours that hit 0; a short order means a cycle.",
      ],
      keywords: ["indegree", "queue", "kahn", "order", "cycle", "dependency", "edge", "adjacency"],
      invariant: "A node is emitted only after every prerequisite has been emitted, so the output order always respects the edges.",
      probe: "For edge u -> v, which side did you increment the indegree on? Print the initial indegree array for the failing case.",
      lesson: [
        "Edge u -> v means: adjacency from u, indegree on v. Flipping both silently reverses your order.",
        "Detect cycles by length: if the emitted order is shorter than n, the remaining nodes are in a cycle.",
        "Ties are legitimately ambiguous — several orders can be correct, which is why the checker validates constraints, not one exact list.",
      ],
      time: "O(V + E)",
      space: "O(V)",
      timeAlts: ["O(V log V)", "O(V^2)", "O(E log V)"],
      spaceAlts: ["O(1)", "O(V^2)", "O(E log V)"],
    },
    dp: {
      plan: [
        "Name the state: what does dp[i] mean in one sentence?",
        "Write the transition from smaller states.",
        "Set the base case(s) explicitly.",
        "Iterate in an order where every dependency is already computed.",
      ],
      keywords: ["state", "transition", "base", "dp", "subproblem", "memo", "previous", "max", "min"],
      invariant: "dp[i] is final and correct before any state that depends on it is computed.",
      probe: "Write out dp[] by hand for the failing input. Which is wrong first — the base case or the transition?",
      lesson: [
        "If dp is 1-indexed (dp[i] = best over the first i items) then the value you add is nums[i-1], not nums[i]. That single shift causes most DP failures.",
        "The base case must be reachable from the transition. dp[0] = 0 only works if the transition never reads a negative index.",
        "When the transition only reads dp[i-1] and dp[i-2], collapse to two variables — same recurrence, O(1) space.",
      ],
      time: "O(n)",
      space: "O(1)",
      timeAlts: ["O(n log n)", "O(n^2)", "O(2^n)"],
      spaceAlts: ["O(n^2)", "O(log n)", "O(2^n)"],
    },
    greedy: {
      plan: [
        "Find the sort key that makes the local choice safe.",
        "Sort once by that key.",
        "Scan, keeping only the running state you need.",
        "Extend or commit the current group as you go.",
      ],
      keywords: ["sort", "key", "end", "start", "merge", "local", "scan", "overlap"],
      invariant: "Taking the locally best option never rules out an optimal solution — that exchange argument is what licenses the greedy.",
      probe: "What did you sort by? Construct two intervals where your sort key gives a worse answer than sorting the other way.",
      lesson: [
        "Interval merging sorts by start; interval scheduling (max non-overlapping) sorts by end. Using the wrong key is the whole bug.",
        "Merging is in-place on the last kept interval: if start <= last_end, extend last_end = max(last_end, end); otherwise push a new interval.",
        "Touching intervals ([1,2] and [2,3]) merge only if the problem treats endpoints as inclusive. Decide that before you code.",
      ],
      time: "O(n log n)",
      space: "O(n)",
      timeAlts: ["O(n)", "O(n^2)", "O(log n)"],
      spaceAlts: ["O(1)", "O(n log n)", "O(n^2)"],
    },
    backtracking: {
      plan: [
        "Define what one 'choice' is and what the path holds.",
        "Base case: path is complete -> append a copy.",
        "Loop over choices: apply, recurse, undo.",
        "Prune branches that can no longer succeed.",
      ],
      keywords: ["choose", "explore", "undo", "path", "prune", "recurse", "copy", "used"],
      invariant: "The path is restored to exactly its prior state after each recursive call returns.",
      probe: "Are you appending path or path[:]? Print the results list before and after one recursion returns.",
      lesson: [
        "Append a copy (path[:]). Appending the live list stores a reference that keeps mutating — every result ends up identical or empty.",
        "Every append must be paired with a pop on the same level, including on early returns.",
        "Prune before recursing, not after. A check inside the base case has already paid the full cost of the branch.",
      ],
      time: "O(2^n * n)",
      space: "O(n)",
      timeAlts: ["O(n^2)", "O(n log n)", "O(n!)"],
      spaceAlts: ["O(2^n)", "O(1)", "O(n^2)"],
    },
    heap: {
      plan: [
        "Decide min-heap or max-heap (negate values for max in Python).",
        "For top-K, keep a heap of size K.",
        "Push each element, then pop while the heap exceeds K.",
        "The root is the answer.",
      ],
      keywords: ["heap", "heapq", "push", "pop", "size", "negate", "root", "priority", "k"],
      invariant: "The heap holds exactly the K best elements seen so far, so its root is the K-th best overall.",
      probe: "Print len(heap) after each push and pop. Does it ever drop below K before the input is exhausted?",
      lesson: [
        "Guard the pop with if len(h) > k. An unconditional pop drains the heap and returns garbage.",
        "For the K-th largest use a min-heap of size K (root = answer). For K-th smallest use a max-heap via negation.",
        "heapq is min-only in Python. Push -x for max behaviour and remember to negate again on the way out.",
      ],
      time: "O(n log k)",
      space: "O(k)",
      timeAlts: ["O(n)", "O(n^2)", "O(k log n)"],
      spaceAlts: ["O(1)", "O(n)", "O(n log k)"],
    },
    monotonic_stack: {
      plan: [
        "Decide the stack's order: increasing or decreasing.",
        "Store indices, not values, when you need distances.",
        "While the top breaks the order, pop and settle that element's answer.",
        "Push the current index.",
      ],
      keywords: ["stack", "pop", "monotonic", "next greater", "index", "while", "top"],
      invariant: "Anything still on the stack is waiting for its answer; the moment the order breaks, the popped element's answer is the current value.",
      probe: "Trace the stack for the failing case. At the first pop, is the current value greater or smaller than the top — and which one does the question ask for?",
      lesson: [
        "Next greater: pop while arr[stack[-1]] < current. Using > builds next-smaller and inverts every answer.",
        "Store indices when the answer is a distance; store values only when the answer is the value itself.",
        "Whatever remains on the stack at the end has no answer — leave those as the default (-1 or 0).",
      ],
      time: "O(n)",
      space: "O(n)",
      timeAlts: ["O(n log n)", "O(n^2)", "O(log n)"],
      spaceAlts: ["O(1)", "O(log n)", "O(n^2)"],
    },
    union_find: {
      plan: [
        "parent[i] = i for every node.",
        "find(x): walk to the root, compressing the path.",
        "union(a, b): find both roots; if different, link them.",
        "Decrement the component count on each successful union.",
      ],
      keywords: ["parent", "find", "union", "root", "compression", "rank", "component", "connected"],
      invariant: "Two nodes are connected exactly when find() returns the same root for both.",
      probe: "Print the parent array after each union in the failing case. Does find() ever return a non-root?",
      lesson: [
        "Compare roots, never raw parents. parent[a] == parent[b] is false for nodes that are connected through a longer chain.",
        "Path compression (parent[x] = find(parent[x])) is what makes find near-constant. Without it, chains degrade to O(n).",
        "Only decrement the component count when the two roots actually differed — otherwise you undercount.",
      ],
      time: "O(n α(n))",
      space: "O(n)",
      timeAlts: ["O(n log n)", "O(n^2)", "O(log n)"],
      spaceAlts: ["O(1)", "O(n log n)", "O(n^2)"],
    },
    trie: {
      plan: [
        "Each node holds children (char -> node) and an is_end flag.",
        "insert: walk the word, creating missing children.",
        "Mark is_end on the final node.",
        "search requires is_end; starts_with does not.",
      ],
      keywords: ["trie", "children", "is_end", "prefix", "node", "insert", "search", "walk"],
      invariant: "The path from the root to a node spells exactly one prefix; is_end says whether that prefix is also a stored word.",
      probe: "Does your search return True for a prefix that was never inserted as a full word? Test one directly.",
      lesson: [
        "Without an end marker every prefix looks like a word. is_end is the only thing separating 'app' from 'apple'.",
        "search and starts_with share the same walk; they differ only in the final check.",
        "A missing child means an immediate False — do not keep walking with a None node.",
      ],
      time: "O(L) per operation",
      space: "O(total characters)",
      timeAlts: ["O(n)", "O(n log n)", "O(L log n)"],
      spaceAlts: ["O(1)", "O(L)", "O(n log n)"],
    },
    prefix_sum: {
      plan: [
        "Build pref with pref[0] = 0 and pref[i+1] = pref[i] + a[i].",
        "Answer an inclusive range [l, r] as pref[r+1] - pref[l].",
        "For 'subarray sums to K', store seen prefix counts in a map.",
        "Seed that map with {0: 1} before the scan.",
      ],
      keywords: ["prefix", "cumulative", "range", "pref", "difference", "map", "seen"],
      invariant: "pref[i] is the sum of everything strictly before index i, which is what makes the subtraction exact.",
      probe: "Write pref[] for the failing input by hand. Is your range formula off by exactly one index?",
      lesson: [
        "With pref[i] = sum(a[0:i]), the inclusive range [l, r] is pref[r+1] - pref[l]. Using pref[r] - pref[l-1] breaks at l = 0.",
        "The leading 0 in pref removes every special case for ranges starting at index 0. Keep it.",
        "For counting subarrays with sum K, seed the map with {0: 1} so prefixes that themselves equal K are counted.",
      ],
      time: "O(n) build, O(1) query",
      space: "O(n)",
      timeAlts: ["O(n log n)", "O(n^2)", "O(log n)"],
      spaceAlts: ["O(1)", "O(n log n)", "O(n^2)"],
    },
    hash_map: {
      plan: [
        "Decide the key: raw value, complement, or canonical form.",
        "Scan once.",
        "Check the map before inserting the current element.",
        "Return as soon as the lookup succeeds.",
      ],
      keywords: ["map", "dict", "seen", "complement", "key", "lookup", "insert", "hash"],
      invariant: "The map holds exactly the elements strictly before the current index, so any hit is a genuinely different element.",
      probe: "For the failing case, could your answer be pairing an element with itself? Check the order of your lookup and insert.",
      lesson: [
        "Look up the complement first, then insert the current value. Inserting first lets an element match itself when 2*x == target.",
        "Store indices when the answer is positions, values when it is values. Mixing the two is a silent wrong answer.",
        "For grouping, the key must be a canonical form (sorted tuple, char count) so that equivalent items collide on purpose.",
      ],
      time: "O(n)",
      space: "O(n)",
      timeAlts: ["O(n log n)", "O(n^2)", "O(log n)"],
      spaceAlts: ["O(1)", "O(log n)", "O(n^2)"],
    },
    dijkstra: {
      plan: [
        "dist[] starts at infinity except the source.",
        "Push (0, source) into a min-heap.",
        "Pop the smallest; skip it if the popped distance is stale.",
        "Relax each edge and push improved distances.",
      ],
      keywords: ["heap", "dist", "relax", "stale", "priority", "min", "shortest", "weight"],
      invariant: "When a node is popped with a non-stale distance, that distance is final — no later path can be shorter.",
      probe: "Add a counter for how many times each node is popped. Is any node being processed with an outdated distance?",
      lesson: [
        "Skip stale entries with if d > dist[u]: continue. Python's heapq has no decrease-key, so outdated pairs stay in the heap.",
        "Relax with dist[u] + w < dist[v], then push the improved pair. Pushing unconditionally works but wastes time.",
        "Negative weights break the finality argument entirely — that is Bellman-Ford territory.",
      ],
      time: "O(E log V)",
      space: "O(V)",
      timeAlts: ["O(V + E)", "O(V^2 log V)", "O(V!)"],
      spaceAlts: ["O(1)", "O(E log V)", "O(V^2)"],
    },
    binary_search_answer: {
      plan: [
        "Identify the numeric answer and its range [lo, hi].",
        "Write can(x): is x feasible? It must be monotone.",
        "Binary search: if can(mid), hi = mid, else lo = mid + 1.",
        "Return lo.",
      ],
      keywords: ["feasible", "predicate", "monotone", "can", "lo", "hi", "mid", "minimum", "answer"],
      invariant: "can() is False for everything below the answer and True from the answer upward — one flip, never oscillating.",
      probe: "Evaluate can() by hand at lo, mid and hi for the failing case. Is it really monotone, and which side is feasible?",
      lesson: [
        "Searching for the minimum feasible value: when can(mid) is True keep mid (hi = mid); when False go right (lo = mid + 1).",
        "For the maximum feasible value the branches swap — write which one you want in a comment before coding.",
        "If can() is not monotone the whole method is invalid. Verify the monotonicity claim before optimising the predicate.",
      ],
      time: "O(n log R)",
      space: "O(1)",
      timeAlts: ["O(n)", "O(n^2)", "O(log R)"],
      spaceAlts: ["O(n)", "O(log R)", "O(n log R)"],
    },
    sweep_line: {
      plan: [
        "Turn each interval into two events: (start, +1) and (end, -1).",
        "Sort events by time, and by delta on ties.",
        "Sweep, accumulating the running active count.",
        "Track the answer at each event point.",
      ],
      keywords: ["event", "sort", "sweep", "active", "delta", "start", "end", "overlap"],
      invariant: "After processing every event at time t, the running counter equals the number of intervals covering t.",
      probe: "List your sorted events for the failing case. At a tie between an end and a start, which one is processed first?",
      lesson: [
        "Events must be sorted. An unsorted sweep produces a meaningless running count.",
        "Tie-breaking is the semantic decision: process -1 before +1 if intervals that merely touch do not overlap.",
        "Track the answer after applying each delta, not before, or you miss the peak by one event.",
      ],
      time: "O(n log n)",
      space: "O(n)",
      timeAlts: ["O(n)", "O(n^2)", "O(log n)"],
      spaceAlts: ["O(1)", "O(n log n)", "O(n^2)"],
    },
    linked_list: {
      plan: [
        "Use a dummy head whenever the head itself may change.",
        "Save nxt = cur.next before rewiring anything.",
        "Rewire, then advance prev and cur together.",
        "For middle/cycle, run slow one step and fast two.",
      ],
      keywords: ["dummy", "prev", "cur", "next", "nxt", "rewire", "slow", "fast", "reverse"],
      invariant: "Before every pointer write you still hold a reference to the rest of the list.",
      probe: "Draw three nodes and step your loop once by hand. After the first rewire, can you still reach node 3?",
      lesson: [
        "Save the next pointer first. Writing cur.next = prev before saving it strands the remainder of the list.",
        "A dummy head removes every 'what if we delete the first node' special case.",
        "Floyd's cycle test needs the while fast and fast.next guard, or the two-step advance dereferences None.",
      ],
      time: "O(n)",
      space: "O(1)",
      timeAlts: ["O(n log n)", "O(n^2)", "O(log n)"],
      spaceAlts: ["O(n)", "O(log n)", "O(n^2)"],
    },
    bit_manipulation: {
      plan: [
        "Pick the identity: XOR cancels pairs, AND masks, OR sets.",
        "Fold every element into an accumulator.",
        "Use x & -x to isolate and x & (x - 1) to clear the lowest set bit.",
        "Return the accumulator.",
      ],
      keywords: ["xor", "bit", "mask", "shift", "accumulator", "fold", "parity", "and", "or"],
      invariant: "XOR is associative and self-cancelling, so order does not matter and duplicates vanish.",
      probe: "XOR the failing input by hand, left to right. Does your loop fold every element, including the first?",
      lesson: [
        "x & -x isolates the lowest set bit; x & (x - 1) clears it. Swapping the two is the standard slip.",
        "Seed the XOR accumulator with 0, which is the identity — seeding with arr[0] then re-including it cancels the element out.",
        "Python ints are arbitrary precision: masks do not wrap at 32 bits unless you apply & 0xFFFFFFFF yourself.",
      ],
      time: "O(n)",
      space: "O(1)",
      timeAlts: ["O(n log n)", "O(n^2)", "O(log n)"],
      spaceAlts: ["O(n)", "O(log n)", "O(n^2)"],
    },
    difference_array: {
      plan: [
        "Allocate diff of length n + 1.",
        "For each update (l, r, v): diff[l] += v and diff[r+1] -= v.",
        "Prefix-sum diff once to materialise the final array.",
        "Return the materialised array, not the deltas.",
      ],
      keywords: ["diff", "delta", "range", "update", "prefix", "materialise", "materialize", "r+1"],
      invariant: "diff holds the change at each index; the running prefix sum reconstructs the actual values.",
      probe: "Apply one update by hand to diff[] for the failing case. Did you return diff itself instead of its prefix sum?",
      lesson: [
        "Every range update is two writes: +v at l and -v at r+1. Forgetting the second write leaks the value to the end of the array.",
        "Size the array n + 1 so r+1 is always writable at r == n - 1.",
        "The final prefix pass is mandatory — the difference array is not the answer, it is the recipe for it.",
      ],
      time: "O(n + q)",
      space: "O(n)",
      timeAlts: ["O(n * q)", "O(n log n)", "O(q log n)"],
      spaceAlts: ["O(1)", "O(q)", "O(n log n)"],
    },
  };

  const GENERIC = {
    plan: ["State the approach in one sentence.", "Name the data structure.", "Write the loop.", "Check the edge cases."],
    keywords: ["loop", "check", "return", "track"],
    invariant: "State what must stay true on every iteration.",
    probe: "Which line first produces a value different from what you expected?",
    lesson: [
      "Re-read the failing case and hand-trace the first three iterations.",
      "Write the invariant as a comment above the loop, then verify each line preserves it.",
    ],
    time: "O(n)",
    space: "O(n)",
    timeAlts: ["O(n log n)", "O(n^2)", "O(log n)"],
    spaceAlts: ["O(1)", "O(log n)", "O(n^2)"],
  };

  const kb = (p) => KB[p] || GENERIC;

  /* ===================== persistence ===================== */
  function blank() {
    return {
      active: false,
      startedAt: null,
      targets: [],
      idx: 0,
      clean: {},
      solved: {},
      attemptsTotal: 0,
      aidedSolves: 0,
      gaps: {},
      history: [],
      size: 3,
    };
  }

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      return raw && typeof raw === "object" ? Object.assign(blank(), raw) : blank();
    } catch {
      return blank();
    }
  }

  function save(s) {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* quota — session still works in memory */
    }
  }

  let state = load();

  /* per-puzzle scratch (not persisted; a puzzle is one generated problem) */
  let cur = null;

  function freshPuzzle(problem) {
    return {
      id: problem.id,
      pattern: problem.pattern,
      attempts: 0,
      level: 0,
      hints: 0,
      reveals: 0,
      planOk: null,
      startedAt: Date.now(),
      gates: { plan: false },
    };
  }

  /* ===================== context from the arena ===================== */
  let ctx = null;

  function attach(context) {
    ctx = context;
    render();
  }

  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const say = (lines, action) => {
    if (ctx && typeof ctx.coachSay === "function") ctx.coachSay(lines, action);
  };

  /* ===================== session lifecycle ===================== */
  function pickTargets(size) {
    const all =
      (window.PracticeArena && window.PracticeArena.PATTERN_LIST) ||
      Object.keys(KB);
    if (size === "all") return all.slice();

    const Coach = window.ArenaCoach;
    const n = Number(size) || 3;
    const scored = all.map((id) => {
      const c = state.clean[id] || 0;
      let failRate = 0;
      let touched = 0;
      if (Coach) {
        const d = Coach.loadDeliberate();
        const f = (d.fails && d.fails[id]) || 0;
        const s = (d.solves && d.solves[id]) || 0;
        touched = f + s;
        failRate = touched ? f / touched : 0;
      }
      // Weakest first: unmastered, then high fail rate, then untouched.
      const score = c * 100 - failRate * 10 - (touched === 0 ? 5 : 0);
      return { id, score };
    });
    scored.sort((a, b) => a.score - b.score);
    return scored.slice(0, n).map((x) => x.id);
  }

  function start(size) {
    const targets = pickTargets(size);
    state = Object.assign(blank(), {
      active: true,
      startedAt: Date.now(),
      targets,
      idx: 0,
      size,
    });
    save(state);
    cur = null;
    say(
      [
        `Coached session started: ${targets.length} pattern(s) — ${targets.join(", ")}.`,
        `Exit bar per pattern: ${CLEAN_GOAL} clean solves in a row (first Run passes, no hints, no reveals).`,
        "Each puzzle: state your plan and complexity, then code.",
      ],
      `First target: ${targets[0]}. Answer the micro-drill to begin.`
    );
    render();
    if (ctx && ctx.loadPattern) ctx.loadPattern(targets[0]);
  }

  function stop() {
    state.active = false;
    save(state);
    render();
  }

  const isActive = () => !!state.active;

  function currentTarget() {
    if (!state.active || !state.targets.length) return null;
    return state.targets[Math.min(state.idx, state.targets.length - 1)] || null;
  }

  function cleared(pattern) {
    return (state.clean[pattern] || 0) >= CLEAN_GOAL;
  }

  function advanceIfCleared() {
    while (state.idx < state.targets.length && cleared(state.targets[state.idx])) {
      state.idx += 1;
    }
    save(state);
    return state.idx >= state.targets.length;
  }

  /** Pattern the arena should generate next. */
  function nextPattern() {
    if (!state.active) return null;
    return currentTarget();
  }

  function onProblemLoaded(problem) {
    cur = freshPuzzle(problem);
    render();
  }

  /* ===================== Socratic plan gate ===================== */
  function shuffled(arr, seedStr) {
    let h = 0;
    for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      h = (h * 1664525 + 1013904223) >>> 0;
      const j = h % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function scorePlanText(text, k) {
    const t = String(text || "").toLowerCase();
    if (t.trim().length < 12) return 0;
    const hits = k.keywords.filter((w) => t.includes(w)).length;
    return Math.min(1, hits / Math.max(2, Math.ceil(k.keywords.length * 0.25)));
  }

  /**
   * Renders the plan gate into `el`. Calls onDone() when the learner has
   * submitted and read the feedback. Never blocks progress permanently —
   * a wrong plan is recorded as a gap and taught immediately.
   */
  function renderPlanGate(el, problem, onDone) {
    if (!el) return onDone && onDone();
    const k = kb(problem.pattern);
    const timeOpts = shuffled([k.time].concat(k.timeAlts), problem.id + "t");
    const spaceOpts = shuffled([k.space].concat(k.spaceAlts), problem.id + "s");

    el.hidden = false;
    el.innerHTML = `
      <div class="sess-gate-card">
        <div class="sess-gate-badge">Plan gate · think before you type</div>
        <h3>Before coding: commit to an approach</h3>
        <p class="text-muted">
          Interviews are lost in the first two minutes, not the last. Say the plan,
          commit to the cost, then write it.
        </p>

        <label class="sess-field">
          <span>1. Your approach, in your own words (one or two sentences)</span>
          <textarea id="sess-plan-text" rows="3" spellcheck="false"
            placeholder="e.g. keep a window over the string, expand right, shrink left while a duplicate is inside..."></textarea>
        </label>

        <div class="sess-field">
          <span>2. Target time complexity</span>
          <div class="sess-choices" id="sess-time">
            ${timeOpts
              .map(
                (o) =>
                  `<button type="button" class="sess-choice" data-v="${esc(o)}">${esc(o)}</button>`
              )
              .join("")}
          </div>
        </div>

        <div class="sess-field">
          <span>3. Target space complexity</span>
          <div class="sess-choices" id="sess-space">
            ${spaceOpts
              .map(
                (o) =>
                  `<button type="button" class="sess-choice" data-v="${esc(o)}">${esc(o)}</button>`
              )
              .join("")}
          </div>
        </div>

        <div class="sess-gate-actions">
          <button type="button" class="anim-btn primary" id="sess-plan-submit">Commit plan</button>
          <span class="text-muted" id="sess-plan-note">All three answers required.</span>
        </div>
        <div id="sess-plan-fb"></div>
      </div>`;

    let pickedTime = null;
    let pickedSpace = null;

    const wire = (sel, set) => {
      el.querySelectorAll(`${sel} .sess-choice`).forEach((b) => {
        b.onclick = () => {
          el.querySelectorAll(`${sel} .sess-choice`).forEach((x) => x.classList.remove("picked"));
          b.classList.add("picked");
          set(b.dataset.v);
        };
      });
    };
    wire("#sess-time", (v) => (pickedTime = v));
    wire("#sess-space", (v) => (pickedSpace = v));

    el.querySelector("#sess-plan-submit").onclick = () => {
      const text = el.querySelector("#sess-plan-text").value;
      const note = el.querySelector("#sess-plan-note");
      if (!pickedTime || !pickedSpace || text.trim().length < 12) {
        note.textContent =
          "Write at least a sentence and pick both complexities — guessing is part of the drill.";
        return;
      }
      const planScore = scorePlanText(text, k);
      const timeOk = pickedTime === k.time;
      const spaceOk = pickedSpace === k.space;
      const allOk = timeOk && spaceOk && planScore >= 0.5;

      if (cur) {
        cur.planOk = allOk;
        cur.gates.plan = true;
      }
      if (!timeOk) noteGap(problem.pattern, "complexity-time");
      if (!spaceOk) noteGap(problem.pattern, "complexity-space");
      if (planScore < 0.5) noteGap(problem.pattern, "approach");

      el.querySelectorAll("#sess-time .sess-choice").forEach((b) => {
        if (b.dataset.v === k.time) b.classList.add("ok");
        else if (b.classList.contains("picked")) b.classList.add("bad");
      });
      el.querySelectorAll("#sess-space .sess-choice").forEach((b) => {
        if (b.dataset.v === k.space) b.classList.add("ok");
        else if (b.classList.contains("picked")) b.classList.add("bad");
      });

      el.querySelector("#sess-plan-fb").innerHTML = `
        <div class="sess-plan-fb ${allOk ? "good" : "warn"}">
          <div class="sess-plan-verdict">${
            allOk
              ? "Plan accepted — that is the shape of the answer."
              : "Plan needs repair. Read the canonical plan below before you code."
          }</div>
          <div class="sess-plan-grid">
            <div>
              <div class="sess-plan-label">Canonical plan</div>
              <ol class="sess-plan-steps">${k.plan.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
            </div>
            <div>
              <div class="sess-plan-label">Invariant to hold</div>
              <p class="sess-invariant">${esc(k.invariant)}</p>
              <div class="sess-plan-label">Cost</div>
              <p>Time <code>${esc(k.time)}</code> · Space <code>${esc(k.space)}</code>
                ${timeOk && spaceOk ? "<span class='sess-tick'>both correct</span>" : ""}</p>
            </div>
          </div>
          <button type="button" class="anim-btn primary" id="sess-plan-go">Unlock editor</button>
        </div>`;

      say(
        [
          `Plan gate: ${planScore >= 0.5 ? "approach recognisable" : "approach unclear"}, ` +
            `time ${timeOk ? "correct" : "wrong (" + k.time + ")"}, ` +
            `space ${spaceOk ? "correct" : "wrong (" + k.space + ")"}.`,
          `Invariant: ${k.invariant}`,
        ],
        allOk ? "Now write it — you already know the shape." : "Read the canonical plan, then code it."
      );

      el.querySelector("#sess-plan-go").onclick = () => {
        el.hidden = true;
        if (onDone) onDone();
      };
      render();
    };
  }

  /* ===================== aid + gap tracking ===================== */
  function noteAid(kind) {
    if (!cur) return;
    if (kind === "hint") cur.hints += 1;
    else cur.reveals += 1;
    render();
  }

  function noteGap(pattern, tag) {
    const key = `${pattern}:${tag}`;
    state.gaps[key] = (state.gaps[key] || 0) + 1;
    save(state);
  }

  function classifyGap(problem, report, diag) {
    if (report.compile_error) return "syntax";
    const first = (report.results || []).find((r) => !r.passed);
    if (first && first.error) return "runtime";
    if (report.passed === 0) return "approach";
    if (diag && /index|off|boundary|one/i.test(diag.why || "")) return "off-by-one";
    return "edge-case";
  }

  /* ===================== the coached attempt loop ===================== */
  /**
   * Called after every Run. Returns a verdict object so the arena can decide
   * whether to auto-advance.
   */
  function onAttempt(problem, report, diag) {
    if (!state.active) return { verdict: "inactive" };
    if (!cur || cur.id !== problem.id) cur = freshPuzzle(problem);

    cur.attempts += 1;
    state.attemptsTotal += 1;

    const k = kb(problem.pattern);
    const aided = cur.hints > 0 || cur.reveals > 0;

    if (report.ok) {
      const clean = cur.attempts === 1 && !aided;
      state.solved[problem.pattern] = (state.solved[problem.pattern] || 0) + 1;
      if (clean) {
        state.clean[problem.pattern] = (state.clean[problem.pattern] || 0) + 1;
      } else {
        state.clean[problem.pattern] = 0;
        state.aidedSolves += 1;
      }
      state.history.push({
        pattern: problem.pattern,
        attempts: cur.attempts,
        aided,
        clean,
        passed: true,
        ts: Date.now(),
      });

      const have = state.clean[problem.pattern] || 0;
      const done = advanceIfCleared();
      save(state);
      render();

      if (cleared(problem.pattern)) {
        if (done) {
          say(
            [
              `${problem.pattern} cleared — ${CLEAN_GOAL}/${CLEAN_GOAL} clean solves.`,
              "Every target in this session is at the bar.",
            ],
            "Session complete — open the report."
          );
          return { verdict: "session-complete" };
        }
        const nxt = currentTarget();
        say(
          [
            `${problem.pattern} cleared — ${CLEAN_GOAL}/${CLEAN_GOAL} clean solves.`,
            `Next target: ${nxt}.`,
          ],
          `Move on: New problem loads ${nxt}.`
        );
        return { verdict: "pattern-cleared", next: nxt };
      }

      if (clean) {
        say(
          [
            `Clean solve — first Run, no aid. ${have}/${CLEAN_GOAL} on ${problem.pattern}.`,
            `Say the invariant out loud before the next one: ${k.invariant}`,
          ],
          `One more clean solve on ${problem.pattern} to clear it.`
        );
        return { verdict: "clean", clean: have };
      }
      say(
        [
          `Passed, but not clean (${cur.attempts} attempt(s)${aided ? ", aid used" : ""}). Clean counter reset to 0.`,
          "The bar is a first-Run pass with no hints — that is what recall under pressure looks like.",
        ],
        `Same pattern again from a blank editor.`
      );
      return { verdict: "aided-pass", clean: 0 };
    }

    /* ---------- failure: escalate ---------- */
    state.clean[problem.pattern] = 0;
    cur.level = Math.min(MAX_LEVEL, cur.attempts);
    const gap = classifyGap(problem, report, diag);
    noteGap(problem.pattern, gap);
    state.history.push({
      pattern: problem.pattern,
      attempts: cur.attempts,
      aided,
      clean: false,
      passed: false,
      gap,
      ts: Date.now(),
    });
    save(state);

    const teach = buildEscalation(problem, report, diag, cur.level, k, gap);
    renderTeach(teach);
    say(teach.coach, teach.action);
    render();
    return { verdict: "fail", level: cur.level, gap };
  }

  function buildEscalation(problem, report, diag, level, k, gap) {
    const first = (report.results || []).find((r) => !r.passed);
    const caseLine = first
      ? `Case ${first.index}: ${problem.functionName}(${(first.args || [])
          .map((a) => JSON.stringify(a))
          .join(", ")}) → got ${JSON.stringify(first.got)}, expected ${JSON.stringify(first.expected)}`
      : "";

    if (level <= 1) {
      return {
        level,
        badge: "Level 1 · Diagnose it yourself",
        title: "Do not change code yet — locate the gap",
        body: [
          caseLine,
          k.probe,
          "Hand-trace that single case for three iterations and write down where your value first diverges.",
        ],
        note: "No hint yet on purpose. Finding your own bug is the skill being trained.",
        coach: [`Attempt 1 failed (${gap}).`, k.probe],
        action: "Hand-trace the failing case before editing.",
      };
    }
    if (level === 2) {
      return {
        level,
        badge: "Level 2 · Targeted hint",
        title: "Here is where this pattern usually breaks",
        body: [caseLine, (diag && diag.why) || "", (diag && diag.action) || ""].filter(Boolean),
        note: `Invariant to restore: ${k.invariant}`,
        coach: [`Attempt 2 failed (${gap}).`, (diag && diag.why) || k.probe],
        action: (diag && diag.action) || "Apply the hint, then Run.",
      };
    }
    if (level === 3) {
      return {
        level,
        badge: "Level 3 · Micro-lesson",
        title: `Mental model repair — ${problem.pattern}`,
        body: k.lesson,
        note: `Invariant: ${k.invariant}`,
        plan: k.plan,
        coach: [
          `Attempt 3 failed (${gap}). Reading the micro-lesson now.`,
          k.lesson[0],
        ],
        action: "Read the lesson, delete your loop, and rewrite it from the canonical plan.",
      };
    }
    return {
      level,
      badge: "Level 4 · Guided repair",
      title: "Reset and rebuild from the canonical base",
      body: [
        "You have spent four attempts on one puzzle — the gap is in the base template, not in this problem.",
        "Reveal the model answer, read it once, then hide it and retype from memory.",
        "Then drill this pattern in Implementation Games until you can type the base without aid.",
      ],
      note: `Invariant: ${k.invariant}`,
      plan: k.plan,
      link: { href: "games.html", label: "Implementation Games — drill this base" },
      coach: [
        `Attempt ${level}: switching to guided repair.`,
        "Reveal, study, hide, retype. Then come back to a fresh puzzle on this pattern.",
      ],
      action: "Reveal the model answer, then rebuild it from memory.",
    };
  }

  function renderTeach(teach) {
    const el = ctx && ctx.teachEl;
    if (!el) return;
    el.hidden = false;
    el.innerHTML = `
      <div class="sess-teach sess-level-${teach.level}">
        <div class="sess-teach-badge">${esc(teach.badge)}</div>
        <h3>${esc(teach.title)}</h3>
        <ul class="sess-teach-body">
          ${teach.body.map((b) => `<li>${esc(b)}</li>`).join("")}
        </ul>
        ${teach.plan ? `<div class="sess-teach-label">Canonical plan</div>
          <ol class="sess-plan-steps">${teach.plan.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : ""}
        ${teach.note ? `<p class="sess-invariant">${esc(teach.note)}</p>` : ""}
        ${
          teach.link
            ? `<p><a class="anim-btn" href="${esc(teach.link.href)}">${esc(teach.link.label)}</a></p>`
            : ""
        }
      </div>`;
  }

  /* ===================== session panel UI ===================== */
  function render() {
    const el = ctx && ctx.panelEl;
    if (!el) return;

    if (!state.active) {
      el.innerHTML = `
        <div class="sess-head">
          <div>
            <div class="sess-title">Coached session</div>
            <div class="sess-sub">
              Puzzle → plan gate → code → diagnosis → escalating coaching, until
              each pattern reaches ${CLEAN_GOAL} clean solves in a row.
            </div>
          </div>
          <div class="sess-actions">
            <label class="sess-size">Targets
              <select id="sess-size">
                <option value="3">3 weakest patterns</option>
                <option value="5">5 weakest patterns</option>
                <option value="all">All 21 (marathon)</option>
              </select>
            </label>
            <button type="button" class="anim-btn primary" id="sess-start">Start session</button>
            ${state.history.length ? `<button type="button" class="anim-btn" id="sess-report">Last report</button>` : ""}
          </div>
        </div>`;
      el.querySelector("#sess-start").onclick = () => start(el.querySelector("#sess-size").value);
      const rep = el.querySelector("#sess-report");
      if (rep) rep.onclick = showReport;
      return;
    }

    const target = currentTarget();
    const chips = state.targets
      .map((p) => {
        const c = state.clean[p] || 0;
        const done = c >= CLEAN_GOAL;
        const active = p === target;
        return `<span class="sess-chip ${done ? "done" : ""} ${active ? "active" : ""}">
          ${esc(p)} <b>${done ? "✓" : c + "/" + CLEAN_GOAL}</b></span>`;
      })
      .join("");

    const attempts = cur ? cur.attempts : 0;
    const aid = cur ? cur.hints + cur.reveals : 0;
    const stepText = cur
      ? `Attempt ${attempts} · aid used ${aid} · ${
          cur.gates.plan ? "plan committed" : "plan gate pending"
        }`
      : "Loading puzzle…";

    el.innerHTML = `
      <div class="sess-head">
        <div>
          <div class="sess-title">Coached session · target <code>${esc(target || "—")}</code></div>
          <div class="sess-sub">${esc(stepText)}</div>
        </div>
        <div class="sess-actions">
          <button type="button" class="anim-btn" id="sess-skip">Skip pattern</button>
          <button type="button" class="anim-btn" id="sess-end">End &amp; report</button>
        </div>
      </div>
      <div class="sess-track">${chips}</div>
      <div class="sess-bar">
        <span>Exit bar: ${CLEAN_GOAL} consecutive clean solves — first Run passes, no hints, no reveals.</span>
      </div>`;

    el.querySelector("#sess-end").onclick = () => {
      stop();
      showReport();
    };
    el.querySelector("#sess-skip").onclick = () => {
      state.idx = Math.min(state.idx + 1, state.targets.length);
      save(state);
      if (state.idx >= state.targets.length) {
        stop();
        showReport();
        return;
      }
      const nxt = currentTarget();
      say([`Skipped — moving to ${nxt}.`], `New target: ${nxt}.`);
      render();
      if (ctx && ctx.loadPattern) ctx.loadPattern(nxt);
    };
  }

  function showReport() {
    const el = ctx && ctx.reportEl;
    if (!el) return;
    const mins = state.startedAt ? Math.round((Date.now() - state.startedAt) / 60000) : 0;
    const attempted = state.history.length;
    const passes = state.history.filter((h) => h.passed).length;
    const cleans = state.history.filter((h) => h.clean).length;

    const gapRows = Object.entries(state.gaps)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([key, n]) => {
        const [pat, tag] = key.split(":");
        return `<li><code>${esc(pat)}</code> — ${esc(tag)} <span class="text-muted">×${n}</span></li>`;
      })
      .join("");

    const cleared = state.targets.filter((p) => (state.clean[p] || 0) >= CLEAN_GOAL);
    const open = state.targets.filter((p) => (state.clean[p] || 0) < CLEAN_GOAL);

    el.hidden = false;
    el.innerHTML = `
      <div class="sess-report">
        <h3>Session report</h3>
        <div class="sess-report-stats">
          <div><b>${cleared.length}/${state.targets.length}</b><span>patterns cleared</span></div>
          <div><b>${cleans}</b><span>clean solves</span></div>
          <div><b>${passes}/${attempted}</b><span>runs passed</span></div>
          <div><b>${mins}m</b><span>elapsed</span></div>
        </div>
        ${
          cleared.length
            ? `<p><strong>Cleared:</strong> ${cleared.map((p) => `<code>${esc(p)}</code>`).join(" ")}</p>`
            : ""
        }
        ${
          open.length
            ? `<p><strong>Still below the bar:</strong> ${open
                .map((p) => `<code>${esc(p)}</code>`)
                .join(" ")}</p>`
            : ""
        }
        ${
          gapRows
            ? `<div class="sess-report-label">Gaps that cost you the most</div><ul class="sess-gap-list">${gapRows}</ul>`
            : `<p class="text-muted">No recorded gaps — either a flawless session or a very short one.</p>`
        }
        <div class="sess-report-label">Do next</div>
        <ul class="sess-gap-list">
          ${
            open.length
              ? `<li>Drill <code>${esc(open[0])}</code> in <a href="games.html">Implementation Games</a> until you can type the base unaided, then restart a session on it.</li>`
              : `<li>Raise the bar: run a marathon session (all 21) or turn on Interview mode in free play.</li>`
          }
          <li>Replay the movie for weak patterns in the <a href="algo_memory.html">Algorithm Memory Lab</a>.</li>
        </ul>
        <button type="button" class="anim-btn" id="sess-report-close">Close report</button>
      </div>`;
    el.querySelector("#sess-report-close").onclick = () => {
      el.hidden = true;
    };
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  window.ArenaSession = {
    CLEAN_GOAL,
    KB,
    attach,
    start,
    stop,
    isActive,
    nextPattern,
    currentTarget,
    onProblemLoaded,
    renderPlanGate,
    onAttempt,
    noteAid,
    noteGap,
    showReport,
    render,
    getState: () => state,
    resetAll: () => {
      state = blank();
      save(state);
      render();
    },
  };
})();
