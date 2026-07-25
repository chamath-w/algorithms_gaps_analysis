# Software Engineering Practices for Staff Engineers

This covers the engineering practices that separate professional software
from one-off scripts. As an EE, you know the difference between a prototype
on a breadboard and a production PCB. This guide is that gap for software.

---

## Part 1: Design Principles (The Laws of Software Physics)

### 1.1 SOLID Principles

These are not academic abstractions — they are the mechanical engineering
equivalent of stress analysis applied to code. Each one prevents a specific
class of maintenance nightmare.

**S — Single Responsibility Principle**
A module should have one reason to change.

EE analogy: A voltage regulator regulates voltage. It does not also do clock
generation. If you need both, use two ICs.

```python
# BAD: One class does user auth AND email formatting AND database access
class UserManager:
    def authenticate(self, user, password): ...
    def format_welcome_email(self, user): ...
    def save_to_database(self, user): ...

# GOOD: Each class has one job
class Authenticator:
    def authenticate(self, user, password): ...

class EmailFormatter:
    def format_welcome_email(self, user): ...

class UserRepository:
    def save(self, user): ...
```

**O — Open/Closed Principle**
Open for extension, closed for modification.

EE analogy: A bus protocol (I2C, SPI) is closed — you do not change the
protocol spec when adding a new device. But it is open — you add new devices
on the bus that speak the existing protocol.

```python
# BAD: Adding a new shape requires modifying existing code
def area(shape):
    if shape.type == "circle":
        return 3.14 * shape.radius ** 2
    elif shape.type == "rectangle":
        return shape.width * shape.height
    # Must modify this function for every new shape!

# GOOD: New shapes are added without modifying existing code
class Shape:
    def area(self) -> float: ...

class Circle(Shape):
    def area(self): return 3.14 * self.radius ** 2

class Rectangle(Shape):
    def area(self): return self.width * self.height
```

**L — Liskov Substitution Principle**
Subtypes must be substitutable for their base types without breaking behavior.

EE analogy: A pin-compatible IC replacement must meet all the specs of the
original. A "faster" replacement that draws more power than the supply can
provide violates substitutability.

**I — Interface Segregation Principle**
Don't force clients to depend on methods they don't use.

EE analogy: Don't require a device to implement the full SPI protocol if it
only needs MOSI. Provide a simpler interface.

**D — Dependency Inversion Principle**
High-level modules should not depend on low-level modules. Both should depend
on abstractions.

EE analogy: Your control logic depends on the DAC interface specification, not
on a specific DAC chip. If you swap the DAC, the control logic doesn't change.

```python
# BAD: Business logic depends directly on a specific database
class OrderService:
    def __init__(self):
        self.db = PostgresDatabase()  # hard-coded dependency

# GOOD: Depend on abstraction
class OrderService:
    def __init__(self, repository: OrderRepository):  # injected
        self.repository = repository

# Now you can swap PostgreSQL for DynamoDB without touching OrderService
```

### 1.2 The Design Patterns That Actually Matter

Of the 23 GoF patterns, ~8 come up regularly in modern software. Learn these:

| Pattern       | What it does                                     | When to use                                                   | EE Analogy                              |
| ------------- | ------------------------------------------------ | ------------------------------------------------------------- | --------------------------------------- |
| **Strategy**  | Swap algorithms at runtime                       | Multiple ways to do the same thing (sort, compress, validate) | Selectable clock source                 |
| **Observer**  | Notify subscribers when state changes            | Events, UI updates, pub/sub                                   | Interrupt-driven I/O                    |
| **Factory**   | Create objects without specifying exact class    | When the type to create depends on config/input               | Component selector based on BoM         |
| **Decorator** | Add behavior to objects without inheritance      | Logging, caching, auth wrappers                               | Signal conditioning chain               |
| **Adapter**   | Make incompatible interfaces work together       | Integrating third-party libraries                             | Level shifter / protocol bridge         |
| **Command**   | Encapsulate a request as an object               | Undo/redo, queued operations, macros                          | Command register / instruction encoding |
| **Iterator**  | Traverse a collection without exposing internals | Any time you loop over data                                   | DMA controller scanning a buffer        |
| **Singleton** | Ensure only one instance exists                  | Config, connection pools (use sparingly!)                     | System clock — only one                 |

**Do NOT memorize all 23.** Know these 8 cold. Recognize the others when you
see them.

---

## Part 2: Testing

### 2.1 The Testing Pyramid

```
         /  E2E Tests  \          Few, slow, expensive
        /  Integration   \        Some, moderate speed
       /   Unit Tests      \      Many, fast, cheap
```

**Unit tests**: Test one function/class in isolation. Mock all dependencies.
Fast (milliseconds). You should have hundreds.

**Integration tests**: Test that components work together. Use real database
(or test container). Slower (seconds). You should have dozens.

**End-to-end tests**: Test the full system from user's perspective. Slow
(minutes). You should have a few critical paths.

**EE analogy**: Unit test = testing a single IC on the bench. Integration test
= testing a subsystem on the board. E2E test = full system test with real
inputs/outputs.

### 2.2 What to Test

```
Test behavior, not implementation.

BAD:  "assert function called database.save() exactly once"
GOOD: "assert user is persisted and can be retrieved by ID"
```

Test the contract (inputs -> outputs), not the internals. This allows you to
refactor the implementation without breaking tests.

