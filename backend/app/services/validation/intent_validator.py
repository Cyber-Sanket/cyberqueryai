import re
from typing import Dict, Any, List

# Security Keywords Whitelist for Intent Gate
SECURITY_KEYWORDS = {
    "brute", "failed", "login", "auth", "authentication", "password", "user", "admin", "credential",
    "powershell", "encoded", "-enc", "script", "cmd", "process", "exec", "downloadstring", "iex", "winword",
    "port", "scan", "ports", "sweep", "network", "connect", "connection", "ip", "host",
    "dns", "domain", "tunnel", "subdomain", "c2", "exfil", "query", "queries",
    "travel", "location", "country", "geographic", "impossible", "vpn", "sso",
    "threat", "alert", "incident", "attack", "suspicious", "anomalous", "event", "logs"
}

def validate_intent(prompt: str, governance_policy: dict = None) -> Dict[str, Any]:
    """
    Gate 1 --- Intent Validator Gate
    Determines whether a natural-language prompt represents a valid SOC security investigation
    AND verifies that the scenario is enabled in active Governance & Controls.
    """
    if not prompt or not prompt.strip():
        return {
            "valid": False,
            "reason": "Empty investigation prompt.",
            "suggestions": [
                "Find repeated failed login attempts",
                "Find suspicious PowerShell executions",
                "Find possible port scanning",
                "Find unusual DNS activity",
                "Find impossible travel authentications"
            ]
        }

    p_clean = prompt.lower().strip()

    # Reject very short inputs (< 4 chars)
    if len(p_clean) < 4:
        return {
            "valid": False,
            "reason": "Input does not contain a recognized security investigation request.",
            "suggestions": [
                "Find users with more than 5 failed login attempts",
                "Find suspicious PowerShell executions with encoded commands",
                "Find IP addresses connecting to many ports",
                "Find hosts making unusual DNS queries"
            ]
        }

    # Reject common non-security prompts
    non_sec_patterns = ["weather", "joke", "recipe", "who is", "what is", "hello", "hi", "how are you", "dfhj", "asdf", "test"]
    if p_clean in non_sec_patterns or any(p_clean.startswith(pat) for pat in ["what is the weather", "tell me a joke"]):
        return {
            "valid": False,
            "reason": "CyberQuery AI is designed exclusively for SOC security investigations.",
            "suggestions": [
                "Find repeated failed login attempts",
                "Find suspicious PowerShell executions",
                "Find possible port scanning",
                "Find unusual DNS activity",
                "Find impossible travel authentications"
            ]
        }

    # Check for presence of security keywords
    has_security_keyword = any(kw in p_clean for kw in SECURITY_KEYWORDS)

    if not has_security_keyword:
        return {
            "valid": False,
            "reason": f"No valid security investigation intent detected in '{prompt}'.",
            "suggestions": [
                "Find users with more than 5 failed login attempts",
                "Find suspicious PowerShell executions with encoded commands",
                "Find IP addresses connecting to many ports in a short period",
                "Find hosts making unusual DNS requests to external domains"
            ]
        }

    # Map to scenario
    if any(k in p_clean for k in ["failed", "brute", "password", "login"]):
        scenario = "brute_force"
    elif any(k in p_clean for k in ["powershell", "encoded", "-enc", "script"]):
        scenario = "powershell_abuse"
    elif any(k in p_clean for k in ["port", "scan", "sweep"]):
        scenario = "port_scan"
    elif any(k in p_clean for k in ["dns", "domain", "tunnel"]):
        scenario = "dns_tunneling"
    elif any(k in p_clean for k in ["travel", "location", "country", "impossible"]):
        scenario = "impossible_travel"
    else:
        scenario = "generic_search"

    # Governance Policy Enabled Scenarios Check
    if governance_policy:
        enabled_scenarios = governance_policy.get("enabled_scenarios", {})
        if scenario in enabled_scenarios and not enabled_scenarios[scenario]:
            scenario_name = scenario.replace("_", " ").title()
            return {
                "valid": False,
                "reason": f"Governance Violation: Investigation scenario '{scenario_name}' is currently disabled by SOC Admin.",
                "suggestions": [
                    f"Ask SOC Admin to enable '{scenario_name}' scenario in Governance & Controls.",
                    "Try another enabled scenario like Brute Force or PowerShell Abuse."
                ]
            }

    return {
        "valid": True,
        "scenario": scenario,
        "confidence": 0.95,
        "reason": "Valid SOC Security Investigation Intent Detected."
    }
