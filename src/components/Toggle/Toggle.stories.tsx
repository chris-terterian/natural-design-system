import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toggle } from './Toggle';
import { figma, FIGMA_NODES } from '../../figma';

const meta = {
  title: 'Components/Toggle',
  tags: ['status:stable'],
  component: Toggle,
  parameters: figma(FIGMA_NODES.toggle),
  args: { label: 'Gift wrap this order' },
  argTypes: { forceState: { control: 'inline-radio', options: [undefined, 'hover', 'pressed', 'focus'] } },
} satisfies Meta<typeof Toggle>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { defaultChecked: true } };
export const WithDescription: Story = { args: { defaultChecked: true, description: 'Wrapped in recycled kraft paper and tied with jute twine' } };
export const Disabled: Story = { args: { disabled: true, label: 'Express delivery', description: 'Not available for pieces that ship by freight' } };

const STATES = ['Default', 'Hover', 'Pressed', 'Focus', 'Disabled'] as const;

/** Mirrors the Figma variant grid: Checked × State. */
export const AllVariants: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <table style={{ borderSpacing: '40px 20px', fontSize: 12 }}>
      <thead><tr><th />{STATES.map((s) => <th key={s}>{s}</th>)}</tr></thead>
      <tbody>
        {[false, true].map((on) => (
          <tr key={String(on)}>
            <th style={{ textAlign: 'left' }}>{`Checked / ${on ? 'True' : 'False'}`}</th>
            {STATES.map((s) => (
              <td key={s}>
                <Toggle
                  label="Label"
                  defaultChecked={on}
                  disabled={s === 'Disabled'}
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

export const OrderPreferences: Story = {
  name: 'Example: Order preferences',
  render: () => {
    const [wrap, setWrap] = useState(true);
    const [notify, setNotify] = useState(false);
    const [handmade, setHandmade] = useState(true);
    return (
      <fieldset style={{ display: 'grid', gap: 16, border: '1px solid var(--nds-color-taupe-200)', borderRadius: 8, padding: 24 }}>
        <legend style={{ font: '600 14px/20px var(--nds-font-family)', color: 'var(--nds-color-brown-900)', padding: '0 4px' }}>Order preferences</legend>
        <Toggle label="Gift wrap this order" description="Wrapped in recycled kraft paper and tied with jute twine" checked={wrap} onChange={setWrap} />
        <Toggle label="Email me when it’s back in stock" description="One note when the next batch comes out of the kiln" checked={notify} onChange={setNotify} />
        <Toggle label="Show only handmade pieces" checked={handmade} onChange={setHandmade} />
        <Toggle label="Express delivery" description="Not available for pieces that ship by freight" disabled />
      </fieldset>
    );
  },
};
