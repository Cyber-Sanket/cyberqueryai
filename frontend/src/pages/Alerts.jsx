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
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Active Security Alerts</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
              {alerts.length} Active Incidents
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time SIEM alerts mapped to MITRE ATT&CK techniques with soft severity indicators.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
            <button
              key={sev}
              onClick={() => setFilter(sev)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                filter === sev ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500">Loading active security alerts...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map(alert => (
            <GlassCard key={alert.id} hover className="space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                    alert.severity === 'CRITICAL' 
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : alert.severity === 'HIGH'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                      : alert.severity === 'MEDIUM' 
                      ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}>
                    ● {alert.severity}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{alert.title}</h3>
                </div>

                <div className="flex items-center space-x-2 font-mono text-xs text-slate-500">
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                    MITRE {alert.mitre_technique}
                  </span>
                  <span>{alert.created_at}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {alert.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-mono text-slate-500">
                <div className="flex items-center space-x-4">
                  <div>Asset: <strong className="text-slate-800 font-semibold">Login Portal</strong></div>
                  <div>Target User: <strong className="text-slate-800">{alert.target_user || 'demo_admin'}</strong></div>
                  <div>Source IP: <strong className="text-slate-800">{alert.source_ip || '127.0.0.1'}</strong></div>
                </div>

                <button
                  onClick={() => handleInvestigateAlert(alert)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
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
