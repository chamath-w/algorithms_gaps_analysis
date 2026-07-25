# 3-Month Plan: EE to Extremely Proficient Staff SDE

## Overview

This plan runs 12 weeks. Budget 10-15 hours/week beyond your normal work.
The plan interleaves theory, practice, and projects so you are never just
reading — you are always building.

```
Month 1: Foundations    (algorithms, CS fundamentals, Python mastery)
Month 2: Architecture   (systems design, databases, APIs)
Month 3: Staff Impact   (design docs, leadership, capstone projects)
```

---

## Month 1: Foundations (Weeks 1-4)

### Week 1: Algorithm Patterns + Python Fluency

**Goal**: Internalize the 21 algorithm patterns, get fluent in Python idioms.

| Day | Activity                                                                                                                                                  | Time |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Mon | Read `guides/01_mental_models.md` fully. Journal which models feel new.                                                                                   | 1.5h |
| Tue | Run `python main.py --patterns` and `--decision-tree`. Study 4 patterns in depth (`--pattern <id>`).                                                      | 2h   |
| Wed | Run `python main.py --train --train-limit 10`. Review every miss.                                                                                         | 1.5h |
| Thu | Solve 3 algorithm problems: `arr_01`, `sw_02`, `graph_02` (easiest from different categories).                                                            | 2h   |
| Fri | Python fluency: Write solutions using list comprehensions, generators, `collections` module, `itertools`. Refactor yesterday's solutions to be idiomatic. | 1.5h |
| Sat | Solve 3 more: `dp_01`, `stk_02`, `bit_01`. Run `python main.py --report` to see your gaps.                                                                | 2h   |

**Deliverable**: First gap analysis report. Identify your 3 weakest categories.

### Week 2: Algorithm Deep Dive + Testing

**Goal**: Attack your weakest patterns. Learn pytest.

| Day | Activity                                                                                               | Time |
| --- | ------------------------------------------------------------------------------------------------------ | ---- |
| Mon | Study your 3 weakest patterns in detail. Read the template code. Trace through by hand.                | 2h   |
| Tue | Solve 3 problems from your weakest categories. Use hints if stuck > 15 min.                            | 2h   |
| Wed | Read `guides/03_software_engineering.md` Part 2 (Testing). Write pytest tests for 2 of your solutions. | 2h   |
| Thu | Run `python main.py --train` (full 30 scenarios). Target > 70% accuracy.                               | 1.5h |
| Fri | Solve the remaining medium-difficulty problems. Run `--report`.                                        | 2h   |
| Sat | Read: "A Philosophy of Software Design" chapters 1-8.                                                  | 2h   |

**Deliverable**: Pattern recognition accuracy > 70%. All medium problems attempted.

### Week 3: Hard Problems + Concurrency

**Goal**: Tackle hard algorithm problems. Understand concurrency.

| Day | Activity                                                                                                 | Time |
| --- | -------------------------------------------------------------------------------------------------------- | ---- |
| Mon | Solve `arr_02` (Trapping Rain Water) and `stk_01` (Largest Rectangle). Both use monotonic patterns.      | 2h   |
| Tue | Solve `sw_01` (Min Window Substring) and `heap_01` (Merge K Lists).                                      | 2h   |
| Wed | Read `guides/04_cs_fundamentals.md` Part 1 (OS) and Part 4 (Concurrency).                                | 1.5h |
| Thu | Practice: Write a producer-consumer in Python with `threading` and `queue`. Then rewrite with `asyncio`. | 2h   |
| Fri | Solve `graph_03` (Alien Dictionary), `dp_02` (Edit Distance).                                            | 2h   |
| Sat | Solve `ll_01` (LRU Cache), `tree_02` (Serialize/Deserialize).                                            | 2h   |

**Deliverable**: 80%+ of algorithm problems solved. Can write concurrent Python.

### Week 4: SQL + Databases + Assessment

**Goal**: SQL fluency. Complete the algorithm assessment. First system design attempt.

