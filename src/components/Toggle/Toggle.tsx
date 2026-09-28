import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import './Toggle.css';

export type ToggleForcedState = 'hover' | 'pressed' | 'focus';

export interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'role'> {
  /** Figma: Label */
  label: ReactNode;
  /** Figma: Description (Show description) */
  description?: ReactNode;
  /** Figma: Checked. Omit for uncontrolled use (defaultChecked). */
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  forceState?: ToggleForcedState;
}

/**
 * Figma: Toggle. A checkbox input with role="switch", for settings that apply immediately.
 * On is shown by thumb position + sand track, not colour alone.
 */
export function Toggle({ label, description, checked, onChange, forceState, className, id: idProp, ...rest }: ToggleProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const descId = description ? `${id}-desc` : undefined;
  return (
    <label className={['nds-toggle', className].filter(Boolean).join(' ')} data-state={forceState}>
      <input
        type="checkbox"
        role="switch"
        id={id}
        className="nds-toggle__input"
        checked={checked}
        aria-describedby={descId}
        onChange={(e) => onChange?.(e.target.checked)}
        {...rest}
      />
      <span className="nds-toggle__track" aria-hidden="true">
        <span className="nds-toggle__thumb" />
      </span>
      <span className="nds-toggle__text">
        <span className="nds-toggle__label">{label}</span>
        {description && <span id={descId} className="nds-toggle__description">{description}</span>}
      </span>
    </label>
  );
}
