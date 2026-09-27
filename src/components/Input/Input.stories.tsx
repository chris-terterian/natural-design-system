import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextArea, TextField } from './Input';
import { figma, FIGMA_NODES } from '../../figma';

const meta = {
  title: 'Components/Input',
  component: TextField,
  parameters: figma(FIGMA_NODES.input),
  args: { label: 'Email', placeholder: 'you@example.com', helperText: 'We’ll never share your email.' },
  argTypes: {
    status: { control: 'inline-radio', options: ['default', 'error', 'success'] },
    forceState: { control: 'inline-radio', options: [undefined, 'hover', 'focus'] },
  },
} satisfies Meta<typeof TextField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {};
export const Filled: Story = { args: { defaultValue: 'jane@naturalco.com' } };
export const Error: Story = { args: { defaultValue: 'jane@naturalco', status: 'error', statusMessage: 'Enter a valid email address.' } };
export const Success: Story = { args: { defaultValue: 'jane@naturalco.com', status: 'success', statusMessage: 'Email is available.' } };
export const Disabled: Story = { args: { disabled: true } };
export const ReadOnly: Story = { args: { readOnly: true, defaultValue: 'jane@naturalco.com' } };

export const Textarea: StoryObj<typeof TextArea> = {
  render: (args) => <TextArea {...args} />,
  args: { label: 'Message', placeholder: 'Tell us about your order…', helperText: 'Up to 200 characters.', maxLength: 200 },
};

const STATES = ['Default', 'Hover', 'Focus', 'Filled', 'Error', 'Success', 'Disabled', 'Read-only'] as const;
const stateProps = (s: (typeof STATES)[number], value: string, err: string, ok: string) =>
  ({
    Default: {},
    Hover: { forceState: 'hover' },
    Focus: { forceState: 'focus' },
    Filled: { defaultValue: value },
    Error: { status: 'error', statusMessage: err, defaultValue: err.includes('email') ? 'jane@naturalco' : '' },
    Success: { status: 'success', statusMessage: ok, defaultValue: value },
    Disabled: { disabled: true },
    'Read-only': { readOnly: true, defaultValue: value },
  })[s] as object;

/** Mirrors the Figma variant grid: Type × State. */
export const AllVariants: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 320px)', gap: 40 }}>
      {STATES.map((s) => (
        <div key={s} style={{ display: 'grid', gap: 24, alignContent: 'start' }}>
          <strong style={{ fontSize: 12 }}>{s}</strong>
          <TextField label="Email" placeholder="you@example.com" helperText="We’ll never share your email."
            {...stateProps(s, 'jane@naturalco.com', 'Enter a valid email address.', 'Email is available.')} />
          <TextArea label="Message" placeholder="Tell us about your order…" helperText="Up to 200 characters." maxLength={200}
            {...stateProps(s, 'Could you gift-wrap this order and include a handwritten note? Thank you!', 'Please enter a message.', 'Message looks good.')} />
        </div>
      ))}
    </div>
  ),
};
