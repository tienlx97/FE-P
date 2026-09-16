'use client';

import { TextInput as AstryxTextInput } from '@astryxdesign/core/TextInput';

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
export function TextInput({ isReadOnly, xstyle, ...props }) {
  return (
    <AstryxTextInput
      isReadOnly={isReadOnly}
      xstyle={
        isReadOnly
          ? [
              ...(Array.isArray(xstyle) ? xstyle : xstyle ? [xstyle] : []),
              readonlyInputStyle.tinted,
            ]
          : xstyle
      }
      {...props}
    />
  );
}
