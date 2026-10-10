'use client';

import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { VStack } from '@astryxdesign/core/VStack';
import { RotateCcw } from 'lucide-react';

import { FormattedNumberTextInput } from '@/shared/components/formatted-number-text-input.jsx';

import { formatVnd } from '../config/money.js';

/**
 * A value the system computes but the user may type over (e.g. round
 * 123,456.78 to 123,457). Empty shows the computed value as placeholder and
 * sends null; a typed value is stored as is. "Tự tính lại" clears it.
 * @param {{
 *   label: string,
 *   computed: number | undefined,
 *   typed: number | undefined,
 *   onChange: (typed: number | undefined) => void,
 *   isDisabled?: boolean,
 *   status?: { type: 'error' | 'warning' | 'success', message?: string },
 * }} props
 */
export function TypedValueInput({
  label,
  computed,
  typed,
  onChange,
  isDisabled = false,
  status,
}) {
  const isTyped = typed !== undefined;
  return (
    <VStack gap={1} hAlign="stretch">
      <FormattedNumberTextInput
        label={label}
        value={typed}
        onChange={onChange}
        units="VND"
        placeholder={formatVnd(computed)}
        description={
          isTyped
            ? `Đã sửa tay · tự tính: ${formatVnd(computed)}`
            : 'Tự tính — gõ để sửa'
        }
        isDisabled={isDisabled}
        status={status}
      />
      {isTyped && !isDisabled ? (
        <HStack>
          <Button
            label="Tự tính lại"
            size="sm"
            icon={<Icon icon={RotateCcw} size="sm" />}
            variant="ghost"
            onClick={() => onChange(undefined)}
          />
        </HStack>
      ) : null}
    </VStack>
  );
}
