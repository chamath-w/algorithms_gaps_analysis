# Mental Model Bridge: Electrical Engineer to Staff Software Engineer

You already have an extraordinarily powerful foundation. EE gives you a way of
thinking about systems — signal flow, feedback loops, impedance matching, noise
margins, timing analysis — that most software engineers never develop. The goal
is not to replace your EE mental models but to **augment them** with software
equivalents and to know when each applies.

This document covers the six critical mental model shifts. Each one follows the
same structure: what you believe now (the EE model), what you need to add (the
software model), and how to reconcile them.

---

## Mental Model 1: Deterministic vs. Eventually Consistent

### Your current model (EE)

In hardware, when you assert a signal on a bus, after the propagation delay and
setup/hold time, every receiver sees the same value at the same time. The clock
edge is the global synchronization point. You think in terms of synchronous
circuits: clock -> combinational logic -> register -> clock.

### The software model

In distributed software systems, **there is no global clock**. When you write a
value to a database, different services may see the old value for an
unpredictable duration. This is not a bug — it is a fundamental physical
constraint (speed of light, network partitions). The CAP theorem formalizes
this: you cannot have Consistency, Availability, and Partition tolerance
simultaneously.

### The bridge

Think of it like an asynchronous circuit with no global clock, or like a
multi-board system where each board has its own oscillator and you communicate
over a serial bus with ACK/NACK protocols. You already understand this at the
hardware level — you just need to accept that **the entire internet is an
asynchronous system with unbounded propagation delay**.

### Installing this model

Every time you design a system that writes data in one place and reads it in
another, ask:

1. What happens if the reader sees stale data? (Is this actually a problem?)
2. What is my consistency requirement? (Strong? Eventual? Causal?)
3. What is my conflict resolution strategy? (Last-write-wins? CRDTs? Locks?)

Most systems can tolerate eventual consistency. The few that cannot (financial
transactions, inventory counts) need explicit distributed transaction protocols
(two-phase commit, saga pattern) — analogous to your handshake protocols.

**Key vocabulary to internalize:**

- **Strong consistency**: Every read returns the most recent write (like a
  synchronous bus).
- **Eventual consistency**: Given enough time with no new writes, all readers
  converge (like PLL lock acquisition).
- **Partition tolerance**: The system continues to function when network
  segments cannot communicate (like a fault-tolerant redundant bus).

---

## Mental Model 2: Composition over Construction

### Your current model (EE)

In EE, you build from transistors up. You understand every layer: physics ->
devices -> gates -> RTL -> architecture. Even when you use an IC, you read the
datasheet because you need to understand timing, power, thermal, and EMI
implications. You design **bottom-up** and you trust nothing you haven't
characterized.

### The software model

In software, you **compose from existing components**. A staff-level SDE does
not write their own HTTP server, database driver, authentication system, or
serialization library. You select proven components, compose them, and write the
**glue logic** (business rules, data transformations, orchestration) that is
unique to your problem.

The skill is not building — it is **selecting, composing, and integrating**.

### The bridge

Think of it like PCB design with COTS (commercial off-the-shelf) components.
You don't design the FPGA — you select it, read its datasheet (API
documentation), design the interfaces (integration layer), and write the
application logic. Software engineering at staff level is the same, except:

- The "datasheet" is the library's API docs, source code, and issue tracker
- The "interfaces" are APIs, protocols, and data formats
- The "application logic" is your business domain

### Installing this model

Before writing any code, ask:

1. Has someone already solved this? (Search GitHub, package registries, internal repos)
2. Is the existing solution good enough? (Don't write your own when 80% fit suffices)
3. What are the risks of depending on this? (Maintenance, license, security, performance)

**The senior engineer builds things. The staff engineer builds the right things
and avoids building the wrong things.**

Practice exercise: Take something you built from scratch recently. Search for
existing libraries that solve the same problem. Evaluate three alternatives
using criteria: API quality, maintenance activity, test coverage, dependency
footprint, license. Write a 1-page evaluation. This is a core staff skill.

---

## Mental Model 3: Optimization-First vs. Clarity-First

### Your current model (EE)

In EE, optimization is survival. Every gate has a propagation delay. Every wire
has capacitance. Every clock cycle matters in real-time systems. You think in
terms of critical paths, pipeline stages, and timing margins. Clever tricks
(clock gating, look-ahead carry, booth multiplication) are celebrated.

### The software model

In software, **the bottleneck is human comprehension, not machine execution**.
Code is read 10x more often than it is written. A clever O(n) algorithm that
nobody on the team can understand, debug, or modify is **worse** than a clear
O(n log n) algorithm that everyone can maintain.

Optimize only after:

1. You have measured and identified the actual bottleneck (profiling)
2. The bottleneck is in your code (not I/O, not network, not database)
3. The optimization is necessary (does the user actually care about 2ms vs 5ms?)

### The bridge

Think of it as the difference between an ASIC and an FPGA. The ASIC is faster
and more power-efficient, but the FPGA is reconfigurable. In software, **code
is always an FPGA** — you will reconfigure it constantly. Optimize for
reconfigurability (clarity, modularity) by default. Only go ASIC (optimize for
performance) on the critical path after measurement.

### Installing this model

When you write code, imagine that a new team member will need to modify it in 6
months with zero context from you. Apply this test:

- Can they understand the intent from the code alone? (Variable names, function
  names, structure)
- Can they change one behavior without breaking others? (Separation of
  concerns)
- Can they verify their change is correct? (Tests)

**Rule of thumb**: If your code needs a comment explaining _what_ it does, the
code is too clever. Refactor until the code reads like the comment. Comments
should explain _why_, not _what_.

---

## Mental Model 4: State Machines are Everywhere

### Your current model (EE)

You already think in state machines — it is one of your superpowers. FSMs are
how you design controllers, protocol handlers, and sequential logic. You draw
state diagrams, you think about transitions, you worry about illegal states and
reset conditions.

### The software model

The same model applies to software, and most software engineers are bad at it.
Apply your FSM thinking to:

- **Object lifecycle**: Created -> Initialized -> Running -> Paused -> Stopped -> Destroyed
- **Request lifecycle**: Received -> Validated -> Authorized -> Processed -> Responded
- **Data lifecycle**: Draft -> Submitted -> Approved -> Published -> Archived
- **Deployment lifecycle**: Built -> Tested -> Staged -> Canary -> Full rollout -> Rolled back

### The bridge

This one is direct — no translation needed. Your EE state machine discipline is
a competitive advantage. Use it. When you see a software system with boolean
flags like `is_started`, `is_paused`, `is_error`, `is_done` — recognize that as
a poorly encoded state machine with 2^4 = 16 states, most of which are illegal.
Refactor it into an explicit enum with defined transitions.

### Installing this model

For every entity in your system, draw the state diagram. Enumerate the states,
transitions, and guards. Then implement it as an explicit state machine (enum +
transition function), not as a bag of booleans. This prevents entire categories
of bugs.

```python
from enum import Enum, auto

class OrderState(Enum):
    CREATED = auto()
    PAID = auto()
    SHIPPED = auto()
    DELIVERED = auto()
    CANCELLED = auto()

VALID_TRANSITIONS = {
    OrderState.CREATED: {OrderState.PAID, OrderState.CANCELLED},
    OrderState.PAID: {OrderState.SHIPPED, OrderState.CANCELLED},
    OrderState.SHIPPED: {OrderState.DELIVERED},
    OrderState.DELIVERED: set(),
    OrderState.CANCELLED: set(),
}

def transition(current: OrderState, target: OrderState) -> OrderState:
    if target not in VALID_TRANSITIONS[current]:
        raise ValueError(f"Cannot transition from {current} to {target}")
    return target
```

---

## Mental Model 5: Layers of Abstraction (It's Not Just the OSI Model)

### Your current model (EE)

You understand layers — physical, data link, network, transport, application.
You understand that each layer hides the complexity of the layer below. But in
EE, you are often comfortable reaching down through the layers (scoping a
signal, reading register dumps, probing the bus).

### The software model

In large-scale software, **respecting abstraction boundaries is not optional**.
When you bypass a layer (calling the database directly instead of going through
the service API, or accessing a private field instead of using the interface),
you create coupling that makes the system impossible to change.

The layers in a typical software system:

```
  User Interface (HTTP/CLI/GUI)
       |
  API / Controller layer (routes, input validation)
       |
  Service / Business Logic layer (domain rules)
       |
  Repository / Data Access layer (database queries)
       |
  Infrastructure (database, cache, message queue, external APIs)
```

Each layer talks only to the layer directly below it. Never skip layers.

### The bridge

Think of it as your PCB stackup. The signal layer does not bypass the ground
plane to reach the power plane. Each layer has a defined interface (impedance,
via connections). In software, the interface is the function/method/API
signature. Violating layer boundaries in software is like routing a high-speed
signal through an incorrect stackup — it works in the lab but fails in
production.

### Installing this model

When you write code, ask: "Which layer does this belong to?" If your controller
function is writing SQL queries, it is crossing layers. If your business logic
is formatting HTML, it is crossing layers. Refactor until each function lives in
exactly one layer.

---

## Mental Model 6: Failure is Normal, Not Exceptional

### Your current model (EE)

In hardware, failures are catastrophic and permanent (chip burns, solder joint
cracks, ESD damage). You design to prevent failures: derating, margins, ESD
protection, thermal analysis. You assume that if the hardware works in
testing, it will work in the field (within specified conditions).

### The software model

In distributed software, **failure is constant and transient**. Network calls
fail. Servers restart. Databases have brief outages. Disks fill up. DNS
resolution fails. None of these are catastrophic — they are routine. The
system must handle them automatically.

### The bridge

Think of it like a communication channel with noise. You do not design for a
noise-free channel — you add error detection, error correction, retransmission,
and graceful degradation. Software does the same:

| EE concept           | Software equivalent           |
| -------------------- | ----------------------------- |
| Error detection      | Health checks, monitoring     |
| Error correction     | Retries with backoff          |
| Retransmission       | Message queues, at-least-once |
| Graceful degradation | Circuit breaker, fallbacks    |
| Redundancy           | Replication, failover         |
| Watchdog timer       | Timeouts, deadlines           |

### Installing this model

For every external call (network, database, file system, API), answer:

1. What happens if it takes 10x longer than expected? (Timeout)
2. What happens if it fails? (Retry? Fallback? Propagate error?)
3. What happens if it fails repeatedly? (Circuit breaker: stop calling and fail fast)
4. What does the user see during failure? (Degraded experience, not a crash)

**The staff engineer does not prevent all failures — they design systems that
handle failure gracefully.**

---

## Summary: Your EE Advantage

| EE Skill                   | Software Application                         |
| -------------------------- | -------------------------------------------- |
| State machine design       | Object/request lifecycle modeling            |
| Timing analysis            | Latency budgeting, SLA design                |
| Signal integrity           | Data integrity, validation, checksums        |
| Protocol design            | API design, contract-first development       |
| Feedback control           | Auto-scaling, rate limiting, PID controllers |
| Testing & characterization | Load testing, chaos engineering, profiling   |
| Datasheet reading          | API documentation, source code reading       |
| Schematic review           | Code review, architecture review             |
| Worst-case analysis        | Capacity planning, failure mode analysis     |
| Debug with scope/analyzer  | Debug with logs, traces, profiler            |

You are not starting from zero. You are **translating** a decade of systems
thinking into a new domain. The mental models are the same — the vocabulary and
tooling are different.
