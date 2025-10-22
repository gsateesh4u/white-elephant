export function GiftCard({
  gift,
  owner,
  canReveal,
  canSteal,
  onReveal,
  onSteal,
  onPreview,
  isCurrentParticipantGift,
  revealLabel = 'Reveal gift',
  stealLabel = 'Steal gift',
  showReveal = true,
  showSteal = true,
  stealDisabledReason,
}) {
  const statusLabel = gift.revealed
    ? owner
      ? `Owned by ${owner.name}`
      : 'Revealed'
    : 'Wrapped';

  return (
    <div className={`gift-card${gift.revealed ? ' revealed' : ''}${gift.locked ? ' locked' : ''}`}>
      <div className="gift-card-content">
        <div className="gift-image">
          {gift.revealed ? (
            <img src={gift.imageUrl} alt={gift.name} />
          ) : (
            <div className="wrapped">
              <span role="img" aria-label="wrapped gift">
                🎁
              </span>
            </div>
          )}
          {gift.revealed && onPreview && (
            <button
              type="button"
              className="gift-zoom-button"
              onClick={() => onPreview(gift)}
              title="Zoom in"
              aria-label={`View ${gift.name} in a larger preview`}
            >
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.71.71l.27.28v.79l5 5L20.49 19l-5-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zm-1-4h2v2h1v-2h2v-1h-2V7h-1v2h-2z" />
              </svg>
            </button>
          )}
          {gift.locked && <div className="gift-lock">🔒</div>}
        </div>
        <div className="gift-info">
          <h3>{gift.revealed ? gift.name : 'Mystery Gift'}</h3>
          <p className="muted">
            {gift.revealed ? gift.description : 'Waiting to be revealed'}
          </p>
          <div className="gift-meta">
            <span>{statusLabel}</span>
            {gift.timesStolen > 0 && (
              <span className="badge soft">Stolen {gift.timesStolen}×</span>
            )}
            {isCurrentParticipantGift && !gift.locked && (
              <span className="badge">At risk!</span>
            )}
          </div>
        </div>
      </div>
      <div className="gift-actions">
        {showReveal && (
          <button
            className="primary"
            onClick={() => onReveal(gift)}
            disabled={!canReveal}
          >
            {revealLabel}
          </button>
        )}
        {showSteal && (
          <button
            className="secondary"
            onClick={() => onSteal(gift)}
            disabled={!canSteal}
            title={stealDisabledReason || undefined}
          >
            {stealLabel}
          </button>
        )}
      </div>
    </div>
  );
}

