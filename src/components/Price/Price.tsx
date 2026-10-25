import './Price.css';

export type PriceSize = 'default' | 'large';

export interface PriceProps {
  /** Figma: Price. Formatted, e.g. "$32". */
  price: string;
  /** Figma: Compare price. Shown, struck through, only when on sale. */
  comparePrice?: string;
  /** Figma: Status = Sale. The price turns fg/sale; the compare price shows. */
  sale?: boolean;
  /** Figma: Size. Default (cards, bag lines) or Large (product page). */
  size?: PriceSize;
  id?: string;
  className?: string;
}

/**
 * Figma: Price. The current price, and on sale the original price struck through. Screen readers hear
 * "Sale price $32, Original price $38", so the sale never relies on colour or the strikethrough alone.
 * Shared by Product Card, Cart Line and Product Summary.
 */
export function Price({ price, comparePrice, sale = false, size = 'default', id, className }: PriceProps) {
  const showCompare = sale && Boolean(comparePrice);
  return (
    <p id={id} className={['nds-price', className].filter(Boolean).join(' ')} data-size={size} data-sale={sale || undefined}>
      {showCompare && <span className="nds-visually-hidden">Sale price </span>}
      <span className="nds-price__current">{price}</span>
      {showCompare && (
        <>
          <span className="nds-visually-hidden">Original price </span>
          <s className="nds-price__compare">{comparePrice}</s>
        </>
      )}
    </p>
  );
}
