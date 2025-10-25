import { useCallback } from 'react';

export function useCelebration() {
  return useCallback((type) => {
    if (type === 'reveal') {
      console.log('?? Gift revealed!');
    } else if (type === 'locked') {
      console.log('?? Gift locked in!');
    }
  }, []);
}
