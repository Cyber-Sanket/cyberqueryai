import time
import uuid
from fastapi import APIRouter, Depends, HTTPException, Header, Query, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from app.database.session import get_db
from app.database.models import SecurityEventModel, AlertModel, IncidentModel, MonitoredAssetModel
from app.services.detection.threat_engine import evaluate_event_rules

router = APIRouter(prefix="/api", tags=["Security Events & Ingestion"])

class SecurityEventCreate(BaseModel):
    timestamp: Optional[str] = None
    source: Optional[str] = Field("login-portal", alias="asset")
    event_type: str = Field(..., example="authentication")
    action: str = Field(..., example="login")
    status: str = Field(..., example="failed")
    username: Optional[str] = "demo_admin"
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = "10.0.0.5"
    destination_port: Optional[int] = 443
    hostname: Optional[str] = "login-portal"
    endpoint: Optional[str] = "/api/v1/auth/login"
    domain: Optional[str] = None
    process: Optional[str] = None
    parent_process: Optional[str] = None
    command_line: Optional[str] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None
    user_agent: Optional[str] = "Mozilla/5.0"
    severity: Optional[str] = "LOW"
    raw_data: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True

class CloudflareEventCreate(BaseModel):
    timestamp: Optional[str] = None
    client_ip: str
    action: str # block, allow, challenge
    host: Optional[str] = "login-portal"
    uri: Optional[str] = "/login"
    user_agent: Optional[str] = "curl/7.68.0"
    rule_id: Optional[str] = "cf-waf-1002"

@router.post("/security-events")
def ingest_security_event(
    event_in: SecurityEventCreate,
    request: Request,
    db: Session = Depends(get_db),
    x_api_key: Optional[str] = Header(None)
):
    """
    POST /api/security-events
    Ingests live telemetry from Login Portal or agent sources.
    Stores in SQLite, runs real detection rules engine, creates alerts.
    """
    now_str = event_in.timestamp or time.strftime("%Y-%m-%dT%H:%M:%SZ")

    # Extract source IP from request headers or connection client IP
    client_ip = None
    if request:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        elif request.client and request.client.host:
            client_ip = request.client.host

    effective_ip = event_in.source_ip
    if not effective_ip or effective_ip in ["client", "unknown", "127.0.0.1", "localhost"]:
        effective_ip = client_ip or "127.0.0.1"

    asset_source = event_in.source or "login-portal"

    db_event = SecurityEventModel(
        timestamp=now_str,
        source=asset_source,
        event_type=event_in.event_type,
        action=event_in.action,
        status=event_in.status,
        username=event_in.username or "demo_admin",
        source_ip=effective_ip,
        destination_ip=event_in.destination_ip,
        destination_port=event_in.destination_port,
        hostname=event_in.hostname or "login-portal",
        endpoint=event_in.endpoint,
        domain=event_in.domain,
        process=event_in.process,
        parent_process=event_in.parent_process,
        command_line=event_in.command_line,
        location_city=event_in.location_city,
        location_country=event_in.location_country,
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
        "success": True,
        "event_id": db_event.id,
        "stored": True,
        "alert_created": True if triggered_alert else False,
        "alert_id": triggered_alert.id if triggered_alert else None,
        "status": "INGESTED",
        "timestamp": db_event.timestamp,
        "source": db_event.source,
        "alert_details": {
            "id": triggered_alert.id,
            "title": triggered_alert.title,
            "severity": triggered_alert.severity,
            "technique": triggered_alert.mitre_technique
        } if triggered_alert else None
    }

@router.get("/security-events")
def get_security_events(
    source: Optional[str] = Query(None, alias="asset"),
    event_type: Optional[str] = Query(None),
    source_ip: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """
    GET /api/security-events
    Returns real events directly from SQLite database with filters.
    """
    query = db.query(SecurityEventModel)
    if source and source != "all":
        query = query.filter(SecurityEventModel.source == source)
    if event_type:
        query = query.filter(SecurityEventModel.event_type == event_type)
    if source_ip:
        query = query.filter(SecurityEventModel.source_ip == source_ip)
    if severity:
        query = query.filter(SecurityEventModel.severity == severity)
    if status:
        query = query.filter(SecurityEventModel.status == status)

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
            "destination_port": e.destination_port,
            "hostname": e.hostname,
            "endpoint": e.endpoint,
            "domain": e.domain,
            "process": e.process,
            "parent_process": e.parent_process,
            "command_line": e.command_line,
            "location_city": e.location_city,
            "location_country": e.location_country,
            "severity": e.severity
        }
        for e in events
    ]

