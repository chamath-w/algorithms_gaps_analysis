# Month 1: Foundations (Weeks 1-4)

By the end of this month you will: have internalized the 21 algorithm patterns,
be able to recognize patterns with >85% accuracy, solve medium-difficulty
algorithm problems consistently, write idiomatic Python, understand concurrency,
and write basic SQL.

---

## WEEK 1: Mental Models + First Patterns

### Day 1 — Mental Model Installation

**Read** (45 min):

- `guides/01_mental_models.md` — Read the entire document, front to back.
- For each of the 6 mental models, mark it as:
  - "Already have this" (your EE training covers it)
  - "Need to install" (this is genuinely new)
  - "Have the EE version, need the software translation"

**Practice** (45 min):

- Open `journal.md`. Write down:
  - Which 2 mental models felt most new to you?
  - For each, write a 2-sentence explanation in your own words (not copied from the guide).
  - Think of one real situation at work where each model applies.

**Run**:

```bash
python main.py --list
```

- Scan the full list of problems. Note which categories feel familiar vs alien.

**Journal prompt**: "The mental model I most need to install is **\_** because **\_**."

---

### Day 2 — The Pattern Catalog (Part 1: Core 8)

**Read** (45 min):

- Run these commands and read the output carefully:

```bash
python main.py --pattern sliding_window
python main.py --pattern two_pointers
python main.py --pattern binary_search
python main.py --pattern dp
```

- For each pattern, focus on:
  - The "WHEN TO USE" triggers (memorize these)
  - The code template (trace through it line by line)
  - The "PITFALLS" (these are the mistakes you will make)

**Practice** (45 min):

- Run the remaining 4 core patterns:

```bash
python main.py --pattern bfs
python main.py --pattern dfs
python main.py --pattern greedy
python main.py --pattern backtracking
```

- On paper or in `journal.md`, create a 2-column table:
  - Column 1: Pattern name
  - Column 2: The ONE trigger signal you'd remember for each (your own words)

Example:

```
Sliding Window    -> "contiguous subarray/substring"
Two Pointers      -> "sorted array + find pair"
Binary Search     -> "find min/max that satisfies condition"
DP                -> "min/max/count + overlapping subproblems"
BFS               -> "shortest path, unweighted"
DFS               -> "tree traversal, connected components"
Greedy            -> "intervals + sorting"
Backtracking      -> "generate ALL valid combinations"
```

**Journal prompt**: "The pattern I'm least familiar with is **\_** because **\_**."

---

### Day 3 — The Pattern Catalog (Part 2: Remaining 8) + Decision Tree

**Read** (40 min):

```bash
python main.py --pattern heap
python main.py --pattern monotonic_stack
python main.py --pattern union_find
python main.py --pattern trie
python main.py --pattern prefix_sum
python main.py --pattern hash_map
python main.py --pattern topological_sort
python main.py --pattern dijkstra
```

- Add each to your trigger table from Day 2.

**Practice** (40 min):

```bash
python main.py --decision-tree
```

- Print or copy the decision tree. Read it top to bottom.
- Test yourself: for each of these problems, trace the decision tree to find the pattern:
  1. "Find the shortest path in an unweighted grid" → ?
  2. "Find all subsets of a set" → ?
  3. "Find the K-th largest element" → ?
  4. "Given a sorted rotated array, find the minimum" → ?
  5. "Count subarrays with sum equal to K" → ?
- Answers: 1=BFS, 2=Backtracking, 3=Heap, 4=Binary Search, 5=Prefix Sum

**Journal prompt**: "My complete trigger table has 21 entries. The 3 I'm weakest on are **\_**."

---

### Day 4 — First Pattern Recognition Training

**Read** (10 min):

- Re-read your trigger table from Day 2-3. Quiz yourself: cover column 2, try
  to recall from column 1. Then reverse.

**Practice** (90 min):

```bash
python main.py --train --train-limit 12
```

- For each scenario:
  - Read the problem description
  - Before looking at the menu, say your answer out loud (or write it down)
  - Then select your answer
  - When you get feedback, **read every key signal line carefully**
  - If you got it wrong, write down: "I said X, correct was Y, because Z"
- After the session, note your accuracy score.

