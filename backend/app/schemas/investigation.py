from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class InvestigationIntent(BaseModel):
    investigation_type: str = Field(..., description="e.g. brute_force, powershell_abuse, port_scanning, dns_tunneling, impossible_travel, general_search")
    event_type: Optional[str] = None
    status_filter: Optional[str] = None
    action_filter: Optional[str] = None
    threshold: Optional[int] = None
    group_by: Optional[List[str]] = None
    time_window: str = Field(default="24h", description="e.g. 1h, 24h, 7d")
    correlate_with: Optional[str] = None
    target_field: Optional[str] = None
    search_term: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None

class QueryValidationCheck(BaseModel):
    syntax_valid: bool
    fields_verified: bool
    operators_allowed: bool
    datasource_compatible: bool
    time_range_specified: bool
    scope_acceptable: bool
    safe_to_execute: bool
    rejection_reason: Optional[str] = None
    suggested_fields: Optional[List[str]] = None

class InvestigationRequest(BaseModel):
    question: str
    time_range: Optional[str] = "24h"

class InvestigationResponse(BaseModel):
    id: str
    question: str
    intent: InvestigationIntent
    query: str
    validation: QueryValidationCheck
    risk_level: str
    risk_score: int
    mitre_technique: Optional[str]
    mitre_name: Optional[str]
    results_count: int
    results: List[Dict[str, Any]]
    query_explanation: List[str]
    threat_explanation: str
    recommended_actions: List[str]
    execution_time_ms: int
    created_at: str

class DashboardSummary(BaseModel):
    total_events: int
    critical_alerts: int
    high_risk_incidents: int
    medium_risk_incidents: int
    low_risk_incidents: int
    suspicious_ips: List[Dict[str, Any]]
    suspicious_users: List[Dict[str, Any]]
    recent_investigations: List[Dict[str, Any]]
    recent_alerts: List[Dict[str, Any]]
    event_activity: List[Dict[str, Any]]
    siem_connected: bool
