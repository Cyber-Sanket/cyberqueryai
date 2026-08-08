import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, ShieldCheck, Database, CheckCircle, Lock } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { api } from '../services/api';

export const Settings = () => {
  const [datasources, setDatasources] = useState([]);

  useEffect(() => {
    const fetchDS = async () => {
      try {
        const data = await api.getDatasources();
        setDatasources(data);
      } catch (err) {
        console.error('Failed to load datasources:', err);
      }
    };
    fetchDS();
  }, []);

  const schemaFields = [
    { field: "timestamp", type: "DATETIME", description: "Event timestamp in ISO 8601 format", status: "Whitelisted" },
    { field: "username", type: "STRING", description: "Target user account identifier", status: "Whitelisted" },
    { field: "source_ip", type: "STRING", description: "Originating IPv4/IPv6 address", status: "Whitelisted" },
    { field: "destination_ip", type: "STRING", description: "Target internal IPv4/IPv6 address", status: "Whitelisted" },
    { field: "event_type", type: "STRING", description: "Category (authentication, process_execution, network_connection, dns_query)", status: "Whitelisted" },
    { field: "status", type: "STRING", description: "Outcome (success, failed)", status: "Whitelisted" },
    { field: "hostname", type: "STRING", description: "Workstation or Server host identifier", status: "Whitelisted" },
    { field: "process", type: "STRING", description: "Executable process name (e.g. powershell.exe, winword.exe)", status: "Whitelisted" },
    { field: "command_line", type: "STRING", description: "Process execution command line arguments", status: "Whitelisted" },
    { field: "domain", type: "STRING", description: "Target DNS query domain name", status: "Whitelisted" },
    { field: "location_country", type: "STRING", description: "Geographic origin country code", status: "Whitelisted" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Settings & Schema Whitelist</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              Read-Only Governance
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Data Source Adapters, Security Gate Whitelists, and Read-Only permission policies.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Data Source Adapter Card */}
        <GlassCard className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Database className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Configured Data Source Adapter</h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-indigo-600">SimulatedSIEMDataSource</div>
              <div className="text-[11px] text-slate-500">SQLite Read-Only Engine</div>
              <div className="text-emerald-600 font-semibold text-[11px] pt-1">✓ Status: CONNECTED</div>
            </div>

            <div className="text-slate-600 text-xs font-sans leading-relaxed">
              Future Enterprise Adapters: Splunk, Elastic, Microsoft Sentinel.
            </div>
          </div>
        </GlassCard>

        {/* Schema Whitelist Inspector */}
        <GlassCard className="lg:col-span-2 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Schema Field Whitelist (Gate 2 Validator)</h3>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-3 py-2.5">Field Name</th>
                  <th className="px-3 py-2.5">Data Type</th>
                  <th className="px-3 py-2.5">Description</th>
                  <th className="px-3 py-2.5 text-right">Gate Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {schemaFields.map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2 font-bold text-slate-900">{f.field}</td>
                    <td className="px-3 py-2 text-indigo-600 font-semibold">{f.type}</td>
                    <td className="px-3 py-2 text-slate-500 font-sans">{f.description}</td>
                    <td className="px-3 py-2 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                        ✓ {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

      </div>
    </div>
  );
};
