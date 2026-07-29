#!/usr/bin/env python3
"""Export idiomatic implementation drill templates → html/js/impl-templates.js."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from patterns import PATTERNS  # noqa: E402

OUT = ROOT / "html" / "js" / "impl-templates.js"

# One-line mantras — recite before typing
MANTRAS: dict[str, str] = {
    "sliding_window": "Expand right; shrink left while valid; answer at each valid window.",
    "two_pointers": "Move the pointer that improves the invariant (sorted ends or fast/slow).",
    "binary_search": "lo < hi; mid = (lo+hi)//2; discard half via monotone predicate.",
    "bfs": "Queue + visited; popleft; enqueue unseen neighbors (level = shortest unweighted).",
    "dfs": "Recurse/stack on neighbors; mark visited; backtrack state when exploring paths.",
    "topological_sort": "Indegree queue (Kahn) or post-order DFS; edge only when deps satisfied.",
    "dp": "Define state → transition → base → order (bottom-up) or memo (top-down).",
    "greedy": "Sort by the right key; prove local choice never hurts; scan once.",
    "backtracking": "Choose → explore → undo; prune early; build path in-place.",
    "heap": "heapq push/pop; size-K window; negate for max-heap in Python.",
    "monotonic_stack": "While stack top breaks mono invariant, pop (that's the answer event).",
    "union_find": "Find with path compression; union by rank; components-- on merge.",
    "trie": "Walk/create children[char]; mark is_end; prefix = node reached.",
    "prefix_sum": "pref[i+1]=pref[i]+a[i]; range sum = pref[r+1]-pref[l].",
    "hash_map": "Complement / frequency / group-by-canonical-key in one pass.",
    "dijkstra": "Min-heap of (dist,node); relax edges; skip stale heap entries.",
    "binary_search_answer": "Binary search the numeric answer; mid feasible ⇒ try smaller.",
    "sweep_line": "Sort events; sweep; update active set; answer at event points.",
    "linked_list": "Dummy head; save next before rewiring; fast/slow for mid/cycle.",
    "bit_manipulation": "x&-x lowest bit; x&(x-1) clear lowest; XOR for parity/unique.",
    "difference_array": "diff[l]+=v; diff[r+1]-=v; prefix to materialize.",
}

# Intentional near-miss bugs (idiomatic base with one classic pitfall)
BUGS: dict[str, list[dict]] = {
    "sliding_window": [
        {
            "title": "Contract too late",
            "buggy": '''def longest_unique(s):
    left = 0
    best = 0
    seen = set()
    for right in range(len(s)):
        seen.add(s[right])
        while s[right] in seen and left < right:
            seen.remove(s[left])
            left += 1
        best = max(best, right - left + 1)
    return best''',
            "fix": '''def longest_unique(s):
    left = 0
    best = 0
    seen = set()
    for right in range(len(s)):
        while s[right] in seen:
            seen.remove(s[left])
            left += 1
        seen.add(s[right])
        best = max(best, right - left + 1)
    return best''',
            "explain": "Add after the while shrinks — otherwise you add a duplicate then fail to shrink correctly.",
        }
    ],
    "two_pointers": [
        {
            "title": "Forgot sorted requirement",
            "buggy": '''def two_sum(arr, target):
    left, right = 0, len(arr) - 1
    while left < right:
        cur = arr[left] + arr[right]
        if cur == target:
            return [left, right]
        if cur < target:
            left += 1
        else:
            right -= 1
    return []''',
            "fix": '''def two_sum(arr, target):
    # Requires sorted input (or sort a copy and map indices)
    left, right = 0, len(arr) - 1
    while left < right:
        cur = arr[left] + arr[right]
        if cur == target:
            return [left, right]
        if cur < target:
            left += 1
        else:
            right -= 1
    return []''',
            "explain": "Converging two-sum is only correct on sorted arrays. Unsorted → hash map.",
        }
    ],
    "binary_search": [
        {
            "title": "Infinite loop mid",
            "buggy": '''def lower_bound(arr, target):
    lo, hi = 0, len(arr)
    while lo < hi:
        mid = (lo + hi) // 2
        if arr[mid] < target:
            lo = mid
        else:
            hi = mid
    return lo''',
            "fix": '''def lower_bound(arr, target):
    lo, hi = 0, len(arr)
    while lo < hi:
        mid = (lo + hi) // 2
        if arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo''',
            "explain": "When taking the right half, set lo = mid + 1 or lo never advances when mid == lo.",
        }
    ],
    "bfs": [
        {
            "title": "Mark visited too late",
            "buggy": '''from collections import deque

def bfs(graph, start):
    q = deque([start])
    visited = set()
    while q:
        node = q.popleft()
        if node in visited:
            continue
        visited.add(node)
        for nei in graph[node]:
            q.append(nei)
    return visited''',
            "fix": '''from collections import deque

def bfs(graph, start):
    q = deque([start])
    visited = {start}
    while q:
        node = q.popleft()
        for nei in graph[node]:
            if nei not in visited:
                visited.add(nei)
                q.append(nei)
    return visited''',
            "explain": "Mark when enqueueing (or before) to avoid duplicate queue entries — O(E) blowup otherwise.",
        }
    ],
    "dfs": [
        {
            "title": "Missing backtrack undo",
            "buggy": '''def subsets(nums):
    out = []
    path = []
    def dfs(i):
        if i == len(nums):
            out.append(path[:])
            return
        path.append(nums[i])
        dfs(i + 1)
        dfs(i + 1)
    dfs(0)
    return out''',
            "fix": '''def subsets(nums):
    out = []
    path = []
    def dfs(i):
        if i == len(nums):
            out.append(path[:])
            return
        path.append(nums[i])
        dfs(i + 1)
        path.pop()
        dfs(i + 1)
    dfs(0)
    return out''',
            "explain": "After exploring the 'take' branch, pop before the 'skip' branch.",
        }
    ],
    "topological_sort": [
        {
            "title": "Wrong indegree edge direction",
            "buggy": '''from collections import deque, defaultdict

def topo(n, edges):
    g = defaultdict(list)
    indeg = [0] * n
    for u, v in edges:  # u -> v means u before v
        g[v].append(u)
        indeg[u] += 1
    q = deque([i for i in range(n) if indeg[i] == 0])
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in g[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else []''',
            "fix": '''from collections import deque, defaultdict

def topo(n, edges):
    g = defaultdict(list)
    indeg = [0] * n
    for u, v in edges:  # u -> v means u before v
        g[u].append(v)
        indeg[v] += 1
    q = deque([i for i in range(n) if indeg[i] == 0])
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in g[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else []''',
            "explain": "Edge u→v: adjacency from u, indegree on v. Reversing both breaks Kahn.",
        }
    ],
    "dp": [
        {
            "title": "Wrong recurrence index",
            "buggy": '''def rob(nums):
    if not nums:
        return 0
    n = len(nums)
    dp = [0] * (n + 1)
    dp[1] = nums[0]
    for i in range(2, n + 1):
        dp[i] = max(dp[i - 1], dp[i - 2] + nums[i])
    return dp[n]''',
            "fix": '''def rob(nums):
    if not nums:
        return 0
    n = len(nums)
    dp = [0] * (n + 1)
    dp[1] = nums[0]
    for i in range(2, n + 1):
        dp[i] = max(dp[i - 1], dp[i - 2] + nums[i - 1])
    return dp[n]''',
            "explain": "1-indexed dp[i] = best using first i houses → add nums[i-1], not nums[i].",
        }
    ],
    "greedy": [
        {
            "title": "Wrong sort key",
            "buggy": '''def erase_overlap(intervals):
    intervals.sort(key=lambda x: x[0])
    end = float('-inf')
    removed = 0
    for s, e in intervals:
        if s < end:
            removed += 1
        else:
            end = e
    return removed''',
            "fix": '''def erase_overlap(intervals):
    intervals.sort(key=lambda x: x[1])
    end = float('-inf')
    removed = 0
    for s, e in intervals:
        if s < end:
            removed += 1
        else:
            end = e
    return removed''',
            "explain": "Interval scheduling: sort by end time so you free the line ASAP.",
        }
    ],
    "backtracking": [
        {
            "title": "Forgot path copy",
            "buggy": '''def permute(nums):
    out = []
    def bt(path, used):
        if len(path) == len(nums):
            out.append(path)
            return
        for i, x in enumerate(nums):
            if used[i]:
                continue
            used[i] = True
            path.append(x)
            bt(path, used)
            path.pop()
            used[i] = False
    bt([], [False] * len(nums))
    return out''',
            "fix": '''def permute(nums):
    out = []
    def bt(path, used):
        if len(path) == len(nums):
            out.append(path[:])
            return
        for i, x in enumerate(nums):
            if used[i]:
                continue
            used[i] = True
            path.append(x)
            bt(path, used)
            path.pop()
            used[i] = False
    bt([], [False] * len(nums))
    return out''',
            "explain": "Append path[:] (a copy). Appending path stores a mutable reference.",
        }
    ],
    "heap": [
        {
            "title": "Max-heap without negation",
            "buggy": '''import heapq

def kth_largest(nums, k):
    h = []
    for x in nums:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)
    return h[0]''',
            "fix": '''import heapq

def kth_largest(nums, k):
    # Min-heap of size k → root is k-th largest
    h = []
    for x in nums:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)
    return h[0]''',
            "explain": "This code is actually correct for kth largest. Bug hunt: claiming it needs negation — size-k min-heap is the idiom. (Trick: mark correct if you say 'no bug / this is the idiom'.)",
            "actually_correct": True,
        }
    ],
    "monotonic_stack": [
        {
            "title": "Wrong comparison direction",
            "buggy": '''def next_greater(arr):
    n = len(arr)
    ans = [-1] * n
    stack = []
    for i, x in enumerate(arr):
        while stack and arr[stack[-1]] > x:
            j = stack.pop()
            ans[j] = x
        stack.append(i)
    return ans''',
            "fix": '''def next_greater(arr):
    n = len(arr)
    ans = [-1] * n
    stack = []
    for i, x in enumerate(arr):
        while stack and arr[stack[-1]] < x:
            j = stack.pop()
            ans[j] = x
        stack.append(i)
    return ans''',
            "explain": "Next greater: pop while top is smaller than current. `>` builds next-smaller.",
        }
    ],
    "union_find": [
        {
            "title": "No path compression",
            "buggy": '''class UnionFind:
    def __init__(self, n):
        self.p = list(range(n))
    def find(self, x):
        while self.p[x] != x:
            x = self.p[x]
        return x
    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.p[ra] = rb''',
            "fix": '''class UnionFind:
    def __init__(self, n):
        self.p = list(range(n))
    def find(self, x):
        if self.p[x] != x:
            self.p[x] = self.find(self.p[x])
        return self.p[x]
    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.p[ra] = rb''',
            "explain": "Path compression (or iterative parent[x]=parent[parent[x]]) is required for near-O(1).",
        }
    ],
    "trie": [
        {
            "title": "Forgot is_end",
            "buggy": '''class Trie:
    def __init__(self):
        self.root = {}
    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
    def search(self, word):
        node = self.root
        for ch in word:
            if ch not in node:
                return False
            node = node[ch]
        return True''',
            "fix": '''class Trie:
    def __init__(self):
        self.root = {}
    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node['#'] = True
    def search(self, word):
        node = self.root
        for ch in word:
            if ch not in node:
                return False
            node = node[ch]
        return '#' in node''',
            "explain": "Without an end marker, prefixes falsely count as words.",
        }
    ],
    "prefix_sum": [
        {
            "title": "Off-by-one on range",
            "buggy": '''def range_sum(pref, l, r):
    # pref[i] = sum of a[0..i)
    return pref[r] - pref[l - 1]''',
            "fix": '''def range_sum(pref, l, r):
    # pref[i] = sum of a[0..i); inclusive [l, r]
    return pref[r + 1] - pref[l]''',
            "explain": "With pref[i]=sum(a[0:i]), inclusive [l,r] is pref[r+1]-pref[l].",
        }
    ],
    "hash_map": [
        {
            "title": "Two-sum index collision",
            "buggy": '''def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        seen[x] = i
        need = target - x
        if need in seen:
            return [seen[need], i]
    return []''',
            "fix": '''def two_sum(nums, target):
    seen = {}
    for i, x in enumerate(nums):
        need = target - x
        if need in seen:
            return [seen[need], i]
        seen[x] = i
    return []''',
            "explain": "Check complement before inserting, or 2*x==target reuses the same index.",
        }
    ],
    "dijkstra": [
        {
            "title": "No stale-entry skip",
            "buggy": '''import heapq

def dijkstra(n, graph, src):
    dist = [float('inf')] * n
    dist[src] = 0
    h = [(0, src)]
    while h:
        d, u = heapq.heappop(h)
        for v, w in graph[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(h, (nd, v))
    return dist''',
            "fix": '''import heapq

def dijkstra(n, graph, src):
    dist = [float('inf')] * n
    dist[src] = 0
    h = [(0, src)]
    while h:
        d, u = heapq.heappop(h)
        if d > dist[u]:
            continue
        for v, w in graph[u]:
            nd = d + w
            if nd < dist[v]:
                dist[v] = nd
                heapq.heappush(h, (nd, v))
    return dist''',
            "explain": "Skip heap entries with d > dist[u] — otherwise you reprocess outdated distances.",
        }
    ],
    "binary_search_answer": [
        {
            "title": "Feasible branch wrong side",
            "buggy": '''def min_feasible(lo, hi, ok):
    while lo < hi:
        mid = (lo + hi) // 2
        if ok(mid):
            lo = mid + 1
        else:
            hi = mid
    return lo''',
            "fix": '''def min_feasible(lo, hi, ok):
    while lo < hi:
        mid = (lo + hi) // 2
        if ok(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo''',
            "explain": "Seeking minimum feasible: if ok(mid), search left (hi=mid), else lo=mid+1.",
        }
    ],
    "sweep_line": [
        {
            "title": "Unsorted events",
            "buggy": '''def max_overlap(intervals):
    events = []
    for s, e in intervals:
        events.append((s, 1))
        events.append((e, -1))
    cur = best = 0
    for _, d in events:
        cur += d
        best = max(best, cur)
    return best''',
            "fix": '''def max_overlap(intervals):
    events = []
    for s, e in intervals:
        events.append((s, 1))
        events.append((e, -1))
    events.sort(key=lambda x: (x[0], x[1]))  # ends before starts at same time
    cur = best = 0
    for _, d in events:
        cur += d
        best = max(best, cur)
    return best''',
            "explain": "Must sort events; at equal time process -1 before +1 if touching shouldn't count.",
        }
    ],
    "linked_list": [
        {
            "title": "Lost next pointer",
            "buggy": '''def reverse(head):
    prev = None
    cur = head
    while cur:
        cur.next = prev
        prev = cur
        cur = cur.next
    return prev''',
            "fix": '''def reverse(head):
    prev = None
    cur = head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev''',
            "explain": "Save nxt = cur.next before rewiring, or you walk into the already-reversed list.",
        }
    ],
    "bit_manipulation": [
        {
            "title": "Wrong clear-lowest",
            "buggy": '''def clear_lowest(x):
    return x & -x''',
            "fix": '''def clear_lowest(x):
    return x & (x - 1)''',
            "explain": "x & -x isolates the lowest set bit; x & (x-1) clears it.",
        }
    ],
    "difference_array": [
        {
            "title": "Forgot prefix materialize",
            "buggy": '''def range_add(n, updates):
    diff = [0] * (n + 1)
    for l, r, v in updates:
        diff[l] += v
        diff[r + 1] -= v
    return diff[:n]''',
            "fix": '''def range_add(n, updates):
    diff = [0] * (n + 1)
    for l, r, v in updates:
        diff[l] += v
        if r + 1 < len(diff):
            diff[r + 1] -= v
    out = [0] * n
    run = 0
    for i in range(n):
        run += diff[i]
        out[i] = run
    return out''',
            "explain": "Difference array stores deltas; prefix-sum to get the final array.",
        }
    ],
}

CORE_EXTRAS = [
    {
        "id": "merge_sort",
        "name": "Merge Sort (merge step)",
        "kind": "core",
        "category": "sorting",
        "mantra": "Two pointers on sorted halves; take the smaller; drain remainders.",
        "when": ["Stable O(n log n) sort", "Count inversions", "Merge sorted lists"],
        "drill": '''def merge(left, right):
    i = j = 0
    out = []
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i])
            i += 1
        else:
            out.append(right[j])
            j += 1
    out.extend(left[i:])
    out.extend(right[j:])
    return out''',
        "bugs": [
            {
                "title": "Unstable compare",
                "buggy": '''def merge(left, right):
    i = j = 0
    out = []
    while i < len(left) and j < len(right):
        if left[i] < right[j]:
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    out.extend(left[i:]); out.extend(right[j:])
    return out''',
                "fix": '''def merge(left, right):
    i = j = 0
    out = []
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    out.extend(left[i:]); out.extend(right[j:])
    return out''',
                "explain": "Use <= so equal keys prefer left — keeps merge sort stable.",
            }
        ],
    },
    {
        "id": "quickselect_partition",
        "name": "Quickselect Partition",
        "kind": "core",
        "category": "sorting",
        "mantra": "Pivot; write pointer for < pivot; swap pivot into place; recurse one side.",
        "when": ["Kth element expected O(n)", "Partition around pivot"],
        "drill": '''def partition(arr, lo, hi):
    pivot = arr[hi]
    write = lo
    for i in range(lo, hi):
        if arr[i] < pivot:
            arr[write], arr[i] = arr[i], arr[write]
            write += 1
    arr[write], arr[hi] = arr[hi], arr[write]
    return write''',
        "bugs": [],
    },
    {
        "id": "binary_heap_sift",
        "name": "Binary Heap Sift-Down",
        "kind": "core",
        "category": "structure",
        "mantra": "Compare with both children; swap with smaller (min-heap); repeat.",
        "when": ["Implement heapify", "Understand heapq internals"],
        "drill": '''def sift_down(a, i, n):
    while True:
        left = 2 * i + 1
        right = left + 1
        smallest = i
        if left < n and a[left] < a[smallest]:
            smallest = left
        if right < n and a[right] < a[smallest]:
            smallest = right
        if smallest == i:
            return
        a[i], a[smallest] = a[smallest], a[i]
        i = smallest''',
        "bugs": [],
    },
    {
        "id": "kadane",
        "name": "Kadane (max subarray)",
        "kind": "core",
        "category": "technique",
        "mantra": "best_ending_here = max(x, best_ending_here + x); track global best.",
        "when": ["Maximum contiguous subarray sum", "1D DP that is greedy-shaped"],
        "drill": '''def max_subarray(nums):
    best = cur = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)
        best = max(best, cur)
    return best''',
        "bugs": [],
    },
    {
        "id": "eng_retry_backoff",
        "name": "Retry with Exponential Backoff",
        "kind": "engineering",
        "category": "reliability",
        "mantra": "Retry only idempotent ops; exp backoff + jitter; cap attempts.",
        "when": ["Transient network failures", "Idempotent side effects"],
        "drill": '''import random, time

def call_with_retry(fn, attempts=5, base=0.05, cap=2.0):
    for i in range(attempts):
        try:
            return fn()
        except TransientError:
            if i == attempts - 1:
                raise
            sleep = min(cap, base * (2 ** i))
            sleep *= 0.5 + random.random()  # full jitter
            time.sleep(sleep)''',
        "bugs": [],
    },
    {
        "id": "eng_circuit_breaker",
        "name": "Circuit Breaker State Machine",
        "kind": "engineering",
        "category": "reliability",
        "mantra": "Closed → Open on failure threshold; Half-Open probe; success closes.",
        "when": ["Dependency unhealthy", "Fail fast to protect callers"],
        "drill": '''class CircuitBreaker:
    def __init__(self, threshold=5, reset_timeout=30):
        self.failures = 0
        self.threshold = threshold
        self.reset_timeout = reset_timeout
        self.state = "closed"  # closed | open | half_open
        self.opened_at = 0

    def allow(self, now):
        if self.state == "open":
            if now - self.opened_at >= self.reset_timeout:
                self.state = "half_open"
                return True
            return False
        return True

    def on_success(self):
        self.failures = 0
        self.state = "closed"

    def on_failure(self, now):
        self.failures += 1
        if self.state == "half_open" or self.failures >= self.threshold:
            self.state = "open"
            self.opened_at = now''',
        "bugs": [],
    },
    {
        "id": "eng_idempotency",
        "name": "Idempotency Key Handler",
        "kind": "engineering",
        "category": "reliability",
        "mantra": "Key → store intent before side effect; replay returns same result.",
        "when": ["Retryable POSTs", "Payment / mutate APIs"],
        "drill": '''def handle(req, store, execute):
    key = req.idempotency_key
    cached = store.get(key)
    if cached is not None:
        return cached
    result = execute(req)
    store.put(key, result)
    return result''',
        "bugs": [],
    },
]


def extract_primary(template: str) -> str:
    """First substantial top-level def/class. Skip tiny helpers (e.g. ListNode)."""
    lines = template.splitlines()
    prelude: list[str] = []
    i = 0
    while i < len(lines) and not re.match(r"^(def |class )", lines[i]):
        s = lines[i].strip()
        if s.startswith("import ") or s.startswith("from "):
            prelude.append(lines[i])
        i += 1
    if i >= len(lines):
        return template.strip()

    # Skip tiny class stubs (ListNode etc.) when a real def follows
    if lines[i].startswith("class "):
        j = i + 1
        while j < len(lines) and (
            not lines[j].strip()
            or lines[j].startswith(" ")
            or lines[j].startswith("\t")
        ):
            j += 1
        body_lines = j - i
        if body_lines <= 5 and j < len(lines) and re.match(r"^def ", lines[j]):
            i = j

    start = i
    kind = "class" if lines[i].startswith("class ") else "def"
    i += 1
    if kind == "def":
        while i < len(lines) and not re.match(r"^(def |class )", lines[i]):
            i += 1
    else:
        # Include following helper classes only if immediately adjacent (TrieNode + Trie)
        while i < len(lines):
            if re.match(r"^class ", lines[i]):
                i += 1
                continue
            if re.match(r"^def ", lines[i]):
                break
            i += 1
        # If we stopped at def after classes, that's fine — don't include free functions
        # Re-walk: take from start through end of last consecutive top-level class
        i = start + 1
        last_class_end = start + 1
        while i < len(lines):
            if re.match(r"^class ", lines[i]):
                i += 1
                while i < len(lines) and (
                    not lines[i].strip()
                    or lines[i].startswith(" ")
                    or lines[i].startswith("\t")
                ):
                    i += 1
                last_class_end = i
                continue
            if re.match(r"^def ", lines[i]):
                break
            if not lines[i].strip():
                i += 1
                continue
            if lines[i].startswith(" ") or lines[i].startswith("\t"):
                i += 1
                last_class_end = i
                continue
            break
        i = last_class_end

    body = lines[start:i]
    while body and not body[-1].strip():
        body.pop()
    parts = prelude + ([""] if prelude else []) + body
    return "\n".join(parts).strip()


def scramble_units(code: str) -> list[str]:
    """Non-empty, non-comment-only lines for ordering drills."""
    units = []
    for line in code.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith("#") and '"""' not in stripped:
            continue
        units.append(line.rstrip())
    return units