@router.post("/cloudflare/events")
def ingest_cloudflare_event(
    cf_event: CloudflareEventCreate,
    db: Session = Depends(get_db)
):
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
        destination_port=443,
        hostname=cf_event.host or "login-portal",
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
        "alert_triggered": True if triggered_alert else False
    }

@router.post("/security-events/demo-attack")
@router.post("/demo/seed")
def seed_demo_telemetry(db: Session = Depends(get_db)):
    """
    POST /api/demo/seed
    Inserts realistic security telemetry into SQLite DB for Login Portal:
    A. Brute Force (6 failed logins + 1 successful login for demo_admin from 192.168.1.10 on login-portal)
    B. Suspicious PowerShell (process_execution with -enc flag)
    C. Port Scanning (12 connections across distinct destination ports)
    D. Suspicious DNS (12 queries to exfil-data.tunnel.com)
    E. Impossible Travel (john_doe logging in from Tokyo then London 5m later)
    """
    now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ")

    # Seed Monitored Asset if missing
    asset = db.query(MonitoredAssetModel).filter(MonitoredAssetModel.id == "login-portal").first()
    if not asset:
        asset = MonitoredAssetModel(
            id="login-portal",
            name="Login Portal",
            domain="login-portal",
            type="web_application",
            status="monitoring",
            environment="Authentication Application Monitored by CyberQuery AI",
            created_at=now_str
        )
        db.add(asset)
        db.commit()

    seeded_events = []

    # Scenario A: Brute Force (6 failed logins + 1 successful login for demo_admin on login-portal)
    target_ip = "192.168.1.10"
    target_user = "demo_admin"

    for _ in range(6):
        seeded_events.append(SecurityEventModel(
            timestamp=now_str,
            source="login-portal",
            event_type="authentication",
            action="login",
            status="failed",
            username=target_user,
            source_ip=target_ip,
            destination_ip="10.0.0.5",
            destination_port=443,
            hostname="login-portal",
            endpoint="/api/v1/auth/login",
            severity="HIGH"
        ))

    seeded_events.append(SecurityEventModel(
        timestamp=now_str,
        source="login-portal",
        event_type="authentication",
        action="login",
        status="success",
        username=target_user,
        source_ip=target_ip,
        destination_ip="10.0.0.5",
        destination_port=443,
        hostname="login-portal",
        endpoint="/api/v1/auth/login",
        severity="LOW"
    ))

    # Scenario B: Suspicious PowerShell (T1059.001)
    seeded_events.append(SecurityEventModel(
        timestamp=now_str,
        source="login-portal",
        event_type="process_execution",
        action="execute",
        status="success",
        username="service_acct",
        source_ip="10.0.1.15",
        hostname="workstation-01",
        process="powershell.exe",
        parent_process="winword.exe",
        command_line="powershell -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAA=",
        severity="HIGH"
    ))

    # Scenario C: Port Scanning (T1046)
    scan_ip = "203.0.113.88"
    ports = [21, 22, 23, 80, 443, 8080, 3306, 5432, 8443, 27017, 6379, 9200]
    for port in ports:
        seeded_events.append(SecurityEventModel(
            timestamp=now_str,
            source="login-portal",
            event_type="network_connection",
            action="connect",
            status="failed",
            username="network",
            source_ip=scan_ip,
            destination_ip="10.0.0.12",
            destination_port=port,
            hostname="firewall-edge",
            severity="MEDIUM"
        ))

    # Scenario D: Suspicious DNS (T1071.004)
    for _ in range(12):
        seeded_events.append(SecurityEventModel(
            timestamp=now_str,
            source="login-portal",
            event_type="dns_query",
            action="query",
            status="success",
            username="dev_user",
            source_ip="10.0.2.100",
            hostname="dev-workstation",
            domain="exfil-data.tunnel.com",
            severity="MEDIUM"
        ))

    # Scenario E: Impossible Travel (T1078)
    seeded_events.append(SecurityEventModel(
        timestamp=now_str,
        source="login-portal",
        event_type="authentication",
        action="login",
        status="success",
        username="john_doe",
        source_ip="103.2.1.5",
        hostname="vpn-tokyo",
        location_city="Tokyo",
        location_country="Japan",
        severity="LOW"
    ))
    seeded_events.append(SecurityEventModel(
        timestamp=now_str,
        source="login-portal",
        event_type="authentication",
        action="login",
        status="success",
        username="john_doe",
        source_ip="81.2.3.4",
        hostname="vpn-london",
        location_city="London",
        location_country="UK",
        severity="HIGH"
    ))

    for ev in seeded_events:
        db.add(ev)
        db.commit()
        db.refresh(ev)
        evaluate_event_rules(ev, db)

    return {
        "status": "DEMO_DATA_SEEDED",
        "inserted_events": len(seeded_events),
        "target_asset": "login-portal",
        "timestamp": now_str
    }
