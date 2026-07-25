# Systems Design: The Staff Engineer's Core Skill

System design is to software what schematic/architecture design is to hardware.
At staff level, you will be expected to design systems from a blank whiteboard
and to evaluate designs proposed by others. This is the single most important
skill gap to close.

---

## Part 1: The Building Blocks (Your Component Library)

Just as EE design starts with knowing your component library (op-amps, ADCs,
MCUs, FPGAs), system design starts with knowing the software building blocks
and when to use each one.

### 1.1 Databases

| Type                                 | What it is                                              | EE Analogy                                                      | When to use                                                                      |
| ------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Relational (PostgreSQL, MySQL)**   | Structured tables with relationships, ACID transactions | SRAM — reliable, structured, consistent, but fixed format       | Structured data with relationships, need transactions (orders, users, inventory) |
| **Document (MongoDB, DynamoDB)**     | Schema-flexible JSON documents                          | Flash storage — flexible format, fast reads, variable structure | Semi-structured data, rapid iteration, per-document access patterns              |
| **Key-Value (Redis, Memcached)**     | Simple key->value store, in-memory                      | Register file — extremely fast, small, direct access by key     | Caching, session storage, rate limiting, real-time counters                      |
| **Column-family (Cassandra, HBase)** | Wide-column store, distributed writes                   | Distributed FIFO buffers — high write throughput, partitioned   | Time-series data, IoT telemetry, high write volume                               |
| **Graph (Neo4j, Neptune)**           | Nodes and edges with traversals                         | A netlist — natural for connection/relationship queries         | Social networks, recommendation engines, fraud detection                         |
| **Search (Elasticsearch)**           | Full-text search with inverted index                    | A lookup table / CAM — content-addressable search               | Search functionality, log aggregation, analytics                                 |

**Key decision framework:**

```
Is your data highly relational with transactions? -> Relational (PostgreSQL)
Is your data semi-structured and read-heavy?     -> Document (MongoDB)
Do you need sub-millisecond access by key?        -> Key-Value (Redis)
Is your write volume extremely high?              -> Column-family (Cassandra)
Are you querying relationships/connections?        -> Graph (Neo4j)
Do you need full-text search?                     -> Search (Elasticsearch)
```

**What to study:**

- SQL: Be fluent. You need JOINs, GROUP BY, indexes, query plans.
- Indexing: Understand B-trees (like a sorted lookup structure) and hash indexes.
- Normalization vs denormalization: When to split tables vs duplicate data.
- Sharding: How to split data across multiple database servers.
- Replication: Leader-follower, leader-leader, quorum-based.

### 1.2 Caching

Caching is a buffer between a fast consumer and a slow producer — exactly like
a CPU cache sits between the processor and main memory. Same concepts apply:
cache hit, cache miss, cache invalidation, eviction policy.

**Cache strategies:**

- **Cache-aside (lazy loading)**: App checks cache first, loads from DB on miss.
  Most common. You control what gets cached.
- **Write-through**: Write to cache and DB simultaneously. Consistent but slower writes.
- **Write-behind**: Write to cache, asynchronously write to DB. Fast but risk data loss.

**Cache invalidation** (the hardest problem in CS):

- **TTL (Time-To-Live)**: Cache expires after N seconds. Simple, slightly stale.
- **Event-driven**: Invalidate cache when the source data changes. Consistent but complex.

**When to cache:** Read-heavy workloads where the same data is requested
repeatedly and slight staleness is acceptable.

### 1.3 Message Queues and Event Streaming

| Component                         | What it is                          | EE Analogy                                               | When to use                                                         |
| --------------------------------- | ----------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| **Message Queue (RabbitMQ, SQS)** | Point-to-point message delivery     | A FIFO buffer with flow control                          | Decouple producer from consumer, async processing, load leveling    |
| **Event Stream (Kafka, Kinesis)** | Append-only log, multiple consumers | A shared bus / backplane that multiple listeners can tap | Event sourcing, real-time analytics, data pipeline between services |

