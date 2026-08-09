import React, { useState } from 'react';
import { Grid, Shield, ExternalLink, Search, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';

export const MitreMatrix = () => {
  const [selectedTechnique, setSelectedTechnique] = useState(null);

  const techniques = [
    {
      id: "T1110",
      name: "Brute Force",
      tactic: "Credential Access",
      description: "Adversaries may use brute force techniques to attempt access to user accounts when passwords are unknown.",
      detection: "Monitor authentication logs for high volumes of failed login attempts from a single source IP.",
      risk: "HIGH",
      confidence: "High",
      scenarios: ["Multiple failed RDP/SSH logins", "Password spraying attacks"]
    },
    {
      id: "T1059.001",
      name: "PowerShell Abuse",
      tactic: "Execution",
      description: "Adversaries may abuse PowerShell commands and scripts for execution of malicious code.",
      detection: "Monitor script block logging (Event ID 4104) and process execution for base64 encoded parameters.",
      risk: "HIGH",
      confidence: "High",
      scenarios: ["EncodedCommand flag usage", "DownloadString web requests spawned from Office macros"]
    },
    {
      id: "T1046",
      name: "Network Service Scanning",
      tactic: "Discovery",
      description: "Adversaries may attempt to get a listing of services running on remote hosts.",
      detection: "Monitor network firewall logs for single IPs initiating connections to multiple distinct ports in short time windows.",
      risk: "MEDIUM",
      confidence: "Medium",
      scenarios: ["Nmap port scanning sweeps", "Internal subnet probing"]
    },
    {
      id: "T1071.004",
      name: "DNS Tunneling",
      tactic: "Command and Control",
      description: "Adversaries may communicate using DNS to disguise command and control traffic or exfiltrate data.",
      detection: "Monitor recursive DNS queries for high entropy, long subdomain strings, or unusual C2 domain targets.",
      risk: "HIGH",
      confidence: "Medium-High",
      scenarios: ["Data exfiltration via DNS TXT records", "High-frequency C2 beaconing"]
    },
    {
      id: "T1078",
      name: "Valid Accounts: Impossible Travel",
      tactic: "Defense Evasion & Persistence",
      description: "Adversaries may obtain and abuse credentials of existing user accounts to log in from unexpected geographic locations.",
      detection: "Correlate authentication timestamps and geographic IP locations for impossible speed distance transitions.",
      risk: "HIGH",
      confidence: "High",
      scenarios: ["Sequential logins from USA and Japan within 15 minutes"]
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-[#151E2E] p-6 rounded-2xl border border-[#243047] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2 font-mono-soc">
            <span>MITRE ATT&CK FRAMEWORK MAPPING</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 font-bold">
              v14 ENTERPRISE MATRIX
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated correlation between natural-language SIEM queries, evidence logs, and MITRE ATT&CK techniques.
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono-soc">
        {techniques.map(tech => (
          <GlassCard 
            key={tech.id} 
            hover 
            className={`space-y-3 cursor-pointer transition-all ${
              selectedTechnique?.id === tech.id ? 'border-indigo-500 ring-1 ring-indigo-500 bg-[#182235]' : ''
            }`}
            onClick={() => setSelectedTechnique(tech)}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/80">
                {tech.id}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                tech.risk === 'HIGH' ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80' : 'bg-amber-950/80 text-amber-400 border border-amber-800/80'
              }`}>
                {tech.risk} RISK
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-100 font-sans">{tech.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Tactic: {tech.tactic}</p>
            </div>

            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-sans">
              {tech.description}
            </p>

            <div className="pt-2 border-t border-[#243047] flex items-center justify-between text-[11px] text-sky-400 font-bold">
              <span>View Rule Details</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Detail Inspector Card */}
      {selectedTechnique && (
        <GlassCard className="border-indigo-500/50 bg-[#151E2E] space-y-4">
          <div className="flex items-center justify-between border-b border-[#243047] pb-3">
            <div className="flex items-center space-x-3 font-mono-soc">
              <span className="text-sm font-bold px-3 py-1 rounded-lg bg-indigo-950/80 text-indigo-300 border border-indigo-800/80">
                {selectedTechnique.id}
              </span>
              <h3 className="text-lg font-bold text-slate-100 font-sans">{selectedTechnique.name}</h3>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#0B1120] text-slate-300 border border-[#243047] font-mono-soc">
              Confidence: {selectedTechnique.confidence}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
            <div className="space-y-2">
              <div className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] font-mono-soc">Technique Overview:</div>
              <p className="text-slate-300 bg-[#0B1120] p-3.5 rounded-xl border border-[#243047] font-sans">
                {selectedTechnique.description}
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] font-mono-soc">Detection Guidance:</div>
              <p className="text-slate-300 bg-[#0B1120] p-3.5 rounded-xl border border-[#243047] font-sans">
                {selectedTechnique.detection}
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
