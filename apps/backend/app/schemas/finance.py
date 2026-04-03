from datetime import date, datetime

from pydantic import BaseModel


class TransactionOut(BaseModel):
    id: int
    date: date
    description: str
    amount: float
    category: str | None
    account: str | None
    notes: str | None
    import_batch: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TransactionSummary(BaseModel):
    total_spent: float
    total_income: float
    net: float
    by_category: dict[str, float]
    transaction_count: int
