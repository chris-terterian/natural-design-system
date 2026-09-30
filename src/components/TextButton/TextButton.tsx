import type { ButtonHTMLAttributes } from 'react';
import './TextButton.css';

export type TextButtonForcedState = 'hover' | 'focus';

export interface TextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  forceState?: TextButtonForcedState;
}

/**
 * Figma: Text Button. A real <button> that looks like underlined text, for small secondary actions
 * (Remove, Edit, Save for later). Give it a name with context when the label alone is ambiguous:
 * <TextButton aria-label="Remove Split Log Bench">Remove</TextButton>.
 */
export function TextButton({ forceState, className, type = 'button', children, ...rest }: TextButtonProps) {
  return (
    <button type={type} className={['nds-text-button', className].filter(Boolean).join(' ')} data-state={forceState} {...rest}>
      {children}
    </button>
  );
}
