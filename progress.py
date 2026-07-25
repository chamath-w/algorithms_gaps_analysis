#!/usr/bin/env python3
"""
Offline progress + spaced repetition (SM-2 inspired).

Persists to results/progress.json so flights and offline study keep state.
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path

RESULTS_DIR = Path(__file__).parent / "results"
PROGRESS_FILE = RESULTS_DIR / "progress.json"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse(ts: str | None) -> datetime | None:
    if not ts:
        return None
    return datetime.fromisoformat(ts)


@dataclass
class CardState:
    card_id: str
    ease: float = 2.5
    interval_days: float = 0.0
    repetitions: int = 0
    due_at: str = ""
    last_result: str = ""  # again | hard | good | easy
    lapses: int = 0
    history: list[dict] = field(default_factory=list)

    def ensure_due(self) -> None:
        if not self.due_at:
            self.due_at = _now().isoformat()


@dataclass
class LessonProgress:
    lesson_id: str
    status: str = "not_started"  # not_started | in_progress | done
    score: float | None = None
    updated_at: str = ""


@dataclass
class ProgressStore:
    version: int = 1
    lessons: dict[str, LessonProgress] = field(default_factory=dict)
    cards: dict[str, CardState] = field(default_factory=dict)
    quiz_sessions: list[dict] = field(default_factory=list)
    generated_solved: int = 0
    generated_failed: int = 0
    notes: list[str] = field(default_factory=list)


def load_progress() -> ProgressStore:
    RESULTS_DIR.mkdir(exist_ok=True)
    if not PROGRESS_FILE.exists():
        return ProgressStore()
    raw = json.loads(PROGRESS_FILE.read_text(encoding="utf-8"))
    lessons = {
        k: LessonProgress(**v) for k, v in raw.get("lessons", {}).items()
    }
    cards = {k: CardState(**v) for k, v in raw.get("cards", {}).items()}
    return ProgressStore(
        version=raw.get("version", 1),
        lessons=lessons,
        cards=cards,
        quiz_sessions=raw.get("quiz_sessions", []),
        generated_solved=raw.get("generated_solved", 0),
        generated_failed=raw.get("generated_failed", 0),
        notes=raw.get("notes", []),
    )


def save_progress(store: ProgressStore) -> Path:
    RESULTS_DIR.mkdir(exist_ok=True)
    payload = {
        "version": store.version,
        "lessons": {k: asdict(v) for k, v in store.lessons.items()},
        "cards": {k: asdict(v) for k, v in store.cards.items()},
        "quiz_sessions": store.quiz_sessions,
        "generated_solved": store.generated_solved,
        "generated_failed": store.generated_failed,
        "notes": store.notes,
        "saved_at": _now().isoformat(),
    }
    PROGRESS_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return PROGRESS_FILE


def mark_lesson(store: ProgressStore, lesson_id: str, status: str, score: float | None = None) -> None:
    lp = store.lessons.get(lesson_id) or LessonProgress(lesson_id=lesson_id)
    lp.status = status
    if score is not None:
        lp.score = score
    lp.updated_at = _now().isoformat()
    store.lessons[lesson_id] = lp


def ensure_card(store: ProgressStore, card_id: str) -> CardState:
    if card_id not in store.cards:
        card = CardState(card_id=card_id)
        card.ensure_due()
        store.cards[card_id] = card
    return store.cards[card_id]


def review_card(store: ProgressStore, card_id: str, grade: str) -> CardState:
    """
    grade: again | hard | good | easy
    SM-2 inspired intervals for offline SRS.
    """
    card = ensure_card(store, card_id)
    grade = grade.lower().strip()
    if grade not in {"again", "hard", "good", "easy"}:
        raise ValueError(f"Invalid grade: {grade}")

    if grade == "again":
        card.repetitions = 0
        card.interval_days = 0.0
        card.ease = max(1.3, card.ease - 0.2)
        card.lapses += 1
        due = _now() + timedelta(minutes=10)
    else:
        if card.repetitions == 0:
            card.interval_days = 1.0 if grade != "easy" else 2.0
        elif card.repetitions == 1:
            card.interval_days = 3.0 if grade != "easy" else 4.0
        else:
            mult = {"hard": 1.2, "good": card.ease, "easy": card.ease * 1.3}[grade]
            card.interval_days = max(1.0, card.interval_days * mult)
        if grade == "hard":
            card.ease = max(1.3, card.ease - 0.15)
        elif grade == "easy":
            card.ease = card.ease + 0.15
        card.repetitions += 1
        due = _now() + timedelta(days=card.interval_days)

    card.due_at = due.isoformat()
    card.last_result = grade
    card.history.append({"at": _now().isoformat(), "grade": grade, "interval": card.interval_days})
    if len(card.history) > 50:
        card.history = card.history[-50:]
    return card


def due_cards(store: ProgressStore, limit: int | None = None) -> list[CardState]:
    now = _now()
    due = []
    for card in store.cards.values():
        card.ensure_due()
        ts = _parse(card.due_at)
        if ts is None or ts <= now:
            due.append(card)
    due.sort(key=lambda c: c.due_at)
    if limit is not None:
        due = due[:limit]
    return due


def record_quiz_session(store: ProgressStore, topic: str, correct: int, total: int, details: dict | None = None) -> None:
    store.quiz_sessions.append({
        "at": _now().isoformat(),
        "topic": topic,
        "correct": correct,
        "total": total,
        "accuracy": round(correct / total, 3) if total else 0.0,
        "details": details or {},
    })
    if len(store.quiz_sessions) > 200:
        store.quiz_sessions = store.quiz_sessions[-200:]


def format_progress(store: ProgressStore) -> str:
    from curriculum import all_lessons

    lessons = all_lessons()
    done = sum(1 for _, _, les in lessons if store.lessons.get(les.id, LessonProgress(les.id)).status == "done")
    total = len(lessons)
    due = due_cards(store)
    lines = [
        "",
        "=" * 64,
        "  COURSE PROGRESS (offline)",
        "=" * 64,
        "",
        f"  Lessons complete: {done}/{total} ({(100 * done / total) if total else 0:.0f}%)",
        f"  SRS cards tracked: {len(store.cards)}  |  due now: {len(due)}",
        f"  Generated problems: {store.generated_solved} solved / {store.generated_failed} failed",
        f"  Quiz sessions logged: {len(store.quiz_sessions)}",
        "",
    ]
    if store.quiz_sessions:
        recent = store.quiz_sessions[-5:]
        lines.append("  Recent quizzes:")
        for s in recent:
            lines.append(f"    {s['at'][:19]}  {s['topic']:<20} {s['correct']}/{s['total']} ({100*s['accuracy']:.0f}%)")
        lines.append("")
    if due:
        lines.append("  Due for review (SRS):")
        for c in due[:12]:
            lines.append(f"    - {c.card_id}  (ease={c.ease:.2f}, lapses={c.lapses})")
        if len(due) > 12:
            lines.append(f"    ... +{len(due) - 12} more")
        lines.append("")
    lines.append(f"  Saved at: {PROGRESS_FILE}")
    lines.append("")
    return "\n".join(lines)