**Key concepts:**

- **At-most-once**: Message may be lost. Fast but unreliable. (UDP equivalent)
- **At-least-once**: Message may be duplicated. Make consumer idempotent. (TCP with retries)
- **Exactly-once**: Hard to achieve. Usually at-least-once + idempotent consumer.

### 1.4 Load Balancers and Reverse Proxies

Distribute incoming requests across multiple servers. Like a bus arbiter that
distributes transactions to multiple slaves.

- **Round-robin**: Simple rotation.
- **Least connections**: Route to the server with fewest active connections.
- **Consistent hashing**: Route based on request key. Same key always goes to
  same server (good for caching).

### 1.5 CDN (Content Delivery Network)

Geographically distributed cache for static content. Like having local register
copies instead of going to main memory every time. Reduces latency by serving
content from the nearest edge server.

### 1.6 API Gateway

Single entry point for all clients. Handles: authentication, rate limiting,
routing, request transformation. Like a protocol bridge / bus interface
controller.

---

## Part 2: Distributed Systems Fundamentals

### 2.1 CAP Theorem

In a distributed system with network partitions (which WILL happen), you must
choose between:

- **Consistency**: Every read returns the latest write.
- **Availability**: Every request receives a response (not an error).

You cannot have both during a partition. This is not a bug — it is physics.

**In practice:**

- CP systems (consistent): PostgreSQL with synchronous replication, ZooKeeper.
  Reject requests during partition rather than serve stale data.
- AP systems (available): Cassandra, DynamoDB. Serve possibly-stale data rather
  than reject requests. Resolve conflicts later.

**Your EE bridge**: This is like a multi-master bus with arbitration. During a
bus fault (partition), you either halt (CP) or let each master proceed
independently and reconcile later (AP).

### 2.2 Consistency Models

From strongest to weakest:

1. **Linearizability**: Acts as if there is a single copy. Most expensive.
2. **Sequential consistency**: All nodes see operations in the same order.
3. **Causal consistency**: Causally related operations are seen in order.
4. **Eventual consistency**: All nodes converge eventually. Cheapest.

Most systems use eventual consistency with stronger guarantees where needed
(e.g., compare-and-swap for critical updates).

### 2.3 Consensus Protocols

How do distributed nodes agree on a value? Same problem as clock synchronization
in multi-clock-domain systems.

- **Paxos / Raft**: Leader-based consensus. Leader proposes, majority agrees.
  Raft is understandable — read the Raft paper (see references).
- **Two-Phase Commit (2PC)**: Coordinator asks all nodes to prepare, then commit.
  Blocks if coordinator fails. Like a synchronous bus transaction with ACK.
- **Saga pattern**: Sequence of local transactions with compensating actions on
  failure. Like an asynchronous transaction pipeline with rollback capability.

### 2.4 Latency Numbers Every Engineer Should Know

```
L1 cache reference:                    1 ns
L2 cache reference:                    4 ns
RAM reference:                        100 ns
SSD random read:                   16,000 ns   (16 us)
HDD seek:                      2,000,000 ns   (2 ms)
Same-datacenter network round trip:  500,000 ns (0.5 ms)
Cross-continent network round trip: 150,000,000 ns (150 ms)
```

**Why this matters**: If your service makes 5 sequential database calls at
0.5ms each, that is 2.5ms of latency from I/O alone. Can you parallelize them?
Can you batch them? Can you cache them? This is your latency budget, exactly
like timing analysis on a critical path.

---

## Part 3: System Design Method

When designing a system (in an interview or at work), follow this process:

### Step 1: Clarify Requirements (5 minutes)

- **Functional**: What does the system do? (List the core features)
- **Non-functional**: Scale (users, QPS), latency requirements, availability SLA
- **Constraints**: Budget, team size, existing infrastructure

### Step 2: Estimate Scale (5 minutes)

- Users, requests per second, data size, storage growth rate
- Read-heavy or write-heavy?
- Bursty or steady traffic?

### Step 3: High-Level Design (10 minutes)

