// src/pages/Produtos.jsx

import { useEffect, useMemo, useState } from 'react';
import API from '../api/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useConfirm } from '../components/useConfirm';
import { formatCurrency, formatDateDisplay } from '../utils/format';
import { LoadingRow, EmptyRow, StatusBadge } from '../components/TableHelpers';

const emptyForm = {
  // Dados Básicos
  nome: '',
  descricao: '',
  precoVenda: '',
  precoCompra: '',
  quantidade: '',
  idFornecedor: '',
  idGrupo: '',
  idMarca: '',
  idUnidadeMedida: '',
  quantidadeMinima: '',
  ativo: 'true',
  
  // Dados Fiscais
  gtinEan: '',
  ncm: '',
  cfop: '',
  cest: '',
  unidadeComercial: 'UN',
  unidadeTributavel: 'UN',
  origemMercadoria: '',
  cstCsosnIcms: '',
  aliquotaIcms: '',
  cstPis: '',
  aliquotaPis: '',
  cstCofins: '',
  aliquotaCofins: '',
};

const ORIGENS = [
  { value: 0, label: 'Nacional' },
  { value: 1, label: 'Estrangeira - Importação direta' },
  { value: 2, label: 'Estrangeira - Adquirida no mercado interno' },
  { value: 3, label: 'Estrangeira - Importação direta sem similar nacional' },
  { value: 4, label: 'Estrangeira - Adquirida no mercado interno sem similar nacional' },
  { value: 5, label: 'Estrangeira - Importação direta com similar nacional' },
  { value: 6, label: 'Estrangeira - Adquirida no mercado interno com similar nacional' },
  { value: 7, label: 'Estrangeira - Importação direta sem similar nacional (Lei 8.248)' },
  { value: 8, label: 'Estrangeira - Adquirida no mercado interno sem similar nacional (Lei 8.248)' },
];

const CST_ICMS_OPCOES = [
  { value: '00', label: '00 - Tributada integralmente' },
  { value: '10', label: '10 - Tributada e com cobrança do ICMS por substituição tributária' },
  { value: '20', label: '20 - Com redução de base de cálculo' },
  { value: '30', label: '30 - Isenta / não tributada e com cobrança do ICMS por substituição tributária' },
  { value: '40', label: '40 - Isenta' },
  { value: '41', label: '41 - Não tributada' },
  { value: '50', label: '50 - Suspensão' },
  { value: '51', label: '51 - Diferimento' },
  { value: '60', label: '60 - ICMS cobrado anteriormente por substituição tributária' },
  { value: '70', label: '70 - Com redução de base de cálculo e cobrança do ICMS por substituição tributária' },
  { value: '90', label: '90 - Outras' },
];

const CSOSN_OPCOES = [
  { value: '101', label: '101 - Tributada pelo Simples Nacional com permissão de crédito' },
  { value: '102', label: '102 - Tributada pelo Simples Nacional sem permissão de crédito' },
  { value: '103', label: '103 - Isenção do ICMS no Simples Nacional para faixa de receita bruta' },
  { value: '201', label: '201 - Tributada pelo Simples Nacional com permissão de crédito e com cobrança do ICMS por substituição tributária' },
  { value: '202', label: '202 - Tributada pelo Simples Nacional sem permissão de crédito e com cobrança do ICMS por substituição tributária' },
  { value: '203', label: '203 - Isenção do ICMS no Simples Nacional para faixa de receita bruta e com cobrança do ICMS por substituição tributária' },
  { value: '300', label: '300 - Imune' },
  { value: '400', label: '400 - Não tributada pelo Simples Nacional' },
  { value: '500', label: '500 - ICMS cobrado anteriormente por substituição tributária (substituído)' },
  { value: '900', label: '900 - Outras' },
];

