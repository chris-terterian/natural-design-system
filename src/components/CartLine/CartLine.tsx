import { ImagePlaceholderIcon } from '../../icons';
import { TextButton } from '../TextButton/TextButton';
import './CartLine.css';

export interface CartLineProps {
  /** Figma: Title. Links to the product. */
  title: string;
  href: string;
  /** Figma: SKU, shown as "SKU {sku}". */
  sku: string;
  /** Figma: Price (the line total as shown). */
  price: string;
  /** Figma: Status=Sale. The original price, struck through. */
  comparePrice?: string;
  imageSrc?: string;
  /** Material first; "" if decorative. Required with imageSrc. */
  imageAlt?: string;
  onRemove?: () => void;
  className?: string;
}

/**
 * Figma: Cart Line. One product in the bag, as an <li> (put lines in a <ul>). Image, title link
 * and SKU on the left; price and a Remove Text Button on the right. The compact (Figma Mobile) sizes
 * apply when the line itself is narrower than 480px, since a cart line always sits in a column.
 */
export function CartLine({ title, href, sku, price, comparePrice, imageSrc, imageAlt = '', onRemove, className }: CartLineProps) {
  return (
    <li className={['nds-cart-line', className].filter(Boolean).join(' ')} data-status={comparePrice ? 'sale' : undefined}>
      <div className="nds-cart-line__inner">
        <div className="nds-cart-line__media">
          {imageSrc ? <img src={imageSrc} alt={imageAlt} /> : <ImagePlaceholderIcon className="nds-cart-line__placeholder" />}
        </div>
        <div className="nds-cart-line__info">
          <a className="nds-cart-line__title" href={href}>{title}</a>
          <p className="nds-cart-line__sku">SKU {sku}</p>
        </div>
        <div className="nds-cart-line__side">
          <p className="nds-cart-line__price">
            {comparePrice ? (
              <>
                <span className="nds-visually-hidden">Sale price </span>
                <span className="nds-cart-line__price-value">{price}</span>{' '}
                <s className="nds-cart-line__compare"><span className="nds-visually-hidden">was </span>{comparePrice}</s>
              </>
            ) : (
              <span className="nds-cart-line__price-value">{price}</span>
            )}
          </p>
          <TextButton aria-label={`Remove ${title}`} onClick={onRemove}>Remove</TextButton>
        </div>
      </div>
    </li>
  );
}
