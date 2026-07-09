// components/TableHelpers.jsx

export function Spinner() {
  return <span className="spinner" />;
}

export function LoadingRow({ colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ textAlign: 'center', padding: '2rem' }}>
        <Spinner />
      </td>
    </tr>
  );
}

export function EmptyRow({ colSpan, message = 'Nenhum registro encontrado.' }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
        {message}
      </td>
    </tr>
  );
}

export function StatusBadge({ ativo }) {
  return (
    <span className={`badge ${ativo ? 'badge-success' : 'badge-danger'}`}>
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  );
}

// ─── Funções de label para exibição ───

/**
 * Retorna o label do indicador IE
 */
export function getIndicadorIeLabel(value) {
  const labels = {
    1: 'Contribuinte ICMS',
    2: 'Isento de Inscrição',
    9: 'Não Contribuinte'
  };
  return labels[value] || '—';
}

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

/**
 * Retorna o label da origem da mercadoria
 */
export function getOrigemMercadoriaLabel(value) {
  const labels = {
    0: 'Nacional',
    1: 'Estrangeira - Importação direta',
    2: 'Estrangeira - Adquirida no mercado interno',
    3: 'Estrangeira - Importação direta sem similar nacional',
    4: 'Estrangeira - Adquirida no mercado interno sem similar nacional',
    5: 'Estrangeira - Importação direta com similar nacional',
    6: 'Estrangeira - Adquirida no mercado interno com similar nacional',
    7: 'Estrangeira - Importação direta de bem usado',
    8: 'Estrangeira - Adquirida no mercado interno de bem usado',
  };
  return labels[value] || '—';
}

/**
 * Retorna o label do CST IBS/CBS
 */
export function getCstIbsCbsLabel(value) {
  const labels = {
    '100': '100 - Tributado Integralmente',
    '110': '110 - Tributado com Alíquota Zero',
    '120': '120 - Isento',
    '130': '130 - Imune',
    '140': '140 - Suspenso',
    '150': '150 - Diferimento',
    '160': '160 - Não Tributado',
    '410': '410 - Não Alíquotas (ST)',
    '420': '420 - Substituição Tributária',
  };
  return labels[value] || value || '—';
}