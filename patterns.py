"""
Algorithm Pattern Catalog

The core mental models for staff-level algorithm interviews. Each pattern
includes: what it is, when to use it (trigger signals), the template/skeleton,
common variations, complexity profile, and canonical examples.

This module serves as both a reference document and the data source for the
pattern recognition trainer.
"""

from dataclasses import dataclass, field


@dataclass
class PatternVariation:
    name: str
    description: str
    when: str  # when to pick this variation over the base


@dataclass
class Pattern:
    id: str
    name: str
    category: str  # "traversal", "optimization", "structure", "technique"
    description: str
    when_to_use: list[str]  # trigger signals
    approach: list[str]  # step-by-step mental approach
    template: str  # Python code skeleton
    variations: list[PatternVariation] = field(default_factory=list)
    time_complexity: str = ""
    space_complexity: str = ""
    pitfalls: list[str] = field(default_factory=list)
    canonical_problems: list[str] = field(default_factory=list)
    related_patterns: list[str] = field(default_factory=list)


PATTERNS: list[Pattern] = [
    # =========================================================================
    # 1. SLIDING WINDOW
    # =========================================================================
    Pattern(
        id="sliding_window",
        name="Sliding Window",
        category="technique",
        description=(
            "Maintain a window (subarray/substring) that slides across the input. "
            "Instead of recalculating from scratch for each position, update the "
            "window incrementally by adding/removing elements at the edges. "
            "Converts O(n*k) brute force into O(n)."
        ),
        when_to_use=[
            "Problem mentions 'contiguous subarray' or 'substring'",
            "Find max/min/count of something in a subarray of size k",
            "Find smallest/longest subarray satisfying a condition",
            "String problems with character frequency constraints",
            "Keywords: 'consecutive', 'contiguous', 'window', 'substring'",
        ],
        approach=[
            "1. Identify what the window tracks (sum, frequency map, count of valid chars, etc.)",
            "2. Decide: fixed-size window or variable-size window?",
            "   - Fixed: slide right pointer, slide left pointer, both move every step",
            "   - Variable: expand right to satisfy, contract left to minimize/optimize",
            "3. Initialize window state for the first window",
            "4. Slide: update state by adding right element and removing left element",
            "5. At each valid window, update the answer",
        ],
        template='''def sliding_window_variable(arr, condition):
    """Variable-size: find min/max window satisfying condition."""
    left = 0
    best = float('inf')  # or 0 for max
    window_state = ...   # e.g., counter, sum, set

    for right in range(len(arr)):
        # Expand: add arr[right] to window state
        update_state(window_state, arr[right])

        # Contract: shrink from left while window is valid
        while is_valid(window_state, condition):
            best = min(best, right - left + 1)
            # Remove arr[left] from window state
            remove_from_state(window_state, arr[left])
            left += 1

    return best


def sliding_window_fixed(arr, k):
    """Fixed-size window of size k."""
    window_state = ...  # initialize for first k elements

    for i in range(k, len(arr)):
        # Add arr[i], remove arr[i - k]
        update_state(window_state, arr[i], arr[i - k])
        # Check/update answer

    return answer''',
        variations=[
            PatternVariation(
                "Fixed-size window",
                "Window size is given (e.g., 'subarray of size k')",
                "Problem specifies exact window size",
            ),
            PatternVariation(
                "Variable-size window (shrinkable)",
                "Find the min/max window satisfying a constraint",
                "Problem says 'minimum window', 'longest substring with at most K...'",
            ),
            PatternVariation(
                "Window with frequency map",
                "Track character/element counts in the window",
                "String problems with character constraints (anagrams, permutations)",
            ),
        ],
        time_complexity="O(n) — each element enters and leaves the window at most once",
        space_complexity="O(1) or O(k) depending on what the window tracks",
        pitfalls=[
            "Off-by-one on window boundaries (left inclusive, right inclusive vs exclusive)",
            "Forgetting to handle the case where no valid window exists",
            "For variable windows: contracting too early or not enough",
            "Not initializing window state correctly for the first window",
        ],
        canonical_problems=[
            "Longest Substring Without Repeating Characters",
            "Minimum Window Substring",
            "Longest Repeating Character Replacement",
            "Sliding Window Maximum (with deque)",
            "Permutation in String",
            "Subarray Product Less Than K",
        ],
        related_patterns=["two_pointers", "hash_map"],
    ),

    # =========================================================================
    # 2. TWO POINTERS
    # =========================================================================
    Pattern(
        id="two_pointers",
        name="Two Pointers",
        category="technique",
        description=(
            "Use two pointers that move through the data structure in a coordinated way. "
            "Typically one from each end (converging), or both from the start at different "
            "speeds (fast/slow). Reduces nested loops from O(n^2) to O(n)."
        ),
        when_to_use=[
            "Sorted array + find pair with target sum/difference",
            "Remove duplicates or partition in-place",
            "Compare/merge from both ends (palindrome, container problems)",
            "Linked list: cycle detection, find middle, find k-th from end",
            "Keywords: 'pair', 'sorted', 'in-place', 'partition'",
        ],
        approach=[
            "1. Identify the pointer strategy:",
            "   - Opposite ends: left=0, right=n-1, converge based on comparison",
            "   - Same direction: slow and fast, fast advances faster or conditionally",
            "   - Two arrays: pointer per array, advance based on comparison",
            "2. Define the movement rule: when does each pointer advance?",
            "3. Define the termination condition: when do pointers meet/cross?",
            "4. Handle edge cases: empty input, single element, all same elements",
        ],
        template='''def two_pointers_opposite(arr, target):
    """Converging pointers from both ends (requires sorted input)."""
    left, right = 0, len(arr) - 1
    while left < right:
        current = arr[left] + arr[right]
        if current == target:
            return [left, right]
        elif current < target:
            left += 1
        else:
            right -= 1
    return []


def two_pointers_fast_slow(head):
    """Fast/slow pointers for cycle detection (Floyd's)."""
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True  # cycle found
    return False


def two_pointers_partition(arr):
    """Partition/remove in-place."""
    write = 0
    for read in range(len(arr)):
        if should_keep(arr[read]):
            arr[write] = arr[read]
            write += 1
    return write  # new length''',
        variations=[
            PatternVariation(
                "Converging (opposite ends)",
                "Left and right pointers move toward center",
                "Sorted array, pair sum, container/area problems",
            ),
            PatternVariation(
                "Fast/slow (Floyd's cycle)",
                "Two pointers at different speeds from same start",
                "Cycle detection, finding middle of linked list",
            ),
            PatternVariation(
                "Read/write (partition)",
                "Read pointer scans, write pointer tracks valid position",
                "Remove duplicates, move zeros, partition by condition",
            ),
        ],
        time_complexity="O(n) — each pointer traverses at most n elements",
        space_complexity="O(1) — in-place pointer manipulation",
        pitfalls=[
            "Forgetting that converging pointers require sorted input",
            "Infinite loops from not advancing at least one pointer each iteration",
            "Off-by-one: left < right vs left <= right depends on the problem",
        ],
        canonical_problems=[
            "Two Sum II (sorted)", "3Sum", "Container With Most Water",
            "Trapping Rain Water", "Valid Palindrome",
            "Remove Duplicates from Sorted Array", "Move Zeroes",
        ],
        related_patterns=["sliding_window", "binary_search"],
    ),

    # =========================================================================
    # 3. BINARY SEARCH
    # =========================================================================
    Pattern(
        id="binary_search",
        name="Binary Search",
        category="technique",
        description=(
            "Repeatedly halve the search space by checking a condition at the midpoint. "
            "Not just for sorted arrays — works on any monotonic predicate. "
            "The key insight: 'binary search on the answer' applies when you can frame "
            "the problem as 'find the smallest/largest X such that condition(X) is true'."
        ),
        when_to_use=[
            "Sorted array: find element, insertion point, boundary",
            "'Find minimum X that satisfies condition' — binary search on the answer",
            "Problem has O(log n) time requirement",
            "Search space can be halved based on a condition at the midpoint",
            "Keywords: 'sorted', 'minimum/maximum that satisfies', 'O(log n)'",
        ],
        approach=[
            "1. Define the search space: [lo, hi]",
            "2. Define the predicate: condition(mid) -> bool",
            "3. Determine: searching for leftmost True or rightmost True?",
            "4. Choose the right template (see below) to avoid off-by-one",
            "5. Verify: does lo converge to the right answer?",
        ],
        template='''def binary_search_leftmost(arr, target):
    """Find leftmost position where arr[pos] >= target."""
    lo, hi = 0, len(arr)
    while lo < hi:
        mid = (lo + hi) // 2
        if arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return lo  # first index where arr[index] >= target


def binary_search_on_answer(lo, hi, condition):
    """Find the smallest value in [lo, hi] where condition is True.
    Assumes: condition is False for small values, True for large values.
    """
    while lo < hi:
        mid = (lo + hi) // 2
        if condition(mid):
            hi = mid      # mid might be the answer, search left
        else:
            lo = mid + 1  # mid is too small
    return lo


# Example: Koko eating bananas
# condition = lambda speed: can_finish(piles, speed, h)
# answer = binary_search_on_answer(1, max(piles), condition)''',
        variations=[
            PatternVariation(
                "Classic sorted array search",
                "Find exact element or insertion point",
                "Input is sorted, looking for a specific value",
            ),
            PatternVariation(
                "Binary search on the answer",
                "Search over possible answer values, check feasibility",
                "'Minimize the maximum', 'find minimum speed/capacity that works'",
            ),
            PatternVariation(
                "Rotated/modified sorted array",
                "Array was sorted then rotated; identify which half is sorted",
                "Search in rotated sorted array, find minimum in rotated array",
            ),
        ],
        time_complexity="O(log n) — halving the search space each step",
        space_complexity="O(1)",
        pitfalls=[
            "Off-by-one: lo < hi vs lo <= hi — pick one template and stick with it",
            "Integer overflow: use lo + (hi - lo) // 2 instead of (lo + hi) // 2",
            "Infinite loops: ensure lo or hi changes every iteration",
            "Forgetting to handle empty arrays",
        ],
        canonical_problems=[
            "Binary Search", "Search in Rotated Sorted Array",
            "Find Minimum in Rotated Sorted Array",
            "Koko Eating Bananas", "Median of Two Sorted Arrays",
            "Search a 2D Matrix", "Split Array Largest Sum",
        ],
        related_patterns=["two_pointers"],
    ),

    # =========================================================================
    # 4. BFS (Breadth-First Search)
    # =========================================================================
    Pattern(
        id="bfs",
        name="Breadth-First Search",
        category="traversal",
        description=(
            "Explore nodes level by level outward from the source. Uses a queue. "
            "Guarantees shortest path in unweighted graphs. Also used for level-order "
            "tree traversal and multi-source BFS (e.g., rotting oranges)."
        ),
        when_to_use=[
            "Shortest path in an unweighted graph",
            "Level-order traversal of a tree",
            "Minimum steps/moves to reach a target state",
            "'Spreading' problems: fire, infection, multi-source",
            "Keywords: 'shortest', 'minimum steps', 'nearest', 'level by level'",
        ],
        approach=[
            "1. Initialize queue with starting node(s), mark as visited",
            "2. Process level by level (track depth if needed)",
            "3. For each node: explore all neighbors, enqueue unvisited ones",
            "4. Stop when target found or queue empty",
            "5. For multi-source BFS: start with ALL sources in the queue",
        ],
        template='''from collections import deque

def bfs(graph, start, target):
    """Standard BFS — shortest path in unweighted graph."""
    queue = deque([(start, 0)])  # (node, distance)
    visited = {start}

    while queue:
        node, dist = queue.popleft()
        if node == target:
            return dist

        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, dist + 1))

    return -1  # target not reachable


def bfs_level_order(root):
    """Level-order traversal of a tree."""
    if not root:
        return []
    result = []
    queue = deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):  # process entire level
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        result.append(level)
    return result


def bfs_matrix(grid, starts):
    """Multi-source BFS on a matrix."""
    rows, cols = len(grid), len(grid[0])
    queue = deque()
    visited = set()
    for r, c in starts:
        queue.append((r, c, 0))
        visited.add((r, c))

    while queue:
        r, c, dist = queue.popleft()
        for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and (nr,nc) not in visited:
                if grid[nr][nc] == valid:
                    visited.add((nr, nc))
                    queue.append((nr, nc, dist + 1))''',
        variations=[
            PatternVariation(
                "Single-source shortest path",
                "Find shortest path from one node to target",
                "Unweighted graph, minimum steps",
            ),
            PatternVariation(
                "Multi-source BFS",
                "Start BFS from multiple sources simultaneously",
                "Rotting oranges, walls and gates, 01-matrix",
            ),
            PatternVariation(
                "Level-order traversal",
                "Process tree/graph level by level",
                "Tree level-order, minimum depth, right side view",
            ),
            PatternVariation(
                "BFS with state",
                "State is more than just position (position + keys, position + steps left)",
                "Shortest path with constraints, state-space search",
            ),
        ],
        time_complexity="O(V + E) for graphs, O(m*n) for matrices",
        space_complexity="O(V) for the queue and visited set",
        pitfalls=[
            "Forgetting to mark nodes as visited BEFORE enqueueing (causes duplicates)",
            "Not using deque (list.pop(0) is O(n))",
            "For level-by-level: must snapshot queue size at start of each level",
        ],
        canonical_problems=[
            "Number of Islands", "Rotting Oranges", "Word Ladder",
            "Binary Tree Level Order Traversal", "01 Matrix",
            "Shortest Path in Binary Matrix", "Open the Lock",
        ],
        related_patterns=["dfs", "dijkstra"],
    ),

    # =========================================================================
    # 5. DFS (Depth-First Search)
    # =========================================================================
    Pattern(
        id="dfs",
        name="Depth-First Search",
        category="traversal",
        description=(
            "Explore as deep as possible along each branch before backtracking. "
            "Uses recursion (call stack) or an explicit stack. Natural fit for "
            "tree problems, connected components, cycle detection, and topological sort."
        ),
        when_to_use=[
            "Tree traversal (preorder, inorder, postorder)",
            "Finding connected components in a graph",
            "Cycle detection in directed/undirected graphs",
            "Path finding where you need to explore all possibilities",
            "Problems requiring backtracking after exploration",
            "Keywords: 'all paths', 'connected', 'component', 'explore'",
        ],
        approach=[
            "1. Choose recursive or iterative (recursive is usually cleaner for trees)",
            "2. Define: what does visiting a node mean? What do we track/return?",
            "3. Base case: null node, visited node, or boundary condition",
            "4. Recursive case: process current node, recurse on children/neighbors",
            "5. For graphs: maintain a visited set to avoid cycles",
        ],
        template='''def dfs_tree(root):
    """DFS on a binary tree (recursive)."""
    if not root:
        return  # base case

    # Preorder: process BEFORE children
    process(root)
    dfs_tree(root.left)
    dfs_tree(root.right)

    # Inorder: process BETWEEN children (BST gives sorted order)
    # dfs_tree(root.left)
    # process(root)
    # dfs_tree(root.right)

    # Postorder: process AFTER children (useful for bottom-up)
    # dfs_tree(root.left)
    # dfs_tree(root.right)
    # process(root)


def dfs_graph(graph, start):
    """DFS on a graph (iterative with stack)."""
    stack = [start]
    visited = {start}
    while stack:
        node = stack.pop()
        process(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                stack.append(neighbor)


def dfs_matrix(grid, r, c, visited):
    """DFS on a matrix (recursive, e.g., flood fill)."""
    if (r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0])
            or (r, c) in visited or grid[r][c] == 0):
        return
    visited.add((r, c))
    for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
        dfs_matrix(grid, r + dr, c + dc, visited)''',
        variations=[
            PatternVariation(
                "Tree DFS (pre/in/post-order)",
                "Recursive traversal of binary trees",
                "Most tree problems; pick traversal order based on when you need the result",
            ),
            PatternVariation(
                "Graph DFS with cycle detection",
                "Track 'in current path' vs 'fully visited' for directed graphs",
                "Course schedule, detect cycle in directed graph",
            ),
            PatternVariation(
                "DFS with return value",
                "Each recursive call returns a computed value (height, count, boolean)",
                "Max depth, diameter, validate BST, LCA",
            ),
        ],
        time_complexity="O(V + E) for graphs, O(n) for trees",
        space_complexity="O(h) for trees (h=height), O(V) for graphs",
        pitfalls=[
            "Stack overflow on deep recursion (Python default limit ~1000)",
            "For directed graphs: need 3-state visited (unvisited, in-progress, done) for cycle detection",
            "Forgetting to un-visit in backtracking problems (DFS != backtracking)",
        ],
        canonical_problems=[
            "Number of Islands", "Max Depth of Binary Tree",
            "Validate BST", "Lowest Common Ancestor",
            "Clone Graph", "Pacific Atlantic Water Flow",
        ],
        related_patterns=["bfs", "backtracking", "topological_sort"],
    ),

    # =========================================================================
    # 6. TOPOLOGICAL SORT
    # =========================================================================
    Pattern(
        id="topological_sort",
        name="Topological Sort",
        category="technique",
        description=(
            "Linear ordering of vertices in a DAG such that for every edge u->v, "
            "u comes before v. If a cycle exists, no valid ordering is possible. "
            "Two approaches: Kahn's algorithm (BFS with in-degree) and DFS post-order."
        ),
        when_to_use=[
            "Tasks/courses with prerequisites (dependency ordering)",
            "Build system: compile order",
            "Detecting cycles in directed graphs",
            "Any problem asking for a valid ordering respecting dependencies",
            "Keywords: 'prerequisite', 'dependency', 'ordering', 'schedule', 'before/after'",
        ],
        approach=[
            "1. Build adjacency list and compute in-degree for each node",
            "2. Kahn's: enqueue all nodes with in-degree 0",
            "3. Process queue: for each node, reduce in-degree of neighbors",
            "4. If neighbor's in-degree becomes 0, enqueue it",
            "5. If result has fewer nodes than total, there's a cycle",
        ],
        template='''from collections import deque, defaultdict

def topological_sort_kahn(num_nodes, edges):
    """Kahn's algorithm (BFS-based). Returns order or [] if cycle."""
    graph = defaultdict(list)
    in_degree = [0] * num_nodes

    for u, v in edges:  # u must come before v
        graph[u].append(v)
        in_degree[v] += 1

    queue = deque(i for i in range(num_nodes) if in_degree[i] == 0)
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return order if len(order) == num_nodes else []  # [] = cycle


def topological_sort_dfs(num_nodes, edges):
    """DFS-based topological sort with cycle detection."""
    graph = defaultdict(list)
    for u, v in edges:
        graph[u].append(v)

    WHITE, GRAY, BLACK = 0, 1, 2
    color = [WHITE] * num_nodes
    order = []

    def dfs(node):
        color[node] = GRAY  # in current path
        for neighbor in graph[node]:
            if color[neighbor] == GRAY:
                return False  # cycle!
            if color[neighbor] == WHITE and not dfs(neighbor):
                return False
        color[node] = BLACK  # fully processed
        order.append(node)   # post-order
        return True

    for i in range(num_nodes):
        if color[i] == WHITE and not dfs(i):
            return []  # cycle

    return order[::-1]  # reverse post-order''',
        variations=[
            PatternVariation(
                "Kahn's (BFS)",
                "Process nodes with zero in-degree first, peel off layers",
                "When you need to process in dependency order or detect cycle simply",
            ),
            PatternVariation(
                "DFS post-order (reverse)",
                "DFS with 3-state coloring, reverse post-order gives topological order",
                "When you need cycle detection with explicit path tracking",
            ),
        ],
        time_complexity="O(V + E)",
        space_complexity="O(V + E)",
        pitfalls=[
            "Confusing edge direction: 'A is prerequisite of B' means edge A->B",
            "Not handling disconnected components (must start from ALL zero-in-degree nodes)",
            "DFS version: must use 3-state (not just visited bool) for cycle detection in directed graphs",
        ],
        canonical_problems=[
            "Course Schedule", "Course Schedule II",
            "Alien Dictionary", "Parallel Courses",
            "Minimum Height Trees", "Sequence Reconstruction",
        ],
        related_patterns=["dfs", "bfs"],
    ),

    # =========================================================================
    # 7. DYNAMIC PROGRAMMING
    # =========================================================================
    Pattern(
        id="dp",
        name="Dynamic Programming",
        category="optimization",
        description=(
            "Break a problem into overlapping subproblems, solve each once, and "
            "store the results. The key is defining the state (what dp[i] or dp[i][j] "
            "represents) and the recurrence (how to compute it from smaller states). "
            "Bottom-up (tabulation) or top-down (memoization) — same idea, different direction."
        ),
        when_to_use=[
            "Optimal value: 'minimum cost', 'maximum profit', 'number of ways'",
            "Problem has overlapping subproblems (same computation repeated)",
            "Problem has optimal substructure (optimal solution contains optimal sub-solutions)",
            "Decision at each step: take it or skip it",
            "Cannot use greedy (local optimal != global optimal)",
            "Keywords: 'minimum', 'maximum', 'how many ways', 'can you reach', 'longest/shortest'",
        ],
        approach=[
            "1. Define the state: what does dp[i] (or dp[i][j]) represent?",
            "   - Be precise: 'dp[i] = max profit using items 0..i' vs 'ending at i'",
            "2. Write the recurrence relation BEFORE coding",
            "   - What choices do I have at state i?",
            "   - dp[i] = best of (choice 1 result, choice 2 result, ...)",
            "3. Identify base cases: dp[0], dp[0][0], etc.",
            "4. Determine fill order: which states depend on which?",
            "5. Code it bottom-up (for loop) or top-down (recursion + memo)",
            "6. Optimize space if possible (often 2D -> 1D, or 1D -> two variables)",
        ],
        template='''def dp_1d(nums):
    """1D DP template (e.g., house robber, climbing stairs)."""
    n = len(nums)
    if n == 0:
        return 0
    dp = [0] * n
    dp[0] = nums[0]                    # base case
    dp[1] = max(nums[0], nums[1])      # base case (problem-specific)

    for i in range(2, n):
        dp[i] = max(
            dp[i-1],              # skip current
            dp[i-2] + nums[i],   # take current
        )
    return dp[-1]


def dp_2d(text1, text2):
    """2D DP template (e.g., LCS, edit distance)."""
    m, n = len(text1), len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i-1] == text2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])

    return dp[m][n]


def dp_knapsack(weights, values, capacity):
    """0/1 Knapsack template."""
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        for w in range(capacity + 1):
            dp[i][w] = dp[i-1][w]  # skip item i
            if weights[i-1] <= w:
                dp[i][w] = max(dp[i][w], dp[i-1][w - weights[i-1]] + values[i-1])

    return dp[n][capacity]''',
        variations=[
            PatternVariation(
                "1D DP",
                "Single sequence, state depends on previous 1-2 elements",
                "Climbing stairs, house robber, coin change, word break",
            ),
            PatternVariation(
                "2D DP (two sequences)",
                "Compare/align two sequences",
                "Edit distance, LCS, regex matching, interleaving strings",
            ),
            PatternVariation(
                "Knapsack variants",
                "Select items with weight/value under capacity",
                "0/1 knapsack, unbounded knapsack, partition equal subset sum",
            ),
            PatternVariation(
                "Interval DP",
                "dp[i][j] = optimal for subarray i..j",
                "Burst balloons, matrix chain multiplication, palindrome partitioning",
            ),
            PatternVariation(
                "DP on trees",
                "DFS with memoization, state = subtree",
                "House robber III, diameter of tree, max path sum",
            ),
        ],
        time_complexity="O(n) to O(n^2) to O(n*W) depending on dimensions",
        space_complexity="Often optimizable: 2D -> 1D (rolling array), 1D -> O(1)",
        pitfalls=[
            "Imprecise state definition leads to wrong recurrence",
            "Wrong base cases (especially off-by-one with 0-indexed vs 1-indexed dp)",
            "Not considering all choices at each state",
            "Confusing 'ending at i' vs 'using elements 0..i' — different recurrences!",
        ],
        canonical_problems=[
            "Climbing Stairs", "House Robber", "Coin Change",
            "Longest Increasing Subsequence", "Edit Distance",
            "Word Break", "Longest Common Subsequence",
            "Unique Paths", "Partition Equal Subset Sum",
        ],
        related_patterns=["greedy", "memoization"],
    ),

    # =========================================================================
    # 8. GREEDY
    # =========================================================================
    Pattern(
        id="greedy",
        name="Greedy",
        category="optimization",
        description=(
            "Make the locally optimal choice at each step, hoping it leads to the "
            "globally optimal solution. Only works when the greedy choice property holds: "
            "a locally optimal choice never needs to be reconsidered. Often requires "
            "sorting first. When in doubt, try DP instead."
        ),
        when_to_use=[
            "Interval scheduling: select non-overlapping intervals",
            "Choosing the best option at each step provably works",
            "Problem involves sorting + sequential selection",
            "Activity selection, job scheduling with deadlines",
            "Keywords: 'minimum number of', 'maximum number of non-overlapping'",
            "Distinguishing from DP: can you prove local optimal = global optimal?",
        ],
        approach=[
            "1. Sort the input (by start time, end time, ratio, etc.)",
            "2. Iterate and make the greedy choice at each step",
            "3. PROVE it works: exchange argument or greedy stays ahead",
            "4. If you can't prove it, consider DP instead",
        ],
        template='''def greedy_intervals(intervals):
    """Select maximum non-overlapping intervals."""
    intervals.sort(key=lambda x: x[1])  # sort by END time
    count = 0
    last_end = float('-inf')

    for start, end in intervals:
        if start >= last_end:
            count += 1
            last_end = end

    return count


def greedy_jump_game(nums):
    """Minimum jumps to reach end (BFS-level greedy)."""
    jumps = 0
    current_end = 0
    farthest = 0

    for i in range(len(nums) - 1):
        farthest = max(farthest, i + nums[i])
        if i == current_end:
            jumps += 1
            current_end = farthest

    return jumps''',
        variations=[
            PatternVariation(
                "Interval scheduling",
                "Sort by end time, greedily pick non-overlapping",
                "Meeting rooms, non-overlapping intervals, merge intervals",
            ),
            PatternVariation(
                "Greedy with sorting",
                "Sort by some key, process in order",
                "Assign cookies, partition labels, gas station",
            ),
            PatternVariation(
                "Two-pass greedy",
                "Forward pass + backward pass",
                "Candy distribution, trapping rain water (greedy variant)",
            ),
        ],
        time_complexity="O(n log n) due to sorting, O(n) for the greedy pass",
        space_complexity="O(1) extra (excluding sort space)",
        pitfalls=[
            "Assuming greedy works without proof — many problems look greedy but need DP",
            "Sorting by the wrong key (start time vs end time matters!)",
            "Not handling ties correctly",
        ],
        canonical_problems=[
            "Jump Game", "Jump Game II", "Non-overlapping Intervals",
            "Merge Intervals", "Task Scheduler", "Gas Station",
            "Partition Labels", "Candy",
        ],
        related_patterns=["dp", "sorting"],
    ),

    # =========================================================================
    # 9. BACKTRACKING
    # =========================================================================
    Pattern(
        id="backtracking",
        name="Backtracking",
        category="technique",
        description=(
            "Systematically explore all candidates for a solution by building choices "
            "incrementally and abandoning a path ('backtracking') as soon as it's "
            "determined to be invalid. Think of it as DFS on a decision tree with pruning."
        ),
        when_to_use=[
            "Generate all permutations, combinations, or subsets",
            "Find all valid configurations (N-Queens, Sudoku)",
            "Word search in a grid",
            "Constraint satisfaction problems",
            "Keywords: 'all possible', 'generate all', 'find all valid', 'enumerate'",
        ],
        approach=[
            "1. Define the decision tree: what choices exist at each step?",
            "2. Template: choose -> explore -> un-choose",
            "3. Base case: when is a candidate a complete solution?",
            "4. Pruning: when can you skip an entire branch?",
            "5. Track state: what gets modified and needs to be restored?",
        ],
        template='''def backtrack(candidates, target):
    """General backtracking template."""
    result = []

    def helper(start, current, remaining):
        # Base case: found a valid solution
        if is_solution(current, remaining):
            result.append(current[:])  # copy!
            return

        # Pruning: no valid solution possible from here
        if not is_valid(current, remaining):
            return

        for i in range(start, len(candidates)):
            # Skip duplicates (if candidates is sorted)
            if i > start and candidates[i] == candidates[i-1]:
                continue

            # Choose
            current.append(candidates[i])

            # Explore (i+1 for combinations, i for reuse, 0 for permutations)
            helper(i + 1, current, remaining - candidates[i])

            # Un-choose (backtrack)
            current.pop()

    helper(0, [], target)
    return result


def backtrack_grid(board, word):
    """Backtracking on a grid (word search)."""
    rows, cols = len(board), len(board[0])

    def dfs(r, c, idx):
        if idx == len(word):
            return True
        if (r < 0 or r >= rows or c < 0 or c >= cols
                or board[r][c] != word[idx]):
            return False

        temp = board[r][c]
        board[r][c] = '#'  # mark visited

        found = any(
            dfs(r+dr, c+dc, idx+1)
            for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]
        )

        board[r][c] = temp  # un-mark (backtrack)
        return found

    return any(dfs(r, c, 0) for r in range(rows) for c in range(cols))''',
        variations=[
            PatternVariation(
                "Subsets/Combinations",
                "Choose or skip each element, order doesn't matter",
                "Subsets, combination sum, partition to k equal subsets",
            ),
            PatternVariation(
                "Permutations",
                "Arrange elements in all possible orders",
                "Permutations, permutation sequence",
            ),
            PatternVariation(
                "Constraint satisfaction",
                "Place elements satisfying constraints (board games)",
                "N-Queens, Sudoku solver, word search",
            ),
        ],
        time_complexity="O(2^n) for subsets, O(n!) for permutations — exponential",
        space_complexity="O(n) for recursion depth + solution storage",
        pitfalls=[
            "Forgetting to make a copy when adding to results (current[:] not current)",
            "Forgetting to un-choose (restore state after recursive call)",
            "Not pruning — backtracking without pruning is just brute force",
            "Handling duplicates: sort input + skip if candidates[i] == candidates[i-1]",
        ],
        canonical_problems=[
            "Subsets", "Permutations", "Combination Sum",
            "N-Queens", "Word Search", "Sudoku Solver",
            "Palindrome Partitioning", "Generate Parentheses",
        ],
        related_patterns=["dfs", "recursion"],
    ),

    # =========================================================================
    # 10. HEAP / PRIORITY QUEUE
    # =========================================================================
    Pattern(
        id="heap",
        name="Heap / Priority Queue",
        category="structure",
        description=(
            "A data structure that efficiently supports: insert O(log n), "
            "extract-min/max O(log n), peek O(1). Use when you repeatedly need "
            "the smallest or largest element from a dynamic collection."
        ),
        when_to_use=[
            "Find the K-th largest/smallest element",
            "Merge K sorted lists/streams",
            "Streaming median (two-heap technique)",
            "Repeatedly process the highest/lowest priority item",
            "Dijkstra's shortest path (min-heap of distances)",
            "Keywords: 'K-th', 'top K', 'merge K sorted', 'median', 'priority'",
        ],
        approach=[
            "1. Identify: do you need min or max? (Python heapq is min-heap only)",
            "2. For max-heap in Python: negate values",
            "3. For K-th largest: maintain a min-heap of size K",
            "4. For streaming median: two heaps (max-heap for lower, min-heap for upper)",
            "5. For K-way merge: push first element of each list, pop-and-push-next",
        ],
        template='''import heapq

def top_k_frequent(nums, k):
    """Find K most frequent elements."""
    counts = Counter(nums)
    # Min-heap of size k (negate for max behavior)
    return heapq.nlargest(k, counts.keys(), key=counts.get)


def merge_k_sorted(lists):
    """Merge K sorted lists using a heap."""
    heap = []
    for i, lst in enumerate(lists):
        if lst:
            heapq.heappush(heap, (lst[0], i, 0))

    result = []
    while heap:
        val, list_idx, elem_idx = heapq.heappop(heap)
        result.append(val)
        if elem_idx + 1 < len(lists[list_idx]):
            next_val = lists[list_idx][elem_idx + 1]
            heapq.heappush(heap, (next_val, list_idx, elem_idx + 1))

    return result


def running_median(nums):
    """Two-heap streaming median."""
    lo = []  # max-heap (negated) for lower half
    hi = []  # min-heap for upper half
    medians = []

    for num in nums:
        heapq.heappush(lo, -num)

        # Balance: lo's max <= hi's min
        heapq.heappush(hi, -heapq.heappop(lo))

        # Size: lo can have at most 1 more than hi
        if len(hi) > len(lo):
            heapq.heappush(lo, -heapq.heappop(hi))

        if len(lo) > len(hi):
            medians.append(-lo[0])
        else:
            medians.append((-lo[0] + hi[0]) / 2)

    return medians''',
        variations=[
            PatternVariation(
                "Top-K / K-th element",
                "Maintain heap of size K",
                "K-th largest, top K frequent, K closest points",
            ),
            PatternVariation(
                "Two heaps (median)",
                "Max-heap for lower half, min-heap for upper half",
                "Find median from data stream, sliding window median",
            ),
            PatternVariation(
                "K-way merge",
                "Heap tracks one element per source, pop and push next",
                "Merge K sorted lists, smallest range covering K lists",
            ),
        ],
        time_complexity="O(log n) per push/pop, O(n log k) for top-K of n elements",
        space_complexity="O(k) for top-K, O(n) for streaming median",
        pitfalls=[
            "Python heapq is min-heap only — negate for max-heap",
            "Comparing tuples: if first elements tie, Python compares second — can crash on non-comparable objects",
            "Solution: use (value, unique_counter, object) tuples",
        ],
        canonical_problems=[
            "Kth Largest Element", "Top K Frequent Elements",
            "Merge K Sorted Lists", "Find Median from Data Stream",
            "K Closest Points to Origin", "Reorganize String",
        ],
        related_patterns=["sorting", "binary_search"],
    ),

    # =========================================================================
    # 11. MONOTONIC STACK
    # =========================================================================
    Pattern(
        id="monotonic_stack",
        name="Monotonic Stack",
        category="structure",
        description=(
            "A stack that maintains elements in strictly increasing or decreasing order. "
            "When a new element violates the order, pop elements until the invariant is "
            "restored. The popped elements have found their 'answer' (next greater/smaller). "
            "Converts O(n^2) brute force to O(n)."
        ),
        when_to_use=[
            "'Next greater element' or 'next smaller element'",
            "'Previous greater/smaller element'",
            "Largest rectangle in histogram",
            "Stock span, daily temperatures",
            "Keywords: 'next greater', 'next smaller', 'span', 'rectangle', 'histogram'",
        ],
        approach=[
            "1. Decide: monotonic increasing or decreasing?",
            "   - For 'next greater': use decreasing stack (pop when new > top)",
            "   - For 'next smaller': use increasing stack (pop when new < top)",
            "2. Iterate through elements",
            "3. While stack is non-empty and current element violates monotonicity:",
            "   - Pop: the popped element's 'answer' is the current element",
            "4. Push current element (or its index) onto stack",
            "5. Remaining elements in stack have no answer (use -1 or boundary)",
        ],
        template='''def next_greater_element(nums):
    """For each element, find the next greater element to its right."""
    n = len(nums)
    result = [-1] * n
    stack = []  # stores indices, maintains decreasing values

    for i in range(n):
        while stack and nums[stack[-1]] < nums[i]:
            idx = stack.pop()
            result[idx] = nums[i]  # nums[i] is the next greater for nums[idx]
        stack.append(i)

    return result


def largest_rectangle_histogram(heights):
    """Largest rectangle in histogram using monotonic stack."""
    stack = []  # stores indices, maintains increasing heights
    max_area = 0
    heights.append(0)  # sentinel to flush remaining

    for i, h in enumerate(heights):
        while stack and heights[stack[-1]] > h:
            height = heights[stack.pop()]
            width = i if not stack else i - stack[-1] - 1
            max_area = max(max_area, height * width)
        stack.append(i)

    heights.pop()  # remove sentinel
    return max_area''',
        variations=[
            PatternVariation(
                "Next greater (right)",
                "Iterate left to right, decreasing stack",
                "Daily temperatures, next greater element",
            ),
            PatternVariation(
                "Previous smaller (left)",
                "Iterate left to right, increasing stack",
                "Stock span, histogram rectangle (left boundary)",
            ),
            PatternVariation(
                "Circular array",
                "Iterate 2n elements (i % n) to handle wrap-around",
                "Next greater element II (circular)",
            ),
        ],
        time_complexity="O(n) — each element pushed and popped at most once",
        space_complexity="O(n) for the stack",
        pitfalls=[
            "Confusing increasing vs decreasing stack — think about what you're looking for",
            "Forgetting the sentinel value to flush remaining stack elements",
            "Width calculation in histogram: i - stack[-1] - 1 (not i - popped_index)",
        ],
        canonical_problems=[
            "Daily Temperatures", "Next Greater Element I & II",
            "Largest Rectangle in Histogram", "Maximal Rectangle",
            "Stock Span Problem", "Trapping Rain Water (stack approach)",
        ],
        related_patterns=["stack"],
    ),

    # =========================================================================
    # 12. UNION FIND (Disjoint Set)
    # =========================================================================
    Pattern(
        id="union_find",
        name="Union Find (Disjoint Set)",
        category="structure",
        description=(
            "Data structure to track elements partitioned into disjoint sets. "
            "Supports near-O(1) union and find operations with path compression "
            "and union by rank. Use when you need to dynamically merge groups "
            "and check if elements belong to the same group."
        ),
        when_to_use=[
            "Dynamic connectivity: 'are A and B connected?'",
            "Merge groups/components incrementally",
            "Count number of connected components",
            "Kruskal's MST algorithm",
            "Keywords: 'connected', 'union', 'merge', 'group', 'component', 'same set'",
        ],
        approach=[
            "1. Initialize: each element is its own parent (parent[i] = i)",
            "2. Find: follow parent pointers to root, apply path compression",
            "3. Union: find roots of both elements, merge smaller into larger (by rank)",
            "4. Track component count: decrement on each successful union",
        ],
        template='''class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.components = n

    def find(self, x):
        """Find root with path compression."""
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]

    def union(self, x, y):
        """Union by rank. Returns True if they were in different sets."""
        px, py = self.find(x), self.find(y)
        if px == py:
            return False
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1
        self.components -= 1
        return True

    def connected(self, x, y):
        return self.find(x) == self.find(y)''',
        time_complexity="O(alpha(n)) per operation — effectively O(1)",
        space_complexity="O(n)",
        pitfalls=[
            "Forgetting path compression (makes find O(n) instead of O(alpha(n)))",
            "Using union by rank OR size, not both — pick one",
            "For string/object keys: use a dict instead of list for parent",
        ],
        canonical_problems=[
            "Number of Connected Components", "Redundant Connection",
            "Accounts Merge", "Longest Consecutive Sequence",
            "Graph Valid Tree", "Satisfiability of Equality Equations",
        ],
        related_patterns=["bfs", "dfs"],
    ),

    # =========================================================================
    # 13. TRIE (Prefix Tree)
    # =========================================================================
    Pattern(
        id="trie",
        name="Trie (Prefix Tree)",
        category="structure",
        description=(
            "Tree structure where each node represents a character and paths from root "
            "to nodes spell prefixes. Enables O(L) lookup/insert where L is word length, "
            "regardless of dictionary size. Essential for prefix-based operations."
        ),
        when_to_use=[
            "Prefix matching: autocomplete, type-ahead search",
            "Word dictionary with prefix queries",
            "Word search on a board (combine trie with DFS)",
            "Longest common prefix",
            "Keywords: 'prefix', 'dictionary', 'word search', 'autocomplete'",
        ],
        approach=[
            "1. Build trie: for each word, walk/create nodes character by character",
            "2. Mark end-of-word nodes (is_end = True)",
            "3. Search: walk the trie following character path",
            "4. Prefix search: same as search but don't require is_end",
            "5. For board problems: DFS from each cell, following trie paths",
        ],
        template='''class TrieNode:
    def __init__(self):
        self.children = {}   # char -> TrieNode
        self.is_end = False
        self.word = None     # optional: store full word at end nodes


class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end = True
        node.word = word

    def search(self, word):
        node = self._find_node(word)
        return node is not None and node.is_end

    def starts_with(self, prefix):
        return self._find_node(prefix) is not None

    def _find_node(self, prefix):
        node = self.root
        for char in prefix:
            if char not in node.children:
                return None
            node = node.children[char]
        return node''',
        time_complexity="O(L) per operation where L is word/prefix length",
        space_complexity="O(total characters across all words)",
        pitfalls=[
            "Memory-heavy: each node has a dict of children",
            "For board problems: prune trie after finding words to avoid duplicates",
            "Don't confuse search (exact match) with starts_with (prefix match)",
        ],
        canonical_problems=[
            "Implement Trie", "Word Search II",
            "Design Add and Search Words",
            "Search Suggestions System", "Longest Word in Dictionary",
        ],
        related_patterns=["backtracking", "dfs"],
    ),

    # =========================================================================
    # 14. PREFIX SUM
    # =========================================================================
    Pattern(
        id="prefix_sum",
        name="Prefix Sum / Cumulative Sum",
        category="technique",
        description=(
            "Precompute cumulative sums so that any subarray sum can be computed "
            "in O(1). prefix[i] = sum(arr[0..i-1]). Then sum(arr[l..r]) = prefix[r+1] - prefix[l]. "
            "Extends to 2D (prefix rectangles) and to frequency/XOR/product."
        ),
        when_to_use=[
            "Multiple subarray sum queries",
            "'Number of subarrays with sum equal to K'",
            "Range sum queries after preprocessing",
            "Subarray sum divisible by K",
            "Keywords: 'subarray sum', 'range sum', 'cumulative'",
        ],
        approach=[
            "1. Build prefix array: prefix[0] = 0, prefix[i] = prefix[i-1] + arr[i-1]",
            "2. Subarray sum [l, r] = prefix[r+1] - prefix[l]",
            "3. For 'count subarrays with sum K': use hash map of prefix sums",
            "   - If prefix[j] - prefix[i] = K, then prefix[i] = prefix[j] - K",
            "   - Count how many previous prefix sums equal prefix[j] - K",
        ],
        template='''def subarray_sum_equals_k(nums, k):
    """Count subarrays with sum exactly k using prefix sum + hash map."""
    count = 0
    prefix_sum = 0
    seen = {0: 1}  # prefix_sum -> count of occurrences

    for num in nums:
        prefix_sum += num
        # If (prefix_sum - k) was seen before, those are valid subarrays
        count += seen.get(prefix_sum - k, 0)
        seen[prefix_sum] = seen.get(prefix_sum, 0) + 1

    return count


def range_sum_query(nums):
    """Precompute prefix sums for O(1) range queries."""
    prefix = [0] * (len(nums) + 1)
    for i in range(len(nums)):
        prefix[i + 1] = prefix[i] + nums[i]

    def query(left, right):
        """Sum of nums[left..right] inclusive."""
        return prefix[right + 1] - prefix[left]

    return query''',
        time_complexity="O(n) to build, O(1) per query",
        space_complexity="O(n) for the prefix array",
        pitfalls=[
            "Off-by-one: prefix has n+1 elements, prefix[0] = 0",
            "For 'sum equals K': initialize hash map with {0: 1} (empty prefix)",
            "Doesn't work for subarray product (use prefix product or log trick)",
        ],
        canonical_problems=[
            "Subarray Sum Equals K", "Range Sum Query",
            "Contiguous Array (binary: 0/1)", "Product of Array Except Self",
            "Subarray Sum Divisible by K",
        ],
        related_patterns=["hash_map", "sliding_window"],
    ),

    # =========================================================================
    # 15. HASH MAP PATTERNS
    # =========================================================================
    Pattern(
        id="hash_map",
        name="Hash Map Patterns",
        category="structure",
        description=(
            "Use hash maps (dicts) for O(1) lookup/insert to replace O(n) scans. "
            "This isn't just 'use a dict' — it's recognizing WHEN a hash map transforms "
            "the problem. Common patterns: complement lookup, frequency counting, "
            "grouping, and caching."
        ),
        when_to_use=[
            "Need O(1) lookup: 'have I seen this before?'",
            "Two Sum pattern: find complement in O(1)",
            "Frequency counting: most/least frequent, anagram detection",
            "Grouping: group by key (anagrams, same pattern)",
            "Caching previous results (memoization)",
            "Keywords: 'find pair', 'frequency', 'count', 'group by', 'anagram'",
        ],
        approach=[
            "1. Identify what to store: element -> index, element -> count, pattern -> group",
            "2. Single-pass when possible: check then insert (Two Sum pattern)",
            "3. For frequency: Counter or defaultdict(int)",
            "4. For grouping: defaultdict(list), key = canonical form",
        ],
        template='''from collections import Counter, defaultdict

def two_sum(nums, target):
    """Find pair summing to target in O(n)."""
    seen = {}  # value -> index
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i


def group_anagrams(strs):
    """Group strings that are anagrams of each other."""
    groups = defaultdict(list)
    for s in strs:
        key = tuple(sorted(s))  # canonical form
        groups[key].append(s)
    return list(groups.values())


def frequency_pattern(nums, k):
    """Count elements appearing exactly k times."""
    counts = Counter(nums)
    return sum(1 for c in counts.values() if c == k)''',
        time_complexity="O(n) for single-pass patterns",
        space_complexity="O(n) for the hash map",
        pitfalls=[
            "Hash collisions in theory, but Python dicts handle this well",
            "Mutable objects (lists) can't be dict keys — convert to tuples",
            "For sliding window + hash map: remember to decrement/remove when shrinking",
        ],
        canonical_problems=[
            "Two Sum", "Group Anagrams", "Valid Anagram",
            "Longest Consecutive Sequence", "Subarray Sum Equals K",
            "Top K Frequent Elements", "Encode and Decode Strings",
        ],
        related_patterns=["sliding_window", "prefix_sum"],
    ),

    # =========================================================================
    # 16. DIJKSTRA'S ALGORITHM
    # =========================================================================
    Pattern(
        id="dijkstra",
        name="Dijkstra's Shortest Path",
        category="technique",
        description=(
            "Find shortest paths from a source to all nodes in a weighted graph "
            "with non-negative edge weights. Uses a min-heap to always process "
            "the nearest unvisited node. Greedy approach that works because "
            "non-negative weights guarantee no shorter path through unvisited nodes."
        ),
        when_to_use=[
            "Shortest path in a weighted graph (non-negative weights)",
            "Minimum cost to reach a destination",
            "Network delay time, cheapest flights",
            "Keywords: 'shortest path', 'minimum cost', 'weighted graph'",
            "NOT for negative weights (use Bellman-Ford instead)",
        ],
        approach=[
            "1. Initialize distances: dist[source] = 0, all others = infinity",
            "2. Push (0, source) to min-heap",
            "3. Pop minimum distance node from heap",
            "4. If already visited with shorter distance, skip (lazy deletion)",
            "5. For each neighbor: if new distance < known distance, update and push",
        ],
        template='''import heapq
from collections import defaultdict

def dijkstra(graph, source, target):
    """Shortest path in weighted graph with non-negative edges.
    graph: {node: [(neighbor, weight), ...]}
    """
    dist = defaultdict(lambda: float('inf'))
    dist[source] = 0
    heap = [(0, source)]

    while heap:
        d, node = heapq.heappop(heap)

        if node == target:
            return d

        if d > dist[node]:
            continue  # stale entry, skip

        for neighbor, weight in graph[node]:
            new_dist = d + weight
            if new_dist < dist[neighbor]:
                dist[neighbor] = new_dist
                heapq.heappush(heap, (new_dist, neighbor))

    return dist[target]  # or -1 if unreachable''',
        time_complexity="O((V + E) log V) with binary heap",
        space_complexity="O(V + E)",
        pitfalls=[
            "Doesn't work with negative edge weights",
            "Must use lazy deletion (skip stale heap entries) for correctness",
            "Don't confuse with BFS — BFS is for unweighted, Dijkstra for weighted",
        ],
        canonical_problems=[
            "Network Delay Time", "Cheapest Flights Within K Stops",
            "Path with Minimum Effort", "Swim in Rising Water",
            "Shortest Path in Binary Matrix (if weighted)",
        ],
        related_patterns=["bfs", "heap"],
    ),

    # =========================================================================
    # 17. BINARY SEARCH ON ANSWER
    # =========================================================================
    Pattern(
        id="binary_search_answer",
        name="Binary Search on Answer",
        category="optimization",
        description=(
            "When the answer is a numeric value on a monotone feasibility line "
            "(FFF…FTTT…T), binary search the answer space and check a predicate "
            "can(mid). Distinct from binary search on a sorted array index."
        ),
        when_to_use=[
            "Minimize/maximize a value subject to a yes/no feasibility check",
            "Koko eating bananas, split array largest sum, capacity to ship packages",
            "Keywords: 'minimum maximum', 'smallest possible', 'allocate / capacity'",
            "Predicate can(x) is monotone: if x works, every y > x also works (or inverse)",
        ],
        approach=[
            "1. Identify the answer range [lo, hi] (e.g. 1 .. max(nums) or sum(nums))",
            "2. Define can(x): bool — does answer x satisfy constraints?",
            "3. Binary search: if can(mid) try smaller (or larger); else opposite",
            "4. Return the boundary (first True / last False depending on wording)",
        ],
        template='''def binary_search_answer(lo, hi, can):
    """Find minimal x in [lo, hi] such that can(x) is True (FFFTTT)."""
    ans = hi
    while lo <= hi:
        mid = (lo + hi) // 2
        if can(mid):
            ans = mid
            hi = mid - 1
        else:
            lo = mid + 1
    return ans''',
        time_complexity="O(check · log(answer_range))",
        space_complexity="O(1) extra besides the check",
        pitfalls=[
            "Forgetting monotonicity — if can(x) is not monotone, BS is wrong",
            "Off-by-one on first True vs last False",
            "Wrong lo/hi bounds (too tight → miss; too loose → still OK but slower)",
        ],
        canonical_problems=[
            "Koko Eating Bananas", "Split Array Largest Sum",
            "Capacity To Ship Packages", "Minimum Time to Complete Trips",
        ],
        related_patterns=["binary_search", "greedy"],
    ),

    # =========================================================================
    # 18. SWEEP LINE (INTERVALS)
    # =========================================================================
    Pattern(
        id="sweep_line",
        name="Sweep Line / Intervals",
        category="technique",
        description=(
            "Process interval start/end events in sorted order along a line. "
            "Track active count or open set to answer overlap, coverage, or "
            "resource-concurrency questions. Staff systems analogue: load over time."
        ),
        when_to_use=[
            "Meeting rooms / max concurrent intervals",
            "Merge/insert intervals, skyline, car pooling",
            "Keywords: 'overlap', 'concurrent', 'during the same time'",
            "Need max load on a timeline",
        ],
        approach=[
            "1. Turn intervals into events: (time, +1 start) / (time, -1 end)",
            "2. Sort events (process ends before starts at same time if closed/open needs care)",
            "3. Scan left→right, maintain running active count; track max",
            "4. Or sort by start and use a min-heap of end times (meeting rooms II)",
        ],
        template='''def max_concurrent(intervals):
    """Max number of overlapping intervals (half-open friendly)."""
    events = []
    for s, e in intervals:
        events.append((s, 1))   # start
        events.append((e, -1))  # end
    # Sort by time; ends (-1) before starts (+1) at same timestamp
    events.sort(key=lambda x: (x[0], x[1]))
    cur = best = 0
    for _, delta in events:
        cur += delta
        best = max(best, cur)
    return best''',
        time_complexity="O(n log n)",
        space_complexity="O(n)",
        pitfalls=[
            "Inclusive vs exclusive endpoints — decide whether end frees before start at same t",
            "Forgetting to sort events",
            "Using merge-intervals when you actually need concurrency count",
        ],
        canonical_problems=[
            "Meeting Rooms II", "Car Pooling", "The Skyline Problem",
            "My Calendar II", "Minimum Number of Platforms",
        ],
        related_patterns=["greedy", "heap", "difference_array"],
    ),

    # =========================================================================
    # 19. LINKED LIST
    # =========================================================================
    Pattern(
        id="linked_list",
        name="Linked List Techniques",
        category="structure",
        description=(
            "Pointer games on singly/doubly linked structures: dummy head, "
            "fast/slow (tortoise-hare), reverse, merge, and cycle detection. "
            "Small API surface, easy to fumble under pressure — drill until automatic."
        ),
        when_to_use=[
            "Reverse / rotate / reorder a list",
            "Find middle, detect/find cycle (Floyd)",
            "Merge two sorted lists, remove nth from end",
            "Keywords: 'ListNode', 'in-place list', 'O(1) space list'",
        ],
        approach=[
            "1. Draw nodes; use a dummy head when the head may change",
            "2. Fast/slow: middle (fast=2x), cycle (meet), cycle entrance (reset one pointer)",
            "3. Reverse: prev/cur/next trio — practice until muscle memory",
            "4. Always update next before moving cur",
        ],
        template='''class ListNode:
    def __init__(self, val=0, next=None):
        self.val, self.next = val, next

def reverse_list(head):
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
    return False''',
        time_complexity="O(n)",
        space_complexity="O(1) for reverse / Floyd",
        pitfalls=[
            "Losing the next pointer before rewiring",
            "Off-by-one when finding middle of even-length lists",
            "Forgetting dummy head when deleting/changing head",
        ],
        canonical_problems=[
            "Reverse Linked List", "Linked List Cycle", "Middle of the Linked List",
            "Merge Two Sorted Lists", "Remove Nth Node From End",
        ],
        related_patterns=["two_pointers"],
    ),

    # =========================================================================
    # 20. BIT MANIPULATION
    # =========================================================================
    Pattern(
        id="bit_manipulation",
        name="Bit Manipulation",
        category="technique",
        description=(
            "Use XOR, masks, and bit tricks for parity, unique elements, subsets, "
            "and compact state. Staff value: reasoning about flags, permissions, "
            "and compact encodings in protocols/APIs."
        ),
        when_to_use=[
            "Find the single number (others appear twice) → XOR",
            "Subset enumeration with bitmasks (n ≤ 20)",
            "Check/set/clear/toggle flags",
            "Keywords: 'single number', 'bitmask DP', 'power of two'",
        ],
        approach=[
            "1. XOR: a^a=0, a^0=a — cancel pairs",
            "2. Masks: (x >> k) & 1, x | (1<<k), x & ~(1<<k)",
            "3. n & (n-1) clears lowest set bit; n & -n isolates it",
            "4. Bitmask DP: state as int, iterate submasks",
        ],
        template='''def single_number(nums):
    """All appear twice except one — XOR everything."""
    x = 0
    for n in nums:
        x ^= n
    return x

def is_power_of_two(n):
    return n > 0 and (n & (n - 1)) == 0''',
        time_complexity="O(n) for XOR scan; O(2^n · n) for subset masks",
        space_complexity="O(1) for XOR",
        pitfalls=[
            "Sign / two's complement confusion in languages with fixed width",
            "Using bitmasks when n is large (2^n explodes)",
            "Forgetting operator precedence (& vs ==)",
        ],
        canonical_problems=[
            "Single Number", "Number of 1 Bits", "Power of Two",
            "Subsets (bitmask)", "Counting Bits",
        ],
        related_patterns=["dp", "backtracking"],
    ),

    # =========================================================================
    # 21. DIFFERENCE ARRAY
    # =========================================================================
    Pattern(
        id="difference_array",
        name="Difference Array",
        category="technique",
        description=(
            "The inverse of prefix sums: represent range updates as +val at L and "
            "-val at R+1, then rebuild the array with a prefix pass. Staff analogue: "
            "batch range configuration changes efficiently."
        ),
        when_to_use=[
            "Many range increment updates, then query the final array",
            "Corporate flight bookings, range addition updates",
            "Keywords: 'add val to all elements from i to j', then read result",
            "Prefer over segment tree when you only need final snapshot after updates",
        ],
        approach=[
            "1. diff[0..n] zeros (length n+1)",
            "2. For update [L,R] += val: diff[L]+=val; diff[R+1]-=val",
            "3. Reconstruct: a[i] = a[i-1] + diff[i]",
            "4. Optionally combine with prefix sums for range queries after rebuild",
        ],
        template='''def apply_range_updates(n, updates):
    """updates: list of (L, R, val) inclusive. Return final array length n."""
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
    return out''',
        time_complexity="O(n + u) for u updates",
        space_complexity="O(n)",
        pitfalls=[
            "Off-by-one on R+1",
            "Using difference array when you need dynamic point queries mid-stream (use Fenwick/SegTree)",
            "Confusing with prefix sums (reads vs writes)",
        ],
        canonical_problems=[
            "Range Addition", "Corporate Flight Bookings",
            "Car Pooling (can also be sweep)", "Pretty Print / calendar paint",
        ],
        related_patterns=["prefix_sum", "sweep_line"],
    ),
]


