export function FinalSwapPanel({
  currentParticipant,
  countryName,
  onPass,
  onEnd,
}) {
  if (!currentParticipant) {
    return null;
  }
  const countryLabel = countryName ? ` for ${countryName}` : '';
  return (
    <div className="panel highlight">
      <div className="panel-header">
        <h2>Swap Phase{countryLabel}</h2>
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
          Lock gifts for this country
        </button>
      </div>
    </div>
  );
}
