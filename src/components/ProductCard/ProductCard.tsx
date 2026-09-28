import type { ReactNode } from 'react';
import { Badge, type BadgeTone } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { WishlistButton } from '../WishlistButton/WishlistButton';
import { ImagePlaceholderIcon } from '../../icons';
import './ProductCard.css';

export type ProductCardStatus = 'default' | 'sale' | 'sold-out';
export type ProductCardForcedState = 'hover' | 'focus';

export interface ProductCardProps {
  /** Figma: Title */
  title: string;
  /** Figma: Meta */
  meta?: string;
  /** Figma: Price */
  price: string;
  /** Figma: Compare price (shown when status = sale) */
  comparePrice?: string;
  /** Figma: Status */
  status?: ProductCardStatus;
  href: string;
  /** Figma: Image. Falls back to the placeholder. */
  imageSrc?: string;
  imageAlt?: string;
  /** Figma: Show badge + nested Badge Label. Defaults to New / Sale / Sold out by status. */
  badge?: string | false;
  /** Figma: nested Badge Tone. Defaults to dark / sale / outline by status. */
  badgeTone?: BadgeTone;
  /** Figma: Show wishlist */
  showWishlist?: boolean;
  wishlisted?: boolean;
  onWishlistChange?: (selected: boolean) => void;
  /** Figma: Show CTA */
  showCta?: boolean;
  onAddToCart?: () => void;
  onNotify?: () => void;
  forceState?: ProductCardForcedState;
  className?: string;
  children?: ReactNode;
}

const DEFAULT_BADGE: Record<ProductCardStatus, { label: string; tone: BadgeTone }> = {
  default: { label: 'New', tone: 'dark' },
  sale: { label: 'Sale', tone: 'sale' },
  'sold-out': { label: 'Sold out', tone: 'outline' },
};

/** Figma: Product Card */
export function ProductCard({
  title,
  meta,
  price,
  comparePrice,
  status = 'default',
  href,
  imageSrc,
  imageAlt = '',
  badge,
  badgeTone,
  showWishlist = true,
  wishlisted,
  onWishlistChange,
  showCta = true,
  onAddToCart,
  onNotify,
  forceState,
  className,
}: ProductCardProps) {
  const badgeText = badge === false ? null : (badge ?? DEFAULT_BADGE[status].label);
  const soldOut = status === 'sold-out';
  return (
    <article className={['nds-card', className].filter(Boolean).join(' ')} data-status={status} data-state={forceState}>
      <div className="nds-card__media">
        {imageSrc ? (
          <img className="nds-card__image" src={imageSrc} alt={imageAlt} />
        ) : (
          <div className="nds-card__image nds-card__placeholder"><ImagePlaceholderIcon /></div>
        )}
        {badgeText && <Badge className="nds-card__badge" tone={badgeTone ?? DEFAULT_BADGE[status].tone}>{badgeText}</Badge>}
        {showWishlist && (
          <WishlistButton className="nds-card__wishlist" productName={title} selected={wishlisted} onChange={onWishlistChange} />
        )}
      </div>
      <div className="nds-card__info">
        <h3 className="nds-card__title">
          <a className="nds-card__link" href={href}>{title}</a>
        </h3>
        {meta && <p className="nds-card__meta">{meta}</p>}
        <p className="nds-card__price">
          {status === 'sale' && comparePrice ? (
            <>
              <span className="nds-visually-hidden">Sale price</span>
              <span className="nds-card__price-current">{price}</span>
              <span className="nds-visually-hidden">Original price</span>
              <s className="nds-card__price-compare">{comparePrice}</s>
            </>
          ) : (
            <span className="nds-card__price-current">{price}</span>
          )}
        </p>
      </div>
      {showCta &&
        (soldOut ? (
          <Button variant="secondary" fullWidth className="nds-card__cta" onClick={onNotify}>Notify me</Button>
        ) : (
          <Button fullWidth className="nds-card__cta" onClick={onAddToCart}>Add to Bag</Button>
        ))}
    </article>
  );
}
