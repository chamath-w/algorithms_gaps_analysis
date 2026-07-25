# Daily Guide: Month 3 — Staff Impact + Capstone (Days 45-72)

This is Weeks 9-12. You shift from learning to **building and leading**. The
focus is staff-level skills, a distributed systems project, and final
assessments that prove your growth.

If you are behind on the Month 2 checkpoint, spend Days 45-46 catching up
before proceeding.

---

## WEEK 9: Staff Skills + Project 2 Start

### Day 45 — Staff Engineer Skills (Part 1)

**Read** (80 min):

- `guides/05_staff_level.md` — Read **Part 1: The Staff Engineer's Job** and
  **Part 2: Writing Design Documents** (sections 1.1 through 2.3).
- Take notes on:
  - Which archetype (Tech Lead, Architect, Solver, Right Hand) fits your current role?
  - The RFC template — you will use this tomorrow.

**Practice** (30 min):

- Write a 1-page RFC for a hypothetical migration: "Migrate a monolithic Python
  API to 3 microservices." Use the template from section 2.1.
- Focus on: Context, Goals/Non-Goals, Alternatives Considered.
- Save as `exercises/practice_rfc_1.md`.

**Journal prompt**: "My staff archetype is closest to **\_**. The RFC section I
found hardest to write: **\_**."

---

### Day 46 — Staff Engineer Skills (Part 2) + Project 2 Design

**Read** (50 min):

- `guides/05_staff_level.md` — Read **Part 3: Making Technical Decisions** and
  **Part 4: Cross-Team Influence** (sections 3.1 through 4.3).
- Key concepts: one-way vs two-way doors, build vs buy vs adopt, ADRs,
  disagree and commit.

**Practice — Project 2 Design** (60 min):

- You are building the **URL Shortener with Analytics** (see
  `guides/06_three_month_plan.md`, Capstone Projects, Project 2).
- Write the design doc FIRST, before any code. Save as `project2/DESIGN.md`.
- Architecture reminder:

```
Service 1: URL Shortener API
  - POST /shorten → create short URL
  - GET /{code} → redirect, publish click event

Service 2: Analytics API
  - GET /analytics/{code} → click stats (total, by country, by time)

Worker: Click Processor
  - Consumes click events from queue
  - Aggregates and stores analytics
```

- Your RFC must include:
  - Context and Goals/Non-Goals
  - Data model (URLs table, clicks table, analytics aggregation table)
  - API contracts for both services
  - Inter-service communication choice (Redis pub/sub, or HTTP, or queue) with justification
  - Alternatives considered (monolith vs microservices for this use case)

**Journal prompt**: "Writing the design BEFORE code changes my approach by
**\_**. Inter-service communication choice: **\_** because **\_**."

---

### Day 47 — Project 2: Service 1 Setup

**Practice** (110 min):

- Create the project structure:

```bash
mkdir -p project2/shortener project2/analytics project2/worker project2/tests
```

- Set up Service 1 (URL Shortener API):
  - Initialize FastAPI app
  - Create the URLs table schema (SQLite for now):
    - `id`, `code` (unique, 7 chars), `original_url`, `created_at`, `click_count`
  - Implement short code generation (base62 encoding or nanoid):

```python
import string
import random

ALPHABET = string.ascii_letters + string.digits  # 62 chars

def generate_code(length=7):
    return ''.join(random.choices(ALPHABET, k=length))
```

- Implement `POST /shorten`:
  - Accept `{"url": "https://example.com/long-path"}`
  - Validate URL format
  - Generate short code, store in DB
  - Return `{"short_url": "http://localhost:8001/{code}", "code": "{code}"}`

- Implement `GET /{code}`:
  - Look up code in DB
  - Return 307 redirect to original URL
  - For now, just increment `click_count` directly (we will add the event pipeline later)

- Write basic tests for both endpoints.

**Journal prompt**: "Service 1 endpoints working: **\_**. Base62 code generation
is like **\_** in EE (hint: encoding schemes)."

---

### Day 48 — Project 2: Service 2 (Analytics API)

**Practice** (110 min):

- Create the analytics data model:
  - `clicks` table: `id`, `code`, `timestamp`, `ip_address`, `user_agent`, `country` (nullable)
  - `analytics_hourly` table: `code`, `hour_bucket` (datetime), `click_count`

- Implement Service 2 (Analytics API) as a separate FastAPI app:
  - `GET /analytics/{code}` returns:

```json
{
  "code": "abc1234",
  "total_clicks": 1542,
  "clicks_today": 87,
  "clicks_by_hour": [
    { "hour": "2026-06-16T14:00:00", "count": 23 },
    { "hour": "2026-06-16T15:00:00", "count": 31 }
  ],
  "top_referrers": ["google.com", "twitter.com"]
}
```

- `GET /analytics/{code}/summary` returns a simplified view (total clicks, first click, last click)

- For now, seed the `clicks` table with fake data so you can test the analytics queries:

```python
from datetime import datetime, timedelta
import random

def seed_clicks(db, code, count=100):
    now = datetime.utcnow()
    for i in range(count):
        timestamp = now - timedelta(hours=random.randint(0, 72))
        db.execute("INSERT INTO clicks (code, timestamp, country) VALUES (?, ?, ?)",
                   (code, timestamp, random.choice(["US", "UK", "DE", "JP", "BR"])))
```

- Write tests for the analytics endpoints.

**Journal prompt**: "Analytics queries use **\_** SQL patterns (GROUP BY, time
bucketing). Time-series aggregation is like **\_** from signal processing."

---

### Day 49 — Project 2: Click Event Pipeline

**Practice** (110 min):

- Implement the event pipeline to connect Service 1 and the Worker:
  - When `GET /{code}` is called in Service 1, instead of directly incrementing
    the count, publish a click event.
  - Use an in-process queue for simplicity (or Redis pub/sub if you have Redis):

```python
import queue
import threading
import json
from datetime import datetime

# Shared event queue (in production, this would be Redis/Kafka/RabbitMQ)
click_queue = queue.Queue()

def publish_click_event(code: str, ip: str, user_agent: str):
    event = {
        "code": code,
        "timestamp": datetime.utcnow().isoformat(),
        "ip": ip,
        "user_agent": user_agent,
    }
    click_queue.put(json.dumps(event))
```

- Implement the Worker (Click Processor):
  - Runs as a background thread (or separate process)
  - Consumes events from the queue
  - Inserts into the `clicks` table
  - Updates the `analytics_hourly` aggregation table (upsert: increment count
    for the hour bucket, or insert new row)

```python
def click_processor(click_queue, db):
    while True:
        event_json = click_queue.get()
        event = json.loads(event_json)
        # Insert raw click
        db.execute("INSERT INTO clicks (code, timestamp, ip_address, user_agent) VALUES (?, ?, ?, ?)",
                   (event["code"], event["timestamp"], event["ip"], event["user_agent"]))
        # Update hourly aggregation
        hour_bucket = event["timestamp"][:13] + ":00:00"
        db.execute("""
            INSERT INTO analytics_hourly (code, hour_bucket, click_count)
            VALUES (?, ?, 1)
            ON CONFLICT(code, hour_bucket) DO UPDATE SET click_count = click_count + 1
        """, (event["code"], hour_bucket))
        db.commit()
```

- Wire it together: Service 1 publishes, Worker consumes, Service 2 reads the
  aggregated data.
- Test the full flow: shorten a URL, click it 5 times, check analytics.

**Journal prompt**: "Event pipeline is like **\_** in hardware (producer-consumer,
interrupt-driven). Async processing advantage: **\_**."

---

### Day 50 — Project 2: Health Checks + Structured Logging

**Read** (30 min):

- `guides/05_staff_level.md` — Read **Part 5: Observability and Operations**
  (sections 5.1 through 5.3).
- Focus on: the three pillars (logs, metrics, traces) and the Four Golden Signals.

**Practice** (80 min):

- Add health check endpoints to both services:

```python
@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "shortener",
        "timestamp": datetime.utcnow().isoformat(),
        "db": "connected" if check_db() else "error",
    }
```

- Add structured JSON logging to both services:

```python
import logging
import json

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "service": "shortener",
            "message": record.getMessage(),
        }
        if hasattr(record, "extra"):
            log_data.update(record.extra)
        return json.dumps(log_data)
```

- Add request logging middleware (log every request with method, path, status,
  duration).
- Add logging to the worker: log every event processed, log errors.
- Test: make several requests, verify logs are structured JSON.

**Journal prompt**: "Structured logging vs print statements: **\_**. Health checks
in production are like **\_** in hardware."

---

## WEEK 10: Resilience + Observability + Project 2 Continue

### Day 51 — Error Handling + Retry Logic

**Practice** (110 min):

- Add robust error handling to Project 2:
  - Service 1: Handle DB errors, invalid URLs, duplicate codes gracefully
  - Service 2: Handle missing codes (404), DB connection errors
  - Worker: Handle malformed events, DB write failures

- Implement retry logic for the worker:

```python
import time

def process_with_retry(event, db, max_retries=3):
    for attempt in range(max_retries):
        try:
            process_click(event, db)
            return
        except Exception as e:
            wait = 2 ** attempt  # exponential backoff: 1, 2, 4 seconds
            logger.warning(f"Retry {attempt + 1}/{max_retries} after {wait}s: {e}")
            time.sleep(wait)
    logger.error(f"Failed after {max_retries} retries: {event}")
    # Dead letter: save failed events for manual inspection
    save_to_dead_letter(event)
```

- Implement a simple circuit breaker for inter-service calls (if Service 2
  calls Service 1 for URL info):

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, reset_timeout=30):
        self.failures = 0
        self.threshold = failure_threshold
        self.reset_timeout = reset_timeout
        self.last_failure_time = None
        self.state = "closed"  # closed=normal, open=failing, half_open=testing

    def call(self, func, *args):
        if self.state == "open":
            if time.time() - self.last_failure_time > self.reset_timeout:
                self.state = "half_open"
            else:
                raise Exception("Circuit breaker is open")
        try:
            result = func(*args)
            if self.state == "half_open":
                self.state = "closed"
                self.failures = 0
            return result
        except Exception as e:
            self.failures += 1
            self.last_failure_time = time.time()
            if self.failures >= self.threshold:
                self.state = "open"
            raise
```

- Write tests for the retry logic and circuit breaker.

**Journal prompt**: "Exponential backoff is like **\_** in communication protocols.
Circuit breaker pattern prevents **\_**."

---

### Day 52 — Metrics + Simple Monitoring

**Practice** (110 min):

- Add application metrics to both services. Use simple counters (no external
  libraries needed):

```python
from collections import defaultdict
from threading import Lock