### 2.3 Test-Driven Development (TDD)

The loop: Red (write failing test) -> Green (minimal code to pass) -> Refactor.

You do not need to practice strict TDD, but the discipline of writing the test
BEFORE or alongside the code prevents the common trap of writing untestable
code.

**Practice**: For the next 5 features you build, write the test first. Not
because TDD is dogma, but because it forces you to think about the interface
before the implementation.

### 2.4 Testing in Python

```python
import pytest

def test_deposit_increases_balance():
    account = Account(balance=100)
    account.deposit(50)
    assert account.balance == 150

def test_withdraw_insufficient_funds_raises():
    account = Account(balance=100)
    with pytest.raises(InsufficientFunds):
        account.withdraw(200)

# Parameterized test — multiple inputs, same logic
@pytest.mark.parametrize("input,expected", [
    ("hello", "HELLO"),
    ("", ""),
    ("Hello World", "HELLO WORLD"),
])
def test_uppercase(input, expected):
    assert to_upper(input) == expected
```

**Key pytest concepts**: fixtures, parametrize, mock/patch, conftest.py,
markers, coverage.

---

## Part 3: Code Review

### 3.1 What Staff Engineers Look For

When reviewing code, evaluate in this order:

1. **Correctness**: Does it do what it claims? Edge cases?
2. **Design**: Is this the right approach? Right abstraction level?
3. **Readability**: Can someone new understand this in 5 minutes?
4. **Performance**: Any obvious bottlenecks? (Only after the above pass)
5. **Testing**: Are the important behaviors tested?

### 3.2 How to Give Feedback

- **Blocking ("Request changes")**: Bugs, security issues, design flaws
- **Non-blocking ("Suggestion")**: Style preferences, alternative approaches
- **Praise**: Call out good patterns — reinforcement works

Frame feedback as questions when possible:

- "What happens if `user` is None here?" (better than "This will crash on None")
- "Have you considered using X instead?" (better than "This should use X")

### 3.3 How to Receive Feedback

- Don't defend — understand. The reviewer sees something you don't.
- Ask clarifying questions if the feedback is unclear.
- If you disagree, explain your reasoning with evidence, not authority.

---

## Part 4: Version Control (Git) at Staff Level

You know the basics. Here is what staff-level looks like:

### 4.1 Branching Strategy

- **Feature branches**: One branch per feature/fix, branched from main
- **Short-lived**: Merge within 1-3 days. Long branches = merge hell
- **Pull requests**: Every change reviewed before merge

### 4.2 Commit Discipline

```
# GOOD: Each commit is a single logical change
git log --oneline
a1b2c3 Add user authentication endpoint
d4e5f6 Add password hashing with bcrypt
g7h8i9 Add login rate limiting

# BAD: Commits are random save points
git log --oneline
a1b2c3 WIP
d4e5f6 more stuff
g7h8i9 fix
```

**Rule**: Each commit should pass all tests. You should be able to `git bisect`
to find when a bug was introduced.

### 4.3 Rebase vs Merge

- **Rebase** for keeping your branch up to date with main (clean linear history)
- **Merge** for integrating your branch INTO main (preserves branch history)
- Never rebase shared/public branches

---

## Part 5: CI/CD (Continuous Integration / Continuous Deployment)

### The Pipeline

```
  Code Push -> Lint -> Unit Tests -> Build -> Integration Tests
       -> Security Scan -> Deploy to Staging -> Deploy to Production
```

**EE analogy**: This is your DFT (Design for Test) and production test flow,
automated. Lint = DRC, Unit tests = functional simulation, Integration tests =
board-level test, Deploy = manufacturing.

### Key Principles

- **Every commit triggers the pipeline** — no manual builds
- **If the pipeline fails, fix it immediately** — broken pipeline = broken assembly line
- **Deploy frequently** — small changes are easier to debug than big releases
- **Feature flags** — deploy code to production disabled, enable incrementally

---

## Part 6: Technical Debt

### What It Is

Technical debt is the gap between the current state of the code and the ideal
state. Like deferred maintenance on equipment — it accrues interest (slower
development, more bugs).

### Types

- **Deliberate**: "We'll use a simple approach now and refactor later" (OK if tracked)
- **Accidental**: "We didn't know there was a better way" (fixed by learning)
- **Bit rot**: Gradual degradation as requirements change and code doesn't adapt

### Staff Engineer's Role

You don't fix all tech debt — you **manage** it strategically:

1. Track it: Label tech debt tickets, quantify impact
2. Prioritize: Fix debt on the critical path, ignore debt in stable code
3. Prevent: Set quality standards in code review
4. Budget: Advocate for 15-20% of sprint capacity for debt reduction

---

## References

### Books

- **"Clean Code" by Robert Martin** — Read chapters 1-6 for the core message.
  Skip the later chapters (overly dogmatic). The first 100 pages will change
  how you write code.
- **"Refactoring" by Martin Fowler** — The catalog of refactoring patterns.
  Read the first 4 chapters, then use the rest as a reference.
- **"A Philosophy of Software Design" by John Ousterhout** — Short, opinionated,
  and practical. Better than Clean Code for experienced engineers.

### Online

- **Google Engineering Practices documentation** — How Google does code review:
  https://google.github.io/eng-practices/
- **The Pragmatic Engineer newsletter** (Gergely Orosz) — Industry practices
  at top tech companies
