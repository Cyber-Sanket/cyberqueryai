import time
import uuid
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from app.database.session import get_db
from app.database.models import SecurityEventModel, AlertModel, IncidentModel
from app.services.detection.threat_engine import evaluate_event_rules

router = APIRouter(prefix="/api", tags=["Security Events & Ingestion"])

class SecurityEventCreate(BaseModel):
    timestamp: Optional[str] = None
    source: Optional[str] = "hexnova.space"
    event_type: str = Field(..., example="authentication")
    action: str = Field(..., example="login")
    status: str = Field(..., example="failed")
    username: Optional[str] = "demo_admin"
    source_ip: Optional[str] = "192.168.56.101"
    destination_ip: Optional[str] = "10.0.0.5"
    hostname: Optional[str] = "hexnova-app"
    endpoint: Optional[str] = "/api/v1/auth"
    user_agent: Optional[str] = "Mozilla/5.0"
    severity: Optional[str] = "LOW"
    raw_data: Optional[Dict[str, Any]] = None

class CloudflareEventCreate(BaseModel):
    timestamp: Optional[str] = None
    client_ip: str
    action: str # block, allow, challenge
    host: Optional[str] = "hexnova.space"
    uri: Optional[str] = "/login"
    user_agent: Optional[str] = "curl/7.68.0"
    rule_id: Optional[str] = "cf-waf-1002"

@router.post("/security-events")
def ingest_security_event(
    event_in: SecurityEventCreate,
    db: Session = Depends(get_db),
    x_api_key: Optional[str] = Header(None)
):
    """
    POST /api/security-events
    Ingests live telemetry from hexnova.space or agent sources.
    1. Validates incoming event
    2. Stores event in SQLite database
    3. Runs real detection rules engine
    4. Creates Alert/Incident if rule matches
    5. Returns created event and detection result!
    """
    now_str = event_in.timestamp or time.strftime("%Y-%m-%dT%H:%M:%SZ")

    db_event = SecurityEventModel(
        timestamp=now_str,
        source=event_in.source or "hexnova.space",
        event_type=event_in.event_type,
        action=event_in.action,
        status=event_in.status,
        username=event_in.username,
        source_ip=event_in.source_ip,
        destination_ip=event_in.destination_ip,
        hostname=event_in.hostname,
        endpoint=event_in.endpoint,
        user_agent=event_in.user_agent,
        severity=event_in.severity or "LOW",
        raw_data=event_in.raw_data or {}
    )

    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    # Execute Real Detection Rules Engine
    triggered_alert = evaluate_event_rules(db_event, db)

    return {
        "status": "INGESTED",
        "event_id": db_event.id,
        "timestamp": db_event.timestamp,
        "source": db_event.source,
        "alert_triggered": True if triggered_alert else False,
        "alert_details": {
            "id": triggered_alert.id,
            "title": triggered_alert.title,
            "severity": triggered_alert.severity,
            "technique": triggered_alert.mitre_technique
        } if triggered_alert else None
    }

