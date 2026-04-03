"""
Normalization layer — maps raw CSV columns into unified model fields.

Finance normalization:
  - date → ISO date
  - amount → float (handles various sign conventions)
  - category → title-cased, with keyword-based auto-categorization as fallback

Fitness normalization:
  - date → ISO date
  - activity_type → standardized label
  - numeric fields → float/int with safe coercion
"""

import re
from datetime import date

import pandas as pd


# ── Finance ──────────────────────────────────────────────────────────────────

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "Food & Dining": ["restaurant", "cafe", "coffee", "pizza", "burger", "sushi", "food", "eat", "lunch", "dinner", "breakfast", "mcdonald", "starbucks", "uber eats", "doordash", "grubhub"],
    "Transport": ["uber", "lyft", "taxi", "gas", "fuel", "parking", "transit", "subway", "train", "bus", "airline", "flight", "delta", "united", "southwest"],
    "Shopping": ["amazon", "walmart", "target", "costco", "ebay", "etsy", "store", "shop", "retail", "clothing", "apparel"],
    "Health & Fitness": ["gym", "fitness", "workout", "pharmacy", "cvs", "walgreens", "doctor", "dental", "medical", "hospital", "health"],
    "Entertainment": ["netflix", "spotify", "hulu", "disney", "movie", "theatre", "cinema", "game", "xbox", "playstation", "steam"],
    "Utilities": ["electric", "gas", "water", "internet", "cable", "phone", "utility", "verizon", "at&t", "comcast"],
    "Housing": ["rent", "mortgage", "hoa", "maintenance", "repair", "home depot", "lowes"],
    "Income": ["payroll", "salary", "direct deposit", "transfer in", "deposit", "income", "refund"],
}


def normalize_category(raw_category: str | None, description: str) -> str | None:
    if raw_category and raw_category.strip() and raw_category.lower() not in ("nan", "none", ""):
        return raw_category.strip().title()
    # keyword-based auto-categorization
    desc_lower = description.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in desc_lower for kw in keywords):
            return category
    return None


def normalize_amount(raw: str | float) -> float | None:
    """Handle amounts like '$1,234.56', '(50.00)', '-50.00', '50.00 CR'."""
    if pd.isna(raw):
        return None
    s = str(raw).strip()
    is_negative = False
    if s.startswith("(") and s.endswith(")"):
        is_negative = True
        s = s[1:-1]
    s = re.sub(r"[$,\s]", "", s)
    if s.upper().endswith("CR"):
        s = s[:-2]
        is_negative = False
    if s.upper().endswith("DB"):
        s = s[:-2]
        is_negative = True
    try:
        val = float(s)
        return -val if is_negative else val
    except ValueError:
        return None


# ── Fitness ───────────────────────────────────────────────────────────────────

ACTIVITY_TYPE_MAP: dict[str, str] = {
    "run": "Running",
    "running": "Running",
    "jog": "Running",
    "jogging": "Running",
    "walk": "Walking",
    "walking": "Walking",
    "hike": "Hiking",
    "hiking": "Hiking",
    "cycle": "Cycling",
    "cycling": "Cycling",
    "bike": "Cycling",
    "biking": "Cycling",
    "swim": "Swimming",
    "swimming": "Swimming",
    "strength": "Strength Training",
    "weights": "Strength Training",
    "weight training": "Strength Training",
    "gym": "Strength Training",
    "yoga": "Yoga",
    "pilates": "Pilates",
    "hiit": "HIIT",
    "crossfit": "HIIT",
    "row": "Rowing",
    "rowing": "Rowing",
    "elliptical": "Elliptical",
    "ski": "Skiing",
    "skiing": "Skiing",
    "basketball": "Basketball",
    "soccer": "Soccer",
    "tennis": "Tennis",
    "golf": "Golf",
}


def normalize_activity_type(raw: str) -> str:
    key = raw.strip().lower()
    return ACTIVITY_TYPE_MAP.get(key, raw.strip().title())


def normalize_date(raw) -> date | None:
    try:
        return pd.to_datetime(raw).date()
    except Exception:
        return None
