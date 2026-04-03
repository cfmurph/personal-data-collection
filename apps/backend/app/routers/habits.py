from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.habit import HabitEntry
from app.models.user import User
from app.schemas.habit import HabitEntryCreate, HabitEntryOut, HabitEntryUpdate
from app.services.deps import get_current_user

router = APIRouter(prefix="/api/habits", tags=["habits"])


@router.post("/", response_model=HabitEntryOut, status_code=201)
def create_entry(
    payload: HabitEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(HabitEntry)
        .filter(HabitEntry.user_id == current_user.id, HabitEntry.date == payload.date)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Habit entry for this date already exists. Use PATCH to update.")

    entry = HabitEntry(
        user_id=current_user.id,
        date=payload.date,
        mood=payload.mood,
        energy=payload.energy,
        focus=payload.focus,
        notes=payload.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.patch("/{entry_date}", response_model=HabitEntryOut)
def update_entry(
    entry_date: date,
    payload: HabitEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(HabitEntry)
        .filter(HabitEntry.user_id == current_user.id, HabitEntry.date == entry_date)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="No habit entry found for this date")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/", response_model=list[HabitEntryOut])
def list_entries(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    limit: int = Query(default=90, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(HabitEntry).filter(HabitEntry.user_id == current_user.id)
    if start_date:
        q = q.filter(HabitEntry.date >= start_date)
    if end_date:
        q = q.filter(HabitEntry.date <= end_date)
    return q.order_by(HabitEntry.date.desc()).limit(limit).all()


@router.get("/{entry_date}", response_model=HabitEntryOut)
def get_entry(
    entry_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(HabitEntry)
        .filter(HabitEntry.user_id == current_user.id, HabitEntry.date == entry_date)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="No habit entry found for this date")
    return entry


@router.delete("/{entry_date}")
def delete_entry(
    entry_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entry = (
        db.query(HabitEntry)
        .filter(HabitEntry.user_id == current_user.id, HabitEntry.date == entry_date)
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="No habit entry found for this date")
    db.delete(entry)
    db.commit()
    return {"deleted": True}
