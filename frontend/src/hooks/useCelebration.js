import { useCallback } from 'react';

let audioContext;

const ensureAudioContext = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }
    audioContext = new AudioContextClass();
  }
  return audioContext;
};

const playNotes = async (notes) => {
  const ctx = ensureAudioContext();
  if (!ctx) {
    return;
  }
  const now = ctx.currentTime + 0.05;
  notes.forEach(({ frequency, duration, type }, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.12);
    gain.gain.setValueAtTime(0.001, now + index * 0.12);
    gain.gain.linearRampToValueAtTime(0.18, now + index * 0.12 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now + index * 0.12);
    oscillator.stop(now + index * 0.12 + duration + 0.05);
  });
};

const spawnParticles = (type) => {
  const container = document.createElement('div');
  container.className = `celebration-layer celebration-${type}`;
  const particles = 80;
  for (let i = 0; i < particles; i += 1) {
    const particle = document.createElement('span');
    particle.className = 'celebration-particle';
    particle.style.setProperty('--x', `${Math.random() * 100}%`);
    particle.style.setProperty('--delay', `${Math.random() * 0.5}s`);
    particle.style.setProperty('--duration', `${1 + Math.random()}s`);
    container.appendChild(particle);
  }
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 1500);
};

export const useCelebration = () => {
  return useCallback((type = 'reveal') => {
    const notes = type === 'locked'
      ? [
          { frequency: 523, duration: 0.3, type: 'sine' },
          { frequency: 659, duration: 0.25, type: 'sine' },
          { frequency: 784, duration: 0.4, type: 'triangle' },
        ]
      : [
          { frequency: 392, duration: 0.22, type: 'sine' },
          { frequency: 494, duration: 0.22, type: 'sine' },
          { frequency: 587, duration: 0.3, type: 'triangle' },
        ];
    playNotes(notes);
    spawnParticles(type);
  }, []);
};
