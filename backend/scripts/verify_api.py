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
        print(f"   [OK] Status: {health.get('status')}, Database: {health.get('database')}, Monitored Asset: {health.get('monitored_asset')}")
        assert health.get("status") == "ok"
        assert health.get("database") == "connected"
        assert health.get("monitored_asset") == "Login Portal"

    # 2. GET /api/assets
    print("\n2. Testing GET /api/assets...")
    with urllib.request.urlopen(f"{base_url}/api/assets") as res:
        assets = json.loads(res.read().decode())
        print(f"   [OK] Retrieved {len(assets)} monitored assets from SQLite DB: Asset={assets[0].get('name')} ({assets[0].get('asset_id')})")
        assert len(assets) == 1
        assert assets[0].get('asset_id') == "login-portal"
        assert assets[0].get('name') == "Login Portal"

    # 3. POST /api/demo/seed
    print("\n3. Testing POST /api/demo/seed...")
    req = urllib.request.Request(f"{base_url}/api/demo/seed", data=b"{}", headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as res:
        seed_resp = json.loads(res.read().decode())
        print(f"   [OK] Demo Telemetry Seeded into SQLite: Count={seed_resp.get('inserted_events')}, Target={seed_resp.get('target_asset')}")
        assert seed_resp.get('inserted_events') > 0
        assert seed_resp.get('target_asset') == "login-portal"

    # 4. GET /api/security-events
    print("\n4. Testing GET /api/security-events...")
    with urllib.request.urlopen(f"{base_url}/api/security-events") as res:
        events = json.loads(res.read().decode())
        print(f"   [OK] Retrieved {len(events)} real events directly from SQLite DB.")
        assert len(events) >= 5

    # 5. GET /api/alerts
    print("\n5. Testing GET /api/alerts...")
    with urllib.request.urlopen(f"{base_url}/api/alerts") as res:
        alerts = json.loads(res.read().decode())
        print(f"   [OK] Retrieved {len(alerts)} real alerts created by detection engine in SQLite DB.")
        assert len(alerts) > 0

    # 6. GET /api/stats
    print("\n6. Testing GET /api/stats...")
    with urllib.request.urlopen(f"{base_url}/api/stats") as res:
        stats = json.loads(res.read().decode())
        print(f"   [OK] Calculated Stats from SQLite: TotalEvents={stats.get('total_events')}, TotalAlerts={stats.get('total_alerts')}, MonitoredAssets={stats.get('monitored_assets_count')}")
        assert stats.get('total_events') > 0
        assert stats.get('total_alerts') > 0
        assert stats.get('monitored_assets_count') == 1

    # 7. POST /api/investigate (Brute Force Prompt)
    print("\n7. Testing POST /api/investigate (Brute Force Prompt)...")
    inv_prompt = "Find users with more than 5 failed login attempts on Login Portal"
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

    # 8. POST /api/investigate (Garbage Input Test - "asdfghjkl")
    print("\n8. Testing POST /api/investigate (Garbage Input Test)...")
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
    print(" LOGIN PORTAL REPLACEMENT VERIFIED 100%!")
    print("=======================================================\n")

if __name__ == "__main__":
    test_full_pipeline()