**Journal prompt**: "Pattern recognition score: **\_/12. Patterns I misidentified: \_\_\_**. The signal I missed was **\_**."

---

### Day 5 — First Algorithm Problems (Easy Wins)

**Read** (15 min):

```bash
python main.py --pattern sliding_window
```

- Re-read just the template code. Understand every line.

**Practice** (90 min):

- Open `solutions/arr_01.py` in your editor. Read the problem description at the top.
- Solve it. Time yourself. Target: 20 minutes.
  - Hint: This is a sliding window problem. Use a hash map to track last-seen index.
- When done:

```bash
python main.py --run arr_01
```

- If any tests fail, fix your solution until all pass.

- Next, open `solutions/sw_02.py`. Read the problem description.
- Solve it. Time yourself. Target: 15 minutes.
  - Hint: Two pointers from opposite ends. Move the shorter side inward.

```bash
python main.py --run sw_02
```

- Next, open `solutions/graph_02.py`. Read the problem description.
- Solve it. Time yourself. Target: 15 minutes.
  - Hint: DFS or BFS from each unvisited '1'. Mark cells as visited.

```bash
python main.py --run graph_02
```

**Journal prompt**: "Solved **_/3. Time per problem: _**. The one I struggled with was **\_** because **\_**."

---

### Day 6 — More Problems + First Gap Report

**Read** (10 min):

```bash
python main.py --pattern dp
```

- Re-read the DP template. Trace through the 1D example with nums = [1, 2, 3, 1].

**Practice** (80 min):

- Solve these 3 problems (25 min each, use hints after 15 min if stuck):
  - `solutions/dp_01.py` — Longest Increasing Subsequence
  - `solutions/stk_02.py` — Valid Parentheses with Wildcards
  - `solutions/bit_01.py` — Counting Bits

```bash
python main.py --run dp_01
python main.py --run stk_02
python main.py --run bit_01
```

- After solving (or attempting) all 3, run:

```bash
python main.py --report
```

- Read your gap report. Note which categories are "WEAK".

**Journal prompt**: "First gap report: **\_/6 problems solved. Weakest categories: \_\_\_**. My plan for next week: focus on **\_**."

---

## WEEK 2: Attack Weak Patterns + Testing

### Day 7 — Deep Study of Your Weakest Patterns

**Read** (60 min):

- Look at your Day 6 gap report. Identify your 3 weakest categories.
- For each weak category, run:

```bash
python main.py --pattern <pattern_id>
```

- Read the FULL detail for each: description, when to use, approach (all steps),
  template code, variations, pitfalls.
- For each template, **trace through it by hand** with a small example. Write
  the variable states at each step on paper.

**Practice** (50 min):

- For each of your 3 weak patterns, find one problem in `python main.py --list`
  that matches. Open the solution file and attempt it (20 min each, then use hints).
- Run `python main.py --run <id>` for each.

**Journal prompt**: "Deep-studied patterns: **\_**. After tracing the templates, the thing that clicked was **\_**."

---

### Day 8 — Solve All Remaining Medium Problems (Part 1)

**Practice** (110 min):

- Work through these problems in order. 20 min each. If stuck after 15 min,
  read all hints. If still stuck after 20 min, look up the approach (not the
  code) and implement from understanding.

1. `solutions/arr_03.py` — Product of Array Except Self
   - Pattern: Prefix products. Two passes: left-to-right, then right-to-left.

```bash
python main.py --run arr_03
```

2. `solutions/gr_01.py` — Jump Game II
   - Pattern: Greedy (BFS levels). Track farthest reachable in current jump.

```bash
python main.py --run gr_01
```

3. `solutions/gr_02.py` — Task Scheduler
   - Pattern: Greedy + Math. Most frequent task determines idle slots.

```bash
python main.py --run gr_02
```

4. `solutions/dp_03.py` — Word Break
   - Pattern: 1D DP. dp[i] = can s[:i] be segmented?

```bash
python main.py --run dp_03
```

**Journal prompt**: "Solved **\_/4. The pattern I keep failing to recognize is \_\_\_**."

---

### Day 9 — Solve All Remaining Medium Problems (Part 2) + Testing Intro

**Practice** (70 min):

1. `solutions/tree_01.py` — Lowest Common Ancestor
   - Pattern: DFS with return value. If both subtrees return non-null, current node is LCA.

