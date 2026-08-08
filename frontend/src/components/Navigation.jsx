import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Search, 
  AlertOctagon, 
  History, 
  Grid, 
  SlidersHorizontal,
  Globe
} from 'lucide-react';

export const Navigation = () => {
  const targetAppLinks = [
    { to: '/app', label: 'HexNova Target App', icon: Globe, badge: 'Target' }
  ];

  const socLinks = [
    { to: '/', label: 'SOC Overview', icon: LayoutDashboard },
    { to: '/investigate', label: 'AI Investigation', icon: Search, badge: 'AI' },
    { to: '/alerts', label: 'Active Alerts', icon: AlertOctagon },
    { to: '/history', label: 'Audit History', icon: History },
    { to: '/mitre', label: 'MITRE ATT&CK', icon: Grid },
    { to: '/governance', label: '⚙ Governance & Controls', icon: SlidersHorizontal },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-6">
        {/* Monitored Application */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Monitored Target App
          </div>
          <nav className="space-y-1">
            {targetAppLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 shrink-0 text-indigo-600" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* SOC Platform Navigation */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            SOC Platform
          </div>
          <nav className="space-y-1">
            {socLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs'
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

      {/* System Status Footer */}
      <div className="p-4 m-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-700">
          <span>HexNova Telemetry</span>
          <span className="text-emerald-600 font-bold">🟢 Streaming</span>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div className="bg-indigo-600 h-full w-[96%] rounded-full"></div>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          Target: hexnova.space
        </div>
      </div>
    </aside>
  );
};
