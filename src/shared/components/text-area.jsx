'use client';

import { TextArea as AstryxTextArea } from '@astryxdesign/core/TextArea';

import { readonlyInputStyle } from './readonly-input-style.jsx';

/**
 * Thin `@astryxdesign/core/TextArea` passthrough — same reasoning and
 * shape as `text-input.jsx`, see its doc comment.
 * @param {import('react').ComponentProps<typeof AstryxTextArea>} props
 */
export function TextArea({ isReadOnly, xstyle, ...props }) {
  return (
    <AstryxTextArea
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
