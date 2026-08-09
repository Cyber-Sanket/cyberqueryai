import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, 
  ShieldAlert, 
  Terminal, 
  Zap, 
  CheckCircle2, 
  Lock, 
  UserCheck, 
  ArrowRight, 
  Sparkles,
  Activity,
  Server,
  ExternalLink
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { api } from '../services/api';

export const HexNovaApp = () => {
  const [username, setUsername] = useState('demo_admin');
  const [password, setPassword] = useState('Demo@123');
  const [statusMsg, setStatusMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchLatestEvents();
  }, []);

  const fetchLatestEvents = async () => {
    try {
      const data = await api.getLatestEvents(10);
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const handleSingleLogin = async (successStatus = 'failed') => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        asset: 'login-portal',
        event_type: 'authentication',
        action: 'login',
        status: successStatus,
        username: username,
        source_ip: '127.0.0.1',
        destination_ip: '10.0.0.5',
        hostname: 'login-portal'
      };

      const res = await api.ingestSecurityEvent(payload);
      setStatusMsg({
        type: successStatus === 'failed' ? 'error' : 'success',
        text: `Login Portal authentication ${successStatus.toUpperCase()} for '${username}'. Security Event ${res.event_id} streamed to CyberQuery API!`
      });
      fetchLatestEvents();
    } catch (err) {
      console.error('Failed to send security event:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerDemoAttack = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await api.triggerDemoAttack();
      setStatusMsg({
        type: 'attack',
        text: `⚡ Controlled Attack Executed! Ingested 6 Failed + 1 Successful login events for 'demo_admin' on Login Portal. High Risk Brute Force Incident Alert Created!`
      });
      fetchLatestEvents();
    } catch (err) {
      console.error('Failed demo attack:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              Monitored Target Application
            </span>
            <span className="text-xs font-mono text-slate-400">login-portal</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <span>Login Portal Monitored Application</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            This is the standalone Authentication Portal monitored by CyberQuery AI. Telemetry is ingested live via <code>POST /api/security-events</code>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all flex items-center space-x-2 shrink-0"
          >
            <span>Open Standalone Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <Link
            to="/"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all flex items-center space-x-2 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>SOC Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Response Message Banner */}
      {statusMsg && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center space-x-2 ${
          statusMsg.type === 'attack' 
            ? 'bg-rose-50 border-rose-200 text-rose-900' 
            : statusMsg.type === 'error'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <Activity className="w-4 h-4 shrink-0" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Grid: App Login Form & Demo Attack Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Target App Authentication Box */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Login Portal Application Simulator</h3>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              🟢 Live Monitored
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Target Account Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                disabled={loading}
                onClick={() => handleSingleLogin('failed')}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-all cursor-pointer shadow-2xs"
              >
                Submit Failed Login (401)
              </button>
              <button
                disabled={loading}
                onClick={() => handleSingleLogin('success')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all cursor-pointer shadow-2xs"
              >
                Submit Success Login (200)
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Hackathon Brute-Force Demo Attack Trigger */}
        <GlassCard className="space-y-4 border-rose-200 bg-rose-50/20">
          <div className="flex items-center justify-between border-b border-rose-100 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h3 className="text-sm font-bold text-slate-900">Controlled Security Testing Sequence</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              Hackathon Demo
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Simulate a controlled security testing sequence against <code>login-portal</code>.
          </p>

          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1 font-mono text-[11px] text-slate-700">
            <div>1. Fire 6 Failed Authentication Attempts (demo_admin)</div>
            <div>2. Fire 1 Successful Authentication Attempt (demo_admin)</div>
            <div>3. Ingest events into CyberQuery Database</div>
            <div>4. Trigger Brute Force Alert (T1110) & Incident</div>
          </div>

          <button
            disabled={loading}
            onClick={handleTriggerDemoAttack}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>⚡ Run Controlled Brute-Force Test against Login Portal</span>
          </button>
        </GlassCard>

      </div>

      {/* Live Ingested Events Stream */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Live Ingested Security Telemetry Stream (login-portal)</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Streamed to POST /api/security-events</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3 py-2.5">Event ID</th>
                <th className="px-3 py-2.5">Target Account</th>
                <th className="px-3 py-2.5">Source IP</th>
                <th className="px-3 py-2.5">Type / Action</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {events.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/80">
                  <td className="px-3 py-2 font-bold text-indigo-600">{e.id}</td>
                  <td className="px-3 py-2 font-bold text-slate-900">{e.username}</td>
                  <td className="px-3 py-2 text-slate-600">{e.source_ip}</td>
                  <td className="px-3 py-2 text-slate-500">{e.event_type} / {e.action}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      e.status === 'failed' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-slate-400 text-[11px]">{e.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

    </div>
  );
};
