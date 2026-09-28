import {
  useEffect,
  useId,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ComponentPropsWithRef,
  type ReactNode,
  type Ref,
} from 'react';
import { Badge } from '../Badge/Badge';
import {
  BagIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from '../../icons';
import './Navigation.css';

/* ---------- Data ---------- */

export interface NavLinkItem {
  label: string;
  href: string;
}

/** Figma: Nav Group. A titled list of links inside a dropdown or mobile submenu. */
export interface NavGroupData {
  title: string;
  links: NavLinkItem[];
}

/** Figma: Nav Dropdown content. */
export interface NavMenuData {
  groups: NavGroupData[];
  viewAll?: NavLinkItem;
}

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  /** Opens a dropdown (desktop) and a submenu level (mobile). */
  menu?: NavMenuData;
  /** @deprecated Use `menu`. Shows the chevron without a menu. */
  hasMenu?: boolean;
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    label: 'Shop',
    href: '#shop',
    active: true,
    menu: {
      groups: [
        { title: 'Furniture', links: [{ label: 'Benches', href: '#benches' }, { label: 'Stools', href: '#stools' }, { label: 'Side tables', href: '#side-tables' }, { label: 'Shelves', href: '#shelves' }] },
        { title: 'Kitchen & table', links: [{ label: 'Cups & mugs', href: '#cups' }, { label: 'Bowls', href: '#bowls' }, { label: 'Boards & trays', href: '#boards' }, { label: 'Utensils', href: '#utensils' }] },
        { title: 'Home & living', links: [{ label: 'Baskets', href: '#baskets' }, { label: 'Vessels', href: '#vessels' }, { label: 'Candle holders', href: '#candles' }, { label: 'Throws', href: '#throws' }] },
      ],
      viewAll: { label: 'Shop all', href: '#shop' },
    },
  },
  { label: 'New Arrivals', href: '#new' },
  {
    label: 'Collections',
    href: '#collections',
    menu: {
      groups: [
        { title: 'By material', links: [{ label: 'Clay & ceramics', href: '#clay' }, { label: 'Wood', href: '#wood' }, { label: 'Stone', href: '#stone' }, { label: 'Fibre & rush', href: '#fibre' }] },
        { title: 'Edits', links: [{ label: 'One of a kind', href: '#one-of-a-kind' }, { label: 'Made to order', href: '#made-to-order' }, { label: 'Gifts under $50', href: '#gifts' }] },
      ],
      viewAll: { label: 'All collections', href: '#collections' },
    },
  },
  { label: 'Journal', href: '#journal' },
  { label: 'About', href: '#about' },
];

export const DEFAULT_ACCOUNT_ITEMS: NavItem[] = [
  { label: 'Account', href: '#account' },
  { label: 'Wishlist', href: '#wishlist' },
  { label: 'Help & contact', href: '#help' },
];

/* ---------- Logo ---------- */

export type LogoProps = AnchorHTMLAttributes<HTMLAnchorElement>;

