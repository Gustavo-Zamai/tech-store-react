// src/components/Sidebar.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '/logo.png';

const NAV_SECTIONS = [
  {
    label: 'Geral',
    items: [
      { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    ],
  },
  {
    label: 'Operações',
    items: [
      { to: '/vendas', icon: '🛒', label: 'Vendas' },
      { to: '/produtos', icon: '📦', label: 'Produtos' },
      { to: '/clientes', icon: '👤', label: 'Clientes' },
    ],
  },
  {
    label: 'Administração',
    items: [
      { to: '/funcionarios', icon: '🧑‍💼', label: 'Funcionários' },
      { to: '/empresas', icon: '🏢', label: 'Empresas' },
      { to: '/fornecedores', icon: '🚚', label: 'Fornecedores' },
      { to: '/grupos ', icon: '🏷️', label: 'Grupos' },
      { to: '/marcas', icon: '🏷️', label: 'Marcas' },
      { to: '/unidades-medida', icon: '📏', label: 'Unidades' },
    ],
  },
];

export default function Sidebar({ open, onNavigate }) {
  const { user, logout } = useAuth();

  const nomeCompleto = user?.nomeCompleto || 'Usuário';
  const cargo = user?.cargo || '';
  const nivelAcesso = user?.nivelAcesso || '';
  const imagemUrl = user?.imagemUrl || '';
  const empresaNome = user?.nomeEmpresa || '';

  const primeiroNome = nomeCompleto.split(' ')[0];
  const iniciais = nomeCompleto.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  const subInfo = cargo
    ? (empresaNome ? `${cargo} · ${empresaNome}` : cargo)
    : (empresaNome || nivelAcesso || 'Funcionário');

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <div className="sidebar-logo">
        <img src={logo} alt="Tech Store Logo" width={40} height={40} />
        <span className="logo-text">Tech Store</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span> {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info" title={`${nomeCompleto}\n${cargo}`}>
          <div className="user-avatar">
            {imagemUrl
              ? <img src={imagemUrl} alt={primeiroNome} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : iniciais}
          </div>
          <div>
            <div className="user-name">{primeiroNome}</div>
            <div className="user-role">{subInfo}</div>
          </div>
        </div>
        <button className="btn btn-logout btn-sm" onClick={logout}>
          🚪 Sair
        </button>
      </div>
    </aside>
  );
}