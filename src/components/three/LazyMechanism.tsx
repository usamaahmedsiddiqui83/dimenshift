import { lazy, Suspense, useRef, useState, type ReactNode, type RefObject } from 'react';
import { media, motion } from '../../config/motion';
import { useInView } from '../../hooks/useInView';
import { useIsMobile, useMediaQuery, useReducedMotion } from '../../hooks/useMediaQuery';
import { cn } from '../../lib/cn';
import type { DragState } from './Mechanism';
import { ThreeErrorBoundary } from './ThreeErrorBoundary';
import type { MixedState } from './visualState';
import { hasWebGL } from './webgl';

// The entire three.js stack lives behind this dynamic import.
const MechanismCanvas = lazy(() => import('./MechanismCanvas'));

interface Props {
  getState: () => MixedState;
  /** Static drawing shown while loading, and permanently if WebGL is unavailable or fails. */
  poster: ReactNode;
  /** Accessible description of what the visual shows. */
  label: string;
  className?: string;
  drag?: RefObject<DragState>;
  /** Surface behind the canvas; light surfaces get darker annotation colors. */
  tone?: 'dark' | 'light';
  children?: ReactNode;
}

export function LazyMechanism({ getState, poster, label, className, drag, tone = 'dark', children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { rootMargin: motion.canvasPreloadMargin, once: true });
  const visible = useInView(ref, { rootMargin: '10% 0px' });
  const reducedMotion = useReducedMotion();
  const mobile = useIsMobile();
  const finePointer = useMediaQuery(media.finePointer);
  const [webgl] = useState(hasWebGL);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const mount = webgl && !failed && near;

  return (
    // Callers own positioning; default to `relative` only when none is given.
    <div ref={ref} role="img" aria-label={label} className={className ?? 'relative'}>
      <div
        aria-hidden="true"
        className={cn('absolute inset-0 transition-opacity duration-700', ready ? 'opacity-0' : 'opacity-100')}
      >
        {poster}
      </div>
      {mount && (
        <ThreeErrorBoundary onError={() => setFailed(true)}>
          <Suspense fallback={null}>
            <div
              aria-hidden="true"
              className={cn('absolute inset-0 transition-opacity duration-700', ready ? 'opacity-100' : 'opacity-0')}
            >
              <MechanismCanvas
                active={visible}
                getState={getState}
                detail={mobile ? 'low' : 'high'}
                reducedMotion={reducedMotion}
                parallax={finePointer && !drag}
                drag={drag}
                tone={tone}
                onReady={() => setReady(true)}
              />
            </div>
          </Suspense>
        </ThreeErrorBoundary>
      )}
      {children}
    </div>
  );
}
