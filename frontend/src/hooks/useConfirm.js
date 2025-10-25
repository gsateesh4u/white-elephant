import { useCallback, useState } from 'react';

export function useConfirm() {
  const [dialog, setDialog] = useState(null);

  const requestConfirmation = useCallback((options) => {
    setDialog({
      ...options,
      onConfirm: () => {
        setDialog(null);
        options.onConfirm?.();
      },
      onCancel: () => {
        setDialog(null);
        options.onCancel?.();
      },
    });
  }, []);

  return [dialog, requestConfirmation];
}
