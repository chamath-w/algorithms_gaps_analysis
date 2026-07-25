# CS Fundamentals for Electrical Engineers

You have an advantage: you understand how the hardware actually works. This
guide fills the software-side gaps, connecting each concept back to your
existing hardware knowledge.

---

## Part 1: Operating Systems

You understand interrupts, DMA, memory-mapped I/O, and real-time scheduling
from your embedded work. Here is what that looks like from the software side.

### 1.1 Processes vs Threads

| Concept            | What it is                                        | EE Analogy                                               |
| ------------------ | ------------------------------------------------- | -------------------------------------------------------- |
| **Process**        | Independent program with its own memory space     | Separate MCU on the board — own RAM, own program counter |
| **Thread**         | Lightweight execution unit sharing process memory | Multiple interrupt handlers on the same MCU sharing RAM  |
| **Context switch** | OS saves/restores CPU state when switching        | Interrupt context save/restore — you know the cost       |

**Key insight**: Threads share memory (fast communication, but race conditions).
Processes have isolated memory (safe, but need IPC for communication).

**Why it matters**: When you start a Python program, it is one process with one
main thread. When you use `threading`, you add threads (but Python's GIL limits
true parallelism). When you use `multiprocessing`, you create separate processes
(true parallelism, but higher overhead).

### 1.2 Concurrency vs Parallelism

**Concurrency**: Multiple tasks make progress (possibly on one core, by
interleaving). Like time-division multiplexing.

**Parallelism**: Multiple tasks execute simultaneously on multiple cores.
Like having multiple parallel datapaths.

**Python's concurrency models:**

| Model             | Best for                                        | EE Analogy                                                  |
| ----------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| `threading`       | I/O-bound tasks (network, file)                 | Time-multiplexed I/O with DMA                               |
| `multiprocessing` | CPU-bound tasks (computation)                   | Multiple cores / multiple MCUs                              |
| `asyncio`         | High-concurrency I/O (thousands of connections) | Event loop with non-blocking I/O / cooperative multitasking |

### 1.3 Common Concurrency Bugs

| Bug                | What happens                                                        | How to prevent                                              |
| ------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Race condition** | Two threads read-modify-write the same data                         | Mutex/lock, atomic operations                               |
| **Deadlock**       | Thread A holds lock X waiting for Y; thread B holds Y waiting for X | Lock ordering, timeouts                                     |
| **Starvation**     | A thread never gets CPU time                                        | Fair scheduling, priority inversion prevention              |
| **Data race**      | Unsynchronized concurrent access to shared data                     | Use thread-safe data structures or explicit synchronization |

**Your EE bridge**: You already understand these from hardware — metastability,
bus contention, priority inversion in RTOS. The concepts are identical; the
tools are different (mutexes instead of semaphore peripherals, `asyncio` instead
of interrupt-driven I/O).

### 1.4 Memory Management

**Stack**: Function call frames, local variables. Fixed size. Automatic.
Like the stack pointer in your MCU — LIFO, fast, limited.

**Heap**: Dynamically allocated memory. Larger, slower, fragmentation risk.
Like `malloc` in embedded C — you allocate, you must free (or let the GC do it
in Python).

**Garbage Collection (GC)**: In Python, Java, Go — the runtime automatically
frees unused memory. You do not call `free()`. The tradeoff: occasional GC
pauses (like a brief system interrupt that stalls your main loop).

### 1.5 Virtual Memory

The OS gives each process the illusion of its own contiguous address space. Like
an MMU in an MCU that maps virtual addresses to physical addresses. Pages (4KB
typically) are the unit of mapping. Pages can be swapped to disk (like paging
from NAND flash when SRAM is full).

**Why it matters**: Memory-mapped files, shared memory between processes, and
understanding why your program gets "killed" (OOM killer) when it uses too much
memory.

---

## Part 2: Networking (Layers 4-7)

You understand layers 1-3 (physical, data link, network) from EE. Here are
the upper layers that software engineers work with daily.

### 2.1 TCP vs UDP

