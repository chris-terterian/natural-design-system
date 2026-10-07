import type { Preview } from '@storybook/react-vite';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';
import '../src/styles/global.css';

// Brand, Theme and Motion toolbars (D-036, D-035, D-037): set data-nds-brand, data-nds-theme, data-nds-motion on <html>, exactly what a consuming site does, so stories and docs
// render with the Light or Dark values of every Color role. `?globals=theme:dark` in a story URL does the same.
const preview: Preview = {
  globalTypes: {
    brand: {
      description: 'Brand palette (Natural / Tide)',
      toolbar: { title: 'Brand', icon: 'paintbrush', items: [{ value: 'natural', title: 'Natural' }, { value: 'tide', title: 'Tide' }], dynamicTitle: true },
    },
    motion: {
      description: 'Motion mode (Standard / Reduced)',
      toolbar: { title: 'Motion', icon: 'play', items: [{ value: 'standard', title: 'Standard' }, { value: 'reduced', title: 'Reduced' }], dynamicTitle: true },
    },
    theme: {
      description: 'Color mode (Light / Dark)',
      toolbar: { title: 'Theme', icon: 'mirror', items: [{ value: 'light', title: 'Light' }, { value: 'dark', title: 'Dark' }], dynamicTitle: true },
    },
  },
  initialGlobals: { brand: 'natural', theme: 'light', motion: 'standard' },
  decorators: [
    (Story, context) => {
      document.documentElement.setAttribute('data-nds-brand', context.globals.brand === 'tide' ? 'tide' : 'natural');
      document.documentElement.setAttribute('data-nds-theme', context.globals.theme === 'dark' ? 'dark' : 'light');
      // Motion: Standard follows the OS (no attribute); Reduced forces it, like a site's own motion setting.
      if (context.globals.motion === 'reduced') document.documentElement.setAttribute('data-nds-motion', 'reduced');
      else document.documentElement.removeAttribute('data-nds-motion');
      return Story();
    },
  ],
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
