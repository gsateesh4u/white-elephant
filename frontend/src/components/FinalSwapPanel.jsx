export function FinalSwapPanel({
  currentParticipant,
  onPass,
  onEnd,
}) {
  if (!currentParticipant) {
    return null;
  }
  return (
    <div className="panel highlight">
      <div className="panel-header">
        <h2>Swap Phase</h2>
        <span className="badge">Keep trading</span>
      </div>
      <p>
        {currentParticipant.name} can steal any unlocked, revealed gift or pass if they are happy.
        Keep cycling until everyone is satisfied or no more steals are available.
      </p>
      <div className="control-buttons">
        <button className="secondary" onClick={onPass}>
          Pass this turn
        </button>
        <button className="primary" onClick={onEnd}>
          I'm satisfied – end game
        </button>
      </div>
    </div>
  );
}
