import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Search, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  FileText, 
  Code2, 
  Zap, 
  Lock,
  HelpCircle,
  Database,
  MinusCircle
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { api } from '../services/api';

export const Investigate = () => {
  const location = useLocation();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [investigation, setInvestigation] = useState(null);

  useEffect(() => {
    if (location.state?.prefillPrompt) {
      setQuestion(location.state.prefillPrompt);
      handleInvestigate(location.state.prefillPrompt);
    }
  }, [location.state]);

  const presets = [
    {
      title: "1. Brute Force (T1110)",
      query: "Find users with more than 5 failed login attempts from the same IP followed by a successful login."
    },
    {
      title: "2. Suspicious PowerShell (T1059.001)",
      query: "Find suspicious PowerShell executions with encoded command parameters."
    },
    {
      title: "3. Port Scanning (T1046)",
      query: "Find IP addresses connecting to many ports in a short period."
    },
    {
      title: "4. Suspicious DNS (T1071.004)",
      query: "Find hosts making unusual DNS requests to external domains."
    },
    {
      title: "5. Impossible Travel (T1078)",
      query: "Find users logging in from different locations within a very short time."
    },
    {
      title: "⚠️ Test Invalid Prompt (Gate 1)",
      query: "dfhj"
    },
    {
      title: "⚠️ Test Unsafe Scope (Gate 2)",
      query: "Find failed logins search all logs unconditionally without time range"
    }
  ];

  const handleInvestigate = async (textToRun = question) => {
    const q = textToRun || question;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const data = await api.createInvestigation(q, '24h');
      setInvestigation(data);
    } catch (err) {
      console.error('Investigation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Title Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>AI Investigation Workbench</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              Two-Gate Safety Active
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Investigate SIEM telemetry using natural language. Enforces Gate 1 (Intent) and Gate 2 (Query Safety) before execution.
          </p>
        </div>
      </div>

      {/* Input Box & Search Card */}
      <GlassCard className="space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Natural Language Security Prompt</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvestigate()}
              placeholder="Ask a security question (e.g. Find repeated failed login attempts from same IP)..."
              className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-3 text-xs text-slate-900 outline-none transition-all font-mono"
            />
          </div>

          <button
            disabled={loading}
            onClick={() => handleInvestigate()}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Evaluating Pipeline...</span>
              </span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Run AI Investigation</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Scenario Presets */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Quick Scenario Presets & Safety Gate Test Buttons:
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuestion(p.query);
                  handleInvestigate(p.query);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono transition-all cursor-pointer border border-slate-200/80"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Investigation Results Display */}
      {investigation && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* Two-Gate Safety Pipeline Visualizer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Gate 1 Pipeline Card */}
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
              investigation.gate1_intent_valid
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {investigation.gate1_intent_valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>Gate 1: Intent Validation Gate</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                  investigation.gate1_intent_valid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {investigation.gate1_intent_valid ? 'PASSED ✅' : 'BLOCKED 🔒'}
                </span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">
                {investigation.gate1_intent_valid
                  ? 'Prompt validated as an authorized security investigation scenario.'
                  : `Halted: ${investigation.error}`}
              </p>
            </div>

            {/* Gate 2 Pipeline Card */}
            <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
              investigation.status === 'INTENT_BLOCKED'
                ? 'bg-slate-100 border-slate-200 text-slate-400'
                : investigation.gate2_query_valid
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/70 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  {investigation.status === 'INTENT_BLOCKED' ? (
                    <MinusCircle className="w-4 h-4 text-slate-400" />
                  ) : investigation.gate2_query_valid ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>Gate 2: Query Safety Gate</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                  investigation.status === 'INTENT_BLOCKED'
                    ? 'bg-slate-200 text-slate-600'
                    : investigation.gate2_query_valid
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {investigation.status === 'INTENT_BLOCKED'
                    ? 'NOT REACHED'
                    : investigation.gate2_query_valid
                    ? 'PASSED ✅'
                    : 'BLOCKED 🔒'}
                </span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed">
                {investigation.status === 'INTENT_BLOCKED'
                  ? 'Query generation blocked before reaching Gate 2.'
                  : investigation.gate2_query_valid
                  ? 'SQL query passed schema whitelist, read-only check & max time range cap.'
                  : `Halted: ${investigation.error}`}
              </p>
            </div>

          </div>

          {/* Generated SQL & Query Explanation */}
          <GlassCard className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Deterministic Query Builder Output</h3>
              </div>
              <span className="text-xs font-mono text-slate-500">SIEM Adapter</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800">
              {investigation.query}
            </div>

            {investigation.query_explanation && (
              <div className="space-y-1 text-xs text-slate-600 font-mono pt-1">
                {investigation.query_explanation.map((step, idx) => (
                  <div key={idx}>{step}</div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Threat Analysis & Evidence Results */}
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Threat Analysis & MITRE ATT&CK Findings</h3>
              </div>

              <div className="flex items-center space-x-2 font-mono text-xs">
                <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                  investigation.risk_level === 'HIGH' || investigation.risk_level === 'CRITICAL'
                    ? 'bg-rose-100 text-rose-800'
                    : investigation.risk_level === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  Risk: {investigation.risk_level} ({investigation.risk_score}/100)
                </span>
                {investigation.mitre_technique && (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                    MITRE: {investigation.mitre_technique}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {investigation.threat_explanation}
            </p>

            {/* Ingested Telemetry Matching Events Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Matching SIEM Events ({investigation.results_count} Rows Returned)</span>
                <span className="font-mono text-[11px] text-slate-400">Execution Time: {investigation.execution_time_ms}ms</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2">Username / Host</th>
                      <th className="px-3 py-2">Source IP</th>
                      <th className="px-3 py-2">Event Action</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {investigation.results.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 font-bold text-slate-900">
                          {row.username || row.hostname || 'N/A'}
                        </td>
                        <td className="px-3 py-2 text-indigo-600">{row.source_ip || row.domain || 'N/A'}</td>
                        <td className="px-3 py-2 text-slate-500">{row.action || row.event_type || 'N/A'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.status === 'failed' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {row.status || 'N/A'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-slate-400 text-[11px]">{row.timestamp || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </GlassCard>

        </div>
      )}

    </div>
  );
};
