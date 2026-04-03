"""
Rule-based insights engine.

Analyses cross-domain data (finance + fitness + habits) and returns
a list of actionable insight objects.
"""

from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models.finance import Transaction
from app.models.fitness import FitnessActivity
from app.models.habit import HabitEntry


def _date_range(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def generate_insights(db: Session, user_id: int) -> list[dict]:
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)

    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id, Transaction.date >= thirty_days_ago)
        .all()
    )
    activities = (
        db.query(FitnessActivity)
        .filter(FitnessActivity.user_id == user_id, FitnessActivity.date >= thirty_days_ago)
        .all()
    )
    habits = (
        db.query(HabitEntry)
        .filter(HabitEntry.user_id == user_id, HabitEntry.date >= thirty_days_ago)
        .all()
    )

    insights: list[dict] = []

    insights += _finance_insights(transactions)
    insights += _fitness_insights(activities)
    insights += _habit_insights(habits)
    insights += _cross_domain_insights(transactions, activities, habits)

    return insights


def _finance_insights(transactions: list[Transaction]) -> list[dict]:
    insights = []
    if not transactions:
        return insights

    spending = [t for t in transactions if t.amount < 0]
    income = [t for t in transactions if t.amount > 0]

    total_spent = abs(sum(t.amount for t in spending))
    total_income = sum(t.amount for t in income)

    # Weekend vs weekday spending
    weekend_spend = abs(sum(t.amount for t in spending if t.date.weekday() >= 5))
    weekday_spend = abs(sum(t.amount for t in spending if t.date.weekday() < 5))
    weekday_days = len({t.date for t in spending if t.date.weekday() < 5}) or 1
    weekend_days = len({t.date for t in spending if t.date.weekday() >= 5}) or 1
    avg_weekday = weekday_spend / weekday_days
    avg_weekend = weekend_spend / weekend_days

    if avg_weekend > avg_weekday * 1.5 and weekend_spend > 20:
        insights.append({
            "id": "finance_weekend_spending",
            "category": "finance",
            "title": "Higher Weekend Spending",
            "description": (
                f"You spend ${avg_weekend:.0f}/day on weekends vs ${avg_weekday:.0f}/day "
                f"on weekdays — {((avg_weekend/avg_weekday)-1)*100:.0f}% more. "
                "Consider planning weekend activities in advance to reduce impulse spending."
            ),
            "severity": "warning",
            "data": {"avg_weekend": avg_weekend, "avg_weekday": avg_weekday},
        })

    # Top category
    category_totals: dict[str, float] = defaultdict(float)
    for t in spending:
        cat = t.category or "Uncategorized"
        category_totals[cat] += abs(t.amount)
    if category_totals:
        top_cat, top_amt = max(category_totals.items(), key=lambda x: x[1])
        pct = (top_amt / total_spent * 100) if total_spent else 0
        if pct > 30:
            insights.append({
                "id": "finance_top_category",
                "category": "finance",
                "title": f"'{top_cat}' is Your Biggest Expense",
                "description": (
                    f"'{top_cat}' accounts for {pct:.0f}% of your spending "
                    f"(${top_amt:.0f} over the last 30 days). "
                    "Review if this aligns with your priorities."
                ),
                "severity": "info",
                "data": {"category": top_cat, "amount": top_amt, "percentage": pct},
            })

    # Savings rate
    if total_income > 0:
        savings_rate = (total_income - total_spent) / total_income * 100
        if savings_rate < 10:
            insights.append({
                "id": "finance_savings_rate",
                "category": "finance",
                "title": "Low Savings Rate",
                "description": (
                    f"Your savings rate is {savings_rate:.1f}% over the last 30 days. "
                    "Aim for at least 20% to build financial resilience."
                ),
                "severity": "warning",
                "data": {"savings_rate": savings_rate},
            })
        elif savings_rate >= 20:
            insights.append({
                "id": "finance_savings_rate",
                "category": "finance",
                "title": "Great Savings Rate",
                "description": (
                    f"You saved {savings_rate:.1f}% of your income this month. Keep it up!"
                ),
                "severity": "positive",
                "data": {"savings_rate": savings_rate},
            })

    return insights


