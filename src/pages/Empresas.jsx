// pages/Empresas.jsx

import { useEffect, useMemo, useState } from 'react';
import API from '../api/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import AddressFields from '../components/AddressFields';
import { useConfirm } from '../components/useConfirm';
import { LoadingRow, EmptyRow, StatusBadge } from '../components/TableHelpers';
import { formatDateDisplay } from '../utils/format';

// Constantes para selects
const REGIME_TRIBUTARIO_OPCOES = [
  { value: 1, label: 'Simples Nacional' },
  { value: 2, label: 'Simples Nacional - Excesso de Sublimite' },
  { value: 3, label: 'Regime Normal' }
];

const AMBIENTE_NFE_OPCOES = [
  { value: 1, label: 'Produção' },
  { value: 2, label: 'Homologação' }
];

const emptyForm = {
  // Dados básicos
  nome: '',
  cnpj: '',
  email: '',
  telefone: '',
  cep: '',
  endereco: '',
  numero: '',
  bairro: '',
  cidade: '',
  estado: '',
  logoUrl: '',
  
  // Dados fiscais
  nomeFantasia: '',
  inscricaoEstadual: '',
  inscricaoMunicipal: '',
  regimeTributario: 1,
  cnaeFiscal: '',
  codigoMunicipioIbge: '',
  codigoUfIbge: '',
  
  // Configurações NFe/NFC-e
  ambienteNfe: 2, // Homologação por padrão
  serieNfe: 1,
  proximoNumeroNfe: 1,
  serieNfce: 1,
  proximoNumeroNfce: 1,
  
  // Certificado
  certificadoCaminho: '',
  certificadoSenha: '',
  certificadoValidade: '',
  
  // CSC
  cscId: '',
  cscToken: '',
  
  // Controle
  ativo: 'true',
};