# Staff-level *systems* recognition patterns (not LeetCode generators).
# See html/engineering_patterns.html for the interactive study page.
ENGINEERING_PATTERNS: list[dict] = [
    {"id": "cache_aside", "name": "Cache-Aside", "when": "Read-heavy paths; app owns cache fill/invalidate"},
    {"id": "idempotency", "name": "Idempotency Keys", "when": "Retries of mutating APIs must not double-apply"},
    {"id": "outbox", "name": "Transactional Outbox", "when": "DB commit + message publish must not diverge"},
    {"id": "circuit_breaker", "name": "Circuit Breaker", "when": "Fail fast when a dependency is unhealthy"},
    {"id": "rate_limit", "name": "Rate Limiting", "when": "Protect capacity; token bucket / sliding window counters"},
    {"id": "saga", "name": "Saga / Compensation", "when": "Multi-service workflow without 2PC"},
    {"id": "optimistic_concurrency", "name": "Optimistic Concurrency", "when": "Version/ETag checks beat coarse locking"},
    {"id": "bulkhead", "name": "Bulkhead Isolation", "when": "Limit blast radius of a slow dependency"},
    {"id": "backpressure", "name": "Backpressure", "when": "Producers must slow when consumers cannot keep up"},
]


# =============================================================================
# DECISION TREE — The pattern recognition flowchart
# =============================================================================

