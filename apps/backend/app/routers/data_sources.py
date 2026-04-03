from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.data_source import DataSource
from app.models.user import User
from app.services.deps import get_current_user

router = APIRouter(prefix="/api/data-sources", tags=["data-sources"])


@router.get("/")
def list_data_sources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sources = (
        db.query(DataSource)
        .filter(DataSource.user_id == current_user.id, DataSource.status == "active")
        .order_by(DataSource.created_at.desc())
        .all()
    )
    return [
        {
            "id": s.id,
            "source_type": s.source_type,
            "label": s.label,
            "batch_id": s.batch_id,
            "record_count": s.record_count,
            "status": s.status,
            "meta": s.meta,
            "created_at": s.created_at.isoformat(),
        }
        for s in sources
    ]


@router.delete("/{source_id}")
def delete_data_source(
    source_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.import_service import delete_import_batch

    source = (
        db.query(DataSource)
        .filter(DataSource.id == source_id, DataSource.user_id == current_user.id)
        .first()
    )
    if not source:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Data source not found")

    deleted_count = 0
    if source.source_type == "finance_csv" and source.batch_id:
        deleted_count = delete_import_batch(db, current_user.id, "finance", source.batch_id)
    elif source.source_type == "fitness_csv" and source.batch_id:
        deleted_count = delete_import_batch(db, current_user.id, "fitness", source.batch_id)
    else:
        source.status = "deleted"
        db.commit()

    return {"deleted_records": deleted_count, "source_id": source_id}
