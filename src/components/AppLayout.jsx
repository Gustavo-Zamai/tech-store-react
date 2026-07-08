import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ApiSettingsModal from './ApiSettingsModal';

export default function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      <div className="main-content">
        <Topbar
          pathname={location.pathname}
          onHamburger={() => setSidebarOpen((v) => !v)}
          onOpenApiSettings={() => setApiModalOpen(true)}
          refreshSignal={refreshSignal}
        />
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <ApiSettingsModal
        open={apiModalOpen}
        onClose={() => setApiModalOpen(false)}
        onSaved={() => setRefreshSignal((v) => v + 1)}
      />
    </div>
  );
}
