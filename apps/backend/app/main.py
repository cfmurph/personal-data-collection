from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
# Import all models so SQLAlchemy registers them before create_all
import app.models  # noqa: F401
from app.routers import auth, dashboard, data_sources, finance, fitness, goals, habits, insights, jobs

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Personal Data Hub API",
    description="Unified personal data (finance, fitness, habits) with insights",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(finance.router)
app.include_router(fitness.router)
app.include_router(habits.router)
app.include_router(insights.router)
app.include_router(dashboard.router)
app.include_router(data_sources.router)
app.include_router(goals.router)
app.include_router(jobs.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
