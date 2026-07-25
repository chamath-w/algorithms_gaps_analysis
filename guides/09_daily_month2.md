# Month 2: Architecture (Weeks 5-8)

By the end of this month you will: design systems at a whiteboard, build a
production-quality REST API, understand distributed systems trade-offs, and
have completed 8+ system design exercises.

---

## WEEK 5: System Design Foundations

### Day 25 — Distributed Systems Deep Dive

**Read** (60 min):

- `guides/02_systems_design.md` — Re-read **Part 2: Distributed Systems Fundamentals** fully.
- This time, take notes on:
  - CAP theorem: write 1 sentence explaining it to a colleague
  - Consistency models: write the 4 levels in order (strongest to weakest)
  - Consensus: what is the difference between 2PC and Saga pattern?
- Read the latency numbers table again. Write them on a sticky note by your monitor.

**Practice** (50 min):

- System design exercise: **Rate Limiter**
- Timer: 35 minutes. On paper or text file:
  1. (5 min) Clarify: Per-user or global? Fixed window or sliding window? Distributed?
  2. (5 min) Estimate: 1000 users, 100 requests/sec/user limit
  3. (10 min) High-level: Token bucket vs sliding window? Where does state live? (Redis)
  4. (10 min) Deep dive: How to handle distributed rate limiting across multiple servers?
  5. (5 min) Bottlenecks: What if Redis goes down? (Fail open or fail closed?)

- Compare with `guides/02_systems_design.md` Part 4, problem 2.

**Journal prompt**: "CAP theorem in my own words: **\_**. Rate limiter: I chose **\_** algorithm because **\_**."

---

### Day 26 — Message Queues + Third System Design

**Read** (40 min):

- `guides/02_systems_design.md` section 1.3 (Message Queues and Event Streaming) — re-read.
- Research one of these (pick whichever you can install easiest):
  - Redis Pub/Sub: `pip install redis`, read Redis docs on Pub/Sub
  - Python's built-in `queue` module for local message passing (already done in Day 15)
- Key concept: understand at-most-once vs at-least-once vs exactly-once delivery.

**Practice** (70 min):

- System design exercise: **Paste Bin**
- Timer: 35 minutes. On paper or text file:
  1. (5 min) Clarify: Max paste size? Expiration? Public vs private?
  2. (5 min) Estimate: 5M pastes/day, average 10KB, 50GB/day storage
  3. (10 min) High-level: Object storage (S3) for paste content, DB for metadata, CDN for reads
  4. (10 min) Deep dive: How to generate unique paste URLs? How to handle expiration (TTL)?
  5. (5 min) Bottlenecks: What if storage fills up? How to handle viral pastes? (CDN caching)

- Then create a file `exercises/message_queue_demo.py`:

```python
"""
Exercise: Simulate a message queue with producers and consumers.
"""
import queue
import threading
import time
import json

message_queue = queue.Queue()

def producer(name, messages):
    for msg in messages:
        event = {"producer": name, "data": msg, "time": time.time()}
        message_queue.put(json.dumps(event))
        print(f"[{name}] Published: {msg}")
        time.sleep(0.1)

def consumer(name):
    while True:
        try:
            raw = message_queue.get(timeout=2)
            event = json.loads(raw)
            print(f"  [{name}] Consumed: {event['data']} from {event['producer']}")
            message_queue.task_done()
        except queue.Empty:
            print(f"  [{name}] No more messages, shutting down")
            break

# 2 producers, 2 consumers
threads = [
    threading.Thread(target=producer, args=("P1", ["order-1", "order-2", "order-3"])),
    threading.Thread(target=producer, args=("P2", ["payment-1", "payment-2"])),
    threading.Thread(target=consumer, args=("C1",)),
    threading.Thread(target=consumer, args=("C2",)),
]
for t in threads: t.start()
for t in threads: t.join()
```

- Run it. Notice how consumers share the work.

**Journal prompt**: "Message queue mental model: producer -> queue -> consumer. EE equivalent: **\_**. Paste Bin design: **\_**."

---

### Day 27 — DDIA Chapters 1-2 + Load Balancing

**Read** (80 min):

- **"Designing Data-Intensive Applications" (DDIA)** by Martin Kleppmann
  - Chapter 1: Reliable, Scalable, and Maintainable Applications
  - Chapter 2: Data Models and Query Languages
