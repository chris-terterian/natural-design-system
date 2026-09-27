import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';
import { figma, FIGMA_NODES } from '../../figma';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: figma(FIGMA_NODES.badge),
  args: { children: 'New', tone: 'dark' },
  argTypes: { tone: { control: 'inline-radio', options: ['dark', 'light', 'sale', 'success', 'outline'] } },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Dark: Story = {};
export const Light: Story = { args: { tone: 'light', children: 'Handmade' } };
export const Sale: Story = { args: { tone: 'sale', children: 'Sale' } };
export const Success: Story = { args: { tone: 'success', children: 'In stock' } };
export const Outline: Story = { args: { tone: 'outline', children: 'Sold out' } };

const TONES = [
  ['dark', 'New'],
  ['light', 'Handmade'],
  ['sale', 'Sale'],
  ['success', 'In stock'],
  ['outline', 'Sold out'],
] as const;

/** Mirrors the Figma variant row: Tone. */
export const AllVariants: Story = {
  render: () => (
    <table style={{ borderSpacing: '32px 12px', fontSize: 12 }}>
      <thead><tr>{TONES.map(([t]) => <th key={t} style={{ textTransform: 'capitalize' }}>{t}</th>)}</tr></thead>
      <tbody><tr>{TONES.map(([t, label]) => <td key={t}><Badge tone={t}>{label}</Badge></td>)}</tr></tbody>
    </table>
  ),
};
