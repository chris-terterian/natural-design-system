import { useEffect, useId, useState, type CSSProperties, type InputHTMLAttributes } from 'react';
import './Slider.css';

export type SliderField = 'none' | 'start' | 'end' | 'top' | 'bottom';
export type SliderThumbForcedState = 'hover' | 'pressed' | 'focus';
export type SliderInputForcedState = 'hover' | 'focus';

export interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step' | 'children'> {
  /** Figma: Label. Always required; `hideLabel` keeps it for screen readers (Figma: Show label = false). */
  label: string;
  hideLabel?: boolean;
  /** Figma: Field = None (default), Start, End, Top, Bottom: where the number field sits. */
  field?: SliderField;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Spoken value (aria-valuetext), e.g. (v) => `$${v}`. */
  formatValue?: (value: number) => string;
  /** Docs only: Figma Slider Thumb State. */
  forceState?: SliderThumbForcedState;
  /** Docs only: Figma Slider Input State. */
  fieldForceState?: SliderInputForcedState;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Figma: Slider (with Slider Thumb and Slider Input). A native range input, so arrows, Page Up / Down
 * and Home / End work and screen readers announce the value. The optional number field stays in sync:
 * typing commits on blur or Enter (clamped and rounded to the step).
 */
export function Slider({
  label, hideLabel, field = 'none', min = 0, max = 100, step = 1, value, defaultValue, onChange, formatValue,
  forceState, fieldForceState, disabled, className, id: idProp, ...rest
}: SliderProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [inner, setInner] = useState(defaultValue ?? min);
  const current = value ?? inner;
  const [text, setText] = useState(String(current));
  useEffect(() => setText(String(current)), [current]);

  const set = (v: number) => {
    const next = clamp(Math.round((v - min) / step) * step + min, min, max);
    if (value === undefined) setInner(next);
    onChange?.(next);
    setText(String(next));
  };
  const commitText = () => {
    const n = Number(text);
    if (text.trim() === '' || Number.isNaN(n)) setText(String(current));
    else set(n);
  };
  const pct = max > min ? ((current - min) / (max - min)) * 100 : 0;

  const range = (
    <input
      id={id}
      type="range"
      className="nds-slider__range"
      min={min}
      max={max}
      step={step}
      value={current}
      disabled={disabled}
      aria-valuetext={formatValue?.(current)}
      style={{ '--_pct': `${pct}%` } as CSSProperties}
      onChange={(e) => set(Number(e.target.value))}
      {...rest}
    />
  );
  const input = field !== 'none' && (
    <input
      type="number"
      inputMode="decimal"
      className="nds-slider__field"
      data-state={fieldForceState}
      aria-label={`${label}, exact value`}
      min={min}
      max={max}
      step={step}
      value={text}
      disabled={disabled}
      onChange={(e) => setText(e.target.value)}
      onBlur={commitText}
      onKeyDown={(e) => { if (e.key === 'Enter') commitText(); }}
    />
  );
  const fieldFirst = field === 'start' || field === 'top';

  return (
    <div
      className={['nds-slider', className].filter(Boolean).join(' ')}
      data-field={field}
      data-state={forceState}
      data-disabled={disabled || undefined}
    >
      <label htmlFor={id} className={hideLabel ? 'nds-visually-hidden' : 'nds-slider__label'}>{label}</label>
      <div className="nds-slider__control">
        {fieldFirst && input}
        {range}
        {!fieldFirst && input}
      </div>
    </div>
  );
}
