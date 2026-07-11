// src/pages/Dashboard.jsx

import React, { useState, useEffect, useCallback } from 'react';
import API from '../api/api';
import { formatCurrency, formatDateDisplay } from '../utils/format';

export default function Dashboard() {
  const [counts, setCounts] = useState({
    produtos: 0,
    clientes: 0,
    vendas: 0,
    funcionarios: 0,
    fornecedores: 0,
    grupos: 0,
    marcas: 0,
    unidades: 0,
  });
  const [ultimasVendas, setUltimasVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [vendasError, setVendasError] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(false);
    setVendasError(false);

    try {
      // Carregar todos os dados em paralelo
      const [
        produtos,
        clientes,
        vendas,
        funcionarios,
        fornecedores,
        grupos,
        marcas,
        unidades,
      ] = await Promise.all([
        API.produtos.list().catch(() => []),
        API.clientes.list().catch(() => []),
        API.vendas.list().catch(() => []),
        API.funcionarios.list().catch(() => []),
        API.fornecedores.list().catch(() => []),
        API.grupos.list().catch(() => []),
        API.marcas.list().catch(() => []),
        API.unidades.list().catch(() => []),
      ]);

      // Atualizar contagens
      setCounts({
        produtos: Array.isArray(produtos) ? produtos.length : 0,
        clientes: Array.isArray(clientes) ? clientes.length : 0,
        vendas: Array.isArray(vendas) ? vendas.length : 0,
        funcionarios: Array.isArray(funcionarios) ? funcionarios.length : 0,
        fornecedores: Array.isArray(fornecedores) ? fornecedores.length : 0,
        grupos: Array.isArray(grupos) ? grupos.length : 0,
        marcas: Array.isArray(marcas) ? marcas.length : 0,
        unidades: Array.isArray(unidades) ? unidades.length : 0,
      });

      // Processar últimas vendas
      if (Array.isArray(vendas) && vendas.length > 0) {
        const ultimas = vendas.slice(-5).reverse();
        setUltimasVendas(ultimas);
        setVendasError(false);
      } else {
        setUltimasVendas([]);
        setVendasError(false);
      }
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Configuração dos cards de estatísticas
  const statCards = [
    { key: 'produtos', label: 'Produtos', icon: '📦' },
    { key: 'clientes', label: 'Clientes', icon: '👤'},
    { key: 'vendas', label: 'Vendas', icon: '🛒'},
    { key: 'funcionarios', label: 'Funcionários', icon: '🧑‍💼' },
    { key: 'fornecedores', label: 'Fornecedores', icon: '🚚' },
    { key: 'grupos', label: 'Grupos', icon: '🏷️' },
    { key: 'marcas', label: 'Marcas', icon: '🏷️' },
    { key: 'unidades', label: 'Unidades', icon: '📏' },
  ];

  // Renderizar cards de estatísticas
  const renderStatCards = () => {
    if (loading) {
      return (
        <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
          {statCards.map((card) => (
            <div key={card.key} className="stat-card">
              <div className="stat-icon">{card.icon}</div>
              <div className="label">{card.label}</div>
              <div className="value">
                <span className="spinner"></span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="alert alert-danger" style={{ marginBottom: '1.75rem' }}>
          <i className="bi bi-exclamation-triangle-fill"></i> Erro ao carregar dados do dashboard.
          <button className="btn btn-sm btn-primary ms-2" onClick={loadDashboard}>
            <i className="bi bi-arrow-clockwise"></i> Tentar novamente
          </button>
        </div>
      );
    }

    return (
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        {statCards.map((card) => (
          <div key={card.key} className="stat-card">
            <div className="stat-icon">{card.icon}</div>
            <div className="label">{card.label}</div>
            <div className="value">
              {counts[card.key] !== undefined ? counts[card.key] : 0}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar últimas vendas
  const renderUltimasVendas = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="6" className="text-center py-4">
            <span className="spinner"></span>
          </td>
        </tr>
      );
    }

    if (vendasError) {
      return (
        <tr>
          <td colSpan="6" className="text-center text-danger py-4">
            Erro ao carregar vendas.
          </td>
        </tr>
      );
    }

    if (ultimasVendas.length === 0) {
      return (
        <tr>
          <td colSpan="6" className="text-center text-muted py-4">
            Nenhuma venda registrada.
          </td>
        </tr>
      );
    }

    return ultimasVendas.map((v) => (
      <tr key={v.id}>
        <td>
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--accent)' }}>
            #{v.id}
          </code>
        </td>
        <td>{v.nomeCliente ?? v.idCliente ?? '—'}</td>
        <td>{v.nomeFuncionario ?? v.idFuncionario ?? '—'}</td>
        <td>
          <span className="badge badge-info">{v.metodoPagamento ?? '—'}</span>
        </td>
        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>
          {formatCurrency(v.total ?? v.valorTotal ?? 0)}
        </td>
        <td style={{ color: 'var(--text-secondary)', fontSize: '.8125rem' }}>
          {formatDateDisplay(v.dataVenda ?? v.data)}
        </td>
      </tr>
    ));
  };

  return (
    <>
      <div className="section-header">
        <h1>Dashboard</h1>
        <span style={{ fontSize: '.8125rem', color: 'var(--text-muted)' }}>
          Visão geral do sistema
        </span>
      </div>

      {renderStatCards()}

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
        }}
      >
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
          <i className="bi bi-clock-history"></i> Últimas Vendas
        </h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Funcionário</th>
                <th>Pagamento</th>
                <th>Total</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>{renderUltimasVendas()}</tbody>
          </table>
        </div>
        {!loading && !vendasError && ultimasVendas.length > 0 && (
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                // Navegar para página de vendas
                window.location.href = '/vendas';
              }}
            >
             Ver todas as vendas
            </button>
          </div>
        )}
      </div>
    </>
  );
}