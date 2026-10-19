import { useSyncExternalStore } from 'react';

/**
 * True once the visitor has scrolled, pointed, touched or pressed a key, and for the rest of the
 * visit. Heavy decorative media below the hero waits for it: every visitor scrolls before reaching
 * it, while crawlers, which render the page in one very tall window without ever interacting, skip
 * it and spend their rendering budget on the content.
 */
const EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'] as const;

let engaged = false;
const listeners = new Set<() => void>();

function onInput(event: Event) {
  // Restoring the scroll position on reload or back also counts: the visitor is already part-way down.
  if (event.type === 'scroll' && window.scrollY <= 0) return;
  engaged = true;
  for (const type of EVENTS) window.removeEventListener(type, onInput, true);
  for (const notify of [...listeners]) notify();
}

if (typeof window !== 'undefined') {
  for (const type of EVENTS) window.addEventListener(type, onInput, { capture: true, passive: true });
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}

export function useUserEngaged() {
  return useSyncExternalStore(
    subscribe,
    () => engaged,
    () => false,
  );
}
