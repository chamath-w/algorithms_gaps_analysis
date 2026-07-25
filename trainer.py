"""
Pattern Recognition Trainer

Interactive CLI mode that trains the classification skill separately from
the coding skill. Presents problem descriptions and asks you to:
  1. Identify the primary algorithm pattern
  2. Identify secondary patterns / data structures
  3. Outline your approach in 2-3 sentences

Scores classification accuracy and tracks which patterns you struggle to recognize.
"""

import json
import random
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from patterns import PATTERNS, get_pattern_by_id, get_all_pattern_ids, DECISION_TREE


RESULTS_DIR = Path(__file__).parent / "results"


@dataclass
class TrainingScenario:
    id: str
    description: str
    constraints: str
    example: str
    primary_pattern: str         # pattern ID
    secondary_patterns: list[str]  # pattern IDs (acceptable alternatives or complements)
    key_signals: list[str]       # what should tip you off
    approach_outline: str        # ideal 2-3 sentence approach
    difficulty: str              # "warmup", "standard", "tricky"
    tags: list[str] = field(default_factory=list)


SCENARIOS: list[TrainingScenario] = [
    # -------------------------------------------------------------------------
    # SLIDING WINDOW triggers
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_01",
        description=(
            "Given a string, find the length of the longest substring that contains "
            "at most K distinct characters."
        ),
        constraints="1 <= len(s) <= 10^5, 1 <= K <= 26",
        example="s = 'eceba', K = 2 -> 3 ('ece')",
        primary_pattern="sliding_window",
        secondary_patterns=["hash_map"],
        key_signals=[
            "'longest substring' = contiguous = window",
            "'at most K distinct' = variable window with a constraint to maintain",
            "Expand right, contract left when constraint violated",
        ],
        approach_outline=(
            "Use a variable-size sliding window with a hash map tracking character counts. "
            "Expand right to add characters. When distinct count exceeds K, contract left "
            "until constraint is restored. Track max window size throughout."
        ),
        difficulty="warmup",
        tags=["sliding_window", "hash_map", "strings"],
    ),
    TrainingScenario(
        id="tr_02",
        description=(
            "Given an array of integers and a target sum, find the minimum length "
            "subarray whose sum is greater than or equal to the target. "
            "Return 0 if no such subarray exists."
        ),
        constraints="1 <= len(nums) <= 10^5, nums[i] > 0, target > 0",
        example="nums = [2,3,1,2,4,3], target = 7 -> 2 ([4,3])",
        primary_pattern="sliding_window",
        secondary_patterns=["two_pointers"],
        key_signals=[
            "'subarray' = contiguous = sliding window",
            "'minimum length' with a sum constraint = variable window (shrinkable)",
            "All positive: window sum only grows when expanding, shrinks when contracting",
        ],
        approach_outline=(
            "Variable-size sliding window. Expand right adding to running sum. "
            "While sum >= target, update minimum length and contract left. "
            "The all-positive constraint ensures monotonic behavior."
        ),
        difficulty="warmup",
        tags=["sliding_window", "two_pointers"],
    ),

    # -------------------------------------------------------------------------
    # TWO POINTERS triggers
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_03",
        description=(
            "Given a sorted array of integers, find all unique triplets that sum to zero."
        ),
        constraints="0 <= len(nums) <= 3000, -10^5 <= nums[i] <= 10^5",
        example="nums = [-1,0,1,2,-1,-4] -> [[-1,-1,2],[-1,0,1]]",
        primary_pattern="two_pointers",
        secondary_patterns=["hash_map"],
        key_signals=[
            "'sorted array' + 'find pairs/triplets' = two pointers",
            "Fix one element, use two pointers on the rest for a 2Sum",
            "'unique triplets' = need to skip duplicates",
        ],
        approach_outline=(
            "Sort the array. For each element i, use two pointers (left=i+1, right=end) "
            "to find pairs summing to -nums[i]. Skip duplicates at all three levels. "
            "O(n^2) time."
        ),
        difficulty="standard",
        tags=["two_pointers", "sorting"],
    ),
    TrainingScenario(
        id="tr_04",
        description=(
            "Given a linked list, determine if it has a cycle. "
            "If so, return the node where the cycle begins."
        ),
        constraints="0 <= number of nodes <= 10^4",
        example="head = [3,2,0,-4] with tail connecting to node index 1 -> node with value 2",
        primary_pattern="two_pointers",
        secondary_patterns=[],
        key_signals=[
            "'linked list' + 'cycle' = fast/slow pointers (Floyd's algorithm)",
            "Phase 1: detect cycle (fast meets slow)",
            "Phase 2: find entry point (reset one pointer to head, advance both by 1)",
        ],
        approach_outline=(
            "Floyd's cycle detection: slow moves 1 step, fast moves 2 steps. "
            "If they meet, reset slow to head and advance both by 1 until they meet "
            "again — that's the cycle entry point."
        ),
        difficulty="standard",
        tags=["two_pointers", "linked_list"],
    ),

    # -------------------------------------------------------------------------
    # BINARY SEARCH triggers
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_05",
        description=(
            "Koko loves bananas. There are n piles, the i-th pile has piles[i] bananas. "
            "Guards will come back in h hours. Koko can eat at speed K bananas/hour "
            "(one pile at a time). Find the minimum integer K such that she can eat all "
            "bananas within h hours."
        ),
        constraints="1 <= piles.length <= 10^4, 1 <= piles[i] <= 10^9, piles.length <= h <= 10^9",
        example="piles = [3,6,7,11], h = 8 -> 4",
        primary_pattern="binary_search",
        secondary_patterns=[],
        key_signals=[
            "'find minimum X such that condition is satisfied' = binary search on the answer",
            "Search space: K ranges from 1 to max(piles)",
            "Condition is monotonic: if speed K works, any K' > K also works",
        ],
        approach_outline=(
            "Binary search on the answer (eating speed K). Search range [1, max(piles)]. "
            "For each candidate K, check if total hours = sum(ceil(pile/K)) <= h. "
            "Find the leftmost K where the check passes."
        ),
        difficulty="standard",
        tags=["binary_search"],
    ),
    TrainingScenario(
        id="tr_06",
        description=(
            "You are given a sorted array that has been rotated at some unknown pivot. "
            "For example, [0,1,2,4,5,6,7] might become [4,5,6,7,0,1,2]. "
            "Find the minimum element. No duplicates."
        ),
        constraints="1 <= len(nums) <= 5000",
        example="nums = [3,4,5,1,2] -> 1",
        primary_pattern="binary_search",
        secondary_patterns=[],
        key_signals=[
            "'sorted + rotated' is a classic binary search variant",
            "One half is always sorted — compare mid with right to decide which half",
            "O(log n) expected",
        ],
        approach_outline=(
            "Binary search. Compare nums[mid] with nums[right]. "
            "If nums[mid] > nums[right], minimum is in right half (lo = mid+1). "
            "Otherwise, minimum is in left half including mid (hi = mid)."
        ),
        difficulty="standard",
        tags=["binary_search"],
    ),

    # -------------------------------------------------------------------------
    # GRAPH / BFS / DFS triggers
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_07",
        description=(
            "You have a lock with 4 circular wheels, each with digits 0-9. "
            "Starting at '0000', each move rotates one wheel by one slot. "
            "Given a list of deadend combinations (cannot visit) and a target, "
            "find the minimum number of moves to reach the target, or -1 if impossible."
        ),
        constraints="deadends length <= 500, target is a 4-digit string",
        example="deadends = ['0201','0101','0102','1212','2002'], target = '0202' -> 6",
        primary_pattern="bfs",
        secondary_patterns=[],
        key_signals=[
            "'minimum number of moves' = shortest path = BFS",
            "State space: each lock combination is a node",
            "Edges: rotate one wheel up or down (8 neighbors per state)",
            "Deadends = blocked nodes in the graph",
        ],
        approach_outline=(
            "BFS from '0000'. Each state has 8 neighbors (4 wheels x 2 directions). "
            "Use a visited set initialized with deadends. Return depth when target is "
            "reached, or -1 if queue empties."
        ),
        difficulty="standard",
        tags=["bfs", "graph"],
    ),
    TrainingScenario(
        id="tr_08",
        description=(
            "Given a reference to a node in a connected undirected graph, "
            "return a deep copy (clone) of the graph."
        ),
        constraints="Number of nodes <= 100, node values are unique",
        example="Node 1 connected to 2 and 4, etc. -> cloned graph",
        primary_pattern="dfs",
        secondary_patterns=["bfs", "hash_map"],
        key_signals=[
            "'Clone/copy a graph' = DFS/BFS traversal + hash map for visited/cloned nodes",
            "Need to map original node -> cloned node to handle cycles",
            "Either DFS or BFS works",
        ],
        approach_outline=(
            "DFS with a hash map mapping original nodes to their clones. "
            "For each node: create clone, store in map, recursively clone all neighbors. "
            "If neighbor already in map, reuse existing clone (handles cycles)."
        ),
        difficulty="warmup",
        tags=["dfs", "bfs", "hash_map"],
    ),

    # -------------------------------------------------------------------------
    # TOPOLOGICAL SORT triggers
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_09",
        description=(
            "There are n tasks labeled 0 to n-1. Some tasks have prerequisites: "
            "prerequisite[i] = [a, b] means you must finish task b before task a. "
            "Determine if it is possible to finish all tasks."
        ),
        constraints="1 <= n <= 2000, 0 <= prerequisites.length <= 5000",
        example="n = 2, prerequisites = [[1,0]] -> True",
        primary_pattern="topological_sort",
        secondary_patterns=["dfs", "bfs"],
        key_signals=[
            "'prerequisites' / 'must finish X before Y' = dependency graph = topological sort",
            "'Is it possible to finish all?' = 'does a valid topological order exist?' = 'is the graph a DAG?'",
            "Cycle in the dependency graph means impossible",
        ],
        approach_outline=(
            "Build a directed graph from prerequisites. Run topological sort (Kahn's BFS "
            "or DFS). If all nodes are included in the result, return True. If cycle "
            "detected (not all nodes processed), return False."
        ),
        difficulty="warmup",
        tags=["topological_sort", "graph"],
    ),

    # -------------------------------------------------------------------------
    # DP triggers
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_10",
        description=(
            "You are a robber planning to rob houses along a street. Each house has a "
            "certain amount of money. Adjacent houses have connected security systems — "
            "if two adjacent houses are robbed, the police will be alerted. "
            "Find the maximum amount you can rob without alerting the police."
        ),
        constraints="1 <= len(nums) <= 100, 0 <= nums[i] <= 400",
        example="nums = [1,2,3,1] -> 4 (rob house 1 and 3)",
        primary_pattern="dp",
        secondary_patterns=["greedy"],
        key_signals=[
            "'maximum amount' with a constraint = optimization = likely DP",
            "Decision at each house: rob it (skip previous) or skip it (keep previous best)",
            "Overlapping subproblems: optimal for houses 0..i depends on 0..i-1 and 0..i-2",
        ],
        approach_outline=(
            "1D DP. dp[i] = max money from houses 0..i. "
            "dp[i] = max(dp[i-1], dp[i-2] + nums[i]). "
            "Take or skip. Can optimize to O(1) space with two variables."
        ),
        difficulty="warmup",
        tags=["dp"],
    ),
    TrainingScenario(
        id="tr_11",
        description=(
            "Given a string s and a dictionary of words, add spaces to s to construct "
            "a sentence where each word is in the dictionary. Return all possible sentences."
        ),
        constraints="1 <= len(s) <= 20, 1 <= len(wordDict) <= 1000",
        example="s = 'catsanddog', wordDict = ['cat','cats','and','sand','dog'] -> ['cats and dog', 'cat sand dog']",
        primary_pattern="backtracking",
        secondary_patterns=["dp"],
        key_signals=[
            "'Return ALL possible' = enumeration = backtracking",
            "But overlapping subproblems exist (same suffix explored multiple times) = memoization helps",
            "This is backtracking + memoization, not pure DP (need all solutions, not just count)",
        ],
        approach_outline=(
            "Backtracking with memoization. At each position, try all dictionary words that "
            "match the current prefix. Recurse on the remaining suffix. Memoize results "
            "for each start position to avoid recomputation."
        ),
        difficulty="tricky",
        tags=["backtracking", "dp", "hash_map"],
    ),
    TrainingScenario(
        id="tr_12",
        description=(
            "Given an array of coin denominations and an amount, return the minimum "
            "number of coins needed to make that amount. If it cannot be made, return -1."
        ),
        constraints="1 <= coins.length <= 12, 1 <= amount <= 10^4",
        example="coins = [1,5,11], amount = 15 -> 3 (5+5+5)",
        primary_pattern="dp",
        secondary_patterns=["greedy"],
        key_signals=[
            "'minimum number' = optimization",
            "Greedy doesn't work here (e.g., greedy picks 11+1+1+1+1 = 5 coins, but 5+5+5 = 3)",
            "Overlapping subproblems: dp[amount] depends on dp[amount - coin] for each coin",
        ],
        approach_outline=(
            "Unbounded knapsack DP. dp[i] = min coins for amount i. "
            "dp[0] = 0. dp[i] = min(dp[i - coin] + 1) for each coin <= i. "
            "If dp[amount] is still infinity, return -1."
        ),
        difficulty="standard",
        tags=["dp"],
    ),

    # -------------------------------------------------------------------------
    # HEAP triggers
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_13",
        description=(
            "Given a list of points in the plane, find the K points closest to the origin."
        ),
        constraints="1 <= K <= len(points) <= 10^4",
        example="points = [[1,3],[-2,2]], K = 1 -> [[-2,2]]",
        primary_pattern="heap",
        secondary_patterns=[],
        key_signals=[
            "'K closest/largest/smallest' = heap of size K or quickselect",
            "Maintain a max-heap of size K: if new point is closer, pop max and push new",
            "Alternative: use heapq.nsmallest",
        ],
        approach_outline=(
            "Use a max-heap of size K. For each point, compute distance and push to heap. "
            "If heap exceeds size K, pop the farthest. Final heap contains K closest. "
            "O(n log K) time."
        ),
        difficulty="warmup",
        tags=["heap"],
    ),

    # -------------------------------------------------------------------------
    # MONOTONIC STACK triggers
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_14",
        description=(
            "Given a list of daily temperatures, return a list where result[i] is the "
            "number of days until a warmer temperature. If no warmer day, put 0."
        ),
        constraints="1 <= len(temperatures) <= 10^5",
        example="temperatures = [73,74,75,71,69,72,76,73] -> [1,1,4,2,1,1,0,0]",
        primary_pattern="monotonic_stack",
        secondary_patterns=[],
        key_signals=[
            "'next warmer/greater' = classic monotonic stack trigger",
            "For each element, find the next element that is greater",
            "Stack stores indices in decreasing temperature order",
        ],
        approach_outline=(
            "Monotonic decreasing stack of indices. For each day, while stack top has lower "
            "temperature, pop it — current day is the answer for the popped day. "
            "Push current index. O(n) time."
        ),
        difficulty="warmup",
        tags=["monotonic_stack"],
    ),

    # -------------------------------------------------------------------------
    # UNION FIND triggers
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_15",
        description=(
            "Given a list of edges for an undirected graph with n nodes, find the one "
            "edge that, if removed, would make the graph a tree (i.e., the redundant edge "
            "that creates a cycle)."
        ),
        constraints="n = number of edges = number of nodes, 3 <= n <= 1000",
        example="edges = [[1,2],[1,3],[2,3]] -> [2,3]",
        primary_pattern="union_find",
        secondary_patterns=["dfs"],
        key_signals=[
            "'redundant edge' / 'edge that creates a cycle' = Union Find",
            "Process edges one by one. If both nodes already connected, that's the redundant edge",
            "Tree has exactly n-1 edges for n nodes",
        ],
        approach_outline=(
            "Process edges in order using Union Find. For each edge (u, v): "
            "if find(u) == find(v), this edge creates a cycle — return it. "
            "Otherwise, union(u, v)."
        ),
        difficulty="standard",
        tags=["union_find", "graph"],
    ),

    # -------------------------------------------------------------------------
    # TRIE triggers
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_16",
        description=(
            "Design a data structure that supports adding words and searching for words. "
            "The search can contain '.' which matches any single letter. "
            "Example: addWord('bad'), search('.ad') -> True, search('b..') -> True"
        ),
        constraints="1 <= word.length <= 25, words contain lowercase letters and '.'",
        example="addWord('bad'), addWord('dad'), search('.ad') -> True, search('b.') -> False",
        primary_pattern="trie",
        secondary_patterns=["dfs", "backtracking"],
        key_signals=[
            "'add words and search' with prefix-like behavior = Trie",
            "'.' wildcard requires DFS through all children at that level",
            "Without wildcards it would be a simple hash set, but '.' makes Trie necessary",
        ],
        approach_outline=(
            "Build a Trie with insert as normal. For search: if character is '.', "
            "recurse into ALL children. Otherwise, follow the specific child. "
            "Return True only if you reach an end-of-word node."
        ),
        difficulty="standard",
        tags=["trie", "dfs"],
    ),

    # -------------------------------------------------------------------------
    # PREFIX SUM triggers
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_17",
        description=(
            "Given a binary array nums (only 0s and 1s), find the maximum length of a "
            "contiguous subarray with an equal number of 0s and 1s."
        ),
        constraints="1 <= len(nums) <= 10^5",
        example="nums = [0,1,0] -> 2",
        primary_pattern="prefix_sum",
        secondary_patterns=["hash_map"],
        key_signals=[
            "'contiguous subarray' with a sum condition looks like sliding window BUT...",
            "Transform: replace 0 with -1. Now 'equal 0s and 1s' = 'subarray sum = 0'",
            "'Subarray sum = K' with both positive and negative = prefix sum + hash map",
            "Sliding window FAILS here because elements can be negative after transform",
        ],
        approach_outline=(
            "Replace 0s with -1s. Now find the longest subarray with sum 0. "
            "Use prefix sum + hash map: store first occurrence of each prefix sum. "
            "If same prefix sum seen again, the subarray between them sums to 0."
        ),
        difficulty="tricky",
        tags=["prefix_sum", "hash_map"],
    ),

    # -------------------------------------------------------------------------
    # TRICKY / MULTI-PATTERN
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_18",
        description=(
            "Given n non-negative integers representing an elevation map, "
            "compute how much water it can trap after raining."
        ),
        constraints="n <= 2 * 10^4, 0 <= height[i] <= 10^5",
        example="height = [0,1,0,2,1,0,1,3,2,1,2,1] -> 6",
        primary_pattern="two_pointers",
        secondary_patterns=["monotonic_stack", "dp"],
        key_signals=[
            "Multiple valid approaches — this is a pattern recognition test!",
            "Approach 1 (DP): precompute max_left[] and max_right[], water[i] = min(maxL, maxR) - h[i]",
            "Approach 2 (Two pointers): O(1) space, maintain max_left and max_right from both ends",
            "Approach 3 (Monotonic stack): process bars, pop when current > stack top",
            "The two-pointer approach is optimal (O(n) time, O(1) space)",
        ],
        approach_outline=(
            "Two pointers from both ends. Track max_left and max_right. "
            "Process from the side with the smaller max: that side's water is determined. "
            "Water at position = smaller_max - height. Move that pointer inward."
        ),
        difficulty="tricky",
        tags=["two_pointers", "monotonic_stack", "dp"],
    ),
    TrainingScenario(
        id="tr_19",
        description=(
            "Given a 2D matrix of 0s and 1s, find the largest rectangle containing only 1s."
        ),
        constraints="rows <= 200, cols <= 200",
        example="matrix = [['1','0','1','0','0'],['1','0','1','1','1'],['1','1','1','1','1'],['1','0','0','1','0']] -> 6",
        primary_pattern="monotonic_stack",
        secondary_patterns=["dp"],
        key_signals=[
            "This REDUCES to 'largest rectangle in histogram'",
            "Key insight: for each row, compute the histogram of heights (consecutive 1s above)",
            "Then apply the monotonic stack histogram algorithm to each row",
            "Reduction is the hard part — the algorithm itself is a known pattern",
        ],
        approach_outline=(
            "Build a heights array for each row: if cell is '1', height = previous row height + 1, "
            "else height = 0. For each row, run largest-rectangle-in-histogram using a monotonic "
            "stack. Track the global maximum."
        ),
        difficulty="tricky",
        tags=["monotonic_stack", "dp", "matrix"],
    ),
    TrainingScenario(
        id="tr_20",
        description=(
            "Given a string containing just '(', ')' and '*', determine if the string is valid. "
            "'*' can be treated as '(' or ')' or an empty string."
        ),
        constraints="1 <= len(s) <= 100",
        example="s = '(*))' -> True",
        primary_pattern="greedy",
        secondary_patterns=["dp"],
        key_signals=[
            "Looks like a stack problem (parentheses) but '*' adds ambiguity",
            "Key insight: track a RANGE [lo, hi] of possible open paren counts",
            "'(' increases both, ')' decreases both, '*' decreases lo and increases hi",
            "If hi ever goes negative, invalid. Clamp lo at 0. Valid if lo == 0 at end.",
            "This is greedy (tracking bounds), not stack-based",
        ],
        approach_outline=(
            "Greedy with range tracking. Maintain lo (min possible open parens) and "
            "hi (max possible open parens). '(' -> both++, ')' -> both--, '*' -> lo--, hi++. "
            "Clamp lo at 0. If hi < 0 at any point, return False. Return lo == 0 at end."
        ),
        difficulty="tricky",
        tags=["greedy"],
    ),

    # -------------------------------------------------------------------------
    # DIJKSTRA triggers
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_21",
        description=(
            "There are n network nodes labeled 1 to n. Given a list of travel times as "
            "directed edges times[i] = (ui, vi, wi) where wi is the time from ui to vi, "
            "find the time it takes for a signal sent from node k to reach all nodes. "
            "Return -1 if not all nodes are reachable."
        ),
        constraints="1 <= n <= 100, 1 <= len(times) <= 6000",
        example="times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2 -> 2",
        primary_pattern="dijkstra",
        secondary_patterns=["bfs", "heap"],
        key_signals=[
            "'weighted directed graph' + 'minimum time to reach' = Dijkstra",
            "'signal reaches all nodes' = max of shortest paths to all nodes",
            "Non-negative weights confirmed by 'travel times'",
        ],
        approach_outline=(
            "Run Dijkstra from node k. Find shortest path to every node. "
            "Answer = max of all shortest paths. If any node is unreachable, return -1."
        ),
        difficulty="standard",
        tags=["dijkstra", "heap", "graph"],
    ),

    # -------------------------------------------------------------------------
    # BACKTRACKING triggers
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_22",
        description=(
            "Given n pairs of parentheses, generate all combinations of well-formed parentheses."
        ),
        constraints="1 <= n <= 8",
        example="n = 3 -> ['((()))','(()())','(())()','()(())','()()()']",
        primary_pattern="backtracking",
        secondary_patterns=[],
        key_signals=[
            "'generate ALL combinations' = enumeration = backtracking",
            "Constraint: at any point, open count >= close count",
            "Two choices at each step: add '(' (if open < n) or add ')' (if close < open)",
        ],
        approach_outline=(
            "Backtracking with two counters: open and close. "
            "At each step: can add '(' if open < n, can add ')' if close < open. "
            "Base case: length == 2n, add to results."
        ),
        difficulty="warmup",
        tags=["backtracking"],
    ),

    # -------------------------------------------------------------------------
    # HASH MAP as primary pattern
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_23",
        description=(
            "Given an unsorted array of integers, find the length of the longest "
            "consecutive elements sequence. Must run in O(n) time."
        ),
        constraints="0 <= len(nums) <= 10^5",
        example="nums = [100,4,200,1,3,2] -> 4 (sequence [1,2,3,4])",
        primary_pattern="hash_map",
        secondary_patterns=["union_find"],
        key_signals=[
            "'O(n) time' rules out sorting (O(n log n))",
            "'Consecutive sequence' = for each potential start, check how far it extends",
            "Hash set for O(1) 'is x+1 in the set?' lookups",
            "Only start counting from elements where x-1 is NOT in the set (sequence start)",
        ],
        approach_outline=(
            "Put all numbers in a hash set. For each number that is a sequence start "
            "(num-1 not in set), count consecutive elements forward. Track maximum length. "
            "Each element is visited at most twice, so O(n) total."
        ),
        difficulty="standard",
        tags=["hash_map"],
    ),

    # -------------------------------------------------------------------------
    # GREEDY triggers
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_24",
        description=(
            "Given a collection of intervals, find the minimum number of intervals "
            "you need to remove to make the rest non-overlapping."
        ),
        constraints="1 <= len(intervals) <= 10^5",
        example="intervals = [[1,2],[2,3],[3,4],[1,3]] -> 1 (remove [1,3])",
        primary_pattern="greedy",
        secondary_patterns=[],
        key_signals=[
            "'intervals' + 'non-overlapping' = interval scheduling",
            "Equivalent to: find maximum number of non-overlapping intervals (greedy)",
            "Answer = total - max non-overlapping",
            "Sort by END time, greedily select non-overlapping (classic)",
        ],
        approach_outline=(
            "Sort intervals by end time. Greedily pick intervals that don't overlap "
            "with the last selected. Count selected. Answer = total - selected."
        ),
        difficulty="standard",
        tags=["greedy", "sorting"],
    ),

    # -------------------------------------------------------------------------
    # MORE TRICKY SCENARIOS
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_25",
        description=(
            "Given a string s and a list of words (all same length), find all starting "
            "indices of substrings in s that are a concatenation of each word in words "
            "exactly once, in any order."
        ),
        constraints="1 <= len(s) <= 10^4, 1 <= len(words) <= 5000, all words same length",
        example="s = 'barfoothefoobarman', words = ['foo','bar'] -> [0, 9]",
        primary_pattern="sliding_window",
        secondary_patterns=["hash_map"],
        key_signals=[
            "'substring' + 'concatenation' = contiguous = window",
            "All words same length is a huge hint: window size = len(words) * word_length",
            "Track word frequency in window vs. required frequency",
            "Multiple starting offsets (0 to word_length-1) to handle alignment",
        ],
        approach_outline=(
            "Fixed window of size len(words) * word_length. Slide by word_length steps. "
            "Use hash map to count words in current window vs. required. "
            "Run for each starting offset 0..word_length-1."
        ),
        difficulty="tricky",
        tags=["sliding_window", "hash_map"],
    ),

    # -------------------------------------------------------------------------
    # STAFF-EXPANSION PATTERNS (17–21)
    # -------------------------------------------------------------------------
    TrainingScenario(
        id="tr_26",
        description=(
            "Koko has piles of bananas. She chooses an integer eating speed k "
            "(bananas per hour). Each hour she chooses one pile and eats min(k, pile) "
            "from it. Find the minimum k such that she can finish all piles within h hours."
        ),
        constraints="1 <= len(piles) <= 10^4, piles[i], h up to 10^9; h >= len(piles)",
        example="piles = [3,6,7,11], h = 8 -> 4",
        primary_pattern="binary_search_answer",
        secondary_patterns=["binary_search"],
        key_signals=[
            "Minimize a numeric capacity/speed with a yes/no feasibility check",
            "can(k) is monotone: if speed k works, k+1 also works",
            "Answer space is huge (up to max(piles)) → log search, not linear",
            "Not searching an index in a sorted array — searching the answer itself",
        ],
        approach_outline=(
            "Binary search k in [1, max(piles)]. can(k) = sum(ceil(p/k)) <= h. "
            "Return the minimal feasible k."
        ),
        difficulty="standard",
        tags=["binary_search_answer", "optimization"],
    ),
    TrainingScenario(
        id="tr_27",
        description=(
            "Given meeting time intervals, find the minimum number of conference rooms "
            "required (i.e., the maximum number of meetings happening at the same time)."
        ),
        constraints="1 <= n <= 10^4 intervals",
        example="[[0,30],[5,10],[15,20]] -> 2",
        primary_pattern="sweep_line",
        secondary_patterns=["heap", "greedy"],
        key_signals=[
            "'concurrent' / 'rooms needed' = max overlap on a timeline",
            "Turn starts/ends into events and sweep",
            "Alternative: sort starts + min-heap of end times",
            "Not merge-intervals (that asks for union, not concurrency)",
        ],
        approach_outline=(
            "Create +1 at start and -1 at end events; sort; scan tracking active count. "
            "Or: sort by start, heap of ends — rooms = heap size peak."
        ),
        difficulty="standard",
        tags=["sweep_line", "intervals"],
    ),
    TrainingScenario(
        id="tr_28",
        description=(
            "Given the head of a singly linked list, reverse the list in-place and "
            "return the new head. Follow-up: detect whether the list contains a cycle "
            "in O(1) extra space."
        ),
        constraints="0 <= n <= 5000 nodes",
        example="1->2->3->None becomes 3->2->1->None",
        primary_pattern="linked_list",
        secondary_patterns=["two_pointers"],
        key_signals=[
            "ListNode / reverse / cycle keywords",
            "prev/cur/next rewiring for reverse",
            "Floyd tortoise-hare for cycle",
            "Dummy head when the head pointer may change (delete/reorder)",
        ],
        approach_outline=(
            "Reverse: prev=None, cur=head; while cur: nxt=cur.next; cur.next=prev; "
            "prev,cur=cur,nxt; return prev. Cycle: slow/fast until meet or null."
        ),
        difficulty="easy",
        tags=["linked_list", "two_pointers"],
    ),
    TrainingScenario(
        id="tr_29",
        description=(
            "Every element in an array appears twice except for one. Find that single "
            "element in linear time and constant extra space."
        ),
        constraints="1 <= n <= 3*10^4",
        example="[4,1,2,1,2] -> 4",
        primary_pattern="bit_manipulation",
        secondary_patterns=["hash_map"],
        key_signals=[
            "Pairs cancel → XOR",
            "O(1) space rules out a hash set of seen values (as the intended solution)",
            "a^a=0, a^0=a",
            "Bit tricks also appear in bitmask DP / flag packing",
        ],
        approach_outline="XOR all elements; pairs cancel leaving the unique value.",
        difficulty="easy",
        tags=["bit_manipulation"],
    ),
    TrainingScenario(
        id="tr_30",
        description=(
            "You have an array of length n initialized to zeros. You receive many "
            "updates of the form: add val to every index from L to R inclusive. "
            "Return the array after applying all updates efficiently."
        ),
        constraints="1 <= n, updates <= 10^4; naive O(n*u) may TLE",
        example="n=5, updates=[[1,3,2],[2,4,3]] -> [0,2,5,5,3]",
        primary_pattern="difference_array",
        secondary_patterns=["prefix_sum", "sweep_line"],
        key_signals=[
            "Many range *writes*, then read the final array",
            "Inverse of prefix sums: +val at L, -val at R+1",
            "Not segment tree unless you need interleaved point queries",
            "Staff analogue: batch range config changes, then materialize",
        ],
        approach_outline=(
            "diff[L]+=val; diff[R+1]-=val for each update; reconstruct with a "
            "running prefix sum over diff."
        ),
        difficulty="standard",
        tags=["difference_array", "prefix_sum"],
    ),
]