DECISION_TREE = """
ALGORITHM PATTERN DECISION TREE
================================

START: What is the input structure?

[ARRAY / STRING]
  |
  +-- Contiguous subarray/substring constraint? --> SLIDING WINDOW
  +-- Sorted (or sortable) pair/triplet? --> TWO POINTERS
  +-- Index lookup in sorted array? --> BINARY SEARCH
  +-- Minimize/maximize a numeric answer with monotone check? --> BINARY SEARCH ON ANSWER
  +-- Range sums / subarray sum = K? --> PREFIX SUM
  +-- Many range *updates*, then final array? --> DIFFERENCE ARRAY
  +-- Frequency / grouping / complement lookup? --> HASH MAP
  +-- Next greater/smaller? --> MONOTONIC STACK
  +-- Interval overlap / concurrency on a timeline? --> SWEEP LINE
  +-- Bit flags / XOR unique / bitmask subsets? --> BIT MANIPULATION
  +-- Optimal value with overlapping subproblems? --> DP
  +-- Provable local choice? --> GREEDY

[LINKED LIST]
  |
  +-- Reverse / middle / cycle / merge --> LINKED LIST (dummy, fast/slow)

[TREE]
  |
  +-- Traversal / property --> DFS
  +-- Level-order --> BFS

[GRAPH]
  |
  +-- Unweighted shortest --> BFS
  +-- Weighted non-negative shortest --> DIJKSTRA
  +-- Dependencies / ordering --> TOPOLOGICAL SORT
  +-- Components / dynamic connectivity --> UNION FIND

[ENUMERATION]
  |
  +-- All configs / subsets / perms --> BACKTRACKING (+ TRIE for prefix word search)

[DYNAMIC MIN/MAX SET]
  |
  +-- Top-K / merge K --> HEAP

[SPECIAL]
  |
  +-- "O(log n)" on answer feasibility --> BINARY SEARCH ON ANSWER
  +-- "concurrent meetings / platforms" --> SWEEP LINE
"""


