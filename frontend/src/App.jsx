import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { Investigate } from './pages/Investigate';
import { Alerts } from './pages/Alerts';
import { InvestigationHistory } from './pages/InvestigationHistory';
import { InvestigationDetail } from './pages/InvestigationDetail';
import { MitreMatrix } from './pages/MitreMatrix';
import { Governance } from './pages/Governance';
import { HexNovaApp } from './pages/HexNovaApp';
import { Login } from './pages/Login';

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col font-sans antialiased text-slate-100">
      <Header />
      <div className="flex flex-1">
        <Navigation />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Monitored Target Application Route */}
        <Route
          path="/app"
          element={
            <AppLayout>
              <HexNovaApp />
            </AppLayout>
          }
        />

        {/* SOC Platform Routes */}
        <Route
          path="/"
          element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          }
        />
        <Route
          path="/soc"
          element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          }
        />
        <Route
          path="/investigate"
          element={
            <AppLayout>
              <Investigate />
            </AppLayout>
          }
        />
        <Route
          path="/soc/investigate"
          element={
            <AppLayout>
              <Investigate />
            </AppLayout>
          }
        />
        <Route
          path="/alerts"
          element={
            <AppLayout>
              <Alerts />
            </AppLayout>
          }
        />
        <Route
          path="/soc/alerts"
          element={
            <AppLayout>
              <Alerts />
            </AppLayout>
          }
        />
        <Route
          path="/history"
          element={
            <AppLayout>
              <InvestigationHistory />
            </AppLayout>
          }
        />
        <Route
          path="/soc/history"
          element={
            <AppLayout>
              <InvestigationHistory />
            </AppLayout>
          }
        />
        <Route
          path="/history/:id"
          element={
            <AppLayout>
              <InvestigationDetail />
            </AppLayout>
          }
        />
        <Route
          path="/mitre"
          element={
            <AppLayout>
              <MitreMatrix />
            </AppLayout>
          }
        />
        <Route
          path="/soc/mitre"
          element={
            <AppLayout>
              <MitreMatrix />
            </AppLayout>
          }
        />
        <Route
          path="/governance"
          element={
            <AppLayout>
              <Governance />
            </AppLayout>
          }
        />
        <Route
          path="/soc/governance"
          element={
            <AppLayout>
              <Governance />
            </AppLayout>
          }
        />
        <Route path="/settings" element={<Navigate to="/governance" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
