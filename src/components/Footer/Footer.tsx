import { useId, useState, type AnchorHTMLAttributes } from 'react';
import { Logo } from '../Logo/Logo';
import { ChevronDownIcon } from '../../icons';
import './Footer.css';

/* ---------- Footer Link ---------- */

export type FooterLinkSize = 'default' | 'small';
export type FooterLinkForcedState = 'hover' | 'focus';

export interface FooterLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Figma: Size = Default (link columns, 14/20) or Small (legal row, 12/16). */
  size?: FooterLinkSize;
  forceState?: FooterLinkForcedState;
}

/** Figma: Footer Link. Hover adds an underline, so the state never relies on colour alone. */
export function FooterLink({ size = 'default', forceState, className, ...rest }: FooterLinkProps) {
  return (
    <a
      className={['nds-footer-link', className].filter(Boolean).join(' ')}
      data-size={size}
      data-state={forceState}
      {...rest}
    />
  );
}

/* ---------- Footer Column ---------- */

export interface FooterLinkItem {
  label: string;
  href: string;
}

export interface FooterColumnProps {
  /** Figma: Title. An h2 in the page outline. */
  title: string;
  /** Figma: Link 1–5. */
  links: FooterLinkItem[];
  /** Mobile only: start expanded (Figma: Mode=Expanded). */
  defaultOpen?: boolean;
}

/**
 * Figma: Footer Column. A labelled nav: heading plus a list of Footer Links.
 * Mode=Static at 768px and wider. Below, the heading becomes a disclosure button
 * (Mode=Collapsed / Expanded) so the footer stays short; links in a closed section are
 * hidden from keyboard and screen readers. Only one of the two headings is ever rendered visible.
 */
export function FooterColumn({ title, links, defaultOpen = false }: FooterColumnProps) {
  const [open, setOpen] = useState(defaultOpen);
  const listId = useId();
  return (
    <nav className="nds-footer-column" aria-label={title} data-open={open || undefined}>
      <h2 className="nds-footer-column__title">{title}</h2>
      <h2 className="nds-footer-column__toggle-heading">
        <button type="button" className="nds-footer-column__toggle" aria-expanded={open} aria-controls={listId} onClick={() => setOpen((o) => !o)}>
          {title}
          <ChevronDownIcon className="nds-footer-column__chevron" />
        </button>
      </h2>
      <ul id={listId} className="nds-footer-column__links">
        {links.map((l) => (
          <li key={l.href}><FooterLink href={l.href}>{l.label}</FooterLink></li>
        ))}
      </ul>
    </nav>
  );
}

/* ---------- Footer ---------- */

export const DEFAULT_FOOTER_COLUMNS: FooterColumnProps[] = [
  { title: 'Shop', links: [
    { label: 'Furniture', href: '/collections/furniture' },
    { label: 'Tableware', href: '/collections/tableware' },
    { label: 'Lighting', href: '/collections/lighting' },
    { label: 'Textiles', href: '/collections/textiles' },
    { label: 'Gift cards', href: '/gift-cards' },
  ] },
  { title: 'About', links: [
    { label: 'Our makers', href: '/makers' },
    { label: 'Materials', href: '/materials' },
    { label: 'Journal', href: '/journal' },
    { label: 'Sustainability', href: '/sustainability' },
    { label: 'Visit the workshop', href: '/workshop' },
  ] },
  { title: 'Help', links: [
    { label: 'Shipping & delivery', href: '/help/shipping' },
    { label: 'Returns & exchanges', href: '/help/returns' },
    { label: 'Care guides', href: '/help/care' },
    { label: 'FAQ', href: '/help/faq' },
    { label: 'Contact us', href: '/contact' },
  ] },
];

export const DEFAULT_LEGAL_LINKS: FooterLinkItem[] = [
  { label: 'Privacy policy', href: '/legal/privacy' },
  { label: 'Terms of service', href: '/legal/terms' },
  { label: 'Accessibility', href: '/accessibility' },
];

export interface FooterProps {
  /** Figma: the three Footer Columns (Shop, About, Help). */
  columns?: FooterColumnProps[];
  legalLinks?: FooterLinkItem[];
  /** Figma: Copyright. Defaults to "© {current year} Natural. All rights reserved." */
  copyright?: string;
  className?: string;
}

/**
 * Figma: Footer. Three link columns, then the Logo, copyright and legal links below a divider.
 * Columns share the row at 768px and wider (4 of 12 each) and stack below (container query).
 */
export function Footer({ columns = DEFAULT_FOOTER_COLUMNS, legalLinks = DEFAULT_LEGAL_LINKS, copyright, className }: FooterProps) {
  const text = copyright ?? `© ${new Date().getFullYear()} Natural. All rights reserved.`;
  return (
    <footer className={['nds-footer', className].filter(Boolean).join(' ')}>
      <div className="nds-footer__inner">
        <div className="nds-footer__columns">
          {columns.map((c) => <FooterColumn key={c.title} {...c} />)}
        </div>
        <div className="nds-footer__bottom">
          <div className="nds-footer__brand">
            <Logo />
            <p className="nds-footer__copyright">{text}</p>
          </div>
          <nav aria-label="Legal">
            <ul className="nds-footer__legal">
              {legalLinks.map((l) => (
                <li key={l.href}><FooterLink size="small" href={l.href}>{l.label}</FooterLink></li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