- If you don't have the book, read the summaries at:
  https://github.com/keyvanakbary/learning-notes/blob/master/books/designing-data-intensive-applications.md
- Take notes on:
  - What are the 3 concerns (reliability, scalability, maintainability)?
  - What is the difference between relational and document data models?

**Practice** (30 min):

- `guides/02_systems_design.md` section 1.4 (Load Balancers) — re-read.
- In your journal, draw a diagram showing:
  - Client -> Load Balancer -> 3 app servers -> Database
- Label the load balancing strategy you'd use (round-robin? least connections?).
- Write one sentence about what happens if one app server goes down.

**Journal prompt**: "DDIA key insight from ch1-2: **\_**. Load balancer distributes traffic like **\_** in my EE experience."

---

### Day 28 — DDIA Chapters 3-4 + API Design

**Read** (60 min):

- DDIA Chapter 3: Storage and Retrieval (focus on B-trees vs LSM-trees)
- DDIA Chapter 4: Encoding and Evolution (focus on schema evolution)

**Read** (20 min):

- `guides/02_systems_design.md` — Read **Part 5: API Design** fully.

**Practice** (30 min):

- Design a REST API for a book review platform. Define:
  - Resources: books, authors, reviews, users
  - Endpoints (at least 8): GET/POST/PUT/DELETE for the main resources
  - Response format: JSON with consistent structure
  - Error format: `{"error": {"code": "NOT_FOUND", "message": "Book not found"}}`
  - Pagination: `GET /books?page=2&limit=20`
- Write this API spec in a text file `exercises/book_api_design.txt`.

**Journal prompt**: "B-tree vs LSM-tree: **\_**. API design principles I'll follow: **\_**."

---

### Day 29 — DDIA Chapters 5-6 + Fourth System Design

**Read** (60 min):

- DDIA Chapter 5: Replication (leader-based, multi-leader, leaderless)
- DDIA Chapter 6: Partitioning (key-range, hash-based)
- Key questions to answer in your notes:
  - What is the difference between synchronous and asynchronous replication?
  - What is a split-brain scenario and how is it prevented?
  - What is consistent hashing and why does it help with partitioning?

**Practice** (50 min):

- System design exercise: **Twitter/X News Feed**
- Timer: 40 minutes:
  1. (5 min) Clarify: What operations? Post tweet, read feed, follow/unfollow. Scale?
  2. (5 min) Estimate: 200M users, 100M tweets/day, average 200 followers
  3. (15 min) High-level: Fan-out on write vs fan-out on read. When to use which?
     - Fan-out on write: pre-compute feeds, push to follower caches. Fast reads. Expensive for celebrities.
     - Fan-out on read: query followers' tweets at read time. No pre-computation. Slow reads.
     - Hybrid: fan-out on write for normal users, fan-out on read for celebrities (>10K followers)
  4. (10 min) Deep dive: Feed cache structure. How to merge and rank tweets? Timeline caching with Redis sorted sets.
  5. (5 min) Bottlenecks: Celebrity posting causes write amplification. Rate limiting on writes.

**Journal prompt**: "Replication insight: **\_**. Fan-out on write vs read: I'd choose **\_** for most cases because **\_**."

---

### Day 30 — SWE Practices: SOLID + Design Patterns

**Read** (60 min):

- `guides/03_software_engineering.md` — Read **Part 1: Design Principles** fully (sections 1.1 and 1.2).
- For each SOLID principle, identify one place in your current codebase at work where it applies.
- For the 8 design patterns: focus on Strategy, Observer, Factory, and Adapter. These 4 come up most.

**Practice** (50 min):

- Create `exercises/design_patterns.py`:

