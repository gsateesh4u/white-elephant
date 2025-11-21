export function FinalSwapPanel({
  currentParticipant,
  countryName,
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
      <div className="control-buttons">
        <button className="primary" onClick={onEnd}>
          Lock gifts for this country
        </button>
      </div>
    </div>
  );
}
