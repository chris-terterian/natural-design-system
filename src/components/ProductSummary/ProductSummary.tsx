import { useId } from 'react';
import { Badge, type BadgeTone } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Price } from '../Price/Price';
import { Radio, RadioGroup } from '../Radio/Radio';
import { WishlistButton } from '../WishlistButton/WishlistButton';
import { Heading, Text } from '../Typography/Typography';
import './ProductSummary.css';

export type ProductSummaryStatus = 'default' | 'sale' | 'sold-out';

export interface ProductSummaryOption {
  value: string;
  label: string;
  description?: string;
}

export interface ProductSummaryProps {
  /** Figma: Title. Material-led and simple: "River Clay Cup". Rendered as the page's H1. */
  title: string;
  /** Figma: Story. One line on where it came from and how it was made. */
  story?: string;
  /** Figma: Price */
  price: string;
  /** Figma: Compare price (shown when status = sale) */
  comparePrice?: string;
  /** Figma: Status. Sold out swaps Add to Bag for Notify me. */
  status?: ProductSummaryStatus;
  /** Figma: Show badge + nested Badge Label: Handmade, One of a kind, New… Sale and Sold out come from the status. */
  badge?: string | false;
  badgeTone?: BadgeTone;
  /** Figma: Show options. A Radio Group for finish, glaze or size. */
  optionsLegend?: string;
  options?: ProductSummaryOption[];
  optionValue?: string;
  onOptionChange?: (value: string) => void;
  /** Figma: Lead time. "Made to order · ships in {n} weeks" beside the price. */
  madeToOrderWeeks?: number;
  /** Figma: Show freight. "Ships by freight" for large pieces. */
  freight?: boolean;
  onAddToBag?: () => void;
  onNotify?: () => void;
  /** Add to Bag in progress: the Button's Loading state. */
  adding?: boolean;
  wishlisted?: boolean;
  onWishlistChange?: (selected: boolean) => void;
  className?: string;
}

const STATUS_BADGE: Partial<Record<ProductSummaryStatus, { label: string; tone: BadgeTone }>> = {
  sale: { label: 'Sale', tone: 'sale' },
  'sold-out': { label: 'Sold out', tone: 'outline' },
};

/**
 * Figma: Product Summary. The buying column of a product page: badge, name (H1), one-line story,
 * price, options, lead time and Add to Bag with the wishlist beside it.
 */
export function ProductSummary({
  title,
  story,
  price,
  comparePrice,
  status = 'default',
  badge,
  badgeTone,
  optionsLegend = 'Finish',
  options,
  optionValue,
  onOptionChange,
  madeToOrderWeeks,
  freight = false,
  onAddToBag,
  onNotify,
  adding = false,
  wishlisted,
  onWishlistChange,
  className,
}: ProductSummaryProps) {
  const priceId = useId();
  const statusBadge = STATUS_BADGE[status];
  const badgeLabel = badge === false ? null : badge ?? statusBadge?.label ?? null;
  const tone = badgeTone ?? (badge ? 'light' : statusBadge?.tone ?? 'dark');
  const soldOut = status === 'sold-out';
  const notes = [madeToOrderWeeks ? `Made to order · ships in ${madeToOrderWeeks} weeks` : null, freight ? 'Ships by freight' : null].filter(Boolean) as string[];

  return (
    <div className={['nds-summary', className].filter(Boolean).join(' ')} data-status={status}>
      {badgeLabel && <Badge tone={tone} className="nds-summary__badge">{badgeLabel}</Badge>}
      <Heading level={1} size="h2" className="nds-summary__title">{title}</Heading>
      {story && <Text variant="paragraph-lg" className="nds-summary__story">{story}</Text>}

      <Price id={priceId} size="large" price={price} comparePrice={comparePrice} sale={status === 'sale'} />
      {notes.length > 0 && (
        <ul className="nds-summary__notes">
          {notes.map((n) => <li key={n}>{n}</li>)}
        </ul>
      )}

      {options && options.length > 0 && !soldOut && (
        <RadioGroup legend={optionsLegend} value={optionValue ?? options[0].value} onChange={onOptionChange} className="nds-summary__options">
          {options.map((o) => <Radio key={o.value} value={o.value} label={o.label} description={o.description} />)}
        </RadioGroup>
      )}

      <div className="nds-summary__actions">
        {soldOut ? (
          <Button variant="secondary" fullWidth onClick={onNotify} aria-describedby={priceId}>Notify me</Button>
        ) : (
          <Button fullWidth loading={adding} onClick={onAddToBag} aria-describedby={priceId}>Add to Bag</Button>
        )}
        <WishlistButton className="nds-summary__wishlist" productName={title} selected={wishlisted} onChange={onWishlistChange} />
      </div>
    </div>
  );
}
