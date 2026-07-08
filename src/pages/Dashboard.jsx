import { useEffect, useState } from 'react';
import API from '../api/api';
import { formatCurrency, formatDateDisplay } from '../utils/format';
import { Spinner, EmptyRow, LoadingRow } from '../components/TableHelpers';

const STAT_LABELS = [
  ['produtos', 'Produtos'],
  ['clientes', 'Clientes'],
  ['vendas', 'Vendas'],
  ['funcionarios', 'Funcionários'],
  ['fornecedores', 'Fornecedores'],
  ['categorias', 'Categorias'],
];

export default function Dashboard() {
  const [counts, setCounts] = useState(null);
  const [ultimasVendas, setUltimasVendas] = useState(null);
  const [vendasError, setVendasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const results = await Promise.allSettled([
        API.produtos.list(),
        API.clientes.list(),
        API.vendas.list(),
        API.funcionarios.list(),
        API.fornecedores.list(),
        API.categorias.list(),
      ]);

      if (cancelled) return;

      const [prods, clis, vends, funcs, forns, cats] = results;
      setCounts({
        produtos: prods.status === 'fulfilled' && Array.isArray(prods.value) ? prods.value.length : 0,
        clientes: clis.status === 'fulfilled' && Array.isArray(clis.value) ? clis.value.length : 0,
        vendas: vends.status === 'fulfilled' && Array.isArray(vends.value) ? vends.value.length : 0,
        funcionarios: funcs.status === 'fulfilled' && Array.isArray(funcs.value) ? funcs.value.length : 0,
        fornecedores: forns.status === 'fulfilled' && Array.isArray(forns.value) ? forns.value.length : 0,
        categorias: cats.status === 'fulfilled' && Array.isArray(cats.value) ? cats.value.length : 0,
      });

      if (vends.status === 'fulfilled' && Array.isArray(vends.value)) {
        setUltimasVendas(vends.value.slice(-5).reverse());
      } else {
        setVendasError(true);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <div className="section-header">
        <h1>Dashboard</h1>
        <span style={{ fontSize: '.8125rem', color: 'var(--text-muted)' }}>Visão geral do sistema</span>
      </div>

      <div className="grid-3" style={{ marginBottom: '1.75rem' }}>
        {STAT_LABELS.map(([key, label]) => (
          <div className="stat-card" key={key}>
            <div className="label">{label}</div>
            <div className="value">{counts ? counts[key] : <Spinner />}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Últimas Vendas</h2>
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
            <tbody>
              {ultimasVendas === null && !vendasError && <LoadingRow colSpan={6} />}
              {vendasError && <EmptyRow colSpan={6} message="Erro ao carregar vendas." />}
              {ultimasVendas !== null && ultimasVendas.length === 0 && (
                <EmptyRow colSpan={6} message="Nenhuma venda registrada." />
              )}
              {ultimasVendas?.map((v) => (
                <tr key={v.id}>
                  <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--accent)' }}>#{v.id}</code></td>
                  <td>{v.nomeCliente ?? v.idCliente ?? '—'}</td>
                  <td>{v.nomeFuncionario ?? v.idFuncionario ?? '—'}</td>
                  <td><span className="badge badge-info">{v.metodoPagamento ?? '—'}</span></td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(v.total ?? v.valorTotal)}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '.8125rem' }}>{formatDateDisplay(v.dataVenda ?? v.data)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
