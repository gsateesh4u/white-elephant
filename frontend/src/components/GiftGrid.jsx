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
  onPreview,
  countryFilter = 'all',
  onCountryFilterChange,
  readonly = false,
  highlightGiftIds = null,
  giftPositions = null,
  animatedRevealGiftIds = new Set(),
  revealAnimationGif = null,
}) {
  const participantMap = new Map(participants.map((participant) => [participant.id, participant]));
  const currentParticipant = currentParticipantId
    ? participantMap.get(currentParticipantId)
    : null;
  const blockedGiftId = currentParticipantId ? stealBlocks?.[currentParticipantId] : null;
  const hasFilters = filters.length > 0;
  const hasGifts = gifts.length > 0;

  const allowInteractions = !readonly;

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
      {(onCountryFilterChange || hasFilters) && (
        <div className="gift-header-tools">
          {typeof onCountryFilterChange === 'function' && (
            <label className="gift-filter-dropdown">
              <span className="label">Country</span>
              <select
                value={countryFilter}
                onChange={(event) => onCountryFilterChange?.(event.target.value)}
                aria-label="Filter by country"
              >
                <option value="all">All countries</option>
                <option value="India">India</option>
                <option value="US">US</option>
              </select>
            </label>
          )}
          {hasFilters && (
              <label className="gift-filter-dropdown">
                <span className="label">Filter</span>
                <select
                  value={activeFilter}
                  onChange={(event) => onFilterChange?.(event.target.value)}
                  aria-label="Filter visible gifts"
                >
                  {filters.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.count})
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
      </div>
      <div className="gift-grid-scroll">
        {hasGifts ? (
          <div className="gift-grid">
            {gifts.map((gift, index) => {
              const owner = gift.winnerParticipantId
                ? participantMap.get(gift.winnerParticipantId)
                : null;
              const isCurrentGift = currentParticipantId && gift.winnerParticipantId === currentParticipantId;
              const isCrossCountryView =
                Boolean(currentParticipant) &&
                ((countryFilter === 'all' && gift.country !== currentParticipant.country) ||
                  (countryFilter !== 'all' && countryFilter !== currentParticipant.country));
              const canReveal =
                allowInteractions &&
                !isCrossCountryView &&
                mode === 'turn' &&
                !gift.revealed &&
                Boolean(currentParticipantId);
              const isStealBlocked = Boolean(
                blockedGiftId &&
                gift.id &&
                gift.id === blockedGiftId
              );
              const canSteal =
                allowInteractions &&
                !isCrossCountryView &&
                (mode === 'turn' || mode === 'swap') &&
                gift.revealed &&
                !gift.locked &&
                gift.winnerParticipantId &&
                gift.winnerParticipantId !== currentParticipantId &&
                !isStealBlocked;

              const revealLabel = gift.revealed ? 'Revealed' : 'Unwrap gift';
              const stealLabel = mode === 'swap' ? 'Swap Gift' : 'Steal gift';
              const stealDisabledReason = isCrossCountryView
                ? "Select gifts from the current participant's country in this view."
                : isStealBlocked
                ? 'Cannot steal back immediately'
                : undefined;
              const revealHandler = allowInteractions ? onReveal : undefined;
              const stealHandler = allowInteractions ? onSteal : undefined;
              const isHighlighted =
                (Array.isArray(highlightGiftIds) && highlightGiftIds.includes(gift.id)) ||
                (highlightGiftIds instanceof Set && highlightGiftIds.has(gift.id)) ||
                false;
              const sequenceNumber =
                (giftPositions instanceof Map && giftPositions.get(gift.id)) ||
                (giftPositions && giftPositions[gift.id]) ||
                index + 1;
              const isAnimatedReveal =
                animatedRevealGiftIds instanceof Set
                  ? animatedRevealGiftIds.has(gift.id)
                  : Array.isArray(animatedRevealGiftIds)
                    ? animatedRevealGiftIds.includes(gift.id)
                    : false;

              return (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  owner={owner}
                  canReveal={canReveal}
                  canSteal={canSteal}
                  onReveal={revealHandler}
                  onSteal={stealHandler}
                  onPreview={onPreview}
                  revealLabel={revealLabel}
                  stealLabel={stealLabel}
                  showReveal={
                    allowInteractions && !isCrossCountryView && mode === 'turn'
                  }
                  showSteal={
                    allowInteractions && !isCrossCountryView && (mode === 'turn' || mode === 'swap')
                  }
                  isCurrentParticipantGift={isCurrentGift}
                  stealDisabledReason={stealDisabledReason}
                  isHighlighted={isHighlighted}
                  sequenceNumber={sequenceNumber}
                  showRevealAnimation={isAnimatedReveal}
                  revealAnimationGif={revealAnimationGif}
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

