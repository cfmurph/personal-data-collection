from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.finance import Transaction
from app.models.user import User
from app.schemas.finance import TransactionOut, TransactionSummary
from app.services.deps import get_current_user
from app.services.import_service import delete_import_batch, import_financial_csv

router = APIRouter(prefix="/api/finance", tags=["finance"])


@router.post("/import")
async def import_finance_csv(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")
    try:
        result = import_financial_csv(db, current_user.id, content, filename=file.filename)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return result


@router.get("/transactions", response_model=list[TransactionOut])
def get_transactions(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    category: str | None = Query(default=None),
    limit: int = Query(default=200, le=1000),
    offset: int = Query(default=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if start_date:
        q = q.filter(Transaction.date >= start_date)
    if end_date:
        q = q.filter(Transaction.date <= end_date)
    if category:
        q = q.filter(Transaction.category == category)
    return q.order_by(Transaction.date.desc()).offset(offset).limit(limit).all()


@router.get("/summary", response_model=TransactionSummary)
def get_summary(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if start_date:
        q = q.filter(Transaction.date >= start_date)
    if end_date:
        q = q.filter(Transaction.date <= end_date)
    txns = q.all()

    spending = [t for t in txns if t.amount < 0]
    income = [t for t in txns if t.amount >= 0]
    total_spent = abs(sum(t.amount for t in spending))
    total_income = sum(t.amount for t in income)

    by_category: dict[str, float] = {}
    for t in spending:
        cat = t.category or "Uncategorized"
        by_category[cat] = by_category.get(cat, 0) + abs(t.amount)

    return TransactionSummary(
        total_spent=total_spent,
        total_income=total_income,
        net=total_income - total_spent,
        by_category=by_category,
        transaction_count=len(txns),
    )


@router.get("/batches")
def get_import_batches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from sqlalchemy import func
    rows = (
        db.query(Transaction.import_batch, func.count(Transaction.id), func.min(Transaction.date), func.max(Transaction.date))
        .filter(Transaction.user_id == current_user.id, Transaction.import_batch.isnot(None))
        .group_by(Transaction.import_batch)
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
    deleted = delete_import_batch(db, current_user.id, "finance", batch_id)
    return {"deleted": deleted}


@router.delete("/all")
def delete_all_finance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deleted = db.query(Transaction).filter(Transaction.user_id == current_user.id).delete()
    db.commit()
    return {"deleted": deleted}
