import os
import logging
from dotenv import load_dotenv
from groq import Groq
from typing import List, Dict, Any

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

MITRE_MAPPING = {
    "brute_force": {
        "id": "T1110",
        "name": "Brute Force",
        "risk": 85,
        "level": "HIGH",
        "confidence": "High",
        "evidence_template": "{count} failed authentication attempts followed by successful login from single IP."
    },
    "powershell_abuse": {
        "id": "T1059.001",
        "name": "PowerShell",
        "risk": 90,
        "level": "HIGH",
        "confidence": "High",
        "evidence_template": "{count} process execution events showing powershell.exe spawned by Word macro with encoded command line parameters."
    },
    "port_scan": {
        "id": "T1046",
        "name": "Network Service Discovery",
        "risk": 55,
        "level": "MEDIUM",
        "confidence": "Medium",
        "evidence_template": "Source IP connecting to {count} distinct internal destination ports within short timeframe."
    },
    "dns_tunneling": {
        "id": "T1071.004",
        "name": "DNS Tunneling",
        "risk": 75,
        "level": "HIGH",
        "confidence": "Medium-High",
        "evidence_template": "{count} high-entropy DNS queries targeting non-standard C2 domains."
    },
    "impossible_travel": {
        "id": "T1078",
        "name": "Valid Accounts: Impossible Travel",
        "risk": 80,
        "level": "HIGH",
        "confidence": "High",
        "evidence_template": "Sequential successful logins for same account from geographically distant locations (USA & Japan) within 12 minutes."
    },
    "generic": {
        "id": "None",
        "name": "Suspicious Activity",
        "risk": 30,
        "level": "LOW",
        "confidence": "Low",
        "evidence_template": "{count} matching security events retrieved."
    }
}

def analyze_threat(intent: dict, results: list) -> dict:
    """
    Calculates threat risk dynamically based on log execution evidence,
    maps MITRE techniques with confidence metrics, and generates plain-English findings.
    """
    investigation_type = intent.get("investigation_type", "generic")
    results_count = len(results)
    
    # If no results were found, no threat exists
    if results_count == 0:
        return {
            "risk_score": 0,
            "risk_level": "INFO",
            "mitre_id": "None",
            "mitre_technique": None,
            "mitre_name": "None",
            "mitre_confidence": "N/A",
            "mitre_evidence": "No matching security events found in logs.",
            "explanation": "No matching suspicious activity found in the authorized log telemetry.",
            "threat_explanation": "No matching suspicious activity found in the authorized log telemetry.",
            "recommended_actions": ["No immediate remediation required.", "Continue baseline monitoring."]
        }

    threat_profile = MITRE_MAPPING.get(investigation_type, MITRE_MAPPING["generic"])
    evidence = threat_profile["evidence_template"].format(count=results_count)

    # Generate Groq API explanation with fallback
    if not groq_client:
        explanation = f"Detected {results_count} anomalous events correlating to {threat_profile['name']}. Immediate investigation of source IP and user accounts is required."
    else:
        prompt = f"Explain this SOC alert in 2 sentences for a dashboard: {threat_profile['name']} detected. Found {results_count} matches. Keep it professional and actionable."
        try:
            chat = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                temperature=0.3,
                max_tokens=150,
            )
            explanation = chat.choices[0].message.content.strip()
        except Exception as e:
            logging.error(f"Groq API Error: {e}")
            explanation = f"Detected {results_count} anomalous events correlating to {threat_profile['name']}."

    recs_map = {
        "brute_force": ["Isolate source IP address at perimeter firewall", "Trigger mandatory password reset and MFA re-authentication", "Audit Active Directory logs for compromised account activity"],
        "powershell_abuse": ["Isolate target endpoint from network immediately", "Decode Base64 command payload for C2 domains", "Enable Event ID 4104 Script Block Logging"],
        "port_scan": ["Identify scanning host and verify authorization", "Inspect target host for Nmap/Masscan scripts", "Review firewall access control lists"],
        "dns_tunneling": ["Block target domain at recursive DNS resolver level", "Inspect host memory for dnscat2/iodine utilities", "Isolate workstation endpoint"],
        "impossible_travel": ["Revoke active session tokens and force global logout", "Prompt user to confirm current physical location", "Check IdP logs for compromise indicators"]
    }

    return {
        "risk_score": threat_profile["risk"],
        "risk_level": threat_profile["level"],
        "mitre_id": f"{threat_profile['id']} - {threat_profile['name']}" if threat_profile['id'] != "None" else None,
        "mitre_technique": threat_profile['id'] if threat_profile['id'] != "None" else None,
        "mitre_name": threat_profile['name'],
        "mitre_confidence": threat_profile["confidence"],
        "mitre_evidence": evidence,
        "explanation": explanation,
        "threat_explanation": explanation,
        "recommended_actions": recs_map.get(investigation_type, ["Review log entry details and timestamps", "Correlate with perimeter logs"])
    }

class ThreatEngine:
    def analyze_threat(self, intent: Any, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        intent_dict = intent.model_dump() if hasattr(intent, 'model_dump') else intent
        return analyze_threat(intent_dict, results)

    def generate_query_explanation(self, intent: Any, raw_question: str) -> List[str]:
        intent_dict = intent.model_dump() if hasattr(intent, 'model_dump') else intent
        itype = intent_dict.get("investigation_type", "generic")
        return [
            f"1. Analyst asked: \"{raw_question}\"",
            f"2. Parsed Investigation Intent DSL: type='{itype}'.",
            f"3. Grouped telemetry events by: {intent_dict.get('group_by', ['source_ip'])}.",
            f"4. Applied threshold filter: > {intent_dict.get('threshold', 0)}.",
            "5. Executed read-only SQL query against Data Source Adapter (SQLite/SimulatedSIEM)."
        ]
