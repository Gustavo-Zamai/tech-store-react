// pages/Clientes.jsx

import { useEffect, useMemo, useState } from 'react';
import API from '../api/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import AddressFields from '../components/AddressFields';
import { useConfirm } from '../components/useConfirm';
import { LoadingRow, EmptyRow, StatusBadge } from '../components/TableHelpers';

const emptyForm = {
  nome: '', 
  cpf: '', 
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
  dataNascimento: '',
  observacao: '',
  ativo: 'true',
  tipoPessoa: 'FISICA',
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
      c.nome?.toLowerCase().includes(q) || 
      c.cpf?.includes(q) || 
      c.cnpj?.includes(q) ||
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
        nome: c.nomeCompleto ?? c.nome ?? '',
        cpf: c.cpf ?? '',
        cnpj: c.cnpj ?? '',
        email: c.email ?? '',
        telefone: c.telefone ?? '',
        celular: c.celular ?? '',
        endereco: c.endereco ?? '',
        numero: c.numero ?? '',
        cep: c.cep ?? '',
        bairro: c.bairro ?? '',
        cidade: c.cidade ?? '',
        estado: c.estado ?? '',
        dataNascimento: c.dataNascimento ? formatDateForInput(c.dataNascimento) : '',
        observacao: c.observacao ?? '',
        ativo: c.ativo === false ? 'false' : 'true',
        tipoPessoa: c.tipoPessoa ?? 'FISICA',
      });
      setModalOpen(true);
    } catch (err) {
      toast.error('Erro ao carregar cliente');
      console.error(err);
    }
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
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
        ...form, 
        ativo: form.ativo === 'true',
        cpf: form.cpf || undefined,
        cnpj: form.cnpj || undefined,
        numero: form.numero ? parseInt(form.numero) : undefined,
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
              <th>CPF/CNPJ</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Tipo</th>
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
                <td style={{ fontWeight: 500 }}>{c.nomeCompleto ?? c.nome}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.85rem' }}>{c.cpf ?? c.cnpj ?? '—'}</td>
                <td>{c.email ?? '—'}</td>
                <td>{c.telefone ?? c.celular ?? '—'}</td>
                <td>
                  <span className="badge badge-info">
                    {c.tipoPessoa === 'JURIDICA' ? 'PJ' : 'PF'}
                  </span>
                </td>
                <td><StatusBadge ativo={c.ativo} /></td>
                <td>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c.id)}>✏️ Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id, c.nomeCompleto ?? c.nome)}>🗑️</button>
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
            <label>Nome *</label>
            <input className="form-control" required value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Tipo de Pessoa</label>
            <select className="form-control" value={form.tipoPessoa}
              onChange={(e) => setForm({ ...form, tipoPessoa: e.target.value })}>
              <option value="FISICA">Pessoa Física</option>
              <option value="JURIDICA">Pessoa Jurídica</option>
            </select>
          </div>

          <div className="grid-2">
            {form.tipoPessoa === 'FISICA' ? (
              <div className="form-group">
                <label>CPF *</label>
                <input className="form-control" required value={form.cpf}
                  onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
              </div>
            ) : (
              <div className="form-group">
                <label>CNPJ *</label>
                <input className="form-control" required value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
              </div>
            )}
            <div className="form-group">
              <label>Data de Nascimento</label>
              <input className="form-control" type="date" value={form.dataNascimento}
                onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input className="form-control" value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label>Celular</label>
            <input className="form-control" value={form.celular}
              onChange={(e) => setForm({ ...form, celular: e.target.value })} />
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