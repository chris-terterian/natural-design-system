import { forwardRef, useEffect, useId, useMemo, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent } from 'react';
import { IconButton } from '../Navigation/Navigation';
import { ChevronLeftIcon, ChevronRightIcon } from '../../icons';
import './Calendar.css';

/* ---------- Date helpers (local time, no library) ---------- */

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Same day of the month in another month, clamped (31 Jan + 1 month = 28/29 Feb). */
const addMonths = (d: Date, n: number) => {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
};
const sameDay = (a?: Date | null, b?: Date | null) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const sameMonth = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
const toKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/* ---------- Calendar Day ---------- */

export type CalendarDayForcedState = 'hover' | 'pressed' | 'focus';
export type CalendarDayRange = 'start' | 'middle' | 'end';

export interface CalendarDayProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Figma: Day. The number shown. */
  day: number | string;
  /** Figma: State=Selected (also the ends of a range). */
  selected?: boolean;
  /** Figma: State=Range start / Range middle / Range end. */
  range?: CalendarDayRange;
  /** Figma: State=Outside. A day from the previous or next month. */
  outside?: boolean;
  /** Figma: State=Disabled. Still focusable (aria-disabled) so arrow keys can move past it. */
  disabled?: boolean;
  /** Figma: Today. Shows the dot and sets aria-current="date". */
  today?: boolean;
  forceState?: CalendarDayForcedState;
}

/** Figma: Calendar Day. One day in the Calendar grid: a 40px circle target. */
export const CalendarDay = forwardRef<HTMLButtonElement, CalendarDayProps>(function CalendarDay(
  { day, selected, range, outside, disabled, today, forceState, className, onClick, ...rest },
  ref,
) {
  const filled = selected || range === 'start' || range === 'end';
  return (
    <button
      ref={ref}
      type="button"
      className={['nds-calendar-day', className].filter(Boolean).join(' ')}
      data-state={forceState}
      data-selected={filled || undefined}
      data-range={range}
      data-outside={outside || undefined}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
      aria-current={today ? 'date' : undefined}
      onClick={disabled ? undefined : onClick}
      {...rest}
    >
      {range && <span className="nds-calendar-day__band" aria-hidden="true" />}
      <span className="nds-calendar-day__circle" aria-hidden="true" />
      <span className="nds-calendar-day__number">{day}</span>
      {today && <span className="nds-calendar-day__dot" aria-hidden="true" />}
    </button>
  );
});

/* ---------- Calendar ---------- */

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface CalendarBaseProps {
  /** Accessible name for the whole calendar, e.g. "Delivery date". */
  label: string;
  /** The month shown (controlled). Any date in that month. */
  month?: Date;
  /** The month shown first when uncontrolled. Defaults to the selection, then today. */
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  /** Earliest selectable date. */
  min?: Date;
  /** Latest selectable date. */
  max?: Date;
  /** Extra rule for unavailable days (e.g. no Sunday deliveries). */
  isDateDisabled?: (date: Date) => boolean;
  /** Defaults to the current date; pass one for stable stories and tests. */
  today?: Date;
  /** 1 = Monday (default, matches Figma), 0 = Sunday. */
  weekStartsOn?: 0 | 1;
  /** BCP 47 locale for month and day names. */
  locale?: string;
  /** Move focus to the selected (or today's) day on mount, e.g. when opened from a Date Field. */
  autoFocus?: boolean;
  className?: string;
}

export interface CalendarSingleProps extends CalendarBaseProps {
  /** Figma: Mode=Single (default). */
  mode?: 'single';
  selected?: Date | null;
  defaultSelected?: Date | null;
  onSelect?: (date: Date) => void;
}

export interface CalendarRangeProps extends CalendarBaseProps {
  /** Figma: Mode=Range. First click sets the start, second sets the end (in either order). */
  mode: 'range';
  selected?: DateRange;
  defaultSelected?: DateRange;
  onSelect?: (range: DateRange) => void;
}

export type CalendarProps = CalendarSingleProps | CalendarRangeProps;

/**
 * Figma: Calendar. A month grid for picking a date (Mode=Single) or a date range (Mode=Range).
 * ARIA grid pattern: one tab stop, arrow keys move by day and week, Home / End to the week's
 * ends, Page Up / Page Down by month (with Shift, by year), Enter or Space selects.
 * Always 6 weeks so the height never jumps between months.
 */
