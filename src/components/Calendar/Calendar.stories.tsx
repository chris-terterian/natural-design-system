import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar, CalendarDay, type CalendarDayProps, type CalendarProps, type DateRange } from './Calendar';
import { figma, FIGMA_NODES } from '../../figma';

/* The Figma example: delivery in October 2026, earliest 5 October, no Sunday deliveries. */
const TODAY = new Date(2026, 8, 29);
const EARLIEST = new Date(2026, 9, 5);
const noSundays = (d: Date) => d.getDay() === 0;
const example = { today: TODAY, min: EARLIEST, isDateDisabled: noSundays, defaultMonth: new Date(2026, 9, 1) };
/** Props shared by both modes (story args are a union of Single and Range). */
const shared = ({ label, today, min, max, isDateDisabled, defaultMonth, weekStartsOn, locale }: CalendarProps) =>
  ({ label, today, min, max, isDateDisabled, defaultMonth, weekStartsOn, locale });

const meta = {
  title: 'Components/Calendar',
  tags: ['status:beta'],
  component: Calendar,
  parameters: { ...figma(FIGMA_NODES.calendar), layout: 'padded' },
  args: { label: 'Delivery date', ...example },
} satisfies Meta<typeof Calendar>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Figma: Mode=Single. Click a day or use the arrow keys, then Enter. */
export const Single: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | null>(new Date(2026, 9, 9));
    return (
      <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
        <Calendar {...shared(args)} mode="single" selected={date} onSelect={setDate} />
        <span style={{ fontSize: 14 }}>Selected: {date?.toDateString() ?? 'none'}</span>
      </div>
    );
  },
};

/** Figma: Mode=Range. First click sets the start, the second sets the end. */
export const Range: Story = {
  args: { label: 'Pickup window' },
  render: (args) => {
    const [range, setRange] = useState<DateRange>({ start: new Date(2026, 9, 13), end: new Date(2026, 9, 16) });
    return (
      <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
        <Calendar {...shared(args)} mode="range" selected={range} onSelect={setRange} />
        <span style={{ fontSize: 14 }}>
          {range.start?.toDateString() ?? '…'} to {range.end?.toDateString() ?? '…'}
        </span>
      </div>
    );
  },
};

/** Mirrors the Figma Calendar set: Mode = Single (default), Range. */
export const AllVariants: Story = {
  render: (args) => (
    <table style={{ borderSpacing: '48px 16px', fontSize: 12, textAlign: 'left' }}>
      <thead>
        <tr><th>Mode / Single (default)</th><th>Mode / Range</th></tr>
      </thead>
      <tbody>
        <tr style={{ verticalAlign: 'top' }}>
          <td><Calendar {...shared(args)} mode="single" defaultSelected={new Date(2026, 9, 9)} /></td>
          <td><Calendar {...shared(args)} label="Pickup window" mode="range" defaultSelected={{ start: new Date(2026, 9, 13), end: new Date(2026, 9, 16) }} /></td>
        </tr>
      </tbody>
    </table>
  ),
};

const DAY_STATES: [string, Partial<CalendarDayProps>][] = [
  ['Default', {}],
  ['Hover', { forceState: 'hover' }],
  ['Pressed', { forceState: 'pressed' }],
  ['Focus', { forceState: 'focus' }],
  ['Selected', { selected: true }],
  ['Range start', { range: 'start' }],
  ['Range middle', { range: 'middle' }],
  ['Range end', { range: 'end' }],
  ['Outside', { outside: true }],
  ['Disabled', { disabled: true }],
];

/** Figma: Calendar Day. Mirrors its grid: State columns × Today rows. */
export const CalendarDayStates: Story = {
  name: 'Calendar Day',
  parameters: figma(FIGMA_NODES.calendarDay),
  render: () => (
    <table style={{ borderSpacing: '28px 20px', fontSize: 12, textAlign: 'left' }}>
      <thead>
        <tr><th>State</th>{DAY_STATES.map(([s]) => <th key={s}>{s}</th>)}</tr>
      </thead>
      <tbody>
        {[false, true].map((today) => (
          <tr key={String(today)}>
            <th>{`Today / ${today ? 'True' : 'False'}`}</th>
            {DAY_STATES.map(([s, props]) => (
              <td key={s}>
                <CalendarDay day={today ? 29 : 9} aria-label={`${s}${today ? ', today' : ''}`} today={today} {...props} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
