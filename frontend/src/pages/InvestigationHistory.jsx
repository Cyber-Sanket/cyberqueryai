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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Audit Trail & Investigation History</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
              {history.length} Saved Records
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit log recording analyst prompts, generated query DSL, safety gate checks, and execution results.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500">Loading audit history logs...</p>
        </div>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold font-sans">Analyst</th>
                  <th className="px-4 py-3 font-semibold font-sans">Investigation Question</th>
                  <th className="px-4 py-3 font-semibold">Risk Level</th>
                  <th className="px-4 py-3 font-semibold">MITRE Technique</th>
                  <th className="px-4 py-3 font-semibold text-right">Rows</th>
                  <th className="px-4 py-3 font-semibold text-right">Timestamp</th>
                  <th className="px-4 py-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-indigo-600">{inv.id}</td>
                    <td className="px-4 py-3 font-sans font-semibold text-slate-700">Analyst</td>
                    <td className="px-4 py-3 font-sans font-semibold text-slate-900 max-w-md truncate">
                      {inv.question}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.risk_level === 'HIGH' || inv.risk_level === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : inv.risk_level === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {inv.risk_level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-semibold">{inv.mitre_technique || 'N/A'}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">{inv.result_count}</td>
                    <td className="px-4 py-3 text-right text-slate-400 text-[11px]">{inv.created_at}</td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        to={`/history/${inv.id}`}
                        className="inline-flex items-center space-x-1 text-xs text-indigo-600 font-semibold hover:underline"
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