@dataclass
class TrainingResult:
    scenario: TrainingScenario
    user_pattern: str
    correct: bool
    time_seconds: float
    user_approach: str = ""


@dataclass
class TrainingReport:
    timestamp: str
    total: int
    correct: int
    accuracy: float
    results: list[TrainingResult]
    pattern_accuracy: dict[str, dict]  # pattern_id -> {correct, total, accuracy}
    weak_patterns: list[str]
    strong_patterns: list[str]


def _build_pattern_menu() -> tuple[dict[int, str], str]:
    """Build the numbered pattern selection menu."""
    menu_lines = ["  Choose the PRIMARY pattern:\n"]
    num_to_pattern = {}
    for i, p in enumerate(PATTERNS, 1):
        menu_lines.append(f"    {i:2d}. {p.name}")
        num_to_pattern[i] = p.id
    menu_lines.append("")
    return num_to_pattern, "\n".join(menu_lines)


def _parse_pattern_input(user_input: str, num_to_pattern: dict[int, str]) -> str | None:
    """Parse user input as either a number or pattern name/id."""
    user_input = user_input.strip()

    # Try as number
    try:
        num = int(user_input)
        return num_to_pattern.get(num)
    except ValueError:
        pass

    # Try as pattern ID or name (partial match)
    user_lower = user_input.lower()
    for p in PATTERNS:
        if user_lower == p.id or user_lower == p.name.lower():
            return p.id
        if user_lower in p.name.lower() or user_lower in p.id:
            return p.id

    return None