export default function Empresas() {
  const toast = useToast();
  const [empresas, setEmpresas] = useState(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [certificadoFile, setCertificadoFile] = useState(null);

  const { confirmState, requestConfirm, cancelConfirm } = useConfirm();

  const load = async () => {
    try {
      const data = await API.empresas.list();
      setEmpresas(data || []);
      setError(false);
    } catch {
      setError(true);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!empresas) return [];
    const q = search.toLowerCase().trim();
    if (!q) return empresas;
    return empresas.filter((e) => JSON.stringify(e).toLowerCase().includes(q));
  }, [empresas, search]);

  const openNew = () => { 
    setEditing(null); 
    setForm(emptyForm); 
    setLogoFile(null);
    setCertificadoFile(null);
    setModalOpen(true); 
  };

  const openEdit = async (id) => {
    try {
      const e = await API.empresas.get(id);
      setEditing(e);
      setForm({
        // Dados básicos
        nome: e.nome ?? '',
        cnpj: e.cnpj ?? '',
        email: e.email ?? '',
        telefone: e.telefone ?? '',
        cep: e.cep ?? '',
        endereco: e.endereco ?? '',
        numero: e.numero ?? '',
        bairro: e.bairro ?? '',
        cidade: e.cidade ?? '',
        estado: e.estado ?? '',
        logoUrl: e.logoUrl ?? '',
        
        // Dados fiscais
        nomeFantasia: e.nomeFantasia ?? '',
        inscricaoEstadual: e.inscricaoEstadual ?? '',
        inscricaoMunicipal: e.inscricaoMunicipal ?? '',
        regimeTributario: e.regimeTributario ?? 1,
        cnaeFiscal: e.cnaeFiscal ?? '',
        codigoMunicipioIbge: e.codigoMunicipioIbge ?? '',
        codigoUfIbge: e.codigoUfIbge ?? '',
        
        // Configurações NFe
        ambienteNfe: e.ambienteNfe ?? 2,
        serieNfe: e.serieNfe ?? 1,
        proximoNumeroNfe: e.proximoNumeroNfe ?? 1,
        serieNfce: e.serieNfce ?? 1,
        proximoNumeroNfce: e.proximoNumeroNfce ?? 1,
        
        // Certificado
        certificadoCaminho: e.certificadoCaminho ?? '',
        certificadoSenha: e.certificadoSenha ?? '',
        certificadoValidade: e.certificadoValidade ? formatDateForInput(e.certificadoValidade) : '',
        
        // CSC
        cscId: e.cscId ?? '',
        cscToken: e.cscToken ?? '',
        
        // Controle
        ativo: e.ativo === false ? 'false' : 'true',
      });
      setLogoFile(null);
      setCertificadoFile(null);
      setModalOpen(true);
    } catch (err) {
      toast.error('Erro ao carregar empresa para edição');
      console.error(err);
    }
  };

  const handleDelete = (id, nome) => requestConfirm(nome, async () => {
    try { 
      await API.empresas.delete(id); 
      toast.success('Empresa excluída!'); 
      load(); 
    } catch (e) { 
      toast.error(e.message); 
    }
  });

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // Preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setForm(prev => ({ ...prev, logoUrl: e.target?.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removerLogo = () => {
    setLogoFile(null);
    setForm(prev => ({ ...prev, logoUrl: '' }));
  };

  const handleCertificadoUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setCertificadoFile(file);
      setForm(prev => ({ ...prev, certificadoCaminho: file.name }));
    }
  };

  const removerCertificado = () => {
    setCertificadoFile(null);
    setForm(prev => ({ ...prev, certificadoCaminho: '' }));
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setSaving(true);
    try {
      // Prepara os dados para envio
      const data = {
        nome: form.nome,
        cnpj: form.cnpj || undefined,
        email: form.email || undefined,
        telefone: form.telefone || undefined,
        cep: form.cep || undefined,
        endereco: form.endereco || undefined,
        numero: form.numero ? parseInt(form.numero) : undefined,
        bairro: form.bairro || undefined,
        cidade: form.cidade || undefined,
        estado: form.estado || undefined,
        
        // Dados fiscais
        nomeFantasia: form.nomeFantasia || undefined,
        inscricaoEstadual: form.inscricaoEstadual || undefined,
        inscricaoMunicipal: form.inscricaoMunicipal || undefined,
        regimeTributario: form.regimeTributario ? parseInt(form.regimeTributario) : undefined,
        cnaeFiscal: form.cnaeFiscal || undefined,
        codigoMunicipioIbge: form.codigoMunicipioIbge || undefined,
        codigoUfIbge: form.codigoUfIbge || undefined,
        
        // Configurações NFe
        ambienteNfe: form.ambienteNfe ? parseInt(form.ambienteNfe) : undefined,
        serieNfe: form.serieNfe ? parseInt(form.serieNfe) : undefined,
        proximoNumeroNfe: form.proximoNumeroNfe ? parseInt(form.proximoNumeroNfe) : undefined,
        serieNfce: form.serieNfce ? parseInt(form.serieNfce) : undefined,
        proximoNumeroNfce: form.proximoNumeroNfce ? parseInt(form.proximoNumeroNfce) : undefined,
        
        // Certificado
        certificadoCaminho: form.certificadoCaminho || undefined,
        certificadoSenha: form.certificadoSenha || undefined,
        certificadoValidade: form.certificadoValidade || undefined,
        
        // CSC
        cscId: form.cscId || undefined,
        cscToken: form.cscToken || undefined,
        
        ativo: form.ativo === 'true',
      };

      let empresaSalva;
      if (editing) {
        empresaSalva = await API.empresas.update(editing.id, data);
      } else {
        empresaSalva = await API.empresas.create(data);
      }

      // Upload do logo se houver arquivo
      if (logoFile && empresaSalva?.id) {
        // Nota: O endpoint de upload de logo precisa ser implementado no backend
        // Por enquanto, apenas simulamos
        toast.info('Logo será enviada em breve');
      }

      // Upload do certificado se houver arquivo
      if (certificadoFile && empresaSalva?.id) {
        // Nota: O endpoint de upload de certificado precisa ser implementado no backend
        toast.info('Certificado será enviado em breve');
      }

      toast.success(editing ? 'Empresa atualizada!' : 'Empresa criada!');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar empresa');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Função para renderizar o status do regime tributário
  const getRegimeLabel = (value) => {
    const opcao = REGIME_TRIBUTARIO_OPCOES.find(o => o.value === value);
    return opcao?.label || '—';
  };

  const getAmbienteLabel = (value) => {
    const opcao = AMBIENTE_NFE_OPCOES.find(o => o.value === value);
    return opcao?.label || '—';
  };

  return (
    <>
      <div className="section-header">
        <h1>Empresas</h1>
        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <div className="search-bar">
            <span className="icon">🔍</span>
            <input 
              className="form-control" 
              placeholder="Buscar empresa..." 
              style={{ width: 220 }}
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <button className="btn btn-primary" onClick={openNew}>+ Nova Empresa</button>
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
              <th>Regime</th>
              <th>Situação</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {empresas === null && !error && <LoadingRow colSpan={8} />}
            {error && <EmptyRow colSpan={8} message="Erro ao carregar empresas." />}
            {empresas !== null && filtered.length === 0 && <EmptyRow colSpan={8} />}
            {filtered.map((e) => (
              <tr key={e.id}>
                <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--text-muted)' }}>{e.id}</code></td>
                <td style={{ fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    {e.logoUrl && (
                      <img 
                        src={e.logoUrl} 
                        alt={e.nome} 
                        style={{ height: 24, width: 24, objectFit: 'contain', borderRadius: '4px' }} 
                      />
                    )}
                    {e.nome}
                  </div>
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.85rem' }}>{e.cnpj ?? '—'}</td>
                <td>{e.email ?? '—'}</td>
                <td>{e.telefone ?? '—'}</td>
                <td>{getRegimeLabel(e.regimeTributario)}</td>
                <td><StatusBadge ativo={e.ativo} /></td>
                <td>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(e.id)}>✏️ Editar</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id, e.nome)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth={720}>
        <h2>{editing ? 'Editar Empresa' : 'Nova Empresa'}</h2>
        <form onSubmit={handleSubmit}>
          {/* Seção: Dados Básicos */}
          <h3 style={{ fontSize: '0.875rem', color: 'var(--accent)', marginBottom: '0.75rem', marginTop: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            📋 Dados Básicos
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label>Nome *</label>
              <input className="form-control" required value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="form-group">
              <label>CNPJ</label>
              <input className="form-control" value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
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

          <AddressFields form={form} setForm={setForm} />

          {/* Seção: Dados Fiscais */}
          <h3 style={{ fontSize: '0.875rem', color: 'var(--accent)', marginBottom: '0.75rem', marginTop: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            🏛️ Dados Fiscais
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label>Nome Fantasia</label>
              <input className="form-control" value={form.nomeFantasia}
                onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Inscrição Estadual</label>
              <input className="form-control" value={form.inscricaoEstadual}
                onChange={(e) => setForm({ ...form, inscricaoEstadual: e.target.value })} />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Inscrição Municipal</label>
              <input className="form-control" value={form.inscricaoMunicipal}
                onChange={(e) => setForm({ ...form, inscricaoMunicipal: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Regime Tributário</label>
              <select className="form-control" value={form.regimeTributario}
                onChange={(e) => setForm({ ...form, regimeTributario: parseInt(e.target.value) })}>
                {REGIME_TRIBUTARIO_OPCOES.map(opcao => (
                  <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>CNAE Fiscal</label>
              <input className="form-control" value={form.cnaeFiscal}
                onChange={(e) => setForm({ ...form, cnaeFiscal: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Código UF IBGE</label>
              <input className="form-control" value={form.codigoUfIbge}
                onChange={(e) => setForm({ ...form, codigoUfIbge: e.target.value })} 
                placeholder="Ex: 35" />
            </div>
          </div>

          <div className="form-group">
            <label>Código IBGE do Município</label>
            <input className="form-control" value={form.codigoMunicipioIbge}
              onChange={(e) => setForm({ ...form, codigoMunicipioIbge: e.target.value })} 
              placeholder="Ex: 3550308" />
          </div>

          {/* Seção: Configurações NFe/NFC-e */}
          <h3 style={{ fontSize: '0.875rem', color: 'var(--accent)', marginBottom: '0.75rem', marginTop: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            📄 Configurações NFe / NFC-e
          </h3>

          <div className="form-group">
            <label>Ambiente de Emissão</label>
            <select className="form-control" value={form.ambienteNfe}
              onChange={(e) => setForm({ ...form, ambienteNfe: parseInt(e.target.value) })}>
              {AMBIENTE_NFE_OPCOES.map(opcao => (
                <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
              ))}
            </select>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label>Série NFe</label>
              <input className="form-control" type="number" min="1" value={form.serieNfe}
                onChange={(e) => setForm({ ...form, serieNfe: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Próximo Nº NFe</label>
              <input className="form-control" type="number" min="1" value={form.proximoNumeroNfe}
                onChange={(e) => setForm({ ...form, proximoNumeroNfe: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Série NFC-e</label>
              <input className="form-control" type="number" min="1" value={form.serieNfce}
                onChange={(e) => setForm({ ...form, serieNfce: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label>Próximo Nº NFC-e</label>
            <input className="form-control" type="number" min="1" value={form.proximoNumeroNfce}
              onChange={(e) => setForm({ ...form, proximoNumeroNfce: e.target.value })} />
          </div>

          {/* Seção: Certificado Digital */}
          <h3 style={{ fontSize: '0.875rem', color: 'var(--accent)', marginBottom: '0.75rem', marginTop: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            🔐 Certificado Digital
          </h3>

          <div className="form-group">
            <label>Arquivo do Certificado</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <input
                type="file"
                accept=".pfx,.p12"
                onChange={handleCertificadoUpload}
                style={{ flex: 1 }}
              />
              {form.certificadoCaminho && (
                <button type="button" className="btn btn-danger btn-sm" onClick={removerCertificado}>
                  ✕
                </button>
              )}
            </div>
            {form.certificadoCaminho && (
              <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '.25rem' }}>
                Arquivo: {form.certificadoCaminho}
              </small>
            )}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Senha do Certificado</label>
              <input className="form-control" type="password" value={form.certificadoSenha}
                onChange={(e) => setForm({ ...form, certificadoSenha: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Validade do Certificado</label>
              <input className="form-control" type="datetime-local" value={form.certificadoValidade}
                onChange={(e) => setForm({ ...form, certificadoValidade: e.target.value })} />
            </div>
          </div>

          {/* Seção: CSC */}
          <h3 style={{ fontSize: '0.875rem', color: 'var(--accent)', marginBottom: '0.75rem', marginTop: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            🔑 CSC (NFC-e)
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label>CSC ID</label>
              <input className="form-control" value={form.cscId}
                onChange={(e) => setForm({ ...form, cscId: e.target.value })} />
            </div>
            <div className="form-group">
              <label>CSC Token</label>
              <input className="form-control" type="password" value={form.cscToken}
                onChange={(e) => setForm({ ...form, cscToken: e.target.value })} />
            </div>
          </div>

          {/* Seção: Logo */}
          <h3 style={{ fontSize: '0.875rem', color: 'var(--accent)', marginBottom: '0.75rem', marginTop: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            🖼️ Logo da Empresa
          </h3>

          <div className="form-group">
            <label>Upload da Logo</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ flex: 1 }}
              />
              {form.logoUrl && (
                <button type="button" className="btn btn-danger btn-sm" onClick={removerLogo}>
                  ✕
                </button>
              )}
            </div>
            {form.logoUrl && (
              <div style={{ marginTop: '.5rem' }}>
                <img 
                  src={form.logoUrl} 
                  alt="Logo preview" 
                  style={{ maxHeight: '80px', objectFit: 'contain', border: '1px solid var(--border)', borderRadius: '4px', padding: '4px' }} 
                />
              </div>
            )}
          </div>

          {/* Situação */}
          <div className="form-group">
            <label>Situação</label>
            <select className="form-control" value={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.value })}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
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