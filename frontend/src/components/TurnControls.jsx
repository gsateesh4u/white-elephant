export function TurnControls({
  onShuffle,
  onReset,
  onEnd,
  disabled,
  canShuffle,
  gameCompleted,
  swapModeActive,
}) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Host Controls</h2>
        {gameCompleted ? (
          <span className="badge">Game complete</span>
        ) : swapModeActive ? (
          <span className="badge">Swap phase</span>
        ) : (
          <span className="badge soft">Live</span>
        )}
      </div>
      <div className="control-buttons">
        <button
          className="secondary"
          onClick={onShuffle}
          disabled={disabled || !canShuffle}
        >
          Shuffle order
        </button>
        <button className="danger" onClick={onReset} disabled={disabled}>
          Reset game
        </button>
        <button className="secondary" onClick={onEnd} disabled={disabled}>
          End game
        </button>
      </div>
    </div>
  );
}