| Day | Activity                                                                                                                                       | Time |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Mon | Read `guides/04_cs_fundamentals.md` Part 3 (Databases). Do SQLZoo exercises (SELECT, JOIN, aggregation).                                       | 2h   |
| Tue | Practice: Design a schema for an e-commerce system (users, products, orders, reviews). Write 10 queries including JOINs, GROUP BY, subqueries. | 2h   |
| Wed | Complete any remaining algorithm problems. Run final `--report`.                                                                               | 2h   |
| Thu | Run `python main.py --train` again. Target > 85% accuracy.                                                                                     | 1.5h |
| Fri | First system design practice: Design a URL shortener (see guide 02, Part 4). Write it up on paper/whiteboard. Time yourself to 35 min.         | 1.5h |
| Sat | Read: "Designing Data-Intensive Applications" chapters 1-2.                                                                                    | 2h   |

**Deliverable**: Algorithm gap report showing strong improvement. SQL basics solid. First system design sketch complete.

---

## Month 2: Architecture (Weeks 5-8)

### Week 5: System Design Foundations

| Day | Activity                                                                              | Time |
| --- | ------------------------------------------------------------------------------------- | ---- |
| Mon | Read `guides/02_systems_design.md` Parts 1-2 fully.                                   | 2h   |
| Tue | Read DDIA chapters 3-4 (Storage/Encoding).                                            | 2h   |
| Wed | System design practice: Design a Rate Limiter. 35 min timed.                          | 1.5h |
| Thu | Study: Caching strategies deep dive. Set up Redis locally, practice basic operations. | 2h   |
| Fri | System design practice: Design a Paste Bin. 35 min timed.                             | 1.5h |
| Sat | Read DDIA chapters 5-6 (Replication/Partitioning).                                    | 2h   |

**Deliverable**: 3 beginner system designs completed.

### Week 6: APIs + Networking + Project 1 Start

| Day | Activity                                                                                                                  | Time |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ---- |
| Mon | Read `guides/02_systems_design.md` Part 5 (API Design) and `guides/04_cs_fundamentals.md` Part 2 (Networking).            | 2h   |
| Tue | **Start Project 1** (see Capstone Projects below): Build a REST API with database. Set up the project, define the schema. | 2h   |
| Wed | Project 1: Implement CRUD endpoints with proper error handling.                                                           | 2h   |
| Thu | Project 1: Add input validation, pagination, and basic tests.                                                             | 2h   |
| Fri | Project 1: Add caching (Redis or in-memory). Measure the performance difference.                                          | 2h   |
| Sat | Read DDIA chapters 7-8 (Transactions/Distributed Systems).                                                                | 2h   |

**Deliverable**: Working REST API with database, caching, and tests.

### Week 7: Intermediate System Design + Project 1 Complete

| Day | Activity                                                                                  | Time |
| --- | ----------------------------------------------------------------------------------------- | ---- |
| Mon | System design practice: Twitter/X News Feed. 40 min timed.                                | 1.5h |
| Tue | Project 1: Add authentication, rate limiting, and logging.                                | 2h   |
| Wed | Project 1: Write a design doc (RFC) for the project — retroactively. Practice the format. | 2h   |
| Thu | System design practice: Chat System (WhatsApp). 40 min timed.                             | 1.5h |
| Fri | Project 1: Containerize with Docker. Write a Dockerfile and docker-compose.yml.           | 2h   |
| Sat | Read DDIA chapter 9 (Consistency and Consensus).                                          | 2h   |

**Deliverable**: Project 1 complete with design doc. 2 intermediate system designs.

### Week 8: Advanced System Design + CI/CD

| Day | Activity                                                                                                           | Time |
| --- | ------------------------------------------------------------------------------------------------------------------ | ---- |
| Mon | System design practice: Distributed Task Scheduler. 45 min timed.                                                  | 2h   |
| Tue | Read `guides/03_software_engineering.md` Part 5 (CI/CD). Set up a GitHub Actions pipeline for Project 1.           | 2h   |
| Wed | System design practice: Search Autocomplete. 45 min timed.                                                         | 2h   |
| Thu | Study: Message queues. Set up a simple producer-consumer with a message broker (Redis Pub/Sub or a queue library). | 2h   |
| Fri | System design practice: Notification System. 45 min timed.                                                         | 1.5h |
| Sat | Review all 8 system designs. Identify recurring weaknesses.                                                        | 1.5h |

