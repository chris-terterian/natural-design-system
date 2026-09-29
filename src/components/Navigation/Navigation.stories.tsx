import type { Meta, StoryObj } from '@storybook/react-vite';
import { DEFAULT_NAV_ITEMS, IconButton, MenuItem, MobileMenu, NavDropdown, NavigationMenu, NavLink } from './Navigation';
import { BagIcon, SearchIcon } from '../../icons';
import { figma, FIGMA_NODES } from '../../figma';

const meta = {
  title: 'Components/Navigation Menu',
  tags: ['status:stable'],
  component: NavigationMenu,
  parameters: { ...figma(FIGMA_NODES.navigationMenu), layout: 'fullscreen' },
  args: { bagCount: 2 },
} satisfies Meta<typeof NavigationMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};
/** Opens at a phone viewport, so the Menu button shows the full-screen mobile menu as on a real phone. */
export const Mobile: Story = {
  globals: { viewport: { value: 'naturalPhone', isRotated: false } },
};

/** The header is narrow because of its container, but the window is wide: the menu opens as a 480px sheet. */
export const MobileInWideWindow: Story = {
  name: 'Mobile — narrow container, wide window',
  decorators: [(Story) => <div style={{ width: 375 }}><Story /></div>],
};
export const NoAnnouncement: Story = { args: { announcement: false } };

/** Mirrors the Figma example "Desktop with Shop open": Shop in the Open state with its Nav Dropdown. */
export const DesktopShopOpen: Story = {
  name: 'Desktop — Shop open',
  args: { defaultOpenMenu: 'Shop' },
  decorators: [(Story) => <div style={{ width: 1440, minHeight: 480 }}><Story /></div>],
};

export const NavDropdowns: Story = {
  name: 'Nav Dropdown — All Variants',
  parameters: { ...figma(FIGMA_NODES.navDropdown), layout: 'padded' },
  render: () => (
    <div style={{ display: 'grid', gap: 32, width: 1440, fontSize: 12 }}>
      {DEFAULT_NAV_ITEMS.filter((i) => i.menu).map((i) => (
        <div key={i.label} style={{ display: 'grid', gap: 8 }}>
          <strong>{`Menu / ${i.label}`}</strong>
          <NavDropdown {...i.menu!} />
        </div>
      ))}
    </div>
  ),
};

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
  render: () => <div style={{ width: 375, height: 812, display: 'flex', boxShadow: '0 0 0 1px var(--nds-nav-border)' }}><MobileMenu open inline bagCount={2} onClose={() => {}} /></div>,
};

export const MobileSubmenu: StoryObj<typeof MobileMenu> = {
  name: 'Mobile Menu (Submenu level)',
  parameters: { ...figma(FIGMA_NODES.mobileMenu), layout: 'padded' },
  render: () => <div style={{ width: 375, height: 812, display: 'flex', boxShadow: '0 0 0 1px var(--nds-nav-border)' }}><MobileMenu open inline initialLevel="Shop" bagCount={2} onClose={() => {}} /></div>,
};

const STATES = ['Default', 'Hover', 'Active', 'Focus'] as const;
const LINK_STATES = [...STATES, 'Open'] as const;
const force = (s: string) => (s === 'Hover' ? 'hover' : s === 'Focus' ? 'focus' : undefined);

export const NavLinks: Story = {
  name: 'Nav Link — All Variants',
  parameters: { ...figma(FIGMA_NODES.navLink), layout: 'padded' },
  render: () => (
    <table style={{ borderSpacing: '48px 12px', fontSize: 12 }}>
      <thead><tr>{LINK_STATES.map((s) => <th key={s}>{s}</th>)}</tr></thead>
      <tbody><tr>{LINK_STATES.map((s) => (
        <td key={s}><NavLink href="#" active={s === 'Active'} hasMenu={s === 'Open'} forceState={s === 'Open' ? 'open' : force(s)}>{s === 'Open' ? 'Shop' : 'Journal'}</NavLink></td>
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
          <td style={{ width: 343, paddingLeft: 12 }}>{s === 'Active' ? <MenuItem href="#" active forceState={force(s)}>Menu item</MenuItem> : <MenuItem hasSubmenu forceState={force(s)}>Menu item</MenuItem>}</td>
        </tr>
      ))}</tbody>
    </table>
  ),
};
