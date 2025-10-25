import './ConfirmationDialog.css';

export function ConfirmationDialog({ dialog }) {
  if (!dialog) {
    return null;
  }

  return (
    <div className="confirm-backdrop">
      <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="confirm-header">
          <h3 id="confirm-title">{dialog.title}</h3>
        </div>
        <div className="confirm-body">
          <p>{dialog.message}</p>
        </div>
        <div className="confirm-actions">
          <button type="button" className="secondary" onClick={dialog.onCancel}>
            Cancel
          </button>
          <button type="button" className="primary" onClick={dialog.onConfirm}>
            {dialog.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
