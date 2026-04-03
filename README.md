# Personal Data Hub

A full-stack application (web + mobile) that unifies fragmented personal data — finance, fitness, and habits — into a single system with cross-domain insights.

## Monorepo Structure

```
/
├── apps/
│   ├── backend/          FastAPI + SQLAlchemy (Python)
│   ├── web/              React + Vite + Tailwind CSS
│   └── mobile/           React Native + Expo
├── packages/
│   └── api-client/       Shared TypeScript types + API definitions
├── turbo.json            Turborepo build config
└── package.json          npm workspaces root
```

## Quick Start

### Backend + Web

```bash
./start.sh
# Web:     http://localhost:5173
# Backend: http://localhost:8000
# Docs:    http://localhost:8000/docs
```

### Mobile (Expo)

```bash
cd apps/mobile
npx expo start
# Scan QR code with Expo Go (iOS/Android)
# Press 'w' for web preview
```

## Apps

### Backend (`apps/backend`)
- FastAPI REST API
- JWT authentication (register / login / me)
- Finance CSV import with normalization, deduplication, auto-categorization
- Fitness CSV import with activity type normalization
- Daily habit check-ins (mood, energy, focus 1–5)
- Rule-based insights engine with cross-domain patterns
- Dashboard summary aggregation
- DataSource registry + background jobs (nightly aggregation, insight generation, cleanup)

### Web (`apps/web`)
- Dashboard with stat cards and charts
- Finance: CSV upload, spending pie chart, transaction table
- Fitness: CSV upload, activity frequency, activity log
- Habits: emoji check-in, 30-day trend chart, history
- Insights: grouped by category with severity badges
- Data Management: import history, batch deletion

### Mobile (`apps/mobile`)
- All web screens adapted for native mobile
- `expo-router` file-based navigation with bottom tabs
- `expo-secure-store` for secure token storage
- `expo-document-picker` for CSV file import from device
- Same API client + business logic as the web app

## Shared Package (`packages/api-client`)

All TypeScript types and API function signatures live in `packages/api-client`.
Both web and mobile import from this package to stay in sync automatically.

## CSV Formats

### Financial CSV
```
date, description, amount[, category, account]
2024-01-15, Starbucks, -5.40, Food & Dining, Checking
```
- Amount supports: `$5.40`, `(5.40)`, `5.40 CR`
- Category auto-assigned from description keywords if omitted

### Fitness CSV
```
date, activity_type[, duration_minutes, distance_km, calories, heart_rate_avg, steps]
2024-01-15, run, 30, 5.0, 280, 155, 4200
```
- Activity types normalized: `run`→`Running`, `strength`→`Strength Training`, etc.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | FastAPI, Python 3.12, SQLAlchemy 2.0 |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Data processing | pandas |
| Database | SQLite (dev) → PostgreSQL (prod) |
| Web frontend | React 19, Vite, TypeScript, Tailwind CSS v4 |
| Mobile | React Native, Expo SDK 54, expo-router |
| Charts (web) | Recharts |
| Monorepo | Turborepo + npm workspaces |
| Shared types | `@personal-data-hub/api-client` |

## Scaling to 200k Users

- Swap SQLite for PostgreSQL (change `DATABASE_URL` env var)
- Add PgBouncer for connection pooling
- Replace `background_jobs.py` stubs with Celery + Redis
- Move CSV uploads to S3 (presigned URL → background processing)
- Horizontal scaling: FastAPI is stateless, scale API instances behind a load balancer
