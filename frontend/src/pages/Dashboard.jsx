import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Search, 
  AlertOctagon, 
  CheckCircle2, 
  Globe, 
  ArrowUpRight, 
  Sparkles,
  Filter,
  X,
  Eye,
  Lock,
  ArrowRight,
  Shield
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
  const [latestEvents, setLatestEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Monitored Asset Activity Modal State
  const [activeAssetModal, setActiveAssetModal] = useState(null);
  const [assetActivityData, setAssetActivityData] = useState(null);
  const [assetEventsList, setAssetEventsList] = useState([]);

  useEffect(() => {
    fetchDashboardData(selectedAsset);
    fetchAssets();
    fetchLatestEvents();
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

  const fetchLatestEvents = async () => {
    try {
      const events = await api.getLatestEvents(10);
      setLatestEvents(events);
    } catch (err) {
      console.error('Failed to load latest events:', err);
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
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-semibold text-slate-400 font-mono-soc">Loading SOC Telemetry Overview...</p>
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
    risk_level: summary?.high_risk_alerts > 0 ? 'HIGH' : 'LOW'
  };

  const statCards = [
    {
      title: 'TOTAL TELEMETRY EVENTS',
      value: (summary?.total_events || 0).toLocaleString(),
      change: '↑ Live events calculated from DB',
      icon: Activity,
      color: 'text-indigo-400',
      bg: 'bg-indigo-950/40 border-indigo-800/50',
    },
    {
      title: 'ACTIVE SECURITY ALERTS',
      value: summary?.total_alerts || 0,
      change: 'Mapped to MITRE ATT&CK',
      icon: AlertOctagon,
      color: 'text-amber-400',
      bg: 'bg-amber-950/40 border-amber-800/50',
    },
    {
      title: 'HIGH RISK INCIDENTS',
      value: summary?.high_risk_alerts || 0,
      change: 'Requires Analyst Action',
      icon: ShieldAlert,
      color: 'text-rose-400',
      bg: 'bg-rose-950/40 border-rose-800/50',
    },
    {
      title: 'MONITORED ASSETS',
      value: summary?.total_assets || 1,
      change: 'Login Portal (● LIVE)',
      icon: Globe,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-800/50',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-[#151E2E] p-6 rounded-2xl border border-[#243047] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <span>SOC Investigation Dashboard</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-semibold font-mono-soc flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE TELEMETRY
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time security telemetry monitoring and AI-assisted investigation.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Asset Filter Selector */}
          <div className="flex items-center space-x-2 bg-[#0B1120] p-1.5 rounded-xl border border-[#243047]">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <span className="text-xs font-semibold text-slate-400 font-mono-soc">Asset:</span>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="bg-[#151E2E] border border-[#243047] text-slate-100 font-semibold text-xs rounded-lg px-2.5 py-1 outline-none cursor-pointer font-mono-soc"
            >
              <option value="all">All Assets</option>
              <option value="login-portal">Login Portal (login-portal)</option>
            </select>
          </div>

          <Link
            to="/investigate"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Investigation</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <GlassCard key={idx} hover className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono-soc">{card.title}</span>
                <div className={`p-2 rounded-xl border ${card.bg} ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100 tracking-tight font-mono-soc">{card.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{card.change}</div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Monitored Asset Card */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#243047] pb-3">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono-soc">Monitored Security Assets</h3>
          </div>
          <span className="text-xs font-mono-soc text-slate-400">1 Web Application Target</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Login Portal Monitored Asset Card */}
          <div className="p-4 rounded-2xl bg-[#182235] border border-[#243047] space-y-3 hover:border-indigo-500/50 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-lg">
                  🔐
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-100">Login Portal</div>
                  <div className="text-xs font-mono-soc text-slate-400">Target: login-portal</div>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 text-[11px] font-bold font-mono-soc flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                MONITORING
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#243047] text-center font-mono-soc">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Events</div>
                <div className="text-sm font-bold text-slate-100">{loginPortalAsset.total_events?.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Alerts</div>
                <div className="text-sm font-bold text-amber-400">{loginPortalAsset.total_alerts}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Risk</div>
                <div className="text-sm font-bold text-rose-400">{loginPortalAsset.risk_level}</div>
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={() => handleOpenAssetActivity(loginPortalAsset)}
                className="w-full py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 font-semibold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer border border-indigo-800/60 font-mono-soc"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Activity →</span>
              </button>
            </div>
          </div>

        </div>
      </GlassCard>

      {/* Live Login Portal Telemetry Stream Table */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#243047] pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono-soc">LIVE LOGIN PORTAL TELEMETRY</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono-soc">POST /api/security-events</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#243047] bg-[#0B1120]">
          <table className="w-full text-left text-xs font-mono-soc">
            <thead className="bg-[#151E2E] text-slate-400 border-b border-[#243047] uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3 py-2.5">TIME</th>
                <th className="px-3 py-2.5">USERNAME</th>
                <th className="px-3 py-2.5">SOURCE IP</th>
                <th className="px-3 py-2.5">EVENT</th>
                <th className="px-3 py-2.5">STATUS</th>
                <th className="px-3 py-2.5 text-right">RISK</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243047] text-slate-200">
              {latestEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-[#151E2E] transition-colors">
                  <td className="px-3 py-2 text-slate-400 text-[11px]">{ev.timestamp}</td>
                  <td className="px-3 py-2 font-bold text-slate-100">{ev.username || 'demo_admin'}</td>
                  <td className="px-3 py-2 text-sky-400">{ev.source_ip || '127.0.0.1'}</td>
                  <td className="px-3 py-2 text-slate-300">{ev.event_type} / {ev.action}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ev.status === 'failed' ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                    }`}>
                      {ev.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ev.severity === 'HIGH' || ev.severity === 'CRITICAL'
                        ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
                        : ev.severity === 'MEDIUM'
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
                        : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                    }`}>
                      {ev.severity || 'LOW'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Chart & Active Alerts Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Telemetry Activity Chart */}
        <GlassCard className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#243047] pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono-soc">Security Telemetry Volume</h3>
              <p className="text-xs text-slate-400">Distribution of ingested log event types</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#0B1120] text-slate-300 font-mono-soc border border-[#243047]">
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
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#243047" />
                <XAxis dataKey="event_type" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1120', borderColor: '#243047', borderRadius: '0.75rem', color: '#E5E7EB', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Active Alerts List with Investigate Button */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#243047] pb-3">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono-soc">Active Security Alerts</h3>
            <Link to="/alerts" className="text-xs text-sky-400 font-semibold hover:underline flex items-center gap-1 font-mono-soc">
              <span>VIEW ALL</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {(summary?.recent_alerts || []).slice(0, 4).map((alert) => (
              <div key={alert.id} className="p-3 rounded-xl bg-[#0B1120] border border-[#243047] space-y-2 hover:border-slate-600 transition-all">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono-soc ${
                    alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80' : 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
                  }`}>
                    ● {alert.severity}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono-soc">{alert.mitre_technique}</span>
                </div>
                <div className="text-xs font-bold text-slate-100">{alert.title}</div>
                <div className="text-[11px] text-slate-400 font-mono-soc space-y-0.5">
                  <div>Asset: <span className="font-semibold text-slate-200">Login Portal</span></div>
                  <div>Source: <span className="text-sky-400">{alert.source_ip || '127.0.0.1'}</span></div>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => handleInvestigateAlert(alert)}
                    className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center space-x-1 cursor-pointer shadow-md font-mono-soc"
                  >
                    <Search className="w-3 h-3" />
                    <span>Investigate →</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

      </div>

      {/* Login Portal Asset Activity Modal */}
      {activeAssetModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#151E2E] rounded-2xl border border-[#243047] max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-[#243047] pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-bold text-slate-100">{activeAssetModal.name || 'Login Portal'} Security Activity</span>
                  <span className="text-xs font-mono-soc px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-bold">
                    ● MONITORING
                  </span>
                </div>
                <div className="text-xs font-mono-soc text-slate-400">{activeAssetModal.domain || 'login-portal'}</div>
              </div>
              <button
                onClick={() => setActiveAssetModal(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-[#182235] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Asset Security Stats Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono-soc">
              <div className="p-3 rounded-xl bg-[#0B1120] border border-[#243047]">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Total Events</div>
                <div className="text-lg font-bold text-slate-100">
                  {(assetActivityData?.stats?.total_events || summary?.total_events || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#0B1120] border border-[#243047]">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Auth Events</div>
                <div className="text-lg font-bold text-indigo-400">
                  {(assetActivityData?.stats?.authentication_events || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#0B1120] border border-[#243047]">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Suspicious Events</div>
                <div className="text-lg font-bold text-rose-400">
                  {assetActivityData?.stats?.suspicious_events || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#0B1120] border border-[#243047]">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Active Alerts</div>
                <div className="text-lg font-bold text-amber-400">
                  {assetActivityData?.stats?.active_alerts || summary?.total_alerts || 0}
                </div>
              </div>
            </div>

            {/* Recent Activity Stream */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono-soc">Recent Login Portal Activity Log</div>
              <div className="overflow-x-auto rounded-xl border border-[#243047] bg-[#0B1120]">
                <table className="w-full text-left text-xs font-mono-soc">
                  <thead className="bg-[#151E2E] text-slate-400 border-b border-[#243047] uppercase text-[10px]">
                    <tr>
                      <th className="px-3 py-2">Timestamp</th>
                      <th className="px-3 py-2">Action</th>
                      <th className="px-3 py-2">Username</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Source IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#243047] text-slate-200">
                    {assetEventsList.map((e) => (
                      <tr key={e.id} className="hover:bg-[#151E2E]">
                        <td className="px-3 py-2 text-slate-400 text-[11px]">{e.timestamp}</td>
                        <td className="px-3 py-2 font-bold">{e.event_type} / {e.action}</td>
                        <td className="px-3 py-2 text-indigo-400 font-bold">{e.username}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            e.status === 'failed' ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                          }`}>
                            {e.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-sky-400">{e.source_ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveAssetModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs cursor-pointer font-mono-soc"
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
