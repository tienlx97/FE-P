'use client';

import { Selector } from '@astryxdesign/core/Selector';

import { useMaritimeFieldFocus } from './use-field-focus.js';

/** @param {import('react').ComponentProps<typeof Selector>} props */
export function MaritimeSelector({
  isDisabled,
  style,
  onFocus,
  onBlur,
  ...props
}) {
  const focusProps = useMaritimeFieldFocus({
    isDisabled,
    style,
    onFocus,
    onBlur,
  });

  return <Selector {...props} isDisabled={isDisabled} {...focusProps} />;
}