const CST_PIS_COFINS_OPCOES = [
  { value: '01', label: '01 - Operação Tributável - Base de Cálculo = Valor da Operação Alíquota Normal' },
  { value: '02', label: '02 - Operação Tributável - Base de Cálculo = Valor da Operação Alíquota Diferenciada' },
  { value: '03', label: '03 - Operação Tributável - Base de Cálculo = Quantidade Vendida x Alíquota por Unidade de Produto' },
  { value: '04', label: '04 - Operação Tributável - Tributação Monofásica (Alíquota Zero)' },
  { value: '05', label: '05 - Operação Tributável por Substituição Tributária' },
  { value: '06', label: '06 - Operação Tributável - Alíquota Zero' },
  { value: '07', label: '07 - Operação Isenta da Contribuição' },
  { value: '08', label: '08 - Operação sem Incidência da Contribuição' },
  { value: '09', label: '09 - Operação com Suspensão da Contribuição' },
  { value: '49', label: '49 - Outras Operações de Saída' },
  { value: '50', label: '50 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita Tributada no Mercado Interno' },
  { value: '51', label: '51 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita Não Tributada no Mercado Interno' },
  { value: '52', label: '52 - Operação com Direito a Crédito - Vinculada Exclusivamente a Receita de Exportação' },
  { value: '53', label: '53 - Operação com Direito a Crédito - Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno' },
  { value: '54', label: '54 - Operação com Direito a Crédito - Vinculada a Receitas Tributadas no Mercado Interno e de Exportação' },
  { value: '55', label: '55 - Operação com Direito a Crédito - Vinculada a Receitas Não-Tributadas no Mercado Interno e de Exportação' },
  { value: '56', label: '56 - Operação com Direito a Crédito - Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno e de Exportação' },
  { value: '60', label: '60 - Crédito Presumido - Operação de Aquisição Vinculada Exclusivamente a Receita Tributada no Mercado Interno' },
  { value: '61', label: '61 - Crédito Presumido - Operação de Aquisição Vinculada Exclusivamente a Receita Não-Tributada no Mercado Interno' },
  { value: '62', label: '62 - Crédito Presumido - Operação de Aquisição Vinculada Exclusivamente a Receita de Exportação' },
  { value: '63', label: '63 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno' },
  { value: '64', label: '64 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Tributadas no Mercado Interno e de Exportação' },
  { value: '65', label: '65 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Não-Tributadas no Mercado Interno e de Exportação' },
  { value: '66', label: '66 - Crédito Presumido - Operação de Aquisição Vinculada a Receitas Tributadas e Não-Tributadas no Mercado Interno e de Exportação' },
  { value: '67', label: '67 - Crédito Presumido - Outras Operações' },
  { value: '70', label: '70 - Operação de Aquisição sem Direito a Crédito' },
  { value: '71', label: '71 - Operação de Aquisição com Isenção' },
  { value: '72', label: '72 - Operação de Aquisição com Suspensão' },
  { value: '73', label: '73 - Operação de Aquisição com Alíquota Zero' },
  { value: '74', label: '74 - Operação de Aquisição sem Incidência da Contribuição' },
  { value: '75', label: '75 - Operação de Aquisição por Substituição Tributária' },
  { value: '98', label: '98 - Outras Operações de Entrada' },
  { value: '99', label: '99 - Outras Operações' },
];

