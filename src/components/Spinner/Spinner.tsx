import type { SVGProps } from 'react';
import './Spinner.css';

/** Figma: Spinner. Decorative; pair it with aria-busy or visible text on the owning control. */
export function Spinner({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={['nds-spinner', className].filter(Boolean).join(' ')}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <circle className="nds-spinner__track" cx="10" cy="10" r="8" strokeWidth="2" />
      <path className="nds-spinner__arc" d="M10 2a8 8 0 0 1 8 8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
