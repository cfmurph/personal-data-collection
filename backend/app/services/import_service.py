"""
Ingestion + normalization pipeline.

Steps:
  1. Parse CSV
  2. Validate required columns
  3. Normalize each row (dates, amounts, categories, activity types)
  4. Deduplicate against existing records
  5. Bulk-insert valid rows
  6. Register a DataSource entry
"""

import hashlib
import uuid
from datetime import date
from io import StringIO

import pandas as pd
from sqlalchemy.orm import Session

from app.models.data_source import DataSource
from app.models.finance import Transaction
from app.models.fitness import FitnessActivity
from app.services.normalization import (
    normalize_activity_type,
    normalize_amount,
    normalize_category,
    normalize_date,
)

FINANCE_REQUIRED_COLS = {"date", "description", "amount"}
FITNESS_REQUIRED_COLS = {"date", "activity_type"}


def _row_fingerprint(*parts) -> str:
    """Stable hash used for deduplication."""
    combined = "|".join(str(p) for p in parts)
    return hashlib.sha256(combined.encode()).hexdigest()[:16]


def import_financial_csv(
    db: Session, user_id: int, content: bytes, filename: str = "upload.csv"
) -> dict:
    try:
        df = pd.read_csv(StringIO(content.decode("utf-8")))
    except Exception as e:
        raise ValueError(f"Could not parse CSV: {e}")

    df.columns = [c.strip().lower() for c in df.columns]
    missing = FINANCE_REQUIRED_COLS - set(df.columns)
    if missing:
        raise ValueError(
            f"CSV missing required columns: {sorted(missing)}. "
            f"Required: {sorted(FINANCE_REQUIRED_COLS)}"
        )

    # Load existing fingerprints for this user to enable deduplication
    existing_fps = {
        r[0]
        for r in db.query(Transaction.import_batch)
        .filter(Transaction.user_id == user_id)
        .with_entities(Transaction.import_batch)
        .all()
        # NOTE: fingerprint is stored in import_batch only for dedupe-per-batch;
        # real dedup uses in-process set below
    }
    # Load actual fingerprints (stored as notes with prefix "fp:")
    existing_fingerprints: set[str] = set()
    for (notes,) in (
        db.query(Transaction.notes)
        .filter(Transaction.user_id == user_id, Transaction.notes.like("fp:%"))
        .all()
    ):
        existing_fingerprints.add(notes[3:])

    batch_id = str(uuid.uuid4())[:8]
    records = []
    errors = []
    duplicates = 0
    seen_fps: set[str] = set()

    for idx, row in df.iterrows():
        parsed_date = normalize_date(row["date"])
        if parsed_date is None:
            errors.append(f"Row {idx + 2}: invalid date '{row['date']}'")
            continue

        amount = normalize_amount(row["amount"])
        if amount is None:
            errors.append(f"Row {idx + 2}: invalid amount '{row['amount']}'")
            continue

        description = str(row.get("description", "")).strip()
        raw_category = str(row.get("category", "")).strip()
        category = normalize_category(raw_category if raw_category.lower() not in ("nan", "") else None, description)
        account = str(row.get("account", "")).strip() or None

        fp = _row_fingerprint(user_id, parsed_date, description, amount)
        if fp in existing_fingerprints or fp in seen_fps:
            duplicates += 1
            continue
        seen_fps.add(fp)

        records.append(
            Transaction(
                user_id=user_id,
                date=parsed_date,
                description=description,
                amount=amount,
                category=category,
                account=account if account and account.lower() not in ("nan",) else None,
                notes=f"fp:{fp}",
                import_batch=batch_id,
            )
        )

    if not records and errors:
        raise ValueError(f"No valid rows found. Errors: {'; '.join(errors[:5])}")

    db.bulk_save_objects(records)

    # Register DataSource
    dates = [r.date for r in records]
    ds = DataSource(
        user_id=user_id,
        source_type="finance_csv",
        label=filename,
        batch_id=batch_id,
        record_count=len(records),
        status="active",
        meta={
            "filename": filename,
            "start_date": str(min(dates)) if dates else None,
            "end_date": str(max(dates)) if dates else None,
            "duplicates_skipped": duplicates,
        },
    )
    db.add(ds)
    db.commit()

    return {
        "imported": len(records),
        "duplicates_skipped": duplicates,
        "errors": len(errors),
        "batch_id": batch_id,
        "error_details": errors[:10],
    }


