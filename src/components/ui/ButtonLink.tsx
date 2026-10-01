import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

export function Arrow({ className }: { className?: string }) {
  return (
    <svg className={cn('btn-arrow shrink-0', className)} width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
      <path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

interface Props {
  to: string;
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
  arrow?: boolean;
}

export function ButtonLink({ to, variant = 'primary', children, className, arrow = true }: Props) {
  return (
    <Link to={to} className={cn('btn', `btn-${variant}`, className)}>
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}
