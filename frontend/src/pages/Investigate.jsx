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
      <div className="bg-[#151E2E] p-6 rounded-2xl border border-[#243047] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2 font-mono-soc">
            <span>AI SECURITY INVESTIGATION</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 font-bold">
              TWO-GATE PIPELINE ACTIVE
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ask security questions in natural language.
          </p>
        </div>
      </div>

      {/* Main AI Input Workbench Card */}
      <GlassCard className="space-y-5">
        <div className="flex items-center space-x-2 border-b border-[#243047] pb-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono-soc">AI Natural Language Workbench</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-4 top-3.5 text-indigo-400 font-mono-soc font-bold text-xs">&gt;</span>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvestigate()}
              placeholder="Find users with more than 5 failed login attempts..."
              className="w-full bg-[#0B1120] border border-[#243047] focus:border-indigo-500 focus:bg-[#0F172A] rounded-xl pl-8 pr-4 py-3 text-xs font-mono-soc text-slate-100 outline-none transition-all shadow-inner"
            />
          </div>

          <button
            disabled={loading}
            onClick={() => handleInvestigate()}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer font-mono-soc"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>EVALUATING PIPELINE...</span>
              </span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>RUN INVESTIGATION</span>
              </>
            )}
          </button>
        </div>

        {/* Suggested Examples */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono-soc">
            EXEMPLAR INVESTIGATION PROMPTS:
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuestion(p.query);
                  handleInvestigate(p.query);
                }}
                className="px-3 py-1.5 rounded-xl bg-[#0B1120] hover:bg-[#182235] text-slate-300 text-xs font-mono-soc transition-all cursor-pointer border border-[#243047] hover:border-indigo-500/50"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Two-Gate Security Architecture Pipeline Visualizer */}
      <div className="p-5 rounded-2xl bg-[#151E2E] border border-[#243047] shadow-md space-y-4">
        <div className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono-soc">
          TWO-GATE SAFETY PIPELINE EXECUTION FLOW
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono-soc">
          
          {/* Step 1: Gate 1 */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            !investigation
              ? 'bg-[#0B1120] border-[#243047] text-slate-400'
              : investigation.gate1_intent_valid
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}>
            <div className="font-bold text-[10px] uppercase tracking-wider">GATE 1</div>
            <div className="font-sans font-bold text-xs mt-1">Intent Validation</div>
            <div className="mt-2 font-semibold text-[11px] font-mono-soc">
              {!investigation ? 'IDLE' : investigation.gate1_intent_valid ? '✓ PASSED' : '✕ BLOCKED'}
            </div>
          </div>

          {/* Step 2: Query Builder */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            !investigation || !investigation.gate1_intent_valid
              ? 'bg-[#0B1120] border-[#243047] text-slate-500'
              : 'bg-indigo-950/40 border-indigo-800/60 text-indigo-300'
          }`}>
            <div className="font-bold text-[10px] uppercase tracking-wider">ADAPTER</div>
            <div className="font-sans font-bold text-xs mt-1">Query Builder</div>
            <div className="mt-2 font-semibold text-[11px] font-mono-soc">
              {!investigation || !investigation.gate1_intent_valid ? 'IDLE' : '✓ GENERATED'}
            </div>
          </div>

          {/* Step 3: Gate 2 */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            !investigation || investigation.status === 'INTENT_BLOCKED'
              ? 'bg-[#0B1120] border-[#243047] text-slate-500'
              : investigation.gate2_query_valid
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}>
            <div className="font-bold text-[10px] uppercase tracking-wider">GATE 2</div>
            <div className="font-sans font-bold text-xs mt-1">Query Safety Validation</div>
            <div className="mt-2 font-semibold text-[11px] font-mono-soc">
              {!investigation || investigation.status === 'INTENT_BLOCKED'
                ? 'IDLE'
                : investigation.gate2_query_valid
                ? '✓ PASSED'
                : '✕ BLOCKED'}
            </div>
          </div>

          {/* Step 4: SIEM Execution */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            !investigation || !investigation.gate2_query_valid
              ? 'bg-[#0B1120] border-[#243047] text-slate-500'
              : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
          }`}>
            <div className="font-bold text-[10px] uppercase tracking-wider">EXECUTION</div>
            <div className="font-sans font-bold text-xs mt-1">SIEM Execution</div>
            <div className="mt-2 font-semibold text-[11px] font-mono-soc">
              {!investigation || !investigation.gate2_query_valid ? 'IDLE' : '✓ EXECUTED'}
            </div>
          </div>

        </div>
      </div>

      {/* Investigation Results Display */}
      {investigation && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* Generated Query Container */}
          <GlassCard className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#243047] pb-3">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono-soc">GENERATED SIEM QUERY</h3>
              </div>
              <div className="flex items-center space-x-3 text-xs font-mono-soc text-slate-400">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-bold">
                  ✓ QUERY VALIDATED
                </span>
                <span>EXECUTION TIME: <strong className="text-slate-200">{investigation.execution_time_ms} ms</strong></span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#090D16] text-indigo-300 font-mono-soc text-xs overflow-x-auto border border-[#243047] shadow-inner leading-relaxed">
              {investigation.query}
            </div>

            {investigation.query_explanation && (
              <div className="space-y-1 text-xs text-slate-400 font-mono-soc pt-1">
                {investigation.query_explanation.map((step, idx) => (
                  <div key={idx}>{step}</div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Threat Findings & SIEM Matching Rows */}
          <GlassCard className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#243047] pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono-soc">THREAT FINDINGS & ANALYSIS</h3>
              </div>

              <div className="flex items-center space-x-2 font-mono-soc text-xs">
                <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                  investigation.risk_level === 'HIGH' || investigation.risk_level === 'CRITICAL'
                    ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
                    : investigation.risk_level === 'MEDIUM'
                    ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
                    : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                }`}>
                  RISK: {investigation.risk_level} ({investigation.risk_score}/100)
                </span>
                {investigation.mitre_technique && (
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 font-bold">
                    MITRE: {investigation.mitre_technique}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium bg-[#0B1120] p-3.5 rounded-xl border border-[#243047]">
              {investigation.threat_explanation}
            </p>

            {/* Matching SIEM Events Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-100 font-mono-soc">
                <span>MATCHING SIEM EVENTS ({investigation.results_count} ROWS RETURNED)</span>
                <span className="text-[11px] text-slate-400">Target: Login Portal</span>
              </div>

              {investigation.results_count === 0 ? (
                <div className="p-8 text-center bg-[#0B1120] rounded-xl border border-[#243047] text-xs text-slate-400 font-mono-soc">
                  No matching threat indicators found.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#243047] bg-[#0B1120]">
                  <table className="w-full text-left text-xs font-mono-soc">
                    <thead className="bg-[#151E2E] text-slate-400 border-b border-[#243047] uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2">USERNAME / HOST</th>
                        <th className="px-3 py-2">SOURCE IP</th>
                        <th className="px-3 py-2">EVENT ACTION</th>
                        <th className="px-3 py-2">STATUS</th>
                        <th className="px-3 py-2 text-right">TIMESTAMP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#243047] text-slate-200">
                      {investigation.results.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[#151E2E]">
                          <td className="px-3 py-2 font-bold text-slate-100">
                            {row.username || row.hostname || 'N/A'}
                          </td>
                          <td className="px-3 py-2 text-sky-400">{row.source_ip || row.domain || 'N/A'}</td>
                          <td className="px-3 py-2 text-slate-400">{row.action || row.event_type || 'N/A'}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.status === 'failed' ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                            }`}>
                              {row.status?.toUpperCase() || 'N/A'}
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
