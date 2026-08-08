import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Database, 
  CheckCircle2, 
  Lock, 
  Save, 
  Plus, 
  X, 
  AlertOctagon, 
  Clock, 
  UserCheck, 
  History, 
  Sliders 
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { api } from '../services/api';

export const Governance = () => {
  const [role, setRole] = useState('admin'); // 'admin' or 'analyst'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // Policy Form State
  const [maxTimeRangeHours, setMaxTimeRangeHours] = useState(168);
  const [maxResults, setMaxResults] = useState(1000);
  const [requireTimeRange, setRequireTimeRange] = useState(true);
  const [readOnlyExecution, setReadOnlyExecution] = useState(true);
  const [allowedFields, setAllowedFields] = useState([]);
  const [newField, setNewField] = useState('');
  const [allowedOperations, setAllowedOperations] = useState([]);
  const [enabledScenarios, setEnabledScenarios] = useState({});
  const [auditLoggingEnabled, setAuditLoggingEnabled] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);

  const allPossibleOps = ["SELECT", "WHERE", "GROUP BY", "HAVING", "ORDER BY", "LIMIT"];
  const blockedOps = ["DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "TRUNCATE", "CREATE", "GRANT", "REVOKE"];

  const scenariosList = [
    { key: "brute_force", label: "Brute Force" },
    { key: "powershell_abuse", label: "Suspicious PowerShell" },
    { key: "port_scan", label: "Port Scanning" },
    { key: "dns_tunneling", label: "Suspicious DNS" },
    { key: "impossible_travel", label: "Impossible Travel" }
  ];

  useEffect(() => {
    fetchPolicy();
    fetchAudit();
  }, []);

  const fetchPolicy = async () => {
    setLoading(true);
    try {
      const data = await api.getGovernance();
      setMaxTimeRangeHours(data.max_time_range_hours);
      setMaxResults(data.max_results);
      setRequireTimeRange(data.require_time_range);
      setReadOnlyExecution(data.read_only_execution);
      setAllowedFields(data.allowed_fields || []);
      setAllowedOperations(data.allowed_operations || []);
      setEnabledScenarios(data.enabled_scenarios || {});
      setAuditLoggingEnabled(data.audit_logging_enabled);
    } catch (err) {
      console.error('Failed to load governance policy:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAudit = async () => {
    try {
      const logs = await api.getGovernanceAudit();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load governance audit logs:', err);
    }
  };

  const handleAddField = () => {
    if (!newField.trim()) return;
    const clean = newField.trim().toLowerCase();
    if (!allowedFields.includes(clean)) {
      setAllowedFields([...allowedFields, clean]);
    }
    setNewField('');
  };

  const handleRemoveField = (fieldToRemove) => {
    setAllowedFields(allowedFields.filter(f => f !== fieldToRemove));
  };

  const toggleOperation = (op) => {
    if (allowedOperations.includes(op)) {
      setAllowedOperations(allowedOperations.filter(o => o !== op));
    } else {
      setAllowedOperations([...allowedOperations, op]);
    }
  };

  const toggleScenario = (key) => {
    setEnabledScenarios({
      ...enabledScenarios,
      [key]: !enabledScenarios[key]
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    const payload = {
      max_time_range_hours: parseInt(maxTimeRangeHours),
      max_results: parseInt(maxResults),
      require_time_range: requireTimeRange,
      read_only_execution: readOnlyExecution,
      allowed_fields: allowedFields,
      allowed_operations: allowedOperations,
      enabled_scenarios: enabledScenarios,
      audit_logging_enabled: auditLoggingEnabled
    };

    try {
      const res = await api.updateGovernance(payload, role);
      setMessage(res.message || 'Governance policy updated and applied immediately!');
      fetchAudit();
    } catch (err) {
      console.error('Save failed:', err);
      setError(err.response?.data?.detail || '403 Forbidden: SOC Admin permission required to modify Governance policies.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500">Loading Governance & Controls Policy Engine...</p>
      </div>
    );
  }

  const isAdmin = role === 'admin';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Banner Header & RBAC Role Switcher */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>⚙ Governance & Controls</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              Real Security Control Layer
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage investigation safety, time-range limits, field whitelists, and query execution policies.
          </p>
        </div>

        {/* Role Switcher Toggle Pill for Demonstrating RBAC */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase px-2">Active Role:</span>
          <button
            onClick={() => setRole('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              role === 'admin'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            SOC Admin (Full Control)
          </button>
          <button
            onClick={() => setRole('analyst')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              role === 'analyst'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            SOC Analyst (Read-Only)
          </button>
        </div>
      </div>

      {/* Analyst Read-Only Alert Notice */}
      {!isAdmin && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2 font-medium">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Logged in as <strong>SOC Analyst</strong>. Policy controls are in read-only mode. Admin permission is required to save changes.</span>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
            403 RBAC Enforced
          </span>
        </div>
      )}

      {/* Response Banners */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-center space-x-2">
          <AlertOctagon className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">

        {/* 1. Query Safety Controls Card */}
        <GlassCard className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Query Safety & Limit Caps</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Maximum Query Time Range */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Maximum Query Time Range</label>
              <select
                disabled={!isAdmin}
                value={maxTimeRangeHours}
                onChange={(e) => setMaxTimeRangeHours(parseInt(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none disabled:opacity-60"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={24}>24 hours</option>
                <option value={72}>3 days (72 hours)</option>
                <option value={168}>7 days (168 hours)</option>
              </select>
            </div>

            {/* Maximum Results Cap */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Maximum Results Cap</label>
              <input
                type="number"
                disabled={!isAdmin}
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value) || 100)}
                className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none disabled:opacity-60 font-mono"
              />
            </div>

            {/* Require Time Range Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Require Time Range</label>
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-600">Unscoped Query Block</span>
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={requireTimeRange}
                  onChange={(e) => setRequireTimeRange(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer disabled:opacity-60"
                />
              </div>
            </div>

            {/* Read-Only Execution Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Read-Only Execution</label>
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-600">DDL/Mutation Block</span>
                <input
                  type="checkbox"
                  disabled={!isAdmin}
                  checked={readOnlyExecution}
                  onChange={(e) => setReadOnlyExecution(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer disabled:opacity-60"
                />
              </div>
            </div>

          </div>
        </GlassCard>

        {/* 2. Allowed Fields Whitelist Card */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Allowed Schema Fields Whitelist</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">{allowedFields.length} Approved Fields</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {allowedFields.map(f => (
              <span key={f} className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono text-slate-800">
                <span>☑ {f}</span>
                {isAdmin && f !== '*' && (
                  <button
                    onClick={() => handleRemoveField(f)}
                    className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>

          {isAdmin && (
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="text"
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
                placeholder="Add custom schema field (e.g. user_agent)"
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none font-mono"
              />
              <button
                onClick={handleAddField}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Field</span>
              </button>
            </div>
          )}
        </GlassCard>

        {/* 3. Allowed Operations Card */}
        <GlassCard className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Lock className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Allowed Operations & Keyword Protections</h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold text-slate-700 mb-2">Approved SQL Read Operations:</div>
              <div className="flex flex-wrap gap-2">
                {allPossibleOps.map(op => {
                  const active = allowedOperations.includes(op);
                  return (
                    <button
                      key={op}
                      disabled={!isAdmin}
                      onClick={() => toggleOperation(op)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all border cursor-pointer ${
                        active
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      {active ? '☑' : '☐'} {op}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <div className="text-xs font-semibold text-rose-700 mb-1.5">Strictly Blocked DDL / Mutating Keywords:</div>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11px] text-rose-800">
                {blockedOps.map(b => (
                  <span key={b} className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200">
                    🔒 {b}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* 4. Investigation Scenarios Controls Card */}
        <GlassCard className="space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Investigation Scenarios Permissions</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scenariosList.map(s => {
              const enabled = enabledScenarios[s.key] !== false;
              return (
                <div 
                  key={s.key}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-all ${
                    enabled ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span>{enabled ? '☑' : '☐'}</span>
                    <span>{s.label}</span>
                  </span>
                  <input
                    type="checkbox"
                    disabled={!isAdmin}
                    checked={enabled}
                    onChange={() => toggleScenario(s.key)}
                    className="w-4 h-4 accent-indigo-600 rounded cursor-pointer disabled:opacity-60"
                  />
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* 5. Data Source & Audit Logging Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Data Source Configuration */}
          <GlassCard className="space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Database className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Data Source Adapter</h3>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-900">Simulated SIEM Telemetry</div>
                <div className="text-[11px] text-slate-500 font-mono">SQLite In-Memory Engine</div>
              </div>
              <div className="flex items-center space-x-2 font-mono text-[11px]">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  🟢 Connected
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                  READ ONLY
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Audit Logging Toggle */}
          <GlassCard className="space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <History className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Audit Logging Governance</h3>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-900">Audit Logging Engine</div>
                <div className="text-[11px] text-slate-500">Record all investigation prompts & governance edits</div>
              </div>
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={auditLoggingEnabled}
                onChange={(e) => setAuditLoggingEnabled(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer disabled:opacity-60"
              />
            </div>
          </GlassCard>

        </div>

        {/* Save Governance Button Card */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold text-sm shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
          >
            {saving ? (
              <span>Applying Policy...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Apply Governance Policies</span>
              </>
            )}
          </button>
        </div>

        {/* Governance Policy Audit History Log Table */}
        {auditLogs.length > 0 && (
          <GlassCard className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <History className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Governance Policy Change Audit History</h3>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5">Admin ID</th>
                    <th className="px-3 py-2.5">Setting Changed</th>
                    <th className="px-3 py-2.5">Old Value</th>
                    <th className="px-3 py-2.5">New Value</th>
                    <th className="px-3 py-2.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2 font-bold text-indigo-600">{log.admin_id}</td>
                      <td className="px-3 py-2 font-bold text-slate-900">{log.setting_changed}</td>
                      <td className="px-3 py-2 text-rose-600 max-w-xs truncate">{log.old_value}</td>
                      <td className="px-3 py-2 text-emerald-600 max-w-xs truncate">{log.new_value}</td>
                      <td className="px-3 py-2 text-right text-slate-400 text-[11px]">{log.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

      </div>
    </div>
  );
};
