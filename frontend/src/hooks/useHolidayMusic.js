import { useCallback, useRef } from 'react';

export function useHolidayMusic() {
  const contextRef = useRef(null);

  const ensureContext = useCallback(async () => {
    if (typeof window === 'undefined') {
      return null;
    }
    if (!contextRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        return null;
      }
      contextRef.current = new AudioCtx();
    }
    if (contextRef.current.state === 'suspended') {
      await contextRef.current.resume();
    }
    return contextRef.current;
  }, []);

  const play = useCallback(async () => {
    const context = await ensureContext();
    if (!context) {
      return;
    }
    const notes = [
      { freq: 523.25, dur: 0.3 }, // C5
      { freq: 659.25, dur: 0.3 }, // E5
      { freq: 783.99, dur: 0.35 }, // G5
      { freq: 659.25, dur: 0.25 },
      { freq: 880, dur: 0.35 }, // A5
      { freq: 987.77, dur: 0.4 }, // B5
      { freq: 880, dur: 0.35 },
      { freq: 783.99, dur: 0.35 },
      { freq: 659.25, dur: 0.35 },
    ];

    const startAt = context.currentTime + 0.05;
    let cursor = startAt;
    notes.forEach(({ freq, dur }, index) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, cursor);
      gain.gain.setValueAtTime(0.08, cursor);
      gain.gain.exponentialRampToValueAtTime(0.0001, cursor + dur * 0.95);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(cursor);
      osc.stop(cursor + dur + 0.05);

      // add gentle bell overtone
      const overtone = context.createOscillator();
      const overtoneGain = context.createGain();
      overtone.type = 'triangle';
      overtone.frequency.setValueAtTime(freq * 2, cursor);
      overtoneGain.gain.setValueAtTime(0.025, cursor);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, cursor + dur);
      overtone.connect(overtoneGain);
      overtoneGain.connect(context.destination);
      overtone.start(cursor);
      overtone.stop(cursor + dur + 0.05);

      cursor += dur + 0.02 + (index % 3 === 2 ? 0.06 : 0);
    });
  }, [ensureContext]);

  return { play };
}
