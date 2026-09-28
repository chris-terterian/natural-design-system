import type { Preview } from '@storybook/react-vite';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';
import '../src/styles/global.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: { matchers: { color: /(background|color)$/i } },
    a11y: { test: 'error' },
    viewport: {
      options: {
        naturalPhone: { name: 'Natural phone (375 × 812)', styles: { width: '375px', height: '812px' }, type: 'mobile' },
        ...INITIAL_VIEWPORTS,
      },
    },
  },
};
export default preview;
