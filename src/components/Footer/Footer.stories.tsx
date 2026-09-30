import type { Meta, StoryObj } from '@storybook/react-vite';
import { Footer, FooterColumn, FooterLink, DEFAULT_FOOTER_COLUMNS } from './Footer';
import { figma, FIGMA_NODES } from '../../figma';

const COPYRIGHT = '© 2026 Natural. All rights reserved.';

const meta = {
  title: 'Components/Footer',
  tags: ['status:beta'],
  component: Footer,
  parameters: { ...figma(FIGMA_NODES.footer), layout: 'fullscreen' },
  args: { copyright: COPYRIGHT },
} satisfies Meta<typeof Footer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = { decorators: [(Story) => <div style={{ width: 1440 }}><Story /></div>] };
export const Mobile: Story = { decorators: [(Story) => <div style={{ width: 375 }}><Story /></div>] };

/** Mirrors the Figma Footer set: Breakpoint = Desktop, Mobile. */
export const AllVariants: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <div style={{ display: 'grid', gap: 32, fontSize: 12 }}>
      <strong>Breakpoint / Desktop</strong>
      <div style={{ width: 1440 }}><Footer {...args} /></div>
      <strong>Breakpoint / Mobile</strong>
      <div style={{ width: 375 }}><Footer {...args} /></div>
    </div>
  ),
};

/** Figma: Footer Link. State columns × Size rows. */
export const FooterLinkStates: Story = {
  name: 'Footer Link',
  parameters: { ...figma(FIGMA_NODES.footerLink), layout: 'padded' },
  render: () => (
    <table style={{ borderSpacing: '40px 20px', fontSize: 12, textAlign: 'left', background: 'var(--nds-bg-subtle)' }}>
      <thead><tr><th>State</th><th>Default</th><th>Hover</th><th>Focus</th></tr></thead>
      <tbody>
        {(['default', 'small'] as const).map((size) => (
          <tr key={size}>
            <th>{`Size / ${size === 'default' ? 'Default' : 'Small'}`}</th>
            <td><FooterLink size={size} href="#link">Care guides</FooterLink></td>
            <td><FooterLink size={size} href="#link" forceState="hover">Care guides</FooterLink></td>
            <td><FooterLink size={size} href="#link" forceState="focus">Care guides</FooterLink></td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

/** Figma: Footer Column. Mode = Static (desktop), Collapsed and Expanded (mobile disclosure). */
export const FooterColumnStory: Story = {
  name: 'Footer Column',
  parameters: { ...figma(FIGMA_NODES.footerColumn), layout: 'padded' },
  render: () => (
    <table style={{ borderSpacing: '40px 12px', fontSize: 12, textAlign: 'left' }}>
      <thead><tr><th>Mode / Static</th><th>Mode / Collapsed</th><th>Mode / Expanded</th></tr></thead>
      <tbody>
        <tr style={{ verticalAlign: 'top' }}>
          {/* Each cell is its own container: 800 wide shows Static, 343 shows the mobile disclosure. */}
          <td><div style={{ containerType: 'inline-size', width: 800, background: 'var(--nds-bg-subtle)', padding: 16 }}><FooterColumn {...DEFAULT_FOOTER_COLUMNS[0]} /></div></td>
          <td><div style={{ containerType: 'inline-size', width: 343, background: 'var(--nds-bg-subtle)', padding: 16 }}><FooterColumn {...DEFAULT_FOOTER_COLUMNS[0]} /></div></td>
          <td><div style={{ containerType: 'inline-size', width: 343, background: 'var(--nds-bg-subtle)', padding: 16 }}><FooterColumn {...DEFAULT_FOOTER_COLUMNS[0]} defaultOpen /></div></td>
        </tr>
      </tbody>
    </table>
  ),
};
