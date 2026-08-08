def build_sql_query(intent: dict, governance_policy: dict = None) -> str:
    """
    Query DSL to SQL Adapter
    Converts structured Investigation Intent DSL into executable, read-only SQL queries,
    enforcing maximum result limits from Governance Policy.
    """
    policy = governance_policy or {}
    max_limit = policy.get("max_results", 1000)

    event_type = intent.get("event_type", "all")
    group_by_fields = intent.get("group_by", [])
    threshold = intent.get("threshold")
    time_window = intent.get("time_window", "24h")
    itype = intent.get("investigation_type", "generic")

    limit_cap = min(100, max_limit)

    # Specialized DSL translations for core investigation scenarios
    if itype == "brute_force":
        thresh = threshold or 5
        return f"""SELECT username, source_ip, hostname, COUNT(*) as event_count FROM security_events WHERE (status = 'failed' OR action = 'login') GROUP BY username, source_ip HAVING event_count >= {thresh} ORDER BY event_count DESC LIMIT {limit_cap};""".strip()
    elif itype == "powershell_abuse":
        return f"""SELECT id, timestamp, username, hostname, source_ip, process, parent_process, command_line FROM security_events WHERE event_type = 'process_execution' AND (LOWER(process) LIKE '%powershell%' OR LOWER(command_line) LIKE '%encodedcommand%' OR LOWER(command_line) LIKE '%-enc%' OR LOWER(parent_process) IN ('winword.exe', 'excel.exe', 'cmd.exe')) ORDER BY timestamp DESC LIMIT {limit_cap};""".strip()
    elif itype == "port_scan":
        thresh = threshold or 10
        return f"""SELECT source_ip, destination_ip, hostname, username, COUNT(DISTINCT destination_port) as event_count FROM security_events WHERE event_type = 'network_connection' GROUP BY source_ip, destination_ip HAVING event_count >= {thresh} ORDER BY event_count DESC LIMIT {min(50, limit_cap)};""".strip()
    elif itype == "dns_tunneling":
        thresh = threshold or 10
        return f"""SELECT hostname, username, source_ip, domain, COUNT(*) as event_count FROM security_events WHERE event_type = 'dns_query' AND (LOWER(domain) LIKE '%.exfil%' OR LOWER(domain) LIKE '%.c2%' OR LENGTH(domain) > 35) GROUP BY hostname, username, source_ip, domain HAVING event_count >= {thresh} ORDER BY event_count DESC LIMIT {min(50, limit_cap)};""".strip()
    elif itype == "impossible_travel":
        return f"""SELECT username, source_ip, location_city, location_country, timestamp FROM security_events WHERE event_type = 'authentication' AND status = 'success' AND location_city IS NOT NULL ORDER BY username, timestamp ASC LIMIT {min(200, limit_cap)};""".strip()

    # Generic Query DSL Translation
    if group_by_fields:
        select_clause = ", ".join(group_by_fields) + ", COUNT(*) as event_count"
    else:
        select_clause = "*"

    query = f"SELECT {select_clause} FROM security_events"

    # Where Clause
    where_conditions = []
    if event_type != "all":
        where_conditions.append(f"event_type = '{event_type}'")
    
    # Time window formatting for SQLite Adapter
    if time_window == "24h":
        where_conditions.append("timestamp >= datetime('now', '-1 day')")
    elif time_window == "7d":
        where_conditions.append("timestamp >= datetime('now', '-7 days')")

    if where_conditions:
        query += " WHERE " + " AND ".join(where_conditions)

    # Group By & Having Clause
    if group_by_fields:
        query += " GROUP BY " + ", ".join(group_by_fields)
        if threshold:
            query += f" HAVING event_count > {threshold}"

    query += f" LIMIT {limit_cap};"
    return query

class DSLToSQLAdapter:
    def build_query(self, intent: dict, governance_policy: dict = None) -> str:
        return build_sql_query(intent, governance_policy)

DeterministicQueryBuilder = DSLToSQLAdapter
