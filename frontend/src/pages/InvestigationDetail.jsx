import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, Code2, Database, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { api } from '../services/api';

export const InvestigationDetail = () => {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await api.getInvestigationById(id);
        setDetail(data);
      } catch (err) {
        console.error('Failed to load investigation detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500">Loading audit record detail...</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-sm font-semibold text-rose-600">Investigation record not found.</p>
        <Link to="/history" className="text-xs text-indigo-600 hover:underline">Return to History</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link to="/history" className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-600 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Audit History</span>
        </Link>
        <span className="text-xs font-mono text-slate-400">ID: {detail.id}</span>
      </div>

      <GlassCard className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-900">{detail.question}</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            detail.risk_level === 'HIGH' || detail.risk_level === 'CRITICAL' 
              ? 'bg-rose-100 text-rose-800' 
              : 'bg-emerald-100 text-emerald-800'
          }`}>
            {detail.risk_level} RISK ({detail.risk_score}/100)
          </span>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Executed Query DSL:</div>
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-indigo-300">
            <pre>{detail.query}</pre>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Threat Finding Summary:</div>
          <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/80 leading-relaxed font-medium">
            {detail.threat_explanation}
          </p>
        </div>
      </GlassCard>
    </div>
  );
};
