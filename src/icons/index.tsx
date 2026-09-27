import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
  ...props,
});

const HEART =
  'M10 17C10 17 2.5 12.5 2.5 7.25C2.5 4.9 4.3 3 6.6 3C8 3 9.3 3.7 10 4.8C10.7 3.7 12 3 13.4 3C15.7 3 17.5 4.9 17.5 7.25C17.5 12.5 10 17 10 17Z';

export const PlusIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={1.75}><path d="M10 4v12M4 10h12" /></svg>
);
export const ArrowRightIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={1.75}><path d="M4 10h12M11 5l5 5-5 5" /></svg>
);
export const AlertIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={1.5}><circle cx="10" cy="10" r="7.5" /><path d="M10 6.5v4M10 13.5v.1" strokeWidth={1.75} /></svg>
);
export const CheckCircleIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={1.5}><circle cx="10" cy="10" r="7.5" /><path d="M6.8 10.2 9 12.4l4.2-4.6" strokeWidth={1.75} /></svg>
);
export const HeartIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <svg {...base(p)} strokeWidth={1.5}><path d={HEART} fill={filled ? 'currentColor' : 'none'} /></svg>
);
export const ImagePlaceholderIcon = (p: IconProps) => (
  <svg {...base(p)} width={40} height={34} viewBox="0 0 40 34" strokeWidth={2}>
    <rect x="2" y="2" width="36" height="30" rx="2" />
    <path d="M2 26 13 16l9 8 6-5 10 8" />
    <circle cx="30" cy="11" r="3" />
  </svg>
);
