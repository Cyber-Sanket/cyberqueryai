import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.session import engine, Base, SessionLocal
from app.database.models import SecurityEventModel
from app.api.routes.investigations import router as investigations_router
from app.api.routes.governance import router as governance_router
from app.api.routes.security_events import router as security_events_router, seed_demo_telemetry
from app.api.routes.assets import router as assets_router

# Initialize Database Schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CyberQuery AI Engine & Login Portal Integration",
    description="SOC AI Investigation Platform & Login Portal Security Telemetry API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_db_init():
    """Ensure DB schema exists and initial demo security telemetry is seeded if empty."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(SecurityEventModel).count() == 0:
            seed_demo_telemetry(db)
    except Exception as e:
        print(f"Startup DB init check: {e}")
    finally:
        db.close()

app.include_router(investigations_router)
app.include_router(governance_router)
app.include_router(security_events_router)
app.include_router(assets_router)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "app": "CyberQuery AI SOC Engine",
        "siem_status": "CONNECTED",
        "monitored_asset": "login-portal",
        "validator_mode": "Two-Gate Governance & Query Safety Gate Active"
    }
