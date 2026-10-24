import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductDetails } from './ProductDetails';
import { figma, FIGMA_NODES } from '../../figma';

const meta = {
  title: 'Components/Product Details',
  tags: ['status:beta'],
  component: ProductDetails,
  parameters: { ...figma(FIGMA_NODES.productDetails), layout: 'padded' },
  args: {
    details: [
      { label: 'Material', value: 'Stoneware' },
      { label: 'Finish', value: 'Ash glaze, raw clay foot' },
      { label: 'Dimensions', value: '8 cm tall · 9 cm across' },
      { label: 'Weight', value: '280 g' },
      { label: 'Capacity', value: '250 ml' },
    ],
    variation: 'The glaze pools like still water at the base, and every firing moves it a little differently. Yours will be its own.',
    care: 'Dishwasher safe. Hand washing keeps the glaze bright for longer.',
    delivery: 'Made to order · ships in 2 weeks. Wrapped in recycled paper.',
  },
} satisfies Meta<typeof ProductDetails>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  decorators: [(Story) => <div style={{ width: 1360 }}><Story /></div>],
};
export const Mobile: Story = {
  decorators: [(Story) => <div data-nds-mode="mobile" style={{ width: 343 }}><Story /></div>],
};

/** Mirrors the Figma grid: Breakpoint = Desktop, Mobile rows. */
export const AllVariants: Story = {
  render: (args) => (
    <table style={{ borderSpacing: 48, fontSize: 12, textAlign: 'left', verticalAlign: 'top' }}>
      <tbody>
        {([['Desktop', 1360, 'desktop'], ['Mobile', 343, 'mobile']] as const).map(([bp, width, mode]) => (
          <tr key={bp} style={{ verticalAlign: 'top' }}>
            <th>Breakpoint / {bp}</th>
            <td><div data-nds-mode={mode} style={{ width }}><ProductDetails {...args} /></div></td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