def run_training(
    scenarios: list[TrainingScenario] | None = None,
    shuffle: bool = True,
    limit: int | None = None,
) -> TrainingReport:
    """Run an interactive pattern recognition training session."""
    if scenarios is None:
        scenarios = SCENARIOS[:]
    if shuffle:
        random.shuffle(scenarios)
    if limit:
        scenarios = scenarios[:limit]

    num_to_pattern, menu_text = _build_pattern_menu()
    results: list[TrainingResult] = []

    print("\n" + "=" * 70)
    print("  PATTERN RECOGNITION TRAINER")
    print("=" * 70)
    print("\n  For each problem, identify the PRIMARY algorithm pattern.")
    print("  This trains your classification instinct — no coding required.")
    print("  Type 'tree' at any time to see the decision tree.")
    print("  Type 'q' to quit early.\n")

    for i, scenario in enumerate(scenarios, 1):
        print(f"{'=' * 70}")
        print(f"  Scenario {i}/{len(scenarios)} [{scenario.difficulty.upper()}]")
        print(f"{'=' * 70}")
        print(f"\n  {scenario.description}")
        print(f"\n  Constraints: {scenario.constraints}")
        print(f"  Example: {scenario.example}")
        print()

        start_time = time.time()

        # Get pattern choice
        while True:
            print(menu_text)
            answer = input("  Your answer (number, name, 'tree', or 'q'): ").strip()

            if answer.lower() == 'q':
                print("\n  Training ended early.")
                return _build_report(results)

            if answer.lower() == 'tree':
                print(DECISION_TREE)
                continue

            pattern_id = _parse_pattern_input(answer, num_to_pattern)
            if pattern_id:
                break
            print("  Invalid input. Enter a number (1-16), pattern name, 'tree', or 'q'.\n")

        elapsed = time.time() - start_time

        # Check correctness
        correct = (
            pattern_id == scenario.primary_pattern
            or pattern_id in scenario.secondary_patterns
        )
        primary_name = get_pattern_by_id(scenario.primary_pattern).name
        user_name = get_pattern_by_id(pattern_id).name

        result = TrainingResult(
            scenario=scenario,
            user_pattern=pattern_id,
            correct=correct,
            time_seconds=elapsed,
        )
        results.append(result)

        # Feedback
        print()
        if correct:
            if pattern_id == scenario.primary_pattern:
                print(f"  CORRECT! {primary_name} is the primary pattern.")
            else:
                print(f"  ACCEPTABLE. {user_name} works, but the primary pattern is {primary_name}.")
        else:
            print(f"  INCORRECT. You said {user_name}, but the primary pattern is {primary_name}.")

        # Show why
        print(f"\n  KEY SIGNALS to recognize this pattern:")
        for signal in scenario.key_signals:
            print(f"    -> {signal}")

        print(f"\n  IDEAL APPROACH:")
        print(f"    {scenario.approach_outline}")

        if scenario.secondary_patterns:
            sec_names = [get_pattern_by_id(pid).name for pid in scenario.secondary_patterns]
            print(f"\n  Also valid / complementary: {', '.join(sec_names)}")

        print()
        input("  Press Enter to continue...")
        print()

    return _build_report(results)


