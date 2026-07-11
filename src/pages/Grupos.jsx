// pages/Grupos.jsx

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

export default function Grupos() {
  const toast = useToast();
  const [grupos, setGrupos] = useState(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { confirmState, requestConfirm, cancelConfirm } = useConfirm();

  const load = async () => {
    try {
      const data = await API.grupos.list();
      setGrupos(data || []);
      setError(false);
    } catch (e) {
      console.error('Erro ao carregar grupos:', e);
      setError(true);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!grupos) return [];
    const q = search.toLowerCase().trim();
    if (!q) return grupos;
    return grupos.filter((g) => 
      g.descricao?.toLowerCase().includes(q)
    );
  }, [grupos, search]);

  const openNew = () => { 
    setEditing(null); 
    setForm(emptyForm); 
    setModalOpen(true); 
  };

  const openEdit = async (id) => {
    try {
      const c = await API.grupos.get(id);
      setEditing(c);
      setForm({ 
        descricao: c.descricao ?? '', 
        ativo: c.ativo === false ? 'false' : 'true',
      });
      setModalOpen(true);
    } catch {
      toast.error('Erro ao carregar grupo para edição');
    }
  };

  const handleDelete = (id, descricao) => requestConfirm(descricao, async () => {
    try { 
      await API.grupos.delete(id); 
      toast.success('Grupo excluído!'); 
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
        await API.grupos.update(editing.id, data);
      } else {
        await API.grupos.create(data);
      }
      toast.success(editing ? 'Grupo atualizado!' : 'Grupo criado!');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar grupo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="section-header">
        <h1>Grupos</h1>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <div className="search-bar">
            <span className="icon">🔍</span>
            <input className="form-control" placeholder="Buscar grupo..." style={{ width: 220 }}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openNew}>+ Novo Grupo</button>
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
            {grupos === null && !error && <LoadingRow colSpan={5} />}
            {error && <EmptyRow colSpan={5} message="Erro ao carregar grupos." />}
            {grupos !== null && filtered.length === 0 && <EmptyRow colSpan={5} />}
            {filtered.map((g) => (
              <tr key={g.id}>
                <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--text-muted)' }}>{g.id}</code></td>
                <td style={{ fontWeight: 500 }}>{g.descricao}</td>
                <td><StatusBadge ativo={g.ativo} /></td>
                <td style={{ fontSize: '.8125rem', color: 'var(--text-secondary)' }}>{formatDateDisplay(g.dataCadastro)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(g.id)}>✏️ Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.id, g.descricao)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth={480}>
        <h2>{editing ? 'Editar Grupo' : 'Novo Grupo'}</h2>
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