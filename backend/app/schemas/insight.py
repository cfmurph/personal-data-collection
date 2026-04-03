from pydantic import BaseModel


class InsightOut(BaseModel):
    id: str
    category: str
    title: str
    description: str
    severity: str  # "info" | "warning" | "positive"
    data: dict | None = None
