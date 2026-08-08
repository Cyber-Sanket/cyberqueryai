import time
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from app.database.session import get_db
from app.database.models import SecurityEventModel, AlertModel, AuditLogModel

router = APIRouter(prefix="/api/security-events", tags=["Security Telemetry Ingestion"])

SECURITY_API_KEY = "hexnova-sec-key-2026"

class SecurityEventPayload(BaseModel):
    timestamp: Optional[str] = None
    source: Optional[str] = "hexnova"
    event_type: str = Field(..., example="authentication")
    action: str = Field(..., example="login")
    status: str = Field(..., example="failed")
    username: Optional[str] = "admin"
    source_ip: Optional[str] = "192.168.56.101"
    destination_ip: Optional[str] = "10.0.0.5"
    hostname: Optional[str] = "hexnova-app"
    process: Optional[str] = None
    command_line: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

@router.post("")
def ingest_security_event(
    payload: SecurityEventPayload,
    db: Session = Depends(get_db),
    x_api_key: Optional[str] = Header(None)
):
    """
    Ingests normalized security events from HexNova / Authorized Security Sources.
    Validates API key & normalizes event schema before storing into security log database.
    """
    if x_api_key and x_api_key != SECURITY_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid Security Telemetry API Key")

    timestamp = payload.timestamp or datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    # Leave id as None so SQLite handles integer autoincrement cleanly
    db_event = SecurityEventModel(
        timestamp=timestamp,
        username=payload.username,
        source_ip=payload.source_ip,
        destination_ip=payload.destination_ip,
        source_port=54321,
        destination_port=443,
        event_type=payload.event_type,
        action=payload.action,
        status=payload.status,
        hostname=payload.hostname or "hexnova-app",
        process=payload.process,
        command_line=payload.command_line,
        domain=payload.metadata.get("domain") if payload.metadata else None,
        location_city="New York",
        location_country="United States"
    )
    db.add(db_event)
    db.flush() # Flush to get auto-generated integer id

    # Automatic Security Detection Rule:
    # If 5+ failed login events from same IP, trigger an alert in AlertModel!
    if payload.event_type == "authentication" and payload.status == "failed":
        failed_count = db.query(SecurityEventModel).filter(
            SecurityEventModel.source_ip == payload.source_ip,
            SecurityEventModel.status == "failed"
        ).count()

        if failed_count >= 5:
            alert_id = f"alt-{uuid.uuid4().hex[:8]}"
            alert = AlertModel(
                id=alert_id,
                title=f"HexNova Brute Force Attempt ({failed_count} Failed Logins)",
                severity="HIGH",
                mitre_technique="T1110",
                target_user=payload.username,
                source_ip=payload.source_ip,
                description=f"Multiple failed authentication attempts detected on HexNova target application for user '{payload.username}' from IP {payload.source_ip}."
            )
            db.add(alert)

    db.commit()

    return {
        "status": "INGESTED",
        "event_id": str(db_event.id),
        "source": payload.source,
        "event_type": payload.event_type,
        "status_code": 201
    }

@router.post("/demo-attack")
def trigger_demo_attack_telemetry(db: Session = Depends(get_db)):
    """
    Convenience endpoint for Hackathon Demo:
    Simulates 5 controlled failed logins for 'demo_admin' followed by 1 successful login from IP 192.168.56.101.
    """
    timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    source_ip = "192.168.56.101"
    target_user = "demo_admin"

    # Ingest 5 Failed Logins
    events_created = []
    for i in range(5):
        evt = SecurityEventModel(
            timestamp=timestamp,
            username=target_user,
            source_ip=source_ip,
            destination_ip="10.0.0.5",
            source_port=40000 + i,
            destination_port=443,
            event_type="authentication",
            action="login",
            status="failed",
            hostname="hexnova-app",
            process=None,
            command_line=None,
            location_city="New York",
            location_country="United States"
        )
        db.add(evt)

    # Ingest 1 Successful Login
    succ_evt = SecurityEventModel(
        timestamp=timestamp,
        username=target_user,
        source_ip=source_ip,
        destination_ip="10.0.0.5",
        source_port=45000,
        destination_port=443,
        event_type="authentication",
        action="login",
        status="success",
        hostname="hexnova-app",
        process=None,
        command_line=None,
        location_city="New York",
        location_country="United States"
    )
    db.add(succ_evt)
    db.flush()

    # Trigger Incident Alert
    alert_id = f"alt-hexnova-bruteforce-{uuid.uuid4().hex[:6]}"
    alert = AlertModel(
        id=alert_id,
        title=f"HexNova Brute Force Alert (demo_admin)",
        severity="HIGH",
        mitre_technique="T1110",
        target_user=target_user,
        source_ip=source_ip,
        description=f"5 failed logins followed by successful authentication for user 'demo_admin' from IP {source_ip} on hexnova.space."
    )
    db.add(alert)
    db.commit()

    return {
        "status": "TELEMETRY_GENERATED",
        "message": "Generated 5 failed + 1 successful authentication events for demo_admin on hexnova.space",
        "events_count": 6,
        "target_user": target_user,
        "source_ip": source_ip,
        "mitre_technique": "T1110"
    }

@router.get("/latest")
def get_latest_events(limit: int = 15, db: Session = Depends(get_db)):
    events = db.query(SecurityEventModel).order_by(SecurityEventModel.id.desc()).limit(limit).all()
    return [
        {
            "id": str(e.id),
            "timestamp": e.timestamp,
            "username": e.username,
            "source_ip": e.source_ip,
            "event_type": e.event_type,
            "action": e.action,
            "status": e.status,
            "hostname": e.hostname
        }
        for e in events
    ]
