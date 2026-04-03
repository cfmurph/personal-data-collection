from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String

from app.database import Base


class FitnessActivity(Base):
    __tablename__ = "fitness_activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    activity_type = Column(String, nullable=False)
    duration_minutes = Column(Float, nullable=True)
    distance_km = Column(Float, nullable=True)
    calories = Column(Float, nullable=True)
    heart_rate_avg = Column(Float, nullable=True)
    steps = Column(Integer, nullable=True)
    import_batch = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