**Deliverable**: 6+ system designs completed. CI/CD pipeline working.

---

## Month 3: Staff Impact + Capstone (Weeks 9-12)

### Week 9: Staff Skills + Project 2 Start

| Day | Activity                                                                                      | Time |
| --- | --------------------------------------------------------------------------------------------- | ---- |
| Mon | Read `guides/05_staff_level.md` fully.                                                        | 2h   |
| Tue | **Start Project 2** (see below): Distributed system with multiple services. Design doc FIRST. | 2h   |
| Wed | Project 2: Implement service 1 (core business logic).                                         | 2h   |
| Thu | Project 2: Implement service 2 (data pipeline or worker).                                     | 2h   |
| Fri | Project 2: Add inter-service communication (HTTP or message queue).                           | 2h   |
| Sat | Read: "Staff Engineer" by Will Larson, chapters 1-4.                                          | 2h   |

### Week 10: Observability + Project 2 Continue

| Day | Activity                                                             | Time |
| --- | -------------------------------------------------------------------- | ---- |
| Mon | Project 2: Add structured logging and health check endpoints.        | 2h   |
| Tue | Project 2: Add metrics collection (counters, histograms).            | 2h   |
| Wed | Project 2: Add error handling, retries, and circuit breaker pattern. | 2h   |
| Thu | Project 2: Load test the system. Identify bottlenecks. Optimize.     | 2h   |
| Fri | Project 2: Write ADRs for 3 key decisions you made.                  | 1.5h |
| Sat | Read: "Staff Engineer" chapters 5-8.                                 | 2h   |

### Week 11: Algorithm Refresh + Project 2 Complete

| Day | Activity                                                                                                                             | Time |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| Mon | Algorithm refresh: Re-run `python main.py --train`. Target > 90% accuracy.                                                           | 1.5h |
| Tue | Re-solve your previously-failed algorithm problems without looking at old solutions.                                                 | 2h   |
| Wed | Project 2: Write comprehensive tests (unit + integration).                                                                           | 2h   |
| Thu | Project 2: Finalize, document, push to GitHub. Write README.                                                                         | 2h   |
| Fri | System design practice: Pick any advanced problem and design it from scratch. 45 min timed. Evaluate yourself against the framework. | 2h   |
| Sat | Mock interview: Have a peer/friend give you a system design question. 45 min, whiteboard/paper only.                                 | 1.5h |

### Week 12: Integration + Final Assessment

| Day | Activity                                                                               | Time |
| --- | -------------------------------------------------------------------------------------- | ---- |
| Mon | Final algorithm assessment: `python main.py --report` (all problems, fresh solutions). | 3h   |
| Tue | Final pattern recognition: `python main.py --train` (full). Record accuracy.           | 1.5h |
| Wed | Final system design: Design a Distributed Key-Value Store. Full RFC format.            | 2.5h |
| Thu | Review all guides. Write down your top 10 takeaways.                                   | 1.5h |
| Fri | Write a personal ADR: "Where I was 3 months ago vs now. What to focus on next."        | 1.5h |
| Sat | Celebrate. You have put in the work.                                                   | --   |

---

## Capstone Projects

### Project 1: Task Management API (Weeks 6-7)

**What you build**: A REST API for managing tasks (like a simplified Jira).

**Tech stack**: Python (FastAPI or Flask), PostgreSQL, Redis, Docker.

**Requirements**:

- Users can create, read, update, delete tasks
- Tasks have: title, description, status (todo/in_progress/done), assignee, due_date
- Filter/search tasks by status, assignee, date range
- Pagination for list endpoints
- Authentication (API key or JWT)
- Rate limiting (Redis-based)
- Caching for frequently accessed tasks
- Comprehensive tests (pytest)
- CI/CD pipeline (GitHub Actions)
- Docker containerization