def make_cloze(code: str, limit: int = 6) -> list[dict]:
    """Blank critical tokens on key control-flow / assignment lines."""
    targets = []
    patterns = [
        (r"\bwhile\s+(.+):", "while condition"),
        (r"\bfor\s+(\w+)\s+in\s+(.+):", "for-loop"),
        (r"\bif\s+(.+):", "if condition"),
        (r"(mid\s*=\s*.+)", "mid calculation"),
        (r"(left\s*[+\-]=.*|right\s*[+\-]=.*|lo\s*=.*|hi\s*=.*)", "bound update"),
        (r"(heapq\.\w+\([^)]*\))", "heap op"),
        (r"(visited\.(add|append)\([^)]*\))", "visit mark"),
        (r"(queue\.(append|popleft)\([^)]*\))", "queue op"),
        (r"(self\.parent\[\w+\]\s*=\s*.+)", "UF compress"),
        (r"(pref\[\w+\]\s*=\s*.+)", "prefix update"),
        (r"(diff\[\w+\]\s*[+\-]=.*)", "diff update"),
        (r"(return\s+.+)", "return"),
    ]
    for idx, line in enumerate(code.splitlines()):
        s = line.strip()
        if not s or s.startswith("#") or s.startswith('"""') or s.startswith("'''"):
            continue
        for rx, label in patterns:
            m = re.search(rx, s)
            if m:
                blank = re.sub(rx, lambda mm: mm.group(0)[: mm.start(1) - mm.start(0)] + "___" + mm.group(0)[mm.end(1) - mm.start(0) :], s, count=1)
                # simpler blank: replace matched group 1 with ___
                blank_line = s[: m.start(1)] + "___" + s[m.end(1) :]
                targets.append(
                    {
                        "line_index": idx,
                        "label": label,
                        "prompt": blank_line,
                        "answer": m.group(1).strip(),
                        "full_line": s,
                    }
                )
                break
        if len(targets) >= limit:
            break
    return targets[:limit]


