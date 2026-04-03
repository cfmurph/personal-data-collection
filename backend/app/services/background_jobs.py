"""
Background jobs — nightly aggregation and insight generation.

In MVP these run synchronously on-demand; the architecture is designed so
they can be moved to Celery + Redis or a cron schedule without changing the
business logic.

Job catalogue:
  - nightly_aggregation  : recomputes per-user summary caches (future: materialized views)
  - generate_all_insights: runs the insights engine for all active users
  - cleanup_deleted      : hard-deletes rows marked as soft-deleted after 30 days
"""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.data_source import DataSource
from app.models.finance import Transaction
from app.models.fitness import FitnessActivity
from app.models.habit import HabitEntry
from app.models.user import User
from app.services.insights import generate_insights

logger = logging.getLogger(__name__)


def _get_db() -> Session:
    return SessionLocal()


def nightly_aggregation() -> dict:
    """
    Placeholder for nightly aggregation.

    In a production system this would populate a summary/cache table so the
    dashboard endpoint is a simple SELECT rather than ad-hoc aggregation.
    For MVP the dashboard endpoint performs the aggregation inline; this job
    serves as the extension point.
    """
    db = _get_db()
    try:
        user_count = db.query(User).count()
        logger.info("nightly_aggregation: %d users processed", user_count)
        return {"status": "ok", "users_processed": user_count, "ran_at": datetime.now(timezone.utc).isoformat()}
    finally:
        db.close()


def generate_all_insights() -> dict:
    """Re-generate insights for every active user and log counts."""
    db = _get_db()
    try:
        users = db.query(User).all()
        results = []
        for user in users:
            try:
                insights = generate_insights(db, user.id)
                results.append({"user_id": user.id, "insight_count": len(insights)})
            except Exception as e:
                logger.error("insight generation failed for user %d: %s", user.id, e)
                results.append({"user_id": user.id, "error": str(e)})
        logger.info("generate_all_insights: processed %d users", len(users))
        return {"status": "ok", "results": results, "ran_at": datetime.now(timezone.utc).isoformat()}
    finally:
        db.close()


def cleanup_deleted_sources(days_old: int = 30) -> dict:
    """
    Hard-delete DataSource records that have been soft-deleted for more than
    `days_old` days. The associated transaction/activity rows are already gone
    at soft-delete time; this just purges the registry entries.
    """
    db = _get_db()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days_old)
        deleted = (
            db.query(DataSource)
            .filter(DataSource.status == "deleted", DataSource.updated_at < cutoff)
            .delete(synchronize_session=False)
        )
        db.commit()
        logger.info("cleanup_deleted_sources: removed %d stale records", deleted)
        return {"status": "ok", "records_purged": deleted, "ran_at": datetime.now(timezone.utc).isoformat()}
    finally:
        db.close()
