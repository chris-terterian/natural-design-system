import type { Meta, StoryObj } from '@storybook/react-vite';
import { Logo } from './Logo';
import { figma, FIGMA_NODES } from '../../figma';

const meta = {
  title: 'Components/Logo',
  tags: ['status:stable'],
  component: Logo,
  parameters: figma(FIGMA_NODES.logo),
  argTypes: { forceState: { control: 'inline-radio', options: [undefined, 'focus'] } },
} satisfies Meta<typeof Logo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Focus: Story = { args: { forceState: 'focus' } };

/** Mirrors the Figma grid: State = Default, Focus. */
export const AllVariants: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <table style={{ borderSpacing: '64px 16px', fontSize: 12 }}>
      <thead><tr><th />{['Default', 'Focus'].map((s) => <th key={s}>{s}</th>)}</tr></thead>
      <tbody>
        <tr>
          <th style={{ textAlign: 'left' }}>Logo</th>
          <td><Logo /></td>
          <td><Logo forceState="focus" /></td>
        </tr>
      </tbody>
    </table>
  ),
};

/** Keep at least 16px (space/16) of clear space on every side; don't scale below the 24px wordmark. */
export const ClearSpace: Story = {
  render: () => (
    <div style={{ padding: 'var(--nds-space-16)', background: 'var(--nds-bg-subtle)', outline: '1px dashed var(--nds-border-default)' }}>
      <Logo />
    </div>
  ),
};