def import_fitness_csv(
    db: Session, user_id: int, content: bytes, filename: str = "upload.csv"
) -> dict:
    try:
        df = pd.read_csv(StringIO(content.decode("utf-8")))
    except Exception as e:
        raise ValueError(f"Could not parse CSV: {e}")

    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    missing = FITNESS_REQUIRED_COLS - set(df.columns)
    if missing:
        raise ValueError(
            f"CSV missing required columns: {sorted(missing)}. "
            f"Required: {sorted(FITNESS_REQUIRED_COLS)}"
        )

    # Load existing fingerprints
    existing_fingerprints: set[str] = set()
    for (batch_id,) in (
        db.query(FitnessActivity.import_batch)
        .filter(FitnessActivity.user_id == user_id, FitnessActivity.import_batch.like("fp:%"))
        .all()
    ):
        existing_fingerprints.add(batch_id[3:])

    batch_id = str(uuid.uuid4())[:8]
    records = []
    errors = []
    duplicates = 0
    seen_fps: set[str] = set()

    for idx, row in df.iterrows():
        parsed_date = normalize_date(row["date"])
        if parsed_date is None:
            errors.append(f"Row {idx + 2}: invalid date '{row['date']}'")
            continue

        def safe_float(col: str) -> float | None:
            try:
                v = row.get(col)
                return float(v) if pd.notna(v) else None
            except (ValueError, TypeError):
                return None

        def safe_int(col: str) -> int | None:
            try:
                v = row.get(col)
                return int(float(v)) if pd.notna(v) else None
            except (ValueError, TypeError):
                return None

        activity_type = normalize_activity_type(str(row["activity_type"]))
        duration = safe_float("duration_minutes")

        fp = _row_fingerprint(user_id, parsed_date, activity_type, duration or "")
        if fp in existing_fingerprints or fp in seen_fps:
            duplicates += 1
            continue
        seen_fps.add(fp)

        records.append(
            FitnessActivity(
                user_id=user_id,
                date=parsed_date,
                activity_type=activity_type,
                duration_minutes=duration,
                distance_km=safe_float("distance_km"),
                calories=safe_float("calories"),
                heart_rate_avg=safe_float("heart_rate_avg"),
                steps=safe_int("steps"),
                import_batch=batch_id,
            )
        )

    if not records and errors:
        raise ValueError(f"No valid rows found. Errors: {'; '.join(errors[:5])}")

    db.bulk_save_objects(records)

    dates = [r.date for r in records]
    ds = DataSource(
        user_id=user_id,
        source_type="fitness_csv",
        label=filename,
        batch_id=batch_id,
        record_count=len(records),
        status="active",
        meta={
            "filename": filename,
            "start_date": str(min(dates)) if dates else None,
            "end_date": str(max(dates)) if dates else None,
            "duplicates_skipped": duplicates,
        },
    )
    db.add(ds)
    db.commit()

    return {
        "imported": len(records),
        "duplicates_skipped": duplicates,
        "errors": len(errors),
        "batch_id": batch_id,
        "error_details": errors[:10],
    }


def delete_import_batch(db: Session, user_id: int, data_type: str, batch_id: str) -> int:
    if data_type == "finance":
        deleted = (
            db.query(Transaction)
            .filter(Transaction.user_id == user_id, Transaction.import_batch == batch_id)
            .delete()
        )
    elif data_type == "fitness":
        deleted = (
            db.query(FitnessActivity)
            .filter(FitnessActivity.user_id == user_id, FitnessActivity.import_batch == batch_id)
            .delete()
        )
    else:
        deleted = 0

    # Mark DataSource as deleted
    db.query(DataSource).filter(
        DataSource.user_id == user_id,
        DataSource.batch_id == batch_id,
    ).update({"status": "deleted"})

    db.commit()
    return deleted
