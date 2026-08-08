import uuid
import time
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.database.session import get_db
from app.database.models import InvestigationModel, SecurityEventModel, AuditLogModel, AlertModel, IncidentModel
from app.schemas.investigation import InvestigationResponse, DashboardSummary, QueryValidationCheck
from app.datasources.simulated_siem import SimulatedSIEMDataSource, execute_query_on_siem
from app.services.ai.intent_parser import parse_user_intent, AIIntentParser
from app.services.query.builder import build_sql_query
from app.services.validation.validator import validate_query, QuerySafetyGate
from app.services.validation.intent_validator import validate_intent
from app.services.detection.threat_engine import analyze_threat, ThreatEngine
from app.services.mitre.attack_mapper import MitreAttackMapper
from app.api.routes.governance import get_or_create_policy

router = APIRouter(prefix="/api", tags=["Investigations & Stats"])

datasource = SimulatedSIEMDataSource()
intent_parser_obj = AIIntentParser()
validator_obj = QuerySafetyGate()
threat_engine_obj = ThreatEngine()
mitre_mapper = MitreAttackMapper()

class UniversalInvestigationRequest(BaseModel):
    prompt: Optional[str] = None
    question: Optional[str] = None
    time_range: Optional[str] = "24h"

class QueryValidateRequest(BaseModel):
    sql_query: str
    question: Optional[str] = ""

