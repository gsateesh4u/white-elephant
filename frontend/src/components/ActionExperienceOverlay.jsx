import { useEffect } from 'react';

export const EXPERIENCE_CONFIG = {
  unwrap: {
    title: 'Unwrapping the surprise',
    message: 'Glorious crinkle and jingles are warming up your present.',
    gif: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    audio: '/api/assets/audio/unwrap.wav',
    volume: 0.5,
    durationMs: 2500,
  },
  steal: {
    title: 'Steal sneakiness detected',
    message: 'A playful jingle and glinting confetti build the moment.',
    gif: 'https://media.giphy.com/media/2A75RyXVzzSI2bx4Gj/giphy.gif',
    audio: '/api/assets/audio/steal.wav',
    volume: 0.35,
    durationMs: 2200,
  },
  shuffle: {
    title: 'Shuffling the stack',
    message: 'Decks flip and bright notes keep the suspense alive.',
    gif: 'https://media.giphy.com/media/3o7TKx96Pq4qd7IpTq/giphy.gif',
    audio: '/api/assets/audio/shuffle.wav',
    volume: 0.4,
    durationMs: 2000,
  },
  swap: {
    title: 'Final swap in motion',
    message: 'Warm percussion and twinkling bells usher the trade.',
    gif: 'https://media.giphy.com/media/3ohhwMDyS6rv3sBIfK/giphy.gif',
    audio: '/api/assets/audio/swap.wav',
    volume: 0.4,
    durationMs: 2200,
  },
  reset: {
    title: 'Resetting the table',
    message: 'A dramatic pause with sparkling sounds to clear the slate.',
    gif: 'https://media.giphy.com/media/3o85xIO33l7RlmLR4I/giphy.gif',
    audio: '/api/assets/audio/reset.wav',
    volume: 0.45,
    durationMs: 2300,
  },
};

export function ActionExperienceOverlay({ type }) {
  const config = type ? EXPERIENCE_CONFIG[type] : null;

  useEffect(() => {
    if (!config?.audio) {
      return undefined;
    }
    const audio = new Audio(config.audio);
    audio.volume = Math.min(1, Math.max(0.25, config.volume ?? 0.4));
    audio.play().catch(() => {});
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [config]);

  if (!config) {
    return null;
  }

  return (
    <div className="experience-overlay" role="status" aria-live="polite">
      <div className="experience-card">
        <img src={config.gif} alt={config.title} />
        <div className="experience-copy">
          <p className="experience-title">{config.title}</p>
          <p className="experience-message">{config.message}</p>
        </div>
      </div>
    </div>
  );
}
