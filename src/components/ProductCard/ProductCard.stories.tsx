import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductCard } from './ProductCard';
import { figma, FIGMA_NODES } from '../../figma';

const meta = {
  title: 'Components/Product Card',
  component: ProductCard,
  parameters: figma(FIGMA_NODES.productCard),
  args: { title: 'Product name', meta: '14k gold · 3 colors', price: '$120', comparePrice: '$150', href: '#', status: 'default' },
  argTypes: {
    status: { control: 'inline-radio', options: ['default', 'sale', 'sold-out'] },
    forceState: { control: 'inline-radio', options: [undefined, 'hover', 'focus'] },
  },
} satisfies Meta<typeof ProductCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Sale: Story = { args: { status: 'sale' } };
export const SoldOut: Story = { args: { status: 'sold-out' } };
export const Wishlisted: Story = { args: { wishlisted: true } };

const STATES = ['Default', 'Hover', 'Focus'] as const;
const STATUSES = [['default', 'Default'], ['sale', 'Sale'], ['sold-out', 'Sold out']] as const;

/** Mirrors the Figma variant grid: Status × State. */
export const AllVariants: Story = {
  parameters: { layout: 'padded' },
  render: (args) => (
    <table style={{ borderSpacing: 32, fontSize: 12 }}>
      <thead><tr><th />{STATES.map((s) => <th key={s}>{s}</th>)}</tr></thead>
      <tbody>
        {STATUSES.map(([status, label]) => (
          <tr key={status}>
            <th style={{ textAlign: 'left' }}>{`Status / ${label}`}</th>
            {STATES.map((s) => (
              <td key={s}>
                <ProductCard {...args} status={status} forceState={s === 'Default' ? undefined : (s.toLowerCase() as 'hover')} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
