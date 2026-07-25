# What Makes a Staff Engineer: Beyond Writing Code

The difference between senior and staff is not technical depth — it is
**technical breadth, judgment, and influence**. A senior engineer delivers
features. A staff engineer shapes the technical direction of a team or
organization. This guide covers the non-coding skills that define the role.

---

## Part 1: The Staff Engineer's Job

### 1.1 The Four Archetypes (from Will Larson)

| Archetype      | What they do                                       | You might be this if...                                                    |
| -------------- | -------------------------------------------------- | -------------------------------------------------------------------------- |
| **Tech Lead**  | Partner with a manager to guide a team's execution | You drive the technical work of a team, set standards, unblock people      |
| **Architect**  | Define the technical vision across teams           | You design systems that multiple teams build and maintain                  |
| **Solver**     | Dive into the hardest problems and resolve them    | You get called in when something is stuck or broken at a fundamental level |
| **Right Hand** | Extend a senior leader's bandwidth                 | You represent the VP/director in technical decisions across an org         |

You do not need to fit one perfectly, but understanding which one your role
emphasizes helps you focus your energy.

### 1.2 The Staff Engineer's Core Outputs

1. **Technical strategy documents** — Where are we going and why?
2. **Design documents (RFCs)** — How are we building this specific thing?
3. **Unblocking others** — Review, mentorship, cross-team coordination
4. **Quality standards** — Code review norms, testing expectations, architecture patterns
5. **Risk identification** — "This will break at 10x scale because..."

You are measured by **organizational impact**, not by lines of code.

---

## Part 2: Writing Design Documents (RFCs)

This is the most important staff-level skill that most engineers never practice.
A design doc is the equivalent of a schematic review in hardware — it is how you
get alignment before building.

### 2.1 RFC Template

```markdown
# RFC: [Title]

**Author**: [Your name]
**Status**: Draft | In Review | Approved | Rejected
**Date**: [Date]
**Reviewers**: [Names]

## Context

What is the problem? Why does it need to be solved now?
What happens if we do nothing?

## Goals and Non-Goals

**Goals**: What this design will accomplish.
**Non-goals**: What this design explicitly will NOT address (prevents scope creep).

## Proposal

The actual design. Include:

- High-level architecture diagram
- Key components and their responsibilities
- Data model / schema
- API contracts
- Error handling strategy

## Alternatives Considered

What other approaches did you evaluate? Why did you reject them?
This section proves you thought broadly before deciding.

## Risks and Mitigations

What could go wrong? How will you detect it? What is the rollback plan?

## Milestones

Phase 1: [scope] — [timeline]
Phase 2: [scope] — [timeline]

## Open Questions

Things you need input on from reviewers.
```

### 2.2 What Makes a Great Design Doc

- **Concise**: 3-6 pages. If it is longer, the design is too complex or you are
  over-specifying implementation details.
- **Alternatives section is substantive**: Not "we could do nothing" — real
  alternatives with honest tradeoff analysis.
- **Addresses failure modes**: What happens when the database is down? When
  traffic spikes 10x? When a dependency changes its API?
- **Clear on what is NOT included**: Non-goals prevent scope creep.

### 2.3 Practice

Write a design doc for one of these (real or hypothetical):

1. Migrating a service from monolith to microservices
2. Adding caching to a read-heavy API
3. Designing a feature flag system
4. Replacing a legacy data store with a new one

Share it with a trusted colleague for review. The practice is in receiving
feedback on your design thinking, not just the writing.

---

## Part 3: Making Technical Decisions

### 3.1 The Decision Framework

For every significant technical decision, evaluate:

| Dimension         | Questions                                                  |
| ----------------- | ---------------------------------------------------------- |
| **Correctness**   | Does it solve the actual problem?                          |
| **Complexity**    | How much complexity does it add? Can the team maintain it? |
| **Cost**          | Build time, infrastructure cost, operational overhead?     |
| **Reversibility** | Is this a one-way door or a two-way door?                  |
| **Timeline**      | Does it fit the business timeline?                         |

**One-way vs two-way doors** (Amazon concept):

- **One-way door**: Hard to reverse (database choice, API published to external clients,
  programming language). Invest time in the decision.
- **Two-way door**: Easy to reverse (internal library choice, feature flag,
  algorithm implementation). Decide quickly and iterate.

### 3.2 Build vs Buy vs Adopt

