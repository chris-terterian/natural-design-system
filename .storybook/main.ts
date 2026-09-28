import type { StorybookConfig } from '@storybook/react-vite';

const isStaticBuild = process.argv.includes('build');

const config: StorybookConfig = {
  // Story UI's workspace and generated stories are local-development only: `storybook build` (GitHub Pages)
  // publishes the design system and governance pages, not a tool that needs a local server.
  stories: [
    '../src/components/**/*.stories.@(ts|tsx)',
    '../src/governance/**/*.mdx',
    ...(isStaticBuild ? [] : ['../src/stories/**/*.mdx', '../src/stories/**/*.stories.@(ts|tsx)']),
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-designs'],
  framework: { name: '@storybook/react-vite', options: {} },
  viteFinal: async (config) => {
    // Story UI: Exclude from dependency optimization to handle CSS imports correctly
    config.optimizeDeps = {
      ...config.optimizeDeps,
      exclude: [
        ...(config.optimizeDeps?.exclude || []),
        '@tpitre/story-ui'
      ],
      // Excluding '@tpitre/story-ui' means Vite serves it (and everything it
      // imports) unbundled and never interops the CommonJS-only packages on
      // that path — '@radix-ui/themes' imports CJS-only 'classnames', which
      // otherwise fails in the browser with "does not provide an export named
      // 'default'" and the Story UI workspace never mounts. The '>' chains
      // tell Vite to pre-bundle those packages anyway.
      include: [
        ...(config.optimizeDeps?.include || []),
        '@tpitre/story-ui > @radix-ui/themes > classnames'
      ]
    };
    // Story UI: keep Vite's own module watcher alive on macOS. Storybook's story
    // INDEX watcher and Vite's MODULE watcher are different watchers, and the
    // launcher only fixes the first. Measured on a Storybook that had been
    // running seven hours: a story rewritten on disk was never re-transformed —
    // still serving the previous bytes after 90 seconds — so a repair was
    // re-checked against the render it was meant to replace. With polling the
    // same edit was served in 1 second. Remove this if you set server.watch
    // yourself.
    if (process.platform === 'darwin') {
      config.server = {
        ...config.server,
        watch: { ...(config.server?.watch ?? {}), usePolling: true, interval: 300 },
      };
    }
    return config;
  },
};
export default config;
