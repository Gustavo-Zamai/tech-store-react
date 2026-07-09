// pages/Categorias.jsx

import { useEffect, useMemo, useState } from 'react';
import API from '../api/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useConfirm } from '../components/useConfirm';
import { formatDateDisplay } from '../utils/format';
import { LoadingRow, EmptyRow, StatusBadge } from '../components/TableHelpers';

const emptyForm = { 
  descricao: '', 
  ativo: 'true',
};

export default function Categorias() {
  const toast = useToast();
  const [categorias, setCategorias] = useState(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { confirmState, requestConfirm, cancelConfirm } = useConfirm();

  const load = async () => {
    try {
      const data = await API.categorias.list();
      setCategorias(data || []);
      setError(false);
    } catch (e) {
      console.error('Erro ao carregar categorias:', e);
      setError(true);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!categorias) return [];
    const q = search.toLowerCase().trim();
    if (!q) return categorias;
    return categorias.filter((c) => 
      c.descricao?.toLowerCase().includes(q)
    );
  }, [categorias, search]);

  const openNew = () => { 
    setEditing(null); 
    setForm(emptyForm); 
    setModalOpen(true); 
  };

  const openEdit = async (id) => {
    try {
      const c = await API.categorias.get(id);
      setEditing(c);
      setForm({ 
        descricao: c.descricao ?? '', 
        ativo: c.ativo === false ? 'false' : 'true',
      });
      setModalOpen(true);
    } catch {
      toast.error('Erro ao carregar categoria para edição');
    }
  };

  const handleDelete = (id, descricao) => requestConfirm(descricao, async () => {
    try { 
      await API.categorias.delete(id); 
      toast.success('Categoria excluída!'); 
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
        descricao: form.descricao, 
        ativo: form.ativo === 'true',
      };
      
      if (editing) {
        await API.categorias.update(editing.id, data);
      } else {
        await API.categorias.create(data);
      }
      toast.success(editing ? 'Categoria atualizada!' : 'Categoria criada!');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar categoria');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="section-header">
        <h1>Categorias</h1>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <div className="search-bar">
            <span className="icon">🔍</span>
            <input className="form-control" placeholder="Buscar categoria..." style={{ width: 220 }}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openNew}>+ Nova Categoria</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Descrição</th>
              <th>Situação</th>
              <th>Data Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {categorias === null && !error && <LoadingRow colSpan={5} />}
            {error && <EmptyRow colSpan={5} message="Erro ao carregar categorias." />}
            {categorias !== null && filtered.length === 0 && <EmptyRow colSpan={5} />}
            {filtered.map((c) => (
              <tr key={c.id}>
                <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--text-muted)' }}>{c.id}</code></td>
                <td style={{ fontWeight: 500 }}>{c.descricao}</td>
                <td><StatusBadge ativo={c.ativo} /></td>
                <td style={{ fontSize: '.8125rem', color: 'var(--text-secondary)' }}>{formatDateDisplay(c.dataCadastro)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c.id)}>✏️ Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id, c.descricao)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth={480}>
        <h2>{editing ? 'Editar Categoria' : 'Nova Categoria'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Descrição *</label>
            <input className="form-control" required value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
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