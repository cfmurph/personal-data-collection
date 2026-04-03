from datetime import date, datetime

from pydantic import BaseModel


class FitnessActivityOut(BaseModel):
    id: int
    date: date
    activity_type: str
    duration_minutes: float | None
    distance_km: float | None
    calories: float | None
    heart_rate_avg: float | None
    steps: int | None
    import_batch: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class FitnessSummary(BaseModel):
    total_workouts: int
    total_duration_minutes: float
    total_calories: float
    total_distance_km: float
    by_activity_type: dict[str, int]