```bash
python main.py --run tree_01
```

2. `solutions/bt_01.py` — Word Search
   - Pattern: Backtracking on grid. DFS + mark/unmark visited.

```bash
python main.py --run bt_01
```

3. `solutions/uf_01.py` — Accounts Merge
   - Pattern: Union Find. Union emails that share an account.

```bash
python main.py --run uf_01
```

**Read** (40 min):

- `guides/03_software_engineering.md` — Read **Part 2: Testing** only (sections 2.1 through 2.4).
- Key takeaways to write down:
  - What is the testing pyramid?
  - What does "test behavior, not implementation" mean?
  - Write down the pytest example from section 2.4 in your own code editor and run it.

**Journal prompt**: "Solved \_\_\_/3. Understood testing pyramid: unit (many/fast) > integration (some/medium) > E2E (few/slow)."

---

### Day 10 — Write Tests for Your Own Solutions

**Read** (15 min):

- Re-read `guides/03_software_engineering.md` section 2.4 (pytest examples).

**Practice** (100 min):

- Create a file `tests/test_solutions.py` (create the `tests/` directory first).
- Write pytest tests for 3 of your solved problems. Example structure:

```python
# tests/test_solutions.py
import sys
sys.path.insert(0, "solutions")

def test_arr_01_basic():
    from arr_01 import length_of_longest_substring
    assert length_of_longest_substring("abcabcbb") == 3

def test_arr_01_empty():
    from arr_01 import length_of_longest_substring
    assert length_of_longest_substring("") == 0

def test_arr_01_single_char():
    from arr_01 import length_of_longest_substring
    assert length_of_longest_substring("bbbbb") == 1
```

- Write at least 3 test functions per problem (happy path, edge case, tricky case).
- Run your tests:

```bash
pip install pytest  # if not already installed
pytest tests/test_solutions.py -v
```

**Journal prompt**: "Wrote **\_** tests for **\_** solutions. Testing forced me to think about edge case: **\_**."

---

### Day 11 — Full Pattern Recognition Training

**Read** (10 min):

- Review your trigger table. Update any entries based on what you have learned.

**Practice** (100 min):

```bash
python main.py --train
```

- Full 30-scenario session. Take your time.
- For EVERY miss, write in your journal:
  - The scenario description (first 10 words)
  - What you said
  - What was correct
  - The key signal you missed

Target: >70% accuracy (21/30).

**Journal prompt**: "Score: **\_/30. Patterns I keep missing: \_\_\_**. I need to memorize these triggers: **\_**."

---

### Day 12 — Python Idioms + Run Full Report

**Read** (30 min):

- `guides/04_cs_fundamentals.md` — Read **Part 5: Data Structures Beyond Arrays** only.
- Focus on: `collections.Counter`, `collections.defaultdict`, `collections.deque`, `heapq`.

**Practice** (80 min):

- Go back to 3 of your solved algorithm problems and refactor them to use
  Python idioms:
  - Replace manual counting with `Counter`
  - Replace `if key not in dict: dict[key] = []` with `defaultdict(list)`
  - Replace `list` used as queue with `deque`
  - Use list comprehensions where they improve clarity
  - Use `enumerate()` instead of manual index tracking

- After refactoring, re-run to confirm they still pass:

```bash
python main.py --report
```

- Record your updated gap report scores.

**Journal prompt**: "Refactored **\_** solutions. Most useful Python idiom I learned: **\_**. Gap report now shows: **\_/** solved."

---

## WEEK 3: Hard Problems + Concurrency

### Day 13 — Monotonic Stack Deep Dive + Hard Problem 1

**Read** (30 min):

```bash
python main.py --pattern monotonic_stack
```

- Read the full pattern detail. Trace the "largest rectangle in histogram"
  template by hand with heights = [2, 1, 5, 6, 2, 3].
- On paper, track the stack contents and max_area at each step.

**Practice** (80 min):

- Solve `solutions/stk_01.py` — Largest Rectangle in Histogram
  - Time limit: 30 min. Use hints after 20 min.

```bash
python main.py --run stk_01
```

- Solve `solutions/arr_02.py` — Trapping Rain Water
  - Time limit: 30 min. Try the two-pointer approach.

```bash
python main.py --run arr_02
```

