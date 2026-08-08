import sqlite3
import pandas as pd
import json
import os
from typing import Dict, Any, List
from app.datasources.base import DataSource
from app.database.session import DB_PATH

def execute_query_on_siem(sql_query: Any, db: Any = None) -> list:
    """Executes the validated SQL query against the SQLite telemetry database (security_events)."""
    if not isinstance(sql_query, str) and isinstance(db, str):
        # Handle swapped arguments: execute_query_on_siem(db_session, sql_query_string)
        sql_query, db = db, sql_query

    clean_sql = str(sql_query).replace("security_logs", "security_events")
    
    try:
        conn = sqlite3.connect(DB_PATH)
        result_df = pd.read_sql_query(clean_sql, conn)
        conn.close()
        return result_df.to_dict(orient="records")
    except Exception as e:
        json_path = os.path.join("data", "security_logs.json")
        if os.path.exists(json_path):
            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    logs = json.load(f)
                df = pd.DataFrame(logs)
                conn = sqlite3.connect(":memory:")
                df.to_sql("security_events", conn, index=False)
                df.to_sql("security_logs", conn, index=False)
                result_df = pd.read_sql_query(clean_sql, conn)
                conn.close()
                return result_df.to_dict(orient="records")
            except Exception as inner_e:
                return [{"execution_error": str(inner_e)}]
        return [{"execution_error": str(e)}]

class SimulatedSIEMDataSource(DataSource):
    def __init__(self, schema_file="data/schema.json", json_logs_file="data/security_logs.json"):
        self.schema_file = schema_file
        self.json_logs_file = json_logs_file
        self.db_path = DB_PATH
        self._load_schema()

    def _load_schema(self):
        if os.path.exists(self.schema_file):
            with open(self.schema_file, "r", encoding="utf-8") as f:
                self.schema_data = json.load(f)
        else:
            self.schema_data = {"fields": [], "allowed_operations": []}

    def search(self, query_sql: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        return execute_query_on_siem(query_sql)

    def get_schema(self) -> Dict[str, Any]:
        return self.schema_data

    def validate_connection(self) -> bool:
        return os.path.exists(self.json_logs_file) or os.path.exists(self.db_path)

    def get_capabilities(self) -> Dict[str, Any]:
        return {
            "name": "Simulated SIEM Security Telemetry Store",
            "type": "In-Memory Pandas / SQLite Engine",
            "supported_events": ["authentication", "process_execution", "network_connection", "dns_query"],
            "max_query_time_range_hours": 168
        }
