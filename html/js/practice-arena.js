/**
 * Browser-based Practice Arena — write Python, run tests via Pyodide.
 * Prefers local vendor/pyodide (offline); falls back to jsDelivr CDN.
 */
(function () {
  const PYODIDE_VERSION = "0.27.5";
  const CDN_INDEX = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
  const LOCAL_INDEX = new URL("../vendor/pyodide/", document.currentScript.src).href;

  let pyodide = null;
  let loadPromise = null;
  let loadSource = "";

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  async function tryLoad(indexURL) {
    const base = indexURL.endsWith("/") ? indexURL : indexURL + "/";
    const scriptUrl = base + "pyodide.js";
    await new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-pyodide="${base}"]`);
      if (existing && window.loadPyodide) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = scriptUrl;
      s.dataset.pyodide = base;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load " + scriptUrl));
      document.head.appendChild(s);
    });
    if (typeof loadPyodide !== "function") {
      throw new Error("loadPyodide missing after script load");
    }
    return loadPyodide({ indexURL: base });
  }

  async function ensurePyodide(statusEl) {
    if (pyodide) return pyodide;
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      const set = (msg) => {
        if (statusEl) statusEl.textContent = msg;
      };
      set("Loading Python runtime (first time may take a minute)...");
      try {
        pyodide = await tryLoad(LOCAL_INDEX);
        loadSource = "local vendor (offline)";
      } catch {
        set("Local Pyodide not found — trying CDN...");
        pyodide = await tryLoad(CDN_INDEX);
        loadSource = "CDN (cached by browser after first load)";
      }
      set("Python ready (" + loadSource + ").");
      return pyodide;
    })();
    try {
      return await loadPromise;
    } catch (err) {
      loadPromise = null;
      throw err;
    }
  }

  /* ---------- Problem generators (full coding + tests) ---------- */

  function twoSumRef(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
      const need = target - nums[i];
      if (seen.has(need)) return [seen.get(need), i];
      seen.set(nums[i], i);
    }
    return [];
  }

  function genTwoSum(rng, seed) {
    const tests = [];
    for (let t = 0; t < 6; t++) {
      const n = 4 + Math.floor(rng() * 6);
      const nums = Array.from({ length: n }, () => 1 + Math.floor(rng() * 40));
      const i = Math.floor(rng() * n);
      let j = Math.floor(rng() * n);
      while (j === i) j = Math.floor(rng() * n);
      const target = nums[i] + nums[j];
      tests.push({ args: [nums.slice(), target], expected: twoSumRef(nums, target) });
    }
    return {
      id: "browser_two_sum_" + seed,
      title: "Two Sum",
      pattern: "hash_map",
      difficulty: "easy",
      description:
        "Write a function that finds two different positions in a list whose values add up to a given target.\n\n" +
        "Inputs:\n" +
        "  • nums — a list of integers\n" +
        "  • target — the sum you are looking for\n\n" +
        "Output:\n" +
        "  • a list of two indices [i, j] such that nums[i] + nums[j] == target\n\n" +
        "Rules:\n" +
        "  • i and j must be different positions\n" +
        "  • exactly one valid pair is guaranteed\n" +
        "  • either order of indices is accepted\n\n" +
        "Example: nums = [2, 7, 11, 15], target = 9 → [0, 1]  because 2 + 7 = 9.",
      functionName: "two_sum",
      starterCode:
        "def two_sum(nums: list[int], target: int) -> list[int]:\n    # hint: hash map of value -> index\n    ...\n",
      tests,
      compare: "two_sum",
      hints: [
        "Scan once; store value->index.",
        "At each i, look up target - nums[i].",
      ],
      tutorTopic: "hash_map",
      mentalModel:
        "Hash map is an address decoder: value -> index in average O(1).",
      modelAnswer:
        "def two_sum(nums: list[int], target: int) -> list[int]:\n" +
        "    seen = {}\n" +
        "    for i, n in enumerate(nums):\n" +
        "        need = target - n\n" +
        "        if need in seen:\n" +
        "            return [seen[need], i]\n" +
        "        seen[n] = i\n" +
        "    return []\n",
    };
  }

  function kadaneRef(nums) {
    let best = nums[0],
      cur = nums[0];
    for (let i = 1; i < nums.length; i++) {
      cur = Math.max(nums[i], cur + nums[i]);
      best = Math.max(best, cur);
    }
    return best;
  }

  function genKadane(rng, seed) {
    const tests = [];
    for (let t = 0; t < 6; t++) {
      const nums = Array.from(
        { length: 5 + Math.floor(rng() * 8) },
        () => Math.floor(rng() * 25) - 12
      );
      tests.push({ args: [nums.slice()], expected: kadaneRef(nums) });
    }
    return {
      id: "browser_kadane_" + seed,
      title: "Maximum Subarray (Kadane)",
      pattern: "dp",
      difficulty: "medium",
      description:
        "Write a function that finds the contiguous subarray (one unbroken slice of the list) whose values sum to the largest possible total, and return that total.\n\n" +
        "Input:\n" +
        "  • nums — a non-empty list of integers (may include negatives)\n\n" +
        "Output:\n" +
        "  • a single integer: the maximum sum achievable by any contiguous slice\n\n" +
        "Notes:\n" +
        "  • the subarray must be contiguous (e.g. indices 2..5), not an arbitrary subset\n" +
        "  • a single element is a valid subarray\n\n" +
        "Example: nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4] → 6  because [4, -1, 2, 1] sums to 6.",
      functionName: "max_subarray",
      starterCode:
        "def max_subarray(nums: list[int]) -> int:\n    # Kadane: best ending here vs global best\n    ...\n",
      tests,
      compare: "equal",
      hints: ["cur = max(x, cur + x)", "Track a global best."],
      tutorTopic: "dp",
      mentalModel: "1D DP: state = best sum ending at i.",
      modelAnswer:
        "def max_subarray(nums: list[int]) -> int:\n" +
        "    best = cur = nums[0]\n" +
        "    for x in nums[1:]:\n" +
        "        cur = max(x, cur + x)\n" +
        "        best = max(best, cur)\n" +
        "    return best\n",
    };
  }

  function bsRef(nums, target) {
    let lo = 0,
      hi = nums.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (nums[mid] === target) return mid;
      if (nums[mid] < target) lo = mid + 1;
      else hi = mid - 1;
    }
    return -1;
  }

  function genBinarySearch(rng, seed) {
    const tests = [];
    for (let t = 0; t < 6; t++) {
      const set = new Set();
      while (set.size < 8) set.add(Math.floor(rng() * 60));
      const nums = [...set].sort((a, b) => a - b);
      const target =
        rng() < 0.7
          ? nums[Math.floor(rng() * nums.length)]
          : Math.floor(rng() * 60);
      tests.push({ args: [nums.slice(), target], expected: bsRef(nums, target) });
    }
    return {
      id: "browser_bs_" + seed,
      title: "Binary Search",
      pattern: "binary_search",
      difficulty: "easy",
      description:
        "Write a function that searches for a target value inside a sorted list and returns where it sits.\n\n" +
        "Inputs:\n" +
        "  • nums — a list of unique integers, already sorted ascending\n" +
        "  • target — the integer to find\n\n" +
        "Output:\n" +
        "  • the index of target in nums, or -1 if target is not present\n\n" +
        "Example: nums = [1, 3, 5, 7, 9], target = 7 → 3\n" +
        "Example: nums = [1, 3, 5, 7, 9], target = 4 → -1",
      functionName: "binary_search",
      starterCode:
        "def binary_search(nums: list[int], target: int) -> int:\n    ...\n",
      tests,
      compare: "equal",
      hints: ["Inclusive [lo, hi]", "mid = (lo + hi) // 2"],
      tutorTopic: "binary_search",
      mentalModel: "Successive approximation on a sorted domain.",
      modelAnswer:
        "def binary_search(nums: list[int], target: int) -> int:\n" +
        "    lo, hi = 0, len(nums) - 1\n" +
        "    while lo <= hi:\n" +
        "        mid = (lo + hi) // 2\n" +
        "        if nums[mid] == target:\n" +
        "            return mid\n" +
        "        if nums[mid] < target:\n" +
        "            lo = mid + 1\n" +
        "        else:\n" +
        "            hi = mid - 1\n" +
        "    return -1\n",
    };
  }

  function longestUniqueRef(s) {
    const last = {};
    let left = 0,
      best = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (last[ch] !== undefined && last[ch] >= left) left = last[ch] + 1;
      last[ch] = i;
      best = Math.max(best, i - left + 1);
    }
    return best;
  }

  function genSlidingWindow(rng, seed) {
    const alpha = "abcdefghij";
    const tests = [];
    for (let t = 0; t < 6; t++) {
      let s = "";
      const len = 6 + Math.floor(rng() * 12);
      for (let i = 0; i < len; i++)
        s += alpha[Math.floor(rng() * alpha.length)];
      tests.push({ args: [s], expected: longestUniqueRef(s) });
    }
    return {
      id: "browser_sw_" + seed,
      title: "Longest Substring Without Repeating Characters",
      pattern: "sliding_window",
      difficulty: "medium",
      description:
        "Write a function that finds the longest contiguous piece of a string in which no character repeats, and returns how long that piece is.\n\n" +
        "Input:\n" +
        "  • s — a string (may be empty)\n\n" +
        "Output:\n" +
        "  • an integer: the maximum length of any substring with all unique characters\n\n" +
        "Notes:\n" +
        "  • a substring is contiguous (characters next to each other in order)\n" +
        "  • you return the length, not the substring itself\n\n" +
        'Example: s = "abcabcbb" → 3  (e.g. "abc")\n' +
        'Example: s = "bbbbb" → 1  (e.g. "b")',
      functionName: "length_of_longest_substring",
      starterCode:
        "def length_of_longest_substring(s: str) -> int:\n    # sliding window + last-seen index\n    ...\n",
      tests,
      compare: "equal",
      hints: [
        "Expand right; when duplicate inside window, move left past it.",
        "Maintain last-seen map.",
      ],
      tutorTopic: "sliding_window",
      mentalModel: "Window invariant: all characters unique.",
      modelAnswer:
        "def length_of_longest_substring(s: str) -> int:\n" +
        "    last = {}\n" +
        "    left = best = 0\n" +
        "    for i, ch in enumerate(s):\n" +
        "        if ch in last and last[ch] >= left:\n" +
        "            left = last[ch] + 1\n" +
        "        last[ch] = i\n" +
        "        best = max(best, i - left + 1)\n" +
        "    return best\n",
    };
  }

  function validParenRef(s) {
    const stack = [];
    const pairs = { ")": "(", "]": "[", "}": "{" };
    for (const ch of s) {
      if ("([{".includes(ch)) stack.push(ch);
      else {
        if (!stack.length || stack[stack.length - 1] !== pairs[ch]) return false;
        stack.pop();
      }
    }
    return stack.length === 0;
  }

  function genParens(rng, seed) {
    function buildValid() {
      const opens = ["(", "[", "{"];
      const close = { "(": ")", "[": "]", "{": "}" };
      const stack = [];
      let out = "";
      for (let i = 0; i < 6; i++) {
        if (!stack.length || (rng() < 0.55 && stack.length < 4)) {
          const o = opens[Math.floor(rng() * 3)];
          stack.push(o);
          out += o;
        } else {
          out += close[stack.pop()];
        }
      }
      while (stack.length) out += close[stack.pop()];
      return out;
    }
    const tests = [];
    for (let t = 0; t < 8; t++) {
      const s =
        rng() < 0.55
          ? buildValid()
          : Array.from({ length: 2 + Math.floor(rng() * 8) }, () =>
              "()[]{}"[Math.floor(rng() * 6)]
            ).join("");
      tests.push({ args: [s], expected: validParenRef(s) });
    }
    return {
      id: "browser_paren_" + seed,
      title: "Valid Parentheses",
      pattern: "monotonic_stack",
      difficulty: "easy",
      description:
        "Write a function that checks whether a string of brackets is correctly matched and nested.\n\n" +
        "Input:\n" +
        '  • s — a string containing only the characters (, ), [, ], {, }\n\n' +
        "Output:\n" +
        "  • True if every opening bracket has a matching closing bracket of the same type, in the right order; otherwise False\n\n" +
        "Valid means:\n" +
        "  • brackets close in LIFO order (innermost first)\n" +
        "  • types must match: ( with ), [ with ], { with }\n\n" +
        'Example: s = "()[]{}" → True\n' +
        'Example: s = "(]" → False\n' +
        'Example: s = "([)]" → False  (wrong nesting order)',
      functionName: "is_valid",
      starterCode: "def is_valid(s: str) -> bool:\n    ...\n",
      tests,
      compare: "equal",
      hints: ["Stack of openers", "On closer, top must match"],
      tutorTopic: "monotonic_stack",
      mentalModel: "LIFO matches nesting — like a call stack.",
      modelAnswer:
        "def is_valid(s: str) -> bool:\n" +
        "    stack = []\n" +
        "    pairs = {')': '(', ']': '[', '}': '{'}\n" +
        "    for ch in s:\n" +
        "        if ch in '([{':\n" +
        "            stack.append(ch)\n" +
        "        elif not stack or stack[-1] != pairs.get(ch):\n" +
        "            return False\n" +
        "        else:\n" +
        "            stack.pop()\n" +
        "    return not stack\n",
    };
  }

  function climbRef(n) {
    if (n <= 2) return n;
    let a = 1,
      b = 2;
    for (let i = 3; i <= n; i++) {
      const c = a + b;
      a = b;
      b = c;
    }
    return b;
  }

  function genClimb(rng, seed) {
    const tests = [];
    for (let t = 0; t < 6; t++) {
      const n = 2 + Math.floor(rng() * 20);
      tests.push({ args: [n], expected: climbRef(n) });
    }
    return {
      id: "browser_climb_" + seed,
      title: "Climbing Stairs",
      pattern: "dp",
      difficulty: "easy",
      description:
        "You are climbing a staircase with n steps. Each move you may climb either 1 step or 2 steps. Write a function that counts how many distinct sequences of moves reach the top.\n\n" +
        "Input:\n" +
        "  • n — a positive integer (number of stairs)\n\n" +
        "Output:\n" +
        "  • an integer: the number of distinct ways to climb to step n\n\n" +
        "Notes:\n" +
        "  • order matters: 1+2 and 2+1 are different ways\n" +
        "  • this is the classic Fibonacci recurrence\n\n" +
        "Example: n = 2 → 2  (1+1, or 2)\n" +
        "Example: n = 3 → 3  (1+1+1, 1+2, 2+1)",
      functionName: "climb_stairs",
      starterCode: "def climb_stairs(n: int) -> int:\n    ...\n",
      tests,
      compare: "equal",
      hints: ["ways(n) = ways(n-1) + ways(n-2)", "Fibonacci"],
      tutorTopic: "dp",
      mentalModel: "Last step was 1 or 2 — classic recurrence.",
      modelAnswer:
        "def climb_stairs(n: int) -> int:\n" +
        "    if n <= 2:\n" +
        "        return n\n" +
        "    a, b = 1, 2\n" +
        "    for _ in range(3, n + 1):\n" +
        "        a, b = b, a + b\n" +
        "    return b\n",
    };
  }

  function mergeRef(intervals) {
    if (!intervals.length) return [];
    const sorted = intervals.map((x) => x.slice()).sort((a, b) => a[0] - b[0]);
    const out = [sorted[0].slice()];
    for (let i = 1; i < sorted.length; i++) {
      const [s, e] = sorted[i];
      if (s <= out[out.length - 1][1])
        out[out.length - 1][1] = Math.max(out[out.length - 1][1], e);
      else out.push([s, e]);
    }
    return out;
  }

  function genMerge(rng, seed) {
    const tests = [];
    for (let t = 0; t < 5; t++) {
      const intervals = [];
      const m = 3 + Math.floor(rng() * 5);
      for (let i = 0; i < m; i++) {
        const s = Math.floor(rng() * 30);
        intervals.push([s, s + 1 + Math.floor(rng() * 10)]);
      }
      tests.push({
        args: [intervals.map((x) => x.slice())],
        expected: mergeRef(intervals),
      });
    }
    return {
      id: "browser_merge_" + seed,
      title: "Merge Intervals",
      pattern: "greedy",
      difficulty: "medium",
      description:
        "Write a function that takes a list of intervals on a number line and merges any that overlap (or touch) into combined intervals.\n\n" +
        "Input:\n" +
        "  • intervals — a list of [start, end] pairs, each a closed interval of integers\n\n" +
        "Output:\n" +
        "  • a new list of [start, end] intervals with all overlaps merged, sorted by start\n\n" +
        "Overlap rule:\n" +
        "  • if the next interval starts at or before the current merged end, extend the end\n\n" +
        "Example: intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]\n" +
        "       → [[1, 6], [8, 10], [15, 18]]\n" +
        "  because [1,3] and [2,6] overlap into [1,6].",
      functionName: "merge",
      starterCode:
        "def merge(intervals: list[list[int]]) -> list[list[int]]:\n    ...\n",
      tests,
      compare: "equal",
      hints: ["Sort by start", "Extend end when overlapping"],
      tutorTopic: "greedy",
      mentalModel: "Sort creates order; one left-to-right sweep merges.",
      modelAnswer:
        "def merge(intervals: list[list[int]]) -> list[list[int]]:\n" +
        "    if not intervals:\n" +
        "        return []\n" +
        "    intervals = sorted(intervals)\n" +
        "    out = [intervals[0][:]]\n" +
        "    for s, e in intervals[1:]:\n" +
        "        if s <= out[-1][1]:\n" +
        "            out[-1][1] = max(out[-1][1], e)\n" +
        "        else:\n" +
        "            out.append([s, e])\n" +
        "    return out\n",
    };
  }

  function prefixRef(nums, queries) {
    const pref = [0];
    for (const n of nums) pref.push(pref[pref.length - 1] + n);
    return queries.map(([l, r]) => pref[r + 1] - pref[l]);
  }

  function genPrefix(rng, seed) {
    const tests = [];
    for (let t = 0; t < 5; t++) {
      const nums = Array.from(
        { length: 5 + Math.floor(rng() * 6) },
        () => Math.floor(rng() * 20) - 5
      );
      const queries = [];
      const qn = 2 + Math.floor(rng() * 4);
      for (let i = 0; i < qn; i++) {
        const l = Math.floor(rng() * nums.length);
        const r = l + Math.floor(rng() * (nums.length - l));
        queries.push([l, r]);
      }
      tests.push({
        args: [nums.slice(), queries.map((q) => q.slice())],
        expected: prefixRef(nums, queries),
      });
    }
    return {
      id: "browser_prefix_" + seed,
      title: "Range Sum Queries",
      pattern: "prefix_sum",
      difficulty: "easy",
      description:
        "Yes — write a function that takes a list of numbers and a list of index ranges, and returns a list of sums, one per range.\n\n" +
        "Inputs:\n" +
        "  • nums — a list of integers\n" +
        "  • queries — a list of ranges; each range is [l, r] meaning “from index l through index r inclusive”\n\n" +
        "Output:\n" +
        "  • a list of integers the same length as queries\n" +
        "  • answer[i] = nums[l] + nums[l+1] + … + nums[r] for queries[i] = [l, r]\n\n" +
        "Example:\n" +
        "  nums = [2, 3, 1, 4]\n" +
        "  queries = [[0, 2], [1, 3], [2, 2]]\n" +
        "  → [6, 8, 1]\n" +
        "  because 2+3+1=6, 3+1+4=8, and just nums[2]=1.\n\n" +
        "Efficiency tip: precompute a prefix-sum array so each query is answered in O(1) instead of re-adding the slice every time.",
      functionName: "range_sums",
      starterCode:
        "def range_sums(nums: list[int], queries: list[list[int]]) -> list[int]:\n    ...\n",
      tests,
      compare: "equal",
      hints: ["pref[i+1] = pref[i] + nums[i]", "sum(l..r) = pref[r+1] - pref[l]"],
      tutorTopic: "prefix_sum",
      mentalModel: "Integrate once; windows are differences.",
      modelAnswer:
        "def range_sums(nums: list[int], queries: list[list[int]]) -> list[int]:\n" +
        "    pref = [0]\n" +
        "    for x in nums:\n" +
        "        pref.append(pref[-1] + x)\n" +
        "    return [pref[r + 1] - pref[l] for l, r in queries]\n",
    };
  }

  /* ----- Remaining patterns (full 16) ----- */

  function twoPointersRef(nums, target) {
    let i = 0,
      j = nums.length - 1;
    while (i < j) {
      const s = nums[i] + nums[j];
      if (s === target) return [i, j];
      if (s < target) i++;
      else j--;
    }
    return [];
  }

  function genTwoPointers(rng, seed) {
    const tests = [];
    for (let t = 0; t < 6; t++) {
      const set = new Set();
      while (set.size < 8) set.add(Math.floor(rng() * 40) - 5);
      const nums = [...set].sort((a, b) => a - b);
      let i = Math.floor(rng() * (nums.length - 1));
      let j = i + 1 + Math.floor(rng() * (nums.length - 1 - i));
      const target = nums[i] + nums[j];
      tests.push({
        args: [nums.slice(), target],
        expected: twoPointersRef(nums, target),
      });
    }
    return {
      id: "browser_tp_" + seed,
      title: "Two Sum II (Sorted — Two Pointers)",
      pattern: "two_pointers",
      difficulty: "easy",
      description:
        "Write a function that finds two indices in a sorted ascending array whose values sum to target.\n\n" +
        "Inputs:\n" +
        "  • nums — sorted ascending, unique integers\n" +
        "  • target — desired sum\n\n" +
        "Output:\n" +
        "  • [i, j] with i < j and nums[i] + nums[j] == target (exactly one pair exists)\n\n" +
        "Use two pointers from the ends — not a hash map — so you practice the sorted two-pointer pattern.\n\n" +
        "Example: nums = [2, 7, 11, 15], target = 9 → [0, 1]",
      functionName: "two_sum_sorted",
      starterCode:
        "def two_sum_sorted(nums: list[int], target: int) -> list[int]:\n    # left/right pointers on sorted array\n    ...\n",
      tests,
      compare: "two_sum",
      hints: [
        "i, j = 0, n-1",
        "If sum too small, i += 1; if too big, j -= 1",
      ],
      tutorTopic: "two_pointers",
      mentalModel: "Sorted ends: move the pointer that can fix the error sign.",
      modelAnswer:
        "def two_sum_sorted(nums: list[int], target: int) -> list[int]:\n" +
        "    i, j = 0, len(nums) - 1\n" +
        "    while i < j:\n" +
        "        s = nums[i] + nums[j]\n" +
        "        if s == target:\n" +
        "            return [i, j]\n" +
        "        if s < target:\n" +
        "            i += 1\n" +
        "        else:\n" +
        "            j -= 1\n" +
        "    return []\n",
    };
  }

  function bfsOrderRef(n, edges) {
    const g = Array.from({ length: n }, () => []);
    for (const [a, b] of edges) {
      g[a].push(b);
      g[b].push(a);
    }
    for (const list of g) list.sort((x, y) => x - y);
    const seen = new Set([0]);
    const q = [0];
    const order = [];
    while (q.length) {
      const u = q.shift();
      order.push(u);
      for (const v of g[u]) {
        if (!seen.has(v)) {
          seen.add(v);
          q.push(v);
        }
      }
    }
    return order;
  }

  function genBfs(rng, seed) {
    const tests = [];
    for (let t = 0; t < 4; t++) {
      const n = 4 + Math.floor(rng() * 4);
      const edges = [];
      for (let i = 1; i < n; i++) edges.push([Math.floor(rng() * i), i]);
      tests.push({
        args: [n, edges.map((e) => e.slice())],
        expected: bfsOrderRef(n, edges),
      });
    }
    return {
      id: "browser_bfs_" + seed,
      title: "BFS Visit Order from 0",
      pattern: "bfs",
      difficulty: "medium",
      description:
        "Write a function that runs BFS on an undirected graph and returns the visit order starting from node 0.\n\n" +
        "Inputs:\n" +
        "  • n — number of nodes labeled 0..n-1\n" +
        "  • edges — list of undirected [u, v] edges\n\n" +
        "Output:\n" +
        "  • list of node ids in BFS order from 0\n" +
        "  • when expanding a node, visit neighbors in ascending id order (for deterministic tests)\n\n" +
        "Example: n=4, edges=[[0,1],[0,2],[1,3]] → [0, 1, 2, 3]",
      functionName: "bfs_order",
      starterCode:
        "from collections import deque, defaultdict\n\n" +
        "def bfs_order(n: int, edges: list[list[int]]) -> list[int]:\n    ...\n",
      tests,
      compare: "equal",
      hints: ["Adjacency list + queue + seen set", "Sort neighbors before enqueue"],
      tutorTopic: "bfs",
      mentalModel: "Wavefront / distance rings on a mesh.",
      modelAnswer:
        "from collections import deque, defaultdict\n\n" +
        "def bfs_order(n: int, edges: list[list[int]]) -> list[int]:\n" +
        "    g = defaultdict(list)\n" +
        "    for a, b in edges:\n" +
        "        g[a].append(b)\n" +
        "        g[b].append(a)\n" +
        "    for v in g:\n" +
        "        g[v].sort()\n" +
        "    seen = {0}\n" +
        "    q = deque([0])\n" +
        "    order = []\n" +
        "    while q:\n" +
        "        u = q.popleft()\n" +
        "        order.append(u)\n" +
        "        for v in g[u]:\n" +
        "            if v not in seen:\n" +
        "                seen.add(v)\n" +
        "                q.append(v)\n" +
        "    return order\n",
    };
  }

  function numIslandsRef(grid) {
    const g = grid.map((row) => row.slice());
    const rows = g.length,
      cols = g[0].length;
    let count = 0;
    function dfs(r, c) {
      if (r < 0 || c < 0 || r >= rows || c >= cols || g[r][c] !== "1") return;
      g[r][c] = "0";
      dfs(r + 1, c);
      dfs(r - 1, c);
      dfs(r, c + 1);
      dfs(r, c - 1);
    }
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        if (g[r][c] === "1") {
          count++;
          dfs(r, c);
        }
    return count;
  }

  function genDfs(rng, seed) {
    const tests = [];
    for (let t = 0; t < 5; t++) {
      const rows = 3 + Math.floor(rng() * 2);
      const cols = 3 + Math.floor(rng() * 3);
      const grid = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => (rng() < 0.45 ? "1" : "0"))
      );
      // ensure at least one land
      grid[0][0] = "1";
      tests.push({
        args: [grid.map((r) => r.slice())],
        expected: numIslandsRef(grid),
      });
    }
    return {
      id: "browser_dfs_" + seed,
      title: "Number of Islands (DFS)",
      pattern: "dfs",
      difficulty: "medium",
      description:
        "Write a function that counts islands in a 2D grid. An island is a maximally connected group of '1' land cells (4-directional: up/down/left/right).\n\n" +
        "Input:\n" +
        "  • grid — list of list of characters '1' (land) or '0' (water)\n\n" +
        "Output:\n" +
        "  • integer count of islands\n\n" +
        "Approach: DFS (or BFS) flood-fill each unvisited land cell and mark the whole island.\n\n" +
        "Example:\n" +
        "  [['1','1','0'],\n" +
        "   ['1','0','0'],\n" +
        "   ['0','0','1']] → 2",
      functionName: "num_islands",
      starterCode:
        "def num_islands(grid: list[list[str]]) -> int:\n    ...\n",
      tests,
      compare: "equal",
      hints: ["DFS/BFS flood fill", "Mark visited by flipping '1' to '0'"],
      tutorTopic: "dfs",
      mentalModel: "Depth probe paints a whole connected component.",
      modelAnswer:
        "def num_islands(grid: list[list[str]]) -> int:\n" +
        "    if not grid:\n" +
        "        return 0\n" +
        "    rows, cols = len(grid), len(grid[0])\n" +
        "    def dfs(r, c):\n" +
        "        if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != '1':\n" +
        "            return\n" +
        "        grid[r][c] = '0'\n" +
        "        dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)\n" +
        "    count = 0\n" +
        "    for r in range(rows):\n" +
        "        for c in range(cols):\n" +
        "            if grid[r][c] == '1':\n" +
        "                count += 1\n" +
        "                dfs(r, c)\n" +
        "    return count\n",
    };
  }

  function topoRef(n, edges) {
    const indeg = Array(n).fill(0);
    const g = Array.from({ length: n }, () => []);
    for (const [a, b] of edges) {
      g[a].push(b);
      indeg[b]++;
    }
    for (const list of g) list.sort((x, y) => x - y);
    const q = [];
    for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
    q.sort((a, b) => a - b);
    const order = [];
    while (q.length) {
      const u = q.shift();
      order.push(u);
      for (const v of g[u]) {
        indeg[v]--;
        if (indeg[v] === 0) {
          q.push(v);
          q.sort((a, b) => a - b);
        }
      }
    }
    return order.length === n ? order : [];
  }

  function genTopo(rng, seed) {
    const tests = [];
    for (let t = 0; t < 4; t++) {
      const n = 4 + Math.floor(rng() * 3);
      const edges = [];
      for (let i = 0; i < n - 1; i++) {
        // chain-ish DAG
        const a = Math.floor(rng() * (n - 1));
        const b = a + 1 + Math.floor(rng() * (n - 1 - a));
        edges.push([a, b]);
      }
      const expected = topoRef(n, edges);
      if (!expected.length) continue;
      tests.push({
        args: [n, edges.map((e) => e.slice())],
        expected,
      });
    }
    if (!tests.length) {
      tests.push({ args: [4, [[0, 1], [0, 2], [1, 3], [2, 3]]], expected: topoRef(4, [[0, 1], [0, 2], [1, 3], [2, 3]]) });
    }
    return {
      id: "browser_topo_" + seed,
      title: "Topological Sort (Kahn)",
      pattern: "topological_sort",
      difficulty: "medium",
      description:
        "Write a function that returns a valid topological ordering of a directed acyclic graph (DAG).\n\n" +
        "Inputs:\n" +
        "  • n — nodes 0..n-1\n" +
        "  • edges — directed edges [a, b] meaning a must come before b (a → b)\n\n" +
        "Output:\n" +
        "  • a list of all n nodes in an order that respects every edge\n" +
        "  • if you use Kahn's algorithm and always pop the smallest ready node, tests match exactly\n\n" +
        "Example: n=4, edges=[[0,1],[0,2],[1,3],[2,3]] → [0,1,2,3] (one valid order)",
      functionName: "topo_sort",
      starterCode:
        "from collections import deque, defaultdict\n\n" +
        "def topo_sort(n: int, edges: list[list[int]]) -> list[int]:\n    ...\n",
      tests,
      compare: "topo",
      hints: ["Indegree array + queue of zeros", "Pop smallest id for deterministic order"],
      tutorTopic: "bfs",
      mentalModel: "Prerequisites: only emit a node when all deps are done.",
      modelAnswer:
        "from collections import deque, defaultdict\n\n" +
        "def topo_sort(n: int, edges: list[list[int]]) -> list[int]:\n" +
        "    g = defaultdict(list)\n" +
        "    indeg = [0] * n\n" +
        "    for a, b in edges:\n" +
        "        g[a].append(b)\n" +
        "        indeg[b] += 1\n" +
        "    q = deque(sorted(i for i in range(n) if indeg[i] == 0))\n" +
        "    order = []\n" +
        "    while q:\n" +
        "        u = q.popleft()\n" +
        "        order.append(u)\n" +
        "        for v in sorted(g[u]):\n" +
        "            indeg[v] -= 1\n" +
        "            if indeg[v] == 0:\n" +
        "                q.append(v)\n" +
        "                q = deque(sorted(q))\n" +
        "    return order if len(order) == n else []\n",
    };
  }

  function subsetsRef(nums) {
    const out = [[]];
    for (const n of nums) {
      const add = out.map((s) => s.concat([n]));
      out.push(...add);
    }
    return out
      .map((s) => s.slice().sort((a, b) => a - b))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }

  function genBacktracking(rng, seed) {
    const tests = [];
    for (let t = 0; t < 4; t++) {
      const n = 2 + Math.floor(rng() * 3);
      const set = new Set();
      while (set.size < n) set.add(1 + Math.floor(rng() * 9));
      const nums = [...set].sort((a, b) => a - b);
      tests.push({ args: [nums.slice()], expected: subsetsRef(nums) });
    }
    return {
      id: "browser_bt_" + seed,
      title: "Subsets (Backtracking)",
      pattern: "backtracking",
      difficulty: "medium",
      description:
        "Write a function that returns all possible subsets (the power set) of a list of unique integers.\n\n" +
        "Input:\n" +
        "  • nums — list of unique ints\n\n" +
        "Output:\n" +
        "  • list of all subsets (each subset a list). Order of subsets / elements inside does not matter for grading.\n\n" +
        "Example: nums = [1, 2] → [[], [1], [2], [1, 2]]",
      functionName: "subsets",
      starterCode: "def subsets(nums: list[int]) -> list[list[int]]:\n    ...\n",
      tests,
      compare: "sorted_nested",
      hints: ["Choose / explore / unchoose", "Or iterative: for each num, duplicate existing subsets"],
      tutorTopic: "dp",
      mentalModel: "Decision tree: include or exclude each element.",
      modelAnswer:
        "def subsets(nums: list[int]) -> list[list[int]]:\n" +
        "    out = []\n" +
        "    path = []\n" +
        "    def dfs(start):\n" +
        "        out.append(path[:])\n" +
        "        for i in range(start, len(nums)):\n" +
        "            path.append(nums[i])\n" +
        "            dfs(i + 1)\n" +
        "            path.pop()\n" +
        "    dfs(0)\n" +
        "    return out\n",
    };
  }

  function kthLargestRef(nums, k) {
    const a = nums.slice().sort((x, y) => y - x);
    return a[k - 1];
  }

  function genHeap(rng, seed) {
    const tests = [];
    for (let t = 0; t < 6; t++) {
      const n = 5 + Math.floor(rng() * 6);
      const nums = Array.from({ length: n }, () => Math.floor(rng() * 40) - 5);
      const k = 1 + Math.floor(rng() * Math.min(4, n));
      tests.push({ args: [nums.slice(), k], expected: kthLargestRef(nums, k) });
    }
    return {
      id: "browser_heap_" + seed,
      title: "Kth Largest Element",
      pattern: "heap",
      difficulty: "medium",
      description:
        "Write a function that returns the k-th largest element in an unsorted list (1-based: k=1 is the maximum).\n\n" +
        "Inputs:\n" +
        "  • nums — list of integers\n" +
        "  • k — positive integer ≤ len(nums)\n\n" +
        "Output:\n" +
        "  • the k-th largest value\n\n" +
        "Preferred mental model: min-heap of size k (or sort descending and index k-1).\n\n" +
        "Example: nums = [3, 2, 1, 5, 6, 4], k = 2 → 5",
      functionName: "find_kth_largest",
      starterCode:
        "import heapq\n\ndef find_kth_largest(nums: list[int], k: int) -> int:\n    ...\n",
      tests,
      compare: "equal",
      hints: ["heapq.nlargest(k, nums)[-1]", "Or maintain min-heap of size k"],
      tutorTopic: "heap",
      mentalModel: "Repeated extract-max / bounded priority queue.",
      modelAnswer:
        "import heapq\n\n" +
        "def find_kth_largest(nums: list[int], k: int) -> int:\n" +
        "    return heapq.nlargest(k, nums)[-1]\n",
    };
  }

  function nextGreaterRef(nums) {
    const n = nums.length;
    const ans = Array(n).fill(-1);
    const stack = [];
    for (let i = 0; i < n; i++) {
      while (stack.length && nums[stack[stack.length - 1]] < nums[i]) {
        ans[stack.pop()] = nums[i];
      }
      stack.push(i);
    }
    return ans;
  }

  function genMonoStack(rng, seed) {
    // Mix next-greater and valid-parens for stack muscle memory
    if (rng() < 0.45) return genParens(rng, seed);
    const tests = [];
    for (let t = 0; t < 5; t++) {
      const nums = Array.from(
        { length: 4 + Math.floor(rng() * 5) },
        () => Math.floor(rng() * 20)
      );
      tests.push({ args: [nums.slice()], expected: nextGreaterRef(nums) });
    }
    return {
      id: "browser_ng_" + seed,
      title: "Next Greater Element",
      pattern: "monotonic_stack",
      difficulty: "medium",
      description:
        "For each element, find the next greater element to its right. If none exists, use -1.\n\n" +
        "Input:\n" +
        "  • nums — list of integers\n\n" +
        "Output:\n" +
        "  • list of the same length; ans[i] = first nums[j] with j > i and nums[j] > nums[i], else -1\n\n" +
        "Example: nums = [2, 1, 2, 4, 3] → [4, 2, 4, -1, -1]",
      functionName: "next_greater",
      starterCode: "def next_greater(nums: list[int]) -> list[int]:\n    ...\n",
      tests,
      compare: "equal",
      hints: ["Monotonic decreasing stack of indices", "While top < current, pop and set answer"],
      tutorTopic: "stack",
      mentalModel: "Stack stores candidates waiting for a greater value.",
      modelAnswer:
        "def next_greater(nums: list[int]) -> list[int]:\n" +
        "    n = len(nums)\n" +
        "    ans = [-1] * n\n" +
        "    stack = []  # indices, values decreasing\n" +
        "    for i, x in enumerate(nums):\n" +
        "        while stack and nums[stack[-1]] < x:\n" +
        "            ans[stack.pop()] = x\n" +
        "        stack.append(i)\n" +
        "    return ans\n",
    };
  }

  function countComponentsRef(n, edges) {
    const parent = Array.from({ length: n }, (_, i) => i);
    function find(x) {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return x;
    }
    let comps = n;
    for (const [a, b] of edges) {
      const ra = find(a),
        rb = find(b);
      if (ra !== rb) {
        parent[rb] = ra;
        comps--;
      }
    }
    return comps;
  }

  function genUnionFind(rng, seed) {
    const tests = [];
    for (let t = 0; t < 5; t++) {
      const n = 5 + Math.floor(rng() * 4);
      const edges = [];
      const m = Math.floor(rng() * n);
      for (let i = 0; i < m; i++) {
        const a = Math.floor(rng() * n);
        let b = Math.floor(rng() * n);
        while (b === a) b = Math.floor(rng() * n);
        edges.push([a, b]);
      }
      tests.push({
        args: [n, edges.map((e) => e.slice())],
        expected: countComponentsRef(n, edges),
      });
    }
    return {
      id: "browser_uf_" + seed,
      title: "Connected Components (Union-Find)",
      pattern: "union_find",
      difficulty: "medium",
      description:
        "Write a function that counts connected components in an undirected graph using Union-Find (DSU).\n\n" +
        "Inputs:\n" +
        "  • n — nodes 0..n-1\n" +
        "  • edges — undirected edges [u, v]\n\n" +
        "Output:\n" +
        "  • number of connected components\n\n" +
        "Example: n=5, edges=[[0,1],[1,2],[3,4]] → 2",
      functionName: "count_components",
      starterCode:
        "def count_components(n: int, edges: list[list[int]]) -> int:\n    ...\n",
      tests,
      compare: "equal",
      hints: ["parent array + find with path compression", "Start with n components; decrement on successful union"],
      tutorTopic: "bfs",
      mentalModel: "Dynamic connectivity: merge sets, count roots.",
      modelAnswer:
        "def count_components(n: int, edges: list[list[int]]) -> int:\n" +
        "    parent = list(range(n))\n" +
        "    def find(x):\n" +
        "        while parent[x] != x:\n" +
        "            parent[x] = parent[parent[x]]\n" +
        "            x = parent[x]\n" +
        "        return x\n" +
        "    comps = n\n" +
        "    for a, b in edges:\n" +
        "        ra, rb = find(a), find(b)\n" +
        "        if ra != rb:\n" +
        "            parent[rb] = ra\n" +
        "            comps -= 1\n" +
        "    return comps\n",
    };
  }

  function trieStartsWithCount(words, prefix) {
    return words.filter((w) => w.startsWith(prefix)).length;
  }

  function genTrie(rng, seed) {
    const alpha = "abcdef";
    const tests = [];
    for (let t = 0; t < 5; t++) {
      const words = [];
      const wn = 4 + Math.floor(rng() * 4);
      for (let i = 0; i < wn; i++) {
        let w = "";
        const len = 2 + Math.floor(rng() * 4);
        for (let k = 0; k < len; k++) w += alpha[Math.floor(rng() * alpha.length)];
        words.push(w);
      }
      const prefix = words[Math.floor(rng() * words.length)].slice(
        0,
        1 + Math.floor(rng() * 2)
      );
      tests.push({
        args: [words.slice(), prefix],
        expected: trieStartsWithCount(words, prefix),
      });
    }
    return {
      id: "browser_trie_" + seed,
      title: "Prefix Count (Trie mindset)",
      pattern: "trie",
      difficulty: "medium",
      description:
        "Write a function that counts how many words start with a given prefix. Implement it with a Trie (prefix tree) to burn the structure into memory — even though a linear scan would also pass these small tests.\n\n" +
        "Inputs:\n" +
        "  • words — list of lowercase strings\n" +
        "  • prefix — string prefix to match\n\n" +
        "Output:\n" +
        "  • count of words that start with prefix\n\n" +
        'Example: words=["app","apple","apply","banana"], prefix="app" → 3',
      functionName: "count_prefix",
      starterCode:
        "def count_prefix(words: list[str], prefix: str) -> int:\n" +
        "    # Build a trie, then walk the prefix and read a subtree count\n    ...\n",
      tests,
      compare: "equal",
      hints: [
        "Node = dict children + count of words through this node",
        "On insert, increment count on every node along the path",
      ],
      tutorTopic: "trie",
      mentalModel: "Shared prefixes as a tree of character edges.",
      modelAnswer:
        "def count_prefix(words: list[str], prefix: str) -> int:\n" +
        "    class Node:\n" +
        "        def __init__(self):\n" +
        "            self.child = {}\n" +
        "            self.count = 0\n" +
        "    root = Node()\n" +
        "    for w in words:\n" +
        "        cur = root\n" +
        "        for ch in w:\n" +
        "            if ch not in cur.child:\n" +
        "                cur.child[ch] = Node()\n" +
        "            cur = cur.child[ch]\n" +
        "            cur.count += 1\n" +
        "    cur = root\n" +
        "    for ch in prefix:\n" +
        "        if ch not in cur.child:\n" +
        "            return 0\n" +
        "        cur = cur.child[ch]\n" +
        "    return cur.count\n",
    };
  }

  function dijkstraRef(n, edges, src) {
    const g = Array.from({ length: n }, () => []);
    for (const [u, v, w] of edges) g[u].push([v, w]);
    const dist = Array(n).fill(Infinity);
    dist[src] = 0;
    const used = Array(n).fill(false);
    for (let k = 0; k < n; k++) {
      let u = -1;
      for (let i = 0; i < n; i++)
        if (!used[i] && (u < 0 || dist[i] < dist[u])) u = i;
      if (u < 0 || dist[u] === Infinity) break;
      used[u] = true;
      for (const [v, w] of g[u]) {
        if (dist[v] > dist[u] + w) dist[v] = dist[u] + w;
      }
    }
    return dist.map((d) => (d === Infinity ? -1 : d));
  }

  function genDijkstra(rng, seed) {
    const tests = [];
    for (let t = 0; t < 4; t++) {
      const n = 4 + Math.floor(rng() * 3);
      const edges = [];
      for (let i = 1; i < n; i++) {
        edges.push([Math.floor(rng() * i), i, 1 + Math.floor(rng() * 9)]);
      }
      // a few extra edges
      if (n > 3) edges.push([0, n - 1, 2 + Math.floor(rng() * 8)]);
      tests.push({
        args: [n, edges.map((e) => e.slice()), 0],
        expected: dijkstraRef(n, edges, 0),
      });
    }
    return {
      id: "browser_dij_" + seed,
      title: "Dijkstra Shortest Paths",
      pattern: "dijkstra",
      difficulty: "medium",
      description:
        "Write a function that computes shortest-path distances from a source in a directed weighted graph with non-negative weights.\n\n" +
        "Inputs:\n" +
        "  • n — nodes 0..n-1\n" +
        "  • edges — list of [u, v, w] directed edges with weight w ≥ 0\n" +
        "  • src — source node\n\n" +
        "Output:\n" +
        "  • list dist of length n where dist[i] is shortest distance from src to i, or -1 if unreachable\n\n" +
        "Example: n=3, edges=[[0,1,4],[0,2,1],[2,1,2]], src=0 → [0, 3, 1]",
      functionName: "shortest_paths",
      starterCode:
        "import heapq\n\n" +
        "def shortest_paths(n: int, edges: list[list[int]], src: int) -> list[int]:\n    ...\n",
      tests,
      compare: "equal",
      hints: ["Min-heap of (dist, node)", "Skip stale heap entries"],
      tutorTopic: "bfs",
      mentalModel: "Priority wavefront: expand cheapest unsettled node next.",
      modelAnswer:
        "import heapq\nfrom collections import defaultdict\n\n" +
        "def shortest_paths(n: int, edges: list[list[int]], src: int) -> list[int]:\n" +
        "    g = defaultdict(list)\n" +
        "    for u, v, w in edges:\n" +
        "        g[u].append((v, w))\n" +
        "    dist = [float('inf')] * n\n" +
        "    dist[src] = 0\n" +
        "    pq = [(0, src)]\n" +
        "    while pq:\n" +
        "        d, u = heapq.heappop(pq)\n" +
        "        if d != dist[u]:\n" +
        "            continue\n" +
        "        for v, w in g[u]:\n" +
        "            nd = d + w\n" +
        "            if nd < dist[v]:\n" +
        "                dist[v] = nd\n" +
        "                heapq.heappush(pq, (nd, v))\n" +
        "    return [(-1 if x == float('inf') else x) for x in dist]\n",
    };
  }

  function genDp(rng, seed) {
    return rng() < 0.55 ? genKadane(rng, seed) : genClimb(rng, seed);
  }

  function genMonotonicStack(rng, seed) {
    return genMonoStack(rng, seed);
  }

  function minEatingSpeedRef(piles, h) {
    let lo = 1,
      hi = Math.max(...piles);
    const can = (k) => {
      let hours = 0;
      for (const p of piles) hours += Math.ceil(p / k);
      return hours <= h;
    };
    let ans = hi;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (can(mid)) {
        ans = mid;
        hi = mid - 1;
      } else lo = mid + 1;
    }
    return ans;
  }

  function genBinarySearchAnswer(rng, seed) {
    const tests = [];
    for (let t = 0; t < 5; t++) {
      const n = 3 + Math.floor(rng() * 4);
      const piles = Array.from({ length: n }, () => 1 + Math.floor(rng() * 20));
      const minH = n;
      const maxH = piles.reduce((a, b) => a + b, 0);
      const h = minH + Math.floor(rng() * Math.max(1, maxH - minH));
      tests.push({
        args: [piles.slice(), h],
        expected: minEatingSpeedRef(piles, h),
      });
    }
    return {
      id: "browser_bsa_" + seed,
      title: "Koko Eating Bananas (BS on Answer)",
      pattern: "binary_search_answer",
      difficulty: "medium",
      description:
        "Koko has piles of bananas. She eats at speed k bananas/hour (whole pile finishes in ceil(pile/k) hours). Find the minimum integer k such that she finishes all piles within h hours.\n\n" +
        "Inputs:\n" +
        "  • piles — list of positive ints\n" +
        "  • h — hours available (h ≥ len(piles))\n\n" +
        "Output:\n" +
        "  • minimum eating speed k\n\n" +
        "Example: piles = [3, 6, 7, 11], h = 8 → 4\n\n" +
        "Mental model: binary search the answer space; can(k) is monotone.",
      functionName: "min_eating_speed",
      starterCode:
        "def min_eating_speed(piles: list[int], h: int) -> int:\n    ...\n",
      tests,
      compare: "equal",
      hints: [
        "lo=1, hi=max(piles); binary search minimal k with can(k)",
        "can(k) = sum(ceil(p/k) for p in piles) <= h",
      ],
      tutorTopic: "binary_search_answer",
      mentalModel: "Search the numeric answer; check feasibility each mid.",
      modelAnswer:
        "def min_eating_speed(piles: list[int], h: int) -> int:\n" +
        "    def can(k):\n" +
        "        return sum((p + k - 1) // k for p in piles) <= h\n" +
        "    lo, hi = 1, max(piles)\n" +
        "    ans = hi\n" +
        "    while lo <= hi:\n" +
        "        mid = (lo + hi) // 2\n" +
        "        if can(mid):\n" +
        "            ans = mid\n" +
        "            hi = mid - 1\n" +
        "        else:\n" +
        "            lo = mid + 1\n" +
        "    return ans\n",
    };
  }

  function maxConcurrentRef(intervals) {
    const events = [];
    for (const [s, e] of intervals) {
      events.push([s, 1]);
      events.push([e, -1]);
    }
    events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let cur = 0,
      best = 0;
    for (const [, d] of events) {
      cur += d;
      best = Math.max(best, cur);
    }
    return best;
  }

  function genSweepLine(rng, seed) {
    const tests = [];
    for (let t = 0; t < 5; t++) {
      const n = 3 + Math.floor(rng() * 5);
      const intervals = [];
      for (let i = 0; i < n; i++) {
        const s = Math.floor(rng() * 20);
        const e = s + 1 + Math.floor(rng() * 8);
        intervals.push([s, e]);
      }
      tests.push({
        args: [intervals.map((iv) => iv.slice())],
        expected: maxConcurrentRef(intervals),
      });
    }
    return {
      id: "browser_sweep_" + seed,
      title: "Max Concurrent Intervals (Sweep Line)",
      pattern: "sweep_line",
      difficulty: "medium",
      description:
        "Given half-open intervals [start, end), return the maximum number that overlap at any time (max concurrent).\n\n" +
        "Input:\n" +
        "  • intervals — list of [start, end] with start < end\n\n" +
        "Output:\n" +
        "  • max concurrency (integer)\n\n" +
        "Example: [[0, 30], [5, 10], [15, 20]] → 2\n\n" +
        "Hint: event sort — +1 at start, -1 at end; process ends before starts at the same timestamp.",
      functionName: "max_concurrent",
      starterCode:
        "def max_concurrent(intervals: list[list[int]]) -> int:\n    ...\n",
      tests,
      compare: "equal",
      hints: [
        "Events (t, +1) and (t, -1); sort by t then by delta",
        "Track running count; record max",
      ],
      tutorTopic: "sweep_line",
      mentalModel: "Scan the timeline; active count is load.",
      modelAnswer:
        "def max_concurrent(intervals: list[list[int]]) -> int:\n" +
        "    events = []\n" +
        "    for s, e in intervals:\n" +
        "        events.append((s, 1))\n" +
        "        events.append((e, -1))\n" +
        "    events.sort(key=lambda x: (x[0], x[1]))\n" +
        "    cur = best = 0\n" +
        "    for _, d in events:\n" +
        "        cur += d\n" +
        "        best = max(best, cur)\n" +
        "    return best\n",
    };
  }

  function reverseListValuesRef(vals) {
    return vals.slice().reverse();
  }

  function genLinkedList(rng, seed) {
    if (rng() < 0.5) {
      const tests = [];
      for (let t = 0; t < 6; t++) {
        const n = 2 + Math.floor(rng() * 6);
        const vals = Array.from({ length: n }, () => Math.floor(rng() * 40));
        tests.push({ args: [vals.slice()], expected: reverseListValuesRef(vals) });
      }
      return {
        id: "browser_ll_rev_" + seed,
        title: "Reverse Linked List (values)",
        pattern: "linked_list",
        difficulty: "easy",
        description:
          "Reverse a singly linked list. For these drills the list is given as a Python list of values — build nodes (or reverse in place as an array using the same prev/cur/next mental model), reverse, and return the values in order.\n\n" +
          "Input:\n" +
          "  • vals — list of node values in head→tail order\n\n" +
          "Output:\n" +
          "  • reversed values\n\n" +
          "Example: [1, 2, 3] → [3, 2, 1]\n\n" +
          "Burn the trio: prev, cur, nxt = None, head, None; while cur: nxt=cur.next; cur.next=prev; prev,cur=cur,nxt",
        functionName: "reverse_list_values",
        starterCode:
          "def reverse_list_values(vals: list[int]) -> list[int]:\n" +
          "    # Prefer implementing with an explicit ListNode class\n    ...\n",
        tests,
        compare: "equal",
        hints: ["prev/cur/next rewiring", "Dummy head not needed for reverse"],
        tutorTopic: "linked_list",
        mentalModel: "Rewire next pointers; never lose the forward link.",
        modelAnswer:
          "class ListNode:\n" +
          "    def __init__(self, val=0, next=None):\n" +
          "        self.val, self.next = val, next\n\n" +
          "def reverse_list_values(vals: list[int]) -> list[int]:\n" +
          "    # Build forward\n" +
          "    dummy = ListNode(0)\n" +
          "    cur = dummy\n" +
          "    for v in vals:\n" +
          "        cur.next = ListNode(v)\n" +
          "        cur = cur.next\n" +
          "    # Reverse with prev/cur/nxt\n" +
          "    prev, cur = None, dummy.next\n" +
          "    while cur:\n" +
          "        nxt = cur.next\n" +
          "        cur.next = prev\n" +
          "        prev, cur = cur, nxt\n" +
          "    out = []\n" +
          "    while prev:\n" +
          "        out.append(prev.val)\n" +
          "        prev = prev.next\n" +
          "    return out\n",
      };
    }
    // Cycle detection: next[i] = index of next node, or -1; start at 0
    const tests = [];
    for (let t = 0; t < 5; t++) {
      const n = 4 + Math.floor(rng() * 4);
      const next = Array.from({ length: n }, (_, i) => (i + 1 < n ? i + 1 : -1));
      let hasCycle = rng() < 0.55;
      if (hasCycle) {
        const entry = Math.floor(rng() * (n - 1));
        next[n - 1] = entry;
      }
      // Floyd on index graph
      let slow = 0,
        fast = 0,
        found = false;
      for (let step = 0; step < n * 2 + 2; step++) {
        if (fast === -1 || next[fast] === -1) break;
        slow = next[slow];
        fast = next[next[fast]];
        if (slow === -1 || fast === -1) break;
        if (slow === fast) {
          found = true;
          break;
        }
      }
      tests.push({ args: [next.slice()], expected: found });
    }
    return {
      id: "browser_ll_cycle_" + seed,
      title: "Linked List Cycle (Floyd)",
      pattern: "linked_list",
      difficulty: "easy",
      description:
        "Detect whether a singly linked list has a cycle using Floyd's tortoise/hare.\n\n" +
        "Input representation (no object graph in the sandbox):\n" +
        "  • next_idx — list of length n; next_idx[i] is the index of the next node, or -1 for None\n" +
        "  • start at node 0\n\n" +
        "Output:\n" +
        "  • True if a cycle is reachable from 0, else False\n\n" +
        "Example: next_idx = [1, 2, 0] → True (0→1→2→0)",
      functionName: "has_cycle",
      starterCode:
        "def has_cycle(next_idx: list[int]) -> bool:\n    ...\n",
      tests,
      compare: "equal",
      hints: ["slow = next[slow]; fast = next[next[fast]]", "Meet ⇒ cycle"],
      tutorTopic: "linked_list",
      mentalModel: "Fast pointer laps slow inside a cycle.",
      modelAnswer:
        "def has_cycle(next_idx: list[int]) -> bool:\n" +
        "    if not next_idx:\n" +
        "        return False\n" +
        "    slow = fast = 0\n" +
        "    while True:\n" +
        "        if fast == -1 or next_idx[fast] == -1:\n" +
        "            return False\n" +
        "        slow = next_idx[slow]\n" +
        "        fast = next_idx[next_idx[fast]]\n" +
        "        if slow == -1 or fast == -1:\n" +
        "            return False\n" +
        "        if slow == fast:\n" +
        "            return True\n",
    };
  }

  function singleNumberRef(nums) {
    let x = 0;
    for (const n of nums) x ^= n;
    return x;
  }

  function genBitManipulation(rng, seed) {
    const tests = [];
    for (let t = 0; t < 6; t++) {
      const n = 3 + Math.floor(rng() * 5);
      const pairs = Array.from({ length: n }, () => 1 + Math.floor(rng() * 30));
      const unique = 40 + Math.floor(rng() * 20);
      const nums = [];
      for (const p of pairs) {
        nums.push(p, p);
      }
      nums.push(unique);
      // shuffle
      for (let i = nums.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [nums[i], nums[j]] = [nums[j], nums[i]];
      }
      tests.push({ args: [nums.slice()], expected: singleNumberRef(nums) });
    }
    return {
      id: "browser_bit_" + seed,
      title: "Single Number (XOR)",
      pattern: "bit_manipulation",
      difficulty: "easy",
      description:
        "Every element appears twice except one. Find the single element in O(n) time and O(1) space.\n\n" +
        "Input:\n" +
        "  • nums — list of ints\n\n" +
        "Output:\n" +
        "  • the unique element\n\n" +
        "Example: [4, 1, 2, 1, 2] → 4\n\n" +
        "XOR identity: a^a=0, a^0=a.",
      functionName: "single_number",
      starterCode: "def single_number(nums: list[int]) -> int:\n    ...\n",
      tests,
      compare: "equal",
      hints: ["XOR everything", "Pairs cancel"],
      tutorTopic: "bit_manipulation",
      mentalModel: "XOR is its own inverse — pairs vanish.",
      modelAnswer:
        "def single_number(nums: list[int]) -> int:\n" +
        "    x = 0\n" +
        "    for n in nums:\n" +
        "        x ^= n\n" +
        "    return x\n",
    };
  }

  function applyRangeUpdatesRef(n, updates) {
    const diff = Array(n + 1).fill(0);
    for (const [L, R, val] of updates) {
      diff[L] += val;
      if (R + 1 < diff.length) diff[R + 1] -= val;
    }
    const out = Array(n).fill(0);
    let run = 0;
    for (let i = 0; i < n; i++) {
      run += diff[i];
      out[i] = run;
    }
    return out;
  }

  function genDifferenceArray(rng, seed) {
    const tests = [];
    for (let t = 0; t < 5; t++) {
      const n = 5 + Math.floor(rng() * 6);
      const u = 2 + Math.floor(rng() * 4);
      const updates = [];
      for (let i = 0; i < u; i++) {
        const L = Math.floor(rng() * n);
        const R = L + Math.floor(rng() * (n - L));
        const val = 1 + Math.floor(rng() * 5);
        updates.push([L, R, val]);
      }
      tests.push({
        args: [n, updates.map((u) => u.slice())],
        expected: applyRangeUpdatesRef(n, updates),
      });
    }
    return {
      id: "browser_diff_" + seed,
      title: "Range Updates (Difference Array)",
      pattern: "difference_array",
      difficulty: "medium",
      description:
        "Start from an array of n zeros. Apply updates of the form: add val to every index in [L, R] inclusive. Return the final array.\n\n" +
        "Inputs:\n" +
        "  • n — array length\n" +
        "  • updates — list of [L, R, val]\n\n" +
        "Output:\n" +
        "  • final array of length n\n\n" +
        "Example: n=5, updates=[[1,3,2],[2,4,3]] → [0, 2, 5, 5, 3]\n\n" +
        "Technique: diff[L]+=val; diff[R+1]-=val; then prefix-sum reconstruct.",
      functionName: "apply_range_updates",
      starterCode:
        "def apply_range_updates(n: int, updates: list[list[int]]) -> list[int]:\n    ...\n",
      tests,
      compare: "equal",
      hints: ["Difference array length n+1", "Rebuild with running sum"],
      tutorTopic: "difference_array",
      mentalModel: "Encode range writes as two point updates; integrate once.",
      modelAnswer:
        "def apply_range_updates(n: int, updates: list[list[int]]) -> list[int]:\n" +
        "    diff = [0] * (n + 1)\n" +
        "    for L, R, val in updates:\n" +
        "        diff[L] += val\n" +
        "        if R + 1 < len(diff):\n" +
        "            diff[R + 1] -= val\n" +
        "    out = [0] * n\n" +
        "    run = 0\n" +
        "    for i in range(n):\n" +
        "        run += diff[i]\n" +
        "        out[i] = run\n" +
        "    return out\n",
    };
  }

  /** All 21 course patterns — keep this list in sync with patterns.py */
  const ALL_PATTERNS = [
    { id: "sliding_window", name: "1. Sliding Window" },
    { id: "two_pointers", name: "2. Two Pointers" },
    { id: "binary_search", name: "3. Binary Search" },
    { id: "bfs", name: "4. BFS" },
    { id: "dfs", name: "5. DFS" },
    { id: "topological_sort", name: "6. Topological Sort" },
    { id: "dp", name: "7. Dynamic Programming" },
    { id: "greedy", name: "8. Greedy" },
    { id: "backtracking", name: "9. Backtracking" },
    { id: "heap", name: "10. Heap / Priority Queue" },
    { id: "monotonic_stack", name: "11. Monotonic Stack" },
    { id: "union_find", name: "12. Union-Find" },
    { id: "trie", name: "13. Trie" },
    { id: "prefix_sum", name: "14. Prefix Sum" },
    { id: "hash_map", name: "15. Hash Map" },
    { id: "dijkstra", name: "16. Dijkstra" },
    { id: "binary_search_answer", name: "17. Binary Search on Answer" },
    { id: "sweep_line", name: "18. Sweep Line / Intervals" },
    { id: "linked_list", name: "19. Linked List Techniques" },
    { id: "bit_manipulation", name: "20. Bit Manipulation" },
    { id: "difference_array", name: "21. Difference Array" },
  ];

  const PATTERN_GENS = {
    sliding_window: genSlidingWindow,
    two_pointers: genTwoPointers,
    binary_search: genBinarySearch,
    bfs: genBfs,
    dfs: genDfs,
    topological_sort: genTopo,
    dp: genDp,
    greedy: genMerge,
    backtracking: genBacktracking,
    heap: genHeap,
    monotonic_stack: genMonotonicStack,
    union_find: genUnionFind,
    trie: genTrie,
    prefix_sum: genPrefix,
    hash_map: genTwoSum,
    dijkstra: genDijkstra,
    binary_search_answer: genBinarySearchAnswer,
    sweep_line: genSweepLine,
    linked_list: genLinkedList,
    bit_manipulation: genBitManipulation,
    difference_array: genDifferenceArray,
    // aliases
    two_sum: genTwoSum,
    kadane: genKadane,
    climb: genClimb,
    stack: genParens,
  };

  const PATTERN_LIST = ALL_PATTERNS.map((p) => p.id);

  function generateCodingProblem(seed, pattern) {
    const rng = mulberry32(seed >>> 0);
    const key =
      pattern && PATTERN_GENS[pattern]
        ? pattern
        : PATTERN_LIST[Math.floor(rng() * PATTERN_LIST.length)];
    return PATTERN_GENS[key](rng, seed);
  }

  /* ---------- Test runner (Pyodide) ---------- */

  const RUNNER_PY = `
import json
import traceback

def _normalize(x):
    if isinstance(x, tuple):
        return [_normalize(v) for v in x]
    if isinstance(x, list):
        return [_normalize(v) for v in x]
    if isinstance(x, dict):
        return {str(k): _normalize(v) for k, v in x.items()}
    if isinstance(x, bool) or x is None:
        return x
    if isinstance(x, (int, float, str)):
        return x
    return repr(x)

def _equal(got, expected, mode, args):
    g, e = _normalize(got), _normalize(expected)
    if mode == "two_sum":
        nums, target = args[0], args[1]
        if not isinstance(got, (list, tuple)) or len(got) != 2:
            return False, g
        i, j = int(got[0]), int(got[1])
        if i == j or i < 0 or j < 0 or i >= len(nums) or j >= len(nums):
            return False, g
        return (nums[i] + nums[j] == target), g
    if mode == "sorted_nested":
        if not isinstance(got, (list, tuple)):
            return False, g
        def canon(rows):
            return sorted(tuple(sorted(row)) for row in rows)
        try:
            return canon(got) == canon(expected), g
        except Exception:
            return False, g
    if mode == "topo":
        n, edges = args[0], args[1]
        if not isinstance(got, (list, tuple)) or len(got) != n:
            return False, g
        if sorted(got) != list(range(n)):
            return False, g
        pos = {node: i for i, node in enumerate(got)}
        for a, b in edges:
            if pos[a] >= pos[b]:
                return False, g
        return True, g
    return (g == e), g

def run_user_tests(user_src, fn_name, tests_json, compare_mode):
    ns = {}
    try:
        exec(user_src, ns, ns)
    except Exception as exc:
        return {
            "ok": False,
            "compile_error": f"{type(exc).__name__}: {exc}",
            "traceback": traceback.format_exc(),
            "results": [],
        }
    if fn_name not in ns or not callable(ns[fn_name]):
        return {
            "ok": False,
            "compile_error": f"Function '{fn_name}' not defined",
            "traceback": "",
            "results": [],
        }
    fn = ns[fn_name]
    tests = json.loads(tests_json)
    results = []
    passed = 0
    for i, tc in enumerate(tests):
        args = tc["args"]
        expected = tc["expected"]
        try:
            got = fn(*args)
            ok, got_n = _equal(got, expected, compare_mode, args)
            if ok:
                passed += 1
            results.append({
                "index": i + 1,
                "passed": ok,
                "args": _normalize(args),
                "expected": _normalize(expected),
                "got": got_n,
                "error": None,
            })
        except Exception as exc:
            results.append({
                "index": i + 1,
                "passed": False,
                "args": _normalize(args),
                "expected": _normalize(expected),
                "got": None,
                "error": f"{type(exc).__name__}: {exc}",
            })
    return {
        "ok": passed == len(tests),
        "passed": passed,
        "total": len(tests),
        "compile_error": None,
        "traceback": "",
        "results": results,
    }
`;

  async function runTests(problem, userCode) {
    const py = await ensurePyodide();
    await py.runPythonAsync(RUNNER_PY);
    py.globals.set("user_src", userCode);
    py.globals.set("fn_name", problem.functionName);
    py.globals.set("tests_json", JSON.stringify(problem.tests));
    py.globals.set("compare_mode", problem.compare || "equal");
    const raw = await py.runPythonAsync(
      "import json as _json\n" +
        "_json.dumps(run_user_tests(user_src, fn_name, tests_json, compare_mode))"
    );
    return JSON.parse(raw);
  }

  const REPL_BOOT_PY = `
import sys, traceback, ast
from io import StringIO
if "_arena_repl_ns" not in globals():
    _arena_repl_ns = {"__name__": "__repl__"}

def _arena_repl_exec(src: str):
    out, err = StringIO(), StringIO()
    stdout, stderr = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = out, err
    result_repr = None
    exc_text = None
    try:
        try:
            value = eval(compile(src, "<repl>", "eval"), _arena_repl_ns)
            if value is not None:
                result_repr = repr(value)
                _arena_repl_ns["_"] = value
        except SyntaxError:
            tree = ast.parse(src, mode="exec")
            if tree.body and isinstance(tree.body[-1], ast.Expr):
                last = tree.body.pop()
                if tree.body:
                    mod = ast.Module(body=tree.body, type_ignores=[])
                    exec(compile(mod, "<repl>", "exec"), _arena_repl_ns)
                value = eval(
                    compile(ast.Expression(last.value), "<repl>", "eval"),
                    _arena_repl_ns,
                )
                if value is not None:
                    result_repr = repr(value)
                    _arena_repl_ns["_"] = value
            else:
                exec(compile(src, "<repl>", "exec"), _arena_repl_ns)
    except Exception:
        exc_text = traceback.format_exc()
    finally:
        sys.stdout, sys.stderr = stdout, stderr
    return {
        "stdout": out.getvalue(),
        "stderr": err.getvalue(),
        "result": result_repr,
        "error": exc_text,
    }
`;

  let replBooted = false;

  async function runRepl(source) {
    const py = await ensurePyodide();
    if (!replBooted) {
      await py.runPythonAsync(REPL_BOOT_PY);
      replBooted = true;
    }
    py.globals.set("_arena_repl_src", source);
    const raw = await py.runPythonAsync(
      "import json as _json\n_json.dumps(_arena_repl_exec(_arena_repl_src))"
    );
    return JSON.parse(raw);
  }

  /* ---------- UI ---------- */

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function formatVal(v) {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }

  function getDraftKey(problemId) {
    return "arena_draft_" + problemId;
  }

  function wireLineNumbers(textarea, gutter) {
    if (!textarea || !gutter) return;
    // Mirror used to count visual wraps when word-wrap is on
    const mirror = document.createElement("div");
    mirror.setAttribute("aria-hidden", "true");
    Object.assign(mirror.style, {
      position: "absolute",
      visibility: "hidden",
      height: "auto",
      overflow: "hidden",
      whiteSpace: "pre-wrap",
      wordWrap: "break-word",
      overflowWrap: "anywhere",
      top: "0",
      left: "-9999px",
      pointerEvents: "none",
    });
    document.body.appendChild(mirror);

    const syncMirrorStyle = () => {
      const cs = getComputedStyle(textarea);
      mirror.style.font = cs.font;
      mirror.style.fontSize = cs.fontSize;
      mirror.style.fontFamily = cs.fontFamily;
      mirror.style.lineHeight = cs.lineHeight;
      mirror.style.letterSpacing = cs.letterSpacing;
      mirror.style.padding = cs.padding;
      mirror.style.boxSizing = cs.boxSizing;
      mirror.style.tabSize = cs.tabSize;
      mirror.style.width = textarea.clientWidth + "px";
    };

    const sync = () => {
      syncMirrorStyle();
      const cs = getComputedStyle(textarea);
      let lineHeight = parseFloat(cs.lineHeight);
      if (!lineHeight || Number.isNaN(lineHeight)) {
        lineHeight = parseFloat(cs.fontSize) * 1.5;
      }
      const logical = textarea.value.length
        ? textarea.value.split("\n")
        : [""];
      const parts = [];
      logical.forEach((line, idx) => {
        mirror.textContent = line.length ? line : " ";
        const h = Math.max(lineHeight, mirror.offsetHeight);
        const rows = Math.max(1, Math.round(h / lineHeight));
        parts.push(String(idx + 1));
        for (let r = 1; r < rows; r++) parts.push("");
      });
      gutter.textContent = parts.join("\n") || "1";
      gutter.scrollTop = textarea.scrollTop;
    };

    textarea.addEventListener("input", sync);
    textarea.addEventListener("scroll", () => {
      gutter.scrollTop = textarea.scrollTop;
    });
    window.addEventListener("resize", sync);
    const desc = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value"
    );
    if (desc && desc.set) {
      Object.defineProperty(textarea, "value", {
        get() {
          return desc.get.call(this);
        },
        set(v) {
          desc.set.call(this, v);
          sync();
        },
      });
    }
    // Initial sync after layout
    requestAnimationFrame(sync);
  }

  /* ---------- Worked-example movies (sync to current problem) ---------- */

  function paintArrayFrame(svg, values, opts) {
    if (!svg) return;
    opts = opts || {};
    const hi = opts.highlight || opts.hi || {};
    const note = opts.note || "";
    const pointers = opts.pointers || {};
    const n = values.length;
    const cellW = Math.min(72, n ? Math.floor(520 / n) : 72);
    const startX = 24;
    const y = 44;
    let html = "";
    values.forEach((v, idx) => {
      const x = startX + idx * (cellW + 6);
      let fill = "#21262d";
      if (hi[idx] === "focus") fill = "#3d2f00";
      else if (hi[idx] === "done") fill = "#1f3a5f";
      else if (hi[idx] === "bad") fill = "#3d1219";
      else if (hi[idx] === "good") fill = "#1a3d2e";
      html += `<rect x="${x}" y="${y}" width="${cellW}" height="48" rx="6" fill="${fill}" stroke="#484f58"/>`;
      html += `<text x="${x + cellW / 2}" y="${y + 30}" text-anchor="middle" fill="#e6edf3" font-size="16">${escapeHtml(
        String(v)
      )}</text>`;
      html += `<text x="${x + cellW / 2}" y="${y - 8}" text-anchor="middle" fill="#8b949e" font-size="11">${idx}</text>`;
    });
    Object.keys(pointers).forEach((label) => {
      const idx = pointers[label];
      if (idx == null || idx < 0 || idx >= n) return;
      const x = startX + idx * (cellW + 6) + cellW / 2;
      html += `<text x="${x}" y="${y + 68}" text-anchor="middle" fill="#58a6ff" font-size="12">${escapeHtml(
        label
      )}</text>`;
    });
    if (note) {
      html += `<text x="${startX}" y="128" fill="#39d2c0" font-size="13">${escapeHtml(
        note
      )}</text>`;
    }
    const w = Math.max(560, startX * 2 + n * (cellW + 6));
    svg.setAttribute("viewBox", `0 0 ${w} 150`);
    svg.innerHTML = html;
  }

  function paintTextBoard(svg, lines) {
    if (!svg) return;
    const h = Math.max(150, 36 + lines.length * 22);
    svg.setAttribute("viewBox", `0 0 640 ${h}`);
    let html = `<rect x="8" y="8" width="624" height="${h - 16}" rx="8" fill="#161b22" stroke="#30363d"/>`;
    lines.forEach((line, i) => {
      html += `<text x="24" y="${36 + i * 22}" fill="#e6edf3" font-size="14" font-family="ui-monospace, monospace">${escapeHtml(
        line
      )}</text>`;
    });
    svg.innerHTML = html;
  }

  function movieTitle(problem) {
    const pat = ALL_PATTERNS.find((p) => p.id === problem.pattern);
    const name = pat ? pat.name.replace(/^\d+\.\s*/, "") : problem.pattern;
    return `Worked example: ${name} — ${problem.title}`;
  }

  function buildWorkedMovie(problem) {
    const sample = (problem.tests && problem.tests[0]) || null;
    const args = sample ? sample.args : [];
    const expected = sample ? sample.expected : null;
    const pattern = problem.pattern;
    const fn = problem.functionName || "";

    // --- Hash map / two sum ---
    if (pattern === "hash_map" || fn === "two_sum") {
      const nums = (args[0] || []).slice(0, 8);
      const target = args[1];
      const steps = [];
      const seen = {};
      let found = null;
      for (let i = 0; i < nums.length; i++) {
        const need = target - nums[i];
        const snapSeen = { ...seen };
        const hi = { [i]: "focus" };
        if (need in seen) {
          hi[seen[need]] = "done";
          hi[i] = "done";
          found = [seen[need], i];
          steps.push({
            description: `i=${i} val=${nums[i]}; need ${need}; FOUND at ${seen[need]} → [${seen[need]}, ${i}]`,
            state: { hi, note: `seen={${Object.entries(snapSeen).map(([k, v]) => `${k}:${v}`).join(", ")}}  answer=[${found}]`, pointers: { i } },
          });
          break;
        }
        steps.push({
          description: `i=${i} val=${nums[i]}; need ${need}; not in map → store ${nums[i]}→${i}`,
          state: {
            hi,
            note: `seen={${[...Object.entries(snapSeen), [nums[i], i]].map(([k, v]) => `${k}:${v}`).join(", ")}}`,
            pointers: { i },
          },
        });
        seen[nums[i]] = i;
      }
      return {
        subtitle: `nums=${JSON.stringify(nums)}, target=${target} → ${JSON.stringify(expected)}`,
        initial: { values: nums, hi: {}, note: "Start: empty hash map", pointers: {} },
        frames: steps,
        painter: "array",
        values: nums,
      };
    }

    // --- Two pointers (sorted pair / container) ---
    if (pattern === "two_pointers") {
      if (fn === "two_sum_sorted" || (Array.isArray(args[0]) && typeof args[1] === "number")) {
        const nums = (args[0] || []).slice();
        const target = args[1];
        let lo = 0,
          hi = nums.length - 1;
        const frames = [];
        while (lo < hi) {
          const s = nums[lo] + nums[hi];
          const highlight = { [lo]: "focus", [hi]: "focus" };
          if (s === target) {
            highlight[lo] = "done";
            highlight[hi] = "done";
            frames.push({
              description: `L=${lo} R=${hi}: ${nums[lo]}+${nums[hi]}=${s} == target → [${lo}, ${hi}]`,
              state: { hi: highlight, note: `sum=${s} FOUND`, pointers: { L: lo, R: hi } },
            });
            break;
          }
          if (s < target) {
            frames.push({
              description: `L=${lo} R=${hi}: ${nums[lo]}+${nums[hi]}=${s} < ${target} → L++`,
              state: { hi: highlight, note: `sum=${s} too small`, pointers: { L: lo, R: hi } },
            });
            lo++;
          } else {
            frames.push({
              description: `L=${lo} R=${hi}: ${nums[lo]}+${nums[hi]}=${s} > ${target} → R--`,
              state: { hi: highlight, note: `sum=${s} too big`, pointers: { L: lo, R: hi } },
            });
            hi--;
          }
        }
        return {
          subtitle: `sorted nums=${JSON.stringify(nums)}, target=${target}`,
          initial: { values: nums, hi: {}, note: "L at start, R at end", pointers: { L: 0, R: nums.length - 1 } },
          frames,
          painter: "array",
          values: nums,
        };
      }
      // max area style
      const height = (args[0] || []).slice();
      let l = 0,
        r = height.length - 1,
        best = 0;
      const frames = [];
      while (l < r) {
        const area = Math.min(height[l], height[r]) * (r - l);
        best = Math.max(best, area);
        const highlight = { [l]: "focus", [r]: "focus" };
        frames.push({
          description: `L=${l} R=${r}: area=${area}, best=${best}; move the shorter side`,
          state: {
            hi: highlight,
            note: `area=${area} best=${best}`,
            pointers: { L: l, R: r },
          },
        });
        if (height[l] < height[r]) l++;
        else r--;
        if (frames.length > 10) break;
      }
      return {
        subtitle: `height=${JSON.stringify(height)} → ${expected}`,
        initial: { values: height, hi: {}, note: "Two pointers from ends", pointers: { L: 0, R: height.length - 1 } },
        frames,
        painter: "array",
        values: height,
      };
    }

    // --- Binary search on index ---
    if (pattern === "binary_search") {
      const nums = (args[0] || []).slice();
      const target = args[1];
      let lo = 0,
        hi = nums.length - 1;
      const frames = [];
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const highlight = { [mid]: "focus" };
        for (let i = lo; i <= hi; i++) if (i !== mid) highlight[i] = "good";
        if (nums[mid] === target) {
          highlight[mid] = "done";
          frames.push({
            description: `lo=${lo} hi=${hi} mid=${mid}: nums[mid]=${nums[mid]} == ${target} → return ${mid}`,
            state: { hi: highlight, note: `FOUND index ${mid}`, pointers: { mid, lo, hi } },
          });
          break;
        }
        if (nums[mid] < target) {
          frames.push({
            description: `lo=${lo} hi=${hi} mid=${mid}: ${nums[mid]} < ${target} → lo=mid+1`,
            state: { hi: highlight, note: `discard left half`, pointers: { mid, lo, hi } },
          });
          lo = mid + 1;
        } else {
          frames.push({
            description: `lo=${lo} hi=${hi} mid=${mid}: ${nums[mid]} > ${target} → hi=mid-1`,
            state: { hi: highlight, note: `discard right half`, pointers: { mid, lo, hi } },
          });
          hi = mid - 1;
        }
      }
      return {
        subtitle: `nums=${JSON.stringify(nums)}, target=${target} → ${expected}`,
        initial: { values: nums, hi: {}, note: "Search sorted array", pointers: {} },
        frames,
        painter: "array",
        values: nums,
      };
    }

    // --- Binary search on answer (Koko) ---
    if (pattern === "binary_search_answer") {
      const piles = (args[0] || []).slice();
      const h = args[1];
      const can = (k) => piles.reduce((s, p) => s + Math.ceil(p / k), 0) <= h;
      let lo = 1,
        hi = Math.max(...piles, 1);
      const frames = [];
      let ans = hi;
      while (lo <= hi && frames.length < 12) {
        const mid = (lo + hi) >> 1;
        const ok = can(mid);
        const hours = piles.reduce((s, p) => s + Math.ceil(p / Math.max(1, mid)), 0);
        frames.push({
          lines: [
            `Answer range lo=${lo} hi=${hi} mid(k)=${mid}`,
            `hours needed at k=${mid}: ${hours}  (limit h=${h})`,
            ok ? `can(${mid})=True → try smaller (hi=mid-1), ans=${mid}` : `can(${mid})=False → need faster (lo=mid+1)`,
            `piles=${JSON.stringify(piles)}`,
          ],
          description: ok
            ? `can(${mid})=True → ans=${mid}, search left`
            : `can(${mid})=False → search right`,
        });
        if (ok) {
          ans = mid;
          hi = mid - 1;
        } else lo = mid + 1;
      }
      frames.push({
        lines: [`Minimum k = ${ans} (expected ${expected})`, "Monotone: if k works, every faster speed also works."],
        description: `Done: min eating speed = ${ans}`,
      });
      return {
        subtitle: `piles=${JSON.stringify(piles)}, h=${h} → ${expected}`,
        initialLines: ["Binary search the answer k, not an array index.", `Feasibility: sum(ceil(pile/k)) <= h`],
        frames,
        painter: "text",
      };
    }

    // --- Sliding window ---
    if (pattern === "sliding_window") {
      const s = String(args[0] || "");
      const chars = s.split("").slice(0, 16);
      const last = {};
      let left = 0,
        best = 0;
      const frames = [];
      for (let right = 0; right < chars.length; right++) {
        const ch = chars[right];
        if (last[ch] != null && last[ch] >= left) left = last[ch] + 1;
        last[ch] = right;
        best = Math.max(best, right - left + 1);
        const hi = {};
        for (let i = left; i <= right; i++) hi[i] = "good";
        hi[right] = "focus";
        frames.push({
          description: `R=${right} '${ch}'; window=[${left},${right}] len=${right - left + 1}; best=${best}`,
          state: {
            hi,
            note: `window="${chars.slice(left, right + 1).join("")}" best=${best}`,
            pointers: { L: left, R: right },
          },
        });
        if (frames.length > 12) break;
      }
      return {
        subtitle: `s=${JSON.stringify(s)} → ${expected}`,
        initial: { values: chars, hi: {}, note: "Expand R, shrink L on duplicate", pointers: {} },
        frames,
        painter: "array",
        values: chars,
      };
    }

    // --- Prefix sum ---
    if (pattern === "prefix_sum") {
      const nums = (args[0] || []).slice();
      const queries = args[1] || [];
      const pref = [0];
      nums.forEach((x) => pref.push(pref[pref.length - 1] + x));
      const frames = [
        {
          description: "Build prefix: pref[i+1]=pref[i]+nums[i]",
          lines: [`nums=${JSON.stringify(nums)}`, `pref=${JSON.stringify(pref)}`],
        },
      ];
      (queries.slice(0, 4) || []).forEach(([l, r]) => {
        const ans = pref[r + 1] - pref[l];
        frames.push({
          description: `query [${l},${r}] = pref[${r + 1}]-pref[${l}] = ${pref[r + 1]}-${pref[l]} = ${ans}`,
          lines: [
            `pref=${JSON.stringify(pref)}`,
            `sum(${l}..${r}) = pref[${r + 1}]-pref[${l}] = ${ans}`,
          ],
        });
      });
      return {
        subtitle: `nums=${JSON.stringify(nums)}; queries → ${JSON.stringify(expected)}`,
        initialLines: ["Prefix sums turn range sums into two lookups."],
        frames,
        painter: "text",
      };
    }

    // --- Difference array ---
    if (pattern === "difference_array") {
      const n = args[0];
      const updates = args[1] || [];
      const diff = Array(n + 1).fill(0);
      const frames = [
        {
          description: "Start with diff of zeros (length n+1)",
          lines: [`n=${n}`, `diff=${JSON.stringify(diff)}`],
        },
      ];
      updates.forEach(([L, R, val]) => {
        diff[L] += val;
        if (R + 1 < diff.length) diff[R + 1] -= val;
        frames.push({
          description: `Update [${L},${R}] += ${val} → diff[${L}]+=${val}, diff[${R + 1}]-=${val}`,
          lines: [`diff=${JSON.stringify(diff)}`],
        });
      });
      const out = Array(n).fill(0);
      let run = 0;
      for (let i = 0; i < n; i++) {
        run += diff[i];
        out[i] = run;
      }
      frames.push({
        description: `Prefix-reconstruct → ${JSON.stringify(out)}`,
        lines: [`final=${JSON.stringify(out)}`, `(expected ${JSON.stringify(expected)})`],
      });
      return {
        subtitle: `n=${n}, updates=${JSON.stringify(updates)}`,
        initialLines: ["Encode range writes as two point updates, then integrate."],
        frames,
        painter: "text",
      };
    }

    // --- Sweep line ---
    if (pattern === "sweep_line") {
      const intervals = args[0] || [];
      const events = [];
      intervals.forEach(([s, e]) => {
        events.push([s, 1, "start"]);
        events.push([e, -1, "end"]);
      });
      events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      let cur = 0,
        best = 0;
      const frames = [
        {
          description: "Turn intervals into +1 start / -1 end events; sort",
          lines: [
            `intervals=${JSON.stringify(intervals)}`,
            `events=${JSON.stringify(events.map((e) => [e[0], e[1]]))}`,
          ],
        },
      ];
      events.forEach(([t, d]) => {
        cur += d;
        best = Math.max(best, cur);
        frames.push({
          description: `t=${t} delta=${d} → active=${cur}, best=${best}`,
          lines: [`active=${cur}`, `best concurrency=${best}`],
        });
      });
      return {
        subtitle: `intervals → max concurrent ${expected}`,
        initialLines: ["Sweep the timeline; running count is load."],
        frames,
        painter: "text",
      };
    }

    // --- Bit manipulation ---
    if (pattern === "bit_manipulation") {
      const nums = (args[0] || []).slice();
      let x = 0;
      const frames = [];
      nums.forEach((n, i) => {
        const prev = x;
        x ^= n;
        frames.push({
          description: `i=${i}: x = ${prev} XOR ${n} = ${x}`,
          state: {
            hi: { [i]: "focus" },
            note: `running XOR = ${x}`,
            pointers: { i },
          },
        });
      });
      frames.push({
        description: `Pairs cancel; unique = ${x}`,
        state: { hi: {}, note: `answer=${x}`, pointers: {} },
      });
      return {
        subtitle: `nums=${JSON.stringify(nums)} → ${expected}`,
        initial: { values: nums, hi: {}, note: "x=0; XOR each element", pointers: {} },
        frames,
        painter: "array",
        values: nums,
      };
    }

    // --- Linked list ---
    if (pattern === "linked_list") {
      if (fn === "has_cycle") {
        const next = (args[0] || []).slice();
        let slow = 0,
          fast = 0;
        const frames = [
          {
            description: "Floyd: slow=1 step, fast=2 steps from 0",
            lines: [`next=${JSON.stringify(next)}`, `slow=0 fast=0`],
          },
        ];
        for (let step = 0; step < 12; step++) {
          if (fast === -1 || next[fast] === -1) {
            frames.push({
              description: "Fast hit null → no cycle",
              lines: [`slow=${slow} fast=${fast}`, "return False"],
            });
            break;
          }
          slow = next[slow];
          fast = next[next[fast]];
          frames.push({
            description: `step ${step + 1}: slow→${slow}, fast→${fast}${slow === fast ? " — MEET → cycle" : ""}`,
            lines: [`next=${JSON.stringify(next)}`, `slow=${slow} fast=${fast}`],
          });
          if (slow === fast) break;
        }
        return {
          subtitle: `next_idx=${JSON.stringify(next)} → ${expected}`,
          initialLines: ["Tortoise & hare on index links."],
          frames,
          painter: "text",
        };
      }
      const vals = (args[0] || []).slice();
      const arrayFrames = [
        {
          description: "Start: head → … → tail (prev=None)",
          state: { hi: { 0: "focus" }, note: "prev=None, cur=head", pointers: { cur: 0 } },
          values: vals.slice(),
        },
      ];
      let done = [];
      let rest = vals.slice();
      while (rest.length) {
        done.unshift(rest.shift());
        arrayFrames.push({
          description: `Rewire one node: head sequence ${JSON.stringify(done)}; rest ${JSON.stringify(rest)}`,
          state: {
            hi: Object.fromEntries(done.map((_, i) => [i, "done"])),
            note: `reversed so far → ${JSON.stringify(done)}`,
            pointers: { head: 0 },
          },
          values: done.concat(rest),
        });
      }
      return {
        subtitle: `${JSON.stringify(vals)} → ${JSON.stringify(expected)}`,
        initial: { values: vals, hi: {}, note: "prev / cur / nxt", pointers: {} },
        frames: arrayFrames,
        painter: "array",
        values: vals,
      };
    }

    // --- Kadane / DP climb ---
    if (pattern === "dp") {
      if (fn === "climb_stairs" || typeof args[0] === "number") {
        const n = args[0];
        const dp = [0, 1, 2];
        const frames = [
          { description: "Base: dp[1]=1, dp[2]=2", lines: ["dp[1]=1", "dp[2]=2"] },
        ];
        for (let i = 3; i <= n; i++) {
          dp[i] = dp[i - 1] + dp[i - 2];
          frames.push({
            description: `dp[${i}] = dp[${i - 1}]+dp[${i - 2}] = ${dp[i - 1]}+${dp[i - 2]} = ${dp[i]}`,
            lines: [`n=${n}`, `dp=${JSON.stringify(dp.slice(1, i + 1))}`],
          });
        }
        return {
          subtitle: `n=${n} → ${expected}`,
          initialLines: ["Last step was 1 or 2 — Fibonacci DP."],
          frames,
          painter: "text",
        };
      }
      const nums = (args[0] || []).slice();
      let best = nums[0],
        cur = nums[0];
      const frames = [
        {
          description: `Init cur=best=${nums[0]}`,
          state: { hi: { 0: "focus" }, note: `cur=${cur} best=${best}`, pointers: { i: 0 } },
        },
      ];
      for (let i = 1; i < nums.length; i++) {
        cur = Math.max(nums[i], cur + nums[i]);
        best = Math.max(best, cur);
        frames.push({
          description: `i=${i}: cur=max(${nums[i]}, prev+${nums[i]})=${cur}; best=${best}`,
          state: { hi: { [i]: "focus" }, note: `cur=${cur} best=${best}`, pointers: { i } },
        });
      }
      return {
        subtitle: `nums=${JSON.stringify(nums)} → ${expected}`,
        initial: { values: nums, hi: {}, note: "Kadane: extend or restart", pointers: {} },
        frames,
        painter: "array",
        values: nums,
      };
    }

    // --- Monotonic stack ---
    if (pattern === "monotonic_stack") {
      if (fn === "is_valid" || typeof args[0] === "string") {
        const s = String(args[0] || "");
        const stack = [];
        const pairs = { ")": "(", "]": "[", "}": "{" };
        const frames = [];
        let ok = true;
        for (let i = 0; i < s.length; i++) {
          const ch = s[i];
          if ("([{".includes(ch)) {
            stack.push(ch);
            frames.push({
              description: `i=${i} push '${ch}'`,
              lines: [`s=${JSON.stringify(s)}`, `stack=${JSON.stringify(stack)}`],
            });
          } else {
            const top = stack.pop();
            if (top !== pairs[ch]) {
              ok = false;
              frames.push({
                description: `i=${i} '${ch}' mismatch (top=${top}) → False`,
                lines: [`stack=${JSON.stringify(stack)}`, "INVALID"],
              });
              break;
            }
            frames.push({
              description: `i=${i} '${ch}' matches → pop`,
              lines: [`stack=${JSON.stringify(stack)}`],
            });
          }
        }
        if (ok) {
          frames.push({
            description: stack.length ? "Leftover opens → False" : "Empty stack → True",
            lines: [`stack=${JSON.stringify(stack)}`, `result=${expected}`],
          });
        }
        return {
          subtitle: `s=${JSON.stringify(s)} → ${expected}`,
          initialLines: ["Stack matches nesting (LIFO)."],
          frames,
          painter: "text",
        };
      }
      const nums = (args[0] || []).slice();
      const ans = Array(nums.length).fill(-1);
      const stack = [];
      const frames = [];
      for (let i = 0; i < nums.length; i++) {
        while (stack.length && nums[stack[stack.length - 1]] < nums[i]) {
          const j = stack.pop();
          ans[j] = nums[i];
          frames.push({
            description: `nums[${i}]=${nums[i]} > nums[${j}]=${nums[j]} → next greater for ${j} is ${nums[i]}`,
            state: {
              hi: { [j]: "done", [i]: "focus" },
              note: `ans=${JSON.stringify(ans)} stack=${JSON.stringify(stack)}`,
              pointers: { i },
            },
          });
        }
        stack.push(i);
        frames.push({
          description: `Push index ${i} (val ${nums[i]}) onto decreasing stack`,
          state: {
            hi: { [i]: "focus" },
            note: `stack=${JSON.stringify(stack)} ans=${JSON.stringify(ans)}`,
            pointers: { i },
          },
        });
        if (frames.length > 14) break;
      }
      return {
        subtitle: `nums=${JSON.stringify(nums)} → ${JSON.stringify(expected)}`,
        initial: { values: nums, hi: {}, note: "Monotonic decreasing stack of indices", pointers: {} },
        frames,
        painter: "array",
        values: nums,
      };
    }

    // --- Heap ---
    if (pattern === "heap") {
      const nums = (args[0] || []).slice();
      const k = args[1];
      const sorted = nums.slice().sort((a, b) => b - a);
      const frames = [
        {
          description: `Want ${k}-th largest in ${JSON.stringify(nums)}`,
          lines: [`Keep a min-heap of size k (or sort descending).`, `sorted desc=${JSON.stringify(sorted)}`],
        },
        {
          description: `Answer = sorted[${k - 1}] = ${sorted[k - 1]}`,
          lines: [`k=${k}`, `result=${sorted[k - 1]} (expected ${expected})`],
        },
      ];
      return {
        subtitle: `nums=${JSON.stringify(nums)}, k=${k} → ${expected}`,
        initialLines: ["Priority queue: repeated extract / bounded heap of size k."],
        frames,
        painter: "text",
      };
    }

    // --- BFS / DFS / topo / UF / Dijkstra / trie / backtracking / greedy ---
    if (pattern === "bfs" || pattern === "dfs") {
      const n = args[0];
      const edges = args[1] || [];
      const g = Array.from({ length: n }, () => []);
      edges.forEach(([a, b]) => {
        g[a].push(b);
        g[b].push(a);
      });
      g.forEach((lst) => lst.sort((a, b) => a - b));
      if (pattern === "bfs") {
        const q = [0];
        const seen = new Set([0]);
        const order = [];
        const frames = [
          {
            description: "Start BFS at 0: queue=[0], seen={0}",
            lines: [`edges=${JSON.stringify(edges)}`, "queue=[0]"],
          },
        ];
        while (q.length) {
          const u = q.shift();
          order.push(u);
          const neigh = (g[u] || []).filter((v) => !seen.has(v));
          neigh.forEach((v) => {
            seen.add(v);
            q.push(v);
          });
          frames.push({
            description: `Pop ${u}; enqueue unseen neighbors ${JSON.stringify(neigh)}`,
            lines: [`order=${JSON.stringify(order)}`, `queue=${JSON.stringify(q)}`, `seen={${[...seen].join(",")}}`],
          });
        }
        return {
          subtitle: `BFS order → ${JSON.stringify(expected)}`,
          initialLines: ["Queue + seen = distance rings."],
          frames,
          painter: "text",
        };
      }
      const order = [];
      const seen = new Set();
      const frames = [];
      function dfs(u) {
        seen.add(u);
        order.push(u);
        frames.push({
          description: `Visit ${u}`,
          lines: [`order=${JSON.stringify(order)}`, `seen={${[...seen].join(",")}}`],
        });
        for (const v of g[u] || []) if (!seen.has(v)) dfs(v);
      }
      dfs(0);
      return {
        subtitle: `DFS from 0 → ${JSON.stringify(order)}`,
        initialLines: ["Stack/recursion explores depth-first."],
        frames,
        painter: "text",
      };
    }

    if (pattern === "topological_sort") {
      const n = args[0];
      const edges = args[1] || [];
      const indeg = Array(n).fill(0);
      const g = Array.from({ length: n }, () => []);
      edges.forEach(([a, b]) => {
        g[a].push(b);
        indeg[b]++;
      });
      const q = [];
      indeg.forEach((d, i) => {
        if (d === 0) q.push(i);
      });
      const order = [];
      const frames = [
        {
          description: "Kahn: queue all indegree-0 nodes",
          lines: [`indeg=${JSON.stringify(indeg)}`, `queue=${JSON.stringify(q)}`],
        },
      ];
      while (q.length) {
        const u = q.shift();
        order.push(u);
        for (const v of g[u]) {
          indeg[v]--;
          if (indeg[v] === 0) q.push(v);
        }
        frames.push({
          description: `Take ${u}; reduce neighbors' indegree`,
          lines: [`order=${JSON.stringify(order)}`, `indeg=${JSON.stringify(indeg)}`, `queue=${JSON.stringify(q)}`],
        });
      }
      return {
        subtitle: `n=${n}, edges=${JSON.stringify(edges)}`,
        initialLines: ["Edges a→b mean a before b."],
        frames,
        painter: "text",
      };
    }

    if (pattern === "union_find") {
      const n = args[0];
      const edges = args[1] || [];
      const parent = Array.from({ length: n }, (_, i) => i);
      const find = (x) => {
        while (parent[x] !== x) {
          parent[x] = parent[parent[x]];
          x = parent[x];
        }
        return x;
      };
      let comps = n;
      const frames = [
        {
          description: `Start: ${n} components, parent=${JSON.stringify(parent)}`,
          lines: [`comps=${comps}`],
        },
      ];
      edges.forEach(([a, b]) => {
        const ra = find(a),
          rb = find(b);
        if (ra !== rb) {
          parent[rb] = ra;
          comps--;
          frames.push({
            description: `Union ${a}-${b} (roots ${ra},${rb}) → comps=${comps}`,
            lines: [`parent=${JSON.stringify(parent.slice())}`, `comps=${comps}`],
          });
        } else {
          frames.push({
            description: `${a}-${b} already connected — skip`,
            lines: [`comps=${comps}`],
          });
        }
      });
      return {
        subtitle: `n=${n} → components ${expected}`,
        initialLines: ["DSU: merge sets; count roots."],
        frames,
        painter: "text",
      };
    }

    if (pattern === "dijkstra") {
      const n = args[0];
      const edges = args[1] || [];
      const src = args[2] ?? 0;
      const g = Array.from({ length: n }, () => []);
      edges.forEach(([u, v, w]) => g[u].push([v, w]));
      const dist = Array(n).fill(Infinity);
      dist[src] = 0;
      const frames = [
        {
          description: `Init dist[${src}]=0, others ∞`,
          lines: [`dist=${dist.map((d) => (d === Infinity ? "∞" : d)).join(", ")}`],
        },
      ];
      const used = Array(n).fill(false);
      for (let iter = 0; iter < n; iter++) {
        let u = -1;
        for (let i = 0; i < n; i++)
          if (!used[i] && (u < 0 || dist[i] < dist[u])) u = i;
        if (u < 0 || dist[u] === Infinity) break;
        used[u] = true;
        for (const [v, w] of g[u]) {
          if (dist[v] > dist[u] + w) {
            dist[v] = dist[u] + w;
            frames.push({
              description: `Relax ${u}→${v} (w=${w}): dist[${v}]=${dist[v]}`,
              lines: [`dist=${dist.map((d) => (d === Infinity ? "∞" : d)).join(", ")}`],
            });
          }
        }
        frames.push({
          description: `Settle node ${u}`,
          lines: [`dist=${dist.map((d) => (d === Infinity ? "∞" : d)).join(", ")}`],
        });
      }
      return {
        subtitle: `src=${src} → ${JSON.stringify(expected)}`,
        initialLines: ["Expand cheapest unsettled node (non-negative weights)."],
        frames,
        painter: "text",
      };
    }

    if (pattern === "trie") {
      const words = args[0] || [];
      const prefix = args[1] || "";
      const frames = [
        {
          description: "Insert each word; increment count on every node along the path",
          lines: [`words=${JSON.stringify(words)}`, `prefix=${JSON.stringify(prefix)}`],
        },
        {
          description: `Walk prefix "${prefix}"; subtree count = ${expected}`,
          lines: [`answer=${expected}`, "Shared prefixes = shared nodes."],
        },
      ];
      return {
        subtitle: `prefix count → ${expected}`,
        initialLines: ["Trie: character edges; counts on path."],
        frames,
        painter: "text",
      };
    }

    if (pattern === "backtracking") {
      const nums = (args[0] || []).slice();
      const frames = [
        {
          description: "Decision tree: include or skip each element",
          lines: [`nums=${JSON.stringify(nums)}`, "Start path=[]"],
        },
        {
          description: "DFS: append path copy at every node; choose → recurse → unchoose",
          lines: [`Power set size = 2^${nums.length} = ${1 << nums.length}`, `expected has ${Array.isArray(expected) ? expected.length : "?"} subsets`],
        },
      ];
      return {
        subtitle: `subsets of ${JSON.stringify(nums)}`,
        initialLines: ["Choose / explore / unchoose."],
        frames,
        painter: "text",
      };
    }

    if (pattern === "greedy") {
      const intervals = (args[0] || []).slice().map((iv) => iv.slice());
      intervals.sort((a, b) => a[0] - b[0]);
      const merged = [];
      const frames = [
        {
          description: "Sort intervals by start",
          lines: [`sorted=${JSON.stringify(intervals)}`],
        },
      ];
      for (const iv of intervals) {
        if (!merged.length || merged[merged.length - 1][1] < iv[0]) {
          merged.push(iv.slice());
          frames.push({
            description: `${JSON.stringify(iv)} no overlap → push new`,
            lines: [`merged=${JSON.stringify(merged)}`],
          });
        } else {
          merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], iv[1]);
          frames.push({
            description: `${JSON.stringify(iv)} overlaps → extend last end`,
            lines: [`merged=${JSON.stringify(merged)}`],
          });
        }
      }
      return {
        subtitle: `merge → ${JSON.stringify(expected)}`,
        initialLines: ["Greedy: sort key + local safe choice."],
        frames,
        painter: "text",
      };
    }

    // Fallback: narrate sample I/O + mental model
    return {
      subtitle: `${problem.functionName}(${args.map((a) => JSON.stringify(a)).join(", ")}) → ${JSON.stringify(expected)}`,
      initialLines: [
        `Pattern: ${pattern}`,
        problem.mentalModel || "Follow the template for this pattern.",
      ],
      frames: [
        {
          description: "Sample input → expected output",
          lines: [
            `args: ${JSON.stringify(args)}`,
            `expected: ${JSON.stringify(expected)}`,
            problem.mentalModel || "",
          ],
        },
        {
          description: "Reconstruct the algorithm from the mental model, then code it",
          lines: (problem.hints || []).slice(0, 3),
        },
      ],
      painter: "text",
    };
  }

  function renderWorkedExample(host, problem) {
    if (!host) return;
    const movie = buildWorkedMovie(problem);
    const title = movieTitle(problem);
    host.innerHTML = `
      <h2 id="arena-worked-heading">${escapeHtml(title)}</h2>
      <p class="text-muted" style="margin-top:-0.5rem">
        Step through the same sample as test #1 above — burn the algorithm into memory before/while coding.
      </p>
      <div class="diagram-container" id="anim-arena-worked">
        <div class="diagram-title" id="arena-worked-sub">${escapeHtml(movie.subtitle || "")}</div>
        <svg id="svg-arena-worked" width="100%" height="150" viewBox="0 0 560 150"></svg>
        <div class="anim-description">Press Play or Next.</div>
        <div class="anim-controls"></div>
      </div>
    `;
    const svg = host.querySelector("#svg-arena-worked");
    const frames = movie.frames || [];
    const steps = [];

    if (movie.painter === "array") {
      const baseVals = movie.values || [];
      const paint = (state, values) => {
        paintArrayFrame(svg, values || baseVals, state || {});
      };
      paint(movie.initial, baseVals);
      frames.forEach((f) => {
        steps.push({
          description: f.description,
          apply: () => paint(f.state, f.values || baseVals),
        });
      });
      if (typeof AlgoAnimation === "function") {
        new AlgoAnimation("anim-arena-worked", steps, {
          onReset: () => paint(movie.initial, baseVals),
        });
      }
    } else {
      paintTextBoard(svg, movie.initialLines || ["Press Next."]);
      frames.forEach((f) => {
        steps.push({
          description: f.description,
          apply: () => paintTextBoard(svg, f.lines || [f.description]),
        });
      });
      if (typeof AlgoAnimation === "function") {
        new AlgoAnimation("anim-arena-worked", steps, {
          onReset: () => paintTextBoard(svg, movie.initialLines || ["Press Next."]),
        });
      }
    }
  }

  function mountCodingArena(root) {
    if (!root) return;
    const Coach = window.ArenaCoach || null;
    const Session = window.ArenaSession || null;

    let seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
    let patternFilter = root.dataset.pattern || "";
    let problem = generateCodingProblem(seed, patternFilter || null);
    let hintIdx = 0;
    let codingUnlocked = false;
    let skeletonMode = true;
    let skeletonIdx = 0;
    let deliberateOn = true;
    let soundOn = false;
    let interviewOn = false;
    let interviewStarted = 0;
    let interviewTimer = null;
    let lastReport = null;
    let coachedMode = !!Session;
    const skelLines = () =>
      Coach ? Coach.skeletonLines(problem) : (problem.modelAnswer || "").split("\n").filter((l) => l.trim());

    root.innerHTML = `
      <div class="arena arena-with-coach">
        <div class="arena-main">
          <div class="arena-toolbar">
            <div class="arena-status" id="arena-status">Initializing...</div>
            <div class="arena-toolbar-actions">
              <label class="arena-pattern-label">Pattern
                <select id="arena-pattern">
                  <option value="">random (all 21)</option>
                  ${ALL_PATTERNS.map(
                    (p) => `<option value="${p.id}">${p.name}</option>`
                  ).join("")}
                </select>
              </label>
              <label class="arena-toggle" title="Coached session: plan gate, gap diagnosis, escalating coaching until you hit the bar">
                <input type="checkbox" id="arena-coached" ${Session ? "checked" : "disabled"} /> Coached
              </label>
              <label class="arena-toggle" title="Stay on a pattern until ${Coach ? Coach.STREAK_GOAL : 3} correct in a row">
                <input type="checkbox" id="arena-deliberate" checked /> Deliberate
              </label>
              <label class="arena-toggle" title="Ghost skeleton + Tab reveals next model line">
                <input type="checkbox" id="arena-skeleton" checked /> Skeleton
              </label>
              <label class="arena-toggle" title="Soft pass/fail blip (no files)">
                <input type="checkbox" id="arena-sound" /> Sound
              </label>
              <label class="arena-toggle" title="Timed session + post-mortem checklist">
                <input type="checkbox" id="arena-interview" /> Interview
              </label>
              <span class="arena-streak" id="arena-streak">streak 0/${Coach ? Coach.STREAK_GOAL : 3}</span>
              <span class="arena-timer" id="arena-timer" hidden>25:00</span>
              <button class="anim-btn" id="arena-new" type="button">New problem</button>
              <button class="anim-btn" id="arena-reset" type="button">Reset code</button>
              <button class="anim-btn" id="arena-hint" type="button">Hint</button>
              <button class="anim-btn" id="arena-reveal" type="button">Reveal model answer</button>
              <button class="anim-btn primary" id="arena-run" type="button">Run tests</button>
            </div>
          </div>

          <section class="arena-modes-help" aria-label="Practice mode checkboxes">
            <div class="callout callout-info" style="margin:0;border-radius:0;border-left:none;border-right:none">
              <div class="callout-title">Toolbar checkboxes — what they do</div>
              <ul class="arena-modes-list">
                <li>
                  <strong>Coached</strong> —
                  Runs a guided session: commit a plan and complexity before the
                  editor unlocks, then get diagnosis → hint → micro-lesson →
                  guided repair as attempts stack up. Uncheck for free play.
                </li>
                <li>
                  <strong>Deliberate</strong> —
                  Stay on one pattern until you get 3 correct in a row. Misses
                  reset the streak. Use <em>Focus next</em> in the coach for weak patterns.
                </li>
                <li>
                  <strong>Skeleton</strong> —
                  Ghost of the model answer behind the solution editor. Press
                  <kbd>Tab</kbd> to insert the next model line (then type from memory).
                </li>
                <li>
                  <strong>Sound</strong> —
                  Soft pass/fail blip via the browser audio API (no audio files). Off by default.
                </li>
                <li>
                  <strong>Interview</strong> —
                  Starts a 25:00 timer and shows a post-mortem checklist after you Run tests.
                </li>
              </ul>
            </div>
          </section>

          <section class="sess-panel" id="arena-session"></section>
          <section class="sess-report-slot" id="arena-session-report" hidden></section>
          <section class="sess-gate" id="arena-plan" hidden></section>

          <section class="arena-micro" id="arena-micro"></section>

          <div class="arena-model-answer" id="arena-model-answer" hidden>
            <div class="arena-model-answer-head">
              <strong>Model answer</strong>
              <span class="text-muted">Study it, then hide and re-solve from memory.</span>
              <button type="button" class="anim-btn" id="arena-hide-answer">Hide</button>
              <button type="button" class="anim-btn" id="arena-use-answer">Load into editor</button>
            </div>
            <pre class="arena-model-answer-code" id="arena-model-answer-code"></pre>
          </div>

          <section class="arena-repl-card" id="arena-repl-card">
            <div class="arena-repl-head">
              <div>
                <div class="arena-editor-label" style="border:none;padding:0">Python REPL</div>
                <p class="arena-repl-blurb">Scratchpad — prototype here, then copy into the solution.</p>
              </div>
              <div class="arena-repl-actions">
                <button type="button" class="anim-btn" id="repl-run">Run</button>
                <button type="button" class="anim-btn" id="repl-clear">Clear output</button>
                <button type="button" class="anim-btn" id="repl-reset-ns">Reset REPL</button>
                <button type="button" class="anim-btn primary" id="repl-copy">Copy to solution</button>
              </div>
            </div>
            <div class="arena-repl-split">
              <div class="arena-repl-pane arena-repl-pane-editor">
                <div class="arena-repl-pane-label">Editor</div>
                <div class="code-with-lines">
                  <pre class="code-gutter" id="repl-gutter" aria-hidden="true">1</pre>
                  <textarea id="repl-input" class="arena-repl-input" spellcheck="false" autocomplete="off" wrap="soft" placeholder="# try ideas here"></textarea>
                </div>
              </div>
              <div class="arena-repl-pane arena-repl-pane-term">
                <div class="arena-repl-pane-label">Terminal</div>
                <pre class="arena-repl-out" id="repl-out">Waiting for Python runtime...</pre>
              </div>
            </div>
            <div class="arena-kbd">Ctrl/Cmd+Enter to run · Up/Down history</div>
          </section>

          <aside class="arena-coach" id="arena-coach" aria-label="Text coach">
            <div class="arena-coach-head">
              <strong>Coach</strong>
              <button type="button" class="anim-btn" id="coach-clear" title="Clear log">Clear</button>
            </div>
            <div class="arena-coach-body">
              <div class="arena-coach-opener" id="coach-opener"></div>
              <div class="arena-coach-action" id="coach-action">Answer the micro-drill to unlock coding.</div>
              <div class="arena-coach-log" id="coach-log"></div>
              <div class="arena-coach-weak" id="coach-weak"></div>
            </div>
          </aside>

          <div class="arena-coding" id="arena-coding" hidden>
            <div class="arena-grid">
              <section class="arena-problem">
                <div class="quiz-meta" id="arena-meta"></div>
                <h2 id="arena-title"></h2>
                <div class="arena-desc" id="arena-desc"></div>
                <div class="callout callout-ee">
                  <div class="callout-title">Mental model</div>
                  <p id="arena-model"></p>
                </div>
                <h4>Sample tests</h4>
                <pre class="arena-samples" id="arena-samples"></pre>
                <div id="arena-hints" class="arena-hints"></div>
              </section>
              <section class="arena-editor-wrap">
                <div class="arena-editor-label">Python solution <span class="text-muted" id="arena-skel-hint">(Skeleton on — Tab inserts next model line)</span></div>
                <div class="code-with-lines code-with-lines-fill arena-ghost-wrap">
                  <pre class="code-gutter" id="arena-gutter" aria-hidden="true">1</pre>
                  <pre class="arena-ghost" id="arena-ghost" aria-hidden="true"></pre>
                  <textarea id="arena-editor" class="arena-editor" spellcheck="false" autocomplete="off" wrap="soft"></textarea>
                </div>
                <div class="arena-kbd">Ctrl/Cmd+Enter run · Tab = next skeleton line (when Skeleton on)</div>
              </section>
            </div>
            <section class="arena-worked" id="arena-worked"></section>
            <section class="arena-compare" id="arena-compare" hidden></section>
            <section class="arena-results" id="arena-results" hidden></section>
            <section class="sess-teach-slot" id="arena-teach" hidden></section>
            <div class="tutor-slot" id="arena-tutor"></div>
            <section class="arena-checklist" id="arena-checklist" hidden></section>
          </div>
        </div>
      </div>
    `;

    const statusEl = root.querySelector("#arena-status");
    const editor = root.querySelector("#arena-editor");
    const replOut = root.querySelector("#repl-out");
    const replInput = root.querySelector("#repl-input");
    const patternSel = root.querySelector("#arena-pattern");
    if (patternFilter) patternSel.value = patternFilter;
    wireLineNumbers(replInput, root.querySelector("#repl-gutter"));
    wireLineNumbers(editor, root.querySelector("#arena-gutter"));

    const replHistory = [];
    let replHistIdx = -1;
    let replDraft = "";

    function appendRepl(text, cls) {
      const line = document.createElement("div");
      if (cls) line.className = cls;
      line.textContent = text;
      // replace placeholder on first real output
      if (replOut.dataset.ready !== "1") {
        replOut.textContent = "";
        replOut.dataset.ready = "1";
      }
      replOut.appendChild(line);
      replOut.scrollTop = replOut.scrollHeight;
    }

    async function onReplRun() {
      const src = replInput.value;
      if (!src.trim()) return;
      const runBtn = root.querySelector("#repl-run");
      runBtn.disabled = true;
      try {
        await ensurePyodide(statusEl);
        if (replOut.dataset.ready !== "1") {
          replOut.textContent = "";
          replOut.dataset.ready = "1";
        }
        appendRepl(">>> " + src.replace(/\n/g, "\n... "), "repl-in");
        replHistory.push(src);
        replHistIdx = replHistory.length;
        const report = await runRepl(src);
        if (report.stdout) appendRepl(report.stdout.replace(/\n$/, ""), "repl-stdout");
        if (report.stderr) appendRepl(report.stderr.replace(/\n$/, ""), "repl-stderr");
        if (report.error) appendRepl(report.error.replace(/\n$/, ""), "repl-err");
        else if (report.result != null) appendRepl(report.result, "repl-result");
      } catch (err) {
        appendRepl(String(err.message || err), "repl-err");
      } finally {
        runBtn.disabled = false;
      }
    }

    root.querySelector("#repl-run").onclick = onReplRun;
    root.querySelector("#repl-clear").onclick = () => {
      replOut.textContent = "";
      replOut.dataset.ready = "1";
    };
    root.querySelector("#repl-reset-ns").onclick = async () => {
      try {
        const py = await ensurePyodide(statusEl);
        if (!replBooted) {
          await py.runPythonAsync(REPL_BOOT_PY);
          replBooted = true;
        }
        await py.runPythonAsync("_arena_repl_ns = {'__name__': '__repl__'}");
        appendRepl("# REPL namespace cleared", "repl-meta");
      } catch (err) {
        appendRepl(String(err.message || err), "repl-err");
      }
    };
    root.querySelector("#repl-copy").onclick = () => {
      const src = replInput.value.trim();
      if (!src) return;
      const sep = editor.value && !editor.value.endsWith("\n") ? "\n\n" : "\n";
      editor.value = (editor.value || "") + (editor.value.trim() ? sep : "") + src + "\n";
      editor.dispatchEvent(new Event("input"));
      editor.focus();
      appendRepl("# Copied REPL buffer into Python solution editor", "repl-meta");
    };

    replInput.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onReplRun();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const start = replInput.selectionStart;
        const end = replInput.selectionEnd;
        replInput.value =
          replInput.value.slice(0, start) + "    " + replInput.value.slice(end);
        replInput.selectionStart = replInput.selectionEnd = start + 4;
        return;
      }
      if (e.key === "ArrowUp" && !e.shiftKey) {
        const atStart =
          replInput.selectionStart === 0 && replInput.selectionEnd === 0;
        const singleLine = !replInput.value.includes("\n");
        if (atStart || singleLine) {
          if (replHistIdx === replHistory.length) replDraft = replInput.value;
          if (replHistIdx > 0) {
            e.preventDefault();
            replHistIdx--;
            replInput.value = replHistory[replHistIdx];
          }
        }
      } else if (e.key === "ArrowDown" && !e.shiftKey) {
        const atEnd =
          replInput.selectionStart === replInput.value.length &&
          replInput.selectionEnd === replInput.value.length;
        const singleLine = !replInput.value.includes("\n");
        if (atEnd || singleLine) {
          if (replHistIdx < replHistory.length - 1) {
            e.preventDefault();
            replHistIdx++;
            replInput.value = replHistory[replHistIdx];
          } else if (replHistIdx === replHistory.length - 1) {
            e.preventDefault();
            replHistIdx = replHistory.length;
            replInput.value = replDraft;
          }
        }
      }
    });

    function coachSay(lines, action) {
      const log = root.querySelector("#coach-log");
      const actionEl = root.querySelector("#coach-action");
      if (action) actionEl.textContent = action;
      (lines || []).forEach((line) => {
        const div = document.createElement("div");
        div.className = "arena-coach-msg";
        div.textContent = line;
        log.appendChild(div);
      });
      log.scrollTop = log.scrollHeight;
    }

    function refreshStreakUI() {
      const goal = Coach ? Coach.STREAK_GOAL : 3;
      const d = Coach ? Coach.loadDeliberate() : { streaks: {} };
      const s = d.streaks[problem.pattern] || 0;
      root.querySelector("#arena-streak").textContent = `streak ${s}/${goal}`;
      const weakEl = root.querySelector("#coach-weak");
      if (!Coach) {
        weakEl.innerHTML = "";
        return;
      }
      const weak = Coach.weakPatterns(4);
      if (!weak.length) {
        weakEl.innerHTML = `<div class="text-muted">No weak patterns yet — keep drilling.</div>`;
        return;
      }
      weakEl.innerHTML =
        `<div class="arena-coach-weak-title">Focus next</div>` +
        weak
          .map(
            (w) =>
              `<button type="button" class="arena-weak-btn" data-pat="${escapeHtml(
                w.id
              )}">${escapeHtml(w.id)} · fail ${w.f}/${w.f + w.s}</button>`
          )
          .join("");
      weakEl.querySelectorAll("[data-pat]").forEach((btn) => {
        btn.onclick = () => {
          patternSel.value = btn.dataset.pat;
          nextProblem();
        };
      });
    }

    function updateGhost() {
      const ghost = root.querySelector("#arena-ghost");
      const hint = root.querySelector("#arena-skel-hint");
      if (!ghost) return;
      if (!skeletonMode || !codingUnlocked) {
        ghost.textContent = "";
        if (hint) hint.textContent = skeletonMode ? "(Skeleton on — unlock coding first)" : "(Skeleton off)";
        return;
      }
      const lines = skelLines();
      ghost.textContent = lines.slice(skeletonIdx).join("\n");
      if (hint) {
        hint.textContent =
          skeletonIdx >= lines.length
            ? "(Skeleton complete — Tab indents)"
            : `(Skeleton on — Tab inserts line ${skeletonIdx + 1}/${lines.length})`;
      }
    }

    function renderMicroDrill() {
      codingUnlocked = false;
      root.querySelector("#arena-coding").hidden = true;
      root.querySelector("#arena-micro").hidden = false;
      const drill = Coach
        ? Coach.buildMicroDrill(problem)
        : {
            question: "Ready to code this pattern?",
            choices: [{ t: "Yes — unlock editor", ok: true }],
            tip: problem.mentalModel,
            sampleLine: "",
            opener: problem.mentalModel,
          };
      root.querySelector("#coach-opener").textContent =
        drill.opener || problem.mentalModel || "";
      root.querySelector("#coach-action").textContent =
        "Answer the micro-drill to unlock the editor.";
      root.querySelector("#coach-log").innerHTML = "";
      coachSay(
        [
          `Pattern: ${problem.pattern} — ${problem.title}`,
          drill.sampleLine ? `Sample: ${drill.sampleLine}` : "Read the question, pick the correct move.",
        ],
        "Pick the best answer below."
      );

      const micro = root.querySelector("#arena-micro");
      micro.innerHTML = `
        <div class="arena-micro-card">
          <div class="arena-micro-badge">Micro-drill · 20–40s</div>
          <h3>${escapeHtml(problem.title)}</h3>
          <p class="text-muted">${escapeHtml(problem.difficulty)} · ${escapeHtml(
            problem.pattern
          )}</p>
          <p class="arena-micro-q">${escapeHtml(drill.question)}</p>
          <div class="arena-micro-choices">
            ${drill.choices
              .map(
                (c, i) =>
                  `<button type="button" class="arena-micro-choice" data-ok="${
                    c.ok ? "1" : "0"
                  }" data-i="${i}">${escapeHtml(c.t)}</button>`
              )
              .join("")}
          </div>
          <p class="text-muted arena-micro-tip" id="arena-micro-tip" hidden></p>
        </div>`;
      const tipEl = micro.querySelector("#arena-micro-tip");
      micro.querySelectorAll(".arena-micro-choice").forEach((btn) => {
        btn.onclick = () => {
          const ok = btn.dataset.ok === "1";
          tipEl.hidden = false;
          tipEl.textContent = "Tip: " + drill.tip;
          micro.querySelectorAll(".arena-micro-choice").forEach((b) => {
            b.disabled = true;
            if (b.dataset.ok === "1") b.classList.add("ok");
            else if (b === btn && !ok) b.classList.add("bad");
          });
          if (ok) {
            if (Coach) Coach.playCue("pass", soundOn);
            coachSay(
              ["Micro-drill correct.", drill.tip, "Editor unlocked. Code the sample, then Run tests."],
              "Implement the function. Use Skeleton Tab if stuck on syntax."
            );
            gateToCoding();
          } else {
            if (Coach) Coach.playCue("fail", soundOn);
            coachSay(
              [
                "Not quite — that is not the primary move for this pattern.",
                drill.tip,
                "Click the highlighted correct choice to unlock coding.",
              ],
              "Study the correct choice, click it, then code."
            );
            micro.querySelectorAll(".arena-micro-choice").forEach((b) => {
              if (b.dataset.ok === "1") {
                b.disabled = false;
                b.onclick = () => {
                  coachSay(["Good — proceed to code."], "Code now.");
                  gateToCoding();
                };
              }
            });
          }
        };
      });
      refreshStreakUI();
    }

    /** Coached mode inserts the Socratic plan gate between drill and editor. */
    function gateToCoding() {
      if (coachedMode && Session && Session.isActive()) {
        root.querySelector("#arena-micro").hidden = true;
        Session.renderPlanGate(
          root.querySelector("#arena-plan"),
          problem,
          unlockCoding
        );
        return;
      }
      unlockCoding();
    }

    function unlockCoding() {
      codingUnlocked = true;
      root.querySelector("#arena-plan").hidden = true;
      root.querySelector("#arena-micro").hidden = true;
      root.querySelector("#arena-coding").hidden = false;
      fillCodingPane();
      updateGhost();
      editor.focus();
    }

    function fillCodingPane() {
      hintIdx = 0;
      skeletonIdx = 0;
      lastReport = null;
      root.querySelector("#arena-meta").textContent =
        `${problem.difficulty} · ${problem.pattern} · seed ${seed} · ${problem.id}`;
      root.querySelector("#arena-title").textContent = problem.title;
      const descEl = root.querySelector("#arena-desc");
      if (Coach) {
        descEl.innerHTML = Coach.highlightSignals(
          problem.description,
          problem.pattern
        );
      } else {
        descEl.textContent = problem.description;
      }
      root.querySelector("#arena-model").textContent = problem.mentalModel;
      root.querySelector("#arena-samples").textContent = problem.tests
        .slice(0, 2)
        .map(
          (t, i) =>
            `${i + 1}. ${problem.functionName}(${t.args
              .map(formatVal)
              .join(", ")}) -> ${formatVal(t.expected)}`
        )
        .join("\n");
      root.querySelector("#arena-hints").innerHTML = "";
      root.querySelector("#arena-results").hidden = true;
      root.querySelector("#arena-compare").hidden = true;
      root.querySelector("#arena-checklist").hidden = true;
      root.querySelector("#arena-tutor").innerHTML = "";
      const ansPanel = root.querySelector("#arena-model-answer");
      ansPanel.hidden = true;
      root.querySelector("#arena-model-answer-code").textContent =
        problem.modelAnswer || "# No model answer for this problem yet.";
      root.querySelector("#arena-reveal").textContent = "Reveal model answer";

      const draft = localStorage.getItem(getDraftKey(problem.id));
      editor.value = draft || problem.starterCode;
      renderWorkedExample(root.querySelector("#arena-worked"), problem);
      updateGhost();
    }

    function resetSessionPanes() {
      const teach = root.querySelector("#arena-teach");
      if (teach) {
        teach.hidden = true;
        teach.innerHTML = "";
      }
      const gate = root.querySelector("#arena-plan");
      if (gate) gate.hidden = true;
      if (Session) Session.onProblemLoaded(problem);
    }

    function loadProblemIntoUI() {
      resetSessionPanes();
      renderMicroDrill();
      if (interviewOn) startInterviewTimer();
      else stopInterviewTimer();
    }

    function saveDraft() {
      try {
        localStorage.setItem(getDraftKey(problem.id), editor.value);
      } catch {
        /* ignore quota */
      }
    }

    editor.addEventListener("input", () => {
      saveDraft();
      updateGhost();
    });

    function nextProblem() {
      patternFilter = patternSel.value;
      // Coached session owns pattern selection: stay on the target until cleared.
      if (coachedMode && Session && Session.isActive()) {
        const target = Session.nextPattern();
        if (target) {
          patternSel.value = target;
          patternFilter = target;
        }
        seed = (seed * 1664525 + 1013904223) >>> 0;
        problem = generateCodingProblem(seed, patternSel.value || null);
        loadProblemIntoUI();
        return;
      }
      // Deliberate: keep same pattern until streak goal
      if (deliberateOn && patternFilter) {
        /* keep filter */
      } else if (deliberateOn && !patternFilter) {
        // if random but deliberate, stick to last pattern until streak met
        const d = Coach ? Coach.loadDeliberate() : { streaks: {} };
        const goal = Coach ? Coach.STREAK_GOAL : 3;
        const cur = d.streaks[problem.pattern] || 0;
        if (cur > 0 && cur < goal) {
          patternSel.value = problem.pattern;
          patternFilter = problem.pattern;
        }
      }
      seed = (seed * 1664525 + 1013904223) >>> 0;
      problem = generateCodingProblem(seed, patternSel.value || null);
      loadProblemIntoUI();
    }

    function renderCompare(report) {
      const panel = root.querySelector("#arena-compare");
      const cmp = Coach ? Coach.comparePayload(problem, report) : null;
      if (!cmp) {
        panel.hidden = true;
        return;
      }
      panel.hidden = false;
      const ok =
        cmp.passed0 === true
          ? "pass"
          : cmp.passed0 === false
            ? "fail"
            : "pending";
      panel.innerHTML = `
        <h3>Model vs yours (sample #1)</h3>
        <div class="arena-compare-grid">
          <div class="arena-compare-col">
            <div class="arena-compare-label">Model</div>
            <pre>${escapeHtml(formatVal(cmp.expected))}</pre>
            <p class="text-muted">${escapeHtml(cmp.mentalModel || "")}</p>
            <button type="button" class="anim-btn" id="arena-replay-trace">Replay model trace</button>
          </div>
          <div class="arena-compare-col arena-compare-${ok}">
            <div class="arena-compare-label">Yours</div>
            <pre>${
              cmp.yours === null || cmp.yours === undefined
                ? "(not run)"
                : escapeHtml(formatVal(cmp.yours))
            }</pre>
            <p>${
              ok === "pass"
                ? "Matches expected on sample."
                : ok === "fail"
                  ? "Diverges on sample — fix this before other cases."
                  : "Run tests to populate."
            }</p>
          </div>
        </div>`;
      const btn = panel.querySelector("#arena-replay-trace");
      if (btn) {
        btn.onclick = () => {
          renderWorkedExample(root.querySelector("#arena-worked"), problem);
          const host = root.querySelector("#arena-worked");
          host.scrollIntoView({ behavior: "smooth", block: "nearest" });
          coachSay(
            ["Replaying worked example on sample #1.", "Step with Next/Play — match each state in your head."],
            "After the movie, change one line and Run again."
          );
        };
      }
    }

    function renderDiffResults(report) {
      const resultsEl = root.querySelector("#arena-results");
      resultsEl.hidden = false;
      const diag = Coach
        ? Coach.diagnoseFailure(problem, report)
        : {
            kind: report.ok ? "pass" : "fail",
            title: report.ok ? "Passed" : "Failed",
            why: "",
            action: "",
            expected: null,
            got: null,
            passed: report.passed,
            total: report.total,
            coach: [],
          };

      const rows = (report.results || [])
        .map((r) => {
          const cls = r.passed ? "pass" : "fail";
          const detail = r.error
            ? `Error: ${escapeHtml(r.error)}`
            : `got ${escapeHtml(formatVal(r.got))} · expected ${escapeHtml(
                formatVal(r.expected)
              )}`;
          return `<div class="arena-case ${cls}">
            <strong>Case ${r.index}</strong>
            <code>${escapeHtml(problem.functionName)}(${escapeHtml(
              formatVal(r.args).slice(1, -1)
            )})</code>
            <div>${r.passed ? "Passed" : detail}</div>
          </div>`;
        })
        .join("");

      if (diag.kind === "compile") {
        resultsEl.innerHTML = `
          <div class="arena-diff bad">
            <div class="arena-diff-title">${escapeHtml(diag.title)}</div>
            <div class="arena-diff-why"><strong>Why:</strong> ${escapeHtml(
              diag.why
            )}</div>
            <div class="arena-diff-action"><strong>Do this:</strong> ${escapeHtml(
              diag.action
            )}</div>
            <pre class="arena-error">${escapeHtml(report.compile_error || "")}</pre>
          </div>`;
      } else if (diag.kind === "pass") {
        resultsEl.innerHTML = `
          <div class="arena-diff ok">
            <div class="arena-diff-title">All ${report.total} tests passed</div>
            <div class="arena-diff-why">${escapeHtml(diag.why)}</div>
            <div class="arena-diff-action"><strong>Do this:</strong> ${escapeHtml(
              diag.action
            )}</div>
          </div>
          <div class="arena-cases">${rows}</div>`;
      } else {
        resultsEl.innerHTML = `
          <div class="arena-diff bad">
            <div class="arena-diff-title">${escapeHtml(diag.title)} · ${
              diag.passed
            }/${diag.total} passed</div>
            <div class="arena-diff-row">
              <div><span class="text-muted">expected</span><pre>${escapeHtml(
                formatVal(diag.expected)
              )}</pre></div>
              <div><span class="text-muted">got</span><pre>${escapeHtml(
                formatVal(diag.got)
              )}</pre></div>
            </div>
            <div class="arena-diff-why"><strong>Why:</strong> ${escapeHtml(
              diag.why
            )}</div>
            <div class="arena-diff-action"><strong>Do this:</strong> ${escapeHtml(
              diag.action
            )}</div>
          </div>
          <div class="arena-cases">${rows}</div>`;
      }

      if (diag.coach && diag.coach.length) {
        coachSay(diag.coach, diag.action);
      }
      return diag;
    }

    function startInterviewTimer() {
      stopInterviewTimer();
      interviewStarted = Date.now();
      const el = root.querySelector("#arena-timer");
      el.hidden = false;
      const limit = 25 * 60;
      interviewTimer = setInterval(() => {
        const left = Math.max(0, limit - Math.floor((Date.now() - interviewStarted) / 1000));
        const m = String(Math.floor(left / 60)).padStart(2, "0");
        const s = String(left % 60).padStart(2, "0");
        el.textContent = `${m}:${s}`;
        if (left === 0) {
          stopInterviewTimer();
          coachSay(
            ["Interview timer hit 0.", "Finish your thought, Run tests, then review the checklist."],
            "Wrap up and run once more."
          );
        }
      }, 250);
    }

    function stopInterviewTimer() {
      if (interviewTimer) clearInterval(interviewTimer);
      interviewTimer = null;
      root.querySelector("#arena-timer").hidden = !interviewOn;
    }

    function showChecklist(report) {
      const box = root.querySelector("#arena-checklist");
      if (!interviewOn || !Coach) {
        box.hidden = true;
        return;
      }
      const elapsed = Math.floor((Date.now() - interviewStarted) / 1000);
      const items = Coach.interviewChecklist(problem, report, elapsed);
      box.hidden = false;
      box.innerHTML =
        `<h3>Interview post-mortem</h3><ul class="arena-check-list">` +
        items
          .map(
            (it) =>
              `<li class="${it.ok ? "ok" : "bad"}">${it.ok ? "✓" : "○"} ${escapeHtml(
                it.label
              )}</li>`
          )
          .join("") +
        `</ul>`;
    }

    root.querySelector("#arena-new").onclick = nextProblem;
    root.querySelector("#arena-reset").onclick = () => {
      editor.value = problem.starterCode;
      skeletonIdx = 0;
      saveDraft();
      updateGhost();
    };
    root.querySelector("#arena-reveal").onclick = () => {
      const panel = root.querySelector("#arena-model-answer");
      const showing = !panel.hidden;
      panel.hidden = showing;
      root.querySelector("#arena-reveal").textContent = showing
        ? "Reveal model answer"
        : "Hide model answer";
      if (!showing) {
        root.querySelector("#arena-model-answer-code").textContent =
          problem.modelAnswer || "# No model answer for this problem yet.";
        if (Session) Session.noteAid("reveal");
        coachSay(
          ["Model answer revealed — study structure, then hide and retype from memory."],
          "Hide the answer and reconstruct without looking."
        );
      }
    };
    root.querySelector("#arena-hide-answer").onclick = () => {
      root.querySelector("#arena-model-answer").hidden = true;
      root.querySelector("#arena-reveal").textContent = "Reveal model answer";
    };
    root.querySelector("#arena-use-answer").onclick = () => {
      if (!problem.modelAnswer) return;
      if (Session) Session.noteAid("reveal");
      editor.value = problem.modelAnswer;
      skeletonIdx = skelLines().length;
      saveDraft();
      updateGhost();
      editor.focus();
    };
    root.querySelector("#arena-hint").onclick = () => {
      if (!codingUnlocked) {
        coachSay(["Unlock coding via the micro-drill first."], "Answer the micro-drill.");
        return;
      }
      const box = root.querySelector("#arena-hints");
      if (hintIdx >= problem.hints.length) {
        box.innerHTML = `<div class="callout callout-info"><div class="callout-title">Hints</div><p>No more hints. Replay the worked example.</p></div>`;
        coachSay(["No more hints.", "Replay model trace on sample #1."], "Use Replay model trace.");
        return;
      }
      const h = problem.hints[hintIdx++];
      if (Session) Session.noteAid("hint");
      box.innerHTML += `<div class="callout callout-warning"><div class="callout-title">Hint ${hintIdx}</div><p>${escapeHtml(
        h
      )}</p></div>`;
      coachSay([`Hint ${hintIdx}: ${h}`], "Apply the hint, then Run.");
    };

    root.querySelector("#coach-clear").onclick = () => {
      root.querySelector("#coach-log").innerHTML = "";
    };
    const coachedBox = root.querySelector("#arena-coached");
    if (coachedBox) {
      coachedBox.onchange = (e) => {
        coachedMode = e.target.checked;
        root.querySelector("#arena-session").hidden = !coachedMode;
        if (!coachedMode) root.querySelector("#arena-plan").hidden = true;
        coachSay(
          [
            coachedMode
              ? "Coached on: plan gate before coding, gap diagnosis and escalating coaching after each Run."
              : "Coached off: free play. No plan gate, no session bar.",
          ],
          coachedMode ? "Start a session in the panel above." : "Free practice."
        );
      };
    }
    root.querySelector("#arena-deliberate").onchange = (e) => {
      deliberateOn = e.target.checked;
      coachSay(
        [
          deliberateOn
            ? `Deliberate on: stay on a pattern until ${Coach ? Coach.STREAK_GOAL : 3} correct in a row.`
            : "Deliberate off: New problem can jump patterns freely.",
        ],
        deliberateOn ? "Build a streak on one pattern." : "Mixed practice mode."
      );
    };
    root.querySelector("#arena-skeleton").onchange = (e) => {
      skeletonMode = e.target.checked;
      updateGhost();
    };
    root.querySelector("#arena-sound").onchange = (e) => {
      soundOn = e.target.checked;
    };
    root.querySelector("#arena-interview").onchange = (e) => {
      interviewOn = e.target.checked;
      if (interviewOn) startInterviewTimer();
      else {
        stopInterviewTimer();
        root.querySelector("#arena-timer").hidden = true;
        root.querySelector("#arena-checklist").hidden = true;
      }
    };

    async function onRun() {
      if (!codingUnlocked) {
        coachSay(["Micro-drill first — then Run tests."], "Answer the micro-drill.");
        return;
      }
      const resultsEl = root.querySelector("#arena-results");
      const runBtn = root.querySelector("#arena-run");
      runBtn.disabled = true;
      resultsEl.hidden = false;
      resultsEl.innerHTML = `<div class="quiz-feedback">Running tests in-browser Python...</div>`;
      root.querySelector("#arena-tutor").innerHTML = "";
      saveDraft();
      try {
        await ensurePyodide(statusEl);
        const report = await runTests(problem, editor.value);
        lastReport = report;
        const state =
          window.Course && window.Course.loadState
            ? window.Course.loadState()
            : null;

        const diag = renderDiffResults(report);
        renderCompare(report);
        // Refresh worked example / live trace after run
        renderWorkedExample(root.querySelector("#arena-worked"), problem);
        const coachedActive = coachedMode && Session && Session.isActive();

        if (report.compile_error || !report.ok) {
          if (state) {
            state.practiceFailed = (state.practiceFailed || 0) + 1;
            window.Course.saveState(state);
          }
          if (Coach) {
            Coach.recordFail(problem.pattern);
            Coach.playCue("fail", soundOn);
          }
          refreshStreakUI();
          if (window.Course && typeof window.Course.renderTutor === "function") {
            window.Course.renderTutor(
              problem.tutorTopic,
              root.querySelector("#arena-tutor")
            );
          }
          // Deliberate fail: nudge back to movie + optional re-drill
          if (deliberateOn && !coachedActive) {
            coachSay(
              [
                "Streak reset for this pattern.",
                "Replay the worked example, fix one issue, Run again.",
              ],
              diag.action || "Fix the first failing case."
            );
          }
        } else {
          if (state) {
            state.practiceSolved = (state.practiceSolved || 0) + 1;
            window.Course.saveState(state);
          }
          let streak = 0;
          if (Coach) {
            streak = Coach.recordPass(problem.pattern);
            Coach.playCue("pass", soundOn);
          }
          refreshStreakUI();
          const goal = Coach ? Coach.STREAK_GOAL : 3;
          if (coachedActive) {
            /* session owns the narration + pattern selection */
          } else if (deliberateOn && streak >= goal) {
            coachSay(
              [
                `Streak ${streak}/${goal} on ${problem.pattern} — mastery gate cleared.`,
                "Pick a weak pattern from Focus next, or keep going.",
              ],
              "New problem on a weak pattern, or raise the bar with Interview mode."
            );
            patternSel.value = "";
          } else if (deliberateOn) {
            coachSay(
              [`Streak ${streak}/${goal} on ${problem.pattern}.`, "Same pattern again — New problem."],
              `Get ${goal - streak} more correct on this pattern.`
            );
            patternSel.value = problem.pattern;
          }
        }
        showChecklist(report);
        if (coachedActive) {
          const verdict = Session.onAttempt(problem, report, diag);
          if (verdict && verdict.verdict === "session-complete") Session.showReport();
        }
      } catch (err) {
        resultsEl.innerHTML = `
          <div class="quiz-feedback bad">
            <strong>Python runtime failed to load.</strong>
            <p>${escapeHtml(err.message || String(err))}</p>
            <p>Run <code>python scripts/serve_course.py</code> and ensure
            <code>html/vendor/pyodide/</code> exists.</p>
          </div>`;
        statusEl.textContent = "Python runtime unavailable";
        coachSay([String(err.message || err)], "Fix the local server / Pyodide vendor pack.");
      } finally {
        runBtn.disabled = false;
      }
    }

    root.querySelector("#arena-run").onclick = onRun;
    editor.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onRun();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        if (skeletonMode) {
          const lines = skelLines();
          if (skeletonIdx < lines.length) {
            const line = lines[skeletonIdx++];
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            const insert =
              (start > 0 && editor.value[start - 1] !== "\n" ? "\n" : "") +
              line +
              "\n";
            editor.value =
              editor.value.slice(0, start) + insert + editor.value.slice(end);
            editor.selectionStart = editor.selectionEnd = start + insert.length;
            saveDraft();
            updateGhost();
            return;
          }
        }
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value =
          editor.value.slice(0, start) + "    " + editor.value.slice(end);
        editor.selectionStart = editor.selectionEnd = start + 4;
        saveDraft();
      }
    });

    if (Session) {
      Session.attach({
        panelEl: root.querySelector("#arena-session"),
        gateEl: root.querySelector("#arena-plan"),
        teachEl: root.querySelector("#arena-teach"),
        reportEl: root.querySelector("#arena-session-report"),
        coachSay,
        getProblem: () => problem,
        loadPattern: (p) => {
          patternSel.value = p || "";
          patternFilter = p || "";
          seed = (seed * 1664525 + 1013904223) >>> 0;
          problem = generateCodingProblem(seed, patternSel.value || null);
          loadProblemIntoUI();
        },
      });
    }

    loadProblemIntoUI();
    ensurePyodide(statusEl)
      .then(() => {
        if (replOut.dataset.ready !== "1") {
          replOut.textContent =
            "Python ready. Type code below and press Ctrl/Cmd+Enter.";
        }
      })
      .catch((err) => {
        statusEl.textContent =
          "Python not loaded — click Run tests for details. " + (err.message || "");
        replOut.textContent =
          "Python runtime unavailable. Start serve_course.py and ensure vendor/pyodide exists.";
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document
      .querySelectorAll("[data-coding-arena]")
      .forEach((el) => mountCodingArena(el));
  });

  window.PracticeArena = {
    mountCodingArena,
    generateCodingProblem,
    ensurePyodide,
    PATTERN_LIST,
    ALL_PATTERNS,
  };
})();
