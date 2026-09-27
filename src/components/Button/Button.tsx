import type { ButtonHTMLAttributes, ReactNode } from 'react';
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
  forceState?: ButtonForcedState;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  leftIcon,
  rightIcon,
  forceState,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const classes = [
    'nds-button',
    `nds-button--${variant}`,
    leftIcon && 'nds-button--icon-left',
    rightIcon && 'nds-button--icon-right',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} data-state={forceState} {...rest}>
      {leftIcon && <span className="nds-button__icon">{leftIcon}</span>}
      <span className="nds-button__label">{children}</span>
      {rightIcon && <span className="nds-button__icon">{rightIcon}</span>}
    </button>
  );
}
