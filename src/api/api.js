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
    const response = await post('/api/auth/login', { email, senha });
    
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
      ativo: funcionario.ativo,
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
    const mapped = {
      nomeCompleto: data.nomeCompleto,
      cpf: data.cpf,
      email: data.email,
      senha: data.senha,
      cargo: data.cargo,
      nivelAcesso: data.nivelAcesso || 'USER',
      telefone: data.telefone,
      cep: data.cep,
      endereco: data.endereco,
      numero: data.numero ? parseInt(data.numero) : undefined,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
      idEmpresa: data.idEmpresa ? parseInt(data.idEmpresa) : undefined,
      imagemUrl: data.imagemUrl,
      dataContratacao: data.dataContratacao || data.dataAdmissao,
      ativo: data.ativo !== undefined ? data.ativo : true,
    };
    return post('/api/funcionarios', mapped);
  },
  update: (id, data) => {
    const mapped = {
      nomeCompleto: data.nomeCompleto,
      cpf: data.cpf,
      email: data.email,
      cargo: data.cargo,
      nivelAcesso: data.nivelAcesso || 'USER',
      telefone: data.telefone,
      cep: data.cep,
      endereco: data.endereco,
      numero: data.numero ? parseInt(data.numero) : undefined,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
      idEmpresa: data.idEmpresa ? parseInt(data.idEmpresa) : undefined,
      imagemUrl: data.imagemUrl,
      dataContratacao: data.dataContratacao || data.dataAdmissao,
      ativo: data.ativo !== undefined ? data.ativo : true,
    };
    if (data.senha && data.senha.trim()) {
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
  create: (data) => {
    const mapped = {
      nomeCompleto: data.nomeCompleto,
      cnpj: data.cnpj,
      email: data.email,
      telefone: data.telefone,
      cep: data.cep,
      endereco: data.endereco,
      numero: data.numero ? parseInt(data.numero) : undefined,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
      dataCadastro: data.dataCadastro,
      ativo: data.ativo !== undefined ? data.ativo : true,
    };
    return post('/api/fornecedores', mapped);
  },
  update: (id, data) => {
    const mapped = {
      nomeCompleto: data.nomeCompleto,
      cnpj: data.cnpj,
      email: data.email,
      telefone: data.telefone,
      cep: data.cep,
      endereco: data.endereco,
      numero: data.numero ? parseInt(data.numero) : undefined,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
      ativo: data.ativo !== undefined ? data.ativo : true,
    };
    return put(`/api/fornecedores/${id}`, mapped);
  },
  delete: (id) => del(`/api/fornecedores/${id}`),
};

// ── Grupos ────────────────────────────────────
const grupos = {
  list: () => get('/api/grupos'),
  get: (id) => get(`/api/grupos/${id}`),
  create: (data) => {
    const mapped = {
      descricao: data.descricao || data.nome,
      ativo: data.ativo !== undefined ? data.ativo : true,
      dataCadastro: data.dataCadastro,
    };
    return post('/api/grupos', mapped);
  },
  update: (id, data) => {
    const mapped = {
      descricao: data.descricao || data.nome,
      ativo: data.ativo !== undefined ? data.ativo : true,
    };
    return put(`/api/grupos/${id}`, mapped);
  },
  delete: (id) => del(`/api/grupos/${id}`),
};

// ── Produtos ──────────────────────────────────
const produtos = {
  list: () => get('/api/produtos'),
  get: (id) => get(`/api/produtos/${id}`),
  buscarNome: (nome) => get(`/api/produtos/buscar?nome=${encodeURIComponent(nome)}`),
  estoqueBaixo: (qtd) => get(`/api/produtos/estoque-baixo?quantidade=${qtd || 5}`),
  create: (data) => {
    const mapped = {
      nome: data.nome,
      descricao: data.descricao,
      precoVenda: data.precoVenda !== undefined ? parseFloat(data.precoVenda) : (data.preco ? parseFloat(data.preco) : 0),
      precoCompra: data.precoCompra !== undefined ? parseFloat(data.precoCompra) : (data.precoCusto ? parseFloat(data.precoCusto) : 0),
      quantidade: data.quantidade !== undefined ? parseInt(data.quantidade) : (data.quantidadeEstoque ? parseInt(data.quantidadeEstoque) : 0),
      idFornecedor: data.idFornecedor ? parseInt(data.idFornecedor) : undefined,
      idGrupo: data.idGrupo ? parseInt(data.idGrupo) : undefined,
      quantidadeMinima: data.quantidadeMinima !== undefined ? parseInt(data.quantidadeMinima) : (data.estoqueMinimo ? parseInt(data.estoqueMinimo) : 0),
      dataCadastro: data.dataCadastro,
      ativo: data.ativo !== undefined ? data.ativo : true,
      ncm: data.ncm,
      cfop: data.cfop,
      cest: data.cest,
      unidadeComercial: data.unidadeComercial || data.unidadeMedida || 'UN',
      unidadeTributavel: data.unidadeTributavel || data.unidadeMedida || 'UN',
      gtinEan: data.gtinEan || data.codigoBarras,
      origemMercadoria: data.origemMercadoria ? parseInt(data.origemMercadoria) : undefined,
      cstCsosnIcms: data.cstCsosnIcms,
      aliquotaIcms: data.aliquotaIcms ? parseFloat(data.aliquotaIcms) : undefined,
      cstPis: data.cstPis,
      aliquotaPis: data.aliquotaPis ? parseFloat(data.aliquotaPis) : undefined,
      cstCofins: data.cstCofins,
      aliquotaCofins: data.aliquotaCofins ? parseFloat(data.aliquotaCofins) : undefined,
      cstIbsCbs: data.cstIbsCbs,
      cClassTrib: data.cClassTrib,
      cBenef: data.cBenef,
      aliquotaIbsEstadual: data.aliquotaIbsEstadual ? parseFloat(data.aliquotaIbsEstadual) : undefined,
      aliquotaIbsMunicipal: data.aliquotaIbsMunicipal ? parseFloat(data.aliquotaIbsMunicipal) : undefined,
      aliquotaCbs: data.aliquotaCbs ? parseFloat(data.aliquotaCbs) : undefined,
      sujeitoImpostoSeletivo: data.sujeitoImpostoSeletivo !== undefined ? data.sujeitoImpostoSeletivo : false,
      aliquotaImpostoSeletivo: data.aliquotaImpostoSeletivo ? parseFloat(data.aliquotaImpostoSeletivo) : undefined,
    };
    return post('/api/produtos', mapped);
  },
  update: (id, data) => {
    const mapped = {
      nome: data.nome,
      descricao: data.descricao,
      precoVenda: data.precoVenda !== undefined ? parseFloat(data.precoVenda) : (data.preco ? parseFloat(data.preco) : 0),
      precoCompra: data.precoCompra !== undefined ? parseFloat(data.precoCompra) : (data.precoCusto ? parseFloat(data.precoCusto) : 0),
      quantidade: data.quantidade !== undefined ? parseInt(data.quantidade) : (data.quantidadeEstoque ? parseInt(data.quantidadeEstoque) : 0),
      idFornecedor: data.idFornecedor ? parseInt(data.idFornecedor) : undefined,
      idGrupo: data.idGrupo ? parseInt(data.idGrupo) : undefined,
      quantidadeMinima: data.quantidadeMinima !== undefined ? parseInt(data.quantidadeMinima) : (data.estoqueMinimo ? parseInt(data.estoqueMinimo) : 0),
      ativo: data.ativo !== undefined ? data.ativo : true,
      ncm: data.ncm,
      cfop: data.cfop,
      cest: data.cest,
      unidadeComercial: data.unidadeComercial || data.unidadeMedida || 'UN',
      unidadeTributavel: data.unidadeTributavel || data.unidadeMedida || 'UN',
      gtinEan: data.gtinEan || data.codigoBarras,
      origemMercadoria: data.origemMercadoria ? parseInt(data.origemMercadoria) : undefined,
      cstCsosnIcms: data.cstCsosnIcms,
      aliquotaIcms: data.aliquotaIcms ? parseFloat(data.aliquotaIcms) : undefined,
      cstPis: data.cstPis,
      aliquotaPis: data.aliquotaPis ? parseFloat(data.aliquotaPis) : undefined,
      cstCofins: data.cstCofins,
      aliquotaCofins: data.aliquotaCofins ? parseFloat(data.aliquotaCofins) : undefined,
      cstIbsCbs: data.cstIbsCbs,
      cClassTrib: data.cClassTrib,
      cBenef: data.cBenef,
      aliquotaIbsEstadual: data.aliquotaIbsEstadual ? parseFloat(data.aliquotaIbsEstadual) : undefined,
      aliquotaIbsMunicipal: data.aliquotaIbsMunicipal ? parseFloat(data.aliquotaIbsMunicipal) : undefined,
      aliquotaCbs: data.aliquotaCbs ? parseFloat(data.aliquotaCbs) : undefined,
      sujeitoImpostoSeletivo: data.sujeitoImpostoSeletivo !== undefined ? data.sujeitoImpostoSeletivo : false,
      aliquotaImpostoSeletivo: data.aliquotaImpostoSeletivo ? parseFloat(data.aliquotaImpostoSeletivo) : undefined,
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
      nomeCompleto: data.nomeCompleto || data.nome,
      cpf: data.cpf,
      email: data.email,
      telefone: data.telefone,
      cep: data.cep,
      endereco: data.endereco,
      numero: data.numero ? parseInt(data.numero) : undefined,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
      dataCadastro: data.dataCadastro,
      ativo: data.ativo !== undefined ? data.ativo : true,
      indicadorIe: data.indicadorIe ? parseInt(data.indicadorIe) : undefined,
    };
    return post('/api/clientes', mapped);
  },
  update: (id, data) => {
    const mapped = {
      nomeCompleto: data.nomeCompleto || data.nome,
      cpf: data.cpf,
      email: data.email,
      telefone: data.telefone,
      cep: data.cep,
      endereco: data.endereco,
      numero: data.numero ? parseInt(data.numero) : undefined,
      bairro: data.bairro,
      cidade: data.cidade,
      estado: data.estado,
      ativo: data.ativo !== undefined ? data.ativo : true,
      indicadorIe: data.indicadorIe ? parseInt(data.indicadorIe) : undefined,
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
      idCliente: data.idCliente ? parseInt(data.idCliente) : undefined,
      idFuncionario: data.idFuncionario ? parseInt(data.idFuncionario) : undefined,
      metodoPagamento: data.metodoPagamento,
      metodoPagamentoCodigo: data.metodoPagamentoCodigo,
      itens: (data.itens || []).map(item => ({
        idProduto: parseInt(item.idProduto),
        quantidade: parseInt(item.quantidade)
      })),
    };
    return post('/api/vendas', mapped);
  },
  delete: (id) => del(`/api/vendas/${id}`),
};

// ── Marcas ────────────────────────────────────
const marcas = {
  list:   ()       => get('/api/marcas'),
  get:    (id)     => get(`/api/marcas/${id}`),
  create: (data)   => post('/api/marcas', data),
  update: (id, d)  => put(`/api/marcas/${id}`, d),
  delete: (id)     => del(`/api/marcas/${id}`),
};

// ── Unidades de Medida ────────────────────────
const unidades = {
  list:   ()       => get('/api/unidades-medida'),
  get:    (id)     => get(`/api/unidades-medida/${id}`),
  create: (data)   => post('/api/unidades-medida', data),
  update: (id, d)  => put(`/api/unidades-medida/${id}`, d),
  delete: (id)     => del(`/api/unidades-medida/${id}`),
};


const API = {
  setBaseURL,
  getBaseURL,
  ping,
  login,
  empresas,
  funcionarios,
  fornecedores,
  grupos,
  produtos,
  clientes,
  vendas,
  marcas,
  unidades,
};

export default API;