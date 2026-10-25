import type { Meta, StoryObj } from '@storybook/react-vite';
import { Price, type PriceSize } from './Price';
import { figma, FIGMA_NODES } from '../../figma';

const meta = {
  title: 'Components/Price',
  tags: ['status:beta'],
  component: Price,
  parameters: { ...figma(FIGMA_NODES.price), layout: 'padded' },
  args: { price: '$32', comparePrice: '$38' },
} satisfies Meta<typeof Price>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { comparePrice: undefined } };
/** "Sale price $32, Original price $38" for screen readers; fg/sale and the strikethrough for sight. */
export const Sale: Story = { args: { sale: true } };
/** The product page size (Product Summary). */
export const Large: Story = { args: { sale: true, size: 'large' } };

const SIZES: [PriceSize, string][] = [['default', 'Default'], ['large', 'Large']];

/** Mirrors the Figma grid: Status = Default, Sale columns · Size = Default, Large rows. */
export const AllVariants: Story = {
  render: (args) => (
    <table style={{ borderSpacing: 48, fontSize: 12, textAlign: 'left', verticalAlign: 'top' }}>
      <thead>
        <tr><th /><th>Status / Default</th><th>Status / Sale</th></tr>
      </thead>
      <tbody>
        {SIZES.map(([size, label]) => (
          <tr key={size}>
            <th>Size / {label}</th>
            <td><Price {...args} size={size} sale={false} /></td>
            <td><Price {...args} size={size} sale /></td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