| Option                  | When                                                          | Risk                                    |
| ----------------------- | ------------------------------------------------------------- | --------------------------------------- |
| **Build**               | Core competitive advantage, unique requirements, nothing fits | Maintenance burden, time to build       |
| **Buy** (SaaS/managed)  | Non-core, well-solved problem, team is small                  | Vendor lock-in, cost at scale           |
| **Adopt** (open source) | Good fit exists, community is healthy                         | Maintenance if community dies, security |

**Rule**: Build only what differentiates your product. Buy/adopt everything else.

### 3.3 Communicating Decisions

After making a decision, document:

- **What** was decided
- **Why** (the reasoning, not just the conclusion)
- **What alternatives** were considered and rejected
- **When to revisit** (conditions under which the decision should be reconsidered)

This is an ADR (Architecture Decision Record). Keep them in a known location
(wiki, repo). Future engineers will thank you.

---

## Part 4: Cross-Team Influence

### 4.1 Working Without Authority

Staff engineers rarely have direct authority over people. You influence through:

- **Expertise**: People follow your lead because your technical judgment is sound
- **Relationships**: You have earned trust across teams through consistent, helpful interactions
- **Documentation**: Your RFCs and ADRs create institutional knowledge
- **Mentorship**: You help others grow, and they amplify your impact

### 4.2 Navigating Disagreements

When you disagree with another senior/staff engineer:

1. **Assume good intent**: They have information or constraints you do not see
2. **Make it about the problem, not the person**: "This approach has risk X" not
   "Your approach is wrong"
3. **Write it down**: Verbal arguments go in circles. Written pros/cons converge
4. **Propose an experiment**: "Can we prototype both and measure?"
5. **Disagree and commit**: Once a decision is made, support it fully even if
   you would have chosen differently

### 4.3 Mentoring Engineers

As a staff engineer, you are expected to grow other engineers. Effective
mentoring:

- **Ask questions instead of giving answers**: "What happens if this fails?"
  teaches more than "Add error handling here."
- **Review their designs, not just their code**: Design review is higher leverage
  than code review.
- **Share your reasoning, not just your conclusions**: "I chose X because of
  Y tradeoff" teaches decision-making.
- **Give them problems slightly above their level**: Growth happens at the
  edge of comfort.

---

## Part 5: Observability and Operations

Staff engineers own the operational health of their systems. You must understand:

### 5.1 The Three Pillars of Observability

| Pillar      | What it tells you                                   | EE Analogy                                       |
| ----------- | --------------------------------------------------- | ------------------------------------------------ |
| **Logs**    | What happened (discrete events)                     | Logic analyzer trace                             |
| **Metrics** | How is the system performing over time (aggregates) | Oscilloscope — signal levels, frequency response |
| **Traces**  | How did a single request flow through the system    | Signal path analysis across multiple boards      |

### 5.2 Key Metrics to Monitor

- **Latency** (p50, p95, p99): How fast are responses?
- **Error rate**: What percentage of requests fail?
- **Throughput**: How many requests per second?
- **Saturation**: How full are resources (CPU, memory, disk, connections)?

These are the "Four Golden Signals" from Google SRE.

### 5.3 Incident Response

When production breaks:

1. **Detect**: Alerts fire (automated monitoring)
2. **Triage**: Is this impacting users? How many? What is the blast radius?
3. **Mitigate**: Restore service ASAP (rollback, feature flag, scale up)
4. **Root cause**: AFTER mitigation, investigate why
5. **Postmortem**: Blameless writeup of what happened, timeline, and action items

**Mitigate first, investigate second.** The hospital analogy: stop the bleeding
before diagnosing the disease.

---

## References

### Books

- **"Staff Engineer" by Will Larson** — THE book on this topic. Short, practical,
  with real stories from staff engineers at top companies.
- **"An Elegant Puzzle" by Will Larson** — Engineering management perspective,
  helpful for understanding how managers think and how to work with them.
- **"The Staff Engineer's Path" by Tanya Reilly** — Complementary to Larson,
  focuses more on the day-to-day practices and skills.

### Online

- **StaffEng.com** — Interviews with staff+ engineers about their roles:
  https://staffeng.com/
- **Google SRE book** — Free online, chapters on monitoring and incident
  response: https://sre.google/sre-book/table-of-contents/
- **Will Larson's blog** — Ongoing writing on staff engineering:
  https://lethain.com/
