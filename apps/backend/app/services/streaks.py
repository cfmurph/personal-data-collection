"""
Streak calculation service.

A streak is the number of consecutive days ending today (or yesterday if today
hasn't been logged yet) on which the user made a habit entry.
"""

from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.habit import HabitEntry


def calculate_streaks(db: Session, user_id: int) -> dict:
    entries = (
        db.query(HabitEntry.date)
        .filter(HabitEntry.user_id == user_id)
        .order_by(HabitEntry.date.desc())
        .all()
    )

    if not entries:
        return {"current_streak": 0, "best_streak": 0, "total_logged_days": 0}

    logged_dates = sorted({e[0] for e in entries}, reverse=True)
    today = date.today()

    # Current streak — must include today or yesterday to be active
    current_streak = 0
    check = today
    if logged_dates[0] < today - timedelta(days=1):
        current_streak = 0
    else:
        for d in logged_dates:
            if d == check or d == check - timedelta(days=1):
                current_streak += 1
                check = d
            elif d < check - timedelta(days=1):
                break

    # Best streak — longest consecutive run in history
    best_streak = 0
    run = 1
    sorted_asc = sorted(logged_dates)
    for i in range(1, len(sorted_asc)):
        if sorted_asc[i] == sorted_asc[i - 1] + timedelta(days=1):
            run += 1
            best_streak = max(best_streak, run)
        else:
            run = 1
    best_streak = max(best_streak, run, current_streak)

    return {
        "current_streak": current_streak,
        "best_streak": best_streak,
        "total_logged_days": len(logged_dates),
    }
