// components/AddressFields.jsx

import { ESTADOS_BR } from '../utils/format';

export default function AddressFields({ form, setForm }) {
  return (
    <>
      <div className="form-group">
        <label>Endereço</label>
        <input className="form-control" value={form.endereco || ''}
          onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
      </div>

      <div className="grid-3">
        <div className="form-group">
          <label>Bairro</label>
          <input className="form-control" value={form.bairro || ''}
            onChange={(e) => setForm({ ...form, bairro: e.target.value })} />
        </div>
        <div className="form-group">
          <label>CEP</label>
          <input className="form-control" value={form.cep || ''}
            onChange={(e) => setForm({ ...form, cep: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Nº</label>
          <input className="form-control" type="number" value={form.numero || ''}
            onChange={(e) => setForm({ ...form, numero: e.target.value })} />
        </div>
      </div>

      <div className="form-group">
        <label>Cidade</label>
        <input className="form-control" value={form.cidade || ''}
          onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
      </div>

      <div className="form-group">
        <label>Estado</label>
        <select className="form-control" value={form.estado || ''}
          onChange={(e) => setForm({ ...form, estado: e.target.value })}>
          <option value="">Selecione um estado</option>
          {ESTADOS_BR.map(([uf, nome]) => (
            <option key={uf} value={uf}>{nome}</option>
          ))}
        </select>
      </div>
    </>
  );
}