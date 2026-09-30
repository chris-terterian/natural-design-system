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

/* ---------- Range Slider ---------- */

export type RangeSliderField = 'none' | 'sides' | 'top' | 'bottom';

export interface RangeSliderProps {
  /** Figma: Label. Names the group; each thumb adds ", minimum" / ", maximum". */
  label: string;
  hideLabel?: boolean;
  /** Figma: Field = None (default), Sides (min at the start, max at the end), Top, Bottom. */
  field?: RangeSliderField;
  min?: number;
  max?: number;
  step?: number;
  value?: [number, number];
  defaultValue?: [number, number];
  onChange?: (value: [number, number]) => void;
  /** Spoken value for each thumb (aria-valuetext), e.g. (v) => `$${v}`. */
  formatValue?: (value: number) => string;
  /** Smallest distance between the thumbs. Defaults to one step, so they never cross. */
  minGap?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Figma: Range Slider. Two native range inputs share one track (only their thumbs take pointer
 * events), so each thumb keeps browser keyboard and screen-reader support. Optional min / max fields.
 */
export function RangeSlider({
  label, hideLabel, field = 'none', min = 0, max = 100, step = 1, value, defaultValue, onChange, formatValue,
  minGap, disabled, className,
}: RangeSliderProps) {
  const labelId = useId();
  const gap = minGap ?? step;
  const [inner, setInner] = useState<[number, number]>(defaultValue ?? [min, max]);
  const [lo, hi] = value ?? inner;
  const [texts, setTexts] = useState<[string, string]>([String(lo), String(hi)]);
  useEffect(() => setTexts([String(lo), String(hi)]), [lo, hi]);

  const snap = (v: number) => clamp(Math.round((v - min) / step) * step + min, min, max);
  const commit = (next: [number, number]) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
    setTexts([String(next[0]), String(next[1])]);
  };
  const setLo = (v: number) => commit([Math.min(snap(v), hi - gap), hi]);
  const setHi = (v: number) => commit([lo, Math.max(snap(v), lo + gap)]);
  const commitText = (i: 0 | 1) => {
    const n = Number(texts[i]);
    if (texts[i].trim() === '' || Number.isNaN(n)) setTexts([String(lo), String(hi)]);
    else (i === 0 ? setLo : setHi)(n);
  };
  const pct = (v: number) => (max > min ? ((v - min) / (max - min)) * 100 : 0);

  const numberField = (i: 0 | 1) => (
    <input
      type="number"
      inputMode="decimal"
      className="nds-slider__field"
      aria-label={`${label}, ${i === 0 ? 'minimum' : 'maximum'}, exact value`}
      min={min}
      max={max}
      step={step}
      value={texts[i]}
      disabled={disabled}
      onChange={(e) => setTexts((t) => (i === 0 ? [e.target.value, t[1]] : [t[0], e.target.value]))}
      onBlur={() => commitText(i)}
      onKeyDown={(e) => { if (e.key === 'Enter') commitText(i); }}
    />
  );
  const fieldsRow = (
    <div className="nds-slider__fields">
      {numberField(0)}
      <span className="nds-slider__separator" aria-hidden="true">to</span>
      {numberField(1)}
    </div>
  );
  const thumb = (i: 0 | 1) => (
    <input
      type="range"
      className="nds-slider__range"
      aria-label={`${label}, ${i === 0 ? 'minimum' : 'maximum'}`}
      aria-valuetext={formatValue?.(i === 0 ? lo : hi)}
      min={min}
      max={max}
      step={step}
      value={i === 0 ? lo : hi}
      disabled={disabled}
      // Where the thumbs overlap, the maximum is on top (it's the one that can still move right),
      // unless it's already at the maximum; then only the minimum can move, so it goes on top.
      style={i === 0 && hi >= max ? { zIndex: 2 } : undefined}
      onChange={(e) => (i === 0 ? setLo : setHi)(Number(e.target.value))}
    />
  );

  return (
    <div
      className={['nds-slider', 'nds-slider--range', className].filter(Boolean).join(' ')}
      role="group"
      aria-labelledby={labelId}
      data-field={field}
      data-disabled={disabled || undefined}
    >
      <span id={labelId} className={hideLabel ? 'nds-visually-hidden' : 'nds-slider__label'}>{label}</span>
      <div className="nds-slider__control">
        {field === 'sides' && numberField(0)}
        {field === 'top' && fieldsRow}
        <div className="nds-slider__dual" style={{ '--_a': `${pct(lo)}%`, '--_b': `${pct(hi)}%` } as CSSProperties}>
          {thumb(0)}
          {thumb(1)}
        </div>
        {field === 'sides' && numberField(1)}
        {field === 'bottom' && fieldsRow}
      </div>
    </div>
  );
}
