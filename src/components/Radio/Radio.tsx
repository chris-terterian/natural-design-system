import { createContext, useContext, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { AlertIcon } from '../../icons';
import './Radio.css';

export type RadioForcedState = 'hover' | 'pressed' | 'focus';

interface GroupContext {
  name: string;
  value?: string;
  invalid: boolean;
  onChange?: (value: string) => void;
}
const RadioGroupContext = createContext<GroupContext | null>(null);

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Figma: Label */
  label: ReactNode;
  /** Figma: Description (Show description) */
  description?: ReactNode;
  /** Figma: State=Error. Usually inherited from RadioGroup. */
  invalid?: boolean;
  forceState?: RadioForcedState;
}

/** Figma: Radio */
export function Radio({ label, description, invalid, forceState, className, id: idProp, value, ...rest }: RadioProps) {
  const group = useContext(RadioGroupContext);
  const autoId = useId();
  const id = idProp ?? autoId;
  const descId = description ? `${id}-desc` : undefined;
  const isInvalid = invalid ?? group?.invalid ?? false;
  const groupProps = group
    ? {
        name: group.name,
        checked: group.value === undefined ? undefined : group.value === value,
        onChange: () => group.onChange?.(String(value)),
      }
    : {};

  return (
    <label className={['nds-radio', className].filter(Boolean).join(' ')} data-state={forceState} data-invalid={isInvalid || undefined}>
      <input type="radio" id={id} className="nds-radio__input" value={value} aria-describedby={descId} {...groupProps} {...rest} />
      <span className="nds-radio__control" aria-hidden="true"><span className="nds-radio__dot" /></span>
      <span className="nds-radio__text">
        <span className="nds-radio__label">{label}</span>
        {description && <span id={descId} className="nds-radio__description">{description}</span>}
      </span>
    </label>
  );
}

export interface RadioGroupProps {
  /** Rendered as the fieldset legend. */
  legend: ReactNode;
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  /** Shows the group error (icon + message) and marks every option invalid. */
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function RadioGroup({ legend, name, value, onChange, error, children, className }: RadioGroupProps) {
  const autoName = useId();
  const errorId = `${autoName}-error`;
  return (
    <fieldset
      className={['nds-radio-group', className].filter(Boolean).join(' ')}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="nds-radio-group__legend">{legend}</legend>
      <RadioGroupContext.Provider value={{ name: name ?? autoName, value, onChange, invalid: Boolean(error) }}>
        {children}
      </RadioGroupContext.Provider>
      {error && (
        <p id={errorId} className="nds-radio-group__error">
          <AlertIcon />
          {error}
        </p>
      )}
    </fieldset>
  );
}
