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
      <div className="py-20 text-center space-y-3 font-mono-soc">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-400">Loading governance configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Title Banner */}
      <div className="bg-[#151E2E] p-6 rounded-2xl border border-[#243047] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2 font-mono-soc">
            <span>GOVERNANCE & SECURITY CONTROLS</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-bold">
              POLICIES ACTIVE
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure Two-Gate Intent & Safety policies, RBAC access levels, and audit trail controls.
          </p>
        </div>

        {/* Role Toggle Switcher */}
        <div className="flex items-center space-x-2 bg-[#0B1120] p-1.5 rounded-xl border border-[#243047]">
          <UserCheck className="w-4 h-4 text-slate-400 ml-1" />
          <span className="text-xs font-bold text-slate-400 font-mono-soc">Role:</span>
          <button
            onClick={() => setRole('admin')}
            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono-soc transition-all cursor-pointer ${
              role === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => setRole('analyst')}
            className={`px-3 py-1 rounded-lg text-xs font-bold font-mono-soc transition-all cursor-pointer ${
              role === 'analyst' ? 'bg-[#182235] text-slate-200 border border-[#243047]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Analyst (Read-Only)
          </button>
        </div>
      </div>

      {/* Control Status Indicators Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono-soc">
        <div className="p-3 rounded-xl bg-[#151E2E] border border-[#243047] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">TWO-GATE SAFETY</div>
            <div className="text-xs font-bold text-emerald-400 mt-0.5">ACTIVE</div>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="p-3 rounded-xl bg-[#151E2E] border border-[#243047] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">QUERY VALIDATION</div>
            <div className="text-xs font-bold text-emerald-400 mt-0.5">ACTIVE</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="p-3 rounded-xl bg-[#151E2E] border border-[#243047] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">SCHEMA VALIDATION</div>
            <div className="text-xs font-bold text-emerald-400 mt-0.5">ACTIVE</div>
          </div>
          <Lock className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="p-3 rounded-xl bg-[#151E2E] border border-[#243047] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">AUDIT LOGGING</div>
            <div className="text-xs font-bold text-emerald-400 mt-0.5">ACTIVE</div>
          </div>
          <History className="w-5 h-5 text-emerald-400" />
        </div>
      </div>

      {/* Response Messages */}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-xs font-bold flex items-center space-x-2 font-mono-soc">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-400 text-xs font-bold flex items-center space-x-2 font-mono-soc">
          <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: 2 Columns for Governance Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: Two-Gate Architecture & Safety Thresholds */}
        <GlassCard className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#243047] pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono-soc">Two-Gate Safety Controls</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 font-mono-soc">
              Gate 2 Controls
            </span>
          </div>

          <div className="space-y-3 font-mono-soc">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Max Time Range Window (Hours)</label>
              <input
                type="number"
                value={maxTimeRangeHours}
                onChange={(e) => setMaxTimeRangeHours(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#243047] rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Max Results Limit Per Query</label>
              <input
                type="number"
                value={maxResults}
                onChange={(e) => setMaxResults(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#243047] rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-semibold text-slate-300">Enforce Mandatory Time Range</span>
              <button
                type="button"
                onClick={() => setRequireTimeRange(!requireTimeRange)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  requireTimeRange ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  requireTimeRange ? 'left-6' : 'left-1'
                }`}></span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#243047]">
              <span className="text-xs font-semibold text-slate-300">Read-Only Execution Safeguard</span>
              <button
                type="button"
                onClick={() => setReadOnlyExecution(!readOnlyExecution)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  readOnlyExecution ? 'bg-emerald-600' : 'bg-slate-700'
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
        <GlassCard className="space-y-4 font-mono-soc">
          <div className="flex items-center justify-between border-b border-[#243047] pb-3">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Permitted & Blocked Clauses</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
              Schema Whitelist
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Permitted SQL Clauses</label>
              <div className="flex flex-wrap gap-1.5">
                {allPossibleOps.map(op => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => toggleOperation(op)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      allowedOperations.includes(op)
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                        : 'bg-[#0B1120] text-slate-500 border border-[#243047]'
                    }`}
                  >
                    {allowedOperations.includes(op) ? '✓ ' : ''}{op}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Blocked Operations (Strictly Prohibited)</label>
              <div className="flex flex-wrap gap-1.5">
                {blockedOps.map(op => (
                  <span key={op} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-950/80 text-rose-400 border border-rose-800/80">
                    🚫 {op}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Whitelisted Schema Fields</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {allowedFields.map(field => (
                  <span key={field} className="px-2.5 py-1 rounded-lg text-xs bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 flex items-center gap-1">
                    <span>{field}</span>
                    <button onClick={() => handleRemoveField(field)} className="hover:text-rose-400 cursor-pointer">
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
                  className="flex-1 bg-[#0B1120] border border-[#243047] rounded-xl px-3 py-1.5 text-xs text-slate-100 outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddField}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md"
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
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer font-mono-soc"
        >
          {saving ? (
            <span>SAVING POLICY...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>SAVE GOVERNANCE POLICY CONTROLS</span>
            </>
          )}
        </button>
      </div>

      {/* Audit Log Stream */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#243047] pb-3">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono-soc">Governance Policy Audit History</h3>
          </div>
          <span className="text-xs font-mono-soc text-slate-400">Immutable Audit Log</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#243047] bg-[#0B1120]">
          <table className="w-full text-left text-xs font-mono-soc">
            <thead className="bg-[#151E2E] text-slate-400 border-b border-[#243047] uppercase text-[10px]">
              <tr>
                <th className="px-3 py-2">Log ID</th>
                <th className="px-3 py-2">Role / User</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#243047] text-slate-200">
              {auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-[#151E2E]">
                  <td className="px-3 py-2 font-bold text-indigo-400">{log.id}</td>
                  <td className="px-3 py-2 font-bold text-slate-100">{log.actor_role} ({log.actor_id})</td>
                  <td className="px-3 py-2 text-slate-300">{log.action_description}</td>
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
