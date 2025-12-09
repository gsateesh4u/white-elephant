export function ParticipantList({
  participants,
  gifts,
  currentParticipantId,
  currentParticipantName,
  firstParticipantId,
  firstParticipantName,
  swapModeActive,
}) {
  const giftById = new Map(gifts.map((gift) => [gift.id, gift]));
  const orderedParticipants = [...participants].sort((a, b) => {
    const isACurrent =
      currentParticipantId
        ? a.id === currentParticipantId
        : currentParticipantName && a.name === currentParticipantName;
    const isBCurrent =
      currentParticipantId
        ? b.id === currentParticipantId
        : currentParticipantName && b.name === currentParticipantName;
    if (isACurrent && !isBCurrent) return -1;
    if (!isACurrent && isBCurrent) return 1;
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
          const isCurrent =
            currentParticipantId
              ? participant.id === currentParticipantId
              : currentParticipantName && participant.name === currentParticipantName;
          const isFirst =
            firstParticipantId
              ? participant.id === firstParticipantId
              : firstParticipantName && participant.name === firstParticipantName;
          const gift = participant.currentGiftId
            ? giftById.get(participant.currentGiftId)
            : null;
          return (
            <div
              key={participant.id ?? `participant-${participant.playOrder}`}
              className={`participant-card${isCurrent ? ' active' : ''}`}
            >
              <img src={participant.photoUrl} alt={participant.name} />
              <div>
                <div className="participant-name">
                  <span className="participant-order-badge">#{participant.playOrder}</span>
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
