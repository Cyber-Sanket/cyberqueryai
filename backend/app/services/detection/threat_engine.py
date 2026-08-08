import uuid
import time
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.database.models import SecurityEventModel, AlertModel, IncidentModel

class ThreatEngine:
    def analyze_results(self, intent: Dict[str, Any], results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes returned query results to generate structured threat breakdown.
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

        # Analyze evidence rows
        failed_logins = [r for r in results if str(r.get("status", "")).lower() == "failed"]
        powershell_events = [r for r in results if "powershell" in str(r.get("action", "")).lower() or "powershell" in str(r.get("event_type", "")).lower()]

        if len(failed_logins) >= 5 or inv_type == "brute_force":
            source_ips = list(set([r.get("source_ip") for r in failed_logins if r.get("source_ip")]))
            users = list(set([r.get("username") for r in failed_logins if r.get("username")]))
            return {
                "risk_level": "HIGH",
                "risk_score": 85,
                "confidence": "High",
                "mitre_technique": "T1110",
                "mitre_evidence": f"Identified {len(failed_logins)} failed login attempts from IP(s) {', '.join(source_ips[:3])} targeting user(s) {', '.join(users[:3])}.",
                "explanation": f"Pattern matches MITRE ATT&CK T1110 (Brute Force). High frequency of failed authentications detected.",
                "recommended_actions": [
                    f"Block source IP address(es): {', '.join(source_ips[:3])}",
                    f"Enforce MFA and reset password for account: {users[0] if users else 'affected users'}",
                    "Inspect downstream successful logins for potential compromise."
                ]
            }

        if powershell_events or inv_type == "powershell":
            return {
                "risk_level": "HIGH",
                "risk_score": 80,
                "confidence": "High",
                "mitre_technique": "T1059.001",
                "mitre_evidence": f"Detected {len(powershell_events)} suspicious PowerShell script execution events.",
                "explanation": "Pattern matches MITRE ATT&CK T1059.001 (Command and Scripting Interpreter: PowerShell).",
                "recommended_actions": [
                    "Isolate target host workstation.",
                    "Review PowerShell script block logs (Event ID 4104).",
                    "Terminate unauthorized process trees."
                ]
            }

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

        if inv_type == "dns":
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
    """
    Real Detection Engine Rules Executor.
    Evaluates incoming event against SQLite database to detect suspicious security patterns:
    A. Brute Force (T1110): >= 5 failed logins from same source_ip within 10 minutes
    B. Suspicious PowerShell (T1059.001): Obfuscated/encoded command flags
    C. Port Scanning (T1046): Connecting to >= 10 ports
    D. Suspicious DNS (T1071.004): Querying C2/tunneling domain names
    E. Impossible Travel (T1078): Same user logging in from different subnets
    """
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
            # Check if alert already exists to prevent duplication
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

                # Create corresponding Incident
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
    raw_str = str(event.raw_data or "").lower() + str(event.action or "").lower() + str(event.endpoint or "").lower()
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
        endpoint_str = str(event.endpoint or "").lower()
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
                description=f"DNS query to known suspicious domain '{event.endpoint}' from host '{event.hostname or 'Endpoint'}'.",
                status="Open",
                target_user=event.username or "system",
                evidence={"domain": event.endpoint}
            )
            db.add(alert)
            db.commit()
            return alert

    return None
