import React, { useEffect, useState } from 'react';
import { ShieldCheck, Database, UserCheck, Sparkles, WifiOff, Activity } from 'lucide-react';
import { api } from '../services/api';

export const Header = () => {
  const [siemStatus, setSiemStatus] = useState('checking'); // 'connected', 'disconnected', 'checking'

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.getHealth();
        if (res && res.status === 'ok' && res.database === 'connected') {
          setSiemStatus('connected');
        } else {
          setSiemStatus('disconnected');
        }
      } catch (err) {
        console.warn('SIEM Backend Health check failed:', err);
        setSiemStatus('disconnected');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-[#0B1120] border-b border-[#243047] px-6 flex items-center justify-between sticky top-0 z-30 shadow-md">
      {/* Brand Header */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-100 tracking-tight">
              CyberQuery AI
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/80">
              Enterprise SOC
            </span>
          </div>
          <p className="text-xs text-slate-400">AI-Powered SOC Investigation Assistant</p>
        </div>
      </div>

      {/* Status Pills & Analyst Badge */}
      <div className="flex items-center space-x-3">
        {/* SIEM Connected Status Badge */}
        {siemStatus === 'connected' ? (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Database className="w-3.5 h-3.5" />
            <span>SIEM Connected</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-950/40 text-rose-400 border border-rose-800/60 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <WifiOff className="w-3.5 h-3.5" />
            <span>SIEM Disconnected</span>
          </div>
        )}

        {/* Live Telemetry Pill */}
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sky-950/40 text-sky-400 border border-sky-800/60 text-xs font-medium">
          <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
          <span>Live Telemetry</span>
        </div>

        {/* Analyst Profile */}
        <div className="flex items-center space-x-2.5 border-l border-[#243047] pl-3">
          <div className="w-8 h-8 rounded-full bg-[#182235] border border-[#243047] flex items-center justify-center text-indigo-300 font-bold text-xs">
            SA
          </div>
          <div className="hidden md:block">
            <div className="font-semibold text-xs text-slate-200">Analyst</div>
            <div className="text-[10px] text-slate-400">Tier-2 Security Analyst</div>
          </div>
        </div>
      </div>
    </header>
  );
};
