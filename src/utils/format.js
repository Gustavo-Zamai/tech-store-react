/* =============================================
   TECH STORE — Format helpers
   ============================================= */

/**
 * Converte uma data para o formato ISO sem timezone (para envio ao backend)
 * Exemplo: "2026-07-01T22:45:30"
 */
export function formatDateToISO(dateStr) {
  if (!dateStr) return null;

  try {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;

    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return null;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  } catch (e) {
    console.warn('Erro ao formatar data:', e);
    return null;
  }
}

/**
 * Formata uma data para exibição no frontend
 * Exemplo: "20/06/2026, 16:00"
 */
export function formatDateDisplay(dateStr) {
  if (!dateStr) return '—';

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }

    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/** Formata uma data para o valor de um <input type="datetime-local"> */
export function formatDateForInput(dateStr) {
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
}

/** Obtém a data atual formatada para envio ao backend */
export function getCurrentDateTimeISO() {
  return formatDateToISO(new Date());
}

/** Formata moeda em Real brasileiro */
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);
}

/** Lista de estados brasileiros usada nos selects de UF */
export const ESTADOS_BR = [
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'],
  ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'],
  ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'],
  ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
  ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'],
  ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins'],
];

// utils/format.js

// ... código existente ...

/**
 * Retorna o label do regime tributário
 */
export function getRegimeTributarioLabel(value) {
  const regimes = {
    1: 'Simples Nacional',
    2: 'Simples Nacional - Excesso',
    3: 'Regime Normal'
  };
  return regimes[value] || '—';
}

/**
 * Retorna o label do ambiente NFe
 */
export function getAmbienteNFeLabel(value) {
  const ambientes = {
    1: 'Produção',
    2: 'Homologação'
  };
  return ambientes[value] || '—';
}