# Curated burn-in drills when first-def extraction is weak / comment-heavy
DRILL_OVERRIDES: dict[str, str] = {
    "dfs": '''def dfs_graph(graph, start):
    stack = [start]
    visited = {start}
    while stack:
        node = stack.pop()
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                stack.append(neighbor)
    return visited


def dfs_matrix(grid, r, c, visited):
    rows, cols = len(grid), len(grid[0])
    if (r < 0 or r >= rows or c < 0 or c >= cols
            or (r, c) in visited or grid[r][c] == 0):
        return
    visited.add((r, c))
    for dr, dc in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        dfs_matrix(grid, r + dr, c + dc, visited)''',
    "linked_list": '''def reverse_list(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev, cur = cur, nxt
    return prev


def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False


def middle_node(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow''',
    "heap": '''import heapq

def kth_largest(nums, k):
    """Min-heap of size k; root is the k-th largest."""
    h = []
    for x in nums:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)
    return h[0]


def merge_k_sorted(lists):
    heap = []
    for i, lst in enumerate(lists):
        if lst:
            heapq.heappush(heap, (lst[0], i, 0))
    out = []
    while heap:
        val, li, ei = heapq.heappop(heap)
        out.append(val)
        if ei + 1 < len(lists[li]):
            heapq.heappush(heap, (lists[li][ei + 1], li, ei + 1))
    return out''',
}


