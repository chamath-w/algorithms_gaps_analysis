/**
 * Offline interactive course engine.
 * localStorage progress, quizzes, SRS flashcards, tutor — no network.
 */
(function () {
  const STORAGE_KEY = "cs_course_progress_v1";

  const defaultState = () => ({
    version: 1,
    lessons: {},
    cards: {},
    quizLog: [],
    practiceSolved: 0,
    practiceFailed: 0,
  });

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch {
      return defaultState();
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function now() {
    return Date.now();
  }

  function ensureCard(state, id) {
    if (!state.cards[id]) {
      state.cards[id] = {
        id,
        ease: 2.5,
        intervalDays: 0,
        reps: 0,
        due: now(),
        lapses: 0,
      };
    }
    return state.cards[id];
  }

  function reviewCard(state, id, grade) {
    const c = ensureCard(state, id);
    if (grade === "again") {
      c.reps = 0;
      c.intervalDays = 0;
      c.ease = Math.max(1.3, c.ease - 0.2);
      c.lapses += 1;
      c.due = now() + 10 * 60 * 1000;
    } else {
      if (c.reps === 0) c.intervalDays = grade === "easy" ? 2 : 1;
      else if (c.reps === 1) c.intervalDays = grade === "easy" ? 4 : 3;
      else {
        const mult =
          grade === "hard" ? 1.2 : grade === "easy" ? c.ease * 1.3 : c.ease;
        c.intervalDays = Math.max(1, c.intervalDays * mult);
      }
      if (grade === "hard") c.ease = Math.max(1.3, c.ease - 0.15);
      if (grade === "easy") c.ease += 0.15;
      c.reps += 1;
      c.due = now() + c.intervalDays * 86400000;
    }
    saveState(state);
    return c;
  }

  function dueCards(state) {
    const t = now();
    return Object.values(state.cards)
      .filter((c) => c.due <= t)
      .sort((a, b) => a.due - b.due);
  }

  function markLesson(id, status) {
    const state = loadState();
    state.lessons[id] = { status, at: now() };
    saveState(state);
  }

  /* ---------- Quiz bank (mirrors Python quiz topics) ---------- */
  const QUIZ = [
    {
      id: "dm1",
      track: "discrete_math",
      topic: "logic",
      q: "¬(P ∧ Q) is equivalent to?",
      choices: ["¬P ∧ ¬Q", "¬P ∨ ¬Q", "P ∨ ¬Q", "P → Q"],
      answer: 1,
      explain: "De Morgan: flip the connective when negating.",
      model: "Series ↔ parallel under negation.",
      card: "card_demorgan",
      tutorTopic: "logic",
    },
    {
      id: "dm2",
      track: "discrete_math",
      topic: "proofs",
      q: "Induction requires:",
      choices: [
        "Only base case",
        "Base + inductive step",
        "Only inductive step",
        "A counterexample",
      ],
      answer: 1,
      explain: "P(1) and P(k)⇒P(k+1).",
      model: "Initial condition + recurrence.",
      card: "card_induction",
      tutorTopic: "proofs",
    },
    {
      id: "dsa1",
      track: "dsa",
      topic: "sliding_window",
      q: "Longest substring with ≤ K distinct chars → ?",
      choices: ["DFS", "Sliding window + map", "Dijkstra", "Union-Find"],
      answer: 1,
      explain: "Contiguous + constraint ⇒ expand/shrink window.",
      model: "Invariant: distinct ≤ K.",
      card: "card_sliding_window",
      tutorTopic: "sliding_window",
    },
    {
      id: "dsa2",
      track: "dsa",
      topic: "bfs",
      q: "Unweighted shortest path uses:",
      choices: ["DFS", "BFS", "Binary search", "Kadane"],
      answer: 1,
      explain: "First reach via BFS = min edges.",
      model: "Wavefront on a mesh.",
      card: "card_bfs",
      tutorTopic: "bfs",
    },
    {
      id: "dsa3",
      track: "dsa",
      topic: "dp",
      q: "Kadane computes:",
      choices: ["LIS", "Max subarray sum", "Edit distance", "MST"],
      answer: 1,
      explain: "best ending here vs global best.",
      model: "1D DP state = best ending at i.",
      card: "card_kadane",
      tutorTopic: "dp",
    },
    {
      id: "dsa4",
      track: "dsa",
      topic: "binary_search",
      q: "Binary search on answers needs:",
      choices: ["Hashing", "Monotone predicate", "A stack", "Negative weights"],
      answer: 1,
      explain: "FFFTTT cutoff on the answer domain.",
      model: "Successive approximation.",
      card: "card_binary_search",
      tutorTopic: "binary_search",
    },
    {
      id: "toc1",
      track: "theory",
      topic: "automata",
      q: "Every NFA has an equivalent:",
      choices: ["Only CFG", "DFA", "Only TM", "Nothing"],
      answer: 1,
      explain: "Subset construction.",
      model: "Powerset of states.",
      card: "card_nfa_dfa",
      tutorTopic: "automata",
    },
    {
      id: "toc2",
      track: "theory",
      topic: "complexity",
      q: "Poly-time for one NP-complete problem implies:",
      choices: ["P = NP", "P ≠ NP", "Nothing", "Only NP ⊆ PSPACE"],
      answer: 0,
      explain: "NPC problems poly-reduce among NP.",
      model: "Universal hardest load.",
      card: "card_npc",
      tutorTopic: "complexity",
    },
    {
      id: "arch1",
      track: "architecture",
      topic: "cache",
      q: "False sharing is when:",
      choices: [
        "Cores write different vars on same cache line",
        "Page fault",
        "TLS fails",
        "Fair mutex",
      ],
      answer: 0,
      explain: "Coherence invalidates the whole line.",
      model: "Shared bus word ping-pong.",
      card: "card_false_sharing",
      tutorTopic: "cache",
    },
    {
      id: "sec1",
      track: "security",
      topic: "security",
      q: "Authn vs authz:",
      choices: [
        "Same",
        "Authn=who; Authz=what allowed",
        "Authn=encrypt",
        "Browser-only",
      ],
      answer: 1,
      explain: "Identity ≠ permissions.",
      model: "Badge vs room ACL.",
      card: "card_auth",
      tutorTopic: "security",
    },
    {
      id: "sd1",
      track: "systems_design",
      topic: "systems",
      q: "Under partition, CAP forces a choice between:",
      choices: ["C and A", "Throughput only", "Encryption", "Both C and A fully"],
      answer: 0,
      explain: "Can't have both perfect C and A when partitioned.",
      model: "Broken link: stale or refuse.",
      card: "card_cap",
      tutorTopic: "systems",
    },
    {
      id: "mem1",
      track: "dsa",
      topic: "memory",
      q: "Monotonic stack (next greater): while stack and A[top] ____ A[i], pop.",
      choices: ["<", ">", "==", "%"],
      answer: 0,
      explain: "Pop while top smaller than current.",
      model: "LIFO candidates for next greater.",
      card: "card_mono_stack",
      tutorTopic: "stack",
    },
    {
      id: "mem2",
      track: "dsa",
      topic: "memory",
      q: "Sliding window variable: expand ____, then shrink ____ while invalid.",
      choices: ["right; left", "left; right", "mid; mid", "both ends inward only"],
      answer: 0,
      explain: "Classic expand-R / shrink-L.",
      model: "Window invariant maintained in O(1) updates.",
      card: "card_sliding_window",
      tutorTopic: "sliding_window",
    },
    {
      id: "mem3",
      track: "dsa",
      topic: "memory",
      q: "Binary search on answer searches…",
      choices: [
        "a numeric answer with monotone can(x)",
        "only an index in an unsorted array",
        "all subsets via bitmask",
        "shortest path weights",
      ],
      answer: 0,
      explain: "Feasibility line FFF…TTT — not array index search.",
      model: "Successive approximation on the answer.",
      card: "card_bs_answer",
      tutorTopic: "binary_search_answer",
    },
    {
      id: "mem4",
      track: "dsa",
      topic: "memory",
      q: "Difference array: for update [L,R]+=val you…",
      choices: [
        "diff[L]+=val; diff[R+1]-=val; then prefix",
        "sort then binary search",
        "XOR all values",
        "BFS from L to R",
      ],
      answer: 0,
      explain: "Encode range writes as two point updates.",
      model: "Impulse then integrate.",
      card: "card_diff_array",
      tutorTopic: "difference_array",
    },
    {
      id: "mem5",
      track: "dsa",
      topic: "memory",
      q: "Kahn topological sort starts by queueing…",
      choices: [
        "all indegree-0 nodes",
        "the highest weight edge",
        "a random node",
        "all leaves of a binary tree only",
      ],
      answer: 0,
      explain: "Peel ready nodes; leftover ⇒ cycle.",
      model: "Dependency assembly order.",
      card: "card_topo",
      tutorTopic: "bfs",
    },
    {
      id: "mem6",
      track: "dsa",
      topic: "memory",
      q: "Linked list reverse pointer trio is…",
      choices: ["prev, cur, nxt", "lo, mid, hi", "slow only", "parent, child, root"],
      answer: 0,
      explain: "Save next before rewiring cur.next = prev.",
      model: "Pointer rewiring.",
      card: "card_linked_list",
      tutorTopic: "linked_list",
    },
    {
      id: "mem7",
      track: "dsa",
      topic: "memory",
      q: "Sweep line concurrency: events are typically…",
      choices: [
        "+1 at start, −1 at end; sort and scan",
        "XOR of all endpoints",
        "Dijkstra relaxations",
        "prefix of character frequencies only",
      ],
      answer: 0,
      explain: "Active count is instantaneous load.",
      model: "Timeline edges.",
      card: "card_sweep",
      tutorTopic: "sweep_line",
    },
    {
      id: "mem8",
      track: "dsa",
      topic: "memory",
      q: "Single number (others twice) in O(1) space: …",
      choices: ["XOR everything", "sort then scan only", "BFS", "segment tree required"],
      answer: 0,
      explain: "a^a=0, a^0=a.",
      model: "Pairs cancel.",
      card: "card_bits",
      tutorTopic: "bit_manipulation",
    },
  ];

  const TUTOR = {
    sliding_window: {
      title: "Recompute vs slide",
      why: "Nested L..R loops recompute. Slide updates in O(1).",
      ee: "Moving-average FIR: add new, subtract leaving.",
      repair: "Invariant: window always valid; expand/shrink.",
      html: "patterns.html#sliding_window",
    },
    bfs: {
      title: "DFS vs BFS for shortest",
      why: "Unweighted shortest needs BFS wavefront.",
      ee: "Mesh wavefront vs depth probe.",
      repair: "Queue + seen; first hit = min edges.",
      html: "patterns.html#bfs",
    },
    dp: {
      title: "Missing DP state",
      why: "State must capture what the future needs.",
      ee: "Missing flip-flop bit → histories collide.",
      repair: "Meaning → base → transition → order → answer.",
      html: "deep_dives.html",
    },
    binary_search: {
      title: "Bounds / monotone",
      why: "Need monotone predicate and clear lo/hi invariant.",
      ee: "Successive approximation discarding half.",
      repair: "Comment the invariant each iteration.",
      html: "patterns.html#binary_search",
    },
    stack: {
      title: "Nesting needs a stack",
      why: "LIFO matches nesting / next-greater.",
      ee: "Call stack / scopes.",
      repair: "Push indices; pop while order violated.",
      html: "patterns.html#monotonic_stack",
    },
    logic: {
      title: "Logic transform gap",
      why: "Negation flips connectives (De Morgan).",
      ee: "Series/parallel duality.",
      repair: "Rewrite with truth table for 2–3 vars.",
      html: "discrete_math.html#logic",
    },
    proofs: {
      title: "Induction gap",
      why: "Need base and step.",
      ee: "Initial condition + update rule.",
      repair: "Write P(n) explicitly before proving.",
      html: "discrete_math.html#proofs",
    },
    complexity: {
      title: "P / NP confusion",
      why: "NPC are hardest in NP under reductions.",
      ee: "Universal hardest load.",
      repair: "Certificate checkable in poly time + reduction.",
      html: "theory.html#complexity",
    },
    cache: {
      title: "Ignoring locality",
      why: "Cache lines dominate constants.",
      ee: "Fetch whole bus word.",
      repair: "Traverse in storage order; watch false sharing.",
      html: "architecture.html#cache",
    },
    security: {
      title: "Authn/authz mixup",
      why: "Who you are ≠ what you may do.",
      ee: "Badge vs ACL.",
      repair: "Server-side checks; least privilege.",
      html: "security.html#web",
    },
    systems: {
      title: "CAP tradeoff",
      why: "Partition forces C vs A on that path.",
      ee: "Broken inter-substation link.",
      repair: "Name the partition scenario explicitly in design.",
      html: "systems_design.html",
    },
    automata: {
      title: "NFA vs DFA",
      why: "Subset construction always works (size may explode).",
      ee: "Parallel speculation of state.",
      repair: "Build powerset for a tiny NFA by hand.",
      html: "theory.html#automata",
    },
    hash_map: {
      title: "Hash for complements / frequencies",
      why: "Scanning twice or nested loops when a map makes O(n).",
      ee: "Address decoder: value → slot in average O(1).",
      repair: "Store what you've seen; look up the complement/need.",
      html: "patterns.html#hash_map",
    },
    binary_search_answer: {
      title: "Search the answer, not an index",
      why: "Feasibility is monotone — binary search the numeric answer with can(mid).",
      ee: "Successive-approximation / threshold search on a monotone line.",
      repair: "Define lo/hi on answer range; can(x) must be monotone; track first True.",
      html: "patterns.html#binary_search_answer",
    },
    sweep_line: {
      title: "Timeline events, not nested intervals",
      why: "Concurrency/overlap needs event sort (+1/−1), not merge-only thinking.",
      ee: "Rising/falling edges; running sum = instantaneous load.",
      repair: "Emit start/end events; sort; scan active count.",
      html: "patterns.html#sweep_line",
    },
    linked_list: {
      title: "Pointer rewiring",
      why: "Lost next pointer or wrong dummy/fast-slow setup.",
      ee: "Rewire a linked bus; save the forward link before flipping.",
      repair: "Draw nodes; prev/cur/nxt for reverse; Floyd for cycle.",
      html: "patterns.html#linked_list",
    },
    bit_manipulation: {
      title: "XOR / masks",
      why: "Missed that pairs cancel under XOR or that flags pack into bits.",
      ee: "Register bitfields; differential cancel of duplicates.",
      repair: "a^a=0, a^0=a; n&(n-1) clears lowest set bit.",
      html: "patterns.html#bit_manipulation",
    },
    difference_array: {
      title: "Range write ≠ prefix read",
      why: "Many range updates want difference array, not repeated loops or segtree.",
      ee: "Impulse at L and −impulse at R+1, then integrate once.",
      repair: "diff[L]+=v; diff[R+1]-=v; reconstruct with running sum.",
      html: "patterns.html#difference_array",
    },
  };

  function renderTutor(topic, mount) {
    const t = TUTOR[topic] || TUTOR.dp;
    mount.innerHTML = `
      <div class="tutor-panel">
        <h3>Offline Tutor — ${t.title}</h3>
        <p><strong>Why it went wrong:</strong> ${t.why}</p>
        <div class="callout callout-ee">
          <div class="callout-title">EE bridge</div>
          <p>${t.ee}</p>
        </div>
        <p><strong>Repair:</strong> ${t.repair}</p>
        <p><a href="${t.html}">Open related lesson →</a></p>
      </div>`;
  }

  /* ---------- Flashcards for algorithm memory ---------- */
  const FLASHCARDS = [
    {
      id: "card_sliding_window",
      front: "Sliding Window — when?",
      back: "Contiguous subarray/substring + running constraint. Expand R, shrink L, O(1) updates.",
      skeleton:
        "left=0\nfor right in range(n):\n    add(a[right])\n    while invalid:\n        remove(a[left]); left+=1\n    best=max(best, right-left+1)",
    },
    {
      id: "card_two_pointers",
      front: "Two Pointers — when?",
      back: "Sorted array / opposite ends / pair conditions. Move the pointer that can improve the objective.",
      skeleton:
        "i,j = 0, n-1\nwhile i < j:\n    if ok(i,j): ...\n    elif too_small: i+=1\n    else: j-=1",
    },
    {
      id: "card_binary_search",
      front: "Binary Search template",
      back: "Monotone predicate. Maintain lo/hi invariant; mid discards half.",
      skeleton:
        "lo,hi=0,n-1\nwhile lo<=hi:\n    mid=(lo+hi)//2\n    if pred(mid): hi=mid-1  # or record ans\n    else: lo=mid+1",
    },
    {
      id: "card_bfs",
      front: "BFS — mental movie",
      back: "Queue + seen. Explore distance rings. First hit = unweighted shortest.",
      skeleton:
        "q=deque([start]); seen={start}; dist={start:0}\nwhile q:\n    u=q.popleft()\n    for v in neigh(u):\n        if v not in seen:\n            seen.add(v); dist[v]=dist[u]+1; q.append(v)",
    },
    {
      id: "card_dfs",
      front: "DFS — mental movie",
      back: "Stack/recursion. Connectivity, path existence, cycles, topo via finish times.",
      skeleton:
        "def dfs(u):\n    seen.add(u)\n    for v in neigh(u):\n        if v not in seen: dfs(v)",
    },
    {
      id: "card_dp",
      front: "DP 5-step mantra",
      back: "1) state meaning 2) base 3) transition 4) iteration order 5) answer location",
      skeleton:
        "# define dp[…] meaning in one sentence\n# base cases\n# for ... in valid order:\n#     dp[...] = combine(subproblems)\n# return answer cell",
    },
    {
      id: "card_kadane",
      front: "Kadane (max subarray)",
      back: "cur = max(x, cur+x); best = max(best, cur)",
      skeleton:
        "best=cur=nums[0]\nfor x in nums[1:]:\n    cur=max(x, cur+x)\n    best=max(best, cur)",
    },
    {
      id: "card_mono_stack",
      front: "Monotonic stack (next greater)",
      back: "While top < current, pop (that index's next greater is current).",
      skeleton:
        "stack=[]  # indices, values decreasing\nfor i,x in enumerate(a):\n    while stack and a[stack[-1]] < x:\n        ans[stack.pop()]=x\n    stack.append(i)",
    },
    {
      id: "card_topo",
      front: "Topological sort (Kahn)",
      back: "Indegree queue on a DAG. Cycle ⇒ can't finish all nodes.",
      skeleton:
        "q=deque([u for u in V if indeg[u]==0])\nwhile q:\n    u=q.popleft(); order.append(u)\n    for v in g[u]:\n        indeg[v]-=1\n        if indeg[v]==0: q.append(v)",
    },
    {
      id: "card_uf",
      front: "Union-Find",
      back: "Path compression + union by rank ≈ O(α(n)) ≈ O(1).",
      skeleton:
        "def find(x):\n    while parent[x]!=x:\n        parent[x]=parent[parent[x]]; x=parent[x]\n    return x\ndef union(a,b):\n    ra,rb=find(a),find(b)\n    if ra==rb: return\n    # attach smaller rank under larger",
    },
    {
      id: "card_prefix",
      front: "Prefix sums",
      back: "pref[i+1]=pref[i]+a[i]; sum(l..r)=pref[r+1]-pref[l]",
      skeleton:
        "pref=[0]\nfor x in a: pref.append(pref[-1]+x)\n# query l,r inclusive:\n# pref[r+1]-pref[l]",
    },
    {
      id: "card_dijkstra",
      front: "Dijkstra",
      back: "Non-negative weights. PQ of (dist,node); relax neighbors.",
      skeleton:
        "dist=inf; dist[s]=0\npq=[(0,s)]\nwhile pq:\n    d,u=heappop(pq)\n    if d!=dist[u]: continue\n    for v,w in g[u]:\n        if dist[v]>d+w:\n            dist[v]=d+w; heappush(pq,(dist[v],v))",
    },
    {
      id: "card_bs_answer",
      front: "Binary search on answer — when?",
      back: "Minimize/maximize a number with monotone can(x). Search answer space, not array index.",
      skeleton:
        "lo,hi=1,max_bound; ans=hi\nwhile lo<=hi:\n    mid=(lo+hi)//2\n    if can(mid): ans=mid; hi=mid-1\n    else: lo=mid+1",
    },
    {
      id: "card_sweep",
      front: "Sweep line — when?",
      back: "Max concurrent / overlap on a timeline. Events +1/−1, sort, scan.",
      skeleton:
        "events=[(s,1),(e,-1),...]\nevents.sort()\ncur=best=0\nfor _,d in events:\n    cur+=d; best=max(best,cur)",
    },
    {
      id: "card_linked_list",
      front: "Linked list reverse / cycle",
      back: "Reverse: prev/cur/nxt. Cycle: Floyd slow/fast meet.",
      skeleton:
        "prev,cur=None,head\nwhile cur:\n    nxt=cur.next; cur.next=prev; prev,cur=cur,nxt\n# return prev",
    },
    {
      id: "card_bits",
      front: "Bit manipulation — XOR unique",
      back: "Pairs cancel: XOR all → single number. n&(n-1) clears lowest set bit.",
      skeleton: "x=0\nfor n in nums: x^=n\nreturn x",
    },
    {
      id: "card_diff_array",
      front: "Difference array — when?",
      back: "Many range updates, then final array. +val at L, −val at R+1, prefix rebuild.",
      skeleton:
        "diff=[0]*(n+1)\nfor L,R,v in updates:\n    diff[L]+=v; diff[R+1]-=v\n# prefix into out[]",
    },
    {
      id: "card_greedy",
      front: "Greedy — when?",
      back: "Sort by the right key; local choice is safe (exchange argument). Merge intervals / scheduling.",
      skeleton:
        "intervals.sort(key=lambda x: x[0])\nmerged=[]\nfor iv in intervals:\n    if not merged or merged[-1][1] < iv[0]: merged.append(iv)\n    else: merged[-1][1]=max(merged[-1][1], iv[1])",
    },
    {
      id: "card_backtracking",
      front: "Backtracking — when?",
      back: "Enumerate all configs (subsets/perms). Choose → explore → unchoose; prune early.",
      skeleton:
        "def dfs(start, path):\n    out.append(path[:])\n    for i in range(start, n):\n        path.append(nums[i])\n        dfs(i+1, path)\n        path.pop()",
    },
    {
      id: "card_heap",
      front: "Heap — when?",
      back: "Repeated min/max from a dynamic set; top-K → min-heap of size k.",
      skeleton:
        "import heapq\n# kth largest:\nreturn heapq.nlargest(k, nums)[-1]\n# or maintain min-heap of size k",
    },
    {
      id: "card_trie",
      front: "Trie — when?",
      back: "Shared string prefixes; insert/search O(len). Word search / autocomplete.",
      skeleton:
        "class Node:\n    def __init__(self):\n        self.child={}; self.end=False\n# insert: walk/create edges; mark end\n# search: walk; fail if missing edge",
    },
    {
      id: "card_hash_map",
      front: "Hash map — when?",
      back: "Complement lookup, frequencies, grouping. Average O(1) vs nested loops.",
      skeleton:
        "seen={}\nfor i,x in enumerate(nums):\n    if target-x in seen: return [seen[target-x], i]\n    seen[x]=i",
    },
  ];

  /* ---------- Procedural practice (browser) ---------- */
  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function genTwoSum(rng) {
    const n = 5 + Math.floor(rng() * 5);
    const nums = Array.from({ length: n }, () => 1 + Math.floor(rng() * 40));
    const i = Math.floor(rng() * n);
    let j = Math.floor(rng() * n);
    while (j === i) j = Math.floor(rng() * n);
    const target = nums[i] + nums[j];
    const map = new Map();
    let ans = [];
    for (let k = 0; k < nums.length; k++) {
      if (map.has(target - nums[k])) {
        ans = [map.get(target - nums[k]), k];
        break;
      }
      map.set(nums[k], k);
    }
    return {
      pattern: "hash_map",
      title: "Two Sum",
      prompt: `Find two indices in [${nums.join(", ")}] that sum to ${target}.`,
      answer: ans.join(","),
      accept: (s) => {
        const parts = s.split(/[,\s]+/).map(Number);
        if (parts.length !== 2 || parts.some(Number.isNaN)) return false;
        return nums[parts[0]] + nums[parts[1]] === target;
      },
      explain: `One valid pair: [${ans.join(", ")}] (hash complement).`,
      tutorTopic: "hash_map",
    };
  }

  function genKadane(rng) {
    const nums = Array.from(
      { length: 6 + Math.floor(rng() * 5) },
      () => Math.floor(rng() * 21) - 10
    );
    let best = nums[0],
      cur = nums[0];
    for (let i = 1; i < nums.length; i++) {
      cur = Math.max(nums[i], cur + nums[i]);
      best = Math.max(best, cur);
    }
    return {
      pattern: "dp",
      title: "Max Subarray (Kadane)",
      prompt: `Max contiguous sum of [${nums.join(", ")}] = ?`,
      answer: String(best),
      accept: (s) => Number(s.trim()) === best,
      explain: `Answer ${best}. cur=max(x,cur+x); best=max(best,cur).`,
      tutorTopic: "dp",
    };
  }

  function genBinarySearch(rng) {
    const set = new Set();
    while (set.size < 8) set.add(Math.floor(rng() * 50));
    const nums = [...set].sort((a, b) => a - b);
    const target =
      rng() < 0.7
        ? nums[Math.floor(rng() * nums.length)]
        : Math.floor(rng() * 50);
    const idx = nums.indexOf(target);
    return {
      pattern: "binary_search",
      title: "Binary Search",
      prompt: `Index of ${target} in [${nums.join(", ")}] (or -1)`,
      answer: String(idx),
      accept: (s) => Number(s.trim()) === idx,
      explain: `Index ${idx}. Halve the sorted domain each step.`,
      tutorTopic: "binary_search",
    };
  }

  function genLongestUnique(rng) {
    const alpha = "abcdefgh";
    let s = "";
    for (let i = 0; i < 10; i++)
      s += alpha[Math.floor(rng() * alpha.length)];
    const last = {};
    let left = 0,
      best = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (last[ch] !== undefined && last[ch] >= left) left = last[ch] + 1;
      last[ch] = i;
      best = Math.max(best, i - left + 1);
    }
    return {
      pattern: "sliding_window",
      title: "Longest unique substring",
      prompt: `Length of longest substring without repeat in "${s}"`,
      answer: String(best),
      accept: (x) => Number(x.trim()) === best,
      explain: `Answer ${best}. Window + last-seen map.`,
      tutorTopic: "sliding_window",
    };
  }

  const GENERATORS = [genTwoSum, genKadane, genBinarySearch, genLongestUnique];

  function generatePractice(seed) {
    const rng = mulberry32(seed >>> 0);
    const gen = GENERATORS[Math.floor(rng() * GENERATORS.length)];
    return gen(rng);
  }

  /* ---------- UI mount helpers ---------- */
  function mountQuiz(root, opts = {}) {
    if (!root) return;
    const track = opts.track || root.dataset.track || "";
    const topic = opts.topic || root.dataset.topic || "";
    let items = QUIZ.slice();
    if (track) items = items.filter((x) => x.track === track);
    if (topic) items = items.filter((x) => x.topic === topic || x.track === topic);
    items = items.sort(() => Math.random() - 0.5).slice(0, opts.limit || 6);
    let i = 0,
      correct = 0;
    const state = loadState();

    function show() {
      if (i >= items.length) {
        state.quizLog.push({
          at: now(),
          track,
          correct,
          total: items.length,
        });
        saveState(state);
        root.innerHTML = `<div class="quiz-panel"><h3>Session complete</h3>
          <p>Score: <strong>${correct}/${items.length}</strong></p>
          <button class="anim-btn primary" data-retry>Try again</button>
          <p class="text-muted">Progress saved in this browser (localStorage).</p></div>`;
        root.querySelector("[data-retry]")?.addEventListener("click", () =>
          mountQuiz(root, opts)
        );
        return;
      }
      const q = items[i];
      root.innerHTML = `<div class="quiz-panel">
        <div class="quiz-meta">Question ${i + 1}/${items.length} · ${q.track}</div>
        <h3>${q.q}</h3>
        <div class="quiz-choices">
          ${q.choices
            .map(
              (c, idx) =>
                `<button class="quiz-choice" data-idx="${idx}">${String.fromCharCode(65 + idx)}) ${c}</button>`
            )
            .join("")}
        </div>
        <div class="quiz-feedback" hidden></div>
        <div class="tutor-slot"></div>
      </div>`;
      root.querySelectorAll(".quiz-choice").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.dataset.idx);
          const ok = idx === q.answer;
          const fb = root.querySelector(".quiz-feedback");
          fb.hidden = false;
          if (ok) {
            correct++;
            reviewCard(state, q.card, "good");
            fb.className = "quiz-feedback ok";
            fb.innerHTML = `<strong>Correct.</strong> ${q.explain}<br><em>${q.model}</em>`;
          } else {
            reviewCard(state, q.card, "again");
            fb.className = "quiz-feedback bad";
            fb.innerHTML = `<strong>Not quite.</strong> Correct: ${String.fromCharCode(65 + q.answer)}) ${q.choices[q.answer]}<br>${q.explain}<br><em>${q.model}</em>`;
            renderTutor(q.tutorTopic, root.querySelector(".tutor-slot"));
          }
          root.querySelectorAll(".quiz-choice").forEach((b) => (b.disabled = true));
          const next = document.createElement("button");
          next.className = "anim-btn primary";
          next.textContent = "Next →";
          next.style.marginTop = "1rem";
          next.onclick = () => {
            i++;
            show();
          };
          fb.appendChild(document.createElement("br"));
          fb.appendChild(next);
        });
      });
    }
    show();
  }

  function mountFlashcards(root) {
    if (!root) return;
    const state = loadState();
    FLASHCARDS.forEach((c) => ensureCard(state, c.id));
    saveState(state);

    let deck = dueCards(state)
      .map((c) => FLASHCARDS.find((f) => f.id === c.id))
      .filter(Boolean);
    if (!deck.length) deck = FLASHCARDS.slice();
    let i = 0;
    let flipped = false;

    function render() {
      if (i >= deck.length) {
        root.innerHTML = `<div class="flash-panel"><h3>Deck clear for now</h3>
          <p>${dueCards(loadState()).length} cards still due globally.</p>
          <button class="anim-btn primary" id="fc-restart">Review all</button></div>`;
        root.querySelector("#fc-restart").onclick = () => {
          deck = FLASHCARDS.slice();
          i = 0;
          render();
        };
        return;
      }
      const card = deck[i];
      root.innerHTML = `<div class="flash-panel">
        <div class="flash-meta">Card ${i + 1}/${deck.length} · SRS</div>
        <div class="flash-card ${flipped ? "flipped" : ""}" id="fc-card">
          <div class="flash-face">${flipped ? card.back : card.front}</div>
          ${flipped ? `<pre class="flash-skeleton">${card.skeleton}</pre>` : "<p class='text-muted'>Click card to reveal</p>"}
        </div>
        <div class="flash-grades" ${flipped ? "" : "hidden"}>
          <button class="anim-btn" data-g="again">Again</button>
          <button class="anim-btn" data-g="hard">Hard</button>
          <button class="anim-btn primary" data-g="good">Good</button>
          <button class="anim-btn" data-g="easy">Easy</button>
        </div>
      </div>`;
      root.querySelector("#fc-card").onclick = () => {
        flipped = true;
        render();
      };
      root.querySelectorAll("[data-g]").forEach((btn) => {
        btn.onclick = (e) => {
          e.stopPropagation();
          reviewCard(loadState(), card.id, btn.dataset.g);
          flipped = false;
          i++;
          render();
        };
      });
    }
    render();
  }

  function mountPractice(root) {
    if (!root) return;
    let seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
    const state = loadState();

    function show() {
      const p = generatePractice(seed);
      root.innerHTML = `<div class="practice-panel">
        <div class="quiz-meta">${p.title} · pattern: ${p.pattern} · seed ${seed}</div>
        <h3>${p.prompt}</h3>
        <input class="practice-input" id="pr-ans" placeholder="Your answer" autocomplete="off" />
        <div style="margin-top:0.75rem;display:flex;gap:0.5rem;flex-wrap:wrap">
          <button class="anim-btn primary" id="pr-check">Check</button>
          <button class="anim-btn" id="pr-next">New problem</button>
        </div>
        <div class="quiz-feedback" id="pr-fb" hidden></div>
        <div class="tutor-slot" id="pr-tutor"></div>
      </div>`;
      const check = () => {
        const val = root.querySelector("#pr-ans").value;
        const fb = root.querySelector("#pr-fb");
        fb.hidden = false;
        if (p.accept(val)) {
          state.practiceSolved++;
          saveState(state);
          fb.className = "quiz-feedback ok";
          fb.innerHTML = `<strong>Correct.</strong> ${p.explain}`;
          root.querySelector("#pr-tutor").innerHTML = "";
        } else {
          state.practiceFailed++;
          saveState(state);
          fb.className = "quiz-feedback bad";
          fb.innerHTML = `<strong>Incorrect.</strong> ${p.explain}`;
          renderTutor(p.tutorTopic, root.querySelector("#pr-tutor"));
        }
      };
      root.querySelector("#pr-check").onclick = check;
      root.querySelector("#pr-ans").onkeydown = (e) => {
        if (e.key === "Enter") check();
      };
      root.querySelector("#pr-next").onclick = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        show();
      };
    }
    show();
  }

  function mountProgress(root) {
    if (!root) return;
    const state = loadState();
    const due = dueCards(state).length;
    const lessonsDone = Object.values(state.lessons).filter(
      (l) => l.status === "done"
    ).length;
    const recent = state.quizLog.slice(-5);
    root.innerHTML = `<div class="progress-panel">
      <div class="hero-stats">
        <div class="stat"><div class="stat-number">${lessonsDone}</div><div class="stat-label">Lessons marked</div></div>
        <div class="stat"><div class="stat-number">${Object.keys(state.cards).length}</div><div class="stat-label">SRS cards</div></div>
        <div class="stat"><div class="stat-number">${due}</div><div class="stat-label">Due now</div></div>
        <div class="stat"><div class="stat-number">${state.practiceSolved}</div><div class="stat-label">Practice solved</div></div>
      </div>
      <h3>Recent quiz sessions</h3>
      ${
        recent.length
          ? `<ul>${recent
              .map(
                (r) =>
                  `<li>${new Date(r.at).toLocaleString()} — ${r.correct}/${r.total} (${r.track || "mixed"})</li>`
              )
              .join("")}</ul>`
          : "<p class='text-muted'>No quizzes yet. Try Practice Arena or a track page quiz.</p>"
      }
      <p style="margin-top:1rem"><button class="anim-btn" id="pg-reset">Reset browser progress</button></p>
    </div>`;
    root.querySelector("#pg-reset")?.addEventListener("click", () => {
      if (confirm("Reset all localStorage course progress?")) {
        localStorage.removeItem(STORAGE_KEY);
        mountProgress(root);
      }
    });
  }

  function wireMarkDoneButtons() {
    document.querySelectorAll("[data-mark-lesson]").forEach((btn) => {
      btn.addEventListener("click", () => {
        markLesson(btn.dataset.markLesson, "done");
        btn.textContent = "Marked done ✓";
        btn.disabled = true;
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-quiz]").forEach((el) => mountQuiz(el));
    document.querySelectorAll("[data-flashcards]").forEach((el) => mountFlashcards(el));
    // Short-answer practice mounts; coding arena uses practice-arena.js [data-coding-arena]
    document.querySelectorAll("[data-practice]").forEach((el) => mountPractice(el));
    document.querySelectorAll("[data-progress]").forEach((el) => mountProgress(el));
    document.querySelectorAll("[data-tutor-topic]").forEach((el) => {
      renderTutor(el.dataset.tutorTopic, el);
    });
    wireMarkDoneButtons();
  });

  window.Course = {
    loadState,
    saveState,
    markLesson,
    mountQuiz,
    mountFlashcards,
    mountPractice,
    mountProgress,
    renderTutor,
    FLASHCARDS,
    QUIZ,
  };
})();