export function Calendar(props: CalendarProps) {
  const { label, min, max, isDateDisabled, weekStartsOn = 1, locale = 'en-US', className, onMonthChange } = props;
  const today = startOfDay(props.today ?? new Date());
  const isRange = props.mode === 'range';

  const [innerSingle, setInnerSingle] = useState<Date | null>(!isRange ? props.defaultSelected ?? null : null);
  const [innerRange, setInnerRange] = useState<DateRange>(isRange ? props.defaultSelected ?? { start: null, end: null } : { start: null, end: null });
  const single = !isRange ? (props.selected !== undefined ? props.selected : innerSingle) : null;
  const range = isRange ? props.selected ?? innerRange : { start: null, end: null };
  const anchor = (isRange ? range.start : single) ?? null;

  const isDisabled = (d: Date) => (min && d < startOfDay(min)) || (max && d > startOfDay(max)) || !!isDateDisabled?.(d);
  /** Where focus lands in a month: the selection, else today, else the 1st; moved forward to the first day that can be chosen. */
  const entryDay = (m: Date) => {
    const start = anchor && sameMonth(anchor, m) ? anchor : sameMonth(today, m) ? today : m;
    for (let d = start; sameMonth(d, m); d = addDays(d, 1)) if (!isDisabled(d)) return d;
    return start;
  };

  // With nothing selected, open on today's month, or the earliest allowed month if that's later.
  const [innerMonth, setInnerMonth] = useState(() => startOfMonth(props.defaultMonth ?? anchor ?? (min && startOfDay(min) > today ? min : today)));
  const month = props.month ? startOfMonth(props.month) : innerMonth;
  const [focused, setFocused] = useState<Date>(() => entryDay(month));
  const focusedInMonth = sameMonth(focused, month) ? focused : entryDay(month);

  const gridRef = useRef<HTMLTableElement>(null);
  const moveFocus = useRef(!!props.autoFocus);
  const titleId = useId();

  const setMonth = (m: Date) => {
    const next = startOfMonth(m);
    if (!props.month) setInnerMonth(next);
    onMonthChange?.(next);
  };

  const days = useMemo(() => {
    const offset = (month.getDay() - weekStartsOn + 7) % 7;
    const first = addDays(month, -offset);
    return Array.from({ length: 42 }, (_, i) => addDays(first, i));
  }, [month, weekStartsOn]);

  const fmtTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  const fmtDay = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const fmtWeekday = new Intl.DateTimeFormat(locale, { weekday: 'long' });

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-key="${toKey(focusedInMonth)}"]`)?.focus();
  });

  const goTo = (d: Date) => {
    setFocused(d);
    if (!sameMonth(d, month)) setMonth(d);
    moveFocus.current = true;
  };

  const select = (d: Date) => {
    if (isDisabled(d)) return;
    if (!sameMonth(d, month)) setMonth(d);
    setFocused(d);
    if (props.mode === 'range') {
      const { start, end } = range;
      const next: DateRange = !start || end ? { start: d, end: null } : d < start ? { start: d, end: start } : { start, end: d };
      if (props.selected === undefined) setInnerRange(next);
      props.onSelect?.(next);
    } else {
      if (props.selected === undefined) setInnerSingle(d);
      props.onSelect?.(d);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, d: Date) => {
    const dow = (d.getDay() - weekStartsOn + 7) % 7;
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(d, -1),
      ArrowRight: () => addDays(d, 1),
      ArrowUp: () => addDays(d, -7),
      ArrowDown: () => addDays(d, 7),
      Home: () => addDays(d, -dow),
      End: () => addDays(d, 6 - dow),
      PageUp: () => addMonths(d, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(d, e.shiftKey ? 12 : 1),
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    goTo(move());
  };

  const rangeOf = (d: Date): CalendarDayRange | undefined => {
    const { start, end } = range;
    if (!start || !end || sameDay(start, end)) return undefined;
    if (sameDay(d, start)) return 'start';
    if (sameDay(d, end)) return 'end';
    return d > start && d < end ? 'middle' : undefined;
  };

  const weeks = Array.from({ length: 6 }, (_, w) => days.slice(w * 7, w * 7 + 7));

  return (
    <div className={['nds-calendar', className].filter(Boolean).join(' ')} role="group" aria-label={label}>
      <div className="nds-calendar__header">
        <IconButton label="Previous month" icon={<ChevronLeftIcon />} onClick={() => setMonth(addMonths(month, -1))} />
        <div id={titleId} className="nds-calendar__title" aria-live="polite">
          {fmtTitle.format(month)}
        </div>
        <IconButton label="Next month" icon={<ChevronRightIcon />} onClick={() => setMonth(addMonths(month, 1))} />
      </div>
      <table ref={gridRef} className="nds-calendar__grid" role="grid" aria-labelledby={titleId}>
        <thead>
          <tr>
            {days.slice(0, 7).map((d) => {
              const name = fmtWeekday.format(d);
              return (
                <th key={name} scope="col" abbr={name} className="nds-calendar__weekday">
                  {name.slice(0, 2)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={toKey(week[0])}>
              {week.map((d) => {
                const r = rangeOf(d);
                const selected = isRange ? sameDay(d, range.start) || sameDay(d, range.end) : sameDay(d, single);
                return (
                  <td key={toKey(d)} role="gridcell" aria-selected={selected || r === 'middle'}>
                    <CalendarDay
                      data-key={toKey(d)}
                      day={d.getDate()}
                      aria-label={fmtDay.format(d)}
                      selected={selected && !r}
                      range={r}
                      outside={!sameMonth(d, month)}
                      disabled={isDisabled(d)}
                      today={sameDay(d, today)}
                      tabIndex={sameDay(d, focusedInMonth) ? 0 : -1}
                      onClick={() => select(d)}
                      onKeyDown={(e) => onKeyDown(e, d)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