def _fitness_insights(activities: list[FitnessActivity]) -> list[dict]:
    insights = []
    if not activities:
        return insights

    active_days = {a.date for a in activities}
    total_days = 30
    activity_rate = len(active_days) / total_days * 100

    if activity_rate < 30:
        insights.append({
            "id": "fitness_low_activity",
            "category": "fitness",
            "title": "Low Activity Frequency",
            "description": (
                f"You exercised on {len(active_days)} of the last 30 days ({activity_rate:.0f}%). "
                "Aim for at least 5 active days per week for optimal health."
            ),
            "severity": "warning",
            "data": {"active_days": len(active_days), "rate": activity_rate},
        })
    elif activity_rate >= 70:
        insights.append({
            "id": "fitness_high_activity",
            "category": "fitness",
            "title": "Consistently Active",
            "description": (
                f"You exercised on {len(active_days)} of the last 30 days ({activity_rate:.0f}%). "
                "Excellent consistency!"
            ),
            "severity": "positive",
            "data": {"active_days": len(active_days), "rate": activity_rate},
        })

    # Activity type variety
    activity_types = {a.activity_type for a in activities}
    if len(activity_types) == 1:
        insights.append({
            "id": "fitness_variety",
            "category": "fitness",
            "title": "Consider Cross-Training",
            "description": (
                f"All your workouts are '{list(activity_types)[0]}'. "
                "Adding variety (strength, cardio, flexibility) reduces injury risk and improves overall fitness."
            ),
            "severity": "info",
            "data": {"activity_types": list(activity_types)},
        })

    # Calorie trend
    calories_with_date = [(a.date, a.calories) for a in activities if a.calories]
    if len(calories_with_date) >= 5:
        sorted_cal = sorted(calories_with_date, key=lambda x: x[0])
        first_half = [c for _, c in sorted_cal[:len(sorted_cal)//2]]
        second_half = [c for _, c in sorted_cal[len(sorted_cal)//2:]]
        avg_first = sum(first_half) / len(first_half)
        avg_second = sum(second_half) / len(second_half)
        if avg_second > avg_first * 1.15:
            insights.append({
                "id": "fitness_improving_intensity",
                "category": "fitness",
                "title": "Workout Intensity Increasing",
                "description": (
                    f"Your average workout burns {avg_second:.0f} cal recently vs {avg_first:.0f} cal earlier. "
                    "Your fitness is trending upward!"
                ),
                "severity": "positive",
                "data": {"recent_avg_cal": avg_second, "earlier_avg_cal": avg_first},
            })

    return insights


def _habit_insights(habits: list[HabitEntry]) -> list[dict]:
    insights = []
    if len(habits) < 3:
        return insights

    avg_mood = sum(h.mood for h in habits if h.mood) / max(sum(1 for h in habits if h.mood), 1)
    avg_energy = sum(h.energy for h in habits if h.energy) / max(sum(1 for h in habits if h.energy), 1)

    if avg_mood < 2.5:
        insights.append({
            "id": "habit_low_mood",
            "category": "habits",
            "title": "Mood Trending Low",
            "description": (
                f"Your average mood over the last 30 days is {avg_mood:.1f}/5. "
                "Consider reviewing sleep, exercise, and social time."
            ),
            "severity": "warning",
            "data": {"avg_mood": avg_mood},
        })
    elif avg_mood >= 4.0:
        insights.append({
            "id": "habit_high_mood",
            "category": "habits",
            "title": "Positive Mood Trend",
            "description": f"Your average mood is {avg_mood:.1f}/5 — great emotional wellbeing!",
            "severity": "positive",
            "data": {"avg_mood": avg_mood},
        })

    if avg_energy < 2.5:
        insights.append({
            "id": "habit_low_energy",
            "category": "habits",
            "title": "Low Energy Levels",
            "description": (
                f"Average energy is {avg_energy:.1f}/5. "
                "Low energy can affect productivity. Review sleep quality and nutrition."
            ),
            "severity": "warning",
            "data": {"avg_energy": avg_energy},
        })

    return insights


def _cross_domain_insights(
    transactions: list[Transaction],
    activities: list[FitnessActivity],
    habits: list[HabitEntry],
) -> list[dict]:
    insights = []

    if not transactions or not activities:
        return insights

    # Spending on low-activity days vs active days
    active_dates = {a.date for a in activities}
    spend_on_active = defaultdict(float)
    spend_on_inactive = defaultdict(float)

    for t in transactions:
        if t.amount < 0:
            if t.date in active_dates:
                spend_on_active[t.date] += abs(t.amount)
            else:
                spend_on_inactive[t.date] += abs(t.amount)

    if spend_on_active and spend_on_inactive:
        avg_active = sum(spend_on_active.values()) / len(spend_on_active)
        avg_inactive = sum(spend_on_inactive.values()) / len(spend_on_inactive)

        if avg_inactive > avg_active * 1.3 and avg_inactive > 10:
            insights.append({
                "id": "cross_spend_after_inactivity",
                "category": "cross-domain",
                "title": "You Spend More on Inactive Days",
                "description": (
                    f"On days without exercise you spend ${avg_inactive:.0f} vs "
                    f"${avg_active:.0f} on active days — "
                    f"{((avg_inactive/avg_active)-1)*100:.0f}% more. "
                    "Physical activity may help reduce impulsive spending."
                ),
                "severity": "info",
                "data": {"avg_spend_inactive": avg_inactive, "avg_spend_active": avg_active},
            })

    # Mood vs activity correlation
    if habits and activities:
        habit_by_date = {h.date: h for h in habits}
        moods_after_workout = []
        moods_no_workout = []

        for h in habits:
            if h.mood:
                if h.date in active_dates:
                    moods_after_workout.append(h.mood)
                else:
                    moods_no_workout.append(h.mood)

        if moods_after_workout and moods_no_workout:
            avg_mood_workout = sum(moods_after_workout) / len(moods_after_workout)
            avg_mood_no_workout = sum(moods_no_workout) / len(moods_no_workout)

            if avg_mood_workout > avg_mood_no_workout + 0.5:
                insights.append({
                    "id": "cross_exercise_mood",
                    "category": "cross-domain",
                    "title": "Exercise Boosts Your Mood",
                    "description": (
                        f"On days you exercise your mood averages {avg_mood_workout:.1f}/5 "
                        f"vs {avg_mood_no_workout:.1f}/5 on rest days. "
                        "Exercise appears to have a positive effect on your wellbeing."
                    ),
                    "severity": "positive",
                    "data": {
                        "mood_with_exercise": avg_mood_workout,
                        "mood_without_exercise": avg_mood_no_workout,
                    },
                })

    return insights
