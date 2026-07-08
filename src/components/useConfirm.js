import { useState, useCallback } from 'react';

/**
 * Hook que reproduz o comportamento do confirmDelete() da versão vanilla.
 * Uso:
 *   const { confirmState, requestConfirm, cancelConfirm } = useConfirm();
 *   requestConfirm(nome, async () => { ...excluir... });
 *   <ConfirmModal open={confirmState.open} name={confirmState.name}
 *                 onCancel={cancelConfirm} onConfirm={confirmState.onConfirm} />
 */
export function useConfirm() {
  const [confirmState, setConfirmState] = useState({ open: false, name: '', onConfirm: null });

  const requestConfirm = useCallback((name, action) => {
    setConfirmState({
      open: true,
      name,
      onConfirm: async () => {
        setConfirmState({ open: false, name: '', onConfirm: null });
        await action();
      },
    });
  }, []);

  const cancelConfirm = useCallback(() => {
    setConfirmState({ open: false, name: '', onConfirm: null });
  }, []);

  return { confirmState, requestConfirm, cancelConfirm };
}
