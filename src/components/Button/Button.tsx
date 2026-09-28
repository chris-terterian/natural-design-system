import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Spinner } from '../Spinner/Spinner';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary';
/** Forces a visual state for documentation only; real interaction uses CSS pseudo-classes. */
export type ButtonForcedState = 'hover' | 'pressed' | 'focus';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Figma: Style */
  variant?: ButtonVariant;
  /** Figma: Left icon (Icon = Left | Both) */
  leftIcon?: ReactNode;
  /** Figma: Right icon (Icon = Right | Both) */
  rightIcon?: ReactNode;
  /** Figma: State=Loading. Shows a spinner, keeps the width, sets aria-busy and ignores clicks. */
  loading?: boolean;
  /** Stretches to the container width (Figma: set the instance to Fill container). */
  fullWidth?: boolean;
  forceState?: ButtonForcedState;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  leftIcon,
  rightIcon,
  loading = false,
  fullWidth = false,
  forceState,
  className,
  children,
  type = 'button',
  onClick,
  ...rest
}: ButtonProps) {
  const classes = [
    'nds-button',
    `nds-button--${variant}`,
    leftIcon && 'nds-button--icon-left',
    rightIcon && 'nds-button--icon-right',
    loading && 'nds-button--loading',
    fullWidth && 'nds-button--full-width',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      data-state={forceState}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? (e) => e.preventDefault() : onClick}
      {...rest}
    >
      {leftIcon && <span className="nds-button__icon">{leftIcon}</span>}
      <span className="nds-button__label">{children}</span>
      {rightIcon && <span className="nds-button__icon">{rightIcon}</span>}
      {loading && <Spinner className="nds-button__spinner" />}
    </button>
  );
}
