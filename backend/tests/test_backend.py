import os
import pytest
from app.services.ai.intent_parser import AIIntentParser
from app.services.query.builder import DeterministicQueryBuilder
from app.services.validation.validator import ZeroHallucinationValidator
from app.services.detection.threat_engine import ThreatEngine
from app.datasources.simulated_siem import SimulatedSIEMDataSource

def test_intent_parser_brute_force():
    parser = AIIntentParser()
    question = "Find users with more than 5 failed login attempts from the same IP followed by a successful login."
    intent = parser.parse(question)
    assert intent.investigation_type == "brute_force"
    assert intent.event_type == "authentication"
    assert intent.status_filter == "failed"
    assert intent.threshold == 5

def test_intent_parser_powershell():
    parser = AIIntentParser()
    question = "Find suspicious encoded PowerShell executions on workstations."
    intent = parser.parse(question)
    assert intent.investigation_type == "powershell_abuse"

def test_intent_parser_port_scan():
    parser = AIIntentParser()
    question = "Find IP addresses connecting to many ports in a short period."
    intent = parser.parse(question)
    assert intent.investigation_type == "port_scanning"

def test_intent_parser_dns():
    parser = AIIntentParser()
    question = "Find hosts making unusual DNS requests to external domains."
    intent = parser.parse(question)
    assert intent.investigation_type == "dns_tunneling"

def test_intent_parser_impossible_travel():
    parser = AIIntentParser()
    question = "Find users logging in from different locations within a very short time."
    intent = parser.parse(question)
    assert intent.investigation_type == "impossible_travel"

def test_query_builder_and_validator():
    parser = AIIntentParser()
    builder = DeterministicQueryBuilder()
    validator = ZeroHallucinationValidator()

    intent = parser.parse("Find users with repeated failed logins")
    sql, params = builder.build_query(intent)
    val = validator.validate(sql)

    assert "SELECT" in sql
    assert val.safe_to_execute is True
    assert val.fields_verified is True
    assert val.operators_allowed is True

def test_unsafe_query_rejection_missing_time_range():
    validator = ZeroHallucinationValidator()
    sql = "SELECT * FROM security_events"
    val = validator.validate(sql, raw_question="Search all logs unconditionally without time filter")
    assert val.safe_to_execute is False
    assert "Time range required" in val.rejection_reason

def test_unsafe_query_rejection_unknown_field():
    validator = ZeroHallucinationValidator()
    sql = "SELECT user_password FROM security_events WHERE user_password IS NOT NULL"
    val = validator.validate(sql)
    assert val.safe_to_execute is False
    assert "user_password" in val.rejection_reason

def test_threat_engine_mitre_mapping():
    parser = AIIntentParser()
    engine = ThreatEngine()

    intent = parser.parse("Find repeated failed logins")
    mock_results = [{"username": "admin", "source_ip": "192.168.1.44", "failed_count": 17}]
    analysis = engine.analyze_threat(intent, mock_results)

    assert analysis["risk_level"] == "HIGH"
    assert analysis["mitre_technique"] == "T1110"
    assert "17 failed authentication attempts" in analysis["threat_explanation"]
