'use client';

import { DateInput } from '@astryxdesign/core/DateInput';

import { useMaritimeFieldFocus } from './use-field-focus.js';

/** @param {import('react').ComponentProps<typeof DateInput>} props */
export function MaritimeDateInput({
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

  return <DateInput {...props} isDisabled={isDisabled} {...focusProps} />;
}
