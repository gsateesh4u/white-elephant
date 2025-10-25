import { useCallback, useState } from 'react';

export function useConfirmDialog() {
  const [dialog, setDialog] = useState(null);

  const showConfirm = useCallback(({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) => {
    setDialog({
      title,
      message,
      confirmLabel,
      onConfirm: () => {
        setDialog(null);
        onConfirm?.();
      },
      onCancel: () => {
        setDialog(null);
        onCancel?.();
      },
    });
  }, []);

  return { dialog, showConfirm };
}
