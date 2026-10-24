import { useState } from 'react';
import { ImagePlaceholderIcon } from '../../icons';
import './ProductGallery.css';

export interface ProductGalleryImage {
  /** The photo. Without it, the placeholder shows. */
  src?: string;
  /** Required. Material first: "River clay cup with ash glaze pooling at the base". */
  alt: string;
  /** Short name for the thumbnail button: "Whole piece", "Glaze close-up", "In the hand". */
  label: string;
}

export type ProductGalleryForcedState = 'hover' | 'focus';

export interface ProductGalleryProps {
  /** Figma: the three image slots. DESIGN.md §3.6: the whole piece, a material close-up, scale or use. */
  images: ProductGalleryImage[];
  /** Used in the group's accessible name: "River Clay Cup photos". */
  productName: string;
  /** Figma: Selected. Omit for uncontrolled use. */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Shows the Hover or Focus state on the first unselected thumbnail (Storybook and Figma grids). */
  forceState?: ProductGalleryForcedState;
  className?: string;
}

/**
 * Figma: Product Gallery. One large 4:5 photo with thumbnail buttons that swap it. Thumbnails sit
 * in a column beside the photo when the gallery is 480px or wider and in a row below it when narrower
 * (container query, so it adapts to its slot).
 */
export function ProductGallery({ images, productName, index, defaultIndex = 0, onIndexChange, forceState, className }: ProductGalleryProps) {
  const [inner, setInner] = useState(defaultIndex);
  const current = Math.min(index ?? inner, Math.max(images.length - 1, 0));
  const shown = images[current];
  const select = (i: number) => {
    setInner(i);
    onIndexChange?.(i);
  };
  const forcedIndex = forceState ? images.findIndex((_, i) => i !== current) : -1;

  return (
    <div className={['nds-gallery', className].filter(Boolean).join(' ')} role="group" aria-label={`${productName} photos`}>
      <div className="nds-gallery__inner">
        <div className="nds-gallery__main">
          {shown?.src ? (
            <img className="nds-gallery__image" src={shown.src} alt={shown.alt} />
          ) : (
            <div className="nds-gallery__placeholder" role="img" aria-label={shown?.alt || `${productName}, photo coming soon`}>
              <ImagePlaceholderIcon />
            </div>
          )}
        </div>
        {images.length > 1 && (
          <ul className="nds-gallery__thumbs">
            {images.map((image, i) => (
              <li key={image.label}>
                <button
                  type="button"
                  className="nds-gallery__thumb"
                  aria-pressed={i === current}
                  aria-label={`${image.label}, photo ${i + 1} of ${images.length}`}
                  data-state={i === forcedIndex ? forceState : undefined}
                  onClick={() => select(i)}
                >
                  {image.src ? <img src={image.src} alt="" /> : <ImagePlaceholderIcon />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
