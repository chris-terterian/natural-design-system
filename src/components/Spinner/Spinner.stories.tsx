import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './Spinner';
import { figma, FIGMA_NODES } from '../../figma';

const meta = {
  title: 'Components/Spinner',
  tags: ['status:stable'],
  component: Spinner,
  parameters: figma(FIGMA_NODES.spinner),
} satisfies Meta<typeof Spinner>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