**Journal prompt**: "Monotonic stack clicked when I realized **\_**. Trapping rain water: solved / needed hints / still stuck."

---

### Day 14 — Sliding Window Hard + Heap Hard

**Read** (15 min):

```bash
python main.py --pattern sliding_window
```

- Re-read the variable-size window template. Focus on the expand/contract rhythm.

**Practice** (100 min):

- Solve `solutions/sw_01.py` — Minimum Window Substring
  - Time limit: 30 min. This is the hardest sliding window problem.
  - Key: track "characters satisfied" count to avoid scanning the whole map each step.

```bash
python main.py --run sw_01
```

- Solve `solutions/heap_01.py` — Merge K Sorted Lists
  - Time limit: 25 min.
  - Key: push (value, list_index, element_index) tuples to avoid comparison issues.

```bash
python main.py --run heap_01
```

- Solve `solutions/heap_02.py` — Find Median from Data Stream
  - Time limit: 25 min.
  - Key: two heaps. Max-heap (negated) for lower half, min-heap for upper half.

```bash
python main.py --run heap_02
```

**Journal prompt**: "Hardest problem today: **\_**. Time taken: **\_**. Key insight I'll remember: **\_**."

---

### Day 15 — Concurrency Fundamentals

**Read** (60 min):

- `guides/04_cs_fundamentals.md` — Read **Part 1: Operating Systems** (sections 1.1 through 1.5).
- `guides/04_cs_fundamentals.md` — Read **Part 4: Concurrency Patterns in Practice** (sections 4.1 through 4.3).
- Take notes on:
  - When to use threading vs multiprocessing vs asyncio
  - The 4 concurrency bugs (race condition, deadlock, starvation, data race)

**Practice** (50 min):

- Create a file `exercises/concurrency_producer_consumer.py`:

```python
"""
Exercise: Implement a producer-consumer system.
- Producer generates numbers 1-20 and puts them in a queue
- Consumer takes numbers and prints their square
- Use threading and queue.Queue
"""
import threading
import queue
import time

def producer(q):
    for i in range(1, 21):
        q.put(i)
        time.sleep(0.05)
    q.put(None)  # sentinel to signal done

def consumer(q):
    while True:
        item = q.get()
        if item is None:
            break
        print(f"{item} -> {item**2}")

q = queue.Queue(maxsize=5)
t1 = threading.Thread(target=producer, args=(q,))
t2 = threading.Thread(target=consumer, args=(q,))
t1.start()
t2.start()
t1.join()
t2.join()
print("Done")
```

- Run it. Observe the behavior.
- Modify it to have 3 consumers instead of 1. Send 3 sentinel values.
- Run again. Observe how work is distributed.

**Journal prompt**: "Concurrency model that maps best to my EE understanding: **\_**. New thing I learned: **\_**."

---

### Day 16 — Async Python + Graph Hard Problem

**Read** (30 min):

- `guides/04_cs_fundamentals.md` section 4.3 (Async/Await) — re-read carefully.
- Key mental model: `await` = "I'm yielding the CPU while waiting for I/O"

**Practice — Async** (30 min):

- Create `exercises/concurrency_async.py`:

```python
"""
Exercise: Fetch multiple URLs concurrently using asyncio.
(We'll simulate network calls with asyncio.sleep)
"""
import asyncio
import random

async def fetch_data(name, delay):
    print(f"Starting {name}...")
    await asyncio.sleep(delay)  # simulates network I/O
    result = random.randint(1, 100)
    print(f"Finished {name}: got {result}")
    return result

async def main():
    # Run 5 "network calls" concurrently
    tasks = [
        fetch_data("API-1", 1.0),
        fetch_data("API-2", 0.5),
        fetch_data("API-3", 1.5),
        fetch_data("API-4", 0.3),
        fetch_data("API-5", 0.8),
    ]
    results = await asyncio.gather(*tasks)
    print(f"All results: {results}")
    print(f"Total would be {sum(results)}")

asyncio.run(main())
```

- Run it. Notice how all 5 "requests" start immediately but finish in different orders.
- Observe: total time is ~1.5s (max delay), not ~4.1s (sum of delays).

**Practice — Hard problem** (50 min):

