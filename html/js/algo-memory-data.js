/** Auto-shaped from patterns.py — Algorithm Memory Lab catalog */
window.ALGO_MEMORY_PATTERNS = [
  {
    "num": 1,
    "id": "sliding_window",
    "name": "Sliding Window",
    "category": "technique",
    "description": "Maintain a window (subarray/substring) that slides across the input. Instead of recalculating from scratch for each position, update the window incrementally by adding/removing elements at the edges. Converts O(n*k) brute force into O(n).",
    "when": [
      "Problem mentions 'contiguous subarray' or 'substring'",
      "Find max/min/count of something in a subarray of size k",
      "Find smallest/longest subarray satisfying a condition",
      "String problems with character frequency constraints",
      "Keywords: 'consecutive', 'contiguous', 'window', 'substring'"
    ],
    "approach": [
      "1. Identify what the window tracks (sum, frequency map, count of valid chars, etc.)",
      "2. Decide: fixed-size window or variable-size window?",
      "   - Fixed: slide right pointer, slide left pointer, both move every step",
      "   - Variable: expand right to satisfy, contract left to minimize/optimize",
      "3. Initialize window state for the first window",
      "4. Slide: update state by adding right element and removing left element"
    ],
    "skeleton": "def sliding_window_variable(arr, condition):\n    \"\"\"Variable-size: find min/max window satisfying condition.\"\"\"\n    left = 0\n    best = float('inf')  # or 0 for max\n    window_state = ...   # e.g., counter, sum, set\n\n    for right in range(len(arr)):\n        # Expand: add arr[right] to window state\n        update_state(window_state, arr[right])\n\n        # Contract: shrink from left while window is valid\n        while is_valid(window_state, condition):\n            best = min(best, right - left + 1)\n            # Remove arr[left] from window state\n            remove_from_state(window_state, arr[left])\n            left += 1\n\n    return best\n\n\ndef sliding_window_fixed(arr, k):\n    \"\"\"Fixed-size window of size k.\"\"\"\n    window_state = ...  # initialize for first k elements\n\n    for i in range(k, len(arr)):\n        # Add arr[i], remove arr[i - k]\n        update_state(window_state, arr[i], arr[i - k])\n        # Check/update answer\n\n    return answer",
    "time": "O(n) — each element enters and leaves the window at most once",
    "space": "O(1) or O(k) depending on what the window tracks",
    "pitfalls": [
      "Off-by-one on window boundaries (left inclusive, right inclusive vs exclusive)",
      "Forgetting to handle the case where no valid window exists",
      "For variable windows: contracting too early or not enough",
      "Not initializing window state correctly for the first window"
    ],
    "canonical": [
      "Longest Substring Without Repeating Characters",
      "Minimum Window Substring",
      "Longest Repeating Character Replacement",
      "Sliding Window Maximum (with deque)",
      "Permutation in String"
    ],
    "related": [
      "two_pointers",
      "hash_map"
    ],
    "picture": "Train window on scenery",
    "movie": "Expand R / shrink L",
    "ee": "Moving-average FIR: add new sample, subtract leaving.",
    "href": "patterns.html#sliding_window"
  },
  {
    "num": 2,
    "id": "two_pointers",
    "name": "Two Pointers",
    "category": "technique",
    "description": "Use two pointers that move through the data structure in a coordinated way. Typically one from each end (converging), or both from the start at different speeds (fast/slow). Reduces nested loops from O(n^2) to O(n).",
    "when": [
      "Sorted array + find pair with target sum/difference",
      "Remove duplicates or partition in-place",
      "Compare/merge from both ends (palindrome, container problems)",
      "Linked list: cycle detection, find middle, find k-th from end",
      "Keywords: 'pair', 'sorted', 'in-place', 'partition'"
    ],
    "approach": [
      "1. Identify the pointer strategy:",
      "   - Opposite ends: left=0, right=n-1, converge based on comparison",
      "   - Same direction: slow and fast, fast advances faster or conditionally",
      "   - Two arrays: pointer per array, advance based on comparison",
      "2. Define the movement rule: when does each pointer advance?",
      "3. Define the termination condition: when do pointers meet/cross?"
    ],
    "skeleton": "def two_pointers_opposite(arr, target):\n    \"\"\"Converging pointers from both ends (requires sorted input).\"\"\"\n    left, right = 0, len(arr) - 1\n    while left < right:\n        current = arr[left] + arr[right]\n        if current == target:\n            return [left, right]\n        elif current < target:\n            left += 1\n        else:\n            right -= 1\n    return []\n\n\ndef two_pointers_fast_slow(head):\n    \"\"\"Fast/slow pointers for cycle detection (Floyd's).\"\"\"\n    slow = fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        if slow == fast:\n            return True  # cycle found\n    return False\n\n\ndef two_pointers_partition(arr):\n    \"\"\"Partition/remove in-place.\"\"\"\n    write = 0\n    for read in range(len(arr)):\n        if should_keep(arr[read]):\n            arr[write] = arr[read]\n            write += 1\n    return write  # new length",
    "time": "O(n) — each pointer traverses at most n elements",
    "space": "O(1) — in-place pointer manipulation",
    "pitfalls": [
      "Forgetting that converging pointers require sorted input",
      "Infinite loops from not advancing at least one pointer each iteration",
      "Off-by-one: left < right vs left <= right depends on the problem"
    ],
    "canonical": [
      "Two Sum II (sorted)",
      "3Sum",
      "Container With Most Water",
      "Trapping Rain Water",
      "Valid Palindrome"
    ],
    "related": [
      "sliding_window",
      "binary_search"
    ],
    "picture": "Balance scale ends",
    "movie": "Move the failing side",
    "ee": "Two probes moving on a rail; move the one that improves the metric.",
    "href": "patterns.html#two_pointers"
  },
  {
    "num": 3,
    "id": "binary_search",
    "name": "Binary Search",
    "category": "technique",
    "description": "Repeatedly halve the search space by checking a condition at the midpoint. Not just for sorted arrays — works on any monotonic predicate. The key insight: 'binary search on the answer' applies when you can frame the problem as 'find the smallest/largest X such that condition(X) is true'.",
    "when": [
      "Sorted array: find element, insertion point, boundary",
      "'Find minimum X that satisfies condition' — binary search on the answer",
      "Problem has O(log n) time requirement",
      "Search space can be halved based on a condition at the midpoint",
      "Keywords: 'sorted', 'minimum/maximum that satisfies', 'O(log n)'"
    ],
    "approach": [
      "1. Define the search space: [lo, hi]",
      "2. Define the predicate: condition(mid) -> bool",
      "3. Determine: searching for leftmost True or rightmost True?",
      "4. Choose the right template (see below) to avoid off-by-one",
      "5. Verify: does lo converge to the right answer?"
    ],
    "skeleton": "def binary_search_leftmost(arr, target):\n    \"\"\"Find leftmost position where arr[pos] >= target.\"\"\"\n    lo, hi = 0, len(arr)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if arr[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid\n    return lo  # first index where arr[index] >= target\n\n\ndef binary_search_on_answer(lo, hi, condition):\n    \"\"\"Find the smallest value in [lo, hi] where condition is True.\n    Assumes: condition is False for small values, True for large values.\n    \"\"\"\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if condition(mid):\n            hi = mid      # mid might be the answer, search left\n        else:\n            lo = mid + 1  # mid is too small\n    return lo\n\n\n# Example: Koko eating bananas\n# condition = lambda speed: can_finish(piles, speed, h)\n# answer = binary_search_on_answer(1, max(piles), condition)",
    "time": "O(log n) — halving the search space each step",
    "space": "O(1)",
    "pitfalls": [
      "Off-by-one: lo < hi vs lo <= hi — pick one template and stick with it",
      "Integer overflow: use lo + (hi - lo) // 2 instead of (lo + hi) // 2",
      "Infinite loops: ensure lo or hi changes every iteration",
      "Forgetting to handle empty arrays"
    ],
    "canonical": [
      "Binary Search",
      "Search in Rotated Sorted Array",
      "Find Minimum in Rotated Sorted Array",
      "Koko Eating Bananas",
      "Median of Two Sorted Arrays"
    ],
    "related": [
      "two_pointers"
    ],
    "picture": "DAC successive approx",
    "movie": "mid discards half",
    "ee": "Successive-approximation ADC on a monotone line.",
    "href": "patterns.html#binary_search"
  },
  {
    "num": 4,
    "id": "bfs",
    "name": "Breadth-First Search",
    "category": "traversal",
    "description": "Explore nodes level by level outward from the source. Uses a queue. Guarantees shortest path in unweighted graphs. Also used for level-order tree traversal and multi-source BFS (e.g., rotting oranges).",
    "when": [
      "Shortest path in an unweighted graph",
      "Level-order traversal of a tree",
      "Minimum steps/moves to reach a target state",
      "'Spreading' problems: fire, infection, multi-source",
      "Keywords: 'shortest', 'minimum steps', 'nearest', 'level by level'"
    ],
    "approach": [
      "1. Initialize queue with starting node(s), mark as visited",
      "2. Process level by level (track depth if needed)",
      "3. For each node: explore all neighbors, enqueue unvisited ones",
      "4. Stop when target found or queue empty",
      "5. For multi-source BFS: start with ALL sources in the queue"
    ],
    "skeleton": "from collections import deque\n\ndef bfs(graph, start, target):\n    \"\"\"Standard BFS — shortest path in unweighted graph.\"\"\"\n    queue = deque([(start, 0)])  # (node, distance)\n    visited = {start}\n\n    while queue:\n        node, dist = queue.popleft()\n        if node == target:\n            return dist\n\n        for neighbor in graph[node]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append((neighbor, dist + 1))\n\n    return -1  # target not reachable\n\n\ndef bfs_level_order(root):\n    \"\"\"Level-order traversal of a tree.\"\"\"\n    if not root:\n        return []\n    result = []\n    queue = deque([root])\n    while queue:\n        level = []\n        for _ in range(len(queue)):  # process entire level\n            node = queue.popleft()\n            level.append(node.val)\n            if node.left:\n                queue.append(node.left)\n            if node.right:\n                queue.append(node.right)\n        result.append(level)\n    return result\n\n\ndef bfs_matrix(grid, starts):\n    \"\"\"Multi-source BFS on a matrix.\"\"\"\n    rows, cols = len(grid), len(grid[0])\n    queue = deque()\n    visited = set()\n    for r, c in starts:\n        queue.append((r, c, 0))\n        visited.add((r, c))\n\n    while queue:\n        r, c, dist = queue.popleft()\n        for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:\n            nr, nc = r + dr, c + dc\n            if 0 <= nr < rows and 0 <= nc < cols and (nr,nc) not in visited:\n                if grid[nr][nc] == valid:\n                    visited.add((nr, nc))\n                    queue.append((nr, nc, dist + 1))",
    "time": "O(V + E) for graphs, O(m*n) for matrices",
    "space": "O(V) for the queue and visited set",
    "pitfalls": [
      "Forgetting to mark nodes as visited BEFORE enqueueing (causes duplicates)",
      "Not using deque (list.pop(0) is O(n))",
      "For level-by-level: must snapshot queue size at start of each level"
    ],
    "canonical": [
      "Number of Islands",
      "Rotting Oranges",
      "Word Ladder",
      "Binary Tree Level Order Traversal",
      "01 Matrix"
    ],
    "related": [
      "dfs",
      "dijkstra"
    ],
    "picture": "Ripple in pond",
    "movie": "Queue pops ring by ring",
    "ee": "Voltage wavefront on a resistive mesh — equal-cost rings.",
    "href": "patterns.html#bfs"
  },
  {
    "num": 5,
    "id": "dfs",
    "name": "Depth-First Search",
    "category": "traversal",
    "description": "Explore as deep as possible along each branch before backtracking. Uses recursion (call stack) or an explicit stack. Natural fit for tree problems, connected components, cycle detection, and topological sort.",
    "when": [
      "Tree traversal (preorder, inorder, postorder)",
      "Finding connected components in a graph",
      "Cycle detection in directed/undirected graphs",
      "Path finding where you need to explore all possibilities",
      "Problems requiring backtracking after exploration"
    ],
    "approach": [
      "1. Choose recursive or iterative (recursive is usually cleaner for trees)",
      "2. Define: what does visiting a node mean? What do we track/return?",
      "3. Base case: null node, visited node, or boundary condition",
      "4. Recursive case: process current node, recurse on children/neighbors",
      "5. For graphs: maintain a visited set to avoid cycles"
    ],
    "skeleton": "def dfs_tree(root):\n    \"\"\"DFS on a binary tree (recursive).\"\"\"\n    if not root:\n        return  # base case\n\n    # Preorder: process BEFORE children\n    process(root)\n    dfs_tree(root.left)\n    dfs_tree(root.right)\n\n    # Inorder: process BETWEEN children (BST gives sorted order)\n    # dfs_tree(root.left)\n    # process(root)\n    # dfs_tree(root.right)\n\n    # Postorder: process AFTER children (useful for bottom-up)\n    # dfs_tree(root.left)\n    # dfs_tree(root.right)\n    # process(root)\n\n\ndef dfs_graph(graph, start):\n    \"\"\"DFS on a graph (iterative with stack).\"\"\"\n    stack = [start]\n    visited = {start}\n    while stack:\n        node = stack.pop()\n        process(node)\n        for neighbor in graph[node]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                stack.append(neighbor)\n\n\ndef dfs_matrix(grid, r, c, visited):\n    \"\"\"DFS on a matrix (recursive, e.g., flood fill).\"\"\"\n    if (r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0])\n            or (r, c) in visited or grid[r][c] == 0):\n        return\n    visited.add((r, c))\n    for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:\n        dfs_matrix(grid, r + dr, c + dc, visited)",
    "time": "O(V + E) for graphs, O(n) for trees",
    "space": "O(h) for trees (h=height), O(V) for graphs",
    "pitfalls": [
      "Stack overflow on deep recursion (Python default limit ~1000)",
      "For directed graphs: need 3-state visited (unvisited, in-progress, done) for cycle detection",
      "Forgetting to un-visit in backtracking problems (DFS != backtracking)"
    ],
    "canonical": [
      "Number of Islands",
      "Max Depth of Binary Tree",
      "Validate BST",
      "Lowest Common Ancestor",
      "Clone Graph"
    ],
    "related": [
      "bfs",
      "backtracking",
      "topological_sort"
    ],
    "picture": "Depth probe / stack of frames",
    "movie": "Recurse then backtrack",
    "ee": "Depth-first probe of a netlist / call stack.",
    "href": "patterns.html#dfs"
  },
  {
    "num": 6,
    "id": "topological_sort",
    "name": "Topological Sort",
    "category": "technique",
    "description": "Linear ordering of vertices in a DAG such that for every edge u->v, u comes before v. If a cycle exists, no valid ordering is possible. Two approaches: Kahn's algorithm (BFS with in-degree) and DFS post-order.",
    "when": [
      "Tasks/courses with prerequisites (dependency ordering)",
      "Build system: compile order",
      "Detecting cycles in directed graphs",
      "Any problem asking for a valid ordering respecting dependencies",
      "Keywords: 'prerequisite', 'dependency', 'ordering', 'schedule', 'before/after'"
    ],
    "approach": [
      "1. Build adjacency list and compute in-degree for each node",
      "2. Kahn's: enqueue all nodes with in-degree 0",
      "3. Process queue: for each node, reduce in-degree of neighbors",
      "4. If neighbor's in-degree becomes 0, enqueue it",
      "5. If result has fewer nodes than total, there's a cycle"
    ],
    "skeleton": "from collections import deque, defaultdict\n\ndef topological_sort_kahn(num_nodes, edges):\n    \"\"\"Kahn's algorithm (BFS-based). Returns order or [] if cycle.\"\"\"\n    graph = defaultdict(list)\n    in_degree = [0] * num_nodes\n\n    for u, v in edges:  # u must come before v\n        graph[u].append(v)\n        in_degree[v] += 1\n\n    queue = deque(i for i in range(num_nodes) if in_degree[i] == 0)\n    order = []\n\n    while queue:\n        node = queue.popleft()\n        order.append(node)\n        for neighbor in graph[node]:\n            in_degree[neighbor] -= 1\n            if in_degree[neighbor] == 0:\n                queue.append(neighbor)\n\n    return order if len(order) == num_nodes else []  # [] = cycle\n\n\ndef topological_sort_dfs(num_nodes, edges):\n    \"\"\"DFS-based topological sort with cycle detection.\"\"\"\n    graph = defaultdict(list)\n    for u, v in edges:\n        graph[u].append(v)\n\n    WHITE, GRAY, BLACK = 0, 1, 2\n    color = [WHITE] * num_nodes\n    order = []\n\n    def dfs(node):\n        color[node] = GRAY  # in current path\n        for neighbor in graph[node]:\n            if color[neighbor] == GRAY:\n                return False  # cycle!\n            if color[neighbor] == WHITE and not dfs(neighbor):\n                return False\n        color[node] = BLACK  # fully processed\n        order.append(node)   # post-order\n        return True\n\n    for i in range(num_nodes):\n        if color[i] == WHITE and not dfs(i):\n            return []  # cycle\n\n    return order[::-1]  # reverse post-order",
    "time": "O(V + E)",
    "space": "O(V + E)",
    "pitfalls": [
      "Confusing edge direction: 'A is prerequisite of B' means edge A->B",
      "Not handling disconnected components (must start from ALL zero-in-degree nodes)",
      "DFS version: must use 3-state (not just visited bool) for cycle detection in directed graphs"
    ],
    "canonical": [
      "Course Schedule",
      "Course Schedule II",
      "Alien Dictionary",
      "Parallel Courses",
      "Minimum Height Trees"
    ],
    "related": [
      "dfs",
      "bfs"
    ],
    "picture": "Assembly line prerequisites",
    "movie": "Peel indegree-0 nodes",
    "ee": "Build order with dependencies; peel ready components.",
    "href": "patterns.html#topological_sort"
  },
  {
    "num": 7,
    "id": "dp",
    "name": "Dynamic Programming",
    "category": "optimization",
    "description": "Break a problem into overlapping subproblems, solve each once, and store the results. The key is defining the state (what dp[i] or dp[i][j] represents) and the recurrence (how to compute it from smaller states). Bottom-up (tabulation) or top-down (memoization) — same idea, different direction.",
    "when": [
      "Optimal value: 'minimum cost', 'maximum profit', 'number of ways'",
      "Problem has overlapping subproblems (same computation repeated)",
      "Problem has optimal substructure (optimal solution contains optimal sub-solutions)",
      "Decision at each step: take it or skip it",
      "Cannot use greedy (local optimal != global optimal)"
    ],
    "approach": [
      "1. Define the state: what does dp[i] (or dp[i][j]) represent?",
      "   - Be precise: 'dp[i] = max profit using items 0..i' vs 'ending at i'",
      "2. Write the recurrence relation BEFORE coding",
      "   - What choices do I have at state i?",
      "   - dp[i] = best of (choice 1 result, choice 2 result, ...)",
      "3. Identify base cases: dp[0], dp[0][0], etc."
    ],
    "skeleton": "def dp_1d(nums):\n    \"\"\"1D DP template (e.g., house robber, climbing stairs).\"\"\"\n    n = len(nums)\n    if n == 0:\n        return 0\n    dp = [0] * n\n    dp[0] = nums[0]                    # base case\n    dp[1] = max(nums[0], nums[1])      # base case (problem-specific)\n\n    for i in range(2, n):\n        dp[i] = max(\n            dp[i-1],              # skip current\n            dp[i-2] + nums[i],   # take current\n        )\n    return dp[-1]\n\n\ndef dp_2d(text1, text2):\n    \"\"\"2D DP template (e.g., LCS, edit distance).\"\"\"\n    m, n = len(text1), len(text2)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if text1[i-1] == text2[j-1]:\n                dp[i][j] = dp[i-1][j-1] + 1\n            else:\n                dp[i][j] = max(dp[i-1][j], dp[i][j-1])\n\n    return dp[m][n]\n\n\ndef dp_knapsack(weights, values, capacity):\n    \"\"\"0/1 Knapsack template.\"\"\"\n    n = len(weights)\n    dp = [[0] * (capacity + 1) for _ in range(n + 1)]\n\n    for i in range(1, n + 1):\n        for w in range(capacity + 1):\n            dp[i][w] = dp[i-1][w]  # skip item i\n            if weights[i-1] <= w:\n                dp[i][w] = max(dp[i][w], dp[i-1][w - weights[i-1]] + values[i-1])\n\n    return dp[n][capacity]",
    "time": "O(n) to O(n^2) to O(n*W) depending on dimensions",
    "space": "Often optimizable: 2D -> 1D (rolling array), 1D -> O(1)",
    "pitfalls": [
      "Imprecise state definition leads to wrong recurrence",
      "Wrong base cases (especially off-by-one with 0-indexed vs 1-indexed dp)",
      "Not considering all choices at each state",
      "Confusing 'ending at i' vs 'using elements 0..i' — different recurrences!"
    ],
    "canonical": [
      "Climbing Stairs",
      "House Robber",
      "Coin Change",
      "Longest Increasing Subsequence",
      "Edit Distance"
    ],
    "related": [
      "greedy",
      "memoization"
    ],
    "picture": "Filled table / flip-flops",
    "movie": "Write cell from neighbors",
    "ee": "Latch bank: each cell stores what futures need.",
    "href": "patterns.html#dp"
  },
  {
    "num": 8,
    "id": "greedy",
    "name": "Greedy",
    "category": "optimization",
    "description": "Make the locally optimal choice at each step, hoping it leads to the globally optimal solution. Only works when the greedy choice property holds: a locally optimal choice never needs to be reconsidered. Often requires sorting first. When in doubt, try DP instead.",
    "when": [
      "Interval scheduling: select non-overlapping intervals",
      "Choosing the best option at each step provably works",
      "Problem involves sorting + sequential selection",
      "Activity selection, job scheduling with deadlines",
      "Keywords: 'minimum number of', 'maximum number of non-overlapping'"
    ],
    "approach": [
      "1. Sort the input (by start time, end time, ratio, etc.)",
      "2. Iterate and make the greedy choice at each step",
      "3. PROVE it works: exchange argument or greedy stays ahead",
      "4. If you can't prove it, consider DP instead"
    ],
    "skeleton": "def greedy_intervals(intervals):\n    \"\"\"Select maximum non-overlapping intervals.\"\"\"\n    intervals.sort(key=lambda x: x[1])  # sort by END time\n    count = 0\n    last_end = float('-inf')\n\n    for start, end in intervals:\n        if start >= last_end:\n            count += 1\n            last_end = end\n\n    return count\n\n\ndef greedy_jump_game(nums):\n    \"\"\"Minimum jumps to reach end (BFS-level greedy).\"\"\"\n    jumps = 0\n    current_end = 0\n    farthest = 0\n\n    for i in range(len(nums) - 1):\n        farthest = max(farthest, i + nums[i])\n        if i == current_end:\n            jumps += 1\n            current_end = farthest\n\n    return jumps",
    "time": "O(n log n) due to sorting, O(n) for the greedy pass",
    "space": "O(1) extra (excluding sort space)",
    "pitfalls": [
      "Assuming greedy works without proof — many problems look greedy but need DP",
      "Sorting by the wrong key (start time vs end time matters!)",
      "Not handling ties correctly"
    ],
    "canonical": [
      "Jump Game",
      "Jump Game II",
      "Non-overlapping Intervals",
      "Merge Intervals",
      "Task Scheduler"
    ],
    "related": [
      "dp",
      "sorting"
    ],
    "picture": "Always take proven local pick",
    "movie": "Sort key then choose",
    "ee": "Local optimum with an exchange argument — like earliest-deadline scheduling.",
    "href": "patterns.html#greedy"
  },
  {
    "num": 9,
    "id": "backtracking",
    "name": "Backtracking",
    "category": "technique",
    "description": "Systematically explore all candidates for a solution by building choices incrementally and abandoning a path ('backtracking') as soon as it's determined to be invalid. Think of it as DFS on a decision tree with pruning.",
    "when": [
      "Generate all permutations, combinations, or subsets",
      "Find all valid configurations (N-Queens, Sudoku)",
      "Word search in a grid",
      "Constraint satisfaction problems",
      "Keywords: 'all possible', 'generate all', 'find all valid', 'enumerate'"
    ],
    "approach": [
      "1. Define the decision tree: what choices exist at each step?",
      "2. Template: choose -> explore -> un-choose",
      "3. Base case: when is a candidate a complete solution?",
      "4. Pruning: when can you skip an entire branch?",
      "5. Track state: what gets modified and needs to be restored?"
    ],
    "skeleton": "def backtrack(candidates, target):\n    \"\"\"General backtracking template.\"\"\"\n    result = []\n\n    def helper(start, current, remaining):\n        # Base case: found a valid solution\n        if is_solution(current, remaining):\n            result.append(current[:])  # copy!\n            return\n\n        # Pruning: no valid solution possible from here\n        if not is_valid(current, remaining):\n            return\n\n        for i in range(start, len(candidates)):\n            # Skip duplicates (if candidates is sorted)\n            if i > start and candidates[i] == candidates[i-1]:\n                continue\n\n            # Choose\n            current.append(candidates[i])\n\n            # Explore (i+1 for combinations, i for reuse, 0 for permutations)\n            helper(i + 1, current, remaining - candidates[i])\n\n            # Un-choose (backtrack)\n            current.pop()\n\n    helper(0, [], target)\n    return result\n\n\ndef backtrack_grid(board, word):\n    \"\"\"Backtracking on a grid (word search).\"\"\"\n    rows, cols = len(board), len(board[0])\n\n    def dfs(r, c, idx):\n        if idx == len(word):\n            return True\n        if (r < 0 or r >= rows or c < 0 or c >= cols\n                or board[r][c] != word[idx]):\n            return False\n\n        temp = board[r][c]\n        board[r][c] = '#'  # mark visited\n\n        found = any(\n            dfs(r+dr, c+dc, idx+1)\n            for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]\n        )\n\n        board[r][c] = temp  # un-mark (backtrack)\n        return found\n\n    return any(dfs(r, c, 0) for r in range(rows) for c in range(cols))",
    "time": "O(2^n) for subsets, O(n!) for permutations — exponential",
    "space": "O(n) for recursion depth + solution storage",
    "pitfalls": [
      "Forgetting to make a copy when adding to results (current[:] not current)",
      "Forgetting to un-choose (restore state after recursive call)",
      "Not pruning — backtracking without pruning is just brute force",
      "Handling duplicates: sort input + skip if candidates[i] == candidates[i-1]"
    ],
    "canonical": [
      "Subsets",
      "Permutations",
      "Combination Sum",
      "N-Queens",
      "Word Search"
    ],
    "related": [
      "dfs",
      "recursion"
    ],
    "picture": "Decision tree maze",
    "movie": "Choose explore unchoose",
    "ee": "Explore configuration space; undo partial assignments.",
    "href": "patterns.html#backtracking"
  },
  {
    "num": 10,
    "id": "heap",
    "name": "Heap / Priority Queue",
    "category": "structure",
    "description": "A data structure that efficiently supports: insert O(log n), extract-min/max O(log n), peek O(1). Use when you repeatedly need the smallest or largest element from a dynamic collection.",
    "when": [
      "Find the K-th largest/smallest element",
      "Merge K sorted lists/streams",
      "Streaming median (two-heap technique)",
      "Repeatedly process the highest/lowest priority item",
      "Dijkstra's shortest path (min-heap of distances)"
    ],
    "approach": [
      "1. Identify: do you need min or max? (Python heapq is min-heap only)",
      "2. For max-heap in Python: negate values",
      "3. For K-th largest: maintain a min-heap of size K",
      "4. For streaming median: two heaps (max-heap for lower, min-heap for upper)",
      "5. For K-way merge: push first element of each list, pop-and-push-next"
    ],
    "skeleton": "import heapq\n\ndef top_k_frequent(nums, k):\n    \"\"\"Find K most frequent elements.\"\"\"\n    counts = Counter(nums)\n    # Min-heap of size k (negate for max behavior)\n    return heapq.nlargest(k, counts.keys(), key=counts.get)\n\n\ndef merge_k_sorted(lists):\n    \"\"\"Merge K sorted lists using a heap.\"\"\"\n    heap = []\n    for i, lst in enumerate(lists):\n        if lst:\n            heapq.heappush(heap, (lst[0], i, 0))\n\n    result = []\n    while heap:\n        val, list_idx, elem_idx = heapq.heappop(heap)\n        result.append(val)\n        if elem_idx + 1 < len(lists[list_idx]):\n            next_val = lists[list_idx][elem_idx + 1]\n            heapq.heappush(heap, (next_val, list_idx, elem_idx + 1))\n\n    return result\n\n\ndef running_median(nums):\n    \"\"\"Two-heap streaming median.\"\"\"\n    lo = []  # max-heap (negated) for lower half\n    hi = []  # min-heap for upper half\n    medians = []\n\n    for num in nums:\n        heapq.heappush(lo, -num)\n\n        # Balance: lo's max <= hi's min\n        heapq.heappush(hi, -heapq.heappop(lo))\n\n        # Size: lo can have at most 1 more than hi\n        if len(hi) > len(lo):\n            heapq.heappush(lo, -heapq.heappop(hi))\n\n        if len(lo) > len(hi):\n            medians.append(-lo[0])\n        else:\n            medians.append((-lo[0] + hi[0]) / 2)\n\n    return medians",
    "time": "O(log n) per push/pop, O(n log k) for top-K of n elements",
    "space": "O(k) for top-K, O(n) for streaming median",
    "pitfalls": [
      "Python heapq is min-heap only — negate for max-heap",
      "Comparing tuples: if first elements tie, Python compares second — can crash on non-comparable objects",
      "Solution: use (value, unique_counter, object) tuples"
    ],
    "canonical": [
      "Kth Largest Element",
      "Top K Frequent Elements",
      "Merge K Sorted Lists",
      "Find Median from Data Stream",
      "K Closest Points to Origin"
    ],
    "related": [
      "sorting",
      "binary_search"
    ],
    "picture": "Tournament ladder",
    "movie": "Extract min/max repeatedly",
    "ee": "Priority queue like a interrupt priority ladder.",
    "href": "patterns.html#heap"
  },
  {
    "num": 11,
    "id": "monotonic_stack",
    "name": "Monotonic Stack",
    "category": "structure",
    "description": "A stack that maintains elements in strictly increasing or decreasing order. When a new element violates the order, pop elements until the invariant is restored. The popped elements have found their 'answer' (next greater/smaller). Converts O(n^2) brute force to O(n).",
    "when": [
      "'Next greater element' or 'next smaller element'",
      "'Previous greater/smaller element'",
      "Largest rectangle in histogram",
      "Stock span, daily temperatures",
      "Keywords: 'next greater', 'next smaller', 'span', 'rectangle', 'histogram'"
    ],
    "approach": [
      "1. Decide: monotonic increasing or decreasing?",
      "   - For 'next greater': use decreasing stack (pop when new > top)",
      "   - For 'next smaller': use increasing stack (pop when new < top)",
      "2. Iterate through elements",
      "3. While stack is non-empty and current element violates monotonicity:",
      "   - Pop: the popped element's 'answer' is the current element"
    ],
    "skeleton": "def next_greater_element(nums):\n    \"\"\"For each element, find the next greater element to its right.\"\"\"\n    n = len(nums)\n    result = [-1] * n\n    stack = []  # stores indices, maintains decreasing values\n\n    for i in range(n):\n        while stack and nums[stack[-1]] < nums[i]:\n            idx = stack.pop()\n            result[idx] = nums[i]  # nums[i] is the next greater for nums[idx]\n        stack.append(i)\n\n    return result\n\n\ndef largest_rectangle_histogram(heights):\n    \"\"\"Largest rectangle in histogram using monotonic stack.\"\"\"\n    stack = []  # stores indices, maintains increasing heights\n    max_area = 0\n    heights.append(0)  # sentinel to flush remaining\n\n    for i, h in enumerate(heights):\n        while stack and heights[stack[-1]] > h:\n            height = heights[stack.pop()]\n            width = i if not stack else i - stack[-1] - 1\n            max_area = max(max_area, height * width)\n        stack.append(i)\n\n    heights.pop()  # remove sentinel\n    return max_area",
    "time": "O(n) — each element pushed and popped at most once",
    "space": "O(n) for the stack",
    "pitfalls": [
      "Confusing increasing vs decreasing stack — think about what you're looking for",
      "Forgetting the sentinel value to flush remaining stack elements",
      "Width calculation in histogram: i - stack[-1] - 1 (not i - popped_index)"
    ],
    "canonical": [
      "Daily Temperatures",
      "Next Greater Element I & II",
      "Largest Rectangle in Histogram",
      "Maximal Rectangle",
      "Stock Span Problem"
    ],
    "related": [
      "stack"
    ],
    "picture": "Skyline / histogram bars",
    "movie": "Pop while order breaks",
    "ee": "Keep candidates in order like a decreasing voltage envelope.",
    "href": "patterns.html#monotonic_stack"
  },
  {
    "num": 12,
    "id": "union_find",
    "name": "Union Find (Disjoint Set)",
    "category": "structure",
    "description": "Data structure to track elements partitioned into disjoint sets. Supports near-O(1) union and find operations with path compression and union by rank. Use when you need to dynamically merge groups and check if elements belong to the same group.",
    "when": [
      "Dynamic connectivity: 'are A and B connected?'",
      "Merge groups/components incrementally",
      "Count number of connected components",
      "Kruskal's MST algorithm",
      "Keywords: 'connected', 'union', 'merge', 'group', 'component', 'same set'"
    ],
    "approach": [
      "1. Initialize: each element is its own parent (parent[i] = i)",
      "2. Find: follow parent pointers to root, apply path compression",
      "3. Union: find roots of both elements, merge smaller into larger (by rank)",
      "4. Track component count: decrement on each successful union"
    ],
    "skeleton": "class UnionFind:\n    def __init__(self, n):\n        self.parent = list(range(n))\n        self.rank = [0] * n\n        self.components = n\n\n    def find(self, x):\n        \"\"\"Find root with path compression.\"\"\"\n        if self.parent[x] != x:\n            self.parent[x] = self.find(self.parent[x])\n        return self.parent[x]\n\n    def union(self, x, y):\n        \"\"\"Union by rank. Returns True if they were in different sets.\"\"\"\n        px, py = self.find(x), self.find(y)\n        if px == py:\n            return False\n        if self.rank[px] < self.rank[py]:\n            px, py = py, px\n        self.parent[py] = px\n        if self.rank[px] == self.rank[py]:\n            self.rank[px] += 1\n        self.components -= 1\n        return True\n\n    def connected(self, x, y):\n        return self.find(x) == self.find(y)",
    "time": "O(alpha(n)) per operation — effectively O(1)",
    "space": "O(n)",
    "pitfalls": [
      "Forgetting path compression (makes find O(n) instead of O(alpha(n)))",
      "Using union by rank OR size, not both — pick one",
      "For string/object keys: use a dict instead of list for parent"
    ],
    "canonical": [
      "Number of Connected Components",
      "Redundant Connection",
      "Accounts Merge",
      "Longest Consecutive Sequence",
      "Graph Valid Tree"
    ],
    "related": [
      "bfs",
      "dfs"
    ],
    "picture": "Forest of rooted trees",
    "movie": "Compress path on find",
    "ee": "Equivalence classes / connected copper pours merging.",
    "href": "patterns.html#union_find"
  },
  {
    "num": 13,
    "id": "trie",
    "name": "Trie (Prefix Tree)",
    "category": "structure",
    "description": "Tree structure where each node represents a character and paths from root to nodes spell prefixes. Enables O(L) lookup/insert where L is word length, regardless of dictionary size. Essential for prefix-based operations.",
    "when": [
      "Prefix matching: autocomplete, type-ahead search",
      "Word dictionary with prefix queries",
      "Word search on a board (combine trie with DFS)",
      "Longest common prefix",
      "Keywords: 'prefix', 'dictionary', 'word search', 'autocomplete'"
    ],
    "approach": [
      "1. Build trie: for each word, walk/create nodes character by character",
      "2. Mark end-of-word nodes (is_end = True)",
      "3. Search: walk the trie following character path",
      "4. Prefix search: same as search but don't require is_end",
      "5. For board problems: DFS from each cell, following trie paths"
    ],
    "skeleton": "class TrieNode:\n    def __init__(self):\n        self.children = {}   # char -> TrieNode\n        self.is_end = False\n        self.word = None     # optional: store full word at end nodes\n\n\nclass Trie:\n    def __init__(self):\n        self.root = TrieNode()\n\n    def insert(self, word):\n        node = self.root\n        for char in word:\n            if char not in node.children:\n                node.children[char] = TrieNode()\n            node = node.children[char]\n        node.is_end = True\n        node.word = word\n\n    def search(self, word):\n        node = self._find_node(word)\n        return node is not None and node.is_end\n\n    def starts_with(self, prefix):\n        return self._find_node(prefix) is not None\n\n    def _find_node(self, prefix):\n        node = self.root\n        for char in prefix:\n            if char not in node.children:\n                return None\n            node = node.children[char]\n        return node",
    "time": "O(L) per operation where L is word/prefix length",
    "space": "O(total characters across all words)",
    "pitfalls": [
      "Memory-heavy: each node has a dict of children",
      "For board problems: prune trie after finding words to avoid duplicates",
      "Don't confuse search (exact match) with starts_with (prefix match)"
    ],
    "canonical": [
      "Implement Trie",
      "Word Search II",
      "Design Add and Search Words",
      "Search Suggestions System",
      "Longest Word in Dictionary"
    ],
    "related": [
      "backtracking",
      "dfs"
    ],
    "picture": "Shared prefix bookshelf",
    "movie": "Walk char edges",
    "ee": "Shared address decoder prefixes.",
    "href": "patterns.html#trie"
  },
  {
    "num": 14,
    "id": "prefix_sum",
    "name": "Prefix Sum / Cumulative Sum",
    "category": "technique",
    "description": "Precompute cumulative sums so that any subarray sum can be computed in O(1). prefix[i] = sum(arr[0..i-1]). Then sum(arr[l..r]) = prefix[r+1] - prefix[l]. Extends to 2D (prefix rectangles) and to frequency/XOR/product.",
    "when": [
      "Multiple subarray sum queries",
      "'Number of subarrays with sum equal to K'",
      "Range sum queries after preprocessing",
      "Subarray sum divisible by K",
      "Keywords: 'subarray sum', 'range sum', 'cumulative'"
    ],
    "approach": [
      "1. Build prefix array: prefix[0] = 0, prefix[i] = prefix[i-1] + arr[i-1]",
      "2. Subarray sum [l, r] = prefix[r+1] - prefix[l]",
      "3. For 'count subarrays with sum K': use hash map of prefix sums",
      "   - If prefix[j] - prefix[i] = K, then prefix[i] = prefix[j] - K",
      "   - Count how many previous prefix sums equal prefix[j] - K"
    ],
    "skeleton": "def subarray_sum_equals_k(nums, k):\n    \"\"\"Count subarrays with sum exactly k using prefix sum + hash map.\"\"\"\n    count = 0\n    prefix_sum = 0\n    seen = {0: 1}  # prefix_sum -> count of occurrences\n\n    for num in nums:\n        prefix_sum += num\n        # If (prefix_sum - k) was seen before, those are valid subarrays\n        count += seen.get(prefix_sum - k, 0)\n        seen[prefix_sum] = seen.get(prefix_sum, 0) + 1\n\n    return count\n\n\ndef range_sum_query(nums):\n    \"\"\"Precompute prefix sums for O(1) range queries.\"\"\"\n    prefix = [0] * (len(nums) + 1)\n    for i in range(len(nums)):\n        prefix[i + 1] = prefix[i] + nums[i]\n\n    def query(left, right):\n        \"\"\"Sum of nums[left..right] inclusive.\"\"\"\n        return prefix[right + 1] - prefix[left]\n\n    return query",
    "time": "O(n) to build, O(1) per query",
    "space": "O(n) for the prefix array",
    "pitfalls": [
      "Off-by-one: prefix has n+1 elements, prefix[0] = 0",
      "For 'sum equals K': initialize hash map with {0: 1} (empty prefix)",
      "Doesn't work for subarray product (use prefix product or log trick)"
    ],
    "canonical": [
      "Subarray Sum Equals K",
      "Range Sum Query",
      "Contiguous Array (binary: 0/1)",
      "Product of Array Except Self",
      "Subarray Sum Divisible by K"
    ],
    "related": [
      "hash_map",
      "sliding_window"
    ],
    "picture": "Running integral of a signal",
    "movie": "Range = two lookups",
    "ee": "Discrete integrator; window = difference of integrals.",
    "href": "patterns.html#prefix_sum"
  },
  {
    "num": 15,
    "id": "hash_map",
    "name": "Hash Map Patterns",
    "category": "structure",
    "description": "Use hash maps (dicts) for O(1) lookup/insert to replace O(n) scans. This isn't just 'use a dict' — it's recognizing WHEN a hash map transforms the problem. Common patterns: complement lookup, frequency counting, grouping, and caching.",
    "when": [
      "Need O(1) lookup: 'have I seen this before?'",
      "Two Sum pattern: find complement in O(1)",
      "Frequency counting: most/least frequent, anagram detection",
      "Grouping: group by key (anagrams, same pattern)",
      "Caching previous results (memoization)"
    ],
    "approach": [
      "1. Identify what to store: element -> index, element -> count, pattern -> group",
      "2. Single-pass when possible: check then insert (Two Sum pattern)",
      "3. For frequency: Counter or defaultdict(int)",
      "4. For grouping: defaultdict(list), key = canonical form"
    ],
    "skeleton": "from collections import Counter, defaultdict\n\ndef two_sum(nums, target):\n    \"\"\"Find pair summing to target in O(n).\"\"\"\n    seen = {}  # value -> index\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n\n\ndef group_anagrams(strs):\n    \"\"\"Group strings that are anagrams of each other.\"\"\"\n    groups = defaultdict(list)\n    for s in strs:\n        key = tuple(sorted(s))  # canonical form\n        groups[key].append(s)\n    return list(groups.values())\n\n\ndef frequency_pattern(nums, k):\n    \"\"\"Count elements appearing exactly k times.\"\"\"\n    counts = Counter(nums)\n    return sum(1 for c in counts.values() if c == k)",
    "time": "O(n) for single-pass patterns",
    "space": "O(n) for the hash map",
    "pitfalls": [
      "Hash collisions in theory, but Python dicts handle this well",
      "Mutable objects (lists) can't be dict keys — convert to tuples",
      "For sliding window + hash map: remember to decrement/remove when shrinking"
    ],
    "canonical": [
      "Two Sum",
      "Group Anagrams",
      "Valid Anagram",
      "Longest Consecutive Sequence",
      "Subarray Sum Equals K"
    ],
    "related": [
      "sliding_window",
      "prefix_sum"
    ],
    "picture": "Address decoder / pigeonholes",
    "movie": "Store then look up complement",
    "ee": "Content-addressable lookup in average O(1).",
    "href": "patterns.html#hash_map"
  },
  {
    "num": 16,
    "id": "dijkstra",
    "name": "Dijkstra's Shortest Path",
    "category": "technique",
    "description": "Find shortest paths from a source to all nodes in a weighted graph with non-negative edge weights. Uses a min-heap to always process the nearest unvisited node. Greedy approach that works because non-negative weights guarantee no shorter path through unvisited nodes.",
    "when": [
      "Shortest path in a weighted graph (non-negative weights)",
      "Minimum cost to reach a destination",
      "Network delay time, cheapest flights",
      "Keywords: 'shortest path', 'minimum cost', 'weighted graph'",
      "NOT for negative weights (use Bellman-Ford instead)"
    ],
    "approach": [
      "1. Initialize distances: dist[source] = 0, all others = infinity",
      "2. Push (0, source) to min-heap",
      "3. Pop minimum distance node from heap",
      "4. If already visited with shorter distance, skip (lazy deletion)",
      "5. For each neighbor: if new distance < known distance, update and push"
    ],
    "skeleton": "import heapq\nfrom collections import defaultdict\n\ndef dijkstra(graph, source, target):\n    \"\"\"Shortest path in weighted graph with non-negative edges.\n    graph: {node: [(neighbor, weight), ...]}\n    \"\"\"\n    dist = defaultdict(lambda: float('inf'))\n    dist[source] = 0\n    heap = [(0, source)]\n\n    while heap:\n        d, node = heapq.heappop(heap)\n\n        if node == target:\n            return d\n\n        if d > dist[node]:\n            continue  # stale entry, skip\n\n        for neighbor, weight in graph[node]:\n            new_dist = d + weight\n            if new_dist < dist[neighbor]:\n                dist[neighbor] = new_dist\n                heapq.heappush(heap, (new_dist, neighbor))\n\n    return dist[target]  # or -1 if unreachable",
    "time": "O((V + E) log V) with binary heap",
    "space": "O(V + E)",
    "pitfalls": [
      "Doesn't work with negative edge weights",
      "Must use lazy deletion (skip stale heap entries) for correctness",
      "Don't confuse with BFS — BFS is for unweighted, Dijkstra for weighted"
    ],
    "canonical": [
      "Network Delay Time",
      "Cheapest Flights Within K Stops",
      "Path with Minimum Effort",
      "Swim in Rising Water",
      "Shortest Path in Binary Matrix (if weighted)"
    ],
    "related": [
      "bfs",
      "heap"
    ],
    "picture": "Priority wavefront",
    "movie": "Expand cheapest unsettled",
    "ee": "Priority expansion like Dijkstra routing / least-cost path.",
    "href": "patterns.html#dijkstra"
  },
  {
    "num": 17,
    "id": "binary_search_answer",
    "name": "Binary Search on Answer",
    "category": "optimization",
    "description": "When the answer is a numeric value on a monotone feasibility line (FFF…FTTT…T), binary search the answer space and check a predicate can(mid). Distinct from binary search on a sorted array index.",
    "when": [
      "Minimize/maximize a value subject to a yes/no feasibility check",
      "Koko eating bananas, split array largest sum, capacity to ship packages",
      "Keywords: 'minimum maximum', 'smallest possible', 'allocate / capacity'",
      "Predicate can(x) is monotone: if x works, every y > x also works (or inverse)"
    ],
    "approach": [
      "1. Identify the answer range [lo, hi] (e.g. 1 .. max(nums) or sum(nums))",
      "2. Define can(x): bool — does answer x satisfy constraints?",
      "3. Binary search: if can(mid) try smaller (or larger); else opposite",
      "4. Return the boundary (first True / last False depending on wording)"
    ],
    "skeleton": "def binary_search_answer(lo, hi, can):\n    \"\"\"Find minimal x in [lo, hi] such that can(x) is True (FFFTTT).\"\"\"\n    ans = hi\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if can(mid):\n            ans = mid\n            hi = mid - 1\n        else:\n            lo = mid + 1\n    return ans",
    "time": "O(check · log(answer_range))",
    "space": "O(1) extra besides the check",
    "pitfalls": [
      "Forgetting monotonicity — if can(x) is not monotone, BS is wrong",
      "Off-by-one on first True vs last False",
      "Wrong lo/hi bounds (too tight → miss; too loose → still OK but slower)"
    ],
    "canonical": [
      "Koko Eating Bananas",
      "Split Array Largest Sum",
      "Capacity To Ship Packages",
      "Minimum Time to Complete Trips"
    ],
    "related": [
      "binary_search",
      "greedy"
    ],
    "picture": "Threshold search dial",
    "movie": "can(mid) then discard half",
    "ee": "Binary search a setpoint until feasibility trips.",
    "href": "patterns.html#binary_search_answer"
  },
  {
    "num": 18,
    "id": "sweep_line",
    "name": "Sweep Line / Intervals",
    "category": "technique",
    "description": "Process interval start/end events in sorted order along a line. Track active count or open set to answer overlap, coverage, or resource-concurrency questions. Staff systems analogue: load over time.",
    "when": [
      "Meeting rooms / max concurrent intervals",
      "Merge/insert intervals, skyline, car pooling",
      "Keywords: 'overlap', 'concurrent', 'during the same time'",
      "Need max load on a timeline"
    ],
    "approach": [
      "1. Turn intervals into events: (time, +1 start) / (time, -1 end)",
      "2. Sort events (process ends before starts at same time if closed/open needs care)",
      "3. Scan left→right, maintain running active count; track max",
      "4. Or sort by start and use a min-heap of end times (meeting rooms II)"
    ],
    "skeleton": "def max_concurrent(intervals):\n    \"\"\"Max number of overlapping intervals (half-open friendly).\"\"\"\n    events = []\n    for s, e in intervals:\n        events.append((s, 1))   # start\n        events.append((e, -1))  # end\n    # Sort by time; ends (-1) before starts (+1) at same timestamp\n    events.sort(key=lambda x: (x[0], x[1]))\n    cur = best = 0\n    for _, delta in events:\n        cur += delta\n        best = max(best, cur)\n    return best",
    "time": "O(n log n)",
    "space": "O(n)",
    "pitfalls": [
      "Inclusive vs exclusive endpoints — decide whether end frees before start at same t",
      "Forgetting to sort events",
      "Using merge-intervals when you actually need concurrency count"
    ],
    "canonical": [
      "Meeting Rooms II",
      "Car Pooling",
      "The Skyline Problem",
      "My Calendar II",
      "Minimum Number of Platforms"
    ],
    "related": [
      "greedy",
      "heap",
      "difference_array"
    ],
    "picture": "Oscilloscope timebase",
    "movie": "+1/-1 events scan load",
    "ee": "Rising/falling edges; instantaneous load = running sum.",
    "href": "patterns.html#sweep_line"
  },
  {
    "num": 19,
    "id": "linked_list",
    "name": "Linked List Techniques",
    "category": "structure",
    "description": "Pointer games on singly/doubly linked structures: dummy head, fast/slow (tortoise-hare), reverse, merge, and cycle detection. Small API surface, easy to fumble under pressure — drill until automatic.",
    "when": [
      "Reverse / rotate / reorder a list",
      "Find middle, detect/find cycle (Floyd)",
      "Merge two sorted lists, remove nth from end",
      "Keywords: 'ListNode', 'in-place list', 'O(1) space list'"
    ],
    "approach": [
      "1. Draw nodes; use a dummy head when the head may change",
      "2. Fast/slow: middle (fast=2x), cycle (meet), cycle entrance (reset one pointer)",
      "3. Reverse: prev/cur/next trio — practice until muscle memory",
      "4. Always update next before moving cur"
    ],
    "skeleton": "class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val, self.next = val, next\n\ndef reverse_list(head):\n    prev, cur = None, head\n    while cur:\n        nxt = cur.next\n        cur.next = prev\n        prev, cur = cur, nxt\n    return prev\n\ndef has_cycle(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        if slow is fast:\n            return True\n    return False",
    "time": "O(n)",
    "space": "O(1) for reverse / Floyd",
    "pitfalls": [
      "Losing the next pointer before rewiring",
      "Off-by-one when finding middle of even-length lists",
      "Forgetting dummy head when deleting/changing head"
    ],
    "canonical": [
      "Reverse Linked List",
      "Linked List Cycle",
      "Middle of the Linked List",
      "Merge Two Sorted Lists",
      "Remove Nth Node From End"
    ],
    "related": [
      "two_pointers"
    ],
    "picture": "Rewireable chain of boxes",
    "movie": "prev/cur/nxt or Floyd",
    "ee": "Pointer rewiring — save next before flipping the bus.",
    "href": "patterns.html#linked_list"
  },
  {
    "num": 20,
    "id": "bit_manipulation",
    "name": "Bit Manipulation",
    "category": "technique",
    "description": "Use XOR, masks, and bit tricks for parity, unique elements, subsets, and compact state. Staff value: reasoning about flags, permissions, and compact encodings in protocols/APIs.",
    "when": [
      "Find the single number (others appear twice) → XOR",
      "Subset enumeration with bitmasks (n ≤ 20)",
      "Check/set/clear/toggle flags",
      "Keywords: 'single number', 'bitmask DP', 'power of two'"
    ],
    "approach": [
      "1. XOR: a^a=0, a^0=a — cancel pairs",
      "2. Masks: (x >> k) & 1, x | (1<<k), x & ~(1<<k)",
      "3. n & (n-1) clears lowest set bit; n & -n isolates it",
      "4. Bitmask DP: state as int, iterate submasks"
    ],
    "skeleton": "def single_number(nums):\n    \"\"\"All appear twice except one — XOR everything.\"\"\"\n    x = 0\n    for n in nums:\n        x ^= n\n    return x\n\ndef is_power_of_two(n):\n    return n > 0 and (n & (n - 1)) == 0",
    "time": "O(n) for XOR scan; O(2^n · n) for subset masks",
    "space": "O(1) for XOR",
    "pitfalls": [
      "Sign / two's complement confusion in languages with fixed width",
      "Using bitmasks when n is large (2^n explodes)",
      "Forgetting operator precedence (& vs ==)"
    ],
    "canonical": [
      "Single Number",
      "Number of 1 Bits",
      "Power of Two",
      "Subsets (bitmask)",
      "Counting Bits"
    ],
    "related": [
      "dp",
      "backtracking"
    ],
    "picture": "Register bitfield",
    "movie": "XOR cancels pairs",
    "ee": "Register masks and XOR differential cancel.",
    "href": "patterns.html#bit_manipulation"
  },
  {
    "num": 21,
    "id": "difference_array",
    "name": "Difference Array",
    "category": "technique",
    "description": "The inverse of prefix sums: represent range updates as +val at L and -val at R+1, then rebuild the array with a prefix pass. Staff analogue: batch range configuration changes efficiently.",
    "when": [
      "Many range increment updates, then query the final array",
      "Corporate flight bookings, range addition updates",
      "Keywords: 'add val to all elements from i to j', then read result",
      "Prefer over segment tree when you only need final snapshot after updates"
    ],
    "approach": [
      "1. diff[0..n] zeros (length n+1)",
      "2. For update [L,R] += val: diff[L]+=val; diff[R+1]-=val",
      "3. Reconstruct: a[i] = a[i-1] + diff[i]",
      "4. Optionally combine with prefix sums for range queries after rebuild"
    ],
    "skeleton": "def apply_range_updates(n, updates):\n    \"\"\"updates: list of (L, R, val) inclusive. Return final array length n.\"\"\"\n    diff = [0] * (n + 1)\n    for L, R, val in updates:\n        diff[L] += val\n        if R + 1 < len(diff):\n            diff[R + 1] -= val\n    out = [0] * n\n    run = 0\n    for i in range(n):\n        run += diff[i]\n        out[i] = run\n    return out",
    "time": "O(n + u) for u updates",
    "space": "O(n)",
    "pitfalls": [
      "Off-by-one on R+1",
      "Using difference array when you need dynamic point queries mid-stream (use Fenwick/SegTree)",
      "Confusing with prefix sums (reads vs writes)"
    ],
    "canonical": [
      "Range Addition",
      "Corporate Flight Bookings",
      "Car Pooling (can also be sweep)",
      "Pretty Print / calendar paint"
    ],
    "related": [
      "prefix_sum",
      "sweep_line"
    ],
    "picture": "Impulse then integrate",
    "movie": "+val at L, -val at R+1",
    "ee": "Encode step impulses; integrate once to materialize.",
    "href": "patterns.html#difference_array"
  }
];
