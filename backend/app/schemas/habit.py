from datetime import date, datetime

from pydantic import BaseModel, Field


class HabitEntryCreate(BaseModel):
    date: date
    mood: int | None = Field(default=None, ge=1, le=5)
    energy: int | None = Field(default=None, ge=1, le=5)
    focus: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = None


class HabitEntryUpdate(BaseModel):
    mood: int | None = Field(default=None, ge=1, le=5)
    energy: int | None = Field(default=None, ge=1, le=5)
    focus: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = None


class HabitEntryOut(BaseModel):
    id: int
    date: date
    mood: int | None
    energy: int | None
    focus: int | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
