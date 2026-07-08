// pages/Fornecedores.jsx

import { useEffect, useMemo, useState } from 'react';
import API from '../api/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import AddressFields from '../components/AddressFields';
import { useConfirm } from '../components/useConfirm';
import { LoadingRow, EmptyRow, StatusBadge } from '../components/TableHelpers';

const emptyForm = {
  nomeCompleto: '', 
  cnpj: '', 
  email: '', 
  telefone: '',
  celular: '',
  endereco: '', 
  numero: '', 
  cep: '', 
  bairro: '', 
  cidade: '', 
  estado: '',
  site: '',
  observacao: '',
  ativo: 'true',
  categoria: '',
};

export default function Fornecedores() {
  const toast = useToast();
  const [fornecedores, setFornecedores] = useState(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { confirmState, requestConfirm, cancelConfirm } = useConfirm();

  const load = async () => {
    try {
      const data = await API.fornecedores.list();
      setFornecedores(data || []);
      setError(false);
    } catch {
      setError(true);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!fornecedores) return [];
    const q = search.toLowerCase().trim();
    if (!q) return fornecedores;
    return fornecedores.filter((f) => 
      f.nomeCompleto?.toLowerCase().includes(q) || 
      f.cnpj?.includes(q) ||
      f.email?.toLowerCase().includes(q) ||
      f.categoria?.toLowerCase().includes(q)
    );
  }, [fornecedores, search]);

  const openNew = () => { 
    setEditing(null); 
    setForm(emptyForm); 
    setModalOpen(true); 
  };

  const openEdit = async (id) => {
    try {
      const f = await API.fornecedores.get(id);
      setEditing(f);
      setForm({
        nomeCompleto: f.nomeCompleto ?? '',
        cnpj: f.cnpj ?? '',
        email: f.email ?? '',
        telefone: f.telefone ?? '',
        celular: f.celular ?? '',
        endereco: f.endereco ?? '',
        numero: f.numero ?? '',
        cep: f.cep ?? '',
        bairro: f.bairro ?? '',
        cidade: f.cidade ?? '',
        estado: f.estado ?? '',
        site: f.site ?? '',
        observacao: f.observacao ?? '',
        ativo: f.ativo === false ? 'false' : 'true',
        categoria: f.categoria ?? '',
      });
      setModalOpen(true);
    } catch (err) {
      toast.error('Erro ao carregar fornecedor');
      console.error(err);
    }
  };

  const handleDelete = (id, nome) => requestConfirm(nome, async () => {
    try { 
      await API.fornecedores.delete(id); 
      toast.success('Fornecedor excluído!'); 
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
        ...form, 
        ativo: form.ativo === 'true',
        numero: form.numero ? parseInt(form.numero) : undefined,
      };
      
      if (editing) {
        await API.fornecedores.update(editing.id, data);
      } else {
        await API.fornecedores.create(data);
      }
      toast.success(editing ? 'Fornecedor atualizado!' : 'Fornecedor criado!');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar fornecedor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="section-header">
        <h1>Fornecedores</h1>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <div className="search-bar">
            <span className="icon">🔍</span>
            <input className="form-control" placeholder="Buscar fornecedor..." style={{ width: 220 }}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openNew}>+ Novo Fornecedor</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>CNPJ</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Categoria</th>
              <th>Situação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {fornecedores === null && !error && <LoadingRow colSpan={8} />}
            {error && <EmptyRow colSpan={8} message="Erro ao carregar fornecedores." />}
            {fornecedores !== null && filtered.length === 0 && <EmptyRow colSpan={8} />}
            {filtered.map((f) => (
              <tr key={f.id}>
                <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--text-muted)' }}>{f.id}</code></td>
                <td style={{ fontWeight: 500 }}>{f.nomeCompleto}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.85rem' }}>{f.cnpj ?? '—'}</td>
                <td>{f.email ?? '—'}</td>
                <td>{f.telefone ?? f.celular ?? '—'}</td>
                <td>{f.categoria ?? '—'}</td>
                <td><StatusBadge ativo={f.ativo} /></td>
                <td>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(f.id)}>✏️ Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f.id, f.nomeCompleto)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth={640}>
        <h2>{editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome *</label>
            <input className="form-control" required value={form.nomeCompleto}
              onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })} />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>CNPJ</label>
              <input className="form-control" value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Categoria</label>
              <input className="form-control" value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })} 
                placeholder="Ex: Eletrônicos, Alimentos..." />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Telefone</label>
              <input className="form-control" value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Celular</label>
              <input className="form-control" value={form.celular}
                onChange={(e) => setForm({ ...form, celular: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Site</label>
            <input className="form-control" type="url" value={form.site}
              onChange={(e) => setForm({ ...form, site: e.target.value })} />
          </div>

          <AddressFields form={form} setForm={setForm} />

          <div className="form-group">
            <label>Observação</label>
            <textarea className="form-control" rows={2} value={form.observacao}
              onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
          </div>

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