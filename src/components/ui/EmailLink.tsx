import type { MouseEvent, ReactNode } from 'react';

/** Gmail's "compose" screen, pre-addressed. */
const GMAIL_COMPOSE = 'https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=';

interface Props {
  email: string;
  subject?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * An email address that opens Gmail's compose window in a small popup, so visitors can write to us
 * without a mail program set up on their machine.
 *
 * The href stays a normal mail link, so copying the address, opening it in a new tab and keyboard
 * use all behave as usual — and if the popup is blocked, or the visitor holds a modifier key, the
 * browser falls back to its own mail handling.
 */
export function EmailLink({ email, subject, className, children }: Props) {
  const href = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;

  const openGmail = (event: MouseEvent<HTMLAnchorElement>) => {
    // Let the browser handle middle clicks, and ctrl/cmd/shift clicks that ask for a new tab.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const url = `${GMAIL_COMPOSE}${encodeURIComponent(email)}${subject ? `&su=${encodeURIComponent(subject)}` : ''}`;
    const popup = window.open(url, '_blank', 'popup,noreferrer,width=680,height=760');
    if (!popup) return; // Blocked: the mail link in href takes over.

    try {
      popup.opener = null;
    } catch {
      // Cross-origin windows may refuse this; the popup still works.
    }
    popup.focus();
    event.preventDefault();
  };

  return (
    <a href={href} onClick={openGmail} className={className}>
      {children ?? email}
    </a>
  );
}