```python
"""
Exercise: Implement the Strategy pattern.
Scenario: A notification system that can send via email, SMS, or push.
"""
from abc import ABC, abstractmethod

class NotificationStrategy(ABC):
    @abstractmethod
    def send(self, user: str, message: str) -> None: ...

class EmailNotification(NotificationStrategy):
    def send(self, user: str, message: str) -> None:
        print(f"[EMAIL] To: {user} | {message}")

class SMSNotification(NotificationStrategy):
    def send(self, user: str, message: str) -> None:
        print(f"[SMS] To: {user} | {message}")

class PushNotification(NotificationStrategy):
    def send(self, user: str, message: str) -> None:
        print(f"[PUSH] To: {user} | {message}")

class NotificationService:
    def __init__(self, strategy: NotificationStrategy):
        self.strategy = strategy

    def notify(self, user: str, message: str):
        self.strategy.send(user, message)

# Usage — swap strategy without changing the service
for strategy in [EmailNotification(), SMSNotification(), PushNotification()]:
    service = NotificationService(strategy)
    service.notify("alice", "Your order shipped!")
```

- Run it. Then add a fourth strategy: `SlackNotification`.
- Notice: you did NOT modify `NotificationService`. That is the Open/Closed principle.

**Journal prompt**: "SOLID principle that clicked most: **\_**. Design pattern I'll use at work: **\_**."

---

## WEEK 6: Build Project 1

### Day 31 — Project 1 Setup: Task Management API

**Read** (20 min):

- `guides/06_three_month_plan.md` — Re-read the **Project 1: Task Management API** requirements.
- Decide your stack:
  - **FastAPI** (recommended — modern, async, auto-generates API docs) OR **Flask** (simpler, more familiar)
  - **SQLite** for now (no install needed), upgrade to PostgreSQL later if desired
  - **pytest** for testing

**Practice** (90 min):

- Install dependencies:

```bash
pip install fastapi uvicorn sqlalchemy pydantic pytest httpx
```

- Create your project structure:

```
project1/
  app/
    __init__.py
    main.py          # FastAPI app, routes
    models.py         # SQLAlchemy models
    schemas.py        # Pydantic schemas
    database.py       # Database connection
  tests/
    __init__.py
    test_tasks.py
  requirements.txt
```

- Implement `database.py` (SQLAlchemy setup with SQLite).
- Implement `models.py` (Task model: id, title, description, status, assignee, due_date, created_at).
- Implement `schemas.py` (Pydantic models for create/update/response).
- Run a basic test: create the database and verify the Task table exists.

**Journal prompt**: "Project 1 started. Stack: **\_**. Schema defined with **\_ fields. First challenge: \_\_\_**."

---

### Day 32 — Project 1: CRUD Endpoints

**Practice** (110 min):

- Implement these endpoints in `app/main.py`:
  - `POST /tasks` — Create a new task
  - `GET /tasks` — List all tasks (with pagination: `?skip=0&limit=10`)
  - `GET /tasks/{id}` — Get a single task
  - `PUT /tasks/{id}` — Update a task
  - `DELETE /tasks/{id}` — Delete a task
- Test each endpoint using the FastAPI auto-docs:

```bash
cd project1 && uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/docs in your browser. Test each endpoint interactively.

- Add proper error handling:
  - 404 when task not found
  - 422 when validation fails (FastAPI does this automatically with Pydantic)

**Journal prompt**: "Implemented **\_/5 CRUD endpoints. FastAPI auto-docs feel like \_\_\_**. Error I hit: **\_**."

---

### Day 33 — Project 1: Filtering + Tests

**Practice** (110 min):

- Add filtering to `GET /tasks`:
  - `?status=todo` — filter by status
  - `?assignee=alice` — filter by assignee
  - `?due_before=2024-12-31` — filter by due date
- Add sorting: `?sort_by=created_at&order=desc`

- Write tests in `tests/test_tasks.py`:

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_task():
    response = client.post("/tasks", json={
        "title": "Test task",
        "description": "A test",
        "status": "todo"
    })
    assert response.status_code == 201
    assert response.json()["title"] == "Test task"

def test_get_task_not_found():
    response = client.get("/tasks/99999")
    assert response.status_code == 404

def test_list_tasks_pagination():
    # Create 3 tasks, request page of 2
    for i in range(3):
        client.post("/tasks", json={"title": f"Task {i}", "status": "todo"})
    response = client.get("/tasks?limit=2")
    assert len(response.json()) <= 2
```

- Write at least 10 test functions covering: create, read, update, delete, filtering, pagination, errors.
- Run tests:

```bash
cd project1 && pytest tests/ -v
```

**Journal prompt**: "Wrote **\_** tests. All passing: yes/no. Filtering implementation approach: **\_**."

