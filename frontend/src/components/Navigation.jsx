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
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)] shadow-2xs">
      <div className="p-4 space-y-6">
        
        {/* Monitored Target App Section */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Monitored Application
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-base">🔐</span>
                <span className="font-bold text-xs text-slate-900">Login Portal</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Live
              </span>
            </div>
            
            <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
              <span>Target: <strong className="text-slate-700 font-semibold">login-portal</strong></span>
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 text-[10px] font-semibold"
              >
                <span>Open</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* SOC Platform Navigation Links */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            SOC Navigation
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
                        ? 'bg-indigo-600 text-white shadow-xs font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
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
      <div className="p-4 m-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Two-Gate Safety</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            Active
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-tight">
          Read-only validation & query safety active on SQLite database.
        </p>
      </div>
    </aside>
  );
};