export default function Produtos() {
  const toast = useToast();
  const [produtos, setProdutos] = useState(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  // Dados para os selects
  const [fornecedores, setFornecedores] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [unidades, setUnidades] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { confirmState, requestConfirm, cancelConfirm } = useConfirm();

  const load = async () => {
    try {
      const [prods, fors, grps, marcasData, unidData] = await Promise.all([
        API.produtos.list().catch(() => []),
        API.fornecedores.list().catch(() => []),
        API.grupos.list().catch(() => []),
        API.marcas.list().catch(() => []),
        API.unidades.list().catch(() => []),
      ]);

      setProdutos(prods || []);
      setFornecedores(fors || []);
      setGrupos(grps || []);
      setMarcas(marcasData || []);
      setUnidades(unidData || []);
      setError(false);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
      setError(true);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!produtos) return [];
    const q = search.toLowerCase().trim();
    if (!q) return produtos;
    return produtos.filter((p) =>
      p.nome?.toLowerCase().includes(q) ||
      p.gtinEan?.includes(q) ||
      p.descricao?.toLowerCase().includes(q)
    );
  }, [produtos, search]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = async (id) => {
    try {
      const p = await API.produtos.get(id);
      setEditing(p);
      setForm({
        // Dados Básicos
        nome: p.nome ?? '',
        descricao: p.descricao ?? '',
        precoVenda: p.precoVenda ?? '',
        precoCompra: p.precoCompra ?? '',
        quantidade: p.quantidade ?? '',
        idFornecedor: p.idFornecedor ?? '',
        idGrupo: p.idGrupo ?? '',
        idMarca: p.idMarca ?? '',
        idUnidadeMedida: p.idUnidadeMedida ?? '',
        quantidadeMinima: p.quantidadeMinima ?? '',
        ativo: p.ativo === false ? 'false' : 'true',
        
        // Dados Fiscais
        gtinEan: p.gtinEan ?? '',
        ncm: p.ncm ?? '',
        cfop: p.cfop ?? '',
        cest: p.cest ?? '',
        unidadeComercial: p.unidadeComercial ?? 'UN',
        unidadeTributavel: p.unidadeTributavel ?? 'UN',
        origemMercadoria: p.origemMercadoria ?? '',
        cstCsosnIcms: p.cstCsosnIcms ?? '',
        aliquotaIcms: p.aliquotaIcms ?? '',
        cstPis: p.cstPis ?? '',
        aliquotaPis: p.aliquotaPis ?? '',
        cstCofins: p.cstCofins ?? '',
        aliquotaCofins: p.aliquotaCofins ?? '',
      });
      setModalOpen(true);
    } catch {
      toast.error('Erro ao carregar produto para edição');
    }
  };

  const handleDelete = (id, nome) => requestConfirm(nome, async () => {
    try {
      await API.produtos.delete(id);
      toast.success('Produto excluído!');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  });

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setSaving(true);
    try {
      const data = {
        // Dados Básicos
        nome: form.nome,
        descricao: form.descricao || undefined,
        precoVenda: parseFloat(form.precoVenda),
        precoCompra: parseFloat(form.precoCompra),
        quantidade: parseInt(form.quantidade) || 0,
        idFornecedor: parseInt(form.idFornecedor),
        idGrupo: parseInt(form.idGrupo),
        idMarca: form.idMarca ? parseInt(form.idMarca) : undefined,
        idUnidadeMedida: form.idUnidadeMedida ? parseInt(form.idUnidadeMedida) : undefined,
        quantidadeMinima: form.quantidadeMinima ? parseInt(form.quantidadeMinima) : 0,
        ativo: form.ativo === 'true',
        
        // Dados Fiscais
        gtinEan: form.gtinEan || undefined,
        ncm: form.ncm || undefined,
        cfop: form.cfop || undefined,
        cest: form.cest || undefined,
        unidadeComercial: form.unidadeComercial || 'UN',
        unidadeTributavel: form.unidadeTributavel || 'UN',
        origemMercadoria: form.origemMercadoria ? parseInt(form.origemMercadoria) : undefined,
        cstCsosnIcms: form.cstCsosnIcms || undefined,
        aliquotaIcms: form.aliquotaIcms ? parseFloat(form.aliquotaIcms) : undefined,
        cstPis: form.cstPis || undefined,
        aliquotaPis: form.aliquotaPis ? parseFloat(form.aliquotaPis) : undefined,
        cstCofins: form.cstCofins || undefined,
        aliquotaCofins: form.aliquotaCofins ? parseFloat(form.aliquotaCofins) : undefined,
      };

      if (editing) {
        await API.produtos.update(editing.id, data);
      } else {
        await API.produtos.create(data);
      }
      toast.success(editing ? 'Produto atualizado!' : 'Produto criado!');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  const getMarcaNome = (id) => {
    const marca = marcas.find(m => m.id === id);
    return marca?.nome || '—';
  };

  const getSigla = (id) => {
    const unidade = unidades.find(u => u.id === id);
    return unidade?.sigla || '—';
  };

  // Renderização condicional do select de CST/CSOSN
  const renderCstCsosnSelect = () => {
    // Se for Simples Nacional, usa CSOSN, senão usa CST
    const isSimplesNacional = form.regimeTributario === 1 || form.regimeTributario === 2;
    const opcoes = isSimplesNacional ? CSOSN_OPCOES : CST_ICMS_OPCOES;
    
    return (
      <select
        className="form-control"
        value={form.cstCsosnIcms}
        onChange={(e) => setForm({ ...form, cstCsosnIcms: e.target.value })}
      >
        <option value="">— Selecione —</option>
        {opcoes.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  };

  return (
    <>
      <div className="section-header">
        <h1>Produtos</h1>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar">
            <span className="icon">🔍</span>
            <input
              className="form-control"
              placeholder="Buscar produto..."
              style={{ width: 220 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={openNew}>+ Novo Produto</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>GTIN/EAN</th>
              <th>Grupo</th>
              <th>Marca</th>
              <th>Unidade</th>
              <th>Preço Venda</th>
              <th>Estoque</th>
              <th>Situação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos === null && !error && <LoadingRow colSpan={10} />}
            {error && <EmptyRow colSpan={10} message="Erro ao carregar produtos." />}
            {produtos !== null && filtered.length === 0 && <EmptyRow colSpan={10} />}
            {filtered.map((p) => {
              const stock = p.quantidade ?? 0;
              const minStock = p.quantidadeMinima ?? 0;
              let badge = 'badge-success';
              if (stock === 0) badge = 'badge-danger';
              else if (minStock > 0 && stock <= minStock) badge = 'badge-warning';

              return (
                <tr key={p.id}>
                  <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--text-muted)' }}>{p.id}</code></td>
                  <td style={{ fontWeight: 500 }}>{p.nome}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem' }}>{p.gtinEan ?? '—'}</td>
                  <td>{p.descricaoGrupo ?? '—'}</td>
                  <td>{p.nomeMarca ?? getMarcaNome(p.idMarca)}</td>
                  <td>{p.siglaUnidadeMedida ?? getSigla(p.idUnidadeMedida)}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(p.precoVenda)}</td>
                  <td><span className={`badge ${badge}`}>{stock} {p.unidadeComercial || 'UN'}</span></td>
                  <td><StatusBadge ativo={p.ativo} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p.id)}>✏️ Editar</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id, p.nome)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth={820}>
        <h2>{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
        <form onSubmit={handleSubmit}>
          {/* ============================================ */}
          {/* SEÇÃO 1: DADOS BÁSICOS */}
          {/* ============================================ */}
          <div style={{ 
            background: 'var(--bg-surface)', 
            padding: '1rem', 
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            border: '1px solid var(--border)'
          }}>
            <h4 style={{ fontSize: '.875rem', color: 'var(--accent)', marginBottom: '.75rem' }}>
              📦 Dados Básicos
            </h4>

            <div className="grid-2">
              <div className="form-group">
                <label>Nome *</label>
                <input
                  className="form-control"
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>GTIN/EAN</label>
                <input
                  className="form-control"
                  value={form.gtinEan}
                  onChange={(e) => setForm({ ...form, gtinEan: e.target.value })}
                  placeholder="Código de barras"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Descrição</label>
              <textarea
                className="form-control"
                rows={2}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label>Preço de Venda *</label>
                <input
                  className="form-control"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.precoVenda}
                  onChange={(e) => setForm({ ...form, precoVenda: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Preço de Compra *</label>
                <input
                  className="form-control"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.precoCompra}
                  onChange={(e) => setForm({ ...form, precoCompra: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Quantidade *</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  required
                  value={form.quantidade}
                  onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Quantidade Mínima</label>
                <input
                  className="form-control"
                  type="number"
                  min="0"
                  value={form.quantidadeMinima}
                  onChange={(e) => setForm({ ...form, quantidadeMinima: e.target.value })}
                  placeholder="Quantidade para alerta de estoque baixo"
                />
              </div>
              <div className="form-group">
                <label>Situação</label>
                <select
                  className="form-control"
                  value={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.value })}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* SEÇÃO 2: RELACIONAMENTOS */}
          {/* ============================================ */}
          <div style={{ 
            background: 'var(--bg-surface)', 
            padding: '1rem', 
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            border: '1px solid var(--border)'
          }}>
            <h4 style={{ fontSize: '.875rem', color: 'var(--accent)', marginBottom: '.75rem' }}>
              🔗 Relacionamentos
            </h4>

            <div className="grid-2">
              <div className="form-group">
                <label>Grupo/Categoria *</label>
                <select
                  className="form-control"
                  required
                  value={form.idGrupo}
                  onChange={(e) => setForm({ ...form, idGrupo: e.target.value })}
                >
                  <option value="">— Selecione —</option>
                  {grupos.map((g) => (
                    <option key={g.id} value={g.id}>{g.descricao}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Fornecedor *</label>
                <select
                  className="form-control"
                  required
                  value={form.idFornecedor}
                  onChange={(e) => setForm({ ...form, idFornecedor: e.target.value })}
                >
                  <option value="">— Selecione —</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>{f.nomeCompleto}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Marca</label>
                <select
                  className="form-control"
                  value={form.idMarca}
                  onChange={(e) => setForm({ ...form, idMarca: e.target.value })}
                >
                  <option value="">— Selecione —</option>
                  {marcas.map((m) => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Unidade de Medida</label>
                <select
                  className="form-control"
                  value={form.idUnidadeMedida}
                  onChange={(e) => setForm({ ...form, idUnidadeMedida: e.target.value })}
                >
                  <option value="">— Selecione —</option>
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>{u.sigla} - {u.descricao}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* SEÇÃO 3: DADOS FISCAIS */}
          {/* ============================================ */}
          <div style={{ 
            background: 'var(--bg-surface)', 
            padding: '1rem', 
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            border: '1px solid var(--border)'
          }}>
            <h4 style={{ fontSize: '.875rem', color: 'var(--accent)', marginBottom: '.75rem' }}>
              📄 Dados Fiscais (NFe/NFC-e)
            </h4>

            {/* NCM, CFOP, CEST */}
            <div className="grid-3">
              <div className="form-group">
                <label>NCM</label>
                <input
                  className="form-control"
                  value={form.ncm}
                  onChange={(e) => setForm({ ...form, ncm: e.target.value })}
                  placeholder="Ex: 8517.12.00"
                />
              </div>
              <div className="form-group">
                <label>CFOP</label>
                <input
                  className="form-control"
                  value={form.cfop}
                  onChange={(e) => setForm({ ...form, cfop: e.target.value })}
                  placeholder="Ex: 5102"
                />
              </div>
              <div className="form-group">
                <label>CEST</label>
                <input
                  className="form-control"
                  value={form.cest}
                  onChange={(e) => setForm({ ...form, cest: e.target.value })}
                  placeholder="Ex: 28.001.00"
                />
              </div>
            </div>

            {/* Unidades Comercial e Tributável */}
            <div className="grid-2">
              <div className="form-group">
                <label>Unidade Comercial</label>
                <input
                  className="form-control"
                  value={form.unidadeComercial}
                  onChange={(e) => setForm({ ...form, unidadeComercial: e.target.value })}
                  placeholder="UN, KG, LT..."
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '.75rem' }}>
                  Unidade usada na venda (ex: UN, KG, LT)
                </small>
              </div>
              <div className="form-group">
                <label>Unidade Tributável</label>
                <input
                  className="form-control"
                  value={form.unidadeTributavel}
                  onChange={(e) => setForm({ ...form, unidadeTributavel: e.target.value })}
                  placeholder="UN, KG, LT..."
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '.75rem' }}>
                  Unidade usada para tributação (ex: UN, KG, LT)
                </small>
              </div>
            </div>

            {/* Origem da Mercadoria */}
            <div className="form-group">
              <label>Origem da Mercadoria</label>
              <select
                className="form-control"
                value={form.origemMercadoria}
                onChange={(e) => setForm({ ...form, origemMercadoria: e.target.value })}
              >
                <option value="">— Selecione —</option>
                {ORIGENS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* ICMS */}
            <div style={{ 
              marginTop: '.75rem', 
              paddingTop: '.75rem', 
              borderTop: '1px solid var(--border)' 
            }}>
              <h5 style={{ fontSize: '.8rem', color: 'var(--text-secondary)', marginBottom: '.5rem' }}>
                ICMS
              </h5>
              <div className="grid-2">
                <div className="form-group">
                  <label>CST / CSOSN ICMS</label>
                  {renderCstCsosnSelect()}
                </div>
                <div className="form-group">
                  <label>Alíquota ICMS (%)</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.aliquotaIcms}
                    onChange={(e) => setForm({ ...form, aliquotaIcms: e.target.value })}
                    placeholder="Ex: 18.00"
                  />
                </div>
              </div>
            </div>

            {/* PIS */}
            <div style={{ 
              marginTop: '.75rem', 
              paddingTop: '.75rem', 
              borderTop: '1px solid var(--border)' 
            }}>
              <h5 style={{ fontSize: '.8rem', color: 'var(--text-secondary)', marginBottom: '.5rem' }}>
                PIS
              </h5>
              <div className="grid-2">
                <div className="form-group">
                  <label>CST PIS</label>
                  <select
                    className="form-control"
                    value={form.cstPis}
                    onChange={(e) => setForm({ ...form, cstPis: e.target.value })}
                  >
                    <option value="">— Selecione —</option>
                    {CST_PIS_COFINS_OPCOES.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Alíquota PIS (%)</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.aliquotaPis}
                    onChange={(e) => setForm({ ...form, aliquotaPis: e.target.value })}
                    placeholder="Ex: 1.65"
                  />
                </div>
              </div>
            </div>

            {/* COFINS */}
            <div style={{ 
              marginTop: '.75rem', 
              paddingTop: '.75rem', 
              borderTop: '1px solid var(--border)' 
            }}>
              <h5 style={{ fontSize: '.8rem', color: 'var(--text-secondary)', marginBottom: '.5rem' }}>
                COFINS
              </h5>
              <div className="grid-2">
                <div className="form-group">
                  <label>CST COFINS</label>
                  <select
                    className="form-control"
                    value={form.cstCofins}
                    onChange={(e) => setForm({ ...form, cstCofins: e.target.value })}
                  >
                    <option value="">— Selecione —</option>
                    {CST_PIS_COFINS_OPCOES.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Alíquota COFINS (%)</label>
                  <input
                    className="form-control"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.aliquotaCofins}
                    onChange={(e) => setForm({ ...form, aliquotaCofins: e.target.value })}
                    placeholder="Ex: 7.60"
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" /> Aguarde...</> : (editing ? 'Salvar' : 'Criar')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmState.open}
        name={confirmState.name}
        onCancel={cancelConfirm}
        onConfirm={confirmState.onConfirm}
      />
    </>
  );
}