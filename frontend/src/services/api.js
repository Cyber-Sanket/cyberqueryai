import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Auth
  login: async (username, password) => {
    const res = await client.post('/auth/login', { username, password });
    if (res.data?.access_token) {
      localStorage.setItem('cyberquery_token', res.data.access_token);
      localStorage.setItem('cyberquery_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  // Dashboard Summary & Filter
  getDashboardSummary: async (asset = null) => {
    const url = asset && asset !== 'all' ? `/dashboard/summary?asset=${encodeURIComponent(asset)}` : '/dashboard/summary';
    const res = await client.get(url);
    return res.data;
  },

  // Monitored Assets API
  getAssets: async () => {
    const res = await client.get('/assets');
    return res.data;
  },

  getAssetById: async (id) => {
    const res = await client.get(`/assets/${id}`);
    return res.data;
  },

  getAssetEvents: async (id, limit = 15) => {
    const res = await client.get(`/assets/${id}/events?limit=${limit}`);
    return res.data;
  },

  getAssetAlerts: async (id) => {
    const res = await client.get(`/assets/${id}/alerts`);
    return res.data;
  },

  // Investigations
  createInvestigation: async (prompt, timeRange = '24h') => {
    const user = JSON.parse(localStorage.getItem('cyberquery_user') || '{}');
    const role = user.role || 'analyst';
    const res = await client.post('/investigations', { prompt, time_range: timeRange }, {
      headers: { 'X-User-Role': role }
    });
    return res.data;
  },

  getInvestigations: async () => {
    const res = await client.get('/investigations');
    return res.data;
  },

  getInvestigationById: async (id) => {
    const res = await client.get(`/investigations/${id}`);
    return res.data;
  },

  // Alerts & MITRE
  getAlerts: async () => {
    const res = await client.get('/alerts');
    return res.data;
  },

  getMitreDetails: async (technique) => {
    const res = await client.get(`/mitre/${technique}`);
    return res.data;
  },

  getDatasources: async () => {
    const res = await client.get('/datasources');
    return res.data;
  },

  // Governance & Controls
  getGovernance: async () => {
    const res = await client.get('/governance');
    return res.data;
  },

  updateGovernance: async (policy, role = 'admin') => {
    const res = await client.put('/governance', policy, {
      headers: { 'X-User-Role': role }
    });
    return res.data;
  },

  getGovernanceAudit: async () => {
    const res = await client.get('/governance/audit');
    return res.data;
  },

  // Security Events & HexNova Ingestion
  ingestSecurityEvent: async (payload) => {
    const res = await client.post('/security-events', payload, {
      headers: { 'X-API-Key': 'hexnova-sec-key-2026' }
    });
    return res.data;
  },

  triggerDemoAttack: async () => {
    const res = await client.post('/security-events/demo-attack');
    return res.data;
  },

  getLatestEvents: async (limit = 15) => {
    const res = await client.get(`/security-events/latest?limit=${limit}`);
    return res.data;
  }
};
