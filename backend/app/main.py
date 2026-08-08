import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.session import engine, Base
from app.api.routes.investigations import router as investigations_router
from app.api.routes.governance import router as governance_router
from app.api.routes.security_events import router as security_events_router
from app.api.routes.assets import router as assets_router

# Initialize Database Schema
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CyberQuery AI Engine & HexNova Integration",
    description="SOC AI Investigation Platform & Monitored Asset Telemetry API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        "monitored_asset": "hexnova.space",
        "validator_mode": "Two-Gate Governance & Query Safety Gate Active"
    }
