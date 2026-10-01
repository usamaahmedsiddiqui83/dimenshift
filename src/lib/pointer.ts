/** Shared normalized pointer position (−1…1), tracked once for all canvases. */
export const pointer = { x: 0, y: 0 };

let installed = false;

export function trackPointer() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true },
  );
}
