import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductGallery, type ProductGalleryImage } from './ProductGallery';
import { figma, FIGMA_NODES } from '../../figma';

const IMAGES: ProductGalleryImage[] = [
  { label: 'Whole piece', alt: 'River clay cup with a matte grey ash glaze, on a linen cloth' },
  { label: 'Glaze close-up', alt: 'Ash glaze pooling at the base of the cup' },
  { label: 'In the hand', alt: 'River clay cup held in one hand' },
];

const meta = {
  title: 'Components/Product Gallery',
  tags: ['status:beta'],
  component: ProductGallery,
  parameters: { ...figma(FIGMA_NODES.productGallery), layout: 'padded' },
  args: { images: IMAGES, productName: 'River Clay Cup' },
} satisfies Meta<typeof ProductGallery>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Thumbnails beside the photo (the gallery is 480px or wider). Click or press a thumbnail to swap the photo. */
export const Desktop: Story = {
  decorators: [(Story) => <div style={{ width: 784 }}><Story /></div>],
};
/** Thumbnails in a row below the photo. */
export const Mobile: Story = {
  decorators: [(Story) => <div style={{ width: 343 }}><Story /></div>],
};

const STATES = ['Default', 'Hover', 'Focus'] as const;

/** Mirrors the Figma grid: State = Default, Hover, Focus columns (shown on the second thumbnail) · Breakpoint = Desktop, Mobile rows. */
export const AllVariants: Story = {
  render: (args) => (
    <table style={{ borderSpacing: 48, fontSize: 12, textAlign: 'left', verticalAlign: 'top' }}>
      <thead>
        <tr><th />{STATES.map((s) => <th key={s}>State / {s}</th>)}</tr>
      </thead>
      <tbody>
        {([['Desktop', 784], ['Mobile', 343]] as const).map(([bp, width]) => (
          <tr key={bp} style={{ verticalAlign: 'top' }}>
            <th>Breakpoint / {bp}</th>
            {STATES.map((s) => (
              <td key={s}>
                <div style={{ width }}>
                  <ProductGallery {...args} forceState={s === 'Default' ? undefined : (s.toLowerCase() as 'hover' | 'focus')} />
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