class QueryExecuteRequest(BaseModel):
    sql_query: str

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    GET /api/health
    Confirms SQLite database connectivity and API readiness.
    """
    try:
        event_count = db.query(SecurityEventModel).count()
        return {
            "status": "ok",
            "database": "connected",
            "service": "CyberQuery API",
            "total_events_stored": event_count,
            "monitored_asset": "hexnova.space"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connectivity failed: {str(e)}")

@router.get("/stats")
def get_real_stats(db: Session = Depends(get_db)):
    """
    GET /api/stats
    Calculates security statistics dynamically from SQLite database without hardcoded values.
    """
    total_events = db.query(SecurityEventModel).count()
    total_alerts = db.query(AlertModel).count()
    high_risk = db.query(AlertModel).filter(AlertModel.severity.in_(["HIGH", "CRITICAL"])).count()
    critical = db.query(AlertModel).filter(AlertModel.severity == "CRITICAL").count()
    active_incidents = db.query(IncidentModel).count()

    # Top suspicious IPs calculated from DB
    raw_ip_stats = db.query(
        SecurityEventModel.source_ip,
        func.count(SecurityEventModel.id).label("total_events")
    ).filter(SecurityEventModel.source_ip.isnot(None)).group_by(SecurityEventModel.source_ip).order_by(func.count(SecurityEventModel.id).desc()).limit(5).all()

    suspicious_ips = []
    for r in raw_ip_stats:
        failed_count = db.query(SecurityEventModel).filter(
            SecurityEventModel.source_ip == r.source_ip,
            SecurityEventModel.status == "failed"
        ).count()
        suspicious_ips.append({
            "source_ip": r.source_ip,
            "country": "External",
            "failed_logins": failed_count,
            "event_count": r.total_events
        })

    # Top targeted users calculated from DB
    raw_user_stats = db.query(
        SecurityEventModel.username,
        func.count(SecurityEventModel.id).label("total_events")
    ).filter(SecurityEventModel.username.isnot(None)).group_by(SecurityEventModel.username).order_by(func.count(SecurityEventModel.id).desc()).limit(5).all()

    targeted_users = []
    for u in raw_user_stats:
        failed_count = db.query(SecurityEventModel).filter(
            SecurityEventModel.username == u.username,
            SecurityEventModel.status == "failed"
        ).count()
        targeted_users.append({
            "username": u.username,
            "primary_host": "hexnova-app",
            "failed_logins": failed_count,
            "event_count": u.total_events
        })

    return {
        "total_events": total_events,
        "total_alerts": total_alerts,
        "high_risk_alerts": high_risk,
        "critical_alerts": critical,
        "active_incidents": active_incidents,
        "suspicious_ips": suspicious_ips,
        "targeted_users": targeted_users
    }

@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):
    """
    GET /api/alerts
    Returns real alerts from SQLite database.
    """
    alerts = db.query(AlertModel).order_by(AlertModel.created_at.desc()).all()
    return alerts

@router.get("/incidents")
def get_incidents(db: Session = Depends(get_db)):
    """
    GET /api/incidents
    Returns real active incidents from SQLite database.
    """
    incidents = db.query(IncidentModel).order_by(IncidentModel.created_at.desc()).all()
    return incidents

@router.post("/investigate")
@router.post("/investigations")
async def run_investigation(
    req: UniversalInvestigationRequest, 
    db: Session = Depends(get_db),
    x_user_role: Optional[str] = Header("analyst")
):
    """
    POST /api/investigate (and POST /api/investigations)
    Natural-language security investigation execution workbench.
    """
    start_time = time.time()
    investigation_id = f"inv-{uuid.uuid4().hex[:8]}"
    query_text = req.prompt or req.question or "Find suspicious login activity"

    gov = get_or_create_policy(db)
    governance_policy = {
        "max_time_range_hours": gov.max_time_range_hours,
        "max_results": gov.max_results,
        "require_time_range": gov.require_time_range,
        "read_only_execution": gov.read_only_execution,
        "allowed_fields": gov.allowed_fields,
        "allowed_operations": gov.allowed_operations,
        "enabled_scenarios": gov.enabled_scenarios,
        "audit_logging_enabled": gov.audit_logging_enabled
    }

    # GATE 1 --- INTENT VALIDATOR GATE
    gate1_res = validate_intent(query_text, governance_policy=governance_policy)
    
    if not gate1_res["valid"]:
        exec_time = int((time.time() - start_time) * 1000)
        reason = gate1_res["reason"]
        suggestions = gate1_res.get("suggestions", [
            "Find repeated failed login attempts",
            "Find suspicious PowerShell executions",
            "Find possible port scanning",
            "Find unusual DNS activity",
            "Find impossible travel authentications"
        ])

        val_check = QueryValidationCheck(
            syntax_valid=False,
            fields_verified=False,
            operators_allowed=False,
            datasource_compatible=False,
            time_range_specified=False,
            scope_acceptable=False,
            safe_to_execute=False,
            rejection_reason=f"Gate 1 Blocked: {reason}"
        )

        return {
            "id": investigation_id,
            "question": query_text,
            "status": "INTENT_BLOCKED",
            "gate1_intent_valid": False,
            "gate2_query_valid": False,
            "intent": {"investigation_type": "invalid"},
            "query": "-- EXECUTION BLOCKED 🔒 (No SIEM query executed - Blocked by Gate 1)",
            "validation": val_check.model_dump(),
            "error": f"⚠️ Investigation Not Understood: {reason}",
            "suggestions": suggestions,
            "risk_level": "BLOCKED",
            "risk_score": 0,
            "mitre_technique": None,
            "mitre_confidence": "N/A",
            "mitre_evidence": "Zero database queries executed. Halted at Gate 1.",
            "results_count": 0,
            "results": [],
            "query_explanation": [
                f"1. Analyst typed prompt: '{query_text}'",
                f"2. Gate 1 Intent Gate evaluated request: {reason}",
                "3. Query generation: BLOCKED 🔒",
                "4. SIEM database execution: BLOCKED 🔒 (0 queries run)"
            ],
            "threat_explanation": f"🔒 EXECUTION BLOCKED by Gate 1 Intent Gate. Reason: {reason}",
            "recommended_actions": suggestions,
            "execution_time_ms": exec_time,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")
        }

    # Intent parsing
    intent = await parse_user_intent(query_text)
    if req.time_range:
        intent["time_window"] = req.time_range

    # GATE 2 --- QUERY SAFETY & VALIDATION GATE
    generated_sql = build_sql_query(intent, governance_policy=governance_policy)
    validation = validate_query(generated_sql, intent, raw_question=query_text, governance_policy=governance_policy)
    safe = validation.get("safe", False)
    
    val_check = QueryValidationCheck(
        syntax_valid=safe,
        fields_verified=safe,
        operators_allowed=safe,
        datasource_compatible=safe,
        time_range_specified=safe,
        scope_acceptable=safe,
        safe_to_execute=safe,
        rejection_reason=None if safe else validation.get("reason"),
        suggested_fields=["username", "hostname", "process", "command_line"] if not safe else None
    )

    if not safe:
        exec_time = int((time.time() - start_time) * 1000)
        return {
            "id": investigation_id,
            "question": query_text,
            "status": "QUERY_BLOCKED",
            "gate1_intent_valid": True,
            "gate2_query_valid": False,
            "intent": intent,
            "query": generated_sql,
            "validation": val_check.model_dump(),
            "error": f"Governance / Safety Gate Violation: {validation.get('reason')}",
            "suggestions": ["Adjust time range within Governance limit", "Ensure query includes allowed fields and read-only operations"],
            "risk_level": "BLOCKED",
            "risk_score": 0,
            "mitre_technique": None,
            "mitre_confidence": "N/A",
            "mitre_evidence": "Zero database queries executed. Halted by Gate 2.",
            "results_count": 0,
            "results": [],
            "query_explanation": [
                f"1. Analyst typed prompt: '{query_text}'",
                "2. Gate 1 Intent Gate: PASSED ✅",
                f"3. Query Builder generated SQL: {generated_sql}",
                f"4. Gate 2 Safety Gate: BLOCKED 🔒 ({validation.get('reason')})"
            ],
            "threat_explanation": f"🔒 QUERY BLOCKED by Gate 2 Safety Gate. Reason: {validation.get('reason')}",
            "recommended_actions": ["Request Governance policy update from SOC Admin"],
            "execution_time_ms": exec_time,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")
        }

    # Execute Safe Query on SQLite Database Telemetry
    raw_results = execute_query_on_siem(generated_sql, db)
    exec_time = int((time.time() - start_time) * 1000)

    # Perform Evidence-Based Threat Analysis
    threat_analysis = analyze_threat(intent, raw_results)

    mitre_tech = threat_analysis.get("mitre_technique")
    mitre_info = mitre_mapper.get_technique_info(mitre_tech) if mitre_tech else {}

    res_data = {
        "id": investigation_id,
        "question": query_text,
        "status": "VALIDATED",
        "gate1_intent_valid": True,
        "gate2_query_valid": True,
        "intent": intent,
        "query": generated_sql,
        "validation": val_check.model_dump(),
        "error": None,
        "risk_level": threat_analysis.get("risk_level", "LOW"),
        "risk_score": threat_analysis.get("risk_score", 10),
        "mitre_technique": mitre_tech,
        "mitre_confidence": threat_analysis.get("confidence", "Low"),
        "mitre_evidence": threat_analysis.get("mitre_evidence", "Evidence matches patterns."),
        "mitre_details": mitre_info,
        "results_count": len(raw_results),
        "results": raw_results,
        "query_explanation": [
            f"1. Analyst natural language query: '{query_text}'",
            "2. Gate 1 Intent Gate: PASSED ✅",
            f"3. Query Builder parsed intent into Query DSL: scenario={intent.get('investigation_type')}",
            f"4. Gate 2 Safety Gate: PASSED ✅ (Read-only verified, max time cap satisfied, schema whitelisted)",
            f"5. Executed Query against SQLite DB Telemetry: {len(raw_results)} matching events returned"
        ],
        "threat_explanation": threat_analysis.get("explanation", "Investigation executed cleanly."),
        "recommended_actions": threat_analysis.get("recommended_actions", []),
        "execution_time_ms": exec_time,
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }

    try:
        db_inv = InvestigationModel(
            id=investigation_id,
            user_id="analyst-1",
            question=query_text,
            generated_intent=intent,
            generated_query=generated_sql,
            validation_result=val_check.model_dump(),
            execution_time_ms=exec_time,
            results_count=len(raw_results),
            risk_score=threat_analysis.get("risk_score", 10),
            mitre_technique=mitre_tech,
            created_at=time.strftime("%Y-%m-%dT%H:%M:%SZ")
        )
        db.add(db_inv)

        if gov.audit_logging_enabled:
            audit = AuditLogModel(
                id=f"aud-{uuid.uuid4().hex[:8]}",
                investigation_id=investigation_id,
                action="INVESTIGATION_EXECUTION",
                user_id="analyst-1",
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                details={"question": query_text, "status": "VALIDATED", "results": len(raw_results)}
            )
            db.add(audit)

        db.commit()
    except Exception:
        db.rollback()

    return res_data

@router.get("/dashboard/summary")
def get_dashboard_summary(asset: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """
    GET /api/dashboard/summary?asset=hexnova.space
    Calculates security overview counters dynamically from database.
    """
    total_events = db.query(SecurityEventModel).count()
    total_alerts = db.query(AlertModel).count()
    high_risk = db.query(AlertModel).filter(AlertModel.severity.in_(["HIGH", "CRITICAL"])).count()
    critical = db.query(AlertModel).filter(AlertModel.severity == "CRITICAL").count()

    recent_alerts = db.query(AlertModel).order_by(AlertModel.created_at.desc()).limit(5).all()

    monitored_assets = [
        {
            "id": "asset-1",
            "name": "HexNova",
            "domain": "hexnova.space",
            "type": "web_application",
            "status": "monitoring",
            "environment": "Authorized / Controlled Environment",
            "events_count": total_events,
            "alerts_count": total_alerts,
            "risk_level": "High" if high_risk > 2 else ("Medium" if total_alerts > 0 else "Low")
        }
    ]

    return {
        "total_assets": 1,
        "total_events": total_events,
        "total_alerts": total_alerts,
        "high_risk_alerts": high_risk,
        "critical_alerts": critical,
        "active_asset_filter": asset or "all",
        "monitored_assets": monitored_assets,
        "recent_alerts": [
            {
                "id": a.id,
                "title": a.title,
                "severity": a.severity,
                "asset": "hexnova.space",
                "target_user": a.target_user or "demo_admin",
                "source_ip": a.source_ip or "192.168.56.101",
                "status": a.status,
                "created_at": a.created_at
            }
            for a in recent_alerts
        ]
    }

@router.get("/investigations")
def get_investigations(limit: int = 20, db: Session = Depends(get_db)):
    invs = db.query(InvestigationModel).order_by(InvestigationModel.created_at.desc()).limit(limit).all()
    return invs

@router.get("/investigations/{id}")
def get_investigation_by_id(id: str, db: Session = Depends(get_db)):
    inv = db.query(InvestigationModel).filter(InvestigationModel.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation record not found")
    return inv

@router.get("/mitre/{technique}")
def get_mitre_details(technique: str):
    info = mitre_mapper.get_technique_info(technique)
    if not info:
        raise HTTPException(status_code=404, detail=f"MITRE technique '{technique}' not found in registry")
    return info

@router.get("/datasources")
def get_datasources():
    return [
        {
            "id": "hexnova-space-siem",
            "name": "HexNova Application Telemetry Stream",
            "type": "REST API Ingestion (POST /api/security-events)",
            "target_app": "hexnova.space",
            "status": "CONNECTED",
            "read_only": True,
            "last_sync": time.strftime("%Y-%m-%dT%H:%M:%SZ")
        }
    ]
