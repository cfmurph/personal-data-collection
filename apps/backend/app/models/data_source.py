from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String

from app.database import Base


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    source_type = Column(String, nullable=False)   # "finance_csv" | "fitness_csv" | "manual_habit"
    label = Column(String, nullable=True)
    batch_id = Column(String, nullable=True, index=True)
    record_count = Column(Integer, default=0)
    status = Column(String, default="active")       # "active" | "deleted"
    meta = Column(JSON, nullable=True)              # arbitrary extra info (filename, date range…)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
