import { useEffect, useRef, useState, type AnchorHTMLAttributes, type ComponentPropsWithRef, type ReactNode } from 'react';
import { Badge } from '../Badge/Badge';
import { BagIcon, ChevronDownIcon, ChevronRightIcon, CloseIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '../../icons';
import './Navigation.css';

/* ---------- Logo ---------- */

export interface LogoProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Figma: Show descriptor */
  showDescriptor?: boolean;
}

/** Figma: Logo */
export function Logo({ showDescriptor = true, href = '/', className, ...rest }: LogoProps) {
  return (
    <a href={href} className={['nds-logo', className].filter(Boolean).join(' ')} aria-label="Natural Goods — home" {...rest}>
      <span className="nds-logo__wordmark">natural</span>
      {showDescriptor && <span className="nds-logo__descriptor">goods</span>}
    </a>
  );
}

/* ---------- Nav Link ---------- */

export type NavForcedState = 'hover' | 'pressed' | 'focus';

export interface NavLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Figma: State=Active. Sets aria-current="page". */
  active?: boolean;
  /** Figma: Has menu (shows a chevron). */
  hasMenu?: boolean;
  forceState?: Exclude<NavForcedState, 'pressed'>;
  children: ReactNode;
}

/** Figma: Nav Link */
export function NavLink({ active, hasMenu, forceState, className, children, ...rest }: NavLinkProps) {
  return (
    <a
      className={['nds-nav-link', className].filter(Boolean).join(' ')}
      aria-current={active ? 'page' : undefined}
      data-state={forceState}
      {...rest}
    >
      {children}
      {hasMenu && <ChevronDownIcon className="nds-nav-link__chevron" />}
    </a>
  );
}

/* ---------- Icon Button ---------- */

export interface IconButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** Accessible name, e.g. "Search". The count is appended automatically. */
  label: string;
  /** Figma: Icon */
  icon: ReactNode;
  /** Figma: Show count. Rendered with the Badge component. */
  count?: number;
  forceState?: NavForcedState;
}

/** Figma: Icon Button */
export function IconButton({ label, icon, count, forceState, className, type = 'button', ...rest }: IconButtonProps) {
  const hasCount = typeof count === 'number' && count > 0;
  return (
    <button
      type={type}
      className={['nds-icon-button', className].filter(Boolean).join(' ')}
      aria-label={hasCount ? `${label}, ${count} ${count === 1 ? 'item' : 'items'}` : label}
      data-state={forceState}
      {...rest}
    >
      {icon}
      {hasCount && (
        <Badge tone="dark" className="nds-icon-button__count" aria-hidden="true">
          {count}
        </Badge>
      )}
    </button>
  );
}

/* ---------- Menu Item (mobile) ---------- */

export interface MenuItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
  /** Figma: Has submenu */
  hasSubmenu?: boolean;
  forceState?: Exclude<NavForcedState, 'pressed'>;
  children: ReactNode;
}

/** Figma: Menu Item */
export function MenuItem({ active, hasSubmenu = false, forceState, className, children, ...rest }: MenuItemProps) {
  return (
    <a
      className={['nds-menu-item', className].filter(Boolean).join(' ')}
      aria-current={active ? 'page' : undefined}
      data-state={forceState}
      {...rest}
    >
      <span className="nds-menu-item__label">{children}</span>
      {hasSubmenu && <ChevronRightIcon />}
    </a>
  );
}

/* ---------- Navigation Menu ---------- */

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  hasMenu?: boolean;
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: 'Shop', href: '#shop', active: true, hasMenu: true },
  { label: 'New Arrivals', href: '#new' },
  { label: 'Collections', href: '#collections', hasMenu: true },
  { label: 'Journal', href: '#journal' },
  { label: 'About', href: '#about' },
];

export const DEFAULT_ACCOUNT_ITEMS: NavItem[] = [
  { label: 'Account', href: '#account' },
  { label: 'Wishlist', href: '#wishlist' },
  { label: 'Help & contact', href: '#help' },
];

