from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.insight import InsightOut
from app.services.deps import get_current_user
from app.services.insights import generate_insights

router = APIRouter(prefix="/api/insights", tags=["insights"])


@router.get("/", response_model=list[InsightOut])
def get_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return generate_insights(db, current_user.id)
