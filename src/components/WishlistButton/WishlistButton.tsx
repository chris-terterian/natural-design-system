import { useState, type ButtonHTMLAttributes } from 'react';
import { HeartIcon } from '../../icons';
import './WishlistButton.css';

export type WishlistForcedState = 'hover' | 'pressed' | 'focus';

export interface WishlistButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'children'> {
  /** Figma: Selected. Omit for uncontrolled use. */
  selected?: boolean;
  defaultSelected?: boolean;
  onChange?: (selected: boolean) => void;
  /** Used in the accessible name, e.g. "Add Gold Hoops to wishlist". */
  productName?: string;
  forceState?: WishlistForcedState;
}

/** Figma: Wishlist Button — an aria-pressed toggle. */
export function WishlistButton({ selected, defaultSelected = false, onChange, productName, forceState, className, ...rest }: WishlistButtonProps) {
  const [inner, setInner] = useState(defaultSelected);
  const isSelected = selected ?? inner;
  const target = productName ? `${productName} ` : '';
  return (
    <button
      type="button"
      className={['nds-wishlist', className].filter(Boolean).join(' ')}
      aria-pressed={isSelected}
      aria-label={isSelected ? `Remove ${target}from wishlist` : `Add ${target}to wishlist`}
      data-state={forceState}
      onClick={() => {
        setInner(!isSelected);
        onChange?.(!isSelected);
      }}
      {...rest}
    >
      <HeartIcon filled={isSelected} />
    </button>
  );
}
