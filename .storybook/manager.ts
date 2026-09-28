// Storybook manager customizations.
// Story UI (AI story generation) needs its local server (npm run story-ui), so it only loads when Storybook
// runs locally. The published Storybook on GitHub Pages stays free of a workspace that can't connect.
if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  import('../src/stories/StoryUI/manager');
}
