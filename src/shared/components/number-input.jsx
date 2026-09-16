'use client';

import { NumberInput as AstryxNumberInput } from '@astryxdesign/core/NumberInput';

import { readonlyInputStyle } from './readonly-input-style.jsx';

/**
 * Thin `@astryxdesign/core/NumberInput` passthrough — same reasoning and
 * shape as `text-input.jsx`, see its doc comment.
 * @param {import('react').ComponentProps<typeof AstryxNumberInput>} props
 */
export function NumberInput({ isReadOnly, xstyle, ...props }) {
  return (
    <AstryxNumberInput
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
