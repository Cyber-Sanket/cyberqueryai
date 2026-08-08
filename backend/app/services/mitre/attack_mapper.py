import json
import os
from typing import Dict, Any, Optional

class MitreAttackMapper:

    def __init__(self, mapping_file="data/mitre_mapping.json"):
        self.mapping_file = mapping_file
        self._load_mappings()

    def _load_mappings(self):
        if os.path.exists(self.mapping_file):
            with open(self.mapping_file, "r", encoding="utf-8") as f:
                self.mappings = json.load(f)
        else:
            self.mappings = {}

    def get_technique_info(self, technique_id: str) -> Optional[Dict[str, Any]]:
        return self.mappings.get(technique_id)

    def map_investigation(self, investigation_type: str, results_count: int) -> Tuple_T:
        """
        Returns (technique_id, technique_name, risk_level, risk_score)
        """
        if results_count == 0:
            return None, None, "LOW", 10

        if investigation_type == "brute_force":
            return "T1110", "Brute Force", "HIGH", 85
        elif investigation_type == "powershell_abuse":
            return "T1059.001", "Command and Scripting Interpreter: PowerShell", "HIGH", 90
        elif investigation_type == "port_scanning":
            return "T1046", "Network Service Discovery", "MEDIUM", 65
        elif investigation_type == "dns_tunneling":
            return "T1071.004", "Application Layer Protocol: DNS", "HIGH", 80
        elif investigation_type == "impossible_travel":
            return "T1078", "Valid Accounts: Impossible Travel", "HIGH", 85
        else:
            return None, None, "MEDIUM" if results_count > 50 else "LOW", 30

Tuple_T = tuple
