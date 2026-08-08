import urllib.request
import urllib.error
import json

def test_api():
    print("Testing CyberQuery AI + Monitored Assets (HexNova) Pipeline...")

    # 1. Health Check
    with urllib.request.urlopen("http://localhost:8000/") as res:
        data = json.loads(res.read().decode())
        print("[OK] Health Check:", data)

    # 2. Monitored Assets Endpoint (GET /api/assets)
    with urllib.request.urlopen("http://localhost:8000/api/assets") as res:
        assets = json.loads(res.read().decode())
        print(f"[OK] Monitored Assets (GET /api/assets): Count={len(assets)}, Name={assets[0]['name']}, Domain={assets[0]['domain']}")
        assert len(assets) > 0
        assert assets[0]['domain'] == 'hexnova.space'

    # 3. Asset Details Endpoint (GET /api/assets/asset-1)
    with urllib.request.urlopen("http://localhost:8000/api/assets/asset-1") as res:
        asset_details = json.loads(res.read().decode())
        print(f"[OK] Asset Details (GET /api/assets/asset-1): Domain={asset_details['domain']}, Stats={asset_details['stats']}")
        assert asset_details['domain'] == 'hexnova.space'

    # 4. Asset Events Endpoint (GET /api/assets/asset-1/events)
    with urllib.request.urlopen("http://localhost:8000/api/assets/asset-1/events") as res:
        events = json.loads(res.read().decode())
        print(f"[OK] Asset Events (GET /api/assets/asset-1/events): Count={len(events)}")
        assert isinstance(events, list)

    # 5. Asset Alerts Endpoint (GET /api/assets/asset-1/alerts)
    with urllib.request.urlopen("http://localhost:8000/api/assets/asset-1/alerts") as res:
        alerts = json.loads(res.read().decode())
        print(f"[OK] Asset Alerts (GET /api/assets/asset-1/alerts): Count={len(alerts)}")
        assert isinstance(alerts, list)

    # 6. Dashboard Summary Filtered Endpoint (GET /api/dashboard/summary?asset=hexnova.space)
    with urllib.request.urlopen("http://localhost:8000/api/dashboard/summary?asset=hexnova.space") as res:
        summary = json.loads(res.read().decode())
        print(f"[OK] Dashboard Summary Filtered (GET /api/dashboard/summary?asset=hexnova.space): Filter={summary['active_asset_filter']}, Events={summary['total_events']}")
        assert summary['active_asset_filter'] == 'hexnova.space'

    # 7. Ingest Single Security Event from HexNova (POST /api/security-events)
    event_payload = json.dumps({
        "timestamp": "2026-08-08T14:30:00Z",
        "source": "hexnova",
        "event_type": "authentication",
        "action": "login",
        "status": "failed",
        "username": "demo_user",
        "source_ip": "192.168.1.10",
        "hostname": "hexnova-app"
    }).encode('utf-8')

    req = urllib.request.Request(
        "http://localhost:8000/api/security-events",
        data=event_payload,
        headers={'Content-Type': 'application/json', 'X-API-Key': 'hexnova-sec-key-2026'}
    )
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode())
        print(f"[OK] Ingest Event (POST /api/security-events): Status={data['status']}, EventID={data['event_id']}")
        assert data['status'] == 'INGESTED'

    # 8. Gate 1 Intent Gate Test for Garbage Input ("dfhj")
    req_data = json.dumps({"question": "dfhj", "time_range": "24h"}).encode('utf-8')
    req = urllib.request.Request("http://localhost:8000/api/investigations", data=req_data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as res:
        inv = json.loads(res.read().decode())
        print(f"[OK] Gate 1 Test ('dfhj'): Status={inv['status']}, Gate1_Valid={inv['gate1_intent_valid']}, Rows={inv['results_count']}")
        assert inv['status'] == 'INTENT_BLOCKED'

    # 9. Execute AI Investigation
    query_prompt = "Find users with more than 5 failed login attempts from the same IP followed by a successful login."
    req_data = json.dumps({"question": query_prompt, "time_range": "24h"}).encode('utf-8')
    req = urllib.request.Request("http://localhost:8000/api/investigations", data=req_data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as res:
        inv = json.loads(res.read().decode())
        print(f"[OK] AI Investigation ('{query_prompt[:35]}...'): Status={inv['status']}, Risk={inv['risk_level']}, MITRE={inv['mitre_technique']}, Rows={inv['results_count']}")
        assert inv['status'] == 'VALIDATED'

    print("\nALL MONITORED ASSET INTEGRATION TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_api()
