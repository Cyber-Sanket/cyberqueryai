import React, { useEffect, useState } from 'react';
import { ShieldCheck, Database, UserCheck, Sparkles, Wifi, WifiOff } from 'lucide-react';
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
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              CyberQuery AI
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
              Enterprise
            </span>
          </div>
          <p className="text-xs text-slate-500">SOC Investigation Assistant</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Connection Status Badge dynamically derived from /api/health */}
        {siemStatus === 'connected' ? (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <Database className="w-3.5 h-3.5" />
            <span>SIEM Connected</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <WifiOff className="w-3.5 h-3.5" />
            <span>SIEM Disconnected</span>
          </div>
        )}

        {/* Validator Status */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Two-Gate Safety Architecture</span>
        </div>

        {/* User Profile */}
        <div className="flex items-center space-x-3 border-l border-slate-200 pl-4">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs">
            SA
          </div>
          <div className="hidden sm:block">
            <div className="font-semibold text-xs text-slate-900">Analyst</div>
            <div className="text-[10px] text-slate-500">Tier-2 Security Analyst</div>
          </div>
        </div>
      </div>
    </header>
  );
};
