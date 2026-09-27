import { useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { AlertIcon, CheckCircleIcon } from '../../icons';
import './Input.css';

export type InputStatus = 'default' | 'error' | 'success';
export type InputForcedState = 'hover' | 'focus';

interface FieldProps {
  /** Figma: Label */
  label: string;
  /** Figma: Show label = false. Keeps the label for screen readers. */
  hideLabel?: boolean;
  /** Figma: Helper text (Show helper) */
  helperText?: ReactNode;
  /** Error and Success replace the helper text with an icon + message. */
  status?: InputStatus;
  statusMessage?: ReactNode;
  forceState?: InputForcedState;
}

function useField({ label, hideLabel, helperText, status = 'default', statusMessage }: FieldProps, idProp?: string) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const messageId = `${id}-message`;
  const message = status !== 'default' && statusMessage ? statusMessage : helperText;
  return {
    id,
    describedBy: message ? messageId : undefined,
    labelEl: (
      <label htmlFor={id} className={hideLabel ? 'nds-visually-hidden' : 'nds-field__label'}>
        {label}
      </label>
    ),
    message,
    messageId,
  };
}

function Message({ id, status, children, trailing }: { id: string; status: InputStatus; children?: ReactNode; trailing?: ReactNode }) {
  if (!children && !trailing) return null;
  return (
    <div className="nds-field__helper">
      {status === 'error' && <AlertIcon />}
      {status === 'success' && <CheckCircleIcon />}
      <span id={id} className="nds-field__helper-text">{children}</span>
      {trailing}
    </div>
  );
}

const StatusIcon = ({ status }: { status: InputStatus }) =>
  status === 'error' ? <AlertIcon className="nds-field__status-icon" /> : status === 'success' ? <CheckCircleIcon className="nds-field__status-icon" /> : null;

export interface TextFieldProps extends FieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> {}

/** Figma: Input / Type=Text */
export function TextField({ label, hideLabel, helperText, status = 'default', statusMessage, forceState, className, id: idProp, ...rest }: TextFieldProps) {
  const f = useField({ label, hideLabel, helperText, status, statusMessage }, idProp);
  return (
    <div className={['nds-field', className].filter(Boolean).join(' ')} data-status={status} data-state={forceState}>
      {f.labelEl}
      <div className="nds-field__control">
        <input id={f.id} className="nds-field__input" aria-invalid={status === 'error' || undefined} aria-describedby={f.describedBy} {...rest} />
        <StatusIcon status={status} />
      </div>
      <Message id={f.messageId} status={status}>{f.message}</Message>
    </div>
  );
}

export interface TextAreaProps extends FieldProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'> {
  /** Shows a live "n/max" counter when set. */
  maxLength?: number;
}

/** Figma: Input / Type=Textarea */
export function TextArea({ label, hideLabel, helperText, status = 'default', statusMessage, forceState, className, id: idProp, maxLength, value, defaultValue, onChange, ...rest }: TextAreaProps) {
  const f = useField({ label, hideLabel, helperText, status, statusMessage }, idProp);
  const [inner, setInner] = useState(String(defaultValue ?? ''));
  const length = String(value ?? inner).length;
  return (
    <div className={['nds-field', 'nds-field--textarea', className].filter(Boolean).join(' ')} data-status={status} data-state={forceState}>
      {f.labelEl}
      <div className="nds-field__control">
        <textarea
          id={f.id}
          className="nds-field__input"
          aria-invalid={status === 'error' || undefined}
          aria-describedby={f.describedBy}
          maxLength={maxLength}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          onChange={(e) => {
            setInner(e.target.value);
            onChange?.(e);
          }}
          {...rest}
        />
        <StatusIcon status={status} />
      </div>
      <Message
        id={f.messageId}
        status={status}
        trailing={maxLength ? <span className="nds-field__counter" aria-live="polite">{`${length}/${maxLength}`}</span> : undefined}
      >
        {f.message}
      </Message>
    </div>
  );
}
