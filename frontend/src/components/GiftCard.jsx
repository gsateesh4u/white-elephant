export function GiftCard({
  gift,
  owner,
  canReveal,
  canSteal,
  onReveal,
  onSteal,
  isCurrentParticipantGift,
  revealLabel = 'Reveal gift',
  stealLabel = 'Steal gift',
  showReveal = true,
  showSteal = true,
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
          >
            {stealLabel}
          </button>
        )}
      </div>
    </div>
  );
}
