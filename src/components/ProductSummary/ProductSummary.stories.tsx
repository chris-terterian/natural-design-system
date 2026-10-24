import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductSummary, type ProductSummaryOption, type ProductSummaryStatus } from './ProductSummary';
import { figma, FIGMA_NODES } from '../../figma';

const GLAZES: ProductSummaryOption[] = [
  { value: 'ash', label: 'Ash', description: 'Matte grey, pools at the base' },
  { value: 'tenmoku', label: 'Tenmoku', description: 'Glossy iron brown' },
];

const meta = {
  title: 'Components/Product Summary',
  tags: ['status:beta'],
  component: ProductSummary,
  parameters: { ...figma(FIGMA_NODES.productSummary), layout: 'padded' },
  args: {
    title: 'River Clay Cup',
    story: 'Thrown from river clay we dig ourselves, then fired twice in a wood kiln.',
    price: '$32',
    optionsLegend: 'Glaze',
    options: GLAZES,
    madeToOrderWeeks: 2,
  },
  decorators: [(Story) => <div style={{ width: 480 }}><Story /></div>],
} satisfies Meta<typeof ProductSummary>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [glaze, setGlaze] = useState('ash');
    const [adding, setAdding] = useState(false);
    return <ProductSummary {...args} optionValue={glaze} onOptionChange={setGlaze} adding={adding} onAddToBag={() => setAdding(true)} />;
  },
};
export const Sale: Story = { args: { status: 'sale', comparePrice: '$38' } };
/** Notify me replaces Add to Bag; options hide because there's nothing to choose. */
export const SoldOut: Story = { args: { status: 'sold-out' } };
/** A large piece: a badge from the product, made to order and shipped by freight. */
export const LargePiece: Story = {
  args: { title: 'Split Log Bench', story: 'Cut from a single fallen oak and air-dried for two seasons.', price: '$420', badge: 'One of a kind', options: undefined, madeToOrderWeeks: 6, freight: true },
};

const STATUSES: [ProductSummaryStatus, string][] = [['default', 'Default'], ['sale', 'Sale'], ['sold-out', 'Sold out']];

/** Mirrors the Figma grid: Status = Default, Sale, Sold out columns. */
export const AllVariants: Story = {
  decorators: [(Story) => <Story />],
  render: (args) => (
    <table style={{ borderSpacing: 48, fontSize: 12, textAlign: 'left', verticalAlign: 'top' }}>
      <thead>
        <tr>{STATUSES.map(([, label]) => <th key={label}>Status / {label}</th>)}</tr>
      </thead>
      <tbody>
        <tr style={{ verticalAlign: 'top' }}>
          {STATUSES.map(([status, label]) => (
            <td key={label}>
              <div style={{ width: 480 }}>
                <ProductSummary {...args} status={status} comparePrice={status === 'sale' ? '$38' : undefined} />
              </div>
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  ),
};
