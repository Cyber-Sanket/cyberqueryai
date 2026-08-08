import os
import json
import logging
from dotenv import load_dotenv
from google import genai
from google.genai import types
from app.schemas.investigation import InvestigationIntent
from app.services.validation.intent_validator import validate_intent

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

SYSTEM_INSTRUCTION = """
You are a Cybersecurity Intent Parser for a SIEM system.
Check if the user's question represents a valid SOC security investigation.

If INVALID (e.g. gibberish "dfhj", non-security question like "weather", or unsupported prompt):
Output JSON:
{
  "is_valid": false,
  "reason": "Explain why this is not a valid SOC investigation prompt",
  "suggestions": ["Find repeated failed login attempts", "Find suspicious PowerShell executions"]
}

If VALID:
Output JSON:
{
  "is_valid": true,
  "investigation_type": "brute_force" | "powershell_abuse" | "port_scan" | "dns_tunneling" | "impossible_travel" | "generic",
  "event_type": string,
  "threshold": int (optional),
  "group_by": list[string],
  "time_window": "24h" | "7d"
}
Return ONLY valid JSON.
"""

def parse_intent_fallback(prompt: str) -> dict:
    """Deterministic Gate 1 + Fallback Intent Parser."""
    gate1_res = validate_intent(prompt)
    if not gate1_res["valid"]:
        return {
            "is_valid": False,
            "investigation_type": "invalid",
            "reason": gate1_res["reason"],
            "suggestions": gate1_res["suggestions"]
        }

    scenario = gate1_res["scenario"]
    if scenario == "brute_force":
        return {"is_valid": True, "investigation_type": "brute_force", "event_type": "authentication", "threshold": 5, "group_by": ["username", "source_ip"], "time_window": "24h"}
    elif scenario == "powershell_abuse":
        return {"is_valid": True, "investigation_type": "powershell_abuse", "event_type": "process_execution", "group_by": ["hostname", "username"], "time_window": "24h"}
    elif scenario == "port_scan":
        return {"is_valid": True, "investigation_type": "port_scan", "event_type": "network_connection", "threshold": 10, "group_by": ["source_ip"], "time_window": "24h"}
    elif scenario == "dns_tunneling":
        return {"is_valid": True, "investigation_type": "dns_tunneling", "event_type": "dns_query", "threshold": 10, "group_by": ["hostname", "destination_ip"], "time_window": "24h"}
    elif scenario == "impossible_travel":
        return {"is_valid": True, "investigation_type": "impossible_travel", "event_type": "authentication", "group_by": ["username"], "time_window": "24h"}
    
    return {"is_valid": True, "investigation_type": "generic", "event_type": "all", "group_by": ["source_ip"], "time_window": "24h"}

async def parse_user_intent(prompt: str) -> dict:
    # Always check local Gate 1 Intent Validator first for fast rejection of gibberish
    gate1 = validate_intent(prompt)
    if not gate1["valid"]:
        return {
            "is_valid": False,
            "investigation_type": "invalid",
            "reason": gate1["reason"],
            "suggestions": gate1["suggestions"]
        }

    if not client:
        return parse_intent_fallback(prompt)

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                temperature=0.1
            ),
        )
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        parsed = json.loads(text.strip())
        if "is_valid" not in parsed:
            parsed["is_valid"] = True
        return parsed
    except Exception as e:
        logging.warning(f"Gemini API Exception ({e}). Degrading to fallback parser.")
        return parse_intent_fallback(prompt)

class AIIntentParser:
    def parse(self, question: str) -> InvestigationIntent:
        res = parse_intent_fallback(question)
        return InvestigationIntent(**res)
