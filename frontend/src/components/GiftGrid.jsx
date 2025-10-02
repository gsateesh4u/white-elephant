import { GiftCard } from './GiftCard.jsx';

export function GiftGrid({
  gifts,
  participants,
  currentParticipantId,
  mode = 'turn',
  onReveal,
  onSteal,
}) {
  const participantMap = new Map(participants.map((participant) => [participant.id, participant]));
  const currentParticipant = currentParticipantId
    ? participantMap.get(currentParticipantId)
    : null;

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Gifts</h2>
        {currentParticipant && (
          <span className="badge">
            {mode === 'swap'
              ? `${currentParticipant.name} deciding`
              : `${currentParticipant.name}'s turn`}
          </span>
        )}
      </div>
      <div className="gift-grid">
        {gifts.map((gift) => {
          const owner = gift.ownerParticipantId
            ? participantMap.get(gift.ownerParticipantId)
            : null;
          const isCurrentGift = currentParticipantId && gift.ownerParticipantId === currentParticipantId;
          const canReveal = mode === 'turn' && !gift.revealed && Boolean(currentParticipantId);
          const canSteal =
            (mode === 'turn' || mode === 'swap') &&
            gift.revealed &&
            !gift.locked &&
            gift.ownerParticipantId &&
            gift.ownerParticipantId !== currentParticipantId;

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
            />
          );
        })}
      </div>
    </div>
  );
}
