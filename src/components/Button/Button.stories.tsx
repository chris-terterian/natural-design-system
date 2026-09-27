import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { ArrowRightIcon, PlusIcon } from '../../icons';
import { figma, FIGMA_NODES } from '../../figma';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: figma(FIGMA_NODES.button),
  args: { children: 'Button', variant: 'primary' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary'] },
    leftIcon: { control: false },
    rightIcon: { control: false },
    forceState: { control: 'inline-radio', options: [undefined, 'hover', 'pressed', 'focus'] },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const IconLeft: Story = { args: { leftIcon: <PlusIcon /> } };
export const IconRight: Story = { args: { rightIcon: <ArrowRightIcon /> } };
export const IconBoth: Story = { args: { leftIcon: <PlusIcon />, rightIcon: <ArrowRightIcon /> } };
export const Disabled: Story = { args: { disabled: true } };

const STATES = ['default', 'hover', 'pressed', 'focus', 'disabled'] as const;
const ICONS = {
  None: {},
  Left: { leftIcon: <PlusIcon /> },
  Right: { rightIcon: <ArrowRightIcon /> },
  Both: { leftIcon: <PlusIcon />, rightIcon: <ArrowRightIcon /> },
};

/** Mirrors the Figma variant grid: Style × Icon × State. */
export const AllVariants: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <table style={{ borderSpacing: '32px 20px', fontSize: 12 }}>
      <thead>
        <tr>
          <th />
          {STATES.map((s) => (
            <th key={s} style={{ textTransform: 'capitalize' }}>{s}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(['primary', 'secondary'] as const).flatMap((variant) =>
          Object.entries(ICONS).map(([icon, iconProps]) => (
            <tr key={variant + icon}>
              <th style={{ textAlign: 'left', textTransform: 'capitalize' }}>{`${variant} / Icon ${icon}`}</th>
              {STATES.map((s) => (
                <td key={s}>
                  <Button
                    variant={variant}
                    {...iconProps}
                    disabled={s === 'disabled'}
                    forceState={s === 'default' || s === 'disabled' ? undefined : s}
                  >
                    Button
                  </Button>
                </td>
              ))}
            </tr>
          )),
        )}
      </tbody>
    </table>
  ),
};
