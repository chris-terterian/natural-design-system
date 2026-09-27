/** Links each story to its component in the Figma file "Natural Design System". */
const FILE = 'https://www.figma.com/design/84MjZXozBoKCvf9lwIU5pu/Natural-Design-System';

export const figma = (nodeId: string) => ({
  design: { type: 'figma', url: `${FILE}?node-id=${nodeId.replace(':', '-')}` },
});

export const FIGMA_NODES = {
  button: '1:202',
  input: '1:498',
  radio: '1:637',
  wishlistButton: '1:815',
  productCard: '1:968',
  badge: '2:171',
} as const;