@router.get("/security-events")
def get_security_events(
    source: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    source_ip: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    GET /api/security-events
    Returns real events directly from SQLite database with optional filters.
    """
    query = db.query(SecurityEventModel)
    if source:
        query = query.filter(SecurityEventModel.source == source)
    if event_type:
        query = query.filter(SecurityEventModel.event_type == event_type)
    if source_ip:
        query = query.filter(SecurityEventModel.source_ip == source_ip)
    if severity:
        query = query.filter(SecurityEventModel.severity == severity)

    events = query.order_by(SecurityEventModel.id.desc()).limit(limit).all()

    return [
        {
            "id": e.id,
            "timestamp": e.timestamp,
            "source": e.source,
            "event_type": e.event_type,
            "action": e.action,
            "status": e.status,
            "username": e.username,
            "source_ip": e.source_ip,
            "destination_ip": e.destination_ip,
            "hostname": e.hostname,
            "endpoint": e.endpoint,
            "severity": e.severity
        }
        for e in events
    ]

@router.post("/cloudflare/events")
def ingest_cloudflare_event(
    cf_event: CloudflareEventCreate,
    db: Session = Depends(get_db)
):
    """
    POST /api/cloudflare/events
    Accepts normalized Cloudflare WAF/security telemetry, stores in SQLite, and runs detection engine.
    """
    now_str = cf_event.timestamp or time.strftime("%Y-%m-%dT%H:%M:%SZ")
    status_val = "failed" if cf_event.action in ["block", "challenge"] else "success"

    db_event = SecurityEventModel(
        timestamp=now_str,
        source="cloudflare",
        event_type="http_request",
        action=cf_event.action,
        status=status_val,
        username="web_client",
        source_ip=cf_event.client_ip,
        destination_ip="104.21.12.80",
        hostname=cf_event.host,
        endpoint=cf_event.uri,
        user_agent=cf_event.user_agent,
        severity="MEDIUM" if status_val == "failed" else "LOW",
        raw_data={"rule_id": cf_event.rule_id, "action": cf_event.action}
    )

    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    triggered_alert = evaluate_event_rules(db_event, db)

    return {
        "status": "INGESTED",
        "provider": "Cloudflare WAF",
        "event_id": db_event.id,
        "alert_triggered": True if triggered_alert else False,
        "alert_details": {
            "id": triggered_alert.id,
            "title": triggered_alert.title,
            "severity": triggered_alert.severity
        } if triggered_alert else None
    }

@router.post("/security-events/demo-attack")
def trigger_demo_attack(db: Session = Depends(get_db)):
    """
    Hackathon Demo Trigger: Automatically generates 5 failed logins + 1 successful login for demo_admin from 192.168.56.101.
    """
    now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ")
    target_ip = "192.168.56.101"
    target_user = "demo_admin"

    # Insert 5 failed logins
    for i in range(5):
        event = SecurityEventModel(
            timestamp=now_str,
            source="hexnova.space",
            event_type="authentication",
            action="login",
            status="failed",
            username=target_user,
            source_ip=target_ip,
            destination_ip="10.0.0.5",
            hostname="hexnova-app",
            endpoint="/api/v1/auth/login",
            severity="HIGH"
        )
        db.add(event)
        db.commit()

    # Insert 1 successful login
    succ_event = SecurityEventModel(
        timestamp=now_str,
        source="hexnova.space",
        event_type="authentication",
        action="login",
        status="success",
        username=target_user,
        source_ip=target_ip,
        destination_ip="10.0.0.5",
        hostname="hexnova-app",
        endpoint="/api/v1/auth/login",
        severity="LOW"
    )
    db.add(succ_event)
    db.commit()

    # Run detection
    triggered_alert = evaluate_event_rules(succ_event, db)

    return {
        "status": "DEMO_ATTACK_GENERATED",
        "events_created": 6,
        "target_ip": target_ip,
        "target_user": target_user,
        "alert_triggered": True if triggered_alert else False
    }

@router.post("/demo/seed")
def seed_demo_telemetry(db: Session = Depends(get_db)):
    """
    POST /api/demo/seed
    Seeds controlled, realistic test telemetry into SQLite DB for instant hackathon demonstration.
    """
    now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ")

    sample_events = [
        # Brute force sample
        {"event_type": "authentication", "action": "login", "status": "failed", "username": "admin", "source_ip": "198.51.100.44", "severity": "HIGH"},
        {"event_type": "authentication", "action": "login", "status": "failed", "username": "admin", "source_ip": "198.51.100.44", "severity": "HIGH"},
        {"event_type": "authentication", "action": "login", "status": "failed", "username": "admin", "source_ip": "198.51.100.44", "severity": "HIGH"},
        {"event_type": "authentication", "action": "login", "status": "failed", "username": "admin", "source_ip": "198.51.100.44", "severity": "HIGH"},
        {"event_type": "authentication", "action": "login", "status": "failed", "username": "admin", "source_ip": "198.51.100.44", "severity": "HIGH"},
        
        # PowerShell sample
        {"event_type": "process_execution", "action": "powershell -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAA=", "status": "success", "username": "service_acct", "source_ip": "10.0.1.15", "endpoint": "powershell.exe", "severity": "HIGH"},
        
        # Port scan sample
        {"event_type": "network_connection", "action": "connect", "status": "failed", "username": "unknown", "source_ip": "203.0.113.88", "destination_ip": "10.0.0.12", "severity": "MEDIUM"},

        # DNS sample
        {"event_type": "dns_query", "action": "query", "status": "success", "username": "dev_user", "source_ip": "10.0.2.100", "endpoint": "malicious-c2.tunnel.com", "severity": "MEDIUM"},
    ]

    inserted_count = 0
    for e in sample_events:
        db_e = SecurityEventModel(
            timestamp=now_str,
            source="hexnova.space",
            event_type=e["event_type"],
            action=e["action"],
            status=e["status"],
            username=e["username"],
            source_ip=e["source_ip"],
            destination_ip=e.get("destination_ip", "10.0.0.5"),
            hostname="hexnova-prod",
            endpoint=e.get("endpoint", "/api/v1"),
            severity=e["severity"]
        )
        db.add(db_e)
        db.commit()
        evaluate_event_rules(db_e, db)
        inserted_count += 1

    return {
        "status": "SEEDED",
        "inserted_events": inserted_count,
        "timestamp": now_str
    }