---

### Day 34 — Project 1: State Machine + Validation + Fifth System Design

**Practice — Project** (60 min):

- Implement a state machine for task status transitions:
  - Valid transitions: todo -> in_progress, in_progress -> done, any -> cancelled
  - Invalid transitions should return 400 with a clear error message
- Implement input validation:
  - Title: required, 1-200 characters
  - Status: must be one of: todo, in_progress, done, cancelled
  - Due date: must be in the future (for new tasks)
- Write tests for the state machine transitions (valid AND invalid).

**Practice — System design** (50 min):

- System design exercise: **Chat System (WhatsApp)**
- Timer: 40 minutes:
  1. (5 min) Clarify: 1-on-1 and group chat? Media? Read receipts? Scale?
  2. (5 min) Estimate: 50M users, 100 messages/user/day, 5B messages/day
  3. (15 min) High-level: WebSocket for real-time, message queue for delivery, database for history
  4. (10 min) Deep dive: How to guarantee message ordering? How to handle offline users? How to do group message fan-out?
  5. (5 min) Bottlenecks: WebSocket connection limits, message storage at scale

**Journal prompt**: "State machine in code feels like **\_** from my EE design work. Chat system key challenge: **\_**."

---

### Day 35 — Project 1: Caching + Logging

**Practice** (110 min):

- Add in-memory caching (use `functools.lru_cache` or a simple dict with TTL):
  - Cache `GET /tasks/{id}` responses
  - Invalidate cache when a task is updated or deleted
  - Add a `X-Cache: HIT` or `X-Cache: MISS` response header

- Add structured logging:

```python
import logging
import json
from datetime import datetime

logger = logging.getLogger("taskapi")

def log_request(method, path, status, duration_ms):
    logger.info(json.dumps({
        "timestamp": datetime.utcnow().isoformat(),
        "method": method,
        "path": path,
        "status": status,
        "duration_ms": round(duration_ms, 2),
    }))
```

- Add a FastAPI middleware that logs every request.

- Write tests that verify caching works (check the `X-Cache` header).

**Journal prompt**: "Cache hit rate after running tests: roughly **\_**%. Logging added: structured JSON format. Middleware feels like **\_**."

---

### Day 36 — Project 1: Finalize + Write RFC

**Practice** (50 min):

- Final touches on Project 1:
  - Add a health check endpoint: `GET /health` returns `{"status": "ok"}`
  - Add a `requirements.txt` with all dependencies
  - Add a `README.md` with: what it is, how to run, how to test, API endpoints
  - Run all tests one final time: `pytest tests/ -v`

**Practice — RFC** (60 min):

- Write a design document (RFC) for Project 1 **retroactively**. Use the template
  from `guides/05_staff_level.md` section 2.1.
- Save it as `project1/DESIGN.md`. Include:
  - Context: Why this API exists
  - Goals and Non-Goals
  - Architecture: How it is structured (layers, data flow)
  - Data model: The schema with field descriptions
  - API contract: All endpoints with request/response examples
  - Alternatives considered: Why FastAPI over Flask? Why SQLite over PostgreSQL?
  - Risks: What would break at 100x scale?

**Journal prompt**: "Project 1 complete. Total lines of code: roughly **\_**. Total tests: **\_**. Writing the RFC took **\_ min and revealed \_\_\_**."

---

## WEEK 7: DDIA + More System Designs

### Day 37 — DDIA Chapters 7-8

**Read** (80 min):

- DDIA Chapter 7: Transactions
  - Key takeaway: What are the isolation levels? (Read committed, snapshot isolation, serializable)
  - What is a write skew and how do you prevent it?
- DDIA Chapter 8: The Trouble with Distributed Systems
  - Key takeaway: What are the 3 types of problems? (Unreliable networks, unreliable clocks, process pauses)
  - What is the difference between network partition and network delay?

**Practice** (30 min):

- In your journal, write a 1-paragraph summary of each chapter in your own words.
- For each chapter, write one thing that surprised you and one thing you already knew from EE.

**Journal prompt**: "Transaction isolation level I'd use for most apps: **\_**. Distributed systems problem that maps to EE: **\_**."

---

### Day 38 — Sixth System Design + Git Practices

**Practice — System design** (50 min):

