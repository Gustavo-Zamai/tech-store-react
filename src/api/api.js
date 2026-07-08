/* =============================================
   TECH STORE — API Service
   All communication with the backend lives here.
   ============================================= */

let baseURL = localStorage.getItem('ts_api_url') || 'http://localhost:8080';

function setBaseURL(url) {
  baseURL = url.replace(/\/$/, '');
  localStorage.setItem('ts_api_url', baseURL);
}

function getBaseURL() {
  return baseURL;
}

// ── Função para limpar objetos antes de enviar ──
function cleanObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null || value === '') continue;

    if (typeof value === 'object' && !Array.isArray(value)) {
      const nested = cleanObject(value);
      if (Object.keys(nested).length > 0) {
        cleaned[key] = nested;
      }
      continue;
    }

    if (Array.isArray(value)) {
      cleaned[key] = value.map((item) =>
        typeof item === 'object' ? cleanObject(item) : item
      );
      continue;
    }

    cleaned[key] = value;
  }
  return cleaned;
}

// ── Core request ──────────────────────────────
async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body !== null) {
    const cleanedBody = cleanObject(body);
    opts.body = JSON.stringify(cleanedBody);
    console.log(`📤 ${method} ${path}`, cleanedBody);
  }

  try {
    const res = await fetch(`${baseURL}${path}`, opts);

    if (res.status === 204) return null;

    let data;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      console.error(`Erro ${res.status} em ${method} ${path}:`, data || text);
      const msg = data?.message || data?.error || data?.details || `Erro ${res.status}`;
      throw new Error(msg);
    }
    return data;
  } catch (error) {
    console.error(`Erro na requisição ${method} ${path}:`, error);
    throw error;
  }
}

const get = (path) => request('GET', path);
const post = (path, body) => request('POST', path, body);
const put = (path, body) => request('PUT', path, body);
const del = (path) => request('DELETE', path);

// ── Health check ──────────────────────────────
async function ping() {
  try {
    await fetch(`${baseURL}/api/funcionarios`, { signal: AbortSignal.timeout(3000) });
    return true;
  } catch {
    return false;
  }
}

// ── Autenticação ─────────────────────────────
async function login(email, senha) {
  try {
    // Usa o endpoint de autenticação oficial
    const response = await post('/api/auth/login', { email, senha });
    
    // Busca os dados completos do funcionário
    const funcionario = await get(`/api/funcionarios/${response.id}`);
    
    return {
      id: funcionario.id,
      nomeCompleto: funcionario.nomeCompleto,
      email: funcionario.email,
      cargo: funcionario.cargo,
      nivelAcesso: funcionario.nivelAcesso,
      imagemUrl: funcionario.imagemUrl ?? null,
      idEmpresa: funcionario.idEmpresa,
      nomeEmpresa: funcionario.nomeEmpresa,
    };
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      throw new Error('Não foi possível conectar à API. Verifique se o servidor está rodando.');
    }
    throw error;
  }
}

// ── Empresas ──────────────────────────────────
const empresas = {
  list: () => get('/api/empresas'),
  get: (id) => get(`/api/empresas/${id}`),
  create: (data) => post('/api/empresas', data),
  update: (id, d) => put(`/api/empresas/${id}`, d),
  delete: (id) => del(`/api/empresas/${id}`),
};

// ── Funcionários ──────────────────────────────
const funcionarios = {
  list: () => get('/api/funcionarios'),
  get: (id) => get(`/api/funcionarios/${id}`),
  byEmpresa: (idEmp) => get(`/api/funcionarios/empresa/${idEmp}`),
  create: (data) => {
    // Mapeia campos do frontend para o backend
    const mapped = {
      nomeCompleto: data.nomeCompleto,
      cpf: data.cpf,
      email: data.email,
      senha: data.senha,
      cargo: data.cargo,
      nivelAcesso: data.nivelAcesso,
      telefone: data.telefone,
      cep: data.cep,
      endereco: data.endereco,
      numero: data.numero,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
      idEmpresa: data.idEmpresa,
      imagemUrl: data.imagemUrl,
      dataContratacao: data.dataContratacao || data.dataAdmissao,
      ativo: data.ativo,
    };
    return post('/api/funcionarios', mapped);
  },
  update: (id, data) => {
    const mapped = {
      nomeCompleto: data.nomeCompleto,
      cpf: data.cpf,
      email: data.email,
      cargo: data.cargo,
      nivelAcesso: data.nivelAcesso,
      telefone: data.telefone,
      cep: data.cep,
      endereco: data.endereco,
      numero: data.numero,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
      idEmpresa: data.idEmpresa,
      imagemUrl: data.imagemUrl,
      dataContratacao: data.dataContratacao || data.dataAdmissao,
      ativo: data.ativo,
    };
    // Só inclui senha se foi fornecida
    if (data.senha) {
      mapped.senha = data.senha;
    }
    return put(`/api/funcionarios/${id}`, mapped);
  },
  delete: (id) => del(`/api/funcionarios/${id}`),
};

// ── Fornecedores ──────────────────────────────
const fornecedores = {
  list: () => get('/api/fornecedores'),
  get: (id) => get(`/api/fornecedores/${id}`),
  create: (data) => post('/api/fornecedores', data),
  update: (id, d) => put(`/api/fornecedores/${id}`, d),
  delete: (id) => del(`/api/fornecedores/${id}`),
};

