import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  AlertOctagon, 
  History, 
  Grid, 
  SlidersHorizontal,
  Lock,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const Navigation = () => {
  const socLinks = [
    { to: '/', label: 'SOC Overview', icon: LayoutDashboard },
    { to: '/investigate', label: 'AI Investigation', icon: Search, badge: 'AI' },
    { to: '/alerts', label: 'Active Alerts', icon: AlertOctagon },
    { to: '/history', label: 'Audit History', icon: History },
    { to: '/mitre', label: 'MITRE ATT&CK', icon: Grid },
    { to: '/governance', label: 'Governance & Controls', icon: SlidersHorizontal },
  ];

  return (
    <aside className="w-64 bg-[#0B1120] border-r border-[#243047] flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] shadow-lg">
      <div className="p-4 space-y-6">
        
        {/* Monitored Target App Section */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 font-mono-soc">
            MONITORED APPLICATION
          </div>
          <div className="p-3 rounded-2xl bg-[#151E2E] border border-[#243047] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">🔐</span>
                <span className="font-bold text-xs text-slate-100">Login Portal</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-mono-soc">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
            </div>
            
            <div className="text-[11px] text-slate-400 font-mono-soc flex items-center justify-between">
              <span>Target: <strong className="text-slate-200 font-semibold">login-portal</strong></span>
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:text-sky-300 flex items-center gap-0.5 text-[10px] font-bold"
              >
                <span>OPEN</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* SOC Platform Navigation Links */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 font-mono-soc">
            SOC NAVIGATION
          </div>
          <nav className="space-y-1">
            {socLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-[#1E1B4B] text-white border-l-2 border-indigo-500 font-bold shadow-md'
                        : 'text-slate-400 hover:bg-[#151E2E] hover:text-slate-200'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/80">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Safety Gate Footer Badge */}
      <div className="p-4 m-4 bg-[#151E2E] rounded-2xl border border-[#243047] space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Two-Gate Safety</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-mono-soc">
            ACTIVE
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Read-only validation & query safety active on SQLite database.
        </p>
      </div>
    </aside>
  );
};
