'use client';

import { DateTimeInput } from '@astryxdesign/core/DateTimeInput';

import { useMaritimeFieldFocus } from './use-field-focus.js';

/** @param {import('react').ComponentProps<typeof DateTimeInput>} props */
export function MaritimeDateTimeInput({
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

  return <DateTimeInput {...props} isDisabled={isDisabled} {...focusProps} />;
}
