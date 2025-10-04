export function ParticipantList({
  participants,
  gifts,
  currentParticipantId,
  firstParticipantId,
  swapModeActive,
}) {
  const giftById = new Map(gifts.map((gift) => [gift.id, gift]));
  const orderedParticipants = [...participants].sort((a, b) => {
    if (a.id === currentParticipantId) return -1;
    if (b.id === currentParticipantId) return 1;
    return 0;
  });

  return (
    <div className="panel participants-panel">
      <div className="panel-header">
        <h2>Participants</h2>
        {swapModeActive && <span className="badge">Swap phase</span>}
      </div>
      <div className="participant-list">
        {orderedParticipants.map((participant) => {
          const isCurrent = participant.id === currentParticipantId;
          const isFirst = participant.id === firstParticipantId;
          const gift = participant.currentGiftId
            ? giftById.get(participant.currentGiftId)
            : null;
          return (
            <div
              key={participant.id}
              className={`participant-card${isCurrent ? ' active' : ''}`}
            >
              <img src={participant.photoUrl} alt={participant.name} />
              <div>
                <div className="participant-name">
                  {participant.name}
                  {isFirst && <span className="badge soft">#1</span>}
                </div>
                {gift ? (
                  <div className="participant-gift">
                    <span className="emoji">🎁</span>
                    <span>{gift.name}</span>
                    {gift.locked && <span className="badge locked">Locked</span>}
                  </div>
                ) : (
                  <div className="participant-gift muted">Waiting for a gift</div>
                )}
                {isCurrent && <div className="turn-indicator">Current turn</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
