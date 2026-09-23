'use client';

import { NumberInput } from '@/shared/components/number-input.jsx';

import { useMaritimeFieldFocus } from './use-field-focus.js';

/** @param {import('react').ComponentProps<typeof NumberInput>} props */
export function MaritimeNumberInput({
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

  return <NumberInput {...props} isDisabled={isDisabled} {...focusProps} />;
}