- Draw the major components (boxes) and data flow (arrows)
- Identify the API endpoints
- Choose the database type
- Decide on synchronous vs asynchronous processing

### Step 4: Deep Dive (15 minutes)

- Pick the most complex or risky component
- Design the data model (tables, fields, indexes)
- Address: caching, partitioning, replication
- Handle edge cases and failure modes

### Step 5: Address Bottlenecks (5 minutes)

- Single points of failure?
- Scaling bottlenecks?
- Monitoring and alerting?

---

## Part 4: Practice System Design Problems

Complete these in order. For each, draw the architecture, define the API,
choose the database, and address scaling.

### Beginner (do first)

1. **URL Shortener** (TinyURL)
   - Key concepts: hashing, key-value store, read-heavy caching
   - Key question: How to generate unique short codes?

2. **Rate Limiter**
   - Key concepts: sliding window, token bucket, Redis counters
   - Key question: How to handle distributed rate limiting across servers?

3. **Paste Bin**
   - Key concepts: object storage, TTL, CDN for reads
   - Key question: How to handle large pastes?

### Intermediate

4. **Twitter/X News Feed**
   - Key concepts: fan-out on write vs fan-out on read, timeline caching
   - Key question: How to handle celebrity accounts with millions of followers?

5. **Chat System (WhatsApp)**
   - Key concepts: WebSocket, message queue, presence, message ordering
   - Key question: How to guarantee message ordering across devices?

6. **Notification System**
   - Key concepts: priority queue, multiple channels (push, SMS, email), template system
   - Key question: How to handle rate limiting and user preferences?

### Advanced (staff level)

7. **Distributed Task Scheduler**
   - Key concepts: task queue, worker pools, at-least-once execution, dead letter queue
   - Key question: How to handle worker failures mid-task?

8. **Search Autocomplete**
   - Key concepts: trie, prefix ranking, caching hot prefixes, CDN
   - Key question: How to update suggestions in near-real-time?

9. **Distributed Key-Value Store**
   - Key concepts: consistent hashing, replication, vector clocks, gossip protocol
   - Key question: How to handle node failures and data rebalancing?

---

## Part 5: API Design

APIs are the interfaces between software components — like your pin-out and
protocol specifications. Staff engineers design APIs that other teams consume
for years.

### REST API Design Principles

```
GET    /users/{id}          # Read a user (idempotent)
POST   /users               # Create a user
PUT    /users/{id}          # Full update (idempotent)
PATCH  /users/{id}          # Partial update
DELETE /users/{id}          # Delete (idempotent)
```

**Key principles:**

- **Resources are nouns** (users, orders, devices), not verbs
- **HTTP methods are verbs** (GET, POST, PUT, DELETE)
- **Idempotency**: GET, PUT, DELETE should be safe to retry
- **Versioning**: `/v1/users` — never break existing clients
- **Pagination**: Always paginate lists (`?page=2&limit=50`)
- **Error responses**: Consistent format with error codes and messages

### gRPC (for internal service-to-service)

- Protocol Buffers for schema definition (like HDL for data)
- Strongly typed, auto-generated client/server code
- Better performance than REST for internal calls
- Use REST for external/public APIs, gRPC for internal

---

## References

### Must-Read

- **"Designing Data-Intensive Applications" by Martin Kleppmann** — THE book
  on distributed systems for practitioners. Read chapters 1-9 minimum.
- **System Design Interview by Alex Xu** (Vol 1 & 2) — Worked examples of
  system design problems.

### Papers

- **Google MapReduce paper** — Foundation of distributed data processing
- **Amazon Dynamo paper** — How to build a highly available key-value store
- **Raft consensus paper** — Understandable consensus
  (https://raft.github.io/raft.pdf)

### Online

- **ByteByteGo** (https://bytebytego.com/) — Alex Xu's system design visuals
- **System Design Primer** (GitHub: donnemartin/system-design-primer) — Free,
  comprehensive
- **InfoQ architecture talks** — Real-world architecture case studies
