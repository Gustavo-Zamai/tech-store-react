// pages/Produtos.jsx

import { useEffect, useMemo, useState } from 'react';
import API from '../api/api';
import { formatCurrency } from '../utils/format';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useConfirm } from '../components/useConfirm';
import { LoadingRow, EmptyRow, StatusBadge } from '../components/TableHelpers';

const emptyForm = {
  nome: '', 
  precoVenda: '', 
  precoCompra: '',
  quantidade: '', 
  quantidadeMinima: '',
  idCategoria: '', 
  idFornecedor: '', 
  descricao: '', 
  ativo: 'true',
  gtinEan: '',
  unidadeComercial: 'UN',
  unidadeTributavel: 'UN',
  // Campos fiscais
  ncm: '',
  cfop: '',
  cest: '',
  origemMercadoria: '',
  cstCsosnIcms: '',
  aliquotaIcms: '',
  cstPis: '',
  aliquotaPis: '',
  cstCofins: '',
  aliquotaCofins: '',
  // ---------- IBS / CBS / Imposto Seletivo ----------
  cstIbsCbs: '',
  cClassTrib: '',
  cBenef: '',
  aliquotaIbsEstadual: '',
  aliquotaIbsMunicipal: '',
  aliquotaCbs: '',
  sujeitoImpostoSeletivo: 'false',
  aliquotaImpostoSeletivo: '',
};

const UNIDADES_MEDIDA = ['UN', 'KG', 'LT', 'MT', 'M2', 'CX', 'PC', 'PCT'];

const ORIGENS_MERCADORIA = [
  { value: 0, label: 'Nacional' },
  { value: 1, label: 'Estrangeira - Importação direta' },
  { value: 2, label: 'Estrangeira - Adquirida no mercado interno' },
  { value: 3, label: 'Estrangeira - Importação direta sem similar nacional' },
  { value: 4, label: 'Estrangeira - Adquirida no mercado interno sem similar nacional' },
  { value: 5, label: 'Estrangeira - Importação direta com similar nacional' },
  { value: 6, label: 'Estrangeira - Adquirida no mercado interno com similar nacional' },
  { value: 7, label: 'Estrangeira - Importação direta de bem usado' },
  { value: 8, label: 'Estrangeira - Adquirida no mercado interno de bem usado' },
];

// Opções para CST IBS/CBS (Grupo UB)
const CST_IBS_CBS_OPCOES = [
  { value: '100', label: '100 - Tributado Integralmente' },
  { value: '110', label: '110 - Tributado com Alíquota Zero' },
  { value: '120', label: '120 - Isento' },
  { value: '130', label: '130 - Imune' },
  { value: '140', label: '140 - Suspenso' },
  { value: '150', label: '150 - Diferimento' },
  { value: '160', label: '160 - Não Tributado' },
  { value: '410', label: '410 - Não Alíquotas (ST)' },
  { value: '420', label: '420 - Substituição Tributária' },
];

// Opções para cClassTrib (detalhamento do CST)
const CCLASS_TRIB_OPCOES = [
  { value: '0101', label: '0101 - Artigo 1º, Inciso I' },
  { value: '0102', label: '0102 - Artigo 1º, Inciso II' },
  { value: '0103', label: '0103 - Artigo 1º, Inciso III' },
  { value: '0201', label: '0201 - Artigo 2º, Inciso I' },
  { value: '0202', label: '0202 - Artigo 2º, Inciso II' },
  { value: '0301', label: '0301 - Artigo 3º, Inciso I' },
  { value: '0302', label: '0302 - Artigo 3º, Inciso II' },
  { value: '0401', label: '0401 - Artigo 4º, Inciso I' },
  { value: '0402', label: '0402 - Artigo 4º, Inciso II' },
  { value: '0501', label: '0501 - Artigo 5º, Inciso I' },
  { value: '0502', label: '0502 - Artigo 5º, Inciso II' },
  { value: '0601', label: '0601 - Artigo 6º, Inciso I' },
  { value: '0602', label: '0602 - Artigo 6º, Inciso II' },
  { value: '0701', label: '0701 - Artigo 7º, Inciso I' },
  { value: '0702', label: '0702 - Artigo 7º, Inciso II' },
  { value: '0801', label: '0801 - Artigo 8º, Inciso I' },
  { value: '0802', label: '0802 - Artigo 8º, Inciso II' },
  { value: '0901', label: '0901 - Artigo 9º, Inciso I' },
  { value: '0902', label: '0902 - Artigo 9º, Inciso II' },
  { value: '1001', label: '1001 - Artigo 10, Inciso I' },
  { value: '1002', label: '1002 - Artigo 10, Inciso II' },
  { value: '1101', label: '1101 - Artigo 11, Inciso I' },
  { value: '1102', label: '1102 - Artigo 11, Inciso II' },
  { value: '1201', label: '1201 - Artigo 12, Inciso I' },
  { value: '1202', label: '1202 - Artigo 12, Inciso II' },
  { value: '1301', label: '1301 - Artigo 13, Inciso I' },
  { value: '1302', label: '1302 - Artigo 13, Inciso II' },
];

