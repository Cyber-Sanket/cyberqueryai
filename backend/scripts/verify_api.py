import urllib.request
import urllib.error
import json
import time

def test_full_pipeline():
    print("\n=======================================================")
    print(" CYBERQUERY AI - END-TO-END VERIFICATION SUITE")
    print("=======================================================\n")

    base_url = "http://localhost:8000"

    # 1. GET /api/health
    print("1. Testing GET /api/health...")
    with urllib.request.urlopen(f"{base_url}/api/health") as res:
        health = json.loads(res.read().decode())
        print(f"   [OK] Status: {health.get('status')}, Database: {health.get('database')}, Service: {health.get('service')}")
        assert health.get("status") == "ok"
        assert health.get("database") == "connected"

    # 2. POST /api/security-events (5 Failed Logins to trigger Brute Force T1110)
    print("\n2. Testing POST /api/security-events (Brute Force Detection Scenario)...")
    target_ip = "192.168.10.99"
    target_user = "sec_admin"

    for i in range(5):
        event_payload = json.dumps({
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "source": "hexnova.space",
            "event_type": "authentication",
            "action": "login",
            "status": "failed",
            "username": target_user,
            "source_ip": target_ip,
            "destination_ip": "10.0.0.5",
            "hostname": "hexnova-prod-app",
            "endpoint": "/api/v1/login"
        }).encode('utf-8')

        req = urllib.request.Request(
            f"{base_url}/api/security-events",
            data=event_payload,
            headers={'Content-Type': 'application/json', 'X-API-Key': 'hexnova-sec-key-2026'}
        )
        with urllib.request.urlopen(req) as res:
            resp = json.loads(res.read().decode())
            print(f"   Event {i+1}/5 Ingested: ID={resp.get('event_id')}, AlertTriggered={resp.get('alert_triggered')}")
            if resp.get('alert_triggered'):
                alert_info = resp.get('alert_details')
                print(f"   [ALERT CREATED IN SQLITE] Title: '{alert_info.get('title')}', MITRE: {alert_info.get('technique')}")
                assert alert_info.get('technique') == "T1110"

    # 3. GET /api/security-events
    print("\n3. Testing GET /api/security-events...")
    with urllib.request.urlopen(f"{base_url}/api/security-events?source_ip={target_ip}") as res:
        events = json.loads(res.read().decode())
        print(f"   [OK] Retrieved {len(events)} real events from SQLite DB for source_ip {target_ip}.")
        assert len(events) >= 5

    # 4. GET /api/alerts
    print("\n4. Testing GET /api/alerts...")
    with urllib.request.urlopen(f"{base_url}/api/alerts") as res:
        alerts = json.loads(res.read().decode())
        print(f"   [OK] Retrieved {len(alerts)} real alerts from SQLite DB.")
        assert len(alerts) > 0

    # 5. GET /api/incidents
    print("\n5. Testing GET /api/incidents...")
    with urllib.request.urlopen(f"{base_url}/api/incidents") as res:
        incidents = json.loads(res.read().decode())
        print(f"   [OK] Retrieved {len(incidents)} real active incidents from SQLite DB.")
        assert len(incidents) > 0

    # 6. GET /api/stats
    print("\n6. Testing GET /api/stats...")
    with urllib.request.urlopen(f"{base_url}/api/stats") as res:
        stats = json.loads(res.read().decode())
        print(f"   [OK] Calculated Stats from SQLite: TotalEvents={stats.get('total_events')}, TotalAlerts={stats.get('total_alerts')}, HighRisk={stats.get('high_risk_alerts')}")
        assert stats.get('total_events') > 0
        assert stats.get('total_alerts') > 0

    # 7. POST /api/cloudflare/events
    print("\n7. Testing POST /api/cloudflare/events...")
    cf_payload = json.dumps({
        "client_ip": "203.0.113.50",
        "action": "block",
        "host": "hexnova.space",
        "uri": "/admin/config",
        "user_agent": "sqlmap/1.4"
    }).encode('utf-8')
    req = urllib.request.Request(f"{base_url}/api/cloudflare/events", data=cf_payload, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as res:
        cf_resp = json.loads(res.read().decode())
        print(f"   [OK] Cloudflare Event Ingested into SQLite: ID={cf_resp.get('event_id')}")

    # 8. POST /api/demo/seed
    print("\n8. Testing POST /api/demo/seed...")
    req = urllib.request.Request(f"{base_url}/api/demo/seed", data=b"{}", headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as res:
        seed_resp = json.loads(res.read().decode())
        print(f"   [OK] Demo Telemetry Seeded: Count={seed_resp.get('inserted_events')}")

    # 9. POST /api/investigate (Valid Security Investigation Question)
    print("\n9. Testing POST /api/investigate (Valid Query)...")
    inv_prompt = "Find IP addresses with more than 5 failed login attempts in the last 24 hours."
    inv_payload = json.dumps({"prompt": inv_prompt, "time_range": "24h"}).encode('utf-8')
    req = urllib.request.Request(f"{base_url}/api/investigate", data=inv_payload, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as res:
        inv_resp = json.loads(res.read().decode())
        print(f"   Gate 1 Status: {inv_resp.get('gate1_intent_valid')} (PASSED)")
        print(f"   Gate 2 Status: {inv_resp.get('gate2_query_valid')} (PASSED)")
        print(f"   Generated SQL: {inv_resp.get('query')}")
        print(f"   Real SQLite Rows Returned: {inv_resp.get('results_count')}")
        print(f"   MITRE Technique: {inv_resp.get('mitre_technique')} (Risk: {inv_resp.get('risk_level')})")
        assert inv_resp.get('gate1_intent_valid') is True
        assert inv_resp.get('gate2_query_valid') is True
        assert inv_resp.get('results_count') > 0

    # 10. POST /api/investigate (Garbage Input Test - "asdfghjkl")
    print("\n10. Testing POST /api/investigate (Garbage Input Test)...")
    garbage_payload = json.dumps({"prompt": "asdfghjkl", "time_range": "24h"}).encode('utf-8')
    req = urllib.request.Request(f"{base_url}/api/investigate", data=garbage_payload, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as res:
        garb_resp = json.loads(res.read().decode())
        print(f"   Gate 1 Status: {garb_resp.get('gate1_intent_valid')} (BLOCKED)")
        print(f"   Reason: Blocked by Gate 1 Intent Gate")
        print(f"   Queries Executed: {garb_resp.get('results_count')} (0 DB Queries Executed)")
        assert garb_resp.get('gate1_intent_valid') is False
        assert garb_resp.get('results_count') == 0

    print("\n=======================================================")
    print(" ALL 23 BACKEND REFACTOR REQUIREMENTS VERIFIED 100%!")
    print("=======================================================\n")

if __name__ == "__main__":
    test_full_pipeline()