- Solve `solutions/graph_03.py` — Alien Dictionary
  - Time limit: 30 min. Pattern: build a graph from adjacent word comparisons, then topological sort.
  - Edge case: if a word is a prefix of the previous word but longer, return "".

```bash
python main.py --run graph_03
```

- Solve `solutions/graph_01.py` — Course Schedule II (Topological Sort)
  - Time limit: 25 min. Pattern: Kahn's algorithm (BFS with in-degree tracking).

```bash
python main.py --run graph_01
```

**Journal prompt**: "async/await feels like **\_** from my EE background. Graph problems solved: \_\_\_/2."

---

### Day 17 — DP Hard + Tree Hard

**Practice** (110 min):

- Solve `solutions/dp_02.py` — Edit Distance
  - Time limit: 25 min. Classic 2D DP. Draw the dp table on paper first for "horse" -> "ros".

```bash
python main.py --run dp_02
```

- Solve `solutions/ll_01.py` — LRU Cache
  - Time limit: 35 min. Hash map + doubly linked list. Or use `collections.OrderedDict`.
  - This is a design problem disguised as an algorithm problem. Think about the API first.

```bash
python main.py --run ll_01
```

- Solve `solutions/tree_02.py` — Serialize and Deserialize Binary Tree
  - Time limit: 30 min. Use BFS (level-order) for both serialize and deserialize.

```bash
python main.py --run tree_02
```

**Journal prompt**: "Hardest problem today: **\_**. 2D DP table insight: **\_**."

---

### Day 18 — Backtracking Hard + Trie + Binary Search Hard

**Practice** (110 min):

- Solve `solutions/bt_02.py` — N-Queens
  - Time limit: 30 min. Place queens row by row. Track attacked columns, diagonals (row-col), and anti-diagonals (row+col).

```bash
python main.py --run bt_02
```

- Solve `solutions/trie_01.py` — Word Search II
  - Time limit: 35 min. Build a Trie from the word list, then DFS from each cell following Trie paths.

```bash
python main.py --run trie_01
```

- Solve `solutions/bs_01.py` — Median of Two Sorted Arrays
  - Time limit: 35 min. Binary search on the shorter array. Partition both arrays so left halves form the lower half.

```bash
python main.py --run bs_01
```

**Journal prompt**: "All 26 problems attempted. Solved: **\_/26. Remaining unsolved: \_\_\_**."

---

## WEEK 4: SQL + System Design Intro + Assessment

### Day 19 — SQL Fundamentals

**Read** (40 min):

- `guides/04_cs_fundamentals.md` — Read **Part 3: Databases Deep Dive** (sections 3.1 through 3.4).
- Focus on the SQL examples. Read each query and understand what it returns.
- Read about ACID properties — map each to the EE analogy in the table.
- Read about indexing — understand why B-tree index is O(log n).

**Practice** (70 min):

- Go to https://sqlzoo.net/ (browser-based, no install needed).
- Complete these tutorials in order:
  1. SELECT basics (10 exercises)
  2. SELECT from WORLD (13 exercises)
  3. SELECT from Nobel (14 exercises)
- Target: complete all 37 exercises.

**Journal prompt**: "SQL concept that was new: **\_**. SQL concept that maps to an EE thing I know: **\_**."

---

### Day 20 — SQL Joins + Schema Design

**Practice** (110 min):

- Continue on https://sqlzoo.net/: 4. SELECT within SELECT (8 exercises) 5. SUM and COUNT (8 exercises) 6. JOIN (13 exercises)
- Target: complete all 29 exercises.

- Then, on paper or in a text file, design a database schema for an e-commerce system:
  - Tables: users, products, categories, orders, order_items, reviews
  - For each table: column names, data types, primary key, foreign keys
  - Write these queries:
    1. Find the top 5 products by total revenue
    2. Find users who have never placed an order
    3. Find the average review rating per product, only for products with >5 reviews
    4. Find the most popular category by number of orders

**Journal prompt**: "JOINs feel like **\_** in EE terms. Schema design exercise: I defined **_ tables with _** foreign keys."

---

### Day 21 — Networking + HTTP

**Read** (60 min):

