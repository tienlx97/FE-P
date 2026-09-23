'use client';

import { useState } from 'react';

const focusedStyle = {
  borderColor: 'var(--color-accent)',
  boxShadow: 'inset 0 0 0 var(--border-width) var(--color-accent)',
};

/**
 * Keeps Astryx form controls on the Maritime solid-blue focus treatment.
 * The inline token values intentionally win Astryx's boosted status selectors;
 * the semantic status border returns as soon as focus leaves the control.
 * @param {{
 *   isDisabled?: boolean,
 *   style?: import('react').CSSProperties,
 *   onFocus?: (event: any) => void,
 *   onBlur?: (event: any) => void,
 * }} options
 */
export function useMaritimeFieldFocus({ isDisabled, style, onFocus, onBlur }) {
  const [isFocused, setIsFocused] = useState(false);

  return {
    style: isFocused && !isDisabled ? { ...style, ...focusedStyle } : style,
    /** @param {any} event */
    onFocus(event) {
      setIsFocused(true);
      onFocus?.(event);
    },
    /** @param {any} event */
    onBlur(event) {
      setIsFocused(false);
      onBlur?.(event);
    },
  };
}
