"""
Admin-only endpoint to trigger background jobs manually.
In production this would be protected by an admin role or an internal network.
"""

from fastapi import APIRouter, Depends

from app.models.user import User
from app.services.background_jobs import (
    cleanup_deleted_sources,
    generate_all_insights,
    nightly_aggregation,
)
from app.services.deps import get_current_user

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.post("/nightly-aggregation")
def run_nightly_aggregation(_current_user: User = Depends(get_current_user)):
    return nightly_aggregation()


@router.post("/generate-insights")
def run_generate_insights(_current_user: User = Depends(get_current_user)):
    return generate_all_insights()


@router.post("/cleanup")
def run_cleanup(_current_user: User = Depends(get_current_user)):
    return cleanup_deleted_sources()
