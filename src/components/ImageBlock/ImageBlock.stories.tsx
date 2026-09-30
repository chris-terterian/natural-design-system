import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImageBlock } from './ImageBlock';
import { Button } from '../Button/Button';
import { Heading, Text } from '../Typography/Typography';
import { figma, FIGMA_NODES } from '../../figma';

const meta = {
  title: 'Components/Image Block',
  tags: ['status:beta'],
  component: ImageBlock,
  parameters: { ...figma(FIGMA_NODES.imageBlock), layout: 'fullscreen' },
  args: { type: 'hero', alt: 'Split oak bench on a stone floor' },
  argTypes: { type: { control: 'inline-radio', options: ['hero', 'banner', 'half'] } },
} satisfies Meta<typeof ImageBlock>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Hero: Story = {};
export const Banner: Story = { args: { type: 'banner', alt: 'River clay cups drying on a wooden board' } };

const Copy = () => (
  <>
    <Heading level={2}>Made slowly, by hand</Heading>
    <Text>
      Every bench starts as a single oak log, split along the grain and left to season for a year before it is
      shaped. The cracks that open as it dries are part of the piece.
    </Text>
    <Button variant="secondary">Read the bench story</Button>
  </>
);

/** Figma: Example / Half-page. Image and copy share the row; on mobile the image goes full width above the copy. */
export const HalfPage: Story = {
  name: 'Half-page',
  args: { type: 'half', alt: 'Oak log split along the grain', children: <Copy /> },
};

const TYPES = [['Hero', 'hero'], ['Banner', 'banner'], ['Half-page', 'half']] as const;

/** Mirrors the Figma grid: Type rows × Breakpoint columns (1440 and 375 wide). */
export const AllVariants: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <table style={{ borderSpacing: 40, fontSize: 12, textAlign: 'left' }}>
      <thead><tr><th>Type</th><th>Breakpoint / Desktop</th><th>Breakpoint / Mobile</th></tr></thead>
      <tbody>
        {TYPES.map(([label, type]) => (
          <tr key={type} style={{ verticalAlign: 'top' }}>
            <th>{`Type / ${label}`}</th>
            <td><div style={{ width: 1440 }}><ImageBlock type={type} alt="" /></div></td>
            <td><div style={{ width: 375 }}><ImageBlock type={type} alt="" /></div></td>
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
