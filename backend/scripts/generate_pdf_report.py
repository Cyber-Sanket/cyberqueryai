import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, KeepTogether
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (Pages 2+)
        if self._pageNumber > 1:
            self.drawString(54, 750, "CyberQuery AI — Project & Technical Architecture Report")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
        
        # Footer (All pages)
        self.setStrokeColor(colors.HexColor("#E2E8F0"))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        
        self.drawString(54, 30, "CONFIDENTIAL & PROPRIETARY — CYBERQUERY AI")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 30, page_str)
        self.restoreState()

def create_pdf_report(filename="CyberQuery_AI_Project_Report.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Custom Soft AI Color Palette
    PRIMARY = colors.HexColor("#4F46E5")     # Indigo 600
    DARK_TEXT = colors.HexColor("#0F172A")   # Slate 900
    MUTED_TEXT = colors.HexColor("#64748B")  # Slate 500
    BG_LIGHT = colors.HexColor("#F8FAFC")    # Slate 50
    BORDER_COLOR = colors.HexColor("#E2E8F0")# Slate 200
    SUCCESS_COLOR = colors.HexColor("#16A34A")# Emerald 600
    DANGER_COLOR = colors.HexColor("#DC2626") # Rose 600

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=MUTED_TEXT,
        spaceAfter=20
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=DARK_TEXT,
        spaceBefore=14,
        spaceAfter=8
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=PRIMARY,
        spaceBefore=10,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=DARK_TEXT,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=DARK_TEXT,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Code'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=6
    )

    story = []

    # Title Banner
    story.append(Paragraph("🛡️ CyberQuery AI", title_style))
    story.append(Paragraph("Enterprise SOC Investigation Assistant with Two-Gate Governance & Query Safety Architecture", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceBefore=0, spaceAfter=15))

    # Executive Summary
    story.append(Paragraph("1. Executive Summary", h1_style))
    exec_summary_text = (
        "<b>CyberQuery AI</b> is an enterprise-grade AI-powered Security Operations Center (SOC) investigation platform. "
        "It enables security analysts to query complex security telemetry using plain natural-language questions without needing "
        "to manually construct vendor-specific SIEM queries (SQL, KQL, SPL). The system operates on the core security rule that "
        "<b>LLMs never execute unvalidated code or queries directly</b> against production data stores. Instead, CyberQuery AI enforces a "
        "<b>Two-Gate Safety Architecture</b> and a real-time <b>Governance & Controls Layer</b> to guarantee that invalid, out-of-scope, "
        "or mutating queries are halted before reaching the database."
    )
    story.append(Paragraph(exec_summary_text, body_style))
    story.append(Spacer(1, 10))

    # Problem Statement & Solution Matrix Table
    story.append(Paragraph("Key Value Proposition", h2_style))
    matrix_data = [
        [Paragraph("<b>Problem Area</b>", body_style), Paragraph("<b>CyberQuery AI Technical Solution</b>", body_style)],
        [
            Paragraph("<b>3:00 AM SOC Bottleneck</b><br/>Analysts spend critical minutes writing complex SPL/KQL syntax during high-stress security incidents.", body_style),
            Paragraph("<b>Natural Language to Query DSL</b><br/>Translates plain English questions into structured Investigation Intent DSL in under 200ms.", body_style)
        ],
        [
            Paragraph("<b>AI Hallucination Hazard</b><br/>Direct LLM query execution can cause hallucinated fields, database exhaustion, or data loss.", body_style),
            Paragraph("<b>Two-Gate Safety Architecture</b><br/>Gate 1 validates intent; Gate 2 enforces schema whitelists, read-only permissions, and time caps.", body_style)
        ],
        [
            Paragraph("<b>Uncontrolled AI Access</b><br/>Lack of administrative boundaries over what AI can query.", body_style),
            Paragraph("<b>Governance & Controls Module</b><br/>SOC Admins configure maximum time ranges, result caps, allowed fields, and scenario permissions with RBAC.", body_style)
        ]
    ]

    t_matrix = Table(matrix_data, colWidths=[240, 264])
    t_matrix.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#EEF2FF")),
        ('TEXTCOLOR', (0, 0), (-1, 0), PRIMARY),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_matrix)
    story.append(Spacer(1, 15))

    # System Architecture
    story.append(Paragraph("2. Technical System Architecture", h1_style))
    story.append(Paragraph(
        "CyberQuery AI decouples intent parsing, query generation, safety validation, data access, and threat analysis into a robust pipeline:",
        body_style
    ))
    
    arch_flow = (
        "<b>Natural Language Question</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;│<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;▼<br/>"
        "<b>🔎 Gate 1: Intent Validation Gate</b> ──(Checks SOC intent & Governance scenario permissions)──► <i>[REJECT ➔ STOP]</i><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;│ (Pass)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;▼<br/>"
        "<b>Structured Query DSL</b> (brute_force, powershell_abuse, port_scan, dns_tunneling, impossible_travel)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;│<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;▼<br/>"
        "<b>Deterministic Query Builder</b> (DSL to Vendor SQL Adapter)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;│<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;▼<br/>"
        "<b>🛡️ Gate 2: Query Safety & Validation Gate</b> ──(Schema Whitelist + Time Range Cap + Read-Only Check)──► <i>[REJECT ➔ STOP]</i><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;│ (Pass)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;▼<br/>"
        "<b>Data Source Adapter Execution</b> (SQLite Simulated SIEM Engine / Enterprise Connector)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;│<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;▼<br/>"
        "<b>Evidence-Based Threat Engine</b> (Risk Score + MITRE ATT&CK Mapping + Confidence Metrics)<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;│<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;▼<br/>"
        "<b>Interactive Soft AI SOC Dashboard</b>"
    )
    story.append(Paragraph(arch_flow, code_style))
    story.append(Spacer(1, 15))

    # Two-Gate Safety & Governance
    story.append(Paragraph("3. Two-Gate Safety & Governance Enforcement", h1_style))
    
    story.append(Paragraph("Gate 1 — Intent Validation Gate", h2_style))
    story.append(Paragraph("Evaluates whether the user's natural language input represents a valid SOC security investigation and verifies that the scenario is enabled by SOC Admin in Governance policy.", body_style))
    story.append(Paragraph("• <b>Garbage Input ('dfhj')</b>: Caught at Gate 1. Status: <code>INTENT_BLOCKED</code>. Query Generation: BLOCKED 🔒. SIEM Database: 0 Queries Run.", bullet_style))
    story.append(Paragraph("• <b>Non-Security Questions ('What is the weather today?')</b>: Caught at Gate 1. Status: <code>INTENT_BLOCKED</code>.", bullet_style))
    story.append(Paragraph("• <b>Disabled Scenario</b>: If SOC Admin disables DNS Tunneling, DNS queries are blocked at Gate 1.", bullet_style))

    story.append(Spacer(1, 6))
    story.append(Paragraph("Gate 2 — Query Safety Gate", h2_style))
    story.append(Paragraph("Validates the generated SQL for schema whitelist compliance, read-only permissions, mandatory time range scopes, and maximum result limits.", body_style))
    story.append(Paragraph("• <b>Max Time Range Enforcement</b>: If Admin sets a 24-hour max limit, a requested 7-day query is blocked at Gate 2 with <i>'Governance Violation: Requested 7-day range exceeds Governance limit of 24 hours'</i>.", bullet_style))
    story.append(Paragraph("• <b>Read-Only Execution</b>: Blocks all DDL/mutation keywords (<code>DROP, DELETE, UPDATE, INSERT, ALTER, TRUNCATE, CREATE, GRANT, REVOKE</code>).", bullet_style))
    story.append(Paragraph("• <b>Schema Field Whitelist</b>: Only whitelisted fields (<code>timestamp, username, source_ip, process, etc.</code>) are allowed.", bullet_style))

    story.append(Spacer(1, 15))

    # Core Investigation Scenarios Table
    story.append(Paragraph("4. Core Investigation Scenarios & MITRE Mapping", h1_style))
    
    scenarios_data = [
        [Paragraph("<b>Scenario</b>", body_style), Paragraph("<b>MITRE Technique</b>", body_style), Paragraph("<b>Risk Level</b>", body_style), Paragraph("<b>Evidence & Detection Rule</b>", body_style)],
        [
            Paragraph("<b>1. Brute Force</b>", body_style),
            Paragraph("<code>T1110</code><br/>Brute Force", body_style),
            Paragraph("<font color='#DC2626'><b>HIGH (85/100)</b></font>", body_style),
            Paragraph("High Confidence: 17 failed authentication logins for <code>admin</code> from <code>192.168.1.44</code> followed by successful login.", body_style)
        ],
        [
            Paragraph("<b>2. Suspicious PowerShell</b>", body_style),
            Paragraph("<code>T1059.001</code><br/>PowerShell", body_style),
            Paragraph("<font color='#DC2626'><b>HIGH (90/100)</b></font>", body_style),
            Paragraph("High Confidence: <code>powershell.exe</code> spawned by Word macro (<code>winword.exe</code>) with Base64 payload & <code>DownloadString</code>.", body_style)
        ],
        [
            Paragraph("<b>3. Port Scanning</b>", body_style),
            Paragraph("<code>T1046</code><br/>Network Discovery", body_style),
            Paragraph("<font color='#D97706'><b>MEDIUM (65/100)</b></font>", body_style),
            Paragraph("Medium Confidence: Origin IP <code>192.168.1.105</code> connecting to 25 distinct destination ports within 2 minutes.", body_style)
        ],
        [
            Paragraph("<b>4. Suspicious DNS</b>", body_style),
            Paragraph("<code>T1071.004</code><br/>DNS Tunneling", body_style),
            Paragraph("<font color='#DC2626'><b>HIGH (80/100)</b></font>", body_style),
            Paragraph("Medium-High Confidence: Workstation <code>hr-laptop-12</code> issuing 35 high-entropy DNS queries to <code>exfil-data.c2-network.top</code>.", body_style)
        ],
        [
            Paragraph("<b>5. Impossible Travel</b>", body_style),
            Paragraph("<code>T1078</code><br/>Valid Accounts", body_style),
            Paragraph("<font color='#DC2626'><b>HIGH (85/100)</b></font>", body_style),
            Paragraph("High Confidence: User <code>sarah.connor</code> authenticating from USA, then 12 minutes later from Japan.", body_style)
        ]
    ]

    t_scenarios = Table(scenarios_data, colWidths=[100, 110, 94, 200])
    t_scenarios.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ('TEXTCOLOR', (0, 0), (-1, 0), DARK_TEXT),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_scenarios)
    story.append(Spacer(1, 15))

    # Governance & Controls Page & API Specifications
    story.append(Paragraph("5. Governance & Controls Module (/governance)", h1_style))
    story.append(Paragraph(
        "The Governance & Controls module is a real security-control layer with Role-Based Access Control (RBAC). "
        "It features live administrative configuration controls and persistent governance audit logging:",
        body_style
    ))
    
    story.append(Paragraph("• <b>Role-Based Access Control (RBAC)</b>: SOC Analysts operate in read-only policy view. Attempting to modify governance rules returns <code>403 Forbidden: SOC Admin permission required</code>.", bullet_style))
    story.append(Paragraph("• <b>REST API Endpoints</b>: <code>GET /api/governance</code>, <code>PUT /api/governance</code> (verifies <code>X-User-Role: admin</code>), <code>GET /api/governance/audit</code>.", bullet_style))
    story.append(Paragraph("• <b>Governance Audit History</b>: All policy edits are recorded in <code>GovernanceAuditModel</code> with <code>admin_id</code>, <code>setting_changed</code>, <code>old_value</code>, <code>new_value</code>, and <code>timestamp</code>.", bullet_style))

    story.append(Spacer(1, 15))

    # Test Suite Verification Results
    story.append(Paragraph("6. Automated Verification Test Suite", h1_style))
    
    test_results_data = [
        [Paragraph("<b>Test Case</b>", body_style), Paragraph("<b>Expected Behavior</b>", body_style), Paragraph("<b>Result Status</b>", body_style)],
        [
            Paragraph("Health Check Endpoint", body_style),
            Paragraph("Returns online status, connected SIEM adapter, and active Two-Gate mode.", body_style),
            Paragraph("<font color='#16A34A'><b>[OK] PASS</b></font>", body_style)
        ],
        [
            Paragraph("Garbage Input ('dfhj')", body_style),
            Paragraph("Halted at Gate 1. Status: INTENT_BLOCKED. 0 SQL queries run.", body_style),
            Paragraph("<font color='#16A34A'><b>[OK] PASS</b></font>", body_style)
        ],
        [
            Paragraph("General Non-Security ('weather')", body_style),
            Paragraph("Halted at Gate 1. Status: INTENT_BLOCKED. 0 SQL queries run.", body_style),
            Paragraph("<font color='#16A34A'><b>[OK] PASS</b></font>", body_style)
        ],
        [
            Paragraph("RBAC 403 Forbidden Test", body_style),
            Paragraph("Analyst PUT /api/governance fails with 403 Forbidden.", body_style),
            Paragraph("<font color='#16A34A'><b>[OK] PASS</b></font>", body_style)
        ],
        [
            Paragraph("Governance 24h Cap Enforcement", body_style),
            Paragraph("7-day query under 24h policy rejected at Gate 2 with 0 rows returned.", body_style),
            Paragraph("<font color='#16A34A'><b>[OK] PASS</b></font>", body_style)
        ],
        [
            Paragraph("Brute Force Query Execution", body_style),
            Paragraph("Passed Gate 1 and Gate 2. Returns live log evidence & MITRE T1110 mapping.", body_style),
            Paragraph("<font color='#16A34A'><b>[OK] PASS</b></font>", body_style)
        ]
    ]

    t_tests = Table(test_results_data, colWidths=[150, 254, 100])
    t_tests.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ('TEXTCOLOR', (0, 0), (-1, 0), DARK_TEXT),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t_tests)
    story.append(Spacer(1, 20))

    # Sign-off Footer Card
    sign_data = [
        [
            Paragraph("<b>CyberQuery AI System Verification:</b> 100% Fully Verified & Operational<br/>"
                      "<b>Frontend Web App:</b> http://localhost:3000 | <b>FastAPI Engine:</b> http://localhost:8000", body_style)
        ]
    ]
    t_sign = Table(sign_data, colWidths=[504])
    t_sign.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EEF2FF")),
        ('BOX', (0, 0), (-1, -1), 1, PRIMARY),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(t_sign)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF Report generated successfully: {filename}")

if __name__ == "__main__":
    out = "CyberQuery_AI_Project_Report.pdf"
    if len(sys.argv) > 1:
        out = sys.argv[1]
    create_pdf_report(out)
