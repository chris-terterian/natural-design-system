import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductRow } from './ProductRow';
import type { ProductCardProps } from '../ProductCard/ProductCard';
import { figma, FIGMA_NODES } from '../../figma';

const PRODUCTS: Omit<ProductCardProps, 'showCta'>[] = [
  { title: 'Split Log Bench', meta: 'Solid oak · oil finish', price: '$420', href: '#split-log-bench', badge: 'One of a kind' },
  { title: 'River Clay Cup', meta: 'Stoneware · ash glaze', price: '$32', comparePrice: '$38', status: 'sale', href: '#river-clay-cup' },
  { title: 'Woven Rush Basket', meta: 'Rush · hand-woven', price: '$64', href: '#woven-rush-basket', badge: 'Handmade' },
  { title: 'Basalt Mortar & Pestle', meta: 'Basalt · hand-carved', price: '$85', status: 'sold-out', href: '#basalt-mortar' },
];

const meta = {
  title: 'Components/Product Row',
  tags: ['status:stable'],
  component: ProductRow,
  parameters: { ...figma(FIGMA_NODES.productRow), layout: 'fullscreen' },
  args: { title: 'New arrivals', viewAllHref: '#new', products: PRODUCTS, showButtons: false },
  argTypes: { showButtons: { control: 'boolean', description: 'Figma: Show buttons (off by default)' } },
} satisfies Meta<typeof ProductRow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  decorators: [(Story) => <div style={{ width: 1440 }}><Story /></div>],
};
export const Mobile: Story = {
  decorators: [(Story) => <div style={{ width: 375 }}><Story /></div>],
};
/** Show buttons on: every card gets Add to Bag (Notify me when sold out), aligned per row. */
export const WithButtons: Story = {
  args: { showButtons: true },
  decorators: [(Story) => <div style={{ width: 1440 }}><Story /></div>],
};

/** Mirrors the Figma grid: Show buttons = False (default), True columns · Breakpoint = Desktop, Mobile rows. */
export const AllVariants: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <table style={{ borderSpacing: 48, fontSize: 12, textAlign: 'left', verticalAlign: 'top' }}>
      <thead>
        <tr><th /><th>Show buttons / False (default)</th><th>Show buttons / True</th></tr>
      </thead>
      <tbody>
        {([['Desktop', 1440], ['Mobile', 375]] as const).map(([bp, width]) => (
          <tr key={bp} style={{ verticalAlign: 'top' }}>
            <th>Breakpoint / {bp}</th>
            <td><div style={{ width }}><ProductRow {...args} showButtons={false} /></div></td>
            <td><div style={{ width }}><ProductRow {...args} showButtons /></div></td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
