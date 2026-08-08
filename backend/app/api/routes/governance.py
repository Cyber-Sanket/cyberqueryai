import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.database.session import get_db
from app.database.models import GovernancePolicyModel, GovernanceAuditModel, AuditLogModel

router = APIRouter(prefix="/api/governance", tags=["Governance & Controls"])

DEFAULT_ALLOWED_FIELDS = [
    "timestamp", "username", "source_ip", "destination_ip", "source_port", "destination_port",
    "event_type", "action", "status", "hostname", "process", "parent_process", "command_line", 
    "domain", "location_city", "location_country", "event_count", "failed_count", "port_count", "id", "*"
]

DEFAULT_ALLOWED_OPERATIONS = ["SELECT", "WHERE", "GROUP BY", "HAVING", "ORDER BY", "LIMIT"]

DEFAULT_SCENARIOS = {
    "brute_force": True,
    "powershell_abuse": True,
    "port_scan": True,
    "dns_tunneling": True,
    "impossible_travel": True
}

class GovernancePolicyPayload(BaseModel):
    max_time_range_hours: int = 168
    max_results: int = 1000
    require_time_range: bool = True
    read_only_execution: bool = True
    allowed_fields: List[str] = DEFAULT_ALLOWED_FIELDS
    allowed_operations: List[str] = DEFAULT_ALLOWED_OPERATIONS
    enabled_scenarios: Dict[str, bool] = DEFAULT_SCENARIOS
    audit_logging_enabled: bool = True

def get_or_create_policy(db: Session) -> GovernancePolicyModel:
    policy = db.query(GovernancePolicyModel).filter(GovernancePolicyModel.id == 1).first()
    if not policy:
        policy = GovernancePolicyModel(
            id=1,
            max_time_range_hours=168,
            max_results=1000,
            require_time_range=True,
            read_only_execution=True,
            allowed_fields=DEFAULT_ALLOWED_FIELDS,
            allowed_operations=DEFAULT_ALLOWED_OPERATIONS,
            enabled_scenarios=DEFAULT_SCENARIOS,
            audit_logging_enabled=True,
            updated_by="admin"
        )
        db.add(policy)
        db.commit()
        db.refresh(policy)
    return policy

@router.get("")
def get_governance_policy(db: Session = Depends(get_db)):
    policy = get_or_create_policy(db)
    return {
        "max_time_range_hours": policy.max_time_range_hours,
        "max_results": policy.max_results,
        "require_time_range": policy.require_time_range,
        "read_only_execution": policy.read_only_execution,
        "allowed_fields": policy.allowed_fields,
        "allowed_operations": policy.allowed_operations,
        "enabled_scenarios": policy.enabled_scenarios,
        "audit_logging_enabled": policy.audit_logging_enabled,
        "updated_by": policy.updated_by,
        "updated_at": policy.updated_at
    }

@router.put("")
def update_governance_policy(
    payload: GovernancePolicyPayload, 
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header("admin")
):
    # RBAC Security Check: Only SOC Admin can modify Governance policies!
    role = (x_user_role or "analyst").lower()
    if role != "admin":
        raise HTTPException(
            status_code=403, 
            detail="403 Forbidden: SOC Admin permission is required to modify Governance policies."
        )

    policy = get_or_create_policy(db)
    timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    # Track setting changes for audit log
    changes = []
    if policy.max_time_range_hours != payload.max_time_range_hours:
        changes.append(("max_time_range_hours", str(policy.max_time_range_hours), str(payload.max_time_range_hours)))
        policy.max_time_range_hours = payload.max_time_range_hours

    if policy.max_results != payload.max_results:
        changes.append(("max_results", str(policy.max_results), str(payload.max_results)))
        policy.max_results = payload.max_results

    if policy.require_time_range != payload.require_time_range:
        changes.append(("require_time_range", str(policy.require_time_range), str(payload.require_time_range)))
        policy.require_time_range = payload.require_time_range

    if policy.read_only_execution != payload.read_only_execution:
        changes.append(("read_only_execution", str(policy.read_only_execution), str(payload.read_only_execution)))
        policy.read_only_execution = payload.read_only_execution

    if policy.allowed_fields != payload.allowed_fields:
        changes.append(("allowed_fields", json.dumps(policy.allowed_fields), json.dumps(payload.allowed_fields)))
        policy.allowed_fields = payload.allowed_fields

    if policy.allowed_operations != payload.allowed_operations:
        changes.append(("allowed_operations", json.dumps(policy.allowed_operations), json.dumps(payload.allowed_operations)))
        policy.allowed_operations = payload.allowed_operations

    if policy.enabled_scenarios != payload.enabled_scenarios:
        changes.append(("enabled_scenarios", json.dumps(policy.enabled_scenarios), json.dumps(payload.enabled_scenarios)))
        policy.enabled_scenarios = payload.enabled_scenarios

    if policy.audit_logging_enabled != payload.audit_logging_enabled:
        changes.append(("audit_logging_enabled", str(policy.audit_logging_enabled), str(payload.audit_logging_enabled)))
        policy.audit_logging_enabled = payload.audit_logging_enabled

    policy.updated_by = "admin"
    policy.updated_at = timestamp

    # Save governance audit logs
    for setting, old_val, new_val in changes:
        audit_entry = GovernanceAuditModel(
            admin_id="admin",
            setting_changed=setting,
            old_value=old_val,
            new_value=new_val,
            timestamp=timestamp
        )
        db.add(audit_entry)

    db.commit()
    db.refresh(policy)

    return {
        "message": "Governance policy updated successfully.",
        "policy": {
            "max_time_range_hours": policy.max_time_range_hours,
            "max_results": policy.max_results,
            "require_time_range": policy.require_time_range,
            "read_only_execution": policy.read_only_execution,
            "allowed_fields": policy.allowed_fields,
            "allowed_operations": policy.allowed_operations,
            "enabled_scenarios": policy.enabled_scenarios,
            "audit_logging_enabled": policy.audit_logging_enabled,
            "updated_by": policy.updated_by,
            "updated_at": policy.updated_at
        }
    }

@router.get("/audit")
def get_governance_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    logs = db.query(GovernanceAuditModel).order_by(GovernanceAuditModel.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": log.id,
            "admin_id": log.admin_id,
            "setting_changed": log.setting_changed,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "timestamp": log.timestamp
        }
        for log in logs
    ]