- System design exercise: **Notification System**
- Timer: 40 minutes:
  1. (5 min) Clarify: Channels (push, SMS, email)? Priority levels? Rate limiting per user?
  2. (5 min) Estimate: 100M users, 10 notifications/user/day = 1B/day
  3. (15 min) High-level: API -> Priority queue -> Channel-specific workers -> Delivery services
  4. (10 min) Deep dive: How to handle user preferences (opt-out per channel)? How to template messages? How to rate limit (max 5 push/hour)?
  5. (5 min) Bottlenecks: Email delivery latency, push notification service limits

**Read** (30 min):

- `guides/03_software_engineering.md` — Read **Part 4: Version Control** (sections 4.1 through 4.3).
- Key takeaways: Feature branches, short-lived branches, commit discipline.

**Practice** (30 min):

- Initialize a git repo for Project 1 if you haven't:

```bash
cd project1 && git init && git add . && git commit -m "Initial commit: Task Management API"
```

- Create a feature branch: `git checkout -b feature/add-search`
- Add a search endpoint: `GET /tasks/search?q=keyword` (search in title and description)
- Commit with a good message, merge back to main.

**Journal prompt**: "Notification system priority queue reminds me of **\_** in hardware. Git branching: I now understand **\_**."

---

### Day 39 — DDIA Chapter 9 + Seventh System Design

**Read** (60 min):

- DDIA Chapter 9: Consistency and Consensus
  - Focus on: Linearizability, ordering guarantees, distributed transactions
  - The Raft consensus algorithm (high-level understanding is sufficient)

**Practice** (50 min):

- System design exercise: **Distributed Task Scheduler**
- Timer: 45 minutes:
  1. (5 min) Clarify: One-time or recurring tasks? Priority? At-least-once or exactly-once?
  2. (5 min) Estimate: 10M scheduled tasks, 1M executions/hour
  3. (15 min) High-level: Task store (DB), scheduler service (picks up due tasks), worker pool (executes), result store
  4. (15 min) Deep dive: How to handle worker failure mid-task? (Heartbeat + timeout + retry). How to prevent duplicate execution? (Claim with compare-and-swap). How to handle recurring tasks? (Re-schedule on completion)
  5. (5 min) Bottlenecks: Hot partition if many tasks due at same time. Fan out work across sharded queues.

**Journal prompt**: "Consensus in distributed systems is like **\_** in hardware. Task scheduler: the hardest part is **\_**."

---

### Day 40 — Eighth System Design + CI/CD

**Practice — System design** (50 min):

- System design exercise: **Search Autocomplete**
- Timer: 45 minutes:
  1. (5 min) Clarify: Top-K suggestions? Personalized? How fast must it respond? (<100ms)
  2. (5 min) Estimate: 10M users, 10 queries/day/user, need to store query frequencies
  3. (15 min) High-level: Trie data structure for prefix matching, cached at CDN edge for hot prefixes
  4. (15 min) Deep dive: How to rank suggestions? (Frequency + recency + user history). How to update the trie? (Offline batch rebuild vs real-time update). How to handle multi-word queries?
  5. (5 min) Bottlenecks: Trie memory. Serve from cache/CDN, rebuild trie periodically.

**Read** (30 min):

- `guides/03_software_engineering.md` — Read **Part 5: CI/CD** fully.

**Practice** (30 min):

- If you have a GitHub account, create a repo for Project 1 and push it.
- Create `.github/workflows/test.yml`:

```yaml
name: Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r requirements.txt
      - run: pytest tests/ -v
```

- Push and verify the workflow runs.

**Journal prompt**: "Search autocomplete: trie is like **\_** in hardware. CI/CD pipeline: my build runs automatically on **\_**."

---

## WEEK 8: Docker + Advanced System Design + Month 2 Wrap

### Day 41 — Docker Fundamentals

**Read** (30 min):

- Docker basics (if unfamiliar):
  - A container is a lightweight, isolated process with its own filesystem
  - EE analogy: it is like a virtual machine but sharing the host OS kernel — like multiple isolated partitions on the same FPGA
  - Key concepts: Image (blueprint), Container (running instance), Dockerfile (build instructions)

**Practice** (80 min):

- Create `project1/Dockerfile`:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- Build and run:

