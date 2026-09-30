import type { ImgHTMLAttributes, ReactNode } from 'react';
import { ImagePlaceholderIcon } from '../../icons';
import './ImageBlock.css';

export type ImageBlockType = 'hero' | 'banner' | 'half';

export interface ImageBlockProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'children'> {
  /** Figma: Type = Hero (default), Banner, Half-page. */
  type?: ImageBlockType;
  /** The photo. Without it, the placeholder shows (Figma: Show placeholder). */
  src?: string;
  /** Required. Material first: "Split oak bench on a stone floor". Use "" for a purely decorative image. */
  alt: string;
  /** Half-page only: the copy beside the image (below it on mobile). */
  children?: ReactNode;
}

/**
 * Figma: Image Block. Full-bleed site imagery. Heights follow the breakpoint of the block's own
 * width (container query at 768px). Photos crop to cover, so keep the subject centred.
 * Half-page sits beside its copy on desktop and goes full width above it on mobile.
 */
export function ImageBlock({ type = 'hero', src, alt, children, className, loading, ...rest }: ImageBlockProps) {
  return (
    <div className={['nds-image-block', className].filter(Boolean).join(' ')} data-type={type}>
      <div className="nds-image-block__inner">
        <div className="nds-image-block__media">
          {src ? (
            <img className="nds-image-block__img" src={src} alt={alt} loading={loading ?? (type === 'hero' ? 'eager' : 'lazy')} {...rest} />
          ) : (
            <div className="nds-image-block__placeholder" role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}>
              <ImagePlaceholderIcon />
            </div>
          )}
        </div>
        {type === 'half' && children && <div className="nds-image-block__copy">{children}</div>}
      </div>
    </div>
  );
}
