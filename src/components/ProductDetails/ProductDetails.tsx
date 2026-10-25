import { useId } from 'react';
import { Heading, Text } from '../Typography/Typography';
import './ProductDetails.css';

export interface ProductDetail {
  /** "Material", "Finish", "Dimensions", "Weight", "Capacity" */
  label: string;
  value: string;
}

export interface ProductDetailsProps {
  /** Figma: Details. Material · finish · dimensions · weight · capacity (vessels), in that order. */
  details: ProductDetail[];
  /** Figma: Variation note. Why no two are the same. Celebrate it, never apologise for it. */
  variation?: string;
  /** Figma: Care. How to keep it for decades. */
  care: string;
  /** Figma: Delivery. Lead time for made-to-order, and how large pieces ship. */
  delivery: string;
  /** Heading level for the section titles; 2 on a product page. */
  headingLevel?: 2 | 3;
  className?: string;
}

/** Figma: Product Detail Row. One label and value in the Details list (a <dt> / <dd> pair). */
export function ProductDetailRow({ label, value }: ProductDetail) {
  return (
    <div className="nds-details__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/**
 * Figma: Product Details. The facts below the summary, in the order DESIGN.md §2 sets: details,
 * variation note, care, delivery. Two columns when it's 768px or wider, one below.
 */
export function ProductDetails({ details, variation, care, delivery, headingLevel = 2, className }: ProductDetailsProps) {
  const id = useId();
  const blocks = [
    variation ? { key: 'variation', title: 'No two alike', body: variation } : null,
    { key: 'care', title: 'Care', body: care },
    { key: 'delivery', title: 'Delivery', body: delivery },
  ].filter(Boolean) as { key: string; title: string; body: string }[];

  return (
    <section className={['nds-details', className].filter(Boolean).join(' ')} aria-labelledby={`${id}-details`}>
      <div className="nds-details__inner">
        <div className="nds-details__facts">
          <Heading level={headingLevel} size="h4" id={`${id}-details`} className="nds-details__title">Details</Heading>
          <dl className="nds-details__list">
            {details.map((d) => <ProductDetailRow key={d.label} {...d} />)}
          </dl>
        </div>
        <div className="nds-details__notes">
          {blocks.map((b) => (
            <div key={b.key} className="nds-details__block">
              <Heading level={headingLevel} size="h4" className="nds-details__title">{b.title}</Heading>
              <Text>{b.body}</Text>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
