import { useEffect } from 'react';

export const EXPERIENCE_CONFIG = {
  unwrap: {
    title: 'Unwrapping the surprise',
    message: 'Glorious crinkle and jingles are warming up your present.',
    gif: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    audio: 'https://cdn.pixabay.com/download/audio/2022/02/20/audio_0119be4c93.mp3?filename=gift-unwrapping-6377.mp3',
    volume: 0.5,
    durationMs: 2500,
  },
  steal: {
    title: 'Steal sneakiness detected',
    message: 'A playful jingle and glinting confetti build the moment.',
    gif: 'https://media.giphy.com/media/2A75RyXVzzSI2bx4Gj/giphy.gif',
    audio: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_0b97974d4d.mp3?filename=magical-chime-104095.mp3',
    volume: 0.35,
    durationMs: 2200,
  },
  shuffle: {
    title: 'Shuffling the stack',
    message: 'Decks flip and bright notes keep the suspense alive.',
    gif: 'https://media.giphy.com/media/3o7TKx96Pq4qd7IpTq/giphy.gif',
    audio: 'https://cdn.pixabay.com/download/audio/2022/03/22/audio_73ddfe5d8b.mp3?filename=techno-sparks-116499.mp3',
    volume: 0.4,
    durationMs: 2000,
  },
  swap: {
    title: 'Final swap in motion',
    message: 'Warm percussion and twinkling bells usher the trade.',
    gif: 'https://media.giphy.com/media/3ohhwMDyS6rv3sBIfK/giphy.gif',
    audio: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_a44dba8ae1.mp3?filename=magical-trumpet-113202.mp3',
    volume: 0.4,
    durationMs: 2200,
  },
  reset: {
    title: 'Resetting the table',
    message: 'A dramatic pause with sparkling sounds to clear the slate.',
    gif: 'https://media.giphy.com/media/3o85xIO33l7RlmLR4I/giphy.gif',
    audio: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_2b8f9babd1.mp3?filename=mystical-bells-113200.mp3',
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
