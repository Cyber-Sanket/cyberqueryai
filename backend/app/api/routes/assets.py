import time
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.database.session import get_db
from app.database.models import SecurityEventModel, AlertModel, MonitoredAssetModel

router = APIRouter(prefix="/api/assets", tags=["Monitored Assets"])

def get_or_seed_login_portal_asset(db: Session) -> MonitoredAssetModel:
    asset = db.query(MonitoredAssetModel).filter(MonitoredAssetModel.id == "login-portal").first()
    if not asset:
        asset = MonitoredAssetModel(
            id="login-portal",
            name="Login Portal",
            domain="login-portal",
            type="web_application",
            status="monitoring",
            environment="Authentication Application Monitored by CyberQuery AI",
            created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ")
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)
    return asset

@router.get("")
def get_monitored_assets(db: Session = Depends(get_db)):
    """
    GET /api/assets
    Returns list of monitored assets (Login Portal) directly from SQLite DB.
    """
    get_or_seed_login_portal_asset(db)
    db_assets = db.query(MonitoredAssetModel).all()

    total_events = db.query(SecurityEventModel).count()
    total_alerts = db.query(AlertModel).count()
    high_alerts = db.query(AlertModel).filter(AlertModel.severity.in_(["HIGH", "CRITICAL"])).count()

    risk_level = "High" if high_alerts > 2 else ("Medium" if total_alerts > 0 else "Low")

    assets = []
    for a in db_assets:
        assets.append({
            "asset_id": a.id,
            "id": a.id,
            "name": a.name,
            "domain": a.domain,
            "type": a.type,
            "status": a.status,
            "environment": a.environment,
            "total_events": total_events,
            "total_alerts": total_alerts,
            "risk_level": risk_level,
            "last_active": time.strftime("%Y-%m-%dT%H:%M:%SZ")
        })

    return assets

@router.get("/{asset_id}")
def get_asset_by_id(asset_id: str, db: Session = Depends(get_db)):
    """
    GET /api/assets/{asset_id}
    Returns detailed security activity & stats for Login Portal from SQLite DB.
    """
    asset = db.query(MonitoredAssetModel).filter(MonitoredAssetModel.id == asset_id).first()
    if not asset:
        asset = get_or_seed_login_portal_asset(db)

    total_events = db.query(SecurityEventModel).count()
    auth_events = db.query(SecurityEventModel).filter(SecurityEventModel.event_type == "authentication").count()
    failed_events = db.query(SecurityEventModel).filter(SecurityEventModel.status == "failed").count()
    total_alerts = db.query(AlertModel).count()

    return {
        "asset_id": asset.id,
        "id": asset.id,
        "name": asset.name,
        "domain": asset.domain,
        "type": asset.type,
        "status": asset.status,
        "environment": asset.environment,
        "stats": {
            "total_events": total_events,
            "authentication_events": auth_events,
            "suspicious_events": failed_events,
            "active_alerts": total_alerts
        }
    }

@router.get("/{asset_id}/events")
def get_asset_events(asset_id: str, limit: int = 15, db: Session = Depends(get_db)):
    """
    GET /api/assets/{asset_id}/events
    Returns recent security events for Login Portal from SQLite DB.
    """
    events = db.query(SecurityEventModel).order_by(SecurityEventModel.id.desc()).limit(limit).all()
    return [
        {
            "id": str(e.id),
            "asset": e.source or "login-portal",
            "timestamp": e.timestamp,
            "event_type": e.event_type,
            "action": e.action,
            "status": e.status,
            "username": e.username,
            "source_ip": e.source_ip,
            "destination_ip": e.destination_ip,
            "hostname": e.hostname or "login-portal"
        }
        for e in events
    ]

@router.get("/{asset_id}/alerts")
def get_asset_alerts(asset_id: str, db: Session = Depends(get_db)):
    """
    GET /api/assets/{asset_id}/alerts
    Returns active alerts associated with Login Portal from SQLite DB.
    """
    alerts = db.query(AlertModel).order_by(AlertModel.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "severity": a.severity,
            "mitre_technique": a.mitre_technique,
            "asset": "Login Portal",
            "target_user": a.target_user or "demo_admin",
            "source_ip": a.source_ip or "127.0.0.1",
            "status": a.status,
            "created_at": a.created_at,
            "description": a.description
        }
        for a in alerts
    ]
