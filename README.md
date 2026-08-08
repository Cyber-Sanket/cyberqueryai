# 🛡️ CyberQuery AI + HexNova Integration

> **CyberQuery AI is an AI-powered SOC investigation platform integrated with `hexnova.space` as its monitored target application. Security telemetry is ingested live via `POST /api/security-events`, evaluated through a Two-Gate Governance & Safety Architecture, and investigated using plain natural-language queries inside the SOC dashboard.**

---

## 🌐 1. Architecture Overview

```text
             ┌────────────────────────┐
             │       KALI LINUX       │
             │ Authorized Test Source │
             └────────────┬───────────┘
                          │
                          ▼
             ┌────────────────────────┐
             │      HEXNOVA.SPACE     │
             │     Target Website     │
             └────────────┬───────────┘
                          │ Security Events (POST /api/security-events)
                          ▼
             ┌────────────────────────┐
             │    CYBERQUERY API      │
             │       FastAPI          │
             └────────────┬───────────┘
                          │
                          ▼
             ┌────────────────────────┐
             │     Security Log DB    │
             └────────────┬───────────┘
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
      ┌───────────────┐        ┌────────────────┐
      │ SOC Dashboard │        │ AI Investigation│
      └───────────────┘        └───────┬────────┘
                                       │
                               Intent Validation (Gate 1)
                                       │
                               Query Builder
                                       │
                               Safety Gate (Gate 2)
                                       │
                                       ▼
                                  Log Search
                                       │
                                       ▼
                              Threat Analysis
                                       │
                         ┌─────────────┼─────────────┐
                         ▼             ▼             ▼
                       Risk          MITRE        Evidence
                         │             │             │
                         └─────────────┼─────────────┘
                                       ▼
                               SOC Dashboard
```

---

## 📡 2. Security Event Ingestion API

CyberQuery exposes an authenticated telemetry endpoint for target application events:

- `POST /api/security-events`
  - Header: `X-API-Key: hexnova-sec-key-2026`
  - Body:
    ```json
    {
      "timestamp": "2026-08-08T14:30:00Z",
      "source": "hexnova",
      "event_type": "authentication",
      "action": "login",
      "status": "failed",
      "username": "demo_admin",
      "source_ip": "192.168.56.101",
      "destination_ip": "10.0.0.5",
      "hostname": "hexnova-app"
    }
    ```

- `POST /api/security-events/demo-attack`
  - Hackathon Demo Trigger: Automatically generates 5 failed logins + 1 successful login for `demo_admin` from IP `192.168.56.101` on `hexnova.space` and triggers a High Risk Incident alert.

---

## 🚀 3. Hackathon Presentation Sequence

1. **Show HexNova Target App (`/app`)**:
   - Open [http://localhost:3000/app](http://localhost:3000/app). Explain: *"This is `hexnova.space`, the application being monitored by CyberQuery AI."*
2. **Execute Controlled Security Test**:
   - Click **"⚡ Run Controlled Brute-Force Test against hexnova.space"** on `/app`.
   - Fires 5 failed logins + 1 successful login for `demo_admin` from IP `192.168.56.101`.
3. **View Live Ingested Telemetry**:
   - Watch the live telemetry feed update instantly with new `hexnova.space` events.
4. **Switch to SOC Dashboard (`/`)**:
   - Notice the live **Security Activity** graph, **Total Events**, **Active Alerts**, and **Brute Force Alert** for `demo_admin`.
5. **Open AI Investigation (`/investigate`)**:
   - Type prompt: *"Find users with more than 5 failed login attempts from the same IP followed by a successful login."*
6. **Observe Two-Gate Safety Pipeline**:
   - **Gate 1 (Intent Gate)**: `PASSED ✅` (Valid SOC security investigation).
   - **Deterministic Query Builder**: Translates intent to Query DSL SQL.
   - **Gate 2 (Query Safety Gate)**: `PASSED ✅` (Read-only, max 24h range, allowed fields).
7. **View Evidence & MITRE Mapping**:
   - Displays Risk Score: **HIGH (85/100)**, MITRE Technique: **`T1110` (Brute Force)**, matching events from `demo_admin` (192.168.56.101).
8. **Demonstrate Governance & Controls (`/governance`)**:
   - Switch role to **SOC Admin** vs **SOC Analyst** (RBAC `403 Forbidden` enforcement).
   - Set Max Time Range to **1 hour**. Re-run a 24-hour query in `/investigate` → **Gate 2 Blocks Execution** with `0 SIEM queries executed`.

---

## 🛠️ 4. Quick Start

```bash
# Backend (FastAPI + SQLite Engine)
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend (Vite + React)
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000/app](http://localhost:3000/app) for HexNova Target App, and [http://localhost:3000](http://localhost:3000) for the SOC Dashboard!