- `guides/04_cs_fundamentals.md` — Read **Part 2: Networking** (sections 2.1 through 2.5).
- Focus on:
  - TCP vs UDP — map to EE protocols you know
  - HTTP request/response format — read the example byte by byte
  - Status codes — memorize the categories (2xx=success, 3xx=redirect, 4xx=client error, 5xx=server error)
  - TLS handshake — map to secure communication protocols you know

**Practice** (50 min):

- Open a terminal and run these commands to see real HTTP in action:

```bash
# See the full HTTP request/response
curl -v https://httpbin.org/get

# See response headers
curl -I https://httpbin.org/get

# Send a POST request with JSON body
curl -X POST https://httpbin.org/post -H "Content-Type: application/json" -d '{"name": "test"}'

# See a redirect
curl -v -L https://httpbin.org/redirect/1
```

- For each response, identify: status code, content-type, any caching headers.

**Journal prompt**: "HTTP status codes I memorized: **\_**. TLS handshake reminds me of **\_** in EE."

---

### Day 22 — Full Algorithm Assessment

**Practice** (110 min):

- Delete your `solutions/` directory and regenerate fresh templates:

```bash
rm -rf solutions/
python main.py --generate
```

- Re-solve as many problems as you can in 110 minutes WITHOUT looking at your
  previous solutions or the hints.
- Solve them in this priority order (highest value first):
  1. `arr_01` (20 min)
  2. `dp_01` (20 min)
  3. `graph_02` (15 min)
  4. `sw_02` (15 min)
  5. `arr_02` (20 min)
  6. Any remaining problems in the time you have left

- Run the full report:

```bash
python main.py --report
```

**Journal prompt**: "Re-solved **\_** problems from memory. Patterns I can now apply without thinking: **\_**. Still need practice on: **\_**."

---

### Day 23 — Pattern Recognition Mastery Check

**Practice** (60 min):

```bash
python main.py --train
```

- Full 30-scenario session. Target: >85% accuracy (26/30).
- For every miss, trace the decision tree to find where you went wrong.

**Read** (50 min):

- `guides/02_systems_design.md` — Read **Part 1: The Building Blocks** only (section 1.1 through 1.6).
- Focus on the database selection table. For each database type, write one sentence about when you'd use it.
- Focus on caching strategies (cache-aside, write-through, write-behind).

**Journal prompt**: "Pattern recognition: **_/30 (up from _**/30 on Day 4/11). System design building blocks I now know: **\_**."

---

### Day 24 — System Design Method + First Design

**Read** (30 min):

- `guides/02_systems_design.md` — Read **Part 2: Distributed Systems Fundamentals** (sections 2.1 through 2.4).
- Read **Part 3: System Design Method** (all 5 steps).
- Memorize the 5 steps: Clarify -> Estimate -> High-Level -> Deep Dive -> Bottlenecks.
- Memorize the latency numbers (section 2.4). Copy them to a card you can reference.

**Practice** (80 min):

- System design exercise: **URL Shortener** (TinyURL)
- Set a timer for 35 minutes. On paper or in a text file:
  1. (5 min) Clarify requirements: What operations? Read/write ratio? Scale?
  2. (5 min) Estimate: 100M URLs, 10:1 read:write ratio, ~1000 writes/sec, ~10000 reads/sec
  3. (10 min) High-level design: Draw API endpoints, database choice, caching layer
  4. (10 min) Deep dive: How to generate unique short codes? (hash? counter? base62?)
  5. (5 min) Bottlenecks: What if the database is slow? (cache hot URLs in Redis)

- After the timer, read `guides/02_systems_design.md` Part 4, problem 1 (URL Shortener)
  and compare your design to the key concepts listed.
- Write down what you missed.

**Journal prompt**: "First system design complete. Things I included: **\_**. Things I missed: **\_**. Month 1 is done."

---

## MONTH 1 CHECKPOINT

Before proceeding to Month 2, verify:

- [ ] Pattern recognition accuracy >85% (`python main.py --train`)
- [ ] At least 18/26 algorithm problems solved (`python main.py --report`)
- [ ] Can write basic SQL (SELECT, JOIN, GROUP BY, subquery)
- [ ] Understand concurrency: threading vs multiprocessing vs asyncio
- [ ] Completed 1 system design exercise (URL Shortener)
- [ ] Have read guides 01, 03 (Part 2), 04

If you are below these thresholds, spend Day 25-26 catching up before starting Month 2.
