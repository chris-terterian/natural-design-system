import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextButton } from './TextButton';
import { figma, FIGMA_NODES } from '../../figma';

const meta = {
  title: 'Components/Text Button',
  tags: ['status:beta'],
  component: TextButton,
  parameters: { ...figma(FIGMA_NODES.textButton), layout: 'padded' },
  args: { children: 'Remove' },
  argTypes: { forceState: { control: 'inline-radio', options: [undefined, 'hover', 'focus'] } },
} satisfies Meta<typeof TextButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };

/** Mirrors the Figma grid: State = Default, Hover, Focus, Disabled. */
export const AllVariants: Story = {
  render: () => (
    <table style={{ borderSpacing: '40px 12px', fontSize: 12, textAlign: 'left' }}>
      <thead><tr><th>Default</th><th>Hover</th><th>Focus</th><th>Disabled</th></tr></thead>
      <tbody>
        <tr>
          <td><TextButton>Remove</TextButton></td>
          <td><TextButton forceState="hover">Remove</TextButton></td>
          <td><TextButton forceState="focus">Remove</TextButton></td>
          <td><TextButton disabled>Remove</TextButton></td>
        </tr>
      </tbody>
    </table>
  ),
};
