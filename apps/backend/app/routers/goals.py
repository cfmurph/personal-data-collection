from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.budget_goal import BudgetGoal
from app.models.finance import Transaction
from app.models.user import User
from app.services.deps import get_current_user

router = APIRouter(prefix="/api/goals", tags=["goals"])


class GoalUpsert(BaseModel):
    category: str
    monthly_limit: float = Field(gt=0)


class GoalOut(BaseModel):
    id: int
    category: str
    monthly_limit: float
    spent_this_month: float
    percent_used: float

    model_config = {"from_attributes": True}


def _spent_this_month(db: Session, user_id: int, category: str) -> float:
    today = date.today()
    start = today.replace(day=1)
    result = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == user_id,
            Transaction.category == category,
            Transaction.amount < 0,
            Transaction.date >= start,
        )
        .scalar()
    )
    return abs(result or 0.0)


@router.get("/", response_model=list[GoalOut])
def list_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goals = db.query(BudgetGoal).filter(BudgetGoal.user_id == current_user.id).all()
    return [
        GoalOut(
            id=g.id,
            category=g.category,
            monthly_limit=g.monthly_limit,
            spent_this_month=_spent_this_month(db, current_user.id, g.category),
            percent_used=min(
                (_spent_this_month(db, current_user.id, g.category) / g.monthly_limit) * 100,
                100,
            ),
        )
        for g in goals
    ]


@router.put("/{category}", response_model=GoalOut)
def upsert_goal(
    category: str,
    payload: GoalUpsert,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = (
        db.query(BudgetGoal)
        .filter(BudgetGoal.user_id == current_user.id, BudgetGoal.category == category)
        .first()
    )
    if goal:
        goal.monthly_limit = payload.monthly_limit
    else:
        goal = BudgetGoal(
            user_id=current_user.id,
            category=payload.category,
            monthly_limit=payload.monthly_limit,
        )
        db.add(goal)
    db.commit()
    db.refresh(goal)

    spent = _spent_this_month(db, current_user.id, goal.category)
    return GoalOut(
        id=goal.id,
        category=goal.category,
        monthly_limit=goal.monthly_limit,
        spent_this_month=spent,
        percent_used=min((spent / goal.monthly_limit) * 100, 100),
    )


@router.delete("/{category}", status_code=204)
def delete_goal(
    category: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deleted = (
        db.query(BudgetGoal)
        .filter(BudgetGoal.user_id == current_user.id, BudgetGoal.category == category)
        .delete()
    )
    db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Goal not found")
