import uuid
import time
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.database.models import SecurityEventModel, AlertModel, IncidentModel

class ThreatEngine:
    def analyze_results(self, intent: Dict[str, Any], results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes returned query results to generate structured threat breakdown across all 8 DSL scenarios.
        """
        inv_type = intent.get("investigation_type", "generic")
        row_count = len(results)

        if row_count == 0:
            return {
                "risk_level": "LOW",
                "risk_score": 10,
                "confidence": "High",
                "mitre_technique": None,
                "mitre_evidence": "Zero suspicious log anomalies detected in the queried time window.",
                "explanation": "Query executed successfully against SIEM telemetry. No matching threat indicators found.",
                "recommended_actions": ["Maintain standard continuous monitoring."]
            }

        # Scenario 1: Brute Force
        if inv_type == "brute_force" or any(r.get("status") == "failed" for r in results):
            source_ips = list(set([str(r.get("source_ip")) for r in results if r.get("source_ip")]))
            users = list(set([str(r.get("username")) for r in results if r.get("username")]))
            return {
                "risk_level": "HIGH",
                "risk_score": 85,
                "confidence": "High",
                "mitre_technique": "T1110",
                "mitre_evidence": f"Identified failed login attempts from IP(s) {', '.join(source_ips[:3])} targeting user(s) {', '.join(users[:3])}.",
                "explanation": "Pattern matches MITRE ATT&CK T1110 (Brute Force). High frequency of failed authentications detected.",
                "recommended_actions": [
                    f"Block source IP address(es): {', '.join(source_ips[:3])}",
                    f"Enforce MFA and reset password for account: {users[0] if users else 'affected users'}",
                    "Inspect downstream successful logins for potential compromise."
                ]
            }

        # Scenario 2: PowerShell Abuse
        if inv_type == "powershell_abuse":
            return {
                "risk_level": "HIGH",
                "risk_score": 80,
                "confidence": "High",
                "mitre_technique": "T1059.001",
                "mitre_evidence": f"Detected {row_count} suspicious PowerShell process execution events.",
                "explanation": "Pattern matches MITRE ATT&CK T1059.001 (Command and Scripting Interpreter: PowerShell).",
                "recommended_actions": [
                    "Isolate target host workstation.",
                    "Review PowerShell script block logs (Event ID 4104).",
                    "Terminate unauthorized process trees."
                ]
            }

        # Scenario 3: Port Scan
        if inv_type == "port_scan":
            return {
                "risk_level": "HIGH",
                "risk_score": 75,
                "confidence": "Medium",
                "mitre_technique": "T1046",
                "mitre_evidence": f"Detected high volume port scanning activity across {row_count} connection attempts.",
                "explanation": "Pattern matches MITRE ATT&CK T1046 (Network Service Discovery).",
                "recommended_actions": [
                    "Block scanning source IP on edge firewall.",
                    "Audit exposed network services."
                ]
            }

        # Scenario 4: DNS Tunneling
        if inv_type == "dns_tunneling":
            return {
                "risk_level": "MEDIUM",
                "risk_score": 60,
                "confidence": "Medium",
                "mitre_technique": "T1071.004",
                "mitre_evidence": f"Detected {row_count} anomalous DNS resolution requests to external domains.",
                "explanation": "Pattern matches MITRE ATT&CK T1071.004 (Application Layer Protocol: DNS).",
                "recommended_actions": [
                    "Sinkhole suspicious DNS domain.",
                    "Inspect endpoint process initiating DNS queries."
                ]
            }

        # Scenario 5: Impossible Travel
        if inv_type == "impossible_travel":
            return {
                "risk_level": "HIGH",
                "risk_score": 80,
                "confidence": "High",
                "mitre_technique": "T1078",
                "mitre_evidence": f"Detected geographically disparate authentications across {row_count} sessions.",
                "explanation": "Pattern matches MITRE ATT&CK T1078 (Valid Accounts: Impossible Travel).",
                "recommended_actions": [
                    "Revoke active SSO sessions for affected account.",
                    "Require MFA re-authentication."
                ]
            }

        # Scenario 6: Privilege Escalation
        if inv_type == "privilege_escalation":
            return {
                "risk_level": "HIGH",
                "risk_score": 85,
                "confidence": "High",
                "mitre_technique": "T1068",
                "mitre_evidence": f"Detected {row_count} administrative privilege escalation commands.",
                "explanation": "Pattern matches MITRE ATT&CK T1068 (Exploitation for Privilege Escalation).",
                "recommended_actions": [
                    "Audit user group assignments and sudoers file.",
                    "Verify authorization for elevated process executions."
                ]
            }

        # Scenario 7: Data Exfiltration
        if inv_type == "data_exfiltration":
            return {
                "risk_level": "CRITICAL",
                "risk_score": 90,
                "confidence": "High",
                "mitre_technique": "T1041",
                "mitre_evidence": f"Detected {row_count} high-volume outbound data transfer events.",
                "explanation": "Pattern matches MITRE ATT&CK T1041 (Exfiltration Over C2 Channel).",
                "recommended_actions": [
                    "Block outbound destination IP at network perimeter.",
                    "Initiate data loss prevention (DLP) triage."
                ]
            }

        # Scenario 8: Web Application Attack
        if inv_type == "web_application_attack":
            return {
                "risk_level": "CRITICAL",
                "risk_score": 92,
                "confidence": "High",
                "mitre_technique": "T1190",
                "mitre_evidence": f"Detected {row_count} WAF blocked web exploitation events (SQLi/XSS).",
                "explanation": "Pattern matches MITRE ATT&CK T1190 (Exploit Public-Facing Application).",
                "recommended_actions": [
                    "Verify WAF blocking rules are active on edge CDN.",
                    "Inspect web server logs for bypass attempts."
                ]
            }

        return {
            "risk_level": "MEDIUM",
            "risk_score": 50,
            "confidence": "Medium",
            "mitre_technique": "T1078",
            "mitre_evidence": f"Retrieved {row_count} events requiring SOC analyst verification.",
            "explanation": "Log pattern indicates potentially anomalous security telemetry.",
            "recommended_actions": [
                "Verify legitimacy of user activity with account owner.",
                "Correlate telemetry with endpoint security logs."
            ]
        }

def analyze_threat(intent: Dict[str, Any], results: List[Dict[str, Any]]) -> Dict[str, Any]:
    engine = ThreatEngine()
    return engine.analyze_results(intent, results)

def evaluate_event_rules(event: SecurityEventModel, db: Session) -> Optional[AlertModel]:
    """Real Detection Engine Rules Executor."""
    if not event:
        return None

    # RULE A: Brute Force (T1110)
    if event.event_type == "authentication" and event.status == "failed" and event.source_ip:
        failed_count = db.query(SecurityEventModel).filter(
            SecurityEventModel.event_type == "authentication",
            SecurityEventModel.status == "failed",
            SecurityEventModel.source_ip == event.source_ip
        ).count()

        if failed_count >= 5:
            existing_alert = db.query(AlertModel).filter(
                AlertModel.source_ip == event.source_ip,
                AlertModel.mitre_technique == "T1110",
                AlertModel.status == "Open"
            ).first()

            if not existing_alert:
                alert_id = f"alt-{uuid.uuid4().hex[:8]}"
                now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ")
                alert = AlertModel(
                    id=alert_id,
                    created_at=now_str,
                    title=f"Possible Brute Force Attack ({failed_count} Failed Attempts)",
                    severity="HIGH",
                    source_ip=event.source_ip,
                    mitre_technique="T1110",
                    description=f"Multiple failed login attempts ({failed_count}) detected from IP {event.source_ip} targeting user '{event.username or 'demo_admin'}' on asset {event.source}.",
                    status="Open",
                    target_user=event.username or "demo_admin",
                    evidence={"failed_count": failed_count, "source_ip": event.source_ip, "asset": event.source}
                )
                db.add(alert)

                incident_id = f"inc-{uuid.uuid4().hex[:8]}"
                incident = IncidentModel(
                    id=incident_id,
                    created_at=now_str,
                    title=f"Brute-Force Attack Campaign on {event.source}",
                    severity="HIGH",
                    status="Active",
                    source_ip=event.source_ip,
                    event_count=failed_count,
                    mitre_technique="T1110",
                    summary=f"Automated credential brute-force attack originating from {event.source_ip} targeting account {event.username or 'demo_admin'}."
                )
                db.add(incident)
                db.commit()
                return alert

    # RULE B: Suspicious PowerShell (T1059.001)
    raw_str = str(event.raw_data or "").lower() + str(event.action or "").lower() + str(event.endpoint or "").lower() + str(event.command_line or "").lower()
    if "powershell" in raw_str and any(flag in raw_str for flag in ["-enc", "-encodedcommand", "nop", "bypass", "downloadstring"]):
        alert_id = f"alt-{uuid.uuid4().hex[:8]}"
        now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ")
        alert = AlertModel(
            id=alert_id,
            created_at=now_str,
            title="Suspicious Encoded PowerShell Execution",
            severity="HIGH",
            source_ip=event.source_ip or "127.0.0.1",
            mitre_technique="T1059.001",
            description=f"Encoded or bypass PowerShell command executed on host '{event.hostname or 'Workstation'}'.",
            status="Open",
            target_user=event.username or "system",
            evidence={"action": event.action, "endpoint": event.endpoint}
        )
        db.add(alert)
        db.commit()
        return alert

    # RULE C: Port Scanning (T1046)
    if event.event_type == "network_connection" and event.source_ip:
        conn_count = db.query(SecurityEventModel).filter(
            SecurityEventModel.event_type == "network_connection",
            SecurityEventModel.source_ip == event.source_ip
        ).count()

        if conn_count >= 10:
            existing_alert = db.query(AlertModel).filter(
                AlertModel.source_ip == event.source_ip,
                AlertModel.mitre_technique == "T1046",
                AlertModel.status == "Open"
            ).first()

            if not existing_alert:
                alert_id = f"alt-{uuid.uuid4().hex[:8]}"
                now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ")
                alert = AlertModel(
                    id=alert_id,
                    created_at=now_str,
                    title="Network Service Discovery / Port Scan Detected",
                    severity="HIGH",
                    source_ip=event.source_ip,
                    mitre_technique="T1046",
                    description=f"Rapid network connection attempts across multiple ports originating from IP {event.source_ip}.",
                    status="Open",
                    target_user="network",
                    evidence={"connection_count": conn_count, "source_ip": event.source_ip}
                )
                db.add(alert)
                db.commit()
                return alert

    # RULE D: Suspicious DNS (T1071.004)
    if event.event_type == "dns_query":
        endpoint_str = str(event.endpoint or "").lower() + str(event.domain or "").lower()
        if any(dom in endpoint_str for dom in ["tunnel.com", "c2.net", "txt-dns", "ngrok"]):
            alert_id = f"alt-{uuid.uuid4().hex[:8]}"
            now_str = time.strftime("%Y-%m-%dT%H:%M:%SZ")
            alert = AlertModel(
                id=alert_id,
                created_at=now_str,
                title="Suspicious DNS Tunneling / C2 Query",
                severity="MEDIUM",
                source_ip=event.source_ip or "127.0.0.1",
                mitre_technique="T1071.004",
                description=f"DNS query to known suspicious domain '{event.domain or event.endpoint}' from host '{event.hostname or 'Endpoint'}'.",
                status="Open",
                target_user=event.username or "system",
                evidence={"domain": event.domain or event.endpoint}
            )
            db.add(alert)
            db.commit()
            return alert

    return None