class Metrics:
    def __init__(self):
        self._counters = defaultdict(int)
        self._histograms = defaultdict(list)
        self._lock = Lock()

    def increment(self, name, value=1):
        with self._lock:
            self._counters[name] += value

    def observe(self, name, value):
        with self._lock:
            self._histograms[name].append(value)

    def snapshot(self):
        with self._lock:
            result = {"counters": dict(self._counters), "histograms": {}}
            for name, values in self._histograms.items():
                if values:
                    sorted_v = sorted(values)
                    result["histograms"][name] = {
                        "count": len(values),
                        "p50": sorted_v[len(values) // 2],
                        "p95": sorted_v[int(len(values) * 0.95)],
                        "p99": sorted_v[int(len(values) * 0.99)],
                    }
            return result

metrics = Metrics()
```

- Track the Four Golden Signals:
  - **Latency**: `metrics.observe("request_duration_ms", duration)`
  - **Error rate**: `metrics.increment("errors_total")` on failures
  - **Throughput**: `metrics.increment("requests_total")`
  - **Saturation**: `metrics.increment("queue_depth", click_queue.qsize())`

- Add a `GET /metrics` endpoint that returns the snapshot.

- Run your services, make 50+ requests, then check `/metrics` to see the data.

**Journal prompt**: "The Four Golden Signals are: **\_**. P95 latency is more
important than average because **\_**."

---

### Day 53 — Load Testing

**Practice** (110 min):

- Write a simple load test script (no external tools needed):

```python
# load_test.py
import requests
import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "http://localhost:8001"

def create_url():
    resp = requests.post(f"{BASE_URL}/shorten", json={"url": f"https://example.com/{time.time()}"})
    return resp.json()["code"]

def click_url(code):
    start = time.time()
    resp = requests.get(f"{BASE_URL}/{code}", allow_redirects=False)
    duration = (time.time() - start) * 1000
    return resp.status_code, duration

def run_load_test(num_requests=200, concurrency=10):
    # Setup: create 10 URLs
    codes = [create_url() for _ in range(10)]
    print(f"Created {len(codes)} URLs")

    # Load test: hit them concurrently
    durations = []
    errors = 0
    start_time = time.time()

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = []
        for i in range(num_requests):
            code = codes[i % len(codes)]
            futures.append(executor.submit(click_url, code))

        for future in as_completed(futures):
            status, duration = future.result()
            if status >= 400:
                errors += 1
            durations.append(duration)

    elapsed = time.time() - start_time
    durations.sort()

    print(f"\nResults ({num_requests} requests, {concurrency} concurrent):")
    print(f"  Total time: {elapsed:.1f}s")
    print(f"  Throughput: {num_requests / elapsed:.1f} req/s")
    print(f"  Errors: {errors} ({errors/num_requests*100:.1f}%)")
    print(f"  Latency p50: {durations[len(durations)//2]:.1f}ms")
    print(f"  Latency p95: {durations[int(len(durations)*0.95)]:.1f}ms")
    print(f"  Latency p99: {durations[int(len(durations)*0.99)]:.1f}ms")

if __name__ == "__main__":
    run_load_test()
```

- Run the load test. Record the results.
- Identify bottlenecks:
  - Is the DB the bottleneck? (check if writes are slow)
  - Is the event queue backing up? (check queue depth)
  - Is CPU the issue? (unlikely for this workload)
- Optimize one bottleneck you find (e.g., batch DB writes, add connection
  pooling, add caching for popular URLs).
- Re-run the load test. Compare before/after.

**Journal prompt**: "Load test results — throughput: **\_** req/s, p95: **\_**ms.
Bottleneck was **\_**. After optimization: **\_** req/s."

---

### Day 54 — ADRs + Tenth System Design

**Practice — ADRs** (50 min):

- Write 3 Architecture Decision Records for Project 2. Save as
  `project2/adrs/`. For each, use this format:

```markdown
# ADR-001: [Title]

## Status: Accepted

## Context

What is the situation? What forces are at play?

## Decision

What did we decide?

## Consequences

What are the positive, negative, and neutral consequences?
```

- Suggested ADRs:
  1. "Use SQLite instead of PostgreSQL for development"
  2. "Use in-process queue instead of Redis/Kafka for events"
  3. "Separate analytics into its own service vs keeping in the main API"

**Practice — System design** (60 min):

- System design exercise: **Web Crawler**
- Timer: 45 minutes:
  1. (5 min) Clarify: Scale (how many pages)? Depth? Politeness (rate limit per domain)?
  2. (5 min) Estimate: 1B pages, 1 page/sec/worker, need 1000 workers, complete in ~12 days
  3. (15 min) High-level: URL frontier (priority queue), fetcher workers, content parser, URL extractor, deduplication (bloom filter or set)
  4. (15 min) Deep dive: How to be polite (robots.txt, per-domain delay)? How to deduplicate URLs? How to handle redirects/errors? How to distribute work across machines?
  5. (5 min) Bottlenecks: DNS resolution, network bandwidth, storage for crawled pages

**Journal prompt**: "ADR writing forces me to **\_**. Web crawler: distributed
work scheduling is similar to **\_** in my experience."

---

## WEEK 11: Algorithm Refresh + Project 2 Complete

### Day 55 — Algorithm Refresh (Full)

**Practice** (110 min):

- Full pattern recognition session:

```bash
python main.py --train
```

- Target: >90% accuracy. If below 90%, review the patterns you missed:

```bash
python main.py --pattern <missed_pattern_id>
```

- Then re-solve 3 algorithm problems you previously struggled with. Do NOT look
  at your old solutions first. Attempt from scratch:

```bash
python main.py --run <problem_id_1>
python main.py --run <problem_id_2>
python main.py --run <problem_id_3>
```

- After solving (or getting stuck for 20 min), compare with your old solution.
  Note what changed in your approach.

**Journal prompt**: "Pattern recognition: **\_/30**. Problems re-solved: **\_**.
Compared to Month 1, my biggest improvement is **\_**."

---

### Day 56 — Re-Solve Failed Problems

**Practice** (110 min):

- Run a full report to see your current standing:

```bash
python main.py --report
```

- Identify all problems where you scored <80%. Re-solve each one:
  - Give yourself the original time limit
  - If stuck after 15 minutes, read the hints
  - If stuck after 25 minutes, read/study the solution approach, then
    close it and re-implement from memory

- For each re-solved problem, write in your journal:
  - What pattern does it use?
  - What was the key insight you were missing before?
  - What would you say if someone asked you to explain the approach in 30 seconds?

**Journal prompt**: "Re-solved **\_** problems. The pattern I'm now strongest in:
**\_**. Still weakest in: **\_**."

---

### Day 57 — Project 2: Comprehensive Tests

**Practice** (110 min):

- Write comprehensive tests for Project 2:

- **Unit tests** for each component:
  - Code generation (uniqueness, format)
  - URL validation
  - Analytics aggregation queries
  - Retry logic
  - Circuit breaker state transitions
  - Metrics collection

- **Integration tests** for the full flow:

```python
def test_full_flow():
    """Shorten URL -> click -> verify analytics"""
    # Create short URL
    resp = client.post("/shorten", json={"url": "https://example.com"})
    assert resp.status_code == 200
    code = resp.json()["code"]

    # Click it multiple times
    for _ in range(5):
        resp = client.get(f"/{code}", follow_redirects=False)
        assert resp.status_code == 307

    # Wait for worker to process events
    time.sleep(1)

    # Check analytics
    resp = analytics_client.get(f"/analytics/{code}")
    assert resp.status_code == 200
    assert resp.json()["total_clicks"] == 5
```

- **Edge case tests**:
  - Shorten the same URL twice (should get different codes)
  - Click a non-existent code (404)
  - Analytics for a URL with zero clicks
  - Very long URLs
  - Special characters in URLs

- Run all tests: `pytest project2/tests/ -v`

**Journal prompt**: "Total tests written: **\_**. Integration tests are harder
because **\_**. Edge case I almost missed: **\_**."

---

### Day 58 — Project 2: Finalize + Documentation

**Practice** (110 min):

- Finalize Project 2:
  - Fix any failing tests
  - Add `requirements.txt`
  - Create `project2/Dockerfile` for each service (or a single multi-stage Dockerfile)
  - Create `project2/docker-compose.yml`:

```yaml
version: "3.8"
services:
  shortener:
    build:
      context: .
      dockerfile: shortener/Dockerfile
    ports:
      - "8001:8000"

  analytics:
    build:
      context: .
      dockerfile: analytics/Dockerfile
    ports:
      - "8002:8000"

  worker:
    build:
      context: .
      dockerfile: worker/Dockerfile
```

- Write `project2/README.md`:
  - What it is (1 paragraph)
  - Architecture diagram (ASCII art)
  - How to run (`docker-compose up` or manual setup)
  - API endpoints with curl examples
  - How to run tests
  - Design decisions (link to DESIGN.md and ADRs)

- Push to GitHub (if you have an account).

**Journal prompt**: "Project 2 complete. Total lines of code: roughly **\_**.
Services: **\_**. The hardest part was **\_**."

---

### Day 59 — Eleventh System Design (Advanced)

**Practice** (110 min):

- System design exercise: **Google Drive / Dropbox (File Storage System)**
- Timer: 50 minutes:
  1. (5 min) Clarify: Max file size? Versioning? Sharing? Real-time collaboration? Offline support?
  2. (5 min) Estimate: 500M users, 100M DAU, average 2GB storage/user, 100PB total
  3. (20 min) High-level:
     - Metadata service (file hierarchy, permissions, versions)
     - Block storage (files chunked into 4MB blocks, deduplicated)
     - Sync service (detect local changes, push to server, pull from server)
     - Notification service (tell other devices about changes)
  4. (15 min) Deep dive:
     - How to handle conflicts (two devices edit the same file offline)?
     - How to sync efficiently (only changed blocks, not entire file)?
     - How to handle large files (chunking + parallel upload)?
     - How to implement sharing and permissions?
  5. (5 min) Bottlenecks: Storage cost, sync latency, conflict resolution complexity

- After the timer: review your design. What would you change?

**Journal prompt**: "File sync is fundamentally a **\_** problem. Block-level
dedup reminds me of **\_** in data compression. Key insight: **\_**."

---

### Day 60 — Mock Interview + Self-Assessment

**Practice — Mock interview** (60 min):

- Option A (preferred): Ask a peer, friend, or colleague to give you a random
  system design question. Use a whiteboard or paper. Timer: 45 minutes. Ask
  them for honest feedback.

- Option B (solo): Pick one of these without looking at the details first:
  - Design a video streaming service (YouTube/Netflix)
  - Design a ride-sharing service (Uber/Lyft)
  - Design a real-time gaming leaderboard
  - Set a 45-minute timer. Design it from scratch on paper.

**Practice — Self-assessment** (50 min):

- Score yourself honestly on each area (1-10):
  - Algorithm pattern recognition: \_\_/10
  - Algorithm implementation speed: \_\_/10
  - System design: high-level architecture: \_\_/10
  - System design: deep dive / data model: \_\_/10
  - System design: bottleneck analysis: \_\_/10
  - Code quality and testing: \_\_/10
  - Design documentation (RFC/ADR): \_\_/10
  - Python fluency: \_\_/10

- Compare to your Month 1 self. Where did you improve most?
- What 3 areas need the most continued work?

**Journal prompt**: "Mock interview went: **\_/10**. Strongest area: **\_**.
Biggest remaining gap: **\_**."

---

## WEEK 12: Final Assessments + Integration

### Day 61 — Final Algorithm Assessment (Part 1)

**Practice** (120 min):

- Run a complete fresh report. If possible, delete your old solutions and
  re-implement from scratch (or use a separate directory):

```bash
# Option 1: Fresh start
mkdir solutions_final
# Copy templates, solve fresh

# Option 2: Re-run existing
python main.py --report
```

- Solve problems by category, spending no more than the time limit per problem:
  - Arrays and Strings: `arr_01`, `arr_02`
  - Sliding Window: `sw_01`, `sw_02`
  - Two Pointers: `tp_01`, `tp_02`
  - Binary Search: `bs_01`
  - Graphs: `graph_01`, `graph_02`, `graph_03`

- For each problem, write the pattern you chose and why BEFORE coding.

**Journal prompt**: "Solved **\_/10** problems in this session. Time management:
**\_**. Pattern recognition before coding is now **\_** (automatic/deliberate)."

---

### Day 62 — Final Algorithm Assessment (Part 2)

**Practice** (120 min):

- Continue the assessment. Remaining categories:
  - Trees: `tree_01`, `tree_02`
  - DP: `dp_01`, `dp_02`
  - Linked Lists: `ll_01`
  - Stacks: `stk_01`, `stk_02`
  - Heap: `heap_01`
  - Backtracking: `bt_01`
  - Trie: `trie_01`
  - Bit Manipulation: `bit_01`
  - Prefix Sum: `ps_01`
  - Union Find: `uf_01`

- Run the final report:

```bash
python main.py --report
```

- Compare to your Month 1 report. Calculate improvement per category.

**Journal prompt**: "Final report — strong categories: **\_**. Moderate: **\_**.
Weak: **\_**. Improvement from Month 1: **\_** categories moved up."

---

### Day 63 — Final Pattern Recognition

**Practice** (80 min):

- Full pattern recognition training:

```bash
python main.py --train
```

- Record your accuracy: \_\_/30.
- For any pattern you missed, spend 5 minutes reviewing it:

```bash
python main.py --pattern <pattern_id>
```

- Then do a speed round — go through the decision tree mentally for 10
  random problems from the problem bank. For each, state the pattern in
  under 10 seconds (use a stopwatch):

```bash
python main.py --list
```

Pick 10 at random, read only the problem name and tags, state the pattern.

**Practice** (30 min):

- Write a "Pattern Cheat Sheet" in your journal — for each of the 21 patterns,
  write ONE sentence: when to use it. Keep it to a single page.

**Journal prompt**: "Final pattern accuracy: **\_/30**. Month 1 accuracy was
**\_**. The pattern I will never forget: **\_**. The one I still second-guess: **\_**."

---

### Day 64 — Final System Design: Distributed Key-Value Store (Full RFC)

**Practice** (150 min):

- This is your capstone system design. Write a FULL RFC for a **Distributed
  Key-Value Store**. Use everything you have learned.

- Save as `exercises/final_system_design_rfc.md`.

- Use the RFC template from `guides/05_staff_level.md` section 2.1. Include:

1. **Context**: Why build a distributed KV store? What are the requirements?
   (High availability, low latency, eventual consistency)

2. **Goals**: Support 100K reads/sec, 10K writes/sec, 100TB data, 99.99% availability

3. **Non-Goals**: Strong consistency, SQL queries, multi-key transactions

4. **Proposal**:
   - Consistent hashing with virtual nodes for partitioning
   - Replication factor of 3
   - Quorum reads/writes (W + R > N)
   - Vector clocks or last-write-wins for conflict resolution
   - Gossip protocol for failure detection
   - Hinted handoff for temporary failures
   - Merkle trees for anti-entropy repair
   - Data model and API (GET, PUT, DELETE)

5. **Alternatives Considered**:
   - Single-leader replication (rejected: single point of failure)
   - Strong consistency with Raft (rejected: availability > consistency for this use case)
   - Using an existing solution like DynamoDB (rejected: learning exercise)

6. **Risks and Mitigations**:
   - Data loss during multiple node failures -> increase replication factor
   - Hot keys -> add caching layer, split hot keys
   - Network partition -> sloppy quorum with hinted handoff

7. **Milestones**: Phase 1 (single node), Phase 2 (partitioning), Phase 3 (replication), Phase 4 (failure handling)

- This should be 4-6 pages. Quality over speed.

**Journal prompt**: "This RFC took **\_** minutes. The section I'm most confident
about: **\_**. The section that needs more depth: **\_**."

---

### Day 65 — Review All Guides

**Read** (90 min):

- Skim through all 5 guides. For each, write down your **top 2 takeaways** that
  changed how you think:

1. `guides/01_mental_models.md` — Takeaways: **, **
2. `guides/02_systems_design.md` — Takeaways: **, **
3. `guides/03_software_engineering.md` — Takeaways: **, **
4. `guides/04_cs_fundamentals.md` — Takeaways: **, **
5. `guides/05_staff_level.md` — Takeaways: **, **

**Practice** (20 min):

- Compile your takeaways into a personal "Top 10" list. Save as
  `exercises/top_10_takeaways.md`.

**Journal prompt**: "The guide that had the most impact: **\_**. The mental model
shift that changed my daily work: **\_**."

---

### Day 66 — Personal ADR: Where I Was vs Where I Am

**Practice** (90 min):

- Write a personal Architecture Decision Record about your own growth. Save as
  `exercises/personal_adr.md`. Structure:

```markdown
# Personal ADR: 3-Month Growth Retrospective

## Where I Was (Month 1, Day 1)

- Algorithm skills: [honest assessment]
- System design ability: [honest assessment]
- Software engineering practices: [honest assessment]
- Staff-level skills: [honest assessment]

## Where I Am Now (Month 3, Day 66)

- Algorithm skills: [with evidence — report scores, pattern accuracy]
- System design ability: [with evidence — designs completed, RFC quality]
- Software engineering practices: [with evidence — projects built, tests written]
- Staff-level skills: [with evidence — RFCs written, ADRs, mentoring]

## What Worked

- [Top 3 study strategies that were most effective]

## What I Would Do Differently

- [If starting over, what would I change?]

## What to Focus on Next

- [Top 3 areas for continued growth]
- [Specific actions for each: daily habit, weekly practice, monthly goal]

## Key Decisions Going Forward

- Daily: [e.g., 1 algorithm problem per day, 20 min]
- Weekly: [e.g., 1 system design sketch, 30 min]
- Monthly: [e.g., 1 design doc at work, 1 technical book]
```

**Journal prompt**: "Looking back, the single most valuable thing I did was
**\_**. The skill I'm most proud of developing: **\_**."

---

### Day 67 — Continued Growth Plan

**Read** (40 min):

- `guides/06_three_month_plan.md` — Re-read the **"After the 3 Months"** section.
- Key habits to maintain:
  1. Daily: 1 algorithm problem (20 min)
  2. Weekly: 1 system design sketch (30 min)
  3. Monthly: 1 design doc or ADR at work
  4. Quarterly: 1 technical book
  5. Ongoing: Mentor one junior engineer

**Practice** (70 min):

- Set up your continued practice:
  - Bookmark algorithm practice sites (LeetCode, NeetCode)
  - Create a recurring calendar event: "Algorithm practice" (20 min daily)
  - Create a recurring calendar event: "System design sketch" (30 min weekly)
  - Pick your next technical book from the reading list

- Do one last system design practice — pick any problem you have NOT done yet:
  - Design a video streaming service (YouTube)
  - Design a ride-sharing service (Uber)
  - Design a social media feed (Instagram)
  - Timer: 45 minutes.

**Journal prompt**: "My continued growth plan: daily **\_**, weekly **\_**, monthly
**\_**. Next book: **\_**."

---

### Day 68 — Bonus: Real-Time Dashboard (Optional Start)

If you have time and energy, start **Project 3** (Bonus) from
`guides/06_three_month_plan.md`:

**Practice** (110 min):

- Build a simple real-time dashboard for Project 2's analytics:
  - Backend: Add a WebSocket endpoint to the Analytics API

```python
from fastapi import WebSocket
import asyncio

@app.websocket("/ws/live")
async def live_analytics(websocket: WebSocket):
    await websocket.accept()
    while True:
        # Send latest metrics every 2 seconds
        stats = get_live_stats()  # total clicks, clicks/minute, top URLs
        await websocket.send_json(stats)
        await asyncio.sleep(2)
```

- Frontend: Create a simple HTML page with JavaScript:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>URL Shortener Analytics</title>
  </head>
  <body>
    <h1>Live Analytics</h1>
    <div id="total-clicks">Total: --</div>
    <div id="clicks-per-minute">Rate: --/min</div>
    <div id="top-urls"></div>
    <script>
      const ws = new WebSocket("ws://localhost:8002/ws/live");
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        document.getElementById("total-clicks").textContent =
          `Total: ${data.total_clicks}`;
        document.getElementById("clicks-per-minute").textContent =
          `Rate: ${data.clicks_per_minute}/min`;
      };
    </script>
  </body>
</html>
```

- If you skip this, use the time to catch up on anything incomplete.

**Journal prompt**: "WebSocket is like **\_** compared to HTTP polling. Real-time
updates are important for **\_**."

---

### Day 69 — Final Polish + Portfolio Review

**Practice** (110 min):

- Review both projects holistically:

For **Project 1** (Task Management API):

- [ ] README is clear and complete
- [ ] All tests pass
- [ ] DESIGN.md (RFC) is written
- [ ] Docker works
- [ ] CI/CD pipeline (if set up) is green

For **Project 2** (URL Shortener with Analytics):

- [ ] README is clear and complete
- [ ] All tests pass
- [ ] DESIGN.md (RFC) was written BEFORE implementation
- [ ] ADRs are written for 3 key decisions
- [ ] Health checks work
- [ ] Structured logging is in place
- [ ] Load test results are documented
- [ ] Docker compose works (or manual multi-service setup)

- Fix anything that is incomplete. Push final versions to GitHub.

**Journal prompt**: "Both projects are at **\_**% completion. The one I'm more
proud of: **\_**. If I were reviewing this as a staff engineer, I would say **\_**."

---

### Day 70 — Final Full Assessment

**Practice** (120 min):

- Run every assessment tool one final time:

```bash
# Pattern recognition
python main.py --train

# Full algorithm report
python main.py --report

# Review your decision tree understanding
python main.py --decision-tree
```

- Record final scores:
  - Pattern recognition: **/30 (Month 1: **, Month 2: \_\_)
  - Algorithm categories strong: ** (Month 1: **)
  - Algorithm categories moderate: ** (Month 1: **)
  - Algorithm categories weak: ** (Month 1: **)

- System design self-score (1-10): ** (Month 1: **)
- Total system designs completed: \_\_
- Total RFCs/ADRs written: \_\_

**Journal prompt**: "Final scores recorded. The number I'm most proud of: **\_**.
Three months ago I could not **\_**. Now I can **\_**."

---

### Day 71 — Teaching Exercise

**Practice** (110 min):

- The best test of understanding is teaching. Pick one topic from each area
  and explain it as if to a junior engineer (write it down or record yourself):

1. **Algorithm**: Explain the sliding window pattern — when to use it, how it
   works, walk through an example step by step. (20 min)

2. **System design**: Explain how you would design a URL shortener to someone
   who has never done system design. Walk through the 5 steps. (20 min)

3. **Software engineering**: Explain why testing matters and how to structure
   tests (unit, integration, e2e). Give a concrete example. (15 min)

4. **Staff skills**: Explain what an RFC is and why you write one before
   building. Show your template. (15 min)

- If you have a colleague willing to listen, teach it to them live. If not,
  write it up in `exercises/teaching_notes.md`.

**Journal prompt**: "Teaching revealed that I understand **\_** deeply but still
struggle to explain **\_** simply. Teaching is the best way to **\_**."

---

### Day 72 — Celebration + Next Steps

**Read** (20 min):

- Re-read your personal ADR from Day 66.
- Re-read your Day 1 journal entry.
- Reflect on the journey.

**Practice** (30 min):

- Update your personal ADR with any final thoughts.
- Commit everything:

```bash
cd C:/temp/algorithms_gaps_analysis
git add -A
git commit -m "Complete: 3-month staff SDE study program"
```

**Final journal entry**:

"Day 72. I started this program because **\_**. The three things that changed
most about how I think about software: 1) **\_**, 2) **\_**, 3) **\_**.

My continued practice plan: **\_**.

What I would tell another EE making this transition: **\_**."

---

## MONTH 3 CHECKPOINT (Final)

Verify you have completed:

- [ ] `guides/05_staff_level.md` read fully
- [ ] Project 2 complete with: 2 services + 1 worker, RFC (written first), ADRs, tests, health checks, structured logging, load testing, Docker
- [ ] 11+ system designs completed total
- [ ] Pattern recognition >90% (`python main.py --train`)
- [ ] Final algorithm report shows strong improvement from Month 1
- [ ] Personal ADR written (retrospective + continued growth plan)
- [ ] Can write an RFC from scratch in under 60 minutes
- [ ] Can design a distributed system (KV store level) with proper tradeoff analysis

## What Comes Next

After these 72 days, you have built a strong foundation. Staying sharp requires:

1. **Daily**: 1 algorithm problem, 20 min (keep pattern recognition sharp)
2. **Weekly**: 1 system design sketch, 30 min (whiteboard, no computer)
3. **Monthly**: Write 1 design doc or ADR at work (real practice > exercises)
4. **Quarterly**: Read 1 technical book from the reading list
5. **Always**: Mentor a junior engineer — teaching deepens your own understanding

You have done the work. Now apply it.
