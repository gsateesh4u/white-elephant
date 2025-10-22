export function GiftPreviewDialog({ gift, owner, onClose }) {
  if (!gift) {
    return null;
  }

  const titleId = `gift-preview-${gift.id}`;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div
      className="gift-preview-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleBackdropClick}
    >
      <div className="gift-preview-dialog">
        <button
          type="button"
          className="gift-preview-close"
          onClick={onClose}
          aria-label="Close gift preview"
        >
          <span aria-hidden="true">&times;</span>
        </button>

        <div className="gift-preview-body">
          <div className="gift-preview-image">
            <img src={gift.imageUrl} alt={gift.name} />
          </div>
          <div className="gift-preview-details">
            <h2 id={titleId}>{gift.name}</h2>
            <p className="gift-preview-description">{gift.description}</p>
            <dl className="gift-preview-meta">
              {owner && (
                <>
                  <dt>Currently with</dt>
                  <dd>{owner.name}</dd>
                </>
              )}
              <dt>Gift ID</dt>
              <dd>{gift.id}</dd>
              <dt>Country</dt>
              <dd>{gift.country}</dd>
              {gift.timesStolen > 0 && (
                <>
                  <dt>Times stolen</dt>
                  <dd>{gift.timesStolen}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
