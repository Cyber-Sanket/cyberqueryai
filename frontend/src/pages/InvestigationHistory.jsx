import React, { useEffect, useState } from 'react';
import { History, Search, ArrowRight, ShieldCheck, Clock, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';
import { api } from '../services/api';

export const InvestigationHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await api.getInvestigations();
        setHistory(data);
      } catch (err) {
        console.error('Failed to load investigation history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#151E2E] p-6 rounded-2xl border border-[#243047] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2 font-mono-soc">
            <span>AUDIT TRAIL & INVESTIGATION HISTORY</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 font-bold">
              {history.length} RECORDS LOGGED
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete audit log recording analyst prompts, generated query DSL, safety gate checks, and execution results.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3 font-mono-soc">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Loading audit history logs...</p>
        </div>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-soc">
              <thead className="bg-[#0B1120] text-slate-400 border-b border-[#243047] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold font-sans">ANALYST</th>
                  <th className="px-4 py-3 font-semibold font-sans">INVESTIGATION QUESTION</th>
                  <th className="px-4 py-3 font-semibold">GATE 1</th>
                  <th className="px-4 py-3 font-semibold">GATE 2</th>
                  <th className="px-4 py-3 font-semibold">RISK LEVEL</th>
                  <th className="px-4 py-3 font-semibold text-right">ROWS</th>
                  <th className="px-4 py-3 font-semibold text-right">TIME</th>
                  <th className="px-4 py-3 font-semibold text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243047] text-slate-200">
                {history.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#182235] transition-colors">
                    <td className="px-4 py-3 font-bold text-indigo-400">{inv.id}</td>
                    <td className="px-4 py-3 font-sans font-semibold text-slate-300">Analyst</td>
                    <td className="px-4 py-3 font-sans font-semibold text-slate-100 max-w-md truncate">
                      {inv.question}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.gate1_intent_valid ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80' : 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
                      }`}>
                        {inv.gate1_intent_valid ? '✓ PASSED' : '✕ BLOCKED'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.gate2_query_valid ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80' : 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
                      }`}>
                        {inv.gate2_query_valid ? '✓ PASSED' : '✕ BLOCKED'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.risk_level === 'HIGH' || inv.risk_level === 'CRITICAL'
                          ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
                          : inv.risk_level === 'MEDIUM'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
                          : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                      }`}>
                        {inv.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-100">{inv.result_count}</td>
                    <td className="px-4 py-3 text-right text-slate-400 text-[11px]">{inv.created_at}</td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        to={`/history/${inv.id}`}
                        className="inline-flex items-center space-x-1 text-xs text-sky-400 font-semibold hover:underline font-mono-soc"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
