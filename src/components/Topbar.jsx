import { useEffect, useRef, useState } from 'react';
import API from '../api/api';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/vendas': 'Vendas',
  '/produtos': 'Produtos',
  '/clientes': 'Clientes',
  '/funcionarios': 'Funcionários',
  '/empresas': 'Empresas',
  '/fornecedores': 'Fornecedores',
  '/categorias': 'Categorias',
};

export default function Topbar({ pathname, onHamburger, onOpenApiSettings, refreshSignal }) {
  const [online, setOnline] = useState(null);
  const intervalRef = useRef(null);

  const checkStatus = async () => {
    const isOnline = await API.ping();
    setOnline(isOnline);
  };

  useEffect(() => {
    checkStatus();
    intervalRef.current = setInterval(checkStatus, 30000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  const title = TITLES[pathname] || 'Dashboard';

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        <button className="hamburger" aria-label="Menu" onClick={onHamburger}>☰</button>
        <span className="topbar-title">{title}</span>
      </div>
      <div className="topbar-actions">
        <div className="api-indicator">
          <div className={`api-dot ${online === null ? '' : online ? 'online' : 'offline'}`} />
          <span>{online === null ? 'verificando...' : online ? 'API online' : 'API offline'}</span>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          title="Configurar URL da API"
          onClick={onOpenApiSettings}
        >
          ⚙️ API
        </button>
      </div>
    </header>
  );
}
