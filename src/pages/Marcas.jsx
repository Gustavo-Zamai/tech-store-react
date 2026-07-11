// src/pages/Marcas.jsx

import { useEffect, useMemo, useState } from 'react';
import API from '../api/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useConfirm } from '../components/useConfirm';
import { formatDateDisplay } from '../utils/format';
import { LoadingRow, EmptyRow, StatusBadge } from '../components/TableHelpers';

const emptyForm = { 
  nome: '', 
  ativo: 'true',
};

export default function Marcas() {
  const toast = useToast();
  const [marcas, setMarcas] = useState(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { confirmState, requestConfirm, cancelConfirm } = useConfirm();

  const load = async () => {
    try {
      const data = await API.marcas.list();
      setMarcas(data || []);
      setError(false);
    } catch (e) {
      console.error('Erro ao carregar marcas:', e);
      setError(true);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!marcas) return [];
    const q = search.toLowerCase().trim();
    if (!q) return marcas;
    return marcas.filter((m) => 
      m.nome?.toLowerCase().includes(q)
    );
  }, [marcas, search]);

  const openNew = () => { 
    setEditing(null); 
    setForm(emptyForm); 
    setModalOpen(true); 
  };

  const openEdit = async (id) => {
    try {
      const m = await API.marcas.get(id);
      setEditing(m);
      setForm({ 
        nome: m.nome ?? '', 
        ativo: m.ativo === false ? 'false' : 'true',
      });
      setModalOpen(true);
    } catch {
      toast.error('Erro ao carregar marca para edição');
    }
  };

  const handleDelete = (id, nome) => requestConfirm(nome, async () => {
    try { 
      await API.marcas.delete(id); 
      toast.success('Marca excluída!'); 
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
        nome: form.nome, 
        ativo: form.ativo === 'true',
      };
      
      if (editing) {
        await API.marcas.update(editing.id, data);
      } else {
        await API.marcas.create(data);
      }
      toast.success(editing ? 'Marca atualizada!' : 'Marca criada!');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar marca');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="section-header">
        <h1>Marcas</h1>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <div className="search-bar">
            <span className="icon">🔍</span>
            <input className="form-control" placeholder="Buscar marca..." style={{ width: 220 }}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openNew}>+ Nova Marca</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>Situação</th>
              <th>Data Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {marcas === null && !error && <LoadingRow colSpan={5} />}
            {error && <EmptyRow colSpan={5} message="Erro ao carregar marcas." />}
            {marcas !== null && filtered.length === 0 && <EmptyRow colSpan={5} />}
            {filtered.map((m) => (
              <tr key={m.id}>
                <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--text-muted)' }}>{m.id}</code></td>
                <td style={{ fontWeight: 500 }}>{m.nome}</td>
                <td><StatusBadge ativo={m.ativo} /></td>
                <td style={{ fontSize: '.8125rem', color: 'var(--text-secondary)' }}>{formatDateDisplay(m.dataCadastro)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(m.id)}>✏️ Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id, m.nome)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth={480}>
        <h2>{editing ? 'Editar Marca' : 'Nova Marca'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome *</label>
            <input className="form-control" required value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })} />
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