def get_pattern_by_id(pattern_id: str) -> Pattern | None:
    for p in PATTERNS:
        if p.id == pattern_id:
            return p
    return None


def get_all_pattern_ids() -> list[str]:
    return [p.id for p in PATTERNS]


def get_all_pattern_names() -> list[str]:
    return [p.name for p in PATTERNS]


def print_decision_tree():
    print(DECISION_TREE)


def print_pattern_summary():
    """Print a compact summary of all patterns."""
    print("\n" + "=" * 70)
    print("  ALGORITHM PATTERN CATALOG — QUICK REFERENCE")
    print("=" * 70)
    for p in PATTERNS:
        triggers = p.when_to_use[0] if p.when_to_use else ""
        print(f"\n  {p.name}")
        print(f"    When: {triggers}")
        print(f"    Time: {p.time_complexity} | Space: {p.space_complexity}")
    print()


def print_pattern_detail(pattern_id: str):
    """Print full details for a single pattern."""
    p = get_pattern_by_id(pattern_id)
    if not p:
        print(f"Pattern not found: {pattern_id}")
        return

    print(f"\n{'=' * 70}")
    print(f"  {p.name}")
    print(f"  Category: {p.category}")
    print(f"{'=' * 70}")
    print(f"\n  {p.description}")

    print(f"\n  WHEN TO USE:")
    for signal in p.when_to_use:
        print(f"    - {signal}")

    print(f"\n  APPROACH:")
    for step in p.approach:
        print(f"    {step}")

    print(f"\n  TEMPLATE:")
    for line in p.template.split('\n'):
        print(f"    {line}")

    if p.variations:
        print(f"\n  VARIATIONS:")
        for v in p.variations:
            print(f"    [{v.name}]")
            print(f"      {v.description}")
            print(f"      When: {v.when}")

    print(f"\n  COMPLEXITY:")
    print(f"    Time:  {p.time_complexity}")
    print(f"    Space: {p.space_complexity}")

    if p.pitfalls:
        print(f"\n  COMMON PITFALLS:")
        for pit in p.pitfalls:
            print(f"    ! {pit}")

    if p.canonical_problems:
        print(f"\n  CANONICAL PROBLEMS:")
        for prob in p.canonical_problems:
            print(f"    - {prob}")

    if p.related_patterns:
        print(f"\n  RELATED PATTERNS: {', '.join(p.related_patterns)}")
    print()