// ── Categorias ────────────────────────────────
const categorias = {
  list: () => get('/api/categorias'),
  get: (id) => get(`/api/categorias/${id}`),
  create: (data) => {
    // Mapeia campos do frontend para o backend
    const mapped = {
      descricao: data.descricao || data.nome,
      ativo: data.ativo,
      dataCadastro: data.dataCadastro,
    };
    return post('/api/categorias', mapped);
  },
  update: (id, data) => {
    const mapped = {
      descricao: data.descricao || data.nome,
      ativo: data.ativo,
    };
    return put(`/api/categorias/${id}`, mapped);
  },
  delete: (id) => del(`/api/categorias/${id}`),
};

// ── Produtos ──────────────────────────────────
const produtos = {
  list: () => get('/api/produtos'),
  get: (id) => get(`/api/produtos/${id}`),
  buscarNome: (nome) => get(`/api/produtos/buscar?nome=${encodeURIComponent(nome)}`),
  estoqueBaixo: (qtd) => get(`/api/produtos/estoque-baixo?quantidade=${qtd || 5}`),
  create: (data) => {
    // Mapeia campos do frontend para o backend
    const mapped = {
      nome: data.nome,
      descricao: data.descricao,
      precoVenda: data.precoVenda || data.preco,
      precoCompra: data.precoCusto || 0,
      quantidade: data.quantidadeEstoque || data.quantidade || 0,
      idFornecedor: data.idFornecedor,
      idCategoria: data.idCategoria,
      quantidadeMinima: data.estoqueMinimo || data.quantidadeMinima || 0,
      dataCadastro: data.dataCadastro,
      ativo: data.ativo,
      // Campos fiscais
      ncm: data.ncm,
      cfop: data.cfop,
      cest: data.cest,
      unidadeComercial: data.unidadeMedida || data.unidadeComercial,
      unidadeTributavel: data.unidadeTributavel,
      gtinEan: data.codigoBarras || data.gtinEan,
      origemMercadoria: data.origemMercadoria,
      cstCsosnIcms: data.cstCsosnIcms,
      aliquotaIcms: data.aliquotaIcms,
      cstPis: data.cstPis,
      aliquotaPis: data.aliquotaPis,
      cstCofins: data.cstCofins,
      aliquotaCofins: data.aliquotaCofins,
    };
    return post('/api/produtos', mapped);
  },
  update: (id, data) => {
    const mapped = {
      nome: data.nome,
      descricao: data.descricao,
      precoVenda: data.precoVenda || data.preco,
      precoCompra: data.precoCusto || 0,
      quantidade: data.quantidadeEstoque || data.quantidade || 0,
      idFornecedor: data.idFornecedor,
      idCategoria: data.idCategoria,
      quantidadeMinima: data.estoqueMinimo || data.quantidadeMinima || 0,
      ativo: data.ativo,
      ncm: data.ncm,
      cfop: data.cfop,
      cest: data.cest,
      unidadeComercial: data.unidadeMedida || data.unidadeComercial,
      unidadeTributavel: data.unidadeTributavel,
      gtinEan: data.codigoBarras || data.gtinEan,
      origemMercadoria: data.origemMercadoria,
      cstCsosnIcms: data.cstCsosnIcms,
      aliquotaIcms: data.aliquotaIcms,
      cstPis: data.cstPis,
      aliquotaPis: data.aliquotaPis,
      cstCofins: data.cstCofins,
      aliquotaCofins: data.aliquotaCofins,
    };
    return put(`/api/produtos/${id}`, mapped);
  },
  delete: (id) => del(`/api/produtos/${id}`),
};

// ── Clientes ──────────────────────────────────
const clientes = {
  list: () => get('/api/clientes'),
  get: (id) => get(`/api/clientes/${id}`),
  create: (data) => {
    const mapped = {
      nomeCompleto: data.nome || data.nomeCompleto,
      cpf: data.cpf,
      email: data.email,
      telefone: data.telefone,
      cep: data.cep,
      endereco: data.endereco,
      numero: data.numero,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
      dataCadastro: data.dataCadastro,
      ativo: data.ativo,
      indicadorIe: data.indicadorIe,
    };
    return post('/api/clientes', mapped);
  },
  update: (id, data) => {
    const mapped = {
      nomeCompleto: data.nome || data.nomeCompleto,
      cpf: data.cpf,
      email: data.email,
      telefone: data.telefone,
      cep: data.cep,
      endereco: data.endereco,
      numero: data.numero,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
      ativo: data.ativo,
      indicadorIe: data.indicadorIe,
    };
    return put(`/api/clientes/${id}`, mapped);
  },
  delete: (id) => del(`/api/clientes/${id}`),
};

// ── Vendas ────────────────────────────────────
const vendas = {
  list: () => get('/api/vendas'),
  get: (id) => get(`/api/vendas/${id}`),
  byCliente: (idCliente) => get(`/api/vendas/cliente/${idCliente}`),
  byPeriodo: (inicio, fim) => get(`/api/vendas/periodo?inicio=${inicio}&fim=${fim}`),
  create: (data) => {
    const mapped = {
      idCliente: data.idCliente,
      idFuncionario: data.idFuncionario,
      metodoPagamento: data.metodoPagamento,
      itens: data.itens.map(item => ({
        idProduto: item.idProduto,
        quantidade: item.quantidade
      })),
    };
    return post('/api/vendas', mapped);
  },
  delete: (id) => del(`/api/vendas/${id}`),
};

const API = {
  setBaseURL,
  getBaseURL,
  ping,
  login,
  empresas,
  funcionarios,
  fornecedores,
  categorias,
  produtos,
  clientes,
  vendas,
};

export default API;