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
