import { useEffect } from 'react';

export function HolidayPopup({ onClose, onPlayMusic }) {
  useEffect(() => {
    onPlayMusic?.();
  }, [onPlayMusic]);

  return (
    <div className="holiday-overlay" role="dialog" aria-modal="true" aria-label="Happy Holidays">
      <div className="holiday-card">
        <div className="holiday-santa" aria-hidden="true">
          <div className="santa-face">🎅</div>
          <div className="santa-shadow" />
        </div>
        <div className="holiday-text">
          <p className="holiday-subtitle">Game complete!</p>
          <h2>Happy Holidays 🎁</h2>
          <p>All gifts are locked in for both countries. Thanks for playing and sharing the cheer!</p>
        </div>
        <button type="button" className="primary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
