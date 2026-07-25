"""
Problem bank for staff-level algorithm assessment.
Each problem has: category, difficulty, description, function signature,
test cases, expected complexities, hints, and follow-up questions.
"""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class TestCase:
    inputs: dict[str, Any]
    expected: Any
    description: str = ""


@dataclass
class Problem:
    id: str
    category: str
    title: str
    difficulty: str  # "medium" or "hard"
    description: str
    function_name: str
    parameters: str  # e.g. "nums: list[int], target: int"
    return_type: str
    test_cases: list[TestCase]
    time_complexity: str
    space_complexity: str
    hints: list[str] = field(default_factory=list)
    time_limit_minutes: int = 25
    follow_up: str = ""
    tags: list[str] = field(default_factory=list)


PROBLEMS: list[Problem] = [
    # =========================================================================
    # ARRAYS & STRINGS
    # =========================================================================
    Problem(
        id="arr_01",
        category="Arrays & Strings",
        title="Longest Substring Without Repeating Characters",
        difficulty="medium",
        description=(
            "Given a string s, find the length of the longest substring "
            "without repeating characters."
        ),
        function_name="length_of_longest_substring",
        parameters="s: str",
        return_type="int",
        test_cases=[
            TestCase({"s": "abcabcbb"}, 3, "abc"),
            TestCase({"s": "bbbbb"}, 1, "single char repeated"),
            TestCase({"s": "pwwkew"}, 3, "wke"),
            TestCase({"s": ""}, 0, "empty string"),
            TestCase({"s": "abcdef"}, 6, "all unique"),
            TestCase({"s": "dvdf"}, 3, "tricky overlap"),
        ],
        time_complexity="O(n)",
        space_complexity="O(min(n, m)) where m is charset size",
        hints=[
            "Think about using a sliding window.",
            "A hash map can track the last index of each character.",
            "When you find a duplicate, move the left pointer past the previous occurrence.",
        ],
        tags=["sliding_window", "hash_map"],
        time_limit_minutes=20,
    ),
    Problem(
        id="arr_02",
        category="Arrays & Strings",
        title="Trapping Rain Water",
        difficulty="hard",
        description=(
            "Given n non-negative integers representing an elevation map where "
            "the width of each bar is 1, compute how much water it can trap after raining.\n\n"
            "Example: heights = [0,1,0,2,1,0,1,3,2,1,2,1] -> 6"
        ),
        function_name="trap",
        parameters="height: list[int]",
        return_type="int",
        test_cases=[
            TestCase({"height": [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]}, 6),
            TestCase({"height": [4, 2, 0, 3, 2, 5]}, 9),
            TestCase({"height": []}, 0, "empty"),
            TestCase({"height": [1, 2, 3, 4]}, 0, "ascending - no trap"),
            TestCase({"height": [4, 3, 2, 1]}, 0, "descending - no trap"),
            TestCase({"height": [5, 2, 1, 2, 1, 5]}, 14),
        ],
        time_complexity="O(n)",
        space_complexity="O(1) with two pointers, O(n) with prefix arrays",
        hints=[
            "Water at each position = min(max_left, max_right) - height[i].",
            "You can precompute max_left and max_right arrays.",
            "For O(1) space, use two pointers from both ends.",
        ],
        tags=["two_pointers", "stack", "prefix"],
        time_limit_minutes=25,
    ),
    Problem(
        id="arr_03",
        category="Arrays & Strings",
        title="Product of Array Except Self",
        difficulty="medium",
        description=(
            "Given an integer array nums, return an array answer such that answer[i] "
            "is equal to the product of all the elements of nums except nums[i].\n"
            "You must solve it in O(n) time and WITHOUT using division."
        ),
        function_name="product_except_self",
        parameters="nums: list[int]",
        return_type="list[int]",
        test_cases=[
            TestCase({"nums": [1, 2, 3, 4]}, [24, 12, 8, 6]),
            TestCase({"nums": [-1, 1, 0, -3, 3]}, [0, 0, 9, 0, 0]),
            TestCase({"nums": [2, 3]}, [3, 2]),
            TestCase({"nums": [0, 0]}, [0, 0]),
        ],
        time_complexity="O(n)",
        space_complexity="O(1) extra (output array doesn't count)",
        hints=[
            "Think about prefix and suffix products.",
            "First pass: build prefix products left to right.",
            "Second pass: multiply by suffix products right to left.",
        ],
        tags=["prefix", "arrays"],
        time_limit_minutes=20,
    ),

    # =========================================================================
    # SLIDING WINDOW / TWO POINTERS
    # =========================================================================
    Problem(
        id="sw_01",
        category="Sliding Window & Two Pointers",
        title="Minimum Window Substring",
        difficulty="hard",
        description=(
            "Given two strings s and t, return the minimum window substring of s "
            "such that every character in t (including duplicates) is included in the window. "
            "If there is no such substring, return the empty string.\n\n"
            "Example: s = 'ADOBECODEBANC', t = 'ABC' -> 'BANC'"
        ),
        function_name="min_window",
        parameters="s: str, t: str",
        return_type="str",
        test_cases=[
            TestCase({"s": "ADOBECODEBANC", "t": "ABC"}, "BANC"),
            TestCase({"s": "a", "t": "a"}, "a"),
            TestCase({"s": "a", "t": "aa"}, ""),
            TestCase({"s": "aa", "t": "aa"}, "aa"),
            TestCase({"s": "bba", "t": "ab"}, "ba"),
        ],
        time_complexity="O(|s| + |t|)",
        space_complexity="O(|s| + |t|)",
        hints=[
            "Use a sliding window with two pointers.",
            "Track character frequencies needed vs. found.",
            "Expand right to satisfy, contract left to minimize.",
        ],
        tags=["sliding_window", "hash_map"],
        time_limit_minutes=25,
    ),
    Problem(
        id="sw_02",
        category="Sliding Window & Two Pointers",
        title="Container With Most Water",
        difficulty="medium",
        description=(
            "Given n non-negative integers a1, a2, ..., an where each represents a point "
            "at coordinate (i, ai), find two lines which together with the x-axis form a "
            "container that holds the most water. Return the maximum amount of water."
        ),
        function_name="max_area",
        parameters="height: list[int]",
        return_type="int",
        test_cases=[
            TestCase({"height": [1, 8, 6, 2, 5, 4, 8, 3, 7]}, 49),
            TestCase({"height": [1, 1]}, 1),
            TestCase({"height": [4, 3, 2, 1, 4]}, 16),
            TestCase({"height": [1, 2, 1]}, 2),
        ],
        time_complexity="O(n)",
        space_complexity="O(1)",
        hints=[
            "Start with two pointers at both ends.",
            "Move the pointer pointing to the shorter line inward.",
            "Why does this greedy approach work?",
        ],
        tags=["two_pointers", "greedy"],
        time_limit_minutes=15,
    ),

    # =========================================================================
    # TREES
    # =========================================================================
    Problem(
        id="tree_01",
        category="Trees",
        title="Lowest Common Ancestor of a Binary Tree",
        difficulty="medium",
        description=(
            "Given a binary tree, find the lowest common ancestor (LCA) of two given nodes.\n\n"
            "The tree is provided as a list (level-order), and the two target values are given.\n"
            "Return the value of the LCA node.\n\n"
            "For this problem, a node is represented as [val, left, right] or None. "
            "The tree input is a level-order list where None indicates absence.\n"
            "Example: tree = [3,5,1,6,2,0,8,None,None,7,4], p = 5, q = 1 -> 3"
        ),
        function_name="lowest_common_ancestor",
        parameters="tree: list, p: int, q: int",
        return_type="int",
        test_cases=[
            TestCase(
                {"tree": [3, 5, 1, 6, 2, 0, 8, None, None, 7, 4], "p": 5, "q": 1},
                3,
            ),
            TestCase(
                {"tree": [3, 5, 1, 6, 2, 0, 8, None, None, 7, 4], "p": 5, "q": 4},
                5,
            ),
            TestCase({"tree": [1, 2], "p": 1, "q": 2}, 1),
        ],
        time_complexity="O(n)",
        space_complexity="O(n)",
        hints=[
            "Use recursion. If root is p or q, root is the LCA.",
            "Recurse left and right. If both return non-null, root is LCA.",
            "If only one side returns non-null, propagate it up.",
        ],
        tags=["recursion", "binary_tree", "dfs"],
        time_limit_minutes=20,
    ),
    Problem(
        id="tree_02",
        category="Trees",
        title="Serialize and Deserialize Binary Tree",
        difficulty="hard",
        description=(
            "Design an algorithm to serialize a binary tree to a string and "
            "deserialize that string back to the original tree.\n\n"
            "Implement two functions:\n"
            "  serialize(tree: list) -> str\n"
            "  deserialize(data: str) -> list\n\n"
            "The tree is given as a level-order list. Your serialized format is up to you, "
            "but deserialize(serialize(tree)) must return the original tree.\n\n"
            "For this assessment, implement a single function that takes a tree (level-order list), "
            "serializes it, deserializes it, and returns the reconstructed level-order list."
        ),
        function_name="serialize_deserialize",
        parameters="tree: list",
        return_type="list",
        test_cases=[
            TestCase(
                {"tree": [1, 2, 3, None, None, 4, 5]},
                [1, 2, 3, None, None, 4, 5],
            ),
            TestCase({"tree": []}, []),
            TestCase({"tree": [1]}, [1]),
            TestCase(
                {"tree": [1, 2, None, 3, None, 4]},
                [1, 2, None, 3, None, 4],
            ),
        ],
        time_complexity="O(n)",
        space_complexity="O(n)",
        hints=[
            "BFS (level-order) serialization maps naturally to the list representation.",
            "Use a delimiter for None nodes.",
            "A preorder DFS approach also works well with recursion.",
        ],
        tags=["binary_tree", "bfs", "design"],
        time_limit_minutes=30,
    ),

    # =========================================================================
    # GRAPHS
    # =========================================================================
    Problem(
        id="graph_01",
        category="Graphs",
        title="Course Schedule II (Topological Sort)",
        difficulty="medium",
        description=(
            "There are numCourses courses labeled 0 to numCourses-1. You are given "
            "a list of prerequisites where prerequisites[i] = [ai, bi] means you must "
            "take course bi before course ai.\n\n"
            "Return an ordering of courses you should take to finish all courses. "
            "If impossible, return an empty list.\n\n"
            "Example: numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]] -> [0,1,2,3] or [0,2,1,3]"
        ),
        function_name="find_order",
        parameters="numCourses: int, prerequisites: list[list[int]]",
        return_type="list[int]",
        test_cases=[
            TestCase(
                {"numCourses": 4, "prerequisites": [[1, 0], [2, 0], [3, 1], [3, 2]]},
                [0, 1, 2, 3],  # or [0,2,1,3] - validated by checker
                "diamond dependency",
            ),
            TestCase(
                {"numCourses": 2, "prerequisites": [[1, 0]]},
                [0, 1],
            ),
            TestCase(
                {"numCourses": 2, "prerequisites": [[1, 0], [0, 1]]},
                [],
                "cycle - impossible",
            ),
            TestCase(
                {"numCourses": 1, "prerequisites": []},
                [0],
            ),
        ],
        time_complexity="O(V + E)",
        space_complexity="O(V + E)",
        hints=[
            "This is a topological sort problem.",
            "Use Kahn's algorithm (BFS with in-degree tracking).",
            "Or use DFS with cycle detection and post-order collection.",
        ],
        tags=["topological_sort", "bfs", "dfs", "dag"],
        time_limit_minutes=25,
    ),
    Problem(
        id="graph_02",
        category="Graphs",
        title="Number of Islands",
        difficulty="medium",
        description=(
            "Given an m x n 2D grid of '1's (land) and '0's (water), "
            "count the number of islands. An island is surrounded by water "
            "and is formed by connecting adjacent lands horizontally or vertically."
        ),
        function_name="num_islands",
        parameters="grid: list[list[str]]",
        return_type="int",
        test_cases=[
            TestCase(
                {
                    "grid": [
                        ["1", "1", "1", "1", "0"],
                        ["1", "1", "0", "1", "0"],
                        ["1", "1", "0", "0", "0"],
                        ["0", "0", "0", "0", "0"],
                    ]
                },
                1,
            ),
            TestCase(
                {
                    "grid": [
                        ["1", "1", "0", "0", "0"],
                        ["1", "1", "0", "0", "0"],
                        ["0", "0", "1", "0", "0"],
                        ["0", "0", "0", "1", "1"],
                    ]
                },
                3,
            ),
            TestCase({"grid": [["0"]]}, 0),
            TestCase({"grid": [["1"]]}, 1),
        ],
        time_complexity="O(m * n)",
        space_complexity="O(m * n) worst case for recursion stack",
        hints=[
            "DFS or BFS from each unvisited '1'.",
            "Mark visited cells to avoid revisiting.",
            "Each DFS/BFS initiation counts as one island.",
        ],
        tags=["bfs", "dfs", "matrix"],
        time_limit_minutes=15,
    ),
    Problem(
        id="graph_03",
        category="Graphs",
        title="Alien Dictionary",
        difficulty="hard",
        description=(
            "There is a new alien language that uses the English alphabet, but the order "
            "of letters is unknown. You are given a list of strings words from the alien "
            "dictionary, sorted lexicographically by the alien language's rules.\n\n"
            "Return a string of the unique letters sorted in the alien language's order. "
            "If no valid order exists, return an empty string.\n\n"
            "Example: words = ['wrt','wrf','er','ett','rftt'] -> 'wertf'"
        ),
        function_name="alien_order",
        parameters="words: list[str]",
        return_type="str",
        test_cases=[
            TestCase(
                {"words": ["wrt", "wrf", "er", "ett", "rftt"]},
                "wertf",
            ),
            TestCase({"words": ["z", "x"]}, "zx"),
            TestCase({"words": ["z", "x", "z"]}, "", "cycle"),
            TestCase({"words": ["abc", "ab"]}, "", "invalid prefix"),
        ],
        time_complexity="O(C) where C is total length of all words",
        space_complexity="O(1) or O(U + min(U^2, N)) where U = unique chars",
        hints=[
            "Compare adjacent words to find ordering constraints.",
            "Build a directed graph of character ordering.",
            "Topological sort the graph. If cycle exists, return empty.",
        ],
        tags=["topological_sort", "graph", "hash_map"],
        time_limit_minutes=30,
    ),

    # =========================================================================
    # DYNAMIC PROGRAMMING
    # =========================================================================
    Problem(
        id="dp_01",
        category="Dynamic Programming",
        title="Longest Increasing Subsequence",
        difficulty="medium",
        description=(
            "Given an integer array nums, return the length of the longest "
            "strictly increasing subsequence.\n\n"
            "Follow-up: Can you solve it in O(n log n) time?"
        ),
        function_name="length_of_lis",
        parameters="nums: list[int]",
        return_type="int",
        test_cases=[
            TestCase({"nums": [10, 9, 2, 5, 3, 7, 101, 18]}, 4),
            TestCase({"nums": [0, 1, 0, 3, 2, 3]}, 4),
            TestCase({"nums": [7, 7, 7, 7]}, 1),
            TestCase({"nums": [1]}, 1),
            TestCase({"nums": [1, 2, 3, 4, 5]}, 5),
        ],
        time_complexity="O(n log n) optimal, O(n^2) acceptable",
        space_complexity="O(n)",
        hints=[
            "O(n^2): dp[i] = length of LIS ending at i.",
            "O(n log n): maintain a 'tails' array and use binary search.",
            "tails[i] = smallest tail element for increasing subsequence of length i+1.",
        ],
        tags=["dp", "binary_search"],
        time_limit_minutes=20,
    ),
    Problem(
        id="dp_02",
        category="Dynamic Programming",
        title="Edit Distance",
        difficulty="hard",
        description=(
            "Given two strings word1 and word2, return the minimum number of operations "
            "required to convert word1 to word2.\n\n"
            "Allowed operations: Insert a character, Delete a character, Replace a character."
        ),
        function_name="min_distance",
        parameters="word1: str, word2: str",
        return_type="int",
        test_cases=[
            TestCase({"word1": "horse", "word2": "ros"}, 3),
            TestCase({"word1": "intention", "word2": "execution"}, 5),
            TestCase({"word1": "", "word2": "abc"}, 3),
            TestCase({"word1": "abc", "word2": ""}, 3),
            TestCase({"word1": "abc", "word2": "abc"}, 0),
        ],
        time_complexity="O(m * n)",
        space_complexity="O(m * n), optimizable to O(min(m, n))",
        hints=[
            "Classic 2D DP. dp[i][j] = edit distance of word1[:i] and word2[:j].",
            "If chars match: dp[i][j] = dp[i-1][j-1].",
            "Otherwise: 1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]).",
        ],
        tags=["dp", "strings"],
        time_limit_minutes=20,
    ),
    Problem(
        id="dp_03",
        category="Dynamic Programming",
        title="Word Break",
        difficulty="medium",
        description=(
            "Given a string s and a dictionary of strings wordDict, return True "
            "if s can be segmented into a space-separated sequence of one or more "
            "dictionary words."
        ),
        function_name="word_break",
        parameters="s: str, wordDict: list[str]",
        return_type="bool",
        test_cases=[
            TestCase({"s": "leetcode", "wordDict": ["leet", "code"]}, True),
            TestCase({"s": "applepenapple", "wordDict": ["apple", "pen"]}, True),
            TestCase(
                {"s": "catsandog", "wordDict": ["cats", "dog", "sand", "and", "cat"]},
                False,
            ),
            TestCase({"s": "", "wordDict": ["a"]}, True),
            TestCase({"s": "a", "wordDict": []}, False),
        ],
        time_complexity="O(n^2 * k) where k is max word length",
        space_complexity="O(n)",
        hints=[
            "dp[i] = can s[:i] be segmented?",
            "For each position i, check all words that could end at i.",
            "Using a set for wordDict gives O(1) lookup.",
        ],
        tags=["dp", "strings", "hash_set"],
        time_limit_minutes=20,
    ),

    # =========================================================================
    # STACKS & QUEUES
    # =========================================================================
    Problem(
        id="stk_01",
        category="Stacks & Queues",
        title="Largest Rectangle in Histogram",
        difficulty="hard",
        description=(
            "Given an array of integers heights representing the histogram's bar heights "
            "where the width of each bar is 1, return the area of the largest rectangle "
            "in the histogram.\n\n"
            "Example: heights = [2,1,5,6,2,3] -> 10"
        ),
        function_name="largest_rectangle_area",
        parameters="heights: list[int]",
        return_type="int",
        test_cases=[
            TestCase({"heights": [2, 1, 5, 6, 2, 3]}, 10),
            TestCase({"heights": [2, 4]}, 4),
            TestCase({"heights": [1]}, 1),
            TestCase({"heights": [2, 1, 2]}, 3),
            TestCase({"heights": [1, 1, 1, 1]}, 4),
        ],
        time_complexity="O(n)",
        space_complexity="O(n)",
        hints=[
            "Use a monotonic stack (increasing heights).",
            "When you see a shorter bar, pop and calculate areas.",
            "The width extends from the current stack top to the current index.",
        ],
        tags=["monotonic_stack"],
        time_limit_minutes=25,
    ),
    Problem(
        id="stk_02",
        category="Stacks & Queues",
        title="Valid Parentheses with Wildcards",
        difficulty="medium",
        description=(
            "Given a string s containing '(', ')' and '*', where '*' can be treated "
            "as '(' or ')' or an empty string, determine if s is valid.\n\n"
            "A valid string means every '(' has a matching ')' and vice versa, "
            "in the correct order."
        ),
        function_name="check_valid_string",
        parameters="s: str",
        return_type="bool",
        test_cases=[
            TestCase({"s": "()"}, True),
            TestCase({"s": "(*)"}, True),
            TestCase({"s": "(*))"}, True),
            TestCase({"s": "(((*)"}, False),
            TestCase({"s": ""}, True),
            TestCase({"s": "***"}, True),
            TestCase({"s": "(((******))"}, True),
        ],
        time_complexity="O(n)",
        space_complexity="O(1)",
        hints=[
            "Track the range of possible open parentheses counts: [lo, hi].",
            "lo = min possible open count, hi = max possible open count.",
            "At each step: '(' increments both, ')' decrements both, '*' decrements lo and increments hi.",
        ],
        tags=["greedy", "stack"],
        time_limit_minutes=20,
    ),

    # =========================================================================
    # HEAPS / PRIORITY QUEUES
    # =========================================================================
    Problem(
        id="heap_01",
        category="Heaps & Priority Queues",
        title="Merge K Sorted Lists",
        difficulty="hard",
        description=(
            "You are given k sorted lists of integers. Merge all lists into one "
            "sorted list and return it.\n\n"
            "Example: lists = [[1,4,5],[1,3,4],[2,6]] -> [1,1,2,3,4,4,5,6]"
        ),
        function_name="merge_k_lists",
        parameters="lists: list[list[int]]",
        return_type="list[int]",
        test_cases=[
            TestCase(
                {"lists": [[1, 4, 5], [1, 3, 4], [2, 6]]},
                [1, 1, 2, 3, 4, 4, 5, 6],
            ),
            TestCase({"lists": []}, []),
            TestCase({"lists": [[]]}, []),
            TestCase({"lists": [[1], [2], [3]]}, [1, 2, 3]),
            TestCase({"lists": [[1, 2, 3]]}, [1, 2, 3]),
        ],
        time_complexity="O(N log k) where N is total elements, k is number of lists",
        space_complexity="O(k) for the heap",
        hints=[
            "Use a min-heap to always pick the smallest element.",
            "Push (value, list_index, element_index) tuples.",
            "Alternative: divide and conquer merge pairs of lists.",
        ],
        tags=["heap", "merge", "divide_and_conquer"],
        time_limit_minutes=25,
    ),
    Problem(
        id="heap_02",
        category="Heaps & Priority Queues",
        title="Find Median from Data Stream",
        difficulty="hard",
        description=(
            "Design a data structure that supports adding integers and finding "
            "the median of all elements added so far.\n\n"
            "Implement a class with:\n"
            "  __init__(self): Initialize.\n"
            "  add_num(self, num: int): Add an integer.\n"
            "  find_median(self) -> float: Return the median.\n\n"
            "For this assessment, implement a function that takes a list of operations "
            "and returns a list of medians after each add_num.\n"
            "Input: nums (list of integers to add one by one)\n"
            "Output: list of medians after each insertion"
        ),
        function_name="running_median",
        parameters="nums: list[int]",
        return_type="list[float]",
        test_cases=[
            TestCase({"nums": [1, 2]}, [1.0, 1.5]),
            TestCase({"nums": [1, 2, 3]}, [1.0, 1.5, 2.0]),
            TestCase({"nums": [6, 10, 2, 6, 5]}, [6.0, 8.0, 6.0, 6.0, 6.0]),
            TestCase({"nums": [1]}, [1.0]),
        ],
        time_complexity="O(log n) per add, O(1) per find_median",
        space_complexity="O(n)",
        hints=[
            "Use two heaps: a max-heap for the lower half, min-heap for the upper half.",
            "Balance them so they differ in size by at most 1.",
            "Median is either the top of the larger heap, or average of both tops.",
        ],
        tags=["heap", "design", "data_stream"],
        time_limit_minutes=25,
    ),

    # =========================================================================
    # BACKTRACKING
    # =========================================================================
    Problem(
        id="bt_01",
        category="Backtracking",
        title="Word Search",
        difficulty="medium",
        description=(
            "Given an m x n grid of characters and a string word, return True if "
            "word exists in the grid. The word can be constructed from letters of "
            "sequentially adjacent cells (horizontal or vertical). Each cell may only "
            "be used once."
        ),
        function_name="exist",
        parameters="board: list[list[str]], word: str",
        return_type="bool",
        test_cases=[
            TestCase(
                {
                    "board": [
                        ["A", "B", "C", "E"],
                        ["S", "F", "C", "S"],
                        ["A", "D", "E", "E"],
                    ],
                    "word": "ABCCED",
                },
                True,
            ),
            TestCase(
                {
                    "board": [
                        ["A", "B", "C", "E"],
                        ["S", "F", "C", "S"],
                        ["A", "D", "E", "E"],
                    ],
                    "word": "SEE",
                },
                True,
            ),
            TestCase(
                {
                    "board": [
                        ["A", "B", "C", "E"],
                        ["S", "F", "C", "S"],
                        ["A", "D", "E", "E"],
                    ],
                    "word": "ABCB",
                },
                False,
            ),
            TestCase({"board": [["A"]], "word": "A"}, True),
        ],
        time_complexity="O(m * n * 3^L) where L is word length",
        space_complexity="O(L) for recursion stack",
        hints=[
            "DFS from each cell that matches the first character.",
            "Mark cells as visited during exploration, unmark on backtrack.",
            "Prune early if remaining cells can't possibly match.",
        ],
        tags=["backtracking", "dfs", "matrix"],
        time_limit_minutes=20,
    ),
    Problem(
        id="bt_02",
        category="Backtracking",
        title="N-Queens",
        difficulty="hard",
        description=(
            "Place n queens on an n x n chessboard such that no two queens "
            "attack each other. Return the number of distinct solutions.\n\n"
            "Example: n = 4 -> 2"
        ),
        function_name="total_n_queens",
        parameters="n: int",
        return_type="int",
        test_cases=[
            TestCase({"n": 1}, 1),
            TestCase({"n": 4}, 2),
            TestCase({"n": 5}, 10),
            TestCase({"n": 8}, 92),
        ],
        time_complexity="O(n!)",
        space_complexity="O(n)",
        hints=[
            "Place queens row by row.",
            "Track which columns and diagonals are under attack.",
            "Two types of diagonals: (row-col) and (row+col).",
        ],
        tags=["backtracking", "recursion"],
        time_limit_minutes=25,
    ),

    # =========================================================================
    # GREEDY
    # =========================================================================
    Problem(
        id="gr_01",
        category="Greedy",
        title="Jump Game II",
        difficulty="medium",
        description=(
            "Given a 0-indexed array of non-negative integers nums where nums[i] "
            "represents the max jump length from index i, return the minimum number "
            "of jumps to reach nums[n-1]. You can assume you can always reach the last index.\n\n"
            "Example: nums = [2,3,1,1,4] -> 2"
        ),
        function_name="jump",
        parameters="nums: list[int]",
        return_type="int",
        test_cases=[
            TestCase({"nums": [2, 3, 1, 1, 4]}, 2),
            TestCase({"nums": [2, 3, 0, 1, 4]}, 2),
            TestCase({"nums": [1]}, 0),
            TestCase({"nums": [1, 2, 3]}, 2),
            TestCase({"nums": [10, 1, 1, 1, 1]}, 1),
        ],
        time_complexity="O(n)",
        space_complexity="O(1)",
        hints=[
            "Think of it as BFS levels - each jump is a level.",
            "Track the farthest you can reach in the current jump.",
            "When you reach the end of the current level, increment jumps.",
        ],
        tags=["greedy", "bfs"],
        time_limit_minutes=20,
    ),
    Problem(
        id="gr_02",
        category="Greedy",
        title="Task Scheduler",
        difficulty="medium",
        description=(
            "Given a list of CPU tasks (characters A-Z) and a cooldown period n, "
            "return the minimum number of intervals the CPU needs to complete all tasks.\n"
            "The same task must wait at least n intervals before repeating. "
            "The CPU can be idle during cooldown.\n\n"
            "Example: tasks = ['A','A','A','B','B','B'], n = 2 -> 8"
        ),
        function_name="least_interval",
        parameters="tasks: list[str], n: int",
        return_type="int",
        test_cases=[
            TestCase({"tasks": ["A", "A", "A", "B", "B", "B"], "n": 2}, 8),
            TestCase({"tasks": ["A", "A", "A", "B", "B", "B"], "n": 0}, 6),
            TestCase(
                {
                    "tasks": ["A", "A", "A", "A", "A", "A", "B", "C", "D", "E", "F", "G"],
                    "n": 2,
                },
                16,
            ),
            TestCase({"tasks": ["A"], "n": 5}, 1),
        ],
        time_complexity="O(n) where n is number of tasks",
        space_complexity="O(1) - at most 26 letters",
        hints=[
            "The most frequent task determines the minimum time.",
            "Formula: (max_count - 1) * (n + 1) + count_of_tasks_with_max_count.",
            "Answer is max of the formula and total number of tasks.",
        ],
        tags=["greedy", "math", "hash_map"],
        time_limit_minutes=20,
    ),

    # =========================================================================
    # LINKED LISTS
    # =========================================================================
    Problem(
        id="ll_01",
        category="Linked Lists",
        title="LRU Cache",
        difficulty="hard",
        description=(
            "Design a Least Recently Used (LRU) cache.\n\n"
            "Implement a function that processes a list of operations on an LRU cache "
            "and returns the results of get operations.\n\n"
            "Input:\n"
            "  capacity: int - the cache capacity\n"
            "  operations: list of [op, key] or [op, key, value]\n"
            "    op='put': insert/update key-value pair\n"
            "    op='get': return value or -1\n\n"
            "Return: list of results for get operations only.\n\n"
            "Example: capacity=2, operations=[['put',1,1],['put',2,2],['get',1],['put',3,3],['get',2]] -> [1,-1]"
        ),
        function_name="lru_cache",
        parameters="capacity: int, operations: list",
        return_type="list[int]",
        test_cases=[
            TestCase(
                {
                    "capacity": 2,
                    "operations": [
                        ["put", 1, 1],
                        ["put", 2, 2],
                        ["get", 1],
                        ["put", 3, 3],
                        ["get", 2],
                        ["put", 4, 4],
                        ["get", 1],
                        ["get", 3],
                        ["get", 4],
                    ],
                },
                [1, -1, -1, 3, 4],
            ),
            TestCase(
                {
                    "capacity": 1,
                    "operations": [["put", 1, 1], ["put", 2, 2], ["get", 1], ["get", 2]],
                },
                [-1, 2],
            ),
        ],
        time_complexity="O(1) per get and put",
        space_complexity="O(capacity)",
        hints=[
            "Use a hash map + doubly linked list.",
            "Hash map: key -> node for O(1) lookup.",
            "Doubly linked list: maintain access order for O(1) eviction.",
            "Python shortcut: collections.OrderedDict.",
        ],
        tags=["hash_map", "linked_list", "design"],
        time_limit_minutes=30,
    ),

    # =========================================================================
    # UNION FIND
    # =========================================================================
    Problem(
        id="uf_01",
        category="Union Find",
        title="Accounts Merge",
        difficulty="medium",
        description=(
            "Given a list of accounts where accounts[i] = [name, email1, email2, ...], "
            "merge accounts that share a common email. Return merged accounts sorted: "
            "each account's emails should be sorted, and accounts can be in any order.\n\n"
            "Example: accounts = [['John','a@','b@'],['John','c@'],['John','a@','d@']] "
            "-> [['John','a@','b@','d@'],['John','c@']]"
        ),
        function_name="accounts_merge",
        parameters="accounts: list[list[str]]",
        return_type="list[list[str]]",
        test_cases=[
            TestCase(
                {
                    "accounts": [
                        ["John", "j1@example.com", "j2@example.com"],
                        ["John", "j3@example.com"],
                        ["John", "j1@example.com", "j4@example.com"],
                        ["Mary", "m1@example.com"],
                    ]
                },
                [
                    ["John", "j1@example.com", "j2@example.com", "j4@example.com"],
                    ["John", "j3@example.com"],
                    ["Mary", "m1@example.com"],
                ],
            ),
        ],
        time_complexity="O(n * alpha(n)) where n is total emails",
        space_complexity="O(n)",
        hints=[
            "Use Union-Find to group emails belonging to the same person.",
            "Map each email to an account index, union overlapping accounts.",
            "Collect emails by their root, sort, and prepend the name.",
        ],
        tags=["union_find", "hash_map", "graph"],
        time_limit_minutes=25,
    ),

    # =========================================================================
    # TRIES
    # =========================================================================
    Problem(
        id="trie_01",
        category="Tries",
        title="Word Search II",
        difficulty="hard",
        description=(
            "Given an m x n board of characters and a list of words, return all words "
            "that can be found in the board. Each word must be constructed from letters "
            "of sequentially adjacent cells (horizontal or vertical). A cell can only be "
            "used once per word.\n\n"
            "Example: board = [['o','a','a','n'],['e','t','a','e'],['i','h','k','r'],['i','f','l','v']], "
            "words = ['oath','pea','eat','rain'] -> ['oath','eat']"
        ),
        function_name="find_words",
        parameters="board: list[list[str]], words: list[str]",
        return_type="list[str]",
        test_cases=[
            TestCase(
                {
                    "board": [
                        ["o", "a", "a", "n"],
                        ["e", "t", "a", "e"],
                        ["i", "h", "k", "r"],
                        ["i", "f", "l", "v"],
                    ],
                    "words": ["oath", "pea", "eat", "rain"],
                },
                ["eat", "oath"],
            ),
            TestCase(
                {"board": [["a", "b"], ["c", "d"]], "words": ["abcb"]},
                [],
            ),
            TestCase(
                {"board": [["a"]], "words": ["a"]},
                ["a"],
            ),
        ],
        time_complexity="O(m * n * 3^L) where L is max word length",
        space_complexity="O(sum of word lengths) for the trie",
        hints=[
            "Build a Trie from the word list.",
            "DFS from each cell, following Trie paths.",
            "Prune Trie nodes after finding words to avoid duplicate work.",
        ],
        tags=["trie", "backtracking", "dfs"],
        time_limit_minutes=30,
    ),

    # =========================================================================
    # BINARY SEARCH
    # =========================================================================
    Problem(
        id="bs_01",
        category="Binary Search",
        title="Median of Two Sorted Arrays",
        difficulty="hard",
        description=(
            "Given two sorted arrays nums1 and nums2 of size m and n respectively, "
            "return the median of the two sorted arrays.\n\n"
            "The overall run time complexity should be O(log(m+n)).\n\n"
            "Example: nums1 = [1,3], nums2 = [2] -> 2.0"
        ),
        function_name="find_median_sorted_arrays",
        parameters="nums1: list[int], nums2: list[int]",
        return_type="float",
        test_cases=[
            TestCase({"nums1": [1, 3], "nums2": [2]}, 2.0),
            TestCase({"nums1": [1, 2], "nums2": [3, 4]}, 2.5),
            TestCase({"nums1": [], "nums2": [1]}, 1.0),
            TestCase({"nums1": [2], "nums2": []}, 2.0),
            TestCase({"nums1": [1, 2, 3], "nums2": [4, 5, 6]}, 3.5),
        ],
        time_complexity="O(log(min(m, n)))",
        space_complexity="O(1)",
        hints=[
            "Binary search on the shorter array.",
            "Partition both arrays so left halves combine to form the lower half.",
            "Ensure max(left) <= min(right) for both partitions.",
        ],
        tags=["binary_search", "divide_and_conquer"],
        time_limit_minutes=30,
    ),

    # =========================================================================
    # BIT MANIPULATION
    # =========================================================================
    Problem(
        id="bit_01",
        category="Bit Manipulation",
        title="Counting Bits",
        difficulty="medium",
        description=(
            "Given an integer n, return an array ans of length n+1 such that "
            "for each i (0 <= i <= n), ans[i] is the number of 1's in the binary "
            "representation of i.\n\n"
            "Do it in O(n) time without using built-in popcount functions."
        ),
        function_name="count_bits",
        parameters="n: int",
        return_type="list[int]",
        test_cases=[
            TestCase({"n": 2}, [0, 1, 1]),
            TestCase({"n": 5}, [0, 1, 1, 2, 1, 2]),
            TestCase({"n": 0}, [0]),
            TestCase({"n": 8}, [0, 1, 1, 2, 1, 2, 2, 3, 1]),
        ],
        time_complexity="O(n)",
        space_complexity="O(n)",
        hints=[
            "dp[i] = dp[i >> 1] + (i & 1).",
            "Or: dp[i] = dp[i & (i-1)] + 1 (turn off lowest set bit).",
        ],
        tags=["dp", "bit_manipulation"],
        time_limit_minutes=15,
    ),
]


def get_categories() -> list[str]:
    """Return sorted list of unique categories."""
    return sorted(set(p.category for p in PROBLEMS))


def get_problems_by_category(category: str) -> list[Problem]:
    """Return problems in the given category."""
    return [p for p in PROBLEMS if p.category == category]


def get_problem_by_id(problem_id: str) -> Problem | None:
    """Look up a problem by its ID."""
    for p in PROBLEMS:
        if p.id == problem_id:
            return p
    return None
