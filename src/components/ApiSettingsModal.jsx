import { useState } from 'react';
import API from '../api/api';
import { useToast } from '../context/ToastContext';
import Modal from './Modal';

export default function ApiSettingsModal({ open, onClose, onSaved }) {
  const toast = useToast();
  const [url, setUrl] = useState(API.getBaseURL());

  const handleOpen = () => setUrl(API.getBaseURL());

  const handleSave = () => {
    const val = url.trim();
    if (val) {
      API.setBaseURL(val);
      toast.success('URL da API salva!');
      onClose();
      onSaved?.();
    }
  };

  if (open && url !== undefined) {
    // keep field synced whenever the modal is (re)opened
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth={420}>
      <h2>Configurações da API</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', marginBottom: '1.25rem' }}>
        Informe a URL base do servidor backend.
      </p>
      <div className="form-group">
        <label>URL da API</label>
        <input
          className="form-control"
          type="url"
          placeholder="http://localhost:8080"
          value={url}
          onFocus={handleOpen}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem', marginTop: '1rem' }}>
        <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave}>Salvar</button>
      </div>
    </Modal>
  );
}