def build_entry(p) -> dict:
    primary = DRILL_OVERRIDES.get(p.id) or extract_primary(p.template)
    return {
        "id": p.id,
        "name": p.name,
        "kind": "pattern",
        "category": p.category,
        "mantra": MANTRAS.get(p.id, p.name),
        "when": p.when_to_use[:4],
        "approach": p.approach[:4],
        "time": p.time_complexity,
        "space": p.space_complexity,
        "pitfalls": p.pitfalls[:3],
        "drill": primary,
        "full": p.template.strip(),
        "scramble": scramble_units(primary),
        "cloze": make_cloze(primary),
        "bugs": BUGS.get(p.id, []),
        "href": f"patterns.html#{p.id}",
    }


def build_core(c: dict) -> dict:
    drill = c["drill"].strip()
    return {
        "id": c["id"],
        "name": c["name"],
        "kind": c["kind"],
        "category": c["category"],
        "mantra": c["mantra"],
        "when": c["when"],
        "approach": [],
        "time": "",
        "space": "",
        "pitfalls": [],
        "drill": drill,
        "full": drill,
        "scramble": scramble_units(drill),
        "cloze": make_cloze(drill),
        "bugs": c.get("bugs", []),
        "href": "sorting.html" if c["category"] == "sorting" else "engineering_patterns.html",
    }


