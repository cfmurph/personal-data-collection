from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.finance import Transaction
from app.models.fitness import FitnessActivity
from app.models.habit import HabitEntry
from app.models.user import User
from app.services.deps import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    # Finance stats (last 30 days)
    txns_30 = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.date >= month_ago,
    ).all()
    spend_30 = abs(sum(t.amount for t in txns_30 if t.amount < 0))
    income_30 = sum(t.amount for t in txns_30 if t.amount >= 0)

    txns_7 = [t for t in txns_30 if t.date >= week_ago]
    spend_7 = abs(sum(t.amount for t in txns_7 if t.amount < 0))

    # Fitness stats (last 30 days)
    activities_30 = db.query(FitnessActivity).filter(
        FitnessActivity.user_id == current_user.id,
        FitnessActivity.date >= month_ago,
    ).all()
    workouts_30 = len(activities_30)
    workouts_7 = len([a for a in activities_30 if a.date >= week_ago])
    calories_30 = sum(a.calories or 0 for a in activities_30)

    # Habits (last 7 days)
    habits_7 = db.query(HabitEntry).filter(
        HabitEntry.user_id == current_user.id,
        HabitEntry.date >= week_ago,
    ).all()
    avg_mood = None
    avg_energy = None
    if habits_7:
        moods = [h.mood for h in habits_7 if h.mood]
        energies = [h.energy for h in habits_7 if h.energy]
        avg_mood = sum(moods) / len(moods) if moods else None
        avg_energy = sum(energies) / len(energies) if energies else None

    # Today's habit
    today_habit = db.query(HabitEntry).filter(
        HabitEntry.user_id == current_user.id,
        HabitEntry.date == today,
    ).first()

    # Spending by day (last 7)
    spend_by_day = {}
    for t in txns_7:
        d = str(t.date)
        spend_by_day[d] = spend_by_day.get(d, 0) + (abs(t.amount) if t.amount < 0 else 0)

    # Recent activities
    recent_activities = sorted(activities_30, key=lambda a: a.date, reverse=True)[:5]

    return {
        "finance": {
            "spend_30_days": spend_30,
            "income_30_days": income_30,
            "spend_7_days": spend_7,
            "transaction_count": len(txns_30),
            "spend_by_day": spend_by_day,
        },
        "fitness": {
            "workouts_30_days": workouts_30,
            "workouts_7_days": workouts_7,
            "calories_30_days": calories_30,
            "recent_activities": [
                {
                    "date": str(a.date),
                    "activity_type": a.activity_type,
                    "duration_minutes": a.duration_minutes,
                    "calories": a.calories,
                }
                for a in recent_activities
            ],
        },
        "habits": {
            "avg_mood_7_days": avg_mood,
            "avg_energy_7_days": avg_energy,
            "entries_7_days": len(habits_7),
            "today_logged": today_habit is not None,
            "today": {
                "mood": today_habit.mood if today_habit else None,
                "energy": today_habit.energy if today_habit else None,
                "focus": today_habit.focus if today_habit else None,
            } if today_habit else None,
        },
        "date": str(today),
    }
