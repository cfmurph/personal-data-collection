# Personal Data Hub

A full-stack web app that unifies fragmented personal data — finance, fitness, and habits — into a single system with meaningful cross-domain insights.

## Architecture

```
React (Vite + Tailwind)          FastAPI backend
  src/
    api/           ←→    /api/auth        JWT authentication
    pages/               /api/finance     CSV import + transactions
    components/          /api/fitness     CSV import + activities
    context/             /api/habits      Daily check-ins
                         /api/insights    Rule-based insights engine
                         /api/dashboard   Aggregated summary
                         /api/data-sources  Data management
                         /api/jobs        Background job triggers
                               ↓
                         SQLite (SQLAlchemy ORM)
                         Background jobs (nightly aggregation, insights)
```

## Features

- **CSV Import** — financial transactions and fitness activities with normalization, deduplication, and auto-categorization
- **Dashboard** — daily snapshot with spending charts and recent workouts
- **Finance** — spending by category (pie chart), transaction log, income/expense summary
- **Fitness** — activity frequency, calorie tracking, activity breakdown
- **Habits** — daily mood/energy/focus check-in with trend charts
- **Insights** — rule-based engine detecting cross-domain patterns (e.g. "You spend 40% more on inactive days")
- **Data Management** — view import history, delete individual batches or all data

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## CSV Formats

### Financial CSV
```
date,description,amount,category,account
2024-01-15,Starbucks Coffee,-5.40,Food & Dining,Checking
2024-01-16,Salary Deposit,3000.00,Income,Checking
```
- `date`: any parseable date format
- `amount`: negative = expense, positive = income; supports `$`, `(`, `)`, `CR`, `DB`
- `category`: optional; auto-assigned from description keywords if omitted

### Fitness CSV
```
date,activity_type,duration_minutes,distance_km,calories,heart_rate_avg,steps
2024-01-15,run,30,5.0,280,155,4200
2024-01-16,strength,45,,320,140,
```
- `date` and `activity_type` are required
- Activity types are normalized (e.g. `run` → `Running`, `strength` → `Strength Training`)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4 |
| Charts | Recharts |
| API | FastAPI, Python 3.12 |
| ORM | SQLAlchemy 2.0 |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Data processing | pandas |
| Database | SQLite (dev) / PostgreSQL (prod) |
