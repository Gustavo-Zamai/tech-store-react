// pages/Login.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import logo from '/logo.png';

const STEPS = [
  { id: 'api', label: 'Conectando à API...' },
  { id: 'email', label: 'Verificando e-mail...' },
  { id: 'senha', label: 'Validando senha...' },
  { id: 'ativo', label: 'Verificando status do funcionário...' },
  { id: 'empresa', label: 'Verificando vínculo com empresa...' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);

  const [apiUrl, setApiUrl] = useState(API.getBaseURL());
  const [apiUrlVisible, setApiUrlVisible] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({ email: '', senha: '' });
  const [error, setError] = useState('');
  const [checklistVisible, setChecklistVisible] = useState(false);
  const [checks, setChecks] = useState({});
  const [loading, setLoading] = useState(false);

  const setCheck = (id, state) => setChecks((prev) => ({ ...prev, [id]: state }));

  const clearError = () => {
    setError('');
    setFieldErrors({ email: '', senha: '' });
  };

  const validateFields = () => {
    let ok = true;
    const errs = { email: '', senha: '' };
    if (!email) {
      errs.email = 'Informe o e-mail.';
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Formato de e-mail inválido.';
      ok = false;
    }
    if (!senha) {
      errs.senha = 'Informe a senha.';
      ok = false;
    }
    setFieldErrors(errs);
    return ok;
  };

  const handleApiUrlChange = (v) => {
    setApiUrl(v);
  };

  const commitApiUrl = () => {
    const v = apiUrl.trim();
    if (v) API.setBaseURL(v);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    commitApiUrl();

    if (!validateFields()) return;

    setLoading(true);
    setChecklistVisible(true);
    setChecks({});

    try {
      // ── ETAPA 1: API acessível ─────────────
      setCheck('api', 'loading');
      const online = await API.ping();
      if (!online) {
        setCheck('api', 'error');
        throw new Error('Não foi possível conectar à API. Verifique se o servidor está rodando e a URL está correta.');
      }
      setCheck('api', 'ok');

      // ── ETAPA 2: Login via endpoint /api/auth/login ──
      setCheck('email', 'loading');
      setCheck('senha', 'loading');
      
      let funcionario;
      try {
        funcionario = await API.login(email, senha);
        setCheck('email', 'ok');
        setCheck('senha', 'ok');
      } catch (err) {
        setCheck('email', 'error');
        setCheck('senha', 'error');
        throw new Error(err.message || 'Email ou senha inválidos.');
      }

      // ── ETAPA 3: Verificar se está ativo ───
      setCheck('ativo', 'loading');
      if (funcionario.ativo === false) {
        setCheck('ativo', 'error');
        throw new Error('Sua conta está inativa. Entre em contato com o administrador.');
      }
      setCheck('ativo', 'ok');

      // ── ETAPA 4: Verificar vínculo com empresa ──
      setCheck('empresa', 'loading');
      if (!funcionario.idEmpresa) {
        setCheck('empresa', 'error');
        throw new Error('Funcionário não está vinculado a nenhuma empresa. Contate o administrador.');
      }
      setCheck('empresa', 'ok');

      // ── Sucesso ─────────────────────────────
      login(funcionario);
      toast.success(`Bem-vindo, ${funcionario.nomeCompleto.split(' ')[0]}!`);
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmailInput = (v) => {
    setEmail(v);
    setFieldErrors((prev) => ({ ...prev, email: '' }));
    setError('');
    setChecklistVisible(false);
    setChecks({});
  };

  const handleSenhaInput = (v) => {
    setSenha(v);
    setFieldErrors((prev) => ({ ...prev, senha: '' }));
  };

  const iconFor = (id) => {
    const state = checks[id];
    if (state === 'ok') return '✅';
    if (state === 'error') return '❌';
    return '⏳';
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <img src={logo} alt="Tech Store Logo" width={180} height={180} />
        </div>

        <div className={`login-error${error ? ' visible' : ''}`}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-email">E-mail</label>
            <input
              className="form-control"
              id="login-email"
              name="email"
              type="email"
              placeholder="funcionario@empresa.com"
              autoComplete="email"
              value={email}
              onChange={(e) => handleEmailInput(e.target.value)}
              required
            />
            <span className="field-error">{fieldErrors.email}</span>
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label htmlFor="login-pass">Senha</label>
            <input
              className="form-control"
              id="login-pass"
              name="senha"
              type={showSenha ? 'text' : 'password'}
              placeholder="••••••••••••••"
              autoComplete="current-password"
              value={senha}
              onChange={(e) => handleSenhaInput(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle-senha"
              tabIndex={-1}
              title="Mostrar/ocultar senha"
              onClick={() => setShowSenha((v) => !v)}
            >
              <span>{showSenha ? '🙈' : '👁️'}</span>
            </button>
            <span className="field-error">{fieldErrors.senha}</span>
          </div>

          <div className="form-group api-url-group">
            <label htmlFor="login-api-url">
              URL da API
              <button
                type="button"
                className="link-btn"
                onClick={() => setApiUrlVisible((v) => !v)}
              >
                {apiUrlVisible ? 'ocultar' : 'alterar'}
              </button>
            </label>
            <div className={`api-url-display${apiUrlVisible ? ' hidden' : ''}`}>
              <span>{apiUrl}</span>
            </div>
            <input
              className={`form-control${apiUrlVisible ? '' : ' hidden'}`}
              id="login-api-url"
              type="url"
              placeholder="http://localhost:8080"
              value={apiUrl}
              onChange={(e) => handleApiUrlChange(e.target.value)}
              onBlur={commitApiUrl}
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? (<><span className="spinner" /> Aguarde...</>) : 'Entrar'}
          </button>
        </form>

        <div className={`login-checklist${checklistVisible ? '' : ' hidden'}`}>
          {STEPS.map((step) => (
            <div key={step.id} className={`check-item ${checks[step.id] || ''}`}>
              <span className="check-icon">{iconFor(step.id)}</span>
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}