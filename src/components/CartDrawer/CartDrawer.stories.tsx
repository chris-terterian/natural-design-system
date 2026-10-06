import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CartDrawer } from './CartDrawer';
import type { CartLineProps } from '../CartLine/CartLine';
import { Button } from '../Button/Button';
import { Footer } from '../Footer/Footer';
import { ImageBlock } from '../ImageBlock/ImageBlock';
import { NavigationMenu } from '../Navigation/Navigation';
import { ProductRow } from '../ProductRow/ProductRow';
import type { ProductCardProps } from '../ProductCard/ProductCard';
import { RangeSlider } from '../Slider/Slider';
import { Toggle } from '../Toggle/Toggle';
import { Heading, Text } from '../Typography/Typography';
import { figma, FIGMA_NODES } from '../../figma';

const LINES: CartLineProps[] = [
  { title: 'Split Log Bench', href: '#split-log-bench', sku: 'NB-SLB-OAK', price: '$420' },
  { title: 'River Clay Cup', href: '#river-clay-cup', sku: 'RCC-ASH-01', price: '$32', comparePrice: '$38' },
  { title: 'Woven Rush Basket', href: '#woven-rush-basket', sku: 'WRB-NAT-M', price: '$64' },
];

const meta = {
  title: 'Components/Cart Drawer',
  tags: ['status:beta'],
  component: CartDrawer,
  parameters: { ...figma(FIGMA_NODES.cartDrawer), layout: 'fullscreen' },
  args: { open: false, onClose: () => {}, lines: LINES, subtotal: '$516' },
} satisfies Meta<typeof CartDrawer>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Figma: Cart Drawer, shown in place (static) so the layout can be reviewed without opening it. */
export const Default: Story = {
  render: (args) => <div style={{ display: 'flex', justifyContent: 'flex-end', height: 900, background: 'var(--nds-bg-subtle)' }}><CartDrawer {...args} inline /></div>,
};
export const Empty: Story = {
  args: { lines: [], subtotal: '$0' },
  render: (args) => <div style={{ display: 'flex', justifyContent: 'flex-end', height: 600, background: 'var(--nds-bg-subtle)' }}><CartDrawer {...args} inline /></div>,
};

/** Click Open bag: the drawer opens as a modal; Escape, Close, Continue shopping or the backdrop close it. */
export const Modal: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ padding: 24 }}>
        <Button onClick={() => setOpen(true)}>Open bag</Button>
        <CartDrawer {...args} open={open} onClose={() => setOpen(false)} />
      </div>
    );
  },
};

const card = (title: string, meta: string, price: string, extra: Partial<ProductCardProps> = {}): ProductCardProps => ({ title, meta, price, href: `#${title.toLowerCase().replace(/[^a-z]+/g, '-')}`, ...extra });
const ROWS: [string, string, ProductCardProps[]][] = [
  ['Cups & mugs', '#cups', [card('River Clay Cup', 'Stoneware · ash glaze', '$32', { status: 'sale', comparePrice: '$38' }), card('Tenmoku Mug', 'Stoneware · iron glaze', '$36', { badge: 'Handmade' }), card('Pinched Tea Bowl', 'Porcelain · celadon', '$42', { badge: 'One of a kind' }), card('Espresso Cup Pair', 'Stoneware · raw clay foot', '$48', { status: 'sold-out' })]],
  ['Bowls & plates', '#bowls', [card('Salt-fired Serving Bowl', 'Stoneware · salt glaze', '$120', { badge: 'One of a kind' }), card('Everyday Plate, Set of 4', 'Stoneware · oat glaze', '$140', { badge: 'Handmade' }), card('Nesting Bowls', 'Earthenware · slip-trailed', '$88', { badge: 'New' }), card('Shallow Olive Dish', 'Porcelain · clear glaze', '$28', { status: 'sale', comparePrice: '$34' })]],
  ['Vases & vessels', '#vases', [card('Moon Jar', 'Porcelain · hand-coiled', '$260', { badge: 'One of a kind' }), card('Bud Vase', 'Stoneware · ash glaze', '$45', { badge: 'New' }), card('Wood-fired Bottle', 'Stoneware · natural ash', '$180', { status: 'sold-out' }), card('Studio Pitcher', 'Stoneware · tenmoku', '$72', { badge: 'Handmade' })]],
];

/** Figma: Desktop Example page. A category page assembled from the library; the Bag button opens the drawer. */
export const CategoryPage: Story = {
  name: 'In a category page',
  parameters: figma(FIGMA_NODES.categoryPage),
  render: (args) => {
    const [open, setOpen] = useState(false);
    const [price, setPrice] = useState<[number, number]>([0, 600]);
    const [inStock, setInStock] = useState(false);
    const pad = { paddingInline: 'var(--nds-layout-page-margin)' };
    return (
      <div style={{ width: 1440 }}>
        <NavigationMenu bagCount={LINES.length} onBag={() => setOpen(true)} />
        <main>
          <ImageBlock type="banner" alt="" />
          <div style={{ ...pad, paddingTop: 'var(--nds-layout-section)', display: 'grid', gap: 'var(--nds-text-space-after-heading)', maxWidth: 'var(--nds-text-measure)' }}>
            <Heading level={1}>Clay &amp; ceramics</Heading>
            <Text variant="paragraph-lg">Cups, bowls and vessels thrown from river clay and fired twice. Glazes pool and break differently on every piece, so no two are quite alike.</Text>
          </div>
          <div style={{ ...pad, paddingTop: 'var(--nds-layout-section)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--nds-layout-section)' }}>
              <RangeSlider label="Price ($)" min={0} max={600} step={10} value={price} onChange={setPrice} formatValue={(v) => `$${v}`} />
              <Toggle label="In stock only" checked={inStock} onChange={setInStock} />
            </div>
            <Text variant="paragraph-sm" muted>20 pieces</Text>
          </div>
          <ProductRow title={ROWS[0][0]} viewAllHref={ROWS[0][1]} viewAllLabel="View all cups" products={ROWS[0][2]} />
          <ProductRow title={ROWS[1][0]} viewAllHref={ROWS[1][1]} viewAllLabel="View all bowls" products={ROWS[1][2]} />
          <ImageBlock type="half" alt="">
            <Heading level={2}>Thrown in our studio</Heading>
            <Text>Every piece is thrown on the wheel from river clay we dig and wedge ourselves, then fired twice. Small runs mean each glaze batch is a little different.</Text>
            <Button variant="secondary">Meet the makers</Button>
          </ImageBlock>
          <ProductRow title={ROWS[2][0]} viewAllHref={ROWS[2][1]} viewAllLabel="View all vases" products={ROWS[2][2]} />
          <div style={{ display: 'grid', justifyItems: 'center', gap: 'var(--nds-text-space-after-heading)', paddingBottom: 'var(--nds-layout-section)' }}>
            <Text variant="paragraph-sm" muted>Showing 12 of 20 pieces</Text>
            <Button variant="secondary">Show 8 more</Button>
          </div>
        </main>
        <Footer copyright="© 2026 Natural. All rights reserved." />
        <CartDrawer {...args} open={open} onClose={() => setOpen(false)} />
      </div>
    );
  },
};