export default function Produtos() {
  const toast = useToast();
  // Renomeado de 'produtos' para 'produtosList' para evitar conflito
  const [produtosList, setProdutosList] = useState(null);
  const [error, setError] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showFiscalFields, setShowFiscalFields] = useState(false);

  const { confirmState, requestConfirm, cancelConfirm } = useConfirm();

  const loadAll = async () => {
    const [prods, cats, fors] = await Promise.allSettled([
      API.produtos.list(), 
      API.categorias.list(), 
      API.fornecedores.list(),
    ]);
    if (prods.status === 'fulfilled') { 
      setProdutosList(prods.value || []); 
      setError(false); 
    } else { 
      setError(true); 
    }
    if (cats.status === 'fulfilled') setCategorias(cats.value || []);
    if (fors.status === 'fulfilled') setFornecedores(fors.value || []);
  };

  useEffect(() => { loadAll(); }, []);

  const filtered = useMemo(() => {
    if (!produtosList) return [];
    const q = search.toLowerCase().trim();
    if (!q) return produtosList;
    return produtosList.filter((p) => 
      p.nome?.toLowerCase().includes(q) || 
      p.gtinEan?.includes(q) ||
      p.descricao?.toLowerCase().includes(q)
    );
  }, [produtosList, search]);

  const openNew = () => { 
    setEditing(null); 
    setForm(emptyForm); 
    setShowFiscalFields(false);
    setModalOpen(true); 
  };

  const openEdit = async (id) => {
    try {
      const p = await API.produtos.get(id);
      setEditing(p);
      setForm({
        nome: p.nome ?? '',
        precoVenda: p.precoVenda ?? '',
        precoCompra: p.precoCompra ?? '',
        quantidade: p.quantidade ?? '',
        quantidadeMinima: p.quantidadeMinima ?? '',
        idCategoria: p.idCategoria ?? '',
        idFornecedor: p.idFornecedor ?? '',
        descricao: p.descricao ?? '',
        ativo: p.ativo === false ? 'false' : 'true',
        gtinEan: p.gtinEan ?? '',
        unidadeComercial: p.unidadeComercial ?? 'UN',
        unidadeTributavel: p.unidadeTributavel ?? 'UN',
        ncm: p.ncm ?? '',
        cfop: p.cfop ?? '',
        cest: p.cest ?? '',
        origemMercadoria: p.origemMercadoria ?? '',
        cstCsosnIcms: p.cstCsosnIcms ?? '',
        aliquotaIcms: p.aliquotaIcms ?? '',
        cstPis: p.cstPis ?? '',
        aliquotaPis: p.aliquotaPis ?? '',
        cstCofins: p.cstCofins ?? '',
        aliquotaCofins: p.aliquotaCofins ?? '',
        // ---------- IBS / CBS / Imposto Seletivo ----------
        cstIbsCbs: p.cstIbsCbs ?? '',
        cClassTrib: p.cClassTrib ?? '',
        cBenef: p.cBenef ?? '',
        aliquotaIbsEstadual: p.aliquotaIbsEstadual ?? '',
        aliquotaIbsMunicipal: p.aliquotaIbsMunicipal ?? '',
        aliquotaCbs: p.aliquotaCbs ?? '',
        sujeitoImpostoSeletivo: p.sujeitoImpostoSeletivo ? 'true' : 'false',
        aliquotaImpostoSeletivo: p.aliquotaImpostoSeletivo ?? '',
      });
      setShowFiscalFields(true);
      setModalOpen(true);
    } catch (err) {
      toast.error('Erro ao carregar produto');
      console.error(err);
    }
  };

  const handleDelete = (id, nome) => requestConfirm(nome, async () => {
    try { 
      await API.produtos.delete(id); 
      toast.success('Produto excluído!'); 
      loadAll(); 
    } catch (e) { 
      toast.error(e.message); 
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        nome: form.nome,
        precoVenda: parseFloat(form.precoVenda) || 0,
        precoCompra: parseFloat(form.precoCompra) || 0,
        quantidade: parseInt(form.quantidade, 10) || 0,
        quantidadeMinima: form.quantidadeMinima ? parseInt(form.quantidadeMinima, 10) : 0,
        idCategoria: form.idCategoria ? parseInt(form.idCategoria) : undefined,
        idFornecedor: form.idFornecedor ? parseInt(form.idFornecedor) : undefined,
        descricao: form.descricao || undefined,
        ativo: form.ativo === 'true',
        gtinEan: form.gtinEan || undefined,
        unidadeComercial: form.unidadeComercial || 'UN',
        unidadeTributavel: form.unidadeTributavel || 'UN',
        ncm: form.ncm || undefined,
        cfop: form.cfop || undefined,
        cest: form.cest || undefined,
        origemMercadoria: form.origemMercadoria ? parseInt(form.origemMercadoria) : undefined,
        cstCsosnIcms: form.cstCsosnIcms || undefined,
        aliquotaIcms: form.aliquotaIcms ? parseFloat(form.aliquotaIcms) : undefined,
        cstPis: form.cstPis || undefined,
        aliquotaPis: form.aliquotaPis ? parseFloat(form.aliquotaPis) : undefined,
        cstCofins: form.cstCofins || undefined,
        aliquotaCofins: form.aliquotaCofins ? parseFloat(form.aliquotaCofins) : undefined,
        // ---------- IBS / CBS / Imposto Seletivo ----------
        cstIbsCbs: form.cstIbsCbs || undefined,
        cClassTrib: form.cClassTrib || undefined,
        cBenef: form.cBenef || undefined,
        aliquotaIbsEstadual: form.aliquotaIbsEstadual ? parseFloat(form.aliquotaIbsEstadual) : undefined,
        aliquotaIbsMunicipal: form.aliquotaIbsMunicipal ? parseFloat(form.aliquotaIbsMunicipal) : undefined,
        aliquotaCbs: form.aliquotaCbs ? parseFloat(form.aliquotaCbs) : undefined,
        sujeitoImpostoSeletivo: form.sujeitoImpostoSeletivo === 'true',
        aliquotaImpostoSeletivo: form.aliquotaImpostoSeletivo ? parseFloat(form.aliquotaImpostoSeletivo) : undefined,
      };
      
      if (editing) {
        await API.produtos.update(editing.id, data);
      } else {
        await API.produtos.create(data);
      }
      toast.success(editing ? 'Produto atualizado!' : 'Produto criado!');
      setModalOpen(false);
      loadAll();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  };

  // Verifica se o produto está com estoque baixo
  const getEstoqueBadge = (produto) => {
    const estoque = produto.quantidade ?? 0;
    const minimo = produto.quantidadeMinima ?? 0;
    
    if (estoque === 0) return 'badge-danger';
    if (minimo > 0 && estoque <= minimo) return 'badge-warning';
    return 'badge-success';
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
              <th>Categoria</th>
              <th>Fornecedor</th>
              <th>Preço Venda</th>
              <th>Estoque</th>
              <th>Unid.</th>
              <th>Situação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtosList === null && !error && <LoadingRow colSpan={10} />}
            {error && <EmptyRow colSpan={10} message="Erro ao carregar produtos." />}
            {produtosList !== null && filtered.length === 0 && <EmptyRow colSpan={10} />}
            {filtered.map((p) => {
              const stock = p.quantidade ?? 0;
              return (
                <tr key={p.id}>
                  <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--text-muted)' }}>{p.id}</code></td>
                  <td style={{ fontWeight: 500 }}>{p.nome}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem' }}>{p.gtinEan ?? '—'}</td>
                  <td>{p.descricaoCategoria ?? '—'}</td>
                  <td>{p.nomeFornecedor ?? '—'}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(p.precoVenda)}</td>
                  <td>
                    <span className={`badge ${getEstoqueBadge(p)}`}>
                      {stock} {p.unidadeComercial || 'UN'}
                    </span>
                  </td>
                  <td>{p.unidadeComercial || 'UN'}</td>
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
          {/* Dados Básicos */}
          <div className="form-group">
            <label>Nome *</label>
            <input className="form-control" required value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>GTIN/EAN (Código de Barras)</label>
              <input className="form-control" value={form.gtinEan}
                onChange={(e) => setForm({ ...form, gtinEan: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Unidade Comercial</label>
              <select className="form-control" value={form.unidadeComercial}
                onChange={(e) => setForm({ ...form, unidadeComercial: e.target.value })}>
                {UNIDADES_MEDIDA.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label>Preço de Venda *</label>
              <input className="form-control" type="number" step="0.01" min="0" required
                value={form.precoVenda} onChange={(e) => setForm({ ...form, precoVenda: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Preço de Compra *</label>
              <input className="form-control" type="number" step="0.01" min="0" required
                value={form.precoCompra} onChange={(e) => setForm({ ...form, precoCompra: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Quantidade em Estoque *</label>
              <input className="form-control" type="number" min="0" required
                value={form.quantidade} onChange={(e) => setForm({ ...form, quantidade: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label>Quantidade Mínima (alerta)</label>
            <input className="form-control" type="number" min="0"
              value={form.quantidadeMinima} onChange={(e) => setForm({ ...form, quantidadeMinima: e.target.value })} 
              placeholder="Quantidade mínima para alerta" />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Categoria *</label>
              <select className="form-control" required value={form.idCategoria}
                onChange={(e) => setForm({ ...form, idCategoria: e.target.value })}>
                <option value="">— Selecione —</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.descricao}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Fornecedor *</label>
              <select className="form-control" required value={form.idFornecedor}
                onChange={(e) => setForm({ ...form, idFornecedor: e.target.value })}>
                <option value="">— Selecione —</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>{f.nomeCompleto}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Descrição</label>
            <textarea className="form-control" rows={2} value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>

          {/* Botão para mostrar/ocultar dados fiscais */}
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={() => setShowFiscalFields(!showFiscalFields)}
            style={{ marginBottom: '1rem' }}
          >
            {showFiscalFields ? '▼ Ocultar' : '▶ Mostrar'} Dados Fiscais
          </button>

          {showFiscalFields && (
            <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
              {/* ICMS / PIS / COFINS */}
              <h4 style={{ fontSize: '.875rem', marginBottom: '.75rem', color: 'var(--text-secondary)' }}>ICMS / PIS / COFINS</h4>
              
              <div className="grid-3">
                <div className="form-group">
                  <label>NCM</label>
                  <input className="form-control" value={form.ncm}
                    onChange={(e) => setForm({ ...form, ncm: e.target.value })} placeholder="Ex: 8517.12.00" />
                </div>
                <div className="form-group">
                  <label>CFOP</label>
                  <input className="form-control" value={form.cfop}
                    onChange={(e) => setForm({ ...form, cfop: e.target.value })} placeholder="Ex: 5102" />
                </div>
                <div className="form-group">
                  <label>CEST</label>
                  <input className="form-control" value={form.cest}
                    onChange={(e) => setForm({ ...form, cest: e.target.value })} placeholder="Ex: 01.001.00" />
                </div>
              </div>

              <div className="form-group">
                <label>Origem da Mercadoria</label>
                <select className="form-control" value={form.origemMercadoria}
                  onChange={(e) => setForm({ ...form, origemMercadoria: e.target.value })}>
                  <option value="">— Selecione —</option>
                  {ORIGENS_MERCADORIA.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>CST/CSOSN ICMS</label>
                  <input className="form-control" value={form.cstCsosnIcms}
                    onChange={(e) => setForm({ ...form, cstCsosnIcms: e.target.value })} placeholder="Ex: 500" />
                </div>
                <div className="form-group">
                  <label>Alíquota ICMS (%)</label>
                  <input className="form-control" type="number" step="0.01" min="0" max="100" value={form.aliquotaIcms}
                    onChange={(e) => setForm({ ...form, aliquotaIcms: e.target.value })} placeholder="Ex: 18.00" />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label>CST PIS</label>
                  <input className="form-control" value={form.cstPis}
                    onChange={(e) => setForm({ ...form, cstPis: e.target.value })} placeholder="Ex: 01" />
                </div>
                <div className="form-group">
                  <label>Alíquota PIS (%)</label>
                  <input className="form-control" type="number" step="0.01" min="0" max="100" value={form.aliquotaPis}
                    onChange={(e) => setForm({ ...form, aliquotaPis: e.target.value })} placeholder="Ex: 1.65" />
                </div>
                <div className="form-group">
                  <label>Alíquota COFINS (%)</label>
                  <input className="form-control" type="number" step="0.01" min="0" max="100" value={form.aliquotaCofins}
                    onChange={(e) => setForm({ ...form, aliquotaCofins: e.target.value })} placeholder="Ex: 7.60" />
                </div>
              </div>

              <hr style={{ borderColor: 'var(--border)', margin: '1rem 0' }} />

              {/* IBS / CBS / Imposto Seletivo - Reforma Tributária */}
              <h4 style={{ fontSize: '.875rem', marginBottom: '.75rem', color: 'var(--accent)' }}>
                🏛️ IBS / CBS / Imposto Seletivo (Reforma Tributária - LC 214/2025)
              </h4>
              <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: '.75rem' }}>
                Obrigatório desde jan/2026. Validações plenas a partir de 03/08/2026 para Regime Normal (CRT=3).
              </p>

              <div className="grid-3">
                <div className="form-group">
                  <label>CST IBS/CBS</label>
                  <select className="form-control" value={form.cstIbsCbs}
                    onChange={(e) => setForm({ ...form, cstIbsCbs: e.target.value })}>
                    <option value="">— Selecione —</option>
                    {CST_IBS_CBS_OPCOES.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>cClassTrib (Detalhamento CST)</label>
                  <select className="form-control" value={form.cClassTrib}
                    onChange={(e) => setForm({ ...form, cClassTrib: e.target.value })}>
                    <option value="">— Selecione —</option>
                    {CCLASS_TRIB_OPCOES.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>cBenef (Cód. Benefício Fiscal)</label>
                  <input className="form-control" value={form.cBenef}
                    onChange={(e) => setForm({ ...form, cBenef: e.target.value })} 
                    placeholder="Ex: 123456" />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label>Alíq. IBS Estadual (%)</label>
                  <input className="form-control" type="number" step="0.001" min="0" value={form.aliquotaIbsEstadual}
                    onChange={(e) => setForm({ ...form, aliquotaIbsEstadual: e.target.value })} 
                    placeholder="Ex: 8.000" />
                </div>
                <div className="form-group">
                  <label>Alíq. IBS Municipal (%)</label>
                  <input className="form-control" type="number" step="0.001" min="0" value={form.aliquotaIbsMunicipal}
                    onChange={(e) => setForm({ ...form, aliquotaIbsMunicipal: e.target.value })} 
                    placeholder="Ex: 3.000" />
                </div>
                <div className="form-group">
                  <label>Alíq. CBS (%)</label>
                  <input className="form-control" type="number" step="0.001" min="0" value={form.aliquotaCbs}
                    onChange={(e) => setForm({ ...form, aliquotaCbs: e.target.value })} 
                    placeholder="Ex: 7.000" />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Sujeito a Imposto Seletivo ("Imposto do Pecado")</label>
                  <select className="form-control" value={form.sujeitoImpostoSeletivo}
                    onChange={(e) => setForm({ ...form, sujeitoImpostoSeletivo: e.target.value })}>
                    <option value="false">Não</option>
                    <option value="true">Sim (cigarro, bebidas, veículos poluentes, etc)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Alíq. Imposto Seletivo (%)</label>
                  <input className="form-control" type="number" step="0.001" min="0" value={form.aliquotaImpostoSeletivo}
                    onChange={(e) => setForm({ ...form, aliquotaImpostoSeletivo: e.target.value })} 
                    placeholder="Ex: 15.000" />
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Situação</label>
            <select className="form-control" value={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.value })}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem', marginTop: '1rem' }}>
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