export interface NavigationMenuProps {
  items?: NavItem[];
  accountItems?: NavItem[];
  /** Figma: Announcement. Pass false to hide (Show announcement = false). */
  announcement?: string | false;
  bagCount?: number;
  onSearch?: () => void;
  onBag?: () => void;
  className?: string;
}

/**
 * Figma: Navigation Menu. Switches to the Mobile breakpoint when its own width is under 768px
 * (container query), so it adapts to wherever it's placed.
 */
export function NavigationMenu({
  items = DEFAULT_NAV_ITEMS,
  accountItems = DEFAULT_ACCOUNT_ITEMS,
  announcement = 'Free shipping on orders over $75',
  bagCount,
  onSearch,
  onBag,
  className,
}: NavigationMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  return (
    <header className={['nds-nav', className].filter(Boolean).join(' ')}>
      {announcement && <p className="nds-nav__announcement">{announcement}</p>}
      <div className="nds-nav__bar">
        <div className="nds-nav__leading">
          <IconButton ref={menuButton} label="Menu" icon={<MenuIcon />} aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)} />
          <IconButton label="Search" icon={<SearchIcon />} onClick={onSearch} />
        </div>
        <Logo className="nds-nav__logo" />
        <nav className="nds-nav__links" aria-label="Main">
          <ul>
            {items.map((item) => (
              <li key={item.label}>
                <NavLink href={item.href} active={item.active} hasMenu={item.hasMenu}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="nds-nav__actions">
          <IconButton className="nds-nav__desktop-only" label="Search" icon={<SearchIcon />} onClick={onSearch} />
          <IconButton className="nds-nav__desktop-only" label="Account" icon={<UserIcon />} />
          <IconButton label="Wishlist" icon={<HeartIcon />} />
          <IconButton label="Bag" icon={<BagIcon />} count={bagCount} onClick={onBag} />
        </div>
      </div>
      <MobileMenu
        open={menuOpen}
        onClose={() => {
          setMenuOpen(false);
          menuButton.current?.focus();
        }}
        items={items}
        accountItems={accountItems}
        bagCount={bagCount}
      />
    </header>
  );
}

/* ---------- Mobile Menu ---------- */

export interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  items?: NavItem[];
  accountItems?: NavItem[];
  bagCount?: number;
  /** Renders inline instead of as a modal dialog (documentation only). */
  inline?: boolean;
}

/** Figma: Mobile Menu. A modal <dialog>: focus is trapped and Escape closes it. */
export function MobileMenu({ open, onClose, items = DEFAULT_NAV_ITEMS, accountItems = DEFAULT_ACCOUNT_ITEMS, bagCount, inline }: MobileMenuProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || inline) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open, inline]);

  const content = (
    <>
      <div className="nds-mobile-menu__bar">
        <IconButton label="Close menu" icon={<CloseIcon />} onClick={onClose} />
        <Logo showDescriptor={false} />
        <IconButton label="Bag" icon={<BagIcon />} count={bagCount} />
      </div>
      <nav className="nds-mobile-menu__list" aria-label="Main">
        {items.map((item) => (
          <MenuItem key={item.label} href={item.href} active={item.active} hasSubmenu={item.hasMenu}>{item.label}</MenuItem>
        ))}
      </nav>
      <nav className="nds-mobile-menu__list nds-mobile-menu__list--account" aria-label="Account">
        {accountItems.map((item) => (
          <MenuItem key={item.label} href={item.href}>{item.label}</MenuItem>
        ))}
      </nav>
    </>
  );

  if (inline) return <div className="nds-mobile-menu nds-mobile-menu--inline" role="group" aria-label="Menu">{content}</div>;
  return (
    <dialog ref={ref} className="nds-mobile-menu" aria-label="Menu" onClose={onClose}>
      {content}
    </dialog>
  );
}