def _build_report(results: list[TrainingResult]) -> TrainingReport:
    """Build training report from results."""
    total = len(results)
    correct = sum(1 for r in results if r.correct)
    accuracy = correct / max(total, 1)

    # Per-pattern accuracy
    pattern_stats: dict[str, dict] = {}
    for r in results:
        pid = r.scenario.primary_pattern
        if pid not in pattern_stats:
            pattern_stats[pid] = {"correct": 0, "total": 0}
        pattern_stats[pid]["total"] += 1
        if r.correct:
            pattern_stats[pid]["correct"] += 1

    for pid, stats in pattern_stats.items():
        stats["accuracy"] = stats["correct"] / stats["total"]

    weak = [pid for pid, s in pattern_stats.items() if s["accuracy"] < 0.5]
    strong = [pid for pid, s in pattern_stats.items() if s["accuracy"] >= 0.8]

    report = TrainingReport(
        timestamp=datetime.now().isoformat(),
        total=total,
        correct=correct,
        accuracy=accuracy,
        results=results,
        pattern_accuracy=pattern_stats,
        weak_patterns=weak,
        strong_patterns=strong,
    )

    return report


def format_training_report(report: TrainingReport) -> str:
    """Format training report for display."""
    lines = []
    lines.append("=" * 70)
    lines.append("  PATTERN RECOGNITION RESULTS")
    lines.append(f"  {report.timestamp}")
    lines.append("=" * 70)
    lines.append("")
    lines.append(f"  Overall: {report.correct}/{report.total} ({report.accuracy:.0%})")
    lines.append("")

    # Per-pattern breakdown
    lines.append("-" * 70)
    lines.append("  PATTERN BREAKDOWN")
    lines.append("-" * 70)
    for pid, stats in sorted(report.pattern_accuracy.items()):
        p = get_pattern_by_id(pid)
        name = p.name if p else pid
        acc = stats["accuracy"]
        level = "STRONG" if acc >= 0.8 else ("OK" if acc >= 0.5 else "WEAK")
        lines.append(
            f"  [{level:6s}] {name:<30} "
            f"{stats['correct']}/{stats['total']} ({acc:.0%})"
        )

    # Missed scenarios
    missed = [r for r in report.results if not r.correct]
    if missed:
        lines.append("")
        lines.append("-" * 70)
        lines.append("  MISSED SCENARIOS (review these)")
        lines.append("-" * 70)
        for r in missed:
            primary_name = get_pattern_by_id(r.scenario.primary_pattern).name
            user_name = get_pattern_by_id(r.user_pattern).name
            lines.append(f"  Scenario: {r.scenario.description[:60]}...")
            lines.append(f"    You said: {user_name}")
            lines.append(f"    Correct:  {primary_name}")
            lines.append(f"    Signals:  {r.scenario.key_signals[0]}")
            lines.append("")

    # Weak patterns
    if report.weak_patterns:
        lines.append("-" * 70)
        lines.append("  PATTERNS TO STUDY")
        lines.append("-" * 70)
        for pid in report.weak_patterns:
            p = get_pattern_by_id(pid)
            if p:
                lines.append(f"\n  >> {p.name}")
                lines.append(f"     When to use:")
                for signal in p.when_to_use[:3]:
                    lines.append(f"       - {signal}")

    lines.append("")
    lines.append("=" * 70)
    return "\n".join(lines)


def save_training_report(report: TrainingReport) -> Path:
    """Save training report as JSON."""
    RESULTS_DIR.mkdir(exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = RESULTS_DIR / f"training_{ts}.json"

    data = {
        "timestamp": report.timestamp,
        "total": report.total,
        "correct": report.correct,
        "accuracy": report.accuracy,
        "pattern_accuracy": report.pattern_accuracy,
        "weak_patterns": report.weak_patterns,
        "strong_patterns": report.strong_patterns,
        "missed": [
            {
                "scenario_id": r.scenario.id,
                "description": r.scenario.description[:80],
                "expected": r.scenario.primary_pattern,
                "user_said": r.user_pattern,
            }
            for r in report.results if not r.correct
        ],
    }
    filepath.write_text(json.dumps(data, indent=2))
    return filepath
