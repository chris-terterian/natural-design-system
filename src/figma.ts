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
  navigationMenu: '61:134',
  mobileMenu: '83:571',
  navDropdown: '83:510',
  navGroup: '83:97',
  navLink: '60:88',
  iconButton: '60:69',
  menuItem: '60:107',
  logo: '153:822',
  spinner: '64:50',
  toggle: '67:360',
  productRow: '73:210',
  typography: '76:5',
  calendar: '196:580',
  calendarDay: '195:65',
  imageBlock: '212:29',
  footer: '221:136',
  footerLink: '221:16',
  footerColumn: '223:116',
  slider: '239:2732',
  sliderThumb: '239:655',
  sliderInput: '239:665',
  rangeSlider: '242:722',
  textButton: '245:658',
  cartLine: '245:707',
} as const;