```bash
cd project1
docker build -t task-api .
docker run -p 8000:8000 task-api
```

- Test that the API works via http://127.0.0.1:8000/docs
- Create `project1/docker-compose.yml` (for future expansion with Redis/Postgres):

```yaml
version: "3.8"
services:
  api:
    build: .
    ports:
      - "8000:8000"
```

**Journal prompt**: "Docker container is like **\_** in my hardware experience. My API now runs in a container."

---

### Day 42 — Ninth System Design (Staff-Level)

**Practice** (110 min):

- System design exercise: **Distributed Key-Value Store**
- This is a staff-level problem. Timer: 50 minutes:
  1. (5 min) Clarify: Consistency or availability priority? Read/write ratio? Data size per key?
  2. (5 min) Estimate: 100TB data, 100K reads/sec, 10K writes/sec
  3. (20 min) High-level:
     - Consistent hashing for partitioning (data spread across nodes)
     - Replication factor of 3 (each key stored on 3 nodes)
     - Coordinator node receives request, forwards to responsible nodes
  4. (15 min) Deep dive:
     - How to handle node failure? (Hinted handoff: neighbor temporarily stores data)
     - How to detect and resolve conflicts? (Vector clocks or last-write-wins)
     - How to handle adding/removing nodes? (Virtual nodes in consistent hash ring)
  5. (5 min) Bottlenecks: Hot keys, rebalancing during node addition

- After the timer, compare your design to the Amazon Dynamo paper key concepts:
  - Consistent hashing with virtual nodes
  - Sloppy quorum + hinted handoff
  - Vector clocks for conflict resolution
  - Merkle trees for anti-entropy

**Journal prompt**: "Distributed KV store: consistent hashing is like **\_**. This was the hardest design so far because **\_**."

---

### Day 43 — Technical Debt + Code Review

**Read** (50 min):

- `guides/03_software_engineering.md` — Read **Part 3: Code Review** (sections 3.1 through 3.3).
- `guides/03_software_engineering.md` — Read **Part 6: Technical Debt** fully.

**Practice** (60 min):

- Go back to your Project 1 code. Do a self-code-review:
  - Read every file as if someone else wrote it
  - Write down 5 things you would change (using the review criteria: correctness, design, readability, performance, testing)
  - Pick the 3 most impactful and fix them
  - Commit: `git commit -m "Refactor: improve code based on self-review"`

- Identify 2 pieces of technical debt in your project. For each, write:
  - What the debt is
  - Why it exists (deliberate trade-off or accidental)
  - Impact if left unfixed
  - Estimated effort to fix

**Journal prompt**: "Self-review found **\_** issues. Most important refactoring: **\_**. Tech debt I'm deliberately carrying: **\_**."

---

### Day 44 — Algorithm Refresh + Month 2 Assessment

**Practice — Algorithms** (50 min):

```bash
python main.py --train --train-limit 15
```

- Quick pattern recognition refresh. Target: >85%.
- Then re-solve 2 algorithm problems you previously struggled with:

```bash
python main.py --run <problem_id>
python main.py --run <problem_id>
```

**Practice — System design review** (60 min):

- Review all 9 system designs you have completed. For each:
  - Write 1 sentence: what was the key insight?
  - Write 1 sentence: what would I do differently now?
- Compile these into `exercises/system_design_notes.md`.

**Journal prompt**: "Pattern recognition: **\_/15. System designs completed: 9. The one I'm most confident about: \_\_\_**. Least confident: **\_**."

---

## MONTH 2 CHECKPOINT

Before proceeding to Month 3, verify:

- [ ] 9 system designs completed (URL shortener, rate limiter, paste bin, Twitter feed, chat, notification, task scheduler, search autocomplete, distributed KV store)
- [ ] Project 1 complete with: CRUD, filtering, caching, logging, tests, Docker, RFC
- [ ] DDIA chapters 1-9 read (or summaries)
- [ ] Pattern recognition still >85% (`python main.py --train`)
- [ ] Understand: SOLID, Strategy/Observer/Factory patterns, testing pyramid, CI/CD, git branching
- [ ] Can explain: CAP theorem, consistency models, replication, partitioning, consensus

If you are behind on any of these, spend Days 45-46 catching up before starting Month 3.
