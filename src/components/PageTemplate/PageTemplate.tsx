import { Fragment, useEffect, type ReactNode } from 'react';
import contractJson from '../../../governance/templates.json';
import { validateComposition, type Composition, type ContractIssue, type Section, type TemplateContract, type TemplateId } from '../../templates/contract.mjs';
import { Button } from '../Button/Button';
import { Footer, type FooterProps } from '../Footer/Footer';
import { ImageBlock } from '../ImageBlock/ImageBlock';
import { NavigationMenu, type NavigationMenuProps } from '../Navigation/Navigation';
import { ProductDetails, type ProductDetailsProps } from '../ProductDetails/ProductDetails';
import { ProductGallery, type ProductGalleryProps } from '../ProductGallery/ProductGallery';
import { ProductRow, type ProductRowProps } from '../ProductRow/ProductRow';
import { ProductSummary, type ProductSummaryProps } from '../ProductSummary/ProductSummary';
import { RangeSlider } from '../Slider/Slider';
import { Toggle } from '../Toggle/Toggle';
import { Heading, Text } from '../Typography/Typography';
import './PageTemplate.css';

/** The template and slot contracts (governance/templates.json, D-038). */
export const TEMPLATE_CONTRACT = contractJson as unknown as TemplateContract;
export { validateComposition };
export type { Composition, ContractIssue, Section, TemplateId };

export interface HeroSectionProps { heading: string; text?: string; alt: string; src?: string; actionLabel?: string; onAction?: () => void }
export interface IntroSectionProps { heading: string; text?: string }
export interface BannerSectionProps { alt: string; src?: string }
export interface StorySectionProps { heading: string; text: string; alt: string; src?: string; actionLabel?: string; onAction?: () => void }
export interface FiltersSectionProps { count: number; priceMax?: number }
export interface LoadMoreSectionProps { shown: number; total: number; step?: number; onMore?: () => void }

export interface PageTemplateProps {
  /** The page as data: a template id and the sections in each slot. Checked against the contract before it renders. */
  composition: Composition;
  /** Called with the contract errors when the composition is rejected. */
  onRejected?: (errors: ContractIssue[]) => void;
  className?: string;
}

const pad = (children: ReactNode, extra = '') => <div className={['nds-template__pad', extra].filter(Boolean).join(' ')}>{children}</div>;

