// Example output of the checkpointed build_page workflow (npm run mcp:demo). Composes Natural components only.
import { Heading, NavLink, ProductCard, Text } from 'natural-design-system';
import './GiftGuide.css';

const PICKS = [
  { title: 'River Clay Cup', meta: 'Stoneware · ash glaze', price: '$32', comparePrice: '$38', status: 'sale' as const, href: '/products/river-clay-cup', imageAlt: 'River clay cup with a matte grey ash glaze pooling at the base' },
  { title: 'Bud Vase', meta: 'Stoneware · ash glaze', price: '$45', badge: 'New', href: '/products/bud-vase', imageAlt: 'Small stoneware bud vase holding a single dried grass stem' },
  { title: 'Beeswax Taper Pair', meta: 'Beeswax · hand-dipped', price: '$24', badge: 'Handmade', href: '/products/beeswax-tapers', imageAlt: 'Two hand-dipped beeswax tapers with slightly uneven drips' },
];

/** A gift guide section: three picks under $50, built from Heading, Text, ProductCard and NavLink. */
export function GiftGuide() {
  return (
    <section className="nds-gift-guide" aria-labelledby="gift-guide-title">
      <div className="nds-gift-guide__intro">
        <Heading level={2} id="gift-guide-title">Gifts under $50</Heading>
        <Text>Small pieces made slowly: a cup for the first coffee, a vase for one stem, candles that burn clean.</Text>
      </div>
      <ul className="nds-gift-guide__grid">
        {PICKS.map((p) => (
          <li key={p.href}><ProductCard {...p} /></li>
        ))}
      </ul>
      <NavLink href="/collections/gifts-under-50">View all gifts under $50</NavLink>
    </section>
  );
}
