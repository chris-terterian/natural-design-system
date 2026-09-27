import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio, RadioGroup } from './Radio';
import { figma, FIGMA_NODES } from '../../figma';

const meta = {
  title: 'Components/Radio',
  component: Radio,
  parameters: figma(FIGMA_NODES.radio),
  args: { label: 'Label', name: 'demo' },
  argTypes: { forceState: { control: 'inline-radio', options: [undefined, 'hover', 'pressed', 'focus'] } },
} satisfies Meta<typeof Radio>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const WithDescription: Story = { args: { label: 'Express', description: '2–3 business days · $12' } };
export const Disabled: Story = { args: { disabled: true } };
export const Error: Story = { args: { invalid: true } };

const STATES = ['Default', 'Hover', 'Pressed', 'Focus', 'Disabled', 'Error'] as const;

/** Mirrors the Figma variant grid: Checked × State. */
export const AllVariants: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <table style={{ borderSpacing: '40px 20px', fontSize: 12 }}>
      <thead>
        <tr><th />{STATES.map((s) => <th key={s}>{s}</th>)}</tr>
      </thead>
      <tbody>
        {[false, true].map((checked) => (
          <tr key={String(checked)}>
            <th style={{ textAlign: 'left' }}>{`Checked / ${checked ? 'True' : 'False'}`}</th>
            {STATES.map((s) => (
              <td key={s}>
                <Radio
                  label="Label"
                  name={`grid-${checked}-${s}`}
                  defaultChecked={checked}
                  disabled={s === 'Disabled'}
                  invalid={s === 'Error'}
                  forceState={s === 'Hover' ? 'hover' : s === 'Pressed' ? 'pressed' : s === 'Focus' ? 'focus' : undefined}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

export const ShippingMethod: Story = {
  render: () => {
    const [value, setValue] = useState('express');
    return (
      <RadioGroup legend="Shipping method" value={value} onChange={setValue}>
        <Radio value="standard" label="Standard" description="5–7 business days · Free" />
        <Radio value="express" label="Express" description="2–3 business days · $12" />
        <Radio value="overnight" label="Overnight" description="Unavailable for this address" disabled />
      </RadioGroup>
    );
  },
};

export const GroupError: Story = {
  render: () => (
    <RadioGroup legend="Ring size" error="Select a ring size to continue.">
      <Radio value="6" label="6" />
      <Radio value="7" label="7" />
      <Radio value="8" label="8" />
    </RadioGroup>
  ),
};
