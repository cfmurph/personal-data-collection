from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.fitness import FitnessActivity
from app.models.user import User
from app.schemas.fitness import FitnessActivityOut, FitnessSummary
from app.services.deps import get_current_user
from app.services.import_service import delete_import_batch, import_fitness_csv

router = APIRouter(prefix="/api/fitness", tags=["fitness"])


@router.post("/import")
async def import_fitness_csv_route(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")
    try:
        result = import_fitness_csv(db, current_user.id, content, filename=file.filename)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return result


@router.get("/activities", response_model=list[FitnessActivityOut])
def get_activities(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    activity_type: str | None = Query(default=None),
    limit: int = Query(default=200, le=1000),
    offset: int = Query(default=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(FitnessActivity).filter(FitnessActivity.user_id == current_user.id)
    if start_date:
        q = q.filter(FitnessActivity.date >= start_date)
    if end_date:
        q = q.filter(FitnessActivity.date <= end_date)
    if activity_type:
        q = q.filter(FitnessActivity.activity_type == activity_type)
    return q.order_by(FitnessActivity.date.desc()).offset(offset).limit(limit).all()


@router.get("/summary", response_model=FitnessSummary)
def get_fitness_summary(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(FitnessActivity).filter(FitnessActivity.user_id == current_user.id)
    if start_date:
        q = q.filter(FitnessActivity.date >= start_date)
    if end_date:
        q = q.filter(FitnessActivity.date <= end_date)
    activities = q.all()

    by_type: dict[str, int] = {}
    for a in activities:
        by_type[a.activity_type] = by_type.get(a.activity_type, 0) + 1

    return FitnessSummary(
        total_workouts=len(activities),
        total_duration_minutes=sum(a.duration_minutes or 0 for a in activities),
        total_calories=sum(a.calories or 0 for a in activities),
        total_distance_km=sum(a.distance_km or 0 for a in activities),
        by_activity_type=by_type,
    )


@router.get("/batches")
def get_import_batches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from sqlalchemy import func
    rows = (
        db.query(
            FitnessActivity.import_batch,
            func.count(FitnessActivity.id),
            func.min(FitnessActivity.date),
            func.max(FitnessActivity.date),
        )
        .filter(FitnessActivity.user_id == current_user.id, FitnessActivity.import_batch.isnot(None))
        .group_by(FitnessActivity.import_batch)
        .all()
    )
    return [
        {"batch_id": r[0], "count": r[1], "start_date": str(r[2]), "end_date": str(r[3])}
        for r in rows
    ]


@router.delete("/batches/{batch_id}")
def delete_batch(
    batch_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deleted = delete_import_batch(db, current_user.id, "fitness", batch_id)
    return {"deleted": deleted}


@router.delete("/all")
def delete_all_fitness(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deleted = db.query(FitnessActivity).filter(FitnessActivity.user_id == current_user.id).delete()
    db.commit()
    return {"deleted": deleted}
