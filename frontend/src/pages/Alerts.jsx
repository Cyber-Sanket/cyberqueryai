import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, CheckCircle, Search, Filter, Shield, ArrowRight } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { api } from '../services/api';

export const Alerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await api.getAlerts();
        setAlerts(data);
      } catch (err) {
        console.error('Failed to load alerts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const handleInvestigateAlert = (alert) => {
    const prompt = `Investigate suspicious ${alert.title} for user '${alert.target_user || 'demo_admin'}' on asset 'login-portal' from IP ${alert.source_ip || '127.0.0.1'}`;
    navigate('/investigate', { state: { prefillPrompt: prompt } });
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'ALL') return true;
    return a.severity === filter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-[#151E2E] p-6 rounded-2xl border border-[#243047] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2 font-mono-soc">
            <span>ACTIVE SECURITY ALERTS</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/80 font-bold">
              {alerts.length} ACTIVE INCIDENTS
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time SIEM alerts mapped to MITRE ATT&CK techniques with severity classification.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#0B1120] p-1 rounded-xl border border-[#243047] text-xs font-mono-soc">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filter === sev ? 'bg-[#1E1B4B] text-indigo-300 border border-indigo-700/60' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3 font-mono-soc">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Loading active security alerts...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map(alert => (
            <GlassCard key={alert.id} hover className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-0.5 rounded-full text-xs font-bold font-mono-soc ${
                    alert.severity === 'CRITICAL' || alert.severity === 'HIGH'
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
                      : alert.severity === 'MEDIUM'
                      ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
                      : 'bg-sky-950/80 text-sky-400 border border-sky-800/80'
                  }`}>
                    ● {alert.severity}
                  </span>
                  <h3 className="text-base font-bold text-slate-100">{alert.title}</h3>
                </div>

                <div className="flex items-center space-x-2 font-mono-soc text-xs text-slate-400">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 font-bold">
                    MITRE {alert.mitre_technique}
                  </span>
                  <span>{alert.created_at}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-[#0B1120] p-3 rounded-xl border border-[#243047]">
                {alert.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-[#243047] text-xs font-mono-soc text-slate-400">
                <div className="flex items-center space-x-4">
                  <div>Asset: <strong className="text-slate-100 font-semibold">Login Portal</strong></div>
                  <div>User: <strong className="text-slate-200">{alert.target_user || 'demo_admin'}</strong></div>
                  <div>Source: <strong className="text-sky-400">{alert.source_ip || '127.0.0.1'}</strong></div>
                </div>

                <button
                  onClick={() => handleInvestigateAlert(alert)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-md"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Investigate →</span>
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
};
