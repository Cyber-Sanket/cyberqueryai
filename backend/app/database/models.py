from sqlalchemy import Column, String, Integer, DateTime, JSON, Text, Boolean
from datetime import datetime
from app.database.session import Base

class SecurityEventModel(Base):
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(String, index=True)
    username = Column(String, index=True)
    source_ip = Column(String, index=True)
    destination_ip = Column(String)
    source_port = Column(Integer)
    destination_port = Column(Integer)
    event_type = Column(String, index=True)
    action = Column(String)
    status = Column(String)
    hostname = Column(String)
    process = Column(String)
    parent_process = Column(String)
    command_line = Column(Text)
    domain = Column(String)
    location_city = Column(String)
    location_country = Column(String)

class InvestigationModel(Base):
    __tablename__ = "investigations"

    id = Column(String, primary_key=True)
    user_id = Column(String, default="analyst-1")
    question = Column(Text, nullable=False)
    generated_intent = Column(JSON, nullable=False)
    generated_query = Column(Text, nullable=False)
    validation_result = Column(JSON, nullable=False)
    execution_time_ms = Column(Integer, default=0)
    results_count = Column(Integer, default=0)
    risk_score = Column(Integer, default=0)
    mitre_technique = Column(String, nullable=True)
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())

class AlertModel(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    severity = Column(String, nullable=False) # CRITICAL, HIGH, MEDIUM, LOW
    mitre_technique = Column(String, nullable=False)
    target_user = Column(String)
    source_ip = Column(String)
    status = Column(String, default="NEW") # NEW, INVESTIGATING, RESOLVED
    created_at = Column(String, default=lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"))
    description = Column(Text)

class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True)
    investigation_id = Column(String)
    action = Column(String)
    user_id = Column(String)
    timestamp = Column(String, default=lambda: datetime.utcnow().isoformat())
    details = Column(JSON)

class GovernancePolicyModel(Base):
    __tablename__ = "governance_policies"

    id = Column(String, primary_key=True, default="active_policy")
    max_time_range_hours = Column(Integer, default=168)
    max_results = Column(Integer, default=1000)
    require_time_range = Column(Boolean, default=True)
    read_only_execution = Column(Boolean, default=True)
    allowed_fields = Column(JSON, default=list)
    allowed_operations = Column(JSON, default=list)
    enabled_scenarios = Column(JSON, default=dict)
    audit_logging_enabled = Column(Boolean, default=True)
    updated_at = Column(String, default=lambda: datetime.utcnow().isoformat())
    updated_by = Column(String, default="admin")

class GovernanceAuditModel(Base):
    __tablename__ = "governance_audits"

    id = Column(String, primary_key=True)
    admin_id = Column(String, nullable=False)
    setting_changed = Column(String, nullable=False)
    old_value = Column(String)
    new_value = Column(String)
    timestamp = Column(String, default=lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"))
