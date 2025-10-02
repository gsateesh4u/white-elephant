const OVERLAY_CONFIG = {
  shuffle: {
    title: 'Shuffling the lineup...',
    message: 'Mixing the turn order to keep things spicy!',
    emoji: '🔀',
    gif: 'https://media.giphy.com/media/l0MYNQ63r0PpY0RFq/giphy.gif',
  },
  unwrap: {
    title: 'Unwrapping the surprise...',
    message: 'Hold tight while the paper flies everywhere!',
    emoji: '🎀',
    gif: 'https://media.giphy.com/media/l4FGzF6zT9s3c4k1e/giphy.gif',
  },
  steal: {
    title: 'Sneaky steal in progress...',
    message: 'Somebody spotted a better present!',
    emoji: '🕵️',
    gif: 'https://media.giphy.com/media/3o7abBP0nMjrdzVR4I/giphy.gif',
  },
  swap: {
    title: 'Swap showdown...',
    message: 'Negotiating the perfect holiday trade.',
    emoji: '🤝',
    gif: 'https://media.giphy.com/media/3ohhwMDyS6rv3sBIfK/giphy.gif',
  },
};

export function ActionOverlay({ type }) {
  if (!type || !OVERLAY_CONFIG[type]) {
    return null;
  }

  const { title, message, emoji, gif } = OVERLAY_CONFIG[type];

  return (
    <div className="action-overlay" role="status" aria-live="assertive">
      <div className="action-card">
        <img src={gif} alt={title} />
        <div className="action-text">
          <span className="emoji" aria-hidden="true">{emoji}</span>
          <p className="action-title">{title}</p>
          <p className="action-message">{message}</p>
        </div>
      </div>
    </div>
  );
}
