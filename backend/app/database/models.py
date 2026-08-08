import time
from sqlalchemy import Column, Integer, String, JSON, Boolean, DateTime, Text, Float
from app.database.session import Base

class SecurityEventModel(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(String, index=True)
    source = Column(String, index=True, default="hexnova.space")
    event_type = Column(String, index=True) # authentication, process_execution, network_connection, dns_query, http_request
    action = Column(String) # login, connect, query, execute
    status = Column(String, index=True) # success, failed
    username = Column(String, index=True, nullable=True)
    source_ip = Column(String, index=True, nullable=True)
    destination_ip = Column(String, nullable=True)
    hostname = Column(String, nullable=True)
    endpoint = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    severity = Column(String, default="LOW")
    raw_data = Column(JSON, nullable=True)

class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    created_at = Column(String, index=True)
    title = Column(String)
    severity = Column(String, index=True) # LOW, MEDIUM, HIGH, CRITICAL
    source_ip = Column(String, index=True)
    mitre_technique = Column(String, index=True) # e.g. T1110
    description = Column(String)
    status = Column(String, default="Open") # Open, Investigating, Closed
    evidence = Column(JSON, nullable=True)
    target_user = Column(String, nullable=True)

class IncidentModel(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, index=True)
    created_at = Column(String, index=True)
    title = Column(String)
    severity = Column(String, index=True) # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String, default="Active") # Active, Resolved
    source_ip = Column(String, index=True)
    event_count = Column(Integer, default=1)
    mitre_technique = Column(String, index=True)
    summary = Column(String)

class InvestigationModel(Base):
    __tablename__ = "investigations"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String)
    question = Column(String)
    generated_intent = Column(JSON)
    generated_query = Column(String)
    validation_result = Column(JSON)
    execution_time_ms = Column(Integer)
    results_count = Column(Integer)
    risk_score = Column(Integer)
    mitre_technique = Column(String, nullable=True)
    created_at = Column(String, index=True)

class GovernancePolicyModel(Base):
    __tablename__ = "governance_policy"

    id = Column(Integer, primary_key=True, default=1)
    max_time_range_hours = Column(Integer, default=24)
    max_results = Column(Integer, default=500)
    require_time_range = Column(Boolean, default=True)
    read_only_execution = Column(Boolean, default=True)
    allowed_fields = Column(JSON)
    allowed_operations = Column(JSON)
    enabled_scenarios = Column(JSON)
    audit_logging_enabled = Column(Boolean, default=True)
    updated_at = Column(String)
    updated_by = Column(String, default="admin")

class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    investigation_id = Column(String, nullable=True)
    action = Column(String)
    user_id = Column(String)
    timestamp = Column(String)
    details = Column(JSON)

GovernanceAuditModel = AuditLogModel
