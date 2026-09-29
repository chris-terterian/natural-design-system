import type { AnchorHTMLAttributes } from 'react';
import './Logo.css';

export type LogoForcedState = 'focus';

export interface LogoProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Figma: State=Focus (documentation only; real focus uses :focus-visible). */
  forceState?: LogoForcedState;
}

/** Figma: Logo. The Natural wordmark, linking home. */
export function Logo({ href = '/', forceState, className, ...rest }: LogoProps) {
  return (
    <a
      href={href}
      className={['nds-logo', className].filter(Boolean).join(' ')}
      aria-label="Natural — home"
      data-state={forceState}
      {...rest}
    >
      <span className="nds-logo__wordmark">natural</span>
    </a>
  );
}
