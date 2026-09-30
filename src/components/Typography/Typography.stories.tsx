import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading, Text } from './Typography';
import { ProductRow } from '../ProductRow/ProductRow';
import type { ProductCardProps } from '../ProductCard/ProductCard';
import { figma, FIGMA_NODES } from '../../figma';

const meta = {
  title: 'Foundations/Typography',
  tags: ['status:stable'],
  component: Heading,
  parameters: { ...figma(FIGMA_NODES.typography), layout: 'padded' },
  args: { level: 1, children: 'Made from what the land lets go' },
} satisfies Meta<typeof Heading>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Follows the real viewport: desktop sizes by default, mobile sizes below 768px. */
export const Default: Story = {};

const frame = { background: 'var(--nds-color-white)', boxShadow: '0 0 0 1px var(--nds-color-taupe-200)', borderRadius: 8 } as const;
const label = { font: '600 12px/16px var(--nds-font-family)', color: 'var(--nds-color-brown-600)', margin: '0 0 12px' } as const;

const SCALE = [
  ['Heading/H1', <Heading level={1}>Made from what the land lets go</Heading>, '48 / 56 · −1', '32 / 40 · −0.5'],
  ['Heading/H2', <Heading level={2}>Finding the wood</Heading>, '36 / 44 · −0.5', '28 / 36 · −0.25'],
  ['Heading/H3', <Heading level={3}>Drying takes two seasons</Heading>, '24 / 32', '20 / 28'],
  ['Heading/H4', <Heading level={4}>Care for your bench</Heading>, '20 / 28', '18 / 26'],
  ['Paragraph/Large', <Text variant="paragraph-lg">Every piece starts with a material we didn’t make: a fallen oak, a riverbank of clay, a field of rush.</Text>, '20 / 32', '18 / 28'],
  ['Paragraph/Default', <Text>We split the log along its grain and leave it to dry slowly, so the wood settles before it’s shaped. Knots and checks stay where the tree put them.</Text>, '18 / 30', '16 / 26'],
  ['Paragraph/Small', <Text variant="paragraph-sm">Oil twice a year with a food-safe finish. Keep out of standing water.</Text>, '16 / 24', '14 / 22'],
  ['Caption', <Text variant="caption">Oak rounds stacked to air-dry behind the workshop.</Text>, '14 / 20', '14 / 20'],
] as const;

const Scale = ({ mode }: { mode: 'desktop' | 'mobile' }) => (
  <div data-nds-mode={mode} style={{ ...frame, width: mode === 'desktop' ? 960 : 375, padding: mode === 'desktop' ? '32px 40px' : '32px 16px', boxSizing: 'border-box', display: 'grid', gap: 28 }}>
    <p style={label}>{mode === 'desktop' ? 'Desktop' : 'Mobile'} mode</p>
    {SCALE.map(([name, el, d, m]) => (
      <div key={name} style={{ display: 'grid', gap: 4 }}>
        <span style={{ font: '400 11px/14px var(--nds-font-family)', color: 'var(--nds-color-brown-600)' }}>{`${name} · ${mode === 'desktop' ? d : m}`}</span>
        {el}
      </div>
    ))}
  </div>
);

/** Mirrors the Figma "Type scale" frames: same styles in Desktop and Mobile modes. */
export const TypeScale: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 64, alignItems: 'flex-start' }}>
      <Scale mode="desktop" />
      <Scale mode="mobile" />
    </div>
  ),
};

const Article = () => (
  <div className="nds-prose">
    <Text variant="caption">Journal</Text>
    <Heading level={1}>Made from what the land lets go</Heading>
    <Text variant="paragraph-lg" muted={false}>Every piece starts with a material we didn’t make: a fallen oak, a riverbank of clay, a field of rush. Our job is to listen to it.</Text>
    <Heading level={2}>Finding the wood</Heading>
    <Text>We only use trees that have already come down: storm-felled oaks, orchard thinnings, the odd walnut from a neighbour’s field. Each log is split along its grain rather than sawn, so the seat follows the way the tree grew.</Text>
    <Text>That means no two benches match. A knot might sit near one end, a check might open along the grain as the wood settles. We leave both.</Text>
    <Heading level={3}>Drying takes two seasons</Heading>
    <Text>Freshly split oak holds a lot of water. We stack the halves under cover and let the wind do the work for two summers before shaping begins.</Text>
    <Text variant="caption">Oak rounds stacked to air-dry behind the workshop.</Text>
  </div>
);

const page = (mode: 'desktop' | 'mobile') => ({
  ...frame,
  width: mode === 'desktop' ? 1440 : 375,
  padding: mode === 'desktop' ? 'var(--nds-layout-section) 40px' : 'var(--nds-layout-section) 16px',
  boxSizing: 'border-box' as const,
});

/** Mirrors the Figma "Content page" frames (Journal / About). */
export const ContentPage: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div style={{ display: 'flex', gap: 64, alignItems: 'flex-start' }}>
      <div data-nds-mode="desktop" style={page('desktop')}><Article /></div>
      <div data-nds-mode="mobile" style={page('mobile')}><Article /></div>
    </div>
  ),
};

const PRODUCTS: ProductCardProps[] = [
  { title: 'Split Log Bench', meta: 'Solid oak · oil finish', price: '$420', href: '#split-log-bench', badge: 'One of a kind' },
  { title: 'River Clay Cup', meta: 'Stoneware · ash glaze', price: '$32', comparePrice: '$38', status: 'sale', href: '#river-clay-cup' },
  { title: 'Woven Rush Basket', meta: 'Rush · hand-woven', price: '$64', href: '#woven-rush-basket', badge: 'Handmade' },
  { title: 'Basalt Mortar & Pestle', meta: 'Basalt · hand-carved', price: '$85', status: 'sold-out', href: '#basalt-mortar' },
];

const Category = ({ mode }: { mode: 'desktop' | 'mobile' }) => (
  <div data-nds-mode={mode} style={{ ...frame, width: mode === 'desktop' ? 1440 : 375, overflow: 'hidden' }}>
    <div className="nds-prose" style={{ padding: `var(--nds-layout-section) ${mode === 'desktop' ? 40 : 16}px 0` }}>
      <Heading level={1}>Clay &amp; ceramics</Heading>
      <Text variant="paragraph-lg">Cups, bowls and vessels thrown from river clay and fired twice. Glazes pool and break differently on every piece.</Text>
    </div>
    <ProductRow title="Cups & mugs" viewAllHref="#cups" products={PRODUCTS} />
  </div>
);

/** Mirrors the Figma "Category page" frames: same H1 + intro styles as content pages, then a Product Row. */
export const CategoryPage: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div style={{ display: 'flex', gap: 64, alignItems: 'flex-start' }}>
      <Category mode="desktop" />
      <Category mode="mobile" />
    </div>
  ),
};
