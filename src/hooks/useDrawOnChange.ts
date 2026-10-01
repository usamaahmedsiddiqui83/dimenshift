import { useEffect, useState } from 'react';

/** Returns false for one frame whenever `key` changes, then true — used to replay SVG line-draw reveals. */
export function useDrawOnChange(key: string) {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    setDrawn(false);
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setDrawn(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [key]);
  return drawn;
}