| Protocol | Guarantees                         | Use case                       | EE Analogy                                   |
| -------- | ---------------------------------- | ------------------------------ | -------------------------------------------- |
| **TCP**  | Ordered, reliable, flow-controlled | HTTP, databases, file transfer | UART with hardware flow control and ACK/NACK |
| **UDP**  | None — fire and forget             | Video streaming, DNS, gaming   | Raw SPI blast — fast, no handshaking         |

**TCP connection lifecycle**: SYN -> SYN-ACK -> ACK (three-way handshake).
Like your CAN bus arbitration but for establishing a session.

### 2.2 HTTP (Layer 7)

The protocol that runs the web. Stateless request-response over TCP.

```
Client sends:
  GET /api/users/123 HTTP/1.1
  Host: api.example.com
  Authorization: Bearer <token>

Server responds:
  HTTP/1.1 200 OK
  Content-Type: application/json

  {"id": 123, "name": "Alice"}
```

**Status codes to know:**

- 200 OK, 201 Created, 204 No Content
- 301 Moved Permanently, 304 Not Modified
- 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests
- 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable

### 2.3 HTTPS / TLS

TLS is encryption for HTTP. The handshake:

1. Client sends supported cipher suites
2. Server picks a cipher, sends its certificate (public key)
3. Client verifies certificate against trusted CAs
4. They negotiate a shared session key (asymmetric crypto)
5. All further communication uses the session key (symmetric crypto, fast)

**EE bridge**: Like establishing a secure communication channel. Asymmetric
crypto = key exchange (expensive, like initial configuration). Symmetric crypto
= data transfer (cheap, like AES hardware acceleration).

### 2.4 WebSockets

HTTP is request-response (half-duplex). WebSockets upgrade to full-duplex
persistent connections. Like going from a polled UART to an interrupt-driven
bidirectional channel.

**Use for**: Real-time features — chat, live updates, collaborative editing.

### 2.5 DNS

Domain Name System translates human-readable names to IP addresses. Like an
address decoder that maps logical addresses to physical addresses.

`api.example.com` -> DNS lookup -> `93.184.216.34` -> TCP connection

DNS results are cached at multiple levels (browser, OS, ISP) with a TTL. This
is why DNS changes "take time to propagate" — the caches must expire.

---

## Part 3: Databases Deep Dive

### 3.1 SQL Fluency

As a staff engineer, you must be able to write, read, and optimize SQL. This is
non-negotiable — SQL is the "assembly language" of data.

**Core operations:**

```sql
-- Create
INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');

-- Read (with join)
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE o.created_at > '2024-01-01'
ORDER BY o.total DESC
LIMIT 10;

-- Aggregate
SELECT department, COUNT(*) as headcount, AVG(salary) as avg_salary
FROM employees
GROUP BY department
HAVING COUNT(*) > 5;

-- Update
UPDATE users SET email = 'new@example.com' WHERE id = 123;

-- Delete
DELETE FROM orders WHERE status = 'cancelled' AND created_at < '2023-01-01';
```

**Indexing** (critical for performance):

```sql
-- Without index: full table scan O(n) — like searching unsorted RAM
-- With B-tree index: O(log n) — like binary search on sorted data

CREATE INDEX idx_users_email ON users(email);

-- Composite index for multi-column queries
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);
```

**Rule of thumb**: If you filter (`WHERE`) or join (`JOIN ON`) on a column, it
probably needs an index. But indexes slow down writes (must update the index
structure), so don't index everything.

### 3.2 ACID Properties

| Property        | What it means                                        | EE Analogy                                                      |
| --------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| **Atomicity**   | Transaction fully completes or fully rolls back      | DMA burst — all or nothing, no partial transfer                 |
| **Consistency** | Data always satisfies constraints (FK, unique, etc.) | Parity check — invalid states are rejected                      |
| **Isolation**   | Concurrent transactions don't interfere              | Bus arbitration — one master at a time on the critical resource |
| **Durability**  | Committed data survives crashes                      | Data written to non-volatile storage (EEPROM/flash)             |

### 3.3 Database Scaling

**Vertical scaling**: Bigger server (more RAM, faster CPU). Simple but limited.
Like upgrading your MCU to one with more flash and a faster clock.

**Horizontal scaling**: Multiple servers. Complex but unlimited.

**Read replicas**: Write to one leader, read from multiple followers. Good when
reads >> writes. Like a bus with one master and multiple listeners.

