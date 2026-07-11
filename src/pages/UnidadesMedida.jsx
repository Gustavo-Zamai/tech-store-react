// src/pages/UnidadesMedida.jsx

import { useEffect, useMemo, useState } from 'react';
import API from '../api/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useConfirm } from '../components/useConfirm';
import { formatDateDisplay } from '../utils/format';
import { LoadingRow, EmptyRow, StatusBadge } from '../components/TableHelpers';

const emptyForm = { 
  sigla: '', 
  descricao: '',
  ativo: 'true',
};

export default function UnidadesMedida() {
  const toast = useToast();
  const [unidades, setUnidades] = useState(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { confirmState, requestConfirm, cancelConfirm } = useConfirm();

  const load = async () => {
    try {
      const data = await API.unidades.list();
      setUnidades(data || []);
      setError(false);
    } catch (e) {
      console.error('Erro ao carregar unidades de medida:', e);
      setError(true);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!unidades) return [];
    const q = search.toLowerCase().trim();
    if (!q) return unidades;
    return unidades.filter((u) => 
      u.sigla?.toLowerCase().includes(q) ||
      u.descricao?.toLowerCase().includes(q)
    );
  }, [unidades, search]);

  const openNew = () => { 
    setEditing(null); 
    setForm(emptyForm); 
    setModalOpen(true); 
  };

  const openEdit = async (id) => {
    try {
      const u = await API.unidades.get(id);
      setEditing(u);
      setForm({ 
        sigla: u.sigla ?? '', 
        descricao: u.descricao ?? '',
        ativo: u.ativo === false ? 'false' : 'true',
      });
      setModalOpen(true);
    } catch {
      toast.error('Erro ao carregar unidade de medida para edição');
    }
  };

  const handleDelete = (id, descricao) => requestConfirm(descricao, async () => {
    try { 
      await API.unidades.delete(id); 
      toast.success('Unidade de medida excluída!'); 
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
        sigla: form.sigla.toUpperCase(), 
        descricao: form.descricao,
        ativo: form.ativo === 'true',
      };
      
      if (editing) {
        await API.unidades.update(editing.id, data);
      } else {
        await API.unidades.create(data);
      }
      toast.success(editing ? 'Unidade de medida atualizada!' : 'Unidade de medida criada!');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar unidade de medida');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="section-header">
        <h1>Unidades de Medida</h1>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <div className="search-bar">
            <span className="icon">🔍</span>
            <input className="form-control" placeholder="Buscar unidade..." style={{ width: 220 }}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openNew}>+ Nova Unidade</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Sigla</th>
              <th>Descrição</th>
              <th>Situação</th>
              <th>Data Cadastro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {unidades === null && !error && <LoadingRow colSpan={6} />}
            {error && <EmptyRow colSpan={6} message="Erro ao carregar unidades de medida." />}
            {unidades !== null && filtered.length === 0 && <EmptyRow colSpan={6} />}
            {filtered.map((u) => (
              <tr key={u.id}>
                <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--text-muted)' }}>{u.id}</code></td>
                <td>
                  <span style={{ 
                    background: 'var(--accent-dim)', 
                    color: 'var(--accent)',
                    padding: '0.15rem 0.6rem',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    fontSize: '.85rem'
                  }}>
                    {u.sigla}
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>{u.descricao}</td>
                <td><StatusBadge ativo={u.ativo} /></td>
                <td style={{ fontSize: '.8125rem', color: 'var(--text-secondary)' }}>{formatDateDisplay(u.dataCadastro)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u.id)}>✏️ Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id, u.descricao)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth={480}>
        <h2>{editing ? 'Editar Unidade de Medida' : 'Nova Unidade de Medida'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Sigla *</label>
            <input 
              className="form-control" 
              required 
              maxLength="6"
              placeholder="Ex: UN, KG, LT"
              value={form.sigla}
              onChange={(e) => setForm({ ...form, sigla: e.target.value.toUpperCase() })} 
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '.75rem', marginTop: '.25rem', display: 'block' }}>
              Máximo 6 caracteres. Usado na NFe/NFC-e.
            </small>
          </div>

          <div className="form-group">
            <label>Descrição *</label>
            <input 
              className="form-control" 
              required 
              placeholder="Ex: Unidade, Quilograma, Litro"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })} 
            />
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