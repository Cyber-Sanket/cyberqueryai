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

  const handleSavePolicy = async () => {
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
      if (res.status === 'success') {
        setMessage('Governance policy updated successfully!');
        fetchAudit();
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError('403 Forbidden: Only Admin role is permitted to modify governance policies.');
      } else {
        setError('Failed to update governance policy.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500">Loading governance configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Title Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Governance & Security Controls</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              Policy Controls Active
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure Two-Gate Intent & Safety policies, RBAC access levels, and audit trail controls.
          </p>
        </div>

        {/* Role Toggle Switcher */}
        <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
          <UserCheck className="w-4 h-4 text-slate-500 ml-1" />
          <span className="text-xs font-semibold text-slate-500">Active Role:</span>
          <button
            onClick={() => setRole('admin')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              role === 'admin' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => setRole('analyst')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              role === 'analyst' ? 'bg-slate-200 text-slate-800' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Analyst (Read Only Controls)
          </button>
        </div>
      </div>

      {/* Response Messages */}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center space-x-2">
          <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: 2 Columns for Governance Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: Two-Gate Architecture & Safety Thresholds */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Two-Gate Safety & Limits</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              Gate 2 Controls
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Max Investigation Window (Hours)</label>
              <input
                type="number"
                value={maxTimeRangeHours}
                onChange={(e) => setMaxTimeRangeHours(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Max Results Cap Per Query</label>
              <input
                type="number"
                value={maxResults}
                onChange={(e) => setMaxResults(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold text-slate-700">Enforce Time Range Requirement</span>
              <button
                type="button"
                onClick={() => setRequireTimeRange(!requireTimeRange)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  requireTimeRange ? 'bg-indigo-600' : 'bg-slate-300'
                }`}
              >
                <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  requireTimeRange ? 'left-6' : 'left-1'
                }`}></span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-700">Read-Only Database Enforcement</span>
              <button
                type="button"
                onClick={() => setReadOnlyExecution(!readOnlyExecution)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  readOnlyExecution ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  readOnlyExecution ? 'left-6' : 'left-1'
                }`}></span>
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Card 2: Allowed SQL Operations & Whitelisted Schema Fields */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Allowed Operations & Whitelist</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Schema Whitelist
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Permitted SQL Clauses</label>
              <div className="flex flex-wrap gap-1.5">
                {allPossibleOps.map(op => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => toggleOperation(op)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      allowedOperations.includes(op)
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {allowedOperations.includes(op) ? '✓ ' : ''}{op}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Blocked SQL Operations (Strictly Prohibited)</label>
              <div className="flex flex-wrap gap-1.5">
                {blockedOps.map(op => (
                  <span key={op} className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    🚫 {op}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">Whitelisted Schema Fields</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {allowedFields.map(field => (
                  <span key={field} className="px-2.5 py-1 rounded-lg text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                    <span>{field}</span>
                    <button onClick={() => handleRemoveField(field)} className="hover:text-rose-600 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newField}
                  onChange={(e) => setNewField(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddField())}
                  placeholder="Add field to schema whitelist..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-900 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddField}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

      </div>

      {/* Save Policy Button Banner */}
      <div className="flex justify-end pt-2">
        <button
          disabled={saving}
          onClick={handleSavePolicy}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
        >
          {saving ? (
            <span>Saving Policy...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Governance Policy Controls</span>
            </>
          )}
        </button>
      </div>

      {/* Audit Log Stream */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Governance Policy Audit History</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">Immutable Audit Trail</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase text-[10px]">
              <tr>
                <th className="px-3 py-2">Log ID</th>
                <th className="px-3 py-2">Role / User</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80">
                  <td className="px-3 py-2 font-bold text-indigo-600">{log.id}</td>
                  <td className="px-3 py-2 font-bold text-slate-900">{log.actor_role} ({log.actor_id})</td>
                  <td className="px-3 py-2 text-slate-600">{log.action_description}</td>
                  <td className="px-3 py-2 text-right text-slate-400 text-[11px]">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

    </div>
  );
};
