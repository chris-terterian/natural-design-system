import { useEffect, useId, useRef } from 'react';
import { Button } from '../Button/Button';
import { CartLine, type CartLineProps } from '../CartLine/CartLine';
import { IconButton } from '../Navigation/Navigation';
import { TextButton } from '../TextButton/TextButton';
import { CloseIcon } from '../../icons';
import './CartDrawer.css';

export interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Figma: the Cart Lines in the drawer. */
  lines: CartLineProps[];
  /** Figma: Subtotal, already formatted ("$516"). */
  subtotal: string;
  /** Figma: Title. Defaults to "Your bag ({count})". */
  title?: string;
  note?: string;
  onCheckout?: () => void;
  /** Docs only: render in place instead of as a modal. */
  inline?: boolean;
}

/**
 * Figma: Cart Drawer. The bag as a sidebar from the right, 480 wide (full width on phones), over a
 * backdrop. A native modal <dialog>: focus stays inside while it's open, Escape, Close, Continue
 * shopping or a click on the backdrop close it, and focus returns to the Bag button.
 */
export function CartDrawer({ open, onClose, lines, subtotal, title, note = 'Shipping and taxes calculated at checkout.', onCheckout, inline }: CartDrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || inline) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open, inline]);

  const content = (
    <div className="nds-drawer__panel">
      <div className="nds-drawer__header">
        <h2 id={titleId} className="nds-drawer__title">{title ?? `Your bag (${lines.length})`}</h2>
        <IconButton label="Close bag" icon={<CloseIcon />} onClick={onClose} />
      </div>
      {lines.length ? (
        <ul className="nds-drawer__lines" aria-label="Items in your bag">
          {lines.map((l) => <CartLine key={l.href} {...l} />)}
        </ul>
      ) : (
        <p className="nds-drawer__empty">Your bag is empty.</p>
      )}
      <div className="nds-drawer__summary">
        <p className="nds-drawer__subtotal"><span>Subtotal</span><span>{subtotal}</span></p>
        <p className="nds-drawer__note">{note}</p>
        <Button fullWidth onClick={onCheckout} disabled={!lines.length}>Check out</Button>
        <div className="nds-drawer__continue"><TextButton onClick={onClose}>Continue shopping</TextButton></div>
      </div>
    </div>
  );

  if (inline) return <div className="nds-drawer nds-drawer--inline" role="region" aria-labelledby={titleId}>{content}</div>;
  return (
    <dialog
      ref={ref}
      className="nds-drawer"
      aria-labelledby={titleId}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {content}
    </dialog>
  );
}
