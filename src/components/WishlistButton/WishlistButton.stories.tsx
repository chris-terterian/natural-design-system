import type { Meta, StoryObj } from '@storybook/react-vite';
import { WishlistButton } from './WishlistButton';
import { figma, FIGMA_NODES } from '../../figma';

const meta = {
  title: 'Components/Wishlist Button',
  component: WishlistButton,
  parameters: { ...figma(FIGMA_NODES.wishlistButton), backgrounds: { default: 'media' } },
  decorators: [(Story) => <div style={{ background: 'var(--nds-card-media-bg)', padding: 32, borderRadius: 8 }}><Story /></div>],
  args: { productName: 'Gold Hoops' },
  argTypes: { forceState: { control: 'inline-radio', options: [undefined, 'hover', 'pressed', 'focus'] } },
} satisfies Meta<typeof WishlistButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { defaultSelected: true } };

const STATES = ['Default', 'Hover', 'Pressed', 'Focus'] as const;

/** Mirrors the Figma variant grid: Selected × State. */
export const AllVariants: Story = {
  render: () => (
    <table style={{ borderSpacing: '40px 16px', fontSize: 12 }}>
      <thead><tr><th />{STATES.map((s) => <th key={s}>{s}</th>)}</tr></thead>
      <tbody>
        {[false, true].map((sel) => (
          <tr key={String(sel)}>
            <th style={{ textAlign: 'left' }}>{`Selected / ${sel ? 'True' : 'False'}`}</th>
            {STATES.map((s) => (
              <td key={s}>
                <WishlistButton defaultSelected={sel} forceState={s === 'Default' ? undefined : (s.toLowerCase() as 'hover')} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
