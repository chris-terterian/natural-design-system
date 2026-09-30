import type { Meta, StoryObj } from '@storybook/react-vite';
import { CartLine, type CartLineProps } from './CartLine';
import { figma, FIGMA_NODES } from '../../figma';

const BAG: CartLineProps[] = [
  { title: 'Split Log Bench', href: '#split-log-bench', sku: 'NB-SLB-OAK', price: '$420' },
  { title: 'River Clay Cup', href: '#river-clay-cup', sku: 'RCC-ASH-01', price: '$32', comparePrice: '$38' },
  { title: 'Woven Rush Basket', href: '#woven-rush-basket', sku: 'WRB-NAT-M', price: '$64' },
];

const meta = {
  title: 'Components/Cart Line',
  tags: ['status:beta'],
  component: CartLine,
  parameters: { ...figma(FIGMA_NODES.cartLine), layout: 'padded' },
  args: BAG[0],
} satisfies Meta<typeof CartLine>;
export default meta;
type Story = StoryObj<typeof meta>;

/** A single line needs its list: stories wrap it in a <ul>. */
const inList: Story["decorators"] = [(Story) => <ul style={{ margin: 0, padding: 0, width: 720 }}><Story /></ul>];
export const Default: Story = { decorators: inList };
export const Sale: Story = { args: BAG[1], decorators: inList };

/** Figma: Example / Your bag. Three lines in a list, Desktop (720) and Mobile (343). */
export const Bag: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 32, fontSize: 12 }}>
      <strong>Desktop</strong>
      <ul aria-label="Your bag" style={{ margin: 0, padding: 0, width: 720 }}>{BAG.map((l) => <CartLine key={l.href} {...l} />)}</ul>
      <strong>Mobile</strong>
      <ul aria-label="Your bag, mobile" style={{ margin: 0, padding: 0, width: 343 }}>{BAG.map((l) => <CartLine key={l.href} {...l} />)}</ul>
    </div>
  ),
};

/** Mirrors the Figma Cart Line grid: Breakpoint rows × Status columns. */
export const AllVariants: Story = {
  render: () => (
    <table style={{ borderSpacing: '48px 16px', fontSize: 12, textAlign: 'left' }}>
      <thead><tr><th>Status</th><th>Default</th><th>Sale</th></tr></thead>
      <tbody>
        {([['Desktop', 720], ['Mobile', 343]] as const).map(([bp, w]) => (
          <tr key={bp} style={{ verticalAlign: 'top' }}>
            <th>{`Breakpoint / ${bp}`}</th>
            <td><ul style={{ margin: 0, padding: 0, width: w }}><CartLine {...BAG[1]} comparePrice={undefined} /></ul></td>
            <td><ul style={{ margin: 0, padding: 0, width: w }}><CartLine {...BAG[1]} /></ul></td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