def main() -> None:
    items = [build_entry(p) for p in PATTERNS] + [build_core(c) for c in CORE_EXTRAS]
    # Fix heap "actually_correct" joke — replace with a real bug
    for it in items:
        if it["id"] != "heap":
            continue
        it["bugs"] = [
            {
                "title": "Popped when heap too small",
                "buggy": '''import heapq

def kth_largest(nums, k):
    h = []
    for x in nums:
        heapq.heappush(h, x)
        heapq.heappop(h)
    return h[0]''',
                "fix": '''import heapq

def kth_largest(nums, k):
    h = []
    for x in nums:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)
    return h[0]''',
                "explain": "Only pop when len(h) > k — otherwise you empty the heap.",
            }
        ]

    payload = {
        "version": 1,
        "goal": (
            "Burn the idiomatic, theoretically clean implementation into long-term "
            "memory. Adjust from this base for each problem — never invent from scratch."
        ),
        "items": items,
    }
    text = (
        "/** Auto-generated by scripts/export_impl_templates.py — do not edit by hand. */\n"
        "window.IMPL_TEMPLATES = "
        + json.dumps(payload, indent=2, ensure_ascii=False)
        + ";\n"
    )
    OUT.write_text(text, encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)} — {len(items)} items")


if __name__ == "__main__":
    main()