**Sharding**: Split data across servers by key (e.g., users A-M on server 1,
N-Z on server 2). Like address decoding that routes to different memory chips.

### 3.4 NoSQL When and Why

Use NoSQL when:

- Schema changes frequently (document store)
- Extreme write volume (column-family)
- Simple key-value access patterns (Redis)
- Graph relationships (graph DB)

Use SQL when:

- Data is relational (joins needed)
- ACID transactions required
- Complex queries (aggregation, reporting)
- Data integrity is paramount

---

## Part 4: Concurrency Patterns in Practice

### 4.1 The Producer-Consumer Pattern

```python
import queue
import threading

buffer = queue.Queue(maxsize=100)

def producer():
    while True:
        item = generate_item()
        buffer.put(item)  # blocks if buffer full

def consumer():
    while True:
        item = buffer.get()  # blocks if buffer empty
        process(item)
```

EE analogy: A FIFO between two clock domains. The queue handles the synchronization.

### 4.2 The Thread Pool Pattern

```python
from concurrent.futures import ThreadPoolExecutor

def fetch_url(url):
    return requests.get(url).text

with ThreadPoolExecutor(max_workers=10) as pool:
    urls = ["http://example.com/1", "http://example.com/2", ...]
    results = list(pool.map(fetch_url, urls))
```

EE analogy: A bank of worker processors that pull tasks from a shared queue.
Like a multi-lane DMA controller.

### 4.3 Async/Await (Python)

```python
import asyncio
import aiohttp

async def fetch_url(session, url):
    async with session.get(url) as response:
        return await response.text()

async def main():
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, url) for url in urls]
        results = await asyncio.gather(*tasks)

asyncio.run(main())
```

**Mental model**: Cooperative multitasking. Each `await` is a voluntary yield
point — "I'm waiting for I/O, someone else can run." Like a cooperative
scheduler in an RTOS where tasks explicitly yield, versus preemptive scheduling
where the OS interrupts them.

**When to use**: When you have many concurrent I/O operations (hundreds/thousands
of connections). Threading has overhead per thread (~8MB stack). Async has
minimal overhead per task.

---

## Part 5: Data Structures Beyond Arrays

You know arrays, linked lists, and trees from DSA courses. Here are the
data structures you need to use fluently in daily engineering:

| Structure            | Python type                        | When to use                           | Access time       |
| -------------------- | ---------------------------------- | ------------------------------------- | ----------------- |
| **Hash map**         | `dict`                             | Key-value lookup, counting, grouping  | O(1) average      |
| **Hash set**         | `set`                              | Membership testing, deduplication     | O(1) average      |
| **Queue**            | `collections.deque`                | FIFO processing, BFS                  | O(1) append/pop   |
| **Heap**             | `heapq`                            | Priority queue, top-K                 | O(log n) push/pop |
| **Sorted container** | `sortedcontainers.SortedList`      | Maintaining sorted order with inserts | O(log n)          |
| **Counter**          | `collections.Counter`              | Frequency counting                    | O(1) per update   |
| **Defaultdict**      | `collections.defaultdict`          | Dict with default values              | O(1)              |
| **Named tuple**      | `typing.NamedTuple` or `dataclass` | Lightweight structured data           | O(1) field access |

---

## References

### Books

- **"Operating Systems: Three Easy Pieces" (OSTEP)** — Free online. Chapters on
  concurrency (26-33) and persistence (36-42) are essential. Written clearly.
  https://pages.cs.wisc.edu/~remzi/OSTEP/
- **"Computer Networking: A Top-Down Approach" by Kurose & Ross** — Standard
  networking textbook. Chapters 2 (application layer) and 3 (transport layer)
  are most relevant for you.

### Online

- **SQL tutorial**: https://sqlzoo.net/ (interactive, do all exercises)
- **PostgreSQL documentation** — Surprisingly readable. The indexing chapter
  is essential: https://www.postgresql.org/docs/current/indexes.html
- **Python asyncio documentation** — Read the official tutorial first:
  https://docs.python.org/3/library/asyncio.html
- **Real Python concurrency tutorial** — Practical guide to threading,
  multiprocessing, and asyncio with code examples
