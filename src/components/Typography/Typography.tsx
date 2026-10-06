import type { HTMLAttributes, ReactNode } from 'react';
import './Typography.css';

export type HeadingSize = 'h1' | 'h2' | 'h3' | 'h4';
export type TextVariant = 'paragraph-lg' | 'paragraph' | 'paragraph-sm' | 'caption';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Semantic level for the document outline (h1–h6). */
  level: 1 | 2 | 3 | 4 | 5 | 6;
  /** Figma text style Heading/H1–H4. Defaults to the matching level (h5/h6 use H4). */
  size?: HeadingSize;
  children: ReactNode;
}

/** Figma: Heading/H1 … Heading/H4. Size follows the Typography mode (desktop / mobile). */
export function Heading({ level, size, className, children, ...rest }: HeadingProps) {
  const Tag = `h${level}` as const;
  const visual = size ?? (level <= 4 ? (`h${level}` as HeadingSize) : 'h4');
  return (
    <Tag className={['nds-heading', `nds-${visual}`, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Tag>
  );
}

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /** Figma text style Paragraph/Large, Paragraph/Default, Paragraph/Small or Caption. */
  variant?: TextVariant;
  /** Secondary colour (fg/muted). Default for Paragraph/Small and Caption. */
  muted?: boolean;
  /** Rendered element: p (default), span, div or figcaption. */
  as?: 'p' | 'span' | 'div' | 'figcaption';
  children: ReactNode;
}

/** Figma: Paragraph/* and Caption. Paragraphs cap at the reading measure (text/measure). */
export function Text({ variant = 'paragraph', muted, as: Tag = 'p', className, children, ...rest }: TextProps) {
  const isMuted = muted ?? (variant === 'paragraph-sm' || variant === 'caption');
  return (
    <Tag className={['nds-text', `nds-${variant}`, isMuted && 'nds-text--muted', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </Tag>
  );
}
