import type { HTMLAttributes, ReactNode } from 'react';
import './Badge.css';

export type BadgeTone = 'dark' | 'light' | 'sale' | 'success' | 'outline';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Figma: Tone */
  tone?: BadgeTone;
  /** Figma: Label */
  children: ReactNode;
}

/** Figma: Badge. Status text is always visible, so tone is never the only signal. */
export function Badge({ tone = 'dark', className, children, ...rest }: BadgeProps) {
  return (
    <span className={['nds-badge', `nds-badge--${tone}`, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </span>
  );
}