/** Figma: Logo. The Natural wordmark, linking home. */
export function Logo({ href = '/', className, ...rest }: LogoProps) {
  return (
    <a href={href} className={['nds-logo', className].filter(Boolean).join(' ')} aria-label="Natural — home" {...rest}>
      <span className="nds-logo__wordmark">natural</span>
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
  forceState?: Exclude<NavForcedState, 'pressed'> | 'open';
  children: ReactNode;
}

/** Figma: Nav Link (a plain link). For links that open a dropdown, see NavMenuButton. */
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

export interface NavMenuButtonProps extends Omit<ComponentPropsWithRef<'button'>, 'children'> {
  /** Figma: State=Open. */
  expanded: boolean;
  /** id of the Nav Dropdown this button controls. */
  controls: string;
  /** Marks the current section (indicator shows while the menu is closed). */
  active?: boolean;
  forceState?: Exclude<NavForcedState, 'pressed'>;
  children: ReactNode;
}

/**
 * Figma: Nav Link with Has menu. A disclosure button (not an ARIA menu): opens its Nav Dropdown on
 * click / Enter / Space; closes on Escape, click outside, or opening another menu.
 */
export function NavMenuButton({ expanded, controls, active, forceState, className, children, type = 'button', ...rest }: NavMenuButtonProps) {
  return (
    <button
      type={type}
      className={['nds-nav-link', 'nds-nav-link--button', active && 'nds-nav-link--current', className].filter(Boolean).join(' ')}
      aria-expanded={expanded}
      aria-controls={controls}
      data-state={forceState}
      {...rest}
    >
      {children}
      <ChevronDownIcon className="nds-nav-link__chevron" />
    </button>
  );
}

/* ---------- Nav Group & Nav Dropdown ---------- */

/** Figma: Nav Group */
export function NavGroup({ title, links }: NavGroupData) {
  const id = useId();
  return (
    <div className="nds-nav-group">
      <p id={id} className="nds-nav-group__title">{title}</p>
      <ul className="nds-nav-group__links" aria-labelledby={id}>
        {links.map((l) => (
          <li key={l.href}><NavLink href={l.href}>{l.label}</NavLink></li>
        ))}
      </ul>
    </div>
  );
}

export interface NavDropdownProps extends NavMenuData {
  id?: string;
  className?: string;
}

/** Figma: Nav Dropdown. Full-width panel under the header bar. */
export function NavDropdown({ id, groups, viewAll, className }: NavDropdownProps) {
  return (
    <div id={id} className={['nds-nav-dropdown', className].filter(Boolean).join(' ')}>
      <div className="nds-nav-dropdown__groups">
        {groups.map((g) => <NavGroup key={g.title} {...g} />)}
      </div>
      {viewAll && <NavLink className="nds-nav-dropdown__all" href={viewAll.href}>{viewAll.label}</NavLink>}
    </div>
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

interface MenuItemBase {
  active?: boolean;
  forceState?: Exclude<NavForcedState, 'pressed'>;
  children: ReactNode;
  className?: string;
}
export type MenuItemProps =
  | (MenuItemBase & AnchorHTMLAttributes<HTMLAnchorElement> & { hasSubmenu?: false; onOpenSubmenu?: never })
  | (MenuItemBase & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & { hasSubmenu: true; onOpenSubmenu?: () => void; ref?: Ref<HTMLButtonElement> });

/** Figma: Menu Item. With Has submenu it is a button that opens the Submenu level. */
export function MenuItem(props: MenuItemProps) {
  const { active, forceState, className, children } = props;
  const classes = ['nds-menu-item', className].filter(Boolean).join(' ');
  if (props.hasSubmenu) {
    const { hasSubmenu: _h, onOpenSubmenu, active: _a, forceState: _f, className: _c, children: _ch, ...rest } = props;
    return (
      <button type="button" className={classes} data-state={forceState} onClick={onOpenSubmenu} {...rest}>
        <span className="nds-menu-item__label">{children}</span>
        <ChevronRightIcon />
      </button>
    );
  }
  const { hasSubmenu: _h, onOpenSubmenu: _o, active: _a, forceState: _f, className: _c, children: _ch, ...rest } = props;
  return (
    <a className={classes} aria-current={active ? 'page' : undefined} data-state={forceState} {...rest}>
      <span className="nds-menu-item__label">{children}</span>
    </a>
  );
}

/* ---------- Navigation Menu ---------- */

export interface NavigationMenuProps {
  items?: NavItem[];
  accountItems?: NavItem[];
  /** Figma: Announcement. Pass false to hide (Show announcement = false). */
  announcement?: string | false;
  bagCount?: number;
  onSearch?: () => void;
  onBag?: () => void;
  /** Documentation only: open this item's dropdown on first render. */
  defaultOpenMenu?: string;
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
  defaultOpenMenu,
  className,
}: NavigationMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(defaultOpenMenu ?? null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const baseId = useId();
  const dropdownId = (label: string) => `${baseId}-menu-${label.replace(/\W+/g, '-').toLowerCase()}`;

  // Escape closes the open dropdown and returns focus to its button; a click outside closes it.
  useEffect(() => {
    if (!openMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        buttonRefs.current[openMenu]?.focus();
        setOpenMenu(null);
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [openMenu]);

  const open = items.find((i) => i.label === openMenu && i.menu);

  return (
    <header ref={headerRef} className={['nds-nav', className].filter(Boolean).join(' ')}>
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
                {item.menu ? (
                  <NavMenuButton
                    ref={(el) => { buttonRefs.current[item.label] = el; }}
                    expanded={openMenu === item.label}
                    controls={dropdownId(item.label)}
                    active={item.active}
                    onClick={() => setOpenMenu((cur) => (cur === item.label ? null : item.label))}
                  >
                    {item.label}
                  </NavMenuButton>
                ) : (
                  <NavLink href={item.href} active={item.active} hasMenu={item.hasMenu}>{item.label}</NavLink>
                )}
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
      {open?.menu && <NavDropdown id={dropdownId(open.label)} className="nds-nav__dropdown" {...open.menu} />}
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
  /** Documentation only: start on this item's Submenu level. */
  initialLevel?: string;
}

/**
 * Figma: Mobile Menu (Level = Main / Submenu). A modal <dialog>: focus is trapped and Escape closes it.
 * Items with a menu open a Submenu level; Back returns to Main and refocuses the item that opened it.
 */
export function MobileMenu({ open, onClose, items = DEFAULT_NAV_ITEMS, accountItems = DEFAULT_ACCOUNT_ITEMS, bagCount, inline, initialLevel }: MobileMenuProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [level, setLevel] = useState<string | null>(initialLevel ?? null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const backRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<string | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || inline) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) setLevel(null);
  }, [open, inline]);

  // Move focus when changing level: into the submenu (Back), or back to the item that opened it.
  useEffect(() => {
    if (level) backRef.current?.focus();
    else if (returnTo.current) {
      itemRefs.current[returnTo.current]?.focus();
      returnTo.current = null;
    }
  }, [level]);

  const current = items.find((i) => i.label === level && i.menu);

  const main = (
    <>
      <div className="nds-mobile-menu__bar">
        <IconButton label="Close menu" icon={<CloseIcon />} onClick={onClose} />
        <Logo />
        <IconButton label="Bag" icon={<BagIcon />} count={bagCount} />
      </div>
      <nav className="nds-mobile-menu__list" aria-label="Main">
        {items.map((item) =>
          item.menu ? (
            <MenuItem
              key={item.label}
              hasSubmenu
              ref={(el) => { itemRefs.current[item.label] = el; }}
              onOpenSubmenu={() => { returnTo.current = item.label; setLevel(item.label); }}
            >
              {item.label}
            </MenuItem>
          ) : (
            <MenuItem key={item.label} href={item.href} active={item.active}>{item.label}</MenuItem>
          ),
        )}
      </nav>
      <nav className="nds-mobile-menu__list nds-mobile-menu__list--account" aria-label="Account">
        {accountItems.map((item) => (
          <MenuItem key={item.label} href={item.href}>{item.label}</MenuItem>
        ))}
      </nav>
    </>
  );

  const submenu = current?.menu && (
    <>
      <div className="nds-mobile-menu__bar">
        <IconButton ref={backRef} label="Back to menu" icon={<ChevronLeftIcon />} onClick={() => setLevel(null)} />
        <p className="nds-mobile-menu__title">{current.label}</p>
        <IconButton label="Close menu" icon={<CloseIcon />} onClick={onClose} />
      </div>
      <nav className="nds-mobile-menu__list" aria-label={current.label}>
        {current.menu.viewAll && <MenuItem href={current.menu.viewAll.href}>{current.menu.viewAll.label}</MenuItem>}
        {current.menu.groups.map((g) => (
          <div key={g.title} className="nds-mobile-menu__group">
            <p className="nds-nav-group__title nds-mobile-menu__group-title">{g.title}</p>
            {g.links.map((l) => <MenuItem key={l.href} href={l.href}>{l.label}</MenuItem>)}
          </div>
        ))}
      </nav>
    </>
  );

  const content = submenu || main;
  if (inline) return <div className="nds-mobile-menu nds-mobile-menu--inline" role="group" aria-label="Menu">{content}</div>;
  return (
    <dialog ref={ref} className="nds-mobile-menu" aria-label="Menu" onClose={onClose}>
      {content}
    </dialog>
  );
}
