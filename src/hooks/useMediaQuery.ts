import { useCallback, useSyncExternalStore } from 'react';
import { media } from '../config/motion';

export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (notify: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', notify);
      return () => mql.removeEventListener('change', notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useReducedMotion = () => useMediaQuery(media.reducedMotion);
export const useIsMobile = () => useMediaQuery(media.mobile);
export const useIsDesktop = () => useMediaQuery(media.desktop);
export const useIsSplit = () => useMediaQuery(media.split);