**Skills exercised**: REST API design, SQL/database design, caching, testing,
CI/CD, Docker, authentication, input validation.

**Stretch goals**: WebSocket for real-time task updates. Task assignment
notifications via email queue.

### Project 2: URL Shortener with Analytics (Weeks 9-11)

**What you build**: A distributed URL shortener with real-time click analytics.

**Architecture** (2 services + 1 worker):

```
Service 1: URL Shortener API
  - POST /shorten: create short URL
  - GET /{code}: redirect to original URL, publish click event

Service 2: Analytics API
  - GET /analytics/{code}: return click stats (total, by country, by time)

Worker: Click Processor
  - Consumes click events from message queue
  - Aggregates and stores analytics data
```

**Tech stack**: Python (FastAPI), PostgreSQL (URLs), Redis (caching + pub/sub
or use a real message queue), Docker Compose for orchestration.

**Requirements**:

- Design doc (RFC) written BEFORE implementation
- Short code generation (base62 or nano-id)
- Click event pipeline (async processing via queue)
- Analytics aggregation (time-series buckets)
- Health check endpoints for all services
- Structured logging (JSON format)
- Retry logic for inter-service calls
- Load testing (locust or wrk)
- Architecture Decision Records for key choices

**Skills exercised**: Distributed systems, message queues, async processing,
API design, database schema for analytics, observability, design documentation.

### Project 3 (Bonus): Real-Time Dashboard

**What you build**: A web dashboard that displays live analytics from Project 2.

**Tech stack**: Python backend (WebSocket), simple HTML/JS frontend.

**Requirements**:

- WebSocket connection for real-time updates
- Display: total clicks, clicks/minute, top URLs, geographic distribution
- Auto-refreshing charts

**Skills exercised**: WebSocket, real-time data, frontend basics, full-stack
integration.

---

## Reading List (Priority Order)

### Must-Read (Month 1-2)

1. **"A Philosophy of Software Design"** by John Ousterhout — 180 pages, read in 2 sittings
2. **"Designing Data-Intensive Applications"** by Martin Kleppmann — Chapters 1-9
3. **"Staff Engineer"** by Will Larson — 200 pages, read in Month 3

### Should-Read (as time permits)

4. **"The Staff Engineer's Path"** by Tanya Reilly
5. **"Clean Code"** by Robert Martin — Chapters 1-6 only
6. **"System Design Interview"** by Alex Xu — Vol 1

### Reference (keep on desk)

7. **"Refactoring"** by Martin Fowler — Use as a catalog when refactoring
8. **Google SRE book** — Free online, read the monitoring chapters

---

## Progress Tracking

After each week, answer these questions in a journal:

1. **What did I learn this week that changed how I think?**
2. **What am I still confused about?** (Next week's priority)
3. **What did I build?** (Tangible output)
4. **Algorithm pattern recognition accuracy?** (from trainer)
5. **System design comfort level?** (1-10, be honest)

### Milestones

| Week | Checkpoint                                                                             |
| ---- | -------------------------------------------------------------------------------------- |
| 2    | Pattern recognition > 70%. All medium algorithms attempted.                            |
| 4    | Algorithm report shows improvement. SQL basics solid. First system design.             |
| 6    | Project 1 started. 3 beginner system designs complete.                                 |
| 8    | Project 1 complete with RFC. 6+ system designs. CI/CD pipeline working.                |
| 10   | Project 2 in progress. Staff-level skills guide read.                                  |
| 12   | Final assessments complete. Projects on GitHub. Clear picture of ongoing growth areas. |

---

## After the 3 Months

This plan gets you to "extremely proficient." Staying there requires:

1. **Daily coding practice**: 1 algorithm problem per day (20 min) keeps patterns fresh
2. **System design**: 1 design per week (30 min whiteboard sketch)
3. **Reading**: 1 technical book per quarter
4. **Writing**: 1 design doc or ADR per month at work
5. **Teaching**: Mentor one junior engineer — teaching is the best way to learn
