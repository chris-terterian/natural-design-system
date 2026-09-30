import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { AlertIcon, CalendarIcon, CheckCircleIcon } from '../../icons';
import { Calendar } from '../Calendar/Calendar';
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

/* ---------- Date Field ---------- */

const pad = (n: number) => String(n).padStart(2, '0');
/** MM/DD/YYYY, the format shown in the field and its placeholder. */
export const formatDate = (d: Date) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;
/** Parses MM/DD/YYYY (1- or 2-digit month and day). Returns null for anything else or an impossible date. */
export const parseDate = (text: string): Date | null => {
  const m = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(text);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
  return d.getMonth() === Number(m[1]) - 1 && d.getDate() === Number(m[2]) ? d : null;
};

export interface DateFieldProps
  extends FieldProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'children' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'type'> {
  value?: Date | null;
  defaultValue?: Date | null;
  /** Called with the date when a day is picked, or when typed text parses on blur / Enter (null when cleared). */
  onChange?: (date: Date | null) => void;
  /** Passed to the Calendar: earliest and latest dates, and days that can't be chosen. */
  min?: Date;
  max?: Date;
  isDateDisabled?: (date: Date) => boolean;
  today?: Date;
  locale?: string;
  /** Start with the calendar open (docs and tests). */
  defaultOpen?: boolean;
}

/**
 * Figma: Input / Type=Date. A text field for MM/DD/YYYY plus a calendar button that opens the
 * Calendar (Mode=Single) in a popover below. ARIA date picker dialog pattern: focus moves into the
 * calendar; picking a day fills the field, closes it and returns focus to the button; Escape closes.
 */
export function DateField({
  label, hideLabel, helperText, status = 'default', statusMessage, forceState, className, id: idProp,
  value, defaultValue, onChange, min, max, isDateDisabled, today, locale = 'en-US', defaultOpen = false,
  placeholder = 'MM/DD/YYYY', disabled, readOnly, onBlur, onKeyDown, ...rest
}: DateFieldProps) {
  const f = useField({ label, hideLabel, helperText, status, statusMessage }, idProp);
  const [inner, setInner] = useState<Date | null>(defaultValue ?? null);
  const date = value !== undefined ? value : inner;
  const [text, setText] = useState(date ? formatDate(date) : '');
  const [open, setOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverId = `${f.id}-calendar`;

  // Show the new date when it changes from outside (a pick in the calendar, or a controlled value).
  const time = date ? date.getTime() : null;
  useEffect(() => setText(time === null ? '' : formatDate(new Date(time))), [time]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const commit = (d: Date | null) => {
    if (value === undefined) setInner(d);
    onChange?.(d);
  };
  const commitText = () => {
    if (!text.trim()) return commit(null);
    const d = parseDate(text);
    if (d) commit(d);
  };
  const close = () => { setOpen(false); buttonRef.current?.focus(); };
  const long = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div ref={rootRef} className={['nds-field', 'nds-field--date', className].filter(Boolean).join(' ')} data-status={status} data-state={forceState}>
      {f.labelEl}
      <div className="nds-field__anchor">
        <div className="nds-field__control">
          <input
            id={f.id}
            className="nds-field__input"
            inputMode="numeric"
            autoComplete="off"
            placeholder={placeholder}
            value={text}
            disabled={disabled}
            readOnly={readOnly}
            aria-invalid={status === 'error' || undefined}
            aria-describedby={f.describedBy}
            onChange={(e) => setText(e.target.value)}
            onBlur={(e) => { commitText(); onBlur?.(e); }}
            onKeyDown={(e) => { if (e.key === 'Enter') commitText(); onKeyDown?.(e); }}
            {...rest}
          />
          <StatusIcon status={status} />
          {!readOnly && (
            <button
              ref={buttonRef}
              type="button"
              className="nds-field__icon-button"
              aria-label={date ? `Choose date, ${long.format(date)}` : 'Choose date'}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls={open ? popoverId : undefined}
              disabled={disabled}
              onClick={() => setOpen((o) => !o)}
            >
              <CalendarIcon />
            </button>
          )}
        </div>
        {open && (
          <div
            id={popoverId}
            className="nds-field__popover"
            role="dialog"
            aria-label={`${label}, choose a date`}
            onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } }}
          >
            <Calendar
              label={label}
              mode="single"
              selected={date}
              onSelect={(d) => { commit(d); close(); }}
              min={min}
              max={max}
              isDateDisabled={isDateDisabled}
              today={today}
              locale={locale}
              autoFocus={!defaultOpen}
            />
          </div>
        )}
      </div>
      <Message id={f.messageId} status={status}>{f.message}</Message>
    </div>
  );
}
