import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False while React adopts the pre-rendered HTML and during the build-time render, true afterwards
 * (and at once on in-app navigation). Gate anything the build can't know, such as the query string,
 * behind it so the first browser render matches the pre-rendered markup.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
