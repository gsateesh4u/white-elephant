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
  showAllCountries = false,
  onToggleAllCountries,
}) {
  const participantMap = new Map(participants.map((participant) => [participant.id, participant]));
  const currentParticipant = currentParticipantId
    ? participantMap.get(currentParticipantId)
    : null;
  const blockedGiftId = currentParticipantId ? stealBlocks?.[currentParticipantId] : null;
  const hasFilters = filters.length > 0;
  const hasGifts = gifts.length > 0;

  const currentCountryName = currentParticipant?.country;
  const scopeButtonLabel = showAllCountries
    ? (currentCountryName ? `View ${currentCountryName} gifts` : 'View current country')
    : 'View all countries';

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
        {(onToggleAllCountries || hasFilters) && (
          <div className="gift-header-tools">
            {onToggleAllCountries && (
              <button
                type="button"
                className={`gift-scope-toggle${showAllCountries ? ' active' : ''}`}
                onClick={onToggleAllCountries}
                aria-pressed={showAllCountries}
                title={showAllCountries ? 'Switch back to current country gifts' : 'View gifts from all countries'}
              >
                <span className="icon" aria-hidden="true">🌍</span>
                <span className="text">{scopeButtonLabel}</span>
              </button>
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
            {gifts.map((gift) => {
              const owner = gift.ownerParticipantId
                ? participantMap.get(gift.ownerParticipantId)
                : null;
              const isCurrentGift = currentParticipantId && gift.ownerParticipantId === currentParticipantId;
              const isCrossCountryView =
                showAllCountries &&
                currentParticipant &&
                gift.country !== currentParticipant.country;
              const canReveal =
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
                !isCrossCountryView &&
                (mode === 'turn' || mode === 'swap') &&
                gift.revealed &&
                !gift.locked &&
                gift.ownerParticipantId &&
                gift.ownerParticipantId !== currentParticipantId &&
                !isStealBlocked;

              const revealLabel = gift.revealed ? 'Revealed' : 'Unwrap gift';
              const stealLabel = mode === 'swap' ? 'Swap for this gift' : 'Steal gift';
              const stealDisabledReason = isCrossCountryView
                ? "Select gifts from the current participant's country in this view."
                : isStealBlocked
                ? 'Cannot steal back immediately'
                : undefined;

              return (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  owner={owner}
                  canReveal={canReveal}
                  canSteal={canSteal}
                  onReveal={onReveal}
                  onSteal={onSteal}
                  onPreview={onPreview}
                  revealLabel={revealLabel}
                  stealLabel={stealLabel}
                  showReveal={!isCrossCountryView && mode === 'turn'}
                  showSteal={!isCrossCountryView && (mode === 'turn' || mode === 'swap')}
                  isCurrentParticipantGift={isCurrentGift}
                  stealDisabledReason={stealDisabledReason}
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

