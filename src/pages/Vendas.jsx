// pages/Vendas.jsx

import { useEffect, useState, useMemo } from 'react';
import API from '../api/api';
import { useToast } from '../context/ToastContext';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { useConfirm } from '../components/useConfirm';
import { formatCurrency, formatDateDisplay, formatDateForInput, formatDateToISO } from '../utils/format';
import { LoadingRow, EmptyRow } from '../components/TableHelpers';

const METODOS = ['CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX', 'DINHEIRO', 'TRANSFERENCIA'];

export default function Vendas() {
  const toast = useToast();
  const [vendas, setVendas] = useState(null);
  const [error, setError] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);

  const [clientesList, setClientesList] = useState([]);
  const [funcList, setFuncList] = useState([]);
  const [prodList, setProdList] = useState([]);

  // Form principal
  const [form, setForm] = useState({ 
    idCliente: '', 
    idFuncionario: '', 
    metodoPagamento: '', 
    dataVenda: '',
    desconto: 0,
    troco: 0
  });
  
  const [itens, setItens] = useState([]);
  const [selProduto, setSelProduto] = useState('');
  const [qtd, setQtd] = useState(1);
  const [valorPago, setValorPago] = useState('');

  const { confirmState, requestConfirm, cancelConfirm } = useConfirm();

  const load = async () => {
    try {
      const data = await API.vendas.list();
      setVendas(data || []);
      setError(false);
    } catch {
      setError(true);
    }
  };

  useEffect(() => { load(); }, []);

  // Cálculo do subtotal (soma dos itens)
  const subtotal = useMemo(() => {
    return itens.reduce((acc, item) => {
      const prod = prodList.find((p) => String(p.id) === String(item.idProduto));
      const preco = prod?.precoVenda ?? 0;
      return acc + preco * item.quantidade;
    }, 0);
  }, [itens, prodList]);

  // Cálculo do total com desconto
  const totalComDesconto = useMemo(() => {
    const desconto = parseFloat(form.desconto) || 0;
    return Math.max(0, subtotal - desconto);
  }, [subtotal, form.desconto]);

  // Cálculo do troco
  const trocoCalculado = useMemo(() => {
    const pago = parseFloat(valorPago) || 0;
    if (pago > 0 && pago >= totalComDesconto) {
      return pago - totalComDesconto;
    }
    return 0;
  }, [valorPago, totalComDesconto]);

  // Atualiza o troco no form automaticamente
  useEffect(() => {
    setForm(prev => ({ ...prev, troco: trocoCalculado }));
  }, [trocoCalculado]);

  const openModal = async (venda) => {
    setLoadingModal(true);
    setModalOpen(true);
    setEditing(venda ?? null);

    const [clis, funcs, prods] = await Promise.all([
      API.clientes.list().catch(() => []),
      API.funcionarios.list().catch(() => []),
      API.produtos.list().catch(() => []),
    ]);
    setClientesList(clis || []);
    setFuncList(funcs || []);
    setProdList(prods || []);

    if (venda) {
      setForm({
        idCliente: venda.idCliente ?? '',
        idFuncionario: venda.idFuncionario ?? '',
        metodoPagamento: venda.metodoPagamento ?? '',
        dataVenda: venda.dataVenda ? formatDateForInput(venda.dataVenda) : '',
        desconto: venda.desconto ?? 0,
        troco: venda.troco ?? 0,
      });
      setItens(venda.itens?.map((i) => ({ 
        idProduto: i.idProduto, 
        quantidade: i.quantidade,
        precoUnitario: i.precoUnitario 
      })) || []);
      setValorPago(venda.valorPago ? String(venda.valorPago) : '');
    } else {
      setForm({
        idCliente: '',
        idFuncionario: '',
        metodoPagamento: '',
        dataVenda: '',
        desconto: 0,
        troco: 0
      });
      setItens([]);
      setValorPago('');
    }

    setSelProduto('');
    setQtd(1);
    setLoadingModal(false);
  };

  const openEdit = async (id) => {
    try {
      const v = await API.vendas.get(id);
      openModal(v);
    } catch (err) {
      toast.error('Erro ao carregar venda');
      console.error(err);
    }
  };

  const handleDelete = (id) => requestConfirm(`Venda #${id}`, async () => {
    try { 
      await API.vendas.delete(id); 
      toast.success('Venda excluída!'); 
      load(); 
    } catch (e) { 
      toast.error(e.message); 
    }
  });

  const addItem = () => {
    const q = parseInt(qtd, 10);
    if (!selProduto || !q || q < 1) { 
      toast.error('Selecione um produto e quantidade válida.'); 
      return; 
    }

    const prod = prodList.find((p) => String(p.id) === String(selProduto));
    const estoqueAtual = prod?.quantidade ?? 0;

    setItens((prev) => {
      const exists = prev.find((i) => String(i.idProduto) === String(selProduto));
      if (exists) {
        const novaQtd = exists.quantidade + q;
        if (novaQtd > estoqueAtual) {
          toast.error(`Estoque insuficiente. Disponível: ${estoqueAtual}`);
          return prev;
        }
        return prev.map((i) => 
          String(i.idProduto) === String(selProduto)
            ? { ...i, quantidade: novaQtd }
            : i
        );
      }
      
      if (q > estoqueAtual) {
        toast.error(`Estoque insuficiente. Disponível: ${estoqueAtual}`);
        return prev;
      }
      
      return [...prev, { 
        idProduto: Number(selProduto), 
        quantidade: q,
        precoUnitario: prod?.precoVenda ?? 0
      }];
    });
  };

  const removeItem = (idx) => setItens((prev) => prev.filter((_, i) => i !== idx));

  const updateItemQuantity = (idx, novaQtd) => {
    const q = parseInt(novaQtd, 10);
    if (q < 1) return;
    
    const item = itens[idx];
    const prod = prodList.find((p) => String(p.id) === String(item.idProduto));
    const estoqueAtual = prod?.quantidade ?? 0;
    
    if (q > estoqueAtual) {
      toast.error(`Estoque insuficiente. Disponível: ${estoqueAtual}`);
      return;
    }
    
    setItens((prev) => prev.map((i, index) => 
      index === idx ? { ...i, quantidade: q } : i
    ));
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    
    if (!form.idCliente) {
      toast.error('Selecione um cliente.');
      return;
    }
    if (!form.idFuncionario) {
      toast.error('Selecione um funcionário.');
      return;
    }
    if (!form.metodoPagamento) {
      toast.error('Selecione um método de pagamento.');
      return;
    }
    if (!itens.length) { 
      toast.error('Adicione pelo menos um item.'); 
      return; 
    }

    setSaving(true);
    try {
      const data = {
        idCliente: parseInt(form.idCliente),
        idFuncionario: parseInt(form.idFuncionario),
        metodoPagamento: form.metodoPagamento,
        itens: itens.map((i) => ({ 
          idProduto: i.idProduto, 
          quantidade: i.quantidade 
        })),
      };

      if (editing) {
        // Nota: A API atual não tem PUT para vendas
        toast.warning('Edição de vendas não está disponível no backend.');
      } else {
        await API.vendas.create(data);
      }
      
      toast.success(editing ? 'Venda atualizada!' : 'Venda registrada com sucesso!');
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar venda');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Renderização do status da venda
  const getSituacaoBadge = (status) => {
    const badges = {
      'CONCLUIDA': 'badge-success',
      'CANCELADA': 'badge-danger',
      'PENDENTE': 'badge-warning',
      'NAO_EMITIDA': 'badge-muted'
    };
    return badges[status] || 'badge-info';
  };

  return (
    <>
      <div className="section-header">
        <h1>Vendas</h1>
        <button className="btn btn-primary" onClick={() => openModal(null)}>+ Nova Venda</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Funcionário</th>
              <th>Pagamento</th>
              <th>Itens</th>
              <th>Total</th>
              <th>Data</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {vendas === null && !error && <LoadingRow colSpan={9} />}
            {error && <EmptyRow colSpan={9} message="Erro ao carregar vendas." />}
            {vendas !== null && vendas.length === 0 && <EmptyRow colSpan={9} />}
            {vendas?.map((v) => {
              const total = v.total ?? 0;
              
              return (
                <tr key={v.id}>
                  <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--accent)' }}>#{v.id}</code></td>
                  <td>{v.nomeCliente ?? v.idCliente ?? '—'}</td>
                  <td>{v.nomeFuncionario ?? v.idFuncionario ?? '—'}</td>
                  <td><span className="badge badge-info">{v.metodoPagamento ?? '—'}</span></td>
                  <td style={{ textAlign: 'center' }}>{v.itens?.length ?? '—'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{formatCurrency(total)}</td>
                  <td style={{ fontSize: '.8125rem', color: 'var(--text-secondary)' }}>{formatDateDisplay(v.dataVenda)}</td>
                  <td><span className={`badge ${getSituacaoBadge(v.status)}`}>{v.status ?? 'CONCLUIDA'}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(v.id)}>✏️ Editar</button>{' '}
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(v.id)}>🗑️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} maxWidth={720}>
        <h2>{editing ? 'Editar Venda' : 'Nova Venda'}</h2>
        {loadingModal ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" /></div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="form-group">
                <label>Cliente *</label>
                <select className="form-control" required value={form.idCliente}
                  onChange={(e) => setForm({ ...form, idCliente: e.target.value })}>
                  <option value="">— Selecione —</option>
                  {clientesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.nomeCompleto}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Funcionário *</label>
                <select className="form-control" required value={form.idFuncionario}
                  onChange={(e) => setForm({ ...form, idFuncionario: e.target.value })}>
                  <option value="">— Selecione —</option>
                  {funcList.map((f) => (
                    <option key={f.id} value={f.id}>{f.nomeCompleto}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Método de Pagamento *</label>
                <select className="form-control" required value={form.metodoPagamento}
                  onChange={(e) => setForm({ ...form, metodoPagamento: e.target.value })}>
                  <option value="">— Selecione —</option>
                  {METODOS.map((m) => (
                    <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Data da Venda</label>
                <input className="form-control" type="datetime-local" value={form.dataVenda}
                  onChange={(e) => setForm({ ...form, dataVenda: e.target.value })} />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '.8125rem', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Itens da Venda
              </label>
              
              <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem', marginBottom: '.75rem' }}>
                <select className="form-control" style={{ flex: 1 }} value={selProduto} 
                  onChange={(e) => setSelProduto(e.target.value)}>
                  <option value="">— Produto —</option>
                  {prodList.map((p) => {
                    const estoque = p.quantidade ?? 0;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({formatCurrency(p.precoVenda)}) - Estoque: {estoque}
                      </option>
                    );
                  })}
                </select>
                <input className="form-control" type="number" min="1" style={{ width: 80 }} value={qtd}
                  onChange={(e) => setQtd(e.target.value)} />
                <button type="button" className="btn btn-secondary" onClick={addItem}>+ Add</button>
              </div>

              <div>
                {itens.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '.875rem', textAlign: 'center', padding: '.5rem' }}>
                    Nenhum item adicionado ainda.
                  </p>
                )}
                {itens.map((item, idx) => {
                  const prod = prodList.find((p) => String(p.id) === String(item.idProduto));
                  const preco = item.precoUnitario ?? prod?.precoVenda ?? 0;
                  const subtotalItem = preco * item.quantidade;
                  const estoque = prod?.quantidade ?? 0;
                  
                  return (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '.75rem', 
                      padding: '.5rem .75rem', 
                      background: 'var(--bg-base)', 
                      borderRadius: 'var(--radius-sm)', 
                      marginBottom: '.375rem' 
                    }}>
                      <span style={{ flex: 1, fontSize: '.875rem' }}>{prod?.nome ?? item.idProduto}</span>
                      <input 
                        type="number" 
                        min="1"
                        max={estoque}
                        style={{ width: 60, padding: '.25rem .5rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)' }}
                        value={item.quantidade}
                        onChange={(e) => updateItemQuantity(idx, e.target.value)}
                      />
                      <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>× {formatCurrency(preco)}</span>
                      <span style={{ fontWeight: 600, color: 'var(--accent)', minWidth: 70, textAlign: 'right' }}>
                        {formatCurrency(subtotalItem)}
                      </span>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(idx)}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ 
              background: 'var(--bg-surface)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    Subtotal
                  </label>
                  <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatCurrency(subtotal)}
                  </div>
                </div>
                
                <div>
                  <label style={{ fontSize: '.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    Desconto
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max={subtotal}
                    style={{ 
                      width: '100%', 
                      padding: '.25rem .5rem', 
                      background: 'var(--bg-card)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '4px', 
                      color: 'var(--text-primary)',
                      fontSize: '1rem'
                    }}
                    value={form.desconto}
                    onChange={(e) => setForm({ ...form, desconto: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: '.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    Total
                  </label>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>
                    {formatCurrency(totalComDesconto)}
                  </div>
                </div>
              </div>

              {form.metodoPagamento === 'DINHEIRO' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                  <div>
                    <label style={{ fontSize: '.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                      Valor Pago
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      style={{ 
                        width: '100%', 
                        padding: '.25rem .5rem', 
                        background: 'var(--bg-card)', 
                        border: '1px solid var(--border)', 
                        borderRadius: '4px', 
                        color: 'var(--text-primary)',
                        fontSize: '1rem'
                      }}
                      value={valorPago}
                      onChange={(e) => setValorPago(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                      Troco
                    </label>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: trocoCalculado > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                      {formatCurrency(trocoCalculado)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner" /> Aguarde...</> : (editing ? 'Salvar' : 'Registrar Venda')}
              </button>
            </div>
          </form>
        )}
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