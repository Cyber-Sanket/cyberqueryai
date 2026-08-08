import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Health Check
  getHealth: async () => {
    const res = await client.get('/health');
    return res.data;
  },

  // Auth
  login: async (username, password) => {
    const res = await client.post('/auth/login', { username, password });
    if (res.data?.access_token) {
      localStorage.setItem('cyberquery_token', res.data.access_token);
      localStorage.setItem('cyberquery_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  // Dashboard Summary & Real Stats
  getDashboardSummary: async (asset = null) => {
    const url = asset && asset !== 'all' ? `/dashboard/summary?asset=${encodeURIComponent(asset)}` : '/dashboard/summary';
    const res = await client.get(url);
    return res.data;
  },

  getStats: async () => {
    const res = await client.get('/stats');
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

  // Investigations & AI Workbench
  createInvestigation: async (prompt, timeRange = '24h') => {
    const user = JSON.parse(localStorage.getItem('cyberquery_user') || '{}');
    const role = user.role || 'analyst';
    const res = await client.post('/investigate', { prompt, time_range: timeRange }, {
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

  // Alerts, Incidents & MITRE
  getAlerts: async () => {
    const res = await client.get('/alerts');
    return res.data;
  },

  getIncidents: async () => {
    const res = await client.get('/incidents');
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

  // Security Events & Cloudflare / HexNova Telemetry
  ingestSecurityEvent: async (payload) => {
    const res = await client.post('/security-events', payload, {
      headers: { 'X-API-Key': 'hexnova-sec-key-2026' }
    });
    return res.data;
  },

  ingestCloudflareEvent: async (payload) => {
    const res = await client.post('/cloudflare/events', payload);
    return res.data;
  },

  seedDemoData: async () => {
    const res = await client.post('/demo/seed');
    return res.data;
  },

  triggerDemoAttack: async () => {
    const res = await client.post('/security-events/demo-attack');
    return res.data;
  },

  getLatestEvents: async (limit = 15) => {
    const res = await client.get(`/security-events?limit=${limit}`);
    return res.data;
  }
};
