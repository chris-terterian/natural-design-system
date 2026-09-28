import { useId } from 'react';
import { ProductCard, type ProductCardProps } from '../ProductCard/ProductCard';
import { NavLink } from '../Navigation/Navigation';
import { Heading } from '../Typography/Typography';
import './ProductRow.css';

export interface ProductRowProps {
  /** Figma: Title */
  title: string;
  /** Figma: Show view all. Omit to hide the link. */
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Figma: the four nested Product Cards */
  products: ProductCardProps[];
  className?: string;
}

/**
 * Figma: Product Row. 4 columns when the row is 768px or wider, 2 per row below
 * (container query, so it adapts to wherever it's placed). Cards fill their column.
 */
export function ProductRow({ title, viewAllHref, viewAllLabel = 'View all', products, className }: ProductRowProps) {
  const headingId = useId();
  return (
    <section className={['nds-product-row', className].filter(Boolean).join(' ')} aria-labelledby={headingId}>
      <div className="nds-product-row__inner">
      <div className="nds-product-row__header">
        <Heading level={2} size="h3" id={headingId} className="nds-product-row__title">{title}</Heading>
        {viewAllHref && <NavLink href={viewAllHref}>{viewAllLabel}</NavLink>}
      </div>
      <ul className="nds-product-row__grid">
        {products.map((product) => (
          <li key={product.href}>
            <ProductCard {...product} />
          </li>
        ))}
      </ul>
      </div>
    </section>
  );
}