function renderSection(section: Section, key: string): ReactNode {
  const p = (section.props ?? {}) as Record<string, unknown>;
  switch (section.kind) {
    case 'navigation':
      return <NavigationMenu key={key} {...(p as NavigationMenuProps)} />;
    case 'hero': {
      const h = p as unknown as HeroSectionProps;
      return (
        <section key={key} className="nds-template__hero" aria-label={h.heading}>
          <ImageBlock type="hero" src={h.src} alt={h.alt} />
          {pad(
            <>
              <Heading level={1}>{h.heading}</Heading>
              {h.text && <Text variant="paragraph-lg">{h.text}</Text>}
              {h.actionLabel && <Button onClick={h.onAction}>{h.actionLabel}</Button>}
            </>,
            'nds-template__intro',
          )}
        </section>
      );
    }
    case 'intro': {
      const i = p as unknown as IntroSectionProps;
      return <Fragment key={key}>{pad(<><Heading level={1}>{i.heading}</Heading>{i.text && <Text variant="paragraph-lg">{i.text}</Text>}</>, 'nds-template__intro')}</Fragment>;
    }
    case 'banner': {
      const b = p as unknown as BannerSectionProps;
      return <ImageBlock key={key} type="banner" src={b.src} alt={b.alt} />;
    }
    case 'product-row':
      return (
        <div key={key} data-source={section.source} data-fallback={section.usedFallback || undefined}>
          <ProductRow {...(p as unknown as ProductRowProps)} />
        </div>
      );
    case 'story': {
      const s = p as unknown as StorySectionProps;
      return (
        <ImageBlock key={key} type="half" src={s.src} alt={s.alt}>
          <Heading level={2}>{s.heading}</Heading>
          <Text>{s.text}</Text>
          {s.actionLabel && <Button variant="secondary" onClick={s.onAction}>{s.actionLabel}</Button>}
        </ImageBlock>
      );
    }
    case 'filters': {
      const f = p as unknown as FiltersSectionProps;
      const max = f.priceMax ?? 600;
      return (
        <Fragment key={key}>
          {pad(
            <>
              <div className="nds-template__filter-controls">
                <RangeSlider label="Price ($)" min={0} max={max} step={10} defaultValue={[0, max]} formatValue={(v) => `$${v}`} />
                <Toggle label="In stock only" />
              </div>
              <Text variant="paragraph-sm" muted>{f.count} pieces</Text>
            </>,
            'nds-template__filters',
          )}
        </Fragment>
      );
    }
    case 'load-more': {
      const l = p as unknown as LoadMoreSectionProps;
      const next = Math.min(l.step ?? 8, l.total - l.shown);
      return (
        <Fragment key={key}>
          {pad(
            <>
              <Text variant="paragraph-sm" muted>Showing {l.shown} of {l.total} pieces</Text>
              {next > 0 && <Button variant="secondary" onClick={l.onMore}>Show {next} more</Button>}
            </>,
            'nds-template__more',
          )}
        </Fragment>
      );
    }
    case 'product-gallery':
      return <ProductGallery key={key} {...(p as unknown as ProductGalleryProps)} />;
    case 'product-summary':
      return <ProductSummary key={key} {...(p as unknown as ProductSummaryProps)} />;
    case 'product-details':
      return <Fragment key={key}>{pad(<ProductDetails {...(p as unknown as ProductDetailsProps)} />, 'nds-template__details')}</Fragment>;
    case 'footer':
      return <Footer key={key} {...(p as FooterProps)} />;
    default:
      return null;
  }
}

/**
 * Figma: Page Template. Renders a page from a composition, but only after it passes the template's
 * slot contract (governance/templates.json). Header and footer slots sit outside <main>; the product
 * page's media and summary slots share a row at 768px and wider.
 */
export function PageTemplate({ composition, onRejected, className }: PageTemplateProps) {
  const contract = TEMPLATE_CONTRACT;
  const result = validateComposition(contract, composition);
  const template = contract.templates[composition.template];
  const rejected = !result.valid;
  useEffect(() => {
    if (rejected) onRejected?.(result.errors);
  }, [rejected]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!result.valid || !result.resolved) {
    return (
      <div className={['nds-template-rejected', className].filter(Boolean).join(' ')} role="alert">
        <Heading level={2} size="h3">This page doesn't meet the {template?.name ?? composition.template} contract</Heading>
        <Text>Nothing renders until these are fixed:</Text>
        <ul className="nds-template-rejected__list">
          {result.errors.map((e, i) => (
            <li key={i}>
              {e.slot && <span className="nds-template-rejected__slot">{e.slot}</span>}
              {e.message}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const slots = result.resolved.slots as Record<string, Section[]>;
  const out: { header: ReactNode[]; main: ReactNode[]; footer: ReactNode[] } = { header: [], main: [], footer: [] };
  let split: ReactNode[] = [];
  for (const slot of template.slots) {
    const nodes = (slots[slot.id] ?? []).map((s, i) => renderSection(s, `${slot.id}-${i}`));
    if (slot.id === 'header') out.header.push(...nodes);
    else if (slot.id === 'footer') out.footer.push(...nodes);
    else if (slot.layout === 'split-start') split = [<div key={slot.id} className="nds-template__split-start">{nodes}</div>];
    else if (slot.layout === 'split-end') {
      out.main.push(<div key="split" className="nds-template__pad nds-template__split">{split}<div className="nds-template__split-end">{nodes}</div></div>);
      split = [];
    } else out.main.push(...nodes);
  }

  return (
    <div className={['nds-template', className].filter(Boolean).join(' ')} data-template={composition.template}>
      {out.header}
      <main className="nds-template__main">{out.main}</main>
      {out.footer}
    </div>
  );
}
