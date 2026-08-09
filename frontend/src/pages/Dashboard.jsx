import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Search, 
  AlertOctagon, 
  CheckCircle2, 
  Users, 
  Globe, 
  ArrowUpRight, 
  Clock,
  Sparkles,
  Filter,
  X,
  Eye,
  Server,
  Lock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';
import { api } from '../services/api';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState('all'); // 'all' or 'login-portal'
  const [loading, setLoading] = useState(true);
  
  // Monitored Asset Activity Drawer / Modal State
  const [activeAssetModal, setActiveAssetModal] = useState(null); // asset object or null
  const [assetActivityData, setAssetActivityData] = useState(null);
  const [assetEventsList, setAssetEventsList] = useState([]);

  useEffect(() => {
    fetchDashboardData(selectedAsset);
    fetchAssets();
  }, [selectedAsset]);

  const fetchDashboardData = async (assetFilter) => {
    setLoading(true);
    try {
      const data = await api.getDashboardSummary(assetFilter);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const data = await api.getAssets();
      setAssets(data);
    } catch (err) {
      console.error('Failed to load assets:', err);
    }
  };

  const handleOpenAssetActivity = async (asset) => {
    setActiveAssetModal(asset);
    try {
      const details = await api.getAssetById(asset.id || asset.asset_id || 'login-portal');
      const events = await api.getAssetEvents(asset.id || asset.asset_id || 'login-portal', 10);
      setAssetActivityData(details);
      setAssetEventsList(events);
    } catch (err) {
      console.error('Failed to load asset activity:', err);
    }
  };

  const handleInvestigateAlert = (alert) => {
    const prompt = `Investigate suspicious ${alert.title} for user '${alert.target_user || 'demo_admin'}' on asset 'login-portal' from IP ${alert.source_ip || '127.0.0.1'}`;
    navigate('/investigate', { state: { prefillPrompt: prompt } });
  };

  if (loading && !summary) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm font-medium text-slate-500">Loading SOC Telemetry Overview...</p>
      </div>
    );
  }

  const loginPortalAsset = assets.find(a => a.id === 'login-portal' || a.asset_id === 'login-portal') || {
    id: 'login-portal',
    asset_id: 'login-portal',
    name: 'Login Portal',
    domain: 'login-portal',
    type: 'web_application',
    status: 'monitoring',
    total_events: summary?.total_events || 0,
    total_alerts: summary?.total_alerts || 0,
    risk_level: summary?.high_risk_alerts > 0 ? 'High' : 'Low'
  };

  const statCards = [
    {
      title: 'Total Telemetry Events',
      value: (summary?.total_events || 0).toLocaleString(),
      change: 'Calculated from DB',
      icon: Activity,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Active Security Alerts',
      value: summary?.total_alerts || 0,
      change: 'Mapped to MITRE ATT&CK',
      icon: AlertOctagon,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100',
    },
    {
      title: 'High Risk Incidents',
      value: summary?.high_risk_alerts || 0,
      change: 'Requires Analyst Action',
      icon: ShieldAlert,
      color: 'text-rose-600',
      bg: 'bg-rose-50 border-rose-100',
    },
    {
      title: 'Monitored Assets',
      value: summary?.total_assets || 1,
      change: 'Login Portal (🟢 Live)',
      icon: Globe,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-100',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header & Asset Filter Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>SOC Investigation Dashboard</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              🟢 Live Telemetry
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Real-time security telemetry monitoring & natural-language AI query workbench.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Asset Filter Selector */}
          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <span className="text-xs font-semibold text-slate-500">Asset:</span>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="bg-white border border-slate-300 text-slate-900 font-semibold text-xs rounded-xl px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="all">All Assets</option>
              <option value="login-portal">Login Portal (login-portal)</option>
            </select>
          </div>

          <Link
            to="/investigate"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Investigation</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <GlassCard key={idx} hover className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</span>
                <div className={`p-2.5 rounded-xl border ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight">{card.value}</div>
                <div className="text-xs text-slate-500 mt-1">{card.change}</div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Monitored Assets Card Section */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Monitored Assets</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">1 Web Application Asset</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Login Portal Monitored Asset Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 hover:border-indigo-300 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  🔐
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">Login Portal</div>
                  <div className="text-xs font-mono text-slate-500">login-portal</div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Monitoring
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center font-mono">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Events</div>
                <div className="text-sm font-bold text-slate-900">{loginPortalAsset.total_events?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Alerts</div>
                <div className="text-sm font-bold text-amber-600">{loginPortalAsset.total_alerts}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Risk</div>
                <div className="text-sm font-bold text-rose-600">{loginPortalAsset.risk_level}</div>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <button
                onClick={() => handleOpenAssetActivity(loginPortalAsset)}
                className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Activity</span>
              </button>
            </div>
          </div>

        </div>
      </GlassCard>

      {/* Chart & Active Alerts Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Telemetry Activity Chart */}
        <GlassCard className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Security Telemetry Volume ({selectedAsset === 'all' ? 'All Assets' : 'Login Portal'})</h3>
              <p className="text-xs text-slate-500">Distribution of ingested log event types</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-mono">
              login-portal
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary?.event_activity || [
                { event_type: "authentication", count: 3421 },
                { event_type: "process_execution", count: 1205 },
                { event_type: "network_connection", count: 4890 },
                { event_type: "dns_query", count: 3326 }
              ]}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="event_type" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '0.75rem', color: '#0F172A', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Active Alerts List with Investigate Button */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Active Alerts ({selectedAsset === 'all' ? 'All' : 'Login Portal'})</h3>
            <Link to="/alerts" className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(summary?.recent_alerts || []).slice(0, 4).map((alert) => (
              <div key={alert.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    🔴 {alert.severity}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{alert.mitre_technique}</span>
                </div>
                <div className="text-xs font-semibold text-slate-900">{alert.title}</div>
                <div className="text-[11px] text-slate-500 font-mono space-y-0.5">
                  <div>Asset: <span className="font-semibold text-slate-700">Login Portal</span></div>
                  <div>Source: <span className="text-slate-700">{alert.source_ip || '127.0.0.1'}</span></div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => handleInvestigateAlert(alert)}
                    className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all flex items-center justify-center space-x-1 cursor-pointer shadow-2xs"
                  >
                    <Search className="w-3 h-3" />
                    <span>[ Investigate ]</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

      </div>

      {/* Login Portal Asset Activity Modal */}
      {activeAssetModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold text-slate-900">{activeAssetModal.name || 'Login Portal'} Security Activity</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    🟢 Monitoring
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500">{activeAssetModal.domain || 'login-portal'}</div>
              </div>
              <button
                onClick={() => setActiveAssetModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Asset Security Stats Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Total Events</div>
                <div className="text-lg font-bold text-slate-900 font-mono">
                  {(assetActivityData?.stats?.total_events || summary?.total_events || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Auth Events</div>
                <div className="text-lg font-bold text-indigo-600 font-mono">
                  {(assetActivityData?.stats?.authentication_events || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Suspicious Events</div>
                <div className="text-lg font-bold text-rose-600 font-mono">
                  {assetActivityData?.stats?.suspicious_events || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Active Alerts</div>
                <div className="text-lg font-bold text-amber-600 font-mono">
                  {assetActivityData?.stats?.active_alerts || summary?.total_alerts || 0}
                </div>
              </div>
            </div>

            {/* Recent Activity Stream */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Login Portal Activity Log</div>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/50">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2">Timestamp</th>
                      <th className="px-3 py-2">Action</th>
                      <th className="px-3 py-2">Username</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Source IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {assetEventsList.map((e) => (
                      <tr key={e.id} className="hover:bg-white">
                        <td className="px-3 py-2 text-slate-500 text-[11px]">{e.timestamp}</td>
                        <td className="px-3 py-2 font-bold">{e.event_type} / {e.action}</td>
                        <td className="px-3 py-2 text-indigo-600 font-bold">{e.username}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            e.status === 'failed' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {e.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-slate-600">{e.source_ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveAssetModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
