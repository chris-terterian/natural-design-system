import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductRow } from './ProductRow';
import type { ProductCardProps } from '../ProductCard/ProductCard';
import { figma, FIGMA_NODES } from '../../figma';

const PRODUCTS: ProductCardProps[] = [
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
  args: { title: 'New arrivals', viewAllHref: '#new', products: PRODUCTS },
} satisfies Meta<typeof ProductRow>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  decorators: [(Story) => <div style={{ width: 1440 }}><Story /></div>],
};
export const Mobile: Story = {
  decorators: [(Story) => <div style={{ width: 375 }}><Story /></div>],
};

/** Mirrors the Figma grid: Breakpoint = Desktop, Mobile. */
export const AllVariants: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <div style={{ display: 'grid', gap: 48, fontSize: 12 }}>
      <strong>Breakpoint / Desktop</strong>
      <div style={{ width: 1440 }}><ProductRow {...args} /></div>
      <strong>Breakpoint / Mobile</strong>
      <div style={{ width: 375 }}><ProductRow {...args} /></div>
    </div>
  ),
};
