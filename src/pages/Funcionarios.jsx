// pages/Funcionarios.jsx

import { useEffect, useMemo, useState } from 'react';
import API from '../api/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import AddressFields from '../components/AddressFields';
import { useConfirm } from '../components/useConfirm';
import { LoadingRow, EmptyRow, StatusBadge } from '../components/TableHelpers';
import { formatCurrency } from '../utils/format';

const emptyForm = {
  nomeCompleto: '', 
  cpf: '', 
  telefone: '', 
  email: '',
  imagemUrl: '', 
  idEmpresa: '', 
  cargo: '', 
  salario: '', 
  senha: '',
  endereco: '', 
  numero: '', 
  cep: '', 
  bairro: '', 
  cidade: '', 
  estado: '',
  ativo: 'true', 
  nivelAcesso: 'USER',
  dataContratacao: '',
};

const NIVEL_ACESSO_OPCOES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'GERENTE', label: 'Gerente' },
  { value: 'USER', label: 'Usuário' },
];

export default function Funcionarios() {
  const toast = useToast();
  const [funcionarios, setFuncionarios] = useState(null);
  const [error, setError] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const { confirmState, requestConfirm, cancelConfirm } = useConfirm();

  const load = async () => {
    const [funcs, emps] = await Promise.allSettled([
      API.funcionarios.list(), 
      API.empresas.list()
    ]);
    if (funcs.status === 'fulfilled') { 
      setFuncionarios(funcs.value || []); 
      setError(false); 
    } else { 
      setError(true); 
    }
    if (emps.status === 'fulfilled') setEmpresas(emps.value || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!funcionarios) return [];
    const q = search.toLowerCase().trim();
    if (!q) return funcionarios;
    return funcionarios.filter((f) => 
      f.nomeCompleto?.toLowerCase().includes(q) || 
      f.cpf?.includes(q) ||
      f.email?.toLowerCase().includes(q) ||
      f.cargo?.toLowerCase().includes(q)
    );
  }, [funcionarios, search]);

  const openNew = () => { 
    setEditing(null); 
    setForm(emptyForm); 
    setModalOpen(true); 
  };

  const openEdit = async (id) => {
    try {
      const f = await API.funcionarios.get(id);
      setEditing(f);
      setForm({
        nomeCompleto: f.nomeCompleto ?? '',
        cpf: f.cpf ?? '',
        telefone: f.telefone ?? '',
        email: f.email ?? '',
        imagemUrl: f.imagemUrl ?? '',
        idEmpresa: f.idEmpresa ?? '',
        cargo: f.cargo ?? '',
        salario: f.salario ?? '',
        senha: '',
        endereco: f.endereco ?? '',
        numero: f.numero ?? '',
        cep: f.cep ?? '',
        bairro: f.bairro ?? '',
        cidade: f.cidade ?? '',
        estado: f.estado ?? '',
        ativo: f.ativo === false ? 'false' : 'true',
        nivelAcesso: f.nivelAcesso ?? 'USER',
        dataContratacao: f.dataContratacao ? formatDateForInput(f.dataContratacao) : '',
      });
      setModalOpen(true);
    } catch (err) {
      toast.error('Erro ao carregar funcionário');
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
      await API.funcionarios.delete(id); 
      toast.success('Funcionário excluído!'); 
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
        nomeCompleto: form.nomeCompleto,
        cpf: form.cpf,
        email: form.email,
        telefone: form.telefone,
        endereco: form.endereco,
        numero: form.numero ? parseInt(form.numero) : undefined,
        cep: form.cep,
        bairro: form.bairro,
        cidade: form.cidade,
        estado: form.estado,
        idEmpresa: form.idEmpresa || undefined,
        imagemUrl: form.imagemUrl || undefined,
        cargo: form.cargo,
        salario: form.salario ? parseFloat(form.salario) : undefined,
        nivelAcesso: form.nivelAcesso || 'USER',
        dataContratacao: form.dataContratacao || undefined,
        ativo: form.ativo === 'true',
        senha: form.senha || undefined,
      };
      
      if (editing) {
        await API.funcionarios.update(editing.id, data);
      } else {
        await API.funcionarios.create(data);
      }
      toast.success(editing ? 'Funcionário atualizado!' : 'Funcionário criado!');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar funcionário');
    } finally {
      setSaving(false);
    }
  };

  const getNivelAcessoLabel = (nivel) => {
    const opcao = NIVEL_ACESSO_OPCOES.find(o => o.value === nivel);
    return opcao?.label || nivel || 'Usuário';
  };

  return (
    <>
      <div className="section-header">
        <h1>Funcionários</h1>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <div className="search-bar">
            <span className="icon">🔍</span>
            <input className="form-control" placeholder="Buscar funcionário..." style={{ width: 220 }}
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openNew}>+ Novo Funcionário</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>CPF</th>
              <th>Cargo</th>
              <th>Email</th>
              <th>Empresa</th>
              <th>Acesso</th>
              <th>Situação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {funcionarios === null && !error && <LoadingRow colSpan={9} />}
            {error && <EmptyRow colSpan={9} message="Erro ao carregar." />}
            {funcionarios !== null && filtered.length === 0 && <EmptyRow colSpan={9} message="Nenhum funcionário." />}
            {filtered.map((f) => (
              <tr key={f.id}>
                <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--text-muted)' }}>{f.id}</code></td>
                <td style={{ fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    {f.imagemUrl && (
                      <img src={f.imagemUrl} alt={f.nomeCompleto} 
                        style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                    )}
                    {f.nomeCompleto ?? '—'}
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.85rem' }}>{f.cpf ?? '—'}</td>
                <td>{f.cargo ?? '—'}</td>
                <td>{f.email ?? '—'}</td>
                <td>{f.nomeEmpresa ?? '—'}</td>
                <td>
                  <span className="badge badge-info">
                    {getNivelAcessoLabel(f.nivelAcesso)}
                  </span>
                </td>
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
        <h2>{editing ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome *</label>
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
              <label>Data de Contratação</label>
              <input className="form-control" type="date" value={form.dataContratacao}
                onChange={(e) => setForm({ ...form, dataContratacao: e.target.value })} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Telefone</label>
              <input className="form-control" value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input className="form-control" type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Foto (URL)</label>
              <input className="form-control" value={form.imagemUrl}
                onChange={(e) => setForm({ ...form, imagemUrl: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Empresa *</label>
              <select className="form-control" required value={form.idEmpresa}
                onChange={(e) => setForm({ ...form, idEmpresa: e.target.value })}>
                <option value="">— Selecione —</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label>Cargo *</label>
              <input className="form-control" required value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Salário</label>
              <input className="form-control" type="number" step="0.01" min="0" value={form.salario}
                onChange={(e) => setForm({ ...form, salario: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Senha {editing && '(deixe em branco para manter)'}</label>
              <input className="form-control" type="password" value={form.senha}
                onChange={(e) => setForm({ ...form, senha: e.target.value })} 
                placeholder={editing ? '••••••••' : 'Nova senha'} />
            </div>
          </div>

          <AddressFields form={form} setForm={setForm} />

          <div className="grid-2">
            <div className="form-group">
              <label>Situação</label>
              <select className="form-control" value={form.ativo}
                onChange={(e) => setForm({ ...form, ativo: e.target.value })}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nível de Acesso *</label>
              <select className="form-control" required value={form.nivelAcesso}
                onChange={(e) => setForm({ ...form, nivelAcesso: e.target.value })}>
                {NIVEL_ACESSO_OPCOES.map(op => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
            </div>
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