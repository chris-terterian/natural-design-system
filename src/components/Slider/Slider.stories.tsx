import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RangeSlider, Slider, type RangeSliderField, type SliderField } from './Slider';
import { figma, FIGMA_NODES } from '../../figma';

const price = (v: number) => `$${v}`;

const meta = {
  title: 'Components/Slider',
  tags: ['status:beta'],
  component: Slider,
  parameters: { ...figma(FIGMA_NODES.slider), layout: 'padded' },
  args: { label: 'Max price ($)', min: 0, max: 600, step: 10, defaultValue: 240, formatValue: price },
  argTypes: {
    field: { control: 'inline-radio', options: ['none', 'start', 'end', 'top', 'bottom'] },
    forceState: { control: 'inline-radio', options: [undefined, 'hover', 'pressed', 'focus'] },
  },
} satisfies Meta<typeof Slider>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Figma: Field=None. The slider on its own. */
export const Default: Story = {};
export const FieldStart: Story = { name: 'Field at start', args: { field: 'start' } };
export const FieldEnd: Story = { name: 'Field at end', args: { field: 'end' } };
export const FieldTop: Story = { name: 'Field above', args: { field: 'top' } };
export const FieldBottom: Story = { name: 'Field below', args: { field: 'bottom' } };
export const Disabled: Story = { args: { field: 'end', disabled: true } };

/** Controlled: the slider and the field share one value. */
export const Controlled: Story = {
  render: (args) => {
    const [v, setV] = useState(240);
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <Slider {...args} field="end" value={v} onChange={setV} />
        <span style={{ fontSize: 14 }}>Showing pieces up to ${v}</span>
      </div>
    );
  },
};

const FIELDS: [string, SliderField][] = [['None (slider only)', 'none'], ['Start', 'start'], ['End', 'end'], ['Top (above)', 'top'], ['Bottom (below)', 'bottom']];

/** Mirrors the Figma Slider grid: Field columns × State rows. */
export const AllVariants: Story = {
  render: (args) => (
    <table style={{ borderSpacing: '40px 24px', fontSize: 12, textAlign: 'left' }}>
      <thead><tr><th>Field</th>{FIELDS.map(([l]) => <th key={l}>{l}</th>)}</tr></thead>
      <tbody>
        {[false, true].map((dis) => (
          <tr key={String(dis)} style={{ verticalAlign: 'top' }}>
            <th>{`State / ${dis ? 'Disabled' : 'Default'}`}</th>
            {FIELDS.map(([l, f]) => <td key={l}><Slider {...args} field={f} disabled={dis} /></td>)}
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

/** Figma: Slider Thumb (State) and Slider Input (State). */
export const ThumbAndInputStates: Story = {
  name: 'Slider Thumb & Slider Input',
  parameters: figma(FIGMA_NODES.sliderThumb),
  render: (args) => (
    <table style={{ borderSpacing: '32px 24px', fontSize: 12, textAlign: 'left' }}>
      <tbody>
        <tr>
          <th>Slider Thumb</th>
          {([['Default', undefined], ['Hover', 'hover'], ['Pressed', 'pressed'], ['Focus', 'focus']] as const).map(([l, s]) => (
            <td key={l}><div style={{ fontWeight: 600, marginBottom: 8 }}>{l}</div><Slider {...args} hideLabel label={`Thumb ${l}`} forceState={s} /></td>
          ))}
          <td><div style={{ fontWeight: 600, marginBottom: 8 }}>Disabled</div><Slider {...args} hideLabel label="Thumb disabled" disabled /></td>
        </tr>
        <tr>
          <th>Slider Input</th>
          {([['Default', undefined], ['Hover', 'hover'], ['Focus', 'focus']] as const).map(([l, s]) => (
            <td key={l}><div style={{ fontWeight: 600, marginBottom: 8 }}>{l}</div><Slider {...args} field="start" hideLabel label={`Input ${l}`} fieldForceState={s} /></td>
          ))}
          <td><div style={{ fontWeight: 600, marginBottom: 8 }}>Disabled</div><Slider {...args} field="start" hideLabel label="Input disabled" disabled /></td>
        </tr>
      </tbody>
    </table>
  ),
};

/* ---------- Range Slider ---------- */

/** Figma: Range Slider. Two thumbs for a from–to range; they never cross. */
export const Range: Story = {
  name: 'Range Slider',
  parameters: figma(FIGMA_NODES.rangeSlider),
  render: () => {
    const [v, setV] = useState<[number, number]>([120, 360]);
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <RangeSlider label="Price ($)" field="bottom" min={0} max={600} step={10} value={v} onChange={setV} formatValue={price} />
        <span style={{ fontSize: 14 }}>Showing pieces from ${v[0]} to ${v[1]}</span>
      </div>
    );
  },
};

const RANGE_FIELDS: [string, RangeSliderField][] = [['None (slider only)', 'none'], ['Sides (min start, max end)', 'sides'], ['Top (above)', 'top'], ['Bottom (below)', 'bottom']];

/** Mirrors the Figma Range Slider grid: Field columns × State rows. */
export const RangeAllVariants: Story = {
  name: 'Range Slider: All Variants',
  parameters: figma(FIGMA_NODES.rangeSlider),
  render: () => (
    <table style={{ borderSpacing: '40px 24px', fontSize: 12, textAlign: 'left' }}>
      <thead><tr><th>Field</th>{RANGE_FIELDS.map(([l]) => <th key={l}>{l}</th>)}</tr></thead>
      <tbody>
        {[false, true].map((dis) => (
          <tr key={String(dis)} style={{ verticalAlign: 'top' }}>
            <th>{`State / ${dis ? 'Disabled' : 'Default'}`}</th>
            {RANGE_FIELDS.map(([l, f]) => (
              <td key={l}><RangeSlider label="Price ($)" field={f} min={0} max={600} step={10} defaultValue={[120, 360]} formatValue={price} disabled={dis} /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
