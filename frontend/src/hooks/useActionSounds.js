import { useCallback, useRef } from 'react';

function playTone(context, { frequency, duration, type = 'sine', gain = 0.08, slideTo }) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const startTime = context.currentTime + 0.01;
  const endTime = startTime + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  if (slideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(slideTo, endTime);
  }

  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(gain * 0.08, 0.0001), endTime);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(endTime + 0.02);
}

export function useActionSounds() {
  const contextRef = useRef(null);

  const ensureContext = useCallback(async () => {
    if (typeof window === 'undefined') {
      return null;
    }
    if (!contextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        return null;
      }
      contextRef.current = new AudioContext();
    }
    if (contextRef.current.state === 'suspended') {
      await contextRef.current.resume();
    }
    return contextRef.current;
  }, []);

  const play = useCallback(
    async (name) => {
      const context = await ensureContext();
      if (!context) {
        return;
      }
      const beat = 0.12;
      switch (name) {
        case 'unwrap': {
          playTone(context, { frequency: 420, duration: beat, type: 'triangle', gain: 0.08 });
          playTone(context, { frequency: 560, duration: beat, type: 'triangle', gain: 0.08 });
          playTone(context, { frequency: 720, duration: beat * 1.2, type: 'sine', gain: 0.08 });
          break;
        }
        case 'steal': {
          playTone(context, { frequency: 780, duration: beat * 0.9, type: 'square', gain: 0.07 });
          playTone(context, { frequency: 520, duration: beat * 1.1, type: 'square', gain: 0.07 });
          break;
        }
        case 'swap': {
          playTone(context, { frequency: 360, duration: beat, type: 'sawtooth', gain: 0.06, slideTo: 540 });
          playTone(context, { frequency: 540, duration: beat, type: 'triangle', gain: 0.05, slideTo: 360 });
          break;
        }
        case 'shuffle': {
          playTone(context, { frequency: 320, duration: beat * 0.8, type: 'square', gain: 0.065 });
          playTone(context, { frequency: 390, duration: beat * 0.8, type: 'square', gain: 0.065 });
          playTone(context, { frequency: 470, duration: beat * 0.9, type: 'triangle', gain: 0.06 });
          break;
        }
        default:
          break;
      }
    },
    [ensureContext]
  );

  return { play };
}
