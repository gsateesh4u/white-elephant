import { GiftCard } from './GiftCard.jsx';

export function GiftGrid({
  gifts,
  participants,
  currentParticipantId,
  mode = 'turn',
  stealBlocks = {},
  filters = [],
  activeFilter,
  onFilterChange,
  onReveal,
  onSteal,
}) {
  const participantMap = new Map(participants.map((participant) => [participant.id, participant]));
  const currentParticipant = currentParticipantId
    ? participantMap.get(currentParticipantId)
    : null;
  const blockedGiftId = currentParticipantId ? stealBlocks?.[currentParticipantId] : null;
  const hasFilters = filters.length > 0;
  const hasGifts = gifts.length > 0;

  return (
    <div className="panel gift-panel">
      <div className="panel-header">
        <div className="panel-title">
          <h2>Gifts</h2>
          {currentParticipant && (
            <span className="badge">
              {mode === 'swap'
                ? `${currentParticipant.name} deciding`
                : `${currentParticipant.name}'s turn`}
            </span>
          )}
        </div>
        {hasFilters && (
          <div className="gift-filter-group" role="group" aria-label="Gift filters">
            {filters.map((option) => {
              const isActive = option.value === activeFilter;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`gift-filter-chip${isActive ? ' active' : ''}`}
                  onClick={() => {
                    if (!isActive) {
                      onFilterChange?.(option.value);
                    }
                  }}
                  aria-pressed={isActive}
                >
                  <span className="label">{option.label}</span>
                  <span className="count">{option.count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="gift-grid-scroll">
        {hasGifts ? (
          <div className="gift-grid">
            {gifts.map((gift) => {
              const owner = gift.ownerParticipantId
                ? participantMap.get(gift.ownerParticipantId)
                : null;
              const isCurrentGift = currentParticipantId && gift.ownerParticipantId === currentParticipantId;
              const canReveal = mode === 'turn' && !gift.revealed && Boolean(currentParticipantId);
              const isStealBlocked = Boolean(
                blockedGiftId &&
                gift.id &&
                gift.id === blockedGiftId
              );
              const canSteal =
                (mode === 'turn' || mode === 'swap') &&
                gift.revealed &&
                !gift.locked &&
                gift.ownerParticipantId &&
                gift.ownerParticipantId !== currentParticipantId &&
                !isStealBlocked;

              const revealLabel = gift.revealed ? 'Revealed' : 'Unwrap gift';
              const stealLabel = mode === 'swap' ? 'Swap for this gift' : 'Steal gift';

              return (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  owner={owner}
                  canReveal={canReveal}
                  canSteal={canSteal}
                  onReveal={onReveal}
                  onSteal={onSteal}
                  revealLabel={revealLabel}
                  stealLabel={stealLabel}
                  showReveal={mode === 'turn'}
                  showSteal={mode === 'turn' || mode === 'swap'}
                  isCurrentParticipantGift={isCurrentGift}
                  stealDisabledReason={isStealBlocked ? 'Cannot steal back immediately' : undefined}
                />
              );
            })}
          </div>
        ) : (
          <div className="gift-empty-state">No gifts match this filter.</div>
        )}
      </div>
    </div>
  );
}

