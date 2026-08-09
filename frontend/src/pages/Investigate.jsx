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
  Database,
  MinusCircle,
  ArrowRight
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
      label: "Find users with more than 5 failed login attempts",
      query: "Find users with more than 5 failed login attempts"
    },
    {
      label: "Find suspicious PowerShell executions",
      query: "Find suspicious PowerShell executions"
    },
    {
      label: "Find IP addresses connecting to many ports",
      query: "Find IP addresses connecting to many ports"
    },
    {
      label: "Find unusual DNS requests",
      query: "Find unusual DNS requests"
    },
    {
      label: "Find impossible travel authentication logins",
      query: "Find users logging in from different locations within a short time"
    },
    {
      label: "⚠️ Test Gate 1 Block (Garbage Input)",
      query: "asdfghjkl"
    },
    {
      label: "⚠️ Test Gate 2 Block (Unsafe Query Scope)",
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
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>AI Security Investigation</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
              Two-Gate Architecture Active
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ask security questions in natural language.
          </p>
        </div>
      </div>

      {/* Main AI Input Workbench Card */}
      <GlassCard className="space-y-5">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">AI Natural Language Workbench</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvestigate()}
              placeholder="Ask a security investigation question..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-3 text-xs font-mono text-slate-900 outline-none transition-all shadow-2xs"
            />
          </div>

          <button
            disabled={loading}
            onClick={() => handleInvestigate()}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Evaluating Gates...</span>
              </span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>✨ Investigate</span>
              </>
            )}
          </button>
        </div>

        {/* Suggested Examples */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Example Security Questions & Safety Gate Scenarios:
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuestion(p.query);
                  handleInvestigate(p.query);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-mono transition-all cursor-pointer border border-slate-200/80 hover:border-slate-300"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Two-Gate Architecture Flow Visualizer Header */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Two-Gate Security Architecture Pipeline Flow
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
          
          {/* Step 1: Gate 1 */}
          <div className={`p-3 rounded-xl border flex flex-col justify-between ${
            !investigation
              ? 'bg-slate-50 border-slate-200 text-slate-500'
              : investigation.gate1_intent_valid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="font-bold text-[11px] uppercase tracking-wider">Gate 1</div>
            <div className="font-sans font-bold text-xs mt-1">Intent Validation</div>
            <div className="mt-2 font-semibold text-[10px]">
              {!investigation ? 'Ready' : investigation.gate1_intent_valid ? '✓ Passed' : '✕ Blocked'}
            </div>
          </div>

          {/* Step 2: Query Builder */}
          <div className={`p-3 rounded-xl border flex flex-col justify-between ${
            !investigation || !investigation.gate1_intent_valid
              ? 'bg-slate-50 border-slate-200 text-slate-400'
              : 'bg-indigo-50 border-indigo-200 text-indigo-900'
          }`}>
            <div className="font-bold text-[11px] uppercase tracking-wider">Adapter</div>
            <div className="font-sans font-bold text-xs mt-1">Query Builder</div>
            <div className="mt-2 font-semibold text-[10px]">
              {!investigation || !investigation.gate1_intent_valid ? 'Idle' : '✓ Generated'}
            </div>
          </div>

          {/* Step 3: Gate 2 */}
          <div className={`p-3 rounded-xl border flex flex-col justify-between ${
            !investigation || investigation.status === 'INTENT_BLOCKED'
              ? 'bg-slate-50 border-slate-200 text-slate-400'
              : investigation.gate2_query_valid
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="font-bold text-[11px] uppercase tracking-wider">Gate 2</div>
            <div className="font-sans font-bold text-xs mt-1">Query Safety Validation</div>
            <div className="mt-2 font-semibold text-[10px]">
              {!investigation || investigation.status === 'INTENT_BLOCKED'
                ? 'Idle'
                : investigation.gate2_query_valid
                ? '✓ Passed'
                : '✕ Blocked'}
            </div>
          </div>

          {/* Step 4: SIEM Execution */}
          <div className={`p-3 rounded-xl border flex flex-col justify-between ${
            !investigation || !investigation.gate2_query_valid
              ? 'bg-slate-50 border-slate-200 text-slate-400'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="font-bold text-[11px] uppercase tracking-wider">Execution</div>
            <div className="font-sans font-bold text-xs mt-1">SIEM Execution</div>
            <div className="mt-2 font-semibold text-[10px]">
              {!investigation || !investigation.gate2_query_valid ? 'Idle' : '✓ Executed'}
            </div>
          </div>

        </div>
      </div>

      {/* Investigation Results Display */}
      {investigation && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* Generated Query Container */}
          <GlassCard className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Generated Query</h3>
              </div>
              <div className="flex items-center space-x-3 text-xs font-mono text-slate-500">
                <span>Execution Status: <strong className="text-slate-800">{investigation.status}</strong></span>
                <span>Time: <strong className="text-slate-800">{investigation.execution_time_ms}ms</strong></span>
              </div>
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

          {/* Threat Findings & SIEM Matching Rows */}
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Investigation Result & Threat Assessment</h3>
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

            {/* Matching SIEM Events Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span>Matching SIEM Events ({investigation.results_count} Rows Returned)</span>
                <span className="font-mono text-[11px] text-slate-400">Target: Login Portal</span>
              </div>

              {investigation.results_count === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  No matching threat indicators found.
                </div>
              ) : (
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
              )}
            </div>

          </GlassCard>

        </div>
      )}

    </div>
  );
};
