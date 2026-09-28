import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton, Logo, MenuItem, MobileMenu, NavigationMenu, NavLink } from './Navigation';
import { BagIcon, SearchIcon } from '../../icons';
import { figma, FIGMA_NODES } from '../../figma';

const meta = {
  title: 'Components/Navigation Menu',
  component: NavigationMenu,
  parameters: { ...figma(FIGMA_NODES.navigationMenu), layout: 'fullscreen' },
  args: { bagCount: 2 },
} satisfies Meta<typeof NavigationMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};
export const Mobile: Story = {
  decorators: [(Story) => <div style={{ width: 375 }}><Story /></div>],
};
export const NoAnnouncement: Story = { args: { announcement: false } };

/** Mirrors the Figma grid: Breakpoint = Desktop, Mobile. */
export const AllVariants: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <div style={{ display: 'grid', gap: 48, fontSize: 12 }}>
      <strong>Breakpoint / Desktop</strong>
      <div style={{ width: 1440 }}><NavigationMenu {...args} /></div>
      <strong>Breakpoint / Mobile</strong>
      <div style={{ width: 375 }}><NavigationMenu {...args} /></div>
    </div>
  ),
};

export const MobileMenuOpen: StoryObj<typeof MobileMenu> = {
  name: 'Mobile Menu (open)',
  parameters: { ...figma(FIGMA_NODES.mobileMenu), layout: 'padded' },
  render: () => <MobileMenu open inline bagCount={2} onClose={() => {}} />,
};

const STATES = ['Default', 'Hover', 'Active', 'Focus'] as const;
const force = (s: string) => (s === 'Hover' ? 'hover' : s === 'Focus' ? 'focus' : undefined);

export const NavLinks: Story = {
  name: 'Nav Link — All Variants',
  parameters: { ...figma(FIGMA_NODES.navLink), layout: 'padded' },
  render: () => (
    <table style={{ borderSpacing: '48px 12px', fontSize: 12 }}>
      <thead><tr>{STATES.map((s) => <th key={s}>{s}</th>)}</tr></thead>
      <tbody><tr>{STATES.map((s) => (
        <td key={s}><NavLink href="#" active={s === 'Active'} forceState={force(s)}>Link</NavLink></td>
      ))}</tr></tbody>
    </table>
  ),
};

export const IconButtons: Story = {
  name: 'Icon Button — All Variants',
  parameters: { ...figma(FIGMA_NODES.iconButton), layout: 'padded' },
  render: () => (
    <table style={{ borderSpacing: '40px 12px', fontSize: 12 }}>
      <thead><tr><th />{['Default', 'Hover', 'Pressed', 'Focus'].map((s) => <th key={s}>{s}</th>)}</tr></thead>
      <tbody>
        {[['Search', <SearchIcon />, undefined], ['Bag', <BagIcon />, 2]].map(([label, icon, count]) => (
          <tr key={label as string}>
            <th style={{ textAlign: 'left' }}>{`Show count / ${count ? 'True' : 'False'}`}</th>
            {(['default', 'hover', 'pressed', 'focus'] as const).map((s) => (
              <td key={s}><IconButton label={label as string} icon={icon} count={count as number | undefined} forceState={s === 'default' ? undefined : s} /></td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
};

export const MenuItems: Story = {
  name: 'Menu Item — All Variants',
  parameters: { ...figma(FIGMA_NODES.menuItem), layout: 'padded' },
  render: () => (
    <table style={{ borderSpacing: '24px 12px', fontSize: 12 }}>
      <tbody>{STATES.map((s) => (
        <tr key={s}>
          <th style={{ textAlign: 'left' }}>{s}</th>
          <td style={{ width: 343, paddingLeft: 12 }}><MenuItem href="#" hasSubmenu active={s === 'Active'} forceState={force(s)}>Menu item</MenuItem></td>
        </tr>
      ))}</tbody>
    </table>
  ),
};

export const LogoStory: Story = {
  name: 'Logo',
  parameters: { ...figma(FIGMA_NODES.logo), layout: 'padded' },
  render: () => (
    <div style={{ display: 'flex', gap: 48, alignItems: 'center' }}>
      <Logo />
      <Logo showDescriptor={false} />
    </div>
  ),
};
