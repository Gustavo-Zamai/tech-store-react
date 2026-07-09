// pages/Clientes.jsx

import { useEffect, useMemo, useState } from 'react';
import API from '../api/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import AddressFields from '../components/AddressFields';
import { useConfirm } from '../components/useConfirm';
import { LoadingRow, EmptyRow, StatusBadge, getIndicadorIeLabel } from '../components/TableHelpers';

const emptyForm = {
  nomeCompleto: '', 
  cpf: '', 
  email: '', 
  telefone: '',
  endereco: '', 
  numero: '', 
  cep: '', 
  bairro: '', 
  cidade: '', 
  estado: '',
  ativo: 'true',
  indicadorIe: '',
};

export default function Clientes() {
  const toast = useToast();
  const [clientes, setClientes] = useState(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { confirmState, requestConfirm, cancelConfirm } = useConfirm();

  const load = async () => {
    try {
      const data = await API.clientes.list();
      setClientes(data || []);
      setError(false);
    } catch {
      setError(true);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!clientes) return [];
    const q = search.toLowerCase().trim();
    if (!q) return clientes;
    return clientes.filter((c) => 
      c.nomeCompleto?.toLowerCase().includes(q) || 
      c.cpf?.includes(q) || 
      c.email?.toLowerCase().includes(q)
    );
  }, [clientes, search]);

  const openNew = () => { 
    setEditing(null); 
    setForm(emptyForm); 
    setModalOpen(true); 
  };

  const openEdit = async (id) => {
    try {
      const c = await API.clientes.get(id);
      setEditing(c);
      setForm({
        nomeCompleto: c.nomeCompleto ?? '',
        cpf: c.cpf ?? '',
        email: c.email ?? '',
        telefone: c.telefone ?? '',
        endereco: c.endereco ?? '',
        numero: c.numero ?? '',
        cep: c.cep ?? '',
        bairro: c.bairro ?? '',
        cidade: c.cidade ?? '',
        estado: c.estado ?? '',
        ativo: c.ativo === false ? 'false' : 'true',
        indicadorIe: c.indicadorIe ?? '',
      });
      setModalOpen(true);
    } catch (err) {
      toast.error('Erro ao carregar cliente');
      console.error(err);
    }
  };

  const handleDelete = (id, nome) => requestConfirm(nome, async () => {
    try { 
      await API.clientes.delete(id); 
      toast.success('Cliente excluído!'); 
      load(); 
    } catch (e) { 
      toast.error(e.message); 
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { 
        nomeCompleto: form.nomeCompleto,
        cpf: form.cpf || undefined,
        email: form.email || undefined,
        telefone: form.telefone || undefined,
        cep: form.cep || undefined,
        endereco: form.endereco || undefined,
        numero: form.numero ? parseInt(form.numero) : undefined,
        bairro: form.bairro || undefined,
        cidade: form.cidade || undefined,
        estado: form.estado || undefined,
        ativo: form.ativo === 'true',
        indicadorIe: form.indicadorIe ? parseInt(form.indicadorIe) : undefined,
      };
      
      if (editing) {
        await API.clientes.update(editing.id, data);
      } else {
        await API.clientes.create(data);
      }
      toast.success(editing ? 'Cliente atualizado!' : 'Cliente criado!');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar cliente');
    } finally {
      setSaving(false);
    }
  };

  // Opções para o indicador IE
  const INDICADOR_IE_OPCOES = [
    { value: 1, label: 'Contribuinte ICMS' },
    { value: 2, label: 'Isento de Inscrição' },
    { value: 9, label: 'Não Contribuinte' },
  ];

  const getIndicadorIeLabel = (value) => {
    const opcao = INDICADOR_IE_OPCOES.find(o => o.value === value);
    return opcao?.label || '—';
  };

  return (
    <>
      <div className="section-header">
        <h1>Clientes</h1>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <div className="search-bar">
            <span className="icon">🔍</span>
            <input className="form-control" placeholder="Buscar cliente..." style={{ width: 220 }}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openNew}>+ Novo Cliente</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>CPF</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Indicador IE</th>
              <th>Situação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes === null && !error && <LoadingRow colSpan={8} />}
            {error && <EmptyRow colSpan={8} message="Erro ao carregar clientes." />}
            {clientes !== null && filtered.length === 0 && <EmptyRow colSpan={8} />}
            {filtered.map((c) => (
              <tr key={c.id}>
                <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--text-muted)' }}>{c.id}</code></td>
                <td style={{ fontWeight: 500 }}>{c.nomeCompleto}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.85rem' }}>{c.cpf ?? '—'}</td>
                <td>{c.email ?? '—'}</td>
                <td>{c.telefone ?? '—'}</td>
                <td>{getIndicadorIeLabel(c.indicadorIe)}</td>
                <td><StatusBadge ativo={c.ativo} /></td>
                <td>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c.id)}>✏️ Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id, c.nomeCompleto)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth={640}>
        <h2>{editing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome Completo *</label>
            <input className="form-control" required value={form.nomeCompleto}
              onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })} />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>CPF *</label>
              <input className="form-control" required value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Indicador IE</label>
              <select className="form-control" value={form.indicadorIe}
                onChange={(e) => setForm({ ...form, indicadorIe: e.target.value })}>
                <option value="">— Selecione —</option>
                {INDICADOR_IE_OPCOES.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Email *</label>
              <input className="form-control" type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input className="form-control" value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
          </div>

          <AddressFields form={form} setForm={setForm} />

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