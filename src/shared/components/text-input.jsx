'use client';

import { TextInput as AstryxTextInput } from '@astryxdesign/core/TextInput';
import { useState } from 'react';

import { readonlyInputStyle } from './readonly-input-style.jsx';

/**
 * Thin `@astryxdesign/core/TextInput` passthrough that adds the read-only
 * muted background directly (`isReadOnly` is native here, unlike Selector/
 * DateInput/CheckboxList, which need `ReadOnlyLock`'s clone-based `xstyle`
 * merge instead) — see `readonly-input-style.jsx`'s doc comment for why
 * this can't be left to `theme.js`'s `'text-input': { readonly: {...} }`
 * override, which renders as plain white in a production build. Every
 * prop passes through unchanged; only `isReadOnly` additionally merges
 * `readonlyInputStyle.tinted` into `xstyle`, so existing call sites need no
 * changes beyond their import — same "swap the import, not the call site"
 * shape as `number-input.jsx`/`text-area.jsx`.
 * @param {import('react').ComponentProps<typeof AstryxTextInput>} props
 */
export function TextInput({
  isReadOnly,
  isDisabled,
  xstyle,
  style,
  onFocus,
  onBlur,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const showFocusRing = isFocused && !isReadOnly && !isDisabled;

  return (
    <AstryxTextInput
      isReadOnly={isReadOnly}
      isDisabled={isDisabled}
      xstyle={[
        ...(Array.isArray(xstyle) ? xstyle : xstyle ? [xstyle] : []),
        isReadOnly && readonlyInputStyle.tinted,
      ]}
      // Astryx gives semantic status borders boosted specificity. An inline,
      // token-based focus ring keeps keyboard focus blue while allowing the
      // success/error border to return immediately on blur.
      style={showFocusRing ? { ...style, ...focusedStyle } : style}
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
      {...props}
    />
  );
}

const focusedStyle = {
  borderColor: 'var(--color-accent)',
  boxShadow: 'inset 0 0 0 var(--border-width) var(--color-accent)',
};
