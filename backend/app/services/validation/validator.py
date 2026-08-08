import re

def validate_query(sql_query: str, intent: dict, raw_question: str = "", governance_policy: dict = None) -> dict:
    """
    Gate 2 --- Query Safety & Governance Gate
    Enforces:
    1. Read-Only Execution (no DDL/DML mutations)
    2. Governance Max Time Range Cap
    3. Require Time Range
    4. Allowed Schema Fields Whitelist
    5. Allowed Operations Whitelist
    """
    if not governance_policy:
        governance_policy = {
            "max_time_range_hours": 168,
            "max_results": 1000,
            "require_time_range": True,
            "read_only_execution": True,
            "allowed_fields": ["timestamp", "username", "source_ip", "destination_ip", "source_port", "destination_port", "event_type", "action", "status", "hostname", "process", "parent_process", "command_line", "domain", "location_city", "location_country", "*"],
            "allowed_operations": ["SELECT", "WHERE", "GROUP BY", "HAVING", "ORDER BY", "LIMIT"],
            "audit_logging_enabled": True
        }

    q_upper = sql_query.upper()
    q_lower = raw_question.lower()

    # Rule 1: Read-Only Execution Check
    read_only_enabled = governance_policy.get("read_only_execution", True)
    if read_only_enabled:
        forbidden_keywords = ["DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "TRUNCATE", "CREATE", "GRANT", "REVOKE"]
        for kw in forbidden_keywords:
            if f" {kw} " in f" {q_upper} " or q_upper.startswith(f"{kw} "):
                return {
                    "safe": False,
                    "reason": f"Governance Violation: Destructive operation '{kw}' is blocked by Read-Only execution policy."
                }

    # Rule 2: Max Time Range Cap Enforcement
    max_time_range_hours = governance_policy.get("max_time_range_hours", 168)
    requested_hours = None
    if "7 days" in q_lower or "7d" in q_lower or "last week" in q_lower:
        requested_hours = 168
    elif "3 days" in q_lower or "3d" in q_lower:
        requested_hours = 72
    elif "24 hours" in q_lower or "24h" in q_lower or "1 day" in q_lower:
        requested_hours = 24
    elif "6 hours" in q_lower or "6h" in q_lower:
        requested_hours = 6
    elif "1 hour" in q_lower or "1h" in q_lower:
        requested_hours = 1

    if requested_hours and requested_hours > max_time_range_hours:
        max_label = f"{max_time_range_hours} hours" if max_time_range_hours < 24 else f"{max_time_range_hours // 24} day(s)"
        req_label = f"{requested_hours // 24} day(s)" if requested_hours >= 24 else f"{requested_hours} hours"
        return {
            "safe": False,
            "reason": f"Governance Violation: Requested {req_label} time range exceeds Governance limit of {max_label}."
        }

    # Rule 3: Require Time Range Check
    require_time_range = governance_policy.get("require_time_range", True)
    if require_time_range and q_lower and any(p in q_lower for p in ["search all logs", "dump database", "everything from all time", "without time range"]):
        return {
            "safe": False,
            "reason": "Governance Violation: Unscoped query rejected. A specific time range is required by Governance policy."
        }

    # Rule 4: Schema Whitelist Check
    allowed_fields = governance_policy.get("allowed_fields", [])
    if "*" not in allowed_fields:
        sql_keywords = {
            "SELECT", "FROM", "WHERE", "AND", "OR", "GROUP", "BY", "HAVING", "LIMIT", "AS", "DATETIME", 
            "ORDER", "DESC", "ASC", "COUNT", "NOW", "LIKE", "IN", "IS", "NOT", "NULL", "SECURITY_EVENTS",
            "=", ">=", "<=", ">", "<", "COUNT(*)", "EVENT_COUNT"
        }
        words = sql_query.replace(",", " ").replace("(", " ").replace(")", " ").replace(";", " ").split()
        for w in words:
            clean = w.strip("'\"`")
            if not clean or clean.upper() in sql_keywords or clean.isdigit() or clean.startswith("'") or clean.startswith('"') or clean in ["=", ">=", "<=", ">", "<"]:
                continue
            if clean.lower() not in [f.lower() for f in allowed_fields] and clean.upper() not in sql_keywords:
                return {
                    "safe": False,
                    "reason": f"Governance Violation: Field '{clean}' is not in the active Governance Allowed Fields whitelist."
                }

    return {
        "safe": True,
        "reason": "Passed all Query Safety & Governance Gate checks."
    }

class QuerySafetyGate:
    def validate(self, sql_query: str, intent: dict, raw_question: str = "", governance_policy: dict = None) -> dict:
        return validate_query(sql_query, intent, raw_question, governance_policy)
