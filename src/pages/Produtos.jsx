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
  preco: '', 
  precoCusto: '',
  quantidadeEstoque: '', 
  estoqueMinimo: '',
  idCategoria: '', 
  idFornecedor: '', 
  descricao: '', 
  ativo: 'true',
  codigoBarras: '',
  unidadeMedida: '',
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

export default function Produtos() {
  const toast = useToast();
  const [produtos, setProdutos] = useState(null);
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
      setProdutos(prods.value || []); 
      setError(false); 
    } else { 
      setError(true); 
    }
    if (cats.status === 'fulfilled') setCategorias(cats.value || []);
    if (fors.status === 'fulfilled') setFornecedores(fors.value || []);
  };

  useEffect(() => { loadAll(); }, []);

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
    setShowFiscalFields(false);
    setModalOpen(true); 
  };

  const openEdit = async (id) => {
    try {
      const p = await API.produtos.get(id);
      setEditing(p);
      setForm({
        nome: p.nome ?? '',
        preco: p.precoVenda ?? '',
        precoCusto: p.precoCompra ?? '',
        quantidadeEstoque: p.quantidade ?? '',
        estoqueMinimo: p.quantidadeMinima ?? '',
        idCategoria: p.idCategoria ?? '',
        idFornecedor: p.idFornecedor ?? '',
        descricao: p.descricao ?? '',
        ativo: p.ativo === false ? 'false' : 'true',
        codigoBarras: p.gtinEan ?? '',
        unidadeMedida: p.unidadeComercial ?? 'UN',
        // Campos fiscais
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
        preco: parseFloat(form.preco),
        precoCusto: form.precoCusto ? parseFloat(form.precoCusto) : 0,
        quantidadeEstoque: parseInt(form.quantidadeEstoque, 10) || 0,
        estoqueMinimo: form.estoqueMinimo ? parseInt(form.estoqueMinimo, 10) : 0,
        idCategoria: form.idCategoria || undefined,
        idFornecedor: form.idFornecedor || undefined,
        descricao: form.descricao || undefined,
        ativo: form.ativo === 'true',
        codigoBarras: form.codigoBarras || undefined,
        unidadeMedida: form.unidadeMedida || 'UN',
        // Campos fiscais
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
              <th>Cód. Barras</th>
              <th>Categoria</th>
              <th>Fornecedor</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Unid.</th>
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
              return (
                <tr key={p.id}>
                  <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--text-muted)' }}>{p.id}</code></td>
                  <td style={{ fontWeight: 500 }}>{p.nome}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem' }}>{p.gtinEan ?? '—'}</td>
                  <td>{p.descricaoCategoria ?? p.categoria?.descricao ?? '—'}</td>
                  <td>{p.nomeFornecedor ?? p.fornecedor?.nomeCompleto ?? '—'}</td>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth={720}>
        <h2>{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome *</label>
            <input className="form-control" required value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Código de Barras (GTIN/EAN)</label>
              <input className="form-control" value={form.codigoBarras}
                onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Unidade de Medida</label>
              <select className="form-control" value={form.unidadeMedida}
                onChange={(e) => setForm({ ...form, unidadeMedida: e.target.value })}>
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
                value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Preço de Compra *</label>
              <input className="form-control" type="number" step="0.01" min="0" required
                value={form.precoCusto} onChange={(e) => setForm({ ...form, precoCusto: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Quantidade em Estoque *</label>
              <input className="form-control" type="number" min="0" required
                value={form.quantidadeEstoque} onChange={(e) => setForm({ ...form, quantidadeEstoque: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label>Estoque Mínimo</label>
            <input className="form-control" type="number" min="0"
              value={form.estoqueMinimo} onChange={(e) => setForm({ ...form, estoqueMinimo: e.target.value })} 
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
              <h4 style={{ fontSize: '.875rem', marginBottom: '.75rem', color: 'var(--text-secondary)' }}>Dados Fiscais</h4>
              
              <div className="grid-3">
                <div className="form-group">
                  <label>NCM</label>
                  <input className="form-control" value={form.ncm}
                    onChange={(e) => setForm({ ...form, ncm: e.target.value })} placeholder="Ex: 8504.40.90" />
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
                    onChange={(e) => setForm({ ...form, cstPis: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Alíquota PIS (%)</label>
                  <input className="form-control" type="number" step="0.01" min="0" max="100" value={form.aliquotaPis}
                    onChange={(e) => setForm({ ...form, aliquotaPis: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Alíquota COFINS (%)</label>
                  <input className="form-control" type="number" step="0.01" min="0" max="100" value={form.aliquotaCofins}
                    onChange={(e) => setForm({ ...form, aliquotaCofins: e.target.value })} />
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